module Services
  class NotificationsService
    def initialize(exchange)
      @exchange = exchange
    end

    def notify(notification_type, message)
      case notification_type
      when "1"
        notification_type = "agencies"
      when "2"
        notification_type = "carriers"
      when "3"
        notification_type = "all"
      else
        puts "Invalid notification type"
        return
      end
      # Publish message to admin_routing_exchange with a corresponding routing_key
      @exchange.publish(message, routing_key: "aaa")
    end
  end
end
