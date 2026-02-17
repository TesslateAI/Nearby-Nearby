resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.project}-${var.environment}/app"
  retention_in_days = var.log_retention_days

  tags = { Name = "${var.project}-${var.environment}-app-logs" }
}

resource "aws_cloudwatch_log_group" "admin" {
  name              = "/ecs/${var.project}-${var.environment}/admin"
  retention_in_days = var.log_retention_days

  tags = { Name = "${var.project}-${var.environment}-admin-logs" }
}

# --- Optional 5xx Alarm ---
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  count = var.enable_alb_alarm ? 1 : 0

  alarm_name          = "${var.project}-${var.environment}-alb-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB returning 5xx errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = { Name = "${var.project}-${var.environment}-5xx-alarm" }
}
