import com.rabbitmq.client.Channel
import com.rabbitmq.client.DeliverCallback

class AdminNotificationsHandler(
    private val queueName: String,
    private val channel: Channel
) {
    fun handleNotifications() {
        val deliverCallback =
            DeliverCallback { _: String?, delivery ->
                val message = String(delivery.body, Charsets.UTF_8)
                println(" [x] ADMIN NOTIFICATION: $message")
            }

        channel.basicConsume(
            queueName,
            true,
            deliverCallback
        ) { consumerTag: String? ->
            println(" [x] Cancelled '$consumerTag'")
        }
    }
}
