package serialbroker

import (
	"fmt"
	"log"
	"net"
	"net/http"

	"github.com/gorilla/websocket"
	"remoto.senwize.com/internal/session"
)

/*
	TODO: try and recover from (TCP)socket errors to avoid closing the WebSocket connection
*/

func HandleWebsocket(port int) http.HandlerFunc {
	upgrader := &websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	return func(rw http.ResponseWriter, r *http.Request) {
		webSock, err := upgrader.Upgrade(rw, r, nil)
		if err != nil {
			return
		}
		log.Println("[WS] Connected")

		var ip net.IP

		// Get session sandbox
		s := session.Get(r.Context())
		if s == nil {
			log.Println("[WS] Cannot start serial tunnel without session")
			webSock.Close()
			return
		}

		// Get Admin hostname or sandbox IP
		query := r.URL.Query()
		if s.IsAdmin && query.Get("hostname") != "" {
			ip = net.ParseIP(query.Get("hostname"))
		} else if s.Sandbox != nil {
			ip = s.Sandbox.IP
		} else {
			log.Println("[WS] Cannot start serial tunnel without destination")
			webSock.Close()
			return
		}

		// Create tcp connection to pico agent
		picoSock, err := net.DialTCP("tcp", nil, &net.TCPAddr{IP: ip, Port: port})
		if err != nil {
			log.Printf("[SerialTunnel] failed to connect to pico agent: %v\n", err)
			return
		}

		log.Printf("[SerialTunnel] Connected session (%s) to serial tunnel tcp (%s)\n", s.GroupName, ip)

		done := make(chan struct{})
		errC := make(chan error)

		// Pipe everything to tcp socket
		go readPipe(done, errC, webSock, picoSock)
		go writePipe(done, errC, webSock, picoSock)

		webSock.SetCloseHandler(func(code int, text string) error {
			log.Printf("[SerialTunnel] Websocket for (%s) disconnected: %d %s\n", s.GroupName, code, text)
			close(done)
			return nil
		})

		select {
		case err := <-errC:
			log.Printf("[SerialTunnel] (%s) Error: %v\n", s.GroupName, err)
			close(done)
		case <-done:
			log.Println("[SerialTunnel] Done")
		}

		webSock.Close()
		picoSock.Close()
	}
}

func readPipe(done chan struct{}, errC chan error, webSock *websocket.Conn, picoSock net.Conn) {
outer:
	for {
		select {
		case <-done:
			break outer
		default:
			_, msg, err := webSock.ReadMessage()
			if err != nil {
				errC <- fmt.Errorf("[WS >> TCP] %w", err)
				break outer
			}
			log.Printf("[WS >> TCP] %s\n", msg)
			picoSock.Write(msg)
		}
	}
	log.Printf("[WS >> TCP] Disconnected\n")
}

func writePipe(done chan struct{}, errC chan error, webSock *websocket.Conn, picoSock net.Conn) {
	buf := make([]byte, 1024)
outer:
	for {
		select {
		case <-done:
			break outer
		default:
			n, err := picoSock.Read(buf)
			if err != nil {
				errC <- fmt.Errorf("[TCP >> WS] %w", err)
				break outer
			}
			log.Printf("[TCP >> WS] %s\n", buf[:n])
			webSock.WriteMessage(websocket.TextMessage, buf[:n])
		}
	}
	log.Printf("[TCP >> WS] Disconnected\n")
}
