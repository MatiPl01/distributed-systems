package main

import (
	"bufio"
	"flag"
	"fmt"
	"log"
	"net"
	"os"
)

type Client struct {
	nick string
	connection net.Conn
}

type IClient interface {
	connect(address string) error
}

func createClient(nick string) IClient {
	return &Client{
		nick: nick,
	}
}

func (c *Client) connect(address string) error {
	conn, err := net.Dial("tcp", address)
	if err != nil {
		log.Fatal(fmt.Errorf("Error connecting to the server: %v", err))
		return err
	}
	c.connection = conn
	fmt.Println("Connected to the server")

	defer c.close(0) // Close the connection when the program exits

	// Handle responses from the server in a separate goroutine (thread)
	go c.handleResponses()
	c.handleRequests()

	return nil // If no error
}

func (c *Client) handleRequests() {
	// Introduce the client
	err := c.introduce()
	if err != nil {
		log.Fatal(err)
		return
	}

	scanner := bufio.NewScanner(os.Stdin)
	fmt.Print(">>> ")
	
	for scanner.Scan() {
		line := scanner.Text()
		if line == "exit" {
			c.close(0)
			return
		}

		err := c.sendMessage(line)
		if err != nil {
			log.Fatal(err)
			return
		}
		
		fmt.Print(">>> ")
	}
}

func (c *Client) handleResponses() {
	buf := make([]byte, 1024)
	
	for {
		n, err := c.connection.Read(buf)

		if err != nil {
			if err.Error() == "EOF" {
				fmt.Println("Connection was closed by the server")
				c.close(1)
				return
			}

			if c.connection == nil {
				return
			}

			log.Fatal(fmt.Errorf("Error reading from the server: %v", err))
			return
		}

		fmt.Printf("\b\b\b\b%v\n", string(buf[:n]))
		fmt.Print(">>> ")
	}
}

func (c *Client) close(status int) {
	// Close the connection when the program exits
	c.connection.Close()
	c.connection = nil
	os.Exit(status)
}

func (c *Client) introduce() error {
	_, err := c.connection.Write([]byte(c.nick))
	
	if err != nil {
		return fmt.Errorf("Failed to send user nickname to the server: %v", err)
	}

	return nil // If no error
}

func (c *Client) sendMessage(message string) error {
	_, err := c.connection.Write([]byte(message))
	
	if err != nil {
		return fmt.Errorf("Failed to send message to the server: %v", err)
	}

	return nil // If no error
}

func main() {
	// Parse the command line arguments
	port := flag.String("port", "8080", "The server port")
	nick := flag.String("nick", "Anonymous", "The user's nickname")
	flag.Parse()

	// Create a client
	client := createClient(*nick)
	client.connect("localhost:" + *port)
}
