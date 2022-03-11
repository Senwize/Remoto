package discovery

import (
	"log"
	"net"
	"sync"
)

// Service ...
type Service struct {
	svcLock sync.Locker
	svcMap  map[string]ipList

	OnDiscover func(fqdn string, ip net.IP)
	OnLost     func(fqdn string, ip net.IP)
}

func New() *Service {
	return &Service{
		svcLock: &sync.Mutex{},
		svcMap:  make(map[string]ipList),
	}
}

func (s *Service) Add(fqdn string) {
	s.svcLock.Lock()
	defer s.svcLock.Unlock()

	// Service already in discovery list
	if _, exists := s.svcMap[fqdn]; exists {
		return
	}
	s.svcMap[fqdn] = ipList{}
}

func (s *Service) Refresh() {
	s.svcLock.Lock()
	defer s.svcLock.Unlock()

	for fqdn := range s.svcMap {
		// Find IPs for this FQDN
		foundIPs, err := net.LookupIP(fqdn)
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
		newIPs := ips.Subtract(s.svcMap[fqdn])
		lostIPs := s.svcMap[fqdn].Subtract(ips)

		// Update service map
		s.svcMap[fqdn] = ips

		// Call listeners
		if s.OnDiscover != nil {
			for _, ip := range newIPs {
				s.OnDiscover(fqdn, ip)
			}
		}
		if s.OnLost != nil {
			for _, ip := range lostIPs {
				s.OnLost(fqdn, ip)
			}
		}

	}
}

func (s *Service) Get(fqdn string) []net.IP {
	s.svcLock.Lock()
	defer s.svcLock.Unlock()

	return s.svcMap[fqdn]
}
