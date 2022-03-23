
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

- Fix Socat service: file disappears but service keeps running
- Implement TCP-Reconnect in serialbroker
- Add Socat service to Sandbox docker
- Create serial forwarder for session on /api/ws/serial

# Credits

Thanks to https://github.com/accetto/ubuntu-vnc-xfce-g3 for the Sandbox image