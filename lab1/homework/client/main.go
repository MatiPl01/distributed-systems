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

type Protocol string

const (
	TCP Protocol = "tcp"
	UDP Protocol = "udp"
)

type Client struct {
	nick string
	tcpConn net.TCPConn // TCP unicast
	udpConn net.UDPConn // UDP unicast
	udpMulticastConn net.UDPConn // UDP multicast
}

type IClient interface {
	connect(protocol Protocol, address string, port string) error
	getInstance() *Client
	disconnect()
}

func createClient(nick string) IClient {
	return &Client{
		nick: nick,
	}
}

func (c *Client) getInstance() *Client {
	return c
}

func (c *Client) connect(protocol Protocol, address string, port string) error {
	var err error

	port_, err := strconv.Atoi(port)
	if err != nil {
		log.Fatal(fmt.Sprintf("Invalid port: %s", port))
	}

	switch protocol {
	case TCP:
		fmt.Println("Connecting to TCP...")
		var conn *net.TCPConn
		conn, err = net.DialTCP(string(protocol), nil, &net.TCPAddr{
			IP:   net.ParseIP(address),
			Port: port_,
		})
		if (err == nil) {
			c.tcpConn = *conn
			c.sendUnicast(TCP, c.nick)
		}
	case UDP:
		fmt.Println("Connecting to UDP...")
		var conn *net.UDPConn
		conn, err = net.DialUDP(string(protocol), nil, &net.UDPAddr{
			IP:   net.ParseIP(address),
			Port: port_,
		})
		if (err == nil) {
			c.udpConn = *conn
			c.sendUnicast(UDP, c.nick)
		}
	}

	if err != nil {
		log.Fatal(fmt.Sprintf("Error connecting to %s://%s:%s", protocol, address, port))
	}

	fmt.Println(fmt.Sprintf("Connected to %s://%s:%s", protocol, address, port))
	return nil
}

func (c *Client) sendUnicast(protocol Protocol, message string) error {
	var conn = selectConnection(*c, protocol)

	_, err := conn.Write([]byte(message))
	if err != nil {
		log.Fatal(fmt.Sprintf("Error sending message: %s", message))
	}
	return nil
}

func (c *Client) sendMulticast(message string) error {
	_, err := c.udpMulticastConn.Write([]byte(message))
	if err != nil {
		return err
	}
	return nil
}

func (c *Client) receiveUnicast(protocol Protocol) error {
	return receiveMessage(selectConnection(*c, protocol))
}

func (c *Client) receiveMulticast() error {
	return receiveMessage(&c.udpMulticastConn)
}

func (c *Client) disconnect() {
	fmt.Println("\b\b\b\bDisconnecting...")
	c.tcpConn.Close()
	c.udpConn.Close()
	c.udpMulticastConn.Close()
}


type InputHandler func(string) error

type ConnectionHandler struct {
	client *Client
	asciiArt string
}

type IConnectionHandler interface {
	handle()
}

func createConnectionHandler(client *Client, asciiArt string) IConnectionHandler {
	return &ConnectionHandler{
		client: client,
		asciiArt: asciiArt,
	}
}

func (h *ConnectionHandler) senderLoop() {
	handlers := map[string]InputHandler{
		"exit": h.handleExit,
		"U": h.handleSendUDP,
		"M": h.handleSendMulticast,
	}

	for {
		var message string
		var handler InputHandler
		fmt.Print(">>> ")
		fmt.Scanln(&message)
		
		handler, ok := handlers[message]
		if !ok {
			handler = h.handleSendTCP
		}

		err := handler(message)
		if err != nil {
			log.Fatal(err)
		}
	}
}

func (h *ConnectionHandler) tcpReceiverLoop() {
	for {
		h.catchReceiveError(h.client.receiveUnicast(TCP))
	}
}

func (h *ConnectionHandler) udpReceiverLoop() {
	for {
		h.catchReceiveError(h.client.receiveUnicast(UDP))
	}
}

func (h *ConnectionHandler) multicastReceiverLoop() {
	for {
		h.catchReceiveError(h.client.receiveMulticast())
	}
}

func (h *ConnectionHandler) handle() {
	fmt.Println("Starting connection handler...")
	go h.tcpReceiverLoop()
	// go h.udpReceiverLoop()
	// go h.multicastReceiverLoop()
	h.senderLoop()
}

func (h *ConnectionHandler) handleExit(string) error {
	fmt.Println("Exiting...")
	h.client.disconnect()
	os.Exit(0)
	return nil
}

func (h *ConnectionHandler) handleSendUDP(string) error {
	fmt.Println("Sending UDP...")
	return h.client.sendUnicast(UDP, h.asciiArt)
}

func (h *ConnectionHandler) handleSendMulticast(string) error {
	fmt.Println("Sending multicast...")
	return h.client.sendMulticast(h.asciiArt)
}

func (h *ConnectionHandler) handleSendTCP(msg string) error {
	fmt.Println("Sending TCP...")
	return h.client.sendUnicast(TCP, msg)
}

func (h *ConnectionHandler) catchReceiveError(err error) {
	if err == nil {
		return
	}
	if err == io.EOF {
		h.client.disconnect()
		fmt.Println("Connection closed by the server")
		os.Exit(0)
	} else {
		log.Fatal(fmt.Sprintf("Error receiving message: %s", err))
	}
}

func selectConnection(c Client, protocol Protocol) net.Conn {
	switch protocol {
	case TCP:
		return &c.tcpConn
	case UDP:
		return &c.udpConn
	}
	return nil
}

func receiveMessage(conn net.Conn) error {
	// TODO - improve to allow reading any number of bytes
	buf := make([]byte, 1024)
	n, err := conn.Read(buf)
	if err != nil {
		return err
	}

	// TODO - return string instead of printing
	fmt.Printf("\b\b\b\b%v\n", string(buf[:n]))
	fmt.Print(">>> ")
	return nil
}


func main() {
	art := `                ____                    
						____ \__ \
						\__ \__/ / __
						__/ ____ \ \ \    ____
					/ __ \__ \ \/ / __ \__ \
			____ \ \ \__/ / __ \/ / __/ / __
____ \__ \ \/ ____ \/ / __/ / __ \ \ \
\__ \__/ / __ \__ \__/ / __ \ \ \ \/
__/ ____ \ \ \__/ ____ \ \ \ \/ / __
/ __ \__ \ \/ ____ \__ \ \/ / __ \/ /
\ \ \__/ / __ \__ \__/ / __ \ \ \__/
\/ ____ \/ / __/ ____ \ \ \ \/ ____
		\__ \__/ / __ \__ \ \/ / __ \__ \
		__/ ____ \ \ \__/ / __ \/ / __/ / __
	/ __ \__ \ \/ ____ \/ / __/ / __ \/ /
	\/ / __/ / __ \__ \__/ / __ \/ / __/
	__/ / __ \ \ \__/ ____ \ \ \__/ / __
	/ __ \ \ \ \/ ____ \__ \ \/ ____ \/ /
	\ \ \ \/ / __ \__ \__/ / __ \__ \__/
	\/ / __ \/ / __/ ____ \ \ \__/
			\ \ \__/ / __ \__ \ \/
			\/      \ \ \__/ / __
								\/ ____ \/ /
									\__ \__/
									__/`

	// Load config from env
	config.LoadConfig()

	// Parse command line arguments
	nick := flag.String("nick", "Anonymous", "The client nickname")
	port := flag.String("port", os.Getenv("PORT"), "The server port")
	address := flag.String("address", os.Getenv("ADDRESS"), "The server address")
	multicastAddress := flag.String("m_address", os.Getenv("MULTICAST_ADDRESS"), "The multicast address")
	multicastPort := flag.String("m_port", os.Getenv("MULTICAST_PORT"), "The multicast port")
	flag.Parse()

	// Crate client
	client := createClient(*nick)
	client.connect(TCP, *address, *port)
	client.connect(UDP, *address, *port)
	client.connect(UDP, *multicastAddress, *multicastPort)
	defer client.disconnect() // Disconnect on exit

	// Handle connection
	ch := createConnectionHandler(client.getInstance(), art)
	ch.handle()
}

// TODO - move shared code to a separate file
