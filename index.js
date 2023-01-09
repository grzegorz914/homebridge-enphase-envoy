'use strict';
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const https = require('https');
const axios = require('axios');
const parseString = require('xml2js').parseStringPromise;
const AxiosDigestAuth = require('./src/digestAuth.js');
const PasswdCalc = require('./src/passwdCalc.js');
const Mqtt = require('./src/mqtt.js');

const PLUGIN_NAME = 'homebridge-enphase-envoy';
const PLATFORM_NAME = 'enphaseEnvoy';
const CONSTANS = require('./src/constans.json');

let Accessory, Characteristic, Service, Categories, UUID;

module.exports = (api) => {
  Accessory = api.platformAccessory;
  Characteristic = api.hap.Characteristic;
  Service = api.hap.Service;
  Categories = api.hap.Categories;
  UUID = api.hap.uuid;

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
      super('Devices and level', '00000014-000B-1000-8000-0026BB765291');
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
      super('Q-Relays and level', '00000015-000B-1000-8000-0026BB765291');
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
      super('Microinverters and level', '00000016-000B-1000-8000-0026BB765291');
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
      super('AC Batteries and level', '00000017-000B-1000-8000-0026BB765291');
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
      super('Encharges and level', '00000018-000B-1000-8000-0026BB765291');
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
    }
  }
  Service.enphaseEnpowerService = enphaseEnpowerService;

  //Ensemble status summary
  class enphaseEnsembleStatusFreqBiasHz extends Characteristic {
    constructor() {
      super('Frequency bias', '00000191-000B-1000-8000-0026BB765291');
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
      super('Voltage bias', '00000192-000B-1000-8000-0026BB765291');
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
      super('Frequency bias Q8', '00000193-000B-1000-8000-0026BB765291');
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
      super('Voltage bias Q5', '00000194-000B-1000-8000-0026BB765291');
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

  class enphaseEnsembleStatusConfiguredBackupSoc extends Characteristic {
    constructor() {
      super('Configured backup SoC', '00000195-000B-1000-8000-0026BB765291');
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
      super('Adjusted backup SoC', '00000196-000B-1000-8000-0026BB765291');
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
      super('AGG SoC', '00000197-000B-1000-8000-0026BB765291');
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

  class enphaseEnsembleStatusAggBackupEnergy extends Characteristic {
    constructor() {
      super('AGG backup energy', '00000198-000B-1000-8000-0026BB765291');
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
  Characteristic.enphaseEnsembleStatusAggBackupEnergy = enphaseEnsembleStatusAggBackupEnergy;

  class enphaseEnsembleStatusAggAvailEnergy extends Characteristic {
    constructor() {
      super('AGG available energy', '00000199-000B-1000-8000-0026BB765291');
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
  Characteristic.enphaseEnsembleStatusAggAvailEnergy = enphaseEnsembleStatusAggAvailEnergy;

  //Enpower service
  class enphaseEnsembleStatusService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000009-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHz);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasV);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusConfiguredBackupSoc);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusAdjustedBackupSoc);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusAggSoc);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusAggBackupEnergy);
      this.addOptionalCharacteristic(Characteristic.enphaseEnsembleStatusAggAvailEnergy);
    }
  }
  Service.enphaseEnsembleStatusService = enphaseEnsembleStatusService;

  //Wireless connection kit
  class enphaseWirelessConnectionKitType extends Characteristic {
    constructor() {
      super('Type', '00000210-000B-1000-8000-0026BB765291');
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
      super('Connected', '00000211-000B-1000-8000-0026BB765291');
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
      super('Signal strength', '00000212-000B-1000-8000-0026BB765291');
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
      super('Signal strength max', '00000213-000B-1000-8000-0026BB765291');
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
      super('Producing', '00000220-000B-1000-8000-0026BB765291');
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
      super('Communicating', '00000221-000B-1000-8000-0026BB765291');
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
      super('Operating', '00000222-000B-1000-8000-0026BB765291');
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
      super('PLC level', '00000223-000B-1000-8000-0026BB765291');
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
      super('Status', '00000224-000B-1000-8000-0026BB765291');
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
      super('Firmware', '00000225-000B-1000-8000-0026BB765291');
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
      super('Last report', '00000226-000B-1000-8000-0026BB765291');
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
    }
  }
  Service.enphaseEsubService = enphaseEsubService;

  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, envoyPlatform, true);
}

class envoyPlatform {
  constructor(log, config, api) {
    // only load if configured
    if (!config || !Array.isArray(config.devices)) {
      log(`No configuration found for ${PLUGIN_NAME}`);
      return;
    }
    this.log = log;
    this.api = api;
    this.accessories = [];
    const devices = config.devices;

    this.api.on('didFinishLaunching', () => {
      this.log.debug('didFinishLaunching');
      for (const device of devices) {
        if (!device.name) {
          this.log.warn('Device name missing!');
          return;
        } else {
          new envoyDevice(this.log, device, this.api);
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

    //device configuration
    this.name = config.name;
    this.host = config.host || 'envoy.local';

    this.disableLogInfo = config.disableLogInfo || false;
    this.disableLogDeviceInfo = config.disableLogDeviceInfo || false;
    this.enableDebugMode = config.enableDebugMode || false;
    this.envoyPasswd = config.envoyPasswd;
    this.envoyFirmware7xx = config.envoyFirmware7xx || false;
    this.envoyFirmware7xxToken = config.envoyFirmware7xxToken;
    this.productionPowerPeakAutoReset = config.powerProductionMaxAutoReset || 0;
    this.productionPowerPeakDetectedPower = config.powerProductionMaxDetected || 0;
    this.productionEnergyLifetimeOffset = config.energyProductionLifetimeOffset || 0;
    this.consumptionTotalPowerPeakAutoReset = config.powerConsumptionTotalMaxAutoReset || 0;
    this.consumptionTotalPowerPeakDetectedPower = config.powerConsumptionTotalMaxDetected || 0;
    this.consumptionTotalEnergyLifetimeOffset = config.energyConsumptionTotalLifetimeOffset || 0;
    this.consumptionNetPowerPeakAutoReset = config.powerConsumptionNetMaxAutoReset || 0;
    this.consumptionNetPowerPeakDetectedPower = config.powerConsumptionNetMaxDetected || 0;
    this.consumptionNetEnergyLifetimeOffset = config.energyConsumptionNetLifetimeOffset || 0;
    this.supportProductionPowerMode = config.supportProductionPowerMode || false;
    this.supportPlcLevel = config.supportPlcLevel || false;
    this.mqttEnabled = config.enableMqtt || false;
    this.mqttHost = config.mqttHost;
    this.mqttPort = config.mqttPort || 1883;
    this.mqttPrefix = config.mqttPrefix;
    this.mqttAuth = config.mqttAuth || false;
    this.mqttUser = config.mqttUser;
    this.mqttPasswd = config.mqttPasswd;
    this.mqttDebug = config.mqttDebug || false;

    //setup variables
    this.checkDeviceInfo = true;
    this.checkCommLevel = false;
    this.startPrepareAccessory = true;

    //power mode
    this.productionPowerMode = false;

    //envoy
    this.envoyDevId = '';
    this.envoySerialNumber = '';
    this.envoyFirmware = '';
    this.envoySoftwareBuildEpoch = 0;
    this.envoyIsEnvoy = false;
    this.envoyAlerts = '';
    this.envoyDbSize = 0;
    this.envoyDbPercentFull = 0;
    this.envoyTariff = '';
    this.envoyPrimaryInterface = '';
    this.envoyNetworkInterfacesCount = 0;
    this.envoyInterfaceCellular = false;
    this.envoyInterfaceLan = false;
    this.envoyInterfaceWlan = false;
    this.envoyInterfaceStartIndex = 0;
    this.envoyWebComm = false;
    this.envoyEverReportedToEnlighten = false;
    this.envoyCommNum = 0;
    this.envoyCommLevel = 0;
    this.envoyCommPcuNum = 0;
    this.envoyCommPcuLevel = 0;
    this.envoyCommAcbNum = 0;
    this.envoyCommAcbLevel = 0;
    this.envoyCommNsrbNum = 0;
    this.envoyCommNsrbLevel = 0;
    this.envoyCommEsubNum = 0;
    this.envoyCommEsubLevel = 0;
    this.envoyCommEnchgNum = 0;
    this.envoyCommEnchgLevel = 0
    this.envoyUpdateStatus = '';
    this.envoyTimeZone = '';
    this.envoyCurrentDate = '';
    this.envoyCurrentTime = '';
    this.envoyLastEnlightenReporDate = 0;

    //envoy section ensemble
    this.wirelessConnectionKitSupported = false;
    this.wirelessConnectionKitInstalled = false;
    this.wirelessConnectionKitConnectionsCount = 0;
    this.envoyCommEnchgLevel24g = 0;
    this.envoyCommEnchagLevelSubg = 0;
    this.envoyEnpowerConnected = false;
    this.envoyEnpowerGridStatus = '';

    //microinverters
    this.microinvertersSupported = false;
    this.microinvertersInstalled = false;
    this.microinvertersCount = 0;
    this.microinvertersType = ''

    //qrelay
    this.qRelaysSupported = false;
    this.qRelaysInstalled = false;
    this.qRelaysCount = 0;
    this.qRelaysType = ''

    //ac batterie
    this.acBatteriesSupported = false;
    this.acBatteriesInstalled = false;
    this.acBatteriesCount = 0;
    this.acBatteriesType = ''


    //ensemble esub
    this.esubsSupported = false;
    this.esubsInstalled = false;
    this.esubsCount = 0;
    this.esubsType = ''

    //encharges
    this.enchargesSupported = false;
    this.enchargesInstalled = false;
    this.enchargesCount = 0;
    this.enchargesType = ''

    //enpower
    this.enpowersSupported = false;
    this.enpowersInstalled = false;
    this.enpowersCount = 0;
    this.enpowersType = ''

    //ct meters
    this.metersSupported = false;
    this.metersInstalled = false;
    this.metersCount = 0;
    this.metersProductionEnabled = false;
    this.metersProductionVoltageDivide = 1;
    this.metersConsumptionEnabled = false;
    this.metersConsumpionVoltageDivide = 1;
    this.metersConsumptionCount = 0;
    this.metersReadingInstalled = false;
    this.metersReadingCount = 0;
    this.metersReadingPhaseCount = 0;

    //production
    this.productionMicroSummarywhToday = 0;
    this.productionMicroSummarywhLastSevenDays = 0;
    this.productionMicroSummarywhLifeTime = 0;
    this.productionMicroSummaryWattsNow = 0;

    //production CT
    this.productionMeasurmentType = '';
    this.productionActiveCount = 0;
    this.productionPower = 0;
    this.productionPowerPeak = 0;
    this.productionPowerPeakDetected = false;
    this.productionEnergyToday = 0;
    this.productionEnergyLastSevenDays = 0;
    this.productionEnergyLifeTime = 0;
    this.productionRmsCurrent = 0;
    this.productionRmsVoltage = 0;
    this.productionReactivePower = 0;
    this.productionApparentPower = 0;
    this.productionPwrFactor = 0;
    this.productionReadingTime = '';

    //ac batteries summary
    this.acBatteriesSummaryType = '';
    this.acBatteriesSummaryActiveCount = 0;
    this.acBatteriesSummaryReadingTime = '';
    this.acBatteriesSummaryPower = 0;
    this.acBatteriesSummaryEnergy = 0;
    this.acBatteriesSummaryState = '';
    this.acBatteriesSummaryPercentFull = 0;

    //ensemble status summary
    this.ensembleStatusInstalled = false;
    this.ensembleFreqBiasHz = 0;
    this.ensembleVoltageBiasV = 0;
    this.ensembleFreqBiasHzQ8 = 0;
    this.ensembleVoltageBiasVQ5 = 0;
    this.ensembleConfiguredBackupSoc = 0;
    this.ensembleAdjustedBackupSoc = 0;
    this.ensembleAggSoc = 0;
    this.ensembleAggBackupEnergy = 0;
    this.ensembleAggAvailEnergy = 0;
    this.ensembleGridProfileName = '';
    this.ensembleId = '';
    this.ensembleGridProfileVersion = '';
    this.ensembleItemCount = 0;
    this.ensembleFakeInventoryMode = false;

    //current day of week/month
    const date = new Date();
    this.currentDayOfWeek = date.getDay();
    this.currentDayOfMonth = date.getDate();

    //check the directory and files exists, if not then create it
    this.prefDir = path.join(api.user.storagePath(), 'enphaseEnvoy');
    this.envoyIdFile = (`${this.prefDir}/envoyId_${this.host.split('.').join('')}`);
    this.productionPowerPeakFile = (`${this.prefDir}/productionPowerPeak_${this.host.split('.').join('')}`);
    this.consumptionNetPowerPeakFile = (`${this.prefDir}/consumptionNetPowerPeak_${this.host.split('.').join('')}`);
    this.consumptionTotalPowerPeakFile = (`${this.prefDir}/consumptionTotalPowerPeak_${this.host.split('.').join('')}`);

    try {
      const files = [
        this.envoyIdFile,
        this.productionPowerPeakFile,
        this.consumptionNetPowerPeakFile,
        this.consumptionTotalPowerPeakFile,
      ];

      if (!fs.existsSync(this.prefDir)) {
        fs.mkdirSync(this.prefDir);
      }

      files.forEach((file) => {
        if (!fs.existsSync(file)) {
          fs.writeFileSync(file, '0');
        }
      });
    } catch (error) {
      this.log.error(`Device: ${this.host} ${this.name}, prepare directory and files error: ${error}`);
    }

    //create axios instance
    this.url = this.envoyFirmware7xx ? `https://${this.host}` : `http://${this.host}`;
    this.axiosInstanceToken = axios.create({
      method: 'GET',
      baseURL: this.url,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.envoyFirmware7xxToken}`
      },
      withCredentials: true,
      httpsAgent: new https.Agent({
        keepAlive: true,
        rejectUnauthorized: false
      })
    });

    this.axiosInstance = axios.create({
      method: 'GET',
      baseURL: this.url,
      headers: {
        Accept: 'application/json'
      }
    });

    //password calc
    this.passwdCalc = new PasswdCalc({
      user: CONSTANS.InstallerUser,
      realm: CONSTANS.Realm
    });

    //mqtt client
    this.mqtt = new Mqtt({
      enabled: this.mqttEnabled,
      host: this.mqttHost,
      port: this.mqttPort,
      prefix: this.mqttPrefix,
      topic: this.name,
      auth: this.mqttAuth,
      user: this.mqttUser,
      passwd: this.mqttPasswd,
      debug: this.mqttDebug
    });

    this.mqtt.on('connected', (message) => {
      this.log(`Device: ${this.host} ${this.name}, ${message}`);
    })
      .on('error', (error) => {
        this.log.error(`Device: ${this.host} ${this.name}, ${error}`);
      })
      .on('debug', (message) => {
        this.log(`Device: ${this.host} ${this.name}, debug: ${message}`);
      })
      .on('message', (message) => {
        this.log(`Device: ${this.host} ${this.name}, ${message}`);
      })
      .on('disconnected', (message) => {
        this.log(`Device: ${this.host} ${this.name}, ${message}`);
      });

    this.envoyFirmware7xx ? this.checkJwtToken() : this.updateEnvoyBackboneAppData();
  }

  reconnect() {
    setTimeout(() => {
      this.envoyFirmware7xx ? this.checkJwtToken() : this.updateEnvoyBackboneAppData();
    }, 15000)
  };

  updateHome() {
    setTimeout(() => {
      this.updateHomeData();
    }, 45000)
  };

  updateMetersReading() {
    setTimeout(() => {
      this.updateMetersReadingData();
    }, 1500)
  };

  updateLive() {
    setTimeout(() => {
      this.updateLiveData();
    }, 2500)
  };

  updateEnsembleInventory() {
    setTimeout(() => {
      this.updateEnsembleInventoryData();
    }, 25000)
  };

  updateProduction() {
    setTimeout(() => {
      this.updateProductionData();
    }, 30000)
  };

  updateProductionCt() {
    setTimeout(() => {
      this.updateProductionCtData();
    }, 5000)
  };

  updateMicroinverters() {
    setTimeout(() => {
      this.updateMicroinvertersData();
    }, 40000)
  };

  async checkJwtToken() {
    this.log.debug(`Device: ${this.host} ${this.name}, validate jwt token.`);

    try {
      const jwtTokenData = await this.axiosInstanceToken(CONSTANS.ApiUrls.CheckJwt);
      const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug validate jwt token: ${jwtTokenData.data}, ${jwtTokenData.headers}`) : false;
      const cookie = jwtTokenData.headers['set-cookie'];

      //create axios instance with cookie
      this.axiosInstanceCookie = axios.create({
        method: 'GET',
        baseURL: this.url,
        headers: {
          Accept: 'application/json',
          Cookie: cookie
        },
        withCredentials: true,
        httpsAgent: new https.Agent({
          keepAlive: true,
          rejectUnauthorized: false
        })
      })

      await this.updateEnvoyBackboneAppData();
    } catch (error) {
      this.log.error(`Device: ${this.host} ${this.name}, validate jwt token error: ${error}, reconnect in 15s.`);
      this.checkDeviceInfo = true;
      this.reconnect();
    };
  };

  updateEnvoyBackboneAppData() {
    return new Promise(async (resolve, reject) => {
      this.log.debug(`Device: ${this.host} ${this.name}, requesting envoy backbone app.`);

      try {
        const savedEnvoyId = await fsPromises.readFile(this.envoyIdFile);
        const envoyId = savedEnvoyId.toString();

        // Check if the envoy ID is the correct length
        if (envoyId.length != 9) {
          try {
            const envoyBackboneAppData = this.envoyFirmware7xx ? await this.axiosInstanceCookie(CONSTANS.ApiUrls.BackboneApplication) : await this.axiosInstance(CONSTANS.ApiUrls.BackboneApplication);
            const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug envoy backbone app: ${envoyBackboneAppData.data}`) : false;
            const data = envoyBackboneAppData.data;
            const envoyDevId = data.substr(data.indexOf('envoyDevId:') + 11, 9);
            try {
              await fsPromises.writeFile(this.envoyIdFile, envoyDevId);
              this.envoyDevId = envoyDevId;
              await this.updateInfoData();
              resolve(true);
            } catch (error) {
              this.log.error(`Device: ${this.host} ${this.name}, save envoy id error: ${error}, reconnect in 15s.`);
              this.checkDeviceInfo = true;
              this.reconnect();
              reject(error);
            };
          } catch (error) {
            this.log.error(`Device: ${this.host} ${this.name}, requesting envoyBackboneAppData error: ${error}, reconnect in 15s.`);
            this.checkDeviceInfo = true;
            this.reconnect();
            reject(error);
          };
        } else {
          this.envoyDevId = envoyId;
          await this.updateInfoData();
          resolve(true);
        }
      } catch (error) {
        this.log.error(`Device: ${this.host} ${this.name}, read envoy id from file error: ${error}, reconnect in 15s.`);
        this.checkDeviceInfo = true;
        this.reconnect();
        reject(error);
      };
    });
  };

  updateInfoData() {
    return new Promise(async (resolve, reject) => {
      this.log.debug(`Device: ${this.host} ${this.name}, requesting info.`);

      try {
        const infoData = this.envoyFirmware7xx ? await this.axiosInstanceCookie(CONSTANS.ApiUrls.Info) : await this.axiosInstance(CONSTANS.ApiUrls.Info);
        const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug info: ${JSON.stringify(infoData.data, null, 2)}`) : false;

        if (infoData.status === 200) {
          const parseInfoData = await parseString(infoData.data);
          const debug1 = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug parse info: ${JSON.stringify(parseInfoData, null, 2)}`) : false;

          //envoy info
          const envoyInfo = parseInfoData.envoy_info;
          const time = new Date(envoyInfo.time[0] * 1000).toLocaleString();

          //device
          const device = envoyInfo.device[0];
          const deviceSn = device.sn[0];
          const devicePn = CONSTANS.PartNumbers[device.pn[0]] || 'Envoy'
          const deviceSoftware = device.software[0];
          const deviceEuaid = device.euaid[0];
          const deviceSeqNum = device.seqnum[0];
          const deviceApiVer = device.apiver[0];
          const deviceImeter = (device.imeter[0] === 'true');

          //web tokens
          const webTokens = this.envoyFirmware7xx ? (envoyInfo['web-tokens'][0] === 'true') : false;

          //packages
          const packages = envoyInfo.package;
          packages.forEach(devicePackage => {
            const packageName = devicePackage.$.name;
            const packagePn = devicePackage.pn[0];
            const packageVersion = devicePackage.version[0];
            const packageBuild = devicePackage.build[0];
          });

          //build info
          const build = envoyInfo.build_info[0];
          const buildId = build.build_id[0];
          const buildTimeQmt = new Date(build.build_time_gmt[0] * 1000).toLocaleString();

          //envoy
          this.envoyTime = time;
          this.envoySerialNumber = deviceSn;
          this.envoyModelName = devicePn;
          this.envoyFirmware = deviceSoftware;
          this.metersSupported = deviceImeter;

          //envoy password
          const envoyPasswd = this.envoyPasswd || deviceSn.substring(6);
          const debug2 = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug envoy password: ${envoyPasswd}`) : false;
          this.envoyPasswd = envoyPasswd;

          //installer password
          const installerPasswd = await this.passwdCalc.generatePasswd(deviceSn);
          const debug3 = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug installer password: ${installerPasswd}`) : false;
          this.installerPasswd = installerPasswd;

          //digest authorization installer
          this.digestAuthInstaller = new AxiosDigestAuth({
            user: CONSTANS.InstallerUser,
            passwd: installerPasswd
          });

          const mqtt = this.mqttEnabled ? this.mqtt.send('Info', JSON.stringify(parseInfoData, null, 2)) : false;
          await this.updateHomeData();
          resolve(true);
        }
      } catch (error) {
        this.log.error(`Device: ${this.host} ${this.name}, requesting info error: ${error}, reconnect in 15s.`);
        this.checkDeviceInfo = true;
        this.reconnect();
        reject(error);
      };
    })
  };

  updateHomeData() {
    return new Promise(async (resolve, reject) => {
      this.log.debug(`Device: ${this.host} ${this.name}, requesting home.`);

      try {
        const homeData = this.envoyFirmware7xx ? await this.axiosInstanceCookie(CONSTANS.ApiUrls.Home) : await this.axiosInstance(CONSTANS.ApiUrls.Home);
        const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug home: ${JSON.stringify(homeData.data, null, 2)}`) : false;

        if (homeData.status === 200) {
          const envoy = homeData.data;
          const objKeysEnvoy = Object.keys(envoy);
          const wirelessConnectionKitSupported = objKeysEnvoy.includes('wireless_connection');
          const enpowersSupported = objKeysEnvoy.includes('enpower');

          const objKeysComm = Object.keys(envoy.comm);
          const microinvertersSupported = objKeysComm.includes('pcu');
          const acBatteriesSupported = objKeysComm.includes('acb');
          const qRelaysSupported = objKeysComm.includes('nsrb');
          const esubsSupported = objKeysComm.includes('esub');
          const enchargesSupported = objKeysComm.includes('encharge');

          //envoy
          const softwareBuildEpoch = new Date(envoy.software_build_epoch * 1000).toLocaleString();
          const isEnvoy = (envoy.is_nonvoy === false);
          const dbSize = envoy.db_size;
          const dbPercentFull = envoy.db_percent_full;
          const timeZone = envoy.timezone;
          const currentDate = new Date(envoy.current_date).toLocaleString().slice(0, 11);
          const currentTime = envoy.current_time;

          //network
          const envoyNework = envoy.network;
          const webComm = (envoyNework.web_comm === true);
          const everReportedToEnlighten = (envoyNework.ever_reported_to_enlighten === true);
          const lastEnlightenReporDate = new Date(envoyNework.last_enlighten_report_time * 1000).toLocaleString();
          const primaryInterface = CONSTANS.ApiCodes[envoyNework.primary_interface] || 'undefined';
          const envoyNetworkInterfaces = envoyNework.interfaces;
          const envoyNetworkInterfacesCount = envoyNetworkInterfaces.length;
          if (envoyNetworkInterfacesCount > 0) {
            for (let i = 0; i < envoyNetworkInterfacesCount; i++) {
              const objValues = Object.values(envoyNetworkInterfaces[i]);
              const envoyInterfaceCellular = objValues.includes('cellular');
              const envoyInterfaceLan = objValues.includes('ethernet');
              const envoyInterfaceWlan = objValues.includes('wifi');
              const envoyInterfaceStartIndex = envoyInterfaceCellular ? 1 : 0;

              if (envoyInterfaceCellular) {
                const envoyInterfaceSignalStrength = (envoyNetworkInterfaces[0].signal_strength * 20);
                const envoyInterfaceSignalStrengthMax = (envoyNetworkInterfaces[0].signal_strength_max * 20);
                const envoyInterfaceNetwork = envoyNetworkInterfaces[0].network;
                const envoyInterfaceType = CONSTANS.ApiCodes[envoyNetworkInterfaces[0].type] || 'undefined';
                const envoyInterfaceInterface = envoyNetworkInterfaces[0].interface;
                const envoyInterfaceDhcp = envoyNetworkInterfaces[0].dhcp;
                const envoyInterfaceIp = envoyNetworkInterfaces[0].ip;
                const envoyInterfaceCarrier = (envoyNetworkInterfaces[0].carrier === true);
                this.envoyInterfaceCellular = true;
              }
              if (envoyInterfaceLan) {
                const envoyInterfaceType = CONSTANS.ApiCodes[envoyNetworkInterfaces[envoyInterfaceStartIndex].type] || 'undefined';
                const envoyInterfaceInterface = envoyNetworkInterfaces[envoyInterfaceStartIndex].interface;
                const envoyInterfaceMac = envoyNetworkInterfaces[envoyInterfaceStartIndex].mac;
                const envoyInterfaceDhcp = envoyNetworkInterfaces[envoyInterfaceStartIndex].dhcp;
                const envoyInterfaceIp = envoyNetworkInterfaces[envoyInterfaceStartIndex].ip;
                const envoyInterfaceSignalStrength = (envoyNetworkInterfaces[envoyInterfaceStartIndex].signal_strength * 20);
                const envoyInterfaceSignalStrengthMax = (envoyNetworkInterfaces[envoyInterfaceStartIndex].signal_strength_max * 20);
                const envoyInterfaceCarrier = (envoyNetworkInterfaces[envoyInterfaceStartIndex].carrier === true);
                this.envoyInterfaceLan = true;
              }
              if (envoyInterfaceWlan) {
                const envoyInterfaceSignalStrenth = (envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].signal_strength * 20);
                const envoyInterfaceSignalStrengthMax = (envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].signal_strength_max * 20);
                const envoyInterfaceType = CONSTANS.ApiCodes[envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].type] || 'undefined';
                const envoyInterfaceInterface = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].interface;
                const envoyInterfaceMac = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].mac;
                const envoyInterfaceDhcp = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].dhcp;
                const envoyInterfaceIp = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].ip;
                const envoyInterfaceCarrier = (envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].carrier === true);
                const envoyInterfaceSupported = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].supported;
                const envoyInterfacePresent = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].present;
                const envoyInterfaceConfigured = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].configured;
                const envoyInterfaceStatus = CONSTANS.ApiCodes[envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].status] || 'undefined';
                this.envoyInterfaceWlan = true;
              }
            }
            this.envoyNetworkInterfacesCount = envoyNetworkInterfacesCount;
          }
          const tariff = CONSTANS.ApiCodes[envoy.tariff] || 'undefined';

          //comm
          const comm = envoy.comm;
          const commNum = comm.num;
          const commLevel = (comm.level * 20);
          const commPcuNum = comm.pcu.num;
          const commPcuLevel = (comm.pcu.level * 20);
          const commAcbNum = comm.acb.num;
          const commAcbLevel = (comm.acb.level * 20);
          const commNsrbNum = comm.nsrb.num;
          const commNsrbLevel = (comm.nsrb.level * 20);

          //comm esub
          const commEsub = esubsSupported ? comm.esub : {};
          const commEsubNum = esubsSupported ? commEsub.num : 0;
          const commEsubLevel = esubsSupported ? (commEsub.level * 20) : 0;

          //comm encharge
          const commEncharge = enchargesSupported ? comm.encharge[0] : {};
          const commEnchgNum = enchargesSupported ? commEncharge.num : 0;
          const commEnchgLevel = enchargesSupported ? (commEncharge.level * 20) : 0;
          const commEnchgLevel24g = enchargesSupported ? (commEncharge.level_24g * 20) : 0;
          const commEnchagLevelSubg = enchargesSupported ? (commEncharge.level_subg * 20) : 0;

          const alerts = envoy.alerts;
          const updateStatus = CONSTANS.ApiCodes[envoy.update_status] || 'undefined';

          //wireless connection kit
          if (wirelessConnectionKitSupported) {
            const wirelessConnections = envoy.wireless_connection;
            const wirelessConnectionKitConnectionsCount = wirelessConnections.length;
            const wirelessConnectionKitInstalled = (wirelessConnectionKitConnectionsCount > 0);
            if (wirelessConnectionKitInstalled) {
              this.wirelessConnectionsSignalStrength = new Array();
              this.wirelessConnectionsSignalStrengthMax = new Array();
              this.wirelessConnectionsType = new Array();
              this.wirelessConnectionsConnected = new Array();

              for (let i = 0; i < wirelessConnectionKitConnectionsCount; i++) {
                const wirelessConnection = wirelessConnections[i];
                const wirelessConnectionSignalStrength = (wirelessConnection.signal_strength * 20);
                const wirelessConnectionSignalStrengthMax = (wirelessConnection.signal_strength_max * 20);
                const wirelessConnectionType = CONSTANS.ApiCodes[wirelessConnection.type] || 'undefined';
                const wirelessConnectionConnected = (wirelessConnection.connected === true);

                if (this.wirelessConnektionsKitService) {
                  this.wirelessConnektionsKitService[i]
                    .updateCharacteristic(Characteristic.enphaseWirelessConnectionKitSignalStrength, wirelessConnectionSignalStrength)
                    .updateCharacteristic(Characteristic.enphaseWirelessConnectionKitSignalStrengthMax, wirelessConnectionSignalStrengthMax)
                    .updateCharacteristic(Characteristic.enphaseWirelessConnectionKitType, wirelessConnectionType)
                    .updateCharacteristic(Characteristic.enphaseWirelessConnectionKitConnected, wirelessConnectionConnected)
                }

                this.wirelessConnectionsSignalStrength.push(wirelessConnectionSignalStrength);
                this.wirelessConnectionsSignalStrengthMax.push(wirelessConnectionSignalStrengthMax);
                this.wirelessConnectionsType.push(wirelessConnectionType);
                this.wirelessConnectionsConnected.push(wirelessConnectionConnected);
              }
              this.wirelessConnectionKitInstalled = true;
            }
            this.wirelessConnectionKitSupported = true;
            this.wirelessConnectionKitConnectionsCount = wirelessConnectionKitConnectionsCount;
          }

          //enpower
          const enpower = enpowersSupported ? envoy.enpower : {};
          const enpowerConnected = enpowersSupported ? (enpower.connected === true) : false;
          const enpowerGridStatus = enpowersSupported ? CONSTANS.ApiCodes[enpower.grid_status] || 'undefined' : '';

          //convert status
          const status = (Array.isArray(alerts) && alerts.length > 0) ? (alerts.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No alerts';

          if (this.envoysService) {
            this.envoysService[0]
              .updateCharacteristic(Characteristic.enphaseEnvoyAlerts, status)
              .updateCharacteristic(Characteristic.enphaseEnvoyDbSize, `${dbSize} / ${dbPercentFull}%`)
              .updateCharacteristic(Characteristic.enphaseEnvoyTimeZone, timeZone)
              .updateCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime, `${currentDate} ${currentTime}`)
              .updateCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm, webComm)
              .updateCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten, everReportedToEnlighten)
              .updateCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporDate, lastEnlightenReporDate)
              .updateCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface, primaryInterface)
              .updateCharacteristic(Characteristic.enphaseEnvoyTariff, tariff)
              .updateCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel, `${commNum} / ${commLevel}`)
              .updateCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel, `${commPcuNum} / ${commPcuLevel}`)
              .updateCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel, `${commNsrbNum} / ${commNsrbLevel}`);
            if (this.acBatteriesInstalled) {
              this.envoysService[0]
                .updateCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel, `${commAcbNum} / ${commAcbLevel}`)
            }
            if (this.enchargesInstalled) {
              this.envoysService[0]
                .updateCharacteristic(Characteristic.enphaseEnvoyCommNumEnchgAndLevel, `${commEnchgNum} / ${commEnchgLevel}`)
            }
            if (this.enpowersInstalled) {
              this.envoysService[0]
                .updateCharacteristic(Characteristic.enphaseEnvoyEnpowerConnected, enpowerConnected)
                .updateCharacteristic(Characteristic.enphaseEnvoyEnpowerGridStatus, enpowerGridStatus)
            }
          }

          this.microinvertersSupported = microinvertersSupported;
          this.acBatteriesSupported = acBatteriesSupported;
          this.qRelaysSupported = qRelaysSupported;
          this.esubsSupported = esubsSupported;
          this.enchargesSupported = enchargesSupported;
          this.enpowersSupported = enpowersSupported;

          this.envoySoftwareBuildEpoch = softwareBuildEpoch;
          this.envoyIsEnvoy = isEnvoy;
          this.envoyDbSize = dbSize;
          this.envoyDbPercentFull = dbPercentFull;
          this.envoyTimeZone = timeZone;
          this.envoyCurrentDate = currentDate;
          this.envoyCurrentTime = currentTime;
          this.envoyWebComm = webComm;
          this.envoyEverReportedToEnlighten = everReportedToEnlighten;
          this.envoyLastEnlightenReporDate = lastEnlightenReporDate;
          this.envoyPrimaryInterface = primaryInterface;
          this.envoyTariff = tariff;
          this.envoyCommNum = commNum;
          this.envoyCommLevel = commLevel;
          this.envoyCommPcuNum = commPcuNum;
          this.envoyCommPcuLevel = commPcuLevel;
          this.envoyCommAcbNum = commAcbNum;
          this.envoyCommAcbLevel = commAcbLevel;
          this.envoyCommNsrbNum = commNsrbNum;
          this.envoyCommNsrbLevel = commNsrbLevel;
          this.envoyCommEsubNum = commEsubNum;
          this.envoyCommEsubLevel = commEsubLevel;
          this.envoyCommEnchgNum = commEnchgNum;
          this.envoyCommEnchgLevel = commEnchgLevel;
          this.envoyCommEnchgLevel24g = commEnchgLevel24g;
          this.envoyCommEnchagLevelSubg = commEnchagLevelSubg;
          this.envoyAlerts = status;
          this.envoyUpdateStatus = updateStatus;

          this.envoyEnpowerConnected = enpowerConnected;
          this.envoyEnpowerGridStatus = enpowerGridStatus;

          const mqtt = this.mqttEnabled ? this.mqtt.send('Home', JSON.stringify(envoy, null, 2)) : false;
          await this.updateInventoryData();
          resolve(true);
        }
      } catch (error) {
        this.log.error(`Device: ${this.host} ${this.name}, home error: ${error}, reconnect in 15s.`);
        this.checkDeviceInfo = true;
        this.reconnect();
        reject(error);
      };
    });
  };


  updateInventoryData() {
    return new Promise(async (resolve, reject) => {
      this.log.debug(`Device: ${this.host} ${this.name}, requesting inventory.`);

      try {
        const inventoryData = this.envoyFirmware7xx ? await this.axiosInstanceCookie(CONSTANS.ApiUrls.Inventory) : await this.axiosInstance(CONSTANS.ApiUrls.Inventory);
        const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug inventory: ${JSON.stringify(inventoryData.data, null, 2)}`) : false;

        if (inventoryData.status === 200) {

          //microinverters inventory
          const microinverters = inventoryData.data[0];
          const microinvertersCount = microinverters.devices.length;
          const microinvertersInstalled = (microinvertersCount > 0);

          if (microinvertersInstalled) {
            this.microinvertersSerialNumber = new Array();
            this.microinvertersStatus = new Array();
            this.microinvertersLastReportDate = new Array();
            this.microinvertersFirmware = new Array();
            this.microinvertersProducing = new Array();
            this.microinvertersCommunicating = new Array();
            this.microinvertersProvisioned = new Array();
            this.microinvertersOperating = new Array();

            const type = CONSTANS.ApiCodes[microinverters.type] || 'undefined';
            for (let i = 0; i < microinvertersCount; i++) {
              const microinverter = microinverters.devices[i];
              const partNum = CONSTANS.PartNumbers[microinverter.part_num] || 'Microinverter';
              const installed = new Date(microinverter.installed * 1000).toLocaleString();
              const serialNumber = microinverter.serial_num;
              const deviceStatus = microinverter.device_status;
              const lastReportDate = new Date(microinverter.last_rpt_date * 1000).toLocaleString();
              const adminState = microinverter.admin_state;
              const devType = microinverter.dev_type;
              const createdDate = new Date(microinverter.created_date * 1000).toLocaleString();
              const imageLoadDate = new Date(microinverter.img_load_date * 1000).toLocaleString();
              const firmware = microinverter.img_pnum_running;
              const ptpn = microinverter.ptpn;
              const chaneId = microinverter.chaneid;
              const deviceControl = microinverter.device_control;
              const producing = (microinverter.producing === true);
              const communicating = (microinverter.communicating === true);
              const provisioned = (microinverter.provisioned === true);
              const operating = (microinverter.operating === true);

              //convert status
              const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

              if (this.microinvertersService) {
                this.microinvertersService[i]
                  .updateCharacteristic(Characteristic.enphaseMicroinverterStatus, status)
                  .updateCharacteristic(Characteristic.enphaseMicroinverterLastReportDate, lastReportDate)
                  .updateCharacteristic(Characteristic.enphaseMicroinverterFirmware, firmware)
                  .updateCharacteristic(Characteristic.enphaseMicroinverterProducing, producing)
                  .updateCharacteristic(Characteristic.enphaseMicroinverterCommunicating, communicating)
                  .updateCharacteristic(Characteristic.enphaseMicroinverterProvisioned, provisioned)
                  .updateCharacteristic(Characteristic.enphaseMicroinverterOperating, operating);
              }

              this.microinvertersSerialNumber.push(serialNumber);
              this.microinvertersStatus.push(status);
              this.microinvertersLastReportDate.push(lastReportDate);
              this.microinvertersFirmware.push(firmware);
              this.microinvertersProducing.push(producing);
              this.microinvertersCommunicating.push(communicating);
              this.microinvertersProvisioned.push(provisioned);
              this.microinvertersOperating.push(operating);
            }
            this.microinvertersType = type;
            this.microinvertersCount = microinvertersCount;
            this.microinvertersInstalled = true;
          }

          //ac btteries inventoty
          const acBatteries = inventoryData.data[1];
          const acBatteriesCount = acBatteries.devices.length;
          const acBatteriesInstalled = (acBatteriesCount > 0);

          if (acBatteriesInstalled) {
            this.acBatteriesSerialNumber = new Array();
            this.acBatteriesStatus = new Array();
            this.acBatteriesLastReportDate = new Array();
            this.acBatteriesFirmware = new Array();
            this.acBatteriesProducing = new Array();
            this.acBatteriesCommunicating = new Array();
            this.acBatteriesProvisioned = new Array();
            this.acBatteriesOperating = new Array();
            this.acBatteriesSleepEnabled = new Array();
            this.acBatteriesPercentFull = new Array();
            this.acBatteriesMaxCellTemp = new Array();
            this.acBatteriesSleepMinSoc = new Array();
            this.acBatteriesSleepMaxSoc = new Array();
            this.acBatteriesChargeStatus = new Array();

            const type = CONSTANS.ApiCodes[acBatteries.type] || 'undefined';
            for (let i = 0; i < acBatteriesCount; i++) {
              const acBaterie = acBatteries.devices[i];
              const partNum = CONSTANS.PartNumbers[acBaterie.part_num] || 'AC Batterie'
              const installed = new Date(acBaterie.installed * 1000).toLocaleString();
              const serialNumber = acBaterie.serial_num;
              const deviceStatus = acBaterie.device_status;
              const lastReportDate = new Date(acBaterie.last_rpt_date * 1000).toLocaleString();
              const adminState = acBaterie.admin_state;
              const devType = acBaterie.dev_type;
              const createdDate = new Date(acBaterie.created_date * 1000).toLocaleString();
              const imageLoadDate = new Date(acBaterie.img_load_date * 1000).toLocaleString();
              const firmware = acBaterie.img_pnum_running;
              const ptpn = acBaterie.ptpn;
              const chaneId = acBaterie.chaneid;
              const deviceControl = acBaterie.device_control;
              const producing = (acBaterie.producing === true);
              const communicating = (acBaterie.communicating === true);
              const provisioned = (acBaterie.provisioned === true);
              const operating = (acBaterie.operating === true);
              const sleepEnabled = acBaterie.sleep_enabled;
              const percentFull = acBaterie.percentFull;
              const maxCellTemp = acBaterie.maxCellTemp;
              const sleepMinSoc = acBaterie.sleep_min_soc;
              const sleepMaxSoc = acBaterie.sleep_max_soc;
              const chargeStatus = CONSTANS.ApiCodes[acBaterie.charge_status] || 'undefined';

              //convert status
              const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

              if (this.acBatteriesService) {
                this.acBatteriesService[i]
                  .updateCharacteristic(Characteristic.enphasAcBatterieStatus, status)
                  .updateCharacteristic(Characteristic.enphasAcBatterieLastReportDate, lastReportDate)
                  .updateCharacteristic(Characteristic.enphasAcBatterieFirmware, firmware)
                  .updateCharacteristic(Characteristic.enphasAcBatterieProducing, producing)
                  .updateCharacteristic(Characteristic.enphasAcBatterieCommunicating, communicating)
                  .updateCharacteristic(Characteristic.enphasAcBatterieProvisioned, provisioned)
                  .updateCharacteristic(Characteristic.enphasAcBatterieOperating, operating)
                  .updateCharacteristic(Characteristic.enphasAcBatterieSleepEnabled, sleepEnabled)
                  .updateCharacteristic(Characteristic.enphasAcBatteriePercentFull, percentFull)
                  .updateCharacteristic(Characteristic.enphasAcBatterieMaxCellTemp, maxCellTemp)
                  .updateCharacteristic(Characteristic.enphasAcBatterieSleepMinSoc, sleepMinSoc)
                  .updateCharacteristic(Characteristic.enphasAcBatterieSleepMaxSoc, sleepMaxSoc)
                  .updateCharacteristic(Characteristic.enphasAcBatterieChargeStatus, chargeStatus);
              }

              this.acBatteriesSerialNumber.push(serialNumber);
              this.acBatteriesStatus.push(status);
              this.acBatteriesLastReportDate.push(lastReportDate);
              this.acBatteriesFirmware.push(firmware);
              this.acBatteriesProducing.push(producing);
              this.acBatteriesCommunicating.push(communicating);
              this.acBatteriesProvisioned.push(provisioned);
              this.acBatteriesOperating.push(operating);
              this.acBatteriesSleepEnabled.push(sleepEnabled);
              this.acBatteriesPercentFull.push(percentFull);
              this.acBatteriesMaxCellTemp.push(maxCellTemp);
              this.acBatteriesSleepMinSoc.push(sleepMinSoc);
              this.acBatteriesSleepMaxSoc.push(sleepMaxSoc);
              this.acBatteriesChargeStatus.push(chargeStatus);
            }
            this.acBatteriesType = type;
            this.acBatteriesCount = acBatteriesCount;
            this.acBatteriesInstalled = true;
          }

          //qrelays inventory
          const qRelays = inventoryData.data[2];
          const qRelaysCount = qRelays.devices.length;
          const qRelaysInstalled = (qRelaysCount > 0);

          if (qRelaysInstalled) {
            this.qRelaysSerialNumber = new Array();
            this.qRelaysStatus = new Array();
            this.qRelaysLastReportDate = new Array();
            this.qRelaysFirmware = new Array();
            this.qRelaysProducing = new Array();
            this.qRelaysCommunicating = new Array();
            this.qRelaysProvisioned = new Array();
            this.qRelaysOperating = new Array();
            this.qRelaysRelay = new Array();
            this.qRelaysLinesCount = new Array();
            this.qRelaysLine1Connected = new Array();
            this.qRelaysLine2Connected = new Array();
            this.qRelaysLine3Connected = new Array();

            const type = CONSTANS.ApiCodes[qRelays.type] || 'undefined';
            for (let i = 0; i < qRelaysCount; i++) {
              const qRelay = qRelays.devices[i];
              const partNum = CONSTANS.PartNumbers[qRelay.part_num] || 'Q-Relay'
              const installed = new Date(qRelay.installed * 1000).toLocaleString();
              const serialNumber = qRelay.serial_num;
              const deviceStatus = qRelay.device_status;
              const lastReportDate = new Date(qRelay.last_rpt_date * 1000).toLocaleString();
              const adminState = qRelay.admin_state;
              const devType = qRelay.dev_type;
              const createdDate = new Date(qRelay.created_date * 1000).toLocaleString();
              const imageLoadDate = new Date(qRelay.img_load_date * 1000).toLocaleString();
              const firmware = qRelay.img_pnum_running;
              const ptpn = qRelay.ptpn;
              const chaneId = qRelay.chaneid;
              const deviceControl = qRelay.device_control;
              const producing = (qRelay.producing === true);
              const communicating = (qRelay.communicating === true);
              const provisioned = (qRelay.provisioned === true);
              const operating = (qRelay.operating === true);
              const relay = CONSTANS.ApiCodes[qRelay.relay] || 'undefined';
              const reasonCode = qRelay.reason_code;
              const reason = qRelay.reason;
              const linesCount = qRelay['line-count'];
              const line1Connected = linesCount >= 1 ? (qRelay['line1-connected'] === true) : false;
              const line2Connected = linesCount >= 2 ? (qRelay['line2-connected'] === true) : false;
              const line3Connected = linesCount >= 3 ? (qRelay['line3-connected'] === true) : false;

              //convert status
              const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

              if (this.qRelaysService) {
                this.qRelaysService[i]
                  .updateCharacteristic(Characteristic.enphaseQrelayStatus, status)
                  .updateCharacteristic(Characteristic.enphaseQrelayLastReportDate, lastReportDate)
                  .updateCharacteristic(Characteristic.enphaseQrelayFirmware, firmware)
                  .updateCharacteristic(Characteristic.enphaseQrelayProducing, producing)
                  .updateCharacteristic(Characteristic.enphaseQrelayCommunicating, communicating)
                  .updateCharacteristic(Characteristic.enphaseQrelayProvisioned, provisioned)
                  .updateCharacteristic(Characteristic.enphaseQrelayOperating, operating)
                  .updateCharacteristic(Characteristic.enphaseQrelayState, relay)
                  .updateCharacteristic(Characteristic.enphaseQrelayLinesCount, linesCount)
                if (linesCount >= 1) {
                  this.qRelaysService[i]
                    .updateCharacteristic(Characteristic.enphaseQrelayLine1Connected, line1Connected);
                }
                if (linesCount >= 2) {
                  this.qRelaysService[i]
                    .updateCharacteristic(Characteristic.enphaseQrelayLine2Connected, line2Connected);
                }
                if (linesCount >= 3) {
                  this.qRelaysService[i]
                    .updateCharacteristic(Characteristic.enphaseQrelayLine3Connected, line3Connected);
                }
              }

              this.qRelaysSerialNumber.push(serialNumber);
              this.qRelaysStatus.push(status);
              this.qRelaysLastReportDate.push(lastReportDate);
              this.qRelaysFirmware.push(firmware);
              this.qRelaysProducing.push(producing);
              this.qRelaysCommunicating.push(communicating);
              this.qRelaysProvisioned.push(provisioned);
              this.qRelaysOperating.push(operating);
              this.qRelaysRelay.push(relay);
              this.qRelaysLinesCount.push(linesCount);
              this.qRelaysLine1Connected.push(line1Connected);
              this.qRelaysLine2Connected.push(line2Connected);
              this.qRelaysLine3Connected.push(line3Connected);
            }
            this.qRelaysType = type;
            this.qRelaysCount = qRelaysCount;
            this.qRelaysInstalled = true;
          }

          //esubs
          const esubs = this.esubsSupported ? inventoryData.data[3] : {};
          const esubsCount = this.esubsSupported ? esubs.devices.length : 0;
          const esubsInstalled = (esubsCount > 0);

          if (esubsInstalled) {
            this.esubsSerialNumber = new Array();
            this.esubsStatus = new Array();
            this.esubsLastReportDate = new Array();
            this.esubsFirmware = new Array();
            this.esubsProducing = new Array();
            this.esubsCommunicating = new Array();
            this.esubsOperating = new Array();

            const type = CONSTANS.ApiCodes[esubs.type] || 'undefined';
            for (let i = 0; i < esubsCount; i++) {
              const esub = esubs.devices[i];
              const partNum = CONSTANS.PartNumbers[esub.part_num] || 'Q-Relay'
              const installed = new Date(esub.installed * 1000).toLocaleString();
              const serialNumber = esub.serial_num;
              const deviceStatus = esub.device_status;
              const lastReportDate = new Date(esub.last_rpt_date * 1000).toLocaleString();
              const adminState = esub.admin_state;
              const devType = esub.dev_type;
              const createdDate = new Date(esub.created_date * 1000).toLocaleString();
              const imageLoadDate = new Date(esub.img_load_date * 1000).toLocaleString();
              const firmware = esub.img_pnum_running;
              const ptpn = esub.ptpn;
              const chaneId = esubs.chaneid;
              const deviceControl = esub.device_control;
              const producing = (esub.producing === true);
              const communicating = (esub.communicating === true);
              const operating = (esub.operating === true);

              //convert status
              const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

              if (this.esubsService) {
                this.esubsService[i]
                  .updateCharacteristic(Characteristic.enphaseEsubStatus, status)
                  .updateCharacteristic(Characteristic.enphaseEsubLastReportDate, lastReportDate)
                  .updateCharacteristic(Characteristic.enphaseEsubFirmware, firmware)
                  .updateCharacteristic(Characteristic.enphaseEsubProducing, producing)
                  .updateCharacteristic(Characteristic.enphaseEsubCommunicating, communicating)
                  .updateCharacteristic(Characteristic.enphaseEsubOperating, operating)
              }

              this.esubsSerialNumber.push(serialNumber);
              this.esubsStatus.push(status);
              this.esubsLastReportDate.push(lastReportDate);
              this.esubsFirmware.push(firmware);
              this.esubsProducing.push(producing);
              this.esubsCommunicating.push(communicating);
              this.esubsOperating.push(operating);
            }
            this.esubsType = type;
            this.esubsCount = esubsCount;
            this.esubsInstalled = true;
          }
          const mqtt = this.mqttEnabled ? this.mqtt.send('Inventory', JSON.stringify(inventoryData.data, null, 2)) : false;

          if (!this.checkDeviceInfo) {
            this.updateHome()
            return;
          }

          const updateMetersData = this.metersSupported ? await this.updateMetersData() : false;
          const updateEnsembleInventoryData = (this.envoyFirmware7xx && esubsInstalled) || (!this.envoyFirmware7xx && esubsInstalled && this.installerPasswd) ? await this.updateEnsembleInventoryData() : false;
          const updateLiveData = this.envoyFirmware7xx ? await this.updateLiveData() : false;
          const updateProductionData = await this.updateProductionData();
          const updateProductionCtData = await this.updateProductionCtData();
          const updateMicroinvertersData = (this.envoyFirmware7xx || (!this.envoyFirmware7xx && this.envoyPasswd)) ? await this.updateMicroinvertersData() : false;
          const updateProductionPowerModeData = (this.supportProductionPowerMode && (this.envoyFirmware7xx || (!this.envoyFirmware7xx && this.installerPasswd && this.envoyDevId.length === 9))) ? await this.updateProductionPowerModeData() : false;
          const updatePlcLevelData = (this.supportPlcLevel && (this.envoyFirmware7xx || (!this.envoyFirmware7xx && this.installerPasswd))) ? await this.updatePlcLevelData() : false;
          const getDeviceInfo = this.getDeviceInfo();
          resolve(true);
        }
      } catch (error) {
        this.log.error(`Device: ${this.host} ${this.name}, inventory error: ${error}, reconnect in 15s.`);
        this.checkDeviceInfo = true;
        this.reconnect();
        reject(error);
      };
    });
  };

  updateMetersData() {
    return new Promise(async (resolve, reject) => {
      this.log.debug(`Device: ${this.host} ${this.name}, requesting meters info.`);

      try {
        const metersData = this.envoyFirmware7xx ? await this.axiosInstanceCookie(CONSTANS.ApiUrls.MetersInfo) : await this.axiosInstance(CONSTANS.ApiUrls.MetersInfo);
        const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug meters: ${JSON.stringify(metersData.data, null, 2)}`) : false;

        if (metersData.status === 200) {
          const metersCount = metersData.data.length;
          const metersInstalled = (metersCount > 0);

          if (metersInstalled) {
            this.metersEid = new Array();
            this.metersState = new Array();
            this.metersMeasurementType = new Array();
            this.metersPhaseMode = new Array();
            this.metersPhaseCount = new Array();
            this.metersMeteringStatus = new Array();
            this.metersStatusFlags = new Array();

            for (let i = 0; i < metersCount; i++) {
              const meter = metersData.data[i];
              const eid = meter.eid;
              const state = (meter.state === 'enabled') || false;
              const measurementType = CONSTANS.ApiCodes[meter.measurementType] || 'undefined';
              const phaseMode = CONSTANS.ApiCodes[meter.phaseMode] || 'undefined';
              const phaseCount = meter.phaseCount;
              const meteringStatus = CONSTANS.ApiCodes[meter.meteringStatus] || 'undefined';
              const statusFlags = meter.statusFlags;

              // convert status
              const status = (Array.isArray(statusFlags) && statusFlags.length > 0) ? (statusFlags.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

              if (this.metersService) {
                this.metersService[i]
                  .updateCharacteristic(Characteristic.enphaseMeterState, state)
                  .updateCharacteristic(Characteristic.enphaseMeterPhaseMode, phaseMode)
                  .updateCharacteristic(Characteristic.enphaseMeterPhaseCount, phaseCount)
                  .updateCharacteristic(Characteristic.enphaseMeterMeteringStatus, meteringStatus)
                  .updateCharacteristic(Characteristic.enphaseMeterStatusFlags, status);
              }

              this.metersEid.push(eid);
              this.metersState.push(state);
              this.metersMeasurementType.push(measurementType);
              this.metersPhaseMode.push(phaseMode);
              this.metersPhaseCount.push(phaseCount);
              this.metersMeteringStatus.push(meteringStatus);
              this.metersStatusFlags.push(status);
            }
            this.metersCount = metersCount;
            this.metersInstalled = metersInstalled;
            this.metersProductionEnabled = this.metersState[0];
            this.metersProductionVoltageDivide = (this.metersPhaseMode[0] === 'Split') ? 1 : this.metersPhaseCount[0];
            this.metersConsumptionEnabled = this.metersState[1];
            this.metersConsumpionVoltageDivide = (this.metersPhaseMode[1] === 'Split') ? 1 : this.metersPhaseCount[1];
          }

          const mqtt = this.mqttEnabled ? this.mqtt.send('Meters', JSON.stringify(metersData.data, null, 2)) : false;
          const updateMetersReadingData = this.checkDeviceInfo && metersInstalled ? await this.updateMetersReadingData() : false;
          resolve(true);
        }
      } catch (error) {
        this.log.error(`Device: ${this.host} ${this.name}, meters error: ${error}, reconnect in 15s.`);
        this.checkDeviceInfo = true;
        this.reconnect();
        reject(error);
      };
    });
  };

  updateMetersReadingData() {
    return new Promise(async (resolve, reject) => {
      this.log.debug(`Device: ${this.host} ${this.name}, requesting meters reading.`);

      try {
        const metersReadingData = this.envoyFirmware7xx ? await this.axiosInstanceCookie(CONSTANS.ApiUrls.MetersReadings) : await this.axiosInstance(CONSTANS.ApiUrls.MetersReadings);
        const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug meters reading: ${JSON.stringify(metersReadingData.data, null, 2)}`) : false;

        if (metersReadingData.status === 200) {
          const metersReadingCount = metersReadingData.data.length;
          const metersReadingInstalled = (metersReadingCount > 0);

          //meters
          if (metersReadingInstalled) {
            this.eidSumm = new Array();
            this.timestampSumm = new Array();
            this.actEnergyDlvdSumm = new Array();
            this.actEnergyRcvdSumm = new Array();
            this.apparentEnergySumm = new Array();
            this.reactEnergyLaggSumm = new Array();
            this.reactEnergyLeadSumm = new Array();
            this.instantaneousDemandSumm = new Array();
            this.activePowerSumm = new Array();
            this.apparentPowerSumm = new Array();
            this.reactivePowerSumm = new Array();
            this.pwrFactorSumm = new Array();
            this.voltageSumm = new Array();
            this.currentSumm = new Array();
            this.freqSumm = new Array();

            //meters reading summary data
            for (let i = 0; i < metersReadingCount; i++) {
              const metersVoltageDivide = (this.metersPhaseMode[i] === 'Split') ? 1 : this.metersPhaseCount[i];
              const meter = metersReadingData.data[i];
              const eid = meter.eid;
              const timestamp = new Date(meter.timestamp * 1000).toLocaleString();
              const actEnergyDlvd = parseFloat(meter.actEnergyDlvd);
              const actEnergyRcvd = parseFloat(meter.actEnergyRcvd);
              const apparentEnergy = parseFloat(meter.apparentEnergy);
              const reactEnergyLagg = parseFloat(meter.reactEnergyLagg);
              const reactEnergyLead = parseFloat(meter.reactEnergyLead);
              const instantaneousDemand = parseFloat(meter.instantaneousDemand);
              const activePower = parseFloat((meter.activePower) / 1000);
              const apparentPower = parseFloat((meter.apparentPower) / 1000);
              const reactivePower = parseFloat((meter.reactivePower) / 1000);
              const pwrFactor = parseFloat(meter.pwrFactor);
              const voltage = parseFloat((meter.voltage) / metersVoltageDivide);
              const current = parseFloat(meter.current);
              const freq = parseFloat(meter.freq);

              if (this.metersService) {
                this.metersService[i]
                  .updateCharacteristic(Characteristic.enphaseMeterReadingTime, timestamp)
                  .updateCharacteristic(Characteristic.enphaseMeterActivePower, activePower)
                  .updateCharacteristic(Characteristic.enphaseMeterApparentPower, apparentPower)
                  .updateCharacteristic(Characteristic.enphaseMeterReactivePower, reactivePower)
                  .updateCharacteristic(Characteristic.enphaseMeterPwrFactor, pwrFactor)
                  .updateCharacteristic(Characteristic.enphaseMeterVoltage, voltage)
                  .updateCharacteristic(Characteristic.enphaseMeterCurrent, current)
                  .updateCharacteristic(Characteristic.enphaseMeterFreq, freq);
              }

              this.eidSumm.push(eid);
              this.timestampSumm.push(timestamp);
              this.actEnergyDlvdSumm.push(actEnergyDlvd);
              this.actEnergyRcvdSumm.push(actEnergyRcvd);
              this.apparentEnergySumm.push(apparentEnergy);
              this.reactEnergyLaggSumm.push(reactEnergyLagg);
              this.reactEnergyLeadSumm.push(reactEnergyLead);
              this.instantaneousDemandSumm.push(instantaneousDemand);
              this.activePowerSumm.push(activePower);
              this.apparentPowerSumm.push(apparentPower);
              this.reactivePowerSumm.push(reactivePower);
              this.pwrFactorSumm.push(pwrFactor);
              this.voltageSumm.push(voltage);
              this.currentSumm.push(current);
              this.freqSumm.push(freq);

              //meters reading phases data
              const metersReadingPhaseCount = meter.channels.length;
              if (metersReadingPhaseCount > 0) {
                this.eidPhase = new Array();
                this.timestampPhase = new Array();
                this.actEnergyDlvdPhase = new Array();
                this.actEnergyRcvdPhase = new Array();
                this.apparentEnergyPhase = new Array();
                this.reactEnergyLaggPhase = new Array();
                this.reactEnergyLeadPhase = new Array();
                this.instantaneousDemandPhase = new Array();
                this.activePowerPhase = new Array();
                this.apparentPowerPhase = new Array();
                this.reactivePowerPhase = new Array();
                this.pwrFactorPhase = new Array();
                this.voltagePhase = new Array();
                this.currentPhase = new Array();
                this.freqPhase = new Array();

                for (let j = 0; j < metersReadingPhaseCount; j++) {
                  const meterChannel = meter.channels[j]
                  const eid = meterChannel.eid;
                  const timestamp = new Date(meterChannel.timestamp * 1000).toLocaleString();
                  const actEnergyDlvd = parseFloat(meterChannel.actEnergyDlvd);
                  const actEnergyRcvd = parseFloat(meterChannel.actEnergyRcvd);
                  const apparentEnergy = parseFloat(meterChannel.apparentEnergy);
                  const reactEnergyLagg = parseFloat(meterChannel.reactEnergyLagg);
                  const reactEnergyLead = parseFloat(meterChannel.reactEnergyLead);
                  const instantaneousDemand = parseFloat(meterChannel.instantaneousDemand);
                  const activePower = parseFloat((meterChannel.activePower) / 1000);
                  const apparentPower = parseFloat((meterChannel.apparentPower) / 1000);
                  const reactivePower = parseFloat((meterChannel.reactivePower) / 1000);
                  const pwrFactor = parseFloat(meterChannel.pwrFactor);
                  const voltage = parseFloat(meterChannel.voltage);
                  const current = parseFloat(meterChannel.current);
                  const freq = parseFloat(meterChannel.freq);

                  this.eidPhase.push(eid);
                  this.timestampPhase.push(timestamp);
                  this.actEnergyDlvdPhase.push(actEnergyDlvd);
                  this.actEnergyRcvdPhase.push(actEnergyRcvd);
                  this.apparentEnergyPhase.push(apparentEnergy);
                  this.reactEnergyLaggPhase.push(reactEnergyLagg);
                  this.reactEnergyLeadPhase.push(reactEnergyLead);
                  this.instantaneousDemandPhase.push(instantaneousDemand);
                  this.activePowerPhase.push(activePower);
                  this.apparentPowerPhase.push(apparentPower);
                  this.reactivePowerPhase.push(reactivePower);
                  this.pwrFactorPhase.push(pwrFactor);
                  this.voltagePhase.push(voltage);
                  this.currentPhase.push(current);
                  this.freqPhase.push(freq);
                }
              }
              this.metersReadingPhaseCount = metersReadingPhaseCount;
            }
            this.metersReadingCount = metersReadingCount;
            this.metersReadingInstalled = metersReadingInstalled;
          }

          const mqtt = this.mqttEnabled ? this.mqtt.send('Meters Reading', JSON.stringify(metersReadingData.data, null, 2)) : false;
          const updateMetersReading = this.checkDeviceInfo ? false : this.updateMetersReading();
          resolve(true);
        }
      } catch (error) {
        this.log.error(`Device: ${this.host} ${this.name}, meters reading error: ${error}, reconnect in 15s.`);
        this.checkDeviceInfo = true;
        this.reconnect();
        reject(error);
      };
    });
  };

  updateEnsembleInventoryData() {
    return new Promise(async (resolve, reject) => {
      this.log.debug(`Device: ${this.host} ${this.name}, requesting ensemble inventory.`);

      try {
        const options = {
          method: 'GET',
          url: this.url + CONSTANS.ApiUrls.EnsembleInventory,
          headers: {
            Accept: 'application/json'
          }
        }

        const ensembleInventoryData = this.envoyFirmware7xx ? await this.axiosInstanceCookie(CONSTANS.ApiUrls.EnsembleInventory) : await this.digestAuthInstaller.request(options);
        const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug ensemble inventory: ${JSON.stringify(ensembleInventoryData.data, null, 2)}`) : false;

        if (ensembleInventoryData.status === 200) {
          //encharges inventory
          const encharges = ensembleInventoryData.data[0];
          const enchargesCount = encharges.devices.length;
          const enchargesInstalled = (enchargesCount > 0);

          if (enchargesInstalled) {
            this.enchargesSerialNumber = new Array();
            this.enchargesStatus = new Array();
            this.enchargesLastReportDate = new Array();
            this.enchargesAdminStateStr = new Array();
            this.enchargesOperating = new Array();
            this.enchargesCommunicating = new Array();
            this.enchargesSleepEnabled = new Array();
            this.enchargesPercentFull = new Array();
            this.enchargesTemperature = new Array();
            this.enchargesMaxCellTemp = new Array();
            this.enchargesCommLevelSubGhz = new Array();
            this.enchargesCommLevel24Ghz = new Array();
            this.enchargesLedStatus = new Array();
            this.enchargesRealPowerW = new Array();
            this.enchargesDcSwitchOff = new Array();
            this.enchargesRev = new Array();
            this.enchargesCapacity = new Array();

            const type = CONSTANS.ApiCodes[encharges.type] || 'Encharge';
            for (let i = 0; i < enchargesCount; i++) {
              const encharge = encharges.devices[i];
              const partNum = CONSTANS.PartNumbers[encharge.part_num] || 'undefined'
              const installed = new Date(encharge.installed * 1000).toLocaleString();
              const serialNumber = encharge.serial_num;
              const deviceStatus = encharge.device_status;
              const lastReportDate = new Date(encharge.last_rpt_date * 1000).toLocaleString();
              const adminState = encharge.admin_state;
              const adminStateStr = CONSTANS.ApiCodes[encharge.admin_state_str] || 'undefined';
              const createdDate = new Date(encharge.created_date * 1000).toLocaleString();
              const imgLoadDate = new Date(encharge.img_load_date * 1000).toLocaleString();
              const imgPnumRunning = encharge.img_pnum_running;
              const zigbeeDongleFwVersion = encharge.zigbee_dongle_fw_version;
              const operating = (encharge.operating === true);
              const communicating = (encharge.communicating === true);
              const sleepEnabled = encharge.sleep_enabled;
              const percentFull = encharge.percentFull;
              const temperature = encharge.temperature;
              const maxCellTemp = encharge.maxCellTemp;
              const commLevelSubGhz = (encharge.comm_level_sub_ghz * 20);
              const commLevel24Ghz = (encharge.comm_level_2_4_ghz * 20);
              const ledStatus = CONSTANS.LedStatus[encharge.led_status] || 'undefined';
              const dcSwitchOff = encharge.dc_switch_off;
              const rev = encharge.encharge_rev;
              const capacity = parseFloat((encharge.encharge_capacity) / 1000); //in kWh

              //convert status
              const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

              if (this.enchargesService) {
                this.enchargesService[i]
                  .updateCharacteristic(Characteristic.enphaseEnchargeStatus, status)
                  .updateCharacteristic(Characteristic.enphaseEnchargeLastReportDate, lastReportDate)
                  .updateCharacteristic(Characteristic.enphaseEnchargeAdminStateStr, adminStateStr)
                  .updateCharacteristic(Characteristic.enphaseEnchargeOperating, operating)
                  .updateCharacteristic(Characteristic.enphaseEnchargeCommunicating, communicating)
                  .updateCharacteristic(Characteristic.enphaseEnchargeSleepEnabled, sleepEnabled)
                  .updateCharacteristic(Characteristic.enphaseEnchargePercentFull, percentFull)
                  .updateCharacteristic(Characteristic.enphaseEnchargeTemperature, temperature)
                  .updateCharacteristic(Characteristic.enphaseEnchargeMaxCellTemp, maxCellTemp)
                  .updateCharacteristic(Characteristic.enphaseEnchargeCommLevelSubGhz, commLevelSubGhz)
                  .updateCharacteristic(Characteristic.enphaseEnchargeCommLevel24Ghz, commLevel24Ghz)
                  .updateCharacteristic(Characteristic.enphaseEnchargeLedStatus, ledStatus)
                  .updateCharacteristic(Characteristic.enphaseEnchargeDcSwitchOff, dcSwitchOff)
                  .updateCharacteristic(Characteristic.enphaseEnchargeRev, rev)
                  .updateCharacteristic(Characteristic.enphaseEnchargeCapacity, capacity)
              }

              this.enchargesSerialNumber.push(serialNumber);
              this.enchargesStatus.push(status);
              this.enchargesLastReportDate.push(lastReportDate);
              this.enchargesAdminStateStr.push(adminStateStr);
              this.enchargesOperating.push(operating);
              this.enchargesCommunicating.push(communicating);
              this.enchargesSleepEnabled.push(sleepEnabled);
              this.enchargesPercentFull.push(percentFull);
              this.enchargesTemperature.push(temperature);
              this.enchargesMaxCellTemp.push(maxCellTemp);
              this.enchargesCommLevelSubGhz.push(commLevelSubGhz);
              this.enchargesCommLevel24Ghz.push(commLevel24Ghz);
              this.enchargesLedStatus.push(ledStatus);
              this.enchargesDcSwitchOff.push(dcSwitchOff);
              this.enchargesRev.push(rev);
              this.enchargesCapacity.push(capacity);
            }
            this.enchargesType = type;
            this.enchargesCount = enchargesCount;
            this.enchargesInstalled = true;
          }

          //enpowers inventory
          const enpowers = ensembleInventoryData.data[1];
          const enpowersCount = enpowers.devices.length;
          const enpowersInstalled = (enpowersCount > 0);

          if (enpowersInstalled) {
            this.enpowersSerialNumber = new Array();
            this.enpowersStatus = new Array();
            this.enpowersLastReportDate = new Array();
            this.enpowersAdminStateStr = new Array();
            this.enpowersOperating = new Array();
            this.enpowersCommunicating = new Array();
            this.enpowersTemperature = new Array();
            this.enpowersCommLevelSubGhz = new Array();
            this.enpowersCommLevel24Ghz = new Array();
            this.enpowersMainsAdminState = new Array();
            this.enpowersMainsOperState = new Array();
            this.enpowersGridMode = new Array();
            this.enpowersEnchgGridMode = new Array();
            this.enpowersRelayStateBm = new Array();
            this.enpowersCurrStateId = new Array();

            const type = CONSTANS.ApiCodes[enpowers.type] || 'Enpower';
            for (let i = 0; i < enpowersCount; i++) {
              const enpower = enpowers.devices[i];
              const partNum = CONSTANS.PartNumbers[enpower.part_num] || 'undefined'
              const installed = new Date(enpower.installed * 1000).toLocaleString();
              const serialNumber = enpower.serial_num;
              const deviceStatus = enpower.device_status;
              const lastReportDate = new Date(enpower.last_rpt_date * 1000).toLocaleString();
              const adminState = enpower.admin_state;
              const adminStateStr = CONSTANS.ApiCodes[enpower.admin_state_str] || 'undefined';
              const createdDate = new Date(enpower.created_date * 1000).toLocaleString();
              const imgLoadDate = new Date(enpower.img_load_date * 1000).toLocaleString();
              const imgPnumRunning = enpower.img_pnum_running;
              const zigbeeDongleFwVersion = enpower.zigbee_dongle_fw_version;
              const operating = (enpower.operating === true);
              const communicating = (enpower.communicating === true);
              const temperature = enpower.temperature;
              const commLevelSubGhz = (enpower.comm_level_sub_ghz * 20);
              const commLevel24Ghz = (enpower.comm_level_2_4_ghz * 20);
              const mainsAdminState = CONSTANS.ApiCodes[enpower.mains_admin_state] || 'undefined';
              const mainsOperState = CONSTANS.ApiCodes[enpower.mains_oper_state] || 'undefined';
              const enpwrGridMode = CONSTANS.ApiCodes[enpower.Enpwr_grid_mode] || 'undefined';
              const enchgGridMode = CONSTANS.ApiCodes[enpower.Enchg_grid_mode] || 'undefined';
              const enpwrRelayStateBm = enpower.Enpwr_relay_state_bm;
              const enpwrCurrStateId = enpower.Enpwr_curr_state_id;

              //convert status
              const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

              if (this.enpowersService) {
                this.enpowersService[i]
                  .updateCharacteristic(Characteristic.enphaseEnpowerStatus, status)
                  .updateCharacteristic(Characteristic.enphaseEnpowerLastReportDate, lastReportDate)
                  .updateCharacteristic(Characteristic.enphaseEnpowerAdminStateStr, adminStateStr)
                  .updateCharacteristic(Characteristic.enphaseEnpowerOperating, operating)
                  .updateCharacteristic(Characteristic.enphaseEnpowerCommunicating, communicating)
                  .updateCharacteristic(Characteristic.enphaseEnpowerTemperature, temperature)
                  .updateCharacteristic(Characteristic.enphaseEnpowerCommLevelSubGhz, commLevelSubGhz)
                  .updateCharacteristic(Characteristic.enphaseEnpowerCommLevel24Ghz, commLevel24Ghz)
                  .updateCharacteristic(Characteristic.enphaseEnpowerMainsAdminState, mainsAdminState)
                  .updateCharacteristic(Characteristic.enphaseEnpowerMainsOperState, mainsOperState)
                  .updateCharacteristic(Characteristic.enphaseEnpowerEnpwrGridMode, enpwrGridMode)
                  .updateCharacteristic(Characteristic.enphaseEnpowerEnchgGridMode, enchgGridMode)
              }
              this.enpowersSerialNumber.push(serialNumber);
              this.enpowersStatus.push(status);
              this.enpowersLastReportDate.push(lastReportDate);
              this.enpowersAdminStateStr.push(adminStateStr);
              this.enpowersOperating.push(operating);
              this.enpowersCommunicating.push(communicating);
              this.enpowersTemperature.push(temperature);
              this.enpowersCommLevelSubGhz.push(commLevelSubGhz);
              this.enpowersCommLevel24Ghz.push(commLevel24Ghz);
              this.enpowersMainsAdminState.push(mainsAdminState);
              this.enpowersMainsOperState.push(mainsOperState);
              this.enpowersGridMode.push(enpwrGridMode);
              this.enpowersEnchgGridMode.push(enchgGridMode);
              this.enpowersRelayStateBm.push(enpwrRelayStateBm);
              this.enpowersCurrStateId.push(enpwrCurrStateId);
            }
            this.enpowersType = type;
            this.enpowersCount = enpowersCount;
            this.enpowersInstalled = true;
          }

          const mqtt = this.mqttEnabled ? this.mqtt.send('Ensemble Inventory', JSON.stringify(ensembleInventoryData.data, null, 2)) : false;
          //const updateEnsembleStatusData = await this.updateEnsembleStatusData() : false;
          const updateEnsembleInventory = this.checkDeviceInfo ? false : this.updateEnsembleInventory();
          resolve(true);
        }
      } catch (error) {
        this.log.error(`Device: ${this.host} ${this.name}, ensemble inventory error: ${error}, reconnect in 15s.`);
        this.checkDeviceInfo = true;
        this.reconnect();
        reject(error);
      };
    });
  };

  updateEnsembleStatusData() {
    return new Promise(async (resolve, reject) => {
      this.log.debug(`Device: ${this.host} ${this.name}, requesting ensemble status.`);

      try {
        const options = {
          method: 'GET',
          url: this.url + CONSTANS.ApiUrls.EnsembleStatus,
          headers: {
            Accept: 'application/json'
          }
        }

        const ensembleStatusData = this.envoyFirmware7xx ? await this.axiosInstanceCookie(CONSTANS.ApiUrls.EnsembleStatus) : await this.digestAuthInstaller.request(options);
        const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug ensemble status: ${JSON.stringify(ensembleStatusData.data, null, 2)}`) : false;

        //ensemble status
        if (ensembleStatusData.status === 200) {
          const ensembleStatus = ensembleStatusData.data;
          const serialNumbers = ensembleStatus.inventory.serial_nums;
          const objSerialNumbers = Object.keys(serialNumbers);
          const serialNumbersCount = objSerialNumbers.length;

          for (let i = 0; i < serialNumbersCount; i++) {
            const key = objSerialNumbers[i];
            const ensembleDevice = ensembleStatus.inventory.serial_nums[key];
            const deviceType = ensembleDevice.device_type;
            const adminState = ensembleDevice.admin_state;
            const adminStateStr = CONSTANS.ApiCodes[ensembleDevice.admin_state_str] || 'undefined';
            const reportedGridMode = CONSTANS.ApiCodes[ensembleDevice.reported_grid_mode] || 'undefined';
            const msgRetryCoun = ensembleDevice.msg_retry_count;
            const partNumber = ensembleDevice.part_number;
            const assemblyNumber = ensembleDevice.assembly_number;
            const appFwVersion = ensembleDevice.app_fw_version;
            const zbFwVersion = ensembleDevice.zb_fw_version;
            const zbBootloaderVers = ensembleDevice.zb_bootloader_vers;
            const iblFwVersion = ensembleDevice.ibl_fw_version;
            const swiftAsicFwVersion = ensembleDevice.swift_asic_fw_version;
            const submodulesCount = ensembleDevice.submodule_count;
            const submodulesKeys = ensembleDevice.submodules;

            const submodulesSerialNumbers = ensembleDevice.submodules;
            const objSubmodulesSerialNumbers = Object.keys(submodulesSerialNumbers);
            const submodulesSerialNumbersCount = objSubmodulesSerialNumbers.length;
            for (let j = 0; j < submodulesSerialNumbersCount; j++) {
              const key1 = objSubmodulesSerialNumbers[j];
              const ensembleDeviceSubmodule = ensembleDevice.submodules[key1];
              const submodulesDeviceType = ensembleDeviceSubmodule.device_type;
              const submodulesAdminState = ensembleDeviceSubmodule.admin_state;
              const submodulesPartNumber = ensembleDeviceSubmodule.part_number;
              const submodulesAssemblyNumber = ensembleDeviceSubmodule.assembly_number;
              const submodulesDmirPartNumber = ensembleDeviceSubmodule.dmir.part_number;
              const submodulesDmirAssemblyNumber = ensembleDeviceSubmodule.dmir.assembly_number;
              const submodulesProcloadPartNumber = ensembleDeviceSubmodule.procload.part_number;
              const submodulesProcloadAssemblyNumber = ensembleDeviceSubmodule.procload.assembly_number;
            }
          }

          //counters
          const counter = ensembleStatus.counters;
          const apiEcagtInit = counter.api_ecagtInit;
          const apiEcagtTick = counter.api_ecagtTick;
          const apiEcagtDeviceInsert = counter.api_ecagtDeviceInsert;
          const apiEcagtDeviceNetworkStatus = counter.api_ecagtDeviceNetworkStatus;
          const apiEcagtDeviceRemoved = counter.api_ecagtDeviceRemoved;
          const apiEcagtGetDeviceCount = counter.api_ecagtGetDeviceCount;
          const apiEcagtGetDeviceInfo = counter.api_ecagtGetDeviceInfo;
          const apiEcagtGetOneDeviceInfo = counter.api_ecagtGetOneDeviceInfo;
          const apiEcagtDevIdToSerial = counter.api_ecagtDevIdToSerial;
          const apiEcagtHandleMsg = counter.api_ecagtHandleMsg;
          const apiEcagtGetSubmoduleInv = counter.api_ecagtGetSubmoduleInv;
          const apiEcagtGetDataModelRaw = counter.api_ecagtGetDataModelRaw;
          const apiEcagtSetSecCtrlBias = counter.api_ecagtSetSecCtrlBias;
          const apiEcagtGetSecCtrlBias = counter.api_ecagtGetSecCtrlBias;
          const apiEcagtGetSecCtrlBiasQ = counter.api_ecagtGetSecCtrlBiasQ;
          const apiEcagtSetRelayAdmin = counter.api_ecagtSetRelayAdmin;
          const apiEcagtGetRelayState = counter.api_ecagtGetRelayState;
          const apiEcagtSetDataModelCache = counter.api_ecagtSetDataModelCache;
          const apiAggNameplate = counter.api_AggNameplate;
          const apiChgEstimated = counter.api_ChgEstimated;
          const apiEcagtGetGridFreq = counter.api_ecagtGetGridFreq;
          const apiEcagtGetGridVolt = counter.api_ecagtGetGridVolt;
          const apiEcagtGetGridFreqErrNotfound = counter.api_ecagtGetGridFreq_err_notfound;
          const apiEcagtGetGridFreqErrOor = counter.api_ecagtGetGridFreq_err_oor;
          const restStatusGet = counter.rest_StatusGet;
          const restInventoryGet = counter.rest_InventoryGet;
          const restSubmodGet = counter.rest_SubmodGet;
          const restSecCtrlGet = counter.rest_SecCtrlGet;
          const restRelayGet = counter.rest_RelayGet;
          const restRelayPost = counter.rest_RelayPost;
          const restCommCheckGet = counter.rest_CommCheckGet;
          const restPower = counter.rest_Power;
          const extZbRemove = counter.ext_zb_remove;
          const extZbRemoveErr = counter.ext_zb_remove_err;
          const extZbSendMsg = counter.ext_zb_send_msg;
          const extCfgSaveDevice = counter.ext_cfg_save_device;
          const extCfgSaveDeviceErr = counter.ext_cfg_save_device_err;
          const extSendPerfData = counter.ext_send_perf_data;
          const extEventSetStateful = counter.ext_event_set_stateful;
          const extEventSetModgone = counter.ext_event_set_modgone;
          const rxmsgObjMdlMetaRsp = counter.rxmsg_OBJ_MDL_META_RSP;
          const rxmsgObjMdlInvUpdRsp = counter.rxmsg_OBJ_MDL_INV_UPD_RSP;
          const rxmsgObjMdlPollRsp = counter.rxmsg_OBJ_MDL_POLL_RSP;
          const rxmsgObjMdlRelayCtrlRsp = counter.rxmsg_OBJ_MDL_RELAY_CTRL_RSP;
          const rxmsgObjMdlRelayStatusReq = counter.rxmsg_OBJ_MDL_RELAY_STATUS_REQ;
          const rxmsgObjMdlGridStatusRsp = counter.rxmsg_OBJ_MDL_GRID_STATUS_RSP;
          const rxmsgObjMdlEventMsg = counter.rxmsg_OBJ_MDL_EVENT_MSG;
          const rxmsgObjMdlSosConfigRsp = counter.rxmsg_OBJ_MDL_SOC_CONFIG_RSP;
          const txmsgObjMdlMetaReq = counter.txmsg_OBJ_MDL_META_REQ;
          const txmsgObjMdlEncRtPollReq = counter.txmsg_OBJ_MDL_ENC_RT_POLL_REQ;
          const txmsgObjMdlEnpRtPollReq = counter.txmsg_OBJ_MDL_ENP_RT_POLL_REQ;
          const txmsgObjMdlBmuPollReq = counter.txmsg_OBJ_MDL_BMU_POLL_REQ;
          const txmsgObjMdlPcuPollReq = counter.txmsg_OBJ_MDL_PCU_POLL_REQ;
          const txmsgObjMdlSecondaryCtrlReq = counter.txmsg_OBJ_MDL_SECONDARY_CTRL_REQ;
          const txmsgObjMdlRelayCtrlReq = counter.txmsg_OBJ_MDL_RELAY_CTRL_REQ;
          const txmsgObjMdlGridStatusReq = counter.txmsg_OBJ_MDL_GRID_STATUS_REQ
          const txmsgObjMdlRelayStatusRsp = counter.txmsg_OBJ_MDL_RELAY_STATUS_RSP;
          const txmsgObjMdlcosConfigReq = counter.txmsg_OBJ_MDL_SOC_CONFIG_REQ;
          const txmsgObjMdlTnsStart = counter.txmsg_OBJ_MDL_TNS_START;
          const rxmsgObjMdlTnsStartRsp = counter.rxmsg_OBJ_MDL_TNS_START_RSP;
          const txmsgObjMdlSetUdmir = counter.txmsg_OBJ_MDL_SET_UDMIR;
          const rxmsgObjMdlSetUdmirRsp = counter.rxmsg_OBJ_MDL_SET_UDMIR_RSP;
          const txmsgObjMdlTnsEdn = counter.txmsg_OBJ_MDL_TNS_END;
          const rxmsgObjMdlTnsEndRsp = counter.rxmsg_OBJ_MDL_TNS_END_RSP;
          const txmsgLvsPoll = counter.txmsg_lvs_poll;
          const zmqEcaHello = counter.zmq_ecaHello;
          const zmqEcaDevInfo = counter.zmq_ecaDevInfo;
          const zmqEcaNetworkStatus = counter.zmq_ecaNetworkStatus;
          const zmqEcaAppMsg = counter.zmq_ecaAppMsg;
          const zmqStreamdata = counter.zmq_streamdata;
          const zmqLiveDebug = counter.zmq_live_debug;
          const zmqEcaLiveDebugReq = counter.zmq_eca_live_debug_req;
          const zmqNameplate = counter.zmq_nameplate;
          const zmqEcaSecCtrlMsg = counter.zmq_ecaSecCtrlMsg;
          const zmqMeterlogOk = counter.zmq_meterlog_ok;
          const dmdlFilesIndexed = counter.dmdl_FILES_INDEXED;
          const pfStart = counter.pf_start;
          const pfActivate = counter.pf_activate;
          const devPollMissing = counter.devPollMissing;
          const devMsgRspMissing = counter.devMsgRspMissing;
          const gridProfileTransaction = counter.gridProfileTransaction;
          const secctrlNotReady = counter.secctrlNotReady;
          const fsmRetryTimeout = counter.fsm_retry_timeout;
          const profileTxnAck = counter.profile_txn_ack;
          const backupSocLimitSet = counter.backupSocLimitSet;
          const backupSocLimitChanged = counter.backupSocLimitChanged;
          const backupSocLimitAbove100 = counter.backupSocLimitAbove100;

          //secctrl
          const secctrl = ensembleStatus.secctrl;
          const freqBiasHz = secctrl.freq_bias_hz;
          const voltageBiasV = secctrl.voltage_bias_v;
          const freqBiasHzQ8 = secctrl.freq_bias_hz_q8;
          const voltageBiasVQ5 = secctrl.voltage_bias_v_q5;
          const configuredBackupSoc = secctrl.configured_backup_soc; //in %
          const adjustedBackupSoc = secctrl.adjusted_backup_soc; //in %
          const aggSoc = secctrl.agg_soc; //in %
          const aggBackupEnergy = parseFloat((secctrl.agg_backup_energy) / 1000); //in kWh
          const aggAvailEnergy = parseFloat((secctrl.agg_avail_energy) / 1000); //in kWh

          if (this.ensembleStatusService) {
            this.ensembleStatusService[0]
              .updateCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHz, freqBiasHz)
              .updateCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasV, voltageBiasV)
              .updateCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8, freqBiasHzQ8)
              .updateCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5, voltageBiasVQ5)
              .updateCharacteristic(Characteristic.enphaseEnsembleStatusConfiguredBackupSoc, configuredBackupSoc)
              .updateCharacteristic(Characteristic.enphaseEnsembleStatusAdjustedBackupSoc, adjustedBackupSoc)
              .updateCharacteristic(Characteristic.enphaseEnsembleStatusAggSoc, aggSoc)
              .updateCharacteristic(Characteristic.enphaseEnsembleStatusAggBackupEnergy, aggBackupEnergy)
              .updateCharacteristic(Characteristic.enphaseEnsembleStatusAggAvailEnergy, aggAvailEnergy);
          }

          this.ensembleFreqBiasHz = freqBiasHz;
          this.ensembleVoltageBiasV = voltageBiasV;
          this.ensembleFreqBiasHzQ8 = freqBiasHzQ8;
          this.ensembleVoltageBiasVQ5 = voltageBiasVQ5;
          this.ensembleConfiguredBackupSoc = configuredBackupSoc;
          this.ensembleAdjustedBackupSoc = adjustedBackupSoc;
          this.ensembleAggSoc = aggSoc;
          this.ensembleAggBackupEnergy = aggBackupEnergy;
          this.ensembleAggAvailEnergy = aggAvailEnergy;

          //relay
          const relay = ensembleStatus.relay;
          const mainsAdminState = CONSTANS.ApiCodes[relay.mains_admin_state] || 'undefined';
          const mainsOperState = CONSTANS.ApiCodes[relay.mains_oper_sate] || 'undefined';
          const enpwrGridMode = CONSTANS.ApiCodes[relay.Enpwr_grid_mode] || 'undefined';
          const enchgGridMode = CONSTANS.ApiCodes[relay.Enchg_grid_mode] || 'undefined';

          //profile
          const profil = ensembleStatus.profile;
          const name = profil.name;
          const id = profil.id;
          const version = profil.version;
          const itemCount = profil.item_count;
          const fakeInventoryMode = (ensembleStatus.fakeit.fake_inventory_mode === true);

          this.ensembleStatusInstalled = true;
          this.ensembleGridProfileName = name;
          this.ensembleId = id;
          this.ensembleGridProfileVersion = version;
          this.ensembleItemCount = itemCount;
          this.ensembleFakeInventoryMode = fakeInventoryMode;

          const mqtt = this.mqttEnabled ? this.mqtt.send('Ensemble Status', JSON.stringify(ensembleStatus, null, 2)) : false;
          resolve(true);
        }
      } catch (error) {
        this.log.error(`Device: ${this.host} ${this.name}, ensemble status error: ${error}, reconnect in 15s.`);
        this.checkDeviceInfo = true;
        this.reconnect();
        reject(error);
      };
    });
  };

  updateLiveData() {
    return new Promise(async (resolve, reject) => {
      this.log.debug(`Device: ${this.host} ${this.name}, requesting live data.`);

      try {
        const liveData = await this.axiosInstanceCookie(CONSTANS.ApiUrls.LiveData);
        const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug live data: ${JSON.stringify(liveData.data, null, 2)}`) : false;

        //live data 
        if (liveData.status === 200) {
          //connection
          const connection = liveData.data.connection;
          const connectionMqttState = connection.mqtt_state;
          const connectionProvState = connection.prov_state;
          const connectionAuthState = connection.auth_state;
          const connectionScStream = connection.sc_stream;
          const connectionScDebug = connection.sc_debug;

          //meters
          const meters = liveData.data.meters;
          const metersLastUpdate = meters.last_update;
          const metersSoc = meters.soc;
          const metersMainRelayState = meters.main_relay_state;
          const metersGenRelayState = meters.gen_relay_state;
          const metersBackupBatMode = meters.backup_bat_mode;
          const metersBackupSoc = meters.backup_soc;
          const metersIsSplitPhase = meters.is_split_phase;
          const metersPhaseCount = meters.phase_count;
          const metersEncAggSoc = meters.enc_agg_soc;
          const metersEncAggEnergy = meters.enc_agg_energy;
          const metersAcbAggSoc = meters.acb_agg_soc;
          const metersAcbAggEnergy = meters.acb_agg_energy;

          //meters pv
          const metersPv = meters.pv;
          const metersPvAggPMw = metersPv.agg_p_mw;
          const metersPvAggSMva = metersPv.agg_s_mva;
          const metersPvAggPPhAMw = metersPv.agg_p_ph_a_mw;
          const metersPvAggPPhBMw = metersPv.agg_p_ph_b_mw;
          const metersPvAggPPhCMw = metersPv.agg_p_ph_c_mw;
          const metersPvAggSPhAMva = metersPv.agg_s_ph_a_mva;
          const metersPvAggSPhBMva = metersPv.agg_s_ph_b_mva;
          const metersPvAggSPhCMva = metersPv.agg_s_ph_c_mva;

          //meters storage
          const metersStorage = meters.storage;
          const metersStorageAggPMw = metersStorage.agg_p_mw;
          const metersStorageAggSMva = metersStorage.agg_s_mva;
          const metersStorageAggPPhAMw = metersStorage.agg_p_ph_a_mw;
          const metersStorageAggPPhBMw = metersStorage.agg_p_ph_b_mw;
          const metersStorageAggPPhCMw = metersStorage.agg_p_ph_c_mw;
          const metersStorageAggSPhAMva = metersStorage.agg_s_ph_a_mva;
          const metersStorageAggSPhBMva = metersStorage.agg_s_ph_b_mva;
          const metersStorageAggSPhCMva = metersStorage.agg_s_ph_c_mva;

          //meters grid
          const metersGrid = meters.grid;
          const metersGridAggPMw = metersGrid.agg_p_mw;
          const metersGridAggSMva = metersGrid.agg_s_mva;
          const metersGridAggPPhAMw = metersGrid.agg_p_ph_a_mw;
          const metersGridAggPPhBMw = metersGrid.agg_p_ph_b_mw;
          const metersGridAggPPhCMw = metersGrid.agg_p_ph_c_mw;
          const metersGridAggSPhAMva = metersGrid.agg_s_ph_a_mva;
          const metersGridAggSPhBMva = metersGrid.agg_s_ph_b_mva;
          const metersGridAggSPhCMva = metersGrid.agg_s_ph_c_mva;

          //meters load
          const metersLoad = meters.load;
          const metersLoadAggPMw = metersLoad.agg_p_mw;
          const metersLoadAggSMva = metersLoad.agg_s_mva;
          const metersLoadAggPPhAMw = metersLoad.agg_p_ph_a_mw;
          const metersLoadAggPPhBMw = metersLoad.agg_p_ph_b_mw;
          const metersLoadAggPPhCMw = metersLoad.agg_p_ph_c_mw;
          const metersLoadAggSPhAMva = metersLoad.agg_s_ph_a_mva;
          const metersLoadAggSPhBMva = metersLoad.agg_s_ph_b_mva;
          const metersLoadAggSPhCMva = metersLoad.agg_s_ph_c_mva;

          //meters generator
          const metersGenerator = meters.generator;
          const metersGeneratorAggPMw = metersGenerator.agg_p_mw;
          const metersGeneratorAggSMva = metersGenerator.agg_s_mva;
          const metersGeneratorAggPPhAMw = metersGenerator.agg_p_ph_a_mw;
          const metersGeneratorAggPPhBMw = metersGenerator.agg_p_ph_b_mw;
          const metersGeneratorAggPPhCMw = metersGenerator.agg_p_ph_c_mw;
          const metersGeneratorAggSPhAMva = metersGenerator.agg_s_ph_a_mva;
          const metersGeneratorAggSPhBMva = metersGenerator.agg_s_ph_b_mva;
          const metersGeneratorAggSPhCMva = metersGenerator.agg_s_ph_c_mva;

          //tasks
          const tasks = liveData.data.tasks;
          const tasksId = tasks.task_id;
          const tasksTimestamp = tasks.timestamp;

          //counters
          const counters = liveData.data.counters;
          const countersMainCfgLoad = counters.main_CfgLoad;
          const countersMainCfgChanged = counters.main_CfgChanged;
          const countersMainTaskUpdate = counters.main_TaskUpdate;
          const countersMgttClientPublish = counters.MqttClient_publish;
          const countersMgttClientLiveDebug = counters.MqttClient_live_debug;
          const countersMgttClientRespond = counters.MqttClient_respond;
          const countersMgttClientMsgarrvd = counters.MqttClient_msgarrvd;
          const countersMgttClientCreate = counters.MqttClient_create;
          const countersMgttClientSetCallbacks = counters.MqttClient_setCallbacks;
          const countersMgttClientConnect = counters.MqttClient_connect;
          const countersMgttClientSubscribe = counters.MqttClient_subscribe;
          const countersSslKeysCreate = counters.SSL_Keys_Create;
          const countersScHdlDataPub = counters.sc_hdlDataPub;
          const countersScSendStreamCtrl = counters.sc_SendStreamCtrl;
          const countersScSendDemandRspCtrl = counters.sc_SendDemandRspCtrl;
          const countersRestStatus = counters.rest_Status;

          const mqtt = this.mqttEnabled ? this.mqtt.send('Live Data', JSON.stringify(liveData.data, null, 2)) : false;
          const updateLive = this.checkDeviceInfo ? false : this.updateLive();
          resolve(true);
        }
      } catch (error) {
        this.log.error(`Device: ${this.host} ${this.name}, live data error: ${error}, reconnect in 15s.`);
        this.checkDeviceInfo = true;
        this.reconnect();
      };
    });
  };

  updateProductionData() {
    return new Promise(async (resolve, reject) => {
      this.log.debug(`Device: ${this.host} ${this.name}, requesting production.`);

      try {
        const productionData = this.envoyFirmware7xx ? await this.axiosInstanceCookie(CONSTANS.ApiUrls.InverterProductionSumm) : await this.axiosInstance(CONSTANS.ApiUrls.InverterProductionSumm);
        const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug production: ${JSON.stringify(productionData.data, null, 2)}`) : false;

        //microinverters summary 
        if (productionData.status === 200) {
          const productionEnergyLifetimeOffset = this.productionEnergyLifetimeOffset;
          const productionMicroSummarywhToday = parseFloat(productionData.data.wattHoursToday / 1000);
          const productionMicroSummarywhLastSevenDays = parseFloat(productionData.data.wattHoursSevenDays / 1000);
          const productionMicroSummarywhLifeTime = parseFloat((productionData.data.wattHoursLifetime + productionEnergyLifetimeOffset) / 1000);
          const productionMicroSummaryWattsNow = parseFloat(productionData.data.wattsNow / 1000);

          this.productionMicroSummarywhToday = productionMicroSummarywhToday;
          this.productionMicroSummarywhLastSevenDays = productionMicroSummarywhLastSevenDays;
          this.productionMicroSummarywhLifeTime = productionMicroSummarywhLifeTime;
          this.productionMicroSummaryWattsNow = productionMicroSummaryWattsNow;

          const mqtt = this.mqttEnabled ? this.mqtt.send('Production', JSON.stringify(productionData.data, null, 2)) : false;
          const updateProduction = this.checkDeviceInfo ? false : this.updateProduction();
          resolve(true);
        }
      } catch (error) {
        this.log.error(`Device: ${this.host} ${this.name}, production error: ${error}, reconnect in 15s.`);
        this.checkDeviceInfo = true;
        this.reconnect();
        reject(error);
      };
    });
  };

  updateProductionCtData() {
    return new Promise(async (resolve, reject) => {
      this.log.debug(`Device: ${this.host} ${this.name}, requesting production current transformer.`);

      try {
        const productionCtData = this.envoyFirmware7xx ? await this.axiosInstanceCookie(CONSTANS.ApiUrls.SystemReadingStats) : await this.axiosInstance(CONSTANS.ApiUrls.SystemReadingStats);
        const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug production ct: ${JSON.stringify(productionCtData.data, null, 2)}`) : false;

        //production CT
        if (productionCtData.status === 200) {
          //auto reset peak power
          const date = new Date();
          const currentDayOfWeek = date.getDay();
          const currentDayOfMonth = date.getDate();
          const resetProductionPowerPeak = [false, currentDayOfWeek != this.currentDayOfWeek, (currentDayOfWeek === 6) ? currentDayOfWeek < this.currentDayOfWeek : false, currentDayOfMonth < this.currentDayOfMonth][this.productionPowerPeakAutoReset];
          const resetConsumptionTotalPowerPeak = [false, currentDayOfWeek != this.currentDayOfWeek, (currentDayOfWeek === 6) ? currentDayOfWeek < this.currentDayOfWeek : false, currentDayOfMonth < this.currentDayOfMonth][this.consumptionTotalPowerPeakAutoReset];
          const resetConsumptionNetPowerPeak = [false, currentDayOfWeek != this.currentDayOfWeek, (currentDayOfWeek === 6) ? currentDayOfWeek < this.currentDayOfWeek : false, currentDayOfMonth < this.currentDayOfMonth][this.consumptionNetPowerPeakAutoReset];

          //get enabled devices
          const metersProductionEnabled = this.metersProductionEnabled;
          const metersProductionVoltageDivide = this.metersProductionVoltageDivide;
          const metersConsumptionEnabled = this.metersConsumptionEnabled;
          const metersConsumpionVoltageDivide = this.metersConsumpionVoltageDivide;
          const acBatteriesInstalled = this.acBatteriesInstalled;
          const productionEnergyLifetimeOffset = this.productionEnergyLifetimeOffset;

          const productionMicroSummarywhToday = this.productionMicroSummarywhToday;
          const productionMicroSummarywhLastSevenDays = this.productionMicroSummarywhLastSevenDays;
          const productionMicroSummarywhLifeTime = this.productionMicroSummarywhLifeTime;
          const productionMicroSummaryWattsNow = this.productionMicroSummaryWattsNow;

          //microinverters data
          const productionMicro = productionCtData.data.production[0];
          const productionMicroType = CONSTANS.ApiCodes[productionMicro.type];
          const productionMicroActiveCount = productionMicro.activeCount;
          const productionMicroReadingTime = new Date(productionMicro.readingTime * 1000).toLocaleString();
          const productionMicroPower = parseFloat(productionMicro.wNow / 1000);
          const productionMicroEnergyLifeTime = parseFloat((productionMicro.whLifetime + productionEnergyLifetimeOffset) / 1000);

          //production data
          const production = productionCtData.data.production[1];
          const productionType = metersProductionEnabled ? CONSTANS.ApiCodes[production.type] : productionMicroType;
          const productionActiveCount = metersProductionEnabled ? production.activeCount : productionMicroActiveCount;
          const productionMeasurmentType = metersProductionEnabled ? CONSTANS.ApiCodes[production.measurementType] : productionMicroType;
          const productionReadingTime = metersProductionEnabled ? new Date(production.readingTime * 1000).toLocaleString() : productionMicroReadingTime;
          const productionPower = metersProductionEnabled ? parseFloat(production.wNow / 1000) : productionMicroSummaryWattsNow;

          //read power peak
          const savedProductionPowerPeak = await fsPromises.readFile(this.productionPowerPeakFile);
          const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug read production power peak:${savedProductionPowerPeak} kW`) : false;
          const productionPowerPeak = parseFloat(savedProductionPowerPeak);

          //save power peak
          const powerProductionToWrite = resetProductionPowerPeak ? '0' : productionPower.toString();
          const write = ((productionPower > productionPowerPeak) || resetProductionPowerPeak) ? await fsPromises.writeFile(this.productionPowerPeakFile, powerProductionToWrite) : false;
          const showLog = (write != false) ? this.log.debug(`Device: ${this.host} ${this.name}, saved production power peak successful: ${powerProductionToWrite} kW`) : false;

          //power peak state detected
          const productionPowerPeakDetected = (productionPower >= (this.productionPowerPeakDetectedPower / 1000)) ? true : false;

          //energy
          const productionEnergyLifeTime = metersProductionEnabled ? parseFloat((production.whLifetime + productionEnergyLifetimeOffset) / 1000) : productionMicroSummarywhLifeTime;
          const productionEnergyVarhLeadLifetime = metersProductionEnabled ? parseFloat(production.varhLeadLifetime / 1000) : 0;
          const productionEnergyVarhLagLifetime = metersProductionEnabled ? parseFloat(production.varhLagLifetime / 1000) : 0;
          const productionEnergyLastSevenDays = metersProductionEnabled ? parseFloat(production.whLastSevenDays / 1000) : productionMicroSummarywhLastSevenDays;
          const productionEnergyToday = metersProductionEnabled ? parseFloat(production.whToday / 1000) : productionMicroSummarywhToday;
          const productionEnergyVahToday = metersProductionEnabled ? parseFloat(production.vahToday / 1000) : 0;
          const productionEnergyVarhLeadToday = metersProductionEnabled ? parseFloat(production.varhLeadToday / 1000) : 0;
          const productionEnergyVarhLagToday = metersProductionEnabled ? parseFloat(production.varhLagToday / 1000) : 0;

          //param
          const productionRmsCurrent = metersProductionEnabled ? parseFloat(production.rmsCurrent) : 0;
          const productionRmsVoltage = metersProductionEnabled ? parseFloat((production.rmsVoltage) / metersProductionVoltageDivide) : 0;
          const productionReactivePower = metersProductionEnabled ? parseFloat((production.reactPwr) / 1000) : 0;
          const productionApparentPower = metersProductionEnabled ? parseFloat((production.apprntPwr) / 1000) : 0;
          const productionPwrFactor = metersProductionEnabled ? parseFloat(production.pwrFactor) : 0;

          if (this.productionsService) {
            this.productionsService[0]
              .updateCharacteristic(Characteristic.enphaseReadingTime, productionReadingTime)
              .updateCharacteristic(Characteristic.enphasePower, productionPower)
              .updateCharacteristic(Characteristic.enphasePowerMax, productionPowerPeak)
              .updateCharacteristic(Characteristic.enphasePowerMaxDetected, productionPowerPeakDetected)
              .updateCharacteristic(Characteristic.enphaseEnergyToday, productionEnergyToday)
              .updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, productionEnergyLastSevenDays)
              .updateCharacteristic(Characteristic.enphaseEnergyLifeTime, productionEnergyLifeTime)
              .updateCharacteristic(Characteristic.enphasePowerMaxReset, false);
            if (metersProductionEnabled) {
              this.productionsService[0]
                .updateCharacteristic(Characteristic.enphaseRmsCurrent, productionRmsCurrent)
                .updateCharacteristic(Characteristic.enphaseRmsVoltage, productionRmsVoltage)
                .updateCharacteristic(Characteristic.enphaseReactivePower, productionReactivePower)
                .updateCharacteristic(Characteristic.enphaseApparentPower, productionApparentPower)
                .updateCharacteristic(Characteristic.enphasePwrFactor, productionPwrFactor);
            }
          }

          this.productionActiveCount = productionActiveCount;
          this.productionType = productionType;
          this.productionMeasurmentType = productionMeasurmentType;
          this.productionReadingTime = productionReadingTime;
          this.productionPower = productionPower;
          this.productionPowerPeak = productionPowerPeak;
          this.productionPowerPeakDetected = productionPowerPeakDetected;
          this.productionEnergyToday = productionEnergyToday;
          this.productionEnergyLastSevenDays = productionEnergyLastSevenDays;
          this.productionEnergyLifeTime = productionEnergyLifeTime;

          this.productionRmsCurrent = productionRmsCurrent;
          this.productionRmsVoltage = productionRmsVoltage;
          this.productionReactivePower = productionReactivePower;
          this.productionApparentPower = productionApparentPower;
          this.productionPwrFactor = productionPwrFactor;

          //consumption data
          if (metersConsumptionEnabled) {
            this.consumptionsType = new Array();
            this.consumptionsMeasurmentType = new Array();
            this.consumptionsActiveCount = new Array();
            this.consumptionsReadingTime = new Array();
            this.consumptionsPower = new Array();
            this.consumptionsPowerPeak = new Array();
            this.consumptionsPowerPeakDetected = new Array();
            this.consumptionsEnergyToday = new Array();
            this.consumptionsEnergyLastSevenDays = new Array();
            this.consumptionsEnergyLifeTime = new Array();
            this.consumptionsRmsCurrent = new Array();
            this.consumptionsRmsVoltage = new Array();
            this.consumptionsReactivePower = new Array();
            this.consumptionsApparentPower = new Array();
            this.consumptionsPwrFactor = new Array();

            const metersConsumptionCount = productionCtData.data.consumption.length;
            for (let i = 0; i < metersConsumptionCount; i++) {
              //power
              const consumption = productionCtData.data.consumption[i];
              const consumptionType = CONSTANS.ApiCodes[consumption.type];
              const consumptionActiveCount = consumption.activeCount;
              const consumptionMeasurmentType = CONSTANS.ApiCodes[consumption.measurementType];
              const consumptionReadingTime = new Date(consumption.readingTime * 1000).toLocaleString();
              const consumptionPower = parseFloat(consumption.wNow / 1000);

              //read saved power peak
              const consumptionsName = ['consumption total', 'consumption net'][i];
              const consumptionsFile = [this.consumptionTotalPowerPeakFile, this.consumptionNetPowerPeakFile][i];
              const savedConsumptionPowerPeak = await fsPromises.readFile(consumptionsFile);
              const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug read ${consumptionsName} power peak successful: ${savedConsumptionPowerPeak} kW`) : false;
              const consumptionPowerPeak = parseFloat(savedConsumptionPowerPeak);

              //save power peak
              const autoReset = [resetConsumptionTotalPowerPeak, resetConsumptionNetPowerPeak][i]
              const consumptionPowerToWrite = autoReset ? '0' : consumptionPower.toString();
              const write = ((consumptionPower > consumptionPowerPeak) || autoReset) ? await fsPromises.writeFile(consumptionsFile, consumptionPowerToWrite) : false;
              const showLog = (write != false) ? this.log.debug(`Device: ${this.host} ${this.name}, saved %s successful : ${consumptionsName} ${consumptionPowerToWrite} kW`) : false;

              //power peak state detected
              const consumptionsPowerPeakDetected = [this.consumptionTotalPowerPeakDetectedPower, this.consumptionNetPowerPeakDetectedPower][i];
              const consumptionPowerPeakDetected = (consumptionPower >= (consumptionsPowerPeakDetected / 1000)) ? true : false;

              //energy
              const consumptionsLifeTimeOffset = [this.consumptionTotalEnergyLifetimeOffset, this.consumptionNetEnergyLifetimeOffset][i];
              const consumptionEnergyLifeTime = parseFloat((consumption.whLifetime + consumptionsLifeTimeOffset) / 1000);
              const consumptionEnergyVarhLeadLifetime = parseFloat(consumption.varhLeadLifetime / 1000);
              const consumptionEnergyVarhLagLifetime = parseFloat(consumption.varhLagLifetime / 1000);
              const consumptionEnergyLastSevenDays = parseFloat(consumption.whLastSevenDays / 1000);
              const consumptionEnergyToday = parseFloat(consumption.whToday / 1000);
              const consumptionEnergyVahToday = parseFloat(consumption.vahToday / 1000);
              const consumptionEnergyVarhLeadToday = parseFloat(consumption.varhLeadToday / 1000);
              const consumptionEnergyVarhLagToday = parseFloat(consumption.varhLagToday / 1000);

              //net param
              const consumptionRmsCurrent = parseFloat(consumption.rmsCurrent);
              const consumptionRmsVoltage = parseFloat((consumption.rmsVoltage) / metersConsumpionVoltageDivide);
              const consumptionReactivePower = parseFloat((consumption.reactPwr) / 1000);
              const consumptionApparentPower = parseFloat((consumption.apprntPwr) / 1000);
              const consumptionPwrFactor = parseFloat(consumption.pwrFactor);

              if (this.consumptionsService) {
                this.consumptionsService[i]
                  .updateCharacteristic(Characteristic.enphaseReadingTime, consumptionReadingTime)
                  .updateCharacteristic(Characteristic.enphasePower, consumptionPower)
                  .updateCharacteristic(Characteristic.enphasePowerMax, consumptionPowerPeak)
                  .updateCharacteristic(Characteristic.enphasePowerMaxDetected, consumptionPowerPeakDetected)
                  .updateCharacteristic(Characteristic.enphaseEnergyToday, consumptionEnergyToday)
                  .updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, consumptionEnergyLastSevenDays)
                  .updateCharacteristic(Characteristic.enphaseEnergyLifeTime, consumptionEnergyLifeTime)
                  .updateCharacteristic(Characteristic.enphaseRmsCurrent, consumptionRmsCurrent)
                  .updateCharacteristic(Characteristic.enphaseRmsVoltage, consumptionRmsVoltage)
                  .updateCharacteristic(Characteristic.enphaseReactivePower, consumptionReactivePower)
                  .updateCharacteristic(Characteristic.enphaseApparentPower, consumptionApparentPower)
                  .updateCharacteristic(Characteristic.enphasePwrFactor, consumptionPwrFactor)
                  .updateCharacteristic(Characteristic.enphasePowerMaxReset, false);
              }
              this.consumptionsType.push(consumptionType);
              this.consumptionsMeasurmentType.push(consumptionMeasurmentType);
              this.consumptionsActiveCount.push(consumptionActiveCount);
              this.consumptionsReadingTime.push(consumptionReadingTime);
              this.consumptionsPower.push(consumptionPower);
              this.consumptionsPowerPeak.push(consumptionPowerPeak);
              this.consumptionsPowerPeakDetected.push(consumptionPowerPeakDetected);
              this.consumptionsEnergyToday.push(consumptionEnergyToday);
              this.consumptionsEnergyLastSevenDays.push(consumptionEnergyLastSevenDays);
              this.consumptionsEnergyLifeTime.push(consumptionEnergyLifeTime);
              this.consumptionsRmsCurrent.push(consumptionRmsCurrent);
              this.consumptionsRmsVoltage.push(consumptionRmsVoltage);
              this.consumptionsReactivePower.push(consumptionReactivePower);
              this.consumptionsApparentPower.push(consumptionApparentPower);
              this.consumptionsPwrFactor.push(consumptionPwrFactor);
            }
            this.metersConsumptionCount = metersConsumptionCount;
          }

          //ac btteries summary
          if (acBatteriesInstalled) {
            const acBaterie = productionCtData.data.storage[0];
            const type = CONSTANS.ApiCodes[acBaterie.type] || 'AC Batterie';
            const activeCount = acBaterie.activeCount;
            const readingTime = new Date(acBaterie.readingTime * 1000).toLocaleString();
            const wNow = parseFloat((acBaterie.wNow) / 1000);
            const whNow = parseFloat((acBaterie.whNow + this.acBatteriesStorageOffset) / 1000);
            const chargeStatus = CONSTANS.ApiCodes[acBaterie.state] || 'undefined';
            const percentFull = acBaterie.percentFull;

            if (this.acBatteriesSummaryService) {
              this.acBatteriesSummaryService[0]
                .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryReadingTime, readingTime)
                .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryPower, wNow)
                .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryEnergy, whNow)
                .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryPercentFull, percentFull)
                .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryActiveCount, activeCount)
                .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryState, chargeStatus);
            }

            this.acBatteriesSummaryType = type;
            this.acBatteriesSummaryActiveCount = activeCount;
            this.acBatteriesSummaryReadingTime = readingTime;
            this.acBatteriesSummaryPower = wNow;
            this.acBatteriesSummaryEnergy = whNow;
            this.acBatteriesSummaryState = chargeStatus;
            this.acBatteriesSummaryPercentFull = percentFull;
          }
          this.currentDayOfWeek = currentDayOfWeek;
          this.currentDayOfMonth = currentDayOfMonth;

          const mqtt = this.mqttEnabled ? this.mqtt.send('Production CT', JSON.stringify(productionCtData.data, null, 2)) : false;
          const updateProductionCt = this.checkDeviceInfo ? false : this.updateProductionCt();
          resolve(true);
        }
      } catch (error) {
        this.log.error(`Device: ${this.host} ${this.name}, production ct error: ${error}, reconnect in 15s.`);
        this.checkDeviceInfo = true;
        this.reconnect();
        reject(error);
      };
    });
  };

  updateMicroinvertersData() {
    return new Promise(async (resolve, reject) => {
      this.log.debug(`Device: ${this.host} ${this.name}, requesting microinverters`);

      try {
        //digest auth envoy
        const passwd = this.envoyPasswd;
        const digestAuthEnvoy = new AxiosDigestAuth({
          user: CONSTANS.EnvoyUser,
          passwd: passwd
        });

        const options = {
          method: 'GET',
          url: this.url + CONSTANS.ApiUrls.InverterProduction,
          headers: {
            Accept: 'application/json'
          }
        }

        const microinvertersData = this.envoyFirmware7xx ? await this.axiosInstanceCookie(CONSTANS.ApiUrls.InverterProduction) : await digestAuthEnvoy.request(options);
        const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug microinverters: ${JSON.stringify(microinvertersData.data, null, 2)}`) : false;

        if (microinvertersData.status === 200) {
          this.allMicroinvertersSerialNumber = new Array();
          const allMicroinvertersCount = microinvertersData.data.length;
          for (let i = 0; i < allMicroinvertersCount; i++) {
            const allSerialNumber = microinvertersData.data[i].serialNumber;
            this.allMicroinvertersSerialNumber.push(allSerialNumber);
          }

          //microinverters power
          this.microinvertersReadingTime = new Array();
          this.microinvertersDevType = new Array();
          this.microinvertersLastPower = new Array();
          this.microinvertersMaxPower = new Array();

          for (let i = 0; i < this.microinvertersCount; i++) {
            const index = this.allMicroinvertersSerialNumber.indexOf(this.microinvertersSerialNumber[i]);
            const microinverter = microinvertersData.data[index];
            const lastReportDate = new Date(microinverter.lastReportDate * 1000).toLocaleString();
            const devType = microinverter.devType;
            const lastReportWatts = parseInt(microinverter.lastReportWatts);
            const microinverterPower = (lastReportWatts < 0) ? 0 : lastReportWatts;
            const maxReportWatts = parseInt(microinverter.maxReportWatts);

            if (this.microinvertersService) {
              this.microinvertersService[i]
                .updateCharacteristic(Characteristic.enphaseMicroinverterLastReportDate, lastReportDate)
                .updateCharacteristic(Characteristic.enphaseMicroinverterPower, microinverterPower)
                .updateCharacteristic(Characteristic.enphaseMicroinverterPowerMax, maxReportWatts)
            }

            this.microinvertersReadingTime.push(lastReportDate);
            this.microinvertersDevType.push(devType);
            this.microinvertersLastPower.push(microinverterPower);
            this.microinvertersMaxPower.push(maxReportWatts);
          }

          const mqtt = this.mqttEnabled ? this.mqtt.send('Microinverters', JSON.stringify(microinvertersData.data, null, 2)) : false;
          const updateMicroinverters = this.checkDeviceInfo ? false : this.updateMicroinverters();
          resolve(true);
        }
      } catch (error) {
        this.log.error(`Device: ${this.host} ${this.name}, microinverters error: ${error}, reconnect in 15s.`);
        this.checkDeviceInfo = true;
        this.reconnect();
        reject(error);
      };
    });
  };

  updateProductionPowerModeData() {
    return new Promise(async (resolve, reject) => {
      this.log.debug(`Device: ${this.host} ${this.name}, requesting power mode.`);

      try {
        const powerModeUrl = CONSTANS.ApiUrls.PowerForcedModePutGet.replace("EID", this.envoyDevId);
        const options = {
          method: 'GET',
          url: this.url + powerModeUrl,
          headers: {
            Accept: 'application/json'
          }
        }

        const powerModeData = this.envoyFirmware7xx ? await this.axiosInstanceCookie(powerModeUrl) : await this.digestAuthInstaller.request(options);
        const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug power mode: ${JSON.stringify(powerModeData.data, null, 2)}`) : false;

        if (powerModeData.status === 200) {
          const productionPowerMode = (powerModeData.data.powerForcedOff === false);

          if (this.envoysService) {
            this.envoysService[0]
              .updateCharacteristic(Characteristic.enphaseEnvoyProductionPowerMode, productionPowerMode)
          }

          this.productionPowerMode = productionPowerMode;
          const mqtt = this.mqttEnabled ? this.mqtt.send('Power Mode', JSON.stringify(powerModeData.data, null, 2)) : false;
          resolve(true);
        }

      } catch (error) {
        this.log.error(`Device: ${this.host} ${this.name}, power mode error: ${error}, reconnect in 15s.`);
        this.checkDeviceInfo = true;
        this.reconnect();
        reject(error);
      };
    });
  }

  updatePlcLevelData() {
    return new Promise(async (resolve, reject) => {
      this.log.debug(`Device: ${this.host} ${this.name}, requesting pcu communication level.`);
      this.checkCommLevel = true;

      try {
        const options = {
          method: 'GET',
          url: this.url + CONSTANS.ApiUrls.InverterComm,
          headers: {
            Accept: 'application/json'
          }
        }

        const pcuCommLevelData = this.envoyFirmware7xx ? await this.axiosInstanceCookie(CONSTANS.ApiUrls.InverterComm) : await this.digestAuthInstaller.request(options);
        const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug pcu comm level: ${JSON.stringify(pcuCommLevelData.data, null, 2)}`) : false;

        if (pcuCommLevelData.status === 200) {
          //create arrays
          this.microinvertersCommLevel = new Array();
          this.acBatteriesCommLevel = new Array();
          this.qRelaysCommLevel = new Array();
          this.enchargesCommLevel = new Array();

          // get comm level data
          const commLevel = pcuCommLevelData.data;

          // get devices count
          const microinvertersCount = this.microinvertersCount
          const acBatteriesCount = this.acBatteriesCount;
          const qRelaysCount = this.qRelaysCount;
          const enchargesCount = this.enchargesCount;

          for (let i = 0; i < microinvertersCount; i++) {
            const key = (`${this.microinvertersSerialNumber[i]}`);
            const value = (commLevel[key]) ? (commLevel[key]) * 20 : 0;

            if (this.microinvertersService) {
              this.microinvertersService[i]
                .updateCharacteristic(Characteristic.enphaseMicroinverterCommLevel, value)
            }
            this.microinvertersCommLevel.push(value);
          }

          for (let i = 0; i < acBatteriesCount; i++) {
            const key = (`${this.acBatteriesSerialNumber[i]}`);
            const value = (commLevel[key]) ? (commLevel[key]) * 20 : 0;

            if (this.acBatteriesService) {
              this.acBatteriesService[i]
                .updateCharacteristic(Characteristic.enphaseAcBatterieCommLevel, value)
            }
            this.acBatteriesCommLevel.push(value);
          }

          for (let i = 0; i < qRelaysCount; i++) {
            const key = (`${this.qRelaysSerialNumber[i]}`);
            const value = (commLevel[key]) ? (commLevel[key]) * 20 : 0;

            if (this.qRelaysService) {
              this.qRelaysService[i]
                .updateCharacteristic(Characteristic.enphaseQrelayCommLevel, value)
            }
            this.qRelaysCommLevel.push(value);
          }

          for (let i = 0; i < enchargesCount; i++) {
            const key = (`${this.enchargesSerialNumber[i]}`);
            const value = (commLevel[key]) ? (commLevel[key]) * 20 : 0;

            if (this.enchargesService) {
              this.enchargesService[i]
                .updateCharacteristic(Characteristic.enphaseEnchargeCommLevel, value)
            }
            this.enchargesCommLevel.push(value);
          }

          //disable check comm level switch
          if (this.envoysService) {
            this.envoysService[0]
              .updateCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel, false);
          }

          this.checkCommLevel = false;
          const mqtt = this.mqttEnabled ? this.mqtt.send('PCU Comm Level', JSON.stringify(commLevel, null, 2)) : false;
          resolve(true);
        }
      } catch (error) {
        this.log.error(`Device: ${this.host} ${this.name}, pcu comm level error: ${error}`);
        this.checkCommLevel = false;
        reject(error);
      };
    });
  };

  getDeviceInfo() {
    this.log.debug(`Device: ${this.host} ${this.name}, requesting device info.`);

    //envoy
    const time = this.envoyTime;
    const deviceSn = this.envoySerialNumber;
    const devicePn = this.envoyModelName;
    const deviceSoftware = this.envoyFirmware;

    //inventory
    const metersInstalled = this.metersInstalled;
    const metersProductionEnabled = this.metersProductionEnabled;
    const metersConsumptionEnabled = this.metersConsumptionEnabled;

    const microinvertersCount = this.microinvertersCount;
    const acBatteriesCount = this.acBatteriesCount;
    const qRelaysCount = this.qRelaysCount;

    const esubsInstalled = this.esubsInstalled;
    const enpowersInstalled = this.enpowersInstalled;
    const enpowersCount = this.enpowersCount;
    const enchargesInstalled = this.enchargesInstalled;
    const enchargesCount = this.enchargesCount;
    const wirelessConnectionKitInstalled = this.wirelessConnectionKitInstalled;

    if (!this.disableLogDeviceInfo && this.checkDeviceInfo) {
      this.log(`-------- ${this.name} --------`);
      this.log(`Manufacturer: Enphase`);
      this.log(`Model: ${devicePn}`);
      this.log(`Firmware: ${deviceSoftware}`);
      this.log(`SerialNr: ${deviceSn}`);
      this.log(`Time: ${time}`);
      this.log(`------------------------------`);
      this.log(`Q-Relays: ${qRelaysCount}`);
      this.log(`Inverters: ${microinvertersCount}`);
      this.log(`Batteries: ${acBatteriesCount}`);
      this.log(`--------------------------------`);
      this.log(`Meters: ${metersInstalled ? `Yes` : `No`}`);
      if (metersInstalled) {
        this.log(`Production: ${metersProductionEnabled ? `Enabled` : `Disabled`}`);
        this.log(`Consumption: ${metersConsumptionEnabled ? `Enabled` : `Disabled`}`);
        this.log(`--------------------------------`);
      }
      this.log(`Ensemble: ${esubsInstalled ? `Yes` : `No`}`);
      if (esubsInstalled) {
        this.log(`Enpowers: ${enpowersInstalled ? `Yes ${enpowersCount}` : `No`}`);
        this.log(`Encharges: ${enchargesInstalled ? `Yes ${enchargesCount}` : `No`}`);
        this.log(`Wireless Kit: ${wirelessConnectionKitInstalled ? `Yes` : `No`}`);
      }
      this.log(`--------------------------------`);
    };

    if (!deviceSn || !this.startPrepareAccessory) {
      this.log.error(`Device: ${this.host} ${this.name}, serial number of envoy unknown: ${deviceSn}, reconnect in 15s.`);
      this.checkDeviceInfo = true;
      this.reconnect();
      return;
    };

    this.checkDeviceInfo = false;
    this.prepareAccessory();
    this.updateHome();
    const startMeterReading = this.metersInstalled ? this.updateMetersReading() : false;
    const startLive = this.envoyFirmware7xx ? this.updateLive() : false;
    const startEnsembleInventory = ((this.envoyFirmware7xx && this.esubsInstalled) || (!this.envoyFirmware7xx && this.esubsInstalled && this.installerPasswd)) ? this.updateEnsembleInventory() : false;
    this.updateProduction();
    this.updateProductionCt();
    const startMicroinverters = (this.envoyFirmware7xx || (!this.envoyFirmware7xx && this.envoyPasswd)) ? this.updateMicroinverters() : false;
  };

  //Prepare accessory
  prepareAccessory() {
    this.log.debug('prepareAccessory');
    const manufacturer = 'Enphase';
    const modelName = this.envoyModelName;
    const serialNumber = this.envoySerialNumber;
    const firmwareRevision = this.envoyFirmware;

    const accessoryName = this.name;
    const accessoryUUID = UUID.generate(serialNumber);
    const accessoryCategory = Categories.OTHER;
    const accessory = new Accessory(accessoryName, accessoryUUID, accessoryCategory);

    //information service
    this.log.debug('prepareInformationService');
    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, manufacturer)
      .setCharacteristic(Characteristic.Model, modelName)
      .setCharacteristic(Characteristic.SerialNumber, serialNumber)
      .setCharacteristic(Characteristic.FirmwareRevision, firmwareRevision);

    this.log.debug('prepareEnphaseServices');
    //get enabled devices
    const metersInstalled = this.metersInstalled;
    const metersCount = this.metersCount;
    const metersProductionEnabled = this.metersProductionEnabled;
    const metersConsumptionEnabled = this.metersConsumptionEnabled;
    const metersConsumptionCount = this.metersConsumptionCount;
    const microinvertersInstalled = this.microinvertersInstalled
    const microinvertersCount = this.microinvertersCount
    const acBatteriesInstalled = this.acBatteriesInstalled;
    const acBatteriesCount = this.acBatteriesCount;
    const qRelaysInstalled = this.qRelaysInstalled;
    const qRelaysCount = this.qRelaysCount;
    const esubsInstalled = this.esubsInstalled;
    const esubsCount = this.esubsCount;
    const enpowersInstalled = this.enpowersInstalled;
    const enpowersCount = this.enpowersCount;
    const enchargesInstalled = this.enchargesInstalled;
    const enchargesCount = this.enchargesCount;
    const ensembleStatusInstalled = this.ensembleStatusInstalled;
    const wirelessConnectionKitInstalled = this.wirelessConnectionKitInstalled;
    const wirelessConnectionKitConnectionsCount = this.wirelessConnectionKitConnectionsCount;

    //envoy
    this.envoysService = new Array();
    const enphaseEnvoyService = new Service.enphaseEnvoyService(`Envoy ${serialNumber}`, 'enphaseEnvoyService');
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyAlerts)
      .onGet(async () => {
        const value = this.envoyAlerts;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, alerts: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface)
      .onGet(async () => {
        const value = this.envoyPrimaryInterface;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, network interface: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm)
      .onGet(async () => {
        const value = this.envoyWebComm;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, web communication: ${value ? 'Yes' : 'No'}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten)
      .onGet(async () => {
        const value = this.envoyEverReportedToEnlighten;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, report to enlighten: ${value ? 'Yes' : 'No'}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel)
      .onGet(async () => {
        const value = (`${this.envoyCommNum} / ${this.envoyCommLevel} %`);
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, communication devices and level: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel)
      .onGet(async () => {
        const value = (`${this.envoyCommNsrbNum} / ${this.envoyCommNsrbLevel} %`);
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, communication qRelays and level: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel)
      .onGet(async () => {
        const value = (`${this.envoyCommPcuNum} / ${this.envoyCommPcuLevel} %`);
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, communication Microinverters and level: ${value}`);
        return value;
      });
    if (acBatteriesInstalled) {
      enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel)
        .onGet(async () => {
          const value = (`${this.envoyCommAcbNum} / ${this.envoyCommAcbLevel} %`);
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, communication AC Batteries and level ${value}`);
          return value;
        });
    }
    if (enchargesInstalled) {
      enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumEnchgAndLevel)
        .onGet(async () => {
          const value = (`${this.envoyCommEnchgNum} / ${this.envoyCommEnchgLevel} %`);
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, communication Encharges and level ${value}`);
          return value;
        });
    }
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyDbSize)
      .onGet(async () => {
        const value = (`${this.envoyDbSize} / ${this.envoyDbPercentFull} %`);
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, data base size: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyTariff)
      .onGet(async () => {
        const value = this.envoyTariff;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, tariff: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyUpdateStatus)
      .onGet(async () => {
        const value = this.envoyUpdateStatus;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, update status: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyFirmware)
      .onGet(async () => {
        const value = this.envoyFirmware;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, firmware: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyTimeZone)
      .onGet(async () => {
        const value = this.envoyTimeZone;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, time zone: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime)
      .onGet(async () => {
        const value = `${this.envoyCurrentDate} ${this.envoyCurrentTime}`;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, current date and time: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporDate)
      .onGet(async () => {
        const value = this.envoyLastEnlightenReporDate;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, last report to enlighten: ${value}`);
        return value;
      });
    if (enpowersInstalled) {
      enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyEnpowerConnected)
        .onGet(async () => {
          const value = this.envoyEnpowerConnected;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, enpower connected: ${value ? 'Yes' : 'No'}`);
          return value;
        });
      enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyEnpowerGridStatus)
        .onGet(async () => {
          const value = this.envoyEnpowerGridStatus;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, enpower grid status: ${value}`);
          return value;
        });
    }
    if (this.supportPlcLevel && (this.envoyFirmware7xx || (!this.envoyFirmware7xx && this.installerPasswd))) {
      enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel)
        .onGet(async () => {
          const state = this.checkCommLevel;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, checking plc level: ${state ? `Yes` : `No`}`);
          return state;
        })
        .onSet(async (state) => {
          const checkCommLevel = state ? await this.updatePlcLevelData() : false;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, check plc level: ${state ? `Yes` : `No`}`);
        });
    }
    if (this.supportProductionPowerMode && (this.envoyFirmware7xx || (!this.envoyFirmware7xx && this.installerPasswd && this.envoyDevId.length === 9))) {
      enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyProductionPowerMode)
        .onGet(async () => {
          const state = this.productionPowerMode;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Envoy: ${serialNumber}, production power mode state: ${state ? 'Enabled' : 'Disabled'}`);
          return state;
        })
        .onSet(async (state) => {
          try {
            const powerModeUrl = CONSTANS.ApiUrls.PowerForcedModePutGet.replace("EID", this.envoyDevId);
            const data = JSON.stringify({
              length: 1,
              arr: [state ? 0 : 1]
            });

            const options = {
              method: 'PUT',
              url: this.url + powerModeUrl,
              data: data,
              headers: {
                Accept: 'application/json'
              }
            }

            const powerModeData = this.envoyFirmware7xx ? await this.axiosInstanceCookie(powerModeUrl) : await this.digestAuthInstaller.request(options);
            const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${accessoryName}, debug set powerModeData: ${JSON.stringify(powerModeData.data, null, 2)}`) : false;
          } catch (error) {
            this.log.debug(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, set powerModeData error: ${error}`);
          };
        });
    }
    this.envoysService.push(enphaseEnvoyService);
    accessory.addService(this.envoysService[0]);

    //qrelays
    if (qRelaysInstalled) {
      this.qRelaysService = new Array();
      for (let i = 0; i < qRelaysCount; i++) {
        const qRelaySerialNumber = this.qRelaysSerialNumber[i];
        const enphaseQrelayService = new Service.enphaseQrelayService(`Q-Relay ${qRelaySerialNumber}`, `enphaseQrelayService${i}`);
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayState)
          .onGet(async () => {
            const value = this.qRelaysRelay[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Q-Relay: ${qRelaySerialNumber}, relay state: ${value ? 'Closed' : 'Open'}`);
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLinesCount)
          .onGet(async () => {
            const value = this.qRelaysLinesCount[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Q-Relay: ${qRelaySerialNumber}, lines: ${value}`);
            return value;
          });
        if (this.qRelaysLinesCount[i] > 0) {
          enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLine1Connected)
            .onGet(async () => {
              const value = this.qRelaysLine1Connected[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Q-Relay: ${qRelaySerialNumber}, line 1: ${value ? 'Closed' : 'Open'}`);
              return value;
            });
        }
        if (this.qRelaysLinesCount[i] >= 2) {
          enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLine2Connected)
            .onGet(async () => {
              const value = this.qRelaysLine2Connected[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Q-Relay: ${qRelaySerialNumber}, line 2: ${value ? 'Closed' : 'Open'}`);
              return value;
            });
        }
        if (this.qRelaysLinesCount[i] >= 3) {
          enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLine3Connected)
            .onGet(async () => {
              const value = this.qRelaysLine3Connected[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Q-Relay: ${qRelaySerialNumber}, line 3: ${value ? 'Closed' : 'Open'}`);
              return value;
            });
        }
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayProducing)
          .onGet(async () => {
            const value = this.qRelaysProducing[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Q-Relay: ${qRelaySerialNumber}, producing: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayCommunicating)
          .onGet(async () => {
            const value = this.qRelaysCommunicating[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Q-Relay: ${qRelaySerialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayProvisioned)
          .onGet(async () => {
            const value = this.qRelaysProvisioned[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Q-Relay: ${qRelaySerialNumber}, provisioned: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayOperating)
          .onGet(async () => {
            const value = this.qRelaysOperating[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Q-Relay: ${qRelaySerialNumber}, operating: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        if (this.supportPlcLevel && (this.envoyFirmware7xx || (!this.envoyFirmware7xx && this.installerPasswd))) {
          enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayCommLevel)
            .onGet(async () => {
              const value = this.qRelaysCommLevel[i] || 0;
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Q-Relay: ${qRelaySerialNumber}, plc level: ${value} %`);
              return value;
            });
        }
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayStatus)
          .onGet(async () => {
            const value = this.qRelaysStatus[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Q-Relay: ${qRelaySerialNumber}, status: ${value}`);
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayFirmware)
          .onGet(async () => {
            const value = this.qRelaysFirmware[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Q-Relay: ${qRelaySerialNumber}, firmware: ${value}`);
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLastReportDate)
          .onGet(async () => {
            const value = this.qRelaysLastReportDate[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Q-Relay: ${qRelaySerialNumber}, last report: ${value}`);
            return value;
          });
        this.qRelaysService.push(enphaseQrelayService);
        accessory.addService(this.qRelaysService[i]);
      }
    }

    //meters
    if (metersInstalled) {
      this.metersService = new Array();
      for (let i = 0; i < metersCount; i++) {
        const meterMeasurementType = this.metersMeasurementType[i];
        const enphaseMeterService = new Service.enphaseMeterService(`Meter ${meterMeasurementType}`, `enphaseMeterService${i}`);
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterState)
          .onGet(async () => {
            const value = this.metersState[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Meter: ${meterMeasurementType}, state: ${value ? 'Enabled' : 'Disabled'}`);
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterPhaseMode)
          .onGet(async () => {
            const value = this.metersPhaseMode[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Meter: ${meterMeasurementType}, phase mode: ${value}`);
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterPhaseCount)
          .onGet(async () => {
            const value = this.metersPhaseCount[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Meter: ${meterMeasurementType}, phase count: ${value}`);
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterMeteringStatus)
          .onGet(async () => {
            const value = this.metersMeteringStatus[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Meter: ${meterMeasurementType}, metering status: ${value}`);
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterStatusFlags)
          .onGet(async () => {
            const value = this.metersStatusFlags[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Meter: ${meterMeasurementType}, status flag: ${value}`);
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterActivePower)
          .onGet(async () => {
            const value = this.activePowerSumm[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Meter: ${meterMeasurementType}, active power: ${value} kW`);
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterApparentPower)
          .onGet(async () => {
            const value = this.apparentPowerSumm[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Meter: ${meterMeasurementType}, apparent power: ${value} kVA`);
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterReactivePower)
          .onGet(async () => {
            const value = this.reactivePowerSumm[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Meter: ${meterMeasurementType}, reactive power: ${value} kVAr`);
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterPwrFactor)
          .onGet(async () => {
            const value = this.pwrFactorSumm[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Meter: ${meterMeasurementType}, power factor: ${value} cos φ`);
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterVoltage)
          .onGet(async () => {
            const value = this.voltageSumm[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Meter: ${meterMeasurementType}, voltage: ${value} V`);
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterCurrent)
          .onGet(async () => {
            const value = this.currentSumm[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Meter: ${meterMeasurementType}, current: ${value} A`);
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterFreq)
          .onGet(async () => {
            const value = this.freqSumm[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Meter: ${meterMeasurementType}, frequency: ${value} Hz`);
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterReadingTime)
          .onGet(async () => {
            const value = this.timestampSumm[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Meter: ${meterMeasurementType}, last report: ${value}`);
            return value;
          });
        this.metersService.push(enphaseMeterService);
        accessory.addService(this.metersService[i]);
      }
    }

    //power and energy production
    this.productionsService = new Array();
    const enphaseProductionService = new Service.enphasePowerAndEnergyService(`Power And Energy ${this.productionMeasurmentType}`, 'enphaseProductionService');
    enphaseProductionService.getCharacteristic(Characteristic.enphasePower)
      .onGet(async () => {
        const value = this.productionPower;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Production power: ${value} kW`);
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphasePowerMax)
      .onGet(async () => {
        const value = this.productionPowerPeak;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Production power peak: ${value} kW`);
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphasePowerMaxDetected)
      .onGet(async () => {
        const value = this.productionPowerPeakDetected;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Production power peak detected: ${value ? 'Yes' : 'No'}`);
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphaseEnergyToday)
      .onGet(async () => {
        const value = this.productionEnergyToday;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Production energy today: ${value} kWh`);
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
      .onGet(async () => {
        const value = this.productionEnergyLastSevenDays;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Production energy last seven days: ${value} kWh`);
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
      .onGet(async () => {
        const value = this.productionEnergyLifeTime;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Production energy lifetime: ${value} kWh`);
        return value;
      });
    if (metersInstalled && metersProductionEnabled) {
      enphaseProductionService.getCharacteristic(Characteristic.enphaseRmsCurrent)
        .onGet(async () => {
          const value = this.productionRmsCurrent;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Production current: ${value} A`);
          return value;
        });
      enphaseProductionService.getCharacteristic(Characteristic.enphaseRmsVoltage)
        .onGet(async () => {
          const value = this.productionRmsVoltage;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Production voltage: ${value} V`);
          return value;
        });
      enphaseProductionService.getCharacteristic(Characteristic.enphaseReactivePower)
        .onGet(async () => {
          const value = this.productionReactivePower;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Production net reactive power: ${value} kVAr`);
          return value;
        });
      enphaseProductionService.getCharacteristic(Characteristic.enphaseApparentPower)
        .onGet(async () => {
          const value = this.productionApparentPower;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Production net apparent power: ${value} kVA`);
          return value;
        });
      enphaseProductionService.getCharacteristic(Characteristic.enphasePwrFactor)
        .onGet(async () => {
          const value = this.productionPwrFactor;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Production power factor: ${value} cos φ`);
          return value;
        });
    }
    enphaseProductionService.getCharacteristic(Characteristic.enphaseReadingTime)
      .onGet(async () => {
        const value = this.productionReadingTime;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Production last report: ${value}`);
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphasePowerMaxReset)
      .onGet(async () => {
        const state = false;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Production power peak reset: Off`);
        return state;
      })
      .onSet(async (state) => {
        try {
          const write = state ? await fsPromises.writeFile(this.productionPowerPeakFile, '0') : false;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Production reset power peak: On`);
          enphaseProductionService.updateCharacteristic(Characteristic.enphasePowerMaxReset, false);
        } catch (error) {
          this.log.error(`Device: ${this.host} ${accessoryName}, Production reset power peak error: ${error}`);
        };
      });
    this.productionsService.push(enphaseProductionService);
    accessory.addService(this.productionsService[0]);

    //power and energy consumption
    if (metersInstalled && metersConsumptionEnabled) {
      this.consumptionsService = new Array();
      for (let i = 0; i < metersConsumptionCount; i++) {
        const consumptionMeasurmentType = this.consumptionsMeasurmentType[i];
        const enphaseConsumptionService = new Service.enphasePowerAndEnergyService(`Power And Energy ${consumptionMeasurmentType}`, `enphaseConsumptionService${i}`);
        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePower)
          .onGet(async () => {
            const value = (this.consumptionsPower[i]) ? this.consumptionsPower[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ${consumptionMeasurmentType}, power: ${value} kW`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePowerMax)
          .onGet(async () => {
            const value = (this.consumptionsPowerPeak[i]) ? this.consumptionsPowerPeak[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ${consumptionMeasurmentType}, power peak: ${value} kW`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePowerMaxDetected)
          .onGet(async () => {
            const value = (this.consumptionsPowerPeakDetected[i]) ? this.consumptionsPowerPeakDetected[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ${consumptionMeasurmentType}, power peak detected: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyToday)
          .onGet(async () => {
            const value = (this.consumptionsEnergyToday[i]) ? this.consumptionsEnergyToday[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ${consumptionMeasurmentType}, energy today: ${value} kWh`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
          .onGet(async () => {
            const value = (this.consumptionsEnergyLastSevenDays[i]) ? this.consumptionsEnergyLastSevenDays[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ${consumptionMeasurmentType}, energy last seven days: ${value} kWh`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
          .onGet(async () => {
            const value = (this.consumptionsEnergyLifeTime[i]) ? this.consumptionsEnergyLifeTime[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ${consumptionMeasurmentType}, energy lifetime: ${value} kWh`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseRmsCurrent)
          .onGet(async () => {
            const value = (this.consumptionsRmsCurrent[i]) ? this.consumptionsRmsCurrent[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ${consumptionMeasurmentType}, current: ${value} A`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseRmsVoltage)
          .onGet(async () => {
            const value = (this.consumptionsRmsVoltage[i]) ? this.consumptionsRmsVoltage[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ${consumptionMeasurmentType}, voltage: ${value} V`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseReactivePower)
          .onGet(async () => {
            const value = (this.consumptionsReactivePower[i]) ? this.consumptionsReactivePower[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ${consumptionMeasurmentType}, reactive power: ${value} kVAr`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseApparentPower)
          .onGet(async () => {
            const value = (this.consumptionsApparentPower[i]) ? this.consumptionsApparentPower[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ${consumptionMeasurmentType}, apparent power: ${value} kVA`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePwrFactor)
          .onGet(async () => {
            const value = (this.consumptionsPwrFactor[i]) ? this.consumptionsPwrFactor[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ${consumptionMeasurmentType}, power factor: ${value} cos φ`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseReadingTime)
          .onGet(async () => {
            const value = (this.consumptionsReadingTime[i]) ? this.consumptionsReadingTime[i] : '';
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ${consumptionMeasurmentType}, last report: ${value}`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePowerMaxReset)
          .onGet(async () => {
            const state = false;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ${consumptionMeasurmentType}, power peak reset: Off`);
            return state;
          })
          .onSet(async (state) => {
            try {
              const consumptionFile = [this.consumptionTotalPowerPeakFile, this.consumptionNetPowerPeakFile][i];
              const write = state ? await fsPromises.writeFile(consumptionFile, '0') : false;
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, reset %s power peak: On`);
              enphaseConsumptionService.updateCharacteristic(Characteristic.enphasePowerMaxReset, false);
            } catch (error) {
              this.log.error(`Device: ${this.host} ${accessoryName}, reset %s power peak error: ${error}`);
            };
          });
        this.consumptionsService.push(enphaseConsumptionService);
        accessory.addService(this.consumptionsService[i]);
      }
    }

    //ac batteries summary
    if (acBatteriesInstalled) {
      this.acBatteriesSummaryService = new Array();
      const enphaseAcBatterieSummaryService = new Service.enphaseAcBatterieSummaryService('AC Batteries Summary', 'enphaseAcBatterieSummaryService');
      enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryPower)
        .onGet(async () => {
          const value = this.acBatteriesSummaryPower;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batteries storage power: ${value} kW`);
          return value;
        });
      enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryEnergy)
        .onGet(async () => {
          const value = this.acBatteriesSummaryEnergy;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batteries storage energy: ${value} kWh`);
          return value;
        });
      enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryPercentFull)
        .onGet(async () => {
          const value = this.acBatteriesSummaryPercentFull;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batteries percent full: ${value}`);
          return value;
        });
      enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryActiveCount)
        .onGet(async () => {
          const value = this.acBatteriesSummaryActiveCount;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batteries devices count: ${value}`);
          return value;
        });
      enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryState)
        .onGet(async () => {
          const value = this.acBatteriesSummaryState;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batteries state: ${value}`);
          return value;
        });
      enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryReadingTime)
        .onGet(async () => {
          const value = this.acBatteriesSummaryReadingTime;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batteries: %s last report: ${value}`);
          return value;
        });
      this.acBatteriesSummaryService.push(enphaseAcBatterieSummaryService);
      accessory.addService(this.acBatteriesSummaryService[0]);

      //ac batteries state
      this.acBatteriesService = new Array();
      for (let i = 0; i < acBatteriesCount; i++) {
        const acBatterieSerialNumber = this.acBatteriesSerialNumber[i];
        const enphaseAcBatterieService = new Service.enphaseAcBatterieService(`AC Batterie ${acBatterieSerialNumber}`, `enphaseAcBatterieService${i}`);
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieChargeStatus)
          .onGet(async () => {
            const value = this.acBatteriesChargeStatus[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batterie: ${acBatterieSerialNumber} charge status ${value}`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieProducing)
          .onGet(async () => {
            const value = this.acBatteriesProducing[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batterie: ${acBatterieSerialNumber} producing: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieCommunicating)
          .onGet(async () => {
            const value = this.acBatteriesCommunicating[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batterie: ${acBatterieSerialNumber} communicating: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieProvisioned)
          .onGet(async () => {
            const value = this.acBatteriesProvisioned[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batterie: ${acBatterieSerialNumber} provisioned: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieOperating)
          .onGet(async () => {
            const value = this.acBatteriesOperating[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batterie: ${acBatterieSerialNumber} operating: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        if (this.supportPlcLevel && (this.envoyFirmware7xx || (!this.envoyFirmware7xx && this.installerPasswd))) {
          enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieCommLevel)
            .onGet(async () => {
              const value = this.acBatteriesCommLevel[i] || 0;
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batterie: ${acBatterieSerialNumber} plc level: ${value} %`);
              return value;
            });
        }
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieSleepEnabled)
          .onGet(async () => {
            const value = this.acBatteriesSleepEnabled[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batterie: ${acBatterieSerialNumber} sleep: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatteriePercentFull)
          .onGet(async () => {
            const value = this.acBatteriesPercentFull[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batterie: ${acBatterieSerialNumber} percent full: ${value} %`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieMaxCellTemp)
          .onGet(async () => {
            const value = this.acBatteriesMaxCellTemp[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batterie: ${acBatterieSerialNumber} max cell temp: ${value} °C`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieSleepMinSoc)
          .onGet(async () => {
            const value = this.acBatteriesSleepMinSoc[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batterie: ${acBatterieSerialNumber} sleep min soc: ${value} min`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieSleepMaxSoc)
          .onGet(async () => {
            const value = this.acBatteriesSleepMaxSoc[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batterie: ${acBatterieSerialNumber} sleep max soc: ${value} min`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieStatus)
          .onGet(async () => {
            const value = this.acBatteriesStatus[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batterie: ${acBatterieSerialNumber} status: ${value}`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieFirmware)
          .onGet(async () => {
            const value = this.acBatteriesFirmware[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batterie: ${acBatterieSerialNumber} firmware: ${value}`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieLastReportDate)
          .onGet(async () => {
            const value = this.acBatteriesLastReportDate[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, AC Batterie: ${acBatterieSerialNumber} last report: ${value}`);
            return value;
          });
        this.acBatteriesService.push(enphaseAcBatterieService);
        accessory.addService(this.acBatteriesService[i]);
      }
    }

    //microinverters
    if (microinvertersInstalled) {
      this.microinvertersService = new Array();
      for (let i = 0; i < microinvertersCount; i++) {
        const microinverterSerialNumber = this.microinvertersSerialNumber[i];
        const enphaseMicroinverterService = new Service.enphaseMicroinverterService(`Microinverter ${microinverterSerialNumber}`, `enphaseMicroinverterService${i}`);
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterPower)
          .onGet(async () => {
            let value = this.microinvertersLastPower[i] || 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Microinverter: ${microinverterSerialNumber}, last power: ${value} W`);
            return value;
          });
        if (this.supportPlcLevel && (this.envoyFirmware7xx || (!this.envoyFirmware7xx && this.installerPasswd))) {
          enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterPowerMax)
            .onGet(async () => {
              const value = this.microinvertersMaxPower[i] || 0;
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Microinverter: ${microinverterSerialNumber}, peak power: ${value} W`);
              return value;
            });
        }
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterProducing)
          .onGet(async () => {
            const value = this.microinvertersProducing[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Microinverter: ${microinverterSerialNumber}, producing: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterCommunicating)
          .onGet(async () => {
            const value = this.microinvertersCommunicating[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Microinverter: ${microinverterSerialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterProvisioned)
          .onGet(async () => {
            const value = this.microinvertersProvisioned[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Microinverter: ${microinverterSerialNumber}, provisioned: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterOperating)
          .onGet(async () => {
            const value = this.microinvertersOperating[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Microinverter: ${microinverterSerialNumber}, operating: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        if (this.supportPlcLevel && (this.envoyFirmware7xx || (!this.envoyFirmware7xx && this.installerPasswd))) {
          enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterCommLevel)
            .onGet(async () => {
              const value = this.microinvertersCommLevel[i] || 0;
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Microinverter: ${microinverterSerialNumber}, plc level: ${value} %`);
              return value;
            });
        }
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterStatus)
          .onGet(async () => {
            const value = this.microinvertersStatus[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Microinverter: ${microinverterSerialNumber}, status: ${value}`);
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterFirmware)
          .onGet(async () => {
            const value = this.microinvertersFirmware[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Microinverter: ${microinverterSerialNumber}, firmware: ${value}`);
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterLastReportDate)
          .onGet(async () => {
            const value = this.microinvertersReadingTime[i] || 'Unknown';
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Microinverter: ${microinverterSerialNumber}, last report: ${value}`);
            return value;
          });
        this.microinvertersService.push(enphaseMicroinverterService);
        accessory.addService(this.microinvertersService[i]);
      }
    }

    //ensemble
    if (esubsInstalled) {
      this.esubsService = new Array();
      for (let i = 0; i < esubsCount; i++) {
        const esubSerialNumber = this.esubsSerialNumber[i];
        const enphaseEsubService = new Service.enphaseEsubService(`Ensemble ${esubSerialNumber}`, `enphaseEsubService${i}`);
        enphaseEsubService.getCharacteristic(Characteristic.enphaseEsubProducing)
          .onGet(async () => {
            const value = this.esubsProducing[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Ensemble: ${esubSerialNumber}, producing: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseEsubService.getCharacteristic(Characteristic.enphaseEsubCommunicating)
          .onGet(async () => {
            const value = this.esubsCommunicating[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Ensemble: ${esubSerialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseEsubService.getCharacteristic(Characteristic.enphaseEsubOperating)
          .onGet(async () => {
            const value = this.esubsOperating[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Ensemble: ${esubSerialNumber}, operating: ${value ? 'Yes' : 'No'}`);
            return value;
          })
        enphaseEsubService.getCharacteristic(Characteristic.enphaseEsubStatus)
          .onGet(async () => {
            const value = this.esubsStatus[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Ensemble: ${esubSerialNumber}, status: ${value}`);
            return value;
          });
        enphaseEsubService.getCharacteristic(Characteristic.enphaseEsubFirmware)
          .onGet(async () => {
            const value = this.esubsFirmware[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Ensemble: ${esubSerialNumber}, firmware: ${value}`);
            return value;
          });
        enphaseEsubService.getCharacteristic(Characteristic.enphaseEsubLastReportDate)
          .onGet(async () => {
            const value = this.esubsLastReportDate[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Ensemble: ${esubSerialNumber}, last report: ${value}`);
            return value;
          });

        this.esubsService.push(enphaseEsubService);
        accessory.addService(this.esubsService[i]);
      }

      //encharges inventory
      if (enchargesInstalled) {
        this.enchargesService = new Array();
        for (let i = 0; i < enchargesCount; i++) {
          const enchargeSerialNumber = this.enchargesSerialNumber[i];
          const enphaseEnchargeService = new Service.enphaseEnchargeService(`Encharge ${enchargeSerialNumber}`, `enphaseEnchargeService${i}`);
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeAdminStateStr)
            .onGet(async () => {
              const value = this.enchargesAdminStateStr[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber}, state ${value}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeOperating)
            .onGet(async () => {
              const value = this.enchargesOperating[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber}, operating: ${value ? 'Yes' : 'No'}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommunicating)
            .onGet(async () => {
              const value = this.enchargesCommunicating[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
              return value;
            });
          if (this.supportPlcLevel && (this.envoyFirmware7xx || (!this.envoyFirmware7xx && this.installerPasswd))) {
            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommLevel)
              .onGet(async () => {
                const value = this.enchargesCommLevel[i] || 0;
                const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber} plc level: ${value} %`);
                return value;
              });
          }
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommLevelSubGhz)
            .onGet(async () => {
              const value = this.enchargesCommLevelSubGhz[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber}, sub GHz level: ${value} %`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommLevel24Ghz)
            .onGet(async () => {
              const value = this.enchargesCommLevel24Ghz[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber}, 2.4GHz level: ${value} %`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeSleepEnabled)
            .onGet(async () => {
              const value = this.enchargesSleepEnabled[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber}, sleep: ${value ? 'Yes' : 'No'}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargePercentFull)
            .onGet(async () => {
              const value = this.enchargesPercentFull[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber}, percent full: ${value} %`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeTemperature)
            .onGet(async () => {
              const value = this.enchargesTemperature[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber}, temp: ${value} °C`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeMaxCellTemp)
            .onGet(async () => {
              const value = this.enchargesMaxCellTemp[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber}, max cell temp: ${value} °C`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeLedStatus)
            .onGet(async () => {
              const value = this.enchargesLedStatus[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber}, LED status: ${value}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCapacity)
            .onGet(async () => {
              const value = this.enchargesCapacity[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber}, capacity: ${value} kWh`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeDcSwitchOff)
            .onGet(async () => {
              const value = this.enchargesDcSwitchOff[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber}, status: ${value ? 'Yes' : 'No'}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeRev)
            .onGet(async () => {
              const value = this.enchargesRev[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber}, revision: ${value}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeGridProfile)
            .onGet(async () => {
              const value = this.ensembleGridProfileName;
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber}, grid profile: ${value}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeStatus)
            .onGet(async () => {
              const value = this.enchargesStatus[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber}, status: ${value}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeLastReportDate)
            .onGet(async () => {
              const value = this.enchargesLastReportDate[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Encharge: ${enchargeSerialNumber}, last report: ${value}`);
              return value;
            });
          this.enchargesService.push(enphaseEnchargeService);
          accessory.addService(this.enchargesService[i]);
        }
      }

      //enpower
      if (enpowersInstalled) {
        //enpower inventory
        this.enpowersService = new Array();
        for (let i = 0; i < enpowersCount; i++) {
          const enpowerSerialNumber = this.enpowersSerialNumber[i];
          const enphaseEnpowerService = new Service.enphaseEnpowerService(`Enpower: ${enpowerSerialNumber}`, `enphaseEnpowerService${i}`);
          enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerAdminStateStr)
            .onGet(async () => {
              const value = this.enpowersAdminStateStr[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Enpower: ${enpowerSerialNumber}, state: ${value}`);
              return value;
            });
          enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerOperating)
            .onGet(async () => {
              const value = this.enpowersOperating[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Enpower: ${enpowerSerialNumber}, operating: ${value ? 'Yes' : 'No'}`);
              return value;
            });
          enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerCommunicating)
            .onGet(async () => {
              const value = this.enpowersCommunicating[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Enpower: ${enpowerSerialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
              return value;
            });
          enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerCommLevelSubGhz)
            .onGet(async () => {
              const value = this.enpowersCommLevelSubGhz[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Enpower: ${enpowerSerialNumber}, sub GHz level: ${value} %`);
              return value;
            });
          enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerCommLevel24Ghz)
            .onGet(async () => {
              const value = this.enpowersCommLevel24Ghz[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Enpower: ${enpowerSerialNumber}, 2.4GHz level: ${value} %`);
              return value;
            });
          enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerTemperature)
            .onGet(async () => {
              const value = this.enpowersTemperature[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Enpower: ${enpowerSerialNumber}, temp: ${value} °C`);
              return value;
            });
          enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerMainsAdminState)
            .onGet(async () => {
              const value = this.enpowersMainsAdminState[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Enpower: ${enpowerSerialNumber}, mains admin state: ${value}`);
              return value;
            });
          enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerMainsOperState)
            .onGet(async () => {
              const value = this.enpowersMainsOperState[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Enpower: ${enpowerSerialNumber}, mains operating state: ${value}`);
              return value;
            });
          enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerEnpwrGridMode)
            .onGet(async () => {
              const value = this.enpowersGridMode[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Enpower: ${enpowerSerialNumber}, enpower grid mode: ${value}`);
              return value;
            });
          enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerEnchgGridMode)
            .onGet(async () => {
              const value = this.enpowersEnchgGridMode[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Enpower: ${enpowerSerialNumber}, encharge grid mode: ${value}`);
              return value;
            });
          enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerGridProfile)
            .onGet(async () => {
              const value = this.ensembleGridProfileName;
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Enpower: ${enpowerSerialNumber}, grid profile: ${value}`);
              return value;
            });
          enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerStatus)
            .onGet(async () => {
              const value = this.enpowersStatus[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Enpower: ${enpowerSerialNumber}, status: ${value}`);
              return value;
            });
          enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerLastReportDate)
            .onGet(async () => {
              const value = this.enpowersLastReportDate[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Enpower: ${enpowerSerialNumber}, last report: ${value}`);
              return value;
            });
          this.enpowersService.push(enphaseEnpowerService);
          accessory.addService(this.enpowersService[i]);
        };
      }

      //ensemble status summary
      if (ensembleStatusInstalled) {
        this.ensembleStatusService = new Array();
        const enphaseEnsembleStatusService = new Service.enphaseEnsembleStatusService(`Ensemble summary`, 'enphaseEnsembleStatusService');
        enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHz)
          .onGet(async () => {
            const value = this.ensembleFreqBiasHz;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Ensemble summary, bias frequency: ${value} Hz`);
            return value;
          });
        enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasV)
          .onGet(async () => {
            const value = this.ensembleVoltageBiasV;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Ensemble summary, bias voltage: ${value} V`);
            return value;
          });
        enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8)
          .onGet(async () => {
            const value = this.ensembleFreqBiasHzQ8;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Ensemble summary, bias q8 frequency: ${value} Hz`);
            return value;
          });
        enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5)
          .onGet(async () => {
            const value = this.ensembleVoltageBiasVQ5;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Ensemble summary, bias q5 voltage: ${value} V`);
            return value;
          });
        enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusConfiguredBackupSoc)
          .onGet(async () => {
            const value = this.ensembleConfiguredBackupSoc;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Ensemble summary, configured backup SoC: ${value} %`);
            return value;
          });
        enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusAdjustedBackupSoc)
          .onGet(async () => {
            const value = this.ensembleAdjustedBackupSoc;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Ensemble summary, adjusted backup SoC: ${value} %`);
            return value;
          });
        enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusAggSoc)
          .onGet(async () => {
            const value = this.ensembleAggSoc;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Ensemble summary, agg SoC: ${value} %`);
            return value;
          });
        enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusAggBackupEnergy)
          .onGet(async () => {
            const value = this.ensembleAggBackupEnergy;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Ensemble summary, agg backup energy: ${value} kWh`);
            return value;
          });
        enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusAggAvailEnergy)
          .onGet(async () => {
            const value = this.ensembleAggAvailEnergy;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Ensemble summary, agg available energy: ${value} kWh`);
            return value;
          });
        this.ensembleStatusService.push(enphaseEnsembleStatusService);
        accessory.addService(this.ensembleStatusService[0]);
      }

      //wireless connektion kit
      if (wirelessConnectionKitInstalled) {
        this.wirelessConnektionsKitService = new Array();
        for (let i = 0; i < wirelessConnectionKitConnectionsCount; i++) {
          const wirelessConnectionType = this.wirelessConnectionsType[i];
          const enphaseWirelessConnectionKitService = new Service.enphaseWirelessConnectionKitService(`Wireless connection ${wirelessConnectionType}`, `enphaseWirelessConnectionKitService${i}`);
          enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitType)
            .onGet(async () => {
              const value = wirelessConnectionType;
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Wireless connection: ${wirelessConnectionType}`);
              return value;
            });
          enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitConnected)
            .onGet(async () => {
              const value = this.wirelessConnectionsConnected[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Wireless connection: ${wirelessConnectionType}, state: ${value ? 'Connected' : 'Disconnected'}`);
              return value;
            });
          enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitSignalStrength)
            .onGet(async () => {
              const value = this.wirelessConnectionsSignalStrength[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Wireless connection: ${wirelessConnectionType}, signal strength: ${value} %`);
              return value;
            });
          enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitSignalStrengthMax)
            .onGet(async () => {
              const value = this.wirelessConnectionsSignalStrengthMax[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Wireless connection: ${wirelessConnectionType}, signal strength max: ${value} %`);
              return value;
            });
          this.wirelessConnektionsKitService.push(enphaseWirelessConnectionKitService);
          accessory.addService(this.wirelessConnektionsKitService[i]);
        }
      }
    }

    this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
    const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${accessoryName}, published as external accessory.`) : false;
    this.startPrepareAccessory = false;
  }
}