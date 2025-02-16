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

## About The Plugin

The `homebridge-enphase-envoy` plugin integrates Enphase Envoy solar energy monitoring systems with Homebridge, allowing HomeKit users to track solar production, consumption, and battery status directly in the Apple Home app. With real-time energy insights, automation possibilities, and Siri voice control, this plugin enhances smart home energy management by seamlessly connecting your Enphase Envoy system to the HomeKit ecosystem.

## Requirements

| Package | Installation | Role | Required |
| --- | --- | --- | --- |
| [Homebridge](https://github.com/homebridge/homebridge) | [Homebridge Wiki](https://github.com/homebridge/homebridge/wiki) | HomeKit Bridge | Required |
| [Config UI X](https://github.com/homebridge/homebridge-config-ui-x) | [Config UI X Wiki](https://github.com/homebridge/homebridge-config-ui-x/wiki) | Homebridge Web User Interface | Recommended |
| [Enphase Envoy](https://www.npmjs.com/package/homebridge-enphase-envoy) | [Plug-In Wiki](https://github.com/grzegorz914/homebridge-enphase-envoy/wiki) | Homebridge Plug-In | Required |

## Supported hardware
* Firmware v5 through v8
* System `Envoy S`, `IQ Gateway`, `IQ Load Controller`, `IQ Combiner`
* Q-Relays `Q-RELAY-1P` `Q-RELAY-3P`
* AC Batteries `AC Battery Storage`
* Meters `Production`, `Consumption`, `Storage`
* Microinverters `M215`, `M250`, `IQ6`, `IQ7`, `IQ8`
* Encharges `IQ Battery 3`, `IQ Battery 10`, `IQ Battery 5P`, `IQ Battery 3T`, `IQ Battery 10T`
* Ensemble/Enpower `IQ System Controller`, `IQ System Controller 2`
* WirelessKit `Communications Kit`
* Generator

## Exposed accessories in the Apple Home app

### Monitoring Sensors
* System `Data Refresh`
* Production `Power State`, `Power Level`, `Energy State`, `Energy Level`
* Consumption `Power State`, `Power Level`, `Energy State`, `Energy Level`
* Enpower `Grid State`
* Encharge: `State`, `Backup Level`, `Dry Contacts`
* Encharge Profile: `Self Consumption`, `Savings`, `Economy`, `Full Backup`
* Grid Mode
  * Enpower `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`
  * Encharge `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`
  * Solar `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`
* Generator `State`, `Mode`.

### Control Switches, Outlets, Lightbulbs
* System `Data Refresh`
* Production `PLC Level`, `Power Mode`, `Power State`, `Power Level`
* AC Battery `Energy State`, `Energy Level`
* Enpower `Grid State`, `Dry Contacts`
* Encharge `Energy State`, `Energy Level`
* Encharge Profile
  * Self Consumption `Activate`, `Set Reserve`
  * Savings `Activate`, `Set Reserve`
  * Economy `Activate`, `Set Reserve`
  * Full Backup `Activate`
* Generator `State`, `Mode`

## Notes
* Token authentication (6.0+) - Tokens can be generated automatically with the Enlighten username (email address) and password or external tools. Tokens generated with Enlighten credentials are automatically refreshed while those generated with external tools are not.
* Envoy `password` is detected automatically or can be added in the configuration if already changed by user.
* Installer `password` is generated automatically (firmware <= v5.x).
* Envoy `device ID` is detected automatically.
* Supports [Power Production State](https://github.com/grzegorz914/homebridge-enphase-envoy/wiki#power-production-control) and `PLC Level` (requires firmware v7.0+ and installer credentials).
* For the best experience and to display all data, please use the `Controller` or `Eve` apps.
* External integrations include: [REST](https://github.com/grzegorz914/homebridge-enphase-envoy?tab=readme-ov-file#restful-integration) and [MQTT](https://github.com/grzegorz914/homebridge-enphase-envoy?tab=readme-ov-file#mqtt-integration).

### Configuration

* Running this plugin as a [Child Bridge](https://github.com/homebridge/homebridge/wiki/Child-Bridges) is **highly recommended**. This prevents Homebridge from crashing if the plugin crashes.
* Installation and use of [Homebridge Config UI X](https://github.com/homebridge/homebridge-config-ui-x) to configure this plugin is **highly recommended**.
* The `sample-config.json` can be edited and used as an alternative for advanced users.

<p align="center">
  <a href="https://github.com/grzegorz914/homebridge-enphase-envoy"><img src="https://raw.githubusercontent.com/grzegorz914/homebridge-enphase-envoy/main/graphics/ustawienia.png" width="840"></a>
</p>

| Key | Subkey | Type | Description |
| --- | --- | --- |
| `name` | | string | Envoy Enphase Gateway accessory name to be displayed in Home app. |
| `host` | | string | The Envoy Enphase Gateway `IP Address` or `Hostname`. If not supplied, defaults to `envoy.local`. For firmware v7.0+, please set the `IP Address`. |
| `envoyFirmware7xx` |  | boolean | Enables support for Envoy firmware v7.0+. |
| `envoyFirmware7xxTokenGenerationMode` | | string | How you will obtain the token (`0 - Enlighten Credentials` or `1 - Your Own Generated Token`). |
| `envoyPasswd` | | string | Envoy Enphase password (only if U already changed the default password) |
| `envoyToken` | | string | Token if you selected `1 - Your Own Generated Token` for envoyFirmware7xxTokenGenerationMode. |
| `envoyTokenInstaller` | | boolean | Enable if you are using the installer token. |
| `envoySerialNumber` | | string | The Envoy Gateway serial number. |
| `enlightenUser` | | string | Enlighten username. |
| `enlightenPasswd` | | string | Enlighten password. |
| `supportPowerProductionState` | | boolean | Enables support for checking [Power Production State](https://github.com/grzegorz914/homebridge-enphase-envoy/wiki#power-production-control) (requires firmware v7.0+ and installer credentials). |
| `powerProductionStateControl` | | key | `Power Production Control` for production state control (requires firmware v7.0+ and installer credentials). |
| | `name` | string | Power production control accessory name for Home app. |

| `displayType` | Power production control accessory type for Home app, `0 - None/Disabled`, `1 - Switch`, `2 - Outlet`, `3 - Lightbulb`. |
| `namePrefix` | Accessory prefix for power production control. |
| `supportPlcLevel` | Enables support for `PLC Level Check` for all devices (requires firmware v7.0+ and installer credentials). |
| `plcLevelControl` | `PLC Level Control` for PLC level check (requires firmware v7.0+ and installer credentials). |
| `name` | PLC level control accessory name for Home app. |
| `displayType` | PLC  level controlaccessory type to be displayed in Home app, `0 - None/Disabled`, `1 - Switch`, `2 - Outlet`, `3 - Lightbulb`. |
| `namePrefix` | Accessory prefix for the PLC level control. |
| `powerProductionSummary` | `Power Summary`, in `W`, of all microinverters. This will be used to calculate the display power level in the Home app `0-100 %`. |
| `powerProductionStateSensor` | `Power State Sensor` for production monitoring. |
| `name` | Production state sensor accessory name for Home app. |
| `displayType` | Production state sensor accessory type displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | Accessory prefix for the the production state sensor. |
| `powerProductionLevelSensors` | `Power Level Sensor` for production monitoring. |
| `name` | Power production level sensor accessory name for Home app. |
| `compareMode` | Power production level comparison mode `<`, `<=`, `==`, `>`, `>=`. |
| `powerLevel` | Power production level in `W` to compare to sensor that was triggered. |
| `displayType` | Power production level sensor accessory type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | Accessory prefix for the power production level sensor. |
| `energyProductionStateSensor` | `Energy State Sensor` for production monitoring. |
| `name` | Energy production state sensor accessory name for Home app. |
| `displayType` | Energy production state sensor accessory type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | Accessory prefix for the energy production state sensor. |
| `energyProductionLevelSensors` | `Energy Level Sensor` for production monitoring. |
| `name` | Energy production level sensor accessory name for Home app. |
| `compareMode` | Energy production level comparison mode `<`, `<=`, `==`, `>`, `>=`. |
| `energyLevel` | Energy production level in `Wh` to compare to sensor that was triggered. |
| `displayType` | Energy production level sensor accessory type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | Accessory prefix for the energy production level sensor. |
| `energyProductionLifetimeOffset` | `Energy Offset` in `Wh` for production (if needed) `+/-`. |
| `powerConsumptionTotalStateSensor` | `Power State Sensor` for total consumption monitoring. |
| `name` | Total power consumption state sensor accessory name for Home app. |
| `displayType` | Total power consumption state sensor accessory type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | Accessory prefix for the total power consumption state sensor. |
| `powerConsumptionTotalLevelSensors` | `Power Level Sensor` for total consumption monitoring. |
| `name` | Total power consumption level sensor accessory name for Home app. |
| `compareMode` | Total power consumption level sensor comparison mode `<`, `<=`, `==`, `>`, `>=`. |
| `powerLevel` | Total power consumption level in `W` to compare to power level sensor that was triggered. |
| `displayType` | Total power consumption level sensor accessory type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | Accessory prefix for the total power consumption level sensor. |

| `energyConsumptionTotalStateSensor` | `Energy State Sensor` for total consumption monitoring. |
| `name` | Total energy consumption state sensor name in Home app. |
| `displayType` | Total energy consumption state sensor accessory type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | Accessory prefix for the total energy consumption state sensor. |

| `energyConsumptionTotalLevelSensors` | `Energy Level Sensor` for total consumption monitoring. |
| `name` | Total energy consumption level sensor name for Home app. |
| `compareMode` | Total energy consumption level sensor comparison mode `<`, `<=`, `==`, `>`, `>=`. |
| `energyLevel` | Energy level total in `Wh` to compare to sensor that was triggered. |
| `displayType` | Total energy consumption level sensor accessory type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | Accessory prefix for the total energy consumption level sensor. |

| `energyConsumptionTotalLifetimeOffset` | `Energy Offset` in `Wh` for total consumption (if needed) `+/-`. |
| `powerConsumptionNetStateSensor` | `Power State Sensor` for net consumption monitoring. |
| `name` | Net power consumption state sensor accessory name for Home app. |
| `displayType` | Net power consumption state sensor accessory type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | Accessory prefix for the net power consumption state sensor name. |

| `powerConsumptionNetLevelSensors` | `Power Level Sensor` for net power consumption level monitoring. |
| `name` | Net power consumption level sensor name for Home app. |
| `compareMode` | Net power consumption level sensor comparison mode `<`, `<=`, `==`, `>`, `>=`. |
| `powerLevel` | Net power consumption power level in `W` to compare for the sensor that was triggered. |
| `displayType` | Net power consumption power level accessory type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | Accessory prefix for the net power consumption power level sensor. |

| `energyConsumptionNetStateSensor` | `Energy State Sensor` for net consumption monitoring. |
| `name` | Net energy comsumption state sensor name for Home app. |
| `displayType` | Net energy comsumption state sensor accessory type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | Accessory prefix for the net energy comsumption state sensor. |

| `energyConsumptionNetLevelSensors` | `Energy Level Sensor` for net consumption monitoring. |
| `name` | Net energy comsumption level sensor name for Home app. |
| `compareMode` | Here select the compare mode `<`, `<=`, `==`, `>`, `>=`. |
| `energyLevel` |  Net energy comsumption level in `Wh` to compare to sensor that was triggered. |
| `displayType` | Here select the sensor type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `energyConsumptionNetLifetimeOffset` | Here set the `Energy Offset` in `Wh` for consumption `Net` (if needed) `+/-`. |

| `enpowerGridStateControl` | `Enpower Grid State Control` for `Grid ON/OFF` control from HomeKit. |
| `name` | Here set Your own tile name. |
| `displayType` | Here select the tile type to be displayed in Home app, `0 - None/Disabled`, `1 - Switch`, `2 - Outlet`, `3 - Lightbulb`. |
| `namePrefix` | This enable the accessory name as a prefix for the tile name. |

| `enepowerGridStateSensor` | `Enpower Grid State Sensor` for monitoring. If `Grid ON`, the contact was opened. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |

| `enepowerGridModeSensors` | `Enpower Grid Mode Sensors` for monitoring, if the `Mode` matches, the contact was opened. |
| `name` | Here set Your own sensor name. |
| `gridMode` | Here select the grid mode `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`. |
| `displayType` | Here select the sensor type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |

| `enchargeStateSensor` | `Encharge State Sensor` for monitoring. If `State ON`, the contact was opened. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |

| `enchargeProfileControl` | `Encharge Profile Control` for `Profile` control from HomeKit. |
| `name` | Here set Your own tile name. |
| `profile` | Here select the profile `Savings`, `Economy`, `Full Backup`, `Self Consumption`. |
| `displayType` | Here select the tile type to be displayed in Home app, `0 - None/Disabled`, `1 - Lightbulb`. |

| `enchargeProfileSensors` | `Encharge Profile Sensors` for monitoring. If the `Profile` matches, the contact was opened. |
| `name` | Here set Your own sensor name. |
| `profile` | Here select the profile `Savings`, `Economy`, `Full Backup`, `Self Consumption`. |
| `displayType` | Here select the sensor type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |

| `enchargeGridModeSensors` | `Encharge Grid Mode Sensors` for monitoring. If the `Mode` matches, the contact was opened. |
| `name` | Here set Your own sensor name. |
| `gridMode` | Here select the grid mode `Multimode Grid On`, `Multimode Grid Off`. |
| `displayType` | Here select the sensor type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |

| `enchargeBackupLevelSensors` | `Encharge Backup Level Sensors` for monitoring. If the `Level` matches, the contact was opened. |
| `name` | Here set Your own sensor name. |
| `compareMode` | Here select the compare mode `<`, `<=`, `==`, `>`, `>=`. |
| `backupLevel` | Here set backup level in `%` to compare at which the sensor fired. |
| `displayType` | Here select the sensor type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |

| `solarGridModeSensors` | `Solar Grid Mode Sensors` for monitoring, if the `Mode` matches, the contact was opened. |
| `name` | Here set Your own sensor name. |
| `gridMode` | Here select the grid mode `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`. |
| `displayType` | Here select the sensor type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |
| `enpowerDryContactsControl` | This enable `Dry Contacts` control and expose `Switches` in HomeKit. |
| `enpowerDryContactsSensors` | This enable `Dry Contacts` monitoring and expose `Sensors` in HomeKit. |

| `generatorStateControl` | `Generator State Control` for `Generator OFF/ON` control from HomeKit. |
| `name` | Here set Your own tile name. |
| `displayType` | Here select the tile type to be displayed in Home app, `0 - None/Disabled`, `1 - Switch`, `2 - Outlet`, `3 - Lightbulb`. |
| `namePrefix` | This enable the accessory name as a prefix for the tile name. |

| `generatorStateSensor` | `Generator State Sensor` for `State` monitoring. If `State not Off`, the contact was opened. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |

| `generatorModeContol` |`Generator Mode Control`, for `Generator OFF/ON/AUTO` control from HomeKit. |
| `name` | Here set Your own tile name. |
| `mode` | Here select the grid mode `Off`, `On`, `Auto`. |
| `displayType` | Here select the sensor type to be displayed in Home app, `0 - None/Disabled`, `1 - Switch`, `2 - Outlet`, `3 - Lightbulb`. |

| `generatorModeSensors` | `Generator Mode Sensors` for monitoring, if the `Mode` matches, the contact was opened. |
| `name` | Here set Your own sensor name. |
| `mode` | Here select the grid mode `Off`, `On`, `Auto`. |
| `displayType` | Here select the sensor type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | This enable the accessory name as a prefix for the sensor name. |

| `dataRefreshControl` | `Data Refresh Control` from HomeKit. |
| `name` | Here set Your own tile name. |
| `displayType` | Here select the tile type to be displayed in Home app, `0 - None/Disabled`, `1 - Switch`, `2 - Outlet`, `3 - Lightbulb`. |
| `namePrefix` | This enable the accessory name as a prefix for the tile name. |

| `dataRefreshSensor` | `Data Refresh Sensor` for monitoring. If operating, the contact was opened. |
| `name` | Here set Your own sensor name. |
| `displayType` | Here select the sensor type to be displayed in Home app, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`. |
| `namePrefix` | Accessory prefix for the sensor name. |



| `metersDataRefreshTime` | `Meters Data` refresh time (seconds). |
| `productionDataRefreshTime` | `Production Data` refresh time (seconds). |
| `liveDataRefreshTime` | `Live Data` refresh time (seconds). |
| `ensembleDataRefreshTime` | `Ensemble Data` refresh time (seconds). |
| `disableLogDeviceInfo` | Disables log device info for every connected device to the network. |
| `disableLogInfo` | Disables to the Homebridge log console. |
| `disableLogSuccess` | Disables logging of device success. |
| `disableLogWarn` | Disables logging of device warnings. |
| `disableLogError` | Disables logging of device errors. |
| `enableDebugMode` | Verbose logging to the Homebridge console. |
| `restFul` | REST service. |
| `enable` | Enables REST service to start automatically and respond to any request. |
| `port` | `Port` for REST service. |
| `debug` | Enables verbose logging to the Homebridge console for REST service. |
| `mqtt` | MQTT broker. |
| `enable` | Enables MQTT broker to start automatically and publish available data. |
| `host` | `IP Address` or `Hostname` for MQTT Broker. |
| `port` | `Port` for MQTT broker (default to 1883). |
| `clientId` | `Client Id` of MQTT broker (optional). |
| `prefix` | `Prefix` for `Topic` (optional). |
| `auth` | Enables MQTT broker authorization credentials. |
| `user` | MQTT broker user. |
| `passwd` | MQTT Broker password. |
| `debug` | Enables verbose logging to the Homebridge console for the MQTT broker. |

### REST Integration

* POST via JSON `{DataSampling: true}` (content-type header must be `application/json`)

| Method | URL | Path | Response | Type |
| --- | --- | --- | --- | --- |
| GET | `http//ip:port` | `token`, `info`, `home`, `inventory`, `meters`, `metersreading`, `ensembleinventory`, `ensemblestatus`, `enchargeettings`, `tariff`, `drycontacts`, `drycontactssettinge`, `generator`, `generatorsettings`, `gridprofile`, `livedata`, `production`, `productionct`, `microinverters`, `powermode`, `plclevel`, `datasampling`. | `{wNow: 2353}` | JSON |

| Method | URL | Key | Value | Type | Description |
| --- | --- | --- | --- | --- | --- |
| POST | `http//ip:port` | `DataSampling` | `true`, `false` | boolean | Data sampling Start/Stop. |
|      | `http//ip:port` | `PowerProductionState` | `true`, `false` | boolean | Power production state On/Off. |
|      | `http//ip:port` | `PlcLevel` | `true` | boolean | Check Plc Level On. |
|      | `http//ip:port` | `EnchargeProfile` | `self-consumption`, `savings`, `economy`, `fullbackup` | string | Set encharge profile. |
|      | `http//ip:port` | `EnpowerGridState` | `true`, `false` | boolean | Grid state On/Off. |
|      | `http//ip:port` | `GeneratorMode` | `off`, `on`, `auto` | string | Generator mode Off/On/Auto. |

### MQTT Integration

* Subscribe using JSON `{EnchargeProfile: "savings"}`

| Method | Topic | Message | Type |
| --- | --- | --- | --- |
| Publish | `Token`, `Info`, `Home`, `Inventory`, `Meters`, `Meters Reading`, `Ensemble Inventory`, `Ensemble Status`, `Encharge Settings`, `Tariff`, `Dry Contacts`, `Dry Contacts Settings`, `Generator`, `Generator Settings`, `Grid Profile`, `Live Data`, `Production`, `Production CT`, `Microinverters`, `Power Mode`, `PCU Comm Level`, `Data Sampling` | `{wNow: 2353}` | JSON |

| Method | Topic | Key | Value | Type | Description |
| --- | --- | --- | --- | --- | --- |
| Subscribe | `Set` | `DataSampling` | `true`, `false` | boolean | Data sampling Start/Stop. |
|           | `Set` | `PowerProductionState` | `true`, `false` | boolean | Power production state On/Off. |
|           | `Set` | `PlcLevel` | `true` | boolean | Check Plc Level On. |
|           | `Set` | `EnchargeProfile` | `self-consumption`, `savings`, `economy`, `fullbackup` | string | Set encharge profile. |
|           | `Set` | `EnpowerGridState` | `true`, `false` | boolean | Grid state On/Off. |
|           | `Set` | `GeneratorMode` | `off`, `on`, `auto` | string | Generator mode Off/On/Auto. |
