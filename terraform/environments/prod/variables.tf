variable "project" {
  type    = string
  default = "nearbynearby"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "aws_account_id" {
  type        = string
  description = "AWS account ID"
}

# Existing S3 + CloudFront (not managed by Terraform)
variable "s3_bucket_name" {
  type        = string
  description = "Existing S3 bucket name for images"
}

variable "cloudfront_domain" {
  type        = string
  description = "Existing CloudFront distribution domain"
}

# Secrets (passed to SSM Parameter Store)
variable "database_url" {
  type      = string
  sensitive = true
  description = "Full PostgreSQL connection string for main role"
}

variable "forms_database_url" {
  type      = string
  sensitive = true
  description = "PostgreSQL connection string for forms role"
}

variable "secret_key" {
  type      = string
  sensitive = true
  description = "JWT signing secret key"
}

# Container images (defaults to placeholder, overridden after first push)
variable "app_image" {
  type    = string
  default = ""
  description = "nearby-app ECR image URI (leave empty for initial plan)"
}

variable "admin_backend_image" {
  type    = string
  default = ""
  description = "nearby-admin backend ECR image URI"
}

variable "admin_frontend_image" {
  type    = string
  default = ""
  description = "nearby-admin frontend ECR image URI"
}
