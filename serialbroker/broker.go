package serialbroker

import (
	"fmt"
	"net"
	"net/http"

	"github.com/gorilla/websocket"
)

/*
	TODO: try and recover from (TCP)socket errors to avoid closing the WebSocket connection
*/

func HandleWebsocket(target string) http.HandlerFunc {
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
		fmt.Println("[WS] Connected")

		// Create tcp connection to pico agent
		picoSock, err := net.Dial("tcp", target)
		if err != nil {
			fmt.Printf("failed to connect to pico agent: %v", err)
			webSock.Close()
			return
		}
		fmt.Println("[TCP] Connected")

		done := make(chan struct{})
		errC := make(chan error)

		// Pipe everything to tcp socket
		go readPipe(done, errC, webSock, picoSock)
		go writePipe(done, errC, webSock, picoSock)

		webSock.SetCloseHandler(func(code int, text string) error {
			fmt.Printf("[BROKER] Websocket disconnected: %d %s\n", code, text)
			close(done)
			return nil
		})

		select {
		case err := <-errC:
			fmt.Printf("[BROKER] Error: %v\n", err)
			close(done)
		case <-done:
			fmt.Println("[BROKER] Done")
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
			fmt.Printf("[WS >> TCP] %s\n", msg)
			picoSock.Write(msg)
		}
	}
	fmt.Printf("[WS >> TCP] Disconnected\n")
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
			fmt.Printf("[TCP >> WS] %s\n", buf[:n])
			webSock.WriteMessage(websocket.TextMessage, buf[:n])
		}
	}
	fmt.Printf("[TCP >> WS] Disconnected\n")
}
