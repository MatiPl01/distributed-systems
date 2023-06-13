import com.rabbitmq.client.Channel
import com.rabbitmq.client.DeliverCallback
import com.rabbitmq.client.Delivery
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class RequestsHandler(
    private val carrierName: String,
    private val requestsQueueName: String,
    private val confirmationsExchangeName: String,
    private val channel: Channel
) {
    fun handleRequests() {
        val deliverCallback =
            DeliverCallback { _: String?, delivery: Delivery ->
                val message = String(delivery.body, Charsets.UTF_8)
                handleRequest(delivery.envelope.routingKey, message)
            }

        channel.basicConsume(
            requestsQueueName,
            true, // TODO - replace auto ack with manual ack
            deliverCallback
        ) { consumerTag: String? ->
            println(" [x] Cancelled '$consumerTag'")
        }
    }

    private fun handleRequest(requestType: String, request: String) {
        // Decode request JSON to AgencyRequest object
        val agencyRequest = Json.decodeFromString<AgencyRequest>(request)
        println(" [x] Received '$requestType':'$agencyRequest'")

        // Send confirmation to the agency
        sendConfirmation(requestType, agencyRequest)
    }

    private fun sendConfirmation(
        requestType: String,
        agencyRequest: AgencyRequest
    ) {
        // Create the confirmation object
        val confirmation = ConfirmationResponse(
            agencyName = agencyRequest.agencyName,
            internalId = agencyRequest.internalId,
            requestType = requestType,
            carrierName = carrierName
        )
        // Encode confirmation object to JSON
        val confirmationJson = Json.encodeToString(confirmation)
        // Send confirmation to the agency
        channel.basicPublish(
            confirmationsExchangeName,
            "confirmation.${agencyRequest.agencyName}",
            null,
            confirmationJson.toByteArray(Charsets.UTF_8)
        )
        println(" [x] Sent '$requestType':'$confirmationJson'")
    }
}
