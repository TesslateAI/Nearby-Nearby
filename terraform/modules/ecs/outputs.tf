output "cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "cluster_arn" {
  value = aws_ecs_cluster.main.arn
}

output "app_service_name" {
  value = aws_ecs_service.app.name
}

output "admin_service_name" {
  value = aws_ecs_service.admin.name
}

output "github_actions_role_arn" {
  value = aws_iam_role.github_actions.arn
}

output "task_execution_role_arn" {
  value = aws_iam_role.ecs_execution.arn
}

output "task_role_arn" {
  value = aws_iam_role.ecs_task.arn
}
