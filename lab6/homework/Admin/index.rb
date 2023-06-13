#!/usr/bin/env ruby
require 'bunny'
require 'dotenv/load'
require './services/sniffer_service'
require './services/notifications_service'
require './utils/input_reader'

# INITIALIZATION
# Create a connection to RabbitMQ
connection = Bunny.new(automatically_recover: false)
connection.start

channel = connection.create_channel

# EXCHANGES
# Create exchanges
agency_requests_exchange = channel.direct(ENV['AGENCY_REQUESTS_EXCHANGE'])
carrier_confirmation_exchange = channel.topic(ENV['CARRIER_CONFIRMATIONS_EXCHANGE'])
admin_agencies_notifications_exchange = channel.fanout(ENV['ADMIN_AGENCIES_NOTIFICATIONS_EXCHANGE'])
admin_carriers_notifications_exchange = channel.fanout(ENV['ADMIN_CARRIERS_NOTIFICATIONS_EXCHANGE'])
admin_routing_exchange = channel.direct(ENV['ADMIN_ROUTING_EXCHANGE'])

# Connect admin routing exchange to admin notifications exchanges
admin_routing_exchange.bind(admin_agencies_notifications_exchange, routing_key: "agencies")
admin_routing_exchange.bind(admin_agencies_notifications_exchange, routing_key: "all")

admin_routing_exchange.bind(admin_carriers_notifications_exchange, routing_key: "carriers")
admin_routing_exchange.bind(admin_carriers_notifications_exchange, routing_key: "all")

# QUEUES
# Create admin sniffer queue
queue = channel.queue(ENV['ADMIN_SNIFFER_QUEUE'], durable: true)

# Bind agancy requests exchange to admin sniffer queue
for request_type in ['passenger', 'cargo', 'satellite']
  queue.bind(agency_requests_exchange, routing_key: request_type)
end

# Bind carrier confirmation exchange to admin sniffer queue
queue.bind(carrier_confirmation_exchange, routing_key: "confirmation.#")

# SERVICES
# Create sniffer service
sniffer_service = Services::SnifferService.new(queue)
# Create notifications service
notifications_service = Services::NotificationsService.new(admin_routing_exchange)

begin
  puts ' [*] Waiting for messages. To exit press CTRL+C'
  sniffer_service.sniff()

  while true
    notification_type, message = Utils::InputReader.read()
    notifications_service.notify(notification_type, message)
  end
rescue Interrupt => _
  puts ' [*] Closing connection...'
  connection.close
  exit(0)
end
