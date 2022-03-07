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

resource "aws_ecs_cluster" "remoto" {
  name = "remoto"
}

//
// Guacd service
//

resource "aws_ecs_service" "guacd" {
  name            = "guacd"
  cluster         = aws_ecs_cluster.remoto.id
  task_definition = aws_ecs_task_definition.guacd.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.public_subnets
    assign_public_ip = true
    security_groups  = [aws_security_group.private.id]
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

  cpu    = 256
  memory = 512

  container_definitions = jsonencode([
    {
      name      = "guacd"
      essential = true
      image     = var.image_guacd
      portMappings = [
        {
          containerPort = 4822
          hostPort      = 4822
        }
      ]
    }
  ])
}


//
// Control service
//
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

  service_registries {
    registry_arn = aws_service_discovery_service.control.arn
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
      image     = var.image_control
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
        }
      ]
      environment = [
        {
          name  = "GUACD_ADDR"
          value = "guacd.remoto.local:4822"
        },
        {
          name  = "HOST_ADDR"
          value = "0.0.0.0:80"
        }
      ]
    }
  ])
}
