#!/usr/bin/ruby

# By grzegorz914@icloud.com
# see https://github.com/grzegorz914/homebridge-enphase-envoy

# <bitbar.title>Enphase Envoy</bitbar.title>
# <bitbar.version>v1.0</bitbar.version>
# <bitbar.author>Grzegorz</bitbar.author>
# <bitbar.author.github>grzegorz914</bitbar.author.github>
# <bitbar.desc>Display the power and energy of Enphase solar system.</bitbar.desc>
# <bitbar.dependencies>ruby</bitbar.dependencies>
# <bitbar.abouturl>http://url-to-about.com/</bitbar.abouturl>

require 'net/http'
require 'net/http/digest_auth'
require 'json'

ENVOY_IP = 'envoy.local'
MICROINVERTERS_SUM_WATTS = 5400 # Set the summary power of microinverters

def autoFormatPower(val)
    if (val < 1000 && val > -1000)
        return val.round(1).to_s + 'W'
    end
    if ((val >= 1000 && val < 1000000) || (val > -1000000 && val <= -1000))
        return (val/1000).round(3).to_s + 'kW'
    end
    if (val <= -1000000 || val >= 1000000)
        return (val/1000000).round(3).to_s + 'MW'
    end
end

def autoFormatEnergy(val)
    if (val < 1000 && val > -1000)
        return val.round(1).to_s + 'Wh'
    end
    if ((val >= 1000 && val < 1000000) || (val > -1000000 && val <= -1000))
        return (val/1000).round(3).to_s + 'kWh'
    end
    if (val <= -1000000 || val >= 1000000)
        return (val/1000000).round(3).to_s + 'MWh'
    end
end

begin
    raise "Not a valid IP address. Update ENVOY_IP in script" unless ENVOY_IP.match(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)
    http = Net::HTTP.new(ENVOY_IP)
    
    # Check installed meters
    uri = URI("http://" + ENVOY_IP + "/ivp/meters")
    req  = Net::HTTP::Get.new(uri.request_uri)
    req['Content-Type'] = 'application/json'
    res = http.request(req)
    raise "Error on http request. Response: " + res.message unless res.is_a?(Net::HTTPSuccess)
    meters = JSON.parse(res.body)
    
    ctmeters = meters.length
     if ctmeters > 0
        ctmeterProduction = meters[0]["state"] == "enabled"
        ctmeterConsumption = meters[1]["state"] == "enabled"
     else
        ctmeterProduction = false
        ctmeterConsumption = false
     end
    
    # Get production misroinverters
    uri = URI("http://" + ENVOY_IP + "/api/v1/production")
    req  = Net::HTTP::Get.new(uri.request_uri)
    req['Content-Type'] = 'application/json'
    res = http.request(req)
    raise "Error on http request. Response: " + res.message unless res.is_a?(Net::HTTPSuccess)
    production = JSON.parse(res.body)
    
    # microinverters summary 
    productionMicroSummarywhToday = production["attHoursToday"]
    productionMicroSummarywhLastSevenDays = production["wattHoursSevenDays"]
    productionMicroSummarywhLifeTime = production["wattHoursLifetime"]
    productionMicroSummaryWattsNow = production["wattsNow"]

    # Get production
    uri = URI("http://" + ENVOY_IP + "/production.json?details=1")
    req  = Net::HTTP::Get.new(uri.request_uri)
    req['Content-Type'] = 'application/json'
    res = http.request(req)
    raise "Error on http request. Response: " + res.message unless res.is_a?(Net::HTTPSuccess)
    productionct = JSON.parse(res.body)
    
    productionMicroPower = productionct["production"][0]["wNow"]
    productionMicroEnergyLifeTime = productionct["production"][0]["whLifetime"]
    
    if ctmeterProduction == true
    productionPower = productionct["production"][1]["wNow"]
    productionEnergyToday = productionct["production"][1]["whToday"]
    productionEnergyLastSevenDays = productionct["production"][1]["whLastSevenDays"]
    productionEnergyLifeTime = productionct["production"][1]["whLifetime"]
    end
    if ctmeterConsumption
    consumptionTotalPower = productionct["consumption"][0]["wNow"]
    consumptionTotalEnergyToday = productionct["consumption"][0]["whToday"]
    consumptionTotalEnergyLastSevenDays = productionct["consumption"][0]["whLastSevenDays"]
    consumptionTotalEnergyLifeTime = productionct["consumption"][0]["whLifetime"]
    consumptionNetPower = productionct["consumption"][1]["wNow"]
    consumptionNetEnergyLifeTime = productionct["consumption"][1]["whLifetime"]
    end

    case 
    when consumptionNetPower > 0
        icon = "🔌" # Power plug
    when productionPower < (SYSTEM_SIZE_WATTS / 2)
        icon = "⛅" # Cloudy
    else
        icon = "☀️" # Sun
    end

     # Set the display in bar
     case 
     when consumptionNetPower > 0
         power = consumptionNetPower
     else
        power = productionPower
     end

    puts "#{icon} #{autoFormatPower(power)}| color=#{consumptionNetPower > 0 ? "red":"white"} size=12"
    puts "---"
    puts "Production"
    puts "Power #{autoFormatPower(ctmeterProduction ? productionPower : productionMicroSummaryWattsNow)}| size=12"
    puts "Energy #{autoFormatEnergy(ctmeterProduction ? productionEnergyToday : productionMicroSummarywhToday)}| size=12"
    puts "Energy 7 days #{autoFormatEnergy(ctmeterProduction ? productionEnergyLastSevenDays : productionMicroSummarywhLastSevenDays)}| size=12"
    puts "Energy lifetime #{autoFormatEnergy(ctmeterProduction ? productionEnergyLifeTime : productionMicroSummarywhLifetime)}| size=12"
    puts "---"
    if ctmeterConsumption
    puts "Consumption total"
    puts "Power #{autoFormatPower(consumptionTotalPower)}| size=12"
    puts "Energy #{autoFormatEnergy(consumptionTotalEnergyToday)}| size=12"
    puts "Energy 7 days #{autoFormatEnergy(consumptionTotalEnergyLastSevenDays)}| size=12"
    puts "Energy lifetime #{autoFormatEnergy(consumptionTotalEnergyLifeTime)}| size=12"
    puts "---"
    puts "Consumption net"
    puts "Power #{autoFormatPower(consumptionNetPower)}| size=12"
    puts "Energy lifetime #{autoFormatEnergy(consumptionNetEnergyLifeTime)}| size=12"
    end
    puts "---"

    # Get installed and active devices
    uri = URI('http://' + ENVOY_IP + '/inventory.json')
    req  = Net::HTTP::Get.new(uri.request_uri)
    req['Content-Type'] = 'application/json'
    res = http.request(req)
    raise "Error on http request. Response: " + res.message unless res.is_a?(Net::HTTPSuccess)
    inventory = JSON.parse(res.body)

    # Get the serial number of the envoy
    uri = URI("http://" + ENVOY_IP + "/info.xml")
    req  = Net::HTTP::Get.new(uri.request_uri)
    res = http.request(req)
    raise "Error on http request. Response: " + res.message unless res.is_a?(Net::HTTPSuccess)
    envoySerial = res.body.scan(/sn>(\d*)<\/sn>/).first.first

    # Now lets see how much the every microinverter producing.
    uri = URI('http://' + ENVOY_IP + '/api/v1/production/inverters')
    uri.user = 'envoy'
    uri.password = envoySerial[-6,6]

    # Make the first request to get the auth
    req = Net::HTTP::Get.new uri.request_uri
    res = http.request(req)

    # Aauthentication digest
    digest_auth = Net::HTTP::DigestAuth.new
    auth = digest_auth.auth_header(uri, res['www-authenticate'], 'GET')
    req = Net::HTTP::Get.new(uri.request_uri)
    req.add_field('Authorization', auth)
    res = http.request(req)
    raise "Error on http request. Response: " + res.message unless res.is_a?(Net::HTTPSuccess)
    allInverters = JSON.parse(res.body)

    # Get serial number and power of every microinverter
    puts "Microinverter"
    i = 0
    arr = Array.new 
    arr1 = Array.new
    loop do
        serialNumber = allInverters[i]["serialNumber"]
        power = allInverters[i]["lastReportWatts"]
        arr.push(serialNumber)
        arr1.push(power)
        i += 1
        if i == allInverters.length
            break
        end
    end

    j = 0
    loop do
        serial = inventory[0]["devices"][j]["serial_num"]
        index = arr.find_index(serial)
        puts "SN: #{arr[index]} power: #{autoFormatPower(arr1[index])}| size=12"
        j += 1
        if j == inventory[0]["devices"].length
        break
        puts "---"
        end
    end
    
rescue StandardError => e
    puts ":warning: Error| size=12"
    puts "---"
    puts e.message
end
