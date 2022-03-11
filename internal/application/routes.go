package application

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"strings"

	"github.com/go-chi/chi/v5"
)

var (
	cookieSessionID = "sid"
)

func (a *Application) registerRoutes() {
	r := a.router

	r.Use(a.sessionMiddleware())
	r.Get("/api/health", a.httpHealthCheck())
	r.Get("/api/sandboxes", a.httpListSandboxes())
	r.Get("/api/sessions/current", a.httpGetSession())
	r.Post("/api/sessions", a.httpCreateSession())
	r.Delete("/api/sessions/{sessionID}", a.httpDeleteSession())
	r.Get("/api/admin/summary", a.httpAdminSummary())

	wd, _ := os.Getwd()
	r.Handle("/*", http.FileServer(http.Dir(path.Join(wd, "./client/dist"))))
}

func (a *Application) httpHealthCheck() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}
}

func (a *Application) httpListSandboxes() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}

func (a *Application) httpGetSession() http.HandlerFunc {
	type response struct {
		Groupname string `json:"groupname,omitempty"`
	}
	return func(w http.ResponseWriter, r *http.Request) {
		session := getSession(r.Context())

		// Not session exists
		if session == nil {
			httpResponse(w, http.StatusNotFound, map[string]string{"error": "no session found"})
			return
		}

		// Return session
		httpResponse(w, http.StatusOK, response{
			Groupname: session.Groupname,
		})
	}
}

func (a *Application) httpCreateSession() http.HandlerFunc {
	type request struct {
		WorkshopCode string `json:"workshop_code"`
	}
	return func(w http.ResponseWriter, r *http.Request) {
		var req request
		if ok := httpReadBody(w, r, &req); !ok {
			return
		}

		fmt.Printf("%+v, %v\n", req, a.workshopCode)

		// Validate workshop code
		if !strings.EqualFold(req.WorkshopCode, a.workshopCode) {
			httpError(w, errors.New("invalid workshop code"))
			return
		}

		// Reserve a sandbox
		sandbox, err := a.sandbox.ReserveFree()
		if err != nil {
			httpError(w, err)
			return
		}

		// Create new session
		session := a.sessions.Create()
		session.Sandbox = sandbox
		setCookie(w, cookieSessionID, session.ID)

		log.Printf("Created session: %v for sandbox: %v", session.ID, sandbox.IP.String())
	}
}

func (a *Application) httpDeleteSession() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sessionID := chi.URLParam(r, "sessionID")
		session := a.sessions.Get(sessionID)
		if session == nil {
			httpError(w, errors.New("session not found"))
			return
		}

		// Release sandbox
		a.sandbox.Release(session.Sandbox)

		// Delete session
		a.sessions.Delete(sessionID)

		httpResponse(w, http.StatusOK, map[string]string{"message": "session deleted"})
	}
}

func (a *Application) httpAdminSummary() http.HandlerFunc {
	type sessionDTO struct {
		ID         string `json:"id"`
		Groupname  string `json:"groupname"`
		SandboxIP  string `json:"sandbox_ip"`
		LastActive int64  `json:"last_active"`
	}
	type sandboxDTO struct {
		IP string `json:"ip"`
	}
	type response struct {
		Sessions  []sessionDTO `json:"sessions"`
		Sandboxes []sandboxDTO `json:"sandboxes"`
	}
	return func(w http.ResponseWriter, r *http.Request) {
		// Create session dto list
		sessions := a.sessions.List()
		dtoSessions := make([]sessionDTO, len(sessions))
		for i, session := range sessions {
			dtoSessions[i] = sessionDTO{
				ID:         session.ID,
				Groupname:  session.Groupname,
				SandboxIP:  session.Sandbox.IP.String(),
				LastActive: session.LastActive.Unix(),
			}
		}

		// Create sandbox dto list
		sandboxes := a.sandbox.List()
		dtoSandboxes := make([]sandboxDTO, len(sandboxes))
		for i, sandbox := range sandboxes {
			dtoSandboxes[i] = sandboxDTO{
				IP: sandbox.IP.String(),
			}
		}

		// Return response
		httpResponse(w, http.StatusOK, response{
			Sessions:  dtoSessions,
			Sandboxes: dtoSandboxes,
		})
	}
}

func httpError(w http.ResponseWriter, err error) {
	httpResponse(w, http.StatusInternalServerError, map[string]string{"message": err.Error()})
}

func httpResponse(w http.ResponseWriter, status int, v interface{}) {
	jsonData, err := json.Marshal(v)
	if err != nil {
		httpError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(jsonData)
}

func httpReadBody(rw http.ResponseWriter, r *http.Request, v interface{}) bool {
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		httpError(rw, err)
		return false
	}

	return true
}

func deleteCookie(rw http.ResponseWriter, cookie string) {
	http.SetCookie(rw, &http.Cookie{
		Name:     cookie,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}

func setCookie(rw http.ResponseWriter, cookie, value string) {
	http.SetCookie(rw, &http.Cookie{
		Name:     cookie,
		Value:    value,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}

type middleware func(next http.Handler) http.Handler

func (a *Application) sessionMiddleware() middleware {
	return func(next http.Handler) http.Handler {
		mw := func(rw http.ResponseWriter, r *http.Request) {
			// Extract session
			sessionID, err := r.Cookie(cookieSessionID)
			if errors.Is(err, http.ErrNoCookie) {
				next.ServeHTTP(rw, r)
				return
			}
			if err != nil {
				httpError(rw, err)
				next.ServeHTTP(rw, r)
				return
			}

			session := a.sessions.Get(sessionID.Value)
			if session == nil {
				deleteCookie(rw, cookieSessionID)
				next.ServeHTTP(rw, r)
				return
			}

			// Update session time
			session.Touch()

			r = r.WithContext(withSession(r.Context(), session))
			next.ServeHTTP(rw, r)
		}

		return http.HandlerFunc(mw)
	}
}