package discovery

import (
	"log"
	"net"
	"sync"
)

// Service ...
type Service struct {
	svcLock   sync.Locker
	ipMap     map[string]ipList
	domainMap map[string]string

	OnDiscover func(domain string, ip net.IP)
	OnLost     func(domain string, ip net.IP)
}

func New() *Service {
	return &Service{
		svcLock:   &sync.Mutex{},
		ipMap:     make(map[string]ipList),
		domainMap: make(map[string]string),
	}
}

func (s *Service) Add(svc, domain string) {
	s.svcLock.Lock()
	defer s.svcLock.Unlock()

	if _, exists := s.domainMap[svc]; exists {
		return
	}

	// Register svc to domain
	s.domainMap[svc] = domain
	s.ipMap[svc] = ipList{}
}

func (s *Service) Refresh() {
	s.svcLock.Lock()
	defer s.svcLock.Unlock()

	for svc := range s.ipMap {
		// Find IPs for this Domain
		domain := s.domainMap[svc]
		foundIPs, err := net.LookupIP(domain)
		if err != nil {
			log.Printf("Error while refreshing service: %s", err)
			continue
		}

		// Filter IPV4
		var ips = make(ipList, 0, len(foundIPs))
		for _, ip := range foundIPs {
			if ip.To4() != nil {
				ips = append(ips, ip)
			}
		}

		// Find new and lost IPs
		newIPs := ips.Subtract(s.ipMap[svc])
		lostIPs := s.ipMap[svc].Subtract(ips)

		// Update service map
		s.ipMap[svc] = ips

		// Call listeners
		if s.OnDiscover != nil {
			for _, ip := range newIPs {
				s.OnDiscover(svc, ip)
			}
		}
		if s.OnLost != nil {
			for _, ip := range lostIPs {
				s.OnLost(svc, ip)
			}
		}

	}
}

func (s *Service) Get(svc string) []net.IP {
	s.svcLock.Lock()
	defer s.svcLock.Unlock()

	return s.ipMap[svc]
}
