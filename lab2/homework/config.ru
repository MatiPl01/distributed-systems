require 'hanami/router'
require "httparty"
require 'json'
require 'erb'

class Middleware
  def initialize(app)
    @app = app
  end

  def call(env)
    begin
      response = @app.call(env)
      response
    rescue => e
      @status_code = 500
      @error = e
      [500, { 'content-type' => 'text/html' }, [ERB.new(File.read('./views/error.html.erb')).result(binding)]]
    end
  end
end

def get_cities(city_name, radius)
  url = "https://api.api-ninjas.com/v1/city?name=#{city_name}&radius=#{radius}&limit=1"
  headers = { 'X-Api-Key' => "JbUF4yipNatxQ8wyy1Yzlg==mJlypRJKFAAiilzV" }

  begin
    response = HTTParty.get(url, headers: headers)
    data = JSON.parse(response.body)
  rescue => e
    # TODO: Handle error
  end

  url = "https://api.api-ninjas.com/v1/geo/locations/#{}#{}"
end

app = Hanami::Router.new do
  get '/', to: ->(env) { 
    [200, { 'content-type' => 'text/html' }, [File.read('./views/form.html.erb')]] 
  }

  get '/weather', to: ->(env) { 
    params = Rack::Utils.parse_nested_query(env['QUERY_STRING'])

    response = HTTParty.get('https://api.api-ninjas.com/v1/city?name=warsaw&limit=1', headers: { 'X-Api-Key' => "JbUF4yipNatxQ8wyy1Yzlg==mJlypRJKFAAiilzV" })

    # TODO: Get cities and weather data from API
    @cities = JSON.parse(response.body)
    @days = []
    @avg_temp_now = 0
    @avg_feelslike_now = 0
    @forecast = []

    [200, { 'content-type' => 'text/html' }, [ERB.new(File.read("./views/weather.html.erb")).result(binding)]] 
  }
end

use Middleware

run app
