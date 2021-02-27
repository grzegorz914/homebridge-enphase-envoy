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

const NET_INTERFACE = ['ethernet', 'wifi', 'eth0', 'wlan0', 'cellurar', 'connected', 'disconnected', 'undefined'];
const NET_INTERFACE_1 = ['Ethernet', 'WiFi', 'Ethernet', 'WiFi', 'Cellurar', 'Connected', 'Disconnected', 'Unknown'];
const ENERGY_TARIFF = ['single_rate', 'time_to_use', 'time_of_use', 'none', 'other', 'undefined'];
const ENERGY_TARIFF_1 = ['Single rate', 'Time to use', 'Time of use', 'Not defined', 'Other', 'Unknown'];
const ENCHARGE_STATE = ['idle', 'discharging', 'charging', 'undefined'];
const ENCHARGE_STATE_1 = ['Idle', 'Discharging', 'Charging', 'Unknown'];
const ENVOY_UPDATE = ['satisfied', 'not-satisfied', 'undefined'];
const ENVOY_UPDATE_1 = ['Satisfied', 'Not satisfied', 'Unknown'];

const ENVOY_STATUS_CODE = ['undefined', 'enabled', 'disabled', 'one', 'two', 'three', 'normal', 'closed', 'open',
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
const ENVOY_STATUS_CODE_1 = ['Unknown', 'Enabled', 'Disabled', 'One', 'Two', 'Three', 'Normal', 'Closed', 'Open', 'No Data', 'Normal', 'BMU Hardware Error', 'BMU Image Error', 'BMU Max Current Warning', 'BMU Sense Error', 'Cell Max Temperature Error', 'Cell Max Temperature Warning', 'Cell Max Voltage Error',
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

  Characteristic.enphaseEnergyLifeTime = function () {
    Characteristic.call(this, 'Energy lifetime', Characteristic.enphaseEnergyLifeTime.UUID);
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
  inherits(Characteristic.enphaseEnergyLifeTime, Characteristic);
  Characteristic.enphaseEnergyLifeTime.UUID = '00004116-000B-1000-8000-0026BB765291';

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
    this.addOptionalCharacteristic(Characteristic.enphaseEnergyLifeTime);
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
      for (let i = 0; i < this.devices.length; i++) {
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
    this.productionEnergyLifeTime = 0;
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
    this.consumptionTotalEnergyLifeTime = 0;
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
    this.consumptionNetEnergyLifeTime = 0;
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
    this.log.debug('Device: %s %s, requesting devices info.', this.host, this.name);
    try {
      const [inventory, info, meters] = await axios.all([axios.get(this.url + ENVOY_INVENTORY_URL), axios.get(this.url + ENVOY_INFO_URL), axios.get(this.url + METERS_URL)]);
      this.log.debug('Device %s %s, get devices data inventory: %s info: %s meters: %s', this.host, this.name, inventory.data, info.data, meters.data);
      const result = await parseStringPromise(info.data);
      this.log.debug('Device: %s %s, parse info.xml successful: %s', this.host, this.name, JSON.stringify(result, null, 2));

      const obj = Object.assign(result, inventory.data, meters.data);
      const devInfo = JSON.stringify(obj, null, 2);
      const writeDevInfoFile = await fsPromises.writeFile(this.devInfoFile, devInfo);
      this.log.debug('Device: %s %s, saved Device Info successful.', this.host, this.name);

      const time = new Date(result.envoy_info.time[0] * 1000).toLocaleString();
      const serialNumber = result.envoy_info.device[0].sn[0];
      const firmware = result.envoy_info.device[0].software[0];
      const microinverters = inventory.data[0].devices.length;
      const encharges = inventory.data[1].devices.length;
      const qrelays = inventory.data[2].devices.length;
      const ctmeters = meters.data.length;

      if (ctmeters > 0) {
        let ctmeterProduction = ((meters.data[0].state) === 'enabled');
        let ctmeterConsumption = ((meters.data[1].state) === 'enabled');
        this.metersProduction = ctmeterProduction;
        this.metersConsumption = ctmeterConsumption;
      }

      this.log('-------- %s --------', this.name);
      this.log('Manufacturer: %s', this.manufacturer);
      this.log('Model: %s', this.modelName);
      this.log('Meters: %s', ctmeters);
      this.log('Q-Relays: %s', qrelays);
      this.log('Encharges: %s', encharges);
      this.log('Inverters: %s', microinverters);
      this.log('Firmware: %s', firmware);
      this.log('SerialNr: %s', serialNumber);
      this.log('Time: %s', time);
      this.log('----------------------------------');
      this.envoyTime = time;
      this.envoySerialNumber = serialNumber;
      this.envoyFirmware = firmware;
      this.microinvertersCount = microinverters;
      this.enchargesCount = encharges;
      this.qRelaysCount = qrelays;
      this.metersCount = ctmeters;

      this.checkDeviceInfo = false;
      this.updateDeviceState();
    } catch (error) {
      this.log.error('Device: %s %s, requesting devices info eror: %s, state: Offline trying to reconnect.', this.host, this.name, error);
      this.checkDeviceInfo = true;
    };
  }

  async updateDeviceState() {
    try {
      //read all data;
      const [home, inventory, meters, production, productionCT] = await axios.all([axios.get(this.url + ENVOY_HOME_URL), axios.get(this.url + ENVOY_INVENTORY_URL), axios.get(this.url + METERS_URL), axios.get(this.url + PRODUCTION_INVERTERS_SUM_URL), axios.get(this.url + PRODUCTION_CT_URL)]);
      this.log.debug('Debug home: %s, inventory: %s, meters: %s, production: %s productionCT: %s', home.data, inventory.data, meters.data, production.data, productionCT.data);

      //check communications level of qrelays, encharges, microinverters
      if (this.installerPasswd) {
        try {
          //authorization installer
          const authInstaller = {
            method: 'GET',
            rejectUnauthorized: false,
            digestAuth: this.installerUser + ':' + this.installerPasswd,
            dataType: 'json',
            timeout: [5000, 5000]
          };
          const pcuCommCheck = await http.request(this.url + ENVOY_PCU_COMM_CHECK_URL, authInstaller);
          this.log.debug('Debug pcuCommCheck: %s', pcuCommCheck.data);
          this.pcuCommCheck = pcuCommCheck;
          this.checkCommLevel = true;
        } catch (error) {
          this.log.debug('Device: %s %s, pcuCommCheck error: %s', this.host, this.name, error);
          this.checkCommLevel = false;
        };
      }

      if (this.microinvertersCount > 0) {
        try {
          //authorization envoy
          const user = this.envoyUser;
          const passSerialNumber = this.envoySerialNumber.substring(6);
          const passEnvoy = this.envoyPasswd;
          const passwd = passEnvoy || passSerialNumber;
          const auth = user + ':' + passwd;
          const authEnvoy = {
            method: 'GET',
            rejectUnauthorized: false,
            digestAuth: auth,
            dataType: 'json',
            timeout: [5000, 5000]
          };
          const microinverters = await http.request(this.url + PRODUCTION_INVERTERS_URL, authEnvoy);
          this.log.debug('Debug production inverters: %s', microinverters.data);
          this.microinverters = microinverters;
          this.checkMicroinvertersPower = true;
        } catch (error) {
          this.log.debug('Device: %s %s, microinverters error: %s', this.host, this.name, error);
          this.checkMicroinvertersPower = false;
        };
      }

      // check enabled microinverters, meters, encharges
      if (productionCT.status === 200 && productionCT.data !== undefined) {

        let microinvertersActiveCount = productionCT.data.production[0].activeCount;
        if (this.metersProduction) {
          let metersProductionCount = productionCT.data.production[1].activeCount;
          this.metersProductionActiveCount = metersProductionCount;
        }
        if (this.metersConsumption) {
          let metersConsumtionTotalCount = productionCT.data.consumption[0].activeCount;
          let metersConsumptionNetCount = productionCT.data.consumption[1].activeCount;
          this.metersConsumtionTotalActiveCount = metersConsumtionTotalCount;
          this.metersConsumptionNetActiveCount = metersConsumptionNetCount;
        }
        this.microinvertersActiveCount = microinvertersActiveCount;
      }

      //envoy
      if (home.status === 200 && home.data !== undefined) {
        const softwareBuildEpoch = home.data.software_build_epoch;
        const isEnvoy = (home.data.is_nonvoy == false);
        const dbSize = home.data.db_size;
        const dbPercentFull = home.data.db_percent_full;
        const timeZone = home.data.timezone;
        const currentDate = new Date(home.data.current_date).toLocaleString().slice(0, 11);
        const currentTime = home.data.current_time;
        const networkWebComm = home.data.network.web_comm;
        const everReportedToEnlighten = home.data.network.ever_reported_to_enlighten;
        const lastEnlightenReporDate = new Date(home.data.network.last_enlighten_report_time * 1000).toLocaleString();
        const primaryInterface = NET_INTERFACE_1[NET_INTERFACE.indexOf(home.data.network.primary_interface)];
        const interfacesLength = home.data.network.interfaces.length;
        if (interfacesLength >= 1) {
          const interfaces0Type = home.data.network.interfaces[0].type;
          const interfaces0Interface = home.data.network.interfaces[0].interface;
          const interfaces0Mac = home.data.network.interfaces[0].mac;
          const interfaces0Dhcp = home.data.network.interfaces[0].dhcp;
          const interfaces0Ip = home.data.network.interfaces[0].ip;
          const interfaces0SignalStrength = home.data.network.interfaces[0].signal_strength;
          const interfaces0Carrier = home.data.network.interfaces[0].carrier;
          if (interfacesLength >= 2) {
            const interfaces1SignalStrenth = home.data.network.interfaces[1].signal_strength;
            const interfaces1SignalStrengthMax = home.data.network.interfaces[1].signal_strength_max;
            const interfaces1Type = home.data.network.interfaces[1].type;
            const interfaces1Interface = home.data.network.interfaces[1].interface;
            const interfaces1Dhcp = home.data.network.interfaces[1].dhcp;
            const interfaces1Ip = home.data.network.interfaces[1].ip;
            const interfaces1Carrier = home.data.network.interfaces[1].carrier;
            const interfaces1Supported = home.data.network.interfaces[1].supported;
            const interfaces1Present = home.data.network.interfaces[1].present;
            const interfaces1Configured = home.data.network.interfaces[1].configured;
            const interfaces1Status = NET_INTERFACE_1[NET_INTERFACE.indexOf(home.data.network.interfaces[1].status)];
          }
        }
        const tariff = ENERGY_TARIFF_1[ENERGY_TARIFF.indexOf(home.data.tariff)];
        const commNum = home.data.comm.num;
        const commLevel = home.data.comm.level;
        const commPcuNum = home.data.comm.pcu.num;
        const commPcuLevel = home.data.comm.pcu.level;
        const commAcbNum = home.data.comm.acb.num;
        const commAcbLevel = home.data.comm.acb.level;
        const commNsrbNum = home.data.comm.nsrb.num;
        const commNsrbLevel = home.data.comm.nsrb.level;
        let status = home.data.allerts;
        const updateStatus = ENVOY_UPDATE_1[ENVOY_UPDATE.indexOf(home.data.update_status)];

        // convert status
        if (Array.isArray(status)) {
          let statusLength = status.length;
          for (let j = 0; j < statusLength; j++) {
            status = ENVOY_STATUS_CODE_1[ENVOY_STATUS_CODE.indexOf(status[j])];
          }
        } else {
          status = 'Not available';
        }

        if (this.enphaseServiceEnvoy) {
          this.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyAllerts, status);
          this.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyDbSize, dbSize + ' / ' + dbPercentFull + '%');
          this.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyTariff, tariff);
          this.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface, primaryInterface);
          this.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm, networkWebComm);
          this.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten, everReportedToEnlighten);
          this.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel, commNum + ' / ' + commLevel);
          this.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel, commPcuNum + ' / ' + commPcuLevel);
          this.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel, commAcbNum + ' / ' + commAcbLevel);
          this.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel, commNsrbNum + ' / ' + commNsrbLevel);
          this.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyTimeZone, timeZone);
          this.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime, currentDate + ' ' + currentTime);
          this.enphaseServiceEnvoy.updateCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporDate, lastEnlightenReporDate);
        }

        this.envoySoftwareBuildEpoch = softwareBuildEpoch;
        this.envoyIsEnvoy = isEnvoy;
        this.envoyDbSize = dbSize;
        this.envoyDbPercentFull = dbPercentFull;
        this.envoyTimeZone = timeZone;
        this.envoyCurrentDate = currentDate;
        this.envoyCurrentTime = currentTime;
        this.envoyNetworkWebComm = networkWebComm;
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
        this.envoyAllerts = status;
        this.envoyUpdateStatus = updateStatus;
      }

      //qrelays
      if (this.qRelaysCount > 0) {
        if (inventory.status === 200 && inventory.data !== undefined) {
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
        }
        if (this.checkCommLevel) {
          this.qRelaysCommLevel = new Array();
        }

        for (let i = 0; i < this.qRelaysCount; i++) {
          if (inventory.status === 200 && inventory.data !== undefined) {
            const type = inventory.data[2].type;
            const devicesLength = inventory.data[2].devices.length;
            const partNum = inventory.data[2].devices[i].part_num;
            const installed = inventory.data[2].devices[i].installed;
            const serialNumber = inventory.data[2].devices[i].serial_num;
            let status = inventory.data[2].devices[i].device_status;
            const lastrptdate = new Date(inventory.data[2].devices[i].last_rpt_date * 1000).toLocaleString();
            const adminState = inventory.data[2].devices[i].admin_state;
            const devType = inventory.data[2].devices[i].dev_type;
            const createdDate = inventory.data[2].devices[i].created_date;
            const imageLoadDate = inventory.data[2].devices[i].img_load_date;
            const firmware = inventory.data[2].devices[i].img_pnum_running;
            const ptpn = inventory.data[2].devices[i].ptpn;
            const chaneId = inventory.data[2].devices[i].chaneid;
            const deviceControl = inventory.data[2].devices[i].device_control;
            const producing = inventory.data[2].devices[i].producing;
            const communicating = inventory.data[2].devices[i].communicating;
            const provisioned = inventory.data[2].devices[i].provisioned;
            const operating = inventory.data[2].devices[i].operating;
            const relay = ENVOY_STATUS_CODE_1[ENVOY_STATUS_CODE.indexOf(inventory.data[2].devices[i].relay)];
            const reasonCode = inventory.data[2].devices[i].reason_code;
            const reason = inventory.data[2].devices[i].reason;
            const linesCount = inventory.data[2].devices[i]['line-count'];

            // convert status
            let statusLength = status.length;
            let arrStatus = new Array();
            if (Array.isArray(status) && statusLength > 0) {
              for (let j = 0; j < statusLength; j++) {
                arrStatus.push(ENVOY_STATUS_CODE_1[ENVOY_STATUS_CODE.indexOf(status[j])]);
              }
              status = arrStatus.join(', ')
            } else {
              status = 'Not available';
            }

            if (linesCount >= 1) {
              const line1Connected = inventory.data[2].devices[i]['line1-connected'];
              if (this.enphaseServiceQrelay) {
                this.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayLine1Connected, line1Connected);
              }
              this.qRelaysLine1Connected.push(line1Connected);
              if (linesCount >= 2) {
                const line2Connected = inventory.data[2].devices[i]['line2-connected'];
                if (this.enphaseServiceQrelay) {
                  this.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayLine2Connected, line2Connected);
                }
                this.qRelaysLine2Connected.push(line2Connected);
                if (linesCount >= 3) {
                  const line3Connected = inventory.data[2].devices[i]['line3-connected'];
                  if (this.enphaseServiceQrelay) {
                    this.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayLine3Connected, line3Connected);
                  }
                  this.qRelaysLine3Connected.push(line3Connected);
                }
              }
            }

            if (this.enphaseServiceQrelay) {
              this.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayStatus, status);
              this.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayLastReportDate, lastrptdate);
              this.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayFirmware, firmware);
              this.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayProducing, producing);
              this.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayCommunicating, communicating);
              this.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayProvisioned, provisioned);
              this.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayOperating, operating);
              this.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayState, relay);
              this.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayLinesCount, linesCount);
            }

            this.qRelaysSerialNumber.push(serialNumber);
            this.qRelaysStatus.push(status);
            this.qRelaysLastReportDate.push(lastrptdate);
            this.qRelaysFirmware.push(firmware);
            this.qRelaysProducing.push(producing);
            this.qRelaysCommunicating.push(communicating);
            this.qRelaysProvisioned.push(provisioned);
            this.qRelaysOperating.push(operating);
            this.qRelaysRelay.push(relay);
            this.qRelaysLinesCount.push(linesCount);
          }

          // get qrelays comm level
          if (this.checkCommLevel) {
            const key = '' + this.qRelaysSerialNumber[i] + '';
            let commLevel = 0;
            if (this.pcuCommCheck.data[key] !== undefined) {
              commLevel = this.pcuCommCheck.data[key];
            }

            if (this.enphaseServiceQrelay && this.qRelaysCommunicating[i]) {
              this.enphaseServiceQrelay.updateCharacteristic(Characteristic.enphaseQrelayCommLevel, commLevel);
            }
            this.qRelaysCommLevel.push(commLevel);
          }
        }
      }

      //meters
      if (this.metersCount > 0) {
        if (meters.status === 200 && meters.data !== undefined) {
          this.metersEid = new Array();
          this.metersState = new Array();
          this.metersMeasurementType = new Array();
          this.metersPhaseMode = new Array();
          this.metersPhaseCount = new Array();
          this.metersMeteringStatus = new Array();
          this.metersStatusFlags = new Array();

          for (let i = 0; i < this.metersCount; i++) {
            const eid = meters.data[i].eid;
            const state = ENVOY_STATUS_CODE_1[ENVOY_STATUS_CODE.indexOf(meters.data[i].state)];
            const measurementType = meters.data[i].measurementType;
            const phaseMode = ENVOY_STATUS_CODE_1[ENVOY_STATUS_CODE.indexOf(meters.data[i].phaseMode)];
            const phaseCount = meters.data[i].phaseCount;
            const meteringStatus = ENVOY_STATUS_CODE_1[ENVOY_STATUS_CODE.indexOf(meters.data[i].meteringStatus)];
            let status = meters.data[i].statusFlags;

            // convert status
            let statusLength = status.length;
            let arrStatus = new Array();
            if (Array.isArray(status) && statusLength > 0) {
              for (let j = 0; j < statusLength; j++) {
                arrStatus.push(ENVOY_STATUS_CODE_1[ENVOY_STATUS_CODE.indexOf(status[j])]);
              }
              status = arrStatus.join(', ')
            } else {
              status = 'Not available';
            }


            if (this.enphaseServiceMeter) {
              this.enphaseServiceMeter.updateCharacteristic(Characteristic.enphaseMeterState, state);
              this.enphaseServiceMeter.updateCharacteristic(Characteristic.enphaseMeterPhaseMode, phaseMode);
              this.enphaseServiceMeter.updateCharacteristic(Characteristic.enphaseMeterPhaseCount, phaseCount);
              this.enphaseServiceMeter.updateCharacteristic(Characteristic.enphaseMeterMeteringStatus, meteringStatus);
              this.enphaseServiceMeter.updateCharacteristic(Characteristic.enphaseMeterStatusFlags, status);
            }

            this.metersEid.push(eid);
            this.metersState.push(state);
            this.metersMeasurementType.push(measurementType);
            this.metersPhaseMode.push(phaseMode);
            this.metersPhaseCount.push(phaseCount);
            this.metersMeteringStatus.push(meteringStatus);
            this.metersStatusFlags.push(status);
          }
        }

        //realtime meters stream data
        if (this.metersStreamData) {
          try {
            //authorization envoy
            const user = this.envoyUser;
            const passSerialNumber = this.envoySerialNumber.substring(6);
            const passEnvoy = this.envoyPasswd;
            const passwd = passEnvoy || passSerialNumber;
            const auth = user + ':' + passwd;
            const option = {
              method: 'GET',
              rejectUnauthorized: false,
              digestAuth: auth,
              timeout: [3000, 5000]
            };
            const metersStream = await http.request(this.url + METERS_STREAM_DATA_URL, option);
            this.log('Debug metersStream: %s', metersStream.data);

            if (this.metersProductionActiveCount) {
              const activePowerL1 = metersStream.data.data.production['ph-a'].p;
              const activePowerL2 = metersStream.data.data.production['ph-b'].p;
              const activePowerL3 = metersStream.data.data.production['ph-c'].p;
              const reactivePowerL1 = metersStream.data.data.production['ph-a'].q;
              const reactivePowerL2 = metersStream.data.data.production['ph-b'].q;
              const reactivePowerL3 = metersStream.data.data.production['ph-c'].q;
              const apparentPowerL1 = metersStream.data.data.production['ph-a'].s;
              const apparentPowerL2 = metersStream.data.data.production['ph-b'].s;
              const apparentPowerL3 = metersStream.data.data.production['ph-c'].s;
              const voltageL1 = metersStream.data.data.production['ph-a'].v;
              const voltageL2 = metersStream.data.data.production['ph-b'].v;
              const voltageL3 = metersStream.data.data.production['ph-c'].v;
              const currentL1 = metersStream.data.data.production['ph-a'].i;
              const currentL2 = metersStream.data.data.production['ph-b'].i;
              const currentL3 = metersStream.data.data.production['ph-c'].i;
              const powerFactorL1 = metersStream.data.data.production['ph-a'].pf;
              const powerFactorL2 = metersStream.data.data.production['ph-b'].pf;
              const powerFactorL3 = metersStream.data.data.production['ph-c'].pf;
              const frequencyL1 = metersStream.data.data.production['ph-a'].f;
              const frequencyL2 = metersStream.data.data.production['ph-b'].f;
              const frequencyL3 = metersStream.data.data.production['ph-c'].f;

              this.metersStreamDataProductionActivePowerL1 = activePowerL1;
              this.metersStreamDataProductionActivePowerL2 = activePowerL2;
              this.metersStreamDataProductionActivePowerL3 = activePowerL3;
              this.metersStreamDataProductionReactivePowerL1 = reactivePowerL1;
              this.metersStreamDataProductionReactivePowerL2 = reactivePowerL2;
              this.metersStreamDataProductionReactivePowerL3 = reactivePowerL3;
              this.metersStreamDataProductionApparentPowerL1 = apparentPowerL1;
              this.metersStreamDataProductionApparentPowerL2 = apparentPowerL2;
              this.metersStreamDataProductionApparentPowerL3 = apparentPowerL3;
              this.metersStreamDataProductionVoltageL1 = voltageL1;
              this.metersStreamDataProductionVoltageL2 = voltageL2;
              this.metersStreamDataProductionVoltageL3 = voltageL3;
              this.metersStreamDataProductionCurrentL1 = currentL1;
              this.metersStreamDataProductionCurrentL2 = currentL2;
              this.metersStreamDataProductionCurrentL3 = currentL3;
              this.metersStreamDataProductionPowerFactorL1 = powerFactorL1;
              this.metersStreamDataProductionPowerFactorL2 = powerFactorL2;
              this.metersStreamDataProductionPowerFactorL3 = powerFactorL3;
              this.metersStreamDataProductionFrequencyL1 = frequencyL1;
              this.metersStreamDataProductionFrequencyL2 = frequencyL2;
              this.metersStreamDataProductionFrequencyL3 = frequencyL3;

              this.metersStreamDataProductionActivePowerSum = (activePowerL1 + activePowerL2 + activePowerL3);
              this.metersStreamDataProductionReactivePowerSum = (reactivePowerL1 + reactivePowerL2 + reactivePowerL3);
              this.metersStreamDataProductionApparentPowerSum = (apparentPowerL1 + apparentPowerL2 + apparentPowerL3);
              this.metersStreamDataProductionVoltageAvg = (voltageL1 + voltageL2 + voltageL3) / 3;
              this.metersStreamDataProductionCurrentSum = (currentL1 + currentL2 + currentL3);
              this.metersStreamDataProductionPowerFactorAvg = (powerFactorL1 + powerFactorL2 + powerFactorL3) / 3;
              this.metersStreamDataProductionFrequencyAvg = (frequencyL1 + frequencyL2 + frequencyL3) / 3;
            }

            if (this.metersConsumptionNetActiveCount) {
              const activePowerL1 = data['net-consumption']['ph-a'].p;
              const activePowerL2 = data['net-consumption']['ph-b'].p;
              const activePowerL3 = data['net-consumption']['ph-c'].p;
              const reactivePowerL1 = data['net-consumption']['ph-a'].q;
              const reactivePowerL2 = data['net-consumption']['ph-b'].q;
              const reactivePowerL3 = data['net-consumption']['ph-c'].q;
              const apparentPowerL1 = data['net-consumption']['ph-a'].s;
              const apparentPowerL2 = data['net-consumption']['ph-b'].s;
              const apparentPowerL3 = data['net-consumption']['ph-c'].s;
              const voltageL1 = data['net-consumption']['ph-a'].v;
              const voltageL2 = data['net-consumption']['ph-b'].v;
              const voltageL3 = data['net-consumption']['ph-c'].v;
              const currentL1 = data['net-consumption']['ph-a'].i;
              const currentL2 = data['net-consumption']['ph-b'].i;
              const currentL3 = data['net-consumption']['ph-c'].i;
              const powerFactorL1 = data['net-consumption']['ph-a'].pf;
              const powerFactorL2 = data['net-consumption']['ph-b'].pf;
              const powerFactorL3 = data['net-consumption']['ph-c'].pf;
              const frequencyL1 = data['net-consumption']['ph-a'].f;
              const frequencyL2 = data['net-consumption']['ph-b'].f;
              const frequencyL3 = data['net-consumption']['ph-c'].f;

              this.metersStreamDataConsumptionNetActivePowerL1 = activePowerL1;
              this.metersStreamDataConsumptionNetActivePowerL2 = activePowerL2;
              this.metersStreamDataConsumptionNetActivePowerL3 = activePowerL3;
              this.metersStreamDataConsumptionNetReactivePowerL1 = reactivePowerL1;
              this.metersStreamDataConsumptionNetReactivePowerL2 = reactivePowerL2;
              this.metersStreamDataConsumptionNetReactivePowerL3 = reactivePowerL3;
              this.metersStreamDataConsumptionNetApparentPowerL1 = apparentPowerL1;
              this.metersStreamDataConsumptionNetApparentPowerL2 = apparentPowerL2;
              this.metersStreamDataConsumptionNetApparentPowerL3 = apparentPowerL3;
              this.metersStreamDataConsumptionNetVoltageL1 = voltageL1;
              this.metersStreamDataConsumptionNetVoltageL2 = voltageL2;
              this.metersStreamDataConsumptionNetVoltageL3 = voltageL3;
              this.metersStreamDataConsumptionNetCurrentL1 = currentL1;
              this.metersStreamDataConsumptionNetCurrentL2 = currentL2;
              this.metersStreamDataConsumptionNetCurrentL3 = currentL3;
              this.metersStreamDataConsumptionNetPowerFactorL1 = powerFactorL1;
              this.metersStreamDataConsumptionNetPowerFactorL2 = powerFactorL2;
              this.metersStreamDataConsumptionNetPowerFactorL3 = powerFactorL3;
              this.metersStreamDataConsumptionNetFrequencyL1 = frequencyL1;
              this.metersStreamDataConsumptionNetFrequencyL2 = frequencyL2;
              this.metersStreamDataConsumptionNetFrequencyL3 = frequencyL3;

              this.metersStreamDataConsumptionNetActivePowerSum = (activePowerL1 + activePowerL2 + activePowerL3);
              this.metersStreamDataConsumptionNetReactivePowerSum = (reactivePowerL1 + reactivePowerL2 + reactivePowerL3);
              this.metersStreamDataConsumptionNetApparentPowerSum = (apparentPowerL1 + apparentPowerL2 + apparentPowerL3);
              this.metersStreamDataConsumptionNetVoltageAvg = (voltageL1 + voltageL2 + voltageL3) / 3;
              this.metersStreamDataConsumptionNetCurrentSum = (currentL1 + currentL2 + currentL3);
              this.metersStreamDataConsumptionNetPowerFactorAvg = (powerFactorL1 + powerFactorL2 + powerFactorL3) / 3;
              this.metersStreamDataConsumptionNetFrequencyAvg = (frequencyL1 + frequencyL2 + frequencyL3) / 3;
            }

            if (this.metersConsumtionTotalActiveCount) {
              const activePowerL1 = data['total-consumption']['ph-a'].p;
              const activePowerL2 = data['total-consumption']['ph-b'].p;
              const activePowerL3 = data['total-consumption']['ph-c'].p;
              const reactivePowerL1 = data['total-consumption']['ph-a'].q;
              const reactivePowerL2 = data['total-consumption']['ph-b'].q;
              const reactivePowerL3 = data['total-consumption']['ph-c'].q;
              const apparentPowerL1 = data['total-consumption']['ph-a'].s;
              const apparentPowerL2 = data['total-consumption']['ph-b'].s;
              const apparentPowerL3 = data['total-consumption']['ph-c'].s;
              const voltageL1 = data['total-consumption']['ph-a'].v;
              const voltageL2 = data['total-consumption']['ph-b'].v;
              const voltageL3 = data['total-consumption']['ph-c'].v;
              const currentL1 = data['total-consumption']['ph-a'].i;
              const currentL2 = data['total-consumption']['ph-b'].i;
              const currentL3 = data['total-consumption']['ph-c'].i;
              const powerFactorL1 = data['total-consumption']['ph-a'].pf;
              const powerFactorL2 = data['total-consumption']['ph-b'].pf;
              const powerFactorL3 = data['total-consumption']['ph-c'].pf;
              const frequencyL1 = data['total-consumption']['ph-a'].f;
              const frequencyL2 = data['total-consumption']['ph-b'].f;
              const frequencyL3 = data['total-consumption']['ph-c'].f;

              this.metersStreamDataConsumptionTotalActivePowerL1 = activePowerL1;
              this.metersStreamDataConsumptionTotalActivePowerL2 = activePowerL2;
              this.metersStreamDataConsumptionTotalActivePowerL3 = activePowerL3;
              this.metersStreamDataConsumptionTotalReactivePowerL1 = reactivePowerL1;
              this.metersStreamDataConsumptionTotalReactivePowerL2 = reactivePowerL2;
              this.metersStreamDataConsumptionTotalReactivePowerL3 = reactivePowerL3;
              this.metersStreamDataConsumptionTotalApparentPowerL1 = apparentPowerL1;
              this.metersStreamDataConsumptionTotalApparentPowerL2 = apparentPowerL2;
              this.metersStreamDataConsumptionTotalApparentPowerL3 = apparentPowerL3;
              this.metersStreamDataConsumptionTotalVoltageL1 = voltageL1;
              this.metersStreamDataConsumptionTotalVoltageL2 = voltageL2;
              this.metersStreamDataConsumptionTotalVoltageL3 = voltageL3;
              this.metersStreamDataConsumptionTotalCurrentL1 = currentL1;
              this.metersStreamDataConsumptionTotalCurrentL2 = currentL2;
              this.metersStreamDataConsumptionTotalCurrentL3 = currentL3;
              this.metersStreamDataConsumptionTotalPowerFactorL1 = powerFactorL1;
              this.metersStreamDataConsumptionTotalPowerFactorL2 = powerFactorL2;
              this.metersStreamDataConsumptionTotalPowerFactorL3 = powerFactorL3;
              this.metersStreamDataConsumptionTotalFrequencyL1 = frequencyL1;
              this.metersStreamDataConsumptionTotalFrequencyL2 = frequencyL2;
              this.metersStreamDataConsumptionTotalFrequencyL3 = frequencyL3;

              this.metersStreamDataConsumptionTotalActivePowerSum = (activePowerL1 + activePowerL2 + activePowerL3);
              this.metersStreamDataConsumptionTotalReactivePowerSum = (reactivePowerL1 + reactivePowerL2 + reactivePowerL3);
              this.metersStreamDataConsumptionTotalApparentPowerSum = (apparentPowerL1 + apparentPowerL2 + apparentPowerL3);
              this.metersStreamDataConsumptionTotalVoltageAvg = (voltageL1 + voltageL2 + voltageL3) / 3;
              this.metersStreamDataConsumptionTotalCurrentSum = (currentL1 + currentL2 + currentL3);
              this.metersStreamDataConsumptionTotalPowerFactorAvg = (powerFactorL1 + powerFactorL2 + powerFactorL3) / 3;
              this.metersStreamDataConsumptionTotalFrequencyAvg = (frequencyL1 + frequencyL2 + frequencyL3) / 3;
            }
          } catch (error) {
            this.log('Device: %s %s, metersStream error: %s', this.host, this.name, error);
            this.metersStreamData = false;
          };
        }
      }

      //production
      //microinverters summary 
      const productionMicroSummarywhToday = parseFloat(production.data.wattHoursToday / 1000);
      const productionMicroSummarywhLastSevenDays = parseFloat(production.data.wattHoursSevenDays / 1000);
      const productionMicroSummarywhLifeTime = parseFloat((production.data.wattHoursLifetime + this.productionEnergyLifetimeOffset) / 1000);
      const productionMicroSummaryWattsNow = parseFloat(production.data.wattsNow / 1000);

      if (productionCT.status === 200) {
        //microinverters current transformer
        const productionMicroType = productionCT.data.production[0].type;
        const productionMicroActiveCount = productionCT.data.production[0].activeCount;
        const productionMicroReadingTime = new Date(productionCT.data.production[0].readingTime * 1000).toLocaleString();
        const productionMicroPower = parseFloat(productionCT.data.production[0].wNow / 1000);
        const productionMicroEnergyLifeTime = parseFloat((productionCT.data.production[0].whLifetime + this.productionEnergyLifetimeOffset) / 1000);

        //current transformers
        const productionType = this.metersProduction ? productionCT.data.production[1].type : 0;
        const productionActiveCount = this.metersProduction ? productionCT.data.production[1].activeCount : 0;
        const productionMeasurmentType = this.metersProduction ? productionCT.data.production[1].measurementType : 0;
        const productionReadingTime = this.metersProduction ? new Date(productionCT.data.production[1].readingTime * 1000).toLocaleString() : productionMicroReadingTime;
        const productionPower = this.metersProduction ? parseFloat(productionCT.data.production[1].wNow / 1000) : productionMicroSummaryWattsNow;

        //save and read power max and state
        let productionPowerMax = productionPower;
        const savedProductionPowerMax = await fsPromises.readFile(this.productionPowerMaxFile);
        this.log.debug('Device: %s %s, savedProductionPowerMax: %s kW', this.host, this.name, savedProductionPowerMax);
        if (savedProductionPowerMax > productionPower) {
          productionPowerMax = parseFloat(savedProductionPowerMax);
          this.log.debug('Device: %s %s, productionPowerMax: %s kW', this.host, this.name, productionPowerMax);
        }

        if (productionPower > productionPowerMax) {
          const write = await fsPromises.writeFile(this.productionPowerMaxFile, productionPower.toString());
          this.log.debug('Device: %s %s, productionPowerMaxFile saved successful in: %s %s kW', this.host, this.name, this.productionPowerMaxFile, productionPower);

        }
        const productionPowerMaxDetectedState = (productionPower >= (this.productionPowerMaxDetected / 1000));

        //energy
        const productionEnergyLifeTime = this.metersProduction ? parseFloat((productionCT.data.production[1].whLifetime + this.productionEnergyLifetimeOffset) / 1000) : productionMicroSummarywhLifeTime;
        const productionEnergyVarhLeadLifetime = this.metersProduction ? parseFloat(productionCT.data.production[1].varhLeadLifetime / 1000) : 0;
        const productionEnergyVarhLagLifetime = this.metersProduction ? parseFloat(productionCT.data.production[1].varhLagLifetime / 1000) : 0;
        const productionEnergyLastSevenDays = this.metersProduction ? parseFloat(productionCT.data.production[1].whLastSevenDays / 1000) : productionMicroSummarywhLastSevenDays;
        const productionEnergyToday = this.metersProduction ? parseFloat(productionCT.data.production[1].whToday / 1000) : productionMicroSummarywhToday;
        const productionEnergyVahToday = this.metersProduction ? parseFloat(productionCT.data.production[1].vahToday / 1000) : 0;
        const productionEnergyVarhLeadToday = this.metersProduction ? parseFloat(productionCT.data.production[1].varhLeadToday / 1000) : 0;
        const productionEnergyVarhLagToday = this.metersProduction ? parseFloat(productionCT.data.production[1].varhLagToday / 1000) : 0;

        //param
        if (this.metersProduction && this.metersProductionActiveCount > 0) {
          const productionRmsCurrent = parseFloat(productionCT.data.production[1].rmsCurrent);
          const productionRmsVoltage = parseFloat((productionCT.data.production[1].rmsVoltage) / 3);
          const productionReactivePower = parseFloat((productionCT.data.production[1].reactPwr) / 1000);
          const productionApparentPower = parseFloat((productionCT.data.production[1].apprntPwr) / 1000);
          const productionPwrFactor = parseFloat(productionCT.data.production[1].pwrFactor);
          if (this.enphaseServiceProduction) {
            this.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseRmsCurrent, productionRmsCurrent);
            this.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseRmsVoltage, productionRmsVoltage);
            this.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseReactivePower, productionReactivePower);
            this.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseApparentPower, productionApparentPower);
            this.enphaseServiceProduction.updateCharacteristic(Characteristic.enphasePwrFactor, productionPwrFactor);
          }
          this.productionRmsCurrent = productionRmsCurrent;
          this.productionRmsVoltage = productionRmsVoltage;
          this.productionReactivePower = productionReactivePower;
          this.productionApparentPower = productionApparentPower;
          this.productionPwrFactor = productionPwrFactor;
        }

        if (this.enphaseServiceProduction) {
          this.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseReadingTime, productionReadingTime);
          this.enphaseServiceProduction.updateCharacteristic(Characteristic.enphasePower, productionPower);
          this.enphaseServiceProduction.updateCharacteristic(Characteristic.enphasePowerMax, productionPowerMax);
          this.enphaseServiceProduction.updateCharacteristic(Characteristic.enphasePowerMaxDetected, productionPowerMaxDetectedState);
          this.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseEnergyToday, productionEnergyToday);
          this.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, productionEnergyLastSevenDays);
          this.enphaseServiceProduction.updateCharacteristic(Characteristic.enphaseEnergyLifeTime, productionEnergyLifeTime);
        }

        this.productionReadingTime = productionReadingTime;
        this.productionPower = productionPower;
        this.productionPowerMax = productionPowerMax;
        this.productionPowerMaxDetectedState = productionPowerMaxDetectedState;
        this.productionEnergyToday = productionEnergyToday;
        this.productionEnergyLastSevenDays = productionEnergyLastSevenDays;
        this.productionEnergyLifeTime = productionEnergyLifeTime;

        //consumption total
        if (this.metersConsumption && this.metersConsumtionTotalActiveCount > 0) {
          const consumptionTotalType = productionCT.data.consumption[0].type;
          const consumptionTotalActiveCount = productionCT.data.consumption[0].activeCount;
          const consumptionTotalMeasurmentType = productionCT.data.consumption[0].measurementType;
          const consumptionTotalReadingTime = new Date(productionCT.data.consumption[0].readingTime * 1000).toLocaleString();
          const consumptionTotalPower = parseFloat(productionCT.data.consumption[0].wNow / 1000);

          //save and read power max and state
          let consumptionTotalPowerMax = consumptionTotalPower;
          const savedConsumptionTotalPowerMax = await fsPromises.readFile(this.consumptionTotalPowerMaxFile);
          this.log.debug('Device: %s %s, savedConsumptionTotalPowerMax: %s kW', this.host, this.name, savedConsumptionTotalPowerMax);
          if (savedConsumptionTotalPowerMax > consumptionTotalPower) {
            consumptionTotalPowerMax = parseFloat(savedConsumptionTotalPowerMax);
          }

          if (consumptionTotalPower > consumptionTotalPowerMax) {
            const write1 = await fsPromises.writeFile(this.consumptionTotalPowerMaxFile, consumptionTotalPower.toString());
            this.log.debug('Device: %s %s, consumptionTotalPowerMaxFile saved successful in: %s %s kW', this.host, this.name, this.consumptionTotalPowerMaxFile, consumptionTotalPower);
          }
          const consumptionTotalPowerMaxDetectedState = (consumptionTotalPower >= (this.consumptionTotalPowerMaxDetected / 1000));

          //energy
          const consumptionTotalEnergyLifeTime = parseFloat((productionCT.data.consumption[0].whLifetime + this.consumptionTotalEnergyLifetimeOffset) / 1000);
          const consumptionTotalEnergyVarhLeadLifetime = parseFloat(productionCT.data.consumption[0].varhLeadLifetime / 1000);
          const consumptionTotalEnergyVarhLagLifetime = parseFloat(productionCT.data.consumption[0].varhLagLifetime / 1000);
          const consumptionTotalEnergyLastSevenDays = parseFloat(productionCT.data.consumption[0].whLastSevenDays / 1000);
          const consumptionTotalEnergyToday = parseFloat(productionCT.data.consumption[0].whToday / 1000);
          const consumptionTotalEnergyVahToday = parseFloat(productionCT.data.consumption[0].vahToday / 1000);
          const consumptionTotalEnergyVarhLeadToday = parseFloat(productionCT.data.consumption[0].varhLeadToday / 1000);
          const consumptionTotalEnergyVarhLagToday = parseFloat(productionCT.data.consumption[0].varhLagToday / 1000);

          //param
          const consumptionTotalRmsCurrent = parseFloat(productionCT.data.consumption[0].rmsCurrent);
          const consumptionTotalRmsVoltage = parseFloat((productionCT.data.consumption[0].rmsVoltage) / 3);
          const consumptionTotalReactivePower = parseFloat((productionCT.data.consumption[0].reactPwr) / 1000);
          const consumptionTotalApparentPower = parseFloat((productionCT.data.consumption[0].apprntPwr) / 1000);
          const consumptionTotalPwrFactor = parseFloat(productionCT.data.consumption[0].pwrFactor);

          if (this.enphaseServiceConsumptionTotal) {
            this.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseReadingTime, consumptionTotalReadingTime);
            this.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphasePower, consumptionTotalPower);
            this.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphasePowerMax, consumptionTotalPowerMax);
            this.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphasePowerMaxDetected, consumptionTotalPowerMaxDetectedState);
            this.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseEnergyToday, consumptionTotalEnergyToday);
            this.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, consumptionTotalEnergyLastSevenDays);
            this.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseEnergyLifeTime, consumptionTotalEnergyLifeTime);
            this.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseRmsCurrent, consumptionTotalRmsCurrent);
            this.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseRmsVoltage, consumptionTotalRmsVoltage);
            this.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseReactivePower, consumptionTotalReactivePower);
            this.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphaseApparentPower, consumptionTotalApparentPower);
            this.enphaseServiceConsumptionTotal.updateCharacteristic(Characteristic.enphasePwrFactor, consumptionTotalPwrFactor);
          }

          this.consumptionTotalReadingTime = consumptionTotalReadingTime;
          this.consumptionTotalPower = consumptionTotalPower;
          this.consumptionTotalPowerMax = consumptionTotalPowerMax;
          this.consumptionTotalPowerMaxDetectedState = consumptionTotalPowerMaxDetectedState;
          this.consumptionTotalEnergyToday = consumptionTotalEnergyToday;
          this.consumptionTotalEnergyLastSevenDays = consumptionTotalEnergyLastSevenDays;
          this.consumptionTotalEnergyLifeTime = consumptionTotalEnergyLifeTime;
          this.consumptionTotalRmsCurrent = consumptionTotalRmsCurrent;
          this.consumptionTotalRmsVoltage = consumptionTotalRmsVoltage;
          this.consumptionTotalReactivePower = consumptionTotalReactivePower;
          this.consumptionTotalApparentPower = consumptionTotalApparentPower;
          this.consumptionTotalPwrFactor = consumptionTotalPwrFactor;
        }

        //consumption net
        if (this.metersConsumption && this.metersConsumptionNetActiveCount > 0) {
          const consumptionNetType = productionCT.data.consumption[1].type;
          const consumptionNetActiveCount = productionCT.data.consumption[1].activeCount;
          const consumptionNetMeasurmentType = productionCT.data.consumption[1].measurementType;
          const consumptionNetReadingTime = new Date(productionCT.data.consumption[1].readingTime * 1000).toLocaleString();
          const consumptionNetPower = parseFloat(productionCT.data.consumption[1].wNow / 1000);

          //save and read power max and state
          let consumptionNetPowerMax = consumptionNetPower;
          const savedConsumptionNetPowerMax = await fsPromises.readFile(this.consumptionNetPowerMaxFile);
          this.log.debug('Device: %s %s, savedConsumptionNetPowerMax: %s kW', this.host, this.name, savedConsumptionNetPowerMax);
          if (savedConsumptionNetPowerMax > consumptionNetPower) {
            consumptionNetPowerMax = parseFloat(savedConsumptionNetPowerMax);
          }

          if (consumptionNetPower > consumptionNetPowerMax) {
            const write2 = await fsPromises.writeFile(this.consumptionNetPowerMaxFile, consumptionNetPower.toString());
            this.log.debug('Device: %s %s, consumptionNetPowerMaxFile saved successful in: %s %s kW', this.host, this.name, this.consumptionNetPowerMaxFile, consumptionNetPower);
          }
          const consumptionNetPowerMaxDetectedState = (consumptionNetPower >= (this.consumptionNetPowerMaxDetected / 1000));

          //energy
          const consumptionNetEnergyLifeTime = parseFloat((productionCT.data.consumption[1].whLifetime + this.consumptionNetEnergyLifetimeOffset) / 1000);
          const consumptionNetEnergyVarhLeadLifetime = parseFloat(productionCT.data.consumption[1].varhLeadLifetime / 1000);
          const consumptionNetEnergyVarhLagLifetime = parseFloat(productionCT.data.consumption[1].varhLagLifetime / 1000);
          const consumptionNetEnergyLastSevenDays = parseFloat(productionCT.data.consumption[1].whLastSevenDays / 1000);
          const consumptionNetEnergyToday = parseFloat(productionCT.data.consumption[1].whToday / 1000);
          const consumptionNetEnergyVahToday = parseFloat(productionCT.data.consumption[1].vahToday / 1000);
          const consumptionNetEnergyVarhLeadToday = parseFloat(productionCT.data.consumption[1].varhLeadToday / 1000);
          const consumptionNetEnergyVarhLagToday = parseFloat(productionCT.data.consumption[1].varhLagToday / 1000);

          //param
          const consumptionNetRmsCurrent = parseFloat(productionCT.data.consumption[1].rmsCurrent);
          const consumptionNetRmsVoltage = parseFloat((productionCT.data.consumption[1].rmsVoltage) / 3);
          const consumptionNetReactivePower = parseFloat((productionCT.data.consumption[1].reactPwr) / 1000);
          const consumptionNetApparentPower = parseFloat((productionCT.data.consumption[1].apprntPwr) / 1000);
          const consumptionNetPwrFactor = parseFloat(productionCT.data.consumption[1].pwrFactor);

          if (this.enphaseServiceConsumptionNet) {
            this.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseReadingTime, consumptionNetReadingTime);
            this.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphasePower, consumptionNetPower);
            this.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphasePowerMax, consumptionNetPowerMax);
            this.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphasePowerMaxDetected, consumptionNetPowerMaxDetectedState);
            this.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseEnergyToday, consumptionNetEnergyToday);
            this.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, consumptionNetEnergyLastSevenDays);
            this.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseEnergyLifeTime, consumptionNetEnergyLifeTime);
            this.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseRmsCurrent, consumptionNetRmsCurrent);
            this.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseRmsVoltage, consumptionNetRmsVoltage);
            this.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseReactivePower, consumptionNetReactivePower);
            this.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphaseApparentPower, consumptionNetApparentPower);
            this.enphaseServiceConsumptionNet.updateCharacteristic(Characteristic.enphasePwrFactor, consumptionNetPwrFactor);
          }

          this.consumptionNetReadingTime = consumptionNetReadingTime;
          this.consumptionNetPower = consumptionNetPower;
          this.consumptionNetPowerMax = consumptionNetPowerMax;
          this.consumptionNetEnergyToday = consumptionNetEnergyToday;
          this.consumptionNetEnergyLastSevenDays = consumptionNetEnergyLastSevenDays;
          this.consumptionNetEnergyLifeTime = consumptionNetEnergyLifeTime;
          this.consumptionNetPowerMaxDetectedState = consumptionNetPowerMaxDetectedState;
          this.consumptionNetRmsCurrent = consumptionNetRmsCurrent;
          this.consumptionNetRmsVoltage = consumptionNetRmsVoltage;
          this.consumptionNetReactivePower = consumptionNetReactivePower;
          this.consumptionNetApparentPower = consumptionNetApparentPower;
          this.consumptionNetPwrFactor = consumptionNetPwrFactor;
        }
      }

      //encharge storage
      if (this.enchargesCount > 0) {
        if (inventory.status === 200 && inventory.data !== undefined) {

          this.enchargesSerialNumber = new Array();
          this.enchargesStatus = new Array();
          this.enchargesLastReportDate = new Array();
          this.enchargesFirmware = new Array();
          this.enchargesProducing = new Array();
          this.enchargesCommunicating = new Array();
          this.enchargesProvisioned = new Array();
          this.enchargesOperating = new Array();
          this.enchargesSleepEnabled = new Array();
          this.enchargesPerfentFull1 = new Array();
          this.enchargesMaxCellTemp = new Array();
          this.enchargesSleepMinSoc = new Array();
          this.enchargesSleepMaxSoc = new Array();
          this.enchargesChargeStatus = new Array();
        }

        if (this.checkCommLevel) {
          this.enchargesCommLevel = new Array();
        }

        for (let i = 0; i < this.enchargesCount; i++) {
          if (inventory.status === 200 && inventory.data !== undefined) {
            const type = inventory.data[1].type;
            const devicesLenth = inventory.data[1].devices.length;
            const partNum = inventory.data[1].devices[i].part_num;
            const installed = inventory.data[1].devices[i].installed;
            const serialNumber = inventory.data[1].devices[i].serial_num;
            let status = inventory.data[1].devices[i].device_status;
            const lastrptdate = new Date(inventory.data[1].devices[i].last_rpt_date * 1000).toLocaleString();
            const adminState = inventory.data[1].devices[i].admin_state;
            const devType = inventory.data[1].devices[i].dev_type;
            const createdDate = inventory.data[1].devices[i].created_date;
            const imageLoadDate = inventory.data[1].devices[i].img_load_date;
            const firmware = inventory.data[1].devices[i].img_pnum_running;
            const ptpn = inventory.data[1].devices[i].ptpn;
            const chaneId = inventory.data[1].devices[i].chaneid;
            const deviceControl = inventory.data[1].devices[i].device_control;
            const producing = inventory.data[1].devices[i].producing;
            const communicating = inventory.data[1].devices[i].communicating;
            const provisioned = inventory.data[1].devices[i].provisioned;
            const operating = inventory.data[1].devices[i].operating;
            const sleepEnabled = inventory.data[1].devices[i].sleep_enabled;
            const perfentFull = inventory.data[1].devices[i].percentFull;
            const maxCellTemp = inventory.data[1].devices[i].maxCellTemp;
            const sleepMinSoc = inventory.data[1].devices[i].sleep_min_soc;
            const sleepMaxSoc = inventory.data[1].devices[i].sleep_max_soc;
            const chargeStatus = ENCHARGE_STATE_1[ENCHARGE_STATE.indexOf(inventory.data[1].devices[i].charge_status)];

            // convert status
            let statusLength = status.length;
            let arrStatus = new Array();
            if (Array.isArray(status) && statusLength > 0) {
              for (let j = 0; j < statusLength; j++) {
                arrStatus.push(ENVOY_STATUS_CODE_1[ENVOY_STATUS_CODE.indexOf(status[j])]);
              }
              status = arrStatus.join(', ')
            } else {
              status = 'Not available';
            }

            if (this.enphaseServiceEncharge) {
              this.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeStatus, status);
              this.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeLastReportDate, lastrptdate);
              this.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeFirmware, firmware);
              this.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeProducing, producing);
              this.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeCommunicating, communicating);
              this.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeProvisioned, provisioned);
              this.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeOperating, operating);
              this.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeSleepEnabled, sleepEnabled);
              this.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargePerfentFull, perfentFull);
              this.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeMaxCellTemp, maxCellTemp);
              this.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeSleepMinSoc, sleepMinSoc);
              this.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeSleepMaxSoc, sleepMaxSoc);
              this.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeChargeStatus, chargeStatus);
            }

            this.enchargesSerialNumber.push(serialNumber);
            this.enchargesStatus.push(status);
            this.enchargesLastReportDate.push(lastrptdate);
            this.enchargesFirmware.push(firmware);
            this.enchargesProducing.push(producing);
            this.enchargesCommunicating.push(communicating);
            this.enchargesProvisioned.push(provisioned);
            this.enchargesOperating.push(operating);
            this.enchargesSleepEnabled.push(sleepEnabled);
            this.enchargesPerfentFull1.push(perfentFull);
            this.enchargesMaxCellTemp.push(maxCellTemp);
            this.enchargesSleepMinSoc.push(sleepMinSoc);
            this.enchargesSleepMaxSoc.push(sleepMaxSoc);
            this.enchargesChargeStatus.push(chargeStatus);
          }

          //encharges comm level
          if (this.checkCommLevel) {
            const key = '' + this.enchargesSerialNumber[i] + '';
            let commLevel = 0;
            if (this.pcuCommCheck.data[key] !== undefined) {
              commLevel = this.pcuCommCheck.data[key];
            }

            if (this.enphaseServiceEncharge && this.enchargesCommunicating[i]) {
              this.enphaseServiceEncharge.updateCharacteristic(Characteristic.enphaseEnchargeCommLevel, commLevel);
            }
            this.enchargesCommLevel.push(commLevel);
          }


          //encharges summary
          if (productionCT.status === 200 && productionCT.data !== undefined) {
            const type = productionCT.data.storage[0].type;
            const activeCount = productionCT.data.storage[0].activeCount;
            const readingTime = new Date(productionCT.data.storage[0].readingTime * 1000).toLocaleString();
            const wNow = parseFloat((productionCT.data.storage[0].wNow) / 1000);
            const whNow = parseFloat((productionCT.data.storage[0].whNow + this.enchargeStorageOffset) / 1000);
            const chargeStatus = ENCHARGE_STATE_1[ENCHARGE_STATE.indexOf(productionCT.data.storage[0].state)];
            const percentFull = productionCT.data.storage[0].percentFull;

            if (this.enphaseServiceEnchargePowerAndEnergy) {
              this.enphaseServiceEnchargePowerAndEnergy.updateCharacteristic(Characteristic.enphaseEnchargeReadingTime, readingTime);
              this.enphaseServiceEnchargePowerAndEnergy.updateCharacteristic(Characteristic.enphaseEnchargePower, wNow);
              this.enphaseServiceEnchargePowerAndEnergy.updateCharacteristic(Characteristic.enphaseEnchargeEnergy, whNow);
              this.enphaseServiceEnchargePowerAndEnergy.updateCharacteristic(Characteristic.enphaseEnchargePercentFull, percentFull);
              this.enphaseServiceEnchargePowerAndEnergy.updateCharacteristic(Characteristic.enphaseEnchargeActiveCount, activeCount);
              this.enphaseServiceEnchargePowerAndEnergy.updateCharacteristic(Characteristic.enphaseEnchargeState, chargeStatus);
            }

            this.enchargesType = type;
            this.enchargesActiveCount = activeCount;
            this.enchargesReadingTime = lastrptdate;
            this.enchargesPower = wNow;
            this.enchargesEnergy = whNow;
            this.enchargesState = chargeStatus;
            this.enchargesPercentFull = percentFull;
          }
        }
      }

      //microinverters power
      if (this.microinvertersCount > 0) {
        if (inventory.status === 200 && inventory.data !== undefined) {
          this.microinvertersSerialNumberActive = new Array();
          this.microinvertersLastReportDate = new Array();
          this.microinvertersFirmware = new Array();
          this.microinvertersProducing = new Array();
          this.microinvertersCommunicating = new Array();
          this.microinvertersProvisioned = new Array();
          this.microinvertersOperating = new Array();
          this.microinvertersStatus = new Array();
        }

        if (this.checkMicroinvertersPower) {
          this.allMicroinvertersSerialNumber = new Array();
          this.microinvertersReadingTimePower = new Array();
          this.microinvertersType = new Array();
          this.microinvertersLastPower = new Array();
          this.microinvertersMaxPower = new Array();
        }

        if (this.checkCommLevel) {
          this.microinvertersCommLevel = new Array();
        }

        //microinverters state
        for (let i = 0; i < this.microinvertersCount; i++) {
          if (inventory.status === 200 && inventory.data !== undefined) {
            const type = inventory.data[0].type;
            const devicesLenth = inventory.data[0].devices.length;
            const partNum = inventory.data[0].devices[i].part_num;
            const installed = inventory.data[0].devices[i].installed;
            const serialNumber = inventory.data[0].devices[i].serial_num;
            let status = inventory.data[0].devices[i].device_status;
            const lastrptdate = new Date(inventory.data[0].devices[i].last_rpt_date * 1000).toLocaleString();
            const adminState = inventory.data[0].devices[i].admin_state;
            const devType = inventory.data[0].devices[i].dev_type;
            const createdDate = inventory.data[0].devices[i].created_date;
            const imageLoadDate = inventory.data[0].devices[i].img_load_date;
            const firmware = inventory.data[0].devices[i].img_pnum_running;
            const ptpn = inventory.data[0].devices[i].ptpn;
            const chaneId = inventory.data[0].devices[i].chaneid;
            const deviceControl = inventory.data[0].devices[i].device_control;
            const producing = inventory.data[0].devices[i].producing;
            const communicating = inventory.data[0].devices[i].communicating;
            const provisioned = inventory.data[0].devices[i].provisioned;
            const operating = inventory.data[0].devices[i].operating;

            // convert status
            let statusLength = status.length;
            let arrStatus = new Array();
            if (Array.isArray(status) && statusLength > 0) {
              for (let j = 0; j < statusLength; j++) {
                arrStatus.push(ENVOY_STATUS_CODE_1[ENVOY_STATUS_CODE.indexOf(status[j])]);
              }
              status = arrStatus.join(', ')
            } else {
              status = 'Not available';
            }

            if (this.enphaseServiceMicronverter) {
              this.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterLastReportDate, lastrptdate);
              this.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterFirmware, firmware);
              this.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterProducing, producing);
              this.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterCommunicating, communicating);
              this.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterProvisioned, provisioned);
              this.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterOperating, operating);
              this.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterStatus, status);

            }

            this.microinvertersSerialNumberActive.push(serialNumber);
            this.microinvertersLastReportDate.push(lastrptdate);
            this.microinvertersFirmware.push(firmware);
            this.microinvertersProducing.push(producing);
            this.microinvertersCommunicating.push(communicating);
            this.microinvertersProvisioned.push(provisioned);
            this.microinvertersOperating.push(operating);
            this.microinvertersStatus.push(status);
          }

          //microinverters power
          if (this.checkMicroinvertersPower) {
            for (let j = 0; j < this.microinverters.data.length; j++) {
              let serialNumber = this.microinverters.data[j].serialNumber;
              this.allMicroinvertersSerialNumber.push(serialNumber);
            }
            const index = this.allMicroinvertersSerialNumber.indexOf(this.microinvertersSerialNumberActive[i]);
            let lastrptdate = 'Reading data failed';
            if (this.microinverters.data[index].lastReportDate !== undefined) {
              lastrptdate = new Date(this.microinverters.data[index].lastReportDate * 1000).toLocaleString();
            }
            let type = 0;
            if (this.microinverters.data[index].devType !== undefined) {
              type = this.microinverters.data[index].devType;
            }
            let power = 0;
            if (this.microinverters.data[index].lastReportWatts !== undefined) {
              power = parseInt(this.microinverters.data[index].lastReportWatts);
            }
            let powerMax = 0;
            if (this.microinverters.data[index].maxReportWatts !== undefined) {
              powerMax = parseInt(this.microinverters.data[index].maxReportWatts);
            }

            if (this.enphaseServiceMicronverter && this.microinvertersCommunicating[i]) {
              this.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterLastReportDate, lastrptdate);
              //this.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterType, type);
              this.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterPower, power);
              this.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterPowerMax, powerMax);
            }

            this.microinvertersReadingTimePower.push(lastrptdate);
            this.microinvertersType.push(type);
            this.microinvertersLastPower.push(power);
            this.microinvertersMaxPower.push(powerMax);
          }

          //microinverters comm level
          if (this.checkCommLevel) {
            const key = '' + this.microinvertersSerialNumberActive[i] + '';
            let commLevel = 0;
            if (this.pcuCommCheck.data[key] !== undefined) {
              commLevel = this.pcuCommCheck.data[key];
            }

            if (this.enphaseServiceMicronverter && this.microinvertersCommunicating[i]) {
              this.enphaseServiceMicronverter.updateCharacteristic(Characteristic.enphaseMicroinverterCommLevel, commLevel);
            }
            this.microinvertersCommLevel.push(commLevel);
          }
        }
      }
      this.checkDeviceState = true;

      //start prepare accessory
      if (this.startPrepareAccessory) {
        this.prepareAccessory();
      }
    } catch (error) {
      this.log.error('Device: %s %s, update Device state error: %s', this.host, this.name, error);
      this.checkDeviceState = false;
      this.checkDeviceInfo = true;
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
        if (this.checkCommLevel) {
          this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayCommLevel)
            .onGet(async () => {
              let value = this.qRelaysCommLevel[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, qrelay: %s comm. level: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
              }
              return value;
            });
        }
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
    this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
      .onGet(async () => {
        let value = this.productionEnergyLifeTime;
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
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
          .onGet(async () => {
            let value = this.consumptionTotalEnergyLifeTime;
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
        this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
          .onGet(async () => {
            let value = this.consumptionNetEnergyLifeTime;
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
        if (this.checkCommLevel) {
          this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseQrelayCommLevel)
            .onGet(async () => {
              let value = this.enchargesCommLevel[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s comm. level: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
              }
              return value;
            });
        }
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
        if (this.checkCommLevel) {
          this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterCommLevel)
            .onGet(async () => {
              let value = this.microinvertersCommLevel[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, microinverter: %s comm. level: %s', this.host, accessoryName, this.microinvertersSerialNumberActive[i], value);
              }
              return value;
            });
        }
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
