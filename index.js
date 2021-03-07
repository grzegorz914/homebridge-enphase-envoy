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

const ENPHASE_PART_NUMBER = {
  '800-00555-r03': 'X-IQ-AM1-240-3', '880-00122-r02': 'ENV-S-AB-120-A', '880-00210-r02': 'ENV-S-AM1-120', '880-00208-r02': 'ENV-IQ-AM1-240', '880-00231-r02': 'ENV-IQ-AM1-240', '880-00557-r02': 'ENV-IQ-AM3-3P', '800-00553-r02': 'ENV-S-WB-230', '800-00554-r03': 'ENV-S-WM-230', '880-00208-r03': 'ENV-IQ-AM1-240', '880-00209-r03': 'ENV-IQ-AM3-3P',
  '800-00597-r02': 'Q-RELAY-3P-INT', '860-00152-r02': 'Q-RELAY-1P-INT', '800-00633-r02': 'IQ7A-72-2-INT', '800-00632-r02': 'IQ7X-96-2-INT', '800-00631-r02': 'IQ7PLUS-72-2-INT',
  '800-00630-r02': 'IQ7-60-2-INT', '800-00634-r02': 'IQ7A-72-2-US', '800-00635-r02': 'IQ7X-96-2-US', '800-00636-r02': 'IQ7PLUS-72-2-US', '800-00637-r02': 'IQ7-60-2-US',
  '121943068536EIM1': 'CT-100-SPLIT-P', '121943068536EIM2': 'CT-100-SPLIT-C'
};

const ENVOY_USER = 'envoy';
const INSTALLER_USER = 'installer';
const ENVOY_API_URL = {
  'AcbSetSleepMode': '/admin/lib/acb_config.json',
  'AcbGetSleepModeData': '/admin/lib/acb_config.json',
  'AcbCancelSleepMode': '/admin/lib/acb_config.json',
  'AgfProfileIndex': '/installer/agf/index.json?simplified=true',
  'AgfProfileDetails': '/installer/agf/details.json',
  'AgfProfileInverterStatus': '/installer/agf/inverters_status.json',
  'AgfProfileSetProfile': '/installer/agf/set_profile.json',
  'CellularConfig': '/admin/lib/network_display.json?cellular=1',
  'ClearGFIPost': '/admin/lib/admin_dcc_display.json',
  'DhcpGetNewIp': '/admin/lib/network_display.json',
  'DiagnosticNetworkCheck': '/admin/lib/network_display.json',
  'EthernetConfigGet': '/admin/lib/network_display.json',
  'EthernetConfigPut': '/admin/lib/network_display.json',
  'EventsGet': '/datatab/event_dt.rb',
  'GetInfo': '/info.xml',
  'GetTimezones': '/admin/lib/date_time_display.json?tzlist=1',
  'Home': '/home.json',
  'InternalMeterInfo': '/ivp/meters',
  'InternalMeterStream': '/stream/meter',
  'InternalMeterReadings': '/ivp/meters/readings',
  'InternalMeterCurrentCTSettings': '/ivp/meters/cts',
  'Inventory': '/inventory.json',
  'InventoryAll': '/inventory.json?deleted=1',
  'InverterComm': '/installer/pcu_comm_check',
  'InverterProduction': '/api/v1/production/inverters',
  'InverterProductionSumm': '/api/v1/production',
  'InverterDelete': '/prov',
  'InverterPut': '/prov',
  'NewScanGet': '/ivp/peb/newscan',
  'NewScanPD': '/ivp/peb/newscan',
  'PowerForcedModeGet': '/ivp/mod/EID/mode/power',
  'PowerForcedModePut': '/ivp/mod/EID/mode/power',
  'PMUGet': '/admin/lib/admin_pmu_display.json',
  'PMUPost': '/admin/lib/admin_pmu_display.json',
  'RedeterminePhase': '/ivp/grest/local/gs/redeterminephase',
  'ReportSettingsGet': '/ivp/peb/reportsettings',
  'ReportSettingsPut': '/ivp/peb/reportsettings',
  'SetTimezone': '/admin/lib/date_time_display.json',
  'SystemReadingStats': '/production.json?details=1',
  'TariffSettingsGet': '/admin/lib/tariff.json',
  'TariffSettingsPut': '/admin/lib/tariff.json',
  'TunnelStateGet': '/admin/lib/dba.json',
  'TunnelStatePut': '/admin/lib/dba.json',
  'UpdateMeterConfig': '/ivp/meters/EID',
  'UpdateMeterCurrentCTConfig': '/ivp/meters/cts/EID',
  'UpdatePassword': '/admin/lib/security_display.json',
  'WifiSettings': '/admin/lib/wireless_display.json',
  'WifiSettingsJoin': '/admin/lib/wireless_display.json'
}

const ENVOY_STATUS_CODE = {
  //encharge
  'idle': 'Idle', 'discharging': 'Discharging', 'charging': 'Charging',
  //qrelay
  'enabled': 'Enabled', 'disabled': 'Disabled', 'one': 'One', 'two': 'Two', 'three': 'Three', 'normal': 'Normal', 'closed': 'Closed', 'open': 'Open', 'error.nodata': 'No Data',
  //envoy
  'ethernet': 'Ethernet', 'eth0': 'Ethernet', 'wifi': 'WiFi', 'wlan0': 'WiFi', 'cellurar': 'Cellurar', 'connected': 'Connected', 'disconnected': 'Disconnected',
  'single_rate': 'Single rate', 'time_to_use': 'Time to use', 'time_of_use': 'Time of use', 'tiered': 'Tiered', 'not_set': 'Not set', 'flat': 'Flat', 'none': 'None',
  'satisfied': 'Satisfied', 'not-satisfied': 'Not satisfied',
  'envoy.global.ok': 'Normal',
  'envoy.cond_flags.acb_ctrl.bmuhardwareerror': 'BMU Hardware Error',
  'envoy.cond_flags.acb_ctrl.bmuimageerror': 'BMU Image Error',
  'envoy.cond_flags.acb_ctrl.bmumaxcurrentwarning': 'BMU Max Current Warning',
  'envoy.cond_flags.acb_ctrl.bmusenseerror': 'BMU Sense Error',
  'envoy.cond_flags.acb_ctrl.cellmaxtemperror': 'Cell Max Temperature Error',
  'envoy.cond_flags.acb_ctrl.cellmaxtempwarning': 'Cell Max Temperature Warning',
  'envoy.cond_flags.acb_ctrl.cellmaxvoltageerror': 'Cell Max Voltage Error',
  'envoy.cond_flags.acb_ctrl.cellmaxvoltagewarning': 'Cell Max Voltage Warning',
  'envoy.cond_flags.acb_ctrl.cellmintemperror': 'Cell Min Temperature Error',
  'envoy.cond_flags.acb_ctrl.cellmintempwarning': 'Cell Min Temperature Warning',
  'envoy.cond_flags.acb_ctrl.cellminvoltageerror': 'Cell Min Voltage Error',
  'envoy.cond_flags.acb_ctrl.cellminvoltagewarning': 'Cell Min Voltage Warning',
  'envoy.cond_flags.acb_ctrl.cibcanerror': 'CIB CAN Error',
  'envoy.cond_flags.acb_ctrl.cibimageerror': 'CIB Image Error',
  'envoy.cond_flags.acb_ctrl.cibspierror': 'CIB SPI Error',
  'envoy.cond_flags.obs_strs.discovering': 'Discovering',
  'envoy.cond_flags.obs_strs.failure': 'Failure to report',
  'envoy.cond_flags.obs_strs.flasherror': 'Flash Error',
  'envoy.cond_flags.obs_strs.notmonitored': 'Not Monitored',
  'envoy.cond_flags.obs_strs.ok': 'Normal',
  'envoy.cond_flags.obs_strs.plmerror': 'PLM Error',
  'envoy.cond_flags.obs_strs.secmodeenterfailure': 'Secure mode enter failure',
  'envoy.cond_flags.obs_strs.secmodeexitfailure': 'Secure mode exit failure',
  'envoy.cond_flags.obs_strs.sleeping': 'Sleeping',
  'envoy.cond_flags.pcu_chan.acMonitorError': 'AC Monitor Error',
  'envoy.cond_flags.pcu_chan.acfrequencyhigh': 'AC Frequency High',
  'envoy.cond_flags.pcu_chan.acfrequencylow': 'AC Frequency Low',
  'envoy.cond_flags.pcu_chan.acfrequencyoor': 'AC Frequency Out Of Range',
  'envoy.cond_flags.pcu_chan.acvoltage_avg_hi': 'AC Voltage Average High',
  'envoy.cond_flags.pcu_chan.acvoltagehigh': 'AC Voltage High',
  'envoy.cond_flags.pcu_chan.acvoltagelow': 'AC Voltage Low',
  'envoy.cond_flags.pcu_chan.acvoltageoor': 'AC Voltage Out Of Range',
  'envoy.cond_flags.pcu_chan.acvoltageoosp1': 'AC Voltage Out Of Range - Phase 1',
  'envoy.cond_flags.pcu_chan.acvoltageoosp2': 'AC Voltage Out Of Range - Phase 2',
  'envoy.cond_flags.pcu_chan.acvoltageoosp3': 'AC Voltage Out Of Range - Phase 3',
  'envoy.cond_flags.pcu_chan.agfpowerlimiting': 'AGF Power Limiting',
  'envoy.cond_flags.pcu_chan.dcresistancelow': 'DC Resistance Low',
  'envoy.cond_flags.pcu_chan.dcresistancelowpoweroff': 'DC Resistance Low - Power Off',
  'envoy.cond_flags.pcu_chan.dcvoltagetoohigh': 'DC Voltage Too High',
  'envoy.cond_flags.pcu_chan.dcvoltagetoolow': 'DC Voltage Too Low',
  'envoy.cond_flags.pcu_chan.dfdt': 'AC Frequency Changing too Fast',
  'envoy.cond_flags.pcu_chan.gfitripped': 'GFI Tripped',
  'envoy.cond_flags.pcu_chan.gridgone': 'Grid Gone',
  'envoy.cond_flags.pcu_chan.gridinstability': 'Grid Instability',
  'envoy.cond_flags.pcu_chan.gridoffsethi': 'Grid Offset Hi',
  'envoy.cond_flags.pcu_chan.gridoffsetlow': 'Grid Offset Low',
  'envoy.cond_flags.pcu_chan.hardwareError': 'Hardware Error',
  'envoy.cond_flags.pcu_chan.hardwareWarning': 'Hardware Warning',
  'envoy.cond_flags.pcu_chan.highskiprate': 'High Skip Rate',
  'envoy.cond_flags.pcu_chan.invalidinterval': 'Invalid Interval',
  'envoy.cond_flags.pcu_chan.pwrgenoffbycmd': 'Power generation off by command',
  'envoy.cond_flags.pcu_chan.skippedcycles': 'Skipped Cycles',
  'envoy.cond_flags.pcu_chan.vreferror': 'Voltage Ref Error',
  'envoy.cond_flags.pcu_ctrl.alertactive': 'Alert Active',
  'envoy.cond_flags.pcu_ctrl.altpwrgenmode': 'Alternate Power Generation Mode',
  'envoy.cond_flags.pcu_ctrl.altvfsettings': 'Alternate Voltage and Frequency Settings',
  'envoy.cond_flags.pcu_ctrl.badflashimage': 'Bad Flash Image',
  'envoy.cond_flags.pcu_ctrl.bricked': 'No Grid Profile',
  'envoy.cond_flags.pcu_ctrl.commandedreset': 'Commanded Reset',
  'envoy.cond_flags.pcu_ctrl.criticaltemperature': 'Critical Temperature',
  'envoy.cond_flags.pcu_ctrl.dc-pwr-low': 'DC Power Too Low',
  'envoy.cond_flags.pcu_ctrl.iuplinkproblem': 'IUP Link Problem',
  'envoy.cond_flags.pcu_ctrl.manutestmode': 'In Manu Test Mode',
  'envoy.cond_flags.pcu_ctrl.nsync': 'Grid Perturbation Unsynchronized',
  'envoy.cond_flags.pcu_ctrl.overtemperature': 'Over Temperature',
  'envoy.cond_flags.pcu_ctrl.poweronreset': 'Power On Reset',
  'envoy.cond_flags.pcu_ctrl.pwrgenoffbycmd': 'Power generation off by command',
  'envoy.cond_flags.pcu_ctrl.runningonac': 'Running on AC',
  'envoy.cond_flags.pcu_ctrl.tpmtest': 'Transient Grid Profile',
  'envoy.cond_flags.pcu_ctrl.unexpectedreset': 'Unexpected Reset',
  'envoy.cond_flags.pcu_ctrl.watchdogreset': 'Watchdog Reset',
  'envoy.cond_flags.rgm_chan.check_meter': 'Meter Error',
  'envoy.cond_flags.rgm_chan.power_quality': 'Poor Power Quality'
};

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
  Characteristic.enphaseEnvoyAllerts.UUID = '00000001-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyPrimaryInterface = function () {
    Characteristic.call(this, 'Network interface', Characteristic.enphaseEnvoyPrimaryInterface.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyPrimaryInterface, Characteristic);
  Characteristic.enphaseEnvoyPrimaryInterface.UUID = '00000010-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyNetworkWebComm = function () {
    Characteristic.call(this, 'Web communication', Characteristic.enphaseEnvoyNetworkWebComm.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyNetworkWebComm, Characteristic);
  Characteristic.enphaseEnvoyNetworkWebComm.UUID = '00000011-000B-1000-8000-0026BB765291';


  Characteristic.enphaseEnvoyEverReportedToEnlighten = function () {
    Characteristic.call(this, 'Report to Enlighten', Characteristic.enphaseEnvoyEverReportedToEnlighten.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyEverReportedToEnlighten, Characteristic);
  Characteristic.enphaseEnvoyEverReportedToEnlighten.UUID = '00000012-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCommNumAndLevel = function () {
    Characteristic.call(this, 'Devices and level', Characteristic.enphaseEnvoyCommNumAndLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCommNumAndLevel, Characteristic);
  Characteristic.enphaseEnvoyCommNumAndLevel.UUID = '00000013-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCommNumNsrbAndLevel = function () {
    Characteristic.call(this, 'Q-Relays and level', Characteristic.enphaseEnvoyCommNumNsrbAndLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCommNumNsrbAndLevel, Characteristic);
  Characteristic.enphaseEnvoyCommNumNsrbAndLevel.UUID = '00000014-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCommNumAcbAndLevel = function () {
    Characteristic.call(this, 'Encharges and level', Characteristic.enphaseEnvoyCommNumAcbAndLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCommNumAcbAndLevel, Characteristic);
  Characteristic.enphaseEnvoyCommNumAcbAndLevel.UUID = '00000015-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCommNumPcuAndLevel = function () {
    Characteristic.call(this, 'Microinverters and level', Characteristic.enphaseEnvoyCommNumPcuAndLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCommNumPcuAndLevel, Characteristic);
  Characteristic.enphaseEnvoyCommNumPcuAndLevel.UUID = '00000016-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyDbSize = function () {
    Characteristic.call(this, 'DB size', Characteristic.enphaseEnvoyDbSize.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyDbSize, Characteristic);
  Characteristic.enphaseEnvoyDbSize.UUID = '00000017-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyTariff = function () {
    Characteristic.call(this, 'Tariff', Characteristic.enphaseEnvoyTariff.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyTariff, Characteristic);
  Characteristic.enphaseEnvoyTariff.UUID = '00000018-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyFirmware = function () {
    Characteristic.call(this, 'Firmware', Characteristic.enphaseEnvoyFirmware.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyFirmware, Characteristic);
  Characteristic.enphaseEnvoyFirmware.UUID = '00000019-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyUpdateStatus = function () {
    Characteristic.call(this, 'Update status', Characteristic.enphaseEnvoyUpdateStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyUpdateStatus, Characteristic);
  Characteristic.enphaseEnvoyUpdateStatus.UUID = '00000002-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyTimeZone = function () {
    Characteristic.call(this, 'Time Zone', Characteristic.enphaseEnvoyTimeZone.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyTimeZone, Characteristic);
  Characteristic.enphaseEnvoyTimeZone.UUID = '00000020-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCurrentDateTime = function () {
    Characteristic.call(this, 'Local time', Characteristic.enphaseEnvoyCurrentDateTime.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCurrentDateTime, Characteristic);
  Characteristic.enphaseEnvoyCurrentDateTime.UUID = '00000021-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyLastEnlightenReporDate = function () {
    Characteristic.call(this, 'Last report to Enlighten', Characteristic.enphaseEnvoyLastEnlightenReporDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyLastEnlightenReporDate, Characteristic);
  Characteristic.enphaseEnvoyLastEnlightenReporDate.UUID = '00000022-000B-1000-8000-0026BB765291';

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
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyFirmware);
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
  Characteristic.enphaseQrelayState.UUID = '00000003-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayLinesCount = function () {
    Characteristic.call(this, 'Lines', Characteristic.enphaseQrelayLinesCount.UUID);
    this.setProps({
      format: Characteristic.Formats.INT,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayLinesCount, Characteristic);
  Characteristic.enphaseQrelayLinesCount.UUID = '00000030-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayLine1Connected = function () {
    Characteristic.call(this, 'Line 1', Characteristic.enphaseQrelayLine1Connected.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayLine1Connected, Characteristic);
  Characteristic.enphaseQrelayLine1Connected.UUID = '00000031-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayLine2Connected = function () {
    Characteristic.call(this, 'Line 2', Characteristic.enphaseQrelayLine2Connected.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayLine2Connected, Characteristic);
  Characteristic.enphaseQrelayLine2Connected.UUID = '00000032-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayLine3Connected = function () {
    Characteristic.call(this, 'Line 3', Characteristic.enphaseQrelayLine3Connected.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayLine3Connected, Characteristic);
  Characteristic.enphaseQrelayLine3Connected.UUID = '00000033-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayProducing = function () {
    Characteristic.call(this, 'Producing', Characteristic.enphaseQrelayProducing.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayProducing, Characteristic);
  Characteristic.enphaseQrelayProducing.UUID = '00000034-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayCommunicating = function () {
    Characteristic.call(this, 'Communicating', Characteristic.enphaseQrelayCommunicating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayCommunicating, Characteristic);
  Characteristic.enphaseQrelayCommunicating.UUID = '00000035-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayProvisioned = function () {
    Characteristic.call(this, 'Provisioned', Characteristic.enphaseQrelayProvisioned.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayProvisioned, Characteristic);
  Characteristic.enphaseQrelayProvisioned.UUID = '00000036-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayOperating = function () {
    Characteristic.call(this, 'Operating', Characteristic.enphaseQrelayOperating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayOperating, Characteristic);
  Characteristic.enphaseQrelayOperating.UUID = '00000037-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayCommLevel = function () {
    Characteristic.call(this, 'Comm level', Characteristic.enphaseQrelayCommLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      unit: '%',
      maxValue: 100,
      minValue: 0,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayCommLevel, Characteristic);
  Characteristic.enphaseQrelayCommLevel.UUID = '00000038-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayStatus = function () {
    Characteristic.call(this, 'Status', Characteristic.enphaseQrelayStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayStatus, Characteristic);
  Characteristic.enphaseQrelayStatus.UUID = '00000039-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayFirmware = function () {
    Characteristic.call(this, 'Firmware', Characteristic.enphaseQrelayFirmware.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayFirmware, Characteristic);
  Characteristic.enphaseQrelayFirmware.UUID = '00000004-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayLastReportDate = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseQrelayLastReportDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayLastReportDate, Characteristic);
  Characteristic.enphaseQrelayLastReportDate.UUID = '00000041-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseMeterState.UUID = '00000005-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterMeasurementType = function () {
    Characteristic.call(this, 'Meter type', Characteristic.enphaseMeterMeasurementType.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterMeasurementType, Characteristic);
  Characteristic.enphaseMeterMeasurementType.UUID = '00000050-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterPhaseCount = function () {
    Characteristic.call(this, 'Phase count', Characteristic.enphaseMeterPhaseCount.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterPhaseCount, Characteristic);
  Characteristic.enphaseMeterPhaseCount.UUID = '00000051-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterPhaseMode = function () {
    Characteristic.call(this, 'Phase mode', Characteristic.enphaseMeterPhaseMode.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterPhaseMode, Characteristic);
  Characteristic.enphaseMeterPhaseMode.UUID = '00000052-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterMeteringStatus = function () {
    Characteristic.call(this, 'Metering status', Characteristic.enphaseMeterMeteringStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterMeteringStatus, Characteristic);
  Characteristic.enphaseMeterMeteringStatus.UUID = '00000053-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterActivePower = function () {
    Characteristic.call(this, 'Active power', Characteristic.enphaseMeterActivePower.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kW',
      maxValue: 1000,
      minValue: -1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterActivePower, Characteristic);
  Characteristic.enphaseMeterActivePower.UUID = '00000054-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterApparentPower = function () {
    Characteristic.call(this, 'Apparent power', Characteristic.enphaseMeterApparentPower.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kVA',
      maxValue: 1000,
      minValue: -1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterApparentPower, Characteristic);
  Characteristic.enphaseMeterApparentPower.UUID = '00000055-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterReactivePower = function () {
    Characteristic.call(this, 'Reactive power', Characteristic.enphaseMeterReactivePower.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kVAr',
      maxValue: 1000,
      minValue: -1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterReactivePower, Characteristic);
  Characteristic.enphaseMeterReactivePower.UUID = '00000056-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterPwrFactor = function () {
    Characteristic.call(this, 'Power factor', Characteristic.enphaseMeterPwrFactor.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'cos φ',
      maxValue: 1,
      minValue: -1,
      minStep: 0.01,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterPwrFactor, Characteristic);
  Characteristic.enphaseMeterPwrFactor.UUID = '00000057-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterVoltage = function () {
    Characteristic.call(this, 'Voltage', Characteristic.enphaseMeterVoltage.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'V',
      maxValue: 1000,
      minValue: 0,
      minStep: 0.1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterVoltage, Characteristic);
  Characteristic.enphaseMeterVoltage.UUID = '00000058-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterCurrent = function () {
    Characteristic.call(this, 'Current', Characteristic.enphaseMeterCurrent.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'A',
      maxValue: 1000,
      minValue: -1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterCurrent, Characteristic);
  Characteristic.enphaseMeterCurrent.UUID = '00000059-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterFreq = function () {
    Characteristic.call(this, 'Frequency', Characteristic.enphaseMeterFreq.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'Hz',
      maxValue: 100,
      minValue: 0,
      minStep: 0.01,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterFreq, Characteristic);
  Characteristic.enphaseMeterFreq.UUID = '00000006-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterStatusFlags = function () {
    Characteristic.call(this, 'Status flag', Characteristic.enphaseMeterStatusFlags.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterStatusFlags, Characteristic);
  Characteristic.enphaseMeterStatusFlags.UUID = '00000061-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterReadingTime = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseMeterReadingTime.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterReadingTime, Characteristic);
  Characteristic.enphaseMeterReadingTime.UUID = '00000062-000B-1000-8000-0026BB765291';

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
    this.addOptionalCharacteristic(Characteristic.enphaseMeterActivePower);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterApparentPower);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterReactivePower);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterPwrFactor);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterVoltage);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterCurrent);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterFreq);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterStatusFlags);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterReadingTime);
  };
  inherits(Service.enphaseMeter, Service);
  Service.enphaseMeter.UUID = '00000003-000A-1000-8000-0026BB765291';

  //Envoy production/consumption characteristics
  Characteristic.enphasePower = function () {
    Characteristic.call(this, 'Power', Characteristic.enphasePower.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kW',
      maxValue: 1000,
      minValue: -1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphasePower, Characteristic);
  Characteristic.enphasePower.UUID = '00000007-000B-1000-8000-0026BB765291';

  Characteristic.enphasePowerMax = function () {
    Characteristic.call(this, 'Power max', Characteristic.enphasePowerMax.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kW',
      maxValue: 1000,
      minValue: -1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphasePowerMax, Characteristic);
  Characteristic.enphasePowerMax.UUID = '00000070-000B-1000-8000-0026BB765291';

  Characteristic.enphasePowerMaxDetected = function () {
    Characteristic.call(this, 'Power max detected', Characteristic.enphasePowerMaxDetected.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphasePowerMaxDetected, Characteristic);
  Characteristic.enphasePowerMaxDetected.UUID = '00000071-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnergyToday = function () {
    Characteristic.call(this, 'Energy today', Characteristic.enphaseEnergyToday.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kWh',
      maxValue: 1000000,
      minValue: 0,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnergyToday, Characteristic);
  Characteristic.enphaseEnergyToday.UUID = '00000072-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnergyLastSevenDays = function () {
    Characteristic.call(this, 'Energy last 7 days', Characteristic.enphaseEnergyLastSevenDays.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kWh',
      maxValue: 1000000,
      minValue: 0,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnergyLastSevenDays, Characteristic);
  Characteristic.enphaseEnergyLastSevenDays.UUID = '00000073-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnergyLifeTime = function () {
    Characteristic.call(this, 'Energy lifetime', Characteristic.enphaseEnergyLifeTime.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kWh',
      maxValue: 1000000,
      minValue: 0,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnergyLifeTime, Characteristic);
  Characteristic.enphaseEnergyLifeTime.UUID = '00000074-000B-1000-8000-0026BB765291';

  Characteristic.enphaseRmsCurrent = function () {
    Characteristic.call(this, 'Current', Characteristic.enphaseRmsCurrent.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'A',
      maxValue: 1000,
      minValue: -1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseRmsCurrent, Characteristic);
  Characteristic.enphaseRmsCurrent.UUID = '00000075-000B-1000-8000-0026BB765291';

  Characteristic.enphaseRmsVoltage = function () {
    Characteristic.call(this, 'Voltage', Characteristic.enphaseRmsVoltage.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'V',
      maxValue: 1000,
      minValue: 0,
      minStep: 0.1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseRmsVoltage, Characteristic);
  Characteristic.enphaseRmsVoltage.UUID = '00000076-000B-1000-8000-0026BB765291';

  Characteristic.enphaseReactivePower = function () {
    Characteristic.call(this, 'Reactive power', Characteristic.enphaseReactivePower.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kVAr',
      maxValue: 1000,
      minValue: -1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseReactivePower, Characteristic);
  Characteristic.enphaseReactivePower.UUID = '00000077-000B-1000-8000-0026BB765291';

  Characteristic.enphaseApparentPower = function () {
    Characteristic.call(this, 'Apparent power', Characteristic.enphaseApparentPower.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kVA',
      maxValue: 1000,
      minValue: -1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseApparentPower, Characteristic);
  Characteristic.enphaseApparentPower.UUID = '00000078-000B-1000-8000-0026BB765291';

  Characteristic.enphasePwrFactor = function () {
    Characteristic.call(this, 'Power factor', Characteristic.enphasePwrFactor.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'cos φ',
      maxValue: 1,
      minValue: -1,
      minStep: 0.01,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphasePwrFactor, Characteristic);
  Characteristic.enphasePwrFactor.UUID = '00000079-000B-1000-8000-0026BB765291';

  Characteristic.enphaseReadingTime = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseReadingTime.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseReadingTime, Characteristic);
  Characteristic.enphaseReadingTime.UUID = '00000008-000B-1000-8000-0026BB765291';

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
      maxValue: 1000,
      minValue: -1000,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargePower, Characteristic);
  Characteristic.enphaseEnchargePower.UUID = '00000009-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeEnergy = function () {
    Characteristic.call(this, 'Energy', Characteristic.enphaseEnchargeEnergy.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kWh',
      maxValue: 1000,
      minValue: 0,
      minStep: 0.001,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeEnergy, Characteristic);
  Characteristic.enphaseEnchargeEnergy.UUID = '00000090-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargePercentFull = function () {
    Characteristic.call(this, 'Percent full', Characteristic.enphaseEnchargePercentFull.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      unit: '%',
      maxValue: 100,
      minValue: 0,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargePercentFull, Characteristic);
  Characteristic.enphaseEnchargePercentFull.UUID = '00000091-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeActiveCount = function () {
    Characteristic.call(this, 'Devices count', Characteristic.enphaseEnchargeActiveCount.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      unit: '',
      maxValue: 255,
      minValue: 0,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeActiveCount, Characteristic);
  Characteristic.enphaseEnchargeActiveCount.UUID = '00000092-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeState = function () {
    Characteristic.call(this, 'State', Characteristic.enphaseEnchargeState.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeState, Characteristic);
  Characteristic.enphaseEnchargeState.UUID = '00000093-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeReadingTime = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseEnchargeReadingTime.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeReadingTime, Characteristic);
  Characteristic.enphaseEnchargeReadingTime.UUID = '00000094-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseEnchargeChargeStatus.UUID = '00000101-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeProducing = function () {
    Characteristic.call(this, 'Producing', Characteristic.enphaseEnchargeProducing.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeProducing, Characteristic);
  Characteristic.enphaseEnchargeProducing.UUID = '00000110-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeCommunicating = function () {
    Characteristic.call(this, 'Communicating', Characteristic.enphaseEnchargeCommunicating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeCommunicating, Characteristic);
  Characteristic.enphaseEnchargeCommunicating.UUID = '00000111-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeProvisioned = function () {
    Characteristic.call(this, 'Provisioned', Characteristic.enphaseEnchargeProvisioned.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeProvisioned, Characteristic);
  Characteristic.enphaseEnchargeProvisioned.UUID = '00000112-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeOperating = function () {
    Characteristic.call(this, 'Operating', Characteristic.enphaseEnchargeOperating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeOperating, Characteristic);
  Characteristic.enphaseEnchargeOperating.UUID = '00000113-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeCommLevel = function () {
    Characteristic.call(this, 'Comm level', Characteristic.enphaseEnchargeCommLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      unit: '%',
      maxValue: 100,
      minValue: 0,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeCommLevel, Characteristic);
  Characteristic.enphaseEnchargeCommLevel.UUID = '00000114-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeSleepEnabled = function () {
    Characteristic.call(this, 'Sleep enabled', Characteristic.enphaseEnchargeSleepEnabled.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeSleepEnabled, Characteristic);
  Characteristic.enphaseEnchargeSleepEnabled.UUID = '00000115-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargePercentFull = function () {
    Characteristic.call(this, 'Percent full', Characteristic.enphaseEnchargePercentFull.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      unit: '%',
      maxValue: 100,
      minValue: 0,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargePercentFull, Characteristic);
  Characteristic.enphaseEnchargePercentFull.UUID = '00000116-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeMaxCellTemp = function () {
    Characteristic.call(this, 'Max cell temp', Characteristic.enphaseEnchargeMaxCellTemp.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: '°C',
      maxValue: 200,
      minValue: 0,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeMaxCellTemp, Characteristic);
  Characteristic.enphaseEnchargeMaxCellTemp.UUID = '00000117-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeSleepMinSoc = function () {
    Characteristic.call(this, 'Sleep min soc', Characteristic.enphaseEnchargeSleepMinSoc.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      unit: 'min',
      maxValue: 255,
      minValue: 0,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeSleepMinSoc, Characteristic);
  Characteristic.enphaseEnchargeSleepMinSoc.UUID = '00000118-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeSleepMaxSoc = function () {
    Characteristic.call(this, 'Sleep max soc', Characteristic.enphaseEnchargeSleepMaxSoc.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      unit: 'min',
      maxValue: 255,
      minValue: 0,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeSleepMaxSoc, Characteristic);
  Characteristic.enphaseEnchargeSleepMaxSoc.UUID = '00000119-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeStatus = function () {
    Characteristic.call(this, 'Status', Characteristic.enphaseEnchargeStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeStatus, Characteristic);
  Characteristic.enphaseEnchargeStatus.UUID = '00000120-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeFirmware = function () {
    Characteristic.call(this, 'Firmware', Characteristic.enphaseEnchargeFirmware.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeFirmware, Characteristic);
  Characteristic.enphaseEnchargeFirmware.UUID = '00000121-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeLastReportDate = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseEnchargeLastReportDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeLastReportDate, Characteristic);
  Characteristic.enphaseEnchargeLastReportDate.UUID = '00000122-000B-1000-8000-0026BB765291';

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
      maxValue: 1000,
      minValue: 0,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterPower, Characteristic);
  Characteristic.enphaseMicroinverterPower.UUID = '00000130-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterPowerMax = function () {
    Characteristic.call(this, 'Power max', Characteristic.enphaseMicroinverterPowerMax.UUID);
    this.setProps({
      format: Characteristic.Formats.INT,
      unit: 'W',
      maxValue: 1000,
      minValue: 0,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterPowerMax, Characteristic);
  Characteristic.enphaseMicroinverterPowerMax.UUID = '00000131-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterProducing = function () {
    Characteristic.call(this, 'Producing', Characteristic.enphaseMicroinverterProducing.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterProducing, Characteristic);
  Characteristic.enphaseMicroinverterProducing.UUID = '00000132-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterCommunicating = function () {
    Characteristic.call(this, 'Communicating', Characteristic.enphaseMicroinverterCommunicating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterCommunicating, Characteristic);
  Characteristic.enphaseMicroinverterCommunicating.UUID = '00000133-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterProvisioned = function () {
    Characteristic.call(this, 'Provisioned', Characteristic.enphaseMicroinverterProvisioned.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterProvisioned, Characteristic);
  Characteristic.enphaseMicroinverterProvisioned.UUID = '00000134-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterOperating = function () {
    Characteristic.call(this, 'Operating', Characteristic.enphaseMicroinverterOperating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterOperating, Characteristic);
  Characteristic.enphaseMicroinverterOperating.UUID = '00000135-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterCommLevel = function () {
    Characteristic.call(this, 'Comm level', Characteristic.enphaseMicroinverterCommLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      unit: '%',
      maxValue: 100,
      minValue: 0,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterCommLevel, Characteristic);
  Characteristic.enphaseMicroinverterCommLevel.UUID = '00000136-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterStatus = function () {
    Characteristic.call(this, 'Status', Characteristic.enphaseMicroinverterStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterStatus, Characteristic);
  Characteristic.enphaseMicroinverterStatus.UUID = '00000137-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterFirmware = function () {
    Characteristic.call(this, 'Firmware', Characteristic.enphaseMicroinverterFirmware.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterFirmware, Characteristic);
  Characteristic.enphaseMicroinverterFirmware.UUID = '00000138-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterLastReportDate = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseMicroinverterLastReportDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterLastReportDate, Characteristic);
  Characteristic.enphaseMicroinverterLastReportDate.UUID = '00000139-000B-1000-8000-0026BB765291';

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
        const deviceName = this.devices[i];
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
    this.name = config.name || 'Envoy';
    this.host = config.host || 'envoy.local';
    this.refreshInterval = config.refreshInterval || 5;
    this.disableLogInfo = config.disableLogInfo || false;
    this.envoyPasswd = config.envoyPasswd;
    this.installerPasswd = config.installerPasswd;
    this.enchargeStorageOffset = config.enchargeStorageOffset || 0;
    this.productionPowerMaxDetected = config.powerProductionMaxDetected || 0;
    this.productionEnergyLifetimeOffset = config.energyProductionLifetimeOffset || 0;
    this.consumptionTotalPowerMaxDetected = config.powerConsumptionTotalMaxDetected || 0;
    this.consumptionTotalEnergyLifetimeOffset = config.energyConsumptionTotalLifetimeOffset || 0;
    this.consumptionNetPowerMaxDetected = config.powerConsumptionNetMaxDetected || 0;
    this.consumptionNetEnergyLifetimeOffset = config.energyConsumptionNetLifetimeOffset || 0;

    //setup variables
    this.checkDeviceInfo = false;
    this.checkDeviceState = false;
    this.checkMicroinvertersPower = false;
    this.checkCommLevel = false;
    this.allCommLevels = {};
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

    this.qRelaysCount = 0;

    this.metersCount = 0;
    this.meterProductionState = false;
    this.meterConsumptionState = false;
    this.metersProductionActiveCount = 0;
    this.metersConsumtionTotalActiveCount = 0;
    this.metersConsumptionNetActiveCount = 0;

    this.meterReadingLength = 0;
    this.meterReadingChannelsLength = 0;

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
      const [inventory, info, meters] = await axios.all([axios.get(this.url + ENVOY_API_URL.Inventory), axios.get(this.url + ENVOY_API_URL.GetInfo), axios.get(this.url + ENVOY_API_URL.InternalMeterInfo)]);
      this.log.debug('Device %s %s, get devices data inventory: %s info: %s meters: %s', this.host, this.name, inventory.data, info.data, meters.data);
      const result = await parseStringPromise(info.data);
      this.log.debug('Device: %s %s, parse info.xml successful: %s', this.host, this.name, JSON.stringify(result, null, 2));

      const obj = Object.assign(result, inventory.data, meters.data);
      const devInfo = JSON.stringify(obj, null, 2);
      const writeDevInfoFile = await fsPromises.writeFile(this.devInfoFile, devInfo);
      this.log.debug('Device: %s %s, saved Device Info successful.', this.host, this.name);

      const time = new Date(result.envoy_info.time[0] * 1000).toLocaleString();
      const serialNumber = result.envoy_info.device[0].sn[0];
      const partNum = ENPHASE_PART_NUMBER[result.envoy_info.device[0].pn[0]] || 'Envoy'
      const firmware = result.envoy_info.device[0].software[0];
      const euaid = result.envoy_info.device[0].euaid[0];
      const seqNum = result.envoy_info.device[0].seqnum[0];
      const apiVer = result.envoy_info.device[0].apiver[0];
      const supportMeters = (result.envoy_info.device[0].imeter[0] === 'true');
      const qrelays = inventory.data[2].devices.length;
      const encharges = inventory.data[1].devices.length;
      const microinverters = inventory.data[0].devices.length;

      if (supportMeters) {
        const metersLength = meters.data.length;
        const meterProduction = (meters.data[0].state === 'enabled');
        const meterConsumption = (meters.data[1].state === 'enabled');
        this.metersCount = metersLength;
        this.meterProductionState = meterProduction;
        this.meterConsumptionState = meterConsumption;
      }

      this.log('-------- %s --------', this.name);
      this.log('Manufacturer: Enphase');
      this.log('Model: %s', partNum);
      this.log('Api ver: %s', apiVer);
      this.log('Firmware: %s', firmware);
      this.log('SerialNr: %s', serialNumber);
      this.log('Time: %s', time);
      this.log('------------------------------');
      this.log('Meters: %s', supportMeters ? 'Yes' : 'No');
      if (supportMeters) {
        this.log('Production: %s', this.meterProductionState ? 'Enabled' : 'Disabled');
        this.log('Consumption: %s', this.meterConsumptionState ? 'Enabled' : 'Disabled');
        this.log('------------------------------');
      }
      this.log('Q-Relays: %s', qrelays);
      this.log('Encharges: %s', encharges);
      this.log('Inverters: %s', microinverters);
      this.log('------------------------------');
      this.envoyTime = time;
      this.envoySerialNumber = serialNumber;
      this.envoyFirmware = firmware;
      this.envoySupportMeters = supportMeters;
      this.qRelaysCount = qrelays;
      this.enchargesCount = encharges;
      this.microinvertersCount = microinverters;


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
      const [home, inventory, meters, production, productionCT] = await axios.all([axios.get(this.url + ENVOY_API_URL.Home), axios.get(this.url + ENVOY_API_URL.Inventory), axios.get(this.url + ENVOY_API_URL.InternalMeterInfo), axios.get(this.url + ENVOY_API_URL.InverterProductionSumm), axios.get(this.url + ENVOY_API_URL.SystemReadingStats)]);
      this.log.debug('Debug home: %s, inventory: %s, meters: %s, production: %s, productionCT: %s', home.data, inventory.data, meters.data, production.data, productionCT.data);

      //check communications level of qrelays, encharges, microinverters
      if (this.installerPasswd) {
        try {
          //authorization installer
          const authInstaller = {
            method: 'GET',
            rejectUnauthorized: false,
            digestAuth: INSTALLER_USER + ':' + this.installerPasswd,
            dataType: 'json',
            timeout: [5000, 5000]
          };
          const pcuCommCheck = await http.request(this.url + ENVOY_API_URL.InverterComm, authInstaller);
          this.log.debug('Debug pcuCommCheck: %s', pcuCommCheck.data);
          const allCommLevels = pcuCommCheck.data;
          this.allCommLevels = allCommLevels;
          this.checkCommLevel = true;
        } catch (error) {
          this.log.debug('Device: %s %s, pcuCommCheck error: %s', this.host, this.name, error);
          this.checkCommLevel = false;
        };
      }

      if (this.microinvertersCount > 0) {
        try {
          //authorization envoy
          const passSerialNumber = this.envoySerialNumber.substring(6);
          const passEnvoy = this.envoyPasswd;
          const passwd = passEnvoy || passSerialNumber;
          const auth = ENVOY_USER + ':' + passwd;
          const authEnvoy = {
            method: 'GET',
            rejectUnauthorized: false,
            digestAuth: auth,
            dataType: 'json',
            timeout: [5000, 5000]
          };
          const microinverters = await http.request(this.url + ENVOY_API_URL.InverterProduction, authEnvoy);
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
        if (this.meterProductionState) {
          let metersProductionCount = productionCT.data.production[1].activeCount;
          this.metersProductionActiveCount = metersProductionCount;
        }
        if (this.meterConsumptionState) {
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
        const primaryInterface = ENVOY_STATUS_CODE[home.data.network.primary_interface] || 'undefined';
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
            const interfaces1Status = ENVOY_STATUS_CODE[home.data.network.interfaces[1].status] || 'undefined';
          }
        }
        const tariff = ENVOY_STATUS_CODE[home.data.tariff];
        const commNum = home.data.comm.num;
        const commLevel = (home.data.comm.level * 20);
        const commPcuNum = home.data.comm.pcu.num;
        const commPcuLevel = (home.data.comm.pcu.level * 20);
        const commAcbNum = home.data.comm.acb.num;
        const commAcbLevel = (home.data.comm.acb.level * 20);
        const commNsrbNum = home.data.comm.nsrb.num;
        const commNsrbLevel = (home.data.comm.nsrb.level * 20);
        let status = home.data.allerts;
        const updateStatus = ENVOY_STATUS_CODE[home.data.update_status] || 'undefined';

        // convert status
        if (Array.isArray(status) && status.length > 0) {
          const arrStatus = new Array();
          for (let j = 0; j < status.length; j++) {
            arrStatus.push(ENVOY_STATUS_CODE[status[j]]) || 'undefined';
          }
          status = arrStatus.join(', ')
        } else {
          status = 'Not available';
        }

        if (this.enphaseServiceEnvoy) {
          this.enphaseServiceEnvoy
            .updateCharacteristic(Characteristic.enphaseEnvoyAllerts, status)
            .updateCharacteristic(Characteristic.enphaseEnvoyDbSize, dbSize + ' / ' + dbPercentFull + '%')
            .updateCharacteristic(Characteristic.enphaseEnvoyTariff, tariff)
            .updateCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface, primaryInterface)
            .updateCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm, networkWebComm)
            .updateCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten, everReportedToEnlighten)
            .updateCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel, commNum + ' / ' + commLevel)
            .updateCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel, commPcuNum + ' / ' + commPcuLevel)
            .updateCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel, commAcbNum + ' / ' + commAcbLevel)
            .updateCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel, commNsrbNum + ' / ' + commNsrbLevel)
            .updateCharacteristic(Characteristic.enphaseEnvoyTimeZone, timeZone)
            .updateCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime, currentDate + ' ' + currentTime)
            .updateCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporDate, lastEnlightenReporDate);
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

        for (let i = 0; i < this.qRelaysCount; i++) {
          if (inventory.status === 200 && inventory.data !== undefined) {
            const type = inventory.data[2].type;
            const devicesLength = inventory.data[2].devices.length;
            const partNum = ENPHASE_PART_NUMBER[inventory.data[2].devices[i].part_num] || 'Q-Relay'
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
            const producing = (inventory.data[2].devices[i].producing === true);
            const communicating = (inventory.data[2].devices[i].communicating === true);
            const provisioned = (inventory.data[2].devices[i].provisioned === true);
            const operating = (inventory.data[2].devices[i].operating === true);
            const relay = ENVOY_STATUS_CODE[inventory.data[2].devices[i].relay] || 'undefined';
            const reasonCode = inventory.data[2].devices[i].reason_code;
            const reason = inventory.data[2].devices[i].reason;
            const linesCount = inventory.data[2].devices[i]['line-count'];

            // convert status
            if (Array.isArray(status) && status.length > 0) {
              const arrStatus = new Array();
              for (let j = 0; j < status.length; j++) {
                arrStatus.push(ENVOY_STATUS_CODE[status[j]]) || 'undefined';
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
              this.enphaseServiceQrelay
                .updateCharacteristic(Characteristic.enphaseQrelayStatus, status)
                .updateCharacteristic(Characteristic.enphaseQrelayLastReportDate, lastrptdate)
                .updateCharacteristic(Characteristic.enphaseQrelayFirmware, firmware)
                .updateCharacteristic(Characteristic.enphaseQrelayProducing, producing)
                .updateCharacteristic(Characteristic.enphaseQrelayCommunicating, communicating)
                .updateCharacteristic(Characteristic.enphaseQrelayProvisioned, provisioned)
                .updateCharacteristic(Characteristic.enphaseQrelayOperating, operating)
                .updateCharacteristic(Characteristic.enphaseQrelayState, relay)
                .updateCharacteristic(Characteristic.enphaseQrelayLinesCount, linesCount)
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
        }
      }

      //meters
      if (this.envoySupportMeters) {
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
            const state = ENVOY_STATUS_CODE[meters.data[i].state] || 'undefined';
            const measurementType = meters.data[i].measurementType;
            const phaseMode = ENVOY_STATUS_CODE[meters.data[i].phaseMode] || 'undefined';
            const phaseCount = meters.data[i].phaseCount;
            const meteringStatus = ENVOY_STATUS_CODE[meters.data[i].meteringStatus] || 'undefined';
            let status = meters.data[i].statusFlags;

            // convert status
            if (Array.isArray(status) && status.length > 0) {
              const arrStatus = new Array();
              for (let j = 0; j < status.length; j++) {
                arrStatus.push(ENVOY_STATUS_CODE[status[j]]) || 'undefined';
              }
              status = arrStatus.join(', ')
            } else {
              status = 'Not available';
            }


            if (this.enphaseServiceMeterProduction && (i === 0)) {
              this.enphaseServiceMeterProduction
                .updateCharacteristic(Characteristic.enphaseMeterState, state)
                .updateCharacteristic(Characteristic.enphaseMeterPhaseMode, phaseMode)
                .updateCharacteristic(Characteristic.enphaseMeterPhaseCount, phaseCount)
                .updateCharacteristic(Characteristic.enphaseMeterMeteringStatus, meteringStatus)
                .updateCharacteristic(Characteristic.enphaseMeterStatusFlags, status);
            }

            if (this.enphaseServiceMeterConsumption && (i === 1)) {
              this.enphaseServiceMeterConsumption
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
        }

        //meters read data
        try {
          const meterReading = await axios.get(this.url + ENVOY_API_URL.InternalMeterReadings);
          this.log.debug('Debug meterReading: %s', meterReading.data);
          if (meterReading.status === 200 && meterReading.data !== undefined) {
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

            //read meter summary data
            const meterReadingLength = meterReading.data.length;
            if (meterReadingLength >= 1) {
              for (let k = 0; k < meterReadingLength; k++) {
                const eid = meterReading.data[k].eid;
                const timestamp = new Date(meterReading.data[k].timestamp * 1000).toLocaleString();
                const actEnergyDlvd = parseFloat(meterReading.data[k].actEnergyDlvd).toFixed(3);
                const actEnergyRcvd = parseFloat(meterReading.data[k].actEnergyRcvd).toFixed(3);
                const apparentEnergy = parseFloat(meterReading.data[k].apparentEnergy).toFixed(3);
                const reactEnergyLagg = parseFloat(meterReading.data[k].reactEnergyLagg).toFixed(3);
                const reactEnergyLead = parseFloat(meterReading.data[k].reactEnergyLead).toFixed(3);
                const instantaneousDemand = parseFloat(meterReading.data[k].instantaneousDemand).toFixed(3);
                const activePower = parseFloat((meterReading.data[k].activePower) / 1000).toFixed(3);
                const apparentPower = parseFloat((meterReading.data[k].apparentPower) / 1000).toFixed(3);
                const reactivePower = parseFloat((meterReading.data[k].reactivePower) / 1000).toFixed(3);
                const pwrFactor = parseFloat(meterReading.data[k].pwrFactor).toFixed(3);
                const voltage = parseFloat((meterReading.data[k].voltage) / 3).toFixed(1);
                const current = parseFloat(meterReading.data[k].current).toFixed(3);
                const freq = parseFloat(meterReading.data[k].freq).toFixed(2);

                if (this.enphaseServiceMeterProduction && (k === 0)) {
                  this.enphaseServiceMeterProduction
                    .updateCharacteristic(Characteristic.enphaseMeterReadingTime, timestamp)
                    .updateCharacteristic(Characteristic.enphaseMeterActivePower, activePower)
                    .updateCharacteristic(Characteristic.enphaseMeterApparentPower, apparentPower)
                    .updateCharacteristic(Characteristic.enphaseMeterReactivePower, reactivePower)
                    .updateCharacteristic(Characteristic.enphaseMeterPwrFactor, pwrFactor)
                    .updateCharacteristic(Characteristic.enphaseMeterVoltage, voltage)
                    .updateCharacteristic(Characteristic.enphaseMeterCurrent, current)
                    .updateCharacteristic(Characteristic.enphaseMeterFreq, freq);
                }

                if (this.enphaseServiceMeterConsumption && (k === 1)) {
                  this.enphaseServiceMeterConsumption
                    .updateCharacteristic(Characteristic.enphaseMeterReadingTime, timestamp)
                    .updateCharacteristic(Characteristic.enphaseMeterActivePower, activePower)
                    .updateCharacteristic(Characteristic.enphaseMeterApparentPower, apparentPower)
                    .updateCharacteristic(Characteristic.enphaseMeterReactivePower, reactivePower)
                    .updateCharacteristic(Characteristic.enphaseMeterPwrFactor, pwrFactor)
                    .updateCharacteristic(Characteristic.enphaseMeterVoltage, voltage)
                    .updateCharacteristic(Characteristic.enphaseMeterCurrent, current)
                    .updateCharacteristic(Characteristic.enphaseMeterFreq, freq);
                }

                this.meterReadingLength = meterReadingLength;
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

                //read meter every phase data
                const meterReadingChannelsLength = meterReading.data[k].channels.length;
                if (meterReadingChannelsLength >= 1) {
                  for (let l = 0; l < meterReadingChannelsLength; l++) {
                    const eid = meterReading.data[k].channels[l].eid;
                    const timestamp = new Date(meterReading.data[k].channels[l].timestamp * 1000).toLocaleString();
                    const actEnergyDlvd = parseFloat(meterReading.data[k].channels[l].actEnergyDlvd).toFixed(3);
                    const actEnergyRcvd = parseFloat(meterReading.data[k].channels[l].actEnergyRcvd).toFixed(3);
                    const apparentEnergy = parseFloat(meterReading.data[k].channels[l].apparentEnergy).toFixed(3);
                    const reactEnergyLagg = parseFloat(meterReading.data[k].channels[l].reactEnergyLagg).toFixed(3);
                    const reactEnergyLead = parseFloat(meterReading.data[k].channels[l].reactEnergyLead).toFixed(3);
                    const instantaneousDemand = parseFloat(meterReading.data[k].channels[l].instantaneousDemand).toFixed(3);
                    const activePower = parseFloat((meterReading.data[k].channels[l].activePower) / 1000).toFixed(3);
                    const apparentPower = parseFloat((meterReading.data[k].channels[l].apparentPower) / 1000).toFixed(3);
                    const reactivePower = parseFloat((meterReading.data[k].channels[l].reactivePower) / 1000).toFixed(3);
                    const pwrFactor = parseFloat(meterReading.data[k].channels[l].pwrFactor).toFixed(3);
                    const voltage = parseFloat(meterReading.data[k].channels[l].voltage).toFixed(1);
                    const current = parseFloat(meterReading.data[k].channels[l].current).toFixed(3);
                    const freq = parseFloat(meterReading.data[k].channels[l].freq).toFixed(2);

                    this.meterReadingChannelsLength = meterReadingChannelsLength;
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
              }
            }
          }
        } catch (error) {
          this.log.error('Device: %s %s, meterReading error: %s', this.host, this.name, error);
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
        const productionType = this.meterProductionState ? productionCT.data.production[1].type : 0;
        const productionActiveCount = this.meterProductionState ? productionCT.data.production[1].activeCount : 0;
        const productionMeasurmentType = this.meterProductionState ? productionCT.data.production[1].measurementType : 0;
        const productionReadingTime = this.meterProductionState ? new Date(productionCT.data.production[1].readingTime * 1000).toLocaleString() : productionMicroReadingTime;
        const productionPower = this.meterProductionState ? parseFloat(productionCT.data.production[1].wNow / 1000).toFixed(3) : productionMicroSummaryWattsNow;

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
        const productionEnergyLifeTime = this.meterProductionState ? parseFloat((productionCT.data.production[1].whLifetime + this.productionEnergyLifetimeOffset) / 1000).toFixed(3) : productionMicroSummarywhLifeTime;
        const productionEnergyVarhLeadLifetime = this.meterProductionState ? parseFloat(productionCT.data.production[1].varhLeadLifetime / 1000).toFixed(3) : 0;
        const productionEnergyVarhLagLifetime = this.meterProductionState ? parseFloat(productionCT.data.production[1].varhLagLifetime / 1000).toFixed(3) : 0;
        const productionEnergyLastSevenDays = this.meterProductionState ? parseFloat(productionCT.data.production[1].whLastSevenDays / 1000).toFixed(3) : productionMicroSummarywhLastSevenDays;
        const productionEnergyToday = this.meterProductionState ? parseFloat(productionCT.data.production[1].whToday / 1000).toFixed(3) : productionMicroSummarywhToday;
        const productionEnergyVahToday = this.meterProductionState ? parseFloat(productionCT.data.production[1].vahToday / 1000).toFixed(3) : 0;
        const productionEnergyVarhLeadToday = this.meterProductionState ? parseFloat(productionCT.data.production[1].varhLeadToday / 1000).toFixed(3) : 0;
        const productionEnergyVarhLagToday = this.meterProductionState ? parseFloat(productionCT.data.production[1].varhLagToday / 1000).toFixed(3) : 0;

        //param
        const productionRmsCurrent = this.meterProductionState ? parseFloat(productionCT.data.production[1].rmsCurrent).toFixed(3) : 0;
        const productionRmsVoltage = this.meterProductionState ? parseFloat((productionCT.data.production[1].rmsVoltage) / 3).toFixed(1) : 0;
        const productionReactivePower = this.meterProductionState ? parseFloat((productionCT.data.production[1].reactPwr) / 1000).toFixed(3) : 0;
        const productionApparentPower = this.meterProductionState ? parseFloat((productionCT.data.production[1].apprntPwr) / 1000).toFixed(3) : 0;
        const productionPwrFactor = this.meterProductionState ? parseFloat(productionCT.data.production[1].pwrFactor).toFixed(2) : 0;

        if (this.enphaseServiceProduction) {
          this.enphaseServiceProduction
            .updateCharacteristic(Characteristic.enphaseReadingTime, productionReadingTime)
            .updateCharacteristic(Characteristic.enphasePower, productionPower)
            .updateCharacteristic(Characteristic.enphasePowerMax, productionPowerMax)
            .updateCharacteristic(Characteristic.enphasePowerMaxDetected, productionPowerMaxDetectedState)
            .updateCharacteristic(Characteristic.enphaseEnergyToday, productionEnergyToday)
            .updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, productionEnergyLastSevenDays)
            .updateCharacteristic(Characteristic.enphaseEnergyLifeTime, productionEnergyLifeTime)
          if (this.meterProductionState) {
            this.enphaseServiceProduction
              .updateCharacteristic(Characteristic.enphaseRmsCurrent, productionRmsCurrent)
              .updateCharacteristic(Characteristic.enphaseRmsVoltage, productionRmsVoltage)
              .updateCharacteristic(Characteristic.enphaseReactivePower, productionReactivePower)
              .updateCharacteristic(Characteristic.enphaseApparentPower, productionApparentPower)
              .updateCharacteristic(Characteristic.enphasePwrFactor, productionPwrFactor);
          }
        }

        this.productionReadingTime = productionReadingTime;
        this.productionPower = productionPower;
        this.productionPowerMax = productionPowerMax;
        this.productionPowerMaxDetectedState = productionPowerMaxDetectedState;
        this.productionEnergyToday = productionEnergyToday;
        this.productionEnergyLastSevenDays = productionEnergyLastSevenDays;
        this.productionEnergyLifeTime = productionEnergyLifeTime;

        this.productionRmsCurrent = productionRmsCurrent;
        this.productionRmsVoltage = productionRmsVoltage;
        this.productionReactivePower = productionReactivePower;
        this.productionApparentPower = productionApparentPower;
        this.productionPwrFactor = productionPwrFactor;

        //consumption total
        if (this.meterConsumptionState && this.metersConsumtionTotalActiveCount > 0) {
          const consumptionTotalType = productionCT.data.consumption[0].type;
          const consumptionTotalActiveCount = productionCT.data.consumption[0].activeCount;
          const consumptionTotalMeasurmentType = productionCT.data.consumption[0].measurementType;
          const consumptionTotalReadingTime = new Date(productionCT.data.consumption[0].readingTime * 1000).toLocaleString();
          const consumptionTotalPower = parseFloat(productionCT.data.consumption[0].wNow / 1000).toFixed(3);

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
          const consumptionTotalEnergyLifeTime = parseFloat((productionCT.data.consumption[0].whLifetime + this.consumptionTotalEnergyLifetimeOffset) / 1000).toFixed(3);
          const consumptionTotalEnergyVarhLeadLifetime = parseFloat(productionCT.data.consumption[0].varhLeadLifetime / 1000).toFixed(3);
          const consumptionTotalEnergyVarhLagLifetime = parseFloat(productionCT.data.consumption[0].varhLagLifetime / 1000).toFixed(3);
          const consumptionTotalEnergyLastSevenDays = parseFloat(productionCT.data.consumption[0].whLastSevenDays / 1000).toFixed(3);
          const consumptionTotalEnergyToday = parseFloat(productionCT.data.consumption[0].whToday / 1000).toFixed(3);
          const consumptionTotalEnergyVahToday = parseFloat(productionCT.data.consumption[0].vahToday / 1000).toFixed(3);
          const consumptionTotalEnergyVarhLeadToday = parseFloat(productionCT.data.consumption[0].varhLeadToday / 1000).toFixed(3);
          const consumptionTotalEnergyVarhLagToday = parseFloat(productionCT.data.consumption[0].varhLagToday / 1000).toFixed(3);

          //param
          const consumptionTotalRmsCurrent = parseFloat(productionCT.data.consumption[0].rmsCurrent).toFixed(3);
          const consumptionTotalRmsVoltage = parseFloat((productionCT.data.consumption[0].rmsVoltage) / 3).toFixed(1);
          const consumptionTotalReactivePower = parseFloat((productionCT.data.consumption[0].reactPwr) / 1000).toFixed(3);
          const consumptionTotalApparentPower = parseFloat((productionCT.data.consumption[0].apprntPwr) / 1000).toFixed(3);
          const consumptionTotalPwrFactor = parseFloat(productionCT.data.consumption[0].pwrFactor).toFixed(2);

          if (this.enphaseServiceConsumptionTotal) {
            this.enphaseServiceConsumptionTotal
              .updateCharacteristic(Characteristic.enphaseReadingTime, consumptionTotalReadingTime)
              .updateCharacteristic(Characteristic.enphasePower, consumptionTotalPower)
              .updateCharacteristic(Characteristic.enphasePowerMax, consumptionTotalPowerMax)
              .updateCharacteristic(Characteristic.enphasePowerMaxDetected, consumptionTotalPowerMaxDetectedState)
              .updateCharacteristic(Characteristic.enphaseEnergyToday, consumptionTotalEnergyToday)
              .updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, consumptionTotalEnergyLastSevenDays)
              .updateCharacteristic(Characteristic.enphaseEnergyLifeTime, consumptionTotalEnergyLifeTime)
              .updateCharacteristic(Characteristic.enphaseRmsCurrent, consumptionTotalRmsCurrent)
              .updateCharacteristic(Characteristic.enphaseRmsVoltage, consumptionTotalRmsVoltage)
              .updateCharacteristic(Characteristic.enphaseReactivePower, consumptionTotalReactivePower)
              .updateCharacteristic(Characteristic.enphaseApparentPower, consumptionTotalApparentPower)
              .updateCharacteristic(Characteristic.enphasePwrFactor, consumptionTotalPwrFactor);
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
        if (this.meterConsumptionState && this.metersConsumptionNetActiveCount > 0) {
          const consumptionNetType = productionCT.data.consumption[1].type;
          const consumptionNetActiveCount = productionCT.data.consumption[1].activeCount;
          const consumptionNetMeasurmentType = productionCT.data.consumption[1].measurementType;
          const consumptionNetReadingTime = new Date(productionCT.data.consumption[1].readingTime * 1000).toLocaleString();
          const consumptionNetPower = parseFloat(productionCT.data.consumption[1].wNow / 1000).toFixed(3);

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
          const consumptionNetEnergyLifeTime = parseFloat((productionCT.data.consumption[1].whLifetime + this.consumptionNetEnergyLifetimeOffset) / 1000).toFixed(3);
          const consumptionNetEnergyVarhLeadLifetime = parseFloat(productionCT.data.consumption[1].varhLeadLifetime / 1000).toFixed(3);
          const consumptionNetEnergyVarhLagLifetime = parseFloat(productionCT.data.consumption[1].varhLagLifetime / 1000).toFixed(3);
          const consumptionNetEnergyLastSevenDays = parseFloat(productionCT.data.consumption[1].whLastSevenDays / 1000).toFixed(3);
          const consumptionNetEnergyToday = parseFloat(productionCT.data.consumption[1].whToday / 1000).toFixed(3);
          const consumptionNetEnergyVahToday = parseFloat(productionCT.data.consumption[1].vahToday / 1000).toFixed(3);
          const consumptionNetEnergyVarhLeadToday = parseFloat(productionCT.data.consumption[1].varhLeadToday / 1000).toFixed(3);
          const consumptionNetEnergyVarhLagToday = parseFloat(productionCT.data.consumption[1].varhLagToday / 1000).toFixed(3);

          //param
          const consumptionNetRmsCurrent = parseFloat(productionCT.data.consumption[1].rmsCurrent).toFixed(3);
          const consumptionNetRmsVoltage = parseFloat((productionCT.data.consumption[1].rmsVoltage) / 3).toFixed(1);
          const consumptionNetReactivePower = parseFloat((productionCT.data.consumption[1].reactPwr) / 1000).toFixed(3);
          const consumptionNetApparentPower = parseFloat((productionCT.data.consumption[1].apprntPwr) / 1000).toFixed(3);
          const consumptionNetPwrFactor = parseFloat(productionCT.data.consumption[1].pwrFactor).toFixed(2);

          if (this.enphaseServiceConsumptionNet) {
            this.enphaseServiceConsumptionNet
              .updateCharacteristic(Characteristic.enphaseReadingTime, consumptionNetReadingTime)
              .updateCharacteristic(Characteristic.enphasePower, consumptionNetPower)
              .updateCharacteristic(Characteristic.enphasePowerMax, consumptionNetPowerMax)
              .updateCharacteristic(Characteristic.enphasePowerMaxDetected, consumptionNetPowerMaxDetectedState)
              .updateCharacteristic(Characteristic.enphaseEnergyToday, consumptionNetEnergyToday)
              .updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, consumptionNetEnergyLastSevenDays)
              .updateCharacteristic(Characteristic.enphaseEnergyLifeTime, consumptionNetEnergyLifeTime)
              .updateCharacteristic(Characteristic.enphaseRmsCurrent, consumptionNetRmsCurrent)
              .updateCharacteristic(Characteristic.enphaseRmsVoltage, consumptionNetRmsVoltage)
              .updateCharacteristic(Characteristic.enphaseReactivePower, consumptionNetReactivePower)
              .updateCharacteristic(Characteristic.enphaseApparentPower, consumptionNetApparentPower)
              .updateCharacteristic(Characteristic.enphasePwrFactor, consumptionNetPwrFactor);
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

        for (let i = 0; i < this.enchargesCount; i++) {
          if (inventory.status === 200 && inventory.data !== undefined) {
            const type = inventory.data[1].type;
            const devicesLenth = inventory.data[1].devices.length;
            const partNum = ENPHASE_PART_NUMBER[inventory.data[1].devices[i].part_num] || 'Encharge'
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
            const producing = (inventory.data[1].devices[i].producing === true);
            const communicating = (inventory.data[1].devices[i].communicating === true);
            const provisioned = (inventory.data[1].devices[i].provisioned === true);
            const operating = (inventory.data[1].devices[i].operating === true);
            const sleepEnabled = inventory.data[1].devices[i].sleep_enabled;
            const perfentFull = inventory.data[1].devices[i].percentFull;
            const maxCellTemp = inventory.data[1].devices[i].maxCellTemp;
            const sleepMinSoc = inventory.data[1].devices[i].sleep_min_soc;
            const sleepMaxSoc = inventory.data[1].devices[i].sleep_max_soc;
            const chargeStatus = ENVOY_STATUS_CODE[inventory.data[1].devices[i].charge_status] || 'undefined';

            // convert status
            if (Array.isArray(status) && status.length > 0) {
              const arrStatus = new Array();
              for (let j = 0; j < status.length; j++) {
                arrStatus.push(ENVOY_STATUS_CODE[status[j]]) || 'undefined';
              }
              status = arrStatus.join(', ')
            } else {
              status = 'Not available';
            }

            if (this.enphaseServiceEncharge) {
              this.enphaseServiceEncharge
                .updateCharacteristic(Characteristic.enphaseEnchargeStatus, status)
                .updateCharacteristic(Characteristic.enphaseEnchargeLastReportDate, lastrptdate)
                .updateCharacteristic(Characteristic.enphaseEnchargeFirmware, firmware)
                .updateCharacteristic(Characteristic.enphaseEnchargeProducing, producing)
                .updateCharacteristic(Characteristic.enphaseEnchargeCommunicating, communicating)
                .updateCharacteristic(Characteristic.enphaseEnchargeProvisioned, provisioned)
                .updateCharacteristic(Characteristic.enphaseEnchargeOperating, operating)
                .updateCharacteristic(Characteristic.enphaseEnchargeSleepEnabled, sleepEnabled)
                .updateCharacteristic(Characteristic.enphaseEnchargePerfentFull, perfentFull)
                .updateCharacteristic(Characteristic.enphaseEnchargeMaxCellTemp, maxCellTemp)
                .updateCharacteristic(Characteristic.enphaseEnchargeSleepMinSoc, sleepMinSoc)
                .updateCharacteristic(Characteristic.enphaseEnchargeSleepMaxSoc, sleepMaxSoc)
                .updateCharacteristic(Characteristic.enphaseEnchargeChargeStatus, chargeStatus);
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

          //encharges summary
          if (productionCT.status === 200 && productionCT.data !== undefined) {
            const type = productionCT.data.storage[0].type;
            const activeCount = productionCT.data.storage[0].activeCount;
            const readingTime = new Date(productionCT.data.storage[0].readingTime * 1000).toLocaleString();
            const wNow = parseFloat((productionCT.data.storage[0].wNow) / 1000).toFixed(3);
            const whNow = parseFloat((productionCT.data.storage[0].whNow + this.enchargeStorageOffset) / 1000).toFixed(3);
            const chargeStatus = ENVOY_STATUS_CODE[productionCT.data.storage[0].state] || 'undefined';
            const percentFull = productionCT.data.storage[0].percentFull;

            if (this.enphaseServiceEnchargePowerAndEnergy) {
              this.enphaseServiceEnchargePowerAndEnergy
                .updateCharacteristic(Characteristic.enphaseEnchargeReadingTime, readingTime)
                .updateCharacteristic(Characteristic.enphaseEnchargePower, wNow)
                .updateCharacteristic(Characteristic.enphaseEnchargeEnergy, whNow)
                .updateCharacteristic(Characteristic.enphaseEnchargePercentFull, percentFull)
                .updateCharacteristic(Characteristic.enphaseEnchargeActiveCount, activeCount)
                .updateCharacteristic(Characteristic.enphaseEnchargeState, chargeStatus);
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
          this.microinvertersSerialNumber = new Array();
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

        //microinverters state
        for (let i = 0; i < this.microinvertersCount; i++) {
          if (inventory.status === 200 && inventory.data !== undefined) {
            const type = inventory.data[0].type;
            const devicesLenth = inventory.data[0].devices.length;
            const partNum = ENPHASE_PART_NUMBER[inventory.data[0].devices[i].part_num] || 'Microinverter';
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
            const producing = (inventory.data[0].devices[i].producing === true);
            const communicating = (inventory.data[0].devices[i].communicating === true);
            const provisioned = (inventory.data[0].devices[i].provisioned === true);
            const operating = (inventory.data[0].devices[i].operating === true);

            // convert status
            if (Array.isArray(status) && status.length > 0) {
              const arrStatus = new Array();
              for (let j = 0; j < status.length; j++) {
                arrStatus.push(ENVOY_STATUS_CODE[status[j]]) || 'undefined';
              }
              status = arrStatus.join(', ')
            } else {
              status = 'Not available';
            }

            if (this.enphaseServiceMicronverter) {
              this.enphaseServiceMicronverter
                .updateCharacteristic(Characteristic.enphaseMicroinverterLastReportDate, lastrptdate)
                .updateCharacteristic(Characteristic.enphaseMicroinverterFirmware, firmware)
                .updateCharacteristic(Characteristic.enphaseMicroinverterProducing, producing)
                .updateCharacteristic(Characteristic.enphaseMicroinverterCommunicating, communicating)
                .updateCharacteristic(Characteristic.enphaseMicroinverterProvisioned, provisioned)
                .updateCharacteristic(Characteristic.enphaseMicroinverterOperating, operating)
                .updateCharacteristic(Characteristic.enphaseMicroinverterStatus, status);

            }

            this.microinvertersSerialNumber.push(serialNumber);
            this.microinvertersLastReportDate.push(lastrptdate);
            this.microinvertersFirmware.push(firmware);
            this.microinvertersProducing.push(producing);
            this.microinvertersCommunicating.push(communicating);
            this.microinvertersProvisioned.push(provisioned);
            this.microinvertersOperating.push(operating);
            this.microinvertersStatus.push(status);
          }

          //microinverters power
          if (this.checkMicroinvertersPower && this.microinverters.data !== undefined) {
            for (let j = 0; j < this.microinverters.data.length; j++) {
              const serialNumber = this.microinverters.data[j].serialNumber;
              this.allMicroinvertersSerialNumber.push(serialNumber);
            }
            const index = this.allMicroinvertersSerialNumber.indexOf(this.microinvertersSerialNumber[i]);
            const lastrptdate = new Date(this.microinverters.data[index].lastReportDate * 1000).toLocaleString();
            const type = this.microinverters.data[index].devType;
            const power = parseInt(this.microinverters.data[index].lastReportWatts);
            const powerMax = parseInt(this.microinverters.data[index].maxReportWatts);

            if (this.enphaseServiceMicronverter) {
              this.enphaseServiceMicronverter
                .updateCharacteristic(Characteristic.enphaseMicroinverterLastReportDate, lastrptdate)
                //.updateCharacteristic(Characteristic.enphaseMicroinverterType, type)
                .updateCharacteristic(Characteristic.enphaseMicroinverterPower, power)
                .updateCharacteristic(Characteristic.enphaseMicroinverterPowerMax, powerMax)
            }

            this.microinvertersReadingTimePower.push(lastrptdate);
            this.microinvertersType.push(type);
            this.microinvertersLastPower.push(power);
            this.microinvertersMaxPower.push(powerMax);
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
        const value = this.envoyAllerts;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s allerts: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface)
      .onGet(async () => {
        const value = this.envoyPrimaryInterface;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s network interface: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm)
      .onGet(async () => {
        const value = this.envoyNetworkWebComm;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s web communication: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten)
      .onGet(async () => {
        const value = this.envoyEverReportedToEnlighten;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s report to enlighten: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel)
      .onGet(async () => {
        const value = this.envoyCommNum + ' / ' + this.envoyCommLevel;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s communication devices and level: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel)
      .onGet(async () => {
        const value = this.envoyCommPcuNum + ' / ' + this.envoyCommPcuLevel;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s communication Encharges and level: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel)
      .onGet(async () => {
        const value = this.envoyCommAcbNum + ' / ' + this.envoyCommAcbLevel;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s communication Encharges and level %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel)
      .onGet(async () => {
        const value = this.envoyCommNsrbNum + ' / ' + this.envoyCommNsrbLevel;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s communication qRelays and level: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyDbSize)
      .onGet(async () => {
        const value = this.envoyDbSize + ' / ' + this.envoyDbPercentFull + '%';
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s db size: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyTariff)
      .onGet(async () => {
        const value = this.envoyTariff;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s tariff: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyUpdateStatus)
      .onGet(async () => {
        const value = this.envoyUpdateStatus;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s update status: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyFirmware)
      .onGet(async () => {
        const value = this.envoyFirmware;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s firmware: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyTimeZone)
      .onGet(async () => {
        const value = this.envoyTimeZone;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s time zone: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime)
      .onGet(async () => {
        const value = this.envoyCurrentDate + ' ' + this.envoyCurrentTime;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s current date and time: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    this.enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporDate)
      .onGet(async () => {
        const value = this.envoyLastEnlightenReporDate;
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
            const value = this.qRelaysRelay[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s relay: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Closed' : 'Open');
            }
            return value;
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayLinesCount)
          .onGet(async () => {
            const value = this.qRelaysLinesCount[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s lines: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        if (this.qRelaysLinesCount[i] >= 1) {
          this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayLine1Connected)
            .onGet(async () => {
              const value = this.qRelaysLine1Connected[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, qrelay: %s line 1: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Closed' : 'Open');
              }
              return value;
            });
          if (this.qRelaysLinesCount[i] >= 2) {
            this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayLine2Connected)
              .onGet(async () => {
                const value = this.qRelaysLine2Connected[i];
                if (!this.disableLogInfo) {
                  this.log('Device: %s %s, qrelay: %s line 2: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Closed' : 'Open');
                }
                return value;
              });
            if (this.qRelaysLinesCount[i] >= 3) {
              this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayLine3Connected)
                .onGet(async () => {
                  const value = this.qRelaysLine3Connected[i];
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
            const value = this.qRelaysProducing[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s producing: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayCommunicating)
          .onGet(async () => {
            const value = this.qRelaysCommunicating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s communicating: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayProvisioned)
          .onGet(async () => {
            const value = this.qRelaysProvisioned[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s provisioned: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayOperating)
          .onGet(async () => {
            const value = this.qRelaysOperating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s operating: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayCommLevel)
          .onGet(async () => {
            const key = '' + this.qRelaysSerialNumber[i] + '';
            const value = this.checkCommLevel ? (this.allCommLevels[key]) * 20 : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s comm. level: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayStatus)
          .onGet(async () => {
            const value = this.qRelaysStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s status: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayFirmware)
          .onGet(async () => {
            const value = this.qRelaysFirmware[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s firmware: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayLastReportDate)
          .onGet(async () => {
            const value = this.qRelaysLastReportDate[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s last report: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        accessory.addService(this.enphaseServiceQrelay);
      }
    }

    //ct meter production
    if (this.envoySupportMeters) {
      if (this.meterProductionState) {
        this.enphaseServiceMeterProduction = new Service.enphaseMeter('Meter production', 'enphaseServiceMeterProduction');
        this.enphaseServiceMeterProduction.getCharacteristic(Characteristic.enphaseMeterState)
          .onGet(async () => {
            const value = this.metersState[0];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter production: %s state: %s', this.host, accessoryName, this.metersMeasurementType[0], value);
            }
            return value;
          });
        this.enphaseServiceMeterProduction.getCharacteristic(Characteristic.enphaseMeterPhaseMode)
          .onGet(async () => {
            const value = this.metersPhaseMode[0];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter production: %s phase mode: %s', this.host, accessoryName, this.metersMeasurementType[0], value);
            }
            return value;
          });
        this.enphaseServiceMeterProduction.getCharacteristic(Characteristic.enphaseMeterPhaseCount)
          .onGet(async () => {
            const value = this.metersPhaseCount[0];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter production: %s phase count: %s', this.host, accessoryName, this.metersMeasurementType[0], value);
            }
            return value;
          });
        this.enphaseServiceMeterProduction.getCharacteristic(Characteristic.enphaseMeterMeteringStatus)
          .onGet(async () => {
            const value = this.metersMeteringStatus[0];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter production: %s metering status: %s', this.host, accessoryName, this.metersMeasurementType[0], value);
            }
            return value;
          });
        this.enphaseServiceMeterProduction.getCharacteristic(Characteristic.enphaseMeterStatusFlags)
          .onGet(async () => {
            const value = this.metersStatusFlags[0];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter production: %s status flag: %s', this.host, accessoryName, this.metersMeasurementType[0], value);
            }
            return value;
          });
        this.enphaseServiceMeterProduction.getCharacteristic(Characteristic.enphaseMeterActivePower)
          .onGet(async () => {
            const value = this.activePowerSumm[0];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter production: %s active power: %s kW', this.host, accessoryName, this.metersMeasurementType[0], value);
            }
            return value;
          });
        this.enphaseServiceMeterProduction.getCharacteristic(Characteristic.enphaseMeterApparentPower)
          .onGet(async () => {
            const value = this.apparentPowerSumm[0];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter production: %s apparent power: %s kVA', this.host, accessoryName, this.metersMeasurementType[0], value);
            }
            return value;
          });
        this.enphaseServiceMeterProduction.getCharacteristic(Characteristic.enphaseMeterReactivePower)
          .onGet(async () => {
            const value = this.reactivePowerSumm[0];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter production: %s reactive power: %s kVAr', this.host, accessoryName, this.metersMeasurementType[0], value);
            }
            return value;
          });
        this.enphaseServiceMeterProduction.getCharacteristic(Characteristic.enphaseMeterPwrFactor)
          .onGet(async () => {
            const value = this.pwrFactorSumm[0];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter production: %s power factor: %s cos φ', this.host, accessoryName, this.metersMeasurementType[0], value);
            }
            return value;
          });
        this.enphaseServiceMeterProduction.getCharacteristic(Characteristic.enphaseMeterVoltage)
          .onGet(async () => {
            const value = this.voltageSumm[0];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter production: %s voltage: %s V', this.host, accessoryName, this.metersMeasurementType[0], value);
            }
            return value;
          });
        this.enphaseServiceMeterProduction.getCharacteristic(Characteristic.enphaseMeterCurrent)
          .onGet(async () => {
            const value = this.currentSumm[0];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter production: %s current: %s A', this.host, accessoryName, this.metersMeasurementType[0], value);
            }
            return value;
          });
        this.enphaseServiceMeterProduction.getCharacteristic(Characteristic.enphaseMeterFreq)
          .onGet(async () => {
            const value = this.freqSumm[0];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter production: %s frequency: %s Hz', this.host, accessoryName, this.metersMeasurementType[0], value);
            }
            return value;
          });
        this.enphaseServiceMeterProduction.getCharacteristic(Characteristic.enphaseMeterReadingTime)
          .onGet(async () => {
            const value = this.timestampSumm[0];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter production: %s last report: %s', this.host, accessoryName, this.metersMeasurementType[0], value);
            }
            return value;
          });
        accessory.addService(this.enphaseServiceMeterProduction);
      }

      //ct meter consumption
      if (this.meterProductionState) {
        this.enphaseServiceMeterConsumption = new Service.enphaseMeter('Meter consumption', 'enphaseServiceMeterConsumption');
        this.enphaseServiceMeterConsumption.getCharacteristic(Characteristic.enphaseMeterState)
          .onGet(async () => {
            const value = this.metersState[1];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter consumption: %s state: %s', this.host, accessoryName, this.metersMeasurementType[1], value);
            }
            return value;
          });
        this.enphaseServiceMeterConsumption.getCharacteristic(Characteristic.enphaseMeterPhaseMode)
          .onGet(async () => {
            const value = this.metersPhaseMode[1];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter consumption: %s phase mode: %s', this.host, accessoryName, this.metersMeasurementType[1], value);
            }
            return value;
          });
        this.enphaseServiceMeterConsumption.getCharacteristic(Characteristic.enphaseMeterPhaseCount)
          .onGet(async () => {
            const value = this.metersPhaseCount[1];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter consumption: %s phase count: %s', this.host, accessoryName, this.metersMeasurementType[1], value);
            }
            return value;
          });
        this.enphaseServiceMeterConsumption.getCharacteristic(Characteristic.enphaseMeterMeteringStatus)
          .onGet(async () => {
            const value = this.metersMeteringStatus[1];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter consumption: %s metering status: %s', this.host, accessoryName, this.metersMeasurementType[1], value);
            }
            return value;
          });
        this.enphaseServiceMeterConsumption.getCharacteristic(Characteristic.enphaseMeterStatusFlags)
          .onGet(async () => {
            const value = this.metersStatusFlags[1];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter consumption: %s status flag: %s', this.host, accessoryName, this.metersMeasurementType[1], value);
            }
            return value;
          });
        this.enphaseServiceMeterConsumption.getCharacteristic(Characteristic.enphaseMeterActivePower)
          .onGet(async () => {
            const value = this.activePowerSumm[1];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter consumption: %s active power: %s kW', this.host, accessoryName, this.metersMeasurementType[1], value);
            }
            return value;
          });
        this.enphaseServiceMeterConsumption.getCharacteristic(Characteristic.enphaseMeterApparentPower)
          .onGet(async () => {
            const value = this.apparentPowerSumm[1];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter consumption: %s apparent power: %s kVA', this.host, accessoryName, this.metersMeasurementType[1], value);
            }
            return value;
          });
        this.enphaseServiceMeterConsumption.getCharacteristic(Characteristic.enphaseMeterReactivePower)
          .onGet(async () => {
            const value = this.reactivePowerSumm[1];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter consumption: %s reactive power: %s kVAr', this.host, accessoryName, this.metersMeasurementType[1], value);
            }
            return value;
          });
        this.enphaseServiceMeterConsumption.getCharacteristic(Characteristic.enphaseMeterPwrFactor)
          .onGet(async () => {
            const value = this.pwrFactorSumm[1];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter consumption: %s power factor: %s cos φ', this.host, accessoryName, this.metersMeasurementType[1], value);
            }
            return value;
          });
        this.enphaseServiceMeterConsumption.getCharacteristic(Characteristic.enphaseMeterVoltage)
          .onGet(async () => {
            const value = this.voltageSumm[1];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter consumption: %s voltage: %s V', this.host, accessoryName, this.metersMeasurementType[1], value);
            }
            return value;
          });
        this.enphaseServiceMeterConsumption.getCharacteristic(Characteristic.enphaseMeterCurrent)
          .onGet(async () => {
            const value = this.currentSumm[1];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter consumption: %s current: %s A', this.host, accessoryName, this.metersMeasurementType[1], value);
            }
            return value;
          });
        this.enphaseServiceMeterConsumption.getCharacteristic(Characteristic.enphaseMeterFreq)
          .onGet(async () => {
            const value = this.freqSumm[1];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter consumption: %s frequency: %s Hz', this.host, accessoryName, this.metersMeasurementType[1], value);
            }
            return value;
          });
        this.enphaseServiceMeterConsumption.getCharacteristic(Characteristic.enphaseMeterReadingTime)
          .onGet(async () => {
            const value = this.timestampSumm[1];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter consumption: %s last report: %s', this.host, accessoryName, this.metersMeasurementType[1], value);
            }
            return value;
          });
        accessory.addService(this.enphaseServiceMeterConsumption);
      }
    }

    //power and energy production
    this.enphaseServiceProduction = new Service.enphasePowerEnergyMeter('Production', 'enphaseServiceProduction');
    this.enphaseServiceProduction.getCharacteristic(Characteristic.enphasePower)
      .onGet(async () => {
        const value = this.productionPower;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production power: %s kW', this.host, accessoryName, value);
        }
        return value;
      });
    this.enphaseServiceProduction.getCharacteristic(Characteristic.enphasePowerMax)
      .onGet(async () => {
        const value = this.productionPowerMax;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production power max: %s kW', this.host, accessoryName, value);
        }
        return value;
      });
    this.enphaseServiceProduction.getCharacteristic(Characteristic.enphasePowerMaxDetected)
      .onGet(async () => {
        const value = this.productionPowerMaxDetectedState;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production power max detected: %s', this.host, accessoryName, value ? 'Yes' : 'No');
        }
        return value;
      });
    this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseEnergyToday)
      .onGet(async () => {
        const value = this.productionEnergyToday;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production energy today: %s kWh', this.host, accessoryName, value);
        }
        return value;
      });
    this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
      .onGet(async () => {
        const value = this.productionEnergyLastSevenDays;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production energy last seven days: %s kWh', this.host, accessoryName, value);
        }
        return value;
      });
    this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
      .onGet(async () => {
        const value = this.productionEnergyLifeTime;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production energy lifetime: %s kWh', this.host, accessoryName, value);
        }
        return value;
      });
    if (this.envoySupportMeters && this.metersProductionActiveCount > 0) {
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseRmsCurrent)
        .onGet(async () => {
          const value = this.productionRmsCurrent;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, production current: %s A', this.host, accessoryName, value);
          }
          return value;
        });
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseRmsVoltage)
        .onGet(async () => {
          const value = this.productionRmsVoltage;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, production voltage: %s V', this.host, accessoryName, value);
          }
          return value;
        });
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseReactivePower)
        .onGet(async () => {
          const value = this.productionReactivePower;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, production net reactive power: %s kVAr', this.host, accessoryName, value);
          }
          return value;
        });
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseApparentPower)
        .onGet(async () => {
          const value = this.productionApparentPower;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, production net apparent power: %s kVA', this.host, accessoryName, value);
          }
          return value;
        });
      this.enphaseServiceProduction.getCharacteristic(Characteristic.enphasePwrFactor)
        .onGet(async () => {
          const value = this.productionPwrFactor;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, production power factor: %s cos φ', this.host, accessoryName, value);
          }
          return value;
        });
    }
    this.enphaseServiceProduction.getCharacteristic(Characteristic.enphaseReadingTime)
      .onGet(async () => {
        const value = this.productionReadingTime;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production last report: %s', this.host, accessoryName, value);
        }
        return value;
      });
    accessory.addService(this.enphaseServiceProduction);

    //power and energy consumption total
    if (this.envoySupportMeters) {
      if (this.metersConsumtionTotalActiveCount > 0) {
        this.enphaseServiceConsumptionTotal = new Service.enphasePowerEnergyMeter('Consumption Total', 'enphaseServiceConsumptionTotal');
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphasePower)
          .onGet(async () => {
            const value = this.consumptionTotalPower;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total power : %s kW', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphasePowerMax)
          .onGet(async () => {
            const value = this.consumptionTotalPowerMax;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total power consumption max: %s kW', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphasePowerMaxDetected)
          .onGet(async () => {
            const value = this.consumptionTotalPowerMaxDetectedState;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total power consumption max detected: %s', this.host, accessoryName, value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseEnergyToday)
          .onGet(async () => {
            const value = this.consumptionTotalEnergyToday;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total energy consumption today: %s kWh', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
          .onGet(async () => {
            const value = this.consumptionTotalEnergyLastSevenDays;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total energy consumption last seven days: %s kWh', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
          .onGet(async () => {
            const value = this.consumptionTotalEnergyLifeTime;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total energy lifetime: %s kWh', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseRmsCurrent)
          .onGet(async () => {
            const value = this.consumptionTotalRmsCurrent;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total current: %s A', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseRmsVoltage)
          .onGet(async () => {
            const value = this.consumptionTotalRmsVoltage;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total voltage: %s V', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseReactivePower)
          .onGet(async () => {
            const value = this.consumptionTotalReactivePower;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total reactive power: %s kVAr', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseApparentPower)
          .onGet(async () => {
            const value = this.consumptionTotalApparentPower;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total apparent power: %s kVA', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphasePwrFactor)
          .onGet(async () => {
            const value = this.consumptionTotalPwrFactor;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption total power factor: %s cos φ', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionTotal.getCharacteristic(Characteristic.enphaseReadingTime)
          .onGet(async () => {
            const value = this.consumptionTotalReadingTime;
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
            const value = this.consumptionNetPower;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption net power: %s kW', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphasePowerMax)
          .onGet(async () => {
            const value = this.consumptionNetPowerMax;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption net power max: %s kW', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphasePowerMaxDetected)
          .onGet(async () => {
            const value = this.consumptionNetPowerMaxDetectedState;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption net power max detected: %s', this.host, accessoryName, value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseEnergyToday)
          .onGet(async () => {
            const value = this.consumptionNetEnergyToday;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption net energy today: %s kWh', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
          .onGet(async () => {
            const value = this.consumptionNetEnergyLastSevenDays;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption net energy last seven days: %s kWh', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
          .onGet(async () => {
            const value = this.consumptionNetEnergyLifeTime;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption net energy lifetime: %s kWh', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseRmsCurrent)
          .onGet(async () => {
            const value = this.consumptionNetRmsCurrent;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption net current: %s A', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseRmsVoltage)
          .onGet(async () => {
            const value = this.consumptionNetRmsVoltage;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption net voltage: %s V', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseReactivePower)
          .onGet(async () => {
            const value = this.consumptionNetReactivePower;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption net reactive power: %s kVAr', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseApparentPower)
          .onGet(async () => {
            const value = this.consumptionNetApparentPower;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption net apparent power: %s kVA', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphasePwrFactor)
          .onGet(async () => {
            const value = this.consumptionNetPwrFactor;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, consumption net power factor: %s cos φ', this.host, accessoryName, value);
            }
            return value;
          });
        this.enphaseServiceConsumptionNet.getCharacteristic(Characteristic.enphaseReadingTime)
          .onGet(async () => {
            const value = this.consumptionNetReadingTime;
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
          const value = this.enchargesPower;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, power encharge storage: %s kW', this.host, accessoryName, value);
          }
          return value;
        });
      this.enphaseServiceEnchargePowerAndEnergy.getCharacteristic(Characteristic.enphaseEnchargeEnergy)
        .onGet(async () => {
          const value = this.enchargesEnergy;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, energy encharge storage: %s kWh', this.host, accessoryName, value);
          }
          return value;
        });
      this.enphaseServiceEnchargePowerAndEnergy.getCharacteristic(Characteristic.enphaseEnchargePercentFull)
        .onGet(async () => {
          const value = this.enchargesPercentFull;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, encharge percent full: %s', this.host, accessoryName, value);
          }
          return value;
        });
      this.enphaseServiceEnchargePowerAndEnergy.getCharacteristic(Characteristic.enphaseEnchargeActiveCount)
        .onGet(async () => {
          const value = this.enchargesActiveCount;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, encharge devices count: %s', this.host, accessoryName, value);
          }
          return value;
        });
      this.enphaseServiceEnchargePowerAndEnergy.getCharacteristic(Characteristic.enphaseEnchargeState)
        .onGet(async () => {
          const value = this.enchargesState;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, encharge state: %s', this.host, accessoryName, value);
          }
          return value;
        });
      this.enphaseServiceEnchargePowerAndEnergy.getCharacteristic(Characteristic.enphaseEnchargeReadingTime)
        .onGet(async () => {
          const value = this.enchargesReadingTime;
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
            const value = this.enchargesChargeStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s charge status %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeProducing)
          .onGet(async () => {
            const value = this.enchargesProducing[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s producing: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeCommunicating)
          .onGet(async () => {
            const value = this.enchargesCommunicating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s communicating: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeProvisioned)
          .onGet(async () => {
            const value = this.enchargesProvisioned[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s provisioned: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeOperating)
          .onGet(async () => {
            const value = this.enchargesOperating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s operating: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseQrelayCommLevel)
          .onGet(async () => {
            const key = '' + this.enchargesSerialNumber[i] + '';
            const value = this.checkCommLevel ? (this.allCommLevels[key]) * 20 : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s comm. level: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeSleepEnabled)
          .onGet(async () => {
            const value = this.enchargesSleepEnabled[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s sleep: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargePercentFull)
          .onGet(async () => {
            const value = this.enchargesPercentFull1[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s percent full: %s %', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeMaxCellTemp)
          .onGet(async () => {
            const value = this.enchargesMaxCellTemp[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s max cell temp: %s °C', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeSleepMinSoc)
          .onGet(async () => {
            const value = this.enchargesSleepMinSoc[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s sleep min soc: %s min', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeSleepMaxSoc)
          .onGet(async () => {
            const value = this.enchargesSleepMaxSoc[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s sleep max soc: %s min', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeStatus)
          .onGet(async () => {
            const value = this.enchargesStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s status: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeFirmware)
          .onGet(async () => {
            const value = this.enchargesFirmware[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s firmware: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeLastReportDate)
          .onGet(async () => {
            const value = this.enchargesLastReportDate[i];
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
        this.enphaseServiceMicronverter = new Service.enphaseMicroinverter('Microinverter ' + this.microinvertersSerialNumber[i], 'enphaseServiceMicronverter' + i);
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterPower)
          .onGet(async () => {
            let value = this.microinvertersLastPower[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s last power: %s W', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterPowerMax)
          .onGet(async () => {
            const value = this.microinvertersMaxPower[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s max power: %s W', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterProducing)
          .onGet(async () => {
            const value = this.microinvertersProducing[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s producing: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterCommunicating)
          .onGet(async () => {
            const value = this.microinvertersCommunicating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s communicating: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterProvisioned)
          .onGet(async () => {
            const value = this.microinvertersProvisioned[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s provisioned: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterOperating)
          .onGet(async () => {
            const value = this.microinvertersOperating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s operating: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterCommLevel)
          .onGet(async () => {
            const key = '' + this.microinvertersSerialNumber[i] + '';
            const value = this.checkCommLevel ? (this.allCommLevels[key]) * 20 : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s comm. level: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterStatus)
          .onGet(async () => {
            const value = this.microinvertersStatus[i];
            if (value.length > 64) {
              value = value.substring(0, 64)

            }
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s status: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterFirmware)
          .onGet(async () => {
            const value = this.microinvertersFirmware[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s firmware: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
            return value;
          });
        this.enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterLastReportDate)
          .onGet(async () => {
            const value = this.microinvertersReadingTimePower[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s last report: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
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
