'use strict';

const axios = require('axios');

const PLUGIN_NAME = 'homebridge-enphase-envoy';
const PLATFORM_NAME = 'enphaseEnvoy';

let Service, Characteristic;

module.exports = (api) => {
  Accessory = api.platformAccessory;
  Service = api.hap.Service;
  Characteristic = api.hap.Characteristic;
  Categories = api.hap.Categories;
	UUID = api.hap.uuid;
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, envoyPlatform);
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

    //get Device info
    this.manufacturer = config.manufacturer || 'Enphase';
    this.modelName = config.modelName || PLUGIN_NAME;
    this.serialNumber = config.serialNumber || 'SN0000005';
    this.firmwareRevision = config.firmwareRevision || 'FW0000005';

    //setup variables
    this.currentProductionPower;
    this.totalConsumptionPower;
    this.netConsumptionPower;
    this.prefDir = path.join(api.user.storagePath(), 'envoy');
    this.devInfoFile = this.prefDir + '/' + 'devInfo_' + this.host.split('.').join('');

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
      axios.get(this.host + '/production.json').then(response => {
        this.log.debug('Device %s %s, get device status data: %s', this.host, this.name, response.data);
        this.deviceStatusInfo = response;
        if (!this.connectionStatus) {
          this.log.info('Device: %s %s, state: Online.', this.host, this.name);
          this.connectionStatus = true;
          //setTimeout(this.getDeviceInfo.bind(this), 750);
        } else {
          this.getDeviceState();
        }
      }).catch(error => {
        this.log.debug('Device: %s %s, state: Offline.', this.host, this.name);
        this.connectionStatus = false;
        return;
      });
    }.bind(this), 10000);

    //Delay to wait for device info before publish
    setTimeout(this.prepareEnvoyService.bind(this), 1500);
  }

  getDeviceInfo() {
    var me = this;
    me.log.debug('Device: %s %s, requesting config information.', me.host, me.name);
    axios.get(me.url + '/api/getallservices').then(response => {
      let channels = JSON.stringify(response.data.services, null, 2);
      fs.writeFile(me.inputsFile, channels, (error) => {
        if (error) {
          me.log.error('Device: %s %s, could not write Channels to the file, error: %s', me.host, me.name, error);
        } else {
          me.log.debug('Device: %s %s, saved Channels successful in: %s %s', me.host, me.name, me.prefDir, channels);
        }
      });
    }).catch(error => {
      me.log.error('Device: %s %s, get Channels list error: %s', me.host, me.name, error);
    });

    axios.get(me.url + '/api/deviceinfo').then(response => {
      me.manufacturer = response.data.brand;
      me.modelName = response.data.mname;
      me.serialNumber = response.data.webifver;
      me.firmwareRevision = response.data.enigmaver;
      me.kernelVer = response.data.kernelver;
      me.chipset = response.data.chipset;
      me.log('-------- %s --------', me.name);
      me.log('Manufacturer: %s', me.manufacturer);
      me.log('Model: %s', me.modelName);
      me.log('Kernel: %s', me.kernelVer);
      me.log('Chipset: %s', me.chipset);
      me.log('Webif version: %s', me.serialNumber);
      me.log('Firmware: %s', me.firmwareRevision);
      me.log('----------------------------------');
    }).catch(error => {
      me.log.error('Device: %s %s, getDeviceInfo eror: %s', me.host, me.name, error);
    });
  }

  getDeviceState() {
    var me = this;
    let response = me.deviceStatusInfo;
    let productionPower = response.production[1].wNow;
    let totalConsumptionPower = response.consumption[0].wNow;
    let netConsumptionPower = response.consumption[1].wNow;

    me.log.debug('Device: %s %s, get production Power successful: %s', me.host, me.name, productionPower);
    me.log.debug('Device: %s %s, get total consumption Power successful: %s', me.host, me.name, totalConsumptionPower);
    me.log.debug('Device: %s %s, get net consumption Power successful: %s', me.host, me.name, netConsumptionPower);
    me.currentProductionPower = productionPower;
    me.totalConsumptionPower = totalConsumptionPower;
    me.netConsumptionPower = netConsumptionPower;
  }

  //Prepare TV service 
  prepareEnvoyService() {
    this.log.debug('prepareEnvoyService');
    const accessoryName = this.name;
    const accessoryUUID = UUID.generate(accessoryName);
    this.accessory = new Accessory(accessoryName, accessoryUUID);
    this.accessory.category = Categories.AUDIO_RECEIVER;

    this.accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.modelName)
      .setCharacteristic(Characteristic.SerialNumber, this.serialNumber)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmwareRevision);

    this.envoyService = new Service.ServiceLabel(accessoryName, 'envoyService');
    this.envoyService.setCharacteristic(Characteristic.ConfiguredName, accessoryName);
    this.envoyService.setCharacteristic(Characteristic.SleepDiscoveryMode, Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

    this.envoyService.getCharacteristic(Characteristic.CarbonDioxideLevel)
      .on('get', this.getPower.bind(this));

    this.envoyService.getCharacteristic(Characteristic.CarbonDioxideDetected)
      .on('get', this.getCo2Detected.bind(this));

    this.accessory.addService(this.envoyService);

    this.log.debug('Device: %s %s, publishExternalAccessories.', this.host, accessoryName);
    this.api.publishExternalAccessories(PLUGIN_NAME, [this.accessory]);
  }

  getProductionPower(callback) {
    var me = this;
    let power = me.currentProductionPower;
    me.log.info('Device: %s %s, get current production Power successful: %s', me.host, me.name, power);
    callback(null, power);
  }

  getTotalConsumptionPower(callback) {
    var me = this;
    let power = me.totalConsumptionPower;
    me.log.info('Device: %s %s, get total consumption Power successful: %s', me.host, me.name, power);
    callback(null, power);
  }

  getNetConsumptionPower(callback) {
    var me = this;
    let power = me.netConsumptionPower;
    me.log.info('Device: %s %s, get net consumption Power successful: %s', me.host, me.name, power);
    callback(null, power);
  }
}

