using System.Text;
using Newtonsoft.Json;
using RabbitMQ.Client;

namespace Agency;

public enum RequestType
{
    PassengerTransport,
    CargoTransport,
    EmergencyTransport
}

public class RequestManager
{
    private readonly IModel _channel;
    private readonly string _exchangeName;

    public RequestManager(IModel channel, string exchangeName)
    {
        _channel = channel;
        _exchangeName = exchangeName;
    }

    public void SendRequest(RequestType requestType)
    {
        // Select the routing key based on the request type
        var routingKey = requestType switch
        {
            RequestType.PassengerTransport => "passenger",
            RequestType.CargoTransport => "cargo",
            RequestType.EmergencyTransport => "emergency",
            _ => throw new ArgumentOutOfRangeException(nameof(requestType), requestType, null)
        };
        
        // Make message persistent
        var properties = _channel.CreateBasicProperties();
        properties.Persistent = true;
        
        // Create the request
        var request = new Request(requestType.ToString());
        
        // Convert the message to JSON
        var jsonOrder = JsonConvert.SerializeObject(request);
        var body = Encoding.UTF8.GetBytes(jsonOrder);

        // Publish the message
        _channel.BasicPublish(
            exchange: _exchangeName,
            routingKey: routingKey,
            basicProperties: null,
            body: body
        );
        
        Console.WriteLine($" [x] Sent {requestType} request");
    }
}
