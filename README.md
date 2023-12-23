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

</span>

## Package Requirements

| Package | Installation | Role | Required |
| --- | --- | --- | --- |
| [Homebridge](https://github.com/homebridge/homebridge) | [Homebridge Wiki](https://github.com/homebridge/homebridge/wiki) | HomeKit Bridge | Required |
| [Config UI X](https://github.com/homebridge/homebridge-config-ui-x) | [Config UI X Wiki](https://github.com/homebridge/homebridge-config-ui-x/wiki) | Homebridge Web User Interface | Recommended |
| [Enphase Envoy](https://www.npmjs.com/package/homebridge-enphase-envoy) | [Plug-In Wiki](https://github.com/grzegorz914/homebridge-enphase-envoy/wiki) | Homebridge Plug-In | Required |

### About The Plugin

* Support Fw. v7.x.x. and newer with Token authorization from plugin v6.0.0.
* All devices are detected automatically (Envoy, Q-Relays, AC Batteries, Meters, Microinverters, Ensemble, Encharges, Enpower, WirelessKit, Generator).
* Envoy `password` is detected automatically or can be added in config if was already chenged by user.
* Installer `password` is generated automatically, no need generate it manually in external generator anymore.
* Envoy `device ID` is detected automatically.
* Support `Ensemble Status` working only with Envoy Fw. v7.x.x and newer.
* Support `Production Power Mode` and `PLC Level` working only with Envoy Fw. v6.x.x and older.
* For best experiences and display all data please use `Controller` or `EVE` app.
* Exposed accessory in the native Home app:
  * Lightbulb `Power Production State` and `Power Production Level`.
  * Contact Sensors:
    * Production `Power State`, `Power Level`, `Energy State`, `Energy Level`.
    * Consumption `Power State`, `Power Level`, `Energy State`, `Energy Level`.
    * Grid State `Enpower`, `Encharge`, `Solar`.
* External integrations:
  * RESTful server:
    * Request: `http//homebridge_ip_address:port/path`.
    * Path: `token`, `info`, `home`, `inventory`, `meters`, `metersreading`, `ensembleinventory`, `ensemblestatus`, `gridprofile`, `livedata`, `production`, `productionct`, `microinverters`, `powermode`, `plclevel`.
    * Respone as JSON data.
  * MQTT client:
    * Topic: `Token`, `Info`, `Home`, `Inventory`, `Meters`, `Meters Reading`, `Ensemble Inventory`, `Ensemble Status`, `Grid Profile`, `Live Data`, `Production`, `Production CT`, `Microinverters`, `Power Mode`, `PCU Comm Level`.
    * Publish as JSON data.

### Configuration

* Run this plugin as a [Child Bridge](https://github.com/homebridge/homebridge/wiki/Child-Bridges) (Highly Recommended), this prevent crash Homebridge if plugin crashes.
* Install and use [Homebridge Config UI X](https://github.com/homebridge/homebridge-config-ui-x) to configure this plugin (Highly Recommended).
* The `sample-config.json` can be edited and used manually as an alternative.
* Be sure to always make a backup copy of your config.json file before making any changes to it.

<p align="center">
  <a href="https://github.com/grzegorz914/homebridge-enphase-envoy"><img src="https://raw.githubusercontent.com/grzegorz914/homebridge-enphase-envoy/main/graphics/ustawienia.png" width="840"></a>
</p>

| Key | Description |
| --- | --- |
| `name` | Here set the accessory `Name` to be displayed in `Homebridge/HomeKit`. |
| `host` | Here set the envoy `IP Address` or `Hostname` or leave empty (will be used default path `envoy.local`) |
| `envoyFirmware7xx` | This enable support for Envoy Fw. v7.x.x and newer. If for some reason in the log You get `validate JWT token error`, log-in with stored in `/homebridge/enphaseEnvoy/envoyToken_xxxxx` token to Envoy from web browser first. |
| `enlightenUser` | Here set the enlighten user name. |
| `enlightenPasswd` | Here set the enlighten password. |
| `envoySerialNumber` | Here set the envoy serial number. |
| `envoyPasswd` | Here set the envoy password (only if U already changed the default password) |
| `powerProductionSummary` | Here set the `Power Summary` in `W` of all microinverters, based on this value HomeKit app will display power level `0-100 %`. |
| `powerProductionStateSensor` | This enable `Power State` monitoring for production and expose contact sensor in HomeKit app. |
| `powerProductionStateSensor.name` | Here set Your own sensor name. |
| `powerProductionStateSensor.mode` | Here activate the sensor. |
| `powerProductionLevelSensors` | This enable `Power Level` monitoring for production and expose contact sensor in HomeKit app. |
| `powerProductionLevelSensors.name` | Here set Your own sensor name. |
| `powerProductionLevelSensors.powerLevel` | Here set power level in `W` at which the sensor fired. |
| `powerProductionLevelSensors.mode` | Here activate the sensor. |
| `energyProductionStateSensor` | This enable `Energy State` monitoring for production and expose contact sensor in HomeKit app. |
| `energyProductionStateSensor.name` | Here set Your own sensor name. |
| `energyProductionStateSensor.mode` | Here activate the sensor. |
| `energyProductionLevelSensors` | This enable `Energy Level` monitoring for production and expose contact sensor in HomeKit app. |
| `energyProductionLevelSensors.name` | Here set Your own sensor name. |
| `energyProductionLevelSensors.energyLevel` | Here set energy level in `Wh` at which the sensor fired. |
| `energyProductionLevelSensors.mode` | Here activate the sensor. |
| `energyProductionLifetimeOffset` | Here set the `Energy Offset` in `Wh` for production if nedded (+/-). |
| `powerConsumptionTotalStateSensor` | This enable `Power State` monitoring for consumption (Total) and expose contact sensor in HomeKit app. |
| `powerConsumptionTotalStateSensor.name` | Here set Your own sensor name. |
| `powerConsumptionTotalStateSensor.mode` | Here activate the sensor. |
| `powerConsumptionTotalLevelSensors` | This enable `Power Level` monitoring for consumption (Total) and expose contact sensor in HomeKit app. |
| `powerConsumptionTotalLevelSensors.name` | Here set Your own sensor name. |
| `powerConsumptionTotalLevelSensors.powerLevel` | Here set power level in `W` at which the sensor fired. |
| `powerConsumptionTotalLevelSensors.mode` | Here activate the sensor. |
| `energyConsumptionTotalStateSensor` | This enable `Energy State` monitoring for consumption (Total) and expose contact sensor in HomeKit app. |
| `energyConsumptionTotalStateSensor.name` | Here set Your own sensor name. |
| `energyConsumptionTotalStateSensor.mode` | Here activate the sensor. |
| `energyConsumptionTotalLevelSensors` | This enable `Energy Level` monitoring for consumption (Total) and expose contact sensor in HomeKit app. |
| `energyConsumptionTotalLevelSensors.name` | Here set Your own sensor name. |
| `energyConsumptionTotalLevelSensors.energyLevel` | Here set energy level in `Wh` at which the sensor fired. |
| `energyConsumptionTotalLevelSensors.mode` | Here activate the sensor. |
| `energyConsumptionTotalLifetimeOffset` | Here set the `Energy Offset` in `Wh` for consumption (Total) if nedded (+/-). |
| `powerConsumptionNetStateSensor` | This enable `Power State` monitoring for consumption (Net) and expose contact sensor in HomeKit app. |
| `powerConsumptionNetStateSensor.name` | Here set Your own sensor name. |
| `powerConsumptionNetStateSensor.mode` | Here activate the sensor. |
| `powerConsumptionNetLevelSensors` | This enable `Power Level` monitoring for consumption (Net) and expose contact sensor in HomeKit app. |
| `powerConsumptionNetLevelSensors.name` | Here set Your own sensor name. |
| `powerConsumptionNetLevelSensors.powerLevel` | Here set power level in `W` at which the sensor fired. |
| `powerConsumptionNetLevelSensors.mode` | Here activate the sensor. |
| `energyConsumptionNetStateSensor` | This enable `Energy State` monitoring for consumption (Net) and expose contact sensor in HomeKit app. |
| `energyConsumptionNetStateSensor.name` | Here set Your own sensor name. |
| `energyConsumptionNetStateSensor.mode` | Here activate the sensor. |
| `energyConsumptionNetLevelSensors` | This enable `Energy Level` monitoring for consumption (Net) and expose contact sensor in HomeKit app. |
| `energyConsumptionNetLevelSensors.name` | Here set Your own sensor name. |
| `energyConsumptionNetLevelSensors.energyLevel` | Here set energy level in `Wh` at which the sensor fired. |
| `energyConsumptionNetLevelSensors.mode` | Here activate the sensor. |
| `energyConsumptionNetLifetimeOffset` | Here set the `Energy Offset` in `Wh` for consumption (Net) if nedded (+/-). |
| `enepowerGridStateSensor` | This enable `Enpower Grid State` monitoring and expose contact sensor in HomeKit app. If `Enpower Grid State OFF` the contact fired. |
| `enepowerGridStateSensor.name` | Here set Your own sensor name. |
| `enepowerGridStateSensor.mode` | Here activate the sensor. |
| `enchargeGridStateSensor` | This enable `Encharge Grid State` monitoring and expose contact sensor in HomeKit app. If `Encharge Grid State OFF` the contact fired. |
| `enchargeGridStateSensor.name` | Here set Your own sensor name. |
| `enchargeGridStateSensor.mode` | Here activate the sensor. |
| `solarGridStateSensor` | This enable `Solar Grid State` monitoring and expose contact sensor in HomeKit app. If `Solar Grid State OFF` the contact fired. |
| `solarGridStateSensor.name` | Here set Your own sensor name. |
| `solarGridStateSensor.mode` | Here activate the sensor. |
| `supportProductionPowerMode` | If enabled, control `Production Power Mode` will be possible in `Envoy` section (EVE or Controler app) (only Fw. v6.x.x and older). |
| `supportPlcLevel` | If enabled, check `PLC Level` will be possible (only Fw. v6.x.x and older). |
| `supportEnsembleStatus` | If enabled, check `Ensemble Status` will be possible (only Fw. v7.x.x and newer). |
| `supportLiveData` | If enabled, check `Live Data` will be possible (only Fw. v7.x.x and newer). |
| `liveDataRefreshTime` | Here set `Live Data` rfresh time in (ms). |
| `metersDataRefreshTime` | Here set `Meters Data` rfresh time in (ms). |
| `productionDataRefreshTime` | Here set `Production Data` rfresh time in (ms). |
| `enableDebugMode` | If enabled, deep log will be present in homebridge console. |
| `disableLogInfo`| If enabled, then disable log info, all values and state will not be displayed in Homebridge log console |
| `disableLogDeviceInfo` | If enabled, add ability to disable log device info by every connections device to the network. |
| `enableRestFul` | If enabled, RESTful server will start automatically and respond to any path request. |
| `restFulPort` | Here set the listening `Port` for RESTful server. |
| `restFulDebug` | If enabled, deep log will be present in homebridge console for RESTFul server. |
| `enableMqtt` | If enabled, MQTT Broker will start automatically and publish all awailable PV installation data. |
| `mqttHost` | Here set the `IP Address` or `Hostname` for MQTT Broker. |
| `mqttPort` | Here set the `Port` for MQTT Broker, default 1883. |
| `mqttClientId` | Here optional set the `Client Id` of MQTT Broker. |
| `mqttPrefix` | Here set the `Prefix` for `Topic` or leave empty. |
| `mqttAuth` | If enabled, MQTT Broker will use authorization credentials. |
| `mqttUser` | Here set the MQTT Broker user. |
| `mqttPasswd` | Here set the MQTT Broker password. |
| `mqttDebug` | If enabled, deep log will be present in homebridge console for MQTT. |
