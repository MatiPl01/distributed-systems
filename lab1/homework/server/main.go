package main

import (
	"flag"
	"fmt"
	"log"
	"net"
)

type Client struct {
	nick string
	connection net.Conn
}

type Server struct {
	listener net.Listener
	clients map[net.Addr]*Client
}

type IServer interface {
	listen(port string) error
}

func createServer() IServer {
	return &Server{
		clients: make(map[net.Addr]*Client),
	}
}

func (s *Server) listen(port string) error {
	// Start the server
	listener, err := net.Listen("tcp", fmt.Sprintf(":%v", port))
	if err != nil {
		log.Fatal(fmt.Errorf("Error starting server: %v", err))
		return err
	}

	s.listener = listener
	fmt.Println("Server started on port", port)

	// Accept connections
	s.accept()

	// Close the server when the program exits
	defer s.close()

	return nil // If no error
}

func (s *Server) close() {
	// Close the server when the program exits
	s.listener.Close()
}

func (s *Server) accept() {
	// Handle connections
	for {
		conn, err := s.listener.Accept()
		if err != nil {
			log.Fatal(fmt.Errorf("Error accepting connection from %v: %v", conn.RemoteAddr(), err))
			continue
		}
		fmt.Println("Connection accepted from:", conn.RemoteAddr())

		// Add the connection to the map
		s.clients[conn.RemoteAddr()] = &Client{
			connection: conn,
		}

		// Handle the connection in a separate goroutine (thread)
		go s.handleConnection(conn)
	}
}

func (s *Server) handleConnection(conn net.Conn) {
	buf := make([]byte, 1024)
	
	for {
		n, err := conn.Read(buf)
		
		if err != nil {
			if err.Error() == "EOF" {
				fmt.Println("Connection", conn.RemoteAddr(), "was closed by the client", s.clients[conn.RemoteAddr()].nick)
				s.removeClient(conn)
				return
			}
			
			log.Fatal(fmt.Errorf("Error reading from %v: %v", conn.RemoteAddr(), err))
			s.removeClient(conn)
			return
		}
		
		// The first received message will be the client's nickname
		// If the client has not introduced itself, save the nickname
		if (s.clients[conn.RemoteAddr()].nick == "") {
			nick := string(buf[:n])
			if !s.verifyNickname(nick) {
				fmt.Printf("Nickname %v already taken\n", nick)
				conn.Write([]byte("ERROR: Nickname already taken"))
				s.removeClient(conn)
				return
			}
			s.clients[conn.RemoteAddr()].nick = string(buf[:n])
			fmt.Println("User", s.clients[conn.RemoteAddr()].nick, "connected")
			continue
		}

		// Send the message to all the clients
		for _, client := range s.clients {
			if client.nick != s.clients[conn.RemoteAddr()].nick {
				fmt.Println("Sending message to", client.nick)
				client.connection.Write([]byte(s.clients[conn.RemoteAddr()].nick + ": " + string(buf[:n])))
			}
		}
	}
}

func (s *Server) verifyNickname(nick string) bool {
	for _, client := range s.clients {
		if client.nick == nick {
			return false
		}
	}
	return true
}

func (s *Server) removeClient(conn net.Conn) {
	fmt.Printf("Removing connection %v\n", conn.RemoteAddr())
	conn.Close()
	delete(s.clients, conn.RemoteAddr())
}

func main() {
	// Parse command line arguments
	port := flag.String("port", "8080", "The server port")
	flag.Parse()

	// Create a new server
	server := createServer()
	server.listen(*port)
}
