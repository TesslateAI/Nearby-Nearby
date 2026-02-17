variable "project" { type = string }
variable "environment" { type = string }

variable "cors_origins" {
  type    = list(string)
  default = ["https://nearbynearby.com", "https://admin.nearbynearby.com"]
}
