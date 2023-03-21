require 'hanami/router'
require 'dotenv/load'
require "httparty"
require 'parallel'
require 'json'
require 'erb'

require './controllers/home/index'
require './controllers/forecast/index'
require './utils/renderer'

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

      Utils::Renderer.render_erb('./views/error.html.erb', { status_code: @status_code, error: @error })
    end
  end
end

app = Hanami::Router.new do
  get '/', to: Controllers::Home::Index
  get '/weather', to: Controllers::Forecast::Index
end

use Middleware

run app
