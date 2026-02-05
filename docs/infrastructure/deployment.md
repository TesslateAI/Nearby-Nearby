# Deployment

## Overview

The platform uses different deployment strategies for each application:
- **nearby-admin**: Docker Compose on EC2
- **nearby-app**: GitHub Actions CI/CD to AWS ECS

---

## nearby-admin Deployment

### Production Docker Compose

```bash
# On production server
cd /home/ubuntu/nearby-admin

# Full rebuild
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up --build -d

# Restart only (no code changes)
docker compose -f docker-compose.prod.yml restart

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Production Environment

```bash
# /home/ubuntu/nearby-admin/.env

# Security
SECRET_KEY=<32-character-secret>
ENVIRONMENT=production
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database (RDS)
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/nearbynearby

# CORS
ALLOWED_ORIGINS=https://admin.nearbynearby.com
ALLOWED_HOSTS=admin.nearbynearby.com

# Storage
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=nearby-images
AWS_S3_ENDPOINT_URL=http://minio:9000
```

### Nginx Reverse Proxy (Optional)

```nginx
# /etc/nginx/sites-available/nearby-admin

server {
    listen 80;
    server_name admin.nearbynearby.com;

    location / {
        proxy_pass http://localhost:5175;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## nearby-app Deployment

### CI/CD Pipeline

The `.github/workflows/deploy.yml` automates deployment to AWS ECS.

```yaml
# nearby-app/.github/workflows/deploy.yml

name: Deploy to AWS ECS

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

concurrency:
  group: deploy-main
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com/${{ secrets.ECR_REPOSITORY }}:latest
            ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com/${{ secrets.ECR_REPOSITORY }}:${{ github.sha }}
          cache-from: type=registry,ref=${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com/${{ secrets.ECR_REPOSITORY }}:buildcache
          cache-to: type=registry,ref=${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com/${{ secrets.ECR_REPOSITORY }}:buildcache,mode=max

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster ${{ secrets.ECS_CLUSTER }} \
            --service ${{ secrets.ECS_SERVICE }} \
            --force-new-deployment
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_REGION` | AWS region (e.g., us-east-1) |
| `AWS_ACCOUNT_ID` | 12-digit AWS account ID |
| `AWS_ROLE_TO_ASSUME` | IAM role ARN for OIDC auth |
| `ECR_REPOSITORY` | ECR repository name |
| `ECS_CLUSTER` | ECS cluster name |
| `ECS_SERVICE` | ECS service name |

### AWS OIDC Configuration

1. Create IAM Identity Provider for GitHub
2. Create IAM Role with trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:ORG/REPO:*"
        }
      }
    }
  ]
}
```

3. Attach policies for ECR and ECS access

---

## Manual Deployment (nearby-app)

### Using rebuild.sh

```bash
# nearby-app/rebuild.sh

#!/bin/bash

# Stop existing container
docker stop nearby-app 2>/dev/null
docker rm nearby-app 2>/dev/null

# Build new image
docker build -t nearby-app:latest .

# Create network if not exists
docker network create nearby-admin_default 2>/dev/null

# Run container
docker run -d --name nearby-app \
  -p 8002:8000 \
  --network nearby-admin_default \
  -e DATABASE_URL="postgresql://user:pass@rds-endpoint:5432/nearbynearby" \
  -e SECRET_KEY="your-secret-key" \
  -e ENVIRONMENT="production" \
  -e ALLOWED_ORIGINS="https://nearbynearby.com" \
  nearby-app:latest

# Show status
docker ps | grep nearby-app
echo ""
echo "Logs:"
docker logs nearby-app --tail 20
```

### Usage

```bash
cd /home/ubuntu/nearby-app
./rebuild.sh
```

---

## AWS Infrastructure

### ECS Task Definition

```json
{
  "family": "nearby-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "nearby-app",
      "image": "ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/nearby-app:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "ENVIRONMENT", "value": "production"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "SECRET_KEY", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/nearby-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### RDS Configuration

- Engine: PostgreSQL 15
- Instance: db.t3.micro (development) / db.t3.small (production)
- Storage: 20GB gp2
- Extensions: PostGIS enabled
- Security Group: Allow 5432 from ECS security group

---

## Rollback Procedures

### nearby-admin

```bash
# Rollback to previous image
docker compose -f docker-compose.prod.yml down
git checkout HEAD~1
docker compose -f docker-compose.prod.yml up --build -d
```

### nearby-app (ECS)

```bash
# List recent task definitions
aws ecs list-task-definitions --family-prefix nearby-app --sort DESC

# Update service to previous revision
aws ecs update-service \
  --cluster nearby-cluster \
  --service nearby-app \
  --task-definition nearby-app:PREVIOUS_REVISION
```

---

## Monitoring

### Docker Logs

```bash
# nearby-admin
docker compose -f docker-compose.prod.yml logs -f

# nearby-app
docker logs -f nearby-app
```

### AWS CloudWatch

```bash
# View ECS logs
aws logs get-log-events \
  --log-group-name /ecs/nearby-app \
  --log-stream-name ecs/nearby-app/TASK_ID
```

### Health Checks

```bash
# Check nearby-admin
curl http://localhost:8001/health

# Check nearby-app
curl http://localhost:8002/health
```

---

## Environment-Specific Settings

### Development

```bash
ENVIRONMENT=development
DEBUG=true
DATABASE_URL=postgresql://nearby:nearby@db:5432/nearbynearby
ALLOWED_ORIGINS=http://localhost:5175,http://localhost:8002
```

### Production

```bash
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/nearbynearby
ALLOWED_ORIGINS=https://admin.nearbynearby.com,https://nearbynearby.com
```

---

## Deployment Checklist

### Before Deployment

- [ ] All tests pass locally
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Secrets stored securely
- [ ] Backup created if modifying data

### After Deployment

- [ ] Health check passes
- [ ] Key features tested
- [ ] Logs checked for errors
- [ ] Performance verified
- [ ] Rollback plan ready

---

## Best Practices

1. **Use CI/CD** - Automate deployments
2. **Zero-downtime deploys** - Use rolling updates
3. **Store secrets securely** - Use AWS Secrets Manager
4. **Monitor after deploy** - Watch logs for errors
5. **Have rollback plan** - Know how to revert
6. **Test in staging** - Deploy to staging first
7. **Document changes** - Track what's deployed
