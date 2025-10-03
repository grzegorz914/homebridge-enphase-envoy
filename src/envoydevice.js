import { promises as fsPromises } from 'fs';
import axios from 'axios';
import { Agent } from 'https';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';
import EventEmitter from 'events';
import RestFul from './restful.js';
import Mqtt from './mqtt.js';
import EnvoyToken from './envoytoken.js';
import DigestAuth from './digestauth.js';
import PasswdCalc from './passwdcalc.js';
import ImpulseGenerator from './impulsegenerator.js';
import { ApiUrls, PartNumbers, Authorization, ApiCodes, MetersKeyMap, DeviceTypeMap, LedStatus, TimezoneLocaleMap } from './constants.js';
let Accessory, Characteristic, Service, Categories, AccessoryUUID;

class EnvoyDevice extends EventEmitter {
    constructor(api, deviceName, host, displayType, envoyFirmware7xxTokenGenerationMode, envoyPasswd, envoyToken, envoyTokenInstaller, enlightenUser, enlightenPasswd, envoyIdFile, envoyTokenFile, device) {
        super();

        Accessory = api.platformAccessory;
        Characteristic = api.hap.Characteristic;
        Service = api.hap.Service;
        Categories = api.hap.Categories;
        AccessoryUUID = api.hap.uuid;

        //device configuration
        this.name = deviceName;
        this.host = host;

        this.envoyFirmware7xxTokenGenerationMode = envoyFirmware7xxTokenGenerationMode;
        this.envoyPasswd = envoyPasswd;
        this.enlightenUser = enlightenUser;
        this.enlightenPassword = enlightenPasswd;
        this.envoyToken = envoyToken;
        this.envoyTokenInstaller = envoyTokenInstaller;

        this.lockControl = device.lockControl || false;
        this.lockControlPrefix = device.lockControlPrefix || false;
        this.lockControTime = device.lockControlTime * 1000 || 30000;
        this.productionStateSensor = device.productionStateSensor || {};
        this.plcLevelControl = device.plcLevelControl || {};

        this.powerProductionSummary = device.powerProductionSummary || 1;
        this.powerProductionLevelSensors = device.powerProductionLevelSensors || [];
        this.energyProductionLevelSensors = device.energyProductionLevelSensors || [];
        this.energyProductionLifetimeOffset = device.energyProductionLifetimeOffset || 0;

        this.powerConsumptionTotalLevelSensors = device.powerConsumptionTotalLevelSensors || [];
        this.energyConsumptionTotalLevelSensors = device.energyConsumptionTotalLevelSensors || [];
        this.energyConsumptionTotalLifetimeOffset = device.energyConsumptionTotalLifetimeOffset || 0;

        this.powerConsumptionNetLevelSensors = device.powerConsumptionNetLevelSensors || [];
        this.energyConsumptionNetLevelSensors = device.energyConsumptionNetLevelSensors || [];
        this.energyConsumptionNetLifetimeOffset = device.energyConsumptionNetLifetimeOffset || 0;

        //grid
        this.gridProductionQualitySensors = device.gridProductionQualitySensors || [];
        this.gridConsumptionTotalQualitySensors = device.gridConsumptionTotalQualitySensors || [];
        this.gridConsumptionNetQualitySensors = device.gridConsumptionNetQualitySensors || [];

        //qRelay
        this.qRelayStateSensor = device.qRelayStateSensor || {};

        //ac battery
        this.acBatterieName = device.acBatterieName || 'AC Batterie';
        this.acBatterieBackupLevelSummaryAccessory = device.acBatterieBackupLevelSummaryAccessory || {};
        this.acBatterieBackupLevelAccessory = device.acBatterieBackupLevelAccessory || {};

        //enpower
        this.enpowerDryContactsControl = envoyFirmware7xxTokenGenerationMode > 0 ? device.enpowerDryContactsControl || false : false;
        this.enpowerDryContactsSensor = envoyFirmware7xxTokenGenerationMode > 0 ? device.enpowerDryContactsSensor || false : false;
        this.enpowerGridStateControl = envoyFirmware7xxTokenGenerationMode > 0 ? device.enpowerGridStateControl || {} : {};
        this.enpowerGridStateSensor = envoyFirmware7xxTokenGenerationMode > 0 ? device.enpowerGridStateSensor || {} : {};
        this.enpowerGridModeSensors = envoyFirmware7xxTokenGenerationMode > 0 ? device.enpowerGridModeSensors || [] : [];

        //encharge
        this.enchargeName = device.enchargeName || 'Encharge';
        this.enchargeBackupLevelSummaryAccessory = envoyFirmware7xxTokenGenerationMode > 0 ? device.enchargeBackupLevelSummaryAccessory || {} : {};
        this.enchargeBackupLevelSummarySensors = envoyFirmware7xxTokenGenerationMode > 0 ? device.enchargeBackupLevelSummarySensors || [] : [];
        this.enchargeBackupLevelAccessory = envoyFirmware7xxTokenGenerationMode > 0 ? device.enchargeBackupLevelAccessory || {} : {};
        this.enchargeStateSensor = envoyFirmware7xxTokenGenerationMode > 0 ? device.enchargeStateSensor || {} : {};
        this.enchargeProfileControls = envoyFirmware7xxTokenGenerationMode > 0 ? device.enchargeProfileControls || [] : [];
        this.enchargeProfileSensors = envoyFirmware7xxTokenGenerationMode > 0 ? device.enchargeProfileSensors || [] : [];
        this.enchargeGridStateSensor = envoyFirmware7xxTokenGenerationMode > 0 ? device.enchargeGridStateSensor || {} : {};
        this.enchargeGridModeSensors = envoyFirmware7xxTokenGenerationMode > 0 ? device.enchargeGridModeSensors || [] : [];


        //solar
        this.solarGridStateSensor = envoyFirmware7xxTokenGenerationMode > 0 ? device.solarGridStateSensor || {} : {};
        this.solarGridModeSensors = envoyFirmware7xxTokenGenerationMode > 0 ? device.solarGridModeSensors || [] : [];

        //generator
        this.generatorStateControl = envoyFirmware7xxTokenGenerationMode > 0 ? device.generatorStateControl || {} : {};
        this.generatorStateSensor = envoyFirmware7xxTokenGenerationMode > 0 ? device.generatorStateSensor || {} : {};
        this.generatorModeContols = envoyFirmware7xxTokenGenerationMode > 0 ? device.generatorModeControls || [] : [];
        this.generatorModeSensors = envoyFirmware7xxTokenGenerationMode > 0 ? device.generatorModeSensors || [] : [];

        //data refresh
        this.dataRefreshControl = device.dataRefreshControl || {};
        this.dataRefreshSensor = device.dataRefreshSensor || {};
        this.productionDataRefreshTime = device.productionDataRefreshTime * 1000 || 10000;
        this.liveDataRefreshTime = device.liveDataRefreshTime * 1000 || 3000;
        this.ensembleDataRefreshTime = device.ensembleDataRefreshTime * 1000 || 15000;

        //log
        this.logDeviceInfo = device.log?.deviceInfo || true;
        this.logInfo = device.log?.info || false;
        this.logWarn = device.log?.warn || true;
        this.logError = device.log?.error || true;
        this.logDebug = device.log?.debug || false;

        //external integrations
        this.restFul = device.restFul ?? {};
        this.restFulConnected = false;
        this.mqtt = device.mqtt ?? {};
        this.mqttConnected = false;

        //system
        this.systemAccessory = {
            serviceType: ['', Service.Lightbulb, Service.Fan, Service.HumiditySensor, Service.CarbonMonoxideSensor][displayType],
            characteristicType: ['', Characteristic.On, Characteristic.On, Characteristic.StatusActive, Characteristic.CarbonMonoxideDetected][displayType],
            characteristicType1: ['', Characteristic.Brightness, Characteristic.RotationSpeed, Characteristic.CurrentRelativeHumidity, Characteristic.CarbonMonoxideLevel][displayType],
            state: false
        };

        //production state sensor
        const productionStateSensorDisplayType = this.productionStateSensor.displayType;
        if (productionStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.productionStateSensor.name || 'Production State Sensor';
            sensor.namePrefix = this.productionStateSensor.namePrefix || false;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][productionStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][productionStateSensorDisplayType];
            sensor.state = false;
            this.productionStateActiveSensor = sensor;
        }

        //plc level control
        const plcLevelControlDisplayType = this.plcLevelControl.displayType;
        if (plcLevelControlDisplayType > 0) {
            const tile = {};
            tile.name = this.plcLevelControl.name || 'PLC Level Refresh Control';
            tile.namePrefix = this.plcLevelControl.namePrefix || false;
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][plcLevelControlDisplayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][plcLevelControlDisplayType];
            tile.state = false;
            this.plcLevelActiveControl = tile;
        }

        //data refresh control
        const dataRefreshControlDisplayType = this.dataRefreshControl.displayType;
        if (dataRefreshControlDisplayType > 0) {
            const tile = {};
            tile.name = this.dataRefreshControl.name || 'Data Refresh Control';
            tile.namePrefix = this.dataRefreshControl.namePrefix || false;
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][dataRefreshControlDisplayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][dataRefreshControlDisplayType];
            tile.state = false;
            this.dataRefreshActiveControl = tile;
        }

        //data refresh sensor
        const dataRefreshSensorDisplayType = this.dataRefreshSensor.displayType;
        if (dataRefreshSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.dataRefreshSensor.name || 'Data Refresh Sensor';
            sensor.namePrefix = this.dataRefreshSensor.namePrefix || false;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][dataRefreshSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][dataRefreshSensorDisplayType];
            sensor.state = false;
            this.dataRefreshActiveSensor = sensor;
        }

        //power production sensors
        this.powerProductionLevelActiveSensors = [];
        for (const sensor of this.powerProductionLevelSensors) {
            const displayType = sensor.displayType ?? 0;
            if (displayType === 0) {
                continue;
            };

            sensor.name = sensor.name || 'Power Production Level Sensor';
            sensor.compareMode = sensor.compareMode ?? 0;
            sensor.powerLevel = sensor.powerLevel ?? 0;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.powerProductionLevelActiveSensors.push(sensor);
        }

        this.energyProductionLevelActiveSensors = [];
        for (const sensor of this.energyProductionLevelSensors) {
            const displayType = sensor.displayType ?? 0;
            if (displayType === 0) {
                continue;
            };

            sensor.name = sensor.name || 'Energy Production Levele Sensor';
            sensor.compareMode = sensor.compareMode ?? 0;
            sensor.energyLevel = sensor.energyLevel ?? 0;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.energyProductionLevelActiveSensors.push(sensor);
        }

        //power consumption total sensor
        this.powerConsumptionTotalLevelActiveSensors = [];
        for (const sensor of this.powerConsumptionTotalLevelSensors) {
            const displayType = sensor.displayType ?? 0;
            if (displayType === 0) {
                continue;
            };

            sensor.name = sensor.name || 'Power Consumption Total Level Sensor';
            sensor.compareMode = sensor.compareMode ?? 0;
            sensor.powerLevel = sensor.powerLevel ?? 0;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.powerConsumptionTotalLevelActiveSensors.push(sensor);
        }

        this.energyConsumptionTotalLevelActiveSensors = [];
        for (const sensor of this.energyConsumptionTotalLevelSensors) {
            const displayType = sensor.displayType ?? 0;
            if (displayType === 0) {
                continue;
            };

            sensor.name = sensor.name || 'Energy Consumption Total Level Sensor';
            sensor.compareMode = sensor.compareMode ?? 0;
            sensor.energyLevel = sensor.energyLevel ?? 0;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.energyConsumptionTotalLevelActiveSensors.push(sensor);
        }

        //power consumption net sensor
        this.powerConsumptionNetLevelActiveSensors = [];
        for (const sensor of this.powerConsumptionNetLevelSensors) {
            const displayType = sensor.displayType ?? 0;
            if (displayType === 0) {
                continue;
            };

            sensor.name = sensor.name || 'Power Consumption Net Level Sensor';
            sensor.compareMode = sensor.compareMode ?? 0;
            sensor.powerLevel = sensor.powerLevel ?? 0;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.powerConsumptionNetLevelActiveSensors.push(sensor);
        }

        this.energyConsumptionNetLevelActiveSensors = [];
        for (const sensor of this.energyConsumptionNetLevelSensors) {
            const displayType = sensor.displayType ?? 0;
            if (displayType === 0) {
                continue;
            }

            sensor.name = sensor.name || 'Energy Consumption Net Level Sensor';
            sensor.compareMode = sensor.compareMode ?? 0;
            sensor.energyLevel = sensor.energyLevel ?? 0;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.energyConsumptionNetLevelActiveSensors.push(sensor);
        }

        //grid quality sensors
        this.gridProductionQualityActiveSensors = [];
        for (const sensor of this.gridProductionQualitySensors) {
            const displayType = sensor.displayType ?? 0;
            if (displayType === 0) {
                continue;
            }

            sensor.name = sensor.name || 'Grid Quality Sensor';
            sensor.compareMode = sensor.compareMode ?? 0;
            sensor.compareType = sensor.compareType ?? 0;
            sensor.compareLevel = sensor.compareLevel ?? 0;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.gridProductionQualityActiveSensors.push(sensor);
        }

        this.gridConsumptionTotalQualityActiveSensors = [];
        for (const sensor of this.gridConsumptionTotalQualitySensors) {
            const displayType = sensor.displayType ?? 0;
            if (displayType === 0) {
                continue;
            }

            sensor.name = sensor.name || 'Grid Quality Sensor';
            sensor.compareMode = sensor.compareMode ?? 0;
            sensor.compareMcompareTypeode = sensor.compareType ?? 0;
            sensor.compareLevel = sensor.compareLevel ?? 0;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.gridConsumptionTotalQualityActiveSensors.push(sensor);
        }

        this.gridConsumptionNetQualityActiveSensors = [];
        for (const sensor of this.gridConsumptionNetQualitySensors) {
            const displayType = sensor.displayType ?? 0;
            if (displayType === 0) {
                continue;
            }

            sensor.name = sensor.name || 'Grid Quality Sensor';
            sensor.compareMode = sensor.compareMode ?? 0;
            sensor.compareType = sensor.compareType ?? 0;
            sensor.compareLevel = sensor.compareLevel ?? 0;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.gridConsumptionNetQualityActiveSensors.push(sensor);
        }

        //qRelay
        const qRelayStateSensorDisplayType = this.qRelayStateSensor.displayType ?? 0;
        if (qRelayStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.qRelayStateSensor.name || 'State Sensor';
            sensor.namePrefix = this.qRelayStateSensor.namePrefix || false;
            sensor.multiphase = this.qRelayStateSensor.multiphase || false;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][qRelayStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][qRelayStateSensorDisplayType];
            sensor.state0 = false;
            sensor.state1 = false;
            sensor.state2 = false;
            sensor.state3 = false;
            this.qRelayStateActiveSensor = sensor;
        }

        //ac battery
        const acBatterieBackupLevelSummaryAccessoryDisplayType = this.acBatterieBackupLevelSummaryAccessory.displayType ?? 0;
        if (acBatterieBackupLevelSummaryAccessoryDisplayType > 0) {
            const tile = {};
            tile.namePrefix = this.acBatterieBackupLevelSummaryAccessory.namePrefix || false;
            tile.serviceType = ['', Service.Lightbulb, Service.Fan, Service.HumiditySensor, Service.CarbonMonoxideSensor, Service.Battery][acBatterieBackupLevelSummaryAccessoryDisplayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.StatusActive, Characteristic.CarbonMonoxideDetected, Characteristic.StatusLowBattery][acBatterieBackupLevelSummaryAccessoryDisplayType];
            tile.characteristicType1 = ['', Characteristic.Brightness, Characteristic.RotationSpeed, Characteristic.CurrentRelativeHumidity, Characteristic.CarbonMonoxideLevel, Characteristic.BatteryLevel][acBatterieBackupLevelSummaryAccessoryDisplayType];
            tile.displayType = this.acBatterieBackupLevelSummaryAccessory.displayType;
            tile.minSoc = this.acBatterieBackupLevelSummaryAccessory.minSoc ?? 0;
            tile.state = false;
            tile.backupLevel = 0;
            this.acBatterieBackupLevelSummaryActiveAccessory = tile;
        }

        const acBatterieBackupLevelAccessoryDisplayType = this.acBatterieBackupLevelAccessory.displayType ?? 0;
        if (acBatterieBackupLevelAccessoryDisplayType > 0) {
            const tile = {};
            tile.namePrefix = this.acBatterieBackupLevelAccessory.namePrefix || false;
            tile.serviceType = ['', Service.Battery][acBatterieBackupLevelAccessoryDisplayType];
            tile.characteristicType = ['', Characteristic.StatusLowBattery][acBatterieBackupLevelAccessoryDisplayType];
            tile.characteristicType1 = ['', Characteristic.BatteryLevel][acBatterieBackupLevelAccessoryDisplayType];
            tile.characteristicType2 = ['', Characteristic.ChargingState][acBatterieBackupLevelAccessoryDisplayType];
            tile.displayType = this.acBatterieBackupLevelAccessory.displayType;
            tile.minSoc = this.acBatterieBackupLevelAccessory.minSoc ?? 0;
            this.acBatterieBackupLevelActiveAccessory = tile;
        }

        //enpower
        const enpowerGridStateControlDisplaqyType = this.enpowerGridStateControl.displayType ?? 0;
        if (enpowerGridStateControlDisplaqyType > 0) {
            const tile = {};
            tile.name = this.enpowerGridStateControl.name || 'Enpower Grid State Control';
            tile.namePrefix = this.enpowerGridStateControl.namePrefix || false;
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][enpowerGridStateControlDisplaqyType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][enpowerGridStateControlDisplaqyType];
            tile.state = false;
            this.enpowerGridStateActiveControl = tile;
        }

        const enpowerGridStateSensorDisplayType = this.enpowerGridStateSensor.displayType ?? 0;
        if (enpowerGridStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.enpowerGridStateSensor.name || 'Enpower Grid State Sensor';
            sensor.namePrefix = this.enpowerGridStateSensor.namePrefix || false;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][enpowerGridStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][enpowerGridStateSensorDisplayType];
            sensor.state = false;
            this.enpowerGridStateActiveSensor = sensor;
        }

        this.enpowerGridModeActiveSensors = [];
        for (const sensor of this.enpowerGridModeSensors) {
            const displayType = sensor.displayType ?? 0;
            if (displayType === 0) {
                continue;
            };

            sensor.name = sensor.name || 'Enpower Grid Mode Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.enpowerGridModeActiveSensors.push(sensor);
        }

        //encharge
        const enchargeBackupLevelSummaryAccessoryDisplayType = this.enchargeBackupLevelSummaryAccessory.displayType ?? 0;
        if (enchargeBackupLevelSummaryAccessoryDisplayType > 0) {
            const tile = {};
            tile.namePrefix = this.enchargeBackupLevelSummaryAccessory.namePrefix || false;
            tile.serviceType = ['', Service.Lightbulb, Service.Fan, Service.HumiditySensor, Service.CarbonMonoxideSensor, Service.Battery][enchargeBackupLevelSummaryAccessoryDisplayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.StatusActive, Characteristic.CarbonMonoxideDetected, Characteristic.StatusLowBattery][enchargeBackupLevelSummaryAccessoryDisplayType];
            tile.characteristicType1 = ['', Characteristic.Brightness, Characteristic.RotationSpeed, Characteristic.CurrentRelativeHumidity, Characteristic.CarbonMonoxideLevel, Characteristic.BatteryLevel][enchargeBackupLevelSummaryAccessoryDisplayType];
            tile.displayType = this.enchargeBackupLevelSummaryAccessory.displayType;
            tile.minSoc = this.enchargeBackupLevelSummaryAccessory.minSoc ?? 0;
            tile.state = false;
            tile.backupLevel = 0;
            this.enchargeBackupLevelSummaryActiveAccessory = tile;
        }

        this.enchargeBackupLevelSummaryActiveSensors = [];
        for (const sensor of this.enchargeBackupLevelSummarySensors) {
            const displayType = sensor.displayType ?? 0;
            if (displayType === 0) {
                continue;
            }

            sensor.name = sensor.name || 'Backup Level Sensor';
            sensor.compareMode = sensor.compareMode ?? 0;
            sensor.backupLevel = sensor.backupLevel ?? 0;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.enchargeBackupLevelSummaryActiveSensors.push(sensor);
        }

        const enchargeBackupLevelAccessoryDisplayType = this.enchargeBackupLevelAccessory.displayType ?? 0;
        if (enchargeBackupLevelAccessoryDisplayType > 0) {
            const tile = {};
            tile.namePrefix = this.enchargeBackupLevelAccessory.namePrefix || false;
            tile.serviceType = ['', Service.Battery][enchargeBackupLevelAccessoryDisplayType];
            tile.characteristicType1 = ['', Characteristic.StatusLowBattery][enchargeBackupLevelAccessoryDisplayType];
            tile.characteristicType = ['', Characteristic.BatteryLevel][enchargeBackupLevelAccessoryDisplayType];
            tile.characteristicType2 = ['', Characteristic.ChargingState][enchargeBackupLevelAccessoryDisplayType];
            tile.displayType = this.enchargeBackupLevelAccessory.displayType;
            tile.minSoc = this.enchargeBackupLevelAccessory.minSoc ?? 0;
            this.enchargeBackupLevelActiveAccessory = tile;
        }

        const enchargeStateSensorDisplayType = this.enchargeStateSensor.displayType ?? 0;
        if (enchargeStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.enchargeStateSensor.name || 'State Sensor';
            sensor.namePrefix = this.enchargeStateSensor.namePrefix || false;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][enchargeStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][enchargeStateSensorDisplayType];
            sensor.state = false;
            this.enchargeStateActiveSensor = sensor;
        }

        this.enchargeProfileActiveControls = [];
        for (const tile of this.enchargeProfileControls) {
            const displayType = tile.displayType ?? 0;
            if (displayType === 0) {
                continue;
            }

            tile.name = tile.name || 'Echarge profile Control';
            tile.serviceType = ['', Service.Lightbulb][displayType];
            tile.characteristicType = ['', Characteristic.On][displayType];
            tile.state = false;
            tile.previousState = null;
            this.enchargeProfileActiveControls.push(tile);
        }

        this.enchargeProfileActiveSensors = [];
        for (const sensor of this.enchargeProfileSensors) {
            const displayType = sensor.displayType ?? 0;
            if (displayType === 0) {
                continue;
            };

            sensor.name = sensor.name || 'Profile Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.enchargeProfileActiveSensors.push(sensor);
        }

        const enchargeGridStateSensorDisplayType = this.enchargeGridStateSensor.displayType ?? 0;
        if (enchargeGridStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.enchargeGridStateSensor.name || 'Grid State Sensor';
            sensor.namePrefix = this.enchargeGridStateSensor.namePrefix || false;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][enchargeGridStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][enchargeGridStateSensorDisplayType];
            sensor.state = false;
            this.enchargeGridStateActiveSensor = sensor;
        }

        this.enchargeGridModeActiveSensors = [];
        for (const sensor of this.enchargeGridModeSensors) {
            const displayType = sensor.displayType ?? 0;
            if (displayType === 0) {
                continue;
            };

            sensor.name = sensor.name || 'Grid Mode Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.enchargeGridModeActiveSensors.push(sensor);
        }

        //solar
        const solarGridStateSensorDisplayType = this.solarGridStateSensor.displayType ?? 0;
        if (solarGridStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.solarGridStateSensor.name || 'Solar Grid State Sensor';
            sensor.namePrefix = this.solarGridStateSensor.namePrefix || false;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][solarGridStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][solarGridStateSensorDisplayType];
            sensor.state = false;
            this.solarGridStateActiveSensor = sensor;
        }

        this.solarGridModeActiveSensors = [];
        for (const sensor of this.solarGridModeSensors) {
            const displayType = sensor.displayType ?? 0;
            if (displayType === 0) {
                continue;
            };

            sensor.name = sensor.name || 'Solar Grid Mode Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.solarGridModeActiveSensors.push(sensor);
        }

        //generator
        const generatorStateControlDisplaqyType = this.generatorStateControl.displayType ?? 0;
        if (generatorStateControlDisplaqyType > 0) {
            const tile = {};
            tile.name = this.generatorStateControl.name || 'Generator State Control';
            tile.namePrefix = this.generatorStateControl.namePrefix || false;
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][generatorStateControlDisplaqyType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][generatorStateControlDisplaqyType];
            tile.state = false;
            this.generatorStateActiveControl = tile;
        }

        const generatorStateSensorDisplayType = this.generatorStateSensor.displayType ?? 0;
        if (generatorStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.generatorStateSensor.name || 'Generator State Sensor';
            sensor.namePrefix = this.generatorStateSensor.namePrefix || false;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][generatorStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][generatorStateSensorDisplayType];
            sensor.state = false;
            this.generatorStateActiveSensor = sensor;
        }

        this.generatorModeActiveControls = [];
        for (const tile of this.generatorModeContols) {
            const displayType = tile.displayType ?? 0;
            if (displayType === 0) {
                continue;
            };

            tile.name = tile.name || 'Generator Mode Control';
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][displayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][displayType];
            tile.state = false;
            tile.previousState = null;
            this.generatorModeActiveControls.push(tile);
        }

        this.generatorModeActiveSensors = [];
        for (const sensor of this.generatorModeSensors) {
            const displayType = sensor.displayType ?? 0;
            if (displayType === 0) {
                continue;
            };

            sensor.name = sensor.name || 'Generator Mode Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.generatorModeActiveSensors.push(sensor);
        }

        //setup variables
        this.envoyIdFile = envoyIdFile;
        this.envoyTokenFile = envoyTokenFile;
        this.checkTokenRunning = false;
        this.dataSampling = false;

        //url
        this.url = envoyFirmware7xxTokenGenerationMode > 0 ? `https://${this.host}` : `http://${this.host}`;

        //supported functions
        this.feature = {
            info: {
                devId: '',
                envoyPasswd: '',
                installerPasswd: '',
                firmware: 500,
                tokenRequired: false,
                tokenValid: false,
                cookie: '',
                jwtToken: {
                    generation_time: 0,
                    token: envoyToken,
                    expires_at: 0,
                    installer: this.envoyFirmware7xxTokenGenerationMode === 2 ? this.envoyTokenInstaller : false
                }
            },
            home: {
                supported: false,
                networkInterfaces: {
                    supported: false,
                    installed: false,
                    count: 0
                },
                wirelessConnections: {
                    supported: false,
                    installed: false,
                    count: 0
                },
            },
            inventory: {
                supported: false,
                pcus: {
                    supported: false,
                    installed: false,
                    count: 0
                },
                nsrbs: {
                    supported: false,
                    installed: false,
                    count: 0
                },
                acbs: {
                    supported: false,
                    installed: false,
                    count: 0
                },
                esubs: {
                    supported: false,
                    installed: false,
                    count: 0,
                    encharges: {
                        supported: false,
                        installed: false,
                        count: 0,
                        status: {
                            supported: false
                        },
                        settings: {
                            supported: false
                        },
                        power: {
                            supported: false
                        },
                        tariff: {
                            supported: false
                        },
                    },
                    enpowers: {
                        supported: false,
                        installed: false,
                        count: 0,
                        status: {
                            supported: false
                        },
                        dryContacts: {
                            supported: false,
                            installed: false,
                            count: 0,
                            settings: {
                                supported: false,
                                count: 0
                            }
                        },
                    },
                    collars: {
                        supported: false,
                        installed: false,
                        count: 0,
                    },
                    c6CombinerControllers: {
                        supported: false,
                        installed: false,
                        count: 0,
                    },
                    c6Rgms: {
                        supported: false,
                        installed: false,
                        count: 0,
                    },
                    status: {
                        supported: false
                    },
                    counters: {
                        supported: false
                    },
                    secctrl: {
                        supported: false
                    },
                    relay: {
                        supported: false
                    },
                    generator: {
                        supported: false,
                        installed: false,
                        count: 0,
                        settings: {
                            supported: false
                        }
                    },
                },
            },
            pcuStatus: {
                supported: false
            },
            meters: {
                supported: false,
                installed: false,
                count: 0,
                production: {
                    supported: false,
                    enabled: false
                },
                consumptionNet: {
                    supported: false,
                    enabled: false
                },
                consumptionTotal: {
                    supported: false,
                    enabled: false
                },
                storage: {
                    supported: false,
                    enabled: false
                },
                backfeed: {
                    supported: false,
                    enabled: false
                },
                load: {
                    supported: false,
                    enabled: false
                },
                evse: {
                    supported: false,
                    enabled: false
                },
                pv3p: {
                    supported: false,
                    enabled: false
                },
                generator: {
                    supported: false,
                    enabled: false
                }
            },
            metersReading: {
                supported: false,
                installed: false
            },
            metersReports: {
                supported: false,
                installed: false
            },
            homeData: {
                supported: false
            },
            metersData: {
                supported: false
            },
            detailedDevicesData: {
                supported: false,
                installed: false,
                pcus: {
                    supported: false
                },
                meters: {
                    supported: false
                },
                nsrbs: {
                    supported: false
                },
            },
            pcusData: {
                supported: false,
            },
            nsrbsData: {
                supported: false,
            },
            acbsData: {
                supported: false,
            },
            powerAndEnergyData: {
                supported: false
            },
            ensembleData: {
                supported: false,
            },
            production: {
                supported: false
            },
            productionPdm: {
                supported: false,
                pcu: {
                    supported: false
                },
                eim: {
                    supported: false
                },
                rgm: {
                    supported: false
                },
                pmu: {
                    supported: false
                }
            },
            energyPdm: {
                supported: false,
                production: {
                    supported: false,
                    pcu: {
                        supported: false
                    },
                    eim: {
                        supported: false
                    },
                    rgm: {
                        supported: false
                    },
                    pmu: {
                        supported: false
                    }
                },
                comsumptionNet: {
                    supported: false
                },
                consumptionTotal: {
                    supported: false
                }
            },
            productionCt: {
                supported: false,
                production: {
                    supported: false,
                    pcu: {
                        supported: false
                    },
                    eim: {
                        supported: false
                    }
                },
                consumptionNet: {
                    supported: false
                },
                consumptionTotal: {
                    supported: false
                },
                storage: {
                    supported: false
                }
            },
            ensemble: {
                inventory: {
                    supported: false
                },
                status: {
                    supported: false
                },
                power: {
                    supported: false
                }
            },
            liveData: {
                supported: false
            },
            gridProfile: {
                supported: false
            },
            plcLevel: {
                supported: false,
                pcus: {
                    supported: false
                },
                nsrbs: {
                    supported: false
                },
                acbs: {
                    supported: false
                },
            },
            productionState: {
                supported: false
            },
            backboneApp: {
                supported: false
            }
        };

        //pv object
        this.pv = {
            info: {},
            home: {},
            inventory: {
                pcus: [],
                nsrbs: [],
                acbs: [],
                esubs: {
                    devices: [],
                    encharges: {
                        devices: [],
                        settings: {},
                        tariff: {},
                        tariffRaw: {},
                        ratedPowerSumKw: null,
                        realPowerSumKw: null,
                        phaseA: false,
                        phaseB: false,
                        phaseC: false,
                    },
                    enpowers: [],
                    collars: [],
                    c6CombinerControllers: [],
                    c6Rgms: [],
                    counters: {},
                    secctrl: {},
                    relay: {},
                    generator: {}
                },
            },
            meters: [],
            powerAndEnergy: {
                sources: [],
                production: {
                    pcu: {},
                    eim: {},
                    rgm: {},
                    pmu: {},
                    powerPeak: -100000
                },
                consumptionNet: {
                    powerPeak: -100000
                },
                consumptionTotal: {
                    powerPeak: -100000
                },
            },
            liveData: {},
            gridProfile: {},
            productionState: false,
            plcLevelCheckState: false
        };

        //lock flags
        this.locks = {
            updateHome: false,
            updatePowerandEnergy: false,
            updateEnsemble: false,
            updateLiveData: false,
            updateGridPlc: false
        };

        //impulse generator
        this.impulseGenerator = new ImpulseGenerator()
            .on('updateHome', () => this.handleWithLock('updateHome', async () => {
                if (this.feature.home.supported) await this.updateHome();
                if (this.feature.homeData.supported) await this.updateHomeData();
            }))
            .on('updatePowerandEnergy', () => this.handleWithLock('updatePowerandEnergy', async () => {
                const updateMeters = this.feature.meters.supported ? await this.updateMeters() : false;
                if (updateMeters && this.feature.meters.installed && this.feature.metersReading.installed && !this.feature.metersReports.installed) await this.updateMetersReading(false);
                if (updateMeters && this.feature.meters.installed && this.feature.metersReports.installed) await this.updateMetersReports(false);

                const updateInventory = this.feature.inventory.supported ? await this.updateInventory() : false;
                if (updateInventory && this.feature.pcuStatus.supported && !this.feature.detailedDevicesData.pcus.supported) await this.updatePcuStatus();
                if (updateInventory && this.feature.detailedDevicesData.supported) await this.updateDetailedDevices(false);

                if (updateMeters && this.feature.metersData.supported) await this.updateMetersData();
                if (updateInventory && this.feature.pcusData.supporte) await this.updatePcusData();
                if (updateInventory && this.feature.nsrbsData.supported) await this.updateNsrbsData();

                if (this.feature.production.supported) await this.updateProduction();
                if (this.feature.productionPdm.supported && !this.feature.energyPdm.supported) await this.updateProductionPdm();
                if (this.feature.energyPdm.supported) await this.updateEnergyPdm();

                const updateProductionCt = this.feature.productionCt.supported ? await this.updateProductionCt() : false;
                if ((updateInventory || updateProductionCt) && this.feature.acbsData.supported) await this.updateAcbsData();
                if (this.feature.powerAndEnergyData.supported) await this.updatePowerAndEnergyData();
            }))
            .on('updateEnsemble', () => this.handleWithLock('updateEnsemble', async () => {
                const updateEnsemble = this.feature.ensemble.inventory.supported ? await this.updateEnsembleInventory() : false;
                if (updateEnsemble && this.feature.ensemble.status.supported) await this.updateEnsembleStatus();
                if (updateEnsemble && this.feature.inventory.esubs.encharges.power.supported) await this.updateEnsemblePower();

                const updateEnchargeSettings = updateEnsemble && this.feature.inventory.esubs.encharges.settings.supported ? await this.updateEnchargesSettings() : false;
                if (updateEnchargeSettings && this.feature.inventory.esubs.encharges.tariff.supported) await this.updateTariff();

                const updateDryContacts = updateEnsemble && this.feature.inventory.esubs.enpowers.dryContacts.supported ? await this.updateDryContacts() : false;
                if (updateDryContacts && this.feature.inventory.esubs.enpowers.dryContacts.settings.supported) await this.updateDryContactsSettings();

                const updateGenerator = updateEnsemble && this.feature.inventory.esubs.generator.installed ? await this.updateGenerator() : false;
                if (updateGenerator && this.feature.inventory.esubs.generator.settings.supported) await this.updateGeneratorSettings();
                if (updateEnsemble && this.feature.ensembleData.supported) await this.updateEnsembleData();
            }))
            .on('updateGridPlcAndProductionState', () => this.handleWithLock('updateGridPlc', async () => {
                if (this.feature.gridProfile.supported) await this.updateGridProfile(false);
                if (this.feature.plcLevel.supported) await this.updatePlcLevel(false);
                if (this.feature.productionState.supported) await this.updateProductionState(false);
            }))
            .on('updateLiveData', () => this.handleWithLock('updateLiveData', async () => {
                if (this.feature.liveData.supported) await this.updateLiveData();
            }))
            .on('state', async (state) => {
                this.emit(state ? 'success' : 'warn', `Impulse generator ${state ? 'started' : 'stopped'}`);
                this.dataSampling = state;

                if (this.dataRefreshActiveControl) {
                    this.dataRefreshActiveControl.state = state;
                    this.dataRefreshControlService?.updateCharacteristic(this.dataRefreshActiveControl.characteristicType, state);
                }

                if (this.dataRefreshActiveSensor) {
                    this.dataRefreshActiveSensor.state = state;
                    this.dataRefreshSensorService?.updateCharacteristic(this.dataRefreshActiveSensor.characteristicType, state);
                }

                this.envoyService?.updateCharacteristic(Characteristic.DataSampling, state);

                this.restFulConnected && this.restFul1.update('datasampling', { state });
                this.mqttConnected && this.mqtt1.emit('publish', 'Data Sampling', { state });
            });
    }

    createAxiosInstance(authHeader = null, cookie = null) {
        return axios.create({
            baseURL: this.url,
            headers: {
                Accept: 'application/json',
                ...(authHeader ? { Authorization: authHeader } : {}),
                ...(cookie ? { Cookie: cookie } : {}),
            },
            withCredentials: true,
            httpsAgent: new Agent({
                keepAlive: false,
                rejectUnauthorized: false
            }),
            timeout: 60000
        });
    }

    handleError(error) {
        const errorString = error.toString();
        const tokenNotValid = errorString.includes('status code 401');
        if (tokenNotValid) {
            if (this.checkTokenRunning) {
                return;
            }
            this.feature.info.jwtToken.token = '';
            this.feature.info.tokenValid = false;
            return;
        }
        if (this.logError) this.emit('error', `Impulse generator: ${error}`);
    }

    isValidValue(v) {
        return v !== undefined && v !== null && !(typeof v === 'number' && Number.isNaN(v));
    }

    scaleValue(value, inMin, inMax, outMin, outMax) {
        if (inMax === inMin) return outMin;

        if (value <= inMin) return outMin;
        if (value >= inMax) return outMax;

        const scaled = ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
        return scaled < 1 ? outMin : Math.round(scaled);
    }

    evaluateCompareMode(value, threshold, mode) {
        switch (mode) {
            case 0: return value > threshold;
            case 1: return value >= threshold;
            case 2: return value === threshold;
            case 3: return value < threshold;
            case 4: return value <= threshold;
            case 5: return value !== threshold;
            default: return false;
        }
    }

    formatTimestamp(ts) {
        const timezone = this.pv.home.timeZone;
        const locale = TimezoneLocaleMap[timezone];
        if (!ts) return new Date().toLocaleString(locale, { timeZone: timezone });

        const numeric = Number(ts);
        if (!isNaN(numeric) && Number.isInteger(numeric)) {
            return new Date(numeric * 1000).toLocaleString(locale, {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        }
        return ts;
    }

    async getStatus(status) {
        if (!Array.isArray(status) || status.length === 0) {
            return 'OK';
        }

        const mapped = status.map(a => {
            const value = ApiCodes[a];
            return (typeof value === 'string' && value.trim() !== '') ? value.trim() : a;
        }).filter(Boolean); // Remove any empty/null/undefined values

        if (mapped.length === 0) {
            return 'OK';
        }

        const result = mapped.join(', ');

        // Add ellipsis only if result is actually truncated
        return result.length > 64 ? result.slice(0, 61) + '…' : result;
    }

    async readData(path) {
        try {
            const data = await fsPromises.readFile(path, 'utf-8');
            return data;
        } catch (error) {
            throw new Error(`Read data error: ${error}`);
        }
    }

    async saveData(path, data) {
        try {
            await fsPromises.writeFile(path, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            throw new Error(`Save data error: ${error}`);
        }
    }

    async setOverExternalIntegration(integration, key, value) {
        try {
            let set = false
            switch (key) {
                case 'DataSampling':
                    set = value !== this.dataSampling ? value ? await this.impulseGenerator.start(this.timers) : await this.impulseGenerator.stop() : false;
                    break;
                case 'ProductionState':
                    set = this.feature.productionState.supported ? await this.setProductionState(value) : false;
                    break;
                case 'PlcLevel':
                    set = this.feature.plcLevel.supported ? await this.updatePlcLevel(false) : false;
                    break;
                case 'EnchargeProfile':
                    set = this.feature.inventory.esubs.encharges.tariff.supported ? await this.setEnchargeProfile(value, this.pv.inventory.esubs.encharges.tariff.storageSettings.reservedSoc, this.pv.inventory.esubs.encharges.tariff.storageSettings.chargeFromGrid) : false;
                    break;
                case 'EnchargeReservedSoc':
                    set = this.feature.inventory.esubs.encharges.tariff.supported ? await this.setEnchargeProfile(this.pv.inventory.esubs.encharges.tariff.storageSettings.mode, value, this.pv.inventory.esubs.encharges.tariff.storageSettings.chargeFromGrid) : false;
                    break;
                case 'EnchargeChargeFromGrid':
                    set = this.feature.inventory.esubs.encharges.tariff.supported ? await this.setEnchargeProfile(this.pv.inventory.esubs.encharges.tariff.storageSettings.mode, this.pv.inventory.esubs.encharges.tariff.storageSettings.reservedSoc, value) : false;
                    break;
                case 'EnpowerGridState':
                    set = this.feature.inventory.esubs.enpowers.installed ? await this.setEnpowerGridState(value) : false;
                    break;
                case 'GeneratorMode':
                    set = this.feature.inventory.esubs.generator.installed ? await this.setGeneratorMode(value) : false;
                    break;
                default:
                    if (this.logWarn) this.emit('warn' `${integration}, received key: ${key}, value: ${value}`);
                    break;
            }
            return set;
        } catch (error) {
            throw new Error(`${integration} set key: ${key}, value: ${value}, error: ${error}`);
        }
    }

    async externalIntegrations() {
        try {
            //RESTFul server
            const restFulEnabled = this.restFul.enable || false;
            if (restFulEnabled) {
                this.restFul1 = new RestFul({
                    port: this.restFul.port || 3000,
                    logWarn: this.logWarn,
                    logDebug: this.logDebug,
                })
                    .on('connected', (success) => {
                        this.restFulConnected = true;
                        this.emit('success', success);
                    })
                    .on('set', async (key, value) => {
                        try {
                            await this.setOverExternalIntegration('RESTFul', key, value);
                        } catch (error) {
                            if (this.logWarn) this.emit('warn' `RESTFul set error: ${error}`);
                        };
                    })
                    .on('debug', (debug) => this.emit('debug', debug))
                    .on('warn', (warn) => this.emit('warn', warn))
                    .on('error', (error) => this.emit('error', error));
            }

            const mqttEnabled = this.mqtt.enable || false;
            if (mqttEnabled) {
                this.mqtt1 = new Mqtt({
                    host: this.mqtt.host,
                    port: this.mqtt.port || 1883,
                    clientId: this.mqtt.clientId ? `enphase_${this.mqtt.clientId}_${Math.random().toString(16).slice(3)}` : `enphase_${Math.random().toString(16).slice(3)}`,
                    prefix: this.mqtt.prefix ? `enphase/${this.mqtt.prefix}/${this.name}` : `enphase/${this.name}`,
                    user: this.mqtt.auth?.user,
                    passwd: this.mqtt.auth?.passwd,
                    logWarn: this.logWarn,
                    logDebug: this.logDebug
                })
                    .on('connected', (success) => {
                        this.mqttConnected = true;
                        this.emit('success', success);
                    })
                    .on('subscribed', (success) => {
                        this.emit('success', success);
                    })
                    .on('set', async (key, value) => {
                        try {
                            await this.setOverExternalIntegration('MQTT', key, value);
                        } catch (error) {
                            if (this.logWarn) this.emit('warn' `MQTT set, error: ${error}`);
                        };
                    })
                    .on('debug', (debug) => this.emit('debug', debug))
                    .on('warn', (warn) => this.emit('warn', warn))
                    .on('error', (error) => this.emit('error', error));
            };

            return true;
        } catch (error) {
            if (this.logWarn) this.emit('warn' `External integration start error: ${error}`);
        }
    }

    async startImpulseGenerator() {
        try {
            //start impulse generator 
            await this.impulseGenerator.start(this.timers);
            return true;
        } catch (error) {
            throw new Error(`Impulse generator start error: ${error}`);
        }
    }

    async handleWithLock(lockKey, fn) {
        if (this.locks[lockKey]) return;

        const tokenValid = await this.checkToken();
        if (!tokenValid) return;

        this.locks[lockKey] = true;
        try {
            await fn();
        } catch (error) {
            this.handleError(error);
        } finally {
            this.locks[lockKey] = false;
        }
    }

    async getInfo() {
        if (this.logDebug) this.emit('debug', 'Requesting info');

        try {
            const response = await this.axiosInstance(ApiUrls.GetInfo);
            const xmlString = response.data;

            // XML Parsing options
            const options = {
                ignoreAttributes: false,
                ignorePiTags: true,
                allowBooleanAttributes: true
            };
            const parser = new XMLParser(options);
            const parsed = parser.parse(xmlString);

            // Defensive structure checks
            const envoyInfo = parsed.envoy_info ?? {};
            const device = envoyInfo.device ?? {};
            const buildInfo = envoyInfo.build_info ?? {};

            // Masked debug version
            const debugParsed = {
                ...parsed,
                envoy_info: {
                    ...envoyInfo,
                    device: {
                        ...device,
                        sn: 'removed'
                    }
                }
            };

            if (this.logDebug) this.emit('debug', 'Parsed info:', debugParsed);

            const serialNumber = device.sn?.toString() ?? null;
            if (!serialNumber) {
                if (this.logWarn) this.emit('warn', 'Envoy serial number missing!');
                return null;
            }

            // Construct info object
            const obj = {
                time: envoyInfo.time,
                serialNumber,
                partNumber: device.pn,
                modelName: PartNumbers[device.pn] ?? device.pn,
                software: device.software,
                euaid: device.euaid,
                seqNum: device.seqnum,
                apiVer: device.apiver,
                imeter: !!device.imeter,
                webTokens: !!envoyInfo['web-tokens'],
                packages: envoyInfo.package ?? [],
                buildInfo: {
                    buildId: buildInfo.build_id,
                    buildTimeQmt: buildInfo.build_time_gmt,
                    releaseVer: buildInfo.release_ver,
                    releaseStage: buildInfo.release_stage
                }
            };

            this.pv.info = obj;

            // Feature: meters
            this.feature.meters.supported = obj.imeter;

            // Feature: firmware version
            const cleanedVersion = obj.software?.replace(/\D/g, '') ?? '';
            const parsedFirmware = cleanedVersion ? parseInt(cleanedVersion.slice(0, 3)) : 500;
            this.feature.info.firmware = parsedFirmware;
            this.feature.info.tokenRequired = obj.webTokens;

            // RESTFul + MQTT update
            if (this.restFulConnected) this.restFul1.update('info', parsed);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Info', parsed);

            return true;
        } catch (error) {
            throw new Error(`Update info error: ${error}`);
        }
    }

    async checkToken(start) {
        if (this.logDebug) this.emit('debug', 'Requesting check token');

        if (this.checkTokenRunning) {
            if (this.logDebug) this.emit('debug', 'Token check already running');
            return null;
        }

        if (!this.feature.info.tokenRequired) {
            if (this.logDebug) this.emit('debug', 'Token not required, skipping token check');
            return true;
        }

        this.checkTokenRunning = true;
        try {
            const now = Math.floor(Date.now() / 1000);

            // Load token from file on startup, only if mode is 1
            if (this.envoyFirmware7xxTokenGenerationMode === 1 && start) {
                try {
                    const data = await this.readData(this.envoyTokenFile);
                    try {
                        const parsedData = JSON.parse(data);
                        const fileTokenExist = parsedData.token ? 'Exist' : 'Missing';
                        if (this.logDebug) this.emit('debug', `Token from file: ${fileTokenExist}`);
                        if (parsedData.token) {
                            this.feature.info.jwtToken = parsedData;
                        }
                    } catch (error) {
                        if (this.logWarn) this.emit('warn', `Token parse error: ${error}`);
                    }
                } catch (error) {
                    if (this.logWarn) this.emit('warn', `Read Token from file error: ${error}`);
                }
            }

            const jwt = this.feature.info.jwtToken || {};
            const tokenExist = jwt.token && (this.envoyFirmware7xxTokenGenerationMode === 2 || jwt.expires_at >= now + 60);

            if (this.logDebug) {
                const remaining = jwt.expires_at ? jwt.expires_at - now : 'N/A';
                this.emit('debug', `Token: ${tokenExist ? 'Exist' : 'Missing'}, expires in ${remaining} seconds`);
            }

            const tokenValid = this.feature.info.tokenValid;
            if (this.logDebug) this.emit('debug', `Token: ${tokenValid ? 'Valid' : 'Not valid'}`);

            // RESTFul and MQTT sync
            if (this.restFulConnected) this.restFul1.update('token', jwt);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Token', jwt);

            if (tokenExist && tokenValid) {
                if (this.logDebug) this.emit('debug', 'Token check complete, state: Valid');
                return true;
            }

            if (!tokenExist) {
                if (this.logWarn) this.emit('warn', 'Token not exist, requesting new');
                await this.delayBeforeRetry?.() ?? new Promise(resolve => setTimeout(resolve, 30000));
                const gotToken = await this.getToken();
                if (!gotToken) return null;
            }

            if (!this.feature.info.jwtToken.token) {
                if (this.logWarn) this.emit('warn', 'Token became invalid before validation');
                return null;
            }

            if (this.logWarn) this.emit('warn', 'Token exist but not valid, validating');
            const validated = await this.validateToken();
            if (!validated) return null;

            if (this.logDebug) this.emit('debug', 'Token check complete: Valid=true');
            return true;
        } catch (error) {
            throw new Error(`Check token error: ${error}`);
        } finally {
            this.checkTokenRunning = false;
        }
    }

    async getToken() {
        if (this.logDebug) this.emit('debug', 'Requesting token');

        try {
            // Create EnvoyToken instance and attach log event handlers
            const envoyToken = new EnvoyToken({
                user: this.enlightenUser,
                passwd: this.enlightenPassword,
                serialNumber: this.pv.info.serialNumber,
                logWarn: this.logWarn,
                logError: this.logError,
            })
                .on('success', message => this.emit('success', message))
                .on('warn', warn => this.emit('warn', warn))
                .on('error', error => this.emit('error', error));

            // Attempt to refresh token
            const tokenData = await envoyToken.refreshToken();

            if (!tokenData || !tokenData.token) {
                if (this.logWarn) this.emit('warn', 'Token request returned empty or invalid');
                return null;
            }

            // Mask token in debug output
            const maskedTokenData = {
                ...tokenData,
                token: `${tokenData.token.slice(0, 5)}...<redacted>`
            };
            if (this.logDebug) this.emit('debug', 'Token:', maskedTokenData);

            // Save token in memory
            this.feature.info.jwtToken = tokenData;

            // Persist token to disk
            try {
                await this.saveData(this.envoyTokenFile, tokenData);
            } catch (error) {
                if (this.logError) this.emit('error', `Save token error: ${error}`);
            }

            return true;
        } catch (error) {
            throw new Error(`Get token error: ${error}`);
        }
    }

    async validateToken() {
        if (this.logDebug) this.emit('debug', 'Requesting validate token');

        this.feature.info.tokenValid = false;

        try {
            const jwt = this.feature.info.jwtToken;

            // Create a token-authenticated Axios instance
            const axiosInstance = this.createAxiosInstance(`Bearer ${jwt.token}`, null);

            // Send validation request
            const response = await axiosInstance.get(ApiUrls.CheckJwt);
            const responseBody = response.data;

            // Check for expected response string
            const tokenValid = typeof responseBody === 'string' && responseBody.includes('Valid token');
            if (!tokenValid) {
                if (this.logWarn) this.emit('warn', `Token not valid. Response: ${responseBody}`);
                return null;
            }

            // Extract and validate cookie
            const cookie = response.headers['set-cookie'];
            if (!cookie) {
                if (this.logWarn) this.emit('warn', 'No cookie received during token validation');
                return null;
            }

            // Replace axios instance with cookie-authenticated one
            this.axiosInstance = this.createAxiosInstance(null, cookie);

            // Update internal state
            this.feature.info.tokenValid = true;
            this.feature.info.cookie = cookie;

            this.emit('success', 'Token validate success');
            return true;
        } catch (error) {
            this.feature.info.tokenValid = false;
            throw new Error(`Validate token error: ${error}`);
        }
    }

    async digestAuthorizationEnvoy() {
        if (this.logDebug) this.emit('debug', 'Requesting digest authorization envoy');

        try {
            const deviceSn = this.pv.info.serialNumber;
            const envoyPasswd = this.envoyPasswd || deviceSn.substring(6);

            const isValidPassword = envoyPasswd.length === 6;
            if (this.logDebug) this.emit('debug', 'Digest authorization envoy password:', isValidPassword ? 'Valid' : 'Not valid');

            if (!isValidPassword) {
                if (this.logWarn) this.emit('warn', 'Digest authorization envoy password is not correct, don\'t worry all working correct, only the power and power max of PCU will not be displayed');
                return null;
            }

            this.digestAuthEnvoy = new DigestAuth({
                user: Authorization.EnvoyUser,
                passwd: envoyPasswd
            });

            this.feature.info.envoyPasswd = envoyPasswd;
            return true;
        } catch (error) {
            if (this.logWarn) this.emit('warn', `Digest authorization error: ${error}, don't worry all working correct, only the power and power max of PCU will not be displayed`);
            return null;
        }
    }

    async digestAuthorizationInstaller() {
        if (this.logDebug) this.emit('debug', 'Requesting digest authorization installer');

        try {
            const deviceSn = this.pv.info.serialNumber;

            // Calculate installer password
            const passwdCalc = new PasswdCalc({
                user: Authorization.InstallerUser,
                realm: Authorization.Realm,
                serialNumber: deviceSn
            });

            const installerPasswd = await passwdCalc.getPasswd();
            const isValidPassword = installerPasswd.length > 1;
            if (this.logDebug) this.emit('debug', 'Digest authorization installer password:', isValidPassword ? 'Valid' : 'Not valid');

            if (!isValidPassword) {
                if (this.logWarn) this.emit('warn', `Digest authorization installer password: ${installerPasswd}, is not correct, don't worry all working correct, only the power production state/control and PLC level will not be displayed`);
                return null;
            }

            this.digestAuthInstaller = new DigestAuth({
                user: Authorization.InstallerUser,
                passwd: installerPasswd
            });

            this.feature.info.installerPasswd = installerPasswd;
            return true;
        } catch (error) {
            if (this.logWarn) this.emit('warn', `Digest authorization installer error: ${error}, don't worry all working correct, only the power production state/control and PLC level will not be displayed`);
            return null;
        }
    }

    async getEnvoyDevId() {
        if (this.logDebug) this.emit('debug', 'Requesting envoy dev Id');

        try {
            // Try reading Envoy dev ID from file
            try {
                const response = await this.readData(this.envoyIdFile);
                const envoyDevId = response.toString() ?? '';
                const isValid = envoyDevId.length === 9;

                if (this.logDebug) this.emit('debug', 'Envoy dev Id from file:', isValid ? 'Exist' : 'Missing');

                if (isValid) {
                    this.feature.info.devId = envoyDevId;
                    return true;
                }
            } catch (error) {
                if (this.logWarn) this.emit('warn', `Read envoy dev Id from file error, trying from device: ${error}`);
            }

            // Fallback: Read Envoy dev ID from device (Backbone Application)
            const response = await this.axiosInstance.get(ApiUrls.BackboneApplication);
            const envoyBackboneApp = response.data;
            if (this.logDebug) this.emit('debug', 'Envoy backbone app:', envoyBackboneApp);

            const keyword = 'envoyDevId:';
            const startIndex = envoyBackboneApp.indexOf(keyword);

            if (startIndex === -1) {
                if (this.logWarn) this.emit('warn', `Envoy dev Id not found, don't worry all working correct, only the power production control will not be possible`);
                return null;
            }

            const envoyDevId = envoyBackboneApp.substr(startIndex + keyword.length, 9);
            if (envoyDevId.length !== 9) {
                if (this.logWarn) this.emit('warn', `Envoy dev Id: ${envoyDevId} has wrong format, don't worry all working correct, only the power production control will not be possible`);
                return null;
            }

            // Save dev ID to file
            try {
                await this.saveData(this.envoyIdFile, envoyDevId);
            } catch (error) {
                if (this.logError) this.emit('error', `Save envoy dev Id error: ${error}`);
            }

            // Set in-memory values
            this.feature.info.devId = envoyDevId;
            this.feature.backboneApp.supported = true;

            return true;
        } catch (error) {
            if (this.logWarn) this.emit('warn', `Get envoy dev Id from device error: ${error}, don't worry all working correct, only the power production control will not be possible`);
            return null;
        }
    }

    async updateProductionState(start) {
        if (this.logDebug) this.emit('debug', `Requesting production state`);

        try {
            const url = ApiUrls.PowerForcedModeGetPut.replace("EID", this.feature.info.devId);
            const options = {
                method: 'GET',
                baseURL: this.url,
                headers: { Accept: 'application/json' }
            };

            // Choose axios method based on firmware version
            const response = this.feature.info.tokenRequired ? await this.axiosInstance.get(url) : await this.digestAuthInstaller.request(url, options);
            const productionState = response.data;
            if (this.logDebug) this.emit('debug', `Power mode:`, productionState);

            const hasPowerForcedOff = 'powerForcedOff' in productionState;
            if (hasPowerForcedOff) {
                const state = !productionState.powerForcedOff;
                this.pv.productionState = state;

                this.envoyService?.updateCharacteristic(Characteristic.ProductionState, state);
                if (this.productionStateActiveSensor) {
                    this.productionStateActiveSensor.state = state;
                    this.productionStateSensorService?.updateCharacteristic(this.productionStateActiveSensor.characteristicType, state);
                }
                this.feature.productionState.supported = true;
            }

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('productionstate', productionState);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Production State', productionState);

            return true;
        } catch (error) {
            if (start) {
                if (this.logWarn) this.emit('warn', `Production state not supported, don't worry, all is working correctly. Only the production state monitoring sensor and control will not be displayed.`);
                return null;
            }
            throw new Error(`Update production state error: ${error}`);
        }
    }

    async updateHome() {
        if (this.logDebug) this.emit('debug', 'Requesting home');

        try {
            const response = await this.axiosInstance.get(ApiUrls.Home);
            const home = response.data;
            if (this.logDebug) this.emit('debug', 'Home:', home);

            const comm = home.comm ?? {};
            const network = home.network ?? {};
            const wirelessConnections = home.wireless_connection ?? [];
            const networkInterfaces = network.interfaces ?? [];

            // Communication device support flags
            const microinvertersSupported = 'pcu' in comm;
            const acBatteriesSupported = 'acb' in comm;
            const qRelaysSupported = 'nsrb' in comm;
            const ensemblesSupported = 'esub' in comm;
            const enchargesSupported = 'encharge' in comm;
            this.pv.home = home;

            // Update feature flags
            this.feature.inventory.pcus.supported = microinvertersSupported;
            this.feature.inventory.acbs.supported = acBatteriesSupported;
            this.feature.inventory.nsrbs.supported = qRelaysSupported;
            this.feature.inventory.esubs.supported = ensemblesSupported;
            this.feature.inventory.esubs.encharges.supported = enchargesSupported;

            this.feature.home.networkInterfaces.supported = networkInterfaces.length > 0;
            this.feature.home.networkInterfaces.installed = networkInterfaces.some(i => i.carrier);
            this.feature.home.networkInterfaces.count = networkInterfaces.length;

            this.feature.home.wirelessConnections.supported = wirelessConnections.length > 0;
            this.feature.home.wirelessConnections.installed = wirelessConnections.some(w => w.connected && w.signal_strength > 0);
            this.feature.home.wirelessConnections.count = wirelessConnections.length;

            this.feature.home.supported = true;

            // RESTful + MQTT
            if (this.restFulConnected) this.restFul1.update('home', home);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Home', home);

            return true;
        } catch (error) {
            throw new Error(`Update home error: ${error.message || error}`);
        }
    }

    async updateMeters() {
        if (this.logDebug) this.emit('debug', `Requesting meters info`);

        try {
            const response = await this.axiosInstance.get(ApiUrls.InternalMeterInfo);
            const responseData = response.data;
            if (this.logDebug) this.emit('debug', `Meters:`, responseData);

            // Check if any meters are installed
            const metersInstalled = responseData.length > 0;
            if (metersInstalled) {
                const arr = [];
                for (const meter of responseData) {
                    const measurementType = ApiCodes[meter.measurementType];
                    const key = MetersKeyMap[measurementType];
                    if (!key) {
                        const debug = !this.logDebug ? false : this.emit('debug', `Unknown meter measurement type: ${meter.measurementType}`);
                        continue;
                    }

                    const phaseModeCode = ApiCodes[meter.phaseMode];
                    const meteringStatusCode = ApiCodes[meter.meteringStatus];
                    const voltageDivide = meter.phaseMode === 'split' ? 2 : meter.phaseMode === 'three' ? 3 : 1;
                    const powerFactorDivide = meter.phaseMode === 'split' ? 2 : 1;

                    const obj = {
                        eid: meter.eid,
                        type: 'eim',
                        activeCount: 1,
                        measurementType: meter.measurementType,
                        state: meter.state === 'enabled',
                        phaseMode: phaseModeCode,
                        phaseCount: meter.phaseCount ?? 1,
                        meteringStatus: meteringStatusCode,
                        statusFlags: meter.statusFlags,
                        voltageDivide: voltageDivide,
                        powerFactorDivide: powerFactorDivide,
                    };
                    arr.push(obj);

                    this.feature.meters[key].supported = true;
                    this.feature.meters[key].enabled = obj.state;
                }
                this.pv.meters = arr;
                this.feature.meters.installed = arr.some(m => m.state);
                this.feature.meters.count = arr.length;
            }

            //meters supported
            this.feature.meters.supported = true;

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('meters', responseData);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Meters', responseData);

            return true;
        } catch (error) {
            throw new Error(`Update meters error: ${error}`);
        }
    }

    async updateMetersReading(start) {
        if (this.logDebug) this.emit('debug', `Requesting meters reading`);

        try {
            const response = await this.axiosInstance.get(ApiUrls.InternalMeterReadings);
            const responseData = response.data;
            if (this.logDebug) this.emit('debug', `Meters reading:`, responseData);

            // Check if readings exist and are valid
            const metersReadingInstalled = Array.isArray(responseData) && responseData.length > 0;
            if (metersReadingInstalled) {
                for (const meter of responseData) {
                    const meterConfig = this.pv.meters.find(m => m.eid === meter.eid && m.state === true);
                    if (!meterConfig) continue;

                    const obj = {
                        readingTime: meter.timestamp,
                        power: meter.activePower,
                        apparentPower: meter.apparentPower,
                        reactivePower: meter.reactivePower,
                        energyLifetime: meter.actEnergyDlvd,
                        energyLifetimeUpload: meter.actEnergyRcvd,
                        apparentEnergy: meter.apparentEnergy,
                        current: meter.current,
                        voltage: meter.voltage,
                        pwrFactor: meter.pwrFactor,
                        frequency: meter.freq,
                        channels: meter.channels ?? [],
                    };
                    Object.assign(meterConfig, obj);
                }
                this.feature.metersReading.installed = true;
            }

            //meters readings supported
            this.feature.metersReading.supported = true;

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('metersreading', responseData);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Meters Reading', responseData);

            return true;
        } catch (error) {
            if (start) {
                if (this.logWarn) this.emit('warn', `Meters readings not supported, dont worry all working correct, only some additional data will not be present, error: ${error}`);
                return null;
            }
            throw new Error(`Update meters reading error: ${error}`);
        }
    }

    async updateMetersReports(start) {
        if (this.logDebug) this.emit('debug', `Requesting meters reports`);

        try {
            const response = await this.axiosInstance.get(ApiUrls.InternalMetersReports);
            const responseData = response.data;
            if (this.logDebug) this.emit('debug', `Meters reports:`, responseData);

            // Check if reports exist
            const metersReportsInstalled = Array.isArray(responseData) && responseData.length > 0;
            if (metersReportsInstalled) {
                for (const meter of responseData) {
                    const measurementType = ApiCodes[meter.reportType] ?? meter.reportType;
                    const key = MetersKeyMap[measurementType];
                    if (!key) {
                        const debug = !this.logDebug ? false : this.emit('debug', `Unknown meters reports type: ${measurementType}`);
                        continue;
                    }

                    const meterConfig = key === 'consumptionTotal' ? this.pv.meters.find(m => m.measurementType === 'net-consumption' && m.state === true) : this.pv.meters.find(m => m.measurementType === meter.reportType && m.state === true);
                    if (!meterConfig) continue;

                    const cumulative = meter.cumulative;
                    const obj = {
                        readingTime: meter.createdAt,
                        power: cumulative.actPower,
                        apparentPower: cumulative.apprntPwr,
                        reactivePower: cumulative.reactPwr,
                        energyLifetime: cumulative.whDlvdCum,
                        energyLifetimeUpload: cumulative.whRcvdCum,
                        apparentEnergy: cumulative.vahCum,
                        current: cumulative.rmsCurrent,
                        voltage: cumulative.rmsVoltage,
                        pwrFactor: cumulative.pwrFactor,
                        frequency: cumulative.freqHz,
                        channels: meter.lines ?? [],
                    };

                    // Handle each meter type
                    switch (key) {
                        case 'consumptionTotal':
                            const obj1 = {
                                eid: meterConfig.eid,
                                type: meterConfig.type,
                                activeCount: meterConfig.activeCount,
                                measurementType: 'total-consumption',
                                readingTime: meterConfig.readingTime,
                                state: meterConfig.state,
                                phaseMode: meterConfig.phaseMode,
                                phaseCount: meterConfig.phaseCount,
                                meteringStatus: meterConfig.meteringStatus,
                                statusFlags: meterConfig.statusFlags,
                                voltageDivide: meterConfig.voltageDivide,
                                powerFactorDivide: meterConfig.powerFactorDivide,
                            };
                            this.pv.meters = [...this.pv.meters, { ...obj1, ...obj }];
                            this.feature.meters[key].supported = true;
                            this.feature.meters[key].enabled = true;
                            break;
                        default:
                            Object.assign(meterConfig, obj);
                            break;
                    }
                }
                this.feature.metersReports.installed = true;
            }

            //meters reports supported
            this.feature.metersReports.supported = true;

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('metersreports', responseData);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Meters Reports', responseData);

            return true;
        } catch (error) {
            if (start) {
                if (this.logWarn) this.emit('warn', `Meters reports not supported, dont worry all working correct, only some additional data will not be present, error: ${error}`);
                return null;
            }
            throw new Error(`Update meters reports error: ${error}`);
        }
    }

    async updateInventory() {
        if (this.logDebug) this.emit('debug', 'Requesting inventory');

        try {
            const response = await this.axiosInstance.get(ApiUrls.Inventory);
            const inventory = response.data;
            if (this.logDebug) this.emit('debug', 'Inventory:', inventory);

            const parseDeviceCommon = (device) => ({
                partNumber: device.part_num,
                installed: device.installed,
                serialNumber: device.serial_num,
                deviceStatus: device.device_status,
                readingTime: device.last_rpt_date,
                adminState: device.admin_state,
                devType: device.dev_type,
                createdDate: device.created_date,
                imageLoadDate: device.img_load_date,
                firmware: device.img_pnum_running,
                ptpn: device.ptpn,
                chaneId: device.chaneid,
                deviceControl: device.device_control,
                producing: device.producing,
                communicating: device.communicating,
                operating: device.operating,
                provisioned: device.provisioned,
            });

            const parseMicroinverters = (devices) => devices.slice(0, 70).map(device => ({
                type: 'pcu',
                ...parseDeviceCommon(device),
                phase: device.phase
            }));

            const parseAcBatteries = (devices) => devices.map(device => ({
                type: 'acb',
                ...parseDeviceCommon(device),
                sleepEnabled: device.sleep_enabled,
                percentFull: device.percentFull,
                maxCellTemp: device.maxCellTemp,
                sleepMinSoc: device.sleep_min_soc,
                sleepMaxSoc: device.sleep_max_soc,
                chargeState: device.charge_status
            }));

            const parseQRelays = (devices) => devices.map(device => ({
                type: 'nsrb',
                ...parseDeviceCommon(device),
                relay: device.relay,
                relayState: device.relay,
                reasonCode: device.reason_code,
                reason: device.reason,
                linesCount: device['line-count'],
                line1Connected: device['line1-connected'],
                line2Connected: device['line2-connected'],
                line3Connected: device['line3-connected']
            }));

            const parseEnsembles = (devices) => devices.map(device => ({
                type: 'esub',
                ...parseDeviceCommon(device),
            }));

            const inventoryKeys = inventory.map(i => i.type);
            const getDevicesByType = (type) => inventory.find(i => i.type === type)?.devices ?? [];

            // Microinverters
            const microinverters = getDevicesByType('PCU');
            this.feature.inventory.pcus.supported = inventoryKeys.includes('PCU');
            this.feature.inventory.pcus.installed = microinverters.length > 0;
            if (this.feature.inventory.pcus.installed) {
                this.pv.inventory.pcus = parseMicroinverters(microinverters);
                this.feature.inventory.pcus.count = microinverters.length;
            }

            // AC Batteries
            const acbs = getDevicesByType('ACB');
            this.feature.inventory.acbs.supported = inventoryKeys.includes('ACB');
            this.feature.inventory.acbs.installed = acbs.length > 0;
            if (this.feature.inventory.acbs.installed) {
                this.pv.inventory.acbs = parseAcBatteries(acbs);
                this.feature.inventory.acbs.count = acbs.length;
            }

            // Q-Relays
            const nsrbs = getDevicesByType('NSRB');
            this.feature.inventory.nsrbs.supported = inventoryKeys.includes('NSRB');
            this.feature.inventory.nsrbs.installed = nsrbs.length > 0;
            if (this.feature.inventory.nsrbs.installed) {
                this.pv.inventory.nsrbs = parseQRelays(nsrbs);
                this.feature.inventory.nsrbs.count = nsrbs.length;
            }

            // Ensembles
            const esubs = getDevicesByType('ESUB');
            this.feature.inventory.esubs.supported = inventoryKeys.includes('ESUB');
            this.feature.inventory.esubs.installed = esubs.length > 0;
            if (this.feature.inventory.esubs.installed) {
                this.pv.inventory.esubs.devices = parseEnsembles(esubs);
                this.feature.inventory.esubs.count = esubs.length;
            }

            // Inventory globally supported
            this.feature.inventory.supported = true;

            // RESTful & MQTT publishing
            if (this.restFulConnected) this.restFul1.update('inventory', inventory);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Inventory', inventory);

            return true;
        } catch (error) {
            throw new Error(`Update inventory error: ${error}`);
        }
    }

    async updatePcuStatus() {
        if (this.logDebug) this.emit('debug', `Requesting pcu status`);

        try {
            const options = {
                method: 'GET',
                baseURL: this.url,
                headers: {
                    Accept: 'application/json'
                }
            };

            const response = this.feature.info.tokenRequired ? await this.axiosInstance.get(ApiUrls.InverterProduction) : await this.digestAuthEnvoy.request(ApiUrls.InverterProduction, options);
            const pcus = response.data;
            if (this.logDebug) this.emit('debug', `Pcu status:`, pcus);

            //pcu devices count
            const pcusSupported = pcus.length > 0;
            if (!pcusSupported) return;

            this.pv.inventory.pcus.forEach((pcu) => {
                const device = pcus.find(device => device.serialNumber === pcu.serialNumber);
                if (!device) {
                    return;
                }

                const obj = {
                    type: 'pcu',
                    readingTime: device.lastReportDate,
                    power: device.lastReportWatts,
                    powerPeak: device.maxReportWatts,
                };

                Object.assign(pcu, obj);
            });
            this.feature.pcuStatus.supported = true;

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('microinvertersstatus', pcus)
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Microinverters Status', pcus);

            return true;
        } catch (error) {
            throw new Error(`Update pcu status error: ${error}`);
        }
    }

    async updateDetailedDevices(start) {
        if (this.logDebug) this.emit('debug', `Requesting detailed devices data`);

        try {
            const response = await this.axiosInstance.get(ApiUrls.DevicesData)
            const devicesData = response.data;
            if (this.logDebug) this.emit('debug', `Detailed devices data:`, devicesData);

            if (devicesData) {
                // PCUs
                if (this.feature.inventory.pcus.installed) {
                    this.pv.inventory.pcus.forEach((pcu) => {
                        const device = Object.values(devicesData).find(d => d.sn === pcu.serialNumber);
                        if (!device) {
                            return;
                        }

                        const deviceData = device.channels[0];
                        const obj = {
                            active: deviceData.active,
                            power: deviceData.watts.now,
                            powerUsed: deviceData.watts.nowUsed,
                            powerPeak: deviceData.watts.max,
                            energyToday: deviceData.wattHours.today,
                            energyYesterday: deviceData.wattHours.yesterday,
                            energyLastSevenDays: deviceData.wattHours.week,
                            energyLifetime: deviceData.lifetime.joulesProduced / 3600,
                            voltage: deviceData.lastReading.acVoltageINmV,
                            frequency: deviceData.lastReading.acFrequencyINmHz,
                            currentDc: deviceData.lastReading.dcCurrentINmA,
                            voltageDc: deviceData.lastReading.dcVoltageINmV,
                            temperature: deviceData.lastReading.channelTemp,
                            readingTime: deviceData.lastReading.endDate,
                        };

                        Object.assign(pcu, obj);
                        this.feature.pcuStatus.supported = false;
                        this.feature.detailedDevicesData.pcus.supported = true;
                    });
                }

                // Meters
                if (this.feature.meters.installed) {
                    this.pv.meters.forEach((meter) => {
                        const device = devicesData[meter.eid];
                        if (!device) {
                            return;
                        }

                        const channels = device.channels;
                        for (const [channelIndex, channel] of channels.entries()) {
                            const obj = {
                                serialNumber: channel.sn,
                                active: channel.active,
                                power: channel.watts.now,
                                powerUsed: channel.watts.nowUsed,
                                powerPeak: channel.watts.max,
                                energyToday: channel.wattHours.today,
                                energyYesterday: channel.wattHours.yesterday,
                                energyLastSevenDays: channel.wattHours.week,
                                energyLifetime: channel.lifetime.wh_dlvd_cum,
                                current: channel.lastReading.rms_mamp != null ? channel.lastReading.rms_mamp / 1000 : null,
                                voltage: channel.lastReading.rms_mvolt != null ? channel.lastReading.rms_mvolt / 1000 : null,
                                frequency: channel.lastReading.freq_mhz != null ? channel.lastReading.freq_mhz / 1000 : null,
                                readingTime: channel.lastReading.endDate,
                            };

                            //Object.assign(meter, obj);
                        }
                        this.feature.detailedDevicesData.meters.supported = true;
                    });
                }

                // NSRBs
                if (this.feature.inventory.nsrbs.installed) {
                    this.pv.inventory.nsrbs.forEach((nsrb) => {
                        const device = Object.values(devicesData).find(d => d.sn === nsrb.serialNumber);
                        if (!device) {
                            return;
                        }

                        const deviceData = device.channels[0];
                        const obj = {
                            active: deviceData.active,
                            acOffset: deviceData.lastReading.acCurrOffset,
                            voltageL1: deviceData.lastReading.VrmsL1N,
                            voltageL2: deviceData.lastReading.VrmsL2N,
                            voltageL3: deviceData.lastReading.VrmsL3N,
                            frequency: deviceData.lastReading.freqInmHz,
                            temperature: deviceData.lastReading.temperature,
                            readingTime: deviceData.lastReading.endDate,
                        };

                        Object.assign(nsrb, obj);
                        this.feature.detailedDevicesData.nsrbs.supported = true;
                    });
                }

                // detailed devices data installed
                this.feature.detailedDevicesData.installed = this.feature.detailedDevicesData.pcus.supported || this.feature.detailedDevicesData.meters.supported || this.feature.detailedDevicesData.nsrbs.supported;
            }

            // detailed devices data supported
            this.feature.detailedDevicesData.supported = true;

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('detaileddevicesdata', devicesData);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Detailed Devices Data', devicesData);

            return true;
        } catch (error) {
            if (start) {
                if (this.logWarn) this.emit('warn', `Detailed devices data not supported, dont worry all working correct, only some additional data will not be present, error: ${error}`);
                return null;
            }
            throw new Error(`Update detailed devices data error: ${error}`)
        };
    }

    async updateProduction() {
        if (this.logDebug) this.emit('debug', `Requesting production`);

        try {
            const response = await this.axiosInstance.get(ApiUrls.Production);
            const production = response.data;
            if (this.logDebug) this.emit('debug', `Production:`, production);

            const productionSupported = Object.keys(production).length > 0;

            if (productionSupported) {
                const obj = {
                    type: 'pcu',
                    activeCount: this.feature.inventory.pcus.count,
                    measurementType: 'Production',
                    readingTime: this.formatTimestamp(),
                    power: production.wattsNow,
                    energyToday: production.wattHoursToday,
                    energyLastSevenDays: production.wattHoursSevenDays,
                    energyLifetime: production.wattHoursLifetime
                };

                this.pv.powerAndEnergy.production.pcu = obj;
                this.feature.production.supported = true;
            }

            if (this.restFulConnected) this.restFul1.update('production', production);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Production', production);

            return true;
        } catch (error) {
            throw new Error(`Update production error: ${error}`);
        }
    }

    async updateProductionPdm() {
        if (this.logDebug) this.emit('debug', `Requesting production pdm`);

        try {
            const response = await this.axiosInstance.get(ApiUrls.ProductionPdm);
            const data = response.data;
            if (this.logDebug) this.emit('debug', `Production pdm:`, data);

            const readingTime = this.formatTimestamp();

            // PCU
            const pcu = {
                type: 'pcu',
                measurementType: 'Production',
                activeCount: this.feature.inventory?.pcus?.count,
                readingTime,
                power: data.watts_now_pcu,
                energyToday: data.joules_today_pcu / 3600,
                energyLastSevenDays: data.pcu_joules_seven_days / 3600,
                energyLifetime: data.joules_lifetime_pcu / 3600
            };
            this.pv.powerAndEnergy.production.pcu = pcu;
            this.feature.productionPdm.pcu.supported = pcu.power > 0;

            // EIM
            const eimActive = !!data.there_is_an_active_eim;
            const eim = {
                type: 'eim',
                measurementType: 'Production',
                activeCount: 1,
                readingTime,
                active: eimActive,
                power: data.watts_now_eim,
                energyToday: data.watt_hours_today_eim?.aggregate,
                energyLastSevenDays: data.eim_watt_hours_seven_days?.aggregate,
                energyLifetime: data.watt_hours_lifetime_eim?.aggregate
            };
            this.pv.powerAndEnergy.production.eim = eim;
            this.feature.productionPdm.eim.supported = eimActive;

            // RGM
            const rgmActive = !!data.there_is_an_active_rgm;
            const rgm = {
                type: 'rgm',
                measurementType: 'Production',
                activeCount: 1,
                readingTime,
                active: rgmActive,
                power: data.watts_now_rgm,
                energyToday: data.watt_hours_today_rgm,
                energyLastSevenDays: data.rgm_watt_hours_seven_days,
                energyLifetime: data.watt_hours_lifetime_rgm
            };
            this.pv.powerAndEnergy.production.rgm = rgm;
            this.feature.productionPdm.rgm.supported = rgmActive;

            // PMU
            const pmuActive = !!data.there_is_an_active_pmu;
            const pmu = {
                type: 'pmu',
                measurementType: 'Production',
                activeCount: 1,
                readingTime,
                active: pmuActive,
                power: data.watts_now_pmu,
                energyToday: data.watt_hours_today_pmu,
                energyLastSevenDays: data.pmu_watt_hours_seven_days,
                energyLifetime: data.watt_hours_lifetime_pmu
            };
            this.pv.powerAndEnergy.production.pmu = pmu;
            this.feature.productionPdm.pmu.supported = pmuActive;

            // Mark as supported
            this.feature.productionPdm.supported = true;

            // External integrations
            if (this.restFulConnected) this.restFul1.update('productionpdm', data);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Production Pdm', data);

            return true;
        } catch (error) {
            throw new Error(`Update production pdm error: ${error}`);
        }
    }

    async updateEnergyPdm() {
        if (this.logDebug) this.emit('debug', `Requesting energy pdm`);

        try {
            const response = await this.axiosInstance.get(ApiUrls.EnergyPdm);
            const energyPdm = response.data;
            if (this.logDebug) this.emit('debug', `Energy pdm: `, energyPdm);

            const readingTime = this.formatTimestamp();

            // Process production data
            if ('production' in energyPdm && energyPdm.production) {
                for (const [type, data] of Object.entries(energyPdm.production)) {
                    if (data) {
                        const obj = {
                            type,
                            activeCount: 1,
                            measurementType: 'Production',
                            readingTime,
                            power: data.wattsNow,
                            energyToday: data.wattHoursToday,
                            energyLastSevenDays: data.wattHoursSevenDays,
                            energyLifetime: data.wattHoursLifetime
                        };
                        this.pv.powerAndEnergy.production[type] = obj;
                        this.feature.energyPdm.production[type].supported = true;
                    }
                }
                this.feature.energyPdm.production.supported = true;
            }

            // Process consumption data
            if ('consumption' in energyPdm && energyPdm.consumption?.eim) {
                const data = energyPdm.consumption.eim;
                const obj = {
                    type: 'eim',
                    activeCount: 1,
                    measurementType: 'Consumption Net',
                    readingTime,
                    power: data.wattsNow,
                    energyToday: data.wattHoursToday,
                    energyLastSevenDays: data.wattHoursSevenDays,
                    energyLifetime: data.wattHoursLifetime
                };
                Object.assign(this.pv.powerAndEnergy.consumptionNet, obj);
                this.feature.energyPdm.comsumptionNet.supported = true;
            }

            this.feature.energyPdm.supported = true;

            if (this.restFulConnected) this.restFul1.update('energypdm', energyPdm);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Energy Pdm', energyPdm);

            return true;
        } catch (error) {
            throw new Error(`Update energy pdm error: ${error}`);
        }
    }

    async updateProductionCt() {
        if (this.logDebug) this.emit('debug', `Requesting production ct`);

        try {
            const response = await this.axiosInstance.get(ApiUrls.SystemReadingStats);
            const data = response.data;
            if (this.logDebug) this.emit('debug', `Production ct:`, data);

            const keys = Object.keys(data);

            // --- Production: PCU ---
            if (keys.includes('production') && Array.isArray(data.production)) {
                const productionPcu = data.production[0];
                if (productionPcu) {
                    this.feature.productionCt.production.pcu.supported = true;
                }

                const productionEim = data.production[1];
                if (productionEim) {
                    const energyToday = (productionEim.lines[0]?.whToday || 0) + (productionEim.lines[1]?.whToday || 0) + (productionEim.lines[2]?.whToday || 0);
                    const energyLastSevenDays = (productionEim.lines[0]?.whLastSevenDays || 0) + (productionEim.lines[1]?.whLastSevenDays || 0) + (productionEim.lines[2]?.whLastSevenDays || 0);
                    const energyLifetime = (productionEim.lines[0]?.whLifetime || 0) + (productionEim.lines[1]?.whLifetime || 0) + (productionEim.lines[2]?.whLifetime || 0);
                    const obj = {
                        type: 'eim',
                        activeCount: 1,
                        measurementType: ApiCodes[productionEim.measurementType],
                        readingTime: productionEim.readingTime,
                        power: productionEim.wNow,
                        energyToday,
                        energyLastSevenDays,
                        energyLifetime,
                        reactivePower: productionEim.reactPwr,
                        apparentPower: productionEim.apprntPwr,
                        current: productionEim.rmsCurrent,
                        voltage: productionEim.rmsVoltage,
                        pwrFactor: productionEim.pwrFactor
                    };
                    this.pv.powerAndEnergy.production.eim = obj;
                    this.feature.productionCt.production.eim.supported = true;
                }
            }

            // --- Consumption: EIM ---
            if (keys.includes('consumption') && Array.isArray(data.consumption) && this.feature.meters.consumptionNet.enabled) {
                for (const item of data.consumption) {
                    const type = ApiCodes[item.measurementType];
                    const key = MetersKeyMap[type];
                    const energyToday = (item.lines[0]?.whToday || 0) + (item.lines[1]?.whToday || 0) + (item.lines[2]?.whToday || 0);
                    const energyLastSevenDays = (item.lines[0]?.whLastSevenDays || 0) + (item.lines[1]?.whLastSevenDays || 0) + (item.lines[2]?.whLastSevenDays || 0);
                    const energyLifetime = (item.lines[0]?.whLifetime || 0) + (item.lines[1]?.whLifetime || 0) + (item.lines[2]?.whLifetime || 0);
                    const obj = {
                        type: 'eim',
                        measurementType: type,
                        activeCount: 1,
                        readingTime: item.readingTime,
                        power: item.wNow,
                        energyToday,
                        energyLastSevenDays,
                        energyLifetime,
                        reactivePower: item.reactPwr,
                        apparentPower: item.apprntPwr,
                        current: item.rmsCurrent,
                        voltage: item.rmsVoltage,
                        pwrFactor: item.pwrFactor
                    };
                    Object.assign(this.pv.powerAndEnergy[key], obj);
                    this.feature.productionCt[key].supported = true;
                }
            }

            // --- Storage: ACB Summary ---
            if (keys.includes('storage') && Array.isArray(data.storage) && this.feature.inventory.acbs.installed) {
                const summary = data.storage[0];
                if (summary) {
                    const obj = {
                        type: 'acb',
                        measurementType: 'Storage',
                        activeCount: summary.activeCount,
                        readingTime: summary.readingTime,
                        powerSum: summary.wNow,
                        energySum: summary.whNow,
                        chargeStateSum: summary.state
                    };

                    // Merge into first ACB in inventory
                    this.pv.inventory.acbs[0] = { ...this.pv.inventory.acbs[0], ...obj };

                    this.feature.productionCt.storage.supported = true;
                }
            }

            // --- Finalize ---
            this.feature.productionCt.supported = true;

            if (this.restFulConnected) this.restFul1.update('productionct', data);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Production CT', data);

            return true;
        } catch (error) {
            throw new Error(`Update production ct error: ${error}`);
        }
    }

    async updateEnsembleInventory() {
        if (this.logDebug) this.emit('debug', `Requesting ensemble inventory`);

        try {
            const response = await this.axiosInstance.get(ApiUrls.EnsembleInventory);
            const ensembleInventory = response.data;
            if (this.logDebug) this.emit('debug', `Ensemble inventory:`, ensembleInventory);

            const ensembleInventorySupported = Array.isArray(ensembleInventory) && ensembleInventory.length > 0;
            if (!ensembleInventorySupported) return false;

            // -- ENCHARGES --
            const encharges = ensembleInventory.find(item => item.type === 'ENCHARGE')?.devices || [];
            if (encharges.length > 0) {
                const type = 'ENCHARGE';
                const arr = encharges.map(device => ({
                    type,
                    partNumber: device.part_num,
                    serialNumber: device.serial_num,
                    installed: device.installed,
                    chargeState: device.device_status,
                    readingTime: device.last_rpt_date,
                    adminState: device.admin_state,
                    adminStateStr: device.admin_state_str,
                    createdDate: device.created_date,
                    imgLoadDate: device.img_load_date,
                    imgPnumRunning: device.img_pnum_running,
                    bmuFwVersion: device.bmu_fw_version,
                    operating: !!device.operating,
                    communicating: device.communicating,
                    sleepEnabled: device.sleep_enabled,
                    percentFull: device.percentFull,
                    temperature: device.temperature,
                    maxCellTemp: device.maxCellTemp,
                    reportedEncGridState: device.reported_enc_grid_state,
                    commLevelSubGhz: device.comm_level_sub_ghz,
                    commLevel24Ghz: device.comm_level_2_4_ghz,
                    ledStatus: device.led_status,
                    dcSwitchOff: !device.dc_switch_off, // inverse logic preserved
                    rev: device.encharge_rev,
                    capacity: device.encharge_capacity,
                    phase: device.phase,
                    derIndex: device.der_index,
                }));

                this.pv.inventory.esubs.encharges.devices = arr;
                this.pv.inventory.esubs.encharges.phaseA = arr.some(d => d.phase === 'ph-a');
                this.pv.inventory.esubs.encharges.phaseB = arr.some(d => d.phase === 'ph-b');
                this.pv.inventory.esubs.encharges.phaseC = arr.some(d => d.phase === 'ph-c');

                this.feature.inventory.esubs.encharges.supported = true;
                this.feature.inventory.esubs.encharges.installed = true;
                this.feature.inventory.esubs.encharges.count = arr.length;
            }

            // -- ENPOWERS --
            const enpowers = ensembleInventory.find(item => item.type === 'ENPOWER')?.devices || [];
            if (enpowers.length > 0) {
                const type = 'ENPOWER';
                const arr = enpowers.map(device => ({
                    type,
                    partNumber: device.part_num,
                    serialNumber: device.serial_num,
                    installed: device.installed,
                    deviceStatus: device.device_status,
                    readingTime: device.last_rpt_date,
                    adminState: device.admin_state,
                    adminStateStr: device.admin_state_str,
                    createdDate: device.created_date,
                    imgLoadDate: device.img_load_date,
                    imgPnumRunning: device.img_pnum_running,
                    communicating: device.communicating,
                    temperature: device.temperature,
                    commLevelSubGhz: device.comm_level_sub_ghz,
                    commLevel24Ghz: device.comm_level_2_4_ghz,
                    mainsAdminState: device.mains_admin_state,
                    mainsAdminStateBool: !!device.mains_admin_state,
                    mainsOperState: device.mains_oper_state,
                    mainsOperStateBool: !!device.mains_oper_state,
                    enpwrGridMode: device.Enpwr_grid_mode,
                    enpwrGridModeTranslated: device.Enpwr_grid_mode,
                    enpwrGridStateBool: !!device.mains_admin_state, // if this is intentional
                    enchgGridMode: device.Enchg_grid_mode,
                    enchgGridModeTranslated: device.Enchg_grid_mode,
                    enpwrRelayStateBm: device.Enpwr_relay_state_bm,
                    enpwrCurrStateId: device.Enpwr_curr_state_id,
                }));

                this.pv.inventory.esubs.enpowers = arr;
                this.feature.inventory.esubs.enpowers.supported = true;
                this.feature.inventory.esubs.enpowers.installed = true;
                this.feature.inventory.esubs.enpowers.count = arr.length;
            }

            // -- COLLAR --
            const collars = ensembleInventory.find(item => item.type === 'COLLAR')?.devices || [];
            if (collars.length > 0) {
                const type = 'COLLAR';
                const arr = collars.map(collar => ({
                    type,
                    partNumber: collar.part_num,
                    serialNumber: collar.serial_num,
                    installed: collar.installed,
                    deviceStatus: collar.device_status,
                    readingTime: collar.last_rpt_date,
                    adminState: collar.admin_state,
                    adminStateStr: collar.admin_state_str,
                    createdDate: collar.created_date,
                    imgLoadDate: collar.img_load_date,
                    imgPnumRunning: collar.img_pnum_running,
                    communicating: collar.communicating,
                    temperature: collar.temperature,
                    midState: collar.mid_state,
                    gridState: collar.grid_state,
                    controlError: collar.controll_error,
                    collarState: collar.collar_state,
                }));

                this.pv.inventory.esubs.collars = arr;
                this.feature.inventory.esubs.collars.supported = true;
                this.feature.inventory.esubs.collars.installed = true;
                this.feature.inventory.esubs.collars.count = arr.length;
            }

            // -- C6 COMBINER CONTROLLER --
            const c6CombinerControllers = ensembleInventory.find(item => item.type === 'C6 COMBINER CONTROLLER')?.devices || [];
            if (c6CombinerControllers.length > 0) {
                const type = 'C6 COMBINER CONTROLLER';
                const arr = c6CombinerControllers.map(device => ({
                    type,
                    partNumber: device.part_num,
                    serialNumber: device.serial_num,
                    installed: device.installed,
                    readingTime: device.last_rpt_date,
                    adminState: device.admin_state,
                    adminStateStr: device.admin_state_str,
                    createdDate: device.created_date,
                    imgLoadDate: device.img_load_date,
                    firmware: device.fw_version,
                    dmirVersion: device.dmir_version,
                    communicating: device.communicating,
                }));

                this.pv.inventory.esubs.c6CombinerControllers = arr;
                this.feature.inventory.esubs.c6CombinerControllers.supported = true;
                this.feature.inventory.esubs.c6CombinerControllers.installed = true;
                this.feature.inventory.esubs.c6CombinerControllers.count = arr.length;
            }

            // -- C6 RGM --
            const c6Rgms = ensembleInventory.find(item => item.type === 'C6 RGM')?.devices || [];
            if (c6Rgms.length > 0) {
                const type = 'C6RGM';
                const arr = c6Rgms.map(device => ({
                    type,
                    partNumber: device.part_num,
                    serialNumber: device.serial_num,
                    installed: device.installed,
                    firmware: device['FW Version'],
                    deviceState: device['Device State'],
                }));

                this.pv.inventory.esubs.c6Rgms = arr;
                this.feature.inventory.esubs.c6Rgms.supported = true;
                this.feature.inventory.esubs.c6Rgms.installed = true;
                this.feature.inventory.esubs.c6Rgms.count = arr.length;
            }

            // ensemble inventory supported
            this.feature.ensemble.inventory.supported = true;

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('ensembleinventory', ensembleInventory);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Ensemble Inventory', ensembleInventory);

            return true;
        } catch (error) {
            throw new Error(`Update ensemble inventory error: ${error.message || error}`);
        }
    }

    async updateEnsembleStatus() {
        if (this.logDebug) this.emit('debug', `Requesting ensemble status`);

        try {
            const response = await this.axiosInstance.get(ApiUrls.EnsembleStatus);
            const ensembleStatus = response.data;
            if (this.logDebug) this.emit('debug', `Ensemble status:`, ensembleStatus);

            const ensembleStatusKeys = Object.keys(ensembleStatus);
            const ensembleStatusSupported = ensembleStatusKeys.includes('inventory');

            if (!ensembleStatusSupported) return false;
            const inventory = ensembleStatus.inventory;
            const serialNumbers = inventory.serial_nums ?? {};
            const esubs = this.pv.inventory.esubs;

            // Update ensemble statuses if exist
            const esubStatus = Object.values(serialNumbers).find(device => device.com_interface_str === 'USB');
            if (esubStatus) {
                const devices = esubs.devices;
                if (!this.feature.inventory.esubs.installed) {
                    devices.push({ status: {} });
                }

                for (const esub of devices) {
                    esub.status = {
                        deviceType: esubStatus.device_type,
                        commInterfaceStr: esubStatus.com_interface_str,
                        deviceId: esubStatus.device_id,
                        adminState: esubStatus.admin_state,
                        adminStateStr: esubStatus.admin_state_str,
                        msgRetryCount: esubStatus.msg_retry_count,
                        partNumber: esubStatus.part_number,
                        assemblyNumber: esubStatus.assembly_number,
                        appFwVersion: esubStatus.app_fw_version,
                        iblFwVersion: esubStatus.ibl_fw_version,
                        swiftAsicFwVersion: esubStatus.swift_asic_fw_version,
                        bmuFwVersion: esubStatus.bmu_fw_version,
                        submodulesCount: esubStatus.submodule_count,
                        submodules: esubStatus.submodules
                    };
                };

                this.feature.inventory.esubs.status.supported = true;
            }

            // Update encharges statuses if installed
            if (this.feature.inventory.esubs.encharges.installed) {
                const encharges = esubs.encharges.devices || [];
                for (const encharge of encharges) {
                    const status = serialNumbers[encharge.serialNumber];
                    if (!status) continue;

                    encharge.status = {
                        deviceType: status.device_type,
                        commInterfaceStr: status.com_interface_str,
                        deviceId: status.device_id,
                        adminState: status.admin_state,
                        adminStateStr: status.admin_state_str,
                        reportedGridMode: status.reported_grid_mode,
                        phase: status.phase,
                        derIndex: status.der_index,
                        revision: status.encharge_revision,
                        capacity: status.encharge_capacity,
                        ratedPower: status.encharge_rated_power,
                        reportedGridState: status.reported_enc_grid_state,
                        msgRetryCount: status.msg_retry_count,
                        partNumber: status.part_number,
                        assemblyNumber: status.assembly_number,
                        appFwVersion: status.app_fw_version,
                        zbFwVersion: status.zb_fw_version,
                        zbBootloaderVers: status.zb_bootloader_vers,
                        iblFwVersion: status.ibl_fw_version,
                        swiftAsicFwVersion: status.swift_asic_fw_version,
                        bmuFwVersion: status.bmu_fw_version,
                        submodulesCount: status.submodule_count,
                        submodules: status.submodules
                    };

                    this.feature.inventory.esubs.encharges.status.supported = true;
                };
            }

            // Update enpowers statuses if installed
            if (this.feature.inventory.esubs.enpowers.installed) {
                const enpowers = esubs.enpowers || [];
                for (const enpower of enpowers) {
                    const serialNumber = enpower.serialNumber;
                    const status = serialNumbers[serialNumber];
                    if (!status) continue;

                    enpower.status = {
                        deviceType: status.device_type,
                        commInterfaceStr: status.com_interface_str,
                        deviceId: status.device_id,
                        adminState: status.admin_state,
                        adminStateStr: status.admin_state_str,
                        msgRetryCount: status.msg_retry_count,
                        partNumber: status.part_number,
                        assemblyNumber: status.assembly_number,
                        appFwVersion: status.app_fw_version,
                        iblFwVersion: status.ibl_fw_version,
                        swiftAsicFwVersion: status.swift_asic_fw_version,
                        bmuFwVersion: status.bmu_fw_version,
                        submodulesCount: status.submodule_count,
                        submodules: status.submodules
                    };

                    this.feature.inventory.esubs.enpowers.status.supported = true;
                };
            }

            // Handle counters
            const countersSupported = ensembleStatusKeys.includes('counters');
            const counterData = countersSupported ? ensembleStatus.counters : {};
            esubs.counters = counterData;
            this.feature.inventory.esubs.counters.supported = countersSupported;

            // secctrl
            const secctrlSupported = ensembleStatusKeys.includes('secctrl');
            const secctrlData = secctrlSupported ? ensembleStatus.secctrl : {};
            esubs.secctrl = secctrlData;
            this.feature.inventory.esubs.secctrl.supported = secctrlSupported;

            // relay
            const relaySupported = ensembleStatusKeys.includes('relay');
            const relayData = relaySupported ? ensembleStatus.relay : {};
            esubs.relay = relayData;
            this.feature.inventory.esubs.relay.supported = relaySupported;

            // profile
            const profileSupported = ensembleStatusKeys.includes('profile');
            const profile = profileSupported ? ensembleStatus.profile : {};

            // fakeit
            const fakeInventoryModeSupported = ensembleStatusKeys.includes('fakeit');
            const ensembleFakeInventoryMode = fakeInventoryModeSupported ? ensembleStatus.fakeit.fake_inventory_mode : false;

            // ensemble status supported
            this.feature.ensemble.status.supported = true;

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('ensemblestatus', ensembleStatus);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Ensemble Status', ensembleStatus);

            return true;
        } catch (error) {
            throw new Error(`Update ensemble status error: ${error}`);
        }
    }

    async updateEnsemblePower() {
        if (this.logDebug) this.emit('debug', `Requesting ensemble power`);

        try {
            const response = await this.axiosInstance.get(ApiUrls.EnsemblePower);
            const devices = response.data.devices || [];
            if (this.logDebug) this.emit('debug', `Ensemble power response:`, devices);

            const devicesSupported = devices.length > 0;
            if (!devicesSupported) return false;

            // update encharges
            const encharges = this.pv.inventory.esubs.encharges.devices || [];
            for (const encharge of encharges) {
                const serialNumber = encharge.serialNumber;
                const device = devices.find(device => device.serial_num === serialNumber);
                if (this.logDebug) this.emit('debug', `Ensemble device power:`, device);
                if (!device) continue;

                encharge.power = {
                    serialNumber: device.serial_num,
                    realPower: device.real_power_mw,
                    apparentPower: device.apparent_power_mva,
                    soc: device.soc,
                };

                this.feature.inventory.esubs.encharges.power.supported = true;
            }

            // ensemble power supported
            this.feature.ensemble.power.supported = true;

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('ensemblepower', devices);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Ensemble Power', devices);

            return true;
        } catch (error) {
            throw new Error(`Update ensemble power error: ${error}`);
        }
    }

    async updateEnchargesSettings() {
        if (this.logDebug) this.emit('debug', `Requesting encharge settings`);

        try {
            const response = await this.axiosInstance.get(ApiUrls.EnchargeSettings);
            const enchargesSettings = response.data;
            if (this.logDebug) this.emit('debug', `Encharge settings:`, enchargesSettings);

            const enchargesSettingsSupported = 'enc_settings' in enchargesSettings;
            if (!enchargesSettingsSupported) return false;

            const settings = enchargesSettings.enc_settings;
            const encharges = this.pv.inventory.esubs.encharges;
            encharges.settings = {
                enable: settings.enable,                 // boolean
                country: settings.country,               // string
                currentLimit: settings.current_limit,    // float
                perPhase: settings.per_phase             // boolean
            };

            this.feature.inventory.esubs.encharges.settings.supported = true;

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('enchargesettings', enchargesSettings);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Encharge Settings', enchargesSettings);

            return true;
        } catch (error) {
            throw new Error(`Update encharge settings error: ${error}`);
        }
    }

    async updateTariff() {
        if (this.logDebug) this.emit('debug', 'Requesting tariff');

        try {
            const response = await this.axiosInstance.get(ApiUrls.TariffSettingsGetPut);
            const tariffSettings = response.data;

            if (this.logDebug) this.emit('debug', 'Tariff:', tariffSettings);

            const enchargesTariffSupported = 'tariff' in tariffSettings;
            if (!enchargesTariffSupported) return false;
            this.pv.inventory.esubs.encharges.tariffRaw = tariffSettings;
            this.pv.inventory.esubs.encharges.tariff = tariffSettings;
            this.feature.inventory.esubs.encharges.tariff.supported = true;

            if (this.restFulConnected) this.restFul1.update('tariff', tariffSettings);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Tariff', tariffSettings);

            return true;
        } catch (error) {
            throw new Error(`Update tariff error: ${error}`);
        }
    }

    async updateDryContacts() {
        if (this.logDebug) this.emit('debug', 'Requesting dry contacts');

        try {
            const response = await this.axiosInstance.get(ApiUrls.DryContacts);
            const ensembleDryContacts = response.data;

            if (this.logDebug) this.emit('debug', 'Dry contacts:', ensembleDryContacts);

            const dryContacts = ensembleDryContacts.dry_contacts ?? [];
            const dryContactsSupported = dryContacts.length > 0;
            if (!dryContactsSupported) return false;

            this.pv.inventory.esubs.enpowers.forEach((enpower) => {
                enpower.dryContacts = dryContacts.map(contact => ({
                    id: contact.id,           // string, e.g. "NC1"
                    status: contact.status    // string, e.g. "closed"
                }));

                const feature = this.feature.inventory.esubs.enpowers.dryContacts;
                if (feature) {
                    feature.installed = enpower.dryContacts.length > 0;
                    feature.count = enpower.dryContacts.length;
                    feature.supported = true;
                }
            });


            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('drycontacts', ensembleDryContacts);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Dry Contacts', ensembleDryContacts);

            return true;
        } catch (error) {
            throw new Error(`Update dry contacts error: ${error}`);
        }
    }

    async updateDryContactsSettings() {
        if (this.logDebug) this.emit('debug', 'Requesting dry contacts settings');

        try {
            const response = await this.axiosInstance.get(ApiUrls.DryContactsSettings);
            const ensembleDryContactsSettings = response.data;

            if (this.logDebug) this.emit('debug', 'Dry contacts settings:', ensembleDryContactsSettings);

            const dryContactsSettings = ensembleDryContactsSettings.dry_contacts ?? [];
            const dryContactsSettingsSupported = dryContactsSettings.length > 0;
            if (!dryContactsSettingsSupported) return false;
            this.pv.inventory.esubs.enpowers.forEach((enpower) => {
                if (!Array.isArray(enpower.dryContacts)) return false;

                enpower.dryContacts.forEach((contact) => {
                    const setting = dryContactsSettings.find(s => s.id === contact.id);
                    if (!setting) return;

                    contact.settings = {
                        id: setting.id,
                        type: setting.type,
                        gridAction: setting.grid_action,
                        microGridAction: setting.micro_grid_action,
                        genAction: setting.gen_action,
                        essentialStartTime: setting.essential_start_time,
                        essentialEndTime: setting.essential_end_time,
                        priority: setting.priority,
                        blackSStart: setting.black_s_start,
                        override: setting.override,
                        manualOverride: setting.manual_override,
                        loadName: setting.load_name,
                        mode: setting.mode,
                        socLow: setting.soc_low,
                        socHigh: setting.soc_high,
                        pvSerialNb: setting.pv_serial_nb
                    };
                });

                const feature = this.feature.inventory.esubs.enpowers.dryContacts.settings;
                if (feature) {
                    feature.supported = true;
                    feature.count = dryContactsSettings.length;
                }
            });

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('drycontactssettings', ensembleDryContactsSettings);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Dry Contacts Settings', ensembleDryContactsSettings);

            return true;
        } catch (error) {
            throw new Error(`Update dry contacts settings error: ${error}`);
        }
    }

    async updateGenerator() {
        if (this.logDebug) this.emit('debug', 'Requesting generator');

        try {
            const response = await this.axiosInstance.get(ApiUrls.Generator);
            const generator = response.data;

            if (this.logDebug) this.emit('debug', 'Generator:', generator);

            const generatorSupported = 'admin_state' in generator;
            if (!generatorSupported) return false;
            this.feature.inventory.esubs.generator.supported = true;

            const installed = ['Off', 'On', 'Auto'].includes(generator.admin_state);
            if (!installed) return false;

            this.pv.inventory.esubs.generator = {
                type: generator.type,
                adminState: generator.admin_state,
                operState: generator.oper_state,
                adminMode: generator.admin_mode,
                schedule: generator.schedule,
                startSoc: generator.start_soc,
                stopSoc: generator.stop_soc,
                excOn: generator.exc_on,
                present: generator.present,
            };

            const feature = this.feature.inventory.esubs.generator;
            if (feature) {
                feature.installed = true;
                feature.count = 1;
            }

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('generator', generator);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Generator', generator);

            return true;
        } catch (error) {
            throw new Error(`Update generator error: ${error}`);
        }
    }

    async updateGeneratorSettings() {
        if (this.logDebug) this.emit('debug', 'Requesting generator settings');

        try {
            const response = await this.axiosInstance.get(ApiUrls.GeneratorSettingsGetSet);
            const generatorSettings = response.data;

            if (this.logDebug) this.emit('debug', 'Generator settings:', generatorSettings);

            const generatorSettingsupported = 'generator_settings' in generatorSettings;
            if (!generatorSettingsupported) return false;

            const settings = generatorSettings.generator_settings;
            const generator = this.pv.inventory.esubs.generator;
            generator.settings = {
                maxContGenAmps: settings.max_cont_gen_amps,                    // float
                minGenLoadingPerc: settings.min_gen_loading_perc,              // int
                maxGenEfficiencyPerc: settings.max_gen_efficiency_perc,        // int
                namePlateRatingWat: settings.name_plate_rating_wat,            // float
                startMethod: settings.start_method,                            // string
                warmUpMins: settings.warm_up_mins,                             // string or number
                coolDownMins: settings.cool_down_mins,                         // string or number
                genType: settings.gen_type,                                    // string
                model: settings.model,                                         // string
                manufacturer: settings.manufacturer,                           // string
                lastUpdatedBy: settings.last_updated_by,                       // string
                generatorId: settings.generator_id,                            // string
                chargeFromGenerator: settings.charge_from_generator            // boolean
            };

            // Feature flag update
            const feature = this.feature.inventory.esubs.generator.settings;
            if (feature) {
                feature.supported = true;
            }

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('generatorsettings', generatorSettings);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Generator Settings', generatorSettings);

            return true;
        } catch (error) {
            throw new Error(`Update generator settings error: ${error}`);
        }
    }

    async updateGridProfile(start) {
        if (this.logDebug) this.emit('debug', `Requesting grid profile`);

        try {
            const response = await this.axiosInstance.get(ApiUrls.Profile);
            const profile = response.data;
            if (this.logDebug) this.emit('debug', `Grid profile:`, profile);

            // If not supported, skip propagation
            if (!profile.name) {
                return;
            }

            //parse and prepare grid profile
            const gridProfile = {
                name: profile.name.substring(0, 64),
                id: profile.id,
                version: profile.version ?? '',
                itemCount: profile.item_count
            };

            // Store gridProfile
            this.pv.gridProfile = gridProfile;

            // Add to home object
            this.pv.home.gridProfile = gridProfile.name;

            // List of device groups to update with installed flags
            const targets = [
                { devices: this.pv.inventory.pcus, installed: this.feature.inventory.pcus.installed },
                { devices: this.pv.inventory.acbs, installed: this.feature.inventory.acbs.installed },
                { devices: this.pv.inventory.nsrbs, installed: this.feature.inventory.nsrbs.installed },
                { devices: this.pv.inventory.esubs.encharges.devices, installed: this.feature.inventory.esubs.encharges.installed },
                { devices: this.pv.inventory.esubs.enpowers, installed: this.feature.inventory.esubs.enpowers.installed },
            ];

            for (const target of targets) {
                if (!target.installed) continue;

                const devices = target.devices;
                for (const device of devices) {
                    device.gridProfile = gridProfile.name;
                };
            }

            //grid profile supported
            this.feature.gridProfile.supported = true;

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('gridprofile', profile);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Grid Profile', profile);

            return true;
        } catch (error) {
            if (start) {
                if (this.logWarn) this.emit('warn', `Grid profile not supported, dont worry all working correct, only the profile name will not be displayed, error: ${error}`);
                return null;
            }
            throw new Error(`Update grid profile error: ${error}`)
        }
    }

    async updatePlcLevel(start) {
        if (this.logDebug) this.emit('debug', `Requesting plc level`);

        try {
            const options = {
                method: 'GET',
                baseURL: this.url,
                headers: {
                    Accept: 'application/json'
                }
            };

            const response = this.feature.info.tokenRequired ? await this.axiosInstance.get(ApiUrls.InverterComm) : await this.digestAuthInstaller.request(ApiUrls.InverterComm, options);
            const plcLevel = response.data;
            if (this.logDebug) this.emit('debug', 'Plc level:', plcLevel);
            this.pv.plcLevelCheckState = true;

            const targets = [
                { devices: this.pv.inventory.pcus, flag: this.feature.plcLevel.pcus, state: this.feature.inventory.pcus.installed },
                { devices: this.pv.inventory.acbs, flag: this.feature.plcLevel.acbs, state: this.feature.inventory.acbs.installed },
                { devices: this.pv.inventory.nsrbs, flag: this.feature.plcLevel.nsrbs, state: this.feature.inventory.nsrbs.installed }
            ];

            for (const { devices, flag, state } of targets) {
                if (!state) continue;

                const knownSerials = new Set(devices.map(d => d.serialNumber));
                for (const serial of knownSerials) {
                    if (!(serial in plcLevel)) continue;

                    const raw = plcLevel[serial];
                    const device = devices.find(d => d.serialNumber === serial);
                    if (device) {
                        device.plcLevel = this.scaleValue(raw, 0, 5, 0, 100);
                    }
                }

                flag.supported = true;
            }

            // update HomeKit PLC level indicator
            this.envoyService?.updateCharacteristic(Characteristic.PlcLevelCheck, false);

            // turn off the PLC control switch if present
            if (this.plcLevelActiveControl) {
                this.plcLevelActiveControl.state = false;
                const type = this.plcLevelActiveControl.characteristicType;
                this.plcLevelControlService?.updateCharacteristic(type, false);
            }

            // update plc level state
            this.pv.plcLevelCheckState = false;

            // comm level supported
            this.feature.plcLevel.supported = true;

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('plclevel', plcLevel);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'PLC Level', plcLevel);

            return true;
        } catch (error) {
            if (start) {
                if (this.logWarn) this.emit('warn', `Plc level not supported, dont worry all working correct, only the plc level and control will not be displayed, error: ${error}`);
                return null;
            }
            throw new Error(`Update plc level: ${error}`);
        }
    }

    async updateHomeData() {
        if (this.logDebug) this.emit('debug', 'Requesting home data');

        try {
            const wirelessConnectionsInstalled = this.feature.home.wirelessConnections.installed;
            const home = this.pv.home;
            const comm = home.comm ?? {};
            const network = home.network ?? {};
            const wirelessConnections = home.wireless_connection ?? [];
            const networkInterfaces = network.interfaces ?? [];

            // Communication device support flags
            const commEnsemble = comm.esub ?? {};
            const commEncharges = Array.isArray(comm.encharge) ? comm.encharge : [];

            // Process network interfaces (synchronous)
            const interfaces = networkInterfaces.map(iface => ({
                type: ApiCodes[iface.type] ?? iface.type,
                interface: iface.interface,
                mac: iface.type !== 'cellular' ? iface.mac : null,
                dhcp: iface.dhcp,
                ip: iface.ip,
                carrier: !!iface.carrier,
                signalStrength: this.scaleValue(iface.signal_strength, 0, 5, 0, 100),
                signalStrengthMax: this.scaleValue(iface.signal_strength_max, 0, 5, 0, 100),
                supported: iface.type === 'wifi' ? iface.supported : null,
                present: iface.type === 'wifi' ? iface.present : null,
                configured: iface.type === 'wifi' ? iface.configured : null,
                status: iface.type === 'wifi' ? ApiCodes[iface.status] : null
            }));

            // Process encharges (synchronous)
            const encharges = commEncharges.map(encharge => ({
                num: encharge.num,
                level: this.scaleValue(encharge.level, 0, 5, 0, 100),
                level24g: this.scaleValue(encharge.level_24g, 0, 5, 0, 100),
                levelSubg: this.scaleValue(encharge.level_subg, 0, 5, 0, 100)
            }));

            // Process wireless connection kits (synchronous)
            const wirelessKits = wirelessConnections.map(kit => ({
                signalStrength: this.scaleValue(kit.signal_strength, 0, 5, 0, 100),
                signalStrengthMax: this.scaleValue(kit.signal_strength_max, 0, 5, 0, 100),
                type: ApiCodes[kit.type] ?? kit.type,
                connected: !!kit.connected
            }));

            // Await async getStatus call
            const deviceStatus = await this.getStatus(home.alerts);

            const obj = {
                softwareBuildEpoch: home.software_build_epoch,
                isEnvoy: !home.is_nonvoy,
                dbSize: home.db_size,
                dbPercentFull: home.db_percent_full,
                timeZone: home.timezone,
                currentDate: home.current_date,
                currentTime: home.current_time,
                tariff: ApiCodes[home.tariff],
                alerts: deviceStatus,
                updateStatus: ApiCodes[home.update_status],
                network: {
                    webComm: !!network.web_comm,
                    everReportedToEnlighten: !!network.ever_reported_to_enlighten,
                    lastEnlightenReporDate: this.formatTimestamp(network.last_enlighten_report_time),
                    primaryInterface: ApiCodes[network.primary_interface],
                    interfaces
                },
                comm: {
                    num: comm.num,
                    level: this.scaleValue(comm.level, 0, 5, 0, 100),
                    pcuNum: comm.pcu?.num,
                    pcuLevel: this.scaleValue(comm.pcu?.level, 0, 5, 0, 100),
                    acbNum: comm.acb?.num,
                    acbLevel: this.scaleValue(comm.acb?.level, 0, 5, 0, 100),
                    nsrbNum: comm.nsrb?.num,
                    nsrbLevel: this.scaleValue(comm.nsrb?.level, 0, 5, 0, 100),
                    esubNum: commEnsemble.num,
                    esubLevel: this.scaleValue(commEnsemble.level, 0, 5, 0, 100),
                    encharges
                },
                wirelessKits,
                gridProfile: home.gridProfile
            };

            this.pv.home = obj;

            // Create characteristics
            const characteristics = [
                { type: Characteristic.Alerts, value: obj.alerts },
                { type: Characteristic.TimeZone, value: obj.timeZone },
                { type: Characteristic.CurrentDateTime, value: this.formatTimestamp() },
                { type: Characteristic.DbSize, value: obj.dbSize },
                { type: Characteristic.DbPercentFull, value: obj.dbPercentFull },
                { type: Characteristic.NetworkWebComm, value: obj.network.webComm },
                { type: Characteristic.EverReportedToEnlighten, value: obj.network.everReportedToEnlighten },
                { type: Characteristic.LastEnlightenReporDate, value: obj.network.lastEnlightenReporDate },
                { type: Characteristic.CommInterface, value: obj.network.primaryInterface },
                { type: Characteristic.Tariff, value: obj.tariff },
                { type: Characteristic.CommNumAndLevel, value: `${obj.comm.num} / ${obj.comm.level} %` },
                { type: Characteristic.CommNumPcuAndLevel, value: `${obj.comm.pcuNum} / ${obj.comm.pcuLevel} %` },
                { type: Characteristic.UpdateStatus, value: obj.updateStatus }
            ];

            if (this.feature.inventory.nsrbs.installed) {
                characteristics.push({ type: Characteristic.CommNumNsrbAndLevel, value: `${obj.comm.nsrbNum} / ${obj.comm.nsrbLevel} %` });
            }

            if (this.feature.inventory.acbs.installed) {
                characteristics.push({ type: Characteristic.CommNumAcbAndLevel, value: `${obj.comm.acbNum} / ${obj.comm.acbLevel} %` });
            }

            if (this.feature.inventory.esubs.encharges.installed) {
                characteristics.push({ type: Characteristic.CommNumEnchgAndLevel, value: `${obj.comm.encharges[0].num} / ${obj.comm.encharges[0].level} %` });
            }

            if (this.feature.gridProfile.supported) {
                characteristics.push({ type: Characteristic.GridProfile, value: obj.gridProfile });
            }

            // Update envoy services
            for (const { type, value } of characteristics) {
                if (!this.isValidValue(value)) continue;
                this.envoyService?.updateCharacteristic(type, value);
            }

            // Wireless connection characteristics
            if (wirelessConnectionsInstalled) {
                home.wirelessKits?.forEach((kit, index) => {
                    if (!kit) return;

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.SignalStrength, value: kit.signalStrength },
                        { type: Characteristic.SignalStrengthMax, value: kit.signalStrengthMax },
                        { type: Characteristic.Type, value: kit.type },
                        { type: Characteristic.Connected, value: kit.connected },
                    ];

                    // Update envoy services
                    for (const { type, value } of characteristics) {
                        if (!this.isValidValue(value)) continue;
                        this.wirelessConnectionsKitServices?.[index]?.updateCharacteristic(type, value);
                    }
                });
            }

            // Mark feature supported
            this.feature.homeData.supported = true;

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('homedata', this.pv.home);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Home Data', this.pv.home);

            return true;
        } catch (error) {
            throw new Error(`Update home data error: ${error.message || error}`);
        }
    }

    async updateMetersData() {
        if (this.logDebug) this.emit('debug', 'Requesting meters data');

        try {
            const meters = this.pv.meters ?? [];

            // Process meters in parallel for async calls
            const updatedMeters = await Promise.all(meters.map(async (meter, index) => {
                if (!meter) return null;

                // Await device status
                const type = ApiCodes[meter.type] ?? meter.type;
                const measurementType = ApiCodes[meter.measurementType];
                const deviceStatus = await this.getStatus(meter.statusFlags);

                const meterData = {
                    type,
                    eid: meter.eid,
                    activeCount: meter.activeCount,
                    measurementType,
                    readingTime: this.formatTimestamp(meter.readingTime),
                    state: !!meter.state,
                    phaseMode: meter.phaseMode,
                    phaseCount: meter.phaseCount,
                    meteringStatus: meter.meteringStatus,
                    deviceStatus,
                    voltageDivide: meter.voltageDivide,
                    powerFactorDivide: meter.powerFactorDivide,
                };

                // Create characteristics
                const characteristics = [
                    { type: Characteristic.State, value: meterData.state },
                    { type: Characteristic.PhaseMode, value: meterData.phaseMode },
                    { type: Characteristic.PhaseCount, value: meterData.phaseCount },
                    { type: Characteristic.MeteringStatus, value: meterData.meteringStatus },
                    { type: Characteristic.Status, value: meterData.deviceStatus },
                    { type: Characteristic.ReadingTime, value: meterData.readingTime },
                ];

                // If meter has active state, extend with measurements
                if (meter.state) {
                    Object.assign(meterData, {
                        power: meter.power,
                        powerKw: meter.power != null ? meter.power / 1000 : null,
                        apparentPower: meter.apparentPower,
                        apparentPowerKw: meter.apparentPower != null ? meter.apparentPower / 1000 : null,
                        reactivePower: meter.reactivePower,
                        reactivePowerKw: meter.reactivePower != null ? meter.reactivePower / 1000 : null,
                        energyLifetime: meter.energyLifetime,
                        energyLifetimeKw: meter.energyLifetime != null ? meter.energyLifetime / 1000 : null,
                        energyLifetimeUpload: meter.energyLifetimeUpload,
                        energyLifetimeUploadKw: meter.energyLifetimeUpload != null ? meter.energyLifetimeUpload / 1000 : null,
                        apparentEnergy: meter.apparentEnergy,
                        current: meter.current,
                        voltage: meter.voltage / meterData.voltageDivide,
                        pwrFactor: meter.pwrFactor / meterData.powerFactorDivide,
                        frequency: meter.frequency,
                        channels: meter.channels,
                    });

                    // Add characteristics
                    characteristics.push(
                        { type: Characteristic.Power, value: meterData.powerKw },
                        { type: Characteristic.ApparentPower, value: meterData.apparentPowerKw },
                        { type: Characteristic.ReactivePower, value: meterData.reactivePowerKw },
                        { type: Characteristic.EnergyLifetime, value: meterData.energyLifetimeKw },
                        { type: Characteristic.Current, value: meterData.current },
                        { type: Characteristic.Voltage, value: meterData.voltage },
                        { type: Characteristic.PwrFactor, value: meterData.pwrFactor },
                        { type: Characteristic.Frequency, value: meterData.frequency }
                    );

                    if (meterData.measurementType !== 'Consumption Total') {
                        characteristics.push({ type: Characteristic.EnergyLifetimeUpload, value: meterData.energyLifetimeUploadKw });
                    }
                }

                // Emit info logs if enabled
                if (this.logInfo) {
                    this.emit('info', `Meter: ${measurementType}, state: ${meterData.state ? 'Enabled' : 'Disabled'}`);
                    this.emit('info', `Meter: ${measurementType}, phase mode: ${meterData.phaseMode}`);
                    this.emit('info', `Meter: ${measurementType}, phase count: ${meterData.phaseCount}`);
                    this.emit('info', `Meter: ${measurementType}, metering status: ${meterData.meteringStatus}`);
                    this.emit('info', `Meter: ${measurementType}, status: ${meterData.deviceStatus}`);

                    if (meter.state) {
                        this.emit('info', `Meter: ${measurementType}, power: ${meterData.powerKw} kW`);
                        this.emit('info', `Meter: ${measurementType}, energy lifetime: ${meterData.energyLifetimeKw} kWh`);
                        this.emit('info', `Meter: ${measurementType}, current: ${meterData.current} A`);
                        this.emit('info', `Meter: ${measurementType}, voltage: ${meterData.voltage} V`);
                        this.emit('info', `Meter: ${measurementType}, power factor: ${meterData.pwrFactor} cos φ`);
                        this.emit('info', `Meter: ${measurementType}, frequency: ${meterData.frequency} Hz`);
                    }
                }

                // Update meters services
                for (const { type, value } of characteristics) {
                    if (!this.isValidValue(value)) continue;
                    this.meterServices?.[index]?.updateCharacteristic(type, value);
                }

                return meterData;
            }));

            // Filter out any nulls from skipped meters and update inventory
            this.pv.meters = updatedMeters.filter(Boolean);

            // Mark feature supported
            this.feature.metersData.supported = true;

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('metersdata', this.pv.meters);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Meters Data', this.pv.meters);

            return true;
        } catch (error) {
            throw new Error(`Update meters data error: ${error.message || error}`);
        }
    }

    async updatePcusData() {
        if (this.logDebug) this.emit('debug', 'Requesting pcus data');

        try {
            const pcusStatusDataSupported = this.feature.pcuStatus?.supported ?? false;
            const pcusDetailedDataSupported = this.feature.detailedDevicesData?.pcus?.supported ?? false;
            const pcus = this.pv.inventory?.pcus ?? [];

            const updatedPcus = await Promise.all(pcus.map(async (pcu, index) => {
                if (!pcu) return null;

                // Await async getStatus call
                const type = ApiCodes[pcu.type] ?? pcu.type;
                const deviceStatus = await this.getStatus(pcu.deviceStatus);
                const deviceControl = pcu.deviceControl[0]?.gficlearset ? 'Yes' : 'No';

                // Base PCU data object
                const pcuData = {
                    type,
                    readingTime: this.formatTimestamp(pcu.readingTime),
                    partNumber: pcu.partNumber,
                    installed: pcu.installed,
                    serialNumber: pcu.serialNumber,
                    deviceStatus,
                    adminState: pcu.adminState,
                    devType: pcu.devType,
                    createdDate: pcu.createdDate,
                    imageLoadDate: pcu.imageLoadDate,
                    firmware: pcu.firmware,
                    ptpn: pcu.ptpn,
                    chaneId: pcu.chaneId,
                    deviceControl,
                    producing: !!pcu.producing,
                    communicating: !!pcu.communicating,
                    provisioned: !!pcu.provisioned,
                    operating: !!pcu.operating,
                    phase: ApiCodes[pcu.phase],
                    gridProfile: pcu.gridProfile,
                    plcLevel: pcu.plcLevel,
                };

                // Create characteristics
                const characteristics = [
                    { type: Characteristic.Status, value: pcuData.deviceStatus },
                    { type: Characteristic.Phase, value: pcuData.phase },
                    { type: Characteristic.GfiClear, value: pcuData.deviceControl },
                    { type: Characteristic.Firmware, value: pcuData.firmware },
                    { type: Characteristic.Producing, value: pcuData.producing },
                    { type: Characteristic.Communicating, value: pcuData.communicating },
                    { type: Characteristic.Provisioned, value: pcuData.provisioned },
                    { type: Characteristic.Operating, value: pcuData.operating },
                    { type: Characteristic.ReadingTime, value: pcuData.readingTime },
                ];

                // Add power info if supported
                if (pcusStatusDataSupported || pcusDetailedDataSupported) {
                    Object.assign(pcuData, {
                        power: pcu.power,
                        powerPeak: pcu.powerPeak,
                    });

                    // Add characteristics
                    characteristics.push(
                        { type: Characteristic.PowerW, value: pcuData.power },
                        { type: Characteristic.PowerPeakW, value: pcuData.powerPeak });
                }

                // Add detailed info if supported
                if (pcusDetailedDataSupported) {
                    Object.assign(pcuData, {
                        powerUsed: pcu.powerUsed,
                        energyToday: pcu.energyToday,
                        energyTodayKw: pcu.energyToday != null ? pcu.energyToday / 1000 : null,
                        energyYesterday: pcu.energyYesterday,
                        energyYesterdayKw: pcu.energyYesterday != null ? pcu.energyYesterday / 1000 : null,
                        energyLastSevenDays: pcu.energyLastSevenDays,
                        energyLastSevenDaysKw: pcu.energyLastSevenDays != null ? pcu.energyLastSevenDays / 1000 : null,
                        energyLifetime: pcu.energyLifetime,
                        energyLifetimeKw: pcu.energyLifetime != null ? pcu.energyLifetime / 1000 : null,
                        voltage: pcu.voltage != null ? pcu.voltage / 1000 : null,
                        frequency: pcu.frequency != null ? pcu.frequency / 1000 : null,
                        currentDc: pcu.currentDc != null ? pcu.currentDc / 1000 : null,
                        voltageDc: pcu.voltageDc != null ? pcu.voltageDc / 1000 : null,
                        temperature: pcu.temperature,
                    });

                    // Add characteristics
                    characteristics.push(
                        { type: Characteristic.EnergyTodayWh, value: pcuData.energyToday },
                        { type: Characteristic.EnergyYesterdayWh, value: pcuData.energyYesterday },
                        { type: Characteristic.EnergyLastSevenDays, value: pcuData.energyLastSevenDaysKw },
                        { type: Characteristic.Voltage, value: pcuData.voltage },
                        { type: Characteristic.Frequency, value: pcuData.frequency },
                        { type: Characteristic.CurrentDc, value: pcuData.currentDc },
                        { type: Characteristic.VoltageDc, value: pcuData.voltageDc },
                        { type: Characteristic.Temperature, value: pcuData.temperature },
                        { type: Characteristic.GridProfile, value: pcuData.gridProfile },
                        { type: Characteristic.PlcLevel, value: pcuData.plcLevel });
                }

                // Update meters services
                for (const { type, value } of characteristics) {
                    if (!this.isValidValue(value)) continue;
                    this.pcuServices?.[index]?.updateCharacteristic(type, value);
                }

                return pcuData;
            }));

            // Remove null entries from the array
            this.pv.inventory.pcus = updatedPcus.filter(Boolean);

            // Mark pcusData feature supported
            this.feature.pcusData.supported = true;

            // Update RESTful and MQTT if connected
            if (this.restFulConnected) this.restFul1.update('microinvertersdata', this.pv.inventory.pcus);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Microinverters Data', this.pv.inventory.pcus);

            return true;
        } catch (error) {
            throw new Error(`Update pcus data error: ${error.message || error}`);
        }
    }

    async updateNsrbsData() {
        if (this.logDebug) this.emit('debug', 'Requesting nsrbs data');

        try {
            const nsrbsDetailedDataSupported = this.feature.detailedDevicesData?.nsrbs?.supported ?? false;
            const nsrbs = this.pv.inventory?.nsrbs ?? [];

            const updatedNsrbs = await Promise.all(nsrbs.map(async (nsrb, index) => {
                if (!nsrb) return null;

                // Await deviceStatus conversion
                const type = ApiCodes[nsrb.type] ?? nsrb.type;
                const deviceStatus = await this.getStatus(nsrb.deviceStatus);
                const deviceControl = nsrb.deviceControl[0]?.gficlearset ? 'Yes' : 'No';

                // Base NSRB data object
                const nsrbData = {
                    type,
                    partNumber: nsrb.partNumber,
                    installed: nsrb.installed,
                    serialNumber: nsrb.serialNumber,
                    deviceStatus,
                    readingTime: this.formatTimestamp(nsrb.readingTime),
                    adminState: nsrb.adminState,
                    devType: nsrb.devType,
                    createdDate: nsrb.createdDate,
                    imageLoadDate: nsrb.imageLoadDate,
                    firmware: nsrb.firmware,
                    ptpn: nsrb.ptpn,
                    chaneId: nsrb.chaneId,
                    deviceControl,
                    producing: !!nsrb.producing,
                    communicating: !!nsrb.communicating,
                    provisioned: !!nsrb.provisioned,
                    operating: !!nsrb.operating,
                    relay: ApiCodes[nsrb.relay],
                    relayState: nsrb.relayState === 'closed',
                    reasonCode: nsrb.reasonCode,
                    reason: nsrb.reason,
                    linesCount: nsrb.linesCount,
                    line1Connected: nsrb.linesCount >= 1 ? !!nsrb.line1Connected : null,
                    line2Connected: nsrb.linesCount >= 2 ? !!nsrb.line2Connected : null,
                    line3Connected: nsrb.linesCount >= 3 ? !!nsrb.line3Connected : null,
                    gridProfile: nsrb.gridProfile,
                    plcLevel: nsrb.plcLevel,
                };

                // Create characteristics
                const characteristics = [
                    { type: Characteristic.Status, value: nsrbData.deviceStatus },
                    { type: Characteristic.GfiClear, value: nsrbData.deviceControl },
                    { type: Characteristic.State, value: nsrbData.relayState },
                    { type: Characteristic.LinesCount, value: nsrbData.linesCount },
                    { type: Characteristic.Firmware, value: nsrbData.firmware },
                    { type: Characteristic.Communicating, value: nsrbData.communicating },
                    { type: Characteristic.Provisioned, value: nsrbData.provisioned },
                    { type: Characteristic.Operating, value: nsrbData.operating },
                    { type: Characteristic.ReadingTime, value: nsrbData.readingTime },
                    { type: Characteristic.Line1Connected, value: nsrbData.line1Connected },
                    { type: Characteristic.Line2Connected, value: nsrbData.line2Connected },
                    { type: Characteristic.Line3Connected, value: nsrbData.line3Connected },
                    { type: Characteristic.GridProfile, value: nsrbData.gridProfile },
                    { type: Characteristic.PlcLevel, value: nsrbData.plcLevel }
                ];

                // Add detailed data if supported
                if (nsrbsDetailedDataSupported) {
                    Object.assign(nsrbData, {
                        active: nsrb.active,
                        acOffset: nsrb.acOffset,
                        voltageL1: nsrb.linesCount >= 1 ? nsrb.voltageL1 / 1000 : null,
                        voltageL2: nsrb.linesCount >= 2 ? nsrb.voltageL2 / 1000 : null,
                        voltageL3: nsrb.linesCount >= 3 ? nsrb.voltageL3 / 1000 : null,
                        frequency: nsrb.frequency != null ? nsrb.frequency / 1000 : null,
                        temperature: nsrb.temperature,
                    });

                    // Add characteristics
                    characteristics.push(
                        { type: Characteristic.AcOffset, value: nsrbData.acOffset },
                        { type: Characteristic.Frequency, value: nsrbData.frequency },
                        { type: Characteristic.Temperature, value: nsrbData.temperature },
                        { type: Characteristic.VoltageL1, value: nsrbData.voltageL1 },
                        { type: Characteristic.VoltageL2, value: nsrbData.voltageL2 },
                        { type: Characteristic.VoltageL3, value: nsrbData.voltageL3 });
                }

                // Update relay state sensors if configured
                if (this.qRelayStateActiveSensor) {
                    const sensorCount = this.qRelayStateActiveSensor.multiphase && nsrbData.linesCount > 1 ? nsrbData.linesCount + 1 : 1;

                    for (let i = 0; i < sensorCount; i++) {
                        let state;
                        switch (i) {
                            case 0: state = nsrbData.relayState; break;
                            case 1: state = nsrbData.line1Connected; break;
                            case 2: state = nsrbData.line2Connected; break;
                            case 3: state = nsrbData.line3Connected; break;
                            default: state = false;
                        }
                        this.qRelayStateActiveSensor[`state${i}`] = state;
                        this.nsrbStateSensorServices?.[index]?.[i]?.updateCharacteristic(this.qRelayStateActiveSensor.characteristicType, state);
                    }
                }

                // Update meters services
                for (const { type, value } of characteristics) {
                    if (!this.isValidValue(value)) continue;
                    this.nsrbServices?.[index]?.updateCharacteristic(type, value);
                }

                return nsrbData;
            }));

            // Filter nulls and replace inventory
            this.pv.inventory.nsrbs = updatedNsrbs.filter(Boolean);

            // Mark supported
            this.feature.nsrbsData.supported = true;

            // RESTFul and MQTT update
            if (this.restFulConnected) this.restFul1.update('qrelaysdata', this.pv.inventory.nsrbs);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Q-Relays Data', this.pv.inventory.nsrbs);

            return true;
        } catch (error) {
            throw new Error(`Update nsrbs data error: ${error.message || error}`);
        }
    }

    async updateAcbsData() {
        if (this.logDebug) this.emit('debug', `Requesting acbs data`);

        try {
            const productionCtSupported = this.feature.productionCt?.acbs?.supported ?? false;
            const acbs = this.pv.inventory?.acbs ?? [];

            // Process all ACBs concurrently
            const updatedAcbs = await Promise.all(acbs.map(async (acb, index) => {
                if (!acb) return null;

                // Get device status asynchronously
                const type = ApiCodes[acb.type] ?? acb.type;
                const deviceStatus = await this.getStatus(acb.deviceStatus);
                const deviceControl = acb.deviceControl[0]?.gficlearset ? 'Yes' : 'No';

                // Compose ACB data object
                const acbData = {
                    type,
                    partNumber: acb.partNumber,
                    installed: acb.installed,
                    serialNumber: acb.serialNumber,
                    deviceStatus,
                    readingTime: this.formatTimestamp(acb.readingTime),
                    adminState: acb.adminState,
                    devType: acb.devType,
                    createdDate: acb.createdDate,
                    imageLoadDate: acb.imageLoadDate,
                    firmware: acb.firmware,
                    ptpn: acb.ptpn,
                    chaneId: acb.chaneId,
                    deviceControl,
                    producing: !!!!acb.producing,
                    communicating: !!acb.communicating,
                    provisioned: !!acb.provisioned,
                    operating: !!acb.operating,
                    sleepEnabled: acb.sleepEnabled,
                    percentFull: acb.percentFull,
                    maxCellTemp: acb.maxCellTemp,
                    sleepMinSoc: acb.sleepMinSoc,
                    sleepMaxSoc: acb.sleepMaxSoc,
                    chargeState: ApiCodes[acb.chargeState],
                    chargeStateNum: acb.chargeState === 'discharging' ? 0 : acb.chargeState === 'charging' ? 1 : 2,
                    gridProfile: acb.gridProfile,
                    plcLevel: acb.plcLevel
                };

                // Update storage backup accessory level and state
                if (this.acBatterieBackupLevelActiveAccessory) {
                    const accessory = this.acBatterieBackupLevelActiveAccessory;
                    const { minSoc, characteristicType, characteristicType1, characteristicType2 } = accessory;

                    // Create characteristics
                    const characteristics = [
                        { type: characteristicType, value: acbData.percentFull < minSoc },
                        { type: characteristicType1, value: acbData.percentFull },
                        { type: characteristicType2, value: acbData.chargeStateNum },
                    ];

                    // Update acbs services
                    for (const { type, value } of characteristics) {
                        if (!this.isValidValue(value)) continue;
                        this.acbLevelAndStateServices?.[index]?.updateCharacteristic(type, value);
                    }
                }

                // Create characteristics
                const characteristics = [
                    { type: Characteristic.ChargeState, value: acbData.chargeState },
                    { type: Characteristic.Status, value: acbData.deviceStatus },
                    { type: Characteristic.GfiClear, value: acbData.deviceControl },
                    { type: Characteristic.Firmware, value: acbData.firmware },
                    { type: Characteristic.Producing, value: acbData.producing },
                    { type: Characteristic.Communicating, value: acbData.communicating },
                    { type: Characteristic.Provisioned, value: acbData.provisioned },
                    { type: Characteristic.Operating, value: acbData.operating },
                    { type: Characteristic.SleepEnabled, value: acbData.sleepEnabled },
                    { type: Characteristic.PercentFull, value: acbData.percentFull },
                    { type: Characteristic.MaxCellTemp, value: acbData.maxCellTemp },
                    { type: Characteristic.SleepMinSoc, value: acbData.sleepMinSoc },
                    { type: Characteristic.SleepMaxSoc, value: acbData.sleepMaxSoc },
                    { type: Characteristic.ReadingTime, value: acbData.readingTime },
                    { type: Characteristic.GridProfile, value: acbData.gridProfile },
                    { type: Characteristic.PlcLevel, value: acbData.plcLevel }
                ];

                // Update storage services
                for (const { type, value } of characteristics) {
                    if (!this.isValidValue(value)) continue;
                    this.acbServices?.[index]?.updateCharacteristic(type, value);
                }

                // Add summary fields for first ACB if supported
                if (productionCtSupported && index === 0) {
                    const percentFullSum = this.scaleValue(acb.energySum, 0, acb.activeCount * 1.5, 0, 100);
                    const chargeStateSum = ApiCodes[acb.chargeStatusSum];

                    Object.assign(acbData, {
                        measurementType: acb.measurementType,
                        activeCount: acb.activeCount,
                        powerSum: acb.powerSum,
                        powerSumKw: acb.powerSum != null ? acb.energySum / 1000 : null,
                        energySum: acb.energySum,
                        energySumKw: acb.energySum != null ? acb.energySum / 1000 : null,
                        chargeStateSum: chargeStateSum,
                        chargeStateSumNum: acb.chargeStatusSum === 'discharging' ? 0 : acb.chargeStatusSum === 'charging' ? 1 : 2,
                        percentFullSum,
                        energyStateSum: acb.energySum > 0,
                    });

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.ChargeState, value: chargeStateSum },
                        { type: Characteristic.Power, value: acbData.powerSumKw },
                        { type: Characteristic.Energy, value: acbData.energySumKw },
                        { type: Characteristic.PercentFull, value: percentFullSum },
                        { type: Characteristic.ActiveCount, value: acbData.activeCount },
                        { type: Characteristic.ReadingTime, value: acbData.readingTime },
                    ];

                    // Update storage summary service
                    for (const { type, value } of characteristics) {
                        if (!this.isValidValue(value)) continue;
                        this.acbSummaryService?.updateCharacteristic(type, value);
                    }

                    // Updatestorage backup summary accessory level and state
                    if (this.acBatterieBackupLevelSummaryActiveAccessory && !this.feature.liveData.supported) {

                        if (this.logInfo) {
                            this.emit('info', `Acb Data, ${this.acBatterieName}, backup energy: ${acbData.energySumKw} kW`);
                            this.emit('info', `Acb Data, ${this.acBatterieName}, backup level level: ${percentFullSum} %`);
                        }

                        const accessory = this.acBatterieBackupLevelSummaryActiveAccessory;
                        const { minSoc, displayType, characteristicType, characteristicType1 } = accessory;
                        const isServiceBattery = displayType === 5;
                        const isAboveMinSoc = percentFullSum > minSoc;
                        const backupLevel = isAboveMinSoc ? percentFullSum : 0;
                        const state = isServiceBattery ? !isAboveMinSoc : isAboveMinSoc;

                        accessory.state = state;
                        accessory.backupLevel = backupLevel;

                        // Create characteristics
                        const characteristics = [
                            { type: characteristicType, value: state },
                            { type: characteristicType1, value: backupLevel },
                        ];

                        // Update storage summary services
                        for (const { type, value } of characteristics) {
                            if (!this.isValidValue(value)) continue;
                            this.acbSummaryLevelAndStateService?.updateCharacteristic(type, value);
                        }
                    }
                }

                return acbData;
            }));

            // Filter out nulls and update inventory
            this.pv.inventory.acbs = updatedAcbs.filter(Boolean);

            // Set supported flag
            this.feature.acbsData.supported = true;

            // Update REST and MQTT endpoints
            if (this.restFulConnected) this.restFul1.update('acbatterydata', this.pv.inventory.acbs);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'AC Battery Data', this.pv.inventory.acbs);

            return true;
        } catch (error) {
            throw new Error(`Update acbs data error: ${error.message || error}`);
        }
    }

    async updatePowerAndEnergyData() {
        if (this.logDebug) this.emit('debug', `Requesting power and energy data`);

        try {
            const dataArr = [
                { type: 'production', state: this.feature.meters.production.enabled },
                { type: 'consumptionNet', state: this.feature.meters.consumptionNet.enabled },
                { type: 'consumptionTotal', state: this.feature.meters.consumptionTotal.enabled }
            ];

            for (const [index, data] of dataArr.entries()) {
                const { type: key, state: meterEnabled } = data;

                if (key !== 'production' && !meterEnabled) continue;

                let sourceMeter, sourceEnergy;
                let power, powerLevel, powerState, powerPeak, powerPeakDetected;
                let energyToday, energyLastSevenDays, energyLifetime, energyLifetimeUpload, energyLifetimeWithOffset;
                const powerPeakStored = this.pv.powerAndEnergy[key].powerPeak;

                switch (key) {
                    case 'production': {
                        const sourcePcu = this.pv.powerAndEnergy[key].pcu;
                        const sourceEim = this.pv.powerAndEnergy[key].eim;
                        sourceMeter = meterEnabled ? this.pv.meters.find(m => m.measurementType === 'Production') : sourcePcu;
                        sourceEnergy = meterEnabled ? sourceEim : sourcePcu;
                        power = this.isValidValue(sourceMeter.power) ? sourceMeter.power : null;
                        powerLevel = this.powerProductionSummary > 1 && this.isValidValue(sourceMeter.power) ? this.scaleValue(sourceMeter.power, 0, this.powerProductionSummary, 0, 100) : null;
                        powerState = powerLevel > 0;
                        powerPeak = this.isValidValue(sourceMeter.power) && sourceMeter.power > powerPeakStored ? sourceMeter.power : powerPeakStored;
                        powerPeakDetected = power > powerPeak;
                        energyToday = this.isValidValue(sourceEnergy.energyToday) ? sourceEnergy.energyToday : null;
                        energyLastSevenDays = this.isValidValue(sourceEnergy.energyLastSevenDays) ? sourceEnergy.energyLastSevenDays : null;
                        energyLifetime = this.isValidValue(sourceMeter.energyLifetime) ? sourceMeter.energyLifetime : null;
                        energyLifetimeUpload = this.isValidValue(sourceMeter.energyLifetimeUpload) ? sourceMeter.energyLifetimeUpload : null;
                        energyLifetimeWithOffset = this.isValidValue(sourceMeter.energyLifetime) ? energyLifetime + this.energyProductionLifetimeOffset : null;
                        break;
                    }
                    case 'consumptionNet': {
                        sourceMeter = this.pv.meters.find(m => m.measurementType === 'Consumption Net');
                        sourceEnergy = this.pv.powerAndEnergy[key];
                        power = this.isValidValue(sourceMeter.power) ? sourceMeter.power : null;
                        powerPeak = this.isValidValue(sourceMeter.power) && sourceMeter.power > powerPeakStored ? sourceMeter.power : powerPeakStored;
                        powerPeakDetected = power < 0 ? power < powerPeak : power > powerPeak;
                        energyToday = this.isValidValue(sourceEnergy.energyToday) ? sourceEnergy.energyToday : null;
                        energyLastSevenDays = this.isValidValue(sourceEnergy.energyLastSevenDays) ? sourceEnergy.energyLastSevenDays : null;
                        energyLifetime = this.isValidValue(sourceMeter.energyLifetime) ? sourceMeter.energyLifetime : null;
                        energyLifetimeUpload = this.isValidValue(sourceMeter.energyLifetimeUpload) ? sourceMeter.energyLifetimeUpload : null;
                        energyLifetimeWithOffset = this.isValidValue(sourceMeter.energyLifetime) ? energyLifetime + this.energyConsumptionNetLifetimeOffset : null;
                        break;
                    }
                    case 'consumptionTotal': {
                        sourceMeter = this.pv.meters.find(m => m.measurementType === 'Consumption Total');
                        sourceEnergy = this.pv.powerAndEnergy[key];
                        power = this.isValidValue(sourceMeter.power) ? sourceMeter.power : null;
                        powerPeak = this.isValidValue(sourceMeter.power) && sourceMeter.power > powerPeakStored ? sourceMeter.power : powerPeakStored;
                        powerPeakDetected = power > powerPeak;
                        energyToday = this.isValidValue(sourceEnergy.energyToday) ? sourceEnergy.energyToday : null;
                        energyLastSevenDays = this.isValidValue(sourceEnergy.energyLastSevenDays) ? sourceEnergy.energyLastSevenDays : null;
                        energyLifetime = this.isValidValue(sourceMeter.energyLifetime) ? sourceMeter.energyLifetime : null;
                        energyLifetimeWithOffset = this.isValidValue(sourceMeter.energyLifetime) ? energyLifetime + this.energyConsumptionTotalLifetimeOffset : null;
                        break;
                    }
                }
                if (this.isValidValue(powerPeak)) {
                    this.pv.powerAndEnergy[key].powerPeak = powerPeak;
                }

                if (!sourceMeter) continue;
                if (this.logDebug) {
                    this.emit('debug', `${sourceMeter?.measurementType} data source meter:`, sourceMeter);
                    this.emit('debug', `${sourceMeter?.measurementType} data source energy:`, sourceEnergy);
                }

                const type = ApiCodes[sourceMeter.type] ?? sourceMeter.type;
                const obj = {
                    type,
                    activeCount: sourceMeter?.activeCount,
                    measurementType: sourceMeter?.measurementType,
                    readingTime: this.formatTimestamp(sourceMeter.readingTime),
                    power,
                    powerKw: power != null ? power / 1000 : null,
                    powerLevel,
                    powerState,
                    powerPeak,
                    powerPeakKw: powerPeak != null ? powerPeak / 1000 : null,
                    powerPeakDetected,
                    energyToday,
                    energyTodayKw: energyToday != null ? energyToday / 1000 : null,
                    energyLastSevenDays,
                    energyLastSevenDaysKw: energyLastSevenDays != null ? energyLastSevenDays / 1000 : null,
                    energyLifetime: energyLifetimeWithOffset,
                    energyLifetimeKw: energyLifetimeWithOffset != null ? energyLifetimeWithOffset / 1000 : null,
                    energyState: energyToday > 0,
                    gridQualityState: meterEnabled,
                };

                if (this.logInfo) {
                    this.emit('info', `Power And Energy, ${obj.measurementType}, power: ${obj.powerKw} kW`);
                    this.emit('info', `Power And Energy, ${obj.measurementType}, power peak: ${obj.powerPeakKw} kW`);
                    if (!this.feature.liveData.supported || !this.feature.meters.production.enabled) this.emit('info', `Power And Energy, ${obj.measurementType}, power level: ${obj.powerLevel} %`);
                    this.emit('info', `Power And Energy, ${obj.measurementType}, energy today: ${obj.energyTodayKw} kWh`);
                    this.emit('info', `Power And Energy, ${obj.measurementType}, energy last seven days: ${obj.energyLastSevenDaysKw} kWh`);
                    this.emit('info', `Power And Energy, ${obj.measurementType}, energy lifetime: ${obj.energyLifetimeKw} kWh`);
                }

                // Create characteristics
                const characteristics = [
                    { type: Characteristic.ReadingTime, value: obj.readingTime },
                    { type: Characteristic.Power, value: obj.powerKw },
                    { type: Characteristic.PowerPeak, value: obj.powerPeakKw },
                    { type: Characteristic.PowerPeakDetected, value: obj.powerPeakDetected },
                    { type: Characteristic.EnergyToday, value: obj.energyTodayKw },
                    { type: Characteristic.EnergyLastSevenDays, value: obj.energyLastSevenDaysKw },
                    { type: Characteristic.EnergyLifetime, value: obj.energyLifetimeKw }
                ];

                // Add meter data
                if (meterEnabled) {
                    const obj1 = {
                        energyLifetimeUpload,
                        energyLifetimeUploadKw: energyLifetimeUpload != null ? energyLifetimeUpload / 1000 : null,
                        reactivePower: sourceMeter?.reactivePower,
                        reactivePowerKw: sourceMeter?.reactivePower != null ? sourceMeter.reactivePower / 1000 : null,
                        apparentPower: sourceMeter?.apparentPower,
                        apparentPowerKw: sourceMeter?.apparentPower != null ? sourceMeter.apparentPower / 1000 : null,
                        current: sourceMeter?.current,
                        voltage: sourceMeter?.voltage,
                        pwrFactor: sourceMeter?.pwrFactor,
                        frequency: sourceMeter?.frequency,
                    };

                    if (this.logInfo) {
                        this.emit('info', `Power And Energy, ${obj.measurementType}, current: ${obj1.current} A`);
                        this.emit('info', `Power And Energy, ${obj.measurementType}, voltage: ${obj1.voltage} V`);
                        this.emit('info', `Power And Energy, ${obj.measurementType}, power factor: ${obj1.pwrFactor} cos φ`);
                        this.emit('info', `Power And Energy, ${obj.measurementType}, frequency: ${obj1.frequency} Hz`);
                    }

                    Object.assign(obj, obj1);

                    // Add characteristics
                    characteristics.push(
                        { type: Characteristic.ReactivePower, value: obj1.reactivePowerKw },
                        { type: Characteristic.ApparentPower, value: obj1.apparentPowerKw },
                        { type: Characteristic.Current, value: obj1.current },
                        { type: Characteristic.Voltage, value: obj1.voltage },
                        { type: Characteristic.PwrFactor, value: obj1.pwrFactor },
                        { type: Characteristic.Frequency, value: obj1.frequency }
                    );

                    // Add characteristics
                    if (key !== 'consumptionTotal') {
                        characteristics.push({ type: Characteristic.EnergyLifetimeUpload, value: obj1.energyLifetimeUploadKw });
                    }

                    const gridQualitySensorsMap = {
                        production: [{ sensors: this.gridProductionQualityActiveSensors, services: this.gridProductionQualityActiveSensorServices }],
                        consumptionNet: [{ sensors: this.gridConsumptionNetQualityActiveSensors, services: this.gridConsumptionNetQualityActiveSensorServices }],
                        consumptionTotal: [{ sensors: this.gridConsumptionTotalQualityActiveSensors, services: this.gridConsumptionTotalQualityActiveSensorServices }]
                    };

                    if (gridQualitySensorsMap[key]) {
                        for (const group of gridQualitySensorsMap[key]) {
                            if (!group.sensors?.length) continue;

                            for (const [index, sensor] of group.sensors.entries()) {
                                const compareValue = [obj.current, obj.voltage, obj.frequency, obj.pwrFactor][sensor.compareMode];
                                if (!this.isValidValue(compareValue)) continue;

                                const state = this.evaluateCompareMode(compareValue, sensor.compareLevel, sensor.compareMode);
                                sensor.state = state;
                                group.services?.[index]?.updateCharacteristic(sensor.characteristicType, state);
                            }
                        }
                    }
                }

                // Update power and energy services
                for (const { type, value } of characteristics) {
                    if (!this.isValidValue(value)) continue;
                    this.powerAndEnergyServices?.[index]?.updateCharacteristic(type, value);
                };

                // Update system accessory service
                if (key === 'production' && this.isValidValue(obj.powerLevel) && (!this.feature.liveData.supported || !this.feature.meters.production.enabled)) {
                    const accessory = this.systemAccessory;
                    const { characteristicType, characteristicType1 } = accessory;
                    accessory.state = obj.powerState;
                    accessory.level = obj.powerLevel;

                    const characteristics = [
                        { type: characteristicType, value: accessory.state },
                        { type: characteristicType1, value: accessory.level },
                    ];

                    // Update system services
                    for (const { type, value } of characteristics) {
                        if (!this.isValidValue(value)) continue;
                        this.systemService?.updateCharacteristic(type, value);
                    };
                }

                // Power and energy level sensors
                const sensorsMap = {
                    production: [
                        { sensors: this.powerProductionLevelActiveSensors, services: this.powerProductionLevelSensorServices, value: obj.power, levelKey: 'powerLevel' },
                        { sensors: this.energyProductionLevelActiveSensors, services: this.energyProductionLevelSensorServices, value: obj.energyToday, levelKey: 'energyLevel' }
                    ],
                    consumptionNet: [
                        { sensors: this.powerConsumptionNetLevelActiveSensors, services: this.powerConsumptionNetLevelSensorServices, value: obj.power, levelKey: 'powerLevel' },
                        { sensors: this.energyConsumptionNetLevelActiveSensors, services: this.energyConsumptionNetLevelSensorServices, value: obj.energyToday, levelKey: 'energyLevel' }
                    ],
                    consumptionTotal: [
                        { sensors: this.powerConsumptionTotalLevelActiveSensors, services: this.powerConsumptionTotalLevelSensorServices, value: obj.power, levelKey: 'powerLevel' },
                        { sensors: this.energyConsumptionTotalLevelActiveSensors, services: this.energyConsumptionTotalLevelSensorServices, value: obj.energyToday, levelKey: 'energyLevel' }
                    ]
                };

                if (sensorsMap[key]) {
                    for (const group of sensorsMap[key]) {
                        if (!this.isValidValue(group.value) || !group.sensors?.length) continue;

                        for (const [index, sensor] of group.sensors.entries()) {
                            const state = this.evaluateCompareMode(group.value, sensor[group.levelKey], sensor.compareMode);
                            sensor.state = state;
                            group.services?.[index]?.updateCharacteristic(sensor.characteristicType, state);
                        }
                    }
                }

                this.pv.powerAndEnergy.sources[index] = obj;
            }

            this.feature.powerAndEnergyData.supported = true;

            if (this.restFulConnected) this.restFul1.update('powerandenergydata', this.pv.powerAndEnergy);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Power And Energy Data', this.pv.powerAndEnergy);

            return true;
        } catch (error) {
            throw new Error(`Update power and energy data error: ${error.message || error}`);
        }
    }

    async updateEnsembleData() {
        if (this.logDebug) this.emit('debug', `Requesting ensemble data`);

        try {
            const ensemblesInstalled = this.feature.inventory.esubs.installed;
            const ensemblesStatusSupported = this.feature.inventory.esubs.status.supported;
            const ensemblesSecCtrlSupported = this.feature.inventory.esubs.secctrl.supported;
            const ensemblesCountersSupported = this.feature.inventory.esubs.counters.supported;
            const ensemblesRelaySupported = this.feature.inventory.esubs.relay.supported;
            const enpowersInstalled = this.feature.inventory.esubs.enpowers.installed;
            const enpowersStatusSupported = this.feature.inventory.esubs.enpowers.status.supported;
            const enpowersDryContactsSupported = this.feature.inventory.esubs.enpowers.dryContacts.supported;
            const enpowersDryContactsSettingsSupported = this.feature.inventory.esubs.enpowers.dryContacts.settings.supported;
            const enchargesInstalled = this.feature.inventory.esubs.encharges.installed;
            const enchargesStatusSupported = this.feature.inventory.esubs.encharges.status.supported;
            const enchargesPowerSupported = this.feature.inventory.esubs.encharges.power.supported;
            const enchargesSettingsSupported = this.feature.inventory.esubs.encharges.settings.supported;
            const enchargesTariffSupported = this.feature.inventory.esubs.encharges.tariff.supported;
            const collarsInstalled = this.feature.inventory.esubs.collars.installed;
            const c6CombinerControllersInstalled = this.feature.inventory.esubs.c6CombinerControllers.installed;
            const c6RgmsInstalled = this.feature.inventory.esubs.c6Rgms.installed;
            const generatorInstalled = this.feature.inventory.esubs.generator.installed;
            const generatorSettingsInstalled = this.feature.inventory.esubs.generator.settings.supported;

            // Ensemble summary characteristics arrays
            const ensembleSummaryCharacteristics = [];

            // Ensemble devices
            if (ensemblesInstalled) {
                if (this.logDebug) this.emit('debug', `Requesting ensemble devices data`);

                const ensembles = this.pv.inventory.esubs.devices ?? [];
                const updatedEnsembles = await Promise.all(ensembles.map(async (ensemble, index) => {
                    const type = ApiCodes[ensemble.type] ?? ensemble.type;
                    const deviceStatus = await this.getStatus(ensemble.deviceStatus);
                    const deviceControl = ensemble.deviceControl?.[0]?.gficlearset ? 'Yes' : 'No';

                    const ensembleData = {
                        type,
                        readingTime: this.formatTimestamp(ensemble.readingTime),
                        partNumber: ensemble.partNumber,
                        installed: this.formatTimestamp(ensemble.installed),
                        serialNumber: ensemble.serialNumber,
                        deviceStatus,
                        adminState: ensemble.adminState,
                        deviceType: DeviceTypeMap[ensemble.devType] ?? ensemble.devType,
                        createdDate: this.formatTimestamp(ensemble.createdDate),
                        imageLoadDate: ensemble.imageLoadDate,
                        firmware: ensemble.firmware,
                        ptpn: ensemble.ptpn,
                        chaneId: ensemble.chaneId,
                        deviceControl,
                        producing: !!ensemble.producing,
                        communicating: !!ensemble.communicating,
                        operating: !!ensemble.operating,
                        status: ensemble.status ?? {}
                    };

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.Status, value: ensembleData.deviceStatus },
                        { type: Characteristic.GfiClear, value: ensembleData.deviceControl },
                        { type: Characteristic.Communicating, value: ensembleData.communicating },
                        { type: Characteristic.Operating, value: ensembleData.operating },
                        { type: Characteristic.Firmware, value: ensembleData.firmware },
                        { type: Characteristic.ReadingTime, value: ensembleData.readingTime },
                    ];

                    // Ensemble staus
                    if (ensemblesStatusSupported) {
                        if (this.logDebug) this.emit('debug', `Requesting ensemble status data`);

                        const ensembleStatusData = ensemble.status;
                        if (!ensembleStatusData) return;

                        const status = {
                            deviceType: DeviceTypeMap[ensembleStatusData.deviceType] ?? ensembleStatusData.deviceType,
                            readingTime: this.formatTimestamp(),
                            commInterfaceStr: ensembleStatusData.commInterfaceStr,
                            deviceId: ensembleStatusData.deviceId,
                            adminState: ensembleStatusData.adminState,
                            adminStateStr: ApiCodes[ensembleStatusData.adminStateStr] ?? ensembleStatusData.adminStateStr,
                            msgRetryCount: ensembleStatusData.msgRetryCount,
                            partNumber: ensembleStatusData.partNumber,
                            assemblyNumber: ensembleStatusData.assemblyNumber,
                            appFwVersion: ensembleStatusData.appFwVersion,
                            iblFwVersion: ensembleStatusData.iblFwVersion,
                            swiftAsicFwVersion: ensembleStatusData.swiftAsicFwVersion,
                            bmuFwVersion: ensembleStatusData.bmuFwVersion,
                            submodulesCount: ensembleStatusData.submodulesCount,
                            submodules: ensembleStatusData.submodules
                        };

                        // Update ensemble
                        ensemble.status = status;

                        // Update characteristics
                        characteristics.push(
                            { type: Characteristic.CommInterface, value: status.commInterfaceStr },
                            { type: Characteristic.AdminState, value: status.adminStateStr },
                        );
                    }

                    // Update ensemble services
                    for (const { type, value } of characteristics) {
                        if (!this.isValidValue(value)) continue;
                        this.ensembleServices?.[index]?.updateCharacteristic(type, value);
                    }

                    return ensembleData;
                }));

                // Update ensemble
                this.pv.inventory.esubs.devices = updatedEnsembles.filter(Boolean);
            }

            // Ensemble secctrl
            if (ensemblesSecCtrlSupported) {
                if (this.logDebug) this.emit('debug', `Requesting ensembles secctrl data`);

                // Get encharges installed phases
                const phaseA = this.pv.inventory.esubs.encharges.phaseA;
                const phaseB = this.pv.inventory.esubs.encharges.phaseB;
                const phaseC = this.pv.inventory.esubs.encharges.phaseC;

                const secctrlData = this.pv.inventory.esubs.secctrl;
                const secctrl = {
                    shutDown: !!secctrlData.shutdown,
                    offgridSecctrl: secctrlData.offgrid_secctrl,
                    configuredBackupSoc: secctrlData.configured_backup_soc,
                    adjustedBackupSoc: secctrlData.adjusted_backup_soc,
                    aggSoc: secctrlData.agg_soc,
                    aggMaxEnergy: secctrlData.Max_energy,
                    aggMaxEnergyKw: secctrlData.Max_energ != null ? secctrlData.Max_energ / 1000 : null,
                    encAggSoc: secctrlData.ENC_agg_soc,
                    encAggSoh: secctrlData.ENC_agg_soh,
                    encAggBackupEnergy: secctrlData.ENC_agg_backup_energy != null ? secctrlData.ENC_agg_backup_energy / 1000 : null,
                    encAggAvailEnergy: secctrlData.ENC_agg_avail_energy != null ? secctrlData.ENC_agg_avail_energy / 1000 : null,
                    encCommissionedCapacity: secctrlData.Enc_commissioned_capacity != null ? secctrlData.Enc_commissioned_capacity / 1000 : null,
                    encMaxAvailableCapacity: secctrlData.Enc_max_available_capacity != null ? secctrlData.Enc_max_available_capacity / 1000 : null,
                    acbAggSoc: secctrlData.ACB_agg_soc,
                    acbAggEnergy: secctrlData.ACB_agg_energy,
                    acbAggEnergyKw: secctrlData.ACB_agg_energy != null ? secctrlData.ACB_agg_energy / 1000 : null,
                    vlsLimit: secctrlData.VLS_Limit,
                    socRecEnabled: !!secctrlData.soc_rec_enabled,
                    socRecoveryEntry: secctrlData.soc_recovery_entry,
                    socRecoveryExit: secctrlData.soc_recovery_exit,
                    commisionInProgress: !!secctrlData.Commission_in_progress,
                    essInProgress: !!secctrlData.ESS_in_progress,
                    essR3ToR4InProgress: !!secctrlData.ESS_R3_To_R4_in_progress,
                    phaseA,
                    phaseB,
                    phaseC
                };

                if (phaseA) {
                    Object.assign(secctrl, {
                        freqBiasHz: secctrlData.freq_bias_hz,
                        voltageBiasV: secctrlData.voltage_bias_v,
                        freqBiasHzQ8: secctrlData.freq_bias_hz_q8,
                        voltageBiasVQ5: secctrlData.voltage_bias_v_q5,
                    });
                }

                if (phaseB) {
                    Object.assign(secctrl, {
                        freqBiasHzPhaseB: secctrlData.freq_bias_hz_phaseb,
                        voltageBiasVPhaseB: secctrlData.voltage_bias_v_phaseb,
                        freqBiasHzQ8PhaseB: secctrlData.freq_bias_hz_q8_phaseb,
                        voltageBiasVQ5PhaseB: secctrlData.voltage_bias_v_q5_phaseb
                    });
                }

                if (phaseC) {
                    Object.assign(secctrl, {
                        freqBiasHzPhaseC: secctrlData.freq_bias_hz_phasec,
                        voltageBiasVPhaseC: secctrlData.voltage_bias_v_phasec,
                        freqBiasHzQ8PhaseC: secctrlData.freq_bias_hz_q8_phasec,
                        voltageBiasVQ5PhaseC: secctrlData.voltage_bias_v_q5_phasec
                    });
                }

                this.pv.inventory.esubs.secctrl = secctrl;

                // Add to ensemble summary characteristics
                ensembleSummaryCharacteristics.push(
                    { type: Characteristic.AggSoc, value: secctrl.aggSoc },
                    { type: Characteristic.AggMaxEnergy, value: secctrl.aggMaxEnergyKw },
                    { type: Characteristic.EncAggSoc, value: secctrl.encAggSoc },
                    { type: Characteristic.EncAggBackupEnergy, value: secctrl.encAggBackupEnergy },
                    { type: Characteristic.EncAggAvailEnergy, value: secctrl.encAggAvailEnergy },
                    { type: Characteristic.ConfiguredBackupSoc, value: secctrl.configuredBackupSoc },
                    { type: Characteristic.AdjustedBackupSoc, value: secctrl.adjustedBackupSoc },
                );

                if (phaseA) {
                    ensembleSummaryCharacteristics.push(
                        { type: Characteristic.FrequencyBiasHz, value: secctrl.freqBiasHz },
                        { type: Characteristic.VoltageBiasV, value: secctrl.voltageBiasV },
                        { type: Characteristic.FrequencyBiasHzQ8, value: secctrl.freqBiasHzQ8 },
                        { type: Characteristic.VoltageBiasVQ5, value: secctrl.voltageBiasVQ5 },
                    );
                }

                if (phaseB) {
                    ensembleSummaryCharacteristics.push(
                        { type: Characteristic.FrequencyBiasHzPhaseB, value: secctrl.freqBiasHzPhaseB },
                        { type: Characteristic.VoltageBiasVPhaseB, value: secctrl.voltageBiasVPhaseB },
                        { type: Characteristic.FrequencyBiasHzQ8PhaseB, value: secctrl.freqBiasHzQ8PhaseB },
                        { type: Characteristic.VoltageBiasVQ5PhaseB, value: secctrl.voltageBiasVQ5PhaseB },
                    );
                }

                if (phaseC) {
                    ensembleSummaryCharacteristics.push(
                        { type: Characteristic.FrequencyBiasHzPhaseC, value: secctrl.freqBiasHzPhaseC },
                        { type: Characteristic.VoltageBiasVPhaseC, value: secctrl.voltageBiasVPhaseC },
                        { type: Characteristic.FrequencyBiasHzQ8PhaseC, value: secctrl.freqBiasHzQ8PhaseC },
                        { type: Characteristic.VoltageBiasVQ5PhaseC, value: secctrl.voltageBiasVQ5PhaseC },
                    );
                }

                // Update encharge summary accessory
                if (enchargesInstalled && !this.feature.liveData.supported) {

                    if (this.logInfo) {
                        this.emit('info', `Ensemble Data, ${this.enchargeName}, backup energy: ${secctrl.encAggBackupEnergy} kW`);
                        this.emit('info', `Ensemble Data, ${this.enchargeName}, backup level level: ${secctrl.encAggSoc} %`);
                    }

                    // Update encharges summary accessory
                    if (this.enchargeBackupLevelSummaryActiveAccessory) {
                        const accessory = this.enchargeBackupLevelSummaryActiveAccessory;
                        const { minSoc, displayType, characteristicType, characteristicType1 } = accessory;
                        const serviceBattery = displayType === 5;
                        const backupLevel = secctrl.encAggSoc > accessory.minSoc ? secctrl.encAggSoc : 0;
                        const state = serviceBattery ? backupLevel < minSoc : backupLevel > minSoc;

                        accessory.state = state;
                        accessory.backupLevel = backupLevel;

                        // Create characteristics
                        const characteristics = [
                            { type: characteristicType, value: state },
                            { type: characteristicType1, value: backupLevel },
                        ];

                        // Update storage summary services
                        for (const { type, value } of characteristics) {
                            if (!this.isValidValue(value)) continue;
                            this.enchargeSummaryLevelAndStateService?.updateCharacteristic(type, value);
                        }
                    }

                    // Update encharge summary backup level sensors
                    if (this.enchargeBackupLevelSummaryActiveSensors.length > 0) {
                        for (let i = 0; i < this.enchargeBackupLevelSummaryActiveSensors.length; i++) {
                            const sensor = this.enchargeBackupLevelSummaryActiveSensors[i];
                            const { backupLevel, compareMode, characteristicType } = sensor;
                            const state = this.evaluateCompareMode(secctrl.encAggSoc, backupLevel, compareMode);
                            sensor.state = state;

                            // Create characteristics
                            const characteristics = [
                                { type: characteristicType, value: state }
                            ];

                            // Update storage summary services
                            for (const { type, value } of characteristics) {
                                if (!this.isValidValue(value)) continue;
                                this.enchargeBackupLevelSensorServices?.[i]?.updateCharacteristic(type, value);
                            }
                        }
                    }
                }
            }

            // Ensemble counters
            if (ensemblesCountersSupported) {
                if (this.logDebug) this.emit('debug', `Requesting ensembles counters data`);

                const counterData = this.pv.inventory.esubs.counters;
                const counters = {
                    apiEcagtInit: counterData.api_ecagtInit,
                    apiEcagtTick: counterData.api_ecagtTick,
                    apiEcagtDeviceInsert: counterData.api_ecagtDeviceInsert,
                    apiEcagtDeviceNetworkStatus: counterData.api_ecagtDeviceNetworkStatus,
                    apiEcagtDeviceCommissionStatus: counterData.api_ecagtDeviceCommissionStatus,
                    apiEcagtDeviceRemoved: counterData.api_ecagtDeviceRemoved,
                    apiEcagtGetDeviceCount: counterData.api_ecagtGetDeviceCount,
                    apiEcagtGetDeviceInfo: counterData.api_ecagtGetDeviceInfo,
                    apiEcagtGetOneDeviceInfo: counterData.api_ecagtGetOneDeviceInfo,
                    apiEcagtDevIdToSerial: counterData.api_ecagtDevIdToSerial,
                    apiEcagtHandleMsg: counterData.api_ecagtHandleMsg,
                    apiEcagtGetSubmoduleInv: counterData.api_ecagtGetSubmoduleInv,
                    apiEcagtGetDataModelRaw: counterData.api_ecagtGetDataModelRaw,
                    apiEcagtSetSecCtrlBias: counterData.api_ecagtSetSecCtrlBias,
                    apiEcagtGetSecCtrlBias: counterData.api_ecagtGetSecCtrlBias,
                    apiEcagtGetSecCtrlBiasQ: counterData.api_ecagtGetSecCtrlBiasQ,
                    apiEcagtSetRelayAdmin: counterData.api_ecagtSetRelayAdmin,
                    apiEcagtGetRelayState: counterData.api_ecagtGetRelayState,
                    apiEcagtSetDataModelCache: counterData.api_ecagtSetDataModelCache,
                    apiAggNameplate: counterData.api_AggNameplate,
                    apiChgEstimated: counterData.api_ChgEstimated,
                    apiEcagtGetGridFreq: counterData.api_ecagtGetGridFreq,
                    apiEcagtGetGridVolt: counterData.api_ecagtGetGridVolt,
                    apiEcagtGetGridFreqErrNotfound: counterData.api_ecagtGetGridFreq_err_notfound,
                    apiEcagtGetGridFreqErrOor: counterData.api_ecagtGetGridFreq_err_oor,
                    restStatusGet: counterData.rest_StatusGet,
                    restInventoryGet: counterData.rest_InventoryGet,
                    restSubmodGet: counterData.rest_SubmodGet,
                    restSecCtrlGet: counterData.rest_SecCtrlGet,
                    restRelayGet: counterData.rest_RelayGet,
                    restRelayPost: counterData.rest_RelayPost,
                    restCommCheckGet: counterData.rest_CommCheckGet,
                    restPower: counterData.rest_Power,
                    restPowerKw: counterData.rest_Power != null ? counterData.rest_Power / 1000 : null,
                    extZbRemove: counterData.ext_zb_remove,
                    extZbRemoveErr: counterData.ext_zb_remove_err,
                    extCfgSaveDevice: counterData.ext_cfg_save_device,
                    extCfgSaveDeviceErr: counterData.ext_cfg_save_device_err,
                    extSendPerfData: counterData.ext_send_perf_data,
                    extEventSetStateful: counterData.ext_event_set_stateful,
                    extEventSetModgone: counterData.ext_event_set_modgone,
                    rxmsgObjMdlMetaRsp: counterData.rxmsg_OBJ_MDL_META_RSP,
                    rxmsgObjMdlInvUpdRsp: counterData.rxmsg_OBJ_MDL_INV_UPD_RSP,
                    rxmsgObjMdlPollRsp: counterData.rxmsg_OBJ_MDL_POLL_RSP,
                    rxmsgObjMdlRelayCtrlRsp: counterData.rxmsg_OBJ_MDL_RELAY_CTRL_RSP,
                    rxmsgObjMdlRelayStatusReq: counterData.rxmsg_OBJ_MDL_RELAY_STATUS_REQ,
                    rxmsgObjMdlGridStatusRsp: counterData.rxmsg_OBJ_MDL_GRID_STATUS_RSP,
                    rxmsgObjMdlEventMsg: counterData.rxmsg_OBJ_MDL_EVENT_MSG,
                    rxmsgObjMdlSosConfigRsp: counterData.rxmsg_OBJ_MDL_SOC_CONFIG_RSP,
                    txmsgObjMdlMetaReq: counterData.txmsg_OBJ_MDL_META_REQ,
                    txmsgObjMdlEncRtPollReq: counterData.txmsg_OBJ_MDL_ENC_RT_POLL_REQ,
                    txmsgObjMdlEnpRtPollReq: counterData.txmsg_OBJ_MDL_ENP_RT_POLL_REQ,
                    txmsgObjMdlBmuPollReq: counterData.txmsg_OBJ_MDL_BMU_POLL_REQ,
                    txmsgObjMdlPcuPollReq: counterData.txmsg_OBJ_MDL_PCU_POLL_REQ,
                    txmsgObjMdlSecondaryCtrlReq: counterData.txmsg_OBJ_MDL_SECONDARY_CTRL_REQ,
                    txmsgObjMdlRelayCtrlReq: counterData.txmsg_OBJ_MDL_RELAY_CTRL_REQ,
                    txmsgObjMdlGridStatusReq: counterData.txmsg_OBJ_MDL_GRID_STATUS_REQ,
                    txmsgObjMdlEventsAck: counterData.txmsg_OBJ_MDL_EVENTS_ACK,
                    txmsgObjMdlRelayStatusRsp: counterData.txmsg_OBJ_MDL_RELAY_STATUS_RSP,
                    txmsgObjMdlcosConfigReq: counterData.txmsg_OBJ_MDL_SOC_CONFIG_REQ,
                    txmsgObjMdlTnsStart: counterData.txmsg_OBJ_MDL_TNS_START,
                    rxmsgObjMdlTnsStartRsp: counterData.rxmsg_OBJ_MDL_TNS_START_RSP,
                    txmsgObjMdlSetUdmir: counterData.txmsg_OBJ_MDL_SET_UDMIR,
                    rxmsgObjMdlSetUdmirRsp: counterData.rxmsg_OBJ_MDL_SET_UDMIR_RSP,
                    txmsgObjMdlTnsEdn: counterData.txmsg_OBJ_MDL_TNS_END,
                    rxmsgObjMdlTnsEndRsp: counterData.rxmsg_OBJ_MDL_TNS_END_RSP,
                    txmsgLvsPoll: counterData.txmsg_lvs_poll,
                    zmqEcaHello: counterData.zmq_ecaHello,
                    zmqEcaDevInfo: counterData.zmq_ecaDevInfo,
                    zmqEcaNetworkStatus: counterData.zmq_ecaNetworkStatus,
                    zmqEcaAppMsg: counterData.zmq_ecaAppMsg,
                    zmqStreamdata: counterData.zmq_streamdata,
                    zmqLiveDebug: counterData.zmq_live_debug,
                    zmqEcaLiveDebugReq: counterData.zmq_eca_live_debug_req,
                    zmqNameplate: counterData.zmq_nameplate,
                    zmqEcaSecCtrlMsg: counterData.zmq_ecaSecCtrlMsg,
                    zmqMeterlogOk: counterData.zmq_meterlog_ok,
                    dmdlFilesIndexed: counterData.dmdl_FILES_INDEXED,
                    pfStart: counterData.pf_start,
                    pfActivate: counterData.pf_activate,
                    devPollMissing: counterData.devPollMissing,
                    devMsgRspMissing: counterData.devMsgRspMissing,
                    gridProfileTransaction: counterData.gridProfileTransaction,
                    secctrlNotReady: counterData.secctrlNotReady,
                    fsmRetryTimeout: counterData.fsm_retry_timeout,
                    profileTxnAck: counterData.profile_txn_ack,
                    backupSocLimitSet: counterData.backupSocLimitSet,
                    backupSocLimitChanged: counterData.backupSocLimitChanged,
                    backupSocLimitAbove100: counterData.backupSocLimitAbove100,
                    apiEcagtGetGenRelayState: counterData.api_ecagtGetGenRelayState,
                };
                this.pv.inventory.esubs.counters = counters;

                // Add to ensemble summary characteristics
                if (this.isValidValue(counters.restPowerKw)) {
                    ensembleSummaryCharacteristics.push({ type: Characteristic.RestPower, value: counters.restPowerKw });
                }
            }

            // Ensemble relay
            if (ensemblesRelaySupported) {
                if (this.logDebug) this.emit('debug', `Requesting ensembles relay data`);

                const relayData = this.pv.inventory.esubs.relay;
                const relay = {
                    mainsAdminState: ApiCodes[relayData.mains_admin_state] ?? relayData.mains_admin_state,
                    mainsAdminStateBool: relayData.mains_admin_state === 'closed',
                    mainsOperState: ApiCodes[relayData.mains_oper_state] ?? relayData.mains_oper_state,
                    mainsOperStateBool: relayData.mains_oper_state === 'closed',
                    der1State: relayData.der1_state,
                    der2State: relayData.der2_state,
                    der3State: relayData.der3_state,
                    enchgGridMode: relayData.Enchg_grid_mode,
                    enchgGridModeTranslated: ApiCodes[relayData.Enchg_grid_mode] ?? relayData.Enchg_grid_mode,
                    enchgGridStateBool: relayData.mains_admin_state === 'closed',
                    solarGridMode: relayData.Solar_grid_mode,
                    solarGridModeTranslated: ApiCodes[relayData.Solar_grid_mode] ?? relayData.Solar_grid_mode,
                    solarGridStateBool: relayData.mains_admin_state === 'closed',
                };
                this.pv.inventory.esubs.relay = relay;

                // encharge grid state sensor
                if (this.enchargeGridStateActiveSensor) {
                    const sensor = this.enchargeGridStateActiveSensor;
                    const { characteristicType } = sensor;
                    const state = relay.enchgGridStateBool;
                    sensor.state = state;

                    // Create characteristics
                    const characteristics = [
                        { type: characteristicType, value: state },
                    ];

                    // Update storage summary services
                    for (const { type, value } of characteristics) {
                        if (!this.isValidValue(value)) continue;
                        this.enchargeSummaryLevelAndStateService?.updateCharacteristic(type, value);
                    }
                }

                // encharge grid mode sensors
                if (this.enchargeGridModeActiveSensors.length > 0) {
                    for (let i = 0; i < this.enchargeGridModeActiveSensors.length; i++) {
                        const sensor = this.enchargeGridModeActiveSensors[i];
                        const { characteristicType } = sensor;
                        const state = sensor.gridMode === relay.enchgGridMode;
                        sensor.state = state;

                        // Create characteristics
                        const characteristics = [
                            { type: characteristicType, value: state },
                        ];

                        // Update storage summary services
                        for (const { type, value } of characteristics) {
                            if (!this.isValidValue(value)) continue;
                            this.enchargeGridModeSensorServices?.[i]?.updateCharacteristic(type, value);
                        }
                    }
                }

                // solar grid state sensor
                if (this.solarGridStateActiveSensor) {
                    const sensor = this.solarGridStateActiveSensor;
                    const { characteristicType } = sensor;
                    const state = relay.solarGridStateBool;
                    sensor.state = state;

                    // Create characteristics
                    const characteristics = [
                        { type: characteristicType, value: state },
                    ];

                    // Update storage summary services
                    for (const { type, value } of characteristics) {
                        if (!this.isValidValue(value)) continue;
                        this.solarGridStateSensorService?.updateCharacteristic(type, value);
                    }
                }

                // solar grid mode sensors
                if (this.solarGridModeActiveSensors.length > 0) {
                    for (let i = 0; i < this.solarGridModeActiveSensors.length; i++) {
                        const sensor = this.enchargeGridModeActiveSensors[i];
                        const { characteristicType } = sensor;
                        const state = sensor.gridMode === relay.solarGridMode;
                        sensor.state = state;

                        // Create characteristics
                        const characteristics = [
                            { type: characteristicType, value: state },
                        ];

                        // Update storage summary services
                        for (const { type, value } of characteristics) {
                            if (!this.isValidValue(value)) continue;
                            this.solarGridModeSensorServices?.[i]?.updateCharacteristic(type, value);
                        }
                    }
                }
            }

            // Encharges
            if (enchargesInstalled) {
                if (this.logDebug) this.emit('debug', `Requesting encharges data`);

                const enchargesRatedPowerSummary = [];
                const enchargesRealPowerSummary = [];
                const encharges = this.pv.inventory.esubs.encharges.devices ?? [];

                const updatedEncharges = await Promise.all(encharges.map(async (encharge, index) => {
                    const type = ApiCodes[encharge.type] ?? encharge.type;
                    const chargeState = await this.getStatus(encharge.chargeState);

                    const enchargeData = {
                        type,
                        partNumber: PartNumbers[encharge.partNumber] ?? encharge.partNumber,
                        serialNumber: encharge.serialNumber,
                        installed: this.formatTimestamp(encharge.installed),
                        chargeState,
                        chargeStateNum: encharge.chargeState === 'discharging' ? 0 : encharge.chargeState === 'charging' ? 1 : 2,
                        readingTime: this.formatTimestamp(encharge.readingTime),
                        adminState: encharge.adminState,
                        adminStateStr: ApiCodes?.[encharge.adminStateStr] ?? encharge.adminStateStr,
                        createdDate: this.formatTimestamp(encharge.createdDate),
                        imgLoadDate: this.formatTimestamp(encharge.imgLoadDate),
                        imgPnumRunning: encharge.imgPnumRunning,
                        bmuFwVersion: encharge.bmuFwVersion,
                        communicating: !!encharge.communicating,
                        sleepEnabled: encharge.sleepEnabled,
                        percentFull: encharge.percentFull,
                        temperature: encharge.temperature,
                        maxCellTemp: encharge.maxCellTemp,
                        reportedEncGridState: ApiCodes[encharge.reportedEncGridState] ?? encharge.reportedEncGridState,
                        commLevelSubGhz: this.scaleValue(encharge.commLevelSubGhz, 0, 5, 0, 100),
                        commLevel24Ghz: this.scaleValue(encharge.commLevel24Ghz, 0, 5, 0, 100),
                        ledStatus: LedStatus[encharge.ledStatus] ?? encharge.ledStatus.toString(),
                        dcSwitchOff: !!encharge.dcSwitchOff,
                        rev: encharge.rev,
                        capacity: encharge.capacity != null ? encharge.capacity / 1000 : null,
                        phase: ApiCodes[encharge.phase],
                        derIndex: encharge.derIndex,
                        gridProfile: encharge.gridProfile
                    };

                    // Add status field
                    if (enchargesStatusSupported && encharge.status) {
                        if (this.logDebug) this.emit('debug', `Requesting encharge ${enchargeData.serialNumber} status data`);

                        const status = encharge.status;
                        enchargeData.status = {
                            deviceType: DeviceTypeMap[status.deviceType] ?? status.deviceType,
                            commInterfaceStr: status.commInterfaceStr,
                            deviceId: status.deviceId,
                            adminState: status.adminState,
                            adminStateStr: ApiCodes[status.adminStateStr] ?? status.adminStateStr,
                            reportedGridMode: ApiCodes[status.reportedGridMode] ?? status.reportedGridMode,
                            phase: ApiCodes[status.phase],
                            derIndex: status.derIndex,
                            revision: status.revision,
                            capacity: status.capacity,
                            ratedPower: status.ratedPower,
                            ratedPowerKw: status.ratedPower != null ? status.ratedPower / 1000 : null,
                            reportedGridState: ApiCodes[status.reportedGridState] ?? status.reportedGridState,
                            msgRetryCount: status.msgRetryCount,
                            partNumber: status.partNumber,
                            assemblyNumber: status.assemblyNumber,
                            appFwVersion: status.appFwVersion,
                            zbFwVersion: status.zbFwVersion,
                            zbBootloaderVers: status.zbBootloaderVers,
                            iblFwVersion: status.iblFwVersion,
                            swiftAsicFwVersion: status.swiftAsicFwVersion,
                            bmuFwVersion: status.bmuFwVersion,
                            submodulesCount: status.submodulesCount,
                            submodules: status.submodules
                        };

                        if (this.isValidValue(enchargeData.status.ratedPower)) {
                            enchargesRatedPowerSummary.push(enchargeData.status.ratedPower);
                        }
                    }

                    // Add power field
                    if (enchargesPowerSupported && encharge.power) {
                        if (this.logDebug) this.emit('debug', `Requesting encharge ${enchargeData.serialNumber} power data`);

                        const power = encharge.power;
                        enchargeData.power = {
                            serialNumber: power.serialNumber,
                            realPower: power.realPower != null ? power.realPower / 1000 : null,
                            realPowerKw: power.realPower != null ? power.realPower / 1000000 : null,
                            apparentPower: power.apparentPower / 1000,
                            apparentPowerKw: power.apparentPower / 1000000,
                            soc: power.soc,
                        };

                        if (this.isValidValue(enchargeData.power.realPower)) {
                            enchargesRealPowerSummary.push(enchargeData.power.realPower);
                        }
                    }

                    // Update encharge backup level accessory characteristics
                    if (this.enchargeBackupLevelActiveAccessory) {
                        const accessory = this.enchargeBackupLevelActiveAccessory;
                        const { minSoc, characteristicType, characteristicType1, characteristicType2 } = accessory;
                        const lowBatteryState = enchargeData.percentFull < minSoc;

                        // Create characteristics
                        const characteristics = [
                            { type: characteristicType, value: lowBatteryState },
                            { type: characteristicType1, value: enchargeData.percentFull },
                            { type: characteristicType2, value: enchargeData.chargeStateNum },
                        ];

                        // Update acbs services
                        for (const { type, value } of characteristics) {
                            if (!this.isValidValue(value)) continue;
                            this.enchargeLevelAndStateServices?.[index]?.updateCharacteristic(type, value);
                        }
                    }

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.ChargeState, value: enchargeData.chargeState },
                        { type: Characteristic.AdminState, value: enchargeData.adminStateStr },
                        { type: Characteristic.Communicating, value: enchargeData.communicating },
                        { type: Characteristic.CommLevelSubGhz, value: enchargeData.commLevelSubGhz },
                        { type: Characteristic.CommLevel24Ghz, value: enchargeData.commLevel24Ghz },
                        { type: Characteristic.SleepEnabled, value: enchargeData.sleepEnabled },
                        { type: Characteristic.PercentFull, value: enchargeData.percentFull },
                        { type: Characteristic.Temperature, value: enchargeData.temperature },
                        { type: Characteristic.MaxCellTemp, value: enchargeData.maxCellTemp },
                        { type: Characteristic.LedStatus, value: enchargeData.ledStatus },
                        { type: Characteristic.Capacity, value: enchargeData.capacity },
                        { type: Characteristic.DcSwitchOff, value: enchargeData.dcSwitchOff },
                        { type: Characteristic.Revision, value: enchargeData.rev },
                        { type: Characteristic.ReadingTime, value: enchargeData.readingTime }
                    ];

                    if (enchargesStatusSupported && enchargeData.status) {
                        characteristics.push(
                            { type: Characteristic.CommInterface, value: enchargeData.status.commInterfaceStr },
                            { type: Characteristic.RatedPower, value: enchargeData.status.ratedPowerKw });
                    }

                    if (enchargesPowerSupported) {
                        characteristics.push({ type: Characteristic.RealPower, value: enchargeData.power.realPowerKw });
                    }

                    if (this.feature.gridProfile.supported) {
                        characteristics.push({ type: Characteristic.GridProfile, value: enchargeData.gridProfile });
                    }

                    for (const { type, value } of characteristics) {
                        if (!this.isValidValue(value)) continue;
                        this.enchargeServices?.[index]?.updateCharacteristic(type, value);
                    };

                    return enchargeData;
                }));

                // Filter out nulls and update inventory
                this.pv.inventory.esubs.encharges.devices = updatedEncharges.filter(Boolean);

                // Add encharges settings
                if (enchargesSettingsSupported) {
                    if (this.logDebug) this.emit('debug', `Requesting encharges stettings data`);

                    const settingsData = this.pv.inventory.esubs.encharges.settings;
                    const settings = {
                        enable: !!settingsData.enable,
                        country: settingsData.country,
                        currentLimit: settingsData.currentLimit,
                        perPhase: settingsData.perPhase
                    };
                    this.pv.inventory.esubs.encharges.settings = settings;

                    if (this.enchargeStateActiveSensor) {
                        const state = settings.enable;
                        this.enchargeStateActiveSensor.state = state;

                        const characteristicType = this.enchargeStateActiveSensor.characteristicType;
                        this.enchargeStateSensorService?.updateCharacteristic(characteristicType, state);
                    }
                }

                // Add encharges tariff
                if (enchargesTariffSupported) {
                    if (this.logDebug) this.emit('debug', `Requesting encharges tariff data`);

                    const tariffData = this.pv.inventory.esubs.encharges.tariff ?? {};

                    // Info
                    const info = tariffData.tariff ?? {};
                    const tariff = {};
                    tariff.info = {
                        currencyCode: info.currency.code ?? '',
                        logger: info.logger ?? '',
                        date: this.formatTimestamp(info.date),
                    };

                    // Storage Settings
                    const s = info.storage_settings ?? {};
                    tariff.storageSettings = {
                        mode: s.mode,
                        operationModeSubType: s.operation_mode_sub_type ?? '',
                        reservedSoc: s.reserved_soc,
                        veryLowSoc: s.very_low_soc,
                        chargeFromGrid: !!s.charge_from_grid,
                        date: this.formatTimestamp(s.date),
                        optSchedules: !!s.opt_schedules
                    };

                    // Single Rate
                    const r = info.single_rate ?? {};
                    tariff.singleRate = {
                        rate: r.rate,
                        sell: r.sell
                    };

                    // Process Seasons (noop unless processing is added)
                    const processSeasons = (seasons) => {
                        if (!Array.isArray(seasons)) return [];
                        return seasons.map(season => {
                            const { id, start, days = [], tiers = [] } = season;
                            days.forEach(day => {
                                const {
                                    id: dayId,
                                    days: dayNames,
                                    must_charge_start,
                                    must_charge_duration,
                                    must_charge_mode,
                                    peak_rule,
                                    enable_discharge_to_grid,
                                    periods = []
                                } = day;

                                periods.forEach(period => {
                                    const { id: periodId, start: periodStart, rate } = period;
                                    // No mutation here, but could log/transform if needed
                                });
                            });
                            return season;
                        });
                    };

                    tariff.seasons = processSeasons(info.seasons ?? []);
                    tariff.seasonsSell = processSeasons(info.seasons_sell ?? []);

                    // Schedule
                    const sched = tariffData.schedule ?? {};
                    tariff.schedule = {
                        fileName: sched.filename ?? '',
                        source: sched.source ?? '',
                        date: this.formatTimestamp(sched.date),
                        version: sched.version ?? '',
                        reservedSoc: sched.reserved_soc,
                        veryLowSoc: sched.very_low_soc,
                        chargeFromGrid: !!sched.charge_from_grid,
                        battMode: sched.batt_mode ?? '',
                        batteryMode: sched.battery_mode ?? '',
                        operationModeSubType: sched.operation_mode_sub_type ?? '',
                        override: !!sched.override,
                        overrideBackupSoc: sched.override_backup_soc,
                        overrideChgDischargeRate: sched.override_chg_discharge_rate,
                        overrideTouMode: ApiCodes[sched.override_tou_mode] ?? sched.override_tou_mode,
                        schedule: sched.schedule ?? {}
                    };

                    // Encharge profile control updates
                    for (let i = 0; i < this.enchargeProfileActiveControls.length; i++) {
                        const control = this.enchargeProfileActiveControls[i];
                        const { characteristicType } = control;
                        const profile = control.profile === tariff.storageSettings.mode;
                        const chargeFromGrid = control.chargeFromGrid === tariff.storageSettings.chargeFromGrid;
                        const isActive = profile && chargeFromGrid;
                        control.state = isActive;

                        // Create characteristics
                        const characteristics = [
                            { type: characteristicType, value: isActive },
                        ];

                        if (control.profile !== 'backup') {
                            characteristics.push({ type: Characteristic.Brightness, value: tariff.storageSettings.reservedSoc });
                        }

                        // Update storage summary services
                        for (const { type, value } of characteristics) {
                            if (!this.isValidValue(value)) continue;
                            this.enchargeProfileControlsServices?.[i]?.updateCharacteristic(type, value);
                        }
                    }

                    // Encharge profile sensors update
                    for (let i = 0; i < this.enchargeProfileActiveSensors.length; i++) {
                        const sensor = this.enchargeProfileActiveSensors[i];
                        const { characteristicType } = sensor;
                        const isActive = tariff.storageSettings.mode === sensor.profile;
                        control.state = isActive;

                        // Create characteristics
                        const characteristics = [
                            { type: characteristicType, value: isActive },
                        ];

                        // Update storage summary services
                        for (const { type, value } of characteristics) {
                            if (!this.isValidValue(value)) continue;
                            this.enchargeProfileSensorsServices?.[i]?.updateCharacteristic(type, value);
                        }
                    }

                    // Save updated tariff
                    this.pv.inventory.esubs.encharges.tariff = tariff;
                }

                // Calculate encharges rated power summary in kW
                if (enchargesStatusSupported) {
                    const ratedPowerSum = enchargesRatedPowerSummary.length > 0 ? (enchargesRatedPowerSummary.reduce((total, num) => total + num, 0) / enchargesRatedPowerSummary.length) / 1000 : null;
                    this.pv.inventory.esubs.encharges.ratedPowerSumKw = ratedPowerSum;

                    // Add to ensemble summary characteristics
                    ensembleSummaryCharacteristics.push({ type: Characteristic.RatedPower, value: ratedPowerSum });
                }

                // Calculate encharges real power summary in kW
                if (enchargesPowerSupported) {
                    const realPowerSum = enchargesRealPowerSummary.length > 0 ? (enchargesRealPowerSummary.reduce((total, num) => total + num, 0) / enchargesRealPowerSummary.length) / 1000 : null;
                    this.pv.inventory.esubs.encharges.realPowerSumKw = realPowerSum;

                    // Add to ensemble summary characteristics
                    ensembleSummaryCharacteristics.push({ type: Characteristic.RealPower, value: realPowerSum });
                }
            }

            // Update ensemble summary service
            for (const { type, value } of ensembleSummaryCharacteristics) {
                if (!this.isValidValue(value)) continue;
                this.ensembleSummaryService?.updateCharacteristic(type, value);
            };

            // Enpowers
            if (enpowersInstalled) {
                if (this.logDebug) this.emit('debug', `Requesting enpowers data`);

                const enpowers = this.pv.inventory.esubs.enpowers ?? [];
                const updatedEnpowers = await Promise.all(enpowers.map(async (enpower, index) => {

                    // Get device status asynchronously
                    const type = ApiCodes[enpower.type] ?? enpower.type;
                    const deviceStatus = await this.getStatus(enpower.deviceStatus);

                    const enpowerData = {
                        type,
                        partNumber: PartNumbers?.[enpower.partNumber] ?? enpower.partNumber,
                        serialNumber: enpower.serialNumber,
                        installed: this.formatTimestamp(enpower.installed),
                        deviceStatus,
                        readingTime: this.formatTimestamp(enpower.readingTime),
                        adminState: enpower.adminState,
                        adminStateStr: ApiCodes?.[enpower.adminStateStr] ?? enpower.adminStateStr,
                        createdDate: this.formatTimestamp(enpower.createdDate),
                        imgLoadDate: this.formatTimestamp(enpower.imgLoadDate),
                        imgPnumRunning: enpower.imgPnumRunning,
                        communicating: !!enpower.communicating,
                        temperature: enpower.temperature,
                        commLevelSubGhz: this.scaleValue(enpower.commLevelSubGhz, 0, 5, 0, 100),
                        commLevel24Ghz: this.scaleValue(enpower.commLevel24Ghz, 0, 5, 0, 100),
                        mainsAdminState: ApiCodes?.[enpower.mainsAdminState] ?? enpower.mainsAdminState,
                        mainsAdminStateBool: enpower.mainsAdminState === 'closed',
                        mainsOperState: ApiCodes?.[enpower.mainsOperState] ?? enpower.mainsOperState,
                        mainsOperStateBool: enpower.mainsOperState === 'closed',
                        enpwrGridMode: enpower.enpwrGridMode,
                        enpwrGridModeTranslated: ApiCodes?.[enpower.enpwrGridMode] ?? enpower.enpwrGridMode,
                        enpwrGridStateBool: enpower.mainsAdminState === 'closed',
                        enchgGridMode: enpower.enchgGridMode,
                        enchgGridModeTranslated: ApiCodes?.[enpower.enchgGridMode] ?? enpower.enchgGridMode,
                        enpwrRelayStateBm: enpower.enpwrRelayStateBm,
                        enpwrCurrStateId: enpower.enpwrCurrStateId,
                        gridProfile: enpower.gridProfile,
                        dryContacts: [],
                    };

                    // Add status
                    if (enpowersStatusSupported && enpower.status) {
                        if (this.logDebug) this.emit('debug', `Requesting enpowers status data`);

                        const status = enpower.status;
                        enpowerData.status = {
                            deviceType: DeviceTypeMap[status.deviceType] ?? status.deviceType,
                            commInterfaceStr: status.commInterfaceStr,
                            deviceId: status.deviceId,
                            adminState: status.adminState,
                            adminStateStr: ApiCodes[status.adminStateStr] ?? status.adminStateStr,
                            msgRetryCount: status.msgRetryCount,
                            partNumber: status.partNumber,
                            assemblyNumber: status.assemblyNumber,
                            appFwVersion: status.appFwVersion,
                            iblFwVersion: status.iblFwVersion,
                            swiftAsicFwVersion: status.swiftAsicFwVersion,
                            bmuFwVersion: status.bmuFwVersion,
                            submodulesCount: status.submodulesCount,
                            submodules: status.submodules
                        };
                    }

                    // Add dry contacts
                    if (enpowersDryContactsSupported && Array.isArray(enpower.dryContacts)) {
                        enpower.dryContacts.forEach((contact, i) => {
                            const dryContactData = {
                                id: contact.id,
                                status: contact.status,
                                stateBool: contact.status === 'closed',
                                settings: {}
                            };

                            // Update dry contact characteristic
                            const state = dryContactData.stateBool;
                            this.enpowerDryContactControlServices?.[index]?.[i]?.updateCharacteristic(Characteristic.On, state);
                            this.enpowerDryContactSensorServices?.[index]?.[i]?.updateCharacteristic(Characteristic.ContactSensorState, state);

                            // Add dry contacts settings
                            if (enpowersDryContactsSettingsSupported && contact.settings) {
                                const settings = contact.settings;
                                dryContactData.settings = {
                                    type: ApiCodes[settings.type] ?? settings.type,
                                    id: settings.id,
                                    gridAction: settings.gridAction,
                                    gridActionBool: settings.gridAction !== 'none',
                                    microGridAction: settings.microGridAction,
                                    genAction: settings.genAction,
                                    essentialStartTime: settings.essentialStartTime ?? '',
                                    essentialEndTime: settings.essentialEndTime ?? '',
                                    priority: settings.priority,
                                    blackSStart: settings.blackSStart,
                                    override: settings.override ?? 'false',
                                    overrideBool: settings.override === 'true',
                                    manualOverride: settings.manualOverride ?? 'false',
                                    manualOverrideBool: settings.manualOverride === 'true',
                                    loadName: settings.loadName !== '' ? settings.loadName : `Dry contact ${i}`,
                                    mode: settings.mode,
                                    socLow: settings.socLow,
                                    socHigh: settings.socHigh,
                                    pvSerialNb: settings.pvSerialNb,
                                };
                            }

                            enpowerData.dryContacts[i] = dryContactData;
                        });
                    }

                    // Create envoy characteristics
                    const characteristics1 = [
                        { type: Characteristic.EnpowerGridState, value: enpowerData.mainsAdminStateBool },
                        { type: Characteristic.EnpowerGridMode, value: enpowerData.enpwrGridModeTranslated },
                    ];

                    // Update storage summary services
                    for (const { type, value } of characteristics1) {
                        if (!this.isValidValue(value)) continue;
                        this.envoyService?.updateCharacteristic(type, value);
                    }

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.AdminState, value: enpowerData.adminStateStr },
                        { type: Characteristic.Communicating, value: enpowerData.communicating },
                        { type: Characteristic.CommLevelSubGhz, value: enpowerData.commLevelSubGhz },
                        { type: Characteristic.CommLevel24Ghz, value: enpowerData.commLevel24Ghz },
                        { type: Characteristic.Temperature, value: enpowerData.temperature },
                        { type: Characteristic.GridMode, value: enpowerData.enpwrGridModeTranslated },
                        { type: Characteristic.EnchgGridMode, value: enpowerData.enchgGridModeTranslated },
                        { type: Characteristic.ReadingTime, value: enpowerData.readingTime }
                    ];

                    if (enpowersStatusSupported && enpowerData.status) {
                        characteristics.push({ type: Characteristic.CommInterface, value: enpowerData.status.commInterfaceStr });
                    }

                    if (this.feature.gridProfile.supported && enpowerData.gridProfile) {
                        characteristics.push({ type: Characteristic.GridProfile, value: enpowerData.gridProfile });
                    }

                    for (const { type, value } of characteristics) {
                        if (!this.isValidValue(value)) continue;
                        this.enpowerServices?.[index]?.updateCharacteristic(type, value);
                    }

                    // Update enpower grid control
                    const control = this.enpowerGridStateActiveControl;
                    if (control) {
                        control.state = enpowerData.mainsAdminStateBool;
                        this.enpowerGridStateControlServices?.[index]?.updateCharacteristic(control.characteristicType, control.state);
                    }

                    // Update enpower grid state sensor
                    const sensor = this.enpowerGridStateActiveSensor;
                    if (sensor) {
                        sensor.state = enpowerData.enpwrGridStateBool;
                        this.enpowerGridStateSensorServices?.[index]?.updateCharacteristic(sensor.characteristicType, sensor.state);
                    }

                    // Update enpower grid mode sensors
                    for (let i = 0; i < (this.enpowerGridModeActiveSensors?.length ?? 0); i++) {
                        const modeSensor = this.enpowerGridModeActiveSensors[i];
                        const isActive = modeSensor.gridMode === enpowerData.enpwrGridMode;
                        modeSensor.state = isActive;
                        this.enpowerGridModeSensorServices?.[index]?.[i]?.updateCharacteristic(modeSensor.characteristicType, isActive);
                    }

                    return enpowerData;
                }));

                // Filter out nulls and update inventory
                this.pv.inventory.esubs.enpowers = updatedEnpowers.filter(Boolean);
            }

            // IQ Meter Collars
            if (collarsInstalled) {
                if (this.logDebug) this.emit('debug', `Requesting collars data`);

                const collars = this.pv.inventory.esubs.collars ?? [];
                const updatedCollars = await Promise.all(collars.map(async (collar, index) => {
                    const deviceStatus = await this.getStatus(collar.deviceStatus);

                    const updatedCollarsData = {
                        type: collar.type,
                        partNumber: collar.partNumber,
                        serialNumber: collar.serialNumber,
                        installed: this.formatTimestamp(collar.installed),
                        deviceStatus,
                        readingTime: this.formatTimestamp(collar.readingTime),
                        adminState: collar.adminState,
                        adminStateStr: ApiCodes[collar.adminStateStr] ?? collar.adminStateStr,
                        createdDate: this.formatTimestamp(collar.createdDate),
                        imgLoadDate: this.formatTimestamp(collar.imgLoadDate),
                        imgPnumRunning: collar.imgPnumRunning,
                        communicating: !!collar.communicating,
                        temperature: collar.temperature,
                        midState: ApiCodes[collar.midState] ?? collar.midState,
                        gridState: ApiCodes[collar.gridState] ?? collar.gridState,
                        controlError: collar.controlError,
                        collarState: collar.collarState,
                    }

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.Status, value: updatedCollarsData.deviceStatus },
                        { type: Characteristic.AdminState, value: updatedCollarsData.adminStateStr },
                        { type: Characteristic.MidState, value: updatedCollarsData.midState },
                        { type: Characteristic.GridState, value: updatedCollarsData.gridState },
                        { type: Characteristic.Communicating, value: updatedCollarsData.communicating },
                        { type: Characteristic.Operating, value: updatedCollarsData.temperature },
                        { type: Characteristic.ReadingTime, value: updatedCollarsData.readingTime }
                    ];

                    for (const { type, value } of characteristics) {
                        if (!this.isValidValue(value)) continue;
                        this.collarServices?.[index]?.updateCharacteristic(type, value);
                    }

                    return updatedCollarsData;
                }));

                // Update collars
                this.pv.inventory.esubs.collars = updatedCollars.filter(Boolean);
            }

            // IQ C6 Combiner Controllers
            if (c6CombinerControllersInstalled) {
                if (this.logDebug) this.emit('debug', `Requesting c6 combiners data`);

                const c6CombinerControllers = this.pv.inventory.esubs.c6CombinerControllers ?? [];
                const updatedC6CombinerControllers = await Promise.all(c6CombinerControllers.map(async (c6CombinerController, index) => {

                    const updatedC6CombinerControllersData = {
                        type: c6CombinerController.type,
                        partNumber: c6CombinerController.partNumber,
                        serialNumber: c6CombinerController.serialNumber,
                        installed: this.formatTimestamp(c6CombinerController.installed),
                        readingTime: this.formatTimestamp(c6CombinerController.readingTime),
                        adminState: c6CombinerController.readingTime,
                        adminStateStr: ApiCodes[c6CombinerController.adminStateStr] ?? c6CombinerController.adminStateStr,
                        createdDate: this.formatTimestamp(c6CombinerController.createdDate),
                        imgLoadDate: this.formatTimestamp(c6CombinerController.imgLoadDate),
                        firmware: c6CombinerController.firmware,
                        dmirVersion: c6CombinerController.dmirVersion,
                        communicating: !!c6CombinerController.communicating,
                    }

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.AdminState, value: updatedC6CombinerControllersData.adminStateStr },
                        { type: Characteristic.Communicating, value: updatedC6CombinerControllersData.communicating, },
                        { type: Characteristic.Firmware, value: updatedC6CombinerControllersData.firmware },
                        { type: Characteristic.ReadingTime, value: updatedC6CombinerControllersData.readingTime }
                    ];

                    for (const { type, value } of characteristics) {
                        if (!this.isValidValue(value)) continue;
                        this.c6CombinerControllerServices?.[index]?.updateCharacteristic(type, value);
                    }

                    return updatedC6CombinerControllersData;
                }));

                // Update c6 combiner controllers
                this.pv.inventory.esubs.c6CombinerControllers = updatedC6CombinerControllers.filter(Boolean);
            }

            // IQ C6 Rgm
            if (c6RgmsInstalled) {
                if (this.logDebug) this.emit('debug', `Requesting c6 rgms data`);

                const c6Rgms = this.pv.inventory.esubs.c6Rgms ?? [];
                const updatedC6Rgms = await Promise.all(c6Rgms.map(async (c6Rgm, index) => {

                    const updatedC6RgmsData = {
                        type: c6Rgm.type,
                        partNumber: c6Rgm.partNumber,
                        serialNumber: c6Rgm.serialNumber,
                        installed: this.formatTimestamp(c6Rgm.installed),
                        readingTime: this.formatTimestamp(),
                        firmware: c6Rgm.firmware,
                        deviceStatus: (c6Rgm.deviceState).toString(),
                    }

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.Status, value: updatedC6RgmsData.deviceStatus },
                        { type: Characteristic.Firmware, value: updatedC6RgmsData.firmware },
                        { type: Characteristic.ReadingTime, value: updatedC6RgmsData.readingTime }
                    ];

                    for (const { type, value } of characteristics) {
                        if (!this.isValidValue(value)) continue;
                        this.c6RgmServices?.[index]?.updateCharacteristic(type, value);
                    }

                    return updatedC6RgmsData;
                }));

                // Update C6 rgms
                this.pv.inventory.esubs.c6Rgms = updatedC6Rgms.filter(Boolean);
            }

            // Generators
            if (generatorInstalled) {
                if (this.logDebug) this.emit('debug', `Requesting generator`);

                const generator = this.pv.inventory.esubs.generator ?? {};
                const adminModeMap = ['Off', 'On', 'Auto'];
                const rawAdminMode = generator.adminMode;
                const adminMode = typeof rawAdminMode === 'number' ? adminModeMap[rawAdminMode] ?? rawAdminMode.toString() : rawAdminMode;
                const adminModeBool = adminMode !== 'Off';
                const type = ApiCodes[generator.type] ?? generator.type;

                const generatorData = {
                    type,
                    readingTime: this.formatTimestamp(),
                    adminState: ApiCodes[generator.adminState] ?? generator.adminState,
                    installed: adminModeMap.includes(generator?.adminState),
                    operState: ApiCodes?.[generator.operState] ?? generator.operState,
                    adminMode,
                    adminModeOffBool: adminModeValue === 'Off',
                    adminModeOnBool: adminModeValue === 'On',
                    adminModeAutoBool: adminModeValue === 'Auto',
                    adminModeBool,
                    schedule: generator.schedule,
                    startSoc: generator.startSoc,
                    stopSoc: generator.stopSoc,
                    excOn: generator.excOn,
                    present: generator.present,
                    settings: {}
                };

                // Add status/settings field
                if (generatorSettingsInstalled && generator.settings) {
                    const settings = generator.settings;
                    if (this.logDebug) this.emit('debug', `Requesting generator settings`);

                    Object.assign(generatorData.settings, {
                        maxContGenAmps: settings.maxContGenAmps,
                        minGenLoadingPerc: settings.minGenLoadingPerc,
                        maxGenEfficiencyPerc: settings.maxGenEfficiencyPerc,
                        namePlateRatingWat: settings.namePlateRatingWat,
                        startMethod: settings.startMethod,
                        warmUpMins: settings.warmUpMins,
                        coolDownMins: settings.coolDownMins,
                        genType: ApiCodes[settings.genType] ?? settings.genType,
                        model: settings.model,
                        manufacturer: settings.manufacturer,
                        lastUpdatedBy: settings.lastUpdatedBy,
                        generatorId: settings.generatorId,
                        chargeFromGenerator: settings.chargeFromGenerator
                    });
                }

                if (generatorData.installed) {
                    // Create envoy characteristics
                    const characteristics1 = [
                        { type: Characteristic.GeneratorState, value: adminModeBool },
                        { type: Characteristic.GeneratorMode, value: generatorData.adminMode },
                    ];

                    // Update storage summary services
                    for (const { type, value } of characteristics1) {
                        if (!this.isValidValue(value)) continue;
                        this.envoyService?.updateCharacteristic(type, value);
                    }

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.AdminState, value: generatorData.adminState },
                        { type: Characteristic.OperatingState, value: generatorData.operState },
                        { type: Characteristic.AdminMode, value: generatorData.adminMode },
                        { type: Characteristic.Shedule, value: generatorData.schedule },
                        { type: Characteristic.StartSoc, value: generatorData.startSoc },
                        { type: Characteristic.StopSoc, value: generatorData.stopSoc },
                        { type: Characteristic.ExcOn, value: generatorData.excOn },
                        { type: Characteristic.Present, value: generatorData.present },
                        { type: Characteristic.ReadingTime, value: generatorData.readingTime }
                    ];

                    for (const { type, value } of characteristics) {
                        if (!this.isValidValue(value)) continue;
                        this.generatorService?.updateCharacteristic(type, value);
                    }

                    // Update generator admin mode ON/OFF control
                    if (this.generatorStateActiveControl) {
                        const accessory = this.generatorStateActiveControl;
                        const { characteristicType } = accessory;
                        const state = generatorData.adminModeBool;
                        accessory.state = state;

                        // Create characteristics
                        const characteristics = [
                            { type: characteristicType, value: state },
                        ];

                        // Update storage summary services
                        for (const { type, value } of characteristics) {
                            if (!this.isValidValue(value)) continue;
                            this.generatorStateControlService?.updateCharacteristic(type, value);
                        }
                    }

                    // Update generator admin mode ON/OFF sensor
                    if (this.generatorStateActiveSensor) {
                        const sensor = this.generatorStateActiveSensor;
                        const { characteristicType } = sensor;
                        const state = generatorData.adminModeBool;
                        sensor.state = state;

                        // Create characteristics
                        const characteristics = [
                            { type: characteristicType, value: state },
                        ];

                        // Update storage summary services
                        for (const { type, value } of characteristics) {
                            if (!this.isValidValue(value)) continue;
                            this.generatorStateSensorService?.updateCharacteristic(type, value);
                        }
                    }

                    // Update generator mode toggle controls
                    for (let i = 0; i < (this.generatorModeActiveControls?.length ?? 0); i++) {
                        const { mode, characteristicType } = this.generatorModeActiveControls[i];
                        const state = mode === generatorData.adminMode;
                        this.generatorModeActiveControls[i].state = state;
                        this.generatorModeControlServices?.[i]?.updateCharacteristic(characteristicType, state);
                    }

                    // Update generator mode sensors
                    for (let i = 0; i < (this.generatorModeActiveSensors?.length ?? 0); i++) {
                        const accessory = this.generatorModeActiveSensors[i];
                        const { mode, characteristicType } = accessory;
                        const state = mode === generatorData.adminMode;
                        accessory.state = state;

                        // Create characteristics
                        const characteristics = [
                            { type: characteristicType, value: state },
                        ];

                        // Update storage summary services
                        for (const { type, value } of characteristics) {
                            if (!this.isValidValue(value)) continue;
                            this.generatorModeControlServices?.[i]?.updateCharacteristic(type, value);
                        }
                    }
                }

                // Save processed generator data
                this.pv.inventory.esubs.generator = generatorData;
            }

            // Set supported flag
            this.feature.ensembleData.supported = true;

            // Update REST and MQTT endpoints
            if (this.restFulConnected) this.restFul1.update('ensembledata', this.pv.inventory.esubs);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Ensemble Data', this.pv.inventory.esubs);

            return true;
        } catch (error) {
            throw new Error(`Update ensemble data error: ${error.message || error}`);
        }
    }

    async updateLiveData() {
        if (this.logDebug) this.emit('debug', `Requesting live data`);

        try {
            const response = await this.axiosInstance.get(ApiUrls.LiveDataStatus);
            const live = response.data;

            if (this.logDebug) this.emit('debug', `Live data:`, live);

            const liveDataKeys = Object.keys(live);
            if (liveDataKeys.length === 0) {
                if (this.logDebug) this.emit('debug', 'No live data');
                return false;
            }

            // Get encharges installed phases
            const phaseA = this.pv.inventory.esubs.encharges.phaseA;
            const phaseB = this.pv.inventory.esubs.encharges.phaseB;
            const phaseC = this.pv.inventory.esubs.encharges.phaseC;

            // Extract connection status — aka the heartbeat of the system
            const connection = live.connection ?? {};
            const liveData = {};
            liveData.connection = {
                mqttState: connection.mqtt_state,
                provState: connection.prov_state,
                authState: connection.auth_state,
                scStream: connection.sc_stream === 'enabled',
                scDebug: connection.sc_debug === 'enabled',
            };

            // Meters info — where the power lives
            const meters = live.meters ?? {};
            liveData.meters = {
                lastUpdate: this.formatTimestamp(meters.last_update),
                soc: meters.soc,
                mainRelayState: meters.main_relay_state,
                genRelayState: meters.gen_relay_state,
                backupBatMode: meters.backup_bat_mode,
                backupSoc: meters.backup_soc,
                isSplitPhase: meters.is_split_phase,
                phaseCount: meters.phase_count,
                encAggSoc: meters.enc_agg_soc,
                encAggEnergy: meters.enc_agg_energy,
                encAggEnergyKw: meters.enc_agg_energy != null ? meters.enc_agg_energy / 1000 : null,
                acbAggSoc: meters.acb_agg_soc,
                acbAggEnergy: meters.acb_agg_energ,
                acbAggEnergyKw: meters.acb_agg_energ != null ? meters.acb_agg_energ / 1000 : null,
            };

            liveData.tasks = live.tasks ?? {};
            liveData.counters = live.counters ?? {};
            liveData.dryContacts = live.dry_contacts ?? {};
            liveData.devices = [];

            const percentFullSum = liveData.meters.soc; // encharges + acbs
            const percentFullSumEnc = liveData.meters.encAggSoc; // encharges
            const energySumEncKw = liveData.meters.encAggEnergyKw; // encharges energy kW
            const percentFullSumAcb = liveData.meters.acbAggSoc; // acbs
            const energySumAcbKw = liveData.meters.ecbEnergyKw; // acbs energy kW

            // Update ensemble summary service
            if (this.isValidValue(percentFullSum)) {

                // Create characteristics
                const characteristics = [
                    { type: Characteristic.AggSoc, value: percentFullSum },
                ];

                // Update system services
                for (const { type, value } of characteristics) {
                    if (!this.isValidValue(value)) continue;
                    this.ensembleSummaryService?.updateCharacteristic(type, value);
                };
            }

            // Decide which devices get to join the party
            const activeDevices = [];
            if (this.feature.meters.production.enabled) activeDevices.push({ type: 'Production', meter: meters.pv });
            if (this.feature.meters.consumptionNet.enabled) activeDevices.push({ type: 'Consumption Net', meter: meters.grid });
            if (this.feature.meters.consumptionTotal.enabled) activeDevices.push({ type: 'Consumption Total', meter: meters.load });
            if (this.feature.meters.storage.enabled || this.pv.inventory.esubs.encharges.installed) activeDevices.push({ type: 'Storage', meter: meters.storage });
            if (this.feature.meters.generator.enabled) activeDevices.push({ type: 'Generator', meter: meters.generator });
            for (const [index, { type, meter }] of activeDevices.entries()) {
                if (!meter) {
                    if (this.logDebug) this.emit('debug', `Device of type ${type} is missing meter data — skipping.`);
                    continue;
                }

                const {
                    agg_p_mw = null,
                    agg_s_mva = null,
                    agg_p_ph_a_mw = null,
                    agg_p_ph_b_mw = null,
                    agg_p_ph_c_mw = null,
                    agg_s_ph_a_mva = null,
                    agg_s_ph_b_mva = null,
                    agg_s_ph_c_mva = null,
                } = meter;

                const phaseCount = liveData.meters.phaseCount;
                const storagePhaseANotSupported = type === 'Storage' && !phaseA;
                const storagePhaseBNotSupported = type === 'Storage' && !phaseB;
                const storagePhaseCNotSupported = type === 'Storage' && !phaseC;
                const deviceData = {
                    type,
                    power: agg_p_mw === null ? null : agg_p_mw / 1000,
                    powerKw: agg_p_mw === null ? null : agg_p_mw / 1000000,
                    powerL1: agg_p_ph_a_mw === null || phaseCount < 1 || storagePhaseANotSupported ? null : agg_p_ph_a_mw / 1000,
                    powerL1Kw: agg_p_ph_a_mw === null || phaseCount < 1 || storagePhaseANotSupported ? null : agg_p_ph_a_mw / 1000000,
                    powerL2: agg_p_ph_b_mw === null || phaseCount < 2 || storagePhaseBNotSupported ? null : agg_p_ph_b_mw / 1000,
                    powerL2Kw: agg_p_ph_b_mw === null || phaseCount < 2 || storagePhaseBNotSupported ? null : agg_p_ph_b_mw / 1000000,
                    powerL3: agg_p_ph_c_mw === null || phaseCount < 3 || storagePhaseCNotSupported ? null : agg_p_ph_c_mw / 1000,
                    powerL3Kw: agg_p_ph_c_mw === null || phaseCount < 3 || storagePhaseCNotSupported ? null : agg_p_ph_c_mw / 1000000,
                    apparentPower: agg_s_mva === null ? null : agg_s_mva / 1000,
                    apparentPowerKw: agg_s_mva === null ? null : agg_s_mva / 1000000,
                    apparentPowerL1: agg_s_ph_a_mva === null || phaseCount < 1 || storagePhaseANotSupported ? null : agg_s_ph_a_mva / 1000,
                    apparentPowerL1Kw: agg_s_ph_a_mva === null || phaseCount < 1 || storagePhaseANotSupported ? null : agg_s_ph_a_mva / 1000000,
                    apparentPowerL2: agg_s_ph_b_mva === null || phaseCount < 2 || storagePhaseBNotSupported ? null : agg_s_ph_b_mva / 1000,
                    apparentPowerL2Kw: agg_s_ph_b_mva === null || phaseCount < 2 || storagePhaseBNotSupported ? null : agg_s_ph_b_mva / 1000000,
                    apparentPowerL3: agg_s_ph_c_mva === null || phaseCount < 3 || storagePhaseCNotSupported ? null : agg_s_ph_c_mva / 1000,
                    apparentPowerL3Kw: agg_s_ph_c_mva === null || phaseCount < 3 || storagePhaseCNotSupported ? null : agg_s_ph_c_mva / 1000000,
                    readingTime: liveData.meters.lastUpdate ?? null,
                };
                liveData.devices.push(deviceData);

                if (this.logDebug) this.emit('debug', `Updated device: ${type}`, deviceData);

                // Update system
                if (type === 'Production' && this.isValidValue(deviceData.power)) {
                    const powerLevel = this.powerProductionSummary > 1 ? this.scaleValue(deviceData.power, 0, this.powerProductionSummary, 0, 100) : null;
                    const powerState = powerLevel > 0;

                    if (this.logInfo) {
                        this.emit('info', `Live Data, ${type}, power: ${deviceData.powerKw} kW`);
                        this.emit('info', `Live Data, ${type}, power level: ${powerLevel} %`);
                        this.emit('info', `Live Data, ${type}, power state: ${powerState ? 'On' : 'Off'}`);
                    }

                    // Update system accessory
                    if (this.isValidValue(powerLevel)) {
                        const accessory = this.systemAccessory;
                        const { characteristicType, characteristicType1 } = accessory;
                        accessory.state = powerState;
                        accessory.level = powerLevel;

                        // Create characteristics
                        const characteristics = [
                            { type: characteristicType, value: accessory.state },
                            { type: characteristicType1, value: accessory.level },
                        ];

                        // Update system services
                        for (const { type, value } of characteristics) {
                            if (!this.isValidValue(value)) continue;
                            this.systemService?.updateCharacteristic(type, value);
                        };
                    }
                }

                // Update storage
                if (type === 'Storage') {

                    // Update acbs summary
                    if (this.feature.inventory.acbs.installed) {

                        if (this.logInfo) {
                            this.emit('info', `Live Data, ${this.acBatterieName}, backup energy: ${energySumAcbKw} kW`);
                            this.emit('info', `Live Data, ${this.acBatterieName}, backup level level: ${percentFullSumAcb} %`);
                        }

                        // Update acbs summary accessory
                        if (this.acBatterieBackupLevelSummaryActiveAccessory && this.isValidValue(percentFullSumAcb)) {
                            const accessory = this.acBatterieBackupLevelSummaryActiveAccessory;
                            const { minSoc, displayType, characteristicType, characteristicType1 } = accessory;
                            const isServiceBattery = displayType === 5;
                            const isAboveMinSoc = percentFullSumAcb > minSoc;
                            const backupLevel = isAboveMinSoc ? percentFullSumAcb : 0;
                            const state = isServiceBattery ? !isAboveMinSoc : isAboveMinSoc;

                            accessory.state = state;
                            accessory.backupLevel = backupLevel;

                            // Create characteristics
                            const characteristics = [
                                { type: characteristicType, value: state },
                                { type: characteristicType1, value: backupLevel },
                            ];

                            // Update storage summary services
                            for (const { type, value } of characteristics) {
                                if (!this.isValidValue(value)) continue;
                                this.acbSummaryLevelAndStateService?.updateCharacteristic(type, value);
                            }
                        }
                    }

                    // Update encharges summary
                    if (this.feature.inventory.esubs.encharges.installed) {

                        if (this.logInfo) {
                            this.emit('info', `Live Data, ${this.enchargeName}, backup energy: ${energySumEncKw} kW`);
                            this.emit('info', `Live Data, ${this.enchargeName}, backup level level: ${percentFullSumEnc} %`);
                        }

                        // Update encharges summary accessory
                        if (this.enchargeBackupLevelSummaryActiveAccessory && this.isValidValue(percentFullSumEnc)) {
                            const accessory = this.enchargeBackupLevelSummaryActiveAccessory;
                            const { minSoc, displayType, characteristicType, characteristicType1 } = accessory;
                            const serviceBattery = displayType === 5;
                            const backupLevel = percentFullSumEnc > minSoc ? percentFullSumEnc : 0;
                            const state = serviceBattery ? backupLevel < minSoc : backupLevel > minSoc;

                            accessory.state = state;
                            accessory.backupLevel = backupLevel;

                            // Create characteristics
                            const characteristics = [
                                { type: characteristicType, value: state },
                                { type: characteristicType1, value: backupLevel },
                            ];

                            // Update storage summary services
                            for (const { type, value } of characteristics) {
                                if (!this.isValidValue(value)) continue;
                                this.enchargeSummaryLevelAndStateService?.updateCharacteristic(type, value);
                            }
                        }

                        // Update encharges summary backup level sensors
                        if (this.enchargeBackupLevelSummaryActiveSensors.length > 0 && this.isValidValue(percentFullSumEnc)) {
                            for (let i = 0; i < this.enchargeBackupLevelSummaryActiveSensors.length; i++) {
                                const sensor = this.enchargeBackupLevelSummaryActiveSensors[i];
                                const { backupLevel, compareMode, characteristicType } = sensor;
                                const state = this.evaluateCompareMode(percentFullSumEnc, backupLevel, compareMode);
                                sensor.state = state;

                                const characteristics = [
                                    { type: characteristicType, value: state }
                                ];

                                // Update system services
                                for (const { type, value } of characteristics) {
                                    if (!this.isValidValue(value)) continue;
                                    this.enchargeBackupLevelSensorServices?.[i]?.updateCharacteristic(type, value);
                                };
                            }
                        }
                    }
                }

                // Create characteristics
                const characteristics = [
                    { type: Characteristic.Power, value: deviceData.powerKw },
                    { type: Characteristic.PowerL1, value: deviceData.powerL1Kw },
                    { type: Characteristic.PowerL2, value: deviceData.powerL2Kw },
                    { type: Characteristic.PowerL3, value: deviceData.powerL3Kw },
                    { type: Characteristic.ApparentPower, value: deviceData.apparentPowerKw },
                    { type: Characteristic.ApparentPowerL1, value: deviceData.apparentPowerL1Kw },
                    { type: Characteristic.ApparentPowerL2, value: deviceData.apparentPowerL2Kw },
                    { type: Characteristic.ApparentPowerL3, value: deviceData.apparentPowerL3Kw },
                    { type: Characteristic.ReadingTime, value: deviceData.readingTime },
                ];

                // Update live data services
                for (const { type, value } of characteristics) {
                    if (!this.isValidValue(value)) continue;
                    this.liveDataServices?.[index]?.updateCharacteristic(type, value);
                };

                // Update power level sensors services
                const key = MetersKeyMap[type];
                const sensorsMap = {
                    production: [{ sensors: this.powerProductionLevelActiveSensors, services: this.powerProductionLevelSensorServices, value: deviceData.power, levelKey: 'powerLevel' }],
                    consumptionNet: [{ sensors: this.powerConsumptionNetLevelActiveSensors, services: this.powerConsumptionNetLevelSensorServices, value: deviceData.power, levelKey: 'powerLevel' }],
                    consumptionTotal: [{ sensors: this.powerConsumptionTotalLevelActiveSensors, services: this.powerConsumptionTotalLevelSensorServices, value: deviceData.power, levelKey: 'powerLevel' }]
                };

                if (sensorsMap[key]) {
                    for (const group of sensorsMap[key]) {
                        if (!this.isValidValue(group.value) || !group.sensors?.length) continue;

                        for (const [index, sensor] of group.sensors.entries()) {
                            const state = this.evaluateCompareMode(group.value, sensor[group.levelKey], sensor.compareMode);
                            sensor.state = state;
                            group.services?.[index]?.updateCharacteristic(sensor.characteristicType, state);
                        }
                    }
                }
            }

            // Enable steram if disabled
            const streamDisabled = !liveData.connection.scStream
            if (streamDisabled) {
                if (this.logDebug) this.emit('debug', 'Enabling live data stream...');

                try {
                    await this.setLiveDataStream();
                } catch (error) {
                    if (this.logError) this.emit('error', error);
                }
            }

            this.pv.liveData = liveData;
            this.feature.liveData.supported = true;

            if (this.restFulConnected) this.restFul1.update('livedata', live);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Live Data', live);

            return true;
        } catch (error) {
            throw new Error(`Update live data error: ${error}`);
        }
    }

    // Set
    async setProductionState(state) {
        if (this.logDebug) this.emit('debug', `Requesting set production power mode`);

        try {
            const data = {
                length: 1,
                arr: [state ? 0 : 1]
            };

            const options = {
                method: 'PUT',
                data: data,
                headers: {
                    Accept: 'application/json'
                }
            };

            const path = ApiUrls.PowerForcedModeGetPut.replace("EID", this.feature.info.devId);
            const response = this.feature.info.tokenRequired ? await this.axiosInstance.put(path, data) : await this.digestAuthInstaller.request(path, options);
            if (this.logDebug) this.emit('debug', `Set power produstion state:`, response.data);

            return true;
        } catch (error) {
            throw new Error(`Set production power mode error: ${error}`);
        }
    }

    async setEnchargeProfile(profile, reservedSoc, chargeFromGrid) {
        if (this.logDebug) this.emit('debug', `Requesting set encharge settings`);

        try {
            const tariff = this.pv.inventory.esubs.encharges.tariffRaw.tariff;
            tariff.storage_settings.mode = profile;
            tariff.storage_settings.reserved_soc = reservedSoc;
            tariff.storage_settings.charge_from_grid = chargeFromGrid;
            tariff.single_rate = {
                rate: 0.25,
                sell: 0.25
            };
            tariff.seasons = [
                {
                    "id": "all_year_long",
                    "start": "1/1",
                    "days": [
                        {
                            "id": "all_days",
                            "days": "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
                            "must_charge_start": 540,
                            "must_charge_duration": 60,
                            "must_charge_mode": "CG",
                            "peak_rule": "DL",
                            "enable_discharge_to_grid": false,
                            "periods": [
                                {
                                    "id": "filler",
                                    "start": 0,
                                    "rate": 0.25
                                },
                                {
                                    "id": "period_1",
                                    "start": 660,
                                    "rate": 0.5
                                },
                                {
                                    "id": "filler",
                                    "start": 676,
                                    "rate": 0.25
                                }
                            ]
                        }
                    ],
                    "tiers": []
                }
            ];
            tariff.seasons_sell = [
                {
                    "id": "all_year_long",
                    "start": "1/1", "days": [
                        {
                            "id": "all_days",
                            "days": "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
                            "periods": [
                                {
                                    "id": "filler",
                                    "start": 0,
                                    "rate": 0.25
                                },
                                {
                                    "id": "period_1",
                                    "start": 660,
                                    "rate": 0.5
                                },
                                {
                                    "id": "filler",
                                    "start": 676,
                                    "rate": 0.25
                                }
                            ]
                        }
                    ]
                }
            ];

            if (this.logDebug) this.emit('debug', `Prepared encharge settings:`, tariff);

            const response = this.axiosInstance.put(ApiUrls.TariffSettingsGetPut, tariff);
            if (this.logDebug) this.emit('debug', `Set encharge settings:`, response.data);

            return true;
        } catch (error) {
            throw new Error(`Set encharge settings error: ${error}`);
        }
    }

    async setEnpowerGridState(state) {
        if (this.logDebug) this.emit('debug', `Requesting set enpower grid state`);

        try {
            const gridState = state ? 'closed' : 'open';
            const data = { mains_admin_state: gridState };
            const response = await this.axiosInstance.post(ApiUrls.EnchargeRelay, data);
            if (this.logDebug) this.emit('debug', `Set enpower grid state:`, response.data);

            return true;
        } catch (error) {
            throw new Error(`Set enpower grid state error: ${error}`);
        }
    }

    async setDryContactState(id, state) {
        if (this.logDebug) this.emit('debug', `Requesting set dry contact`);

        try {
            const dryState = state ? 'closed' : 'open';
            const data = { dry_contacts: { id: id, status: dryState } };
            const response = await this.axiosInstance.post(ApiUrls.DryContacts, data);
            if (this.logDebug) this.emit('debug', `Set dry contact:`, response.data);

            return true;
        } catch (error) {
            throw new Error(`Set dry contact error: ${error}`);
        }
    }

    async setDryContactSettings(id, enpowerIndex, contactIndex, state) {
        if (this.logDebug) this.emit('debug', `Requesting set dry contact settings`);

        try {
            const contact = this.pv.inventory.esubs.enpowers[enpowerIndex].dryContacts[contactIndex].settings;
            const data = {
                id: id,
                gen_action: contact.genAction,
                grid_action: contact.gridAction,
                load_name: contact.loadName,
                manual_override: contact.manualOverride.toString(), //bool must be as a lowercase string
                micro_grid_action: contact.microGridAction,
                mode: state ? 'closed' : 'open',
                override: contact.override.toString(), //bool must be as a lowercase string
                pv_serial_nb: contact.pvSerialNb,
                soc_high: contact.socHigh,
                soc_low: contact.socLow,
                type: contact.type
            };

            const response = await this.axiosInstance.post(ApiUrls.DryContactsSettings, data);
            if (this.logDebug) this.emit('debug', `Set dry contact settings:`, response.data);

            return true;
        } catch (error) {
            throw new Error(`Set dry contact settings error: ${error}`);
        }
    }

    async setGeneratorMode(mode) {
        if (this.logDebug) this.emit('debug', `Requesting set generator mode`);

        try {
            const data = { gen_cmd: mode };
            const response = await this.axiosInstance.post(ApiUrls.GeneratorModeGetSet, data);
            if (this.logDebug) this.emit('debug', `Set generator mode:`, response.data);

            return true;
        } catch (error) {
            throw new Error(`Set generator mode error: ${error}`);
        }
    }

    async setLiveDataStream() {
        if (this.logDebug) this.emit('debug', `Requesting set live data stream`);

        try {
            const data = { enable: 1 };
            const response = await this.axiosInstance.post(ApiUrls.LiveDataStream, data);
            if (this.logDebug) this.emit('debug', `Live data stream enable:`, response.data);

            return true;
        } catch (error) {
            throw new Error(`Set live data stream enable error: ${error}`);
        }
    }

    async getDeviceInfo() {
        if (this.logDebug) {
            this.emit('debug', `Requesting device info`);
            this.emit('debug', `Pv object:`, this.pv);
            const feature = { ...this.feature, info: 'removed' }
            this.emit('debug', `Feature object:`, feature);
        }

        // Device basic info
        this.emit('devInfo', `-------- ${this.name} --------`);
        this.emit('devInfo', `Manufacturer: Enphase`);
        this.emit('devInfo', `Model: ${this.pv.info.modelName}`);
        this.emit('devInfo', `Firmware: ${this.pv.info.software}`);
        this.emit('devInfo', `SerialNr: ${this.pv.info.serialNumber}`);
        this.emit('devInfo', `Time: ${this.formatTimestamp(this.pv.info.time)}`);
        this.emit('devInfo', `------------------------------`);

        // Inventory
        let hasInventoryInfo = false;
        if (this.feature.inventory.nsrbs.installed) {
            this.emit('devInfo', `Q-Relays: ${this.feature.inventory.nsrbs.count}`);
            hasInventoryInfo = true;
        }
        if (this.feature.inventory.pcus.installed) {
            this.emit('devInfo', `Inverters: ${this.feature.inventory.pcus.count}`);
            hasInventoryInfo = true;
        }
        if (this.feature.inventory.acbs.installed) {
            this.emit('devInfo', `AC Battery: ${this.feature.inventory.acbs.count}`);
            hasInventoryInfo = true;
        }
        if (this.feature.home.wirelessConnections.installed) {
            this.emit('devInfo', `Wireless Kit: ${this.feature.home.wirelessConnections.count}`);
            hasInventoryInfo = true;
        }
        if (hasInventoryInfo) {
            this.emit('devInfo', `--------------------------------`);
        }

        // Meters
        if (this.feature.meters.installed) {
            this.emit('devInfo', `Meters: Yes`);

            if (this.feature.meters.production.supported) {
                this.emit('devInfo', `Production: ${this.feature.meters.production.enabled ? 'Enabled' : 'Disabled'}`);
            }
            if (this.feature.meters.consumptionNet.supported) {
                this.emit('devInfo', `Consumption Net: ${this.feature.meters.consumptionNet.enabled ? 'Enabled' : 'Disabled'}`);
            }
            if (this.feature.meters.consumptionTotal.supported) {
                this.emit('devInfo', `Consumption Total: ${this.feature.meters.consumptionTotal.enabled ? 'Enabled' : 'Disabled'}`);
            }
            if (this.feature.meters.storage.supported) {
                this.emit('devInfo', `Storage: ${this.feature.meters.storage.enabled ? 'Enabled' : 'Disabled'}`);
            }
            if (this.feature.meters.backfeed.supported) {
                this.emit('devInfo', `Back Feed: ${this.feature.meters.backfeed.enabled ? 'Enabled' : 'Disabled'}`);
            }
            if (this.feature.meters.load.supported) {
                this.emit('devInfo', `Load: ${this.feature.meters.load.enabled ? 'Enabled' : 'Disabled'}`);
            }
            if (this.feature.meters.evse.supported) {
                this.emit('devInfo', `EV Charger: ${this.feature.meters.evse.enabled ? 'Enabled' : 'Disabled'}`);
            }
            if (this.feature.meters.pv3p.supported) {
                this.emit('devInfo', `PV 3P: ${this.feature.meters.pv3p.enabled ? 'Enabled' : 'Disabled'}`);
            }
            if (this.feature.meters.generator.supported) {
                this.emit('devInfo', `Generator: ${this.feature.meters.generator.enabled ? 'Enabled' : 'Disabled'}`);
            }

            this.emit('devInfo', `--------------------------------`);
        }

        // Ensemble
        const ensemble = this.feature.inventory.esubs;
        const hasEnsembleInfo = ensemble.enpowers.installed || ensemble.encharges.installed || ensemble.enpowers.dryContacts.installed || ensemble.generator.installed;

        if (hasEnsembleInfo) {
            this.emit('devInfo', `Ensemble: Yes`);

            if (ensemble.enpowers.installed) {
                this.emit('devInfo', `Enpowers: ${ensemble.enpowers.count}`);
            }
            if (ensemble.enpowers.dryContacts.installed) {
                this.emit('devInfo', `Dry Contacts: ${ensemble.enpowers.dryContacts.count}`);
            }
            if (ensemble.encharges.installed) {
                this.emit('devInfo', `IQ Battery: ${ensemble.encharges.count}`);
            }
            if (ensemble.collars.installed) {
                this.emit('devInfo', `IQ Meter Collar: ${ensemble.collars.count}`);
            }
            if (ensemble.c6CombinerControllers.installed) {
                this.emit('devInfo', `IQ Combiner Controller C6: ${ensemble.c6CombinerControllers.count}`);
            }
            if (ensemble.c6Rgms.installed) {
                this.emit('devInfo', `IQ Rgm C6: ${ensemble.c6Rgms.count}`);
            }
            if (ensemble.generator.installed) {
                this.emit('devInfo', `Generator: Yes`);
            }

            this.emit('devInfo', `--------------------------------`);
        }

        return true;
    }

    //prepare accessory
    async prepareAccessory() {
        try {
            //suppored feature
            let pvControl = true;
            const envoySerialNumber = this.pv.info.serialNumber;
            const productionStateSupported = this.feature.productionState.supported;
            const gridProfileSupported = this.feature.gridProfile.supported;
            const plcLevelSupported = this.feature.plcLevel.supported;
            const plcLevelPcusSupported = this.feature.plcLevel.pcus.supported;
            const plcLevelNrsbsSupported = this.feature.plcLevel.nsrbs.supported;
            const plcLevelAcbsSupported = this.feature.plcLevel.acbs.supported;
            const envoySupported = this.feature.homeData.supported;
            const wirelessConnectionsInstalled = this.feature.home.wirelessConnections.installed;
            const metersInstalled = this.feature.meters.installed;
            const pcuInstalled = this.feature.inventory.pcus.installed;
            const pcusStatusDataSupported = this.feature.pcuStatus.supported;
            const pcusDetailedDataSupported = this.feature.detailedDevicesData.pcus.supported;
            const nsrbsInstalled = this.feature.inventory.nsrbs.installed;
            const nsrbsDetailedDataSupported = this.feature.detailedDevicesData.nsrbs.supported;
            const acBatterieName = this.acBatterieName;
            const acbsInstalled = this.feature.inventory.acbs.installed;
            const acbsSupported = this.feature.productionCt.storage.supported
            const powerAndEnergySupported = this.feature.powerAndEnergyData.supported;
            const ensemblesSupported = this.feature.inventory.esubs.supported;
            const ensemblesInstalled = this.feature.inventory.esubs.installed;
            const ensemblesStatusSupported = this.feature.inventory.esubs.status.supported;
            const ensemblesSecCtrlSupported = this.feature.inventory.esubs.secctrl.supported;
            const ensemblesCountersSupported = this.feature.inventory.esubs.counters.supported;
            const ensemblesRelaySupported = this.feature.inventory.esubs.relay.supported;
            const enchargeName = this.enchargeName;
            const enchargesInstalled = this.feature.inventory.esubs.encharges.installed;
            const enchargesStatusSupported = this.feature.inventory.esubs.encharges.status.supported;
            const enchargesPowerSupported = this.feature.inventory.esubs.encharges.power.supported;
            const enchargesSettingsSupported = this.feature.inventory.esubs.encharges.settings.supported;
            const enchargesTariffSupported = this.feature.inventory.esubs.encharges.tariff.supported;
            const enpowersInstalled = this.feature.inventory.esubs.enpowers.installed;
            const enpowersStatusSupported = this.feature.inventory.esubs.enpowers.status.supported;
            const enpowersDryContactsInstalled = this.feature.inventory.esubs.enpowers.dryContacts.installed;
            const collarsInstalled = this.feature.inventory.esubs.collars.installed;
            const c6CombinerControllersInstalled = this.feature.inventory.esubs.c6CombinerControllers.installed;
            const c6RgmsInstalled = this.feature.inventory.esubs.c6Rgms.installed;
            const generatorInstalled = this.feature.inventory.esubs.generator.installed;
            const liveDataSupported = this.feature.liveData.supported;

            //accessory
            if (this.logDebug) this.emit('debug', `Prepare accessory`);
            const accessoryName = this.name;
            const accessoryUUID = AccessoryUUID.generate(envoySerialNumber);
            const accessoryCategory = [Categories.OTHER, Categories.LIGHTBULB, Categories.FAN, Categories.SENSOR, Categories.SENSOR][this.displayType];
            const accessory = new Accessory(accessoryName, accessoryUUID, accessoryCategory);

            //information service
            if (this.logDebug) this.emit('debug', `Prepare Information Service`);
            accessory.getService(Service.AccessoryInformation)
                .setCharacteristic(Characteristic.Manufacturer, 'Enphase')
                .setCharacteristic(Characteristic.Model, this.pv.info.modelName ?? 'Model Name')
                .setCharacteristic(Characteristic.SerialNumber, envoySerialNumber ?? 'Serial Number')
                .setCharacteristic(Characteristic.FirmwareRevision, this.pv.info.software.replace(/[a-zA-Z]/g, '') ?? '0');

            //system
            if (this.logDebug) this.emit('debug', `Prepare System Service`);
            const { serviceType, characteristicType, characteristicType1, state, level } = this.systemAccessory;

            const systemService = accessory.addService(serviceType, accessoryName, `systemService`);
            systemService.setPrimaryService(true);
            systemService.addOptionalCharacteristic(Characteristic.ConfiguredName);
            systemService.setCharacteristic(Characteristic.ConfiguredName, accessoryName);

            // Handle production state characteristic
            systemService.getCharacteristic(characteristicType)
                .onGet(async () => {
                    if (this.logInfo) this.emit('info', `Production state: ${state ? 'Enabled' : 'Disabled'}`);
                    return state;
                })
                .onSet(async (value) => {
                    if (!productionStateSupported || !pvControl) {
                        if (this.logWarn) this.emit('warn', !productionStateSupported ? `Production state control not supported` : `System control is locked`);
                        setTimeout(() => systemService.updateCharacteristic(characteristicType, !value), 250);
                        return;
                    }

                    try {
                        const tokenValid = await this.checkToken();
                        if (!tokenValid || value === this.pv.productionState) {
                            setTimeout(() => systemService.updateCharacteristic(characteristicType, !value), 250);
                            return;
                        }

                        await this.setProductionState(value);
                        if (this.logDebug) this.emit('debug', `Set production state: ${value ? 'Enabled' : 'Disabled'}`);
                    } catch (error) {
                        if (this.logWarn) this.emit('warn', `Set production state error: ${error}`);
                    }
                });

            // Handle production level characteristic
            systemService.getCharacteristic(characteristicType1)
                .onGet(async () => {
                    if (this.logInfo) this.emit('info', `Production level: ${level} %`);
                    return level;
                })
                .onSet(async (value) => {
                    if (!pvControl) {
                        if (this.logWarn) this.emit('warn', `System control is locked`);
                        setTimeout(() => systemService.updateCharacteristic(characteristicType1, level), 250);
                        return;
                    }

                    try {
                        systemService.updateCharacteristic(characteristicType1, level);
                    } catch (error) {
                        if (this.logWarn) this.emit('warn', `Set production level error: ${error}`);
                    }
                });

            this.systemService = systemService;

            //data refresh control
            if (this.dataRefreshActiveControl) {
                if (this.logDebug) this.emit('debug', `Prepare Data Refresh Control Service`);

                const { name, namePrefix, serviceType, characteristicType, state } = this.dataRefreshActiveControl;
                const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                const controlService = accessory.addService(serviceType, serviceName, `dataRefreshControlService`);
                controlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                controlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                controlService.getCharacteristic(characteristicType)
                    .onGet(async () => {
                        if (this.logInfo) this.emit('info', `Data refresh control: ${state ? 'Enabled' : 'Disabled'}`);
                        return state;
                    })

                    // SET handler
                    .onSet(async (value) => {
                        if (!pvControl) {
                            if (this.logWarn) this.emit('warn', `System control is locked`);
                            setTimeout(() => controlService.updateCharacteristic(characteristicType, !value), 250);
                            return;
                        }

                        try {
                            const result = value ? await this.impulseGenerator.start(this.timers) : await this.impulseGenerator.stop();
                            if (this.logInfo) this.emit('info', `Set data refresh control to: ${value ? 'Enable' : 'Disable'}`);
                        } catch (error) {
                            if (this.logWarn) this.emit('warn', `Set data refresh control error: ${error}`);
                        }
                    });

                this.dataRefreshControlService = controlService;
            }

            //data refresh sensor
            if (this.dataRefreshActiveSensor) {
                if (this.logDebug) this.emit('debug', `Prepare Data Refresh Sensor Service`);

                const { name, namePrefix, serviceType, characteristicType } = this.dataRefreshActiveSensor;
                const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                const sensorService = accessory.addService(serviceType, serviceName, `dataRefreshSensorService`);
                sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                sensorService.getCharacteristic(characteristicType)
                    .onGet(async () => {
                        const state = this.dataSampling;
                        if (this.logInfo) this.emit('info', `Data refresh sensor: ${state ? 'Active' : 'Not active'}`);
                        return state;
                    });

                this.dataRefreshSensorService = sensorService;
            }

            //production state sensor
            if (this.productionStateActiveSensor && productionStateSupported) {
                if (this.logDebug) this.emit('debug', `Prepare Production State Sensor Service`);

                const { name, namePrefix, serviceType, characteristicType, state } = this.productionStateActiveSensor;
                const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                const sensorService = accessory.addService(serviceType, serviceName, `productionStateSensorService`);
                sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                sensorService.getCharacteristic(characteristicType)
                    .onGet(async () => {
                        if (this.logInfo) this.emit('info', `Production state sensor: ${state ? 'Active' : 'Not active'}`);
                        return state;
                    });

                this.productionStateSensorService = sensorService;
            }

            //plc level control
            if (this.plcLevelActiveControl && plcLevelSupported) {
                if (this.logDebug) this.emit('debug', `Prepare Plc Level Control Service`);

                const { name, namePrefix, serviceType, characteristicType, state } = this.plcLevelActiveControl;
                const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                const controlService = accessory.addService(serviceType, serviceName, `plcLevelControlService`);
                controlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                controlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                controlService.getCharacteristic(characteristicType)
                    .onGet(async () => {
                        if (this.logInfo) this.emit('info', `Plc level control state: ${state ? 'ON' : 'OFF'}`);
                        return state;
                    })
                    .onSet(async (value) => {
                        if (!pvControl) {
                            if (this.logWarn) this.emit('warn', `System control is locked`);
                            setTimeout(() => controlService.updateCharacteristic(characteristicType, !value), 250);
                            return;
                        }

                        try {
                            const tokenValid = await this.checkToken();
                            if (!tokenValid || !value) {
                                setTimeout(() => controlService.updateCharacteristic(characteristicType, !value), 250);
                                return;
                            }

                            await this.updatePlcLevel(false);
                            if (this.logInfo) this.emit('info', `Set plc level control state to: ${value ? 'ON' : 'OFF'}`);
                        } catch (error) {
                            if (this.logWarn) this.emit('warn', `Set plc level control state error: ${error}`);
                        }
                    });

                this.plcLevelControlService = controlService;
            }

            //system control lock service
            if (this.lockControl) {
                if (this.logDebug) this.emit('debug', `Prepare System Control Lock Service`);

                pvControl = false; // initially locked
                const serviceName = this.lockControlPrefix ? `${accessoryName} System control` : 'System control';

                const lockService = accessory.addService(Service.LockMechanism, serviceName, `lockService`);
                lockService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                lockService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                lockService.getCharacteristic(Characteristic.LockCurrentState)
                    .onGet(async () => {
                        const state = pvControl ? Characteristic.LockCurrentState.UNSECURED : Characteristic.LockCurrentState.SECURED;
                        if (this.logInfo) this.emit('info', `System Control: ${state === Characteristic.LockCurrentState.UNSECURED ? 'Unlocked' : 'Locked'}`);
                        return state;
                    });
                lockService.getCharacteristic(Characteristic.LockTargetState)
                    .onGet(async () => {
                        return pvControl ? Characteristic.LockTargetState.UNSECURED : Characteristic.LockTargetState.SECURED;
                    })
                    .onSet(async (value) => {
                        if (value === Characteristic.LockTargetState.UNSECURED) {
                            this.emit('success', `System control unlocked`);
                            pvControl = true;
                            lockService.updateCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);
                            this.envoyService.updateCharacteristic(Characteristic.SystemControl, true);

                            if (this.unlockTimeout) clearTimeout(this.unlockTimeout);
                            this.unlockTimeout = setTimeout(() => {
                                pvControl = false;
                                lockService.updateCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
                                lockService.updateCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED);
                                this.envoyService.updateCharacteristic(Characteristic.SystemControl, false);
                                this.emit('success', `System control locked`);
                            }, this.lockControTime);
                        } else {
                            this.emit('success', `System control locked`);
                            pvControl = false;
                            if (this.unlockTimeout) clearTimeout(this.unlockTimeout);
                            lockService.updateCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
                            lockService.updateCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED);
                            this.envoyService.updateCharacteristic(Characteristic.SystemControl, false);
                        }
                    });

                this.lockService = lockService;
            }

            //envoy
            if (envoySupported) {
                if (this.logDebug) this.emit('debug', `Prepare Envoy ${envoySerialNumber} Service`);

                const home = this.pv.home;
                const service = accessory.addService(Service.EnvoyService, `Envoy ${envoySerialNumber}`, `envoyService`);
                service.setCharacteristic(Characteristic.ConfiguredName, `Envoy ${envoySerialNumber}`);
                service.getCharacteristic(Characteristic.DataSampling)
                    .onGet(async () => {
                        const state = this.dataSampling;
                        if (this.logInfo) this.emit('info', `Envoy: ${envoySerialNumber}, data refresh control: ${state ? 'Enabled' : 'Disabled'}`);
                        return state;
                    })
                    .onSet(async (value) => {
                        if (!pvControl) {
                            if (this.logWarn) this.emit('warn', `System control is locked`);
                            setTimeout(() => {
                                service.updateCharacteristic(Characteristic.DataSampling, !value);
                            }, 250);
                            return;
                        }

                        try {
                            const setStatet = value ? await this.impulseGenerator.start(this.timers) : await this.impulseGenerator.stop();
                            if (this.logInfo) this.emit('info', `Envoy: ${envoySerialNumber}, set data refresh control to: ${value ? `Enable` : `Disable`}`);
                        } catch (error) {
                            if (this.logWarn) this.emit('warn', `Envoy: ${envoySerialNumber}, set data refresh control error: ${error}`);
                        }
                    });

                // Create characteristics
                const characteristics = [
                    { type: Characteristic.Alerts, label: 'alerts', value: home.alerts },
                    { type: Characteristic.CommInterface, label: 'comm interface', value: home.network.primaryInterface },
                    { type: Characteristic.NetworkWebComm, label: 'web communication', value: home.network.webComm, postfix: home.network.webComm ? 'Yes' : 'No' },
                    { type: Characteristic.EverReportedToEnlighten, label: 'report to enlighten', value: home.network.everReportedToEnlighten, postfix: home.network.everReportedToEnlighten ? 'Yes' : 'No' },
                    { type: Characteristic.DbSize, label: 'data base size', value: home.dbSize, unit: 'MB' },
                    { type: Characteristic.DbPercentFull, label: 'data base percent full', value: home.dbPercentFull, unit: '%' },
                    { type: Characteristic.CommNumAndLevel, label: 'communication devices and level', value: `${home.comm.num} / ${home.comm.level}`, unit: '%' },
                    { type: Characteristic.CommNumPcuAndLevel, label: 'communication Microinverters and level', value: `${home.comm.pcuNum} / ${home.comm.pcuLevel}`, unit: '%' },
                    { type: Characteristic.Tariff, label: 'tariff', value: home.tariff },
                    { type: Characteristic.Firmware, label: 'firmware', value: this.pv.info.software },
                    { type: Characteristic.TimeZone, label: 'time zone', value: home.timeZone },
                    { type: Characteristic.CurrentDateTime, label: 'current date and time', value: `${home.currentDate} ${home.currentTime}` },
                    { type: Characteristic.LastEnlightenReporDate, label: 'reading time to enlighten', value: home.network.lastEnlightenReporDate },
                    { type: Characteristic.UpdateStatus, label: 'update status', value: home.updateStatus }
                ];

                if (nsrbsInstalled) {
                    characteristics.push({ type: Characteristic.CommNumNsrbAndLevel, label: 'communication qRelays and level', value: `${home.comm.nsrbNum} / ${home.comm.nsrbLevel}`, unit: '%' });
                }
                if (acbsInstalled) {
                    characteristics.push({ type: Characteristic.CommNumAcbAndLevel, label: `communication ${acBatterieName} and level`, value: `${home.comm.acbNum} / ${home.comm.acbLevel}`, unit: '%' });
                }
                if (enchargesInstalled) {
                    characteristics.push({ type: Characteristic.CommNumEnchgAndLevel, label: `communication ${enchargeName} and level`, value: `${home.comm.encharges[0].num} / ${home.comm.encharges[0].level}`, unit: '%' });
                }
                if (gridProfileSupported) {
                    characteristics.push({ type: Characteristic.GridProfile, label: 'grid profile', value: home.gridProfile });
                }

                // Control characteristics array (with get/set)
                if (this.lockControl) {
                    service.getCharacteristic(Characteristic.SystemControl)
                        .onGet(async () => {
                            if (this.logInfo) this.emit('info', `Envoy: ${envoySerialNumber}, system control: ${pvControl ? 'Enabled' : 'Disabled'}`);
                            return pvControl;
                        })
                        .onSet(async (value) => {
                            try {
                                await this.lockService.setCharacteristic(Characteristic.LockTargetState, !value);
                                if (this.logInfo) this.emit('info', `Envoy: ${envoySerialNumber}, set system control to: ${value ? 'Enable' : 'Disable'}`);
                            } catch (error) {
                                if (this.logWarn) this.emit('warn', `Envoy: ${envoySerialNumber}, set system control error: ${error}`);
                            }
                        });
                }

                if (productionStateSupported) {
                    service.getCharacteristic(Characteristic.ProductionState)
                        .onGet(async () => {
                            const state = this.pv.productionState;
                            if (this.logInfo) this.emit('info', `Envoy: ${envoySerialNumber}, production state: ${state ? 'Enabled' : 'Disabled'}`);
                            return state;
                        })
                        .onSet(async (value) => {
                            if (!pvControl) {
                                if (this.logWarn) this.emit('warn', `System control is locked`);
                                setTimeout(() => service.updateCharacteristic(Characteristic.ProductionState, !value), 250);
                                return;
                            }

                            try {
                                const tokenValid = await this.checkToken();
                                if (!tokenValid || value === this.pv.productionState) {
                                    setTimeout(() => service.updateCharacteristic(Characteristic.ProductionState, !value), 250);
                                    return;
                                }

                                await this.setProductionState(value);
                                if (!this.logDebug) this.emit('debug', `Envoy: ${envoySerialNumber}, set production state: ${value ? 'Enabled' : 'Disabled'}`);
                            } catch (error) {
                                if (this.logWarn) this.emit('warn', `Envoy: ${envoySerialNumber}, set production state error: ${error}`);
                            }
                        });
                }

                if (plcLevelSupported) {
                    service.getCharacteristic(Characteristic.PlcLevelCheck)
                        .onGet(async () => {
                            const state = this.pv.plcLevelCheckState;
                            if (this.logInfo) this.emit('info', `Envoy: ${envoySerialNumber}, checking plc level: ${state ? `Yes` : `No`}`);
                            return state;
                        })
                        .onSet(async (value) => {
                            if (!pvControl) {
                                if (this.logWarn) this.emit('warn', `System control is locked`);
                                setTimeout(() => service.updateCharacteristic(Characteristic.PlcLevelCheck, !value), 250);
                                return;
                            }

                            try {
                                const tokenValid = await this.checkToken();
                                if (!tokenValid) {
                                    setTimeout(() => service.updateCharacteristic(Characteristic.PlcLevelCheck, !value), 250);
                                    return;
                                }

                                await this.updatePlcLevel(false);
                                if (this.logInfo) this.emit('info', `Envoy: ${envoySerialNumber}, set check plc level: ${value ? `Yes` : `No`}`);
                            } catch (error) {
                                if (this.logWarn) this.emit('warn', `Envoy: ${envoySerialNumber}, set check plc level error: ${error}`);
                            }
                        });
                }

                if (enpowersInstalled) {
                    const enpowerState = this.pv.inventory.esubs.enpowers[0].mainsAdminStateBool;
                    characteristics.push({ type: Characteristic.EnpowerGridMode, label: 'enpower grid mode', value: this.pv.inventory.esubs.enpowers[0].enpwrGridModeTranslated });
                    service.getCharacteristic(Characteristic.EnpowerGridState)
                        .onGet(async () => {
                            const state = enpowerState;
                            if (this.logInfo) this.emit('info', `Envoy: ${envoySerialNumber}, enpower grid state: ${state ? 'Grid ON' : 'Grid OFF'}`);
                            return state;
                        })
                        .onSet(async (value) => {
                            if (!pvControl) {
                                if (this.logWarn) this.emit('warn', `System control is locked`);
                                setTimeout(() => service.updateCharacteristic(Characteristic.EnpowerGridState, !value), 250);
                                return;
                            }

                            try {
                                const tokenValid = await this.checkToken();
                                if (!tokenValid) {
                                    setTimeout(() => service.updateCharacteristic(Characteristic.EnpowerGridState, !value), 250);
                                    return;
                                }

                                await this.setEnpowerGridState(value);
                                if (this.logInfo) this.emit('info', `Envoy: ${envoySerialNumber}, set enpower grid state to: ${value ? `Grid ON` : `Grid OFF`}`);
                            } catch (error) {
                                if (this.logWarn) this.emit('warn', `Set enpower grid state error: ${error}`);
                            }
                        });
                }

                if (generatorInstalled) {
                    const generatorState = this.pv.inventory.esubs.generator.adminModeOnBool || this.pv.inventory.esubs.generator.adminModeAutoBool;
                    characteristics.push({ type: Characteristic.GeneratorMode, label: 'generator mode', value: this.pv.inventory.esubs.generator.adminMode });
                    service.getCharacteristic(Characteristic.State)
                        .onGet(async () => {
                            const state = generatorState
                            if (this.logInfo) this.emit('info', `Envoy: ${envoySerialNumber}, generator state: ${state ? 'ON' : 'OFF'}`);
                            return state;
                        })
                        .onSet(async (value) => {
                            if (!pvControl) {
                                if (this.logWarn) this.emit('warn', `System control is locked`);
                                setTimeout(() => service.updateCharacteristic(Characteristic.State, !value), 250);
                                return;
                            }

                            try {
                                const tokenValid = await this.checkToken();
                                if (!tokenValid) {
                                    setTimeout(() => service.updateCharacteristic(Characteristic.State, !value), 250);
                                    return;
                                }

                                const genMode = value ? 'on' : 'off';
                                await this.setGeneratorMode(genMode);
                                if (this.logInfo) this.emit('info', `Envoy: ${envoySerialNumber}, set generator state to: ${value ? `ON` : `OFF`}`);
                            } catch (error) {
                                if (this.logWarn) this.emit('warn', `Set generator state error: ${error}`);
                            }
                        });
                }

                // Add all read-only characteristics
                for (const { type, value, label, unit = '', postfix = '' } of characteristics) {
                    if (!this.isValidValue(value)) continue;

                    service.getCharacteristic(type)
                        .onGet(async () => {
                            if (this.logInfo) this.emit('info', `Envoy: ${envoySerialNumber}, ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                            return value;
                        });
                }

                // Wireless connection kits
                if (wirelessConnectionsInstalled) {
                    this.wirelessConnektionsKitServices = [];

                    for (const wirelessConnection of home.wirelessKits) {
                        const connectionType = wirelessConnection.type;
                        if (this.logDebug) this.emit('debug', `Prepare Wireless Connection ${connectionType} Service`);

                        const wirelessService = accessory.addService(Service.WirelessConnectionKitService, `Wireless connection ${connectionType}`, `wirelessConnectionKitService${connectionType}`);
                        wirelessService.setCharacteristic(Characteristic.ConfiguredName, `Wireless connection ${connectionType}`);

                        const wirelessCharacteristics = [
                            { type: Characteristic.Type, label: 'type', value: wirelessConnection.type },
                            { type: Characteristic.Connected, label: 'state', value: wirelessConnection.connected, postfix: `${wirelessConnection.connected ? 'Connected' : 'Disconnected'}` },
                            { type: Characteristic.SignalStrength, label: 'signal strength', value: wirelessConnection.signalStrength, unit: '%' },
                            { type: Characteristic.SignalStrengthMax, label: 'signal strength max', value: wirelessConnection.signalStrengthMax, unit: '%' },
                        ];

                        for (const { type, value, label, unit = '', postfix = '' } of wirelessCharacteristics) {
                            if (!this.isValidValue(value)) continue;

                            wirelessService.getCharacteristic(type)
                                .onGet(async () => {
                                    if (this.logInfo) this.emit('info', `Wireless connection: ${connectionType}, ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                    return value;
                                });
                        }

                        this.wirelessConnektionsKitServices.push(wirelessService);
                    }
                }

                this.envoyService = service;
            }

            //meters
            if (metersInstalled) {
                this.meterServices = [];

                for (const meter of this.pv.meters) {
                    const measurementType = meter.measurementType;
                    if (this.logDebug) this.emit('debug', `Prepare Meter ${measurementType} Service`);

                    const serviceName = `Meter ${measurementType}`;
                    const service = accessory.addService(Service.MeterService, serviceName, `meterService${measurementType}`);
                    service.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.State, label: 'state', value: meter.state, postfix: meter.state ? 'Enabled' : 'Disabled' },
                        { type: Characteristic.PhaseMode, label: 'phase mode', value: meter.phaseMode },
                        { type: Characteristic.PhaseCount, label: 'phase count', value: meter.phaseCount },
                        { type: Characteristic.MeteringStatus, label: 'metering status', value: meter.meteringStatus },
                        { type: Characteristic.Status, label: 'status', value: meter.deviceStatus },
                        { type: Characteristic.ReadingTime, label: 'reading time', value: meter.readingTime }
                    ];

                    if (meter.state) {
                        characteristics.push(
                            { type: Characteristic.Power, label: 'power', value: meter.powerKw, unit: 'kW' },
                            { type: Characteristic.ApparentPower, label: 'apparent power', value: meter.apparentPowerKw, unit: 'kVA' },
                            { type: Characteristic.ReactivePower, label: 'reactive power', value: meter.reactivePowerKw, unit: 'kVAr' },
                            { type: Characteristic.EnergyLifetime, label: 'energy lifetime', value: meter.energyLifetimeKw, unit: 'kWh' },
                            { type: Characteristic.Current, label: 'current', value: meter.current, unit: 'A' },
                            { type: Characteristic.Voltage, label: 'voltage', value: meter.voltage, unit: 'V' },
                            { type: Characteristic.Frequency, label: 'frequency', value: meter.frequency, unit: 'Hz' },
                            { type: Characteristic.PwrFactor, label: 'power factor', value: meter.pwrFactor, unit: 'cos φ' }
                        );

                        if (measurementType !== 'Consumption Total') {
                            characteristics.push({ type: Characteristic.EnergyLifetimeUpload, label: 'energy lifetime upload', value: meter.energyLifetimeUploadKw, unit: 'kW' });
                        }
                    }

                    for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                        if (!this.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                if (this.logInfo) this.emit('info', `${serviceName}: ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                return value;
                            });
                    }

                    this.meterServices.push(service);
                }
            }

            //pcu
            if (pcuInstalled) {
                this.pcuServices = [];

                for (const pcu of this.pv.inventory.pcus) {
                    const serialNumber = pcu.serialNumber;
                    if (this.logDebug) this.emit('debug', `Prepare Microinverter ${serialNumber} Service`);

                    const service = accessory.addService(Service.MicroinverterService, `Microinverter ${serialNumber}`, `pcuService${serialNumber}`);
                    service.setCharacteristic(Characteristic.ConfiguredName, `Microinverter ${serialNumber}`);

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.Producing, label: 'producing', value: pcu.producing, postfix: pcu.producing ? 'Yes' : 'No' },
                        { type: Characteristic.Communicating, label: 'communicating', value: pcu.communicating, postfix: pcu.communicating ? 'Yes' : 'No' },
                        { type: Characteristic.Provisioned, label: 'provisioned', value: pcu.provisioned, postfix: pcu.provisioned ? 'Yes' : 'No' },
                        { type: Characteristic.Operating, label: 'operating', value: pcu.operating, postfix: pcu.operating ? 'Yes' : 'No' },
                        { type: Characteristic.Phase, label: 'phase', value: pcu.phase },
                        { type: Characteristic.GfiClear, label: 'gfi clear', value: pcu.deviceControl },
                        { type: Characteristic.Status, label: 'status', value: pcu.deviceStatus },
                        { type: Characteristic.Firmware, label: 'firmware', value: pcu.firmware },
                        { type: Characteristic.ReadingTime, label: 'reading time', value: pcu.readingTime },
                    ];

                    if (gridProfileSupported) {
                        characteristics.push(
                            { type: Characteristic.GridProfile, label: 'grid profile', value: pcu.gridProfile }
                        );
                    }

                    if (plcLevelPcusSupported) {
                        characteristics.push(
                            { type: Characteristic.PlcLevel, label: 'plc level', value: pcu.plcLevel, unit: '%' }
                        );
                    }

                    if (pcusStatusDataSupported || pcusDetailedDataSupported) {
                        characteristics.push(
                            { type: Characteristic.PowerW, label: 'power', value: pcu.power, unit: 'W' },
                            { type: Characteristic.PowerPeakW, label: 'power peak', value: pcu.powerPeak, unit: 'W' }
                        );
                    }

                    if (pcusDetailedDataSupported) {
                        characteristics.push(
                            { type: Characteristic.EnergyTodayWh, label: 'energy today', value: pcu.energyToday, unit: 'Wh' },
                            { type: Characteristic.EnergyYesterdayWh, label: 'energy yesterday', value: pcu.energyYesterday, unit: 'Wh' },
                            { type: Characteristic.EnergyLastSevenDays, label: 'energy last seven days', value: pcu.energyLastSevenDaysKw, unit: 'kWh' },
                            { type: Characteristic.EnergyLifetime, label: 'energy lifetime', value: pcu.energyLifetimeKw, unit: 'kWh' },
                            { type: Characteristic.Voltage, label: 'voltage', value: pcu.voltage, unit: 'V' },
                            { type: Characteristic.Frequency, label: 'frequency', value: pcu.frequency, unit: 'Hz' },
                            { type: Characteristic.VoltageDc, label: 'voltage dc', value: pcu.voltageDc, unit: 'V' },
                            { type: Characteristic.CurrentDc, label: 'current dc', value: pcu.currentDc, unit: 'A' },
                            { type: Characteristic.Temperature, label: 'temperature', value: pcu.temperature, unit: '°C' }
                        );
                    }

                    // Add characteristics with async getters and info logging
                    for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                        if (!this.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                if (this.logInfo) this.emit('info', `Microinverter: ${serialNumber}, ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                return value;
                            });
                    }

                    this.pcuServices.push(service);
                }
            }

            //qrelays
            if (nsrbsInstalled) {
                this.nsrbServices = [];
                this.nsrbStateSensorServices = [];

                for (const nsrb of this.pv.inventory.nsrbs) {
                    const serialNumber = nsrb.serialNumber;

                    if (this.logDebug) this.emit('debug', `Prepare Q-Relay ${serialNumber} Service`);

                    const service = accessory.addService(Service.QrelayService, `QRelay ${serialNumber}`, `nsrbService${serialNumber}`);
                    service.setCharacteristic(Characteristic.ConfiguredName, `QRelay ${serialNumber}`);

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.State, label: 'state', value: nsrb.relayState, postfix: nsrb.relayState ? 'Closed' : 'Open' },
                        { type: Characteristic.LinesCount, label: 'lines', value: nsrb.linesCount },
                        { type: Characteristic.Communicating, label: 'communicating', value: nsrb.communicating, postfix: nsrb.communicating ? 'Yes' : 'No' },
                        { type: Characteristic.Provisioned, label: 'provisioned', value: nsrb.provisioned, postfix: nsrb.provisioned ? 'Yes' : 'No' },
                        { type: Characteristic.Operating, label: 'operating', value: nsrb.operating, postfix: nsrb.operating ? 'Yes' : 'No' },
                        { type: Characteristic.GfiClear, label: 'gfi clear', value: nsrb.deviceControl },
                        { type: Characteristic.Status, label: 'status', value: nsrb.deviceStatus },
                        { type: Characteristic.Firmware, label: 'firmware', value: nsrb.firmware },
                        { type: Characteristic.ReadingTime, label: 'reading time', value: nsrb.readingTime },
                        { type: Characteristic.Line1Connected, label: 'line 1', value: nsrb.line1Connected, postfix: nsrb.line1Connected ? 'Closed' : 'Open' },
                        { type: Characteristic.Line2Connected, label: 'line 2', value: nsrb.line2Connected, postfix: nsrb.line2Connected ? 'Closed' : 'Open' },
                        { type: Characteristic.Line3Connected, label: 'line 3', value: nsrb.line3Connected, postfix: nsrb.line3Connected ? 'Closed' : 'Open' },
                    ];

                    if (gridProfileSupported) {
                        characteristics.push(
                            { type: Characteristic.GridProfile, label: 'grid profile', value: nsrb.gridProfile }
                        );
                    }

                    if (plcLevelNrsbsSupported) {
                        characteristics.push(
                            { type: Characteristic.PlcLevel, label: 'plc level', value: nsrb.plcLevel, unit: '%' }
                        );
                    }

                    if (nsrbsDetailedDataSupported) {
                        characteristics.push(
                            { type: Characteristic.AcOffset, label: 'voltage offset', value: nsrb.acOffset, unit: 'V' },
                            { type: Characteristic.VoltageL1, label: 'voltage L1', value: nsrb.voltageL1, unit: 'V' },
                            { type: Characteristic.VoltageL2, label: 'voltage L2', value: nsrb.voltageL2, unit: 'V' },
                            { type: Characteristic.VoltageL3, label: 'voltage L3', value: nsrb.voltageL3, unit: 'V' },
                            { type: Characteristic.Frequency, label: 'frequency', value: nsrb.frequency, unit: 'Hz' },
                            { type: Characteristic.Temperature, label: 'temperature', value: nsrb.temperature, unit: '°C' }
                        );
                    }

                    for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                        if (!this.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                if (this.logInfo) this.emit('info', `Q-Relay: ${serialNumber}, ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                return value;
                            });
                    }

                    this.nsrbServices.push(service);

                    // State sensors setup
                    if (this.qRelayStateActiveSensor) {
                        if (this.logDebug) this.emit('debug', `Prepare Q-Relay ${serialNumber} State Sensor Service`);

                        const sensorServices = [];
                        const sensor = this.qRelayStateActiveSensor;
                        const sensorCount = sensor.multiphase && nsrb.linesCount > 1 ? nsrb.linesCount + 1 : 1;

                        for (let i = 0; i < sensorCount; i++) {
                            if (i > 0 && nsrb.linesCount < i) continue;

                            const { namePrefix, name, serviceType, characteristicType } = sensor;
                            const serviceName = namePrefix ? `${accessoryName} ${i === 0 ? name : `${name} L${i}`}` : (i === 0 ? name : `${name} L${i}`);

                            const sensorService = accessory.addService(serviceType, serviceName, `nsrbStateSensorService${serialNumber}${i}`);
                            sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                            sensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = sensor[`state${i}`];
                                    if (this.logInfo) this.emit('info', `Q-Relay: ${serialNumber}, sensor: ${serviceName}, state: ${state ? 'Active' : 'Not Active'}`);
                                    return state;
                                });

                            sensorServices.push(sensorService);
                        }
                        this.nsrbStateSensorServices.push(sensorServices);
                    }

                }
            }

            //ac batteries
            if (acbsInstalled) {
                // --- AC Battery Backup Level and State Summary Service ---
                if (acbsSupported && this.acBatterieBackupLevelSummaryActiveAccessory) {
                    if (this.logDebug) this.emit('debug', `Prepare ${acBatterieName} Backup Level Summary Service`);

                    const accessoryTile = this.acBatterieBackupLevelSummaryActiveAccessory;
                    const { namePrefix, name, serviceType, characteristicType, characteristicType1, state, backupLevel } = accessoryTile;
                    const serviceName = namePrefix ? `${accessoryName} ${acBatterieName}` : acBatterieName;

                    const accessoryService = accessory.addService(serviceType, serviceName, `acbSummaryLevelAndStateService`);
                    accessoryService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                    accessoryService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                    // Create characteristics
                    const characteristics = [
                        { type: characteristicType, label: 'state', value: state, postfix: state ? 'Discharged' : 'Charged' },
                        { type: characteristicType1, label: 'backup level', value: backupLevel, unit: '%' },
                    ];

                    for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                        if (!this.isValidValue(value)) continue;

                        accessoryService.getCharacteristic(type)
                            .onGet(async () => {
                                if (this.logInfo) this.emit('info', `${acBatterieName}: ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                return value;
                            });
                    }

                    this.acbSummaryLevelAndStateService = accessoryService;
                }

                // --- AC Batteries Summary Service ---
                if (acbsSupported) {
                    if (this.logDebug) this.emit('debug', `Prepare ${acBatterieName} Summary Service`);

                    const storageSumm = this.pv.inventory.acbs[0];
                    const service = accessory.addService(Service.AcBatterieSummaryService, `${acBatterieName} Summary`, 'acbSummaryService');
                    service.setCharacteristic(Characteristic.ConfiguredName, `${acBatterieName} Summary`);

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.ChargeState, label: 'charge state', value: storageSumm.chargeStateSum },
                        { type: Characteristic.Power, label: 'power', value: storageSumm.powerSumKw, unit: 'kW' },
                        { type: Characteristic.Energy, label: 'energy', value: storageSumm.energySumKw, unit: 'kWh' },
                        { type: Characteristic.PercentFull, label: 'percent full', value: storageSumm.percentFullSum, unit: '%' },
                        { type: Characteristic.ActiveCount, label: 'active count', value: storageSumm.activeCount },
                        { type: Characteristic.ReadingTime, label: 'reading time', value: storageSumm.readingTime },
                    ];

                    for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                        if (!this.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                if (this.logInfo) this.emit('info', `${acBatterieName}: ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                return value;
                            });
                    }

                    this.acbSummaryService = service;
                }

                // --- Individual AC Batteries ---
                this.acbServices = [];
                this.acbLevelAndStateServices = [];

                for (const storage of this.pv.inventory.acbs) {
                    const serialNumber = storage.serialNumber;

                    // Backup Level and State individual service
                    if (this.acBatterieBackupLevelActiveAccessory) {
                        if (this.logDebug) this.emit('debug', `Prepare ${acBatterieName} Backup Level Summary Service`);

                        const accessoryTile = this.acBatterieBackupLevelActiveAccessory;
                        const { namePrefix, name, serviceType, characteristicType, characteristicType1, characteristicType2 } = accessoryTile;
                        const serviceName = namePrefix ? `${accessoryName} ${acBatterieName}` : acBatterieName;

                        const accessoryService = accessory.addService(serviceType, serviceName, `acBatterieLevelAndStateService${serialNumber}`);
                        accessoryService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        accessoryService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                        // Create characteristics
                        const characteristics = [
                            { type: characteristicType, label: 'state', value: storage.percentFull < accessoryTile.minSoc, postfix: `${storage.percentFull < accessoryTile.minSoc ? 'Discharged' : 'Charged'}` },
                            { type: characteristicType1, label: 'backup level', value: storage.percentFull, unit: '%' },
                            { type: characteristicType2, label: 'charging state', value: storage.chargeStateNum, postfix: `${storage.percentFull === 0 ? 'Discharging' : storage.percentFull === 1 ? 'Charging' : 'Ready'}` },
                        ];

                        for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                            if (!this.isValidValue(value)) continue;

                            accessoryService.getCharacteristic(type)
                                .onGet(async () => {
                                    if (this.logInfo) this.emit('info', `${acBatterieName} ${serialNumber}: ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                    return value;
                                });
                        }

                        this.acbLevelAndStateServices.push(accessoryService);
                    }

                    if (this.logDebug) this.emit('debug', `Prepare ${acBatterieName} ${serialNumber} Service`);
                    const service = accessory.addService(Service.AcBatterieService, `${acBatterieName} ${serialNumber}`, `acbService${serialNumber}`);
                    service.setCharacteristic(Characteristic.ConfiguredName, `${acBatterieName} ${serialNumber}`);

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.ChargeState, label: 'charge state', value: storage.chargeState },
                        { type: Characteristic.Status, label: 'status', value: storage.deviceStatus },
                        { type: Characteristic.Producing, label: 'producing', value: storage.producing, postfix: storage.producing ? 'Yes' : 'No' },
                        { type: Characteristic.Communicating, label: 'communicating', value: storage.communicating, postfix: storage.communicating ? 'Yes' : 'No' },
                        { type: Characteristic.Provisioned, label: 'provisioned', value: storage.provisioned, postfix: storage.provisioned ? 'Yes' : 'No' },
                        { type: Characteristic.Operating, label: 'operating', value: storage.operating, postfix: storage.operating ? 'Yes' : 'No' },
                        { type: Characteristic.GfiClear, label: 'gfi clear', value: storage.deviceControl },
                        { type: Characteristic.SleepEnabled, label: 'sleep', value: storage.sleepEnabled, postfix: storage.sleepEnabled ? 'Yes' : 'No' },
                        { type: Characteristic.PercentFull, label: 'percent full', value: storage.percentFull, unit: '%' },
                        { type: Characteristic.MaxCellTemp, label: 'max cell temperature', value: storage.maxCellTemp, unit: '°C' },
                        { type: Characteristic.SleepMinSoc, label: 'sleep min soc', value: storage.sleepMinSoc, unit: 'min' },
                        { type: Characteristic.SleepMaxSoc, label: 'sleep max soc', value: storage.sleepMaxSoc, unit: 'min' },
                        { type: Characteristic.Firmware, label: 'firmware', value: storage.firmware },
                        { type: Characteristic.ReadingTime, label: 'reading time', value: storage.readingTime },
                    ];

                    if (gridProfileSupported) {
                        characteristics.push(
                            { type: Characteristic.GridProfile, label: 'grid profile', value: storage.gridProfile }
                        );
                    }

                    if (plcLevelAcbsSupported) {
                        characteristics.push(
                            { type: Characteristic.PlcLevel, label: 'plc level', value: storage.plcLevel, unit: '%' }
                        );
                    }

                    for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                        if (!this.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                if (this.logInfo) this.emit('info', `${acBatterieName}: ${serialNumber}, ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                return value;
                            });
                    };

                    this.acbServices.push(service);
                }
            }

            //power and energy data
            if (powerAndEnergySupported) {
                this.powerAndEnergyServices = [];
                const sources = this.pv.powerAndEnergy.sources;
                for (const source of sources) {
                    const measurementType = source.measurementType;
                    const key = MetersKeyMap[measurementType];
                    if (this.logDebug) this.emit('debug', `Prepare Power And Energy ${measurementType} Service`);

                    const service = accessory.addService(Service.PowerAndEnergyService, `Power And Energy ${measurementType}`, `powerAndEnergyService${measurementType}`);
                    service.setCharacteristic(Characteristic.ConfiguredName, `Power And Energy ${measurementType}`);

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.Power, label: 'power', value: source.powerKw, unit: 'kW' },
                        { type: Characteristic.PowerPeak, label: 'power peak', value: source.powerPeakKw, unit: 'kW' },
                        { type: Characteristic.PowerPeakDetected, label: 'power peak detected', value: source.powerPeakDetected, postfix: source.powerPeakDetected ? 'Yes' : 'No' },
                        { type: Characteristic.EnergyToday, label: 'energy today', value: source.energyTodayKw, unit: 'kWh' },
                        { type: Characteristic.EnergyLastSevenDays, label: 'energy last seven days', value: source.energyLastSevenDaysKw, unit: 'kWh' },
                        { type: Characteristic.EnergyLifetime, label: 'energy lifetime', value: source.energyLifetimeKw, unit: 'kWh' },
                        { type: Characteristic.ReadingTime, label: 'reading time', value: source.readingTime },
                    ];

                    if (source.gridQualityState) {
                        if (measurementType !== 'Consumption Total') {
                            characteristics.push({ type: Characteristic.EnergyLifetimeUpload, label: 'energy lifetime upload', value: source.energyLifetimeUploadKw, unit: 'kW' });
                        }

                        characteristics.push(
                            { type: Characteristic.ReactivePower, label: 'reactive power', value: source.reactivePowerKw, unit: 'kVAr' },
                            { type: Characteristic.ApparentPower, label: 'apparent power', value: source.apparentPowerKw, unit: 'kVA' },
                            { type: Characteristic.Current, label: 'current', value: source.current, unit: 'A' },
                            { type: Characteristic.Voltage, label: 'voltage', value: source.voltage, unit: 'V' },
                            { type: Characteristic.Frequency, label: 'frequency', value: source.frequency, unit: 'Hz' },
                            { type: Characteristic.PwrFactor, label: 'power factor', value: source.pwrFactor, unit: 'cos ϕ' },
                        );
                    }

                    for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                        if (!this.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                if (this.logInfo) this.emit('info', `${measurementType}, ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                return value;
                            });
                    }

                    service.getCharacteristic(Characteristic.PowerPeakReset)
                        .onGet(async () => {
                            if (this.logInfo) this.emit('info', `${measurementType}, power peak reset: Off`);
                            return false;
                        })
                        .onSet(async (value) => {
                            if (!pvControl) {
                                if (this.logWarn) this.emit('warn', `System control is locked`);
                                setTimeout(() => service.updateCharacteristic(Characteristic.PowerPeakReset, !value), 250);
                                return;
                            }

                            try {
                                if (!value) {
                                    setTimeout(() => service.updateCharacteristic(Characteristic.PowerPeakReset, value), 250);
                                    return;
                                }

                                this.pv.powerAndEnergy[key].powerPeak = -100000;
                                if (this.logInfo) this.emit('info', `${measurementType}, power peak reset: Done`);
                                setTimeout(() => service.updateCharacteristic(Characteristic.PowerPeakReset, false), 250);
                            } catch (error) {
                                if (this.logWarn) this.emit('warn', `${measurementType}, Power Peak reset error: ${error}`);
                            }
                        });

                    this.powerAndEnergyServices.push(service);

                    switch (measurementType) {
                        case 'Production':
                            //power level sensors
                            if (this.powerProductionLevelActiveSensors.length > 0) {
                                if (this.logDebug) this.emit('debug', `Prepare Production Power Level Sensor Services`);
                                this.powerProductionLevelSensorServices = [];
                                for (let i = 0; i < this.powerProductionLevelActiveSensors.length; i++) {
                                    const sensor = this.powerProductionLevelActiveSensors[i];
                                    const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorService = accessory.addService(serviceType, serviceName, `powerProductionLevelSensorService${i}`);
                                    sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {

                                            const info = this.logInfo ? false : this.emit('info', `Power Level: ${measurementType}, sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.powerProductionLevelSensorServices.push(sensorService);
                                }
                            }

                            //energy level sensors
                            if (this.energyProductionLevelActiveSensors.length > 0) {
                                if (this.logDebug) this.emit('debug', `Prepare Production Energy Level Sensor Services`);
                                this.energyProductionLevelSensorServices = [];
                                for (let i = 0; i < this.energyProductionLevelActiveSensors.length; i++) {
                                    const sensor = this.energyProductionLevelActiveSensors[i];
                                    const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorService = accessory.addService(serviceType, serviceName, `energyProductionLevelSensorService${i}`);
                                    sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const info = this.logInfo ? false : this.emit('info', `Energy Level: ${measurementType}, sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.energyProductionLevelSensorServices.push(sensorService);
                                }
                            }

                            //grid quality sensors
                            if (this.gridProductionQualityActiveSensors.length > 0 && source.gridQualityState) {
                                if (this.logDebug) this.emit('debug', `Prepare Grid Quality Sensor Services`);
                                this.gridProductionQualityActiveSensorServices = [];
                                for (let i = 0; i < this.gridProductionQualityActiveSensors.length; i++) {
                                    const sensor = this.gridProductionQualityActiveSensors[i];
                                    const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorService = accessory.addService(serviceType, serviceName, `gridProductionQualityActiveSensorService${i}`);
                                    sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const info = this.logInfo ? false : this.emit('info', `Grid Quality: ${measurementType}, sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.gridProductionQualityActiveSensorServices.push(sensorService);
                                }
                            }
                            break;
                        case 'Consumption Net':
                            //power level sensors 
                            if (this.powerConsumptionNetLevelActiveSensors.length > 0) {
                                if (this.logDebug) this.emit('debug', `Prepare ${measurementType} Power Level Sensor Services`);
                                this.powerConsumptionNetLevelSensorServices = [];
                                for (let i = 0; i < this.powerConsumptionNetLevelActiveSensors.length; i++) {
                                    const sensor = this.powerConsumptionNetLevelActiveSensors[i];
                                    const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorService = accessory.addService(serviceType, serviceName, `powerConsumptionNetLevelSensorService${i}`);
                                    sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const info = this.logInfo ? false : this.emit('info', `Power Level: ${measurementType}, sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.powerConsumptionNetLevelSensorServices.push(sensorService);
                                }
                            }

                            //energy level sensors 
                            if (this.energyConsumptionNetLevelActiveSensors.length > 0) {
                                if (this.logDebug) this.emit('debug', `Prepare ${measurementType} Energy Level Sensor Services`);
                                this.energyConsumptionNetLevelSensorServices = [];
                                for (let i = 0; i < this.energyConsumptionNetLevelActiveSensors.length; i++) {
                                    const sensor = this.energyConsumptionNetLevelActiveSensors[i];
                                    const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorServicee = accessory.addService(serviceType, serviceName, `energyConsumptionNetLevelSensorService${i}`);
                                    sensorServicee.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorServicee.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorServicee.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const info = this.logInfo ? false : this.emit('info', `Energy Level: ${measurementType}, sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.energyConsumptionNetLevelSensorServices.push(sensorServicee);
                                }
                            }

                            //grid quality sensors
                            if (this.gridConsumptionNetQualityActiveSensors.length > 0) {
                                if (this.logDebug) this.emit('debug', `Prepare Grid Quality Sensor Services`);
                                this.gridConsumptionNetQualityActiveSensorServices = [];
                                for (let i = 0; i < this.gridConsumptionNetQualityActiveSensors.length; i++) {
                                    const sensor = this.gridConsumptionNetQualityActiveSensors[i];
                                    const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorServicee = accessory.addService(serviceType, serviceName, `gridConsumptionNetQualityActiveSensorService${i}`);
                                    sensorServicee.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorServicee.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorServicee.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const info = this.logInfo ? false : this.emit('info', `Grid Quality: ${measurementType}, sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.gridConsumptionNetQualityActiveSensorServices.push(sensorServicee);
                                }
                            }
                            break;
                        case 'Consumption Total':
                            //power level sensors 
                            if (this.powerConsumptionTotalLevelActiveSensors.length > 0) {
                                if (this.logDebug) this.emit('debug', `Prepare ${measurementType} Power Level Sensor Services`);
                                this.powerConsumptionTotalLevelSensorServices = [];
                                for (let i = 0; i < this.powerConsumptionTotalLevelActiveSensors.length; i++) {
                                    const sensor = this.powerConsumptionTotalLevelActiveSensors[i];
                                    const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorServicee = accessory.addService(serviceType, serviceName, `powerConsumptionTotalLevelSensorService${i}`);
                                    sensorServicee.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorServicee.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorServicee.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const info = this.logInfo ? false : this.emit('info', `Power Level: ${measurementType}, sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.powerConsumptionTotalLevelSensorServices.push(sensorServicee);
                                }
                            }

                            //energy level sensors 
                            if (this.energyConsumptionTotalLevelActiveSensors.length > 0) {
                                if (this.logDebug) this.emit('debug', `Prepare ${measurementType} Energy Level Sensor Services`);
                                this.energyConsumptionTotalLevelSensorServices = [];
                                for (let i = 0; i < this.energyConsumptionTotalLevelActiveSensors.length; i++) {
                                    const sensor = this.energyConsumptionTotalLevelActiveSensors[i];
                                    const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorServicee = accessory.addService(serviceType, serviceName, `energyConsumptionTotalLevelSensorService${i}`);
                                    sensorServicee.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorServicee.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorServicee.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const info = this.logInfo ? false : this.emit('info', `Energy Level: ${measurementType}, sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.energyConsumptionTotalLevelSensorServices.push(sensorServicee);
                                }
                            }

                            //grid quality sensors
                            if (this.gridConsumptionTotalQualityActiveSensors.length > 0) {
                                if (this.logDebug) this.emit('debug', `Prepare Grid Quality Sensor Services`);
                                this.gridConsumptionTotalQualityActiveSensorServices = [];
                                for (let i = 0; i < this.gridConsumptionTotalQualityActiveSensors.length; i++) {
                                    const sensor = this.gridConsumptionTotalQualityActiveSensors[i];
                                    const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorServicee = accessory.addService(serviceType, serviceName, `gridConsumptionTotalQualityActiveSensorService${i}`);
                                    sensorServicee.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorServicee.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorServicee.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const info = this.logInfo ? false : this.emit('info', `Grid Quality: ${measurementType}, sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.gridConsumptionTotalQualityActiveSensorServices.push(sensorServicee);
                                }
                            }
                            break;
                    }
                }
            }

            //ensemble data
            if (ensemblesSupported) {

                //summary
                if (ensemblesCountersSupported || ensemblesSecCtrlSupported) {
                    const secctrl = this.pv.inventory.esubs.secctrl;
                    const counters = this.pv.inventory.esubs.counters;

                    if (this.logDebug) this.emit('debug', `Prepare Ensemble Summary Service`);

                    const serviceName = 'Ensemble Summary';
                    const service = accessory.addService(Service.EnsembleSummaryService, serviceName, 'ensembleSummaryService');
                    service.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                    // Create characteristics
                    const characteristics = [];
                    if (ensemblesSecCtrlSupported) {
                        characteristics.push(
                            { type: Characteristic.AggSoc, label: 'agg SoC', value: secctrl.aggSoc, unit: '%' },
                            { type: Characteristic.AggMaxEnergy, label: 'agg max energy', value: secctrl.aggMaxEnergyKw, unit: 'kWh' },
                            { type: Characteristic.EncAggSoc, label: `${enchargeName} agg SoC`, value: secctrl.encAggSoc, unit: '%' },
                            { type: Characteristic.EncAggBackupEnergy, label: `${enchargeName} agg backup energy`, value: secctrl.encAggBackupEnergy, unit: 'kWh' },
                            { type: Characteristic.EncAggAvailEnergy, label: `${enchargeName} agg available energy`, value: secctrl.encAggAvailEnergy, unit: 'kWh' },
                            { type: Characteristic.ConfiguredBackupSoc, label: `configured backup SoC`, value: secctrl.configuredBackupSoc, unit: '%' },
                            { type: Characteristic.AdjustedBackupSoc, label: `adjusted backup SoC`, value: secctrl.adjustedBackupSoc, unit: '%' },
                        );

                        if (secctrl.phaseA) {
                            characteristics.push(
                                { type: Characteristic.FrequencyBiasHz, label: 'L1 bias frequency', value: secctrl.freqBiasHz, unit: 'Hz' },
                                { type: Characteristic.VoltageBiasV, label: 'L1 bias voltage', value: secctrl.voltageBiasV, unit: 'V' },
                                { type: Characteristic.FrequencyBiasHzQ8, label: 'L1 bias q8 frequency', value: secctrl.freqBiasHzQ8, unit: 'Hz' },
                                { type: Characteristic.VoltageBiasVQ5, label: 'L1 bias q5 voltage', value: secctrl.voltageBiasVQ5, unit: 'V' }
                            );
                        }

                        if (secctrl.phaseB) {
                            characteristics.push(
                                { type: Characteristic.FrequencyBiasHzPhaseB, label: 'L2 bias frequency', value: secctrl.freqBiasHzPhaseB, unit: 'Hz' },
                                { type: Characteristic.VoltageBiasVPhaseB, label: 'L2 bias voltage', value: secctrl.voltageBiasVPhaseB, unit: 'V' },
                                { type: Characteristic.FrequencyBiasHzQ8PhaseB, label: 'L2 bias q8 frequency', value: secctrl.freqBiasHzQ8PhaseB, unit: 'Hz' },
                                { type: Characteristic.VoltageBiasVQ5PhaseB, label: 'L2 bias q5 voltage', value: secctrl.voltageBiasVQ5PhaseB, unit: 'V' }
                            );
                        }

                        if (secctrl.phaseC) {
                            characteristics.push(
                                { type: Characteristic.FrequencyBiasHzPhaseC, label: 'L3 bias frequency', value: secctrl.freqBiasHzPhaseC, unit: 'Hz' },
                                { type: Characteristic.VoltageBiasVPhaseC, label: 'L3 bias voltage', value: secctrl.voltageBiasVPhaseC, unit: 'V' },
                                { type: Characteristic.FrequencyBiasHzQ8PhaseC, label: 'L3 bias q8 frequency', value: secctrl.freqBiasHzQ8PhaseC, unit: 'Hz' },
                                { type: Characteristic.VoltageBiasVQ5PhaseC, label: 'L3 bias q5 voltage', value: secctrl.voltageBiasVQ5PhaseC, unit: 'V' }
                            );
                        }
                    }

                    if (ensemblesCountersSupported) {
                        characteristics.push({ type: Characteristic.RestPower, label: 'rest power', value: counters.restPowerKw, unit: 'kW' });
                    }

                    if (enchargesStatusSupported) {
                        characteristics.push({ type: Characteristic.RatedPower, label: 'rated power', value: this.pv.inventory.esubs.ratedPowerSumKw, unit: 'kW' });
                    }

                    if (enchargesPowerSupported) {
                        characteristics.push({ type: Characteristic.RealPower, label: 'real power', value: this.pv.inventory.esubs.realPowerSumKw, unit: 'kW' });
                    }

                    for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                        if (!this.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                if (this.logInfo) this.emit('info', `Ensemble Summary, ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                return value;
                            });
                    }

                    this.ensembleSummaryService = service;
                }

                //devices
                if (ensemblesInstalled) {
                    this.ensembleServices = [];

                    for (const ensemble of this.pv.inventory.esubs.devices) {
                        const serialNumber = ensemblesInstalled ? ensemble.serialNumber : ensemble.status.deviceType;
                        if (this.logDebug) this.emit('debug', `Prepare Ensemble ${serialNumber} Service`);

                        const service = accessory.addService(Service.EnsembleService, 'Ensemble', `ensembleService${serialNumber}`);
                        service.setCharacteristic(Characteristic.ConfiguredName, 'Ensemble');

                        // Create characteristics
                        const characteristics = [];
                        if (ensemblesInstalled) {
                            characteristics.push(
                                { type: Characteristic.Status, label: 'status', value: ensemble.deviceStatus },
                                { type: Characteristic.Communicating, label: 'communicating', value: ensemble.communicating, postfix: ensemble.communicating ? 'Yes' : 'No' },
                                { type: Characteristic.Operating, label: 'operating', value: ensemble.operating, postfix: ensemble.operating ? 'Yes' : 'No' },
                                { type: Characteristic.GfiClear, label: 'gfi clear', value: ensemble.deviceControl, postfix: ensemble.deviceControl ? 'Yes' : 'No' },
                                { type: Characteristic.Firmware, label: 'firmware', value: ensemble.firmware },
                                { type: Characteristic.ReadingTime, label: 'reading time', value: ensemble.readingTime }
                            );
                        }

                        if (ensemblesStatusSupported && ensemble.status) {
                            characteristics.push(
                                { type: Characteristic.CommInterface, label: 'comm interface', value: ensemble.status.commInterfaceStr },
                                { type: Characteristic.AdminState, label: 'admin state', value: ensemble.status.adminStateStr }
                            );
                        }

                        for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                            if (!this.isValidValue(value)) continue;

                            service.getCharacteristic(type)
                                .onGet(async () => {
                                    if (this.logInfo) this.emit('info', `Ensemble: ${serialNumber}, ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                    return value;
                                });
                        }

                        this.ensembleServices.push(service);
                    }
                }

                //grid sensors by relay
                if (ensemblesRelaySupported) {
                    //solar grid state sensor
                    if (this.solarGridStateActiveSensor) {
                        if (this.logDebug) this.emit('debug', `Prepare Solar Grid State Sensor Service`);
                        const serialNumber = this.pv.info.serialNumber;
                        const sensor = this.solarGridStateActiveSensor;
                        const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                        const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                        const sensorService = accessory.addService(serviceType, serviceName, `solarGridStateSensorService`);
                        sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        sensorService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                if (this.logInfo) this.emit('info', `solar: ${serialNumber}, grid state sensor: ${serviceName}, state: ${state ? 'Grid ON' : 'Grid Off'}`);
                                return state;
                            });
                        this.solarGridStateSensorService = sensorService;
                    }

                    //solar grid mode sensor services
                    if (this.solarGridModeActiveSensors.length > 0) {
                        if (this.logDebug) this.emit('debug', `Prepare Solar Grid Mode Sensor Services`);

                        this.solarGridModeSensorServices = [];
                        for (let i = 0; i < this.solarGridModeActiveSensors.length; i++) {
                            const sensor = this.solarGridModeActiveSensors[i];
                            const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                            const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                            const sensorService = accessory.addService(serviceType, serviceName, `solarGridModeSensorService${i}`);
                            sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            sensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    if (this.logInfo) this.emit('info', `Solar grid mode sensor: ${serviceName}, state: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });

                            this.solarGridModeSensorServices.push(sensorService);
                        }
                    }
                }

                //encharges
                if (enchargesInstalled) {

                    //backup level and state summary control
                    if (this.enchargeBackupLevelSummaryActiveAccessory) {
                        if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} Backup Level Summary Service`);

                        const accessoryTile = this.enchargeBackupLevelSummaryActiveAccessory;
                        const { namePrefix, name, serviceType, characteristicType, characteristicType1, state, backupLevel } = accessoryTile;
                        const serviceName = namePrefix ? `${accessoryName} ${enchargeName}` : enchargeName;

                        const accessoryService = accessory.addService(serviceType, serviceName, `enchargeSummaryLevelAndStateService`);
                        accessoryService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        accessoryService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        accessoryService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                if (this.logInfo) this.emit('info', `${enchargeName} state: ${state ? 'Charged' : 'Discharged'}`);
                                return state;
                            })
                            .onSet(async (value) => {
                                if (!pvControl) {
                                    if (this.logWarn) this.emit('warn', `System control is locked`);
                                    setTimeout(() => accessoryService.updateCharacteristic(characteristicType, !value), 250);
                                    return;
                                }

                                try {
                                    // Your set handler logic here (if any)
                                } catch (error) {
                                    if (this.logWarn) this.emit('warn', `${enchargeName}, Set state error: ${error}`);
                                }
                            });
                        accessoryService.getCharacteristic(characteristicType1)
                            .onGet(async () => {
                                const value = backupLevel;
                                if (this.logInfo) this.emit('info', `${enchargeName} backup level: ${value} %`);
                                return value;
                            })
                            .onSet(async (value) => {
                                if (!pvControl) {
                                    if (this.logWarn) this.emit('warn', `System control is locked`);
                                    setTimeout(() => accessoryService.updateCharacteristic(characteristicType1, backupLevel), 250);
                                    return;
                                }

                                try {
                                    // Your set handler logic here (if any)
                                } catch (error) {
                                    if (this.logWarn) this.emit('warn', `${enchargeName}, Set backup level error: ${error}`);
                                }
                            });

                        this.enchargeSummaryLevelAndStateService = accessoryService;
                    }

                    //backup level summary sensors
                    if (this.enchargeBackupLevelSummaryActiveSensors.length > 0) {
                        if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} Backup Level Sensor Services`);

                        this.enchargeBackupLevelSensorServices = [];
                        for (let i = 0; i < this.enchargeBackupLevelSummaryActiveSensors.length; i++) {
                            const sensor = this.enchargeBackupLevelSummaryActiveSensors[i];
                            const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                            const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                            const sensorService = accessory.addService(serviceType, serviceName, `enchargeBackupLevelSensorService${i}`);
                            sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            sensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    if (this.logInfo) this.emit('info', `${enchargeName} Backup Level sensor: ${serviceName}, state: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });

                            this.enchargeBackupLevelSensorServices.push(sensorService);
                        }
                    }

                    //devices
                    this.enchargeServices = [];
                    this.enchargeLevelAndStateServices = [];

                    for (const encharge of this.pv.inventory.esubs.encharges.devices) {
                        const serialNumber = encharge.serialNumber;

                        // Backup level and state (individual)
                        if (this.enchargeBackupLevelActiveAccessory) {
                            if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} ${serialNumber} Backup Level Service`);

                            const accessoryTile = this.enchargeBackupLevelActiveAccessory;
                            const { namePrefix, serviceType, characteristicType, characteristicType1, characteristicType2, minSoc } = accessoryTile;
                            const serviceName = namePrefix ? `${accessoryName} ${enchargeName}` : enchargeName;

                            const accessoryService = accessory.addService(serviceType, serviceName, `enchargeLevelAndStateService${serialNumber}`);
                            accessoryService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            accessoryService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            accessoryService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const isLow = encharge.percentFull < minSoc;
                                    if (this.logInfo) this.emit('info', `${enchargeName} ${serialNumber}, backup level state: ${isLow ? 'Low' : 'Normal'}`);
                                    return isLow;
                                })
                                .onSet(async (value) => {
                                    if (!pvControl) {
                                        if (this.logWarn) this.emit('warn', `System control is locked`);
                                        setTimeout(() => accessoryService.updateCharacteristic(characteristicType, !value), 250);
                                        return;
                                    }
                                    // Add actual control logic here if needed
                                });
                            accessoryService.getCharacteristic(characteristicType1)
                                .onGet(async () => {
                                    const value = encharge.percentFull;
                                    if (this.logInfo) this.emit('info', `${enchargeName} ${serialNumber}, backup level: ${value} %`);
                                    return value;
                                })
                                .onSet(async (value) => {
                                    if (!pvControl) {
                                        if (this.logWarn) this.emit('warn', `System control is locked`);
                                        setTimeout(() => accessoryService.updateCharacteristic(characteristicType1, encharge.percentFull), 250);
                                        return;
                                    }
                                    // Add actual control logic here if needed
                                });
                            accessoryService.getCharacteristic(characteristicType2)
                                .onGet(async () => {
                                    const state = encharge.chargeStateNum;
                                    if (this.logInfo) this.emit('info', `${enchargeName} ${serialNumber}, state: ${state === 0 ? 'Discharging' : state === 1 ? 'Charging' : 'Ready'}`);
                                    return state;
                                });

                            this.enchargeLevelAndStateServices.push(accessoryService);
                        }

                        if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} ${serialNumber} Service`);

                        const service = accessory.addService(Service.EnchargeService, `${enchargeName} ${serialNumber}`, `enchargeService${serialNumber}`);
                        service.setCharacteristic(Characteristic.ConfiguredName, `${enchargeName} ${serialNumber}`);

                        // Create characteristics
                        const characteristics = [
                            { type: Characteristic.ChargeState, label: 'charge state', value: encharge.chargeState },
                            { type: Characteristic.AdminState, label: 'admin state', value: encharge.adminStateStr },
                            { type: Characteristic.Communicating, label: 'communicating', value: encharge.communicating, postfix: encharge.communicating ? 'Yes' : 'No' },
                            { type: Characteristic.CommLevelSubGhz, label: 'sub GHz level', value: encharge.commLevelSubGhz, unit: '%' },
                            { type: Characteristic.CommLevel24Ghz, label: '2.4GHz level', value: encharge.commLevel24Ghz, unit: '%' },
                            { type: Characteristic.SleepEnabled, label: 'sleep', value: encharge.sleepEnabled, postfix: encharge.sleepEnabled ? 'Yes' : 'No' },
                            { type: Characteristic.PercentFull, label: 'percent full', value: encharge.percentFull, unit: '%' },
                            { type: Characteristic.Temperature, label: 'temperature', value: encharge.temperature, unit: '°C' },
                            { type: Characteristic.MaxCellTemp, label: 'max cell temperature', value: encharge.maxCellTemp, unit: '°C' },
                            { type: Characteristic.LedStatus, label: 'LED status', value: encharge.ledStatus },
                            { type: Characteristic.Capacity, label: 'capacity', value: encharge.capacity, unit: 'kWh' },
                            { type: Characteristic.DcSwitchOff, label: 'dc switch', value: encharge.dcSwitchOff, postfix: encharge.dcSwitchOff ? 'Off' : 'On' },
                            { type: Characteristic.Revision, label: 'revision', value: encharge.rev },
                            { type: Characteristic.ReadingTime, label: 'reading time', value: encharge.readingTime },
                        ];

                        if (gridProfileSupported) {
                            characteristics.push(
                                { type: Characteristic.GridProfile, label: 'grid profile', value: encharge.gridProfile }
                            );
                        }

                        if (enchargesStatusSupported && encharge.status) {
                            characteristics.push(
                                { type: Characteristic.CommInterface, label: 'comm interface', value: encharge.status.commInterfaceStr },
                                { type: Characteristic.RatedPower, label: 'rated power', value: encharge.status.ratedPowerKw, unit: 'kW' }
                            );
                        }

                        if (enchargesPowerSupported && encharge.power) {
                            characteristics.push({ type: Characteristic.RealPower, label: 'real power', value: encharge.power.realPowerKw, unit: 'kW' });
                        }

                        for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                            if (!this.isValidValue(value)) continue;

                            service.getCharacteristic(type)
                                .onGet(async () => {
                                    if (this.logInfo) this.emit('info', `${enchargeName}: ${serialNumber}, ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                    return value;
                                });
                        }

                        this.enchargeServices.push(service);
                    }

                    //state sensor by settings
                    if (enchargesSettingsSupported) {
                        if (this.enchargeStateActiveSensor) {
                            if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} State Sensor Service`);

                            const sensor = this.enchargeStateActiveSensor;
                            const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                            const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                            const sensorService = accessory.addService(serviceType, serviceName, `enchargeStateSensorService`);
                            sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            sensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    if (this.logInfo) this.emit('info', `${enchargeName} state sensor: ${serviceName}, state: ${state ? 'Active' : 'Not Active'}`);
                                    return state;
                                });

                            this.enchargeStateSensorService = sensorService;
                        }
                    }

                    //profile controls and sensors by tariff
                    if (enchargesTariffSupported) {
                        //controls
                        if (this.enchargeProfileActiveControls.length > 0) {
                            if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} Profile Control Services`);

                            const enchargeSettings = this.pv.inventory.esubs.encharges.tariff.storageSettings;
                            this.enchargeProfileControlsServices = [];

                            for (let i = 0; i < this.enchargeProfileActiveControls.length; i++) {
                                const control = this.enchargeProfileActiveControls[i];
                                const { profile, namePrefix, name, serviceType, characteristicType, chargeFromGrid, state } = control;
                                const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                                const controlService = accessory.addService(serviceType, serviceName, `enchargeProfileControlService${i}`);
                                controlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                controlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                controlService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        if (this.logInfo) this.emit('info', `${enchargeName} profile: ${name}, state: ${state ? 'ON' : 'OFF'}`);
                                        return state;
                                    })
                                    .onSet(async (value) => {
                                        if (!pvControl) {
                                            if (this.logWarn) this.emit('warn', `System control is locked`);
                                            setTimeout(() => controlService.updateCharacteristic(characteristicType, !value), 250);
                                            return;
                                        }

                                        try {
                                            const tokenValid = await this.checkToken();
                                            if (!tokenValid || !value) {
                                                setTimeout(() => controlService.updateCharacteristic(characteristicType, !value), 250);
                                                return;
                                            }

                                            await this.setEnchargeProfile(profile, enchargeSettings.reservedSoc, chargeFromGrid);
                                            if (this.logDebug) this.emit('debug', `${enchargeName} set profile: ${name}, charge from grid: ${chargeFromGrid ? 'ON' : 'OFF'}`);
                                        } catch (error) {
                                            if (this.logWarn) this.emit('warn', `${enchargeName} set profile: ${profile}, error: ${error}`);
                                        }
                                    });

                                if (profile !== 'backup') {
                                    const reservedSoc = enchargeSettings.reservedSoc;
                                    controlService.getCharacteristic(Characteristic.Brightness)
                                        .onGet(async () => {
                                            const value = reservedSoc;
                                            if (this.logInfo) this.emit('info', `${enchargeName} profile: ${name}, reserved soc: ${value} %`);
                                            return value;
                                        })
                                        .onSet(async (value) => {
                                            if (!pvControl) {
                                                if (this.logWarn) this.emit('warn', `System control is locked`);
                                                setTimeout(() => controlService.updateCharacteristic(Characteristic.Brightness, reservedSoc), 250);
                                                return;
                                            }

                                            if (value === 0 || value === 100) {
                                                if (this.logWarn) this.emit('warn', `reserved soc: ${value} out of range`);
                                                setTimeout(() => controlService.updateCharacteristic(Characteristic.Brightness, reservedSoc), 250);
                                                return;
                                            }

                                            try {
                                                const tokenValid = await this.checkToken();
                                                if (!tokenValid) {
                                                    setTimeout(() => controlService.updateCharacteristic(Characteristic.Brightness, reservedSoc), 250);
                                                    return;
                                                }

                                                await this.setEnchargeProfile(profile, value, chargeFromGrid);
                                                if (this.logDebug) this.emit('debug', `${enchargeName} set profile: ${name}, reserved soc: ${value} %`);
                                            } catch (error) {
                                                if (this.logWarn) this.emit('warn', `${enchargeName} set profile: ${profile} reserve, error: ${error}`);
                                            }
                                        });
                                }

                                this.enchargeProfileControlsServices.push(controlService);
                            }
                        }

                        //sensors
                        if (this.enchargeProfileActiveSensors.length > 0) {
                            if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} Profile Sensor Services`);

                            this.enchargeProfileSensorsServices = [];

                            for (let i = 0; i < this.enchargeProfileActiveSensors.length; i++) {
                                const sensor = this.enchargeProfileActiveSensors[i];
                                const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                                const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                                const service = accessory.addService(serviceType, serviceName, `enchargeProfileSensorService${i}`);
                                service.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                service.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                                service.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        if (this.logInfo) this.emit('info', `${enchargeName} profile: ${name}, state: ${state ? 'Active' : 'Not Active'}`);
                                        return state;
                                    });

                                this.enchargeProfileSensorsServices.push(service);
                            }
                        }
                    }

                    //grid sensors by relay
                    if (ensemblesRelaySupported) {
                        //encharge grid state sensor
                        if (this.enchargeGridStateActiveSensor) {
                            if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} Grid State Sensor Service`);

                            const sensor = enchargeGridStateActiveSensor;
                            const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                            const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                            const sensorService = accessory.addService(serviceType, serviceName, 'enchargeGridStateSensorService');
                            sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            sensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    if (this.logInfo) this.emit('info', `${enchargeName}, grid state sensor: ${serviceName}, state: ${state ? 'Grid ON' : 'Grid Off'}`);
                                    return state;
                                });

                            this.enchargeGridStateSensorService = sensorService;
                        }

                        //encharge grid mode sensor services
                        if (this.enchargeGridModeActiveSensors.length > 0) {
                            if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} Grid Mode Sensor Services`);
                            this.enchargeGridModeSensorServices = [];

                            for (let i = 0; i < this.enchargeGridModeActiveSensors.length; i++) {
                                const sensor = this.enchargeGridModeActiveSensors[i];
                                const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                                const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                                const sensorService = accessory.addService(serviceType, serviceName, `enchargeGridModeSensorService${i}`);
                                sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                sensorService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        if (this.logInfo) this.emit('info', `${enchargeName} grid mode sensor: ${serviceName}, state: ${state ? 'Active' : 'Not active'}`);
                                        return state
                                    });

                                this.enchargeGridModeSensorServices.push(sensorService);
                            }
                        }
                    }
                }

                //enpowers
                if (enpowersInstalled) {
                    this.enpowerServices = [];
                    this.enpowerDryContactControlServices = [];
                    this.enpowerDryContactSensorServices = [];
                    this.enpowerGridStateControlServices = [];
                    this.enpowerGridStateSensorServices = [];
                    this.enpowerGridModeSensorServices = [];

                    //devices
                    for (const enpower of this.pv.inventory.esubs.enpowers) {
                        const serialNumber = enpower.serialNumber;

                        if (this.logDebug) this.emit('debug', `Prepare Enpower ${serialNumber} Service`);

                        const serviceName = `Enpower ${serialNumber}`;
                        const service = accessory.addService(Service.EnpowerService, serviceName, `enpowerService${serialNumber}`);
                        service.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                        // Create characteristics
                        const characteristics = [
                            { type: Characteristic.AdminState, label: 'admin state', value: enpower.adminStateStr },
                            { type: Characteristic.Communicating, label: 'communicating', value: enpower.communicating, postfix: enpower.communicating ? 'Yes' : 'No' },
                            { type: Characteristic.CommLevelSubGhz, label: 'sub GHz level', value: enpower.commLevelSubGhz, unit: '%' },
                            { type: Characteristic.CommLevel24Ghz, label: '2.4GHz level', value: enpower.commLevel24Ghz, unit: '%' },
                            { type: Characteristic.Temperature, label: 'temperature', value: enpower.temperature, unit: '°C' },
                            { type: Characteristic.OperatingState, label: 'mains operating state', value: enpower.mainsOperState },
                            { type: Characteristic.GridMode, label: 'grid mode', value: enpower.enpwrGridModeTranslated },
                            { type: Characteristic.EnchgGridMode, label: 'encharge grid mode', value: enpower.enchgGridModeTranslated },
                            { type: Characteristic.Status, label: 'status', value: enpower.deviceStatus },
                            { type: Characteristic.ReadingTime, label: 'reading time', value: enpower.readingTime },
                        ];

                        if (gridProfileSupported) {
                            characteristics.push({ type: Characteristic.GridProfile, label: 'grid profile', value: enpower.gridProfile });
                        }

                        if (enpowersStatusSupported && enpower.status) {
                            characteristics.push({ type: Characteristic.CommInterface, label: 'comm interface', value: enpower.status.commInterfaceStr });
                        }

                        for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                            if (!this.isValidValue(value)) continue;

                            service.getCharacteristic(type)
                                .onGet(async () => {
                                    if (this.logInfo) this.emit('info', `Enpower: ${serialNumber}, ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                    return value;
                                });
                        }

                        this.enpowerServices.push(service);

                        // Dry Contact Controls
                        if (enpowersDryContactsInstalled && this.enpowerDryContactsControl) {
                            if (this.logDebug) this.emit('debug', `Prepare Enpower ${serialNumber} Dry Contact Control Services`);
                            const enpowerDryContactControlServices = [];

                            enpower.dryContacts.forEach((contact, i) => {
                                const controlId = contact.settings.id;
                                const serviceName = contact.settings.loadName;
                                const contactState = contact.stateBool;

                                const controlService = accessory.addService(Service.Switch, serviceName, `dryContactControlService${serialNumber}${i}`);
                                controlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                controlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                                controlService.getCharacteristic(Characteristic.On)
                                    .onGet(async () => {
                                        const state = contactState;
                                        if (this.logInfo) this.emit('info', `Enpower: ${serialNumber}, grid state control: ${serviceName}, state: ${state ? 'ON' : 'OFF'}`);
                                        return state;
                                    })
                                    .onSet(async (value) => {
                                        if (!pvControl) {
                                            if (this.logWarn) this.emit('warn', `System control is locked`);
                                            setTimeout(() => controlService.updateCharacteristic(Characteristic.On, !value), 250);
                                            return;
                                        }

                                        try {
                                            const tokenValid = await this.checkToken();
                                            if (!tokenValid) {
                                                setTimeout(() => controlService.updateCharacteristic(Characteristic.On, !value), 250);
                                                return;
                                            }

                                            await this.setDryContactState(controlId, value);
                                            if (this.logInfo) this.emit('info', `Set Enpower: ${serialNumber}, grid state control: ${serviceName}, state: ${value ? 'Manual' : 'Soc'}`);
                                        } catch (error) {
                                            if (this.logWarn) this.emit('warn', `Set ${serviceName}, grid state control: ${serviceName}, error: ${error}`);
                                        }
                                    });

                                enpowerDryContactControlServices.push(controlService);
                            });
                            this.enpowerDryContactControlServices.push(enpowerDryContactControlServices);
                        }

                        // Dry Contact Sensors
                        if (enpowersDryContactsInstalled && this.enpowerDryContactsSensor) {
                            if (this.logDebug) this.emit('debug', `Prepare Enpower ${serialNumber} Dry Contact Sensor Services`);
                            const enpowerDryContactSensorServices = [];

                            enpower.dryContacts.forEach((contact, i) => {
                                const serviceName = contact.settings.loadName;

                                const sensorService = accessory.addService(Service.ContactSensor, serviceName, `dryContactSensorService${serialNumber}${i}`);
                                sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                                sensorService.getCharacteristic(Characteristic.ContactSensorState)
                                    .onGet(async () => {
                                        const state = contact.stateBool;
                                        if (this.logInfo) this.emit('info', `Enpower: ${serialNumber}, dry contact: ${serviceName}, sensor state: ${state ? 'Active' : 'Not Active'}`);
                                        return state;
                                    });

                                enpowerDryContactSensorServices.push(sensorService);
                            });
                            this.enpowerDryContactSensorServices.push(enpowerDryContactSensorServices);
                        }

                        // Grid state control
                        if (this.enpowerGridStateActiveControl) {
                            if (this.logDebug) this.emit('debug', `Prepare Enpower ${serialNumber} Grid State Control Service`);

                            const control = this.enpowerGridStateActiveControl;
                            const serviceName = control.namePrefix ? `${accessoryName} ${control.name}` : control.name;
                            const serviceType = control.serviceType;
                            const characteristicType = control.characteristicType;

                            const controlService = accessory.addService(serviceType, serviceName, `enpowerGridStateControlService${serialNumber}`);
                            controlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            controlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                            controlService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = control.state;
                                    if (this.logInfo) this.emit('info', `Enpower: ${serialNumber}, dry contact control: ${serviceName}, state: ${state ? 'Grid ON' : 'Grid OFF'}`);
                                    return state;
                                })
                                .onSet(async (value) => {
                                    if (!pvControl) {
                                        if (this.logWarn) this.emit('warn', `System control is locked`);
                                        setTimeout(() => controlService.updateCharacteristic(characteristicType, !value), 250);
                                        return;
                                    }

                                    try {
                                        const tokenValid = await this.checkToken();
                                        if (!tokenValid) {
                                            setTimeout(() => controlService.updateCharacteristic(characteristicType, !value), 250);
                                            return;
                                        }

                                        await this.setEnpowerGridState(state);
                                        if (this.logInfo) this.emit('info', `Set Enpower: ${serialNumber}, dry contact control: ${serviceName}, state: ${value ? 'Grid ON' : 'Grid OFF'}`);
                                    } catch (error) {
                                        if (this.logWarn) this.emit('warn', `Set Enpower: ${serialNumber}, dry contact control: ${serviceName}, error: ${error}`);
                                    }
                                });

                            this.enpowerGridStateControlServices.push(controlService);
                        }

                        // Grid state sensor
                        if (this.enpowerGridStateActiveSensor) {
                            if (this.logDebug) this.emit('debug', `Prepare Enpower ${serialNumber} Grid State Sensor Service`);

                            const sensor = this.enpowerGridStateActiveSensor;
                            const serviceName = sensor.namePrefix ? `${accessoryName} ${sensor.name}` : sensor.name;
                            const serviceType = sensor.serviceType;
                            const characteristicType = sensor.characteristicType;

                            const sensorService = accessory.addService(serviceType, serviceName, `enpowerGridStateSensorService${serialNumber}`);
                            sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                            sensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = sensor.state;
                                    if (this.logInfo) this.emit('info', `Enpower: ${serialNumber}, grid state sensor: ${serviceName}, state: ${state ? 'Grid ON' : 'Grid Off'}`);
                                    return state;
                                });

                            this.enpowerGridStateSensorServices.push(sensorService);
                        }

                        // Grid mode sensors
                        if (this.enpowerGridModeActiveSensors.length > 0) {
                            if (this.logDebug) this.emit('debug', `Prepare Enpower ${serialNumber} Grid Mode Sensor Services`);
                            const enpowerGridModeSensorServices = [];

                            for (let i = 0; i < this.enpowerGridModeActiveSensors.length; i++) {
                                const sensor = this.enpowerGridModeActiveSensors[i];
                                const serviceName = sensor.namePrefix ? `${accessoryName} ${sensor.name}` : sensor.name;
                                const serviceType = sensor.serviceType;
                                const characteristicType = sensor.characteristicType;

                                const sensorService = accessory.addService(serviceType, serviceName, `enpowerGridModeSensorService${serialNumber}${i}`);
                                sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                                sensorService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const state = sensor.state;
                                        if (this.logInfo) this.emit('info', `Enpower: ${serialNumber}, grid mode sensor: ${serviceName}, state: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });

                                enpowerGridModeSensorServices.push(sensorService);
                            }
                            this.enpowerGridModeSensorServices.push(enpowerGridModeSensorServices);
                        }
                    }
                }

                //collars
                if (collarsInstalled) {
                    this.collarServices = [];

                    for (const collar of this.pv.inventory.esubs.collars) {
                        const serialNumber = collar.serialNumber;
                        if (this.logDebug) this.emit('debug', `Prepare Collar ${serialNumber} Service`);

                        const serviceName = `Collar ${serialNumber}`;
                        const service = accessory.addService(Service.CollarService, serviceName, `collarService${serialNumber}`);
                        service.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                        // Create characteristics
                        const characteristics = [
                            { type: Characteristic.AdminState, label: 'admin state', value: collar.adminStateStr },
                            { type: Characteristic.Status, label: 'status', value: collar.deviceStatus },
                            { type: Characteristic.MidState, label: 'mid state', value: collar.midState },
                            { type: Characteristic.GridState, label: 'mid state', value: collar.gridState },
                            { type: Characteristic.Communicating, label: 'communicating', value: collar.communicating, postfix: collar.communicating ? 'Yes' : 'No' },
                            { type: Characteristic.Temperature, label: 'temperature', value: collar.temperature, unit: '°C' },
                            { type: Characteristic.ReadingTime, label: 'reading time', value: collar.readingTime }
                        ];

                        for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                            if (!this.isValidValue(value)) continue;

                            service.getCharacteristic(type)
                                .onGet(async () => {
                                    if (this.logInfo) this.emit('info', `Collar: ${serialNumber}, ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                    return value;
                                });
                        }

                        this.collarServices.push(service);
                    }
                }

                //c6 combiner controllers
                if (c6CombinerControllersInstalled) {
                    this.c6CombinerControllerServices = [];

                    for (const c6CombinerController of this.pv.inventory.esubs.c6CombinerControllers) {
                        const serialNumber = c6CombinerController.serialNumber;
                        if (this.logDebug) this.emit('debug', `Prepare C6 Combiner Controller ${serialNumber} Service`);

                        const serviceName = `C6 Combiner Controller ${serialNumber}`;
                        const service = accessory.addService(Service.C6CombinerControlerService, serviceName, `c6CombinerControllerService${serialNumber}`);
                        service.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                        // Create characteristics
                        const characteristics = [
                            { type: Characteristic.AdminState, label: 'admin state', value: c6CombinerController.adminStateStr },
                            { type: Characteristic.Communicating, label: 'communicating', value: c6CombinerController.communicating, postfix: c6CombinerController.communicating ? 'Yes' : 'No' },
                            { type: Characteristic.Firmware, label: 'firmware', value: c6CombinerController.firmware },
                            { type: Characteristic.ReadingTime, label: 'reading time', value: c6CombinerController.readingTime }
                        ];

                        for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                            if (!this.isValidValue(value)) continue;

                            service.getCharacteristic(type)
                                .onGet(async () => {
                                    if (this.logInfo) this.emit('info', `C6 Combiner Controller: ${serialNumber}, ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                    return value;
                                });
                        }

                        this.c6CombinerControllerServices.push(service);
                    }
                }

                //c6 rgms
                if (c6RgmsInstalled) {
                    this.c6RgmServices = [];

                    for (const c6Rgm of this.pv.inventory.esubs.c6Rgms) {
                        const serialNumber = c6Rgm.serialNumber;
                        if (this.logDebug) this.emit('debug', `Prepare C6 Rgm ${serialNumber} Service`);

                        const serviceName = `C6 Rgm ${serialNumber}`;
                        const service = accessory.addService(Service.C6RgmService, serviceName, `c6RgmService${serialNumber}`);
                        service.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                        // Create characteristics
                        const characteristics = [
                            { type: Characteristic.Status, label: 'status', value: c6Rgm.deviceStatus },
                            { type: Characteristic.Firmware, label: 'firmware', value: c6Rgm.firmware },
                            { type: Characteristic.ReadingTime, label: 'reading time', value: c6Rgm.readingTime }
                        ];

                        for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                            if (!this.isValidValue(value)) continue;

                            service.getCharacteristic(type)
                                .onGet(async () => {
                                    if (this.logInfo) this.emit('info', `C6 Rgm: ${serialNumber}, ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                    return value;
                                });
                        }

                        this.c6RgmServices.push(service);
                    }
                }

                //generator
                if (generatorInstalled) {
                    const generator = this.pv.inventory.esubs.generator;
                    const generatorType = generator.type;

                    if (this.logDebug) this.emit('debug', `Prepare Generator ${type} Service`);

                    const serviceName = `Generator ${generatorType}`;
                    const service = accessory.addService(Service.GerneratorService, serviceName, `generatorService`);
                    service.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.AdminMode, label: 'admin mode', value: generator.adminMode },
                        { type: Characteristic.AdminState, label: 'admin state', value: generator.adminState },
                        { type: Characteristic.OperatingState, label: 'operation state', value: generator.operState },
                        { type: Characteristic.StartSoc, label: 'start soc', value: generator.startSoc },
                        { type: Characteristic.StopSoc, label: 'stop soc', value: generator.stopSoc },
                        { type: Characteristic.ExexOn, label: 'exec on', value: generator.excOn },
                        { type: Characteristic.Shedule, label: 'schedule', value: generator.schedule },
                        { type: Characteristic.Present, label: 'present', value: generator.present },
                        { type: Characteristic.ReadingTime, label: 'reading time', value: generator.readingTime }
                    ];

                    for (const { type, label, value, unit = '' } of characteristics) {
                        if (!this.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                if (this.logInfo) this.emit('info', `Generator: ${generatorType}, ${label}: ${value} ${unit}`);
                                return value;
                            });
                    }

                    this.generatorService = service;

                    //state control 
                    if (this.generatorStateActiveControl) {
                        if (this.logDebug) this.emit('debug', `Prepare Generator ${generatorType} Control Service`);

                        const control = this.generatorStateActiveControl;
                        const serviceName = control.namePrefix ? `${accessoryName} ${control.name}` : control.name;
                        const serviceType = control.serviceType;
                        const characteristicType = control.characteristicType;

                        const controlService = accessory.addService(serviceType, serviceName, `generatorStateControlService`);
                        controlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        controlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                        controlService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = control.state;
                                if (this.logInfo) this.emit('info', `Generator: ${generatorType}, state: ${state ? 'ON' : 'OFF'}`);
                                return state;
                            })
                            .onSet(async (value) => {
                                if (!pvControl) {
                                    if (this.logWarn) this.emit('warn', `System control is locked`);
                                    setTimeout(() => controlService.updateCharacteristic(characteristicType, !value), 250);
                                    return;
                                }

                                try {
                                    const tokenValid = await this.checkToken();
                                    if (!tokenValid) {
                                        setTimeout(() => controlService.updateCharacteristic(characteristicType, !value), 250);
                                        return;
                                    }

                                    const genMode = state ? 'on' : 'off';
                                    await this.setGeneratorMode(genMode);
                                    if (this.logInfo) this.emit('info', `Set Generator: ${generatorType}, state to: ${value ? 'ON' : 'OFF'}`);
                                } catch (error) {
                                    if (this.logWarn) this.emit('warn', `Set Generator: ${generatorType}, state error: ${error}`);
                                }
                            });

                        this.generatorStateControlService = controlService;
                    }

                    //state sensor
                    if (this.generatorStateActiveSensor) {
                        if (this.logDebug) this.emit('debug', `Prepare Generator ${type} State Sensor Service`);

                        const sensor = this.generatorStateActiveSensor;
                        const serviceName = sensor.namePrefix ? `${accessoryName} ${sensor.name}` : sensor.name;
                        const serviceType = sensor.serviceType;
                        const characteristicType = sensor.characteristicType;

                        const sensorService = accessory.addService(serviceType, serviceName, `generatorStateSensorService`);
                        sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                        sensorService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = sensor.state;
                                if (this.logInfo) this.emit('info', `Generator: ${type}, state sensor: ${serviceName}, state: ${state ? 'Grid ON' : 'Grid Off'}`);
                                return state;
                            });

                        this.generatorStateSensorService = sensorService;
                    }

                    //mode controls
                    if (this.generatorModeActiveControls.length > 0) {
                        if (this.logDebug) this.emit('debug', `Prepare Generator ${type} Mode Control Services`);

                        this.generatorModeControlServices = [];

                        for (let i = 0; i < this.generatorModeActiveControls.length; i++) {
                            const control = this.generatorModeActiveControls[i];
                            const serviceName = control.namePrefix ? `${accessoryName} ${control.name}` : control.name;
                            const serviceType = control.serviceType;
                            const characteristicType = control.characteristicType;

                            const controlService = accessory.addService(serviceType, serviceName, `generatorModeControlService${i}`);
                            controlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            controlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                            controlService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = control.state;
                                    if (this.logInfo) this.emit('info', `Generator: ${type}, mode control: ${serviceName}, state: ${state ? 'ON' : 'OFF'}`);
                                    return state;
                                })
                                .onSet(async (value) => {
                                    if (!pvControl) {
                                        if (this.logWarn) this.emit('warn', `System control is locked`);
                                        setTimeout(() => controlService.updateCharacteristic(characteristicType, !value), 250);
                                        return;
                                    }

                                    try {
                                        const tokenValid = await this.checkToken();
                                        if (!tokenValid || !value) {
                                            setTimeout(() => controlService.updateCharacteristic(characteristicType, !value), 250);
                                            return;
                                        }

                                        const genMode = control.mode;
                                        await this.setGeneratorMode(genMode);
                                        if (this.logInfo) this.emit('info', `Set Generator: ${type}, mode to: ${genMode}`);
                                    } catch (error) {
                                        if (this.logWarn) this.emit('warn', `Set Generator: ${type}, state error: ${error}`);
                                    }
                                });

                            this.generatorModeControlServices.push(controlService);
                        }
                    }

                    //mode sensors
                    if (this.generatorModeActiveSensors.length > 0) {
                        if (this.logDebug) this.emit('debug', `Prepare Generator ${type} Mode Sensor Services`);

                        this.generatorModeSensorServices = [];

                        for (let i = 0; i < this.generatorModeActiveSensors.length; i++) {
                            const sensor = this.generatorModeActiveSensors[i];
                            const serviceName = sensor.namePrefix ? `${accessoryName} ${sensor.name}` : sensor.name;
                            const serviceType = sensor.serviceType;
                            const characteristicType = sensor.characteristicType;

                            const sensorService = accessory.addService(serviceType, serviceName, `generatorModeSensorService${i}`);
                            sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                            sensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = sensor.state;
                                    if (this.logInfo) this.emit('info', `Generator: ${type}, mode sensor: ${serviceName}, state: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });

                            this.generatorModeSensorServices.push(sensorService);
                        }
                    }
                }
            }

            //live data
            if (liveDataSupported) {
                this.liveDataServices = [];

                for (const liveData of this.pv.liveData.devices) {
                    const liveDataType = liveData.type;
                    if (this.logDebug) this.emit('debug', `Prepare Live Data ${liveDataType} Service`);

                    const serviceName = `Live Data ${liveDataType}`;
                    const service = accessory.addService(Service.LiveDataService, serviceName, `liveDataService${liveDataType}`);
                    service.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                    // Create characteristics
                    const characteristics = [
                        { type: Characteristic.Power, label: 'power', value: liveData.powerKw, unit: 'kW' },
                        { type: Characteristic.PowerL1, label: 'power L1', value: liveData.powerL1Kw, unit: 'kW' },
                        { type: Characteristic.PowerL2, label: 'power L2', value: liveData.powerL2Kw, unit: 'kW' },
                        { type: Characteristic.PowerL3, label: 'power L3', value: liveData.powerL3Kw, unit: 'kW' },
                        { type: Characteristic.ApparentPower, label: 'apparent power', value: liveData.apparentPowerKw, unit: 'kVA' },
                        { type: Characteristic.ApparentPowerL1, label: 'apparent power L1', value: liveData.apparentPowerL1Kw, unit: 'kVA' },
                        { type: Characteristic.ApparentPowerL2, label: 'apparent power L2', value: liveData.apparentPowerL2Kw, unit: 'kVA' },
                        { type: Characteristic.ApparentPowerL3, label: 'apparent power L3', value: liveData.apparentPowerL3Kw, unit: 'kVA' },
                        { type: Characteristic.ReadingTime, label: 'reading time', value: liveData.readingTime }
                    ];

                    for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                        if (!this.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                if (this.logInfo) this.emit('info', `Live Data: ${liveDataType}, ${label}: ${unit !== '' ? `${value} ${unit}` : postfix !== '' ? `${postfix}` : `${value}`}`);
                                return value;
                            });
                    }

                    this.liveDataServices.push(service);
                }
            }

            return accessory;
        } catch (error) {
            throw new Error(`Prepare accessory error: ${error}`)
        }
    }

    //start
    async start() {
        if (this.logDebug) this.emit('debug', `Start`);

        try {
            // Create axios instance
            this.axiosInstance = this.createAxiosInstance();

            // Get basic PV info
            const getInfo = await this.getInfo();
            if (!getInfo) return null;

            const tokenRequired = this.feature.info.tokenRequired;
            this.feature.info.tokenValid = tokenRequired ? false : true;

            // Authenticate
            const tokenValid = tokenRequired ? await this.checkToken(true) : true;
            if (tokenRequired && !tokenValid) return null;

            // Legacy auth (Legacy auth))
            const digestAuthorizationEnvoy = !tokenRequired ? await this.digestAuthorizationEnvoy() : false;
            const digestAuthorizationInstaller = !tokenRequired ? await this.digestAuthorizationInstaller() : false;

            // DevId / ProductionState (Web token or legacy auth)
            const allowInstallerAccess = tokenRequired && (this.feature.info.jwtToken.installer || digestAuthorizationInstaller);
            const getEnvoyDevId = allowInstallerAccess ? await this.getEnvoyDevId() : false;
            const getProductionState = getEnvoyDevId ? await this.updateProductionState(true) : false;

            // Home / Inventory / PCU
            const getHome = await this.updateHome();

            // Meters
            const getMeters = getHome && this.feature.meters.supported ? await this.updateMeters() : false;
            const getMetersReading = getMeters && this.feature.meters.installed ? await this.updateMetersReading(true) : false;
            const getMetersReports = getMeters && this.feature.meters.installed ? await this.updateMetersReports(true) : false;

            // Inventory / PCU
            const getInventory = getHome ? await this.updateInventory() : false;
            const getPcuStatus = getInventory && (tokenRequired || digestAuthorizationEnvoy) ? await this.updatePcuStatus() : false;

            // Detailed devices
            const getDetailedDevices = getInventory || this.feature.meters.installed ? await this.updateDetailedDevices(true) : false;

            // Production
            const getProduction = this.feature.info.firmware < 824 ? await this.updateProduction() : false;
            const getProductionPdm = this.feature.info.firmware >= 824 ? await this.updateProductionPdm() : false;
            const getEnergyPdm = this.feature.info.firmware >= 824 ? await this.updateEnergyPdm() : false;
            const getProductionCt = this.feature.inventory.acbs.installed || this.feature.meters.installed ? await this.updateProductionCt() : false;

            // Ensemble (Web token required)
            const getEnsemble = tokenRequired && this.feature.inventory.esubs.supported ? await this.updateEnsembleInventory() : false;
            if (getEnsemble) {
                const getEnsembleStatus = await this.updateEnsembleStatus();
                const updateEnsemblePower = this.feature.inventory.esubs.encharges.installed ? await this.updateEnsemblePower() : false;
                const getEnchargeSettings = this.feature.inventory.esubs.encharges.installed ? await this.updateEnchargesSettings() : false;
                const getTariffSettings = getEnchargeSettings ? await this.updateTariff() : false;
                const getDryContacts = this.feature.inventory.esubs.enpowers.installed ? await this.updateDryContacts() : false;
                const getDryContactsSettings = getDryContacts ? await this.updateDryContactsSettings() : false;
                const getGenerator = await this.updateGenerator();
                const getGeneratorSettings = getGenerator && this.feature.inventory.esubs.generator.installed ? await this.updateGeneratorSettings() : false;
            }

            // Grid Profile Live Data and Ensemble Data Profile (Web token required)
            const getGridProfile = tokenRequired ? await this.updateGridProfile(true) : false;
            const getPlcLevel = allowInstallerAccess ? await this.updatePlcLevel(true) : false;

            // Get Data
            const getHomeData = getHome ? await this.updateHomeData() : false;
            const getMetersData = getMeters ? await this.updateMetersData() : false;
            const getPcusData = getInventory && this.feature.inventory.pcus.installed ? await this.updatePcusData() : false;
            const getNsrbsData = getInventory && this.feature.inventory.nsrbs.installed ? await this.updateNsrbsData() : false;
            const getAcbsData = this.feature.inventory.acbs.installed ? await this.updateAcbsData() : false;
            const getPowerAndEnergyData = await this.updatePowerAndEnergyData();
            const getEnsembleData = getEnsemble ? await this.updateEnsembleData() : false;
            const getLiveData = tokenRequired ? await this.updateLiveData() : false;

            // Setup timers
            this.timers = [];
            if (getHome) this.timers.push({ name: 'updateHome', sampling: 120000 });
            if (getPowerAndEnergyData) this.timers.push({ name: 'updatePowerandEnergy', sampling: this.productionDataRefreshTime });
            if (getEnsemble) this.timers.push({ name: 'updateEnsemble', sampling: this.ensembleDataRefreshTime });
            if (getLiveData) this.timers.push({ name: 'updateLiveData', sampling: this.liveDataRefreshTime });
            if (getGridProfile || getPlcLevel || getProductionState) this.timers.push({ name: 'updateGridPlcAndProductionState', sampling: 60000 });

            // Success message
            if (!this.disableLogSuccess) this.emit('success', `Connect Success`);

            // Optional logging
            if (this.logDeviceInfo) await this.getDeviceInfo();

            // External integrations
            if (this.restFul.enable || this.mqtt.enable) await this.externalIntegrations();

            // Prepare HomeKit accessory
            const accessory = await this.prepareAccessory();
            return accessory;
        } catch (error) {
            throw new Error(`Start error: ${error}`);
        }
    }

}
export default EnvoyDevice;
