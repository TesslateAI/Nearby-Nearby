variable "project" { type = string }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "public_subnet_ids" { type = list(string) }
variable "alb_security_group_id" { type = string }

variable "admin_domain" {
  type    = string
  default = "admin.nearbynearby.com"
}
