#!ruby

require 'net/http'
require 'uri'
require 'json'
require 'fileutils'

all_parks_api = URI('https://api.sixflags.net/mobileapi/v1/park')
response = Net::HTTP.get_response(all_parks_api)
raise('ERR: unable to fetch SixFlags Parks') unless response.is_a?(Net::HTTPSuccess)
all_parks = JSON.parse(response.body)

my_parks = []
parks = all_parks['parks']
parks.each do |e|
    park = {}
    park['parkId'] = e['parkId']
    park['name'] = e['name']
    park['city'] = e['city']
    park['state'] = e['state']
    my_parks.push(park)
    puts "./fetch.sh commit update " + park['parkId'].to_s;
end

sorted = my_parks.sort_by { |e| [e['state'], e['city'], e['name']] }


File.write('data/park/sixflags-raw.json', JSON.pretty_generate(all_parks))
File.write('data/park/sixflags.json', JSON.pretty_generate(sorted))
