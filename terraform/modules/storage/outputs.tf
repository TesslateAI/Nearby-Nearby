output "bucket_name" {
  value = aws_s3_bucket.images.id
}

output "bucket_arn" {
  value = aws_s3_bucket.images.arn
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.images.domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.images.id
}

output "s3_access_policy_arn" {
  value = aws_iam_policy.s3_access.arn
}
