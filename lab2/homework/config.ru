require 'hanami/router'
require 'dotenv/load'
require "httparty"
require 'parallel'
require 'json'
require 'erb'

require './controllers/home/index'
require './controllers/weather/index'
class Middleware
  def initialize(app)
    @app = app
  end

  def call(env)
    begin
      response = @app.call(env)
      response
    rescue => e
      puts e
      error = e.message
      error = JSON.parse(error) if error.is_a?(String) and error.start_with?('{')

      @status_code =  500
      @error =  'Something went wrong'

      if error.is_a?(Hash)
        @status_code = error['status_code'] if error['status_code']
        @error = error['message'] if error['message']
      end

      [@status_code, { 'content-type' => 'text/html' }, [ERB.new(File.read('./views/error.html.erb')).result(binding)]]
    end
  end
end

app = Hanami::Router.new do
  get '/', to: Controllers::Home::Index
  get '/weather', to: Controllers::Weather::Index
end

use Middleware

run app

# TODO - send key in headers
# TODO - add scss and improve api
# TODO - extract renderind to a helper function
# TODO - add better authorization
