# Non-sensitive values only. Sensitive values passed via TF_VAR_* env vars.
project        = "nearbynearby"
environment    = "prod"
aws_region     = "us-east-1"
aws_account_id = "487615743990"

# Existing resources (not managed by Terraform)
s3_bucket_name    = "nearbynearby-prod-images"
cloudfront_domain = "d24ow80agebvkk.cloudfront.net"

# Set these via environment variables:
# export TF_VAR_database_url="postgresql://postgres_admin:PASSWORD@nearby-admin-db.ce3mwk2ymjh4.us-east-1.rds.amazonaws.com:5432/nearbynearby"
# export TF_VAR_forms_database_url="postgresql://nearby_forms:PASSWORD@nearby-admin-db.ce3mwk2ymjh4.us-east-1.rds.amazonaws.com:5432/nearbynearby"
# export TF_VAR_secret_key="<your-jwt-secret>"
