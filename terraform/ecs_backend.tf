//
// EC2 instances
//

resource "aws_key_pair" "deployer" {
  key_name   = "remoto-deployer-key"
  public_key = var.ssh_pubkey
}

resource "aws_iam_role" "cluster_member" {
  name = "remoto"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "cluster_member" {
  name = "remoto"
  role = aws_iam_role.cluster_member.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateContainerInstancesState",
        "ecs:DeregisterContainerInstance",
        "ecs:DiscoverPollEndpoint",
        "ecs:Poll",
        "ecs:RegisterContainerInstance",
        "ecs:StartTelemetrySession",
        "ecs:Submit*",
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_iam_instance_profile" "cluster_member" {
  name = "remoto"
  role = aws_iam_role.cluster_member.name
}

resource "aws_instance" "sandbox" {
  count = var.remoto_backend_instance_count

  ami                         = var.ami_ecs
  instance_type               = var.remoto_backend_instance_type
  vpc_security_group_ids      = [aws_security_group.sandbox.id]
  subnet_id                   = module.vpc.public_subnets[0]
  key_name                    = aws_key_pair.deployer.key_name
  iam_instance_profile        = aws_iam_instance_profile.cluster_member.name
  associate_public_ip_address = true

  user_data = <<EOF
#!/bin/bash
echo ECS_CLUSTER=${aws_ecs_cluster.remoto.name} >> /etc/ecs/ecs.config
EOF

  tags = {
    deployment  = "remoto"
    application = "sandbox"
    name        = "sandbox-${count.index}"
  }
}


resource "aws_instance" "test" {
  ami                         = "ami-0a95ac0a51f0ee2de"
  instance_type               = var.remoto_backend_instance_type
  vpc_security_group_ids      = [aws_security_group.sandbox.id]
  subnet_id                   = module.vpc.public_subnets[0]
  key_name                    = aws_key_pair.deployer.key_name
  iam_instance_profile        = aws_iam_instance_profile.cluster_member.name
  associate_public_ip_address = true

  tags = {
    deployment  = "remoto"
    application = "test"
    name        = "test"
  }
}
