import com.rabbitmq.client.ConnectionFactory
import com.rabbitmq.client.DeliverCallback
import com.rabbitmq.client.Delivery


const val QUEUE_NAME: String = "task_queue"

fun doWork(task: String) {
    for (ch in task.toCharArray()) {
        if (ch == '.') {
            try {
                Thread.sleep(1000)
            } catch (_ignored: InterruptedException) {
                Thread.currentThread().interrupt()
            }
        }
    }
}

fun main(args: Array<String>) {
    val factory = ConnectionFactory()
    factory.host = "localhost"
    val connection = factory.newConnection()
    val channel = connection.createChannel()

    channel.queueDeclare(QUEUE_NAME, true, false, false, null)
    println(" [*] Waiting for messages.")

    channel.basicQos(1);

    val deliverCallback =
        DeliverCallback { _: String?, delivery: Delivery ->
            val message = String(delivery.body, charset("UTF-8"))
            println(" [x] Received '$message'")
            try {
                doWork(message)
            } finally {
                println(" [x] Done")
                channel.basicAck(delivery.envelope.deliveryTag, false)
            }
        }

    channel.basicConsume(
        QUEUE_NAME, false, deliverCallback
    ) { _: String? -> }
}
