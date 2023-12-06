'use strict';
const path = require('path');
const fs = require('fs');
const EnvoyDevice = require('./src/envoydevice');
const CONSTANS = require('./src/constans.json');

class EnvoyPlatform {
  constructor(log, config, api) {
    // only load if configured
    if (!config || !Array.isArray(config.devices)) {
      log.warn(`No configuration found for ${CONSTANS.PluginName}`);
      return;
    }
    this.accessories = [];

    //check if the directory exists, if not then create it
    const prefDir = path.join(api.user.storagePath(), 'enphaseEnvoy');
    if (!fs.existsSync(prefDir)) {
      fs.mkdirSync(prefDir);
    };

    api.on('didFinishLaunching', () => {
      for (const device of config.devices) {
        if (!device.name) {
          log.warn('Device name missing!');
          return;
        }
        if (device.envoyFirmware7xx && (!device.enlightenUser || !device.enlightenPasswd || !device.envoySerialNumber)) {
          log.warn(`Envoy firmware v7.xx enabled but enlighten user: ${device.enlightenUser ? 'OK' : device.enlightenUser}, password: ${device.enlightenPasswd ? 'OK' : device.enlightenPasswd}, envoy serial number: ${device.envoySerialNumber ? 'OK' : device.envoySerialNumber}`);
          return;
        }

        const host = device.host || 'envoy.local';
        const debug = device.enableDebugMode ? log(`Device: ${host} ${device.name}, did finish launching.`) : false;

        //denon device
        const envoyDevice = new EnvoyDevice(api, prefDir, device);
        envoyDevice.on('publishAccessory', (accessory) => {
          api.publishExternalAccessories(CONSTANS.PluginName, [accessory]);
          const debug = device.enableDebugMode ? log(`Device: ${host} ${device.name}, published as external accessory.`) : false;
        })
          .on('devInfo', (devInfo) => {
            log(devInfo);
          })
          .on('message', (message) => {
            log(`Device: ${host} ${device.name}, ${message}`);
          })
          .on('debug', (debug) => {
            log(`Device: ${host} ${device.name}, debug: ${debug}`);
          })
          .on('error', (error) => {
            log.error(`Device: ${host} ${device.name}, ${error}`);
          });
      }
    });
  }

  configureAccessory(accessory) {
    this.accessories.push(accessory);
  }
}

module.exports = (api) => {
  const Characteristic = api.hap.Characteristic;
  const Service = api.hap.Service;

  //Envoy
  class enphaseEnvoyAlerts extends Characteristic {
    constructor() {
      super('Alerts', '00000001-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyAlerts = enphaseEnvoyAlerts;

  class enphaseEnvoyPrimaryInterface extends Characteristic {
    constructor() {
      super('Network interface', '00000011-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyPrimaryInterface = enphaseEnvoyPrimaryInterface;

  class enphaseEnvoyNetworkWebComm extends Characteristic {
    constructor() {
      super('Web communication', '00000012-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyNetworkWebComm = enphaseEnvoyNetworkWebComm;


  class enphaseEnvoyEverReportedToEnlighten extends Characteristic {
    constructor() {
      super('Report to Enlighten', '00000013-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyEverReportedToEnlighten = enphaseEnvoyEverReportedToEnlighten;

  class enphaseEnvoyCommNumAndLevel extends Characteristic {
    constructor() {
      super('Devices / Level', '00000014-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyCommNumAndLevel = enphaseEnvoyCommNumAndLevel;

  class enphaseEnvoyCommNumNsrbAndLevel extends Characteristic {
    constructor() {
      super('Q-Relays / Level', '00000015-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyCommNumNsrbAndLevel = enphaseEnvoyCommNumNsrbAndLevel;

  class enphaseEnvoyCommNumPcuAndLevel extends Characteristic {
    constructor() {
      super('Microinverters / Level', '00000016-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyCommNumPcuAndLevel = enphaseEnvoyCommNumPcuAndLevel;

  class enphaseEnvoyCommNumAcbAndLevel extends Characteristic {
    constructor() {
      super('AC Batteries / Level', '00000017-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyCommNumAcbAndLevel = enphaseEnvoyCommNumAcbAndLevel;

  class enphaseEnvoyCommNumEnchgAndLevel extends Characteristic {
    constructor() {
      super('Encharges / Level', '00000018-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyCommNumEnchgAndLevel = enphaseEnvoyCommNumEnchgAndLevel;

  class enphaseEnvoyDbSize extends Characteristic {
    constructor() {
      super('DB size', '00000019-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyDbSize = enphaseEnvoyDbSize;

  class enphaseEnvoyTariff extends Characteristic {
    constructor() {
      super('Tariff', '00000021-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyTariff = enphaseEnvoyTariff;

  class enphaseEnvoyFirmware extends Characteristic {
    constructor() {
      super('Firmware', '00000022-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyFirmware = enphaseEnvoyFirmware;

  class enphaseEnvoyUpdateStatus extends Characteristic {
    constructor() {
      super('Update status', '00000023-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyUpdateStatus = enphaseEnvoyUpdateStatus;

  class enphaseEnvoyTimeZone extends Characteristic {
    constructor() {
      super('Time Zone', '00000024-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyTimeZone = enphaseEnvoyTimeZone;

  class enphaseEnvoyCurrentDateTime extends Characteristic {
    constructor() {
      super('Local time', '00000025-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyCurrentDateTime = enphaseEnvoyCurrentDateTime;

  class enphaseEnvoyLastEnlightenReporDate extends Characteristic {
    constructor() {
      super('Last report to Enlighten', '00000026-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyLastEnlightenReporDate = enphaseEnvoyLastEnlightenReporDate;

  class enphaseEnvoyEnpowerConnected extends Characteristic {
    constructor() {
      super('Enpower connected', '00000027-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyEnpowerConnected = enphaseEnvoyEnpowerConnected;

  class enphaseEnvoyEnpowerGridStatus extends Characteristic {
    constructor() {
      super('Enpower grid status', '00000028-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyEnpowerGridStatus = enphaseEnvoyEnpowerGridStatus;

  class enphaseEnvoyCheckCommLevel extends Characteristic {
    constructor() {
      super('Check plc level', '00000029-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyCheckCommLevel = enphaseEnvoyCheckCommLevel;

  class enphaseEnvoyProductionPowerMode extends Characteristic {
    constructor() {
      super('Power production', '00000030-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyProductionPowerMode = enphaseEnvoyProductionPowerMode;

  //power production service
  class enphaseEnvoyService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000001-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseEnvoyAlerts);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCommNumEnchgAndLevel);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyDbSize);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyTariff);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyFirmware);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyUpdateStatus);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyTimeZone);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporDate);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyEnpowerConnected);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyEnpowerGridStatus);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyProductionPowerMode);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseEnvoyService = enphaseEnvoyService;

  //Q-Relay
  class enphaseQrelayState extends Characteristic {
    constructor() {
      super('Relay', '00000031-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayState = enphaseQrelayState;

  class enphaseQrelayLinesCount extends Characteristic {
    constructor() {
      super('Lines', '00000032-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.INT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayLinesCount = enphaseQrelayLinesCount;

  class enphaseQrelayLine1Connected extends Characteristic {
    constructor() {
      super('Line 1', '00000033-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayLine1Connected = enphaseQrelayLine1Connected;

  class enphaseQrelayLine2Connected extends Characteristic {
    constructor() {
      super('Line 2', '00000034-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayLine2Connected = enphaseQrelayLine2Connected;

  class enphaseQrelayLine3Connected extends Characteristic {
    constructor() {
      super('Line 3', '00000035-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayLine3Connected = enphaseQrelayLine3Connected;

  class enphaseQrelayProducing extends Characteristic {
    constructor() {
      super('Producing', '00000036-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayProducing = enphaseQrelayProducing;

  class enphaseQrelayCommunicating extends Characteristic {
    constructor() {
      super('Communicating', '00000037-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayCommunicating = enphaseQrelayCommunicating;

  class enphaseQrelayProvisioned extends Characteristic {
    constructor() {
      super('Provisioned', '00000038-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayProvisioned = enphaseQrelayProvisioned;

  class enphaseQrelayOperating extends Characteristic {
    constructor() {
      super('Operating', '00000039-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayOperating = enphaseQrelayOperating;

  class enphaseQrelayCommLevel extends Characteristic {
    constructor() {
      super('PLC level', '00000041-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayCommLevel = enphaseQrelayCommLevel;

  class enphaseQrelayStatus extends Characteristic {
    constructor() {
      super('Status', '00000042-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayStatus = enphaseQrelayStatus;

  class enphaseQrelayFirmware extends Characteristic {
    constructor() {
      super('Firmware', '00000043-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayFirmware = enphaseQrelayFirmware;

  class enphaseQrelayLastReportDate extends Characteristic {
    constructor() {
      super('Last report', '00000044-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayLastReportDate = enphaseQrelayLastReportDate;

  //qrelay service
  class enphaseQrelayService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000002-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseQrelayState);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseQrelayLinesCount);
      this.addOptionalCharacteristic(Characteristic.enphaseQrelayLine1Connected);
      this.addOptionalCharacteristic(Characteristic.enphaseQrelayLine2Connected);
      this.addOptionalCharacteristic(Characteristic.enphaseQrelayLine3Connected);
      this.addOptionalCharacteristic(Characteristic.enphaseQrelayProducing);
      this.addOptionalCharacteristic(Characteristic.enphaseQrelayCommunicating);
      this.addOptionalCharacteristic(Characteristic.enphaseQrelayProvisioned);
      this.addOptionalCharacteristic(Characteristic.enphaseQrelayOperating);
      this.addOptionalCharacteristic(Characteristic.enphaseQrelayCommLevel);
      this.addOptionalCharacteristic(Characteristic.enphaseQrelayStatus);
      this.addOptionalCharacteristic(Characteristic.enphaseQrelayFirmware);
      this.addOptionalCharacteristic(Characteristic.enphaseQrelayLastReportDate);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseQrelayService = enphaseQrelayService;

  //enphase current meters
  class enphaseMeterState extends Characteristic {
    constructor() {
      super('State', '00000051-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterState = enphaseMeterState;

  class enphaseMeterMeasurementType extends Characteristic {
    constructor() {
      super('Meter type', '00000052-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterMeasurementType = enphaseMeterMeasurementType;

  class enphaseMeterPhaseCount extends Characteristic {
    constructor() {
      super('Phase count', '00000053-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterPhaseCount = enphaseMeterPhaseCount;

  class enphaseMeterPhaseMode extends Characteristic {
    constructor() {
      super('Phase mode', '00000054-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterPhaseMode = enphaseMeterPhaseMode;

  class enphaseMeterMeteringStatus extends Characteristic {
    constructor() {
      super('Metering status', '00000055-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterMeteringStatus = enphaseMeterMeteringStatus;

  class enphaseMeterStatusFlags extends Characteristic {
    constructor() {
      super('Status flag', '00000056-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterStatusFlags = enphaseMeterStatusFlags;

  class enphaseMeterActivePower extends Characteristic {
    constructor() {
      super('Active power', '00000057-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterActivePower = enphaseMeterActivePower;

  class enphaseMeterApparentPower extends Characteristic {
    constructor() {
      super('Apparent power', '00000058-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterApparentPower = enphaseMeterApparentPower;

  class enphaseMeterReactivePower extends Characteristic {
    constructor() {
      super('Reactive power', '00000059-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVAr',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterReactivePower = enphaseMeterReactivePower;

  class enphaseMeterPwrFactor extends Characteristic {
    constructor() {
      super('Power factor', '00000061-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'cos φ',
        maxValue: 1,
        minValue: -1,
        minStep: 0.01,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterPwrFactor = enphaseMeterPwrFactor;

  class enphaseMeterVoltage extends Characteristic {
    constructor() {
      super('Voltage', '00000062-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'V',
        maxValue: 1000,
        minValue: 0,
        minStep: 0.1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterVoltage = enphaseMeterVoltage;

  class enphaseMeterCurrent extends Characteristic {
    constructor() {
      super('Current', '00000063-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'A',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterCurrent = enphaseMeterCurrent;

  class enphaseMeterFreq extends Characteristic {
    constructor() {
      super('Frequency', '00000064-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'Hz',
        maxValue: 100,
        minValue: 0,
        minStep: 0.01,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterFreq = enphaseMeterFreq;

  class enphaseMeterReadingTime extends Characteristic {
    constructor() {
      super('Last report', '00000065-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterReadingTime = enphaseMeterReadingTime;

  //current meters service
  class enphaseMeterService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000003-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseMeterState);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseMeterPhaseMode);
      this.addOptionalCharacteristic(Characteristic.enphaseMeterPhaseCount);
      this.addOptionalCharacteristic(Characteristic.enphaseMeterMeasurementType);
      this.addOptionalCharacteristic(Characteristic.enphaseMeterMeteringStatus);
      this.addOptionalCharacteristic(Characteristic.enphaseMeterStatusFlags);
      this.addOptionalCharacteristic(Characteristic.enphaseMeterActivePower);
      this.addOptionalCharacteristic(Characteristic.enphaseMeterApparentPower);
      this.addOptionalCharacteristic(Characteristic.enphaseMeterReactivePower);
      this.addOptionalCharacteristic(Characteristic.enphaseMeterPwrFactor);
      this.addOptionalCharacteristic(Characteristic.enphaseMeterVoltage);
      this.addOptionalCharacteristic(Characteristic.enphaseMeterCurrent);
      this.addOptionalCharacteristic(Characteristic.enphaseMeterFreq);
      this.addOptionalCharacteristic(Characteristic.enphaseMeterReadingTime);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseMeterService = enphaseMeterService;

  //Envoy production/consumption characteristics
  class enphasePower extends Characteristic {
    constructor() {
      super('Power', '00000071-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphasePower = enphasePower;

  class enphasePowerMax extends Characteristic {
    constructor() {
      super('Power peak', '00000072-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphasePowerMax = enphasePowerMax;

  class enphasePowerMaxDetected extends Characteristic {
    constructor() {
      super('Power peak detected', '00000073-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphasePowerMaxDetected = enphasePowerMaxDetected;

  class enphaseEnergyToday extends Characteristic {
    constructor() {
      super('Energy today', '00000074-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kWh',
        maxValue: 1000000,
        minValue: 0,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnergyToday = enphaseEnergyToday;

  class enphaseEnergyLastSevenDays extends Characteristic {
    constructor() {
      super('Energy last 7 days', '00000075-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kWh',
        maxValue: 1000000,
        minValue: 0,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnergyLastSevenDays = enphaseEnergyLastSevenDays;

  class enphaseEnergyLifeTime extends Characteristic {
    constructor() {
      super('Energy lifetime', '00000076-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kWh',
        maxValue: 1000000,
        minValue: 0,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnergyLifeTime = enphaseEnergyLifeTime;

  class enphaseRmsCurrent extends Characteristic {
    constructor() {
      super('Current', '00000077-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'A',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseRmsCurrent = enphaseRmsCurrent;

  class enphaseRmsVoltage extends Characteristic {
    constructor() {
      super('Voltage', '00000078-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'V',
        maxValue: 1000,
        minValue: 0,
        minStep: 0.1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseRmsVoltage = enphaseRmsVoltage;

  class enphaseReactivePower extends Characteristic {
    constructor() {
      super('Reactive power', '00000079-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVAr',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseReactivePower = enphaseReactivePower;

  class enphaseApparentPower extends Characteristic {
    constructor() {
      super('Apparent power', '00000081-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseApparentPower = enphaseApparentPower;

  class enphasePwrFactor extends Characteristic {
    constructor() {
      super('Power factor', '00000082-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'cos φ',
        maxValue: 1,
        minValue: -1,
        minStep: 0.01,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphasePwrFactor = enphasePwrFactor;

  class enphaseReadingTime extends Characteristic {
    constructor() {
      super('Last report', '00000083-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseReadingTime = enphaseReadingTime;

  class enphasePowerMaxReset extends Characteristic {
    constructor() {
      super('Power peak reset', '00000084-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphasePowerMaxReset = enphasePowerMaxReset;

  //power production service
  class enphasePowerAndEnergyService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000004-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphasePower);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphasePowerMax);
      this.addOptionalCharacteristic(Characteristic.enphasePowerMaxDetected);
      this.addOptionalCharacteristic(Characteristic.enphaseEnergyToday);
      this.addOptionalCharacteristic(Characteristic.enphaseEnergyLastSevenDays);
      this.addOptionalCharacteristic(Characteristic.enphaseEnergyLifeTime);
      this.addOptionalCharacteristic(Characteristic.enphaseRmsCurrent);
      this.addOptionalCharacteristic(Characteristic.enphaseRmsVoltage);
      this.addOptionalCharacteristic(Characteristic.enphaseReactivePower);
      this.addOptionalCharacteristic(Characteristic.enphaseApparentPower);
      this.addOptionalCharacteristic(Characteristic.enphasePwrFactor);
      this.addOptionalCharacteristic(Characteristic.enphaseReadingTime);
      this.addOptionalCharacteristic(Characteristic.enphasePowerMaxReset);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphasePowerAndEnergyService = enphasePowerAndEnergyService;

  //AC Batterie
  class enphaseAcBatterieSummaryPower extends Characteristic {
    constructor() {
      super('Power', '00000091-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSummaryPower = enphaseAcBatterieSummaryPower;

  class enphaseAcBatterieSummaryEnergy extends Characteristic {
    constructor() {
      super('Energy', '00000092-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kWh',
        maxValue: 1000,
        minValue: 0,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSummaryEnergy = enphaseAcBatterieSummaryEnergy;

  class enphaseAcBatterieSummaryPercentFull extends Characteristic {
    constructor() {
      super('Percent full', '00000093-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSummaryPercentFull = enphaseAcBatterieSummaryPercentFull;

  class enphaseAcBatterieSummaryActiveCount extends Characteristic {
    constructor() {
      super('Devices count', '00000094-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '',
        maxValue: 255,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSummaryActiveCount = enphaseAcBatterieSummaryActiveCount;

  class enphaseAcBatterieSummaryState extends Characteristic {
    constructor() {
      super('State', '00000095-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSummaryState = enphaseAcBatterieSummaryState;

  class enphaseAcBatterieSummaryReadingTime extends Characteristic {
    constructor() {
      super('Last report', '00000096-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSummaryReadingTime = enphaseAcBatterieSummaryReadingTime;

  //AC Batterie summary service
  class enphaseAcBatterieSummaryService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000005-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseAcBatterieSummaryPower);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieSummaryEnergy);
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieSummaryPercentFull);
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieSummaryActiveCount);
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieSummaryState);
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieSummaryReadingTime);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseAcBatterieSummaryService = enphaseAcBatterieSummaryService;

  //AC Batterie
  class enphaseAcBatterieChargeStatus extends Characteristic {
    constructor() {
      super('Charge status', '00000111-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieChargeStatus = enphaseAcBatterieChargeStatus;

  class enphaseAcBatterieProducing extends Characteristic {
    constructor() {
      super('Producing', '00000112-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieProducing = enphaseAcBatterieProducing;

  class enphaseAcBatterieCommunicating extends Characteristic {
    constructor() {
      super('Communicating', '00000113-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieCommunicating = enphaseAcBatterieCommunicating;

  class enphaseAcBatterieProvisioned extends Characteristic {
    constructor() {
      super('Provisioned', '00000114-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieProvisioned = enphaseAcBatterieProvisioned;

  class enphaseAcBatterieOperating extends Characteristic {
    constructor() {
      super('Operating', '00000115-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieOperating = enphaseAcBatterieOperating;

  class enphaseAcBatterieCommLevel extends Characteristic {
    constructor() {
      super('PLC level', '00000116-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieCommLevel = enphaseAcBatterieCommLevel;

  class enphaseAcBatterieSleepEnabled extends Characteristic {
    constructor() {
      super('Sleep enabled', '00000117-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSleepEnabled = enphaseAcBatterieSleepEnabled;

  class enphaseAcBatteriePercentFull extends Characteristic {
    constructor() {
      super('Percent full', '00000118-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatteriePercentFull = enphaseAcBatteriePercentFull;

  class enphaseAcBatterieMaxCellTemp extends Characteristic {
    constructor() {
      super('Max cell temp', '00000119-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: '°C',
        maxValue: 200,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieMaxCellTemp = enphaseAcBatterieMaxCellTemp;

  class enphaseAcBatterieSleepMinSoc extends Characteristic {
    constructor() {
      super('Sleep min soc', '00000121-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: 'min',
        maxValue: 255,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSleepMinSoc = enphaseAcBatterieSleepMinSoc;

  class enphaseAcBatterieSleepMaxSoc extends Characteristic {
    constructor() {
      super('Sleep max soc', '00000122-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: 'min',
        maxValue: 255,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSleepMaxSoc = enphaseAcBatterieSleepMaxSoc;

  class enphaseAcBatterieStatus extends Characteristic {
    constructor() {
      super('Status', '00000123-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieStatus = enphaseAcBatterieStatus;

  class enphaseAcBatterieFirmware extends Characteristic {
    constructor() {
      super('Firmware', '00000124-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieFirmware = enphaseAcBatterieFirmware;

  class enphaseAcBatterieLastReportDate extends Characteristic {
    constructor() {
      super('Last report', '00000125-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieLastReportDate = enphaseAcBatterieLastReportDate;

  //AC Batterie service
  class enphaseAcBatterieService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000006-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseAcBatterieChargeStatus);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieProducing);
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieCommunicating);
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieProvisioned);
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieOperating);
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieCommLevel);
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieSleepEnabled);
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatteriePercentFull);
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieMaxCellTemp);
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieSleepMinSoc);
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieSleepMaxSoc);
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieStatus);
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieFirmware);
      this.addOptionalCharacteristic(Characteristic.enphaseAcBatterieLastReportDate);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseAcBatterieService = enphaseAcBatterieService;

  //Microinverter
  class enphaseMicroinverterPower extends Characteristic {
    constructor() {
      super('Power', '00000131-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.INT,
        unit: 'W',
        maxValue: 1000,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterPower = enphaseMicroinverterPower;

  class enphaseMicroinverterPowerMax extends Characteristic {
    constructor() {
      super('Power peak', '00000132-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.INT,
        unit: 'W',
        maxValue: 1000,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterPowerMax = enphaseMicroinverterPowerMax;

  class enphaseMicroinverterProducing extends Characteristic {
    constructor() {
      super('Producing', '00000133-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterProducing = enphaseMicroinverterProducing;

  class enphaseMicroinverterCommunicating extends Characteristic {
    constructor() {
      super('Communicating', '00000134-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterCommunicating = enphaseMicroinverterCommunicating;

  class enphaseMicroinverterProvisioned extends Characteristic {
    constructor() {
      super('Provisioned', '00000135-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterProvisioned = enphaseMicroinverterProvisioned;

  class enphaseMicroinverterOperating extends Characteristic {
    constructor() {
      super('Operating', '00000136-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterOperating = enphaseMicroinverterOperating;

  class enphaseMicroinverterCommLevel extends Characteristic {
    constructor() {
      super('PLC level', '00000137-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterCommLevel = enphaseMicroinverterCommLevel;

  class enphaseMicroinverterStatus extends Characteristic {
    constructor() {
      super('Status', '00000138-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterStatus = enphaseMicroinverterStatus;

  class enphaseMicroinverterFirmware extends Characteristic {
    constructor() {
      super('Firmware', '00000139-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterFirmware = enphaseMicroinverterFirmware;

  class enphaseMicroinverterLastReportDate extends Characteristic {
    constructor() {
      super('Last report', '00000141-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterLastReportDate = enphaseMicroinverterLastReportDate;

  //devices service
  class enphaseMicroinverterService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000007-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseMicroinverterPower);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseMicroinverterPowerMax);
      this.addOptionalCharacteristic(Characteristic.enphaseMicroinverterProducing);
      this.addOptionalCharacteristic(Characteristic.enphaseMicroinverterCommunicating);
      this.addOptionalCharacteristic(Characteristic.enphaseMicroinverterProvisioned);
      this.addOptionalCharacteristic(Characteristic.enphaseMicroinverterOperating);
      this.addOptionalCharacteristic(Characteristic.enphaseMicroinverterCommLevel);
      this.addOptionalCharacteristic(Characteristic.enphaseMicroinverterStatus);
      this.addOptionalCharacteristic(Characteristic.enphaseMicroinverterFirmware);
      this.addOptionalCharacteristic(Characteristic.enphaseMicroinverterLastReportDate);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseMicroinverterService = enphaseMicroinverterService;

  //Encharge
  class enphaseEnchargeAdminStateStr extends Characteristic {
    constructor() {
      super('Charge status', '00000151-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeAdminStateStr = enphaseEnchargeAdminStateStr;

  class enphaseEnchargeCommunicating extends Characteristic {
    constructor() {
      super('Communicating', '00000152-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeCommunicating = enphaseEnchargeCommunicating;

  class enphaseEnchargeOperating extends Characteristic {
    constructor() {
      super('Operating', '00000153-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeOperating = enphaseEnchargeOperating;

  class enphaseEnchargeCommLevelSubGhz extends Characteristic {
    constructor() {
      super('Sub GHz level', '00000154-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeCommLevelSubGhz = enphaseEnchargeCommLevelSubGhz

  class enphaseEnchargeCommLevel24Ghz extends Characteristic {
    constructor() {
      super('2.4GHz level', '00000155-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeCommLevel24Ghz = enphaseEnchargeCommLevel24Ghz;

  class enphaseEnchargeSleepEnabled extends Characteristic {
    constructor() {
      super('Sleep enabled', '00000156-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeSleepEnabled = enphaseEnchargeSleepEnabled;

  class enphaseEnchargePercentFull extends Characteristic {
    constructor() {
      super('Percent full', '00000157-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargePercentFull = enphaseEnchargePercentFull;

  class enphaseEnchargeTemperature extends Characteristic {
    constructor() {
      super('Temperature', '00000158-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: '°C',
        maxValue: 200,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeTemperature = enphaseEnchargeTemperature;

  class enphaseEnchargeMaxCellTemp extends Characteristic {
    constructor() {
      super('Max cell temp', '00000159-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: '°C',
        maxValue: 200,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeMaxCellTemp = enphaseEnchargeMaxCellTemp;

  class enphaseEnchargeLedStatus extends Characteristic {
    constructor() {
      super('LED status', '00000161-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeLedStatus = enphaseEnchargeLedStatus;

  class enphaseEnchargeRealPowerW extends Characteristic {
    constructor() {
      super('Real power', '00000162-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeRealPowerW = enphaseEnchargeRealPowerW;

  class enphaseEnchargeCapacity extends Characteristic {
    constructor() {
      super('Capacity', '00000163-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kWh',
        maxValue: 1000,
        minValue: 0,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeCapacity = enphaseEnchargeCapacity;

  class enphaseEnchargeDcSwitchOff extends Characteristic {
    constructor() {
      super('DC switch OFF', '00000164-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeDcSwitchOff = enphaseEnchargeDcSwitchOff;

  class enphaseEnchargeRev extends Characteristic {
    constructor() {
      super('Revision', '00000165-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '',
        maxValue: 255,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeRev = enphaseEnchargeRev;

  class enphaseEnchargeGridProfile extends Characteristic {
    constructor() {
      super('Grid profile', '00000166-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeGridProfile = enphaseEnchargeGridProfile;

  class enphaseEnchargeStatus extends Characteristic {
    constructor() {
      super('Status', '00000167-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeStatus = enphaseEnchargeStatus;

  class enphaseEnchargeLastReportDate extends Characteristic {
    constructor() {
      super('Last report', '00000168-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeLastReportDate = enphaseEnchargeLastReportDate;

  class enphaseEnchargeCommLevel extends Characteristic {
    constructor() {
      super('PLC level', '00000169-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeCommLevel = enphaseEnchargeCommLevel;

  //Encharge service
  class enphaseEnchargeService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000007-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseEnchargeAdminStateStr);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargeOperating);
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargeCommunicating);
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargeCommLevelSubGhz);
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargeCommLevel24Ghz);
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargeSleepEnabled);
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargePercentFull);
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargeTemperature);
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargeMaxCellTemp);
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargeLedStatus);
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargeRealPowerW);
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargeCapacity);
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargeDcSwitchOff);
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargeRev);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerGridProfile);
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargeStatus);
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargeLastReportDate);
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargeCommLevel);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseEnchargeService = enphaseEnchargeService;

  //Enpower
  class enphaseEnpowerAdminStateStr extends Characteristic {
    constructor() {
      super('Charge status', '00000171-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerAdminStateStr = enphaseEnpowerAdminStateStr;

  class enphaseEnpowerCommunicating extends Characteristic {
    constructor() {
      super('Communicating', '00000172-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerCommunicating = enphaseEnpowerCommunicating;

  class enphaseEnpowerOperating extends Characteristic {
    constructor() {
      super('Operating', '00000173-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerOperating = enphaseEnpowerOperating;

  class enphaseEnpowerCommLevelSubGhz extends Characteristic {
    constructor() {
      super('Sub GHz level', '00000174-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerCommLevelSubGhz = enphaseEnpowerCommLevelSubGhz;

  class enphaseEnpowerCommLevel24Ghz extends Characteristic {
    constructor() {
      super('2.4GHz level', '00000175-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerCommLevel24Ghz = enphaseEnpowerCommLevel24Ghz;

  class enphaseEnpowerTemperature extends Characteristic {
    constructor() {
      super('Temperature', '00000176-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: '°C',
        maxValue: 200,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerTemperature = enphaseEnpowerTemperature;

  class enphaseEnpowerMainsAdminState extends Characteristic {
    constructor() {
      super('Admin state', '00000177-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerMainsAdminState = enphaseEnpowerMainsAdminState;

  class enphaseEnpowerMainsOperState extends Characteristic {
    constructor() {
      super('Operating state', '00000178-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerMainsOperState = enphaseEnpowerMainsOperState;

  class enphaseEnpowerEnpwrGridMode extends Characteristic {
    constructor() {
      super('Grid mode', '00000179-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerEnpwrGridMode = enphaseEnpowerEnpwrGridMode;

  class enphaseEnpowerEnchgGridMode extends Characteristic {
    constructor() {
      super('Encharge grid mode', '00000181-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerEnchgGridMode = enphaseEnpowerEnchgGridMode;

  class enphaseEnpowerGridProfile extends Characteristic {
    constructor() {
      super('Grid profile', '00000182-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerGridProfile = enphaseEnpowerGridProfile;

  class enphaseEnpowerStatus extends Characteristic {
    constructor() {
      super('Status', '00000183-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerStatus = enphaseEnpowerStatus;

  class enphaseEnpowerLastReportDate extends Characteristic {
    constructor() {
      super('Last report', '00000184-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerLastReportDate = enphaseEnpowerLastReportDate;

  //Enpower service
  class enphaseEnpowerService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000008-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseEnpowerAdminStateStr);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerOperating);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerCommunicating);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerCommLevelSubGhz);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerCommLevel24Ghz);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerTemperature);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerMainsAdminState);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerMainsOperState);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerEnpwrGridMode);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerEnchgGridMode);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerGridProfile);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerStatus);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerLastReportDate);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseEnpowerService = enphaseEnpowerService;

  //Ensemble status summary
  class enphaseEnsembleStatusRestPower extends Characteristic {
    constructor() {
      super('Rest power', '00000190-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusRestPower = enphaseEnsembleStatusRestPower;

  class enphaseEnsembleStatusFreqBiasHz extends Characteristic {
    constructor() {
      super('Frequency bias L1', '00000191-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'Hz',
        maxValue: 10000,
        minValue: -10000,
        minStep: 0.01,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusFreqBiasHz = enphaseEnsembleStatusFreqBiasHz;

  class enphaseEnsembleStatusVoltageBiasV extends Characteristic {
    constructor() {
      super('Voltage bias L1', '00000192-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'V',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusVoltageBiasV = enphaseEnsembleStatusVoltageBiasV;

  class enphaseEnsembleStatusFreqBiasHzQ8 extends Characteristic {
    constructor() {
      super('Frequency bias Q8 L1', '00000193-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'Hz',
        maxValue: 10000,
        minValue: -10000,
        minStep: 0.01,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusFreqBiasHzQ8 = enphaseEnsembleStatusFreqBiasHzQ8;

  class enphaseEnsembleStatusVoltageBiasVQ5 extends Characteristic {
    constructor() {
      super('Voltage bias Q5 L1', '00000194-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'V',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusVoltageBiasVQ5 = enphaseEnsembleStatusVoltageBiasVQ5;

  class enphaseEnsembleStatusFreqBiasHzPhaseB extends Characteristic {
    constructor() {
      super('Frequency bias L2', '00000195-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'Hz',
        maxValue: 10000,
        minValue: -10000,
        minStep: 0.01,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusFreqBiasHzPhaseB = enphaseEnsembleStatusFreqBiasHzPhaseB;

  class enphaseEnsembleStatusVoltageBiasVPhaseB extends Characteristic {
    constructor() {
      super('Voltage bias L2', '00000196-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'V',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusVoltageBiasVPhaseB = enphaseEnsembleStatusVoltageBiasVPhaseB;

  class enphaseEnsembleStatusFreqBiasHzQ8PhaseB extends Characteristic {
    constructor() {
      super('Frequency bias Q8 L2', '00000197-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'Hz',
        maxValue: 10000,
        minValue: -10000,
        minStep: 0.01,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusFreqBiasHzQ8PhaseB = enphaseEnsembleStatusFreqBiasHzQ8PhaseB;

  class enphaseEnsembleStatusVoltageBiasVQ5PhaseB extends Characteristic {
    constructor() {
      super('Voltage bias Q5 L2', '00000198-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'V',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusVoltageBiasVQ5PhaseB = enphaseEnsembleStatusVoltageBiasVQ5PhaseB;

  class enphaseEnsembleStatusFreqBiasHzPhaseC extends Characteristic {
    constructor() {
      super('Frequency bias L3', '00000199-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'Hz',
        maxValue: 10000,
        minValue: -10000,
        minStep: 0.01,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusFreqBiasHzPhaseC = enphaseEnsembleStatusFreqBiasHzPhaseC;

  class enphaseEnsembleStatusVoltageBiasVPhaseC extends Characteristic {
    constructor() {
      super('Voltage bias L3', '00000200-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'V',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusVoltageBiasVPhaseC = enphaseEnsembleStatusVoltageBiasVPhaseC;

  class enphaseEnsembleStatusFreqBiasHzQ8PhaseC extends Characteristic {
    constructor() {
      super('Frequency bias Q8 L3', '00000201-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'Hz',
        maxValue: 10000,
        minValue: -10000,
        minStep: 0.01,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusFreqBiasHzQ8PhaseC = enphaseEnsembleStatusFreqBiasHzQ8PhaseC;

  class enphaseEnsembleStatusVoltageBiasVQ5PhaseC extends Characteristic {
    constructor() {
      super('Voltage bias Q5 L3', '00000202-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'V',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusVoltageBiasVQ5PhaseC = enphaseEnsembleStatusVoltageBiasVQ5PhaseC;

  class enphaseEnsembleStatusConfiguredBackupSoc extends Characteristic {
    constructor() {
      super('Configured backup SoC', '00000203-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusConfiguredBackupSoc = enphaseEnsembleStatusConfiguredBackupSoc;

  class enphaseEnsembleStatusAdjustedBackupSoc extends Characteristic {
    constructor() {
      super('Adjusted backup SoC', '00000204-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusAdjustedBackupSoc = enphaseEnsembleStatusAdjustedBackupSoc;

  class enphaseEnsembleStatusAggSoc extends Characteristic {
    constructor() {
      super('AGG SoC', '00000205-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusAggSoc = enphaseEnsembleStatusAggSoc;

  class enphaseEnsembleStatusAggMaxEnergy extends Characteristic {
    constructor() {
      super('AGG max energy', '00000206-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kWh',
        maxValue: 1000,
        minValue: 0,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusAggMaxEnergy = enphaseEnsembleStatusAggMaxEnergy;

  class enphaseEnsembleStatusEncAggSoc extends Characteristic {
    constructor() {
      super('ENC SoC', '00000207-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusEncAggSoc = enphaseEnsembleStatusEncAggSoc;

  class enphaseEnsembleStatusEncAggRatedPower extends Characteristic {
    constructor() {
      super('ENC rated power', '00000208-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusEncAggRatedPower = enphaseEnsembleStatusEncAggRatedPower;

  class enphaseEnsembleStatusEncAggBackupEnergy extends Characteristic {
    constructor() {
      super('ENC backup energy', '00000209-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kWh',
        maxValue: 1000,
        minValue: 0,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusEncAggBackupEnergy = enphaseEnsembleStatusEncAggBackupEnergy;

  class enphaseEnsembleStatusEncAggAvailEnergy extends Characteristic {
    constructor() {
      super('ENC available energy', '00000210-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kWh',
        maxValue: 1000,
        minValue: 0,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusEncAggAvailEnergy = enphaseEnsembleStatusEncAggAvailEnergy;

  //Enpower service
  class enphaseEnsembleStatusService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000009-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseEnsembleStatusRestPower);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHz);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasV);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzPhaseB);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVPhaseB);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8PhaseB);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5PhaseB);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzPhaseC);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVPhaseC);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8PhaseC);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5PhaseC);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusConfiguredBackupSoc);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusAdjustedBackupSoc);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusAggSoc);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusAggMaxEnergy);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusEncAggSoc);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusEncAggRatedPower);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusEncAggBackupEnergy);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusEncAggAvailEnergy);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseEnsembleStatusService = enphaseEnsembleStatusService;

  //Wireless connection kit
  class enphaseWirelessConnectionKitType extends Characteristic {
    constructor() {
      super('Type', '00000220-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseWirelessConnectionKitType = enphaseWirelessConnectionKitType;

  class enphaseWirelessConnectionKitConnected extends Characteristic {
    constructor() {
      super('Connected', '00000221-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseWirelessConnectionKitConnected = enphaseWirelessConnectionKitConnected;

  class enphaseWirelessConnectionKitSignalStrength extends Characteristic {
    constructor() {
      super('Signal strength', '00000222-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseWirelessConnectionKitSignalStrength = enphaseWirelessConnectionKitSignalStrength;

  class enphaseWirelessConnectionKitSignalStrengthMax extends Characteristic {
    constructor() {
      super('Signal strength max', '00000223-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseWirelessConnectionKitSignalStrengthMax = enphaseWirelessConnectionKitSignalStrengthMax;

  //Wireless connection kit service
  class enphaseWirelessConnectionKitService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000010-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseWirelessConnectionKitType);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseWirelessConnectionKitConnected);
      this.addOptionalCharacteristic(Characteristic.enphaseWirelessConnectionKitSignalStrength);
      this.addOptionalCharacteristic(Characteristic.enphaseWirelessConnectionKitSignalStrengthMax);
    }
  }
  Service.enphaseWirelessConnectionKitService = enphaseWirelessConnectionKitService;

  //Esub
  class enphaseEsubProducing extends Characteristic {
    constructor() {
      super('Producing', '00000230-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEsubProducing = enphaseEsubProducing;

  class enphaseEsubCommunicating extends Characteristic {
    constructor() {
      super('Communicating', '00000231-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEsubCommunicating = enphaseEsubCommunicating;


  class enphaseEsubOperating extends Characteristic {
    constructor() {
      super('Operating', '00000232-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEsubOperating = enphaseEsubOperating;

  class enphaseEsubCommLevel extends Characteristic {
    constructor() {
      super('PLC level', '00000233-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: '%',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEsubCommLevel = enphaseEsubCommLevel;

  class enphaseEsubStatus extends Characteristic {
    constructor() {
      super('Status', '00000234-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEsubStatus = enphaseEsubStatus;

  class enphaseEsubFirmware extends Characteristic {
    constructor() {
      super('Firmware', '00000235-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEsubFirmware = enphaseEsubFirmware;

  class enphaseEsubLastReportDate extends Characteristic {
    constructor() {
      super('Last report', '00000236-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEsubLastReportDate = enphaseEsubLastReportDate;

  //eusb service
  class enphaseEsubService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000011-000B-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseEsubProducing);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseEsubCommunicating);
      this.addOptionalCharacteristic(Characteristic.enphaseEsubOperating);
      this.addOptionalCharacteristic(Characteristic.enphaseEsubCommLevel);
      this.addOptionalCharacteristic(Characteristic.enphaseEsubStatus);
      this.addOptionalCharacteristic(Characteristic.enphaseEsubFirmware);
      this.addOptionalCharacteristic(Characteristic.enphaseEsubLastReportDate);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseEsubService = enphaseEsubService;

  //enphase live data pv
  class enphaseLiveDataPvActivePower extends Characteristic {
    constructor() {
      super('Active power', '00000240-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataPvActivePower = enphaseLiveDataPvActivePower;

  class enphaseLiveDataPvActivePowerL1 extends Characteristic {
    constructor() {
      super('Active power L1', '00000241-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataPvActivePowerL1 = enphaseLiveDataPvActivePowerL1;


  class enphaseLiveDataPvActivePowerL2 extends Characteristic {
    constructor() {
      super('Active power L2', '00000242-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataPvActivePowerL2 = enphaseLiveDataPvActivePowerL2;


  class enphaseLiveDataPvActivePowerL3 extends Characteristic {
    constructor() {
      super('Active power L3', '00000243-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataPvActivePowerL3 = enphaseLiveDataPvActivePowerL3;


  class enphaseLiveDataPvApparentPower extends Characteristic {
    constructor() {
      super('Apparent power', '00000244-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataPvApparentPower = enphaseLiveDataPvApparentPower;

  class enphaseLiveDataPvApparentPowerL1 extends Characteristic {
    constructor() {
      super('Apparent power L1', '00000245-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataPvApparentPowerL1 = enphaseLiveDataPvApparentPowerL1;

  class enphaseLiveDataPvApparentPowerL2 extends Characteristic {
    constructor() {
      super('Apparent power L2', '00000246-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataPvApparentPowerL2 = enphaseLiveDataPvApparentPowerL2;

  class enphaseLiveDataPvApparentPowerL3 extends Characteristic {
    constructor() {
      super('Apparent power L3', '00000247-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataPvApparentPowerL3 = enphaseLiveDataPvApparentPowerL3;

  //live data pv service
  class enphaseLiveDataPvService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000012-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseLiveDataPvActivePower);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataPvActivePowerL1);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataPvActivePowerL2);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataPvActivePowerL3);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataPvApparentPower);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataPvApparentPowerL1);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataPvApparentPowerL2);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataPvApparentPowerL3);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseLiveDataPvService = enphaseLiveDataPvService;

  //enphase live data storage
  class enphaseLiveDataStorageActivePower extends Characteristic {
    constructor() {
      super('Active power', '00000250-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataStorageActivePower = enphaseLiveDataStorageActivePower;

  class enphaseLiveDataStorageActivePowerL1 extends Characteristic {
    constructor() {
      super('Active power L1', '00000251-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataStorageActivePowerL1 = enphaseLiveDataStorageActivePowerL1;


  class enphaseLiveDataStorageActivePowerL2 extends Characteristic {
    constructor() {
      super('Active power L2', '00000252-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataStorageActivePowerL2 = enphaseLiveDataStorageActivePowerL2;


  class enphaseLiveDataStorageActivePowerL3 extends Characteristic {
    constructor() {
      super('Active power L3', '00000253-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataStorageActivePowerL3 = enphaseLiveDataStorageActivePowerL3;


  class enphaseLiveDataStorageApparentPower extends Characteristic {
    constructor() {
      super('Apparent power', '00000254-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataStorageApparentPower = enphaseLiveDataStorageApparentPower;

  class enphaseLiveDataStorageApparentPowerL1 extends Characteristic {
    constructor() {
      super('Apparent power L1', '00000255-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataStorageApparentPowerL1 = enphaseLiveDataStorageApparentPowerL1;

  class enphaseLiveDataStorageApparentPowerL2 extends Characteristic {
    constructor() {
      super('Apparent power L2', '00000256-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataStorageApparentPowerL2 = enphaseLiveDataStorageApparentPowerL2;

  class enphaseLiveDataStorageApparentPowerL3 extends Characteristic {
    constructor() {
      super('Apparent power L3', '00000257-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataStorageApparentPowerL3 = enphaseLiveDataStorageApparentPowerL3;

  //live data storage service
  class enphaseLiveDataStorageService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000013-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseLiveDataStorageActivePower);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataStorageActivePowerL1);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataStorageActivePowerL2);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataStorageActivePowerL3);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataStorageApparentPower);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataStorageApparentPowerL1);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataStorageApparentPowerL2);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataStorageApparentPowerL3);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseLiveDataStorageService = enphaseLiveDataStorageService;

  //enphase live data grid
  class enphaseLiveDataGridActivePower extends Characteristic {
    constructor() {
      super('Active power', '00000260-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataGridActivePower = enphaseLiveDataGridActivePower;

  class enphaseLiveDataGridActivePowerL1 extends Characteristic {
    constructor() {
      super('Active power L1', '00000261-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataGridActivePowerL1 = enphaseLiveDataGridActivePowerL1;


  class enphaseLiveDataGridActivePowerL2 extends Characteristic {
    constructor() {
      super('Active power L2', '00000262-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataGridActivePowerL2 = enphaseLiveDataGridActivePowerL2;


  class enphaseLiveDataGridActivePowerL3 extends Characteristic {
    constructor() {
      super('Active power L3', '00000263-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataGridActivePowerL3 = enphaseLiveDataGridActivePowerL3;


  class enphaseLiveDataGridApparentPower extends Characteristic {
    constructor() {
      super('Apparent power', '00000264-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataGridApparentPower = enphaseLiveDataGridApparentPower;

  class enphaseLiveDataGridApparentPowerL1 extends Characteristic {
    constructor() {
      super('Apparent power L1', '00000265-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataGridApparentPowerL1 = enphaseLiveDataGridApparentPowerL1;

  class enphaseLiveDataGridApparentPowerL2 extends Characteristic {
    constructor() {
      super('Apparent power L2', '00000266-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataGridApparentPowerL2 = enphaseLiveDataGridApparentPowerL2;

  class enphaseLiveDataGridApparentPowerL3 extends Characteristic {
    constructor() {
      super('Apparent power L3', '00000267-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataGridApparentPowerL3 = enphaseLiveDataGridApparentPowerL3;

  //live data grid service
  class enphaseLiveDataGridService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000014-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseLiveDataGridActivePower);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataGridActivePowerL1);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataGridActivePowerL2);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataGridActivePowerL3);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataGridApparentPower);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataGridApparentPowerL1);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataGridApparentPowerL2);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataGridApparentPowerL3);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseLiveDataGridService = enphaseLiveDataGridService;

  //enphase live data load
  class enphaseLiveDataLoadActivePower extends Characteristic {
    constructor() {
      super('Active power', '00000270-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataLoadActivePower = enphaseLiveDataLoadActivePower;

  class enphaseLiveDataLoadActivePowerL1 extends Characteristic {
    constructor() {
      super('Active power L1', '00000271-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataLoadActivePowerL1 = enphaseLiveDataLoadActivePowerL1;


  class enphaseLiveDataLoadActivePowerL2 extends Characteristic {
    constructor() {
      super('Active power L2', '00000272-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataLoadActivePowerL2 = enphaseLiveDataLoadActivePowerL2;


  class enphaseLiveDataLoadActivePowerL3 extends Characteristic {
    constructor() {
      super('Active power L3', '00000273-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataLoadActivePowerL3 = enphaseLiveDataLoadActivePowerL3;


  class enphaseLiveDataLoadApparentPower extends Characteristic {
    constructor() {
      super('Apparent power', '00000274-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataLoadApparentPower = enphaseLiveDataLoadApparentPower;

  class enphaseLiveDataLoadApparentPowerL1 extends Characteristic {
    constructor() {
      super('Apparent power L1', '00000275-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataLoadApparentPowerL1 = enphaseLiveDataLoadApparentPowerL1;

  class enphaseLiveDataLoadApparentPowerL2 extends Characteristic {
    constructor() {
      super('Apparent power L2', '00000276-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataLoadApparentPowerL2 = enphaseLiveDataLoadApparentPowerL2;

  class enphaseLiveDataLoadApparentPowerL3 extends Characteristic {
    constructor() {
      super('Apparent power L3', '00000277-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataLoadApparentPowerL3 = enphaseLiveDataLoadApparentPowerL3;

  //live data load service
  class enphaseLiveDataLoadService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000015-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseLiveDataLoadActivePower);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataLoadActivePowerL1);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataLoadActivePowerL2);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataLoadActivePowerL3);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataLoadApparentPower);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataLoadApparentPowerL1);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataLoadApparentPowerL2);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataLoadApparentPowerL3);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseLiveDataLoadService = enphaseLiveDataLoadService;

  //enphase live data generator
  class enphaseLiveDataGeneratorActivePower extends Characteristic {
    constructor() {
      super('Active power', '00000280-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataGeneratorActivePower = enphaseLiveDataGeneratorActivePower;

  class enphaseLiveDataGeneratorActivePowerL1 extends Characteristic {
    constructor() {
      super('Active power L1', '00000281-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataGeneratorActivePowerL1 = enphaseLiveDataGeneratorActivePowerL1;


  class enphaseLiveDataGeneratorActivePowerL2 extends Characteristic {
    constructor() {
      super('Active power L2', '00000282-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataGeneratorActivePowerL2 = enphaseLiveDataGeneratorActivePowerL2;


  class enphaseLiveDataGeneratorActivePowerL3 extends Characteristic {
    constructor() {
      super('Active power L3', '00000283-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataGeneratorActivePowerL3 = enphaseLiveDataGeneratorActivePowerL3;


  class enphaseLiveDataGeneratorApparentPower extends Characteristic {
    constructor() {
      super('Apparent power', '00000284-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataGeneratorApparentPower = enphaseLiveDataGeneratorApparentPower;

  class enphaseLiveDataGeneratorApparentPowerL1 extends Characteristic {
    constructor() {
      super('Apparent power L1', '00000285-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataGeneratorApparentPowerL1 = enphaseLiveDataGeneratorApparentPowerL1;

  class enphaseLiveDataGeneratorApparentPowerL2 extends Characteristic {
    constructor() {
      super('Apparent power L2', '00000286-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataGeneratorApparentPowerL2 = enphaseLiveDataGeneratorApparentPowerL2;

  class enphaseLiveDataGeneratorApparentPowerL3 extends Characteristic {
    constructor() {
      super('Apparent power L3', '00000287-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataGeneratorApparentPowerL3 = enphaseLiveDataGeneratorApparentPowerL3;

  //live data generator service
  class enphaseLiveDataGeneratorService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000016-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseLiveDataGeneratorActivePower);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataGeneratorActivePowerL1);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataGeneratorActivePowerL2);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataGeneratorActivePowerL3);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataGeneratorApparentPower);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataGeneratorApparentPowerL1);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataGeneratorApparentPowerL2);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataGeneratorApparentPowerL3);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseLiveDataGeneratorService = enphaseLiveDataGeneratorService;

  api.registerPlatform(CONSTANS.PluginName, CONSTANS.PlatformName, EnvoyPlatform, true);
}
