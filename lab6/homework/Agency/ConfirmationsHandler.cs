using System.Text;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Agency;

public class ConfirmationsHandler
{
    private readonly string _queueName;
    private readonly IModel _channel;

    public ConfirmationsHandler(string queueName, IModel channel)
    {
        _queueName = queueName;
        _channel = channel;
    }

    public void HandleConfirmations()
    {
        var consumer = new EventingBasicConsumer(_channel);
        consumer.Received += (_, ea) =>
        {
            var body = ea.Body.ToArray();
            var message = Encoding.UTF8.GetString(body);
            var routingKey = ea.RoutingKey;
            Console.WriteLine($"\b\b\b\b [x] Received '{routingKey}':'{message}'");
            Console.Write(">>> ");
        };
        
        _channel.BasicConsume(
            queue: _queueName,
            autoAck: true, // TODO - remove auto ack
            consumer: consumer
        );
        
        Console.WriteLine("[*] Started listening for confirmations");
    }
}
