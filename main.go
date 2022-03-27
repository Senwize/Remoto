package main

import (
	"fmt"
	"net"
	"net/http"
	"os"
	"path"

	"github.com/sirupsen/logrus"
	"github.com/wwt/guac"
	"remoto.senwize.com/cmd"
	"remoto.senwize.com/internal/serialbroker"
)

/*

	- Discovery service
			Uses DNS ip to find the guacd address
			Uses the ip to find the VM addresses
	- Login service
			Groups can login by supplying a workshop_id and a groupname.
			The workshop id is set as environment variable.
			The groupname can be anything and will be the key
	- Tunnel service
			Establishes VM connections using guacd
*/

var (
	GUACD_ADDR = or(os.Getenv("GUACD_ADDR"), "http://guacd.remoto.local:4822")
	HOST_ADDR  = or(os.Getenv("HOST_ADDR"), "0.0.0.0:8080")
)

func or(a, b string) string {
	if a == "" {
		return b
	}
	return a
}

func main() {
	cmd.Execute()
	return

	logrus.SetLevel(logrus.DebugLevel)

	wsServer := guac.NewWebsocketServer(DemoDoConnect)
	sessions := guac.NewMemorySessionStore()
	wsServer.OnConnect = sessions.Add
	wsServer.OnDisconnect = sessions.Delete

	mux := http.NewServeMux()
	wd, _ := os.Getwd()
	mux.Handle("/", http.FileServer(http.Dir(path.Join(wd, "./client/dist"))))
	mux.Handle("/websocket-tunnel", wsServer)
	mux.Handle("/websocket-serial", serialbroker.HandleWebsocket(5000))

	s := &http.Server{
		Addr:           HOST_ADDR,
		Handler:        mux,
		ReadTimeout:    guac.SocketTimeout,
		WriteTimeout:   guac.SocketTimeout,
		MaxHeaderBytes: 1 << 20,
	}
	logrus.Printf("Serving on %s\n", s.Addr)

	err := s.ListenAndServe()
	if err != nil {
		fmt.Println(err)
	}
}

// DemoDoConnect creates the tunnel to the remote machine (via guacd)
func DemoDoConnect(request *http.Request) (guac.Tunnel, error) {
	config := guac.NewGuacamoleConfiguration()
	// config.Protocol = "rdp"
	// config.Parameters["hostname"] = "3.65.42.230"
	// config.Parameters["port"] = "3389"
	// config.Parameters["username"] = "ubuntu"
	// config.Parameters["password"] = "wachtwoord"
	// config.Parameters["ignore-cert"] = "true"
	// config.Parameters["security"] = "any"

	config.Protocol = "vnc"
	config.Parameters["hostname"] = "18.196.196.34"
	config.Parameters["port"] = "5901"
	config.Parameters["username"] = "ubuntu"
	config.Parameters["password"] = "wachtwoord"
	config.Parameters["ignore-cert"] = "true"
	config.Parameters["security"] = "any"

	config.OptimalScreenWidth = 1920
	config.OptimalScreenHeight = 1080
	config.AudioMimetypes = []string{"audio/L16", "rate=44100", "channels=2"}

	logrus.Debug("Connecting to guacd")
	addr, _ := net.ResolveTCPAddr("tcp", GUACD_ADDR)

	conn, err := net.DialTCP("tcp", nil, addr)
	if err != nil {
		logrus.Errorln("error while connecting to guacd", err)
		return nil, err
	}

	stream := guac.NewStream(conn, guac.SocketTimeout)

	logrus.Debug("Connected to guacd")
	if request.URL.Query().Get("uuid") != "" {
		config.ConnectionID = request.URL.Query().Get("uuid")
	}
	logrus.Debugf("Starting handshake with %#v", config)
	err = stream.Handshake(config)
	if err != nil {
		return nil, err
	}
	logrus.Debug("Socket configured")
	return guac.NewSimpleTunnel(stream), nil
}
