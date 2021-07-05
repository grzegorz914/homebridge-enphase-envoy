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
  //IQ combiner
  '800-00551-r03': 'X-IQ-AM1-120-B-M',
  '800-00553-r03': 'X-IQ-AM1-240-B', '800-00554-r03': 'X-IQ-AM1-240-2', '800-00554-r03': 'X-IQ-AM1-240-2-M', '800-00555-r03': 'X-IQ-AM1-240-3', '800-00554-r03': 'X-IQ-AM1-240-3-ES', '800-00556-r03': 'X-IQ-AM1-240-3C', '800-00554-r03': 'X-IQ-AM1-240-3C-ES', '800-00557-r03': 'X-IQ-AM1-240-BM',
  //Envoys
  '880-00122-r02': 'ENV-S-AB-120-A', '880-00210-r02': 'ENV-S-AM1-120',
  '800-00552-r01': 'ENV-S-WM-230', '800-00553-r01': 'ENV-S-WB-230', '800-00553-r02': 'ENV-S-WB-230-F', '800-00554-r03': 'ENV-S-WM-230', '800-00654-r06': 'ENV-S-WM-230',
  '880-00208-r03': 'ENV-IQ-AM1-240', '880-00208-r02': 'ENV-IQ-AM1-240', '880-00231-r02': 'ENV-IQ-AM1-240', '880-00209-r03': 'ENV-IQ-AM3-3P', '880-00557-r02': 'ENV-IQ-AM3-3P',
  //qRelays
  '800-00597-r02': 'Q-RELAY-3P-INT', '860-00152-r02': 'Q-RELAY-1P-INT',
  //Microinverters
  '800-00633-r02': 'IQ7A-72-2-INT', '800-00632-r02': 'IQ7X-96-2-INT', '800-00631-r02': 'IQ7PLUS-72-2-INT', '800-00630-r02': 'IQ7-60-2-INT',
  '800-00634-r02': 'IQ7A-72-2-US', '800-00635-r02': 'IQ7X-96-2-US', '800-00636-r02': 'IQ7PLUS-72-2-US', '800-00637-r02': 'IQ7-60-2-US',
  '800-00638-r02': 'IQ7A-72-B-US', '800-00639-r02': 'IQ7X-96-B-US', '800-00640-r02': 'IQ7PLUS-72-B-US', '800-00641-r02': 'IQ7-60-B-US',
  //CT
  '121943068536EIM1': 'CT-100-SPLIT-P', '121943068536EIM2': 'CT-100-SPLIT-C',
  '121943068537EIM1': 'CT-200-SPLIT-P', '121943068537EIM2': 'CT-200-SPLIT-C'
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
  //types
  'eim': 'Current meter', 'inverters': 'Microinverters', 'production': 'Production', 'total-consumption': 'Consumption (Total)', 'net-consumption': 'Consumption (Net)', 'acb': 'Encharge',
  //encharge
  'idle': 'Idle', 'discharging': 'Discharging', 'charging': 'Charging',
  //qrelay
  'enabled': 'Enabled', 'disabled': 'Disabled', 'one': 'One', 'two': 'Two', 'three': 'Three', 'normal': 'Normal', 'closed': 'Closed', 'open': 'Open', 'error.nodata': 'No Data',
  //envoy
  'ethernet': 'Ethernet', 'eth0': 'Ethernet', 'wifi': 'WiFi', 'wlan0': 'WiFi', 'cellurar': 'Cellurar', 'connected': 'Connected', 'disconnected': 'Disconnected',
  'single_rate': 'Single rate', 'time_to_use': 'Time to use', 'time_of_use': 'Time of use', 'tiered': 'Tiered', 'not_set': 'Not set', 'flat': 'Flat', 'none': 'None',
  'satisfied': 'Satisfied', 'not-satisfied': 'Not satisfied',
  //status code
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
  Characteristic.enphaseEnvoyPrimaryInterface.UUID = '00000011-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyNetworkWebComm = function () {
    Characteristic.call(this, 'Web communication', Characteristic.enphaseEnvoyNetworkWebComm.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyNetworkWebComm, Characteristic);
  Characteristic.enphaseEnvoyNetworkWebComm.UUID = '00000012-000B-1000-8000-0026BB765291';


  Characteristic.enphaseEnvoyEverReportedToEnlighten = function () {
    Characteristic.call(this, 'Report to Enlighten', Characteristic.enphaseEnvoyEverReportedToEnlighten.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyEverReportedToEnlighten, Characteristic);
  Characteristic.enphaseEnvoyEverReportedToEnlighten.UUID = '00000013-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCommNumAndLevel = function () {
    Characteristic.call(this, 'Devices and level', Characteristic.enphaseEnvoyCommNumAndLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCommNumAndLevel, Characteristic);
  Characteristic.enphaseEnvoyCommNumAndLevel.UUID = '00000014-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCommNumNsrbAndLevel = function () {
    Characteristic.call(this, 'Q-Relays and level', Characteristic.enphaseEnvoyCommNumNsrbAndLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCommNumNsrbAndLevel, Characteristic);
  Characteristic.enphaseEnvoyCommNumNsrbAndLevel.UUID = '00000015-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCommNumAcbAndLevel = function () {
    Characteristic.call(this, 'Encharges and level', Characteristic.enphaseEnvoyCommNumAcbAndLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCommNumAcbAndLevel, Characteristic);
  Characteristic.enphaseEnvoyCommNumAcbAndLevel.UUID = '00000016-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCommNumPcuAndLevel = function () {
    Characteristic.call(this, 'Microinverters and level', Characteristic.enphaseEnvoyCommNumPcuAndLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCommNumPcuAndLevel, Characteristic);
  Characteristic.enphaseEnvoyCommNumPcuAndLevel.UUID = '00000017-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyDbSize = function () {
    Characteristic.call(this, 'DB size', Characteristic.enphaseEnvoyDbSize.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyDbSize, Characteristic);
  Characteristic.enphaseEnvoyDbSize.UUID = '00000018-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyTariff = function () {
    Characteristic.call(this, 'Tariff', Characteristic.enphaseEnvoyTariff.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyTariff, Characteristic);
  Characteristic.enphaseEnvoyTariff.UUID = '00000019-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyFirmware = function () {
    Characteristic.call(this, 'Firmware', Characteristic.enphaseEnvoyFirmware.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyFirmware, Characteristic);
  Characteristic.enphaseEnvoyFirmware.UUID = '00000021-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyUpdateStatus = function () {
    Characteristic.call(this, 'Update status', Characteristic.enphaseEnvoyUpdateStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyUpdateStatus, Characteristic);
  Characteristic.enphaseEnvoyUpdateStatus.UUID = '00000022-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyTimeZone = function () {
    Characteristic.call(this, 'Time Zone', Characteristic.enphaseEnvoyTimeZone.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyTimeZone, Characteristic);
  Characteristic.enphaseEnvoyTimeZone.UUID = '00000023-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCurrentDateTime = function () {
    Characteristic.call(this, 'Local time', Characteristic.enphaseEnvoyCurrentDateTime.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCurrentDateTime, Characteristic);
  Characteristic.enphaseEnvoyCurrentDateTime.UUID = '00000024-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyLastEnlightenReporDate = function () {
    Characteristic.call(this, 'Last report to Enlighten', Characteristic.enphaseEnvoyLastEnlightenReporDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyLastEnlightenReporDate, Characteristic);
  Characteristic.enphaseEnvoyLastEnlightenReporDate.UUID = '00000025-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnvoyCheckCommLevel = function () {
    Characteristic.call(this, 'Check comm level', Characteristic.enphaseEnvoyCheckCommLevel.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnvoyCheckCommLevel, Characteristic);
  Characteristic.enphaseEnvoyCheckCommLevel.UUID = '00000026-000B-1000-8000-0026BB765291';

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
    this.addOptionalCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel);
  };
  inherits(Service.enphaseEnvoy, Service);
  Service.enphaseEnvoy.UUID = '00000001-000A-1000-8000-0026BB765291';

  //Q-Relay
  Characteristic.enphaseQrelayState = function () {
    Characteristic.call(this, 'Relay state', Characteristic.enphaseQrelayState.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayState, Characteristic);
  Characteristic.enphaseQrelayState.UUID = '00000031-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayLinesCount = function () {
    Characteristic.call(this, 'Lines', Characteristic.enphaseQrelayLinesCount.UUID);
    this.setProps({
      format: Characteristic.Formats.INT,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayLinesCount, Characteristic);
  Characteristic.enphaseQrelayLinesCount.UUID = '00000032-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayLine1Connected = function () {
    Characteristic.call(this, 'Line 1', Characteristic.enphaseQrelayLine1Connected.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayLine1Connected, Characteristic);
  Characteristic.enphaseQrelayLine1Connected.UUID = '00000033-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayLine2Connected = function () {
    Characteristic.call(this, 'Line 2', Characteristic.enphaseQrelayLine2Connected.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayLine2Connected, Characteristic);
  Characteristic.enphaseQrelayLine2Connected.UUID = '00000034-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayLine3Connected = function () {
    Characteristic.call(this, 'Line 3', Characteristic.enphaseQrelayLine3Connected.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayLine3Connected, Characteristic);
  Characteristic.enphaseQrelayLine3Connected.UUID = '00000035-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayProducing = function () {
    Characteristic.call(this, 'Producing', Characteristic.enphaseQrelayProducing.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayProducing, Characteristic);
  Characteristic.enphaseQrelayProducing.UUID = '00000036-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayCommunicating = function () {
    Characteristic.call(this, 'Communicating', Characteristic.enphaseQrelayCommunicating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayCommunicating, Characteristic);
  Characteristic.enphaseQrelayCommunicating.UUID = '00000037-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayProvisioned = function () {
    Characteristic.call(this, 'Provisioned', Characteristic.enphaseQrelayProvisioned.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayProvisioned, Characteristic);
  Characteristic.enphaseQrelayProvisioned.UUID = '00000038-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayOperating = function () {
    Characteristic.call(this, 'Operating', Characteristic.enphaseQrelayOperating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayOperating, Characteristic);
  Characteristic.enphaseQrelayOperating.UUID = '00000039-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseQrelayCommLevel.UUID = '00000041-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayStatus = function () {
    Characteristic.call(this, 'Status', Characteristic.enphaseQrelayStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayStatus, Characteristic);
  Characteristic.enphaseQrelayStatus.UUID = '00000042-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayFirmware = function () {
    Characteristic.call(this, 'Firmware', Characteristic.enphaseQrelayFirmware.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayFirmware, Characteristic);
  Characteristic.enphaseQrelayFirmware.UUID = '00000043-000B-1000-8000-0026BB765291';

  Characteristic.enphaseQrelayLastReportDate = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseQrelayLastReportDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseQrelayLastReportDate, Characteristic);
  Characteristic.enphaseQrelayLastReportDate.UUID = '00000044-000B-1000-8000-0026BB765291';

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
    Characteristic.call(this, 'State', Characteristic.enphaseMeterState.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterState, Characteristic);
  Characteristic.enphaseMeterState.UUID = '00000051-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterMeasurementType = function () {
    Characteristic.call(this, 'Meter type', Characteristic.enphaseMeterMeasurementType.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterMeasurementType, Characteristic);
  Characteristic.enphaseMeterMeasurementType.UUID = '00000052-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterPhaseCount = function () {
    Characteristic.call(this, 'Phase count', Characteristic.enphaseMeterPhaseCount.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT8,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterPhaseCount, Characteristic);
  Characteristic.enphaseMeterPhaseCount.UUID = '00000053-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterPhaseMode = function () {
    Characteristic.call(this, 'Phase mode', Characteristic.enphaseMeterPhaseMode.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterPhaseMode, Characteristic);
  Characteristic.enphaseMeterPhaseMode.UUID = '00000054-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterMeteringStatus = function () {
    Characteristic.call(this, 'Metering status', Characteristic.enphaseMeterMeteringStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterMeteringStatus, Characteristic);
  Characteristic.enphaseMeterMeteringStatus.UUID = '00000055-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterStatusFlags = function () {
    Characteristic.call(this, 'Status flag', Characteristic.enphaseMeterStatusFlags.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterStatusFlags, Characteristic);
  Characteristic.enphaseMeterStatusFlags.UUID = '00000056-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseMeterActivePower.UUID = '00000057-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseMeterApparentPower.UUID = '00000058-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseMeterReactivePower.UUID = '00000059-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseMeterPwrFactor.UUID = '00000061-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseMeterVoltage.UUID = '00000062-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseMeterCurrent.UUID = '00000063-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseMeterFreq.UUID = '00000064-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMeterReadingTime = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseMeterReadingTime.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMeterReadingTime, Characteristic);
  Characteristic.enphaseMeterReadingTime.UUID = '00000065-000B-1000-8000-0026BB765291';

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
    this.addOptionalCharacteristic(Characteristic.enphaseMeterActivePower);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterApparentPower);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterReactivePower);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterPwrFactor);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterVoltage);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterCurrent);
    this.addOptionalCharacteristic(Characteristic.enphaseMeterFreq);
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
  Characteristic.enphasePower.UUID = '00000071-000B-1000-8000-0026BB765291';

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
  Characteristic.enphasePowerMax.UUID = '00000072-000B-1000-8000-0026BB765291';

  Characteristic.enphasePowerMaxDetected = function () {
    Characteristic.call(this, 'Power max detected', Characteristic.enphasePowerMaxDetected.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphasePowerMaxDetected, Characteristic);
  Characteristic.enphasePowerMaxDetected.UUID = '00000073-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseEnergyToday.UUID = '00000074-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseEnergyLastSevenDays.UUID = '00000075-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseEnergyLifeTime.UUID = '00000076-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseRmsCurrent.UUID = '00000077-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseRmsVoltage.UUID = '00000078-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseReactivePower.UUID = '00000079-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseApparentPower.UUID = '00000081-000B-1000-8000-0026BB765291';

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
  Characteristic.enphasePwrFactor.UUID = '00000082-000B-1000-8000-0026BB765291';

  Characteristic.enphaseReadingTime = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseReadingTime.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseReadingTime, Characteristic);
  Characteristic.enphaseReadingTime.UUID = '00000083-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseEnchargePower.UUID = '00000091-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseEnchargeEnergy.UUID = '00000092-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseEnchargePercentFull.UUID = '00000093-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseEnchargeActiveCount.UUID = '00000094-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeState = function () {
    Characteristic.call(this, 'State', Characteristic.enphaseEnchargeState.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeState, Characteristic);
  Characteristic.enphaseEnchargeState.UUID = '00000095-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeReadingTime = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseEnchargeReadingTime.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeReadingTime, Characteristic);
  Characteristic.enphaseEnchargeReadingTime.UUID = '00000096-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseEnchargeChargeStatus.UUID = '00000111-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeProducing = function () {
    Characteristic.call(this, 'Producing', Characteristic.enphaseEnchargeProducing.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeProducing, Characteristic);
  Characteristic.enphaseEnchargeProducing.UUID = '00000112-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeCommunicating = function () {
    Characteristic.call(this, 'Communicating', Characteristic.enphaseEnchargeCommunicating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeCommunicating, Characteristic);
  Characteristic.enphaseEnchargeCommunicating.UUID = '00000113-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeProvisioned = function () {
    Characteristic.call(this, 'Provisioned', Characteristic.enphaseEnchargeProvisioned.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeProvisioned, Characteristic);
  Characteristic.enphaseEnchargeProvisioned.UUID = '00000114-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeOperating = function () {
    Characteristic.call(this, 'Operating', Characteristic.enphaseEnchargeOperating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeOperating, Characteristic);
  Characteristic.enphaseEnchargeOperating.UUID = '00000115-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseEnchargeCommLevel.UUID = '00000116-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeSleepEnabled = function () {
    Characteristic.call(this, 'Sleep enabled', Characteristic.enphaseEnchargeSleepEnabled.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeSleepEnabled, Characteristic);
  Characteristic.enphaseEnchargeSleepEnabled.UUID = '00000117-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseEnchargePercentFull.UUID = '00000118-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseEnchargeMaxCellTemp.UUID = '00000119-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseEnchargeSleepMinSoc.UUID = '00000121-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseEnchargeSleepMaxSoc.UUID = '00000122-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeStatus = function () {
    Characteristic.call(this, 'Status', Characteristic.enphaseEnchargeStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeStatus, Characteristic);
  Characteristic.enphaseEnchargeStatus.UUID = '00000123-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeFirmware = function () {
    Characteristic.call(this, 'Firmware', Characteristic.enphaseEnchargeFirmware.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeFirmware, Characteristic);
  Characteristic.enphaseEnchargeFirmware.UUID = '00000124-000B-1000-8000-0026BB765291';

  Characteristic.enphaseEnchargeLastReportDate = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseEnchargeLastReportDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseEnchargeLastReportDate, Characteristic);
  Characteristic.enphaseEnchargeLastReportDate.UUID = '00000125-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseMicroinverterPower.UUID = '00000131-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseMicroinverterPowerMax.UUID = '00000132-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterProducing = function () {
    Characteristic.call(this, 'Producing', Characteristic.enphaseMicroinverterProducing.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterProducing, Characteristic);
  Characteristic.enphaseMicroinverterProducing.UUID = '00000133-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterCommunicating = function () {
    Characteristic.call(this, 'Communicating', Characteristic.enphaseMicroinverterCommunicating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterCommunicating, Characteristic);
  Characteristic.enphaseMicroinverterCommunicating.UUID = '00000134-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterProvisioned = function () {
    Characteristic.call(this, 'Provisioned', Characteristic.enphaseMicroinverterProvisioned.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterProvisioned, Characteristic);
  Characteristic.enphaseMicroinverterProvisioned.UUID = '00000135-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterOperating = function () {
    Characteristic.call(this, 'Operating', Characteristic.enphaseMicroinverterOperating.UUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterOperating, Characteristic);
  Characteristic.enphaseMicroinverterOperating.UUID = '00000136-000B-1000-8000-0026BB765291';

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
  Characteristic.enphaseMicroinverterCommLevel.UUID = '00000137-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterStatus = function () {
    Characteristic.call(this, 'Status', Characteristic.enphaseMicroinverterStatus.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterStatus, Characteristic);
  Characteristic.enphaseMicroinverterStatus.UUID = '00000138-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterFirmware = function () {
    Characteristic.call(this, 'Firmware', Characteristic.enphaseMicroinverterFirmware.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterFirmware, Characteristic);
  Characteristic.enphaseMicroinverterFirmware.UUID = '00000139-000B-1000-8000-0026BB765291';

  Characteristic.enphaseMicroinverterLastReportDate = function () {
    Characteristic.call(this, 'Last report', Characteristic.enphaseMicroinverterLastReportDate.UUID);
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.enphaseMicroinverterLastReportDate, Characteristic);
  Characteristic.enphaseMicroinverterLastReportDate.UUID = '00000141-000B-1000-8000-0026BB765291';

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
    this.accessories = [];

    this.api.on('didFinishLaunching', () => {
      this.log.debug('didFinishLaunching');
      for (let i = 0; i < this.devices.length; i++) {
        const device = this.devices[i];
        if (!device.name) {
          this.log.warn('Device Name Missing');
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
    this.startPrepareAccessory = true;

    this.envoyCheckCommLevel = false;
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
    this.meterProductionEnabled = false;
    this.meterConsumptionEnabled = false;
    this.metersConsumpionCount = 0;
    this.metersReadingCount = 0;
    this.meterReadingChannelsCount = 0;

    this.productionMeasurmentType = '';
    this.productionActiveCount = 0;
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

    this.enchargesCount = 0;
    this.enchargesSummaryType = '';
    this.enchargesSummaryActiveCount = 0;
    this.enchargesSummaryReadingTime = '';
    this.enchargesSummaryPower = 0;
    this.enchargesSummaryEnergy = 0;
    this.enchargesSummaryState = '';
    this.enchargesSummaryPercentFull = 0;

    this.microinvertersCount = 0;
    this.microinvertersActiveCount = 0;

    this.prefDir = path.join(api.user.storagePath(), 'enphaseEnvoy');
    this.productionPowerMaxFile = this.prefDir + '/' + 'productionPowerMax_' + this.host.split('.').join('');
    this.consumptionPowerMaxFile = this.prefDir + '/' + 'consumptionPowerMax_' + this.host.split('.').join('');
    this.consumptionPowerMaxFile1 = this.prefDir + '/' + 'consumptionPowerMax1_' + this.host.split('.').join('');
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
    //check if the files exists, if not then create it
    if (fs.existsSync(this.consumptionPowerMaxFile) === false) {
      fsPromises.writeFile(this.consumptionPowerMaxFile, '0.0');
    }
    //check if the files exists, if not then create it
    if (fs.existsSync(this.consumptionPowerMaxFile1) === false) {
      fsPromises.writeFile(this.consumptionPowerMaxFile1, '0.0');
    }
    //check if the files exists, if not then create it
    if (fs.existsSync(this.devInfoFile) === false) {
      fsPromises.writeFile(this.devInfoFile, '{}');
    }

    this.getDeviceInfo();

    //Check device state
    setInterval(function () {
      if (this.checkDeviceInfo) {
        this.getDeviceInfo();
      }
      if (!this.checkDeviceInfo && this.checkDeviceState) {
        this.updateDeviceState();
        if (this.envoyCheckCommLevel && this.installerPasswd) {
          this.updateCommLevel();
        }
      }
    }.bind(this), this.refreshInterval * 1000);

    //Check microinverters power
    setInterval(function () {
      if (!this.checkDeviceInfo && this.checkDeviceState) {
        this.updateHomeInventoryData();
        this.updateMicroinvertersPower();
      }
    }.bind(this), this.refreshInterval * 5000);
  }

  async getDeviceInfo() {
    this.log.debug('Device: %s %s, requesting devices info.', this.host, this.name);
    try {
      const [infoData, inventoryData, metersData] = await axios.all([axios.get(this.url + ENVOY_API_URL.GetInfo), axios.get(this.url + ENVOY_API_URL.Inventory), axios.get(this.url + ENVOY_API_URL.InternalMeterInfo)]);
      this.log.debug('Device %s %s, debug infoData: %s, inventoryData: %s, metersData: %s', this.host, this.name, infoData.data, inventoryData.data, metersData.data);
      const resultData = await parseStringPromise(infoData.data);
      this.log.debug('Device: %s %s, parse info.xml successful: %s', this.host, this.name, JSON.stringify(resultData, null, 2));

      const obj = Object.assign(resultData, inventoryData.data, metersData.data);
      const devInfo = JSON.stringify(obj, null, 2);
      const writeDevInfoFile = await fsPromises.writeFile(this.devInfoFile, devInfo);
      this.log.debug('Device: %s %s, saved Device Info successful.', this.host, this.name);

      const time = new Date(resultData.envoy_info.time[0] * 1000).toLocaleString();
      const serialNumber = resultData.envoy_info.device[0].sn[0];
      const partNum = ENPHASE_PART_NUMBER[resultData.envoy_info.device[0].pn[0]] || 'Envoy'
      const firmware = resultData.envoy_info.device[0].software[0];
      const euaid = resultData.envoy_info.device[0].euaid[0];
      const seqNum = resultData.envoy_info.device[0].seqnum[0];
      const apiVer = resultData.envoy_info.device[0].apiver[0];
      const supportMeters = (resultData.envoy_info.device[0].imeter[0] === 'true');
      const metersCount = supportMeters ? metersData.data.length : 0;
      const meterProductionEnabled = supportMeters ? (metersData.data[0].state === 'enabled') : false;
      const meterConsumptionEnabled = supportMeters ? (metersData.data[1].state === 'enabled') : false;
      const qrelaysCount = inventoryData.data[2].devices.length;
      const enchargesCount = inventoryData.data[1].devices.length;
      const microinvertersCount = inventoryData.data[0].devices.length;

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
        this.log('Production: %s', meterProductionEnabled ? 'Enabled' : 'Disabled');
        this.log('Consumption: %s', meterConsumptionEnabled ? 'Enabled' : 'Disabled');
        this.log('------------------------------');
      }
      this.log('Q-Relays: %s', qrelaysCount);
      this.log('Encharges: %s', enchargesCount);
      this.log('Inverters: %s', microinvertersCount);
      this.log('------------------------------');
      this.envoyTime = time;
      this.envoySerialNumber = serialNumber;
      this.envoyModelName = partNum;
      this.envoyFirmware = firmware;
      this.envoySupportMeters = supportMeters;
      this.metersCount = metersCount;
      this.meterProductionEnabled = meterProductionEnabled;
      this.meterConsumptionEnabled = meterConsumptionEnabled;
      this.qRelaysCount = qrelaysCount;
      this.enchargesCount = enchargesCount;
      this.microinvertersCount = microinvertersCount;
      this.inventoryData = inventoryData;
      this.metersData = metersData;

      this.checkDeviceInfo = false;
      this.updateHomeInventoryData();
    } catch (error) {
      this.log.error('Device: %s %s, requesting devices info eror: %s, state: Offline trying to reconnect.', this.host, this.name, error);
      this.checkDeviceInfo = true;
    };
  }

  async updateHomeInventoryData() {
    this.log.debug('Device: %s %s, requesting homeData and inventoryData.', this.host, this.name);
    try {
      const [homeData, inventoryData] = await axios.all([axios.get(this.url + ENVOY_API_URL.Home), axios.get(this.url + ENVOY_API_URL.Inventory)]);
      this.log.debug('Device %s %s, debug homeData: %s, inventoryData: %s', this.host, this.name, homeData.data, inventoryData.data);
      this.homeData = homeData;
      this.inventoryData = inventoryData;

      this.updateDeviceState();
    } catch (error) {
      this.log.debug('Device: %s %s, homeData or inventoryData error: %s', this.host, this.name, error);
      this.checkDeviceInfo = true;
    };
  }

  async updateDeviceState() {
    try {
      //get enabled devices
      const envoySupportMeters = this.envoySupportMeters;
      const metersCount = this.metersCount;
      const meterProductionEnabled = this.meterProductionEnabled;
      const meterConsumptionEnabled = this.meterConsumptionEnabled;
      const qRelaysCount = this.qRelaysCount;
      const enchargesCount = this.enchargesCount;
      const microinvertersCount = this.microinvertersCount

      //get inventory and meters data;
      const homeData = this.homeData;
      const inventoryData = this.inventoryData;
      const metersData = this.metersData;

      //read all other data;
      const [productionData, productionCtData, meterReadingData] = await axios.all([axios.get(this.url + ENVOY_API_URL.InverterProductionSumm), axios.get(this.url + ENVOY_API_URL.SystemReadingStats), axios.get(this.url + ENVOY_API_URL.InternalMeterReadings)]);
      this.log.debug('Debug productionData: %s, productionCtData: %s, meterReadingData: %s', productionData.data, productionCtData.data, meterReadingData.data);

      //envoy
      if (homeData.status === 200) {
        const softwareBuildEpoch = homeData.data.software_build_epoch;
        const isEnvoy = (homeData.data.is_nonvoy == false);
        const dbSize = homeData.data.db_size;
        const dbPercentFull = homeData.data.db_percent_full;
        const timeZone = homeData.data.timezone;
        const currentDate = new Date(homeData.data.current_date).toLocaleString().slice(0, 11);
        const currentTime = homeData.data.current_time;
        const networkWebComm = (homeData.data.network.web_comm === true);
        const everReportedToEnlighten = (homeData.data.network.ever_reported_to_enlighten === true);
        const lastEnlightenReporDate = new Date(homeData.data.network.last_enlighten_report_time * 1000).toLocaleString();
        const primaryInterface = ENVOY_STATUS_CODE[homeData.data.network.primary_interface] || 'undefined';
        const interfacesCount = homeData.data.network.interfaces.length;
        if (interfacesCount >= 1) {
          const interfaces0Type = homeData.data.network.interfaces[0].type;
          const interfaces0Interface = homeData.data.network.interfaces[0].interface;
          const interfaces0Mac = homeData.data.network.interfaces[0].mac;
          const interfaces0Dhcp = homeData.data.network.interfaces[0].dhcp;
          const interfaces0Ip = homeData.data.network.interfaces[0].ip;
          const interfaces0SignalStrength = homeData.data.network.interfaces[0].signal_strength;
          const interfaces0Carrier = homeData.data.network.interfaces[0].carrier;
          if (interfacesCount >= 2) {
            const interfaces1SignalStrenth = homeData.data.network.interfaces[1].signal_strength;
            const interfaces1SignalStrengthMax = homeData.data.network.interfaces[1].signal_strength_max;
            const interfaces1Type = homeData.data.network.interfaces[1].type;
            const interfaces1Interface = homeData.data.network.interfaces[1].interface;
            const interfaces1Dhcp = homeData.data.network.interfaces[1].dhcp;
            const interfaces1Ip = homeData.data.network.interfaces[1].ip;
            const interfaces1Carrier = homeData.data.network.interfaces[1].carrier;
            const interfaces1Supported = homeData.data.network.interfaces[1].supported;
            const interfaces1Present = homeData.data.network.interfaces[1].present;
            const interfaces1Configured = homeData.data.network.interfaces[1].configured;
            const interfaces1Status = ENVOY_STATUS_CODE[homeData.data.network.interfaces[1].status] || 'undefined';
          }
        }
        const tariff = ENVOY_STATUS_CODE[homeData.data.tariff];
        const commNum = homeData.data.comm.num;
        const commLevel = (homeData.data.comm.level * 20);
        const commPcuNum = homeData.data.comm.pcu.num;
        const commPcuLevel = (homeData.data.comm.pcu.level * 20);
        const commAcbNum = homeData.data.comm.acb.num;
        const commAcbLevel = (homeData.data.comm.acb.level * 20);
        const commNsrbNum = homeData.data.comm.nsrb.num;
        const commNsrbLevel = (homeData.data.comm.nsrb.level * 20);
        const allerts = homeData.data.allerts;
        const updateStatus = ENVOY_STATUS_CODE[homeData.data.update_status] || 'undefined';

        //convert status
        const arrStatus = new Array();
        if (Array.isArray(allerts) && allerts.length > 0) {
          for (let j = 0; j < allerts.length; j++) {
            arrStatus.push(ENVOY_STATUS_CODE[allerts[j]]);
          }
        }
        const status = (arrStatus.length > 0) ? (arrStatus.join(', ')).substring(0, 64) : 'Not available';

        if (this.envoysService) {
          this.envoysService[0]
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
      if (qRelaysCount > 0 && inventoryData.status === 200) {
        this.qRelaysType = new Array();
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

        for (let i = 0; i < qRelaysCount; i++) {
          const type = ENVOY_STATUS_CODE[inventoryData.data[2].type] || 'undefined';
          const partNum = ENPHASE_PART_NUMBER[inventoryData.data[2].devices[i].part_num] || 'Q-Relay'
          const installed = inventoryData.data[2].devices[i].installed;
          const serialNumber = inventoryData.data[2].devices[i].serial_num;
          const deviceStatus = inventoryData.data[2].devices[i].device_status;
          const lastReportDate = new Date(inventoryData.data[2].devices[i].last_rpt_date * 1000).toLocaleString();
          const adminState = inventoryData.data[2].devices[i].admin_state;
          const devType = inventoryData.data[2].devices[i].dev_type;
          const createdDate = inventoryData.data[2].devices[i].created_date;
          const imageLoadDate = inventoryData.data[2].devices[i].img_load_date;
          const firmware = inventoryData.data[2].devices[i].img_pnum_running;
          const ptpn = inventoryData.data[2].devices[i].ptpn;
          const chaneId = inventoryData.data[2].devices[i].chaneid;
          const deviceControl = inventoryData.data[2].devices[i].device_control;
          const producing = (inventoryData.data[2].devices[i].producing === true);
          const communicating = (inventoryData.data[2].devices[i].communicating === true);
          const provisioned = (inventoryData.data[2].devices[i].provisioned === true);
          const operating = (inventoryData.data[2].devices[i].operating === true);
          const relay = (inventoryData.data[2].devices[i].relay === 'closed') || false;
          const reasonCode = inventoryData.data[2].devices[i].reason_code;
          const reason = inventoryData.data[2].devices[i].reason;
          const linesCount = inventoryData.data[2].devices[i]['line-count'];

          //convert status
          const arrStatus = new Array();
          if (Array.isArray(deviceStatus) && deviceStatus.length > 0) {
            for (let j = 0; j < deviceStatus.length; j++) {
              arrStatus.push(ENVOY_STATUS_CODE[deviceStatus[j]]);
            }
          }
          const status = (arrStatus.length > 0) ? (arrStatus.join(', ')).substring(0, 64) : 'Not available';

          if (linesCount >= 1) {
            const line1Connected = (inventoryData.data[2].devices[i]['line1-connected'] === true);
            if (this.qRelaysService) {
              this.qRelaysService[i]
                .updateCharacteristic(Characteristic.enphaseQrelayLine1Connected, line1Connected);
            }
            this.qRelaysLine1Connected.push(line1Connected);
          }
          if (linesCount >= 2) {
            const line2Connected = (inventoryData.data[2].devices[i]['line2-connected'] === true);
            if (this.qRelaysService) {
              this.qRelaysService[i]
                .updateCharacteristic(Characteristic.enphaseQrelayLine2Connected, line2Connected);
            }
            this.qRelaysLine2Connected.push(line2Connected);
          }
          if (linesCount >= 3) {
            const line3Connected = (inventoryData.data[2].devices[i]['line3-connected'] === true);
            if (this.qRelaysService) {
              this.qRelaysService[i]
                .updateCharacteristic(Characteristic.enphaseQrelayLine3Connected, line3Connected);
            }
            this.qRelaysLine3Connected.push(line3Connected);
          }

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
          }

          this.qRelaysType.push(type);
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
        }
      }

      //meters
      if (envoySupportMeters) {
        if (metersData.status === 200) {
          this.metersEid = new Array();
          this.metersState = new Array();
          this.metersMeasurementType = new Array();
          this.metersPhaseMode = new Array();
          this.metersPhaseCount = new Array();
          this.metersMeteringStatus = new Array();
          this.metersStatusFlags = new Array();

          for (let i = 0; i < metersCount; i++) {
            const eid = metersData.data[i].eid;
            const state = (metersData.data[i].state === 'enabled') || false;
            const measurementType = ENVOY_STATUS_CODE[metersData.data[i].measurementType] || 'undefined';
            const phaseMode = ENVOY_STATUS_CODE[metersData.data[i].phaseMode] || 'undefined';
            const phaseCount = metersData.data[i].phaseCount;
            const meteringStatus = ENVOY_STATUS_CODE[metersData.data[i].meteringStatus] || 'undefined';
            const statusFlags = metersData.data[i].statusFlags;

            // convert status
            const arrStatus = new Array();
            if (Array.isArray(statusFlags) && statusFlags.length > 0) {
              for (let j = 0; j < statusFlags.length; j++) {
                arrStatus.push(ENVOY_STATUS_CODE[statusFlags[j]]);
              }
            }
            const status = (arrStatus.length > 0) ? (arrStatus.join(', ')).substring(0, 64) : 'Not available';


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
        }

        //meters reading data
        if (meterReadingData.status === 200) {
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

          //meters reading summary data
          const metersReadingCount = meterReadingData.data.length;
          if (metersReadingCount > 0) {
            for (let i = 0; i < metersReadingCount; i++) {
              const eid = meterReadingData.data[i].eid;
              const timestamp = new Date(meterReadingData.data[i].timestamp * 1000).toLocaleString();
              const actEnergyDlvd = parseFloat(meterReadingData.data[i].actEnergyDlvd);
              const actEnergyRcvd = parseFloat(meterReadingData.data[i].actEnergyRcvd);
              const apparentEnergy = parseFloat(meterReadingData.data[i].apparentEnergy);
              const reactEnergyLagg = parseFloat(meterReadingData.data[i].reactEnergyLagg);
              const reactEnergyLead = parseFloat(meterReadingData.data[i].reactEnergyLead);
              const instantaneousDemand = parseFloat(meterReadingData.data[i].instantaneousDemand);
              const activePower = parseFloat((meterReadingData.data[i].activePower) / 1000);
              const apparentPower = parseFloat((meterReadingData.data[i].apparentPower) / 1000);
              const reactivePower = parseFloat((meterReadingData.data[i].reactivePower) / 1000);
              const pwrFactor = parseFloat(meterReadingData.data[i].pwrFactor);
              const voltage = parseFloat((meterReadingData.data[i].voltage) / 3);
              const current = parseFloat(meterReadingData.data[i].current);
              const freq = parseFloat(meterReadingData.data[i].freq);

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

              this.metersReadingCount = metersReadingCount;
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
              const meterReadingChannelsCount = meterReadingData.data[i].channels.length;
              if (meterReadingChannelsCount > 0) {
                for (let l = 0; l < meterReadingChannelsCount; l++) {
                  const eid = meterReadingData.data[i].channels[l].eid;
                  const timestamp = new Date(meterReadingData.data[i].channels[l].timestamp * 1000).toLocaleString();
                  const actEnergyDlvd = parseFloat(meterReadingData.data[i].channels[l].actEnergyDlvd);
                  const actEnergyRcvd = parseFloat(meterReadingData.data[i].channels[l].actEnergyRcvd);
                  const apparentEnergy = parseFloat(meterReadingData.data[i].channels[l].apparentEnergy);
                  const reactEnergyLagg = parseFloat(meterReadingData.data[i].channels[l].reactEnergyLagg);
                  const reactEnergyLead = parseFloat(meterReadingData.data[i].channels[l].reactEnergyLead);
                  const instantaneousDemand = parseFloat(meterReadingData.data[i].channels[l].instantaneousDemand);
                  const activePower = parseFloat((meterReadingData.data[i].channels[l].activePower) / 1000);
                  const apparentPower = parseFloat((meterReadingData.data[i].channels[l].apparentPower) / 1000);
                  const reactivePower = parseFloat((meterReadingData.data[i].channels[l].reactivePower) / 1000);
                  const pwrFactor = parseFloat(meterReadingData.data[i].channels[l].pwrFactor);
                  const voltage = parseFloat(meterReadingData.data[i].channels[l].voltage);
                  const current = parseFloat(meterReadingData.data[i].channels[l].current);
                  const freq = parseFloat(meterReadingData.data[i].channels[l].freq);

                  this.meterReadingChannelsCount = meterReadingChannelsCount;
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
      }

      //production
      //microinverters summary 
      const productionMicroSummarywhToday = parseFloat(productionData.data.wattHoursToday / 1000);
      const productionMicroSummarywhLastSevenDays = parseFloat(productionData.data.wattHoursSevenDays / 1000);
      const productionMicroSummarywhLifeTime = parseFloat((productionData.data.wattHoursLifetime + this.productionEnergyLifetimeOffset) / 1000);
      const productionMicroSummaryWattsNow = parseFloat(productionData.data.wattsNow / 1000);

      if (productionCtData.status === 200) {
        //microinverters summary CT
        const productionMicroType = ENVOY_STATUS_CODE[productionCtData.data.production[0].type] || 'undefined';
        const productionMicroActiveCount = productionCtData.data.production[0].activeCount;
        const productionMicroReadingTime = new Date(productionCtData.data.production[0].readingTime * 1000).toLocaleString();
        const productionMicroPower = parseFloat(productionCtData.data.production[0].wNow / 1000);
        const productionMicroEnergyLifeTime = parseFloat((productionCtData.data.production[0].whLifetime + this.productionEnergyLifetimeOffset) / 1000);

        //current transformers
        const productionType = meterProductionEnabled ? ENVOY_STATUS_CODE[productionCtData.data.production[1].type] : productionMicroType;
        const productionActiveCount = meterProductionEnabled ? productionCtData.data.production[1].activeCount : 0;
        const productionMeasurmentType = meterProductionEnabled ? ENVOY_STATUS_CODE[productionCtData.data.production[1].measurementType] : 'undefined';
        const productionReadingTime = meterProductionEnabled ? new Date(productionCtData.data.production[1].readingTime * 1000).toLocaleString() : productionMicroReadingTime;
        const productionPower = meterProductionEnabled ? parseFloat(productionCtData.data.production[1].wNow / 1000) : productionMicroSummaryWattsNow;

        //save and read power max and state
        const savedProductionPowerMax = await fsPromises.readFile(this.productionPowerMaxFile);
        this.log.debug('Device: %s %s, savedProductionPowerMax: %s kW', this.host, this.name, savedProductionPowerMax);
        const productionPowerMax = parseFloat(savedProductionPowerMax);

        if (productionPower > productionPowerMax) {
          const write = await fsPromises.writeFile(this.productionPowerMaxFile, productionPower.toString());
          this.log.debug('Device: %s %s, productionPowerMaxFile saved successful in: %s %s kW', this.host, this.name, this.productionPowerMaxFile, productionPower);

        }

        //power max state detected
        const productionPowerMaxDetectedState = (productionPower >= (this.productionPowerMaxDetected / 1000)) ? true : false;

        //energy
        const productionEnergyLifeTime = meterProductionEnabled ? parseFloat((productionCtData.data.production[1].whLifetime + this.productionEnergyLifetimeOffset) / 1000) : productionMicroSummarywhLifeTime;
        const productionEnergyVarhLeadLifetime = meterProductionEnabled ? parseFloat(productionCtData.data.production[1].varhLeadLifetime / 1000) : 0;
        const productionEnergyVarhLagLifetime = meterProductionEnabled ? parseFloat(productionCtData.data.production[1].varhLagLifetime / 1000) : 0;
        const productionEnergyLastSevenDays = meterProductionEnabled ? parseFloat(productionCtData.data.production[1].whLastSevenDays / 1000) : productionMicroSummarywhLastSevenDays;
        const productionEnergyToday = meterProductionEnabled ? parseFloat(productionCtData.data.production[1].whToday / 1000) : productionMicroSummarywhToday;
        const productionEnergyVahToday = meterProductionEnabled ? parseFloat(productionCtData.data.production[1].vahToday / 1000) : 0;
        const productionEnergyVarhLeadToday = meterProductionEnabled ? parseFloat(productionCtData.data.production[1].varhLeadToday / 1000) : 0;
        const productionEnergyVarhLagToday = meterProductionEnabled ? parseFloat(productionCtData.data.production[1].varhLagToday / 1000) : 0;

        //param
        const productionRmsCurrent = meterProductionEnabled ? parseFloat(productionCtData.data.production[1].rmsCurrent) : 0;
        const productionRmsVoltage = meterProductionEnabled ? parseFloat((productionCtData.data.production[1].rmsVoltage) / 3) : 0;
        const productionReactivePower = meterProductionEnabled ? parseFloat((productionCtData.data.production[1].reactPwr) / 1000) : 0;
        const productionApparentPower = meterProductionEnabled ? parseFloat((productionCtData.data.production[1].apprntPwr) / 1000) : 0;
        const productionPwrFactor = meterProductionEnabled ? parseFloat(productionCtData.data.production[1].pwrFactor) : 0;

        if (this.productionsService) {
          this.productionsService[0]
            .updateCharacteristic(Characteristic.enphaseReadingTime, productionReadingTime)
            .updateCharacteristic(Characteristic.enphasePower, productionPower)
            .updateCharacteristic(Characteristic.enphasePowerMax, productionPowerMax)
            .updateCharacteristic(Characteristic.enphasePowerMaxDetected, productionPowerMaxDetectedState)
            .updateCharacteristic(Characteristic.enphaseEnergyToday, productionEnergyToday)
            .updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, productionEnergyLastSevenDays)
            .updateCharacteristic(Characteristic.enphaseEnergyLifeTime, productionEnergyLifeTime);
          if (meterProductionEnabled) {
            this.productionsService[0]
              .updateCharacteristic(Characteristic.enphaseRmsCurrent, productionRmsCurrent)
              .updateCharacteristic(Characteristic.enphaseRmsVoltage, productionRmsVoltage)
              .updateCharacteristic(Characteristic.enphaseReactivePower, productionReactivePower)
              .updateCharacteristic(Characteristic.enphaseApparentPower, productionApparentPower)
              .updateCharacteristic(Characteristic.enphasePwrFactor, productionPwrFactor);
          }
        }
        this.microinvertersActiveCount = productionMicroActiveCount;

        this.productionActiveCount = productionActiveCount;
        this.productionType = productionType;
        this.productionMeasurmentType = productionMeasurmentType;
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

        //consumption
        if (meterConsumptionEnabled) {
          this.consumptionType = new Array();
          this.consumptionMeasurmentType = new Array();
          this.consumptionActiveCount = new Array();
          this.consumptionReadingTime = new Array();
          this.consumptionPower = new Array();
          this.consumptionPowerMax = new Array();
          this.consumptionPowerMaxDetectedState = new Array();
          this.consumptionEnergyToday = new Array();
          this.consumptionEnergyLastSevenDays = new Array();
          this.consumptionEnergyLifeTime = new Array();
          this.consumptionRmsCurrent = new Array();
          this.consumptionRmsVoltage = new Array();
          this.consumptionReactivePower = new Array();
          this.consumptionApparentPower = new Array();
          this.consumptionPwrFactor = new Array();

          const metersConsumpionCount = productionCtData.data.consumption.length;
          for (let i = 0; i < metersConsumpionCount; i++) {
            //power
            const consumptionType = ENVOY_STATUS_CODE[productionCtData.data.consumption[i].type] || 'undefined';
            const consumptionActiveCount = productionCtData.data.consumption[i].activeCount;
            const consumptionMeasurmentType = ENVOY_STATUS_CODE[productionCtData.data.consumption[i].measurementType] || 'undefined';
            const consumptionReadingTime = new Date(productionCtData.data.consumption[i].readingTime * 1000).toLocaleString();
            const consumptionPower = parseFloat(productionCtData.data.consumption[i].wNow / 1000);

            //save and read power max and state
            const savedConsumptionPowerMax = [await fsPromises.readFile(this.consumptionPowerMaxFile), await fsPromises.readFile(this.consumptionPowerMaxFile1)][i];
            this.log.debug('Device: %s %s, savedProductionPowerMax: %s kW', this.host, this.name, savedConsumptionPowerMax);
            const consumptionPowerMax = parseFloat(savedConsumptionPowerMax);

            if (consumptionPower > consumptionPowerMax) {
              const write = [await fsPromises.writeFile(this.consumptionPowerMaxFile, consumptionPower.toString()), await fsPromises.writeFile(this.consumptionPowerMaxFile1, consumptionPower.toString())][i];
              this.log.debug('Device: %s %s, consumptionPowerMaxFile saved successful in: %s %s kW', this.host, this.name, this.consumptionPowerMaxFile, consumptionPower);
            }

            //power max state detected
            const consumptionPowerMaxDetectedState = (consumptionPower >= (([this.consumptionTotalPowerMaxDetected, this.consumptionNetPowerMaxDetected][i]) / 1000)) ? true : false;

            //energy
            const lifeTimeOffset = [this.consumptionTotalEnergyLifetimeOffset, this.consumptionNetEnergyLifetimeOffset][i];
            const consumptionEnergyLifeTime = parseFloat((productionCtData.data.consumption[i].whLifetime + lifeTimeOffset) / 1000);
            const consumptionEnergyVarhLeadLifetime = parseFloat(productionCtData.data.consumption[i].varhLeadLifetime / 1000);
            const consumptionEnergyVarhLagLifetime = parseFloat(productionCtData.data.consumption[i].varhLagLifetime / 1000);
            const consumptionEnergyLastSevenDays = parseFloat(productionCtData.data.consumption[i].whLastSevenDays / 1000);
            const consumptionEnergyToday = parseFloat(productionCtData.data.consumption[i].whToday / 1000);
            const consumptionEnergyVahToday = parseFloat(productionCtData.data.consumption[i].vahToday / 1000);
            const consumptionEnergyVarhLeadToday = parseFloat(productionCtData.data.consumption[i].varhLeadToday / 1000);
            const consumptionEnergyVarhLagToday = parseFloat(productionCtData.data.consumption[i].varhLagToday / 1000);

            //param
            const consumptionRmsCurrent = parseFloat(productionCtData.data.consumption[i].rmsCurrent);
            const consumptionRmsVoltage = parseFloat((productionCtData.data.consumption[i].rmsVoltage) / 3);
            const consumptionReactivePower = parseFloat((productionCtData.data.consumption[i].reactPwr) / 1000);
            const consumptionApparentPower = parseFloat((productionCtData.data.consumption[i].apprntPwr) / 1000);
            const consumptionPwrFactor = parseFloat(productionCtData.data.consumption[i].pwrFactor);

            if (this.consumptionsService) {
              this.consumptionsService[i]
                .updateCharacteristic(Characteristic.enphaseReadingTime, consumptionReadingTime)
                .updateCharacteristic(Characteristic.enphasePower, consumptionPower)
                .updateCharacteristic(Characteristic.enphasePowerMax, consumptionPowerMax)
                .updateCharacteristic(Characteristic.enphasePowerMaxDetected, consumptionPowerMaxDetectedState)
                .updateCharacteristic(Characteristic.enphaseEnergyToday, consumptionEnergyToday)
                .updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, consumptionEnergyLastSevenDays)
                .updateCharacteristic(Characteristic.enphaseEnergyLifeTime, consumptionEnergyLifeTime)
                .updateCharacteristic(Characteristic.enphaseRmsCurrent, consumptionRmsCurrent)
                .updateCharacteristic(Characteristic.enphaseRmsVoltage, consumptionRmsVoltage)
                .updateCharacteristic(Characteristic.enphaseReactivePower, consumptionReactivePower)
                .updateCharacteristic(Characteristic.enphaseApparentPower, consumptionApparentPower)
                .updateCharacteristic(Characteristic.enphasePwrFactor, consumptionPwrFactor);
            }
            this.metersConsumpionCount = metersConsumpionCount;
            this.consumptionType.push(consumptionType);
            this.consumptionMeasurmentType.push(consumptionMeasurmentType);
            this.consumptionActiveCount.push(consumptionActiveCount);
            this.consumptionReadingTime.push(consumptionReadingTime);
            this.consumptionPower.push(consumptionPower);
            this.consumptionPowerMax.push(consumptionPowerMax);
            this.consumptionPowerMaxDetectedState.push(consumptionPowerMaxDetectedState);
            this.consumptionEnergyToday.push(consumptionEnergyToday);
            this.consumptionEnergyLastSevenDays.push(consumptionEnergyLastSevenDays);
            this.consumptionEnergyLifeTime.push(consumptionEnergyLifeTime);
            this.consumptionRmsCurrent.push(consumptionRmsCurrent);
            this.consumptionRmsVoltage.push(consumptionRmsVoltage);
            this.consumptionReactivePower.push(consumptionReactivePower);
            this.consumptionApparentPower.push(consumptionApparentPower);
            this.consumptionPwrFactor.push(consumptionPwrFactor);
          }
        }
      }

      //encharge storage
      if (enchargesCount > 0) {
        //encharges summary
        if (productionCtData.status === 200) {
          const type = ENVOY_STATUS_CODE[productionCtData.data.storage[0].type] || 'undefined';
          const activeCount = productionCtData.data.storage[0].activeCount;
          const readingTime = new Date(productionCtData.data.storage[0].readingTime * 1000).toLocaleString();
          const wNow = parseFloat((productionCtData.data.storage[0].wNow) / 1000);
          const whNow = parseFloat((productionCtData.data.storage[0].whNow + this.enchargeStorageOffset) / 1000);
          const chargeStatus = ENVOY_STATUS_CODE[productionCtData.data.storage[0].state] || 'undefined';
          const percentFull = productionCtData.data.storage[0].percentFull;

          if (this.enchargesServicePower) {
            this.enchargesServicePower[0]
              .updateCharacteristic(Characteristic.enphaseEnchargeReadingTime, readingTime)
              .updateCharacteristic(Characteristic.enphaseEnchargePower, wNow)
              .updateCharacteristic(Characteristic.enphaseEnchargeEnergy, whNow)
              .updateCharacteristic(Characteristic.enphaseEnchargePercentFull, percentFull)
              .updateCharacteristic(Characteristic.enphaseEnchargeActiveCount, activeCount)
              .updateCharacteristic(Characteristic.enphaseEnchargeState, chargeStatus);
          }

          this.enchargesSummaryType = type;
          this.enchargesSummaryActiveCount = activeCount;
          this.enchargesSummaryReadingTime = readingTime;
          this.enchargesSummaryPower = wNow;
          this.enchargesSummaryEnergy = whNow;
          this.enchargesSummaryState = chargeStatus;
          this.enchargesSummaryPercentFull = percentFull;
        }

        //encharges detail
        if (inventoryData.status === 200) {
          this.enchargesType = new Array();
          this.enchargesSerialNumber = new Array();
          this.enchargesStatus = new Array();
          this.enchargesLastReportDate = new Array();
          this.enchargesFirmware = new Array();
          this.enchargesProducing = new Array();
          this.enchargesCommunicating = new Array();
          this.enchargesProvisioned = new Array();
          this.enchargesOperating = new Array();
          this.enchargesSleepEnabled = new Array();
          this.enchargesPercentFull = new Array();
          this.enchargesMaxCellTemp = new Array();
          this.enchargesSleepMinSoc = new Array();
          this.enchargesSleepMaxSoc = new Array();
          this.enchargesChargeStatus = new Array();

          for (let i = 0; i < enchargesCount; i++) {
            const type = ENVOY_STATUS_CODE[inventoryData.data[1].type] || 'undefined';
            const partNum = ENPHASE_PART_NUMBER[inventoryData.data[1].devices[i].part_num] || 'Encharge'
            const installed = inventoryData.data[1].devices[i].installed;
            const serialNumber = inventoryData.data[1].devices[i].serial_num;
            const deviceStatus = inventoryData.data[1].devices[i].device_status;
            const lastReportDate = new Date(inventoryData.data[1].devices[i].last_rpt_date * 1000).toLocaleString();
            const adminState = inventoryData.data[1].devices[i].admin_state;
            const devType = inventoryData.data[1].devices[i].dev_type;
            const createdDate = inventoryData.data[1].devices[i].created_date;
            const imageLoadDate = inventoryData.data[1].devices[i].img_load_date;
            const firmware = inventoryData.data[1].devices[i].img_pnum_running;
            const ptpn = inventoryData.data[1].devices[i].ptpn;
            const chaneId = inventoryData.data[1].devices[i].chaneid;
            const deviceControl = inventoryData.data[1].devices[i].device_control;
            const producing = (inventoryData.data[1].devices[i].producing === true);
            const communicating = (inventoryData.data[1].devices[i].communicating === true);
            const provisioned = (inventoryData.data[1].devices[i].provisioned === true);
            const operating = (inventoryData.data[1].devices[i].operating === true);
            const sleepEnabled = inventoryData.data[1].devices[i].sleep_enabled;
            const percentFull = inventoryData.data[1].devices[i].percentFull;
            const maxCellTemp = inventoryData.data[1].devices[i].maxCellTemp;
            const sleepMinSoc = inventoryData.data[1].devices[i].sleep_min_soc;
            const sleepMaxSoc = inventoryData.data[1].devices[i].sleep_max_soc;
            const chargeStatus = ENVOY_STATUS_CODE[inventoryData.data[1].devices[i].charge_status] || 'undefined';

            //convert status
            const arrStatus = new Array();
            if (Array.isArray(deviceStatus) && deviceStatus.length > 0) {
              for (let j = 0; j < deviceStatus.length; j++) {
                arrStatus.push(ENVOY_STATUS_CODE[deviceStatus[j]]);
              }
            }
            const status = (arrStatus.length > 0) ? (arrStatus.join(', ')).substring(0, 64) : 'Not available';

            if (this.enchargesService) {
              this.enchargesService[i]
                .updateCharacteristic(Characteristic.enphaseEnchargeStatus, status)
                .updateCharacteristic(Characteristic.enphaseEnchargeLastReportDate, lastReportDate)
                .updateCharacteristic(Characteristic.enphaseEnchargeFirmware, firmware)
                .updateCharacteristic(Characteristic.enphaseEnchargeProducing, producing)
                .updateCharacteristic(Characteristic.enphaseEnchargeCommunicating, communicating)
                .updateCharacteristic(Characteristic.enphaseEnchargeProvisioned, provisioned)
                .updateCharacteristic(Characteristic.enphaseEnchargeOperating, operating)
                .updateCharacteristic(Characteristic.enphaseEnchargeSleepEnabled, sleepEnabled)
                .updateCharacteristic(Characteristic.enphaseEnchargePercentFull, percentFull)
                .updateCharacteristic(Characteristic.enphaseEnchargeMaxCellTemp, maxCellTemp)
                .updateCharacteristic(Characteristic.enphaseEnchargeSleepMinSoc, sleepMinSoc)
                .updateCharacteristic(Characteristic.enphaseEnchargeSleepMaxSoc, sleepMaxSoc)
                .updateCharacteristic(Characteristic.enphaseEnchargeChargeStatus, chargeStatus);
            }

            this.enchargesType.push(type);
            this.enchargesSerialNumber.push(serialNumber);
            this.enchargesStatus.push(status);
            this.enchargesLastReportDate.push(lastReportDate);
            this.enchargesFirmware.push(firmware);
            this.enchargesProducing.push(producing);
            this.enchargesCommunicating.push(communicating);
            this.enchargesProvisioned.push(provisioned);
            this.enchargesOperating.push(operating);
            this.enchargesSleepEnabled.push(sleepEnabled);
            this.enchargesPercentFull.push(percentFull);
            this.enchargesMaxCellTemp.push(maxCellTemp);
            this.enchargesSleepMinSoc.push(sleepMinSoc);
            this.enchargesSleepMaxSoc.push(sleepMaxSoc);
            this.enchargesChargeStatus.push(chargeStatus);
          }
        }
      }

      //microinverters
      if (microinvertersCount > 0 && inventoryData.status === 200) {
        this.microinvertersType = new Array();
        this.microinvertersSerialNumber = new Array();
        this.microinvertersLastReportDate = new Array();
        this.microinvertersFirmware = new Array();
        this.microinvertersProducing = new Array();
        this.microinvertersCommunicating = new Array();
        this.microinvertersProvisioned = new Array();
        this.microinvertersOperating = new Array();
        this.microinvertersStatus = new Array();

        for (let i = 0; i < microinvertersCount; i++) {
          const type = ENVOY_STATUS_CODE[inventoryData.data[0].type] || 'undefined';
          const partNum = ENPHASE_PART_NUMBER[inventoryData.data[0].devices[i].part_num] || 'Microinverter';
          const installed = inventoryData.data[0].devices[i].installed;
          const serialNumber = inventoryData.data[0].devices[i].serial_num;
          const deviceStatus = inventoryData.data[0].devices[i].device_status;
          const lastReportDate = new Date(inventoryData.data[0].devices[i].last_rpt_date * 1000).toLocaleString();
          const adminState = inventoryData.data[0].devices[i].admin_state;
          const devType = inventoryData.data[0].devices[i].dev_type;
          const createdDate = inventoryData.data[0].devices[i].created_date;
          const imageLoadDate = inventoryData.data[0].devices[i].img_load_date;
          const firmware = inventoryData.data[0].devices[i].img_pnum_running;
          const ptpn = inventoryData.data[0].devices[i].ptpn;
          const chaneId = inventoryData.data[0].devices[i].chaneid;
          const deviceControl = inventoryData.data[0].devices[i].device_control;
          const producing = (inventoryData.data[0].devices[i].producing === true);
          const communicating = (inventoryData.data[0].devices[i].communicating === true);
          const provisioned = (inventoryData.data[0].devices[i].provisioned === true);
          const operating = (inventoryData.data[0].devices[i].operating === true);

          //convert status
          const arrStatus = new Array();
          if (Array.isArray(deviceStatus) && deviceStatus.length > 0) {
            for (let j = 0; j < deviceStatus.length; j++) {
              arrStatus.push(ENVOY_STATUS_CODE[deviceStatus[j]]);
            }
          }
          const status = (arrStatus.length > 0) ? (arrStatus.join(', ')).substring(0, 64) : 'Not available';

          if (this.microinvertersService) {
            this.microinvertersService[i]
              .updateCharacteristic(Characteristic.enphaseMicroinverterLastReportDate, lastReportDate)
              .updateCharacteristic(Characteristic.enphaseMicroinverterFirmware, firmware)
              .updateCharacteristic(Characteristic.enphaseMicroinverterProducing, producing)
              .updateCharacteristic(Characteristic.enphaseMicroinverterCommunicating, communicating)
              .updateCharacteristic(Characteristic.enphaseMicroinverterProvisioned, provisioned)
              .updateCharacteristic(Characteristic.enphaseMicroinverterOperating, operating)
              .updateCharacteristic(Characteristic.enphaseMicroinverterStatus, status);

          }

          this.microinvertersType.push(type);
          this.microinvertersSerialNumber.push(serialNumber);
          this.microinvertersLastReportDate.push(lastReportDate);
          this.microinvertersFirmware.push(firmware);
          this.microinvertersProducing.push(producing);
          this.microinvertersCommunicating.push(communicating);
          this.microinvertersProvisioned.push(provisioned);
          this.microinvertersOperating.push(operating);
          this.microinvertersStatus.push(status);
        }
      }
      this.checkDeviceState = true;

      //start prepare accessory
      if (this.startPrepareAccessory) {
        this.updateMicroinvertersPower();
        this.prepareAccessory();
      }
    } catch (error) {
      this.log.error('Device: %s %s, update Device state error: %s', this.host, this.name, error);
      this.checkDeviceState = false;
      this.checkDeviceInfo = true;
    }
  }

  async updateMicroinvertersPower() {
    this.log.debug('Device: %s %s, requesting microinverters power', this.host, this.name);
    try {
      const microinvertersCount = this.microinvertersCount;
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
      const microinvertersData = await http.request(this.url + ENVOY_API_URL.InverterProduction, authEnvoy);
      this.log.debug('Debug production inverters: %s', microinvertersData.data);
      const allMicroinvertersCount = microinvertersData.data.length;
      const checkMicroinvertersPower = (microinvertersData.status === 200) ? true : false;

      //microinverters power
      if (checkMicroinvertersPower) {
        this.allMicroinvertersSerialNumber = new Array();
        this.microinvertersReadingTime = new Array();
        this.microinvertersType = new Array();
        this.microinvertersLastPower = new Array();
        this.microinvertersMaxPower = new Array();

        for (let i = 0; i < microinvertersCount; i++) {
          for (let j = 0; j < allMicroinvertersCount; j++) {
            const serialNumber = microinvertersData.data[j].serialNumber;
            this.allMicroinvertersSerialNumber.push(serialNumber);
          }
          const index = this.allMicroinvertersSerialNumber.indexOf(this.microinvertersSerialNumber[i]);
          const lastReportDate = new Date(microinvertersData.data[index].lastReportDate * 1000).toLocaleString();
          const devType = microinvertersData.data[index].devType;
          const lastReportWatts = parseInt(microinvertersData.data[index].lastReportWatts);
          const maxReportWatts = parseInt(microinvertersData.data[index].maxReportWatts);

          if (this.microinvertersService) {
            this.microinvertersService[i]
              .updateCharacteristic(Characteristic.enphaseMicroinverterLastReportDate, lastReportDate)
              //.updateCharacteristic(Characteristic.enphaseMicroinverterType, devType)
              .updateCharacteristic(Characteristic.enphaseMicroinverterPower, lastReportWatts)
              .updateCharacteristic(Characteristic.enphaseMicroinverterPowerMax, maxReportWatts)
          }

          this.microinvertersReadingTime.push(lastReportDate);
          this.microinvertersType.push(devType);
          this.microinvertersLastPower.push(lastReportWatts);
          this.microinvertersMaxPower.push(maxReportWatts);
        }
      }

      this.checkMicroinvertersPower = checkMicroinvertersPower;
    } catch (error) {
      this.log.debug('Device: %s %s, microinverters error: %s', this.host, this.name, error);
      this.checkMicroinvertersPower = false;
    };
  }

  async updateCommLevel() {
    this.log.debug('Device: %s %s, requesting communications level.', this.host, this.name);
    try {
      const authInstaller = {
        method: 'GET',
        rejectUnauthorized: false,
        digestAuth: INSTALLER_USER + ':' + this.installerPasswd,
        dataType: 'json',
        timeout: [5000, 5000]
      };
      const pcuCommCheckData = await http.request(this.url + ENVOY_API_URL.InverterComm, authInstaller);
      const commLevel = pcuCommCheckData.data;
      this.log.debug('Debug pcuCommCheck: %s', commLevel);

      // get devices count
      const qRelaysCount = this.qRelaysCount;
      const enchargesCount = this.enchargesCount;
      const microinvertersCount = this.microinvertersCount

      //create arrays
      this.qRelaysCommLevel = new Array();
      this.enchargesCommLevel = new Array();
      this.microinvertersCommLevel = new Array();

      for (let i = 0; i < qRelaysCount; i++) {
        const key = '' + this.qRelaysSerialNumber[i] + '';
        const value = (commLevel[key] !== undefined) ? (commLevel[key]) * 20 : 0;

        if (this.qRelaysService) {
          this.qRelaysService[i]
            .updateCharacteristic(Characteristic.enphaseQrelayCommLevel, value)
        }
        this.qRelaysCommLevel.push(value);
      }

      for (let i = 0; i < enchargesCount; i++) {
        const key = '' + this.enchargesSerialNumber[i] + '';
        const value = (commLevel[key] !== undefined) ? (commLevel[key]) * 20 : 0;

        if (this.enchargesService) {
          this.enchargesService[i]
            .updateCharacteristic(Characteristic.enphaseEnchargeCommLevel, value)
        }
        this.enchargesCommLevel.push(value);
      }

      for (let i = 0; i < microinvertersCount; i++) {
        const key = '' + this.microinvertersSerialNumber[i] + '';
        const value = (commLevel[key] !== undefined) ? (commLevel[key]) * 20 : 0;

        if (this.microinvertersService) {
          this.microinvertersService[i]
            .updateCharacteristic(Characteristic.enphaseMicroinverterCommLevel, value)
        }
        this.microinvertersCommLevel.push(value);
      }

      //disable check comm level switch
      if (this.envoysService) {
        this.envoysService[0]
          .updateCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel, false);
      }

      this.checkCommLevel = true;
      this.envoyCheckCommLevel = false;
    } catch (error) {
      this.log.debug('Device: %s %s, pcuCommCheck error: %s', this.host, this.name, error);
      this.checkCommLevel = false;
      this.envoyCheckCommLevel = true;
    };
  }

  //Prepare accessory
  prepareAccessory() {
    this.log.debug('prepareAccessory');
    const accessoryName = this.name;
    const accessoryUUID = UUID.generate(accessoryName);
    const accessoryCategory = Categories.OTHER;
    const accessory = new Accessory(accessoryName, accessoryUUID, accessoryCategory);

    this.log.debug('prepareInformationService');
    const manufacturer = 'Enphase';
    const modelName = this.envoyModelName;
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
    //get enabled devices
    const envoySupportMeters = this.envoySupportMeters;
    const metersCount = this.metersCount;
    const meterProductionEnabled = this.meterProductionEnabled;
    const meterConsumptionEnabled = this.meterConsumptionEnabled;
    const metersConsumpionCount = this.metersConsumpionCount;
    const qRelaysCount = this.qRelaysCount;
    const enchargesCount = this.enchargesCount;
    const enchargesActiveCount = this.enchargesActiveCount;
    const microinvertersCount = this.microinvertersCount;
    const microinvertersActiveCount = this.microinvertersActiveCount;

    //envoy
    this.envoysService = new Array();
    const enphaseServiceEnvoy = new Service.enphaseEnvoy('Envoy ' + this.envoySerialNumber, 'enphaseServiceEnvoy');
    enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyAllerts)
      .onGet(async () => {
        const value = this.envoyAllerts;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s allerts: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface)
      .onGet(async () => {
        const value = this.envoyPrimaryInterface;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s network interface: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm)
      .onGet(async () => {
        const value = this.envoyNetworkWebComm;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s web communication: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten)
      .onGet(async () => {
        const value = this.envoyEverReportedToEnlighten;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s report to enlighten: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel)
      .onGet(async () => {
        const value = this.envoyCommNum + ' / ' + this.envoyCommLevel;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s communication devices and level: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel)
      .onGet(async () => {
        const value = this.envoyCommPcuNum + ' / ' + this.envoyCommPcuLevel;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s communication Encharges and level: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel)
      .onGet(async () => {
        const value = this.envoyCommAcbNum + ' / ' + this.envoyCommAcbLevel;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s communication Encharges and level %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel)
      .onGet(async () => {
        const value = this.envoyCommNsrbNum + ' / ' + this.envoyCommNsrbLevel;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s communication qRelays and level: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyDbSize)
      .onGet(async () => {
        const value = this.envoyDbSize + ' / ' + this.envoyDbPercentFull + '%';
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s db size: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyTariff)
      .onGet(async () => {
        const value = this.envoyTariff;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s tariff: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyUpdateStatus)
      .onGet(async () => {
        const value = this.envoyUpdateStatus;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s update status: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyFirmware)
      .onGet(async () => {
        const value = this.envoyFirmware;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s firmware: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyTimeZone)
      .onGet(async () => {
        const value = this.envoyTimeZone;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s time zone: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime)
      .onGet(async () => {
        const value = this.envoyCurrentDate + ' ' + this.envoyCurrentTime;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s current date and time: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporDate)
      .onGet(async () => {
        const value = this.envoyLastEnlightenReporDate;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s last report to enlighten: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });

    enphaseServiceEnvoy.getCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel)
      .onGet(async () => {
        const state = this.envoyCheckCommLevel;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s checking comm level: %s', this.host, accessoryName, this.envoySerialNumber, state ? 'Yes' : 'No');
        }
        return state;
      })
      .onSet(async (state) => {
        this.envoyCheckCommLevel = state;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s check comm level: %s', this.host, accessoryName, this.envoySerialNumber, state ? 'Yes' : 'No');
        }
      });
    this.envoysService.push(enphaseServiceEnvoy);
    accessory.addService(this.envoysService[0]);

    //qrelays
    if (qRelaysCount > 0) {
      this.qRelaysService = new Array();
      for (let i = 0; i < qRelaysCount; i++) {
        const enphaseServiceQrelay = new Service.enphaseQrelay('Q-Relay ' + this.qRelaysSerialNumber[i], 'enphaseServiceQrelay' + i);
        enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayState)
          .onGet(async () => {
            const value = this.qRelaysRelay[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s relay state: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Closed' : 'Open');
            }
            return value;
          });
        enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayLinesCount)
          .onGet(async () => {
            const value = this.qRelaysLinesCount[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s lines: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        if (this.qRelaysLinesCount[i] > 0) {
          enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayLine1Connected)
            .onGet(async () => {
              const value = this.qRelaysLine1Connected[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, qrelay: %s line 1: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Closed' : 'Open');
              }
              return value;
            });
        }
        if (this.qRelaysLinesCount[i] >= 2) {
          enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayLine2Connected)
            .onGet(async () => {
              const value = this.qRelaysLine2Connected[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, qrelay: %s line 2: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Closed' : 'Open');
              }
              return value;
            });
        }
        if (this.qRelaysLinesCount[i] >= 3) {
          enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayLine3Connected)
            .onGet(async () => {
              const value = this.qRelaysLine3Connected[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, qrelay: %s line 3: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Closed' : 'Open');
              }
              return value;
            });
        }
        enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayProducing)
          .onGet(async () => {
            const value = this.qRelaysProducing[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s producing: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayCommunicating)
          .onGet(async () => {
            const value = this.qRelaysCommunicating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s communicating: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayProvisioned)
          .onGet(async () => {
            const value = this.qRelaysProvisioned[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s provisioned: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayOperating)
          .onGet(async () => {
            const value = this.qRelaysOperating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s operating: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayCommLevel)
          .onGet(async () => {
            const value = (this.checkCommLevel && this.qRelaysCommLevel[i] !== undefined) ? this.qRelaysCommLevel[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s comm. level: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayStatus)
          .onGet(async () => {
            const value = this.qRelaysStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s status: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayFirmware)
          .onGet(async () => {
            const value = this.qRelaysFirmware[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s firmware: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        enphaseServiceQrelay.getCharacteristic(Characteristic.enphaseQrelayLastReportDate)
          .onGet(async () => {
            const value = this.qRelaysLastReportDate[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s last report: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        this.qRelaysService.push(enphaseServiceQrelay);
        accessory.addService(this.qRelaysService[i]);
      }
    }

    //meters
    if (envoySupportMeters) {
      this.metersService = new Array();
      for (let i = 0; i < metersCount; i++) {
        const enphaseServiceMeter = new Service.enphaseMeter('Meter ' + this.metersMeasurementType[i], 'enphaseServiceMeter' + i);
        enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterState)
          .onGet(async () => {
            const value = this.metersState[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s state: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterPhaseMode)
          .onGet(async () => {
            const value = this.metersPhaseMode[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s phase mode: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterPhaseCount)
          .onGet(async () => {
            const value = this.metersPhaseCount[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s phase count: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterMeteringStatus)
          .onGet(async () => {
            const value = this.metersMeteringStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s metering status: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterStatusFlags)
          .onGet(async () => {
            const value = this.metersStatusFlags[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s status flag: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterActivePower)
          .onGet(async () => {
            const value = this.activePowerSumm[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, meter: %s active power: %s kW', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterApparentPower)
          .onGet(async () => {
            const value = this.apparentPowerSumm[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, meter: %s apparent power: %s kVA', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterReactivePower)
          .onGet(async () => {
            const value = this.reactivePowerSumm[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, meter: %s reactive power: %s kVAr', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterPwrFactor)
          .onGet(async () => {
            const value = this.pwrFactorSumm[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, meter: %s power factor: %s cos φ', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterVoltage)
          .onGet(async () => {
            const value = this.voltageSumm[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, meter: %s voltage: %s V', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterCurrent)
          .onGet(async () => {
            const value = this.currentSumm[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, meter: %s current: %s A', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterFreq)
          .onGet(async () => {
            const value = this.freqSumm[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, meter: %s frequency: %s Hz', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseServiceMeter.getCharacteristic(Characteristic.enphaseMeterReadingTime)
          .onGet(async () => {
            const value = this.timestampSumm[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, meter: %s last report: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        this.metersService.push(enphaseServiceMeter);
        accessory.addService(this.metersService[i]);
      }
    }

    //power and energy production
    this.productionsService = new Array();
    const enphaseServiceProduction = new Service.enphasePowerEnergyMeter(this.productionMeasurmentType, 'enphaseServiceProduction');
    enphaseServiceProduction.getCharacteristic(Characteristic.enphasePower)
      .onGet(async () => {
        const value = this.productionPower;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production power: %s kW', this.host, accessoryName, value);
        }
        return value;
      });
    enphaseServiceProduction.getCharacteristic(Characteristic.enphasePowerMax)
      .onGet(async () => {
        const value = this.productionPowerMax;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production power max: %s kW', this.host, accessoryName, value);
        }
        return value;
      });
    enphaseServiceProduction.getCharacteristic(Characteristic.enphasePowerMaxDetected)
      .onGet(async () => {
        const value = this.productionPowerMaxDetectedState;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production power max detected: %s', this.host, accessoryName, value ? 'Yes' : 'No');
        }
        return value;
      });
    enphaseServiceProduction.getCharacteristic(Characteristic.enphaseEnergyToday)
      .onGet(async () => {
        const value = this.productionEnergyToday;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production energy today: %s kWh', this.host, accessoryName, value);
        }
        return value;
      });
    enphaseServiceProduction.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
      .onGet(async () => {
        const value = this.productionEnergyLastSevenDays;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production energy last seven days: %s kWh', this.host, accessoryName, value);
        }
        return value;
      });
    enphaseServiceProduction.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
      .onGet(async () => {
        const value = this.productionEnergyLifeTime;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production energy lifetime: %s kWh', this.host, accessoryName, value);
        }
        return value;
      });
    enphaseServiceProduction.getCharacteristic(Characteristic.enphaseRmsCurrent)
      .onGet(async () => {
        const value = (envoySupportMeters && meterProductionEnabled) ? this.productionRmsCurrent : 0;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production current: %s A', this.host, accessoryName, value);
        }
        return value;
      });
    enphaseServiceProduction.getCharacteristic(Characteristic.enphaseRmsVoltage)
      .onGet(async () => {
        const value = (envoySupportMeters && meterProductionEnabled) ? this.productionRmsVoltage : 0;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production voltage: %s V', this.host, accessoryName, value);
        }
        return value;
      });
    enphaseServiceProduction.getCharacteristic(Characteristic.enphaseReactivePower)
      .onGet(async () => {
        const value = (envoySupportMeters && meterProductionEnabled) ? this.productionReactivePower : 0;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production net reactive power: %s kVAr', this.host, accessoryName, value);
        }
        return value;
      });
    enphaseServiceProduction.getCharacteristic(Characteristic.enphaseApparentPower)
      .onGet(async () => {
        const value = (envoySupportMeters && meterProductionEnabled) ? this.productionApparentPower : 0;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production net apparent power: %s kVA', this.host, accessoryName, value);
        }
        return value;
      });
    enphaseServiceProduction.getCharacteristic(Characteristic.enphasePwrFactor)
      .onGet(async () => {
        const value = (envoySupportMeters && meterProductionEnabled) ? this.productionPwrFactor : 0;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production power factor: %s cos φ', this.host, accessoryName, value);
        }
        return value;
      });
    enphaseServiceProduction.getCharacteristic(Characteristic.enphaseReadingTime)
      .onGet(async () => {
        const value = this.productionReadingTime;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production last report: %s', this.host, accessoryName, value);
        }
        return value;
      });
    this.productionsService.push(enphaseServiceProduction);
    accessory.addService(this.productionsService[0]);

    //power and energy consumption
    if (envoySupportMeters && meterConsumptionEnabled) {
      this.consumptionsService = new Array();
      for (let i = 0; i < metersConsumpionCount; i++) {
        const enphaseServiceConsumption = new Service.enphasePowerEnergyMeter(this.consumptionMeasurmentType[i], 'enphaseServiceConsumption' + i);
        enphaseServiceConsumption.getCharacteristic(Characteristic.enphasePower)
          .onGet(async () => {
            const value = this.consumptionPower[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, %s power: %s kW', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseServiceConsumption.getCharacteristic(Characteristic.enphasePowerMax)
          .onGet(async () => {
            const value = this.consumptionPowerMax[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, %s power max: %s kW', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseServiceConsumption.getCharacteristic(Characteristic.enphasePowerMaxDetected)
          .onGet(async () => {
            const value = this.consumptionPowerMaxDetectedState[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, %s power max detected: %s', this.host, accessoryName, this.consumptionMeasurmentType[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseServiceConsumption.getCharacteristic(Characteristic.enphaseEnergyToday)
          .onGet(async () => {
            const value = this.consumptionEnergyToday[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, %s energy today: %s kWh', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseServiceConsumption.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
          .onGet(async () => {
            const value = this.consumptionEnergyLastSevenDays[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, %s energy last seven days: %s kWh', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseServiceConsumption.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
          .onGet(async () => {
            const value = this.consumptionEnergyLifeTime[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, %s total energy lifetime: %s kWh', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseServiceConsumption.getCharacteristic(Characteristic.enphaseRmsCurrent)
          .onGet(async () => {
            const value = this.consumptionRmsCurrent[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, %s total current: %s A', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseServiceConsumption.getCharacteristic(Characteristic.enphaseRmsVoltage)
          .onGet(async () => {
            const value = this.consumptionRmsVoltage[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, %s total voltage: %s V', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseServiceConsumption.getCharacteristic(Characteristic.enphaseReactivePower)
          .onGet(async () => {
            const value = this.consumptionReactivePower[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, %s total reactive power: %s kVAr', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseServiceConsumption.getCharacteristic(Characteristic.enphaseApparentPower)
          .onGet(async () => {
            const value = this.consumptionApparentPower[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, %s total apparent power: %s kVA', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseServiceConsumption.getCharacteristic(Characteristic.enphasePwrFactor)
          .onGet(async () => {
            const value = this.consumptionPwrFactor[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, %s total power factor: %s cos φ', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseServiceConsumption.getCharacteristic(Characteristic.enphaseReadingTime)
          .onGet(async () => {
            const value = this.consumptionReadingTime[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, %s total last report: %s', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        this.consumptionsService.push(enphaseServiceConsumption);
        accessory.addService(this.consumptionsService[i]);
      }
    }

    //encharge storage power and energy summary
    if (enchargesCount > 0 && enchargesActiveCount > 0) {
      this.enchargesServicePower = new Array();
      const enphaseServiceEnchargePowerAndEnergy = new Service.enphaseEnchargePowerAndEnergy('Encharges summary', 'enphaseServiceEnchargePowerAndEnergy');
      enphaseServiceEnchargePowerAndEnergy.getCharacteristic(Characteristic.enphaseEnchargePower)
        .onGet(async () => {
          const value = this.enchargesSummaryPower;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, power encharge storage: %s kW', this.host, accessoryName, value);
          }
          return value;
        });
      enphaseServiceEnchargePowerAndEnergy.getCharacteristic(Characteristic.enphaseEnchargeEnergy)
        .onGet(async () => {
          const value = this.enchargesSummaryEnergy;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, energy encharge storage: %s kWh', this.host, accessoryName, value);
          }
          return value;
        });
      enphaseServiceEnchargePowerAndEnergy.getCharacteristic(Characteristic.enphaseEnchargePercentFull)
        .onGet(async () => {
          const value = this.enchargesSummaryPercentFull;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, encharge percent full: %s', this.host, accessoryName, value);
          }
          return value;
        });
      enphaseServiceEnchargePowerAndEnergy.getCharacteristic(Characteristic.enphaseEnchargeActiveCount)
        .onGet(async () => {
          const value = this.enchargesSummaryActiveCount;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, encharge devices count: %s', this.host, accessoryName, value);
          }
          return value;
        });
      enphaseServiceEnchargePowerAndEnergy.getCharacteristic(Characteristic.enphaseEnchargeState)
        .onGet(async () => {
          const value = this.enchargesSummaryState;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, encharge state: %s', this.host, accessoryName, value);
          }
          return value;
        });
      enphaseServiceEnchargePowerAndEnergy.getCharacteristic(Characteristic.enphaseEnchargeReadingTime)
        .onGet(async () => {
          const value = this.enchargesSummaryReadingTime;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, encharge: %s last report: %s', this.host, accessoryName, value);
          }
          return value;
        });
      this.enchargesServicePower.push(enphaseServiceEnchargePowerAndEnergy);
      accessory.addService(this.enchargesServicePower[0]);

      //encharge storage state
      this.enchargesService = new Array();
      for (let i = 0; i < enchargesActiveCount; i++) {
        const enphaseServiceEncharge = new Service.enphaseEncharge('Encharge ', + this.enchargesSerialNumber[i], 'enphaseServiceEncharge' + i);
        enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeChargeStatus)
          .onGet(async () => {
            const value = this.enchargesChargeStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s charge status %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeProducing)
          .onGet(async () => {
            const value = this.enchargesProducing[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s producing: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeCommunicating)
          .onGet(async () => {
            const value = this.enchargesCommunicating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s communicating: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeProvisioned)
          .onGet(async () => {
            const value = this.enchargesProvisioned[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s provisioned: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeOperating)
          .onGet(async () => {
            const value = this.enchargesOperating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s operating: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeCommLevel)
          .onGet(async () => {
            const value = (this.checkCommLevel && this.enchargesCommLevel[i] !== undefined) ? this.enchargesCommLevel[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s comm. level: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeSleepEnabled)
          .onGet(async () => {
            const value = this.enchargesSleepEnabled[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s sleep: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargePercentFull)
          .onGet(async () => {
            const value = this.enchargesPercentFull[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s percent full: %s %', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeMaxCellTemp)
          .onGet(async () => {
            const value = this.enchargesMaxCellTemp[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s max cell temp: %s °C', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeSleepMinSoc)
          .onGet(async () => {
            const value = this.enchargesSleepMinSoc[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s sleep min soc: %s min', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeSleepMaxSoc)
          .onGet(async () => {
            const value = this.enchargesSleepMaxSoc[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s sleep max soc: %s min', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeStatus)
          .onGet(async () => {
            const value = this.enchargesStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s status: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeFirmware)
          .onGet(async () => {
            const value = this.enchargesFirmware[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s firmware: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        enphaseServiceEncharge.getCharacteristic(Characteristic.enphaseEnchargeLastReportDate)
          .onGet(async () => {
            const value = this.enchargesLastReportDate[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, encharge: %s last report: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
            }
            return value;
          });
        this.enchargesService.push(enphaseServiceEncharge);
        accessory.addService(this.enchargesService[i]);
      }
    }

    //microinverter
    if (microinvertersCount > 0 && microinvertersActiveCount > 0) {
      this.microinvertersService = new Array();
      for (let i = 0; i < microinvertersCount; i++) {
        const enphaseServiceMicronverter = new Service.enphaseMicroinverter('Microinverter ' + this.microinvertersSerialNumber[i], 'enphaseServiceMicronverter' + i);
        enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterPower)
          .onGet(async () => {
            let value = (this.checkMicroinvertersPower) ? this.microinvertersLastPower[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s last power: %s W', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
            return value;
          });
        enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterPowerMax)
          .onGet(async () => {
            const value = (this.checkMicroinvertersPower) ? this.microinvertersMaxPower[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s max power: %s W', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
            return value;
          });
        enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterProducing)
          .onGet(async () => {
            const value = this.microinvertersProducing[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s producing: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterCommunicating)
          .onGet(async () => {
            const value = this.microinvertersCommunicating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s communicating: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterProvisioned)
          .onGet(async () => {
            const value = this.microinvertersProvisioned[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s provisioned: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterOperating)
          .onGet(async () => {
            const value = this.microinvertersOperating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s operating: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterCommLevel)
          .onGet(async () => {
            const value = (this.checkCommLevel && this.microinvertersCommLevel[i] !== undefined) ? this.microinvertersCommLevel[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s comm. level: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
            return value;
          });
        enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterStatus)
          .onGet(async () => {
            const value = this.microinvertersStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s status: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
            return value;
          });
        enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterFirmware)
          .onGet(async () => {
            const value = this.microinvertersFirmware[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s firmware: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
            return value;
          });
        enphaseServiceMicronverter.getCharacteristic(Characteristic.enphaseMicroinverterLastReportDate)
          .onGet(async () => {
            const value = (this.checkMicroinvertersPower) ? this.microinvertersReadingTime[i] : '0';
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s last report: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
            return value;
          });
        this.microinvertersService.push(enphaseServiceMicronverter);
        accessory.addService(this.microinvertersService[i]);
      }
    }

    this.startPrepareAccessory = false;
    this.log.debug('Device: %s, publishExternalAccessories: %s.', this.host, accessoryName);
    this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
  }
}
