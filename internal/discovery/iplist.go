package discovery

import "net"

type ipList []net.IP

func (l ipList) Contains(ip net.IP) bool {
	for _, i := range l {
		if i.Equal(ip) {
			return true
		}
	}
	return false
}

func (l ipList) Subtract(other ipList) ipList {
	var result ipList
	for _, ip := range l {
		if !other.Contains(ip) {
			result = append(result, ip)
		}
	}
	return result
}
