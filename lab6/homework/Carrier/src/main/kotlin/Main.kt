import com.rabbitmq.client.ConnectionFactory

fun main(args: Array<String>) {
    // INITIALIZATION
    // Create a connection to RabbitMQ
    val factory = ConnectionFactory()
    factory.host = Constants.RABBITMQ_HOST

    val connection = factory.newConnection()
    val channel = connection.createChannel()
    channel.basicQos(1);

    val carrierName = getCarrierName(args)
    val routingKeys = getRoutingKeys(args)

    // Create exchanges
    // Agency requests exchange
    channel.exchangeDeclare(
        Constants.AGENCY_REQUESTS_EXCHANGE_NAME,
        "direct"
    )
    // Carrier confirmations exchange
    channel.exchangeDeclare(
        Constants.CARRIER_CONFIRMATIONS_EXCHANGE_NAME,
        "topic"
    )

    // Declare a queue to receive requests from agencies
    val requestsQueueName = "${carrierName}_requests_queue"
    channel.queueDeclare(
        requestsQueueName,
        false, // TODO - change to true
        false,
        false,
        null
    )
    // Create respective bindings based on specified routing keys
    routingKeys.forEach { routingKey ->
        channel.queueBind(
            requestsQueueName,
            Constants.AGENCY_REQUESTS_EXCHANGE_NAME,
            routingKey
        )
    }

    println(" [*] Waiting for messages.")

    val requestsHandler = RequestsHandler(
        carrierName = carrierName,
        requestsQueueName = requestsQueueName,
        confirmationsExchangeName = Constants
            .CARRIER_CONFIRMATIONS_EXCHANGE_NAME,
        channel = channel
    )
    requestsHandler.handleRequests()
}
