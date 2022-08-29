'use strict';
const path = require('path');
const axios = require('axios');
const axiosDigestAuth = require('./src/digestAuth.js');
const passwdCalc = require('./src/passwdCalc.js');
const mqttClient = require('./src/mqtt.js');
const fs = require('fs');
const fsPromises = fs.promises;
const parseStringPromise = require('xml2js').parseStringPromise;

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
      super('AC Bateries and level', '00000017-000B-1000-8000-0026BB765291');
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
      super('Check comm level', '00000029-000B-1000-8000-0026BB765291');
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
      super('Comm level', '00000041-000B-1000-8000-0026BB765291');
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
      super('Comm level', '00000116-000B-1000-8000-0026BB765291');
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
      super('Comm level', '00000137-000B-1000-8000-0026BB765291');
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
      super('Comm level sub GHz', '00000154-000B-1000-8000-0026BB765291');
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
      super('Comm level 2.4GHz', '00000155-000B-1000-8000-0026BB765291');
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
      super('Comm level sub GHz', '00000174-000B-1000-8000-0026BB765291');
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
      super('Comm level 2.4GHz', '00000175-000B-1000-8000-0026BB765291');
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

  //Enpower status
  class enphaseEnpowerStatusFreqBiasHz extends Characteristic {
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
  Characteristic.enphaseEnpowerStatusFreqBiasHz = enphaseEnpowerStatusFreqBiasHz;

  class enphaseEnpowerStatusVoltageBiasV extends Characteristic {
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
  Characteristic.enphaseEnpowerStatusVoltageBiasV = enphaseEnpowerStatusVoltageBiasV;

  class enphaseEnpowerStatusFreqBiasHzQ8 extends Characteristic {
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
  Characteristic.enphaseEnpowerStatusFreqBiasHzQ8 = enphaseEnpowerStatusFreqBiasHzQ8;

  class enphaseEnpowerStatusVoltageBiasVQ5 extends Characteristic {
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
  Characteristic.enphaseEnpowerStatusVoltageBiasVQ5 = enphaseEnpowerStatusVoltageBiasVQ5;

  class enphaseEnpowerStatusConfiguredBackupSoc extends Characteristic {
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
  Characteristic.enphaseEnpowerStatusConfiguredBackupSoc = enphaseEnpowerStatusConfiguredBackupSoc;

  class enphaseEnpowerStatusAdjustedBackupSoc extends Characteristic {
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
  Characteristic.enphaseEnpowerStatusAdjustedBackupSoc = enphaseEnpowerStatusAdjustedBackupSoc;

  class enphaseEnpowerStatusAggSoc extends Characteristic {
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
  Characteristic.enphaseEnpowerStatusAggSoc = enphaseEnpowerStatusAggSoc;

  class enphaseEnpowerStatusAggBackupEnergy extends Characteristic {
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
  Characteristic.enphaseEnpowerStatusAggBackupEnergy = enphaseEnpowerStatusAggBackupEnergy;

  class enphaseEnpowerStatusAggAvailEnergy extends Characteristic {
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
  Characteristic.enphaseEnpowerStatusAggAvailEnergy = enphaseEnpowerStatusAggAvailEnergy;

  //Enpower service
  class enphaseEnpowerStatusService extends Service {
    constructor(displayName, subtype) {
      super(displayName, '00000009-000A-1000-8000-0026BB765291', subtype);
      // Mandatory Characteristics
      this.addCharacteristic(Characteristic.enphaseEnpowerStatusFreqBiasHz);
      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerStatusVoltageBiasV);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerStatusFreqBiasHzQ8);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerStatusVoltageBiasVQ5);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerStatusConfiguredBackupSoc);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerStatusAdjustedBackupSoc);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerStatusAggSoc);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerStatusAggBackupEnergy);
      this.addOptionalCharacteristic(Characteristic.enphaseEnpowerStatusAggAvailEnergy);
    }
  }
  Service.enphaseEnpowerStatusService = enphaseEnpowerStatusService;

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
    const devices = config.devices;
    const devicesCount = devices.length;
    this.accessories = [];

    this.api.on('didFinishLaunching', () => {
      this.log.debug('didFinishLaunching');
      for (let i = 0; i < devicesCount; i++) {
        const device = devices[i];
        if (!device.name) {
          this.log.warn('Device name missing!');
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
    this.productionPowerPeakAutoReset = config.powerProductionMaxAutoReset || 0;
    this.productionPowerPeakDetectedPower = config.powerProductionMaxDetected || 0;
    this.productionEnergyLifetimeOffset = config.energyProductionLifetimeOffset || 0;
    this.consumptionTotalPowerPeakAutoReset = config.powerConsumptionTotalMaxAutoReset || 0;
    this.consumptionTotalPowerPeakDetectedPower = config.powerConsumptionTotalMaxDetected || 0;
    this.consumptionTotalEnergyLifetimeOffset = config.energyConsumptionTotalLifetimeOffset || 0;
    this.consumptionNetPowerPeakAutoReset = config.powerConsumptionNetMaxAutoReset || 0;
    this.consumptionNetPowerPeakDetectedPower = config.powerConsumptionNetMaxDetected || 0;
    this.consumptionNetEnergyLifetimeOffset = config.energyConsumptionNetLifetimeOffset || 0;
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
    this.updateCommLevel = false;
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
    this.envoyCommEnchgNum = 0;
    this.envoyCommEnchgLevel = 0
    this.envoyUpdateStatus = '';
    this.envoyTimeZone = '';
    this.envoyCurrentDate = '';
    this.envoyCurrentTime = '';
    this.envoyLastEnlightenReporDate = 0;
    this.envoySupportMeters = false;
    this.envoyCheckCommLevel = false;

    //envoy section ensemble
    this.wirelessConnectionKitInstalled = false;
    this.wirelessConnectionKitConnectionsCount = 0;
    this.envoyCommEnchgLevel24g = 0;
    this.envoyCommEnchagLevelSubg = 0;
    this.envoyEnpowerConnected = false;
    this.envoyEnpowerGridStatus = '';

    //qrelay
    this.qRelaysInstalled = false;
    this.qRelaysCount = 0;

    //ct meters
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

    //ac batterie
    this.acBatteriesInstalled = false;
    this.acBatteriesCount = 0;
    this.acBatteriesSummaryType = '';
    this.acBatteriesSummaryActiveCount = 0;
    this.acBatteriesSummaryReadingTime = '';
    this.acBatteriesSummaryPower = 0;
    this.acBatteriesSummaryEnergy = 0;
    this.acBatteriesSummaryState = '';
    this.acBatteriesSummaryPercentFull = 0;

    //microinverters
    this.microinvertersInstalled = false;
    this.microinvertersCount = 0;
    this.microinvertersUpdatePower = false;

    //ensemble
    this.ensembleInstalled = false;
    this.ensembleGridProfileName = '';
    this.ensembleId = '';
    this.ensembleGridProfileVersion = '';
    this.ensembleItemCount = 0;
    this.ensembleFakeInventoryMode = false;

    //encharges
    this.enchargesInstalled = false;
    this.enchargesCount = 0;

    //enpower
    this.enpowerInstalled = false;
    this.enpowersCount = 0;
    this.enpowerType = '';
    this.enpowerSerialNumber = 0;
    this.enpowerLastReportDate = 0;
    this.enpowerAdminStateStr = '';
    this.enpowerOperating = false;
    this.enpowerCommunicating = false;
    this.enpowerTemperature = 0;
    this.enpowerCommLevelSubGhz = 0;
    this.enpowerCommLevel24Ghz = 0;
    this.enpowerMainsAdminState = '';
    this.enpowerMainsOperState = '';
    this.enpowerGridMode = '';
    this.enpowerEnchgGridMode = '';
    this.enpowerRelayStateBm = '';
    this.enpowerCurrStateId = '';
    this.enpowerFreqBiasHz = 0;
    this.enpowerVoltageBiasV = 0;
    this.enpowerFreqBiasHzQ8 = 0;
    this.enpowerVoltageBiasVQ5 = 0;
    this.enpowerConfiguredBackupSoc = 0;
    this.enpowerAdjustedBackupSoc = 0;
    this.enpowerAggSoc = 0;
    this.enpowerAggBackupEnergy = 0;
    this.enpowerAggAvailEnergy = 0;

    //current day of week
    const date = new Date();
    this.currentDayOfWeek = date.getDay();
    this.currentDayOfMonth = date.getDate();

    this.prefDir = path.join(api.user.storagePath(), 'enphaseEnvoy');
    this.envoyIdFile = (`${this.prefDir}/envoyId_${this.host.split('.').join('')}`);
    this.productionPowerPeakFile = (`${this.prefDir}/productionPowerPeak_${this.host.split('.').join('')}`);
    this.consumptionNetPowerPeakFile = (`${this.prefDir}/consumptionNetPowerPeak_${this.host.split('.').join('')}`);
    this.consumptionTotalPowerPeakFile = (`${this.prefDir}/consumptionTotalPowerPeak_${this.host.split('.').join('')}`);

    this.url = (`http://${this.host}`);

    try {
      //check if the directory exists, if not then create it
      if (!fs.existsSync(this.prefDir)) {
        fs.mkdirSync(this.prefDir);
      }
      if (!fs.existsSync(this.envoyIdFile)) {
        fs.writeFileSync(this.envoyIdFile, '');
      }
      if (!fs.existsSync(this.productionPowerPeakFile)) {
        fs.writeFileSync(this.productionPowerPeakFile, '0.0');
      }
      if (!fs.existsSync(this.consumptionNetPowerPeakFile)) {
        fs.writeFileSync(this.consumptionNetPowerPeakFile, '0.0');
      }
      if (!fs.existsSync(this.consumptionTotalPowerPeakFile)) {
        fs.writeFileSync(this.consumptionTotalPowerPeakFile, '0.0');
      }
    } catch (error) {
      this.log.error(`Device: ${this.host} ${this.name}, prepare directory and files error: ${error}`);
    };

    this.axiosInstance = axios.create({
      method: 'GET',
      baseURL: this.url
    });

    this.passwdCalc = new passwdCalc({
      user: CONSTANS.InstallerUser,
      realm: CONSTANS.Realm
    });

    //mqtt client
    this.mqttClient = new mqttClient({
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

    this.mqttClient.on('connected', (message) => {
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

    this.updateEnvoyBackboneAppData();
  }

  reconnect() {
    setTimeout(() => {
      this.updateEnvoyBackboneAppData();
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

  async updateEnvoyBackboneAppData() {
    this.log.debug(`Device: ${this.host} ${this.name}, requesting envoy backbone app.`);

    try {
      const savedEnvoyId = await fsPromises.readFile(this.envoyIdFile);
      const envoyId = savedEnvoyId.toString();
      if (envoyId.length != 9) {
        try {
          const envoyBackboneAppData = await this.axiosInstance(CONSTANS.ApiUrls.BackboneApplication);
          const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug envoy backbone app: ${envoyBackboneAppData.data}`) : false;
          const data = envoyBackboneAppData.data;
          const envoyDevId = data.substr(data.indexOf('envoyDevId:') + 11, 9);
          await fsPromises.writeFile(this.envoyIdFile, envoyDevId);
          this.envoyDevId = envoyDevId;
          this.updateInfoData();
        } catch (error) {
          this.checkDeviceInfo = true;
          this.log.error(`Device: ${this.host} ${this.name}, requesting envoyBackboneAppData or save envoy id error: ${error}, reconnect in 15s.`);
          this.reconnect();
        };
      } else {
        this.envoyDevId = envoyId;
        this.updateInfoData();
      }
    } catch (error) {
      this.log.error(`Device: ${this.host} ${this.name}, read envoy id from file error: ${error}, reconnect in 15s.`);
      this.reconnect();
    };
  };

  async updateInfoData() {
    this.log.debug(`Device: ${this.host} ${this.name}, requesting info.`);

    try {
      const infoData = await this.axiosInstance(CONSTANS.ApiUrls.Info);
      const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug info:${JSON.stringify(infoData.data, null, 2)}`) : false;

      if (infoData.status == 200) {
        const parseInfoData = await parseStringPromise(infoData.data);
        const debug1 = this.enableDebugMode ? this.log.debug(`Device: ${this.host} ${this.name}, debug parse info: ${JSON.stringify(parseInfoData, null, 2)}`) : false;

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
        const deviceImeter = (device.imeter[0] == 'true');

        //packages
        const packagesCount = envoyInfo.package.length;
        for (let i = 0; i < packagesCount; i++) {
          const devicePackage = envoyInfo.package[i];
          const packageName = devicePackage.$.name;
          const packagePn = devicePackage.pn[0];
          const packageVersion = devicePackage.version[0];
          const packageBuild = devicePackage.build[0];
        }

        //build info
        const build = envoyInfo.build_info[0];
        const buildId = build.build_id[0];
        const buildTimeQmt = new Date(build.build_time_gmt[0] * 1000).toLocaleString();

        //envoy password
        const envoyPasswd = this.envoyPasswd || deviceSn.substring(6);
        const debug2 = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug envoy password: ${envoyPasswd}`) : false;

        //installer password
        const installerPasswd = await this.passwdCalc.generatePasswd(deviceSn);
        const debug3 = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug installer password: ${installerPasswd}`) : false;

        //digest auth installer
        this.digestAuthInstaller = new axiosDigestAuth({
          user: CONSTANS.InstallerUser,
          passwd: installerPasswd
        });

        //envoy
        this.envoyTime = time;
        this.envoySerialNumber = deviceSn;
        this.envoyModelName = devicePn;
        this.envoyFirmware = deviceSoftware;
        this.envoySupportMeters = deviceImeter;
        this.envoyPasswd = envoyPasswd;
        this.installerPasswd = installerPasswd;

        const mqtt = this.mqttEnabled ? this.mqttClient.send('Info', JSON.stringify(parseInfoData, null, 2)) : false;
        this.updateHomeData();
      }
    } catch (error) {
      this.log.error(`Device: ${this.host} ${this.name}, requesting info error: ${error}, reconnect in 15s.`);
      this.reconnect();
    };
  };

  async updateHomeData() {
    this.log.debug(`Device: ${this.host} ${this.name}, requesting home.`);

    try {
      const homeData = await this.axiosInstance(CONSTANS.ApiUrls.Home);
      const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug home: ${JSON.stringify(homeData.data, null, 2)}`) : false;

      if (homeData.status == 200) {
        const envoy = homeData.data;
        const objKeys = Object.keys(envoy);
        const objKeys1 = Object.keys(envoy.comm);
        const enpowerInstalled = (objKeys.indexOf('enpower') >= 0);
        const enchargesInstalled = (objKeys1.indexOf('encharge') >= 0);
        const wirelessConnectionKitInstalled = (objKeys.indexOf('wireless_connection') >= 0);
        const wirelessConnectionKitConnectionsCount = wirelessConnectionKitInstalled ? envoy.wireless_connection.length : 0;
        const ensembleInstalled = (enpowerInstalled || enchargesInstalled);
        const envoyNework = envoy.network;
        const envoyNetworkInterfaces = envoyNework.interfaces;
        const envoyNetworkInterfacesCount = envoyNetworkInterfaces.length;

        //envoy
        const softwareBuildEpoch = new Date(envoy.software_build_epoch * 1000).toLocaleString();
        const isEnvoy = (envoy.is_nonvoy == false);
        const dbSize = envoy.db_size;
        const dbPercentFull = envoy.db_percent_full;
        const timeZone = envoy.timezone;
        const currentDate = new Date(envoy.current_date).toLocaleString().slice(0, 11);
        const currentTime = envoy.current_time;
        const webComm = (envoyNework.web_comm == true);
        const everReportedToEnlighten = (envoyNework.ever_reported_to_enlighten == true);
        const lastEnlightenReporDate = new Date(envoyNework.last_enlighten_report_time * 1000).toLocaleString();
        const primaryInterface = CONSTANS.ApiCodes[envoyNework.primary_interface] || 'undefined';
        if (envoyNetworkInterfacesCount > 0) {
          for (let i = 0; i < envoyNetworkInterfacesCount; i++) {
            const objValues = Object.values(envoyNetworkInterfaces[i]);
            const envoyInterfaceCellular = (objValues.indexOf('cellular') >= 0);
            const envoyInterfaceLan = (objValues.indexOf('ethernet') >= 0);
            const envoyInterfaceWlan = (objValues.indexOf('wifi') >= 0);
            const envoyInterfaceStartIndex = envoyInterfaceCellular ? 1 : 0;

            if (envoyInterfaceCellular) {
              const envoyInterfaceSignalStrength = (envoyNetworkInterfaces[0].signal_strength * 20);
              const envoyInterfaceSignalStrengthMax = (envoyNetworkInterfaces[0].signal_strength_max * 20);
              const envoyInterfaceNetwork = envoyNetworkInterfaces[0].network;
              const envoyInterfaceType = CONSTANS.ApiCodes[envoyNetworkInterfaces[0].type] || 'undefined';
              const envoyInterfaceInterface = envoyNetworkInterfaces[0].interface;
              const envoyInterfaceDhcp = envoyNetworkInterfaces[0].dhcp;
              const envoyInterfaceIp = envoyNetworkInterfaces[0].ip;
              const envoyInterfaceCarrier = envoyNetworkInterfaces[0].carrier;
            }
            if (envoyInterfaceLan) {
              const envoyInterfaceType = CONSTANS.ApiCodes[envoyNetworkInterfaces[envoyInterfaceStartIndex].type] || 'undefined';
              const envoyInterfaceInterface = envoyNetworkInterfaces[envoyInterfaceStartIndex].interface;
              const envoyInterfaceMac = envoyNetworkInterfaces[envoyInterfaceStartIndex].mac;
              const envoyInterfaceDhcp = envoyNetworkInterfaces[envoyInterfaceStartIndex].dhcp;
              const envoyInterfaceIp = envoyNetworkInterfaces[envoyInterfaceStartIndex].ip;
              const envoyInterfaceSignalStrength = (envoyNetworkInterfaces[envoyInterfaceStartIndex].signal_strength * 20);
              const envoyInterfaceSignalStrengthMax = (envoyNetworkInterfaces[envoyInterfaceStartIndex].signal_strength_max * 20);
              const envoyInterfaceCarrier = envoyNetworkInterfaces[envoyInterfaceStartIndex].carrier;
            }
            if (envoyInterfaceWlan) {
              const envoyInterfaceSignalStrenth = (envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].signal_strength * 20);
              const envoyInterfaceSignalStrengthMax = (envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].signal_strength_max * 20);
              const envoyInterfaceType = CONSTANS.ApiCodes[envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].type] || 'undefined';
              const envoyInterfaceInterface = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].interface;
              const envoyInterfaceMac = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].mac;
              const envoyInterfaceDhcp = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].dhcp;
              const envoyInterfaceIp = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].ip;
              const envoyInterfaceCarrier = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].carrier;
              const envoyInterfaceSupported = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].supported;
              const envoyInterfacePresent = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].present;
              const envoyInterfaceConfigured = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].configured;
              const envoyInterfaceStatus = CONSTANS.ApiCodes[envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].status] || 'undefined';
            }
            this.envoyInterfaceCellular = envoyInterfaceCellular;
            this.envoyInterfaceLan = envoyInterfaceLan;
            this.envoyInterfaceWlan = envoyInterfaceWlan;
          }
        }
        const tariff = CONSTANS.ApiCodes[envoy.tariff] || 'undefined';
        const comm = envoy.comm;
        const commNum = comm.num;
        const commLevel = (comm.level * 20);
        const commPcuNum = comm.pcu.num;
        const commPcuLevel = (comm.pcu.level * 20);
        const commAcbNum = comm.acb.num;
        const commAcbLevel = (comm.acb.level * 20);
        const commNsrbNum = comm.nsrb.num;
        const commNsrbLevel = (comm.nsrb.level * 20);

        //encharge
        const commEncharge = enchargesInstalled ? comm.encharge[0] : {};
        const commEnchgNum = enchargesInstalled ? commEncharge.num : 0;
        const commEnchgLevel = enchargesInstalled ? (commEncharge.level * 20) : 0;
        const commEnchgLevel24g = enchargesInstalled ? (commEncharge.level_24g * 20) : 0;
        const commEnchagLevelSubg = enchargesInstalled ? (commEncharge.level_subg * 20) : 0;

        const alerts = envoy.alerts;
        const updateStatus = CONSTANS.ApiCodes[envoy.update_status] || 'undefined';

        //wireless connection kit
        if (wirelessConnectionKitInstalled) {
          this.wirelessConnectionsSignalStrength = new Array();
          this.wirelessConnectionsSignalStrengthMax = new Array();
          this.wirelessConnectionsType = new Array();
          this.wirelessConnectionsConnected = new Array();

          for (let i = 0; i < wirelessConnectionKitConnectionsCount; i++) {
            const wirelessConnectionKitConnections = envoy.wireless_connection[i];
            const wirelessConnectionSignalStrength = (wirelessConnectionKitConnections.signal_strength * 20);
            const wirelessConnectionSignalStrengthMax = (wirelessConnectionKitConnections.signal_strength_max * 20);
            const wirelessConnectionType = CONSTANS.ApiCodes[wirelessConnectionKitConnections.type] || 'undefined';
            const wirelessConnectionConnected = (wirelessConnectionKitConnections.connected == true);

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
        }

        //enpower
        const enpower = envoy.enpower;
        const enpowerConnected = enpowerInstalled ? (enpower.connected == true) : false;
        const enpowerGridStatus = enpowerInstalled ? CONSTANS.ApiCodes[enpower.grid_status] || 'undefined' : '';

        //convert status
        const arrStatus = new Array();
        if (Array.isArray(alerts) && alerts.length > 0) {
          for (let j = 0; j < alerts.length; j++) {
            arrStatus.push(CONSTANS.ApiCodes[alerts[j]] || alerts[j]);
          }
        }
        const status = (arrStatus.length > 0) ? (arrStatus.join(', ')).substring(0, 64) : 'No alerts';

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
          if (enchargesInstalled) {
            this.envoysService[0]
              .updateCharacteristic(Characteristic.enphaseEnvoyCommNumEnchgAndLevel, `${commEnchgNum} / ${commEnchgLevel}`)
          }
          if (enpowerInstalled) {
            this.envoysService[0]
              .updateCharacteristic(Characteristic.enphaseEnvoyEnpowerConnected, enpowerConnected)
              .updateCharacteristic(Characteristic.enphaseEnvoyEnpowerGridStatus, enpowerGridStatus)
          }
        }

        this.enpowerInstalled = enpowerInstalled;
        this.enchargesInstalled = enchargesInstalled;
        this.wirelessConnectionKitInstalled = wirelessConnectionKitInstalled;
        this.wirelessConnectionKitConnectionsCount = wirelessConnectionKitConnectionsCount;
        this.ensembleInstalled = ensembleInstalled;
        this.envoyNetworkInterfacesCount = envoyNetworkInterfacesCount;

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
        this.envoyCommEnchgNum = commEnchgNum;
        this.envoyCommEnchgLevel = commEnchgLevel;
        this.envoyCommEnchgLevel24g = commEnchgLevel24g;
        this.envoyCommEnchagLevelSubg = commEnchagLevelSubg;
        this.envoyAlerts = status;
        this.envoyUpdateStatus = updateStatus;

        this.envoyEnpowerConnected = enpowerConnected;
        this.envoyEnpowerGridStatus = enpowerGridStatus;

        const mqtt = this.mqttEnabled ? this.mqttClient.send('Home', JSON.stringify(envoy, null, 2)) : false;
        this.updateInventoryData();
      }
    } catch (error) {
      this.log.error(`Device: ${this.host} ${this.name}, home error: ${error}, reconnect in 15s.`);
      this.reconnect();
    };
  };


  async updateInventoryData() {
    this.log.debug(`Device: ${this.host} ${this.name}, requesting inventory.`);

    try {
      const inventoryData = await this.axiosInstance(CONSTANS.ApiUrls.Inventory);
      const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug inventory: ${JSON.stringify(inventoryData.data, null, 2)}`) : false;

      if (inventoryData.status == 200) {

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
            const producing = (microinverter.producing == true);
            const communicating = (microinverter.communicating == true);
            const provisioned = (microinverter.provisioned == true);
            const operating = (microinverter.operating == true);

            //convert status
            const arrStatus = new Array();
            if (Array.isArray(deviceStatus) && deviceStatus.length > 0) {
              for (let j = 0; j < deviceStatus.length; j++) {
                arrStatus.push(CONSTANS.ApiCodes[deviceStatus[j]] || deviceStatus[j]);
              }
            }
            const status = (arrStatus.length > 0) ? (arrStatus.join(', ')).substring(0, 64) : 'No status';

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
        }
        this.microinvertersCount = microinvertersCount;
        this.microinvertersInstalled = microinvertersInstalled;

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
            const producing = (acBaterie.producing == true);
            const communicating = (acBaterie.communicating == true);
            const provisioned = (acBaterie.provisioned == true);
            const operating = (acBaterie.operating == true);
            const sleepEnabled = acBaterie.sleep_enabled;
            const percentFull = acBaterie.percentFull;
            const maxCellTemp = acBaterie.maxCellTemp;
            const sleepMinSoc = acBaterie.sleep_min_soc;
            const sleepMaxSoc = acBaterie.sleep_max_soc;
            const chargeStatus = CONSTANS.ApiCodes[acBaterie.charge_status] || 'undefined';

            //convert status
            const arrStatus = new Array();
            if (Array.isArray(deviceStatus) && deviceStatus.length > 0) {
              for (let j = 0; j < deviceStatus.length; j++) {
                arrStatus.push(CONSTANS.ApiCodes[deviceStatus[j]] || deviceStatus[j]);
              }
            }
            const status = (arrStatus.length > 0) ? (arrStatus.join(', ')).substring(0, 64) : 'No status';

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
        }
        this.acBatteriesCount = acBatteriesCount;
        this.acBatteriesInstalled = acBatteriesInstalled;

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
            const producing = (qRelay.producing == true);
            const communicating = (qRelay.communicating == true);
            const provisioned = (qRelay.provisioned == true);
            const operating = (qRelay.operating == true);
            const relay = CONSTANS.ApiCodes[qRelay.relay] || 'undefined';
            const reasonCode = qRelay.reason_code;
            const reason = qRelay.reason;
            const linesCount = qRelay['line-count'];
            const line1Connected = linesCount >= 1 ? (qRelay['line1-connected'] == true) : false;
            const line2Connected = linesCount >= 2 ? (qRelay['line2-connected'] == true) : false;
            const line3Connected = linesCount >= 3 ? (qRelay['line3-connected'] == true) : false;

            //convert status
            const arrStatus = new Array();
            if (Array.isArray(deviceStatus) && deviceStatus.length > 0) {
              for (let j = 0; j < deviceStatus.length; j++) {
                arrStatus.push(CONSTANS.ApiCodes[deviceStatus[j]] || deviceStatus[j]);
              }
            }
            const status = (arrStatus.length > 0) ? (arrStatus.join(', ')).substring(0, 64) : 'undefined';

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
        }
        this.qRelaysCount = qRelaysCount;
        this.qRelaysInstalled = qRelaysInstalled;
        const mqtt = this.mqttEnabled ? this.mqttClient.send('Inventory', JSON.stringify(inventoryData.data, null, 2)) : false;
        const updateNext = this.envoySupportMeters ? this.updateMetersData() : (this.ensembleInstalled && this.installerPasswd) ? this.updateEnsembleInventoryData() : this.checkDeviceInfo ? this.updateProductionData() : this.updateHome();
      }
    } catch (error) {
      this.checkDeviceInfo = true;
      this.log.error(`Device: ${this.host} ${this.name}, inventory error: ${error}, reconnect in 15s.`);
      this.reconnect();
    };
  };

  async updateMetersData() {
    this.log.debug(`Device: ${this.host} ${this.name}, requesting meters info.`);

    try {
      const metersData = await this.axiosInstance(CONSTANS.ApiUrls.InternalMeterInfo);
      const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug meters: ${JSON.stringify(metersData.data, null, 2)}`) : false;

      if (metersData.status == 200) {
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
            const state = (meter.state == 'enabled') || false;
            const measurementType = CONSTANS.ApiCodes[meter.measurementType] || 'undefined';
            const phaseMode = CONSTANS.ApiCodes[meter.phaseMode] || 'undefined';
            const phaseCount = meter.phaseCount;
            const meteringStatus = CONSTANS.ApiCodes[meter.meteringStatus] || 'undefined';
            const statusFlags = meter.statusFlags;

            // convert status
            const arrStatus = new Array();
            if (Array.isArray(statusFlags) && statusFlags.length > 0) {
              for (let j = 0; j < statusFlags.length; j++) {
                arrStatus.push(CONSTANS.ApiCodes[statusFlags[j]] || statusFlags[j]);
              }
            }
            const status = (arrStatus.length > 0) ? (arrStatus.join(', ')).substring(0, 64) : 'No status flags';


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

          this.metersProductionEnabled = this.metersState[0];
          this.metersProductionVoltageDivide = (this.metersPhaseMode[0] === 'Split') ? 1 : this.metersPhaseCount[0];
          this.metersConsumptionEnabled = this.metersState[1];
          this.metersConsumpionVoltageDivide = (this.metersPhaseMode[1] === 'Split') ? 1 : this.metersPhaseCount[1];
        }
        this.metersCount = metersCount;
        this.metersInstalled = metersInstalled;

        const mqtt = this.mqttEnabled ? this.mqttClient.send('Meters', JSON.stringify(metersData.data, null, 2)) : false;
        const updateNext = this.metersInstalled ? this.updateMetersReadingData() : (this.ensembleInstalled && this.installerPasswd) ? this.updateEnsembleInventoryData() : this.checkDeviceInfo ? this.updateProductionData() : this.updateHome();
      }
    } catch (error) {
      this.checkDeviceInfo = true;
      this.log.error(`Device: ${this.host} ${this.name}, meters error: ${error}, reconnect in 15s.`);
      this.reconnect();
    };
  };

  async updateMetersReadingData() {
    this.log.debug(`Device: ${this.host} ${this.name}, requesting meters reading.`);

    try {
      const metersReadingData = await this.axiosInstance(CONSTANS.ApiUrls.InternalMeterReadings);
      const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug meters reading: ${JSON.stringify(metersReadingData.data, null, 2)}`) : false;

      if (metersReadingData.status == 200) {
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
            const metersVoltageDivide = (this.metersPhaseMode[i] == 'Split') ? 1 : this.metersPhaseCount[i];
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
        }
        this.metersReadingCount = metersReadingCount;
        this.metersReadingInstalled = metersReadingInstalled;

        const mqtt = this.mqttEnabled ? this.mqttClient.send('Meters Reading', JSON.stringify(metersReadingData.data, null, 2)) : false;
        const updateNext = (this.ensembleInstalled && this.installerPasswd) ? this.updateEnsembleInventoryData() : this.checkDeviceInfo ? this.updateProductionData() : this.updateMetersReading();
      }
    } catch (error) {
      this.checkDeviceInfo = true;
      this.log.error(`Device: ${this.host} ${this.name}, meters reading error: ${error}, reconnect in 15s.`);
      this.reconnect();
    };
  };

  async updateEnsembleInventoryData() {
    this.log.debug(`Device: ${this.host} ${this.name}, requesting ensemble inventory.`);

    try {
      const options = {
        method: 'GET',
        url: this.url + CONSTANS.ApiUrls.EnsembleInventory,
        headers: {
          Accept: 'application/json'
        }
      }

      const ensembleInventoryData = await this.digestAuthInstaller.request(options);
      const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug ensemble inventory: ${JSON.stringify(ensembleInventoryData.data, null, 2)}`) : false;

      if (ensembleInventoryData.status == 200) {
        //encharges inventory
        const encharges = ensembleInventoryData.data[0];
        const enchargesCount = encharges.devices.length;

        if (enchargesCount > 0) {
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
            const operating = (encharge.operating == true);
            const communicating = (encharge.communicating == true);
            const sleepEnabled = encharge.sleep_enabled;
            const percentFull = encharge.percentFull;
            const temperature = encharge.temperature;
            const maxCellTemp = encharge.maxCellTemp;
            const commLevelSubGhz = (encharge.comm_level_sub_ghz * 20);
            const commLevel24Ghz = (encharge.comm_level_2_4_ghz * 20);
            const ledStatus = CONSTANS.LedStatus[encharge.led_status] || 'undefined';
            const realPowerW = parseFloat((encharge.real_power_w) / 1000); // in kW
            const dcSwitchOff = encharge.dc_switch_off;
            const rev = encharge.encharge_rev;
            const capacity = parseFloat((encharge.encharge_capacity) / 1000); //in kWh

            //convert status
            const arrStatus = new Array();
            if (Array.isArray(deviceStatus) && deviceStatus.length > 0) {
              for (let j = 0; j < deviceStatus.length; j++) {
                arrStatus.push(CONSTANS.ApiCodes[deviceStatus[j]] || deviceStatus[j]);
              }
            }
            const status = (arrStatus.length > 0) ? (arrStatus.join(', ')).substring(0, 64) : 'No status';

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
                .updateCharacteristic(Characteristic.enphaseEnchargeRealPowerW, realPowerW)
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
            this.enchargesRealPowerW.push(realPowerW);
            this.enchargesDcSwitchOff.push(dcSwitchOff);
            this.enchargesRev.push(rev);
            this.enchargesCapacity.push(capacity);
          }
          this.enchargesType = type;
        }
        this.enchargesCount = enchargesCount;

        //enpowers inventory
        const enpowers = ensembleInventoryData.data[1];
        const enpowersCount = (enpowers.devices.length);

        if (enpowersCount > 0) {
          const enpower = enpowers.devices[0];
          const type = CONSTANS.ApiCodes[enpowers.type] || 'Enpower';
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
          const operating = (enpower.operating == true);
          const communicating = (enpower.communicating == true);
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
          const arrStatus = new Array();
          if (Array.isArray(deviceStatus) && deviceStatus.length > 0) {
            for (let j = 0; j < deviceStatus.length; j++) {
              arrStatus.push(CONSTANS.ApiCodes[deviceStatus[j]] || deviceStatus[j]);
            }
          }
          const status = (arrStatus.length > 0) ? (arrStatus.join(', ')).substring(0, 64) : 'No status';

          if (this.enpowersService) {
            this.enpowersService[0]
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

          this.enpowerType = type;
          this.enpowerSerialNumber = serialNumber;
          this.enpowerLastReportDate = lastReportDate;
          this.enpowerAdminStateStr = adminStateStr;
          this.enpowerOperating = operating;
          this.enpowerCommunicating = communicating;
          this.enpowerTemperature = temperature;
          this.enpowerCommLevelSubGhz = commLevelSubGhz;
          this.enpowerCommLevel24Ghz = commLevel24Ghz;
          this.enpowerMainsAdminState = mainsAdminState;
          this.enpowerMainsOperState = mainsOperState;
          this.enpowerGridMode = enpwrGridMode;
          this.enpowerEnchgGridMode = enchgGridMode;
          this.enpowerRelayStateBm = enpwrRelayStateBm;
          this.enpowerCurrStateId = enpwrCurrStateId;
        }
        this.enpowersCount = enpowersCount;

        //grid profile
        const gridProfile = ensembleInventoryData.data[2];
        const gridProfileName = gridProfile.grid_profile_name;
        const gridProfileId = gridProfile.id;
        const gridProfileVersion = gridProfile.grid_profile_version;
        const gridProfileIdItemCount = gridProfile.item_count;

        this.ensembleGridProfileName = gridProfileName;
        this.ensembleId = gridProfileId;
        this.ensembleGridProfileVersion = gridProfileVersion;
        this.ensembleItemCount = gridProfileIdItemCount;

        const mqtt = this.mqttEnabled ? this.mqttClient.send('Ensemble Inventory', JSON.stringify(ensembleInventoryData.data, null, 2)) : false;
        const updateNext = (this.ensembleInstalled && this.installerPasswd) ? this.updateEnsembleStatusData() : this.checkDeviceInfo ? this.updateProductionData() : this.updateEnsembleInventory();
      }
    } catch (error) {
      this.checkDeviceInfo = true;
      this.log.error(`Device: ${this.host} ${this.name}, ensemble inventory error: ${error}, reconnect in 15s.`);
      this.reconnect();
    };
  };

  async updateEnsembleStatusData() {
    this.log.debug(`Device: ${this.host} ${this.name}, requesting ensemble status.`);

    try {
      const options = {
        method: 'GET',
        url: this.url + CONSTANS.ApiUrls.EnsembleStatus,
        headers: {
          Accept: 'application/json'
        }
      }

      const ensembleStatusData = await this.digestAuthInstaller.request(options);
      const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug ensemble status: ${JSON.stringify(ensembleStatusData.data, null, 2)}`) : false;

      //ensemble status
      if (ensembleStatusData.status == 200) {
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

        if (this.enpowersStatusService) {
          this.enpowersStatusService[0]
            .updateCharacteristic(Characteristic.enphaseEnpowerStatusFreqBiasHz, freqBiasHz)
            .updateCharacteristic(Characteristic.enphaseEnpowerStatusVoltageBiasV, voltageBiasV)
            .updateCharacteristic(Characteristic.enphaseEnpowerStatusFreqBiasHzQ8, freqBiasHzQ8)
            .updateCharacteristic(Characteristic.enphaseEnpowerStatusVoltageBiasVQ5, voltageBiasVQ5)
            .updateCharacteristic(Characteristic.enphaseEnpowerStatusConfiguredBackupSoc, configuredBackupSoc)
            .updateCharacteristic(Characteristic.enphaseEnpowerStatusAdjustedBackupSoc, adjustedBackupSoc)
            .updateCharacteristic(Characteristic.enphaseEnpowerStatusAggSoc, aggSoc)
            .updateCharacteristic(Characteristic.enphaseEnpowerStatusAggBackupEnergy, aggBackupEnergy)
            .updateCharacteristic(Characteristic.enphaseEnpowerStatusAggAvailEnergy, aggAvailEnergy);
        }

        this.enpowerFreqBiasHz = freqBiasHz;
        this.enpowerVoltageBiasV = voltageBiasV;
        this.enpowerFreqBiasHzQ8 = freqBiasHzQ8;
        this.enpowerVoltageBiasVQ5 = voltageBiasVQ5;
        this.enpowerConfiguredBackupSoc = configuredBackupSoc;
        this.enpowerAdjustedBackupSoc = adjustedBackupSoc;
        this.enpowerAggSoc = aggSoc;
        this.enpowerAggBackupEnergy = aggBackupEnergy;
        this.enpowerAggAvailEnergy = aggAvailEnergy;

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

        this.ensembleGridProfileName = name;
        this.ensembleId = id;
        this.ensembleGridProfileVersion = version;
        this.ensembleItemCount = itemCount;

        const fakeInventoryMode = ensembleStatus.fakeit.fake_inventory_mode;
        this.ensembleFakeInventoryMode = (fakeInventoryMode == true);
        const mqtt = this.mqttEnabled ? this.mqttClient.send('Ensemble Status', JSON.stringify(ensembleStatus, null, 2)) : false;
        const updateNext = this.checkDeviceInfo ? this.updateProductionData() : this.updateEnsembleInventory();
      }
    } catch (error) {
      this.checkDeviceInfo = true;
      this.log.error(`Device: ${this.host} ${this.name}, ensemble status error: ${error}, reconnect in 15s.`);
      this.reconnect();
    };
  };

  async updateProductionData() {
    this.log.debug(`Device: ${this.host} ${this.name}, requesting production.`);

    try {
      const productionData = await this.axiosInstance(CONSTANS.ApiUrls.InverterProductionSumm);
      const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug production: ${JSON.stringify(productionData.data, null, 2)}`) : false;

      //microinverters summary 
      if (productionData.status == 200) {
        const productionEnergyLifetimeOffset = this.productionEnergyLifetimeOffset;
        const productionMicroSummarywhToday = parseFloat(productionData.data.wattHoursToday / 1000);
        const productionMicroSummarywhLastSevenDays = parseFloat(productionData.data.wattHoursSevenDays / 1000);
        const productionMicroSummarywhLifeTime = parseFloat((productionData.data.wattHoursLifetime + productionEnergyLifetimeOffset) / 1000);
        const productionMicroSummaryWattsNow = parseFloat(productionData.data.wattsNow / 1000);

        this.productionMicroSummarywhToday = productionMicroSummarywhToday;
        this.productionMicroSummarywhLastSevenDays = productionMicroSummarywhLastSevenDays;
        this.productionMicroSummarywhLifeTime = productionMicroSummarywhLifeTime;
        this.productionMicroSummaryWattsNow = productionMicroSummaryWattsNow;

        const mqtt = this.mqttEnabled ? this.mqttClient.send('Production', JSON.stringify(productionData.data, null, 2)) : false;
        const updateNext = this.checkDeviceInfo ? this.updateProductionCtData() : this.updateProduction();
      }
    } catch (error) {
      this.checkDeviceInfo = true;
      this.log.error(`Device: ${this.host} ${this.name}, production error: ${error}, reconnect in 15s.`);
      this.reconnect();
    };
  };

  async updateProductionCtData() {
    this.log.debug(`Device: ${this.host} ${this.name}, requesting production current transformer.`);

    try {
      const productionCtData = await this.axiosInstance(CONSTANS.ApiUrls.SystemReadingStats);
      const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug production ct: ${JSON.stringify(productionCtData.data, null, 2)}`) : false;

      //production CT
      if (productionCtData.status == 200) {
        //auto reset peak power
        const date = new Date();
        const currentDayOfWeek = date.getDay();
        const currentDayOfMonth = date.getDate();
        const resetProductionPowerPeak = [false, currentDayOfWeek != this.currentDayOfWeek, (currentDayOfWeek == 6) ? currentDayOfWeek < this.currentDayOfWeek : false, currentDayOfMonth < this.currentDayOfMonth][this.productionPowerPeakAutoReset];
        const resetConsumptionTotalPowerPeak = [false, currentDayOfWeek != this.currentDayOfWeek, (currentDayOfWeek == 6) ? currentDayOfWeek < this.currentDayOfWeek : false, currentDayOfMonth < this.currentDayOfMonth][this.consumptionTotalPowerPeakAutoReset];
        const resetConsumptionNetPowerPeak = [false, currentDayOfWeek != this.currentDayOfWeek, (currentDayOfWeek == 6) ? currentDayOfWeek < this.currentDayOfWeek : false, currentDayOfMonth < this.currentDayOfMonth][this.consumptionNetPowerPeakAutoReset];

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
        this.log.debug(`Device: ${this.host} ${this.name}, read production power peak:${savedProductionPowerPeak} kW`);
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
            this.log.debug(`Device: ${this.host} ${this.name}, read ${consumptionsName} ${savedConsumptionPowerPeak} kW`);
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
        const mqtt = this.mqttEnabled ? this.mqttClient.send('Production CT', JSON.stringify(productionCtData.data, null, 2)) : false;
        const updateNext = !this.checkDeviceInfo ? this.updateProductionCt() : this.envoyPasswd ? this.updateMicroinvertersData() : (this.installerPasswd && this.envoyDevId.length == 9) ? this.updateProductionPowerModeData() : this.getDeviceInfo();
      }
    } catch (error) {
      this.checkDeviceInfo = true;
      this.log.error(`Device: ${this.host} ${this.name}, production ct error: ${error}, reconnect in 15s.`);
      this.reconnect();
    };
  };

  async updateMicroinvertersData() {
    this.log.debug(`Device: ${this.host} ${this.name}, requesting microinverters`);

    try {
      //digest auth envoy
      const passwd = this.envoyPasswd;
      const digestAuth = new axiosDigestAuth({
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

      const microinvertersData = await digestAuth.request(options);
      const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug microinverters: ${JSON.stringify(microinvertersData.data, null, 2)}`) : false;

      if (microinvertersData.status == 200) {
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
          const maxReportWatts = parseInt(microinverter.maxReportWatts);
          const microinverterPower = (lastReportWatts < 0) ? 0 : lastReportWatts;

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
        this.microinvertersUpdatePower = true;

        const mqtt = this.mqttEnabled ? this.mqttClient.send('Microinverters', JSON.stringify(microinvertersData.data, null, 2)) : false;
        const updateNext = !this.checkDeviceInfo ? this.updateMicroinverters() : (this.installerPasswd && this.envoyDevId.length == 9) ? this.updateProductionPowerModeData() : this.getDeviceInfo();
      }
    } catch (error) {
      this.checkDeviceInfo = true;
      this.microinvertersUpdatePower = false;
      this.log.error(`Device: ${this.host} ${this.name}, microinverters error: ${error}, reconnect in 15s.`);
      this.reconnect();
    };
  };

  async updateProductionPowerModeData() {
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

      const powerModeData = await this.digestAuthInstaller.request(options);
      const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug power mode: ${JSON.stringify(powerModeData.data, null, 2)}`) : false;

      if (powerModeData.status == 200) {
        const productionPowerMode = (powerModeData.data.powerForcedOff == false);

        if (this.envoysService) {
          this.envoysService[0]
            .updateCharacteristic(Characteristic.enphaseEnvoyProductionPowerMode, productionPowerMode)
        }

        this.productionPowerMode = productionPowerMode;
        const mqtt = this.mqttEnabled ? this.mqttClient.send('Power Mode', JSON.stringify(powerModeData.data, null, 2)) : false;
        const getaDeviceInfo = !this.checkDeviceInfo ? false : this.getDeviceInfo();
      }
    } catch (error) {
      this.checkDeviceInfo = true;
      this.log.error(`Device: ${this.host} ${this.name}, power mode error: ${error}, reconnect in 15s.`);
      this.reconnect();
    };
  }

  async updateCommLevelData() {
    this.log.debug(`Device: ${this.host} ${this.name}, requesting pcu communication level.`);

    try {
      const options = {
        method: 'GET',
        url: this.url + CONSTANS.ApiUrls.InverterComm,
        headers: {
          Accept: 'application/json'
        }
      }

      const pcuCommLevelData = await this.digestAuthInstaller.request(options);
      const debug = this.enableDebugMode ? this.log(`Device: ${this.host} ${this.name}, debug pcu comm level: ${JSON.stringify(pcuCommLevelData.data, null, 2)}`) : false;

      if (pcuCommLevelData.status == 200) {
        //create arrays
        this.microinvertersCommLevel = new Array();
        this.acBatteriesCommLevel = new Array();
        this.qRelaysCommLevel = new Array();

        // get comm level data
        const commLevel = pcuCommLevelData.data;

        // get devices count
        const microinvertersCount = this.microinvertersCount
        const acBatteriesCount = this.acBatteriesCount;
        const qRelaysCount = this.qRelaysCount;

        for (let i = 0; i < microinvertersCount; i++) {
          const key = (`${this.microinvertersSerialNumber[i]}`);
          const value = (commLevel[key] != undefined) ? (commLevel[key]) * 20 : 0;
          if (this.microinvertersService) {
            this.microinvertersService[i]
              .updateCharacteristic(Characteristic.enphaseMicroinverterCommLevel, value)
          }
          this.microinvertersCommLevel.push(value);
        }

        for (let i = 0; i < acBatteriesCount; i++) {
          const key = (`${this.acBatteriesSerialNumber[i]}`);
          const value = (commLevel[key] != undefined) ? (commLevel[key]) * 20 : 0;

          if (this.acBatteriesService) {
            this.acBatteriesService[i]
              .updateCharacteristic(Characteristic.enphaseAcBatterieCommLevel, value)
          }
          this.acBatteriesCommLevel.push(value);
        }

        for (let i = 0; i < qRelaysCount; i++) {
          const key = (`${this.qRelaysSerialNumber[i]}`);
          const value = (commLevel[key] != undefined) ? (commLevel[key]) * 20 : 0;

          if (this.qRelaysService) {
            this.qRelaysService[i]
              .updateCharacteristic(Characteristic.enphaseQrelayCommLevel, value)
          }
          this.qRelaysCommLevel.push(value);
        }

        //disable check comm level switch
        if (this.envoysService) {
          this.envoysService[0]
            .updateCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel, false);
        }

        this.updateCommLevel = true;
        this.envoyCheckCommLevel = false;
        const mqtt = this.mqttEnabled ? this.mqttClient.send('PCU Comm Level', JSON.stringify(pcuCommLevelData.data, null, 2)) : false;
      }
    } catch (error) {
      this.envoyCheckCommLevel = false;
      this.log.error(`Device: ${this.host} ${this.name}, pcu comm level error: ${error}`);
    };
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

    const ensembleInstalled = this.ensembleInstalled;
    const enpowerInstalled = this.enpowerInstalled;
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
      this.log(`Ensemble: ${ensembleInstalled ? `Yes` : `Not installed`}`);
      if (ensembleInstalled) {
        this.log(`Enpower: ${enpowerInstalled ? `Yes` : `No`}`);
        this.log(`Encharges: ${enchargesCount}`);
        this.log(`Wireless Kit: ${wirelessConnectionKitInstalled ? `Yes` : `No`}`);
      }
      this.log(`--------------------------------`);
      this.checkDeviceInfo = false;
    };

    this.updateHome();
    const startMeterReading = this.metersInstalled ? this.updateMetersReading() : false;
    const startEnsembleInventory = (this.ensembleInstalled && this.installerPasswd) ? this.updateEnsembleInventory() : false;
    this.updateProduction();
    this.updateProductionCt();
    const startMicroinverters = this.envoyPasswd ? this.updateMicroinverters() : false;

    if (deviceSn) {
      const startPrepareAccessory = this.startPrepareAccessory ? this.prepareAccessory() : false;
    } else {
      this.log.error(`Device: ${this.host} ${this.name}, serial number of envoy unknown: ${this.envoySerialNumbe}, reconnect in 15s.`);
      this.reconnect();
    };
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
    const envoySupportMeters = this.envoySupportMeters;
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
    const ensembleInstalled = this.ensembleInstalled;
    const enpowerInstalled = this.enpowerInstalled;
    const enchargesInstalled = this.enchargesInstalled;
    const enchargesCount = this.enchargesCount;
    const wirelessConnectionKitInstalled = this.wirelessConnectionKitInstalled;
    const wirelessConnectionKitConnectionsCount = this.wirelessConnectionKitConnectionsCount;

    //envoy
    this.envoysService = new Array();
    const enphaseEnvoyService = new Service.enphaseEnvoyService(`Envoy ${serialNumber}`, 'enphaseEnvoyService');
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyAlerts)
      .onGet(async () => {
        const value = this.envoyAlerts;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, alerts: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface)
      .onGet(async () => {
        const value = this.envoyPrimaryInterface;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, network interface: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm)
      .onGet(async () => {
        const value = this.envoyWebComm;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, web communication: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten)
      .onGet(async () => {
        const value = this.envoyEverReportedToEnlighten;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, report to enlighten: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel)
      .onGet(async () => {
        const value = (`${this.envoyCommNum} / ${this.envoyCommLevel}`);
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, communication Devices and level: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel)
      .onGet(async () => {
        const value = (`${this.envoyCommNsrbNum} / ${this.envoyCommNsrbLevel}`);
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, communication qRelays and level: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel)
      .onGet(async () => {
        const value = (`${this.envoyCommPcuNum} / ${this.envoyCommPcuLevel}`);
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber} , communication Microinverters and level: ${value}`);
        return value;
      });
    if (acBatteriesInstalled) {
      enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel)
        .onGet(async () => {
          const value = (`${this.envoyCommAcbNum} / ${this.envoyCommAcbLevel}`);
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, communication AC Batteries and level ${value}`);
          return value;
        });
    }
    if (enchargesInstalled) {
      enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumEnchgAndLevel)
        .onGet(async () => {
          const value = (`${this.envoyCommEnchgNum} / ${this.envoyCommEnchgLevel}`);
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, communication Encharges and level ${value}`);
          return value;
        });
    }
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyDbSize)
      .onGet(async () => {
        const value = (`${this.envoyDbSize} / ${this.envoyDbPercentFull}%`);
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, data base size: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyTariff)
      .onGet(async () => {
        const value = this.envoyTariff;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, tariff: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyUpdateStatus)
      .onGet(async () => {
        const value = this.envoyUpdateStatus;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, update status: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyFirmware)
      .onGet(async () => {
        const value = this.envoyFirmware;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, firmware: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyTimeZone)
      .onGet(async () => {
        const value = this.envoyTimeZone;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, time zone: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime)
      .onGet(async () => {
        const value = `${this.envoyCurrentDate} ${this.envoyCurrentTime}`;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, current date and time: ${value}`);
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporDate)
      .onGet(async () => {
        const value = this.envoyLastEnlightenReporDate;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, last report to enlighten: ${value}`);
        return value;
      });
    if (enpowerInstalled) {
      enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyEnpowerConnected)
        .onGet(async () => {
          const value = this.envoyEnpowerConnected;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, enpower connected: ${value}`);
          return value;
        });
      enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyEnpowerGridStatus)
        .onGet(async () => {
          const value = this.envoyEnpowerGridStatus;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, enpower grid status: ${value}`);
          return value;
        });
    }
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel)
      .onGet(async () => {
        const state = this.envoyCheckCommLevel;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, checking comm level: ${state ? `Yes` : `No`}`);
        return state;
      })
      .onSet(async (state) => {
        this.envoyCheckCommLevel = state;
        this.updateCommLevelData();
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, check comm level: ${state ? `Yes` : `No`}`);
      });
    if (this.installerPasswd && this.envoyDevId.length == 9) {
      enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyProductionPowerMode)
        .onGet(async () => {
          const state = this.productionPowerMode;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, envoy: ${serialNumber}, production power mode state: ${state ? 'Enabled' : 'Disabled'}`);
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

            const powerModeData = await this.digestAuthInstaller.request(options);
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
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, qrelay: ${qRelaySerialNumber}, relay state: ${value}`);
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLinesCount)
          .onGet(async () => {
            const value = this.qRelaysLinesCount[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, qrelay: ${qRelaySerialNumber}, lines: ${value}`);
            return value;
          });
        if (this.qRelaysLinesCount[i] > 0) {
          enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLine1Connected)
            .onGet(async () => {
              const value = this.qRelaysLine1Connected[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, qrelay: ${qRelaySerialNumber}, line 1: ${value ? 'Closed' : 'Open'}`);
              return value;
            });
        }
        if (this.qRelaysLinesCount[i] >= 2) {
          enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLine2Connected)
            .onGet(async () => {
              const value = this.qRelaysLine2Connected[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, qrelay: ${qRelaySerialNumber}, line 2: ${value ? 'Closed' : 'Open'}`);
              return value;
            });
        }
        if (this.qRelaysLinesCount[i] >= 3) {
          enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLine3Connected)
            .onGet(async () => {
              const value = this.qRelaysLine3Connected[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, qrelay: ${qRelaySerialNumber}, line 3: ${value ? 'Closed' : 'Open'}`);
              return value;
            });
        }
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayProducing)
          .onGet(async () => {
            const value = this.qRelaysProducing[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, qrelay: ${qRelaySerialNumber}, producing: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayCommunicating)
          .onGet(async () => {
            const value = this.qRelaysCommunicating[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, qrelay: ${qRelaySerialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayProvisioned)
          .onGet(async () => {
            const value = this.qRelaysProvisioned[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, qrelay: ${qRelaySerialNumber}, provisioned: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayOperating)
          .onGet(async () => {
            const value = this.qRelaysOperating[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, qrelay: ${qRelaySerialNumber}, operating: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayCommLevel)
          .onGet(async () => {
            const value = (this.updateCommLevel && this.qRelaysCommLevel[i] != undefined) ? this.qRelaysCommLevel[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, qrelay: ${qRelaySerialNumber}, communication level: ${value}`);
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayStatus)
          .onGet(async () => {
            const value = this.qRelaysStatus[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, qrelay: ${qRelaySerialNumber}, status: ${value}`);
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayFirmware)
          .onGet(async () => {
            const value = this.qRelaysFirmware[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, qrelay: ${qRelaySerialNumber}, firmware: ${value}`);
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLastReportDate)
          .onGet(async () => {
            const value = this.qRelaysLastReportDate[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, qrelay: ${qRelaySerialNumber}, last report: ${value}`);
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
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, Meter: ${meterMeasurementType}, state: ${value}`);
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
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, production power: ${value} kW`);
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphasePowerMax)
      .onGet(async () => {
        const value = this.productionPowerPeak;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, production power peak: ${value} kW`);
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphasePowerMaxDetected)
      .onGet(async () => {
        const value = this.productionPowerPeakDetected;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, production power peak detected: ${value ? 'Yes' : 'No'}`);
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphaseEnergyToday)
      .onGet(async () => {
        const value = this.productionEnergyToday;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, production energy today: ${value} kWh`);
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
      .onGet(async () => {
        const value = this.productionEnergyLastSevenDays;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, production energy last seven days: ${value} kWh`);
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
      .onGet(async () => {
        const value = this.productionEnergyLifeTime;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, production energy lifetime: ${value} kWh`);
        return value;
      });
    if (metersInstalled && metersProductionEnabled) {
      enphaseProductionService.getCharacteristic(Characteristic.enphaseRmsCurrent)
        .onGet(async () => {
          const value = this.productionRmsCurrent;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, production current: ${value} A`);
          return value;
        });
      enphaseProductionService.getCharacteristic(Characteristic.enphaseRmsVoltage)
        .onGet(async () => {
          const value = this.productionRmsVoltage;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, production voltage: ${value} V`);
          return value;
        });
      enphaseProductionService.getCharacteristic(Characteristic.enphaseReactivePower)
        .onGet(async () => {
          const value = this.productionReactivePower;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, production net reactive power: ${value} kVAr`);
          return value;
        });
      enphaseProductionService.getCharacteristic(Characteristic.enphaseApparentPower)
        .onGet(async () => {
          const value = this.productionApparentPower;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, production net apparent power: ${value} kVA`);
          return value;
        });
      enphaseProductionService.getCharacteristic(Characteristic.enphasePwrFactor)
        .onGet(async () => {
          const value = this.productionPwrFactor;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, production power factor: ${value} cos φ`);
          return value;
        });
    }
    enphaseProductionService.getCharacteristic(Characteristic.enphaseReadingTime)
      .onGet(async () => {
        const value = this.productionReadingTime;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, production last report: ${value}`);
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphasePowerMaxReset)
      .onGet(async () => {
        const state = false;
        const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, production power peak reset: Off`);
        return state;
      })
      .onSet(async (state) => {
        try {
          const write = state ? await fsPromises.writeFile(this.productionPowerPeakFile, '0') : false;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, reset production power peak: On`);
          enphaseProductionService.updateCharacteristic(Characteristic.enphasePowerMaxReset, false);
        } catch (error) {
          this.log.error(`Device: ${this.host} ${accessoryName}, reset production power peak error: ${error}`);
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
            const value = (this.consumptionsPower[i] != undefined) ? this.consumptionsPower[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName} ${consumptionMeasurmentType}, power: ${value} kW'`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePowerMax)
          .onGet(async () => {
            const value = (this.consumptionsPowerPeak[i] != undefined) ? this.consumptionsPowerPeak[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName} ${consumptionMeasurmentType}, power peak: ${value} kW'`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePowerMaxDetected)
          .onGet(async () => {
            const value = (this.consumptionsPowerPeakDetected[i] != undefined) ? this.consumptionsPowerPeakDetected[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName} ${consumptionMeasurmentType}, power peak detected: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyToday)
          .onGet(async () => {
            const value = (this.consumptionsEnergyToday[i] != undefined) ? this.consumptionsEnergyToday[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName} ${consumptionMeasurmentType}, energy today: ${value} kWh'`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
          .onGet(async () => {
            const value = (this.consumptionsEnergyLastSevenDays[i] != undefined) ? this.consumptionsEnergyLastSevenDays[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName} ${consumptionMeasurmentType}, energy last seven days: ${value} kWh'`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
          .onGet(async () => {
            const value = (this.consumptionsEnergyLifeTime[i] != undefined) ? this.consumptionsEnergyLifeTime[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName} ${consumptionMeasurmentType}, energy lifetime: ${value} kWh'`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseRmsCurrent)
          .onGet(async () => {
            const value = (this.consumptionsRmsCurrent[i] != undefined) ? this.consumptionsRmsCurrent[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName} ${consumptionMeasurmentType}, current: ${value} A'`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseRmsVoltage)
          .onGet(async () => {
            const value = (this.consumptionsRmsVoltage[i] != undefined) ? this.consumptionsRmsVoltage[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName} ${consumptionMeasurmentType}, voltage: ${value} V'`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseReactivePower)
          .onGet(async () => {
            const value = (this.consumptionsReactivePower[i] != undefined) ? this.consumptionsReactivePower[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName} ${consumptionMeasurmentType}, reactive power: ${value} kVAr'`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseApparentPower)
          .onGet(async () => {
            const value = (this.consumptionsApparentPower[i] != undefined) ? this.consumptionsApparentPower[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName} ${consumptionMeasurmentType}, apparent power: ${value} kVA'`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePwrFactor)
          .onGet(async () => {
            const value = (this.consumptionsPwrFactor[i] != undefined) ? this.consumptionsPwrFactor[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName} ${consumptionMeasurmentType}, power factor: ${value} cos φ'`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseReadingTime)
          .onGet(async () => {
            const value = (this.consumptionsReadingTime[i] != undefined) ? this.consumptionsReadingTime[i] : '';
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName} ${consumptionMeasurmentType}, last report: ${value}'`);
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePowerMaxReset)
          .onGet(async () => {
            const state = false;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName} ${consumptionMeasurmentType}, power peak reset: Off`);
            return state;
          })
          .onSet(async (state) => {
            try {
              const consumptionFile = [this.consumptionTotalPowerPeakFile, this.consumptionNetPowerPeakFile][i];
              const write = state ? await fsPromises.writeFile(consumptionFile, '0') : false;
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, reset %s power peak: On`);
              enphaseConsumptionService.updateCharacteristic(Characteristic.enphasePowerMaxReset, false);
            } catch (error) {
              this.log.error(`Device: ${this.host} ${accessoryName}, reset %s power peak error: ${error}'`);
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
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac bateries storage power: ${value} kW`);
          return value;
        });
      enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryEnergy)
        .onGet(async () => {
          const value = this.acBatteriesSummaryEnergy;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac bateries storage energy: ${value} kWh`);
          return value;
        });
      enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryPercentFull)
        .onGet(async () => {
          const value = this.acBatteriesSummaryPercentFull;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac bateries percent full: ${value}`);
          return value;
        });
      enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryActiveCount)
        .onGet(async () => {
          const value = this.acBatteriesSummaryActiveCount;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac bateries devices count: ${value}`);
          return value;
        });
      enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryState)
        .onGet(async () => {
          const value = this.acBatteriesSummaryState;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac bateries state: ${value}`);
          return value;
        });
      enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryReadingTime)
        .onGet(async () => {
          const value = this.acBatteriesSummaryReadingTime;
          const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac bateries: %s last report: ${value}`);
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
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac batterie: ${acBatterieSerialNumber} charge status ${value}`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieProducing)
          .onGet(async () => {
            const value = this.acBatteriesProducing[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac batterie: ${acBatterieSerialNumber} producing: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieCommunicating)
          .onGet(async () => {
            const value = this.acBatteriesCommunicating[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac batterie: ${acBatterieSerialNumber} communicating: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieProvisioned)
          .onGet(async () => {
            const value = this.acBatteriesProvisioned[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac batterie: ${acBatterieSerialNumber} provisioned: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieOperating)
          .onGet(async () => {
            const value = this.acBatteriesOperating[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac batterie: ${acBatterieSerialNumber} operating: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieCommLevel)
          .onGet(async () => {
            const value = (this.updateCommLevel && this.acBatteriesCommLevel[i] != undefined) ? this.acBatteriesCommLevel[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac batterie: ${acBatterieSerialNumber} comm. level: ${value}`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieSleepEnabled)
          .onGet(async () => {
            const value = this.acBatteriesSleepEnabled[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac batterie: ${acBatterieSerialNumber} sleep: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatteriePercentFull)
          .onGet(async () => {
            const value = this.acBatteriesPercentFull[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac batterie: ${acBatterieSerialNumber} percent full: ${value} %`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieMaxCellTemp)
          .onGet(async () => {
            const value = this.acBatteriesMaxCellTemp[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac batterie: ${acBatterieSerialNumber} max cell temp: ${value} °C`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieSleepMinSoc)
          .onGet(async () => {
            const value = this.acBatteriesSleepMinSoc[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac batterie: ${acBatterieSerialNumber} sleep min soc: ${value} min`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieSleepMaxSoc)
          .onGet(async () => {
            const value = this.acBatteriesSleepMaxSoc[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac batterie: ${acBatterieSerialNumber} sleep max soc: ${value} min`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieStatus)
          .onGet(async () => {
            const value = this.acBatteriesStatus[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac batterie: ${acBatterieSerialNumber} status: ${value}`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieFirmware)
          .onGet(async () => {
            const value = this.acBatteriesFirmware[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac batterie: ${acBatterieSerialNumber} firmware: ${value}`);
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieLastReportDate)
          .onGet(async () => {
            const value = this.acBatteriesLastReportDate[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, ac batterie: ${acBatterieSerialNumber} last report: ${value}`);
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
            let value = this.microinvertersUpdatePower ? this.microinvertersLastPower[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, microinverter: ${microinverterSerialNumber}, last power: ${value} W'`);
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterPowerMax)
          .onGet(async () => {
            const value = this.microinvertersUpdatePower ? this.microinvertersMaxPower[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, microinverter: ${microinverterSerialNumber}, max power: ${value} W'`);
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterProducing)
          .onGet(async () => {
            const value = this.microinvertersProducing[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, microinverter: ${microinverterSerialNumber}, producing: ${value}`);
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterCommunicating)
          .onGet(async () => {
            const value = this.microinvertersCommunicating[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, microinverter: ${microinverterSerialNumber}, communicating: ${value}`);
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterProvisioned)
          .onGet(async () => {
            const value = this.microinvertersProvisioned[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, microinverter: ${microinverterSerialNumber}, provisioned: ${value}`);
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterOperating)
          .onGet(async () => {
            const value = this.microinvertersOperating[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, microinverter: ${microinverterSerialNumber}, operating: ${value}`);
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterCommLevel)
          .onGet(async () => {
            const value = (this.updateCommLevel && this.microinvertersCommLevel[i] != undefined) ? this.microinvertersCommLevel[i] : 0;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, microinverter: ${microinverterSerialNumber}, comm. level: ${value}`);
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterStatus)
          .onGet(async () => {
            const value = this.microinvertersStatus[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, microinverter: ${microinverterSerialNumber}, status: ${value}`);
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterFirmware)
          .onGet(async () => {
            const value = this.microinvertersFirmware[i];
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, microinverter: ${microinverterSerialNumber}, firmware: ${value}`);
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterLastReportDate)
          .onGet(async () => {
            const value = this.microinvertersUpdatePower ? this.microinvertersReadingTime[i] : '0';
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, microinverter: ${microinverterSerialNumber}, last report: ${value}`);
            return value;
          });
        this.microinvertersService.push(enphaseMicroinverterService);
        accessory.addService(this.microinvertersService[i]);
      }
    }

    //ensemble
    if (ensembleInstalled) {
      //encharges inventory
      if (enchargesInstalled) {
        this.enchargesService = new Array();
        for (let i = 0; i < enchargesCount; i++) {
          const enchargeSerialNumber = this.enchargesSerialNumber[i];
          const enphaseEnchargeService = new Service.enphaseEnchargeService(`Encharge ${enchargeSerialNumber}`, `enphaseEnchargeService${i}`);
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeAdminStateStr)
            .onGet(async () => {
              const value = this.enchargesAdminStateStr[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge: ${enchargeSerialNumber}, state ${value}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeOperating)
            .onGet(async () => {
              const value = this.enchargesOperating[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge: ${enchargeSerialNumber}, operating: ${value ? 'Yes' : 'No'}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommunicating)
            .onGet(async () => {
              const value = this.enchargesCommunicating[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge: ${enchargeSerialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommLevelSubGhz)
            .onGet(async () => {
              const value = this.enchargesCommLevelSubGhz[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge: ${enchargeSerialNumber}, commubication level sub GHz: ${value}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommLevel24Ghz)
            .onGet(async () => {
              const value = this.enchargesCommLevel24Ghz[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge: ${enchargeSerialNumber}, communication level 2.4GHz: ${value}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeSleepEnabled)
            .onGet(async () => {
              const value = this.enchargesSleepEnabled[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge: ${enchargeSerialNumber}, sleep: ${value ? 'Yes' : 'No'}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargePercentFull)
            .onGet(async () => {
              const value = this.enchargesPercentFull[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge: ${enchargeSerialNumber}, percent full: ${value} %`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeTemperature)
            .onGet(async () => {
              const value = this.enchargesTemperature[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge: ${enchargeSerialNumber}, temp: ${value} °C`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeMaxCellTemp)
            .onGet(async () => {
              const value = this.enchargesMaxCellTemp[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge: ${enchargeSerialNumber}, max cell temp: ${value} °C`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeLedStatus)
            .onGet(async () => {
              const value = this.enchargesLedStatus[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge: ${enchargeSerialNumber}, LED status: ${value} min`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeRealPowerW)
            .onGet(async () => {
              const value = this.enchargesRealPowerW[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge: ${enchargeSerialNumber}, real power: ${value} W`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCapacity)
            .onGet(async () => {
              const value = this.enchargesCapacity[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge: ${enchargeSerialNumber}, capacity: ${value} kWh`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeDcSwitchOff)
            .onGet(async () => {
              const value = this.enchargesDcSwitchOff[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge: ${enchargeSerialNumber}, status: ${value ? 'Yes' : 'No'}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeRev)
            .onGet(async () => {
              const value = this.enchargesRev[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge: ${enchargeSerialNumber}, revision: ${value}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeGridProfile)
            .onGet(async () => {
              const value = this.ensembleGridProfileName;
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge ${enchargeSerialNumber}, grid profile: ${value}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeStatus)
            .onGet(async () => {
              const value = this.enchargesStatus[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge: ${enchargeSerialNumber}, status: ${value}`);
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeLastReportDate)
            .onGet(async () => {
              const value = this.enchargesLastReportDate[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, encharge: ${enchargeSerialNumber}, last report: ${value}`);
              return value;
            });
          this.enchargesService.push(enphaseEnchargeService);
          accessory.addService(this.enchargesService[i]);
        }
      }

      //enpower
      if (enpowerInstalled) {
        //enpower inventory
        this.enpowersService = new Array();
        const enpowerSerialNumber = this.enpowerSerialNumber;
        const enphaseEnpowerService = new Service.enphaseEnpowerService(`Enpower ${enpowerSerialNumber}`, 'enphaseEnpowerService');
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerAdminStateStr)
          .onGet(async () => {
            const value = this.enpowerAdminStateStr;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, state ${value}`);
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerOperating)
          .onGet(async () => {
            const value = this.enpowerOperating;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, operating: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerCommunicating)
          .onGet(async () => {
            const value = this.enpowerCommunicating;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerCommLevelSubGhz)
          .onGet(async () => {
            const value = this.enpowerCommLevelSubGhz;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, comm. level sub GHz: ${value}`);
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerCommLevel24Ghz)
          .onGet(async () => {
            const value = this.enpowerCommLevel24Ghz;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, comm. level 2.4GHz: ${value}`);
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerTemperature)
          .onGet(async () => {
            const value = this.enpowerTemperature;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, temp: ${value} °C'`);
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerMainsAdminState)
          .onGet(async () => {
            const value = this.enpowerMainsAdminState;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, mains admin state: ${value}`);
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerMainsOperState)
          .onGet(async () => {
            const value = this.enpowerMainsOperState;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, mains operating state: ${value}`);
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerEnpwrGridMode)
          .onGet(async () => {
            const value = this.enpowerGridMode;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, grid mode: ${value} W'`);
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerEnchgGridMode)
          .onGet(async () => {
            const value = this.enpowerEnchgGridMode;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, encharge grid mode: ${value}`);
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerGridProfile)
          .onGet(async () => {
            const value = this.ensembleGridProfileName;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, grid profile: ${value}`);
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerStatus)
          .onGet(async () => {
            const value = this.enpowerStatus;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, status: ${value}`);
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerLastReportDate)
          .onGet(async () => {
            const value = this.enpowerLastReportDate;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, last report: ${value}`);
            return value;
          });
        this.enpowersService.push(enphaseEnpowerService);
        accessory.addService(this.enpowersService[0]);

        //enpower status
        this.enpowersStatusService = new Array();
        const enphaseEnpowerStatusService = new Service.enphaseEnpowerStatusService(`Enpower Status enpower: ${enpowerSerialNumber}`, 'enphaseEnpowerStatusService');
        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusFreqBiasHz)
          .onGet(async () => {
            const value = this.enpowerFreqBiasHz;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, bias frequency: ${value} Hz`);
            return value;
          });

        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusVoltageBiasV)
          .onGet(async () => {
            const value = this.enpowerVoltageBiasV;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, bias voltage: ${value} V`);
            return value;
          });

        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusFreqBiasHzQ8)
          .onGet(async () => {
            const value = this.enpowerFreqBiasHzQ8;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, bias q8 frequency: ${value} Hz`);
            return value;
          });

        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusVoltageBiasVQ5)
          .onGet(async () => {
            const value = this.enpowerVoltageBiasVQ5;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, bias q5 voltage: ${value} V`);
            return value;
          });

        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusConfiguredBackupSoc)
          .onGet(async () => {
            const value = this.enpowerConfiguredBackupSoc;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, configured backup SoC: ${value} %`);
            return value;
          });

        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusAdjustedBackupSoc)
          .onGet(async () => {
            const value = this.enpowerAdjustedBackupSoc;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, adjusted backup SoC: ${value} %`);
            return value;
          });

        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusAggSoc)
          .onGet(async () => {
            const value = this.enpowerAggSoc;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, agg SoC: ${value} %`);
            return value;
          });

        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusAggBackupEnergy)
          .onGet(async () => {
            const value = this.enpowerAggBackupEnergy;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, agg backup energy: ${value} kWh`);
            return value;
          });

        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusAggAvailEnergy)
          .onGet(async () => {
            const value = this.enpowerAggAvailEnergy;
            const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, enpower: ${enpowerSerialNumber}, agg available energy: ${value} kWh`);
            return value;
          });

        this.enpowersStatusService.push(enphaseEnpowerStatusService);
        accessory.addService(this.enpowersStatusService[0]);
      }

      //wireless connektion kit
      if (wirelessConnectionKitInstalled) {
        this.wirelessConnektionsKitService = new Array();
        for (let i; i < wirelessConnectionKitConnectionsCount; i++) {
          const wirelessConnectionsType = this.wirelessConnectionsType[i];
          const enphaseWirelessConnectionKitService = new Service.enphaseWirelessConnectionKitService(`Wireless connection ${wirelessConnectionsType}`, `enphaseWirelessConnectionKitService${i}`);
          enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitConnected)
            .onGet(async () => {
              const value = this.wirelessConnectionsConnected[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, wireless connection: ${wirelessConnectionsType}, state: ${value ? 'Connected' : 'Disconnected'}`);
              return value;
            });

          enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitSignalStrength)
            .onGet(async () => {
              const value = this.wirelessConnectionsSignalStrength[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, wireless connection: ${wirelessConnectionsType}, signal strength: ${value} %`);
              return value;
            });

          enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitSignalStrengthMax)
            .onGet(async () => {
              const value = this.wirelessConnectionsSignalStrengthMax[i];
              const logInfo = this.disableLogInfo ? false : this.log(`Device: ${this.host} ${accessoryName}, wireless connection: ${wirelessConnectionsType}, signal strength mex: ${value} %`);
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