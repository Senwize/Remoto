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

variable "image_sandbox" {
  type    = string
  default = "756581103470.dkr.ecr.eu-central-1.amazonaws.com/sandbox:latest"
}

// Get latest using:
//  aws ssm get-parameters --names /aws/service/ecs/optimized-ami/amazon-linux-2/recommended \
//  | jq -r ' .Parameters[0].Value' | jq -r .image_id
variable "ami_ecs" {
  type    = string
  default = "ami-0a8b8ef11f16a92dd"
}

variable "remoto_workshop_code" {
  type    = string
  default = "demo"
}

variable "remoto_admin_code" {
  type    = string
  default = "admin"
}

variable "remoto_sandbox_count" {
  type    = number
  default = 3
}

variable "remoto_backend_instance_count" {
  type    = number
  default = 3
}

variable "remoto_backend_instance_type" {
  type    = string
  default = "t3.medium"
}

variable "use_cloud9" {
  type    = bool
  default = false
}

variable "ssh_pubkey" {
  type = string
}
