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

        this.lockControl = device.lockControl || false;
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
        }

        //production state sensor
        const productionStateSensorDisplayType = this.productionStateSensor.displayType ?? 0;
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
        const plcLevelControlDisplayType = this.plcLevelControl.displayType ?? 0;
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
        const dataRefreshControlDisplayType = this.dataRefreshControl.displayType ?? 0;
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
        const dataRefreshSensorDisplayType = this.dataRefreshSensor.displayType ?? 0;
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
        this.powerProductionLevelActiveSensorsCount = this.powerProductionLevelActiveSensors.length || 0;

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
        this.powerConsumptionTotalLevelActiveSensorsCount = this.powerConsumptionTotalLevelActiveSensors.length || 0;

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
        this.powerConsumptionNetLevelActiveSensorsCount = this.powerConsumptionNetLevelActiveSensors.length || 0;

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
        this.gridProductionQualityActiveSensorsCount = this.gridProductionQualityActiveSensors.length || 0;

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
        this.gridConsumptionTotalQualityActiveSensorsCount = this.gridConsumptionTotalQualityActiveSensors.length || 0;

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
        this.gridConsumptionNetQualityActiveSensorsCount = this.gridConsumptionNetQualityActiveSensors.length || 0;

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
        this.enpowerGridModeActiveSensorsCount = this.enpowerGridModeActiveSensors.length || 0;

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
        this.solarGridModeActiveSensorsCount = this.solarGridModeActiveSensors.length || 0;

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
            info: {
                devId: '',
                envoyPasswd: '',
                installerPasswd: '',
                firmware: 500,
                firmware7xx: false,
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
                    count: 0
                },
                encs: {
                    supported: false,
                    installed: false,
                    count: 0
                }
            },
            pcuStatus: {
                supported: false
            },
            deviceData: {
                supported: false
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
                }
            },
            metersReading: {
                supported: false,
                installed: false,
                count: 0,
                channels: {
                    supported: false,
                    installed: false,
                    count: 0
                }
            },
            production: {
                supported: false
            },
            energy: {
                supported: false,
                production: {
                    supported: false
                },
                consumption: {
                    supported: false
                }
            },
            productionPdm: {
                supported: false,
                pcu: {
                    installed: false
                },
                eim: {
                    installed: false
                },
                rgm: {
                    installed: false
                },
                pmu: {
                    installed: false
                }
            },
            energyPdm: {
                supported: false,
                production: {
                    supported: false,
                    pcu: {
                        installed: false
                    },
                    eim: {
                        installed: false
                    },
                    rgm: {
                        installed: false
                    },
                    pmu: {
                        installed: false
                    }
                },
                consumption: {
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
                consumption: {
                    supported: false
                },
                acBatterie: {
                    supported: false
                }
            },
            productionAll: {
                supported: false,
                production: {
                    supported: false
                },
                consumption: {
                    supported: false
                }
            },
            ensemble: {
                supported: false,
                installed: false,
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
                }
            },
            tariff: {
                supported: false
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
            gridProfile: {
                supported: false
            },
            plcLevel: {
                supported: false
            },
            productionState: {
                supported: false
            },
            backboneApp: {
                supported: false
            },
            dataSampling: false,
            checkJwtTokenRunning: false,
            cookie: false
        };

        //pv object
        this.pv = {
            info: {},
            home: {},
            inventory: {
                pcus: [],
                nsrbs: [],
                acbs: [],
                esubs: [],
            },
            deviceData: {},
            meters: {
                data: [],
                production: {},
                consumption: {},
                acBatterie: {}
            },
            production: {
                pcu: {}
            },
            energy: {},
            productionPdm: {
                pcu: {},
                eim: {},
                rgm: {},
                pmu: {}
            },
            energyPdm: {
                production: {
                    pcu: {},
                    eim: {},
                    rgm: {},
                    pmu: {},
                },
                consumption: {
                    eim: {},
                }
            },
            productionCt: {
                pcu: {},
                eim: {},
                consumption: [],
                acBatterie: {}
            },
            productionAll: {
                production: {},
                consumption: []
            },
            ensemble: {
                enpowers: {
                    devices: []
                },
                encharges: {
                    devices: [],
                    settings: {}
                },
                counters: {},
                secctrl: {},
                relay: {},
                tariff: {},
                dryContacts: [],
                generator: {}
            },
            liveData: {},
            gridProfile: {},
            productionState: false,
            plcLevelState: false,
            powerState: false,
            powerLevel: 0,
            productionPowerPeak: 0,
            consumptionTotalPowerPeak: 0,
            consumptionNetPowerPeak: 0
        };

        //create impulse generator
        this.impulseGenerator = new ImpulseGenerator();
        this.impulseGenerator
            .on('updateHomeInventoryAndPcuStatus', async () => {
                try {
                    const tokenValid = await this.checkJwtToken();
                    const updateHome = tokenValid && this.feature.home.supported ? await this.updateHome() : false;
                    const updateInventory = updateHome && this.feature.inventory.supported ? await this.updateInventory() : false;
                    const updatePcuStatus = updateInventory && this.feature.pcuStatus.supported ? await this.updatePcuStatus() : false;
                    const updateDeviceData = updateInventory && this.feature.deviceData.supported ? await this.updateDeviceData(false) : false;
                } catch (error) {
                    this.handleError(error);
                }
            })
            .on('updateProduction', async () => {
                try {
                    const tokenValid = await this.checkJwtToken();
                    const updateMeters = tokenValid && this.feature.meters.supported ? await this.updateMeters() : false;
                    const updateMetersReading = updateMeters && this.feature.meters.installed && this.feature.metersReading.supported ? await this.updateMetersReading() : false;
                    const updateProduction = tokenValid && this.feature.production.supported ? await this.updateProduction() : false;
                    const updateProductionPdm = tokenValid && this.feature.productionPdm.supported ? await this.updateProductionPdm() : false;
                    const updateEnergyPdm = updateProductionPdm && this.feature.energyPdm.supported ? await this.updateEnergyPdm() : false;
                    const updateProductionCt = (updateMetersReading || updateProduction || updateEnergyPdm) && this.feature.productionCt.supported ? await this.updateProductionCt() : false;
                    const updateProductionAll = (updateMetersReading || updateProduction || updateEnergyPdm || updateProductionCt) && this.feature.productionAll.supported ? await this.updateProductionAll() : false;
                } catch (error) {
                    this.handleError(error);
                }
            })
            .on('updateEnsemble', async () => {
                try {
                    const tokenValid = await this.checkJwtToken();
                    const updateEnsemble = tokenValid && this.feature.ensemble.supported ? await this.updateEnsembleInventory() : false;
                    const updateEnsembleStatus = updateEnsemble && this.feature.ensemble.status.supported ? await this.updateEnsembleStatus() : false;
                    const updateEnchargeSettings = updateEnsemble && this.feature.encharges.settings.supported ? await this.updateEnchargesSettings() : false;
                    const updateTariffSettings = updateEnchargeSettings && this.feature.tariff.supported ? await this.updateTariff() : false;
                    const updateDryContacts = updateEnsemble && this.feature.dryContacts.supported ? await this.updateDryContacts() : false;
                    const updateDryContactsSettings = updateDryContacts && this.feature.dryContacts.settings.supported ? await this.updateDryContactsSettings() : false;
                    const updateGenerator = tokenValid && this.feature.generators.installed ? await this.updateGenerator() : false;
                    const updateGeneratorSettings = updateGenerator && this.feature.generators.settings.supported ? await this.updateGeneratorSettings() : false;
                } catch (error) {
                    this.handleError(error);
                }
            })
            .on('updateLiveData', async () => {
                try {
                    const tokenValid = await this.checkJwtToken();
                    const updateLiveData = tokenValid && this.feature.liveData.supported ? await this.updateLiveData() : false;
                } catch (error) {
                    this.handleError(error);
                }
            })
            .on('updateGridPlcAndProductionState', async () => {
                try {
                    const tokenValid = await this.checkJwtToken();
                    const updateGridprofile = tokenValid && this.feature.gridProfile.supported ? await this.updateGridProfile(false) : false;
                    const updatePlcLevel = tokenValid && this.feature.plcLevel.supported ? await this.updatePlcLevel(false) : false;
                    const updateProductionState = tokenValid && this.feature.productionState.supported ? await this.updateProductionState(false) : false;
                } catch (error) {
                    this.handleError(error);
                }
            })
            .on('state', (state) => {
                const emitState = state ? this.emit('success', `Impulse generator started`) : this.emit('warn', `Impulse generator stopped`);
                this.feature.dataSampling = state;

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
                        .updateCharacteristic(Characteristic.EnvoyDataRefresh, state)
                }

                //restFul
                const restFul = this.restFulConnected ? this.restFul1.update('datasampling', { state: state }) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Data Sampling', { state: state }) : false;
            })
    }

    handleError(error) {
        const errorString = error.toString();
        const tokenNotValid = errorString.includes('status code 401');
        if (tokenNotValid) {
            if (this.feature.checkJwtTokenRunning) {
                return;
            }
            this.feature.info.jwtToken.token = '';
            this.feature.cookie = false;
            return;
        }
        this.emit('error', `Impulse generator: ${error}`);
    }

    async getInfo() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting info`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.GetInfo);
            const info = response.data;

            //parse info
            const options = {
                ignoreAttributes: false,
                ignorePiTags: true,
                allowBooleanAttributes: true
            };
            const parserXml = new XMLParser(options);
            const parseInfo = parserXml.parse(info);
            const updatedInfoData = {
                ...parseInfo,
                envoy_info: {
                    ...parseInfo.envoy_info,
                    device: {
                        ...parseInfo.envoy_info.device,
                        sn: 'removed'
                    },
                },
            };
            const debug = this.enableDebugMode ? this.emit('debug', `Parsed info:`, updatedInfoData) : false;

            //envoy
            const envoyInfo = parseInfo.envoy_info;
            const envoyInfoDevice = envoyInfo.device;
            const envoyInfoBuildInfo = envoyInfo.build_info;
            const obj = {
                time: new Date(envoyInfo.time * 1000).toLocaleString(),
                serialNumber: envoyInfoDevice.sn ? envoyInfoDevice.sn.toString() : false,
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
            if (!obj.serialNumber) {
                this.emit('warn', `Envoy serial number missing!`);
                return null;
            }
            this.pv.info = obj;

            //meters supported 
            this.feature.meters.supported = obj.imeter;

            //firmware
            const cleanedString = obj.software.replace(/\D/g, '')
            const envoyFirmware = cleanedString ? parseInt(cleanedString.slice(0, 3)) : 500;
            this.feature.info.firmware = envoyFirmware;
            this.feature.info.firmware7xx = envoyFirmware >= 700;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('info', parseInfo) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Info', parseInfo) : false;
            return true;
        } catch (error) {
            throw new Error(`Update info error: ${error}`);
        }
    }

    async checkJwtToken(start) {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting check JWT token`) : false;

        if (this.feature.checkJwtTokenRunning) {
            return null;
        }

        if (this.feature.info.firmware < 700) {
            return true;
        }

        try {
            this.feature.checkJwtTokenRunning = true;

            //read JWT token from file
            if (this.envoyFirmware7xxTokenGenerationMode === 1 && start) {
                try {
                    const data = await this.readData(this.envoyTokenFile);
                    const parsedData = JSON.parse(data);
                    const debug = this.enableDebugMode ? this.emit('debug', `Envoy JWT Token from file: ${parsedData.token ? 'Exist' : 'Missing'}`) : false;
                    this.feature.info.jwtToken = parsedData.token ? parsedData : this.feature.info.jwtToken;
                } catch (error) {
                    this.emit('warn', `Read JWT Token from file error: ${error}`)
                }
            }

            //check token is valid
            const tokenValid = this.envoyFirmware7xxTokenGenerationMode === 2 && this.feature.info.jwtToken.token ? true : this.feature.info.jwtToken.token && this.feature.info.jwtToken.expires_at >= Math.floor(Date.now() / 1000) + 60;
            const debug = this.enableDebugMode ? this.emit('debug', `JWT Token: ${tokenValid ? 'Valid' : 'Not valid'}`) : false;

            //check cookie are valid
            const cookieValid = this.feature.cookie;
            const debug1 = this.enableDebugMode ? this.emit('debug', `Cookie: ${cookieValid ? 'Valid' : 'Not valid'}`) : false;

            if (tokenValid && cookieValid) {
                this.feature.checkJwtTokenRunning = false;
                return true;
            }

            //get new JWT token
            const wait = !tokenValid ? await new Promise(resolve => setTimeout(resolve, 30000)) : false;
            const emit = !tokenValid ? this.emit('warn', `JWT Token not valid, refreshing`) : false;
            const getToken = !tokenValid ? await this.getJwtToken() : true;
            if (!getToken) {
                this.feature.checkJwtTokenRunning = false;
                return null;
            }

            //always get new cookie
            this.emit('warn', `Cookie not valid, refreshing`);
            const getCookie = await this.getCookie();
            if (!getCookie) {
                this.feature.checkJwtTokenRunning = false;
                return null;
            }
            this.feature.checkJwtTokenRunning = false;
            return true;
        } catch (error) {
            this.feature.checkJwtTokenRunning = false;
            throw new Error(`Check JWT token error: ${error}`);
        }
    }

    async getJwtToken() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting JWT token`) : false;

        try {
            const envoyToken = new EnvoyToken({
                user: this.enlightenUser,
                passwd: this.enlightenPassword,
                serialNumber: this.pv.info.serialNumber
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
            this.feature.info.jwtToken = tokenData;

            //save token
            try {
                await this.saveData(this.envoyTokenFile, tokenData);
            } catch (error) {
                this.emit('error', `Save token error: ${error}`);
            }

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('token', tokenData) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Token', tokenData) : false;
            return true;
        } catch (error) {
            throw new Error(`Get JWT token error: ${error}`);
        }
    }

    async getCookie() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting cookie`) : false;

        try {
            this.feature.cookie = false;

            const options = {
                method: 'GET',
                baseURL: this.url,
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.feature.info.jwtToken.token}`
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
                this.emit('warn', `Cookie not found in headers`)
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

            this.feature.cookie = cookie;
            this.emit('success', `Cookie refresh success`);
            return true;
        } catch (error) {
            this.feature.cookie = false;
            throw new Error(`Get cookie error: ${error}`);
        }
    }

    async digestAuthorizationEnvoy() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting digest authorization envoy`) : false;
        try {
            //envoy password
            const deviceSn = this.pv.info.serialNumber;
            const envoyPasswd = this.envoyPasswd ? this.envoyPasswd : deviceSn.substring(6);
            const debug2 = this.enableDebugMode ? this.emit('debug', `Digest authorization envoy password:`, envoyPasswd.length === 6 ? 'Valid' : 'Not valid') : false;
            if (envoyPasswd.length !== 6) {
                this.emit('warn', `Digest authorization envoy password is not correct, dont worry all working correct, only the power and power max of pcu will not be displayed`)
                return null;
            }

            //digest authorization envoy
            this.digestAuthEnvoy = new DigestAuth({
                user: Authorization.EnvoyUser,
                passwd: envoyPasswd
            });

            this.feature.info.envoyPasswd = envoyPasswd;
            return true;
        } catch (error) {
            this.emit('warn', `Digest authorization error: ${error}, dont worry all working correct, only the power and power max of pcu will not be displayed`);
            return null;
        }
    }

    async digestAuthorizationInstaller() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting digest authorization installer`) : false;
        try {
            //calculate installer password
            const deviceSn = this.pv.info.serialNumber;
            const passwdCalc = new PasswdCalc({
                user: Authorization.InstallerUser,
                realm: Authorization.Realm,
                serialNumber: deviceSn
            });

            //caalculate installer password
            const installerPasswd = await passwdCalc.getPasswd();
            const debug = this.enableDebugMode ? this.emit('debug', `Digest authorization installer password:`, installerPasswd.length > 1 ? 'Valid' : 'Not valid') : false;
            if (installerPasswd.length <= 1) {
                this.emit('warn', `Digest authorization installer password: ${installerPasswd}, is not correct, dont worry all working correct, only the power production state/control and plc level will not be displayed`)
                return null;
            }

            this.digestAuthInstaller = new DigestAuth({
                user: Authorization.InstallerUser,
                passwd: installerPasswd
            });

            this.feature.info.installerPasswd = installerPasswd;
            return true;
        } catch (error) {
            this.emit('warn', `Digest authorization installer error: ${error}, dont worry all working correct, only the power production state/control and plc level will not be displayed`);
            return null;
        }
    }

    async updateHome() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting home`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.Home);
            const home = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Home:`, home) : false;

            //get object keys of home
            const homeKeys = Object.keys(home);
            const commKeys = Object.keys(home.comm);

            //get supported devices
            const microinvertersSupported = commKeys.includes('pcu');
            const acBatteriesSupported = commKeys.includes('acb');
            const qRelaysSupported = commKeys.includes('nsrb');
            const ensemblesSupported = commKeys.includes('esub');
            const enchargesSupported = commKeys.includes('encharge');

            //network
            const network = home.network;
            const networkInterfaces = network.interfaces ?? [];
            const networkInterfacesSupported = networkInterfaces.length > 0;

            //comm
            const comm = home.comm;
            const commEnsemble = ensemblesSupported ? comm.esub : {};
            const commEncharges = enchargesSupported ? comm.encharge : [];

            //wireless connection kit
            const wirelessConnections = home.wireless_connection ?? [];
            const wirelessConnectionsSupported = wirelessConnections.length > 0;

            //home
            const obj = {
                softwareBuildEpoch: new Date(home.software_build_epoch * 1000).toLocaleString(),
                isEnvoy: home.is_nonvoy === false ?? true,
                dbSize: home.db_size ?? -1,
                dbPercentFull: home.db_percent_full ?? -1,
                timeZone: home.timezone ?? 'Unknown',
                currentDate: new Date(home.current_date).toLocaleString().slice(0, 11) ?? 'Unknown',
                currentTime: home.current_time ?? 'Unknown',
                tariff: ApiCodes[home.tariff] ?? 'Unknown',
                alerts: (Array.isArray(home.alerts) && (home.alerts).length > 0) ? ((home.alerts).map(a => ApiCodes[a.msg_key] || a.msg_key).join(', ')).substring(0, 64) : 'No alerts',
                updateStatus: ApiCodes[home.update_status],
                network: {
                    webComm: network.web_comm === true,
                    everReportedToEnlighten: network.ever_reported_to_enlighten === true,
                    lastEnlightenReporDate: new Date(network.last_enlighten_report_time * 1000).toLocaleString(),
                    primaryInterface: ApiCodes[network.primary_interface] ?? 'Unknown',
                    interfaces: networkInterfaces.map(data => {
                        return {
                            type: ApiCodes[data.type] ?? 'Unknown',
                            interface: data.interface,
                            mac: data.type !== 'cellular' ? data.mac : null,
                            dhcp: data.dhcp,
                            ip: data.ip,
                            carrier: data.carrier,
                            signalStrength: data.type === 'cellular' ? data.signal_strength : data.signal_strength * 20,
                            signalStrengthMax: data.type === 'cellular' ? data.signal_strength_max : data.signal_strength_max * 20,
                            supported: data.type === 'wifi' ? data.supported : null,
                            present: data.type === 'wifi' ? data.present : null,
                            configured: data.type === 'wifi' ? data.configured : null,
                            status: data.type === 'wifi' ? ApiCodes[data.status] : null
                        };
                    })
                },
                comm: {
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
                    encharges: commEncharges.map(data => {
                        return {
                            num: data.num ?? 0,
                            level: data.level * 20 ?? 0,
                            level24g: data.level_24g * 20 ?? 0,
                            levelSubg: data.level_subg * 20 ?? 0
                        };
                    }),
                },
                wirelessKits: wirelessConnections.map(data => {
                    return {
                        signalStrength: data.signal_strength * 20,
                        signalStrengthMax: data.signal_strength_max * 20,
                        type: ApiCodes[data.type] ?? 'Unknown',
                        connected: data.connected ?? false
                    };
                })
            };
            //add obj to pv home
            this.pv.home = obj;

            //update chaaracteristics
            if (this.wirelessConnectionsKitServices?.length && obj.wirelessKits?.length) {
                for (let i = 0; i < this.wirelessConnectionsKitServices.length; i++) {
                    const service = this.wirelessConnectionsKitServices[i];
                    const kit = obj.wirelessKits[i];
                    if (service && kit) {
                        service
                            .updateCharacteristic(Characteristic.WirelessConnectionKitSignalStrength, kit.signalStrength)
                            .updateCharacteristic(Characteristic.WirelessConnectionKitSignalStrengthMax, kit.signalStrengthMax)
                            .updateCharacteristic(Characteristic.WirelessConnectionKitType, kit.type)
                            .updateCharacteristic(Characteristic.WirelessConnectionKitConnected, kit.connected);
                    }
                }
            }

            //update chaaracteristics
            const service = this.envoyService;
            if (service) {
                service
                    .updateCharacteristic(Characteristic.EnvoyAlerts, obj.alerts)
                    .updateCharacteristic(Characteristic.EnvoyTimeZone, obj.timeZone)
                    .updateCharacteristic(Characteristic.EnvoyCurrentDateTime, `${obj.currentDate} ${obj.currentTime}`)
                    .updateCharacteristic(Characteristic.EnvoyNetworkWebComm, obj.network.webComm)
                    .updateCharacteristic(Characteristic.EnvoyEverReportedToEnlighten, obj.network.everReportedToEnlighten)
                    .updateCharacteristic(Characteristic.EnvoyLastEnlightenReporDate, obj.network.lastEnlightenReporDate)
                    .updateCharacteristic(Characteristic.EnvoyPrimaryInterface, obj.network.primaryInterface)
                    .updateCharacteristic(Characteristic.EnvoyTariff, obj.tariff)
                    .updateCharacteristic(Characteristic.EnvoyCommNumAndLevel, `${obj.comm.num} / ${obj.comm.level} %`)
                    .updateCharacteristic(Characteristic.EnvoyCommNumPcuAndLevel, `${obj.comm.pcuNum} / ${obj.comm.pcuLevel} %`);

                if (this.feature?.inventory?.nsrbs?.installed) {
                    service.updateCharacteristic(Characteristic.EnvoyCommNumNsrbAndLevel, `${obj.comm.nsrbNum} / ${obj.comm.nsrbLevel} %`);
                }
                if (obj.dbSize !== -1 && obj.dbPercentFull !== -1) {
                    service.updateCharacteristic(Characteristic.EnvoyDbSize, `${obj.dbSize} / ${obj.dbPercentFull} %`);
                }
                if (this.feature?.gridProfile?.supported) {
                    service.updateCharacteristic(Characteristic.EnvoyGridProfile, this.pv.gridProfile.name);
                }
                if (this.feature?.inventory?.acbs?.installed) {
                    service.updateCharacteristic(Characteristic.EnvoyCommNumAcbAndLevel, `${obj.comm.acbNum} / ${obj.comm.acbLevel} %`);
                }
                if (this.feature?.encharges?.installed) {
                    const enchg = obj.comm.encharges?.[0];
                    if (enchg) {
                        service.updateCharacteristic(Characteristic.EnvoyCommNumEnchgAndLevel, `${enchg.num} / ${enchg.level} %`);
                    }
                }
                if (obj.updateStatus) {
                    service.updateCharacteristic(Characteristic.EnvoyUpdateStatus, obj.updateStatus);
                }
            }


            //supported home and devices
            this.feature.inventory.pcus.supported = microinvertersSupported;
            this.feature.inventory.acbs.supported = acBatteriesSupported;
            this.feature.inventory.nsrbs.supported = qRelaysSupported;
            this.feature.inventory.esubs.supported = ensemblesSupported;
            this.feature.inventory.encs.supported = enchargesSupported;
            this.feature.home.networkInterfaces.supported = networkInterfacesSupported;
            this.feature.home.networkInterfaces.installed = obj.network.interfaces.some(connection => connection.carrier) ?? false;
            this.feature.home.networkInterfaces.count = obj.network.interfaces.length ?? 0;
            this.feature.home.wirelessConnections.supported = wirelessConnectionsSupported;
            this.feature.home.wirelessConnections.installed = obj.wirelessKits.some(connection => connection.connected) ?? false;
            this.feature.home.wirelessConnections.count = obj.wirelessKits.length;
            this.feature.home.supported = true;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('home', home) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Home', home) : false;
            return true;
        } catch (error) {
            throw new Error(`Update home error: ${error}`);
        }
    }

    async updateInventory() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting inventory`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.Inventory);
            const inventory = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Inventory:`, inventory) : false;

            //inventory keys
            const inventoryKeys = inventory.map(device => device.type);

            //microinverters
            const microinvertersSupported = inventoryKeys.includes('PCU');
            const microinverters = microinvertersSupported ? inventory[0].devices.slice(0, 70) : []; // Limit to 70 pcu
            const microinvertersInstalled = microinverters.length > 0;
            if (microinvertersInstalled) {
                const arr = [];
                const type = ApiCodes[inventory[0].type] ?? 'Unknown';
                microinverters.forEach((pcu, index) => {
                    const obj = {
                        type: type,
                        partNum: PartNumbers[pcu.part_num] ?? 'Microinverter',
                        installed: new Date(pcu.installed * 1000).toLocaleString(),
                        serialNumber: pcu.serial_num,
                        deviceStatus: (Array.isArray(pcu.device_status) && (pcu.device_status).length > 0) ? ((pcu.device_status).map(a => ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
                        lastReportDate: new Date(pcu.last_rpt_date * 1000).toLocaleString(),
                        adminState: pcu.admin_state,
                        devType: pcu.dev_type,
                        createdDate: new Date(pcu.created_date * 1000).toLocaleString(),
                        imageLoadDate: new Date(pcu.img_load_date * 1000).toLocaleString(),
                        firmware: pcu.img_pnum_running,
                        ptpn: pcu.ptpn,
                        chaneId: pcu.chaneid,
                        deviceControl: pcu.device_control,
                        producing: pcu.producing === true,
                        communicating: pcu.communicating === true,
                        provisioned: pcu.provisioned === true,
                        operating: pcu.operating === true,
                        phase: pcu.phase ?? 'Unknown'
                    };
                    //add obj to pcu array
                    arr.push(obj);

                    //update chaaracteristics
                    const service = this.pcuServices?.[index];
                    if (service) {
                        service
                            .updateCharacteristic(Characteristic.MicroinverterStatus, obj.deviceStatus)
                            .updateCharacteristic(Characteristic.MicroinverterLastReportDate, obj.lastReportDate)
                            .updateCharacteristic(Characteristic.MicroinverterFirmware, obj.firmware)
                            .updateCharacteristic(Characteristic.MicroinverterProducing, obj.producing)
                            .updateCharacteristic(Characteristic.MicroinverterCommunicating, obj.communicating)
                            .updateCharacteristic(Characteristic.MicroinverterProvisioned, obj.provisioned)
                            .updateCharacteristic(Characteristic.MicroinverterOperating, obj.operating);

                        if (this.feature?.gridProfile?.supported) {
                            service.updateCharacteristic(Characteristic.MicroinverterGridProfile, this.pv.gridProfile.name);
                        }
                    }
                });

                //add array to pv pcu
                this.pv.inventory.pcus = arr;
            }
            //microinverters
            this.feature.inventory.pcus.supported = microinvertersSupported;
            this.feature.inventory.pcus.installed = microinvertersInstalled;
            this.feature.inventory.pcus.count = microinverters.length;

            //ac batteries
            const acBatteriesSupported = inventoryKeys.includes('ACB');
            const acBatteries = acBatteriesSupported ? inventory[1].devices : [];
            const acBatteriesInstalled = acBatteries.length > 0;
            if (acBatteriesInstalled) {
                const arr = [];
                const type = ApiCodes[inventory[1].type] ?? 'Unknown';
                acBatteries.forEach((acb, index) => {
                    const obj = {
                        type: type,
                        partNumber: PartNumbers[acb.part_num] ?? acb.part_num,
                        installed: new Date(acb.installed * 1000).toLocaleString(),
                        serialNumber: acb.serial_num,
                        deviceStatus: (Array.isArray(acb.device_status) && (acb.device_status).length > 0) ? ((acb.device_status).map(a => ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
                        lastReportDate: new Date(acb.last_rpt_date * 1000).toLocaleString(),
                        adminState: acb.admin_state,
                        devType: acb.dev_type,
                        createdDate: new Date(acb.created_date * 1000).toLocaleString(),
                        imageLoadDate: new Date(acb.img_load_date * 1000).toLocaleString(),
                        firmware: acb.img_pnum_running,
                        ptpn: acb.ptpn,
                        chaneId: acb.chaneid,
                        deviceControl: acb.device_control,
                        producing: acb.producing === true,
                        communicating: acb.communicating === true,
                        provisioned: acb.provisioned === true,
                        operating: acb.operating === true,
                        sleepEnabled: acb.sleep_enabled,
                        percentFull: acb.percentFull,
                        maxCellTemp: acb.maxCellTemp,
                        sleepMinSoc: acb.sleep_min_soc,
                        sleepMaxSoc: acb.sleep_max_soc,
                        chargeStatus: ApiCodes[acb.charge_status] ?? 'Unknown',
                        chargingState: acb.charge_status === 'discharging' ? 0 : acb.charge_statuse === 'charging' ? 1 : 2,
                    };
                    //add ac batteries to acb
                    arr.push(obj);

                    //update chaaracteristics
                    if (this.acBatterieBackupLevelActiveAccessory && this.acBatteriesLevelAndStateServices?.[index]) {
                        const lowBatteryState = obj.percentFull < this.acBatterieBackupLevelActiveAccessory.minSoc;
                        const backupLevel = obj.percentFull;
                        const chargingState = obj.chargingState;
                        const service = this.acBatteriesLevelAndStateServices[index];
                        const { characteristicType, characteristicType1, characteristicType2 } = this.acBatterieBackupLevelActiveAccessory;

                        service
                            .updateCharacteristic(characteristicType, lowBatteryState)
                            .updateCharacteristic(characteristicType1, backupLevel)
                            .updateCharacteristic(characteristicType2, chargingState);
                    }


                    this.acBatteriesServices?.[index]
                        ?.updateCharacteristic(Characteristic.AcBatterieStatus, obj.deviceStatus)
                        .updateCharacteristic(Characteristic.AcBatterieLastReportDate, obj.lastReportDate)
                        .updateCharacteristic(Characteristic.AcBatterieFirmware, obj.firmware)
                        .updateCharacteristic(Characteristic.AcBatterieProducing, obj.producing)
                        .updateCharacteristic(Characteristic.AcBatterieCommunicating, obj.communicating)
                        .updateCharacteristic(Characteristic.AcBatterieProvisioned, obj.provisioned)
                        .updateCharacteristic(Characteristic.AcBatterieOperating, obj.operating)
                        .updateCharacteristic(Characteristic.AcBatterieSleepEnabled, obj.sleepEnabled)
                        .updateCharacteristic(Characteristic.AcBatteriePercentFull, obj.percentFull)
                        .updateCharacteristic(Characteristic.AcBatterieMaxCellTemp, obj.maxCellTemp)
                        .updateCharacteristic(Characteristic.AcBatterieSleepMinSoc, obj.sleepMinSoc)
                        .updateCharacteristic(Characteristic.AcBatterieSleepMaxSoc, obj.sleepMaxSoc)
                        .updateCharacteristic(Characteristic.AcBatterieChargeStatus, obj.chargeStatus);

                });

                //add array to pv ac batteries
                this.pv.inventory.acbs = arr;
            }
            //ac batteries
            this.feature.inventory.acbs.supported = acBatteriesSupported;
            this.feature.inventory.acbs.installed = acBatteriesInstalled;
            this.feature.inventory.acbs.count = acBatteries.length;

            //qrelays
            const qRelaysSupported = inventoryKeys.includes('NSRB');
            const qRelays = qRelaysSupported ? inventory[2].devices : [];
            const qRelaysInstalled = qRelays.length > 0;
            if (qRelaysInstalled) {
                const arr = [];
                const type = ApiCodes[inventory[2].type] ?? 'Unknown';
                qRelays.forEach((nsrb, index) => {
                    const obj = {
                        type: type,
                        partNumber: PartNumbers[nsrb.part_num] ?? nsrb.part_num,
                        installed: new Date(nsrb.installed * 1000).toLocaleString(),
                        serialNumber: nsrb.serial_num,
                        deviceStatus: (Array.isArray(nsrb.device_status) && (nsrb.device_status).length > 0) ? ((nsrb.device_status).map(a => ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
                        lastReportDate: new Date(nsrb.last_rpt_date * 1000).toLocaleString(),
                        adminState: nsrb.admin_state,
                        devType: nsrb.dev_type,
                        createdDate: new Date(nsrb.created_date * 1000).toLocaleString(),
                        imageLoadDate: new Date(nsrb.img_load_date * 1000).toLocaleString(),
                        firmware: nsrb.img_pnum_running,
                        ptpn: nsrb.ptpn,
                        chaneId: nsrb.chaneid,
                        deviceControl: nsrb.device_control,
                        producing: nsrb.producing === true,
                        communicating: nsrb.communicating === true,
                        provisioned: nsrb.provisioned === true,
                        operating: nsrb.operating === true,
                        relay: ApiCodes[nsrb.relay] ?? 'Unknown',
                        relayState: nsrb.relay === 'closed',
                        reasonCode: nsrb.reason_code,
                        reason: nsrb.reason,
                        linesCount: nsrb['line-count'],
                        line1Connected: nsrb['line-count'] >= 1 ? nsrb['line1-connected'] === true : false,
                        line2Connected: nsrb['line-count'] >= 2 ? nsrb['line2-connected'] === true : false,
                        line3Connected: nsrb['line-count'] >= 3 ? nsrb['line3-connected'] === true : false
                    };
                    //add qRelay to nsrb
                    arr.push(obj);

                    //update chaaracteristics
                    if (this.qRelayStateActiveSensor) {
                        const sensorCount = this.qRelayStateActiveSensor.multiphase && obj.linesCount > 1 ? obj.linesCount + 1 : 1;
                        const services = this.qRelayStateSensorServices?.[index];

                        for (let i = 0; i < sensorCount; i++) {
                            let state;
                            switch (i) {
                                case 0:
                                    state = obj.relayState;
                                    break;
                                case 1:
                                    state = obj.line1Connected;
                                    break;
                                case 2:
                                    state = obj.line2Connected;
                                    break;
                                case 3:
                                    state = obj.line3Connected;
                                    break;
                                default:
                                    state = false;
                            }
                            this.qRelayStateActiveSensor[`state${i}`] = state;

                            if (services?.[i]) {
                                const characteristicType = this.qRelayStateActiveSensor.characteristicType;
                                services[i].updateCharacteristic(characteristicType, state);
                            }
                        }
                    }

                    const service = this.qRelaysServices?.[index];
                    if (service) {
                        service
                            .updateCharacteristic(Characteristic.QrelayStatus, obj.deviceStatus)
                            .updateCharacteristic(Characteristic.QrelayLastReportDate, obj.lastReportDate)
                            .updateCharacteristic(Characteristic.QrelayFirmware, obj.firmware)
                            //.updateCharacteristic(Characteristic.QrelayProducing, obj.producing)
                            .updateCharacteristic(Characteristic.QrelayCommunicating, obj.communicating)
                            .updateCharacteristic(Characteristic.QrelayProvisioned, obj.provisioned)
                            .updateCharacteristic(Characteristic.QrelayOperating, obj.operating)
                            .updateCharacteristic(Characteristic.QrelayState, obj.relay)
                            .updateCharacteristic(Characteristic.QrelayLinesCount, obj.linesCount);

                        if (obj.linesCount >= 1) {
                            service.updateCharacteristic(Characteristic.QrelayLine1Connected, obj.line1Connected);
                        }
                        if (obj.linesCount >= 2) {
                            service.updateCharacteristic(Characteristic.QrelayLine2Connected, obj.line2Connected);
                        }
                        if (obj.linesCount >= 3) {
                            service.updateCharacteristic(Characteristic.QrelayLine3Connected, obj.line3Connected);
                        }

                        if (this.feature?.gridProfile?.supported) {
                            service.updateCharacteristic(Characteristic.QrelayGridProfile, this.pv.gridProfile.name);
                        }
                    }
                });

                //add array to pv qrelays
                this.pv.inventory.nsrbs = arr;
            }
            //qRelays
            this.feature.inventory.nsrbs.supported = qRelaysSupported;
            this.feature.inventory.nsrbs.installed = qRelaysInstalled;
            this.feature.inventory.nsrbs.count = qRelays.length;

            //ensembles
            const ensemblesSupported = inventoryKeys.includes('ESUB');
            const ensembles = ensemblesSupported ? inventory[3].devices : [];
            const ensemblesInstalled = ensembles.length > 0;
            if (ensemblesInstalled) {
                const arr = [];
                const type = ApiCodes[inventory[3].type] ?? 'Unknown';
                ensembles.forEach((esub, index) => {
                    const obj = {
                        type: type,
                        partNumber: PartNumbers[esub.part_num] ?? esub.part_num,
                        installed: new Date(esub.installed * 1000).toLocaleString(),
                        serialNumber: esub.serial_num,
                        deviceStatus: (Array.isArray(esub.device_status) && (esub.device_status).length > 0) ? ((esub.device_status).map(a => ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
                        lastReportDate: new Date(esub.last_rpt_date * 1000).toLocaleString(),
                        adminState: esub.admin_state,
                        devType: esub.dev_type,
                        createdDate: new Date(esub.created_date * 1000).toLocaleString(),
                        imageLoadDate: new Date(esub.img_load_date * 1000).toLocaleString(),
                        firmware: esub.img_pnum_running,
                        ptpn: esub.ptpn,
                        chaneId: esub.chaneid,
                        deviceControl: esub.device_control,
                        producing: esub.producing === true,
                        communicating: esub.communicating === true,
                        operating: esub.operating === true
                    };
                    //add obj to ensemble object
                    arr.push(obj);

                    //update chaaracteristics
                    this.ensemblesInventoryServices?.[index]
                        ?.updateCharacteristic(Characteristic.EnsembleInventoryStatus, obj.deviceStatus)
                        .updateCharacteristic(Characteristic.EnsembleInventoryLastReportDate, obj.lastReportDate)
                        .updateCharacteristic(Characteristic.EnsembleInventoryFirmware, obj.firmware)
                        .updateCharacteristic(Characteristic.EnsembleInventoryProducing, obj.producing)
                        .updateCharacteristic(Characteristic.EnsembleInventoryCommunicating, obj.communicating)
                        .updateCharacteristic(Characteristic.EnsembleInventoryOperating, obj.operating);
                });

                //add array to pv ensembles
                this.pv.inventory.esubs = arr;
            }
            //ensembles
            this.feature.inventory.esubs.supported = ensemblesSupported;
            this.feature.inventory.esubs.installed = ensemblesInstalled;
            this.feature.inventory.esubs.count = ensembles.length;

            //inventory supported
            this.feature.inventory.supported = true;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('inventory', inventory) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Inventory', inventory) : false;
            return true;
        } catch (error) {
            throw new Error(`Update inventory error: ${error}`);
        }
    }

    async updatePcuStatus() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting pcu status`) : false;
        try {
            const options = {
                method: 'GET',
                baseURL: this.url,
                headers: {
                    Accept: 'application/json'
                }
            };

            const response = this.feature.info.firmware7xx ? await this.axiosInstance(ApiUrls.InverterProduction) : await this.digestAuthEnvoy.request(ApiUrls.InverterProduction, options);
            const pcus = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Pcu status:`, pcus) : false;

            //pcu devices count
            const pcuStatusSupported = pcus.length > 0;
            if (pcuStatusSupported) {
                this.pv.inventory.pcus.forEach((pcu, index) => {
                    const device = pcus.find(device => device.serialNumber === pcu.serialNumber);
                    if (!device) {
                        return;
                    }

                    const obj = {
                        type: device.devType ?? 'Microinverter',
                        lastReportDate: new Date(device.lastReportDate * 1000).toLocaleString(),
                        power: device.lastReportWatts ?? 0,
                        powerPeak: device.maxReportWatts ?? 0,
                    };

                    //add pcu power to pv object
                    this.pv.inventory.pcus[index].status = obj;

                    //update chaaracteristics
                    this.pcuServices?.[index]
                        ?.updateCharacteristic(Characteristic.MicroinverterLastReportDate, obj.lastReportDate)
                        .updateCharacteristic(Characteristic.MicroinverterPower, obj.power)
                        .updateCharacteristic(Characteristic.MicroinverterPowerPeak, obj.powerPeak);
                });
            }

            //pcu supported
            this.feature.pcuStatus.supported = pcuStatusSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('microinverters', pcus) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Microinverters', pcus) : false;
            return true;
        } catch (error) {
            throw new Error(`Update pcu status error: ${error}`);
        }
    }

    async updateDeviceData(start) {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting device data`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.DevicesData)
            const devicesData = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Devices data:`, devicesData) : false;

            if (devicesData) {
                //pcu  data
                this.pv.inventory.pcus.forEach((pcu, index) => {
                    const device = Object.values(devicesData).find(device => device.sn === pcu.serialNumber);
                    if (!device) {
                        return;
                    }

                    const deviceData = device.channels[0];
                    const obj = {
                        type: deviceData.devName ?? 'Microinverter',
                        power: deviceData.watts?.now ?? 0,
                        powerUsed: deviceData.watts?.nowUsed ?? 0,
                        powerPeak: deviceData.watts?.max ?? 0,
                        energyToday: deviceData.wattHours?.today ?? 0,
                        energyTodayKw: deviceData.wattHours?.today / 1000 ?? 0,
                        energyYesterday: deviceData.wattHours?.yesterday ?? 0,
                        energyYesterdayKw: deviceData.wattHours?.yesterday / 1000 ?? 0,
                        energyLastSevenDays: deviceData.wattHours?.week ?? 0,
                        energyLastSevenDaysKw: deviceData.wattHours?.week / 1000 ?? 0,
                        energyLifetime: deviceData.lifetime?.joulesProduced / 3600 ?? 0,
                        energyLifetimeKw: (deviceData.lifetime?.joulesProduced / 3600) / 1000 ?? 0,
                        voltage: deviceData.lastReading?.acVoltageINmV / 1000 ?? 0,
                        frequency: deviceData.lastReading?.acFrequencyINmHz / 1000 ?? 0,
                        currentDc: deviceData.lastReading?.dcCurrentINmA / 1000 ?? 0,
                        voltageDc: deviceData.lastReading?.dcVoltageINmV / 1000 ?? 0,
                        temperature: deviceData.lastReading?.channelTemp ?? 0,
                    };

                    this.pv.inventory.pcus[index].data = obj;

                    this.pcuServices?.[index]
                        ?.updateCharacteristic(Characteristic.MicroinverterPower, obj.power)
                        .updateCharacteristic(Characteristic.MicroinverterPowerPeak, obj.powerPeak)
                        .updateCharacteristic(Characteristic.MicroinverterEnergyToday, obj.energyToday)
                        .updateCharacteristic(Characteristic.MicroinverterEnergyYesterday, obj.energyYesterday)
                        .updateCharacteristic(Characteristic.MicroinverterEnergyLastSevenDays, obj.energyLastSevenDaysKw)
                        .updateCharacteristic(Characteristic.MicroinverterVoltage, obj.voltage)
                        .updateCharacteristic(Characteristic.MicroinverterFrequency, obj.frequency)
                        .updateCharacteristic(Characteristic.MicroinverterTemperature, obj.temperature);
                });

                //nsrb data
                if (this.feature.inventory.nsrbs.count > 10) {
                    this.pv.inventory.nsrbs.forEach((nsrb, index) => {
                        const device = Object.values(devicesData).find(device => device.sn === nsrb.serialNumber);
                        if (!device) {
                            return;
                        }

                        const deviceData = device.channels[0];
                        const obj = {
                            type: deviceData.devName ?? 'Q-Relay',
                            temperature: deviceData.lastReading?.temperature ?? 0,
                            acOffset: deviceData.lastReading?.acCurrOffset ?? 0,
                            voltageL1: deviceData.lastReading?.VrmsL1N / 1000 ?? 0,
                            voltageL2: deviceData.lastReading?.VrmsL2N / 1000 ?? 0,
                            voltageL1: deviceData.lastReading?.VrmsL3N / 1000 ?? 0,
                            frequency: deviceData.lastReading?.freqInmHz / 1000 ?? 0,
                        };

                        this.pv.inventory.nsrbs[index].data = obj;
                    });
                }

                //device data supported
                this.feature.deviceData.supported = true;
            }

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('devicesdata', devicesData) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Devices Data', devicesData) : false;
            return true;
        } catch (error) {
            if (start) {
                this.emit('warn', `Device data not supported, dont worry all working correct, only some additional data will not be present`);
                return null;
            }
            throw new Error(`Update device data: ${error}`)
        };
    }

    async updateMeters() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting meters info`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.InternalMeterInfo);
            const meters = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Meters:`, meters) : false;

            //meters count
            const metersSupported = meters.length > 0;
            if (metersSupported) {

                //meters
                const arr = [];
                meters.forEach((meter, index) => {
                    const measurementType = ApiCodes[meter.measurementType];
                    const obj = {
                        eid: meter.eid,
                        type: 'eim',
                        activeCount: 1,
                        state: meter.state === 'enabled',
                        measurementType: measurementType,
                        readingTime: new Date().toLocaleString(),
                        phaseMode: ApiCodes[meter.phaseMode],
                        phaseCount: meter.phaseCount ?? 1,
                        meteringStatus: ApiCodes[meter.meteringStatus],
                        statusFlags: (Array.isArray(meter.statusFlags) && (meter.statusFlags).length > 0) ? ((meter.statusFlags).map(a => ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
                        voltageDivide: meter.phaseMode !== 'Split' ? meter.phaseCount : 1,
                        readings: {}
                    };
                    //add meter to array
                    arr.push(obj);

                    //production
                    const production = measurementType === 'Production';
                    if (production) {
                        this.pv.meters.production = obj;
                        this.feature.meters.production.supported = true;
                        this.feature.meters.production.enabled = obj.state;
                        this.feature.meters.production.voltageDivide = obj.phaseMode !== 'Split' ? obj.phaseCount : 1;
                    }

                    //consumption
                    const consumption = measurementType === 'Consumption Net';
                    if (consumption) {
                        this.pv.meters.consumption = obj;
                        this.feature.meters.consumption.supported = true;
                        this.feature.meters.consumption.enabled = obj.state;
                        this.feature.meters.consumption.voltageDivide = obj.phaseMode !== 'Split' ? obj.phaseCount : 1;
                    }

                    //acBatterie
                    const acBatterie = measurementType === 'Storage';
                    if (acBatterie) {
                        this.pv.meters.acBatterie = obj;
                        this.feature.meters.acBatterie.supported = true;
                        this.feature.meters.acBatterie.enabled = obj.state;
                        this.feature.meters.acBatterie.voltageDivide = obj.phaseMode !== 'Split' ? obj.phaseCount : 1;
                    }

                    //update characteristics
                    this.metersServices?.[index]
                        ?.updateCharacteristic(Characteristic.MeterState, obj.state)
                        .updateCharacteristic(Characteristic.MeterPhaseMode, obj.phaseMode)
                        .updateCharacteristic(Characteristic.MeterPhaseCount, obj.phaseCount)
                        .updateCharacteristic(Characteristic.MeterMeteringStatus, obj.meteringStatus)
                        .updateCharacteristic(Characteristic.MeterStatusFlags, obj.statusFlags);


                });
                //add ct meters to pv meters
                this.pv.meters.data = arr;

                //meters installed
                const metersInstalled = arr.some(meter => meter.state);
                this.feature.meters.installed = metersInstalled;
                this.feature.meters.count = meters.length;
            }

            //meters supported
            this.feature.meters.supported = metersSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('meters', meters) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Meters', meters) : false;
            return true;
        } catch (error) {
            throw new Error(`Update meters error: ${error}`);
        }
    }

    async updateMetersReading() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting meters reading`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.InternalMeterReadings);
            const metersReading = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Meters reading:`, metersReading) : false;

            //meters reading count
            const metersReadingSupported = metersReading.length > 0;
            if (metersReadingSupported) {
                const metersInstalled = metersReading.slice(0, this.pv.meters.data.length); //limit to meters installed 

                //meters reading summary data
                metersInstalled.forEach((meter, index) => {
                    const measurementType = this.pv.meters.data[index].measurementType;
                    const voltageDivide = this.pv.meters.data[index].voltageDivide;
                    const obj = {
                        type: 'eim',
                        activeCount: 1,
                        measurementType: measurementType,
                        readingTime: new Date(meter.timestamp * 1000).toLocaleString(),
                        power: meter.activePower,
                        powerKw: meter.activePower / 1000,
                        apparentPower: meter.apparentPower,
                        apparentPowerKw: meter.apparentPower / 1000,
                        reactivePower: meter.reactivePower,
                        reactivePowerKw: meter.reactivePower / 1000,
                        current: meter.current,
                        voltage: meter.voltage / voltageDivide,
                        pwrFactor: meter.pwrFactor,
                        frequency: meter.freq,
                        actEnergyDlvd: meter.actEnergyDlvd,
                        actEnergyRcvd: meter.actEnergyRcvd,
                        apparentEnergy: meter.apparentEnergy,
                        reactEnergyLagg: meter.reactEnergyLagg,
                        reactEnergyLead: meter.reactEnergyLead,
                        instantaneousDemand: meter.instantaneousDemand,
                        channels: meter.channels ?? []
                    };
                    //add meter to pv object
                    this.pv.meters.data[index].readings = obj;

                    //production
                    const production = measurementType === 'Production';
                    if (production) {
                        this.pv.meters.production.readings = obj;
                    }

                    //consumption
                    const consumption = measurementType === 'Consumption Net';
                    if (consumption) {
                        this.pv.meters.consumption.readings = obj;
                    }

                    //acBatterie
                    const acBatterie = measurementType === 'Storage';
                    if (acBatterie) {
                        this.pv.meters.acBatterie.readings = obj;
                    }

                    //update chaaracteristics
                    this.metersServices?.[index]
                        ?.updateCharacteristic(Characteristic.MeterReadingTime, obj.readingTime)
                        .updateCharacteristic(Characteristic.MeterActivePower, obj.powerKw)
                        .updateCharacteristic(Characteristic.MeterApparentPower, obj.apparentPowerKw)
                        .updateCharacteristic(Characteristic.MeterReactivePower, obj.reactivePowerKw)
                        .updateCharacteristic(Characteristic.MeterPwrFactor, obj.pwrFactor)
                        .updateCharacteristic(Characteristic.MeterVoltage, obj.voltage)
                        .updateCharacteristic(Characteristic.MeterCurrent, obj.current)
                        .updateCharacteristic(Characteristic.MeterFrequency, obj.frequency);
                });

                //meters readings installed
                this.feature.metersReading.installed = true;
                this.feature.metersReading.count = metersInstalled.length;
            }

            //meters readings installed
            this.feature.metersReading.supported = metersReadingSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('metersreading', metersReading) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Meters Reading', metersReading) : false;
            return true;
        } catch (error) {
            throw new Error(`Update meters reading error: ${error}`);
        }
    }

    async updateProduction() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting production`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.Production);
            const production = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Production:`, production) : false;

            //pcu summary 
            const productionKeys = Object.keys(production);
            const productionSupported = productionKeys.length > 0;
            if (productionSupported) {
                const obj = {
                    type: 'pcu',
                    activeCount: this.feature.inventory.pcus.count,
                    measurementType: 'Production',
                    readingTime: new Date().toLocaleString(),
                    power: production.wattsNow,
                    energyToday: production.wattHoursToday,
                    energyLastSevenDays: production.wattHoursSevenDays,
                    energyLifetime: production.wattHoursLifetime
                };
                this.pv.production.pcu = obj;
            }

            //production pcu supported
            this.feature.production.supported = productionSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('production', production) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Production', production) : false;
            return true;
        } catch (error) {
            throw new Error(`Update production error: ${error}`);
        }
    }

    async updateProductionPdm() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting production pdm`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.ProductionPdm);
            const productionPdm = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Production pdm: `, productionPdm) : false;

            const pcu = {
                type: 'pcu',
                activeCount: this.feature.inventory.pcus.count,
                measurementType: 'Production',
                readingTime: new Date().toLocaleString(),
                power: productionPdm.watts_now_pcu,
                energyToday: productionPdm.joules_today_pcu / 3600, //convert joules to Wh
                energyLastSevenDays: productionPdm.pcu_joules_seven_days / 3600,
                energyLifetime: productionPdm.joules_lifetime_pcu / 3600
            };
            this.feature.productionPdm.pcu.installed = pcu.active;
            this.pv.productionPdm.pcu = pcu;

            const eim = {
                type: 'eim',
                activeCount: 1,
                measurementType: 'Production',
                readingTime: new Date().toLocaleString(),
                active: productionPdm.there_is_an_active_eim,
                power: productionPdm.watts_now_eim,
                energyToday: productionPdm.watt_hours_today_eim.aggregate,
                energyTodayL1: productionPdm.watt_hours_today_eim.channel[0],
                energyTodayL2: productionPdm.watt_hours_today_eim.channel[1],
                energyTodayL3: productionPdm.watt_hours_today_eim.channel[2],
                energyLastSevenDays: productionPdm.eim_watt_hours_seven_days.aggregate,
                energyLastSevenDaysL1: productionPdm.eim_watt_hours_seven_days.channel[0],
                energyLastSevenDaysL2: productionPdm.eim_watt_hours_seven_days.channel[1],
                energyLastSevenDaysL3: productionPdm.eim_watt_hours_seven_days.channel[2],
                energyLifetime: productionPdm.watt_hours_lifetime_eim.aggregate,
                energyLifetimeL1: productionPdm.watt_hours_lifetime_eim.channel[0],
                energyLifetimeL2: productionPdm.watt_hours_lifetime_eim.channel[1],
                energyLifetimeL3: productionPdm.watt_hours_lifetime_eim.channel[2],
                energyVahToday: productionPdm.vah_today_eim.aggregate,
                energyVahTodayL1: productionPdm.vah_today_eim.aggregate[0],
                energyVahTodayL2: productionPdm.vah_today_eim.aggregate[1],
                energyVahTodayL3: productionPdm.vah_today_eim.aggregate[2],
                energyVahLifetime: productionPdm.vah_lifetime_eim.aggregate,
                energyVahLifetimeL1: productionPdm.vah_lifetime_eim.channel[0],
                energyVahLifetimeL2: productionPdm.vah_lifetime_eim.channel[1],
                energyVahLifetimeL3: productionPdm.vah_lifetime_eim.channel[2],
                energyVarhLeadToday: productionPdm.varh_lead_today_eim.aggregate,
                energyVarhLeadTodayL1: productionPdm.varh_lead_today_eim.channel[0],
                energyVarhLeadTodayL2: productionPdm.varh_lead_today_eim.channel[1],
                energyVarhLeadTodayL3: productionPdm.varh_lead_today_eim.channel[2],
                energyVarhLagToday: productionPdm.varh_lag_today_eim.aggregate,
                energyVarhLagTodayL1: productionPdm.varh_lag_today_eim.channel[0],
                energyVarhLagTodayL2: productionPdm.varh_lag_today_eim.channel[1],
                energyVarhLagTodayL3: productionPdm.varh_lag_today_eim.channel[2],
                energyVarhLeadLifetime: productionPdm.varh_lead_lifetime_eim.aggregate,
                energyVarhLeadLifetimeL1: productionPdm.varh_lead_lifetime_eim.channel[0],
                energyVarhLeadLifetimeL2: productionPdm.varh_lead_lifetime_eim.channel[1],
                energyVarhLeadLifetimeL3: productionPdm.varh_lead_lifetime_eim.channel[2],
                energyVarhLagLifetime: productionPdm.varh_lag_lifetime_eim.aggregate,
                energyVarhLagLifetimeL1: productionPdm.varh_lag_lifetime_eim.channel[0],
                energyVarhLagLifetimeL2: productionPdm.varh_lag_lifetime_eim.channel[1],
                energyVarhLagLifetimeL3: productionPdm.varh_lag_lifetime_eim.channel[2]
            };
            this.feature.productionPdm.eim.installed = eim.active;
            this.pv.productionPdm.eim = eim;

            const rgm = {
                type: 'rgm',
                activeCount: 1,
                measurementType: 'Production',
                readingTime: new Date().toLocaleString(),
                active: productionPdm.there_is_an_active_rgm,
                power: productionPdm.watts_now_rgm,
                energyToday: productionPdm.watt_hours_today_rgm,
                energyLastSevenDays: productionPdm.rgm_watt_hours_seven_days,
                energyLifetime: productionPdm.watt_hours_lifetime_rgm,
            };
            this.feature.productionPdm.rgm.installed = rgm.active;
            this.pv.productionPdm.rgm = rgm;

            const pmu = {
                type: 'pmu',
                activeCount: 1,
                measurementType: 'Production',
                readingTime: new Date().toLocaleString(),
                active: productionPdm.there_is_an_active_pmu,
                power: productionPdm.watts_now_pmu,
                energyToday: productionPdm.watt_hours_today_pmu,
                energyLastSevenDays: productionPdm.pmu_watt_hours_seven_days,
                energyLifetime: productionPdm.watt_hours_lifetime_pmu
            };
            this.feature.productionPdm.pmu.installed = pmu.active;
            this.pv.productionPdm.pmu = pmu;

            //production pdm supported
            this.feature.productionPdm.supported = true;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('productionpdm', productionPdm) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Production Pdm', productionPdm) : false;

            return true;
        } catch (error) {
            throw new Error(`Update production pdm error: ${error}`);
        }
    }

    async updateEnergyPdm() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting energy pdm`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.EnergyPdm);
            const energyPdm = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Energy pdm: `, energyPdm) : false;

            //pdm energy summary 
            const allKeys = Object.keys(energyPdm);
            const productionSupported = allKeys.includes('production')
            const consumptionSupported = allKeys.includes('consumption')

            //process production data if available
            if (productionSupported) {
                const productionsKeys = Object.keys(energyPdm.production)
                productionsKeys.forEach((type) => {
                    const productionDataType = energyPdm.production[type];
                    if (productionDataType) {
                        const obj = {
                            type: type,
                            activeCount: 1,
                            measurementType: 'Production',
                            readingTime: new Date().toLocaleString(),
                            power: productionDataType.wattsNow,
                            energyToday: productionDataType.wattHoursToday,
                            energyLastSevenDays: productionDataType.wattHoursSevenDays,
                            energyLifetime: productionDataType.wattHoursLifetime
                        };
                        this.pv.energyPdm.production[type] = obj;
                    }
                });
            }

            //set production support flag
            this.feature.energyPdm.production.supported = productionSupported;

            //process consumption data if available
            if (consumptionSupported) {
                const consumptionData = energyPdm.consumption.eim;
                if (consumptionData) {
                    const obj = {
                        type: 'eim',
                        activeCount: 1,
                        measurementType: 'Consumption Net',
                        readingTime: new Date().toLocaleString(),
                        power: consumptionData.wattsNow,
                        energyToday: consumptionData.wattHoursToday,
                        energyLastSevenDays: consumptionData.wattHoursSevenDays,
                        energyLifetime: consumptionData.wattHoursLifetime
                    };
                    this.pv.energyPdm.consumption.eim = obj;
                }
            }

            //set consumption support flag
            this.feature.energyPdm.consumption.supported = consumptionSupported;

            //energy pdm supported
            this.feature.energyPdm.supported = true;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('energypdm', energyPdm) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Energy Pdm', energyPdm) : false;

            return true;
        } catch (error) {
            throw new Error(`Update energy pdm error: ${error}`);
        }
    }

    async updateProductionCt() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting production ct`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.SystemReadingStats);
            const productionCtData = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Production ct:`, productionCtData) : false;

            //get enabled devices
            const metersConsumptionEnabled = this.feature.meters.consumption.enabled;
            const acBatteriesInstalled = this.feature.inventory.acbs.installed;
            const voltageDivide = this.pv.meters.data[0].voltageDivide;

            //production ct
            const productionCtKeys = Object.keys(productionCtData);
            const productionCtProductionSupported = productionCtKeys.includes('production');
            if (productionCtProductionSupported) {
                //pcu data 0
                const productionCtProductionPcu = productionCtData.production[0] ?? {};
                const productionCtProductionPcuKeys = Object.keys(productionCtProductionPcu);
                const productionCtProductionPcuSupported = productionCtProductionPcuKeys.length > 0;
                if (productionCtProductionPcuSupported) {
                    const obj = {
                        type: productionCtProductionPcu.type,
                        activeCount: productionCtProductionPcu.activeCount,
                        measurementType: 'Production',
                        readingTime: new Date(productionCtProductionPcu.readingTime * 1000).toLocaleString(),
                        power: productionCtProductionPcu.wNow,
                        energyToday: 0,
                        energyLastSevenDays: 0,
                        energyLifetime: productionCtProductionPcu.whLifetime
                    };
                    //add to pv object
                    this.pv.productionCt.pcu = obj;
                }
                //production pcu supported
                this.feature.productionCt.production.pcu.supported = productionCtProductionPcuSupported;

                //production eim data 1
                const productionCtProductionEim = productionCtData.production[1] ?? {};
                const productionCtProductionEimKeys = Object.keys(productionCtProductionEim);
                const productionCtProductionEimSupported = productionCtProductionEimKeys.length > 0;
                if (productionCtProductionEimSupported) {
                    const obj = {
                        type: productionCtProductionEim.type,
                        activeCount: 1,
                        measurementType: ApiCodes[productionCtProductionEim.measurementType],
                        readingTime: new Date(productionCtProductionEim.readingTime * 1000).toLocaleString(),
                        power: productionCtProductionEim.wNow,
                        energyToday: productionCtProductionEim.energyTodaySumm,
                        energyLastSevenDays: productionCtProductionEim.energyLastSevenDaysSumm,
                        energyLifetime: productionCtProductionEim.energyLifetimeSumm,
                        energyVarhLeadToday: productionCtProductionEim.varhLeadToday,
                        energyVarhLeadLifetime: productionCtProductionEim.varhLeadLifetime,
                        energyVarhLagToday: productionCtProductionEim.varhLagToday,
                        energyVarhLagLifetime: productionCtProductionEim.varhLagLifetime,
                        energyVahToday: productionCtProductionEim.vahToday,
                        energyVahLifetime: productionCtProductionEim.vahLifetime,
                        reactivePower: productionCtProductionEim.reactPwr,
                        apparentPower: productionCtProductionEim.apprntPwr,
                        current: productionCtProductionEim.rmsCurrent,
                        voltage: productionCtProductionEim.rmsVoltage / voltageDivide,
                        pwrFactor: productionCtProductionEim.pwrFactor,
                        frequency: this.pv.meters.production.readings.frequency
                    };
                    //add to pv object
                    this.pv.productionCt.eim = obj;
                }
                //production eim production supported
                this.feature.productionCt.production.eim.supported = productionCtProductionEimSupported;
            }
            this.feature.productionCt.production.supported = productionCtProductionSupported;

            //consumption data 2
            const productionCtConsumptionExist = productionCtKeys.includes('consumption');
            const productionCtConsumptionSupported = productionCtConsumptionExist ? productionCtData.consumption.length > 0 : false;
            if (productionCtConsumptionSupported && metersConsumptionEnabled) {
                const arr = [];
                const consumptions = productionCtData.consumption ?? [];
                consumptions.forEach((consumption) => {
                    const obj = {
                        type: consumption.type,
                        measurementType: ApiCodes[consumption.measurementType],
                        activeCount: 1,
                        readingTime: new Date(consumption.readingTime * 1000).toLocaleString(),
                        power: consumption.wNow,
                        energyToday: consumption.whToday,
                        energyLastSevenDays: consumption.whLastSevenDays,
                        energyLifetime: consumption.whLifetime,
                        energyVarhLeadToday: consumption.varhLeadToday,
                        energyVarhLeadLifetime: consumption.varhLeadLifetime,
                        energyVarhLagToday: consumption.varhLagToday,
                        energyVarhLagLifetime: consumption.varhLagLifetime,
                        energyVahToday: consumption.vahToday,
                        energyVahLifetime: consumption.vahLifetime,
                        reactivePower: consumption.reactPwr,
                        apparentPower: consumption.apprntPwr,
                        current: consumption.rmsCurrent,
                        voltage: consumption.rmsVoltage / voltageDivide,
                        pwrFactor: consumption.pwrFactor,
                        frequency: this.pv.meters.consumption.readings.frequency
                    };
                    //push to array
                    arr.push(obj);
                });
                //add obj to array
                this.pv.productionCt.consumption = arr;
            }
            //consumption supported
            this.feature.productionCt.consumption.supported = productionCtConsumptionSupported

            //ac btteries summary 3
            const productionCtAcBatterieExist = productionCtKeys.includes('storage');
            const productionCtAcBatterieSupported = productionCtAcBatterieExist && Array.isArray(productionCtData.storage);
            if (productionCtAcBatterieSupported && acBatteriesInstalled) {
                const acb = productionCtData.storage[0] ?? {};
                const obj = {
                    type: ApiCodes[acb.type],
                    measurementType: 'Production',
                    activeCount: acb.activeCount,
                    readingTime: new Date(acb.readingTime * 1000).toLocaleString(),
                    power: acb.wNow,
                    powerKw: acb.wNow / 1000,
                    energy: acb.whNow + this.acBatterieStorageOffset,
                    energyKw: (acb.whNow + this.acBatterieStorageOffset) / 1000,
                    chargeStatus: ApiCodes[acb.state],
                    chargingState: acb.state === 'discharging' ? 0 : acb.state === 'charging' ? 1 : 2,
                    percentFullSum: await this.scaleValue(acb.energy, 0, acb.activeCount * 1.5, 0, 100),
                    energyStateSum: acb.whNow > 0
                };
                //add ac batterie summary to pv object
                this.pv.productionCt.acBatterie = obj;

                //update chaaracteristics
                const accessory = this.acBatterieBackupLevelSummaryActiveAccessory;
                if (accessory) {
                    const { minSoc, displayType, characteristicType, characteristicType1 } = accessory;
                    const isServiceBattery = displayType === 5;
                    const isAboveMinSoc = obj.percentFullSum > minSoc;
                    const backupLevel = isAboveMinSoc ? obj.percentFullSum : 0;
                    const state = isServiceBattery ? !isAboveMinSoc : isAboveMinSoc;
                    accessory.state = state;
                    accessory.backupLevel = backupLevel;

                    this.acBatteriesSummaryLevelAndStateService
                        ?.updateCharacteristic(characteristicType, state)
                        .updateCharacteristic(characteristicType1, backupLevel);
                }

                //update summary characteristics
                this.acBatterieSummaryService
                    ?.updateCharacteristic(Characteristic.AcBatterieSummaryReadingTime, obj.readingTime)
                    .updateCharacteristic(Characteristic.AcBatterieSummaryPower, obj.powerKw)
                    .updateCharacteristic(Characteristic.AcBatterieSummaryEnergy, obj.energyKw)
                    .updateCharacteristic(Characteristic.AcBatterieSummaryPercentFull, obj.percentFullSum)
                    .updateCharacteristic(Characteristic.AcBatterieSummaryActiveCount, obj.activeCount)
                    .updateCharacteristic(Characteristic.AcBatterieSummaryState, obj.chargeStatus);
            }
            //ac batterie supported
            this.feature.productionCt.acBatterie.supported = productionCtAcBatterieSupported;

            //production ct supported
            this.feature.productionCt.supported = true;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('productionct', productionCtData) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Production CT', productionCtData) : false;
            return true;
        } catch (error) {
            throw new Error(`Update production ct error: ${error}`);
        }
    }

    async updateProductionAll() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting production all`) : false;
        try {
            //production
            const metersProductionEnabled = this.feature.meters.production.enabled;
            const energyPdmProductionSupported = this.feature.energyPdm.production.supported;
            const productionSourcePower = metersProductionEnabled ? this.pv.meters.production.readings : (energyPdmProductionSupported ? this.pv.energyPdm.production.pcu : this.pv.production.pcu);
            const productionSourceEnergy = metersProductionEnabled ? (energyPdmProductionSupported ? this.pv.energyPdm.production.eim : this.pv.productionCt.eim) : productionSourcePower;
            const productionSourceMeter = metersProductionEnabled ? productionSourcePower : {};
            const debug1 = this.enableDebugMode ? this.emit('debug', `Production all production power:`, productionSourcePower) : false;
            const debug8 = this.enableDebugMode ? this.emit('debug', `Production all production energy:`, productionSourceEnergy) : false;
            const debug6 = this.enableDebugMode ? this.emit('debug', `Production all production meter:`, productionSourceMeter) : false;

            const powerProductionStored = this.pv.productionPowerPeak;
            const power = Number.isFinite(productionSourcePower.power) ? productionSourcePower.power : this.pv.productionAll.production.power;
            const powerLevel = this.powerProductionSummary > 1 ? await this.scaleValue(power, 0, this.powerProductionSummary, 0, 100) : 0;
            const powerPeak = Number.isFinite(Math.max(power, powerProductionStored)) ? Math.max(power, powerProductionStored) : powerProductionStored;
            const energyToday = Number.isFinite(productionSourceEnergy.energyToday) ? productionSourceEnergy.energyToday : this.pv.productionAll.production.energyToday;
            const energyLastSevenDays = Number.isFinite(productionSourceEnergy.energyLastSevenDays) ? productionSourceEnergy.energyLastSevenDays : this.pv.productionAll.production.energyLastSevenDays;
            const energyLifetime = Number.isFinite(productionSourceEnergy.energyLifetime) ? productionSourceEnergy.energyLifetime : this.pv.productionAll.production.energyLifetime;
            const obj = {
                type: ApiCodes[productionSourcePower.type],
                activeCount: productionSourcePower.activeCount,
                measurementType: productionSourcePower.measurementType,
                readingTime: new Date().toLocaleString(),
                power: power,
                powerKw: power / 1000,
                powerLevel: powerLevel,
                powerState: powerLevel > 0,
                powerPeak: powerPeak,
                powerPeakKw: powerPeak / 1000,
                powerPeakDetected: power > powerProductionStored,
                energyToday: energyToday,
                energyTodayKw: energyToday / 1000,
                energyLastSevenDays: energyLastSevenDays,
                energyLastSevenDaysKw: energyLastSevenDays / 1000,
                energyLifetime: energyLifetime,
                energyLifetimeKw: energyLifetime / 1000,
                energyState: energyToday > 0,
                reactivePower: productionSourceMeter.reactivePower,
                reactivePowerKw: productionSourceMeter.reactivePower / 1000,
                apparentPower: productionSourceMeter.apparentPower,
                apparentPowerKw: productionSourceMeter.apparentPower / 1000,
                current: productionSourceMeter.current,
                voltage: productionSourceMeter.voltage,
                pwrFactor: productionSourceMeter.pwrFactor,
                frequency: productionSourceMeter.frequency
            };

            //debug
            const debug2 = this.enableDebugMode ? this.emit('debug', `Production power state: ${obj.powerState}`) : false;
            const debug3 = this.enableDebugMode ? this.emit('debug', `Production power level: ${obj.powerLevel} %`) : false;
            const debug4 = this.enableDebugMode ? this.emit('debug', `Production power peak detected: ${obj.powerPeakDetected}`) : false;
            const debug5 = this.enableDebugMode ? this.emit('debug', `Production energy state: ${obj.energyState}`) : false;

            //update power peak
            this.pv.powerState = obj.powerState;
            this.pv.powerLevel = obj.powerLevel;
            this.pv.productionPowerPeak = obj.powerPeak;

            //update chaaracteristics
            if (this.systemAccessoryActive) {
                this.systemAccessoryActive.state = obj.powerState;
                this.systemAccessoryActive.level = obj.powerLevel;
                this.systemService
                    ?.updateCharacteristic(this.systemAccessoryActive.characteristicType, obj.powerState)
                    .updateCharacteristic(this.systemAccessoryActive.characteristicType1, obj.powerLevel);
            }

            this.productionService
                ?.updateCharacteristic(Characteristic.ReadingTime, obj.readingTime)
                .updateCharacteristic(Characteristic.Power, obj.powerKw)
                .updateCharacteristic(Characteristic.PowerPeak, obj.powerPeakKw)
                .updateCharacteristic(Characteristic.PowerPeakDetected, obj.powerPeakDetected)
                .updateCharacteristic(Characteristic.EnergyToday, obj.energyTodayKw)
                .updateCharacteristic(Characteristic.EnergyLastSevenDays, obj.energyLastSevenDaysKw)
                .updateCharacteristic(Characteristic.EnergyLifetime, obj.energyLifetimeKw)
                .updateCharacteristic(Characteristic.PowerPeakReset, false);

            const arr = [obj.reactivePower, obj.reactivePowerKw, obj.apparentPower, obj.apparentPowerKw, obj.current, obj.voltage, obj.pwrFactor, obj.frequency];
            const allValid = arr.every(v => typeof v === 'number' && isFinite(v));
            if (metersProductionEnabled && allValid) {
                this.productionService
                    ?.updateCharacteristic(Characteristic.ReactivePower, obj.reactivePowerKw)
                    .updateCharacteristic(Characteristic.ApparentPower, obj.apparentPowerKw)
                    .updateCharacteristic(Characteristic.Current, obj.current)
                    .updateCharacteristic(Characteristic.Voltage, obj.voltage)
                    .updateCharacteristic(Characteristic.PwrFactor, obj.pwrFactor)
                    .updateCharacteristic(Characteristic.Frequency, obj.frequency);
            }

            //sensors power
            if (this.powerProductionLevelActiveSensorsCount > 0) {
                for (let i = 0; i < this.powerProductionLevelActiveSensorsCount; i++) {
                    const sensor = this.powerProductionLevelActiveSensors[i];
                    const power = obj.power;
                    const state = await this.evaluateCompareMode(power, sensor.powerLevel, sensor.compareMode);
                    sensor.state = state;
                    this.powerProductionLevelSensorsServices?.[i]?.updateCharacteristic(sensor.characteristicType, state);
                }
            }

            //sensors energy
            if (this.energyProductionLevelActiveSensorsCount > 0) {
                for (let i = 0; i < this.energyProductionLevelActiveSensorsCount; i++) {
                    const sensor = this.energyProductionLevelActiveSensors[i];
                    const energy = obj.energyToday;
                    const state = await this.evaluateCompareMode(energy, sensor.energyLevel, sensor.compareMode);
                    sensor.state = state;
                    this.energyProductionLevelSensorsServices?.[i]?.updateCharacteristic(sensor.characteristicType, state);
                }
            }

            //sensors grid quality
            if (metersProductionEnabled && this.gridProductionQualityActiveSensorsCount > 0) {
                for (let i = 0; i < this.gridProductionQualityActiveSensorsCount; i++) {
                    const sensor = this.gridProductionQualityActiveSensors[i];
                    const compareValue = [obj.current, obj.voltage, obj.frequency, obj.pwrFactor][sensor.compareType];
                    const state = await this.evaluateCompareMode(compareValue, sensor.compareLevel, sensor.compareMode);
                    sensor.state = state;
                    this.gridProductionQualityActiveSensorsServices?.[i]?.updateCharacteristic(sensor.characteristicType, state);
                }
            }

            //add production to pv
            this.pv.productionAll.production = obj;

            //production supported
            this.feature.productionAll.production.supported = true;

            //consumption
            const metersConsumptionEnabled = this.feature.meters.consumption.enabled;
            if (metersConsumptionEnabled) {
                const arr = [];
                const consumptions = this.pv.productionCt.consumption ?? [];
                for (const [index, consumption] of consumptions.entries()) {
                    const energyPdmConsumptionSupported = this.feature.energyPdm.consumption.supported;
                    const isNet = consumption.measurementType === 'Consumption Net';
                    const consumptionSourcePower = isNet ? this.pv.meters.consumption.readings : consumption;
                    const consumptionSourceEnergy = isNet && energyPdmConsumptionSupported ? this.pv.energyPdm.consumption.eim : consumption;
                    const consumptionSourceMeter = isNet ? consumptionSourcePower : consumption;
                    const debug7 = this.enableDebugMode ? this.emit('debug', `Production all consumption power:`, consumptionSourcePower) : false;
                    const debug8 = this.enableDebugMode ? this.emit('debug', `Production all consumption energy:`, consumptionSourceEnergy) : false;
                    const debug9 = this.enableDebugMode ? this.emit('debug', `Production all consumption meter:`, consumptionSourceMeter) : false;

                    const powerConsumptionStored = isNet ? this.pv.consumptionNetPowerPeak : this.pv.consumptionTotalPowerPeak;
                    const power = Number.isFinite(consumptionSourcePower.power) ? consumptionSourcePower.power : this.pv.productionAll.consumption[index].power;
                    const powerPeak = Number.isFinite(Math.max(power, powerConsumptionStored)) ? Math.max(power, powerConsumptionStored) : powerConsumptionStored;
                    const energyConsumptionLifetimeOffset = isNet ? this.energyConsumptionNetLifetimeOffset : this.energyConsumptionTotalLifetimeOffset;
                    const energyToday = Number.isFinite(consumptionSourceEnergy.energyToday) ? consumptionSourceEnergy.energyToday : this.pv.productionAll.consumption[index].energyToday;
                    const energyLastSevenDays = Number.isFinite(consumptionSourceEnergy.energyLastSevenDays) ? consumptionSourceEnergy.energyLastSevenDays : this.pv.productionAll.consumption[index].energyLastSevenDays;
                    const energyLifetime = Number.isFinite(consumptionSourceEnergy.energyLifetime) ? consumptionSourceEnergy.energyLifetime : this.pv.productionAll.consumption[index].energyLifetime;
                    const obj1 = {
                        type: ApiCodes[consumptionSourcePower.type],
                        measurementType: consumptionSourcePower.measurementType,
                        activeCount: consumptionSourcePower.activeCount,
                        readingTime: new Date().toLocaleString(),
                        power: power,
                        powerKw: power / 1000,
                        powerState: power > 0,
                        powerPeak: powerPeak,
                        powerPeakKw: powerPeak / 1000,
                        powerPeakDetected: power > powerConsumptionStored,
                        energyToday: energyToday,
                        energyTodayKw: energyToday / 1000,
                        energyLastSevenDays: energyLastSevenDays,
                        energyLastSevenDaysKw: energyLastSevenDays / 1000,
                        energyLifetime: energyLifetime + energyConsumptionLifetimeOffset,
                        energyLifetimeKw: (energyLifetime + energyConsumptionLifetimeOffset) / 1000,
                        energyState: energyToday > 0,
                        reactivePower: consumptionSourceMeter.reactivePower,
                        reactivePowerKw: consumptionSourceMeter.reactivePower / 1000,
                        apparentPower: consumptionSourceMeter.apparentPower,
                        apparentPowerKw: consumptionSourceMeter.apparentPower / 1000,
                        current: consumptionSourceMeter.current,
                        voltage: consumptionSourceMeter.voltage,
                        pwrFactor: consumptionSourceMeter.pwrFactor,
                        frequency: consumptionSourceMeter.frequency
                    };
                    //push consumption obj to array
                    arr.push(obj1);

                    //update characteristics
                    this.consumptionsServices?.[index]
                        ?.updateCharacteristic(Characteristic.ReadingTime, obj1.readingTime)
                        .updateCharacteristic(Characteristic.Power, obj1.powerKw)
                        .updateCharacteristic(Characteristic.PowerPeak, obj1.powerPeakKw)
                        .updateCharacteristic(Characteristic.PowerPeakDetected, obj1.powerPeakDetected)
                        .updateCharacteristic(Characteristic.EnergyToday, obj1.energyTodayKw)
                        .updateCharacteristic(Characteristic.EnergyLastSevenDays, obj1.energyLastSevenDaysKw)
                        .updateCharacteristic(Characteristic.EnergyLifetime, obj1.energyLifetimeKw);

                    const arr1 = [obj1.reactivePower, obj1.reactivePowerKw, obj1.apparentPower, obj1.apparentPowerKw, obj1.current, obj1.voltage, obj1.pwrFactor, obj1.frequency];
                    const allValid = arr1.every(v => typeof v === 'number' && isFinite(v));
                    if (allValid) {
                        this.consumptionsServices?.[index]
                            ?.updateCharacteristic(Characteristic.ReactivePower, obj1.reactivePowerKw)
                            .updateCharacteristic(Characteristic.ApparentPower, obj1.apparentPowerKw)
                            .updateCharacteristic(Characteristic.Current, obj1.current)
                            .updateCharacteristic(Characteristic.Voltage, obj1.voltage)
                            .updateCharacteristic(Characteristic.PwrFactor, obj1.pwrFactor)
                            .updateCharacteristic(Characteristic.Frequency, obj1.frequency)
                            .updateCharacteristic(Characteristic.PowerPeakReset, false);
                    };

                    //total
                    if (obj1.measurementType === 'Consumption Total') {
                        //store power peak in pv object
                        this.pv.consumptionTotalPowerPeak = obj1.powerPeak;

                        //debug
                        const debug1 = this.enableDebugMode ? this.emit('debug', `${obj1.measurementType} power state: ${obj1.powerState}`) : false;
                        const debug2 = this.enableDebugMode ? this.emit('debug', `${obj1.measurementType} power peak detected: ${obj1.powerPeakDetected}`) : false;
                        const debug3 = this.enableDebugMode ? this.emit('debug', `${obj1.measurementType} energy state: ${obj1.energyState}`) : false;

                        //power
                        if (this.powerConsumptionTotalLevelActiveSensorsCount > 0) {
                            for (let i = 0; i < this.powerConsumptionTotalLevelActiveSensorsCount; i++) {
                                const sensor = this.powerConsumptionTotalLevelActiveSensors[i];
                                const state = await this.evaluateCompareMode(obj1.power, sensor.powerLevel, sensor.compareMode);
                                sensor.state = state;
                                this.powerConsumptionTotalLevelSensorsServices?.[i]?.updateCharacteristic(sensor.characteristicType, state);
                            }
                        }

                        //energy
                        if (this.energyConsumptionTotalLevelActiveSensorsCount > 0) {
                            for (let i = 0; i < this.energyConsumptionTotalLevelActiveSensors; i++) {
                                const sensor = this.energyConsumptionTotalLevelActiveSensors[i];
                                const state = await this.evaluateCompareMode(obj1.energyToday, sensor.energyLevel, sensor.compareMode);
                                sensor.state = state;
                                this.energyConsumptionTotalLevelSensorsServices?.[i]?.updateCharacteristic(sensor.characteristicType, state);
                            }
                        }

                        //grid quality
                        if (this.gridConsumptionTotalQualityActiveSensorsCount > 0) {
                            for (let i = 0; i < this.gridConsumptionTotalQualityActiveSensorsCount; i++) {
                                const sensor = this.gridConsumptionTotalQualityActiveSensors[i];
                                const compareValue = [obj.current, obj.voltage, obj.frequency, obj.pwrFactor][sensor.compareType];
                                const state = await this.evaluateCompareMode(compareValue, sensor.compareLevel, sensor.compareMode);
                                sensor.state = state;
                                this.gridConsumptionTotalLevelSensorsServices?.[i]?.updateCharacteristic(sensor.characteristicType, state);
                            }
                        }
                    }

                    //net
                    if (obj1.measurementType === 'Consumption Net') {
                        //store power peak in pv object
                        this.pv.consumptionNetPowerPeak = obj1.powerPeak;

                        //debug
                        const debug1 = this.enableDebugMode ? this.emit('debug', `${obj1.measurementType} power state: ${obj1.powerState}`) : false;
                        const debug2 = this.enableDebugMode ? this.emit('debug', `${obj1.measurementType} power peak detected: ${obj1.powerPeakDetected}`) : false;
                        const debug3 = this.enableDebugMode ? this.emit('debug', `${obj1.measurementType} energy state: ${obj1.energyState}`) : false;

                        //power
                        if (this.powerConsumptionNetLevelActiveSensorsCount > 0) {
                            for (let i = 0; i < this.powerConsumptionNetLevelActiveSensorsCount; i++) {
                                const sensor = this.powerConsumptionNetLevelActiveSensors[i];
                                const state = await this.evaluateCompareMode(obj1.power, sensor.powerLevel, sensor.compareMode);
                                sensor.state = state;
                                this.powerConsumptionNetLevelSensorsServices?.[i]?.updateCharacteristic(sensor.characteristicType, state);
                            }
                        }

                        //energy
                        if (this.energyConsumptionNetLevelActiveSensorsCount > 0) {
                            for (let i = 0; i < this.energyConsumptionNetLevelActiveSensorsCount; i++) {
                                const sensor = this.energyConsumptionNetLevelActiveSensors[i];
                                const state = await this.evaluateCompareMode(obj1.energyToday, sensor.energyLevel, sensor.compareMode);
                                sensor.state = state;
                                this.energyConsumptionNetLevelSensorsServices?.[i]?.updateCharacteristic(sensor.characteristicType, state);
                            }
                        }

                        //grid quality
                        if (this.gridConsumptionNetQualityActiveSensorsCount > 0) {
                            for (let i = 0; i < this.gridConsumptionNetQualityActiveSensorsCount; i++) {
                                const sensor = this.gridConsumptionNetQualityActiveSensors[i];
                                const compareValue = [obj.current, obj.voltage, obj.frequency, obj.pwrFactor][sensor.compareType];
                                const state = await this.evaluateCompareMode(compareValue, sensor.compareLevel, sensor.compareMode);
                                sensor.state = state;
                                this.gridConsumptionNetQualityActiveSensorsServices?.[i]?.updateCharacteristic(sensor.characteristicType, state);
                            }
                        }
                    }
                }
                //add consumption arr to pv
                this.pv.productionAll.consumption = arr;

                //consumption supported
                this.feature.productionAll.consumption.supported = true;
            }

            //production all supported
            this.feature.productionAll.supported = true;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('productionall', this.pv.productionAll) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Production All', this.pv.productionAll) : false;
            return true;
        } catch (error) {
            throw new Error(`Update production all error: ${error}`);
        }
    }

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
                const encharges = enchargesSupported ? ensembleInventory[0].devices : [];
                const enchargesInstalled = encharges.length > 0;
                if (enchargesInstalled) {
                    const arr = [];
                    const enchargesPercentFullSummary = [];
                    const type = ApiCodes[ensembleInventory[0].type];
                    encharges.forEach((encharge, index) => {
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
                            derIndex: encharge.der_index ?? 0,
                            status: {}
                        };
                        //push to array
                        arr.push(obj);

                        //encharges percent full summary
                        enchargesPercentFullSummary.push(obj.percentFull);

                        //update chaaracteristics
                        const accessory = this.enchargeBackupLevelActiveAccessory;
                        if (accessory) {
                            const { percentFull, chargingState } = obj;
                            const lowBatteryState = percentFull < accessory.minSoc;
                            const service = this.enchargesLevelAndStateServices?.[index];
                            const { characteristicType, characteristicType1, characteristicType2 } = accessory;

                            if (service) {
                                service
                                    .updateCharacteristic(characteristicType, lowBatteryState)
                                    .updateCharacteristic(characteristicType1, percentFull)
                                    .updateCharacteristic(characteristicType2, chargingState);
                            }
                        }


                        const service = this.enchargesServices?.[index];
                        if (service) {
                            service
                                .updateCharacteristic(Characteristic.EnchargeStatus, obj.deviceStatus)
                                .updateCharacteristic(Characteristic.EnchargeLastReportDate, obj.lastReportDate)
                                .updateCharacteristic(Characteristic.EnchargeAdminStateStr, obj.adminStateStr)
                                .updateCharacteristic(Characteristic.EnchargeOperating, obj.operating)
                                .updateCharacteristic(Characteristic.EnchargeCommunicating, obj.communicating)
                                .updateCharacteristic(Characteristic.EnchargeSleepEnabled, obj.sleepEnabled)
                                .updateCharacteristic(Characteristic.EnchargePercentFull, obj.percentFull)
                                .updateCharacteristic(Characteristic.EnchargeTemperature, obj.temperature)
                                .updateCharacteristic(Characteristic.EnchargeMaxCellTemp, obj.maxCellTemp)
                                .updateCharacteristic(Characteristic.EnchargeCommLevelSubGhz, obj.commLevelSubGhz)
                                .updateCharacteristic(Characteristic.EnchargeCommLevel24Ghz, obj.commLevel24Ghz)
                                .updateCharacteristic(Characteristic.EnchargeLedStatus, obj.ledStatus)
                                .updateCharacteristic(Characteristic.EnchargeDcSwitchOff, obj.dcSwitchOff)
                                .updateCharacteristic(Characteristic.EnchargeRev, obj.rev)
                                .updateCharacteristic(Characteristic.EnchargeCapacity, obj.capacity);

                            if (this.feature?.gridProfile?.supported) {
                                service.updateCharacteristic(Characteristic.EnchargeGridProfile, this.pv.gridProfile.name);
                            }
                        }

                    });
                    //add obj to array
                    this.pv.ensemble.encharges.devices = arr;

                    //calculate encharges percent full summ 0 - 100%
                    const percentFullSum = enchargesPercentFullSummary.reduce((total, num) => total + num, 0) / encharges.length;
                    this.pv.ensemble.encharges.percentFullSum = percentFullSum;
                    this.pv.ensemble.encharges.energyStateSum = percentFullSum > 0;

                    //update chaaracteristics
                    if (this.enchargeBackupLevelSummaryActiveAccessory) {
                        const accessory = this.enchargeBackupLevelSummaryActiveAccessory;
                        const serviceBattery = accessory.displayType === 5;
                        const backupLevel = percentFullSum > accessory.minSoc ? percentFullSum : 0;
                        const state = serviceBattery ? backupLevel < accessory.minSoc : backupLevel > accessory.minSoc;

                        accessory.state = state;
                        accessory.backupLevel = backupLevel;

                        this.enchargeSummaryLevelAndStateService
                            ?.updateCharacteristic(accessory.characteristicType, state)
                            .updateCharacteristic(accessory.characteristicType1, backupLevel);
                    }
                }
                //encharges
                this.feature.encharges.supported = enchargesSupported;
                this.feature.encharges.installed = enchargesInstalled;
                this.feature.encharges.count = encharges.length;

                //enpowers
                const enpowersSupported = ensembleInventoryKeys.includes('ENPOWER');
                const enpowers = enpowersSupported ? ensembleInventory[1].devices : [];
                const enpowersInstalled = enpowers.length > 0;
                if (enpowersInstalled) {
                    const arr = [];
                    const type = ApiCodes[ensembleInventory[1].type];
                    enpowers.forEach((enpower, index) => {
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
                            enpwrCurrStateId: enpower.Enpwr_curr_state_id ?? 0,
                            status: {}
                        };
                        //push to array
                        arr.push(obj);

                        //update chaaracteristics
                        this.envoyService
                            ?.updateCharacteristic(Characteristic.EnvoyEnpowerGridState, obj.mainsAdminStateBool)
                            .updateCharacteristic(Characteristic.EnvoyEnpowerGridMode, obj.enpwrGridModeTranslated)

                        const service = this.enpowersServices?.[index];
                        if (service) {
                            service
                                .updateCharacteristic(Characteristic.EnpowerStatus, obj.deviceStatus)
                                .updateCharacteristic(Characteristic.EnpowerLastReportDate, obj.lastReportDate)
                                .updateCharacteristic(Characteristic.EnpowerAdminStateStr, obj.adminStateStr)
                                //.updateCharacteristic(Characteristic.EnpowerOperating, obj.operating)
                                .updateCharacteristic(Characteristic.EnpowerCommunicating, obj.communicating)
                                .updateCharacteristic(Characteristic.EnpowerTemperature, obj.temperature)
                                .updateCharacteristic(Characteristic.EnpowerCommLevelSubGhz, obj.commLevelSubGhz)
                                .updateCharacteristic(Characteristic.EnpowerCommLevel24Ghz, obj.commLevel24Ghz)
                                .updateCharacteristic(Characteristic.EnpowerMainsAdminState, obj.mainsAdminState)
                                .updateCharacteristic(Characteristic.EnpowerMainsOperState, obj.mainsOperState)
                                .updateCharacteristic(Characteristic.EnpowerEnpwrGridMode, obj.enpwrGridModeTranslated)
                                .updateCharacteristic(Characteristic.EnpowerEnchgGridMode, obj.enchgGridModeTranslated);

                            if (this.feature?.gridProfile?.supported) {
                                service.updateCharacteristic(Characteristic.EnpowerGridProfile, this.pv.gridProfile.name);
                            }
                        }

                        //enpower grid control
                        const control = this.enpowerGridStateActiveControl;
                        if (control) {
                            const { characteristicType } = control;
                            const state = obj.mainsAdminStateBool;

                            control.state = state;
                            this.enpowerGridStateControlService?.updateCharacteristic(characteristicType, state);
                        }

                        //enpower grid state sensor
                        const sensor = this.enpowerGridStateActiveSensor;
                        if (sensor) {
                            const { characteristicType } = sensor;
                            const state = obj.enpwrGridStateBool;

                            sensor.state = state;
                            this.enpowerGridStateSensorService?.updateCharacteristic(characteristicType, state);
                        }

                        //enpower grid mode sensors
                        if (this.enpowerGridModeActiveSensorsCount > 0) {
                            for (let i = 0; i < this.enpowerGridModeActiveSensorsCount; i++) {
                                const sensor = this.enpowerGridModeActiveSensors[i];
                                const service = this.enpowerGridModeSensorsServices?.[i];
                                const isActive = sensor.gridMode === obj.enpwrGridMode;

                                sensor.state = isActive;
                                service?.updateCharacteristic(sensor.characteristicType, isActive);
                            }
                        }

                    });
                    //add obj to array
                    this.pv.ensemble.enpowers.devices = arr;
                }
                //enpowers
                this.feature.enpowers.supported = enpowersSupported;
                this.feature.enpowers.installed = enpowersInstalled;
                this.feature.enpowers.count = enpowers.length;
            }

            //ensemble supported
            this.feature.ensemble.installed = this.feature.encharges.installed || this.feature.enpowers.installed;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('ensembleinventory', ensembleInventory) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Ensemble Inventory', ensembleInventory) : false;
            return true;
        } catch (error) {
            throw new Error(`Update ensemble inventory error: ${error}`);
        }
    }

    async updateEnsembleStatus() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting ensemble status`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.EnsembleStatus);
            const ensembleStatus = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Ensemble status:`, ensembleStatus) : false;

            //ensemble status keys
            const ensembleStatusKeys = Object.keys(ensembleStatus);
            const ensembleStatusSupported = ensembleStatusKeys.includes('inventory');

            //ensemble status not exist
            if (ensembleStatusSupported) {
                const inventory = ensembleStatus.inventory;

                //encharges installed
                if (this.feature.encharges.installed) {
                    const enchargesRatedPowerSummary = []; //array to hold rated power values
                    this.pv.ensemble.encharges.devices.forEach((encharge, index) => {
                        const serialNumber = encharge.serialNumber;
                        const status = inventory.serial_nums[serialNumber];
                        const obj = {
                            deviceType: status.device_type,
                            comInterfacStr: status.com_interface_str ?? 'Unknown',
                            deviceId: status.device_id ?? 'Unknown',
                            adminState: status.admin_state,
                            adminStateStr: ApiCodes[status.admin_state_str] ?? 'Unknown',
                            reportedGridMode: ApiCodes[status.reported_grid_mode] ?? 'Unknown',
                            phase: status.phase ?? 'Unknown',
                            derIndex: status.der_index ?? 0,
                            revision: status.encharge_revision ?? 0,
                            capacity: status.encharge_capacity ?? 0,
                            ratedPower: status.encharge_rated_power ?? 0,
                            reportedGridState: ApiCodes[status.reported_enc_grid_state] ?? 'Unknown',
                            msgRetryCount: status.msg_retry_count ?? 0,
                            partNumber: status.part_number,
                            assemblyNumber: status.assembly_number,
                            appFwVersion: status.app_fw_version,
                            zbFwVersion: status.zb_fw_version ?? 'Unknown',
                            zbBootloaderVers: status.zb_bootloader_vers ?? 'Unknown',
                            iblFwVersion: status.ibl_fw_version,
                            swiftAsicFwVersion: status.swift_asic_fw_version,
                            bmuFwVersion: status.bmu_fw_version,
                            submodulesCount: status.submodule_count,
                            submodules: status.submodules
                        };
                        //add status to encharges
                        this.pv.ensemble.encharges.devices[index].status = obj;

                        //push encharge rated power to the array
                        enchargesRatedPowerSummary.push(obj.ratedPower);
                    });

                    //sum rated power for all encharges to kW and add to encharge object
                    this.pv.ensemble.encharges.ratedPowerSumKw = (enchargesRatedPowerSummary.reduce((total, num) => total + num, 0) / 1000);
                }

                //enpowers installed
                if (this.feature.enpowers.installed) {
                    this.pv.ensemble.enpowers.devices.forEach((enpower, index) => {
                        const serialNumber = enpower.serialNumber;
                        const status = inventory.serial_nums[serialNumber];
                        const obj = {
                            deviceType: status.device_type,
                            comInterfacStr: status.com_interface_str ?? 'Unknown',
                            deviceId: status.device_id ?? 'Unknown',
                            adminState: status.admin_state,
                            adminStateStr: ApiCodes[status.admin_state_str] ?? 'Unknown',
                            msgRetryCount: status.msg_retry_count ?? 0,
                            partNumber: status.part_number,
                            assemblyNumber: status.assembly_number,
                            appFwVersion: status.app_fw_version,
                            iblFwVersion: status.ibl_fw_version,
                            swiftAsicFwVersion: status.swift_asic_fw_version,
                            bmuFwVersion: status.bmu_fw_version,
                            submodulesCount: status.submodule_count,
                            submodules: status.submodules
                        };
                        //add status to encharges
                        this.pv.ensemble.enpowers.devices[index].status = obj;
                    });
                }

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
                this.pv.ensemble.counters = counters;

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
                };
                //add secctrl to ensemble object
                this.pv.ensemble.secctrl = secctrl;

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
                };
                //add relay to ensemble object
                this.pv.ensemble.relay = relay;

                //update chaaracteristics
                this.ensembleStatusService
                    ?.updateCharacteristic(Characteristic.EnsembleRestPower, counters.restPowerKw)
                    .updateCharacteristic(Characteristic.EnsembleFrequencyBiasHz, secctrl.freqBiasHz)
                    .updateCharacteristic(Characteristic.EnsembleVoltageBiasV, secctrl.voltageBiasV)
                    .updateCharacteristic(Characteristic.EnsembleFrequencyBiasHzQ8, secctrl.freqBiasHzQ8)
                    .updateCharacteristic(Characteristic.EnsembleVoltageBiasVQ5, secctrl.voltageBiasVQ5)
                    .updateCharacteristic(Characteristic.EnsembleFrequencyBiasHzPhaseB, secctrl.freqBiasHzPhaseB)
                    .updateCharacteristic(Characteristic.EnsembleVoltageBiasVPhaseB, secctrl.voltageBiasVPhaseB)
                    .updateCharacteristic(Characteristic.EnsembleFrequencyBiasHzQ8PhaseB, secctrl.freqBiasHzQ8PhaseB)
                    .updateCharacteristic(Characteristic.EnsembleVoltageBiasVQ5PhaseB, secctrl.voltageBiasVQ5PhaseB)
                    .updateCharacteristic(Characteristic.EnsembleFrequencyBiasHzPhaseC, secctrl.freqBiasHzPhaseC)
                    .updateCharacteristic(Characteristic.EnsembleVoltageBiasVPhaseC, secctrl.voltageBiasVPhaseC)
                    .updateCharacteristic(Characteristic.EnsembleFrequencyBiasHzQ8PhaseC, secctrl.freqBiasHzQ8PhaseC)
                    .updateCharacteristic(Characteristic.EnsembleVoltageBiasVQ5PhaseC, secctrl.voltageBiasVQ5PhaseC)
                    .updateCharacteristic(Characteristic.EnsembleConfiguredBackupSoc, secctrl.configuredBackupSoc)
                    .updateCharacteristic(Characteristic.EnsembleAdjustedBackupSoc, secctrl.adjustedBackupSoc)
                    .updateCharacteristic(Characteristic.EnsembleAggSoc, secctrl.aggSoc)
                    .updateCharacteristic(Characteristic.EnsembleAggMaxEnergy, secctrl.aggMaxEnergyKw)
                    .updateCharacteristic(Characteristic.EnsembleEncAggSoc, secctrl.encAggSoc)
                    .updateCharacteristic(Characteristic.EnsembleEncAggRatedPower, this.pv.ensemble.encharges.ratedPowerSumKw)
                    .updateCharacteristic(Characteristic.EnsembleEncAggPercentFull, this.pv.ensemble.encharges.percentFullSum)
                    .updateCharacteristic(Characteristic.EnsembleEncAggBackupEnergy, secctrl.encAggBackupEnergy)
                    .updateCharacteristic(Characteristic.EnsembleEncAggAvailEnergy, secctrl.encAggAvailEnergy);

                //encharge grid state sensor
                if (this.enchargeGridStateActiveSensor) {
                    const state = relay.enchgGridStateBool;
                    this.enchargeGridStateActiveSensor.state = state;
                    this.enchargeGridStateSensorService?.updateCharacteristic(this.enchargeGridStateActiveSensor.characteristicType, state);
                }

                //encharge grid mode sensors
                if (this.enchargeGridModeActiveSensorsCount > 0) {
                    const currentGridMode = relay.enchgGridMode;
                    for (let i = 0; i < this.enchargeGridModeActiveSensorsCount; i++) {
                        const sensor = this.enchargeGridModeActiveSensors[i];
                        const state = sensor.gridMode === currentGridMode;
                        sensor.state = state;
                        const service = this.enchargeGridModeSensorsServices?.[i]?.updateCharacteristic(sensor.characteristicType, state);
                    }
                }

                //encharge backup level sensors
                if (this.enchargeBackupLevelActiveSensorsCount > 0) {
                    const percentFull = this.pv.ensemble.encharges.percentFullSum;
                    for (let i = 0; i < this.enchargeBackupLevelActiveSensorsCount; i++) {
                        const sensor = this.enchargeBackupLevelActiveSensors[i];
                        const state = await this.evaluateCompareMode(percentFull, sensor.backupLevel, sensor.compareMode);
                        sensor.state = state;
                        const service = this.enchargeBackupLevelSensorsServices?.[i]?.updateCharacteristic(sensor.characteristicType, state);
                    }
                }

                //solar grid state sensor
                if (this.solarGridStateActiveSensor) {
                    const state = relay.solarGridStateBool;
                    this.solarGridStateActiveSensor.state = state;
                    this.solarGridStateSensorService?.updateCharacteristic(this.solarGridStateActiveSensor.characteristicType, state);
                }

                //solar grid mode sensors
                if (this.solarGridModeActiveSensorsCount > 0) {
                    const currentGridMode = relay.solarGridMode;
                    for (let i = 0; i < this.solarGridModeActiveSensorsCount; i++) {
                        const sensor = this.solarGridModeActiveSensors[i];
                        const state = sensor.gridMode === currentGridMode;
                        sensor.state = state;
                        const service = this.solarGridModeSensorsServices?.[i]?.updateCharacteristic(sensor.characteristicType, state);
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
            this.feature.ensemble.status.supported = ensembleStatusSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('ensemblestatus', ensembleStatus) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Ensemble Status', ensembleStatus) : false;
            return true;
        } catch (error) {
            throw new Error(`Update ensemble status error: ${error}`);
        }
    }

    async updateEnchargesSettings() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting encharge settings`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.EnchargeSettings);
            const enchargesSettings = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Encharge settings:`, enchargesSettings) : false;

            //encharge keys
            const enchargeSettingsKeys = Object.keys(enchargesSettings);
            const enchargesSettingsSupported = enchargeSettingsKeys.includes('enc_settings');

            //encharge settings not exist
            if (enchargesSettingsSupported) {
                const settings = enchargesSettings.enc_settings;
                const obj = {
                    enable: settings.enable === true, //bool
                    country: settings.country, //str
                    currentLimit: settings.current_limit, //float
                    perPhase: settings.per_phase //bool
                };
                //add encharges settings to ensemble object
                this.pv.ensemble.encharges.settings = obj;

                //encharge state sensor
                if (this.enchargeStateActiveSensor) {
                    const state = obj.enable;
                    this.enchargeStateActiveSensor.state = state;
                    const characteristicType = this.enchargeStateActiveSensor.characteristicType;
                    this.enchargeStateSensorService?.updateCharacteristic(characteristicType, state);
                }
            }

            //encharges settings supported
            this.feature.encharges.settings.supported = enchargesSettingsSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('enchargesettings', enchargesSettings) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Encharge Settings', enchargesSettings) : false;
            return true;
        } catch (error) {
            throw new Error(`Update encharge settings. error: ${error}`);
        }
    }

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
                };

                const singleRateSupported = tariffSettingsKeys.includes('single_rate');
                const singleRateData = tariffSettings.single_Rate ?? {};
                tariff.singleRate = {
                    rate: singleRateData.rate,
                    sell: singleRateData.sell
                };

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
                });

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
                });

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
                this.pv.ensemble.tariff = tariff;

                //encharge profile controls
                if (this.enchargeProfileActiveControlsCount > 0) {
                    for (let i = 0; i < this.enchargeProfileActiveControlsCount; i++) {
                        const control = this.enchargeProfileActiveControls[i];
                        const service = this.enchargeProfileControlsServices?.[i];
                        const { profile, characteristicType } = control;
                        const isActive = tariff.storageSettings.mode === profile;
                        control.state = isActive;

                        if (service) {
                            service.updateCharacteristic(characteristicType, isActive);
                            if (profile !== 'backup') {
                                service.updateCharacteristic(Characteristic.Brightness, tariff.storageSettings.reservedSoc);
                            }
                        }
                    }
                }

                //encharge profile sensors
                if (this.enchargeProfileActiveSensorsCount > 0) {
                    for (let i = 0; i < this.enchargeProfileActiveSensorsCount; i++) {
                        const sensor = this.enchargeProfileActiveSensors[i];
                        const state = tariff.storageSettings.mode === sensor.profile;
                        sensor.state = state;
                        this.enchargeProfileSensorsServices?.[i]?.updateCharacteristic(sensor.characteristicType, state);
                    }
                }
            }

            //tariff supported
            this.feature.tariff.supported = tariffSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('tariff', tariffSettings) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Tariff', tariffSettings) : false;
            return true;
        } catch (error) {
            throw new Error(`Update tariff. error: ${error}`);
        }
    }

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
                    const arr = [];
                    dryContacts.forEach((contact, index) => {
                        const obj = {
                            id: contact.id, //str NC1
                            status: contact.status, //str closed
                            stateBool: contact.status === 'closed',
                            settings: {}
                        };
                        arr.push(obj);

                        //dry contacts control
                        this.dryContactsControlServices?.[index]?.updateCharacteristic(Characteristic.On, obj.stateBool);

                        //dry contacts sensors
                        this.dryContactsSensorServices?.[index]?.updateCharacteristic(Characteristic.ContactSensorState, obj.stateBool);

                    });
                    this.pv.ensemble.dryContacts = arr;
                }
            }
            //dry contacts supported
            this.feature.dryContacts.supported = dryContactsSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('drycontacts', ensembleDryContacts) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Dry Contacts', ensembleDryContacts) : false;
            return true;
        } catch (error) {
            throw new Error(`Update dry contacts error: ${error}`);
        }
    }

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
                    const arr = [];
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
                        };
                        arr.push(obj);
                        this.pv.ensemble.dryContacts[index].settings = obj;
                    });

                    //dry contacts settings supported
                    this.feature.dryContacts.installed = arr.includes(true);
                    this.feature.dryContacts.count = dryContactsSettings.length;
                    this.feature.dryContacts.settings.installed = arr.includes(true);
                    this.feature.dryContacts.settings.count = dryContactsSettings.length;
                }
            }

            //dry contacts settings supported
            this.feature.dryContacts.settings.supported = dryContactsSettingsSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('drycontactssettings', ensembleDryContactsSettings) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Dry Contacts Settings', ensembleDryContactsSettings) : false;
            return true;
        } catch (error) {
            throw new Error(`Update dry contacts settings error: ${error}`);
        }
    }

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
                const obj = {
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
                    type: ensembleGenerator.type,
                    settings: {}
                };
                //add generator to ensemble object
                this.pv.ensemble.generator = obj;

                //update chaaracteristics
                //generator state and mode
                if (obj.installed) {
                    this.envoyService
                        ?.updateCharacteristic(Characteristic.EnvoyGeneratorState, (obj.adminModeOnBool || obj.adminModeAutoBool))
                        .updateCharacteristic(Characteristic.EnvoyGeneratorMode, obj.adminMode)

                    this.generatorService
                        ?.updateCharacteristic(Characteristic.EnsembleGeneratorAdminState, obj.adminState)
                        .updateCharacteristic(Characteristic.EnsembleGeneratorOperState, obj.operState)
                        .updateCharacteristic(Characteristic.EnsembleGeneratorAdminMode, obj.adminMode)
                        .updateCharacteristic(Characteristic.EnsembleGeneratorShedule, obj.schedule)
                        .updateCharacteristic(Characteristic.EnsembleGeneratorStartSoc, obj.startSoc)
                        .updateCharacteristic(Characteristic.EnsembleGeneratorStopSoc, obj.stopSoc)
                        .updateCharacteristic(Characteristic.EnsembleGeneratorExexOn, obj.excOn)
                        .updateCharacteristic(Characteristic.EnsembleGeneratorPresent, obj.present)
                        .updateCharacteristic(Characteristic.EnsembleGeneratorType, obj.type);

                    //generator control
                    if (this.generatorStateActiveControl) {
                        const state = obj.adminModeOnBool || obj.adminModeAutoBool;
                        this.generatorStateActiveControl.state = state;
                        this.generatorStateControlService?.updateCharacteristic(this.generatorStateActiveControl.characteristicType, state);
                    }

                    //generator state sensor
                    if (this.generatorStateActiveSensor) {
                        const state = obj.adminModeOnBool || obj.adminModeAutoBool;
                        this.generatorStateActiveSensor.state = state;
                        this.generatorStateSensorService?.updateCharacteristic(this.generatorStateActiveSensor.characteristicType, state);
                    }

                    //generator mode controls
                    if (this.generatorModeActiveControlsCount > 0) {
                        for (let i = 0; i < this.generatorModeActiveControlsCount; i++) {
                            const { mode, characteristicType } = this.generatorModeActiveControls[i];
                            const state = mode === obj.adminMode;
                            this.generatorModeActiveControls[i].state = state;
                            this.generatorModeControlsServices?.[i]?.updateCharacteristic(characteristicType, state);
                        }
                    }

                    //generator mode sensors
                    if (this.generatorModeActiveSensorsCount > 0) {
                        for (let i = 0; i < this.generatorModeActiveSensorsCount; i++) {
                            const { mode, characteristicType } = this.generatorModeActiveSensors[i];
                            const state = mode === obj.adminMode;
                            this.generatorModeActiveSensors[i].state = state;
                            this.generatorModeSensorsServices?.[i]?.updateCharacteristic(characteristicType, state);
                        }
                    }
                }

                //generator installed
                this.feature.generators.installed = obj.installed;
                this.feature.generators.count = obj.installed ? 1 : 0;
            }

            //generator supported
            this.feature.generators.supported = generatorSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('generator', ensembleGenerator) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Generator', ensembleGenerator) : false;
            return true;
        } catch (error) {
            throw new Error(`Update generator error: ${error}`);
        }
    }

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
                const settings = generatorSettings.generator_settings;
                const obj = {
                    maxContGenAmps: settings.max_cont_gen_amps, //float
                    minGenLoadingPerc: settings.min_gen_loading_perc, //int
                    maxGenEfficiencyPerc: settings.max_gen_efficiency_perc, //int
                    namePlateRatingWat: settings.name_plate_rating_wat, //float
                    startMethod: settings.start_method, //str Auto, Manual
                    warmUpMins: settings.warm_up_mins, //str
                    coolDownMins: settings.cool_down_mins, //str
                    genType: settings.gen_type, //str
                    model: settings.model, //str
                    manufacturer: settings.manufacturer, //str
                    lastUpdatedBy: settings.last_updated_by, //str
                    generatorId: settings.generator_id, //str
                    chargeFromGenerator: settings.charge_from_generator //bool
                };

                //add generator settings to ensemble generator object
                this.pv.ensemble.generator.settings = obj;
            }

            //generator settings supported
            this.feature.generators.settings.supported = generatorSettingsSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('generatorsettings', generatorSettings) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Generator Settings', generatorSettings) : false;
            return true;
        } catch (error) {
            throw new Error(`Update generator settings error: ${error}`);
        }
    }

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
                id: dryContactsData.dry_contact_id, //str NC1
                loadName: dryContactsData.dry_contact_load_name,
                status: dryContactsData.dry_contact_status, //str closed
                stateBool: dryContactsData.dry_contact_status === 'closed'
            };

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
                        { key: 'activePower', characteristic: Characteristic.LiveDataActivePower },
                        { key: 'activePowerL1', characteristic: Characteristic.LiveDataActivePowerL1 },
                        { key: 'activePowerL2', characteristic: Characteristic.LiveDataActivePowerL2 },
                        { key: 'activePowerL3', characteristic: Characteristic.LiveDataActivePowerL3 },
                        { key: 'apparentPower', characteristic: Characteristic.LiveDataApparentPower },
                        { key: 'apparentPowerL1', characteristic: Characteristic.LiveDataApparentPowerL1 },
                        { key: 'apparentPowerL2', characteristic: Characteristic.LiveDataApparentPowerL2 },
                        { key: 'apparentPowerL3', characteristic: Characteristic.LiveDataApparentPowerL3 }
                    ];

                    characteristics.forEach(({ key, characteristic }) => {
                        if (obj[key] !== 'notSupported') {
                            this.liveDataServices[index].updateCharacteristic(characteristic, obj[key]);
                        }
                    });
                }
            });

            //enable live data stream if not enabled
            const scStreamEnabled = liveData.connection.scStream;
            const enableLiveDataStream = !scStreamEnabled && this.feature.info.jwtToken.installer ? await this.setLiveDataStream() : false;

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
        }
    }

    async updateGridProfile(start) {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting grid profile`) : false;
        try {
            const response = await this.axiosInstance(ApiUrls.Profile);
            const profile = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Grid profile:`, profile) : false;

            //arf profile
            const gridProfile = {
                name: profile.name ? profile.name.substring(0, 64) : false,
                id: profile.id ?? 0,
                version: profile.version ?? '',
                itemCount: profile.item_count ?? 0
            };

            const gridProfileSupported = gridProfile.name !== false;
            this.pv.gridProfile = gridProfileSupported ? gridProfile : {};
            this.feature.gridProfile.supported = gridProfileSupported;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('gridprofile', profile) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'Grid Profile', profile) : false;
            return true;
        } catch (error) {
            if (start) {
                this.emit('warn', `Grid profile not supported, dont worry all working correct, only the profile name will not be displayed`);
                return null;
            }
            throw new Error(`Update grid profile error: ${error}`)
        }
    }

    async updatePlcLevel(start) {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting plc level`) : false;
        try {
            const options = {
                method: 'GET',
                baseURL: this.url,
                headers: {
                    Accept: 'application/json'
                }
            };

            const response = this.feature.info.firmware7xx ? await this.axiosInstance(ApiUrls.InverterComm) : await this.digestAuthInstaller.request(ApiUrls.InverterComm, options);
            const plcLevel = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Plc level:`, plcLevel) : false;

            // get comm level data
            if (this.feature.inventory.pcus.installed) {
                this.pv.inventory.pcus.forEach((pcu, index) => {
                    const key = pcu.serialNumber;
                    const rawValue = plcLevel[key] ?? 0;
                    const value = rawValue * 20;
                    this.pv.inventory.pcus[index].commLevel = value;
                    this.pcuServices?.[index]?.updateCharacteristic(Characteristic.MicroinverterCommLevel, value);
                });
            }

            if (this.feature.inventory.acbs.installed) {
                this.pv.inventory.acbs.forEach((acb, index) => {
                    const key = acb.serialNumber;
                    const rawValue = plcLevel[key] ?? 0;
                    const value = rawValue * 20;
                    this.pv.inventory.acbs[index].commLevel = value;
                    this.acBatteriesServices?.[index]?.updateCharacteristic(Characteristic.AcBatterieCommLevel, value);
                });
            }

            if (this.feature.inventory.nsrbs.installed) {
                this.pv.inventory.nsrbs.forEach((nsrb, index) => {
                    const key = nsrb.serialNumber;
                    const rawValue = plcLevel[key] ?? 0;
                    const value = rawValue * 20;
                    this.pv.inventory.nsrbs[index].commLevel = value;
                    this.qRelaysServices?.[index]?.updateCharacteristic(Characteristic.QrelayCommLevel, value);
                });
            }


            if (this.feature.encharges.installed) {
                this.pv.ensemble.encharges.devices.forEach((enc, index) => {
                    const key = enc.serialNumber;
                    const rawValue = plcLevel[key] ?? 0;
                    const value = rawValue * 20;
                    this.pv.ensemble.encharges.devices[index].commLevel = value;
                    this.enchargesServices?.[index]?.updateCharacteristic(Characteristic.EnchargeCommLevel, value);
                });
            }


            //update plc level control state
            this.envoyService?.updateCharacteristic(Characteristic.EnvoyCheckCommLevel, false);

            if (this.plcLevelActiveControl) {
                this.plcLevelActiveControl.state = false;
                const characteristicType = this.plcLevelActiveControl.characteristicType;
                this.plcLevelControlService?.updateCharacteristic(characteristicType, false);
            }

            //update plc level state
            this.pv.plcLevelState = false;

            //comm level supported
            this.feature.plcLevel.supported = true;

            //restFul
            const restFul = this.restFulConnected ? this.restFul1.update('plclevel', plcLevel) : false;

            //mqtt
            const mqtt = this.mqttConnected ? this.mqtt1.emit('publish', 'PLC Level', plcLevel) : false;
            return true;
        } catch (error) {
            if (start) {
                this.emit('warn', `Plc level not supported, dont worry all working correct, only the plc level control will not be displayed`);
                return null;
            }
            throw new Error(`Update plc level: ${error}`)
        };
    }

    async getEnvoyDevId() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting envoy dev Id`) : false;
        try {
            //read envoy dev id from file
            try {
                const response = await this.readData(this.envoyIdFile);
                const debug = this.enableDebugMode ? this.emit('debug', `Envoy dev Id from file: ${response.toString().length === 9 ? 'Exist' : 'Missing'}`) : false;
                const envoyDevId = response.toString() ?? '';
                if (envoyDevId.length === 9) {
                    this.feature.info.devId = envoyDevId;
                    return true;
                }
            } catch (error) {
                this.emit('warn', `Read envoy dev Id from file error, trying from device: ${error}`)
            }

            //read envoy dev id from device
            const response = await this.axiosInstance(ApiUrls.BackboneApplication);
            const envoyBackboneApp = response.data;
            const debug = this.enableDebugMode ? this.emit('debug', `Envoy backbone app:`, envoyBackboneApp) : false;

            //backbone data
            const keyword = 'envoyDevId:';
            const startIndex = envoyBackboneApp.indexOf(keyword);

            //check envoy dev Id exist
            if (startIndex === -1) {
                this.emit('warn', `Envoy dev Id not found, dont worry all working correct, only the power production control will not be possible`);
                return null;
            }

            const substringStartIndex = startIndex + keyword.length;
            const envoyDevId = envoyBackboneApp.substr(substringStartIndex, 9);
            if (envoyDevId.length !== 9) {
                this.emit('warn', `Envoy dev Id: ${envoyDevId} have wrong format, dont worry all working correct, only the power production control will not be possible`);
                return null;
            }

            //save dev id
            try {
                await this.saveData(this.envoyIdFile, envoyDevId);
            } catch (error) {
                this.emit('error', `Save envoy dev Id error: ${error}`);
            }

            this.feature.info.devId = envoyDevId;
            this.feature.backboneApp.supported = true;
            return true;
        } catch (error) {
            this.emit('warn', `Get envoy dev Id from device error: ${error}, dont worry all working correct, only the power production control will not be possible`);
            return null;
        }
    }

    async updateProductionState(start) {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting production state`) : false;
        try {
            const options = {
                method: 'GET',
                baseURL: this.url,
                headers: {
                    Accept: 'application/json'
                }
            };

            const url = ApiUrls.PowerForcedModeGetPut.replace("EID", this.feature.info.devId);
            const response = this.feature.info.firmware7xx ? await this.axiosInstance(url) : await this.digestAuthInstaller.request(url, options);
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
                this.envoyService?.updateCharacteristic(Characteristic.EnvoyProductionPowerMode, state);

                if (this.productionStateActiveSensor) {
                    this.productionStateActiveSensor.state = state;
                    const characteristicType = this.productionStateActiveSensor.characteristicType;
                    this.productionStateSensorService?.updateCharacteristic(characteristicType, state);
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
            if (start) {
                this.emit('warn', `Production state not supported, dont worry all working correct, only the production state monitoring sensor and control will not be displayed`);
                return null;
            }
            throw new Error(`Update production state error: ${error}`)
        }
    }

    async getDeviceInfo() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting device info`) : false;

        //debug objects
        const debug1 = this.enableDebugMode ? this.emit('debug', `Pv object:`, this.pv) : false;

        //display info
        this.emit('devInfo', `-------- ${this.name} --------`);
        this.emit('devInfo', `Manufacturer: `);
        this.emit('devInfo', `Model: ${this.pv.info.modelName}`);
        this.emit('devInfo', `Firmware: ${this.pv.info.software}`);
        this.emit('devInfo', `SerialNr: ${this.pv.info.serialNumber}`);
        this.emit('devInfo', `Time: ${this.pv.info.time}`);
        this.emit('devInfo', `------------------------------`);
        const displayLog = this.feature.inventory.nsrbs.installed ? this.emit('devInfo', `Q-Relays: ${this.feature.inventory.nsrbs.count}`) : false;
        const displayLog0 = this.feature.inventory.pcus.installed ? this.emit('devInfo', `Inverters: ${this.feature.inventory.pcus.count}`) : false;
        const displayLog1 = this.feature.inventory.acbs.installed ? this.emit('devInfo', `${this.acBatterieName}: ${this.feature.inventory.acbs.count}`) : false;
        const displayLog2 = this.feature.home.wirelessConnections.installed ? this.emit('devInfo', `Wireless Kit: ${this.feature.home.wirelessConnections.count}`) : false;
        const displayLine = displayLog || displayLog0 || displayLog1 || displayLog2 ? this.emit('devInfo', `--------------------------------`) : false;
        const displayMeters = this.feature.meters.installed ? this.emit('devInfo', `Meters: Yes`) : false;
        const displayLog4 = displayMeters && this.feature.meters.production.supported ? this.emit('devInfo', `Production: ${this.feature.meters.production.enabled ? `Enabled` : `Disabled`}`) : false;
        const displayLog5 = displayMeters && this.feature.meters.consumption.supported ? this.emit('devInfo', `Consumption: ${this.feature.meters.consumption.enabled ? `Enabled` : `Disabled`}`) : false;
        const displayLog6 = displayMeters && this.feature.meters.acBatterie.supported ? this.emit('devInfo', `Storage: ${this.feature.meters.acBatterie.enabled ? `Enabled` : `Disabled`}`) : false;
        const displayLine1 = displayMeters ? this.emit('devInfo', `--------------------------------`) : false;
        const displayEnsemble = this.feature.enpowers.installed || this.feature.encharges.installed || this.feature.dryContacts.installed || this.feature.generators.installed ? this.emit('devInfo', `Ensemble: Yes`) : false;
        const displayLog8 = displayEnsemble && this.feature.enpowers.installed ? this.emit('devInfo', `Enpowers: ${this.feature.enpowers.count}`) : false;
        const displayLog9 = displayEnsemble && this.feature.encharges.installed ? this.emit('devInfo', `${this.enchargeName}: ${this.feature.encharges.count}`) : false;
        const displayLog10 = displayEnsemble && this.feature.dryContacts.installed ? this.emit('devInfo', `Dry Contacts: ${this.feature.dryContacts.count}`) : false;
        const displayLog11 = displayEnsemble && this.feature.generators.installed ? this.emit('devInfo', `Generator: Yes`) : false;
        const displayLine2 = displayEnsemble ? this.emit('devInfo', `--------------------------------`) : false;
        return true;
    }

    async setProductionState(state) {
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
            };

            const options = {
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: this.feature.cookie
                },
                withCredentials: true,
                httpsAgent: new https.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                })
            };

            const url = this.url + ApiUrls.PowerForcedModeGetPut.replace("EID", this.feature.info.devId);
            const response = this.feature.info.firmware7xx ? await axios.put(url, data, options) : await this.digestAuthInstaller.request(url, options1);
            const debug = this.enableDebugMode ? this.emit('debug', `Set power produstion state:`, response.data) : false;
            return true;
        } catch (error) {
            throw new Error(`Set production power mode error: ${error}`);
        }
    }

    async setEnchargeProfile(profile, reserve, independence) {
        const debug = this.enableDebugMode ? this.emit('debug', `Set encharge profile`) : false;
        try {
            const data = {
                tariff: {
                    mode: profile, //str economy/savings-mode, backup, self-consumption
                    operation_mode_sub_type: '', //str
                    reserved_soc: reserve, //float
                    very_low_soc: this.pv.ensemble.tariff.storageSettings.veryLowSoc, //int
                    charge_from_grid: independence //bool
                }
            };

            const options = {
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: this.feature.cookie
                },
                withCredentials: true,
                httpsAgent: new Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                })
            };

            if (this.pv.ensemble.tariff.storageSettings.optSchedules) {
                data.tariff.opt_schedules = this.pv.ensemble.tariff.storageSettings.optSchedules //bool
            }

            const url = this.url + ApiUrls.TariffSettingsGetPut;
            const response = await axios.put(url, data, options);
            const debug = this.enableDebugMode ? this.emit('debug', `Set encharge profile:`, response.data) : false;
            return true;
        } catch (error) {
            throw new Error(`Set encharge profile error: ${error}`);
        }
    }

    async setEnpowerGridState(state) {
        const debug = this.enableDebugMode ? this.emit('debug', `Set enpower grid state`) : false;
        try {
            const gridState = state ? 'closed' : 'open';
            const data = { 'mains_admin_state': gridState };
            const options = {
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: this.feature.cookie
                },
                withCredentials: true,
                httpsAgent: new https.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                })
            };

            const url = this.url + ApiUrls.EnchargeRelay;
            const response = await axios.post(url, data, options);
            const debug = this.enableDebugMode ? this.emit('debug', `Set enpower grid state:`, response.data) : false;
            return true;
        } catch (error) {
            throw new Error(`Set enpower grid state error: ${error}`);
        }
    }

    async setDryContactState(id, state) {
        const debug = this.enableDebugMode ? this.emit('debug', `Set dry contact`) : false;
        try {
            const dryState = state ? 'closed' : 'open';
            const data = { dry_contacts: { id: id, status: dryState } };
            const options = {
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: this.feature.cookie
                },
                withCredentials: true,
                httpsAgent: new Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                })
            };

            const url = this.url + ApiUrls.DryContacts;
            const response = await axios.post(url, data, options);
            const debug = this.enableDebugMode ? this.emit('debug', `Set dry contact:`, response.data) : false;
            return true;
        } catch (error) {
            throw new Error(`Set dry contact error: ${error}`);
        }
    }

    async setDryContactSettings(id, index, state) {
        const debug = this.enableDebugMode ? this.emit('debug', `Set dry contact settings`) : false;
        try {
            const data = {
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
            };
            const options = {
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: this.feature.cookie
                },
                withCredentials: true,
                httpsAgent: new Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                })
            };

            const url = this.url + ApiUrls.DryContactsSettings;
            const response = await axios.post(url, data, options);
            const debug = this.enableDebugMode ? this.emit('debug', `Set dry contact settings:`, response.data) : false;
            return true;
        } catch (error) {
            throw new Error(`Set dry contact settings error: ${error}`);
        }
    }

    async setGeneratorMode(mode) {
        const debug = this.enableDebugMode ? this.emit('debug', `Set generator mode`) : false;
        try {
            const data = { 'gen_cmd': mode };
            const options = {
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: this.feature.cookie
                },
                withCredentials: true,
                httpsAgent: new Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                })
            };

            const url = this.url + ApiUrls.GeneratorModeGetSet;
            const response = await axios.post(url, data, options);
            const debug = this.enableDebugMode ? this.emit('debug', `Set generator mode:`, response.data) : false;
            return true;
        } catch (error) {
            throw new Error(`Set generator mode error: ${error}`);
        }
    }

    async setLiveDataStream() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting live data stream enable`) : false;
        try {
            const data = { 'enable': 1 };
            const options = {
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: this.feature.cookie
                },
                withCredentials: true,
                httpsAgent: new Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                })
            };

            const url = this.url + ApiUrls.LiveDataStream;
            const response = await axios.post(url, data, options);
            const debug = this.enableDebugMode ? this.emit('debug', `Live data stream enable:`, response.data) : false;
            return true;
        } catch (error) {
            throw new Error(`Set live data stream enable error: ${error}`);
        }
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
                    set = value !== this.feature.dataSampling ? value ? await this.impulseGenerator.start(this.timers) : await this.impulseGenerator.stop() : false;
                    break;
                case 'PowerProductionState':
                    set = this.feature.productionState.supported ? await this.setDat(value) : false;
                    break;
                case 'PlcLevel':
                    set = this.feature.plcLevel.supported ? await this.updatePlcLevel(value) : false;
                    break;
                case 'EnchargeProfile':
                    set = this.feature.encharges.tariff.supported ? await this.setEnchargeProfile(value, this.pv.ensemble.tariff.storageSettings.reservedSoc, this.pv.ensemble.tariff.storageSettings.chargeFromGrid) : false;
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
                    })
            }

            //mqtt client
            const mqttEnabled = this.mqtt.enable || false;
            if (mqttEnabled) {
                this.mqtt1 = new Mqtt({
                    host: this.mqtt.host,
                    port: this.mqtt.port || 1883,
                    clientId: this.mqtt.clientId || `enphase_${Math.random().toString(16).slice(3)}`,
                    prefix: this.mqtt.prefix || `enphase/${this.name}`,
                    user: this.mqtt.user,
                    passwd: this.mqtt.passwd,
                    debug: this.mqtt.debug || false
                })
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
                    })
            };

            return true;
        } catch (error) {
            this.emit('warn', `External integration start error: ${error}`);
        }
    }

    async scaleValue(value, inMin, inMax, outMin, outMax) {
        const scaledValue = parseFloat((((Math.max(inMin, Math.min(inMax, value)) - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin).toFixed(0));
        return scaledValue;
    }

    async evaluateCompareMode(value, threshold, mode) {
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

    async startImpulseGenerator() {
        try {
            //start impulse generator 
            await this.impulseGenerator.start(this.timers);
            return true;
        } catch (error) {
            throw new Error(`Impulse generator start error: ${error}`);
        }
    }

    //prepare accessory
    async prepareAccessory() {
        try {
            //suppored feature
            let pvControl = true;
            const envoySerialNumber = this.pv.info.serialNumber;
            const productionStateSupported = this.feature.productionState.supported;
            const envoySupported = this.feature.home.supported;
            const wirelessConnectionsInstalled = this.feature.home.wirelessConnections.installed;
            const plcLevelSupported = this.feature.plcLevel.supported;
            const gridProfileSupported = this.feature.gridProfile.supported;
            const pcuInstalled = this.feature.inventory.pcus.installed;
            const pcuStatusSupported = this.feature.pcuStatus.supported;
            const deviceDataSupported = this.feature.deviceData.supported;
            const qRelaysInstalled = this.feature.inventory.nsrbs.installed;
            const acBatterieName = this.acBatterieName;
            const acBatteriesInstalled = this.feature.inventory.acbs.installed;
            const ensemblesInstalled = this.feature.inventory.esubs.installed;
            const metersInstalled = this.feature.meters.installed;
            const metersProductionEnabled = this.feature.meters.production.enabled;
            const metersConsumptionEnabled = this.feature.meters.consumption.enabled;
            const productionAllSupported = this.feature.productionAll.supported;
            const productionAllProductionSupported = this.feature.productionAll.production.supported;
            const productionAllConsumptionSupported = this.feature.productionAll.consumption.supported;
            const productionCtAcBatterieSupported = this.feature.productionCt.acBatterie.supported
            const ensembleSupported = this.feature.ensemble.supported;
            const ensembleInstalled = this.feature.ensemble.installed;
            const ensembleStatusSupported = this.feature.ensemble.status.supported;
            const enchargeName = this.enchargeName;
            const enchargesInstalled = this.feature.encharges.installed;
            const enchargesSettingsSupported = this.feature.encharges.settings.supported;
            const tariffSupported = this.feature.tariff.supported;
            const enpowersInstalled = this.feature.enpowers.installed;
            const dryContactsInstalled = this.feature.dryContacts.installed;
            const generatorsInstalled = this.feature.generators.installed;
            const liveDataSupported = this.feature.liveData.supported;

            //accessory
            const debug = this.enableDebugMode ? this.emit('debug', `Prepare accessory`) : false;
            const accessoryName = this.name;
            const accessoryUUID = AccessoryUUID.generate(envoySerialNumber);
            const accessoryCategory = [Categories.OTHER, Categories.LIGHTBULB, Categories.FAN, Categories.SENSOR, Categories.SENSOR][this.displayType];
            const accessory = new Accessory(accessoryName, accessoryUUID, accessoryCategory);

            //information service
            const debug1 = this.enableDebugMode ? this.emit('debug', `Prepare Information Service`) : false;
            accessory.getService(Service.AccessoryInformation)
                .setCharacteristic(Characteristic.Manufacturer, 'Enphase')
                .setCharacteristic(Characteristic.Model, this.pv.info.modelName ?? 'Model Name')
                .setCharacteristic(Characteristic.SerialNumber, envoySerialNumber ?? 'Serial Number')
                .setCharacteristic(Characteristic.FirmwareRevision, this.pv.info.software.replace(/[a-zA-Z]/g, '') ?? '0');

            //control lock service
            if (this.lockControl) {
                const debug0 = this.enableDebugMode ? this.emit('debug', `Prepare Control Lock Service`) : false;
                pvControl = false;

                const lockService = accessory.addService(Service.LockMechanism, accessoryName, `lockService`);
                lockService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                lockService.setCharacteristic(Characteristic.ConfiguredName, accessoryName);
                lockService.getCharacteristic(Characteristic.LockCurrentState)
                    .onGet(async () => {
                        const state = pvControl ? 0 : 1;
                        const info = this.disableLogInfo ? false : this.emit('info', `Control: ${state ? 'Unlocked' : 'Locked'}`);
                        return state;
                    });
                lockService.getCharacteristic(Characteristic.LockTargetState)
                    .onGet(async () => {
                        const state = pvControl ? 0 : 1;
                        const info = this.disableLogInfo ? false : this.emit('info', `Terget control: ${state ? 'Unlocked' : 'Locked'}`);
                        return state;
                    })
                    .onSet(async (value) => {
                        if (value === Characteristic.LockTargetState.UNSECURED) {
                            this.emit('success', `Control unlocked`);
                            pvControl = true;
                            lockService.updateCharacteristic(Characteristic.LockCurrentState, 0);

                            if (this.unlockTimeout) clearTimeout(this.unlockTimeout);
                            this.unlockTimeout = setTimeout(() => {
                                pvControl = false;
                                lockService.updateCharacteristic(Characteristic.LockCurrentState, 1);
                                lockService.updateCharacteristic(Characteristic.LockTargetState, 1);
                                this.emit('success', `Control locked`);
                            }, 30000);
                        } else {
                            this.emit('success', `Control locked`);
                            pvControl = false;
                            if (this.unlockTimeout) clearTimeout(this.unlockTimeout);
                            lockService.updateCharacteristic(Characteristic.LockCurrentState, 1);
                            lockService.updateCharacteristic(Characteristic.LockTargetState, 1);
                        }
                    });
            }

            //system
            const debug2 = this.enableDebugMode ? this.emit('debug', `Prepare System Service`) : false;
            const systemService = accessory.addService(this.systemAccessoryActive.serviceType, accessoryName, `systemService`);
            systemService.setPrimaryService(true);
            systemService.addOptionalCharacteristic(Characteristic.ConfiguredName);
            systemService.setCharacteristic(Characteristic.ConfiguredName, accessoryName);
            systemService.getCharacteristic(this.systemAccessoryActive.characteristicType)
                .onGet(async () => {
                    const state = this.systemAccessoryActive.state;
                    const info = this.disableLogInfo ? false : this.emit('info', `Production state: ${state ? 'Enabled' : 'Disabled'}`);
                    return state;
                })
                .onSet(async (state) => {
                    try {
                        if (!productionStateSupported || !pvControl) {
                            const warn = !productionStateSupported ? this.emit('warn', `Production state control not supported`) : this.emit('warn', `Control is locked`);
                            setTimeout(() => {
                                systemService.updateCharacteristic(this.systemAccessoryActive.characteristicType, this.systemAccessoryActive.state);
                            }, 250);
                            return;
                        }

                        const tokenValid = await this.checkJwtToken();
                        const setState = tokenValid && (state !== this.pv.productionState) ? await this.setProductionState(state) : false;
                        const debug = this.enableDebugMode || !tokenValid ? this.emit('debug', `Set production state: ${setState ? 'Enabled' : 'Disabled'}`) : false;
                    } catch (error) {
                        this.emit('warn', `Set production state error: ${error}`);
                    }
                });
            systemService.getCharacteristic(this.systemAccessoryActive.characteristicType1)
                .onGet(async () => {
                    const value = this.systemAccessoryActive.level;
                    const info = this.disableLogInfo ? false : this.emit('info', `Production level: ${value} %`);
                    return value;
                })
                .onSet(async (value) => {
                    try {
                        if (!pvControl) {
                            this.emit('warn', `Control is locked`);
                            setTimeout(() => {
                                systemService.updateCharacteristic(this.systemAccessoryActive.characteristicType1, this.systemAccessoryActive.level);
                            }, 250);
                            return;
                        }

                        systemService.updateCharacteristic(this.systemAccessoryActive.characteristicType1, this.systemAccessoryActive.level);
                    } catch (error) {
                        this.emit('warn', `Set production level error: ${error}`);
                    }
                });
            this.systemService = systemService;

            //data refresh control
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
                            if (!pvControl) {
                                this.emit('warn', `Control is locked`);
                                setTimeout(() => {
                                    dataRefreshControlService.updateCharacteristic(characteristicType, this.dataRefreshActiveControl.state);
                                }, 250);
                                return;
                            }

                            const setState = state ? await this.impulseGenerator.start(this.timers) : await this.impulseGenerator.stop();
                            const info = this.disableLogInfo ? false : this.emit('info', `Set data refresh control to: ${state ? `Enable` : `Disable`}`);
                        } catch (error) {
                            this.emit('warn', `Set data refresh contol error: ${error}`);
                        }
                    });
                this.dataRefreshControlService = dataRefreshControlService;
            }

            //data refresh sensor
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
            }

            //production state sensor
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
            }

            //plc level control
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
                            if (!pvControl) {
                                this.emit('warn', `Control is locked`);
                                setTimeout(() => {
                                    plcLevelContolService.updateCharacteristic(characteristicType, this.plcLevelActiveControl.state);
                                }, 250);
                                return;
                            }

                            const tokenValid = await this.checkJwtToken();
                            const setState = tokenValid && state ? await this.updatePlcLevel() : false;
                            const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Set plc level control state to: ${setState ? `ON` : `OFF`}`);
                        } catch (error) {
                            this.emit('warn', `Set plc level control state error: ${error}`);
                        }
                    });
                this.plcLevelControlService = plcLevelContolService;
            }

            //envoy
            if (envoySupported) {
                const debug3 = this.enableDebugMode ? this.emit('debug', `Prepare Envoy ${envoySerialNumber} Service`) : false;
                const envoyService = accessory.addService(Service.EnvoyService, `Envoy ${envoySerialNumber}`, `envoyService`);
                envoyService.setCharacteristic(Characteristic.ConfiguredName, `Envoy ${envoySerialNumber}`);
                envoyService.getCharacteristic(Characteristic.EnvoyDataRefresh)
                    .onGet(async () => {
                        const state = this.feature.dataSampling;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, data refresh control: ${state ? 'Enabled' : 'Disabled'}`);
                        return state;
                    })
                    .onSet(async (state) => {
                        try {
                            if (!pvControl) {
                                this.emit('warn', `Control is locked`);
                                setTimeout(() => {
                                    envoyService.updateCharacteristic(Characteristic.EnvoyDataRefresh, this.feature.dataSampling);
                                }, 250);
                                return;
                            }

                            const setStatet = state ? await this.impulseGenerator.start(this.timers) : await this.impulseGenerator.stop();
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, set data refresh control to: ${state ? `Enable` : `Disable`}`);
                        } catch (error) {
                            this.emit('warn', `Envoy: ${envoySerialNumber}, set data refresh control error: ${error}`);
                        }
                    });
                envoyService.getCharacteristic(Characteristic.EnvoyAlerts)
                    .onGet(async () => {
                        const value = this.pv.home.alerts;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, alerts: ${value}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnvoyPrimaryInterface)
                    .onGet(async () => {
                        const value = this.pv.home.network.primaryInterface;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, network interface: ${value}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnvoyNetworkWebComm)
                    .onGet(async () => {
                        const value = this.pv.home.network.webComm;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, web communication: ${value ? 'Yes' : 'No'}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnvoyEverReportedToEnlighten)
                    .onGet(async () => {
                        const value = this.pv.home.network.everReportedToEnlighten;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, report to enlighten: ${value ? 'Yes' : 'No'}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnvoyCommNumAndLevel)
                    .onGet(async () => {
                        const value = (`${this.pv.home.comm.num} / ${this.pv.home.comm.level} %`);
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, communication devices and level: ${value}`);
                        return value;
                    });
                if (qRelaysInstalled) {
                    envoyService.getCharacteristic(Characteristic.EnvoyCommNumNsrbAndLevel)
                        .onGet(async () => {
                            const value = (`${this.pv.home.comm.nsrbNum} / ${this.pv.home.comm.nsrbLevel} %`);
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, communication qRelays and level: ${value}`);
                            return value;
                        });
                }
                envoyService.getCharacteristic(Characteristic.EnvoyCommNumPcuAndLevel)
                    .onGet(async () => {
                        const value = (`${this.pv.home.comm.pcuNum} / ${this.pv.home.comm.pcuLevel} %`);
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, communication Microinverters and level: ${value}`);
                        return value;
                    });
                if (acBatteriesInstalled) {
                    envoyService.getCharacteristic(Characteristic.EnvoyCommNumAcbAndLevel)
                        .onGet(async () => {
                            const value = (`${this.pv.home.comm.acbNum} / ${this.pv.home.comm.acbLevel} %`);
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, communication ${acBatterieName} and level ${value}`);
                            return value;
                        });
                }
                if (enchargesInstalled) {
                    envoyService.getCharacteristic(Characteristic.EnvoyCommNumEnchgAndLevel)
                        .onGet(async () => {
                            const value = (`${this.pv.home.comm.encharges[0].num} / ${this.pv.home.comm.encharges[0].level} %`);
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, communication ${enchargeName} and level ${value}`);
                            return value;
                        });
                }
                if (this.pv.home.dbSize !== -1 && this.pv.home.dbPercentFull !== -1) {
                    envoyService.getCharacteristic(Characteristic.EnvoyDbSize)
                        .onGet(async () => {
                            const value = `${this.pv.home.dbSize} / ${this.pv.home.dbPercentFull} %`;
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, data base size: ${value}`);
                            return value;
                        });
                }
                envoyService.getCharacteristic(Characteristic.EnvoyTariff)
                    .onGet(async () => {
                        const value = this.pv.home.tariff;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, tariff: ${value}`);
                        return value;
                    });
                if (this.pv.home.updateStatus) {
                    envoyService.getCharacteristic(Characteristic.EnvoyUpdateStatus)
                        .onGet(async () => {
                            const value = this.pv.home.updateStatus;
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, update status: ${value}`);
                            return value;
                        });
                }
                envoyService.getCharacteristic(Characteristic.EnvoyFirmware)
                    .onGet(async () => {
                        const value = this.pv.info.software;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, firmware: ${value}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnvoyTimeZone)
                    .onGet(async () => {
                        const value = this.pv.home.timeZone;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, time zone: ${value}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnvoyCurrentDateTime)
                    .onGet(async () => {
                        const value = `${this.pv.home.currentDate} ${this.pv.home.currentTime}`;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, current date and time: ${value}`);
                        return value;
                    });
                envoyService.getCharacteristic(Characteristic.EnvoyLastEnlightenReporDate)
                    .onGet(async () => {
                        const value = this.pv.home.network.lastEnlightenReporDate;
                        const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, last report to enlighten: ${value}`);
                        return value;
                    });
                if (productionStateSupported) {
                    envoyService.getCharacteristic(Characteristic.EnvoyProductionPowerMode)
                        .onGet(async () => {
                            const state = this.pv.productionState;
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, production state: ${state ? 'Enabled' : 'Disabled'}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                if (!pvControl) {
                                    this.emit('warn', `Control is locked`);
                                    setTimeout(() => {
                                        envoyService.updateCharacteristic(Characteristic.EnvoyProductionPowerMode.On, this.pv.productionState);
                                    }, 250);
                                    return;
                                }

                                const tokenValid = await this.checkJwtToken();
                                const setState = tokenValid && (state !== this.pv.productionState) ? await this.setProductionState(state) : false;
                                const debug = this.enableDebugMode || !tokenValid ? this.emit('debug', `Envoy: ${envoySerialNumber}, set production state: ${setState ? 'Enabled' : 'Disabled'}`) : false;
                            } catch (error) {
                                this.emit('warn', `Envoy: ${envoySerialNumber}, set production state error: ${error}`);
                            }
                        });
                }
                if (plcLevelSupported) {
                    envoyService.getCharacteristic(Characteristic.EnvoyCheckCommLevel)
                        .onGet(async () => {
                            const state = this.pv.plcLevelState;
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, checking plc level: ${state ? `Yes` : `No`}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                if (!pvControl) {
                                    this.emit('warn', `Control is locked`);
                                    setTimeout(() => {
                                        envoyService.updateCharacteristic(Characteristic.EnvoyCheckCommLevel, this.pv.plcLevelState);
                                    }, 250);
                                    return;
                                }

                                const tokenValid = await this.checkJwtToken();
                                const setStatet = tokenValid && state ? await this.updatePlcLevel() : false;
                                const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Envoy: ${envoySerialNumber}, set check plc level: ${setStatet ? `Yes` : `No`}`);
                            } catch (error) {
                                this.emit('warn', `Envoy: ${envoySerialNumber}, set check plc level error: ${error}`);
                            }
                        });
                }
                if (gridProfileSupported) {
                    envoyService.getCharacteristic(Characteristic.EnvoyGridProfile)
                        .onGet(async () => {
                            const value = this.pv.gridProfile.name;
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, grid profile: ${value}`);
                            return value;
                        });
                }
                if (enpowersInstalled) {
                    envoyService.getCharacteristic(Characteristic.EnvoyEnpowerGridMode)
                        .onGet(async () => {
                            const value = this.pv.ensemble.enpowers.devices[0].enpwrGridModeTranslated;
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, enpower grid mode: ${value}`);
                            return value;
                        });
                    envoyService.getCharacteristic(Characteristic.EnvoyEnpowerGridState)
                        .onGet(async () => {
                            const state = this.pv.ensemble.enpowers.devices[0].mainsAdminStateBool;
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, enpower grid state: ${state ? 'Grid ON' : 'Grid OFF'}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                if (!pvControl) {
                                    this.emit('warn', `Control is locked`);
                                    setTimeout(() => {
                                        envoyService.updateCharacteristic(Characteristic.EnvoyEnpowerGridState, this.pv.ensemble.enpowers.devices[0].mainsAdminStateBool);
                                    }, 250);
                                    return;
                                }

                                const tokenValid = await this.checkJwtToken();
                                const setState = tokenValid ? await this.setEnpowerGridState(state) : false;
                                const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Envoy: ${envoySerialNumber}, set enpower grid state to: ${setState ? `Grid ON` : `Grid OFF`}`);
                            } catch (error) {
                                this.emit('warn', `Set enpower grid state error: ${error}`);
                            }
                        });
                }
                if (generatorsInstalled) {
                    envoyService.getCharacteristic(Characteristic.EnvoyGeneratorMode)
                        .onGet(async () => {
                            const value = this.pv.ensemble.generator.adminMode;
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, generator mode: ${value}`);
                            return value;
                        });
                    envoyService.getCharacteristic(Characteristic.EnvoyGeneratorState)
                        .onGet(async () => {
                            const state = this.pv.ensemble.generator.adminModeOnBool || this.pv.ensemble.generator.adminModeAutoBool;
                            const info = this.disableLogInfo ? false : this.emit('info', `Envoy: ${envoySerialNumber}, generator state: ${state ? 'ON' : 'OFF'}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                if (!pvControl) {
                                    this.emit('warn', `Control is locked`);
                                    setTimeout(() => {
                                        envoyService.updateCharacteristic(Characteristic.EnvoyGeneratorState, this.pv.ensemble.generator.adminModeOnBool || this.pv.ensemble.generator.adminModeAutoBool);
                                    }, 250);
                                    return;
                                }

                                const genMode = state ? 'on' : 'off';
                                const tokenValid = await this.checkJwtToken();
                                const setState = tokenValid ? await this.setGeneratorMode(genMode) : false;
                                const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Envoy: ${envoySerialNumber}, set generator state to: ${setState ? `ON` : `OFF`}`);
                            } catch (error) {
                                this.emit('warn', `Set generator state error: ${error}`);
                            }
                        });
                }
                this.envoyService = envoyService;

                //wireless connektion kit
                if (wirelessConnectionsInstalled) {
                    this.wirelessConnektionsKitServices = [];
                    for (const wirelessConnection of this.pv.home.wirelessKits) {
                        const connectionType = wirelessConnection.type;
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Wireless Connection ${connectionType} Service`) : false;
                        const wirelessConnectionKitService = accessory.addService(Service.WirelessConnectionKitService, `Wireless connection ${connectionType}`, `wirelessConnectionKitService${connectionType}`);
                        wirelessConnectionKitService.setCharacteristic(Characteristic.ConfiguredName, `Wireless connection ${connectionType}`);
                        wirelessConnectionKitService.getCharacteristic(Characteristic.WirelessConnectionKitType)
                            .onGet(async () => {
                                const value = wirelessConnection.type;
                                const info = this.disableLogInfo ? false : this.emit('info', `Wireless connection: ${connectionType}`);
                                return value;
                            });
                        wirelessConnectionKitService.getCharacteristic(Characteristic.WirelessConnectionKitConnected)
                            .onGet(async () => {
                                const value = wirelessConnection.connected;
                                const info = this.disableLogInfo ? false : this.emit('info', `Wireless connection: ${connectionType}, state: ${value ? 'Connected' : 'Disconnected'}`);
                                return value;
                            });
                        wirelessConnectionKitService.getCharacteristic(Characteristic.WirelessConnectionKitSignalStrength)
                            .onGet(async () => {
                                const value = wirelessConnection.signalStrength;
                                const info = this.disableLogInfo ? false : this.emit('info', `Wireless connection: ${connectionType}, signal strength: ${value} %`);
                                return value;
                            });
                        wirelessConnectionKitService.getCharacteristic(Characteristic.WirelessConnectionKitSignalStrengthMax)
                            .onGet(async () => {
                                const value = wirelessConnection.signalStrengthMax;
                                const info = this.disableLogInfo ? false : this.emit('info', `Wireless connection: ${connectionType}, signal strength max: ${value} %`);
                                return value;
                            });
                        this.wirelessConnektionsKitServices.push(wirelessConnectionKitService);
                    }
                }
            }

            //pcu
            if (pcuInstalled) {
                this.pcuServices = [];
                for (const pcu of this.pv.inventory.pcus) {
                    const serialNumber = pcu.serialNumber;
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Microinverter ${serialNumber} Service`) : false;
                    const pcuService = accessory.addService(Service.MicroinverterService, `Microinverter ${serialNumber}`, `pcuService${serialNumber}`);
                    pcuService.setCharacteristic(Characteristic.ConfiguredName, `Microinverter ${serialNumber}`);
                    pcuService.getCharacteristic(Characteristic.MicroinverterProducing)
                        .onGet(async () => {
                            const value = pcu.producing;
                            const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, producing: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    pcuService.getCharacteristic(Characteristic.MicroinverterCommunicating)
                        .onGet(async () => {
                            const value = pcu.communicating;
                            const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    pcuService.getCharacteristic(Characteristic.MicroinverterProvisioned)
                        .onGet(async () => {
                            const value = pcu.provisioned;
                            const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, provisioned: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    pcuService.getCharacteristic(Characteristic.MicroinverterOperating)
                        .onGet(async () => {
                            const value = pcu.operating;
                            const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    pcuService.getCharacteristic(Characteristic.MicroinverterStatus)
                        .onGet(async () => {
                            const value = pcu.deviceStatus;
                            const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, status: ${value}`);
                            return value;
                        });
                    pcuService.getCharacteristic(Characteristic.MicroinverterFirmware)
                        .onGet(async () => {
                            const value = pcu.firmware;
                            const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, firmware: ${value}`);
                            return value;
                        });
                    pcuService.getCharacteristic(Characteristic.MicroinverterLastReportDate)
                        .onGet(async () => {
                            const value = pcu.lastReportDate;
                            const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, last report: ${value}`);
                            return value;
                        });
                    if (pcuStatusSupported || deviceDataSupported) {
                        pcuService.getCharacteristic(Characteristic.MicroinverterPower)
                            .onGet(async () => {
                                let value = pcu.status.power;
                                const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, last power: ${value} W`);
                                return value;
                            });
                        pcuService.getCharacteristic(Characteristic.MicroinverterPowerPeak)
                            .onGet(async () => {
                                const value = pcu.status.powerPeak;
                                const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, peak power: ${value} W`);
                                return value;
                            });
                    }
                    if (deviceDataSupported) {
                        pcuService.getCharacteristic(Characteristic.MicroinverterEnergyToday)
                            .onGet(async () => {
                                const value = pcu.data.energyToday;
                                const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, energy today: ${value} Wh`);
                                return value;
                            });
                        pcuService.getCharacteristic(Characteristic.MicroinverterEnergyYesterday)
                            .onGet(async () => {
                                const value = pcu.data.energyYesterday;
                                const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, energy yesterday: ${value} Wh`);
                                return value;
                            });
                        pcuService.getCharacteristic(Characteristic.MicroinverterEnergyLastSevenDays)
                            .onGet(async () => {
                                const value = pcu.data.energyLastSevenDaysKw;
                                const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, energy last seven days: ${value} kWh`);
                                return value;
                            });
                        pcuService.getCharacteristic(Characteristic.MicroinverterEnergyLifetime)
                            .onGet(async () => {
                                const value = pcu.data.energyLifetimeKw;
                                const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, energy lifetime: ${value} kWh`);
                                return value;
                            });
                        pcuService.getCharacteristic(Characteristic.MicroinverterVoltage)
                            .onGet(async () => {
                                const value = pcu.data.voltage;
                                const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, voltage: ${value} V`);
                                return value;
                            });
                        pcuService.getCharacteristic(Characteristic.MicroinverterFrequency)
                            .onGet(async () => {
                                const value = pcu.data.frequency;
                                const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, frequency: ${value} Hz`);
                                return value;
                            });
                        pcuService.getCharacteristic(Characteristic.MicroinverterTemperature)
                            .onGet(async () => {
                                const value = pcu.data.temperature;
                                const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, temperature: ${value} °C`);
                                return value;
                            });
                    }
                    if (gridProfileSupported) {
                        pcuService.getCharacteristic(Characteristic.MicroinverterGridProfile)
                            .onGet(async () => {
                                const value = this.pv.gridProfile.name;
                                const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, grid profile: ${value}`);
                                return value;
                            });
                    }
                    if (plcLevelSupported) {
                        pcuService.getCharacteristic(Characteristic.MicroinverterCommLevel)
                            .onGet(async () => {
                                const value = pcu.commLevel;
                                const info = this.disableLogInfo ? false : this.emit('info', `Microinverter: ${serialNumber}, plc level: ${value} %`);
                                return value;
                            });
                    }
                    this.pcuServices.push(pcuService);
                }
            }

            //qrelays
            if (qRelaysInstalled) {
                this.qRelayStateSensorServices = [];
                this.qRelaysServices = [];
                for (const qRelay of this.pv.inventory.nsrbs) {
                    const serialNumber = qRelay.serialNumber;
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Q-Relay ${serialNumber} Service`) : false;
                    const qrelayService = accessory.addService(Service.QrelayService, `QRelay ${serialNumber}`, `qrelayService${serialNumber}`);
                    qrelayService.setCharacteristic(Characteristic.ConfiguredName, `qRelay ${serialNumber}`);
                    qrelayService.getCharacteristic(Characteristic.QrelayState)
                        .onGet(async () => {
                            const value = qRelay.relay;
                            const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, relay: ${value ? 'Closed' : 'Open'}`);
                            return value;
                        });
                    qrelayService.getCharacteristic(Characteristic.QrelayLinesCount)
                        .onGet(async () => {
                            const value = qRelay.linesCount;
                            const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, lines: ${value}`);
                            return value;
                        });
                    if (qRelay.linesCount > 0) {
                        qrelayService.getCharacteristic(Characteristic.QrelayLine1Connected)
                            .onGet(async () => {
                                const value = qRelay.line1Connected;
                                const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, line 1: ${value ? 'Closed' : 'Open'}`);
                                return value;
                            });
                    }
                    if (qRelay.linesCount >= 2) {
                        qrelayService.getCharacteristic(Characteristic.QrelayLine2Connected)
                            .onGet(async () => {
                                const value = qRelay.line2Connected;
                                const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, line 2: ${value ? 'Closed' : 'Open'}`);
                                return value;
                            });
                    }
                    if (qRelay.linesCount >= 3) {
                        qrelayService.getCharacteristic(Characteristic.QrelayLine3Connected)
                            .onGet(async () => {
                                const value = qRelay.line3Connected;
                                const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, line 3: ${value ? 'Closed' : 'Open'}`);
                                return value;
                            });
                    }
                    // qrelayService.getCharacteristic(Characteristic.QrelayProducing)
                    //   .onGet(async () => {
                    //     const value = qRelay.producing;
                    //   const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, producing: ${value ? 'Yes' : 'No'}`);
                    // return value;
                    // });
                    qrelayService.getCharacteristic(Characteristic.QrelayCommunicating)
                        .onGet(async () => {
                            const value = qRelay.communicating;
                            const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    qrelayService.getCharacteristic(Characteristic.QrelayProvisioned)
                        .onGet(async () => {
                            const value = qRelay.provisioned;
                            const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, provisioned: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    qrelayService.getCharacteristic(Characteristic.QrelayOperating)
                        .onGet(async () => {
                            const value = qRelay.operating;
                            const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    if (plcLevelSupported) {
                        qrelayService.getCharacteristic(Characteristic.QrelayCommLevel)
                            .onGet(async () => {
                                const value = qRelay.commLevel;
                                const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, plc level: ${value} %`);
                                return value;
                            });
                    }
                    qrelayService.getCharacteristic(Characteristic.QrelayStatus)
                        .onGet(async () => {
                            const value = qRelay.deviceStatus;
                            const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, status: ${value}`);
                            return value;
                        });
                    qrelayService.getCharacteristic(Characteristic.QrelayFirmware)
                        .onGet(async () => {
                            const value = qRelay.firmware;
                            const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, firmware: ${value}`);
                            return value;
                        });
                    qrelayService.getCharacteristic(Characteristic.QrelayLastReportDate)
                        .onGet(async () => {
                            const value = qRelay.lastReportDate;
                            const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, last report: ${value}`);
                            return value;
                        });
                    if (gridProfileSupported) {
                        qrelayService.getCharacteristic(Characteristic.QrelayGridProfile)
                            .onGet(async () => {
                                const value = this.pv.gridProfile.name;
                                const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, grid profile: ${value}`);
                                return value;
                            });
                    }
                    this.qRelaysServices.push(qrelayService);

                    //state sensors
                    if (this.qRelayStateActiveSensor) {
                        const qRelayStateSensorServices = [];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Q-Relay ${serialNumber} State Sensor Service`) : false;
                        const sensorCount = this.qRelayStateActiveSensor.multiphase && qRelay.linesCount > 1 ? qRelay.linesCount + 1 : 1;
                        for (let i = 0; i < sensorCount; i++) {
                            const serviceName = this.qRelayStateActiveSensor.namePrefix ? `${accessoryName} ${i === 0 ? this.qRelayStateActiveSensor.name : `${this.qRelayStateActiveSensor.name} L${i}`}` : `${i === 0 ? this.qRelayStateActiveSensor.name : `${this.qRelayStateActiveSensor.name} L${i}`}`;
                            const serviceType = this.qRelayStateActiveSensor.serviceType;
                            const characteristicType = this.qRelayStateActiveSensor.characteristicType;
                            const qRelayStateSensorService = accessory.addService(serviceType, serviceName, `qRelayStateSensorService${i}`);
                            qRelayStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            qRelayStateSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            qRelayStateSensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.qRelayStateActiveSensor[`state${i}`];
                                    const info = this.disableLogInfo ? false : this.emit('info', `Q-Relay: ${serialNumber}, sensor: ${serviceName}, state: ${state ? 'Active' : 'Not Active'}`);
                                    return state;
                                });
                            qRelayStateSensorServices.push(qRelayStateSensorService);
                        }
                        this.qRelayStateSensorServices.push(qRelayStateSensorServices);
                    }
                }
            }

            //ac batteries
            if (acBatteriesInstalled) {
                //ac batteries summary
                if (productionCtAcBatterieSupported) {
                    //ac batteries backup level and state summary
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
                                try {
                                    if (!pvControl) {
                                        this.emit('warn', `Control is locked`);
                                        setTimeout(() => {
                                            acBatteriesSummaryLevelAndStateService.updateCharacteristic(characteristicType, this.acBatterieBackupLevelSummaryActiveAccessory.state);
                                        }, 250);
                                        return;
                                    }
                                } catch (error) {
                                    this.emit('warn', `${acBatterieName}, Set state error: ${error}`);
                                }
                            });
                        acBatteriesSummaryLevelAndStateService.getCharacteristic(characteristicType1)
                            .onGet(async () => {
                                const value = this.acBatterieBackupLevelSummaryActiveAccessory.backupLevel;
                                const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} backup level: ${value} %`);
                                return value;
                            })
                            .onSet(async (value) => {
                                try {
                                    if (!pvControl) {
                                        this.emit('warn', `Control is locked`);
                                        setTimeout(() => {
                                            acBatteriesSummaryLevelAndStateService.updateCharacteristic(characteristicType1, this.acBatterieBackupLevelSummaryActiveAccessory.backupLevel);
                                        }, 250);
                                        return;
                                    }
                                } catch (error) {
                                    this.emit('warn', `${acBatterieName}, Set level error: ${error}`);
                                }
                            });
                        this.acBatteriesSummaryLevelAndStateService = acBatteriesSummaryLevelAndStateService;
                    }

                    //ac batteries summary service
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${acBatterieName} Summary Service`) : false;
                    const acBatterieSummaryService = accessory.addService(Service.AcBatterieSummaryService, `${acBatterieName} Summary`, 'acBatterieSummaryService');
                    acBatterieSummaryService.setCharacteristic(Characteristic.ConfiguredName, `${acBatterieName} Summary`);
                    acBatterieSummaryService.getCharacteristic(Characteristic.AcBatterieSummaryPower)
                        .onGet(async () => {
                            const value = this.pv.productionCt.acBatterie.powerKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} power: ${value} kW`);
                            return value;
                        });
                    acBatterieSummaryService.getCharacteristic(Characteristic.AcBatterieSummaryEnergy)
                        .onGet(async () => {
                            const value = this.pv.productionCt.acBatterie.energyKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} energy: ${value} kWh`);
                            return value;
                        });
                    acBatterieSummaryService.getCharacteristic(Characteristic.AcBatterieSummaryPercentFull)
                        .onGet(async () => {
                            const value = this.pv.productionCt.acBatterie.percentFull;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} percent full: ${value}`);
                            return value;
                        });
                    acBatterieSummaryService.getCharacteristic(Characteristic.AcBatterieSummaryActiveCount)
                        .onGet(async () => {
                            const value = this.pv.productionCt.acBatterie.activeCount;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} devices count: ${value}`);
                            return value;
                        });
                    acBatterieSummaryService.getCharacteristic(Characteristic.AcBatterieSummaryState)
                        .onGet(async () => {
                            const value = this.pv.productionCt.acBatterie.state;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} charge status: ${value}`);
                            return value;
                        });
                    acBatterieSummaryService.getCharacteristic(Characteristic.AcBatterieSummaryReadingTime)
                        .onGet(async () => {
                            const value = this.pv.productionCt.acBatterie.readingTime;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} last report: ${value}`);
                            return value;
                        });
                    this.acBatterieSummaryService = acBatterieSummaryService;
                }

                //ac batteries
                this.acBatteriesServices = [];
                for (const acBatterie of this.pv.inventory.acbs) {
                    const serialNumber = acBatterie.serialNumber;

                    //ac batterie backup level and state individual
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
                                try {
                                    if (!pvControl) {
                                        this.emit('warn', `Control is locked`);
                                        setTimeout(() => {
                                            acBatterieLevelAndStateService.updateCharacteristic(characteristicType, this.enchargeBackupLevelActiveAccessory.state);
                                        }, 250);
                                        return;
                                    }
                                } catch (error) {
                                    this.emit('warn', `${acBatterieName}, Set backup level state error: ${error}`);
                                }
                            });
                        acBatterieLevelAndStateService.getCharacteristic(characteristicType1)
                            .onGet(async () => {
                                const value = acBatterie.percentFull;
                                const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} ${serialNumber}, backup level: ${value} %`);
                                return value;
                            })
                            .onSet(async (value) => {
                                try {
                                    if (!pvControl) {
                                        this.emit('warn', `Control is locked`);
                                        setTimeout(() => {
                                            acBatterieLevelAndStateService.updateCharacteristic(characteristicType1, acBatterie.percentFull);
                                        }, 250);
                                        return;
                                    }
                                } catch (error) {
                                    this.emit('warn', `${acBatterieName}, Set backup level: ${error}`);
                                }
                            });
                        acBatterieLevelAndStateService.getCharacteristic(characteristicType2)
                            .onGet(async () => {
                                const state = acBatterie.chargingState;
                                const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName} ${serialNumber}, state: ${state === 0 ? 'Discharging' : state === 1 ? 'Charging' : 'Ready'}`);
                                return state;
                            });
                        this.acBatteriesLevelAndStateServices.push(acBatterieLevelAndStateService);
                    };

                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${acBatterieName} ${serialNumber} Service`) : false;
                    const acBatterieService = accessory.addService(Service.AcBatterieService, `${acBatterieName} ${serialNumber}`, `acBatterieService${serialNumber}`);
                    acBatterieService.setCharacteristic(Characteristic.ConfiguredName, `${acBatterieName} ${serialNumber}`);
                    acBatterieService.getCharacteristic(Characteristic.AcBatterieChargeStatus)
                        .onGet(async () => {
                            const value = acBatterie.chargeStatus;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} charge status ${value}`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.AcBatterieProducing)
                        .onGet(async () => {
                            const value = acBatterie.producing;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} producing: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.AcBatterieCommunicating)
                        .onGet(async () => {
                            const value = acBatterie.communicating;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} communicating: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.AcBatterieProvisioned)
                        .onGet(async () => {
                            const value = acBatterie.provisioned;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} provisioned: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.AcBatterieOperating)
                        .onGet(async () => {
                            const value = acBatterie.operating;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} operating: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    if (plcLevelSupported) {
                        acBatterieService.getCharacteristic(Characteristic.AcBatterieCommLevel)
                            .onGet(async () => {
                                const value = acBatterie.commLevel;
                                const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} plc level: ${value} %`);
                                return value;
                            });
                    }
                    acBatterieService.getCharacteristic(Characteristic.AcBatterieSleepEnabled)
                        .onGet(async () => {
                            const value = acBatterie.sleepEnabled;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} sleep: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.AcBatteriePercentFull)
                        .onGet(async () => {
                            const value = acBatterie.percentFull;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} percent full: ${value} %`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.AcBatterieMaxCellTemp)
                        .onGet(async () => {
                            const value = acBatterie.maxCellTemp;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} max cell temp: ${value} °C`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.AcBatterieSleepMinSoc)
                        .onGet(async () => {
                            const value = acBatterie.sleepMinSoc;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} sleep min soc: ${value} min`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.AcBatterieSleepMaxSoc)
                        .onGet(async () => {
                            const value = acBatterie.sleepMaxSoc;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} sleep max soc: ${value} min`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.AcBatterieStatus)
                        .onGet(async () => {
                            const value = acBatterie.deviceStatus;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} status: ${value}`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.AcBatterieFirmware)
                        .onGet(async () => {
                            const value = acBatterie.firmware;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} firmware: ${value}`);
                            return value;
                        });
                    acBatterieService.getCharacteristic(Characteristic.AcBatterieLastReportDate)
                        .onGet(async () => {
                            const value = acBatterie.lastReportDate;
                            const info = this.disableLogInfo ? false : this.emit('info', `${acBatterieName}: ${serialNumber} last report: ${value}`);
                            return value;
                        });
                    this.acBatteriesServices.push(acBatterieService);
                }
            }

            //ensembles
            if (ensemblesInstalled) {
                this.ensemblesInventoryServices = [];
                for (const ensemble of this.pv.inventory.esubs) {
                    const serialNumber = ensemble.serialNumber;
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Ensemble ${serialNumber} Inventory Service`) : false;
                    const ensembleInventoryService = accessory.addService(Service.EnsembleInventoryService, `Ensemble Inventory`, `ensembleInventoryService${serialNumber}`);
                    ensembleInventoryService.setCharacteristic(Characteristic.ConfiguredName, `Ensemble Inventory`);
                    ensembleInventoryService.getCharacteristic(Characteristic.EnsembleInventoryProducing)
                        .onGet(async () => {
                            const value = ensemble.producing;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble: ${serialNumber}, producing: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    ensembleInventoryService.getCharacteristic(Characteristic.EnsembleInventoryCommunicating)
                        .onGet(async () => {
                            const value = ensemble.communicating;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble: ${serialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    ensembleInventoryService.getCharacteristic(Characteristic.EnsembleInventoryOperating)
                        .onGet(async () => {
                            const value = ensemble.operating;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble: ${serialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    ensembleInventoryService.getCharacteristic(Characteristic.EnsembleInventoryStatus)
                        .onGet(async () => {
                            const value = ensemble.deviceStatus;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble: ${serialNumber}, status: ${value}`);
                            return value;
                        });
                    ensembleInventoryService.getCharacteristic(Characteristic.EnsembleInventoryFirmware)
                        .onGet(async () => {
                            const value = ensemble.firmware;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble: ${serialNumber}, firmware: ${value}`);
                            return value;
                        });
                    ensembleInventoryService.getCharacteristic(Characteristic.EnsembleInventoryLastReportDate)
                        .onGet(async () => {
                            const value = ensemble.lastReportDate;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble: ${serialNumber}, last report: ${value}`);
                            return value;
                        });
                    this.ensemblesInventoryServices.push(ensembleInventoryService);
                }
            }

            //meters
            if (metersInstalled) {
                this.metersServices = [];
                for (const meter of this.pv.meters.data) {
                    const measurementType = meter.measurementType;
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Meter ${measurementType} Service`) : false;
                    const meterService = accessory.addService(Service.MeterService, `Meter ${measurementType}`, `meterService${measurementType}`);
                    meterService.setCharacteristic(Characteristic.ConfiguredName, `Meter ${measurementType}`);
                    meterService.getCharacteristic(Characteristic.MeterState)
                        .onGet(async () => {
                            const value = meter.state;
                            const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, state: ${value ? 'Enabled' : 'Disabled'}`);
                            return value;
                        });
                    meterService.getCharacteristic(Characteristic.MeterPhaseMode)
                        .onGet(async () => {
                            const value = meter.phaseMode;
                            const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, phase mode: ${value}`);
                            return value;
                        });
                    meterService.getCharacteristic(Characteristic.MeterPhaseCount)
                        .onGet(async () => {
                            const value = meter.phaseCount;
                            const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, phase count: ${value}`);
                            return value;
                        });
                    meterService.getCharacteristic(Characteristic.MeterMeteringStatus)
                        .onGet(async () => {
                            const value = meter.meteringStatus;
                            const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, metering status: ${value}`);
                            return value;
                        });
                    meterService.getCharacteristic(Characteristic.MeterStatusFlags)
                        .onGet(async () => {
                            const value = meter.statusFlags;
                            const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, status flag: ${value}`);
                            return value;
                        });
                    if (meter.state) {
                        meterService.getCharacteristic(Characteristic.MeterActivePower)
                            .onGet(async () => {
                                const value = meter.readings.powerKw;
                                const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, active power: ${value} kW`);
                                return value;
                            });
                        meterService.getCharacteristic(Characteristic.MeterApparentPower)
                            .onGet(async () => {
                                const value = meter.readings.apparentPowerKw;
                                const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, apparent power: ${value} kVA`);
                                return value;
                            });
                        meterService.getCharacteristic(Characteristic.MeterReactivePower)
                            .onGet(async () => {
                                const value = meter.readings.reactivePowerKw;
                                const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, reactive power: ${value} kVAr`);
                                return value;
                            });
                        meterService.getCharacteristic(Characteristic.MeterCurrent)
                            .onGet(async () => {
                                const value = meter.readings.current;
                                const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, current: ${value} A`);
                                return value;
                            });
                        meterService.getCharacteristic(Characteristic.MeterVoltage)
                            .onGet(async () => {
                                const value = meter.readings.voltage;
                                const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, voltage: ${value} V`);
                                return value;
                            });
                        meterService.getCharacteristic(Characteristic.MeterFrequency)
                            .onGet(async () => {
                                const value = meter.readings.frequency;
                                const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, frequency: ${value} Hz`);
                                return value;
                            });
                        meterService.getCharacteristic(Characteristic.MeterPwrFactor)
                            .onGet(async () => {
                                const value = meter.readings.pwrFactor;
                                const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, power factor: ${value} cos φ`);
                                return value;
                            });
                        meterService.getCharacteristic(Characteristic.MeterReadingTime)
                            .onGet(async () => {
                                const value = meter.readings.readingTime;
                                const info = this.disableLogInfo ? false : this.emit('info', `Meter: ${measurementType}, last report: ${value}`);
                                return value;
                            });
                    }
                    this.metersServices.push(meterService);
                }
            }

            //production all
            if (productionAllSupported) {
                if (productionAllProductionSupported) {
                    const debug4 = this.enableDebugMode ? this.emit('debug', `Prepare Power And Energy Production Service`) : false;
                    const productionService = accessory.addService(Service.PowerAndEnergyService, `Power And Energy Production`, 'productionService');
                    productionService.setCharacteristic(Characteristic.ConfiguredName, `Power And Energy Production`);
                    productionService.getCharacteristic(Characteristic.Power)
                        .onGet(async () => {
                            const value = this.pv.productionAll.production.powerKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production power: ${value} kW`);
                            return value;
                        });
                    productionService.getCharacteristic(Characteristic.PowerPeak)
                        .onGet(async () => {
                            const value = this.pv.productionAll.production.powerPeakKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production power peak: ${value} kW`);
                            return value;
                        });
                    productionService.getCharacteristic(Characteristic.PowerPeakDetected)
                        .onGet(async () => {
                            const value = this.pv.productionAll.production.powerPeakDetected;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production power peak detected: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    productionService.getCharacteristic(Characteristic.EnergyToday)
                        .onGet(async () => {
                            const value = this.pv.productionAll.production.energyTodayKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production energy today: ${value} kWh`);
                            return value;
                        });
                    productionService.getCharacteristic(Characteristic.EnergyLastSevenDays)
                        .onGet(async () => {
                            const value = this.pv.productionAll.production.energyLastSevenDaysKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production energy last seven days: ${value} kWh`);
                            return value;
                        });
                    productionService.getCharacteristic(Characteristic.EnergyLifetime)
                        .onGet(async () => {
                            const value = this.pv.productionAll.production.energyLifetimeKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production energy lifetime: ${value} kWh`);
                            return value;
                        });
                    if (metersInstalled && metersProductionEnabled) {
                        productionService.getCharacteristic(Characteristic.ReactivePower)
                            .onGet(async () => {
                                const value = this.pv.productionAll.production.reactivePowerKw;
                                const info = this.disableLogInfo ? false : this.emit('info', `Production reactive power: ${value} kVAr`);
                                return value;
                            });
                        productionService.getCharacteristic(Characteristic.ApparentPower)
                            .onGet(async () => {
                                const value = this.pv.productionAll.production.apparentPowerKw;
                                const info = this.disableLogInfo ? false : this.emit('info', `Production apparent power: ${value} kVA`);
                                return value;
                            });
                        productionService.getCharacteristic(Characteristic.Current)
                            .onGet(async () => {
                                const value = this.pv.productionAll.production.current;
                                const info = this.disableLogInfo ? false : this.emit('info', `Production current: ${value} A`);
                                return value;
                            });
                        productionService.getCharacteristic(Characteristic.Voltage)
                            .onGet(async () => {
                                const value = this.pv.productionAll.production.voltage;
                                const info = this.disableLogInfo ? false : this.emit('info', `Production voltage: ${value} V`);
                                return value;
                            });
                        productionService.getCharacteristic(Characteristic.Frequency)
                            .onGet(async () => {
                                const value = this.pv.productionAll.production.frequency;
                                const info = this.disableLogInfo ? false : this.emit('info', `Production frequency: ${value} Hz`);
                                return value;
                            });
                        productionService.getCharacteristic(Characteristic.PwrFactor)
                            .onGet(async () => {
                                const value = this.pv.productionAll.production.pwrFactor;
                                const info = this.disableLogInfo ? false : this.emit('info', `Production power factor: ${value} cos φ`);
                                return value;
                            });
                    }
                    productionService.getCharacteristic(Characteristic.ReadingTime)
                        .onGet(async () => {
                            const value = this.pv.productionAll.production.readingTime;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production last report: ${value}`);
                            return value;
                        });
                    productionService.getCharacteristic(Characteristic.PowerPeakReset)
                        .onGet(async () => {
                            const state = false;
                            const info = this.disableLogInfo ? false : this.emit('info', `Production power peak reset: Off`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                if (!pvControl) {
                                    this.emit('warn', `Control is locked`);
                                    setTimeout(() => {
                                        productionService.updateCharacteristic(Characteristic.PowerPeakReset, false);
                                    }, 250);
                                    return;
                                }

                                const set = state ? this.pv.productionPowerPeak = 0 : false;
                                const info = this.disableLogInfo ? false : this.emit('info', `Production power peak reset: On`);
                                productionService.updateCharacteristic(Characteristic.PowerPeakReset, false);
                            } catch (error) {
                                this.emit('warn', `Production Power Peak reset error: ${error}`);
                            }
                        });
                    this.productionService = productionService;

                    //power level sensors
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
                        }
                    }

                    //energy level sensors
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
                        }
                    }

                    //grid quality sensors
                    if (this.gridProductionQualityActiveSensorsCount > 0 && metersInstalled && metersProductionEnabled) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Grid Quality Sensor Services`) : false;
                        this.gridProductionQualityActiveSensorsServices = [];
                        for (let i = 0; i < this.gridProductionQualityActiveSensorsCount; i++) {
                            const serviceName = this.gridProductionQualityActiveSensors[i].namePrefix ? `${accessoryName} ${this.gridProductionQualityActiveSensors[i].name}` : this.gridProductionQualityActiveSensors[i].name;
                            const serviceType = this.gridProductionQualityActiveSensors[i].serviceType;
                            const characteristicType = this.gridProductionQualityActiveSensors[i].characteristicType;
                            const gridProductionQualityActiveSensorService = accessory.addService(serviceType, serviceName, `gridProductionQualityActiveSensorService${i}`);
                            gridProductionQualityActiveSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            gridProductionQualityActiveSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            gridProductionQualityActiveSensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.gridProductionQualityActiveSensors[i].state;
                                    const info = this.disableLogInfo ? false : this.emit('info', `Grid quality sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.gridProductionQualityActiveSensorsServices.push(gridProductionQualityActiveSensorService);
                        }
                    }
                }

                //power and energy consumption
                if (productionAllConsumptionSupported && metersConsumptionEnabled) {
                    this.consumptionsServices = [];
                    for (const consumption of this.pv.productionAll.consumption) {
                        const measurementType = consumption.measurementType;
                        const isTotal = measurementType === 'Consumption Total';
                        const isNet = measurementType === 'Consumption Net';
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Power And Energy ${measurementType} Service`) : false;
                        const consumptionService = accessory.addService(Service.PowerAndEnergyService, `Power And Energy ${measurementType}`, `consumptionService${measurementType}`);
                        consumptionService.setCharacteristic(Characteristic.ConfiguredName, `Power And Energy ${measurementType}`);
                        consumptionService.getCharacteristic(Characteristic.Power)
                            .onGet(async () => {
                                const value = consumption.powerKw;
                                const info = this.disableLogInfo ? false : this.emit('info', `${measurementType} power: ${value} kW`);
                                return value;
                            });
                        consumptionService.getCharacteristic(Characteristic.PowerPeak)
                            .onGet(async () => {
                                const value = consumption.powerPeakKw;
                                const info = this.disableLogInfo ? false : this.emit('info', `${measurementType} power peak: ${value} kW`);
                                return value;
                            });
                        consumptionService.getCharacteristic(Characteristic.PowerPeakDetected)
                            .onGet(async () => {
                                const value = consumption.powerPeakDetected;
                                const info = this.disableLogInfo ? false : this.emit('info', `${measurementType} power peak detected: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        consumptionService.getCharacteristic(Characteristic.EnergyToday)
                            .onGet(async () => {
                                const value = consumption.energyTodayKw;
                                const info = this.disableLogInfo ? false : this.emit('info', `${measurementType} energy today: ${value} kWh`);
                                return value;
                            });
                        consumptionService.getCharacteristic(Characteristic.EnergyLastSevenDays)
                            .onGet(async () => {
                                const value = consumption.energyLastSevenDaysKw;
                                const info = this.disableLogInfo ? false : this.emit('info', `${measurementType} energy last seven days: ${value} kWh`);
                                return value;
                            });
                        consumptionService.getCharacteristic(Characteristic.EnergyLifetime)
                            .onGet(async () => {
                                const value = consumption.energyLifetimeKw;
                                const info = this.disableLogInfo ? false : this.emit('info', `${measurementType} energy lifetime: ${value} kWh`);
                                return value;
                            });
                        consumptionService.getCharacteristic(Characteristic.ReactivePower)
                            .onGet(async () => {
                                const value = consumption.reactivePowerKw;
                                const info = this.disableLogInfo ? false : this.emit('info', `${measurementType} reactive power: ${value} kVAr`);
                                return value;
                            })
                        consumptionService.getCharacteristic(Characteristic.ApparentPower)
                            .onGet(async () => {
                                const value = consumption.apparentPowerKw;
                                const info = this.disableLogInfo ? false : this.emit('info', `${measurementType} apparent power: ${value} kVA`);
                                return value;
                            });
                        consumptionService.getCharacteristic(Characteristic.Current)
                            .onGet(async () => {
                                const value = consumption.current;
                                const info = this.disableLogInfo ? false : this.emit('info', `${measurementType} current: ${value} A`);
                                return value;
                            });
                        consumptionService.getCharacteristic(Characteristic.Voltage)
                            .onGet(async () => {
                                const value = consumption.voltage;
                                const info = this.disableLogInfo ? false : this.emit('info', `${measurementType} voltage: ${value} V`);
                                return value;
                            });
                        consumptionService.getCharacteristic(Characteristic.Frequency)
                            .onGet(async () => {
                                const value = consumption.frequency;
                                const info = this.disableLogInfo ? false : this.emit('info', `${measurementType} frequency: ${value} Hz`);
                                return value;
                            });
                        consumptionService.getCharacteristic(Characteristic.PwrFactor)
                            .onGet(async () => {
                                const value = consumption.pwrFactor;
                                const info = this.disableLogInfo ? false : this.emit('info', `${measurementType} power factor: ${value} cos φ`);
                                return value;
                            });
                        consumptionService.getCharacteristic(Characteristic.ReadingTime)
                            .onGet(async () => {
                                const value = consumption.readingTime;
                                const info = this.disableLogInfo ? false : this.emit('info', `${measurementType} last report: ${value}`);
                                return value;
                            });
                        consumptionService.getCharacteristic(Characteristic.PowerPeakReset)
                            .onGet(async () => {
                                const state = false;
                                const info = this.disableLogInfo ? false : this.emit('info', `${measurementType} power peak reset: Off`);
                                return state;
                            })
                            .onSet(async (state) => {
                                try {
                                    if (!pvControl) {
                                        this.emit('warn', `Control is locked`);
                                        setTimeout(() => {
                                            consumptionService.updateCharacteristic(Characteristic.PowerPeakReset, false);
                                        }, 250);
                                        return;
                                    }

                                    const set = state ? (isTotal ? this.pv.consumptionTotalPowerPeak = 0 : this.pv.consumptionNetPowerPeak = 0) : false;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${measurementType} power peak reset: On`);
                                    consumptionService.updateCharacteristic(Characteristic.PowerPeakReset, false);
                                } catch (error) {
                                    this.emit('warn', `${measurementType}, power peak reset error: ${error}`);
                                }
                            });
                        this.consumptionsServices.push(consumptionService);

                        //consumption total 
                        if (isTotal) {
                            //power level sensors 
                            if (this.powerConsumptionTotalLevelActiveSensorsCount > 0) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurementType} Power Level Sensor Services`) : false;
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
                                }
                            }

                            //energy level sensors 
                            if (this.energyConsumptionTotalLevelActiveSensorsCount > 0) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurementType} Energy Level Sensor Services`) : false;
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
                                }
                            }

                            //grid quality sensors
                            if (this.gridConsumptionTotalQualityActiveSensorsCount > 0) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare Grid Quality Sensor Services`) : false;
                                this.gridConsumptionTotalQualityActiveSensorsServices = [];
                                for (let i = 0; i < this.gridConsumptionTotalQualityActiveSensorsCount; i++) {
                                    const serviceName = this.gridConsumptionTotalQualityActiveSensors[i].namePrefix ? `${accessoryName} ${this.gridConsumptionTotalQualityActiveSensors[i].name}` : this.gridConsumptionTotalQualityActiveSensors[i].name;
                                    const serviceType = this.gridConsumptionTotalQualityActiveSensors[i].serviceType;
                                    const characteristicType = this.gridConsumptionTotalQualityActiveSensors[i].characteristicType;
                                    const gridConsumptionTotalQualityActiveSensorService = accessory.addService(serviceType, serviceName, `gridConsumptionTotalQualityActiveSensorService${i}`);
                                    gridConsumptionTotalQualityActiveSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    gridConsumptionTotalQualityActiveSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    gridConsumptionTotalQualityActiveSensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.gridConsumptionTotalQualityActiveSensors[i].state;
                                            const info = this.disableLogInfo ? false : this.emit('info', `Grid quality sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.gridConsumptionTotalQualityActiveSensorsServices.push(gridConsumptionTotalQualityActiveSensorService);
                                }
                            }
                        }

                        //consumption total
                        if (isNet) {
                            //power level sensors 
                            if (this.powerConsumptionNetLevelActiveSensorsCount > 0) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurementType} Power Level Sensor Services`) : false;
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
                                }
                            }

                            //energy level sensors 
                            if (this.energyConsumptionNetLevelActiveSensorsCount > 0) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurementType} Energy Level Sensor Services`) : false;
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
                                }
                            }

                            //grid quality sensors
                            if (this.gridConsumptionNetQualityActiveSensorsCount > 0) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare Grid Quality Sensor Services`) : false;
                                this.gridConsumptionNetQualityActiveSensorsServices = [];
                                for (let i = 0; i < this.gridConsumptionNetQualityActiveSensorsCount; i++) {
                                    const serviceName = this.gridConsumptionNetQualityActiveSensors[i].namePrefix ? `${accessoryName} ${this.gridConsumptionNetQualityActiveSensors[i].name}` : this.gridConsumptionNetQualityActiveSensors[i].name;
                                    const serviceType = this.gridConsumptionNetQualityActiveSensors[i].serviceType;
                                    const characteristicType = this.gridConsumptionNetQualityActiveSensors[i].characteristicType;
                                    const gridConsumptionNetQualityActiveSensorService = accessory.addService(serviceType, serviceName, `gridConsumptionNetQualityActiveSensorService${i}`);
                                    gridConsumptionNetQualityActiveSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    gridConsumptionNetQualityActiveSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    gridConsumptionNetQualityActiveSensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.gridConsumptionNetQualityActiveSensors[i].state;
                                            const info = this.disableLogInfo ? false : this.emit('info', `Grid quality sensor: ${serviceName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.gridConsumptionNetQualityActiveSensorsServices.push(gridConsumptionNetQualityActiveSensorService);
                                }
                            }
                        }
                    }
                }
            }

            //ensemble
            if (ensembleInstalled) {
                //status summary
                if (ensembleStatusSupported) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Ensemble Status Service`) : false;
                    const ensembleStatusService = accessory.addService(Service.EnsembleService, `Ensemble`, 'ensembleStatusService');
                    ensembleStatusService.setCharacteristic(Characteristic.ConfiguredName, `Ensemble`);
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleRestPower)
                        .onGet(async () => {
                            const value = this.pv.ensemble.counters.restPowerKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, rest power: ${value} kW`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleFrequencyBiasHz)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.freqBiasHz;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L1 bias frequency: ${value} Hz`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleVoltageBiasV)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.voltageBiasV;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L1 bias voltage: ${value} V`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleFrequencyBiasHzQ8)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.freqBiasHzQ8;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L1 bias q8 frequency: ${value} Hz`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleVoltageBiasVQ5)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.voltageBiasVQ5;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L1 bias q5 voltage: ${value} V`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleFrequencyBiasHzPhaseB)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.freqBiasHzPhaseB;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L2 bias frequency: ${value} Hz`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleVoltageBiasVPhaseB)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.voltageBiasVPhaseB;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L2 bias voltage: ${value} V`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleFrequencyBiasHzQ8PhaseB)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.freqBiasHzQ8PhaseB;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L2 bias q8 frequency: ${value} Hz`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleVoltageBiasVQ5PhaseB)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.voltageBiasVQ5PhaseB;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L2 bias q5 voltage: ${value} V`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleFrequencyBiasHzPhaseC)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.freqBiasHzPhaseC;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L3 bias frequency: ${value} Hz`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleVoltageBiasVPhaseC)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.voltageBiasVPhaseC;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L3 bias voltage: ${value} V`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleFrequencyBiasHzQ8PhaseC)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.freqBiasHzQ8PhaseC;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L3 bias q8 frequency: ${value} Hz`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleVoltageBiasVQ5PhaseC)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.voltageBiasVQ5PhaseC;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, L3 bias q5 voltage: ${value} V`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleConfiguredBackupSoc)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.configuredBackupSoc;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, configured backup SoC: ${value} %`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleAdjustedBackupSoc)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.adjustedBackupSoc;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, adjusted backup SoC: ${value} %`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleAggSoc)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.aggSoc;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, agg SoC: ${value} %`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleAggMaxEnergy)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.aggMaxEnergyKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, agg max energy: ${value} kWh`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleEncAggSoc)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.encAggSoc;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, ${enchargeName} agg SoC: ${value} %`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleEncAggRatedPower)
                        .onGet(async () => {
                            const value = this.pv.ensemble.encharges.ratedPowerSumKw;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, ${enchargeName} agg rated power: ${value} kW`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleEncAggPercentFull)
                        .onGet(async () => {
                            const value = this.pv.ensemble.encharges.percentFullSum;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, ${enchargeName} agg percent full: ${value} %`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleEncAggBackupEnergy)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.encAggBackupEnergy;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, ${enchargeName} agg backup energy: ${value} kWh`);
                            return value;
                        });
                    ensembleStatusService.getCharacteristic(Characteristic.EnsembleEncAggAvailEnergy)
                        .onGet(async () => {
                            const value = this.pv.ensemble.secctrl.encAggAvailEnergy;
                            const info = this.disableLogInfo ? false : this.emit('info', `Ensemble, ${enchargeName} agg available energy: ${value} kWh`);
                            return value;
                        });
                    this.ensembleStatusService = ensembleStatusService;

                    //encharge grid state sensor
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
                    }

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
                        }
                    }

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
                        }
                    }

                    //solar grid state sensor
                    if (this.solarGridStateActiveSensor) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Solar Grid State Sensor Service`) : false;
                        const serialNumber = this.pv.info.serialNumber;
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
                    }

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
                        }
                    }
                }

                //encharges
                if (enchargesInstalled) {

                    //backup level and state summary
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
                                try {
                                    if (!pvControl) {
                                        this.emit('warn', `Control is locked`);
                                        setTimeout(() => {
                                            enchargeSummaryLevelAndStateService.updateCharacteristic(characteristicType, this.enchargeBackupLevelSummaryActiveAccessory.state);
                                        }, 250);
                                        return;
                                    }
                                } catch (error) {
                                    this.emit('warn', `${enchargeName}, Set state error: ${error}`);
                                }
                            });
                        enchargeSummaryLevelAndStateService.getCharacteristic(characteristicType1)
                            .onGet(async () => {
                                const value = this.enchargeBackupLevelSummaryActiveAccessory.backupLevel;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName} backup level: ${value} %`);
                                return value;
                            })
                            .onSet(async (value) => {
                                try {
                                    if (!pvControl) {
                                        this.emit('warn', `Control is locked`);
                                        setTimeout(() => {
                                            enchargeSummaryLevelAndStateService.updateCharacteristic(characteristicType1, this.enchargeBackupLevelSummaryActiveAccessory.backupLevel);
                                        }, 250);
                                        return;
                                    }
                                } catch (error) {
                                    this.emit('warn', `${enchargeName}, Set backup level error: ${error}`);
                                }
                            });
                        this.enchargeSummaryLevelAndStateService = enchargeSummaryLevelAndStateService;
                    }

                    this.enchargesServices = [];
                    for (const encharge of this.pv.ensemble.encharges.devices) {
                        const serialNumber = encharge.serialNumber;

                        //backup level and state individual
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
                                    try {
                                        if (!pvControl) {
                                            this.emit('warn', `Control is locked`);
                                            setTimeout(() => {
                                                enchargeLevelAndStateService.updateCharacteristic(characteristicType, this.enchargeBackupLevelActiveAccessory.state);
                                            }, 250);
                                            return;
                                        }
                                    } catch (error) {
                                        this.emit('warn', `${enchargeName} ${serialNumber}, Set backup level state error: ${error}`);
                                    }
                                });
                            enchargeLevelAndStateService.getCharacteristic(characteristicType1)
                                .onGet(async () => {
                                    const value = encharge.percentFull;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName} ${serialNumber}, backup level: ${value} %`);
                                    return value;
                                })
                                .onSet(async (value) => {
                                    try {
                                        if (!pvControl) {
                                            this.emit('warn', `Control is locked`);
                                            setTimeout(() => {
                                                enchargeLevelAndStateService.updateCharacteristic(characteristicType1, encharge.percentFull);
                                            }, 250);
                                            return;
                                        }
                                    } catch (error) {
                                        this.emit('warn', `${enchargeName} ${serialNumber}, Set backup level error: ${error}`);
                                    }
                                });
                            enchargeLevelAndStateService.getCharacteristic(characteristicType2)
                                .onGet(async () => {
                                    const state = encharge.chargingState;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName} ${serialNumber}, state: ${state === 0 ? 'Discharging' : state === 1 ? 'Charging' : 'Ready'}`);
                                    return state;
                                });
                            this.enchargesLevelAndStateServices.push(enchargeLevelAndStateService);
                        }

                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${enchargeName} ${serialNumber} Service`) : false;
                        const enchargeService = accessory.addService(Service.EnchargeService, `${enchargeName} ${serialNumber}`, `enchargeService${serialNumber}`);
                        enchargeService.setCharacteristic(Characteristic.ConfiguredName, `${enchargeName} ${serialNumber}`);
                        enchargeService.getCharacteristic(Characteristic.EnchargeAdminStateStr)
                            .onGet(async () => {
                                const value = encharge.adminStateStr;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, state: ${value}`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnchargeOperating)
                            .onGet(async () => {
                                const value = encharge.operating;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnchargeCommunicating)
                            .onGet(async () => {
                                const value = encharge.communicating;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        if (plcLevelSupported) {
                            enchargeService.getCharacteristic(Characteristic.EnchargeCommLevel)
                                .onGet(async () => {
                                    const value = encharge.commLevel;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber} plc level: ${value} %`);
                                    return value;
                                });
                        }
                        enchargeService.getCharacteristic(Characteristic.EnchargeCommLevelSubGhz)
                            .onGet(async () => {
                                const value = encharge.commLevelSubGhz;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, sub GHz level: ${value} %`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnchargeCommLevel24Ghz)
                            .onGet(async () => {
                                const value = encharge.commLevel24Ghz;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, 2.4GHz level: ${value} %`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnchargeSleepEnabled)
                            .onGet(async () => {
                                const value = encharge.sleepEnabled;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, sleep: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnchargePercentFull)
                            .onGet(async () => {
                                const value = encharge.percentFull;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, percent full: ${value} %`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnchargeTemperature)
                            .onGet(async () => {
                                const value = encharge.temperature;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, temp: ${value} °C`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnchargeMaxCellTemp)
                            .onGet(async () => {
                                const value = encharge.maxCellTemp;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, max cell temp: ${value} °C`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnchargeLedStatus)
                            .onGet(async () => {
                                const value = encharge.ledStatus;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, LED status: ${value}`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnchargeCapacity)
                            .onGet(async () => {
                                const value = encharge.capacity;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, capacity: ${value} kWh`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnchargeDcSwitchOff)
                            .onGet(async () => {
                                const value = encharge.dcSwitchOff;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, status: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnchargeRev)
                            .onGet(async () => {
                                const value = encharge.rev;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, revision: ${value}`);
                                return value;
                            });
                        if (gridProfileSupported) {
                            enchargeService.getCharacteristic(Characteristic.EnchargeGridProfile)
                                .onGet(async () => {
                                    const value = this.pv.gridProfile.name;
                                    const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, grid profile: ${value}`);
                                    return value;
                                });
                        }
                        enchargeService.getCharacteristic(Characteristic.EnchargeStatus)
                            .onGet(async () => {
                                const value = encharge.deviceStatus;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, status: ${value}`);
                                return value;
                            });
                        enchargeService.getCharacteristic(Characteristic.EnchargeLastReportDate)
                            .onGet(async () => {
                                const value = encharge.lastReportDate;
                                const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName}: ${serialNumber}, last report: ${value}`);
                                return value;
                            });
                        this.enchargesServices.push(enchargeService);
                    }

                    //state sensor
                    if (enchargesSettingsSupported && this.enchargeStateActiveSensor) {
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
                    }

                    //profile controls
                    if (tariffSupported && this.enchargeProfileActiveControlsCount > 0) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${enchargeName} Profile Control Services`) : false;
                        const enchargeSettings = this.pv.ensemble.tariff.storageSettings;
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
                                        if (!pvControl) {
                                            this.emit('warn', `Control is locked`);
                                            setTimeout(() => {
                                                enchargeProfileControlService.updateCharacteristic(characteristicType, this.enchargeProfileActiveControls[i].state);
                                            }, 250);
                                            return;
                                        }

                                        const tokenValid = await this.checkJwtToken();
                                        const set = tokenValid ? state ? await this.setEnchargeProfile(profile, enchargeSettings.reservedSoc, enchargeSettings.chargeFromGrid) : false : false;
                                        const debug = this.enableDebugMode || !tokenValid ? this.emit('debug', `${enchargeName} set profile: ${profile}`) : false;
                                    } catch (error) {
                                        this.emit('warn', `${enchargeName} set profile: ${profile}, error: ${error}`);
                                    }
                                });
                            if (profile !== 'backup') {
                                enchargeProfileControlService.getCharacteristic(Characteristic.Brightness)
                                    .onGet(async () => {
                                        const value = enchargeSettings.reservedSoc;
                                        const info = this.disableLogInfo ? false : this.emit('info', `${enchargeName} profile: ${profile}, reserve: ${value} %`);
                                        return value;
                                    })
                                    .onSet(async (value) => {
                                        try {
                                            if (!pvControl) {
                                                this.emit('warn', `Control is locked`);
                                                setTimeout(() => {
                                                    enchargeProfileControlService.updateCharacteristic(Characteristic.Brightness, enchargeSettings.reservedSoc);
                                                }, 250);
                                                return;
                                            }

                                            if (value === 0 || value === 100) {
                                                this.emit('warn', `${value} can not be set`);
                                                return;
                                            }

                                            const tokenValid = await this.checkJwtToken();
                                            const set = tokenValid ? await this.setEnchargeProfile(profile, value, enchargeSettings.chargeFromGrid) : false;
                                            const debug = this.enableDebugMode || !tokenValid ? this.emit('debug', `${enchargeName} set profile: ${profile}, reserve: ${value} %`) : false;
                                        } catch (error) {
                                            this.emit('warn', `${enchargeName} set profile: ${profile} reserve, error: ${error}`);
                                        }
                                    });
                            }
                            this.enchargeProfileControlsServices.push(enchargeProfileControlService);
                        }
                    }

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
                                });
                            this.enchargeProfileSensorsServices.push(enchargeProfileSensorService);
                        }
                    }
                }

                //enpowers
                if (enpowersInstalled) {
                    const serialNumber = this.pv.ensemble.enpowers.devices[0].serialNumber;
                    this.enpowersServices = [];
                    for (const enpower of this.pv.ensemble.enpowers.devices) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${serialNumber} Service`) : false;
                        const enpowerService = accessory.addService(Service.EnpowerService, `Enpower ${serialNumber}`, `enpowerService${serialNumber}`);
                        enpowerService.setCharacteristic(Characteristic.ConfiguredName, `Enpower ${serialNumber}`);
                        enpowerService.getCharacteristic(Characteristic.EnpowerAdminStateStr)
                            .onGet(async () => {
                                const value = enpower.adminStateStr;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, state: ${value}`);
                                return value;
                            });
                        //enpowerService.getCharacteristic(Characteristic.EnpowerOperating)
                        //    .onGet(async () => {
                        //       const value = enpower.operating;
                        //        const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                        //        return value;
                        //   });
                        enpowerService.getCharacteristic(Characteristic.EnpowerCommunicating)
                            .onGet(async () => {
                                const value = enpower.communicating;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enpowerService.getCharacteristic(Characteristic.EnpowerCommLevelSubGhz)
                            .onGet(async () => {
                                const value = enpower.commLevelSubGhz;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, sub GHz level: ${value} %`);
                                return value;
                            });
                        enpowerService.getCharacteristic(Characteristic.EnpowerCommLevel24Ghz)
                            .onGet(async () => {
                                const value = enpower.commLevel24Ghz;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, 2.4GHz level: ${value} %`);
                                return value;
                            });
                        enpowerService.getCharacteristic(Characteristic.EnpowerTemperature)
                            .onGet(async () => {
                                const value = enpower.temperature;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, temp: ${value} °C`);
                                return value;
                            });
                        enpowerService.getCharacteristic(Characteristic.EnpowerMainsAdminState)
                            .onGet(async () => {
                                const value = enpower.mainsAdminState;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, mains admin state: ${value}`);
                                return value;
                            });
                        enpowerService.getCharacteristic(Characteristic.EnpowerMainsOperState)
                            .onGet(async () => {
                                const value = enpower.mainsOperState;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, mains operating state: ${value}`);
                                return value;
                            });
                        enpowerService.getCharacteristic(Characteristic.EnpowerEnpwrGridMode)
                            .onGet(async () => {
                                const value = enpower.enpwrGridModeTranslated;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, enpower grid mode: ${value}`);
                                return value;
                            });
                        enpowerService.getCharacteristic(Characteristic.EnpowerEnchgGridMode)
                            .onGet(async () => {
                                const value = enpower.enchgGridModeTranslated;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, ${enchargeName} grid mode: ${value}`);
                                return value;
                            });
                        if (gridProfileSupported) {
                            enpowerService.getCharacteristic(Characteristic.EnpowerGridProfile)
                                .onGet(async () => {
                                    const value = this.pv.gridProfile.name;
                                    const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, grid profile: ${value}`);
                                    return value;
                                });
                        }
                        enpowerService.getCharacteristic(Characteristic.EnpowerStatus)
                            .onGet(async () => {
                                const value = enpower.deviceStatus;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, status: ${value}`);
                                return value;
                            });
                        enpowerService.getCharacteristic(Characteristic.EnpowerLastReportDate)
                            .onGet(async () => {
                                const value = enpower.lastReportDate;
                                const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, last report: ${value}`);
                                return value;
                            });
                        this.enpowersServices.push(enpowerService);
                    }

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
                                    if (!pvControl) {
                                        this.emit('warn', `Control is locked`);
                                        setTimeout(() => {
                                            enpowerGridStateControlService.updateCharacteristic(characteristicType, this.enpowerGridStateActiveControl.state);
                                        }, 250);
                                        return;
                                    }

                                    const tokenValid = await this.checkJwtToken();
                                    const setState = tokenValid ? await this.setEnpowerGridState(state) : false;
                                    const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Set Enpower: ${serialNumber}, grid state to: ${setState ? `Grid ON` : `Grid OFF`}`);
                                } catch (error) {
                                    this.emit('warn', `Set Enpower: ${serialNumber}, grid state error: ${error}`);
                                }
                            });
                        this.enpowerGridStateControlService = enpowerGridStateControlService;
                    }

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
                    }

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
                        }
                    }

                    //dry contacts
                    if (dryContactsInstalled) {
                        if (this.enpowerDryContactsControl) {
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${serialNumber} Dry Contact Control Services`) : false;
                            this.dryContactsControlServices = [];
                            this.pv.ensemble.dryContacts.forEach((contact, index) => {
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
                                            if (!pvControl) {
                                                this.emit('warn', `Control is locked`);
                                                setTimeout(() => {
                                                    dryContactContolService.updateCharacteristic(Characteristic.On, contact.stateBool);
                                                }, 250);
                                                return;
                                            }

                                            const tokenValid = await this.checkJwtToken();
                                            const setState = tokenValid ? await this.setDryContactState(controlId, state) : false;
                                            const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Set Enpower: ${serialNumber}, ${serviceName}, control state to: ${setState ? `Manual` : `Soc`}`);
                                        } catch (error) {
                                            this.emit('warn', `Set ${serviceName}, control state error: ${error}`);
                                        }
                                    });
                                this.dryContactsControlServices.push(dryContactContolService);
                            });
                        }

                        if (this.enpowerDryContactsSensor) {
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${serialNumber} Dry Contact Sensor Services`) : false;
                            this.dryContactsSensorServices = [];
                            this.pv.ensemble.dryContacts.forEach((contact, index) => {
                                const serviceName = contact.settings.loadName;
                                const dryContactSensorService = accessory.addService(Service.ContactSensor, serviceName, `dryContactSensorService${index}`);
                                dryContactSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                dryContactSensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                dryContactSensorService.getCharacteristic(Characteristic.ContactSensorState)
                                    .onGet(async () => {
                                        const state = contact.stateBool;
                                        const info = this.disableLogInfo ? false : this.emit('info', `Enpower: ${serialNumber}, ${serviceName}, sensor state: ${state ? 'Active' : 'Not Active'}`);
                                        return state;
                                    });
                                this.dryContactsSensorServices.push(dryContactSensorService);
                            });
                        }
                    }
                }

                //generators
                if (generatorsInstalled) {
                    const type = this.pv.ensemble.generator.type;
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Generator ${type} Service`) : false;
                    const generatorService = accessory.addService(Service.GerneratorService, `Generator ${type}`, `generatorService`);
                    generatorService.setCharacteristic(Characteristic.ConfiguredName, `Generator ${type}`);
                    generatorService.getCharacteristic(Characteristic.EnsembleGeneratorType)
                        .onGet(async () => {
                            const value = this.pv.ensemble.generator.type;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator type: ${type}`);
                            return value;
                        });
                    generatorService.getCharacteristic(Characteristic.EnsembleGeneratorAdminMode)
                        .onGet(async () => {
                            const value = this.pv.ensemble.generator.adminMode;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, admin mode: ${value}`);
                            return value;
                        });
                    generatorService.getCharacteristic(Characteristic.EnsembleGeneratorAdminState)
                        .onGet(async () => {
                            const value = this.pv.ensemble.generator.adminState;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, admin state: ${value}`);
                            return value;
                        });
                    generatorService.getCharacteristic(Characteristic.EnsembleGeneratorOperState)
                        .onGet(async () => {
                            const value = this.pv.ensemble.generator.operState;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, operation state: ${value}`);
                            return value;
                        });
                    generatorService.getCharacteristic(Characteristic.EnsembleGeneratorStartSoc)
                        .onGet(async () => {
                            const value = this.pv.ensemble.generator.startSoc;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, start soc: ${value}`);
                            return value;
                        });
                    generatorService.getCharacteristic(Characteristic.EnsembleGeneratorStopSoc)
                        .onGet(async () => {
                            const value = this.pv.ensemble.generator.stopSoc;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, stop soc: ${value}`);
                            return value;
                        });
                    generatorService.getCharacteristic(Characteristic.EnsembleGeneratorExexOn)
                        .onGet(async () => {
                            const value = this.pv.ensemble.generator.excOn;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, exec on: ${value}`);
                            return value;
                        });
                    generatorService.getCharacteristic(Characteristic.EnsembleGeneratorShedule)
                        .onGet(async () => {
                            const value = this.pv.ensemble.generator.schedule;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, shedule: ${value}`);
                            return value;
                        });
                    generatorService.getCharacteristic(Characteristic.EnsembleGeneratorPresent)
                        .onGet(async () => {
                            const value = this.pv.ensemble.generator.present;
                            const info = this.disableLogInfo ? false : this.emit('info', `Generator: ${type}, present: ${value}`);
                            return value;
                        });
                    this.generatorService = generatorService;

                    //state control 
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
                                    if (!pvControl) {
                                        this.emit('warn', `Control is locked`);
                                        setTimeout(() => {
                                            generatorStateControlService.updateCharacteristic(characteristicType, this.generatorStateActiveControl.state);
                                        }, 250);
                                        return;
                                    }

                                    const genMode = state ? 'on' : 'off';
                                    const tokenValid = await this.checkJwtToken();
                                    const setState = tokenValid ? await this.setGeneratorMode(genMode) : false;
                                    const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Set Generator: ${type}, state to: ${setState ? `ON` : `OFF`}`);
                                } catch (error) {
                                    this.emit('warn', `Set Generator: ${type}, state error: ${error}`);
                                }
                            });
                        this.generatorStateControlService = generatorStateControlService;
                    }

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
                    }

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
                                        if (!pvControl) {
                                            this.emit('warn', `Control is locked`);
                                            setTimeout(() => {
                                                generatorModeControlService.updateCharacteristic(characteristicType, this.generatorModeActiveControls[i].state);
                                            }, 250);
                                            return;
                                        }

                                        const genMode = this.generatorModeActiveControls[i].mode;
                                        const tokenValid = await this.checkJwtToken();
                                        const setState = tokenValid && state ? await this.setGeneratorMode(genMode) : false;
                                        const info = this.disableLogInfo || !tokenValid ? false : this.emit('info', `Set Generator: ${type}, mode to: ${genMode}`);
                                    } catch (error) {
                                        this.emit('warn', `Set Generator: ${type}, state error: ${error}`);
                                    }
                                });
                            this.generatorModeControlsServices.push(generatorModeControlService);
                        }
                    }

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
                        }
                    }
                }
            }

            //live data
            if (liveDataSupported) {
                this.liveDataServices = [];
                for (const liveData of this.pv.liveData.devices) {
                    const liveDataType = liveData.type;
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Live Data ${liveDataType} Service`) : false;
                    const liveDataService = accessory.addService(Service.LiveDataService, `Live Data ${liveDataType}`, `liveDataService${liveDataType}`);
                    liveDataService.setCharacteristic(Characteristic.ConfiguredName, `Live Data ${liveDataType}`);
                    if (liveData.activePower !== 'notSupported') {
                        liveDataService.getCharacteristic(Characteristic.LiveDataActivePower)
                            .onGet(async () => {
                                const value = liveData.activePower;
                                const info = this.disableLogInfo ? false : this.emit('info', `Live Data ${liveDataType}, active power: ${value} kW`);
                                return value;
                            });
                    }
                    if (liveData.activePowerL1 !== 'notSupported') {
                        liveDataService.getCharacteristic(Characteristic.LiveDataActivePowerL1)
                            .onGet(async () => {
                                const value = liveData.activePowerL1;
                                const info = this.disableLogInfo ? false : this.emit('info', `Live Data ${liveDataType} L1, active power: ${value} kW`);
                                return value;
                            });
                    }
                    if (liveData.activePowerL2 !== 'notSupported') {
                        liveDataService.getCharacteristic(Characteristic.LiveDataActivePowerL2)
                            .onGet(async () => {
                                const value = liveData.activePowerL2;
                                const info = this.disableLogInfo ? false : this.emit('info', `Live Data ${liveDataType} L2, active power: ${value} kW`);
                                return value;
                            });
                    }
                    if (liveData.activePowerL3 !== 'notSupported') {
                        liveDataService.getCharacteristic(Characteristic.LiveDataActivePowerL3)
                            .onGet(async () => {
                                const value = liveData.activePowerL3;
                                const info = this.disableLogInfo ? false : this.emit('info', `Live Data ${liveDataType} L3, active power: ${value} kW`);
                                return value;
                            });
                    }
                    if (liveData.apparentPower !== 'notSupported') {
                        liveDataService.getCharacteristic(Characteristic.LiveDataApparentPower)
                            .onGet(async () => {
                                const value = liveData.apparentPower;
                                const info = this.disableLogInfo ? false : this.emit('info', `Live Data ${liveDataType}, apparent power: ${value} kVA`);
                                return value;
                            });
                    }
                    if (liveData.apparentPowerL1 !== 'notSupported') {
                        liveDataService.getCharacteristic(Characteristic.LiveDataApparentPowerL1)
                            .onGet(async () => {
                                const value = liveData.apparentPowerL1;
                                const info = this.disableLogInfo ? false : this.emit('info', `Live Data ${liveDataType} L1, apparent power: ${value} kVA`);
                                return value;
                            });
                    }
                    if (liveData.apparentPowerL2 !== 'notSupported') {
                        liveDataService.getCharacteristic(Characteristic.LiveDataApparentPowerL2)
                            .onGet(async () => {
                                const value = liveData.apparentPowerL2;
                                const info = this.disableLogInfo ? false : this.emit('info', `Live Data ${liveDataType} L2, apparent power: ${value} kVA`);
                                return value;
                            });
                    }
                    if (liveData.apparentPowerL3 !== 'notSupported') {
                        liveDataService.getCharacteristic(Characteristic.LiveDataApparentPowerL3)
                            .onGet(async () => {
                                const value = liveData.apparentPowerL3;
                                const info = this.disableLogInfo ? false : this.emit('info', `Live Data ${liveDataType} L3, apparent power: ${value} kVA`);
                                return value;
                            });
                    }
                    this.liveDataServices.push(liveDataService);
                }
            }

            return accessory;
        } catch (error) {
            throw new Error(`Prepare accessory error: ${error}`)
        }
    }

    //start
    async start() {
        const debug = this.enableDebugMode ? this.emit('debug', `Start`) : false;
        try {
            //get pv info
            const getInfo = await this.getInfo();
            if (!getInfo) {
                return null;
            }
            const firmware7xx = this.feature.info.firmware7xx;

            //get and validate JWT token
            const tokenValid = firmware7xx ? await this.checkJwtToken(true) : true;
            if (firmware7xx && !tokenValid) {
                return null;
            }

            //calculate envoy and installer passwords for FW < 7.0.0
            const digestAuthorizationEnvoy = !firmware7xx ? await this.digestAuthorizationEnvoy() : false;
            const digestAuthorizationInstaller = !firmware7xx ? await this.digestAuthorizationInstaller() : false;

            //get home, inventory and pcu status
            const refreshHome = await this.updateHome();
            const updateInventory = refreshHome ? await this.updateInventory() : false;
            const updatePcuStatus = updateInventory && (firmware7xx || digestAuthorizationEnvoy) ? await this.updatePcuStatus() : false;
            const updateDeviceData = updateInventory ? await this.updateDeviceData(true) : false;

            //get meters
            const refreshMeters = this.feature.meters.supported ? await this.updateMeters() : false;
            const updateMetersReading = this.feature.meters.installed ? await this.updateMetersReading() : false;

            //get production
            const refreshProduction = this.feature.info.firmware < 824 ? await this.updateProduction() : false;

            //get production and energy pdm ab FW. 8.2.4xx
            const refreshProductionPdm = this.feature.info.firmware >= 824 ? await this.updateProductionPdm() : false;
            const updateEnergyPdm = refreshProductionPdm ? await this.updateEnergyPdm() : false;

            //get production ct
            const refreshProductionCt = this.feature.inventory.acbs.installed || this.feature.meters.installed ? await this.updateProductionCt() : false;

            //get production all
            const refreshProductionAll = await this.updateProductionAll();

            //get ensemble data ab FW. >= 7.x.x.
            const refreshEnsemble = firmware7xx && this.feature.inventory.esubs.supported ? await this.updateEnsembleInventory() : false;
            const updateEnsembleStatus = refreshEnsemble && this.feature.ensemble.installed ? await this.updateEnsembleStatus() : false;
            const updateEnchargeSettings = refreshEnsemble && this.feature.encharges.installed ? await this.updateEnchargesSettings() : false;
            const updateTariffSettings = updateEnchargeSettings ? await this.updateTariff() : false;
            const updaateDryContacts = refreshEnsemble && this.feature.enpowers.installed ? await this.updateDryContacts() : false;
            const updateDryContactsSettings = updaateDryContacts ? await this.updateDryContactsSettings() : false;
            const updateGenerator = refreshEnsemble ? await this.updateGenerator() : false;
            const updateGeneratorSettings = updateGenerator ? await this.updateGeneratorSettings() : false;

            //get live data ab FW. >= 7.x.x
            const refreshLiveData = firmware7xx ? await this.updateLiveData() : false;

            //get grid profile ab FW. >= 7.x.x.
            const refreshGridProfile = firmware7xx ? await this.updateGridProfile(true) : false;

            //get plc communication level
            const refreshPlcLevel = (firmware7xx && this.feature.info.jwtToken.installer) || digestAuthorizationInstaller ? await this.updatePlcLevel(true) : false;

            //get envoy dev id
            const envoyDevIdValid = (firmware7xx && this.feature.info.jwtToken.installer) || digestAuthorizationInstaller ? await this.getEnvoyDevId() : false;

            //get production state
            const refreshProductionState = envoyDevIdValid ? await this.updateProductionState(true) : false;

            //connect to deice success
            this.emit('success', `Connect Success`)

            //get device info
            const logDeviceInfo = !this.disableLogDeviceInfo ? await this.getDeviceInfo() : false;

            //start external integrations
            const startExternalIntegrations = this.restFul.enable || this.mqtt.enable ? await this.externalIntegrations() : false;

            //prepare accessory
            const accessory = this.startPrepareAccessory ? await this.prepareAccessory() : false;
            const publishAccessory = this.startPrepareAccessory ? this.emit('publishAccessory', accessory) : false;
            this.startPrepareAccessory = false;

            //create timers
            this.timers = [];
            const pushTimer = refreshHome ? this.timers.push({ name: 'updateHomeInventoryAndPcuStatus', sampling: 120000 }) : false;
            const pushTimer1 = refreshProductionAll ? this.timers.push({ name: 'updateProduction', sampling: this.productionDataRefreshTime }) : false;
            const pushTimer2 = refreshEnsemble ? this.timers.push({ name: 'updateEnsemble', sampling: this.ensembleDataRefreshTime }) : false;
            const pushTimer3 = refreshLiveData ? this.timers.push({ name: 'updateLiveData', sampling: this.liveDataRefreshTime }) : false;
            const pushTimer4 = refreshGridProfile || refreshPlcLevel || refreshProductionState ? this.timers.push({ name: 'updateGridPlcAndProductionState', sampling: 30000 }) : false;

            return true;
        } catch (error) {
            throw new Error(`Start error: ${error}`);
        }
    }
}
export default EnvoyDevice;
