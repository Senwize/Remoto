variable "aws_iam_id" {
  type = string
}

variable "aws_iam_secret" {
  type = string
}

variable "aws_region" {
  type    = string
  default = "eu-central-1"
}

variable "image_control" {
  type    = string
  default = "756581103470.dkr.ecr.eu-central-1.amazonaws.com/remoto:latest"
}

variable "image_guacd" {
  type    = string
  default = "756581103470.dkr.ecr.eu-central-1.amazonaws.com/guacd:latest"
}
