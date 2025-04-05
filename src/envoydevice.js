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
import { ApiUrls, PartNumbers, Authorization, ApiCodes, LedStatus } from './constants.js';
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
        this.displayType = displayType;

        this.envoyFirmware7xxTokenGenerationMode = envoyFirmware7xxTokenGenerationMode;
        this.envoyPasswd = envoyPasswd;
        this.enlightenUser = enlightenUser;
        this.enlightenPassword = enlightenPasswd;
        this.envoyToken = envoyToken;
        this.envoyTokenInstaller = envoyTokenInstaller;

        this.productionStateControl = device.productionStateControl || {};
        this.productionStateSensor = device.productionStateSensor || {};
        this.plcLevelControl = device.plcLevelControl || {};

        this.powerProductionSummary = device.powerProductionSummary || 1;
        this.powerProductionStateSensor = device.powerProductionStateSensor || {};
        this.powerProductionLevelSensors = device.powerProductionLevelSensors || [];
        this.energyProductionStateSensor = device.energyProductionStateSensor || {};
        this.energyProductionLevelSensors = device.energyProductionLevelSensors || [];
        this.energyProductionLifetimeOffset = device.energyProductionLifetimeOffset || 0;

        this.powerConsumptionTotalStateSensor = device.powerConsumptionTotalStateSensor || {};
        this.powerConsumptionTotalLevelSensors = device.powerConsumptionTotalLevelSensors || [];
        this.energyConsumptionTotalStateSensor = device.energyConsumptionTotalStateSensor || {};
        this.energyConsumptionTotalLevelSensors = device.energyConsumptionTotalLevelSensors || [];
        this.energyConsumptionTotalLifetimeOffset = device.energyConsumptionTotalLifetimeOffset || 0;

        this.powerConsumptionNetStateSensor = device.powerConsumptionNetStateSensor || {};
        this.powerConsumptionNetLevelSensors = device.powerConsumptionNetLevelSensors || [];
        this.energyConsumptionNetStateSensor = device.energyConsumptionNetStateSensor || {};
        this.energyConsumptionNetLevelSensors = device.energyConsumptionNetLevelSensors || [];
        this.energyConsumptionNetLifetimeOffset = device.energyConsumptionNetLifetimeOffset || 0;

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
        this.enchargeBackupLevelAccessory = envoyFirmware7xxTokenGenerationMode > 0 ? device.enchargeBackupLevelAccessory || {} : {};
        this.enchargeStateSensor = envoyFirmware7xxTokenGenerationMode > 0 ? device.enchargeStateSensor || {} : {};
        this.enchargeProfileControls = envoyFirmware7xxTokenGenerationMode > 0 ? device.enchargeProfileControls || [] : [];
        this.enchargeProfileSensors = envoyFirmware7xxTokenGenerationMode > 0 ? device.enchargeProfileSensors || [] : [];
        this.enchargeGridStateSensor = envoyFirmware7xxTokenGenerationMode > 0 ? device.enchargeGridStateSensor || {} : {};
        this.enchargeGridModeSensors = envoyFirmware7xxTokenGenerationMode > 0 ? device.enchargeGridModeSensors || [] : [];
        this.enchargeBackupLevelSensors = envoyFirmware7xxTokenGenerationMode > 0 ? device.enchargeBackupLevelSensors || [] : [];

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
        this.metersDataRefreshTime = device.metersDataRefreshTime * 1000 || 5000;
        this.productionDataRefreshTime = device.productionDataRefreshTime * 1000 || 10000;
        this.liveDataRefreshTime = device.liveDataRefreshTime * 1000 || 3000;
        this.ensembleDataRefreshTime = device.ensembleDataRefreshTime * 1000 || 15000;

        //log
        this.enableDebugMode = device.enableDebugMode || false;
        this.disableLogInfo = device.disableLogInfo || false;
        this.disableLogDeviceInfo = device.disableLogDeviceInfo || false;

        //external integrations
        this.restFul = device.restFul ?? {};
        this.restFulConnected = false;
        this.mqtt = device.mqtt ?? {};
        this.mqttConnected = false;

        //system
        const systemAccessoryDisplayType = this.displayType ?? 0;
        if (systemAccessoryDisplayType > 0) {
            const tile = {};
            tile.serviceType = ['', Service.Lightbulb, Service.Fan, Service.HumiditySensor, Service.CarbonMonoxideSensor][systemAccessoryDisplayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.StatusActive, Characteristic.CarbonMonoxideDetected][systemAccessoryDisplayType];
            tile.characteristicType1 = ['', Characteristic.Brightness, Characteristic.RotationSpeed, Characteristic.CurrentRelativeHumidity, Characteristic.CarbonMonoxideLevel][systemAccessoryDisplayType];
            tile.state = false;
            tile.level = 0;
            this.systemAccessoryActive = tile;
        };

        //production state control
        const productionStateControlDisplayType = this.productionStateControl.displayType ?? 0;
        if (productionStateControlDisplayType > 0) {
            const tile = {};
            tile.name = this.productionStateControl.name || 'Production State Control';
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][productionStateControlDisplayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][productionStateControlDisplayType];
            tile.state = false;
            this.productionStateActiveControl = tile;
        };

        //production state sensor
        const productionStateSensorDisplayType = this.productionStateSensor.displayType ?? 0;
        if (productionStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.productionStateSensor.name || 'Production State Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][productionStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][productionStateSensorDisplayType];
            sensor.state = false;
            this.productionStateActiveSensor = sensor;
        };

        //plc level control
        const plcLevelControlDisplayType = this.plcLevelControl.displayType ?? 0;
        if (plcLevelControlDisplayType > 0) {
            const tile = {};
            tile.name = this.plcLevelControl.name || 'PLC Level Refresh Control';
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][plcLevelControlDisplayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][plcLevelControlDisplayType];
            tile.state = false;
            this.plcLevelActiveControl = tile;
        }

        //data refresh control
        const dataRefreshControlDisplayType = this.dataRefreshControl.displayType ?? 0;
        if (dataRefreshControlDisplayType > 0) {
            const tile = {};
            tile.name = this.dataRefreshControl.name || 'Data Refresh Control';
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][dataRefreshControlDisplayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][dataRefreshControlDisplayType];
            tile.state = false;
            this.dataRefreshActiveControl = tile;
        };

        //data refresh sensor
        const dataRefreshSensorDisplayType = this.dataRefreshSensor.displayType ?? 0;
        if (dataRefreshSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.dataRefreshSensor.name || 'Data Refresh Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][dataRefreshSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][dataRefreshSensorDisplayType];
            sensor.state = false;
            this.dataRefreshActiveSensor = sensor;
        };

        //power production level sensors
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
        this.powerProductionLevelActiveSensorsCount = this.powerProductionLevelActiveSensors.length || 0;

        //power production state sensor
        const powerProductionStateSensorDisplayType = this.powerProductionStateSensor.displayType ?? 0;
        if (powerProductionStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.powerProductionStateSensor.name || 'Power Production State Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][powerProductionStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][powerProductionStateSensorDisplayType];
            sensor.state = false;
            this.powerProductionStateActiveSensor = sensor;
        };

        //energy production state sensor
        const energyProductionStateSensorDisplayType = this.energyProductionStateSensor.displayType ?? 0;
        if (energyProductionStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.energyProductionStateSensor.name || 'Energy Production State Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][energyProductionStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][energyProductionStateSensorDisplayType];
            sensor.state = false;
            this.energyProductionStateActiveSensor = sensor;
        };

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
        this.energyProductionLevelActiveSensorsCount = this.energyProductionLevelActiveSensors.length || 0;

        //power consumption total state sensor
        const powerConsumptionTotalStateSensorDisplayType = this.powerConsumptionTotalStateSensor.displayType ?? 0;
        if (powerConsumptionTotalStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.powerConsumptionTotalStateSensor.name || 'Power Consumption Total State Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][powerConsumptionTotalStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][powerConsumptionTotalStateSensorDisplayType];
            sensor.state = false;
            this.powerConsumptionTotalStateActiveSensor = sensor;
        };

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
        this.powerConsumptionTotalLevelActiveSensorsCount = this.powerConsumptionTotalLevelActiveSensors.length || 0;

        //energy consumption total state sensor
        const energyConsumptionTotalStateSensorDisplayType = this.energyConsumptionTotalStateSensor.displayType ?? 0;
        if (energyConsumptionTotalStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.energyConsumptionTotalStateSensor.name || 'Energy Consumption Total State Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][energyConsumptionTotalStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][energyConsumptionTotalStateSensorDisplayType];
            sensor.state = false;
            this.energyConsumptionTotalStateActiveSensor = sensor;
        };

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
        this.energyConsumptionTotalLevelActiveSensorsCount = this.energyConsumptionTotalLevelActiveSensors.length || 0;

        //power consumption net state sensor
        const powerConsumptionNetStateSensorDisplayType = this.powerConsumptionNetStateSensor.displayType ?? 0;
        if (powerConsumptionNetStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.powerConsumptionNetStateSensor.name || 'Power Consumption Net State Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][powerConsumptionNetStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][powerConsumptionNetStateSensorDisplayType];
            sensor.state = false;
            this.powerConsumptionNetStateActiveSensor = sensor;
        };

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
        this.powerConsumptionNetLevelActiveSensorsCount = this.powerConsumptionNetLevelActiveSensors.length || 0;

        //energy consumption net state sensor
        const energyConsumptionNetStateSensorDisplayType = this.energyConsumptionNetStateSensor.displayType ?? 0;
        if (energyConsumptionNetStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.energyConsumptionNetStateSensor.name || 'Energy Consumption Net State Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][energyConsumptionNetStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][energyConsumptionNetStateSensorDisplayType];
            sensor.state = false;
            this.energyConsumptionNetStateActiveSensor = sensor;
        };

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
        this.energyConsumptionNetLevelActiveSensorsCount = this.energyConsumptionNetLevelActiveSensors.length || 0;

        //qRelay
        const qRelayStateSensorDisplayType = this.qRelayStateSensor.displayType ?? 0;
        if (qRelayStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.qRelayStateSensor.name || 'State Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][qRelayStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][qRelayStateSensorDisplayType];
            sensor.state = false;
            this.qRelayStateActiveSensor = sensor;
        };

        //ac battery
        const acBatterieBackupLevelSummaryAccessoryDisplayType = this.acBatterieBackupLevelSummaryAccessory.displayType ?? 0;
        if (acBatterieBackupLevelSummaryAccessoryDisplayType > 0) {
            const tile = {};
            tile.serviceType = ['', Service.Lightbulb, Service.Fan, Service.HumiditySensor, Service.CarbonMonoxideSensor, Service.Battery][acBatterieBackupLevelSummaryAccessoryDisplayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.StatusActive, Characteristic.CarbonMonoxideDetected, Characteristic.StatusLowBattery][acBatterieBackupLevelSummaryAccessoryDisplayType];
            tile.characteristicType1 = ['', Characteristic.Brightness, Characteristic.RotationSpeed, Characteristic.CurrentRelativeHumidity, Characteristic.CarbonMonoxideLevel, Characteristic.BatteryLevel][acBatterieBackupLevelSummaryAccessoryDisplayType];
            tile.displayType = this.acBatterieBackupLevelSummaryAccessory.displayType;
            tile.minSoc = this.acBatterieBackupLevelSummaryAccessory.minSoc ?? 0;
            tile.state = false;
            tile.backupLevel = 0;
            this.acBatterieBackupLevelSummaryActiveAccessory = tile;
        };

        const acBatterieBackupLevelAccessoryDisplayType = this.acBatterieBackupLevelAccessory.displayType ?? 0;
        if (acBatterieBackupLevelAccessoryDisplayType > 0) {
            const tile = {};
            tile.serviceType = ['', Service.Battery][acBatterieBackupLevelAccessoryDisplayType];
            tile.characteristicType = ['', Characteristic.StatusLowBattery][acBatterieBackupLevelAccessoryDisplayType];
            tile.characteristicType1 = ['', Characteristic.BatteryLevel][acBatterieBackupLevelAccessoryDisplayType];
            tile.characteristicType2 = ['', Characteristic.ChargingState][acBatterieBackupLevelAccessoryDisplayType];
            tile.displayType = this.acBatterieBackupLevelAccessory.displayType;
            tile.minSoc = this.acBatterieBackupLevelAccessory.minSoc ?? 0;
            this.acBatterieBackupLevelActiveAccessory = tile;
        };

        //enpower
        const enpowerGridStateControlDisplaqyType = this.enpowerGridStateControl.displayType ?? 0;
        if (enpowerGridStateControlDisplaqyType > 0) {
            const tile = {};
            tile.name = this.enpowerGridStateControl.name || 'Enpower Grid State Control';
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][enpowerGridStateControlDisplaqyType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][enpowerGridStateControlDisplaqyType];
            tile.state = false;
            this.enpowerGridStateActiveControl = tile;
        };

        const enpowerGridStateSensorDisplayType = this.enpowerGridStateSensor.displayType ?? 0;
        if (enpowerGridStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.enpowerGridStateSensor.name || 'Enpower Grid State Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][enpowerGridStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][enpowerGridStateSensorDisplayType];
            sensor.state = false;
            this.enpowerGridStateActiveSensor = sensor;
        };

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
        this.enpowerGridModeActiveSensorsCount = this.enpowerGridModeActiveSensors.length || 0;

        //encharge
        const enchargeBackupLevelSummaryAccessoryDisplayType = this.enchargeBackupLevelSummaryAccessory.displayType ?? 0;
        if (enchargeBackupLevelSummaryAccessoryDisplayType > 0) {
            const tile = {};
            tile.serviceType = ['', Service.Lightbulb, Service.Fan, Service.HumiditySensor, Service.CarbonMonoxideSensor, Service.Battery][enchargeBackupLevelSummaryAccessoryDisplayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.StatusActive, Characteristic.CarbonMonoxideDetected, Characteristic.StatusLowBattery][enchargeBackupLevelSummaryAccessoryDisplayType];
            tile.characteristicType1 = ['', Characteristic.Brightness, Characteristic.RotationSpeed, Characteristic.CurrentRelativeHumidity, Characteristic.CarbonMonoxideLevel, Characteristic.BatteryLevel][enchargeBackupLevelSummaryAccessoryDisplayType];
            tile.displayType = this.enchargeBackupLevelSummaryAccessory.displayType;
            tile.minSoc = this.enchargeBackupLevelSummaryAccessory.minSoc ?? 0;
            tile.state = false;
            tile.backupLevel = 0;
            this.enchargeBackupLevelSummaryActiveAccessory = tile;
        };

        const enchargeBackupLevelAccessoryDisplayType = this.enchargeBackupLevelAccessory.displayType ?? 0;
        if (enchargeBackupLevelAccessoryDisplayType > 0) {
            const tile = {};
            tile.serviceType = ['', Service.Battery][enchargeBackupLevelAccessoryDisplayType];
            tile.characteristicType1 = ['', Characteristic.StatusLowBattery][enchargeBackupLevelAccessoryDisplayType];
            tile.characteristicType = ['', Characteristic.BatteryLevel][enchargeBackupLevelAccessoryDisplayType];
            tile.characteristicType2 = ['', Characteristic.ChargingState][enchargeBackupLevelAccessoryDisplayType];
            tile.displayType = this.enchargeBackupLevelAccessory.displayType;
            tile.minSoc = this.enchargeBackupLevelAccessory.minSoc ?? 0;
            this.enchargeBackupLevelActiveAccessory = tile;
        };

        const enchargeStateSensorDisplayType = this.enchargeStateSensor.displayType ?? 0;
        if (enchargeStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.enchargeStateSensor.name || 'State Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][enchargeStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][enchargeStateSensorDisplayType];
            sensor.state = false;
            this.enchargeStateActiveSensor = sensor;
        };

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
        this.enchargeProfileActiveControlsCount = this.enchargeProfileActiveControls.length || 0;

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
        this.enchargeProfileActiveSensorsCount = this.enchargeProfileActiveSensors.length || 0;

        const enchargeGridStateSensorDisplayType = this.enchargeGridStateSensor.displayType ?? 0;
        if (enchargeGridStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.enchargeGridStateSensor.name || 'Grid State Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][enchargeGridStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][enchargeGridStateSensorDisplayType];
            sensor.state = false;
            this.enchargeGridStateActiveSensor = sensor;
        };

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
        this.enchargeGridModeActiveSensorsCount = this.enchargeGridModeActiveSensors.length || 0;

        this.enchargeBackupLevelActiveSensors = [];
        for (const sensor of this.enchargeBackupLevelSensors) {
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
            this.enchargeBackupLevelActiveSensors.push(sensor);
        }
        this.enchargeBackupLevelActiveSensorsCount = this.enchargeBackupLevelActiveSensors.length || 0;

        //solar
        const solarGridStateSensorDisplayType = this.solarGridStateSensor.displayType ?? 0;
        if (solarGridStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.solarGridStateSensor.name || 'Solar Grid State Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][solarGridStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][solarGridStateSensorDisplayType];
            sensor.state = false;
            this.solarGridStateActiveSensor = sensor;
        };

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
        this.solarGridModeActiveSensorsCount = this.solarGridModeActiveSensors.length || 0;

        //generator
        const generatorStateControlDisplaqyType = this.generatorStateControl.displayType ?? 0;
        if (generatorStateControlDisplaqyType > 0) {
            const tile = {};
            tile.name = this.generatorStateControl.name || 'Generator State Control';
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][generatorStateControlDisplaqyType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][generatorStateControlDisplaqyType];
            tile.state = false;
            this.generatorStateActiveControl = tile;
        };

        const generatorStateSensorDisplayType = this.generatorStateSensor.displayType ?? 0;
        if (generatorStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = this.generatorStateSensor.name || 'Generator State Sensor';
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][generatorStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][generatorStateSensorDisplayType];
            sensor.state = false;
            this.generatorStateActiveSensor = sensor;
        };

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
        this.generatorModeActiveControlsCount = this.generatorModeActiveControls.length || 0;

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
        this.generatorModeActiveSensorsCount = this.generatorModeActiveSensors.length || 0;

        //setup variables
        this.envoyIdFile = envoyIdFile;
        this.envoyTokenFile = envoyTokenFile;
        this.startPrepareAccessory = true;
        this.checkJwtTokenRunning = false;
        this.cookie = false;

        //url
        this.url = envoyFirmware7xxTokenGenerationMode > 0 ? `https://${this.host}` : `http://${this.host}`;

        //create axios instance
        this.axiosInstance = axios.create({
            method: 'GET',
            baseURL: this.url,
            withCredentials: true,
            headers: {
                Accept: 'application/json'
            },
            httpsAgent: new Agent({
                keepAlive: false,
                rejectUnauthorized: false
            }),
            timeout: 25000
        });

        //supported functions
        this.feature = {
            backboneApp: {
                supported: false
            },
            envoy: {
                installed: false
            },
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
            microinverters: {
                supported: false,
                installed: false,
                count: 0,
                status: {
                    supported: false
                },
            },
            qRelays: {
                supported: false,
                installed: false,
                count: 0
            },
            acBatteries: {
                supported: false,
                installed: false,
                count: 0
            },
            meters: {
                supported: false,
                installed: false,
                count: 0,
                production: {
                    supported: false,
                    enabled: false,
                    voltageDivide: 1
                },
                consumption: {
                    supported: false,
                    enabled: false,
                    voltageDivide: 1
                },
                acBatterie: {
                    supported: false,
                    enabled: false,
                    voltageDivide: 1
                },
                reading: {
                    supported: false,
                    installed: false,
                    count: 0,
                    channels: {
                        supported: false,
                        installed: false,
                        count: 0
                    }
                }
            },
            production: {
                microinverters: {
                    supported: false
                },
                ct: {
                    inverters: {
                        supported: false
                    },
                    production: {
                        supported: false
                    },
                    consumption: {
                        supported: false
                    },
                    acBatterie: {
                        supported: false
                    }
                },
                all: {
                    production: {
                        supported: false
                    },
                    consumption: {
                        supported: false
                    }
                }
            },
            ensembles: {
                supported: false,
                installed: false,
                inventory: {
                    supported: false,
                    installed: false,
                    count: 0,
                },
                status: {
                    supported: false
                }
            },
            enpowers: {
                supported: false,
                installed: false,
                count: 0
            },
            encharges: {
                supported: false,
                installed: false,
                count: 0,
                settings: {
                    supported: false,
                    installed: false,
                },
                tariff: {
                    supported: false
                }
            },
            dryContacts: {
                supported: false,
                installed: false,
                count: 0,
                settings: {
                    supported: false,
                    installed: false,
                    count: 0
                }
            },
            generators: {
                supported: false,
                installed: false,
                count: 0,
                settings: {
                    supported: false
                }
            },
            liveData: {
                supported: false
            },
            plcLevel: {
                supported: false
            },
            productionState: {
                supported: false
            },
            arfProfile: {
                supported: false
            },
            dataSampling: false
        }

        //pv object
        this.pv = {
            envoy: {
                devId: '',
                passwd: '',
                installerPasswd: '',
                firmware: 500,
                firmware7xx: envoyFirmware7xxTokenGenerationMode > 0,
                jwtToken: {
                    generation_time: 0,
                    token: envoyToken,
                    expires_at: 0,
                    installer: this.envoyFirmware7xxTokenGenerationMode === 2 ? this.envoyTokenInstaller : false
                }
            },
            microinverters: [],
            qRelays: [],
            acBatteries: {
                devices: []

            },
            ensembles: [],
            meters: [],
            production: {
                microinverters: {},
                ct: {
                    inverters: {},
                    production: {},
                    consumption: [],
                    acBatterie: {}
                },
                all: {
                    production: {},
                    consumption: {}
                }
            },
            productionState: false,
            liveData: {},
            arfProfile: {},
            powerState: false,
            powerLevel: 0,
            productionPowerPeak: 0,
            consumptionTotalPowerPeak: 0,
            consumptionNetPowerPeak: 0
        };

        //ensemble object
        this.ensemble = {
            enpowers: {
                devices: []
            },
            encharges: {
                devices: []
            },
            counters: {},
            secctrl: {},
            relay: {},
            tariff: {},
            dryContacts: [],
            generator: {},
            arfProfile: {}
        };

        //create impulse generator
        this.impulseGenerator = new ImpulseGenerator();
        this.impulseGenerator.on('updateHome', async () => {
            try {
                const tokenValid = await this.checkJwtToken();
                const updateHome = !tokenValid ? false : await this.updateHome();
                const updateInventory = updateHome ? await this.updateInventory() : false;
            } catch (error) {
                this.handleError(error);
            };
        }).on('updateMeters', async () => {
            try {
                const tokenValid = await this.checkJwtToken();
                const updateMeters = !tokenValid ? false : await this.updateMeters();
                const updateMetersReading = updateMeters ? await this.updateMetersReading() : false;
            } catch (error) {
                this.handleError(error);
            };
        }).on('updateMicroinvertersStatus', async () => {
            try {
                const tokenValid = await this.checkJwtToken();
                const updateMicroinvertersStatus = !tokenValid ? false : await this.updateMicroinvertersStatus();
            } catch (error) {
                this.handleError(error);
            };
        }).on('updateProduction', async () => {
            try {
                const tokenValid = await this.checkJwtToken();
                const updateProductionInverters = !tokenValid ? false : await this.updateProductionInverters();
                const updateProductionCt = updateProductionInverters ? await this.updateProductionCt() : false;
            } catch (error) {
                this.handleError(error);
            };
        }).on('updateProductionAll', async () => {
            try {
                const tokenValid = await this.checkJwtToken();
                const updateProductionAll = !tokenValid ? false : await this.updateProductionAll();
            } catch (error) {
                this.handleError(error);
            };
        }).on('updateEnsemble', async () => {
            try {
                const tokenValid = await this.checkJwtToken();
                const updateEnsemble = !tokenValid ? false : await this.updateEnsembleInventory();
                const updateEnsembleStatus = updateEnsemble ? await this.updateEnsembleStatus() : false;
                const updateEnchargeSettings = updateEnsemble ? await this.updateEnchargesSettings() : false;
                const updateTariffSettings = updateEnsemble ? await this.updateTariff() : false;
                const updateDryContacts = updateEnsemble ? await this.updateDryContacts() : false;
                const updateDryContactsSettings = updateDryContacts ? await this.updateDryContactsSettings() : false;
                const updateGenerator = updateEnsemble ? await this.updateGenerator() : false;
                const updateGeneratorSettings = updateGenerator ? await this.updateGeneratorSettings() : false;
            } catch (error) {
                this.handleError(error);
            };
        }).on('updateLiveData', async () => {
            try {
                const tokenValid = await this.checkJwtToken();
                const updateLiveData = !tokenValid ? false : await this.updateLiveData();
            } catch (error) {
                this.handleError(error);
            };
        }).on('state', (state) => {
            const emitState = state ? this.emit('success', `Impulse generator started`) : this.emit('warn', `Impulse generator stopped`);

            if (this.dataRefreshActiveControl) {
                this.dataRefreshActiveControl.state = state;

                if (this.dataRefreshControlService) {
                    const characteristicType = this.dataRefreshActiveControl.characteristicType;
                    this.dataRefreshControlService
                        .updateCharacteristic(characteristicType, state)
                }
            }

            if (this.dataRefreshActiveSensor) {
                this.dataRefreshActiveSensor.state = state;

                if (this.dataRefreshSensorService) {
                    const characteristicType = this.dataRefreshActiveSensor.characteristicType;
                    this.dataRefreshSensorService
                        .updateCharacteristic(characteristicType, state)
                }
            }

            if (this.envoyService) {
                this.envoyService
                    .updateCharacteristic(Characteristic.EnphaseEnvoyDataRefresh, state)
            }
            this.feature.dataSampling = state;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('datasampling', { state: state }) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Data Sampling', { state: state }) : false;
        });
    };

    handleError(error) {
        const errorString = error.toString();
        const tokenNotValid = errorString.includes('status code 401');
        if (tokenNotValid) {
            if (this.checkJwtTokenRunning) {
                return;
            };
            this.cookie = false;
            return;
        };
        this.emit('error', `Impulse generator: ${error}`);
    };

    async updateInfo() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting info`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.GetInfo);
            const infoData = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Info:`, infoData) : false;

            //parse info
            const options = {
                ignoreAttributes: false,
                ignorePiTags: true,
                allowBooleanAttributes: true
            };
            const parserXml = new XMLParser(options);
            const parseInfoData = parserXml.parse(infoData);
            const updatedInfoData = {
                ...parseInfoData,
                envoy_info: {
                    ...parseInfoData.envoy_info,
                    device: {
                        ...parseInfoData.envoy_info.device,
                        sn: 'removed'
                    }
                }
            };
            const debug1 = this.enableDebugMode ? this.emit('debug', `Parsed info:`, updatedInfoData) : false;

            //envoy
            const envoyInfo = parseInfoData.envoy_info;
            const envoyInfoDevice = envoyInfo.device;
            const envoyInfoBuildInfo = envoyInfo.build_info;
            const info = {
                time: new Date(envoyInfo.time * 1000).toLocaleString(),
                serialNumber: envoyInfoDevice.sn.toString(),
                partNumber: envoyInfoDevice.pn,
                modelName: PartNumbers[envoyInfoDevice.pn] ?? envoyInfoDevice.pn,
                software: envoyInfoDevice.software,
                euaid: envoyInfoDevice.euaid,
                seqNum: envoyInfoDevice.seqnum,
                apiVer: envoyInfoDevice.apiver,
                imeter: envoyInfoDevice.imeter === true ?? false,
                webTokens: envoyInfo['web-tokens'] === true ?? false,
                packages: envoyInfo.package ?? [],
                buildInfo: {
                    buildId: envoyInfoBuildInfo.build_id ?? 'Unknown',
                    buildTimeQmt: new Date(envoyInfoBuildInfo.build_time_gmt * 1000).toLocaleString() ?? '',
                    releaseVer: envoyInfoBuildInfo.release_ver ?? 'Unknown',
                    releaseStage: envoyInfoBuildInfo.release_stage ?? 'Unknown'
                }
            };

            //check serial number
            if (!info.serialNumber) {
                throw new Error(`Envoy serial number missing: ${info.serialNumber}`);
            };
            this.pv.envoy.info = info;

            const cleanedString = info.software.replace(/\D/g, '')
            const envoyFirmware = cleanedString ? parseInt(cleanedString.slice(0, 3)) : 500;
            this.pv.envoy.firmware = envoyFirmware;
            this.pv.envoy.firmware7xx = envoyFirmware >= 700;

            //envoy installed and meters supported
            this.feature.envoy.installed = true;
            this.feature.meters.supported = info.imeter;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('info', parseInfoData) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Info', parseInfoData) : false;
            return true;
        } catch (error) {
            throw new Error(`Update info error: ${error}`);
        };
    };

    async getEnvoyBackboneApp() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting envoy backbone app`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.BackboneApplication);
            const envoyBackboneApp = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Envoy backbone app:`, envoyBackboneApp) : false;

            //backbone data
            const keyword = 'envoyDevId:';
            const startIndex = envoyBackboneApp.indexOf(keyword);

            //check envoy dev Id exist
            if (startIndex === -1) {
                this.emit('warn', `Envoy dev Id in backbone app not found, dont worry all working correct, only the power production control will not be possible`);
                return null;
            }

            const substringStartIndex = startIndex + keyword.length;
            const envoyDevId = envoyBackboneApp.substr(substringStartIndex, 9);
            if (envoyDevId.length !== 9) {
                this.emit('warn', `Envoy dev Id: ${envoyDevId} in backbone app have wrong format, dont worry all working correct, only the power production control will not be possible`);
                return null;
            }

            //save dev id
            try {
                await this.saveData(this.envoyIdFile, envoyDevId);
            } catch (error) {
                this.emit('error', `Save envoy dev Id error: ${error}`);
            };

            this.pv.envoy.devId = envoyDevId;
            this.feature.backboneApp.supported = true;
            return true;
        } catch (error) {
            this.emit('warn', `Get backbone app error: ${error}, dont worry all working correct, only the power production control will not be possible`);
            return null;
        };
    };

    async digestAuthorizationEnvoy() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting digest authorization error`) : false;
        try {
            //envoy password
            const deviceSn = this.pv.envoy.info.serialNumber;
            const envoyPasswd = this.envoyPasswd ? this.envoyPasswd : deviceSn.substring(6);
            const debug2 = this.enableDebugMode ? this.emit('debug', `Envoy password:`, envoyPasswd.length === 6 ? 'Exist' : 'Missing') : false;
            if (envoyPasswd.length !== 6) {
                this.emit('warn', `Envoy password is not correct, dont worry all working correct, only the power and power max of microinverters will not be displayed`)
                return null;
            }

            //digest authorization envoy
            this.digestAuthEnvoy = new DigestAuth({
                user: Authorization.EnvoyUser,
                passwd: envoyPasswd
            });
            this.pv.envoyPasswd = envoyPasswd;

            return true;
        } catch (error) {
            this.emit('warn', `Digest authorization error: ${error}, dont worry all working correct, only the power and power max of microinverters will not be displayed`);
            return null;
        };
    };

    async digestAuthorizationInstaller() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting digest authorization installer`) : false;
        try {
            //calculate installer password
            const deviceSn = this.pv.envoy.info.serialNumber;
            const passwdCalc = new PasswdCalc({
                user: Authorization.InstallerUser,
                realm: Authorization.Realm,
                serialNumber: deviceSn
            });

            //caalculate installer password
            const installerPasswd = await passwdCalc.getPasswd();
            const debug = this.enableDebugMode ? this.emit('debug', `Calculated installer password:`, installerPasswd.length > 1 ? 'Exist' : 'Missing') : false;
            if (installerPasswd.length <= 1) {
                this.emit('warn', `Calculated instaaller password: ${installerPasswd}, is not correct, dont worry all working correct, only the power production state/control and plc level will not be displayed`)
                return null;
            }

            this.digestAuthInstaller = new DigestAuth({
                user: Authorization.InstallerUser,
                passwd: installerPasswd
            });
            this.pv.envoy.installerPasswd = installerPasswd;

            return true;
        } catch (error) {
            this.emit('warn', `Digest authorization installer error: ${error}, dont worry all working correct, only the power production state/control and plc level will not be displayed`);
            return null;
        };
    };

    async checkJwtToken() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting check JWT token`) : false;

        if (this.pv.envoy.firmware < 700) {
            return true;
        };

        try {
            if (this.checkJwtTokenRunning) {
                return null;
            };
            this.checkJwtTokenRunning = true;

            //check token is valid
            const tokenValid = this.envoyFirmware7xxTokenGenerationMode === 2 && this.pv.envoy.jwtToken.token ? true : this.pv.envoy.jwtToken.token && this.pv.envoy.jwtToken.expires_at >= Math.floor(Date.now() / 1000) + 60;
            const debug = this.enableDebugMode ? this.emit('debug', `JWT Token: ${tokenValid ? 'Valid' : 'Not valid'}`) : false;

            //check cookie are valid
            const cookieValid = this.cookie;
            const debug1 = this.enableDebugMode ? this.emit('debug', `Cookie: ${cookieValid ? 'Valid' : 'Not valid'}`) : false;

            if (tokenValid && cookieValid) {
                this.checkJwtTokenRunning = false;
                return true;
            }

            //get new JWT token
            const wait = !tokenValid ? await new Promise(resolve => setTimeout(resolve, 30000)) : false;
            const emit = !tokenValid ? this.emit('warn', `JWT Token not valid, refreshing`) : false;
            const getToken = !tokenValid ? await this.getJwtToken() : true;
            if (!getToken) {
                this.checkJwtTokenRunning = false;
                return null;
            }

            //always get new cookie
            this.emit('warn', `Cookie not valid, refreshing`);
            const getCookie = await this.getCookie();
            if (!getCookie) {
                this.checkJwtTokenRunning = false;
                return null;
            }

            this.checkJwtTokenRunning = false;
            return true;
        } catch (error) {
            throw new Error(`Check JWT token error: ${error}`);
        };
    };

    async getJwtToken() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting JWT token`) : false;

        try {
            const envoyToken = new EnvoyToken({
                user: this.enlightenUser,
                passwd: this.enlightenPassword,
                serialNumber: this.pv.envoy.info.serialNumber
            }).on('success', (message) => {
                this.emit('success', message);
            }).on('warn', (warn) => {
                this.emit('warn', warn);
            }).on('error', (error) => {
                this.emit('error', error);
            });

            const tokenData = await envoyToken.refreshToken();
            if (!tokenData) {
                return null;
            }

            const updatedTokenData = {
                ...tokenData,
                token: 'removed'
            };
            const debug = this.enableDebugMode ? this.emit('debug', `JWT token:`, updatedTokenData) : false;
            this.pv.envoy.jwtToken = tokenData;

            //save token
            try {
                await this.saveData(this.envoyTokenFile, tokenData);
            } catch (error) {
                this.emit('error', `Save token error: ${error}`);
            };

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('token', tokenData) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Token', tokenData) : false;

            return true;
        } catch (error) {
            throw new Error(`Get JWT token error: ${error}`);
        };
    };

    async getCookie() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting cookie`) : false;

        try {
            const options = {
                method: 'GET',
                baseURL: this.url,
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.pv.envoy.jwtToken.token}`
                },
                withCredentials: true,
                httpsAgent: new Agent({
                    keepAlive: false,
                    rejectUnauthorized: false
                }),
                timeout: 25000
            };

            const response = await axios(ApiUrls.CheckJwt, options);
            const cookie = response.headers['set-cookie'] ?? false;
            if (!cookie) {
                return null;
            }

            //create axios instance get with cookie
            this.axiosInstance = axios.create({
                method: 'GET',
                baseURL: this.url,
                headers: {
                    Accept: 'application/json',
                    Cookie: cookie
                },
                withCredentials: true,
                httpsAgent: new Agent({
                    keepAlive: false,
                    rejectUnauthorized: false
                }),
                timeout: 25000
            });

            this.cookie = cookie;
            this.emit('success', `Cookie refresh success`);
            return true;
        } catch (error) {
            throw new Error(`Get cookie error: ${error}`);
        };
    };

    async updateGridProfile() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting grid profile`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.Profile);
            const profile = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Grid profile:`, profile) : false;

            //arf profile
            const arfProfile = {
                name: (profile.name).substring(0, 64) ?? false,
                id: profile.id ?? 0,
                version: profile.version ?? '',
                itemCount: profile.item_count ?? 0
            }
            const arfProfileSupported = arfProfile.name !== false;
            this.pv.arfProfile = arfProfileSupported ? arfProfile : {};
            this.ensemble.arfProfile = arfProfileSupported ? arfProfile : {};
            this.feature.arfProfile.supported = arfProfileSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('gridprofile', profile) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Grid Profile', profile) : false;
            return true;
        } catch (error) {
            this.emit('warn', 'Arf Profile not supported, dont worry all working correct, only the profile name will not be displayed')
        };
    };

    async updateHome() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting home`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.Home);
            const envoy = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Home:`, envoy) : false;

            //get object keys of home
            const envoyKeys = Object.keys(envoy);
            const envoyCommKeys = Object.keys(envoy.comm);

            //get supported devices
            const microinvertersSupported = envoyCommKeys.includes('pcu');
            const acBatteriesSupported = envoyCommKeys.includes('acb');
            const qRelaysSupported = envoyCommKeys.includes('nsrb');
            const ensemblesSupported = envoyCommKeys.includes('esub');
            const enchargesSupported = envoyCommKeys.includes('encharge');
            const wirelessConnectionsSupported = envoyKeys.includes('wireless_connection');

            //envoy
            const home = {};
            home.softwareBuildEpoch = new Date(envoy.software_build_epoch * 1000).toLocaleString();
            home.isEnvoy = envoy.is_nonvoy === false ?? true;
            home.dbSize = envoy.db_size ?? 0;
            home.dbPercentFull = envoy.db_percent_full ?? 0;
            home.timeZone = envoy.timezone ?? 'Unknown';
            home.currentDate = new Date(envoy.current_date).toLocaleString().slice(0, 11) ?? 'Unknown';
            home.currentTime = envoy.current_time ?? 'Unknown';
            home.tariff = ApiCodes[envoy.tariff] ?? 'Unknown';

            //network
            const envoyNework = envoy.network;
            const networkInterfaces = envoyNework.interfaces ?? [];
            const networkInterfacesSupported = networkInterfaces.length > 0;
            home.network = {
                webComm: envoyNework.web_comm === true,
                everReportedToEnlighten: envoyNework.ever_reported_to_enlighten === true,
                lastEnlightenReporDate: new Date(envoyNework.last_enlighten_report_time * 1000).toLocaleString(),
                primaryInterface: ApiCodes[envoyNework.primary_interface] ?? 'Unknown',
                networkInterfaces: networkInterfaces.map(data => {
                    const type = data.type;
                    return {
                        type: ApiCodes[type] ?? 'Unknown',
                        interface: data.interface,
                        mac: type !== 'cellular' ? data.mac : null,
                        dhcp: data.dhcp,
                        ip: data.ip,
                        carrier: data.carrier,
                        signalStrength: type === 'cellular' ? data.signal_strength : data.signal_strength * 20,
                        signalStrengthMax: type === 'cellular' ? data.signal_strength_max : data.signal_strength_max * 20,
                        supported: type === 'wifi' ? data.supported : null,
                        present: type === 'wifi' ? data.present : null,
                        configured: type === 'wifi' ? data.configured : null,
                        status: type === 'wifi' ? ApiCodes[data.status] : null
                    };
                }),
            };
            home.networkInterfacesInstalled = home.network.networkInterfaces.some(connection => connection.carrier);

            //comm
            const comm = envoy.comm;
            const commEnsemble = ensemblesSupported ? comm.esub : {};
            const commEnchargesData = enchargesSupported ? comm.encharge : [];
            home.comm = {
                num: comm.num ?? 0,
                level: comm.level * 20 ?? 0,
                pcuNum: comm.pcu.num ?? 0,
                pcuLevel: comm.pcu.level * 20 ?? 0,
                acbNum: comm.acb.num ?? 0,
                acbLevel: comm.acb.level * 20 ?? 0,
                nsrbNum: comm.nsrb.num ?? 0,
                nsrbLevel: comm.nsrb.level * 20 ?? 0,
                esubNum: commEnsemble.num ?? 0,
                esubLevel: commEnsemble.level * 20 ?? 0,
                encharges: commEnchargesData.map(encharge => {
                    return {
                        num: encharge.num ?? 0,
                        level: encharge.level * 20 ?? 0,
                        level24g: encharge.level_24g * 20 ?? 0,
                        levelSubg: encharge.level_subg * 20 ?? 0
                    };
                }),
            };

            home.alerts = (Array.isArray(envoy.alerts) && (envoy.alerts).length > 0) ? ((envoy.alerts).map(a => ApiCodes[a.msg_key] || a.msg_key).join(', ')).substring(0, 64) : 'No alerts';
            home.updateStatus = ApiCodes[envoy.update_status] ?? 'Unknown';

            //wireless connection kit
            const wirelessConnectionsData = wirelessConnectionsSupported ? envoy.wireless_connection : [];
            home.wirelessConnectionsInstalled = false;
            home.wirelessConnectionsCount = wirelessConnectionsData.length;
            home.wirelessConnections = [];
            if (wirelessConnectionsSupported) {
                wirelessConnectionsData.forEach((wirelessConnection, index) => {
                    const obj = {
                        signalStrength: wirelessConnection.signal_strength * 20,
                        signalStrengthMax: wirelessConnection.signal_strength_max * 20,
                        type: ApiCodes[wirelessConnection.type] ?? 'Unknown',
                        connected: wirelessConnection.connected ?? false,
                    };
                    home.wirelessConnections.push(obj);

                    //update chaaracteristics
                    if (this.wirelessConnectionsKitServices) {
                        this.wirelessConnectionsKitServices[index]
                            .updateCharacteristic(Characteristic.EnphaseWirelessConnectionKitSignalStrength, obj.signalStrength)
                            .updateCharacteristic(Characteristic.EnphaseWirelessConnectionKitSignalStrengthMax, obj.signalStrengthMax)
                            .updateCharacteristic(Characteristic.EnphaseWirelessConnectionKitType, obj.type)
                            .updateCharacteristic(Characteristic.EnphaseWirelessConnectionKitConnected, obj.connected);
                    }
                });
            }
            home.wirelessConnectionsInstalled = home.wirelessConnections.some(connection => connection.connected);

            //update chaaracteristics
            if (this.envoyService) {
                this.envoyService
                    .updateCharacteristic(Characteristic.EnphaseEnvoyAlerts, home.alerts)
                    .updateCharacteristic(Characteristic.EnphaseEnvoyDbSize, `${home.dbSize} / ${home.dbPercentFull} %`)
                    .updateCharacteristic(Characteristic.EnphaseEnvoyTimeZone, home.timeZone)
                    .updateCharacteristic(Characteristic.EnphaseEnvoyCurrentDateTime, `${home.currentDate} ${home.currentTime}`)
                    .updateCharacteristic(Characteristic.EnphaseEnvoyNetworkWebComm, home.network.webComm)
                    .updateCharacteristic(Characteristic.EnphaseEnvoyEverReportedToEnlighten, home.network.everReportedToEnlighten)
                    .updateCharacteristic(Characteristic.EnphaseEnvoyLastEnlightenReporDate, home.network.lastEnlightenReporDate)
                    .updateCharacteristic(Characteristic.EnphaseEnvoyPrimaryInterface, home.network.primaryInterface)
                    .updateCharacteristic(Characteristic.EnphaseEnvoyTariff, home.tariff)
                    .updateCharacteristic(Characteristic.EnphaseEnvoyCommNumAndLevel, `${home.comm.num} / ${home.comm.level} %`)
                    .updateCharacteristic(Characteristic.EnphaseEnvoyCommNumPcuAndLevel, `${home.comm.pcuNum} / ${home.comm.pcuLevel} %`)
                    .updateCharacteristic(Characteristic.EnphaseEnvoyCommNumNsrbAndLevel, `${home.comm.nsrbNum} / ${home.comm.nsrbLevel} %`);
                if (this.feature.arfProfile.supported) {
                    this.envoyService
                        .updateCharacteristic(Characteristic.EnphaseEnvoyGridProfile, this.pv.arfProfile.name);
                }
                if (this.feature.acBatteries.installed) {
                    this.envoyService
                        .updateCharacteristic(Characteristic.EnphaseEnvoyCommNumAcbAndLevel, `${home.comm.acbNum} / ${home.comm.acbLevel} %`)
                }
                if (this.feature.encharges.installed) {
                    this.envoyService
                        .updateCharacteristic(Characteristic.EnphaseEnvoyCommNumEnchgAndLevel, `${home.comm.encharges[0].num} / ${home.comm.encharges[0].level} %`)
                }
            }

            //supported devices
            this.feature.networkInterfaces.supported = networkInterfacesSupported;
            this.feature.networkInterfaces.installed = home.networkInterfacesInstalled;
            this.feature.networkInterfaces.count = home.networkinterfacesCount;
            this.feature.wirelessConnections.supported = wirelessConnectionsSupported;
            this.feature.wirelessConnections.installed = home.wirelessConnectionsInstalled;
            this.feature.wirelessConnections.count = home.wirelessConnectionsCount;
            this.feature.microinverters.supported = microinvertersSupported;
            this.feature.acBatteries.supported = acBatteriesSupported;
            this.feature.qRelays.supported = qRelaysSupported;
            this.feature.ensembles.supported = ensemblesSupported;
            this.feature.encharges.supported = enchargesSupported;

            //add home to envoy object
            this.pv.envoy.home = home;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('home', envoy) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Home', envoy) : false;
            return true;
        } catch (error) {
            throw new Error(`Update home error: ${error}`);
        };
    };

    async updateInventory() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting inventory`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.Inventory);
            const inventory = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Inventory:`, inventory) : false;

            //inventory keys
            const inventoryKeys = inventory.map(device => device.type);

            //microinverters inventory
            const microinvertersSupported = inventoryKeys.includes('PCU');
            const microinverters = microinvertersSupported ? inventory[0].devices.slice(0, 70) : []; // Limit to 70 microinverters
            const microinvertersInstalled = microinverters.length > 0;
            if (microinvertersInstalled) {
                const pcu = [];
                const type = ApiCodes[inventory[0].type] ?? 'Unknown';
                microinverters.forEach((microinverter, index) => {
                    const obj = {
                        type: type,
                        partNum: PartNumbers[microinverter.part_num] ?? 'Microinverter',
                        installed: new Date(microinverter.installed * 1000).toLocaleString(),
                        serialNumber: microinverter.serial_num,
                        deviceStatus: (Array.isArray(microinverter.device_status) && (microinverter.device_status).length > 0) ? ((microinverter.device_status).map(a => ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
                        lastReportDate: new Date(microinverter.last_rpt_date * 1000).toLocaleString(),
                        adminState: microinverter.admin_state,
                        devType: microinverter.dev_type,
                        createdDate: new Date(microinverter.created_date * 1000).toLocaleString(),
                        imageLoadDate: new Date(microinverter.img_load_date * 1000).toLocaleString(),
                        firmware: microinverter.img_pnum_running,
                        ptpn: microinverter.ptpn,
                        chaneId: microinverter.chaneid,
                        deviceControl: microinverter.device_control,
                        producing: microinverter.producing === true,
                        communicating: microinverter.communicating === true,
                        provisioned: microinverter.provisioned === true,
                        operating: microinverter.operating === true,
                        phase: microinverter.phase ?? 'Unknown'
                    }
                    //add obj to pcu array
                    pcu.push(obj);

                    //update chaaracteristics
                    if (this.microinvertersServices) {
                        this.microinvertersServices[index]
                            .updateCharacteristic(Characteristic.EnphaseMicroinverterStatus, obj.deviceStatus)
                            .updateCharacteristic(Characteristic.EnphaseMicroinverterLastReportDate, obj.lastReportDate)
                            .updateCharacteristic(Characteristic.EnphaseMicroinverterFirmware, obj.firmware)
                            .updateCharacteristic(Characteristic.EnphaseMicroinverterProducing, obj.producing)
                            .updateCharacteristic(Characteristic.EnphaseMicroinverterCommunicating, obj.communicating)
                            .updateCharacteristic(Characteristic.EnphaseMicroinverterProvisioned, obj.provisioned)
                            .updateCharacteristic(Characteristic.EnphaseMicroinverterOperating, obj.operating);
                        if (this.feature.arfProfile.supported) {
                            this.microinvertersServices[index]
                                .updateCharacteristic(Characteristic.EnphaseMicroinverterGridProfile, this.pv.arfProfile.name);
                        }
                    }
                });

                //add array to pv microinverters
                this.pv.microinverters = pcu;
            }
            //microinverters
            this.feature.microinverters.supported = microinvertersSupported;
            this.feature.microinverters.installed = microinvertersInstalled;
            this.feature.microinverters.count = microinverters.length;

            //ac batteries inventory
            const acBatteriesSupported = inventoryKeys.includes('ACB');
            const acBatteries = acBatteriesSupported ? inventory[1].devices : [];
            const acBatteriesInstalled = acBatteries.length > 0;
            if (acBatteriesInstalled) {
                const acb = [];
                const type = ApiCodes[inventory[1].type] ?? 'Unknown';
                acBatteries.forEach((acBatterie, index) => {
                    const obj = {
                        type: type,
                        partNumber: PartNumbers[acBatterie.part_num] ?? acBatterie.part_num,
                        installed: new Date(acBatterie.installed * 1000).toLocaleString(),
                        serialNumber: acBatterie.serial_num,
                        deviceStatus: (Array.isArray(acBatterie.device_status) && (acBatterie.device_status).length > 0) ? ((acBatterie.device_status).map(a => ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
                        lastReportDate: new Date(acBatterie.last_rpt_date * 1000).toLocaleString(),
                        adminState: acBatterie.admin_state,
                        devType: acBatterie.dev_type,
                        createdDate: new Date(acBatterie.created_date * 1000).toLocaleString(),
                        imageLoadDate: new Date(acBatterie.img_load_date * 1000).toLocaleString(),
                        firmware: acBatterie.img_pnum_running,
                        ptpn: acBatterie.ptpn,
                        chaneId: acBatterie.chaneid,
                        deviceControl: acBatterie.device_control,
                        producing: acBatterie.producing === true,
                        communicating: acBatterie.communicating === true,
                        provisioned: acBatterie.provisioned === true,
                        operating: acBatterie.operating === true,
                        sleepEnabled: acBatterie.sleep_enabled,
                        percentFull: acBatterie.percentFull,
                        maxCellTemp: acBatterie.maxCellTemp,
                        sleepMinSoc: acBatterie.sleep_min_soc,
                        sleepMaxSoc: acBatterie.sleep_max_soc,
                        chargeStatus: ApiCodes[acBatterie.charge_status] ?? 'Unknown',
                        chargingState: acBatterie.charge_status === 'discharging' ? 0 : acBatterie.charge_statuse === 'charging' ? 1 : 2,
                    }
                    //add ac batteries to acb
                    acb.push(obj);

                    //update chaaracteristics
                    if (this.acBatterieBackupLevelActiveAccessory) {
                        const lowBatteryState = obj.percentFull < this.acBatterieBackupLevelActiveAccessory.minSoc;
                        const backupLevel = obj.percentFull;
                        const chargingState = obj.chargingState;

                        if (this.acBatteriesLevelAndStateServices) {
                            const characteristicType = this.acBatterieBackupLevelActiveAccessory.characteristicType;
                            const characteristicType1 = this.acBatterieBackupLevelActiveAccessory.characteristicType1;
                            const characteristicType2 = this.acBatterieBackupLevelActiveAccessory.characteristicType2;
                            this.acBatteriesLevelAndStateServices[index]
                                .updateCharacteristic(characteristicType, lowBatteryState)
                                .updateCharacteristic(characteristicType1, backupLevel)
                                .updateCharacteristic(characteristicType2, chargingState);
                        }
                    }
                    if (this.acBatteriesServices) {
                        this.acBatteriesServices[index]
                            .updateCharacteristic(Characteristic.EnphaseAcBatterieStatus, obj.deviceStatus)
                            .updateCharacteristic(Characteristic.EnphaseAcBatterieLastReportDate, obj.lastReportDate)
                            .updateCharacteristic(Characteristic.EnphaseAcBatterieFirmware, obj.firmware)
                            .updateCharacteristic(Characteristic.EnphaseAcBatterieProducing, obj.producing)
                            .updateCharacteristic(Characteristic.EnphaseAcBatterieCommunicating, obj.communicating)
                            .updateCharacteristic(Characteristic.EnphaseAcBatterieProvisioned, obj.provisioned)
                            .updateCharacteristic(Characteristic.EnphaseAcBatterieOperating, obj.operating)
                            .updateCharacteristic(Characteristic.EnphaseAcBatterieSleepEnabled, obj.sleepEnabled)
                            .updateCharacteristic(Characteristic.EnphaseAcBatteriePercentFull, obj.percentFull)
                            .updateCharacteristic(Characteristic.EnphaseAcBatterieMaxCellTemp, obj.maxCellTemp)
                            .updateCharacteristic(Characteristic.EnphaseAcBatterieSleepMinSoc, obj.sleepMinSoc)
                            .updateCharacteristic(Characteristic.EnphaseAcBatterieSleepMaxSoc, obj.sleepMaxSoc)
                            .updateCharacteristic(Characteristic.EnphaseAcBatterieChargeStatus, obj.chargeStatus);
                    }
                });

                //add array to pv ac batteries
                this.pv.acBatteries.devices = acb;
            }
            //ac batteries
            this.feature.acBatteries.supported = acBatteriesSupported;
            this.feature.acBatteries.installed = acBatteriesInstalled;
            this.feature.acBatteries.count = acBatteries.length;

            //qrelays inventory
            const qRelaysSupported = inventoryKeys.includes('NSRB');
            const qRelays = qRelaysSupported ? inventory[2].devices : [];
            const qRelaysInstalled = qRelays.length > 0;
            if (qRelaysInstalled) {
                const nsrb = [];
                const type = ApiCodes[inventory[2].type] ?? 'Unknown';
                qRelays.forEach((qRelay, index) => {
                    const obj = {
                        type: type,
                        partNumber: PartNumbers[qRelay.part_num] ?? qRelay.part_num,
                        installed: new Date(qRelay.installed * 1000).toLocaleString(),
                        serialNumber: qRelay.serial_num,
                        deviceStatus: (Array.isArray(qRelay.device_status) && (qRelay.device_status).length > 0) ? ((qRelay.device_status).map(a => ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
                        lastReportDate: new Date(qRelay.last_rpt_date * 1000).toLocaleString(),
                        adminState: qRelay.admin_state,
                        devType: qRelay.dev_type,
                        createdDate: new Date(qRelay.created_date * 1000).toLocaleString(),
                        imageLoadDate: new Date(qRelay.img_load_date * 1000).toLocaleString(),
                        firmware: qRelay.img_pnum_running,
                        ptpn: qRelay.ptpn,
                        chaneId: qRelay.chaneid,
                        deviceControl: qRelay.device_control,
                        producing: qRelay.producing === true,
                        communicating: qRelay.communicating === true,
                        provisioned: qRelay.provisioned === true,
                        operating: qRelay.operating === true,
                        relay: ApiCodes[qRelay.relay] ?? 'Unknown',
                        reasonCode: qRelay.reason_code,
                        reason: qRelay.reason,
                        linesCount: qRelay['line-count'],
                        line1Connected: qRelay['line-count'] >= 1 ? qRelay['line1-connected'] === true : false,
                        line2Connected: qRelay['line-count'] >= 2 ? qRelay['line2-connected'] === true : false,
                        line3Connected: qRelay['line-count'] >= 3 ? qRelay['line3-connected'] === true : false
                    }
                    //add qRelay to nsrb
                    nsrb.push(obj);

                    //update chaaracteristics
                    if (this.qRelayStateActiveSensor) {
                        const state = obj.relay === 'Closed';
                        this.qRelayStateActiveSensor.state = state;

                        if (this.qRelayStateSensorServices) {
                            const characteristicType = this.qRelayStateActiveSensor.characteristicType;
                            this.qRelayStateSensorServices[index]
                                .updateCharacteristic(characteristicType, state)
                        }
                    }

                    if (this.qRelaysServices) {
                        this.qRelaysServices[index]
                            .updateCharacteristic(Characteristic.EnphaseQrelayStatus, obj.deviceStatus)
                            .updateCharacteristic(Characteristic.EnphaseQrelayLastReportDate, obj.lastReportDate)
                            .updateCharacteristic(Characteristic.EnphaseQrelayFirmware, obj.firmware)
                            //.updateCharacteristic(Characteristic.EnphaseQrelayProducing, obj.producing)
                            .updateCharacteristic(Characteristic.EnphaseQrelayCommunicating, obj.communicating)
                            .updateCharacteristic(Characteristic.EnphaseQrelayProvisioned, obj.provisioned)
                            .updateCharacteristic(Characteristic.EnphaseQrelayOperating, obj.operating)
                            .updateCharacteristic(Characteristic.EnphaseQrelayState, obj.relay)
                            .updateCharacteristic(Characteristic.EnphaseQrelayLinesCount, obj.linesCount)
                        if (obj.linesCount >= 1) {
                            this.qRelaysServices[index]
                                .updateCharacteristic(Characteristic.EnphaseQrelayLine1Connected, obj.line1Connected);
                        }
                        if (obj.linesCount >= 2) {
                            this.qRelaysServices[index]
                                .updateCharacteristic(Characteristic.EnphaseQrelayLine2Connected, obj.line2Connected);
                        }
                        if (obj.linesCount >= 3) {
                            this.qRelaysServices[index]
                                .updateCharacteristic(Characteristic.EnphaseQrelayLine3Connected, obj.line3Connected);
                        }
                        if (this.feature.arfProfile.supported) {
                            this.qRelaysServices[index]
                                .updateCharacteristic(Characteristic.EnphaseQrelayGridProfile, this.pv.arfProfile.name);
                        }
                    }
                });

                //add array to pv qrelays
                this.pv.qRelays = nsrb;
            }
            //qRelays
            this.feature.qRelays.supported = qRelaysSupported;
            this.feature.qRelays.installed = qRelaysInstalled;
            this.feature.qRelays.count = qRelays.length;

            //ensembles
            const ensemblesInventorySupported = inventoryKeys.includes('ESUB');
            const ensemblesInventory = ensemblesInventorySupported ? inventory[3].devices : [];
            const ensemblesInventoryInstalled = ensemblesInventory.length > 0;
            if (ensemblesInventoryInstalled) {
                const esub = [];
                const type = ApiCodes[inventory[3].type] ?? 'Unknown';
                ensemblesInventory.forEach((ensemble, index) => {
                    const obj = {
                        type: type,
                        partNumber: PartNumbers[ensemble.part_num] ?? ensemble.part_num,
                        installed: new Date(ensemble.installed * 1000).toLocaleString(),
                        serialNumber: ensemble.serial_num,
                        deviceStatus: (Array.isArray(ensemble.device_status) && (ensemble.device_status).length > 0) ? ((ensemble.device_status).map(a => ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
                        lastReportDate: new Date(ensemble.last_rpt_date * 1000).toLocaleString(),
                        adminState: ensemble.admin_state,
                        devType: ensemble.dev_type,
                        createdDate: new Date(ensemble.created_date * 1000).toLocaleString(),
                        imageLoadDate: new Date(ensemble.img_load_date * 1000).toLocaleString(),
                        firmware: ensemble.img_pnum_running,
                        ptpn: ensemble.ptpn,
                        chaneId: ensemble.chaneid,
                        deviceControl: ensemble.device_control,
                        producing: ensemble.producing === true,
                        communicating: ensemble.communicating === true,
                        operating: ensemble.operating === true
                    }
                    //add obj to ensemble object
                    esub.push(obj);

                    //update chaaracteristics
                    if (this.ensemblesInventoryServices) {
                        this.ensemblesInventoryServices[index]
                            .updateCharacteristic(Characteristic.EnphaseEnsembleInventoryStatus, obj.deviceStatus)
                            .updateCharacteristic(Characteristic.EnphaseEnsembleInventoryLastReportDate, obj.lastReportDate)
                            .updateCharacteristic(Characteristic.EnphaseEnsembleInventoryFirmware, obj.firmware)
                            .updateCharacteristic(Characteristic.EnphaseEnsembleInventoryProducing, obj.producing)
                            .updateCharacteristic(Characteristic.EnphaseEnsembleInventoryCommunicating, obj.communicating)
                            .updateCharacteristic(Characteristic.EnphaseEnsembleInventoryOperating, obj.operating)
                    }
                });

                //add array to pv ensembles
                this.pv.ensembles = esub;
            }
            //ensembles supported
            this.feature.ensembles.inventory.supported = ensemblesInventorySupported;
            this.feature.ensembles.inventory.installed = ensemblesInventoryInstalled;
            this.feature.ensembles.inventory.count = ensemblesInventory.length;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('inventory', inventory) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Inventory', inventory) : false;
            return true;
        } catch (error) {
            throw new Error(`Update inventory error: ${error}`);
        };
    };

    async updateMeters() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting meters info`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.InternalMeterInfo);
            const meters = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Meters:`, meters) : false;

            //meters count
            const metersExist = meters.length > 0;
            if (metersExist) {

                //meters
                const ctMeters = [];
                meters.forEach((meter, index) => {
                    const obj = {
                        eid: meter.eid,
                        state: meter.state === 'enabled' ?? false,
                        measurementType: ApiCodes[meter.measurementType] ?? 'Unknown',
                        phaseMode: ApiCodes[meter.phaseMode] ?? 'Unknown',
                        phaseCount: meter.phaseCount ?? 1,
                        meteringStatus: ApiCodes[meter.meteringStatus] ?? 'Unknown',
                        statusFlags: (Array.isArray(meter.statusFlags) && (meter.statusFlags).length > 0) ? ((meter.statusFlags).map(a => ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status'
                    }
                    //add meter to array
                    ctMeters.push(obj);

                    //production
                    const production = obj.measurementType === 'Production';
                    if (production) {
                        this.feature.meters.production.supported = true;
                        this.feature.meters.production.enabled = obj.state;
                        this.feature.meters.production.phaseCount = obj.phaseCount;
                        this.feature.meters.production.voltageDivide = obj.phaseMode !== 'Split' ? obj.phaseCount : 1;
                    }

                    //consumption
                    const consumption = obj.measurementType === 'Consumption Net';
                    if (consumption) {
                        this.feature.meters.consumption.supported = true;
                        this.feature.meters.consumption.enabled = obj.state;
                        this.feature.meters.consumption.phaseCount = obj.phaseCount;
                        this.feature.meters.consumption.voltageDivide = obj.phaseMode !== 'Split' ? obj.phaseCount : 1;
                    }

                    //acBatterie
                    const acBatterie = obj.measurementType === 'Storage';
                    if (acBatterie) {
                        this.feature.meters.acBatterie.supported = true;
                        this.feature.meters.acBatterie.enabled = obj.state;
                        this.feature.meters.acBatterie.voltageDivide = obj.phaseMode !== 'Split' ? obj.phaseCount : 1;
                    }

                    //update characteristics
                    if (this.metersServices) {
                        this.metersServices[index]
                            .updateCharacteristic(Characteristic.EnphaseMeterState, obj.state)
                            .updateCharacteristic(Characteristic.EnphaseMeterPhaseMode, obj.phaseMode)
                            .updateCharacteristic(Characteristic.EnphaseMeterPhaseCount, obj.phaseCount)
                            .updateCharacteristic(Characteristic.EnphaseMeterMeteringStatus, obj.meteringStatus)
                            .updateCharacteristic(Characteristic.EnphaseMeterStatusFlags, obj.statusFlags);
                    }
                });

                //add ct meters to pv meters
                this.pv.meters = ctMeters;

                //meters installed
                this.feature.meters.installed = true;
                this.feature.meters.count = meters.length;
            }

            //meters enabled
            const metersEnabled = this.pv.meters.some(meter => meter.state);

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('meters', meters) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Meters', meters) : false;
            return metersEnabled;
        } catch (error) {
            throw new Error(`Update meters error: ${error}`);
        };
    };

    async updateMetersReading() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting meters reading`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.InternalMeterReadings);
            const metersReading = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Meters reading:`, metersReading) : false;

            //meters reading count
            const metersReadingSupported = metersReading.length > 0;
            if (metersReadingSupported) {

                //meters reading summary data
                metersReading.forEach((meter, index) => {
                    const metersVoltageDivide = (this.pv.meters[index].phaseMode === 'Split') ? 1 : this.pv.meters[index].phaseCount;
                    const obj = {
                        timeStamp: new Date(meter.timestamp * 1000).toLocaleString(),
                        actEnergyDlvd: meter.actEnergyDlvd,
                        actEnergyRcvd: meter.actEnergyRcvd,
                        apparentEnergy: meter.apparentEnergy,
                        reactEnergyLagg: meter.reactEnergyLagg,
                        reactEnergyLead: meter.reactEnergyLead,
                        instantaneousDemand: meter.instantaneousDemand,
                        activePower: meter.activePower / 1000,
                        apparentPower: meter.apparentPower / 1000,
                        reactivePower: meter.reactivePower / 1000,
                        pwrFactor: meter.pwrFactor,
                        voltage: meter.voltage / metersVoltageDivide,
                        current: meter.current,
                        freq: meter.freq,
                        channels: meter.channels ?? []
                    }
                    //add meter to pv object
                    this.pv.meters[index].readings = obj;

                    //update chaaracteristics
                    if (this.metersServices) {
                        this.metersServices[index]
                            .updateCharacteristic(Characteristic.EnphaseMeterReadingTime, obj.timeStamp)
                            .updateCharacteristic(Characteristic.EnphaseMeterActivePower, obj.activePower)
                            .updateCharacteristic(Characteristic.EnphaseMeterApparentPower, obj.apparentPower)
                            .updateCharacteristic(Characteristic.EnphaseMeterReactivePower, obj.reactivePower)
                            .updateCharacteristic(Characteristic.EnphaseMeterPwrFactor, obj.pwrFactor)
                            .updateCharacteristic(Characteristic.EnphaseMeterVoltage, obj.voltage)
                            .updateCharacteristic(Characteristic.EnphaseMeterCurrent, obj.current)
                            .updateCharacteristic(Characteristic.EnphaseMeterFreq, obj.freq);
                    }
                });

                //meters readings installed
                this.feature.meters.reading.installed = true;
                this.feature.meters.reading.count = metersReading.length;
            }

            //meters readings installed
            this.feature.meters.reading.supported = metersReadingSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('metersreading', metersReading) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Meters Reading', metersReading) : false;
            return true;
        } catch (error) {
            throw new Error(`Update meters reading error: ${error}`);
        };
    };

    async updateMicroinvertersStatus() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting microinverters status`) : false;
        try {
            const options = {
                method: 'GET',
                baseURL: this.url,
                headers: {
                    Accept: 'application/json'
                }
            }

            const response = this.pv.envoy.firmware7xx ? await this.axiosInstance(ApiUrls.InverterProduction) : await this.digestAuthEnvoy.request(ApiUrls.InverterProduction, options);
            const microinverters = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Microinverters status:`, microinverters) : false;

            //microinverters devices count
            const microinvertersStatusSupported = microinverters.length > 0;
            if (microinvertersStatusSupported) {

                //microinverters power
                this.pv.microinverters.forEach((microinverter, index) => {
                    const index1 = microinverters.findIndex(device => device.serialNumber == microinverter.serialNumber);
                    const microinverterProduction = microinverters[index1];
                    const obj = {
                        type: microinverterProduction.devType ?? 'Microinverter',
                        lastReportDate: new Date(microinverterProduction.lastReportDate * 1000).toLocaleString(),
                        lastReportWatts: parseInt(microinverterProduction.lastReportWatts) ?? 0,
                        maxReportWatts: parseInt(microinverterProduction.maxReportWatts) ?? 0,
                    }

                    //add microinverters power to pv object
                    this.pv.microinverters[index].status = obj;

                    //update chaaracteristics
                    if (this.microinvertersServices) {
                        this.microinvertersServices[index]
                            .updateCharacteristic(Characteristic.EnphaseMicroinverterLastReportDate, obj.lastReportDate)
                            .updateCharacteristic(Characteristic.EnphaseMicroinverterPower, obj.lastReportWatts)
                            .updateCharacteristic(Characteristic.EnphaseMicroinverterPowerMax, obj.maxReportWatts)
                    }
                });
            }

            //microinverters supported
            this.feature.microinverters.status.supported = microinvertersStatusSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('microinverters', microinverters) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Microinverters', microinverters) : false;
            return true;
        } catch (error) {
            throw new Error(`Update microinverters status error: ${error}`);
        };
    };

    async updateProductionInverters() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting production inverters`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.InverterProductionSumm);
            const production = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Production inverters:`, production) : false;

            //microinverters summary 
            const productionKeys = Object.keys(production);
            const productionSupported = productionKeys.length > 0;
            if (productionSupported) {
                const productionMicroinverters = {
                    energyToday: production.wattHoursToday,
                    energyTodayKw: production.wattHoursToday / 1000,
                    energyLastSevenDays: production.wattHoursSevenDays,
                    energyLastSevenDaysKw: production.wattHoursSevenDays / 1000,
                    energyLifeTime: (production.wattHoursLifetime + this.energyProductionLifetimeOffset),
                    energyLifeTimeKw: (production.wattHoursLifetime + this.energyProductionLifetimeOffset) / 1000,
                    energyState: production.wattHoursToday > 0,
                    power: production.wattsNow,
                    powerKw: production.wattsNow / 1000,
                    powerState: production.wattsNow > 0
                };
                this.pv.production.microinverters = productionMicroinverters;
            }

            //production microinverters supported
            this.feature.production.microinverters.supported = productionSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('production', production) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Production', production) : false;
            return true;
        } catch (error) {
            throw new Error(`Update production inverters error: ${error}`);
        };
    };

    async updateProductionCt() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting production ct`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.SystemReadingStats);
            const productionCtData = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Production ct:`, productionCtData) : false;

            //get enabled devices
            const metersProductionEnabled = this.feature.meters.production.enabled;
            const metersProductionVoltageDivide = this.feature.meters.production.voltageDivide;
            const metersConsumptionEnabled = this.feature.meters.consumption.enabled;
            const metersConsumpionVoltageDivide = this.feature.meters.consumption.voltageDivide;
            const acBatteriesInstalled = this.feature.acBatteries.installed;

            //production ct
            const productionCtKeys = Object.keys(productionCtData);
            const productionCtExist = productionCtKeys.includes('production');
            if (productionCtExist) {
                //inverters data 0
                const productionCtInverters = productionCtData.production[0] ?? {};
                const productionCtInvertersKeys = Object.keys(productionCtInverters);
                const productionCtInvertersSupported = productionCtInvertersKeys.length > 0;
                if (productionCtInvertersSupported) {
                    const inverters = {
                        type: ApiCodes[productionCtInverters.type] ?? 'Unknown',
                        activeCount: productionCtInverters.activeCount,
                        readingTime: new Date(productionCtInverters.readingTime * 1000).toLocaleString(),
                        power: productionCtInverters.wNow ?? 0, //watts
                        powerKw: (productionCtInverters.wNow ?? 0) / 1000, //kW
                        energyLifeTime: (productionCtInverters.whLifetime + this.energyProductionLifetimeOffset),
                        energyLifeTimeKw: (productionCtInverters.whLifetime + this.energyProductionLifetimeOffset) / 1000,
                    }
                    //add to pv object
                    this.pv.production.ct.inverters = inverters;
                }
                //production inverters supported
                this.feature.production.ct.inverters.supported = productionCtInvertersSupported;

                //production data 1
                const productionCtProduction = productionCtData.production[1] ?? {};
                const productionCtProductionKeys = Object.keys(productionCtProduction);
                const productionCtProductionSupported = productionCtProductionKeys.length > 0;
                if (productionCtProductionSupported) {
                    const storedProductionPower = this.pv.productionPowerPeak;
                    const production = {
                        type: metersProductionEnabled ? ApiCodes[productionCtProduction.type] : this.pv.production.ct.inverters.type,
                        activeCount: metersProductionEnabled ? productionCtProduction.activeCount : this.pv.production.ct.inverters.activeCount,
                        measurmentType: metersProductionEnabled ? ApiCodes[productionCtProduction.measurementType] : this.pv.production.ct.inverters.type,
                        readingTime: metersProductionEnabled ? new Date(productionCtProduction.readingTime * 1000).toLocaleString() : this.pv.production.ct.inverters.readingTime,
                        power: metersProductionEnabled ? productionCtProduction.wNow : this.pv.production.ct.inverters.power, //watts
                        powerKw: metersProductionEnabled ? productionCtProduction.wNow / 1000 : this.pv.production.ct.inverters.powerKw, //kW
                        powerState: metersProductionEnabled ? await this.scaleValue(productionCtProduction.wNow, 0, this.powerProductionSummary, 0, 100) > 0 : await this.scaleValue(this.pv.production.ct.inverters.power, 0, this.powerProductionSummary, 0, 100) > 0,
                        powerLevel: this.powerProductionSummary > 1 ? (metersProductionEnabled ? await this.scaleValue(productionCtProduction.wNow, 0, this.powerProductionSummary, 0, 100) : await this.scaleValue(this.pv.production.ct.inverters.power, 0, this.powerProductionSummary, 0, 100)) : 0,
                        powerPeak: metersProductionEnabled ? (productionCtProduction.wNow > storedProductionPower ? productionCtProduction.wNow : storedProductionPower) : (this.pv.production.ct.inverters.power > storedProductionPower ? this.pv.production.ct.inverters.power : storedProductionPower),
                        powerPeakKw: metersProductionEnabled ? (productionCtProduction.wNow > storedProductionPower ? productionCtProduction.wNow / 1000 : storedProductionPower / 1000) : (this.pv.production.ct.inverters.power > storedProductionPower ? this.pv.production.ct.inverters.powerKw : storedProductionPower / 1000),
                        powerPeakDetected: metersProductionEnabled ? productionCtProduction.wNow > storedProductionPower : this.pv.production.ct.inverters.power > storedProductionPower ?? false,
                        energyState: metersProductionEnabled ? productionCtProduction.whToday > 0 : this.pv.production.ct.inverters.energyToday > 0 ?? false,
                        energyLifeTime: metersProductionEnabled ? (productionCtProduction.whLifetime + this.energyProductionLifetimeOffset) : this.pv.production.ct.inverters.energyLifeTime ?? 0,
                        energyLifeTimeKw: metersProductionEnabled ? (productionCtProduction.whLifetime + this.energyProductionLifetimeOffset) / 1000 : this.pv.production.ct.inverters.energyLifeTimeKw ?? 0,
                        energyVarhLeadLifetime: metersProductionEnabled ? productionCtProduction.varhLeadLifetime / 1000 : 0,
                        energyVarhLagLifetime: metersProductionEnabled ? productionCtProduction.varhLagLifetime / 1000 : 0,
                        energyLastSevenDays: metersProductionEnabled ? productionCtProduction.whLastSevenDays : this.pv.production.microinverters.energyLastSevenDays ?? 0,
                        energyLastSevenDaysKw: metersProductionEnabled ? productionCtProduction.whLastSevenDays / 1000 : this.pv.production.microinverters.energyLastSevenDaysKw ?? 0,
                        energyToday: metersProductionEnabled ? productionCtProduction.whToday : this.pv.production.microinverters.energyToday ?? 0,
                        energyTodayKw: metersProductionEnabled ? productionCtProduction.whToday / 1000 : this.pv.production.microinverters.energyTodayKw ?? 0,
                        energyVahToday: metersProductionEnabled ? productionCtProduction.vahToday / 1000 : 0,
                        energyVarhLeadToday: metersProductionEnabled ? productionCtProduction.varhLeadToday / 1000 : 0,
                        energyVarhLagToday: metersProductionEnabled ? productionCtProduction.varhLagToday / 1000 : 0,
                        rmsCurrent: metersProductionEnabled ? productionCtProduction.rmsCurrent : 0,
                        rmsVoltage: metersProductionEnabled ? productionCtProduction.rmsVoltage / metersProductionVoltageDivide : 1,
                        reactivePower: metersProductionEnabled ? productionCtProduction.reactPwr / 1000 : 0,
                        apparentPower: metersProductionEnabled ? productionCtProduction.apprntPwr / 1000 : 0,
                        pwrFactor: metersProductionEnabled ? productionCtProduction.pwrFactor : 0
                    }

                    //debug
                    const debug1 = this.enableDebugMode ? this.emit('debug', `Production power state: ${production.powerState}`) : false;
                    const debug2 = this.enableDebugMode ? this.emit('debug', `Production power level: ${production.powerLevel} %`) : false;
                    const debug3 = this.enableDebugMode ? this.emit('debug', `Production power peak detected: ${production.powerPeakDetected}`) : false;
                    const debug4 = this.enableDebugMode ? this.emit('debug', `Production energy state: ${production.energyState}`) : false;

                    //update chaaracteristics
                    if (this.systemAccessoryActive) {
                        const state = production.powerState;
                        const level = production.powerLevel;
                        this.systemAccessoryActive.state = state;
                        this.systemAccessoryActive.level = level;

                        if (this.systemService) {
                            const characteristicType = this.systemAccessoryActive.characteristicType;
                            const characteristicType1 = this.systemAccessoryActive.characteristicType1;
                            this.systemService
                                .updateCharacteristic(characteristicType, state)
                                .updateCharacteristic(characteristicType1, level)
                        }
                    }

                    if (this.productionsService) {
                        this.productionsService
                            .updateCharacteristic(Characteristic.EnphaseReadingTime, production.readingTime)
                            .updateCharacteristic(Characteristic.EnphasePower, production.powerKw)
                            .updateCharacteristic(Characteristic.EnphasePowerMax, production.powerPeakKw)
                            .updateCharacteristic(Characteristic.EnphasePowerMaxDetected, production.powerPeakDetected)
                            .updateCharacteristic(Characteristic.EnphaseEnergyToday, production.energyTodayKw)
                            .updateCharacteristic(Characteristic.EnphaseEnergyLastSevenDays, production.energyLastSevenDaysKw)
                            .updateCharacteristic(Characteristic.EnphaseEnergyLifeTime, production.energyLifeTimeKw)
                            .updateCharacteristic(Characteristic.EnphasePowerMaxReset, false);
                        if (metersProductionEnabled) {
                            this.productionsService
                                .updateCharacteristic(Characteristic.EnphaseRmsCurrent, production.rmsCurrent)
                                .updateCharacteristic(Characteristic.EnphaseRmsVoltage, production.rmsVoltage)
                                .updateCharacteristic(Characteristic.EnphaseReactivePower, production.reactivePower)
                                .updateCharacteristic(Characteristic.EnphaseApparentPower, production.apparentPower)
                                .updateCharacteristic(Characteristic.EnphasePwrFactor, production.pwrFactor);
                        }
                    }

                    //sensor power
                    if (this.powerProductionStateActiveSensor) {
                        const state = production.powerState;
                        this.powerProductionStateActiveSensor.state = state;

                        if (this.powerProductionStateSensorService) {
                            const characteristicType = this.powerProductionStateActiveSensor.characteristicType;
                            this.powerProductionStateSensorService
                                .updateCharacteristic(characteristicType, state)
                        }
                    }

                    //sensors power
                    if (this.powerProductionLevelActiveSensorsCount > 0) {
                        for (let i = 0; i < this.powerProductionLevelActiveSensorsCount; i++) {
                            const powerLevel = this.powerProductionLevelActiveSensors[i].powerLevel;
                            const compareMode = this.powerProductionLevelActiveSensors[i].compareMode;
                            let state = false;
                            switch (compareMode) {
                                case 0:
                                    state = production.power > powerLevel;
                                    break;
                                case 1:
                                    state = production.power >= powerLevel;
                                    break;
                                case 2:
                                    state = production.power === powerLevel;
                                    break;
                                case 3:
                                    state = production.power < powerLevel;
                                    break;
                                case 4:
                                    state = production.power <= powerLevel;
                                    break;
                            }
                            this.powerProductionLevelActiveSensors[i].state = state;

                            if (this.powerProductionLevelSensorsServices) {
                                const characteristicType = this.powerProductionLevelActiveSensors[i].characteristicType;
                                this.powerProductionLevelSensorsServices[i]
                                    .updateCharacteristic(characteristicType, state)
                            }
                        }
                    }

                    //sensor energy
                    if (this.energyProductionStateActiveSensor) {
                        const state = production.energyState;
                        this.energyProductionStateActiveSensor.state = state;

                        if (this.energyProductionStateSensorService) {
                            const characteristicType = this.energyProductionStateActiveSensor.characteristicType;
                            this.energyProductionStateSensorService
                                .updateCharacteristic(characteristicType, state)
                        }
                    }

                    //sensors energy
                    if (this.energyProductionLevelActiveSensorsCount > 0) {
                        for (let i = 0; i < this.energyProductionLevelActiveSensorsCount; i++) {
                            const energyLevel = this.energyProductionLevelActiveSensors[i].energyLevel;
                            const compareMode = this.energyProductionLevelActiveSensors[i].compareMode;
                            let state = false;
                            switch (compareMode) {
                                case 0:
                                    state = production.energyToday > energyLevel;
                                    break;
                                case 1:
                                    state = production.energyToday >= energyLevel;
                                    break;
                                case 2:
                                    state = production.energyToday === energyLevel;
                                    break;
                                case 3:
                                    state = production.energyToday < energyLevel;
                                    break;
                                case 4:
                                    state = production.energyToday <= energyLevel;
                                    break;
                            }
                            this.energyProductionLevelActiveSensors[i].state = state;

                            if (this.energyProductionLevelSensorsServices) {
                                const characteristicType = this.energyProductionLevelActiveSensors[i].characteristicType;
                                this.energyProductionLevelSensorsServices[i]
                                    .updateCharacteristic(characteristicType, state)
                            }
                        }
                    }

                    //add to pv object
                    this.pv.production.ct.production = production;
                    this.pv.powerState = production.powerState;
                    this.pv.powerLevel = production.powerLevel;
                    this.pv.productionPowerPeak = production.powerPeak;
                }
                //production ct production supported
                this.feature.production.ct.production.supported = productionCtProductionSupported;
            }

            //consumption data 2
            const productionCtConsumptionExist = productionCtKeys.includes('consumption');
            const productionCtConsumptionSupported = productionCtConsumptionExist ? productionCtData.consumption.length > 0 : false;
            if (productionCtConsumptionSupported && metersConsumptionEnabled) {
                const consumptionsObj = [];
                const consumptions = productionCtData.consumption ?? [];
                consumptions.forEach((consumption, index) => {
                    const measurementType = ApiCodes[consumption.measurementType];
                    const storedConsumptionPower = measurementType === 'Consumption Total' ? this.pv.consumptionTotalPowerPeak : measurementType === 'Consumption Net' ? this.pv.consumptionNetPowerPeak : 0;
                    const consumptionLifetimeOffset = [this.energyConsumptionTotalLifetimeOffset, this.energyConsumptionNetLifetimeOffset][index];
                    const obj = {
                        type: ApiCodes[consumption.type],
                        measurmentType: measurementType,
                        activeCount: consumption.activeCount,
                        readingTime: new Date(consumption.readingTime * 1000).toLocaleString(),
                        power: consumption.wNow ?? 0, //watts
                        powerKw: consumption.wNow / 1000, //kW
                        powerState: consumption.wNow > 0 ?? false,
                        powerPeak: consumption.wNow > storedConsumptionPower ? consumption.wNow : storedConsumptionPower,
                        powerPeakKw: consumption.wNow > storedConsumptionPower ? consumption.wNow / 1000 : storedConsumptionPower / 1000,
                        powerPeakDetected: consumption.wNow > storedConsumptionPower ?? 0,
                        energyState: consumption.whToday > 0 ?? false,
                        energyLifeTime: (consumption.whLifetime + consumptionLifetimeOffset),
                        energyLifeTimeKw: (consumption.whLifetime + consumptionLifetimeOffset) / 1000,
                        energyVarhLeadLifetime: consumption.varhLeadLifetime / 1000,
                        energyVarhLagLifetime: consumption.varhLagLifetime / 1000,
                        energyVahLifetime: consumption.vahLifetime / 1000,
                        energyLastSevenDays: consumption.whLastSevenDays,
                        energyLastSevenDaysKw: consumption.whLastSevenDays / 1000,
                        energyToday: consumption.whToday,
                        energyTodayKw: consumption.whToday / 1000,
                        energyVahToday: consumption.vahToday / 1000,
                        energyVarhLeadToday: consumption.varhLeadToday / 1000,
                        energyVarhLagToday: consumption.varhLagToday / 1000,
                        rmsCurrent: consumption.rmsCurrent,
                        rmsVoltage: consumption.rmsVoltage / metersConsumpionVoltageDivide,
                        reactivePower: consumption.reactPwr / 1000,
                        apparentPower: consumption.apprntPwr / 1000,
                        pwrFactor: consumption.pwrFactor
                    }
                    //push to array
                    consumptionsObj.push(obj);

                    //update characteristics
                    if (this.consumptionsServices) {
                        this.consumptionsServices[index]
                            .updateCharacteristic(Characteristic.EnphaseReadingTime, obj.readingTime)
                            .updateCharacteristic(Characteristic.EnphasePower, obj.powerKw)
                            .updateCharacteristic(Characteristic.EnphasePowerMax, obj.powerPeakKw)
                            .updateCharacteristic(Characteristic.EnphasePowerMaxDetected, obj.powerPeakDetected)
                            .updateCharacteristic(Characteristic.EnphaseEnergyToday, obj.energyTodayKw)
                            .updateCharacteristic(Characteristic.EnphaseEnergyLastSevenDays, obj.energyLastSevenDaysKw)
                            .updateCharacteristic(Characteristic.EnphaseEnergyLifeTime, obj.energyLifeTimeKw)
                            .updateCharacteristic(Characteristic.EnphaseRmsCurrent, obj.rmsCurrent)
                            .updateCharacteristic(Characteristic.EnphaseRmsVoltage, obj.rmsVoltage)
                            .updateCharacteristic(Characteristic.EnphaseReactivePower, obj.reactivePower)
                            .updateCharacteristic(Characteristic.EnphaseApparentPower, obj.apparentPower)
                            .updateCharacteristic(Characteristic.EnphasePwrFactor, obj.pwrFactor)
                            .updateCharacteristic(Characteristic.EnphasePowerMaxReset, false);
                    }

                    //sensors total
                    if (measurementType === 'Consumption Total') {
                        //store power peak in pv object
                        this.pv.consumptionTotalPowerPeak = obj.powerPeakKw;

                        //debug
                        const debug1 = this.enableDebugMode ? this.emit('debug', `${measurementType} power state: ${obj.powerState}`) : false;
                        const debug2 = this.enableDebugMode ? this.emit('debug', `${measurementType} energy state: ${obj.energyState}`) : false;

                        //power
                        if (this.powerConsumptionTotalStateActiveSensor) {
                            const state = obj.powerState;
                            this.powerConsumptionTotalStateActiveSensor.state = state;

                            if (this.powerConsumptionTotalStateSensorService) {
                                const characteristicType = this.powerConsumptionTotalStateActiveSensor.characteristicType;
                                this.powerConsumptionTotalStateSensorService
                                    .updateCharacteristic(characteristicType, state)
                            }
                        }
                        if (this.powerConsumptionTotalLevelActiveSensorsCount > 0) {
                            for (let i = 0; i < this.powerConsumptionTotalLevelActiveSensorsCount; i++) {
                                const powerLevel = this.powerConsumptionTotalLevelActiveSensors[i].powerLevel;
                                const compareMode = this.powerConsumptionTotalLevelActiveSensors[i].compareMode;
                                let state = false;
                                switch (compareMode) {
                                    case 0:
                                        state = obj.power > powerLevel;
                                        break;
                                    case 1:
                                        state = obj.power >= powerLevel;
                                        break;
                                    case 2:
                                        state = obj.power === powerLevel;
                                        break;
                                    case 3:
                                        state = obj.power < powerLevel;
                                        break;
                                    case 4:
                                        state = obj.power <= powerLevel;
                                        break;
                                }
                                this.powerConsumptionTotalLevelActiveSensors[i].state = state;

                                if (this.powerConsumptionTotalLevelSensorsServices) {
                                    const characteristicType = this.powerConsumptionTotalLevelActiveSensors[i].characteristicType;
                                    this.powerConsumptionTotalLevelSensorsServices[i]
                                        .updateCharacteristic(characteristicType, state)
                                }
                            }
                        }

                        //energy
                        if (this.energyConsumptionTotalStateActiveSensor) {
                            const state = obj.energyState;
                            this.energyConsumptionTotalStateActiveSensor.state = state;

                            if (this.energyConsumptionTotalStateSensorService) {
                                const characteristicType = this.energyConsumptionTotalStateActiveSensor.characteristicType;
                                this.energyConsumptionTotalStateSensorService
                                    .updateCharacteristic(characteristicType, state)
                            }
                        }
                        if (this.energyConsumptionTotalLevelActiveSensorsCount > 0) {
                            for (let i = 0; i < this.energyConsumptionTotalLevelActiveSensorsCount; i++) {
                                const energyLevel = this.energyConsumptionTotalLevelActiveSensors[i].energyLevel;
                                const compareMode = this.energyConsumptionTotalLevelActiveSensors[i].compareMode;
                                let state = false;
                                switch (compareMode) {
                                    case 0:
                                        state = obj.energyToday > energyLevel;
                                        break;
                                    case 1:
                                        state = obj.energyToday >= energyLevel;
                                        break;
                                    case 2:
                                        state = obj.energyToday === energyLevel;
                                        break;
                                    case 3:
                                        state = obj.energyToday < energyLevel;
                                        break;
                                    case 4:
                                        state = obj.energyToday <= energyLevel;
                                        break;
                                }
                                this.energyConsumptionTotalLevelActiveSensors[i].state = state;

                                if (this.energyConsumptionTotalLevelSensorsServices) {
                                    const characteristicType = this.energyConsumptionTotalLevelActiveSensors[i].characteristicType;
                                    this.energyConsumptionTotalLevelSensorsServices[i]
                                        .updateCharacteristic(characteristicType, state)
                                }
                            }
                        }
                    }

                    //sensors net
                    if (measurementType === 'Consumption Net') {
                        //store power peak in pv object
                        this.pv.consumptionNetPowerPeak = obj.powerPeakKw;

                        //debug
                        const debug1 = this.enableDebugMode ? this.emit('debug', `${measurementType} power state: ${obj.powerState}`) : false;
                        const debug2 = this.enableDebugMode ? this.emit('debug', `${measurementType} energy state: ${obj.energyState}`) : false;

                        //power
                        if (this.powerConsumptionNetStateActiveSensor) {
                            const state = obj.powerState;
                            this.powerConsumptionNetStateActiveSensor.state = state;

                            if (this.powerConsumptionNetStateSensorService) {
                                const characteristicType = this.powerConsumptionNetStateActiveSensor.characteristicType;
                                this.powerConsumptionNetStateSensorService
                                    .updateCharacteristic(characteristicType, state)
                            }
                        }
                        if (this.powerConsumptionNetLevelActiveSensorsCount > 0) {
                            for (let i = 0; i < this.powerConsumptionNetLevelActiveSensorsCount; i++) {
                                const powerLevel = this.powerConsumptionNetLevelActiveSensors[i].powerLevel;
                                const compareMode = this.powerConsumptionNetLevelActiveSensors[i].compareMode;
                                let state = false;
                                switch (compareMode) {
                                    case 0:
                                        state = obj.power > powerLevel;
                                        break;
                                    case 1:
                                        state = obj.power >= powerLevel;
                                        break;
                                    case 2:
                                        state = obj.power === powerLevel;
                                        break;
                                    case 3:
                                        state = obj.power < powerLevel;
                                        break;
                                    case 4:
                                        state = obj.power <= powerLevel;
                                        break;
                                }
                                this.powerConsumptionNetLevelActiveSensors[i].state = state;

                                if (this.powerConsumptionNetLevelSensorsServices) {
                                    const characteristicType = this.powerConsumptionNetLevelActiveSensors[i].characteristicType;
                                    this.powerConsumptionNetLevelSensorsServices[i]
                                        .updateCharacteristic(characteristicType, state)
                                }
                            }
                        }

                        //energy
                        if (this.energyConsumptionNetStateActiveSensor) {
                            const state = obj.energyState;
                            this.energyConsumptionNetStateActiveSensor.state = state;

                            if (this.energyConsumptionNetStateSensorService) {
                                const characteristicType = this.energyConsumptionNetStateActiveSensor.characteristicType;
                                this.energyConsumptionNetStateSensorService
                                    .updateCharacteristic(characteristicType, state)
                            }
                        }
                        if (this.energyConsumptionNetLevelActiveSensorsCount > 0) {
                            for (let i = 0; i < this.energyConsumptionNetLevelActiveSensorsCount; i++) {
                                const energyLevel = this.energyConsumptionNetLevelActiveSensors[i].energyLevel;
                                const compareMode = this.energyConsumptionNetLevelActiveSensors[i].compareMode;
                                let state = false;
                                switch (compareMode) {
                                    case 0:
                                        state = obj.energyToday > energyLevel;
                                        break;
                                    case 1:
                                        state = obj.energyToday >= energyLevel;
                                        break;
                                    case 2:
                                        state = obj.energyToday === energyLevel;
                                        break;
                                    case 3:
                                        state = obj.energyToday < energyLevel;
                                        break;
                                    case 4:
                                        state = obj.energyToday <= energyLevel;
                                        break;
                                }
                                this.energyConsumptionNetLevelActiveSensors[i].state = state;

                                if (this.energyConsumptionNetLevelSensorsServices) {
                                    const characteristicType = this.energyConsumptionNetLevelActiveSensors[i].characteristicType;
                                    this.energyConsumptionNetLevelSensorsServices[i]
                                        .updateCharacteristic(characteristicType, state)
                                }
                            }
                        }
                    }
                })
                //add obj to array
                this.pv.production.ct.consumption = consumptionsObj;
            };
            //consumption supported
            this.feature.production.ct.consumption.supported = productionCtConsumptionSupported

            //ac btteries summary 3
            const productionCtAcBatterieExist = productionCtKeys.includes('storage');
            const productionCtAcBatterieSupported = productionCtAcBatterieExist && Array.isArray(productionCtData.storage);
            if (productionCtAcBatterieSupported && acBatteriesInstalled) {
                const acBatteries = productionCtData.storage[0] ?? {};
                const acBatterie = {
                    type: ApiCodes[acBatteries.type] ?? 'AC Batterie',
                    activeCount: acBatteries.activeCount ?? 0,
                    readingTime: new Date(acBatteries.readingTime * 1000).toLocaleString() ?? '',
                    power: acBatteries.wNow ?? 0,
                    powerKw: (acBatteries.wNow ?? 0) / 1000,
                    energy: (acBatteries.whNow + this.acBatterieStorageOffset) ?? 0,
                    energyKw: ((acBatteries.whNow + this.acBatterieStorageOffset) ?? 0) / 1000,
                    chargeStatus: ApiCodes[acBatteries.state] ?? 'Unknown',
                    chargingState: acBatteries.state === 'discharging' ? 0 : acBatteries.state === 'charging' ? 1 : 2,
                    percentFullSum: await this.scaleValue(acBatterie.energy, 0, acBatterie.activeCount * 1.5, 0, 100) ?? 0,
                    energyStateSum: acBatteries.whNow > 0 ?? false
                };

                //update chaaracteristics
                if (this.acBatterieBackupLevelSummaryActiveAccessory) {
                    const serviceBattery = this.acBatterieBackupLevelSummaryActiveAccessory.displayType === 5;
                    const backupLevel = acBatterie.percentFullSum > this.acBatterieBackupLevelSummaryActiveAccessory.minSoc ? acBatterie.percentFullSum : 0;
                    const state = serviceBattery ? backupLevel < this.acBatterieBackupLevelSummaryActiveAccessory.minSoc : backupLevel > this.acBatterieBackupLevelSummaryActiveAccessory.minSoc;
                    this.acBatterieBackupLevelSummaryActiveAccessory.state = state;
                    this.acBatterieBackupLevelSummaryActiveAccessory.backupLevel = backupLevel;

                    if (this.acBatteriesSummaryLevelAndStateService) {
                        const characteristicType = this.acBatterieBackupLevelSummaryActiveAccessory.characteristicType;
                        const characteristicType1 = this.acBatterieBackupLevelSummaryActiveAccessory.characteristicType1;
                        this.acBatteriesSummaryLevelAndStateService
                            .updateCharacteristic(characteristicType, state)
                            .updateCharacteristic(characteristicType1, backupLevel)
                    }
                }

                if (this.acBatterieSummaryService) {
                    this.acBatterieSummaryService
                        .updateCharacteristic(Characteristic.EnphaseAcBatterieSummaryReadingTime, acBatterie.readingTime)
                        .updateCharacteristic(Characteristic.EnphaseAcBatterieSummaryPower, acBatterie.powerKw)
                        .updateCharacteristic(Characteristic.EnphaseAcBatterieSummaryEnergy, acBatterie.energyKw)
                        .updateCharacteristic(Characteristic.EnphaseAcBatterieSummaryPercentFull, acBatterie.percentFullSum)
                        .updateCharacteristic(Characteristic.EnphaseAcBatterieSummaryActiveCount, acBatterie.activeCount)
                        .updateCharacteristic(Characteristic.EnphaseAcBatterieSummaryState, acBatterie.chargeStatus);
                }

                //add  ac batterie summary to pv object
                this.pv.production.ct.acBatterie = acBatterie;
            };
            //ac batterie supported
            this.feature.production.ct.acBatterie.supported = productionCtAcBatterieSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('productionct', productionCtData) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Production CT', productionCtData) : false;
            return true;
        } catch (error) {
            throw new Error(`Update production ct error: ${error}`);
        };
    };

    async updateProductionAll() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting production all`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.AllProductions);
            const productionAll = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Production all: `, productionAll) : false;

            //production all summary 
            const productionAllKeys = Object.keys(productionAll);
            const productionSupported = productionAllKeys.includes('production')
            const consumptionSupported = productionAllKeys.includes('consumption')

            //process production data if available
            if (productionSupported) {
                const productionsKeys = Object.keys(productionAll.production)
                productionsKeys.forEach((type) => {
                    const productionData = productionAll.production[type];
                    if (productionData) {
                        const obj = {
                            energyToday: productionData.wattHoursToday,
                            energyTodayKw: productionData.wattHoursToday / 1000,
                            energyLastSevenDays: productionData.wattHoursSevenDays,
                            energyLastSevenDaysKw: productionData.wattHoursSevenDays / 1000,
                            energyLifeTime: (productionData.wattHoursLifetime + this.energyProductionLifetimeOffset),
                            energyLifeTimeKw: (productionData.wattHoursLifetime + this.energyProductionLifetimeOffset) / 1000,
                            energyState: productionData.wattHoursToday > 0,
                            power: productionData.wattsNow,
                            powerKw: productionData.wattsNow / 1000,
                            powerState: productionData.wattsNow > 0
                        };
                        this.pv.production.all.production[type] = obj;
                    }
                });
            }

            //set production support flag
            this.feature.production.all.production.supported = productionSupported;

            //process consumption data if available
            if (consumptionSupported) {
                const consumptionData = productionAll.consumption.eim;
                if (consumptionData) {
                    const obj = {
                        energyToday: consumptionData.wattHoursToday,
                        energyTodayKw: consumptionData.wattHoursToday / 1000,
                        energyLastSevenDays: consumptionData.wattHoursSevenDays,
                        energyLastSevenDaysKw: consumptionData.wattHoursSevenDays / 1000,
                        energyLifeTime: (consumptionData.wattHoursLifetime + this.energyConsumptionNetLifetimeOffset),
                        energyLifeTimeKw: (consumptionData.wattHoursLifetime + this.energyConsumptionNetLifetimeOffset) / 1000,
                        energyState: consumptionData.wattHoursToday > 0,
                        power: consumptionData.wattsNow,
                        powerKw: consumptionData.wattsNow / 1000,
                        powerState: consumptionData.wattsNow > 0
                    };
                    this.pv.production.all.consumption.eim = obj;
                }
            }

            //set consumption support flag
            this.feature.production.all.consumption.supported = consumptionSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('productionall', productionAll) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Production All', productionAll) : false;
            return true;
        } catch (error) {
            throw new Error(`Update production all error: ${error}`);
        };
    };

    async updateProductionState() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting production state`) : false;
        try {
            const options = {
                method: 'GET',
                baseURL: this.url,
                headers: {
                    Accept: 'application/json'
                }
            }

            const url = ApiUrls.PowerForcedModeGetPut.replace("EID", this.pv.envoy.devId);
            const response = this.pv.envoy.firmware7xx ? await this.axiosInstance(url) : await this.digestAuthInstaller.request(url, options);
            const productionState = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Power mode:`, productionState) : false;

            //power production state
            const productionStateKeys = Object.keys(productionState);
            const productionStateSupported = productionStateKeys.includes('powerForcedOff');
            if (productionStateSupported) {

                //update power production control state
                const state = productionState.powerForcedOff === false;
                this.pv.productionState = state;

                //update chaaracteristics
                if (this.envoyService) {
                    this.envoyService
                        .updateCharacteristic(Characteristic.EnphaseEnvoyProductionPowerMode, state)
                }

                if (this.productionStateActiveControl) {
                    this.productionStateActiveControl.state = state;

                    if (this.productionStateControlService) {
                        const characteristicType = this.productionStateActiveControl.characteristicType;
                        this.productionStateControlService
                            .updateCharacteristic(characteristicType, state)
                    }
                }

                if (this.productionStateActiveSensor) {
                    this.productionStateActiveSensor.state = state;

                    if (this.productionStateSensorService) {
                        const characteristicType = this.productionStateActiveSensor.characteristicType;
                        this.productionStateSensorService
                            .updateCharacteristic(characteristicType, state)
                    }
                }
            }

            //power production state supported
            this.feature.productionState.supported = productionStateSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('powermode', productionState) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Power Mode', productionState) : false;
            return true;
        } catch (error) {
            this.emit('warn', `Update production state error: ${error}, dont worry all working correct, only the production state monitoring sensor and comtrol will not be displayed`);
        };
    };

    async updateEnsembleInventory() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting ensemble inventory`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.EnsembleInventory);
            const ensembleInventory = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Ensemble inventory:`, ensembleInventory) : false;

            //ensemble inventory devices count
            const ensembleSupported = ensembleInventory.length > 0;
            if (ensembleSupported) {

                //encharges
                const ensembleInventoryKeys = ensembleInventory.map(device => device.type);
                const enchargesSupported = ensembleInventoryKeys.includes('ENCHARGE');
                const enchargesData = enchargesSupported ? ensembleInventory[0].devices : [];
                const enchargesInstalled = enchargesData.length > 0;
                if (enchargesInstalled) {
                    const enchargesArr = [];
                    const enchargesPercentFullSummary = [];
                    const type = ApiCodes[ensembleInventory[0].type];
                    enchargesData.forEach((encharge, index) => {
                        const obj = {
                            type: type,
                            partNumber: PartNumbers[encharge.part_num] ?? encharge.part_num,
                            serialNumber: encharge.serial_num,
                            installed: new Date(encharge.installed * 1000).toLocaleString(),
                            deviceStatus: (Array.isArray(encharge.device_status) && (encharge.device_status).length > 0) ? ((encharge.device_status).map(a => ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
                            chargingState: encharge.device_status === 'discharging' ? 0 : encharge.device_status === 'charging' ? 1 : 2,
                            lastReportDate: new Date(encharge.last_rpt_date * 1000).toLocaleString(),
                            adminState: encharge.admin_state,
                            adminStateStr: ApiCodes[encharge.admin_state_str] ?? 'Unknown',
                            createdDate: new Date(encharge.created_date * 1000).toLocaleString(),
                            imgLoadDate: new Date(encharge.img_load_date * 1000).toLocaleString(),
                            imgPnumRunning: encharge.img_pnum_running,
                            bmuFwVersion: encharge.bmu_fw_version,
                            operating: encharge.operating === true ?? false,
                            communicating: encharge.communicating === true,
                            sleepEnabled: encharge.sleep_enabled,
                            percentFull: encharge.percentFull ?? 0,
                            temperature: encharge.temperature ?? 0,
                            maxCellTemp: encharge.maxCellTemp ?? 0,
                            reportedEncGridState: ApiCodes[encharge.reported_enc_grid_state] ?? 'Unknown',
                            commLevelSubGhz: encharge.comm_level_sub_ghz * 20 ?? 0,
                            commLevel24Ghz: encharge.comm_level_2_4_ghz * 20 ?? 0,
                            ledStatus: LedStatus[encharge.led_status] ?? encharge.led_status,
                            dcSwitchOff: encharge.dc_switch_off,
                            rev: encharge.encharge_rev,
                            capacity: encharge.encharge_capacity / 1000, //in kWh
                            phase: encharge.phase ?? 'Unknown',
                            derIndex: encharge.der_index ?? 0
                        }
                        //push to array
                        enchargesArr.push(obj);

                        //encharges percent full summary
                        enchargesPercentFullSummary.push(obj.percentFull);

                        //update chaaracteristics
                        if (this.enchargeBackupLevelActiveAccessory) {
                            const lowBatteryState = obj.percentFull < this.enchargeBackupLevelActiveAccessory.minSoc;
                            const backupLevel = obj.percentFull;
                            const chargingState = obj.chargingState;

                            if (this.enchargesLevelAndStateServices) {
                                const characteristicType = this.enchargeBackupLevelActiveAccessory.characteristicType;
                                const characteristicType1 = this.enchargeBackupLevelActiveAccessory.characteristicType1;
                                const characteristicType2 = this.enchargeBackupLevelActiveAccessory.characteristicType2;
                                this.enchargesLevelAndStateServices[index]
                                    .updateCharacteristic(characteristicType, lowBatteryState)
                                    .updateCharacteristic(characteristicType1, backupLevel)
                                    .updateCharacteristic(characteristicType2, chargingState);
                            }
                        }

                        if (this.enchargesServices) {
                            this.enchargesServices[index]
                                .updateCharacteristic(Characteristic.EnphaseEnchargeStatus, obj.deviceStatus)
                                .updateCharacteristic(Characteristic.EnphaseEnchargeLastReportDate, obj.lastReportDate)
                                .updateCharacteristic(Characteristic.EnphaseEnchargeAdminStateStr, obj.adminStateStr)
                                .updateCharacteristic(Characteristic.EnphaseEnchargeOperating, obj.operating)
                                .updateCharacteristic(Characteristic.EnphaseEnchargeCommunicating, obj.communicating)
                                .updateCharacteristic(Characteristic.EnphaseEnchargeSleepEnabled, obj.sleepEnabled)
                                .updateCharacteristic(Characteristic.EnphaseEnchargePercentFull, obj.percentFull)
                                .updateCharacteristic(Characteristic.EnphaseEnchargeTemperature, obj.temperature)
                                .updateCharacteristic(Characteristic.EnphaseEnchargeMaxCellTemp, obj.maxCellTemp)
                                .updateCharacteristic(Characteristic.EnphaseEnchargeCommLevelSubGhz, obj.commLevelSubGhz)
                                .updateCharacteristic(Characteristic.EnphaseEnchargeCommLevel24Ghz, obj.commLevel24Ghz)
                                .updateCharacteristic(Characteristic.EnphaseEnchargeLedStatus, obj.ledStatus)
                                .updateCharacteristic(Characteristic.EnphaseEnchargeDcSwitchOff, obj.dcSwitchOff)
                                .updateCharacteristic(Characteristic.EnphaseEnchargeRev, obj.rev)
                                .updateCharacteristic(Characteristic.EnphaseEnchargeCapacity, obj.capacity);
                            if (this.feature.arfProfile.supported) {
                                this.enchargesServices[index]
                                    .updateCharacteristic(Characteristic.EnphaseEnchargeGridProfile, this.pv.arfProfile.name);
                            }
                        }
                    });

                    //calculate encharges percent full summ 0 - 100%
                    const percentFullSum = enchargesPercentFullSummary.reduce((total, num) => total + num, 0) / enchargesData.length;
                    this.ensemble.encharges.percentFullSum = percentFullSum;
                    this.ensemble.encharges.energyStateSum = percentFullSum > 0;

                    //update chaaracteristics
                    if (this.enchargeBackupLevelSummaryActiveAccessory) {
                        const serviceBattery = this.enchargeBackupLevelSummaryActiveAccessory.displayType === 5;
                        const backupLevel = percentFullSum > this.enchargeBackupLevelSummaryActiveAccessory.minSoc ? percentFullSum : 0;
                        const state = serviceBattery ? backupLevel < this.enchargeBackupLevelSummaryActiveAccessory.minSoc : backupLevel > this.enchargeBackupLevelSummaryActiveAccessory.minSoc;
                        this.enchargeBackupLevelSummaryActiveAccessory.state = state;
                        this.enchargeBackupLevelSummaryActiveAccessory.backupLevel = backupLevel;

                        if (this.enchargeSummaryLevelAndStateService) {
                            const characteristicType = this.enchargeBackupLevelSummaryActiveAccessory.characteristicType;
                            const characteristicType1 = this.enchargeBackupLevelSummaryActiveAccessory.characteristicType1;
                            this.enchargeSummaryLevelAndStateService
                                .updateCharacteristic(characteristicType, state)
                                .updateCharacteristic(characteristicType1, backupLevel)
                        }
                    }

                    //add obj to array
                    this.ensemble.encharges.devices = enchargesArr;
                }
                //encharges
                this.feature.encharges.supported = enchargesSupported;
                this.feature.encharges.installed = enchargesInstalled;
                this.feature.encharges.count = enchargesData.length;

                //enpowers
                const enpowersSupported = ensembleInventoryKeys.includes('ENPOWER');
                const enpowersData = enpowersSupported ? ensembleInventory[1].devices : [];
                const enpowersInstalled = enpowersData.length > 0;
                if (enpowersInstalled) {
                    const enpowesrArr = [];
                    const type = ApiCodes[ensembleInventory[1].type];
                    enpowersData.forEach((enpower, index) => {
                        const obj = {
                            type: type,
                            partNumber: PartNumbers[enpower.part_num] ?? enpower.part_num,
                            serialNumber: enpower.serial_num,
                            installed: new Date(enpower.installed * 1000).toLocaleString(),
                            deviceStatus: (Array.isArray(enpower.device_status) && (enpower.device_status).length > 0) ? ((enpower.device_status).map(a => ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
                            lastReportDate: new Date(enpower.last_rpt_date * 1000).toLocaleString(),
                            adminState: enpower.admin_state,
                            adminStateStr: ApiCodes[enpower.admin_state_str] ?? 'Unknown',
                            createdDate: new Date(enpower.created_date * 1000).toLocaleString(),
                            imgLoadDate: new Date(enpower.img_load_date * 1000).toLocaleString(),
                            imgPnumRunning: enpower.img_pnum_running,
                            communicating: enpower.communicating === true,
                            temperature: enpower.temperature ?? 0,
                            commLevelSubGhz: enpower.comm_level_sub_ghz * 20 ?? 0,
                            commLevel24Ghz: enpower.comm_level_2_4_ghz * 20 ?? 0,
                            mainsAdminState: ApiCodes[enpower.mains_admin_state] ?? 'Unknown',
                            mainsAdminStateBool: enpower.mains_admin_state === 'closed' ?? false,
                            mainsOperState: ApiCodes[enpower.mains_oper_state] ?? 'Unknown',
                            mainsOperStateBool: enpower.mains_oper_state === 'closed' ?? false,
                            enpwrGridMode: enpower.Enpwr_grid_mode ?? 'Unknown',
                            enpwrGridModeTranslated: ApiCodes[enpower.Enpwr_grid_mode] ?? enpower.Enpwr_grid_mode,
                            enpwrGridStateBool: enpower.mains_admin_state === 'closed' ?? false,
                            enchgGridMode: enpower.Enchg_grid_mode ?? 'Unknown',
                            enchgGridModeTranslated: ApiCodes[enpower.Enchg_grid_mode] ?? enpower.Enchg_grid_mode,
                            enchgGridStateBool: enpower.mains_admin_state === 'closed' ?? false,
                            enpwrRelayStateBm: enpower.Enpwr_relay_state_bm ?? 0,
                            enpwrCurrStateId: enpower.Enpwr_curr_state_id ?? 0
                        }
                        //push to array
                        enpowesrArr.push(obj);

                        //update chaaracteristics
                        if (this.envoyService) {
                            this.envoyService
                                .updateCharacteristic(Characteristic.EnphaseEnvoyEnpowerGridState, obj.mainsAdminStateBool)
                                .updateCharacteristic(Characteristic.EnphaseEnvoyEnpowerGridMode, obj.enpwrGridModeTranslated)
                        }

                        if (this.enpowersServices) {
                            this.enpowersServices[index]
                                .updateCharacteristic(Characteristic.EnphaseEnpowerStatus, obj.deviceStatus)
                                .updateCharacteristic(Characteristic.EnphaseEnpowerLastReportDate, obj.lastReportDate)
                                .updateCharacteristic(Characteristic.EnphaseEnpowerAdminStateStr, obj.adminStateStr)
                                //.updateCharacteristic(Characteristic.EnphaseEnpowerOperating, obj.operating)
                                .updateCharacteristic(Characteristic.EnphaseEnpowerCommunicating, obj.communicating)
                                .updateCharacteristic(Characteristic.EnphaseEnpowerTemperature, obj.temperature)
                                .updateCharacteristic(Characteristic.EnphaseEnpowerCommLevelSubGhz, obj.commLevelSubGhz)
                                .updateCharacteristic(Characteristic.EnphaseEnpowerCommLevel24Ghz, obj.commLevel24Ghz)
                                .updateCharacteristic(Characteristic.EnphaseEnpowerMainsAdminState, obj.mainsAdminState)
                                .updateCharacteristic(Characteristic.EnphaseEnpowerMainsOperState, obj.mainsOperState)
                                .updateCharacteristic(Characteristic.EnphaseEnpowerEnpwrGridMode, obj.enpwrGridModeTranslated)
                                .updateCharacteristic(Characteristic.EnphaseEnpowerEnchgGridMode, obj.enchgGridModeTranslated);
                            if (this.feature.arfProfile.supported) {
                                this.enpowersServices[index]
                                    .updateCharacteristic(Characteristic.EnphaseEnpowerGridProfile, this.pv.arfProfile.name);
                            }
                        }

                        //enpower grid control
                        if (this.enpowerGridStateActiveControl) {
                            const state = obj.mainsAdminStateBool;
                            this.enpowerGridStateActiveControl.state = state;

                            if (this.enpowerGridStateControlService) {
                                const characteristicType = this.enpowerGridStateActiveControl.characteristicType;
                                this.enpowerGridStateControlService
                                    .updateCharacteristic(characteristicType, state)
                            }
                        }

                        //enpower grid state sensor
                        if (this.enpowerGridStateActiveSensor) {
                            const state = obj.enpwrGridStateBool;
                            this.enpowerGridStateActiveSensor.state = state;

                            if (this.enpowerGridStateSensorService) {
                                const characteristicType = this.enpowerGridStateActiveSensor.characteristicType;
                                this.enpowerGridStateSensorService
                                    .updateCharacteristic(characteristicType, state)
                            }
                        }

                        //enpower grid mode sensors
                        if (this.enpowerGridModeActiveSensorsCount > 0) {
                            for (let i = 0; i < this.enpowerGridModeActiveSensorsCount; i++) {
                                const gridMode = this.enpowerGridModeActiveSensors[i].gridMode;
                                const state = gridMode === obj.enpwrGridMode;
                                this.enpowerGridModeActiveSensors[i].state = state;

                                if (this.enpowerGridModeSensorsServices) {
                                    const characteristicType = this.enpowerGridModeActiveSensors[i].characteristicType;
                                    this.enpowerGridModeSensorsServices[i]
                                        .updateCharacteristic(characteristicType, state)
                                }
                            }
                        }
                    });
                    //add obj to array
                    this.ensemble.enpowers.devices = enpowesrArr;
                }
                //enpowers
                this.feature.enpowers.supported = enpowersSupported;
                this.feature.enpowers.installed = enpowersInstalled;
                this.feature.enpowers.count = enpowersData.length;
            }

            //ensemble supported
            this.feature.ensembles.supported = ensembleSupported;
            this.feature.ensembles.installed = this.feature.enpowers.installed || this.feature.encharges.installed;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('ensembleinventory', ensembleInventory) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Ensemble Inventory', ensembleInventory) : false;
            return ensembleSupported;
        } catch (error) {
            throw new Error(`Update ensemble inventory error: ${error}`);
        };
    };

    async updateEnsembleStatus() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting ensemble status`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.EnsembleStatus);
            const ensembleStatus = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Ensemble status:`, ensembleStatus) : false;

            //ensemble status keys
            const ensembleStatusKeys = Object.keys(ensembleStatus);
            const ensemblesStatusSupported = ensembleStatusKeys.includes('inventory');

            //ensemble status not exist
            if (ensemblesStatusSupported) {
                const inventory = ensembleStatus.inventory;

                //encharges installed
                if (this.feature.encharges.installed) {
                    const enchargesRatedPowerSummary = []; //array to hold rated power values
                    this.ensemble.encharges.devices.forEach((encharge, index) => {
                        const serialNumber = encharge.serialNumber;
                        const enchargeStatus = inventory.serial_nums[serialNumber];
                        const status = {
                            deviceType: enchargeStatus.device_type,
                            comInterfacStr: enchargeStatus.com_interface_str ?? 'Unknown',
                            deviceId: enchargeStatus.device_id ?? 'Unknown',
                            adminState: enchargeStatus.admin_state,
                            adminStateStr: ApiCodes[enchargeStatus.admin_state_str] ?? 'Unknown',
                            reportedGridMode: ApiCodes[enchargeStatus.reported_grid_mode] ?? 'Unknown',
                            phase: enchargeStatus.phase ?? 'Unknown',
                            derIndex: enchargeStatus.der_index ?? 0,
                            revision: enchargeStatus.encharge_revision ?? 0,
                            capacity: enchargeStatus.encharge_capacity ?? 0,
                            ratedPower: enchargeStatus.encharge_rated_power ?? 0,
                            reportedGridState: ApiCodes[enchargeStatus.reported_enc_grid_state] ?? 'Unknown',
                            msgRetryCount: enchargeStatus.msg_retry_count ?? 0,
                            partNumber: enchargeStatus.part_number,
                            assemblyNumber: enchargeStatus.assembly_number,
                            appFwVersion: enchargeStatus.app_fw_version,
                            zbFwVersion: enchargeStatus.zb_fw_version ?? 'Unknown',
                            zbBootloaderVers: enchargeStatus.zb_bootloader_vers ?? 'Unknown',
                            iblFwVersion: enchargeStatus.ibl_fw_version,
                            swiftAsicFwVersion: enchargeStatus.swift_asic_fw_version,
                            bmuFwVersion: enchargeStatus.bmu_fw_version,
                            submodulesCount: enchargeStatus.submodule_count,
                            submodules: enchargeStatus.submodules
                        };
                        //add status to encharges
                        this.ensemble.encharges.devices[index].status = status;

                        //push encharge rated power to the array
                        enchargesRatedPowerSummary.push(status.ratedPower);
                    });

                    //sum rated power for all encharges to kW and add to encharge object
                    this.ensemble.encharges.ratedPowerSumKw = (enchargesRatedPowerSummary.reduce((total, num) => total + num, 0) / 1000);
                }

                //enpowers installed
                if (this.feature.enpowers.installed) {
                    this.ensemble.enpowers.devices.forEach((enpower, index) => {
                        const serialNumber = enpower.serialNumber;
                        const enpowerStatus = inventory.serial_nums[serialNumber];
                        const status = {
                            deviceType: enpowerStatus.device_type,
                            comInterfacStr: enpowerStatus.com_interface_str ?? 'Unknown',
                            deviceId: enpowerStatus.device_id ?? 'Unknown',
                            adminState: enpowerStatus.admin_state,
                            adminStateStr: ApiCodes[enpowerStatus.admin_state_str] ?? 'Unknown',
                            msgRetryCount: enpowerStatus.msg_retry_count ?? 0,
                            partNumber: enpowerStatus.part_number,
                            assemblyNumber: enpowerStatus.assembly_number,
                            appFwVersion: enpowerStatus.app_fw_version,
                            iblFwVersion: enpowerStatus.ibl_fw_version,
                            swiftAsicFwVersion: enpowerStatus.swift_asic_fw_version,
                            bmuFwVersion: enpowerStatus.bmu_fw_version,
                            submodulesCount: enpowerStatus.submodule_count,
                            submodules: enpowerStatus.submodules
                        };
                        //add status to encharges
                        this.ensemble.enpowers.devices[index].status = status;
                    });
                };

                //counters
                const countersSupported = ensembleStatusKeys.includes('counters');
                const counterData = countersSupported ? ensembleStatus.counters : {};
                const counters = {
                    apiEcagtInit: counterData.api_ecagtInit ?? 0,
                    apiEcagtTick: counterData.api_ecagtTick ?? 0,
                    apiEcagtDeviceInsert: counterData.api_ecagtDeviceInsert ?? 0,
                    apiEcagtDeviceNetworkStatus: counterData.api_ecagtDeviceNetworkStatus ?? 0,
                    apiEcagtDeviceCommissionStatus: counterData.api_ecagtDeviceCommissionStatus ?? 0,
                    apiEcagtDeviceRemoved: counterData.api_ecagtDeviceRemoved ?? 0,
                    apiEcagtGetDeviceCount: counterData.api_ecagtGetDeviceCount ?? 0,
                    apiEcagtGetDeviceInfo: counterData.api_ecagtGetDeviceInfo ?? 0,
                    apiEcagtGetOneDeviceInfo: counterData.api_ecagtGetOneDeviceInfo ?? 0,
                    apiEcagtDevIdToSerial: counterData.api_ecagtDevIdToSerial ?? 0,
                    apiEcagtHandleMsg: counterData.api_ecagtHandleMsg ?? 0,
                    apiEcagtGetSubmoduleInv: counterData.api_ecagtGetSubmoduleInv ?? 0,
                    apiEcagtGetDataModelRaw: counterData.api_ecagtGetDataModelRaw ?? 0,
                    apiEcagtSetSecCtrlBias: counterData.api_ecagtSetSecCtrlBias ?? 0,
                    apiEcagtGetSecCtrlBias: counterData.api_ecagtGetSecCtrlBias ?? 0,
                    apiEcagtGetSecCtrlBiasQ: counterData.api_ecagtGetSecCtrlBiasQ ?? 0,
                    apiEcagtSetRelayAdmin: counterData.api_ecagtSetRelayAdmin ?? 0,
                    apiEcagtGetRelayState: counterData.api_ecagtGetRelayState ?? 0,
                    apiEcagtSetDataModelCache: counterData.api_ecagtSetDataModelCache ?? 0,
                    apiAggNameplate: counterData.api_AggNameplate ?? 0,
                    apiChgEstimated: counterData.api_ChgEstimated ?? 0,
                    apiEcagtGetGridFreq: counterData.api_ecagtGetGridFreq ?? 0,
                    apiEcagtGetGridVolt: counterData.api_ecagtGetGridVolt ?? 0,
                    apiEcagtGetGridFreqErrNotfound: counterData.api_ecagtGetGridFreq_err_notfound ?? 0,
                    apiEcagtGetGridFreqErrOor: counterData.api_ecagtGetGridFreq_err_oor ?? 0,
                    restStatusGet: counterData.rest_StatusGet ?? 0,
                    restInventoryGet: counterData.rest_InventoryGet ?? 0,
                    restSubmodGet: counterData.rest_SubmodGet ?? 0,
                    restSecCtrlGet: counterData.rest_SecCtrlGet ?? 0,
                    restRelayGet: counterData.rest_RelayGet ?? 0,
                    restRelayPost: counterData.rest_RelayPost ?? 0,
                    restCommCheckGet: counterData.rest_CommCheckGet ?? 0,
                    restPower: counterData.rest_Power === 'number' && counterData.rest_Power > 0 ? counterData.rest_Power : 0,
                    restPowerKw: counterData.rest_Power === 'number' && counterData.rest_Power > 0 ? counterData.rest_Power / 1000 : 0, //in kW
                    extZbRemove: counterData.ext_zb_remove ?? 0,
                    extZbRemoveErr: counterData.ext_zb_remove_err ?? 0,
                    extZbSendMsg: counterData.ext_zb_send_msg ?? 0,
                    extCfgSaveDevice: counterData.ext_cfg_save_device ?? 0,
                    extCfgSaveDeviceErr: counterData.ext_cfg_save_device_err ?? 0,
                    extSendPerfData: counterData.ext_send_perf_data ?? 0,
                    extEventSetStateful: counterData.ext_event_set_stateful ?? 0,
                    extEventSetModgone: counterData.ext_event_set_modgone ?? 0,
                    rxmsgObjMdlMetaRsp: counterData.rxmsg_OBJ_MDL_META_RSP ?? 0,
                    rxmsgObjMdlInvUpdRsp: counterData.rxmsg_OBJ_MDL_INV_UPD_RSP ?? 0,
                    rxmsgObjMdlPollRsp: counterData.rxmsg_OBJ_MDL_POLL_RSP ?? 0,
                    rxmsgObjMdlRelayCtrlRsp: counterData.rxmsg_OBJ_MDL_RELAY_CTRL_RSP ?? 0,
                    rxmsgObjMdlRelayStatusReq: counterData.rxmsg_OBJ_MDL_RELAY_STATUS_REQ ?? 0,
                    rxmsgObjMdlGridStatusRsp: counterData.rxmsg_OBJ_MDL_GRID_STATUS_RSP ?? 0,
                    rxmsgObjMdlEventMsg: counterData.rxmsg_OBJ_MDL_EVENT_MSG ?? 0,
                    rxmsgObjMdlSosConfigRsp: counterData.rxmsg_OBJ_MDL_SOC_CONFIG_RSP ?? 0,
                    txmsgObjMdlMetaReq: counterData.txmsg_OBJ_MDL_META_REQ ?? 0,
                    txmsgObjMdlEncRtPollReq: counterData.txmsg_OBJ_MDL_ENC_RT_POLL_REQ ?? 0,
                    txmsgObjMdlEnpRtPollReq: counterData.txmsg_OBJ_MDL_ENP_RT_POLL_REQ ?? 0,
                    txmsgObjMdlBmuPollReq: counterData.txmsg_OBJ_MDL_BMU_POLL_REQ ?? 0,
                    txmsgObjMdlPcuPollReq: counterData.txmsg_OBJ_MDL_PCU_POLL_REQ ?? 0,
                    txmsgObjMdlSecondaryCtrlReq: counterData.txmsg_OBJ_MDL_SECONDARY_CTRL_REQ ?? 0,
                    txmsgObjMdlRelayCtrlReq: counterData.txmsg_OBJ_MDL_RELAY_CTRL_REQ ?? 0,
                    txmsgObjMdlGridStatusReq: counterData.txmsg_OBJ_MDL_GRID_STATUS_REQ ?? 0,
                    txmsgObjMdlEventsAck: counterData.txmsg_OBJ_MDL_EVENTS_ACK ?? 0,
                    txmsgObjMdlRelayStatusRsp: counterData.txmsg_OBJ_MDL_RELAY_STATUS_RSP ?? 0,
                    txmsgObjMdlcosConfigReq: counterData.txmsg_OBJ_MDL_SOC_CONFIG_REQ ?? 0,
                    txmsgObjMdlTnsStart: counterData.txmsg_OBJ_MDL_TNS_START ?? 0,
                    rxmsgObjMdlTnsStartRsp: counterData.rxmsg_OBJ_MDL_TNS_START_RSP ?? 0,
                    txmsgObjMdlSetUdmir: counterData.txmsg_OBJ_MDL_SET_UDMIR ?? 0,
                    rxmsgObjMdlSetUdmirRsp: counterData.rxmsg_OBJ_MDL_SET_UDMIR_RSP ?? 0,
                    txmsgObjMdlTnsEdn: counterData.txmsg_OBJ_MDL_TNS_END ?? 0,
                    rxmsgObjMdlTnsEndRsp: counterData.rxmsg_OBJ_MDL_TNS_END_RSP ?? 0,
                    txmsgLvsPoll: counterData.txmsg_lvs_poll ?? 0,
                    zmqEcaHello: counterData.zmq_ecaHello ?? 0,
                    zmqEcaDevInfo: counterData.zmq_ecaDevInfo ?? 0,
                    zmqEcaNetworkStatus: counterData.zmq_ecaNetworkStatus ?? 0,
                    zmqEcaAppMsg: counterData.zmq_ecaAppMsg ?? 0,
                    zmqStreamdata: counterData.zmq_streamdata ?? 0,
                    zmqLiveDebug: counterData.zmq_live_debug ?? 0,
                    zmqEcaLiveDebugReq: counterData.zmq_eca_live_debug_req ?? 0,
                    zmqNameplate: counterData.zmq_nameplate ?? 0,
                    zmqEcaSecCtrlMsg: counterData.zmq_ecaSecCtrlMsg ?? 0,
                    zmqMeterlogOk: counterData.zmq_meterlog_ok ?? 0,
                    dmdlFilesIndexed: counterData.dmdl_FILES_INDEXED ?? 0,
                    pfStart: counterData.pf_start ?? 0,
                    pfActivate: counterData.pf_activate ?? 0,
                    devPollMissing: counterData.devPollMissing ?? 0,
                    devMsgRspMissing: counterData.devMsgRspMissing ?? 0,
                    gridProfileTransaction: counterData.gridProfileTransaction ?? 0,
                    secctrlNotReady: counterData.secctrlNotReady ?? 0,
                    fsmRetryTimeout: counterData.fsm_retry_timeout ?? 0,
                    profileTxnAck: counterData.profile_txn_ack ?? 0,
                    backupSocLimitSet: counterData.backupSocLimitSet ?? 0,
                    backupSocLimitChanged: counterData.backupSocLimitChanged ?? 0,
                    backupSocLimitAbove100: counterData.backupSocLimitAbove100 ?? 0,
                    apiEcagtGetGenRelayState: counterData.api_ecagtGetGenRelayState ?? 0,
                };

                //add counters to ensemble object
                this.ensemble.counters = counters;

                //secctrl
                const secctrlSupported = ensembleStatusKeys.includes('secctrl');
                const secctrlData = secctrlSupported ? ensembleStatus.secctrl : {};
                const secctrl = {
                    shutDown: secctrlData.shutdown,
                    freqBiasHz: secctrlData.freq_bias_hz,
                    voltageBiasV: secctrlData.voltage_bias_v,
                    freqBiasHzQ8: secctrlData.freq_bias_hz_q8,
                    voltageBiasVQ5: secctrlData.voltage_bias_v_q5,
                    freqBiasHzPhaseB: secctrlData.freq_bias_hz_phaseb,
                    voltageBiasVPhaseB: secctrlData.voltage_bias_v_phaseb,
                    freqBiasHzQ8PhaseB: secctrlData.freq_bias_hz_q8_phaseb,
                    voltageBiasVQ5PhaseB: secctrlData.voltage_bias_v_q5_phaseb,
                    freqBiasHzPhaseC: secctrlData.freq_bias_hz_phasec,
                    voltageBiasVPhaseC: secctrlData.voltage_bias_v_phasec,
                    freqBiasHzQ8PhaseC: secctrlData.freq_bias_hz_q8_phasec,
                    voltageBiasVQ5PhaseC: secctrlData.voltage_bias_v_q5_phasec,
                    configuredBackupSoc: secctrlData.configured_backup_soc, //in %
                    adjustedBackupSoc: secctrlData.adjusted_backup_soc, //in %
                    aggSoc: secctrlData.agg_soc, //in %
                    aggMaxEnergy: secctrlData.Max_energy,
                    aggMaxEnergyKw: secctrlData.Max_energy / 1000, //in kWh
                    encAggSoc: secctrlData.ENC_agg_soc, //in %
                    encAggSoh: secctrlData.ENC_agg_soh, //in %
                    encAggBackupEnergy: secctrlData.ENC_agg_backup_energy / 1000, //in kWh
                    encAggAvailEnergy: secctrlData.ENC_agg_avail_energy / 1000, //in kWh
                    encCommissionedCapacity: secctrlData.Enc_commissioned_capacity / 1000, //in kWh
                    encMaxAvailableCapacity: secctrlData.Enc_max_available_capacity / 1000, //in kWh
                    acbAggSoc: secctrlData.ACB_agg_soc, //in %
                    acbAggEnergy: secctrlData.ACB_agg_energy / 1000, //in kWh
                    vlsLimit: secctrlData.VLS_Limit ?? 0,
                    socRecEnabled: secctrlData.soc_rec_enabled ?? false,
                    socRecoveryEntry: secctrlData.soc_recovery_entry ?? 0,
                    socRecoveryExit: secctrlData.soc_recovery_exit ?? 0,
                    commisionInProgress: secctrlData.Commission_in_progress ?? false,
                    essInProgress: secctrlData.ESS_in_progress ?? false
                }

                //add secctrl to ensemble object
                this.ensemble.secctrl = secctrl;

                //relay
                const relaySupported = ensembleStatusKeys.includes('relay');
                const relayData = relaySupported ? ensembleStatus.relay : {};
                const relay = {
                    mainsAdminState: ApiCodes[relayData.mains_admin_state] ?? 'Unknown',
                    mainsAdminStateBool: relayData.mains_admin_state === 'closed' ?? false,
                    mainsOperState: ApiCodes[relayData.mains_oper_state] ?? 'Unknown',
                    mainsOperStateBool: relayData.mains_oper_state === 'closed' ?? false,
                    der1State: relayData.der1_state ?? 0,
                    der2State: relayData.der2_state ?? 0,
                    der3State: relayData.der3_state ?? 0,
                    enchgGridMode: relayData.Enchg_grid_mode ?? 'Unknown',
                    enchgGridModeTranslated: ApiCodes[relayData.Enchg_grid_mode] ?? relayData.Enchg_grid_mode,
                    enchgGridStateBool: relayData.mains_admin_state === 'closed' ?? false,
                    solarGridMode: relayData.Solar_grid_mode ?? 'Unknown',
                    solarGridModeTranslated: ApiCodes[relayData.Solar_grid_mode] ?? relayData.Solar_grid_mode,
                    solarGridStateBool: relayData.mains_admin_state === 'closed' ?? false,
                }

                //add relay to ensemble object
                this.ensemble.relay = relay;

                //update chaaracteristics
                if (this.ensembleStatusService) {
                    this.ensembleStatusService
                        .updateCharacteristic(Characteristic.EnphaseEnsembleRestPower, counters.restPowerKw)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHz, secctrl.freqBiasHz)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasV, secctrl.voltageBiasV)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHzQ8, secctrl.freqBiasHzQ8)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasVQ5, secctrl.voltageBiasVQ5)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHzPhaseB, secctrl.freqBiasHzPhaseB)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasVPhaseB, secctrl.voltageBiasVPhaseB)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHzQ8PhaseB, secctrl.freqBiasHzQ8PhaseB)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasVQ5PhaseB, secctrl.voltageBiasVQ5PhaseB)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHzPhaseC, secctrl.freqBiasHzPhaseC)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasVPhaseC, secctrl.voltageBiasVPhaseC)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHzQ8PhaseC, secctrl.freqBiasHzQ8PhaseC)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasVQ5PhaseC, secctrl.voltageBiasVQ5PhaseC)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleConfiguredBackupSoc, secctrl.configuredBackupSoc)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleAdjustedBackupSoc, secctrl.adjustedBackupSoc)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleAggSoc, secctrl.aggSoc)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleAggMaxEnergy, secctrl.aggMaxEnergyKw)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleEncAggSoc, secctrl.encAggSoc)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleEncAggRatedPower, this.ensemble.encharges.ratedPowerSumKw)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleEncAggPercentFull, this.ensemble.encharges.percentFullSum)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleEncAggBackupEnergy, secctrl.encAggBackupEnergy)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleEncAggAvailEnergy, secctrl.encAggAvailEnergy)
                }

                //encharge grid state sensor
                if (this.enchargeGridStateActiveSensor) {
                    const state = relay.enchgGridStateBool;
                    this.enchargeGridStateActiveSensor.state = state;

                    if (this.enchargeGridStateSensorService) {
                        const characteristicType = this.enchargeGridStateActiveSensor.characteristicType;
                        this.enchargeGridStateSensorService
                            .updateCharacteristic(characteristicType, state)
                    }
                }

                //encharge grid mode sensors
                if (this.enchargeGridModeActiveSensorsCount > 0) {
                    for (let i = 0; i < this.enchargeGridModeActiveSensorsCount; i++) {
                        const gridMode = this.enchargeGridModeActiveSensors[i].gridMode;
                        const state = gridMode === relay.enchgGridMode;
                        this.enchargeGridModeActiveSensors[i].state = state;

                        if (this.enchargeGridModeSensorsServices) {
                            const characteristicType = this.enchargeGridModeActiveSensors[i].characteristicType;
                            this.enchargeGridModeSensorsServices[i]
                                .updateCharacteristic(characteristicType, state)
                        }
                    }
                }

                //encharge backup level sensors
                if (this.enchargeBackupLevelActiveSensorsCount > 0) {
                    for (let i = 0; i < this.enchargeBackupLevelActiveSensorsCount; i++) {
                        const compareMode = this.enchargeBackupLevelActiveSensors[i].compareMode;
                        const backupLevel = this.enchargeBackupLevelActiveSensors[i].backupLevel;
                        let state = false;
                        switch (compareMode) {
                            case 0:
                                state = this.ensemble.encharges.percentFullSum > backupLevel;
                                break;
                            case 1:
                                state = this.ensemble.encharges.percentFullSum >= backupLevel;
                                break;
                            case 2:
                                state = this.ensemble.encharges.percentFullSum === backupLevel;
                                break;
                            case 3:
                                state = this.ensemble.encharges.percentFullSum < backupLevel;
                                break;
                            case 4:
                                state = this.ensemble.encharges.percentFullSum <= backupLevel;
                                break;
                        }
                        this.enchargeBackupLevelActiveSensors[i].state = state;

                        if (this.enchargeBackupLevelSensorsServices) {
                            const characteristicType = this.enchargeBackupLevelActiveSensors[i].characteristicType;
                            this.enchargeBackupLevelSensorsServices[i]
                                .updateCharacteristic(characteristicType, state)
                        }
                    }
                }

                //solar grid state sensor
                if (this.solarGridStateActiveSensor) {
                    const state = relay.solarGridStateBool;
                    this.solarGridStateActiveSensor.state = state;

                    if (this.solarGridStateSensorService) {
                        const characteristicType = this.solarGridStateActiveSensor.characteristicType;
                        this.solarGridStateSensorService
                            .updateCharacteristic(characteristicType, state)
                    }
                }

                //solar grid mode sensors
                if (this.solarGridModeActiveSensorsCount > 0) {
                    for (let i = 0; i < this.solarGridModeActiveSensorsCount; i++) {
                        const gridMode = this.solarGridModeActiveSensors[i].gridMode;
                        const state = gridMode === relay.solarGridMode;
                        this.solarGridModeActiveSensors[i].state = state;

                        if (this.solarGridModeSensorsServices) {
                            const characteristicType = this.solarGridModeActiveSensors[i].characteristicType;
                            this.solarGridModeSensorsServices[i]
                                .updateCharacteristic(characteristicType, state)
                        }
                    }
                }

                //profile
                const profileSupported = ensembleStatusKeys.includes('profile');
                const profile = profileSupported ? ensembleStatus.profile : {};

                //fakeit
                const fakeInventoryModeSupported = ensembleStatusKeys.includes('fakeit');
                const ensembleFakeInventoryMode = fakeInventoryModeSupported ? ensembleStatus.fakeit.fake_inventory_mode === true : false;
            }

            //ensemble status supported
            this.feature.ensembles.status.supported = ensemblesStatusSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('ensemblestatus', ensembleStatus) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Ensemble Status', ensembleStatus) : false;
            return ensemblesStatusSupported;
        } catch (error) {
            throw new Error(`Update ensemble status error: ${error}`);
        };
    };

    async updateEnchargesSettings() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting encharge settings`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.EnchargeSettings);
            const enchargeSettings = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Encharge settings:`, enchargeSettings) : false;

            //encharge keys
            const enchargeSettingsKeys = Object.keys(enchargeSettings);
            const enchargeSettingsSupported = enchargeSettingsKeys.includes('enc_settings');

            //encharge settings not exist
            if (enchargeSettingsSupported) {
                const settingsData = enchargeSettings.enc_settings;
                const settings = {
                    enable: settingsData.enable === true, //bool
                    country: settingsData.country, //str
                    currentLimit: settingsData.current_limit, //float
                    perPhase: settingsData.per_phase //bool
                }
                //add encharges settings to ensemble object
                this.ensemble.encharges.settings = settings;

                //encharge state sensor
                if (this.enchargeStateActiveSensor) {
                    const state = settings.enable;
                    this.enchargeStateActiveSensor.state = state;

                    if (this.enchargeStateSensorService) {
                        const characteristicType = this.enchargeStateActiveSensor.characteristicType;
                        this.enchargeStateSensorService
                            .updateCharacteristic(characteristicType, state)
                    }
                }
            }

            //encharges settings supported
            this.feature.encharges.settings.supported = enchargeSettingsSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('enchargesettings', enchargeSettings) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Encharge Settings', enchargeSettings) : false;
            return enchargeSettingsSupported;
        } catch (error) {
            throw new Error(`Update encharge settings. error: ${error}`);
        };
    };

    async updateTariff() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting tariff`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.TariffSettingsGetPut);
            const tariffSettings = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Tariff:`, tariffSettings) : false;

            //encharge keys
            const tariffSettingsKeys = Object.keys(tariffSettings);
            const tariffSupported = tariffSettingsKeys.includes('tariff');

            //encharge settings not exist
            if (tariffSupported) {
                const tariff = {};
                const tariffData = tariffSettings.tariff ?? {};
                tariff.info = {
                    currencyCode: tariffData.currency.code, //str USD
                    logger: tariffData.logger, //str
                    date: new Date(tariffData.date * 1000).toLocaleString() ?? ''
                };

                const storageSettingsSupported = tariffSettingsKeys.includes('storage_settings');
                const storageSettingsData = tariffSettings.storage_settings ?? {};
                tariff.storageSettings = {
                    mode: storageSettingsData.mode ?? '',
                    selfConsumptionModeBool: storageSettingsData.mode === 'self-consumption',
                    fullBackupModeBool: storageSettingsData.mode === 'backup',
                    savingsModeBool: (storageSettingsData.mode === 'savings-mode'),
                    economyModeBool: (storageSettingsData.mode === 'economy'),
                    operationModeSubType: storageSettingsData.operation_mode_sub_type ?? '',
                    reservedSoc: storageSettingsData.reserved_soc,
                    veryLowSoc: storageSettingsData.very_low_soc,
                    chargeFromGrid: storageSettingsData.charge_from_grid,
                    date: new Date(storageSettingsData.date * 1000).toLocaleString() ?? '',
                    optSchedules: storageSettingsData.opt_schedules
                }

                const singleRateSupported = tariffSettingsKeys.includes('single_rate');
                const singleRateData = tariffSettings.single_Rate ?? {};
                tariff.singleRate = {
                    rate: singleRateData.rate,
                    sell: singleRateData.sell
                }

                const seasonsSupported = tariffSettingsKeys.includes('seasons');
                const seasonsData = tariffSettings.seasons ?? [];
                seasonsData.forEach((season, index) => {
                    const id = season.id; //str fall, winter, spring, summer
                    const start = season.start; //str 6/1
                    const days = season.days ?? []; //arr

                    //days
                    for (const day of days) {
                        const id = day.id; //str weekdays, weekend
                        const days = day.days; //str Mon,Tue,Wed
                        const mustChargeStart = day.must_charge_start; //float
                        const mustChargeDuration = day.must_charge_duration; //float
                        const mustChargeNode = day.must_charge_node; //str CP
                        const peakRule = day.peak_rule; //str DL
                        const enableDischargeToGrid = day.enable_discharge_to_grid; //bool false
                        const periods = day.periods ?? []; //arr

                        //periods
                        for (const period of periods) {
                            const id = period.id; //str period_3
                            const start = period.start; //float 0
                            const rate = period.must_charge_start; //float 0.36
                        }
                    }
                    const tiers = season.tiers ?? []; //arr
                })

                const seasonsSellSupported = tariffSettingsKeys.includes('seasons_sell');
                const seasonsSellData = tariffSettings.seasons_sell ?? [];
                seasonsSellData.forEach((season, index) => {
                    const id = season.id; //str fall, winter, spring, summer
                    const start = season.start; //str 6/1
                    const days = season.days ?? []; //arr

                    //days
                    for (const day of days) {
                        const id = day.id; //str weekdays, weekend
                        const days = day.days; //str Mon,Tue,Wed
                        const mustChargeStart = day.must_charge_start; //float
                        const mustChargeDuration = day.must_charge_duration; //float
                        const mustChargeNode = day.must_charge_node; //str CP
                        const peakRule = day.peak_rule; //str DL
                        const enableDischargeToGrid = day.enable_discharge_to_grid; //bool false
                        const periods = day.periods ?? []; //arr

                        //periods
                        for (const period of periods) {
                            const id = period.id; //str period_3
                            const start = period.start; //float 0
                            const rate = period.must_charge_start; //float 0.36
                        }
                    }
                    const tiers = season.tiers ?? []; //arr
                })

                const scheduleSupported = tariffSettingsKeys.includes('schedule');
                const scheduleData = tariffSettings.schedule ?? {};
                tariff.schedule = {
                    fileName: scheduleData.filename,
                    source: scheduleData.source,
                    version: scheduleData.version,
                    reservedSoc: scheduleData.reserved_soc,
                    veryLowSoc: scheduleData.very_low_soc,
                    chargeFromGrid: scheduleData.charge_from_grid,
                    battMode: scheduleData.batt_mode,
                    batteryMode: scheduleData.battery_mode,
                    operationModeSubType: scheduleData.operation_mode_sub_type,
                    override: scheduleData.override,
                    overrideBackupSoc: scheduleData.override_backup_soc,
                    overrideChgDischargeRate: scheduleData.override_chg_discharge_rate,
                    overrideTouMode: scheduleData.override_tou_mode
                };

                const schedule = scheduleData.schedule ?? {};
                for (const [category, periods] of Object.entries(schedule)) {
                    for (const period of periods) {

                        // disable
                        if (category === "Disable") {
                            for (const day of periods) {
                                for (const [dayName, dayDetails] of Object.entries(day)) {
                                    for (const detail of dayDetails) {
                                        const start = detail.start; // float 0
                                        const duration = detail.duration; // float 1440
                                        const setting = detail.setting; // str ID or ZN
                                    }
                                }
                            }
                        }

                        //tariff
                        if (category === "tariff") {
                            const { start: periodStart, end: periodEnd, ...days } = period;
                            for (const [dayName, dayDetails] of Object.entries(days)) {
                                for (const detail of dayDetails) {
                                    const start = detail.start; // float 0
                                    const duration = detail.duration; // float 1440
                                    const setting = detail.setting; // str ID or ZN
                                }
                            }
                        }
                    }
                }

                //add tariff to ensemble object
                this.ensemble.tariff = tariff;

                //encharge profile control
                if (this.enchargeProfileActiveControlsCount > 0) {
                    for (let i = 0; i < this.enchargeProfileActiveControlsCount; i++) {
                        const profile = this.enchargeProfileActiveControls[i].profile;
                        const state = tariff.storageSettings.mode === profile;
                        this.enchargeProfileActiveControls[i].state = state;

                        if (this.enchargeProfileControlsServices) {
                            const characteristicType = this.enchargeProfileActiveControls[i].characteristicType;
                            this.enchargeProfileControlsServices[i]
                                .updateCharacteristic(characteristicType, state);
                            const updateReservedSoc = profile !== 'backup' ? this.enchargeProfileControlsServices[i].updateCharacteristic(Characteristic.Brightness, tariff.storageSettings.reservedSoc) : false;
                        }
                    }
                }

                //encharge profile sensors
                if (this.enchargeProfileActiveSensorsCount > 0) {
                    for (let i = 0; i < this.enchargeProfileActiveSensorsCount; i++) {
                        const profile = this.enchargeProfileActiveSensors[i].profile;
                        const state = tariff.storageSettings.mode === profile;
                        this.enchargeProfileActiveSensors[i].state = state;

                        if (this.enchargeProfileSensorsServices) {
                            const characteristicType = this.enchargeProfileActiveSensors[i].characteristicType;
                            this.enchargeProfileSensorsServices[i]
                                .updateCharacteristic(characteristicType, state)
                        }
                    }
                }
            }

            //tariff supported
            this.feature.encharges.tariff.supported = tariffSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('tariff', tariffSettings) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Tariff', tariffSettings) : false;
            return tariffSupported;
        } catch (error) {
            throw new Error(`Update tariff. error: ${error}`);
        };
    };

    async updateDryContacts() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting dry contacts`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.DryContacts);
            const ensembleDryContacts = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Dry contacts:`, ensembleDryContacts) : false;

            //ensemble dry contacts keys
            const ensembleDryContactsKeys = Object.keys(ensembleDryContacts);
            const dryContactsSupported = ensembleDryContactsKeys.includes('dry_contacts');

            //ensemble dry contacts not exist
            if (dryContactsSupported) {
                const dryContacts = ensembleDryContacts.dry_contacts ?? [];
                const dryContactsInstalled = dryContacts.length > 0;
                if (dryContactsInstalled) {
                    this.ensemble.dryContacts = [];
                    dryContacts.forEach((contact, index) => {
                        const obj = {
                            id: contact.id, //str NC1
                            status: contact.status, //str closed
                            stateBool: contact.status === 'closed' ?? false,
                            settings: {}
                        }
                        this.ensemble.dryContacts.push(obj);

                        //dry contacts control
                        if (this.dryContactsControlServices) {
                            this.dryContactsControlServices[index]
                                .updateCharacteristic(Characteristic.On, obj.stateBool)
                        }

                        //dry contacts sensors
                        if (this.dryContactsSensorServices) {
                            this.dryContactsSensorServices[index]
                                .updateCharacteristic(Characteristic.ContactSensorState, obj.stateBool)
                        }
                    });

                    //dry contacts supported
                    //this.feature.dryContacts.installed = true;
                    //this.feature.dryContacts.count = dryContacts.length;
                }
            }
            //dry contacts supported
            this.feature.dryContacts.supported = dryContactsSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('drycontacts', ensembleDryContacts) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Dry Contacts', ensembleDryContacts) : false;
            return dryContactsSupported;
        } catch (error) {
            throw new Error(`Update dry contacts error: ${error}`);
        };
    };

    async updateDryContactsSettings() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting dry contacts settings`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.DryContactsSettings);
            const ensembleDryContactsSettings = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Dry contacts settings:`, ensembleDryContactsSettings) : false;

            //ensemble dry contacts settings keys
            const ensembleDryContactsKeys = Object.keys(ensembleDryContactsSettings);
            const dryContactsSettingsSupported = ensembleDryContactsKeys.includes('dry_contacts');

            //ensemble dry contacts settings not exist
            if (dryContactsSettingsSupported) {
                const dryContactsSettings = ensembleDryContactsSettings.dry_contacts;
                const dryContactsSettingsInstalled = dryContactsSettings.length > 0;
                if (dryContactsSettingsInstalled) {
                    const dryContactsStates = [];
                    dryContactsSettings.forEach((setting, index) => {
                        const obj = {
                            id: setting.id, //str NC1
                            type: setting.type, //str NONE
                            gridAction: setting.grid_action, //str apply
                            gridActionBool: setting.grid_action !== 'none' ?? false, //str apply
                            microGridAction: setting.micro_grid_action, //str apply
                            genAction: setting.gen_action, //str apply
                            essentialStartTime: setting.essential_start_time ?? '', //float
                            essentialEndTime: setting.essential_end_time ?? '', //float
                            priority: setting.priority ?? 0, //flota
                            blackSStart: setting.black_s_start ?? 0, //float
                            override: setting.override ?? 'false', //str bool
                            overrideBool: setting.override === 'true' ?? false, //bool
                            manualOverride: setting.manual_override ?? 'false', //str bool
                            manualOverrideBool: setting.manual_override === 'true' ?? false, // bool
                            loadName: setting.load_name !== '' ? setting.load_name : `Dry contact ${index}`, //str
                            mode: setting.mode, //str manual
                            socLow: setting.soc_low, //float
                            socHigh: setting.soc_high, //float
                            pvSerialNb: setting.pv_serial_nb, //array
                        }
                        this.ensemble.dryContacts[index].settings = obj;
                        dryContactsStates.push(obj.gridActionBool);
                    });

                    //dry contacts settings supported
                    this.feature.dryContacts.installed = dryContactsStates.includes(true);
                    this.feature.dryContacts.count = dryContactsSettings.length;
                    this.feature.dryContacts.settings.installed = dryContactsStates.includes(true);
                    this.feature.dryContacts.settings.count = dryContactsSettings.length;
                }
            }

            //dry contacts settings supported
            this.feature.dryContacts.settings.supported = dryContactsSettingsSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('drycontactssettings', ensembleDryContactsSettings) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Dry Contacts Settings', ensembleDryContactsSettings) : false;
            return dryContactsSettingsSupported;
        } catch (error) {
            throw new Error(`Update dry contacts settings error: ${error}`);
        };
    };

    async updateGenerator() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting generator`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.Generator);
            const ensembleGenerator = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Generator:`, ensembleGenerator) : false;

            //ensemble generator keys
            const generatorKeys = Object.keys(ensembleGenerator);
            const generatorSupported = generatorKeys.length > 0;

            //ensemble generator not exist
            if (generatorSupported) {
                const generator = {
                    adminState: ApiCodes[ensembleGenerator.admin_state] ?? 'Unknown',
                    installed: ensembleGenerator.admin_state !== 'unknown',
                    operState: ApiCodes[ensembleGenerator.oper_state] ?? 'Unknown',
                    adminMode: ['Off', 'On', 'Auto'][ensembleGenerator.admin_mode] ?? ensembleGenerator.admin_mode.toString(),
                    adminModeOffBool: ensembleGenerator.admin_mode === 'Off',
                    adminModeOnBool: ensembleGenerator.admin_mode === 'On',
                    adminModeAutoBool: ensembleGenerator.admin_mode === 'Auto',
                    schedule: ensembleGenerator.schedule,
                    startSoc: ensembleGenerator.start_soc,
                    stopSoc: ensembleGenerator.stop_soc,
                    excOn: ensembleGenerator.exc_on,
                    present: ensembleGenerator.present,
                    type: ensembleGenerator.type
                }
                //add generator to ensemble object
                this.ensemble.generator = generator;

                //update chaaracteristics
                //generator state and mode
                if (this.envoyService && generator.installed) {
                    this.envoyService
                        .updateCharacteristic(Characteristic.EnphaseEnvoyGeneratorState, (generator.adminModeOnBool || generator.adminModeAutoBool))
                        .updateCharacteristic(Characteristic.EnphaseEnvoyGeneratorMode, generator.adminMode)
                }

                if (this.generatorService) {
                    this.generatorService
                        .updateCharacteristic(Characteristic.EnphaseEnsembleGeneratorAdminState, generator.adminState)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleGeneratorOperState, generator.operState)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleGeneratorAdminMode, generator.adminMode)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleGeneratorShedule, generator.schedule)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleGeneratorStartSoc, generator.startSoc)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleGeneratorStopSoc, generator.stopSoc)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleGeneratorExexOn, generator.excOn)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleGeneratorPresent, generator.present)
                        .updateCharacteristic(Characteristic.EnphaseEnsembleGeneratorType, generator.type);
                }

                //generator control
                if (this.generatorStateActiveControl) {
                    const state = generator.adminModeOnBool || generator.adminModeAutoBool;
                    this.generatorStateActiveControl.state = state;

                    if (this.generatorStateControlService) {
                        const characteristicType = this.generatorStateActiveControl.characteristicType;
                        this.generatorStateControlService
                            .updateCharacteristic(characteristicType, state)
                    }
                }

                //generator state sensor
                if (this.generatorStateActiveSensor) {
                    const state = (generator.adminModeOnBool || generator.adminModeAutoBool);
                    this.generatorStateActiveSensor.state = state;

                    if (this.generatorStateSensorService) {
                        const characteristicType = this.generatorStateActiveSensor.characteristicType;
                        this.generatorStateSensorService
                            .updateCharacteristic(characteristicType, state)
                    }
                }

                //generator mode controls
                if (this.generatorModeActiveControlsCount > 0) {
                    for (let i = 0; i < this.generatorModeActiveControlsCount; i++) {
                        const mode = this.generatorModeActiveControls[i].mode;
                        const state = mode === generator.adminMode;
                        this.generatorModeActiveControls[i].state = state;

                        if (this.generatorModeControlsServices) {
                            const characteristicType = this.generatorModeActiveControls[i].characteristicType;
                            this.generatorModeControlsServices[i]
                                .updateCharacteristic(characteristicType, state)
                        }
                    }
                }

                //generator mode sensors
                if (this.generatorModeActiveSensorsCount > 0) {
                    for (let i = 0; i < this.generatorModeActiveSensorsCount; i++) {
                        const mode = this.generatorModeActiveSensors[i].mode;
                        const state = mode === generator.adminMode;
                        this.generatorModeActiveSensors[i].state = state;

                        if (this.generatorModeSensorsServices) {
                            const characteristicType = this.generatorModeActiveSensors[i].characteristicType;
                            this.generatorModeSensorsServices[i]
                                .updateCharacteristic(characteristicType, state)
                        }
                    }
                }

                //generator installed
                this.feature.generators.installed = generator.installed;
                this.feature.generators.count = generator.installed ? 1 : 0;
            }

            //generator supported
            this.feature.generators.supported = generatorSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('generator', ensembleGenerator) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Generator', ensembleGenerator) : false;
            return generatorSupported;
        } catch (error) {
            throw new Error(`Update generator error: ${error}`);
        };
    };

    async updateGeneratorSettings() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting generator settings`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.GeneratorSettingsGetSet);
            const generatorSettings = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Generator settings:`, generatorSettings) : false;

            //ensemble generator settings keys
            const generatorSettingsKeys = Object.keys(generatorSettings);
            const generatorSettingsSupported = generatorSettingsKeys.length > 0;

            //ensemble generator settings not exist
            if (generatorSettingsSupported) {
                const settingsData = generatorSettings.generator_settings;
                const settings = {
                    maxContGenAmps: settingsData.max_cont_gen_amps, //float
                    minGenLoadingPerc: settingsData.min_gen_loading_perc, //int
                    maxGenEfficiencyPerc: settingsData.max_gen_efficiency_perc, //int
                    namePlateRatingWat: settingsData.name_plate_rating_wat, //float
                    startMethod: settingsData.start_method, //str Auto, Manual
                    warmUpMins: settingsData.warm_up_mins, //str
                    coolDownMins: settingsData.cool_down_mins, //str
                    genType: settingsData.gen_type, //str
                    model: settingsData.model, //str
                    manufacturer: settingsData.manufacturer, //str
                    lastUpdatedBy: settingsData.last_updated_by, //str
                    generatorId: settingsData.generator_id, //str
                    chargeFromGenerator: settingsData.charge_from_generator //bool
                }

                //add generator settings to ensemble generator object
                this.ensemble.generator.settings = settings;
            }

            //generator settings supported
            this.feature.generators.settings.supported = generatorSettingsSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('generatorsettings', generatorSettings) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Generator Settings', generatorSettings) : false;
            return generatorSettingsSupported;
        } catch (error) {
            throw new Error(`Update generator settings error: ${error}`);
        };
    };

    async updateCommLevel() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting plc level`) : false;
        try {
            const options = {
                method: 'GET',
                baseURL: this.url,
                headers: {
                    Accept: 'application/json'
                }
            }

            const response = this.pv.envoy.firmware7xx ? await this.axiosInstance(ApiUrls.InverterComm) : await this.digestAuthInstaller.request(ApiUrls.InverterComm, options);
            const plcLevel = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Plc level:`, plcLevel) : false;

            // get comm level data
            if (this.feature.microinverters.installed) {
                this.pv.microinverters.forEach((microinverter, index) => {
                    const key = `${microinverter.serialNumber}`;
                    const value = (plcLevel[key] ?? 0) * 20 ?? 0;

                    //add microinverters comm level to microinverters and pv object
                    this.pv.microinverters[index].commLevel = value;

                    if (this.microinvertersServices) {
                        this.microinvertersServices[index]
                            .updateCharacteristic(Characteristic.EnphaseMicroinverterCommLevel, value)
                    };
                });
            }

            if (this.feature.acBatteries.installed) {
                this.pv.acBatteries.devices.forEach((acBatterie, index) => {
                    const key = `${acBatterie.serialNumber}`;
                    const value = (plcLevel[key] ?? 0) * 20 ?? 0;

                    //add ac batteries comm level to ac batteries and pv object
                    this.pv.acBatteries.devices[index].commLevel = value;

                    if (this.acBatteriesServices) {
                        this.acBatteriesServices[index]
                            .updateCharacteristic(Characteristic.EnphaseAcBatterieCommLevel, value)
                    };
                });
            }


            if (this.feature.qRelays.installed) {
                this.pv.qRelays.forEach((qRelay, index) => {
                    const key = `${qRelay.serialNumber}`;
                    const value = (plcLevel[key] ?? 0) * 20 ?? 0;

                    //add qrelays comm level to qrelays and pv object
                    this.pv.qRelays[index].commLevel = value;

                    if (this.qRelaysServices) {
                        this.qRelaysServices[index]
                            .updateCharacteristic(Characteristic.EnphaseQrelayCommLevel, value)
                    };
                });
            }

            if (this.feature.encharges.installed) {
                this.ensemble.encharges.devices.forEach((encharge, index) => {
                    const key = `${encharge.serialNumber}`;
                    const value = (plcLevel[key] ?? 0) * 20 ?? 0;

                    //add encharges comm level to ensemble and encharges object
                    this.ensemble.encharges.devices[index].commLevel = value;

                    if (this.enchargesServices) {
                        this.enchargesServices[index]
                            .updateCharacteristic(Characteristic.EnphaseEnchargeCommLevel, value)
                    }
                });
            }

            //update plc level control state
            if (this.envoyService) {
                this.envoyService
                    .updateCharacteristic(Characteristic.EnphaseEnvoyCheckCommLevel, false);
            }

            if (this.plcLevelActiveControl) {
                this.plcLevelActiveControl.state = false;

                if (this.plcLevelControlService) {
                    const characteristicType = this.plcLevelActiveControl.characteristicType;
                    this.plcLevelControlService
                        .updateCharacteristic(characteristicType, false)
                }
            }

            //comm level supported
            this.feature.plcLevel.supported = true;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('plclevel', plcLevel) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'PLC Level', plcLevel) : false;
            return true;
        } catch (error) {
            throw new Error(`Update plc level error: ${error}`);
            this.emit('warn', `Update plc level error: ${error}, dont worry all working correct, only the plc level control will not be displayed`);
        };
    };

    async updateLiveData() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting live data`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.LiveDataStatus);
            const live = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Live data:`, live) : false;

            //live data keys
            const liveDadaKeys = Object.keys(live);
            const liveDataSupported = liveDadaKeys.length > 0;

            //live data supported
            if (!liveDataSupported) {
                return null;
            }

            //connection
            const liveData = {};
            const lconnectionSupported = liveDadaKeys.includes('connection');
            const connection = lconnectionSupported ? live.connection : {};
            liveData.connection = {
                mqttState: connection.mqtt_state,
                provState: connection.prov_state,
                authState: connection.auth_state,
                scStream: connection.sc_stream === 'enabled',
                scDebug: connection.sc_debug === 'enabled'
            };

            //meters
            const liveDataMetersSupported = liveDadaKeys.includes('meters');
            const liveDataMeters = liveDataMetersSupported ? live.meters : {};
            liveData.meters = {
                lastUpdate: liveDataMeters.last_update,
                soc: liveDataMeters.soc,
                mainRelayState: liveDataMeters.main_relay_state,
                genRelayState: liveDataMeters.gen_relay_state,
                backupBatMode: liveDataMeters.backup_bat_mode,
                backupSoc: liveDataMeters.backup_soc ?? 0,
                isSplitPhase: liveDataMeters.is_split_phase,
                phaseCount: liveDataMeters.phase_count,
                encAggSoc: liveDataMeters.enc_agg_soc,
                encAggEnergy: liveDataMeters.enc_agg_energy,
                acbAggSoc: liveDataMeters.acb_agg_soc,
                acbAggEnergy: liveDataMeters.acb_agg_energy
            };

            //tasks
            const tasksSupported = liveDadaKeys.includes('tasks');
            const tasksData = tasksSupported ? live.tasks : {};
            liveData.task = {
                id: tasksData.task_id,
                timeStamp: tasksData.timestamp
            };

            //counters
            const countersSupported = liveDadaKeys.includes('counters');
            const countersData = countersSupported ? live.counters : {};
            liveData.counters = {
                mainCfgLoad: countersData.main_CfgLoad,
                mainCfgChanged: countersData.main_CfgChanged,
                mainSigHup: countersData.main_sigHUP,
                mgttClientPublish: countersData.MqttClient_publish,
                mgttClientLiveDebug: countersData.MqttClient_live_debug,
                mgttClientRespond: countersData.MqttClient_respond,
                mgttClientMsgarrvd: countersData.MqttClient_msgarrvd,
                mgttClientCreate: countersData.MqttClient_create,
                mgttClientSetCallbacks: countersData.MqttClient_setCallbacks,
                mgttClientConnect: countersData.MqttClient_connect,
                mgttClientSubscribe: countersData.MqttClient_subscribe,
                sslKeysCreate: countersData.SSL_Keys_Create,
                scHdlDataPub: countersData.sc_hdlDataPub,
                scSendStreamCtrl: countersData.sc_SendStreamCtrl,
                scSendDemandRspCtrl: countersData.sc_SendDemandRspCtrl,
                restStatus: countersData.rest_Status
            };

            //dry contacts
            const dryContactsSupported = liveDadaKeys.includes('dry_contacts');
            const dryContactsData = dryContactsSupported ? live.dry_contacts[''] : {};
            liveData.dryContacts = {
                id: dryContactsData.dry_contact_id ?? '',
                loadName: dryContactsData.dry_contact_load_name ?? '',
                status: dryContactsData.dry_contact_status ?? 0
            };

            //enable live data stream if not enabled
            const enableLiveDataStream = !liveData.connection.scStream ? await this.setLiveDataStream() : false;

            //add devices array to live data object
            liveData.devices = [];

            //add lived data meteres types add to array
            const activeDeviceTypes = [];
            const pushPvTypeToArray = this.feature.meters.installed && this.feature.meters.production.enabled ? activeDeviceTypes.push({ type: 'PV', meter: liveDataMeters.pv }) : false;
            const pushStorageTypeToArray = this.feature.meters.installed && this.feature.meters.acBatterie.enabled ? activeDeviceTypes.push({ type: 'AC Batterie', meter: liveDataMeters.storage }) : false;
            const pushEnchargeTypeToArray = this.feature.meters.installed && this.feature.encharges.installed ? activeDeviceTypes.push({ type: 'Encharge', meter: liveDataMeters.storage }) : false;
            const pushGridTypeToArray = this.feature.meters.installed && this.feature.meters.consumption.enabled ? activeDeviceTypes.push({ type: 'Grid', meter: liveDataMeters.grid }) : false;
            const pushLoadTypeToArray = this.feature.meters.installed && this.feature.meters.consumption.enabled ? activeDeviceTypes.push({ type: 'Load', meter: liveDataMeters.load }) : false;
            const pushGeneratorTypeToArray = this.feature.meters.installed && this.feature.generators.installed ? activeDeviceTypes.push({ type: 'Generator', meter: liveDataMeters.generator }) : false;

            //iterate over active meters
            activeDeviceTypes.forEach((type, index) => {
                if (!type.meter) return;

                const {
                    agg_p_mw, agg_s_mva, agg_p_ph_a_mw, agg_p_ph_b_mw, agg_p_ph_c_mw,
                    agg_s_ph_a_mva, agg_s_ph_b_mva, agg_s_ph_c_mva
                } = type.meter;

                const obj = {
                    type: type.type,
                    activePower: agg_p_mw === null ? 'notSupported' : agg_p_mw / 1000000,
                    apparentPower: agg_s_mva === null ? 'notSupported' : agg_s_mva / 1000000,
                    activePowerL1: agg_p_ph_a_mw === null ? 'notSupported' : agg_p_ph_a_mw / 1000000,
                    activePowerL2: agg_p_ph_b_mw === null || liveData.meters.phaseCount === 1 ? 'notSupported' : agg_p_ph_b_mw / 1000000,
                    activePowerL3: agg_p_ph_c_mw === null || liveData.meters.phaseCount === 2 ? 'notSupported' : agg_p_ph_c_mw / 1000000,
                    apparentPowerL1: agg_s_ph_a_mva === null ? 'notSupported' : agg_s_ph_a_mva / 1000000,
                    apparentPowerL2: agg_s_ph_b_mva === null || liveData.meters.phaseCount === 1 ? 'notSupported' : agg_s_ph_b_mva / 1000000,
                    apparentPowerL3: agg_s_ph_c_mva === null || liveData.meters.phaseCount === 2 ? 'notSupported' : agg_s_ph_c_mva / 1000000
                };

                //add device to pv object devices
                liveData.devices.push(obj);

                //update characteristics
                if (this.liveDataServices) {
                    const characteristics = [
                        { key: 'activePower', characteristic: Characteristic.EnphaseLiveDataActivePower },
                        { key: 'activePowerL1', characteristic: Characteristic.EnphaseLiveDataActivePowerL1 },
                        { key: 'activePowerL2', characteristic: Characteristic.EnphaseLiveDataActivePowerL2 },
                        { key: 'activePowerL3', characteristic: Characteristic.EnphaseLiveDataActivePowerL3 },
                        { key: 'apparentPower', characteristic: Characteristic.EnphaseLiveDataApparentPower },
                        { key: 'apparentPowerL1', characteristic: Characteristic.EnphaseLiveDataApparentPowerL1 },
                        { key: 'apparentPowerL2', characteristic: Characteristic.EnphaseLiveDataApparentPowerL2 },
                        { key: 'apparentPowerL3', characteristic: Characteristic.EnphaseLiveDataApparentPowerL3 }
                    ];

                    characteristics.forEach(({ key, characteristic }) => {
                        if (obj[key] !== 'notSupported') {
                            this.liveDataServices[index].updateCharacteristic(characteristic, obj[key]);
                        }
                    });
                }
            });

            //add live data to pv object
            this.pv.liveData = liveData;

            //live data installed
            this.feature.liveData.supported = liveDataSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('livedata', live) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Live Data', live) : false;
            return true;
        } catch (error) {
            throw new Error(`Update live data error: ${error}`);
        };
    };

    async setProductionPowerState(state) {
        const debug = this.enableDebugMode ? this.emit('debug', `Set production power mode`) : false;
        try {
            const data = JSON.stringify({
                length: 1,
                arr: [state ? 0 : 1]
            });

            const options1 = {
                method: 'PUT',
                data: data,
                headers: {
                    Accept: 'application/json'
                }
            }

            const options = {
                data: data,
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: this.cookie
                },
                withCredentials: true,
                httpsAgent: new https.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                })
            }

            const url = this.url + ApiUrls.PowerForcedModeGetPut.replace("EID", this.pv.envoy.devId);
            const response = this.pv.envoy.firmware7xx ? await axios.put(url, options) : await this.digestAuthInstaller.request(url, options1);
            const debug = this.enableDebugMode ? this.emit('debug', `Set power produstion state:`, response.data) : false;
            return true;
        } catch (error) {
            throw new Error(`Set production power mode error: ${error}`);
        };
    }

    async setEnchargeProfile(profile, reserve, independence) {
        const debug = this.enableDebugMode ? this.emit('debug', `Set encharge profile`) : false;
        try {
            const options = {
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: this.cookie
                },
                withCredentials: true,
                httpsAgent: new Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                })
            }

            const data = {
                tariff: {
                    mode: profile, //str economy/savings-mode, backup, self-consumption
                    operation_mode_sub_type: '', //str
                    reserved_soc: reserve, //float
                    very_low_soc: this.ensemble.tariff.storageSettings.veryLowSoc, //int
                    charge_from_grid: independence //bool
                }
            }

            if (this.ensemble.tariff.storageSettings.optSchedules) {
                data.tariff.opt_schedules = this.ensemble.tariff.storageSettings.optSchedules //bool
            }

            const url = this.url + ApiUrls.TariffSettingsGetPut;
            const response = await axios.put(url, data, options);
            const debug = this.enableDebugMode ? this.emit('debug', `Set encharge profile:`, response.data) : false;
            return;
        } catch (error) {
            throw new Error(`Set encharge profile error: ${error}`);
        };
    };

    async setEnpowerGridState(state) {
        const debug = this.enableDebugMode ? this.emit('debug', `Set enpower grid state`) : false;
        try {
            const options = {
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: this.cookie
                },
                withCredentials: true,
                httpsAgent: new https.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                })
            }

            const gridState = state ? 'closed' : 'open';
            const url = this.url + ApiUrls.EnchargeRelay;
            const response = await axios.post(url, { 'mains_admin_state': gridState }, options);
            const debug = this.enableDebugMode ? this.emit('debug', `Set enpower grid state:`, response.data) : false;
            return true;
        } catch (error) {
            throw new Error(`Set enpower grid state error: ${error}`);
        };
    };

    async setDryContactState(id, state) {
        const debug = this.enableDebugMode ? this.emit('debug', `Set dry contact`) : false;
        try {
            const options = {
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: this.cookie
                },
                withCredentials: true,
                httpsAgent: new Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                })
            }

            const dryState = state ? 'closed' : 'open';
            const url = this.url + ApiUrls.DryContacts;
            const response = await axios.post(url, { dry_contacts: { id: id, status: dryState } }, options);
            const debug = this.enableDebugMode ? this.emit('debug', `Set dry contact:`, response.data) : false;
            return true;
        } catch (error) {
            throw new Error(`Set dry contact error: ${error}`);
        };
    };

    async setDryContactSettings(id, index, state) {
        const debug = this.enableDebugMode ? this.emit('debug', `Set dry contact settings`) : false;
        try {
            const options = {
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: this.cookie
                },
                withCredentials: true,
                httpsAgent: new Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                })
            }
            const url = this.url + ApiUrls.DryContactsSettings;
            const response = await axios.post(url, {
                id: id,
                gen_action: self.generator_action,
                grid_action: this.dryContacts[index].settings.gridAction,
                load_name: this.dryContacts[index].settings.loadName,
                manual_override: this.dryContacts[index].settings.manualOverride.toString(), //bool must be as a lowercase string
                micro_grid_action: this.dryContacts[index].settings.microGridAction,
                mode: state ? 'closed' : 'open',
                override: this.dryContacts[index].settings.override.toString(), //bool must be as a lowercase string
                pv_serial_nb: this.dryContacts[index].settings.pvSerialNb,
                soc_high: this.dryContacts[index].settings.socHigh,
                soc_low: this.dryContacts[index].settings.socLow,
                type: this.dryContacts[index].settings.type
            }, options);
            const debug = this.enableDebugMode ? this.emit('debug', `Set dry contact settings:`, response.data) : false;
            return true;
        } catch (error) {
            throw new Error(`Set dry contact settings error: ${error}`);
        };
    };

    async setGeneratorMode(mode) {
        const debug = this.enableDebugMode ? this.emit('debug', `Set generator mode`) : false;
        try {
            const options = {
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: this.cookie
                },
                withCredentials: true,
                httpsAgent: new Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                })
            }

            const url = this.url + ApiUrls.GeneratorModeGetSet;
            const response = await axios.post(url, { 'gen_cmd': mode }, options);
            const debug = this.enableDebugMode ? this.emit('debug', `Set generator mode:`, response.data) : false;
            return true;
        } catch (error) {
            throw new Error(`Set generator mode error: ${error}`);
        };
    };

    async setLiveDataStream() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting live data stream enable`) : false;
        try {
            const options = {
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: this.cookie
                },
                withCredentials: true,
                httpsAgent: new Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                })
            }
            const url = this.url + ApiUrls.LiveDataStream;
            const response = await axios.post(url, { 'enable': 1 }, options);
            const debug = this.enableDebugMode ? this.emit('debug', `Live data stream enable:`, response.data) : false;
            return;
        } catch (error) {
            throw new Error(`Set live data stream enable error: ${error}`);
        };
    };

    async readData(path) {
        try {
            const data = await fsPromises.readFile(path, 'utf-8');
            return data;
        } catch (error) {
            throw new Error(`Read data error: ${error}`);
        }
    };

    async saveData(path, data) {
        try {
            await fsPromises.writeFile(path, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            throw new Error(`Save data error: ${error}`);
        }
    };

    getDeviceInfo() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting device info`) : false;

        //debug objects
        const pv = {
            ...this.pv,
            devId: 'removed',
            passwd: 'removed',
            installerPasswd: 'removed',
            jwtToken: {
                ...this.pv.jwtToken,
                token: 'removed'
            }
        };
        const debug20 = this.enableDebugMode && this.feature.envoy.installed ? this.emit('debug', `Pv object:`, pv) : false;
        const debug21 = this.enableDebugMode && this.feature.ensembles.installed ? this.emit('debug', `Ensemble object:`, this.ensemble) : false;

        //display info
        this.emit('devInfo', `-------- ${this.name} --------`);
        this.emit('devInfo', `Manufacturer: Enphase`);
        this.emit('devInfo', `Model: ${this.pv.envoy.info.modelName}`);
        this.emit('devInfo', `Firmware: ${this.pv.envoy.info.software}`);
        this.emit('devInfo', `SerialNr: ${this.pv.envoy.info.serialNumber}`);
        this.emit('devInfo', `Time: ${this.pv.envoy.info.time}`);
        this.emit('devInfo', `------------------------------`);
        const displayLog12 = this.feature.qRelays.installed ? this.emit('devInfo', `Q-Relays: ${this.feature.qRelays.count}`) : false;
        this.emit('devInfo', `Inverters: ${this.feature.microinverters.count}`);
        const displayLog13 = this.feature.acBatteries.installed ? this.emit('devInfo', `${this.acBatterieName}: ${this.feature.acBatteries.count}`) : false;
        const displayLog14 = this.feature.qRelays.installed || this.feature.acBatteries.installed ? this.emit('devInfo', `--------------------------------`) : false;
        const displayLog0 = this.feature.meters.installed ? this.emit('devInfo', `Meters: Yes`) : false;
        const displayLog1 = this.feature.meters.installed && this.feature.meters.production.supported ? this.emit('devInfo', `Production: ${this.feature.meters.production.enabled ? `Enabled` : `Disabled`}`) : false;
        const displayLog2 = this.feature.meters.installed && this.feature.meters.consumption.supported ? this.emit('devInfo', `Consumption: ${this.feature.meters.consumption.enabled ? `Enabled` : `Disabled`}`) : false;
        const displayLog3 = this.feature.meters.installed && this.feature.meters.acBatterie.supported ? this.emit('devInfo', `Storage: ${this.feature.meters.acBatterie.enabled ? `Enabled` : `Disabled`}`) : false;
        const displayLog4 = this.feature.meters.installed ? this.emit('devInfo', `--------------------------------`) : false;
        const displayLog5 = this.feature.ensembles.installed ? this.emit('devInfo', `Ensemble: Yes`) : false;
        const displayLog6 = this.feature.enpowers.installed ? this.emit('devInfo', `Enpowers: ${this.feature.enpowers.count}`) : false;
        const displayLog7 = this.feature.encharges.installed ? this.emit('devInfo', `${this.enchargeName}: ${this.feature.encharges.count}`) : false;
        const displayLog8 = this.feature.dryContacts.installed ? this.emit('devInfo', `Dry Contacts: ${this.feature.dryContacts.count}`) : false;
        const displayLog9 = this.feature.generators.installed ? this.emit('devInfo', `Generator: Yes`) : false;
        const displayLog10 = this.feature.wirelessConnections.installed ? this.emit('devInfo', `Wireless Kit: ${this.feature.wirelessConnections.count}`) : false;
        const displayLog11 = this.feature.ensembles.installed || this.feature.enpowers.installed || this.feature.encharges.installed || this.feature.dryContacts.installed || this.feature.wirelessConnections.installed || this.feature.generators.installed ? this.emit('devInfo', `--------------------------------`) : false;
    };

    async externalIntegrations() {
        try {
            //RESTFul server
            const restFulEnabled = this.restFul.enable || false;
            if (restFulEnabled) {
                this.restFul1 = new RestFul({
                    port: this.restFul.port || 3000,
                    debug: this.restFul.debug || false
                });

                this.restFul1.on('connected', (success) => {
                    this.restFulConnected = true;
                    this.emit('success', success);
                })
                    .on('set', async (key, value) => {
                        try {
                            await this.setOverExternalIntegration('RESTFul', key, value);
                        } catch (error) {
                            this.emit('warn', `RESTFul set error: ${error}`);
                        };
                    })
                    .on('debug', (debug) => {
                        this.emit('debug', debug);
                    })
                    .on('warn', (warn) => {
                        this.emit('warn', warn);
                    })
                    .on('error', (error) => {
                        this.emit('error', error);
                    });
            }

            //mqtt client
            const mqttEnabled = this.mqtt.enable || false;
            if (mqttEnabled) {
                this.mqtt1 = new Mqtt({
                    host: this.mqtt.host,
                    port: this.mqtt.port || 1883,
                    clientId: this.mqtt.clientId || `envoy_${Math.random().toString(16).slice(3)}`,
                    prefix: `${this.mqtt.prefix}/${this.name}`,
                    user: this.mqtt.user,
                    passwd: this.mqtt.passwd,
                    debug: this.mqtt.debug || false
                });
                this.mqtt1.on('connected', (success) => {
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
                            this.emit('warn', `MQTT set, error: ${error}`);
                        };
                    })
                    .on('debug', (debug) => {
                        this.emit('debug', debug);
                    })
                    .on('warn', (warn) => {
                        this.emit('warn', warn);
                    })
                    .on('error', (error) => {
                        this.emit('error', error);
                    });
            };

            return true;
        } catch (error) {
            this.emit('warn', `External integration start error: ${error}`);
        };
    };

    async setOverExternalIntegration(integration, key, value) {
        try {
            let set = false
            switch (key) {
                case 'DataSampling':
                    set = value !== this.feature.dataSampling ? value ? await this.impulseGenerator.start(this.timers) : await this.impulseGenerator.stop() : false;
                    break;
                case 'PowerProductionState':
                    set = this.feature.productionState.supported ? await this.setDat(value) : false;
                    break;
                case 'PlcLevel':
                    set = this.feature.plcLevel.supported ? await this.updateCommLevel(value) : false;
                    break;
                case 'EnchargeProfile':
                    set = this.feature.encharges.tariff.supported ? await this.setEnchargeProfile(value, this.ensemble.tariff.storageSettings.reservedSoc, this.ensemble.tariff.storageSettings.chargeFromGrid) : false;
                    break;
                case 'EnpowerGridState':
                    set = this.feature.enpowers.installed ? await this.setEnpowerGridState(value) : false;
                    break;
                case 'GeneratorMode':
                    set = this.feature.generators.installed ? await this.setGeneratorMode(value) : false;
                    break;
                default:
                    this.emit('warn', `${integration}, received key: ${key}, value: ${value}`);
                    break;
            };
            return set;
        } catch (error) {
            throw new Error(`${integration} set key: ${key}, value: ${value}, error: ${error}`);
        };
    };

    async startImpulseGenerator() {
        try {
            //start impulse generator 
            await this.impulseGenerator.start(this.timers);
            return true;
        } catch (error) {
            throw new Error(`Impulse generator start error: ${error}`);
        };
    };

    async scaleValue(value, inMin, inMax, outMin, outMax) {
        const scaledValue = parseFloat((((Math.max(inMin, Math.min(inMax, value)) - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin).toFixed(0));
        return scaledValue;
    };

    //prepare accessory
    async prepareAccessory() {
        try {
            //suppored feature
            const envoyInstalled = this.feature.envoy.installed;
            const envoySerialNumber = this.pv.envoy.info.serialNumber;
            const productionStateSupported = this.feature.productionState.supported;
            const plcLevelSupported = this.feature.plcLevel.supported;
            const arfProfileSupported = this.feature.arfProfile.supported;
            const wirelessConnectionsInstalled = this.feature.wirelessConnections.installed;
            const microinvertersInstalled = this.feature.microinverters.installed;
            const microinvertersStatusSupported = this.feature.microinverters.status.supported;
            const qRelaysInstalled = this.feature.qRelays.installed;
            const acBatterieName = this.acBatterieName;
            const acBatteriesInstalled = this.feature.acBatteries.installed;
            const metersInstalled = this.feature.meters.installed;
            const metersProductionEnabled = this.feature.meters.production.enabled;
            const metersConsumptionEnabled = this.feature.meters.consumption.enabled;
            const productionCtProductionSupported = this.feature.production.ct.production.supported;
            const productionCtConsumptionSupported = this.feature.production.ct.consumption.supported;
            const productionCtAcBatterieSupported = this.feature.production.ct.acBatterie.supported
            const ensemblesInventoryInstalled = this.feature.ensembles.inventory.installed;
            const ensemblesSupported = this.feature.ensembles.supported;
            const ensemblesStatusSupported = this.feature.ensembles.status.supported;
            const enchargeName = this.enchargeName;
            const enchargesInstalled = this.feature.encharges.installed;
            const enchargeSettingsSupported = this.feature.encharges.settings.supported;
            const tariffSupported = this.feature.encharges.tariff.supported;
            const enpowersInstalled = this.feature.enpowers.installed;
            const dryContactsInstalled = this.feature.dryContacts.installed;
            const generatorsInstalled = this.feature.generators.installed;
            const liveDataSupported = this.feature.liveData.supported;

            //accessory
            const debug = this.enableDebugMode ? this.emit('debug', `Prepare accessory`) : false;
            const accessoryName = this.name;
            const accessoryUUID = AccessoryUUID.generate(envoySerialNumber);
            const accessoryCategory = [Categories.OTHER, Categories.LIGHTBULB, Categories.FAN, Categories.SENSOR, Categories.SENSOR];
            const accessory = new Accessory(accessoryName, accessoryUUID, accessoryCategory);

            //information service
            const debug1 = this.enableDebugMode ? this.emit('debug', `Prepare Information Service`) : false;
            accessory.getService(Service.AccessoryInformation)
                .setCharacteristic(Characteristic.Manufacturer, 'Enphase')
                .setCharacteristic(Characteristic.Model, this.pv.envoy.info.modelName ?? 'Model Name')
                .setCharacteristic(Characteristic.SerialNumber, envoySerialNumber ?? 'Serial Number')
                .setCharacteristic(Characteristic.FirmwareRevision, this.pv.envoy.info.software.replace(/[a-zA-Z]/g, '') ?? '0');

            //system and envoy
            if (envoyInstalled) {
                const debug = this.enableDebugMode ? this.emit('debug', `Prepare System Service`) : false;
                const serviceType = this.systemAccessoryActive.serviceType;
                const characteristicType = this.systemAccessoryActive.characteristicType;
                const characteristicType1 = this.systemAccessoryActive.characteristicType1;
                const systemService = accessory.addService(serviceType, accessoryName, `systemService`);
                systemService.setPrimaryService(true);
                systemService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                systemService.setCharacteristic(Characteristic.ConfiguredName, accessoryName);
                systemService.getCharacteristic(characteristicType)
                    .onGet(async () => {
                        const state = this.systemAccessoryActive.state;
                        const info = this.disableLogInfo ? false : this.emit('info', `Production power state: ${state ? 'Enabled' : 'Disabled'}`);
                        return state;
                    })
                    .onSet(async (state) => {
                        systemService.updateCharacteristic(Characteristic.On, this.pv.powerState);
                    });
                systemService.getCharacteristic(characteristicType1)
                    .onGet(async () => {
                        const value = this.systemAccessoryActive.level;
                        const info = this.disableLogInfo ? false : this.emit('info', `Production power level: ${value} %`);
                        return value;
                    })
                    .onSet(async (value) => {
                        systemService.updateCharacteristic(Characteristic.Brightness, this.pv.powerLevel);
                    });
                this.systemService = systemService;

                //data refresh control service
                if (this.dataRefreshActiveControl) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Data Refresh Control Service`) : false;
                    const serviceName = this.dataRefreshActiveControl.namePrefix ? `${accessoryName} ${this.dataRefreshActiveControl.name}` : this.dataRefreshActiveControl.name;
                    const serviceType = this.dataRefreshActiveControl.serviceType;
                    const characteristicType = this.dataRefreshActiveControl.characteristicType;
                    const dataRefreshControlService = accessory.addService(serviceType, serviceName, `dataRefreshControlService`);
                    dataRefreshControlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                    dataRefreshControlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                    dataRefreshControlService.getCharacteristic(characteristicType)
                        .onGet(async () => {
                            const state = this.dataRefreshActiveControl.state;
                            const info = this.disableLogInfo ? false : this.emit('info', `Data refresh control: ${state ? 'Enabled' : 'Disabled'}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                const setState = state ? await this.impulseGenerator.start(this.timers) : await this.impulseGenerator.stop();
                                const info = this.disableLogInfo ? false : this.emit('info', `Set data refresh control to: ${state ? `Enable` : `Disable`}`);
                            } catch (error) {
                                this.emit('warn', `Set data refresh contol error: ${error}`);
                            };
                        })
                    this.dataRefreshControlService = dataRefreshControlService;
                };

                //data refresh sensor service
                if (this.dataRefreshActiveSensor) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Data Refresh Sensor Service`) : false;
                    const serviceName = this.dataRefreshActiveSensor.namePrefix ? `${accessoryName} ${this.dataRefreshActiveSensor.name}` : this.dataRefreshActiveSensor.name;
                    const serviceType = this.dataRefreshActiveSensor.serviceType;
                    const characteristicType = this.dataRefreshActiveSensor.characteristicType;
                    const dataRefreshSensorService = accessory.addService(serviceType, serviceName, `dataRefreshSensorService`);
                    dataRefreshSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                    dataRefreshSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                    dataRefreshSensorService.getCharacteristic(characteristicType)
                        .onGet(async () => {
                            const state = this.dataRefreshActiveSensor.state;
                            const info = this.disableLogInfo ? false : this.emit('info', `Data refresh sensor: ${state ? 'Active' : 'Not active'}`);
                            return state;
                        });
                    this.dataRefreshSensorService = dataRefreshSensorService;
                };

                //production state control service
                if (this.productionStateActiveControl && productionStateSupported) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Production State Control Service`) : false;
                    const serviceName = this.productionStateActiveControl.namePrefix ? `${accessoryName} ${this.productionStateActiveControl.name}` : this.productionStateActiveControl.name;
                    const serviceType = this.productionStateActiveControl.serviceType;
                    const characteristicType = this.productionStateActiveControl.characteristicType;
                    const productionStateControlService = accessory.addService(serviceType, serviceName, `productionStateControlService`);
                    productionStateControlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                    productionStateControlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                    productionStateControlService.getCharacteristic(characteristicType)
                        .onGet(async () => {
                            const state = this.productionStateActiveControl.state;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production state: ${state ? 'ON' : 'OFF'}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                const tokenValid = await this.checkJwtToken();
                                const setState = tokenValid ? await this.setProductionPowerState(state) : false;
                                const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Set production state to: ${setState ? `ON` : `OFF`}`);
                            } catch (error) {
                                this.emit('warn', `Set production state error: ${error}`);
                            };
                        })
                    this.productionStateControlService = productionStateControlService;
                };

                //production state sensor service
                if (this.productionStateActiveSensor && productionStateSupported) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Production State Sensor Service`) : false;
                    const serviceName = this.productionStateActiveSensor.namePrefix ? `${accessoryName} ${this.productionStateActiveSensor.name}` : this.productionStateActiveSensor.name;
                    const serviceType = this.productionStateActiveSensor.serviceType;
                    const characteristicType = this.productionStateActiveSensor.characteristicType;
                    const productionStateSensorService = accessory.addService(serviceType, serviceName, `productionStateSensorService`);
                    productionStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                    productionStateSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                    productionStateSensorService.getCharacteristic(characteristicType)
                        .onGet(async () => {
                            const state = this.productionStateActiveSensor.state;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production state sensor: ${state ? 'Active' : 'Not active'}`);
                            return state;
                        });
                    this.productionStateSensorService = productionStateSensorService;
                };

                //plc level control service
                if (this.plcLevelActiveControl && plcLevelSupported) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Plc Level Control Service`) : false;
                    const serviceName = this.plcLevelActiveControl.namePrefix ? `${accessoryName} ${this.plcLevelActiveControl.name}` : this.plcLevelActiveControl.name;
                    const serviceType = this.plcLevelActiveControl.serviceType;
                    const characteristicType = this.plcLevelActiveControl.characteristicType;
                    const plcLevelContolService = accessory.addService(serviceType, serviceName, `plcLevelContolService`);
                    plcLevelContolService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                    plcLevelContolService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                    plcLevelContolService.getCharacteristic(characteristicType)
                        .onGet(async () => {
                            const state = this.plcLevelActiveControl.state;
                            const info = this.disableLogInfo ? false : this.emit('info', `Plc level control state: ${state ? 'ON' : 'OFF'}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                const tokenValid = await this.checkJwtToken();
                                const setState = tokenValid && state ? await this.updateCommLevel() : false;
                                const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Set plc level control state to: ${setState ? `ON` : `OFF`}`);
                            } catch (error) {
                                this.emit('warn', `Set plc level control state error: ${error}`);
                            };
                        })
                    this.plcLevelControlService = plcLevelContolService;
                };

                //envoy
                const debug1 = this.enableDebugMode ? this.emit('debug', `Prepare Envoy ${envoySerialNumber} Service`) : false;
                const envoyService = accessory.addService(Service.EnphaseEnvoyService, `Envoy ${envoySerialNumber}`, `envoyService`);
                envoyService.setCharacteristic(Characteristic.ConfiguredName, `Envoy ${envoySerialNumber}`);
                envoyService.getCharacteristic(Characteristic.EnphaseEnvoyDataRefresh)
                    .onGet(async () => {
                        const state = this.feature.dataSampling;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, data refresh control: ${state ? 'Enabled' : 'Disabled'}`);
                        return state;
                    })
                    .onSet(async (state) => {
                        try {
                            const setStatet = state ? await this.impulseGenerator.start(this.timers) : await this.impulseGenerator.stop();
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, set data refresh control to: ${state ? `Enable` : `Disable`}`);
                        } catch (error) {
                            this.emit('warn', `Envoy: ${envoySerialNumber}, set data refresh control error: ${error}`);
                        };
                    });
                envoyService.getCharacteristic(Characteristic.EnphaseEnvoyAlerts)
                    .onGet(async () => {
                        const value = this.pv.envoy.home.alerts;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, alerts: ${value}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnphaseEnvoyPrimaryInterface)
                    .onGet(async () => {
                        const value = this.pv.envoy.home.network.primaryInterface;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, network interface: ${value}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnphaseEnvoyNetworkWebComm)
                    .onGet(async () => {
                        const value = this.pv.envoy.home.network.webComm;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, web communication: ${value ? 'Yes' : 'No'}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnphaseEnvoyEverReportedToEnlighten)
                    .onGet(async () => {
                        const value = this.pv.envoy.home.network.everReportedToEnlighten;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, report to enlighten: ${value ? 'Yes' : 'No'}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnphaseEnvoyCommNumAndLevel)
                    .onGet(async () => {
                        const value = (`${this.pv.envoy.home.comm.num} / ${this.pv.envoy.home.comm.level} %`);
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, communication devices and level: ${value}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnphaseEnvoyCommNumNsrbAndLevel)
                    .onGet(async () => {
                        const value = (`${this.pv.envoy.home.comm.nsrbNum} / ${this.pv.envoy.home.comm.nsrbLevel} %`);
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, communication qRelays and level: ${value}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnphaseEnvoyCommNumPcuAndLevel)
                    .onGet(async () => {
                        const value = (`${this.pv.envoy.home.comm.pcuNum} / ${this.pv.envoy.home.comm.pcuLevel} %`);
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, communication Microinverters and level: ${value}`);
                        return value;
                    });
                if (acBatteriesInstalled) {
                    envoyService.getCharacteristic(Characteristic.EnphaseEnvoyCommNumAcbAndLevel)
                        .onGet(async () => {
                            const value = (`${this.pv.envoy.home.comm.acbNum} / ${this.pv.envoy.home.comm.acbLevel} %`);
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, communication ${acBatterieName} and level ${value}`);
                            return value;
                        });
                }
                if (enchargesInstalled) {
                    envoyService.getCharacteristic(Characteristic.EnphaseEnvoyCommNumEnchgAndLevel)
                        .onGet(async () => {
                            const value = (`${this.pv.envoy.home.comm.encharges[0].num} / ${this.pv.envoy.home.comm.encharges[0].level} %`);
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, communication ${enchargeName} and level ${value}`);
                            return value;
                        });
                }
                envoyService.getCharacteristic(Characteristic.EnphaseEnvoyDbSize)
                    .onGet(async () => {
                        const value = `${this.pv.envoy.home.dbSize} / ${this.pv.envoy.home.dbPercentFull} %`;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, data base size: ${value}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnphaseEnvoyTariff)
                    .onGet(async () => {
                        const value = this.pv.envoy.home.tariff;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, tariff: ${value}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnphaseEnvoyUpdateStatus)
                    .onGet(async () => {
                        const value = this.pv.envoy.home.updateStatus;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, update status: ${value}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnphaseEnvoyFirmware)
                    .onGet(async () => {
                        const value = this.pv.envoy.info.software;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, firmware: ${value}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnphaseEnvoyTimeZone)
                    .onGet(async () => {
                        const value = this.pv.envoy.home.timeZone;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, time zone: ${value}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnphaseEnvoyCurrentDateTime)
                    .onGet(async () => {
                        const value = `${this.pv.envoy.home.currentDate} ${this.pv.envoy.home.currentTime}`;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, current date and time: ${value}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnphaseEnvoyLastEnlightenReporDate)
                    .onGet(async () => {
                        const value = this.pv.envoy.home.network.lastEnlightenReporDate;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, last report to enlighten: ${value}`);
                        return value;
                    });
                if (arfProfileSupported) {
                    envoyService.getCharacteristic(Characteristic.EnphaseEnvoyGridProfile)
                        .onGet(async () => {
                            const value = this.pv.arfProfile.name;
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, grid profile: ${value}`);
                            return value;
                        });
                }
                if (plcLevelSupported) {
                    envoyService.getCharacteristic(Characteristic.EnphaseEnvoyCheckCommLevel)
                        .onGet(async () => {
                            const state = false;
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, checking plc level: ${state ? `Yes` : `No`}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                const tokenValid = await this.checkJwtToken();
                                const setStatet = tokenValid && state ? await this.updateCommLevel() : false;
                                const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Envoy: ${envoySerialNumber}, check plc level: ${setStatet ? `Yes` : `No`}`);
                            } catch (error) {
                                this.emit('warn', `Envoy: ${envoySerialNumber}, check plc level error: ${error}`);
                            };
                        });
                }
                if (this.productionStateActiveControl && productionStateSupported) {
                    envoyService.getCharacteristic(Characteristic.EnphaseEnvoyProductionPowerMode)
                        .onGet(async () => {
                            const state = this.pv.productionState;
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, production power mode: ${state ? 'Enabled' : 'Disabled'}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                const tokenValid = await this.checkJwtToken();
                                const prductionState = await this.updateProductionState();
                                const setState = tokenValid && (state !== prductionState) ? await this.setProductionPowerState(state) : false;
                                const debug = this.enableDebugMode || !tokenValid ? this.emit('debug', `Envoy: ${envoySerialNumber}, set production power mode: ${setState ? 'Enabled' : 'Disabled'}`) : false;
                            } catch (error) {
                                this.emit('warn', `Envoy: ${envoySerialNumber}, set production power mode error: ${error}`);
                            };
                        });
                }
                if (enpowersInstalled) {
                    envoyService.getCharacteristic(Characteristic.EnphaseEnvoyEnpowerGridMode)
                        .onGet(async () => {
                            const value = this.ensemble.enpowers.devices[0].enpwrGridModeTranslated;
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, enpower grid mode: ${value}`);
                            return value;
                        });
                    envoyService.getCharacteristic(Characteristic.EnphaseEnvoyEnpowerGridState)
                        .onGet(async () => {
                            const state = this.ensemble.enpowers.devices[0].mainsAdminStateBool;
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, enpower grid state: ${state ? 'Grid ON' : 'Grid OFF'}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                const tokenValid = await this.checkJwtToken();
                                const setState = tokenValid ? await this.setEnpowerGridState(state) : false;
                                const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Envoy: ${envoySerialNumber}, set enpower grid state to: ${setState ? `Grid ON` : `Grid OFF`}`);
                            } catch (error) {
                                this.emit('warn', `Set enpower grid state error: ${error}`);
                            };
                        })
                }
                if (generatorsInstalled) {
                    envoyService.getCharacteristic(Characteristic.EnphaseEnvoyGeneratorMode)
                        .onGet(async () => {
                            const value = this.ensemble.generator.adminMode;
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, generator mode: ${value}`);
                            return value;
                        });
                    envoyService.getCharacteristic(Characteristic.EnphaseEnvoyGeneratorState)
                        .onGet(async () => {
                            const state = this.ensemble.generator.adminModeOnBool || this.ensemble.generator.adminModeAutoBool;
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, generator state: ${state ? 'ON' : 'OFF'}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                const genMode = state ? 'on' : 'off';
                                const tokenValid = await this.checkJwtToken();
                                const setState = tokenValid ? await this.setGeneratorMode(genMode) : false;
                                const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Envoy: ${envoySerialNumber}, set generator state to: ${setState ? `ON` : `OFF`}`);
                            } catch (error) {
                                this.emit('warn', `Set generator state error: ${error}`);
                            };
                        })
                }
                this.envoyService = envoyService;

                //wireless connektion kit
                if (wirelessConnectionsInstalled) {
                    this.wirelessConnektionsKitServices = [];
                    for (const wirelessConnection of this.pv.envoy.home.wirelessConnections) {
                        const connectionType = wirelessConnection.type;
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Wireless Connection ${connectionType} Service`) : false;
                        const wirelessConnectionKitService = accessory.addService(Service.EnphaseWirelessConnectionKitService, `Wireless connection ${connectionType}`, `wirelessConnectionKitService${connectionType}`);
                        wirelessConnectionKitService.setCharacteristic(Characteristic.ConfiguredName, `Wireless connection ${connectionType}`);
                        wirelessConnectionKitService.getCharacteristic(Characteristic.EnphaseWirelessConnectionKitType)
                            .onGet(async () => {
                                const value = wirelessConnection.type;
                                const info = this.disableLogInfo ? false : this.emit('info', `Wireless connection: ${connectionType}`);
                                return value;
                            });
                        wirelessConnectionKitService.getCharacteristic(Characteristic.EnphaseWirelessConnectionKitConnected)
                            .onGet(async () => {
                                const value = wirelessConnection.connected;
                                const info = this.disableLogInfo ? false : this.emit('info', `Wireless connection: ${connectionType}, state: ${value ? 'Connected' : 'Disconnected'}`);
                                return value;
                            });
                        wirelessConnectionKitService.getCharacteristic(Characteristic.EnphaseWirelessConnectionKitSignalStrength)
                            .onGet(async () => {
                                const value = wirelessConnection.signalStrength;
                                const info = this.disableLogInfo ? false : this.emit('info', `Wireless connection: ${connectionType}, signal strength: ${value} %`);
                                return value;
                            });
                        wirelessConnectionKitService.getCharacteristic(Characteristic.EnphaseWirelessConnectionKitSignalStrengthMax)
                            .onGet(async () => {
                                const value = wirelessConnection.signalStrengthMax;
                                const info = this.disableLogInfo ? false : this.emit('info', `Wireless connection: ${connectionType}, signal strength max: ${value} %`);
                                return value;
                            });
                        this.wirelessConnektionsKitServices.push(wirelessConnectionKitService);
                    }
                }
            };

            //microinverters
            if (microinvertersInstalled) {
                this.microinvertersServices = [];
                for (const microinverter of this.pv.microinverters) {
                    const serialNumber = microinverter.serialNumber;
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Microinverter ${serialNumber} Service`) : false;
                    const microinverterService = accessory.addService(Service.EnphaseMicroinverterService, `Microinverter ${serialNumber}`, `microinverterService${serialNumber}`);
                    microinverterService.setCharacteristic(Characteristic.ConfiguredName, `Microinverter ${serialNumber}`);
                    if (microinvertersStatusSupported) {
                        microinverterService.getCharacteristic(Characteristic.EnphaseMicroinverterPower)
                            .onGet(async () => {
                                let value = microinverter.status.lastReportWatts;
                                const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, last power: ${value} W`);
                                return value;
                            });
                        microinverterService.getCharacteristic(Characteristic.EnphaseMicroinverterPowerMax)
                            .onGet(async () => {
                                const value = microinverter.status.maxReportWatts;
                                const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, peak power: ${value} W`);
                                return value;
                            });
                    };
                    microinverterService.getCharacteristic(Characteristic.EnphaseMicroinverterProducing)
                        .onGet(async () => {
                            const value = microinverter.producing;
                            const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, producing: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    microinverterService.getCharacteristic(Characteristic.EnphaseMicroinverterCommunicating)
                        .onGet(async () => {
                            const value = microinverter.communicating;
                            const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    microinverterService.getCharacteristic(Characteristic.EnphaseMicroinverterProvisioned)
                        .onGet(async () => {
                            const value = microinverter.provisioned;
                            const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, provisioned: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    microinverterService.getCharacteristic(Characteristic.EnphaseMicroinverterOperating)
                        .onGet(async () => {
                            const value = microinverter.operating;
                            const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    if (plcLevelSupported) {
                        microinverterService.getCharacteristic(Characteristic.EnphaseMicroinverterCommLevel)
                            .onGet(async () => {
                                const value = microinverter.commLevel;
                                const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, plc level: ${value} %`);
                                return value;
                            });
                    }
                    microinverterService.getCharacteristic(Characteristic.EnphaseMicroinverterStatus)
                        .onGet(async () => {
                            const value = microinverter.deviceStatus;
                            const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, status: ${value}`);
                            return value;
                        });
                    microinverterService.getCharacteristic(Characteristic.EnphaseMicroinverterFirmware)
                        .onGet(async () => {
                            const value = microinverter.firmware;
                            const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, firmware: ${value}`);
                            return value;
                        });
                    microinverterService.getCharacteristic(Characteristic.EnphaseMicroinverterLastReportDate)
                        .onGet(async () => {
                            const value = microinverter.lastReportDate;
                            const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, last report: ${value}`);
                            return value;
                        });
                    if (arfProfileSupported) {
                        microinverterService.getCharacteristic(Characteristic.EnphaseMicroinverterGridProfile)
                            .onGet(async () => {
                                const value = this.pv.arfProfile.name;
                                const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, grid profile: ${value}`);
                                return value;
                            });
                    };
                    this.microinvertersServices.push(microinverterService);
                }
            };

            //qrelays
            if (qRelaysInstalled) {
                this.qRelaysServices = [];
                for (const qRelay of this.pv.qRelays) {
                    const serialNumber = qRelay.serialNumber;

                    if (this.qRelayStateActiveSensor) {
                        this.qRelayStateSensorServices = [];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Q-Relay ${serialNumber} State Sensor Service`) : false;
                        const serviceName = this.qRelayStateActiveSensor.namePrefix ? `${accessoryName} ${this.qRelayStateActiveSensor.name}` : this.qRelayStateActiveSensor.name;
                        const serviceType = this.qRelayStateActiveSensor.serviceType;
                        const characteristicType = this.qRelayStateActiveSensor.characteristicType;
                        const qRelayStateSensorService = accessory.addService(serviceType, serviceName, `qRelayStateSensorService${serialNumber}`);
                        qRelayStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        qRelayStateSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        qRelayStateSensorService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.qRelayStateActiveSensor.state;
                                const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, state sensor: ${serviceName}, state: ${state ? 'Active' : 'Not Active'}`);
                                return state;
                            });
                        this.qRelayStateSensorServices.push(qRelayStateSensorService);
                    };

                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Q-Relay ${serialNumber} Service`) : false;
                    const qrelayService = accessory.addService(Service.EnphaseQrelayService, `QRelay ${serialNumber}`, `qrelayService${serialNumber}`);
                    qrelayService.setCharacteristic(Characteristic.ConfiguredName, `qRelay ${serialNumber}`);
                    qrelayService.getCharacteristic(Characteristic.EnphaseQrelayState)
                        .onGet(async () => {
                            const value = qRelay.relay;
                            const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, relay: ${value ? 'Closed' : 'Open'}`);
                            return value;
                        });
                    qrelayService.getCharacteristic(Characteristic.EnphaseQrelayLinesCount)
                        .onGet(async () => {
                            const value = qRelay.linesCount;
                            const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, lines: ${value}`);
                            return value;
                        });
                    if (qRelay.linesCount > 0) {
                        qrelayService.getCharacteristic(Characteristic.EnphaseQrelayLine1Connected)
                            .onGet(async () => {
                                const value = qRelay.line1Connected;
                                const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, line 1: ${value ? 'Closed' : 'Open'}`);
                                return value;
                            });
                    }
                    if (qRelay.linesCount >= 2) {
                        qrelayService.getCharacteristic(Characteristic.EnphaseQrelayLine2Connected)
                            .onGet(async () => {
                                const value = qRelay.line2Connected;
                                const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, line 2: ${value ? 'Closed' : 'Open'}`);
                                return value;
                            });
                    }
                    if (qRelay.linesCount >= 3) {
                        qrelayService.getCharacteristic(Characteristic.EnphaseQrelayLine3Connected)
                            .onGet(async () => {
                                const value = qRelay.line3Connected;
                                const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, line 3: ${value ? 'Closed' : 'Open'}`);
                                return value;
                            });
                    }
                    // qrelayService.getCharacteristic(Characteristic.EnphaseQrelayProducing)
                    //   .onGet(async () => {
                    //     const value = qRelay.producing;
                    //   const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, producing: ${value ? 'Yes' : 'No'}`);
                    // return value;
                    // });
                    qrelayService.getCharacteristic(Characteristic.EnphaseQrelayCommunicating)
                        .onGet(async () => {
                            const value = qRelay.communicating;
                            const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    qrelayService.getCharacteristic(Characteristic.EnphaseQrelayProvisioned)
                        .onGet(async () => {
                            const value = qRelay.provisioned;
                            const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, provisioned: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    qrelayService.getCharacteristic(Characteristic.EnphaseQrelayOperating)
                        .onGet(async () => {
                            const value = qRelay.operating;
                            const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    if (plcLevelSupported) {
                        qrelayService.getCharacteristic(Characteristic.EnphaseQrelayCommLevel)
                            .onGet(async () => {
                                const value = qRelay.commLevel;
                                const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, plc level: ${value} %`);
                                return value;
                            });
                    }
                    qrelayService.getCharacteristic(Characteristic.EnphaseQrelayStatus)
                        .onGet(async () => {
                            const value = qRelay.deviceStatus;
                            const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, status: ${value}`);
                            return value;
                        });
                    qrelayService.getCharacteristic(Characteristic.EnphaseQrelayFirmware)
                        .onGet(async () => {
                            const value = qRelay.firmware;
                            const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, firmware: ${value}`);
                            return value;
                        });
                    qrelayService.getCharacteristic(Characteristic.EnphaseQrelayLastReportDate)
                        .onGet(async () => {
                            const value = qRelay.lastReportDate;
                            const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, last report: ${value}`);
                            return value;
                        });
                    if (arfProfileSupported) {
                        qrelayService.getCharacteristic(Characteristic.EnphaseQrelayGridProfile)
                            .onGet(async () => {
                                const value = this.pv.arfProfile.name;
                                const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, grid profile: ${value}`);
                                return value;
                            });
                    }
                    this.qRelaysServices.push(qrelayService);
                }
            };

            //ac batteries
            if (acBatteriesInstalled) {
                //ac batteries summary
                if (productionCtAcBatterieSupported) {
                    //acBatterie backup summary level and state
                    if (this.acBatterieBackupLevelSummaryActiveAccessory) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${acBatterieName} Backup Level Summary Service`) : false;
                        const serviceName = this.acBatterieBackupLevelSummaryActiveAccessory.namePrefix ? `${accessoryName} ${acBatterieName}` : acBatterieName;
                        const serviceType = this.acBatterieBackupLevelSummaryActiveAccessory.serviceType;
                        const characteristicType = this.acBatterieBackupLevelSummaryActiveAccessory.characteristicType;
                        const characteristicType1 = this.acBatterieBackupLevelSummaryActiveAccessory.characteristicType1;
                        const acBatteriesSummaryLevelAndStateService = accessory.addService(serviceType, serviceName, `acBatteriesSummaryLevelAndStateService`);
                        acBatteriesSummaryLevelAndStateService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        acBatteriesSummaryLevelAndStateService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        acBatteriesSummaryLevelAndStateService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.acBatterieBackupLevelSummaryActiveAccessory.state;
                                const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} state: ${state ? 'Charged' : 'Discharged'}`);
                                return state;
                            })
                            .onSet(async (state) => {
                                acBatteriesSummaryLevelAndStateService.updateCharacteristic(characteristicType, this.acBatterieBackupLevelSummaryActiveAccessory.state);
                            });
                        acBatteriesSummaryLevelAndStateService.getCharacteristic(characteristicType1)
                            .onGet(async () => {
                                const value = this.acBatterieBackupLevelSummaryActiveAccessory.backupLevel;
                                const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} backup level: ${value} %`);
                                return value;
                            })
                            .onSet(async (value) => {
                                acBatteriesSummaryLevelAndStateService.updateCharacteristic(characteristicType1, this.acBatterieBackupLevelSummaryActiveAccessory.backupLevel);
                            });
                        this.acBatteriesSummaryLevelAndStateService = acBatteriesSummaryLevelAndStateService;
                    };

                    //ac batteries summary service
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${acBatterieName} Summary Service`) : false;
                    const acBatterieSummaryService = accessory.addService(Service.EnphaseAcBatterieSummaryService, `${acBatterieName} Summary`, 'acBatterieSummaryService');
                    acBatterieSummaryService.setCharacteristic(Characteristic.ConfiguredName, `${acBatterieName} Summary`);
                    acBatterieSummaryService.getCharacteristic(Characteristic.EnphaseAcBatterieSummaryPower)
                        .onGet(async () => {
                            const value = this.pv.production.ct.acBatterie.powerKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} power: ${value} kW`);
                            return value;
                        });
                    acBatterieSummaryService.getCharacteristic(Characteristic.EnphaseAcBatterieSummaryEnergy)
                        .onGet(async () => {
                            const value = this.pv.production.ct.acBatterie.energyKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} energy: ${value} kWh`);
                            return value;
                        });
                    acBatterieSummaryService.getCharacteristic(Characteristic.EnphaseAcBatterieSummaryPercentFull)
                        .onGet(async () => {
                            const value = this.pv.production.ct.acBatterie.percentFull;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} percent full: ${value}`);
                            return value;
                        });
                    acBatterieSummaryService.getCharacteristic(Characteristic.EnphaseAcBatterieSummaryActiveCount)
                        .onGet(async () => {
                            const value = this.pv.production.ct.acBatterie.activeCount;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} devices count: ${value}`);
                            return value;
                        });
                    acBatterieSummaryService.getCharacteristic(Characteristic.EnphaseAcBatterieSummaryState)
                        .onGet(async () => {
                            const value = this.pv.production.ct.acBatterie.state;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} charge status: ${value}`);
                            return value;
                        });
                    acBatterieSummaryService.getCharacteristic(Characteristic.EnphaseAcBatterieSummaryReadingTime)
                        .onGet(async () => {
                            const value = this.pv.production.ct.acBatterie.readingTime;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} last report: ${value}`);
                            return value;
                        });
                    this.acBatterieSummaryService = acBatterieSummaryService;
                };

                //indyvidual ac batterie state
                this.acBatteriesServices = [];
                for (const acBatterie of this.pv.acBatteries.devices) {
                    const serialNumber = acBatterie.serialNumber;

                    //acBatterie backup level and state
                    if (this.acBatterieBackupLevelActiveAccessory) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${acBatterieName} ${serialNumber} Backup Level Service`) : false;
                        this.acBatteriesLevelAndStateServices = [];
                        const serviceName = this.acBatterieBackupLevelActiveAccessory.namePrefix ? `${accessoryName} ${acBatterieName}` : acBatterieName;
                        const serviceType = this.acBatterieBackupLevelActiveAccessory.serviceType;
                        const characteristicType = this.acBatterieBackupLevelActiveAccessory.characteristicType;
                        const characteristicType1 = this.acBatterieBackupLevelActiveAccessory.characteristicType1;
                        const characteristicType2 = this.acBatterieBackupLevelActiveAccessory.characteristicType2;
                        const acBatterieLevelAndStateService = accessory.addService(serviceType, serviceName, `acBatterieLevelAndStateService${serialNumber}`);
                        acBatterieLevelAndStateService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        acBatterieLevelAndStateService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        acBatterieLevelAndStateService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = acBatterie.percentFull < this.enchargeBackupLevelActiveAccessory.minSoc
                                const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} ${serialNumber}, backup level state: ${state ? 'Low' : 'Normal'}`);
                                return state;
                            })
                            .onSet(async (state) => {
                                acBatterieLevelAndStateService.updateCharacteristic(characteristicType, this.enchargeBackupLevelActiveAccessory.state);
                            });
                        acBatterieLevelAndStateService.getCharacteristic(characteristicType1)
                            .onGet(async () => {
                                const value = acBatterie.percentFull;
                                const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} ${serialNumber}, backup level: ${value} %`);
                                return value;
                            })
                            .onSet(async (value) => {
                                acBatterieLevelAndStateService.updateCharacteristic(characteristicType1, acBatterie.percentFull);
                            });
                        acBatterieLevelAndStateService.getCharacteristic(characteristicType2)
                            .onGet(async () => {
                                const state = acBatterie.chargingState;
                                const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} ${serialNumber}, state: ${state === 0 ? 'Discharging' : state === 1 ? 'Charging' : 'Ready'}`);
                                return state;
                            })
                        this.acBatteriesLevelAndStateServices.push(acBatterieLevelAndStateService);
                    };

                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${acBatterieName} ${serialNumber} Service`) : false;
                    const acBatterieService = accessory.addService(Service.EnphaseAcBatterieService, `${acBatterieName} ${serialNumber}`, `acBatterieService${serialNumber}`);
                    acBatterieService.setCharacteristic(Characteristic.ConfiguredName, `${acBatterieName} ${serialNumber}`);
                    acBatterieService.getCharacteristic(Characteristic.EnphaseAcBatterieChargeStatus)
                        .onGet(async () => {
                            const value = acBatterie.chargeStatus;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} charge status ${value}`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.EnphaseAcBatterieProducing)
                        .onGet(async () => {
                            const value = acBatterie.producing;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} producing: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.EnphaseAcBatterieCommunicating)
                        .onGet(async () => {
                            const value = acBatterie.communicating;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} communicating: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.EnphaseAcBatterieProvisioned)
                        .onGet(async () => {
                            const value = acBatterie.provisioned;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} provisioned: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.EnphaseAcBatterieOperating)
                        .onGet(async () => {
                            const value = acBatterie.operating;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} operating: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    if (plcLevelSupported) {
                        acBatterieService.getCharacteristic(Characteristic.EnphaseAcBatterieCommLevel)
                            .onGet(async () => {
                                const value = acBatterie.commLevel;
                                const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} plc level: ${value} %`);
                                return value;
                            });
                    }
                    acBatterieService.getCharacteristic(Characteristic.EnphaseAcBatterieSleepEnabled)
                        .onGet(async () => {
                            const value = acBatterie.sleepEnabled;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} sleep: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.EnphaseAcBatteriePercentFull)
                        .onGet(async () => {
                            const value = acBatterie.percentFull;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} percent full: ${value} %`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.EnphaseAcBatterieMaxCellTemp)
                        .onGet(async () => {
                            const value = acBatterie.maxCellTemp;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} max cell temp: ${value} °C`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.EnphaseAcBatterieSleepMinSoc)
                        .onGet(async () => {
                            const value = acBatterie.sleepMinSoc;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} sleep min soc: ${value} min`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.EnphaseAcBatterieSleepMaxSoc)
                        .onGet(async () => {
                            const value = acBatterie.sleepMaxSoc;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} sleep max soc: ${value} min`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.EnphaseAcBatterieStatus)
                        .onGet(async () => {
                            const value = acBatterie.deviceStatus;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} status: ${value}`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.EnphaseAcBatterieFirmware)
                        .onGet(async () => {
                            const value = acBatterie.firmware;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} firmware: ${value}`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.EnphaseAcBatterieLastReportDate)
                        .onGet(async () => {
                            const value = acBatterie.lastReportDate;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} last report: ${value}`);
                            return value;
                        });
                    this.acBatteriesServices.push(acBatterieService);
                }
            };

            //meters
            if (metersInstalled) {
                this.metersServices = [];
                for (const meter of this.pv.meters) {
                    const measurementType = meter.measurementType;
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Meter ${measurementType} Service`) : false;
                    const meterService = accessory.addService(Service.EnphaseMeterService, `Meter ${measurementType}`, `meterService${measurementType}`);
                    meterService.setCharacteristic(Characteristic.ConfiguredName, `Meter ${measurementType}`);
                    meterService.getCharacteristic(Characteristic.EnphaseMeterState)
                        .onGet(async () => {
                            const value = meter.state;
                            const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, state: ${value ? 'Enabled' : 'Disabled'}`);
                            return value;
                        });
                    meterService.getCharacteristic(Characteristic.EnphaseMeterPhaseMode)
                        .onGet(async () => {
                            const value = meter.phaseMode;
                            const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, phase mode: ${value}`);
                            return value;
                        });
                    meterService.getCharacteristic(Characteristic.EnphaseMeterPhaseCount)
                        .onGet(async () => {
                            const value = meter.phaseCount;
                            const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, phase count: ${value}`);
                            return value;
                        });
                    meterService.getCharacteristic(Characteristic.EnphaseMeterMeteringStatus)
                        .onGet(async () => {
                            const value = meter.meteringStatus;
                            const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, metering status: ${value}`);
                            return value;
                        });
                    meterService.getCharacteristic(Characteristic.EnphaseMeterStatusFlags)
                        .onGet(async () => {
                            const value = meter.statusFlags;
                            const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, status flag: ${value}`);
                            return value;
                        });
                    if (meter.state) {
                        meterService.getCharacteristic(Characteristic.EnphaseMeterActivePower)
                            .onGet(async () => {
                                const value = meter.readings.activePower;
                                const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, active power: ${value} kW`);
                                return value;
                            });
                        meterService.getCharacteristic(Characteristic.EnphaseMeterApparentPower)
                            .onGet(async () => {
                                const value = meter.readings.apparentPower;
                                const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, apparent power: ${value} kVA`);
                                return value;
                            });
                        meterService.getCharacteristic(Characteristic.EnphaseMeterReactivePower)
                            .onGet(async () => {
                                const value = meter.readings.reactivePower;
                                const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, reactive power: ${value} kVAr`);
                                return value;
                            });
                        meterService.getCharacteristic(Characteristic.EnphaseMeterPwrFactor)
                            .onGet(async () => {
                                const value = meter.readings.pwrFactor;
                                const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, power factor: ${value} cos φ`);
                                return value;
                            });
                        meterService.getCharacteristic(Characteristic.EnphaseMeterVoltage)
                            .onGet(async () => {
                                const value = meter.readings.voltage;
                                const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, voltage: ${value} V`);
                                return value;
                            });
                        meterService.getCharacteristic(Characteristic.EnphaseMeterCurrent)
                            .onGet(async () => {
                                const value = meter.readings.current;
                                const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, current: ${value} A`);
                                return value;
                            });
                        meterService.getCharacteristic(Characteristic.EnphaseMeterFreq)
                            .onGet(async () => {
                                const value = meter.readings.freq;
                                const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, frequency: ${value} Hz`);
                                return value;
                            });
                        meterService.getCharacteristic(Characteristic.EnphaseMeterReadingTime)
                            .onGet(async () => {
                                const value = meter.readings.timeStamp;
                                const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, last report: ${value}`);
                                return value;
                            });
                    }
                    this.metersServices.push(meterService);
                };
            };

            //production
            if (productionCtProductionSupported) {
                const debug4 = this.enableDebugMode ? this.emit('debug', `Prepare Production Power And Energy Service`) : false;
                const productionsService = accessory.addService(Service.EnphasePowerAndEnergyService, `Production Power And Energy`, 'productionsService');
                productionsService.setCharacteristic(Characteristic.ConfiguredName, `Production Power And Energy`);
                productionsService.getCharacteristic(Characteristic.EnphasePower)
                    .onGet(async () => {
                        const value = this.pv.production.ct.production.powerKw;
                        const info = this.disableLogInfo ? false : this.emit('info', `Production power: ${value} kW`);
                        return value;
                    });
                productionsService.getCharacteristic(Characteristic.EnphasePowerMax)
                    .onGet(async () => {
                        const value = this.pv.production.ct.production.powerPeakKw;
                        const info = this.disableLogInfo ? false : this.emit('info', `Production power peak: ${value} kW`);
                        return value;
                    });
                productionsService.getCharacteristic(Characteristic.EnphasePowerMaxDetected)
                    .onGet(async () => {
                        const value = this.pv.production.ct.production.powerPeakDetected;
                        const info = this.disableLogInfo ? false : this.emit('info', `Production power peak detected: ${value ? 'Yes' : 'No'}`);
                        return value;
                    });
                productionsService.getCharacteristic(Characteristic.EnphaseEnergyToday)
                    .onGet(async () => {
                        const value = this.pv.production.ct.production.energyTodayKw;
                        const info = this.disableLogInfo ? false : this.emit('info', `Production energy today: ${value} kWh`);
                        return value;
                    });
                productionsService.getCharacteristic(Characteristic.EnphaseEnergyLastSevenDays)
                    .onGet(async () => {
                        const value = this.pv.production.ct.production.energyLastSevenDaysKw;
                        const info = this.disableLogInfo ? false : this.emit('info', `Production energy last seven days: ${value} kWh`);
                        return value;
                    });
                productionsService.getCharacteristic(Characteristic.EnphaseEnergyLifeTime)
                    .onGet(async () => {
                        const value = this.pv.production.ct.production.energyLifeTimeKw;
                        const info = this.disableLogInfo ? false : this.emit('info', `Production energy lifetime: ${value} kWh`);
                        return value;
                    });
                if (metersInstalled && metersProductionEnabled) {
                    productionsService.getCharacteristic(Characteristic.EnphaseRmsCurrent)
                        .onGet(async () => {
                            const value = this.pv.production.ct.production.rmsCurrent;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production current: ${value} A`);
                            return value;
                        });
                    productionsService.getCharacteristic(Characteristic.EnphaseRmsVoltage)
                        .onGet(async () => {
                            const value = this.pv.production.ct.production.rmsVoltage;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production voltage: ${value} V`);
                            return value;
                        });
                    productionsService.getCharacteristic(Characteristic.EnphaseReactivePower)
                        .onGet(async () => {
                            const value = this.pv.production.ct.production.reactivePower;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production net reactive power: ${value} kVAr`);
                            return value;
                        });
                    productionsService.getCharacteristic(Characteristic.EnphaseApparentPower)
                        .onGet(async () => {
                            const value = this.pv.production.ct.production.apparentPower;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production net apparent power: ${value} kVA`);
                            return value;
                        });
                    productionsService.getCharacteristic(Characteristic.EnphasePwrFactor)
                        .onGet(async () => {
                            const value = this.pv.production.ct.production.pwrFactor;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production power factor: ${value} cos φ`);
                            return value;
                        });
                }
                productionsService.getCharacteristic(Characteristic.EnphaseReadingTime)
                    .onGet(async () => {
                        const value = this.pv.production.ct.production.readingTime;
                        const info = this.disableLogInfo ? false : this.emit('info', `Production last report: ${value}`);
                        return value;
                    });
                productionsService.getCharacteristic(Characteristic.EnphasePowerMaxReset)
                    .onGet(async () => {
                        const state = false;
                        const info = this.disableLogInfo ? false : this.emit('info', `Production power peak reset: Off`);
                        return state;
                    })
                    .onSet(async (state) => {
                        try {
                            const set = state ? this.pv.productionPowerPeak = 0 : false;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production power peak reset: On`);
                            productionsService.updateCharacteristic(Characteristic.EnphasePowerMaxReset, false);
                        } catch (error) {
                            this.emit('warn', `Production Power Peak reset error: ${error}`);
                        };
                    });
                this.productionsService = productionsService;

                //production state sensor service
                if (this.powerProductionStateActiveSensor) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Production Power State Sensor Service`) : false;
                    const serviceName = this.powerProductionStateActiveSensor.namePrefix ? `${accessoryName} ${this.powerProductionStateActiveSensor.name}` : this.powerProductionStateActiveSensor.name;
                    const serviceType = this.powerProductionStateActiveSensor.serviceType;
                    const characteristicType = this.powerProductionStateActiveSensor.characteristicType;
                    const powerProductionStateSensorService = accessory.addService(serviceType, serviceName, `powerProductionStateSensorService`);
                    powerProductionStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                    powerProductionStateSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                    powerProductionStateSensorService.getCharacteristic(characteristicType)
                        .onGet(async () => {
                            const state = this.powerProductionStateActiveSensor.state;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production power state sensor: ${state ? 'Active' : 'Not active'}`);
                            return state;
                        });
                    this.powerProductionStateSensorService = powerProductionStateSensorService;
                };

                //production power level sensors service
                if (this.powerProductionLevelActiveSensorsCount > 0) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Production Power Level Sensor Services`) : false;
                    this.powerProductionLevelSensorsServices = [];
                    for (let i = 0; i < this.powerProductionLevelActiveSensorsCount; i++) {
                        const serviceName = this.powerProductionLevelActiveSensors[i].namePrefix ? `${accessoryName} ${this.powerProductionLevelActiveSensors[i].name}` : this.powerProductionLevelActiveSensors[i].name;
                        const serviceType = this.powerProductionLevelActiveSensors[i].serviceType;
                        const characteristicType = this.powerProductionLevelActiveSensors[i].characteristicType;
                        const powerProductionLevelSensorService = accessory.addService(serviceType, serviceName, `powerProductionLevelSensorService${i}`);
                        powerProductionLevelSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        powerProductionLevelSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        powerProductionLevelSensorService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.powerProductionLevelActiveSensors[i].state;
                                const info = this.disableLogInfo ? false : this.emit('info', `Production power level sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                return state;
                            });
                        this.powerProductionLevelSensorsServices.push(powerProductionLevelSensorService);
                    };
                };

                //production energy state sensor service
                if (this.energyProductionStateActiveSensor) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Production Energy State Sensor Service`) : false;
                    const serviceName = this.energyProductionStateActiveSensor.namePrefix ? `${accessoryName} ${this.energyProductionStateActiveSensor.name}` : this.energyProductionStateActiveSensor.name;
                    const serviceType = this.energyProductionStateActiveSensor.serviceType;
                    const characteristicType = this.energyProductionStateActiveSensor.characteristicType;
                    const energyProductionStateSensorService = accessory.addService(serviceType, serviceName, `energyProductionStateSensorService`);
                    energyProductionStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                    energyProductionStateSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                    energyProductionStateSensorService.getCharacteristic(characteristicType)
                        .onGet(async () => {
                            const state = this.energyProductionStateActiveSensor.state;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production energy state sensor: ${state ? 'Active' : 'Not active'}`);
                            return state;
                        });
                    this.energyProductionStateSensorService = energyProductionStateSensorService;
                };

                //production energy level sensor service
                if (this.energyProductionLevelActiveSensorsCount > 0) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Production Energy Level Sensor Services`) : false;
                    this.energyProductionLevelSensorsServices = [];
                    for (let i = 0; i < this.energyProductionLevelActiveSensorsCount; i++) {
                        const serviceName = this.energyProductionLevelActiveSensors[i].namePrefix ? `${accessoryName} ${this.energyProductionLevelActiveSensors[i].name}` : this.energyProductionLevelActiveSensors[i].name;
                        const serviceType = this.energyProductionLevelActiveSensors[i].serviceType;
                        const characteristicType = this.energyProductionLevelActiveSensors[i].characteristicType;
                        const energyProductionLevelSensorService = accessory.addService(serviceType, serviceName, `energyProductionLevelSensorService${i}`);
                        energyProductionLevelSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        energyProductionLevelSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        energyProductionLevelSensorService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.energyProductionLevelActiveSensors[i].state;
                                const info = this.disableLogInfo ? false : this.emit('info', `Production energy level sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                return state;
                            });
                        this.energyProductionLevelSensorsServices.push(energyProductionLevelSensorService);
                    };
                };
            };

            //power and energy consumption
            if (metersConsumptionEnabled && productionCtConsumptionSupported) {
                this.consumptionsServices = [];
                for (const consumption of this.pv.production.ct.consumption) {
                    const measurmentType = consumption.measurmentType;
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Power And Energy Service`) : false;
                    const consumptionService = accessory.addService(Service.EnphasePowerAndEnergyService, `${measurmentType} Power And Energy`, `consumptionService${measurmentType}`);
                    consumptionService.setCharacteristic(Characteristic.ConfiguredName, `${measurmentType} Power And Energy`);
                    consumptionService.getCharacteristic(Characteristic.EnphasePower)
                        .onGet(async () => {
                            const value = consumption.powerKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} power: ${value} kW`);
                            return value;
                        });
                    consumptionService.getCharacteristic(Characteristic.EnphasePowerMax)
                        .onGet(async () => {
                            const value = consumption.powerPeakKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} power peak: ${value} kW`);
                            return value;
                        });
                    consumptionService.getCharacteristic(Characteristic.EnphasePowerMaxDetected)
                        .onGet(async () => {
                            const value = consumption.powerPeakDetected;
                            const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} power peak detected: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    consumptionService.getCharacteristic(Characteristic.EnphaseEnergyToday)
                        .onGet(async () => {
                            const value = consumption.energyTodayKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} energy today: ${value} kWh`);
                            return value;
                        });
                    consumptionService.getCharacteristic(Characteristic.EnphaseEnergyLastSevenDays)
                        .onGet(async () => {
                            const value = consumption.energyLastSevenDaysKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} energy last seven days: ${value} kWh`);
                            return value;
                        });
                    consumptionService.getCharacteristic(Characteristic.EnphaseEnergyLifeTime)
                        .onGet(async () => {
                            const value = consumption.energyLifeTimeKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} energy lifetime: ${value} kWh`);
                            return value;
                        });
                    consumptionService.getCharacteristic(Characteristic.EnphaseRmsCurrent)
                        .onGet(async () => {
                            const value = consumption.rmsCurrent;
                            const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} current: ${value} A`);
                            return value;
                        });
                    consumptionService.getCharacteristic(Characteristic.EnphaseRmsVoltage)
                        .onGet(async () => {
                            const value = consumption.rmsVoltage;
                            const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} voltage: ${value} V`);
                            return value;
                        });
                    consumptionService.getCharacteristic(Characteristic.EnphaseReactivePower)
                        .onGet(async () => {
                            const value = consumption.reactivePower;
                            const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} reactive power: ${value} kVAr`);
                            return value;
                        });
                    consumptionService.getCharacteristic(Characteristic.EnphaseApparentPower)
                        .onGet(async () => {
                            const value = consumption.apparentPower;
                            const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} apparent power: ${value} kVA`);
                            return value;
                        });
                    consumptionService.getCharacteristic(Characteristic.EnphasePwrFactor)
                        .onGet(async () => {
                            const value = consumption.pwrFactor;
                            const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} power factor: ${value} cos φ`);
                            return value;
                        });
                    consumptionService.getCharacteristic(Characteristic.EnphaseReadingTime)
                        .onGet(async () => {
                            const value = consumption.readingTime;
                            const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} last report: ${value}`);
                            return value;
                        });
                    consumptionService.getCharacteristic(Characteristic.EnphasePowerMaxReset)
                        .onGet(async () => {
                            const state = false;
                            const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} power peak reset: Off`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                const set = state ? measurmentType === 'Consumption Total' ? this.pv.consumptionTotalPowerPeak = 0 : measurmentType === 'Consumption Net' ? this.pv.consumptionNetPowerPeak = 0 : false : false;
                                const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} power peak reset: On`);
                                consumptionService.updateCharacteristic(Characteristic.EnphasePowerMaxReset, false);
                            } catch (error) {
                                this.emit('warn', `${measurmentType}, power peak reset error: ${error}`);
                            };
                        });
                    this.consumptionsServices.push(consumptionService);

                    //total
                    if (measurmentType === 'Consumption Total') {
                        //consumption total state sensor service
                        if (this.powerConsumptionTotalStateActiveSensor) {
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Power State Sensor Service`) : false;
                            const serviceName = this.powerConsumptionTotalStateActiveSensor.namePrefix ? `${accessoryName} ${this.powerConsumptionTotalStateActiveSensor.name}` : this.powerConsumptionTotalStateActiveSensor.name;
                            const serviceType = this.powerConsumptionTotalStateActiveSensor.serviceType;
                            const characteristicType = this.powerConsumptionTotalStateActiveSensor.characteristicType;
                            const powerConsumptionTotalStateSensorService = accessory.addService(serviceType, serviceName, `powerConsumptionTotalStateSensorService`);
                            powerConsumptionTotalStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            powerConsumptionTotalStateSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            powerConsumptionTotalStateSensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.powerConsumptionTotalStateActiveSensor.state;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} power state sensor: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.powerConsumptionTotalStateSensorService = powerConsumptionTotalStateSensorService;
                        };

                        //consumption total power peak sensors service
                        if (this.powerConsumptionTotalLevelActiveSensorsCount > 0) {
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Power Level Sensor Services`) : false;
                            this.powerConsumptionTotalLevelSensorsServices = [];
                            for (let i = 0; i < this.powerConsumptionTotalLevelActiveSensorsCount; i++) {
                                const serviceName = this.powerConsumptionTotalLevelActiveSensors[i].namePrefix ? `${accessoryName} ${this.powerConsumptionTotalLevelActiveSensors[i].name}` : this.powerConsumptionTotalLevelActiveSensors[i].name;
                                const serviceType = this.powerConsumptionTotalLevelActiveSensors[i].serviceType;
                                const characteristicType = this.powerConsumptionTotalLevelActiveSensors[i].characteristicType;
                                const powerConsumptionTotalLevelSensorService = accessory.addService(serviceType, serviceName, `powerConsumptionTotalLevelSensorService${i}`);
                                powerConsumptionTotalLevelSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                powerConsumptionTotalLevelSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                powerConsumptionTotalLevelSensorService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const state = this.powerConsumptionTotalLevelActiveSensors[i].state;
                                        const info = this.disableLogInfo ? false : this.emit('info', `Consumption total power level sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                this.powerConsumptionTotalLevelSensorsServices.push(powerConsumptionTotalLevelSensorService);
                            };
                        };

                        //consumption total energy state sensor service
                        if (this.energyConsumptionTotalStateActiveSensor) {
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Energy State Sensor Service`) : false;
                            const serviceName = this.energyConsumptionTotalStateActiveSensor.namePrefix ? `${accessoryName} ${this.energyConsumptionTotalStateActiveSensor.name}` : this.energyConsumptionTotalStateActiveSensor.name;
                            const serviceType = this.energyConsumptionTotalStateActiveSensor.serviceType;
                            const characteristicType = this.energyConsumptionTotalStateActiveSensor.characteristicType;
                            const energyConsumptionTotalStateSensorService = accessory.addService(serviceType, serviceName, `energyConsumptionTotalStateSensorService`);
                            energyConsumptionTotalStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            energyConsumptionTotalStateSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            energyConsumptionTotalStateSensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.energyConsumptionTotalStateActiveSensor.state;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} energy state sensor: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.energyConsumptionTotalStateSensorService = energyConsumptionTotalStateSensorService;
                        };

                        //consumption total energy level sensor service
                        if (this.energyConsumptionTotalLevelActiveSensorsCount > 0) {
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Energy Level Sensor Services`) : false;
                            this.energyConsumptionTotalLevelSensorsServices = [];
                            for (let i = 0; i < this.energyConsumptionTotalLevelActiveSensorsCount; i++) {
                                const serviceName = this.energyConsumptionTotalLevelActiveSensors[i].namePrefix ? `${accessoryName} ${this.energyConsumptionTotalLevelActiveSensors[i].name}` : this.energyConsumptionTotalLevelActiveSensors[i].name;
                                const serviceType = this.energyConsumptionTotalLevelActiveSensors[i].serviceType;
                                const characteristicType = this.energyConsumptionTotalLevelActiveSensors[i].characteristicType;
                                const energyConsumptionTotalLevelSensorService = accessory.addService(serviceType, serviceName, `energyConsumptionTotalLevelSensorService${i}`);
                                energyConsumptionTotalLevelSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                energyConsumptionTotalLevelSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                energyConsumptionTotalLevelSensorService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const state = this.energyConsumptionTotalLevelActiveSensors[i].state;
                                        const info = this.disableLogInfo ? false : this.emit('info', `Consumption total energy level sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                this.energyConsumptionTotalLevelSensorsServices.push(energyConsumptionTotalLevelSensorService);
                            };
                        };
                    };

                    //net
                    if (measurmentType === 'Consumption Net') {
                        //consumption net state sensor service
                        if (this.powerConsumptionNetStateActiveSensor) {
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Power State Sensor Service`) : false;
                            const serviceName = this.powerConsumptionNetStateActiveSensor.namePrefix ? `${accessoryName} ${this.powerConsumptionNetStateActiveSensor.name}` : this.powerConsumptionNetStateActiveSensor.name;
                            const serviceType = this.powerConsumptionNetStateActiveSensor.serviceType;
                            const characteristicType = this.powerConsumptionNetStateActiveSensor.characteristicType;
                            const powerConsumptionNetStateSensorService = accessory.addService(serviceType, serviceName, `powerConsumptionNetStateSensorService`);
                            powerConsumptionNetStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            powerConsumptionNetStateSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            powerConsumptionNetStateSensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.powerConsumptionNetStateActiveSensor.state;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} power state sensor: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.powerConsumptionNetStateSensorService = powerConsumptionNetStateSensorService;
                        };

                        //consumption net power peak sensor service
                        if (this.powerConsumptionNetLevelActiveSensorsCount > 0) {
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Power Level Sensor Services`) : false;
                            this.powerConsumptionNetLevelSensorsServices = [];
                            for (let i = 0; i < this.powerConsumptionNetLevelActiveSensorsCount; i++) {
                                const serviceName = this.powerConsumptionNetLevelActiveSensors[i].namePrefix ? `${accessoryName} ${this.powerConsumptionNetLevelActiveSensors[i].name}` : this.powerConsumptionNetLevelActiveSensors[i].name;
                                const serviceType = this.powerConsumptionNetLevelActiveSensors[i].serviceType;
                                const characteristicType = this.powerConsumptionNetLevelActiveSensors[i].characteristicType;
                                const powerConsumptionNetLevelSensorService = accessory.addService(serviceType, serviceName, `powerConsumptionNetLevelSensorService${i}`);
                                powerConsumptionNetLevelSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                powerConsumptionNetLevelSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                powerConsumptionNetLevelSensorService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const state = this.powerConsumptionNetLevelActiveSensors[i].state;
                                        const info = this.disableLogInfo ? false : this.emit('info', `Consumption net power level sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                this.powerConsumptionNetLevelSensorsServices.push(powerConsumptionNetLevelSensorService);
                            };
                        };

                        //consumption net energy state sensor service
                        if (this.energyConsumptionNetStateActiveSensor) {
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Energy State Sensor Service`) : false;
                            const serviceName = this.energyConsumptionNetStateActiveSensor.namePrefix ? `${accessoryName} ${this.energyConsumptionNetStateActiveSensor.name}` : this.energyConsumptionNetStateActiveSensor.name;
                            const serviceType = this.energyConsumptionNetStateActiveSensor.serviceType;
                            const characteristicType = this.energyConsumptionNetStateActiveSensor.characteristicType;
                            const energyConsumptionNetStateSensorService = accessory.addService(serviceType, serviceName, `energyConsumptionNetStateSensorService`);
                            energyConsumptionNetStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            energyConsumptionNetStateSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            energyConsumptionNetStateSensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.energyConsumptionNetStateActiveSensor.state;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${measurmentType} energy state sensor: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.energyConsumptionNetStateSensorService = energyConsumptionNetStateSensorService;
                        };

                        if (this.energyConsumptionNetLevelActiveSensorsCount > 0) {
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Energy Level Sensor Services`) : false;
                            this.energyConsumptionNetLevelSensorsServices = [];
                            for (let i = 0; i < this.energyConsumptionNetLevelActiveSensorsCount; i++) {
                                const serviceName = this.energyConsumptionNetLevelActiveSensors[i].namePrefix ? `${accessoryName} ${this.energyConsumptionNetLevelActiveSensors[i].name}` : this.energyConsumptionNetLevelActiveSensors[i].name;
                                const serviceType = this.energyConsumptionNetLevelActiveSensors[i].serviceType;
                                const characteristicType = this.energyConsumptionNetLevelActiveSensors[i].characteristicType;
                                const energyConsumptionNetLevelSensorService = accessory.addService(serviceType, serviceName, `energyConsumptionNetLevelSensorService${i}`);
                                energyConsumptionNetLevelSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                energyConsumptionNetLevelSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                energyConsumptionNetLevelSensorService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const state = this.energyConsumptionNetLevelActiveSensors[i].state;
                                        const info = this.disableLogInfo ? false : this.emit('info', `Consumption net energy level sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                this.energyConsumptionNetLevelSensorsServices.push(energyConsumptionNetLevelSensorService);
                            };
                        };
                    };
                }
            };

            //ensemble
            if (ensemblesSupported) {
                //ensembles inventory
                if (ensemblesInventoryInstalled) {
                    this.ensemblesInventoryServices = [];
                    for (const ensemble of this.pv.ensembles) {
                        const serialNumber = ensemble.serialNumber;
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Ensemble ${serialNumber} Inventory Service`) : false;
                        const ensembleInventoryService = accessory.addService(Service.EnphaseEnsembleInventoryService, `Ensemble Inventory`, `ensembleInventoryService${serialNumber}`);
                        ensembleInventoryService.setCharacteristic(Characteristic.ConfiguredName, `Ensemble Inventory`);
                        ensembleInventoryService.getCharacteristic(Characteristic.EnphaseEnsembleInventoryProducing)
                            .onGet(async () => {
                                const value = ensemble.producing;
                                const info = this.disableLogInfo ? false : this.emit('info', `Ensemble: ${serialNumber}, producing: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        ensembleInventoryService.getCharacteristic(Characteristic.EnphaseEnsembleInventoryCommunicating)
                            .onGet(async () => {
                                const value = ensemble.communicating;
                                const info = this.disableLogInfo ? false : this.emit('info', `Ensemble: ${serialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        ensembleInventoryService.getCharacteristic(Characteristic.EnphaseEnsembleInventoryOperating)
                            .onGet(async () => {
                                const value = ensemble.operating;
                                const info = this.disableLogInfo ? false : this.emit('info', `Ensemble: ${serialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            })
                        ensembleInventoryService.getCharacteristic(Characteristic.EnphaseEnsembleInventoryStatus)
                            .onGet(async () => {
                                const value = ensemble.deviceStatus;
                                const info = this.disableLogInfo ? false : this.emit('info', `Ensemble: ${serialNumber}, status: ${value}`);
                                return value;
                            });
                        ensembleInventoryService.getCharacteristic(Characteristic.EnphaseEnsembleInventoryFirmware)
                            .onGet(async () => {
                                const value = ensemble.firmware;
                                const info = this.disableLogInfo ? false : this.emit('info', `Ensemble: ${serialNumber}, firmware: ${value}`);
                                return value;
                            });
                        ensembleInventoryService.getCharacteristic(Characteristic.EnphaseEnsembleInventoryLastReportDate)
                            .onGet(async () => {
                                const value = ensemble.lastReportDate;
                                const info = this.disableLogInfo ? false : this.emit('info', `Ensemble: ${serialNumber}, last report: ${value}`);
                                return value;
                            });

                        this.ensemblesInventoryServices.push(ensembleInventoryService);
                    }
                };

                //ensembles status summary
                if (ensemblesStatusSupported) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Ensemble Status Service`) : false;
                    const ensembleStatusService = accessory.addService(Service.EnphaseEnsembleService, `Ensemble`, 'ensembleStatusService');
                    ensembleStatusService.setCharacteristic(Characteristic.ConfiguredName, `Ensemble`);
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleRestPower)
                        .onGet(async () => {
                            const value = this.ensemble.counters.restPowerKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, rest power: ${value} kW`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHz)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.freqBiasHz;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L1 bias frequency: ${value} Hz`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasV)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.voltageBiasV;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L1 bias voltage: ${value} V`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHzQ8)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.freqBiasHzQ8;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L1 bias q8 frequency: ${value} Hz`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasVQ5)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.voltageBiasVQ5;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L1 bias q5 voltage: ${value} V`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHzPhaseB)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.freqBiasHzPhaseB;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L2 bias frequency: ${value} Hz`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasVPhaseB)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.voltageBiasVPhaseB;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L2 bias voltage: ${value} V`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHzQ8PhaseB)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.freqBiasHzQ8PhaseB;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L2 bias q8 frequency: ${value} Hz`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasVQ5PhaseB)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.voltageBiasVQ5PhaseB;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L2 bias q5 voltage: ${value} V`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHzPhaseC)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.freqBiasHzPhaseC;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L3 bias frequency: ${value} Hz`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasVPhaseC)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.voltageBiasVPhaseC;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L3 bias voltage: ${value} V`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHzQ8PhaseC)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.freqBiasHzQ8PhaseC;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L3 bias q8 frequency: ${value} Hz`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasVQ5PhaseC)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.voltageBiasVQ5PhaseC;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L3 bias q5 voltage: ${value} V`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleConfiguredBackupSoc)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.configuredBackupSoc;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, configured backup SoC: ${value} %`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleAdjustedBackupSoc)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.adjustedBackupSoc;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, adjusted backup SoC: ${value} %`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleAggSoc)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.aggSoc;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, agg SoC: ${value} %`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleAggMaxEnergy)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.aggMaxEnergyKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, agg max energy: ${value} kWh`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleEncAggSoc)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.encAggSoc;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, ${enchargeName} agg SoC: ${value} %`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleEncAggRatedPower)
                        .onGet(async () => {
                            const value = this.ensemble.encharges.ratedPowerSumKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, ${enchargeName} agg rated power: ${value} kW`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleEncAggPercentFull)
                        .onGet(async () => {
                            const value = this.ensemble.encharges.percentFullSum;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, ${enchargeName} agg percent full: ${value} %`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleEncAggBackupEnergy)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.encAggBackupEnergy;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, ${enchargeName} agg backup energy: ${value} kWh`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnphaseEnsembleEncAggAvailEnergy)
                        .onGet(async () => {
                            const value = this.ensemble.secctrl.encAggAvailEnergy;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, ${enchargeName} agg available energy: ${value} kWh`);
                            return value;
                        });
                    this.ensembleStatusService = ensembleStatusService;

                    //enchargegrid state sensor
                    if (this.enchargeGridStateActiveSensor) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${enchargeName} Grid State Sensor Service`) : false;
                        const serviceName = this.enchargeGridStateActiveSensor.namePrefix ? `${accessoryName} ${this.enchargeGridStateActiveSensor.name}` : this.enchargeGridStateActiveSensor.name;
                        const serviceType = this.enchargeGridStateActiveSensor.serviceType;
                        const characteristicType = this.enchargeGridStateActiveSensor.characteristicType;
                        const enchargeGridStateSensorService = accessory.addService(serviceType, serviceName, `enchargeGridStateSensorService`);
                        enchargeGridStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        enchargeGridStateSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        enchargeGridStateSensorService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.enchargeGridStateActiveSensor.state;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}, grid state sensor: ${serviceName}, state: ${state ? 'Grid ON' : 'Grid Off'}`);
                                return state;
                            });
                        this.enchargeGridStateSensorService = enchargeGridStateSensorService;
                    };

                    //encharge grid mode sensor services
                    if (this.enchargeGridModeActiveSensorsCount > 0) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${enchargeName} Grid Mode Sensor Services`) : false;
                        this.enchargeGridModeSensorsServices = [];
                        for (let i = 0; i < this.enchargeGridModeActiveSensorsCount; i++) {
                            const serviceName = this.enchargeGridModeActiveSensors[i].namePrefix ? `${accessoryName} ${this.enchargeGridModeActiveSensors[i].name}` : this.enchargeGridModeActiveSensors[i].name;
                            const serviceType = this.enchargeGridModeActiveSensors[i].serviceType;
                            const characteristicType = this.enchargeGridModeActiveSensors[i].characteristicType;
                            const enchargeGridModeSensorService = accessory.addService(serviceType, serviceName, `enchargeGridModeSensorService${i}`);
                            enchargeGridModeSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            enchargeGridModeSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            enchargeGridModeSensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.enchargeGridModeActiveSensors[i].state;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName} grid mode sensor: ${serviceName}, state: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.enchargeGridModeSensorsServices.push(enchargeGridModeSensorService);
                        };
                    };

                    //encharge backup level sensor services
                    if (this.enchargeBackupLevelActiveSensorsCount > 0) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${enchargeName} Backup Level Sensor Services`) : false;
                        this.enchargeBackupLevelSensorsServices = [];
                        for (let i = 0; i < this.enchargeBackupLevelActiveSensorsCount; i++) {
                            const serviceName = this.enchargeBackupLevelActiveSensors[i].namePrefix ? `${accessoryName} ${this.enchargeBackupLevelActiveSensors[i].name}` : this.enchargeBackupLevelActiveSensors[i].name;
                            const serviceType = this.enchargeBackupLevelActiveSensors[i].serviceType;
                            const characteristicType = this.enchargeBackupLevelActiveSensors[i].characteristicType;
                            const enchargeBackupLevelSensorService = accessory.addService(serviceType, serviceName, `enchargeBackupLevelSensorService${i}`);
                            enchargeBackupLevelSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            enchargeBackupLevelSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            enchargeBackupLevelSensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.enchargeBackupLevelActiveSensors[i].state;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName} Backup Level sensor: ${serviceName}, state: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.enchargeBackupLevelSensorsServices.push(enchargeBackupLevelSensorService);
                        };
                    };

                    //solar grid state sensor
                    if (this.solarGridStateActiveSensor) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Solar Grid State Sensor Service`) : false;
                        const serialNumber = this.pv.envoy.info.serialNumber;
                        const serviceName = this.solarGridStateActiveSensor.namePrefix ? `${accessoryName} ${this.solarGridStateActiveSensor.name}` : this.solarGridStateActiveSensor.name;
                        const serviceType = this.solarGridStateActiveSensor.serviceType;
                        const characteristicType = this.solarGridStateActiveSensor.characteristicType;
                        const solarGridStateSensorService = accessory.addService(serviceType, serviceName, `solarGridStateSensorService`);
                        solarGridStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        solarGridStateSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        solarGridStateSensorService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.solarGridStateActiveSensor.state;
                                const info = this.disableLogInfo ? false : this.emit('info', `solar: ${serialNumber}, grid state sensor: ${serviceName}, state: ${state ? 'Grid ON' : 'Grid Off'}`);
                                return state;
                            });
                        this.solarGridStateSensorService = solarGridStateSensorService;
                    };

                    //solar grid mode sensor services
                    if (this.solarGridModeActiveSensorsCount > 0) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Solar Grid Mode Sensor Services`) : false;
                        this.solarGridModeSensorsServices = [];
                        for (let i = 0; i < this.solarGridModeActiveSensorsCount; i++) {
                            const serviceName = this.solarGridModeActiveSensors[i].namePrefix ? `${accessoryName} ${this.solarGridModeActiveSensors[i].name}` : this.solarGridModeActiveSensors[i].name;
                            const serviceType = this.solarGridModeActiveSensors[i].serviceType;
                            const characteristicType = this.solarGridModeActiveSensors[i].characteristicType;
                            const solarGridModeSensorService = accessory.addService(serviceType, serviceName, `solarGridModeSensorService${i}`);
                            solarGridModeSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            solarGridModeSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            solarGridModeSensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.solarGridModeActiveSensors[i].state;
                                    const info = this.disableLogInfo ? false : this.emit('info', `Solar grid mode sensor: ${serviceName}, state: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.solarGridModeSensorsServices.push(solarGridModeSensorService);
                        };
                    };
                };

                //encharges
                if (enchargesInstalled) {
                    //backup summary level and state
                    if (this.enchargeBackupLevelSummaryActiveAccessory) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${enchargeName} Backup Level Summary Service`) : false;
                        const serviceName = this.enchargeBackupLevelSummaryActiveAccessory.namePrefix ? `${accessoryName} ${enchargeName}` : enchargeName;
                        const serviceType = this.enchargeBackupLevelSummaryActiveAccessory.serviceType;
                        const characteristicType = this.enchargeBackupLevelSummaryActiveAccessory.characteristicType;
                        const characteristicType1 = this.enchargeBackupLevelSummaryActiveAccessory.characteristicType1;
                        const enchargeSummaryLevelAndStateService = accessory.addService(serviceType, serviceName, `enchargeSummaryLevelAndStateService`);
                        enchargeSummaryLevelAndStateService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        enchargeSummaryLevelAndStateService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        enchargeSummaryLevelAndStateService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.enchargeBackupLevelSummaryActiveAccessory.state;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName} state: ${state ? 'Charged' : 'Discharged'}`);
                                return state;
                            })
                            .onSet(async (state) => {
                                enchargeSummaryLevelAndStateService.updateCharacteristic(characteristicType, this.enchargeBackupLevelSummaryActiveAccessory.state);
                            });
                        enchargeSummaryLevelAndStateService.getCharacteristic(characteristicType1)
                            .onGet(async () => {
                                const value = this.enchargeBackupLevelSummaryActiveAccessory.backupLevel;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName} backup level: ${value} %`);
                                return value;
                            })
                            .onSet(async (value) => {
                                enchargeSummaryLevelAndStateService.updateCharacteristic(characteristicType1, this.enchargeBackupLevelSummaryActiveAccessory.backupLevel);
                            });
                        this.enchargeSummaryLevelAndStateService = enchargeSummaryLevelAndStateService;
                    };

                    //state sensor
                    if (enchargeSettingsSupported && this.enchargeStateActiveSensor) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${enchargeName} State Sensor Service`) : false;
                        const serviceName = this.enchargeStateActiveSensor.namePrefix ? `${accessoryName} ${this.enchargeStateActiveSensor.name}` : this.enchargeStateActiveSensor.name;
                        const serviceType = this.enchargeStateActiveSensor.serviceType;
                        const characteristicType = this.enchargeStateActiveSensor.characteristicType;
                        const enchargeStateSensorService = accessory.addService(serviceType, serviceName, `enchargeStateSensorService`);
                        enchargeStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        enchargeStateSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        enchargeStateSensorService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.enchargeStateActiveSensor.state;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName} state sensor: ${serviceName}, state: ${state ? 'Active' : 'Not Active'}`);
                                return state;
                            });
                        this.enchargeStateSensorService = enchargeStateSensorService;
                    };

                    //profile controls
                    if (tariffSupported && this.enchargeProfileActiveControlsCount > 0) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${enchargeName} Profile Control Services`) : false;
                        const enchargeSettings = this.ensemble.tariff.storageSettings;
                        this.enchargeProfileControlsServices = [];
                        for (let i = 0; i < this.enchargeProfileActiveControlsCount; i++) {
                            const serviceName = this.enchargeProfileActiveControls[i].namePrefix ? `${accessoryName} ${this.enchargeProfileActiveControls[i].name}` : this.enchargeProfileActiveControls[i].name;
                            const profile = this.enchargeProfileActiveControls[i].profile;
                            const serviceType = this.enchargeProfileActiveControls[i].serviceType;
                            const characteristicType = this.enchargeProfileActiveControls[i].characteristicType;
                            const enchargeProfileControlService = accessory.addService(serviceType, serviceName, `enchargeProfileControlService${i}`);
                            enchargeProfileControlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            enchargeProfileControlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            enchargeProfileControlService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.enchargeProfileActiveControls[i].state;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName} profile: ${profile}, state: ${state ? 'ON' : 'OFF'}`);
                                    return state;
                                })
                                .onSet(async (state) => {
                                    try {
                                        const tokenValid = await this.checkJwtToken();
                                        const set = tokenValid ? state ? await this.setEnchargeProfile(profile, enchargeSettings.reservedSoc, enchargeSettings.chargeFromGrid) : false : false;
                                        const debug = this.enableDebugMode || !tokenValid ? this.emit('debug', `${enchargeName} set profile: ${profile}`) : false;
                                    } catch (error) {
                                        this.emit('warn', `${enchargeName} set profile: ${profile}, error: ${error}`);
                                    };
                                })
                            if (profile !== 'backup') {
                                enchargeProfileControlService.getCharacteristic(Characteristic.Brightness)
                                    .onGet(async () => {
                                        const value = enchargeSettings.reservedSoc;
                                        const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName} profile: ${profile}, reserve: ${value} %`);
                                        return value;
                                    })
                                    .onSet(async (value) => {
                                        if (value === 0 || value === 100) {
                                            return;
                                        }

                                        try {
                                            const tokenValid = await this.checkJwtToken();
                                            const set = tokenValid ? await this.setEnchargeProfile(profile, value, enchargeSettings.chargeFromGrid) : false;
                                            const debug = this.enableDebugMode || !tokenValid ? this.emit('debug', `${enchargeName} set profile: ${profile}, reserve: ${value} %`) : false;
                                        } catch (error) {
                                            this.emit('warn', `${enchargeName} set profile: ${profile} reserve, error: ${error}`);
                                        };
                                    });
                            };
                            this.enchargeProfileControlsServices.push(enchargeProfileControlService);
                        };
                    };

                    //profile sensors
                    if (this.enchargeProfileActiveSensorsCount > 0) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${enchargeName} Profile Sensor Services`) : false;
                        this.enchargeProfileSensorsServices = [];
                        for (let i = 0; i < this.enchargeProfileActiveSensorsCount; i++) {
                            const serviceName = this.enchargeProfileActiveSensors[i].namePrefix ? `${accessoryName} ${this.enchargeProfileActiveSensors[i].name}` : this.enchargeProfileActiveSensors[i].name;
                            const profile = this.enchargeProfileActiveSensors[i].profile;
                            const serviceType = this.enchargeProfileActiveSensors[i].serviceType;
                            const characteristicType = this.enchargeProfileActiveSensors[i].characteristicType;
                            const enchargeProfileSensorService = accessory.addService(serviceType, serviceName, `enchargeProfileSensorService${i}`);
                            enchargeProfileSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            enchargeProfileSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            enchargeProfileSensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.enchargeProfileActiveSensors[i].state;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName} profile: ${profile}, state: ${state ? 'Active' : 'Not Active'}`);
                                    return state;
                                })
                            this.enchargeProfileSensorsServices.push(enchargeProfileSensorService);
                        };
                    };

                    //individual encharge state
                    this.enchargesServices = [];
                    for (const encharge of this.ensemble.encharges.devices) {
                        const serialNumber = encharge.serialNumber;

                        //backup level and state
                        if (this.enchargeBackupLevelActiveAccessory) {
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${enchargeName} ${serialNumber} Backup Level Service`) : false;
                            this.enchargesLevelAndStateServices = [];
                            const serviceName = this.enchargeBackupLevelActiveAccessory.namePrefix ? `${accessoryName} ${enchargeName}` : enchargeName;
                            const serviceType = this.enchargeBackupLevelActiveAccessory.serviceType;
                            const characteristicType = this.enchargeBackupLevelActiveAccessory.characteristicType;
                            const characteristicType1 = this.enchargeBackupLevelActiveAccessory.characteristicType1;
                            const characteristicType2 = this.enchargeBackupLevelActiveAccessory.characteristicType2;
                            const enchargeLevelAndStateService = accessory.addService(serviceType, serviceName, `enchargeLevelAndStateService${serialNumber}`);
                            enchargeLevelAndStateService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            enchargeLevelAndStateService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            enchargeLevelAndStateService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = encharge.percentFull < this.enchargeBackupLevelActiveAccessory.minSoc
                                    const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName} ${serialNumber}, backup level state: ${state ? 'Low' : 'Normal'}`);
                                    return state;
                                })
                                .onSet(async (state) => {
                                    enchargeLevelAndStateService.updateCharacteristic(characteristicType, this.enchargeBackupLevelActiveAccessory.state);
                                });
                            enchargeLevelAndStateService.getCharacteristic(characteristicType1)
                                .onGet(async () => {
                                    const value = encharge.percentFull;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName} ${serialNumber}, backup level: ${value} %`);
                                    return value;
                                })
                                .onSet(async (value) => {
                                    enchargeLevelAndStateService.updateCharacteristic(characteristicType1, encharge.percentFull);
                                });
                            enchargeLevelAndStateService.getCharacteristic(characteristicType2)
                                .onGet(async () => {
                                    const state = encharge.chargingState;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName} ${serialNumber}, state: ${state === 0 ? 'Discharging' : state === 1 ? 'Charging' : 'Ready'}`);
                                    return state;
                                })
                            this.enchargesLevelAndStateServices.push(enchargeLevelAndStateService);
                        };

                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${enchargeName} ${serialNumber} Service`) : false;
                        const enchargeService = accessory.addService(Service.EnphaseEnchargeService, `${enchargeName} ${serialNumber}`, `enchargeService${serialNumber}`);
                        enchargeService.setCharacteristic(Characteristic.ConfiguredName, `${enchargeName} ${serialNumber}`);
                        enchargeService.getCharacteristic(Characteristic.EnphaseEnchargeAdminStateStr)
                            .onGet(async () => {
                                const value = encharge.adminStateStr;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, state: ${value}`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnphaseEnchargeOperating)
                            .onGet(async () => {
                                const value = encharge.operating;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnphaseEnchargeCommunicating)
                            .onGet(async () => {
                                const value = encharge.communicating;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        if (plcLevelSupported) {
                            enchargeService.getCharacteristic(Characteristic.EnphaseEnchargeCommLevel)
                                .onGet(async () => {
                                    const value = encharge.commLevel;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber} plc level: ${value} %`);
                                    return value;
                                });
                        }
                        enchargeService.getCharacteristic(Characteristic.EnphaseEnchargeCommLevelSubGhz)
                            .onGet(async () => {
                                const value = encharge.commLevelSubGhz;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, sub GHz level: ${value} %`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnphaseEnchargeCommLevel24Ghz)
                            .onGet(async () => {
                                const value = encharge.commLevel24Ghz;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, 2.4GHz level: ${value} %`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnphaseEnchargeSleepEnabled)
                            .onGet(async () => {
                                const value = encharge.sleepEnabled;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, sleep: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnphaseEnchargePercentFull)
                            .onGet(async () => {
                                const value = encharge.percentFull;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, percent full: ${value} %`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnphaseEnchargeTemperature)
                            .onGet(async () => {
                                const value = encharge.temperature;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, temp: ${value} °C`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnphaseEnchargeMaxCellTemp)
                            .onGet(async () => {
                                const value = encharge.maxCellTemp;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, max cell temp: ${value} °C`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnphaseEnchargeLedStatus)
                            .onGet(async () => {
                                const value = encharge.ledStatus;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, LED status: ${value}`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnphaseEnchargeCapacity)
                            .onGet(async () => {
                                const value = encharge.capacity;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, capacity: ${value} kWh`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnphaseEnchargeDcSwitchOff)
                            .onGet(async () => {
                                const value = encharge.dcSwitchOff;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, status: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnphaseEnchargeRev)
                            .onGet(async () => {
                                const value = encharge.rev;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, revision: ${value}`);
                                return value;
                            });
                        if (arfProfileSupported) {
                            enchargeService.getCharacteristic(Characteristic.EnphaseEnchargeGridProfile)
                                .onGet(async () => {
                                    const value = this.ensemble.arfProfile.name;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, grid profile: ${value}`);
                                    return value;
                                });
                        }
                        enchargeService.getCharacteristic(Characteristic.EnphaseEnchargeStatus)
                            .onGet(async () => {
                                const value = encharge.deviceStatus;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, status: ${value}`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnphaseEnchargeLastReportDate)
                            .onGet(async () => {
                                const value = encharge.lastReportDate;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, last report: ${value}`);
                                return value;
                            });
                        this.enchargesServices.push(enchargeService);
                    };
                };

                //enpowers
                if (enpowersInstalled) {
                    const serialNumber = this.ensemble.enpowers.devices[0].serialNumber;

                    //grid state control
                    if (this.enpowerGridStateActiveControl) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${serialNumber} Grid State Control Service`) : false;
                        const serviceName = this.enpowerGridStateActiveControl.namePrefix ? `${accessoryName} ${this.enpowerGridStateActiveControl.name}` : this.enpowerGridStateActiveControl.name;
                        const serviceType = this.enpowerGridStateActiveControl.serviceType;
                        const characteristicType = this.enpowerGridStateActiveControl.characteristicType;
                        const enpowerGridStateControlService = accessory.addService(serviceType, serviceName, `enpowerGridStateControlService`);
                        enpowerGridStateControlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        enpowerGridStateControlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        enpowerGridStateControlService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.enpowerGridStateActiveControl.state;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, grid state: ${state ? 'Grid ON' : 'Grid OFF'}`);
                                return state;
                            })
                            .onSet(async (state) => {
                                try {
                                    const tokenValid = await this.checkJwtToken();
                                    const setState = tokenValid ? await this.setEnpowerGridState(state) : false;
                                    const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Set Enpower: ${serialNumber}, grid state to: ${setState ? `Grid ON` : `Grid OFF`}`);
                                } catch (error) {
                                    this.emit('warn', `Set Enpower: ${serialNumber}, grid state error: ${error}`);
                                };
                            })
                        this.enpowerGridStateControlService = enpowerGridStateControlService;
                    };

                    //grid state sensor
                    if (this.enpowerGridStateActiveSensorsCount > 0) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${serialNumber} Grid State Sensor Service`) : false;
                        const serviceName = this.enpowerGridStateActiveSensor.namePrefix ? `${accessoryName} ${this.enpowerGridStateActiveSensor.name}` : this.enpowerGridStateActiveSensor.name;
                        const serviceType = this.enpowerGridStateActiveSensor.serviceType;
                        const characteristicType = this.enpowerGridStateActiveSensor.characteristicType;
                        const enpowerGridStateSensorService = accessory.addService(serviceType, serviceName, `enpowerGridStateSensorService`);
                        enpowerGridStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        enpowerGridStateSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        enpowerGridStateSensorService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.enpowerGridStateActiveSensor.state;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, grid state sensor: ${serviceName}, state: ${state ? 'Grid ON' : 'Grid Off'}`);
                                return state;
                            });
                        this.enpowerGridStateSensorService = enpowerGridStateSensorService;
                    };

                    //grid mode sensors
                    if (this.enpowerGridModeActiveSensorsCount > 0) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${serialNumber} Grid Mode Sensor Services`) : false;
                        this.enpowerGridModeSensorsServices = [];
                        for (let i = 0; i < this.enpowerGridModeActiveSensorsCount; i++) {
                            const serviceName = this.enpowerGridModeActiveSensors[i].namePrefix ? `${accessoryName} ${this.enpowerGridModeActiveSensors[i].name}` : this.enpowerGridModeActiveSensors[i].name;
                            const serviceType = this.enpowerGridModeActiveSensors[i].serviceType;
                            const characteristicType = this.enpowerGridModeActiveSensors[i].characteristicType;
                            const enpowerGridModeSensorService = accessory.addService(serviceType, serviceName, `enpowerGridModeSensorService${i}`);
                            enpowerGridModeSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            enpowerGridModeSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            enpowerGridModeSensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.enpowerGridModeActiveSensors[i].state;
                                    const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, grid mode sensor: ${serviceName}, state: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.enpowerGridModeSensorsServices.push(enpowerGridModeSensorService);
                        };
                    };

                    //dry contacts
                    if (dryContactsInstalled) {
                        if (this.enpowerDryContactsControl) {
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${serialNumber} Dry Contact Control Services`) : false;
                            this.dryContactsControlServices = [];
                            this.ensemble.dryContacts.forEach((contact, index) => {
                                const controlId = contact.settings.id;
                                const serviceName = contact.settings.loadName;
                                const dryContactContolService = accessory.addService(Service.Switch, serviceName, `dryContactContolService${index}`);
                                dryContactContolService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                dryContactContolService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                dryContactContolService.getCharacteristic(Characteristic.On)
                                    .onGet(async () => {
                                        const state = contact.stateBool;
                                        const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, ${serviceName}, control state: ${state ? 'ON' : 'OFF'}`);
                                        return state;
                                    })
                                    .onSet(async (state) => {
                                        try {
                                            const tokenValid = await this.checkJwtToken();
                                            const setState = tokenValid ? await this.setDryContactState(controlId, state) : false;
                                            const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Set Enpower: ${serialNumber}, ${serviceName}, control state to: ${setState ? `Manual` : `Soc`}`);
                                        } catch (error) {
                                            this.emit('warn', `Set ${serviceName}, control state error: ${error}`);
                                        };
                                    })
                                this.dryContactsControlServices.push(dryContactContolService);
                            });
                        };

                        if (this.enpowerDryContactsSensor) {
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${serialNumber} Dry Contact Sensor Services`) : false;
                            this.dryContactsSensorServices = [];
                            this.ensemble.dryContacts.forEach((contact, index) => {
                                const serviceName = contact.settings.loadName;
                                const dryContactSensorService = accessory.addService(Service.ContactSensor, serviceName, `dryContactSensorService${index}`);
                                dryContactSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                dryContactSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                dryContactSensorService.getCharacteristic(Characteristic.ContactSensorState)
                                    .onGet(async () => {
                                        const state = contact.stateBool;
                                        const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, ${serviceName}, sensor state: ${state ? 'Active' : 'Not Active'}`);
                                        return state;
                                    })
                                this.dryContactsSensorServices.push(dryContactSensorService);
                            });
                        };
                    };

                    //indyvidual enpower state
                    this.enpowersServices = [];
                    for (const enpower of this.ensemble.enpowers.devices) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${serialNumber} Service`) : false;
                        const enpowerService = accessory.addService(Service.EnphaseEnpowerService, `Enpower ${serialNumber}`, `enpowerService${serialNumber}`);
                        enpowerService.setCharacteristic(Characteristic.ConfiguredName, `Enpower ${serialNumber}`);
                        enpowerService.getCharacteristic(Characteristic.EnphaseEnpowerAdminStateStr)
                            .onGet(async () => {
                                const value = enpower.adminStateStr;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, state: ${value}`);
                                return value;
                            });
                        //enpowerService.getCharacteristic(Characteristic.EnphaseEnpowerOperating)
                        //    .onGet(async () => {
                        //       const value = enpower.operating;
                        //        const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                        //        return value;
                        //   });
                        enpowerService.getCharacteristic(Characteristic.EnphaseEnpowerCommunicating)
                            .onGet(async () => {
                                const value = enpower.communicating;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enpowerService.getCharacteristic(Characteristic.EnphaseEnpowerCommLevelSubGhz)
                            .onGet(async () => {
                                const value = enpower.commLevelSubGhz;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, sub GHz level: ${value} %`);
                                return value;
                            });
                        enpowerService.getCharacteristic(Characteristic.EnphaseEnpowerCommLevel24Ghz)
                            .onGet(async () => {
                                const value = enpower.commLevel24Ghz;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, 2.4GHz level: ${value} %`);
                                return value;
                            });
                        enpowerService.getCharacteristic(Characteristic.EnphaseEnpowerTemperature)
                            .onGet(async () => {
                                const value = enpower.temperature;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, temp: ${value} °C`);
                                return value;
                            });
                        enpowerService.getCharacteristic(Characteristic.EnphaseEnpowerMainsAdminState)
                            .onGet(async () => {
                                const value = enpower.mainsAdminState;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, mains admin state: ${value}`);
                                return value;
                            });
                        enpowerService.getCharacteristic(Characteristic.EnphaseEnpowerMainsOperState)
                            .onGet(async () => {
                                const value = enpower.mainsOperState;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, mains operating state: ${value}`);
                                return value;
                            });
                        enpowerService.getCharacteristic(Characteristic.EnphaseEnpowerEnpwrGridMode)
                            .onGet(async () => {
                                const value = enpower.enpwrGridModeTranslated;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, enpower grid mode: ${value}`);
                                return value;
                            });
                        enpowerService.getCharacteristic(Characteristic.EnphaseEnpowerEnchgGridMode)
                            .onGet(async () => {
                                const value = enpower.enchgGridModeTranslated;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, ${enchargeName} grid mode: ${value}`);
                                return value;
                            });
                        if (arfProfileSupported) {
                            enpowerService.getCharacteristic(Characteristic.EnphaseEnpowerGridProfile)
                                .onGet(async () => {
                                    const value = this.ensemble.arfProfile.name;
                                    const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, grid profile: ${value}`);
                                    return value;
                                });
                        }
                        enpowerService.getCharacteristic(Characteristic.EnphaseEnpowerStatus)
                            .onGet(async () => {
                                const value = enpower.deviceStatus;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, status: ${value}`);
                                return value;
                            });
                        enpowerService.getCharacteristic(Characteristic.EnphaseEnpowerLastReportDate)
                            .onGet(async () => {
                                const value = enpower.lastReportDate;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, last report: ${value}`);
                                return value;
                            });
                        this.enpowersServices.push(enpowerService);
                    };
                };

                //generators
                if (generatorsInstalled) {
                    const type = this.ensemble.generator.type;

                    //control 
                    if (this.generatorStateActiveControl) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Generator ${type} Control Service`) : false;
                        const serviceName = this.generatorStateActiveControl.namePrefix ? `${accessoryName} ${this.generatorStateActiveControl.name}` : this.generatorStateActiveControl.name;
                        const serviceType = this.generatorStateActiveControl.serviceType;
                        const characteristicType = this.generatorStateActiveControl.characteristicType;
                        const generatorStateControlService = accessory.addService(serviceType, serviceName, `generatorStateControlService`);
                        generatorStateControlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        generatorStateControlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        generatorStateControlService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.generatorStateActiveControl.state;
                                const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, state: ${state ? 'ON' : 'OFF'}`);
                                return state;
                            })
                            .onSet(async (state) => {
                                try {
                                    const genMode = state ? 'on' : 'off';
                                    const tokenValid = await this.checkJwtToken();
                                    const setState = tokenValid ? await this.setGeneratorMode(genMode) : false;
                                    const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Set Generator: ${type}, state to: ${setState ? `ON` : `OFF`}`);
                                } catch (error) {
                                    this.emit('warn', `Set Generator: ${type}, state error: ${error}`);
                                };
                            })
                        this.generatorStateControlService = generatorStateControlService;
                    };

                    //state sensor
                    if (this.generatorStateActiveSensor) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Generator ${type} State Sensor Service`) : false;
                        const serviceName = this.generatorStateActiveSensor.namePrefix ? `${accessoryName} ${this.generatorStateActiveSensor.name}` : this.generatorStateActiveSensor.name;
                        const serviceType = this.generatorStateActiveSensor.serviceType;
                        const characteristicType = this.generatorStateActiveSensor.characteristicType;
                        const generatorStateSensorService = accessory.addService(serviceType, serviceName, `generatorStateSensorService`);
                        generatorStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        generatorStateSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        generatorStateSensorService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.generatorStateActiveSensor.state;
                                const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, state sensor: ${serviceName}, state: ${state ? 'Grid ON' : 'Grid Off'}`);
                                return state;
                            });
                        this.generatorStateSensorService = generatorStateSensorService;
                    };

                    //mode controls
                    if (this.generatorModeActiveControlsCount > 0) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Generator ${type} Mode Control Services`) : false;
                        this.generatorModeControlsServices = [];
                        for (let i = 0; i < this.generatorModeActiveControlsCount; i++) {
                            const serviceName = this.generatorModeActiveControls[i].namePrefix ? `${accessoryName} ${this.generatorModeActiveControls[i].name}` : this.generatorModeActiveControls[i].name;
                            const serviceType = this.generatorModeActiveControls[i].serviceType;
                            const characteristicType = this.generatorModeActiveControls[i].characteristicType;
                            const generatorModeControlService = accessory.addService(serviceType, serviceName, `generatorModeControlService${i}`);
                            generatorModeControlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            generatorModeControlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            generatorModeControlService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.generatorModeActiveControls[i].state;
                                    const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, mode control: ${serviceName}, state: ${state ? 'ON' : 'OFF'}`);
                                    return state;
                                })
                                .onSet(async (state) => {
                                    try {
                                        const genMode = this.generatorModeActiveControls[i].mode;
                                        const tokenValid = await this.checkJwtToken();
                                        const setState = tokenValid && state ? await this.setGeneratorMode(genMode) : false;
                                        const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Set Generator: ${type}, mode to: ${genMode}`);
                                    } catch (error) {
                                        this.emit('warn', `Set Generator: ${type}, state error: ${error}`);
                                    };
                                })
                            this.generatorModeControlsServices.push(generatorModeControlService);
                        };
                    };

                    //mode sensors
                    if (this.generatorModeActiveSensorsCount > 0) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Generator ${type} Mode Sensor Services`) : false;
                        this.generatorModeSensorsServices = [];
                        for (let i = 0; i < this.generatorModeActiveSensorsCount; i++) {
                            const serviceName = this.generatorModeActiveSensors[i].namePrefix ? `${accessoryName} ${this.generatorModeActiveSensors[i].name}` : this.generatorModeActiveSensors[i].name;
                            const serviceType = this.generatorModeActiveSensors[i].serviceType;
                            const characteristicType = this.generatorModeActiveSensors[i].characteristicType;
                            const generatorModeSensorService = accessory.addService(serviceType, serviceName, `generatorModeSensorService${i}`);
                            generatorModeSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            generatorModeSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            generatorModeSensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.generatorModeActiveSensors[i].state;
                                    const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, mode sensor: ${serviceName}, state: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.generatorModeSensorsServices.push(generatorModeSensorService);
                        };
                    };

                    //indyvidual generator state
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Generator ${type} Service`) : false;
                    const generatorService = accessory.addService(Service.EnphaseGerneratorService, `Generator ${type}`, `generatorService`);
                    generatorService.setCharacteristic(Characteristic.ConfiguredName, `Generator ${type}`);
                    generatorService.getCharacteristic(Characteristic.EnphaseEnsembleGeneratorType)
                        .onGet(async () => {
                            const value = this.ensemble.generator.type;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator type: ${type}`);
                            return value;
                        });
                    generatorService.getCharacteristic(Characteristic.EnphaseEnsembleGeneratorAdminMode)
                        .onGet(async () => {
                            const value = this.ensemble.generator.adminMode;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, admin mode: ${value}`);
                            return value;
                        });
                    generatorService.getCharacteristic(Characteristic.EnphaseEnsembleGeneratorAdminState)
                        .onGet(async () => {
                            const value = this.ensemble.generator.adminState;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, admin state: ${value}`);
                            return value;
                        });
                    generatorService.getCharacteristic(Characteristic.EnphaseEnsembleGeneratorOperState)
                        .onGet(async () => {
                            const value = this.ensemble.generator.operState;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, operation state: ${value}`);
                            return value;
                        });
                    generatorService.getCharacteristic(Characteristic.EnphaseEnsembleGeneratorStartSoc)
                        .onGet(async () => {
                            const value = this.ensemble.generator.startSoc;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, start soc: ${value}`);
                            return value;
                        });
                    generatorService.getCharacteristic(Characteristic.EnphaseEnsembleGeneratorStopSoc)
                        .onGet(async () => {
                            const value = this.ensemble.generator.stopSoc;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, stop soc: ${value}`);
                            return value;
                        });
                    generatorService.getCharacteristic(Characteristic.EnphaseEnsembleGeneratorExexOn)
                        .onGet(async () => {
                            const value = this.ensemble.generator.excOn;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, exec on: ${value}`);
                            return value;
                        });
                    generatorService.getCharacteristic(Characteristic.EnphaseEnsembleGeneratorShedule)
                        .onGet(async () => {
                            const value = this.ensemble.generator.schedule;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, shedule: ${value}`);
                            return value;
                        });
                    generatorService.getCharacteristic(Characteristic.EnphaseEnsembleGeneratorPresent)
                        .onGet(async () => {
                            const value = this.ensemble.generator.present;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, present: ${value}`);
                            return value;
                        });
                    this.generatorService = generatorService;
                };
            };

            //live data
            if (liveDataSupported) {
                this.liveDataServices = [];
                for (const liveData of this.pv.liveData.devices) {
                    const liveDataType = liveData.type;
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Live Data ${liveDataType} Service`) : false;
                    const liveDataService = accessory.addService(Service.EnphaseLiveDataService, `Live Data ${liveDataType}`, `liveDataService${liveDataType}`);
                    liveDataService.setCharacteristic(Characteristic.ConfiguredName, `Live Data ${liveDataType}`);
                    if (liveData.activePower !== 'notSupported') {
                        liveDataService.getCharacteristic(Characteristic.EnphaseLiveDataActivePower)
                            .onGet(async () => {
                                const value = liveData.activePower;
                                const info = this.disableLogInfo ? false : this.emit('info', `Live Data ${liveDataType}, active power: ${value} kW`);
                                return value;
                            });
                    };
                    if (liveData.activePowerL1 !== 'notSupported') {
                        liveDataService.getCharacteristic(Characteristic.EnphaseLiveDataActivePowerL1)
                            .onGet(async () => {
                                const value = liveData.activePowerL1;
                                const info = this.disableLogInfo ? false : this.emit('info', `Live Data ${liveDataType} L1, active power: ${value} kW`);
                                return value;
                            });
                    }
                    if (liveData.activePowerL2 !== 'notSupported') {
                        liveDataService.getCharacteristic(Characteristic.EnphaseLiveDataActivePowerL2)
                            .onGet(async () => {
                                const value = liveData.activePowerL2;
                                const info = this.disableLogInfo ? false : this.emit('info', `Live Data ${liveDataType} L2, active power: ${value} kW`);
                                return value;
                            });
                    }
                    if (liveData.activePowerL3 !== 'notSupported') {
                        liveDataService.getCharacteristic(Characteristic.EnphaseLiveDataActivePowerL3)
                            .onGet(async () => {
                                const value = liveData.activePowerL3;
                                const info = this.disableLogInfo ? false : this.emit('info', `Live Data ${liveDataType} L3, active power: ${value} kW`);
                                return value;
                            });
                    }
                    if (liveData.apparentPower !== 'notSupported') {
                        liveDataService.getCharacteristic(Characteristic.EnphaseLiveDataApparentPower)
                            .onGet(async () => {
                                const value = liveData.apparentPower;
                                const info = this.disableLogInfo ? false : this.emit('info', `Live Data ${liveDataType}, apparent power: ${value} kVA`);
                                return value;
                            });
                    }
                    if (liveData.apparentPowerL1 !== 'notSupported') {
                        liveDataService.getCharacteristic(Characteristic.EnphaseLiveDataApparentPowerL1)
                            .onGet(async () => {
                                const value = liveData.apparentPowerL1;
                                const info = this.disableLogInfo ? false : this.emit('info', `Live Data ${liveDataType} L1, apparent power: ${value} kVA`);
                                return value;
                            });
                    }
                    if (liveData.apparentPowerL2 !== 'notSupported') {
                        liveDataService.getCharacteristic(Characteristic.EnphaseLiveDataApparentPowerL2)
                            .onGet(async () => {
                                const value = liveData.apparentPowerL2;
                                const info = this.disableLogInfo ? false : this.emit('info', `Live Data ${liveDataType} L2, apparent power: ${value} kVA`);
                                return value;
                            });
                    }
                    if (liveData.apparentPowerL3 !== 'notSupported') {
                        liveDataService.getCharacteristic(Characteristic.EnphaseLiveDataApparentPowerL3)
                            .onGet(async () => {
                                const value = liveData.apparentPowerL3;
                                const info = this.disableLogInfo ? false : this.emit('info', `Live Data ${liveDataType} L3, apparent power: ${value} kVA`);
                                return value;
                            });
                    }
                    this.liveDataServices.push(liveDataService);
                }
            };

            return accessory;
        } catch (error) {
            throw new Error(`Prepare accessory error: ${error}`)
        };
    };

    //start
    async start() {
        const debug = this.enableDebugMode ? this.emit('debug', `Start`) : false;
        try {
            //get envoy info
            const updateInfo = await this.updateInfo();

            //calculate envoy and installer passwords
            const digestAuthorizationEnvoy = this.pv.envoy.firmware < 700 && updateInfo ? await this.digestAuthorizationEnvoy() : false;
            const digestAuthorizationInstaller = this.pv.envoy.firmware < 700 && updateInfo ? await this.digestAuthorizationInstaller() : false;

            //read JWT token from file
            if (this.pv.envoy.firmware >= 700 && this.envoyFirmware7xxTokenGenerationMode === 1) {
                try {
                    const data = await this.readData(this.envoyTokenFile);
                    const parsedData = JSON.parse(data);
                    const debug = this.enableDebugMode ? this.emit('debug', `Envoy JWT Token from file: ${parsedData.token ? 'Exist' : 'Missing'}`) : false;
                    this.pv.envoy.jwtToken = parsedData.token ? parsedData : this.pv.envoy.jwtToken;
                } catch (error) {
                    this.emit('warn', `Read JWT Token from file error: ${error}`)
                };
            };

            //get and validate jwt token
            const tokenValid = this.pv.envoy.firmware >= 700 ? await this.checkJwtToken() : false;
            if (this.pv.envoy.firmware >= 700 && !tokenValid) {
                return null;
            };

            //update grid profile
            const updateGridProfile = tokenValid ? await this.updateGridProfile() : false;

            //get home and inventory
            const refreshHome = updateInfo ? await this.updateHome() : false;
            const updateInventory = refreshHome ? await this.updateInventory() : false;

            //get meters
            const refreshMeters = this.feature.meters.supported ? await this.updateMeters() : false;
            const updateMetersReading = refreshMeters ? await this.updateMetersReading() : false;

            //acces with envoy password
            const refreshMicroinverters = tokenValid || digestAuthorizationEnvoy ? await this.updateMicroinvertersStatus() : false;

            //get production inverters and production ct
            const refreshProduction = await this.updateProductionInverters();
            const updateProductionCt = refreshProduction ? await this.updateProductionCt() : false;

            //get production all ab D8.2.4391
            const refreshProductionAll = tokenValid && this.pv.envoy.firmware >= 824 ? await this.updateProductionAll() : false;

            //access with installer password and envoy dev id
            if (this.productionStateActiveControl || this.productionStateActiveSensor) {
                try {
                    //check if the envoy ID is stored
                    const response = await this.readData(this.envoyIdFile);
                    const debug = this.enableDebugMode ? this.emit('debug', `Envoy dev Id from file: ${response.toString().length === 9 ? 'Exist' : 'Missing'}`) : false;
                    this.pv.envoy.devId = response.toString().length === 9 ? response.toString() : this.pv.envoy.devId;
                } catch (error) {
                    this.emit('warn', `Read envoy dev Id from file error: ${error}`)
                };

                //read envoy dev id from app
                try {
                    const envoyDevIdValid = this.pv.envoy.devId.length === 9 && updateInfo ? true : await this.getEnvoyBackboneApp();
                    const updatePowerProductionState = envoyDevIdValid && ((this.pv.envoy.jwtToken.installer && tokenValid) || digestAuthorizationInstaller) ? await this.updateProductionState() : false;
                } catch (error) {
                    this.emit('warn', `Read envoy dev Id or update production state error: ${error}`)
                };
            };

            //get ensemble data only FW. >= 7.x.x.
            const refreshEnsemble = tokenValid ? await this.updateEnsembleInventory() : false;
            const updateEnsembleStatus = refreshEnsemble ? await this.updateEnsembleStatus() : false;
            const updateEnchargeSettings = refreshEnsemble ? await this.updateEnchargesSettings() : false;
            const updateTariffSettings = refreshEnsemble ? await this.updateTariff() : false;
            const updateDryContacts = refreshEnsemble ? await this.updateDryContacts() : false;
            const updateDryContactsSettings = updateDryContacts ? await this.updateDryContactsSettings() : false;
            const updateGenerator = refreshEnsemble ? await this.updateGenerator() : false;
            const updateGeneratorSettings = updateGenerator ? await this.updateGeneratorSettings() : false;

            //get plc communication level
            const updateCommLevel = this.plcLevelActiveControl && ((this.pv.envoy.jwtToken.installer && tokenValid) || digestAuthorizationInstaller) ? await this.updateCommLevel() : false;
            const refreshLiveData = tokenValid ? await this.updateLiveData() : false;

            //connect to deice success
            this.emit('success', `Connect Success`)

            //get device info
            const logDeviceInfo = !this.disableLogDeviceInfo ? this.getDeviceInfo() : false;

            //start external integrations
            const startExternalIntegrations = this.restFul.enable || this.mqtt.enable ? await this.externalIntegrations() : false;

            //prepare accessory
            const accessory = this.startPrepareAccessory ? await this.prepareAccessory() : false;
            const publishAccessory = this.startPrepareAccessory ? this.emit('publishAccessory', accessory) : false;
            this.startPrepareAccessory = false;

            //create timers
            this.timers = [];
            const pushTimer0 = refreshHome ? this.timers.push({ name: 'updateHome', sampling: 60000 }) : false;
            const pushTimer1 = refreshMeters ? this.timers.push({ name: 'updateMeters', sampling: this.metersDataRefreshTime }) : false;
            const pushTimer3 = refreshMicroinverters ? this.timers.push({ name: 'updateMicroinvertersStatus', sampling: 80000 }) : false;
            const pushTimer2 = refreshProduction ? this.timers.push({ name: 'updateProduction', sampling: this.productionDataRefreshTime }) : false;
            const pushTimer6 = refreshProductionAll ? this.timers.push({ name: 'updateProductionAll', sampling: this.productionDataRefreshTime }) : false;
            const pushTimer4 = refreshEnsemble ? this.timers.push({ name: 'updateEnsemble', sampling: this.ensembleDataRefreshTime }) : false;
            const pushTimer5 = refreshLiveData ? this.timers.push({ name: 'updateLiveData', sampling: this.liveDataRefreshTime }) : false;

            return true;
        } catch (error) {
            throw new Error(`Start error: ${error}`);
        };
    };
}
export default EnvoyDevice;
