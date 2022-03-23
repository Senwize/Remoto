package application

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/wwt/guac"
	"remoto.senwize.com/internal/discovery"
	"remoto.senwize.com/internal/sandbox"
)

var (
	// Service names
	DISCOVERY_GUACD   = "guacd"
	DISCOVERY_SANDBOX = "sandbox"
)

// Application ...
type Application struct {
	router    chi.Router
	sandbox   *sandbox.Service
	discovery *discovery.Service
	sessions  *SessionService

	workshopCode string
	adminCode    string
	done         chan struct{}
}

// Config ...
type Config struct {
	GuacdFQDN    string
	SandboxFQDN  string
	WorkshopCode string
	AdminCode    string
}

func New(cfg Config) *Application {
	app := &Application{
		router:       chi.NewRouter(),
		discovery:    discovery.New(),
		sandbox:      sandbox.New(),
		sessions:     newSessionService(),
		done:         make(chan struct{}),
		workshopCode: cfg.WorkshopCode,
		adminCode:    cfg.AdminCode,
	}

	// Register http routes
	app.registerRoutes()

	// Setup discovery service
	app.discovery.OnDiscover = app.onServiceDiscovered
	app.discovery.OnLost = app.onServiceLost
	app.discovery.Add(DISCOVERY_GUACD, cfg.GuacdFQDN)
	app.discovery.Add(DISCOVERY_SANDBOX, cfg.SandboxFQDN)

	return app
}

func (a *Application) Serve(httpAddr string) {
	// Channels to capture errors and shutdown signals
	errC := make(chan error)
	sigC := make(chan os.Signal, 1)
	signal.Notify(sigC, syscall.SIGINT)

	// Start services
	stopServiceDiscovery := a.startServiceDiscovery()
	defer stopServiceDiscovery()
	stopHTTPServer := a.startHTTPServer(errC, httpAddr)
	defer stopHTTPServer()

	// Wait for a signal
	select {
	case err := <-errC:
		log.Printf("Error: %v", err)
	case <-sigC:
	}
}

func (a *Application) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	a.router.ServeHTTP(w, r)
}

func (a *Application) startServiceDiscovery() func() {
	shutdown := make(chan struct{})

	// Service discovery co-routine
	go func() {
		log.Printf("Starting service discovery")
		defer log.Printf("Stopping service discovery")

		// Dont wait for first tick
		a.discovery.Refresh()

		// Start refreshing on an interval
		ticker := time.NewTicker(time.Second * 5)
		for {
			select {
			case <-shutdown:
				return
			case <-ticker.C:
				a.discovery.Refresh()
			}
		}
	}()

	return func() {
		close(shutdown)
	}
}

func (a *Application) startHTTPServer(errC chan error, addr string) func() {
	srv := &http.Server{
		Addr:           addr,
		Handler:        a,
		WriteTimeout:   15 * time.Second,
		ReadTimeout:    15 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	// HTTP server co-routine
	go func() {
		log.Printf("Starting http server")
		defer log.Printf("Stopping http server")

		// Start http server
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errC <- fmt.Errorf("http server error: %v", err)
		}
	}()

	return func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		srv.Shutdown(ctx)
	}
}

func (a *Application) onGuacConnect(r *http.Request) (guac.Tunnel, error) {
	log.Printf("Guac WS connection...\n")

	// Get session sandbox
	session := getSession(r.Context())
	if session == nil {
		return nil, errors.New("cannot start guacamole tunnel without session")
	}
	ip := session.Sandbox.IP.To4().String()

	// Setup tunnel configuration
	config := guac.NewGuacamoleConfiguration()
	config.Protocol = "vnc"
	config.Parameters["hostname"] = ip
	config.Parameters["port"] = "5901"
	config.Parameters["username"] = "headless"
	config.Parameters["password"] = "headless"
	config.Parameters["ignore-cert"] = "true"
	config.Parameters["security"] = "any"
	config.OptimalScreenWidth = 1920
	config.OptimalScreenHeight = 1080
	config.AudioMimetypes = []string{"audio/L16", "rate=44100", "channels=2"}

	// Get GuacD IP
	guacdIP := a.discovery.Get(DISCOVERY_GUACD)
	if guacdIP == nil || len(guacdIP) == 0 {
		return nil, errors.New("cannot start guacamole tunnel without guacd ip")
	}

	log.Printf("Connecting session (%s) to sandbox (%s) through guacd at (%s)\n", session.GroupName, config.Parameters["hostname"], guacdIP[0])

	// Connect to GuacD
	conn, err := net.DialTCP("tcp", nil, &net.TCPAddr{IP: guacdIP[0], Port: 4822})
	if err != nil {
		fmt.Println("error while connecting to guacd", err)
		return nil, err
	}

	// Create tunnel
	stream := guac.NewStream(conn, guac.SocketTimeout)

	// // Set ID
	// config.ConnectionID = session.ID

	err = stream.Handshake(config)
	if err != nil {
		return nil, err
	}

	return guac.NewSimpleTunnel(stream), nil
}

func (a *Application) onServiceDiscovered(svc string, ip net.IP) {
	log.Printf("Service discovered: %s -> %s", svc, ip.String())
	if svc == DISCOVERY_GUACD {
		return
	}
	a.sandbox.Add(ip)
}

func (a *Application) onServiceLost(svc string, ip net.IP) {
	log.Printf("Service lost: %s -> %s", svc, ip.String())
	if svc == DISCOVERY_GUACD {
		return
	}
	a.sandbox.Delete(ip)
}
