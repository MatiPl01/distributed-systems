using System.Text;
using Newtonsoft.Json;
using RabbitMQ.Client;

namespace Agency;

public enum RequestType
{
    PassengerTransport,
    CargoTransport,
    SatelliteLaunch,
}

public class RequestManager
{
    private readonly string _agencyName;
    private readonly IModel _channel;
    private readonly string _exchangeName;

    public RequestManager(string agencyName, string exchangeName, IModel channel)
    {
        _agencyName = agencyName;
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
            RequestType.SatelliteLaunch => "satellite",
            _ => throw new ArgumentOutOfRangeException(nameof(requestType), requestType, null)
        };
        
        // Make message persistent
        var properties = _channel.CreateBasicProperties();
        properties.Persistent = true;
        
        // Create the request
        var request = new AgencyRequest(_agencyName);
        
        // Convert the message to JSON
        var jsonRequest = Utils.SerializeJson(request);
        var body = Encoding.UTF8.GetBytes(jsonRequest);

        // Publish the message
        _channel.BasicPublish(
            exchange: _exchangeName,
            routingKey: routingKey,
            basicProperties: null,
            body: body
        );
        
        Console.WriteLine($" [x] Sent {jsonRequest} to {routingKey}");
    }
}
