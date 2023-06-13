using Newtonsoft.Json;
using RabbitMQ.Client;

namespace Agency;

public static class Utils
{
    private static JsonSerializerSettings? _serializerSettings = new JsonSerializerSettings
    {
        ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver()
    };

    public static string GetAgencyName(string[] args)
    {
        if (args.Length >= 1) return args[0];
        Console.WriteLine("Please provide an agency name");
        Environment.Exit(1);

        return args[0];
    }
    
    public static string SerializeJson(object obj)
    {
        return JsonConvert.SerializeObject(obj, _serializerSettings);
    }
    
    public static void DeclareQueue(IModel channel, string queueName)
    {
        channel.QueueDeclare(
            queue: queueName,
            durable: false, // TODO - change to true
            exclusive: false,
            autoDelete: false,
            arguments: null
        );
    }
    
    public static void BindQueue(IModel channel, string queueName, string exchangeName, string routingKey)
    {
        channel.QueueBind(
            queue: queueName,
            exchange: exchangeName,
            routingKey: routingKey
        );
    }
    
    public static void SetupQueue(IModel channel, string queueName, string exchangeName, string routingKey)
    {
        DeclareQueue(channel, queueName);
        BindQueue(channel, queueName, exchangeName, routingKey);
    }
}
