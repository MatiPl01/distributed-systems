import com.rabbitmq.client.Channel
import kotlin.system.exitProcess

fun getCarrierName(args: Array<String>): String {
    if (args.isEmpty()) {
        println("No carrier name provided")
        exitProcess(1)
    }
    return args[0]
}

fun getRoutingKeys(args: Array<String>): List<String> {
    // Allow exactly 2 routing keys
    if (args.size != 3) {
        println("Usage: MainKt <carrier_name> <routing_key_1> <routing_key_2>")
        exitProcess(1)
    }
    // Check if all specified routing keys are valid
    val routingKeys = args.drop(1)
    val allowedRoutingKeys = Constants.ALLOWED_AGENCY_REQUESTS_ROUTING_KEYS
    val invalidRoutingKeys = routingKeys.filter { !allowedRoutingKeys.contains(it) }
    if (invalidRoutingKeys.isNotEmpty()) {
        println("Invalid routing keys: $invalidRoutingKeys")
        exitProcess(1)
    }
    return routingKeys
}

fun setupQueue(
    channel: Channel,
    queueName: String,
    exchangeName: String,
    routingKey: String? = ""
) {
    channel.queueDeclare(
        queueName,
        false,
        false,
        false,
        null
    )
    channel.queueBind(
        queueName,
        exchangeName,
        routingKey
    )
}
