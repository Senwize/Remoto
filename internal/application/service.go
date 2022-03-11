package application

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"remoto.senwize.com/internal/discovery"
	"remoto.senwize.com/internal/sandbox"
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
	app.discovery.Add(cfg.GuacdFQDN)
	app.discovery.Add(cfg.SandboxFQDN)

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
		Addr:         addr,
		Handler:      a,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
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

func (a *Application) onServiceDiscovered(fqdn string, ip net.IP) {
	log.Printf("Service discovered: %s -> %s", fqdn, ip.String())
	a.sandbox.Add(ip)
}

func (a *Application) onServiceLost(fqdn string, ip net.IP) {
	log.Printf("Service lost: %s -> %s", fqdn, ip.String())
	a.sandbox.Delete(ip)
}
