terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  ecr_base = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}

# --- Networking ---
module "networking" {
  source      = "../../modules/networking"
  project     = var.project
  environment = var.environment
}

# --- ECR Repositories ---
module "ecr" {
  source = "../../modules/ecr"
}

# --- S3 IAM Policy for existing bucket ---
resource "aws_iam_policy" "s3_access" {
  name        = "${var.project}-${var.environment}-s3-access"
  description = "Allow ECS tasks to read/write existing S3 images bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/*"
        ]
      }
    ]
  })
}

# --- Secrets (SSM Parameter Store) ---
module "secrets" {
  source = "../../modules/secrets"

  project     = var.project
  environment = var.environment

  database_url       = var.database_url
  forms_database_url = var.forms_database_url
  secret_key         = var.secret_key
}

# --- Monitoring (CloudWatch) ---
module "monitoring" {
  source      = "../../modules/monitoring"
  project     = var.project
  environment = var.environment
}

# --- ALB ---
module "alb" {
  source = "../../modules/alb"

  project               = var.project
  environment           = var.environment
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  alb_security_group_id = module.networking.alb_security_group_id
}

# --- ECS ---
module "ecs" {
  source = "../../modules/ecs"

  project        = var.project
  environment    = var.environment
  aws_region     = var.aws_region
  aws_account_id = var.aws_account_id

  # Networking
  private_subnet_ids    = module.networking.private_subnet_ids
  ecs_security_group_id = module.networking.ecs_security_group_id

  # ALB target groups
  app_target_group_arn   = module.alb.app_target_group_arn
  admin_target_group_arn = module.alb.admin_target_group_arn

  # Container images (use ECR repo URLs directly)
  app_image            = "${local.ecr_base}/nearbynearby/nearby-app:latest"
  admin_backend_image  = "${local.ecr_base}/nearbynearby/nearby-admin-backend:latest"
  admin_frontend_image = "${local.ecr_base}/nearbynearby/nearby-admin-frontend:latest"

  # Existing S3 & CloudFront (not managed by Terraform)
  s3_bucket_name       = var.s3_bucket_name
  cloudfront_domain    = var.cloudfront_domain
  s3_access_policy_arn = aws_iam_policy.s3_access.arn

  # SSM Parameter ARNs
  ssm_database_url_arn       = module.secrets.database_url_arn
  ssm_forms_database_url_arn = module.secrets.forms_database_url_arn
  ssm_secret_key_arn         = module.secrets.secret_key_arn

  # CloudWatch
  app_log_group_name   = module.monitoring.app_log_group_name
  admin_log_group_name = module.monitoring.admin_log_group_name

  # GitHub Actions OIDC (provider already exists in this account)
  create_github_oidc       = false
  github_oidc_provider_arn = "arn:aws:iam::487615743990:oidc-provider/token.actions.githubusercontent.com"
  ecr_repository_arns      = values(module.ecr.repository_arns)
}
