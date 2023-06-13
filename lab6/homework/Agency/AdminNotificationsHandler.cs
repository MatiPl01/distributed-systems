using System.Text;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Agency;

public class AdminNotificationsHandler
{
    private readonly string _queueName;
    private readonly IModel _channel;

    public AdminNotificationsHandler(string queueName, IModel channel)
    {
        _queueName = queueName;
        _channel = channel;
    }

    public void HandleNotifications()
    {
        var consumer = new EventingBasicConsumer(_channel);
        consumer.Received += (_, ea) =>
        {
            var body = ea.Body.ToArray();
            var message = Encoding.UTF8.GetString(body);
            var routingKey = ea.RoutingKey;
            Console.WriteLine($"\b\b\b\b [x] ADMIN NOTIFICATION: {message}");
            Console.Write(">>> ");
        };
        
        _channel.BasicConsume(
            queue: _queueName,
            autoAck: true,
            consumer: consumer
        );
        
        Console.WriteLine("[*] Started listening for admin notifications");
    }
}