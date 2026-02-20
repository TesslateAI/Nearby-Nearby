# Deployment

## Overview

The NearbyNearby platform runs on **AWS ECS Fargate** with all new infrastructure managed by **Terraform**. Both applications deploy automatically via GitHub Actions CI/CD on pushes to `main`.

### Architecture Diagram

```
                    Internet
                       |
                  [Cloudflare]  (SSL termination, DNS, WAF)
                       |         SSL mode: Flexible
              ┌────────┴────────┐
     nearbynearby.com    admin.nearbynearby.com
     (CNAME → ALB DNS,   (CNAME → ALB DNS,
      proxied)            proxied)
              └────────┬────────┘
                  [ALB port 80]  (host-based routing)
              ┌────────┴────────┐
     ECS Fargate            ECS Fargate
     nearby-app             nearby-admin
     (1 container:          (2 containers in 1 task:
      FastAPI+React+ML)      nginx + FastAPI backend
     1 vCPU / 3GB           sharing localhost)
     Auto-scale: 1-3       0.5 vCPU / 1GB
                            Auto-scale: 1-2
              └────────┬────────┘
                       |
              [VPC Peering: 10.0.0.0/16 ↔ 172.31.0.0/16]
                       |
              [RDS PostgreSQL 15 + PostGIS]  (existing, in default VPC)
              [S3 + CloudFront for images]   (existing)
```

### Key Design Decisions

- **Cloudflare SSL mode is Flexible**: Cloudflare handles HTTPS termination. ALB listens on HTTP port 80 only. No ACM certificates needed.
- **VPC peering**: ECS tasks run in a new VPC (`10.0.0.0/16`). The existing RDS lives in the default VPC (`172.31.0.0/16`). A VPC peering connection bridges them.
- **S3 auth is IAM role-based**: ECS tasks use their IAM task role to access S3. No access keys are needed or injected.
- **Single NAT Gateway**: Cost savings over per-AZ NAT. Acceptable for this workload.

---

## Existing Resources (NOT Managed by Terraform)

These resources pre-date the Terraform infrastructure and are **not** created or managed by Terraform:

| Resource | Details |
|----------|---------|
| **RDS PostgreSQL** | Existing instance in the default VPC (`172.31.0.0/16`) |
| **S3 Bucket** | `nearbynearby-prod-images` |
| **CloudFront Distribution** | `d24ow80agebvkk.cloudfront.net` |

The prod `main.tf` contains VPC peering, route table entries, RDS security group rules, and S3 IAM policies to integrate these existing resources with the new ECS infrastructure.

---

## Terraform Infrastructure

All AWS resources are defined in `terraform/` at the monorepo root.

### Directory Structure

```
terraform/
├── bootstrap/main.tf              # S3 state bucket + DynamoDB lock
├── environments/prod/
│   ├── main.tf                    # Modules + VPC peering + S3 IAM policy
│   ├── variables.tf
│   ├── terraform.tfvars           # Non-sensitive values only
│   ├── backend.tf                 # S3 remote state
│   └── outputs.tf
└── modules/
    ├── networking/                 # VPC, subnets, NAT, security groups
    ├── ecr/                        # 3 ECR repos with lifecycle (keep 5)
    ├── ecs/                        # Cluster, task defs, services, auto-scaling, IAM, OIDC
    ├── alb/                        # ALB, target groups, host-based routing
    ├── secrets/                    # SSM Parameter Store (SecureString)
    └── monitoring/                 # CloudWatch log groups (14-day retention)
```

> **NOTE:** `database/` and `storage/` modules exist in the codebase but are **NOT used** in the prod `main.tf`. We use the existing RDS and S3 resources instead.

### Prod Environment main.tf

In addition to composing the modules listed above, the prod `main.tf` also contains:

- **VPC peering connection** (`ecs_to_default`) with DNS resolution enabled
- **Routes** in both VPC route tables + RDS subnet route table to enable cross-VPC traffic
- **Security group rule** allowing inbound port `5432` from `10.0.0.0/16` on the existing RDS security group
- **S3 IAM policy** granting the ECS task role access to the existing `nearbynearby-prod-images` bucket

### Modules

#### Networking (`terraform/modules/networking/`)

- **VPC**: `10.0.0.0/16` in `us-east-1`
- **Public subnets**: `10.0.1.0/24` (1a), `10.0.2.0/24` (1b) -- ALB
- **Private subnets**: `10.0.10.0/24` (1a), `10.0.11.0/24` (1b) -- ECS tasks
- **Single NAT Gateway** in 1a (cost savings vs per-AZ)
- **Security groups**:
  - ALB SG: inbound 80 from `0.0.0.0/0`
  - ECS SG: all traffic from ALB SG only

#### ECR (`terraform/modules/ecr/`)

Three repositories with lifecycle policy (keep last 5 images):

- `nearbynearby/nearby-app`
- `nearbynearby/nearby-admin-backend`
- `nearbynearby/nearby-admin-frontend`

#### ECS (`terraform/modules/ecs/`)

**nearby-app service:**

| Setting | Value |
|---------|-------|
| CPU | 1 vCPU |
| Memory | 3072 MB (3 GB) |
| Containers | 1 (FastAPI serving API + pre-built React frontend + ML model) |
| Health check | `/api/health` with 120s start period (ML model loading) |
| Auto-scaling | 1-3 tasks (CPU 70%, memory 80%) |

**nearby-admin service:**

| Setting | Value |
|---------|-------|
| CPU | 0.5 vCPU |
| Memory | 1024 MB (1 GB) |
| Containers | 2 in 1 task (nginx + backend sharing localhost via `awsvpc`) |
| Health check | `/api/health` with 60s start period |
| Auto-scaling | 1-2 tasks |

The admin task definition runs two containers:
- `nginx`: frontend image, port 5173, depends on backend being healthy
- `backend`: backend image, port 8000, runs `alembic upgrade heads && uvicorn`

**IAM roles:**
- **Task execution role**: Pull ECR images, read SSM parameters, write CloudWatch logs
- **Task role**: S3 read/write for image management (no access keys needed)
- **GitHub Actions role**: Push to ECR, update ECS services (OIDC federation)

#### ALB (`terraform/modules/alb/`)

- HTTP listener on port 80 (Cloudflare terminates SSL upstream)
- Host-based routing:
  - Default rule --> nearby-app target group (port 8000)
  - `admin.nearbynearby.com` --> nearby-admin target group (port 5173)
- Health checks: `/api/health` for both target groups

#### Secrets (`terraform/modules/secrets/`)

SSM Parameter Store (SecureString):

| Parameter | Description |
|-----------|-------------|
| `/nearbynearby/prod/database-url` | Primary database connection string |
| `/nearbynearby/prod/forms-database-url` | Forms-only database connection string |
| `/nearbynearby/prod/secret-key` | JWT/session secret key |

Terraform creates the parameters with placeholder values and ignores subsequent value changes. Set real values via AWS CLI (see Initial Setup below).

#### Monitoring (`terraform/modules/monitoring/`)

CloudWatch log groups with 14-day retention:

- `/ecs/nearbynearby-prod/app`
- `/ecs/nearbynearby-prod/admin`

### Terraform Outputs

```bash
cd terraform/environments/prod
terraform output
```

| Output | Description |
|--------|-------------|
| `alb_dns_name` | ALB endpoint for Cloudflare CNAME records |
| `ecr_repository_urls` | Map of 3 ECR repository URLs |
| `ecs_cluster_name` | ECS cluster name |
| `app_service_name` | nearby-app ECS service name |
| `admin_service_name` | nearby-admin ECS service name |
| `github_actions_role_arn` | IAM role ARN for GitHub Actions OIDC |

---

## Initial Setup

### Prerequisites

- AWS account with admin access
- Terraform >= 1.5 installed
- AWS CLI configured with credentials
- GitHub repository: `TesslateAI/Nearby-Nearby`

### Step 1: Bootstrap State Backend

```bash
cd terraform/bootstrap
terraform init
terraform apply
```

This creates the S3 bucket and DynamoDB table for Terraform remote state.

### Step 2: Set Sensitive Variables

```bash
# Set as environment variables (never commit these)
export TF_VAR_db_username="postgres_admin"
export TF_VAR_db_password="<strong-password>"
export TF_VAR_database_url="postgresql://user:pass@<rds-endpoint>:5432/nearbynearby"
export TF_VAR_forms_database_url="postgresql://nearby_forms:pass@<rds-endpoint>:5432/nearbynearby"
export TF_VAR_secret_key="<32-char-secret>"
```

### Step 3: Apply Infrastructure

```bash
cd terraform/environments/prod
terraform init
terraform plan    # Review changes
terraform apply   # Create resources
```

### Step 4: Update SSM Parameter Values

After infrastructure is created, update SSM parameters with real connection strings:

```bash
aws ssm put-parameter \
  --name "/nearbynearby/prod/database-url" \
  --value "postgresql://user:pass@<rds-endpoint>:5432/nearbynearby" \
  --type SecureString \
  --overwrite

aws ssm put-parameter \
  --name "/nearbynearby/prod/forms-database-url" \
  --value "postgresql://nearby_forms:pass@<rds-endpoint>:5432/nearbynearby" \
  --type SecureString \
  --overwrite

aws ssm put-parameter \
  --name "/nearbynearby/prod/secret-key" \
  --value "<32-char-secret>" \
  --type SecureString \
  --overwrite
```

### Step 5: Configure GitHub Secret

Only **one** GitHub secret is needed:

| Secret | Value |
|--------|-------|
| `AWS_ROLE_TO_ASSUME` | ARN of the GitHub Actions IAM role (from Terraform output: `github_actions_role_arn`) |

All other values (region, cluster name, service name, ECR repos) are hardcoded in the workflow files -- they are not secrets.

### Step 6: Configure Cloudflare DNS

1. Create CNAME records pointing to the ALB DNS name (from Terraform output: `alb_dns_name`):

| Record | Type | Target | Proxy |
|--------|------|--------|-------|
| `nearbynearby.com` | CNAME | ALB DNS name | Proxied (orange cloud) |
| `admin.nearbynearby.com` | CNAME | ALB DNS name | Proxied (orange cloud) |

2. Set SSL/TLS mode to **Flexible** (Cloudflare handles HTTPS, ALB listens on HTTP 80).

### Step 7: Initial Database Setup

```bash
# Alembic migrations run automatically on admin container start.
# Create admin users via ECS exec:
aws ecs execute-command \
  --cluster nearbynearby-prod \
  --task <task-id> \
  --container backend \
  --interactive \
  --command "python scripts/manage_users.py create admin@nearby.com password123 --role admin"
```

---

## CI/CD Pipelines

### nearby-app (`deploy-app.yml`)

**Trigger**: Push to `main` with changes in `nearby-app/**` or `shared/**`

```
Push to main
    |
    v
Run integration tests (~12 min)
  - PostGIS service container
  - pytest tests/ -v --tb=short -x
    |
    v
Build Docker image (~8 min)
  - Build context: monorepo root (.)
  - Dockerfile: nearby-app/Dockerfile
    |
    v
Push to ECR → Force new ECS deployment
```

**Total time: ~20 minutes**

**Manual dispatch option:** The workflow supports `workflow_dispatch` with a checkbox **"Skip integration tests"** (`skip_tests`). This is intended for hotfixes only. Push-triggered deploys always run tests.

### nearby-admin (`deploy-admin.yml`)

**Trigger**: Push to `main` with changes in `nearby-admin/**` or `shared/**`

```
Push to main
    |
    v
Build backend image + Build frontend image (parallel)
  - Backend context: monorepo root (.), file: nearby-admin/backend/Dockerfile.ecs
  - Frontend context: nearby-admin/frontend, file: nearby-admin/frontend/Dockerfile.prod
    |
    v
Push both to ECR → Force new ECS deployment
```

**Total time: ~2 minutes** (no test job)

Both workflows use Docker Buildx with registry-based layer caching.

### CI/CD Timing Summary

| Pipeline | Tests | Build + Deploy | Total |
|----------|-------|----------------|-------|
| nearby-app | ~12 min | ~8 min | ~20 min |
| nearby-admin | None | ~2 min | ~2 min |

### AWS OIDC Configuration

Terraform automatically creates:

1. **IAM OIDC Identity Provider** for `token.actions.githubusercontent.com`
2. **IAM Role** with trust policy scoped to `repo:TesslateAI/Nearby-Nearby:*`
3. **Permissions**: ECR push, ECS update-service

GitHub Actions authenticates via OIDC federation -- no static AWS credentials are stored in GitHub.

---

## Environment Variables

### ECS Task Environment (Injected via Terraform)

| Variable | Source | Service |
|----------|--------|---------|
| `DATABASE_URL` | SSM Parameter Store | Both |
| `FORMS_DATABASE_URL` | SSM Parameter Store | nearby-app |
| `SECRET_KEY` | SSM Parameter Store | Both |
| `ENVIRONMENT` | Task definition | Both |
| `PYTHONPATH` | Task definition | Both |
| `AWS_S3_BUCKET` | Task definition | Both |
| `AWS_REGION` | Task definition | Both |
| `CLOUDFRONT_DOMAIN` | Task definition | Both |
| `BACKEND_HOST` | Task definition | nearby-admin (nginx) |

S3 credentials are **not** needed -- ECS tasks use IAM role-based authentication via the task role.

---

## Health Checks

Both applications expose `/api/health` endpoints used by ECS and ALB for health monitoring. HTTP 200 means healthy; HTTP 503 means degraded.

### nearby-app

```json
{
  "status": "healthy",
  "service": "nearby-app",
  "database": "connected",
  "ml_model": "loaded"
}
```

Returns 503 with `"status": "degraded"` if database connection fails.

### nearby-admin

```json
{
  "status": "healthy",
  "service": "nearby-admin",
  "database": "connected"
}
```

Returns 503 with `"status": "degraded"` if database connection fails.

### ECS Health Check Configuration

| Service | Path | Start Period | Interval | Retries |
|---------|------|-------------|----------|---------|
| nearby-app | `/api/health` | 120s | 30s | 3 |
| nearby-admin | `/api/health` | 60s | 30s | 3 |

The start period gives containers time to initialize before health checks begin. The app needs 120s because the ML embedding model (~1GB) takes time to load.

---

## Deployment Flow

### How ECS Rolling Deployment Works

1. CI/CD pushes a new Docker image to ECR
2. CI/CD forces a new ECS deployment
3. ECS launches a new task with the new image
4. New task starts and begins its health check start period
5. Once the health check passes, ALB begins routing traffic to the new task
6. Old task enters draining mode (existing connections finish)
7. Old task is stopped

Traffic is never interrupted -- the new task must be healthy before the old one is removed.

---

## Rollback Procedures

### ECS Rollback

```bash
# List recent task definitions
aws ecs list-task-definitions \
  --family-prefix nearbynearby-prod-app \
  --sort DESC

# Update service to previous revision
aws ecs update-service \
  --cluster nearbynearby-prod \
  --service nearbynearby-prod-app \
  --task-definition nearbynearby-prod-app:PREVIOUS_REVISION

# Same for admin
aws ecs update-service \
  --cluster nearbynearby-prod \
  --service nearbynearby-prod-admin \
  --task-definition nearbynearby-prod-admin:PREVIOUS_REVISION
```

### Terraform Rollback

```bash
# Revert Terraform changes
cd terraform/environments/prod
git checkout HEAD~1 -- .
terraform plan    # Review what will change
terraform apply   # Apply previous state
```

---

## Monitoring

### CloudWatch Logs

```bash
# View nearby-app logs (follow mode)
aws logs tail /ecs/nearbynearby-prod/app --follow

# View nearby-admin logs (follow mode)
aws logs tail /ecs/nearbynearby-prod/admin --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /ecs/nearbynearby-prod/app \
  --filter-pattern "ERROR"
```

### ECS Service Status

```bash
# Check service status (running count, desired count, deployments, events)
aws ecs describe-services \
  --cluster nearbynearby-prod \
  --services nearbynearby-prod-app nearbynearby-prod-admin

# List running tasks
aws ecs list-tasks \
  --cluster nearbynearby-prod \
  --service-name nearbynearby-prod-app
```

---

## Cost Estimate

### Monthly Costs (New Infrastructure)

| Resource | Monthly Cost |
|----------|-------------|
| ECS Fargate (nearby-app: 1 vCPU / 3GB) | ~$73 |
| ECS Fargate (nearby-admin: 0.5 vCPU / 1GB) | ~$18 |
| NAT Gateway | ~$32 |
| Application Load Balancer | ~$16 |
| ECR Storage | ~$3 |
| CloudWatch Logs | ~$1 |
| **New infra subtotal** | **~$143/mo** |

### Total with Existing Resources

| Resource | Monthly Cost |
|----------|-------------|
| New infrastructure (above) | ~$143 |
| Existing RDS PostgreSQL | ~$13 |
| **Total** | **~$156/mo** |

---

## Data Migration (One-Time)

When migrating from the old EC2 setup to ECS:

1. **Database**: `pg_dump` from old RDS --> `pg_restore` to new RDS (if replacing)
2. **Create forms role**: `CREATE ROLE nearby_forms` with INSERT/SELECT on form tables
3. **Run migrations**: Happens automatically on admin container startup (`alembic upgrade heads`)
4. **Create admin users**: Via ECS exec (see Step 7 above)
5. **Push initial images**: First CI/CD push builds and deploys both apps
6. **Switch DNS**: Update Cloudflare CNAME records to new ALB
7. **Decommission**: Stop old EC2 instance

---

## Best Practices

- **Always push to `main` for deployment** -- CI/CD is automatic
- **Use `skip_tests` for hotfixes only** -- push-triggered deploys always run tests
- **Check CloudWatch logs after deployment** -- catch errors early
- **Health checks must pass** before ALB routes traffic to new tasks
- **ECS rolling deployment** ensures zero-downtime updates
- **Never commit secrets** -- use SSM Parameter Store for sensitive values
- **Test database migrations locally** before they run in production
- **Monitor resource usage** -- especially ML model memory in nearby-app

---

## Deployment Checklist

### Before Deployment

- [ ] All tests pass locally (`pytest tests/ -v`)
- [ ] Database migrations tested locally
- [ ] SSM parameters set with correct values
- [ ] Terraform plan shows expected changes (if infra changed)
- [ ] GitHub OIDC role configured

### After Deployment

- [ ] Health check passes: `curl http://<ALB-DNS>/api/health`
- [ ] Admin panel accessible at `admin.nearbynearby.com`
- [ ] User app accessible at `nearbynearby.com`
- [ ] Image uploads work (admin --> S3 --> CloudFront)
- [ ] Search works (keyword + semantic)
- [ ] CloudWatch logs show no errors
- [ ] Auto-scaling policies active
