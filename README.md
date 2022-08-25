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

Homebridge plugin for Photovoltaic Energy System manufactured by Enphase.                                           
Supported *Envoy-IQ, Envoy-S Metered/Standard* and all peripheral devices.

</span>

## Package Requirements
| Package | Installation | Role | Required |
| --- | --- | --- | --- |
| [Homebridge](https://github.com/homebridge/homebridge) | [Homebridge Wiki](https://github.com/homebridge/homebridge/wiki) | HomeKit Bridge | Required |
| [Config UI X](https://github.com/oznu/homebridge-config-ui-x/wiki) | [Config UI X Wiki](https://github.com/oznu/homebridge-config-ui-x/wiki) | Web User Interface | Recommended |
| [Enphase Envoy](https://www.npmjs.com/package/homebridge-enphase-envoy) | `npm install -g homebridge-enphase-envoy` | Plug-In | Required |

### Note
* Homebridge Enphase Envoy v4.5.0 and above the minimum required version of Homebridge is 1.3.x.
* If count of all installed devices is grater than 100, the app will stop responding. This is HomeKit limitations, if this happens by You please open the issue, I will look how to fix this.

### Know issues
* If used with Hoobs, there is a possible configuration incompatibilty.
* Envoy with firmware 7.x.x will not work due to new authentications method.
* More info and discusion about authentication method changed and loss of local API connectivity [here](https://support.enphase.com/s/question/0D53m00006ySLuRCAW/unimpressed-with-loss-of-local-api-connectivity-to-envoys)

### Troubleshooting
* If for some reason the device is not displayed in HomeKit app try this procedure:
   * Go to `./homebridge/persist` macOS or `/var/lib/homebridge/persist` for RPI.
   * Remove `AccessoryInfo.xxx` file which contain Your device data: `{"displayName":"Envoy"}`.
   * Next remove `IdentifierCashe.xxx` file with same name as `AccessoryInfo.xxx`.
   * Restart Homebridge and try add it to the Home app again.

### About the plugin
* All devices are detected automatically (Envoy, Q-Relays, AC Batteries, Meters, Microinverters, Ensemble, Encharges, Enpower, WirelessKit).
* Envoy *device ID* is detected automatically, is required to control Power Production.
* Envoy *password* is detected automatically or can be added in config if was already chenged by user.
* Installer *password* is generated automatically, no need generate it manually in external generator anymore.
* For best experiences please use *Controller App* or *EVE app* for iOS, Home app display it as unsupported.
* Home automations and shortcuts can be used to check *Devices* communication level and change *Power Production Mode*.
* MQTT Client publisch all available data from all installed devices.
* Meters Reading Data is refresh every 1.5 sec.
* Production CT Data is refresh every 3.0 sec.

### Important changes
#### v5.9.0 and above!
* added installer password generator, no need generate it manually in external generator anymore.

#### v5.8.0 and above!
* added automatically *Power peak* reset every day, week, month.

#### v5.7.0 and above!
* added manuall *Power peak* reset in accesorry.
* added automatically *Power peak* reset at midnight.

#### v5.5.0 and above!
* Added MQTT Client.

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
* Peak Level (W) - display the Peak Power production/consumption.
* Production Current Level (Wh)/(kWh) - is the Energy production (Lifetime and 7Days in kWh, Today in Wh).
* Consumption Current Level (Wh)/(kWh) - is the Total and Net Energy Consumption (Lifetime and 7Days in kWh, Today in Wh).

## Power Production Control
* You can set task for the Envoy to Enable/Disable power production on the microinverters (required *installerPasswd*).
* On a typical system during daylight hours, the Envoy will execute the task within 15 minutes.
* More info about [Power Production task](https://support.enphase.com/s/article/How-do-I-disable-and-enable-power-production).

### Configuration
* Run this plugin as a child bridge (Highly Recommended).
* Install and use [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x/wiki) to configure this plugin (Highly Recommended). 
* The sample configuration can be edited and used manually as an alternative. 
* See the `sample-config.json` file in this repository for an example or copy the example below into your config.json file, making the apporpriate changes before saving it. Be sure to always make a backup copy of your config.json file before making any changes to it.

<p align="left">
  <a href="https://github.com/grzegorz914/homebridge-enphase-envoy"><img src="https://raw.githubusercontent.com/grzegorz914/homebridge-enphase-envoy/main/graphics/ustawienia.png" width="840"></a>
</p>

| Key | Description | 
| --- | --- |
| `name` | Here set the accessory *Name* to be displayed in *Homebridge/HomeKit*. |
| `host` | Here set the envoy *IP Address* or *Hostname* or leave empy (will be used default path `envoy.local`) |
| `enableDebugMode` | If enabled, deep log will be present in homebridge console. |
| `disableLogInfo`| If enabled, then disable log info, all values and state will not be displayed in Homebridge log console |
| `disableLogDeviceInfo` | If enabled, add ability to disable log device info by every connections device to the network. |
| `envoyPasswd` | Here set the envoy password (only if U already changed the default password) |
| `powerProductionMaxAutoReset` | Here select at which period of time the *Power Peak* will auto reset. |
| `powerProductionMaxDetected` | Here set the *production Power peak*, if the Power will be >= `powerProductionMaxDetected` then You get notification message from the HomeKit |
| `energyProductionLifetimeOffset` | Here set the *Offset* of lifetime energy production if nedded in (Wh),(+/-) |
| `powerConsumptionTotalMaxAutoReset` | Here select at which period of time the *Power Peak* will auto reset. |
| `powerConsumptionTotalMaxDetected` | Here set the *consumption-total Power peak*, if the Power will be >= `powerConsumptionTotalMaxDetected` then You get notyfication message from the HomeKit |
| `energyConsumptionTotalLifetimeOffset` | Here set the offset of lifetime total energy consumption if nedded in (Wh),(+/-) |
| `powerConsumptionNetMaxAutoReset` | Here select at which period of time the *Power Peak* will auto reset. |
| `powerConsumptionNetMaxDetected` | Here set the *consumption-net Power peak*, if the Power will be >= `powerConsumptionNetMaxDetected` then You get notyfication message from the HomeKit |
| `energyConsumptionNetLifetimeOffset` | Here set the offset of lifetime net energy consumption if nedded in (Wh),(+/-) |
| `enableMqtt` | If enabled, MQTT Broker will start automatically and publish all awailable PV installation data. |
| `mqttHost` | Here set the *IP Address* or *Hostname* for MQTT Broker.) |
| `mqttPort` | Here set the *Port* for MQTT Broker, default 1883.) |
| `mqttPrefix` | Here set the *Prefix* for *Topic* or leave empty.) |
| `mqttAuth` | If enabled, MQTT Broker will use authorization credentials. |
| `mqttUser` | Here set the MQTT Broker user. |
| `mqttPasswd` | Here set the MQTT Broker password. |
| `mqttDebug` | If enabled, deep log will be present in homebridge console for MQTT. |

```json
        {
            "platform": "enphaseEnvoy",
            "devices": [
                {
                    "name": "Envoy",
                    "host": "192.168.1.35",
                    "refreshInterval": 30,
                    "enableDebugMode": false,
                    "disableLogInfo": false,
                    "disableLogDeviceInfo": false,
                    "envoyPasswd": "",
                    "powerProductionMaxAutoReset": 0,
                    "powerProductionMaxDetected": 5400,
                    "energyProductionLifetimeOffset": 0,
                    "powerConsumptionTotalMaxAutoReset": 0,
                    "powerConsumptionTotalMaxDetected": 10000,
                    "energyConsumptionTotalLifetimeOffset": 0,
                    "powerConsumptionNetMaxAutoReset": 0,
                    "powerConsumptionNetMaxDetected": 10000,
                    "energyConsumptionNetLifetimeOffset": 0,
                    "enableMqtt": false,
                    "mqttHost": "192.168.1.33",
                    "mqttPort": 1883,
                    "mqttPrefix": "home/envoy",
                    "mqttAuth": false,
                    "mqttUser": "user",
                    "mqttPass": "password",
                    "mqttDebug": false
                }
            ]
        }
```

### Adding to HomeKit
* Each accessory needs to be manually paired. 
  * Open the Home <img src='https://user-images.githubusercontent.com/3979615/78010622-4ea1d380-738e-11ea-8a17-e6a465eeec35.png' width='16.42px'> app on your device. 
  * Tap the Home tab, then tap <img src='https://user-images.githubusercontent.com/3979615/78010869-9aed1380-738e-11ea-9644-9f46b3633026.png' width='16.42px'>. 
  * Tap *Add Accessory*, and select *I Don't Have a Code, Cannot Scan* or *More options*. 
  * Select Your accessory and press add anyway. 
  * Enter the PIN or scan the QR code, this can be found in Homebridge UI or Homebridge logs.
  * Complete the accessory setup.

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
3. Install homebrew: `/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/main/install)"`.
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
  <a href="https://github.com/grzegorz914/homebridge-enphase-envoy"><img src="https://raw.githubusercontent.com/grzegorz914/homebridge-enphase-envoy/main/graphics/envoy_topbar.png" width="200"></a>
</p>

## [What's New](https://github.com/grzegorz914/homebridge-enphase-envoy/blob/main/CHANGELOG.md)

## Development
Please feel free to create a Pull request and help in development. It will be highly appreciated.
