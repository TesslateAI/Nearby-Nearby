variable "project" { type = string }
variable "environment" { type = string }

variable "log_retention_days" {
  type    = number
  default = 14
}

variable "enable_alb_alarm" {
  type    = bool
  default = false
}

variable "alb_arn_suffix" {
  type    = string
  default = ""
}
