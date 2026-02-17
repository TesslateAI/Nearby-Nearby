variable "project" { type = string }
variable "environment" { type = string }

variable "database_url" {
  type      = string
  sensitive = true
}

variable "forms_database_url" {
  type      = string
  sensitive = true
}

variable "secret_key" {
  type      = string
  sensitive = true
}
