output "app_log_group_name" {
  value = aws_cloudwatch_log_group.app.name
}

output "admin_log_group_name" {
  value = aws_cloudwatch_log_group.admin.name
}

output "app_log_group_arn" {
  value = aws_cloudwatch_log_group.app.arn
}

output "admin_log_group_arn" {
  value = aws_cloudwatch_log_group.admin.arn
}
