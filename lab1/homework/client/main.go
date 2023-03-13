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

const INTERFACE_TO_USE = "en0"

const UDP_UNICAST_ART = `
     / \
    / _ \
   | / \ |
   ||   || _______
   ||   || |\     \
   ||   || ||\     \
   ||   || || \    |
   ||   || ||  \__/
   ||   || ||   ||
    \\_/ \_/ \_//
   /   _     _   \
  /               \
  |    O     O    |
  |   \  ___  /   |                           
 /     \ \_/ /     \
/  -----  |  --\    \
|     \__/|\__/ \   |
\       |_|_|       /
 \_____       _____/
       \     /
       |     |
`

const UDP_MULTICAST_ART = `
 __                 
'. \                
 '- \               
  / /_         .---.
 / | \\,.\/--.//    )
 |  \//        )/  / 
  \  ' ^ ^    /    )____.----..  6
   '.____.    .___/            \._) 
      .\/.                      )
       '\                       /
       _/ \/    ).        )    (
      /#  .!    |        /\    /
      \  C// #  /'-----''/ #  / 
   .   'C/ |    |    |   |    |mrf  ,
   \), .. .'OOO-'. ..'OOO'OOO-'. ..\(,
`

type Protocol string

const (
	TCP Protocol = "tcp"
	UDP Protocol = "udp"
)
type Client struct {
	nick string
	tcpConn *net.TCPConn // TCP unicast
	udpConn *net.UDPConn // UDP unicast
	udpMulticastSenderConn *net.UDPConn // UDP multicast sender
	udpMulticastReceiverConn *net.UDPConn // UDP multicast receiver
}

type IClient interface {
	connect(protocol Protocol, address string, port string)
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

func (c *Client) connect(protocol Protocol, address string, port string) {
	port_, err := strconv.Atoi(port)
	if err != nil {
		log.Fatal(fmt.Sprintf("Invalid port: %s", port))
	}
	address_ := net.ParseIP(address)

	switch protocol {
	case TCP:
		err = c.connectTCP(address_, port_)
	case UDP:
		if (address_.IsMulticast()) {
			err = c.connectMulticast(address_, port_)
		} else {
			err = c.connectUDP(address_, port_)
		}
	}

	if err != nil {
		log.Fatal(fmt.Sprintf("Error connecting to %s://%s:%s: %v", protocol, address, port, err))
	}

	fmt.Println(fmt.Sprintf("Connected to %s://%s:%s", protocol, address, port))
}

func (c *Client) connectTCP(address net.IP, port int) error {
	conn, err := net.DialTCP("tcp", nil, &net.TCPAddr{
		IP:   address,
		Port: port,
	})
	if (err == nil) {
		c.tcpConn = conn
		c.sendUnicast(TCP, c.nick)
	}
	return err
}

func (c *Client) connectUDP(address net.IP, port int) error {
	conn, err := net.DialUDP("udp", nil, &net.UDPAddr{
		IP:   address,
		Port: port,
	})
	if (err == nil) {
		c.udpConn = conn
		c.sendUnicast(UDP, c.nick)
	}
	return err
}

func (c *Client) connectMulticast(address net.IP, port int) error {
	// Get interface name
	ifi, err := net.InterfaceByName("en0")
	if (err != nil) {
		return err
	}

	// Create UDP receiver connection
	conn, err := net.ListenMulticastUDP("udp", ifi, &net.UDPAddr{
		IP:   address,
		Port: port,
	})
	if (err != nil) {
		return err
	}
	c.udpMulticastReceiverConn = conn

	// Create UDP sender connection
	conn, err = net.DialUDP("udp", nil, &net.UDPAddr{
		IP:   address,
		Port: port,
	})
	if (err != nil) {
		return err
	}
	c.udpMulticastSenderConn = conn

	return nil
}

func (c *Client) sendUnicast(protocol Protocol, message string) error {
	var conn net.Conn

	switch protocol {
	case TCP:
		conn = c.tcpConn
	case UDP:
		conn = c.udpConn
	}

	_, err := conn.Write([]byte(message))
	return err
}

func (c *Client) sendMulticast(message string) error {
	// Send the nickname
	_, err := c.udpMulticastSenderConn.Write([]byte(c.nick))
	if err != nil {
		return err
	}

	// Send the message
	_, err = c.udpMulticastSenderConn.Write([]byte(message))
	return err
}

func (c *Client) receiveUnicast(protocol Protocol) error {
	var conn net.Conn

	switch protocol {
	case TCP:
		conn = c.tcpConn
	case UDP:
		conn = c.udpConn
	}

	// Receive the message
	msg, err := receiveMessage(conn)
	if err != nil {
		return err
	}

	printMessage(msg)
	return nil
}

func (c *Client) receiveMulticast() error {
	// Receive the nickname
	nick, err := receiveMessage(c.udpMulticastReceiverConn)
	if err != nil {
		return err
	}

	// Receive the message
	msg, err := receiveMessage(c.udpMulticastReceiverConn)
	if err != nil {
		return err
	}

	// Print the message
	if nick != c.nick {
		printMessage(fmt.Sprintf("%s: %s", nick, msg))
	}

	return nil
}

func (c *Client) disconnect() {
	fmt.Println("\b\b\b\bDisconnecting...")
	
	if c.tcpConn != nil {
		c.tcpConn.Close()
		c.tcpConn = nil
	}
	if c.udpConn != nil {
		c.udpConn.Close()
		c.udpConn = nil
	}
	if c.udpMulticastSenderConn != nil {
		c.udpMulticastSenderConn.Close()
		c.udpMulticastSenderConn = nil
	}
	if c.udpMulticastReceiverConn != nil {
		c.udpMulticastReceiverConn.Close()
		c.udpMulticastReceiverConn = nil
	}

	fmt.Println("Disconnected")
}


type InputHandler func(string) error

type ConnectionHandler struct {
	client *Client
}

type IConnectionHandler interface {
	handle()
}

func createConnectionHandler(client *Client) IConnectionHandler {
	return &ConnectionHandler{
		client: client,
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
	go h.udpReceiverLoop()
	go h.multicastReceiverLoop()
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
	err := h.client.sendUnicast(UDP, UDP_UNICAST_ART)
	if err != nil {
		return fmt.Errorf("Error sending UDP: %s", err)
	}
	return nil
}

func (h *ConnectionHandler) handleSendMulticast(string) error {
	fmt.Println("Sending multicast...")
	err := h.client.sendMulticast(UDP_MULTICAST_ART)
	if err != nil {
		return fmt.Errorf("Error sending multicast: %s", err)
	}
	return nil
}

func (h *ConnectionHandler) handleSendTCP(msg string) error {
	fmt.Println("Sending TCP...")
	err := h.client.sendUnicast(TCP, msg)
	if err != nil {
		return fmt.Errorf("Error sending TCP: %s", err)
	}
	return nil
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

func receiveMessage(conn net.Conn) (string, error) {
	if conn == nil { // Return if connection was closed
		return "", nil
	}

	buf := make([]byte, 1024)
	n, err := conn.Read(buf)
	if err != nil {
		return "", err
	}

	return string(buf[:n]), nil
}

func printMessage(msg string) {
	fmt.Printf("\b\b\b\b%v\n", msg)
	fmt.Print(">>> ")
}


func main() {
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
	ch := createConnectionHandler(client.getInstance())
	ch.handle()
}
