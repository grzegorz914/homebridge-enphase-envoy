# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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