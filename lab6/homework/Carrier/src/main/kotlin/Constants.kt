import java.util.Dictionary

object Constants {
    // RabbitMQ
    const val RABBITMQ_HOST: String = "localhost"
    // Exchanges
    const val AGENCY_REQUESTS_EXCHANGE_NAME: String = "agency_requests_exchange"
    const val CARRIER_CONFIRMATIONS_EXCHANGE_NAME: String =
        "carrier_confirmations_exchange"
    const val ADMIN_CARRIERS_NOTIFICATIONS_EXCHANGE_NAME: String =
        "admin_carriers_notifications_exchange"
    // Queues
    val bindings = hashMapOf(
        "passenger" to "passenger_transport_queue",
        "cargo" to "cargo_transport_queue",
        "satellite" to "satellite_transport_queue"
    )
    // Routing keys
    val ALLOWED_AGENCY_REQUESTS_ROUTING_KEYS: Array<String> = arrayOf(
        "passenger",
        "cargo",
        "satellite"
    )
}
