'use strict';

const fs = require('fs');
const axios = require('axios');
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
    this.host = config.host;
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
    this.maxProductionPower = 0;
    this.totalConsumptionPower = 0;
    this.netConsumptionPower = 0;
    this.url = 'http://' + this.host;

    //Check net state
    setInterval(function () {
      axios.get(this.url + '/production.json').then(response => {
        this.log.debug('Device %s %s, get device status data: %s', this.host, this.name, response.data);
        this.deviceStatusInfo = response;
        if (!this.connectionStatus) {
          this.log.info('Device: %s %s, state: Online.', this.host, this.name);
          this.connectionStatus = true;
          setTimeout(this.getDeviceInfo.bind(this), 350);
        } else {
          this.getDeviceState();
        }
      }).catch(error => {
        this.log.debug('Device: %s %s, state: Offline.', this.host, this.name);
        this.connectionStatus = false;
        return;
      });
    }.bind(this), this.refreshInterval * 1000);

    //Delay to wait for device info before publish
    setTimeout(this.prepareEnvoyService.bind(this), 1500);
  }

  getDeviceInfo() {
    var me = this;
    me.log.debug('Device: %s %s, requesting config information.', me.host, me.name);
    axios.get(this.url + '/info.xml').then(response => {
      parseStringPromise(response.data).then(result => {
        me.log.debug('Device: %s %s, get Device info successful: %s', me.host, me.name, JSON.stringify(result, null, 2));
        let response = result;
        let serialNumber = response.envoy_info.device[0].sn[0];
        let firmware = response.envoy_info.device[0].software[0];
        let inverters = me.deviceStatusInfo.data.production[0].activeCount;
        me.log('-------- %s --------', me.name);
        me.log('Manufacturer: %s', me.manufacturer);
        me.log('Model: %s', me.modelName);
        me.log('Serial: %s', serialNumber);
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
    let response = me.deviceStatusInfo;
    let wNow = response.data.production[1].wNow;
    let whToday = response.data.production[1].whToday;
    let whLastSevenDays = response.data.production[1].whLastSevenDays;
    let whLifetime = response.data.production[1].whLifetime;
    if (wNow < 0) {
      wNow = 0;
    }
    if (wNow > me.maxProductionPower) {
      me.maxProductionPower = wNow;
    }
    let totalConsumptionPower = response.data.consumption[0].wNow;
    let netConsumptionPower = response.data.consumption[1].wNow;
    me.log.debug('Device: %s %s, get production Power successful: %s kW', me.host, me.name, wNow / 1000);
    me.log.debug('Device: %s %s, get energy Today successful: %s kW', me.host, me.name, whToday / 1000);
    me.log.debug('Device: %s %s, get energy last seven Days successful: %s kW', me.host, me.name, whLastSevenDays / 1000);
    me.log.debug('Device: %s %s, get energy Total successful: %s kW', me.host, me.name, whLifetime / 1000);
    me.log.debug('Device: %s %s, get max production Power successful: %s kW', me.host, me.name, me.maxProductionPower / 1000);
    me.log.debug('Device: %s %s, get total consumption Power successful: %s kW', me.host, me.name, totalConsumptionPower / 1000);
    me.log.debug('Device: %s %s, get net consumption Power successful: %s kW', me.host, me.name, netConsumptionPower / 1000);
    me.wNow = parseFloat(wNow);
    me.whToday = parseFloat(whToday);
    me.whLastSevenDays = parseFloat(whLastSevenDays);
    me.whLifetime = parseFloat(whLifetime);
    me.totalConsumptionPower = parseFloat(totalConsumptionPower);
    me.netConsumptionPower = parseFloat(netConsumptionPower);
  }

  //Prepare TV service 
  prepareEnvoyService() {
    this.log.debug('prepareEnvoyService');
    const accessoryName = this.name;
    const accessoryUUID = UUID.generate(accessoryName);
    this.accessory = new Accessory(accessoryName, accessoryUUID);
    this.accessory.context.myData = this.maxProductionPower;
    this.accessory.category = Categories.Sensor;

    this.accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.modelName)
      .setCharacteristic(Characteristic.SerialNumber, this.serialNumber)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmwareRevision);

    this.envoyService = new Service.CarbonDioxideSensor(accessoryName, 'envoyService');

    this.envoyService.getCharacteristic(Characteristic.CarbonDioxideDetected)
      .on('get', this.getDetected.bind(this));

    this.envoyService.getCharacteristic(Characteristic.CarbonDioxideLevel)
      .on('get', this.getProductionPower.bind(this));

    this.envoyService.getCharacteristic(Characteristic.CarbonDioxidePeakLevel)
      .on('get', this.getMaxProductionPower.bind(this));

    this.accessory.addService(this.envoyService);

    this.log.debug('Device: %s %s, publishExternalAccessories.', this.host, accessoryName);
    this.api.publishExternalAccessories(PLUGIN_NAME, [this.accessory]);
  }

  getDetected(callback) {
    var me = this;
    let state = 0;
    if (me.wNow >= me.maxPowerDetected) {
      state = 1;
    }
    me.log.info('Device: %s %s, max Power detected successful: %s', me.host, me.name, state);
    callback(null, state);
  }

  getProductionPower(callback) {
    var me = this;
    let wNow = me.wNow;
    let whToday = me.whToday;
    let whLastSevenDays = me.whLastSevenDays;
    let whLifetime = me.whLifetime;
    me.log.info('Device: %s %s, get current power production: %s kW', me.host, me.name, wNow / 1000);
    me.log.info('Device: %s %s, get energy production Today: %s kW', me.host, me.name, whToday / 1000);
    me.log.info('Device: %s %s, get energy production Last 7 Days: %s kW', me.host, me.name, whLastSevenDays / 1000);
    me.log.info('Device: %s %s, get energy production Total: %s kW', me.host, me.name, whLifetime / 1000);
    callback(null, wNow);
  }

  getMaxProductionPower(callback) {
    var me = this;
    let power = me.maxProductionPower;
    me.log.info('Device: %s %s, get max Power production successful: %s kW', me.host, me.name, power / 1000);
    callback(null, power);
  }

  getNetConsumptionPower(callback) {
    var me = this;
    let power = me.netConsumptionPower;
    me.log.info('Device: %s %s, get net Power consumption successful: %s kW', me.host, me.name, power / 1000);
    callback(null, power);
  }
}

