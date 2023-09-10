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

* Firmware v7.x.x. and Token authorization is supported from plugin v6.0.0.
* All devices are detected automatically (Envoy, Q-Relays, AC Batteries, Meters, Microinverters, Ensemble, Encharges, Enpower, WirelessKit).
* Envoy `device ID` is detected automatically, is required to control `Production Power Mode`.
* Envoy `password` is detected automatically or can be added in config if was already chenged by user.
* Installer `password` is generated automatically, no need generate it manually in external generator anymore.
* Support `Ensemble Status` and `Production Power Mode` may not working with all envoy firmware 7.x.x, if you get error, please disable it in plugin settings `Advanced Section`.
* For best experiences and display all data please use `Controller App` or `EVE app`.e
* Exposed accessory in the native Home app:
  * Lightbulb `Power Production State` and `Power Production Level`.
  * Contact Sensors:
    * Production `Power State`, `Power Peak`, `Energy State`, `Energy Level`.
    * Consumption `Power State`, `Power Peak`.
* RESTful server:
  * Request: `http//homebridge_ip_address:port/path`.
  * Path: `token`, `info`, `home`, `inventory`, `meters`, `metersreading`, `ensembleinventory`, `ensemblestatus`, `gridprofile`, `livedata`, `production`, `productionct`, `microinverters`, `powermode`, `plclevel`.
  * Respone as JSON data.
* MQTT client:
  * Topic: `Token`, `Info`, `Home`, `Inventory`, `Meters`, `Meters Reading`, `Ensemble Inventory`, `Ensemble Status`, `Grid Profile`, `Live Data`, `Production`, `Production CT`, `Microinverters`, `Power Mode`, `PCU Comm Level`.
  * Publish as JSON data.

### Configuration

* Run this plugin as a [Child Bridge](https://github.com/homebridge/homebridge/wiki/Child-Bridges) (Highly Recommended), this prevent crash Homebridge if plugin crashes.
* Install and use [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x/wiki) to configure this plugin (Highly Recommended).
* The `sample-config.json` can be edited and used manually as an alternative.
* Be sure to always make a backup copy of your config.json file before making any changes to it.

<p align="center">
  <a href="https://github.com/grzegorz914/homebridge-enphase-envoy"><img src="https://raw.githubusercontent.com/grzegorz914/homebridge-enphase-envoy/main/graphics/ustawienia.png" width="840"></a>
</p>

| Key | Description |
| --- | --- |
| `name` | Here set the accessory `Name` to be displayed in `Homebridge/HomeKit`. |
| `host` | Here set the envoy `IP Address` or `Hostname` or leave empty (will be used default path `envoy.local`) |
| `enableDebugMode` | If enabled, deep log will be present in homebridge console. |
| `disableLogInfo`| If enabled, then disable log info, all values and state will not be displayed in Homebridge log console |
| `disableLogDeviceInfo` | If enabled, add ability to disable log device info by every connections device to the network. |
| `envoyFirmware7xx` | This enable support for Envoy firmware v7.x.x. If for some reason in the log You get `validate JWT token error`, login with stored in `/homebridge/enphaseEnvoy/envoyToken_xxxxx` token to Envoy from web browser first. |
| `enlightenUser` | Here set the enlihten user name. |
| `enlightenPasswd` | Here set the enlihten password. |
| `envoySerialNumber` | Here set the envoy serial number. |
| `envoyPasswd` | Here set the envoy password (only if U already changed the default password) |
| `powerProductionSummary` | Here set the `Power Summary` in `W` of all microinverters, based on this value HomeKit app will display power level `0-100 %`. |
| `powerProductionOnOff` | This enable `Power State` monitoring for production and expose contact sensor in HomeKit app. |
| `powerProductionMax` | This enable `Power Peak` monitoring for production and expose contact sensor in HomeKit app. |
| `powerProductionMaxAutoReset` | Here select at which period of time the `Power Peak` will auto reset. |
| `powerProductionMaxDetected` | Here set the production `Power Peak` in (W), if the `Power Production` >= `powerProductionMaxDetected` the contact sensor fired. |
| `energyProductionStateSensor` | This enable `Energy State` monitoring for production and expose contact sensor in HomeKit app.. |
| `energyProductionLevelSensor` | This enable `Energy Level` monitoring for production and expose contact sensor in HomeKit app. |
| `energyProductionLevelDetected` | Here set `Energy Level` in (Wh), if the `Energ Level Today` >= `energyProductionLevelDetected` the contact sensor fired. |
| `energyProductionLifetimeOffset` | Here set the `Offset` of lifetime energy production if nedded in (Wh),(+/-) |
| `powerConsumptionTotalMax` | This enable `Power Peak` monitoring for consumption (Total) and expose contact sensor in HomeKit app. |
| `powerConsumptionTotalMaxAutoReset` | Here select at which period of time the `Power Peak` will auto reset. |
| `powerConsumptionTotalMaxDetected` | Here set the consumption (Total) `Power Peak`, if the Power >= `powerConsumptionTotalMaxDetected` the contact sensor fired.|
| `energyConsumptionTotalLifetimeOffset` | Here set the offset of lifetime total energy consumption if nedded in (Wh),(+/-) |
| `powerConsumptionNetMax` | This enable `Power Peak` monitoring for consumption (Net) and expose contact sensor in HomeKit app. |
| `powerConsumptionNetMaxAutoReset` | Here select at which period of time the `Power Peak` will auto reset. |
| `powerConsumptionNetMaxDetected` | Here set the consumption (Net) `Power Peak`, if the Power >= `powerConsumptionNetMaxDetected` the contact sensor fired. |
| `energyConsumptionNetLifetimeOffset` | Here set the offset of lifetime net energy consumption if nedded in (Wh),(+/-) |
| `supportProductionPowerMode` | If enabled, check/control `Production Power Mode` will be possible in `Envoy` section (EVE or Controler app). |
| `supportPlcLevel` | If enabled, check `PLC Level` will be possible. |
| `supportEnsembleStatus` | If enabled, check `Ensemble Status` will be possible (only fw. 7.x.x), more info in `About The Plugin` section. |
| `supportLiveData` | If enabled, check `Live Data` will be possible (only fw. 7.x.x). |
| `liveDataRefreshTime` | Here set `Live Data` rfresh time in (ms). |
| `metersDataRefreshTime` | Here set `Meters Data` rfresh time in (ms). |
| `productionDataRefreshTime` | Here set `Production Data` rfresh time in (ms). |
| `enableRestFul` | If enabled, RESTful server will start automatically and respond to any path request. |
| `restFulPort` | Here set the listening `Port` for RESTful server. |
| `restFulDebug` | If enabled, deep log will be present in homebridge console for RESTFul server. |
| `enableMqtt` | If enabled, MQTT Broker will start automatically and publish all awailable PV installation data. |
| `mqttHost` | Here set the `IP Address` or `Hostname` for MQTT Broker. |
| `mqttPort` | Here set the `Port` for MQTT Broker, default 1883. |
| `mqttPrefix` | Here set the `Prefix` for `Topic` or leave empty. |
| `mqttAuth` | If enabled, MQTT Broker will use authorization credentials. |
| `mqttUser` | Here set the MQTT Broker user. |
| `mqttPasswd` | Here set the MQTT Broker password. |
| `mqttDebug` | If enabled, deep log will be present in homebridge console for MQTT. |
