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
* Support [Power Production State](https://github.com/grzegorz914/homebridge-enphase-envoy/wiki#power-production-control) and `PLC Level`, Fw. v7.x.x and newer require installer credentials data.
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
    * Encharge: `State`, `Backup Level`, `Dry Contacts`.
    * Grid Mode:
      * Enpower `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`.
      * Encharge `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`.
      * Solar `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`.
    * Generator `State`, `Mode`.  
  * Switches, Outlets, Lightbulbs:
    * System `Data Refresh`,
    * Production `Plc Level`, `Power Mode`, `Power State`, `Power Level`.
    * AC Battery `Energy State`, `Energy Level`.
    * Enpower `Grid State`, `Dry Contacts`.
    * Encharge `Energy State`, `Energy Level`.
    * Encharge Profile:
      * Self Consumption `Activate`, `Set Reserve`.
      * Savings `Activate`, `Set Reserve`.
      * Economy `Activate`, `Set Reserve`.
      * Full Backup `Activate`.
    * Generator `State`, `Mode`.

  * Sensors:
    * Production `Power State`, `Power Level`, `Energy State`, `Energy Level`.
    * Consumption `Power State`, `Power Level`, `Energy State`, `Energy Level`.
    * Encharge: `Backup Level`
    * Grid Mode:
      * Enpower `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`.
      * Encharge `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`.
      * Solar `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`.

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
| `envoyFirmware7xx` | This enable support for Envoy Fw. v7.x.x and newer. |
| `envoyFirmware7xxTokenGenerationMode` | Here select how You wuld to obtain the token, `0 - Enlighten Credentials`, `1 - Your Own Generated Token`. |
| `envoyPasswd` | Here set the envoy password (only if U already changed the default password) |
| `envoyToken` | Here set Your own Token only if You select `1 - Your Own Generated Token`. |
| `envoySerialNumber` | Here set the envoy serial number. |
| `enlightenUser` | Here set the enlighten user name. |
| `enlightenPasswd` | Here set the enlighten password. |
| `supportPowerProductionState` | This enable support for [Power Production State](https://github.com/grzegorz914/homebridge-enphase-envoy/wiki#power-production-control) check, Fw. v7.x.x and newer require installer credentials data. |
| `powerProductionStateControl` | This is `Power Production Control Tile` for production state control, Fw. v7.x.x and newer require installer credentials data. |
| `name` | Here set Your own tile name. |
| `displayType` | Here select the tile type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Switch`, `2 - Outlet`, `3 - Lightbulb`. |
| `namePrefix` | This enable the accessory name as a prefix for the tile name. |
| `supportPlcLevel` | This enable support for `PLC Level Check` for all devices, Fw. v7.x.x and newer require installer credentials data. |
| `plcLevelControl` | This is `Plc Level Control Tile` for plc level check, Fw. v7.x.x and newer require installer credentials data |
| `name` | Here set Your own tile name. |
| `displayType` | Here select the tile type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Switch`, `2 - Outlet`, `3 - Lightbulb`. |
| `namePrefix` | This enable the accessory name as a prefix for the tile name. |
| `powerProductionSummary` | Here set the `Power Summary` in `W` of all microinverters, based on this value HomeKit app will display power level `0-100 %`. |
| `powerProductionStateSensor` | This is `Power State Sensor` for production monitoring. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `powerProductionLevelSensors` | This is `Power Level Sensor` for production monitoring. |
| `name` | Here set Your own sensor name. |
| `powerLevel` | Here set power level in `W` at which the sensor fired. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `energyProductionStateSensor` | This is `Energy State Sensor` for production monitoring. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `energyProductionLevelSensors` | This is `Energy Level Sensor` for production monitoring. |
| `name` | Here set Your own sensor name. |
| `energyLevel` | Here set energy level in `Wh` at which the sensor fired. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `energyProductionLifetimeOffset` | Here set the `Energy Offset` in `Wh` for production if nedded `+/-`. |
| `powerConsumptionTotalStateSensor` | This is `Power State Sensor` for consumption `Total` monitoring. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `powerConsumptionTotalLevelSensors` | This is `Power Level Sensor` for consumption `Total` monitoring. |
| `name` | Here set Your own sensor name. |
| `powerLevel` | Here set power level in `W` at which the sensor fired. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `energyConsumptionTotalStateSensor` | This is `Energy State Sensor` for consumption `Total` monitoring. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `energyConsumptionTotalLevelSensors` | This is `Energy Level Sensor` for consumption `Total` monitoring. |
| `name` | Here set Your own sensor name. |
| `energyLevel` | Here set energy level in `Wh` at which the sensor fired. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `energyConsumptionTotalLifetimeOffset` | Here set the `Energy Offset` in `Wh` for consumption `Total` if nedded `+/-`. |
| `powerConsumptionNetStateSensor` | This is `Power State Sensor` for consumption `Net` monitoring. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `powerConsumptionNetLevelSensors` | This is `Power Level Sensor` for consumption `Net` monitoring. |
| `name` | Here set Your own sensor name. |
| `powerLevel` | Here set power level in `W` at which the sensor fired. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `energyConsumptionNetStateSensor` | This is `Energy State Sensor` for consumption `Net` monitoring. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `energyConsumptionNetLevelSensors` | This is `Energy Level Sensor` for consumption `Net` monitoring. |
| `name` | Here set Your own sensor name. |
| `energyLevel` | Here set energy level in `Wh` at which the sensor fired. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `energyConsumptionNetLifetimeOffset` | Here set the `Energy Offset` in `Wh` for consumption `Net` if nedded `+/-`. |
| `enepowerGridStateControl` | This is `Enpower Grid State Control` for `Grid ON/OFF` control from HomeKit. |
| `name` | Here set Your own tile name. |
| `displayType` | Here select the tile type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Switch`, `2 - Outlet`, `3 - Lightbulb`. |
| `namePrefix` | This enable the accessory name as a prefix for the tile name. |
| `enepowerGridStateSensor` | This is `Enpower Grid State Sensor` for `Grid` monitoring, if `Grid ON`, the contact fired. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `enepowerGridModeSensors` | That are `Enpower Grid Mode Sensors` for `Enpower Grid Mode` monitoring, if the `Mode` matches, the contact fired. |
| `name` | Here set Your own sensor name. |
| `gridMode` | Here select the grid mode `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `enchargeStateSensor` | This is `Encharge State Sensor` for `State` monitoring, if `State ON`, the contact fired. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `enchargeProfileControl` | This is `Encharge Profile Control` for `Profile` control from HomeKit. |
| `name` | Here set Your own tile name. |
| `profile` | Here select the profile `Savings`, `Economy`, `Full Backup`, `Self Consumption`. |
| `displayType` | Here select the tile type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Lightbulb`. |
| `enchargeGridModeSensors` | That are `Encharge Grid Mode Sensors` for `Encharge Grid Mod` monitoring, if the `Mode` matches, the contact fired. |
| `name` | Here set Your own sensor name. |
| `gridMode` | Here select the grid mode `Multimode Grid On`, `Multimode Grid Off`. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `enchargeBackupLevelSensors` | That are `Encharge Backup Level Sensors` for `Encharge Backup Level` monitoring, if the `Level` matches, the contact fired. |
| `name` | Here set Your own sensor name. |
| `compareMode` | Here select the compare mode `<`, `<=`, `==`, `>`, `>=`. |
| `backupLevel` | Here set backup level in `%` to compare at which the sensor fired. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `solarGridModeSensors` | That are `Solar Grid Mode Sensors` for `Solar Grid Mode` monitoring, if the `Mode` matches, the contact fired. |
| `name` | Here set Your own sensor name. |
| `gridMode` | Here select the grid mode `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `enpowerDryContactsControl` | This enable `Dry Contacts` control and expose `Switches` in HomeKit. |
| `enpowerDryContactsSensors` | This enable `Dry Contacts` monitoring and expose `Sensors` in HomeKit. |
| `generatorStateControl` | This is `Generator State Control` for `Generator OFF/ON` control from HomeKit. |
| `name` | Here set Your own tile name. |
| `displayType` | Here select the tile type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Switch`, `2 - Outlet`, `3 - Lightbulb`. |
| `namePrefix` | This enable the accessory name as a prefix for the tile name. |
| `generatorStateSensor` | This is `Generator State Sensor` for `State` monitoring, if `State not Off`, the contact fired. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `generatorModeContol` | That are `Generator Mode Control`, for `Generator OFF/ON/AUTO` control from HomeKit. |
| `name` | Here set Your own tile name. |
| `mode` | Here select the grid mode `Off`, `On`, `Auto`. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Switch`, `2 - Outlet`, `3 - Lightbulb`. |
| `generatorModeSensors` | That are `Generator Mode Sensors` for `Generator Mode` monitoring, if the `Mode` matches, the contact fired. |
| `name` | Here set Your own sensor name. |
| `mode` | Here select the grid mode `Off`, `On`, `Auto`. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `dataRefreshControl` | This is `Data Refresh Control` for `Data Refresh` control from HomeKit. |
| `name` | Here set Your own tile name. |
| `displayType` | Here select the tile type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Switch`, `2 - Outlet`, `3 - Lightbulb`. |
| `namePrefix` | This enable the accessory name as a prefix for the tile name. |
| `dataRefreshSensor` | This is `Data Refresh Sensor` for `Data Refresh` monitoring, if working, the contact fired. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
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
* Path: `token`, `info`, `home`, `inventory`, `meters`, `metersreading`, `ensembleinventory`, `ensemblestatus`, `enchargeettings`, `tariff`, `drycontacts`, `drycontactssettinge`, `generator`, `generatorsettings`, `gridprofile`, `livedata`, `production`, `productionct`, `microinverters`, `powermode`, `plclevel`.
* Respone as JSON data.

### MQTT Integration

| Direction | Topic | Message | Payload Data |
| --- | --- | --- | --- |
|  Publish   | `Token`, `Info`, `Home`, `Inventory`, `Meters`, `Meters Reading`, `Ensemble Inventory`, `Ensemble Status`, `Encharge Settings`, `Tariff`, `Dry Contacts`, `Dry Contacts Settings`, `Generator`, `Generator Settings`, `Grid Profile`, `Live Data`, `Production`, `Production CT`, `Microinverters`, `Power Mode`, `PCU Comm Level` | `{"wattHoursToday": 2353, "wattsNow": 550}` | JSON object. |
|  Subscribe   | `Set` | `{"Power": true}` | JSON object. |

| Subscribe | Key | Value | Type | Description |
| --- | --- | --- | --- | --- |
| Envoy |     |     |     |      |
|     | `PowerProductionState` | `true`, `false` | boolean | Power production state On/Off. |
|     | `PlcLevel` | `true`, `false` | boolean | Check Plc Level. |
|     | `EnchargeProfile` | `selfconsumption`, `savings`, `economy`, `fullbackup` | string | Set encharge profile. |
|     | `EnpowerGridState` | `true`, `false` | boolean | Grid state On/Off. |
|     | `GeneratorMode` | `off`, `on`, `auto` | string | Generator mode Off/On/Auto. |
