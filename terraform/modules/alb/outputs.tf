output "dns_name" {
  value = aws_lb.main.dns_name
}

output "zone_id" {
  value = aws_lb.main.zone_id
}

output "arn" {
  value = aws_lb.main.arn
}

output "app_target_group_arn" {
  value = aws_lb_target_group.app.arn
}

output "admin_target_group_arn" {
  value = aws_lb_target_group.admin.arn
}
