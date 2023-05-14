require './utils/input_parser'

module Services

  class ClientService
    def initialize(communicator)
      @communicator = communicator
      @endpoints = communicator.getProperties.getProperty('Servants.Endpoints')
    end

    def run
      while true
        print '>>> '
        line = gets.chomp
        
        begin
          command, args = Utils::InputParser.parse(line)
        rescue ArgumentError => ex
          puts ex.message
          next
        end
        
        case command
        when 'ASM'
          handleASM
        when 'DS'
          handleDS(*args.map(&:to_i))
        when 'SL'
          handleSL(args[0], args[1..-1].join(' '))
        when 'exit'
          break
        else
          puts "Unknown command: #{command}"
        end
      end
    end

    def handleASM
      servant = Servants::ASMObjectPrx::checkedCast(create_base("ASM"))
      raise Ice::NoEndpointException unless servant
      # Register the call
      puts "Registering call..."
      servant.registerCall
      # Get the call count
      puts "Call count: #{servant.getCallCount}"
    end

    def handleDS(object_id, a, b)
      servant = Servants::DSObjectPrx::checkedCast(create_base("DS/#{object_id}"))
      # Call the add method
      puts "Sum: #{servant.add(a, b)}"
    end

    def handleSL(object_id, lotsOfData)
      servant = Servants::SLObjectPrx::checkedCast(create_base("SL/#{object_id}"))
      # Set the state
      puts "Saving data..."
      servant.saveData(lotsOfData)
    end

    private

    def create_base(servant_name)
      @communicator.stringToProxy("#{servant_name}:#{@endpoints}")
    end
  end

end
