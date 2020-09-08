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

## Important note - with version 3.0.0 accesory moved to Power Meter custom Characteristic, due to Apple HomeKit limitations right now only in EVE app displayed correctly, in HomeKit displayed as 'Unsupported'. If U want to use old CO2 sensor style just still with 2.x.x version

## Info v3.x.x
1. With release v3.0.0 the plugin is present as Power Meter and the Power is displayed in (kW) and Energy in (kWh).
2. Max power detection is now supported.

## Info v2.3.x
1. The plugin is present as C02(ppm) sensors and the Power is displayed in Watt and Energy in Wh/kWh.
2. Production Current Level (W) - is the current Power production in (W). If the value is (< 0) and display (`-`values) then the PV consumed power from Grid.
3. Consumption Current Level Total (W) - is the Total Power Consumption in (W)).
4. Consumption Current Level Net (W) - is the Power Consumption from Grid in (W). If the value is (< 0) and display (`-`values) then the Power is exported to the Grid.
5. Peak Level (W) - display the maximum Power production/consumption.
6. Production Current Level (Wh)/(kWh) - is the Energy production (Lifetime and 7Days in kWh, Today in Wh).
7. Consumption Current Level (Wh)/(kWh) - is the Total and Net Energy Consumption (Lifetime and 7Days in kWh, Today in Wh).

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
5. In `enchargeStorage` check ON if encharge storage is installed.
5. In `powerProductionMeter` select which meter will be used to display Power production.
6. In `powerProductionMaxDetected` set the maximum Power production, if the Power production will be >= `powerProductionMaxDetected` then You get notyfication message from the HomeKit.
7. In `energyProductionLifetimeOffset` set the offset of lifetime energy production if nedded in (Wh),(+/-).
8. In `powerConsumptionMeter` select which meter will be used to display Power consumption.
9. In `powerConsumptionTotalMaxDetected` set the maximum total Power consumption, if the total Power consumption will be >= `powerConsumptionTotalMaxDetected` then You get notyfication message from the HomeKit.
10. In `energyConsumptionTotalLifetimeOffset` set the offset of lifetime total energy consumption if nedded in (Wh),(+/-).
11. In `powerConsumptionNetMaxDetected` set the maximum Power consumption from Grid, if the Power consumption will be >= `powerConsumptionNetMaxDetected` then You get notyfication message from the HomeKit.
12. In `energyConsumptionNetLifetimeOffset` set the offset of lifetime net energy consumption if nedded in (Wh),(+/-).
13. `manufacturer`, `model`, `serialNumber`, `firmwareRevision` - optional branding data displayed in Home.app

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
                    "enchargeStorage": false,
                    "powerProductionMeter": 0,
                    "powerProductionMaxDetected": 5400,
                    "energyProductionLifetimeOffset": 0,
                    "powerConsumptionMeter": 0,
                    "powerConsumptionTotalMaxDetected": 10000,
                    "energyConsumptionTotalLifetimeOffset": 0,
                    "powerConsumptionNetMaxDetected": 10000,
                    "energyConsumptionNetLifetimeOffset": 0,
                    "manufacturer": "Manufacturer",
                    "modelName": "Model",
                    "serialNumber": "Serial Number",
                    "firmwareRevision": "Firmware Revision"
                }
            ]
        }
```

## Whats new:
https://github.com/grzegorz914/homebridge-enphase-envoy/blob/master/CHANGELOG.md

## Development
- Pull request and help in development highly appreciated.
