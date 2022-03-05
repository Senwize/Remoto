module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name           = "remoto"
  cidr           = "172.16.0.0/16"
  azs            = ["${var.aws_region}a", "${var.aws_region}b"]
  public_subnets = ["172.16.0.0/24", "172.16.1.0/24"]
}



