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

variable "ami_sandbox" {
  type    = string
  default = "ami-0ef33d71578630d77"
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

variable "remoto_sandbox_instance_type" {
  type    = string
  default = "m5.large"
}

variable "use_cloud9" {
  type    = bool
  default = false
}

variable "ssh_pubkey" {
  type = string
}
