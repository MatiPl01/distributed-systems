import services.ServerService

fun main(args: Array<String>) {
    println("Program arguments: ${args.joinToString()}")
    val server = ServerService()
    server.serve(args)
}
