resource "aws_ssm_parameter" "database_url" {
  name        = "/${var.project}/${var.environment}/database-url"
  description = "PostgreSQL connection string"
  type        = "SecureString"
  value       = var.database_url

  tags = { Name = "${var.project}-${var.environment}-database-url" }

  lifecycle { ignore_changes = [value] }
}

resource "aws_ssm_parameter" "forms_database_url" {
  name        = "/${var.project}/${var.environment}/forms-database-url"
  description = "PostgreSQL connection string for forms (isolated role)"
  type        = "SecureString"
  value       = var.forms_database_url

  tags = { Name = "${var.project}-${var.environment}-forms-database-url" }

  lifecycle { ignore_changes = [value] }
}

resource "aws_ssm_parameter" "secret_key" {
  name        = "/${var.project}/${var.environment}/secret-key"
  description = "Application secret key for JWT signing"
  type        = "SecureString"
  value       = var.secret_key

  tags = { Name = "${var.project}-${var.environment}-secret-key" }

  lifecycle { ignore_changes = [value] }
}
