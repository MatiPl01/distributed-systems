module Utils

  class InputParser
    def self.parse(line)
      # Split the line into command and arguments
      line = line.split(' ')
      command = line[0]
      args = line[1..-1]

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
        raise ArgumentError, 'DS takes two numeric arguments' unless args.length == 2
      when 'SL'
        raise ArgumentError, 'SL takes one string argument' unless args.length == 1
      else
        raise ArgumentError, "Unknown command: #{command}"
      end
    end
  end

end
