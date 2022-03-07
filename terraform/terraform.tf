terraform {
  backend "s3" {
    bucket = "terraform-remoto"
    key    = "state.tfstate"
    region = "eu-central-1"
  }
}
