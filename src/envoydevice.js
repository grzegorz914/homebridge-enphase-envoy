"use strict";
const fs = require('fs');
const fsPromises = fs.promises;
const https = require('https');
const axios = require('axios');
const { XMLParser, XMLBuilder, XMLValidator } = require('fast-xml-parser');
const EventEmitter = require('events');
const RestFul = require('./restful.js');
const Mqtt = require('./mqtt.js');
const EnvoyToken = require('./envoytoken.js');
const DigestAuth = require('./digestauth.js');
const PasswdCalc = require('./passwdcalc.js');
const ImpulseGenerator = require('./impulsegenerator.js');
const CONSTANTS = require('./constants.json');
let Accessory, Characteristic, Service, Categories, AccessoryUUID;

class EnvoyDevice extends EventEmitter {
    constructor(api, deviceName, host, envoyFirmware7xx, envoyFirmware7xxTokenGenerationMode, envoyPasswd, envoyToken, envoySerialNumber, enlightenUser, enlightenPasswd, envoyIdFile, envoyTokenFile, envoyInstallerPasswordFile, device) {
        super();

        Accessory = api.platformAccessory;
        Characteristic = api.hap.Characteristic;
        Service = api.hap.Service;
        Categories = api.hap.Categories;
        AccessoryUUID = api.hap.uuid;

        //device configuration
        this.name = deviceName;
        this.host = host;
        this.envoyFirmware7xx = envoyFirmware7xx;
        this.envoyFirmware7xxTokenGenerationMode = envoyFirmware7xxTokenGenerationMode;
        this.envoyPasswd = envoyPasswd;
        this.envoyToken = envoyToken;
        this.envoySerialNumber = envoySerialNumber;
        this.enlightenUser = enlightenUser;
        this.enlightenPassword = enlightenPasswd;

        this.supportProductionPowerMode = device.supportProductionPowerMode || false;
        this.powerProductionControl = device.powerProductionControl || {};

        this.supportPlcLevel = device.supportPlcLevel || false;
        this.plcLevelControl = device.plcLevelControl || {};

        this.powerProductionSummary = device.powerProductionSummary || 0;
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

        this.enpowerGridStateControl = device.enpowerGridStateControl || {};
        this.enpowerGridStateSensor = device.enpowerGridStateSensor || {};
        this.enpowerGridModeSensors = device.enpowerGridModeSensors || [];

        this.enchargeProfileSelfConsumptionControl = device.enchargeProfileSelfConsumptionControl || {};
        this.enchargeProfileSavingsControl = device.enchargeProfileSavingsControl || {};
        this.enchargeProfileFullBackupControl = device.enchargeProfileFullBackupControl || {};
        this.enchargeGridModeSensors = this.envoyFirmware7xx ? device.enchargeGridModeSensors || [] : [];
        this.enchargeBackupLevelSensors = this.envoyFirmware7xx ? device.enchargeBackupLevelSensors || [] : [];

        this.solarGridModeSensors = device.solarGridModeSensors || [];

        this.enpowerDryContactsControl = device.enpowerDryContactsControl || false;
        this.enpowerDryContactsSensors = device.enpowerDryContactsSensors || false;

        this.generatorStateControl = device.generatorStateControl || {};
        this.generatorStateSensor = device.generatorStateSensor || {};
        this.generatorModeSensors = device.generatorModeSensors || [];

        this.dataRefreshControl = device.dataRefreshControl || {};
        this.dataRefreshSensor = device.dataRefreshSensor || {};
        this.metersDataRefreshTime = device.metersDataRefreshTime * 1000 || 2000;
        this.productionDataRefreshTime = device.productionDataRefreshTime * 1000 || 5000;
        this.liveDataRefreshTime = device.liveDataRefreshTime * 1000 || 2000;
        this.ensembleDataRefreshTime = device.ensembleDataRefreshTime * 1000 || 15000;

        this.enableDebugMode = device.enableDebugMode || false;
        this.disableLogInfo = device.disableLogInfo || false;
        this.disableLogDeviceInfo = device.disableLogDeviceInfo || false;

        //active sensors 
        //power production control
        const powerProductionControlName = this.powerProductionControl.name || false;
        const powerProductionControlDisplayType = this.powerProductionControl.displayType ?? 0;
        this.powerProductionControlActiveSensors = [];
        if (powerProductionControlName && powerProductionControlDisplayType > 0) {
            const tile = {};
            tile.name = powerProductionControlName;
            tile.namePrefix = this.powerProductionStateSensor.namePrefix;
            tile.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][powerProductionControlDisplayType];
            tile.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][powerProductionControlDisplayType];
            tile.state = false;
            this.powerProductionControlActiveSensors.push(tile);
        } else {
            const log = powerProductionControlDisplayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
        };
        this.powerProductionControlActiveSensorsCount = this.supportProductionPowerMode ? this.powerProductionControlActiveSensors.length || 0 : 0;

        //plc level control
        const plcLevelControlName = this.plcLevelControl.name || false;
        const plcLevelControlDisplayType = this.plcLevelControl.displayType ?? 0;
        this.plcLevelControlActiveSensors = [];
        if (plcLevelControlName && plcLevelControlDisplayType > 0) {
            const tile = {};
            tile.name = plcLevelControlName;
            tile.namePrefix = this.plcLevelStateSensor.namePrefix;
            tile.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][plcLevelControlDisplayType];
            tile.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][plcLevelControlDisplayType];
            tile.state = false;
            this.plcLevelControlActiveSensors.push(tile);
        } else {
            const log = plcLevelControlDisplayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
        };
        this.plcLevelControlActiveSensorsCount = this.supportProductionPowerMode ? this.plcLevelControlActiveSensors.length || 0 : 0;

        //data refresh control
        const dataRefreshControlName = this.dataRefreshControl.name || false;
        const dataRefreshControlDisplayType = this.dataRefreshControl.displayType ?? 0;
        this.dataRefreshActiveControls = [];
        if (dataRefreshControlName && dataRefreshControlDisplayType > 0) {
            const tile = {};
            tile.name = dataRefreshControlName;
            tile.namePrefix = this.dataRefreshControl.namePrefix;
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][dataRefreshControlDisplayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][dataRefreshControlDisplayType];
            tile.state = false;
            this.dataRefreshActiveControls.push(tile);
        } else {
            const log = dataRefreshControlDisplayType === 0 ? false : this.emit('message', `Tile Name Missing.`);
        };
        this.dataRefreshActiveControlsCount = this.dataRefreshActiveControls.length || 0;

        //data refresh sensor
        const dataRefreshSensorName = this.dataRefreshSensor.name || false;
        const dataRefreshSensorDisplayType = this.dataRefreshSensor.displayType ?? 0;
        this.dataRefreshActiveSensors = [];
        if (dataRefreshSensorName && dataRefreshSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = dataRefreshSensorName;
            sensor.namePrefix = this.dataRefreshSensor.namePrefix;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][dataRefreshSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][dataRefreshSensorDisplayType];
            sensor.state = false;
            this.dataRefreshActiveSensors.push(sensor);
        } else {
            const log = dataRefreshSensorDisplayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
        };
        this.dataRefreshActiveSensorsCount = this.dataRefreshActiveSensors.length || 0;

        //power production state sensor
        const powerProductionStateSensorName = this.powerProductionStateSensor.name || false;
        const powerProductionStateSensorDisplayType = this.powerProductionStateSensor.displayType ?? 0;
        this.powerProductionStateActiveSensors = [];
        if (powerProductionStateSensorName && powerProductionStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = powerProductionStateSensorName;
            sensor.namePrefix = this.powerProductionStateSensor.namePrefix;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][powerProductionStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][powerProductionStateSensorDisplayType];
            sensor.state = false;
            this.powerProductionStateActiveSensors.push(sensor);
        } else {
            const log = powerProductionStateSensorDisplayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
        };
        this.powerProductionStateActiveSensorsCount = this.powerProductionStateActiveSensors.length || 0;

        //energy production state sensor
        this.energyProductionStateActiveSensors = [];
        const energyProductionStateSensorName = this.energyProductionStateSensor.name || false;
        const energyProductionStateSensorDisplayType = this.energyProductionStateSensor.displayType ?? 0;
        if (energyProductionStateSensorName && energyProductionStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = energyProductionStateSensorName;
            sensor.namePrefix = this.energyProductionStateSensor.namePrefix;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][energyProductionStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][energyProductionStateSensorDisplayType];
            sensor.state = false;
            this.energyProductionStateActiveSensors.push(sensor);
        } else {
            const log = energyProductionStateSensorDisplayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
        };
        this.energyProductionStateActiveSensorsCount = this.energyProductionStateActiveSensors.length || 0

        //power consumption total state sensor
        const powerConsumptionTotalStateSensorName = this.powerConsumptionTotalStateSensor.name || false;
        const powerConsumptionTotalStateSensorDisplayType = this.powerConsumptionTotalStateSensor.displayType ?? 0;
        this.powerConsumptionTotalStateActiveSensors = [];
        if (powerConsumptionTotalStateSensorName && powerConsumptionTotalStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = powerConsumptionTotalStateSensorName;
            sensor.namePrefix = this.powerConsumptionTotalStateSensor.namePrefix;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][powerConsumptionTotalStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][powerConsumptionTotalStateSensorDisplayType];
            sensor.state = false;
            this.powerConsumptionTotalStateActiveSensors.push(sensor);
        } else {
            const log = powerConsumptionTotalStateSensorDisplayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
        };
        this.powerConsumptionTotalStateActiveSensorsCount = this.powerConsumptionTotalStateActiveSensors.length || 0;

        //energy consumption total state sensor
        this.energyConsumptionTotalStateActiveSensors = [];
        const energyConsumptionTotalStateSensorName = this.energyConsumptionTotalStateSensor.name || false;
        const energyConsumptionTotalStateSensorDisplayType = this.energyConsumptionTotalStateSensor.displayType ?? 0;
        if (energyConsumptionTotalStateSensorName && energyConsumptionTotalStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = energyConsumptionTotalStateSensorName;
            sensor.namePrefix = this.energyConsumptionTotalStateSensor.namePrefix;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][energyConsumptionTotalStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][energyConsumptionTotalStateSensorDisplayType];
            sensor.state = false;
            this.energyConsumptionTotalStateActiveSensors.push(sensor);
        } else {
            const log = energyConsumptionTotalStateSensorDisplayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
        };
        this.energyConsumptionTotalStateActiveSensorsCount = this.energyConsumptionTotalStateActiveSensors.length || 0

        //power consumption net state sensor
        const powerConsumptionNetStateSensorName = this.powerConsumptionNetStateSensor.name || false;
        const powerConsumptionNetStateSensorDisplayType = this.powerConsumptionNetStateSensor.displayType ?? 0;
        this.powerConsumptionNetStateActiveSensors = [];
        if (powerConsumptionNetStateSensorName && powerConsumptionNetStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = powerConsumptionNetStateSensorName;
            sensor.namePrefix = this.powerConsumptionNetStateSensor.namePrefix;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][powerConsumptionNetStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][powerConsumptionNetStateSensorDisplayType];
            sensor.state = false;
            this.powerConsumptionNetStateActiveSensors.push(sensor);
        } else {
            const log = powerConsumptionNetStateSensorDisplayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
        };
        this.powerConsumptionNetStateActiveSensorsCount = this.powerConsumptionNetStateActiveSensors.length || 0;

        //energy consumption net state sensor
        this.energyConsumptionNetStateActiveSensors = [];
        const energyConsumptionNetStateSensorName = this.energyConsumptionNetStateSensor.name || false;
        const energyConsumptionNetStateSensorDisplayType = this.energyConsumptionNetStateSensor.displayType ?? 0;
        if (energyConsumptionNetStateSensorName && energyConsumptionNetStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = energyConsumptionNetStateSensorName;
            sensor.namePrefix = this.energyConsumptionNetStateSensor.namePrefix;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][energyConsumptionNetStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][energyConsumptionNetStateSensorDisplayType];
            sensor.state = false;
            this.energyConsumptionNetStateActiveSensors.push(sensor);
        } else {
            const log = energyConsumptionNetStateSensorDisplayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
        };
        this.energyConsumptionNetStateActiveSensorsCount = this.energyConsumptionNetStateActiveSensors.length || 0

        //power production level sensors
        this.powerProductionLevelActiveSensors = [];
        for (const sensor of this.powerProductionLevelSensors) {
            const name = sensor.name ?? false;
            const powerLevel = sensor.powerLevel / 1000;
            const displayType = sensor.displayType ?? 0;
            if (!name || displayType === 0) {
                const log = displayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
                continue;
            }

            sensor.powerLevel = powerLevel;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.powerProductionLevelActiveSensors.push(sensor);
        }
        this.powerProductionLevelActiveSensorsCount = this.powerProductionLevelActiveSensors.length || 0;

        this.energyProductionLevelActiveSensors = [];
        for (const sensor of this.energyProductionLevelSensors) {
            const name = sensor.name ?? false;
            const energyLevel = sensor.energyLevel / 1000 ?? 0;
            const displayType = sensor.displayType ?? 0;
            if (!name || displayType === 0) {
                const log = displayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
                continue;
            }

            sensor.energyLevel = energyLevel;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.energyProductionLevelActiveSensors.push(sensor);
        }
        this.energyProductionLevelActiveSensorsCount = this.energyProductionLevelActiveSensors.length || 0;

        this.powerConsumptionTotalLevelActiveSensors = [];
        for (const sensor of this.powerConsumptionTotalLevelSensors) {
            const name = sensor.name ?? false;
            const powerLevel = sensor.powerLevel / 1000;
            const displayType = sensor.displayType ?? 0;
            if (!name || displayType === 0) {
                const log = displayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
                continue;
            }

            sensor.powerLevel = powerLevel;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.powerConsumptionTotalLevelActiveSensors.push(sensor);
        }
        this.powerConsumptionTotalLevelActiveSensorsCount = this.powerConsumptionTotalLevelActiveSensors.length || 0;

        this.energyConsumptionTotalLevelActiveSensors = [];
        for (const sensor of this.energyConsumptionTotalLevelSensors) {
            const name = sensor.name ?? false;
            const energyLevel = sensor.energyLevel / 1000 ?? 0;
            const displayType = sensor.displayType ?? 0;
            if (!name || displayType === 0) {
                const log = displayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
                continue;
            }

            sensor.energyLevel = energyLevel;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.energyConsumptionTotalLevelActiveSensors.push(sensor);
        }
        this.energyConsumptionTotalLevelActiveSensorsCount = this.energyConsumptionTotalLevelActiveSensors.length || 0;

        this.powerConsumptionNetLevelActiveSensors = [];
        for (const sensor of this.powerConsumptionNetLevelSensors) {
            const name = sensor.name ?? false;
            const powerLevel = sensor.powerLevel / 1000;
            const displayType = sensor.displayType ?? 0;
            if (!name || displayType === 0) {
                const log = displayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
                continue;
            }

            sensor.powerLevel = powerLevel;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.powerConsumptionNetLevelActiveSensors.push(sensor);
        }
        this.powerConsumptionNetLevelActiveSensorsCount = this.powerConsumptionNetLevelActiveSensors.length || 0;

        this.energyConsumptionNetLevelActiveSensors = [];
        for (const sensor of this.energyConsumptionNetLevelSensors) {
            const name = sensor.name ?? false;
            const energyLevel = sensor.energyLevel / 1000 ?? 0;
            const displayType = sensor.displayType ?? 0;
            if (!name || displayType === 0) {
                const log = displayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
                continue;
            }

            sensor.energyLevel = energyLevel;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.energyConsumptionNetLevelActiveSensors.push(sensor);
        }
        this.energyConsumptionNetLevelActiveSensorsCount = this.energyConsumptionNetLevelActiveSensors.length || 0;

        //enpower grid state control
        const enpowerGridStateControlName = this.enpowerGridStateControl.name || false;
        const enpowerGridStateControlDisplaqyType = this.enpowerGridStateControl.displayType ?? 0;
        this.enpowerGridStateActiveControls = [];
        if (enpowerGridStateControlName && enpowerGridStateControlDisplaqyType > 0) {
            const tile = {};
            tile.name = enpowerGridStateControlName;
            tile.namePrefix = this.enpowerGridStateControl.namePrefix;
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][enpowerGridStateControlDisplaqyType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][enpowerGridStateControlDisplaqyType];
            tile.state = false;
            this.enpowerGridStateActiveControls.push(tile);
        } else {
            const log = enpowerGridStateControlDisplaqyType === 0 ? false : this.emit('message', `Tile Name Missing.`);
        };
        this.enpowerGridStateActiveControlsCount = this.enpowerGridStateActiveControls.length || 0;

        const enpowerGridStateSensorName = this.enpowerGridStateSensor.name || false;
        const enpowerGridStateSensorDisplayType = this.enpowerGridStateSensor.displayType ?? 0;
        this.enpowerGridStateActiveSensors = [];
        if (enpowerGridStateSensorName && enpowerGridStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = dataRefreshControlName;
            sensor.namePrefix = this.enpowerGridStateSensor.namePrefix;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][enpowerGridStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][enpowerGridStateSensorDisplayType];
            sensor.state = false;
            this.enpowerGridStateActiveSensors.push(sensor);
        } else {
            const log = enpowerGridStateSensorDisplayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
        };
        this.enpowerGridStateActiveSensorsCount = this.enpowerGridStateActiveSensors.length || 0;

        this.enpowerGridModeActiveSensors = [];
        for (const sensor of this.enpowerGridModeSensors) {
            const name = sensor.name ?? false;
            const displayType = sensor.displayType ?? 0;
            if (!name || displayType === 0) {
                const log = displayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
                continue;
            }

            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.enpowerGridModeActiveSensors.push(sensor);
        }
        this.enpowerGridModeActiveSensorsCount = this.enpowerGridModeActiveSensors.length || 0;

        //encharge
        const enchargeProfileSelfConsumptionControlName = this.enchargeProfileSelfConsumptionControl.name || false;
        const enchargeProfileSelfConsumptionControlDisplayType = this.enchargeProfileSelfConsumptionControl.displayType ?? 0;
        this.enchargeProfileSelfConsumptionActiveControls = [];
        if (enchargeProfileSelfConsumptionControlName && enchargeProfileSelfConsumptionControlDisplayType > 0) {
            const tile = {};
            tile.name = enchargeProfileSelfConsumptionControlName;
            tile.namePrefix = this.enchargeProfileSelfConsumptionControl.namePrefix;
            tile.serviceType = ['', Service.Lightbulb][enchargeProfileSelfConsumptionControlDisplayType];
            tile.characteristicType = ['', Characteristic.On][enchargeProfileSelfConsumptionControlDisplayType];
            tile.state = false;
            this.enchargeProfileSelfConsumptionActiveControls.push(tile);
        } else {
            const log = enchargeProfileSelfConsumptionControlDisplayType === 0 ? false : this.emit('message', `Tile Name Missing.`);
        };
        this.enchargeProfileSelfConsumptionActiveControlsCount = this.enchargeProfileSelfConsumptionActiveControls.length || 0;

        const enchargeProfileSavingsControlName = this.enchargeProfileSavingsControl.name || false;
        const enchargeProfileSavingsControlDisplayType = this.enchargeProfileSavingsControl.displayType ?? 0;
        this.enchargeProfileSavingsActiveControls = [];
        if (enchargeProfileSavingsControlName && enchargeProfileSavingsControlDisplayType > 0) {
            const tile = {};
            tile.name = enchargeProfileSavingsControlName;
            tile.namePrefix = this.enchargeProfileSavingsControl.namePrefix;
            tile.serviceType = ['', Service.Lightbulb][enchargeProfileSavingsControlDisplayType];
            tile.characteristicType = ['', Characteristic.On][enchargeProfileSavingsControlDisplayType];
            tile.state = false;
            this.enchargeProfileSavingsActiveControls.push(tile);
        } else {
            const log = enchargeProfileSavingsControlDisplayType === 0 ? false : this.emit('message', `Tile Name Missing.`);
        };
        this.enchargeProfileSavingsActiveControlsCount = this.enchargeProfileSavingsActiveControls.length || 0;

        const enchargeProfileFullBackupControlName = this.enchargeProfileFullBackupControl.name || false;
        const enchargeProfileFullBackupControlDisplayType = this.enchargeProfileFullBackupControl.displayType ?? 0;
        this.enchargeProfileFullBackupActiveControls = [];
        if (enchargeProfileFullBackupControlName && enchargeProfileFullBackupControlDisplayType > 0) {
            const tile = {};
            tile.name = enchargeProfileFullBackupControlName;
            tile.namePrefix = this.enchargeProfileFullBackupControl.namePrefix;
            tile.serviceType = ['', Service.Switch, Service.Outlet][enchargeProfileFullBackupControlDisplayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On][enchargeProfileFullBackupControlDisplayType];
            tile.state = false;
            this.enchargeProfileFullBackupActiveControls.push(tile);
        } else {
            const log = enchargeProfileFullBackupControlDisplayType === 0 ? false : this.emit('message', `Tile Name Missing.`);
        };
        this.enchargeProfileFullBackupActiveControlsCount = this.enchargeProfileFullBackupActiveControls.length || 0;

        this.enchargeGridModeActiveSensors = [];
        for (const sensor of this.enchargeGridModeSensors) {
            const name = sensor.name ?? false;
            const displayType = sensor.displayType ?? 0;
            if (!name || displayType === 0) {
                const log = displayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
                continue;
            }

            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.enchargeGridModeActiveSensors.push(sensor);
        }
        this.enchargeGridModeActiveSensorsCount = this.enchargeGridModeActiveSensors.length || 0;

        this.enchargeBackupLevelActiveSensors = [];
        for (const sensor of this.enchargeBackupLevelSensors) {
            const name = sensor.name ?? false;
            const backupLevel = sensor.backupLevel ?? 0;
            const compareMode = sensor.compareMode ?? 0;
            const displayType = sensor.displayType ?? 0;
            if (!name || displayType === 0) {
                const log = displayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
                continue;
            }

            sensor.backupLevel = backupLevel;
            sensor.compareMode = compareMode;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.enchargeBackupLevelActiveSensors.push(sensor);
        }
        this.enchargeBackupLevelActiveSensorsCount = this.enchargeBackupLevelActiveSensors.length || 0;

        //solar
        this.solarGridModeActiveSensors = [];
        for (const sensor of this.solarGridModeSensors) {
            const name = sensor.name ?? false;
            const displayType = sensor.displayType ?? 0;
            if (!name || displayType === 0) {
                const log = displayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
                continue;
            }

            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.solarGridModeActiveSensors.push(sensor);
        }
        this.solarGridModeActiveSensorsCount = this.solarGridModeActiveSensors.length || 0;

        //generator
        const generatorStateControlName = this.generatorStateControl.name || false;
        const generatorStateControlDisplaqyType = this.generatorStateControl.displayType ?? 0;
        this.generatorStateActiveControls = [];
        if (generatorStateControlName && generatorStateControlDisplaqyType > 0) {
            const tile = {};
            tile.name = generatorStateControlName;
            tile.namePrefix = this.generatorStateControl.namePrefix;
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][generatorStateControlDisplaqyType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][generatorStateControlDisplaqyType];
            tile.state = false;
            this.generatorStateActiveControls.push(tile);
        } else {
            const log = generatorStateControlDisplaqyType === 0 ? false : this.emit('message', `Tile Name Missing.`);
        };
        this.generatorStateActiveControlsCount = this.generatorStateActiveControls.length || 0;

        const generatorStateSensorName = this.generatorStateSensor.name || false;
        const generatorStateSensorDisplayType = this.generatorStateSensor.displayType ?? 0;
        this.generatorStateActiveSensors = [];
        if (generatorStateSensorName && generatorStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = generatorStateSensorName;
            sensor.namePrefix = this.generatorStateSensor.namePrefix;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][generatorStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][generatorStateSensorDisplayType];
            sensor.state = false;
            this.generatorStateActiveSensors.push(sensor);
        } else {
            const log = generatorStateSensorDisplayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
        };
        this.generatorStateActiveSensorsCount = this.generatorStateActiveSensors.length || 0;

        this.generatorModeActiveSensors = [];
        for (const sensor of this.generatorModeSensors) {
            const name = sensor.name ?? false;
            const displayType = sensor.displayType ?? 0;
            if (!name || displayType === 0) {
                const log = displayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
                continue;
            }

            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][displayType];
            sensor.state = false;
            this.generatorModeActiveSensors.push(sensor);
        }
        this.generatorModeActiveSensorsCount = this.generatorModeActiveSensors.length || 0;

        //setup variables
        this.envoyIdFile = envoyIdFile;
        this.envoyTokenFile = envoyTokenFile;
        this.envoyInstallerPasswordFile = envoyInstallerPasswordFile;
        this.startPrepareAccessory = true;

        //jwt token
        this.jwtToken = {
            generation_time: 0,
            token: envoyToken,
            expires_at: 0,
        };

        //supported functions
        this.feature = {
            envoy: {
                installed: false
            },
            wirelessConnectionKit: {
                supported: false,
                installed: false,
                count: 0
            },
            microinverters: {
                supported: false,
                installed: false,
                count: 0
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
                storage: {
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
            productionPowerMode: {
                supported: false
            },
            ensembles: {
                supported: false,
                installed: false,
                count: 0,
                status: {
                    supported: false
                },
                inventory: {
                    installed: false
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
                supported: false,
                installed: false,
            },
            commLevel: {
                supported: false,
                installed: false
            }
        }

        //pv object
        this.pv = {
            envoy: {},
            home: {},
            wirelessConnektions: [],
            microinverters: [],
            qRelays: [],
            acBatteries: {
                devices: [],
                summary: {}
            },
            ensembles: [],
            meters: [],
            production: {
                microinverters: {},
                ct: {}
            },
            consumptions: [],
            liveData: {
                devices: [],
                task: {},
                counters: {},
                dryContacts: {}
            },
            arfProfile: {
                name: 'Undefined',
                id: 0,
                version: '',
                itemCount: 0
            },
            productionState: false,
            productionEnergyState: false,
            productionPowerMode: false
        };

        this.ensemble = {
            enpowers: {
                devices: [
                    {
                        status: {}
                    }
                ]
            },
            encharges: {
                devices: [],
                status: {},
                settings: {}
            },
            counters: {},
            secctrl: {},
            relay: {},
            dryContacts: [],
            generator: {},
            tariff: {},
            arfProfile: {
                name: 'Undefined',
                id: 0,
                version: '',
                itemCount: 0
            },
            enchargesPercentFullSum: 0,
            enchargesRatedPowerSum: 0,
            enchargesEnergyState: false
        };

        //envoy
        this.envoyDevId = '';

        //url
        this.url = this.envoyFirmware7xx ? `https://${this.host}` : `http://${this.host}`;

        //create axios instance
        this.axiosInstance = axios.create({
            method: 'GET',
            baseURL: this.url,
            withCredentials: true,
            headers: {
                Accept: 'application/json'
            }
        });

        //RESTFul server
        this.restFulConnected = false;
        const restFulEnabled = device.restFul.enable || false;
        if (restFulEnabled) {
            this.restFul = new RestFul({
                port: device.restFul.port || 3000,
                debug: device.restFul.debug || false
            });

            this.restFul.on('connected', (message) => {
                this.restFulConnected = true;
                this.emit('message', message);
            })
                .on('error', (error) => {
                    this.emit('error', error);
                })
                .on('debug', (debug) => {
                    this.emit('debug', debug);
                });
        }

        //mqtt client
        this.mqttConnected = false;
        const mqttEnabled = device.mqtt.enable || false;
        if (mqttEnabled) {
            this.mqtt = new Mqtt({
                host: device.mqtt.host,
                port: device.mqtt.port || 1883,
                clientId: device.mqtt.clientId || `envoy_${Math.random().toString(16).slice(3)}`,
                prefix: `${device.mqtt.prefix}/${device.name}`,
                user: device.mqtt.user,
                passwd: device.mqtt.passwd,
                debug: device.mqtt.debug || false
            });

            this.mqtt.on('connected', (message) => {
                this.mqttConnected = true;
                this.emit('message', message);
            })
                .on('subscribed', (message) => {
                    this.emit('message', message);
                })
                .on('subscribedMessage', async (key, value) => {
                    try {
                        switch (key) {
                            case 'ProductionPowerMode':
                                const set = this.feature.productionPowerMode.supported ? await this.setProductionPowerMode(value) : false;
                                break;
                            case 'PlcLevel':
                                const set1 = this.feature.commLevel.supported ? await this.updatePlcLevelData(value) : false;
                                break;
                            case 'EnchargeProfile':
                                switch (value) {
                                    case 'selfconsumption':
                                        await this.setEnchargeProfile('self-consumption', this.ensemble.encharges.settings.reservedSoc, this.ensemble.encharges.settings.chargeFromGrid);
                                        break;
                                    case 'savings':
                                        await this.setEnchargeProfile('savings-mode', this.ensemble.encharges.settings.reservedSoc, this.ensemble.encharges.settings.chargeFromGrid);
                                        break;
                                    case 'fullbackup':
                                        await this.setEnchargeProfile('backup', 100, this.ensemble.encharges.settings.chargeFromGrid);
                                        break;
                                };
                                break;
                            default:
                                this.emit('message', `MQTT Received unknown key: ${key}, value: ${value}`);
                                break;
                        };
                    } catch (error) {
                        this.emit('error', `set: ${key}, over MQTT, error: ${error}`);
                    };
                })
                .on('debug', (debug) => {
                    this.emit('debug', debug);
                })
                .on('error', (error) => {
                    this.emit('error', error);
                });
        };

        //start update data
        this.impulseGenerator = new ImpulseGenerator();
        this.impulseGenerator.on('updateHome', async () => {
            try {
                const tokenExpired = await this.checkJwtToken();
                const updateHome = tokenExpired ? false : await this.updateHomeData();
                const updateInventory = updateHome ? await this.updateInventoryData() : false;
            } catch (error) {
                this.emit('error', `Update home error: ${error}`);
            };
        }).on('updateMeters', async () => {
            try {
                const tokenExpired = await this.checkJwtToken();
                const updateMeters = tokenExpired ? false : await this.updateMetersData();
                const updateMetersReading = updateMeters ? await this.updateMetersReadingData() : false;
            } catch (error) {
                this.emit('error', `Update meters error: ${error}`);
            };
        }).on('updateMicroinverters', async () => {
            try {
                const tokenExpired = await this.checkJwtToken();
                const updateMicroinverters = tokenExpired ? false : await this.updateMicroinvertersData();
            } catch (error) {
                this.emit('error', `Update microinverters error: ${error}`);
            };
        }).on('updateProduction', async () => {
            try {
                const tokenExpired = await this.checkJwtToken();
                const updateProduction = tokenExpired ? false : await this.updateProductionData();
                const updateProductionCt = updateProduction ? await this.updateProductionCtData() : false;
            } catch (error) {
                this.emit('error', `Update production error: ${error}`);
            };
        }).on('updateEnsemble', async () => {
            try {
                const tokenExpired = await this.checkJwtToken();
                const updateEnsemble = tokenExpired ? false : await this.updateEnsembleInventoryData();
                const updateEnsembleStatus = updateEnsemble ? await this.updateEnsembleStatusData() : false;
                const updateEnchargeSettings = updateEnsemble ? await this.updateEnchargeSettingsData() : false;
                const updateTariffSettings = updateEnsemble ? await this.updateTariffData() : false;
                const updateDryContacts = updateEnsemble ? await this.updateDryContactsData() : false;
                const updateDryContactsSettings = updateDryContacts ? await this.updateDryContactsSettingsData() : false;
                const updateGenerator = updateEnsemble ? await this.updateGeneratorData() : false;
                const updateGeneratorSettings = updateGenerator ? await this.updateGeneratorSettingsData() : false;
            } catch (error) {
                this.emit('error', `Update ensemble error: ${error}`);
            };
        }).on('updateLiveData', async () => {
            try {
                const tokenExpired = await this.checkJwtToken();
                const updateLiveData = tokenExpired ? false : await this.updateLiveData();
            } catch (error) {
                this.emit('error', `Update live data error: ${error}`);
            };
        }).on('state', (state) => {
            if (this.dataRefreshActiveControlsCount > 0) {
                for (let i = 0; i < this.dataRefreshActiveControlsCount; i++) {
                    this.dataRefreshActiveControls[i].state = state;

                    if (this.dataRefreshControlsServices) {
                        const characteristicType = this.dataRefreshActiveControls[i].characteristicType;
                        this.dataRefreshControlsServices[i]
                            .updateCharacteristic(characteristicType, state)
                    }
                }

                if (this.envoyService) {
                    this.envoyService
                        .updateCharacteristic(Characteristic.enphaseEnvoyDataRefresh, state)
                }
            }

            if (this.dataRefreshActiveSensorsCount > 0) {
                for (let i = 0; i < this.dataRefreshActiveSensorsCount; i++) {
                    this.dataRefreshActiveSensors[i].state = state;

                    if (this.dataRefreshSensorsServices) {
                        const characteristicType = this.dataRefreshActiveSensors[i].characteristicType;
                        this.dataRefreshSensorsServices[i]
                            .updateCharacteristic(characteristicType, state)
                    }
                }
            }
        });

        this.start();
    }

    async start() {
        const debug = this.enableDebugMode ? this.emit('debug', `Start.`) : false;

        try {
            //create timers array
            this.timers = [];

            //get and validate jwt token
            const getJwtToken = this.envoyFirmware7xx ? this.envoyFirmware7xxTokenGenerationMode === 0 ? await this.getJwtToken() : true : false;
            const validJwtToken = getJwtToken ? await this.validateJwtToken() : false;
            const updateGridProfileData = validJwtToken ? await this.updateGridProfileData() : false;

            //get envoy dev id
            const envoyDevIdExist = this.supportProductionPowerMode ? await this.getEnvoyBackboneAppData() : false;

            //get envoy info and inventory data
            await this.updateInfoData();
            const updateHome = await this.updateHomeData();
            const updateInventory = updateHome ? await this.updateInventoryData() : false;
            const updateMeters = this.feature.meters.supported ? await this.updateMetersData() : false;
            const updateMetersReading = updateMeters ? await this.updateMetersReadingData() : false;

            //acces with envoy password
            const calculateEnvoyPassword = !this.envoyFirmware7xx ? await this.calculateEnvoyPassword() : false;
            const updateMicroinverters = validJwtToken || calculateEnvoyPassword ? await this.updateMicroinvertersData() : false;

            //get production and inverters data
            const updateProduction = await this.updateProductionData();
            const updateProductionCt = updateProduction ? await this.updateProductionCtData() : false;

            //access with installer password
            const calculateInstallerPassword = !this.envoyFirmware7xx ? await this.calculateInstallerPassword() : false;
            const updateProductionPowerMode = envoyDevIdExist && (validJwtToken || calculateInstallerPassword) ? await this.updateProductionPowerModeData() : false;

            //get ensemble data only FW. >= 7.x.x.
            const updateEnsemble = validJwtToken ? await this.updateEnsembleInventoryData() : false;
            const updateEnsembleStatus = updateEnsemble ? await this.updateEnsembleStatusData() : false;
            const updateDryContacts = updateEnsemble ? await this.updateDryContactsData() : false;
            const updateDryContactsSettings = updateDryContacts ? await this.updateDryContactsSettingsData() : false;
            const updateGenerator = updateEnsemble ? await this.updateGeneratorData() : false;
            const updateGeneratorSettings = updateGenerator ? await this.updateGeneratorSettingsData() : false;
            const updateLiveData = validJwtToken ? await this.updateLiveData() : false;

            //get plc communication level
            const updatePlcLevel = this.supportPlcLevel && (validJwtToken || calculateInstallerPassword) ? await this.updatePlcLevelData() : false;

            //get device info
            const logDeviceInfo = !this.disableLogDeviceInfo ? this.getDeviceInfo() : false;

            //prepare accessory
            const accessory = this.startPrepareAccessory ? await this.prepareAccessory() : false;
            const publishAccessory = this.startPrepareAccessory ? this.emit('publishAccessory', accessory) : false;
            this.startPrepareAccessory = false;

            if (this.startPrepareAccessory) {
                return;
            }

            //create timers and start impulse generator
            const pushTimer0 = updateHome ? this.timers.push({ timerName: 'updateHome', sampling: 60000 }) : false;
            const pushTimer1 = updateMeters ? this.timers.push({ timerName: 'updateMeters', sampling: this.metersDataRefreshTime }) : false;
            const pushTimer3 = updateMicroinverters ? this.timers.push({ timerName: 'updateMicroinverters', sampling: 80000 }) : false;
            const pushTimer2 = updateProduction ? this.timers.push({ timerName: 'updateProduction', sampling: this.productionDataRefreshTime }) : false;
            const pushTimer4 = updateEnsemble ? this.timers.push({ timerName: 'updateEnsemble', sampling: this.ensembleDataRefreshTime }) : false;
            const pushTimer5 = updateLiveData ? this.timers.push({ timerName: 'updateLiveData', sampling: this.liveDataRefreshTime }) : false;
            this.impulseGenerator.start(this.timers);
        } catch (error) {
            this.emit('errorStart', `Start error: ${error}`);
        };
    };

    checkJwtToken() {
        return new Promise((resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting check JWT token.`) : false;

            try {
                const tokenExpired = this.envoyFirmware7xx ? this.envoyFirmware7xxTokenGenerationMode === 0 ? (Math.floor(new Date().getTime() / 1000) > this.jwtToken.expires_at) : false : false;
                const refreshToken = tokenExpired ? this.emit('tokenExpired', `JWT token expired, refreshing.`) : false;
                resolve(tokenExpired);
            } catch (error) {
                reject(`Requesting check JWT token error: ${error}`);
            };
        });
    };

    getJwtToken() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting JWT token.`) : false;

            try {
                const envoyToken = new EnvoyToken({
                    user: this.enlightenUser,
                    passwd: this.enlightenPassword,
                    serialNumber: this.envoySerialNumber,
                    tokenFile: this.envoyTokenFile
                });

                const tokenData = await envoyToken.checkToken();
                const updatedTokenData = {
                    ...tokenData,
                    token: 'removed'
                };
                const debug = this.enableDebugMode ? this.emit('debug', `JWT token: ${JSON.stringify(updatedTokenData, null, 2)}`) : false;
                this.jwtToken = tokenData;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('token', tokenData) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Token', tokenData) : false;

                resolve(true);
            } catch (error) {
                reject(`Requesting JWT token error: ${error}`);
            };
        });
    };

    validateJwtToken() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting validate JWT token.`) : false;

            try {
                const axiosInstanceToken = axios.create({
                    method: 'GET',
                    baseURL: this.url,
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${this.jwtToken.token}`
                    },
                    withCredentials: true,
                    httpsAgent: new https.Agent({
                        keepAlive: false,
                        rejectUnauthorized: false
                    })
                });

                const jwtTokenData = await axiosInstanceToken(CONSTANTS.ApiUrls.CheckJwt);
                const debug = this.enableDebugMode ? this.emit('debug', `JWT token: Valid`) : false;
                const cookie = jwtTokenData.headers['set-cookie'];

                //create axios instance get with cookie
                this.axiosInstance = axios.create({
                    method: 'GET',
                    baseURL: this.url,
                    headers: {
                        Accept: 'application/json',
                        Cookie: cookie
                    },
                    withCredentials: true,
                    httpsAgent: new https.Agent({
                        keepAlive: false,
                        rejectUnauthorized: false
                    })
                });

                this.cookie = cookie;
                resolve(true);
            } catch (error) {
                reject(`Requeating validate JWT token error: ${error}`);
            };
        });
    };

    updateGridProfileData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting grid profile.`) : false;

            try {
                const profileData = await this.axiosInstance(CONSTANTS.ApiUrls.Profile);
                const profile = profileData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Grid profile: ${JSON.stringify(profile, null, 2)}`) : false;

                //arf profile
                this.pv.arfProfile.name = (profile.name).substring(0, 64) ?? 'Unknown';
                this.pv.arfProfile.id = profile.id ?? 0;
                this.pv.arfProfile.version = profile.version ?? '';
                this.pv.arfProfile.itemCount = profile.item_count ?? 0;
                this.ensemble.arfProfile = this.pv.arfProfile;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('gridprofile', profile) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Grid Profile', profile) : false;
                resolve(this.pv.arfProfile);
            } catch (error) {
                resolve(this.pv.arfProfile);
            };
        });
    };

    getEnvoyBackboneAppData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting envoy backbone app.`) : false;

            try {
                // Check if the envoy ID is stored
                const savedEnvoyId = await fsPromises.readFile(this.envoyIdFile);
                const debug = this.enableDebugMode ? this.emit('debug', `Envoy dev Id from file: ${savedEnvoyId}`) : false;
                const envoyId = savedEnvoyId.toString();

                // Check if the envoy ID is correct length
                if (envoyId.length === 9) {
                    this.envoyDevId = envoyId;
                    resolve(true);
                    return;
                }

                try {
                    const envoyBackboneAppData = await this.axiosInstance(CONSTANTS.ApiUrls.BackboneApplication);
                    const envoyBackboneApp = envoyBackboneAppData.data;
                    const debug = this.enableDebugMode ? this.emit('debug', `Envoy backbone app: ${envoyBackboneApp}`) : false;

                    //backbone data
                    const keyword = 'envoyDevId:';
                    const startIndex = envoyBackboneApp.indexOf(keyword);

                    //check envoy dev Id exist
                    if (startIndex === -1) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Envoy dev Id not found in backbone app.`) : false;
                        resolve(false);
                        return;
                    }

                    const substringStartIndex = startIndex + keyword.length;
                    const envoyDevId = envoyBackboneApp.substr(substringStartIndex, 9);
                    const debug1 = this.enableDebugMode ? this.emit('debug', `Envoy dev Id from device: ${envoyDevId}`) : false;

                    try {
                        await fsPromises.writeFile(this.envoyIdFile, envoyDevId);
                        this.envoyDevId = envoyDevId;
                        resolve(true);
                    } catch (error) {
                        reject(`Save envoy dev Id error: ${error}.`);
                    };
                } catch (error) {
                    reject(`Get backbone app error: ${error}.`);
                };
            } catch (error) {
                reject(`Requesting envoy dev Id from file error: ${error}.`);
            };
        });
    };

    updateInfoData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting info.`) : false;

            try {
                const infoData = await this.axiosInstance(CONSTANTS.ApiUrls.GetInfo);
                const info = infoData.data;
                const debug = this.enableDebugMode ? this.emit('debug', `Info: ${JSON.stringify(info, null, 2)}`) : false;

                //parse info
                const options = {
                    ignoreAttributes: false,
                    ignorePiTags: true,
                    allowBooleanAttributes: true
                };
                const parseString = new XMLParser(options);
                const parseInfoData = parseString.parse(info) ?? {};
                const debug1 = this.enableDebugMode ? this.emit('debug', `Parsed info: ${JSON.stringify(parseInfoData, null, 2)}`) : false;

                //envoy info
                const envoyInfo = parseInfoData.envoy_info;
                const envoyKeys = Object.keys(envoyInfo);

                //device
                const envoyInfoDevice = envoyInfo.device;
                const envoy = {
                    time: new Date(envoyInfo.time * 1000).toLocaleString(),
                    serialNumber: this.envoySerialNumber ? this.envoySerialNumber : envoyInfoDevice.sn.toString(),
                    partNumber: CONSTANTS.PartNumbers[envoyInfoDevice.pn] ?? envoyInfoDevice.pn,
                    software: envoyInfoDevice.software,
                    euaid: envoyInfoDevice.euaid,
                    seqNum: envoyInfoDevice.seqnum,
                    apiVer: envoyInfoDevice.apiver,
                    imeter: envoyInfoDevice.imeter === true ?? false,
                    webTokens: envoyKeys.includes('web-tokens') ? envoyInfo['web-tokens'] === true : false,
                    packages: [],
                    buildInfo: {}
                };

                //packages
                const envoyInfoPackages = envoyInfo.package;
                for (const devPackage of envoyInfoPackages) {
                    const infoPackage = {
                        packagePn: devPackage.pn,
                        packageVersion: devPackage.version,
                        packageBuild: devPackage.build,
                        packageName: devPackage.name,
                    }
                    envoy.packages.push(infoPackage);
                };

                //build info
                const envoyInfoBuildInfo = envoyInfo.build_info;
                envoy.buildInfo = {
                    buildId: envoyInfoBuildInfo.build_id,
                    buildTimeQmt: new Date(envoyInfoBuildInfo.build_time_gmt * 1000).toLocaleString(),
                    releaseVer: envoyInfoBuildInfo.release_ver ?? 'Unknown',
                    releaseStage: envoyInfoBuildInfo.release_stage ?? 'Unknown'
                };

                //check serial number
                if (!envoy.serialNumber) {
                    reject(`Envoy serial number missing: ${serialNumber}.`);
                    return;
                };

                //add envoy to pv object
                this.pv.envoy = envoy;

                //envoy installed and meters supported
                this.feature.envoy.installed = true;
                this.feature.meters.supported = envoy.imeter;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('info', parseInfoData) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Info', parseInfoData) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting info error: ${error}.`);
            };
        })
    };

    calculateEnvoyPassword() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting calculate envoy passwords.`) : false;

            try {
                //envoy password
                const deviceSn = this.pv.envoy.serialNumber;
                const envoyPasswd = this.envoyPasswd ? this.envoyPasswd : deviceSn.substring(6);
                const debug2 = this.enableDebugMode ? this.emit('debug', `Envoy password: Removed`) : false;

                //digest authorization envoy
                this.digestAuthEnvoy = new DigestAuth({
                    user: CONSTANTS.Authorization.EnvoyUser,
                    passwd: envoyPasswd
                });

                resolve(true)
            } catch (error) {
                reject(`Envoy password error: ${error}.`);
            };
        });
    };

    calculateInstallerPassword() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting installer passwords.`) : false;

            // Check if the envoy installer password is stored
            try {
                const savedInstallerPasswd = await fsPromises.readFile(this.envoyInstallerPasswordFile);
                const debug3 = this.enableDebugMode ? this.emit('debug', `Saved installer password: Removed`) : false;
                let installerPasswd = savedInstallerPasswd.toString();

                // Check if the envoy installer password is correct
                if (installerPasswd === '0') {
                    try {
                        //calculate installer password
                        const passwdCalc = new PasswdCalc({
                            user: CONSTANTS.Authorization.InstallerUser,
                            realm: CONSTANTS.Authorization.Realm,
                            serialNumber: deviceSn
                        });
                        installerPasswd = await passwdCalc.getPasswd();
                        const debug3 = this.enableDebugMode ? this.emit('debug', `Calculated installer password: Removed`) : false;

                        //save installer password
                        try {
                            await fsPromises.writeFile(this.envoyInstallerPasswordFile, installerPasswd);
                        } catch (error) {
                            this.emit('error', `Save installer password error: ${error}.`);
                        };
                    } catch (error) {
                        this.emit('error', `Calculate installer password error: ${error}.`);
                    };
                }

                //digest authorization installer
                this.digestAuthInstaller = new DigestAuth({
                    user: CONSTANTS.Authorization.InstallerUser,
                    passwd: installerPasswd
                });

                resolve(true)
            } catch (error) {
                reject(`Read installer password error: ${error}.`);
            };
        });
    };

    updateHomeData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting home.`) : false;

            try {
                const homeData = await this.axiosInstance(CONSTANTS.ApiUrls.Home);
                const envoy = homeData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Home: ${JSON.stringify(envoy, null, 2)}`) : false;

                //get object keys of home
                const envoyKeys = Object.keys(envoy);
                const envoyCommKeys = Object.keys(envoy.comm);

                //get supported devices
                const microinvertersSupported = envoyCommKeys.includes('pcu');
                const acBatteriesSupported = envoyCommKeys.includes('acb');
                const qRelaysSupported = envoyCommKeys.includes('nsrb');
                const ensemblesSupported = envoyCommKeys.includes('esub');
                const enchargesSupported = envoyCommKeys.includes('encharge');
                const wirelessConnectionKitSupported = envoyKeys.includes('wireless_connection');

                //envoy
                const softwareBuildEpoch = new Date(envoy.software_build_epoch * 1000).toLocaleString();
                const isEnvoy = envoy.is_nonvoy === false ?? true;
                const dbSize = envoy.db_size ?? 0;
                const dbPercentFull = envoy.db_percent_full ?? 0;
                const timeZone = envoy.timezone;
                const currentDate = new Date(envoy.current_date).toLocaleString().slice(0, 11);
                const currentTime = envoy.current_time;

                //network
                const envoyNework = envoy.network;
                const webComm = envoyNework.web_comm === true;
                const everReportedToEnlighten = envoyNework.ever_reported_to_enlighten === true;
                const lastEnlightenReporDate = new Date(envoyNework.last_enlighten_report_time * 1000).toLocaleString();
                const primaryInterface = CONSTANTS.ApiCodes[envoyNework.primary_interface] ?? 'Unknown';
                const envoyNetworkInterfaces = envoyNework.interfaces ?? [];
                const envoyNetworkInterfacesCount = envoyNetworkInterfaces.length;
                for (let i = 0; i < envoyNetworkInterfacesCount; i++) {
                    const envoyNetworkInterfacesValues = Object.values(envoyNetworkInterfaces[i]);
                    const envoyInterfaceCellular = envoyNetworkInterfacesValues.includes('cellular');
                    const envoyInterfaceLan = envoyNetworkInterfacesValues.includes('ethernet');
                    const envoyInterfaceWlan = envoyNetworkInterfacesValues.includes('wifi');
                    const envoyInterfaceStartIndex = envoyInterfaceCellular ? 1 : 0;

                    if (envoyInterfaceCellular) {
                        const envoyInterfaceSignalStrength = envoyNetworkInterfaces[0].signal_strength * 20;
                        const envoyInterfaceSignalStrengthMax = envoyNetworkInterfaces[0].signal_strength_max * 20;
                        const envoyInterfaceNetwork = envoyNetworkInterfaces[0].network;
                        const envoyInterfaceType = CONSTANTS.ApiCodes[envoyNetworkInterfaces[0].type] ?? 'Unknown';
                        const envoyInterfaceInterface = envoyNetworkInterfaces[0].interface;
                        const envoyInterfaceDhcp = envoyNetworkInterfaces[0].dhcp;
                        const envoyInterfaceIp = envoyNetworkInterfaces[0].ip;
                        const envoyInterfaceCarrier = envoyNetworkInterfaces[0].carrier === true;
                        this.envoyInterfaceCellular = true;
                    }
                    if (envoyInterfaceLan) {
                        const envoyInterfaceType = CONSTANTS.ApiCodes[envoyNetworkInterfaces[envoyInterfaceStartIndex].type] ?? 'Unknown';
                        const envoyInterfaceInterface = envoyNetworkInterfaces[envoyInterfaceStartIndex].interface;
                        const envoyInterfaceMac = envoyNetworkInterfaces[envoyInterfaceStartIndex].mac;
                        const envoyInterfaceDhcp = envoyNetworkInterfaces[envoyInterfaceStartIndex].dhcp;
                        const envoyInterfaceIp = envoyNetworkInterfaces[envoyInterfaceStartIndex].ip;
                        const envoyInterfaceSignalStrength = envoyNetworkInterfaces[envoyInterfaceStartIndex].signal_strength * 20;
                        const envoyInterfaceSignalStrengthMax = envoyNetworkInterfaces[envoyInterfaceStartIndex].signal_strength_max * 20;
                        const envoyInterfaceCarrier = envoyNetworkInterfaces[envoyInterfaceStartIndex].carrier === true;
                        this.envoyInterfaceLan = true;
                    }
                    if (envoyInterfaceWlan) {
                        const envoyInterfaceSignalStrenth = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].signal_strength * 20;
                        const envoyInterfaceSignalStrengthMax = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].signal_strength_max * 20;
                        const envoyInterfaceType = CONSTANTS.ApiCodes[envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].type] ?? 'Unknown';
                        const envoyInterfaceInterface = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].interface;
                        const envoyInterfaceMac = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].mac;
                        const envoyInterfaceDhcp = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].dhcp;
                        const envoyInterfaceIp = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].ip;
                        const envoyInterfaceCarrier = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].carrier === true;
                        const envoyInterfaceSupported = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].supported;
                        const envoyInterfacePresent = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].present;
                        const envoyInterfaceConfigured = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].configured;
                        const envoyInterfaceStatus = CONSTANTS.ApiCodes[envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].status] ?? 'Unknown';
                        this.envoyInterfaceWlan = true;
                    }
                }
                const tariff = CONSTANTS.ApiCodes[envoy.tariff] ?? 'Unknown';

                //comm
                const comm = envoy.comm;
                const commNum = comm.num;
                const commLevel = comm.level * 20;
                const commPcuNum = comm.pcu.num;
                const commPcuLevel = comm.pcu.level * 20;
                const commAcbNum = comm.acb.num;
                const commAcbLevel = comm.acb.level * 20;
                const commNsrbNum = comm.nsrb.num;
                const commNsrbLevel = comm.nsrb.level * 20;

                //comm ensemble
                const commEnsemble = ensemblesSupported ? comm.esub : {};
                const commEnsembleNum = commEnsemble.num ?? 0;
                const commEnsembleLevel = commEnsemble.level * 20 ?? 0;

                //comm encharge
                const commEncharge = enchargesSupported ? comm.encharge[0] : {};
                const commEnchargeNum = commEncharge.num ?? 0;
                const commEnchargeLevel = commEncharge.level * 20 ?? 0;
                const commEnchargeLevel24g = commEncharge.level_24g * 20 ?? 0;
                const commEnchagLevelSubg = commEncharge.level_subg * 20 ?? 0;

                const alerts = (Array.isArray(envoy.alerts) && (envoy.alerts).length > 0) ? ((envoy.alerts).map(a => CONSTANTS.ApiCodes[a.msg_key] || a.msg_key).join(', ')).substring(0, 64) : 'No alerts';
                const updateStatus = CONSTANTS.ApiCodes[envoy.update_status] ?? 'Unknown';
                const arfProfile = this.pv.arfProfile.name;

                //wireless connection kit
                const wirelessConnections = wirelessConnectionKitSupported ? envoy.wireless_connection : [];
                const wirelessConnectionKitConnectionsCount = wirelessConnections.length;
                if (wirelessConnectionKitSupported) {
                    this.pv.wirelessConnektions = [];

                    wirelessConnections.forEach((wirelessConnection, index) => {
                        const obj = {
                            signalStrength: wirelessConnection.signal_strength * 20,
                            signalStrengthMax: wirelessConnection.signal_strength_max * 20,
                            type: CONSTANTS.ApiCodes[wirelessConnection.type] ?? 'Unknown',
                            connected: wirelessConnection.connected ?? false,
                        };
                        this.pv.wirelessConnektions.push(obj);

                        if (this.wirelessConnectionsKitServices) {
                            this.wirelessConnectionsKitServices[index]
                                ?.updateCharacteristic(Characteristic.enphaseWirelessConnectionKitSignalStrength, obj.signalStrength)
                                ?.updateCharacteristic(Characteristic.enphaseWirelessConnectionKitSignalStrengthMax, obj.signalStrengthMax)
                                ?.updateCharacteristic(Characteristic.enphaseWirelessConnectionKitType, obj.type)
                                ?.updateCharacteristic(Characteristic.enphaseWirelessConnectionKitConnected, obj.connected);
                        }
                    });
                    this.feature.wirelessConnectionKit.installed = this.pv.wirelessConnektions.some(connection => connection.connected);
                }

                if (this.envoyService) {
                    this.envoyService
                        .updateCharacteristic(Characteristic.enphaseEnvoyGridProfile, arfProfile)
                        .updateCharacteristic(Characteristic.enphaseEnvoyAlerts, alerts)
                        .updateCharacteristic(Characteristic.enphaseEnvoyDbSize, `${dbSize} MB / ${dbPercentFull} %`)
                        .updateCharacteristic(Characteristic.enphaseEnvoyTimeZone, timeZone)
                        .updateCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime, `${currentDate} ${currentTime}`)
                        .updateCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm, webComm)
                        .updateCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten, everReportedToEnlighten)
                        .updateCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporDate, lastEnlightenReporDate)
                        .updateCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface, primaryInterface)
                        .updateCharacteristic(Characteristic.enphaseEnvoyTariff, tariff)
                        .updateCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel, `${commNum} / ${commLevel} %`)
                        .updateCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel, `${commPcuNum} / ${commPcuLevel} %`)
                        .updateCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel, `${commNsrbNum} / ${commNsrbLevel} %`);
                    if (this.feature.acBatteries.installed) {
                        this.envoyService
                            .updateCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel, `${commAcbNum} / ${commAcbLevel} %`)
                    }
                    if (this.feature.encharges.installed) {
                        this.envoyService
                            .updateCharacteristic(Characteristic.enphaseEnvoyCommNumEnchgAndLevel, `${commEnchargeNum} / ${commEnchargeLevel} %`)
                    }
                }

                const home = {
                    softwareBuildEpoch: softwareBuildEpoch,
                    isEnvoy: isEnvoy,
                    dbSize: dbSize,
                    dbPercentFull: dbPercentFull,
                    timeZone: timeZone,
                    currentDate: currentDate,
                    currentTime: currentTime,
                    webComm: webComm,
                    everReportedToEnlighten: everReportedToEnlighten,
                    lastEnlightenReporDate: lastEnlightenReporDate,
                    primaryInterface: primaryInterface,
                    networkInterfacesCount: envoyNetworkInterfacesCount,
                    tariff: tariff,
                    commNum: commNum,
                    commLevel: commLevel,
                    commPcuNum: commPcuNum,
                    commPcuLevel: commPcuLevel,
                    commAcbNum: commAcbNum,
                    commAcbLevel: commAcbLevel,
                    commNsrbNum: commNsrbNum,
                    commNsrbLevel: commNsrbLevel,
                    commEsubNum: commEnsembleNum,
                    commEsubLevel: commEnsembleLevel,
                    commEnchgNum: commEnchargeNum,
                    commEnchgLevel: commEnchargeLevel,
                    commEnchgLevel24g: commEnchargeLevel24g,
                    commEnchagLevelSubg: commEnchagLevelSubg,
                    alerts: alerts,
                    updateStatus: updateStatus,
                    arfProfile: arfProfile
                };
                //add home to pv object
                this.pv.home = home;

                //supported devices
                this.feature.microinverters.supported = microinvertersSupported;
                this.feature.acBatteries.supported = acBatteriesSupported;
                this.feature.qRelays.supported = qRelaysSupported;
                this.feature.ensembles.supported = ensemblesSupported;
                this.feature.encharges.supported = enchargesSupported;
                this.feature.wirelessConnectionKit.supported = wirelessConnectionKitSupported;
                this.feature.wirelessConnectionKit.count = wirelessConnectionKitConnectionsCount;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('home', envoy) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Home', envoy) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting home error: ${error}.`);
            };
        });
    };

    updateInventoryData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting inventory.`) : false;

            try {
                const inventoryData = await this.axiosInstance(CONSTANTS.ApiUrls.Inventory);
                const inventory = inventoryData.data ?? [];
                const debug = this.enableDebugMode ? this.emit('debug', `Inventory: ${JSON.stringify(inventory, null, 2)}`) : false;

                //inventory keys
                const inventoryKeys = inventory.map(device => device.type);

                //microinverters inventory
                const microinvertersSupported = inventoryKeys.includes('PCU');
                const microinverters = microinvertersSupported ? inventory[0].devices : [];
                const microinvertersCount = microinverters.length;
                const microinvertersInstalled = microinvertersCount > 0;
                if (microinvertersInstalled) {
                    this.pv.microinverters = [];
                    const type = CONSTANTS.ApiCodes[inventory[0].type] ?? 'Unknown';
                    microinverters.forEach((microinverter, index) => {
                        const obj = {
                            type: type,
                            partNum: CONSTANTS.PartNumbers[microinverter.part_num] ?? 'Microinverter',
                            installed: new Date(microinverter.installed * 1000).toLocaleString(),
                            serialNumber: microinverter.serial_num,
                            deviceStatus: (Array.isArray(microinverter.device_status) && (microinverter.device_status).length > 0) ? ((microinverter.device_status).map(a => CONSTANTS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
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
                            phase: microinverter.phase ?? 'Unknown',
                            arfProfile: this.pv.arfProfile.name,
                            commLevel: 0,
                            power: {}
                        }
                        this.pv.microinverters.push(obj)

                        if (this.microinvertersServices) {
                            this.microinvertersServices[index]
                                .updateCharacteristic(Characteristic.enphaseMicroinverterGridProfile, obj.arfProfile)
                                .updateCharacteristic(Characteristic.enphaseMicroinverterStatus, obj.deviceStatus)
                                .updateCharacteristic(Characteristic.enphaseMicroinverterLastReportDate, obj.lastReportDate)
                                .updateCharacteristic(Characteristic.enphaseMicroinverterFirmware, obj.firmware)
                                .updateCharacteristic(Characteristic.enphaseMicroinverterProducing, obj.producing)
                                .updateCharacteristic(Characteristic.enphaseMicroinverterCommunicating, obj.communicating)
                                .updateCharacteristic(Characteristic.enphaseMicroinverterProvisioned, obj.provisioned)
                                .updateCharacteristic(Characteristic.enphaseMicroinverterOperating, obj.operating);
                        }
                    });

                    //microinverters installed
                    this.feature.microinverters.installed = microinvertersInstalled;
                    this.feature.microinverters.count = microinvertersCount;
                }

                //ac btteries inventoty
                const acBatteriesSupported = inventoryKeys.includes('ACB');
                const acBatteries = acBatteriesSupported ? inventory[1].devices : [];
                const acBatteriesCount = acBatteries.length;
                const acBatteriesInstalled = acBatteriesCount > 0;

                if (acBatteriesInstalled) {
                    this.pv.acBatteries.devices = [];
                    const type = CONSTANTS.ApiCodes[inventory[1].type] ?? 'Unknown';
                    acBatteries.forEach((acBatterie, index) => {
                        const obj = {
                            type: type,
                            partNumber: CONSTANTS.PartNumbers[acBaterie.part_num] ?? acBatterie.part_num,
                            installed: new Date(acBatterie.installed * 1000).toLocaleString(),
                            serialNumber: acBatterie.serial_num,
                            deviceStatus: (Array.isArray(acBatterie.device_status) && (acBatterie.device_status).length > 0) ? ((acBatterie.device_status).map(a => CONSTANTS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
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
                            chargeStatus: CONSTANTS.ApiCodes[acBatterie.charge_status] ?? 'Unknown',
                            commLevel: 0
                        }
                        //add ac batteries to pv object
                        this.pv.acBatteries.devices.push(obj);

                        if (this.acBatteriesServices) {
                            this.acBatteriesServices[index]
                                .updateCharacteristic(Characteristic.enphaseAcBatterieStatus, obj.deviceStatus)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieLastReportDate, obj.lastReportDate)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieFirmware, obj.firmware)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieProducing, obj.producing)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieCommunicating, obj.communicating)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieProvisioned, obj.provisioned)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieOperating, obj.operating)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieSleepEnabled, obj.sleepEnabled)
                                .updateCharacteristic(Characteristic.enphaseAcBatteriePercentFull, obj.percentFull)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieMaxCellTemp, obj.maxCellTemp)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieSleepMinSoc, obj.sleepMinSoc)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieSleepMaxSoc, obj.sleepMaxSoc)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieChargeStatus, obj.chargeStatus);
                        }
                    });

                    //ac batteries supported
                    this.feature.acBatteries.installed = acBatteriesInstalled;
                    this.feature.acBatteries.count = acBatteriesCount;
                }

                //qrelays inventory
                const qRelaysSupported = inventoryKeys.includes('NSRB');
                const qRelays = qRelaysSupported ? inventory[2].devices : [];
                const qRelaysCount = qRelays.length;
                const qRelaysInstalled = qRelaysCount > 0;

                if (qRelaysInstalled) {
                    this.pv.qRelays = [];
                    const type = CONSTANTS.ApiCodes[inventory[2].type] ?? 'Unknown';
                    qRelays.forEach((qRelay, index) => {
                        const obj = {
                            type: type,
                            partNumber: CONSTANTS.PartNumbers[qRelay.part_num] ?? qRelay.part_num,
                            installed: new Date(qRelay.installed * 1000).toLocaleString(),
                            serialNumber: qRelay.serial_num,
                            deviceStatus: (Array.isArray(qRelay.device_status) && (qRelay.device_status).length > 0) ? ((qRelay.device_status).map(a => CONSTANTS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
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
                            relay: CONSTANTS.ApiCodes[qRelay.relay] ?? 'Unknown',
                            reasonCode: qRelay.reason_code,
                            reason: qRelay.reason,
                            linesCount: qRelay['line-count'],
                            line1Connected: qRelay['line-count'] >= 1 ? qRelay['line1-connected'] === true : false,
                            line2Connected: qRelay['line-count'] >= 2 ? qRelay['line2-connected'] === true : false,
                            line3Connected: qRelay['line-count'] >= 3 ? qRelay['line3-connected'] === true : false,
                            arfProfile: this.pv.arfProfile.name,
                            commLevel: 0
                        }
                        this.pv.qRelays.push(obj);

                        if (this.qRelaysServices) {
                            this.qRelaysServices[index]
                                .updateCharacteristic(Characteristic.enphaseQrelayGridProfile, obj.arfProfile)
                                .updateCharacteristic(Characteristic.enphaseQrelayStatus, obj.deviceStatus)
                                .updateCharacteristic(Characteristic.enphaseQrelayLastReportDate, obj.lastReportDate)
                                .updateCharacteristic(Characteristic.enphaseQrelayFirmware, obj.firmware)
                                //.updateCharacteristic(Characteristic.enphaseQrelayProducing, obj.producing)
                                .updateCharacteristic(Characteristic.enphaseQrelayCommunicating, obj.communicating)
                                .updateCharacteristic(Characteristic.enphaseQrelayProvisioned, obj.provisioned)
                                .updateCharacteristic(Characteristic.enphaseQrelayOperating, obj.operating)
                                .updateCharacteristic(Characteristic.enphaseQrelayState, obj.relay)
                                .updateCharacteristic(Characteristic.enphaseQrelayLinesCount, obj.linesCount)
                            if (obj.linesCount >= 1) {
                                this.qRelaysServices[index]
                                    .updateCharacteristic(Characteristic.enphaseQrelayLine1Connected, obj.line1Connected);
                            }
                            if (obj.linesCount >= 2) {
                                this.qRelaysServices[index]
                                    .updateCharacteristic(Characteristic.enphaseQrelayLine2Connected, obj.line2Connected);
                            }
                            if (obj.linesCount >= 3) {
                                this.qRelaysServices[index]
                                    .updateCharacteristic(Characteristic.enphaseQrelayLine3Connected, obj.line3Connected);
                            }
                        }
                    });

                    //qRelays installed
                    this.feature.qRelays.installed = qRelaysInstalled;
                    this.feature.qRelays.count = qRelaysCount;
                }

                //ensembles
                const ensemblesSupported = inventoryKeys.includes('ESUB');
                const ensembles = ensemblesSupported ? inventory[3].devices : [];
                const ensemblesCount = ensembles.length;
                const ensemblesInventoryInstalled = ensemblesCount > 0;

                if (ensemblesInventoryInstalled) {
                    this.pv.ensembles = [];
                    const type = CONSTANTS.ApiCodes[inventory[3].type] ?? 'Unknown';
                    ensembles.forEach((ensemble, index) => {
                        const obj = {
                            type: type,
                            ensemble: ensembles[i],
                            partNumber: CONSTANTS.PartNumbers[ensemble.part_num] ?? ensemble.part_num,
                            installed: new Date(ensemble.installed * 1000).toLocaleString(),
                            serialNumber: ensemble.serial_num,
                            deviceStatus: (Array.isArray(ensemble.device_status) && (ensemble.device_status).length > 0) ? ((ensemble.device_status).map(a => CONSTANTS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
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
                            operating: ensemble.operating === true,
                        }
                        this.pv.ensembles.push(obj);

                        if (this.ensemblesServices) {
                            this.ensemblesServices[index]
                                .updateCharacteristic(Characteristic.enphaseEnsembleStatus, obj.deviceStatus)
                                .updateCharacteristic(Characteristic.enphaseEnsembleLastReportDate, obj.lastReportDate)
                                .updateCharacteristic(Characteristic.enphaseEnsembleFirmware, obj.firmware)
                                .updateCharacteristic(Characteristic.enphaseEnsembleProducing, obj.producing)
                                .updateCharacteristic(Characteristic.enphaseEnsembleCommunicating, obj.communicating)
                                .updateCharacteristic(Characteristic.enphaseEnsembleOperating, obj.operating)
                        }
                    });

                    //ensembles installed
                    this.feature.ensembles.inventory.installed = ensemblesInventoryInstalled;
                    this.feature.ensembles.count = ensemblesCount;
                }

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('inventory', inventory) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Inventory', inventory) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting inventory error: ${error}.`);
            };
        });
    };

    updateMetersData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting meters info.`) : false;

            try {
                const metersData = await this.axiosInstance(CONSTANTS.ApiUrls.InternalMeterInfo);
                const meters = metersData.data ?? [];
                const debug = this.enableDebugMode ? this.emit('debug', `Meters: ${JSON.stringify(meters, null, 2)}`) : false;

                //meters count
                const metersExis = meters.length > 0;
                if (!metersExis) {
                    resolve(false);
                    return;
                }

                //meters
                this.pv.meters = [];
                meters.forEach((meter, index) => {
                    const obj = {
                        eid: meter.eid,
                        state: meter.state === 'enabled' ?? false,
                        measurementType: CONSTANTS.ApiCodes[meter.measurementType] ?? 'Unknown',
                        phaseMode: CONSTANTS.ApiCodes[meter.phaseMode] ?? 'Unknown',
                        phaseCount: meter.phaseCount ?? 1,
                        meteringStatus: CONSTANTS.ApiCodes[meter.meteringStatus] ?? 'Unknown',
                        statusFlags: (Array.isArray(meter.statusFlags) && (meter.statusFlags).length > 0) ? ((meter.statusFlags).map(a => CONSTANTS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
                        readings: {}
                    }

                    this.pv.meters.push(obj);

                    if (this.metersServices) {
                        this.metersServices[index]
                            .updateCharacteristic(Characteristic.enphaseMeterState, obj.state)
                            .updateCharacteristic(Characteristic.enphaseMeterPhaseMode, obj.phaseMode)
                            .updateCharacteristic(Characteristic.enphaseMeterPhaseCount, obj.phaseCount)
                            .updateCharacteristic(Characteristic.enphaseMeterMeteringStatus, obj.meteringStatus)
                            .updateCharacteristic(Characteristic.enphaseMeterStatusFlags, obj.statusFlags);
                    }
                });

                //production
                const productionMeter = this.pv.meters.find(meter => meter.measurementType === 'Production');
                this.feature.meters.production.supported = Boolean(productionMeter);
                this.feature.meters.production.enabled = productionMeter?.state ?? false;
                this.feature.meters.production.voltageDivide = productionMeter ? (productionMeter.phaseMode === 'Split' ? 1 : productionMeter.phaseCount) : 1;

                //consumption
                const consumptionMeter = this.pv.meters.find(meter => meter.measurementType === 'Consumption Net');
                this.feature.meters.consumption.supported = Boolean(productionMeter);
                this.feature.meters.consumption.enabled = consumptionMeter?.state ?? false;
                this.feature.meters.consumption.voltageDivide = consumptionMeter ? (consumptionMeter.phaseMode === 'Split' ? 1 : consumptionMeter.phaseCount) : 1;

                //storage
                const storageMeter = this.pv.meters.find(meter => meter.measurementType === 'Storage');
                this.feature.meters.storage.supported = Boolean(storageMeter);
                this.feature.meters.storage.enabled = storageMeter?.state ?? false;
                this.feature.meters.storage.voltageDivide = storageMeter ? (storageMeter.phaseMode === 'Split' ? 1 : storageMeter.phaseCount) : 1;

                //meters installed
                this.feature.meters.installed = this.pv.meters.some(meter => meter.state);
                this.feature.meters.count = meters.length;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('meters', meters) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Meters', meters) : false;
                resolve(this.feature.meters.installed);
            } catch (error) {
                reject(`Requesting meters error: ${error}.`);
            };
        });
    };

    updateMetersReadingData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting meters reading.`) : false;

            try {
                const metersReadingData = await this.axiosInstance(CONSTANTS.ApiUrls.InternalMeterReadings);
                const metersReading = metersReadingData.data ?? [];
                const debug = this.enableDebugMode ? this.emit('debug', `Meters reading: ${JSON.stringify(metersReading, null, 2)}`) : false;

                //meters reading count
                const metersReadingSupported = metersReading.length > 0;
                if (!metersReadingSupported) {
                    resolve(false);
                    return;
                }

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
                    this.pv.meters[index].readings = obj;

                    //update characteristics
                    if (this.metersServices && this.pv.meters[index].state) {
                        this.metersServices[index]
                            .updateCharacteristic(Characteristic.enphaseMeterReadingTime, obj.timeStamp)
                            .updateCharacteristic(Characteristic.enphaseMeterActivePower, obj.activePower)
                            .updateCharacteristic(Characteristic.enphaseMeterApparentPower, obj.apparentPower)
                            .updateCharacteristic(Characteristic.enphaseMeterReactivePower, obj.reactivePower)
                            .updateCharacteristic(Characteristic.enphaseMeterPwrFactor, obj.pwrFactor)
                            .updateCharacteristic(Characteristic.enphaseMeterVoltage, obj.voltage)
                            .updateCharacteristic(Characteristic.enphaseMeterCurrent, obj.current)
                            .updateCharacteristic(Characteristic.enphaseMeterFreq, obj.freq);
                    }
                });

                //meters readings installed
                this.feature.meters.reading.installed = metersReadingSupported;
                this.feature.meters.reading.count = metersReading.length;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('metersreading', metersReading) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Meters Reading', metersReading) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting meters reading error: ${error}.`);
            };
        });
    };

    updateMicroinvertersData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting microinverters.`) : false;

            try {
                const options = {
                    method: 'GET',
                    baseURL: this.url,
                    headers: {
                        Accept: 'application/json'
                    }
                }

                const microinvertersData = this.envoyFirmware7xx ? await this.axiosInstance(CONSTANTS.ApiUrls.InverterProduction) : await this.digestAuthEnvoy.request(CONSTANTS.ApiUrls.InverterProduction, options);
                const microinverters = microinvertersData.data ?? [];
                const debug = this.enableDebugMode ? this.emit('debug', `Microinverters: ${JSON.stringify(microinverters, null, 2)}`) : false;

                //microinverters devices count
                const microinvertersSupported = microinverters.length > 0;
                if (!microinvertersSupported) {
                    resolve(false);
                    return;
                }

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

                    //add microinverters power to microinverters and pv object
                    this.pv.microinverters[index].power = obj;

                    if (this.microinvertersServices) {
                        this.microinvertersServices[index]
                            .updateCharacteristic(Characteristic.enphaseMicroinverterLastReportDate, obj.lastReportDate)
                            .updateCharacteristic(Characteristic.enphaseMicroinverterPower, obj.lastReportWatts)
                            .updateCharacteristic(Characteristic.enphaseMicroinverterPowerMax, obj.maxReportWatts)
                    }
                });

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('microinverters', microinverters) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Microinverters', microinverters) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting microinverters error: ${error}.`);
            };
        });
    };

    updateProductionData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting production.`) : false;

            try {
                const productionData = await this.axiosInstance(CONSTANTS.ApiUrls.InverterProductionSumm);
                const production = productionData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Production: ${JSON.stringify(production, null, 2)}`) : false;

                //production supported
                const productionKeys = Object.keys(production);
                const productionSupported = productionKeys.length > 0;
                if (!productionSupported) {
                    resolve(false);
                    return;
                }

                //microinverters summary 
                const productionMicroinverters = {
                    whToday: production.wattHoursToday / 1000 ?? 0,
                    whLastSevenDays: production.wattHoursSevenDays / 1000 ?? 0,
                    whLifeTime: (production.wattHoursLifetime + this.energyProductionLifetimeOffset) / 1000 ?? 0,
                    wattsNow: production.wattsNow / 1000 ?? 0
                };

                //add production microinverters to pv object
                this.pv.production.microinverters = productionMicroinverters;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('production', production) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Production', production) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting production error: ${error}.`);
            };
        });
    };

    updateProductionCtData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting production ct.`) : false;

            try {
                const productionCtData = await this.axiosInstance(CONSTANTS.ApiUrls.SystemReadingStats);
                const productionCt = productionCtData.data ?? [];
                const debug = this.enableDebugMode ? this.emit('debug', `Production ct: ${JSON.stringify(productionCt, null, 2)}`) : false;

                //production ct exist
                const productionCtKeys = Object.keys(productionCt);
                const productionCtExist = productionCtKeys.includes('production');
                const productionCtSupported = productionCtExist ? productionCt.production.length > 0 : false;
                if (!productionCtSupported) {
                    resolve(false);
                    return;
                }

                //get enabled devices
                const metersProductionEnabled = this.feature.meters.production.enabled;
                const metersProductionVoltageDivide = this.feature.meters.production.voltageDivide;
                const metersConsumptionEnabled = this.feature.meters.consumption.enabled;
                const metersConsumpionVoltageDivide = this.feature.meters.consumption.voltageDivide;
                const acBatteriesInstalled = this.feature.acBatteries.installed;

                //microinverters data 0
                const productionMicro = productionCt.production[0] ?? {};
                const productionMicroType = CONSTANTS.ApiCodes[productionMicro.type];
                const productionMicroActiveCount = productionMicro.activeCount;
                const productionMicroReadingTime = new Date(productionMicro.readingTime * 1000).toLocaleString();
                const productionMicroPower = productionMicro.wNow / 1000;
                const productionMicroEnergyLifeTime = (productionMicro.whLifetime + this.energyProductionLifetimeOffset) / 1000;

                //production data 1
                const production = productionCt.production[1] ?? {};
                const productionType = metersProductionEnabled ? CONSTANTS.ApiCodes[production.type] : productionMicroType;
                const productionActiveCount = metersProductionEnabled ? production.activeCount : productionMicroActiveCount;
                const productionMeasurmentType = metersProductionEnabled ? CONSTANTS.ApiCodes[production.measurementType] : productionMicroType;
                const productionReadingTime = metersProductionEnabled ? new Date(production.readingTime * 1000).toLocaleString() : productionMicroReadingTime;
                const productionPower = metersProductionEnabled ? production.wNow / 1000 : productionMicroPower;

                //power state
                const productionPowerState = productionPower > 0; // true if power > 0
                const debug1 = this.enableDebugMode ? this.emit('debug', `Production power state: ${productionPowerState}`) : false;

                //power level
                const powerProductionSummary = this.powerProductionSummary / 1000; //kW
                const productionPowerLevel = productionPowerState ? (Math.min(Math.max((100 / powerProductionSummary) * productionPower, 1), 100)).toFixed(1) : 0; //0-100%
                const debug2 = this.enableDebugMode ? this.emit('debug', `Production power level: ${productionPowerLevel} %`) : false;

                //power peak
                const productionPowerPeakStored = this.pv.production.ct.powerPeak ?? 0;
                const productionPowerPeak = productionPower > productionPowerPeakStored ? productionPower : productionPowerPeakStored;

                //power peak detected
                const productionPowerPeakDetected = productionPower > productionPowerPeakStored;
                const debug4 = this.enableDebugMode ? this.emit('debug', `Production power peak detected: ${productionPowerPeakDetected}`) : false;

                //energy
                const productionEnergyLifeTime = metersProductionEnabled ? (production.whLifetime + this.energyProductionLifetimeOffset) / 1000 : productionMicroEnergyLifeTime ?? 0;
                const productionEnergyVarhLeadLifetime = metersProductionEnabled ? production.varhLeadLifetime / 1000 : 0;
                const productionEnergyVarhLagLifetime = metersProductionEnabled ? production.varhLagLifetime / 1000 : 0;
                const productionEnergyLastSevenDays = metersProductionEnabled ? production.whLastSevenDays / 1000 : this.pv.production.microinverters.whLastSevenDays ?? 0;
                const productionEnergyToday = metersProductionEnabled ? production.whToday / 1000 : this.pv.production.microinverters.whToday ?? 0;
                const productionEnergyVahToday = metersProductionEnabled ? production.vahToday / 1000 : 0;
                const productionEnergyVarhLeadToday = metersProductionEnabled ? production.varhLeadToday / 1000 : 0;
                const productionEnergyVarhLagToday = metersProductionEnabled ? production.varhLagToday / 1000 : 0;

                //energy lifetime fix for negative value
                const productionEnergyLifeTimeFix = productionEnergyLifeTime < 0 ? 0 : productionEnergyLifeTime;

                //energy state
                const productionEnergyState = productionEnergyToday > 0; // true if energy > 0
                const debug5 = this.enableDebugMode ? this.emit('debug', `Production energy state: ${productionEnergyState}`) : false;

                //param
                const productionRmsCurrent = metersProductionEnabled ? production.rmsCurrent : 0;
                const productionRmsVoltage = metersProductionEnabled ? production.rmsVoltage / metersProductionVoltageDivide : 1;
                const productionReactivePower = metersProductionEnabled ? production.reactPwr / 1000 : 0;
                const productionApparentPower = metersProductionEnabled ? production.apprntPwr / 1000 : 0;
                const productionPwrFactor = metersProductionEnabled ? production.pwrFactor : 0;

                const productionCT = {
                    powerState: productionPowerState,
                    powerLevel: productionPowerLevel,
                    activeCount: productionActiveCount,
                    type: productionType,
                    measurmentType: productionMeasurmentType,
                    readingTime: productionReadingTime,
                    power: productionPower,
                    powerPeak: productionPowerPeak,
                    powerPeakDetected: productionPowerPeakDetected,
                    energyToday: productionEnergyToday,
                    energyLastSevenDays: productionEnergyLastSevenDays,
                    energyLifeTime: productionEnergyLifeTimeFix,
                    powerState: productionPowerState,
                    energyState: productionEnergyState,
                    rmsCurrent: productionRmsCurrent,
                    rmsVoltage: productionRmsVoltage,
                    reactivePower: productionReactivePower,
                    apparentPower: productionApparentPower,
                    pwrFactor: productionPwrFactor
                }
                //add production ct  to pv object
                this.pv.production.ct = productionCT;

                if (this.systemService) {
                    this.systemService
                        .updateCharacteristic(Characteristic.On, productionPowerState)
                        .updateCharacteristic(Characteristic.Brightness, productionPowerLevel)
                }

                if (this.productionsService) {
                    this.productionsService
                        .updateCharacteristic(Characteristic.enphaseReadingTime, productionReadingTime)
                        .updateCharacteristic(Characteristic.enphasePower, productionPower)
                        .updateCharacteristic(Characteristic.enphasePowerMax, productionPowerPeak)
                        .updateCharacteristic(Characteristic.enphasePowerMaxDetected, productionPowerPeakDetected)
                        .updateCharacteristic(Characteristic.enphaseEnergyToday, productionEnergyToday)
                        .updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, productionEnergyLastSevenDays)
                        .updateCharacteristic(Characteristic.enphaseEnergyLifeTime, productionEnergyLifeTimeFix)
                        .updateCharacteristic(Characteristic.enphasePowerMaxReset, false);
                    if (metersProductionEnabled) {
                        this.productionsService
                            .updateCharacteristic(Characteristic.enphaseRmsCurrent, productionRmsCurrent)
                            .updateCharacteristic(Characteristic.enphaseRmsVoltage, productionRmsVoltage)
                            .updateCharacteristic(Characteristic.enphaseReactivePower, productionReactivePower)
                            .updateCharacteristic(Characteristic.enphaseApparentPower, productionApparentPower)
                            .updateCharacteristic(Characteristic.enphasePwrFactor, productionPwrFactor);
                    }
                }

                //sensors power
                if (this.powerProductionStateActiveSensorsCount > 0) {
                    for (let i = 0; i < this.powerProductionStateActiveSensorsCount; i++) {
                        this.powerProductionStateActiveSensors[i].state = productionPowerState;

                        if (this.powerProductionStateSensorsServices) {
                            const characteristicType = this.powerProductionStateActiveSensors[i].characteristicType;
                            this.powerProductionStateSensorsServices[i]
                                .updateCharacteristic(characteristicType, productionPowerState)
                        }
                    }
                }
                if (this.powerProductionLevelActiveSensorsCount > 0) {
                    for (let i = 0; i < this.powerProductionLevelActiveSensorsCount; i++) {
                        const powerLevel = this.powerProductionLevelActiveSensors[i].powerLevel;
                        const state = productionPower >= powerLevel;
                        this.powerProductionLevelActiveSensors[i].state = state;

                        if (this.powerProductionLevelSensorsServices) {
                            const characteristicType = this.powerProductionLevelActiveSensors[i].characteristicType;
                            this.powerProductionLevelSensorsServices[i]
                                .updateCharacteristic(characteristicType, state)
                        }
                    }
                }

                //sensors energy
                if (this.energyProductionStateActiveSensorsCount > 0) {
                    for (let i = 0; i < this.energyProductionStateActiveSensorsCount; i++) {
                        this.energyProductionStateActiveSensors[i].state = productionEnergyState;

                        if (this.energyProductionStateSensorsServices) {
                            const characteristicType = this.energyProductionStateActiveSensors[i].characteristicType;
                            this.energyProductionStateSensorsServices[i]
                                .updateCharacteristic(characteristicType, productionEnergyState)
                        }
                    }
                }
                if (this.energyProductionLevelActiveSensorsCount > 0) {
                    for (let i = 0; i < this.energyProductionLevelActiveSensorsCount; i++) {
                        const energyLevel = this.energyProductionLevelActiveSensors[i].energyLevel;
                        const state = productionEnergyToday >= energyLevel;
                        this.energyProductionLevelActiveSensors[i].state = state;

                        if (this.energyProductionLevelSensorsServices) {
                            const characteristicType = this.energyProductionLevelActiveSensors[i].characteristicType;
                            this.energyProductionLevelSensorsServices[i]
                                .updateCharacteristic(characteristicType, state)
                        }
                    }
                }

                //consumption data 2
                if (metersConsumptionEnabled) {
                    this.pv.consumptions = [];
                    const consumptions = productionCt.consumption ?? [];
                    consumptions.forEach((consumption, index) => {
                        const powerPeakExist = this.pv.consumptions.includes('powerPeak');
                        const storedPower = powerPeakExist ? this.pv.consumptions[index].powerPeak : 0;
                        const powerPeak = consumption.wNow > storedPower ? consumption.wNow / 1000 : storedPower;
                        const powerPeakDetected = consumption.wNow > storedPower;
                        const whLifetimeFix = consumption.whLifetime + [this.energyConsumptionTotalLifetimeOffset, this.energyConsumptionNetLifetimeOffset][index] < 0;
                        const consumptionLifetimeOffset = [this.energyConsumptionTotalLifetimeOffset, this.energyConsumptionNetLifetimeOffset][index];
                        const obj = {
                            type: CONSTANTS.ApiCodes[consumption.type],
                            measurmentType: CONSTANTS.ApiCodes[consumption.measurementType],
                            activeCount: consumption.activeCount,
                            readingTime: new Date(consumption.readingTime * 1000).toLocaleString(),
                            power: consumption.wNow / 1000,
                            powerPeak: powerPeak,
                            powerPeakDetected: powerPeakDetected,
                            powerState: consumption.wNow > 0,
                            energyLifeTime: whLifetimeFix ? 0 : (consumption.whLifetime + consumptionLifetimeOffset) / 1000 ?? 0,
                            energyVarhLeadLifetime: consumption.varhLeadLifetime / 1000,
                            energyVarhLagLifetime: consumption.varhLagLifetime / 1000,
                            energyVahLifetime: consumption.vahLifetime / 1000,
                            energyLastSevenDays: consumption.whLastSevenDays / 1000 ?? 0,
                            energyToday: consumption.whToday / 1000 ?? 0,
                            energyVahToday: consumption.vahToday / 1000,
                            energyVarhLeadToday: consumption.varhLeadToday / 1000,
                            energyVarhLagToday: consumption.varhLagToday / 1000,
                            energyState: consumption.whToday > 0,
                            rmsCurrent: consumption.rmsCurrent,
                            rmsVoltage: consumption.rmsVoltage / metersConsumpionVoltageDivide,
                            reactivePower: consumption.reactPwr / 1000,
                            apparentPower: consumption.apprntPwr / 1000,
                            pwrFactor: consumption.pwrFactor,
                        }
                        this.pv.consumptions.push(obj);

                        //debug
                        const debug1 = this.enableDebugMode ? this.emit('debug', `${obj.measurmentType} power state: ${obj.powerState}`) : false;
                        const debug2 = this.enableDebugMode ? this.emit('debug', `${obj.measurmentType} energy state: ${obj.energyState}`) : false;

                        if (this.consumptionsServices) {
                            this.consumptionsServices[index]
                                .updateCharacteristic(Characteristic.enphaseReadingTime, obj.readingTime)
                                .updateCharacteristic(Characteristic.enphasePower, obj.power)
                                .updateCharacteristic(Characteristic.enphasePowerMax, obj.powerPeak)
                                .updateCharacteristic(Characteristic.enphasePowerMaxDetected, obj.powerPeakDetected)
                                .updateCharacteristic(Characteristic.enphaseEnergyToday, obj.energyToday)
                                .updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, obj.energyLastSevenDays)
                                .updateCharacteristic(Characteristic.enphaseEnergyLifeTime, obj.energyLifeTime)
                                .updateCharacteristic(Characteristic.enphaseRmsCurrent, obj.rmsCurrent)
                                .updateCharacteristic(Characteristic.enphaseRmsVoltage, obj.rmsVoltage)
                                .updateCharacteristic(Characteristic.enphaseReactivePower, obj.reactivePower)
                                .updateCharacteristic(Characteristic.enphaseApparentPower, obj.apparentPower)
                                .updateCharacteristic(Characteristic.enphasePwrFactor, obj.pwrFactor)
                                .updateCharacteristic(Characteristic.enphasePowerMaxReset, false);
                        }

                        //sensors total
                        if (obj.measurmentType === 'Consumption Total') {
                            //power
                            if (this.powerConsumptionTotalStateActiveSensorsCount > 0) {
                                for (let i = 0; i < this.powerConsumptionTotalStateActiveSensorsCount; i++) {
                                    this.powerConsumptionTotalStateActiveSensors[i].state = obj.powerState;

                                    if (this.powerConsumptionTotalStateSensorsServices) {
                                        const characteristicType = this.powerConsumptionTotalStateActiveSensors[i].characteristicType;
                                        this.powerConsumptionTotalStateSensorsServices[i]
                                            .updateCharacteristic(characteristicType, obj.powerState)
                                    }
                                }
                            }
                            if (this.powerConsumptionTotalLevelActiveSensorsCount > 0) {
                                for (let i = 0; i < this.powerConsumptionTotalLevelActiveSensorsCount; i++) {
                                    const powerLevel = this.powerConsumptionTotalLevelActiveSensors[i].powerLevel;
                                    const state = obj.power >= powerLevel;
                                    this.powerConsumptionTotalLevelActiveSensors[i].state = state;

                                    if (this.powerConsumptionTotalLevelSensorsServices) {
                                        const characteristicType = this.powerConsumptionTotalLevelActiveSensors[i].characteristicType;
                                        this.powerConsumptionTotalLevelSensorsServices[i]
                                            .updateCharacteristic(characteristicType, state)
                                    }
                                }
                            }

                            //energy
                            if (this.energyConsumptionTotalStateActiveSensorsCount > 0) {
                                for (let i = 0; i < this.energyConsumptionTotalStateActiveSensorsCount; i++) {
                                    this.energyConsumptionTotalStateActiveSensors[i].state = obj.energyState;

                                    if (this.energyConsumptionTotalStateSensorsServices) {
                                        const characteristicType = this.energyConsumptionTotalStateActiveSensors[i].characteristicType;
                                        this.energyConsumptionTotalStateSensorsServices[i]
                                            .updateCharacteristic(characteristicType, obj.energyState)
                                    }
                                }
                            }
                            if (this.energyConsumptionTotalLevelActiveSensorsCount > 0) {
                                for (let i = 0; i < this.energyConsumptionTotalLevelActiveSensorsCount; i++) {
                                    const energyLevel = this.energyConsumptionTotalLevelActiveSensors[i].energyLevel;
                                    const state = obj.energyToday >= energyLevel;
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
                        if (obj.measurmentType === 'Consumption Net') {
                            //power
                            if (this.powerConsumptionNetStateActiveSensorsCount > 0) {
                                for (let i = 0; i < this.powerConsumptionNetStateActiveSensorsCount; i++) {
                                    this.powerConsumptionNetStateActiveSensors[i].state = obj.powerState;

                                    if (this.powerConsumptionNetStateSensorsServices) {
                                        const characteristicType = this.powerConsumptionNetStateActiveSensors[i].characteristicType;
                                        this.powerConsumptionNetStateSensorsServices[i]
                                            .updateCharacteristic(characteristicType, obj.powerState)
                                    }
                                }
                            }
                            if (this.powerConsumptionNetLevelActiveSensorsCount > 0) {
                                for (let i = 0; i < this.powerConsumptionNetLevelActiveSensorsCount; i++) {
                                    const powerLevel = this.powerConsumptionNetLevelActiveSensors[i].powerLevel;
                                    const importing = powerLevel >= 0;
                                    const state = importing ? obj.power >= powerLevel : obj.power <= powerLevel;
                                    this.powerConsumptionNetLevelActiveSensors[i].state = state;

                                    if (this.powerConsumptionNetLevelSensorsServices) {
                                        const characteristicType = this.powerConsumptionNetLevelActiveSensors[i].characteristicType;
                                        this.powerConsumptionNetLevelSensorsServices[i]
                                            .updateCharacteristic(characteristicType, state)
                                    }
                                }
                            }

                            //energy
                            if (this.energyConsumptionNetStateActiveSensorsCount > 0) {
                                for (let i = 0; i < this.energyConsumptionNetStateActiveSensorsCount; i++) {
                                    this.energyConsumptionNetStateActiveSensors[i].state = obj.energyState;

                                    if (this.energyConsumptionNetStateSensorsServices) {
                                        const characteristicType = this.energyConsumptionNetStateActiveSensors[i].characteristicType;
                                        this.energyConsumptionNetStateSensorsServices[i]
                                            .updateCharacteristic(characteristicType, obj.energyState)
                                    }
                                }
                            }
                            if (this.energyConsumptionNetLevelActiveSensorsCount > 0) {
                                for (let i = 0; i < this.energyConsumptionNetLevelActiveSensorsCount; i++) {
                                    const energyLevel = this.energyConsumptionNetLevelActiveSensors[i].energyLevel;
                                    const state = obj.energyToday >= energyLevel;
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
                };

                //ac btteries summary 3
                if (acBatteriesInstalled) {
                    const acBatteries = productionCt.storage[0] ?? {};
                    const summary = {
                        type: CONSTANTS.ApiCodes[acBatteries.type] ?? 'AC Batterie',
                        activeCount: acBatteries.activeCount,
                        readingTime: new Date(acBatteries.readingTime * 1000).toLocaleString(),
                        wNow: acBatteries.wNow / 1000,
                        whNow: acBatteries.whNow + this.acBatterieStorageOffset / 1000,
                        chargeStatus: CONSTANTS.ApiCodes[acBatteries.state] ?? 'Unknown',
                        percentFull: acBatteries.percentFull,
                        energyState: acBatteries.percentFull > 0,
                    }
                    //add  ac batterie summary to pv object
                    this.pv.acBatteries.summary = summary;

                    if (this.acBatterieSummaryService) {
                        this.acBatterieSummaryService
                            .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryReadingTime, summary.readingTime)
                            .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryPower, summary.wNow)
                            .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryEnergy, summary.whNow)
                            .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryPercentFull, summary.percentFull)
                            .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryActiveCount, summary.activeCount)
                            .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryState, summary.chargeStatus);
                    }

                    if (this.enphaseAcBatterieSummaryLevelAndStateService) {
                        this.enphaseAcBatterieSummaryLevelAndStateService
                            .updateCharacteristic(Characteristic.On, summary.energyState)
                            .updateCharacteristic(Characteristic.Brightness, summary.percentFull)
                    }
                }

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('productionct', productionCt) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Production CT', productionCt) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting production ct error: ${error}.`);
            };
        });
    };

    updateProductionPowerModeData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting power production mode.`) : false;

            try {
                const powerModeUrl = CONSTANTS.ApiUrls.PowerForcedModeGetPut.replace("EID", this.envoyDevId);
                const options = {
                    method: 'GET',
                    baseURL: this.url,
                    headers: {
                        Accept: 'application/json'
                    }
                }

                const productionPowerModeData = this.envoyFirmware7xx ? await this.axiosInstance(powerModeUrl) : await this.digestAuthInstaller.request(powerModeUrl, options);
                const productionPowerMode = productionPowerModeData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Power mode: ${JSON.stringify(productionPowerMode, null, 2)}`) : false;

                //production power mode
                const productionPowerModeKeys = Object.keys(productionPowerMode);
                const productionPowerModeSupported = productionPowerModeKeys.includes('powerForcedOff');
                if (!productionPowerModeSupported) {
                    resolve(false);
                    return;
                }

                //update power production control state
                const state = productionPowerMode.powerForcedOff === false;
                this.pv.productionPowerMode = state;

                //update services
                if (this.envoyService) {
                    this.envoyService
                        .updateCharacteristic(Characteristic.enphaseEnvoyProductionPowerMode, state)
                }

                if (this.powerProductionActiveControlsCount > 0) {
                    for (let i = 0; i < this.powerProductionActiveControlsCount; i++) {
                        this.powerProductionActiveControls[i].state = state;

                        if (this.powerProductionControlsServices) {
                            const characteristicType = this.powerProductionActiveControls[i].characteristicType;
                            this.powerProductionControlsServices[i]
                                .updateCharacteristic(characteristicType, state)
                        }
                    }
                }
                this.feature.productionPowerMode.supported = productionPowerModeSupported;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('powermode', productionPowerMode) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Power Mode', productionPowerMode) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting power production mode error: ${error}.`);
            };
        });
    }

    updateEnsembleInventoryData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting ensemble inventory.`) : false;

            try {
                const ensembleInventoryData = await this.axiosInstance(CONSTANTS.ApiUrls.EnsembleInventory);
                const ensembleInventory = ensembleInventoryData.data ?? [];
                const debug = this.enableDebugMode ? this.emit('debug', `Ensemble inventory: ${JSON.stringify(ensembleInventory, null, 2)}`) : false;

                //ensemble inventory devices count
                const ensembleInventorySupported = ensembleInventory.length > 0;
                if (!ensembleInventorySupported) {
                    resolve(false);
                    return;
                }

                //ensemble inventory keys
                const ensembleInventoryKeys = ensembleInventory.map(device => device.type);

                //encharges
                const enchargesSupported = ensembleInventoryKeys.includes('ENCHARGE');
                const encharges = enchargesSupported ? ensembleInventory[0].devices : [];
                const enchargesCount = encharges.length;
                const enchargesInstalled = enchargesCount > 0;
                const enchargesPercentFullSummary = [];
                if (enchargesInstalled) {
                    this.ensemble.encharges.devices = [];
                    const type = CONSTANTS.ApiCodes[ensembleInventory[0].type];
                    encharges.forEach((encharge, index) => {
                        const obj = {
                            type: type,
                            partNumber: CONSTANTS.PartNumbers[encharge.part_num] ?? encharge.part_num,
                            serialNumber: encharge.serial_num,
                            installed: new Date(encharge.installed * 1000).toLocaleString(),
                            deviceStatus: (Array.isArray(encharge.device_status) && (encharge.device_status).length > 0) ? ((encharge.device_status).map(a => CONSTANTS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
                            lastReportDate: new Date(encharge.last_rpt_date * 1000).toLocaleString(),
                            adminState: encharge.admin_state,
                            adminStateStr: CONSTANTS.ApiCodes[encharge.admin_state_str] ?? 'Unknown',
                            createdDate: new Date(encharge.created_date * 1000).toLocaleString(),
                            imgLoadDate: new Date(encharge.img_load_date * 1000).toLocaleString(),
                            imgPnumRunning: encharge.img_pnum_running,
                            zigbeeDongleFwVersion: encharge.zigbee_dongle_fw_version ?? 'Unknown',
                            bmuFwVersion: encharge.bmu_fw_version,
                            operating: encharge.operating === true ?? false,
                            communicating: encharge.communicating === true,
                            sleepEnabled: encharge.sleep_enabled,
                            percentFull: encharge.percentFull ?? 0,
                            temperature: encharge.temperature ?? 0,
                            maxCellTemp: encharge.maxCellTemp ?? 0,
                            reportedEncGridState: CONSTANTS.ApiCodes[encharge.reported_enc_grid_state] ?? 'Unknown',
                            commLevelSubGhz: encharge.comm_level_sub_ghz * 20 ?? 0,
                            commLevel24Ghz: encharge.comm_level_2_4_ghz * 20 ?? 0,
                            ledStatus: CONSTANTS.LedStatus[encharge.led_status] ?? encharge.led_status,
                            dcSwitchOff: encharge.dc_switch_off,
                            rev: encharge.encharge_rev,
                            capacity: encharge.encharge_capacity / 1000 ?? 0, //in kWh
                            phase: encharge.phase ?? 'Unknown',
                            derIndex: encharge.der_index ?? 0,
                            arfProfile: this.ensemble.arfProfile.name
                        }
                        this.ensemble.encharges.devices.push(obj);

                        //encharges percent full summary
                        enchargesPercentFullSummary.push(obj.percentFull);

                        if (this.enchargesServices) {
                            this.enchargesServices[index]
                                .updateCharacteristic(Characteristic.enphaseEnchargeStatus, obj.deviceStatus)
                                .updateCharacteristic(Characteristic.enphaseEnchargeLastReportDate, obj.lastReportDate)
                                .updateCharacteristic(Characteristic.enphaseEnchargeAdminStateStr, obj.adminStateStr)
                                .updateCharacteristic(Characteristic.enphaseEnchargeOperating, obj.operating)
                                .updateCharacteristic(Characteristic.enphaseEnchargeCommunicating, obj.communicating)
                                .updateCharacteristic(Characteristic.enphaseEnchargeSleepEnabled, obj.sleepEnabled)
                                .updateCharacteristic(Characteristic.enphaseEnchargePercentFull, obj.percentFull)
                                .updateCharacteristic(Characteristic.enphaseEnchargeTemperature, obj.temperature)
                                .updateCharacteristic(Characteristic.enphaseEnchargeMaxCellTemp, obj.maxCellTemp)
                                .updateCharacteristic(Characteristic.enphaseEnchargeCommLevelSubGhz, obj.commLevelSubGhz)
                                .updateCharacteristic(Characteristic.enphaseEnchargeCommLevel24Ghz, obj.commLevel24Ghz)
                                .updateCharacteristic(Characteristic.enphaseEnchargeLedStatus, obj.ledStatus)
                                .updateCharacteristic(Characteristic.enphaseEnchargeDcSwitchOff, obj.dcSwitchOff)
                                .updateCharacteristic(Characteristic.enphaseEnchargeRev, obj.rev)
                                .updateCharacteristic(Characteristic.enphaseEnchargeCapacity, obj.capacity)
                                .updateCharacteristic(Characteristic.enphaseEnchargeGridProfile, obj.arfProfile)
                        }
                    });
                    this.feature.encharges.installed = enchargesInstalled;
                    this.feature.encharges.count = enchargesCount;

                    //calculate encharges percent full summ
                    const enchargesPercentFullSum = (enchargesPercentFullSummary.reduce((total, num) => total + num, 0) / enchargesCount) ?? 0;
                    const enchargesEnergyState = enchargesPercentFullSum > 0;

                    //add encharges percent full sum to ensemble object
                    this.ensemble.enchargesPercentFullSum = enchargesPercentFullSum;
                    this.ensemble.enchargesEnergyState = enchargesEnergyState;

                    if (this.enphaseEnchargesSummaryLevelAndStateService) {
                        this.enphaseEnchargesSummaryLevelAndStateService
                            .updateCharacteristic(Characteristic.On, enchargesEnergyState)
                            .updateCharacteristic(Characteristic.Brightness, enchargesPercentFullSum)
                    }
                }

                //enpowers
                const enpowersSupported = ensembleInventoryKeys.includes('ENPOWER');
                const enpowers = enpowersSupported ? ensembleInventory[1].devices : [];
                const enpowersCount = enpowers.length;
                const enpowersInstalled = enpowersCount > 0;
                if (enpowersInstalled) {
                    this.ensemble.enpowers.devices = [];
                    const type = CONSTANTS.ApiCodes[ensembleInventory[1].type];
                    enpowers.forEach((enpower, index) => {
                        const obj = {
                            type: type,
                            partNumber: CONSTANTS.PartNumbers[enpower.part_num] ?? enpower.part_num,
                            serialNumber: enpower.serial_num,
                            installed: new Date(enpower.installed * 1000).toLocaleString(),
                            deviceStatus: (Array.isArray(enpower.device_status) && (enpower.device_status).length > 0) ? ((enpower.device_status).map(a => CONSTANTS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status',
                            lastReportDate: new Date(enpower.last_rpt_date * 1000).toLocaleString(),
                            adminState: enpower.admin_state,
                            adminStateStr: CONSTANTS.ApiCodes[enpower.admin_state_str] ?? 'Unknown',
                            createdDate: new Date(enpower.created_date * 1000).toLocaleString(),
                            imgLoadDate: new Date(enpower.img_load_date * 1000).toLocaleString(),
                            imgPnumRunning: enpower.img_pnum_running,
                            communicating: enpower.communicating === true,
                            temperature: enpower.temperature ?? 0,
                            commLevelSubGhz: enpower.comm_level_sub_ghz * 20 ?? 0,
                            commLevel24Ghz: enpower.comm_level_2_4_ghz * 20 ?? 0,
                            mainsAdminState: CONSTANTS.ApiCodes[enpower.mains_admin_state] ?? 'Unknown',
                            mainsAdminStateBool: CONSTANTS.ApiCodes[enpower.mains_admin_state] === 'Closed' ?? false,
                            mainsOperState: CONSTANTS.ApiCodes[enpower.mains_oper_state] ?? 'Unknown',
                            mainsOperStateBool: CONSTANTS.ApiCodes[enpower.mains_oper_sate] === 'Closed' ?? false,
                            enpwrGridMode: enpower.Enpwr_grid_mode ?? 'Unknown',
                            enpwrGridModeTranslated: CONSTANTS.ApiCodes[enpower.Enpwr_grid_mode] ?? enpower.Enpwr_grid_mode,
                            enchgGridMode: enpower.Enchg_grid_mode ?? 'Unknown',
                            enchgGridModeTranslated: CONSTANTS.ApiCodes[enpower.Enchg_grid_mode] ?? enpower.Enchg_grid_mode,
                            enpwrRelayStateBm: enpower.Enpwr_relay_state_bm ?? 0,
                            enpwrCurrStateId: enpower.Enpwr_curr_state_id ?? 0,
                            arfProfile: this.ensemble.arfProfile.name,
                            status: {}
                        }
                        this.ensemble.enpowers.devices.push(obj);

                        if (this.enpowersServices) {
                            this.enpowersServices[index]
                                .updateCharacteristic(Characteristic.enphaseEnpowerStatus, obj.deviceStatus)
                                .updateCharacteristic(Characteristic.enphaseEnpowerLastReportDate, obj.lastReportDate)
                                .updateCharacteristic(Characteristic.enphaseEnpowerAdminStateStr, obj.adminStateStr)
                                //.updateCharacteristic(Characteristic.enphaseEnpowerOperating, obj.operating)
                                .updateCharacteristic(Characteristic.enphaseEnpowerCommunicating, obj.communicating)
                                .updateCharacteristic(Characteristic.enphaseEnpowerTemperature, obj.temperature)
                                .updateCharacteristic(Characteristic.enphaseEnpowerCommLevelSubGhz, obj.commLevelSubGhz)
                                .updateCharacteristic(Characteristic.enphaseEnpowerCommLevel24Ghz, obj.commLevel24Ghz)
                                .updateCharacteristic(Characteristic.enphaseEnpowerMainsAdminState, obj.mainsAdminState)
                                .updateCharacteristic(Characteristic.enphaseEnpowerMainsOperState, obj.mainsOperState)
                                .updateCharacteristic(Characteristic.enphaseEnpowerEnpwrGridMode, obj.enpwrGridModeTranslated)
                                .updateCharacteristic(Characteristic.enphaseEnpowerEnchgGridMode, obj.enchgGridModeTranslated)
                                .updateCharacteristic(Characteristic.enphaseEnpowerGridProfile, obj.arfProfile)
                        }

                        //enpower grid control
                        if (this.enpowerGridStateActiveControlsCount > 0) {
                            for (let i = 0; i < this.enpowerGridStateActiveControlsCount; i++) {
                                const state = obj.mainsAdminStateBool;
                                this.enpowerGridStateActiveControls[i].state = state;

                                if (this.enpowerGridStateControlsServices) {
                                    const characteristicType = this.enpowerGridStateActiveControls[i].characteristicType;
                                    this.enpowerGridStateControlsServices[i]
                                        .updateCharacteristic(characteristicType, state)
                                }

                                if (this.envoyService) {
                                    this.envoyService
                                        .updateCharacteristic(Characteristic.enphaseEnvoyEnpowerGridState, state)
                                }
                            }
                        }

                        //enpower grid state sensor
                        if (this.enpowerGridStateActiveSensorsCount > 0) {
                            for (let i = 0; i < this.enpowerGridStateActiveSensorsCount; i++) {
                                const state = obj.mainsAdminStateBool;
                                this.enpowerGridStateActiveSensors[i].state = state;

                                if (this.enpowerGridStateSensorsServices) {
                                    const characteristicType = this.enpowerGridStateActiveSensors[i].characteristicType;
                                    this.enpowerGridStateSensorsServices[i]
                                        .updateCharacteristic(characteristicType, state)
                                }
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

                        //update envoy section
                        if (this.envoyService) {
                            this.envoyService
                                .updateCharacteristic(Characteristic.enphaseEnvoyEnpowerGridMode, obj.enpwrGridModeTranslated)
                        }
                    });
                    this.feature.ensembles.installed = enchargesInstalled && enpowersInstalled;
                    this.feature.enpowers.supported = enpowersSupported;
                    this.feature.enpowers.installed = enpowersInstalled;
                    this.feature.enpowers.count = enpowersCount;
                }

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('ensembleinventory', ensembleInventory) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Ensemble Inventory', ensembleInventory) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting ensemble inventory error: ${error}.`);
            };
        });
    };

    updateEnsembleStatusData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting ensemble status.`) : false;

            try {
                const ensembleStatusData = await this.axiosInstance(CONSTANTS.ApiUrls.EnsembleStatus);
                const ensembleStatus = ensembleStatusData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Ensemble status: ${JSON.stringify(ensembleStatus, null, 2)}`) : false;

                //ensemble status keys
                const ensembleStatusKeys = Object.keys(ensembleStatus);
                const ensembleStatusSupported = ensembleStatusKeys.length > 0;

                //ensemble status not exist
                if (!ensembleStatusSupported) {
                    resolve(false);
                    return;
                }

                //inventoty
                const inventorySupported = ensembleStatusKeys.includes('inventory');
                const inventory = inventorySupported ? ensembleStatus.inventory : {};

                //encharges
                //initialize array to hold rated power values
                const enchargesRatedPowerSummary = [];

                //iterate over encharges
                this.ensemble.encharges.devices.forEach((encharge, index) => {
                    const serialNumber = encharge.serialNumber;
                    const enchargeStatus = inventory.serial_nums[serialNumber];
                    const status = {
                        deviceType: enchargeStatus.device_type,
                        comInterfacStr: enchargeStatus.com_interface_str ?? 'Unknown',
                        deviceId: enchargeStatus.device_id ?? 'Unknown',
                        adminState: enchargeStatus.admin_state,
                        adminStateStr: CONSTANTS.ApiCodes[enchargeStatus.admin_state_str] ?? 'Unknown',
                        reportedGridMode: CONSTANTS.ApiCodes[enchargeStatus.reported_grid_mode] ?? 'Unknown',
                        phase: enchargeStatus.phase ?? 'Unknown',
                        derIndex: enchargeStatus.der_index ?? 0,
                        revision: enchargeStatus.encharge_revision ?? 0,
                        capacity: enchargeStatus.encharge_capacity ?? 0,
                        ratedPower: enchargeStatus.encharge_rated_power ?? 0,
                        reportedGridState: CONSTANTS.ApiCodes[enchargeStatus.reported_enc_grid_state] ?? 'Unknown',
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
                    this.ensemble.encharges.status = status;

                    //push encharge rated power to the array
                    enchargesRatedPowerSummary.push(status.ratedPower);
                });

                //sum rated power for all encharges to kW and add to encharge object
                const enchargesRatedPowerSum = (enchargesRatedPowerSummary.reduce((total, num) => total + num, 0) / 1000) ?? 0;

                //add encharges and rated power summ to ensemble object
                this.ensemble.enchargesRatedPowerSum = enchargesRatedPowerSum;

                //enpowers
                //iterate over enpowers
                this.ensemble.enpowers.devices.forEach((enpower, index) => {
                    const serialNumber = enpower.serialNumber;
                    const enpowerStatus = inventory.serial_nums[serialNumber];
                    const status = {
                        deviceType: enpowerStatus.device_type,
                        comInterfacStr: enpowerStatus.com_interface_str ?? 'Unknown',
                        deviceId: enpowerStatus.device_id ?? 'Unknown',
                        adminState: enpowerStatus.admin_state,
                        adminStateStr: CONSTANTS.ApiCodes[enpowerStatus.admin_state_str] ?? 'Unknown',
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
                    this.ensemble.enpowers[index].status = status;
                });

                //ensemble summary
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
                    restPow: counterData.rest_Power ?? 0,
                    restPower: counterData.rest_Power / 1000 ?? 0, //in kW
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
                    aggMaxEnergy: secctrlData.Max_energy / 1000, //in kWh
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

                //update characteristics
                const enchargesPercentFullSum = this.ensemble.enchargesPercentFullSum;
                if (this.ensembleStatusService) {
                    this.ensembleStatusService
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusRestPower, counters.restPower ?? 0)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHz, secctrl.freqBiasHz)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasV, secctrl.voltageBiasV)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8, secctrl.freqBiasHzQ8)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5, secctrl.voltageBiasVQ5)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzPhaseB, secctrl.freqBiasHzPhaseB)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVPhaseB, secctrl.voltageBiasVPhaseB)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8PhaseB, secctrl.freqBiasHzQ8PhaseB)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5PhaseB, secctrl.voltageBiasVQ5PhaseB)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzPhaseC, secctrl.freqBiasHzPhaseC)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVPhaseC, secctrl.voltageBiasVPhaseC)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8PhaseC, secctrl.freqBiasHzQ8PhaseC)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5PhaseC, secctrl.voltageBiasVQ5PhaseC)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusConfiguredBackupSoc, secctrl.configuredBackupSoc)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusAdjustedBackupSoc, secctrl.adjustedBackupSoc)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusAggSoc, secctrl.aggSoc)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusAggMaxEnergy, secctrl.aggMaxEnergy)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusEncAggSoc, secctrl.encAggSoc)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusEncAggRatedPower, enchargesRatedPowerSum)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusEncAggPercentFull, enchargesPercentFullSum)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusEncAggBackupEnergy, secctrl.encAggBackupEnergy)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusEncAggAvailEnergy, secctrl.encAggAvailEnergy)
                }

                //relay
                const relaySupported = ensembleStatusKeys.includes('relay');
                const relayData = relaySupported ? ensembleStatus.relay : {};
                const relay = {
                    mainsAdminState: CONSTANTS.ApiCodes[relayData.mains_admin_state] ?? 'Unknown',
                    mainsAdminStateBool: CONSTANTS.ApiCodes[relayData.mains_admin_state] === 'Closed' ?? false,
                    mainsOperState: CONSTANTS.ApiCodes[relayData.mains_oper_sate] ?? 'Unknown',
                    mainsOperStateBool: CONSTANTS.ApiCodes[relayData.mains_oper_sate] === 'Closed' ?? false,
                    der1State: relayData.der1_state ?? 0,
                    der2State: relayData.der2_state ?? 0,
                    der3State: relayData.der3_state ?? 0,
                    enchgGridMode: relayData.Enchg_grid_mode ?? 'Unknown',
                    enchgGridModeTranslated: CONSTANTS.ApiCodes[relayData.Enchg_grid_mode] ?? relayData.Enchg_grid_mode,
                    solarGridMode: relayData.Solar_grid_mode ?? 'Unknown',
                    solarGridModeTranslated: CONSTANTS.ApiCodes[relayData.Solar_grid_mode] ?? relayData.Solar_grid_mode
                }

                //add relay to ensemble object
                this.ensemble.relay = relay;

                //encharge grid state sensors
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

                //solar grid state sensors
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
                const profile = this.ensemble.arfProfile.name ?? (profileSupported ? ensembleStatus.profile : await this.updateGridProfileData());

                //fakeit
                const fakeInventoryModeSupported = ensembleStatusKeys.includes('fakeit');
                const ensembleFakeInventoryMode = fakeInventoryModeSupported ? ensembleStatus.fakeit.fake_inventory_mode === true : false;

                //ensemble status supported
                this.feature.ensembles.status.supported = ensembleStatusSupported;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('ensemblestatus', ensembleStatus) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Ensemble Status', ensembleStatus) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting ensemble status error: ${error}.`);
            };
        });
    };

    updateEnchargeSettingsData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting encharge settings.`) : false;

            try {
                const enchargeSettingsData = await this.axiosInstance(CONSTANTS.ApiUrls.EnchargeSettings);
                const enchargeSettings = enchargeSettingsData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Encharge settings: ${JSON.stringify(enchargeSettings, null, 2)}`) : false;

                //encharge keys
                const enchargeSettingsKeys = Object.keys(enchargeSettings);
                const enchargeSettingsSupported = enchargeSettingsKeys.includes('enc_settings');

                //encharge settings not exist
                if (!enchargeSettingsSupported) {
                    resolve(false);
                    return;
                }

                const settingsData = enchargeSettings.enc_settings;
                const settings = {
                    enable: settingsData.enable,
                    country: settingsData.country,
                    currentLimit: settingsData.current_limit,
                    perPhase: settingsData.per_phase
                }
                //add encharges settings to ensemble object
                this.ensemble.encharges.settings = settings;

                //update characteristics
                if (this.enchargeProfileSelfConsumptionActiveControlsCount > 0) {
                    for (let i = 0; i < this.enchargeProfileSelfConsumptionActiveControlsCount; i++) {
                        const state = settings.selfConsumptionModeBool;
                        this.generatorStateActiveControls[i].state = state;

                        if (this.enchargeProfileSelfConsumptionActiveControlsServices) {
                            const characteristicType = this.generatorStateActiveControls[i].characteristicType;
                            this.enchargeProfileSelfConsumptionActiveControlsServices[i]
                                .updateCharacteristic(characteristicType, state)
                                .updateCharacteristic(Characteristic.Characteristic.Brightness, settings.reservedSoc)
                        }
                    }
                }

                if (this.enchargeProfileSavingsActiveControlsCount > 0) {
                    for (let i = 0; i < this.enchargeProfileSavingsActiveControlsCount; i++) {
                        const state = settings.savingsModeBool;
                        this.generatorStateActiveControls[i].state = state;

                        if (this.enchargeProfileSavingsActiveControlsServices) {
                            const characteristicType = this.generatorStateActiveControls[i].characteristicType;
                            this.enchargeProfileSavingsActiveControlsServices[i]
                                .updateCharacteristic(characteristicType, state)
                                .updateCharacteristic(Characteristic.Characteristic.Brightness, settings.reservedSoc)
                        }
                    }
                }

                if (this.enchargeProfileFullBackupActiveControlsCount > 0) {
                    for (let i = 0; i < this.enchargeProfileFullBackupActiveControlsCount; i++) {
                        const state = settings.fullBackupModeBool;
                        this.generatorStateActiveControls[i].state = state;

                        if (this.enchargeProfileFullBackupActiveControlsServices) {
                            const characteristicType = this.generatorStateActiveControls[i].characteristicType;
                            this.enchargeProfileFullBackupActiveControlsServices[i]
                                .updateCharacteristic(characteristicType, state)
                        }
                    }
                }

                //encharges settings supported
                this.feature.encharges.settings.supported = enchargeSettingsSupported;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('enchargesettings', enchargeSettings) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Encharge Settings', enchargeSettings) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting encharge settings. error: ${error}.`);
            };
        });
    };

    updateTariffData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting tariff.`) : false;

            try {
                const tariffSettingsData = await this.axiosInstance(CONSTANTS.ApiUrls.TariffSettingsGetPut);
                const tariffSettings = tariffSettingsData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Tariff: ${JSON.stringify(tariffSettings, null, 2)}`) : false;

                //encharge keys
                const tariffSettingsKeys = Object.keys(tariffSettings);
                const tariffSupported = tariffSettingsKeys.includes('tariff');

                //encharge settings not exist
                if (!tariffSupported) {
                    resolve(false);
                    return;
                }

                const tariffData = tariff.tariff
                const tariff = {
                    enable: tariffData.mode,
                    selfConsumptionModeBool: tariffData.mode === 'self-consumption',
                    fullBackupModeBool: tariffData.mode === 'backup',
                    savingsModeBool: (tariffData.mode === 'savings-mode' || tariff.mode === 'economy'),
                    operationModeSubType: tariffData.operation_mode_sub_type,
                    reservedSoc: tariffData.reserved_soc,
                    veryLowSoc: tariffData.very_low_soc,
                    chargeFromGrid: tariffData.charge_from_grid,
                    date: tariffData.date ?? new Date()
                }

                //add tariff to ensemble object
                this.ensemble.tariff = tariff;

                //tariff supported
                this.feature.encharges.tariff.supported = tariffSupported;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('tariff', tariffSettings) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Tariff', tariffSettings) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting tariff. error: ${error}.`);
            };
        });
    };

    updateDryContactsData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting dry contacts.`) : false;

            try {
                const ensembleDryContactsData = await this.axiosInstance(CONSTANTS.ApiUrls.DryContacts);
                const ensembleDryContacts = ensembleDryContactsData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Dry contacts: ${JSON.stringify(ensembleDryContacts, null, 2)}`) : false;

                //ensemble dry contacts keys
                const ensembleDryContactsKeys = Object.keys(ensembleDryContacts);
                const dryContactsExist = ensembleDryContactsKeys.includes('dry_contacts');

                //ensemble dry contacts not exist
                if (!dryContactsExist) {
                    resolve(false);
                    return;
                }

                //dry contacts supported
                const dryContacts = ensembleDryContacts.dry_contacts;
                const dryContactsInstalled = dryContacts.length > 0;
                if (!dryContactsInstalled) {
                    resolve(false);
                    return;
                }

                //dry contacte
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
                    if (this.dryContactsSensorsServices) {
                        this.dryContactsSensorsServices[index]
                            .updateCharacteristic(Characteristic.ContactSensorState, obj.stateBool)
                    }
                });

                //dry contacts supported
                this.feature.dryContacts.installed = dryContactsInstalled;
                this.feature.dryContacts.count = dryContacts.length;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('drycontacts', ensembleDryContacts) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Dry Contacts', ensembleDryContacts) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting dry contacts error: ${error}.`);
            };
        });
    };

    updateDryContactsSettingsData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting dry contacts settings.`) : false;

            try {
                const ensembleDryContactsSettingsData = await this.axiosInstance(CONSTANTS.ApiUrls.DryContactsSettings);
                const ensembleDryContactsSettings = ensembleDryContactsSettingsData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Dry contacts settings: ${JSON.stringify(ensembleDryContactsSettings, null, 2)}`) : false;

                //ensemble dry contacts settings keys
                const ensembleDryContactsKeys = Object.keys(ensembleDryContactsSettings);
                const ensembleDryContactsExist = ensembleDryContactsKeys.includes('dry_contacts');

                //ensemble dry contacts settings not exist
                if (!ensembleDryContactsExist) {
                    resolve(false);
                    return;
                }

                //dry contacts installed
                const dryContactsSettings = ensembleDryContactsSettings.dry_contacts;
                const dryContactsSettingsSupported = dryContactsSettings.length > 0;
                if (!dryContactsSettingsSupported) {
                    resolve(false);
                    return;
                }

                //dry contacts settings array
                const settings = ensembleDryContactsSettings.dry_contacts;
                settings.forEach((setting, index) => {
                    const obj = {
                        id: setting.id, //str NC1
                        type: setting.type, //str NONE
                        gridAction: setting.grid_action, //str apply
                        microGridAction: setting.micro_grid_action, //str apply
                        genAction: setting.gen_action, //str apply
                        essentialStartTime: setting.essential_start_time ?? '', //flota
                        essentialEndTime: setting.essential_end_time ?? '', //flota
                        priority: setting.priority ?? 0, //flota
                        blackSStart: setting.black_s_start ?? 0, //flota
                        override: setting.override ?? 'false', //str bool
                        overrideBool: setting.override === 'true' ?? false, //bool
                        manualOverride: setting.manual_override ?? 'false', //str bool
                        manualOverrideBool: setting.manual_override === 'true' ?? false, // bool
                        loadName: setting.load_name != '' ? setting.load_name : `Dry contact ${index}.`, //str
                        mode: setting.mode, //str manual
                        socLow: setting.soc_low, //flota
                        socHigh: setting.soc_high, //flota
                        pvSerialNb: setting.pv_serial_nb, //array
                    }
                    this.ensemble.dryContacts[index].settings = obj;
                });

                //dry contacts settings supported
                this.feature.dryContacts.settings.supported = dryContactsSettingsSupported;
                this.feature.dryContacts.settings.count = dryContactsSettings.length;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('drycontactssettings', ensembleDryContactsSettings) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Dry Contacts Settings', ensembleDryContactsSettings) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting dry contacts settings error: ${error}.`);
            };
        });
    };

    updateGeneratorData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting generator.`) : false;

            try {
                const ensembleGeneratorData = await this.axiosInstance(CONSTANTS.ApiUrls.Generator);
                const ensembleGenerator = ensembleGeneratorData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Generator: ${JSON.stringify(ensembleGenerator, null, 2)}`) : false;

                //ensemble generator keys
                const generatorKeys = Object.keys(ensembleGenerator);
                const generatorSupported = generatorKeys.length > 0;

                //ensemble generator not exist
                if (!generatorSupported) {
                    resolve(false);
                    return;
                }

                const generator = {
                    adminState: CONSTANTS.ApiCodes[ensembleGenerator.admin_state] ?? 'Unknown',
                    operState: CONSTANTS.ApiCodes[ensembleGenerator.oper_state] ?? 'Unknown',
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
                }
                //add generator to ensemble object
                this.ensemble.generator = generator;

                if (this.generatorService) {
                    this.generatorService
                        .updateCharacteristic(Characteristic.enphaseEnsembleGeneratorAdminState, generator.adminState)
                        .updateCharacteristic(Characteristic.enphaseEnsembleGeneratorOperState, generator.operState)
                        .updateCharacteristic(Characteristic.enphaseEnsembleGeneratorAdminMode, generator.adminMode)
                        .updateCharacteristic(Characteristic.enphaseEnsembleGeneratorShedule, generator.schedule)
                        .updateCharacteristic(Characteristic.enphaseEnsembleGeneratorStartSoc, generator.startSoc)
                        .updateCharacteristic(Characteristic.enphaseEnsembleGeneratorStopSoc, generator.stopSoc)
                        .updateCharacteristic(Characteristic.enphaseEnsembleGeneratorExexOn, generator.excOn)
                        .updateCharacteristic(Characteristic.enphaseEnsembleGeneratorPresent, generator.present)
                        .updateCharacteristic(Characteristic.enphaseEnsembleGeneratorType, generator.type);
                }

                //generator control
                if (this.generatorStateActiveControlsCount > 0) {
                    for (let i = 0; i < this.generatorStateActiveControlsCount; i++) {
                        const state = generator.adminModeOnBool || generator.adminModeAutoBool;
                        this.generatorStateActiveControls[i].state = state;

                        if (this.generatorStateControlsServices) {
                            const characteristicType = this.generatorStateActiveControls[i].characteristicType;
                            this.generatorStateControlsServices[i]
                                .updateCharacteristic(characteristicType, state)
                        }

                        if (this.envoyService) {
                            this.envoyService
                                .updateCharacteristic(Characteristic.enphaseEnvoyGeneratorState, state)
                        }
                    }
                }

                //generator state sensor
                if (this.generatorStateActiveSensorsCount > 0) {
                    for (let i = 0; i < this.generatorStateActiveSensorsCount; i++) {
                        const state = generator.adminMode !== 'Off';
                        this.generatorStateActiveSensors[i].state = state;

                        if (this.generatorStateSensorsServices) {
                            const characteristicType = this.generatorStateActiveSensors[i].characteristicType;
                            this.generatorStateSensorsServices[i]
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

                    if (this.envoyService) {
                        this.envoyService
                            .updateCharacteristic(Characteristic.enphaseEnvoyGeneratorMode, generator.adminMode)
                    }
                }

                //generator installed
                const generatorInstalled = generator.adminState !== 'Unknown';
                this.feature.generators.supported = generatorSupported;
                this.feature.generators.installed = generatorInstalled;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('generator', ensembleGenerator) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Generator', ensembleGenerator) : false;
                resolve(generatorInstalled);
            } catch (error) {
                reject(`Requesting generator error: ${error}.`);
            };
        });
    };

    updateGeneratorSettingsData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting generator settings`) : false;

            try {
                const ensembleGeneratorSettingsData = await this.axiosInstance(CONSTANTS.ApiUrls.GeneratorSettingsGetSet);
                const ensembleGeneratorSettings = ensembleGeneratorSettingsData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Generator settings: ${JSON.stringify(ensembleGeneratorSettings, null, 2)}`) : false;

                //ensemble generator settings keys
                const generatorSettingsKeys = Object.keys(ensembleGeneratorSettings);
                const generatorSettingsSupported = generatorSettingsKeys.length > 0;

                //ensemble generator settings not exist
                if (!generatorSettingsSupported) {
                    resolve(false);
                    return;
                }

                const settings = ensembleGeneratorSettings.generator_settings;
                const generatorSettings = {
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
                }

                //add generator settings to ensemble generator object
                this.ensemble.generator.settings = generatorSettings;

                //generator settings supported
                this.feature.generators.settings.supported = generatorSettingsSupported;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('generatorsettings', ensembleGeneratorSettings) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Generator Settings', ensembleGeneratorSettings) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting generator settings error: ${error}.`);
            };
        });
    };

    updateLiveData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting live data.`) : false;

            try {
                const liveData = await this.axiosInstance(CONSTANTS.ApiUrls.LiveDataStatus);
                const live = liveData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Live data: ${JSON.stringify(live, null, 2)}`) : false;

                //live data keys
                const liveDadaKeys = Object.keys(live);
                const liveDataSupported = liveDadaKeys.length > 0;

                //live data supported
                if (!liveDataSupported) {
                    resolve(false);
                    return;
                }

                //connection
                const lconnectionSupported = liveDadaKeys.includes('connection');
                const connection = lconnectionSupported ? live.connection : {};
                const connectionMqttState = connection.mqtt_state;
                const connectionProvState = connection.prov_state;
                const connectionAuthState = connection.auth_state;
                const connectionScStream = connection.sc_stream === 'enabled';
                const connectionScDebug = connection.sc_debug === 'enabled';

                //enable live data stream if not enabled
                const setLiveDataStream = !connectionScStream ? await this.setLiveDataStream() : false;

                //meters
                const liveDataMetersSupported = liveDadaKeys.includes('meters');
                const liveDataMeters = liveDataMetersSupported ? live.meters : {};
                const metersLastUpdate = liveDataMeters.last_update;
                const metersSoc = liveDataMeters.soc;
                const metersMainRelayState = liveDataMeters.main_relay_state;
                const metersGenRelayState = liveDataMeters.gen_relay_state;
                const metersBackupBatMode = liveDataMeters.backup_bat_mode;
                const metersBackupSoc = liveDataMeters.backup_soc;
                const metersIsSplitPhase = liveDataMeters.is_split_phase;
                const metersPhaseCount = liveDataMeters.phase_count;
                const metersEncAggSoc = liveDataMeters.enc_agg_soc;
                const metersEncAggEnergy = liveDataMeters.enc_agg_energy;
                const metersAcbAggSoc = liveDataMeters.acb_agg_soc;
                const metersAcbAggEnergy = liveDataMeters.acb_agg_energy;

                //lived data meteres types add to array
                const liveDataTypes = [];
                const pushPvTypeToArray = this.feature.meters.installed && (this.feature.meters.production.enabled || this.feature.meters.consumption.enabled) ? liveDataTypes.push({ type: 'PV', meter: liveDataMeters.pv }) : false;
                const pushStorageTypeToArray = this.feature.meters.installed && this.feature.meters.storage.enabled ? liveDataTypes.push({ type: 'Storage', meter: liveDataMeters.storage }) : false;
                const pushGridTypeToArray = this.feature.meters.installed && this.feature.meters.consumption.enabled ? liveDataTypes.push({ type: 'Grid', meter: liveDataMeters.grid }) : false;
                const pushLoadTypeToArray = this.feature.meters.installed && this.feature.meters.consumption.enabled ? liveDataTypes.push({ type: 'Load', meter: liveDataMeters.load }) : false;
                const pushGeneratorTypeToArray = this.feature.meters.installed && this.feature.generators.installed ? liveDataTypes.push({ type: 'Generator', meter: liveDataMeters.generator }) : false;

                //live data exist
                const liveDataExist = liveDataTypes.length > 0;
                if (!liveDataExist) {
                    resolve(false);
                    return;
                }

                //read meters data
                this.pv.liveData.devices = [];
                liveDataTypes.forEach((liveDataType, index) => {
                    const obj = {
                        type: liveDataType.type,
                        activePower: liveDataType.meter.agg_p_mw / 1000000 || 0,
                        apparentPower: liveDataType.meter.agg_s_mva / 1000000 || 0,
                        activePowerL1: liveDataType.meter.agg_p_ph_a_mw / 1000000 || 0,
                        activePowerL2: liveDataType.meter.agg_p_ph_b_mw / 1000000 || 0,
                        activePowerL3: liveDataType.meter.agg_p_ph_c_mw / 1000000 || 0,
                        apparentPowerL1: liveDataType.meter.agg_s_ph_a_mva / 1000000 || 0,
                        apparentPowerL2: liveDataType.meter.agg_s_ph_b_mva / 1000000 || 0,
                        apparentPowerL3: liveDataType.meter.agg_s_ph_c_mva / 1000000 || 0,
                        taask: {},
                        counters: {},
                        dryContacts: {}
                    }
                    this.pv.liveData.devices.push(obj);

                    if (this.liveDataMetersServices) {
                        this.liveDataMetersServices[index]
                            .updateCharacteristic(Characteristic.enphaseLiveDataActivePower, obj.activePower)
                            .updateCharacteristic(Characteristic.enphaseLiveDataActivePowerL1, obj.activePowerL1)
                            .updateCharacteristic(Characteristic.enphaseLiveDataActivePowerL2, obj.activePowerL2)
                            .updateCharacteristic(Characteristic.enphaseLiveDataActivePowerL3, obj.activePowerL3)
                            .updateCharacteristic(Characteristic.enphaseLiveDataApparentPower, obj.apparentPower)
                            .updateCharacteristic(Characteristic.enphaseLiveDataApparentPowerL1, obj.apparentPowerL1)
                            .updateCharacteristic(Characteristic.enphaseLiveDataApparentPowerL2, obj.apparentPowerL2)
                            .updateCharacteristic(Characteristic.enphaseLiveDataApparentPowerL3, obj.apparentPowerL3)
                    }
                });

                //encharge backup level sensors
                if (this.enchargeBackupLevelActiveSensorsCount > 0) {
                    for (let i = 0; i < this.enchargeBackupLevelActiveSensorsCount; i++) {
                        const backupLevel = this.enchargeBackupLevelActiveSensors[i].backupLevel;
                        const compareMode = this.enchargeBackupLevelActiveSensors[i].compareMode;
                        let state = false;
                        switch (compareMode) {
                            case 0:
                                state = metersBackupSoc > backupLevel;
                                break;
                            case 1:
                                state = metersBackupSoc >= backupLevel;
                                break;
                            case 2:
                                state = metersBackupSoc === backupLevel;
                                break;
                            case 3:
                                state = metersBackupSoc < backupLevel;
                                break;
                            case 4:
                                state = metersBackupSoc <= backupLevel;
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

                //tasks
                const tasksSupported = liveDadaKeys.includes('tasks');
                const tasksData = tasksSupported ? live.tasks : {};
                const task = {
                    tasksId: tasksData.task_id,
                    tasksTimeStamp: tasksData.timestamp
                };
                this.pv.liveData.task = task;

                //counters
                const countersSupported = liveDadaKeys.includes('counters');
                const countersData = countersSupported ? live.counters : {};
                const counters = {
                    countersMainCfgLoad: countersData.main_CfgLoad,
                    countersMainCfgChanged: countersData.main_CfgChanged,
                    countersSigHup: countersData.main_sigHUP,
                    countersMgttClientPublish: countersData.MqttClient_publish,
                    countersMgttClientLiveDebug: countersData.MqttClient_live_debug,
                    countersMgttClientRespond: countersData.MqttClient_respond,
                    countersMgttClientMsgarrvd: countersData.MqttClient_msgarrvd,
                    countersMgttClientCreate: countersData.MqttClient_create,
                    countersMgttClientSetCallbacks: countersData.MqttClient_setCallbacks,
                    countersMgttClientConnect: countersData.MqttClient_connect,
                    countersMgttClientSubscribe: countersData.MqttClient_subscribe,
                    countersSslKeysCreate: countersData.SSL_Keys_Create,
                    countersScHdlDataPub: countersData.sc_hdlDataPub,
                    countersScSendStreamCtrl: countersData.sc_SendStreamCtrl,
                    countersScSendDemandRspCtrl: countersData.sc_SendDemandRspCtrl,
                    countersRestStatus: countersData.rest_Status
                };
                this.pv.liveData.counters = counters;

                //dry contacts
                const dryContactsSupported = liveDadaKeys.includes('dry_contacts');
                const dryContactsData = dryContactsSupported ? live.dry_contacts[''] : {};
                const dryContacts = {
                    dryContactId: dryContactsData.dry_contact_id ?? '',
                    dryContactLoadName: dryContactsData.dry_contact_load_name ?? '',
                    dryContactStatus: dryContactsData.dry_contact_status ?? 0
                };
                this.pv.liveData.dryContacts = dryContacts;

                //live data installed
                this.feature.liveData.supported = liveDataSupported;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('livedata', live) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Live Data', live) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting live data error: ${error}.`);
            };
        });
    };

    updatePlcLevelData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting plc level.`) : false;

            try {
                const options = {
                    method: 'GET',
                    baseURL: this.url,
                    headers: {
                        Accept: 'application/json'
                    }
                }

                const plcLevelData = this.envoyFirmware7xx ? await this.axiosInstance(CONSTANTS.ApiUrls.InverterComm) : await this.digestAuthInstaller.request(CONSTANTS.ApiUrls.InverterComm, options);
                const plcLevel = plcLevelData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Plc level: ${JSON.stringify(plcLevel, null, 2)}`) : false;

                // get comm level data
                if (this.feature.microinverters.installed) {
                    this.pv.microinverters.forEach((microinverter, index) => {
                        const key = `${microinverter.serialNumber}`;
                        const value = (plcLevel[key] ?? 0) * 20;

                        //add microinverters comm level to microinverters and pv object
                        this.pv.microinverters[index].commLevel = value;

                        if (this.microinvertersServices) {
                            this.microinvertersServices[index]
                                .updateCharacteristic(Characteristic.enphaseMicroinverterCommLevel, value)
                        };
                    });
                }

                if (this.feature.acBatteries.installed) {
                    this.acBatteries.devices.forEach((acBatterie, index) => {
                        const key = `${acBatterie.serialNumber}`;
                        const value = (plcLevel[key] ?? 0) * 20;

                        //add ac batteries comm level to ac batteries and pv object
                        this.pv.acBatteries.devices[index].commLevel = value;

                        if (this.acBatteriesServices) {
                            this.acBatteriesServices[index]
                                .updateCharacteristic(Characteristic.enphaseAcBatterieCommLevel, value)
                        };
                    });
                }


                if (this.feature.qRelays.installed) {
                    this.pv.qRelays.forEach((qRelay, index) => {
                        const key = `${qRelay.serialNumber}`;
                        const value = (plcLevel[key] ?? 0) * 20;

                        //add qrelays comm level to qrelays and pv object
                        this.pv.qRelays[index].commLevel = value;

                        if (this.qRelaysServices) {
                            this.qRelaysServices[index]
                                .updateCharacteristic(Characteristic.enphaseQrelayCommLevel, value)
                        };
                    });
                }

                if (this.feature.encharges.installed) {
                    this.ensemble.encharges.devices.forEach((encharge, index) => {
                        const key = `${encharge.serialNumber}`;
                        const value = (plcLevel[key] ?? 0) * 20;

                        //add encharges comm level to ensemble and encharges object
                        this.ensemble.encharges.devices[index].commLevel = value;

                        if (this.enchargesServices) {
                            this.enchargesServices[index]
                                .updateCharacteristic(Characteristic.enphaseEnchargeCommLevel, value)
                        }
                    });
                }

                //update plc level control state
                if (this.envoyService) {
                    this.envoyService
                        .updateCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel, false);
                }

                if (this.plcLevelActiveControlsCount > 0) {
                    for (let i = 0; i < this.plcLevelActiveControlsCount; i++) {
                        this.plcLevelActiveControls[i].state = false;

                        if (this.plcLevelControlsServices) {
                            const characteristicType = this.plcLevelActiveControls[i].characteristicType;
                            this.plcLevelControlsServices[i]
                                .updateCharacteristic(characteristicType, false)
                        }
                    }
                }

                //check comm level supported
                this.feature.commLevel.supported = true;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('plclevel', plcLevel) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'PLC Level', plcLevel) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting plc level error: ${error}.`);
            };
        });
    };

    setLiveDataStream() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting live data stream enable.`) : false;

            try {
                //create axios instance post with token and data
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
                const url = this.url + CONSTANTS.ApiUrls.LiveDataStream;
                const setLiveDataStream = await axios.post(url, { 'enable': 1 }, options);
                const debug = this.enableDebugMode ? this.emit('debug', `Live data stream enable: ${JSON.stringify(setLiveDataStream.data, null, 2)}`) : false;
                resolve();
            } catch (error) {
                reject(`Requesting live data stream eenable rror: ${error}.`);
            };
        });
    };

    setProductionPowerMode(state) {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Set production power mode.`) : false;

            try {
                const powerModeUrl = CONSTANTS.ApiUrls.PowerForcedModeGetPut.replace("EID", this.envoyDevId);
                const data = JSON.stringify({
                    length: 1,
                    arr: [state ? 0 : 1]
                });

                const options = {
                    method: 'PUT',
                    baseURL: this.url,
                    data: data,
                    headers: {
                        Accept: 'application/json'
                    }
                }

                const productionPowerModeData = this.pv.productionPowerMode !== state ? (this.envoyFirmware7xx ? await this.axiosInstance(powerModeUrl) : await this.digestAuthInstaller.request(powerModeUrl, options)) : false;
                const debug = this.enableDebugMode ? this.emit('debug', `Set production power mode: ${JSON.stringify(productionPowerModeData.data, null, 2)}`) : false;
                resolve();
            } catch (error) {
                reject(`Set production power mode error: ${error}.`);
            };
        });
    }

    setEnchargeProfile(profile, reserve, independence) {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Set encharge profile.`) : false;

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

                const url = this.url + CONSTANTS.ApiUrls.TariffSettingsGetPut;
                const enchargeProfileSet = await axios.put(url, {
                    tariff: {
                        mode: profile, //str economy/savings-mode, backup, self-consumption
                        operation_mode_sub_type: '', //str
                        reserved_soc: reserve, //float
                        very_low_soc: this.ensemble.encharges.settings.veryLowSoc, //int
                        charge_from_grid: independence //bool
                    }
                }, options);
                const debug = this.enableDebugMode ? this.emit('debug', `Set encharge profile: ${JSON.stringify(enchargeProfileSet.data, null, 2)}`) : false;
                resolve();
            } catch (error) {
                reject(`Set encharge profile error: ${error}.`);
            };
        });
    };

    setEnpowerGridState(state) {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Set enpower grid state.`) : false;

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
                const url = this.url + CONSTANTS.ApiUrls.EnchargeRelay;
                const enpowerGridState = await axios.post(url, { 'mains_admin_state': gridState }, options);
                const debug = this.enableDebugMode ? this.emit('debug', `Set enpower grid state: ${JSON.stringify(enpowerGridState.data, null, 2)}`) : false;
                resolve();
            } catch (error) {
                reject(`Set enpower grid state error: ${error}.`);
            };
        });
    };

    setDryContact(id, state) {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Set dry contact.`) : false;

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

                const dryState = state ? 'closed' : 'open';
                const url = this.url + CONSTANTS.ApiUrls.DryContacts;
                const dryContactSet = await axios.post(url, { dry_contacts: { id: id, status: dryState } }, options);
                const debug = this.enableDebugMode ? this.emit('debug', `Set dry contact: ${JSON.stringify(dryContactSet.data, null, 2)}`) : false;
                resolve();
            } catch (error) {
                reject(`Set dry contact error: ${error}.`);
            };
        });
    }

    setDryContactSettings(id, index, state) {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Set dry contact settings.`) : false;

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
                const url = this.url + CONSTANTS.ApiUrls.DryContactsSettings;
                const dryContactSet = await axios.post(url, {
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
                const debug = this.enableDebugMode ? this.emit('debug', `Set dry contact settings: ${JSON.stringify(dryContactSet.data, null, 2)}`) : false;
                resolve();
            } catch (error) {
                reject(`Set dry contact settings error: ${error}.`);
            };
        });
    }

    setGeneratorMode(mode) {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Set generator state.`) : false;

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

                const genMode = ['off', 'on', 'auto'][mode];
                const url = this.url + CONSTANTS.ApiUrls.GeneratorModeGetSet;
                const generatorState = await axios.post(url, { 'gen_cmd': genMode }, options);
                const debug = this.enableDebugMode ? this.emit('debug', `Set generator state: ${JSON.stringify(generatorState.data, null, 2)}`) : false;
                resolve();
            } catch (error) {
                reject(`Set generator state error: ${error}.`);
            };
        });
    };

    getDeviceInfo() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting device info.`) : false;

        //debug objects
        const debug20 = this.enableDebugMode && this.feature.envoy.installed ? this.emit('debug', `Pv object: ${JSON.stringify(this.pv, null, 2)}`) : false;
        const debug21 = this.enableDebugMode && this.feature.ensembles.installed ? this.emit('debug', `Ensemble object: ${JSON.stringify(this.ensemble, null, 2)}`) : false;

        //display info
        this.emit('devInfo', `-------- ${this.name} --------`);
        this.emit('devInfo', `Manufacturer: Enphase`);
        this.emit('devInfo', `Model: ${this.pv.envoy.modelName}`);
        this.emit('devInfo', `Firmware: ${this.pv.envoy.firmware}`);
        this.emit('devInfo', `SerialNr: ${this.pv.envoy.serialNumber}`);
        this.emit('devInfo', `Time: ${this.pv.envoy.time}`);
        const displayLog = this.envoyFirmware7xx && this.envoyFirmware7xxTokenGenerationMode === 0 ? this.emit('devInfo', `Token Valid: ${new Date(this.jwtToken.expires_at * 1000).toLocaleString()}`) : false;
        this.emit('devInfo', `------------------------------`);
        this.emit('devInfo', `Q-Relays: ${this.feature.qRelays.count}`);
        this.emit('devInfo', `Inverters: ${this.feature.microinverters.count}`);
        const displayLog12 = this.feature.acBatteries.installed ? this.emit('devInfo', `AC Batteries: ${this.feature.acBatteries.count}`) : false;
        this.emit('devInfo', `--------------------------------`);
        const displayLog0 = this.feature.meters.supported ? this.emit('devInfo', `Meters: Yes`) : false;
        const displayLog1 = this.feature.meters.supported && this.feature.meters.production.supported ? this.emit('devInfo', `Production: ${this.feature.meters.production.enabled ? `Enabled` : `Disabled`}`) : false;
        const displayLog2 = this.feature.meters.supported && this.feature.meters.consumption.supported ? this.emit('devInfo', `Consumption: ${this.feature.meters.consumption.enabled ? `Enabled` : `Disabled`}`) : false;
        const displayLog3 = this.feature.meters.supported && this.feature.meters.storage.supported ? this.emit('devInfo', `Storage: ${this.feature.meters.storage.enabled ? `Enabled` : `Disabled`}`) : false;
        const displayLog4 = this.feature.meters.supported ? this.emit('devInfo', `--------------------------------`) : false;
        const displayLog5 = this.feature.ensembles.installed ? this.emit('devInfo', `Ensemble: Yes`) : false;
        const displayLog6 = this.feature.enpowers.installed ? this.emit('devInfo', `Enpowers: ${this.feature.enpowers.count}`) : false;
        const displayLog7 = this.feature.encharges.installed ? this.emit('devInfo', `Encharges: ${this.feature.encharges.count}`) : false;
        const displayLog8 = this.feature.dryContacts.installed ? this.emit('devInfo', `Dry Contacts: ${this.feature.dryContacts.count}`) : false;
        const displayLog9 = this.feature.generators.installed ? this.emit('devInfo', `Generator: Yes`) : false;
        const displayLog10 = this.feature.wirelessConnectionKit.installed ? this.emit('devInfo', `Wireless Kit: ${this.feature.wirelessConnectionKit.count}`) : false;
        const displayLog11 = this.feature.ensembles.installed || this.feature.enpowers.installed || this.feature.encharges.installed || this.feature.dryContacts.installed || this.feature.wirelessConnectionKit.installed || this.feature.generators.installed ? this.emit('devInfo', `--------------------------------`) : false;
    };

    //Prepare accessory
    prepareAccessory() {
        return new Promise((resolve, reject) => {
            try {
                //prepare accessory
                const debug = this.enableDebugMode ? this.emit('debug', `Prepare accessory`) : false;
                const accessoryName = this.name;
                const accessoryUUID = AccessoryUUID.generate(this.pv.envoy.serialNumber);
                const accessoryCategory = Categories.OTHER;
                const accessory = new Accessory(accessoryName, accessoryUUID, accessoryCategory);

                //information service
                const debug1 = this.enableDebugMode ? this.emit('debug', `Prepare Information Service`) : false;
                accessory.getService(Service.AccessoryInformation)
                    .setCharacteristic(Characteristic.Manufacturer, 'Enphase')
                    .setCharacteristic(Characteristic.Model, this.pv.envoy.modelName ?? 'Model Name')
                    .setCharacteristic(Characteristic.SerialNumber, this.pv.envoy.serialNumber ?? 'Serial Number')
                    .setCharacteristic(Characteristic.FirmwareRevision, this.pv.envoy.firmware.replace(/[a-zA-Z]/g, '') ?? '0');

                //get enabled devices
                const envoyInstalled = this.feature.envoy.installed;
                const wirelessConnectionKitInstalled = this.feature.wirelessConnectionKit.installed;
                const productionPowerModeSupported = this.feature.productionPowerMode.supported;
                const plcLevelSupported = this.feature.commLevel.supported;
                const qRelaysInstalled = this.feature.qRelays.installed;
                const metersSupported = this.feature.meters.supported;
                const metersInstalled = this.feature.meters.installed;
                const metersProductionEnabled = this.feature.meters.production.enabled;
                const metersConsumptionEnabled = this.feature.meters.consumption.enabled;
                const acBatteriesInstalled = this.feature.acBatteries.installed;
                const microinvertersInstalled = this.feature.microinverters.installed;
                const ensemblesInventoryInstalled = this.feature.ensembles.inventory.installed;
                const ensemblesInstalled = this.feature.ensembles.installed;
                const ensembleStatusSupported = this.feature.ensembles.status.supported;
                const enpowersInstalled = this.feature.enpowers.installed;
                const enchargesInstalled = this.feature.encharges.installed;
                const enchargeSettingsSupported = this.feature.encharges.settings.supported;
                const dryContactsInstalled = this.feature.dryContacts.installed;
                const generatorsInstalled = this.feature.generators.installed;
                const liveDataSupported = this.feature.liveData.supported;

                //system
                if (envoyInstalled) {
                    const serialNumber = this.pv.envoy.serialNumber;
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare System Service`) : false;
                    this.systemService = accessory.addService(Service.Lightbulb, accessoryName, `systemPvService`);
                    this.systemService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                    this.systemService.setCharacteristic(Characteristic.ConfiguredName, accessoryName);
                    this.systemService.getCharacteristic(Characteristic.On)
                        .onGet(async () => {
                            const state = this.pv.production.ct.powerState;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production power state: ${state ? 'Enabled' : 'Disabled'}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            this.systemService.updateCharacteristic(Characteristic.On, this.pv.production.ct.powerState);
                        })
                    this.systemService.getCharacteristic(Characteristic.Brightness)
                        .onGet(async () => {
                            const state = this.pv.production.ct.powerLevel;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production power level: ${this.pv.production.ct.powerLevel} %`);
                            return state;
                        })
                        .onSet(async (value) => {
                            this.systemService.updateCharacteristic(Characteristic.Brightness, this.pv.production.ct.powerLevel);
                        })

                    //data refresh control service
                    if (this.dataRefreshActiveControlsCount > 0) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Data Refresh Control Service`) : false;
                        this.dataRefreshControlsServices = [];
                        for (let i = 0; i < this.dataRefreshActiveControlsCount; i++) {
                            const controlName = this.dataRefreshActiveControls[i].namePrefix ? `${accessoryName} ${this.dataRefreshActiveControls[i].name}` : this.dataRefreshActiveControls[i].name;
                            const serviceType = this.dataRefreshActiveControls[i].serviceType;
                            const characteristicType = this.dataRefreshActiveControls[i].characteristicType;
                            const dataRefreshContolService = accessory.addService(serviceType, controlName, `dataRefreshControlService${i}`);
                            dataRefreshContolService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            dataRefreshContolService.setCharacteristic(Characteristic.ConfiguredName, controlName);
                            dataRefreshContolService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.impulseGenerator.state();
                                    const info = this.disableLogInfo ? false : this.emit('message', `Data refresh control: ${state ? 'Enabled' : 'Disabled'}`);
                                    return state;
                                })
                                .onSet(async (state) => {
                                    try {
                                        const setState = state ? this.impulseGenerator.start(this.timers) : this.impulseGenerator.stop();
                                        const info = this.disableLogInfo ? false : this.emit('message', `Set data refresh control to: ${state ? `Enable` : `Disable`}`);
                                    } catch (error) {
                                        this.emit('error', `Set data refresh contol error: ${error}`);
                                    };
                                })
                            this.dataRefreshControlsServices.push(dataRefreshContolService);
                        };
                    };

                    //data refresh sensor service
                    if (this.dataRefreshActiveSensorsCount > 0) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Data Refresh Sensor Service`) : false;
                        this.dataRefreshSensorsServices = [];
                        for (let i = 0; i < this.dataRefreshActiveSensorsCount; i++) {
                            const sensorName = this.dataRefreshActiveSensors[i].namePrefix ? `${accessoryName} ${this.dataRefreshActiveSensors[i].name}` : this.dataRefreshActiveSensors[i].name;
                            const serviceType = this.dataRefreshActiveSensors[i].serviceType;
                            const characteristicType = this.dataRefreshActiveSensors[i].characteristicType;
                            const dataRefreshSensorService = accessory.addService(serviceType, sensorName, `dataRefreshSensorService${i}`);
                            dataRefreshSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            dataRefreshSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                            dataRefreshSensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.impulseGenerator.state();
                                    const info = this.disableLogInfo ? false : this.emit('message', `Data refresh sensor: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.dataRefreshSensorsServices.push(dataRefreshSensorService);
                        };
                    };

                    //envoy
                    const debug1 = this.enableDebugMode ? this.emit('debug', `Prepare Envoy Service`) : false;
                    this.envoyService = accessory.addService(Service.enphaseEnvoyService, `Envoy ${serialNumber}`, serialNumber);
                    this.envoyService.setCharacteristic(Characteristic.ConfiguredName, `Envoy ${serialNumber}`);
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyAlerts)
                        .onGet(async () => {
                            const value = this.pv.home.alerts;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, alerts: ${value}`);
                            return value;
                        });
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface)
                        .onGet(async () => {
                            const value = this.pv.home.primaryInterface;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, network interface: ${value}`);
                            return value;
                        });
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm)
                        .onGet(async () => {
                            const value = this.pv.home.webComm;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, web communication: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten)
                        .onGet(async () => {
                            const value = this.pv.home.everReportedToEnlighten;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, report to enlighten: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel)
                        .onGet(async () => {
                            const value = (`${this.pv.home.commNum} / ${this.pv.home.commLevel} %`);
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication devices and level: ${value}`);
                            return value;
                        });
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel)
                        .onGet(async () => {
                            const value = (`${this.pv.home.commNsrbNum} / ${this.pv.home.commNsrbLevel} %`);
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication qRelays and level: ${value}`);
                            return value;
                        });
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel)
                        .onGet(async () => {
                            const value = (`${this.pv.home.commPcuNum} / ${this.pv.home.commPcuLevel} %`);
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication Microinverters and level: ${value}`);
                            return value;
                        });
                    if (acBatteriesInstalled) {
                        this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel)
                            .onGet(async () => {
                                const value = (`${this.pv.home.commAcbNum} / ${this.pv.home.commAcbLevel} %`);
                                const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication AC Batteries and level ${value}`);
                                return value;
                            });
                    }
                    if (enchargesInstalled) {
                        this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumEnchgAndLevel)
                            .onGet(async () => {
                                const value = (`${this.pv.home.commEnchgNum} / ${this.pv.home.commEnchgLevel} %`);
                                const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication Encharges and level ${value}`);
                                return value;
                            });
                    }
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyDbSize)
                        .onGet(async () => {
                            const value = `${this.pv.home.dbSize} MB / ${this.pv.home.dbPercentFull} %`;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, data base size: ${value}`);
                            return value;
                        });
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyTariff)
                        .onGet(async () => {
                            const value = this.pv.home.tariff;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, tariff: ${value}`);
                            return value;
                        });
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyUpdateStatus)
                        .onGet(async () => {
                            const value = this.pv.home.updateStatus;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, update status: ${value}`);
                            return value;
                        });
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyFirmware)
                        .onGet(async () => {
                            const value = this.pv.envoy.firmware;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, firmware: ${value}`);
                            return value;
                        });
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyTimeZone)
                        .onGet(async () => {
                            const value = this.pv.home.timeZone;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, time zone: ${value}`);
                            return value;
                        });
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime)
                        .onGet(async () => {
                            const value = `${this.pv.home.currentDate} ${this.pv.home.currentTime}`;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, current date and time: ${value}`);
                            return value;
                        });
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporDate)
                        .onGet(async () => {
                            const value = this.pv.home.lastEnlightenReporDate;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, last report to enlighten: ${value}`);
                            return value;
                        });
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyGridProfile)
                        .onGet(async () => {
                            const value = this.pv.home.arfProfile;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, grid profile: ${value}`);
                            return value;
                        });
                    if (plcLevelSupported) {
                        this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel)
                            .onGet(async () => {
                                const state = false;
                                const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, checking plc level: ${state ? `Yes` : `No`}`);
                                return state;
                            })
                            .onSet(async (state) => {
                                try {
                                    const tokenExpired = await this.checkJwtToken();
                                    const set = !tokenExpired && state ? await this.updatePlcLevelData() : false;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, check plc level: ${state ? `Yes` : `No`}`);
                                } catch (error) {
                                    this.emit('error', `Envoy: ${serialNumber}, check plc level error: ${error}`);
                                };
                            });
                    }
                    if (productionPowerModeSupported) {
                        this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyProductionPowerMode)
                            .onGet(async () => {
                                const state = this.pv.productionPowerMode;
                                const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, production power mode: ${state ? 'Enabled' : 'Disabled'}`);
                                return state;
                            })
                            .onSet(async (state) => {
                                try {
                                    const tokenExpired = await this.checkJwtToken();
                                    const set = !tokenExpired ? await this.setProductionPowerMode(state) : false;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Envoy: ${serialNumber}, set production power mode: ${state ? 'Enabled' : 'Disabled'}`) : false;
                                } catch (error) {
                                    this.emit('error', `Envoy: ${serialNumber}, set production power mode error: ${error}`);
                                };
                            });
                    }
                    if (enpowersInstalled) {
                        this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyEnpowerGridMode)
                            .onGet(async () => {
                                const value = this.ensemble.enpowers.devices[0].enpwrGridModeTranslated;
                                const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, enpower grid mode: ${value}`);
                                return value;
                            });
                        this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyEnpowerGridState)
                            .onGet(async () => {
                                const state = this.ensemble.enpowers.devices[0].mainsAdminStateBool;
                                const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, enpower grid state: ${state ? 'Grid ON' : 'Grid OFF'}`);
                                return state;
                            })
                            .onSet(async (state) => {
                                try {
                                    const tokenExpired = await this.checkJwtToken();
                                    const set = !tokenExpired ? await this.setEnpowerGridState(state) : false;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, set enpower grid state to: ${state ? `Grid ON` : `Grid OFF`}`);
                                } catch (error) {
                                    this.emit('error', `Set enpower grid state error: ${error}`);
                                };
                            })
                    }
                    if (generatorsInstalled) {
                        this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyGeneratorMode)
                            .onGet(async () => {
                                const value = this.ensemble.generator.adminMode;
                                const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, generator mode: ${value}`);
                                return value;
                            });
                        this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyGeneratorState)
                            .onGet(async () => {
                                const state = this.ensemble.generator.adminModeOnBool || this.ensemble.generator.adminModeAutoBool;
                                const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, generator state: ${state ? 'ON' : 'OFF'}`);
                                return state;
                            })
                            .onSet(async (state) => {
                                try {
                                    const genMode = state ? 1 : 0;
                                    const tokenExpired = await this.checkJwtToken();
                                    const set = !tokenExpired ? await this.setGeneratorMode(genMode) : false;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, set generator state to: ${state ? `ON` : `OFF`}`);
                                } catch (error) {
                                    this.emit('error', `Set generator state error: ${error}`);
                                };
                            })
                    }
                    if (this.dataRefreshActiveControlsCount > 0) {
                        this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyDataRefresh)
                            .onGet(async () => {
                                const state = this.impulseGenerator.state();
                                const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, data refresh control: ${state ? 'Enabled' : 'Disabled'}`);
                                return state;
                            })
                            .onSet(async (state) => {
                                try {
                                    const set = state ? this.impulseGenerator.start(this.timers) : this.impulseGenerator.stop();
                                    const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, set data refresh control to: ${state ? `Enable` : `Disable`}`);
                                } catch (error) {
                                    this.emit('error', `Envoy: ${serialNumber}, set data refresh control error: ${error}`);
                                };
                            });
                    };

                    //plc level control service
                    if (this.plcLevelActiveControlsCount > 0 && plcLevelSupported) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Plc Level Control Service`) : false;
                        this.plcLevelControlsServices = [];
                        for (let i = 0; i < this.plcLevelActiveControlsCount; i++) {
                            const controlName = this.plcLevelActiveControls[i].namePrefix ? `${accessoryName} ${this.plcLevelActiveControls[i].name}` : this.plcLevelActiveControls[i].name;
                            const serviceType = this.plcLevelActiveControls[i].serviceType;
                            const characteristicType = this.plcLevelActiveControls[i].characteristicType;
                            const plcLevelContolService = accessory.addService(serviceType, controlName, `plcLevelContolService${i}`);
                            plcLevelContolService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            plcLevelContolService.setCharacteristic(Characteristic.ConfiguredName, controlName);
                            plcLevelContolService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.plcLevelActiveControls[i].state;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Plc level control state: ${state ? 'ON' : 'OFF'}`);
                                    return state;
                                })
                                .onSet(async (state) => {
                                    try {
                                        const genMode = state ? 1 : 0;
                                        const tokenExpired = await this.checkJwtToken();
                                        const set = !tokenExpired ? await this.setGeneratorMode(genMode) : false;
                                        const info = this.disableLogInfo ? false : this.emit('message', `Set plc level control state to: ${state ? `ON` : `OFF`}`);
                                    } catch (error) {
                                        this.emit('error', `Set plc level control state error: ${error}`);
                                    };
                                })
                            this.plcLevelControlsServices.push(plcLevelContolService);
                        };
                    };

                    //power production control service
                    if (this.powerProductionActiveControlsCount > 0 && productionPowerModeSupported) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Power Production Control Service`) : false;
                        this.powerProductionControlsServices = [];
                        for (let i = 0; i < this.powerProductionActiveControlsCount; i++) {
                            const controlName = this.powerProductionActiveControls[i].namePrefix ? `${accessoryName} ${this.powerProductionActiveControls[i].name}` : this.powerProductionActiveControls[i].name;
                            const serviceType = this.powerProductionActiveControls[i].serviceType;
                            const characteristicType = this.powerProductionActiveControls[i].characteristicType;
                            const powerProductionContolService = accessory.addService(serviceType, controlName, `powerProductionContolService${i}`);
                            powerProductionContolService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            powerProductionContolService.setCharacteristic(Characteristic.ConfiguredName, controlName);
                            powerProductionContolService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.powerProductionActiveControls[i].state;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Power production control state: ${state ? 'ON' : 'OFF'}`);
                                    return state;
                                })
                                .onSet(async (state) => {
                                    try {
                                        const genMode = state ? 1 : 0;
                                        const tokenExpired = await this.checkJwtToken();
                                        const set = !tokenExpired ? await this.setGeneratorMode(genMode) : false;
                                        const info = this.disableLogInfo ? false : this.emit('message', `Set power production control state to: ${state ? `ON` : `OFF`}`);
                                    } catch (error) {
                                        this.emit('error', `Set power production control state error: ${error}`);
                                    };
                                })
                            this.powerProductionControlsServices.push(powerProductionContolService);
                        };
                    };

                    //wireless connektion kit
                    if (wirelessConnectionKitInstalled) {
                        this.wirelessConnektionsKitServices = [];
                        for (const wirelessConnection of this.pv.wirelessConnektions) {
                            const connectionType = wirelessConnection.type;
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare Wireless Connection ${connectionType} Service`) : false;
                            const enphaseWirelessConnectionKitService = accessory.addService(Service.enphaseWirelessConnectionKitService, `Wireless connection ${connectionType}`, connectionType);
                            enphaseWirelessConnectionKitService.setCharacteristic(Characteristic.ConfiguredName, `Wireless connection ${connectionType}`);
                            enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitType)
                                .onGet(async () => {
                                    const value = wirelessConnection.type;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Wireless connection: ${connectionType}`);
                                    return value;
                                });
                            enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitConnected)
                                .onGet(async () => {
                                    const value = wirelessConnection.connected;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Wireless connection: ${connectionType}, state: ${value ? 'Connected' : 'Disconnected'}`);
                                    return value;
                                });
                            enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitSignalStrength)
                                .onGet(async () => {
                                    const value = wirelessConnection.signalStrength;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Wireless connection: ${connectionType}, signal strength: ${value} %`);
                                    return value;
                                });
                            enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitSignalStrengthMax)
                                .onGet(async () => {
                                    const value = wirelessConnection.signalStrengthMax;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Wireless connection: ${connectionType}, signal strength max: ${value} %`);
                                    return value;
                                });
                            this.wirelessConnektionsKitServices.push(enphaseWirelessConnectionKitService);
                        }
                    }
                }

                //qrelays
                if (qRelaysInstalled) {
                    this.qRelaysServices = [];
                    for (const qRelay of this.pv.qRelays) {
                        const serialNumber = qRelay.serialNumber;
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Q-Relay ${serialNumber} Service`) : false;
                        const enphaseQrelayService = accessory.addService(Service.enphaseQrelayService, `QRelay ${serialNumber}`, serialNumber);
                        enphaseQrelayService.setCharacteristic(Characteristic.ConfiguredName, `qRelay ${serialNumber}`);
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayState)
                            .onGet(async () => {
                                const value = qRelay.relay;
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${serialNumber}, relay: ${value ? 'Closed' : 'Open'}`);
                                return value;
                            });
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLinesCount)
                            .onGet(async () => {
                                const value = qRelay.linesCount;
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${serialNumber}, lines: ${value}`);
                                return value;
                            });
                        if (qRelay.linesCount > 0) {
                            enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLine1Connected)
                                .onGet(async () => {
                                    const value = qRelay.line1Connected;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${serialNumber}, line 1: ${value ? 'Closed' : 'Open'}`);
                                    return value;
                                });
                        }
                        if (qRelay.linesCount >= 2) {
                            enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLine2Connected)
                                .onGet(async () => {
                                    const value = qRelay.line2Connected;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${serialNumber}, line 2: ${value ? 'Closed' : 'Open'}`);
                                    return value;
                                });
                        }
                        if (qRelay.linesCount >= 3) {
                            enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLine3Connected)
                                .onGet(async () => {
                                    const value = qRelay.line3Connected;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${serialNumber}, line 3: ${value ? 'Closed' : 'Open'}`);
                                    return value;
                                });
                        }
                        // enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayProducing)
                        //   .onGet(async () => {
                        //     const value = qRelay.producing;
                        //   const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${serialNumber}, producing: ${value ? 'Yes' : 'No'}`);
                        // return value;
                        // });
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayCommunicating)
                            .onGet(async () => {
                                const value = qRelay.communicating;
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${serialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayProvisioned)
                            .onGet(async () => {
                                const value = qRelay.provisioned;
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${serialNumber}, provisioned: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayOperating)
                            .onGet(async () => {
                                const value = qRelay.operating;
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${serialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayCommLevel)
                            .onGet(async () => {
                                const value = qRelay.commLevel;
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${serialNumber}, plc level: ${value} %`);
                                return value;
                            });
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayStatus)
                            .onGet(async () => {
                                const value = qRelay.deviceStatus;
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${serialNumber}, status: ${value}`);
                                return value;
                            });
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayFirmware)
                            .onGet(async () => {
                                const value = qRelay.firmware;
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${serialNumber}, firmware: ${value}`);
                                return value;
                            });
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLastReportDate)
                            .onGet(async () => {
                                const value = qRelay.lastReportDate;
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${serialNumber}, last report: ${value}`);
                                return value;
                            });
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayGridProfile)
                            .onGet(async () => {
                                const value = qRelay.arfProfile;
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${serialNumber}, grid profile: ${value}`);
                                return value;
                            });
                        this.qRelaysServices.push(enphaseQrelayService);
                    }
                }

                //microinverters
                if (microinvertersInstalled) {
                    this.microinvertersServices = [];
                    for (const microinverter of this.pv.microinverters) {
                        const serialNumber = microinverter.serialNumber;
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Microinverter ${serialNumber} Service`) : false;
                        const enphaseMicroinverterService = accessory.addService(Service.enphaseMicroinverterService, `Microinverter ${serialNumber}`, serialNumber);
                        enphaseMicroinverterService.setCharacteristic(Characteristic.ConfiguredName, `Microinverter ${serialNumber}`);
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterPower)
                            .onGet(async () => {
                                let value = microinverter.power.lastReportWatts;
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${serialNumber}, last power: ${value} W`);
                                return value;
                            });
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterPowerMax)
                            .onGet(async () => {
                                const value = microinverter.power.maxReportWatts;
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${serialNumber}, peak power: ${value} W`);
                                return value;
                            });
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterProducing)
                            .onGet(async () => {
                                const value = microinverter.producing;
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${serialNumber}, producing: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterCommunicating)
                            .onGet(async () => {
                                const value = microinverter.communicating;
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${serialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterProvisioned)
                            .onGet(async () => {
                                const value = microinverter.provisioned;
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${serialNumber}, provisioned: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterOperating)
                            .onGet(async () => {
                                const value = microinverter.operating;
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${serialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        if (plcLevelSupported) {
                            enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterCommLevel)
                                .onGet(async () => {
                                    const value = microinverter.commLevel;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${serialNumber}, plc level: ${value} %`);
                                    return value;
                                });
                        }
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterStatus)
                            .onGet(async () => {
                                const value = microinverter.deviceStatus;
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${serialNumber}, status: ${value}`);
                                return value;
                            });
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterFirmware)
                            .onGet(async () => {
                                const value = microinverter.firmware;
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${serialNumber}, firmware: ${value}`);
                                return value;
                            });
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterLastReportDate)
                            .onGet(async () => {
                                const value = microinverter.lastReportDate;
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${serialNumber}, last report: ${value}`);
                                return value;
                            });
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterGridProfile)
                            .onGet(async () => {
                                const value = microinverter.arfProfile;
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${serialNumber}, grid profile: ${value}`);
                                return value;
                            });
                        this.microinvertersServices.push(enphaseMicroinverterService);
                    }
                }

                //meters
                if (metersSupported) {
                    this.metersServices = [];
                    for (const meter of this.pv.meters) {
                        const measurementType = meter.measurementType;
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Meter ${measurementType} Service`) : false;
                        const enphaseMeterService = accessory.addService(Service.enphaseMeterService, `Meter ${measurementType}`, measurementType);
                        enphaseMeterService.setCharacteristic(Characteristic.ConfiguredName, `Meter ${measurementType}`);
                        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterState)
                            .onGet(async () => {
                                const value = meter.state;
                                const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${measurementType}, state: ${value ? 'Enabled' : 'Disabled'}`);
                                return value;
                            });
                        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterPhaseMode)
                            .onGet(async () => {
                                const value = meter.phaseMode;
                                const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${measurementType}, phase mode: ${value}`);
                                return value;
                            });
                        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterPhaseCount)
                            .onGet(async () => {
                                const value = meter.phaseCount;
                                const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${measurementType}, phase count: ${value}`);
                                return value;
                            });
                        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterMeteringStatus)
                            .onGet(async () => {
                                const value = meter.meteringStatus;
                                const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${measurementType}, metering status: ${value}`);
                                return value;
                            });
                        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterStatusFlags)
                            .onGet(async () => {
                                const value = meter.statusFlags;
                                const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${measurementType}, status flag: ${value}`);
                                return value;
                            });
                        if (meter.state) {
                            enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterActivePower)
                                .onGet(async () => {
                                    const value = meter.readings.activePower;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${measurementType}, active power: ${value} kW`);
                                    return value;
                                });
                            enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterApparentPower)
                                .onGet(async () => {
                                    const value = meter.readings.apparentPower;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${measurementType}, apparent power: ${value} kVA`);
                                    return value;
                                });
                            enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterReactivePower)
                                .onGet(async () => {
                                    const value = meter.readings.reactivePower;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${measurementType}, reactive power: ${value} kVAr`);
                                    return value;
                                });
                            enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterPwrFactor)
                                .onGet(async () => {
                                    const value = meter.readings.pwrFactor;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${measurementType}, power factor: ${value} cos φ`);
                                    return value;
                                });
                            enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterVoltage)
                                .onGet(async () => {
                                    const value = meter.readings.voltage;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${measurementType}, voltage: ${value} V`);
                                    return value;
                                });
                            enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterCurrent)
                                .onGet(async () => {
                                    const value = meter.readings.current;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${measurementType}, current: ${value} A`);
                                    return value;
                                });
                            enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterFreq)
                                .onGet(async () => {
                                    const value = meter.readings.freq;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${measurementType}, frequency: ${value} Hz`);
                                    return value;
                                });
                            enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterReadingTime)
                                .onGet(async () => {
                                    const value = meter.readings.timeStamp;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${measurementType}, last report: ${value}`);
                                    return value;
                                });
                        }
                        this.metersServices.push(enphaseMeterService);
                    };
                }

                //production
                const debug4 = this.enableDebugMode ? this.emit('debug', `Prepare Production Power And Energy Service`) : false;
                this.productionsService = accessory.addService(Service.enphasePowerAndEnergyService, `Production Power And Energy`, 'enphaseProductionService');
                this.productionsService.setCharacteristic(Characteristic.ConfiguredName, `Production Power And Energy`);
                this.productionsService.getCharacteristic(Characteristic.enphasePower)
                    .onGet(async () => {
                        const value = this.pv.production.ct.power;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production power: ${value} kW`);
                        return value;
                    });
                this.productionsService.getCharacteristic(Characteristic.enphasePowerMax)
                    .onGet(async () => {
                        const value = this.pv.production.ct.powerPeak;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production power peak: ${value} kW`);
                        return value;
                    });
                this.productionsService.getCharacteristic(Characteristic.enphasePowerMaxDetected)
                    .onGet(async () => {
                        const value = this.pv.production.ct.powerPeakDetected;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production power peak detected: ${value ? 'Yes' : 'No'}`);
                        return value;
                    });
                this.productionsService.getCharacteristic(Characteristic.enphaseEnergyToday)
                    .onGet(async () => {
                        const value = this.pv.production.ct.energyToday;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production energy today: ${value} kWh`);
                        return value;
                    });
                this.productionsService.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
                    .onGet(async () => {
                        const value = this.pv.production.ct.energyLastSevenDays;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production energy last seven days: ${value} kWh`);
                        return value;
                    });
                this.productionsService.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
                    .onGet(async () => {
                        const value = this.pv.production.ct.energyLifeTime;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production energy lifetime: ${value} kWh`);
                        return value;
                    });
                if (metersSupported && metersProductionEnabled) {
                    this.productionsService.getCharacteristic(Characteristic.enphaseRmsCurrent)
                        .onGet(async () => {
                            const value = this.pv.production.ct.rmsCurrent;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production current: ${value} A`);
                            return value;
                        });
                    this.productionsService.getCharacteristic(Characteristic.enphaseRmsVoltage)
                        .onGet(async () => {
                            const value = this.pv.production.ct.rmsVoltage;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production voltage: ${value} V`);
                            return value;
                        });
                    this.productionsService.getCharacteristic(Characteristic.enphaseReactivePower)
                        .onGet(async () => {
                            const value = this.pv.production.ct.reactivePower;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production net reactive power: ${value} kVAr`);
                            return value;
                        });
                    this.productionsService.getCharacteristic(Characteristic.enphaseApparentPower)
                        .onGet(async () => {
                            const value = this.pv.production.ct.apparentPower;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production net apparent power: ${value} kVA`);
                            return value;
                        });
                    this.productionsService.getCharacteristic(Characteristic.enphasePwrFactor)
                        .onGet(async () => {
                            const value = this.pv.production.ct.pwrFactor;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production power factor: ${value} cos φ`);
                            return value;
                        });
                }
                this.productionsService.getCharacteristic(Characteristic.enphaseReadingTime)
                    .onGet(async () => {
                        const value = this.pv.production.ct.readingTime;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production last report: ${value}`);
                        return value;
                    });
                this.productionsService.getCharacteristic(Characteristic.enphasePowerMaxReset)
                    .onGet(async () => {
                        const state = false;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production power peak reset: Off`);
                        return state;
                    })
                    .onSet(async (state) => {
                        try {
                            const set = state ? this.pv.production.ct.powerPeak = 0 : false;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production power peak reset: On`);
                            this.productionsService.updateCharacteristic(Characteristic.enphasePowerMaxReset, false);
                        } catch (error) {
                            this.emit('error', `Production Power Peak reset error: ${error}`);
                        };
                    });

                //production state sensor service
                if (this.powerProductionStateActiveSensorsCount > 0) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Production Power State Sensor Service`) : false;
                    this.powerProductionStateSensorsServices = [];
                    for (let i = 0; i < this.powerProductionStateActiveSensorsCount; i++) {
                        const sensorName = this.powerProductionStateActiveSensors[i].namePrefix ? `${accessoryName} ${this.powerProductionStateActiveSensors[i].name}` : this.powerProductionStateActiveSensors[i].name;
                        const serviceType = this.powerProductionStateActiveSensors[i].serviceType;
                        const characteristicType = this.powerProductionStateActiveSensors[i].characteristicType;
                        const powerProductionStateSensorService = accessory.addService(serviceType, sensorName, `powerProductionStateSensorService${i}`);
                        powerProductionStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        powerProductionStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                        powerProductionStateSensorService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.powerProductionStateActiveSensors[i].state;
                                const info = this.disableLogInfo ? false : this.emit('message', `Production power state sensor: ${state ? 'Active' : 'Not active'}`);
                                return state;
                            });
                        this.powerProductionStateSensorsServices.push(powerProductionStateSensorService);
                    };
                };

                //production power level sensors service
                if (this.powerProductionLevelActiveSensorsCount > 0) {
                    this.powerProductionLevelSensorsServices = [];
                    for (let i = 0; i < this.powerProductionLevelActiveSensorsCount; i++) {
                        const sensorName = this.powerProductionLevelActiveSensors[i].namePrefix ? `${accessoryName} ${this.powerProductionLevelActiveSensors[i].name}` : this.powerProductionLevelActiveSensors[i].name;
                        const serviceType = this.powerProductionLevelActiveSensors[i].serviceType;
                        const characteristicType = this.powerProductionLevelActiveSensors[i].characteristicType;
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Production Power Level ${sensorName} Sensor Service`) : false;
                        const powerProductionLevelSensorsService = accessory.addService(serviceType, sensorName, `powerProductionLevelSensorsService${i}`);
                        powerProductionLevelSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        powerProductionLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                        powerProductionLevelSensorsService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.powerProductionLevelActiveSensors[i].state;
                                const info = this.disableLogInfo ? false : this.emit('message', `Production power level sensor: ${sensorName}: ${state ? 'Active' : 'Not active'}`);
                                return state;
                            });
                        this.powerProductionLevelSensorsServices.push(powerProductionLevelSensorsService);
                    };
                };

                //production energy state sensor service
                if (this.energyProductionStateActiveSensorsCount > 0) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Production Energy State Sensor Service`) : false;
                    this.energyProductionStateSensorsServices = [];
                    for (let i = 0; i < this.energyProductionStateActiveSensorsCount; i++) {
                        const sensorName = this.energyProductionStateActiveSensors[i].namePrefix ? `${accessoryName} ${this.energyProductionStateActiveSensors[i].name}` : this.energyProductionStateActiveSensors[i].name;
                        const serviceType = this.energyProductionStateActiveSensors[i].serviceType;
                        const characteristicType = this.energyProductionStateActiveSensors[i].characteristicType;
                        const energyProductionStateSensorService = accessory.addService(serviceType, sensorName, `energyProductionStateSensorService${i}`);
                        energyProductionStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        energyProductionStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                        energyProductionStateSensorService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.energyProductionStateActiveSensors[i].state;
                                const info = this.disableLogInfo ? false : this.emit('message', `Production energy state sensor: ${state ? 'Active' : 'Not active'}`);
                                return state;
                            });
                        this.energyProductionStateSensorsServices.push(energyProductionStateSensorService);
                    };
                };

                //production energy level sensor service
                if (this.energyProductionLevelActiveSensorsCount > 0) {
                    this.energyProductionLevelSensorsServices = [];
                    for (let i = 0; i < this.energyProductionLevelActiveSensorsCount; i++) {
                        const sensorName = this.energyProductionLevelActiveSensors[i].namePrefix ? `${accessoryName} ${this.energyProductionLevelActiveSensors[i].name}` : this.energyProductionLevelActiveSensors[i].name;
                        const serviceType = this.energyProductionLevelActiveSensors[i].serviceType;
                        const characteristicType = this.energyProductionLevelActiveSensors[i].characteristicType;
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Production Energy Level ${sensorName} Sensor Service`) : false;
                        const energyProductionLevelSensorsService = accessory.addService(serviceType, sensorName, `energyProductionLevelSensorsService${i}`);
                        energyProductionLevelSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        energyProductionLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                        energyProductionLevelSensorsService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.energyProductionLevelActiveSensors[i].state;
                                const info = this.disableLogInfo ? false : this.emit('message', `Production energy level sensor: ${sensorName}: ${state ? 'Active' : 'Not active'}`);
                                return state;
                            });
                        this.energyProductionLevelSensorsServices.push(energyProductionLevelSensorsService);
                    };
                };

                //power and energy consumption
                if (metersInstalled && metersConsumptionEnabled) {
                    this.consumptionsServices = [];
                    for (const consumption of this.pv.consumptions) {
                        const measurmentType = consumption.measurmentType;
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Power And Energy Service`) : false;
                        const enphaseConsumptionService = accessory.addService(Service.enphasePowerAndEnergyService, `${measurmentType} Power And Energy`, measurmentType);
                        enphaseConsumptionService.setCharacteristic(Characteristic.ConfiguredName, `${measurmentType} Power And Energy`);
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePower)
                            .onGet(async () => {
                                const value = consumption.power;
                                const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} power: ${value} kW`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePowerMax)
                            .onGet(async () => {
                                const value = consumption.powerPeak;
                                const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} power peak: ${value} kW`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePowerMaxDetected)
                            .onGet(async () => {
                                const value = consumption.powerPeakDetected;
                                const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} power peak detected: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyToday)
                            .onGet(async () => {
                                const value = consumption.energyToday;
                                const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} energy today: ${value} kWh`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
                            .onGet(async () => {
                                const value = consumption.energyLastSevenDays;
                                const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} energy last seven days: ${value} kWh`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
                            .onGet(async () => {
                                const value = consumption.energyLifeTime;
                                const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} energy lifetime: ${value} kWh`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseRmsCurrent)
                            .onGet(async () => {
                                const value = consumption.rmsCurrent;
                                const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} current: ${value} A`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseRmsVoltage)
                            .onGet(async () => {
                                const value = consumption.rmsVoltage;
                                const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} voltage: ${value} V`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseReactivePower)
                            .onGet(async () => {
                                const value = consumption.reactivePower;
                                const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} reactive power: ${value} kVAr`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseApparentPower)
                            .onGet(async () => {
                                const value = consumption.apparentPower;
                                const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePwrFactor)
                            .onGet(async () => {
                                const value = consumption.pwrFactor;
                                const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} power factor: ${value} cos φ`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseReadingTime)
                            .onGet(async () => {
                                const value = consumption.readingTime;
                                const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} last report: ${value}`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePowerMaxReset)
                            .onGet(async () => {
                                const state = false;
                                const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} power peak reset: Off`);
                                return state;
                            })
                            .onSet(async (state) => {
                                try {
                                    const set = state ? consumption.powerPeak = 0 : false;
                                    const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} power peak reset: On`);
                                    enphaseConsumptionService.updateCharacteristic(Characteristic.enphasePowerMaxReset, false);
                                } catch (error) {
                                    this.emit('error', `${measurmentType}, power peak reset error: ${error}`);
                                };
                            });
                        this.consumptionsServices.push(enphaseConsumptionService);

                        //total
                        if (measurmentType === 'Consumption Total') {
                            //consumption total state sensor service
                            if (this.powerConsumptionTotalStateActiveSensorsCount > 0) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Power State Sensor Service`) : false;
                                this.powerConsumptionTotalStateSensorsServices = [];
                                for (let i = 0; i < this.powerConsumptionTotalStateActiveSensorsCount; i++) {
                                    const sensorName = this.powerConsumptionTotalStateActiveSensors[i].namePrefix ? `${accessoryName} ${this.powerConsumptionTotalStateActiveSensors[i].name}` : this.powerConsumptionTotalStateActiveSensors[i].name;
                                    const serviceType = this.powerConsumptionTotalStateActiveSensors[i].serviceType;
                                    const characteristicType = this.powerConsumptionTotalStateActiveSensors[i].characteristicType;
                                    const powerConsumptionTotalStateSensorService = accessory.addService(serviceType, sensorName, `powerConsumptionTotalStateSensorService${i}`);
                                    powerConsumptionTotalStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    powerConsumptionTotalStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    powerConsumptionTotalStateSensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.powerConsumptionTotalStateActiveSensors[i].state;
                                            const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} power state sensor: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.powerConsumptionTotalStateSensorsServices.push(powerConsumptionTotalStateSensorService);
                                };
                            };

                            //consumption total power peak sensors service
                            if (this.powerConsumptionTotalLevelActiveSensorsCount > 0) {
                                this.powerConsumptionTotalLevelSensorsServices = [];
                                for (let i = 0; i < this.powerConsumptionTotalLevelActiveSensorsCount; i++) {
                                    const sensorName = this.powerConsumptionTotalLevelActiveSensors[i].namePrefix ? `${accessoryName} ${this.powerConsumptionTotalLevelActiveSensors[i].name}` : this.powerConsumptionTotalLevelActiveSensors[i].name;
                                    const serviceType = this.powerConsumptionTotalLevelActiveSensors[i].serviceType;
                                    const characteristicType = this.powerConsumptionTotalLevelActiveSensors[i].characteristicType;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Power Level ${sensorName} Sensor Service`) : false;
                                    const powerConsumptionTotalLevelSensorsService = accessory.addService(serviceType, sensorName, `powerConsumptionTotalLevelSensorsService${i}`);
                                    powerConsumptionTotalLevelSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    powerConsumptionTotalLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    powerConsumptionTotalLevelSensorsService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.powerConsumptionTotalLevelActiveSensors[i].state;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Consumption total power level sensor: ${sensorName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.powerConsumptionTotalLevelSensorsServices.push(powerConsumptionTotalLevelSensorsService);
                                };
                            };

                            //consumption total energy state sensor service
                            if (this.energyConsumptionTotalStateActiveSensorsCount > 0) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Energy State Sensor Service`) : false;
                                this.energyConsumptionTotalStateSensorsServices = [];
                                for (let i = 0; i < this.energyConsumptionTotalStateActiveSensorsCount; i++) {
                                    const sensorName = this.energyConsumptionTotalStateActiveSensors[i].namePrefix ? `${accessoryName} ${this.energyConsumptionTotalStateActiveSensors[i].name}` : this.energyConsumptionTotalStateActiveSensors[i].name;
                                    const serviceType = this.energyConsumptionTotalStateActiveSensors[i].serviceType;
                                    const characteristicType = this.energyConsumptionTotalStateActiveSensors[i].characteristicType;
                                    const energyConsumptionTotalStateSensorService = accessory.addService(serviceType, sensorName, `energyConsumptionTotalStateSensorService${i}`);
                                    energyConsumptionTotalStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    energyConsumptionTotalStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    energyConsumptionTotalStateSensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.energyConsumptionTotalStateActiveSensors[i].state;
                                            const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} energy state sensor: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.energyConsumptionTotalStateSensorsServices.push(energyConsumptionTotalStateSensorService);
                                };
                            };

                            //consumption total energy level sensor service
                            if (this.energyConsumptionTotalLevelActiveSensorsCount > 0) {
                                this.energyConsumptionTotalLevelSensorsServices = [];
                                for (let i = 0; i < this.energyConsumptionTotalLevelActiveSensorsCount; i++) {
                                    const sensorName = this.energyConsumptionTotalLevelActiveSensors[i].namePrefix ? `${accessoryName} ${this.energyConsumptionTotalLevelActiveSensors[i].name}` : this.energyConsumptionTotalLevelActiveSensors[i].name;
                                    const serviceType = this.energyConsumptionTotalLevelActiveSensors[i].serviceType;
                                    const characteristicType = this.energyConsumptionTotalLevelActiveSensors[i].characteristicType;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Energy Level ${sensorName} Sensor Service`) : false;
                                    const energyConsumptionTotalLevelSensorsService = accessory.addService(serviceType, sensorName, `energyConsumptionTotalLevelSensorsService${i}`);
                                    energyConsumptionTotalLevelSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    energyConsumptionTotalLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    energyConsumptionTotalLevelSensorsService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.energyConsumptionTotalLevelActiveSensors[i].state;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Consumption total energy level sensor: ${sensorName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.energyConsumptionTotalLevelSensorsServices.push(energyConsumptionTotalLevelSensorsService);
                                };
                            };
                        };

                        //net
                        if (measurmentType === 'Consumption Net') {
                            //consumption net state sensor service
                            if (this.powerConsumptionNetStateActiveSensorsCount > 0) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Power State Sensor Service`) : false;
                                this.powerConsumptionNetStateSensorsServices = [];
                                for (let i = 0; i < this.powerConsumptionNetStateActiveSensorsCount; i++) {
                                    const sensorName = this.powerConsumptionNetStateActiveSensors[i].namePrefix ? `${accessoryName} ${this.powerConsumptionNetStateActiveSensors[i].name}` : this.powerConsumptionNetStateActiveSensors[i].name;
                                    const serviceType = this.powerConsumptionNetStateActiveSensors[i].serviceType;
                                    const characteristicType = this.powerConsumptionNetStateActiveSensors[i].characteristicType;
                                    const powerConsumptionNetStateSensorService = accessory.addService(serviceType, sensorName, `powerConsumptionNetStateSensorService${i}`);
                                    powerConsumptionNetStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    powerConsumptionNetStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    powerConsumptionNetStateSensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.powerConsumptionNetStateActiveSensors[i].state;
                                            const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} power state sensor: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.powerConsumptionNetStateSensorsServices.push(powerConsumptionNetStateSensorService);
                                };
                            };

                            //consumption net power peak sensor service
                            if (this.powerConsumptionNetLevelActiveSensorsCount > 0) {
                                this.powerConsumptionNetLevelSensorsServices = [];
                                for (let i = 0; i < this.powerConsumptionNetLevelActiveSensorsCount; i++) {
                                    const sensorName = this.powerConsumptionNetLevelActiveSensors[i].namePrefix ? `${accessoryName} ${this.powerConsumptionNetLevelActiveSensors[i].name}` : this.powerConsumptionNetLevelActiveSensors[i].name;
                                    const serviceType = this.powerConsumptionNetLevelActiveSensors[i].serviceType;
                                    const characteristicType = this.powerConsumptionNetLevelActiveSensors[i].characteristicType;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Power Level ${sensorName} Sensor Service`) : false;
                                    const powerConsumptionNetLevelSensorsService = accessory.addService(serviceType, sensorName, `powerConsumptionNetLevelSensorsService${i}`);
                                    powerConsumptionNetLevelSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    powerConsumptionNetLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    powerConsumptionNetLevelSensorsService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.powerConsumptionNetLevelActiveSensors[i].state ?? false;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Consumption net power level sensor: ${sensorName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.powerConsumptionNetLevelSensorsServices.push(powerConsumptionNetLevelSensorsService);
                                };
                            };

                            //consumption net energy state sensor service
                            if (this.energyConsumptionNetStateActiveSensorsCount > 0) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Energy State Sensor Service`) : false;
                                this.energyConsumptionNetStateSensorsServices = [];
                                for (let i = 0; i < this.energyConsumptionNetStateActiveSensorsCount; i++) {
                                    const sensorName = this.energyConsumptionNetStateActiveSensors[i].namePrefix ? `${accessoryName} ${this.energyConsumptionNetStateActiveSensors[i].name}` : this.energyConsumptionNetStateActiveSensors[i].name;
                                    const serviceType = this.energyConsumptionNetStateActiveSensors[i].serviceType;
                                    const characteristicType = this.energyConsumptionNetStateActiveSensors[i].characteristicType;
                                    const energyConsumptionNetStateSensorService = accessory.addService(serviceType, sensorName, `energyConsumptionNetStateSensorService${i}`);
                                    energyConsumptionNetStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    energyConsumptionNetStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    energyConsumptionNetStateSensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.energyConsumptionNetStateActiveSensors[i].state;
                                            const info = this.disableLogInfo ? false : this.emit('message', `${measurmentType} energy state sensor: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.energyConsumptionNetStateSensorsServices.push(energyConsumptionNetStateSensorService);
                                };
                            };

                            if (this.energyConsumptionNetLevelActiveSensorsCount > 0) {
                                this.energyConsumptionNetLevelSensorsServices = [];
                                for (let i = 0; i < this.energyConsumptionNetLevelActiveSensorsCount; i++) {
                                    const sensorName = this.energyConsumptionNetLevelActiveSensors[i].namePrefix ? `${accessoryName} ${this.energyConsumptionNetLevelActiveSensors[i].name}` : this.energyConsumptionNetLevelActiveSensors[i].name;
                                    const serviceType = this.energyConsumptionNetLevelActiveSensors[i].serviceType;
                                    const characteristicType = this.energyConsumptionNetLevelActiveSensors[i].characteristicType;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${measurmentType} Energy Level ${sensorName} Sensor Service`) : false;
                                    const energyConsumptionNetLevelSensorsService = accessory.addService(serviceType, sensorName, `energyConsumptionNetLevelSensorsService${i}`);
                                    energyConsumptionNetLevelSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    energyConsumptionNetLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    energyConsumptionNetLevelSensorsService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.energyConsumptionNetLevelActiveSensors[i].state ?? false;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Consumption net energy level sensor: ${sensorName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.energyConsumptionNetLevelSensorsServices.push(energyConsumptionNetLevelSensorsService);
                                };
                            };
                        };
                    }
                }

                //ac batteries
                if (acBatteriesInstalled) {
                    //ac batteries summary level and state
                    const debug2 = this.enableDebugMode ? this.emit('debug', `Prepare AC Batteries Summary Service`) : false;
                    this.enphaseAcBatterieSummaryLevelAndStateService = accessory.addService(Service.Lightbulb, `AC Batteries`, `enphaseAcBatterieSummaryLevelAndStateService`);
                    this.enphaseAcBatterieSummaryLevelAndStateService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                    this.enphaseAcBatterieSummaryLevelAndStateService.setCharacteristic(Characteristic.ConfiguredName, `AC Batteries`);
                    this.enphaseAcBatterieSummaryLevelAndStateService.getCharacteristic(Characteristic.On)
                        .onGet(async () => {
                            const state = this.pv.acBatteries.summary.energyState;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries energy state: ${state ? 'Charged' : 'Discharged'}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            this.enphaseAcBatterieSummaryLevelAndStateService.updateCharacteristic(Characteristic.On, this.pv.acBatteries.summary.energyState);
                        })
                    this.enphaseAcBatterieSummaryLevelAndStateService.getCharacteristic(Characteristic.Brightness)
                        .onGet(async () => {
                            const state = this.pv.acBatteries.summary.percentFull;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries energy level: ${this.pv.acBatteries.summary.percentFull} %`);
                            return state;
                        })
                        .onSet(async (value) => {
                            this.enphaseAcBatterieSummaryLevelAndStateService.updateCharacteristic(Characteristic.Brightness, this.pv.acBatteries.summary.percentFull);
                        })

                    //ac batteries summary service
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare AC Batteries Summary Service`) : false;
                    this.acBatterieSummaryService = accessory.addService(Service.enphaseAcBatterieSummaryService, 'AC Batteries Summary', 'enphaseAcBatterieSummaryService');
                    this.acBatterieSummaryService.setCharacteristic(Characteristic.ConfiguredName, `AC Batteries Summary`);
                    this.acBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryPower)
                        .onGet(async () => {
                            const value = this.pv.acBatteries.summary.power;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries storage power: ${value} kW`);
                            return value;
                        });
                    this.acBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryEnergy)
                        .onGet(async () => {
                            const value = this.pv.acBatteries.summary.energy;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries storage energy: ${value} kWh`);
                            return value;
                        });
                    this.acBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryPercentFull)
                        .onGet(async () => {
                            const value = this.pv.acBatteries.summary.percentFull;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries percent full: ${value}`);
                            return value;
                        });
                    this.acBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryActiveCount)
                        .onGet(async () => {
                            const value = this.pv.acBatteries.summary.activeCount;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries devices count: ${value}`);
                            return value;
                        });
                    this.acBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryState)
                        .onGet(async () => {
                            const value = this.pv.acBatteries.summary.state;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries state: ${value}`);
                            return value;
                        });
                    this.acBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryReadingTime)
                        .onGet(async () => {
                            const value = this.pv.acBatteries.summary.readingTime;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries last report: ${value}`);
                            return value;
                        });

                    //ac batteries state
                    this.acBatteriesServices = [];
                    for (const acBatterie of this.pv.acBatteries.devices) {
                        const serialNumber = acBatterie.serialNumber;
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare AC Batterie ${serialNumber} Service`) : false;
                        const enphaseAcBatterieService = accessory.addService(Service.enphaseAcBatterieService, `AC Batterie ${serialNumber}`, serialNumber);
                        enphaseAcBatterieService.setCharacteristic(Characteristic.ConfiguredName, `AC Batterie ${serialNumber}`);
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieChargeStatus)
                            .onGet(async () => {
                                const value = acBatterie.chargeStatus;
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${serialNumber} charge status ${value}`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieProducing)
                            .onGet(async () => {
                                const value = acBatterie.producing;
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${serialNumber} producing: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieCommunicating)
                            .onGet(async () => {
                                const value = acBatterie.communicating;
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${serialNumber} communicating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieProvisioned)
                            .onGet(async () => {
                                const value = acBatterie.provisioned;
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${serialNumber} provisioned: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieOperating)
                            .onGet(async () => {
                                const value = acBatterie.operating;
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${serialNumber} operating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        if (plcLevelSupported) {
                            enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieCommLevel)
                                .onGet(async () => {
                                    const value = acBatterie.commLevel;
                                    const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${serialNumber} plc level: ${value} %`);
                                    return value;
                                });
                        }
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieSleepEnabled)
                            .onGet(async () => {
                                const value = acBatterie.sleepEnabled;
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${serialNumber} sleep: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatteriePercentFull)
                            .onGet(async () => {
                                const value = acBatterie.percentFull;
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${serialNumber} percent full: ${value} %`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieMaxCellTemp)
                            .onGet(async () => {
                                const value = acBatterie.maxCellTemp;
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${serialNumber} max cell temp: ${value} °C`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieSleepMinSoc)
                            .onGet(async () => {
                                const value = acBatterie.sleepMinSoc;
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${serialNumber} sleep min soc: ${value} min`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieSleepMaxSoc)
                            .onGet(async () => {
                                const value = acBatterie.sleepMaxSoc;
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${serialNumber} sleep max soc: ${value} min`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieStatus)
                            .onGet(async () => {
                                const value = acBatterie.deviceStatus;
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${serialNumber} status: ${value}`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieFirmware)
                            .onGet(async () => {
                                const value = acBatterie.firmware;
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${serialNumber} firmware: ${value}`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieLastReportDate)
                            .onGet(async () => {
                                const value = acBatterie.lastReportDate;
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${serialNumber} last report: ${value}`);
                                return value;
                            });
                        this.acBatteriesServices.push(enphaseAcBatterieService);
                    }
                }

                //ensembles inventory
                if (ensemblesInventoryInstalled) {
                    this.ensemblesServices = [];
                    for (const ensemble of this.pv.ensembles) {
                        const serialNumber = ensemble.serialNumber;
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Ensemble ${serialNumber} Service`) : false;
                        const enphaseEnsembleService = accessory.addService(Service.enphaseEnsembleService, `Ensemble ${serialNumber}`, serialNumber);
                        enphaseEnsembleService.setCharacteristic(Characteristic.ConfiguredName, `Ensemble ${serialNumber}`);
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEnsembleProducing)
                            .onGet(async () => {
                                const value = ensemble.producing;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${serialNumber}, producing: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEnsembleCommunicating)
                            .onGet(async () => {
                                const value = ensemble.communicating;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${serialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEnsembleOperating)
                            .onGet(async () => {
                                const value = ensemble.operating;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${serialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            })
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEnsembleStatus)
                            .onGet(async () => {
                                const value = ensemble.deviceStatus;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${serialNumber}, status: ${value}`);
                                return value;
                            });
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEnsembleFirmware)
                            .onGet(async () => {
                                const value = ensemble.firmware;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${serialNumber}, firmware: ${value}`);
                                return value;
                            });
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEnsembleLastReportDate)
                            .onGet(async () => {
                                const value = ensemble.lastReportDate;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${serialNumber}, last report: ${value}`);
                                return value;
                            });

                        this.ensemblesServices.push(enphaseEnsembleService);
                    }
                }

                if (ensemblesInstalled) {
                    //ensembles status summary
                    if (ensembleStatusSupported) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Ensemble Summary Service`) : false;
                        this.ensembleStatusService = accessory.addService(Service.enphaseEnsembleStatusService, `Ensemble summary`, 'enphaseEnsembleStatusService');
                        this.ensembleStatusService.setCharacteristic(Characteristic.ConfiguredName, `Ensemble summary`);
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusRestPower)
                            .onGet(async () => {
                                const value = this.ensemble.counters.restPower ?? 0;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, rest power: ${value} kW`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHz)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.freqBiasHz;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L1 bias frequency: ${value} Hz`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasV)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.voltageBiasV;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L1 bias voltage: ${value} V`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.freqBiasHzQ8;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L1 bias q8 frequency: ${value} Hz`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.voltageBiasVQ5;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L1 bias q5 voltage: ${value} V`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzPhaseB)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.freqBiasHzPhaseB;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L2 bias frequency: ${value} Hz`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVPhaseB)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.voltageBiasVPhaseB;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L2 bias voltage: ${value} V`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8PhaseB)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.freqBiasHzQ8PhaseB;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L2 bias q8 frequency: ${value} Hz`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5PhaseB)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.voltageBiasVQ5PhaseB;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L2 bias q5 voltage: ${value} V`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzPhaseC)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.freqBiasHzPhaseC;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L3 bias frequency: ${value} Hz`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVPhaseC)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.voltageBiasVPhaseC;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L3 bias voltage: ${value} V`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8PhaseC)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.freqBiasHzQ8PhaseC;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L3 bias q8 frequency: ${value} Hz`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5PhaseC)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.voltageBiasVQ5PhaseC;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L3 bias q5 voltage: ${value} V`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusConfiguredBackupSoc)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.configuredBackupSoc;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, configured backup SoC: ${value} %`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusAdjustedBackupSoc)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.adjustedBackupSoc;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, adjusted backup SoC: ${value} %`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusAggSoc)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.aggSoc;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, agg SoC: ${value} %`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusAggMaxEnergy)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.aggMaxEnergy;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, agg max energy: ${value} kWh`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusEncAggSoc)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.encAggSoc;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, encharges agg SoC: ${value} %`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusEncAggRatedPower)
                            .onGet(async () => {
                                const value = this.ensemble.enchargesRatedPowerSum;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, encharges agg rated power: ${value} kW`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusEncAggPercentFull)
                            .onGet(async () => {
                                const value = this.ensemble.enchargesPercentFullSum;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, encharges agg percent full: ${value} %`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusEncAggBackupEnergy)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.encAggBackupEnergy;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, encharges agg backup energy: ${value} kWh`);
                                return value;
                            });
                        this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusEncAggAvailEnergy)
                            .onGet(async () => {
                                const value = this.ensemble.secctrl.encAggAvailEnergy;
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, encharges agg available energy: ${value} kWh`);
                                return value;
                            });

                        //encharge grid mode sensor services
                        if (this.enchargeGridModeActiveSensorsCount > 0) {
                            this.enchargeGridModeSensorsServices = [];
                            for (let i = 0; i < this.enchargeGridModeActiveSensorsCount; i++) {
                                const sensorName = this.enchargeGridModeActiveSensors[i].namePrefix ? `${accessoryName} ${this.enchargeGridModeActiveSensors[i].name}` : this.enchargeGridModeActiveSensors[i].name;
                                const serviceType = this.enchargeGridModeActiveSensors[i].serviceType;
                                const characteristicType = this.enchargeGridModeActiveSensors[i].characteristicType;
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare Encharge Grid Mode Sensor ${sensorName} Service`) : false;
                                const enchargeGridModeSensorsService = accessory.addService(serviceType, sensorName, `enchargeGridModeSensorService${i}`);
                                enchargeGridModeSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                enchargeGridModeSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                enchargeGridModeSensorsService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const state = this.enchargeGridModeActiveSensors[i].state;
                                        const info = this.disableLogInfo ? false : this.emit('message', `Encharge grid mode sensor: ${sensorName}, state: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                this.enchargeGridModeSensorsServices.push(enchargeGridModeSensorsService);
                            };
                        };

                        //encharge backup level sensor services
                        if (this.enchargeBackupLevelActiveSensorsCount > 0) {
                            this.enchargeBackupLevelSensorsServices = [];
                            for (let i = 0; i < this.enchargeBackupLevelActiveSensorsCount; i++) {
                                const sensorName = this.enchargeBackupLevelActiveSensors[i].namePrefix ? `${accessoryName} ${this.enchargeBackupLevelActiveSensors[i].name}` : this.enchargeBackupLevelActiveSensors[i].name;
                                const serviceType = this.enchargeBackupLevelActiveSensors[i].serviceType;
                                const characteristicType = this.enchargeBackupLevelActiveSensors[i].characteristicType;
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare Encharge Backup Level Sensor ${sensorName} Service`) : false;
                                const enchargeBackupLevelSensorsService = accessory.addService(serviceType, sensorName, `enchargeBackupLevelSensorService${i}`);
                                enchargeBackupLevelSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                enchargeBackupLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                enchargeBackupLevelSensorsService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const state = this.enchargeBackupLevelActiveSensors[i].state;
                                        const info = this.disableLogInfo ? false : this.emit('message', `Encharge Backup Level sensor: ${sensorName}, state: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                this.enchargeBackupLevelSensorsServices.push(enchargeBackupLevelSensorsService);
                            };
                        };

                        //solar grid mode sensor services
                        if (this.solarGridModeActiveSensorsCount > 0) {
                            this.solarGridModeSensorsServices = [];
                            for (let i = 0; i < this.solarGridModeActiveSensorsCount; i++) {
                                const sensorName = this.solarGridModeActiveSensors[i].namePrefix ? `${accessoryName} ${this.solarGridModeActiveSensors[i].name}` : this.solarGridModeActiveSensors[i].name;
                                const serviceType = this.solarGridModeActiveSensors[i].serviceType;
                                const characteristicType = this.solarGridModeActiveSensors[i].characteristicType;
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare Solar Grid Mode Sensor ${sensorName} Service`) : false;
                                const solarGridModeSensorsService = accessory.addService(serviceType, sensorName, `solarGridModeSensorService${i}`);
                                solarGridModeSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                solarGridModeSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                solarGridModeSensorsService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const state = this.solarGridModeActiveSensors[i].state;
                                        const info = this.disableLogInfo ? false : this.emit('message', `Solar grid mode sensor: ${sensorName}, state: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                this.solarGridModeSensorsServices.push(solarGridModeSensorsService);
                            };
                        };
                    }

                    //encharges
                    if (enchargesInstalled) {
                        //encharges level and state
                        const debug2 = this.enableDebugMode ? this.emit('debug', `Prepare Encharges Summary Service`) : false;
                        this.enphaseEnchargesSummaryLevelAndStateService = accessory.addService(Service.Lightbulb, `Encharges`, `enphaseEnchargesSummaryLevelAndStateService`);
                        this.enphaseEnchargesSummaryLevelAndStateService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        this.enphaseEnchargesSummaryLevelAndStateService.setCharacteristic(Characteristic.ConfiguredName, 'Encharges');
                        this.enphaseEnchargesSummaryLevelAndStateService.getCharacteristic(Characteristic.On)
                            .onGet(async () => {
                                const state = this.ensemble.enchargesEnergyState;
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharges energy state: ${state ? 'Charged' : 'Discharged'}`);
                                return state;
                            })
                            .onSet(async (state) => {
                                try {
                                    this.enphaseEnchargesSummaryLevelAndStateService.updateCharacteristic(Characteristic.On, this.ensemble.enchargesEnergyState);
                                } catch (error) {
                                    this.emit('error', `Set Encharges energy state error: ${error}`);
                                };
                            })
                        this.enphaseEnchargesSummaryLevelAndStateService.getCharacteristic(Characteristic.Brightness)
                            .onGet(async () => {
                                const state = this.ensemble.enchargesPercentFullSum;
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharges energy level: ${this.ensemble.enchargesPercentFullSum} %`);
                                return state;
                            })
                            .onSet(async (value) => {
                                try {
                                    this.enphaseEnchargesSummaryLevelAndStateService.updateCharacteristic(Characteristic.Brightness, this.ensemble.enchargesPercentFullSum);
                                } catch (error) {
                                    this.emit('error', `Set Encharges energy level error: ${error}`);
                                };
                            })

                        //encharge profile service
                        if (enchargeSettingsSupported) {
                            const enchargeSettings = this.ensemble.encharges.devices.settings;
                            //self consumption
                            if (this.enchargeProfileSelfConsumptionActiveControlsCount > 0) {
                                this.enchargeProfileSelfConsumptionControlServices = [];
                                for (let i = 0; i < this.enchargeProfileSelfConsumptionActiveControlsCount; i++) {
                                    const sensorName = this.enchargeProfileSelfConsumptionActiveControls[i].namePrefix ? `${accessoryName} ${this.enchargeProfileSelfConsumptionActiveControls[i].name}` : this.enchargeProfileSelfConsumptionActiveControls[i].name;
                                    const serviceType = this.enchargeProfileSelfConsumptionActiveControls[i].serviceType;
                                    const characteristicType = this.enchargeProfileSelfConsumptionActiveControls[i].characteristicType;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Encharges Profile ${sensorName} Service`) : false;
                                    const enchargeProfileSelfConsumptionControlService = accessory.addService(serviceType, sensorName, `enchargeProfileSelfConsumptionControlService${i}`);
                                    enchargeProfileSelfConsumptionControlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    enchargeProfileSelfConsumptionControlService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    enchargeProfileSelfConsumptionControlService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = enchargeSettings.selfConsumptionModeBool;;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Encharges profile: Self Consumption, state: ${state ? 'Active' : 'Not Active'}`);
                                            return state;
                                        })
                                        .onSet(async (state) => {
                                            try {
                                                const tokenExpired = await this.checkJwtToken();
                                                const set = !tokenExpired ? state ? await this.setEnchargeProfile('self-consumption', enchargeSettings.reservedSoc, enchargeSettings.chargeFromGrid) : false : false;
                                                const debug = this.enableDebugMode ? this.emit('debug', `Encharges set profile: Self Consumption`) : false;
                                            } catch (error) {
                                                this.emit('error', `Encharges set profile self consumption error: ${error}`);
                                            };
                                        })
                                    enchargeProfileSelfConsumptionControlService.getCharacteristic(Characteristic.Brightness)
                                        .onGet(async () => {
                                            const value = enchargeSettings.reservedSoc;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Encharges profile: Self Consumption, reserve: ${value} %`);
                                            return value;
                                        })
                                        .onSet(async (value) => {
                                            if (value === 0 || value === 100) {
                                                return;
                                            }

                                            try {
                                                const tokenExpired = await this.checkJwtToken();
                                                const set = !tokenExpired ? await this.setEnchargeProfile('self-consumption', value, enchargeSettings.chargeFromGrid) : false;
                                                const debug = this.enableDebugMode ? this.emit('debug', `Encharges set profile: Self Consumption, reserve: ${value} %`) : false;
                                            } catch (error) {
                                                this.emit('error', `Encharges set profile self consumption reserve error: ${error}`);
                                            };
                                        });
                                    this.enchargeProfileSelfConsumptionControlServices.push(enchargeProfileSelfConsumptionControlService);
                                };
                            };

                            //savings
                            if (this.enchargeProfileSavingsActiveControlsCount > 0) {
                                this.enchargeProfileSavingsControlServices = [];
                                for (let i = 0; i < this.enchargeProfileSavingsActiveControlsCount; i++) {
                                    const sensorName = this.enchargeProfileSavingsActiveControls[i].namePrefix ? `${accessoryName} ${this.enchargeProfileSavingsActiveControls[i].name}` : this.enchargeProfileSavingsActiveControls[i].name;
                                    const serviceType = this.enchargeProfileSavingsActiveControls[i].serviceType;
                                    const characteristicType = this.enchargeProfileSavingsActiveControls[i].characteristicType;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Encharge Profile ${sensorName} Service`) : false;
                                    const enchargeProfileSavingsControlService = accessory.addService(serviceType, sensorName, `enchargeProfileSavingsControlService${i}`);
                                    enchargeProfileSavingsControlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    enchargeProfileSavingsControlService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    enchargeProfileSavingsControlService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = enchargeSettings.savingsModeBool;;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Encharges profile: Savings, state: ${state ? 'Active' : 'Not Active'}`);
                                            return state;
                                        })
                                        .onSet(async (state) => {
                                            try {
                                                const tokenExpired = await this.checkJwtToken();
                                                const set = !tokenExpired ? state ? await this.setEnchargeProfile('savings-mode', enchargeSettings.reservedSoc, enchargeSettings.chargeFromGrid) : false : false;
                                                const debug = this.enableDebugMode ? this.emit('debug', `Encharges set profile: Savings`) : false;
                                            } catch (error) {
                                                this.emit('error', `Encharges set profile savings error: ${error}`);
                                            };
                                        })
                                    enchargeProfileSavingsControlService.getCharacteristic(Characteristic.Brightness)
                                        .onGet(async () => {
                                            const value = enchargeSettings.reservedSoc;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Encharges profile: Savings, reserve: ${value} %`);
                                            return value;
                                        })
                                        .onSet(async (value) => {
                                            if (value === 0 || value === 100) {
                                                return;
                                            }

                                            try {
                                                const tokenExpired = await this.checkJwtToken();
                                                const set = !tokenExpired ? await this.setEnchargeProfile('savings-mode', value, enchargeSettings.chargeFromGrid) : false;
                                                const debug = this.enableDebugMode ? this.emit('debug', `Encharges set profile: Savings, reserve: ${value} %`) : false;
                                            } catch (error) {
                                                this.emit('error', `Encharges set profile savings reserve error: ${error}`);
                                            };
                                        })
                                    this.enchargeProfileSavingsControlServices.push(enchargeProfileSavingsControlService);
                                };
                            };


                            //full backup
                            if (this.enchargeProfileFullBackupActiveControlsCount > 0) {
                                this.enchargeProfileFullBackupControlServices = [];
                                for (let i = 0; i < this.enchargeProfileFullBackupActiveControlsCount; i++) {
                                    const sensorName = this.enchargeProfileFullBackupActiveControls[i].namePrefix ? `${accessoryName} ${this.enchargeProfileFullBackupActiveControls[i].name}` : this.enchargeProfileFullBackupActiveControls[i].name;
                                    const serviceType = this.enchargeProfileFullBackupActiveControls[i].serviceType;
                                    const characteristicType = this.enchargeProfileFullBackupActiveControls[i].characteristicType;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Encharge Profile ${sensorName} Service`) : false;
                                    const enchargeProfileFullBackupControlService = accessory.addService(serviceType, sensorName, `enchargeProfileFullBackupControlService${i}`);
                                    enchargeProfileFullBackupControlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    enchargeProfileFullBackupControlService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    enchargeProfileFullBackupControlService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = enchargeSettings.fullBackupModeBool;;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Encharges profile full backup: ${state ? 'Active' : 'Not Active'}`);
                                            return state;
                                        })
                                        .onSet(async (state) => {
                                            try {
                                                const tokenExpired = await this.checkJwtToken();
                                                const set = !tokenExpired ? state ? await this.setEnchargeProfile('backup', 100, enchargeSettings.chargeFromGrid) : false : false;
                                                const debug = this.enableDebugMode ? this.emit('debug', `Encharges set profile: Full Backup`) : false;
                                            } catch (error) {
                                                this.emit('error', `Encharges set profile full backup error: ${error}`);
                                            };
                                        })
                                    this.enchargeProfileFullBackupControlServices.push(enchargeProfileFullBackupControlService);
                                };
                            };
                        };

                        //encharges services
                        this.enchargesServices = [];
                        for (const encharge of this.ensemble.encharges.devices) {
                            const serialNumber = encharge.serialNumber;
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare Encharge ${serialNumber} Service`) : false;
                            const enphaseEnchargeService = accessory.addService(Service.enphaseEnchargeService, `Encharge ${serialNumber}`, serialNumber);
                            enphaseEnchargeService.setCharacteristic(Characteristic.ConfiguredName, `Encharge ${serialNumber}`);
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeAdminStateStr)
                                .onGet(async () => {
                                    const value = encharge.adminStateStr;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber}, state: ${value}`);
                                    return value;
                                });
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeOperating)
                                .onGet(async () => {
                                    const value = encharge.operating;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                                    return value;
                                });
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommunicating)
                                .onGet(async () => {
                                    const value = encharge.communicating;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                                    return value;
                                });
                            if (plcLevelSupported) {
                                enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommLevel)
                                    .onGet(async () => {
                                        const value = encharge.commLevel;
                                        const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber} plc level: ${value} %`);
                                        return value;
                                    });
                            }
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommLevelSubGhz)
                                .onGet(async () => {
                                    const value = encharge.commLevelSubGhz;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber}, sub GHz level: ${value} %`);
                                    return value;
                                });
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommLevel24Ghz)
                                .onGet(async () => {
                                    const value = encharge.commLevel24Ghz;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber}, 2.4GHz level: ${value} %`);
                                    return value;
                                });
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeSleepEnabled)
                                .onGet(async () => {
                                    const value = encharge.sleepEnabled;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber}, sleep: ${value ? 'Yes' : 'No'}`);
                                    return value;
                                });
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargePercentFull)
                                .onGet(async () => {
                                    const value = encharge.percentFull;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber}, percent full: ${value} %`);
                                    return value;
                                });
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeTemperature)
                                .onGet(async () => {
                                    const value = encharge.temperature;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber}, temp: ${value} °C`);
                                    return value;
                                });
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeMaxCellTemp)
                                .onGet(async () => {
                                    const value = encharge.maxCellTemp;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber}, max cell temp: ${value} °C`);
                                    return value;
                                });
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeLedStatus)
                                .onGet(async () => {
                                    const value = encharge.ledStatus;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber}, LED status: ${value}`);
                                    return value;
                                });
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCapacity)
                                .onGet(async () => {
                                    const value = encharge.capacity;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber}, capacity: ${value} kWh`);
                                    return value;
                                });
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeDcSwitchOff)
                                .onGet(async () => {
                                    const value = encharge.dcSwitchOff;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber}, status: ${value ? 'Yes' : 'No'}`);
                                    return value;
                                });
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeRev)
                                .onGet(async () => {
                                    const value = encharge.rev;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber}, revision: ${value}`);
                                    return value;
                                });
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeGridProfile)
                                .onGet(async () => {
                                    const value = encharge.arfProfile;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber}, grid profile: ${value}`);
                                    return value;
                                });
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeStatus)
                                .onGet(async () => {
                                    const value = encharge.deviceStatus;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber}, status: ${value}`);
                                    return value;
                                });
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeLastReportDate)
                                .onGet(async () => {
                                    const value = encharge.lastReportDate;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${serialNumber}, last report: ${value}`);
                                    return value;
                                });
                            this.enchargesServices.push(enphaseEnchargeService);
                        }
                    }

                    //enpowers
                    if (enpowersInstalled) {
                        const serialNumber = this.ensemble.enpowers.devices[0].serialNumber;

                        //grid state control service
                        if (this.enpowerGridStateActiveControlsCount > 0) {
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${serialNumber} Grid State Control Service`) : false;
                            this.enpowerGridStateControlsServices = [];
                            for (let i = 0; i < this.enpowerGridStateActiveControlsCount; i++) {
                                const controlName = this.enpowerGridStateActiveControls[i].namePrefix ? `${accessoryName} ${this.enpowerGridStateActiveControls[i].name}` : this.enpowerGridStateActiveControls[i].name;
                                const serviceType = this.enpowerGridStateActiveControls[i].serviceType;
                                const characteristicType = this.enpowerGridStateActiveControls[i].characteristicType;
                                const enpowerGridStateContolService = accessory.addService(serviceType, controlName, `enpwerGridStateControlService${i}`);
                                enpowerGridStateContolService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                enpowerGridStateContolService.setCharacteristic(Characteristic.ConfiguredName, controlName);
                                enpowerGridStateContolService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const state = this.enpowerGridStateActiveControls[i].state;
                                        const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, grid state: ${state ? 'Grid ON' : 'Grid OFF'}`);
                                        return state;
                                    })
                                    .onSet(async (state) => {
                                        try {
                                            const tokenExpired = await this.checkJwtToken();
                                            const set = !tokenExpired ? await this.setEnpowerGridState(state) : false;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Set Enpower: ${serialNumber}, grid state to: ${state ? `Grid ON` : `Grid OFF`}`);
                                        } catch (error) {
                                            this.emit('error', `Set Enpower: ${serialNumber}, grid state error: ${error}`);
                                        };
                                    })
                                this.enpowerGridStateControlsServices.push(enpowerGridStateContolService);
                            };
                        };

                        //grid state sensor services
                        if (this.enpowerGridStateActiveSensorsCount > 0) {
                            this.enpowerGridStateSensorsServices = [];
                            for (let i = 0; i < this.enpowerGridStateActiveSensorsCount; i++) {
                                const sensorName = this.enpowerGridStateActiveSensors[i].namePrefix ? `${accessoryName} ${this.enpowerGridStateActiveSensors[i].name}` : this.enpowerGridStateActiveSensors[i].name;
                                const serviceType = this.enpowerGridStateActiveSensors[i].serviceType;
                                const characteristicType = this.enpowerGridStateActiveSensors[i].characteristicType;
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${serialNumber} Grid State Sensor ${sensorName} Service`) : false;
                                const enpowerGridStateSensorsService = accessory.addService(serviceType, sensorName, `enpowerGridStateSensorService${i}`);
                                enpowerGridStateSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                enpowerGridStateSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                enpowerGridStateSensorsService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const state = this.enpowerGridStateActiveSensors[i].state;
                                        const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, grid state sensor: ${sensorName}, state: ${state ? 'Grid ON' : 'Grid Off'}`);
                                        return state;
                                    });
                                this.enpowerGridStateSensorsServices.push(enpowerGridStateSensorsService);
                            };
                        };

                        //grid mode sensor services
                        if (this.enpowerGridModeActiveSensorsCount > 0) {
                            this.enpowerGridModeSensorsServices = [];
                            for (let i = 0; i < this.enpowerGridModeActiveSensorsCount; i++) {
                                const sensorName = this.enpowerGridModeActiveSensors[i].namePrefix ? `${accessoryName} ${this.enpowerGridModeActiveSensors[i].name}` : this.enpowerGridModeActiveSensors[i].name;
                                const serviceType = this.enpowerGridModeActiveSensors[i].serviceType;
                                const characteristicType = this.enpowerGridModeActiveSensors[i].characteristicType;
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${serialNumber} Grid Mode Sensor ${sensorName} Service`) : false;
                                const enpowerGridModeSensorsService = accessory.addService(serviceType, sensorName, `enpowerGridModeSensorService${i}`);
                                enpowerGridModeSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                enpowerGridModeSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                enpowerGridModeSensorsService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const state = this.enpowerGridModeActiveSensors[i].state;
                                        const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, grid mode sensor: ${sensorName}, state: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                this.enpowerGridModeSensorsServices.push(enpowerGridModeSensorsService);
                            };
                        };

                        //enpower dry contacts
                        if (dryContactsInstalled) {
                            if (this.enpowerDryContactsControl) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${serialNumber} Dry Contacts Control Services`) : false;
                                this.dryContactsControlServices = [];
                                this.dryContacts.forEach((contact, index) => {
                                    const controlId = contact.settings.id;
                                    const controlName = contact.settings.loadName;
                                    const dryContactsContolService = accessory.addService(Service.Switch, controlName, `dryContactsContolService${index}`);
                                    dryContactsContolService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    dryContactsContolService.setCharacteristic(Characteristic.ConfiguredName, controlName);
                                    dryContactsContolService.getCharacteristic(Characteristic.On)
                                        .onGet(async () => {
                                            const state = contact.stateBool;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, ${controlName}, control state: ${state ? 'ON' : 'OFF'}`);
                                            return state;
                                        })
                                        .onSet(async (state) => {
                                            try {
                                                const tokenExpired = await this.checkJwtToken();
                                                const set = !tokenExpired ? await this.setDryContact(controlId, state) : false;
                                                const info = this.disableLogInfo ? false : this.emit('message', `Set Enpower: ${serialNumber}, ${controlName}, control state to: ${state ? `Manual` : `Soc`}`);
                                            } catch (error) {
                                                this.emit('error', `Set ${controlName}, control state error: ${error}`);
                                            };
                                        })
                                    this.dryContactsControlServices.push(dryContactsContolService);
                                });
                            };

                            if (this.enpowerDryContactsSensors) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${serialNumber} Dry Contacts Sensors Services`) : false;
                                this.dryContactsSensorsServices = [];
                                this.dryContacts.forEach((contact, index) => {
                                    const controlName = contact.settings.loadName;
                                    const dryContactsSensorsService = accessory.addService(Service.ContactSensor, controlName, `dryContactsSensorsService${index}`);
                                    dryContactsSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    dryContactsSensorsService.setCharacteristic(Characteristic.ConfiguredName, controlName);
                                    dryContactsSensorsService.getCharacteristic(Characteristic.ContactSensorState)
                                        .onGet(async () => {
                                            const state = contact.stateBool;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, ${controlName}, sensor state: ${state ? 'Active' : 'Not Active'}`);
                                            return state;
                                        })
                                    this.dryContactsSensorsServices.push(dryContactsSensorsService);
                                });
                            };
                        };

                        //enpower services
                        this.enpowersServices = [];
                        for (const enpower of this.ensemble.enpowers.devices) {
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${serialNumber} Service`) : false;
                            const enphaseEnpowerService = accessory.addService(Service.enphaseEnpowerService, `Enpower ${serialNumber}`, serialNumber);
                            enphaseEnpowerService.setCharacteristic(Characteristic.ConfiguredName, `Enpower ${serialNumber}`);
                            enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerAdminStateStr)
                                .onGet(async () => {
                                    const value = enpower.adminStateStr;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, state: ${value}`);
                                    return value;
                                });
                            //enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerOperating)
                            //    .onGet(async () => {
                            //       const value = enpower.operating;
                            //        const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                            //        return value;
                            //   });
                            enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerCommunicating)
                                .onGet(async () => {
                                    const value = enpower.communicating;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                                    return value;
                                });
                            enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerCommLevelSubGhz)
                                .onGet(async () => {
                                    const value = enpower.commLevelSubGhz;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, sub GHz level: ${value} %`);
                                    return value;
                                });
                            enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerCommLevel24Ghz)
                                .onGet(async () => {
                                    const value = enpower.commLevel24Ghz;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, 2.4GHz level: ${value} %`);
                                    return value;
                                });
                            enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerTemperature)
                                .onGet(async () => {
                                    const value = enpower.temperature;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, temp: ${value} °C`);
                                    return value;
                                });
                            enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerMainsAdminState)
                                .onGet(async () => {
                                    const value = enpower.mainsAdminState;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, mains admin state: ${value}`);
                                    return value;
                                });
                            enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerMainsOperState)
                                .onGet(async () => {
                                    const value = enpower.mainsOperState;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, mains operating state: ${value}`);
                                    return value;
                                });
                            enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerEnpwrGridMode)
                                .onGet(async () => {
                                    const value = enpower.enpwrGridModeTranslated;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, enpower grid mode: ${value}`);
                                    return value;
                                });
                            enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerEnchgGridMode)
                                .onGet(async () => {
                                    const value = enpower.enchgGridModeTranslated;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, encharge grid mode: ${value}`);
                                    return value;
                                });
                            enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerGridProfile)
                                .onGet(async () => {
                                    const value = enpower.arfProfile;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, grid profile: ${value}`);
                                    return value;
                                });
                            enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerStatus)
                                .onGet(async () => {
                                    const value = enpower.deviceStatus;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, status: ${value}`);
                                    return value;
                                });
                            enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerLastReportDate)
                                .onGet(async () => {
                                    const value = enpower.lastReportDate;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${serialNumber}, last report: ${value}`);
                                    return value;
                                });
                            this.enpowersServices.push(enphaseEnpowerService);
                        };
                    }

                    //generators
                    if (generatorsInstalled) {
                        //generator control service
                        const type = this.ensemble.generator.type;
                        if (this.generatorStateActiveControlsCount > 0) {
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare Generator ${type} Control Service`) : false;
                            this.generatorStateControlsServices = [];
                            for (let i = 0; i < this.generatorStateActiveControlsCount; i++) {
                                const controlName = this.generatorStateActiveControls[i].namePrefix ? `${accessoryName} ${this.generatorStateActiveControls[i].name}` : this.generatorStateActiveControls[i].name;
                                const serviceType = this.generatorStateActiveControls[i].serviceType;
                                const characteristicType = this.generatorStateActiveControls[i].characteristicType;
                                const generatorStateContolService = accessory.addService(serviceType, controlName, `generatorStateContolService${i}`);
                                generatorStateContolService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                generatorStateContolService.setCharacteristic(Characteristic.ConfiguredName, controlName);
                                generatorStateContolService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const state = this.generatorStateActiveControls[i].state;
                                        const info = this.disableLogInfo ? false : this.emit('message', `Generator: ${type}, state: ${state ? 'ON' : 'OFF'}`);
                                        return state;
                                    })
                                    .onSet(async (state) => {
                                        try {
                                            const genMode = state ? 1 : 0;
                                            const tokenExpired = await this.checkJwtToken();
                                            const set = !tokenExpired ? await this.setGeneratorMode(genMode) : false;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Set Generator: ${type}, state to: ${state ? `ON` : `OFF`}`);
                                        } catch (error) {
                                            this.emit('error', `Set Generator: ${type}, state error: ${error}`);
                                        };
                                    })
                                this.generatorStateControlsServices.push(generatorStateContolService);
                            };
                        };

                        //generator state sensor services
                        if (this.generatorStateActiveSensorsCount > 0) {
                            this.generatorStateSensorsServices = [];
                            for (let i = 0; i < this.generatorStateActiveSensorsCount; i++) {
                                const sensorName = this.generatorStateActiveSensors[i].namePrefix ? `${accessoryName} ${this.generatorStateActiveSensors[i].name}` : this.generatorStateActiveSensors[i].name;
                                const serviceType = this.generatorStateActiveSensors[i].serviceType;
                                const characteristicType = this.generatorStateActiveSensors[i].characteristicType;
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare Generator ${type} State Sensor ${sensorName} Service`) : false;
                                const generatorStateSensorsService = accessory.addService(serviceType, sensorName, `generatorStateSensorsService${i}`);
                                generatorStateSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                generatorStateSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                generatorStateSensorsService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const state = this.generatorStateActiveSensors[i].state;
                                        const info = this.disableLogInfo ? false : this.emit('message', `Generator: ${type}, state sensor: ${sensorName}, state: ${state ? 'Grid ON' : 'Grid Off'}`);
                                        return state;
                                    });
                                this.generatorStateSensorsServices.push(generatorStateSensorsService);
                            };
                        };

                        //generator mode sensor services
                        if (this.generatorModeActiveSensorsCount > 0) {
                            this.generatorModeSensorsServices = [];
                            for (let i = 0; i < this.generatorModeActiveSensorsCount; i++) {
                                const sensorName = this.generatorModeActiveSensors[i].namePrefix ? `${accessoryName} ${this.generatorModeActiveSensors[i].name}` : this.generatorModeActiveSensors[i].name;
                                const serviceType = this.generatorModeActiveSensors[i].serviceType;
                                const characteristicType = this.generatorModeActiveSensors[i].characteristicType;
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare Generator ${type} Mode Sensor ${sensorName} Service`) : false;
                                const generatorModeSensorsService = accessory.addService(serviceType, sensorName, `generatorModeSensorsService${i}`);
                                generatorModeSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                generatorModeSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                generatorModeSensorsService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const state = this.generatorModeActiveSensors[i].state;
                                        const info = this.disableLogInfo ? false : this.emit('message', `Generator: ${type}, mode sensor: ${sensorName}, state: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                this.generatorModeSensorsServices.push(generatorModeSensorsService);
                            };
                        };

                        //generator services
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Generator ${type} Service`) : false;
                        this.generatorService = accessory.addService(Service.enphaseGerneratorService, `Generator ${type}`, type);
                        this.generatorService.setCharacteristic(Characteristic.ConfiguredName, `Generator ${type}`);
                        this.generatorService.getCharacteristic(Characteristic.enphaseEnsembleGeneratorType)
                            .onGet(async () => {
                                const value = this.ensemble.generator.type;
                                const info = this.disableLogInfo ? false : this.emit('message', `Generator type: ${type}`);
                                return value;
                            });
                        this.generatorService.getCharacteristic(Characteristic.enphaseEnsembleGeneratorAdminMode)
                            .onGet(async () => {
                                const value = this.ensemble.generator.adminMode;
                                const info = this.disableLogInfo ? false : this.emit('message', `Generator: ${type}, admin mode: ${value}`);
                                return value;
                            });
                        this.generatorService.getCharacteristic(Characteristic.enphaseEnsembleGeneratorAdminState)
                            .onGet(async () => {
                                const value = this.ensemble.generator.adminState;
                                const info = this.disableLogInfo ? false : this.emit('message', `Generator: ${type}, admin state: ${value}`);
                                return value;
                            });
                        this.generatorService.getCharacteristic(Characteristic.enphaseEnsembleGeneratorOperState)
                            .onGet(async () => {
                                const value = this.ensemble.generator.operState;
                                const info = this.disableLogInfo ? false : this.emit('message', `Generator: ${type}, operation state: ${value}`);
                                return value;
                            });
                        this.generatorService.getCharacteristic(Characteristic.enphaseEnsembleGeneratorStartSoc)
                            .onGet(async () => {
                                const value = this.ensemble.generator.startSoc;
                                const info = this.disableLogInfo ? false : this.emit('message', `Generator: ${type}, start soc: ${value}`);
                                return value;
                            });
                        this.generatorService.getCharacteristic(Characteristic.enphaseEnsembleGeneratorStopSoc)
                            .onGet(async () => {
                                const value = this.ensemble.generator.stopSoc;
                                const info = this.disableLogInfo ? false : this.emit('message', `Generator: ${type}, stop soc: ${value}`);
                                return value;
                            });
                        this.generatorService.getCharacteristic(Characteristic.enphaseEnsembleGeneratorExexOn)
                            .onGet(async () => {
                                const value = this.ensemble.generator.excOn;
                                const info = this.disableLogInfo ? false : this.emit('message', `Generator: ${type}, exec on: ${value}`);
                                return value;
                            });
                        this.generatorService.getCharacteristic(Characteristic.enphaseEnsembleGeneratorShedule)
                            .onGet(async () => {
                                const value = this.ensemble.generator.schedule;
                                const info = this.disableLogInfo ? false : this.emit('message', `Generator: ${type}, shedule: ${value}`);
                                return value;
                            });
                        this.generatorService.getCharacteristic(Characteristic.enphaseEnsembleGeneratorPresent)
                            .onGet(async () => {
                                const value = this.ensemble.generator.present;
                                const info = this.disableLogInfo ? false : this.emit('message', `Generator: ${type}, present: ${value}`);
                                return value;
                            });
                    }
                }

                //live data
                if (liveDataSupported) {
                    this.liveDataMetersServices = [];
                    for (const liveData of this.pv.liveData.devices) {
                        const liveDataType = liveData.type;
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Live Data ${liveDataType} Service`) : false;
                        const enphaseLiveDataService = accessory.addService(Service.enphaseLiveDataService, `Live Data ${liveDataType}`, liveDataType);
                        enphaseLiveDataService.setCharacteristic(Characteristic.ConfiguredName, `Live Data ${liveDataType}`);
                        enphaseLiveDataService.getCharacteristic(Characteristic.enphaseLiveDataActivePower)
                            .onGet(async () => {
                                const value = liveData.activePower;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data ${liveDataType}, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataService.getCharacteristic(Characteristic.enphaseLiveDataActivePowerL1)
                            .onGet(async () => {
                                const value = liveData.activePowerL1;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data ${liveDataType} L1, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataService.getCharacteristic(Characteristic.enphaseLiveDataActivePowerL2)
                            .onGet(async () => {
                                const value = liveData.activePowerL2;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data ${liveDataType} L2, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataService.getCharacteristic(Characteristic.enphaseLiveDataActivePowerL3)
                            .onGet(async () => {
                                const value = liveData.activePowerL3;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data ${liveDataType} L3, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataService.getCharacteristic(Characteristic.enphaseLiveDataApparentPower)
                            .onGet(async () => {
                                const value = liveData.apparentPower;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data ${liveDataType}, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataService.getCharacteristic(Characteristic.enphaseLiveDataApparentPowerL1)
                            .onGet(async () => {
                                const value = liveData.apparentPowerL1;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data ${liveDataType} L1, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataService.getCharacteristic(Characteristic.enphaseLiveDataApparentPowerL2)
                            .onGet(async () => {
                                const value = liveData.apparentPowerL2;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data ${liveDataType} L2, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataService.getCharacteristic(Characteristic.enphaseLiveDataApparentPowerL3)
                            .onGet(async () => {
                                const value = liveData.apparentPowerL3;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data ${liveDataType} L3, apparent power: ${value} kVA`);
                                return value;
                            });
                        this.liveDataMetersServices.push(enphaseLiveDataService);
                    }
                }

                resolve(accessory);
            } catch (error) {
                reject(`Prepare accessory error: ${error}`)
            };
        });
    }
}
module.exports = EnvoyDevice;
