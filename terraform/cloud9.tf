resource "aws_cloud9_environment_ec2" "this" {
  count         = var.use_cloud9 ? 1 : 0
  instance_type = "t2.micro"
  name          = "remoto"
  subnet_id     = module.vpc.public_subnets[0]
}
