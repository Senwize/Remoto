data "aws_caller_identity" "current" {}

resource "aws_cloud9_environment_ec2" "this" {
  instance_type = "t2.micro"
  name          = "remoto"
  subnet_id     = module.vpc.public_subnets[0]
  owner_arn     = data.aws_caller_identity.current.arn
}
