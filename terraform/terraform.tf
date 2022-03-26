terraform {
  backend "s3" {
    bucket = "terraform-remoto"
    key    = "state.tfstate"
    region = "eu-central-1"
  }

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "2.16.0"
    }
  }
}
