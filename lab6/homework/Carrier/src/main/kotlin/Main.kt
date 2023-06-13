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

    // EXCHANGES
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
    // Admin carriers notifications exchange
    channel.exchangeDeclare(
        Constants.ADMIN_CARRIERS_NOTIFICATIONS_EXCHANGE_NAME,
        "fanout"
    )

    // QUEUES
    // Declare a queue to receive requests from agencies
    val requestsQueueName = "${carrierName}_requests_queue"
    setupQueue(
        channel = channel,
        queueName = requestsQueueName,
        exchangeName = Constants.AGENCY_REQUESTS_EXCHANGE_NAME,
        routingKeys = routingKeys
    )
    // Declare a queue to receive admin notifications
    val adminNotificationsQueueName = "${carrierName}_admin_notifications_queue"
    setupQueue(
        channel = channel,
        queueName = adminNotificationsQueueName,
        exchangeName = Constants.ADMIN_CARRIERS_NOTIFICATIONS_EXCHANGE_NAME,
        routingKeys = listOf()
    )

    println(" [*] Waiting for messages.")

    // Create the agencies requests handler
    val requestsHandler = RequestsHandler(
        carrierName = carrierName,
        requestsQueueName = requestsQueueName,
        confirmationsExchangeName = Constants
            .CARRIER_CONFIRMATIONS_EXCHANGE_NAME,
        channel = channel
    )
    requestsHandler.handleRequests()

    // Create the admin notifications handler
    val adminNotificationsHandler = AdminNotificationsHandler(
        queueName = adminNotificationsQueueName,
        channel = channel
    )
    adminNotificationsHandler.handleNotifications()
}
