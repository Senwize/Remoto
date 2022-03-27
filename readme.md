
## Run guacd
```
docker run --rm -it --network=host guacamole/guacd
```

## xfce4 vnc fix
xfwm4 does not work with tightvnc, update to unreleased version:
http://launchpadlibrarian.net/494460182/xfwm4_4.14.5-1_amd64.deb

## Sandbox can't open code/chrome
Container must be privileged, perhaps use EC2 backend for ECS instead of Fargate? For Docker use `--privileged`.

## Todo:

- [ ] Update Workshop presentation / documents
- [ ] Include workshop files into AMI
- [ ] Update Terraform deployment to deploy EC2 instances with Sandbox AMI instead of using ECS for sandboxes

# Credits

Thanks to https://github.com/accetto/ubuntu-vnc-xfce-g3 for the Sandbox image