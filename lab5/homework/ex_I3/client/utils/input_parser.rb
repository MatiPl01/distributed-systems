module Utils

  class InputParser
    def self.parse(line)
      # Split the line into command and arguments
      command, *args = line.split(' ')
      
      # Validate the command and arguments
      self.validate_command_args(command, args)

      # Return the command and arguments
      [command, args]
    end

    private 
    
    def self.validate_command_args(command, args)
      case command
      when 'ASM'
        raise ArgumentError, 'ASM takes no arguments' unless args.empty?
      when 'DS'
        raise ArgumentError, 'object_id is required' unless args[0]
        raise ArgumentError, 'DS takes three arguments' unless args.length == 3
      when 'SL'
        raise ArgumentError, 'object_id is required' unless args[0]
        raise ArgumentError, 'SL takes two arguments' unless args.length == 2
      when 'exit'
        raise ArgumentError, 'exit takes no arguments' unless args.empty?
      else
        raise ArgumentError, "Unknown command: #{command}"
      end
    end
  end

end
