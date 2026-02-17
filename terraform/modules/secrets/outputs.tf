output "database_url_arn" {
  value = aws_ssm_parameter.database_url.arn
}

output "forms_database_url_arn" {
  value = aws_ssm_parameter.forms_database_url.arn
}

output "secret_key_arn" {
  value = aws_ssm_parameter.secret_key.arn
}
