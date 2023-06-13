module Services
  class SnifferService
    def initialize(queue)
      @queue = queue
    end

    def sniff()
      @queue.subscribe(block: false) do |_delivery_info, _properties, body|
        puts " [x] Received #{body}"
      end
    end
  end
end
