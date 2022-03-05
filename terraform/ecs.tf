resource "aws_ecs_cluster" "remoto" {
  name = "remoto"
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
  }
}


resource "aws_ecs_task_definition" "guacd" {
  family                   = "guacd"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = 256
  memory = 512

  container_definitions = jsonencode([
    {
      name      = "guacd"
      essential = true
      image     = "guacamole/guacd"
      portMappings = [
        {
          containerPort = 4822
          hostPort      = 4822
        }
      ]
    }
  ])
}

