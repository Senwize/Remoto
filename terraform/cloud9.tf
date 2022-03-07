resource "aws_cloud9_environment_ec2" "this" {
  instance_type = "t2.micro"
  name          = "remoto"
  subnet_id     = module.vpc.public_subnets[0]
}

# data "aws_iam_user" "example" {
#   user_name = "an_example_user_name"
# }

# resource "aws_cloud9_environment_membership" "this" {
#   environment_id = aws_cloud9_environment_ec2.this
#   permissions = "read-write"
#   user_arn = 
# }
