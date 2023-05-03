require './services/client_service'
require 'Ice'

Ice::loadSlice('slice/servants.ice')

Ice::initialize(ARGV, "config.client") do |communicator, args|
  client = Services::ClientService.new(communicator)
  
  begin
    client.run
  rescue Ice::Exception => ex
    puts "#{ex}\n#{ex.backtrace.join("\n")}"
    communicator.destroy
    exit(1)
  end
end
