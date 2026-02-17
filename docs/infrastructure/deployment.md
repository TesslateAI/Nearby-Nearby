# Deployment

## Overview

The platform runs on AWS ECS Fargate with all infrastructure managed by Terraform. Both applications deploy automatically via GitHub Actions CI/CD on pushes to `main`.

```
                    Internet
                       |
                  [Cloudflare]  (SSL termination, DNS, WAF)
                       |
              ┌────────┴────────┐
     nearbynearby.com    admin.nearbynearby.com
              └────────┬────────┘
                  [ALB port 80]  (host-based routing)
              ┌────────┴────────┐
     ECS Fargate            ECS Fargate
     nearby-app             nearby-admin
     (1 container:          (2 containers in 1 task:
      FastAPI+React+ML)      nginx + FastAPI backend)
     1 vCPU / 3GB           0.5 vCPU / 1GB
              └────────┬────────┘
              [RDS PostgreSQL 15 + PostGIS]
              [S3 + CloudFront for images]
```

**Estimated monthly cost: ~$165-175**

---

## Terraform Infrastructure

All AWS resources are defined in `terraform/` at the monorepo root. Terraform manages the complete infrastructure lifecycle.

### Directory Structure

```
terraform/
├── bootstrap/main.tf              # S3 state bucket + DynamoDB lock (apply first)
├── environments/prod/
│   ├── main.tf                    # Composes all modules
│   ├── variables.tf               # Variable definitions
│   ├── terraform.tfvars           # Non-sensitive defaults
│   ├── backend.tf                 # S3 remote state config
│   └── outputs.tf                 # ALB DNS, RDS endpoint, etc.
└── modules/
    ├── networking/                 # VPC, subnets, NAT, security groups
    ├── database/                   # RDS PostgreSQL 15 + PostGIS
    ├── storage/                    # S3 bucket, CloudFront, IAM policies
    ├── ecr/                        # 3 ECR repositories
    ├── ecs/                        # Cluster, task defs, services, auto-scaling, IAM
    ├── alb/                        # ALB, target groups, listener rules
    ├── secrets/                    # SSM Parameter Store entries
    └── monitoring/                 # CloudWatch log groups, alarms
```

### Modules

#### Networking (`terraform/modules/networking/`)

- **VPC**: `10.0.0.0/16` in us-east-1
- **Public subnets**: `10.0.1.0/24` (1a), `10.0.2.0/24` (1b) — ALB
- **Private subnets**: `10.0.10.0/24` (1a), `10.0.11.0/24` (1b) — ECS tasks
- **Database subnets**: `10.0.20.0/24` (1a), `10.0.21.0/24` (1b) — RDS
- **Single NAT Gateway** in 1a (cost savings vs per-AZ)
- **Security groups**:
  - ALB SG: inbound 80 from `0.0.0.0/0`
  - ECS SG: all traffic from ALB SG only
  - RDS SG: inbound 5432 from ECS SG only

#### Database (`terraform/modules/database/`)

- `db.t3.micro` (1 vCPU, 1GB RAM)
- PostgreSQL 15, gp3 storage (20GB, auto-scale to 100GB)
- Single AZ, 7-day backup retention
- Deletion protection enabled
- Private subnets only (no public access)
- Extensions enabled via app startup SQL: `pg_trgm`, `pgvector`, `postgis`

#### Storage (`terraform/modules/storage/`)

- S3 bucket with all public access blocked
- CloudFront distribution with Origin Access Control (OAC)
- S3 bucket policy restricts access to CloudFront only
- IAM policy for ECS task role: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`

#### ECR (`terraform/modules/ecr/`)

Three repositories with lifecycle policy (keep last 5 images):
- `nearbynearby/nearby-app`
- `nearbynearby/nearby-admin-backend`
- `nearbynearby/nearby-admin-frontend`

#### ECS (`terraform/modules/ecs/`)

**nearby-app service:**
- 1 vCPU, 3072 MB memory (ML model needs ~1GB)
- Single container: FastAPI serving API + pre-built React frontend
- Health check: `/api/health` (120s start period for ML model loading)
- Auto-scaling: 1-3 tasks (CPU 70%, memory 80%)
- Secrets injected from SSM Parameter Store

**nearby-admin service:**
- 0.5 vCPU, 1024 MB memory
- 2 containers in 1 task definition (share localhost via `awsvpc`):
  - `nginx`: frontend image, port 5173, depends on backend healthy
  - `backend`: backend image, port 8000, runs `alembic upgrade heads && uvicorn`
- Health check: `/api/health` (60s start period)
- Auto-scaling: 1-2 tasks

**IAM roles:**
- Task execution role: pull ECR, read SSM, write CloudWatch logs
- Task role: S3 read/write for image management
- GitHub Actions role: push ECR, update ECS (OIDC federation)

#### ALB (`terraform/modules/alb/`)

- HTTP listener on port 80 (Cloudflare terminates SSL)
- Host-based routing:
  - Default → nearby-app target group (port 8000)
  - `admin.nearbynearby.com` → nearby-admin target group (port 5173)
- Health checks: `/api/health` for both targets

#### Secrets (`terraform/modules/secrets/`)

SSM Parameter Store (SecureString):
- `/nearbynearby/prod/database-url`
- `/nearbynearby/prod/forms-database-url`
- `/nearbynearby/prod/secret-key`

Set values via AWS CLI or console — Terraform creates the parameters with placeholder values and ignores subsequent value changes.

#### Monitoring (`terraform/modules/monitoring/`)

- CloudWatch log groups: `/ecs/nearby-app`, `/ecs/nearby-admin` (14-day retention)
- Optional ALB 5xx error alarm

---

## Initial Setup

### Prerequisites

- AWS account with admin access
- Terraform >= 1.5 installed
- AWS CLI configured with credentials
- GitHub repository: `TesslateAI/NearbyNearby`

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

After RDS is created, update SSM parameters with real connection strings:

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

Only one GitHub secret is needed:

| Secret | Value |
|--------|-------|
| `AWS_ROLE_TO_ASSUME` | ARN of the GitHub Actions IAM role (from Terraform output: `github_actions_role_arn`) |

### Step 6: Configure Cloudflare DNS

1. Create CNAME records pointing to ALB DNS name (from Terraform output: `alb_dns_name`):
   - `nearbynearby.com` → ALB DNS (proxied)
   - `admin.nearbynearby.com` → ALB DNS (proxied)
2. Set SSL mode to "Full" (Cloudflare encrypts to ALB on port 80)

### Step 7: Initial Database Setup

```bash
# Run Alembic migrations (happens automatically on admin container start)
# Create admin users
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
Push to main → Run tests (PostGIS service) → Build Docker image → Push to ECR → Force ECS deployment
```

- Build context: monorepo root (`.`)
- Dockerfile: `nearby-app/Dockerfile`
- Test job runs `pytest tests/ -v --tb=short -x` against PostGIS service container
- Uses GitHub OIDC for AWS authentication (no static credentials)

### nearby-admin (`deploy-admin.yml`)

**Trigger**: Push to `main` with changes in `nearby-admin/**` or `shared/**`

```
Push to main → Build backend image → Build frontend image → Push both to ECR → Force ECS deployment
```

- Backend build context: monorepo root (`.`), file: `nearby-admin/backend/Dockerfile.ecs`
- Frontend build context: `nearby-admin/frontend`, file: `nearby-admin/frontend/Dockerfile.prod`
- Uses Docker Buildx with registry-based layer caching

### Required GitHub Secret

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_TO_ASSUME` | IAM role ARN for OIDC auth (Terraform creates this) |

All other values (region, cluster name, service name, ECR repos) are hardcoded in the workflow files — they're not secrets.

### AWS OIDC Configuration

Terraform automatically creates:
1. IAM OIDC Identity Provider for `token.actions.githubusercontent.com`
2. IAM Role with trust policy scoped to `repo:TesslateAI/NearbyNearby:*`
3. Permissions: ECR push, ECS update-service

---

## Health Checks

Both applications expose `/api/health` endpoints used by ECS and ALB for health monitoring.

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

---

## Rollback Procedures

### ECS Rollback

```bash
# List recent task definitions
aws ecs list-task-definitions --family-prefix nearbynearby-prod-app --sort DESC

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
# View nearby-app logs
aws logs tail /ecs/nearby-app --follow

# View nearby-admin logs
aws logs tail /ecs/nearby-admin --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /ecs/nearby-app \
  --filter-pattern "ERROR"
```

### ECS Service Status

```bash
# Check service status
aws ecs describe-services \
  --cluster nearbynearby-prod \
  --services nearbynearby-prod-app nearbynearby-prod-admin

# List running tasks
aws ecs list-tasks \
  --cluster nearbynearby-prod \
  --service-name nearbynearby-prod-app
```

### Terraform Outputs

```bash
cd terraform/environments/prod
terraform output

# Key outputs:
# alb_dns_name          - ALB endpoint for DNS configuration
# rds_endpoint          - Database connection endpoint
# cloudfront_domain     - CDN domain for images
# ecr_app_url           - ECR repository URL for nearby-app
# ecr_admin_backend_url - ECR repository URL for admin backend
# ecr_admin_frontend_url - ECR repository URL for admin frontend
# github_actions_role_arn - IAM role ARN for GitHub Actions
```

---

## Environment Variables

### ECS Task Environment (injected via Terraform)

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
| `BACKEND_HOST` | Task definition | nearby-admin nginx |

S3 credentials are **not** needed — ECS tasks use IAM role-based authentication via the task role.

### Local Development

See [Docker Configuration](./docker.md) for local development environment setup.

---

## Data Migration (One-Time)

When migrating from the old EC2 setup to ECS:

1. **Database**: `pg_dump` from old RDS → `pg_restore` to new RDS
2. **Create forms role**: `CREATE ROLE nearby_forms` with INSERT/SELECT on form tables
3. **Run migrations**: Happens automatically on admin container startup (`alembic upgrade heads`)
4. **Create admin users**: Via ECS exec (see Step 7 above)
5. **Push initial images**: First CI/CD push builds and deploys both apps
6. **Switch DNS**: Update Cloudflare CNAME records to new ALB
7. **Decommission**: Stop old EC2 instance and old RDS

---

## Deployment Checklist

### Before Deployment

- [ ] All tests pass (`pytest tests/ -v`)
- [ ] Database migrations tested locally
- [ ] SSM parameters set with correct values
- [ ] Terraform plan shows expected changes
- [ ] GitHub OIDC role configured

### After Deployment

- [ ] Health check passes: `curl http://<ALB-DNS>/api/health`
- [ ] Admin panel accessible at `admin.nearbynearby.com`
- [ ] User app accessible at `nearbynearby.com`
- [ ] Image uploads work (admin → S3 → CloudFront)
- [ ] Search works (keyword + semantic)
- [ ] CloudWatch logs show no errors
- [ ] Auto-scaling policies active

### After DNS Cutover

- [ ] Both domains resolve to ALB
- [ ] Cloudflare SSL mode is "Full"
- [ ] Old EC2 instance stopped
- [ ] Old RDS instance stopped (if replaced)
