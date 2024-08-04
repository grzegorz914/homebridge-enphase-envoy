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
* Installer `password` is generated automatically, no need generate it manually in external generator anymore.
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
  * Lightbulb:
    * Production `Power State`, `Power Level`.
    * AC Battery `Energy State`, `Energy Level`.
    * Encharge `Energy State`, `Energy Level`.
    * Encharge Profile:
      * Self Consumption `Activate`, `Set Reserve`.
      * Savings `Activate`, `Set Reserve`.
      * Full Backup `Activate`.
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
| `envoyFirmware7xxTokenGenerationMode` | Here select how You wuld to obtain the token, `0 - Enlighten User And Password`, `1 - Your Own Generated Token`. |
| `envoyPasswd` | Here set the envoy password (only if U already changed the default password) |
| `envoyToken` | Here paste Your own Token. |
| `envoySerialNumber` | Here set the envoy serial number. |
| `enlightenUser` | Here set the enlighten user name. |
| `enlightenPasswd` | Here set the enlighten password. |
| `powerProductionSummary` | Here set the `Power Summary` in `W` of all microinverters, based on this value HomeKit app will display power level `0-100 %`. |
| `powerProductionStateSensor` | This enable `Power State` monitoring for production and expose contact sensor in HomeKit app. |
| `powerProductionStateSensor.name` | Here set Your own sensor name. |
| `powerProductionStateSensor.displayType` | Here select the characterristic type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `powerProductionLevelSensors` | This enable `Power Level` monitoring for production and expose contact sensor in HomeKit app. |
| `powerProductionLevelSensors.name` | Here set Your own sensor name. |
| `powerProductionLevelSensors.powerLevel` | Here set power level in `W` at which the sensor fired. |
| `powerProductionLevelSensors.displayType` | Here select the characterristic type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `energyProductionStateSensor` | This enable `Energy State` monitoring for production and expose contact sensor in HomeKit app. |
| `energyProductionStateSensor.name` | Here set Your own sensor name. |
| `energyProductionStateSensor.displayType` | Here select the characterristic type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `energyProductionLevelSensors` | This enable `Energy Level` monitoring for production and expose contact sensor in HomeKit app. |
| `energyProductionLevelSensors.name` | Here set Your own sensor name. |
| `energyProductionLevelSensors.energyLevel` | Here set energy level in `Wh` at which the sensor fired. |
| `energyProductionLevelSensors.displayType` | Here select the characterristic type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `energyProductionLifetimeOffset` | Here set the `Energy Offset` in `Wh` for production if nedded `+/-`. |
| `powerConsumptionTotalStateSensor` | This enable `Power State` monitoring for consumption `(Total` and expose contact sensor in HomeKit app. |
| `powerConsumptionTotalStateSensor.name` | Here set Your own sensor name. |
| `powerConsumptionTotalStateSensor.displayType` | Here select the characterristic type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `powerConsumptionTotalLevelSensors` | This enable `Power Level` monitoring for consumption `Total` and expose contact sensor in HomeKit app. |
| `powerConsumptionTotalLevelSensors.name` | Here set Your own sensor name. |
| `powerConsumptionTotalLevelSensors.powerLevel` | Here set power level in `W` at which the sensor fired. |
| `powerConsumptionTotalLevelSensors.displayType` | Here select the characterristic type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `energyConsumptionTotalStateSensor` | This enable `Energy State` monitoring for consumption `Total` and expose contact sensor in HomeKit app. |
| `energyConsumptionTotalStateSensor.name` | Here set Your own sensor name. |
| `energyConsumptionTotalStateSensor.displayType` | Here select the characterristic type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `energyConsumptionTotalLevelSensors` | This enable `Energy Level` monitoring for consumption `Total` and expose contact sensor in HomeKit app. |
| `energyConsumptionTotalLevelSensors.name` | Here set Your own sensor name. |
| `energyConsumptionTotalLevelSensors.energyLevel` | Here set energy level in `Wh` at which the sensor fired. |
| `energyConsumptionTotalLevelSensors.displayType` | Here select the characterristic type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `energyConsumptionTotalLifetimeOffset` | Here set the `Energy Offset` in `Wh` for consumption `Total` if nedded `+/-`. |
| `powerConsumptionNetStateSensor` | This enable `Power State` monitoring for consumption `Net` and expose contact sensor in HomeKit app. |
| `powerConsumptionNetStateSensor.name` | Here set Your own sensor name. |
| `powerConsumptionNetStateSensor.displayType` | Here select the characterristic type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `powerConsumptionNetLevelSensors` | This enable `Power Level` monitoring for consumption `Net` and expose contact sensor in HomeKit app. |
| `powerConsumptionNetLevelSensors.name` | Here set Your own sensor name. |
| `powerConsumptionNetLevelSensors.powerLevel` | Here set power level in `W` at which the sensor fired. |
| `powerConsumptionNetLevelSensors.displayType` | Here select the characterristic type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `energyConsumptionNetStateSensor` | This enable `Energy State` monitoring for consumption `Net` and expose contact sensor in HomeKit app. |
| `energyConsumptionNetStateSensor.name` | Here set Your own sensor name. |
| `energyConsumptionNetStateSensor.displayType` | Here select the characterristic type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `energyConsumptionNetLevelSensors` | This enable `Energy Level` monitoring for consumption `Net` and expose contact sensor in HomeKit app. |
| `energyConsumptionNetLevelSensors.name` | Here set Your own sensor name. |
| `energyConsumptionNetLevelSensors.energyLevel` | Here set energy level in `Wh` at which the sensor fired. |
| `energyConsumptionNetLevelSensors.displayType` | Here select the characterristic type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `energyConsumptionNetLifetimeOffset` | Here set the `Energy Offset` in `Wh` for consumption `Net` if nedded `+/-`. |
| `enepowerGridModeSensors` | Sensors`Enpower Grid Mode` monitoring and expose as a contact sensor in HomeKit app. If `Enpower Grid Mode` matches, the contact fired. |
| `enepowerGridModeSensors.name` | Here set Your own sensor name. |
| `enepowerGridModeSensors.gridMode` | Here select the grid mode `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off` for sensor. |
| `enepowerGridModeSensors.displayType` | Here select the characterristic type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `enchargeGridModeSensors` |Sensors `Encharge Grid Mode` monitoring and expose as a contact sensor in HomeKit app. If `Encharge Grid Mod` matches, the contact fired. |
| `enchargeGridModeSensors.name` | Here set Your own sensor name. |
| `enchargeGridModeSensors.gridMode` | Here select the grid mode `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off` for sensor. |
| `enchargeGridModeSensors.displayType` | Here select the characterristic type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `enchargeBackupLevelSensors` |Sensors `Encharge Backup Level` monitoring and expose as a contact sensor in HomeKit app. If `Encharge Backup Level` matches, the contact fired. |
| `enchargeBackupLevelSensors.name` | Here set Your own sensor name. |
| `enchargeBackupLevelSensors.compareMode` | Here select the compare mode `<`, `<=`, `==`, `>`, `>=`. |
| `enchargeBackupLevelSensors.backupLevel` | Here set backup level in `%` to compare at which the sensor fired. |
| `enchargeBackupLevelSensors.displayType` | Here select the characterristic type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `solarGridModeSensors` | Sensors `Solar Grid Mode` monitoring and expose as a contact sensors in HomeKit app. If `Solar Grid Mode` matches, the contact fired. |
| `solarGridModeSensors.name` | Here set Your own sensor name. |
| `solarGridModeSensors.gridMode` | Here select the grid mode `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off` for sensor. |
| `solarGridModeSensors.displayType` | Here select the characterristic type to be displayed in HomeKit app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `supportProductionPowerMode` | If enabled, control `Production Power Mode` will be possible in `Envoy` section (EVE or Controler app), Fw. 7.x.x and newer require installer credentials data. |
| `supportPlcLevel` | If enabled, check `PLC Level` for all devices will be possible, Fw. 7.x.x and newer require installer credentials data. |
| `supportEnchargeProfile` | This enable support to check/control encharge profile. |
| `metersDataRefreshTime` | Here set `Meters Data` rfresh time in (sec). |
| `productionDataRefreshTime` | Here set `Production Data` rfresh time in (sec). |
| `liveDataRefreshTime` | Here set `Live Data` rfresh time in (sec). |
| `ensembleDataRefreshTime` | Here set `Ensemble Data` rfresh time in (sec). |
| `enableDebugMode` | If enabled, deep log will be present in homebridge console. |
| `disableLogInfo`| If enabled, info log will be hidden, all values and state will not be displayed in Homebridge log console. |
| `disableLogDeviceInfo` | If enabled, the info device log will be hidden by every plugin restart. |
| `enableRestFul` | If enabled, RESTful server will start automatically and respond to any path request. |
| `restFulPort` | Here set the listening `Port` for RESTful server. |
| `restFulDebug` | If enabled, deep log will be present in homebridge console for RESTFul server. |
| `enableMqtt` | If enabled, MQTT Broker will start automatically and publish all awailable PV data. |
| `mqttHost` | Here set the `IP Address` or `Hostname` for MQTT Broker. |
| `mqttPort` | Here set the `Port` for MQTT Broker, default 1883. |
| `mqttClientId` | Here optional set the `Client Id` of MQTT Broker. |
| `mqttPrefix` | Here set the `Prefix` for `Topic` or leave empty. |
| `mqttAuth` | If enabled, MQTT Broker will use authorization credentials. |
| `mqttUser` | Here set the MQTT Broker user. |
| `mqttPasswd` | Here set the MQTT Broker password. |
| `mqttDebug` | If enabled, deep log will be present in homebridge console for MQTT. |

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
