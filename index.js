'use strict';

const axios = require('axios').default;
const http = require('urllib');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const inherits = require('util').inherits;
const parseStringPromise = require('xml2js').parseStringPromise;

const PLUGIN_NAME = 'homebridge-enphase-envoy';
const PLATFORM_NAME = 'enphaseEnvoy';

const INFO_URL = '/info.xml';
const PRODUCTION_CT_URL = '/production.json';
const PRODUCTION_CT_DETAILS_URL = '/production.json?details=1';
const PRODUCTION_SUMM_INVERTERS_URL = '/api/v1/production';
const PRODUCTION_INVERTERS_URL = '/api/v1/production/inverters?locale=en';
const CONSUMPTION_SUMM_URL = '/api/v1/consumption';
const INVENTORY_URL = '/inventory.json';
const METERS_URL = '/ivp/meters';
const REPORT_SETTINGS_URL = '/ivp/reportsettings';
const INVERTERS_STATUS_URL = '/installer/agf/inverters_status.json';
const PCU_COMM_CHECK_URL = '/installer/pcu_comm_check';

const ENVOY_STATUS_CODE = ['status_not_available',
  'error.nodata', 'envoy.global.ok', 'Normal', 'envoy.cond_flags.acb_ctrl.bmuhardwareerror', 'envoy.cond_flags.acb_ctrl.bmuimageerror', 'envoy.cond_flags.acb_ctrl.bmumaxcurrentwarning', 'envoy.cond_flags.acb_ctrl.bmusenseerror', 'envoy.cond_flags.acb_ctrl.cellmaxtemperror',
  'envoy.cond_flags.acb_ctrl.cellmaxtempwarning', 'envoy.cond_flags.acb_ctrl.cellmaxvoltageerror', 'envoy.cond_flags.acb_ctrl.cellmaxvoltagewarning', 'envoy.cond_flags.acb_ctrl.cellmintemperror',
  'envoy.cond_flags.acb_ctrl.cellmintempwarning', 'envoy.cond_flags.acb_ctrl.cellminvoltageerror', 'envoy.cond_flags.acb_ctrl.cellminvoltagewarning', 'envoy.cond_flags.acb_ctrl.cibcanerror',
  'envoy.cond_flags.acb_ctrl.cibimageerror', 'envoy.cond_flags.acb_ctrl.cibspierror', 'envoy.cond_flags.obs_strs.discovering', 'envoy.cond_flags.obs_strs.failure', 'envoy.cond_flags.obs_strs.flasherror',
  'envoy.cond_flags.obs_strs.notmonitored', 'envoy.cond_flags.obs_strs.ok', 'envoy.cond_flags.obs_strs.plmerror',
  'envoy.cond_flags.obs_strs.secmodeenterfailure', 'envoy.cond_flags.obs_strs.secmodeexitfailure', 'envoy.cond_flags.obs_strs.sleeping', 'envoy.cond_flags.pcu_chan.acMonitorError',
  'envoy.cond_flags.pcu_chan.acfrequencyhigh', 'envoy.cond_flags.pcu_chan.acfrequencylow', 'envoy.cond_flags.pcu_chan.acfrequencyoor', 'envoy.cond_flags.pcu_chan.acvoltage_avg_hi',
  'envoy.cond_flags.pcu_chan.acvoltagehigh', 'envoy.cond_flags.pcu_chan.acvoltagelow', 'envoy.cond_flags.pcu_chan.acvoltageoor', 'envoy.cond_flags.pcu_chan.acvoltageoosp1', 'envoy.cond_flags.pcu_chan.acvoltageoosp2',
  'envoy.cond_flags.pcu_chan.acvoltageoosp3', 'envoy.cond_flags.pcu_chan.agfpowerlimiting', 'envoy.cond_flags.pcu_chan.dcresistancelow', 'envoy.cond_flags.pcu_chan.dcresistancelowpoweroff',
  'envoy.cond_flags.pcu_chan.dcvoltagetoohigh', 'envoy.cond_flags.pcu_chan.dcvoltagetoolow', 'envoy.cond_flags.pcu_chan.dfdt', 'envoy.cond_flags.pcu_chan.gfitripped',
  'envoy.cond_flags.pcu_chan.gridgone', 'envoy.cond_flags.pcu_chan.gridinstability', 'envoy.cond_flags.pcu_chan.gridoffsethi', 'envoy.cond_flags.pcu_chan.gridoffsetlow',
  'envoy.cond_flags.pcu_chan.hardwareError', 'envoy.cond_flags.pcu_chan.hardwareWarning', 'envoy.cond_flags.pcu_chan.highskiprate', 'envoy.cond_flags.pcu_chan.invalidinterval', 'envoy.cond_flags.pcu_chan.pwrgenoffbycmd',
  'envoy.cond_flags.pcu_chan.skippedcycles', 'envoy.cond_flags.pcu_chan.vreferror', 'envoy.cond_flags.pcu_ctrl.alertactive', 'envoy.cond_flags.pcu_ctrl.altpwrgenmode', 'envoy.cond_flags.pcu_ctrl.altvfsettings',
  'envoy.cond_flags.pcu_ctrl.badflashimage', 'envoy.cond_flags.pcu_ctrl.bricked', 'envoy.cond_flags.pcu_ctrl.commandedreset', 'envoy.cond_flags.pcu_ctrl.criticaltemperature',
  'envoy.cond_flags.pcu_ctrl.dc-pwr-low', 'envoy.cond_flags.pcu_ctrl.iuplinkproblem', 'envoy.cond_flags.pcu_ctrl.manutestmode', 'envoy.cond_flags.pcu_ctrl.nsync', 'envoy.cond_flags.pcu_ctrl.overtemperature', 'envoy.cond_flags.pcu_ctrl.poweronreset', 'envoy.cond_flags.pcu_ctrl.pwrgenoffbycmd', 'envoy.cond_flags.pcu_ctrl.runningonac', 'envoy.cond_flags.pcu_ctrl.tpmtest',
  'envoy.cond_flags.pcu_ctrl.unexpectedreset', 'envoy.cond_flags.pcu_ctrl.watchdogreset', 'envoy.cond_flags.rgm_chan.check_meter', 'envoy.cond_flags.rgm_chan.power_quality'
]
const ENVOY_STATUS_CODE_1 = ['Status not available', 'No Data', 'Normal', 'BMU Hardware Error', 'BMU Image Error', 'BMU Max Current Warning', 'BMU Sense Error',
  'Cell Max Temperature Error', 'Cell Max Temperature Warning', 'Cell Max Voltage Error', 'Cell Max Voltage Warning', 'Cell Min Temperature Error', 'Cell Min Temperature Warning',
  'Cell Min Voltage Error', 'Cell Min Voltage Warning', 'CIB CAN Error', 'CIB Image Error', 'CIB SPI Error', 'Discovering', 'Failure to report',
  'Flash Error', 'Not Monitored', 'Normal', 'PLM Error', 'Secure mode enter failure', 'Secure mode exit failure', 'Sleeping', 'AC Monitor Error',
  'AC Frequency High', 'AC Frequency Low', 'AC Frequency Out Of Range', 'AC Voltage Average High', 'AC Voltage High', 'AC Voltage Low', 'AC Voltage Out Of Range', 'AC Voltage Out Of Range - Phase 1', 'AC Voltage Out Of Range - Phase 2',
  'AC Voltage Out Of Range - Phase 3', 'AGF Power Limiting', 'DC Resistance Low', 'DC Resistance Low - Power Off', 'DC Voltage Too High', 'DC Voltage Too Low', 'AC Frequency Changing too Fast',
  'GFI Tripped', 'Grid Gone', 'Grid Instability', 'Grid Offset Hi', 'Grid Offset Low', 'Hardware Error', 'Hardware Warning', 'High Skip Rate', 'Invalid Interval', 'Power generation off by command',
  'Skipped Cycles', 'Voltage Ref Error', 'Alert Active', 'Alternate Power Generation Mode', 'Alternate Voltage and Frequency Settings', 'Bad Flash Image', 'No Grid Profile',
  'Commanded Reset', 'Critical Temperature', 'DC Power Too Low', 'IUP Link Problem', 'In Manu Test Mode', 'Grid Perturbation Unsynchronized', 'Over Temperature', 'Power On Reset', 'Power generation off by command',
  'Running on AC', 'Transient Grid Profile', 'Unexpected Reset', 'Watchdog Reset', 'Meter Error', 'Poor Power Quality'
]

let Accessory, Characteristic, Service, Categories, UUID;

module.exports = (api) => {
  Accessory = api.platformAccessory;
  Characteristic = api.hap.Characteristic;
  Service = api.hap.Service;
  Categories = api.hap.Categories;
  UUID = api.hap.uuid;

  //Envoy characteristics
  Characteristic.Power = function () {
    Characteristic.call(this, 'Power', Characteristic.Power.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kW',
      minValue: -100,
      maxValue: 1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.Power, Characteristic);
  Characteristic.Power.UUID = '00000001-000B-1000-8000-0026BB765291';

  Characteristic.PowerMax = function () {
    Characteristic.call(this, 'Power max', Characteristic.PowerMax.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kW',
      minValue: -100,
      maxValue: 1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.PowerMax, Characteristic);
  Characteristic.PowerMax.UUID = '00000002-000B-1000-8000-0026BB765291';

  Characteristic.PowerMaxDetected = function () {
    Characteristic.call(this, 'Power max detected', Characteristic.PowerMaxDetected.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.PowerMaxDetected, Characteristic);
  Characteristic.PowerMaxDetected.UUID = '00000006-000B-1000-8000-0026BB765291';

  Characteristic.EnergyToday = function () {
    Characteristic.call(this, 'Energy today', Characteristic.EnergyToday.UUID);
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
    Characteristic.call(this, 'Energy last 7 days', Characteristic.EnergyLastSevenDays.UUID);
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
    Characteristic.call(this, 'Energy lifetime', Characteristic.EnergyLifetime.UUID);
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

  //power meter service
  Service.PowerMeter = function (displayName, subtype) {
    Service.call(this, displayName, Service.PowerMeter.UUID, subtype);
    this.addCharacteristic(Characteristic.Power);
    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.PowerMax);
    this.addOptionalCharacteristic(Characteristic.PowerMaxDetected);
    this.addOptionalCharacteristic(Characteristic.EnergyToday);
    this.addOptionalCharacteristic(Characteristic.EnergyLastSevenDays);
    this.addOptionalCharacteristic(Characteristic.EnergyLifetime);
  };
  inherits(Service.PowerMeter, Service);
  Service.PowerMeter.UUID = '00000001-000A-1000-8000-0026BB765291';

  //qrelay characteristics
  Characteristic.qRelayRelay = function () {
    Characteristic.call(this, 'Relay', Characteristic.qRelayRelay.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.qRelayRelay, Characteristic);
  Characteristic.qRelayRelay.UUID = '00000010-000B-1000-8000-0026BB765291';

  Characteristic.qRelayProducing = function () {
    Characteristic.call(this, 'Producing', Characteristic.qRelayProducing.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.qRelayProducing, Characteristic);
  Characteristic.qRelayProducing.UUID = '00000011-000B-1000-8000-0026BB765291';

  Characteristic.qRelayCommunicating = function () {
    Characteristic.call(this, 'Communicating', Characteristic.qRelayCommunicating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.qRelayCommunicating, Characteristic);
  Characteristic.qRelayCommunicating.UUID = '00000012-000B-1000-8000-0026BB765291';

  Characteristic.qRelayProvisioned = function () {
    Characteristic.call(this, 'Provisioned', Characteristic.qRelayProvisioned.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.qRelayProvisioned, Characteristic);
  Characteristic.qRelayProvisioned.UUID = '00000013-000B-1000-8000-0026BB765291';

  Characteristic.qRelayOperating = function () {
    Characteristic.call(this, 'Operating', Characteristic.qRelayOperating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.qRelayOperating, Characteristic);
  Characteristic.qRelayOperating.UUID = '00000014-000B-1000-8000-0026BB765291';

  Characteristic.qRelayStatus = function () {
    Characteristic.call(this, 'Status', Characteristic.qRelayStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.qRelayStatus, Characteristic);
  Characteristic.qRelayStatus.UUID = '00000015-000B-1000-8000-0026BB765291';

  Characteristic.qRelayLastReportDate = function () {
    Characteristic.call(this, 'Last report', Characteristic.qRelayLastReportDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.qRelayLastReportDate, Characteristic);
  Characteristic.qRelayLastReportDate.UUID = '00000016-000B-1000-8000-0026BB765291';

  Service.enphaseQrelay = function (displayName, subtype) {
    Service.call(this, displayName, Service.enphaseQrelay.UUID, subtype);
    this.addCharacteristic(Characteristic.qRelayRelay);
    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.qRelayProducing);
    this.addOptionalCharacteristic(Characteristic.qRelayCommunicating);
    this.addOptionalCharacteristic(Characteristic.qRelayProvisioned);
    this.addOptionalCharacteristic(Characteristic.qRelayOperating);
    this.addOptionalCharacteristic(Characteristic.qRelayStatus);
    this.addOptionalCharacteristic(Characteristic.qRelayLastReportDate);
  };
  inherits(Service.enphaseQrelay, Service);
  Service.enphaseQrelay.UUID = '00000002-000A-1000-8000-0026BB765291';

  //meter characteristics
  Characteristic.meterState = function () {
    Characteristic.call(this, 'State', Characteristic.meterState.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.meterState, Characteristic);
  Characteristic.meterState.UUID = '00000020-000B-1000-8000-0026BB765291';

  Characteristic.meterMeasurmentType = function () {
    Characteristic.call(this, 'Measurment type', Characteristic.meterMeasurmentType.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.meterMeasurmentType, Characteristic);
  Characteristic.meterMeasurmentType.UUID = '00000021-000B-1000-8000-0026BB765291';

  Characteristic.meterPhaseMode = function () {
    Characteristic.call(this, 'Phase mode', Characteristic.meterPhaseMode.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.meterPhaseMode, Characteristic);
  Characteristic.meterPhaseMode.UUID = '00000021-000B-1000-8000-0026BB765291';

  Characteristic.meterPhaseCount = function () {
    Characteristic.call(this, 'Phase count', Characteristic.meterPhaseCount.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.meterPhaseCount, Characteristic);
  Characteristic.meterPhaseCount.UUID = '00000023-000B-1000-8000-0026BB765291';

  Characteristic.meterMeteringStatus = function () {
    Characteristic.call(this, 'Metering status', Characteristic.meterMeteringStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.meterMeteringStatus, Characteristic);
  Characteristic.meterMeteringStatus.UUID = '00000024-000B-1000-8000-0026BB765291';

  Characteristic.meterStatusFlags = function () {
    Characteristic.call(this, 'Status flag', Characteristic.meterStatusFlags.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.meterStatusFlags, Characteristic);
  Characteristic.meterStatusFlags.UUID = '00000025-000B-1000-8000-0026BB765291';

  Service.enphaseMeter = function (displayName, subtype) {
    Service.call(this, displayName, Service.enphaseMeter.UUID, subtype);
    this.addCharacteristic(Characteristic.meterState);
    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.meterMeasurmentType);
    this.addOptionalCharacteristic(Characteristic.meterPhaseMode);
    this.addOptionalCharacteristic(Characteristic.meterPhaseCount);
    this.addOptionalCharacteristic(Characteristic.meterMeteringStatus);
    this.addOptionalCharacteristic(Characteristic.meterStatusFlags);
  };
  inherits(Service.enphaseMeter, Service);
  Service.enphaseMeter.UUID = '00000003-000A-1000-8000-0026BB765291';

  //encharge charecteristics
  Characteristic.enchargePower = function () {
    Characteristic.call(this, 'Power', Characteristic.enchargePower.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'W',
      minValue: 0,
      maxValue: 100000,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enchargePower, Characteristic);
  Characteristic.enchargePower.UUID = '00000030-000B-1000-8000-0026BB765291';

  Characteristic.enchargeEnergyLifetime = function () {
    Characteristic.call(this, 'Energy lifetime', Characteristic.enchargeEnergyLifetime.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kWh',
      minValue: 0,
      maxValue: 100000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enchargeEnergyLifetime, Characteristic);
  Characteristic.enchargeEnergyLifetime.UUID = '00000031-000B-1000-8000-0026BB765291';

  Characteristic.enchargeProducing = function () {
    Characteristic.call(this, 'Producing', Characteristic.enchargeProducing.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enchargeProducing, Characteristic);
  Characteristic.enchargeProducing.UUID = '00000032-000B-1000-8000-0026BB765291';

  Characteristic.enchargeCommunicating = function () {
    Characteristic.call(this, 'Communicating', Characteristic.enchargeCommunicating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enchargeCommunicating, Characteristic);
  Characteristic.enchargeCommunicating.UUID = '00000033-000B-1000-8000-0026BB765291';

  Characteristic.enchargeProvisioned = function () {
    Characteristic.call(this, 'Provisioned', Characteristic.enchargeProvisioned.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enchargeProvisioned, Characteristic);
  Characteristic.enchargeProvisioned.UUID = '00000034-000B-1000-8000-0026BB765291';

  Characteristic.enchargeOperating = function () {
    Characteristic.call(this, 'Operating', Characteristic.enchargeOperating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enchargeOperating, Characteristic);
  Characteristic.enchargeOperating.UUID = '00000035-000B-1000-8000-0026BB765291';

  Characteristic.enchargeStatus = function () {
    Characteristic.call(this, 'Status', Characteristic.enchargeStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enchargeStatus, Characteristic);
  Characteristic.enchargeStatus.UUID = '00000036-000B-1000-8000-0026BB765291';

  Characteristic.enchargeLastReportDate = function () {
    Characteristic.call(this, 'Last report', Characteristic.enchargeLastReportDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enchargeLastReportDate, Characteristic);
  Characteristic.enchargeLastReportDate.UUID = '00000037-000B-1000-8000-0026BB765291';

  Service.enphaseEncharge = function (displayName, subtype) {
    Service.call(this, displayName, Service.enphaseEncharge.UUID, subtype);
    this.addCharacteristic(Characteristic.enchargePower);
    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.enchargeEnergyLifetime);
    this.addOptionalCharacteristic(Characteristic.enchargeProducing);
    this.addOptionalCharacteristic(Characteristic.enchargeCommunicating);
    this.addOptionalCharacteristic(Characteristic.enchargeProvisioned);
    this.addOptionalCharacteristic(Characteristic.enchargeOperating);
    this.addOptionalCharacteristic(Characteristic.enchargeStatus);
    this.addOptionalCharacteristic(Characteristic.enchargeLastReportDate);
  };
  inherits(Service.enphaseEncharge, Service);
  Service.enphaseEncharge.UUID = '00000004-000A-1000-8000-0026BB765291';

  //microinverter characteristics
  Characteristic.inverterPower = function () {
    Characteristic.call(this, 'Power', Characteristic.inverterPower.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'W',
      minValue: 0,
      maxValue: 10000,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.inverterPower, Characteristic);
  Characteristic.inverterPower.UUID = '00000040-000B-1000-8000-0026BB765291';

  Characteristic.inverterPowerMax = function () {
    Characteristic.call(this, 'Power Max', Characteristic.inverterPowerMax.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'W',
      minValue: 0,
      maxValue: 10000,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.inverterPowerMax, Characteristic);
  Characteristic.inverterPowerMax.UUID = '00000041-000B-1000-8000-0026BB765291';

  Characteristic.inverterProducing = function () {
    Characteristic.call(this, 'Producing', Characteristic.inverterProducing.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.inverterProducing, Characteristic);
  Characteristic.inverterProducing.UUID = '00000042-000B-1000-8000-0026BB765291';

  Characteristic.inverterCommunicating = function () {
    Characteristic.call(this, 'Communicating', Characteristic.inverterCommunicating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.inverterCommunicating, Characteristic);
  Characteristic.inverterCommunicating.UUID = '00000043-000B-1000-8000-0026BB765291';

  Characteristic.inverterProvisioned = function () {
    Characteristic.call(this, 'Provisioned', Characteristic.inverterProvisioned.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.inverterProvisioned, Characteristic);
  Characteristic.inverterProvisioned.UUID = '00000044-000B-1000-8000-0026BB765291';

  Characteristic.inverterOperating = function () {
    Characteristic.call(this, 'Operating', Characteristic.inverterOperating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.inverterOperating, Characteristic);
  Characteristic.inverterOperating.UUID = '00000045-000B-1000-8000-0026BB765291';

  Characteristic.inverterStatus = function () {
    Characteristic.call(this, 'Status', Characteristic.inverterStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.inverterStatus, Characteristic);
  Characteristic.inverterStatus.UUID = '00000046-000B-1000-8000-0026BB765291';

  Characteristic.inverterLastReportDate = function () {
    Characteristic.call(this, 'Last report', Characteristic.inverterLastReportDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.inverterLastReportDate, Characteristic);
  Characteristic.inverterLastReportDate.UUID = '00000047-000B-1000-8000-0026BB765291';

  Service.enphaseMicroinverter = function (displayName, subtype) {
    Service.call(this, displayName, Service.enphaseMicroinverter.UUID, subtype);
    this.addCharacteristic(Characteristic.inverterPower);
    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.inverterPowerMax);
    this.addOptionalCharacteristic(Characteristic.inverterProducing);
    this.addOptionalCharacteristic(Characteristic.inverterCommunicating);
    this.addOptionalCharacteristic(Characteristic.inverterProvisioned);
    this.addOptionalCharacteristic(Characteristic.inverterOperating);
    this.addOptionalCharacteristic(Characteristic.inverterStatus);
    this.addOptionalCharacteristic(Characteristic.inverterLastReportDate);
  };
  inherits(Service.enphaseMicroinverter, Service);
  Service.enphaseMicroinverter.UUID = '00000005-000A-1000-8000-0026BB765291';

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
    this.envoyUser = config.envoyUser || 'envoy';
    this.envoyPasswd = config.envoyPasswd;
    this.installerUser = config.installerUser || 'installer';
    this.installerPasswd = config.installerPasswd;
    this.refreshInterval = config.refreshInterval || 10;
    this.enchargeStorageOffset = config.enchargeStorageOffset || 0;
    this.powerProductionMaxDetected = config.powerProductionMaxDetected || 0;
    this.energyProductionLifetimeOffset = config.energyProductionLifetimeOffset || 0;
    this.powerConsumptionTotalMaxDetected = config.powerConsumptionTotalMaxDetected || 0;
    this.energyConsumptionTotalLifetimeOffset = config.energyConsumptionTotalLifetimeOffset || 0;
    this.powerConsumptionNetMaxDetected = config.powerConsumptionNetMaxDetected || 0;
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
    this.powerProductionMaxDetectedState = false;
    this.powerProduction = 0;
    this.energyProductionToday = 0;
    this.energyProductionLastSevenDays = 0;
    this.energyProductionLifetime = 0;
    this.powerConsumptionTotalMax = 0;
    this.powerConsumptionTotalMaxDetectedState = false;
    this.powerConsumptionTotal = 0;
    this.energyConsumptionTotalToday = 0;
    this.energyConsumptionTotalLastSevenDays = 0;
    this.energyConsumptionTotalLifetime = 0;
    this.powerConsumptionNetMax = 0;
    this.powerConsumptionNetMaxDetectedState = false;
    this.powerConsumptionNet = 0;
    this.energyConsumptionNetToday = 0;
    this.energyConsumptionNetLastSevenDays = 0;
    this.energyConsumptionNetLifetime = 0;
    this.qRelaysSerialNumber = new Array();
    this.qRelaysLastReportDate = new Array();
    this.qRelaysRelay = new Array();
    this.qRelaysProducing = new Array();
    this.qRelaysCommunicating = new Array();
    this.qRelaysProvisioned = new Array();
    this.qRelaysOperating = new Array();
    this.qRelaysStatus = new Array();
    this.invertersSerialNumber = new Array();
    this.invertersLastReportDate = new Array();
    this.invertersType = new Array();
    this.invertersLastPower = new Array();
    this.invertersMaxPower = new Array();
    this.invertersProducing = new Array();
    this.invertersCommunicating = new Array();
    this.invertersProvisioned = new Array();
    this.invertersOperating = new Array();
    this.invertersStatus = new Array();
    this.enchargesSerialNumber = new Array();
    this.enchargesLastReportDate = new Array();
    this.enchargesProducing = new Array();
    this.enchargesCommunicating = new Array();
    this.enchargesProvisioned = new Array();
    this.enchargesOperating = new Array();
    this.enchargesStatus = new Array();
    this.enchargesPower = new Array();
    this.enchargesEnergy = new Array();
    this.metersMeasurementType = new Array();
    this.metersState = new Array();
    this.metersPhaseMode = new Array();
    this.metersPhaseCount = new Array();
    this.metersMeteringStatus = new Array();
    this.metersStatusFlags = new Array();
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

    this.getDeviceInfo()
    //this.prepareAccessory();
  }

  async getDeviceInfo() {
    var me = this;
    me.log.debug('Device: %s %s, requesting config information.', me.host, me.name);
    try {
      const [response, response1, response2] = await axios.all([axios.get(me.url + INVENTORY_URL), axios.get(me.url + INFO_URL), axios.get(me.url + METERS_URL)]);
      me.log.info('Device: %s %s, state: Online.', me.host, me.name);
      me.log.debug('Device %s %s, get device status data response %s response1: %s', me.host, me.name, response.data, response1.data);
      const result = await parseStringPromise(response1.data);
      me.log.debug('Device: %s %s, get Device info.xml successful: %s', me.host, me.name, JSON.stringify(result, null, 2));
      if (typeof result.envoy_info.device !== 'undefined') {
        var serialNumber = result.envoy_info.device[0].sn[0];
        var firmwareRevision = result.envoy_info.device[0].software[0];
        var inverters = response.data[0].devices.length;
        var encharge = response.data[1].devices.length;
        var qrelays = response.data[2].devices.length;
        var meters = response2.data.length;
        me.log('-------- %s --------', me.name);
        me.log('Manufacturer: %s', me.manufacturer);
        me.log('Model: %s', me.modelName);
        me.log('Serialnr: %s', serialNumber);
        me.log('Firmware: %s', firmwareRevision);
        me.log('Inverters: %s', inverters);
        me.log('Encharges: %s', encharge);
        me.log('Q-Relays: %s', qrelays);
        me.log('Meters: %s', meters);
        me.log('----------------------------------');
        me.serialNumber = serialNumber;
        me.firmwareRevision = firmwareRevision;
        me.invertersCount = inverters;
        me.enchargesCount = encharge;
        me.qrelaysCount = qrelays;
        me.metersCount = meters;
        me.updateDeviceState();
      }
    } catch (error) {
      me.log.error('Device: %s %s, getProduction eror: %s, state: Offline', me.host, me.name, error);
      me.checkDeviceInfo = true;
    };
  }

  async updateDeviceState() {
    var me = this;
    try {
      var productionUrl = me.meterProductionState ? me.url + PRODUCTION_CT_URL : me.url + PRODUCTION_SUMM_INVERTERS_URL;
      const [production, productionCT] = await axios.all([axios.get(productionUrl), axios.get(me.url + PRODUCTION_CT_URL)]);
      me.log.debug('Device %s %s, get device status data: %s, data1 %s', me.host, me.name, production.data, productionCT.data);

      //production
      var powerProduction = me.meterProductionState ? parseFloat(production.data.production[1].wNow / 1000) : parseFloat(production.data.wattsNow / 1000);

      //save and read powerProductionMax
      try {
        var savedPowerProductionMax = await fsPromises.readFile(me.powerProductionMaxFile);
      } catch (error) {
        me.log.debug('Device: %s %s, powerProductionMaxFile file does not exist', me.host, me.name);
      }

      var powerProductionMax = 0;
      if (savedPowerProductionMax) {
        powerProductionMax = parseFloat(savedPowerProductionMax);
      }

      if (powerProduction > powerProductionMax) {
        var powerProductionMaxf = powerProduction.toString();
        try {
          await fsPromises.writeFile(me.powerProductionMaxFile, powerProductionMaxf);
          me.log.debug('Device: %s %s, powerProductionMaxFile saved successful in: %s %s kW', me.host, me.name, me.prefDir, powerProduction);
        } catch (error) {
          me.log.error('Device: %s %s, could not write powerProductionMaxFile, error: %s', me.host, me.name, error);

        }
      }

      var powerProductionMaxDetectedState = (powerProduction >= me.powerProductionMaxDetected / 1000);
      me.powerProductionMax = powerProductionMax;
      me.powerProductionMaxDetectedState = powerProductionMaxDetectedState;

      var energyProductionToday = me.meterProductionState ? parseFloat(production.data.production[1].whToday / 1000) : parseFloat(production.data.wattHoursToday / 1000);
      var energyProductionLastSevenDays = me.meterProductionState ? parseFloat(production.data.production[1].whLastSevenDays / 1000) : parseFloat(production.data.wattHoursSevenDays / 1000);
      var energyProductionLifetime = me.meterProductionState ? parseFloat((production.data.production[1].whLifetime + me.energyProductionLifetimeOffset) / 1000) : parseFloat(production.data.wattHoursLifetime / 1000);
      me.log.debug('Device: %s %s, power production: %s kW', me.host, me.name, powerProduction);
      me.log.debug('Device: %s %s, power production max: %s kW', me.host, me.name, powerProductionMax);
      me.log.debug('Device: %s %s, power production max detected: %s', me.host, me.name, powerProductionMaxDetectedState ? 'Yes' : 'No');
      me.log.debug('Device: %s %s, energy production Today: %s kWh', me.host, me.name, energyProductionToday);
      me.log.debug('Device: %s %s, energy production last 7 Days: %s kWh', me.host, me.name, energyProductionLastSevenDays);
      me.log.debug('Device: %s %s, energy production Lifetime: %s kWh', me.host, me.name, energyProductionLifetime);
      me.powerProduction = powerProduction;
      me.energyProductionToday = energyProductionToday;
      me.energyProductionLastSevenDays = energyProductionLastSevenDays;
      me.energyProductionLifetime = energyProductionLifetime;
      me.powerProductionMaxDetectedState = powerProductionMaxDetectedState;

      if (me.envoyServiceProduction && production != 'undefined') {
        me.envoyServiceProduction.updateCharacteristic(Characteristic.Power, powerProduction);
        me.envoyServiceProduction.updateCharacteristic(Characteristic.PowerMax, powerProductionMax);
        me.envoyServiceProduction.updateCharacteristic(Characteristic.PowerMaxDetected, powerProductionMaxDetectedState);
        me.envoyServiceProduction.updateCharacteristic(Characteristic.EnergyToday, energyProductionToday);
        me.envoyServiceProduction.updateCharacteristic(Characteristic.EnergyLastSevenDays, energyProductionLastSevenDays);
        me.envoyServiceProduction.updateCharacteristic(Characteristic.EnergyLifetime, energyProductionLifetime);
      }

      //consumption total
      if (me.metersMeasurementType.indexOf('net-consumption') || me.metersMeasurementType.indexOf('total-consumption')) {
        var powerConsumptionTotal = parseFloat(productionCT.data.consumption[0].wNow / 1000);

        //save and read powerConsumptionTotalMax
        try {
          var savedPowerConsumptionTotalMax = await fsPromises.readFile(me.powerConsumptionTotalMaxFile);
        } catch (error) {
          me.log.debug('Device: %s %s, powerConsumptionTotalMaxFile file does not exist', me.host, me.name);
        }

        var powerConsumptionTotalMax = 0;
        if (savedPowerConsumptionTotalMax) {
          powerConsumptionTotalMax = parseFloat(savedPowerConsumptionTotalMax);
        }

        if (powerConsumptionTotal > powerConsumptionTotalMax) {
          var powerConsumptionTotalMaxf = powerConsumptionTotal.toString();
          try {
            await fsPromises.writeFile(me.powerConsumptionTotalMaxFile, powerConsumptionTotalMaxf);
            me.log.debug('Device: %s %s, powerConsumptionTotalMaxFile saved successful in: %s %s kW', me.host, me.name, me.prefDir, powerConsumptionTotal);
          } catch (error) {
            me.log.error('Device: %s %s, could not write powerConsumptionTotalMaxFile, error: %s', me.host, me.name, error);
          }
        }

        var powerConsumptionTotalMaxDetectedState = (powerConsumptionTotal >= me.powerConsumptionTotalMaxDetected / 1000);
        me.powerConsumptionTotalMax = powerConsumptionTotalMax;
        me.powerConsumptionTotalMaxDetectedState = powerConsumptionTotalMaxDetectedState;

        var energyConsumptionTotalToday = parseFloat(productionCT.data.consumption[0].whToday / 1000);
        var energyConsumptionTotalLastSevenDays = parseFloat(productionCT.data.consumption[0].whLastSevenDays / 1000);
        var energyConsumptionTotalLifetime = parseFloat((productionCT.data.consumption[0].whLifetime + me.energyConsumptionTotalLifetimeOffset) / 1000);
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

        if (me.envoyServiceConsumptionTotal && productionCT != 'undefined') {
          me.envoyServiceConsumptionTotal.updateCharacteristic(Characteristic.Power, powerConsumptionTotal);
          me.envoyServiceConsumptionTotal.updateCharacteristic(Characteristic.PowerMax, powerConsumptionTotalMax);
          me.envoyServiceConsumptionTotal.updateCharacteristic(Characteristic.PowerMaxDetected, powerConsumptionTotalMaxDetectedState);
          me.envoyServiceConsumptionTotal.updateCharacteristic(Characteristic.EnergyToday, energyConsumptionTotalToday);
          me.envoyServiceConsumptionTotal.updateCharacteristic(Characteristic.EnergyLastSevenDays, energyConsumptionTotalLastSevenDays);
          me.envoyServiceConsumptionTotal.updateCharacteristic(Characteristic.EnergyLifetime, energyConsumptionTotalLifetime);
        }
      }

      //consumption net
      if (me.metersMeasurementType.indexOf('net-consumption')) {
        var powerConsumptionNet = parseFloat(productionCT.data.consumption[1].wNow / 1000);

        //save and read powerConsumptionNetMax
        try {
          var savedPowerConsumptionNetMax = await fsPromises.readFile(me.powerConsumptionNetMaxFile);
        } catch (error) {
          me.log.debug('Device: %s %s, powerConsumptionNetMaxFile file does not exist', me.host, me.name);
        }

        var powerConsumptionNetMax = 0;
        if (savedPowerConsumptionNetMax) {
          powerConsumptionNetMax = parseFloat(savedPowerConsumptionNetMax);
        }

        if (powerConsumptionNet > powerConsumptionNetMax) {
          var powerConsumptionNetMaxf = powerConsumptionNet.toString();
          try {
            await fsPromises.writeFile(me.powerConsumptionNetMaxFile, powerConsumptionNetMaxf);
            me.log.debug('Device: %s %s, powerConsumptionNetMaxFile saved successful in: %s %s kW', me.host, me.name, me.prefDir, powerConsumptionNet);
          } catch (error) {
            me.log.error('Device: %s %s, could not write powerConsumptionNetMaxFile, error: %s', me.host, me.name, error);
          }
        }

        var powerConsumptionNetMaxDetectedState = (powerConsumptionNet >= me.powerConsumptionNetMaxDetected / 1000);
        me.powerConsumptionNetMax = powerConsumptionNetMax;
        me.powerConsumptionNetMaxDetectedState = powerConsumptionNetMaxDetectedState;

        var energyConsumptionNetToday = parseFloat(productionCT.data.consumption[1].whToday / 1000);
        var energyConsumptionNetLastSevenDays = parseFloat(productionCT.data.consumption[1].whLastSevenDays / 1000);
        var energyConsumptionNetLifetime = parseFloat((productionCT.data.consumption[1].whLifetime + me.energyConsumptionNetLifetimeOffset) / 1000);
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

        if (me.envoyServiceConsumptionNet && productionCT != 'undefined') {
          me.envoyServiceConsumptionNet.updateCharacteristic(Characteristic.Power, powerConsumptionNet);
          me.envoyServiceConsumptionNet.updateCharacteristic(Characteristic.PowerMax, powerConsumptionNetMax);
          me.envoyServiceConsumptionNet.updateCharacteristic(Characteristic.PowerMaxDetected, powerConsumptionNetMaxDetectedState);
          me.envoyServiceConsumptionNet.updateCharacteristic(Characteristic.EnergyToday, energyConsumptionNetToday);
          me.envoyServiceConsumptionNet.updateCharacteristic(Characteristic.EnergyLastSevenDays, energyConsumptionNetLastSevenDays);
          me.envoyServiceConsumptionNet.updateCharacteristic(Characteristic.EnergyLifetime, energyConsumptionNetLifetime);
        }
      }

      //qrelays
      const inventory = await axios.get(me.url + INVENTORY_URL);
      if (me.qrelaysCount >= 1 && inventory.data !== 'undefined') {
        for (let i = 0; i < me.qrelaysCount; i++) {
          var serialNumber = inventory.data[2].devices[i].serial_num;
          var lastrptdate = inventory.data[2].devices[i].last_rpt_date;
          var relay = inventory.data[2].devices[i].relay;
          var producing = inventory.data[2].devices[i].producing;
          var communicating = inventory.data[2].devices[i].communicating;
          var provisioned = inventory.data[2].devices[i].provisioned;
          var operating = inventory.data[2].devices[i].operating;
          var code = inventory.data[2].devices[i].device_status;
          if (Array.isArray(code) && code.length === 1) {
            var code1 = code[0];
            var indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
            var status = ENVOY_STATUS_CODE_1[indexCode1];
          } else if (Array.isArray(code) && code.length === 2) {
            var code1 = code[0];
            var indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
            var status1 = ENVOY_STATUS_CODE_1[indexCode1];
            var code2 = code[1];
            var indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
            var status2 = ENVOY_STATUS_CODE_1[indexCode2];
            var status = status1 + ' / ' + status2;
          } else {
            var status = 'Status not available';
          }
          //status = ENVOY_STATUS_CODE.status;
          //   var linecount = inventory.data[2].devices[i].line-count;
          //   var line1connected = inventory.data[2].devices[i].line1-connectedt ? 'Closed' : 'Open';
          //   var line2connected = inventory.data[2].devices[i].line2-connectedt ? 'Closed' : 'Open';
          //   var line3connected = inventory.data[2].devices[i].line3-connectedt ? 'Closed' : 'Open';
          me.log.debug('Q-Relay: %s', serialNumber);
          me.log.debug('Relay: %s', relay ? 'Closed' : 'Open');
          me.log.debug('Producing: %s', producing ? 'Yes' : 'No');
          me.log.debug('Communicating: %s', communicating ? 'Yes' : 'No');
          me.log.debug('Provisioned: %s', provisioned ? 'Yes' : 'No');
          me.log.debug('Operating: %s', operating ? 'Yes' : 'No');
          me.log.debug('Status: %s', status ? 'Yes' : 'No');
          me.log.debug('Last report: %s', lastrptdate);
          //me.log('Line count: %s', linecount);
          // me.log('Line 1: %s', line1connected);
          // me.log('Line 2: %s', line2connected);
          // me.log('Line 3: %s', line3connected);
          me.log.debug('----------------------------------');
          me.qRelaysSerialNumber.push(serialNumber);
          me.qRelaysRelay.push(relay);
          me.qRelaysProducing.push(producing);
          me.qRelaysCommunicating.push(communicating);
          me.qRelaysProvisioned.push(provisioned);
          me.qRelaysOperating.push(operating);
          me.qRelaysStatus.push(status);
          me.qRelaysRelay.push(relay);
          me.qRelaysLastReportDate.push(lastrptdate);
          //me.qRelaysLinecount = linecount;
          //me.qRelaysLine1connected = line1connected;
          //me.qRelaysLine2connected = line2connected;
          //me.qRelaysLine3connected = line3connected;
        }
      }

      //meters
      const meters = await axios.get(me.url + METERS_URL);
      if (me.metersCount >= 1 && meters.data !== 'undefined') {
        for (let i = 0; i < me.metersCount; i++) {
          var state = meters.data[i].state;
          var measurementType = meters.data[i].measurementType;
          var phaseMode = meters.data[i].phaseMode;
          var phaseCount = meters.data[i].phaseCount;
          var meteringStatus = meters.data[i].meteringStatus;
          var code = meters.data[i].statusFlags;
          if (Array.isArray(code) && code.length === 1) {
            var code1 = code[0];
            var indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
            var status = ENVOY_STATUS_CODE_1[indexCode1];
          } else if (Array.isArray(code) && code.length === 2) {
            var code1 = code[0];
            var indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
            var status1 = ENVOY_STATUS_CODE_1[indexCode1];
            var code2 = code[1];
            var indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
            var status2 = ENVOY_STATUS_CODE_1[indexCode2];
            var status = status1 + ' / ' + status2;
          } else {
            var status = 'Status not available';
          }
          me.log.debug('Meter: %s', measurementType);
          me.log.debug('State: %s', state);
          me.log.debug('Phase mode: %s', phaseMode);
          me.log.debug('Phase count: %s', phaseCount);
          me.log.debug('Metering status: %s', meteringStatus);
          me.log.debug('Status flag: %s', status);
          me.log.debug('----------------------------------');
          me.metersState.push(state);
          me.metersMeasurementType.push(measurementType);
          me.metersPhaseMode.push(phaseMode);
          me.metersPhaseCount.push(phaseCount);
          me.metersMeteringStatus.push(meteringStatus);
          me.metersStatusFlags.push(status);
        }
      }

      //encharge storage
      if (me.enchargesCount > 0 && inventory.data !== 'undefined') {
        for (let i = 0; i < me.enchargesCount; i++) {
          var serialNumber = inventory.data[1].devices[i].serial_num;
          var lastrptdate = inventory.data[1].devices[i].last_rpt_date;
          var producing = inventory.data[1].devices[i].producing;
          var communicating = inventory.data[1].devices[i].communicating;
          var provisioned = inventory.data[1].devices[i].provisioned;
          var operating = inventory.data[1].devices[i].operating;
          var code = inventory.data[1].devices[i].device_status;
          if (Array.isArray(code) && code.length === 1) {
            var code1 = code[0];
            var indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
            var status = ENVOY_STATUS_CODE_1[indexCode1];
          } else if (Array.isArray(code) && code.length === 2) {
            var code1 = code[0];
            var indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
            var status1 = ENVOY_STATUS_CODE_1[indexCode1];
            var code2 = code[1];
            var indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
            var status2 = ENVOY_STATUS_CODE_1[indexCode2];
            var status = status1 + ' / ' + status2;
          } else {
            var status = 'Status not available';
          }
          var powerEnchargeStorage = parseFloat(productionCT.data.storage[i].wNow / 1000);
          var energyEnchargeStorage = parseFloat(productionCT.data.storage[i].whNow + me.enchargeStorageOffset / 1000);
          me.log.debug('Encharge %s: %s', i, serialNumber);
          me.log.debug('Producing: %s', producing ? 'Yes' : 'No');
          me.log.debug('Communicating: %s', communicating ? 'Yes' : 'No');
          me.log.debug('Provisioned: %s', provisioned ? 'Yes' : 'No');
          me.log.debug('Operating: %s', operating ? 'Yes' : 'No');
          me.log.debug('Status: %s', status);
          me.log.debug('Power: %s kW', me.host, me.name, powerEnchargeStorage);
          me.log.debug('Energy: %s kWh', me.host, me.name, energyEnchargeStorage);
          me.log.debug('Last report: %s', lastrptdate);
          me.log.debug('----------------------------------');
          me.enchargesSerialNumber.push(serialNumber);
          me.enchargesProducing.push(producing);
          me.enchargesCommunicating.push(communicating);
          me.enchargesProvisioned.push(provisioned);
          me.enchargesOperating.push(operating);
          me.enchargesStatus.push(status);
          me.enchargesPower.push(powerEnchargeStorage);
          me.enchargesEnergy.push(energyEnchargeStorage);
          me.enchargesLastReportDate.push(lastrptdate);

          if (me.envoyServiceEnchargeStorage) {
            me.envoyServiceEnchargeStorage.updateCharacteristic(Characteristic.Power, powerEnchargeStorage);
            me.envoyServiceEnchargeStorage.updateCharacteristic(Characteristic.EnergyToday, energyEnchargeStorage);
          }
        }
      }

      //microinverters power
      if (me.invertersCount > 0 && inventory.data !== 'undefined') {
        for (let i = 0; i < me.invertersCount; i++) {
          var serialNumber = inventory.data[0].devices[i].serial_num;
          var lastrptdate = inventory.data[0].devices[i].last_rpt_date;
          var producing = inventory.data[0].devices[i].producing;
          var communicating = inventory.data[0].devices[i].communicating;
          var provisioned = inventory.data[0].devices[i].provisioned;
          var operating = inventory.data[0].devices[i].operating;
          var code = inventory.data[0].devices[i].device_status;
          if (Array.isArray(code) && code.length === 1) {
            var code1 = code[0];
            var indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
            var status = ENVOY_STATUS_CODE_1[indexCode1];
          } else if (Array.isArray(code) && code.length === 2) {
            var code1 = code[0];
            var indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
            var status1 = ENVOY_STATUS_CODE_1[indexCode1];
            var code2 = code[1];
            var indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
            var status2 = ENVOY_STATUS_CODE_1[indexCode2];
            var status = status1 + ' / ' + status2;
          } else {
            var status = 'Status not available';
          }
          me.log.debug('Inverter %s: %s', i, serialNumber);
          me.log.debug('Producing: %s', producing ? 'Yes' : 'No');
          me.log.debug('Communicating: %s', communicating ? 'Yes' : 'No');
          me.log.debug('Provisioned: %s', provisioned ? 'Yes' : 'No');
          me.log.debug('Operating: %s', operating ? 'Yes' : 'No');
          me.log.debug('Status: %s', status);
          me.log.debug('Last report: %s', lastrptdate);
          me.log.debug('----------------------------------');
          me.invertersSerialNumber.push(serialNumber);
          me.invertersProducing.push(producing);
          me.invertersCommunicating.push(communicating);
          me.invertersProvisioned.push(provisioned);
          me.invertersOperating.push(operating);
          me.invertersStatus.push(status);
          me.invertersLastReportDate.push(lastrptdate);
        };

        const auth = me.envoyUser + ':' + me.envoyPasswd;
        const url = me.url + PRODUCTION_INVERTERS_URL;
        const options = {
          method: 'GET',
          rejectUnauthorized: false,
          digestAuth: auth,
          headers: {
            'Content-Type': 'application/json'
          }
        };
        const output = (err, data, res) => {
          if (err) {
            me.log.error(err);
          }
          const invertersData = JSON.parse(data);
          var invertersCount = invertersData.length;
          if (me.invertersCount > 0) {
            for (let i = 0; i < me.invertersCount; i++) {
              //var search = me.invertersSerialNumber[i];
              //var position = (invertersData[i].serialNumber).indexOf(search);
              //me.log.info('dane', i, search, position)
              var inverterLastReportDate = invertersData[i].lastReportDate;
              var inverterType = invertersData[i].devType;
              var inverterLastPower = parseFloat(invertersData[i].lastReportWatts);
              var inverterMaxPower = parseFloat(invertersData[i].maxReportWatts);
              me.log.debug('Device: %s %s, last inverter: %s power: %s W', me.host, me.name, me.invertersSerialNumber[i], inverterLastPower);
              me.log.debug('Device: %s %s, max inverter: %s power: %s W', me.host, me.name, me.invertersSerialNumber[i], inverterMaxPower);
              me.invertersLastReportDate.push(inverterLastReportDate);
              me.invertersType.push(inverterType);
              me.invertersLastPower.push(inverterLastPower);
              me.invertersMaxPower.push(inverterMaxPower);

              if (me.envoyServiceInverter) {
                me.envoyServiceInverter.updateCharacteristic(Characteristic.inverterPower, inverterLastPower);
                me.envoyServiceInverter.updateCharacteristic(Characteristic.inverterPowerMax, inverterMaxPower);
              }
            }
          }
        }
        http.request(url, options, output);
      }
      if (!me.checkDeviceState) {
        me.prepareAccessory();
      }
      me.checkDeviceState = true;
    } catch (error) {
      me.log.error('Device: %s %s, update Device state error: %s, state: Offline', me.host, me.name, error);
    }
  }

  //Prepare accessory
  prepareAccessory() {
    this.log.debug('prepareAccessory');
    const accessoryName = this.name;
    const accessoryUUID = UUID.generate(accessoryName);
    const accessoryCategory = Categories.OTHER;
    this.accessory = new Accessory(accessoryName, accessoryUUID, accessoryCategory);

    this.prepareInformationService();
    this.prepareEnvoyService();

    this.log.debug('Device: %s %s, publishExternalAccessories.', this.host, accessoryName);
    this.api.publishExternalAccessories(PLUGIN_NAME, [this.accessory]);
  }

  //Prepare information service
  prepareInformationService() {
    this.log.debug('prepareInformationService');

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
      .on('get', (callback) => {
        let value = this.powerProduction;
        this.log.info('Device: %s %s, power production : %s kW', this.host, this.name, value.toFixed(3));
        callback(null, value);
      });
    this.envoyServiceProduction.getCharacteristic(Characteristic.PowerMax)
      .on('get', (callback) => {
        let value = this.powerProductionMax;
        this.log.info('Device: %s %s, power production  max: %s kW', this.host, this.name, value.toFixed(3));
        callback(null, value);
      });
    this.envoyServiceProduction.getCharacteristic(Characteristic.PowerMaxDetected)
      .on('get', (callback) => {
        let value = this.powerProductionMaxDetectedState;
        this.log.info('Device: %s %s, power production  max detected: %s', this.host, this.name, value ? 'Yes' : 'No');
        callback(null, value);
      });
    this.envoyServiceProduction.getCharacteristic(Characteristic.EnergyToday)
      .on('get', (callback) => {
        let value = this.energyProductionToday;
        this.log.info('Device: %s %s, energy production  Today: %s kWh', this.host, this.name, value.toFixed(3));
        callback(null, value);
      });
    this.envoyServiceProduction.getCharacteristic(Characteristic.EnergyLastSevenDays)
      .on('get', (callback) => {
        let value = this.energyProductionLastSevenDays;
        this.log.info('Device: %s %s, energy production  Last Seven Days: %s kWh', this.host, this.name, value.toFixed(3));
        callback(null, value);
      });
    this.envoyServiceProduction.getCharacteristic(Characteristic.EnergyLifetime)
      .on('get', (callback) => {
        let value = this.energyProductionLifetime;
        this.log.info('Device: %s %s, energy production Lifetime: %s kWh', this.host, this.name, value.toFixed(3));
        callback(null, value);
      });
    this.accessory.addService(this.envoyServiceProduction);

    if (this.metersMeasurementType.indexOf('net-consumption') || this.metersMeasurementType.indexOf('total-consumption')) {
      this.envoyServiceConsumptionTotal = new Service.PowerMeter('Consumption Total', 'envoyServiceConsumptionTotal');
      this.envoyServiceConsumptionTotal.getCharacteristic(Characteristic.Power)
        .on('get', (callback) => {
          let value = this.powerConsumptionTotal;
          this.log.info('Device: %s %s, power consumption total: %s kW', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.envoyServiceConsumptionTotal.getCharacteristic(Characteristic.PowerMax)
        .on('get', (callback) => {
          let value = this.powerConsumptionTotalMax;
          this.log.info('Device: %s %s, power consumption total max: %s kW', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.envoyServiceConsumptionTotal.getCharacteristic(Characteristic.PowerMaxDetected)
        .on('get', (callback) => {
          let value = this.powerConsumptionTotalMaxDetectedState;
          this.log.info('Device: %s %s, power consumption total max detected: %s', this.host, this.name, value ? 'Yes' : 'No');
          callback(null, value);
        });
      this.envoyServiceConsumptionTotal.getCharacteristic(Characteristic.EnergyToday)
        .on('get', (callback) => {
          let value = this.energyConsumptionTotalToday;
          this.log.info('Device: %s %s, energy consumption total Today: %s kWh', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.envoyServiceConsumptionTotal.getCharacteristic(Characteristic.EnergyLastSevenDays)
        .on('get', (callback) => {
          let value = this.energyConsumptionTotalLastSevenDays;
          this.log.info('Device: %s %s, energy consumption total Last Seven Days: %s kWh', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.envoyServiceConsumptionTotal.getCharacteristic(Characteristic.EnergyLifetime)
        .on('get', (callback) => {
          let value = this.energyConsumptionTotalLifetime;
          this.log.info('Device: %s %s, energy consumption total Lifetime: %s kWh', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.accessory.addService(this.envoyServiceConsumptionTotal);
    }

    if (this.metersMeasurementType.indexOf('net-consumption')) {
      this.envoyServiceConsumptionNet = new Service.PowerMeter('Consumption Net', 'envoyServiceConsumptionNet');
      this.envoyServiceConsumptionNet.getCharacteristic(Characteristic.Power)
        .on('get', (callback) => {
          let value = this.powerConsumptionNet;
          this.log.info('Device: %s %s, power consumption net: %s kW', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.envoyServiceConsumptionNet.getCharacteristic(Characteristic.PowerMax)
        .on('get', (callback) => {
          let value = this.powerConsumptionNetMax;
          this.log.info('Device: %s %s, power consumption net max: %s kW', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.envoyServiceConsumptionNet.getCharacteristic(Characteristic.PowerMaxDetected)
        .on('get', (callback) => {
          let value = this.powerConsumptionNetMaxDetectedState;
          this.log.info('Device: %s %s, power consumption net max detected: %s', this.host, this.name, value ? 'Yes' : 'No');
          callback(null, value);
        });
      this.envoyServiceConsumptionNet.getCharacteristic(Characteristic.EnergyToday)
        .on('get', (callback) => {
          let value = this.energyConsumptionNetToday;
          this.log.info('Device: %s %s, energy consumption net Today: %s kWh', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.envoyServiceConsumptionNet.getCharacteristic(Characteristic.EnergyLastSevenDays)
        .on('get', (callback) => {
          let value = this.energyConsumptionNetLastSevenDays;
          this.log.info('Device: %s %s, energy consumption net Last Seven Days: %s kWh', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.envoyServiceConsumptionNet.getCharacteristic(Characteristic.EnergyLifetime)
        .on('get', (callback) => {
          let value = this.energyConsumptionNetLifetime;
          this.log.info('Device: %s %s, energy consumption net Lifetime: %s kWh', this.host, this.name, value.toFixed(3));
          callback(null, value);
        })
      this.accessory.addService(this.envoyServiceConsumptionNet);
    }

    //qrelay
    if (this.qrelaysCount > 0) {
      for (let i = 0; i < this.qrelaysCount; i++) {
        this.envoyServiceQrelay = new Service.enphaseQrelay('Q-Relay ' + this.qRelaysSerialNumber[i], 'envoyServiceQrelay' + i);
        this.envoyServiceQrelay.getCharacteristic(Characteristic.qRelayRelay)
          .on('get', (callback) => {
            let value = this.qRelaysRelay[i];
            this.log.info('Device: %s %s, qrelay: %s relay: %s', this.host, this.name, this.qRelaysSerialNumber[i], value);
            callback(null, value);
          });
        this.envoyServiceQrelay.getCharacteristic(Characteristic.qRelayProducing)
          .on('get', (callback) => {
            let value = this.qRelaysProducing[i];
            this.log.info('Device: %s %s, qrelay: %s producing: %s', this.host, this.name, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            callback(null, value);
          });
        this.envoyServiceQrelay.getCharacteristic(Characteristic.qRelayCommunicating)
          .on('get', (callback) => {
            let value = this.qRelaysCommunicating[i];
            this.log.info('Device: %s %s, qrelay: %s communicating: %s', this.host, this.name, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            callback(null, value);
          });
        this.envoyServiceQrelay.getCharacteristic(Characteristic.qRelayProvisioned)
          .on('get', (callback) => {
            let value = this.qRelaysProvisioned[i];
            this.log.info('Device: %s %s, qrelay: %s provisioned: %s', this.host, this.name, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            callback(null, value);
          });
        this.envoyServiceQrelay.getCharacteristic(Characteristic.qRelayOperating)
          .on('get', (callback) => {
            let value = this.qRelaysOperating[i];
            this.log.info('Device: %s %s, qrelay: %s operating: %s', this.host, this.name, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            callback(null, value);
          });
        this.envoyServiceQrelay.getCharacteristic(Characteristic.qRelayStatus)
          .on('get', (callback) => {
            let value = this.qRelaysStatus[i];
            if (value.length > 64) {
              value = value.substring(0, 64)
            }
            this.log.info('Device: %s %s, qrelay: %s status: %s', this.host, this.name, this.qRelaysSerialNumber[i], value);
            callback(null, value);
          });
        this.envoyServiceQrelay.getCharacteristic(Characteristic.enchargeLastReportDate)
          .on('get', (callback) => {
            let value = this.qRelaysLastReportDate[i];
            this.log.info('Device: %s %s, qrelay: %s last report: %s', this.host, this.name, this.qRelaysSerialNumber[i], value);
            callback(null, value);
          });
        this.accessory.addService(this.envoyServiceQrelay);
      }
    }

    //meters
    if (this.metersCount > 0) {
      for (let i = 0; i < this.metersCount; i++) {
        this.envoyServiceMeter = new Service.enphaseMeter('Meter ' + this.metersMeasurementType[i], 'envoyServiceMeter' + i);
        this.envoyServiceMeter.getCharacteristic(Characteristic.meterState)
          .on('get', (callback) => {
            let value = this.metersState[i];
            this.log.info('Device: %s %s, meter: %s state: %s', this.host, this.name, this.metersMeasurementType[i], value);
            callback(null, value);
          });
        this.envoyServiceMeter.getCharacteristic(Characteristic.meterPhaseMode)
          .on('get', (callback) => {
            let value = this.metersPhaseMode[i];
            this.log.info('Device: %s %s, meter: %s phase mode: %s', this.host, this.name, this.metersMeasurementType[i], value);
            callback(null, value);
          });
        this.envoyServiceMeter.getCharacteristic(Characteristic.meterPhaseCount)
          .on('get', (callback) => {
            let value = this.metersPhaseCount[i];
            this.log.info('Device: %s %s, meter: %s phase count: %s', this.host, this.name, this.metersMeasurementType[i], value);
            callback(null, value);
          });
        this.envoyServiceMeter.getCharacteristic(Characteristic.meterMeteringStatus)
          .on('get', (callback) => {
            let value = this.metersMeteringStatus[i];
            this.log.info('Device: %s %s, meter: %s metering status: %s', this.host, this.name, this.metersMeasurementType[i], value);
            if (value.length > 64) {
              value = value.substring(0, 64)
            }
            callback(null, value);
          });
        this.envoyServiceMeter.getCharacteristic(Characteristic.meterStatusFlags)
          .on('get', (callback) => {
            let value = this.metersStatusFlags[i];
            this.log.info('Device: %s %s, meter: %s status flag: %s', this.host, this.name, this.metersMeasurementType[i], value);
            callback(null, value);
          });
        this.accessory.addService(this.envoyServiceMeter);
      }
    }

    //encharge storage
    if (this.encharge > 0) {
      for (let i = 0; i < this.encharge; i++) {
        this.envoyServiceEnchargeStorage = new Service.enphaseEncharge('Encharge storage', + this.enchargesSerialNumber[i], 'envoyServiceEnchargeStorage' + i);
        this.envoyServiceEnchargeStorage.getCharacteristic(Characteristic.Power)
          .on('get', (callback) => {
            let value = this.enchargesPower[i];
            this.log.info('Device: %s %s, power encharge storage: %s kW', this.host, this.name, value.toFixed(3));
            callback(null, value);
          })
        this.envoyServiceEnchargeStorage.getCharacteristic(Characteristic.EnergyToday)
          .on('get', (callback) => {
            let value = this.enchargesPower[i];
            this.log.info('Device: %s %s, energy encharge storage: %s kWh', this.host, this.name, value.toFixed(3));
            callback(null, value);
          })
        this.envoyServiceEnchargeStorage.getCharacteristic(Characteristic.inverterProducing)
          .on('get', (callback) => {
            let value = this.enchargesProducing[i];
            this.log.info('Device: %s %s, encharge: %s producing: %s', this.host, this.name, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            callback(null, value);
          });
        this.envoyServiceEnchargeStorage.getCharacteristic(Characteristic.enchargeCommunicating)
          .on('get', (callback) => {
            let value = this.enchargesCommunicating[i];
            this.log.info('Device: %s %s, encharge: %s communicating: %s', this.host, this.name, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            callback(null, value);
          });
        this.envoyServiceEnchargeStorage.getCharacteristic(Characteristic.enchargeProvisioned)
          .on('get', (callback) => {
            let value = this.enchargesProvisioned[i];
            this.log.info('Device: %s %s, encharge: %s provisioned: %s', this.host, this.name, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            callback(null, value);
          });
        this.envoyServiceEnchargeStorage.getCharacteristic(Characteristic.enchargeOperating)
          .on('get', (callback) => {
            let value = this.enchargesOperating[i];
            this.log.info('Device: %s %s, encharge: %s operating: %s', this.host, this.name, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            callback(null, value);
          });
        this.envoyServiceEnchargeStorage.getCharacteristic(Characteristic.enchargeStatus)
          .on('get', (callback) => {
            let value = this.enchargesStatus[i];
            this.log.info('Device: %s %s, encharge: %s status: %s', this.host, this.name, this.enchargesSerialNumber[i], value);
            if (value.length > 64) {
              value = value.substring(0, 64)
            }
            callback(null, value);
          });
        this.envoyServiceEnchargeStorage.getCharacteristic(Characteristic.enchargeLastReportDate)
          .on('get', (callback) => {
            let value = this.enchargesLastReportDate[i];
            this.log.info('Device: %s %s, encharge: %s last report: %s', this.host, this.name, this.enchargesSerialNumber[i], value);
            callback(null, value);
          });
        this.accessory.addService(this.envoyServiceEnchargeStorage);
      }
    }

    //microinverter
    if (this.invertersCount > 0) {
      for (let i = 0; i < this.invertersCount; i++) {
        this.envoyServiceInverter = new Service.enphaseMicroinverter('Microinverter ' + this.invertersSerialNumber[i], 'envoyServiceInverter' + i);
        this.envoyServiceInverter.getCharacteristic(Characteristic.inverterPower)
          .on('get', (callback) => {
            let value = this.invertersLastPower[i];
            this.log.info('Device: %s %s, inverter: %s last power: %s W', this.host, this.name, this.invertersSerialNumber[i], value.toFixed(0));
            callback(null, value);
          });
        this.envoyServiceInverter.getCharacteristic(Characteristic.inverterPowerMax)
          .on('get', (callback) => {
            let value = this.invertersMaxPower[i];
            this.log.info('Device: %s %s, inverter: %s max power: %s W', this.host, this.name, this.invertersSerialNumber[i], value.toFixed(0));
            callback(null, value);
          });
        this.envoyServiceInverter.getCharacteristic(Characteristic.inverterProducing)
          .on('get', (callback) => {
            let value = this.invertersProducing[i];
            this.log.info('Device: %s %s, inverter: %s producing: %s', this.host, this.name, this.invertersSerialNumber[i], value ? 'Yes' : 'No');
            callback(null, value);
          });
        this.envoyServiceInverter.getCharacteristic(Characteristic.inverterCommunicating)
          .on('get', (callback) => {
            let value = this.invertersCommunicating[i];
            this.log.info('Device: %s %s, inverter: %s communicating: %s', this.host, this.name, this.invertersSerialNumber[i], value ? 'Yes' : 'No');
            callback(null, value);
          });
        this.envoyServiceInverter.getCharacteristic(Characteristic.inverterProvisioned)
          .on('get', (callback) => {
            let value = this.invertersProvisioned[i];
            this.log.info('Device: %s %s, inverter: %s provisioned: %s', this.host, this.name, this.invertersSerialNumber[i], value ? 'Yes' : 'No');
            callback(null, value);
          });
        this.envoyServiceInverter.getCharacteristic(Characteristic.inverterOperating)
          .on('get', (callback) => {
            let value = this.invertersOperating[i];
            this.log.info('Device: %s %s, inverter: %s operating: %s', this.host, this.name, this.invertersSerialNumber[i], value ? 'Yes' : 'No');
            callback(null, value);
          });
        this.envoyServiceInverter.getCharacteristic(Characteristic.inverterStatus)
          .on('get', (callback) => {
            let value = this.invertersStatus[i];
            this.log.info('Device: %s %s, inverter: %s status: %s', this.host, this.name, this.invertersSerialNumber[i], value);
            if (value.length > 64) {
              value = value.substring(0, 64)
            }
            callback(null, value);
          });
        this.envoyServiceInverter.getCharacteristic(Characteristic.inverterLastReportDate)
          .on('get', (callback) => {
            let value = this.invertersLastReportDate[i];
            this.log.info('Device: %s %s, inverter: %s last report: %s', this.host, this.name, this.invertersSerialNumber[i], value);
            callback(null, value);
          });
        this.accessory.addService(this.envoyServiceInverter);
      }
    }
  }
}

