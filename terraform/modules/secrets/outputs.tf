output "database_url_arn" {
  value = aws_ssm_parameter.database_url.arn
}

output "forms_database_url_arn" {
  value = aws_ssm_parameter.forms_database_url.arn
}

output "secret_key_arn" {
  value = aws_ssm_parameter.secret_key.arn
}

output "sentry_dsn_arn" {
  value = aws_ssm_parameter.sentry_dsn.arn
}

output "what3words_api_key_arn" {
  value = aws_ssm_parameter.what3words_api_key.arn
}
