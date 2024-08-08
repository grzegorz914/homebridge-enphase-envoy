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

* Support Token authorization from plugin v6.0.0.
  * Token can be generated automatically with enlighten user and password or with externall tools.
    * Token generated with enlighten credentials data will be automatically refreshed if expire.
    * Token generated with externall tools cannot be refreshed automatically if expire.
* Envoy `password` is detected automatically or can be added in config if was already chenged by user.
* Installer `password` is generated automatically, only Fw. <= v5.x.x.
* Envoy `device ID` is detected automatically.
* Support `Production Power Mode` and `PLC Level`, Fw. 7.x.x and newer require installer credentials data.
* For best experiences and display all data please use `Controller` or `EVE` app.
* Support external integrations, [RESTFul](https://github.com/grzegorz914/homebridge-enphase-envoy?tab=readme-ov-file#restful-integration), [MQTT](https://github.com/grzegorz914/homebridge-enphase-envoy?tab=readme-ov-file#mqtt-integration).
* Supported devices:
  * Firmware `v5.x.x`, `6.x.x`, `v7.x.x`, `v8.x.x`.
  * Envoy `Envoy S`, `IQ Envoy`, `IQ Load Controller`, `IQ Combiner`.
  * Q-Relays `Q-RELAY-1P` `Q-RELAY-3P`.
  * AC Batteries `AC Battery Storage`.
  * Meters `Production`, `Consumption`, `Storage`.
  * Microinverters `M215`, `M250`, `IQ6`, `IQ7`, `IQ8`.
  * Encharges `IQ Battery 3`, `IQ Battery 10`, `IQ Battery 5P`, `IQ Battery 3T`, `IQ Battery 10T`,
  * Ensemble/Enpower `IQ System Controller`, `IQ System Controller 2`.
  * WirelessKit `Communications Kit`.
  * Generator
* Exposed accessory in the native Home app:
  * Sensors:
    * System `Data Refresh`
    * Production `Power State`, `Power Level`, `Energy State`, `Energy Level`.
    * Consumption `Power State`, `Power Level`, `Energy State`, `Energy Level`.
    * Enpower `Grid State`.
    * Encharge: `Backup Level`
    * Grid Mode:
      * Enpower `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`.
      * Encharge `Multimode Grid On`, `Multimode Grid Off`.
      * Solar `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`.
  * Switches, Outlets, Lightbulbs:
    * System `Data Refresh`,
    * Production `Power State`, `Power Level`.
    * AC Battery `Energy State`, `Energy Level`.
    * Enpower `Grid State`.
    * Encharge `Energy State`, `Energy Level`.
    * Encharge Profile:
      * Self Consumption `Activate`, `Set Reserve`.
      * Savings `Activate`, `Set Reserve`.
      * Full Backup `Activate`.

### Configuration

* Run this plugin as a [Child Bridge](https://github.com/homebridge/homebridge/wiki/Child-Bridges) (Highly Recommended), this prevent crash Homebridge if plugin crashes.
* Install and use [Homebridge Config UI X](https://github.com/homebridge/homebridge-config-ui-x) to configure this plugin (Highly Recommended).
* The `sample-config.json` can be edited and used as an alternative.

<p align="center">
  <a href="https://github.com/grzegorz914/homebridge-enphase-envoy"><img src="https://raw.githubusercontent.com/grzegorz914/homebridge-enphase-envoy/main/graphics/ustawienia.png" width="840"></a>
</p>

| Key | Description |
| --- | --- |
| `name` | Here set the accessory `Name` to be displayed in `Homebridge/HomeKit`. |
| `host` | Here set the envoy `IP Address` or `Hostname` or leave empty (will be used default path `envoy.local`) |
| `envoyFirmware7xx` | This is support for Envoy Fw. v7.x.x and newer. If for some reason in the log You get `validate JWT token error`, log-in with stored in `/homebridge/enphaseEnvoy/envoyToken_xxxxx` token to Envoy from web browser first. |
| `envoyFirmware7xxTokenGenerationMode` | Here select how You wuld to obtain the token, `0 - Enlighten User And Password`, `1 - Your Own Generated Token`. |
| `envoyPasswd` | Here set the envoy password (only if U already changed the default password) |
| `envoyToken` | Here set Your own Token only if You select `1 - Your Own Generated Token`. |
| `envoySerialNumber` | Here set the envoy serial number. |
| `enlightenUser` | Here set the enlighten user name. |
| `enlightenPasswd` | Here set the enlighten password. |
| `powerProductionSummary` | Here set the `Power Summary` in `W` of all microinverters, based on this value HomeKit app will display power level `0-100 %`. |
| `powerProductionStateSensor` | This is `Power State Sensor` for production monitoring. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `powerProductionLevelSensors` | This is `Power Level Sensor` for production monitoring. |
| `name` | Here set Your own sensor name. |
| `powerLevel` | Here set power level in `W` at which the sensor fired. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `energyProductionStateSensor` | This is `Energy State Sensor` for production monitoring. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `energyProductionLevelSensors` | This is `Energy Level Sensor` for production monitoring. |
| `name` | Here set Your own sensor name. |
| `energyLevel` | Here set energy level in `Wh` at which the sensor fired. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `energyProductionLifetimeOffset` | Here set the `Energy Offset` in `Wh` for production if nedded `+/-`. |
| `powerConsumptionTotalStateSensor` | This is `Power State Sensor` for consumption `Total` monitoring. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `powerConsumptionTotalLevelSensors` | This is `Power Level Sensor` for consumption `Total` monitoring. |
| `name` | Here set Your own sensor name. |
| `powerLevel` | Here set power level in `W` at which the sensor fired. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `energyConsumptionTotalStateSensor` | This is `Energy State Sensor` for consumption `Total` monitoring. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `energyConsumptionTotalLevelSensors` | This is `Energy Level Sensor` for consumption `Total` monitoring. |
| `name` | Here set Your own sensor name. |
| `energyLevel` | Here set energy level in `Wh` at which the sensor fired. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `energyConsumptionTotalLifetimeOffset` | Here set the `Energy Offset` in `Wh` for consumption `Total` if nedded `+/-`. |
| `powerConsumptionNetStateSensor` | This is `Power State Sensor` for consumption `Net` monitoring. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `powerConsumptionNetLevelSensors` | This is `Power Level Sensor` for consumption `Net` monitoring. |
| `name` | Here set Your own sensor name. |
| `powerLevel` | Here set power level in `W` at which the sensor fired. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `energyConsumptionNetStateSensor` | This is `Energy State Sensor` for consumption `Net` monitoring. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `energyConsumptionNetLevelSensors` | This is `Energy Level Sensor` for consumption `Net` monitoring. |
| `name` | Here set Your own sensor name. |
| `energyLevel` | Here set energy level in `Wh` at which the sensor fired. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `energyConsumptionNetLifetimeOffset` | Here set the `Energy Offset` in `Wh` for consumption `Net` if nedded `+/-`. |
| `enepowerGridStateControl` | This is `Enpower Grid State Tile` for `Grid ON/OFF` control from HomeKit. |
| `name` | Here set Your own tile name. |
| `displayType` | Here select the tile type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Switch`, `2 - Outlet`, `3 - Lightbulb`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the tile name. |
| `enepowerGridStateSensor` | This is `Enpower Grid State Sensor` for `Grid` monitoring, if `Grid ON`, the contact fired. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `enepowerGridModeSensors` | That are `Enpower Grid Mode Sensors` for `Enpower Grid Mode` monitoring, if the `Mode` matches, the contact fired. |
| `name` | Here set Your own sensor name. |
| `gridMode` | Here select the grid mode `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `enchargeGridModeSensors` | That are `Encharge Grid Mode Sensors` for `Encharge Grid Mod` monitoring, if the `Mode` matches, the contact fired. |
| `name` | Here set Your own sensor name. |
| `gridMode` | Here select the grid mode `Multimode Grid On`, `Multimode Grid Off`. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `enchargeBackupLevelSensors` | That are `Encharge Backup Level Sensors` for `Encharge Backup Level` monitoring, if the `Level` matches, the contact fired. |
| `name` | Here set Your own sensor name. |
| `compareMode` | Here select the compare mode `<`, `<=`, `==`, `>`, `>=`. |
| `backupLevel` | Here set backup level in `%` to compare at which the sensor fired. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `solarGridModeSensors` | That are `Solar Grid Mode Sensors` for `Solar Grid Mode` monitoring, if the `Mode` matches, the contact fired. |
| `name` | Here set Your own sensor name. |
| `gridMode` | Here select the grid mode `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `dataRefreshControl` | This is `Data Refresh Tile` for `Data Refresh` control from HomeKit. |
| `name` | Here set Your own tile name. |
| `displayType` | Here select the tile type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Switch`, `2 - Outlet`, `3 - Lightbulb`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the tile name. |
| `dataRefreshSensor` | This is `Data Refresh Sensor` for `Data Refresh` monitoring, if working, the contact fired. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable/disable the accessory name as a prefix for the sensor name. |
| `supportProductionPowerMode` | If enabled, control `Production Power Mode` will be possible in `Envoy` 3rd apps, Fw. 7.x.x and newer require installer credentials data. |
| `supportPlcLevel` | If enabled, check `PLC Level` for all devices will be possible, Fw. 7.x.x and newer require installer credentials data. |
| `supportEnchargeProfile` | This is support to check/control encharge profile, not working yet. |
| `metersDataRefreshTime` | Here set `Meters Data` rfresh time in (sec). |
| `productionDataRefreshTime` | Here set `Production Data` rfresh time in (sec). |
| `liveDataRefreshTime` | Here set `Live Data` rfresh time in (sec). |
| `ensembleDataRefreshTime` | Here set `Ensemble Data` rfresh time in (sec). |
| `enableDebugMode` | If enabled, deep log will be present in homebridge console. |
| `disableLogInfo`| If enabled, info log will be hidden, all values and state will not be displayed in Homebridge log console. |
| `disableLogDeviceInfo` | If enabled, the info device log will be hidden by every plugin restart. |
| `restFul` | This is RSTful server. |
| `enable` | If enabled, RESTful server will start automatically and respond to any path request. |
| `port` | Here set the listening `Port` for RESTful server. |
| `debug` | If enabled, deep log will be present in homebridge console for RESTFul server. |
| `mqtt` | This is MQTT Broker. |
| `enable` | If enabled, MQTT Broker will start automatically and publish all awailable PV data. |
| `host` | Here set the `IP Address` or `Hostname` for MQTT Broker. |
| `port` | Here set the `Port` for MQTT Broker, default 1883. |
| `clientId` | Here optional set the `Client Id` of MQTT Broker. |
| `prefix` | Here set the `Prefix` for `Topic` or leave empty. |
| `auth` | If enabled, MQTT Broker will use authorization credentials. |
| `user` | Here set the MQTT Broker user. |
| `passwd` | Here set the MQTT Broker password. |
| `debug` | If enabled, deep log will be present in homebridge console for MQTT. |

### RESTFul Integration

* Request: `http//homebridge_ip_address:port/path`.
* Path: `token`, `info`, `home`, `inventory`, `meters`, `metersreading`, `ensembleinventory`, `ensemblestatus`, `gridprofile`, `livedata`, `production`, `productionct`, `microinverters`, `powermode`, `plclevel`.
* Respone as JSON data.

### MQTT Integration

| Direction | Topic | Message | Payload Data |
| --- | --- | --- | --- |
|  Publish   | `Token`, `Info`, `Home`, `Inventory`, `Meters`, `Meters Reading`, `Ensemble Inventory`, `Ensemble Status`, `Grid Profile`, `Live Data`, `Production`, `Production CT`, `Microinverters`, `Power Mode`, `PCU Comm Level` | `{"wattHoursToday": 2353, "wattsNow": 550}` | JSON object. |
|  Subscribe   | `Set` | `{"Power": true}` | JSON object. |

| Subscribe | Key | Value | Type | Description |
| --- | --- | --- | --- | --- |
| Envoy |     |     |     |      |
|     | `ProductionPowerMode` | `true`, `false` | boolean | Production power mode. |
|     | `PlcLevel` | `true`, `false` | boolean | Check Plc Level. |
|     | `EnchargeProfile` | `selfconsumption`, `savings`, `fullbackup` | string | Set encharge profile, not implemented yet. |
