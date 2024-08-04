# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [9.0.0] - (xx.08.2024)

## Changes

### v9.0.0 require Homebridge v2.0.0

- added support for Homebridge v2.0.0
- dependencies updated
- cleanup

## [8.1.1] - (04.08.2024)

## Changes

- fix display and publish ensemble status and sensors

## [8.1.0] - (04.08.2024)

## Changes

- added new ensemble/encharge/solar sensor profile, grid-tied and grid-forming
- config schema updated
- redme updated
- cleanup

## [8.0.2] - (04.08.2024)

## Changes

- fix [#142](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/142).
- fix characteristic name for encharge profile
- add missing optional characteristic for enphaseWirelessConnectionKitService
- redme updated
- cleanup

## [8.0.0] - (07.07.2024)

## Changes

### After update to v8.0.0 and above from plevious version all sennsors need to be activated in plugin config again

- added possibility to set indyvidual characteristic type for sensors, `0 - None/Disabled`, `1 - Motion Sensor`, `2 - Occupancy Sensor`, `3 - Contact Sensor`.
- config schema updated
- redme updated
- cleanup

## [7.16.0] - (23.06.2024)

## Changes

- added possibility to use Your own generated Token [#140](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/140)
- config schema updated
- redme updated
- cleanup

## [7.15.4] - (18.06.2024)

## Changes

- bump node modules ws [#139](https://github.com/grzegorz914/homebridge-enphase-envoy/pull/139)

## [7.15.3] - (18.06.2024)

## Changes

- polling code refactor, added impulse generator
- remove production properties from Q-Relay accessory
- cleanup

## [7.15.2] - (09.06.2024)

## Changes

- remove possibility to enable/disable support for live data and ensemble status, now is check automatically
- moved refresh ensemble status refres time to envoy section
- config schema updated
- cleanup

## [7.15.1] - (08.06.2024)

## Changes

- added compare mode to the encharge backup level sensors
- config schema updated

## [7.15.0] - (08.06.2024)

## Changes

- added encharge backup level sensors
- readme updated
- config schema updated
- cleanup

## [7.14.9] - (08.06.2024)

## Changes

- refactor check JWT token
- refactor check arf profile
- correct some logs
- cleanup

## [7.14.8] - (01.06.2024)

## Changes

- fix 401 error after envoy reboot and refresh cocies
- fix characteristics warning for arf profile
- increase time for check token expired
= bump dependencies
- cleanup

## [7.14.5] - (12.05.2024)

## Changes

- refactor token check and request
- added infot about token time expired
- cleanup

## [7.14.4] - (06.05.2024)

## Changes

- stop data polling if token expired, start after refreshed
- fixed power peak handle
- refactor code in passwords calculation and check jwt token

## [7.14.0] - (27.04.2024)

## Changes

- added support to check and control Production Power Mode, firmware 7.x.x required installer credentials data
- added support to check PLC Level, firmware 7.x.x required installer credentials data
- added support to check and control Production Power Mode over MQTT protocol, firmware 7.x.x required installer credentials data
- added support to check PLC Level over MQTT protocol, firmware 7.x.x required installer credentials data
- config.schema updated
- cleanup

## [7.13.0] - (27.04.2024)

## Changes

### After update to v7.13.0 and above from plevious version the refresh time need to be configured again

- changed data refresh time from (ms) go (sec) and precision 0.5
- prevent to set refresh time to 0, now minimum is 0.5 sec
- config.schema updated
- cleanup

## [7.11.14] - (26.02.2024)

## Changes

- fix [#127](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/127)
- fix [#126](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/126)
- fix [#125](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/125)
- cleanup

## [7.11.0] - (11.02.2024)

## Changes

### After update to v7.11.0 and above from plevious version the grid mode sensors need to be configured again

- added support to create multiple enpower/encharge/solar grid mode sensors and select grid mode to match
- config.schema updated
- cleanup

## [7.10.0] - (10.02.2024)

## Changes

- added support for Envoy Firmware 8.x.x
- added support for storage CT meters
- fixed [#114](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/114)
- config.schema updated
- cleanup

## [7.9.0] - (01.01.2024)

## Changes

- added [#118](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/118)
- added state and level lightbulb for ac bateries and encharges
- config.schema updated
- cleanup

## [7.8.0] - (23.12.2023)

## Changes

### After update to v7.8.0 and above from plevious version the sensors need to be configured again

- added [#117](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/117)
- added possibility to set custom name for sensors
- added possibility to activate/deactivate sensors
- added possibility to create multiple sensors for power and energy level
- config.schema updated
- cleanup

## [7.7.5] - (05.12.2023)

## Changes

- fix missing aasync/wait for microinverters data update
- refactor code in section data update
- fix characteristic warning [#115](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/115)
- better handle to fix [#112](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/112)
- config.schema updated
- cleanup

## [7.7.4] - (02.12.2023)

## Changes

- fix [#112](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/112)
- cleanup

## [7.7.3] - (29.11.2023)

## Changes

- fix [#112](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/112)
- cleanup

## [7.7.2] - (26.11.2023)

## Changes

- added debug log for services prepare
- prepare for generators support
- cleanup

## [7.7.1] - (26.11.2023)

## Changes

- dynamically add *Live Data* characteristics based on installed devices
- cleanup

## [7.7.0] - (26.11.2023)

## Changes

- added *Live Data PV* cheracteristics to the HomeKit
- added *Live Data Storage* cheracteristics to the HomeKit
- added *Live Data Grid* cheracteristics to the HomeKit
- added *Live Data Load* cheracteristics to the HomeKit
- added *Live Data Generator* cheracteristics to the HomeKit
- fix [#85](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/85)
- config schema updated
- cleanup

## [7.5.0] - (20.10.2023)

## Changes

### After update to v7.5.0 and above from plevious version the sensors need to be configured again

- added *Power State* contact sensor (Consumption Total) for automations and notifications in HomeKit
- added *Energy State* contact sensor (Consumption Total) for automations and notifications in HomeKit
- added *Energy Level* contact sensor (Consumption Total) for automations and notifications in HomeKit
- added *Power State* contact sensor (Consumption Net) for automations and notifications in HomeKit
- added *Energy State* contact sensor (Consumption Net) for automations and notifications in HomeKit
- added *Energy Level* contact sensor (Consumption Net) for automations and notifications in HomeKit
- added *Enpower Grid State* contact sensor for automations and notifications in HomeKit
- added *Encharge Grid State* contact sensor for automations and notifications in HomeKit
- added *Solar Grid State* contact sensor for automations and notifications in HomeKit
- bump node to min 18.x.x and homebridge to 1.6
- config schema updated
- redme update
- cleanup

## [7.4.0] - (25.07.2023)

## Changes

- added *Energy State* contact sensor for production monitoring, which can be used for notification and automations in HomeKit.
- added *Energy Level* contact sensor for production monitoring, which can be used for notification and automations in HomeKit.
- config schema updated
- cleanup

## [7.3.0] - (20.07.2023)

## Changes

- added *Power Production On/Off* contact sensor for production monitoring, which can be used for notification and automations in HomeKit.
- Use encodeURIComponent in EnvoyToken URLs - thanks @chrisjshull
- config schema updated
- cleanup

## [7.2.0] - (17.07.2023)

## Changes

- added power production level (0-100%) displayed as brightness level in Home app based on all microinvertzers power configured in plugin config
- config schema updated

## [7.1.0] - (16.07.2023)

## Changes

- added accessory switch to display in Home app curren state of power production, if Production Power > 0 then switch is ON
- config schema updated

## [7.0.0] - (14.07.2023)

## After Update to this version need to make corespondent changes in plugin config

## Changes

- added support to get JWT Token automatically from enlighten server using user credentials data
- added support to check expired JWT Token and get new if expired
- added debug for RESTFul server
- added `token` to the RESTFul server request
- added `Token` to the MQTT publisher
- config schema updated
- cleanup

### Removed properties

- `envoyFirmware7xxToken`

### Added properties

- `enlightenUser`
- `enlightenPasswd`
- `envoySerialNumber`

## [6.7.0] - (27.02.2023)

## Changes

- added powerful RESTFul server to use with own automations
- cleanup
- config.schema updated

## [6.6.0] - (26.02.2023)

## Changes

- added for ensemble summary Rest Power
- added for ensemble summary AGG Max Energy
- added for ensemble summary Encharges AGG SoC
- added for ensemble summary Encharges AGG Rated Power
- added for ensemble summary bias frequency, voltage for phasa L2/B and L3/C
- prevent HB crash if for some reason prepare accessory fail
- properties updated/added
- bump dependencies
- cleanup

## [6.5.0] - (17.01.2023)

## Changes

- added possibility to set refresh time for live dta, meters data and production ct

## [6.4.1] - (16.01.2023)

## Changes

- fix wirreles konnections kit crash

## [6.4.0] - (15.01.2023)

## Changes

- code cleanup
- config schema updated
- stability improvements
- reduce memory and cpu ussage
- added *Power Peak* contact sensors for production, consumption total/net which can be used for notification and automations in HomeKit.
- fix display wirelesskit characteristics hovewer is not instlled
- fix [#73](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/73)

## [6.3.2] - (14.01.2023)

## Changes

- fix [#71](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/71)
- fix [#72](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/72)
- fix read grid profile name
- added new properties to ensemble status data
- added profile data to mqtt

## [6.3.1] - (12.01.2023)

## Changes

- code cleanup
- stability and performance improvement

## [6.3.0] - (10.01.2023)

## Changes

- added possibility enable/disable support to check *Laive Data*
- Envoy cpu load reduction
- code cleanup
- performance improvement

## [6.2.0] - (10.01.2023)

## Changes

- added possibility enable/disable support to check *Ensemble Status*
- code cleanup/refactor
- config schema updated

## [6.1.0] - (09.01.2023)

## Changes

- fix [#70](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/70)
- added possibility enable/disable support to check *PLC Level*
- added possibility enable/disable support to check/control production *Power Mode*
- code cleanup

## [6.0.9] - (09.01.2023)

## Changes

- fix [#69](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/69)
- added missing promise
- code cleanup
- some log corrections

## [6.0.8] - (05.01.2023)

## Changes

- code cleanup
- log units and text corrections
- added auto check plc communication level on startup
- added encharges plc level characteristic

## [6.0.7] - (30.12.2022)

## Changes

- fixed wireless connection kit set to true

## [6.0.6] - (30.12.2022)

## Changes

- fixed wireless connection kit characteristics

## [6.0.5] - (29.12.2022)

## Changes

- fixed ensembles, encharges and enpowers read data [#66](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/66)
- publish live data to MQTT if Envoy firmware >= 7.x.x
- bump dependencies

## [6.0.4] - (14.12.2022)

## Changes

- code optimize

## [6.0.3] - (14.12.2022)

## Changes

- fix axios instance with token

## [6.0.2] - (14.12.2022)

## Changes

- digestAuth code refactor
- code cleanup

## [6.0.1] - (13.12.2022)

## Changes

- fixed JWT authorization proces and store cookies for data request
- code optimization
- big thanks @NoSnow3 and @BenouGui for test

## [6.0.0] - (11.12.2022)

## Changes

- added support for Envoy with firmware 7.x.x and Token Authorization
- config schema updated
- big thanks @NoSnow3 for test

## [5.9.7] - (06.12.2022)

## Changes

- bump dependencies

## [5.9.6] - (15.09.2022)

## Changes

- fix refresh inventory data
- bump dependencies

## [5.9.4] - (10.09.2022)

## Changes

- cleanup
- fix mqtt
- bump dependencies

## [5.9.3] - (29.08.2022)

## Changes

- cleanup
- update mqtt topics

## [5.9.2] - (26.08.2022)

## Changes

- cleanup

## [5.9.1] - (26.08.2022)

## Changes

- convert password generator to iuse promises async/await
- cleanup

## [5.9.0] - (25.08.2022)

## Changes

- added installer password generator, no need generate it manually in external generator
- config schema updated

## [5.8.4] - (25.08.2022)

## Changes

- rebuild refresh data process
- config schema updated
- cosmetics changes

## [5.8.3] - (23.08.2022)

## Changes

- fix [#55](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/55)

## [5.8.2] - (21.08.2022)

## Changes

- code cleanup
- better fix Power characteristic warning negative value [#54](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/54)

## [5.8.1] - (13.08.2022)

## Changes

- fix Power characteristic warning negative value [#54](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/54)

## [5.8.0] - (12.08.2022)

## Changes

- added possibility automatically 'Power peak reset' every day, week, month
- config schema updated

## [5.7.8] - (08.08.2022)

## Changes

- fix [#53](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/53)

## [5.7.7] - (08.08.2022)

## Changes

- fix production *Power peak detected* state
- rebuild log

## [5.7.6] - (07.08.2022)

## Changes

- fix auto/manual consumptions 'Power peak reset and save'
- log updated
- properties in code updated

## [5.7.3] - (07.08.2022)

## Changes

- fix auto 'Power peak reset' at midnight

## [5.7.2] - (06.08.2022)

## Changes

- fix characteristic 'Power peak reset' warning

## [5.7.1] - (06.08.2022)

## Changes

- fix update button state characteristics for power peak reset

## [5.7.0] - (06.08.2022)

## Changes

- added possibility to manuall reset *Power peak* (in accessory using button)
- added possibility to automatically reset *Power peak* at midnight (in plugin setting configurable)
- updated config schema

## [5.6.22] - (06.08.2022)

## Changes

- rename *Power Max* to *Power Peak*
- added extra refresh data for production (microinverters)

## [5.6.21] - (03.08.2022)

## Changes

- fix [#52](https://github.com/grzegorz914/homebridge-enphase-envoy/issues/52)

## [5.6.20] - (03.08.2022)

## Changes

- added possibility to disable display device info in log after plugin restart
- check required properties to create accessory
- correct some logs typos

## [5.6.15] - (02.08.2022)

## Changes

- fix refresh power and energy production data if no meters are installed

## [5.6.14] - (02.08.2022)

## Changes

- fix display undefinded Power and Energy type if no meters are installed

## [5.6.13] - (23.07.2022)

## Changes

- refactor information service

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

- update config.chema
- fixed many small bugs
- correct identyfi all hardware
- code cleanup

## [4.6.0] - (24.02.2021)

## Changes

- added Characteristics for Apparent and Reactive Power
- fixed some bugs

## Important note v4.5.0 and above

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

## Important note v4.0.0 and above

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

## Important note v3.5.0 and above

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
