<p align="center">
  <a href="https://github.com/grzegorz914/homebridge-enphase-envoy"><img src="https://raw.githubusercontent.com/grzegorz914/homebridge-enphase-envoy/main/graphics/homebridge-enphase-envoy.png" width="540"></a>
</p>

<span align="center">

# Homebridge Enphase Envoy
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm](https://badgen.net/npm/dt/homebridge-enphase-envoy?color=purple)](https://www.npmjs.com/package/homebridge-enphase-envoy) 
[![npm](https://badgen.net/npm/v/homebridge-enphase-envoy?color=purple)](https://www.npmjs.com/package/homebridge-enphase-envoy)
[![npm](https://img.shields.io/npm/v/homebridge-enphase-envoy/beta.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-enphase-envoy)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/grzegorz914/homebridge-enphase-envoy.svg)](https://github.com/grzegorz914/homebridge-enphase-envoy/pulls)
[![GitHub issues](https://img.shields.io/github/issues/grzegorz914/homebridge-enphase-envoy.svg)](https://github.com/grzegorz914/homebridge-enphase-envoy/issues)

Homebridge plugin for Photovoltaic Energy System manufactured by Enphase.                                           
Supported *Envoy-IQ, Envoy-S Metered/Standard* and all peripheral devices.

</span>

## Package Requirements
| Package | Installation | Role | Required |
| --- | --- | --- | --- |
| [Homebridge](https://github.com/homebridge/homebridge) | [Homebridge Wiki](https://github.com/homebridge/homebridge/wiki) | HomeKit Bridge | Required |
| [Config UI X](https://github.com/oznu/homebridge-config-ui-x/wiki) | [Config UI X Wiki](https://github.com/oznu/homebridge-config-ui-x/wiki) | Homebridge Web User Interface | Recommended |
| [Enphase Envoy](https://www.npmjs.com/package/homebridge-enphase-envoy) | [Plug-In Wiki](https://github.com/grzegorz914/homebridge-enphase-envoy/wiki) | Homebridge Plug-In | Required |

### About The Plugin
* All Envoy firmware are supported from plugin verion 6.0.0.
* All devices are detected automatically (Envoy, Q-Relays, AC Batteries, Meters, Microinverters, Ensemble, Encharges, Enpower, WirelessKit).
* Envoy *device ID* is detected automatically, is required to control Power Production.
* Envoy *password* is detected automatically or can be added in config if was already chenged by user.
* Installer *password* is generated automatically, no need generate it manually in external generator anymore.
* For best experiences please use *Controller App* or *EVE app* for iOS, Home app display it as unsupported.
* Home automations and shortcuts can be used to check *Devices* communication level and change *Power Production Mode*.
* MQTT publisch topic *Info*, *Home*, *Inventory*, *Meters*, *Meters Reading*, *Ensemble Inventor*, *Ensemble Status*, *Production*, *Production CT*, *Microinverter*, *Power Mode*, *PCU Comm Level* as payload JSON data.

### Configuration
* Run this plugin as a [Child Bridge](https://github.com/homebridge/homebridge/wiki/Child-Bridges) (Highly Recommended), this prevent crash Homebridge if plugin crashes.
* Install and use [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x/wiki) to configure this plugin (Highly Recommended). 
* The sample configuration can be edited and used manually as an alternative. 
* See the `sample-config.json` file example or copy the example below into your config.json file, making the apporpriate changes before saving it. 
* Be sure to always make a backup copy of your config.json file before making any changes to it.

<p align="left">
  <a href="https://github.com/grzegorz914/homebridge-enphase-envoy"><img src="https://raw.githubusercontent.com/grzegorz914/homebridge-enphase-envoy/main/graphics/ustawienia.png" width="840"></a>
</p>

| Key | Description | 
| --- | --- |
| `name` | Here set the accessory *Name* to be displayed in *Homebridge/HomeKit*. |
| `host` | Here set the envoy *IP Address* or *Hostname* or leave empy (will be used default path `envoy.local`) |
| `enableDebugMode` | If enabled, deep log will be present in homebridge console. |
| `disableLogInfo`| If enabled, then disable log info, all values and state will not be displayed in Homebridge log console |
| `disableLogDeviceInfo` | If enabled, add ability to disable log device info by every connections device to the network. |
| `envoyFirmware7xx` | This enable support for Envoy with firmware 7.x.x |
| `envoyFirmware7xxToken` | Here paste your envoy token generated here: https://enlighten.enphaseenergy.com/entrez-auth-token?serial_num=12345 replace 12345 with Your Envoy serial number |
| `envoyPasswd` | Here set the envoy password (only if U already changed the default password) |
| `powerProductionMaxAutoReset` | Here select at which period of time the *Power Peak* will auto reset. |
| `powerProductionMaxDetected` | Here set the *production Power peak*, if the Power will be >= `powerProductionMaxDetected` then You get notification message from the HomeKit |
| `energyProductionLifetimeOffset` | Here set the *Offset* of lifetime energy production if nedded in (Wh),(+/-) |
| `powerConsumptionTotalMaxAutoReset` | Here select at which period of time the *Power Peak* will auto reset. |
| `powerConsumptionTotalMaxDetected` | Here set the *consumption-total Power peak*, if the Power will be >= `powerConsumptionTotalMaxDetected` then You get notyfication message from the HomeKit |
| `energyConsumptionTotalLifetimeOffset` | Here set the offset of lifetime total energy consumption if nedded in (Wh),(+/-) |
| `powerConsumptionNetMaxAutoReset` | Here select at which period of time the *Power Peak* will auto reset. |
| `powerConsumptionNetMaxDetected` | Here set the *consumption-net Power peak*, if the Power will be >= `powerConsumptionNetMaxDetected` then You get notyfication message from the HomeKit |
| `energyConsumptionNetLifetimeOffset` | Here set the offset of lifetime net energy consumption if nedded in (Wh),(+/-) |
| `enableMqtt` | If enabled, MQTT Broker will start automatically and publish all awailable PV installation data. |
| `mqttHost` | Here set the *IP Address* or *Hostname* for MQTT Broker.) |
| `mqttPort` | Here set the *Port* for MQTT Broker, default 1883.) |
| `mqttPrefix` | Here set the *Prefix* for *Topic* or leave empty.) |
| `mqttAuth` | If enabled, MQTT Broker will use authorization credentials. |
| `mqttUser` | Here set the MQTT Broker user. |
| `mqttPasswd` | Here set the MQTT Broker password. |
| `mqttDebug` | If enabled, deep log will be present in homebridge console for MQTT. |

```json
        {
            "platform": "enphaseEnvoy",
            "devices": [
                {
                    "name": "Envoy",
                    "host": "192.168.1.35",
                    "refreshInterval": 30,
                    "enableDebugMode": false,
                    "disableLogInfo": false,
                    "disableLogDeviceInfo": false,
                    "envoyFirmware7xx": false,
                    "envoyFirmware7xxToken": "",
                    "envoyPasswd": "",
                    "powerProductionMaxAutoReset": 0,
                    "powerProductionMaxDetected": 5400,
                    "energyProductionLifetimeOffset": 0,
                    "powerConsumptionTotalMaxAutoReset": 0,
                    "powerConsumptionTotalMaxDetected": 10000,
                    "energyConsumptionTotalLifetimeOffset": 0,
                    "powerConsumptionNetMaxAutoReset": 0,
                    "powerConsumptionNetMaxDetected": 10000,
                    "energyConsumptionNetLifetimeOffset": 0,
                    "enableMqtt": false,
                    "mqttHost": "192.168.1.33",
                    "mqttPort": 1883,
                    "mqttPrefix": "home/envoy",
                    "mqttAuth": false,
                    "mqttUser": "user",
                    "mqttPass": "password",
                    "mqttDebug": false
                }
            ]
        }
```

