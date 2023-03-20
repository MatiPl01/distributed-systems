require './controllers/cities/index'

module Controllers
module Weather
  WEATHER_API = ENV['WEATHER_API']
  WEATHER_API_KEY = ENV['WEATHER_API_KEY']
  ALLOWED_KEYS = ENV['ALLOWED_KEYS'].split(',')

  class Index
    def call(env)
      get_weather(env)
    end

    def get_weather(env)
      params = Rack::Utils.parse_nested_query(env['QUERY_STRING'])
      key = params['key']
      city = params['city']
      radius = params['radius'].to_i
      days = params['days'].to_i

      if days < 1 || days > 14
        raise StandardError.new({ status_code: 400, message: 'Days must be between 1 and 14' }.to_json)
      end
      if radius < 1 || radius > 100
        raise StandardError.new({ status_code: 400, message: 'Radius must be between 1 and 100' }.to_json)
      end
      if key.nil?
        raise StandardError.new({ status_code: 401, message: 'Validation key is missing' }.to_json)
      end
      if !ALLOWED_KEYS.include?(key)
        raise StandardError.new({ status_code: 403, message: 'Access denied' }.to_json)
      end

      cities = Controllers::Cities.get_cities(city, radius)
      weathers = Controllers::Weather.get_weathers(cities, days)

      temps_now = weathers.map{ |city| city['current']['temp_c'] }
      avg_temp_now = temps_now.inject{ |sum, el| sum + el }.to_f / temps_now.size

      feelslikes_now = weathers.map{ |city| city['current']['feelslike_c'] }
      avg_feelslike_now = feelslikes_now.inject{ |sum, el| sum + el }.to_f / feelslikes_now.size

      forecast_by_day = (0..days-1).map{ |day| weathers.map{ |weather| weather['forecast']['forecastday'][day] }.flatten }

      get_temps = lambda do |key|
        (0..days-1).map do |day| 
          forecasts = forecast_by_day[day].map{ |city| city['day'][key] }
          # Calculate the average temperature for the day
          forecasts.inject{ |sum, el| sum + el }.to_f / forecasts.size
        end
      end

      dates = forecast_by_day.map{ |forecast_day| forecast_day[0]['date'] }
      max_temps = get_temps.call('maxtemp_c')
      min_temps = get_temps.call('mintemp_c')
      avg_temps = get_temps.call('avgtemp_c')

      @cities = cities.map{ |city| city['name'] }
      @days = days
      @avg_temp_now = avg_temp_now
      @avg_feelslike_now = avg_feelslike_now
      @forecast = (0..days-1).map{ |day| {
        date: dates[day],
        max: max_temps[day],
        min: min_temps[day],
        avg: avg_temps[day]
      } }

      puts" Forecast: #{@forecast}"

      [200, { 'content-type' => 'text/html' }, [ERB.new(File.read("./views/weather.html.erb")).result(binding)]] 
    end
  end

  def self.get_weathers(cities, days)
    url = "#{WEATHER_API}/forecast.json"
    query = {
      key: WEATHER_API_KEY,
      hour: 17,
      alerts: 'no',
      aqi: 'no',
      days: days
    }

    Parallel.map(cities, in_threads: cities.length) do |city|
      query[:q] = "#{city['latitude']},#{city['longitude']}"
      
      begin
        response = HTTParty.get(url, query: query)
        JSON.parse(response.body)
      rescue HTTParty::Error
        raise StandardError.new({ status_code: 502, message: 'Unable to get information about weather' }.to_json)
      end
    end
  end

end
end
