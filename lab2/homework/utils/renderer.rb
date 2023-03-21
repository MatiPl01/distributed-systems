require 'erb'

module Utils
module Renderer

  def self.render_erb(file_path, locals = {})
    locals.each do |key, value|
      instance_variable_set("@#{key}", value)
    end

    @status_code ||= 200

    [@status_code, { 'content-type' => 'text/html' }, [ERB.new(File.read(file_path)).result(binding)]]
  end

end
end
