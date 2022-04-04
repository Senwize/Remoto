//
// Create execution role for ECR images
//
resource "aws_iam_role" "ecs_execution_role" {
  name = "ecs_execution_role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
  EOF
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_attach" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_cloudwatch_log_group" "remoto" {
  name              = "remoto"
  retention_in_days = 1
}

resource "aws_ecs_cluster" "remoto" {
  name = "remoto"
}

//
// Guacd service
//

data "docker_image" "guacd" {
  name = var.image_guacd
}

resource "aws_ecs_service" "guacd" {
  name            = "guacd"
  cluster         = aws_ecs_cluster.remoto.id
  task_definition = aws_ecs_task_definition.guacd.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.public_subnets
    assign_public_ip = true
    security_groups  = [aws_security_group.guacd.id]
  }

  service_registries {
    registry_arn = aws_service_discovery_service.guacd.arn
  }
}

resource "aws_ecs_task_definition" "guacd" {
  family                   = "guacd"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  depends_on = [
    aws_iam_role.ecs_execution_role
  ]

  cpu    = 2048
  memory = 4096

  container_definitions = jsonencode([
    {
      name      = "guacd"
      essential = true
      image     = data.docker_image.guacd.repo_digest
      portMappings = [
        {
          containerPort = 4822
          hostPort      = 4822
        }
      ]
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          "awslogs-group"         = "remoto",
          "awslogs-region"        = "${var.aws_region}",
          "awslogs-stream-prefix" = "remoto"
        }
      }
    }
  ])
}


//
// Control service
//

data "docker_image" "control" {
  name = var.image_control
}

resource "aws_ecs_service" "control" {
  name            = "control"
  cluster         = aws_ecs_cluster.remoto.id
  task_definition = aws_ecs_task_definition.control.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.public_subnets
    assign_public_ip = true
    security_groups  = [aws_security_group.control.id]
  }
}

resource "aws_ecs_task_definition" "control" {
  family                   = "control"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  depends_on = [
    aws_iam_role.ecs_execution_role
  ]

  cpu    = 256
  memory = 512

  container_definitions = jsonencode([
    {
      name      = "control"
      essential = true
      image     = data.docker_image.control.repo_digest
      # command   = ["serve"]
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
        }
      ]
      environment = [
        {
          name  = "REMOTO_GUACD_FQDN",
          value = "guacd.ecs.remoto.local"
        },
        {
          name  = "REMOTO_SANDBOX_FQDN",
          value = "sandbox.remoto.local"
        },
        {
          name  = "REMOTO_HTTP_ADDR",
          value = "0.0.0.0:80"
        },
        {
          name  = "REMOTO_WORKSHOP_CODE",
          value = var.remoto_workshop_code
        },
        {
          name  = "REMOTO_ADMIN_CODE",
          value = var.remoto_admin_code
        },
        {
          name  = "REMOTO_REMOTE_PROTOCOL",
          value = "rdp"
        },
        {
          name  = "REMOTO_REMOTE_PORT",
          value = "3389"
        },
        {
          name  = "REMOTO_REMOTE_SERIAL_PORT",
          value = "5000"
        },
        {
          name  = "REMOTO_REMOTE_USERNAME",
          value = "workshop"
        },
        {
          name  = "REMOTO_REMOTE_PASSWORD",
          value = "workshop"
        },
        {
          name  = "REMOTO_REMOTE_IGNORE_CERT",
          value = "true"
        },
        {
          name  = "REMOTO_REMOTE_SECURITY",
          value = "any"
        },
        {
          name  = "REMOTO_REMOTE_WIDTH",
          value = "1366"
        },
        {
          name  = "REMOTO_REMOTE_HEIGHT",
          value = "768"
        },
      ],
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          "awslogs-group"         = "remoto",
          "awslogs-region"        = "${var.aws_region}",
          "awslogs-stream-prefix" = "remoto"
        }
      }
    }
  ])
}
