module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "remoto-vpc"
  cidr = "10.0.0.0/16"

  azs                  = ["${var.aws_region}a"]
  public_subnets       = ["10.0.100.0/24"]
  enable_dns_hostnames = true
  enable_dns_support   = true
}
resource "aws_security_group" "sandbox" {
  name        = "remoto-sandbox-sg"
  description = "Allow all traffic in subnet"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "Allow VPC inbound"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = module.vpc.public_subnets_cidr_blocks
  }

  ingress {
    description = "Allow RDP external"
    from_port   = 3389
    to_port     = 3389
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow Serial Tunnel external"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow SSH inbound external"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}
resource "aws_security_group" "guacd" {
  name        = "remoto-guacd-sg"
  description = "Allow all traffic in subnet"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "Allow VPC inbound"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = module.vpc.public_subnets_cidr_blocks
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}
resource "aws_security_group" "control" {
  name        = "remoto-control-sg"
  description = "Remoto control service traffic"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "Allow VPC inbound"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = module.vpc.public_subnets_cidr_blocks
  }

  ingress {
    description = "Allow HTTP inbound"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_service_discovery_private_dns_namespace" "this" {
  name = "ecs.remoto.local"
  vpc  = module.vpc.vpc_id
}

resource "aws_service_discovery_service" "guacd" {
  name = "guacd"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.this.id

    dns_records {
      ttl  = 10
      type = "A"
    }
  }
}

# Hosted zone is provided by the service discovery
resource "aws_route53_zone" "private" {
  name = "remoto.local"

  vpc {
    vpc_id = module.vpc.vpc_id
  }
}

resource "aws_route53_record" "sandbox" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "sandbox.remoto.local"
  type    = "A"
  ttl     = "10"
  records = aws_instance.sandbox.*.private_ip
}
