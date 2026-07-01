# --- ECS Cluster ---
resource "aws_ecs_cluster" "main" {
  name = "${var.project}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "disabled"
  }

  service_connect_defaults {
    namespace = aws_service_discovery_http_namespace.internal.arn
  }

  tags = { Name = "${var.project}-${var.environment}-cluster" }
}

# --- Service Connect (Cloud Map HTTP namespace) ---
# Private namespace used by ECS Service Connect so services resolve each other
# by a stable DNS name (e.g. http://embedding.<namespace>:80) without an ALB.
resource "aws_service_discovery_http_namespace" "internal" {
  name        = var.service_connect_namespace
  description = "${var.project}-${var.environment} internal Service Connect namespace"

  tags = { Name = "${var.project}-${var.environment}-internal-ns" }
}

# --- Task Execution Role (pull images, read secrets, write logs) ---
resource "aws_iam_role" "ecs_execution" {
  name = "${var.project}-${var.environment}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_base" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_policy" "ecs_execution_ssm" {
  name = "${var.project}-${var.environment}-ecs-ssm-read"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ssm:GetParameters", "ssm:GetParameter"]
      Resource = "arn:aws:ssm:${var.aws_region}:${var.aws_account_id}:parameter/${var.project}/${var.environment}/*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_ssm" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = aws_iam_policy.ecs_execution_ssm.arn
}

# --- Task Role (S3 access for running containers) ---
resource "aws_iam_role" "ecs_task" {
  name = "${var.project}-${var.environment}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_s3" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = var.s3_access_policy_arn
}

# =============================================================================
# nearby-app Service
# =============================================================================

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project}-${var.environment}-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.app_cpu
  memory                   = var.app_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "nearby-app"
      image     = var.app_image
      essential = true

      portMappings = [{
        containerPort = 8000
        protocol      = "tcp"
      }]

      environment = [
        { name = "PYTHONUNBUFFERED", value = "1" },
        { name = "PYTHONPATH", value = "/app" },
        { name = "AWS_S3_BUCKET", value = var.s3_bucket_name },
        { name = "AWS_CLOUDFRONT_DOMAIN", value = var.cloudfront_domain },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "ALLOWED_ORIGINS", value = var.app_allowed_origins },
        { name = "EMBEDDING_SERVICE_URL", value = var.embedding_service_url },
        { name = "EMBEDDING_BACKEND", value = "openai" },
        { name = "EMBEDDING_MODEL", value = "embeddinggemma" },
        { name = "EMBEDDING_TIMEOUT", value = "30" },
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = var.ssm_database_url_arn
        },
        {
          name      = "FORMS_DATABASE_URL"
          valueFrom = var.ssm_forms_database_url_arn
        },
        {
          name      = "SECRET_KEY"
          valueFrom = var.ssm_secret_key_arn
        },
        {
          name      = "SENTRY_DSN"
          valueFrom = var.ssm_sentry_dsn_arn
        },
      ]

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8000/api/health || exit 1"]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 120
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = var.app_log_group_name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "app"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "app" {
  name            = "${var.project}-${var.environment}-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.app_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.app_target_group_arn
    container_name   = "nearby-app"
    container_port   = 8000
  }

  # Service Connect client only — resolves the embedding service by private DNS.
  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.internal.arn
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 180

  lifecycle { ignore_changes = [desired_count] }
}

# --- App Auto Scaling ---
resource "aws_appautoscaling_target" "app" {
  max_capacity       = var.app_max_count
  min_capacity       = var.app_min_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "app_cpu" {
  name               = "${var.project}-${var.environment}-app-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.app.resource_id
  scalable_dimension = aws_appautoscaling_target.app.scalable_dimension
  service_namespace  = aws_appautoscaling_target.app.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "app_memory" {
  name               = "${var.project}-${var.environment}-app-memory"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.app.resource_id
  scalable_dimension = aws_appautoscaling_target.app.scalable_dimension
  service_namespace  = aws_appautoscaling_target.app.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# =============================================================================
# nearby-admin Service (2 containers in 1 task)
# =============================================================================

resource "aws_ecs_task_definition" "admin" {
  family                   = "${var.project}-${var.environment}-admin"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.admin_cpu
  memory                   = var.admin_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = var.admin_backend_image
      essential = true

      portMappings = [{
        containerPort = 8000
        protocol      = "tcp"
      }]

      environment = [
        { name = "PYTHONUNBUFFERED", value = "1" },
        { name = "PYTHONPATH", value = "/app" },
        { name = "AWS_S3_BUCKET", value = var.s3_bucket_name },
        { name = "AWS_CLOUDFRONT_DOMAIN", value = var.cloudfront_domain },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "ALLOWED_ORIGINS", value = var.admin_allowed_origins },
        { name = "PRODUCTION_DOMAIN", value = var.admin_domain },
        { name = "EMBEDDING_SERVICE_URL", value = var.embedding_service_url },
        { name = "EMBEDDING_BACKEND", value = "openai" },
        { name = "EMBEDDING_MODEL", value = "embeddinggemma" },
        { name = "EMBEDDING_TIMEOUT", value = "30" },
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = var.ssm_database_url_arn
        },
        {
          name      = "SECRET_KEY"
          valueFrom = var.ssm_secret_key_arn
        },
        {
          name      = "SENTRY_DSN"
          valueFrom = var.ssm_sentry_dsn_arn
        },
        {
          name      = "WHAT3WORDS_API_KEY"
          valueFrom = var.ssm_what3words_api_key_arn
        },
      ]

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8000/api/health || exit 1"]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 60
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = var.admin_log_group_name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "admin-backend"
        }
      }
    },
    {
      name      = "nginx"
      image     = var.admin_frontend_image
      essential = true

      portMappings = [{
        containerPort = 5173
        protocol      = "tcp"
      }]

      environment = [
        { name = "BACKEND_HOST", value = "localhost" },
      ]

      dependsOn = [{
        containerName = "backend"
        condition     = "HEALTHY"
      }]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = var.admin_log_group_name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "admin-nginx"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "admin" {
  name            = "${var.project}-${var.environment}-admin"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.admin.arn
  desired_count   = var.admin_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.admin_target_group_arn
    container_name   = "nginx"
    container_port   = 5173
  }

  # Service Connect client only — resolves the embedding service by private DNS.
  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.internal.arn
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 120

  lifecycle { ignore_changes = [desired_count] }
}

# --- Admin Auto Scaling ---
resource "aws_appautoscaling_target" "admin" {
  max_capacity       = var.admin_max_count
  min_capacity       = var.admin_min_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.admin.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "admin_cpu" {
  name               = "${var.project}-${var.environment}-admin-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.admin.resource_id
  scalable_dimension = aws_appautoscaling_target.admin.scalable_dimension
  service_namespace  = aws_appautoscaling_target.admin.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# =============================================================================
# embedding Service (Hugging Face TEI — internal, Service Connect only)
# =============================================================================

resource "aws_ecs_task_definition" "embedding" {
  family                   = "${var.project}-${var.environment}-embedding"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.embedding_cpu
  memory                   = var.embedding_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "embedding"
      image     = var.embedding_image
      essential = true

      # llama.cpp server: serve the ungated EmbeddingGemma Q8_0 GGUF and expose
      # the OpenAI-compatible /v1/embeddings endpoint. --host 0.0.0.0 is required
      # so Service Connect peers can reach it; -ub/-c sized so a full-length doc
      # embeds in one pass. "embedding" is the Service Connect port name (80).
      command = [
        "--hf-repo", "unsloth/embeddinggemma-300m-GGUF",
        "--hf-file", "embeddinggemma-300M-Q8_0.gguf",
        "--embeddings", "--host", "0.0.0.0", "--port", "80",
        "-c", "2048", "-ub", "2048", "-b", "2048",
      ]

      portMappings = [{
        name          = "embedding"
        containerPort = 80
        protocol      = "tcp"
        # appProtocol is required for Service Connect to set up a proper L7 (HTTP)
        # proxy; without it SC falls back to a TCP listener that resets the
        # app/admin client connections before they reach llama.cpp.
        appProtocol = "http"
      }]

      # No container-level healthCheck: the minimal HF text-embeddings-inference
      # image ships neither curl nor wget, so a CMD-SHELL probe would always fail
      # and crash-loop the task. ECS treats the essential container as healthy
      # while it is running, and Service Connect routes to it; the app/admin
      # embedding client is fail-soft (degrades to keyword search) while the
      # model loads or if the service is briefly unreachable. TEI exposes /health
      # on port 80 if a future probe is added via an image that bundles a client.

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = var.embedding_log_group_name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "embedding"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "embedding" {
  name            = "${var.project}-${var.environment}-embedding"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.embedding.arn
  desired_count   = var.embedding_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  # No ALB target group — internal only. Advertise the TEI port via Service
  # Connect so app/admin resolve it at http://embedding.<namespace>:80.
  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.internal.arn

    service {
      port_name = "embedding"

      client_alias {
        port     = 80
        dns_name = "embedding"
      }
    }
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 240

  lifecycle { ignore_changes = [desired_count] }
}

# --- GitHub Actions OIDC Role ---
data "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc ? 1 : 0
  url   = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_openid_connect_provider" "github" {
  count           = var.create_github_oidc ? 1 : 0
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1", "1c58a3a8518e8759bf075b76b750d4f2df264fcd"]
}

locals {
  oidc_provider_arn = var.create_github_oidc ? aws_iam_openid_connect_provider.github[0].arn : var.github_oidc_provider_arn
}

resource "aws_iam_role" "github_actions" {
  name = "${var.project}-${var.environment}-github-actions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = local.oidc_provider_arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:*"
        }
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })
}

resource "aws_iam_policy" "github_actions" {
  name = "${var.project}-${var.environment}-github-actions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:CompleteLayerUpload",
          "ecr:GetDownloadUrlForLayer",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart",
        ]
        Resource = var.ecr_repository_arns
      },
      {
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = ["ecs:UpdateService", "ecs:DescribeServices"]
        Resource = [
          aws_ecs_service.app.id,
          aws_ecs_service.admin.id,
          aws_ecs_service.embedding.id,
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "github_actions" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.github_actions.arn
}
