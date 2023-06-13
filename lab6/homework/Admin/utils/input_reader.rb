module Utils
  class InputReader
    def self.read()
      puts "Enter a notification type (1 - agencies, 2 - carriers, 3 - all): "
      # notification_type = gets.chomp

      puts "Enter a message: "
      message = gets.chomp

      return notification_type, message
    end
  end
end
