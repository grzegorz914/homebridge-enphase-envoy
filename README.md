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
* Q-Relay `State`
* Enpower `Grid State`
* Encharge: `State`, `Grid State`, `Backup Level`, `Dry Contacts`
* Solar `Grid State`
* Encharge Profile: `Self Consumption`, `Savings`, `Economy`, `Full Backup`
* Grid Mode
  * Enpower `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`
  * Encharge `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`
  * Solar `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming`
* Generator `State`, `Mode`

### Control Switches, Outlets, Lightbulbs

* System `Data Refresh`
* Production `PLC Level`, `Power Mode`, `Power State`, `Power Level`
* AC Battery `Energy State`, `Backup Level Summary`, `Backup Level`
* Enpower `Grid State`, `Dry Contacts`
* Encharge `Energy State Summary`, `Backup Level Summary`, `Energy State`,  `Backup Level`
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
| --- | --- | --- | --- |
| `name` | | string | Envoy Enphase Gateway accessory name to be displayed in Home app |
| `host` | | string | The Envoy Enphase Gateway `IP Address` or `Hostname`. If not supplied, defaults to `envoy.local`. For firmware v7.0+, please set the `IP Address`. |
| `displayType` | | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Light Bulb, `2` - Fan, `3` - Humidity Sensor, `4` - Carbon Monoxide Sensor |
| `envoyFirmware7xxTokenGenerationMode` | | number | How you will obtain the token: `0` - Envoy Password (firmware < v7.0), `1` - Enlighten Credentials, `2` - Your Own Generated Token |
| `envoyPasswd` | | string | Envoy Enphase password (only if U already changed the default password) |
| `envoyToken` | | string | Token if you selected `2 - Your Own Generated Token` for envoyFirmware7xxTokenGenerationMode |
| `envoyTokenInstaller` | | boolean | Enable if you are using the installer token ||
| `enlightenUser` | | string | Enlighten username |
| `enlightenPasswd` | | string | Enlighten password |
| `supportPlcLevel` | | boolean | Enables support for `PLC Level Check` for all devices (firmware v7.0+ require installer credentials) |
| `plcLevelControl` | | key | `PLC Level Control` for PLC level check (firmware v7.0+ require installer credentials) |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Accessory type for Home app: `0` - None/Disabled, `1` - Switch, `2` - Outlet, `3` - Lightbulb |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `supportPowerProductionState` | | boolean | Enables support for checking `Power Production` (firmware v7.0+ require installer credentials) |
| `powerProductionStateControl` | | key | `Power Production Control` for [Power Production](https://github.com/grzegorz914/homebridge-enphase-envoy/wiki#power-production-control)  (firmware v7.0+ require installer credentials). |
| | `name` | string | Accessory name for Home app. |
| | `displayType` | number | Accessory type for Home app: `0` - None/Disabled, `1` - Switch, `2` - Outlet, `3` - Lightbulb |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `powerProductionSummary` | | number | `Power Summary`, in `W`, of all microinverters. This will be used to calculate the display power level in the Home app `0-100 %` |
| `powerProductionStateSensor` | | key | `Power State Sensor` for production monitoring |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Accessory type displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `powerProductionLevelSensors` | | key | `Power Level Sensor` for production monitoring |
| | `name` | string | Accessory name for Home app |
| | `compareMode` | string | Comparison mode: `<`, `<=`, `==`, `>`, `>=` |
| | `powerLevel` | number | Power production level in `W` to compare to sensor that was triggered |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `energyProductionStateSensor` | | key | `Energy State Sensor` for production monitoring |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `energyProductionLevelSensors` | | key | `Energy Level Sensor` for production monitoring |
| | `name` | string | Accessory name for Home app |
| | `compareMode` | string | Comparison mode: `<`, `<=`, `==`, `>`, `>=` |
| | `energyLevel` | number | Energy production level in `Wh` to compare to sensor that was triggered |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `energyProductionLifetimeOffset` | | number | `Energy Offset` in `Wh` for production (if needed) `+/-` |
| `powerConsumptionTotalStateSensor` | | key | `Power State Sensor` for total consumption monitoring |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `powerConsumptionTotalLevelSensors` | | key | `Power Level Sensor` for total consumption monitoring |
| | `name` | string | Accessory name for Home app |
| | `compareMode` | string | Comparison mode `<`, `<=`, `==`, `>`, `>=` |
| | `powerLevel` | number | Total power consumption level in `W` to compare to power level sensor that was triggered |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `energyConsumptionTotalStateSensor` | | key | `Energy State Sensor` for total consumption monitoring |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `energyConsumptionTotalLevelSensors` | | key | `Energy Level Sensor` for total consumption monitoring |
| | `name` | string | Accessory name for Home app |
| | `compareMode` | string | Comparison mode `<`, `<=`, `==`, `>`, `>=` |
| | `energyLevel` | number | Energy level total in `Wh` to compare to sensor that was triggered |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `energyConsumptionTotalLifetimeOffset` | | number | `Energy Offset` in `Wh` for total consumption (if needed) `+/-` |
| `powerConsumptionNetStateSensor` | | key | `Power State Sensor` for net consumption monitoring |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `powerConsumptionNetLevelSensors` | | key | `Power Level Sensor` for net power consumption level monitoring |
| | `name` | string | Accessory name for Home app |
| | `compareMode` | string | Comparison mode `<`, `<=`, `==`, `>`, `>=` |
| | `powerLevel` | number | Net power consumption power level in `W` to compare for the sensor that was triggered |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `energyConsumptionNetStateSensor` | | key | `Energy State Sensor` for net consumption monitoring |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `energyConsumptionNetLevelSensors` | | key | `Energy Level Sensor` for net consumption monitoring |
| | `name` | string | Accessory name for Home app |
| | `compareMode` | string | Comparison mode `<`, `<=`, `==`, `>`, `>=` |
| | `energyLevel` | number | Net energy comsumption level in `Wh` to compare to sensor that was triggered |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `energyConsumptionNetLifetimeOffset` | | number | `Energy Offset` in `Wh` for consumption `Net` (if needed) `+/-` |
| `qRelayStateSensor` | | key | `Q-Relay State Sensor` for monitoring. If `State ON`, the contact was opened. |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `acBatterieName` | | string | AC Bettery Accessory name for Home app, if not set will use default name |
| `acBatterieBackupLevelSummaryAccessory` | | key | `AC Batteries Backup Level Summary Accessory` in Home app, if present |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Light Bulb, `2` - Fan, `3` - Humidity Sensor, `4` - Carbon Monoxide Sensor, `5` - Battery |
| | `minSoc` | boolean | Minimum SoC level in (%) for ac batteries backup level summary |
| `acBatterieBackupLevelAccessory` | | key | `AC Battery Backup Level Accessory` in Home app, if present |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Light Bulb, `2` - Fan, `3` - Humidity Sensor, `4` - Carbon Monoxide Sensor, `5` - Battery |
| | `minSoc` | boolean | Minimum SoC level in (%) for ac battery backup level |
| `enpowerGridStateControl` | | key | `Enpower Grid State Control` for `Grid ON/OFF` control from HomeKit |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Switch, `2` - Outlet, `3` - Lightbulb |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `enepowerGridStateSensor` | | key | `Enpower Grid State Sensor` for monitoring. If `Grid ON`, the contact was opened. |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `enpowerGridModeSensors` | | key | `Enpower Grid Mode Sensors` for monitoring. If the `Mode` matches, the contact was opened. |
| | `name` | string | Accessory name for Home app |
| | `gridMode` | string | Grid mode: `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming` |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `enchargeName` | | string | Encharge Accessory name for Home app, if not set will use default name |
| `enchargeBackupLevelSummaryAccessory` | | key | `Encharge Backup Level Summary Accessory` in Home app, if present |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Light Bulb, `2` - Fan, `3` - Humidity Sensor, `4` - Carbon Monoxide Sensor, `5` - Battery |
| | `minSoc` | boolean | Minimum SoC level in (%) for encharges backup level summary |
| `enchargeBackupLevelAccessory` | | key | `Encharge Backup Level Accessory` in Home app, if present |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, , `1` - Battery |
| | `minSoc` | boolean | Minimum SoC level in (%) for encharges backup level summary |
| `enchargeStateSensor` | | key | `Encharge State Sensor` for monitoring. If `State ON`, the contact was opened. |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `enchargeProfileControls` | | key | `Encharge Profile Controls` for `Profile` control from HomeKit |
| | `name` | string | Accessory name for Home app |
| | `profile` | string | Profile: `Savings`, `Economy`, `Full Backup`, `Self Consumption` |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Lightbulb |
| `enchargeProfileSensors` | | key | `Encharge Profile Sensors` for monitoring. If the `Profile` matches, the contact was opened. |
| | `name` | string | Accessory name for Home app |
| | `profile` | string | Profile: `Savings`, `Economy`, `Full Backup`, `Self Consumption` |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `enechargeGridStateSensor` | | key | `Encharge Grid State Sensor` for monitoring. If `Grid ON`, the contact was opened. |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `enchargeGridModeSensors` | | key | `Encharge Grid Mode Sensors` for monitoring. If the `Mode` matches, the contact was opened. |
| | `name` | string | Accessory name for Home app |
| | `gridMode` | string | Grid mode: `Multimode Grid On`, `Multimode Grid Off` |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `enchargeBackupLevelSensors` | | key | `Encharge Backup Level Sensors` for monitoring. If the `Level` matches, the contact was opened. |
| | `name` | string | Accessory name for Home app |
| | `compareMode` | string | Comparison mode: `<`, `<=`, `==`, `>`, `>=` |
| | `backupLevel` | number | Backup level in `%` to compare to sensor that was triggered |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `solarGridStateSensor` | | key | `Solar Grid State Sensor` for monitoring. If `Grid ON`, the contact was opened. |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `solarGridModeSensors` | | key | `Solar Grid Mode Sensors` for monitoring. If the `Mode` matches, the contact was opened. |
| | `name` | string | Accessory name for Home app |
| | `gridMode` | string | Grid mode: `Grid On`, `Grid Off`, `Multimode Grid On`, `Multimode Grid Off`, `Grid Tied`, `Grid Forming` |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `enpowerDryContactsControl` | | boolean | Enables `Dry Contacts` control and exposes `Switches` in Home app |
| `enpowerDryContactsSensor` | | boolean | Enables `Dry Contacts` monitoring and exposes `Sensors` in Home app |
| `generatorStateControl` | | key | `Generator State Control` for `Generator OFF/ON` control in Home app |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Switch, `2` - Outlet, `3` - Lightbulb |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `generatorStateSensor` | | key | `Generator State Sensor` for `State` monitoring. If `State not Off`, the contact was opened. |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `generatorModeContol` | | key | `Generator Mode Control`, for `Generator OFF/ON/AUTO` control in Home app |
| | `name` | string | Accessory name for Home app |
| | `mode` | string | Grid mode: `Off`, `On`, `Auto` |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Switch, `2` - Outlet, `3` - Lightbulb |
| `generatorModeSensors` | | key | `Generator Mode Sensors` for monitoring, if the `Mode` matches, the contact was opened. |
| | `name` | string | Accessory name for Home app |
| | `mode` | string | Grid mode: `Off`, `On`, `Auto` |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `acBatterieBackupLevelAccessory` | | key | `AC Battery Backup Level Accessory` in Home app, if present |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, , `1` - Battery |
| | `minSoc` | boolean | Minimum SoC level in (%) for ac battery backup level summary |
| `dataRefreshControl` | | key | `Data Refresh Control` from HomeKit. |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Here select the tile type to be displayed in Home app: `0` - None/Disabled, `1` - Switch, `2` - Outlet, `3` - Lightbulb |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `dataRefreshSensor` | | key | `Data Refresh Sensor` for monitoring. If operating, the contact was opened. |
| | `name` | string | Accessory name for Home app |
| | `displayType` | number | Accessory type to be displayed in Home app: `0` - None/Disabled, `1` - Motion Sensor, `2` - Occupancy Sensor, `3` - Contact Sensor |
| | `namePrefix` | boolean | Use accessory name for prefix |
| `metersDataRefreshTime` | | number | `Meters Data` refresh time (seconds) |
| `productionDataRefreshTime` | | number | `Production Data` refresh time (seconds) |
| `liveDataRefreshTime` | | number | `Live Data` refresh time (seconds) |
| `ensembleDataRefreshTime` | | number | `Ensemble Data` refresh time (seconds) |
| `disableLogDeviceInfo` | | boolean | Disables log device info for every connected device to the network |
| `disableLogInfo` | | boolean | Disables to the Homebridge log console |
| `disableLogSuccess` | | boolean | Disables logging of device success |
| `disableLogWarn` | | boolean | Disables logging of device warnings |
| `disableLogError` | | boolean | Disables logging of device errors |
| `enableDebugMode` | | boolean | Verbose logging to the Homebridge console |
| `restFul` | | key | REST service |
| | `enable` | boolean | Enables REST service to start automatically and respond to any request |
| | `port` | number | `Port` for REST service |
| | `debug` | boolean | Enables verbose logging to the Homebridge console for REST service |
| `mqtt` | | key | MQTT broker |
| | `enable` | boolean | Enables MQTT broker to start automatically and publish available data |
| | `host` | string | `IP Address` or `Hostname` for MQTT Broker |
| | `port` | number | `Port` for MQTT broker (default to 1883) |
| | `clientId` | string | `Client Id` of MQTT broker (optional) |
| | `prefix` | string | `Prefix` for `Topic` (optional) |
| | `auth` | boolean | Enables MQTT broker authorization credentials |
| | `user` | string | MQTT broker user |
| | `passwd` | string | MQTT Broker password |
| | `debug` | boolean | Enables verbose logging to the Homebridge console for the MQTT broker |

### REST Integration

REST POST calls must include a content-type header of `application/json`.

| Method | URL | Path | Response | Type |
| --- | --- | --- | --- | --- |
| GET | `http//ip:port` | `token`, `info`, `home`, `inventory`, `meters`, `metersreading`, `ensembleinventory`, `ensemblestatus`, `enchargeettings`, `tariff`, `drycontacts`, `drycontactssettinge`, `generator`, `generatorsettings`, `gridprofile`, `livedata`, `production`, `productionct`, `productionall`, `microinverters`, `powermode`, `plclevel`, `datasampling`. | `{wNow: 2353}` | JSON |

| Method | URL | Key | Value | Type | Description |
| --- | --- | --- | --- | --- | --- |
| POST | `http//ip:port` | `DataSampling` | `true`, `false` | boolean | Data sampling Start/Stop |
|      | `http//ip:port` | `PowerProductionState` | `true`, `false` | boolean | Power production state On/Off |
|      | `http//ip:port` | `PlcLevel` | `true` | boolean | Check Plc Level On |
|      | `http//ip:port` | `EnchargeProfile` | `self-consumption`, `savings`, `economy`, `fullbackup` | string | Set encharge profile |
|      | `http//ip:port` | `EnpowerGridState` | `true`, `false` | boolean | Grid state On/Off |
|      | `http//ip:port` | `GeneratorMode` | `off`, `on`, `auto` | string | Generator mode Off/On/Auto |

### MQTT Integration

Subscribe using JSON `{ "EnchargeProfile": "savings" }`

| Method | Topic | Message | Type |
| --- | --- | --- | --- |
| Publish | `Token`, `Info`, `Home`, `Inventory`, `Meters`, `Meters Reading`, `Ensemble Inventory`, `Ensemble Status`, `Encharge Settings`, `Tariff`, `Dry Contacts`, `Dry Contacts Settings`, `Generator`, `Generator Settings`, `Grid Profile`, `Live Data`, `Production`, `Production CT`, `Production All`, `Microinverters`, `Power Mode`, `PCU Comm Level`, `Data Sampling` | `{wNow: 2353}` | JSON |

| Method | Topic | Key | Value | Type | Description |
| --- | --- | --- | --- | --- | --- |
| Subscribe | `Set` | `DataSampling` | `true`, `false` | boolean | Data sampling Start/Stop |
|           | `Set` | `PowerProductionState` | `true`, `false` | boolean | Power production state On/Off |
|           | `Set` | `PlcLevel` | `true` | boolean | Check Plc Level On |
|           | `Set` | `EnchargeProfile` | `self-consumption`, `savings`, `economy`, `fullbackup` | string | Set encharge profile |
|           | `Set` | `EnpowerGridState` | `true`, `false` | boolean | Grid state On/Off |
|           | `Set` | `GeneratorMode` | `off`, `on`, `auto` | string | Generator mode Off/On/Auto |
