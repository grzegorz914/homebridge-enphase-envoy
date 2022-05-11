# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Power Production Enable/Disable v5.2.0 and above!!!
- You can set task for the Envoy to Enable/Disable power production on the microinverters. 
- On a typical system during daylight hours, the Envoy will execute the task within 15 minutes.
- More info about Power Production task here: https://support.enphase.com/s/article/How-do-I-disable-and-enable-power-production

## [5.6.12] - (11.05.2022)
## Changes
- fix [#50](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/50)

## [5.6.9] - (25.04.2022)
## Changes
- update dependencies

## [5.6.8] - (25.04.2022)
## Changes
- refactor send mqtt message

## [5.6.7] - (24.04.2022)
## Changes
- update config.schema.json

## [5.6.6] - (30.03.2022)
## Changes
- prevent poll Meters Reading Data if no Meters are installed
- prevent poll Microinverters Power Data if envoy password is not set

## [5.6.5] - (30.03.2022)
## Changes
- refresh time for Meters Reading Data to 1,5sec and Production CT Data to 3 sec.

## [5.6.4] - (29.03.2022)
## Changes
- fixed read microinverters data (error 401) if envoy uses standard password, fix [#48](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/48)

## [5.6.3] - (29.03.2022)
## Added
- debug mode for MQTT Client
- 
## Changes
- update check state data
- update debug logging
- removed refresh interval
- update config schema
- removed Entrez Authorization functionality for Envoy with firmware 7.x.x at this time

## [5.6.1] - (20.02.2022)
## Added
- wrire envoy device id to file

## [5.6.0] - (19.02.2022)
## Added
- Entrez Authorization for Envoy with firmware 7.x.x (test phase)

## [5.5.0] - (17.02.2022)
## Added
- MQTT Client, publish all PV installation data
- Debug mode
- Prepare for entrez authorization

## Changes
- update dependencies
- code refactor

## [5.4.34] - (18.01.2022)
## Changes
- update dependencies

## [5.4.33] - (17.01.2022)
## Changes
- update dependencies

## [5.4.32] - (29.12.2021)
- prepare directory and files synchronously

## [5.4.30] - (28.12.2021)
- update node minimum requirements

## [5.4.29] - (20.11.2021)
## Changes
- cosmetics

## [5.4.21] - (25.09.2021)
## Changes
- code cleanup

## [5.4.19] - (24.09.2021)
## Changes
### WARNING - after this update nedd to remove and add accessory to the HomeKit again
- code cleanup
- stability improvements

## [5.4.18] - (24.09.2021)
## Changes
- code cleanup
- fix wrong voltage display, 1-phase instalation

## [5.4.17] - (19.09.2021)
## Changes
- code cleanup

## [5.4.15] - (09.09.2021)
## Changes
- bump dependencies
- stability improvements
- performance improvements

## [5.4.14] - (05.09.2021)
## Changes
- bump dependencies

## [5.4.13] - (04.09.2021)
## Changes
- bump dependencies

## [5.4.1] - (22.08.2021)
## Changes
- removed *envoyDevId* property, now is detect automatically

## [5.4.0] - (21.08.2021)
## Changes
- removed urllib 
- added digestAuth method to Axios
- code rebuild and cleanup
- some fixes and improvements

## [5.3.1] - (21.08.2021)
## Changes
- charcterristics data format fixes
- added grid profile characteristic for ensemble
- code rebuild and cleanup

## [5.3.0] - (17.08.2021)
## Changes
- added wireless connection kit characteristics
- code rebuild and cleanup

## [5.2.15] - (16.08.2021)
## Changes
- finally fixed not reconized ensemble (enpower and encharges) devices in previous versions

## [5.2.0] - (15.08.2021)
## Changes
- added possibility Enable/Disable Power Production (in envoy section)


## [5.1.0] - (13.08.2021)
## Changes
- added system Power Production state(in envoy section)
- added enpower status service
- fixed not reconized ensemble (enpower and encharges) devices in previous versions
- updated SKU and Part Nr.
- code rebuild and cleanup
- other fixes and improvements

## [5.0.0] - (05.08.2021)
## Changes
- removed deprecated inherits and moved all characterictics to use ES6 class

## [4.9.0] - (03.08.2021)
## Changes
- added support for Ensemble (Enpowers and Encharges)
- fixed wrong named Encharges to AC Batteries
- other fixes and performance improvements

## [4.8.0] - (12.03.2021)
## Changes
- added possibility to check communications level of all devces on user request
- fixed many small bugs
- code cleanup

## [4.7.0] - (04.03.2021)
## Changes
-  update config.chema
- fixed many small bugs
- correct identyfi all hardware
- code cleanup

## [4.6.0] - (24.02.2021)
## Changes
- added Characteristics for Apparent and Reactive Power
- fixed some bugs

## Important note v4.5.0 and above!!!
Version 4.5.0 and above need to be used with Homebridge min. v1.3.0.

## [4.5.0] - (23.02.2021)
## Changes
- code rebuild, use Characteristic.onSet/onGet
- require Homebridge 1.3.x or above

## [4.4.0] - (10.02.2021)
## Changs
- restored possibility to set own user and password for envoy
- added characteristic for communication level Q-Relays, Encharges, Microinverters
- added characteristic for all data from Encharges
- other improvements and fixes

## [4.3.0] - (07.02.2021)
## Changs
- added more characteristics for encharges
- added characteristics for Current, Voltage and Power Factor
- fixed reported bugs

## [4.2.0] - (03.02.2021)
## Changs
- added evnoy characteristics
- fixes and corrections

## [4.1.0] - (02.02.2021)
## Changs
- removed envoyUser, envoyPasswd, Firmware and SerialNumber, now detect the data automatically
- data refresh improvements
- reconfigured config schema
- other fixes and corrections

## Important note v4.0.0 and above!!!
Version 4.0.0 whole new concept.
## [4.0.0] - (30.01.2021)
## Changs
- refactoring whole code
- added Characteristics for Q-Relay, Meters, Microinverters, Encharges
- added whole base of status code all displayes in EVE or Controller app
- added and present state and power of all devices (Envoy, Q-Relay, Meters, Microinverters, Encharges)
- code cleanup and many more

## [3.6.0] - (29.01.2021)
## Changs
- read Laast and Max Power of indyvidual inverters
- code rebuild

## [3.5.15] - (29.01.2021)
## Changs
- list all devices in log with its status

## Important note v3.5.0 and above!!!
Version 3.5.0 detect automatically all installed devices, please check Your config after update to this version.
## [3.5.0] - (29.01.2021)
## Changs
- full automatic check installed devices, Envoy, Inverters, Q-Relay, Meters, Encharges
- rebuild config

## [3.4.3] - (29.01.2021)
## Changs
- added check for installed Q-Relay 
- added check for installed Encharge 
- added check for installed Meters
- reconfigured config menu
- code rebuild

## [3.3.15] - (26.01.2021)
## Changs
- power Net and Total Max fixes

## [3.3.9] - (01.01.2021)
## Changs
- bump dependiencies

## [3.3.5] - (22.10.2020)
## Changs
- added encharge storage energy offset
- added possibility to select consumtion meter CT - Load only/Load with Solar production
- update config.schema

## [3.2.0] - (08.09.2020)
## Changs
- added async/await function to read deviceInfo and updateStatus

## [3.1.0] - (06.09.2020)
## Changs
- completly reconfigured config schema

## [3.0.15] - (05.09.2020)
## Changs
- changed Characteristic.StatusActive to custom Characteristic.PowerMaxDetected 

## [3.0.8] - (05.09.2020)
## Fix
- fix wrong display power detection state

## [3.0.7] - (04.09.2020)
## Added
- added Characteristic.StatusActive to identify Max Power Detection

## [3.0.4] - (04.09.2020)
## Fix
- fix no display Last Seven Days energy

## [3.0.3] - (04.09.2020)
## Changes
- code cleanup

## Important note
Ab verion v3.0.0 accesory moved to Power Meter custom Characteristic, due to Apple HomeKit limitations right now only in EVE app displayed correctly, in HomeKit displayed as 'Unsupported'. If U want to use old CO2 sensor style just still with 2.x.x version
## [3.0.0] - (02.09.2020)
### New
- accesory moved to Power Meter, due to Apple HomeKit limitations right now only in EVE app displayed, in HomeKit displayed as 'Unsupported'.
- added possibility to set lifetime energy offset for production, and consumption.
- added support for encharge storage.

## [2.3.0] - (28.08.2020)
### Added
- added energy production and consumption tile (Today, Last 7D, Lifetime).

## [2.2.0] - (27.08.2020)
### Added
- added possibility to display minus values, exported power to grid.

## [2.1.3] - (27.08.2020)
### Added
- added extra accessory to present Total or Total and Net Consumption. Selectable in consumption power meter option.

## [2.0.6] - (27.08.2020)
### Added
- added extra accessory to present Total Power Consumption if consumption Power meter is selected

## [1.1.2] - (25.08.2020)
### Changes
- performance improvements
- other small fixes

## [1.1.0] - (09.08.2020)
### Added
- performance improvements

## [1.0.3] - (02.07.2020)
### Fixed
- fixed #2 crash if no production meters are installed

## [1.0.1] - (29.06.2020)
### Fixed
- fixed display energy and power values

## [1.0.0] - (28.06.2020)
### Added
- added possibility select consumption power meter

## [0.4.6] - (27.06.2020)
### Fixed
- fixed  display energy symbol in the log

## [0.4.5] - (27.06.2020)
### Added
- added in the log possibility read all power and energy value

## [0.3.5] - (17.06.2020)
### Fixed
- corrections in config.schema.json

## [0.3.0] - (15.06.2020)
### Added
- added possibility to select production meter

## [0.2.0] - (010.06.2020)
### Added
- stored max. Power Production too the file
- config.host now use 'envoy.local' path or Your configured iP adress

## [0.1.1] - (08.06.2020)
### Fixed
- many fixes and more info in log

## [0.0.30] - (05.06.2020)
- working release

## [0.0.1] - (05.06.2020)
- initial release