#!/bin/bash

# CD to directory where this script is located
cd "${0%/*}"

docker build -t 756581103470.dkr.ecr.eu-central-1.amazonaws.com/remoto:latest -f remoto.Dockerfile ..
docker push 756581103470.dkr.ecr.eu-central-1.amazonaws.com/remoto:latest

# Sandbox is now provisioned using an AMI
# docker-compose -f ../docker-compose.yml build
# docker push 756581103470.dkr.ecr.eu-central-1.amazonaws.com/sandbox:latest

docker pull guacamole/guacd:1.4.0
docker tag guacamole/guacd:1.4.0 756581103470.dkr.ecr.eu-central-1.amazonaws.com/guacd:latest