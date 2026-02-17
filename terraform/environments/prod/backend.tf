terraform {
  backend "s3" {
    bucket         = "nearbynearby-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "nearbynearby-terraform-lock"
    encrypt        = true
  }
}
