<p align="center">
  <a href="https://github.com/grzegorz914/homebridge-enphase-envoy"><img src="https://raw.githubusercontent.com/grzegorz914/homebridge-enphase-envoy/master/graphics/homebridge-enphase-envoy.png" width="540"></a>
</p>

<span align="center">

# Homebridge Enphase Envoy
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm](https://badgen.net/npm/dt/homebridge-enphase-envoy?color=purple)](https://www.npmjs.com/package/homebridge-enphase-envoy) [![npm](https://badgen.net/npm/v/homebridge-enphase-envoy?color=purple)](https://www.npmjs.com/package/homebridge-enphase-envoy)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/grzegorz914/homebridge-enphase-envoy.svg)](https://github.com/grzegorz914/homebridge-enphase-envoy/pulls)
[![GitHub issues](https://img.shields.io/github/issues/grzegorz914/homebridge-enphase-envoy.svg)](https://github.com/grzegorz914/homebridge-enphase-envoy/issues)

Homebridge plugin for Photovoltaic Energy System manufactured by Enphase.                                           
Supported *Envoy-IQ, Envoy-S Metered/Standard* and all peripheral devices.

</span>

## Package Requirements
| Package Link | Installation | Role | Required |
| --- | --- | --- | --- |
| [Homebridge](https://github.com/homebridge/homebridge) | [Homebridge Wiki](https://github.com/homebridge/homebridge/wiki) | HomeKit Bridge | Required |
| [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x/wiki) | [Homebridge Config UI X Wiki](https://github.com/oznu/homebridge-config-ui-x/wiki) | Web User Interface | Recommended |
| [Homebridge Enphase Envoy](https://www.npmjs.com/package/homebridge-enphase-envoy) | `npm npm install -g homebridge-enphase-envoy` | Plug-In | Required |

### Note
* Homebridge Enphase Envoy v4.5.0 and above the minimum required version of Homebridge is 1.3.x.
* New authorization method (fw 7.x.x) will be added after Enphase release technical brief about this changes.
* Update (17.08.2021) - Enphase working on fix and new firmware will be pushed to affected devices soon.
* If count of all installed devices is grater than 100, the app will stop responding. This is HomeKit limitations, if this happens by You please open the issue, I will look how to fix this.

### Know issues
* If used with Hoobs, there is a possible configuration incompatibilty.
* Envoy firmware 7.x.x and above not supported right now due to authentication method changed by Enphase.

### About the plugin!
* All devices are detected automatically (Envoy, Q-Relays, AC Batteries, Meters, Microinverters, Ensemble, Encharges, Enpower, WirelessKit).
* Envoy *device ID* is detected automatically, is required to control Power Production.
* Envoy *password* is detected automatically or can be added in config if was already chenged by user.
* Installer *password* is required to read communications level of (Microinverters, Q-Relays, AC Batteries) and data from Ensemble devices (Enpower, Encharges).
* Installer [password need to be generated](https://thecomputerperson.wordpress.com/2016/08/28/reverse-engineering-the-enphase-installer-toolkit/).
* For best experiences please use *Controller App* or *EVE app* for iOS, Home app display it as unsupported.
* Home automations and shortcuts can be used to check *Devices* communication level and change *Power Production Mode*.

### Important changes
#### v5.2.15 and above!
* Added system Power Production - Enable/Disable (required *installerPasswd*).
* Finally detects Ensemble, Encharges and Enpower (required *installerPasswd*).

#### v4.x.x and above!
* Version 4.0.0 whole new concept.
* All devices in are detected automatically (Envoy, Q-Relays, AC Batteries, Meters, Microinverters).

#### v3.x.x and above!
* From v3.0.0 the plugin is present as Power Meter and the Power is displayed in (kW) and Energy in (kWh).
* For best experiences please use *Controller App* or *EVE app* for iOS, Home app display it as unsupported.

#### v2.3.x
* The plugin is present as C02(ppm) sensors and the Power is displayed in Watt and Energy in Wh/kWh.
+ Production Current Level (W) - is the current Power production in (W). If the value is (< 0) and display (`-`values) then the PV consumed power from Grid.
* Consumption Current Level Total (W) - is the Total Power Consumption in (W)).
* Consumption Current Level Net (W) - is the Power Consumption from Grid in (W). If the value is (< 0) and display (`-`values) then the Power is exported to the Grid.
* Peak Level (W) - display the maximum Power production/consumption.
* Production Current Level (Wh)/(kWh) - is the Energy production (Lifetime and 7Days in kWh, Today in Wh).
* Consumption Current Level (Wh)/(kWh) - is the Total and Net Energy Consumption (Lifetime and 7Days in kWh, Today in Wh).

## Power Production Control
* You can set task for the Envoy to Enable/Disable power production on the microinverters (required *installerPasswd*).
* On a typical system during daylight hours, the Envoy will execute the task within 15 minutes.
* More info about [Power Production task](https://support.enphase.com/s/article/How-do-I-disable-and-enable-power-production).

## Configuration
Install and use [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x/wiki) plugin to configure this plugin (Highly Recommended). The sample configuration can be edited and used manually as an alternative. See the `sample-config.json` file in this repository for an example or copy the example below into your config.json file, making the apporpriate changes before saving it. Be sure to always make a backup copy of your config.json file before making any changes to it.

<p align="left">
  <a href="https://github.com/grzegorz914/homebridge-enphase-envoy"><img src="https://raw.githubusercontent.com/grzegorz914/homebridge-enphase-envoy/master/graphics/ustawienia.png" width="840"></a>
</p>

## Configuration Values
| Key | Description | 
| --- | --- |
| `name` | Here set the accessory *Name* to be displayed in *Homebridge/HomeKit*. |
| `host` | Here set the *IP Address* or *Hostname* or leave empy (will be used default path `envoy.local`) |
| `refreshInterval` | Here set the data refresh time in seconds, default is every 5 seconds |
| `disableLogInfo`| If enabled, then disable log info, all values and state will not be displayed in Homebridge log console |
| `envoyUser` | Here set the envoy user or leave empty, standard is `envoy` (removed from 4.6.11, not nedded anymore) |
| `envoyPasswd` | Here set the envoy password (only if U already changed the default password) |
| `installerUser` | Here set the optional installer user, standard is `installer` (removed from 4.6.11, not nedded anymore) |
| `installerPasswd` | Here set the optional installer password, [password need to be generated](https://thecomputerperson.wordpress.com/2016/08/28/reverse-engineering-the-enphase-installer-toolkit/). |
| `enchargeStorage` | check *ON* if AC Batteries are installed. (not available from v3.5.0) |
| `acBatteriesStorageOffset` | Here set the *Offset* of AC Batteries energy if nedded in (Wh),(+/-) (not available from v4.9.0)|
| `powerConsumptionMetersInstalled` | Here check *ON* if consumption meters are installed. (not available from v3.5.0) |
| `powerProductionMeter` | Here select which *meter* will be used to display Power production. (not available from v3.5.0) |
| `powerProductionMaxDetected` | Here set the *maximum production Power*, if the Power production will be >= `powerProductionMaxDetected` then You get notification message from the HomeKit |
| `energyProductionLifetimeOffset` | Here set the *Offset* of lifetime energy production if nedded in (Wh),(+/-) |
| `powerConsumptionMeter` | Here select which *meter* will be used to display Power consumption. (not available from v3.5.0)
| `powerConsumptionTotalMaxDetected` | Here set the *maximum total consumption Power*, if the total Power consumption will be >= `powerConsumptionTotalMaxDetected` then You get notyfication message from the HomeKit |
| `energyConsumptionTotalLifetimeOffset` | Here set the offset of lifetime total energy consumption if nedded in (Wh),(+/-) |
| `powerConsumptionNetMaxDetected` | Here set the maximum Power consumption from Grid, if the Power consumption will be >= `powerConsumptionNetMaxDetected` then You get notyfication message from the HomeKit |
| `energyConsumptionNetLifetimeOffset` | Here set the offset of lifetime net energy consumption if nedded in (Wh),(+/-) |
| `manufacturer`, `modelName` | Optional free-form informational data that will be displayed in the Home.app if it is filled in (not available from v4.7.0)|

```json
        {
            "platform": "enphaseEnvoy",
            "devices": [
                {
                    "name": "Envoy",
                    "host": "192.168.1.35",
                    "refreshInterval": 30,
                    "disableLogInfo": false,
                    "envoyUser": "envoy", //removed from 4.6.11, not nedded anymore
                    "envoyPasswd": "",
                    "installerUser": "installer", //removed from 4.6.11 not nedded anymore
                    "installerPasswd": "",
                    "acBatteriesStorageOffset": 0, //removed from 4.9.0 not nedded anymore
                    "powerProductionMaxDetected": 5400,
                    "energyProductionLifetimeOffset": 0,
                    "powerConsumptionTotalMaxDetected": 10000,
                    "energyConsumptionTotalLifetimeOffset": 0,
                    "powerConsumptionNetMaxDetected": 10000,
                    "energyConsumptionNetLifetimeOffset": 0,
                    "manufacturer": "Manufacturer", //removed from 4.7.0 not nedded anymore
                    "modelName": "Model" //removed from 4.7.0 not nedded anymore
                }
            ]
        }
```

## Adding to HomeKit
Each accessory needs to be manually paired. 
1. Open the Home <img src='https://user-images.githubusercontent.com/3979615/78010622-4ea1d380-738e-11ea-8a17-e6a465eeec35.png' width='16.42px'> app on your device. 
2. Tap the Home tab, then tap <img src='https://user-images.githubusercontent.com/3979615/78010869-9aed1380-738e-11ea-9644-9f46b3633026.png' width='16.42px'>. 
3. Tap *Add Accessory*, and select *I Don't Have a Code or Cannot Scan*. 
4. Select Your accessory. 
5. Enter the Homebridge PIN, this can be found under the QR code in Homebridge UI or your Homebridge logs, alternatively you can select *Use Camera* and scan the QR code again.

## Limitations
* That maximum Services for 1 accessory is 100. If Services > 100, accessory stop responding.
* The Services in this accessory are:
  * Information.
  * Envoy.
  * Q-Relays.
  * Meters.
  * Microinverters.
  * AC Batteries.
  * Ensemble.
  * Encharges.
  * Production.
  * Consumption.

# Bonus Top Bar on Mac!!!
1. Download `enphase_envoy.15s.rb`.
2. Open the Terminal app. 
3. Install homebrew: `/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`.
4. Install digest auth: `gem install net-http-digest_auth`.
5. Install [xBar](https://github.com/matryer/xbar/releases)
6. Edit the `enphase_envoy.15s.rb` file and change the `MICROINVERTERS_SUM_WATTS = 5400` to Your microinverters power.
7. Edit the `enphase_envoy.15s.rb` file and change `ENVOY_IP = envoy.local` to IP Address of Your Envoy if nedded.
8. If You already changed Your standard Envoy password, edit the `enphase_envoy.15s.rb` file and change `uri.password = envoySerial[-6,6]`.
9. Run [xBar](https://github.com/matryer/xbar) and go to xbar>>>Open Plugin Folder and chose folder where You placed the `enphase_envoy.15s.rb`.
10. After a few seconds You will see all data on the Top Bar:

### Quick info about file name and its function:
1. The `enphase_envoy` just the file name.
2. The `15s` data refresh time.
3. The `rb` file extension.

Data refresh time
* 15s - 15 seconds
* 1m - 1 minute
* 1h - 1 hour

<p align="left">
  <a href="https://github.com/grzegorz914/homebridge-enphase-envoy"><img src="https://raw.githubusercontent.com/grzegorz914/homebridge-enphase-envoy/master/graphics/envoy_topbar.png" width="200"></a>
</p>

## [What's New](https://github.com/grzegorz914/homebridge-enphase-envoy/blob/master/CHANGELOG.md)

## Development
Please feel free to create a Pull request and help in development. It will be highly appreciated.
