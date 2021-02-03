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
const HOME_URL = '/home.json';
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
const NETWORK_INTERFACE = ['Ethernet', 'WiFi', 'Cellurar'];

const ENVOY_STATUS_CODE = ['status_not_available',
  'error.nodata', 'envoy.global.ok', 'envoy.cond_flags.acb_ctrl.bmuhardwareerror', 'envoy.cond_flags.acb_ctrl.bmuimageerror', 'envoy.cond_flags.acb_ctrl.bmumaxcurrentwarning', 'envoy.cond_flags.acb_ctrl.bmusenseerror', 'envoy.cond_flags.acb_ctrl.cellmaxtemperror',
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

  //Envoy production/consumption characteristics
  Characteristic.enphasePower = function () {
    Characteristic.call(this, 'Power', Characteristic.enphasePower.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kW',
      minValue: -100000,
      maxValue: 100000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphasePower, Characteristic);
  Characteristic.enphasePower.UUID = '00000001-000B-1000-8000-0026BB765291';

  Characteristic.enphasePowerMax = function () {
    Characteristic.call(this, 'Power max', Characteristic.enphasePowerMax.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kW',
      minValue: -100000,
      maxValue: 100000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphasePowerMax, Characteristic);
  Characteristic.enphasePowerMax.UUID = '00000002-000B-1000-8000-0026BB765291';

  Characteristic.enphasePowerMaxDetected = function () {
    Characteristic.call(this, 'Power max detected', Characteristic.enphasePowerMaxDetected.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphasePowerMaxDetected, Characteristic);
  Characteristic.enphasePowerMaxDetected.UUID = '00000003-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnergyToday = function () {
    Characteristic.call(this, 'Energy today', Characteristic.enphaseEnergyToday.UUID);
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
  inherits(Characteristic.enphaseEnergyToday, Characteristic);
  Characteristic.enphaseEnergyToday.UUID = '00000004-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnergyLastSevenDays = function () {
    Characteristic.call(this, 'Energy last 7 days', Characteristic.enphaseEnergyLastSevenDays.UUID);
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
  inherits(Characteristic.enphaseEnergyLastSevenDays, Characteristic);
  Characteristic.enphaseEnergyLastSevenDays.UUID = '00000005-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnergyLifetime = function () {
    Characteristic.call(this, 'Energy Lifetime', Characteristic.enphaseEnergyLifetime.UUID);
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
  inherits(Characteristic.enphaseEnergyLifetime, Characteristic);
  Characteristic.enphaseEnergyLifetime.UUID = '00000006-000B-1000-8000-0026BB765291';

  Characteristic.enphaseLastReportDate = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseLastReportDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseLastReportDate, Characteristic);
  Characteristic.enphaseLastReportDate.UUID = '00000007-000B-1000-8000-0026BB765291';

  //power production service
  Service.enphaseMeter = function (displayName, subtype) {
    Service.call(this, displayName, Service.enphaseMeter.UUID, subtype);
    // Mandatory Characteristics
    this.addCharacteristic(Characteristic.enphasePower);
    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.enphasePowerMax);
    this.addOptionalCharacteristic(Characteristic.enphasePowerMaxDetected);
    this.addOptionalCharacteristic(Characteristic.enphaseEnergyToday);
    this.addOptionalCharacteristic(Characteristic.enphaseEnergyLastSevenDays);
    this.addOptionalCharacteristic(Characteristic.enphaseEnergyLifetime);
    this.addOptionalCharacteristic(Characteristic.enphaseLastReportDate);
  };
  inherits(Service.enphaseMeter, Service);
  Service.enphaseMeter.UUID = '00000001-000A-1000-8000-0026BB765291';

  //Envoy
  Characteristic.enphaseEnvoyAllerts = function () {
    Characteristic.call(this, 'Allerts', Characteristic.enphaseEnvoyAllerts.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyAllerts, Characteristic);
  Characteristic.enphaseEnvoyAllerts.UUID = '00000010-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyDbSize = function () {
    Characteristic.call(this, 'DB size', Characteristic.enphaseEnvoyDbSize.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyDbSize, Characteristic);
  Characteristic.enphaseEnvoyDbSize.UUID = '00000011-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyTariff = function () {
    Characteristic.call(this, 'Tariff', Characteristic.enphaseEnvoyTariff.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyTariff, Characteristic);
  Characteristic.enphaseEnvoyTariff.UUID = '00000012-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyPrimaryInterface = function () {
    Characteristic.call(this, 'Network interface', Characteristic.enphaseEnvoyPrimaryInterface.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyPrimaryInterface, Characteristic);
  Characteristic.enphaseEnvoyPrimaryInterface.UUID = '00000013-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyNetworkWebComm = function () {
    Characteristic.call(this, 'Web communication', Characteristic.enphaseEnvoyNetworkWebComm.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyNetworkWebComm, Characteristic);
  Characteristic.enphaseEnvoyNetworkWebComm.UUID = '00000014-000B-1000-8000-0026BB765291';


  Characteristic.enphaseEnvoyEverReportedToEnlighten = function () {
    Characteristic.call(this, 'Report to Enlighten', Characteristic.enphaseEnvoyEverReportedToEnlighten.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyEverReportedToEnlighten, Characteristic);
  Characteristic.enphaseEnvoyEverReportedToEnlighten.UUID = '00000015-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCommNumAndLevel = function () {
    Characteristic.call(this, 'Devices comm num. / level', Characteristic.enphaseEnvoyCommNumAndLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCommNumAndLevel, Characteristic);
  Characteristic.enphaseEnvoyCommNumAndLevel.UUID = '00000016-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCommNumPcuAndLevel = function () {
    Characteristic.call(this, 'Microinverters comm. / level', Characteristic.enphaseEnvoyCommNumPcuAndLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCommNumPcuAndLevel, Characteristic);
  Characteristic.enphaseEnvoyCommNumPcuAndLevel.UUID = '00000017-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCommNumAcbAndLevel = function () {
    Characteristic.call(this, 'Encharges comm. / level', Characteristic.enphaseEnvoyCommNumAcbAndLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCommNumAcbAndLevel, Characteristic);
  Characteristic.enphaseEnvoyCommNumAcbAndLevel.UUID = '00000018-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCommNsrbNumAndLevel = function () {
    Characteristic.call(this, 'Q-Relays comm. / level', Characteristic.enphaseEnvoyCommNsrbNumAndLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCommNsrbNumAndLevel, Characteristic);
  Characteristic.enphaseEnvoyCommNsrbNumAndLevel.UUID = '00000019-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyUpdateStatus = function () {
    Characteristic.call(this, 'Update status', Characteristic.enphaseEnvoyUpdateStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyUpdateStatus, Characteristic);
  Characteristic.enphaseEnvoyUpdateStatus.UUID = '00000020-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyTimeZone = function () {
    Characteristic.call(this, 'Time Zone', Characteristic.enphaseEnvoyTimeZone.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyTimeZone, Characteristic);
  Characteristic.enphaseEnvoyTimeZone.UUID = '00000021-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCurrentDateTime = function () {
    Characteristic.call(this, 'Local time', Characteristic.enphaseEnvoyCurrentDateTime.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCurrentDateTime, Characteristic);
  Characteristic.enphaseEnvoyCurrentDateTime.UUID = '00000022-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyLastEnlightenReporTime = function () {
    Characteristic.call(this, 'Last report to Enlighten', Characteristic.enphaseEnvoyLastEnlightenReporTime.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyLastEnlightenReporTime, Characteristic);
  Characteristic.enphaseEnvoyLastEnlightenReporTime.UUID = '00000023-000B-1000-8000-0026BB765291';

  //power production service
  Service.enphaseDeviceEnvoy = function (displayName, subtype) {
    Service.call(this, displayName, Service.enphaseDeviceEnvoy.UUID, subtype);
    // Mandatory Characteristics
    this.addCharacteristic(Characteristic.enphaseEnvoyAllerts);
    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyDbSize);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyTariff);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCommNsrbNumAndLevel);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyUpdateStatus);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyTimeZone);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporTime);
  };
  inherits(Service.enphaseDeviceEnvoy, Service);
  Service.enphaseDeviceEnvoy.UUID = '00000002-000A-1000-8000-0026BB765291';

  //Q-Relay
  Characteristic.enphaseQrelayState = function () {
    Characteristic.call(this, 'Relay', Characteristic.enphaseQrelayState.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayState, Characteristic);
  Characteristic.enphaseQrelayState.UUID = '00000031-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayProducing = function () {
    Characteristic.call(this, 'Producing', Characteristic.enphaseQrelayProducing.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayProducing, Characteristic);
  Characteristic.enphaseQrelayProducing.UUID = '00000032-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayCommunicating = function () {
    Characteristic.call(this, 'Communicating', Characteristic.enphaseQrelayCommunicating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayCommunicating, Characteristic);
  Characteristic.enphaseQrelayCommunicating.UUID = '00000033-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayProvisioned = function () {
    Characteristic.call(this, 'Provisioned', Characteristic.enphaseQrelayProvisioned.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayProvisioned, Characteristic);
  Characteristic.enphaseQrelayProvisioned.UUID = '00000034-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayOperating = function () {
    Characteristic.call(this, 'Operating', Characteristic.enphaseQrelayOperating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayOperating, Characteristic);
  Characteristic.enphaseQrelayOperating.UUID = '00000035-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayStatus = function () {
    Characteristic.call(this, 'Status', Characteristic.enphaseQrelayStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayStatus, Characteristic);
  Characteristic.enphaseQrelayStatus.UUID = '00000036-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayFirmware = function () {
    Characteristic.call(this, 'Firmware', Characteristic.enphaseQrelayFirmware.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayFirmware, Characteristic);
  Characteristic.enphaseQrelayFirmware.UUID = '00000037-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayLastReportDate = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseQrelayLastReportDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayLastReportDate, Characteristic);
  Characteristic.enphaseQrelayLastReportDate.UUID = '00000038-000B-1000-8000-0026BB765291';

  //qrelay service
  Service.enphaseDeviceQrelay = function (displayName, subtype) {
    Service.call(this, displayName, Service.enphaseDeviceQrelay.UUID, subtype);
    // Mandatory Characteristics
    this.addCharacteristic(Characteristic.enphaseQrelayState);
    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.enphaseQrelayProducing);
    this.addOptionalCharacteristic(Characteristic.enphaseQrelayCommunicating);
    this.addOptionalCharacteristic(Characteristic.enphaseQrelayProvisioned);
    this.addOptionalCharacteristic(Characteristic.enphaseQrelayOperating);
    this.addOptionalCharacteristic(Characteristic.enphaseQrelayStatus);
    this.addOptionalCharacteristic(Characteristic.enphaseQrelayFirmware);
    this.addOptionalCharacteristic(Characteristic.enphaseQrelayLastReportDate);
  };
  inherits(Service.enphaseDeviceQrelay, Service);
  Service.enphaseDeviceQrelay.UUID = '00000003-000A-1000-8000-0026BB765291';

  //enphase current meters
  Characteristic.enphaseDeviceMetersState = function () {
    Characteristic.call(this, 'Status', Characteristic.enphaseDeviceMetersState.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseDeviceMetersState, Characteristic);
  Characteristic.enphaseDeviceMetersState.UUID = '00000041-000B-1000-8000-0026BB765291';

  Characteristic.enphaseDeviceMetersMeasurementType = function () {
    Characteristic.call(this, 'Phase mode', Characteristic.enphaseDeviceMetersMeasurementType.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseDeviceMetersMeasurementType, Characteristic);
  Characteristic.enphaseDeviceMetersMeasurementType.UUID = '00000042-000B-1000-8000-0026BB765291';

  Characteristic.enphaseDeviceMetersPhaseMode = function () {
    Characteristic.call(this, 'Phase mode', Characteristic.enphaseDeviceMetersPhaseMode.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseDeviceMetersPhaseMode, Characteristic);
  Characteristic.enphaseDeviceMetersPhaseMode.UUID = '00000043-000B-1000-8000-0026BB765291';

  Characteristic.enphaseDeviceMetersPhaseCount = function () {
    Characteristic.call(this, 'Phase count', Characteristic.enphaseDeviceMetersPhaseCount.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseDeviceMetersPhaseCount, Characteristic);
  Characteristic.enphaseDeviceMetersPhaseCount.UUID = '00000044-000B-1000-8000-0026BB765291';

  Characteristic.enphaseDeviceMetersMeteringStatus = function () {
    Characteristic.call(this, 'Metering status', Characteristic.enphaseDeviceMetersMeteringStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseDeviceMetersMeteringStatus, Characteristic);
  Characteristic.enphaseDeviceMetersMeteringStatus.UUID = '00000045-000B-1000-8000-0026BB765291';

  Characteristic.enphaseDeviceMetersStatusFlags = function () {
    Characteristic.call(this, 'Status flag', Characteristic.enphaseDeviceMetersStatusFlags.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseDeviceMetersStatusFlags, Characteristic);
  Characteristic.enphaseDeviceMetersStatusFlags.UUID = '00000046-000B-1000-8000-0026BB765291';

  //current meters service
  Service.enphaseDeviceMeters = function (displayName, subtype) {
    Service.call(this, displayName, Service.enphaseDeviceMeters.UUID, subtype);
    // Mandatory Characteristics
    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.enphaseDeviceMetersState);
    this.addOptionalCharacteristic(Characteristic.enphaseDeviceMetersMeasurementType);
    this.addOptionalCharacteristic(Characteristic.enphaseDeviceMetersPhaseMode);
    this.addOptionalCharacteristic(Characteristic.enphaseDeviceMetersPhaseCount);
    this.addOptionalCharacteristic(Characteristic.enphaseDeviceMetersMeteringStatus);
    this.addOptionalCharacteristic(Characteristic.enphaseDeviceMetersStatusFlags);
  };
  inherits(Service.enphaseDeviceMeters, Service);
  Service.enphaseDeviceMeters.UUID = '00000004-000A-1000-8000-0026BB765291';

  //Envoy devices
  Characteristic.enphaseDevicePower = function () {
    Characteristic.call(this, 'Power', Characteristic.enphaseDevicePower.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kW',
      minValue: -100000,
      maxValue: 100000,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseDevicePower, Characteristic);
  Characteristic.enphaseDevicePower.UUID = '00000051-000B-1000-8000-0026BB765291';

  Characteristic.enphaseDevicePowerMax = function () {
    Characteristic.call(this, 'Power max', Characteristic.enphaseDevicePowerMax.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kW',
      minValue: -100000,
      maxValue: 100000,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseDevicePowerMax, Characteristic);
  Characteristic.enphaseDevicePowerMax.UUID = '00000052-000B-1000-8000-0026BB765291';

  Characteristic.enphaseDeviceEnergyToday = function () {
    Characteristic.call(this, 'Energy today', Characteristic.enphaseDeviceEnergyToday.UUID);
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
  inherits(Characteristic.enphaseDeviceEnergyToday, Characteristic);
  Characteristic.enphaseDeviceEnergyToday.UUID = '00000053-000B-1000-8000-0026BB765291';

  Characteristic.enphaseDeviceState = function () {
    Characteristic.call(this, 'Relay', Characteristic.enphaseDeviceState.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseDeviceState, Characteristic);
  Characteristic.enphaseDeviceState.UUID = '00000054-000B-1000-8000-0026BB765291';

  Characteristic.enphaseDeviceProducing = function () {
    Characteristic.call(this, 'Producing', Characteristic.enphaseDeviceProducing.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseDeviceProducing, Characteristic);
  Characteristic.enphaseDeviceProducing.UUID = '00000055-000B-1000-8000-0026BB765291';

  Characteristic.enphaseDeviceCommunicating = function () {
    Characteristic.call(this, 'Communicating', Characteristic.enphaseDeviceCommunicating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseDeviceCommunicating, Characteristic);
  Characteristic.enphaseDeviceCommunicating.UUID = '00000056-000B-1000-8000-0026BB765291';

  Characteristic.enphaseDeviceProvisioned = function () {
    Characteristic.call(this, 'Provisioned', Characteristic.enphaseDeviceProvisioned.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseDeviceProvisioned, Characteristic);
  Characteristic.enphaseDeviceProvisioned.UUID = '00000057-000B-1000-8000-0026BB765291';

  Characteristic.enphaseDeviceOperating = function () {
    Characteristic.call(this, 'Operating', Characteristic.enphaseDeviceOperating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseDeviceOperating, Characteristic);
  Characteristic.enphaseDeviceOperating.UUID = '00000058-000B-1000-8000-0026BB765291';

  Characteristic.enphaseDeviceStatus = function () {
    Characteristic.call(this, 'Status', Characteristic.enphaseDeviceStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseDeviceStatus, Characteristic);
  Characteristic.enphaseDeviceStatus.UUID = '00000059-000B-1000-8000-0026BB765291';

  Characteristic.enphaseDeviceFirmware = function () {
    Characteristic.call(this, 'Firmware', Characteristic.enphaseDeviceFirmware.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseDeviceFirmware, Characteristic);
  Characteristic.enphaseDeviceFirmware.UUID = '00000060-000B-1000-8000-0026BB765291';

  Characteristic.enphaseDeviceLastReportDate = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseDeviceLastReportDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseDeviceLastReportDate, Characteristic);
  Characteristic.enphaseDeviceLastReportDate.UUID = '00000061-000B-1000-8000-0026BB765291';

  //devices service
  Service.enphaseDevice = function (displayName, subtype) {
    Service.call(this, displayName, Service.enphaseDevice.UUID, subtype);
    // Mandatory Characteristics
    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.enphaseDevicePower);
    this.addOptionalCharacteristic(Characteristic.enphaseDevicePowerMax);
    this.addOptionalCharacteristic(Characteristic.enphaseDeviceEnergyToday);
    this.addOptionalCharacteristic(Characteristic.enphaseDeviceProducing);
    this.addOptionalCharacteristic(Characteristic.enphaseDeviceCommunicating);
    this.addOptionalCharacteristic(Characteristic.enphaseDeviceProvisioned);
    this.addOptionalCharacteristic(Characteristic.enphaseDeviceOperating);
    this.addOptionalCharacteristic(Characteristic.enphaseDeviceStatus);
    this.addOptionalCharacteristic(Characteristic.enphaseDeviceFirmware);
    this.addOptionalCharacteristic(Characteristic.enphaseDeviceLastReportDate);
  };
  inherits(Service.enphaseDevice, Service);
  Service.enphaseDevice.UUID = '00000005-000A-1000-8000-0026BB765291';

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

    //setup variables
    this.checkDeviceInfo = false;
    this.checkDeviceState = false;

    this.powerProductionMax = 0;
    this.powerProductionMaxDetectedState = false;
    this.powerProduction = 0;
    this.energyProductionToday = 0;
    this.energyProductionLastSevenDays = 0;
    this.energyProductionLifetime = 0;
    this.powerProductionReadingTime = '';
    this.productionDataOK = false;

    this.powerConsumptionTotalMax = 0;
    this.powerConsumptionTotalMaxDetectedState = false;
    this.powerConsumptionTotal = 0;
    this.energyConsumptionTotalToday = 0;
    this.energyConsumptionTotalLastSevenDays = 0;
    this.energyConsumptionTotalLifetime = 0;
    this.consumptionDataTotalDataOK = false;

    this.powerConsumptionNetMax = 0;
    this.powerConsumptionNetMaxDetectedState = false;
    this.powerConsumptionNet = 0;
    this.energyConsumptionNetToday = 0;
    this.energyConsumptionNetLastSevenDays = 0;
    this.energyConsumptionNetLifetime = 0;
    this.consumptionDataNetDataOK = false;

    this.envoyUser = 'envoy';
    this.envoySerialNumber = '';
    this.envoyFirmware = '';
    this.envoySoftwareBuildEpoch = 0;

    this.envoyIsEnvoy = false;
    this.envoyAllerts = '';
    this.envoyDbSize = '';
    this.envoyDbPercentFull = '';
    this.envoyTariff = '';
    this.envoyPrimaryInterface = '';
    this.envoyNetworkWebComm = false;
    this.envoyEverReportedToEnlighten = false;
    this.envoyCommNum = 0;
    this.envoyCommLevel = 0;
    this.envoyCommPcuNum = 0;
    this.envoyCommPcuLevel = 0;
    this.envoyCommAcbNum = 0;
    this.envoyCommAcbLevel = 0;
    this.envoyCommNsrbNum = 0;
    this.envoyCommNsrbLevel = 0;
    this.envoyUpdateStatus = '';
    this.envoyTimeZone = '';
    this.envoyCurrentDate = '';
    this.envoyCurrentTime = '';
    this.envoyLastEnlightenReporTime = 0;
    this.envoyDataOK = false;

    this.qRelaysCount = 0;
    this.qRelaysSerialNumber = new Array();
    this.qRelaysFirmware = new Array();
    this.qRelaysRelay = new Array();
    this.qRelaysProducing = new Array();
    this.qRelaysCommunicating = new Array();
    this.qRelaysProvisioned = new Array();
    this.qRelaysOperating = new Array();
    this.qRelaysStatus = new Array();
    this.qRelaysLastReportDate = new Array();
    this.qrelaysDataOK = false;

    this.enchargesCount = 0;
    this.enchargesSerialNumber = new Array();
    this.enchargesPower = new Array();
    this.enchargesEnergy = new Array();
    this.enchargesFirmware = new Array();
    this.enchargesState = new Array();
    this.enchargesProducing = new Array();
    this.enchargesCommunicating = new Array();
    this.enchargesProvisioned = new Array();
    this.enchargesOperating = new Array();
    this.enchargesStatus = new Array();
    this.enchargesLastReportDate = new Array();
    this.enchargesDataOK = false;
    this.enchargesDataOK1 = false;

    this.metersCount = 0;
    this.metersProductionCount = 0;
    this.metersConsumtionTotalCount = 0;
    this.metersConsumptionNetCount = 0;
    this.metersEid = new Array();
    this.metersState = new Array();
    this.metersMeasurementType = new Array();
    this.metersPhaseMode = new Array();
    this.metersPhaseCount = new Array();
    this.metersMeteringStatus = new Array();
    this.metersStatusFlags = new Array();
    this.metersDataOK = false;

    this.invertersCount = 0;
    this.invertersActiveCount = 0;
    this.invertersSerialNumber = new Array();
    this.invertersFirmware = new Array();
    this.invertersType = new Array();
    this.invertersLastPower = new Array();
    this.invertersMaxPower = new Array();
    this.invertersProducing = new Array();
    this.invertersCommunicating = new Array();
    this.invertersProvisioned = new Array();
    this.invertersOperating = new Array();
    this.invertersStatus = new Array();
    this.invertersLastReportDate = new Array();
    this.invertersDataOK = false;
    this.invertersDataOK1 = false;
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
      } else if (!this.checkDeviceInfo && this.checkDeviceState) {
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
      var time = result.envoy_info.time[0];
      var serialNumber = result.envoy_info.device[0].sn[0];
      var firmware = result.envoy_info.device[0].software[0];
      var inverters = response.data[0].devices.length;
      var encharges = response.data[1].devices.length;
      var qrelays = response.data[2].devices.length;
      var meters = response2.data.length;
      me.log('-------- %s --------', me.name);
      me.log('Manufacturer: %s', me.manufacturer);
      me.log('Model: %s', me.modelName);
      me.log('Serial: %s', serialNumber);
      me.log('Firmware: %s', firmware);
      me.log('Inverters: %s', inverters);
      me.log('Encharges: %s', encharges);
      me.log('Q-Relays: %s', qrelays);
      me.log('Meters: %s', meters);
      me.log('----------------------------------');
      me.envoyTime = time;
      me.envoySerialNumber = serialNumber;
      me.envoyFirmware = firmware;
      me.invertersCount = inverters;
      me.enchargesCount = encharges;
      me.qRelaysCount = qrelays;
      me.metersCount = meters;
      me.checkDeviceInfo = false;
      me.updateDeviceState();
    } catch (error) {
      me.log.error('Device: %s %s, getProduction eror: %s, state: Offline', me.host, me.name, error);
      me.checkDeviceInfo = true;
    };
  }

  async updateDeviceState() {
    var me = this;
    try {
      if (me.metersCount > 0) {
        const metersCount = await axios.get(me.url + PRODUCTION_CT_URL);
        const invertersActiveCount = metersCount.data.production[0].activeCount;
        const metersProductionCount = metersCount.data.production[1].activeCount;
        const metersConsumtionTotalCount = metersCount.data.consumption[0].activeCount;
        const metersConsumptionNetCount = metersCount.data.consumption[1].activeCount;
        me.invertersActiveCount = invertersActiveCount;
        me.metersProductionCount = metersProductionCount;
        me.metersConsumtionTotalCount = metersConsumtionTotalCount;
        me.metersConsumptionNetCount = metersConsumptionNetCount;
      }

      var productionUrl = me.metersConsumtionTotalCount ? me.url + PRODUCTION_CT_URL : me.url + PRODUCTION_SUMM_INVERTERS_URL;
      const [production, productionCT] = await axios.all([axios.get(productionUrl), axios.get(me.url + PRODUCTION_CT_URL)]);
      me.log.debug('Device %s %s, get device status production: %s, productionCT %s', me.host, me.name, production.data, productionCT.data);

      const invertersAvtiveCount = productionCT.data.production[0].activeCount;
      me.invertersAvtiveCount = invertersAvtiveCount;

      //production
      // convert Unix time to local date time
      var readindTimeProduction = me.metersConsumtionTotalCount ? productionCT.data.production[1].readingTime : productionCT.data.production[0].readingTime;
      var lastrptdate = new Date(readindTimeProduction * 1000).toLocaleString();

      //power production
      var powerProduction = me.metersConsumtionTotalCount ? parseFloat(productionCT.data.production[1].wNow / 1000) : parseFloat(production.data.wattsNow / 1000);

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

      var energyProductionToday = me.metersConsumtionTotalCount ? parseFloat(productionCT.data.production[1].whToday / 1000) : parseFloat(production.data.wattHoursToday / 1000);
      var energyProductionLastSevenDays = me.metersConsumtionTotalCount ? parseFloat(productionCT.data.production[1].whLastSevenDays / 1000) : parseFloat(production.data.wattHoursSevenDays / 1000);
      var energyProductionLifetime = me.metersConsumtionTotalCount ? parseFloat((productionCT.data.production[1].whLifetime + me.energyProductionLifetimeOffset) / 1000) : parseFloat((production.data.wattHoursLifetime + me.energyProductionLifetimeOffset) / 1000);
      me.log.debug('Device: %s %s, production report: %s', me.host, me.name, lastrptdate);
      me.log.debug('Device: %s %s, power production: %s kW', me.host, me.name, powerProduction);
      me.log.debug('Device: %s %s, power production max: %s kW', me.host, me.name, powerProductionMax);
      me.log.debug('Device: %s %s, power production max detected: %s', me.host, me.name, powerProductionMaxDetectedState ? 'Yes' : 'No');
      me.log.debug('Device: %s %s, energy production Today: %s kWh', me.host, me.name, energyProductionToday);
      me.log.debug('Device: %s %s, energy production last 7 Days: %s kWh', me.host, me.name, energyProductionLastSevenDays);
      me.log.debug('Device: %s %s, energy production Lifetime: %s kWh', me.host, me.name, energyProductionLifetime);
      me.productionLastReportDate = lastrptdate;
      me.powerProduction = powerProduction;
      me.energyProductionToday = energyProductionToday;
      me.energyProductionLastSevenDays = energyProductionLastSevenDays;
      me.energyProductionLifetime = energyProductionLifetime;
      me.powerProductionMaxDetectedState = powerProductionMaxDetectedState;

      if (me.enphaseServiceProduction) {
        me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphasePower, powerProduction);
        me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphasePowerMax, powerProductionMax);
        me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphasePowerMaxDetected, powerProductionMaxDetectedState);
        me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseEnergyToday, energyProductionToday);
        me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, energyProductionLastSevenDays);
        me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseEnergyLifetime, energyProductionLifetime);
        me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseLastReportDate, lastrptdate);
      }
      me.productionDataOK = true;

      //consumption total
      if (me.metersCount > 0 && me.metersConsumtionTotalCount > 0) {
        // convert Unix time to local date time
        var productionLastReadDate = productionCT.data.consumption[0].readingTime;
        var lastrptdate = new Date(productionLastReadDate * 1000).toLocaleString();

        //power consumption total
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

        var powerConsumptionTotalMaxDetectedState = (me.powerConsumptionTotal >= me.powerConsumptionTotalMaxDetected / 1000);
        me.powerConsumptionTotalMax = powerConsumptionTotalMax;
        me.powerConsumptionTotalMaxDetectedState = powerConsumptionTotalMaxDetectedState;

        var energyConsumptionTotalToday = parseFloat(productionCT.data.consumption[0].whToday / 1000);
        var energyConsumptionTotalLastSevenDays = parseFloat(productionCT.data.consumption[0].whLastSevenDays / 1000);
        var energyConsumptionTotalLifetime = parseFloat((productionCT.data.consumption[0].whLifetime + me.energyConsumptionTotalLifetimeOffset) / 1000);
        me.log.debug('Device: %s %s, total consumption report: %s', me.host, me.name, lastrptdate);
        me.log.debug('Device: %s %s, total power consumption : %s kW', me.host, me.name, powerConsumptionTotal);
        me.log.debug('Device: %s %s, total power consumption max: %s kW', me.host, me.name, powerConsumptionTotalMax);
        me.log.debug('Device: %s %s, total power consumption max detected: %s', me.host, me.name, powerConsumptionTotalMaxDetectedState ? 'Yes' : 'No');
        me.log.debug('Device: %s %s, total energy consumption Today: %s kWh', me.host, me.name, energyConsumptionTotalToday);
        me.log.debug('Device: %s %s, total energy consumption last 7 Days: %s kWh', me.host, me.name, energyConsumptionTotalLastSevenDays);
        me.log.debug('Device: %s %s, total energy consumption Lifetime: %s kWh', me.host, me.name, energyConsumptionTotalLifetime);
        me.totalConsumptionLastReportDate = lastrptdate;
        me.powerConsumptionTotal = powerConsumptionTotal;
        me.energyConsumptionTotalToday = energyConsumptionTotalToday;
        me.energyConsumptionTotalLastSevenDays = energyConsumptionTotalLastSevenDays;
        me.energyConsumptionTotalLifetime = energyConsumptionTotalLifetime;
        me.powerConsumptionTotalMaxDetectedState = powerConsumptionTotalMaxDetectedState;

        if (me.enphaseServiceConsumptionTotal) {
          me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphasePower, powerConsumptionTotal);
          me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphasePowerMax, powerConsumptionTotalMax);
          me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphasePowerMaxDetected, powerConsumptionTotalMaxDetectedState);
          me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseEnergyToday, energyConsumptionTotalToday);
          me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, energyConsumptionTotalLastSevenDays);
          me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseEnergyLifetime, energyConsumptionTotalLifetime);
          me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseLastReportDate, lastrptdate);
        }
        me.consumptionTotalDataOK = true;
      }

      //consumption net
      if (me.metersCount > 0 && me.metersConsumptionNetCount > 0) {
        // convert Unix time to local date time
        var netConsumptionLastReadDate = productionCT.data.consumption[1].readingTime;
        var lastrptdate = new Date(netConsumptionLastReadDate * 1000).toLocaleString();

        //power consumption net
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
        me.log.debug('Device: %s %s, net consumption report: %s', me.host, me.name, lastrptdate);
        me.log.debug('Device: %s %s, net power consumption: %s kW', me.host, me.name, powerConsumptionNet);
        me.log.debug('Device: %s %s, net power consumption max: %s kW', me.host, me.name, powerConsumptionNetMax);
        me.log.debug('Device: %s %s, net power consumption max detected: %s', me.host, me.name, powerConsumptionNetMaxDetectedState ? 'Yes' : 'No');
        me.log.debug('Device: %s %s, net energy consumption Today: %s kWh', me.host, me.name, energyConsumptionNetToday);
        me.log.debug('Device: %s %s, net energy consumption last 7 Days: %s kWh', me.host, me.name, energyConsumptionNetLastSevenDays);
        me.log.debug('Device: %s %s, net energy consumption Lifetime: %s kWh', me.host, me.name, energyConsumptionNetLifetime);
        me.netConsumptionLastReportDate = lastrptdate;
        me.powerConsumptionNet = powerConsumptionNet;
        me.energyConsumptionNetToday = energyConsumptionNetToday;
        me.energyConsumptionNetLastSevenDays = energyConsumptionNetLastSevenDays;
        me.energyConsumptionNetLifetime = energyConsumptionNetLifetime;
        me.powerConsumptionNetMaxDetectedState = powerConsumptionNetMaxDetectedState;

        if (me.enphaseServiceConsumptionNet) {
          me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphasePower, powerConsumptionNet);
          me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphasePowerMax, powerConsumptionNetMax);
          me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphasePowerMaxDetected, powerConsumptionNetMaxDetectedState);
          me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseEnergyToday, energyConsumptionNetToday);
          me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, energyConsumptionNetLastSevenDays);
          me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseEnergyLifetime, energyConsumptionNetLifetime);
          me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseLastReportDate, lastrptdate);
        }
        me.consumptionNetDataOK = true;
      }

      //envoy
      const home = await axios.get(me.url + HOME_URL);
      if (home.status == 200) {
        var envoySoftwareBuildEpoch = home.software_build_epoch;
        var envoyIsEnvoy = (home.data.is_nonvoy == false);
        var envoyDbSize = home.data.db_size;
        var envoyDbPercentFull = home.data.db_percent_full;
        var envoyTimeZone = home.data.timezone;
        var envoyCurrentDate = home.data.current_date;
        var envoyCurrentTime = home.data.current_time;
        var envoyNetworkWebComm = home.data.network.web_comm;
        var envoyEverReportedToEnlighten = home.data.network.ever_reported_to_enlighten;
        var envoyLastEnlightenReporTime = home.data.network.last_enlighten_report_time;
        var envoyPrimaryInterface = home.data.network.primary_interface;
        var envoyTariff = home.data.tariff;
        var envoyCommNum = home.data.comm.num;
        var envoyCommLevel = home.data.comm.level;
        var envoyCommPcuNum = home.data.comm.pcu.num;
        var envoyCommPcuLevel = home.data.comm.pcu.level;
        var envoyCommAcbNum = home.data.comm.acb.num;
        var envoyCommAcbLevel = home.data.comm.acb.level;
        var envoyCommNsrbNum = home.data.comm.nsrb.num;
        var envoyCommNsrbLevel = home.data.comm.nsrb.level;
        var envoyAllerts = home.data.allerts;
        var envoyUpdateStatus = home.data.update_status;
        if (Array.isArray(envoyAllerts) && envoyAllerts.length === 1) {
          var code1 = envoyAllerts[0];
          var indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
          var envoyAllerts = ENVOY_STATUS_CODE_1[indexCode1];
        } else if (Array.isArray(envoyAllerts) && envoyAllerts.length === 2) {
          var code1 = envoyAllerts[0];
          var indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
          var status1 = ENVOY_STATUS_CODE_1[indexCode1];
          var code2 = envoyAllerts[1];
          var indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
          var status2 = ENVOY_STATUS_CODE_1[indexCode2];
          var envoyAllerts = status1 + ' / ' + status2;
        } else if (Array.isArray(envoyAllerts) && envoyAllerts.length === 3) {
          var code1 = envoyAllerts[0];
          var indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
          var status1 = ENVOY_STATUS_CODE_1[indexCode1];
          var code2 = envoyAllerts[1];
          var indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
          var status2 = ENVOY_STATUS_CODE_1[indexCode2];
          var code3 = envoyAllerts[2];
          var indexCode3 = ENVOY_STATUS_CODE.indexOf(code3);
          var status3 = ENVOY_STATUS_CODE_1[indexCode3];
          var envoyAllerts = status1 + ' / ' + status2 + ' / ' + status3;
        } else {
          var envoyAllerts = 'No allerts';
        }
        // convert network intzerface
        var networkInterface = ['eth0', 'wlan0', 'cellurar'];
        var networkInterfaceIndex = networkInterface.indexOf(envoyPrimaryInterface);
        envoyPrimaryInterface = NETWORK_INTERFACE[networkInterfaceIndex];

        // convert Unix time to local date time
        envoyLastEnlightenReporTime = new Date(envoyLastEnlightenReporTime * 1000).toLocaleString();

        me.log.debug('Envoy: %s', envoyIsEnvoy ? 'Yes' : 'No');
        me.log.debug('DB size: %s', envoyDbSize);
        me.log.debug('DB size percent: %s', envoyDbPercentFull);
        me.log.debug('Time Zone: %s', envoyTimeZone);
        me.log.debug('Current time: %s', envoyCurrentDate + '' + envoyCurrentTime);
        me.log.debug('Web comm:: %s', envoyNetworkWebComm);
        me.log.debug('Reported to enlighten: %s', envoyEverReportedToEnlighten);
        me.log.debug('Inverters comm: %s', envoyCommPcuNum);
        me.log.debug('Encharges comm: %s', envoyCommAcbNum);
        me.log.debug('Q-Relays comm: %s', envoyCommNsrbNum);
        me.log.debug('Allerts: %s', envoyAllerts);
        me.log.debug('Update state: %s', envoyUpdateStatus);
        me.log.debug('Last report: %s', lastrptdate);
        me.log.debug('----------------------------------');
        me.envoySoftwareBuildEpoch = envoySoftwareBuildEpoch;
        me.envoyIsEnvoy = envoyIsEnvoy;
        me.envoyDbSize = envoyDbSize;
        me.envoyDbPercentFull = envoyDbPercentFull;
        me.envoyTimeZone = envoyTimeZone;
        me.envoyCurrentDate = envoyCurrentDate;
        me.envoyCurrentTime = envoyCurrentTime;
        me.envoyNetworkWebComm = envoyNetworkWebComm;
        me.envoyEverReportedToEnlighten = envoyEverReportedToEnlighten;
        me.envoyLastEnlightenReporTime = envoyLastEnlightenReporTime;
        me.envoyPrimaryInterface = envoyPrimaryInterface;
        me.envoyTariff = envoyTariff;
        me.envoyCommNum = envoyCommNum;
        me.envoyCommLevel = envoyCommLevel;
        me.envoyCommPcuNum = envoyCommPcuNum;
        me.envoyCommPcuLevel = envoyCommPcuLevel;
        me.envoyCommAcbNum = envoyCommAcbNum;
        me.envoyCommAcbLevel = envoyCommAcbLevel;
        me.envoyCommNsrbNum = envoyCommNsrbNum;
        me.envoyCommNsrbLevel = envoyCommNsrbLevel;
        me.envoyAllerts = envoyAllerts;
        me.envoyUpdateStatus = envoyUpdateStatus;

        if (me.enphaseServiceEnvoy) {
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyAllerts, envoyAllerts);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyDbSize, envoyDbSize + ' / ' + envoyDbPercentFull + '%');
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyTariff, envoyTariff);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface, envoyPrimaryInterface);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm, envoyNetworkWebComm);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten, envoyEverReportedToEnlighten);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel, envoyCommNum + ' / ' + envoyCommLevel);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel, envoyCommPcuNum + ' / ' + envoyCommPcuLevel);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel, envoyCommAcbNum + ' / ' + envoyCommAcbLevel);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyCommNsrbNumAndLevel, envoyCommNsrbNum + ' / ' + envoyCommNsrbLevel);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyTimeZone, envoyTimeZone);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime, envoyCurrentDate + ' ' + envoyCurrentTime);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporTime, envoyLastEnlightenReporTime);
        }
        me.envoyDataOK = true;
      }

      //qrelays
      if (me.qRelaysCount > 0) {
        const inventory = await axios.get(me.url + INVENTORY_URL);
        for (let i = 0; i < me.qRelaysCount; i++) {
          if (inventory.status == 200) {
            var type = inventory.data[2].type;
            var serialNumber = inventory.data[2].devices[i].serial_num;
            var firmware = inventory.data[2].devices[i].img_pnum_running;
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
            } else if (Array.isArray(code) && code.length === 3) {
              var code1 = code[0];
              var indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
              var status1 = ENVOY_STATUS_CODE_1[indexCode1];
              var code2 = code[1];
              var indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
              var status2 = ENVOY_STATUS_CODE_1[indexCode2];
              var code3 = code[2];
              var indexCode3 = ENVOY_STATUS_CODE.indexOf(code3);
              var status3 = ENVOY_STATUS_CODE_1[indexCode3];
              var status = status1 + ' / ' + status2 + ' / ' + status3;
            } else {
              var status = 'Status not available';
            }
            //   var linecount = inventory.data[2].devices[i].line-count;
            //   var line1connected = inventory.data[2].devices[i].line1-connectedt ? 'Closed' : 'Open';
            //   var line2connected = inventory.data[2].devices[i].line2-connectedt ? 'Closed' : 'Open';
            //   var line3connected = inventory.data[2].devices[i].line3-connectedt ? 'Closed' : 'Open';

            // convert Unix time to local date time
            lastrptdate = new Date(lastrptdate * 1000).toLocaleString();

            me.log.debug('Q-Relay: %s', serialNumber);
            me.log.debug('Firmware: %s', firmware);
            me.log.debug('Relay: %s', relay);
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
            me.qRelaysFirmware.push(firmware);
            me.qRelaysRelay.push(relay);
            me.qRelaysProducing.push(producing);
            me.qRelaysCommunicating.push(communicating);
            me.qRelaysProvisioned.push(provisioned);
            me.qRelaysOperating.push(operating);
            me.qRelaysStatus.push(status);
            me.qRelaysLastReportDate.push(lastrptdate);
            //me.qRelaysLinecount = linecount;
            //me.qRelaysLine1connected = line1connected;
            //me.qRelaysLine2connected = line2connected;
            //me.qRelaysLine3connected = line3connected;

            if (me.enphaseServiceQrelay) {
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayState, relay);
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayProducing, producing);
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayCommunicating, communicating);
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayProvisioned, provisioned);
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayOperating, operating);
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayStatus, status);
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayFirmware, firmware);
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayLastReportDate, lastrptdate);
            }
            me.qrelaysDataOK = true;
          }
        }
      }

      //meters
      if (me.metersCount > 0) {
        const meters = await axios.get(me.url + METERS_URL);
        for (let i = 0; i < me.metersCount; i++) {
          if (meters.status == 200) {
            var eid = meters.data[i].eid;
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
            } else if (Array.isArray(code) && code.length === 3) {
              var code1 = code[0];
              var indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
              var status1 = ENVOY_STATUS_CODE_1[indexCode1];
              var code2 = code[1];
              var indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
              var status2 = ENVOY_STATUS_CODE_1[indexCode2];
              var code3 = code[2];
              var indexCode3 = ENVOY_STATUS_CODE.indexOf(code3);
              var status3 = ENVOY_STATUS_CODE_1[indexCode3];
              var status = status1 + ' / ' + status2 + ' / ' + status3;
            } else {
              var status = 'Status not available';
            }
            me.log.debug('Meter %s:', measurementType);
            me.log.debug('State: %s', state);
            me.log.debug('Phase mode: %s', phaseMode);
            me.log.debug('Phase count: %s', phaseCount);
            me.log.debug('Metering status: %s', meteringStatus);
            me.log.debug('Status flag: %s', status);
            me.log.debug('----------------------------------');
            me.metersEid.push(eid);
            me.metersState.push(state);
            me.metersMeasurementType.push(measurementType);
            me.metersPhaseMode.push(phaseMode);
            me.metersPhaseCount.push(phaseCount);
            me.metersMeteringStatus.push(meteringStatus);
            me.metersStatusFlags.push(status);

            if (me.enphaseServiceMeter) {
              me.enphaseServiceMeter.updateCharacteristic(Characteristic.enphaseDeviceMetersState, state);
              me.enphaseServiceMeter.updateCharacteristic(Characteristic.enphaseDeviceMetersPhaseMode, phaseMode);
              me.enphaseServiceMeter.updateCharacteristic(Characteristic.enphaseDeviceMetersPhaseCount, phaseCount);
              me.enphaseServiceMeter.updateCharacteristic(Characteristic.enphaseDeviceMetersMeteringStatus, meteringStatus);
              me.enphaseServiceMeter.updateCharacteristic(Characteristic.enphaseDeviceMetersStatusFlags, status);
            }
            me.metersDataOK = true;
          }
        }
      }

      //encharge storage
      if (me.enchargesCount > 0) {
        const inventory = await axios.get(me.url + INVENTORY_URL);
        for (let i = 0; i < me.enchargesCount; i++) {
          if (inventory.status == 200) {
            var type = inventory.data[1].type;
            var serialNumber = inventory.data[1].devices[i].serial_num;
            var firmware = inventory.data[1].devices[i].img_pnum_running;
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
            } else if (Array.isArray(code) && code.length === 3) {
              var code1 = code[0];
              var indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
              var status1 = ENVOY_STATUS_CODE_1[indexCode1];
              var code2 = code[1];
              var indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
              var status2 = ENVOY_STATUS_CODE_1[indexCode2];
              var code3 = code[2];
              var indexCode3 = ENVOY_STATUS_CODE.indexOf(code3);
              var status3 = ENVOY_STATUS_CODE_1[indexCode3];
              var status = status1 + ' / ' + status2 + ' / ' + status3;
            } else {
              var status = 'Status not available';
            }
            // convert Unix time to local date time
            lastrptdate = new Date(lastrptdate * 1000).toLocaleString();

            me.log.debug('Encharge %s:', serialNumber);
            me.log.debug('Firmware %s:', firmware);
            me.log.debug('Producing: %s', producing ? 'Yes' : 'No');
            me.log.debug('Communicating: %s', communicating ? 'Yes' : 'No');
            me.log.debug('Provisioned: %s', provisioned ? 'Yes' : 'No');
            me.log.debug('Operating: %s', operating ? 'Yes' : 'No');
            me.log.debug('Status: %s', status);
            me.log.debug('Last report: %s', lastrptdate);
            me.log.debug('----------------------------------');

            me.enchargesSerialNumber.push(serialNumber);
            me.enchargesFirmware.push(firmware);
            me.enchargesProducing.push(producing);
            me.enchargesCommunicating.push(communicating);
            me.enchargesProvisioned.push(provisioned);
            me.enchargesOperating.push(operating);
            me.enchargesStatus.push(status);
            me.enchargesLastReportDate.push(lastrptdate);

            if (me.enphaseServiceEncharge) {
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseDeviceProducing, producing);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseDeviceCommunicating, communicating);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseDeviceProvisioned, provisioned);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseDeviceOperating, operating);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseDeviceStatus, status);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseDeviceFirmware, firmware);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseDeviceLastReportDate, lastrptdate);
            }
            me.enchargesDataOK = true;
          }

          if (productionCT.status == 200) {
            me.log.debug('Power: %s kW', me.host, me.name, enchargewNow);
            me.log.debug('Energy: %s kWh', me.host, me.name, enchargewhNow);
            me.log.debug('State: %s', enchargeState);

            var enchargeType = productionCT.data.storage[i].type;
            var enchargeActiveCount = productionCT.data.storage[i].activeCount;
            var enchargewNow = parseFloat(productionCT.data.storage[i].wNow / 1000);
            var enchargewhNow = parseFloat(productionCT.data.storage[i].whNow + me.enchargeStorageOffset / 1000);
            var enchargeState = productionCT.data.storage[i].state;

            me.enchargesPower.push(enchargewNow);
            me.enchargesEnergy.push(enchargewhNow);
            me.enchargesState.push(enchargeState);

            if (me.enphaseServiceEncharge) {
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseDevicePower, enchargewNow);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseDeviceEnergyToday, enchargewhNow);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseDeviceState, enchargeState);
            }
            me.enchargesDataOK1 = true;
          }
        }
      }

      //microinverters power
      if (me.invertersCount > 0) {
        const inventory = await axios.get(me.url + INVENTORY_URL);
        if (inventory.status == 200) {
          for (let i = 0; i < me.invertersCount; i++) {
            var type = inventory.data[0].type;
            var serialNumber = inventory.data[0].devices[i].serial_num;
            var firmware = inventory.data[0].devices[i].img_pnum_running;
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
            } else if (Array.isArray(code) && code.length === 3) {
              var code1 = code[0];
              var indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
              var status1 = ENVOY_STATUS_CODE_1[indexCode1];
              var code2 = code[1];
              var indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
              var status2 = ENVOY_STATUS_CODE_1[indexCode2];
              var code3 = code[2];
              var indexCode3 = ENVOY_STATUS_CODE.indexOf(code3);
              var status3 = ENVOY_STATUS_CODE_1[indexCode3];
              var status = status1 + ' / ' + status2 + ' / ' + status3;
            } else {
              var status = 'Status not available';
            }

            // convert Unix time to local date time
            lastrptdate = new Date(lastrptdate * 1000).toLocaleString();

            me.log.debug('Inverter %s:', serialNumber);
            me.log.debug('Firmware %s:', firmware);
            me.log.debug('Producing: %s', producing ? 'Yes' : 'No');
            me.log.debug('Communicating: %s', communicating ? 'Yes' : 'No');
            me.log.debug('Provisioned: %s', provisioned ? 'Yes' : 'No');
            me.log.debug('Operating: %s', operating ? 'Yes' : 'No');
            me.log.debug('Status: %s', status);
            me.log.debug('Last report: %s', lastrptdate);
            me.log.debug('----------------------------------');
            me.invertersSerialNumber.push(serialNumber);
            me.invertersFirmware.push(firmware);
            me.invertersProducing.push(producing);
            me.invertersCommunicating.push(communicating);
            me.invertersProvisioned.push(provisioned);
            me.invertersOperating.push(operating);
            me.invertersStatus.push(status);
            //me.invertersLastReportDate.push(lastrptdate);

            if (me.enphaseServiceMicronverter) {
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseDeviceProducing, producing);
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseDeviceCommunicating, communicating);
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseDeviceProvisioned, provisioned);
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseDeviceOperating, operating);
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseDeviceStatus, status);
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseDeviceFirmware, firmware);
              //me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseDeviceLastReportDate, lastrptdate);
            }
          }
          me.invertersDataOK = true;
        }
        if (me.invertersDataOK) {
          const user = me.envoyUser;
          const passwd = me.envoySerialNumber.substring(6);
          const auth = user + ':' + passwd;
          const url = me.url + PRODUCTION_INVERTERS_URL;
          const options = {
            method: 'GET',
            rejectUnauthorized: false,
            digestAuth: auth,
            headers: {
              'Content-Type': 'application/json'
            }
          };

          const response = await http.request(url, options);
          const inverters = JSON.parse(response.data);
          if (inverters !== 'undefined') {
            var invertersCount = inverters.length;
            var arr = new Array();
            for (let i = 0; i < invertersCount; i++) {
              var serialNumber = inverters[i].serialNumber;
              arr.push(serialNumber);
            }
            for (let i = 0; i < me.invertersCount; i++) {
              var index = arr.indexOf(me.invertersSerialNumber[i]);
              var inverterLastReportDate = inverters[index].lastReportDate;
              var inverterType = inverters[index].devType;
              var inverterLastPower = parseFloat(inverters[index].lastReportWatts);
              var inverterMaxPower = parseFloat(inverters[index].maxReportWatts);

              // convert Unix time to local date time
              inverterLastReportDate = new Date(inverterLastReportDate * 1000).toLocaleString();

              me.log.debug('Device: %s %s, inverter: %s type: %s', me.host, me.name, me.invertersSerialNumber[i], inverterType);
              me.log.debug('Device: %s %s, inverter: %s last power: %s W', me.host, me.name, me.invertersSerialNumber[i], inverterLastPower);
              me.log.debug('Device: %s %s, inverter: %s max power: %s W', me.host, me.name, me.invertersSerialNumber[i], inverterMaxPower);
              me.log.debug('Device: %s %s, inverter: %s last report: %s', me.host, me.name, me.invertersSerialNumber[i], inverterLastReportDate);
              me.invertersLastReportDate.push(inverterLastReportDate);
              me.invertersType.push(inverterType);
              me.invertersLastPower.push(inverterLastPower);
              me.invertersMaxPower.push(inverterMaxPower);

              if (me.enphaseServiceMicronverter) {
                me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseDevicePower, inverterLastPower);
                me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseDevicePowerMax, inverterMaxPower);
                me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseDeviceLastReportDate, inverterLastReportDate);
              }
            }
            me.invertersDataOK1 = true;
          }
        }
      }
      if (!me.checkDeviceState) {
        me.prepareAccessory();
      }
      me.checkDeviceState = true;
    } catch (error) {
      me.log.error('Device: %s %s, update Device state error: %s, state: Offline', me.host, me.name, error);
      me.checkDeviceState = true;
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
    this.prepareEnphaseService();

    this.log.debug('Device: %s %s, publishExternalAccessories.', this.host, accessoryName);
    this.api.publishExternalAccessories(PLUGIN_NAME, [this.accessory]);
  }

  //Prepare information service
  prepareInformationService() {
    this.log.debug('prepareInformationService');

    let manufacturer = this.manufacturer;
    let modelName = this.modelName;
    let serialNumber = this.envoySerialNumber;
    let firmwareRevision = this.envoyFirmware;

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
  prepareEnphaseService() {
    this.log.debug('prepareEnphaseService');
    //power and energy production
    if (this.consumptionNetDataOK) {
      this.enphaseServiceProduction = new Service.enphaseMeter('Production', 'enphaseServiceProduction');
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphasePower)
        .on('get', (callback) => {
          let value = this.powerProduction;
          this.log.info('Device: %s %s, power production : %s kW', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphasePowerMax)
        .on('get', (callback) => {
          let value = this.powerProductionMax;
          this.log.info('Device: %s %s, power production  max: %s kW', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphasePowerMaxDetected)
        .on('get', (callback) => {
          let value = this.powerProductionMaxDetectedState;
          this.log.info('Device: %s %s, power production  max detected: %s', this.host, this.name, value ? 'Yes' : 'No');
          callback(null, value);
        });
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseEnergyToday)
        .on('get', (callback) => {
          let value = this.energyProductionToday;
          this.log.info('Device: %s %s, energy production  Today: %s kWh', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
        .on('get', (callback) => {
          let value = this.energyProductionLastSevenDays;
          this.log.info('Device: %s %s, energy production  Last Seven Days: %s kWh', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseEnergyLifetime)
        .on('get', (callback) => {
          let value = this.energyProductionLifetime;
          this.log.info('Device: %s %s, energy production Lifetime: %s kWh', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseLastReportDate)
        .on('get', (callback) => {
          let value = this.productionLastReportDate;
          this.log.info('Device: %s %s, last report: %s', this.host, this.name, value);
          callback(null, value);
        });
      this.accessory.addService(this.enphaseServiceProduction);
    }

    //power and energy consumption total
    if (this.metersCount > 0 && this.metersConsumtionTotalCount > 0 && this.consumptionTotalDataOK) {
      this.enphaseServiceConsumptionTotal = new Service.enphaseMeter('Consumption Total', 'enphaseServiceConsumptionTotal');
      this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphasePower)
        .on('get', (callback) => {
          let value = this.powerConsumptionTotal;
          this.log.info('Device: %s %s, power consumption total: %s kW', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphasePowerMax)
        .on('get', (callback) => {
          let value = this.powerConsumptionTotalMax;
          this.log.info('Device: %s %s, power consumption total max: %s kW', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphasePowerMaxDetected)
        .on('get', (callback) => {
          let value = this.powerConsumptionTotalMaxDetectedState;
          this.log.info('Device: %s %s, power consumption total max detected: %s', this.host, this.name, value ? 'Yes' : 'No');
          callback(null, value);
        });
      this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseEnergyToday)
        .on('get', (callback) => {
          let value = this.energyConsumptionTotalToday;
          this.log.info('Device: %s %s, energy consumption total Today: %s kWh', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
        .on('get', (callback) => {
          let value = this.energyConsumptionTotalLastSevenDays;
          this.log.info('Device: %s %s, energy consumption total Last Seven Days: %s kWh', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseEnergyLifetime)
        .on('get', (callback) => {
          let value = this.energyConsumptionTotalLifetime;
          this.log.info('Device: %s %s, energy consumption total Lifetime: %s kWh', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseLastReportDate)
        .on('get', (callback) => {
          let value = this.totalConsumptionLastReportDate;
          this.log.info('Device: %s %s, last report: %s', this.host, this.name, value);
          callback(null, value);
        });
      this.accessory.addService(this.enphaseServiceConsumptionTotal);
    }

    //power and energy consumption net
    if (this.metersCount > 0 && this.metersConsumptionNetCount > 0 && this.consumptionNetDataOK) {
      this.enphaseServiceConsumptionNet = new Service.enphaseMeter('Consumption Net', 'enphaseServiceConsumptionNet');
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphasePower)
        .on('get', (callback) => {
          let value = this.powerConsumptionNet;
          this.log.info('Device: %s %s, power consumption net: %s kW', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphasePowerMax)
        .on('get', (callback) => {
          let value = this.powerConsumptionNetMax;
          this.log.info('Device: %s %s, power consumption net max: %s kW', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphasePowerMaxDetected)
        .on('get', (callback) => {
          let value = this.powerConsumptionNetMaxDetectedState;
          this.log.info('Device: %s %s, power consumption net max detected: %s', this.host, this.name, value ? 'Yes' : 'No');
          callback(null, value);
        });
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseEnergyToday)
        .on('get', (callback) => {
          let value = this.energyConsumptionNetToday;
          this.log.info('Device: %s %s, energy consumption net Today: %s kWh', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
        .on('get', (callback) => {
          let value = this.energyConsumptionNetLastSevenDays;
          this.log.info('Device: %s %s, energy consumption net Last Seven Days: %s kWh', this.host, this.name, value.toFixed(3));
          callback(null, value);
        });
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseEnergyLifetime)
        .on('get', (callback) => {
          let value = this.energyConsumptionNetLifetime;
          this.log.info('Device: %s %s, energy consumption net Lifetime: %s kWh', this.host, this.name, value.toFixed(3));
          callback(null, value);
        })
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseLastReportDate)
        .on('get', (callback) => {
          let value = this.netConsumptionLastReportDate;
          this.log.info('Device: %s %s, last report: %s', this.host, this.name, value);
          callback(null, value);
        });
      this.accessory.addService(this.enphaseServiceConsumptionNet);
    }

    //envoy
    if (this.envoyDataOK) {
      this.enphaseServiceEnvoy = new Service.enphaseDeviceEnvoy('Envoy ' + this.envoySerialNumber, 'enphaseServiceEnvoy');
      this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyAllerts)
        .on('get', (callback) => {
          let value = this.envoyAllerts;
          this.log.info('Device: %s %s, envoy: %s allerts: %s', this.host, this.name, this.envoySerialNumber, value);
          if (value.length > 64) {
            value = value.substring(0, 64)
          }
          callback(null, value);
        });
      this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyDbSize)
        .on('get', (callback) => {
          let value = this.envoyDbSize + ' / ' + this.envoyDbPercentFull + '%';
          this.log.info('Device: %s %s, envoy: %s db size: %s', this.host, this.name, this.envoySerialNumber, value);
          callback(null, value);
        });
      this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyTariff)
        .on('get', (callback) => {
          let value = this.envoyTariff;
          this.log.info('Device: %s %s, envoy: %s tariff: %s', this.host, this.name, this.envoySerialNumber, value);
          callback(null, value);
        });
      this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface)
        .on('get', (callback) => {
          let value = this.envoyPrimaryInterface;
          this.log.info('Device: %s %s, envoy: %s network interface: %s', this.host, this.name, this.envoySerialNumber, value);
          callback(null, value);
        });
      this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm)
        .on('get', (callback) => {
          let value = this.envoyNetworkWebComm;
          this.log.info('Device: %s %s, envoy: %s web communication: %s', this.host, this.name, this.envoySerialNumber, value);
          callback(null, value);
        });
      this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten)
        .on('get', (callback) => {
          let value = this.envoyEverReportedToEnlighten;
          this.log.info('Device: %s %s, envoy: %s report to enlighten: %s', this.host, this.name, this.envoySerialNumber, value);
          callback(null, value);
        });
      this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel)
        .on('get', (callback) => {
          let value = this.envoyCommNum + ' / ' + this.envoyCommLevel;
          this.log.info('Device: %s %s, envoy: %s communication devices and level: %s', this.host, this.name, this.envoySerialNumber, value);
          callback(null, value);
        });
      this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel)
        .on('get', (callback) => {
          let value = this.envoyCommPcuNum + ' / ' + this.envoyCommPcuLevel;
          this.log.info('Device: %s %s, envoy: %s communication Microinverters and level: %s', this.host, this.name, this.envoySerialNumber, value);
          callback(null, value);
        });
      this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel)
        .on('get', (callback) => {
          let value = this.envoyCommAcbNum + ' / ' + this.envoyCommAcbLevel;
          this.log.info('Device: %s %s, envoy: %s communication Encharges and level %s', this.host, this.name, this.envoySerialNumber, value);
          callback(null, value);
        });
      this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCommNsrbNumAndLevel)
        .on('get', (callback) => {
          let value = this.envoyCommNsrbNum + ' / ' + this.envoyCommNsrbLevel;
          this.log.info('Device: %s %s, envoy: %s communication qRelays and level: %s', this.host, this.name, this.envoySerialNumber, value);
          callback(null, value);
        });
      this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyUpdateStatus)
        .on('get', (callback) => {
          let value = this.envoyUpdateStatus;
          this.log.info('Device: %s %s, envoy: %s update status: %s', this.host, this.name, this.envoySerialNumber, value);
          callback(null, value);
        });
      this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyTimeZone)
        .on('get', (callback) => {
          let value = this.envoyTimeZone;
          this.log.info('Device: %s %s, envoy: %s time zone: %s', this.host, this.name, this.envoySerialNumber, value);
          callback(null, value);
        });
      this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime)
        .on('get', (callback) => {
          let value = this.envoyCurrentDate + ' ' + this.envoyCurrentTime;
          this.log.info('Device: %s %s, envoy: %s current date and time: %s', this.host, this.name, this.envoySerialNumber, value);
          callback(null, value);
        });
      this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporTime)
        .on('get', (callback) => {
          let value = this.envoyLastEnlightenReporTime;
          this.log.info('Device: %s %s, envoy: %s last report to enlighten: %s', this.host, this.name, this.envoySerialNumber, value);
          callback(null, value);
        });
      this.accessory.addService(this.enphaseServiceEnvoy);
    }

    //qrelay
    if (this.qRelaysCount > 0 && this.qrelaysDataOK) {
      for (let i = 0; i < this.qRelaysCount; i++) {
        this.enphaseServiceQrelay = new Service.enphaseDeviceQrelay('Q-Relay ' + this.qRelaysSerialNumber[i], 'enphaseServiceQrelay' + i);
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayState)
          .on('get', (callback) => {
            let value = this.qRelaysRelay[i];
            this.log.info('Device: %s %s, qrelay: %s relay: %s', this.host, this.name, this.qRelaysSerialNumber[i], value);
            callback(null, value);
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayProducing)
          .on('get', (callback) => {
            let value = this.qRelaysProducing[i];
            this.log.info('Device: %s %s, qrelay: %s producing: %s', this.host, this.name, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            callback(null, value);
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayCommunicating)
          .on('get', (callback) => {
            let value = this.qRelaysCommunicating[i];
            this.log.info('Device: %s %s, qrelay: %s communicating: %s', this.host, this.name, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            callback(null, value);
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayProvisioned)
          .on('get', (callback) => {
            let value = this.qRelaysProvisioned[i];
            this.log.info('Device: %s %s, qrelay: %s provisioned: %s', this.host, this.name, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            callback(null, value);
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayOperating)
          .on('get', (callback) => {
            let value = this.qRelaysOperating[i];
            this.log.info('Device: %s %s, qrelay: %s operating: %s', this.host, this.name, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            callback(null, value);
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayStatus)
          .on('get', (callback) => {
            let value = this.qRelaysStatus[i];
            if (value.length > 64) {
              value = value.substring(0, 64)
            }
            this.log.info('Device: %s %s, qrelay: %s status: %s', this.host, this.name, this.qRelaysSerialNumber[i], value);
            callback(null, value);
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayFirmware)
          .on('get', (callback) => {
            let value = this.qRelaysFirmware[i];
            this.log.info('Device: %s %s, qrelay: %s firmware: %s', this.host, this.name, this.qRelaysSerialNumber[i], value);
            if (value.length > 64) {
              value = value.substring(0, 64)
            }
            callback(null, value);
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayLastReportDate)
          .on('get', (callback) => {
            let value = this.qRelaysLastReportDate[i];
            this.log.info('Device: %s %s, qrelay: %s last report: %s', this.host, this.name, this.qRelaysSerialNumber[i], value);
            callback(null, value);
          });
        this.accessory.addService(this.enphaseServiceQrelay);
      }
    }

    //meters
    if (this.metersCount > 0 && this.metersDataOK) {
      for (let i = 0; i < this.metersCount; i++) {
        this.enphaseServiceMeter = new Service.enphaseDeviceMeters('Meter ' + this.metersMeasurementType[i], 'enphaseServiceMeter' + i);
        this.enphaseServiceMeter.getCharacteristic(Characteristic.enphaseDeviceMetersState)
          .on('get', (callback) => {
            let value = this.metersState[i];
            this.log.info('Device: %s %s, meter: %s state: %s', this.host, this.name, this.metersMeasurementType[i], value);
            callback(null, value);
          });
        this.enphaseServiceMeter.getCharacteristic(Characteristic.enphaseDeviceMetersPhaseMode)
          .on('get', (callback) => {
            let value = this.metersPhaseMode[i];
            this.log.info('Device: %s %s, meter: %s phase mode: %s', this.host, this.name, this.metersMeasurementType[i], value);
            callback(null, value);
          });
        this.enphaseServiceMeter.getCharacteristic(Characteristic.enphaseDeviceMetersPhaseCount)
          .on('get', (callback) => {
            let value = this.metersPhaseCount[i];
            this.log.info('Device: %s %s, meter: %s phase count: %s', this.host, this.name, this.metersMeasurementType[i], value);
            callback(null, value);
          });
        this.enphaseServiceMeter.getCharacteristic(Characteristic.enphaseDeviceMetersMeteringStatus)
          .on('get', (callback) => {
            let value = this.metersMeteringStatus[i];
            this.log.info('Device: %s %s, meter: %s metering status: %s', this.host, this.name, this.metersMeasurementType[i], value);
            callback(null, value);
          });
        this.enphaseServiceMeter.getCharacteristic(Characteristic.enphaseDeviceMetersStatusFlags)
          .on('get', (callback) => {
            let value = this.metersStatusFlags[i];
            this.log.info('Device: %s %s, meter: %s status flag: %s', this.host, this.name, this.metersMeasurementType[i], value);
            callback(null, value);
          });
        this.accessory.addService(this.enphaseServiceMeter);
      }
    }

    //encharge storage
    if (this.encharge > 0) {
      for (let i = 0; i < this.encharge; i++) {
        if (this.enchargesDataOK1) {
          this.enphaseServiceEncharge = new Service.enphaseDevice('Encharge storage', + this.enchargesSerialNumber[i], 'enphaseServiceEncharge' + i);
          this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseDevicePower)
            .on('get', (callback) => {
              let value = this.enchargesPower[i];
              this.log.info('Device: %s %s, power encharge %s storage: %s kW', this.host, this.name, this.enchargesSerialNumber[i], value.toFixed(3));
              callback(null, value);
            })
          this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseDeviceEnergyToday)
            .on('get', (callback) => {
              let value = this.enchargesPower[i];
              this.log.info('Device: %s %s, energy encharge %s storage: %s kWh', this.host, this.name, this.enchargesSerialNumber[i], value.toFixed(3));
              callback(null, value);
            })
          this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseDeviceState)
            .on('get', (callback) => {
              let value = this.enchargesState[i];
              this.log.info('Device: %s %s, encharge: %s state: %s', this.host, this.name, this.enchargesSerialNumber[i], value);
              callback(null, value);
            });
        }
        if (this.enchargesDataOK) {
          this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseDeviceProducing)
            .on('get', (callback) => {
              let value = this.enchargesProducing[i];
              this.log.info('Device: %s %s, encharge: %s producing: %s', this.host, this.name, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
              callback(null, value);
            });
          this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseDeviceCommunicating)
            .on('get', (callback) => {
              let value = this.enchargesCommunicating[i];
              this.log.info('Device: %s %s, encharge: %s communicating: %s', this.host, this.name, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
              callback(null, value);
            });
          this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseDeviceProvisioned)
            .on('get', (callback) => {
              let value = this.enchargesProvisioned[i];
              this.log.info('Device: %s %s, encharge: %s provisioned: %s', this.host, this.name, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
              callback(null, value);
            });
          this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseDeviceOperating)
            .on('get', (callback) => {
              let value = this.enchargesOperating[i];
              this.log.info('Device: %s %s, encharge: %s operating: %s', this.host, this.name, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
              callback(null, value);
            });
          this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseDeviceStatus)
            .on('get', (callback) => {
              let value = this.enchargesStatus[i];
              this.log.info('Device: %s %s, encharge: %s status: %s', this.host, this.name, this.enchargesSerialNumber[i], value);
              if (value.length > 64) {
                value = value.substring(0, 64)
              }
              callback(null, value);
            });
          this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseDeviceFirmware)
            .on('get', (callback) => {
              let value = this.enchargesFirmware[i];
              this.log.info('Device: %s %s, encharge: %s status: %s', this.host, this.name, this.enchargesSerialNumber[i], value);
              if (value.length > 64) {
                value = value.substring(0, 64)
              }
              callback(null, value);
            });
          this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseDeviceLastReportDate)
            .on('get', (callback) => {
              let value = this.enchargesLastReportDate[i];
              this.log.info('Device: %s %s, encharge: %s last report: %s', this.host, this.name, this.enchargesSerialNumber[i], value);
              callback(null, value);
            });
          this.accessory.addService(this.enphaseServiceEncharge);
        }
      }
    }

    //microinverter
    if (this.invertersCount > 0) {
      for (let i = 0; i < this.invertersCount; i++) {
        if (this.invertersDataOK1) {
          this.enphaseServiceMicronverter = new Service.enphaseDevice('Microinverter ' + this.invertersSerialNumber[i], 'enphaseServiceMicronverter' + i);
          this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseDevicePower)
            .on('get', (callback) => {
              let value = this.invertersLastPower[i];
              this.log.info('Device: %s %s, inverter: %s last power: %s W', this.host, this.name, this.invertersSerialNumber[i], value.toFixed(0));
              callback(null, value);
            });
          this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseDevicePowerMax)
            .on('get', (callback) => {
              let value = this.invertersMaxPower[i];
              this.log.info('Device: %s %s, inverter: %s max power: %s W', this.host, this.name, this.invertersSerialNumber[i], value.toFixed(0));
              callback(null, value);
            });
        }
        if (this.invertersDataOK) {
          this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseDeviceProducing)
            .on('get', (callback) => {
              let value = this.invertersProducing[i];
              this.log.info('Device: %s %s, inverter: %s producing: %s', this.host, this.name, this.invertersSerialNumber[i], value ? 'Yes' : 'No');
              callback(null, value);
            });
          this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseDeviceCommunicating)
            .on('get', (callback) => {
              let value = this.invertersCommunicating[i];
              this.log.info('Device: %s %s, inverter: %s communicating: %s', this.host, this.name, this.invertersSerialNumber[i], value ? 'Yes' : 'No');
              callback(null, value);
            });
          this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseDeviceProvisioned)
            .on('get', (callback) => {
              let value = this.invertersProvisioned[i];
              this.log.info('Device: %s %s, inverter: %s provisioned: %s', this.host, this.name, this.invertersSerialNumber[i], value ? 'Yes' : 'No');
              callback(null, value);
            });
          this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseDeviceOperating)
            .on('get', (callback) => {
              let value = this.invertersOperating[i];
              this.log.info('Device: %s %s, inverter: %s operating: %s', this.host, this.name, this.invertersSerialNumber[i], value ? 'Yes' : 'No');
              callback(null, value);
            });
          this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseDeviceStatus)
            .on('get', (callback) => {
              let value = this.invertersStatus[i];
              this.log.info('Device: %s %s, inverter: %s status: %s', this.host, this.name, this.invertersSerialNumber[i], value);
              if (value.length > 64) {
                value = value.substring(0, 64)
              }
              callback(null, value);
            });
          this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseDeviceFirmware)
            .on('get', (callback) => {
              let value = this.invertersFirmware[i];
              this.log.info('Device: %s %s, inverter: %s firmware: %s', this.host, this.name, this.invertersSerialNumber[i], value);
              if (value.length > 64) {
                value = value.substring(0, 64)
              }
              callback(null, value);
            });
          this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseDeviceLastReportDate)
            .on('get', (callback) => {
              let value = this.invertersLastReportDate[i];
              this.log.info('Device: %s %s, inverter: %s last report: %s', this.host, this.name, this.invertersSerialNumber[i], value);
              callback(null, value);
            });
        }
        this.accessory.addService(this.enphaseServiceMicronverter);
      }
    }
  }
}

