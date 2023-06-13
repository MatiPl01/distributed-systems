namespace Agency;

public static class Constants
{
    // RabbitMQ
    public const string RabbitMqHost = "localhost";
    // Exchanges
    public const string AgencyRequestsExchangeName = "agency_requests_exchange";
    public const string CarrierConfirmationsExchangeName = "carrier_confirmations_exchange";
    public const string AdminAgenciesNotificationsExchangeName = "admin_agencies_notifications_exchange";
}
