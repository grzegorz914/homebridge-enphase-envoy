'use strict';

const path = require('path');
const axios = require('axios');
const axiosDigestAuth = require('./src/digestAuth.js');
const fs = require('fs');
const fsPromises = fs.promises;
const parseStringPromise = require('xml2js').parseStringPromise;

const PLUGIN_NAME = 'homebridge-enphase-envoy';
const PLATFORM_NAME = 'enphaseEnvoy';

const ENVOY_USER = 'envoy';
const INSTALLER_USER = 'installer';

const ENPHASE_PART_NUMBER = {
  //IQ combiner
  '800-00551-r03': 'X-IQ-AM1-120-B-M',
  '800-00553-r03': 'X-IQ-AM1-240-B',
  '800-00557-r03': 'X-IQ-AM1-240-BM',
  '800-00554-r04': 'X-IQ-AM1-240-2',
  '800-00554-r05': 'X-IQ-AM1-240-2-M',
  '800-00555-r03': 'X-IQ-AM1-240-3',
  '800-00655-r09': 'X-IQ-AM1-240-3-ES',
  '800-00556-r03': 'X-IQ-AM1-240-3C',
  '800-00554-r07': 'X-IQ-AM1-240-3C-ES',
  //Envoys
  '880-00122-r02': 'ENV-S-AB-120-A',
  '880-00210-r02': 'ENV-S-AM1-120',
  '800-00552-r01': 'ENV-S-WM-230',
  '800-00553-r01': 'ENV-S-WB-230',
  '800-00554-r03': 'ENV-S-WM-230',
  '800-00654-r06': 'ENV-S-WM-230',
  '800-00553-r02': 'ENV-S-WB-230-F',
  '880-00208-r02': 'ENV-IQ-AM1-240',
  '880-00208-r03': 'ENV-IQ-AM1-240',
  '880-00231-r02': 'ENV-IQ-AM1-240',
  '880-00209-r03': 'ENV-IQ-AM3-3P',
  '880-00557-r02': 'ENV-IQ-AM3-3P',
  //qRelays
  '860-00152-r02': 'Q-RELAY-1P-INT',
  '800-00597-r02': 'Q-RELAY-3P-INT',
  //Microinverters
  '800-00630-r02': 'IQ7-60-2-INT',
  '800-00637-r02': 'IQ7-60-2-US',
  '800-00641-r02': 'IQ7-60-B-US',
  '800-00633-r02': 'IQ7A-72-2-INT',
  '800-00634-r02': 'IQ7A-72-2-US',
  '800-00638-r02': 'IQ7A-72-B-US',
  '800-00632-r02': 'IQ7X-96-2-INT',
  '800-00635-r02': 'IQ7X-96-2-US',
  '800-00639-r02': 'IQ7X-96-B-US',
  '800-00631-r02': 'IQ7PLUS-72-2-INT',
  '800-00636-r02': 'IQ7PLUS-72-2-US',
  '800-00640-r02': 'IQ7PLUS-72-B-US',
  '883-00852-r09': 'IQ7PLUS-72-2-US',
  //CT
  '121943068536EIM1': 'CT-100-SPLIT-P',
  '121943068536EIM2': 'CT-100-SPLIT-C',
  '121943068537EIM1': 'CT-200-SPLIT-P',
  '121943068537EIM2': 'CT-200-SPLIT-C',
  //AC Bateries
  'xxx-xxxx-xx0': 'IQ7-B1200-LN-I-INT01-RV0',
  //Enpowers
  '860-00276-r48': 'EP200G101-M240US00',
  //Encharges 3
  '830-00703-r75': 'B03-A01-US00-1-3',
  //Encharges 10
  'xxx-xxxxx-xx2': 'ENCHARGE-10-1P-NA',
  //Wirelles connection kit
  'xxx-xxxxx-xx3': 'COMMS-KIT-01'
};

const ENVOY_API_URL = {
  'BackboneApplication': '/backbone/application.js',
  'AcbSleepModeSetGetCancel': '/admin/lib/acb_config.json',
  'AgfProfileIndex': '/installer/agf/index.json?simplified=true',
  'AgfProfileDetails': '/installer/agf/details.json',
  'AgfProfileInverterStatus': '/installer/agf/inverters_status.json',
  'AgfProfileSet': '/installer/agf/set_profile.json',
  'CellularConfig': '/admin/lib/network_display.json?cellular=1',
  'ClearGFIPost': '/admin/lib/admin_dcc_display.json',
  'DhcpGetNewIp': '/admin/lib/network_display.json',
  'DiagnosticNetworkCheck': '/admin/lib/network_display.json',
  'EnsembleInventory': '/ivp/ensemble/inventory', //installer login nedded
  'EnsembleStatus': '/ivp/ensemble/status', //installer login nedded
  'EthernetConfigPutGet': '/admin/lib/network_display.json',
  'Events': '/datatab/event_dt.rb', //?locale=en&start=0&length=2&search[value]=123&search[regex]=false installer login nedded
  'Home': '/home.json',
  'Info': '/info.xml',
  'InternalMeterInfo': '/ivp/meters',
  'InternalMeterStream': '/stream/meter',
  'InternalMeterReadings': '/ivp/meters/readings',
  'InternalMeterCurrentCTSettings': '/ivp/meters/cts',
  'Inventory': '/inventory.json',
  'InventoryAll': '/inventory.json?deleted=1',
  'InverterComm': '/installer/pcu_comm_check', //installer login nedded
  'InverterProduction': '/api/v1/production/inverters', //envoy login nedded
  'InverterProductionSumm': '/api/v1/production',
  'InverterPutDelete': '/prov',
  'NewScanPDGet': '/ivp/peb/newscan',
  'PowerForcedModePutGet': '/ivp/mod/EID/mode/power', //EID envoy ID, installer login nedded
  'PMUPostGet': '/admin/lib/admin_pmu_display.json',
  'RedeterminePhase': '/ivp/grest/local/gs/redeterminephase',
  'ReportSettingsPutGet': '/ivp/peb/reportsettings',
  'SystemReadingStats': '/production.json?details=1',
  'TimezoneSetGet': '/admin/lib/date_time_display.json', //GET, ?tzlist=1' display all time zones,
  'TariffSettingsPutGet': '/admin/lib/tariff.json',
  'TunnelStatePutGet': '/admin/lib/dba.json',
  'UpdateMeterConfig': '/ivp/meters/EID', //EID envoy ID
  'UpdateMeterCurrentCTConfig': '/ivp/meters/cts/EID', //EID envoy ID
  'UpdatePassword': '/admin/lib/security_display.json',
  'WifiSettingsJoinGet': '/admin/lib/wireless_display.json'
};

const ENVOY_API_CODE = {
  //types
  'eim': 'Current meter',
  'production': 'Production',
  'net-consumption': 'Consumption (Net)',
  'total-consumption': 'Consumption (Total)',
  'inverters': 'Microinverters',
  'acb': 'AC Batterie',
  'encharge': 'Encharge',
  'enpower': 'Enpower',
  'PCU': 'Microinverter',
  'ACB': 'AC Batterie',
  'ENCHARGE': 'Encharge',
  'ENPOWER': 'Enpower',
  'NSRB': 'Q-Relay',
  //enpower
  'multimode-ongrid': 'Multimode Grid ON',
  'multimode-offgrid': 'Multimode Grid OFF',
  'ENPWR_STATE_OPER_CLOSED': 'Enpower state closed',
  'ENPWR_STATE_OPER_OPEN': 'Enpower state open',
  'ENPWR_STATE_OPER_NO_GRID': 'Enpower state no grid',
  //encharge
  'ready': 'Ready',
  'idle': 'Idle',
  'full': 'Full',
  'charging': 'Charging',
  'discharging': 'Discharging',
  'ENCHG_STATE_READY': 'Encharge state ready',
  'ENCHG_STATE_IDLE': 'Encharge state idle',
  'ENCHG_STATE_CHARGING': 'Encharge state charging',
  'ENCHG_STATE_DISCHARGING': 'Encharge state discharging',
  //qrelay
  'enabled': 'Enabled',
  'disabled': 'Disabled',
  'one': 'One',
  'two': 'Two',
  'single': 'Single',
  'split': 'Split',
  'three': 'Three',
  'normal': 'Normal',
  'closed': 'Closed',
  'open': 'Open',
  'error.nodata': 'No Data',
  //envoy
  'ethernet': 'Ethernet',
  'eth0': 'Ethernet',
  'wifi': 'WiFi',
  'wlan0': 'WiFi',
  'cellurar': 'Cellurar',
  'zigbee': 'ZigBee',
  'subghz': 'Sub GHz',
  'connected': 'Connected',
  'disconnected': 'Disconnected',
  'single_rate': 'Single rate',
  'time_to_use': 'Time to use',
  'time_of_use': 'Time of use',
  'tiered': 'Tiered',
  'not_set': 'Not set',
  'flat': 'Flat',
  'none': 'None',
  'satisfied': 'Satisfied',
  'not-satisfied': 'Not satisfied',
  //status code
  'prop.done': 'Prop done',
  'envoy.global.ok': 'Normal',
  'envoy.cond_flags.acb_ctrl.bmudatabounds': 'BMU Data Bounds Error',
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
  'envoy.cond_flags.nsrb_ctrl.acfreqhigh': 'AC Frequency High',
  'envoy.cond_flags.nsrb_ctrl.acfreqlow': 'AC Frequency Low',
  'envoy.cond_flags.nsrb_ctrl.acfrequencyoor': 'AC Frequency Out Of Range',
  'envoy.cond_flags.nsrb_ctrl.acvoltageavgline1': 'AC Voltage Avg Out Of Range - Phase 1',
  'envoy.cond_flags.nsrb_ctrl.acvoltageavgline2': 'AC Voltage Avg Out Of Range - Phase 2',
  'envoy.cond_flags.nsrb_ctrl.acvoltageavgline3': 'AC Voltage Avg Out Of Range - Phase 3',
  'envoy.cond_flags.nsrb_ctrl.acvoltagehighline1': 'AC Voltage High - Phase 1',
  'envoy.cond_flags.nsrb_ctrl.acvoltagehighline2': 'AC Voltage Out Of Range - Phase 2',
  'envoy.cond_flags.nsrb_ctrl.acvoltagehighline3': 'AC Voltage High - Phase 3',
  'envoy.cond_flags.nsrb_ctrl.acvoltagelowline1': 'AC Voltage Low - Phase 1',
  'envoy.cond_flags.nsrb_ctrl.acvoltagelowline2': 'AC Voltage Out Of Range - Phase 2',
  'envoy.cond_flags.nsrb_ctrl.acvoltagelowline3': 'AC Voltage Low - Phase 3',
  'envoy.cond_flags.nsrb_ctrl.acvoltageoorline1': 'AC Voltage Out Of Range - Phase 1',
  'envoy.cond_flags.nsrb_ctrl.acvoltageoorline2': 'AC Voltage Out Of Range - Phase 2',
  'envoy.cond_flags.nsrb_ctrl.acvoltageoorline3': 'AC Voltage Out Of Range - Phase 3',
  'envoy.cond_flags.nsrb_ctrl.buttonpress': 'Button Pressed',
  'envoy.cond_flags.nsrb_ctrl.dcgriderror': 'DC Grid Current Error',
  'envoy.cond_flags.nsrb_ctrl.dcgridhigh': 'DC Grid Current High',
  'envoy.cond_flags.nsrb_ctrl.dcgridlow': 'DC Grid Current Low',
  'envoy.cond_flags.nsrb_ctrl.relayforced': 'Relay Forced',
  'envoy.cond_flags.nsrb_ctrl.relayopen': 'Relay Open',
  'envoy.cond_flags.nsrb_ctrl.rocof': 'Rate of Change of Frequency Error',
  'envoy.cond_flags.obs_strs.discovering': 'Discovering',
  'envoy.cond_flags.obs_strs.failure': 'Failure to report',
  'envoy.cond_flags.obs_strs.flasherror': 'Flash Error',
  'envoy.cond_flags.obs_strs.notmonitored': 'Not Monitored',
  'envoy.cond_flags.obs_strs.ok': 'Normal',
  'envoy.cond_flags.obs_strs.plmerror': 'PLM Error',
  'envoy.cond_flags.obs_strs.secmodeenterfailure': 'Secure mode enter failure',
  'envoy.cond_flags.obs_strs.secmodeexitfailure': 'Secure mode exit failure',
  'envoy.cond_flags.obs_strs.sleeping': 'Sleep Mode On',
  'envoy.cond_flags.obs_strs.verifing': 'Verifying Device',
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
  'envoy.cond_flags.pcu_ctrl.lertactive': 'Alert Active',
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
  'envoy.cond_flags.pcu_ctrl.sleep-mode': 'Sleep Mode On',
  'envoy.cond_flags.pcu_ctrl.tpmtest': 'Transient Grid Profile',
  'envoy.cond_flags.pcu_ctrl.unexpectedreset': 'Unexpected Reset',
  'envoy.cond_flags.pcu_ctrl.watchdogreset': 'Watchdog Reset',
  'envoy.cond_flags.rgm_chan.check_meter': 'Meter Error',
  'envoy.cond_flags.rgm_chan.power_quality': 'Poor Power Quality'
}

const ENCHARGE_LED_STATUS = {
  0: '0',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: '11',
  12: '12',
  13: '13',
  14: '14',
  15: '15',
  16: '16',
  17: '17',
  18: '18',
  19: '19',
  20: '20'
};

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
    constructor(displayName, subtype, ) {
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
    constructor(displayName, subtype, ) {
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
    constructor(displayName, subtype, ) {
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
      super('Power max', '00000072-000B-1000-8000-0026BB765291');
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
      super('Power max detected', '00000073-000B-1000-8000-0026BB765291');
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

  //power production service
  class enphasePowerAndEnergyService extends Service {
    constructor(displayName, subtype, ) {
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
    constructor(displayName, subtype, ) {
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
    constructor(displayName, subtype, ) {
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
      super('Power max', '00000132-000B-1000-8000-0026BB765291');
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
    constructor(displayName, subtype, ) {
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
    constructor(displayName, subtype, ) {
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
    constructor(displayName, subtype, ) {
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
    constructor(displayName, subtype, ) {
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
    constructor(displayName, subtype, ) {
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
      log('No configuration found for %s', PLUGIN_NAME);
      return;
    }
    this.log = log;
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

    //device configuration
    this.name = config.name || 'Envoy';
    this.host = config.host || 'envoy.local';
    this.refreshInterval = config.refreshInterval || 5;
    this.disableLogInfo = config.disableLogInfo || false;
    this.envoyPasswd = config.envoyPasswd;
    this.installerPasswd = config.installerPasswd;
    this.productionPowerMaxDetected = config.powerProductionMaxDetected || 0;
    this.productionEnergyLifetimeOffset = config.energyProductionLifetimeOffset || 0;
    this.consumptionTotalPowerMaxDetected = config.powerConsumptionTotalMaxDetected || 0;
    this.consumptionTotalEnergyLifetimeOffset = config.energyConsumptionTotalLifetimeOffset || 0;
    this.consumptionNetPowerMaxDetected = config.powerConsumptionNetMaxDetected || 0;
    this.consumptionNetEnergyLifetimeOffset = config.energyConsumptionNetLifetimeOffset || 0;

    //setup variables
    this.checkDeviceInfo = true;
    this.checkDeviceState = false;
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
    this.envoyFirmwareSupported = false;

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
    this.enpowerCount = 0;
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

    this.prefDir = path.join(api.user.storagePath(), 'enphaseEnvoy');
    this.productionPowerMaxFile = `${this.prefDir}/productionPowerMax_${this.host.split('.').join('')}`;
    this.consumptionPowerMaxFile = `${this.prefDir}/consumptionPowerMax_${this.host.split('.').join('')}`;
    this.consumptionPowerMaxFile1 = `${this.prefDir}/consumptionPowerMax1_${this.host.split('.').join('')}`;
    this.url = `http://${this.host}`;

    //create axios instanse
    this.axiosInstance = axios.create({
      method: 'GET',
      baseURL: this.url
    });

    //digest auth installer
    const auth = {
      user: INSTALLER_USER,
      passwd: this.installerPasswd
    };
    this.digestAuth = new axiosDigestAuth(auth);


    //Check data
    setInterval(function () {
      if (this.checkDeviceInfo) {
        this.prepareDirectoryAndFiles();
      } else {
        this.updateHomeData();
      }
    }.bind(this), this.refreshInterval * 1000);

    //Check microinverters data
    setInterval(function () {
      const updateData = (this.checkDeviceState && this.envoyPasswd) ? this.updateMicroinvertersData() : false;
    }.bind(this), 60000);

    //Check meters reading data
    setInterval(function () {
      if (!this.checkDeviceInfo) {
        const updateData = (this.checkDeviceState && this.envoySupportMeters) ? this.updateMetersReadingData() : false;
      }
    }.bind(this), 2000);

    this.prepareDirectoryAndFiles();
  }

  async prepareDirectoryAndFiles() {
    this.log.debug('Device: %s %s, prepare directory and files.', this.host, this.name);

    try {
      //check if the directory exists, if not then create it
      if (!fs.existsSync(this.prefDir)) {
        await fsPromises.mkdir(this.prefDir);
      }
      if (!fs.existsSync(this.productionPowerMaxFile)) {
        await fsPromises.writeFile(this.productionPowerMaxFile, '0.0');
      }
      if (!fs.existsSync(this.consumptionPowerMaxFile)) {
        await fsPromises.writeFile(this.consumptionPowerMaxFile, '0.0');
      }
      if (!fs.existsSync(this.consumptionPowerMaxFile1)) {
        await fsPromises.writeFile(this.consumptionPowerMaxFile1, '0.0');
      }

      this.updateEnvoyBackboneAppData();
    } catch (error) {
      this.log.error('Device: %s %s, prepare directory and files error: %s', this.host, this.name, error);
      this.checkDeviceInfo = true;
    };
  };

  async updateEnvoyBackboneAppData() {
    this.log.debug('Device: %s %s, requesting envoyBackboneAppData.', this.host, this.name);

    try {
      const envoyBackboneAppData = await this.axiosInstance(ENVOY_API_URL.BackboneApplication);
      this.log.debug('Device %s %s, debug envoyBackboneAppData: %s', this.host, this.name, envoyBackboneAppData.data);
      const data = envoyBackboneAppData.data;
      const envoyDevId = data.substr(data.indexOf('envoyDevId:') + 11, 9);

      this.envoyDevId = envoyDevId;
      this.updateInfoData();
    } catch (error) {
      this.log.error('Device: %s %s, requesting envoyBackboneAppData error: %s', this.host, this.name, error);
      this.checkDeviceInfo = true;
    };
  }

  async updateInfoData() {
    this.log.debug('Device: %s %s, requesting infoData.', this.host, this.name);

    try {
      const infoData = await this.axiosInstance(ENVOY_API_URL.Info);
      this.log.debug('Device %s %s, debug infoData: %s', this.host, this.name, infoData.data);

      if (infoData.status == 200) {
        const parseInfoData = await parseStringPromise(infoData.data);
        this.log.debug('Device: %s %s, parse info.xml successful: %s', this.host, this.name, JSON.stringify(parseInfoData, null, 2));

        //envoy info
        const time = new Date(parseInfoData.envoy_info.time[0] * 1000).toLocaleString();

        //device
        const deviceSn = parseInfoData.envoy_info.device[0].sn[0];
        const devicePn = ENPHASE_PART_NUMBER[parseInfoData.envoy_info.device[0].pn[0]] || 'Envoy'
        const deviceSoftware = parseInfoData.envoy_info.device[0].software[0];
        const deviceEuaid = parseInfoData.envoy_info.device[0].euaid[0];
        const deviceSeqNum = parseInfoData.envoy_info.device[0].seqnum[0];
        const deviceApiVer = parseInfoData.envoy_info.device[0].apiver[0];
        const deviceImeter = (parseInfoData.envoy_info.device[0].imeter[0] == 'true');

        //packages
        const packagesCount = parseInfoData.envoy_info.package.length;
        for (let i = 0; i < packagesCount; i++) {
          const packageName = parseInfoData.envoy_info.package[i].$.name;
          const packagePn = parseInfoData.envoy_info.package[i].pn[0];
          const packageVersion = parseInfoData.envoy_info.package[i].version[0];
          const packageBuild = parseInfoData.envoy_info.package[i].build[0];
        }

        //build info
        const buildId = parseInfoData.envoy_info.build_info[0].build_id[0];
        const buildTimeQmt = new Date(parseInfoData.envoy_info.build_info[0].build_time_gmt[0] * 1000).toLocaleString();

        //check firmware version
        const envoyFirmwareSupported = (deviceSoftware.substr(1, 1) <= 6);

        //envoy
        this.envoyTime = time;
        this.envoySerialNumber = deviceSn;
        this.envoyModelName = devicePn;
        this.envoyFirmware = deviceSoftware;
        this.envoySupportMeters = deviceImeter;
        this.envoyFirmwareSupported = envoyFirmwareSupported;
        this.envoyPasswd = this.envoyPasswd || deviceSn.substring(6);

        this.updateHomeData();
      }
    } catch (error) {
      if (error.code == 'DEPTH_ZERO_SELF_SIGNED_CERT') {
        this.log('Device: %s %s, probably Envoy uses new firmware 07.x.xx, this firmware contain new authentication method and is not supported right now', this.host, this.name)
      } else {
        this.log.error('Device: %s %s, requesting infoData error: %s', this.host, this.name, error);
      }
      this.checkDeviceInfo = true;
    };
  }

  async updateHomeData() {
    this.log.debug('Device: %s %s, requesting homeData.', this.host, this.name);

    try {
      const homeData = await this.axiosInstance(ENVOY_API_URL.Home);
      this.log.debug('Device %s %s, debug homeData: %s', this.host, this.name, homeData.data);

      if (homeData.status == 200) {
        const objKeys = Object.keys(homeData.data);
        const objKeys1 = Object.keys(homeData.data.comm);
        const enpowerInstalled = (objKeys.indexOf('enpower') >= 0);
        const enchargesInstalled = (objKeys1.indexOf('encharge') >= 0);
        const wirelessConnectionKitInstalled = (objKeys.indexOf('wireless_connection') >= 0);
        const wirelessConnectionKitConnectionsCount = wirelessConnectionKitInstalled ? homeData.data.wireless_connection.length : 0;
        const ensembleInstalled = (enpowerInstalled || enchargesInstalled);
        const envoyNetworkInterfacesCount = homeData.data.network.interfaces.length;

        //envoy
        const softwareBuildEpoch = new Date(homeData.data.software_build_epoch * 1000).toLocaleString();
        const isEnvoy = (homeData.data.is_nonvoy == false);
        const dbSize = homeData.data.db_size;
        const dbPercentFull = homeData.data.db_percent_full;
        const timeZone = homeData.data.timezone;
        const currentDate = new Date(homeData.data.current_date).toLocaleString().slice(0, 11);
        const currentTime = homeData.data.current_time;
        const webComm = (homeData.data.network.web_comm == true);
        const everReportedToEnlighten = (homeData.data.network.ever_reported_to_enlighten == true);
        const lastEnlightenReporDate = new Date(homeData.data.network.last_enlighten_report_time * 1000).toLocaleString();
        const primaryInterface = ENVOY_API_CODE[homeData.data.network.primary_interface] || 'undefined';
        if (envoyNetworkInterfacesCount > 0) {
          for (let i = 0; i < envoyNetworkInterfacesCount; i++) {
            const objValues = Object.values(homeData.data.network.interfaces[i]);
            const envoyInterfaceCellular = (objValues.indexOf('cellular') >= 0);
            const envoyInterfaceLan = (objValues.indexOf('ethernet') >= 0);
            const envoyInterfaceWlan = (objValues.indexOf('wifi') >= 0);
            const envoyInterfaceStartIndex = envoyInterfaceCellular ? 1 : 0;

            if (envoyInterfaceCellular) {
              const envoyInterfaceSignalStrength = (homeData.data.network.interfaces[0].signal_strength * 20);
              const envoyInterfaceSignalStrengthMax = (homeData.data.network.interfaces[0].signal_strength_max * 20);
              const envoyInterfaceNetwork = homeData.data.network.interfaces[0].network;
              const envoyInterfaceType = ENVOY_API_CODE[homeData.data.network.interfaces[0].type] || 'undefined';
              const envoyInterfaceInterface = homeData.data.network.interfaces[0].interface;
              const envoyInterfaceDhcp = homeData.data.network.interfaces[0].dhcp;
              const envoyInterfaceIp = homeData.data.network.interfaces[0].ip;
              const envoyInterfaceCarrier = homeData.data.network.interfaces[0].carrier;
            }
            if (envoyInterfaceLan) {
              const envoyInterfaceType = ENVOY_API_CODE[homeData.data.network.interfaces[envoyInterfaceStartIndex].type] || 'undefined';
              const envoyInterfaceInterface = homeData.data.network.interfaces[envoyInterfaceStartIndex].interface;
              const envoyInterfaceMac = homeData.data.network.interfaces[envoyInterfaceStartIndex].mac;
              const envoyInterfaceDhcp = homeData.data.network.interfaces[envoyInterfaceStartIndex].dhcp;
              const envoyInterfaceIp = homeData.data.network.interfaces[envoyInterfaceStartIndex].ip;
              const envoyInterfaceSignalStrength = (homeData.data.network.interfaces[envoyInterfaceStartIndex].signal_strength * 20);
              const envoyInterfaceSignalStrengthMax = (homeData.data.network.interfaces[envoyInterfaceStartIndex].signal_strength_max * 20);
              const envoyInterfaceCarrier = homeData.data.network.interfaces[envoyInterfaceStartIndex].carrier;
            }
            if (envoyInterfaceWlan) {
              const envoyInterfaceSignalStrenth = (homeData.data.network.interfaces[envoyInterfaceStartIndex + 1].signal_strength * 20);
              const envoyInterfaceSignalStrengthMax = (homeData.data.network.interfaces[envoyInterfaceStartIndex + 1].signal_strength_max * 20);
              const envoyInterfaceType = ENVOY_API_CODE[homeData.data.network.interfaces[envoyInterfaceStartIndex + 1].type] || 'undefined';
              const envoyInterfaceInterface = homeData.data.network.interfaces[envoyInterfaceStartIndex + 1].interface;
              const envoyInterfaceMac = homeData.data.network.interfaces[envoyInterfaceStartIndex + 1].mac;
              const envoyInterfaceDhcp = homeData.data.network.interfaces[envoyInterfaceStartIndex + 1].dhcp;
              const envoyInterfaceIp = homeData.data.network.interfaces[envoyInterfaceStartIndex + 1].ip;
              const envoyInterfaceCarrier = homeData.data.network.interfaces[envoyInterfaceStartIndex + 1].carrier;
              const envoyInterfaceSupported = homeData.data.network.interfaces[envoyInterfaceStartIndex + 1].supported;
              const envoyInterfacePresent = homeData.data.network.interfaces[envoyInterfaceStartIndex + 1].present;
              const envoyInterfaceConfigured = homeData.data.network.interfaces[envoyInterfaceStartIndex + 1].configured;
              const envoyInterfaceStatus = ENVOY_API_CODE[homeData.data.network.interfaces[envoyInterfaceStartIndex + 1].status] || 'undefined';
            }
            this.envoyInterfaceCellular = envoyInterfaceCellular;
            this.envoyInterfaceLan = envoyInterfaceLan;
            this.envoyInterfaceWlan = envoyInterfaceWlan;
          }
        }
        const tariff = ENVOY_API_CODE[homeData.data.tariff] || 'undefined';
        const commNum = homeData.data.comm.num;
        const commLevel = (homeData.data.comm.level * 20);
        const commPcuNum = homeData.data.comm.pcu.num;
        const commPcuLevel = (homeData.data.comm.pcu.level * 20);
        const commAcbNum = homeData.data.comm.acb.num;
        const commAcbLevel = (homeData.data.comm.acb.level * 20);
        const commNsrbNum = homeData.data.comm.nsrb.num;
        const commNsrbLevel = (homeData.data.comm.nsrb.level * 20);

        //encharge
        const commEnchgNum = enchargesInstalled ? homeData.data.comm.encharge[0].num : 0;
        const commEnchgLevel = enchargesInstalled ? (homeData.data.comm.encharge[0].level * 20) : 0;
        const commEnchgLevel24g = enchargesInstalled ? (homeData.data.comm.encharge[0].level_24g * 20) : 0;
        const commEnchagLevelSubg = enchargesInstalled ? (homeData.data.comm.encharge[0].level_subg * 20) : 0;

        const alerts = homeData.data.alerts;
        const updateStatus = ENVOY_API_CODE[homeData.data.update_status] || 'undefined';

        //wireless connection kit
        if (wirelessConnectionKitInstalled) {
          this.wirelessConnectionsSignalStrength = new Array();
          this.wirelessConnectionsSignalStrengthMax = new Array();
          this.wirelessConnectionsType = new Array();
          this.wirelessConnectionsConnected = new Array();

          for (let i = 0; i < wirelessConnectionKitConnectionsCount; i++) {
            const wirelessConnectionSignalStrength = (homeData.data.wireless_connection[i].signal_strength * 20);
            const wirelessConnectionSignalStrengthMax = (homeData.data.wireless_connection[i].signal_strength_max * 20);
            const wirelessConnectionType = ENVOY_API_CODE[homeData.data.wireless_connection[i].type] || 'undefined';
            const wirelessConnectionConnected = (homeData.data.wireless_connection[i].connected == true);

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
        const enpowerConnected = enpowerInstalled ? (homeData.data.enpower.connected == true) : false;
        const enpowerGridStatus = enpowerInstalled ? ENVOY_API_CODE[homeData.data.enpower.grid_status] || 'undefined' : '';

        //convert status
        const arrStatus = new Array();
        if (Array.isArray(alerts) && alerts.length > 0) {
          for (let j = 0; j < alerts.length; j++) {
            arrStatus.push(ENVOY_API_CODE[alerts[j]] || alerts[j]);
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

        this.updateInventoryData();
      }
    } catch (error) {
      this.log.error('Device: %s %s, homeData error: %s', this.host, this.name, error);
      this.checkDeviceInfo = true;
    };
  }


  async updateInventoryData() {
    this.log.debug('Device: %s %s, requesting inventoryData.', this.host, this.name);

    try {
      const inventoryData = await this.axiosInstance(ENVOY_API_URL.Inventory);
      this.log.debug('Device %s %s, debug inventoryData: %s', this.host, this.name, inventoryData.data);

      if (inventoryData.status == 200) {
        const microinvertersCount = inventoryData.data[0].devices.length;
        const microinvertersInstalled = (microinvertersCount > 0);
        const acBatteriesCount = inventoryData.data[1].devices.length;
        const acBatteriesInstalled = (acBatteriesCount > 0);
        const qRelaysCount = inventoryData.data[2].devices.length;
        const qRelaysInstalled = (qRelaysCount > 0);

        if (microinvertersInstalled) {
          this.microinvertersSerialNumber = new Array();
          this.microinvertersStatus = new Array();
          this.microinvertersLastReportDate = new Array();
          this.microinvertersFirmware = new Array();
          this.microinvertersProducing = new Array();
          this.microinvertersCommunicating = new Array();
          this.microinvertersProvisioned = new Array();
          this.microinvertersOperating = new Array();

          const type = ENVOY_API_CODE[inventoryData.data[0].type] || 'undefined';
          for (let i = 0; i < microinvertersCount; i++) {
            const partNum = ENPHASE_PART_NUMBER[inventoryData.data[0].devices[i].part_num] || 'Microinverter';
            const installed = new Date(inventoryData.data[0].devices[i].installed * 1000).toLocaleString();
            const serialNumber = inventoryData.data[0].devices[i].serial_num;
            const deviceStatus = inventoryData.data[0].devices[i].device_status;
            const lastReportDate = new Date(inventoryData.data[0].devices[i].last_rpt_date * 1000).toLocaleString();
            const adminState = inventoryData.data[0].devices[i].admin_state;
            const devType = inventoryData.data[0].devices[i].dev_type;
            const createdDate = new Date(inventoryData.data[0].devices[i].created_date * 1000).toLocaleString();
            const imageLoadDate = new Date(inventoryData.data[0].devices[i].img_load_date * 1000).toLocaleString();
            const firmware = inventoryData.data[0].devices[i].img_pnum_running;
            const ptpn = inventoryData.data[0].devices[i].ptpn;
            const chaneId = inventoryData.data[0].devices[i].chaneid;
            const deviceControl = inventoryData.data[0].devices[i].device_control;
            const producing = (inventoryData.data[0].devices[i].producing == true);
            const communicating = (inventoryData.data[0].devices[i].communicating == true);
            const provisioned = (inventoryData.data[0].devices[i].provisioned == true);
            const operating = (inventoryData.data[0].devices[i].operating == true);

            //convert status
            const arrStatus = new Array();
            if (Array.isArray(deviceStatus) && deviceStatus.length > 0) {
              for (let j = 0; j < deviceStatus.length; j++) {
                arrStatus.push(ENVOY_API_CODE[deviceStatus[j]] || deviceStatus[j]);
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

        //ac btteries inventoty
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

          const type = ENVOY_API_CODE[inventoryData.data[1].type] || 'undefined';
          for (let i = 0; i < acBatteriesCount; i++) {
            const partNum = ENPHASE_PART_NUMBER[inventoryData.data[1].devices[i].part_num] || 'AC Batterie'
            const installed = new Date(inventoryData.data[1].devices[i].installed * 1000).toLocaleString();
            const serialNumber = inventoryData.data[1].devices[i].serial_num;
            const deviceStatus = inventoryData.data[1].devices[i].device_status;
            const lastReportDate = new Date(inventoryData.data[1].devices[i].last_rpt_date * 1000).toLocaleString();
            const adminState = inventoryData.data[1].devices[i].admin_state;
            const devType = inventoryData.data[1].devices[i].dev_type;
            const createdDate = new Date(inventoryData.data[1].devices[i].created_date * 1000).toLocaleString();
            const imageLoadDate = new Date(inventoryData.data[1].devices[i].img_load_date * 1000).toLocaleString();
            const firmware = inventoryData.data[1].devices[i].img_pnum_running;
            const ptpn = inventoryData.data[1].devices[i].ptpn;
            const chaneId = inventoryData.data[1].devices[i].chaneid;
            const deviceControl = inventoryData.data[1].devices[i].device_control;
            const producing = (inventoryData.data[1].devices[i].producing == true);
            const communicating = (inventoryData.data[1].devices[i].communicating == true);
            const provisioned = (inventoryData.data[1].devices[i].provisioned == true);
            const operating = (inventoryData.data[1].devices[i].operating == true);
            const sleepEnabled = inventoryData.data[1].devices[i].sleep_enabled;
            const percentFull = inventoryData.data[1].devices[i].percentFull;
            const maxCellTemp = inventoryData.data[1].devices[i].maxCellTemp;
            const sleepMinSoc = inventoryData.data[1].devices[i].sleep_min_soc;
            const sleepMaxSoc = inventoryData.data[1].devices[i].sleep_max_soc;
            const chargeStatus = ENVOY_API_CODE[inventoryData.data[1].devices[i].charge_status] || 'undefined';

            //convert status
            const arrStatus = new Array();
            if (Array.isArray(deviceStatus) && deviceStatus.length > 0) {
              for (let j = 0; j < deviceStatus.length; j++) {
                arrStatus.push(ENVOY_API_CODE[deviceStatus[j]] || deviceStatus[j]);
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

        //qrelays inventory
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

          const type = ENVOY_API_CODE[inventoryData.data[2].type] || 'undefined';
          for (let i = 0; i < qRelaysCount; i++) {
            const partNum = ENPHASE_PART_NUMBER[inventoryData.data[2].devices[i].part_num] || 'Q-Relay'
            const installed = new Date(inventoryData.data[2].devices[i].installed * 1000).toLocaleString();
            const serialNumber = inventoryData.data[2].devices[i].serial_num;
            const deviceStatus = inventoryData.data[2].devices[i].device_status;
            const lastReportDate = new Date(inventoryData.data[2].devices[i].last_rpt_date * 1000).toLocaleString();
            const adminState = inventoryData.data[2].devices[i].admin_state;
            const devType = inventoryData.data[2].devices[i].dev_type;
            const createdDate = new Date(inventoryData.data[2].devices[i].created_date * 1000).toLocaleString();
            const imageLoadDate = new Date(inventoryData.data[2].devices[i].img_load_date * 1000).toLocaleString();
            const firmware = inventoryData.data[2].devices[i].img_pnum_running;
            const ptpn = inventoryData.data[2].devices[i].ptpn;
            const chaneId = inventoryData.data[2].devices[i].chaneid;
            const deviceControl = inventoryData.data[2].devices[i].device_control;
            const producing = (inventoryData.data[2].devices[i].producing == true);
            const communicating = (inventoryData.data[2].devices[i].communicating == true);
            const provisioned = (inventoryData.data[2].devices[i].provisioned == true);
            const operating = (inventoryData.data[2].devices[i].operating == true);
            const relay = ENVOY_API_CODE[inventoryData.data[2].devices[i].relay] || 'undefined';
            const reasonCode = inventoryData.data[2].devices[i].reason_code;
            const reason = inventoryData.data[2].devices[i].reason;
            const linesCount = inventoryData.data[2].devices[i]['line-count'];
            const line1Connected = linesCount >= 1 ? (inventoryData.data[2].devices[i]['line1-connected'] == true) : false;
            const line2Connected = linesCount >= 2 ? (inventoryData.data[2].devices[i]['line2-connected'] == true) : false;
            const line3Connected = linesCount >= 3 ? (inventoryData.data[2].devices[i]['line3-connected'] == true) : false;

            //convert status
            const arrStatus = new Array();
            if (Array.isArray(deviceStatus) && deviceStatus.length > 0) {
              for (let j = 0; j < deviceStatus.length; j++) {
                arrStatus.push(ENVOY_API_CODE[deviceStatus[j]] || deviceStatus[j]);
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
        //microinverters
        this.microinvertersCount = microinvertersCount;
        this.microinvertersInstalled = microinvertersInstalled;

        //ac bateries
        this.acBatteriesCount = acBatteriesCount;
        this.acBatteriesInstalled = acBatteriesInstalled;

        //qrelays
        this.qRelaysCount = qRelaysCount;
        this.qRelaysInstalled = qRelaysInstalled;

        const updateMetersOrEnsembleInventoryOrProductionData = this.envoySupportMeters ? this.updateMetersData() : (this.ensembleInstalled && this.installerPasswd) ? this.updateEnsembleInventoryData() : this.updateProductionData();
      }
    } catch (error) {
      this.log.error('Device: %s %s, inventoryData error: %s', this.host, this.name, error);
      this.checkDeviceInfo = true;
    };
  }

  async updateMetersData() {
    this.log.debug('Device: %s %s, requesting metersData.', this.host, this.name);

    try {
      const metersData = await this.axiosInstance(ENVOY_API_URL.InternalMeterInfo);
      this.log.debug('Device %s %s, debug metersData: %s', this.host, this.name, metersData.data);

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
            const eid = metersData.data[i].eid;
            const state = (metersData.data[i].state == 'enabled') || false;
            const measurementType = ENVOY_API_CODE[metersData.data[i].measurementType] || 'undefined';
            const phaseMode = ENVOY_API_CODE[metersData.data[i].phaseMode] || 'undefined';
            const phaseCount = metersData.data[i].phaseCount;
            const meteringStatus = ENVOY_API_CODE[metersData.data[i].meteringStatus] || 'undefined';
            const statusFlags = metersData.data[i].statusFlags;

            // convert status
            const arrStatus = new Array();
            if (Array.isArray(statusFlags) && statusFlags.length > 0) {
              for (let j = 0; j < statusFlags.length; j++) {
                arrStatus.push(ENVOY_API_CODE[statusFlags[j]] || statusFlags[j]);
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

        const updateEnsembleInventoryOrProductionData = (this.ensembleInstalled && this.installerPasswd) ? this.updateEnsembleInventoryData() : this.updateProductionData();
      }
    } catch (error) {
      this.log.error('Device: %s %s, metersData error: %s', this.host, this.name, error);
      this.checkDeviceInfo = true;
    };
  }

  async updateEnsembleInventoryData() {
    this.log.debug('Device: %s %s, requesting ensembleInventoryData.', this.host, this.name);

    try {
      const options = {
        method: 'GET',
        url: this.url + ENVOY_API_URL.EnsembleInventory,
        headers: {
          Accept: 'application/json'
        }
      }

      const ensembleInventoryData = await this.digestAuth.request(options);
      this.log.debug('Device %s %s, debug ensembleInventoryData: %s', this.host, this.name, ensembleInventoryData.data);

      if (ensembleInventoryData.status == 200) {
        const enchargesCount = ensembleInventoryData.data[0].devices.length;
        const enpowerCount = (ensembleInventoryData.data[1].devices.length);

        if (enchargesCount > 0) {
          //encharges
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

          const type = ENVOY_API_CODE[ensembleInventoryData.data[0].type] || 'Encharge';
          for (let i = 0; i < enchargesCount; i++) {
            const partNum = ENPHASE_PART_NUMBER[ensembleInventoryData.data[0].devices[i].part_num] || 'undefined'
            const installed = new Date(ensembleInventoryData.data[0].devices[i].installed * 1000).toLocaleString();
            const serialNumber = ensembleInventoryData.data[0].devices[i].serial_num;
            const deviceStatus = ensembleInventoryData.data[0].devices[i].device_status;
            const lastReportDate = new Date(ensembleInventoryData.data[0].devices[i].last_rpt_date * 1000).toLocaleString();
            const adminState = ensembleInventoryData.data[0].devices[i].admin_state;
            const adminStateStr = ENVOY_API_CODE[ensembleInventoryData.data[0].devices[i].admin_state_str] || 'undefined';
            const createdDate = new Date(ensembleInventoryData.data[0].devices[i].created_date * 1000).toLocaleString();
            const imgLoadDate = new Date(ensembleInventoryData.data[0].devices[i].img_load_date * 1000).toLocaleString();
            const imgPnumRunning = ensembleInventoryData.data[0].devices[i].img_pnum_running;
            const zigbeeDongleFwVersion = ensembleInventoryData.data[0].devices[i].zigbee_dongle_fw_version;
            const operating = (ensembleInventoryData.data[0].devices[i].operating == true);
            const communicating = (ensembleInventoryData.data[0].devices[i].communicating == true);
            const sleepEnabled = ensembleInventoryData.data[0].devices[i].sleep_enabled;
            const percentFull = ensembleInventoryData.data[0].devices[i].percentFull;
            const temperature = ensembleInventoryData.data[0].devices[i].temperature;
            const maxCellTemp = ensembleInventoryData.data[0].devices[i].maxCellTemp;
            const commLevelSubGhz = (ensembleInventoryData.data[0].devices[i].comm_level_sub_ghz * 20);
            const commLevel24Ghz = (ensembleInventoryData.data[0].devices[i].comm_level_2_4_ghz * 20);
            const ledStatus = ENCHARGE_LED_STATUS[ensembleInventoryData.data[0].devices[i].led_status] || 'undefined';
            const realPowerW = parseFloat((ensembleInventoryData.data[0].devices[i].real_power_w) / 1000); // in kW
            const dcSwitchOff = ensembleInventoryData.data[0].devices[i].dc_switch_off;
            const rev = ensembleInventoryData.data[0].devices[i].encharge_rev;
            const capacity = parseFloat((ensembleInventoryData.data[0].devices[i].encharge_capacity) / 1000); //in kWh

            //convert status
            const arrStatus = new Array();
            if (Array.isArray(deviceStatus) && deviceStatus.length > 0) {
              for (let j = 0; j < deviceStatus.length; j++) {
                arrStatus.push(ENVOY_API_CODE[deviceStatus[j]] || deviceStatus[j]);
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

        //enpower data
        if (enpowerCount > 0) {
          //enpower
          const type = ENVOY_API_CODE[ensembleInventoryData.data[1].type] || 'Enpower';
          const partNum = ENPHASE_PART_NUMBER[ensembleInventoryData.data[1].devices[0].part_num] || 'undefined'
          const installed = new Date(ensembleInventoryData.data[1].devices[0].installed * 1000).toLocaleString();
          const serialNumber = ensembleInventoryData.data[1].devices[0].serial_num;
          const deviceStatus = ensembleInventoryData.data[1].devices[0].device_status;
          const lastReportDate = new Date(ensembleInventoryData.data[1].devices[0].last_rpt_date * 1000).toLocaleString();
          const adminState = ensembleInventoryData.data[1].devices[0].admin_state;
          const adminStateStr = ENVOY_API_CODE[ensembleInventoryData.data[1].devices[0].admin_state_str] || 'undefined';
          const createdDate = new Date(ensembleInventoryData.data[1].devices[0].created_date * 1000).toLocaleString();
          const imgLoadDate = new Date(ensembleInventoryData.data[1].devices[0].img_load_date * 1000).toLocaleString();
          const imgPnumRunning = ensembleInventoryData.data[1].devices[0].img_pnum_running;
          const zigbeeDongleFwVersion = ensembleInventoryData.data[1].devices[0].zigbee_dongle_fw_version;
          const operating = (ensembleInventoryData.data[1].devices[0].operating == true);
          const communicating = (ensembleInventoryData.data[1].devices[0].communicating == true);
          const temperature = ensembleInventoryData.data[1].devices[0].temperature;
          const commLevelSubGhz = (ensembleInventoryData.data[1].devices[0].comm_level_sub_ghz * 20);
          const commLevel24Ghz = (ensembleInventoryData.data[1].devices[0].comm_level_2_4_ghz * 20);
          const mainsAdminState = ENVOY_API_CODE[ensembleInventoryData.data[1].devices[0].mains_admin_state] || 'undefined';
          const mainsOperState = ENVOY_API_CODE[ensembleInventoryData.data[1].devices[0].mains_oper_state] || 'undefined';
          const enpwrGridMode = ENVOY_API_CODE[ensembleInventoryData.data[1].devices[0].Enpwr_grid_mode] || 'undefined';
          const enchgGridMode = ENVOY_API_CODE[ensembleInventoryData.data[1].devices[0].Enchg_grid_mode] || 'undefined';
          const enpwrRelayStateBm = ensembleInventoryData.data[1].devices[0].Enpwr_relay_state_bm;
          const enpwrCurrStateId = ensembleInventoryData.data[1].devices[0].Enpwr_curr_state_id;

          //convert status
          const arrStatus = new Array();
          if (Array.isArray(deviceStatus) && deviceStatus.length > 0) {
            for (let j = 0; j < deviceStatus.length; j++) {
              arrStatus.push(ENVOY_API_CODE[deviceStatus[j]] || deviceStatus[j]);
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

        this.enchargesCount = enchargesCount;
        this.enpowerCount = enpowerCount;

        //grid profile
        const gridProfileName = ensembleInventoryData.data[2].grid_profile_name;
        const id = ensembleInventoryData.data[2].id;
        const gridProfileVersion = ensembleInventoryData.data[2].grid_profile_version;
        const itemCount = ensembleInventoryData.data[2].item_count;

        this.ensembleGridProfileName = gridProfileName;
        this.ensembleId = id;
        this.ensembleGridProfileVersion = gridProfileVersion;
        this.ensembleItemCount = itemCount;

        const updateEnsembleStatusOrProductionData = (this.ensembleInstalled && this.installerPasswd) ? this.updateEnsembleStatusData() : this.updateProductionData();
      }
    } catch (error) {
      this.log.error('Device: %s %s, ensembleInventoryData error: %s', this.host, this.name, error);
      this.checkDeviceInfo = true;
    };
  }

  async updateEnsembleStatusData() {
    this.log.debug('Device: %s %s, requesting ensembleStatusData.', this.host, this.name);

    try {
      const options = {
        method: 'GET',
        url: this.url + ENVOY_API_URL.EnsembleStatus,
        headers: {
          Accept: 'application/json'
        }
      }

      const ensembleStatusData = await this.digestAuth.request(options);
      this.log.debug('Debug ensembleStatusData: %s', ensembleStatusData.data);

      //ensemble status
      if (ensembleStatusData.status == 200) {
        const serialNumbers = ensembleStatusData.data.inventory.serial_nums;
        const objSerialNumbers = Object.keys(serialNumbers);
        const serialNumbersCount = objSerialNumbers.length;
        for (let i = 0; i < serialNumbersCount; i++) {
          const key = objSerialNumbers[i];
          const deviceType = ensembleStatusData.data.inventory.serial_nums[key].device_type;
          const adminState = ensembleStatusData.data.inventory.serial_nums[key].admin_state;
          const adminStateStr = ENVOY_API_CODE[ensembleStatusData.data.inventory.serial_nums[key].admin_state_str] || 'undefined';
          const reportedGridMode = ENVOY_API_CODE[ensembleStatusData.data.inventory.serial_nums[key].reported_grid_mode] || 'undefined';
          const msgRetryCoun = ensembleStatusData.data.inventory.serial_nums[key].msg_retry_count;
          const partNumber = ensembleStatusData.data.inventory.serial_nums[key].part_number;
          const assemblyNumber = ensembleStatusData.data.inventory.serial_nums[key].assembly_number;
          const appFwVersion = ensembleStatusData.data.inventory.serial_nums[key].app_fw_version;
          const zbFwVersion = ensembleStatusData.data.inventory.serial_nums[key].zb_fw_version;
          const zbBootloaderVers = ensembleStatusData.data.inventory.serial_nums[key].zb_bootloader_vers;
          const iblFwVersion = ensembleStatusData.data.inventory.serial_nums[key].ibl_fw_version;
          const swiftAsicFwVersion = ensembleStatusData.data.inventory.serial_nums[key].swift_asic_fw_version;
          const submodulesCount = ensembleStatusData.data.inventory.serial_nums[key].submodule_count;
          const submodulesKeys = ensembleStatusData.data.inventory.serial_nums[key].submodules;

          const submodulesSerialNumbers = ensembleStatusData.data.inventory.serial_nums[key].submodules;
          const objSubmodulesSerialNumbers = Object.keys(submodulesSerialNumbers);
          const submodulesSerialNumbersCount = objSubmodulesSerialNumbers.length;
          for (let j = 0; j < submodulesSerialNumbersCount; j++) {
            const key1 = objSubmodulesSerialNumbers[j];
            const submodulesDeviceType = ensembleStatusData.data.inventory.serial_nums[key].submodules[key1].device_type;
            const submodulesAdminState = ensembleStatusData.data.inventory.serial_nums[key].submodules[key1].admin_state;
            const submodulesPartNumber = ensembleStatusData.data.inventory.serial_nums[key].submodules[key1].part_number;
            const submodulesAssemblyNumber = ensembleStatusData.data.inventory.serial_nums[key].submodules[key1].assembly_number;
            const submodulesDmirPartNumber = ensembleStatusData.data.inventory.serial_nums[key].submodules[key1].dmir.part_number;
            const submodulesDmirAssemblyNumber = ensembleStatusData.data.inventory.serial_nums[key].submodules[key1].dmir.assembly_number;
            const submodulesProcloadPartNumber = ensembleStatusData.data.inventory.serial_nums[key].submodules[key1].procload.part_number;
            const submodulesProcloadAssemblyNumber = ensembleStatusData.data.inventory.serial_nums[key].submodules[key1].procload.assembly_number;
          }
        }

        //counters
        const apiEcagtInit = ensembleStatusData.data.counters.api_ecagtInit;
        const apiEcagtTick = ensembleStatusData.data.counters.api_ecagtTick;
        const apiEcagtDeviceInsert = ensembleStatusData.data.counters.api_ecagtDeviceInsert;
        const apiEcagtDeviceNetworkStatus = ensembleStatusData.data.counters.api_ecagtDeviceNetworkStatus;
        const apiEcagtDeviceRemoved = ensembleStatusData.data.counters.api_ecagtDeviceRemoved;
        const apiEcagtGetDeviceCount = ensembleStatusData.data.counters.api_ecagtGetDeviceCount;
        const apiEcagtGetDeviceInfo = ensembleStatusData.data.counters.api_ecagtGetDeviceInfo;
        const apiEcagtGetOneDeviceInfo = ensembleStatusData.data.counters.api_ecagtGetOneDeviceInfo;
        const apiEcagtDevIdToSerial = ensembleStatusData.data.counters.api_ecagtDevIdToSerial;
        const apiEcagtHandleMsg = ensembleStatusData.data.counters.api_ecagtHandleMsg;
        const apiEcagtGetSubmoduleInv = ensembleStatusData.data.counters.api_ecagtGetSubmoduleInv;
        const apiEcagtGetDataModelRaw = ensembleStatusData.data.counters.api_ecagtGetDataModelRaw;
        const apiEcagtSetSecCtrlBias = ensembleStatusData.data.counters.api_ecagtSetSecCtrlBias;
        const apiEcagtGetSecCtrlBias = ensembleStatusData.data.counters.api_ecagtGetSecCtrlBias;
        const apiEcagtGetSecCtrlBiasQ = ensembleStatusData.data.counters.api_ecagtGetSecCtrlBiasQ;
        const apiEcagtSetRelayAdmin = ensembleStatusData.data.counters.api_ecagtSetRelayAdmin;
        const apiEcagtGetRelayState = ensembleStatusData.data.counters.api_ecagtGetRelayState;
        const apiEcagtSetDataModelCache = ensembleStatusData.data.counters.api_ecagtSetDataModelCache;
        const apiAggNameplate = ensembleStatusData.data.counters.api_AggNameplate;
        const apiChgEstimated = ensembleStatusData.data.counters.api_ChgEstimated;
        const apiEcagtGetGridFreq = ensembleStatusData.data.counters.api_ecagtGetGridFreq;
        const apiEcagtGetGridVolt = ensembleStatusData.data.counters.api_ecagtGetGridVolt;
        const apiEcagtGetGridFreqErrNotfound = ensembleStatusData.data.counters.api_ecagtGetGridFreq_err_notfound;
        const apiEcagtGetGridFreqErrOor = ensembleStatusData.data.counters.api_ecagtGetGridFreq_err_oor;
        const restStatusGet = ensembleStatusData.data.counters.rest_StatusGet;
        const restInventoryGet = ensembleStatusData.data.counters.rest_InventoryGet;
        const restSubmodGet = ensembleStatusData.data.counters.rest_SubmodGet;
        const restSecCtrlGet = ensembleStatusData.data.counters.rest_SecCtrlGet;
        const restRelayGet = ensembleStatusData.data.counters.rest_RelayGet;
        const restRelayPost = ensembleStatusData.data.counters.rest_RelayPost;
        const restCommCheckGet = ensembleStatusData.data.counters.rest_CommCheckGet;
        const restPower = ensembleStatusData.data.counters.rest_Power;
        const extZbRemove = ensembleStatusData.data.counters.ext_zb_remove;
        const extZbRemoveErr = ensembleStatusData.data.counters.ext_zb_remove_err;
        const extZbSendMsg = ensembleStatusData.data.counters.ext_zb_send_msg;
        const extCfgSaveDevice = ensembleStatusData.data.counters.ext_cfg_save_device;
        const extCfgSaveDeviceErr = ensembleStatusData.data.counters.ext_cfg_save_device_err;
        const extSendPerfData = ensembleStatusData.data.counters.ext_send_perf_data;
        const extEventSetStateful = ensembleStatusData.data.counters.ext_event_set_stateful;
        const extEventSetModgone = ensembleStatusData.data.counters.ext_event_set_modgone;
        const rxmsgObjMdlMetaRsp = ensembleStatusData.data.counters.rxmsg_OBJ_MDL_META_RSP;
        const rxmsgObjMdlInvUpdRsp = ensembleStatusData.data.counters.rxmsg_OBJ_MDL_INV_UPD_RSP;
        const rxmsgObjMdlPollRsp = ensembleStatusData.data.counters.rxmsg_OBJ_MDL_POLL_RSP;
        const rxmsgObjMdlRelayCtrlRsp = ensembleStatusData.data.counters.rxmsg_OBJ_MDL_RELAY_CTRL_RSP;
        const rxmsgObjMdlRelayStatusReq = ensembleStatusData.data.counters.rxmsg_OBJ_MDL_RELAY_STATUS_REQ;
        const rxmsgObjMdlGridStatusRsp = ensembleStatusData.data.counters.rxmsg_OBJ_MDL_GRID_STATUS_RSP;
        const rxmsgObjMdlEventMsg = ensembleStatusData.data.counters.rxmsg_OBJ_MDL_EVENT_MSG;
        const rxmsgObjMdlSosConfigRsp = ensembleStatusData.data.counters.rxmsg_OBJ_MDL_SOC_CONFIG_RSP;
        const txmsgObjMdlMetaReq = ensembleStatusData.data.counters.txmsg_OBJ_MDL_META_REQ;
        const txmsgObjMdlEncRtPollReq = ensembleStatusData.data.counters.txmsg_OBJ_MDL_ENC_RT_POLL_REQ;
        const txmsgObjMdlEnpRtPollReq = ensembleStatusData.data.counters.txmsg_OBJ_MDL_ENP_RT_POLL_REQ;
        const txmsgObjMdlBmuPollReq = ensembleStatusData.data.counters.txmsg_OBJ_MDL_BMU_POLL_REQ;
        const txmsgObjMdlPcuPollReq = ensembleStatusData.data.counters.txmsg_OBJ_MDL_PCU_POLL_REQ;
        const txmsgObjMdlSecondaryCtrlReq = ensembleStatusData.data.counters.txmsg_OBJ_MDL_SECONDARY_CTRL_REQ;
        const txmsgObjMdlRelayCtrlReq = ensembleStatusData.data.counters.txmsg_OBJ_MDL_RELAY_CTRL_REQ;
        const txmsgObjMdlGridStatusReq = ensembleStatusData.data.counters.txmsg_OBJ_MDL_GRID_STATUS_REQ
        const txmsgObjMdlRelayStatusRsp = ensembleStatusData.data.counters.txmsg_OBJ_MDL_RELAY_STATUS_RSP;
        const txmsgObjMdlcosConfigReq = ensembleStatusData.data.counters.txmsg_OBJ_MDL_SOC_CONFIG_REQ;
        const txmsgObjMdlTnsStart = ensembleStatusData.data.counters.txmsg_OBJ_MDL_TNS_START;
        const rxmsgObjMdlTnsStartRsp = ensembleStatusData.data.counters.rxmsg_OBJ_MDL_TNS_START_RSP;
        const txmsgObjMdlSetUdmir = ensembleStatusData.data.counters.txmsg_OBJ_MDL_SET_UDMIR;
        const rxmsgObjMdlSetUdmirRsp = ensembleStatusData.data.counters.rxmsg_OBJ_MDL_SET_UDMIR_RSP;
        const txmsgObjMdlTnsEdn = ensembleStatusData.data.counters.txmsg_OBJ_MDL_TNS_END;
        const rxmsgObjMdlTnsEndRsp = ensembleStatusData.data.counters.rxmsg_OBJ_MDL_TNS_END_RSP;
        const txmsgLvsPoll = ensembleStatusData.data.counters.txmsg_lvs_poll;
        const zmqEcaHello = ensembleStatusData.data.counters.zmq_ecaHello;
        const zmqEcaDevInfo = ensembleStatusData.data.counters.zmq_ecaDevInfo;
        const zmqEcaNetworkStatus = ensembleStatusData.data.counters.zmq_ecaNetworkStatus;
        const zmqEcaAppMsg = ensembleStatusData.data.counters.zmq_ecaAppMsg;
        const zmqStreamdata = ensembleStatusData.data.counters.zmq_streamdata;
        const zmqLiveDebug = ensembleStatusData.data.counters.zmq_live_debug;
        const zmqEcaLiveDebugReq = ensembleStatusData.data.counters.zmq_eca_live_debug_req;
        const zmqNameplate = ensembleStatusData.data.counters.zmq_nameplate;
        const zmqEcaSecCtrlMsg = ensembleStatusData.data.counters.zmq_ecaSecCtrlMsg;
        const zmqMeterlogOk = ensembleStatusData.data.counters.zmq_meterlog_ok;
        const dmdlFilesIndexed = ensembleStatusData.data.counters.dmdl_FILES_INDEXED;
        const pfStart = ensembleStatusData.data.counters.pf_start;
        const pfActivate = ensembleStatusData.data.counters.pf_activate;
        const devPollMissing = ensembleStatusData.data.counters.devPollMissing;
        const devMsgRspMissing = ensembleStatusData.data.counters.devMsgRspMissing;
        const gridProfileTransaction = ensembleStatusData.data.counters.gridProfileTransaction;
        const secctrlNotReady = ensembleStatusData.data.counters.secctrlNotReady;
        const fsmRetryTimeout = ensembleStatusData.data.counters.fsm_retry_timeout;
        const profileTxnAck = ensembleStatusData.data.counters.profile_txn_ack;
        const backupSocLimitSet = ensembleStatusData.data.counters.backupSocLimitSet;
        const backupSocLimitChanged = ensembleStatusData.data.counters.backupSocLimitChanged;
        const backupSocLimitAbove100 = ensembleStatusData.data.counters.backupSocLimitAbove100;

        //secctrl
        const freqBiasHz = ensembleStatusData.data.secctrl.freq_bias_hz;
        const voltageBiasV = ensembleStatusData.data.secctrl.voltage_bias_v;
        const freqBiasHzQ8 = ensembleStatusData.data.secctrl.freq_bias_hz_q8;
        const voltageBiasVQ5 = ensembleStatusData.data.secctrl.voltage_bias_v_q5;
        const configuredBackupSoc = ensembleStatusData.data.secctrl.configured_backup_soc; //in %
        const adjustedBackupSoc = ensembleStatusData.data.secctrl.adjusted_backup_soc; //in %
        const aggSoc = ensembleStatusData.data.secctrl.agg_soc; //in %
        const aggBackupEnergy = parseFloat((ensembleStatusData.data.secctrl.agg_backup_energy) / 1000); //in kWh
        const aggAvailEnergy = parseFloat((ensembleStatusData.data.secctrl.agg_avail_energy) / 1000); //in kWh

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
        const mainsAdminState = ENVOY_API_CODE[ensembleStatusData.data.relay.mains_admin_state] || 'undefined';
        const mainsOperState = ENVOY_API_CODE[ensembleStatusData.data.relay.mains_oper_sate] || 'undefined';
        const enpwrGridMode = ENVOY_API_CODE[ensembleStatusData.data.relay.Enpwr_grid_mode] || 'undefined';
        const enchgGridMode = ENVOY_API_CODE[ensembleStatusData.data.relay.Enchg_grid_mode] || 'undefined';

        //profile
        const name = ensembleStatusData.data.profile.name;
        const id = ensembleStatusData.data.profile.id;
        const version = ensembleStatusData.data.profile.version;
        const itemCount = ensembleStatusData.data.profile.item_count;

        this.ensembleGridProfileName = name;
        this.ensembleId = id;
        this.ensembleGridProfileVersion = version;
        this.ensembleItemCount = itemCount;

        const fakeInventoryMode = ensembleStatusData.data.fakeit.fake_inventory_mode;
        this.ensembleFakeInventoryMode = (fakeInventoryMode == true);

        this.updateProductionData();
      }
    } catch (error) {
      this.log.error('Device: %s %s, ensembleStatusData error: %s', this.host, this.name, error);
      this.checkDeviceInfo = true;
    };
  }

  async updateProductionData() {
    this.log.debug('Device: %s %s, requesting productionData.', this.host, this.name);

    try {
      const productionData = await this.axiosInstance(ENVOY_API_URL.InverterProductionSumm);
      this.log.debug('Debug productionData: %s', productionData.data);

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

        this.updateProductionCtData();
      }
    } catch (error) {
      this.log.error('Device: %s %s, productionData error: %s', this.host, this.name, error);
      this.checkDeviceInfo = true;
    };
  }

  async updateProductionCtData() {
    this.log.debug('Device: %s %s, requesting productionCtData.', this.host, this.name);

    try {
      const productionCtData = await this.axiosInstance(ENVOY_API_URL.SystemReadingStats);
      this.log.debug('Debug productionCtData: %s', productionCtData.data);

      //production CT
      if (productionCtData.status == 200) {
        //get enabled devices
        const metersProductionEnabled = this.metersProductionEnabled;
        const metersProductionVoltageDivide = this.metersProductionVoltageDivide;
        const metersConsumptionEnabled = this.metersConsumptionEnabled;
        const metersConsumpionVoltageDivide = this.metersConsumpionVoltageDivide;
        const acBatteriesInstalled = this.acBatteriesInstalled;
        const productionEnergyLifetimeOffset = this.productionEnergyLifetimeOffset;
        const consumptionTotalEnergyLifetimeOffset = this.consumptionTotalEnergyLifetimeOffset;
        const consumptionNetEnergyLifetimeOffset = this.consumptionNetEnergyLifetimeOffset;

        const productionMicroSummarywhToday = this.productionMicroSummarywhToday;
        const productionMicroSummarywhLastSevenDays = this.productionMicroSummarywhLastSevenDays;
        const productionMicroSummarywhLifeTime = this.productionMicroSummarywhLifeTime;
        const productionMicroSummaryWattsNow = this.productionMicroSummaryWattsNow;

        //microinverters data
        const productionMicroType = ENVOY_API_CODE[productionCtData.data.production[0].type] || 'undefined';
        const productionMicroActiveCount = productionCtData.data.production[0].activeCount;
        const productionMicroReadingTime = new Date(productionCtData.data.production[0].readingTime * 1000).toLocaleString();
        const productionMicroPower = parseFloat(productionCtData.data.production[0].wNow / 1000);
        const productionMicroEnergyLifeTime = parseFloat((productionCtData.data.production[0].whLifetime + productionEnergyLifetimeOffset) / 1000);

        //production data
        const productionType = metersProductionEnabled ? ENVOY_API_CODE[productionCtData.data.production[1].type] : productionMicroType;
        const productionActiveCount = metersProductionEnabled ? productionCtData.data.production[1].activeCount : productionMicroActiveCount;
        const productionMeasurmentType = metersProductionEnabled ? ENVOY_API_CODE[productionCtData.data.production[1].measurementType] : 'undefined';
        const productionReadingTime = metersProductionEnabled ? new Date(productionCtData.data.production[1].readingTime * 1000).toLocaleString() : productionMicroReadingTime;
        const productionPower = metersProductionEnabled ? parseFloat(productionCtData.data.production[1].wNow / 1000) : productionMicroSummaryWattsNow;

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
        const productionEnergyLifeTime = metersProductionEnabled ? parseFloat((productionCtData.data.production[1].whLifetime + productionEnergyLifetimeOffset) / 1000) : productionMicroSummarywhLifeTime;
        const productionEnergyVarhLeadLifetime = metersProductionEnabled ? parseFloat(productionCtData.data.production[1].varhLeadLifetime / 1000) : 0;
        const productionEnergyVarhLagLifetime = metersProductionEnabled ? parseFloat(productionCtData.data.production[1].varhLagLifetime / 1000) : 0;
        const productionEnergyLastSevenDays = metersProductionEnabled ? parseFloat(productionCtData.data.production[1].whLastSevenDays / 1000) : productionMicroSummarywhLastSevenDays;
        const productionEnergyToday = metersProductionEnabled ? parseFloat(productionCtData.data.production[1].whToday / 1000) : productionMicroSummarywhToday;
        const productionEnergyVahToday = metersProductionEnabled ? parseFloat(productionCtData.data.production[1].vahToday / 1000) : 0;
        const productionEnergyVarhLeadToday = metersProductionEnabled ? parseFloat(productionCtData.data.production[1].varhLeadToday / 1000) : 0;
        const productionEnergyVarhLagToday = metersProductionEnabled ? parseFloat(productionCtData.data.production[1].varhLagToday / 1000) : 0;

        //param
        const productionRmsCurrent = metersProductionEnabled ? parseFloat(productionCtData.data.production[1].rmsCurrent) : 0;
        const productionRmsVoltage = metersProductionEnabled ? parseFloat((productionCtData.data.production[1].rmsVoltage) / metersProductionVoltageDivide) : 0;
        const productionReactivePower = metersProductionEnabled ? parseFloat((productionCtData.data.production[1].reactPwr) / 1000) : 0;
        const productionApparentPower = metersProductionEnabled ? parseFloat((productionCtData.data.production[1].apprntPwr) / 1000) : 0;
        const productionPwrFactor = metersProductionEnabled ? parseFloat(productionCtData.data.production[1].pwrFactor) : 0;

        if (this.productionsService) {
          this.productionsService[0]
            .updateCharacteristic(Characteristic.enphaseReadingTime, productionReadingTime)
            .updateCharacteristic(Characteristic.enphasePower, productionPower)
            .updateCharacteristic(Characteristic.enphasePowerMax, productionPowerMax)
            .updateCharacteristic(Characteristic.enphasePowerMaxDetected, productionPowerMaxDetectedState)
            .updateCharacteristic(Characteristic.enphaseEnergyToday, productionEnergyToday)
            .updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, productionEnergyLastSevenDays)
            .updateCharacteristic(Characteristic.enphaseEnergyLifeTime, productionEnergyLifeTime);
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

        //consumption data
        if (metersConsumptionEnabled) {
          this.consumptionType = new Array();
          this.consumptionMeasurmentType = new Array();
          this.consumptionActiveCount = new Array();
          this.consumptionReadingTime = new Array();
          this.consumptionPower = new Array();
          this.consumptionPowerMax = new Array();
          this.consumptionPowerMaxDetected = new Array();
          this.consumptionEnergyToday = new Array();
          this.consumptionEnergyLastSevenDays = new Array();
          this.consumptionEnergyLifeTime = new Array();
          this.consumptionRmsCurrent = new Array();
          this.consumptionRmsVoltage = new Array();
          this.consumptionReactivePower = new Array();
          this.consumptionApparentPower = new Array();
          this.consumptionPwrFactor = new Array();

          const metersConsumptionCount = productionCtData.data.consumption.length;
          for (let i = 0; i < metersConsumptionCount; i++) {
            //power
            const consumptionType = ENVOY_API_CODE[productionCtData.data.consumption[i].type] || 'undefined';
            const consumptionActiveCount = productionCtData.data.consumption[i].activeCount;
            const consumptionMeasurmentType = ENVOY_API_CODE[productionCtData.data.consumption[i].measurementType] || 'undefined';
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
            const consumptionPowerMaxDetected = (consumptionPower >= (([this.consumptionTotalPowerMaxDetected, this.consumptionNetPowerMaxDetected][i]) / 1000)) ? true : false;

            //energy
            const lifeTimeOffset = [consumptionTotalEnergyLifetimeOffset, consumptionNetEnergyLifetimeOffset][i];
            const consumptionEnergyLifeTime = parseFloat((productionCtData.data.consumption[i].whLifetime + lifeTimeOffset) / 1000);
            const consumptionEnergyVarhLeadLifetime = parseFloat(productionCtData.data.consumption[i].varhLeadLifetime / 1000);
            const consumptionEnergyVarhLagLifetime = parseFloat(productionCtData.data.consumption[i].varhLagLifetime / 1000);
            const consumptionEnergyLastSevenDays = parseFloat(productionCtData.data.consumption[i].whLastSevenDays / 1000);
            const consumptionEnergyToday = parseFloat(productionCtData.data.consumption[i].whToday / 1000);
            const consumptionEnergyVahToday = parseFloat(productionCtData.data.consumption[i].vahToday / 1000);
            const consumptionEnergyVarhLeadToday = parseFloat(productionCtData.data.consumption[i].varhLeadToday / 1000);
            const consumptionEnergyVarhLagToday = parseFloat(productionCtData.data.consumption[i].varhLagToday / 1000);

            //net param
            const consumptionRmsCurrent = parseFloat(productionCtData.data.consumption[i].rmsCurrent);
            const consumptionRmsVoltage = parseFloat((productionCtData.data.consumption[i].rmsVoltage) / metersConsumpionVoltageDivide);
            const consumptionReactivePower = parseFloat((productionCtData.data.consumption[i].reactPwr) / 1000);
            const consumptionApparentPower = parseFloat((productionCtData.data.consumption[i].apprntPwr) / 1000);
            const consumptionPwrFactor = parseFloat(productionCtData.data.consumption[i].pwrFactor);

            if (this.consumptionsService) {
              this.consumptionsService[i]
                .updateCharacteristic(Characteristic.enphaseReadingTime, consumptionReadingTime)
                .updateCharacteristic(Characteristic.enphasePower, consumptionPower)
                .updateCharacteristic(Characteristic.enphasePowerMax, consumptionPowerMax)
                .updateCharacteristic(Characteristic.enphasePowerMaxDetected, consumptionPowerMaxDetected)
                .updateCharacteristic(Characteristic.enphaseEnergyToday, consumptionEnergyToday)
                .updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, consumptionEnergyLastSevenDays)
                .updateCharacteristic(Characteristic.enphaseEnergyLifeTime, consumptionEnergyLifeTime)
                .updateCharacteristic(Characteristic.enphaseRmsCurrent, consumptionRmsCurrent)
                .updateCharacteristic(Characteristic.enphaseRmsVoltage, consumptionRmsVoltage)
                .updateCharacteristic(Characteristic.enphaseReactivePower, consumptionReactivePower)
                .updateCharacteristic(Characteristic.enphaseApparentPower, consumptionApparentPower)
                .updateCharacteristic(Characteristic.enphasePwrFactor, consumptionPwrFactor);
            }
            this.consumptionType.push(consumptionType);
            this.consumptionMeasurmentType.push(consumptionMeasurmentType);
            this.consumptionActiveCount.push(consumptionActiveCount);
            this.consumptionReadingTime.push(consumptionReadingTime);
            this.consumptionPower.push(consumptionPower);
            this.consumptionPowerMax.push(consumptionPowerMax);
            this.consumptionPowerMaxDetected.push(consumptionPowerMaxDetected);
            this.consumptionEnergyToday.push(consumptionEnergyToday);
            this.consumptionEnergyLastSevenDays.push(consumptionEnergyLastSevenDays);
            this.consumptionEnergyLifeTime.push(consumptionEnergyLifeTime);
            this.consumptionRmsCurrent.push(consumptionRmsCurrent);
            this.consumptionRmsVoltage.push(consumptionRmsVoltage);
            this.consumptionReactivePower.push(consumptionReactivePower);
            this.consumptionApparentPower.push(consumptionApparentPower);
            this.consumptionPwrFactor.push(consumptionPwrFactor);
          }
          this.metersConsumptionCount = metersConsumptionCount;
        }

        //storage data (ac btteries summary)
        if (acBatteriesInstalled) {
          const type = ENVOY_API_CODE[productionCtData.data.storage[0].type] || 'AC Batterie';
          const activeCount = productionCtData.data.storage[0].activeCount;
          const readingTime = new Date(productionCtData.data.storage[0].readingTime * 1000).toLocaleString();
          const wNow = parseFloat((productionCtData.data.storage[0].wNow) / 1000);
          const whNow = parseFloat((productionCtData.data.storage[0].whNow + this.acBatteriesStorageOffset) / 1000);
          const chargeStatus = ENVOY_API_CODE[productionCtData.data.storage[0].state] || 'undefined';
          const percentFull = productionCtData.data.storage[0].percentFull;

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
        const updateMicroinvertersOrMetersReadingOrProductionPowerModeOrDeviceInfo = !this.checkDeviceInfo ? false : this.envoyPasswd ? this.updateMicroinvertersData() : this.metersInstalled ? this.updateMetersReadingData() : (this.installerPasswd && this.envoyDevId.length == 9) ? this.updateProductionPowerModeData() : this.getDeviceInfo();
      }
    } catch (error) {
      this.log.error('Device: %s %s, productionCtData error: %s', this.host, this.name, error);
      this.checkDeviceInfo = true;
    };
  }

  async updateMicroinvertersData() {
    this.log.debug('Device: %s %s, requesting microinvertersData', this.host, this.name);

    try {
      const passwd = this.envoyPasswd;
      const digestAuth = new axiosDigestAuth({
        user: ENVOY_USER,
        passwd: passwd
      });

      const options = {
        method: 'GET',
        url: this.url + ENVOY_API_URL.InverterProduction,
        headers: {
          Accept: 'application/json'
        }
      }

      const microinvertersData = await digestAuth.request(options);
      this.log.debug('Debug microinvertersData: %s', microinvertersData.data);

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
          const lastReportDate = new Date(microinvertersData.data[index].lastReportDate * 1000).toLocaleString();
          const devType = microinvertersData.data[index].devType;
          const lastReportWatts = parseInt(microinvertersData.data[index].lastReportWatts);
          const maxReportWatts = parseInt(microinvertersData.data[index].maxReportWatts);

          if (this.microinvertersService) {
            this.microinvertersService[i]
              .updateCharacteristic(Characteristic.enphaseMicroinverterLastReportDate, lastReportDate)
              .updateCharacteristic(Characteristic.enphaseMicroinverterPower, lastReportWatts)
              .updateCharacteristic(Characteristic.enphaseMicroinverterPowerMax, maxReportWatts)
          }

          this.microinvertersReadingTime.push(lastReportDate);
          this.microinvertersDevType.push(devType);
          this.microinvertersLastPower.push(lastReportWatts);
          this.microinvertersMaxPower.push(maxReportWatts);
        }
        this.microinvertersUpdatePower = true;
        const updateMetersReadingOrProductionPowerModeOrDeviceInfo = !this.checkDeviceInfo ? false : this.metersInstalled ? this.updateMetersReadingData() : (this.installerPasswd && this.envoyDevId.length == 9) ? this.updateProductionPowerModeData() : this.getDeviceInfo();
      }
    } catch (error) {
      this.log.error('Device: %s %s, microinvertersData error: %s', this.host, this.name, error);
      this.checkDeviceInfo = true;
      this.microinvertersUpdatePower = false;
    };
  }

  async updateMetersReadingData() {
    this.log.debug('Device: %s %s, requesting metersReadingData.', this.host, this.name);

    try {
      const metersReadingData = await this.axiosInstance(ENVOY_API_URL.InternalMeterReadings);
      this.log.debug('Debug metersReadingData: %s', metersReadingData.data);

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
            const eid = metersReadingData.data[i].eid;
            const timestamp = new Date(metersReadingData.data[i].timestamp * 1000).toLocaleString();
            const actEnergyDlvd = parseFloat(metersReadingData.data[i].actEnergyDlvd);
            const actEnergyRcvd = parseFloat(metersReadingData.data[i].actEnergyRcvd);
            const apparentEnergy = parseFloat(metersReadingData.data[i].apparentEnergy);
            const reactEnergyLagg = parseFloat(metersReadingData.data[i].reactEnergyLagg);
            const reactEnergyLead = parseFloat(metersReadingData.data[i].reactEnergyLead);
            const instantaneousDemand = parseFloat(metersReadingData.data[i].instantaneousDemand);
            const activePower = parseFloat((metersReadingData.data[i].activePower) / 1000);
            const apparentPower = parseFloat((metersReadingData.data[i].apparentPower) / 1000);
            const reactivePower = parseFloat((metersReadingData.data[i].reactivePower) / 1000);
            const pwrFactor = parseFloat(metersReadingData.data[i].pwrFactor);
            const voltage = parseFloat((metersReadingData.data[i].voltage) / metersVoltageDivide);
            const current = parseFloat(metersReadingData.data[i].current);
            const freq = parseFloat(metersReadingData.data[i].freq);

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
            const metersReadingPhaseCount = metersReadingData.data[i].channels.length;
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
                const eid = metersReadingData.data[i].channels[j].eid;
                const timestamp = new Date(metersReadingData.data[i].channels[j].timestamp * 1000).toLocaleString();
                const actEnergyDlvd = parseFloat(metersReadingData.data[i].channels[j].actEnergyDlvd);
                const actEnergyRcvd = parseFloat(metersReadingData.data[i].channels[j].actEnergyRcvd);
                const apparentEnergy = parseFloat(metersReadingData.data[i].channels[j].apparentEnergy);
                const reactEnergyLagg = parseFloat(metersReadingData.data[i].channels[j].reactEnergyLagg);
                const reactEnergyLead = parseFloat(metersReadingData.data[i].channels[j].reactEnergyLead);
                const instantaneousDemand = parseFloat(metersReadingData.data[i].channels[j].instantaneousDemand);
                const activePower = parseFloat((metersReadingData.data[i].channels[j].activePower) / 1000);
                const apparentPower = parseFloat((metersReadingData.data[i].channels[j].apparentPower) / 1000);
                const reactivePower = parseFloat((metersReadingData.data[i].channels[j].reactivePower) / 1000);
                const pwrFactor = parseFloat(metersReadingData.data[i].channels[j].pwrFactor);
                const voltage = parseFloat(metersReadingData.data[i].channels[j].voltage);
                const current = parseFloat(metersReadingData.data[i].channels[j].current);
                const freq = parseFloat(metersReadingData.data[i].channels[j].freq);

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

        const updateProductionPowerModeOrDeviceInfo = !this.checkDeviceInfo ? false : (this.installerPasswd && this.envoyDevId.length == 9) ? this.updateProductionPowerModeData() : this.getDeviceInfo();
      }
    } catch (error) {
      this.log.error('Device: %s %s, metersReadingData error: %s', this.host, this.name, error);
      this.checkDeviceInfo = true;
    };
  }

  async updateProductionPowerModeData() {
    this.log.debug('Device: %s %s, requesting powerModeData.', this.host, this.name);

    try {
      const powerModeUrl = ENVOY_API_URL.PowerForcedModePutGet.replace("EID", this.envoyDevId);
      const options = {
        method: 'GET',
        url: this.url + powerModeUrl,
        headers: {
          Accept: 'application/json'
        }
      }

      const powerModeData = await this.digestAuth.request(options);
      this.log.debug('Debug powerModeData: %s', powerModeData.data);

      if (powerModeData.status == 200) {
        const productionPowerMode = (powerModeData.data.powerForcedOff == false);

        if (this.envoysService) {
          this.envoysService[0]
            .updateCharacteristic(Characteristic.enphaseEnvoyProductionPowerMode, productionPowerMode)
        }
        this.productionPowerMode = productionPowerMode;

        const getaDeviceInfo = !this.checkDeviceInfo ? false : this.getDeviceInfo();
      }
    } catch (error) {
      this.log.error('Device: %s %s, powerModeData error: %s', this.host, this.name, error);
      this.checkDeviceInfo = true;
    };
  }

  async updateCommLevelData() {
    this.log.debug('Device: %s %s, requesting pcuCommLevelData.', this.host, this.name);

    try {
      const options = {
        method: 'GET',
        url: this.url + ENVOY_API_URL.InverterComm,
        headers: {
          Accept: 'application/json'
        }
      }

      const pcuCommLevelData = await this.digestAuth.request(options);
      this.log.debug('Debug pcuCommCheck: %s', pcuCommLevelData.data);

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
          const key = `${this.microinvertersSerialNumber[i]}`;
          const value = (commLevel[key] != undefined) ? (commLevel[key]) * 20 : 0;
          if (this.microinvertersService) {
            this.microinvertersService[i]
              .updateCharacteristic(Characteristic.enphaseMicroinverterCommLevel, value)
          }
          this.microinvertersCommLevel.push(value);
        }

        for (let i = 0; i < acBatteriesCount; i++) {
          const key = `${this.acBatteriesSerialNumber[i]}`;
          const value = (commLevel[key] != undefined) ? (commLevel[key]) * 20 : 0;

          if (this.acBatteriesService) {
            this.acBatteriesService[i]
              .updateCharacteristic(Characteristic.enphaseAcBatterieCommLevel, value)
          }
          this.acBatteriesCommLevel.push(value);
        }

        for (let i = 0; i < qRelaysCount; i++) {
          const key = `${this.qRelaysSerialNumber[i]}`;
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
      }
    } catch (error) {
      this.log.error('Device: %s %s, pcuCommLevelData error: %s', this.host, this.name, error);
      this.envoyCheckCommLevel = false;
    };
  }

  async getDeviceInfo() {
    this.log.debug('Device: %s %s, requesting getDeviceInfo.', this.host, this.name);

    try {
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

      this.log('-------- %s --------', this.name);
      this.log('Manufacturer: Enphase');
      this.log('Model: %s', devicePn);
      this.log('Firmware: %s', deviceSoftware);
      this.log('SerialNr: %s', deviceSn);
      this.log('Time: %s', time);
      this.log('------------------------------');
      this.log('Q-Relays: %s', qRelaysCount);
      this.log('Inverters: %s', microinvertersCount);
      this.log('Batteries: %s', acBatteriesCount);
      this.log('--------------------------------');
      this.log('Meters: %s', metersInstalled ? 'Yes' : 'No');
      if (metersInstalled) {
        this.log('Production: %s', metersProductionEnabled ? 'Enabled' : 'Disabled');
        this.log('Consumption: %s', metersConsumptionEnabled ? 'Enabled' : 'Disabled');
        this.log('--------------------------------');
      }
      this.log('Ensemble: %s', ensembleInstalled ? 'Yes' : 'Not installed');
      if (ensembleInstalled) {
        this.log('Enpower: %s', enpowerInstalled ? 'Yes' : 'No');
        this.log('Encharges: %s', enchargesCount);
        this.log('Wireless Kit: %s', wirelessConnectionKitInstalled ? 'Yes' : 'No');
      }
      this.log('--------------------------------');

      this.checkDeviceInfo = false;
      this.checkDeviceState = true;
      const startPrepareAccessory = this.startPrepareAccessory ? this.prepareAccessory() : false;
    } catch (error) {
      this.log.error('Device: %s %s, getDeviceInfo eror: %s.', this.host, this.name, error);
      this.checkDeviceInfo = true;
    };
  }

  //Prepare accessory
  prepareAccessory() {
    this.log.debug('prepareAccessory');
    const accessoryName = this.name;
    const accessoryUUID = UUID.generate(this.envoySerialNumber);
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
    const enphaseEnvoyService = new Service.enphaseEnvoyService(`Envoy ${this.envoySerialNumber}`, 'enphaseEnvoyService');
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyAlerts)
      .onGet(async () => {
        const value = this.envoyAlerts;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s, alerts: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface)
      .onGet(async () => {
        const value = this.envoyPrimaryInterface;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s, network interface: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm)
      .onGet(async () => {
        const value = this.envoyWebComm;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s, web communication: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten)
      .onGet(async () => {
        const value = this.envoyEverReportedToEnlighten;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s, report to enlighten: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel)
      .onGet(async () => {
        const value = `${this.envoyCommNum} / ${this.envoyCommLevel}`;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s, communication Devices and level: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel)
      .onGet(async () => {
        const value = `${this.envoyCommNsrbNum} / ${this.envoyCommNsrbLevel}`;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s, communication qRelays and level: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel)
      .onGet(async () => {
        const value = `${this.envoyCommPcuNum} / ${this.envoyCommPcuLevel}`;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s, communication Microinverters and level: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    if (acBatteriesInstalled) {
      enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel)
        .onGet(async () => {
          const value = `${this.envoyCommAcbNum} / ${this.envoyCommAcbLevel}`;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, envoy: %s, communication AC Batteries and level %s', this.host, accessoryName, this.envoySerialNumber, value);
          }
          return value;
        });
    }
    if (enchargesInstalled) {
      enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumEnchgAndLevel)
        .onGet(async () => {
          const value = `${this.envoyCommEnchgNum} / ${this.envoyCommEnchgLevel}`;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, envoy: %s, communication Encharges and level %s', this.host, accessoryName, this.envoySerialNumber, value);
          }
          return value;
        });
    }
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyDbSize)
      .onGet(async () => {
        const value = `${this.envoyDbSize} / ${this.envoyDbPercentFull}%`;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s, data base size: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyTariff)
      .onGet(async () => {
        const value = this.envoyTariff;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s, tariff: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyUpdateStatus)
      .onGet(async () => {
        const value = this.envoyUpdateStatus;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s, update status: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyFirmware)
      .onGet(async () => {
        const value = this.envoyFirmware;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s, firmware: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyTimeZone)
      .onGet(async () => {
        const value = this.envoyTimeZone;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s, time zone: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime)
      .onGet(async () => {
        const value = `${this.envoyCurrentDate} ${this.envoyCurrentTime}`;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s, current date and time: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporDate)
      .onGet(async () => {
        const value = this.envoyLastEnlightenReporDate;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s, last report to enlighten: %s', this.host, accessoryName, this.envoySerialNumber, value);
        }
        return value;
      });
    if (enpowerInstalled) {
      enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyEnpowerConnected)
        .onGet(async () => {
          const value = this.envoyEnpowerConnected;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, envoy: %s, enpower connected: %s', this.host, accessoryName, this.envoySerialNumber, value);
          }
          return value;
        });
      enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyEnpowerGridStatus)
        .onGet(async () => {
          const value = this.envoyEnpowerGridStatus;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, envoy: %s, enpower grid status: %s', this.host, accessoryName, this.envoySerialNumber, value);
          }
          return value;
        });
    }
    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel)
      .onGet(async () => {
        const state = this.envoyCheckCommLevel;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s, checking comm level: %s', this.host, accessoryName, this.envoySerialNumber, state ? 'Yes' : 'No');
        }
        return state;
      })
      .onSet(async (state) => {
        this.envoyCheckCommLevel = state;
        this.updateCommLevelData();
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, envoy: %s, check comm level: %s', this.host, accessoryName, this.envoySerialNumber, state ? 'Yes' : 'No');
        }
      });
    if (this.installerPasswd && this.envoyDevId.length == 9) {
      enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyProductionPowerMode)
        .onGet(async () => {
          const state = this.productionPowerMode;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, envoy: %s, production power mode state: %s', this.host, accessoryName, this.envoySerialNumber, state ? 'Enabled' : 'Disabled');
          }
          return state;
        })
        .onSet(async (state) => {
          try {
            const powerModeUrl = ENVOY_API_URL.PowerForcedModePutGet.replace("EID", this.envoyDevId);
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

            const powerModeData = await this.digestAuth.request(options);
            this.log.debug('Debug set powerModeData: %s', powerModeData.res, powerModeData.headers, powerModeData.data);
          } catch (error) {
            this.log.debug('Device: %s %s, set powerModeData error: %s', this.host, this.name, error);
          };
        });
    }

    this.envoysService.push(enphaseEnvoyService);
    accessory.addService(this.envoysService[0]);

    //qrelays
    if (qRelaysInstalled) {
      this.qRelaysService = new Array();
      for (let i = 0; i < qRelaysCount; i++) {
        const enphaseQrelayService = new Service.enphaseQrelayService(`Q-Relay ${this.qRelaysSerialNumber[i]}`, `enphaseQrelayService${i}`);
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayState)
          .onGet(async () => {
            const value = this.qRelaysRelay[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s, relay state: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLinesCount)
          .onGet(async () => {
            const value = this.qRelaysLinesCount[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s, lines: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        if (this.qRelaysLinesCount[i] > 0) {
          enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLine1Connected)
            .onGet(async () => {
              const value = this.qRelaysLine1Connected[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, qrelay: %s, line 1: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Closed' : 'Open');
              }
              return value;
            });
        }
        if (this.qRelaysLinesCount[i] >= 2) {
          enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLine2Connected)
            .onGet(async () => {
              const value = this.qRelaysLine2Connected[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, qrelay: %s, line 2: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Closed' : 'Open');
              }
              return value;
            });
        }
        if (this.qRelaysLinesCount[i] >= 3) {
          enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLine3Connected)
            .onGet(async () => {
              const value = this.qRelaysLine3Connected[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, qrelay: %s, line 3: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Closed' : 'Open');
              }
              return value;
            });
        }
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayProducing)
          .onGet(async () => {
            const value = this.qRelaysProducing[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s, producing: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayCommunicating)
          .onGet(async () => {
            const value = this.qRelaysCommunicating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s, communicating: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayProvisioned)
          .onGet(async () => {
            const value = this.qRelaysProvisioned[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s, provisioned: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayOperating)
          .onGet(async () => {
            const value = this.qRelaysOperating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s, operating: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayCommLevel)
          .onGet(async () => {
            const value = (this.updateCommLevel && this.qRelaysCommLevel[i] != undefined) ? this.qRelaysCommLevel[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s, communication level: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayStatus)
          .onGet(async () => {
            const value = this.qRelaysStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s, status: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayFirmware)
          .onGet(async () => {
            const value = this.qRelaysFirmware[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s, firmware: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
            return value;
          });
        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLastReportDate)
          .onGet(async () => {
            const value = this.qRelaysLastReportDate[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, qrelay: %s, last report: %s', this.host, accessoryName, this.qRelaysSerialNumber[i], value);
            }
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
        const enphaseMeterService = new Service.enphaseMeterService(`Meter ${this.metersMeasurementType[i]}`, `enphaseMeterService${i}`);
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterState)
          .onGet(async () => {
            const value = this.metersState[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s, state: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterPhaseMode)
          .onGet(async () => {
            const value = this.metersPhaseMode[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s, phase mode: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterPhaseCount)
          .onGet(async () => {
            const value = this.metersPhaseCount[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s, phase count: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterMeteringStatus)
          .onGet(async () => {
            const value = this.metersMeteringStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s, metering status: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterStatusFlags)
          .onGet(async () => {
            const value = this.metersStatusFlags[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s, status flag: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterActivePower)
          .onGet(async () => {
            const value = this.activePowerSumm[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s, active power: %s kW', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterApparentPower)
          .onGet(async () => {
            const value = this.apparentPowerSumm[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s, apparent power: %s kVA', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterReactivePower)
          .onGet(async () => {
            const value = this.reactivePowerSumm[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s, reactive power: %s kVAr', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterPwrFactor)
          .onGet(async () => {
            const value = this.pwrFactorSumm[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s, power factor: %s cos φ', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterVoltage)
          .onGet(async () => {
            const value = this.voltageSumm[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s, voltage: %s V', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterCurrent)
          .onGet(async () => {
            const value = this.currentSumm[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s, current: %s A', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterFreq)
          .onGet(async () => {
            const value = this.freqSumm[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s, frequency: %s Hz', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
            return value;
          });
        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterReadingTime)
          .onGet(async () => {
            const value = this.timestampSumm[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, Meter: %s, last report: %s', this.host, accessoryName, this.metersMeasurementType[i], value);
            }
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
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production power: %s kW', this.host, accessoryName, value);
        }
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphasePowerMax)
      .onGet(async () => {
        const value = this.productionPowerMax;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production power max: %s kW', this.host, accessoryName, value);
        }
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphasePowerMaxDetected)
      .onGet(async () => {
        const value = this.productionPowerMaxDetectedState;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production power max detected: %s', this.host, accessoryName, value ? 'Yes' : 'No');
        }
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphaseEnergyToday)
      .onGet(async () => {
        const value = this.productionEnergyToday;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production energy today: %s kWh', this.host, accessoryName, value);
        }
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
      .onGet(async () => {
        const value = this.productionEnergyLastSevenDays;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production energy last seven days: %s kWh', this.host, accessoryName, value);
        }
        return value;
      });
    enphaseProductionService.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
      .onGet(async () => {
        const value = this.productionEnergyLifeTime;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production energy lifetime: %s kWh', this.host, accessoryName, value);
        }
        return value;
      });
    if (metersInstalled && metersProductionEnabled) {
      enphaseProductionService.getCharacteristic(Characteristic.enphaseRmsCurrent)
        .onGet(async () => {
          const value = this.productionRmsCurrent;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, production current: %s A', this.host, accessoryName, value);
          }
          return value;
        });
      enphaseProductionService.getCharacteristic(Characteristic.enphaseRmsVoltage)
        .onGet(async () => {
          const value = this.productionRmsVoltage;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, production voltage: %s V', this.host, accessoryName, value);
          }
          return value;
        });
      enphaseProductionService.getCharacteristic(Characteristic.enphaseReactivePower)
        .onGet(async () => {
          const value = this.productionReactivePower;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, production net reactive power: %s kVAr', this.host, accessoryName, value);
          }
          return value;
        });
      enphaseProductionService.getCharacteristic(Characteristic.enphaseApparentPower)
        .onGet(async () => {
          const value = this.productionApparentPower;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, production net apparent power: %s kVA', this.host, accessoryName, value);
          }
          return value;
        });
      enphaseProductionService.getCharacteristic(Characteristic.enphasePwrFactor)
        .onGet(async () => {
          const value = this.productionPwrFactor;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, production power factor: %s cos φ', this.host, accessoryName, value);
          }
          return value;
        });
    }
    enphaseProductionService.getCharacteristic(Characteristic.enphaseReadingTime)
      .onGet(async () => {
        const value = this.productionReadingTime;
        if (!this.disableLogInfo) {
          this.log('Device: %s %s, production last report: %s', this.host, accessoryName, value);
        }
        return value;
      });
    this.productionsService.push(enphaseProductionService);
    accessory.addService(this.productionsService[0]);

    //power and energy consumption
    if (metersInstalled && metersConsumptionEnabled) {
      this.consumptionsService = new Array();
      for (let i = 0; i < metersConsumptionCount; i++) {
        const enphaseConsumptionService = new Service.enphasePowerAndEnergyService(`Power And Energy ${this.consumptionMeasurmentType[i]}`, `enphaseConsumptionService${i}`);
        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePower)
          .onGet(async () => {
            const value = (this.consumptionPower[i] != undefined) ? this.consumptionPower[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s %s, power: %s kW', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePowerMax)
          .onGet(async () => {
            const value = (this.consumptionPowerMax[i] != undefined) ? this.consumptionPowerMax[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s %s, power max: %s kW', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePowerMaxDetected)
          .onGet(async () => {
            const value = (this.consumptionPowerMaxDetected[i] != undefined) ? this.consumptionPowerMaxDetected[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s %s, power max detected: %s', this.host, accessoryName, this.consumptionMeasurmentType[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyToday)
          .onGet(async () => {
            const value = (this.consumptionEnergyToday[i] != undefined) ? this.consumptionEnergyToday[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s %s, energy today: %s kWh', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
          .onGet(async () => {
            const value = (this.consumptionEnergyLastSevenDays[i] != undefined) ? this.consumptionEnergyLastSevenDays[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s %s, energy last seven days: %s kWh', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
          .onGet(async () => {
            const value = (this.consumptionEnergyLifeTime[i] != undefined) ? this.consumptionEnergyLifeTime[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s %s, total energy lifetime: %s kWh', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseRmsCurrent)
          .onGet(async () => {
            const value = (this.consumptionRmsCurrent[i] != undefined) ? this.consumptionRmsCurrent[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s %s, total current: %s A', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseRmsVoltage)
          .onGet(async () => {
            const value = (this.consumptionRmsVoltage[i] != undefined) ? this.consumptionRmsVoltage[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s %s, total voltage: %s V', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseReactivePower)
          .onGet(async () => {
            const value = (this.consumptionReactivePower[i] != undefined) ? this.consumptionReactivePower[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s %s, total reactive power: %s kVAr', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseApparentPower)
          .onGet(async () => {
            const value = (this.consumptionApparentPower[i] != undefined) ? this.consumptionApparentPower[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s %s, total apparent power: %s kVA', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePwrFactor)
          .onGet(async () => {
            const value = (this.consumptionPwrFactor[i] != undefined) ? this.consumptionPwrFactor[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s %s, total power factor: %s cos φ', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
          });
        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseReadingTime)
          .onGet(async () => {
            const value = (this.consumptionReadingTime[i] != undefined) ? this.consumptionReadingTime[i] : '';
            if (!this.disableLogInfo) {
              this.log('Device: %s %s %s, total last report: %s', this.host, accessoryName, this.consumptionMeasurmentType[i], value);
            }
            return value;
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
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, ac bateries storage power: %s kW', this.host, accessoryName, value);
          }
          return value;
        });
      enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryEnergy)
        .onGet(async () => {
          const value = this.acBatteriesSummaryEnergy;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, ac bateries storage energy: %s kWh', this.host, accessoryName, value);
          }
          return value;
        });
      enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryPercentFull)
        .onGet(async () => {
          const value = this.acBatteriesSummaryPercentFull;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, ac bateries percent full: %s', this.host, accessoryName, value);
          }
          return value;
        });
      enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryActiveCount)
        .onGet(async () => {
          const value = this.acBatteriesSummaryActiveCount;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, ac bateries devices count: %s', this.host, accessoryName, value);
          }
          return value;
        });
      enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryState)
        .onGet(async () => {
          const value = this.acBatteriesSummaryState;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, ac bateries state: %s', this.host, accessoryName, value);
          }
          return value;
        });
      enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryReadingTime)
        .onGet(async () => {
          const value = this.acBatteriesSummaryReadingTime;
          if (!this.disableLogInfo) {
            this.log('Device: %s %s, ac bateries: %s last report: %s', this.host, accessoryName, value);
          }
          return value;
        });
      this.acBatteriesSummaryService.push(enphaseAcBatterieSummaryService);
      accessory.addService(this.acBatteriesSummaryService[0]);

      //ac batteries state
      this.acBatteriesService = new Array();
      for (let i = 0; i < acBatteriesCount; i++) {
        const enphaseAcBatterieService = new Service.enphaseAcBatterieService(`AC Batterie ${this.acBatteriesSerialNumber[i]}`, `enphaseAcBatterieService${i}`);
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieChargeStatus)
          .onGet(async () => {
            const value = this.acBatteriesChargeStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, ac batterie: %s charge status %s', this.host, accessoryName, this.acBatteriesSerialNumber[i], value);
            }
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieProducing)
          .onGet(async () => {
            const value = this.acBatteriesProducing[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, ac batterie: %s producing: %s', this.host, accessoryName, this.acBatteriesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieCommunicating)
          .onGet(async () => {
            const value = this.acBatteriesCommunicating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, ac batterie: %s communicating: %s', this.host, accessoryName, this.acBatteriesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieProvisioned)
          .onGet(async () => {
            const value = this.acBatteriesProvisioned[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, ac batterie: %s provisioned: %s', this.host, accessoryName, this.acBatteriesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieOperating)
          .onGet(async () => {
            const value = this.acBatteriesOperating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, ac batterie: %s operating: %s', this.host, accessoryName, this.acBatteriesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieCommLevel)
          .onGet(async () => {
            const value = (this.updateCommLevel && this.acBatteriesCommLevel[i] != undefined) ? this.acBatteriesCommLevel[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, ac batterie: %s comm. level: %s', this.host, accessoryName, this.acBatteriesSerialNumber[i], value);
            }
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieSleepEnabled)
          .onGet(async () => {
            const value = this.acBatteriesSleepEnabled[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, ac batterie: %s sleep: %s', this.host, accessoryName, this.acBatteriesSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatteriePercentFull)
          .onGet(async () => {
            const value = this.acBatteriesPercentFull[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, ac batterie: %s percent full: %s %', this.host, accessoryName, this.acBatteriesSerialNumber[i], value);
            }
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieMaxCellTemp)
          .onGet(async () => {
            const value = this.acBatteriesMaxCellTemp[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, ac batterie: %s max cell temp: %s °C', this.host, accessoryName, this.acBatteriesSerialNumber[i], value);
            }
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieSleepMinSoc)
          .onGet(async () => {
            const value = this.acBatteriesSleepMinSoc[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, ac batterie: %s sleep min soc: %s min', this.host, accessoryName, this.acBatteriesSerialNumber[i], value);
            }
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieSleepMaxSoc)
          .onGet(async () => {
            const value = this.acBatteriesSleepMaxSoc[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, ac batterie: %s sleep max soc: %s min', this.host, accessoryName, this.acBatteriesSerialNumber[i], value);
            }
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieStatus)
          .onGet(async () => {
            const value = this.acBatteriesStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, ac batterie: %s status: %s', this.host, accessoryName, this.acBatteriesSerialNumber[i], value);
            }
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieFirmware)
          .onGet(async () => {
            const value = this.acBatteriesFirmware[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, ac batterie: %s firmware: %s', this.host, accessoryName, this.acBatteriesSerialNumber[i], value);
            }
            return value;
          });
        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieLastReportDate)
          .onGet(async () => {
            const value = this.acBatteriesLastReportDate[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, ac batterie: %s last report: %s', this.host, accessoryName, this.acBatteriesSerialNumber[i], value);
            }
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
        const enphaseMicroinverterService = new Service.enphaseMicroinverterService(`Microinverter ${this.microinvertersSerialNumber[i]}`, `enphaseMicroinverterService${i}`);
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterPower)
          .onGet(async () => {
            let value = this.microinvertersUpdatePower ? this.microinvertersLastPower[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s, last power: %s W', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterPowerMax)
          .onGet(async () => {
            const value = this.microinvertersUpdatePower ? this.microinvertersMaxPower[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s, max power: %s W', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterProducing)
          .onGet(async () => {
            const value = this.microinvertersProducing[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s, producing: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterCommunicating)
          .onGet(async () => {
            const value = this.microinvertersCommunicating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s, communicating: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterProvisioned)
          .onGet(async () => {
            const value = this.microinvertersProvisioned[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s, provisioned: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterOperating)
          .onGet(async () => {
            const value = this.microinvertersOperating[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s, operating: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterCommLevel)
          .onGet(async () => {
            const value = (this.updateCommLevel && this.microinvertersCommLevel[i] != undefined) ? this.microinvertersCommLevel[i] : 0;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s, comm. level: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterStatus)
          .onGet(async () => {
            const value = this.microinvertersStatus[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s, status: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterFirmware)
          .onGet(async () => {
            const value = this.microinvertersFirmware[i];
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s, firmware: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
            return value;
          });
        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterLastReportDate)
          .onGet(async () => {
            const value = this.microinvertersUpdatePower ? this.microinvertersReadingTime[i] : '0';
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, microinverter: %s last report: %s', this.host, accessoryName, this.microinvertersSerialNumber[i], value);
            }
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
          const enphaseEnchargeService = new Service.enphaseEnchargeService(`Encharge ${this.enchargesSerialNumber[i]}`, `enphaseEnchargeService${i}`);
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeAdminStateStr)
            .onGet(async () => {
              const value = this.enchargesAdminStateStr[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s, state %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
              }
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeOperating)
            .onGet(async () => {
              const value = this.enchargesOperating[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s, operating: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
              }
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommunicating)
            .onGet(async () => {
              const value = this.enchargesCommunicating[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s, communicating: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
              }
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommLevelSubGhz)
            .onGet(async () => {
              const value = this.enchargesCommLevelSubGhz[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s, commubication level sub GHz: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
              }
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommLevel24Ghz)
            .onGet(async () => {
              const value = this.enchargesCommLevel24Ghz[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s, communication level 2.4GHz: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
              }
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeSleepEnabled)
            .onGet(async () => {
              const value = this.enchargesSleepEnabled[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s, sleep: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
              }
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargePercentFull)
            .onGet(async () => {
              const value = this.enchargesPercentFull[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s, percent full: %s %', this.host, accessoryName, this.enchargesSerialNumber[i], value);
              }
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeTemperature)
            .onGet(async () => {
              const value = this.enchargesTemperature[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s, temp: %s °C', this.host, accessoryName, this.enchargesSerialNumber[i], value);
              }
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeMaxCellTemp)
            .onGet(async () => {
              const value = this.enchargesMaxCellTemp[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s, max cell temp: %s °C', this.host, accessoryName, this.enchargesSerialNumber[i], value);
              }
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeLedStatus)
            .onGet(async () => {
              const value = this.enchargesLedStatus[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s, LED status: %s min', this.host, accessoryName, this.enchargesSerialNumber[i], value);
              }
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeRealPowerW)
            .onGet(async () => {
              const value = this.enchargesRealPowerW[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s, real power: %s W', this.host, accessoryName, this.enchargesSerialNumber[i], value);
              }
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCapacity)
            .onGet(async () => {
              const value = this.enchargesCapacity[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s, capacity: %s kWh', this.host, accessoryName, this.enchargesSerialNumber[i], value);
              }
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeDcSwitchOff)
            .onGet(async () => {
              const value = this.enchargesDcSwitchOff[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s, status: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value ? 'Yes' : 'No');
              }
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeRev)
            .onGet(async () => {
              const value = this.enchargesRev[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s, revision: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
              }
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeGridProfile)
            .onGet(async () => {
              const value = this.ensembleGridProfileName;
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge %s, grid profile: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
              }
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeStatus)
            .onGet(async () => {
              const value = this.enchargesStatus[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s, status: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
              }
              return value;
            });
          enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeLastReportDate)
            .onGet(async () => {
              const value = this.enchargesLastReportDate[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, encharge: %s, last report: %s', this.host, accessoryName, this.enchargesSerialNumber[i], value);
              }
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
        const enphaseEnpowerService = new Service.enphaseEnpowerService(`Enpower ${this.enpowerSerialNumber}`, 'enphaseEnpowerService');
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerAdminStateStr)
          .onGet(async () => {
            const value = this.enpowerAdminStateStr;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, state %s', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerOperating)
          .onGet(async () => {
            const value = this.enpowerOperating;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, operating: %s', this.host, accessoryName, this.enpowerSerialNumber, value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerCommunicating)
          .onGet(async () => {
            const value = this.enpowerCommunicating;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, communicating: %s', this.host, accessoryName, this.enpowerSerialNumber, value ? 'Yes' : 'No');
            }
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerCommLevelSubGhz)
          .onGet(async () => {
            const value = this.enpowerCommLevelSubGhz;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, comm. level sub GHz: %s', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerCommLevel24Ghz)
          .onGet(async () => {
            const value = this.enpowerCommLevel24Ghz;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, comm. level 2.4GHz: %s', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerTemperature)
          .onGet(async () => {
            const value = this.enpowerTemperature;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, temp: %s °C', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerMainsAdminState)
          .onGet(async () => {
            const value = this.enpowerMainsAdminState;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, mains admin state: %s', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerMainsOperState)
          .onGet(async () => {
            const value = this.enpowerMainsOperState;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, mains operating state: %s', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerEnpwrGridMode)
          .onGet(async () => {
            const value = this.enpowerGridMode;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, grid mode: %s W', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerEnchgGridMode)
          .onGet(async () => {
            const value = this.enpowerEnchgGridMode;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, encharge grid mode: %s', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerGridProfile)
          .onGet(async () => {
            const value = this.ensembleGridProfileName;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower %s, grid profile: %s', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerStatus)
          .onGet(async () => {
            const value = this.enpowerStatus;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower %s, status: %s', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });
        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerLastReportDate)
          .onGet(async () => {
            const value = this.enpowerLastReportDate;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, last report: %s', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });
        this.enpowersService.push(enphaseEnpowerService);
        accessory.addService(this.enpowersService[0]);

        //enpower status
        this.enpowersStatusService = new Array();
        const enphaseEnpowerStatusService = new Service.enphaseEnpowerStatusService(`Enpower Status ${this.enpowerSerialNumber}`, 'enphaseEnpowerStatusService');
        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusFreqBiasHz)
          .onGet(async () => {
            const value = this.enpowerFreqBiasHz;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, bias frequency: %s Hz', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });

        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusVoltageBiasV)
          .onGet(async () => {
            const value = this.enpowerVoltageBiasV;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, bias voltage: %s V', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });

        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusFreqBiasHzQ8)
          .onGet(async () => {
            const value = this.enpowerFreqBiasHzQ8;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, bias q8 frequency: %s Hz', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });

        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusVoltageBiasVQ5)
          .onGet(async () => {
            const value = this.enpowerVoltageBiasVQ5;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, bias q5 voltage: %s V', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });

        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusConfiguredBackupSoc)
          .onGet(async () => {
            const value = this.enpowerConfiguredBackupSoc;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, configured backup SoC: %s %', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });

        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusAdjustedBackupSoc)
          .onGet(async () => {
            const value = this.enpowerAdjustedBackupSoc;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, adjusted backup SoC: %s %', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });

        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusAggSoc)
          .onGet(async () => {
            const value = this.enpowerAggSoc;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, agg SoC: %s %', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });

        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusAggBackupEnergy)
          .onGet(async () => {
            const value = this.enpowerAggBackupEnergy;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, agg backup energy: %s kWh', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });

        enphaseEnpowerStatusService.getCharacteristic(Characteristic.enphaseEnpowerStatusAggAvailEnergy)
          .onGet(async () => {
            const value = this.enpowerAggAvailEnergy;
            if (!this.disableLogInfo) {
              this.log('Device: %s %s, enpower: %s, agg available energy: %s kWh', this.host, accessoryName, this.enpowerSerialNumber, value);
            }
            return value;
          });

        this.enpowersStatusService.push(enphaseEnpowerStatusService);
        accessory.addService(this.enpowersStatusService[0]);
      }

      //wireless connektion kit
      if (wirelessConnectionKitInstalled) {
        this.wirelessConnektionsKitService = new Array();
        for (let i; i < wirelessConnectionKitConnectionsCount; i++) {
          const enphaseWirelessConnectionKitService = new Service.enphaseWirelessConnectionKitService(`Wireless connection ${this.wirelessConnectionsType[i]}`, `enphaseWirelessConnectionKitService${i}`);
          enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitConnected)
            .onGet(async () => {
              const value = this.wirelessConnectionsConnected[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, wireless connection: %s, state: %s', this.host, accessoryName, this.wirelessConnectionsType[i], value ? 'Connected' : 'Disconnected');
              }
              return value;
            });

          enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitSignalStrength)
            .onGet(async () => {
              const value = this.wirelessConnectionsSignalStrength[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, wireless connection: %s, signal strength: %s %', this.host, accessoryName, this.wirelessConnectionsType[i], value);
              }
              return value;
            });

          enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitSignalStrengthMax)
            .onGet(async () => {
              const value = this.wirelessConnectionsSignalStrengthMax[i];
              if (!this.disableLogInfo) {
                this.log('Device: %s %s, wireless connection: %s, signal strength mex: %s %', this.host, accessoryName, this.wirelessConnectionsType[i], value);
              }
              return value;
            });

          this.wirelessConnektionsKitService.push(enphaseWirelessConnectionKitService);
          accessory.addService(this.wirelessConnektionsKitService[i]);
        }
      }
    }

    this.startPrepareAccessory = false;
    this.log.debug('Device: %s, publishExternalAccessories: %s.', this.host, accessoryName);
    this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
  }
}