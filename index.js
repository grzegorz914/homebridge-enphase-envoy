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
          this.log.warn('Device Name Missing');
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
    this.productionPowerMeter = config.productionPowerMeter || 0;
    this.maxPowerProductionDetected = config.maxPowerProductionDetected;
    this.consumptionPowerMeter = config.consumptionPowerMeter || 0;
    this.maxTotalPowerConsumptionDetected = config.maxTotalPowerConsumptionDetected;
    this.maxNetPowerConsumptionDetected = config.maxNetPowerConsumptionDetected;

    //get Device info
    this.manufacturer = config.manufacturer || 'Enphase';
    this.modelName = config.modelName || 'Envoy-S';
    this.serialNumber = config.serialNumber || 'SN0000005';
    this.firmwareRevision = config.firmwareRevision || 'FW0000005';

    //setup variables
    this.checkDeviceInfo = false;
    this.checkDeviceState = false;
    this.maxPowerProduction = 0;
    this.maxPowerProductionDetectedState = 0;
    this.productionwNow = 0;
    this.productionwhToday = 0;
    this.productionwhLastSevenDays = 0;
    this.productionwhLifetime = 0;
    this.maxTotalPowerConsumption = 0;
    this.maxTotalPowerConsumptionDetectedState = 0;
    this.totalConsumptionwNow = 0;
    this.totalConsumptionwhToday = 0;
    this.totalConsumptionwhLastSevenDays = 0;
    this.totalConsumptionwhLifetime = 0;
    this.maxNetPowerConsumption = 0;
    this.maxNetPowerConsumptionDetectedState = 0;
    this.netConsumptionwNow = 0;
    this.netConsumptionwhToday = 0;
    this.netConsumptionwhLastSevenDays = 0;
    this.netConsumptionwhLifetime = 0;
    this.prefDir = path.join(api.user.storagePath(), 'enphaseEnvoy');
    this.maxPowerProductionFile = this.prefDir + '/' + 'maxPowerProduction_' + this.host.split('.').join('');
    this.maxTotalPowerConsumptionFile = this.prefDir + '/' + 'maxTotalPowerConsumption_' + this.host.split('.').join('');
    this.maxNetPowerConsumptionFile = this.prefDir + '/' + 'maxNetPowerConsumption_' + this.host.split('.').join('');
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

    this.prepareEnvoyService();
  }

  //Prepare TV service 
  prepareEnvoyService() {
    this.log.debug('prepareEnvoyService');
    const accessoryName = this.name;
    const accessoryUUID = UUID.generate(accessoryName);
    this.accessory = new Accessory(accessoryName, accessoryUUID);
    this.accessory.category = Categories.SENSOR;

    this.accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.modelName)
      .setCharacteristic(Characteristic.SerialNumber, this.serialNumber)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmwareRevision);

    this.envoyServicePowerProduction = new Service.CarbonDioxideSensor('Product. Watt', 'envoyServicePowerProduction');
    this.envoyServicePowerProduction.getCharacteristic(Characteristic.CarbonDioxideDetected)
      .on('get', this.getMaxPowerProductionDetected.bind(this));

    this.envoyServicePowerProduction.getCharacteristic(Characteristic.CarbonDioxideLevel)
      .setProps({
        minValue: -100000,
        maxValue: 100000
      })
      .on('get', this.getPowerProduction.bind(this));

    this.envoyServicePowerProduction.getCharacteristic(Characteristic.CarbonDioxidePeakLevel)
      .on('get', this.getMaxPowerProduction.bind(this));

    this.accessory.addService(this.envoyServicePowerProduction);

    this.envoyServiceEnergyProductionLifetime = new Service.CarbonDioxideSensor('Produkt. Lifetime kWh', 'envoyServiceEnergyProductionLifetime');
    this.envoyServiceEnergyProductionLifetime.getCharacteristic(Characteristic.CarbonDioxideDetected)
      .on('get', this.getMaxEnergyProductionLifetimeDetected.bind(this));

    this.envoyServiceEnergyProductionLifetime.getCharacteristic(Characteristic.CarbonDioxideLevel)
      .on('get', this.getEnergyProductionLifetime.bind(this));

    this.accessory.addService(this.envoyServiceEnergyProductionLifetime);

    if (this.productionPowerMeter == 1) {
      this.envoyServiceEnergyProductionToday = new Service.CarbonDioxideSensor('Produkt. Today Wh', 'envoyServiceEnergyProductionToday');
      this.envoyServiceEnergyProductionToday.getCharacteristic(Characteristic.CarbonDioxideDetected)
        .on('get', this.getMaxEnergyProductionTodayDetected.bind(this));

      this.envoyServiceEnergyProductionToday.getCharacteristic(Characteristic.CarbonDioxideLevel)
        .on('get', this.getEnergyProductionToday.bind(this));

      this.accessory.addService(this.envoyServiceEnergyProductionToday);

      this.envoyServiceEnergyProductionLastSevenDays = new Service.CarbonDioxideSensor('Produkt. 7D kWh', 'envoyServiceEnergyProductionLastSevenDays');
      this.envoyServiceEnergyProductionLastSevenDays.getCharacteristic(Characteristic.CarbonDioxideDetected)
        .on('get', this.getMaxEnergyProductionLastSevenDaysDetected.bind(this));

      this.envoyServiceEnergyProductionLastSevenDays.getCharacteristic(Characteristic.CarbonDioxideLevel)
        .on('get', this.getEnergyProductionLastSevenDays.bind(this));

      this.accessory.addService(this.envoyServiceEnergyProductionLastSevenDays);
    }

    if (this.consumptionPowerMeter >= 1) {
      this.envoyServiceTotalPowerConsumption = new Service.CarbonDioxideSensor('Consumpt. Total Watt', 'envoyServiceTotalPowerConsumption');
      this.envoyServiceTotalPowerConsumption.getCharacteristic(Characteristic.CarbonDioxideDetected)
        .on('get', this.getMaxTotalPowerConsumptionDetected.bind(this));

      this.envoyServiceTotalPowerConsumption.getCharacteristic(Characteristic.CarbonDioxideLevel)
        .setProps({
          minValue: -100000,
          maxValue: 100000
        })
        .on('get', this.getTotalPowerConsumption.bind(this));

      this.envoyServiceTotalPowerConsumption.getCharacteristic(Characteristic.CarbonDioxidePeakLevel)
        .on('get', this.getMaxTotalPowerConsumption.bind(this));

      this.accessory.addService(this.envoyServiceTotalPowerConsumption);
    }

    if (this.consumptionPowerMeter >= 2) {
      this.envoyServiceNetPowerConsumption = new Service.CarbonDioxideSensor('Consumpt. Net Watt', 'envoyServiceNetPowerConsumption');
      this.envoyServiceNetPowerConsumption.getCharacteristic(Characteristic.CarbonDioxideDetected)
        .on('get', this.getMaxNetPowerConsumptionDetected.bind(this));

      this.envoyServiceNetPowerConsumption.getCharacteristic(Characteristic.CarbonDioxideLevel)
        .setProps({
          minValue: -100000,
          maxValue: 100000
        })
        .on('get', this.getNetPowerConsumption.bind(this));

      this.envoyServiceNetPowerConsumption.getCharacteristic(Characteristic.CarbonDioxidePeakLevel)
        .on('get', this.getMaxNetPowerConsumption.bind(this));

      this.accessory.addService(this.envoyServiceNetPowerConsumption);

      this.envoyServiceEnergyConsumptionLifetime = new Service.CarbonDioxideSensor('Consumpt. Lifetime kWh', 'envoyServiceEnergyConsumptionLifetime');
      this.envoyServiceEnergyConsumptionLifetime.getCharacteristic(Characteristic.CarbonDioxideDetected)
        .on('get', this.getMaxEnergyConsumptionLifetimeDetected.bind(this));

      this.envoyServiceEnergyConsumptionLifetime.getCharacteristic(Characteristic.CarbonDioxideLevel)
        .on('get', this.getEnergyConsumptionLifetime.bind(this));

      this.accessory.addService(this.envoyServiceEnergyConsumptionLifetime);

      this.envoyServiceEnergyConsumptionToday = new Service.CarbonDioxideSensor('Consumpt. Today Wh', 'envoyServiceEnergyConsumptionToday');
      this.envoyServiceEnergyConsumptionToday.getCharacteristic(Characteristic.CarbonDioxideDetected)
        .on('get', this.getMaxEnergyConsumptionTodayDetected.bind(this));

      this.envoyServiceEnergyConsumptionToday.getCharacteristic(Characteristic.CarbonDioxideLevel)
        .on('get', this.getEnergyConsumptionToday.bind(this));

      this.accessory.addService(this.envoyServiceEnergyConsumptionToday);

      this.envoyServiceEnergyConsumptionLastSevenDays = new Service.CarbonDioxideSensor('Consumpt. 7D kWh', 'envoyServiceEnergyConsumptionLastSevenDays');
      this.envoyServiceEnergyConsumptionLastSevenDays.getCharacteristic(Characteristic.CarbonDioxideDetected)
        .on('get', this.getMaxEnergyConsumptionLastSevenDaysDetected.bind(this));

      this.envoyServiceEnergyConsumptionLastSevenDays.getCharacteristic(Characteristic.CarbonDioxideLevel)
        .on('get', this.getEnergyConsumptionLastSevenDays.bind(this));

      this.accessory.addService(this.envoyServiceEnergyConsumptionLastSevenDays);
    }

    this.checkDeviceInfo = true;

    this.log.debug('Device: %s %s, publishExternalAccessories.', this.host, accessoryName);
    this.api.publishExternalAccessories(PLUGIN_NAME, [this.accessory]);
  }

  getDeviceInfo() {
    var me = this;
    me.log.debug('Device: %s %s, requesting config information.', me.host, me.name);
    axios.get(me.url + '/production.json').then(response => {
      me.log.info('Device: %s %s, state: Online.', me.host, me.name);
      me.log.debug('Device %s %s, get device status data: %s', me.host, me.name, response.data);
      me.inverters = response.data.production[0].activeCount;
      axios.get(me.url + '/info.xml').then(response => {
        parseStringPromise(response.data).then(result => {
          me.log.debug('Device: %s %s, get Device info successful: %s', me.host, me.name, JSON.stringify(result, null, 2));
          let serialNumber = result.envoy_info.device[0].sn[0];
          let firmware = result.envoy_info.device[0].software[0];
          let inverters = me.inverters
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
      me.checkDeviceInfo = false;
      me.checkDeviceState = true;
    }).catch(error => {
      me.log.error('Device: %s %s, getProduction eror: %s, state: Offline', me.host, me.name, error);
      me.checkDeviceInfo = true;
      me.checkDeviceState = false;
    });
  }

  updateDeviceState() {
    var me = this;
    axios.get(me.url + '/production.json').then(response => {
      me.log.debug('Device %s %s, get device status data: %s', me.host, me.name, response.data);
      let result = response.data;
      me.log.debug(result);

      //production
      let productionwNow = parseFloat(result.production[me.productionPowerMeter].wNow / 1000).toFixed(3);

      //save and read maxPowerProduction
      let savedMaxPowerProduction;
      try {
        savedMaxPowerProduction = fs.readFileSync(me.maxPowerProductionFile);
      } catch (error) {
        me.log.debug('Device: %s %s, maxPowerProductionFile file does not exist', me.host, me.name);
      }

      let maxPowerProduction = me.maxPowerProduction;
      if (savedMaxPowerProduction) {
        maxPowerProduction = savedMaxPowerProduction;
      }

      if (productionwNow > maxPowerProduction) {
        fs.writeFile(me.maxPowerProductionFile, (productionwNow), (error) => {
          if (error) {
            me.log.error('Device: %s %s, could not write maxPowerProductionFile, error: %s', me.host, me.name, error);
          } else {
            me.log.debug('Device: %s %s, maxPowerProductionFile saved successful in: %s %s kW', me.host, me.name, me.prefDir, productionwNow);
          }
        });
      }

      let maxPowerProductionDetectedState = 0;
      if (productionwNow >= me.maxPowerProductionDetected / 1000) {
        maxPowerProductionDetectedState = 1;
      }
      me.maxPowerProduction = maxPowerProduction;
      me.maxPowerProductionDetectedState = maxPowerProductionDetectedState;

      if (me.envoyServicePowerProduction) {
        me.envoyServicePowerProduction.updateCharacteristic(Characteristic.CarbonDioxideDetected, maxPowerProductionDetectedState);
        me.envoyServicePowerProduction.updateCharacteristic(Characteristic.CarbonDioxideLevel, productionwNow * 1000);
        me.envoyServicePowerProduction.updateCharacteristic(Characteristic.CarbonDioxidePeakLevel, maxPowerProduction * 1000);
      }

      let productionwhLifetime = parseFloat(result.production[me.productionPowerMeter].whLifetime / 1000).toFixed(3);
      me.log.debug('Device: %s %s, max power production: %s kW', me.host, me.name, maxPowerProduction);
      me.log.debug('Device: %s %s, max power detected: %s', me.host, me.name, maxPowerProductionDetectedState ? 'Yes' : 'No');
      me.log.debug('Device: %s %s, power production: %s kW', me.host, me.name, productionwNow);
      me.log.debug('Device: %s %s, energy production Lifetime: %s kWh', me.host, me.name, productionwhLifetime);
      me.productionwNow = productionwNow;
      me.productionwhLifetime = productionwhLifetime;

      if (me.envoyServiceEnergyProductionLifetime) {
        me.envoyServiceEnergyProductionLifetime.updateCharacteristic(Characteristic.CarbonDioxideLevel, productionwhLifetime);
      }

      if (me.productionPowerMeter == 1) {
        let productionwhToday = parseFloat(result.production[1].whToday / 1000).toFixed(3);
        let productionwhLastSevenDays = parseFloat(result.production[1].whLastSevenDays / 1000).toFixed(3);
        me.log.debug('Device: %s %s, energy production Today: %s kWh', me.host, me.name, productionwhToday);
        me.log.debug('Device: %s %s, energy production last seven Days: %s kWh', me.host, me.name, Math.ceil(productionwhLastSevenDays));
        me.productionwhToday = productionwhToday;
        me.productionwhLastSevenDays = productionwhLastSevenDays;

        if (me.envoyServiceEnergyProductionToday) {
          me.envoyServiceEnergyProductionToday.updateCharacteristic(Characteristic.CarbonDioxideLevel, productionwhToday * 1000);
        }
        if (me.envoyServiceEnergyProductionLastSevenDays) {
          me.envoyServiceEnergyProductionLastSevenDays.updateCharacteristic(Characteristic.CarbonDioxideLevel, Math.ceil(productionwhLastSevenDays));
        }
      }

      //consumption
      if (me.consumptionPowerMeter >= 1) {
        let totalConsumptionwNow = parseFloat(result.consumption[0].wNow / 1000).toFixed(3);

        //save and read maxTotalPowerConsumption
        let savedMaxTotalPowerConsumption;
        try {
          savedMaxTotalPowerConsumption = fs.readFileSync(me.maxTotalPowerConsumptionFile);
        } catch (error) {
          me.log.debug('Device: %s %s, maxTotalPowerConsumptionFile file does not exist', me.host, me.name);
        }

        let maxTotalPowerConsumption = me.maxTotalPowerConsumption;
        if (savedMaxTotalPowerConsumption) {
          maxTotalPowerConsumption = savedMaxTotalPowerConsumption;
        }

        if (totalConsumptionwNow > maxTotalPowerConsumption) {
          fs.writeFile(me.maxTotalPowerConsumptionFile, (totalConsumptionwNow), (error) => {
            if (error) {
              me.log.error('Device: %s %s, could not write maxTotalPowerConsumptionFile, error: %s', me.host, me.name, error);
            } else {
              me.log.debug('Device: %s %s, maxTotalPowerConsumptionFile saved successful in: %s %s kW', me.host, me.name, me.prefDir, totalConsumptionwNow);
            }
          });
        }

        let maxTotalPowerConsumptionDetectedState = 0;
        if (totalConsumptionwNow >= me.maxTotalPowerConsumptionDetected / 1000) {
          maxTotalPowerConsumptionDetectedState = 1;
        }
        me.maxTotalPowerConsumption = maxTotalPowerConsumption;
        me.maxTotalPowerConsumptionDetectedState = maxTotalPowerConsumptionDetectedState;

        if (me.envoyServiceTotalPowerConsumption) {
          me.envoyServiceTotalPowerConsumption.updateCharacteristic(Characteristic.CarbonDioxideDetected, maxTotalPowerConsumptionDetectedState);
          me.envoyServiceTotalPowerConsumption.updateCharacteristic(Characteristic.CarbonDioxideLevel, totalConsumptionwNow * 1000);
          me.envoyServiceTotalPowerConsumption.updateCharacteristic(Characteristic.CarbonDioxidePeakLevel, maxTotalPowerConsumption * 1000);
        }

        let totalConsumptionwhLifetime = parseFloat(result.consumption[0].whLifetime / 1000).toFixed(3);
        let totalConsumptionwhToday = parseFloat(result.consumption[0].whToday / 1000).toFixed(3);
        let totalConsumptionwhLastSevenDays = parseFloat(result.consumption[0].whLastSevenDays / 1000).toFixed(3);
        me.log.debug('Device: %s %s, total power consumption : %s kW', me.host, me.name, totalConsumptionwNow);
        me.log.debug('Device: %s %s, total energy consumption Lifetime: %s kWh', me.host, me.name, totalConsumptionwhLifetime);
        me.log.debug('Device: %s %s, total energy consumption Today: %s kWh', me.host, me.name, totalConsumptionwhToday);
        me.log.debug('Device: %s %s, total energy consumption last seven Days: %s kWh', me.host, me.name, totalConsumptionwhLastSevenDays);
        me.totalConsumptionwNow = totalConsumptionwNow;
        me.totalConsumptionwhLifetime = totalConsumptionwhLifetime;
        me.totalConsumptionwhToday = totalConsumptionwhToday;
        me.totalConsumptionwhLastSevenDays = totalConsumptionwhLastSevenDays;

        if (me.envoyServiceEnergyConsumptionLifetime) {
          me.envoyServiceEnergyConsumptionLifetime.updateCharacteristic(Characteristic.CarbonDioxideLevel, Math.ceil(totalConsumptionwhLifetime));
        }
        if (me.envoyServiceEnergyConsumptionToday) {
          me.envoyServiceEnergyConsumptionToday.updateCharacteristic(Characteristic.CarbonDioxideLevel, totalConsumptionwhToday * 1000);
        }
        if (me.envoyServiceEnergyConsumptionLastSevenDays) {
          me.envoyServiceEnergyConsumptionLastSevenDays.updateCharacteristic(Characteristic.CarbonDioxideLevel, Math.ceil(totalConsumptionwhLastSevenDays));
        }
      }

      if (me.consumptionPowerMeter >= 2) {
        let netConsumptionwNow = parseFloat(result.consumption[1].wNow / 1000).toFixed(3);

        //save and read maxTotalPowerConsumption
        let savedMaxNetPowerConsumption;
        try {
          savedMaxNetPowerConsumption = fs.readFileSync(me.maxNetPowerConsumptionFile);
        } catch (error) {
          me.log.debug('Device: %s %s, maxNetPowerConsumptionFile file does not exist', me.host, me.name);
        }

        let maxNetPowerConsumption = me.maxNetPowerConsumption;
        if (savedMaxNetPowerConsumption) {
          maxNetPowerConsumption = savedMaxNetPowerConsumption;
        }

        if (netConsumptionwNow > maxNetPowerConsumption) {
          fs.writeFile(me.maxNetPowerConsumptionFile, (netConsumptionwNow), (error) => {
            if (error) {
              me.log.error('Device: %s %s, could not write maxNetPowerConsumptionFile, error: %s', me.host, me.name, error);
            } else {
              me.log.debug('Device: %s %s, maxNetPowerConsumptionFile saved successful in: %s %s kW', me.host, me.name, me.prefDir, netConsumptionwNow);
            }
          });
        }

        let maxNetPowerConsumptionDetectedState = 0;
        if (netConsumptionwNow >= me.maxNetPowerConsumptionDetected / 1000) {
          maxNetPowerConsumptionDetectedState = 1;
        }
        me.maxNetPowerConsumption = maxNetPowerConsumption;
        me.maxNetPowerConsumptionDetectedState = maxNetPowerConsumptionDetectedState;

        if (me.envoyServiceNetPowerConsumption) {
          me.envoyServiceNetPowerConsumption.updateCharacteristic(Characteristic.CarbonDioxideDetected, maxNetPowerConsumptionDetectedState);
          me.envoyServiceNetPowerConsumption.updateCharacteristic(Characteristic.CarbonDioxideLevel, netConsumptionwNow * 1000);
          me.envoyServiceNetPowerConsumption.updateCharacteristic(Characteristic.CarbonDioxidePeakLevel, maxNetPowerConsumption * 1000);
        }

        let netConsumptionwhToday = parseFloat(result.consumption[1].whToday / 1000).toFixed(3);
        let netConsumptionwhLastSevenDays = parseFloat(result.consumption[1].whLastSevenDays / 1000).toFixed(3);
        let netConsumptionwhLifetime = parseFloat(result.consumption[1].whLifetime / 1000).toFixed(3);
        me.log.debug('Device: %s %s, net power consumption: %s kW', me.host, me.name, netConsumptionwNow);
        me.log.debug('Device: %s %s, net energy consumption Lifetime: %s kWh', me.host, me.name, netConsumptionwhLifetime);
        me.log.debug('Device: %s %s, net energy consumption Today: %s kWh', me.host, me.name, netConsumptionwhToday);
        me.log.debug('Device: %s %s, net energy consumption last seven Days: %s kWh', me.host, me.name, netConsumptionwhLastSevenDays);
        me.netConsumptionwNow = netConsumptionwNow;
        me.netConsumptionwhToday = netConsumptionwhToday;
        me.netConsumptionwhLastSevenDays = netConsumptionwhLastSevenDays;
        me.netConsumptionwhLifetime = netConsumptionwhLifetime;
      }
    }).catch(error => {
      me.log.error('Device: %s %s, update Device state error: %s, state: Offline', me.host, me.name, error);
    });
  }

  //production power
  getMaxPowerProductionDetected(callback) {
    var me = this;
    let state = me.maxPowerDetectedState;
    me.log.info('Device: %s %s, max power production detected: %s', me.host, me.name, state ? 'Yes' : 'No');
    callback(null, state);
  }

  getMaxPowerProduction(callback) {
    var me = this;
    let power = me.maxPowerProduction;
    me.log.info('Device: %s %s, max power production: %s kW', me.host, me.name, power);
    callback(null, power * 1000);
  }

  getPowerProduction(callback) {
    var me = this;
    let wNow = me.productionwNow;
    me.log.info('Device: %s %s, power production: %s kW', me.host, me.name, wNow);
    callback(null, wNow * 1000);
  }

  //production energy lifetime
  getMaxEnergyProductionLifetimeDetected(callback) {
    var me = this;
    let state = false;
    me.log.info('Device: %s %s, max energy production Lifetime detected: %s', me.host, me.name, state ? 'Yes' : 'No');
    callback(null, state);
  }

  getEnergyProductionLifetime(callback) {
    var me = this;
    let wNow = me.productionwhLifetime;
    me.log.info('Device: %s %s, energy production Lifetime: %s kWh', me.host, me.name, wNow);
    callback(null, Math.ceil(wNow));
  }

  //production energy today
  getMaxEnergyProductionTodayDetected(callback) {
    var me = this;
    let state = false;
    me.log.info('Device: %s %s, max energy production Today detected: %s', me.host, me.name, state ? 'Yes' : 'No');
    callback(null, state);
  }

  getEnergyProductionToday(callback) {
    var me = this;
    let wNow = me.productionwhToday;
    me.log.info('Device: %s %s, energy production Today: %s kWh', me.host, me.name, wNow);
    callback(null, wNow * 1000);
  }

  //production energy last seven days
  getMaxEnergyProductionLastSevenDaysDetected(callback) {
    var me = this;
    let state = false;
    me.log.info('Device: %s %s, max energy production last Seven Days detected: %s', me.host, me.name, state ? 'Yes' : 'No');
    callback(null, state);
  }

  getEnergyProductionLastSevenDays(callback) {
    var me = this;
    let wNow = me.productionwhLastSevenDays;
    me.log.info('Device: %s %s, energy production last Seven Days: %s kWh', me.host, me.name, wNow);
    callback(null, Math.ceil(wNow));
  }

  //total consumption
  getMaxTotalPowerConsumptionDetected(callback) {
    var me = this;
    let state = me.maxTotalPowerConsumptionDetectedState;
    me.log.info('Device: %s %s, max total power consumption detected: %s', me.host, me.name, state ? 'Yes' : 'No');
    callback(null, state);
  }

  getMaxTotalPowerConsumption(callback) {
    var me = this;
    let power = me.maxTotalPowerConsumption;
    me.log.info('Device: %s %s, max total power consumption: %s kW', me.host, me.name, power);
    callback(null, power * 1000);
  }

  getTotalPowerConsumption(callback) {
    var me = this;
    let wNow = me.totalConsumptionwNow;
    me.log.info('Device: %s %s, total power consumption: %s kW', me.host, me.name, wNow);
    callback(null, wNow * 1000);
  }

  //total consumption energy lifetime
  getMaxEnergyConsumptionLifetimeDetected(callback) {
    var me = this;
    let state = false;
    me.log.info('Device: %s %s, max energy consumption Lifetime detected: %s', me.host, me.name, state ? 'Yes' : 'No');
    callback(null, state);
  }

  getEnergyConsumptionLifetime(callback) {
    var me = this;
    let wNow = me.consumptionwhLifetime;
    me.log.info('Device: %s %s, energy consumption Lifetime: %s kWh', me.host, me.name, wNow);
    callback(null, Math.ceil(wNow));
  }

  //total consumption energy today
  getMaxEnergyConsumptionTodayDetected(callback) {
    var me = this;
    let state = false;
    me.log.info('Device: %s %s, max energy consumption Today detected: %s', me.host, me.name, state ? 'Yes' : 'No');
    callback(null, state);
  }

  getEnergyConsumptionToday(callback) {
    var me = this;
    let wNow = me.consumptionToday;
    me.log.info('Device: %s %s, energy consumption Today: %s kWh', me.host, me.name, wNow);
    callback(null, wNow * 1000);
  }

  //total consumption energy last seven days
  getMaxEnergyConsumptionLastSevenDaysDetected(callback) {
    var me = this;
    let state = false;
    me.log.info('Device: %s %s, max energy consumption last Seven Days detected: %s', me.host, me.name, state ? 'Yes' : 'No');
    callback(null, state);
  }

  getEnergyConsumptionLastSevenDays(callback) {
    var me = this;
    let wNow = me.consumptionwhLastSevenDays;
    me.log.info('Device: %s %s, energy consumption last Seven Days: %s kWh', me.host, me.name, wNow);
    callback(null, Math.ceil(wNow));
  }

  //net consumption
  getMaxNetPowerConsumptionDetected(callback) {
    var me = this;
    let state = me.maxNetPowerConsumptionDetectedState;
    me.log.info('Device: %s %s, max net power consumption detected: %s', me.host, me.name, state ? 'Yes' : 'No');
    callback(null, state);
  }

  getMaxNetPowerConsumption(callback) {
    var me = this;
    let power = me.maxNetPowerConsumption;
    me.log.info('Device: %s %s, max net power consumption: %s kW', me.host, me.name, power);
    callback(null, power * 1000);
  }

  getNetPowerConsumption(callback) {
    var me = this;
    let wNow = me.netConsumptionwNow;
    me.log.info('Device: %s %s, net power consumption: %s kW', me.host, me.name, wNow);
    me.getNetConsumption();
    callback(null, wNow * 1000);
  }

  getNetConsumption() {
    var me = this;
    let whToday = me.netConsumptionwhToday;
    let whLastSevenDays = me.netConsumptionwhLastSevenDays;
    let whLifetime = me.netConsumptionwhLifetime;
    me.log('Device: %s %s, net energy consumption Lifetime: %s kWh', me.host, me.name, whLifetime);
    me.log('Device: %s %s, net energy consumption Today: %s kWh', me.host, me.name, whToday);
    me.log('Device: %s %s, net energy consumption last seven Days: %s kWh', me.host, me.name, whLastSevenDays);
  }
}

