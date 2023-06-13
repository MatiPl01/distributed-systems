﻿using System.Text;
using Agency;
using RabbitMQ.Client;
using Constants = Agency.Constants;

// INITIALIZATION
// Create a connection to RabbitMQ
var factory = new ConnectionFactory { HostName = Constants.RabbitMqHost };
        
using var connection = factory.CreateConnection();
using var channel = connection.CreateModel();

// Get the agency name from the command line arguments
var agencyName = Utils.GetAgencyName(args);

// EXCHANGES
// Agency requests exchange
channel.ExchangeDeclare(
    exchange: Constants.AgencyRequestsExchangeName, 
    type: ExchangeType.Direct
);
// Carrier confirmations exchange
channel.ExchangeDeclare(
    exchange: Constants.CarrierConfirmationsExchangeName, 
    type: ExchangeType.Topic
);
// Admin agencies exchange
channel.ExchangeDeclare(
    exchange: Constants.AdminAgenciesNotificationsExchangeName, 
    type: ExchangeType.Fanout
);

// QUEUES
// Setup queues
// Confirmations queue
var confirmationsQueueName = $"{agencyName}_confirmations_queue";
Utils.SetupQueue(
    channel, 
    queueName: confirmationsQueueName, 
    exchangeName: Constants.CarrierConfirmationsExchangeName, 
    routingKey: $"confirmation.{agencyName}"
);
// Admin notifications queue
var adminNotificationsQueueName = $"{agencyName}_admin_queue";
Utils.SetupQueue(
    channel, 
    queueName: adminNotificationsQueueName, 
    exchangeName: Constants.AdminAgenciesNotificationsExchangeName
);

Console.WriteLine($"[*] {agencyName} started.");

// Create the requests confirmations handler
var confirmationsHandler = new ConfirmationsHandler(
    confirmationsQueueName, 
    channel
);
confirmationsHandler.HandleConfirmations();

// Create the admin notifications handler
var adminNotificationsHandler = new AdminNotificationsHandler(
    adminNotificationsQueueName, 
    channel
);
adminNotificationsHandler.HandleNotifications();

// Create the request manager
var requestManager = new RequestManager(
    agencyName, 
    Constants.AgencyRequestsExchangeName, 
    channel
);

// Create an array of request types
var requestTypes = new[]
{
    RequestType.PassengerTransport,
    RequestType.CargoTransport,
    RequestType.SatelliteLaunch
};

// Read requests from the console and publish them
while (true)
{
    Console.WriteLine("Enter a request type (1 - passenger, 2 - cargo, 3 - satellite) or 'exit' to quit");
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
