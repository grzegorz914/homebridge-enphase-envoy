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

const ENVOY_INFO_URL = '/info.xml';
const ENVOY_HOME_URL = '/home.json';
const ENVOY_INVENTORY_URL = '/inventory.json';
const ENVOY_PCU_COMM_CHECK_URL = '/installer/pcu_comm_check';
const ENVOY_DATABASE_EVENTS_URL = '/datatab/event_dt.rb?start=0&length=500';
const METERS_URL = '/ivp/meters';
const METERS_STREAM_DATA_URL = '/stream/meter';
const INVERTERS_STATUS_URL = '/installer/agf/inverters_status.json';
const PRODUCTION_CT_URL = '/production.json';
const PRODUCTION_CT_DETAILS_URL = '/production.json?details=1';
const PRODUCTION_INVERTERS_URL = '/api/v1/production/inverters?locale=en';
const PRODUCTION_INVERTERS_SUM_URL = '/api/v1/production';
const CONSUMPTION_SUMM_URL = '/api/v1/consumption';
const ADMIN_PMU_DISPLAY_URL = '/admin/lib/admin_pmu_display.json';
const ADMIN_TUNEL_OPEN_STATUS_URL = '/admin/lib/dba.json';
const ADMIN_PASSWD_CHANGE_STATUS_URL = '/admin/lib/security_display.json';
const ADMIN_TIME_ZONES_URL = '/admin/lib/date_time_display.json?tzlist=1&locale=en';
const ADMIN_LAN_SETTINGS_URL = '/admin/lib/network_display.json';
const ADMIN_WLAN_SETTINGS_URL = '/admin/lib/wireless_display.json';
const ENPHASE_PROV_DEVICES_URL = '/prov';
const ENPHASE_REPORT_SETTINGS_URL = '/ivp/peb/reportsettings';

const NETWORK_INTERFACE = ['eth0', 'wlan0', 'cellurar', 'undefined'];
const NETWORK_INTERFACE_1 = ['Ethernet', 'WiFi', 'Cellurar', 'Unknown'];
const ENERGY_TARIFF = ['single_rate', 'time_to_use', 'time_of_use', 'none', 'other', 'undefined'];
const ENERGY_TARIFF_1 = ['Single rate', 'Time to use', 'Time of use', 'Not defined', 'Other', 'Unknown'];
const ENCHARGE_STATE = ['idle', 'discharging', 'charging', 'undefined'];
const ENCHARGE_STATE_1 = ['Idle', 'Discharging', 'Charging', 'Unknown'];
const ENVOY_UPDATE = ['satisfied', 'not-satisfied', 'undefined'];
const ENVOY_UPDATE_1 = ['Satisfied', 'Not satisfied', 'Unknown'];

const ENVOY_STATUS_CODE = ['undefined',
  'error.nodata', 'envoy.global.ok', 'envoy.cond_flags.acb_ctrl.bmuhardwareerror', 'envoy.cond_flags.acb_ctrl.bmuimageerror', 'envoy.cond_flags.acb_ctrl.bmumaxcurrentwarning', 'envoy.cond_flags.acb_ctrl.bmusenseerror', 'envoy.cond_flags.acb_ctrl.cellmaxtemperror',
  'envoy.cond_flags.acb_ctrl.cellmaxtempwarning', 'envoy.cond_flags.acb_ctrl.cellmaxvoltageerror', 'envoy.cond_flags.acb_ctrl.cellmaxvoltagewarning', 'envoy.cond_flags.acb_ctrl.cellmintemperror', 'envoy.cond_flags.acb_ctrl.cellmintempwarning',
  'envoy.cond_flags.acb_ctrl.cellminvoltageerror', 'envoy.cond_flags.acb_ctrl.cellminvoltagewarning', 'envoy.cond_flags.acb_ctrl.cibcanerror', 'envoy.cond_flags.acb_ctrl.cibimageerror', 'envoy.cond_flags.acb_ctrl.cibspierror',
  'envoy.cond_flags.obs_strs.discovering', 'envoy.cond_flags.obs_strs.failure', 'envoy.cond_flags.obs_strs.flasherror', 'envoy.cond_flags.obs_strs.notmonitored', 'envoy.cond_flags.obs_strs.ok', 'envoy.cond_flags.obs_strs.plmerror',
  'envoy.cond_flags.obs_strs.secmodeenterfailure', 'envoy.cond_flags.obs_strs.secmodeexitfailure', 'envoy.cond_flags.obs_strs.sleeping', 'envoy.cond_flags.pcu_chan.acMonitorError', 'envoy.cond_flags.pcu_chan.acfrequencyhigh',
  'envoy.cond_flags.pcu_chan.acfrequencylow', 'envoy.cond_flags.pcu_chan.acfrequencyoor', 'envoy.cond_flags.pcu_chan.acvoltage_avg_hi', 'envoy.cond_flags.pcu_chan.acvoltagehigh', 'envoy.cond_flags.pcu_chan.acvoltagelow',
  'envoy.cond_flags.pcu_chan.acvoltageoor', 'envoy.cond_flags.pcu_chan.acvoltageoosp1', 'envoy.cond_flags.pcu_chan.acvoltageoosp2', 'envoy.cond_flags.pcu_chan.acvoltageoosp3', 'envoy.cond_flags.pcu_chan.agfpowerlimiting',
  'envoy.cond_flags.pcu_chan.dcresistancelow', 'envoy.cond_flags.pcu_chan.dcresistancelowpoweroff', 'envoy.cond_flags.pcu_chan.dcvoltagetoohigh', 'envoy.cond_flags.pcu_chan.dcvoltagetoolow', 'envoy.cond_flags.pcu_chan.dfdt', 'envoy.cond_flags.pcu_chan.gfitripped',
  'envoy.cond_flags.pcu_chan.gridgone', 'envoy.cond_flags.pcu_chan.gridinstability', 'envoy.cond_flags.pcu_chan.gridoffsethi', 'envoy.cond_flags.pcu_chan.gridoffsetlow', 'envoy.cond_flags.pcu_chan.hardwareError', 'envoy.cond_flags.pcu_chan.hardwareWarning',
  'envoy.cond_flags.pcu_chan.highskiprate', 'envoy.cond_flags.pcu_chan.invalidinterval', 'envoy.cond_flags.pcu_chan.pwrgenoffbycmd', 'envoy.cond_flags.pcu_chan.skippedcycles', 'envoy.cond_flags.pcu_chan.vreferror', 'envoy.cond_flags.pcu_ctrl.alertactive',
  'envoy.cond_flags.pcu_ctrl.altpwrgenmode', 'envoy.cond_flags.pcu_ctrl.altvfsettings', 'envoy.cond_flags.pcu_ctrl.badflashimage', 'envoy.cond_flags.pcu_ctrl.bricked', 'envoy.cond_flags.pcu_ctrl.commandedreset', 'envoy.cond_flags.pcu_ctrl.criticaltemperature',
  'envoy.cond_flags.pcu_ctrl.dc-pwr-low', 'envoy.cond_flags.pcu_ctrl.iuplinkproblem', 'envoy.cond_flags.pcu_ctrl.manutestmode', 'envoy.cond_flags.pcu_ctrl.nsync', 'envoy.cond_flags.pcu_ctrl.overtemperature', 'envoy.cond_flags.pcu_ctrl.poweronreset',
  'envoy.cond_flags.pcu_ctrl.pwrgenoffbycmd', 'envoy.cond_flags.pcu_ctrl.runningonac', 'envoy.cond_flags.pcu_ctrl.tpmtest', 'envoy.cond_flags.pcu_ctrl.unexpectedreset', 'envoy.cond_flags.pcu_ctrl.watchdogreset', 'envoy.cond_flags.rgm_chan.check_meter',
  'envoy.cond_flags.rgm_chan.power_quality'
]
const ENVOY_STATUS_CODE_1 = ['Unknown', 'No Data', 'Normal', 'BMU Hardware Error', 'BMU Image Error', 'BMU Max Current Warning', 'BMU Sense Error', 'Cell Max Temperature Error', 'Cell Max Temperature Warning', 'Cell Max Voltage Error',
  'Cell Max Voltage Warning', 'Cell Min Temperature Error', 'Cell Min Temperature Warning', 'Cell Min Voltage Error', 'Cell Min Voltage Warning', 'CIB CAN Error', 'CIB Image Error', 'CIB SPI Error', 'Discovering', 'Failure to report',
  'Flash Error', 'Not Monitored', 'Normal', 'PLM Error', 'Secure mode enter failure', 'Secure mode exit failure', 'Sleeping', 'AC Monitor Error', 'AC Frequency High', 'AC Frequency Low', 'AC Frequency Out Of Range', 'AC Voltage Average High',
  'AC Voltage High', 'AC Voltage Low', 'AC Voltage Out Of Range', 'AC Voltage Out Of Range - Phase 1', 'AC Voltage Out Of Range - Phase 2', 'AC Voltage Out Of Range - Phase 3', 'AGF Power Limiting', 'DC Resistance Low', 'DC Resistance Low - Power Off',
  'DC Voltage Too High', 'DC Voltage Too Low', 'AC Frequency Changing too Fast', 'GFI Tripped', 'Grid Gone', 'Grid Instability', 'Grid Offset Hi', 'Grid Offset Low', 'Hardware Error', 'Hardware Warning', 'High Skip Rate', 'Invalid Interval',
  'Power generation off by command', 'Skipped Cycles', 'Voltage Ref Error', 'Alert Active', 'Alternate Power Generation Mode', 'Alternate Voltage and Frequency Settings', 'Bad Flash Image', 'No Grid Profile', 'Commanded Reset', 'Critical Temperature',
  'DC Power Too Low', 'IUP Link Problem', 'In Manu Test Mode', 'Grid Perturbation Unsynchronized', 'Over Temperature', 'Power On Reset', 'Power generation off by command', 'Running on AC', 'Transient Grid Profile', 'Unexpected Reset', 'Watchdog Reset',
  'Meter Error', 'Poor Power Quality'
]

let Accessory, Characteristic, Service, Categories, UUID;

module.exports = (api) => {
  Accessory = api.platformAccessory;
  Characteristic = api.hap.Characteristic;
  Service = api.hap.Service;
  Categories = api.hap.Categories;
  UUID = api.hap.uuid;

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
  Characteristic.enphaseEnvoyAllerts.UUID = '00001111-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyPrimaryInterface = function () {
    Characteristic.call(this, 'Network interface', Characteristic.enphaseEnvoyPrimaryInterface.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyPrimaryInterface, Characteristic);
  Characteristic.enphaseEnvoyPrimaryInterface.UUID = '00001112-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyNetworkWebComm = function () {
    Characteristic.call(this, 'Web communication', Characteristic.enphaseEnvoyNetworkWebComm.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyNetworkWebComm, Characteristic);
  Characteristic.enphaseEnvoyNetworkWebComm.UUID = '00001113-000B-1000-8000-0026BB765291';


  Characteristic.enphaseEnvoyEverReportedToEnlighten = function () {
    Characteristic.call(this, 'Report to Enlighten', Characteristic.enphaseEnvoyEverReportedToEnlighten.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyEverReportedToEnlighten, Characteristic);
  Characteristic.enphaseEnvoyEverReportedToEnlighten.UUID = '00001114-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCommNumAndLevel = function () {
    Characteristic.call(this, 'Devices and level', Characteristic.enphaseEnvoyCommNumAndLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCommNumAndLevel, Characteristic);
  Characteristic.enphaseEnvoyCommNumAndLevel.UUID = '00001115-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCommNumNsrbAndLevel = function () {
    Characteristic.call(this, 'Q-Relays and level', Characteristic.enphaseEnvoyCommNumNsrbAndLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCommNumNsrbAndLevel, Characteristic);
  Characteristic.enphaseEnvoyCommNumNsrbAndLevel.UUID = '00001116-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCommNumAcbAndLevel = function () {
    Characteristic.call(this, 'Encharges and level', Characteristic.enphaseEnvoyCommNumAcbAndLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCommNumAcbAndLevel, Characteristic);
  Characteristic.enphaseEnvoyCommNumAcbAndLevel.UUID = '00001211-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCommNumPcuAndLevel = function () {
    Characteristic.call(this, 'Microinverters and level', Characteristic.enphaseEnvoyCommNumPcuAndLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCommNumPcuAndLevel, Characteristic);
  Characteristic.enphaseEnvoyCommNumPcuAndLevel.UUID = '00001212-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyDbSize = function () {
    Characteristic.call(this, 'DB size', Characteristic.enphaseEnvoyDbSize.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyDbSize, Characteristic);
  Characteristic.enphaseEnvoyDbSize.UUID = '00001213-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyTariff = function () {
    Characteristic.call(this, 'Tariff', Characteristic.enphaseEnvoyTariff.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyTariff, Characteristic);
  Characteristic.enphaseEnvoyTariff.UUID = '00001214-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyUpdateStatus = function () {
    Characteristic.call(this, 'Update status', Characteristic.enphaseEnvoyUpdateStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyUpdateStatus, Characteristic);
  Characteristic.enphaseEnvoyUpdateStatus.UUID = '00001215-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyTimeZone = function () {
    Characteristic.call(this, 'Time Zone', Characteristic.enphaseEnvoyTimeZone.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyTimeZone, Characteristic);
  Characteristic.enphaseEnvoyTimeZone.UUID = '00001216-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCurrentDateTime = function () {
    Characteristic.call(this, 'Local time', Characteristic.enphaseEnvoyCurrentDateTime.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCurrentDateTime, Characteristic);
  Characteristic.enphaseEnvoyCurrentDateTime.UUID = '00001311-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyLastEnlightenReporDate = function () {
    Characteristic.call(this, 'Last report to Enlighten', Characteristic.enphaseEnvoyLastEnlightenReporDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyLastEnlightenReporDate, Characteristic);
  Characteristic.enphaseEnvoyLastEnlightenReporDate.UUID = '00001312-000B-1000-8000-0026BB765291';

  //power production service
  Service.enphaseEnvoy = function (displayName, subtype) {
    Service.call(this, displayName, Service.enphaseEnvoy.UUID, subtype);
    // Mandatory Characteristics
    this.addCharacteristic(Characteristic.enphaseEnvoyAllerts);
    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyDbSize);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyTariff);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyUpdateStatus);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyTimeZone);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime);
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporDate);
  };
  inherits(Service.enphaseEnvoy, Service);
  Service.enphaseEnvoy.UUID = '00000001-000A-1000-8000-0026BB765291';

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
  Characteristic.enphaseQrelayState.UUID = '00002111-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayLinesCount = function () {
    Characteristic.call(this, 'Lines', Characteristic.enphaseQrelayLinesCount.UUID);
    this.setProps({
      format: Characteristic.Formats.INT,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayLinesCount, Characteristic);
  Characteristic.enphaseQrelayLinesCount.UUID = '00002112-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayLine1Connected = function () {
    Characteristic.call(this, 'Line 1', Characteristic.enphaseQrelayLine1Connected.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayLine1Connected, Characteristic);
  Characteristic.enphaseQrelayLine1Connected.UUID = '00003113-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayLine2Connected = function () {
    Characteristic.call(this, 'Line 2', Characteristic.enphaseQrelayLine2Connected.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayLine2Connected, Characteristic);
  Characteristic.enphaseQrelayLine2Connected.UUID = '00002114-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayLine3Connected = function () {
    Characteristic.call(this, 'Line 3', Characteristic.enphaseQrelayLine3Connected.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayLine3Connected, Characteristic);
  Characteristic.enphaseQrelayLine3Connected.UUID = '00002115-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayProducing = function () {
    Characteristic.call(this, 'Producing', Characteristic.enphaseQrelayProducing.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayProducing, Characteristic);
  Characteristic.enphaseQrelayProducing.UUID = '00002116-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayCommunicating = function () {
    Characteristic.call(this, 'Communicating', Characteristic.enphaseQrelayCommunicating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayCommunicating, Characteristic);
  Characteristic.enphaseQrelayCommunicating.UUID = '00002211-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayProvisioned = function () {
    Characteristic.call(this, 'Provisioned', Characteristic.enphaseQrelayProvisioned.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayProvisioned, Characteristic);
  Characteristic.enphaseQrelayProvisioned.UUID = '00002212-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayOperating = function () {
    Characteristic.call(this, 'Operating', Characteristic.enphaseQrelayOperating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayOperating, Characteristic);
  Characteristic.enphaseQrelayOperating.UUID = '00002213-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayCommLevel = function () {
    Characteristic.call(this, 'Comm level', Characteristic.enphaseQrelayCommLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      unit: '',
      minValue: 0,
      maxValue: 100,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayCommLevel, Characteristic);
  Characteristic.enphaseQrelayCommLevel.UUID = '00002214-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayStatus = function () {
    Characteristic.call(this, 'Status', Characteristic.enphaseQrelayStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayStatus, Characteristic);
  Characteristic.enphaseQrelayStatus.UUID = '00002215-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayFirmware = function () {
    Characteristic.call(this, 'Firmware', Characteristic.enphaseQrelayFirmware.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayFirmware, Characteristic);
  Characteristic.enphaseQrelayFirmware.UUID = '00002216-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayLastReportDate = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseQrelayLastReportDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayLastReportDate, Characteristic);
  Characteristic.enphaseQrelayLastReportDate.UUID = '00002311-000B-1000-8000-0026BB765291';

  //qrelay service
  Service.enphaseQrelay = function (displayName, subtype) {
    Service.call(this, displayName, Service.enphaseQrelay.UUID, subtype);
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
  };
  inherits(Service.enphaseQrelay, Service);
  Service.enphaseQrelay.UUID = '00000002-000A-1000-8000-0026BB765291';

  //enphase current meters
  Characteristic.enphaseMeterState = function () {
    Characteristic.call(this, 'Status', Characteristic.enphaseMeterState.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterState, Characteristic);
  Characteristic.enphaseMeterState.UUID = '00003111-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterMeasurementType = function () {
    Characteristic.call(this, 'Meter type', Characteristic.enphaseMeterMeasurementType.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterMeasurementType, Characteristic);
  Characteristic.enphaseMeterMeasurementType.UUID = '00003112-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterPhaseCount = function () {
    Characteristic.call(this, 'Phase count', Characteristic.enphaseMeterPhaseCount.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterPhaseCount, Characteristic);
  Characteristic.enphaseMeterPhaseCount.UUID = '00003113-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterPhaseMode = function () {
    Characteristic.call(this, 'Phase mode', Characteristic.enphaseMeterPhaseMode.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterPhaseMode, Characteristic);
  Characteristic.enphaseMeterPhaseMode.UUID = '00003114-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterMeteringStatus = function () {
    Characteristic.call(this, 'Metering status', Characteristic.enphaseMeterMeteringStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterMeteringStatus, Characteristic);
  Characteristic.enphaseMeterMeteringStatus.UUID = '00003115-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterStatusFlags = function () {
    Characteristic.call(this, 'Status flag', Characteristic.enphaseMeterStatusFlags.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterStatusFlags, Characteristic);
  Characteristic.enphaseMeterStatusFlags.UUID = '00003116-000B-1000-8000-0026BB765291';

  //current meters service
  Service.enphaseMeter = function (displayName, subtype) {
    Service.call(this, displayName, Service.enphaseMeter.UUID, subtype);
    // Mandatory Characteristics
    this.addCharacteristic(Characteristic.enphaseMeterState);
    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.enphaseMeterPhaseMode);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterPhaseCount);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterMeasurementType);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterMeteringStatus);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterStatusFlags);
  };
  inherits(Service.enphaseMeter, Service);
  Service.enphaseMeter.UUID = '00000003-000A-1000-8000-0026BB765291';

  //Envoy production/consumption characteristics
  Characteristic.enphasePower = function () {
    Characteristic.call(this, 'Power', Characteristic.enphasePower.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kW',
      minValue: -1000,
      maxValue: 1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphasePower, Characteristic);
  Characteristic.enphasePower.UUID = '00004111-000B-1000-8000-0026BB765291';

  Characteristic.enphasePowerMax = function () {
    Characteristic.call(this, 'Power max', Characteristic.enphasePowerMax.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kW',
      minValue: -1000,
      maxValue: 1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphasePowerMax, Characteristic);
  Characteristic.enphasePowerMax.UUID = '00004112-000B-1000-8000-0026BB765291';

  Characteristic.enphasePowerMaxDetected = function () {
    Characteristic.call(this, 'Power max detected', Characteristic.enphasePowerMaxDetected.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphasePowerMaxDetected, Characteristic);
  Characteristic.enphasePowerMaxDetected.UUID = '00004113-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseEnergyToday.UUID = '00004114-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseEnergyLastSevenDays.UUID = '00004115-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnergyLifetime = function () {
    Characteristic.call(this, 'Energy lifetime', Characteristic.enphaseEnergyLifetime.UUID);
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
  Characteristic.enphaseEnergyLifetime.UUID = '00004116-000B-1000-8000-0026BB765291';

  Characteristic.enphaseRmsCurrent = function () {
    Characteristic.call(this, 'Current', Characteristic.enphaseRmsCurrent.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'A',
      minValue: -1000,
      maxValue: 1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseRmsCurrent, Characteristic);
  Characteristic.enphaseRmsCurrent.UUID = '00004211-000B-1000-8000-0026BB765291';

  Characteristic.enphaseRmsVoltage = function () {
    Characteristic.call(this, 'Voltage', Characteristic.enphaseRmsVoltage.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'V',
      minValue: 0,
      maxValue: 1000,
      minStep: 0.1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseRmsVoltage, Characteristic);
  Characteristic.enphaseRmsVoltage.UUID = '00004212-000B-1000-8000-0026BB765291';

  Characteristic.enphaseReactivePower = function () {
    Characteristic.call(this, 'Reactive power', Characteristic.enphaseReactivePower.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kVAr',
      minValue: -1000,
      maxValue: 1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseReactivePower, Characteristic);
  Characteristic.enphaseReactivePower.UUID = '00004213-000B-1000-8000-0026BB765291';

  Characteristic.enphaseApparentPower = function () {
    Characteristic.call(this, 'Apparent power', Characteristic.enphaseApparentPower.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kVA',
      minValue: -1000,
      maxValue: 1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseApparentPower, Characteristic);
  Characteristic.enphaseApparentPower.UUID = '00004214-000B-1000-8000-0026BB765291';

  Characteristic.enphasePwrFactor = function () {
    Characteristic.call(this, 'Power factor', Characteristic.enphasePwrFactor.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'cos φ',
      minValue: -1,
      maxValue: 1,
      minStep: 0.01,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphasePwrFactor, Characteristic);
  Characteristic.enphasePwrFactor.UUID = '00004215-000B-1000-8000-0026BB765291';

  Characteristic.enphaseReadingTime = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseReadingTime.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseReadingTime, Characteristic);
  Characteristic.enphaseReadingTime.UUID = '00004216-000B-1000-8000-0026BB765291';

  //power production service
  Service.enphasePowerEnergyMeter = function (displayName, subtype) {
    Service.call(this, displayName, Service.enphasePowerEnergyMeter.UUID, subtype);
    // Mandatory Characteristics
    this.addCharacteristic(Characteristic.enphasePower);
    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.enphasePowerMax);
    this.addOptionalCharacteristic(Characteristic.enphasePowerMaxDetected);
    this.addOptionalCharacteristic(Characteristic.enphaseEnergyToday);
    this.addOptionalCharacteristic(Characteristic.enphaseEnergyLastSevenDays);
    this.addOptionalCharacteristic(Characteristic.enphaseEnergyLifetime);
    this.addOptionalCharacteristic(Characteristic.enphaseRmsCurrent);
    this.addOptionalCharacteristic(Characteristic.enphaseRmsVoltage);
    this.addOptionalCharacteristic(Characteristic.enphaseReactivePower);
    this.addOptionalCharacteristic(Characteristic.enphaseApparentPower);
    this.addOptionalCharacteristic(Characteristic.enphasePwrFactor);
    this.addOptionalCharacteristic(Characteristic.enphaseReadingTime);
  };
  inherits(Service.enphasePowerEnergyMeter, Service);
  Service.enphasePowerEnergyMeter.UUID = '00000004-000A-1000-8000-0026BB765291';

  //Encharge
  Characteristic.enphaseEnchargePower = function () {
    Characteristic.call(this, 'Power', Characteristic.enphaseEnchargePower.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kW',
      minValue: 0,
      maxValue: 1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargePower, Characteristic);
  Characteristic.enphaseEnchargePower.UUID = '00005111-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeEnergy = function () {
    Characteristic.call(this, 'Energy', Characteristic.enphaseEnchargeEnergy.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kWh',
      minValue: 0,
      maxValue: 1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeEnergy, Characteristic);
  Characteristic.enphaseEnchargeEnergy.UUID = '00005112-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargePercentFull = function () {
    Characteristic.call(this, 'Percent full', Characteristic.enphaseEnchargePercentFull.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      unit: '%',
      minValue: 0,
      maxValue: 100,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargePercentFull, Characteristic);
  Characteristic.enphaseEnchargePercentFull.UUID = '00005113-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeActiveCount = function () {
    Characteristic.call(this, 'Devices count', Characteristic.enphaseEnchargeActiveCount.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      unit: '',
      minValue: 0,
      maxValue: 255,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeActiveCount, Characteristic);
  Characteristic.enphaseEnchargeActiveCount.UUID = '00005114-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeState = function () {
    Characteristic.call(this, 'State', Characteristic.enphaseEnchargeState.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeState, Characteristic);
  Characteristic.enphaseEnchargeState.UUID = '00005115-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeReadingTime = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseEnchargeReadingTime.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeReadingTime, Characteristic);
  Characteristic.enphaseEnchargeReadingTime.UUID = '00005116-000B-1000-8000-0026BB765291';

  //Encharge service
  Service.enphaseEnchargePowerAndEnergy = function (displayName, subtype) {
    Service.call(this, displayName, Service.enphaseEnchargePowerAndEnergy.UUID, subtype);
    // Mandatory Characteristics
    this.addCharacteristic(Characteristic.enphaseEnchargePower);
    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargeEnergy);
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargePercentFull);
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargeActiveCount);
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargeState);
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargeReadingTime);
  };
  inherits(Service.enphaseEnchargePowerAndEnergy, Service);
  Service.enphaseEnchargePowerAndEnergy.UUID = '00000005-000A-1000-8000-0026BB765291';

  //Encharge
  Characteristic.enphaseEnchargeChargeStatus = function () {
    Characteristic.call(this, 'Charge status', Characteristic.enphaseEnchargeChargeStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeChargeStatus, Characteristic);
  Characteristic.enphaseEnchargeChargeStatus.UUID = '00006111-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeProducing = function () {
    Characteristic.call(this, 'Producing', Characteristic.enphaseEnchargeProducing.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeProducing, Characteristic);
  Characteristic.enphaseEnchargeProducing.UUID = '00006112-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeCommunicating = function () {
    Characteristic.call(this, 'Communicating', Characteristic.enphaseEnchargeCommunicating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeCommunicating, Characteristic);
  Characteristic.enphaseEnchargeCommunicating.UUID = '00006113-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeProvisioned = function () {
    Characteristic.call(this, 'Provisioned', Characteristic.enphaseEnchargeProvisioned.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeProvisioned, Characteristic);
  Characteristic.enphaseEnchargeProvisioned.UUID = '00006114-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeOperating = function () {
    Characteristic.call(this, 'Operating', Characteristic.enphaseEnchargeOperating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeOperating, Characteristic);
  Characteristic.enphaseEnchargeOperating.UUID = '00006115-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeCommLevel = function () {
    Characteristic.call(this, 'Comm level', Characteristic.enphaseEnchargeCommLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      unit: '',
      minValue: 0,
      maxValue: 100,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeCommLevel, Characteristic);
  Characteristic.enphaseEnchargeCommLevel.UUID = '00006116-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeSleepEnabled = function () {
    Characteristic.call(this, 'Sleep enabled', Characteristic.enphaseEnchargeSleepEnabled.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeSleepEnabled, Characteristic);
  Characteristic.enphaseEnchargeSleepEnabled.UUID = '00006211-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargePercentFull = function () {
    Characteristic.call(this, 'Percent full', Characteristic.enphaseEnchargePercentFull.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      unit: '%',
      minValue: 0,
      maxValue: 100,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargePercentFull, Characteristic);
  Characteristic.enphaseEnchargePercentFull.UUID = '00006212-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeMaxCellTemp = function () {
    Characteristic.call(this, 'Max cell temp', Characteristic.enphaseEnchargeMaxCellTemp.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: '°C',
      minValue: 0,
      maxValue: 100,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeMaxCellTemp, Characteristic);
  Characteristic.enphaseEnchargeMaxCellTemp.UUID = '00006213-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeSleepMinSoc = function () {
    Characteristic.call(this, 'Sleep min soc', Characteristic.enphaseEnchargeSleepMinSoc.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      unit: 'min',
      minValue: 0,
      maxValue: 100,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeSleepMinSoc, Characteristic);
  Characteristic.enphaseEnchargeSleepMinSoc.UUID = '00006214-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeSleepMaxSoc = function () {
    Characteristic.call(this, 'Sleep max soc', Characteristic.enphaseEnchargeSleepMaxSoc.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      unit: 'min',
      minValue: 0,
      maxValue: 100,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeSleepMaxSoc, Characteristic);
  Characteristic.enphaseEnchargeSleepMaxSoc.UUID = '00006215-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeStatus = function () {
    Characteristic.call(this, 'Status', Characteristic.enphaseEnchargeStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeStatus, Characteristic);
  Characteristic.enphaseEnchargeStatus.UUID = '00006216-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeFirmware = function () {
    Characteristic.call(this, 'Firmware', Characteristic.enphaseEnchargeFirmware.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeFirmware, Characteristic);
  Characteristic.enphaseEnchargeFirmware.UUID = '00006311-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeLastReportDate = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseEnchargeLastReportDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeLastReportDate, Characteristic);
  Characteristic.enphaseEnchargeLastReportDate.UUID = '00006312-000B-1000-8000-0026BB765291';

  //Encharge service
  Service.enphaseEncharge = function (displayName, subtype) {
    Service.call(this, displayName, Service.enphaseEncharge.UUID, subtype);
    // Mandatory Characteristics
    this.addCharacteristic(Characteristic.enphaseEnchargeChargeStatus);
    // Optional Characteristics
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargeProducing);
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargeCommunicating);
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargeProvisioned);
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargeOperating);
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargeCommLevel);
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargeSleepEnabled);
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargePercentFull);
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargeMaxCellTemp);
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargeSleepMinSoc);
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargeSleepMaxSoc);
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargeStatus);
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargeFirmware);
    this.addOptionalCharacteristic(Characteristic.enphaseEnchargeLastReportDate);
  };
  inherits(Service.enphaseEncharge, Service);
  Service.enphaseEncharge.UUID = '00000006-000A-1000-8000-0026BB765291';

  //Microinverter
  Characteristic.enphaseMicroinverterPower = function () {
    Characteristic.call(this, 'Power', Characteristic.enphaseMicroinverterPower.UUID);
    this.setProps({
      format: Characteristic.Formats.INT,
      unit: 'W',
      minValue: 0,
      maxValue: 1000,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterPower, Characteristic);
  Characteristic.enphaseMicroinverterPower.UUID = '00007111-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterPowerMax = function () {
    Characteristic.call(this, 'Power max', Characteristic.enphaseMicroinverterPowerMax.UUID);
    this.setProps({
      format: Characteristic.Formats.INT,
      unit: 'W',
      minValue: 0,
      maxValue: 1000,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterPowerMax, Characteristic);
  Characteristic.enphaseMicroinverterPowerMax.UUID = '00007112-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterProducing = function () {
    Characteristic.call(this, 'Producing', Characteristic.enphaseMicroinverterProducing.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterProducing, Characteristic);
  Characteristic.enphaseMicroinverterProducing.UUID = '00007113-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterCommunicating = function () {
    Characteristic.call(this, 'Communicating', Characteristic.enphaseMicroinverterCommunicating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterCommunicating, Characteristic);
  Characteristic.enphaseMicroinverterCommunicating.UUID = '00007114-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterProvisioned = function () {
    Characteristic.call(this, 'Provisioned', Characteristic.enphaseMicroinverterProvisioned.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterProvisioned, Characteristic);
  Characteristic.enphaseMicroinverterProvisioned.UUID = '00007115-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterOperating = function () {
    Characteristic.call(this, 'Operating', Characteristic.enphaseMicroinverterOperating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterOperating, Characteristic);
  Characteristic.enphaseMicroinverterOperating.UUID = '00007116-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterCommLevel = function () {
    Characteristic.call(this, 'Comm level', Characteristic.enphaseMicroinverterCommLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      unit: '',
      minValue: 0,
      maxValue: 100,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterCommLevel, Characteristic);
  Characteristic.enphaseMicroinverterCommLevel.UUID = '00007211-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterStatus = function () {
    Characteristic.call(this, 'Status', Characteristic.enphaseMicroinverterStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterStatus, Characteristic);
  Characteristic.enphaseMicroinverterStatus.UUID = '00007212-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterFirmware = function () {
    Characteristic.call(this, 'Firmware', Characteristic.enphaseMicroinverterFirmware.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterFirmware, Characteristic);
  Characteristic.enphaseMicroinverterFirmware.UUID = '00007213-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterLastReportDate = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseMicroinverterLastReportDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterLastReportDate, Characteristic);
  Characteristic.enphaseMicroinverterLastReportDate.UUID = '00007214-000B-1000-8000-0026BB765291';

  //devices service
  Service.enphaseMicroinverter = function (displayName, subtype) {
    Service.call(this, displayName, Service.enphaseMicroinverter.UUID, subtype);
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
  };
  inherits(Service.enphaseMicroinverter, Service);
  Service.enphaseMicroinverter.UUID = '00000007-000A-1000-8000-0026BB765291';

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
    this.refreshInterval = config.refreshInterval || 5;
    this.disableLogInfo = config.disableLogInfo;
    this.envoyUser = config.envoyUser || 'envoy';
    this.envoyPasswd = config.envoyPasswd;
    this.installerUser = config.installerUser || 'installer';
    this.installerPasswd = config.installerPasswd;
    this.enchargeStorageOffset = config.enchargeStorageOffset || 0;
    this.productionPowerMaxDetected = config.powerProductionMaxDetected || 0;
    this.productionEnergyLifetimeOffset = config.energyProductionLifetimeOffset || 0;
    this.consumptionTotalPowerMaxDetected = config.powerConsumptionTotalMaxDetected || 0;
    this.consumptionTotalEnergyLifetimeOffset = config.energyConsumptionTotalLifetimeOffset || 0;
    this.consumptionNetPowerMaxDetected = config.powerConsumptionNetMaxDetected || 0;
    this.consumptionNetEnergyLifetimeOffset = config.energyConsumptionNetLifetimeOffset || 0;

    //get Device info
    this.manufacturer = config.manufacturer || 'Enphase';
    this.modelName = config.modelName || 'Envoy';

    //setup variables
    this.checkDeviceInfo = false;
    this.checkDeviceState = false;
    this.checkCommLevel = false;
    this.checkMicroinvertersPower = false;
    this.startPrepareAccessory = true;

    this.envoySerialNumber = '';
    this.envoyFirmware = '';
    this.envoySoftwareBuildEpoch = 0;
    this.envoyIsEnvoy = false;
    this.envoyAllerts = '';
    this.envoyDbSize = 0;
    this.envoyDbPercentFull = 0;
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
    this.envoyLastEnlightenReporDate = 0;

    this.metersCount = 0;
    this.metersProduction = false;
    this.metersConsumption = false;
    this.metersProductionActiveCount = 0;
    this.metersConsumtionTotalActiveCount = 0;
    this.metersConsumptionNetActiveCount = 0;

    this.metersStreamData = false;
    this.metersStreamDataProductionActivePowerL1 = 0;
    this.metersStreamDataProductionActivePowerL2 = 0;
    this.metersStreamDataProductionActivePowerL3 = 0;
    this.metersStreamDataProductionReactivePowerL1 = 0;
    this.metersStreamDataProductionReactivePowerL2 = 0;
    this.metersStreamDataProductionReactivePowerL3 = 0;
    this.metersStreamDataProductionApparentPowerL1 = 0;
    this.metersStreamDataProductionApparentPowerL2 = 0;
    this.metersStreamDataProductionApparentPowerL3 = 0;
    this.metersStreamDataProductionVoltageL1 = 0;
    this.metersStreamDataProductionVoltageL2 = 0;
    this.metersStreamDataProductionVoltageL3 = 0;
    this.metersStreamDataProductionCurrentL1 = 0;
    this.metersStreamDataProductionCurrentL2 = 0;
    this.metersStreamDataProductionCurrentL3 = 0;
    this.metersStreamDataProductionPowerFactorL1 = 0;
    this.metersStreamDataProductionPowerFactorL2 = 0;
    this.metersStreamDataProductionPowerFactorL3 = 0;
    this.metersStreamDataProductionFrequencyL1 = 0;
    this.metersStreamDataProductionFrequencyL2 = 0;
    this.metersStreamDataProductionFrequencyL3 = 0;

    this.metersStreamDataProductionActivePowerSum = 0;
    this.metersStreamDataProductionReactivePowerSum = 0;
    this.metersStreamDataProductionApparentPowerSum = 0;
    this.metersStreamDataProductionVoltageAvg = 0;
    this.metersStreamDataProductionCurrentSum = 0;
    this.metersStreamDataProductionPowerFactorAvg = 0;
    this.metersStreamDataProductionFrequencyAvg = 0;

    this.metersStreamDataConsumptionNetActivePowerL1 = 0;
    this.metersStreamDataConsumptionNetActivePowerL2 = 0;
    this.metersStreamDataConsumptionNetActivePowerL3 = 0;
    this.metersStreamDataConsumptionNetReactivePowerL1 = 0;
    this.metersStreamDataConsumptionNetReactivePowerL2 = 0;
    this.metersStreamDataConsumptionNetReactivePowerL3 = 0;
    this.metersStreamDataConsumptionNetApparentPowerL1 = 0;
    this.metersStreamDataConsumptionNetApparentPowerL2 = 0;
    this.metersStreamDataConsumptionNetApparentPowerL3 = 0;
    this.metersStreamDataConsumptionNetVoltageL1 = 0;
    this.metersStreamDataConsumptionNetVoltageL2 = 0;
    this.metersStreamDataConsumptionNetVoltageL3 = 0;
    this.metersStreamDataConsumptionNetCurrentL1 = 0;
    this.metersStreamDataConsumptionNetCurrentL2 = 0;
    this.metersStreamDataConsumptionNetCurrentL3 = 0;
    this.metersStreamDataConsumptionNetPowerFactorL1 = 0;
    this.metersStreamDataConsumptionNetPowerFactorL2 = 0;
    this.metersStreamDataConsumptionNetPowerFactorL3 = 0;
    this.metersStreamDataConsumptionNetFrequencyL1 = 0;
    this.metersStreamDataConsumptionNetFrequencyL2 = 0;
    this.metersStreamDataConsumptionNetFrequencyL3 = 0;

    this.metersStreamDataConsumptionNetActivePowerSum = 0;
    this.metersStreamDataConsumptionNetReactivePowerSum = 0;
    this.metersStreamDataConsumptionNetApparentPowerSum = 0;
    this.metersStreamDataConsumptionNetVoltageAvg = 0;
    this.metersStreamDataConsumptionNetCurrentSum = 0;
    this.metersStreamDataConsumptionNetPowerFactorAvg = 0;
    this.metersStreamDataConsumptionNetFrequencyAvg = 0;

    this.metersStreamDataConsumptionTotalActivePowerL1 = 0;
    this.metersStreamDataConsumptionTotalActivePowerL2 = 0;
    this.metersStreamDataConsumptionTotalActivePowerL3 = 0;
    this.metersStreamDataConsumptionTotalReactivePowerL1 = 0;
    this.metersStreamDataConsumptionTotalReactivePowerL2 = 0;
    this.metersStreamDataConsumptionTotalReactivePowerL3 = 0;
    this.metersStreamDataConsumptionTotalApparentPowerL1 = 0;
    this.metersStreamDataConsumptionTotalApparentPowerL2 = 0;
    this.metersStreamDataConsumptionTotalApparentPowerL3 = 0;
    this.metersStreamDataConsumptionTotalVoltageL1 = 0;
    this.metersStreamDataConsumptionTotalVoltageL2 = 0;
    this.metersStreamDataConsumptionTotalVoltageL3 = 0;
    this.metersStreamDataConsumptionTotalCurrentL1 = 0;
    this.metersStreamDataConsumptionTotalCurrentL2 = 0;
    this.metersStreamDataConsumptionTotalCurrentL3 = 0;
    this.metersStreamDataConsumptionTotalPowerFactorL1 = 0;
    this.metersStreamDataConsumptionTotalPowerFactorL2 = 0;
    this.metersStreamDataConsumptionTotalPowerFactorL3 = 0;
    this.metersStreamDataConsumptionTotalFrequencyL1 = 0;
    this.metersStreamDataConsumptionTotalFrequencyL2 = 0;
    this.metersStreamDataConsumptionTotalFrequencyL3 = 0;

    this.metersStreamDataConsumptionTotalActivePowerSum = 0;
    this.metersStreamDataConsumptionTotalReactivePowerSum = 0;
    this.metersStreamDataConsumptionTotalApparentPowerSum = 0;
    this.metersStreamDataConsumptionTotalVoltageAvg = 0;
    this.metersStreamDataConsumptionTotalCurrentSum = 0;
    this.metersStreamDataConsumptionTotalPowerFactorAvg = 0;
    this.metersStreamDataConsumptionTotalFrequencyAvg = 0;

    this.qRelaysCount = 0;

    this.productionPower = 0;
    this.productionPowerMax = 0;
    this.productionPowerMaxDetectedState = false;
    this.productionEnergyToday = 0;
    this.productionEnergyLastSevenDays = 0;
    this.productionEnergyLifetime = 0;
    this.productionRmsCurrent = 0;
    this.productionRmsVoltage = 0;
    this.productionReactivePower = 0;
    this.productionApparentPower = 0;
    this.productionPwrFactor = 0;
    this.productionReadingTime = '';

    this.consumptionTotalPower = 0;
    this.consumptionTotalPowerMax = 0;
    this.consumptionTotalPowerMaxDetectedState = false;
    this.consumptionTotalEnergyToday = 0;
    this.consumptionTotalEnergyLastSevenDays = 0;
    this.consumptionTotalEnergyLifetime = 0;
    this.consumptionTotalRmsCurrent = 0;
    this.consumptionTotalRmsVoltage = 0;
    this.consumptionTotalReactivePower = 0;
    this.consumptionTotalApparentPower = 0;
    this.consumptionTotalPwrFactor = 0;
    this.consumptionTotalReadingTime = '';

    this.consumptionNetPower = 0;
    this.consumptionNetPowerMax = 0;
    this.consumptionNetPowerMaxDetectedState = false;
    this.consumptionNetEnergyToday = 0;
    this.consumptionNetEnergyLastSevenDays = 0;
    this.consumptionNetEnergyLifetime = 0;
    this.consumptionNetRmsCurrent = 0;
    this.consumptionNetRmsVoltage = 0;
    this.consumptionNetReactivePower = 0;
    this.consumptionNetApparentPower = 0;
    this.consumptionNetPwrFactor = 0;
    this.consumptionNetReadingTime = '';

    this.enchargesCount = 0;
    this.enchargesType = '';
    this.enchargesActiveCount = 0;
    this.enchargesReadingTime = '';
    this.enchargesPower = 0;
    this.enchargesEnergy = 0;
    this.enchargesState = '';
    this.enchargesPercentFull = 0;

    this.microinvertersCount = 0;
    this.microinvertersActiveCount = 0;

    this.prefDir = path.join(api.user.storagePath(), 'enphaseEnvoy');
    this.productionPowerMaxFile = this.prefDir + '/' + 'productionPowerMax_' + this.host.split('.').join('');
    this.consumptionTotalPowerMaxFile = this.prefDir + '/' + 'consumptionTotalPowerMax_' + this.host.split('.').join('');
    this.consumptionNetPowerMaxFile = this.prefDir + '/' + 'consumptionNetPowerMax_' + this.host.split('.').join('');
    this.devInfoFile = this.prefDir + '/' + 'devInfo_' + this.host.split('.').join('');
    this.url = 'http://' + this.host;

    //check if prefs directory ends with a /, if not then add it
    if (this.prefDir.endsWith('/') === false) {
      this.prefDir = this.prefDir + '/';
    }
    //check if the directory exists, if not then create it
    if (fs.existsSync(this.prefDir) === false) {
      fsPromises.mkdir(this.prefDir);
    }
    //check if the files exists, if not then create it
    if (fs.existsSync(this.productionPowerMaxFile) === false) {
      fsPromises.writeFile(this.productionPowerMaxFile, '0.0');
    }
    if (fs.existsSync(this.consumptionTotalPowerMaxFile) === false) {
      fsPromises.writeFile(this.consumptionTotalPowerMaxFile, '0.0');
    }
    if (fs.existsSync(this.consumptionNetPowerMaxFile) === false) {
      fsPromises.writeFile(this.consumptionNetPowerMaxFile, '0.0');
    }
    //check if the files exists, if not then create it
    if (fs.existsSync(this.devInfoFile) === false) {
      fsPromises.writeFile(this.devInfoFile, '{}');
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
  }

  async getDeviceInfo() {
    var me = this;
    me.log.debug('Device: %s %s, requesting devices info.', me.host, me.name);
    try {
      const [inventory, info, meters] = await axios.all([axios.get(me.url + ENVOY_INVENTORY_URL), axios.get(me.url + ENVOY_INFO_URL), axios.get(me.url + METERS_URL)]);
      me.log.debug('Device %s %s, get devices data inventory: %s info: %s meters: %s', me.host, me.name, inventory.data, info.data, meters.data);
      const result = await parseStringPromise(info.data);
      me.log.debug('Device: %s %s, parse info.xml successful: %s', me.host, me.name, JSON.stringify(result, null, 2));

      let obj = Object.assign(result, inventory.data, meters.data);
      let devInfo = JSON.stringify(obj, null, 2);
      const writeDevInfoFile = await fsPromises.writeFile(me.devInfoFile, devInfo);
      me.log.debug('Device: %s %s, saved Device Info successful.', me.host, me.name);

      let time = result.envoy_info.time[0];
      let serialNumber = result.envoy_info.device[0].sn[0];
      let firmware = result.envoy_info.device[0].software[0];
      let microinverters = inventory.data[0].devices.length;
      let encharges = inventory.data[1].devices.length;
      let qrelays = inventory.data[2].devices.length;
      let ctmeters = meters.data.length;
      if (ctmeters >= 1) {
        var ctmeterProduction = ((meters.data[0].state) === 'enabled');
        }
      if (ctmeters >= 2) {
        var ctmeterConsumption = ((meters.data[1].state) === 'enabled');
        }
      // convert Unix time to local date time
      time = new Date(time * 1000).toLocaleString();

      me.log('-------- %s --------', me.name);
      me.log('Manufacturer: %s', me.manufacturer);
      me.log('Model: %s', me.modelName);
      me.log('Meters: %s', ctmeters);
      me.log('Q-Relays: %s', qrelays);
      me.log('Encharges: %s', encharges);
      me.log('Inverters: %s', microinverters);
      me.log('Firmware: %s', firmware);
      me.log('SerialNr: %s', serialNumber);
      me.log('Time: %s', time);
      me.log('----------------------------------');
      me.envoyTime = time;
      me.envoySerialNumber = serialNumber;
      me.envoyFirmware = firmware;
      me.microinvertersCount = microinverters;
      me.enchargesCount = encharges;
      me.qRelaysCount = qrelays;
      me.metersCount = ctmeters;
      me.metersProduction = ctmeterProduction;
      me.metersConsumption = ctmeterConsumption;

      me.checkDeviceInfo = false;
      me.updateDeviceState();
    } catch (error) {
      me.log.error('Device: %s %s, requesting devices info eror: %s, state: Offline trying to reconnect.', me.host, me.name, error);
      me.checkDeviceInfo = true;
    };
  }

  async updateDeviceState() {
    var me = this;
    try {
      //read all data;
      const [home, inventory, meters, production, productionCT] = await axios.all([axios.get(me.url + ENVOY_HOME_URL), axios.get(me.url + ENVOY_INVENTORY_URL), axios.get(me.url + METERS_URL), axios.get(me.url + PRODUCTION_INVERTERS_SUM_URL), axios.get(me.url + PRODUCTION_CT_URL)]);
      me.log.debug('Debug home: %s, inventory: %s, meters: %s, production: %s productionCT: %s', home.data, inventory.data, meters.data, production.data, productionCT.data);

      //check communications level of qrelays, encharges, microinverters
      if (me.installerPasswd) {
        try {
          //authorization installer
          const authInstaller = {
            method: 'GET',
            rejectUnauthorized: false,
            digestAuth: me.installerUser + ':' + me.installerPasswd,
            dataType: 'json',
            timeout: [5000, 5000]
          };
          const pcuCommCheck = await http.request(me.url + ENVOY_PCU_COMM_CHECK_URL, authInstaller);
          me.log.debug('Debug pcuCommCheck: %s', pcuCommCheck.data);
          me.pcuCommCheck = pcuCommCheck;
          me.checkCommLevel = true;
        } catch (error) {
          me.log.debug('Device: %s %s, pcuCommCheck error: %s', me.host, me.name, error);
          me.checkCommLevel = false;
        };
      }

      if (me.microinvertersCount > 0) {
        try {
          //authorization envoy
          const user = me.envoyUser;
          const passSerialNumber = me.envoySerialNumber.substring(6);
          const passEnvoy = me.envoyPasswd;
          const passwd = passEnvoy || passSerialNumber;
          const auth = user + ':' + passwd;
          const authEnvoy = {
            method: 'GET',
            rejectUnauthorized: false,
            digestAuth: auth,
            dataType: 'json',
            timeout: [5000, 5000]
          };
          const microinverters = await http.request(me.url + PRODUCTION_INVERTERS_URL, authEnvoy);
          me.log.debug('Debug production inverters: %s', microinverters.data);
          me.microinverters = microinverters;
          me.checkMicroinvertersPower = true;
        } catch (error) {
          me.log.debug('Device: %s %s, microinverters error: %s', me.host, me.name, error);
          me.checkMicroinvertersPower = false;
        };
      }

      //envoy
      if (home.status === 200 && home.data !== undefined) {
        var softwareBuildEpoch = home.data.software_build_epoch;
        var isEnvoy = (home.data.is_nonvoy == false);
        var dbSize = home.data.db_size;
        var dbPercentFull = home.data.db_percent_full;
        var timeZone = home.data.timezone;
        var currentDate = home.data.current_date;
        var currentTime = home.data.current_time;
        var networkWebComm = home.data.network.web_comm;
        var everReportedToEnlighten = home.data.network.ever_reported_to_enlighten;
        var lastEnlightenReporDate = home.data.network.last_enlighten_report_time;
        var primaryInterface = home.data.network.primary_interface;
        var tariff = home.data.tariff;
        var commNum = home.data.comm.num;
        var commLevel = home.data.comm.level;
        var commPcuNum = home.data.comm.pcu.num;
        var commPcuLevel = home.data.comm.pcu.level;
        var commAcbNum = home.data.comm.acb.num;
        var commAcbLevel = home.data.comm.acb.level;
        var commNsrbNum = home.data.comm.nsrb.num;
        var commNsrbLevel = home.data.comm.nsrb.level;
        var allerts = home.data.allerts;
        var updateStatus = home.data.update_status;

        // convert Unix time to local date time
        lastEnlightenReporDate = new Date(lastEnlightenReporDate * 1000).toLocaleString();

        // convert network interface
        let networkInterfaceIndex = NETWORK_INTERFACE.indexOf(primaryInterface);
        primaryInterface = NETWORK_INTERFACE_1[networkInterfaceIndex];

        // convert energy tariff
        let energyTariffIndex = ENERGY_TARIFF.indexOf(tariff);
        tariff = ENERGY_TARIFF_1[energyTariffIndex]

        // convert update status
        let updateStatusIndex = ENVOY_UPDATE.indexOf(updateStatus);
        updateStatus = ENVOY_UPDATE_1[updateStatusIndex]

        // convert status
        if (Array.isArray(allerts) && allerts.length === 1) {
          let code1 = allerts[0];
          let indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
          allerts = ENVOY_STATUS_CODE_1[indexCode1];
        } else if (Array.isArray(allerts) && allerts.length === 2) {
          let code1 = allerts[0];
          let indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
          let status1 = ENVOY_STATUS_CODE_1[indexCode1];
          let code2 = allerts[1];
          let indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
          let status2 = ENVOY_STATUS_CODE_1[indexCode2];
          allerts = status1 + ' / ' + status2;
        } else if (Array.isArray(allerts) && allerts.length === 3) {
          let code1 = allerts[0];
          let indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
          let status1 = ENVOY_STATUS_CODE_1[indexCode1];
          let code2 = allerts[1];
          let indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
          let status2 = ENVOY_STATUS_CODE_1[indexCode2];
          let code3 = allerts[2];
          let indexCode3 = ENVOY_STATUS_CODE.indexOf(code3);
          let status3 = ENVOY_STATUS_CODE_1[indexCode3];
          allerts = status1 + ' / ' + status2 + ' / ' + status3;
        } else {
          allerts = 'No allerts';
        }

        if (me.enphaseServiceEnvoy) {
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyAllerts, allerts);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyDbSize, dbSize + ' / ' + dbPercentFull + '%');
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyTariff, tariff);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface, primaryInterface);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm, networkWebComm);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten, everReportedToEnlighten);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel, commNum + ' / ' + commLevel);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel, commPcuNum + ' / ' + commPcuLevel);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel, commAcbNum + ' / ' + commAcbLevel);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel, commNsrbNum + ' / ' + commNsrbLevel);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyTimeZone, timeZone);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime, currentDate + ' ' + currentTime);
          me.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporDate, lastEnlightenReporDate);
        }

        me.envoySoftwareBuildEpoch = softwareBuildEpoch;
        me.envoyIsEnvoy = isEnvoy;
        me.envoyDbSize = dbSize;
        me.envoyDbPercentFull = dbPercentFull;
        me.envoyTimeZone = timeZone;
        me.envoyCurrentDate = currentDate;
        me.envoyCurrentTime = currentTime;
        me.envoyNetworkWebComm = networkWebComm;
        me.envoyEverReportedToEnlighten = everReportedToEnlighten;
        me.envoyLastEnlightenReporDate = lastEnlightenReporDate;
        me.envoyPrimaryInterface = primaryInterface;
        me.envoyTariff = tariff;
        me.envoyCommNum = commNum;
        me.envoyCommLevel = commLevel;
        me.envoyCommPcuNum = commPcuNum;
        me.envoyCommPcuLevel = commPcuLevel;
        me.envoyCommAcbNum = commAcbNum;
        me.envoyCommAcbLevel = commAcbLevel;
        me.envoyCommNsrbNum = commNsrbNum;
        me.envoyCommNsrbLevel = commNsrbLevel;
        me.envoyAllerts = allerts;
        me.envoyUpdateStatus = updateStatus;
      }

      //qrelays
      if (me.qRelaysCount > 0) {
        if (inventory.status === 200 && inventory.data !== undefined) {
          me.qRelaysSerialNumber = new Array();
          me.qRelaysStatus = new Array();
          me.qRelaysLastReportDate = new Array();
          me.qRelaysFirmware = new Array();
          me.qRelaysProducing = new Array();
          me.qRelaysCommunicating = new Array();
          me.qRelaysProvisioned = new Array();
          me.qRelaysOperating = new Array();
          me.qRelaysRelay = new Array();
          me.qRelaysLinesCount = new Array();
          me.qRelaysLine1Connected = new Array();
          me.qRelaysLine2Connected = new Array();
          me.qRelaysLine3Connected = new Array();
        }
        if (me.checkCommLevel) {
          me.qRelaysCommLevel = new Array();
        }

        for (let i = 0; i < me.qRelaysCount; i++) {
          if (inventory.status === 200 && inventory.data !== undefined) {
            var type = inventory.data[2].type;
            var partNum = inventory.data[2].devices[i].part_num;
            var installed = inventory.data[2].devices[i].installed;
            var serialNumber = inventory.data[2].devices[i].serial_num;
            var status = inventory.data[2].devices[i].device_status;
            var lastrptdate = inventory.data[2].devices[i].last_rpt_date;
            var adminState = inventory.data[2].devices[i].admin_state;
            var devType = inventory.data[2].devices[i].dev_type;
            var createdDate = inventory.data[2].devices[i].created_date;
            var imageLoadDate = inventory.data[2].devices[i].img_load_date;
            var firmware = inventory.data[2].devices[i].img_pnum_running;
            var ptpn = inventory.data[2].devices[i].ptpn;
            var chaneId = inventory.data[2].devices[i].chaneid;
            var deviceControl = inventory.data[2].devices[i].device_control;
            var producing = inventory.data[2].devices[i].producing;
            var communicating = inventory.data[2].devices[i].communicating;
            var provisioned = inventory.data[2].devices[i].provisioned;
            var operating = inventory.data[2].devices[i].operating;
            var relay = inventory.data[2].devices[i].relay;
            var reasonCode = inventory.data[2].devices[i].reason_code;
            var reason = inventory.data[2].devices[i].reason;
            var linesCount = inventory.data[2].devices[i]['line-count'];
            if (linesCount >= 1) {
              var line1Connected = inventory.data[2].devices[i]['line1-connected'];
              if (linesCount >= 2) {
                var line2Connected = inventory.data[2].devices[i]['line2-connected'];
                if (linesCount >= 3) {
                  var line3Connected = inventory.data[2].devices[i]['line3-connected'];
                }
              }
            }

            // convert status
            if (Array.isArray(status) && status.length === 1) {
              let code1 = status[0];
              let indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
              status = ENVOY_STATUS_CODE_1[indexCode1];
            } else if (Array.isArray(status) && status.length === 2) {
              let code1 = status[0];
              let indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
              let status1 = ENVOY_STATUS_CODE_1[indexCode1];
              let code2 = status[1];
              let indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
              let status2 = ENVOY_STATUS_CODE_1[indexCode2];
              status = status1 + ' / ' + status2;
            } else if (Array.isArray(status) && status.length === 3) {
              let code1 = status[0];
              let indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
              let status1 = ENVOY_STATUS_CODE_1[indexCode1];
              let code2 = status[1];
              let indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
              let status2 = ENVOY_STATUS_CODE_1[indexCode2];
              let code3 = status[2];
              let indexCode3 = ENVOY_STATUS_CODE.indexOf(code3);
              let status3 = ENVOY_STATUS_CODE_1[indexCode3];
              status = status1 + ' / ' + status2 + ' / ' + status3;
            } else {
              status = 'Not available';
            }

            // convert Unix time to local date time
            lastrptdate = new Date(lastrptdate * 1000).toLocaleString();

            if (me.enphaseServiceQrelay) {
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayStatus, status);
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayLastReportDate, lastrptdate);
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayFirmware, firmware);
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayProducing, producing);
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayCommunicating, communicating);
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayProvisioned, provisioned);
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayOperating, operating);
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayState, relay);
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayLinesCount, linesCount);
              if (linesCount >= 1) {
                me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayLine1Connected, line1Connected);
                if (linesCount >= 2) {
                  me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayLine2Connected, line2Connected);
                  if (linesCount >= 3) {
                    me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayLine3Connected, line3Connected);
                  }
                }
              }
            }

            me.qRelaysSerialNumber.push(serialNumber);
            me.qRelaysStatus.push(status);
            me.qRelaysLastReportDate.push(lastrptdate);
            me.qRelaysFirmware.push(firmware);
            me.qRelaysProducing.push(producing);
            me.qRelaysCommunicating.push(communicating);
            me.qRelaysProvisioned.push(provisioned);
            me.qRelaysOperating.push(operating);
            me.qRelaysRelay.push(relay);
            me.qRelaysLinesCount.push(linesCount);
            if (linesCount >= 1) {
              me.qRelaysLine1Connected.push(line1Connected);
              if (linesCount >= 2) {
                me.qRelaysLine2Connected.push(line2Connected);
                if (linesCount >= 3) {
                  me.qRelaysLine3Connected.push(line3Connected);
                }
              }
            }
          }

          // get qrelays comm level
          if (me.checkCommLevel) {
            var key = '' + me.qRelaysSerialNumber[i] + '';
            var commLevel = 0;
            if (me.pcuCommCheck.data[key] !== undefined) {
              commLevel = me.pcuCommCheck.data[key];
            }

            if (me.enphaseServiceQrelay && me.qRelaysCommunicating[i]) {
              me.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayCommLevel, commLevel);
            }
            me.qRelaysCommLevel.push(commLevel);
          }
        }
      }

      //meters
      if (me.metersCount > 0) {
        if (meters.status === 200 && meters.data !== undefined) {
          me.metersEid = new Array();
          me.metersState = new Array();
          me.metersMeasurementType = new Array();
          me.metersPhaseMode = new Array();
          me.metersPhaseCount = new Array();
          me.metersMeteringStatus = new Array();
          me.metersStatusFlags = new Array();

          for (let i = 0; i < me.metersCount; i++) {
            var eid = meters.data[i].eid;
            var state = meters.data[i].state;
            var measurementType = meters.data[i].measurementType;
            var phaseMode = meters.data[i].phaseMode;
            var phaseCount = meters.data[i].phaseCount;
            var meteringStatus = meters.data[i].meteringStatus;
            var status = meters.data[i].statusFlags;

            // convert status
            if (Array.isArray(status) && status.length === 1) {
              let code1 = status[0];
              let indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
              status = ENVOY_STATUS_CODE_1[indexCode1];
            } else if (Array.isArray(status) && status.length === 2) {
              let code1 = status[0];
              let indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
              let status1 = ENVOY_STATUS_CODE_1[indexCode1];
              let code2 = status[1];
              let indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
              let status2 = ENVOY_STATUS_CODE_1[indexCode2];
              status = status1 + ' / ' + status2;
            } else if (Array.isArray(status) && status.length === 3) {
              let code1 = status[0];
              let indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
              let status1 = ENVOY_STATUS_CODE_1[indexCode1];
              let code2 = status[1];
              let indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
              let status2 = ENVOY_STATUS_CODE_1[indexCode2];
              let code3 = status[2];
              let indexCode3 = ENVOY_STATUS_CODE.indexOf(code3);
              let status3 = ENVOY_STATUS_CODE_1[indexCode3];
              status = status1 + ' / ' + status2 + ' / ' + status3;
            } else {
              status = 'Not available';
            }

            if (me.enphaseServiceMeter) {
              me.enphaseServiceMeter.updateCharacteristic(Characteristic.enphaseMeterState, state);
              me.enphaseServiceMeter.updateCharacteristic(Characteristic.enphaseMeterPhaseMode, phaseMode);
              me.enphaseServiceMeter.updateCharacteristic(Characteristic.enphaseMeterPhaseCount, phaseCount);
              me.enphaseServiceMeter.updateCharacteristic(Characteristic.enphaseMeterMeteringStatus, meteringStatus);
              me.enphaseServiceMeter.updateCharacteristic(Characteristic.enphaseMeterStatusFlags, status);
            }

            me.metersEid.push(eid);
            me.metersState.push(state);
            me.metersMeasurementType.push(measurementType);
            me.metersPhaseMode.push(phaseMode);
            me.metersPhaseCount.push(phaseCount);
            me.metersMeteringStatus.push(meteringStatus);
            me.metersStatusFlags.push(status);
          }
        }

        //realtime meters stream data
        if (me.metersStreamData) {
          try {
            //authorization envoy
            const user = me.envoyUser;
            const passSerialNumber = me.envoySerialNumber.substring(6);
            const passEnvoy = me.envoyPasswd;
            const passwd = passEnvoy || passSerialNumber;
            const auth = user + ':' + passwd;
            const option = {
              method: 'GET',
              rejectUnauthorized: false,
              digestAuth: auth,
              timeout: [3000, 5000]
            };
            const metersStream = await http.request(me.url + METERS_STREAM_DATA_URL, option);
            me.log('Debug metersStream: %s', metersStream.data);

            if (me.metersProductionActiveCount) {
              let activePowerL1 = metersStream.data.data.production['ph-a'].p;
              let activePowerL2 = metersStream.data.data.production['ph-b'].p;
              let activePowerL3 = metersStream.data.data.production['ph-c'].p;
              let reactivePowerL1 = metersStream.data.data.production['ph-a'].q;
              let reactivePowerL2 = metersStream.data.data.production['ph-b'].q;
              let reactivePowerL3 = metersStream.data.data.production['ph-c'].q;
              let apparentPowerL1 = metersStream.data.data.production['ph-a'].s;
              let apparentPowerL2 = metersStream.data.data.production['ph-b'].s;
              let apparentPowerL3 = metersStream.data.data.production['ph-c'].s;
              let voltageL1 = metersStream.data.data.production['ph-a'].v;
              let voltageL2 = metersStream.data.data.production['ph-b'].v;
              let voltageL3 = metersStream.data.data.production['ph-c'].v;
              let currentL1 = metersStream.data.data.production['ph-a'].i;
              let currentL2 = metersStream.data.data.production['ph-b'].i;
              let currentL3 = metersStream.data.data.production['ph-c'].i;
              let powerFactorL1 = metersStream.data.data.production['ph-a'].pf;
              let powerFactorL2 = metersStream.data.data.production['ph-b'].pf;
              let powerFactorL3 = metersStream.data.data.production['ph-c'].pf;
              let frequencyL1 = metersStream.data.data.production['ph-a'].f;
              let frequencyL2 = metersStream.data.data.production['ph-b'].f;
              let frequencyL3 = metersStream.data.data.production['ph-c'].f;

              me.metersStreamDataProductionActivePowerL1 = activePowerL1;
              me.metersStreamDataProductionActivePowerL2 = activePowerL2;
              me.metersStreamDataProductionActivePowerL3 = activePowerL3;
              me.metersStreamDataProductionReactivePowerL1 = reactivePowerL1;
              me.metersStreamDataProductionReactivePowerL2 = reactivePowerL2;
              me.metersStreamDataProductionReactivePowerL3 = reactivePowerL3;
              me.metersStreamDataProductionApparentPowerL1 = apparentPowerL1;
              me.metersStreamDataProductionApparentPowerL2 = apparentPowerL2;
              me.metersStreamDataProductionApparentPowerL3 = apparentPowerL3;
              me.metersStreamDataProductionVoltageL1 = voltageL1;
              me.metersStreamDataProductionVoltageL2 = voltageL2;
              me.metersStreamDataProductionVoltageL3 = voltageL3;
              me.metersStreamDataProductionCurrentL1 = currentL1;
              me.metersStreamDataProductionCurrentL2 = currentL2;
              me.metersStreamDataProductionCurrentL3 = currentL3;
              me.metersStreamDataProductionPowerFactorL1 = powerFactorL1;
              me.metersStreamDataProductionPowerFactorL2 = powerFactorL2;
              me.metersStreamDataProductionPowerFactorL3 = powerFactorL3;
              me.metersStreamDataProductionFrequencyL1 = frequencyL1;
              me.metersStreamDataProductionFrequencyL2 = frequencyL2;
              me.metersStreamDataProductionFrequencyL3 = frequencyL3;

              me.metersStreamDataProductionActivePowerSum = (activePowerL1 + activePowerL2 + activePowerL3);
              me.metersStreamDataProductionReactivePowerSum = (reactivePowerL1 + reactivePowerL2 + reactivePowerL3);
              me.metersStreamDataProductionApparentPowerSum = (apparentPowerL1 + apparentPowerL2 + apparentPowerL3);
              me.metersStreamDataProductionVoltageAvg = (voltageL1 + voltageL2 + voltageL3) / 3;
              me.metersStreamDataProductionCurrentSum = (currentL1 + currentL2 + currentL3);
              me.metersStreamDataProductionPowerFactorAvg = (powerFactorL1 + powerFactorL2 + powerFactorL3) / 3;
              me.metersStreamDataProductionFrequencyAvg = (frequencyL1 + frequencyL2 + frequencyL3) / 3;
            }

            if (me.metersConsumptionNetActiveCount) {
              let activePowerL1 = data['net-consumption']['ph-a'].p;
              let activePowerL2 = data['net-consumption']['ph-b'].p;
              let activePowerL3 = data['net-consumption']['ph-c'].p;
              let reactivePowerL1 = data['net-consumption']['ph-a'].q;
              let reactivePowerL2 = data['net-consumption']['ph-b'].q;
              let reactivePowerL3 = data['net-consumption']['ph-c'].q;
              let apparentPowerL1 = data['net-consumption']['ph-a'].s;
              let apparentPowerL2 = data['net-consumption']['ph-b'].s;
              let apparentPowerL3 = data['net-consumption']['ph-c'].s;
              let voltageL1 = data['net-consumption']['ph-a'].v;
              let voltageL2 = data['net-consumption']['ph-b'].v;
              let voltageL3 = data['net-consumption']['ph-c'].v;
              let currentL1 = data['net-consumption']['ph-a'].i;
              let currentL2 = data['net-consumption']['ph-b'].i;
              var currentL3 = data['net-consumption']['ph-c'].i;
              let powerFactorL1 = data['net-consumption']['ph-a'].pf;
              let powerFactorL2 = data['net-consumption']['ph-b'].pf;
              let powerFactorL3 = data['net-consumption']['ph-c'].pf;
              let frequencyL1 = data['net-consumption']['ph-a'].f;
              let frequencyL2 = data['net-consumption']['ph-b'].f;
              let frequencyL3 = data['net-consumption']['ph-c'].f;

              me.metersStreamDataConsumptionNetActivePowerL1 = activePowerL1;
              me.metersStreamDataConsumptionNetActivePowerL2 = activePowerL2;
              me.metersStreamDataConsumptionNetActivePowerL3 = activePowerL3;
              me.metersStreamDataConsumptionNetReactivePowerL1 = reactivePowerL1;
              me.metersStreamDataConsumptionNetReactivePowerL2 = reactivePowerL2;
              me.metersStreamDataConsumptionNetReactivePowerL3 = reactivePowerL3;
              me.metersStreamDataConsumptionNetApparentPowerL1 = apparentPowerL1;
              me.metersStreamDataConsumptionNetApparentPowerL2 = apparentPowerL2;
              me.metersStreamDataConsumptionNetApparentPowerL3 = apparentPowerL3;
              me.metersStreamDataConsumptionNetVoltageL1 = voltageL1;
              me.metersStreamDataConsumptionNetVoltageL2 = voltageL2;
              me.metersStreamDataConsumptionNetVoltageL3 = voltageL3;
              me.metersStreamDataConsumptionNetCurrentL1 = currentL1;
              me.metersStreamDataConsumptionNetCurrentL2 = currentL2;
              me.metersStreamDataConsumptionNetCurrentL3 = currentL3;
              me.metersStreamDataConsumptionNetPowerFactorL1 = powerFactorL1;
              me.metersStreamDataConsumptionNetPowerFactorL2 = powerFactorL2;
              me.metersStreamDataConsumptionNetPowerFactorL3 = powerFactorL3;
              me.metersStreamDataConsumptionNetFrequencyL1 = frequencyL1;
              me.metersStreamDataConsumptionNetFrequencyL2 = frequencyL2;
              me.metersStreamDataConsumptionNetFrequencyL3 = frequencyL3;

              me.metersStreamDataConsumptionNetActivePowerSum = (activePowerL1 + activePowerL2 + activePowerL3);
              me.metersStreamDataConsumptionNetReactivePowerSum = (reactivePowerL1 + reactivePowerL2 + reactivePowerL3);
              me.metersStreamDataConsumptionNetApparentPowerSum = (apparentPowerL1 + apparentPowerL2 + apparentPowerL3);
              me.metersStreamDataConsumptionNetVoltageAvg = (voltageL1 + voltageL2 + voltageL3) / 3;
              me.metersStreamDataConsumptionNetCurrentSum = (currentL1 + currentL2 + currentL3);
              me.metersStreamDataConsumptionNetPowerFactorAvg = (powerFactorL1 + powerFactorL2 + powerFactorL3) / 3;
              me.metersStreamDataConsumptionNetFrequencyAvg = (frequencyL1 + frequencyL2 + frequencyL3) / 3;
            }

            if (me.metersConsumtionTotalActiveCount) {
              let activePowerL1 = data['total-consumption']['ph-a'].p;
              let activePowerL2 = data['total-consumption']['ph-b'].p;
              let activePowerL3 = data['total-consumption']['ph-c'].p;
              let reactivePowerL1 = data['total-consumption']['ph-a'].q;
              let reactivePowerL2 = data['total-consumption']['ph-b'].q;
              let reactivePowerL3 = data['total-consumption']['ph-c'].q;
              let apparentPowerL1 = data['total-consumption']['ph-a'].s;
              let apparentPowerL2 = data['total-consumption']['ph-b'].s;
              let apparentPowerL3 = data['total-consumption']['ph-c'].s;
              let voltageL1 = data['total-consumption']['ph-a'].v;
              let voltageL2 = data['total-consumption']['ph-b'].v;
              let voltageL3 = data['total-consumption']['ph-c'].v;
              let currentL1 = data['total-consumption']['ph-a'].i;
              let currentL2 = data['total-consumption']['ph-b'].i;
              let currentL3 = data['total-consumption']['ph-c'].i;
              let powerFactorL1 = data['total-consumption']['ph-a'].pf;
              let powerFactorL2 = data['total-consumption']['ph-b'].pf;
              let powerFactorL3 = data['total-consumption']['ph-c'].pf;
              let frequencyL1 = data['total-consumption']['ph-a'].f;
              let frequencyL2 = data['total-consumption']['ph-b'].f;
              let frequencyL3 = data['total-consumption']['ph-c'].f;
              
              me.metersStreamDataConsumptionTotalActivePowerL1 = activePowerL1;
              me.metersStreamDataConsumptionTotalActivePowerL2 = activePowerL2;
              me.metersStreamDataConsumptionTotalActivePowerL3 = activePowerL3;
              me.metersStreamDataConsumptionTotalReactivePowerL1 = reactivePowerL1;
              me.metersStreamDataConsumptionTotalReactivePowerL2 = reactivePowerL2;
              me.metersStreamDataConsumptionTotalReactivePowerL3 = reactivePowerL3;
              me.metersStreamDataConsumptionTotalApparentPowerL1 = apparentPowerL1;
              me.metersStreamDataConsumptionTotalApparentPowerL2 = apparentPowerL2;
              me.metersStreamDataConsumptionTotalApparentPowerL3 = apparentPowerL3;
              me.metersStreamDataConsumptionTotalVoltageL1 = voltageL1;
              me.metersStreamDataConsumptionTotalVoltageL2 = voltageL2;
              me.metersStreamDataConsumptionTotalVoltageL3 = voltageL3;
              me.metersStreamDataConsumptionTotalCurrentL1 = currentL1;
              me.metersStreamDataConsumptionTotalCurrentL2 = currentL2;
              me.metersStreamDataConsumptionTotalCurrentL3 = currentL3;
              me.metersStreamDataConsumptionTotalPowerFactorL1 = powerFactorL1;
              me.metersStreamDataConsumptionTotalPowerFactorL2 = powerFactorL2;
              me.metersStreamDataConsumptionTotalPowerFactorL3 = powerFactorL3;
              me.metersStreamDataConsumptionTotalFrequencyL1 = frequencyL1;
              me.metersStreamDataConsumptionTotalFrequencyL2 = frequencyL2;
              me.metersStreamDataConsumptionTotalFrequencyL3 = frequencyL3;

              me.metersStreamDataConsumptionTotalActivePowerSum = (activePowerL1 + activePowerL2 + activePowerL3);
              me.metersStreamDataConsumptionTotalReactivePowerSum = (reactivePowerL1 + reactivePowerL2 + reactivePowerL3);
              me.metersStreamDataConsumptionTotalApparentPowerSum = (apparentPowerL1 + apparentPowerL2 + apparentPowerL3);
              me.metersStreamDataConsumptionTotalVoltageAvg = (voltageL1 + voltageL2 + voltageL3) / 3;
              me.metersStreamDataConsumptionTotalCurrentSum = (currentL1 + currentL2 + currentL3);
              me.metersStreamDataConsumptionTotalPowerFactorAvg = (powerFactorL1 + powerFactorL2 + powerFactorL3) / 3;
              me.metersStreamDataConsumptionTotalFrequencyAvg = (frequencyL1 + frequencyL2 + frequencyL3) / 3;
            }
          } catch (error) {
            me.log('Device: %s %s, metersStream error: %s', me.host, me.name, error);
            me.metersStreamData = false;
          };
        }
      }

      // check enabled microinverters, meters, encharges
      if (productionCT.status === 200 && productionCT.data !== undefined) {
        if (me.metersCount > 0) {
          if (me.metersProduction) {
            let metersProductionCount = productionCT.data.production[1].activeCount;
            me.metersProductionActiveCount = metersProductionCount;
          }
          if (me.metersConsumption) {
            let metersConsumtionTotalCount = productionCT.data.consumption[0].activeCount;
            let metersConsumptionNetCount = productionCT.data.consumption[1].activeCount;
            me.metersConsumtionTotalActiveCount = metersConsumtionTotalCount;
            me.metersConsumptionNetActiveCount = metersConsumptionNetCount;
          }
        }
        let microinvertersActiveCount = productionCT.data.production[0].activeCount;
        me.microinvertersActiveCount = microinvertersActiveCount;
      }

      //production
      if (production.status === 200 && productionCT.status === 200) {
        //reading time
        var productionReadingTime = me.metersProduction ? productionCT.data.production[1].readingTime : productionCT.data.production[0].readingTime;

        //power production
        var productionPower = me.metersProduction ? parseFloat(productionCT.data.production[1].wNow / 1000) : parseFloat(production.data.wattsNow / 1000);

        //save and read power max and state
        var productionPowerMax = productionPower;
        var savedProductionPowerMax = await fsPromises.readFile(me.productionPowerMaxFile);
        me.log.debug('Device: %s %s, savedProductionPowerMax: %s kW', me.host, me.name, savedProductionPowerMax);
        if (savedProductionPowerMax > productionPower) {
          productionPowerMax = parseFloat(savedProductionPowerMax);
          me.log.debug('Device: %s %s, productionPowerMax: %s kW', me.host, me.name, productionPowerMax);
        }

        if (productionPower > productionPowerMax) {
          const write = await fsPromises.writeFile(me.productionPowerMaxFile, productionPower.toString());
          me.log.debug('Device: %s %s, productionPowerMaxFile saved successful in: %s %s kW', me.host, me.name, me.productionPowerMaxFile, productionPower);

        }
        var productionPowerMaxDetectedState = (productionPower >= me.productionPowerMaxDetected / 1000);

        //energy
        var productionEnergyToday = me.metersProduction ? parseFloat(productionCT.data.production[1].whToday / 1000) : parseFloat(production.data.wattHoursToday / 1000);
        var productionEnergyLastSevenDays = me.metersProduction ? parseFloat(productionCT.data.production[1].whLastSevenDays / 1000) : parseFloat(production.data.wattHoursSevenDays / 1000);
        var productionEnergyLifetime = me.metersProduction ? parseFloat((productionCT.data.production[1].whLifetime + me.productionEnergyLifetimeOffset) / 1000) : parseFloat((production.data.wattHoursLifetime + me.productionEnergyLifetimeOffset) / 1000);

        //param
        if (me.metersCount > 0 && me.metersProductionActiveCount > 0) {
          var productionRmsCurrent = parseFloat(productionCT.data.production[1].rmsCurrent);
          var productionRmsVoltage = parseFloat((productionCT.data.production[1].rmsVoltage) / 3);
          var productionReactivePower = parseFloat((productionCT.data.production[1].reactPwr) / 1000);
          var productionApparentPower = parseFloat((productionCT.data.production[1].apprntPwr) / 1000);
          var productionPwrFactor = parseFloat(productionCT.data.production[1].pwrFactor);
        }

        //convert Unix time to local date time
        productionReadingTime = new Date(productionReadingTime * 1000).toLocaleString();

        if (me.enphaseServiceProduction) {
          me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseReadingTime, productionReadingTime);
          me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphasePower, productionPower);
          me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphasePowerMax, productionPowerMax);
          me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphasePowerMaxDetected, productionPowerMaxDetectedState);
          me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseEnergyToday, productionEnergyToday);
          me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, productionEnergyLastSevenDays);
          me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseEnergyLifetime, productionEnergyLifetime);
          if (me.metersCount > 0 && me.metersProductionActiveCount > 0) {
            me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseRmsCurrent, productionRmsCurrent);
            me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseRmsVoltage, productionRmsVoltage);
            me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseReactivePower, productionReactivePower);
            me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseApparentPower, productionApparentPower);
            me.enphaseServiceProduction.updateCharacteristic(Characteristic.enphasePwrFactor, productionPwrFactor);
          }
        }

        me.productionReadingTime = productionReadingTime;
        me.productionPower = productionPower;
        me.productionPowerMax = productionPowerMax;
        me.productionPowerMaxDetectedState = productionPowerMaxDetectedState;
        me.productionEnergyToday = productionEnergyToday;
        me.productionEnergyLastSevenDays = productionEnergyLastSevenDays;
        me.productionEnergyLifetime = productionEnergyLifetime;

        if (me.metersCount > 0 && me.metersProductionActiveCount > 0) {
          me.productionRmsCurrent = productionRmsCurrent;
          me.productionRmsVoltage = productionRmsVoltage;
          me.productionReactivePower = productionReactivePower;
          me.productionApparentPower = productionApparentPower;
          me.productionPwrFactor = productionPwrFactor;
        }

        //consumption total
        if (me.metersCount > 0 && me.metersConsumtionTotalActiveCount > 0) {
          //reading time
          var consumptionTotalReadingTime = productionCT.data.consumption[0].readingTime;

          //power
          var consumptionTotalPower = parseFloat(productionCT.data.consumption[0].wNow / 1000);

          //save and read power max and state
          var consumptionTotalPowerMax = consumptionTotalPower;
          var savedConsumptionTotalPowerMax = await fsPromises.readFile(me.consumptionTotalPowerMaxFile);
          me.log.debug('Device: %s %s, savedConsumptionTotalPowerMax: %s kW', me.host, me.name, savedConsumptionTotalPowerMax);
          if (savedConsumptionTotalPowerMax > consumptionTotalPower) {
            consumptionTotalPowerMax = parseFloat(savedConsumptionTotalPowerMax);
          }

          if (consumptionTotalPower > consumptionTotalPowerMax) {
            const write1 = await fsPromises.writeFile(me.consumptionTotalPowerMaxFile, consumptionTotalPower.toString());
            me.log.debug('Device: %s %s, consumptionTotalPowerMaxFile saved successful in: %s %s kW', me.host, me.name, me.consumptionTotalPowerMaxFile, consumptionTotalPower);
          }
          var consumptionTotalPowerMaxDetectedState = (me.consumptionTotalPower >= me.consumptionTotalPowerMaxDetected / 1000);

          //energy
          var consumptionTotalEnergyToday = parseFloat(productionCT.data.consumption[0].whToday / 1000);
          var consumptionTotalEnergyLastSevenDays = parseFloat(productionCT.data.consumption[0].whLastSevenDays / 1000);
          var consumptionTotalEnergyLifetime = parseFloat((productionCT.data.consumption[0].whLifetime + me.consumptionTotalEnergyLifetimeOffset) / 1000);

          //param
          var consumptionTotalRmsCurrent = parseFloat(productionCT.data.consumption[0].rmsCurrent);
          var consumptionTotalRmsVoltage = parseFloat((productionCT.data.consumption[0].rmsVoltage) / 3);
          var consumptionTotalReactivePower = parseFloat((productionCT.data.consumption[0].reactPwr) / 1000);
          var consumptionTotalApparentPower = parseFloat((productionCT.data.consumption[0].apprntPwr) / 1000);
          var consumptionTotalPwrFactor = parseFloat(productionCT.data.consumption[0].pwrFactor);

          //convert Unix time to local date time
          consumptionTotalReadingTime = new Date(consumptionTotalReadingTime * 1000).toLocaleString();

          if (me.enphaseServiceConsumptionTotal) {
            me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseReadingTime, consumptionTotalReadingTime);
            me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphasePower, consumptionTotalPower);
            me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphasePowerMax, consumptionTotalPowerMax);
            me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphasePowerMaxDetected, consumptionTotalPowerMaxDetectedState);
            me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseEnergyToday, consumptionTotalEnergyToday);
            me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, consumptionTotalEnergyLastSevenDays);
            me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseEnergyLifetime, consumptionTotalEnergyLifetime);
            me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseRmsCurrent, consumptionTotalRmsCurrent);
            me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseRmsVoltage, consumptionTotalRmsVoltage);
            me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseReactivePower, consumptionTotalReactivePower);
            me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseApparentPower, consumptionTotalApparentPower);
            me.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphasePwrFactor, consumptionTotalPwrFactor);
          }

          me.consumptionTotalReadingTime = consumptionTotalReadingTime;
          me.consumptionTotalPower = consumptionTotalPower;
          me.consumptionTotalPowerMax = consumptionTotalPowerMax;
          me.consumptionTotalPowerMaxDetectedState = consumptionTotalPowerMaxDetectedState;
          me.consumptionTotalEnergyToday = consumptionTotalEnergyToday;
          me.consumptionTotalEnergyLastSevenDays = consumptionTotalEnergyLastSevenDays;
          me.consumptionTotalEnergyLifetime = consumptionTotalEnergyLifetime;
          me.consumptionTotalRmsCurrent = consumptionTotalRmsCurrent;
          me.consumptionTotalRmsVoltage = consumptionTotalRmsVoltage;
          me.consumptionTotalReactivePower = consumptionTotalReactivePower;
          me.consumptionTotalApparentPower = consumptionTotalApparentPower;
          me.consumptionTotalPwrFactor = consumptionTotalPwrFactor;
        }

        //consumption net
        if (me.metersCount > 0 && me.metersConsumptionNetActiveCount > 0) {
          //reading time
          var consumptionNetReadingTime = productionCT.data.consumption[1].readingTime;

          //power
          var consumptionNetPower = parseFloat(productionCT.data.consumption[1].wNow / 1000);

          //save and read power max and state
          var consumptionNetPowerMax = consumptionNetPower;
          var savedConsumptionNetPowerMax = await fsPromises.readFile(me.consumptionNetPowerMaxFile);
          me.log.debug('Device: %s %s, savedConsumptionNetPowerMax: %s kW', me.host, me.name, savedConsumptionNetPowerMax);
          if (savedConsumptionNetPowerMax > consumptionNetPower) {
            consumptionNetPowerMax = parseFloat(savedConsumptionNetPowerMax);
          }

          if (consumptionNetPower > consumptionNetPowerMax) {
            const write2 = await fsPromises.writeFile(me.consumptionNetPowerMaxFile, consumptionNetPower.toString());
            me.log.debug('Device: %s %s, consumptionNetPowerMaxFile saved successful in: %s %s kW', me.host, me.name, me.consumptionNetPowerMaxFile, consumptionNetPower);
          }
          var consumptionNetPowerMaxDetectedState = (consumptionNetPower >= me.consumptionNetPowerMaxDetected / 1000);

          //energy
          var consumptionNetEnergyToday = parseFloat(productionCT.data.consumption[1].whToday / 1000);
          var consumptionNetEnergyLastSevenDays = parseFloat(productionCT.data.consumption[1].whLastSevenDays / 1000);
          var consumptionNetEnergyLifetime = parseFloat((productionCT.data.consumption[1].whLifetime + me.consumptionNetEnergyLifetimeOffset) / 1000);

          //param
          var consumptionNetRmsCurrent = parseFloat(productionCT.data.consumption[1].rmsCurrent);
          var consumptionNetRmsVoltage = parseFloat((productionCT.data.consumption[1].rmsVoltage) / 3);
          var consumptionNetReactivePower = parseFloat((productionCT.data.consumption[1].reactPwr) / 1000);
          var consumptionNetApparentPower = parseFloat((productionCT.data.consumption[1].apprntPwr) / 1000);
          var consumptionNetPwrFactor = parseFloat(productionCT.data.consumption[1].pwrFactor);

          //convert Unix time to local date time
          consumptionNetReadingTime = new Date(consumptionNetReadingTime * 1000).toLocaleString();

          if (me.enphaseServiceConsumptionNet) {
            me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseReadingTime, consumptionNetReadingTime);
            me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphasePower, consumptionNetPower);
            me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphasePowerMax, consumptionNetPowerMax);
            me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphasePowerMaxDetected, consumptionNetPowerMaxDetectedState);
            me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseEnergyToday, consumptionNetEnergyToday);
            me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, consumptionNetEnergyLastSevenDays);
            me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseEnergyLifetime, consumptionNetEnergyLifetime);
            me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseRmsCurrent, consumptionNetRmsCurrent);
            me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseRmsVoltage, consumptionNetRmsVoltage);
            me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseReactivePower, consumptionNetReactivePower);
            me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseApparentPower, consumptionNetApparentPower);
            me.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphasePwrFactor, consumptionNetPwrFactor);
          }

          me.consumptionNetReadingTime = consumptionNetReadingTime;
          me.consumptionNetPower = consumptionNetPower;
          me.consumptionNetPowerMax = consumptionNetPowerMax;
          me.consumptionNetEnergyToday = consumptionNetEnergyToday;
          me.consumptionNetEnergyLastSevenDays = consumptionNetEnergyLastSevenDays;
          me.consumptionNetEnergyLifetime = consumptionNetEnergyLifetime;
          me.consumptionNetPowerMaxDetectedState = consumptionNetPowerMaxDetectedState;
          me.consumptionNetRmsCurrent = consumptionNetRmsCurrent;
          me.consumptionNetRmsVoltage = consumptionNetRmsVoltage;
          me.consumptionNetReactivePower = consumptionNetReactivePower;
          me.consumptionNetApparentPower = consumptionNetApparentPower;
          me.consumptionNetPwrFactor = consumptionNetPwrFactor;
        }
      }

      //encharge storage
      if (me.enchargesCount > 0) {
        if (inventory.status === 200 && inventory.data !== undefined) {

          me.enchargesSerialNumber = new Array();
          me.enchargesStatus = new Array();
          me.enchargesLastReportDate = new Array();
          me.enchargesFirmware = new Array();
          me.enchargesProducing = new Array();
          me.enchargesCommunicating = new Array();
          me.enchargesProvisioned = new Array();
          me.enchargesOperating = new Array();
          me.enchargesSleepEnabled = new Array();
          me.enchargesPerfentFull1 = new Array();
          me.enchargesMaxCellTemp = new Array();
          me.enchargesSleepMinSoc = new Array();
          me.enchargesSleepMaxSoc = new Array();
          me.enchargesChargeStatus = new Array();
        }

        if (me.checkCommLevel) {
          me.enchargesCommLevel = new Array();
        }

        for (let i = 0; i < me.enchargesCount; i++) {
          if (inventory.status === 200 && inventory.data !== undefined) {
            var type = inventory.data[1].type;
            var partNum = inventory.data[1].devices[i].part_num;
            var installed = inventory.data[1].devices[i].installed;
            var serialNumber = inventory.data[1].devices[i].serial_num;
            var status = inventory.data[1].devices[i].device_status;
            var lastrptdate = inventory.data[1].devices[i].last_rpt_date;
            var adminState = inventory.data[1].devices[i].admin_state;
            var devType = inventory.data[1].devices[i].dev_type;
            var createdDate = inventory.data[1].devices[i].created_date;
            var imageLoadDate = inventory.data[1].devices[i].img_load_date;
            var firmware = inventory.data[1].devices[i].img_pnum_running;
            var ptpn = inventory.data[1].devices[i].ptpn;
            var chaneId = inventory.data[1].devices[i].chaneid;
            var deviceControl = inventory.data[1].devices[i].device_control;
            var producing = inventory.data[1].devices[i].producing;
            var communicating = inventory.data[1].devices[i].communicating;
            var provisioned = inventory.data[1].devices[i].provisioned;
            var operating = inventory.data[1].devices[i].operating;
            var sleepEnabled = inventory.data[1].devices[i].sleep_enabled;
            var perfentFull = inventory.data[1].devices[i].percentFull;
            var maxCellTemp = inventory.data[1].devices[i].maxCellTemp;
            var sleepMinSoc = inventory.data[1].devices[i].sleep_min_soc;
            var sleepMaxSoc = inventory.data[1].devices[i].sleep_max_soc;
            var chargeStatus = inventory.data[1].devices[i].charge_status;

            if (Array.isArray(status) && status.length === 1) {
              let code1 = status[0];
              let indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
              status = ENVOY_STATUS_CODE_1[indexCode1];
            } else if (Array.isArray(status) && status.length === 2) {
              let code1 = status[0];
              let indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
              let status1 = ENVOY_STATUS_CODE_1[indexCode1];
              let code2 = status[1];
              let indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
              let status2 = ENVOY_STATUS_CODE_1[indexCode2];
              status = status1 + ' / ' + status2;
            } else if (Array.isArray(status) && status.length === 3) {
              let code1 = status[0];
              let indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
              let status1 = ENVOY_STATUS_CODE_1[indexCode1];
              let code2 = status[1];
              let indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
              let status2 = ENVOY_STATUS_CODE_1[indexCode2];
              let code3 = status[2];
              let indexCode3 = ENVOY_STATUS_CODE.indexOf(code3);
              let status3 = ENVOY_STATUS_CODE_1[indexCode3];
              status = status1 + ' / ' + status2 + ' / ' + status3;
            } else {
              status = 'Not available';
            }
            //convert Unix time to local date time
            lastrptdate = new Date(lastrptdate * 1000).toLocaleString();

            //convert encharge state
            let stateIndex = ENCHARGE_STATE.indexOf(state);
            chargeStatus = ENCHARGE_STATE_1[stateIndex]

            if (me.enphaseServiceEncharge) {
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeStatus, status);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeLastReportDate, lastrptdate);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeFirmware, firmware);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeProducing, producing);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeCommunicating, communicating);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeProvisioned, provisioned);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeOperating, operating);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeSleepEnabled, sleepEnabled);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargePerfentFull, perfentFull);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeMaxCellTemp, maxCellTemp);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeSleepMinSoc, sleepMinSoc);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeSleepMaxSoc, sleepMaxSoc);
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeChargeStatus, chargeStatus);
            }

            me.enchargesSerialNumber.push(serialNumber);
            me.enchargesStatus.push(status);
            me.enchargesLastReportDate.push(lastrptdate);
            me.enchargesFirmware.push(firmware);
            me.enchargesProducing.push(producing);
            me.enchargesCommunicating.push(communicating);
            me.enchargesProvisioned.push(provisioned);
            me.enchargesOperating.push(operating);
            me.enchargesSleepEnabled.push(sleepEnabled);
            me.enchargesPerfentFull1.push(perfentFull);
            me.enchargesMaxCellTemp.push(maxCellTemp);
            me.enchargesSleepMinSoc.push(sleepMinSoc);
            me.enchargesSleepMaxSoc.push(sleepMaxSoc);
            me.enchargesChargeStatus.push(chargeStatus);
          }

          //encharges comm level
          if (me.checkCommLevel) {
            var key = '' + me.enchargesSerialNumber[i] + '';
            var commLevel = 0;
            if (me.pcuCommCheck.data[key] !== undefined) {
              commLevel = me.pcuCommCheck.data[key];
            }

            if (me.enphaseServiceEncharge && me.enchargesCommunicating[i]) {
              me.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeCommLevel, commLevel);
            }
            me.enchargesCommLevel.push(commLevel);
          }


          //encharges summary
          if (productionCT.status === 200 && productionCT.data !== undefined) {
            var type = productionCT.data.storage[0].type;
            var activeCount = productionCT.data.storage[0].activeCount;
            var readingTime = productionCT.data.storage[0].readingTime;
            var wNow = parseFloat((productionCT.data.storage[0].wNow) / 1000);
            var whNow = parseFloat((productionCT.data.storage[0].whNow + me.enchargeStorageOffset) / 1000);
            var chargeStatus = productionCT.data.storage[0].state;
            var percentFull = productionCT.data.storage[0].percentFull;

            //convert Unix time to local date time
            readingTime = new Date(readingTime * 1000).toLocaleString();

            //convert encharge state
            let stateIndex = chargeStatus.indexOf(ENCHARGE_STATE);
            chargeStatus = ENCHARGE_STATE_1[stateIndex]

            if (me.enphaseServiceEnchargePowerAndEnergy) {
              me.enphaseServiceEnchargePowerAndEnergy.updateCharacteristic(Characteristic.enphaseEnchargeReadingTime, readingTime);
              me.enphaseServiceEnchargePowerAndEnergy.updateCharacteristic(Characteristic.enphaseEnchargePower, wNow);
              me.enphaseServiceEnchargePowerAndEnergy.updateCharacteristic(Characteristic.enphaseEnchargeEnergy, whNow);
              me.enphaseServiceEnchargePowerAndEnergy.updateCharacteristic(Characteristic.enphaseEnchargePercentFull, percentFull);
              me.enphaseServiceEnchargePowerAndEnergy.updateCharacteristic(Characteristic.enphaseEnchargeActiveCount, activeCount);
              me.enphaseServiceEnchargePowerAndEnergy.updateCharacteristic(Characteristic.enphaseEnchargeState, chargeStatus);
            }

            me.enchargesType = type;
            me.enchargesActiveCount = activeCount;
            me.enchargesReadingTime = lastrptdate;
            me.enchargesPower = wNow;
            me.enchargesEnergy = whNow;
            me.enchargesState = chargeStatus;
            me.enchargesPercentFull = percentFull;
          }
        }
      }

      //microinverters power
      if (me.microinvertersCount > 0) {
        if (inventory.status === 200 && inventory.data !== undefined) {
          me.microinvertersSerialNumberActive = new Array();
          me.microinvertersLastReportDate = new Array();
          me.microinvertersFirmware = new Array();
          me.microinvertersProducing = new Array();
          me.microinvertersCommunicating = new Array();
          me.microinvertersProvisioned = new Array();
          me.microinvertersOperating = new Array();
          me.microinvertersStatus = new Array();
        }

        if (me.checkMicroinvertersPower) {
          me.allMicroinvertersSerialNumber = new Array();
          me.microinvertersReadingTimePower = new Array();
          me.microinvertersType = new Array();
          me.microinvertersLastPower = new Array();
          me.microinvertersMaxPower = new Array();
        }

        if (me.checkCommLevel) {
          me.microinvertersCommLevel = new Array();
        }

        //microinverters state
        for (let i = 0; i < me.microinvertersCount; i++) {
          if (inventory.status === 200 && inventory.data !== undefined) {
            var type = inventory.data[0].type;
            var partNum = inventory.data[0].devices[i].part_num;
            var installed = inventory.data[0].devices[i].installed;
            var serialNumber = inventory.data[0].devices[i].serial_num;
            var lastrptdate = inventory.data[0].devices[i].last_rpt_date;
            var adminState = inventory.data[0].devices[i].admin_state;
            var createdDate = inventory.data[0].devices[i].created_date;
            var devType = inventory.data[0].devices[i].dev_type;
            var imageLoadDate = inventory.data[0].devices[i].img_load_date;
            var firmware = inventory.data[0].devices[i].img_pnum_running;
            var ptpn = inventory.data[0].devices[i].ptpn;
            var chaneId = inventory.data[0].devices[i].chaneid;
            var deviceControl = inventory.data[0].devices[i].device_control;
            var producing = inventory.data[0].devices[i].producing;
            var communicating = inventory.data[0].devices[i].communicating;
            var provisioned = inventory.data[0].devices[i].provisioned;
            var operating = inventory.data[0].devices[i].operating;
            var status = inventory.data[0].devices[i].device_status;
            if (Array.isArray(status) && status.length === 1) {
              let code1 = status[0];
              let indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
              status = ENVOY_STATUS_CODE_1[indexCode1];
            } else if (Array.isArray(status) && status.length === 2) {
              let code1 = status[0];
              let indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
              let status1 = ENVOY_STATUS_CODE_1[indexCode1];
              let code2 = status[1];
              let indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
              let status2 = ENVOY_STATUS_CODE_1[indexCode2];
              status = status1 + ' / ' + status2;
            } else if (Array.isArray(status) && status.length === 3) {
              let code1 = status[0];
              let indexCode1 = ENVOY_STATUS_CODE.indexOf(code1);
              let status1 = ENVOY_STATUS_CODE_1[indexCode1];
              let code2 = status[1];
              let indexCode2 = ENVOY_STATUS_CODE.indexOf(code2);
              let status2 = ENVOY_STATUS_CODE_1[indexCode2];
              let code3 = status[2];
              let indexCode3 = ENVOY_STATUS_CODE.indexOf(code3);
              let status3 = ENVOY_STATUS_CODE_1[indexCode3];
              status = status1 + ' / ' + status2 + ' / ' + status3;
            } else {
              status = 'Not available';
            }

            //convert Unix time to local date time
            lastrptdate = new Date(lastrptdate * 1000).toLocaleString();

            if (me.enphaseServiceMicronverter) {
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterLastReportDate, lastrptdate);
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterFirmware, firmware);
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterProducing, producing);
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterCommunicating, communicating);
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterProvisioned, provisioned);
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterOperating, operating);
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterStatus, status);

            }

            me.microinvertersSerialNumberActive.push(serialNumber);
            me.microinvertersLastReportDate.push(lastrptdate);
            me.microinvertersFirmware.push(firmware);
            me.microinvertersProducing.push(producing);
            me.microinvertersCommunicating.push(communicating);
            me.microinvertersProvisioned.push(provisioned);
            me.microinvertersOperating.push(operating);
            me.microinvertersStatus.push(status);
          }

          //microinverters power
          if (me.checkMicroinvertersPower) {
            for (let j = 0; j < me.microinverters.data.length; j++) {
              let allSerialNumber = me.microinverters.data[j].serialNumber;
              me.allMicroinvertersSerialNumber.push(allSerialNumber);
            }
            var index = me.allMicroinvertersSerialNumber.indexOf(me.microinvertersSerialNumberActive[i]);
            var lastrptdate = 'Reading data failed';
            if (me.microinverters.data[index].lastReportDate !== undefined) {
              lastrptdate = me.microinverters.data[index].lastReportDate;
              //convert Unix time to local date time
              lastrptdate = new Date(lastrptdate * 1000).toLocaleString();
            }
            var type = 0;
            if (me.microinverters.data[index].devType !== undefined) {
              type = me.microinverters.data[index].devType;
            }
            var power = 0;
            if (me.microinverters.data[index].lastReportWatts !== undefined) {
              power = parseInt(me.microinverters.data[index].lastReportWatts);
            }
            var powerMax = 0;
            if (me.microinverters.data[index].maxReportWatts !== undefined) {
              powerMax = parseInt(me.microinverters.data[index].maxReportWatts);
            }

            if (me.enphaseServiceMicronverter && me.microinvertersCommunicating[i]) {
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterLastReportDate, lastrptdate);
              //me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterType, type);
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterPower, power);
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterPowerMax, powerMax);
            }

            me.microinvertersReadingTimePower.push(lastrptdate);
            me.microinvertersType.push(type);
            me.microinvertersLastPower.push(power);
            me.microinvertersMaxPower.push(powerMax);
          }

          //microinverters comm level
          if (me.checkCommLevel) {
            var key = '' + me.microinvertersSerialNumberActive[i] + '';
            var commLevel = 0;
            if (me.pcuCommCheck.data[key] !== undefined) {
              commLevel = me.pcuCommCheck.data[key];
            }

            if (me.enphaseServiceMicronverter && me.microinvertersCommunicating[i]) {
              me.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterCommLevel, commLevel);
            }
            me.microinvertersCommLevel.push(commLevel);
          }
        }
      }
      me.checkDeviceState = true;

      //start prepare accessory
      if (me.startPrepareAccessory) {
        me.prepareAccessory();
      }
    } catch (error) {
      me.log.error('Device: %s %s, update Device state error: %s', me.host, me.name, error);
      me.checkDeviceState = false;
      me.checkDeviceInfo = true;
    }
  }

  //Prepare accessory
  prepareAccessory() {
    this.log.debug('prepareAccessory');
    const accessoryName = this.name;
    const accessoryUUID = UUID.generate(accessoryName);
    const accessoryCategory = Categories.OTHER;
    const accessory = new Accessory(accessoryName, accessoryUUID, accessoryCategory);

    this.log.debug('prepareInformationService');
    const manufacturer = this.manufacturer;
    const modelName = this.modelName;
    const serialNumber = this.envoySerialNumber;
    const firmwareRevision = this.envoyFirmware;

    accessory.removeService(accessory.getService(Service.AccessoryInformation));
    const informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Name, accessoryName)
      .setCharacteristic(Characteristic.Manufacturer, manufacturer)
      .setCharacteristic(Characteristic.Model, modelName)
      .setCharacteristic(Characteristic.SerialNumber, serialNumber)
      .setCharacteristic(Characteristic.FirmwareRevision, firmwareRevision);
    accessory.addService(informationService);

    this.log.debug('prepareEnphaseServices');
    //envoy
    this.enphaseServiceEnvoy = new Service.enphaseEnvoy('Envoy ' + this.envoySerialNumber, 'enphaseServiceEnvoy');
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyAllerts)
      .onGet(async () => {
        let value = this.envoyAllerts;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s allerts: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface)
      .onGet(async () => {
        let value = this.envoyPrimaryInterface;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s network interface: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm)
      .onGet(async () => {
        let value = this.envoyNetworkWebComm;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s web communication: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten)
      .onGet(async () => {
        let value = this.envoyEverReportedToEnlighten;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s report to enlighten: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel)
      .onGet(async () => {
        let value = this.envoyCommNum + ' / ' + this.envoyCommLevel;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s communication devices and level: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel)
      .onGet(async () => {
        let value = this.envoyCommPcuNum + ' / ' + this.envoyCommPcuLevel;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s communication Encharges and level: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel)
      .onGet(async () => {
        let value = this.envoyCommAcbNum + ' / ' + this.envoyCommAcbLevel;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s communication Encharges and level %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel)
      .onGet(async () => {
        let value = this.envoyCommNsrbNum + ' / ' + this.envoyCommNsrbLevel;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s communication qRelays and level: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyDbSize)
      .onGet(async () => {
        let value = this.envoyDbSize + ' / ' + this.envoyDbPercentFull + '%';
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s db size: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyTariff)
      .onGet(async () => {
        let value = this.envoyTariff;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s tariff: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyUpdateStatus)
      .onGet(async () => {
        let value = this.envoyUpdateStatus;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s update status: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyTimeZone)
      .onGet(async () => {
        let value = this.envoyTimeZone;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s time zone: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime)
      .onGet(async () => {
        let value = this.envoyCurrentDate + ' ' + this.envoyCurrentTime;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s current date and time: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporDate)
      .onGet(async () => {
        let value = this.envoyLastEnlightenReporDate;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s last report to enlighten: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    accessory.addService(this.enphaseServiceEnvoy);

    //qrelay
    if (this.qRelaysCount > 0) {
      for (let i = 0; i < this.qRelaysCount; i++) {
        this.enphaseServiceQrelay = new Service.enphaseQrelay('Q-Relay ' + this.qRelaysSerialNumber[i], 'enphaseServiceQrelay' + i);
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayState)
          .onGet(async () => {
            let value = this.qRelaysRelay[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s relay: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Closed' : 'Open');
            }
            return value;
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayLinesCount)
          .onGet(async () => {
            let value = this.qRelaysLinesCount[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s lines: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        if (this.qRelaysLinesCount[i] >= 1) {
          this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayLine1Connected)
            .onGet(async () => {
              let value = this.qRelaysLine1Connected[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, qrelay: %s line 1: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Closed' : 'Open');
              }
              return value;
            });
          if (this.qRelaysLinesCount[i] >= 2) {
            this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayLine2Connected)
              .onGet(async () => {
                let value = this.qRelaysLine2Connected[i];
                if (!this.disableLogInfo) {
                  this.log('Device: %s %s, qrelay: %s line 2: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Closed' : 'Open');
                }
                return value;
              });
            if (this.qRelaysLinesCount[i] >= 3) {
              this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayLine3Connected)
                .onGet(async () => {
                  let value = this.qRelaysLine3Connected[i];
                  if (!this.disableLogInfo) {
                    this.log('Device: %s %s, qrelay: %s line 3: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Closed' : 'Open');
                  }
                  return value;
                });
            }
          }
        }
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayProducing)
          .onGet(async () => {
            let value = this.qRelaysProducing[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s producing: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayCommunicating)
          .onGet(async () => {
            let value = this.qRelaysCommunicating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s communicating: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayProvisioned)
          .onGet(async () => {
            let value = this.qRelaysProvisioned[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s provisioned: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayOperating)
          .onGet(async () => {
            let value = this.qRelaysOperating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s operating: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayCommLevel)
          .onGet(async () => {
            let value = this.qRelaysCommLevel[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s comm. level: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayStatus)
          .onGet(async () => {
            let value = this.qRelaysStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s status: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayFirmware)
          .onGet(async () => {
            let value = this.qRelaysFirmware[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s firmware: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayLastReportDate)
          .onGet(async () => {
            let value = this.qRelaysLastReportDate[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s last report: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        accessory.addService(this.enphaseServiceQrelay);
      }
    }

    //meters
    if (this.metersCount > 0) {
      for (let i = 0; i < this.metersCount; i++) {
        this.enphaseServiceMeter = new Service.enphaseMeter('Meter ' + this.metersMeasurementType[i], 'enphaseServiceMeter' + i);
        this.enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterState)
          .onGet(async () => {
            let value = this.metersState[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s state: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        this.enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterPhaseMode)
          .onGet(async () => {
            let value = this.metersPhaseMode[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s phase mode: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        this.enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterPhaseCount)
          .onGet(async () => {
            let value = this.metersPhaseCount[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s phase count: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        this.enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterMeteringStatus)
          .onGet(async () => {
            let value = this.metersMeteringStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s metering status: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        this.enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterStatusFlags)
          .onGet(async () => {
            let value = this.metersStatusFlags[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s status flag: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        accessory.addService(this.enphaseServiceMeter);
      }
    }

    //power and energy production
    this.enphaseServiceProduction = new Service.enphasePowerEnergyMeter('Production', 'enphaseServiceProduction');
    this.enphaseServiceProduction.getCharacteristic(Characteristic.enphasePower)
      .onGet(async () => {
        let value = this.productionPower;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production power: %s kW', this.host, accessoryName, value.toFixed(3));
        }
        return value;
      });
    this.enphaseServiceProduction.getCharacteristic(Characteristic.enphasePowerMax)
      .onGet(async () => {
        let value = this.productionPowerMax;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production power max: %s kW', this.host, accessoryName, value.toFixed(3));
        }
        return value;
      });
    this.enphaseServiceProduction.getCharacteristic(Characteristic.enphasePowerMaxDetected)
      .onGet(async () => {
        let value = this.productionPowerMaxDetectedState;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production power max detected: %s', this.host, accessoryName, value ? 'Yes' : 'No');
        }
        return value;
      });
    this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseEnergyToday)
      .onGet(async () => {
        let value = this.productionEnergyToday;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production energy today: %s kWh', this.host, accessoryName, value.toFixed(3));
        }
        return value;
      });
    this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
      .onGet(async () => {
        let value = this.productionEnergyLastSevenDays;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production energy last seven days: %s kWh', this.host, accessoryName, value.toFixed(3));
        }
        return value;
      });
    this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseEnergyLifetime)
      .onGet(async () => {
        let value = this.productionEnergyLifetime;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production energy lifetime: %s kWh', this.host, accessoryName, value.toFixed(3));
        }
        return value;
      });
    if (this.metersCount > 0 && this.metersProductionActiveCount > 0) {
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseRmsCurrent)
        .onGet(async () => {
          let value = this.productionRmsCurrent;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, production current: %s A', this.host, accessoryName, value.toFixed(3));
          }
          return value;
        });
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseRmsVoltage)
        .onGet(async () => {
          let value = this.productionRmsVoltage;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, production voltage: %s V', this.host, accessoryName, value.toFixed(1));
          }
          return value;
        });
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseReactivePower)
        .onGet(async () => {
          let value = this.productionReactivePower;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, production net reactive power: %s kVAr', this.host, accessoryName, value.toFixed(3));
          }
          return value;
        });
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseApparentPower)
        .onGet(async () => {
          let value = this.productionApparentPower;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, production net apparent power: %s kVA', this.host, accessoryName, value.toFixed(3));
          }
          return value;
        });
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphasePwrFactor)
        .onGet(async () => {
          let value = this.productionPwrFactor;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, production power factor: %s cos φ', this.host, accessoryName, value.toFixed(2));
          }
          return value;
        });
    }
    this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseReadingTime)
      .onGet(async () => {
        let value = this.productionReadingTime;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production last report: %s', this.host, accessoryName, value);
        }
        return value;
      });
    accessory.addService(this.enphaseServiceProduction);

    //power and energy consumption total
    if (this.metersCount > 0) {
      if (this.metersConsumtionTotalActiveCount > 0) {
        this.enphaseServiceConsumptionTotal = new Service.enphasePowerEnergyMeter('Consumption Total', 'enphaseServiceConsumptionTotal');
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphasePower)
          .onGet(async () => {
            let value = this.consumptionTotalPower;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total power : %s kW', this.host, accessoryName, value.toFixed(3));
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphasePowerMax)
          .onGet(async () => {
            let value = this.consumptionTotalPowerMax;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total power consumption max: %s kW', this.host, accessoryName, value.toFixed(3));
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphasePowerMaxDetected)
          .onGet(async () => {
            let value = this.consumptionTotalPowerMaxDetectedState;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total power consumption max detected: %s', this.host, accessoryName, value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseEnergyToday)
          .onGet(async () => {
            let value = this.consumptionTotalEnergyToday;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total energy consumption today: %s kWh', this.host, accessoryName, value.toFixed(3));
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
          .onGet(async () => {
            let value = this.consumptionTotalEnergyLastSevenDays;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total energy consumption last seven days: %s kWh', this.host, accessoryName, value.toFixed(3));
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseEnergyLifetime)
          .onGet(async () => {
            let value = this.consumptionTotalEnergyLifetime;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total energy lifetime: %s kWh', this.host, accessoryName, value.toFixed(3));
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseRmsCurrent)
          .onGet(async () => {
            let value = this.consumptionTotalRmsCurrent;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total current: %s A', this.host, accessoryName, value.toFixed(3));
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseRmsVoltage)
          .onGet(async () => {
            let value = this.consumptionTotalRmsVoltage;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total voltage: %s V', this.host, accessoryName, value.toFixed(1));
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseReactivePower)
          .onGet(async () => {
            let value = this.consumptionTotalReactivePower;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total reactive power: %s kVAr', this.host, accessoryName, value.toFixed(3));
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseApparentPower)
          .onGet(async () => {
            let value = this.consumptionTotalApparentPower;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total apparent power: %s kVA', this.host, accessoryName, value.toFixed(3));
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphasePwrFactor)
          .onGet(async () => {
            let value = this.consumptionTotalPwrFactor;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total power factor: %s cos φ', this.host, accessoryName, value.toFixed(2));
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseReadingTime)
          .onGet(async () => {
            let value = this.consumptionTotalReadingTime;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total last report: %s', this.host, accessoryName, value);
            }
            return value;
          });
        accessory.addService(this.enphaseServiceConsumptionTotal);
      }

      //power and energy consumption net
      if (this.metersConsumptionNetActiveCount > 0) {
        this.enphaseServiceConsumptionNet = new Service.enphasePowerEnergyMeter('Consumption Net', 'enphaseServiceConsumptionNet');
      }
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphasePower)
        .onGet(async () => {
          let value = this.consumptionNetPower;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, consumption net power: %s kW', this.host, accessoryName, value.toFixed(3));
          }
          return value;
        });
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphasePowerMax)
        .onGet(async () => {
          let value = this.consumptionNetPowerMax;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, consumption net power max: %s kW', this.host, accessoryName, value.toFixed(3));
          }
          return value;
        });
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphasePowerMaxDetected)
        .onGet(async () => {
          let value = this.consumptionNetPowerMaxDetectedState;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, consumption net power max detected: %s', this.host, accessoryName, value ? 'Yes' : 'No');
          }
          return value;
        });
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseEnergyToday)
        .onGet(async () => {
          let value = this.consumptionNetEnergyToday;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, consumption net energy today: %s kWh', this.host, accessoryName, value.toFixed(3));
          }
          return value;
        });
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
        .onGet(async () => {
          let value = this.consumptionNetEnergyLastSevenDays;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, consumption net energy last seven days: %s kWh', this.host, accessoryName, value.toFixed(3));
          }
          return value;
        });
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseEnergyLifetime)
        .onGet(async () => {
          let value = this.consumptionNetEnergyLifetime;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, consumption net energy lifetime: %s kWh', this.host, accessoryName, value.toFixed(3));
          }
          return value;
        });
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseRmsCurrent)
        .onGet(async () => {
          let value = this.consumptionNetRmsCurrent;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, consumption net current: %s A', this.host, accessoryName, value.toFixed(3));
          }
          return value;
        });
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseRmsVoltage)
        .onGet(async () => {
          let value = this.consumptionNetRmsVoltage;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, consumption net voltage: %s V', this.host, accessoryName, value.toFixed(1));
          }
          return value;
        });
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseReactivePower)
        .onGet(async () => {
          let value = this.consumptionNetReactivePower;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, consumption net reactive power: %s kVAr', this.host, accessoryName, value.toFixed(3));
          }
          return value;
        });
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseApparentPower)
        .onGet(async () => {
          let value = this.consumptionNetApparentPower;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, consumption net apparent power: %s kVA', this.host, accessoryName, value.toFixed(3));
          }
          return value;
        });
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphasePwrFactor)
        .onGet(async () => {
          let value = this.consumptionNetPwrFactor;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, consumption net power factor: %s cos φ', this.host, accessoryName, value.toFixed(2));
          }
          return value;
        });
      this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseReadingTime)
        .onGet(async () => {
          let value = this.consumptionNetReadingTime;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, consumption net last report: %s', this.host, accessoryName, value);
          }
          return value;
        });
      accessory.addService(this.enphaseServiceConsumptionNet);
    }


    //encharge storage power and energy
    if (this.encharge > 0 && this.enchargesActiveCount > 0) {
      this.enphaseServiceEnchargePowerAndEnergy = new Service.enphaseEnchargePowerAndEnergy('Encharges summary', 'enphaseServiceEnchargePowerAndEnergy');
      this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargePower)
        .onGet(async () => {
          let value = this.enchargesPower;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, power encharge storage: %s kW', this.host, accessoryName, value.toFixed(3));
          }
          return value;
        });
      this.enphaseServiceEnchargePowerAndEnergy.getCharacteristic(Characteristic.enphaseEnchargeEnergy)
        .onGet(async () => {
          let value = this.enchargesEnergy;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, energy encharge storage: %s kWh', this.host, accessoryName, value.toFixed(3));
          }
          return value;
        });
      this.enphaseServiceEnchargePowerAndEnergy.getCharacteristic(Characteristic.enphaseEnchargePercentFull)
        .onGet(async () => {
          let value = this.enchargesPercentFull;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, encharge percent full: %s', this.host, accessoryName, value);
          }
          return value;
        });
      this.enphaseServiceEnchargePowerAndEnergy.getCharacteristic(Characteristic.enphaseEnchargeActiveCount)
        .onGet(async () => {
          let value = this.enchargesActiveCount;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, encharge devices count: %s', this.host, accessoryName, value);
          }
          return value;
        });
      this.enphaseServiceEnchargePowerAndEnergy.getCharacteristic(Characteristic.enphaseEnchargeState)
        .onGet(async () => {
          let value = this.enchargesState;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, encharge state: %s', this.host, accessoryName, value);
          }
          return value;
        });
      this.enphaseServiceEnchargePowerAndEnergy.getCharacteristic(Characteristic.enphaseEnchargeReadingTime)
        .onGet(async () => {
          let value = this.enchargesReadingTime;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, encharge: %s last report: %s', this.host, accessoryName, value);
          }
          return value;
        });
      accessory.addService(this.enphaseServiceEnchargePowerAndEnergy);

      //encharge storage state
      for (let i = 0; i < this.enchargesActiveCount; i++) {
        this.enphaseServiceEncharge = new Service.enphaseEncharge('Encharge ', + this.enchargesSerialNumber[i], 'enphaseServiceEncharge' + i);
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeChargeStatus)
          .onGet(async () => {
            let value = this.enchargesChargeStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s charge status %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeProducing)
          .onGet(async () => {
            let value = this.enchargesProducing[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s producing: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeCommunicating)
          .onGet(async () => {
            let value = this.enchargesCommunicating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s communicating: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeProvisioned)
          .onGet(async () => {
            let value = this.enchargesProvisioned[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s provisioned: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeOperating)
          .onGet(async () => {
            let value = this.enchargesOperating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s operating: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseQrelayCommLevel)
          .onGet(async () => {
            let value = this.enchargesCommLevel[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s comm. level: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeSleepEnabled)
          .onGet(async () => {
            let value = this.enchargesSleepEnabled[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s sleep: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargePercentFull)
          .onGet(async () => {
            let value = this.enchargesPercentFull1[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s percent full: %s %', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeMaxCellTemp)
          .onGet(async () => {
            let value = this.enchargesMaxCellTemp[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s max cell temp: %s °C', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeSleepMinSoc)
          .onGet(async () => {
            let value = this.enchargesSleepMinSoc[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s sleep min soc: %s min', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeSleepMaxSoc)
          .onGet(async () => {
            let value = this.enchargesSleepMaxSoc[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s sleep max soc: %s min', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeStatus)
          .onGet(async () => {
            let value = this.enchargesStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s status: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeFirmware)
          .onGet(async () => {
            let value = this.enchargesFirmware[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s firmware: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeLastReportDate)
          .onGet(async () => {
            let value = this.enchargesLastReportDate[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s last report: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        accessory.addService(this.enphaseServiceEncharge);
      }
    }

    //microinverter
    if (this.microinvertersCount > 0 && this.microinvertersActiveCount > 0) {
      for (let i = 0; i < this.microinvertersCount; i++) {
        this.enphaseServiceMicronverter = new Service.enphaseMicroinverter('Microinverter ' + this.microinvertersSerialNumberActive[i], 'enphaseServiceMicronverter' + i);
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterPower)
          .onGet(async () => {
            let value = this.microinvertersLastPower[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s last power: %s W', this.host, accessoryName, this.microinvertersSerialNumberActive[i], value);
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterPowerMax)
          .onGet(async () => {
            let value = this.microinvertersMaxPower[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s max power: %s W', this.host, accessoryName, this.microinvertersSerialNumberActive[i], value);
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterProducing)
          .onGet(async () => {
            let value = this.microinvertersProducing[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s producing: %s', this.host, accessoryName, this.microinvertersSerialNumberActive[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterCommunicating)
          .onGet(async () => {
            let value = this.microinvertersCommunicating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s communicating: %s', this.host, accessoryName, this.microinvertersSerialNumberActive[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterProvisioned)
          .onGet(async () => {
            let value = this.microinvertersProvisioned[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s provisioned: %s', this.host, accessoryName, this.microinvertersSerialNumberActive[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterOperating)
          .onGet(async () => {
            let value = this.microinvertersOperating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s operating: %s', this.host, accessoryName, this.microinvertersSerialNumberActive[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterCommLevel)
          .onGet(async () => {
            let value = this.microinvertersCommLevel[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s comm. level: %s', this.host, accessoryName, this.microinvertersSerialNumberActive[i], value);
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterStatus)
          .onGet(async () => {
            let value = this.microinvertersStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s status: %s', this.host, accessoryName, this.microinvertersSerialNumberActive[i], value);
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterFirmware)
          .onGet(async () => {
            let value = this.microinvertersFirmware[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s firmware: %s', this.host, accessoryName, this.microinvertersSerialNumberActive[i], value);
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterLastReportDate)
          .onGet(async () => {
            let value = this.microinvertersReadingTimePower[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s last report: %s', this.host, accessoryName, this.microinvertersSerialNumberActive[i], value);
            }
            return value;
          });
        accessory.addService(this.enphaseServiceMicronverter);
      }
    }
    this.startPrepareAccessory = false;

    this.log.debug('Device: %s, publishExternalAccessories: %s.', this.host, accessoryName);
    this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
  }
}
