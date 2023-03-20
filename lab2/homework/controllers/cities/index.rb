module Controllers
module Cities
  CITIES_API = ENV['CITIES_API']
  CITIES_API_KEY = ENV['CITIES_API_KEY']
  
  def self.get_cities(city_name, radius)
    url = "#{CITIES_API}/cities"
    headers = { 'X-RapidAPI-Key' => CITIES_API_KEY }
    query = {
      namePrefix: city_name,
      limit: 1,
      sort: '-population'
    }
  
    response = HTTParty.get(url, headers: headers, query: query)
    body = JSON.parse(response.body)

    if body.key?('message')
      raise StandardError.new({ status_code: 502, message: body['message'] }.to_json)
    end

    if body.key?('message')
      raise StandardError.new({ status_code: 502, message: body['message'] }.to_json)
    end

    if body.nil? or body.empty?
      raise StandardError.new({ status_code: 404, message: 'No cities found' }.to_json)
    end

    data = body['data']
    location = [data[0]['latitude'], data[0]['longitude']]

    location.each_with_index do |value, index|
      location[index] = value < 0 ? value.to_s : "+#{value}"
    end

    latitude, longitude = location

    sleep(1)

    url = "#{CITIES_API}/locations/#{latitude}#{longitude}/nearbyCities"
    query = {
      radius: radius,
      limit: 10,
      sort: '-population'
    }

    response = HTTParty.get(url, headers: headers, query: query)
    body = JSON.parse(response.body)

    if body.key?('message')
      raise StandardError.new({ status_code: 502, message: body['message'] }.to_json)
    end

    body['data']
  end

end
end
