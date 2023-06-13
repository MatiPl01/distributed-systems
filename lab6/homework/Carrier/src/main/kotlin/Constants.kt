object Constants {
    // RabbitMQ
    const val RABBITMQ_HOST: String = "localhost"
    // Exchanges
    const val AGENCY_REQUESTS_EXCHANGE_NAME: String = "agency_requests_exchange"
    const val CARRIER_CONFIRMATIONS_EXCHANGE_NAME: String =
        "carrier_confirmations_exchange"
    const val ADMIN_CARRIERS_NOTIFICATIONS_EXCHANGE_NAME: String =
        "admin_carriers_notifications_exchange"
    // Routing keys
    val ALLOWED_AGENCY_REQUESTS_ROUTING_KEYS: Array<String> = arrayOf(
        "passenger",
        "cargo",
        "satellite"
    )
}
