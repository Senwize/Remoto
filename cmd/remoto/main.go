package main

import (
	"fmt"
	"net"
	"net/http"
	"os"
	"path"

	"github.com/sirupsen/logrus"
	"github.com/wwt/guac"
	"remoto.senwize.com/serialbroker"
)

func main() {
	logrus.SetLevel(logrus.DebugLevel)

	wsServer := guac.NewWebsocketServer(DemoDoConnect)

	sessions := guac.NewMemorySessionStore()
	wsServer.OnConnect = sessions.Add
	wsServer.OnDisconnect = sessions.Delete

	mux := http.NewServeMux()
	wd, _ := os.Getwd()
	mux.Handle("/", http.FileServer(http.Dir(path.Join(wd, "./client/dist"))))
	mux.Handle("/websocket-tunnel", wsServer)
	mux.Handle("/websocket-serial", serialbroker.HandleWebsocket("18.196.196.34:5910"))

	s := &http.Server{
		Addr:           "0.0.0.0:8080",
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
	addr, _ := net.ResolveTCPAddr("tcp", "127.0.0.1:4822")

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
