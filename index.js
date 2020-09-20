'use strict';

const axios = require('axios').default;
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const inherits = require('util').inherits;
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

  //custom characteristic
  Characteristic.Power = function () {
    Characteristic.call(this, 'Power', Characteristic.Power.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kW',
      minValue: -100,
      maxValue: 100,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.Power, Characteristic);
  Characteristic.Power.UUID = '00000001-000B-1000-8000-0026BB765291';

  Characteristic.PowerMax = function () {
    Characteristic.call(this, 'Power Max', Characteristic.PowerMax.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kW',
      minValue: 0,
      maxValue: 100,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.PowerMax, Characteristic);
  Characteristic.PowerMax.UUID = '00000002-000B-1000-8000-0026BB765291';

  Characteristic.PowerMaxDetected = function () {
    Characteristic.call(this, 'Power Max Detected', Characteristic.PowerMaxDetected.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.PowerMaxDetected, Characteristic);
  Characteristic.PowerMaxDetected.UUID = '00000006-000B-1000-8000-0026BB765291';

  Characteristic.EnergyToday = function () {
    Characteristic.call(this, 'Energy Today', Characteristic.EnergyToday.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kWh',
      minValue: 0,
      maxValue: 1000000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.EnergyToday, Characteristic);
  Characteristic.EnergyToday.UUID = '00000003-000B-1000-8000-0026BB765291';

  Characteristic.EnergyLastSevenDays = function () {
    Characteristic.call(this, 'Energy Last 7 Days', Characteristic.EnergyLastSevenDays.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kWh',
      minValue: 0,
      maxValue: 1000000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.EnergyLastSevenDays, Characteristic);
  Characteristic.EnergyLastSevenDays.UUID = '00000004-000B-1000-8000-0026BB765291';

  Characteristic.EnergyLifetime = function () {
    Characteristic.call(this, 'Energy Lifetime', Characteristic.EnergyLifetime.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kWh',
      minValue: 0,
      maxValue: 1000000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.EnergyLifetime, Characteristic);
  Characteristic.EnergyLifetime.UUID = '00000005-000B-1000-8000-0026BB765291';

  //custom service
  Service.PowerMeter = function (displayName, subtype) {
    Service.call(this, displayName, Service.PowerMeter.UUID, subtype);
    this.addCharacteristic(Characteristic.Power);
    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.PowerMax);
    this.addOptionalCharacteristic(Characteristic.PowerMaxDetected);
    this.addOptionalCharacteristic(Characteristic.EnergyToday);
    this.addOptionalCharacteristic(Characteristic.EnergyLastSevenDays);
    this.addOptionalCharacteristic(Characteristic.EnergyLifetime);
    // Optional Characteristics standard
    this.addOptionalCharacteristic(Characteristic.StatusActive);
    this.addOptionalCharacteristic(Characteristic.StatusFault);
    this.addOptionalCharacteristic(Characteristic.StatusLowBattery);
    this.addOptionalCharacteristic(Characteristic.StatusTampered);
    this.addOptionalCharacteristic(Characteristic.Name);
  };
  inherits(Service.PowerMeter, Service);
  Service.PowerMeter.UUID = '00000001-000A-1000-8000-0026BB765291';

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

    this.api.on('didFinishLaunching', () => {
      this.log.debug('didFinishLaunching');
      for (let i = 0, len = this.devices.length; i < len; i++) {
        let deviceName = this.devices[i];
        if (!deviceName.name) {
          this.log.warn('Device Name Missing');
        } else {
          new envoyDevice(this.log, deviceName, this.api);
        }
      }
    });

  }

  configureAccessory(platformAccessory) {
    this.log.debug('configurePlatformAccessory');
  }

  removeAccessory(platformAccessory) {
    this.log.debug('removePlatformAccessory');
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [platformAccessory]);
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
    this.refreshInterval = config.refreshInterval || 10;
    this.enchargeStorage = config.enchargeStorage;
    this.powerProductionMeter = config.powerProductionMeter || 0;
    this.powerProductionMaxDetected = config.powerProductionMaxDetected;
    this.energyProductionLifetimeOffset = config.energyProductionLifetimeOffset || 0;
    this.powerConsumptionMeter = config.powerConsumptionMeter || 0;
    this.powerConsumptionTotalMaxDetected = config.powerConsumptionTotalMaxDetected;
    this.energyConsumptionTotalLifetimeOffset = config.energyConsumptionTotalLifetimeOffset || 0;
    this.powerConsumptionNetMaxDetected = config.powerConsumptionNetMaxDetected;
    this.energyConsumptionNetLifetimeOffset = config.energyConsumptionNetLifetimeOffset || 0;

    //get Device info
    this.manufacturer = config.manufacturer || 'Enphase';
    this.modelName = config.modelName || 'Envoy';
    this.serialNumber = config.serialNumber || 'Serial Number';
    this.firmwareRevision = config.firmwareRevision || 'Firmware Revision';

    //setup variables
    this.checkDeviceInfo = false;
    this.checkDeviceState = false;
    this.powerProductionMax = 0;
    this.powerProductionMaxDetectedState = 0;
    this.powerProduction = 0;
    this.energyProductionToday = 0;
    this.energyProductionLastSevenDays = 0;
    this.energyProductionLifetime = 0;
    this.powerConsumptionTotalMax = 0;
    this.powerConsumptionTotalMaxDetectedState = 0;
    this.powerConsumptionTotal = 0;
    this.energyConsumptionTotalToday = 0;
    this.energyConsumptionTotalLastSevenDays = 0;
    this.energyConsumptionTotalLifetime = 0;
    this.powerConsumptionNetMax = 0;
    this.powerConsumptionNetMaxDetectedState = 0;
    this.powerConsumptionNet = 0;
    this.energyConsumptionNetToday = 0;
    this.energyConsumptionNetLastSevenDays = 0;
    this.energyConsumptionNetLifetime = 0;
    this.powerEnchargeStorage = 0;
    this.energyEnchargeStorage = 0;
    this.prefDir = path.join(api.user.storagePath(), 'enphaseEnvoy');
    this.powerProductionMaxFile = this.prefDir + '/' + 'powerProductionMax_' + this.host.split('.').join('');
    this.powerConsumptionTotalMaxFile = this.prefDir + '/' + 'powerConsumptionTotalMax_' + this.host.split('.').join('');
    this.powerConsumptionNetMaxFile = this.prefDir + '/' + 'powerConsumptionNetMax_' + this.host.split('.').join('');
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

    //Check device state
    setInterval(function () {
      if (this.checkDeviceInfo) {
        this.getDeviceInfo();
      }
      if (this.checkDeviceState) {
        this.updateDeviceState();
      }
    }.bind(this), this.refreshInterval * 1000);

    this.prepareAccessory();
  }

  //Prepare accessory
  prepareAccessory() {
    this.log.debug('prepareAccessory');
    const accessoryName = this.name;
    const accessoryUUID = UUID.generate(accessoryName);
    const accessoryCategory = Categories.TV_SET_TOP_BOX;
    this.accessory = new Accessory(accessoryName, accessoryUUID, accessoryCategory);

    this.prepareInformationService();
    this.prepareEnvoyService();

    this.log.debug('Device: %s %s, publishExternalAccessories.', this.host, accessoryName);
    this.api.publishExternalAccessories(PLUGIN_NAME, [this.accessory]);
  }

  //Prepare information service
  prepareInformationService() {
    this.log.debug('prepareInformationService');
    this.getDeviceInfo();

    let manufacturer = this.manufacturer;
    let modelName = this.modelName;
    let serialNumber = this.serialNumber;
    let firmwareRevision = this.firmwareRevision;

    this.accessory.removeService(this.accessory.getService(Service.AccessoryInformation));
    const informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, manufacturer)
      .setCharacteristic(Characteristic.Model, modelName)
      .setCharacteristic(Characteristic.SerialNumber, serialNumber)
      .setCharacteristic(Characteristic.FirmwareRevision, firmwareRevision);

    this.accessory.addService(informationService);
  }

  //Prepare TV service 
  prepareEnvoyService() {
    this.log.debug('prepareEnvoyService');
    this.envoyServiceProduction = new Service.PowerMeter('Production', 'envoyServiceProduction');
    this.envoyServiceProduction.getCharacteristic(Characteristic.Power)
      .on('get', this.getPowerProduction.bind(this));
    this.envoyServiceProduction.getCharacteristic(Characteristic.PowerMax)
      .on('get', this.getPowerProductionMax.bind(this));
    this.envoyServiceProduction.getCharacteristic(Characteristic.PowerMaxDetected)
      .on('get', this.getPowerProductionMaxDetected.bind(this));

    if (this.powerProductionMeter == 1) {
      this.envoyServiceProduction.getCharacteristic(Characteristic.EnergyToday)
        .on('get', this.getEnergyProductionToday.bind(this));
      this.envoyServiceProduction.getCharacteristic(Characteristic.EnergyLastSevenDays)
        .on('get', this.getEnergyProductionLastSevenDays.bind(this));
    }

    this.envoyServiceProduction.getCharacteristic(Characteristic.EnergyLifetime)
      .on('get', this.getEnergyProductionLifetime.bind(this));
    this.accessory.addService(this.envoyServiceProduction);

    if (this.powerConsumptionMeter >= 1) {
      this.envoyServiceConsumptionTotal = new Service.PowerMeter('Consumption Total', 'envoyServiceConsumptionTotal');
      this.envoyServiceConsumptionTotal.getCharacteristic(Characteristic.Power)
        .on('get', this.getPowerConsumptionTotal.bind(this));
      this.envoyServiceConsumptionTotal.getCharacteristic(Characteristic.PowerMax)
        .on('get', this.getPowerConsumptionTotalMax.bind(this));
      this.envoyServiceConsumptionTotal.getCharacteristic(Characteristic.PowerMaxDetected)
        .on('get', this.getPowerConsumptionTotalMaxDetected.bind(this));
      this.envoyServiceConsumptionTotal.getCharacteristic(Characteristic.EnergyToday)
        .on('get', this.getEnergyConsumptionTotalToday.bind(this));
      this.envoyServiceConsumptionTotal.getCharacteristic(Characteristic.EnergyLastSevenDays)
        .on('get', this.getEnergyConsumptionTotalLastSevenDays.bind(this));
      this.envoyServiceConsumptionTotal.getCharacteristic(Characteristic.EnergyLifetime)
        .on('get', this.getEnergyConsumptionTotalLifetime.bind(this));
      this.accessory.addService(this.envoyServiceConsumptionTotal);

      this.envoyServiceConsumptionNet = new Service.PowerMeter('Consumption Net', 'envoyServiceConsumptionNet');
      this.envoyServiceConsumptionNet.getCharacteristic(Characteristic.Power)
        .on('get', this.getPowerConsumptionNet.bind(this));
      this.envoyServiceConsumptionNet.getCharacteristic(Characteristic.PowerMax)
        .on('get', this.getPowerConsumptionNetMax.bind(this));
      this.envoyServiceConsumptionNet.getCharacteristic(Characteristic.PowerMaxDetected)
        .on('get', this.getPowerConsumptionNetMaxDetected.bind(this));
      this.envoyServiceConsumptionNet.getCharacteristic(Characteristic.EnergyToday)
        .on('get', this.getEnergyConsumptionNetToday.bind(this));
      this.envoyServiceConsumptionNet.getCharacteristic(Characteristic.EnergyLastSevenDays)
        .on('get', this.getEnergyConsumptionNetLastSevenDays.bind(this));
      this.envoyServiceConsumptionNet.getCharacteristic(Characteristic.EnergyLifetime)
        .on('get', this.getEnergyConsumptionNetLifetime.bind(this));
      this.accessory.addService(this.envoyServiceConsumptionNet);
    }

    if (this.enchargeStorage) {
      this.envoyServiceEnchargeStorage = new Service.PowerMeter('Encharge storage', 'envoyServiceEnchargeStorage');
      this.envoyServiceEnchargeStorage.getCharacteristic(Characteristic.Power)
        .on('get', this.getPowerEnchargeStorage.bind(this));
      this.envoyServiceEnchargeStorage.getCharacteristic(Characteristic.EnergyToday)
        .on('get', this.getEnergyEnchargeStorage.bind(this));
      this.accessory.addService(this.envoyServiceEnchargeStorage);
    }
  }

  async getDeviceInfo() {
    var me = this;
    me.log.debug('Device: %s %s, requesting config information.', me.host, me.name);
    try {
      const [response, response1] = await axios.all([axios.get(me.url + '/production.json'), axios.get(me.url + '/info.xml')]);
      me.log.info('Device: %s %s, state: Online.', me.host, me.name);
      me.log.debug('Device %s %s, get device status data response %s response1: %s', me.host, me.name, response.data, response1.data);
      try {
        const result = await parseStringPromise(response1.data);
        me.log.debug('Device: %s %s, get Device info.xml successful: %s', me.host, me.name, JSON.stringify(result, null, 2));

        if (typeof result.envoy_info.device[0].sn[0] !== 'undefined') {
          var serialNumber = result.envoy_info.device[0].sn[0];
          me.serialNumber = serialNumber;
        } else {
          serialNumber = me.serialNumber;
        };
        if (typeof result.envoy_info.device[0].software[0] !== 'undefined') {
          var firmwareRevision = result.envoy_info.device[0].software[0];
          me.firmwareRevision = firmwareRevision;
        } else {
          firmwareRevision = me.firmwareRevision;
        };
        if (typeof response.data.production[0].activeCount !== 'undefined') {
          var inverters = response.data.production[0].activeCount;
        } else {
          inverters = 'Undefined';
        };
        me.log('-------- %s --------', me.name);
        me.log('Manufacturer: %s', me.manufacturer);
        me.log('Model: %s', me.modelName);
        me.log('Serialnr: %s', serialNumber);
        me.log('Firmware: %s', firmwareRevision);
        me.log('Inverters: %s', inverters);
        me.log('----------------------------------');
        me.updateDeviceState();
      } catch (error) {
        me.log.error('Device %s %s, getDeviceInfo parse string error: %s', me.host, me.name, error);
        me.checkDeviceInfo = true;
      };
    } catch (error) {
      me.log.error('Device: %s %s, getProduction eror: %s, state: Offline', me.host, me.name, error);
      me.checkDeviceInfo = true;
    };
  }

  async updateDeviceState() {
    var me = this;
    try {
      const response = await axios.get(me.url + '/production.json');
      me.log.debug('Device %s %s, get device status data: %s', me.host, me.name, response.data);

      //production
      let powerProduction = parseFloat(response.data.production[me.powerProductionMeter].wNow / 1000).toFixed(3);

      //save and read powerProductionMax
      try {
        var savedPowerProductionMax = await fsPromises.readFile(me.powerProductionMaxFile);
      } catch (error) {
        me.log.debug('Device: %s %s, powerProductionMaxFile file does not exist', me.host, me.name);
      }

      let powerProductionMax = me.powerProductionMax;
      if (savedPowerProductionMax) {
        powerProductionMax = savedPowerProductionMax;
      }

      if (powerProduction > powerProductionMax) {
        try {
          await fsPromises.writeFile(me.powerProductionMaxFile, powerProduction);
          me.log.debug('Device: %s %s, powerProductionMaxFile saved successful in: %s %s kW', me.host, me.name, me.prefDir, powerProduction);
        } catch (error) {
          me.log.error('Device: %s %s, could not write powerProductionMaxFile, error: %s', me.host, me.name, error);

        }
      }

      let powerProductionMaxDetectedState = (powerProduction >= me.powerProductionMaxDetected / 1000);
      me.powerProductionMax = powerProductionMax;
      me.powerProductionMaxDetectedState = powerProductionMaxDetectedState;

      let energyProductionLifetime = parseFloat((response.data.production[me.powerProductionMeter].whLifetime + me.energyProductionLifetimeOffset) / 1000).toFixed(3);
      me.log.debug('Device: %s %s, power production: %s kW', me.host, me.name, powerProduction);
      me.log.debug('Device: %s %s, power production max: %s kW', me.host, me.name, powerProductionMax);
      me.log.debug('Device: %s %s, power production max detected: %s', me.host, me.name, powerProductionMaxDetectedState ? 'Yes' : 'No');
      me.log.debug('Device: %s %s, energy production Lifetime: %s kWh', me.host, me.name, energyProductionLifetime);
      me.powerProduction = powerProduction;
      me.energyProductionLifetime = energyProductionLifetime;
      me.powerProductionMaxDetectedState = powerProductionMaxDetectedState;

      if (me.envoyServiceProduction) {
        me.envoyServiceProduction.updateCharacteristic(Characteristic.Power, powerProduction);
        me.envoyServiceProduction.updateCharacteristic(Characteristic.PowerMax, powerProductionMax);
        me.envoyServiceProduction.updateCharacteristic(Characteristic.PowerMaxDetected, powerProductionMaxDetectedState);
        me.envoyServiceProduction.updateCharacteristic(Characteristic.EnergyLifetime, energyProductionLifetime);
      }

      if (me.powerProductionMeter == 1) {
        let energyProductionToday = parseFloat(response.data.production[1].whToday / 1000).toFixed(3);
        let energyProductionLastSevenDays = parseFloat(response.data.production[1].whLastSevenDays / 1000).toFixed(3);
        me.log.debug('Device: %s %s, energy production Today: %s kWh', me.host, me.name, energyProductionToday);
        me.log.debug('Device: %s %s, energy production last 7 Days: %s kWh', me.host, me.name, energyProductionLastSevenDays);
        me.energyProductionToday = energyProductionToday;
        me.energyProductionLastSevenDays = energyProductionLastSevenDays;

        if (me.envoyServiceProduction) {
          me.envoyServiceProduction.updateCharacteristic(Characteristic.EnergyToday, energyProductionToday);
          me.envoyServiceProduction.updateCharacteristic(Characteristic.EnergyLastSevenDays, energyProductionLastSevenDays);
        }
      }

      //consumption
      if (me.powerConsumptionMeter >= 1) {
        //consumption total
        let powerConsumptionTotal = parseFloat(response.data.consumption[0].wNow / 1000).toFixed(3);

        //save and read powerConsumptionTotalMax
        try {
          var savedPowerConsumptionTotalMax = await fsPromises.readFile(me.powerConsumptionTotalMaxFile);
        } catch (error) {
          me.log.debug('Device: %s %s, powerConsumptionTotalMaxFile file does not exist', me.host, me.name);
        }

        let powerConsumptionTotalMax = me.powerConsumptionTotalMax;
        if (savedPowerConsumptionTotalMax) {
          powerConsumptionTotalMax = savedPowerConsumptionTotalMax;
        }

        if (powerConsumptionTotal > powerConsumptionTotalMax) {
          try {
            await fsPromises.writeFile(me.powerConsumptionTotalMaxFile, powerConsumptionTotal);
            me.log.debug('Device: %s %s, powerConsumptionTotalMaxFile saved successful in: %s %s kW', me.host, me.name, me.prefDir, powerConsumptionTotal);
          } catch (error) {
            me.log.error('Device: %s %s, could not write powerConsumptionTotalMaxFile, error: %s', me.host, me.name, error);
          }
        }

        let powerConsumptionTotalMaxDetectedState = (powerConsumptionTotal >= me.powerConsumptionTotalMaxDetected / 1000);
        me.powerConsumptionTotalMax = powerConsumptionTotalMax;
        me.powerConsumptionTotalMaxDetectedState = powerConsumptionTotalMaxDetectedState;

        let energyConsumptionTotalToday = parseFloat(response.data.consumption[0].whToday / 1000).toFixed(3);
        let energyConsumptionTotalLastSevenDays = parseFloat(response.data.consumption[0].whLastSevenDays / 1000).toFixed(3);
        let energyConsumptionTotalLifetime = parseFloat((response.data.consumption[0].whLifetime + me.energyConsumptionTotalLifetimeOffset) / 1000).toFixed(3);
        me.log.debug('Device: %s %s, total power consumption : %s kW', me.host, me.name, powerConsumptionTotal);
        me.log.debug('Device: %s %s, total power consumption max: %s kW', me.host, me.name, powerConsumptionTotalMax);
        me.log.debug('Device: %s %s, total power consumption max detected: %s', me.host, me.name, powerConsumptionTotalMaxDetectedState ? 'Yes' : 'No');
        me.log.debug('Device: %s %s, total energy consumption Today: %s kWh', me.host, me.name, energyConsumptionTotalToday);
        me.log.debug('Device: %s %s, total energy consumption last 7 Days: %s kWh', me.host, me.name, energyConsumptionTotalLastSevenDays);
        me.log.debug('Device: %s %s, total energy consumption Lifetime: %s kWh', me.host, me.name, energyConsumptionTotalLifetime);
        me.powerConsumptionTotal = powerConsumptionTotal;
        me.energyConsumptionTotalToday = energyConsumptionTotalToday;
        me.energyConsumptionTotalLastSevenDays = energyConsumptionTotalLastSevenDays;
        me.energyConsumptionTotalLifetime = energyConsumptionTotalLifetime;
        me.powerConsumptionTotalMaxDetectedState = powerConsumptionTotalMaxDetectedState;

        if (me.envoyServiceConsumptionTotal) {
          me.envoyServiceConsumptionTotal.updateCharacteristic(Characteristic.Power, powerConsumptionTotal);
          me.envoyServiceConsumptionTotal.updateCharacteristic(Characteristic.PowerMax, powerConsumptionTotalMax);
          me.envoyServiceConsumptionTotal.updateCharacteristic(Characteristic.PowerMaxDetected, powerConsumptionTotalMaxDetectedState);
          me.envoyServiceConsumptionTotal.updateCharacteristic(Characteristic.EnergyToday, energyConsumptionTotalToday);
          me.envoyServiceConsumptionTotal.updateCharacteristic(Characteristic.EnergyLastSevenDays, energyConsumptionTotalLastSevenDays);
          me.envoyServiceConsumptionTotal.updateCharacteristic(Characteristic.EnergyLifetime, energyConsumptionTotalLifetime);
        }

        //consumption net
        let powerConsumptionNet = parseFloat(response.data.consumption[1].wNow / 1000).toFixed(3);

        //save and read powerConsumptionNetMax
        try {
          var savedPowerConsumptionNetMax = await fsPromises.readFile(me.powerConsumptionNetMaxFile);
        } catch (error) {
          me.log.debug('Device: %s %s, powerConsumptionNetMaxFile file does not exist', me.host, me.name);
        }

        let powerConsumptionNetMax = me.powerConsumptionNetMax;
        if (savedPowerConsumptionNetMax) {
          powerConsumptionNetMax = savedPowerConsumptionNetMax;
        }

        if (powerConsumptionNet > powerConsumptionNetMax) {
          try {
            await fsPromises.writeFile(me.powerConsumptionNetMaxFile, powerConsumptionNet);
            me.log.debug('Device: %s %s, powerConsumptionNetMaxFile saved successful in: %s %s kW', me.host, me.name, me.prefDir, powerConsumptionNet);
          } catch (error) {
            me.log.error('Device: %s %s, could not write powerConsumptionNetMaxFile, error: %s', me.host, me.name, error);
          }
        }

        let powerConsumptionNetMaxDetectedState = (powerConsumptionNet >= me.powerConsumptionNetMaxDetected / 1000);
        me.powerConsumptionNetMax = powerConsumptionNetMax;
        me.powerConsumptionNetMaxDetectedState = powerConsumptionNetMaxDetectedState;

        let energyConsumptionNetToday = parseFloat(response.data.consumption[1].whToday / 1000).toFixed(3);
        let energyConsumptionNetLastSevenDays = parseFloat(response.data.consumption[1].whLastSevenDays / 1000).toFixed(3);
        let energyConsumptionNetLifetime = parseFloat((response.data.consumption[1].whLifetime + me.energyConsumptionNetLifetimeOffset) / 1000).toFixed(3);
        me.log.debug('Device: %s %s, net power consumption: %s kW', me.host, me.name, powerConsumptionNet);
        me.log.debug('Device: %s %s, net power consumption max: %s kW', me.host, me.name, powerConsumptionNetMax);
        me.log.debug('Device: %s %s, net power consumption max detected: %s', me.host, me.name, powerConsumptionNetMaxDetectedState ? 'Yes' : 'No');
        me.log.debug('Device: %s %s, net energy consumption Today: %s kWh', me.host, me.name, energyConsumptionNetToday);
        me.log.debug('Device: %s %s, net energy consumption last 7 Days: %s kWh', me.host, me.name, energyConsumptionNetLastSevenDays);
        me.log.debug('Device: %s %s, net energy consumption Lifetime: %s kWh', me.host, me.name, energyConsumptionNetLifetime);
        me.powerConsumptionNet = powerConsumptionNet;
        me.energyConsumptionNetToday = energyConsumptionNetToday;
        me.energyConsumptionNetLastSevenDays = energyConsumptionNetLastSevenDays;
        me.energyConsumptionNetLifetime = energyConsumptionNetLifetime;
        me.powerConsumptionNetMaxDetectedState = powerConsumptionNetMaxDetectedState;

        if (me.envoyServiceConsumptionNet) {
          me.envoyServiceConsumptionNet.updateCharacteristic(Characteristic.Power, powerConsumptionNet);
          me.envoyServiceConsumptionNet.updateCharacteristic(Characteristic.PowerMax, powerConsumptionNetMax);
          me.envoyServiceConsumptionNet.updateCharacteristic(Characteristic.PowerMaxDetected, powerConsumptionNetMaxDetectedState);
          me.envoyServiceConsumptionNet.updateCharacteristic(Characteristic.EnergyToday, energyConsumptionNetToday);
          me.envoyServiceConsumptionNet.updateCharacteristic(Characteristic.EnergyLastSevenDays, energyConsumptionNetLastSevenDays);
          me.envoyServiceConsumptionNet.updateCharacteristic(Characteristic.EnergyLifetime, energyConsumptionNetLifetime);
        }
      }
      if (me.enchargeStorage) {
        let powerEnchargeStorage = parseFloat(response.data.storage[0].wNow / 1000).toFixed(3);
        let energyEnchargeStorage = parseFloat(response.data.storage[0].whNow / 1000).toFixed(3);
        me.log.debug('Device: %s %s, encharge storage power: %s kW', me.host, me.name, powerEnchargeStorage);
        me.log.debug('Device: %s %s, encharge storage energy: %s kWh', me.host, me.name, energyEnchargeStorage);
        me.powerEnchargeStorage = powerEnchargeStorage;
        me.energyEnchargeStorage = energyEnchargeStorage;

        if (me.envoyServiceEnchargeStorage) {
          me.envoyServiceEnchargeStorage.updateCharacteristic(Characteristic.Power, powerEnchargeStorage);
          me.envoyServiceEnchargeStorage.updateCharacteristic(Characteristic.EnergyToday, energyEnchargeStorage);
        }
      }
      me.checkDeviceState = true;
    } catch (error) {
      me.log.error('Device: %s %s, update Device state error: %s, state: Offline', me.host, me.name, error);
    }
  }

  //production power
  getPowerProduction(callback) {
    var me = this;
    let wNow = me.powerProduction;
    me.log.info('Device: %s %s, power production: %s kW', me.host, me.name, wNow);
    callback(null, wNow);
  }

  getPowerProductionMax(callback) {
    var me = this;
    let wNow = me.powerProductionMax;
    me.log.info('Device: %s %s, power production max: %s kW', me.host, me.name, wNow);
    callback(null, wNow);
  }

  getPowerProductionMaxDetected(callback) {
    var me = this;
    let status = me.powerProductionMaxDetectedState;
    me.log.info('Device: %s %s, power production max detected: %s', me.host, me.name, status ? 'Yes' : 'No');
    callback(null, status);
  }

  getEnergyProductionToday(callback) {
    var me = this;
    let whToday = me.energyProductionToday;
    me.log.info('Device: %s %s, energy production Today: %s kWh', me.host, me.name, whToday);
    callback(null, whToday);
  }

  getEnergyProductionLastSevenDays(callback) {
    var me = this;
    let whLastSevenDays = me.energyProductionLastSevenDays;
    me.log.info('Device: %s %s, energy production Last Seven Days: %s kWh', me.host, me.name, whLastSevenDays);
    callback(null, whLastSevenDays);
  }

  getEnergyProductionLifetime(callback) {
    var me = this;
    let whLifetime = me.energyProductionLifetime;
    me.log.info('Device: %s %s, energy production Lifetime: %s kWh', me.host, me.name, whLifetime);
    callback(null, whLifetime);
  }

  //total consumption
  getPowerConsumptionTotal(callback) {
    var me = this;
    let wNow = me.powerConsumptionTotal;
    me.log.info('Device: %s %s, power consumption total: %s kW', me.host, me.name, wNow);
    callback(null, wNow);
  }

  getPowerConsumptionTotalMax(callback) {
    var me = this;
    let wNow = me.powerConsumptionTotalMax;
    me.log.info('Device: %s %s, power consumption total max: %s kW', me.host, me.name, wNow);
    callback(null, wNow);
  }

  getPowerConsumptionTotalMaxDetected(callback) {
    var me = this;
    let status = me.powerConsumptionTotalMaxDetectedState;
    me.log.info('Device: %s %s, power consumption total max detected: %s', me.host, me.name, status ? 'Yes' : 'No');
    callback(null, status);
  }

  getEnergyConsumptionTotalToday(callback) {
    var me = this;
    let whToday = me.energyConsumptionTotalToday;
    me.log.info('Device: %s %s, energy consumption total Today: %s kWh', me.host, me.name, whToday);
    callback(null, whToday);
  }

  getEnergyConsumptionTotalLastSevenDays(callback) {
    var me = this;
    let whLastSevenDays = me.energyConsumptionTotalLastSevenDays;
    me.log.info('Device: %s %s, energy consumption total Last Seven Days: %s kWh', me.host, me.name, whLastSevenDays);
    callback(null, whLastSevenDays);
  }

  getEnergyConsumptionTotalLifetime(callback) {
    var me = this;
    let whLifetime = me.energyConsumptionTotalLifetime;
    me.log.info('Device: %s %s, energy consumption total Lifetime: %s kWh', me.host, me.name, whLifetime);
    callback(null, whLifetime);
  }

  //net consumption power
  getPowerConsumptionNet(callback) {
    var me = this;
    let wNow = me.powerConsumptionNet;
    me.log.info('Device: %s %s, power consumption net: %s kW', me.host, me.name, wNow);
    callback(null, wNow);
  }

  getPowerConsumptionNetMax(callback) {
    var me = this;
    let wNow = me.powerConsumptionNetMax;
    me.log.info('Device: %s %s, power consumption net max: %s kW', me.host, me.name, wNow);
    callback(null, wNow);
  }

  getPowerConsumptionNetMaxDetected(callback) {
    var me = this;
    let status = me.powerConsumptionNetMaxDetectedState;
    me.log.info('Device: %s %s, power consumption net max detected: %s', me.host, me.name, status ? 'Yes' : 'No');
    callback(null, status);
  }

  getEnergyConsumptionNetToday(callback) {
    var me = this;
    let whToday = me.energyConsumptionNetToday;
    me.log.info('Device: %s %s, energy consumption net Today: %s kWh', me.host, me.name, whToday);
    callback(null, whToday);
  }

  getEnergyConsumptionNetLastSevenDays(callback) {
    var me = this;
    let whLastSevenDays = me.energyConsumptionNetLastSevenDays;
    me.log.info('Device: %s %s, energy consumption net Last Seven Days: %s kWh', me.host, me.name, whLastSevenDays);
    callback(null, whLastSevenDays);
  }

  getEnergyConsumptionNetLifetime(callback) {
    var me = this;
    let whLifetime = me.energyConsumptionNetLifetime;
    me.log.info('Device: %s %s, energy consumption net Lifetime: %s kWh', me.host, me.name, whLifetime);
    callback(null, whLifetime);
  }

  //encharge storage
  getPowerEnchargeStorage(callback) {
    var me = this;
    let wNow = me.powerEnchargeStorage;
    me.log.info('Device: %s %s, power encharge storage: %s kW', me.host, me.name, wNow);
    callback(null, wNow);
  }

  getEnergyEnchargeStorage(callback) {
    var me = this;
    let whNow = me.energyEnchargeStorage;
    me.log.info('Device: %s %s, energy encharge storage: %s kWh', me.host, me.name, whNow);
    callback(null, whNow);
  }
}

