output "alb_dns_name" {
  value       = module.alb.dns_name
  description = "ALB DNS name — point Cloudflare CNAME records here"
}

output "ecr_repository_urls" {
  value       = module.ecr.repository_urls
  description = "ECR repository URLs for Docker image pushes"
}

output "ecs_cluster_name" {
  value       = module.ecs.cluster_name
  description = "ECS cluster name"
}

output "app_service_name" {
  value       = module.ecs.app_service_name
  description = "ECS service name for nearby-app"
}

output "admin_service_name" {
  value       = module.ecs.admin_service_name
  description = "ECS service name for nearby-admin"
}

output "github_actions_role_arn" {
  value       = module.ecs.github_actions_role_arn
  description = "IAM role ARN for GitHub Actions — set as AWS_ROLE_TO_ASSUME secret"
}
