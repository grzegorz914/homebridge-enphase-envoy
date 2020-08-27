<p align="center">
  <a href="https://github.com/grzegorz914/homebridge-enphase-envoy"><img src="https://raw.githubusercontent.com/grzegorz914/homebridge-enphase-envoy/master/graphics/envoy.png" height="140"></a>
</p>

<span align="center">

# Homebridge Enphase Envoy-S
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm](https://badgen.net/npm/dt/homebridge-enphase-envoy?color=purple)](https://www.npmjs.com/package/homebridge-enphase-envoy) [![npm](https://badgen.net/npm/v/homebridge-enphase-envoy?color=purple)](https://www.npmjs.com/package/homebridge-enphase-envoy)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/grzegorz914/homebridge-enphase-envoy.svg)](https://github.com/grzegorz914/homebridge-enphase-envoy/pulls)
[![GitHub issues](https://img.shields.io/github/issues/grzegorz914/homebridge-enphase-envoy.svg)](https://github.com/grzegorz914/homebridge-enphase-envoy/issues)

Homebridge plugin to control Photovoltaic energy system basis on Enphase devices (IQ Envoy, Envoy-S Metered/Standard).

</span>

## Info
1. The plugin is present as C02(ppm) sensor and the Power is report in Watt.
2. Current Level - is the current production / total and net consumption power in Watt.
3. Peak Level - is the maximum production / total and net consumption power in Watt.
4. All other power and energy values are avilable in the log.

## Package
1. [Homebridge](https://github.com/homebridge/homebridge)
2. [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x)

## Installation
1. Follow the step-by-step instructions on the [Homebridge Wiki](https://github.com/homebridge/homebridge/wiki) for how to install Homebridge.
2. Follow the step-by-step instructions on the [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x/wiki) for how to install Homebridge Config UI X.
3. Install homebridge-enphase-envoy using: `npm install -g homebridge-enphase-envoy` or search for `Enphase or Envoy` in Config UI X.

## Configuration
1. Use [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x) to configure the plugin (strongly recomended), or update your configuration file manually. See `sample-config.json` in this repository for a sample or add the bottom example to Your config.json file.
2. In `host` set the iP adress or leave empy(will use default path `envoy.local`).
3. In `refreshInterval` set the data refresh time in seconds.
4. In `productionPowerMeter` select which meter will be used to display production Power.
5. In `maxPowerProductionDetected` set the maximum Power in Watt, if the production Power will be >= `maxPowerProductionDetected` then You get notyfication message from the HomeKit.
6. In `consumptionPowerMeter` select which meter will be used to display consumption Power.
7. In `maxTotalPowerConsumptionDetected` set the maximum total Consumption in Watt, if the total consumption Power will be >= `maxTotalPowerConsumptionDetected` then You get notyfication message from the HomeKit.
8. In `maxNetPowerConsumptionDetected` set the maximum net Consumption in Watt, if the net consumption Power will be >= `maxNetPowerConsumptionDetected` then You get notyfication message from the HomeKit. If the net power is exporting to grid(netPower < 0) then the value is 0, right now the sensor do not display (`-`values).

<p align="left">
  <a href="https://github.com/grzegorz914/homebridge-enphase-envoy"><img src="https://raw.githubusercontent.com/grzegorz914/homebridge-enphase-envoy/master/graphics/ustawienia.png" height="150"></a>
</p>

```json
        {
            "platform": "enphaseEnvoy",
            "devices": [
                {
                    "name": "Envoy",
                    "host": "192.168.1.35",
                    "refreshInterval": 30,
                    "productionPowerMeter": 0,
                    "maxPowerProductionDetected": 5400,
                    "consumptionPowerMeter": 0,
                    "maxTotalPowerConsumptionDetected": 10000,
                    "maxNetPowerConsumptionDetected": 10000
                }
            ]
        }
```

## Whats new:
https://github.com/grzegorz914/homebridge-enphase-envoy/blob/master/CHANGELOG.md

## Development
- Pull request and help in development highly appreciated.
