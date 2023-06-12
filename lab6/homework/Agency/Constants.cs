namespace Agency;

public static class Constants
{
    public const string RabbitMqHost = "localhost";
    public const string AgencyRequestsExchange = "agency_requests_exchange";
    public static readonly Dictionary<string, string> QueueBindings = new()
    {
        {"passenger_transport_queue", "passenger"},
        {"cargo_transport_queue", "cargo"},
        {"emergency_transport_queue", "emergency"}
    };
}
