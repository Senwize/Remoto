package sandbox

import (
	"crypto/rand"
	"errors"
	"net"
	"sync"
)

/*
	The sandbox service is responsible for:
		- keeping track what sandboxes are available
		- keeping sessions
*/

var (
	ErrNoSandboxFree   = errors.New("no sandbox free")
	ErrNotFound        = errors.New("sandbox not found")
	ErrSandboxReserved = errors.New("sandbox reserved")

	KEY_LENGTH = 16
)

// Sandbox ...
type Sandbox struct {
	IP       net.IP
	Reserved bool
}

// Service ...
type Service struct {
	storeLock sync.Locker
	store     []Sandbox
}

func New() *Service {
	return &Service{
		storeLock: &sync.Mutex{},
		store:     []Sandbox{},
	}
}

func (s *Service) List() []Sandbox {
	s.storeLock.Lock()
	defer s.storeLock.Unlock()

	return s.store
}

func (s *Service) ReserveFree() (*Sandbox, error) {
	s.storeLock.Lock()
	defer s.storeLock.Unlock()

	free := s.getFree()
	if free == nil {
		return nil, ErrNoSandboxFree
	}

	free.Reserved = true

	return free, nil
}

func (s *Service) Reserve(ip net.IP) (*Sandbox, error) {
	s.storeLock.Lock()
	defer s.storeLock.Unlock()

	if !s.exists(ip) {
		return nil, ErrNotFound
	}

	sandbox := s.get(ip)
	if sandbox.Reserved {
		return nil, ErrSandboxReserved
	}
	sandbox.Reserved = true

	return sandbox, nil
}

func (s *Service) Release(sandbox *Sandbox) {
	sandbox.Reserved = false
}

func (s *Service) Add(ip net.IP) {
	s.storeLock.Lock()
	defer s.storeLock.Unlock()

	s.store = append(s.store, Sandbox{
		IP: ip,
	})
}

func (s *Service) Delete(ip net.IP) {
	s.storeLock.Lock()
	defer s.storeLock.Unlock()

	for ix := range s.store {
		sandbox := &s.store[ix]
		if sandbox.IP.Equal(ip) {
			s.store[ix] = s.store[len(s.store)-1]
			s.store = s.store[:len(s.store)-1]
		}
	}
}

func (s *Service) getFree() *Sandbox {
	for ix := range s.store {
		sandbox := &s.store[ix]
		if !sandbox.Reserved {
			return sandbox
		}
	}
	return nil
}

func (s *Service) exists(ip net.IP) bool {
	for ix := range s.store {
		if s.store[ix].IP.Equal(ip) {
			return true
		}
	}
	return false
}

func (s *Service) get(ip net.IP) *Sandbox {
	for ix := range s.store {
		sandbox := &s.store[ix]
		if sandbox.IP.Equal(ip) {
			return sandbox
		}
	}
	return nil
}

var RANDOM_STRING_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func createRandomString(length int) string {
	seed := make([]byte, length)
	str := make([]byte, length)

	rand.Read(seed)

	for i := 0; i < length; i++ {
		str[i] = RANDOM_STRING_CHARS[int(seed[i])%len(RANDOM_STRING_CHARS)]
	}

	return string(str)
}
