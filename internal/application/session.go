package application

import (
	"context"
	"crypto/rand"
	"time"

	"remoto.senwize.com/internal/names"
	"remoto.senwize.com/internal/sandbox"
)

const (
	SESSION_ID_LENGTH   = 32
	RANDOM_STRING_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
)

var (
	ctxSessionKey = struct{}{}
)

// Session ...
type Session struct {
	ID         string
	GroupName  string
	IsAdmin    bool
	Sandbox    *sandbox.Sandbox
	LastActive time.Time
}

func (s *Session) Touch() {
	s.LastActive = time.Now()
}

// SessionService ...
type SessionService struct {
	store map[string]*Session
}

func newSessionService() *SessionService {
	return &SessionService{
		store: map[string]*Session{},
	}
}

func (s *SessionService) Get(id string) *Session {
	return s.store[id]
}

func (s *SessionService) Create(groupName string) *Session {
	if groupName == "" {
		groupName = s.generateName()
	}

	id := createRandomString(SESSION_ID_LENGTH)
	session := &Session{
		ID:         id,
		GroupName:  groupName,
		LastActive: time.Now(),
	}
	s.store[id] = session

	return session
}

func (s *SessionService) Delete(id string) {
	delete(s.store, id)
}

func (s *SessionService) List() []Session {
	sessions := make([]Session, 0, len(s.store))
	for _, session := range s.store {
		sessions = append(sessions, *session)
	}
	return sessions
}

func (s *SessionService) nameExists(name string) bool {
	for _, session := range s.store {
		if session.GroupName == name {
			return true
		}
	}
	return false
}

func (s *SessionService) generateName() string {
	for {
		name := names.Generate(2)
		if !s.nameExists(name) {
			return name
		}
	}
}

func createRandomString(length int) string {
	seed := make([]byte, length)
	str := make([]byte, length)

	rand.Read(seed)

	for i := 0; i < length; i++ {
		str[i] = RANDOM_STRING_CHARS[int(seed[i])%len(RANDOM_STRING_CHARS)]
	}

	return string(str)
}

func withSession(ctx context.Context, session *Session) context.Context {
	return context.WithValue(ctx, ctxSessionKey, session)
}
func getSession(ctx context.Context) *Session {
	v := ctx.Value(ctxSessionKey)
	if v == nil {
		return nil
	}
	return v.(*Session)
}
