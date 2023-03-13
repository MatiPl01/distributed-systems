package main

import (
	"chat/config"
	"flag"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"strconv"
)

type TCPConnection struct {
	nick string
	connection net.Conn
}

type UDPConnection struct {
	nick string
	address *net.UDPAddr
}

type Server struct {
	address string
	tcpListener *net.TCPListener
	udpListener *net.UDPConn
	tcpConnections map[string]*TCPConnection
	udpConnections map[string]*UDPConnection
}

type IServer interface {
	listen(port string) error
	close()
}

func createServer(address string) IServer {
	return &Server{
		address: address,
		tcpConnections: make(map[string]*TCPConnection),
		udpConnections: make(map[string]*UDPConnection),
	}
}	

func (s *Server) listen(port string) error {
	port_, err := strconv.Atoi(port)
	if err != nil {
		log.Fatal(fmt.Sprintf("Invalid port: %s", port))
	}

	err = s.listenTCP( port_)
	if err != nil {
		return err
	}

	err = s.listenUDP(port_)
	if err != nil {
		return err
	}

	s.handleConnections();

	return nil
}

func (s *Server) close() {
	s.tcpListener.Close()
	s.udpListener.Close()
	
	// Close all TCP connections
	for _, conn := range s.tcpConnections {
		conn.connection.Close()
	}
	// UDP connections aren't closed because UDP is connectionless
}

func (s *Server) listenTCP(port int) error {
	listener, err := net.ListenTCP("tcp", &net.TCPAddr{
		IP:   net.ParseIP(s.address),
		Port: port,
	})
	if err != nil {
		log.Fatal(fmt.Sprintf("Error listening on tcp port %d: %s", port, err))
	}

	s.tcpListener = listener
	fmt.Printf("Listening on tcp port %d...\n", port)
	return nil
}

func (s *Server) listenUDP(port int) error {
	listener, err := net.ListenUDP("udp", &net.UDPAddr{
		IP:   net.ParseIP(s.address),
		Port: port,
	})
	if err != nil {
		log.Fatal(fmt.Sprintf("Error listening on udp port %d: %s", port, err))
	}

	s.udpListener = listener
	fmt.Printf("Listening on udp port %d...\n", port)
	return nil
}

func (s *Server) handleConnections() {
	go s.acceptTCPConnections()
	s.handleUDPConnections()
}

func (s *Server) acceptTCPConnections() {
	for {
		conn, err := s.acceptTCP()
		if err != nil {
			log.Fatal(fmt.Sprintf("Error accepting tcp connection: %s", err))
		} else {
			go s.handleTCPConnection(conn)
		}
	}
}

func (s *Server) acceptTCP() (net.Conn, error) {
	conn, err := s.tcpListener.Accept()
	if err != nil {
		log.Fatal(fmt.Sprintf("Error accepting tcp connection: %s", err))
	}

	s.tcpConnections[conn.RemoteAddr().String()] = &TCPConnection{connection: conn}
	log.Printf("Accepted tcp connection from %s\n", conn.RemoteAddr().String())
	return conn, nil
}

func (s *Server) handleTCPConnection(conn net.Conn) {
	defer s.closeTCPConnection(conn)

	err := s.handleTCPUserNick(conn)
	if err != nil {
		return
	}

	for {
		msg, err := s.readTCPMessage(conn)
		if err != nil {
			if err != io.EOF {
				log.Fatal(fmt.Sprintf("Error reading from tcp connection: %s", err))
			}
			return
		}

		log.Printf("Received tcp message from %s (%s): %s\n", 
			conn.RemoteAddr().String(), 
			s.tcpConnections[conn.RemoteAddr().String()].nick, 
			msg,
		)

		// Send message to all other users
		err = s.sendTCPMessages(conn, msg);
		if err != nil {
			log.Fatal(fmt.Sprintf("Error sending tcp messages: %s", err))
		}
	}
}

func (s *Server) handleUDPConnections() {
	for {
		addr, msg, err := s.readUDPMessage()
		if err != nil {
			log.Fatal(fmt.Sprintf("Error reading from udp connection: %s", err))
		}

		if s.udpConnections[addr.String()] == nil {
			// Add the new connection and save the user nick
			s.handleNewUDPConnection(addr, msg)
		} else {
			fmt.Printf("Received udp message from %s (%s): %s\n", addr.String(), s.udpConnections[addr.String()].nick, msg)
			// Send message to all other users
			err = s.sendUDPMessages(addr, msg);
			if err != nil {
				log.Fatal(fmt.Sprintf("Error sending udp messages: %s", err))
			}
		}
	}
}

func (s *Server) readTCPMessage(conn net.Conn) (string, error) {
	// TODO - remove limit to 1024 characters
	buf := make([]byte, 1024)
	n, err := conn.Read(buf)

	if err != nil {
		if err == io.EOF {
			log.Printf("Connection closed by %s\n", conn.RemoteAddr().String())
			return "", err
		}
		log.Fatal(fmt.Sprintf("Error reading from tcp connection: %s", err))
		return "", err
	}

	return string(buf[:n]), nil
}

func (s *Server) handleTCPUserNick(conn net.Conn) error {
	nick, err := s.readTCPMessage(conn)
	if err != nil {
		if err == io.EOF {
			return err
		}
		return err
	}

	// Check if nick is already taken
	for _, otherConn := range s.tcpConnections {
		if nick == otherConn.nick {
			err := fmt.Errorf("Nick %s is already taken", nick)
			log.Println("Error handling tcp connection:", err)
			conn.Write([]byte(fmt.Sprintf("SERVER: %s", err)))
			return err
		}
	}

	// Update the nickname in the TCP connection
	s.tcpConnections[conn.RemoteAddr().String()].nick = nick
	log.Printf("Received tcp nickname from %s: %s\n", conn.RemoteAddr().String(), nick)
	return nil
}

func (s *Server) handleNewUDPConnection(addr *net.UDPAddr, nick string) error {
	// Check if nick is already taken
	for _, conn := range s.udpConnections {
		if conn.nick == nick {
			err := fmt.Errorf("Nick %s is already taken", nick)
			log.Println("Error handling udp connection:", err)
			s.udpListener.WriteToUDP([]byte(fmt.Sprintf("SERVER: %s", err)), addr)
			return err
		}
	}	

	s.udpConnections[addr.String()] = &UDPConnection{address: addr, nick: nick}
	log.Printf("Received udp nickname from %s: %s\n", addr.String(), nick)
	return nil
}

func (s *Server) readUDPMessage() (addr *net.UDPAddr, msg string, err error) {
	// TODO - remove limit to 1024 characters
	buf := make([]byte, 1024)
	n, addr, err := s.udpListener.ReadFromUDP(buf)
	
	if err != nil {
		log.Fatal(fmt.Sprintf("Error reading from udp connection: %s", err))
	}

	return addr, string(buf[:n]), nil
}

func (s *Server) sendTCPMessages(conn net.Conn, msg string) error {
	for _, otherConn := range s.tcpConnections {
		if conn.RemoteAddr().String() == otherConn.connection.RemoteAddr().String() {
			continue
		}

		log.Printf("Sending tcp message to: %s (%s)\n", otherConn.connection.RemoteAddr().String(), otherConn.nick)

		_, err := otherConn.connection.Write([]byte(fmt.Sprintf("%s: %s", s.tcpConnections[conn.RemoteAddr().String()].nick, msg)))
		if err != nil {
			log.Fatal(fmt.Sprintf("Error writing to tcp connection: %s", err))
		}
	}

	return nil
}

func (s *Server) sendUDPMessages(addr net.Addr, msg string) error {
	for _, conn := range s.udpConnections {
		if conn.address.String() == addr.String() {
			continue
		}

		log.Printf("Sending udp message to: %s (%s)\n", conn.address.String(), conn.nick)

		_, err := s.udpListener.WriteToUDP([]byte(fmt.Sprintf("%s: %s", s.udpConnections[addr.String()].nick, msg)), conn.address)
		if err != nil {
			log.Fatal(fmt.Sprintf("Error writing to udp connection: %s", err))
		}
	}

	return nil
}

func (s *Server) closeTCPConnection(conn net.Conn) {
	conn.Close()
	delete(s.tcpConnections, conn.RemoteAddr().String())
	log.Printf("Closed connection for %s\n", conn.RemoteAddr().String())
}


func main() {
	// Load config from env
	config.LoadConfig()

	// Parse command line arguments
	port := flag.String("port", os.Getenv("PORT"), "The server port")
	address := flag.String("address", os.Getenv("ADDRESS"), "The server address")

	// create server
	server := createServer(*address)
	defer server.close()

	// Handle connections
	server.listen(*port)
}
