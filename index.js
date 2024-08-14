'use strict';
const path = require('path');
const fs = require('fs');
const EnvoyDevice = require('./src/envoydevice');
const CONSTANTS = require('./src/constants.json');
const STATUSCODEREGEX = /status code (\d+)/;

class EnvoyPlatform {
  constructor(log, config, api) {
    // only load if configured
    if (!config || !Array.isArray(config.devices)) {
      log.warn(`No configuration found for ${CONSTANTS.PluginName}`);
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
        const deviceName = device.name ?? false;
        const envoyFirmware7xx = device.envoyFirmware7xx || false;
        const envoyFirmware7xxTokenGenerationMode = device.envoyFirmware7xxTokenGenerationMode || 0; //0 - enlighten credentials, 1 - own token
        const envoyPasswd = device.envoyPasswd ?? false;
        const envoyToken = device.envoyToken ?? false;
        const enlightenUser = device.enlightenUser ?? false;
        const enlightenPasswd = device.enlightenPasswd ?? false;
        const envoySerialNumber = device.envoySerialNumber ?? false;

        //check mandatory properties
        if (!deviceName) {
          log.warn(`Name missing: ${deviceName}.`);
          return;
        }

        if (envoyFirmware7xx && envoyFirmware7xxTokenGenerationMode === 0 && (!enlightenUser || !enlightenPasswd || !envoySerialNumber)) {
          log.warn(`Envoy firmware v7.x.x enabled, enlighten user: ${enlightenUser ? 'OK' : enlightenUser}, password: ${enlightenPasswd ? 'OK' : enlightenPasswd}, envoy serial number: ${envoySerialNumber ? 'OK' : envoySerialNumber}.`);
          return;
        }

        if (envoyFirmware7xx && envoyFirmware7xxTokenGenerationMode === 1 && !envoyToken) {
          log.warn(`Envoy firmware v7.x.x enabled but envoy token: ${envoyToken ? 'OK' : envoyToken}.`);
          return;
        }

        //config
        const host = device.host || 'envoy.local';
        const enableDebugMode = device.enableDebugMode || false;

        //debug config
        const debug = enableDebugMode ? log(`Device: ${host} ${deviceName}, did finish launching.`) : false;
        const config = {
          ...device,
          envoyPasswd: 'removed',
          envoyToken: 'removed',
          envoySerialNumber: 'removed',
          enlightenUser: 'removed',
          enlightenPasswd: 'removed',
          mqtt: {
            ...device.mqtt,
            user: 'removed',
            passwd: 'removed'
          }
        };
        const debug1 = enableDebugMode ? log(`Device: ${host} ${deviceName}, Config: ${JSON.stringify(config, null, 2)}`) : false;

        //check files exists, if not then create it
        const postFix = host.split('.').join('');
        const envoyIdFile = (`${prefDir}/envoyId_${postFix}`);
        const envoyTokenFile = (`${prefDir}/envoyToken_${postFix}`);
        const envoyInstallerPasswordFile = (`${prefDir}/envoyInstallerPassword_${postFix}`);

        try {
          const files = [
            envoyIdFile,
            envoyTokenFile,
            envoyInstallerPasswordFile
          ];

          files.forEach((file) => {
            if (!fs.existsSync(file)) {
              fs.writeFileSync(file, '0');
            }
          });
        } catch (error) {
          log.error(`Device: ${host} ${deviceName}, prepare files error: ${error}`);
        }

        //envoy device
        const envoyDevice = new EnvoyDevice(api, deviceName, host, envoyFirmware7xx, envoyFirmware7xxTokenGenerationMode, envoyPasswd, envoyToken, envoySerialNumber, enlightenUser, enlightenPasswd, envoyIdFile, envoyTokenFile, envoyInstallerPasswordFile, device);
        envoyDevice.on('publishAccessory', (accessory) => {
          api.publishExternalAccessories(CONSTANTS.PluginName, [accessory]);
          const debug = enableDebugMode ? log(`Device: ${host} ${deviceName}, published as external accessory.`) : false;
        })
          .on('devInfo', (devInfo) => {
            log(devInfo);
          })
          .on('message', (message) => {
            log(`Device: ${host} ${deviceName}, ${message}`);
          })
          .on('debug', (debug) => {
            log(`Device: ${host} ${deviceName}, debug: ${debug}`);
          })
          .on('error', async (error) => {
            const match = error.match(STATUSCODEREGEX);
            const tokenNotValid = envoyFirmware7xx && match && match[1] === '401';
            const displayError = tokenNotValid ? log(`Device: ${host} ${deviceName}, JWT token not valid, refreshing.`) : log.error(`Device: ${host} ${deviceName}, ${error}, trying again in 15s.`);

            envoyDevice.impulseGenerator.stop();
            await new Promise(resolve => setTimeout(resolve, 15000));
            envoyDevice.start();
          })
          .on('tokenExpired', async (message) => {
            log(`Device: ${host} ${deviceName}, ${message}`);

            //start read data
            envoyDevice.impulseGenerator.stop();
            await new Promise(resolve => setTimeout(resolve, 15000))
            envoyDevice.start();
          });
      }
    });
  }

  configureAccessory(accessory) {
    this.accessories.push(accessory);
  }
}

module.exports = (api) => {
  const { Service, Characteristic, Units, Formats, Perms } = api.hap;

  //Envoy
  class enphaseEnvoyAlerts extends Characteristic {
    constructor() {
      super('Alerts', '00000001-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyAlerts = enphaseEnvoyAlerts;

  class enphaseEnvoyGridProfile extends Characteristic {
    constructor() {
      super('Grid profile', '00000002-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyGridProfile = enphaseEnvoyGridProfile;

  class enphaseEnvoyPrimaryInterface extends Characteristic {
    constructor() {
      super('Network interface', '00000011-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyPrimaryInterface = enphaseEnvoyPrimaryInterface;

  class enphaseEnvoyNetworkWebComm extends Characteristic {
    constructor() {
      super('Web communication', '00000012-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyNetworkWebComm = enphaseEnvoyNetworkWebComm;


  class enphaseEnvoyEverReportedToEnlighten extends Characteristic {
    constructor() {
      super('Report to Enlighten', '00000013-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyEverReportedToEnlighten = enphaseEnvoyEverReportedToEnlighten;

  class enphaseEnvoyCommNumAndLevel extends Characteristic {
    constructor() {
      super('Devices / Level', '00000014-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyCommNumAndLevel = enphaseEnvoyCommNumAndLevel;

  class enphaseEnvoyCommNumNsrbAndLevel extends Characteristic {
    constructor() {
      super('Q-Relays / Level', '00000015-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyCommNumNsrbAndLevel = enphaseEnvoyCommNumNsrbAndLevel;

  class enphaseEnvoyCommNumPcuAndLevel extends Characteristic {
    constructor() {
      super('Microinverters / Level', '00000016-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyCommNumPcuAndLevel = enphaseEnvoyCommNumPcuAndLevel;

  class enphaseEnvoyCommNumAcbAndLevel extends Characteristic {
    constructor() {
      super('AC Batteries / Level', '00000017-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyCommNumAcbAndLevel = enphaseEnvoyCommNumAcbAndLevel;

  class enphaseEnvoyCommNumEnchgAndLevel extends Characteristic {
    constructor() {
      super('Encharges / Level', '00000018-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyCommNumEnchgAndLevel = enphaseEnvoyCommNumEnchgAndLevel;

  class enphaseEnvoyDbSize extends Characteristic {
    constructor() {
      super('DB size', '00000019-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyDbSize = enphaseEnvoyDbSize;

  class enphaseEnvoyTariff extends Characteristic {
    constructor() {
      super('Tariff', '00000021-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyTariff = enphaseEnvoyTariff;

  class enphaseEnvoyFirmware extends Characteristic {
    constructor() {
      super('Firmware', '00000022-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyFirmware = enphaseEnvoyFirmware;

  class enphaseEnvoyUpdateStatus extends Characteristic {
    constructor() {
      super('Update status', '00000023-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyUpdateStatus = enphaseEnvoyUpdateStatus;

  class enphaseEnvoyTimeZone extends Characteristic {
    constructor() {
      super('Time Zone', '00000024-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyTimeZone = enphaseEnvoyTimeZone;

  class enphaseEnvoyCurrentDateTime extends Characteristic {
    constructor() {
      super('Local time', '00000025-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyCurrentDateTime = enphaseEnvoyCurrentDateTime;

  class enphaseEnvoyLastEnlightenReporDate extends Characteristic {
    constructor() {
      super('Last report to Enlighten', '00000026-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyLastEnlightenReporDate = enphaseEnvoyLastEnlightenReporDate;

  class enphaseEnvoyEnpowerGridState extends Characteristic {
    constructor() {
      super('Enpower grid state', '00000027-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyEnpowerGridState = enphaseEnvoyEnpowerGridState;

  class enphaseEnvoyEnpowerGridMode extends Characteristic {
    constructor() {
      super('Enpower grid mode', '00000028-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyEnpowerGridMode = enphaseEnvoyEnpowerGridMode;

  class enphaseEnvoyGeneratorState extends Characteristic {
    constructor() {
      super('Generator state', '00000301-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyGeneratorState = enphaseEnvoyGeneratorState;

  class enphaseEnvoyGeneratorMode extends Characteristic {
    constructor() {
      super('Generator mode', '00000302-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyGeneratorMode = enphaseEnvoyGeneratorMode;


  class enphaseEnvoyCheckCommLevel extends Characteristic {
    constructor() {
      super('Check plc level', '00000029-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyCheckCommLevel = enphaseEnvoyCheckCommLevel;

  class enphaseEnvoyProductionPowerMode extends Characteristic {
    constructor() {
      super('Power production', '00000030-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyProductionPowerMode = enphaseEnvoyProductionPowerMode;

  class enphaseEnvoyDataRefresh extends Characteristic {
    constructor() {
      super('Data sampling', '00000300-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnvoyDataRefresh = enphaseEnvoyDataRefresh;

  //power production service
  class enphaseEnvoyService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000001-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseEnvoyAlerts);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyGridProfile);
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
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyEnpowerGridState);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyEnpowerGridMode);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyGeneratorState);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyGeneratorMode);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyProductionPowerMode);
      this.addOptionalCharacteristic(Characteristic.enphaseEnvoyDataRefresh);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseEnvoyService = enphaseEnvoyService;

  //Q-Relay
  class enphaseQrelayState extends Characteristic {
    constructor() {
      super('Relay', '00000031-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayState = enphaseQrelayState;

  class enphaseQrelayLinesCount extends Characteristic {
    constructor() {
      super('Lines', '00000032-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayLinesCount = enphaseQrelayLinesCount;

  class enphaseQrelayLine1Connected extends Characteristic {
    constructor() {
      super('Line 1', '00000033-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayLine1Connected = enphaseQrelayLine1Connected;

  class enphaseQrelayLine2Connected extends Characteristic {
    constructor() {
      super('Line 2', '00000034-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayLine2Connected = enphaseQrelayLine2Connected;

  class enphaseQrelayLine3Connected extends Characteristic {
    constructor() {
      super('Line 3', '00000035-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayLine3Connected = enphaseQrelayLine3Connected;

  class enphaseQrelayProducing extends Characteristic {
    constructor() {
      super('Producing', '00000036-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayProducing = enphaseQrelayProducing;

  class enphaseQrelayCommunicating extends Characteristic {
    constructor() {
      super('Communicating', '00000037-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayCommunicating = enphaseQrelayCommunicating;

  class enphaseQrelayProvisioned extends Characteristic {
    constructor() {
      super('Provisioned', '00000038-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayProvisioned = enphaseQrelayProvisioned;

  class enphaseQrelayOperating extends Characteristic {
    constructor() {
      super('Operating', '00000039-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayOperating = enphaseQrelayOperating;

  class enphaseQrelayCommLevel extends Characteristic {
    constructor() {
      super('PLC level', '00000041-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayCommLevel = enphaseQrelayCommLevel;

  class enphaseQrelayStatus extends Characteristic {
    constructor() {
      super('Status', '00000042-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayStatus = enphaseQrelayStatus;

  class enphaseQrelayFirmware extends Characteristic {
    constructor() {
      super('Firmware', '00000043-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayFirmware = enphaseQrelayFirmware;

  class enphaseQrelayLastReportDate extends Characteristic {
    constructor() {
      super('Last report', '00000044-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayLastReportDate = enphaseQrelayLastReportDate;

  class enphaseQrelayGridProfile extends Characteristic {
    constructor() {
      super('Grid profile', '00000045-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseQrelayGridProfile = enphaseQrelayGridProfile;

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
      this.addOptionalCharacteristic(Characteristic.enphaseQrelayGridProfile);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseQrelayService = enphaseQrelayService;

  //enphase current meters
  class enphaseMeterState extends Characteristic {
    constructor() {
      super('State', '00000051-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterState = enphaseMeterState;

  class enphaseMeterMeasurementType extends Characteristic {
    constructor() {
      super('Meter type', '00000052-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterMeasurementType = enphaseMeterMeasurementType;

  class enphaseMeterPhaseCount extends Characteristic {
    constructor() {
      super('Phase count', '00000053-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterPhaseCount = enphaseMeterPhaseCount;

  class enphaseMeterPhaseMode extends Characteristic {
    constructor() {
      super('Phase mode', '00000054-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterPhaseMode = enphaseMeterPhaseMode;

  class enphaseMeterMeteringStatus extends Characteristic {
    constructor() {
      super('Metering status', '00000055-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterMeteringStatus = enphaseMeterMeteringStatus;

  class enphaseMeterStatusFlags extends Characteristic {
    constructor() {
      super('Status flag', '00000056-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterStatusFlags = enphaseMeterStatusFlags;

  class enphaseMeterActivePower extends Characteristic {
    constructor() {
      super('Active power', '00000057-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterActivePower = enphaseMeterActivePower;

  class enphaseMeterApparentPower extends Characteristic {
    constructor() {
      super('Apparent power', '00000058-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kVA',
        maxValue: 10000,
        minValue: -10000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterApparentPower = enphaseMeterApparentPower;

  class enphaseMeterReactivePower extends Characteristic {
    constructor() {
      super('Reactive power', '00000059-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kVAr',
        maxValue: 10000,
        minValue: -10000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterReactivePower = enphaseMeterReactivePower;

  class enphaseMeterPwrFactor extends Characteristic {
    constructor() {
      super('Power factor', '00000061-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'cos φ',
        maxValue: 1,
        minValue: -1,
        minStep: 0.01,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterPwrFactor = enphaseMeterPwrFactor;

  class enphaseMeterVoltage extends Characteristic {
    constructor() {
      super('Voltage', '00000062-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'V',
        maxValue: 1000,
        minValue: 0,
        minStep: 0.1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterVoltage = enphaseMeterVoltage;

  class enphaseMeterCurrent extends Characteristic {
    constructor() {
      super('Current', '00000063-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'A',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterCurrent = enphaseMeterCurrent;

  class enphaseMeterFreq extends Characteristic {
    constructor() {
      super('Frequency', '00000064-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'Hz',
        maxValue: 100,
        minValue: 0,
        minStep: 0.01,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMeterFreq = enphaseMeterFreq;

  class enphaseMeterReadingTime extends Characteristic {
    constructor() {
      super('Last report', '00000065-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
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
        format: Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphasePower = enphasePower;

  class enphasePowerMax extends Characteristic {
    constructor() {
      super('Power peak', '00000072-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphasePowerMax = enphasePowerMax;

  class enphasePowerMaxDetected extends Characteristic {
    constructor() {
      super('Power peak detected', '00000073-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphasePowerMaxDetected = enphasePowerMaxDetected;

  class enphaseEnergyToday extends Characteristic {
    constructor() {
      super('Energy today', '00000074-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kWh',
        maxValue: 100000000,
        minValue: -100000000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnergyToday = enphaseEnergyToday;

  class enphaseEnergyLastSevenDays extends Characteristic {
    constructor() {
      super('Energy last 7 days', '00000075-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kWh',
        maxValue: 100000000,
        minValue: -100000000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnergyLastSevenDays = enphaseEnergyLastSevenDays;

  class enphaseEnergyLifeTime extends Characteristic {
    constructor() {
      super('Energy lifetime', '00000076-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kWh',
        maxValue: 100000000,
        minValue: -100000000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnergyLifeTime = enphaseEnergyLifeTime;

  class enphaseRmsCurrent extends Characteristic {
    constructor() {
      super('Current', '00000077-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'A',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseRmsCurrent = enphaseRmsCurrent;

  class enphaseRmsVoltage extends Characteristic {
    constructor() {
      super('Voltage', '00000078-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'V',
        maxValue: 1000,
        minValue: 0,
        minStep: 0.1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseRmsVoltage = enphaseRmsVoltage;

  class enphaseReactivePower extends Characteristic {
    constructor() {
      super('Reactive power', '00000079-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kVAr',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseReactivePower = enphaseReactivePower;

  class enphaseApparentPower extends Characteristic {
    constructor() {
      super('Apparent power', '00000081-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseApparentPower = enphaseApparentPower;

  class enphasePwrFactor extends Characteristic {
    constructor() {
      super('Power factor', '00000082-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'cos φ',
        maxValue: 1,
        minValue: -1,
        minStep: 0.01,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphasePwrFactor = enphasePwrFactor;

  class enphaseReadingTime extends Characteristic {
    constructor() {
      super('Last report', '00000083-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseReadingTime = enphaseReadingTime;

  class enphasePowerMaxReset extends Characteristic {
    constructor() {
      super('Power peak reset', '00000084-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
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
        format: Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSummaryPower = enphaseAcBatterieSummaryPower;

  class enphaseAcBatterieSummaryEnergy extends Characteristic {
    constructor() {
      super('Energy', '00000092-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kWh',
        maxValue: 100000000,
        minValue: -100000000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSummaryEnergy = enphaseAcBatterieSummaryEnergy;

  class enphaseAcBatterieSummaryPercentFull extends Characteristic {
    constructor() {
      super('Percent full', '00000093-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSummaryPercentFull = enphaseAcBatterieSummaryPercentFull;

  class enphaseAcBatterieSummaryActiveCount extends Characteristic {
    constructor() {
      super('Devices count', '00000094-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: '',
        maxValue: 255,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSummaryActiveCount = enphaseAcBatterieSummaryActiveCount;

  class enphaseAcBatterieSummaryState extends Characteristic {
    constructor() {
      super('State', '00000095-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSummaryState = enphaseAcBatterieSummaryState;

  class enphaseAcBatterieSummaryReadingTime extends Characteristic {
    constructor() {
      super('Last report', '00000096-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
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
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieChargeStatus = enphaseAcBatterieChargeStatus;

  class enphaseAcBatterieProducing extends Characteristic {
    constructor() {
      super('Producing', '00000112-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieProducing = enphaseAcBatterieProducing;

  class enphaseAcBatterieCommunicating extends Characteristic {
    constructor() {
      super('Communicating', '00000113-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieCommunicating = enphaseAcBatterieCommunicating;

  class enphaseAcBatterieProvisioned extends Characteristic {
    constructor() {
      super('Provisioned', '00000114-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieProvisioned = enphaseAcBatterieProvisioned;

  class enphaseAcBatterieOperating extends Characteristic {
    constructor() {
      super('Operating', '00000115-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieOperating = enphaseAcBatterieOperating;

  class enphaseAcBatterieCommLevel extends Characteristic {
    constructor() {
      super('PLC level', '00000116-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieCommLevel = enphaseAcBatterieCommLevel;

  class enphaseAcBatterieSleepEnabled extends Characteristic {
    constructor() {
      super('Sleep enabled', '00000117-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSleepEnabled = enphaseAcBatterieSleepEnabled;

  class enphaseAcBatteriePercentFull extends Characteristic {
    constructor() {
      super('Percent full', '00000118-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatteriePercentFull = enphaseAcBatteriePercentFull;

  class enphaseAcBatterieMaxCellTemp extends Characteristic {
    constructor() {
      super('Max cell temp', '00000119-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: '°C',
        maxValue: 200,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieMaxCellTemp = enphaseAcBatterieMaxCellTemp;

  class enphaseAcBatterieSleepMinSoc extends Characteristic {
    constructor() {
      super('Sleep min soc', '00000121-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: 'min',
        maxValue: 255,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSleepMinSoc = enphaseAcBatterieSleepMinSoc;

  class enphaseAcBatterieSleepMaxSoc extends Characteristic {
    constructor() {
      super('Sleep max soc', '00000122-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: 'min',
        maxValue: 255,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieSleepMaxSoc = enphaseAcBatterieSleepMaxSoc;

  class enphaseAcBatterieStatus extends Characteristic {
    constructor() {
      super('Status', '00000123-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieStatus = enphaseAcBatterieStatus;

  class enphaseAcBatterieFirmware extends Characteristic {
    constructor() {
      super('Firmware', '00000124-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseAcBatterieFirmware = enphaseAcBatterieFirmware;

  class enphaseAcBatterieLastReportDate extends Characteristic {
    constructor() {
      super('Last report', '00000125-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
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
        format: Formats.INT,
        unit: 'W',
        maxValue: 1000,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterPower = enphaseMicroinverterPower;

  class enphaseMicroinverterPowerMax extends Characteristic {
    constructor() {
      super('Power peak', '00000132-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.INT,
        unit: 'W',
        maxValue: 1000,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterPowerMax = enphaseMicroinverterPowerMax;

  class enphaseMicroinverterProducing extends Characteristic {
    constructor() {
      super('Producing', '00000133-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterProducing = enphaseMicroinverterProducing;

  class enphaseMicroinverterCommunicating extends Characteristic {
    constructor() {
      super('Communicating', '00000134-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterCommunicating = enphaseMicroinverterCommunicating;

  class enphaseMicroinverterProvisioned extends Characteristic {
    constructor() {
      super('Provisioned', '00000135-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterProvisioned = enphaseMicroinverterProvisioned;

  class enphaseMicroinverterOperating extends Characteristic {
    constructor() {
      super('Operating', '00000136-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterOperating = enphaseMicroinverterOperating;

  class enphaseMicroinverterCommLevel extends Characteristic {
    constructor() {
      super('PLC level', '00000137-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterCommLevel = enphaseMicroinverterCommLevel;

  class enphaseMicroinverterStatus extends Characteristic {
    constructor() {
      super('Status', '00000138-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterStatus = enphaseMicroinverterStatus;

  class enphaseMicroinverterFirmware extends Characteristic {
    constructor() {
      super('Firmware', '00000139-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterFirmware = enphaseMicroinverterFirmware;

  class enphaseMicroinverterLastReportDate extends Characteristic {
    constructor() {
      super('Last report', '00000141-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterLastReportDate = enphaseMicroinverterLastReportDate;

  class enphaseMicroinverterGridProfile extends Characteristic {
    constructor() {
      super('Grid profile', '00000142-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseMicroinverterGridProfile = enphaseMicroinverterGridProfile;

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
      this.addOptionalCharacteristic(Characteristic.enphaseMicroinverterGridProfile);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseMicroinverterService = enphaseMicroinverterService;

  //Encharge
  class enphaseEnchargeAdminStateStr extends Characteristic {
    constructor() {
      super('Charge status', '00000151-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeAdminStateStr = enphaseEnchargeAdminStateStr;

  class enphaseEnchargeCommunicating extends Characteristic {
    constructor() {
      super('Communicating', '00000152-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeCommunicating = enphaseEnchargeCommunicating;

  class enphaseEnchargeOperating extends Characteristic {
    constructor() {
      super('Operating', '00000153-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeOperating = enphaseEnchargeOperating;

  class enphaseEnchargeCommLevelSubGhz extends Characteristic {
    constructor() {
      super('Sub GHz level', '00000154-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeCommLevelSubGhz = enphaseEnchargeCommLevelSubGhz

  class enphaseEnchargeCommLevel24Ghz extends Characteristic {
    constructor() {
      super('2.4GHz level', '00000155-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeCommLevel24Ghz = enphaseEnchargeCommLevel24Ghz;

  class enphaseEnchargeSleepEnabled extends Characteristic {
    constructor() {
      super('Sleep enabled', '00000156-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeSleepEnabled = enphaseEnchargeSleepEnabled;

  class enphaseEnchargePercentFull extends Characteristic {
    constructor() {
      super('Percent full', '00000157-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargePercentFull = enphaseEnchargePercentFull;

  class enphaseEnchargeTemperature extends Characteristic {
    constructor() {
      super('Temperature', '00000158-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: '°C',
        maxValue: 200,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeTemperature = enphaseEnchargeTemperature;

  class enphaseEnchargeMaxCellTemp extends Characteristic {
    constructor() {
      super('Max cell temp', '00000159-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: '°C',
        maxValue: 200,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeMaxCellTemp = enphaseEnchargeMaxCellTemp;

  class enphaseEnchargeLedStatus extends Characteristic {
    constructor() {
      super('LED status', '00000161-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeLedStatus = enphaseEnchargeLedStatus;

  class enphaseEnchargeRealPowerW extends Characteristic {
    constructor() {
      super('Real power', '00000162-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeRealPowerW = enphaseEnchargeRealPowerW;

  class enphaseEnchargeCapacity extends Characteristic {
    constructor() {
      super('Capacity', '00000163-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kWh',
        maxValue: 100000000,
        minValue: -100000000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeCapacity = enphaseEnchargeCapacity;

  class enphaseEnchargeDcSwitchOff extends Characteristic {
    constructor() {
      super('DC switch OFF', '00000164-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeDcSwitchOff = enphaseEnchargeDcSwitchOff;

  class enphaseEnchargeRev extends Characteristic {
    constructor() {
      super('Revision', '00000165-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: '',
        maxValue: 255,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeRev = enphaseEnchargeRev;

  class enphaseEnchargeGridProfile extends Characteristic {
    constructor() {
      super('Grid profile', '00000166-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeGridProfile = enphaseEnchargeGridProfile;

  class enphaseEnchargeStatus extends Characteristic {
    constructor() {
      super('Status', '00000167-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeStatus = enphaseEnchargeStatus;

  class enphaseEnchargeLastReportDate extends Characteristic {
    constructor() {
      super('Last report', '00000168-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnchargeLastReportDate = enphaseEnchargeLastReportDate;

  class enphaseEnchargeCommLevel extends Characteristic {
    constructor() {
      super('PLC level', '00000169-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
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
      this.addOptionalCharacteristic(Characteristic.enphaseEnchargeGridProfile);
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
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerAdminStateStr = enphaseEnpowerAdminStateStr;

  class enphaseEnpowerCommunicating extends Characteristic {
    constructor() {
      super('Communicating', '00000172-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerCommunicating = enphaseEnpowerCommunicating;

  class enphaseEnpowerOperating extends Characteristic {
    constructor() {
      super('Operating', '00000173-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerOperating = enphaseEnpowerOperating;

  class enphaseEnpowerCommLevelSubGhz extends Characteristic {
    constructor() {
      super('Sub GHz level', '00000174-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerCommLevelSubGhz = enphaseEnpowerCommLevelSubGhz;

  class enphaseEnpowerCommLevel24Ghz extends Characteristic {
    constructor() {
      super('2.4GHz level', '00000175-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerCommLevel24Ghz = enphaseEnpowerCommLevel24Ghz;

  class enphaseEnpowerTemperature extends Characteristic {
    constructor() {
      super('Temperature', '00000176-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: '°C',
        maxValue: 200,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerTemperature = enphaseEnpowerTemperature;

  class enphaseEnpowerMainsAdminState extends Characteristic {
    constructor() {
      super('Admin state', '00000177-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerMainsAdminState = enphaseEnpowerMainsAdminState;

  class enphaseEnpowerMainsOperState extends Characteristic {
    constructor() {
      super('Operating state', '00000178-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerMainsOperState = enphaseEnpowerMainsOperState;

  class enphaseEnpowerEnpwrGridMode extends Characteristic {
    constructor() {
      super('Grid mode', '00000179-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerEnpwrGridMode = enphaseEnpowerEnpwrGridMode;

  class enphaseEnpowerEnchgGridMode extends Characteristic {
    constructor() {
      super('Encharge grid mode', '00000181-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerEnchgGridMode = enphaseEnpowerEnchgGridMode;

  class enphaseEnpowerGridProfile extends Characteristic {
    constructor() {
      super('Grid profile', '00000182-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerGridProfile = enphaseEnpowerGridProfile;

  class enphaseEnpowerStatus extends Characteristic {
    constructor() {
      super('Status', '00000183-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnpowerStatus = enphaseEnpowerStatus;

  class enphaseEnpowerLastReportDate extends Characteristic {
    constructor() {
      super('Last report', '00000184-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
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
        format: Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusRestPower = enphaseEnsembleStatusRestPower;

  class enphaseEnsembleStatusFreqBiasHz extends Characteristic {
    constructor() {
      super('Frequency bias L1', '00000191-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'Hz',
        maxValue: 10000,
        minValue: -10000,
        minStep: 0.01,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusFreqBiasHz = enphaseEnsembleStatusFreqBiasHz;

  class enphaseEnsembleStatusVoltageBiasV extends Characteristic {
    constructor() {
      super('Voltage bias L1', '00000192-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'V',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusVoltageBiasV = enphaseEnsembleStatusVoltageBiasV;

  class enphaseEnsembleStatusFreqBiasHzQ8 extends Characteristic {
    constructor() {
      super('Frequency bias Q8 L1', '00000193-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'Hz',
        maxValue: 10000,
        minValue: -10000,
        minStep: 0.01,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusFreqBiasHzQ8 = enphaseEnsembleStatusFreqBiasHzQ8;

  class enphaseEnsembleStatusVoltageBiasVQ5 extends Characteristic {
    constructor() {
      super('Voltage bias Q5 L1', '00000194-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'V',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusVoltageBiasVQ5 = enphaseEnsembleStatusVoltageBiasVQ5;

  class enphaseEnsembleStatusFreqBiasHzPhaseB extends Characteristic {
    constructor() {
      super('Frequency bias L2', '00000195-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'Hz',
        maxValue: 10000,
        minValue: -10000,
        minStep: 0.01,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusFreqBiasHzPhaseB = enphaseEnsembleStatusFreqBiasHzPhaseB;

  class enphaseEnsembleStatusVoltageBiasVPhaseB extends Characteristic {
    constructor() {
      super('Voltage bias L2', '00000196-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'V',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusVoltageBiasVPhaseB = enphaseEnsembleStatusVoltageBiasVPhaseB;

  class enphaseEnsembleStatusFreqBiasHzQ8PhaseB extends Characteristic {
    constructor() {
      super('Frequency bias Q8 L2', '00000197-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'Hz',
        maxValue: 10000,
        minValue: -10000,
        minStep: 0.01,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusFreqBiasHzQ8PhaseB = enphaseEnsembleStatusFreqBiasHzQ8PhaseB;

  class enphaseEnsembleStatusVoltageBiasVQ5PhaseB extends Characteristic {
    constructor() {
      super('Voltage bias Q5 L2', '00000198-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'V',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusVoltageBiasVQ5PhaseB = enphaseEnsembleStatusVoltageBiasVQ5PhaseB;

  class enphaseEnsembleStatusFreqBiasHzPhaseC extends Characteristic {
    constructor() {
      super('Frequency bias L3', '00000199-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'Hz',
        maxValue: 10000,
        minValue: -10000,
        minStep: 0.01,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusFreqBiasHzPhaseC = enphaseEnsembleStatusFreqBiasHzPhaseC;

  class enphaseEnsembleStatusVoltageBiasVPhaseC extends Characteristic {
    constructor() {
      super('Voltage bias L3', '00000200-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'V',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusVoltageBiasVPhaseC = enphaseEnsembleStatusVoltageBiasVPhaseC;

  class enphaseEnsembleStatusFreqBiasHzQ8PhaseC extends Characteristic {
    constructor() {
      super('Frequency bias Q8 L3', '00000201-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'Hz',
        maxValue: 10000,
        minValue: -10000,
        minStep: 0.01,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusFreqBiasHzQ8PhaseC = enphaseEnsembleStatusFreqBiasHzQ8PhaseC;

  class enphaseEnsembleStatusVoltageBiasVQ5PhaseC extends Characteristic {
    constructor() {
      super('Voltage bias Q5 L3', '00000202-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'V',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusVoltageBiasVQ5PhaseC = enphaseEnsembleStatusVoltageBiasVQ5PhaseC;

  class enphaseEnsembleStatusConfiguredBackupSoc extends Characteristic {
    constructor() {
      super('Configured backup SoC', '00000203-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusConfiguredBackupSoc = enphaseEnsembleStatusConfiguredBackupSoc;

  class enphaseEnsembleStatusAdjustedBackupSoc extends Characteristic {
    constructor() {
      super('Adjusted backup SoC', '00000204-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusAdjustedBackupSoc = enphaseEnsembleStatusAdjustedBackupSoc;

  class enphaseEnsembleStatusAggSoc extends Characteristic {
    constructor() {
      super('AGG SoC', '00000205-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusAggSoc = enphaseEnsembleStatusAggSoc;

  class enphaseEnsembleStatusAggMaxEnergy extends Characteristic {
    constructor() {
      super('AGG max energy', '00000206-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kWh',
        maxValue: 100000000,
        minValue: -100000000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusAggMaxEnergy = enphaseEnsembleStatusAggMaxEnergy;

  class enphaseEnsembleStatusEncAggSoc extends Characteristic {
    constructor() {
      super('ENC SoC', '00000207-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusEncAggSoc = enphaseEnsembleStatusEncAggSoc;

  class enphaseEnsembleStatusEncAggRatedPower extends Characteristic {
    constructor() {
      super('ENC rated power', '00000208-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusEncAggRatedPower = enphaseEnsembleStatusEncAggRatedPower;

  class enphaseEnsembleStatusEncAggPercentFull extends Characteristic {
    constructor() {
      super('ENC percent full', '00000211-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusEncAggPercentFull = enphaseEnsembleStatusEncAggPercentFull;

  class enphaseEnsembleStatusEncAggBackupEnergy extends Characteristic {
    constructor() {
      super('ENC backup energy', '00000209-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kWh',
        maxValue: 100000000,
        minValue: -100000000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatusEncAggBackupEnergy = enphaseEnsembleStatusEncAggBackupEnergy;

  class enphaseEnsembleStatusEncAggAvailEnergy extends Characteristic {
    constructor() {
      super('ENC available energy', '00000210-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kWh',
        maxValue: 100000000,
        minValue: -100000000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
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
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusEncAggPercentFull);
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
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseWirelessConnectionKitType = enphaseWirelessConnectionKitType;

  class enphaseWirelessConnectionKitConnected extends Characteristic {
    constructor() {
      super('Connected', '00000221-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseWirelessConnectionKitConnected = enphaseWirelessConnectionKitConnected;

  class enphaseWirelessConnectionKitSignalStrength extends Characteristic {
    constructor() {
      super('Signal strength', '00000222-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseWirelessConnectionKitSignalStrength = enphaseWirelessConnectionKitSignalStrength;

  class enphaseWirelessConnectionKitSignalStrengthMax extends Characteristic {
    constructor() {
      super('Signal strength max', '00000223-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
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
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseWirelessConnectionKitService = enphaseWirelessConnectionKitService;

  //Esub
  class enphaseEnsembleProducing extends Characteristic {
    constructor() {
      super('Producing', '00000230-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleProducing = enphaseEnsembleProducing;

  class enphaseEnsembleCommunicating extends Characteristic {
    constructor() {
      super('Communicating', '00000231-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleCommunicating = enphaseEnsembleCommunicating;


  class enphaseEnsembleOperating extends Characteristic {
    constructor() {
      super('Operating', '00000232-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.BOOL,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleOperating = enphaseEnsembleOperating;

  class enphaseEnsembleCommLevel extends Characteristic {
    constructor() {
      super('PLC level', '00000233-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.UINT8,
        unit: Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleCommLevel = enphaseEnsembleCommLevel;

  class enphaseEnsembleStatus extends Characteristic {
    constructor() {
      super('Status', '00000234-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleStatus = enphaseEnsembleStatus;

  class enphaseEnsembleFirmware extends Characteristic {
    constructor() {
      super('Firmware', '00000235-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleFirmware = enphaseEnsembleFirmware;

  class enphaseEnsembleLastReportDate extends Characteristic {
    constructor() {
      super('Last report', '00000236-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleLastReportDate = enphaseEnsembleLastReportDate;

  //eusb service
  class enphaseEnsembleService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000011-000B-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseEnsembleProducing);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleCommunicating);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleOperating);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleCommLevel);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatus);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleFirmware);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleLastReportDate);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseEnsembleService = enphaseEnsembleService;

  //enphase live data 
  class enphaseLiveDataActivePower extends Characteristic {
    constructor() {
      super('Active power', '00000240-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataActivePower = enphaseLiveDataActivePower;

  class enphaseLiveDataActivePowerL1 extends Characteristic {
    constructor() {
      super('Active power L1', '00000241-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataActivePowerL1 = enphaseLiveDataActivePowerL1;


  class enphaseLiveDataActivePowerL2 extends Characteristic {
    constructor() {
      super('Active power L2', '00000242-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataActivePowerL2 = enphaseLiveDataActivePowerL2;


  class enphaseLiveDataActivePowerL3 extends Characteristic {
    constructor() {
      super('Active power L3', '00000243-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kW',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataActivePowerL3 = enphaseLiveDataActivePowerL3;


  class enphaseLiveDataApparentPower extends Characteristic {
    constructor() {
      super('Apparent power', '00000244-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataApparentPower = enphaseLiveDataApparentPower;

  class enphaseLiveDataApparentPowerL1 extends Characteristic {
    constructor() {
      super('Apparent power L1', '00000245-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataApparentPowerL1 = enphaseLiveDataApparentPowerL1;

  class enphaseLiveDataApparentPowerL2 extends Characteristic {
    constructor() {
      super('Apparent power L2', '00000246-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataApparentPowerL2 = enphaseLiveDataApparentPowerL2;

  class enphaseLiveDataApparentPowerL3 extends Characteristic {
    constructor() {
      super('Apparent power L3', '00000247-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.FLOAT,
        unit: 'kVA',
        maxValue: 1000,
        minValue: -1000,
        minStep: 0.001,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseLiveDataApparentPowerL3 = enphaseLiveDataApparentPowerL3;

  //live data service
  class enphaseLiveDataService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000012-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseLiveDataActivePower);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataActivePowerL1);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataActivePowerL2);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataActivePowerL3);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataApparentPower);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataApparentPowerL1);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataApparentPowerL2);
      this.addOptionalCharacteristic(Characteristic.enphaseLiveDataApparentPowerL3);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseLiveDataService = enphaseLiveDataService;

  //generator
  class enphaseEnsembleGeneratorAdminMode extends Characteristic {
    constructor() {
      super('Admin mode', '00000250-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleGeneratorAdminMode = enphaseEnsembleGeneratorAdminMode;

  class enphaseEnsembleGeneratorType extends Characteristic {
    constructor() {
      super('Type', '00000251-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleGeneratorType = enphaseEnsembleGeneratorType;

  class enphaseEnsembleGeneratorAdminState extends Characteristic {
    constructor() {
      super('Admin state', '00000252-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleGeneratorAdminState = enphaseEnsembleGeneratorAdminState;

  class enphaseEnsembleGeneratorOperState extends Characteristic {
    constructor() {
      super('Operation state', '00000253-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleGeneratorOperState = enphaseEnsembleGeneratorOperState;

  class enphaseEnsembleGeneratorStartSoc extends Characteristic {
    constructor() {
      super('Start soc', '00000254-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.INT,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleGeneratorStartSoc = enphaseEnsembleGeneratorStartSoc;

  class enphaseEnsembleGeneratorStopSoc extends Characteristic {
    constructor() {
      super('Stop soc', '00000255-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.INT,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleGeneratorStopSoc = enphaseEnsembleGeneratorStopSoc;

  class enphaseEnsembleGeneratorExexOn extends Characteristic {
    constructor() {
      super('Exec on', '00000256-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.INT,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleGeneratorExexOn = enphaseEnsembleGeneratorExexOn;

  class enphaseEnsembleGeneratorShedule extends Characteristic {
    constructor() {
      super('Schedule', '00000257-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.INT,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleGeneratorShedule = enphaseEnsembleGeneratorShedule;

  class enphaseEnsembleGeneratorPresent extends Characteristic {
    constructor() {
      super('Present', '00000258-000B-1000-8000-0026BB765291');
      this.setProps({
        format: Formats.INT,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    }
  }
  Characteristic.enphaseEnsembleGeneratorPresent = enphaseEnsembleGeneratorPresent;


  //generator service
  class enphaseGerneratorService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000013-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseEnsembleGeneratorAdminMode);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleGeneratorType);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleGeneratorAdminState);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleGeneratorOperState);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleGeneratorStartSoc);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleGeneratorStopSoc);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleGeneratorExexOn);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleGeneratorShedule);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleGeneratorPresent);
      this.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
  }
  Service.enphaseGerneratorService = enphaseGerneratorService;

  api.registerPlatform(CONSTANTS.PluginName, CONSTANTS.PlatformName, EnvoyPlatform, true);
}
