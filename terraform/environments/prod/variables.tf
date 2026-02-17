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

# VPC Peering (ECS VPC → default VPC where existing RDS lives)
variable "default_vpc_id" {
  type        = string
  description = "Default VPC ID where existing RDS is located"
}

variable "default_vpc_cidr" {
  type        = string
  default     = "172.31.0.0/16"
  description = "CIDR block of the default VPC"
}

variable "default_vpc_route_table_id" {
  type        = string
  description = "Main route table ID of the default VPC"
}

variable "rds_security_group_id" {
  type        = string
  description = "Security group ID of the existing RDS instance"
}

variable "rds_subnet_route_table_id" {
  type        = string
  description = "Route table ID used by the RDS subnets in the default VPC"
}
