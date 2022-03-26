provider "aws" {
  access_key = var.aws_iam_id
  secret_key = var.aws_iam_secret
  region     = var.aws_region
}

provider "docker" {}
