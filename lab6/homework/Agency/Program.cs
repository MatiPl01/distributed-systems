using Agency;
using RabbitMQ.Client;
using Constants = Agency.Constants;

// INITIALIZATION
// Create a connection to RabbitMQ
var factory = new ConnectionFactory { HostName = Constants.RabbitMqHost };
        
using var connection = factory.CreateConnection();
using var channel = connection.CreateModel();

// Create an exchange
channel.ExchangeDeclare(
    exchange: Constants.AgencyRequestsExchange, 
    type: ExchangeType.Direct
);

// Declare and bind queues (one queue per request type)
foreach (var kvp in Constants.QueueBindings)
{
    // Declare the queue
    QueueUtils.DeclareQueue(channel, kvp.Key);
    // Bind the queue to the exchange
    QueueUtils.BindQueue(channel, kvp.Key, Constants.AgencyRequestsExchange, kvp.Value);
}

// PUBLISHING
// Create the request manager
var requestManager = new RequestManager(channel, Constants.AgencyRequestsExchange);

// Create an array of request types
var requestTypes = new[]
{
    RequestType.PassengerTransport,
    RequestType.CargoTransport,
    RequestType.EmergencyTransport
};

// Read requests from the console and publish them
while (true)
{
    Console.WriteLine("Enter a request type (1 - passenger, 2 - cargo, 3 - emergency) or 'exit' to quit");
    Console.Write(">>> ");

    var input = Console.ReadLine();
    if (input == "exit")
    {
        Console.WriteLine("Exiting...");
        break;
    }
    
    if (!int.TryParse(input, out var requestTypeIndex) || requestTypeIndex < 1 || requestTypeIndex > 3)
    {
        Console.WriteLine("Invalid input");
        continue;
    }
    
    var requestType = requestTypes[requestTypeIndex - 1];
    requestManager.SendRequest(requestType);
}
