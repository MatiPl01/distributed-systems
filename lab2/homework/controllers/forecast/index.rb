require './controllers/cities/index'
require './utils/renderer'

module Controllers
module Forecast
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
      forecast = Controllers::Forecast.get_forecast(cities, days)

      temps_now = []
      condition_now = []
      wind_kph_now = []
      total_precip_mm_now = []
      avg_humidity_now = []
      feels_like_now = []
      cloud_now = []

      forecast.each do |city|
        weather = city['current']
        temps_now << weather['temp_c']
        condition_now << weather['condition']
        wind_kph_now << weather['wind_kph']
        total_precip_mm_now << weather['precip_mm']
        avg_humidity_now << weather['humidity']
        feels_like_now << weather['feelslike_c']
        cloud_now << weather['cloud']
      end

      forecast_by_day = (0..days-1).map{ |day| forecast.map{ |weather| weather['forecast']['forecastday'][day] }.flatten }

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

      Utils::Renderer.render_erb('./views/forecast.html.erb', {
        cities: cities.map{ |city| city['name'] },
        current_weather_date: forecast[0]['current']['last_updated'],
        current_weather_condition: condition_now.max_by{ |v| condition_now.count(v) },
        avg_temp_now: temps_now.inject{ |sum, el| sum + el }.to_f / temps_now.size,
        
        days: days,
        avg_wind_kph_now: wind_kph_now.inject{ |sum, el| sum + el }.to_f / wind_kph_now.size,
        avg_totalprecip_mm_now: total_precip_mm_now.inject{ |sum, el| sum + el }.to_f / total_precip_mm_now.size,
        avg_avghumidity_now: avg_humidity_now.inject{ |sum, el| sum + el }.to_f / avg_humidity_now.size,
        avg_feels_like_now: feels_like_now.inject{ |sum, el| sum + el }.to_f / feels_like_now.size,
        avg_cloud_now: feels_like_now.inject{ |sum, el| sum + el }.to_f / cloud_now.size,
        forecast: (0..days-1).map{ |day| 
          {
            day: dates[day].split("-").slice(1, 3).reverse.join("."),
            max: max_temps[day],
            min: min_temps[day],
            avg: avg_temps[day],
            condition: forecast_by_day[day][0]['day']['condition']
          } 
        }
      })
    end
  end

  def self.get_forecast(cities, days)
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
