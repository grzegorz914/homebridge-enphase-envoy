'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const parseStringPromise = require('xml2js').parseStringPromise;

const PLUGIN_NAME = 'homebridge-enphase-envoy';
const PLATFORM_NAME = 'enphaseEnvoy';

let Accessory, Characteristic, Service, Categories, UUID;

module.exports = (api) => {
  Accessory = api.platformAccessory;
  Characteristic = api.hap.Characteristic;
  Service = api.hap.Service;
  Categories = api.hap.Categories;
  UUID = api.hap.uuid;
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, envoyPlatform, true);
}

class envoyPlatform {
  constructor(log, config, api) {
    // only load if configured
    if (!config || !Array.isArray(config.devices)) {
      log('No configuration found for %s', PLUGIN_NAME);
      return;
    }
    this.log = log;
    this.config = config;
    this.api = api;
    this.devices = config.devices || [];
    this.accessories = [];

    this.api.on('didFinishLaunching', () => {
      this.log.debug('didFinishLaunching');
      for (let i = 0, len = this.devices.length; i < len; i++) {
        let deviceName = this.devices[i];
        if (!deviceName.name) {
          this.log.warn('Device Name Missing')
        } else {
          this.accessories.push(new envoyDevice(this.log, deviceName, this.api));
        }
      }
    });
  }

  configureAccessory(accessory) {
    this.log.debug('configureAccessory');
    this.accessories.push(accessory);
  }

  removeAccessory(accessory) {
    this.log.debug('removeAccessory');
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  }
}

class envoyDevice {
  constructor(log, config, api) {
    this.log = log;
    this.api = api;
    this.config = config;


    //device configuration
    this.name = config.name;
    this.host = config.host || 'envoy.local';
    this.refreshInterval = config.refreshInterval || 30;
    this.maxPowerDetected = config.maxPowerDetected;

    //get Device info
    this.manufacturer = config.manufacturer || 'Enphase';
    this.modelName = config.modelName || 'Envoy-S';
    this.serialNumber = config.serialNumber || 'SN0000005';
    this.firmwareRevision = config.firmwareRevision || 'FW0000005';

    //setup variables
    this.connectionStatus = false;
    this.wNow = 0;
    this.whToday = 0;
    this.whLastSevenDays = 0;
    this.whLifetime = 0;
    this.maxPowerProduction = 0;
    this.totalPowerConsumption = 0;
    this.netPowerConsumption = 0;
    this.maxPowerDetectedState = 0;
    this.prefDir = path.join(api.user.storagePath(), 'enphaseEnvoy');
    this.maxPowerFile = this.prefDir + '/' + 'maxPower_' + this.host.split('.').join('');
    this.url = 'http://' + this.host;

    //check if prefs directory ends with a /, if not then add it
    if (this.prefDir.endsWith('/') === false) {
      this.prefDir = this.prefDir + '/';
    }

    //check if the directory exists, if not then create it
    if (fs.existsSync(this.prefDir) === false) {
      fs.mkdir(this.prefDir, { recursive: false }, (error) => {
        if (error) {
          this.log.error('Device: %s %s, create directory: %s, error: %s', this.host, this.name, this.prefDir, error);
        } else {
          this.log.debug('Device: %s %s, create directory successful: %s', this.host, this.name, this.prefDir);
        }
      });
    }

    //Check net state
    setInterval(function () {
      axios.get(this.url + '/production.json').then(response => {
        this.log.debug('Device %s %s, get device status data: %s', this.host, this.name, response.data);
        this.deviceStatusInfo = response;
        if (!this.connectionStatus) {
          this.log.info('Device: %s %s, state: Online.', this.host, this.name);
          setTimeout(this.getDeviceInfo.bind(this), 300);
          this.connectionStatus = true;
        } else {
          setTimeout(this.getDeviceState.bind(this), 300);
        }
      }).catch(error => {
        this.log.debug('Device: %s %s, state: Offline.', this.host, this.name);
        this.connectionStatus = false;
        return;
      });
    }.bind(this), this.refreshInterval * 1000);

    //Delay to wait for device info before publish
    setTimeout(this.prepareEnvoyService.bind(this), 500);
  }

  getDeviceInfo() {
    var me = this;
    me.log.debug('Device: %s %s, requesting config information.', me.host, me.name);
    axios.get(me.url + '/info.xml').then(response => {
      parseStringPromise(response.data).then(result => {
        me.log.debug('Device: %s %s, get Device info successful: %s', me.host, me.name, JSON.stringify(result, null, 2));
        let serialNumber = result.envoy_info.device[0].sn[0];
        let firmware = result.envoy_info.device[0].software[0];
        let inverters = me.deviceStatusInfo.data.production[0].activeCount;
        me.log('-------- %s --------', me.name);
        me.log('Manufacturer: %s', me.manufacturer);
        me.log('Model: %s', me.modelName);
        me.log('Serialnr: %s', serialNumber);
        me.log('Firmware: %s', firmware);
        me.log('Inverters: %s', inverters);
        me.log('----------------------------------');
        me.serialNumber = serialNumber;
        me.firmwareRevision = firmware;
      }).catch(error => {
        me.log.error('Device %s %s, getDeviceInfo parse string error: %s', me.host, me.name, error);
      });
    }).catch(error => {
      me.log.error('Device: %s %s, getDeviceInfo eror: %s', me.host, me.name, error);
    });
  }

  getDeviceState() {
    var me = this;
    let result = me.deviceStatusInfo.data;
    me.log.debug(result);
    let wNow = parseFloat(result.production[1].wNow / 1000).toFixed(3);
    if (wNow < 0) {
      wNow = 0;
    }

    //save and read maxPowerProduction
    let savedMaxPower;
    try {
      savedMaxPower = fs.readFileSync(me.maxPowerFile);
    } catch (error) {
      me.log.debug('Device: %s %s, maxPowerFile file does not exist', me.host, me.name);
    }

    let maxPower = me.maxPowerProduction;
    if (savedMaxPower) {
      maxPower = savedMaxPower;
    }

    if (wNow > maxPower) {
      fs.writeFile(me.maxPowerFile, (wNow), (error) => {
        if (error) {
          me.log.error('Device: %s %s, could not write maxPowerFile, error: %s', me.host, me.name, error);
        } else {
          me.log.debug('Device: %s %s, maxPowerFile saved successful in: %s %s kW', me.host, me.name, me.prefDir, wNow);
        }
      });
    }

    let maxPowerDetectedState = 0;
    if (wNow >= me.maxPowerDetected / 1000) {
      maxPowerDetectedState = 1;
    }

    let whToday = parseFloat(result.production[1].whToday / 1000).toFixed(3);
    let whLastSevenDays = parseFloat(result.production[1].whLastSevenDays / 1000).toFixed(3);
    let whLifetime = parseFloat(result.production[1].whLifetime / 1000).toFixed(3);
    let totalPowerConsumption = parseFloat(result.consumption[0].wNow / 1000).toFixed(3);
    let netPowerConsumption = parseFloat(result.consumption[1].wNow / 1000).toFixed(3);
    if (me.envoyService) {
      me.envoyService.updateCharacteristic(Characteristic.CarbonDioxideDetected, maxPowerDetectedState);
      me.envoyService.updateCharacteristic(Characteristic.CarbonDioxideLevel, wNow * 1000);
      me.envoyService.updateCharacteristic(Characteristic.CarbonDioxidePeakLevel, maxPower * 1000);
    }
    me.log.debug('Device: %s %s, get current Power production: %s kW', me.host, me.name, wNow);
    me.log.debug('Device: %s %s, get max Power production: %s kW', me.host, me.name, me.maxPowerProduction);
    me.log.debug('Device: %s %s, get max Power detected: %s', me.host, me.name, maxPowerDetectedState ? 'Yes' : 'No');
    me.log.debug('Device: %s %s, get total Power consumption : %s kW', me.host, me.name, totalPowerConsumption);
    me.log.debug('Device: %s %s, get net Power consumption: %s kW', me.host, me.name, netPowerConsumption);
    me.log.debug('Device: %s %s, get energy Today: %s kW', me.host, me.name, whToday);
    me.log.debug('Device: %s %s, get energy last seven Days: %s kW', me.host, me.name, whLastSevenDays);
    me.log.debug('Device: %s %s, get energy Total: %s kW', me.host, me.name, whLifetime);
    me.wNow = wNow;
    me.whToday = whToday;
    me.whLastSevenDays = whLastSevenDays;
    me.whLifetime = whLifetime;
    me.maxPowerProduction = maxPower;
    me.totalPowerConsumption = totalPowerConsumption;
    me.netPowerConsumption = netPowerConsumption;
    me.maxPowerDetectedState = maxPowerDetectedState;
  }

  //Prepare TV service 
  prepareEnvoyService() {
    this.log.debug('prepareEnvoyService');
    const accessoryName = this.name;
    const accessoryUUID = UUID.generate(accessoryName);
    this.accessory = new Accessory(accessoryName, accessoryUUID);
    this.accessory.category = Categories.Sensor;

    this.accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.modelName)
      .setCharacteristic(Characteristic.SerialNumber, this.serialNumber)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmwareRevision);

    this.envoyService = new Service.CarbonDioxideSensor(accessoryName, 'envoyService');

    this.envoyService.getCharacteristic(Characteristic.CarbonDioxideDetected)
      .on('get', this.getMaxPowerDetected.bind(this));

    this.envoyService.getCharacteristic(Characteristic.CarbonDioxideLevel)
      .on('get', this.getPowerProduction.bind(this));

    this.envoyService.getCharacteristic(Characteristic.CarbonDioxidePeakLevel)
      .on('get', this.getMaxPowerProduction.bind(this));

    this.accessory.addService(this.envoyService);

    this.log.debug('Device: %s %s, publishExternalAccessories.', this.host, accessoryName);
    this.api.publishExternalAccessories(PLUGIN_NAME, [this.accessory]);
  }

  getMaxPowerDetected(callback) {
    var me = this;
    let state = me.maxPowerDetectedState
    me.log.info('Device: %s %s, get max Power detected: %s', me.host, me.name, state ? 'Yes' : 'No');
    callback(null, state);
  }

  getPowerProduction(callback) {
    var me = this;
    let wNow = me.wNow;
    let whToday = me.whToday;
    let whLastSevenDays = me.whLastSevenDays;
    let whLifetime = me.whLifetime;
    me.log.info('Device: %s %s, get current power production: %s kW', me.host, me.name, wNow);
    me.log.info('Device: %s %s, get energy production Today: %s kW', me.host, me.name, whToday);
    me.log.info('Device: %s %s, get energy production Last 7 Days: %s kW', me.host, me.name, whLastSevenDays);
    me.log.info('Device: %s %s, get energy production Total: %s kW', me.host, me.name, whLifetime);
    callback(null, wNow * 1000);
  }

  getMaxPowerProduction(callback) {
    var me = this;
    let power = me.maxPowerProduction;
    me.log.info('Device: %s %s, get max Power production successful: %s kW', me.host, me.name, power);
    callback(null, power * 1000);
  }

  getNetPowerConsumption(callback) {
    var me = this;
    let power = me.netPowerConsumption;
    me.log.info('Device: %s %s, get net Power consumption successful: %s kW', me.host, me.name, power);
    callback(null, power * 1000);
  }
}

