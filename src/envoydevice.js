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

        this.supportProductionPowerMode = device.supportProductionPowerMode || false;
        this.supportPlcLevel = device.supportPlcLevel || false;
        this.supportEnchargeProfile = device.supportEnchargeProfile || false;

        this.metersDataRefreshTime = device.metersDataRefreshTime * 1000 || 2000;
        this.productionDataRefreshTime = device.productionDataRefreshTime * 1000 || 5000;
        this.liveDataRefreshTime = device.liveDataRefreshTime * 1000 || 2000;
        this.ensembleDataRefreshTime = device.ensembleDataRefreshTime * 1000 || 15000;

        this.enpowerGridModeSensors = device.enpowerGridModeSensors || [];
        this.enchargeGridModeSensors = this.envoyFirmware7xx ? device.enchargeGridModeSensors || [] : [];
        this.enchargeBackupLevelSensors = this.envoyFirmware7xx ? device.enchargeBackupLevelSensors || [] : [];
        this.solarGridModeSensors = this.envoyFirmware7xx ? device.solarGridModeSensors || [] : [];

        this.enableDebugMode = device.enableDebugMode || false;
        this.disableLogInfo = device.disableLogInfo || false;
        this.disableLogDeviceInfo = device.disableLogDeviceInfo || false;

        //external integration
        this.restFulConnected = false;
        this.mqttConnected = false;

        //setup variables
        this.envoyIdFile = envoyIdFile;
        this.envoyTokenFile = envoyTokenFile;
        this.envoyInstallerPasswordFile = envoyInstallerPasswordFile;
        this.checkCommLevel = false;
        this.startPrepareAccessory = true;
        this.updateHome = false;
        this.updateMeters = false;
        this.updateEnsembleInventory = false;
        this.updateLive = false;
        this.updateProduction = false;
        this.updateMicroinverters = false;

        //active sensors 
        //power production state sensor
        const powerProductionStateSensorName = this.powerProductionStateSensor.name || false;
        const powerProductionStateSensorDisplayType = this.powerProductionStateSensor.displayType ?? 0;
        this.powerProductionStateActiveSensors = [];
        if (powerProductionStateSensorName && powerProductionStateSensorDisplayType > 0) {
            const sensor = {};
            sensor.name = powerProductionStateSensorName;
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
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][energyConsumptionNetStateSensorDisplayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][energyConsumptionNetStateSensorDisplayType];
            sensor.state = false;
            this.energyConsumptionNetStateActiveSensors.push(sensor);
        } else {
            const log = energyConsumptionNetStateSensorDisplayType === 0 ? false : this.emit('message', `Sensor Name Missing.`);
        };
        this.energyConsumptionNetStateActiveSensorsCount = this.energyConsumptionNetStateActiveSensors.length || 0

        //
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

        //jwt token
        this.jwtToken = {
            generation_time: 0,
            token: envoyToken,
            expires_at: 0,
        };

        //arf profile
        this.arfProfile = {
            name: 'Unknown',
            id: 0,
            version: '',
            item_count: 0
        }

        //envoy
        this.envoyDevId = '';
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
        this.envoyCommEsubNum = 0;
        this.envoyCommEsubLevel = 0;
        this.envoyCommEnchgNum = 0;
        this.envoyCommEnchgLevel = 0
        this.envoyUpdateStatus = '';
        this.envoyTimeZone = '';
        this.envoyCurrentDate = '';
        this.envoyCurrentTime = '';
        this.envoyLastEnlightenReporDate = 0;

        //envoy section ensemble
        this.wirelessConnectionKitSupported = false;
        this.wirelessConnectionKitInstalled = false;
        this.wirelessConnectionKitConnectionsCount = 0;
        this.envoyCommEnchgLevel24g = 0;
        this.envoyCommEnchagLevelSubg = 0;

        //microinverters
        this.microinvertersSupported = false;
        this.microinvertersInstalled = false;
        this.microinvertersCount = 0;
        this.microinvertersType = 'Unknown';
        this.microinvertersPowerSupported = false;

        //qrelays
        this.qRelaysSupported = false;
        this.qRelaysInstalled = false;
        this.qRelaysCount = 0;
        this.qRelaysType = 'Unknown';

        //ac batteries
        this.acBatteriesSupported = false;
        this.acBatteriesInstalled = false;
        this.acBatteriesCount = 0;
        this.acBatteriesType = 'Unknown';
        this.acBatteriesSummaryType = 'Unknown';
        this.acBatteriesSummaryActiveCount = 0;
        this.acBatteriesSummaryReadingTime = '';
        this.acBatteriesSummaryPower = 0;
        this.acBatteriesSummaryEnergy = 0;
        this.acBatteriesSummaryState = 'Unknown';
        this.acBatteriesSummaryPercentFull = 0;
        this.acBatteriesSummaryEnergyState = false;

        //ensembles
        this.ensemblesSupported = false;
        this.ensemblesInstalled = false;
        this.ensemblesCount = 0;
        this.ensemblesType = 'Unknown';
        this.ensembleRestPower = 0;
        this.ensembleFreqBiasHz = 0;
        this.ensembleVoltageBiasV = 0;
        this.ensembleFreqBiasHzQ8 = 0;
        this.ensembleVoltageBiasVQ5 = 0;
        this.ensembleFreqBiasHzPhaseB = 0;
        this.ensembleVoltageBiasVPhaseB = 0;
        this.ensembleFreqBiasHzQ8PhaseB = 0;
        this.ensembleVoltageBiasVQ5PhaseB = 0;
        this.ensembleFreqBiasHzPhaseC = 0;
        this.ensembleVoltageBiasVPhaseC = 0;
        this.ensembleFreqBiasHzQ8PhaseC = 0;
        this.ensembleVoltageBiasVQ5PhaseC = 0;
        this.ensembleConfiguredBackupSoc = 0;
        this.ensembleAdjustedBackupSoc = 0;
        this.ensembleAggSoc = 0;
        this.ensembleAggMaxEnergy = 0;
        this.ensembleEncAggSoc = 0;
        this.ensembleEncAggBackupEnergy = 0;
        this.ensembleEncAggAvailEnergy = 0;
        this.ensembleFakeInventoryMode = false;

        //encharges
        this.enchargesSupported = false;
        this.enchargesInstalled = false;
        this.enchargesCount = 0;
        this.enchargesType = 'Unknown';
        this.enchargesRatedPowerSum = 0;
        this.enchargesSummaryPercentFull = 0;
        this.enchargesSummaryEnergyState = false;
        this.enchargesGridMode = 'Unknown';
        this.enchargesGridModeTranslated = 'Unknown';

        //enpowers
        this.enpowersSupported = false;
        this.enpowersInstalled = false;
        this.enpowersConnected = false;
        this.enpowersCount = 0;
        this.enpowersType = '';
        this.enpowersGridMode = 'Unknown';
        this.enpowersGridModeTranslated = 'Unknown';

        //solar
        this.solarGridMode = 'Unknown';
        this.solarGridModeTranslated = 'Unknown';

        //generators
        this.generatorsSupported = false;
        this.generatorsInstalled = false;

        //ct meters
        this.metersSupported = false;
        this.metersCount = 0;
        this.metersProductionSupported = false;
        this.metersProductionEnabled = false;
        this.metersProductionVoltageDivide = 1;
        this.metersConsumptionSupported = false;
        this.metersConsumptionEnabled = false;
        this.metersConsumpionVoltageDivide = 1;
        this.metersStorageSupported = false;
        this.metersStorageEnabled = false;
        this.metersStorageVoltageDivide = 1;
        this.metersReadingInstalled = false;
        this.metersReadingCount = 0;
        this.metersReadingPhaseCount = 0;

        //production
        this.productionPowerState = false;
        this.productionPowerLevel = 0;
        this.productionMicroSummarywhToday = 0;
        this.productionMicroSummarywhLastSevenDays = 0;
        this.productionMicroSummarywhLifeTime = 0;
        this.productionMicroSummaryWattsNow = 0;

        //production CT
        this.productionMeasurmentType = 'Unknown';
        this.productionActiveCount = 0;
        this.productionPower = 0;
        this.productionPowerPeak = 0;
        this.productionPowerPeakDetected = false;
        this.productionEnergyToday = 0;
        this.productionEnergyLastSevenDays = 0;
        this.productionEnergyLifeTime = 0;
        this.productionEnergyState = false;
        this.productionRmsCurrent = 0;
        this.productionRmsVoltage = 0;
        this.productionReactivePower = 0;
        this.productionApparentPower = 0;
        this.productionPwrFactor = 0;
        this.productionReadingTime = '';

        //consumption CT
        this.consumptionsPowerPeak = [];
        this.consumptionsCount = 0;

        //liveData
        this.liveDataSupported = false;
        this.liveDataMetersCount = 0;

        //production power mode
        this.productionPowerModeSupported = false;
        this.productionPowerMode = false;

        //plc level
        this.plcLevelSupported = false;

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
        const restFulEnabled = device.enableRestFul || false;
        if (restFulEnabled) {
            this.restFul = new RestFul({
                port: device.restFulPort || 3000,
                debug: device.restFulDebug || false
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
        const mqttEnabled = device.enableMqtt || false;
        if (mqttEnabled) {
            this.mqtt = new Mqtt({
                host: device.mqttHost,
                port: device.mqttPort || 1883,
                clientId: device.mqttClientId || `envoy_${Math.random().toString(16).slice(3)}`,
                prefix: `${device.mqttPrefix}/${device.name}`,
                user: device.mqttUser,
                passwd: device.mqttPasswd,
                debug: device.mqttDebug || false
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
                                const set = this.productionPowerModeSupported ? await this.setProductionPowerModeData(value) : false;
                                break;
                            case 'PlcLevel':
                                const set1 = this.plcLevelSupported ? await this.updatePlcLevelData(value) : false;
                                break;
                            case 'EnchargeProfile':
                                switch (value) {
                                    case 'selfconsumption':
                                        await this.setEnchargeProfile('self-consumption');
                                        break;
                                    case 'savings':
                                        await this.setEnchargeProfile('savings');
                                        break;
                                    case 'fullbackup':
                                        await this.setEnchargeProfile('fullbackup');
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
        const timers = [
            { name: 'updateHome', interval: 60000 },
            { name: 'updateMeters', interval: this.metersDataRefreshTime },
            { name: 'updateEnsemble', interval: this.ensembleDataRefreshTime },
            { name: 'updateLive', interval: this.liveDataRefreshTime },
            { name: 'updateProduction', interval: this.productionDataRefreshTime },
            { name: 'updateMicroinverters', interval: 80000 }
        ];
        this.impulseGenerator = new ImpulseGenerator(timers);
        this.impulseGenerator.on('updateHome', async () => {
            try {
                const tokenExpired = this.envoyFirmware7xx ? this.envoyFirmware7xxTokenGenerationMode === 1 ? false : this.checkJwtToken() : false;
                const updateHome = !this.updateHome || tokenExpired ? false : await this.updateHomeData();
                const updateInventory = updateHome ? await this.updateInventoryData() : false;
            } catch (error) {
                this.emit('error', `Update home error: ${error}`);
            };
        }).on('updateMeters', async () => {
            try {
                const tokenExpired = this.envoyFirmware7xx ? this.envoyFirmware7xxTokenGenerationMode === 1 ? false : await this.checkJwtToken() : false;
                const updateMeters = !this.updateMeters || tokenExpired ? false : await this.updateMetersData();
                const updateMetersReading = updateMeters ? await this.updateMetersReadingData() : false;
            } catch (error) {
                this.emit('error', `Update meters error: ${error}`);
            };
        }).on('updateEnsemble', async () => {
            try {
                const tokenExpired = this.envoyFirmware7xx ? this.envoyFirmware7xxTokenGenerationMode === 1 ? false : await this.checkJwtToken() : false;
                const updateEnsembleInventory = !this.updateEnsembleInventory || tokenExpired ? false : await this.updateEnsembleInventoryData();
                const updateEnsembleStatus = updateEnsembleInventory ? await this.updateEnsembleStatusData() : false;
            } catch (error) {
                this.emit('error', `Update ensemble inventoty error: ${error}`);
            };
        }).on('updateLive', async () => {
            try {
                const tokenExpired = this.envoyFirmware7xx ? this.envoyFirmware7xxTokenGenerationMode === 1 ? false : await this.checkJwtToken() : false;
                const updateLive = !this.updateLive || tokenExpired ? false : await this.updateLiveData();
            } catch (error) {
                this.emit('error', `Update live data error: ${error}`);
            };
        }).on('updateProduction', async () => {
            try {
                const tokenExpired = this.envoyFirmware7xx ? this.envoyFirmware7xxTokenGenerationMode === 1 ? false : await this.checkJwtToken() : false;
                const updateProduction = !this.updateProduction || tokenExpired ? false : await this.updateProductionData();
                const updateProductionCt = updateProduction ? await this.updateProductionCtData() : false;
            } catch (error) {
                this.emit('error', `Update production error: ${error}`);
            };
        }).on('updateMicroinverters', async () => {
            try {
                const tokenExpired = this.envoyFirmware7xx ? this.envoyFirmware7xxTokenGenerationMode === 1 ? false : await this.checkJwtToken() : false;
                const updateMicroinverters = !this.updateMicroinverters || tokenExpired ? false : await this.updateMicroinvertersData();
            } catch (error) {
                this.emit('error', `Update microinverters error: ${error}`);
            };
        });

        this.start();
    }

    async start() {
        const debug = this.enableDebugMode ? this.emit('debug', `Start.`) : false;

        try {
            //get and validate jwt token
            const getJwtToken = this.envoyFirmware7xx ? this.envoyFirmware7xxTokenGenerationMode === 1 ? true : await this.getJwtToken() : false;
            const validJwtToken = getJwtToken ? await this.validateJwtToken() : false;
            const updateGridProfileData = validJwtToken ? await this.updateGridProfileData() : false;

            //get envoy dev id
            const envoyDevIdExist = this.supportProductionPowerMode ? await this.getEnvoyBackboneAppData() : false;

            //get envoy info and inventory data
            await this.updateInfoData();
            const updateHome = await this.updateHomeData();
            const updateInventory = updateHome ? await this.updateInventoryData() : false;
            const updateMeters = this.metersSupported ? await this.updateMetersData() : false;
            const updateMetersReading = updateMeters ? await this.updateMetersReadingData() : false;

            //get ensemble data only FW. >= 7.x.x.
            const updateEnsembleInventory = validJwtToken ? await this.updateEnsembleInventoryData() : false;
            const updateEnsembleStatus = updateEnsembleInventory ? await this.updateEnsembleStatusData() : false;
            const updateLive = validJwtToken ? await this.updateLiveData() : false;

            //get production and inverters data
            const updateProduction = await this.updateProductionData();
            const updateProductionCt = updateProduction ? await this.updateProductionCtData() : false;

            //acces with envoy password
            const calculateEnvoyPassword = !this.envoyFirmware7xx ? await this.calculateEnvoyPassword() : false;
            const updateMicroinverters = validJwtToken || calculateEnvoyPassword ? await this.updateMicroinvertersData() : false;

            //access with installer password
            const calculateInstallerPassword = !this.envoyFirmware7xx ? await this.calculateInstallerPassword() : false;
            const getProductionPowerMode = envoyDevIdExist && (validJwtToken || calculateInstallerPassword) ? await this.getProductionPowerModeData() : false;
            const updatePlcLevel = this.supportPlcLevel && (validJwtToken || calculateInstallerPassword) ? await this.updatePlcLevelData() : false;

            //get device info
            const logDeviceInfo = !this.disableLogDeviceInfo ? this.getDeviceInfo() : false;

            //prepare accessory
            const accessory = this.startPrepareAccessory ? await this.prepareAccessory() : false;
            const publishAccessory = this.startPrepareAccessory ? this.emit('publishAccessory', accessory) : false;
            this.startPrepareAccessory = false;

            //start update data
            this.updateHome = updateHome;
            this.updateMeters = updateMeters;
            this.updateEnsembleInventory = updateEnsembleInventory;
            this.updateLive = updateLive;
            this.updateProduction = updateProduction;
            this.updateMicroinverters = updateMicroinverters;
            this.impulseGenerator.start();
        } catch (error) {
            this.emit('errorStart', `Start error: ${error}`);
        };
    };

    checkJwtToken() {
        return new Promise((resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting check JWT token.`) : false;

            try {
                const tokenExpired = Math.floor(new Date().getTime() / 1000) > this.jwtToken.expires_at;
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
                this.arfProfile.name = (profile.name).substring(0, 64) ?? 'Unknown';
                this.arfProfile.id = profile.id ?? 0;
                this.arfProfile.version = profile.version ?? '';
                this.arfProfile.item_count = profile.item_count ?? 0;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('gridprofile', profile) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Grid Profile', profile) : false;
                resolve(this.arfProfile);
            } catch (error) {
                resolve(this.arfProfile);
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
                const time = new Date(envoyInfo.time * 1000).toLocaleString();
                const envoyKeys = Object.keys(envoyInfo);

                //device
                const device = envoyInfo.device;
                const serialNumber = this.envoySerialNumber ? this.envoySerialNumber : device.sn.toString();
                const partNumber = CONSTANTS.PartNumbers[device.pn] ?? device.pn;
                const software = device.software;
                const euaid = device.euaid;
                const seqNum = device.seqnum;
                const apiVer = device.apiver;
                const imeter = device.imeter ?? false;

                //web tokens
                const webTokens = envoyKeys.includes('web-tokens') ? envoyInfo['web-tokens'] === true : false;

                //packages
                const packages = envoyInfo.package;
                for (const devPackage of packages) {
                    const packagePn = devPackage.pn;
                    const packageVersion = devPackage.version;
                    const packageBuild = devPackage.build;
                    const packageName = devPackage.name;
                };

                //build info
                const build = envoyInfo.build_info;
                const buildId = build.build_id;
                const buildTimeQmt = new Date(build.build_time_gmt * 1000).toLocaleString();
                const releaseVer = build.release_ver ?? 'Unknown';
                const releaseStage = build.release_stage ?? 'Unknown';

                //check serial number
                if (!serialNumber) {
                    reject(`Envoy serial number missing: ${serialNumber}.`);
                    return;
                };

                this.envoyTime = time;
                this.envoySerialNumber = serialNumber;
                this.envoyModelName = partNumber;
                this.envoyFirmware = software.toString();
                this.metersSupported = imeter;

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
                const deviceSn = this.envoySerialNumber;
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
                const generatorsSupported = envoyCommKeys.includes('generator');
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

                const alerts = envoy.alerts;
                const updateStatus = CONSTANTS.ApiCodes[envoy.update_status] ?? 'Unknown';

                //wireless connection kit
                const wirelessConnections = wirelessConnectionKitSupported ? envoy.wireless_connection : [];
                const wirelessConnectionKitConnectionsCount = wirelessConnections.length;
                const wirelessConnectionKitInstalled = wirelessConnectionKitConnectionsCount > 0;
                if (wirelessConnectionKitInstalled) {
                    this.wirelessConnectionsSignalStrength = [];
                    this.wirelessConnectionsSignalStrengthMax = [];
                    this.wirelessConnectionsType = [];
                    this.wirelessConnectionsConnected = [];

                    for (let i = 0; i < wirelessConnectionKitConnectionsCount; i++) {
                        const wirelessConnection = wirelessConnections[i];
                        const wirelessConnectionSignalStrength = wirelessConnection.signal_strength * 20;
                        const wirelessConnectionSignalStrengthMax = wirelessConnection.signal_strength_max * 20;
                        const wirelessConnectionType = CONSTANTS.ApiCodes[wirelessConnection.type] ?? 'Unknown';
                        const wirelessConnectionConnected = wirelessConnection.connected === true;

                        if (this.wirelessConnektionsKitServices) {
                            this.wirelessConnektionsKitServices[i]
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
                    this.wirelessConnectionKitInstalled = this.wirelessConnectionsConnected.includes(true);
                }

                //convert status
                const status = (Array.isArray(alerts) && alerts.length > 0) ? (alerts.map(a => CONSTANTS.ApiCodes[a.msg_key] || a.msg_key).join(', ')).substring(0, 64) : 'No alerts';

                if (this.envoyService) {
                    this.envoyService
                        .updateCharacteristic(Characteristic.enphaseEnvoyGridProfile, this.arfProfile.name)
                        .updateCharacteristic(Characteristic.enphaseEnvoyAlerts, status)
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
                    if (this.acBatteriesInstalled) {
                        this.envoyService
                            .updateCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel, `${commAcbNum} / ${commAcbLevel} %`)
                    }
                    if (this.enchargesInstalled) {
                        this.envoyService
                            .updateCharacteristic(Characteristic.enphaseEnvoyCommNumEnchgAndLevel, `${commEnchargeNum} / ${commEnchargeLevel} %`)
                    }
                    if (this.enpowersInstalled) {
                        this.envoyService
                            .updateCharacteristic(Characteristic.enphaseEnvoyEnpowerConnected, this.enpowersConnected)
                            .updateCharacteristic(Characteristic.enphaseEnvoyEnpowerGridStatus, this.enpowersGridModeTranslated)
                    }
                }

                this.microinvertersSupported = microinvertersSupported;
                this.acBatteriesSupported = acBatteriesSupported;
                this.qRelaysSupported = qRelaysSupported;
                this.ensemblesSupported = ensemblesSupported;
                this.enchargesSupported = enchargesSupported;
                this.generatorsSupported = generatorsSupported;

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
                this.envoyNetworkInterfacesCount = envoyNetworkInterfacesCount;
                this.envoyTariff = tariff;
                this.envoyCommNum = commNum;
                this.envoyCommLevel = commLevel;
                this.envoyCommPcuNum = commPcuNum;
                this.envoyCommPcuLevel = commPcuLevel;
                this.envoyCommAcbNum = commAcbNum;
                this.envoyCommAcbLevel = commAcbLevel;
                this.envoyCommNsrbNum = commNsrbNum;
                this.envoyCommNsrbLevel = commNsrbLevel;
                this.envoyCommEsubNum = commEnsembleNum;
                this.envoyCommEsubLevel = commEnsembleLevel;
                this.envoyCommEnchgNum = commEnchargeNum;
                this.envoyCommEnchgLevel = commEnchargeLevel;
                this.envoyCommEnchgLevel24g = commEnchargeLevel24g;
                this.envoyCommEnchagLevelSubg = commEnchagLevelSubg;
                this.envoyAlerts = status;
                this.envoyUpdateStatus = updateStatus;
                this.wirelessConnectionKitConnectionsCount = wirelessConnectionKitConnectionsCount;
                this.wirelessConnectionKitSupported = wirelessConnectionKitSupported;

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

                //inventory devices count
                const inventoryDevicesCount = inventory.length;
                if (inventoryDevicesCount === 0) {
                    resolve(false);
                    return;
                }

                //inventory keys
                const inventoryKeys = inventory.map(device => device.type);

                //microinverters inventory
                const microinvertersSupported = inventoryKeys.includes('PCU');
                const microinverters = microinvertersSupported ? inventory[0].devices : [];
                const microinvertersCount = microinverters.length;
                const microinvertersInstalled = microinvertersCount > 0;

                if (microinvertersInstalled) {
                    this.microinvertersSerialNumber = [];
                    this.microinvertersStatus = [];
                    this.microinvertersLastReportDate = [];
                    this.microinvertersFirmware = [];
                    this.microinvertersProducing = [];
                    this.microinvertersCommunicating = [];
                    this.microinvertersProvisioned = [];
                    this.microinvertersOperating = [];

                    const type = CONSTANTS.ApiCodes[inventory[0].type] ?? 'Unknown';
                    for (let i = 0; i < microinvertersCount; i++) {
                        const microinverter = microinverters[i];
                        const partNum = CONSTANTS.PartNumbers[microinverter.part_num] ?? 'Microinverter';
                        const installed = new Date(microinverter.installed * 1000).toLocaleString();
                        const serialNumber = microinverter.serial_num;
                        const deviceStatus = microinverter.device_status;
                        const lastReportDate = new Date(microinverter.last_rpt_date * 1000).toLocaleString();
                        const adminState = microinverter.admin_state;
                        const devType = microinverter.dev_type;
                        const createdDate = new Date(microinverter.created_date * 1000).toLocaleString();
                        const imageLoadDate = new Date(microinverter.img_load_date * 1000).toLocaleString();
                        const firmware = microinverter.img_pnum_running;
                        const ptpn = microinverter.ptpn;
                        const chaneId = microinverter.chaneid;
                        const deviceControl = microinverter.device_control;
                        const producing = microinverter.producing === true;
                        const communicating = microinverter.communicating === true;
                        const provisioned = microinverter.provisioned === true;
                        const operating = microinverter.operating === true;
                        const phase = microinverter.phase ?? 'Unknown';

                        //convert status
                        const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANTS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

                        if (this.microinvertersServices) {
                            this.microinvertersServices[i]
                                .updateCharacteristic(Characteristic.enphaseMicroinverterGridProfile, this.arfProfile.name)
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
                    this.microinvertersCount = microinvertersCount;
                    this.microinvertersInstalled = true;
                }

                //ac btteries inventoty
                const acBatteriesSupported = inventoryKeys.includes('ACB');
                const acBatteries = acBatteriesSupported ? inventory[1].devices : [];
                const acBatteriesCount = acBatteries.length;
                const acBatteriesInstalled = acBatteriesCount > 0;

                if (acBatteriesInstalled) {
                    this.acBatteriesSerialNumber = [];
                    this.acBatteriesStatus = [];
                    this.acBatteriesLastReportDate = [];
                    this.acBatteriesFirmware = [];
                    this.acBatteriesProducing = [];
                    this.acBatteriesCommunicating = [];
                    this.acBatteriesProvisioned = [];
                    this.acBatteriesOperating = [];
                    this.acBatteriesSleepEnabled = [];
                    this.acBatteriesPercentFull = [];
                    this.acBatteriesMaxCellTemp = [];
                    this.acBatteriesSleepMinSoc = [];
                    this.acBatteriesSleepMaxSoc = [];
                    this.acBatteriesChargeStatus = [];

                    const type = CONSTANTS.ApiCodes[inventory[1].type] ?? 'Unknown';
                    for (let i = 0; i < acBatteriesCount; i++) {
                        const acBaterie = acBatteries[i];
                        const partNumber = CONSTANTS.PartNumbers[acBaterie.part_num] ?? acBaterie.part_num;
                        const installed = new Date(acBaterie.installed * 1000).toLocaleString();
                        const serialNumber = acBaterie.serial_num;
                        const deviceStatus = acBaterie.device_status;
                        const lastReportDate = new Date(acBaterie.last_rpt_date * 1000).toLocaleString();
                        const adminState = acBaterie.admin_state;
                        const devType = acBaterie.dev_type;
                        const createdDate = new Date(acBaterie.created_date * 1000).toLocaleString();
                        const imageLoadDate = new Date(acBaterie.img_load_date * 1000).toLocaleString();
                        const firmware = acBaterie.img_pnum_running;
                        const ptpn = acBaterie.ptpn;
                        const chaneId = acBaterie.chaneid;
                        const deviceControl = acBaterie.device_control;
                        const producing = acBaterie.producing === true;
                        const communicating = acBaterie.communicating === true;
                        const provisioned = acBaterie.provisioned === true;
                        const operating = acBaterie.operating === true;
                        const sleepEnabled = acBaterie.sleep_enabled;
                        const percentFull = acBaterie.percentFull;
                        const maxCellTemp = acBaterie.maxCellTemp;
                        const sleepMinSoc = acBaterie.sleep_min_soc;
                        const sleepMaxSoc = acBaterie.sleep_max_soc;
                        const chargeStatus = CONSTANTS.ApiCodes[acBaterie.charge_status] ?? 'Unknown';

                        //convert status
                        const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANTS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

                        if (this.acBatteriesServices) {
                            this.acBatteriesServices[i]
                                .updateCharacteristic(Characteristic.enphaseAcBatterieStatus, status)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieLastReportDate, lastReportDate)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieFirmware, firmware)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieProducing, producing)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieCommunicating, communicating)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieProvisioned, provisioned)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieOperating, operating)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieSleepEnabled, sleepEnabled)
                                .updateCharacteristic(Characteristic.enphaseAcBatteriePercentFull, percentFull)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieMaxCellTemp, maxCellTemp)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieSleepMinSoc, sleepMinSoc)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieSleepMaxSoc, sleepMaxSoc)
                                .updateCharacteristic(Characteristic.enphaseAcBatterieChargeStatus, chargeStatus);
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
                    this.acBatteriesCount = acBatteriesCount;
                    this.acBatteriesInstalled = true;
                }

                //qrelays inventory
                const qRelaysSupported = inventoryKeys.includes('NSRB');
                const qRelays = qRelaysSupported ? inventory[2].devices : [];
                const qRelaysCount = qRelays.length;
                const qRelaysInstalled = qRelaysCount > 0;

                if (qRelaysInstalled) {
                    this.qRelaysSerialNumber = [];
                    this.qRelaysStatus = [];
                    this.qRelaysLastReportDate = [];
                    this.qRelaysFirmware = [];
                    this.qRelaysProducing = [];
                    this.qRelaysCommunicating = [];
                    this.qRelaysProvisioned = [];
                    this.qRelaysOperating = [];
                    this.qRelaysRelay = [];
                    this.qRelaysLinesCount = [];
                    this.qRelaysLine1Connected = [];
                    this.qRelaysLine2Connected = [];
                    this.qRelaysLine3Connected = [];

                    const type = CONSTANTS.ApiCodes[inventory[2].type] ?? 'Unknown';
                    for (let i = 0; i < qRelaysCount; i++) {
                        const qRelay = qRelays[i];
                        const partNumber = CONSTANTS.PartNumbers[qRelay.part_num] ?? qRelay.part_num;
                        const installed = new Date(qRelay.installed * 1000).toLocaleString();
                        const serialNumber = qRelay.serial_num;
                        const deviceStatus = qRelay.device_status;
                        const lastReportDate = new Date(qRelay.last_rpt_date * 1000).toLocaleString();
                        const adminState = qRelay.admin_state;
                        const devType = qRelay.dev_type;
                        const createdDate = new Date(qRelay.created_date * 1000).toLocaleString();
                        const imageLoadDate = new Date(qRelay.img_load_date * 1000).toLocaleString();
                        const firmware = qRelay.img_pnum_running;
                        const ptpn = qRelay.ptpn;
                        const chaneId = qRelay.chaneid;
                        const deviceControl = qRelay.device_control;
                        const producing = qRelay.producing === true;
                        const communicating = qRelay.communicating === true;
                        const provisioned = qRelay.provisioned === true;
                        const operating = qRelay.operating === true;
                        const relay = CONSTANTS.ApiCodes[qRelay.relay] ?? 'Unknown';
                        const reasonCode = qRelay.reason_code;
                        const reason = qRelay.reason;
                        const linesCount = qRelay['line-count'];
                        const line1Connected = linesCount >= 1 ? qRelay['line1-connected'] === true : false;
                        const line2Connected = linesCount >= 2 ? qRelay['line2-connected'] === true : false;
                        const line3Connected = linesCount >= 3 ? qRelay['line3-connected'] === true : false;

                        //convert status
                        const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANTS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

                        if (this.qRelaysServices) {
                            this.qRelaysServices[i]
                                .updateCharacteristic(Characteristic.enphaseQrelayGridProfile, this.arfProfile.name)
                                .updateCharacteristic(Characteristic.enphaseQrelayStatus, status)
                                .updateCharacteristic(Characteristic.enphaseQrelayLastReportDate, lastReportDate)
                                .updateCharacteristic(Characteristic.enphaseQrelayFirmware, firmware)
                                //.updateCharacteristic(Characteristic.enphaseQrelayProducing, producing)
                                .updateCharacteristic(Characteristic.enphaseQrelayCommunicating, communicating)
                                .updateCharacteristic(Characteristic.enphaseQrelayProvisioned, provisioned)
                                .updateCharacteristic(Characteristic.enphaseQrelayOperating, operating)
                                .updateCharacteristic(Characteristic.enphaseQrelayState, relay)
                                .updateCharacteristic(Characteristic.enphaseQrelayLinesCount, linesCount)
                            if (linesCount >= 1) {
                                this.qRelaysServices[i]
                                    .updateCharacteristic(Characteristic.enphaseQrelayLine1Connected, line1Connected);
                            }
                            if (linesCount >= 2) {
                                this.qRelaysServices[i]
                                    .updateCharacteristic(Characteristic.enphaseQrelayLine2Connected, line2Connected);
                            }
                            if (linesCount >= 3) {
                                this.qRelaysServices[i]
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
                    this.qRelaysCount = qRelaysCount;
                    this.qRelaysInstalled = true;
                }

                //ensembles
                const ensemblesSupported = inventoryKeys.includes('ESUB');
                const ensembles = ensemblesSupported ? inventory[3].devices : [];
                const ensemblesCount = ensembles.length;
                const ensemblesInstalled = ensemblesCount > 0;

                if (ensemblesInstalled) {
                    this.ensemblesSerialNumber = [];
                    this.ensemblesStatus = [];
                    this.ensemblesLastReportDate = [];
                    this.ensemblesFirmware = [];
                    this.ensemblesProducing = [];
                    this.ensemblesCommunicating = [];
                    this.ensemblesOperating = [];

                    const type = CONSTANTS.ApiCodes[inventory[3].type] ?? 'Unknown';
                    for (let i = 0; i < ensemblesCount; i++) {
                        const ensemble = ensembles[i];
                        const partNumber = CONSTANTS.PartNumbers[ensemble.part_num] ?? ensemble.part_num;
                        const installed = new Date(ensemble.installed * 1000).toLocaleString();
                        const serialNumber = ensemble.serial_num;
                        const deviceStatus = ensemble.device_status;
                        const lastReportDate = new Date(ensemble.last_rpt_date * 1000).toLocaleString();
                        const adminState = ensemble.admin_state;
                        const devType = ensemble.dev_type;
                        const createdDate = new Date(ensemble.created_date * 1000).toLocaleString();
                        const imageLoadDate = new Date(ensemble.img_load_date * 1000).toLocaleString();
                        const firmware = ensemble.img_pnum_running;
                        const ptpn = ensemble.ptpn;
                        const chaneId = ensemble.chaneid;
                        const deviceControl = ensemble.device_control;
                        const producing = ensemble.producing === true;
                        const communicating = ensemble.communicating === true;
                        const operating = ensemble.operating === true;

                        //convert status
                        const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANTS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

                        if (this.ensemblesServices) {
                            this.ensemblesServices[i]
                                .updateCharacteristic(Characteristic.enphaseEnsembleStatus, status)
                                .updateCharacteristic(Characteristic.enphaseEnsembleLastReportDate, lastReportDate)
                                .updateCharacteristic(Characteristic.enphaseEnsembleFirmware, firmware)
                                .updateCharacteristic(Characteristic.enphaseEnsembleProducing, producing)
                                .updateCharacteristic(Characteristic.enphaseEnsembleCommunicating, communicating)
                                .updateCharacteristic(Characteristic.enphaseEnsembleOperating, operating)
                        }

                        this.ensemblesSerialNumber.push(serialNumber);
                        this.ensemblesStatus.push(status);
                        this.ensemblesLastReportDate.push(lastReportDate);
                        this.ensemblesFirmware.push(firmware);
                        this.ensemblesProducing.push(producing);
                        this.ensemblesCommunicating.push(communicating);
                        this.ensemblesOperating.push(operating);
                    }
                    this.ensemblesType = type;
                    this.ensemblesCount = ensemblesCount;
                    this.ensemblesSupported = ensemblesSupported;
                    this.ensemblesInstalled = ensemblesInstalled;
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
                const metersCount = meters.length;
                if (metersCount === 0) {
                    resolve(false);
                    return;
                }

                //meters
                this.metersEid = [];
                this.metersState = [];
                this.metersMeasurementType = [];
                this.metersPhaseMode = [];
                this.metersPhaseCount = [];
                this.metersMeteringStatus = [];
                this.metersStatusFlags = [];

                for (let i = 0; i < metersCount; i++) {
                    const meter = meters[i];
                    const eid = meter.eid;
                    const state = meter.state === 'enabled' ?? false;
                    const measurementType = CONSTANTS.ApiCodes[meter.measurementType] ?? 'Unknown';
                    const phaseMode = CONSTANTS.ApiCodes[meter.phaseMode] ?? 'Unknown';
                    const phaseCount = meter.phaseCount ?? 0;
                    const meteringStatus = CONSTANTS.ApiCodes[meter.meteringStatus] ?? 'Unknown';
                    const statusFlags = meter.statusFlags;

                    // convert status
                    const status = (Array.isArray(statusFlags) && statusFlags.length > 0) ? (statusFlags.map(a => CONSTANTS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

                    if (this.metersServices) {
                        this.metersServices[i]
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

                //production
                this.metersProductionSupported = this.metersMeasurementType.includes('Production');
                const indexProduction = this.metersMeasurementType.indexOf('Production');
                this.metersProductionEnabled = this.metersState[indexProduction] ?? false;
                this.metersProductionVoltageDivide = this.metersPhaseMode[indexProduction] === 'Split' ? 1 : this.metersPhaseCount[indexProduction];

                //consumption
                this.metersConsumptionSupported = this.metersMeasurementType.includes('Consumption Net');
                const indexConsumption = this.metersMeasurementType.indexOf('Consumption Net');
                this.metersConsumptionEnabled = this.metersState[indexConsumption] ?? false;
                this.metersConsumpionVoltageDivide = this.metersPhaseMode[indexConsumption] === 'Split' ? 1 : this.metersPhaseCount[indexConsumption];

                //storage
                this.metersStorageSupported = this.metersMeasurementType.includes('Storage');
                const indexStorage = this.metersMeasurementType.indexOf('Storage');
                this.metersStorageEnabled = this.metersState[indexStorage] ?? false;
                this.metersStorageVoltageDivide = this.metersPhaseMode[indexStorage] === 'Split' ? 1 : this.metersPhaseCount[indexStorage];


                this.metersCount = metersCount;
                const metersEnabled = this.metersState.includes(true);

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('meters', meters) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.emit('publish', 'Meters', meters) : false;
                resolve(metersEnabled);
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
                const metersReadingCount = metersReading.length;
                if (metersReadingCount === 0) {
                    resolve(false);
                    return;
                }

                //meters
                this.eidSumm = [];
                this.timestampSumm = [];
                this.actEnergyDlvdSumm = [];
                this.actEnergyRcvdSumm = [];
                this.apparentEnergySumm = [];
                this.reactEnergyLaggSumm = [];
                this.reactEnergyLeadSumm = [];
                this.instantaneousDemandSumm = [];
                this.activePowerSumm = [];
                this.apparentPowerSumm = [];
                this.reactivePowerSumm = [];
                this.pwrFactorSumm = [];
                this.voltageSumm = [];
                this.currentSumm = [];
                this.freqSumm = [];

                //meters reading summary data
                for (let i = 0; i < metersReadingCount; i++) {
                    const metersVoltageDivide = (this.metersPhaseMode[i] === 'Split') ? 1 : this.metersPhaseCount[i];
                    const meter = metersReading[i];
                    const eid = meter.eid;
                    const timestamp = new Date(meter.timestamp * 1000).toLocaleString();
                    const actEnergyDlvd = parseFloat(meter.actEnergyDlvd);
                    const actEnergyRcvd = parseFloat(meter.actEnergyRcvd);
                    const apparentEnergy = parseFloat(meter.apparentEnergy);
                    const reactEnergyLagg = parseFloat(meter.reactEnergyLagg);
                    const reactEnergyLead = parseFloat(meter.reactEnergyLead);
                    const instantaneousDemand = parseFloat(meter.instantaneousDemand);
                    const activePower = parseFloat(meter.activePower) / 1000;
                    const apparentPower = parseFloat(meter.apparentPower) / 1000;
                    const reactivePower = parseFloat(meter.reactivePower) / 1000;
                    const pwrFactor = parseFloat(meter.pwrFactor);
                    const voltage = parseFloat(meter.voltage / metersVoltageDivide);
                    const current = parseFloat(meter.current);
                    const freq = parseFloat(meter.freq);

                    const meterState = this.metersState[i];
                    if (this.metersServices && meterState) {
                        this.metersServices[i]
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
                    const metersReadingPhaseCount = meter.channels.length;
                    if (metersReadingPhaseCount > 0) {
                        this.eidPhase = [];
                        this.timestampPhase = [];
                        this.actEnergyDlvdPhase = [];
                        this.actEnergyRcvdPhase = [];
                        this.apparentEnergyPhase = [];
                        this.reactEnergyLaggPhase = [];
                        this.reactEnergyLeadPhase = [];
                        this.instantaneousDemandPhase = [];
                        this.activePowerPhase = [];
                        this.apparentPowerPhase = [];
                        this.reactivePowerPhase = [];
                        this.pwrFactorPhase = [];
                        this.voltagePhase = [];
                        this.currentPhase = [];
                        this.freqPhase = [];

                        for (let j = 0; j < metersReadingPhaseCount; j++) {
                            const meterChannel = meter.channels[j]
                            const eid = meterChannel.eid;
                            const timestamp = new Date(meterChannel.timestamp * 1000).toLocaleString();
                            const actEnergyDlvd = parseFloat(meterChannel.actEnergyDlvd);
                            const actEnergyRcvd = parseFloat(meterChannel.actEnergyRcvd);
                            const apparentEnergy = parseFloat(meterChannel.apparentEnergy);
                            const reactEnergyLagg = parseFloat(meterChannel.reactEnergyLagg);
                            const reactEnergyLead = parseFloat(meterChannel.reactEnergyLead);
                            const instantaneousDemand = parseFloat(meterChannel.instantaneousDemand);
                            const activePower = parseFloat(meterChannel.activePower) / 1000;
                            const apparentPower = parseFloat(meterChannel.apparentPower) / 1000;
                            const reactivePower = parseFloat(meterChannel.reactivePower) / 1000;
                            const pwrFactor = parseFloat(meterChannel.pwrFactor);
                            const voltage = parseFloat(meterChannel.voltage);
                            const current = parseFloat(meterChannel.current);
                            const freq = parseFloat(meterChannel.freq);

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
                this.metersReadingCount = metersReadingCount;
                this.metersReadingInstalled = metersReadingCount > 0;

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

    updateEnsembleInventoryData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting ensemble inventory.`) : false;

            try {
                const ensembleInventoryData = await this.axiosInstance(CONSTANTS.ApiUrls.EnsembleInventory);
                const ensembleInventory = ensembleInventoryData.data ?? [];
                const debug = this.enableDebugMode ? this.emit('debug', `Ensemble inventory: ${JSON.stringify(ensembleInventory, null, 2)}`) : false;

                //ensemble inventory devices count
                const ensembleInventoryDevicesCount = ensembleInventory.length;
                if (ensembleInventoryDevicesCount === 0) {
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

                if (enchargesInstalled) {
                    this.enchargesSerialNumber = [];
                    this.enchargesStatus = [];
                    this.enchargesLastReportDate = [];
                    this.enchargesAdminStateStr = [];
                    this.enchargesOperating = [];
                    this.enchargesCommunicating = [];
                    this.enchargesSleepEnabled = [];
                    this.enchargesPercentFull = [];
                    this.enchargesTemperature = [];
                    this.enchargesMaxCellTemp = [];
                    this.enchargesCommLevelSubGhz = [];
                    this.enchargesCommLevel24Ghz = [];
                    this.enchargesLedStatus = [];
                    this.enchargesRealPowerW = [];
                    this.enchargesDcSwitchOff = [];
                    this.enchargesRev = [];
                    this.enchargesCapacity = [];

                    const type = CONSTANTS.ApiCodes[ensembleInventory[0].type];
                    for (let i = 0; i < enchargesCount; i++) {
                        const encharge = encharges[i];
                        const partNumber = CONSTANTS.PartNumbers[encharge.part_num] ?? encharge.part_num;
                        const serialNumber = encharge.serial_num;
                        const installed = new Date(encharge.installed * 1000).toLocaleString();
                        const deviceStatus = encharge.device_status;
                        const lastReportDate = new Date(encharge.last_rpt_date * 1000).toLocaleString();
                        const adminState = encharge.admin_state;
                        const adminStateStr = CONSTANTS.ApiCodes[encharge.admin_state_str] ?? 'Unknown';
                        const createdDate = new Date(encharge.created_date * 1000).toLocaleString();
                        const imgLoadDate = new Date(encharge.img_load_date * 1000).toLocaleString();
                        const imgPnumRunning = encharge.img_pnum_running;
                        const zigbeeDongleFwVersion = encharge.zigbee_dongle_fw_version ?? 'Unknown'
                        const bmuFwVersion = encharge.bmu_fw_version;
                        const operating = encharge.operating === true;
                        const communicating = encharge.communicating === true;
                        const sleepEnabled = encharge.sleep_enabled;
                        const percentFull = encharge.percentFull;
                        const temperature = encharge.temperature ?? 0;
                        const maxCellTemp = encharge.maxCellTemp ?? 0;
                        const reportedEncGridState = CONSTANTS.ApiCodes[encharge.reported_enc_grid_state] ?? 'Unknown';
                        const commLevelSubGhz = encharge.comm_level_sub_ghz * 20;
                        const commLevel24Ghz = encharge.comm_level_2_4_ghz * 20;
                        const ledStatus = CONSTANTS.LedStatus[encharge.led_status] ?? 'Unknown';
                        const dcSwitchOff = encharge.dc_switch_off;
                        const enchargeRev = encharge.encharge_rev;
                        const enchargeCapacity = parseFloat(encharge.encharge_capacity) / 1000; //in kWh
                        const phase = encharge.phase ?? 'Unknown';
                        const derIndex = encharge.der_index ?? 0;

                        //convert status
                        const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANTS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

                        if (this.enchargesServices) {
                            this.enchargesServices[i]
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
                                .updateCharacteristic(Characteristic.enphaseEnchargeDcSwitchOff, dcSwitchOff)
                                .updateCharacteristic(Characteristic.enphaseEnchargeRev, enchargeRev)
                                .updateCharacteristic(Characteristic.enphaseEnchargeCapacity, enchargeCapacity)
                                .updateCharacteristic(Characteristic.enphaseEnchargeGridProfile, this.arfProfile.name)
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
                        this.enchargesDcSwitchOff.push(dcSwitchOff);
                        this.enchargesRev.push(enchargeRev);
                        this.enchargesCapacity.push(enchargeCapacity);
                    }

                    this.enchargesType = type;
                    this.enchargesCount = enchargesCount;
                    this.enchargesInstalled = enchargesInstalled;

                    //encharges summary
                    let enchargesPercentFull = 0;
                    for (let enchargePercentFull of this.enchargesPercentFull) {
                        enchargesPercentFull += enchargePercentFull;
                    }

                    const enchargesSummaryPercentFull = enchargesPercentFull / enchargesCount;
                    const enchargesSummaryEnergyState = enchargesSummaryPercentFull > 0;

                    if (this.enphaseEnchargesSummaryLevelAndStateService) {
                        this.enphaseEnchargesSummaryLevelAndStateService
                            .updateCharacteristic(Characteristic.On, enchargesSummaryEnergyState)
                            .updateCharacteristic(Characteristic.Brightness, enchargesSummaryPercentFull)
                    }
                    this.enchargesSummaryEnergyState = enchargesSummaryEnergyState;
                    this.enchargesSummaryPercentFull = enchargesSummaryPercentFull;
                }

                //enpowers
                const enpowersSupported = ensembleInventoryKeys.includes('ENPOWER');
                const enpowers = enpowersSupported ? ensembleInventory[1].devices : [];
                const enpowersCount = enpowers.length;
                const enpowersInstalled = enpowersCount > 0;

                if (enpowersInstalled) {
                    this.enpowersSerialNumber = [];
                    this.enpowersStatus = [];
                    this.enpowersLastReportDate = [];
                    this.enpowersAdminStateStr = [];
                    this.enpowersOperating = [];
                    this.enpowersCommunicating = [];
                    this.enpowersTemperature = [];
                    this.enpowersCommLevelSubGhz = [];
                    this.enpowersCommLevel24Ghz = [];
                    this.enpowersMainsAdminState = [];
                    this.enpowersMainsOperState = [];
                    this.enpowersEnpwGridMode = [];
                    this.enpowersEnpwGridModeTranslated = [];
                    this.enpowersEnchgGridMode = [];
                    this.enpowersEnchgGridModeTranslated = [];
                    this.enpowersRelayStateBm = [];
                    this.enpowersCurrStateId = [];

                    const type = CONSTANTS.ApiCodes[ensembleInventory[1].type];
                    for (let i = 0; i < enpowersCount; i++) {
                        const enpower = enpowers[i];
                        const partNumber = CONSTANTS.PartNumbers[enpower.part_num] ?? enpower.part_num;
                        const serialNumber = enpower.serial_num;
                        const installed = new Date(enpower.installed * 1000).toLocaleString();
                        const deviceStatus = enpower.device_status;
                        const lastReportDate = new Date(enpower.last_rpt_date * 1000).toLocaleString();
                        const adminState = enpower.admin_state;
                        const adminStateStr = CONSTANTS.ApiCodes[enpower.admin_state_str] ?? 'Unknown';
                        const createdDate = new Date(enpower.created_date * 1000).toLocaleString();
                        const imgLoadDate = new Date(enpower.img_load_date * 1000).toLocaleString();
                        const imgPnumRunning = enpower.img_pnum_running;
                        const zigbeeDongleFwVersion = enpower.zigbee_dongle_fw_version ?? 'Unknown';
                        const operating = enpower.operating === true ?? false;
                        const communicating = enpower.communicating === true;
                        const temperature = enpower.temperature;
                        const commLevelSubGhz = enpower.comm_level_sub_ghz * 20;
                        const commLevel24Ghz = enpower.comm_level_2_4_ghz * 20;
                        const mainsAdminState = CONSTANTS.ApiCodes[enpower.mains_admin_state] ?? 'Unknown';
                        const mainsOperState = CONSTANTS.ApiCodes[enpower.mains_oper_state] ?? 'Unknown';
                        const enpwrGridMode = enpower.Enpwr_grid_mode ?? 'Unknown';
                        const enpwrGridModeTranslated = CONSTANTS.ApiCodes[enpwrGridMode] ?? enpower.Enpwr_grid_mode;
                        const enchgGridMode = enpower.Enchg_grid_mode ?? 'Unknown';
                        const enchgGridModeTranslated = CONSTANTS.ApiCodes[enchgGridMode] ?? enpower.Enchg_grid_mode;
                        const enpwrRelayStateBm = enpower.Enpwr_relay_state_bm;
                        const enpwrCurrStateId = enpower.Enpwr_curr_state_id;

                        //convert status
                        const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANTS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

                        if (this.enpowersServices) {
                            this.enpowersServices[i]
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
                                .updateCharacteristic(Characteristic.enphaseEnpowerEnpwrGridMode, enpwrGridModeTranslated)
                                .updateCharacteristic(Characteristic.enphaseEnpowerEnchgGridMode, enchgGridModeTranslated)
                                .updateCharacteristic(Characteristic.enphaseEnpowerGridProfile, this.arfProfile.name)
                        }

                        this.enpowersSerialNumber.push(serialNumber);
                        this.enpowersStatus.push(status);
                        this.enpowersLastReportDate.push(lastReportDate);
                        this.enpowersAdminStateStr.push(adminStateStr);
                        this.enpowersOperating.push(operating);
                        this.enpowersCommunicating.push(communicating);
                        this.enpowersTemperature.push(temperature);
                        this.enpowersCommLevelSubGhz.push(commLevelSubGhz);
                        this.enpowersCommLevel24Ghz.push(commLevel24Ghz);
                        this.enpowersMainsAdminState.push(mainsAdminState);
                        this.enpowersMainsOperState.push(mainsOperState);
                        this.enpowersEnpwGridMode.push(enpwrGridMode);
                        this.enpowersEnpwGridModeTranslated.push(enpwrGridModeTranslated);
                        this.enpowersEnchgGridMode.push(enchgGridMode);
                        this.enpowersEnchgGridModeTranslated.push(enchgGridModeTranslated);
                        this.enpowersRelayStateBm.push(enpwrRelayStateBm);
                        this.enpowersCurrStateId.push(enpwrCurrStateId);
                    }
                    this.enpowersSupported = enpowersSupported;
                    this.enpowersInstalled = enpowersInstalled;
                    this.enpowersConnected = this.enpowersMainsAdminState.includes('Closed');
                    this.enpowersType = type;
                    this.enpowersCount = enpowersCount;

                    //enpower grid state sensors
                    this.enpowersGridMode = this.enpowersEnpwGridMode[0];
                    this.enpowersGridModeTranslated = this.enpowersEnpwGridModeTranslated[0];
                    if (this.enpowerGridModeActiveSensorsCount > 0) {
                        for (let i = 0; i < this.enpowerGridModeActiveSensorsCount; i++) {
                            const gridMode = this.enpowerGridModeActiveSensors[i].gridMode;
                            const state = gridMode === this.enpowersGridMode;
                            this.enpowerGridModeActiveSensors[i].state = state;

                            if (this.enpowerGridModeSensorsServices) {
                                const characteristicType = this.enpowerGridModeActiveSensors[i].characteristicType;
                                this.enpowerGridModeSensorsServices[i]
                                    .updateCharacteristic(characteristicType, state)
                            }
                        }
                    }
                }

                //generators
                const generatorsSupported = ensembleInventoryKeys.includes('GENERATOR');
                const generators = generatorsSupported >= 3 ? ensembleInventory[2].devices : [];
                const generatorsCount = generators.length;
                const generatorsInstalled = generatorsCount > 0;

                if (generatorsInstalled) {
                    const type = CONSTANTS.ApiCodes[ensembleInventory[2].type];

                    this.generatorsType = type;
                    this.generatorsCount = generatorsCount;
                    this.generatorsInstalled = true;
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
                const ensembleStatusKeysCount = ensembleStatusKeys.length;

                //ensemble status not exist
                if (ensembleStatusKeysCount === 0) {
                    resolve(false);
                    return;
                }

                //inventoty
                const inventorySupported = ensembleStatusKeys.includes('inventory');
                const inventory = inventorySupported ? ensembleStatus.inventory : {};

                //encharges
                const enchargesSerialNumbersKeys = Object.keys(inventory.serial_nums);
                const enchargesSerialNumbersCount = enchargesSerialNumbersKeys.length;

                const enchargesRatedPowerSummary = [];
                for (let i = 0; i < enchargesSerialNumbersCount; i++) {
                    const enchargeKey = enchargesSerialNumbersKeys[i];
                    const encharge = inventory.serial_nums[enchargeKey];
                    const deviceType = encharge.device_type;
                    const comInterfacStr = encharge.com_interface_str ?? 'Unknown';
                    const deviceId = encharge.device_id ?? 'Unknown';
                    const adminState = encharge.admin_state;
                    const adminStateStr = CONSTANTS.ApiCodes[encharge.admin_state_str] ?? 'Unknown';
                    const reportedGridMode = CONSTANTS.ApiCodes[encharge.reported_grid_mode] ?? 'Unknown';
                    const phase = encharge.phase ?? 'Unknown';
                    const derIndex = encharge.der_index ?? 0;
                    const revision = encharge.encharge_revision ?? 0;
                    const capacity = encharge.encharge_capacity ?? 0;
                    const ratedPower = encharge.encharge_rated_power ?? 0;
                    const reportedGridState = CONSTANTS.ApiCodes[encharge.reported_grid_state] ?? 'Unknown';
                    const msgRetryCount = encharge.msg_retry_count ?? 0;
                    const partNumber = encharge.part_number;
                    const assemblyNumber = encharge.assembly_number;
                    const appFwVersion = encharge.app_fw_version;
                    const zbFwVersion = encharge.zb_fw_version ?? 'Unknown';
                    const zbBootloaderVers = encharge.zb_bootloader_vers ?? 'Unknown';
                    const iblFwVersion = encharge.ibl_fw_version;
                    const swiftAsicFwVersion = encharge.swift_asic_fw_version;
                    const bmuFwVersion = encharge.bmu_fw_version;
                    const submodulesCount = encharge.submodule_count;

                    //pusch encharge rated power to array
                    enchargesRatedPowerSummary.push(ratedPower);

                    //encharge submodules
                    if (submodulesCount > 0) {
                        const enchargesSubmodulesSerialNumbers = encharge.submodules ?? {};
                        const enchargesSubmodulesSerialNumbersKeys = Object.keys(enchargesSubmodulesSerialNumbers);
                        for (let j = 0; j < submodulesCount; j++) {
                            const submoduleKey = enchargesSubmodulesSerialNumbersKeys[j];
                            const submodule = encharge.submodules[submoduleKey];
                            const deviceType = submodule.device_type;
                            const adminState = submodule.admin_state;
                            const partNumber = submodule.part_number;
                            const assemblyNumber = submodule.assembly_number;

                            //dmir
                            const dmirPartNumber = submodule.dmir.part_number;
                            const dmirAssemblyNumber = submodule.dmir.assembly_number;

                            //procload
                            const procloadPartNumber = submodule.procload.part_number;
                            const procloadAssemblyNumber = submodule.procload.assembly_number;
                        }
                    }
                }

                //sum rated power for all encharges
                const enchargesRatedPowerSum = parseFloat(enchargesRatedPowerSummary.reduce((total, num) => total + num, 0)) / 1000 || 0; //in kW
                this.enchargesRatedPowerSum = enchargesRatedPowerSum;

                //counters
                const countersSupported = ensembleStatusKeys.includes('counters');
                const counter = countersSupported ? ensembleStatus.counters : {};
                const apiEcagtInit = counter.api_ecagtInit ?? 0;
                const apiEcagtTick = counter.api_ecagtTick ?? 0;
                const apiEcagtDeviceInsert = counter.api_ecagtDeviceInsert ?? 0;
                const apiEcagtDeviceNetworkStatus = counter.api_ecagtDeviceNetworkStatus ?? 0;
                const apiEcagtDeviceCommissionStatus = counter.api_ecagtDeviceCommissionStatus ?? 0;
                const apiEcagtDeviceRemoved = counter.api_ecagtDeviceRemoved ?? 0;
                const apiEcagtGetDeviceCount = counter.api_ecagtGetDeviceCount ?? 0;
                const apiEcagtGetDeviceInfo = counter.api_ecagtGetDeviceInfo ?? 0;
                const apiEcagtGetOneDeviceInfo = counter.api_ecagtGetOneDeviceInfo ?? 0;
                const apiEcagtDevIdToSerial = counter.api_ecagtDevIdToSerial ?? 0;
                const apiEcagtHandleMsg = counter.api_ecagtHandleMsg ?? 0;
                const apiEcagtGetSubmoduleInv = counter.api_ecagtGetSubmoduleInv ?? 0;
                const apiEcagtGetDataModelRaw = counter.api_ecagtGetDataModelRaw ?? 0;
                const apiEcagtSetSecCtrlBias = counter.api_ecagtSetSecCtrlBias ?? 0;
                const apiEcagtGetSecCtrlBias = counter.api_ecagtGetSecCtrlBias ?? 0;
                const apiEcagtGetSecCtrlBiasQ = counter.api_ecagtGetSecCtrlBiasQ ?? 0;
                const apiEcagtSetRelayAdmin = counter.api_ecagtSetRelayAdmin ?? 0;
                const apiEcagtGetRelayState = counter.api_ecagtGetRelayState ?? 0;
                const apiEcagtSetDataModelCache = counter.api_ecagtSetDataModelCache ?? 0;
                const apiAggNameplate = counter.api_AggNameplate ?? 0;
                const apiChgEstimated = counter.api_ChgEstimated ?? 0;
                const apiEcagtGetGridFreq = counter.api_ecagtGetGridFreq ?? 0;
                const apiEcagtGetGridVolt = counter.api_ecagtGetGridVolt ?? 0;
                const apiEcagtGetGridFreqErrNotfound = counter.api_ecagtGetGridFreq_err_notfound ?? 0;
                const apiEcagtGetGridFreqErrOor = counter.api_ecagtGetGridFreq_err_oor ?? 0;
                const restStatusGet = counter.rest_StatusGet ?? 0;
                const restInventoryGet = counter.rest_InventoryGet ?? 0;
                const restSubmodGet = counter.rest_SubmodGet ?? 0;
                const restSecCtrlGet = counter.rest_SecCtrlGet ?? 0;
                const restRelayGet = counter.rest_RelayGet ?? 0;
                const restRelayPost = counter.rest_RelayPost ?? 0;
                const restCommCheckGet = counter.rest_CommCheckGet ?? 0;
                const restPow = counter.rest_Power ?? 0;
                const restPower = parseFloat(restPow) / 1000 ?? 0; //in kW
                const extZbRemove = counter.ext_zb_remove ?? 0;
                const extZbRemoveErr = counter.ext_zb_remove_err ?? 0;
                const extZbSendMsg = counter.ext_zb_send_msg ?? 0;
                const extCfgSaveDevice = counter.ext_cfg_save_device ?? 0;
                const extCfgSaveDeviceErr = counter.ext_cfg_save_device_err ?? 0;
                const extSendPerfData = counter.ext_send_perf_data ?? 0;
                const extEventSetStateful = counter.ext_event_set_stateful ?? 0;
                const extEventSetModgone = counter.ext_event_set_modgone ?? 0;
                const rxmsgObjMdlMetaRsp = counter.rxmsg_OBJ_MDL_META_RSP ?? 0;
                const rxmsgObjMdlInvUpdRsp = counter.rxmsg_OBJ_MDL_INV_UPD_RSP ?? 0;
                const rxmsgObjMdlPollRsp = counter.rxmsg_OBJ_MDL_POLL_RSP ?? 0;
                const rxmsgObjMdlRelayCtrlRsp = counter.rxmsg_OBJ_MDL_RELAY_CTRL_RSP ?? 0;
                const rxmsgObjMdlRelayStatusReq = counter.rxmsg_OBJ_MDL_RELAY_STATUS_REQ ?? 0;
                const rxmsgObjMdlGridStatusRsp = counter.rxmsg_OBJ_MDL_GRID_STATUS_RSP ?? 0;
                const rxmsgObjMdlEventMsg = counter.rxmsg_OBJ_MDL_EVENT_MSG ?? 0;
                const rxmsgObjMdlSosConfigRsp = counter.rxmsg_OBJ_MDL_SOC_CONFIG_RSP ?? 0;
                const txmsgObjMdlMetaReq = counter.txmsg_OBJ_MDL_META_REQ ?? 0;
                const txmsgObjMdlEncRtPollReq = counter.txmsg_OBJ_MDL_ENC_RT_POLL_REQ ?? 0;
                const txmsgObjMdlEnpRtPollReq = counter.txmsg_OBJ_MDL_ENP_RT_POLL_REQ ?? 0;
                const txmsgObjMdlBmuPollReq = counter.txmsg_OBJ_MDL_BMU_POLL_REQ ?? 0;
                const txmsgObjMdlPcuPollReq = counter.txmsg_OBJ_MDL_PCU_POLL_REQ ?? 0;
                const txmsgObjMdlSecondaryCtrlReq = counter.txmsg_OBJ_MDL_SECONDARY_CTRL_REQ ?? 0;
                const txmsgObjMdlRelayCtrlReq = counter.txmsg_OBJ_MDL_RELAY_CTRL_REQ ?? 0;
                const txmsgObjMdlGridStatusReq = counter.txmsg_OBJ_MDL_GRID_STATUS_REQ ?? 0;
                const txmsgObjMdlEventsAck = counter.txmsg_OBJ_MDL_EVENTS_ACK ?? 0;
                const txmsgObjMdlRelayStatusRsp = counter.txmsg_OBJ_MDL_RELAY_STATUS_RSP ?? 0;
                const txmsgObjMdlcosConfigReq = counter.txmsg_OBJ_MDL_SOC_CONFIG_REQ ?? 0;
                const txmsgObjMdlTnsStart = counter.txmsg_OBJ_MDL_TNS_START ?? 0;
                const rxmsgObjMdlTnsStartRsp = counter.rxmsg_OBJ_MDL_TNS_START_RSP ?? 0;
                const txmsgObjMdlSetUdmir = counter.txmsg_OBJ_MDL_SET_UDMIR ?? 0;
                const rxmsgObjMdlSetUdmirRsp = counter.rxmsg_OBJ_MDL_SET_UDMIR_RSP ?? 0;
                const txmsgObjMdlTnsEdn = counter.txmsg_OBJ_MDL_TNS_END ?? 0;
                const rxmsgObjMdlTnsEndRsp = counter.rxmsg_OBJ_MDL_TNS_END_RSP ?? 0;
                const txmsgLvsPoll = counter.txmsg_lvs_poll ?? 0;
                const zmqEcaHello = counter.zmq_ecaHello ?? 0;
                const zmqEcaDevInfo = counter.zmq_ecaDevInfo ?? 0;
                const zmqEcaNetworkStatus = counter.zmq_ecaNetworkStatus ?? 0;
                const zmqEcaAppMsg = counter.zmq_ecaAppMsg ?? 0;
                const zmqStreamdata = counter.zmq_streamdata ?? 0;
                const zmqLiveDebug = counter.zmq_live_debug ?? 0;
                const zmqEcaLiveDebugReq = counter.zmq_eca_live_debug_req ?? 0;
                const zmqNameplate = counter.zmq_nameplate ?? 0;
                const zmqEcaSecCtrlMsg = counter.zmq_ecaSecCtrlMsg ?? 0;
                const zmqMeterlogOk = counter.zmq_meterlog_ok ?? 0;
                const dmdlFilesIndexed = counter.dmdl_FILES_INDEXED ?? 0;
                const pfStart = counter.pf_start ?? 0;
                const pfActivate = counter.pf_activate ?? 0;
                const devPollMissing = counter.devPollMissing ?? 0;
                const devMsgRspMissing = counter.devMsgRspMissing ?? 0;
                const gridProfileTransaction = counter.gridProfileTransaction ?? 0;
                const secctrlNotReady = counter.secctrlNotReady ?? 0;
                const fsmRetryTimeout = counter.fsm_retry_timeout ?? 0;
                const profileTxnAck = counter.profile_txn_ack ?? 0;
                const backupSocLimitSet = counter.backupSocLimitSet ?? 0;
                const backupSocLimitChanged = counter.backupSocLimitChanged ?? 0;
                const backupSocLimitAbove100 = counter.backupSocLimitAbove100 ?? 0;
                const apiEcagtGetGenRelayState = counter.api_ecagtGetGenRelayState ?? 0;

                //secctrl
                const secctrlSupported = ensembleStatusKeys.includes('secctrl');
                const secctrl = secctrlSupported ? ensembleStatus.secctrl : {};
                const shutDown = secctrl.shutdown;
                const freqBiasHz = secctrl.freq_bias_hz;
                const voltageBiasV = secctrl.voltage_bias_v;
                const freqBiasHzQ8 = secctrl.freq_bias_hz_q8;
                const voltageBiasVQ5 = secctrl.voltage_bias_v_q5;
                const freqBiasHzPhaseB = secctrl.freq_bias_hz_phaseb;
                const voltageBiasVPhaseB = secctrl.voltage_bias_v_phaseb;
                const freqBiasHzQ8PhaseB = secctrl.freq_bias_hz_q8_phaseb;
                const voltageBiasVQ5PhaseB = secctrl.voltage_bias_v_q5_phaseb;
                const freqBiasHzPhaseC = secctrl.freq_bias_hz_phasec;
                const voltageBiasVPhaseC = secctrl.voltage_bias_v_phasec;
                const freqBiasHzQ8PhaseC = secctrl.freq_bias_hz_q8_phasec;
                const voltageBiasVQ5PhaseC = secctrl.voltage_bias_v_q5_phasec;
                const configuredBackupSoc = secctrl.configured_backup_soc; //in %
                const adjustedBackupSoc = secctrl.adjusted_backup_soc; //in %
                const aggSoc = secctrl.agg_soc; //in %
                const aggMaxEnergy = parseFloat(secctrl.Max_energy) / 1000; //in kWh
                const encAggSoc = secctrl.ENC_agg_soc; //in %
                const encAggSoh = secctrl.ENC_agg_soh; //in %
                const encAggBackupEnergy = parseFloat(secctrl.ENC_agg_backup_energy) / 1000; //in kWh
                const encAggAvailEnergy = parseFloat(secctrl.ENC_agg_avail_energy) / 1000; //in kWh
                const encCommissionedCapacity = parseFloat(secctrl.Enc_commissioned_capacity) / 1000; //in kWh
                const encMaxAvailableCapacity = parseFloat(secctrl.Enc_max_available_capacity) / 1000; //in kWh
                const acbAggSoc = secctrl.ACB_agg_soc; //in %
                const acbAggEnergy = parseFloat(secctrl.ACB_agg_energy) / 1000; //in kWh
                const vlsLimit = secctrl.VLS_Limit ?? 0;
                const socRecEnabled = secctrl.soc_rec_enabled ?? false;
                const socRecoveryEntry = secctrl.soc_recovery_entry ?? 0;
                const socRecoveryExit = secctrl.soc_recovery_exit ?? 0;
                const commisionInProgress = secctrl.Commission_in_progress ?? false;
                const essInProgress = secctrl.ESS_in_progress ?? false;

                if (this.ensembleStatusService) {
                    this.ensembleStatusService
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusRestPower, restPower)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHz, freqBiasHz)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasV, voltageBiasV)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8, freqBiasHzQ8)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5, voltageBiasVQ5)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzPhaseB, freqBiasHzPhaseB)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVPhaseB, voltageBiasVPhaseB)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8PhaseB, freqBiasHzQ8PhaseB)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5PhaseB, voltageBiasVQ5PhaseB)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzPhaseC, freqBiasHzPhaseC)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVPhaseC, voltageBiasVPhaseC)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8PhaseC, freqBiasHzQ8PhaseC)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5PhaseC, voltageBiasVQ5PhaseC)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusConfiguredBackupSoc, configuredBackupSoc)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusAdjustedBackupSoc, adjustedBackupSoc)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusAggSoc, aggSoc)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusAggMaxEnergy, aggMaxEnergy)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusEncAggSoc, encAggSoc)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusEncAggRatedPower, enchargesRatedPowerSum)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusEncAggBackupEnergy, encAggBackupEnergy)
                        .updateCharacteristic(Characteristic.enphaseEnsembleStatusEncAggAvailEnergy, encAggAvailEnergy)
                }

                this.ensembleRestPower = restPower;
                this.ensembleFreqBiasHz = freqBiasHz;
                this.ensembleVoltageBiasV = voltageBiasV;
                this.ensembleFreqBiasHzQ8 = freqBiasHzQ8;
                this.ensembleVoltageBiasVQ5 = voltageBiasVQ5;
                this.ensembleFreqBiasHzPhaseB = freqBiasHzPhaseB;
                this.ensembleVoltageBiasVPhaseB = voltageBiasVPhaseB;
                this.ensembleFreqBiasHzQ8PhaseB = freqBiasHzQ8PhaseB;
                this.ensembleVoltageBiasVQ5PhaseB = voltageBiasVQ5PhaseB;
                this.ensembleFreqBiasHzPhaseC = freqBiasHzPhaseC;
                this.ensembleVoltageBiasVPhaseC = voltageBiasVPhaseC;
                this.ensembleFreqBiasHzQ8PhaseC = freqBiasHzQ8PhaseC;
                this.ensembleVoltageBiasVQ5PhaseC = voltageBiasVQ5PhaseC;
                this.ensembleConfiguredBackupSoc = configuredBackupSoc;
                this.ensembleAdjustedBackupSoc = adjustedBackupSoc;
                this.ensembleAggSoc = aggSoc;
                this.ensembleAggMaxEnergy = aggMaxEnergy;
                this.ensembleEncAggSoc = encAggSoc;
                this.ensembleEncAggBackupEnergy = encAggBackupEnergy;
                this.ensembleEncAggAvailEnergy = encAggAvailEnergy;

                //relay
                const relaySupported = ensembleStatusKeys.includes('relay');
                const relay = relaySupported ? ensembleStatus.relay : {};
                const mainsAdminState = CONSTANTS.ApiCodes[relay.mains_admin_state] ?? 'Unknown';
                const mainsOperState = CONSTANTS.ApiCodes[relay.mains_oper_sate] ?? 'Unknown';
                const der1State = relay.der1_state ?? 0;
                const der2State = relay.der2_state ?? 0;
                const der3State = relay.der3_state ?? 0;
                const enchGridMode = relay.Enchg_grid_mode ?? 'Unknown';
                const enchGridModeTranslated = CONSTANTS.ApiCodes[enchGridMode] ?? relay.Enchg_grid_mode;
                const solarGridMode = relay.Solar_grid_mode ?? 'Unknown';
                const solarGridModeTranslated = CONSTANTS.ApiCodes[solarGridMode] ?? relay.Solar_grid_mode;

                //encharge grid state sensors
                this.enchargesGridMode = enchGridMode;
                this.enchargesGridModeTranslated = enchGridModeTranslated;
                if (this.enchargeGridModeActiveSensorsCount > 0) {
                    for (let i = 0; i < this.enchargeGridModeActiveSensorsCount; i++) {
                        const gridMode = this.enchargeGridModeActiveSensors[i].gridMode;
                        const state = gridMode === enchGridMode;
                        this.enchargeGridModeActiveSensors[i].state = state;

                        if (this.enchargeGridModeSensorsServices) {
                            const characteristicType = this.enchargeGridModeActiveSensors[i].characteristicType;
                            this.enchargeGridModeSensorsServices[i]
                                .updateCharacteristic(characteristicType, state)
                        }
                    }
                }

                //solar grid state sensors
                this.solarGridMode = solarGridMode;
                this.solarGridModeTranslated = solarGridModeTranslated;
                if (this.solarGridModeActiveSensorsCount > 0) {
                    for (let i = 0; i < this.solarGridModeActiveSensorsCount; i++) {
                        const gridMode = this.solarGridModeActiveSensors[i].gridMode;
                        const state = gridMode === solarGridMode;
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
                const profile = profileSupported ? ensembleStatus.profile : await this.updateGridProfileData();

                //fakeit
                const fakeInventoryModeSupported = ensembleStatusKeys.includes('fakeit');
                const fakeInventoryMode = fakeInventoryModeSupported ? ensembleStatus.fakeit.fake_inventory_mode === true : false;
                this.ensembleFakeInventoryMode = fakeInventoryMode;

                //ensemble status supported
                this.ensembleStatusSupported = true;

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

    updateLiveData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting live data.`) : false;

            try {
                const liveData = await this.axiosInstance(CONSTANTS.ApiUrls.LiveData);
                const live = liveData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Live data: ${JSON.stringify(live, null, 2)}`) : false;

                //live data keys
                const liveDadaKeys = Object.keys(live);
                const liveDadaKeysCount = liveDadaKeys.length;

                //live data
                if (liveDadaKeysCount === 0) {
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
                const enableLiveDataStream = !connectionScStream ? await this.enableLiveDataStream() : false;

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

                //lived data meteres installed
                this.liveDataTypes = [];
                this.liveDataTypes.push('PV');
                this.liveDataMetersType = [];
                this.liveDataMetersType.push(liveDataMeters.pv);

                //storage
                const pushStorageTypeToArray = (this.acBatteriesInstalled || this.enchargesInstalled) && this.metersStorageSupported ? this.liveDataTypes.push('Storage') : false;
                const pushStorageDataToArray = pushStorageTypeToArray ? this.liveDataMetersType.push(liveDataMeters.storage) : false;

                //grid and load
                const pushGridTypeToArray = this.metersSupported && this.metersConsumptionEnabled ? this.liveDataTypes.push('Grid') : false;
                const pushGridToArray = pushGridTypeToArray ? this.liveDataMetersType.push(liveDataMeters.grid) : false;
                const pushLoadTypeToArray = this.metersSupported && this.metersConsumptionEnabled ? this.liveDataTypes.push('Load') : false;
                const pushLoadeToArray = pushLoadTypeToArray ? this.liveDataMetersType.push(liveDataMeters.load) : false;

                //generator
                const pushGeneratorTypeToArray = this.generatorsInstalled ? this.liveDataTypes.push('Generator') : false;
                const pushGenertorToArray = pushGeneratorTypeToArray ? this.liveDataMetersType.push(liveDataMeters.generator) : false;

                //read meters data
                this.liveDataActivePower = [];
                this.liveDataApparentPower = [];
                this.liveDataActivePowerL1 = [];
                this.liveDataActivePowerL2 = [];
                this.liveDataActivePowerL3 = [];
                this.liveDataApparentPowerL1 = [];
                this.liveDataApparentPowerL2 = [];
                this.liveDataApparentPowerL3 = [];

                const liveDataMetersCount = this.liveDataMetersType.length;
                for (let i = 0; i < liveDataMetersCount; i++) {
                    const liveDataMeterType = this.liveDataMetersType[i];
                    const liveDataActivePower = liveDataMeterType.agg_p_mw / 1000000 || 0;
                    const liveDataApparentPower = liveDataMeterType.agg_s_mva / 1000000 || 0;
                    const liveDataActivePowerL1 = liveDataMeterType.agg_p_ph_a_mw / 1000000 || 0;
                    const liveDataActivePowerL2 = liveDataMeterType.agg_p_ph_b_mw / 1000000 || 0;
                    const liveDataActivePowerL3 = liveDataMeterType.agg_p_ph_c_mw / 1000000 || 0;
                    const liveDataApparentPowerL1 = liveDataMeterType.agg_s_ph_a_mva / 1000000 || 0;
                    const liveDataApparentPowerL2 = liveDataMeterType.agg_s_ph_b_mva / 1000000 || 0;
                    const liveDataApparentPowerL3 = liveDataMeterType.agg_s_ph_c_mva / 1000000 || 0;

                    if (this.liveDataMetersServices) {
                        this.liveDataMetersServices[i]
                            .updateCharacteristic(Characteristic.enphaseLiveDataActivePower, liveDataActivePower)
                            .updateCharacteristic(Characteristic.enphaseLiveDataActivePowerL1, liveDataActivePowerL1)
                            .updateCharacteristic(Characteristic.enphaseLiveDataActivePowerL2, liveDataActivePowerL2)
                            .updateCharacteristic(Characteristic.enphaseLiveDataActivePowerL3, liveDataActivePowerL3)
                            .updateCharacteristic(Characteristic.enphaseLiveDataApparentPower, liveDataApparentPower)
                            .updateCharacteristic(Characteristic.enphaseLiveDataApparentPowerL1, liveDataApparentPowerL1)
                            .updateCharacteristic(Characteristic.enphaseLiveDataApparentPowerL2, liveDataApparentPowerL2)
                            .updateCharacteristic(Characteristic.enphaseLiveDataApparentPowerL3, liveDataApparentPowerL3)
                    }

                    this.liveDataActivePower.push(liveDataActivePower);
                    this.liveDataApparentPower.push(liveDataApparentPower);
                    this.liveDataActivePowerL1.push(liveDataActivePowerL1);
                    this.liveDataActivePowerL2.push(liveDataActivePowerL2);
                    this.liveDataActivePowerL3.push(liveDataActivePowerL3);
                    this.liveDataApparentPowerL1.push(liveDataApparentPowerL1);
                    this.liveDataApparentPowerL2.push(liveDataApparentPowerL2);
                    this.liveDataApparentPowerL3.push(liveDataApparentPowerL3);
                }
                this.liveDataMetersCount = liveDataMetersCount;

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
                const tasks = tasksSupported ? live.tasks : {};
                const tasksId = tasks.task_id;
                const tasksTimestamp = tasks.timestamp;

                //counters
                const countersSupported = liveDadaKeys.includes('counters');
                const counters = countersSupported ? live.counters : {};
                const countersMainCfgLoad = counters.main_CfgLoad;
                const countersMainCfgChanged = counters.main_CfgChanged;
                const countersSigHup = counters.main_sigHUP;
                const countersMgttClientPublish = counters.MqttClient_publish;
                const countersMgttClientLiveDebug = counters.MqttClient_live_debug;
                const countersMgttClientRespond = counters.MqttClient_respond;
                const countersMgttClientMsgarrvd = counters.MqttClient_msgarrvd;
                const countersMgttClientCreate = counters.MqttClient_create;
                const countersMgttClientSetCallbacks = counters.MqttClient_setCallbacks;
                const countersMgttClientConnect = counters.MqttClient_connect;
                const countersMgttClientSubscribe = counters.MqttClient_subscribe;
                const countersSslKeysCreate = counters.SSL_Keys_Create;
                const countersScHdlDataPub = counters.sc_hdlDataPub;
                const countersScSendStreamCtrl = counters.sc_SendStreamCtrl;
                const countersScSendDemandRspCtrl = counters.sc_SendDemandRspCtrl;
                const countersRestStatus = counters.rest_Status;

                //dry contacts
                const dryContactsSupported = liveDadaKeys.includes('dry_contacts');
                const dryContacts = dryContactsSupported ? live.dry_contacts[''] : {};
                const dryContactId = dryContacts.dry_contact_id ?? '';
                const dryContactLoadName = dryContacts.dry_contact_load_name ?? '';
                const dryContactStatus = dryContacts.dry_contact_status ?? 0;

                //live data supported
                this.liveDataSupported = true;

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

    enableLiveDataStream() {
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
                const enableLiveDataStream = await axios.post(url, { 'enable': 1 }, options);
                const debug = this.enableDebugMode ? this.emit('debug', `Live data stream enable: ${JSON.stringify(enableLiveDataStream.data, null, 2)}`) : false;
                resolve();
            } catch (error) {
                reject(`Requesting live data stream eenable rror: ${error}.`);
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

                //microinverters summary 
                const productionEnergyLifetimeOffset = this.energyProductionLifetimeOffset;
                const productionMicroSummarywhToday = parseFloat(production.wattHoursToday) / 1000;
                const productionMicroSummarywhLastSevenDays = parseFloat(production.wattHoursSevenDays) / 1000;
                const productionMicroSummarywhLifeTime = parseFloat(production.wattHoursLifetime + productionEnergyLifetimeOffset) / 1000;
                const productionMicroSummaryWattsNow = parseFloat(production.wattsNow) / 1000;

                this.productionMicroSummarywhToday = productionMicroSummarywhToday;
                this.productionMicroSummarywhLastSevenDays = productionMicroSummarywhLastSevenDays;
                this.productionMicroSummarywhLifeTime = productionMicroSummarywhLifeTime;
                this.productionMicroSummaryWattsNow = productionMicroSummaryWattsNow;

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

                //get enabled devices
                const metersProductionEnabled = this.metersProductionEnabled;
                const metersProductionVoltageDivide = this.metersProductionVoltageDivide;
                const metersConsumptionEnabled = this.metersConsumptionEnabled;
                const metersConsumpionVoltageDivide = this.metersConsumpionVoltageDivide;
                const acBatteriesInstalled = this.acBatteriesInstalled;
                const productionEnergyLifetimeOffset = this.energyProductionLifetimeOffset;

                //microinverters data 0
                const productionMicro = productionCt.production[0] ?? {};
                const productionMicroType = CONSTANTS.ApiCodes[productionMicro.type];
                const productionMicroActiveCount = productionMicro.activeCount;
                const productionMicroReadingTime = new Date(productionMicro.readingTime * 1000).toLocaleString();
                const productionMicroPower = parseFloat(productionMicro.wNow) / 1000;
                const productionMicroEnergyLifeTime = parseFloat(productionMicro.whLifetime + productionEnergyLifetimeOffset) / 1000;

                //production data 1
                const production = productionCt.production[1] ?? {};
                const productionType = metersProductionEnabled ? CONSTANTS.ApiCodes[production.type] : productionMicroType;
                const productionActiveCount = metersProductionEnabled ? production.activeCount : productionMicroActiveCount;
                const productionMeasurmentType = metersProductionEnabled ? CONSTANTS.ApiCodes[production.measurementType] : productionMicroType;
                const productionReadingTime = metersProductionEnabled ? new Date(production.readingTime * 1000).toLocaleString() : productionMicroReadingTime;
                const productionPower = metersProductionEnabled ? parseFloat(production.wNow) / 1000 : productionMicroPower;

                //power state
                const productionPowerState = productionPower > 0; // true if power > 0
                const debug1 = this.enableDebugMode ? this.emit('debug', `Production power state: ${productionPowerState}`) : false;

                //power level
                const powerProductionSummary = this.powerProductionSummary / 1000; //kW
                const productionPowerLevel = productionPowerState ? (Math.min(Math.max((100 / powerProductionSummary) * productionPower, 1), 100)).toFixed(1) : 0; //0-100%
                const debug2 = this.enableDebugMode ? this.emit('debug', `Production power level: ${productionPowerLevel} %`) : false;

                //power peak
                const productionPowerPeakStored = this.productionPowerPeak;
                const productionPowerPeak = productionPower > productionPowerPeakStored ? productionPower : productionPowerPeakStored;

                //power peak detected
                const productionPowerPeakDetected = productionPower > productionPowerPeakStored;
                const debug4 = this.enableDebugMode ? this.emit('debug', `Production power peak detected: ${productionPowerPeakDetected}`) : false;
                this.productionPowerPeak = productionPowerPeakDetected ? productionPower : this.productionPowerPeak;

                //energy
                const productionEnergyLifeTime = metersProductionEnabled ? parseFloat((production.whLifetime + productionEnergyLifetimeOffset) / 1000) : productionMicroEnergyLifeTime;
                const productionEnergyVarhLeadLifetime = metersProductionEnabled ? parseFloat(production.varhLeadLifetime) / 1000 : 0;
                const productionEnergyVarhLagLifetime = metersProductionEnabled ? parseFloat(production.varhLagLifetime) / 1000 : 0;
                const productionEnergyLastSevenDays = metersProductionEnabled ? parseFloat(production.whLastSevenDays) / 1000 : this.productionMicroSummarywhLastSevenDays;
                const productionEnergyToday = metersProductionEnabled ? parseFloat(production.whToday) / 1000 : this.productionMicroSummarywhToday;
                const productionEnergyVahToday = metersProductionEnabled ? parseFloat(production.vahToday) / 1000 : 0;
                const productionEnergyVarhLeadToday = metersProductionEnabled ? parseFloat(production.varhLeadToday) / 1000 : 0;
                const productionEnergyVarhLagToday = metersProductionEnabled ? parseFloat(production.varhLagToday) / 1000 : 0;

                //energy lifetime fix for negative value
                const productionEnergyLifeTimeFix = Math.min(productionEnergyLifeTime, 0);

                //energy state
                const productionEnergyState = productionEnergyToday > 0; // true if energy > 0
                const debug5 = this.enableDebugMode ? this.emit('debug', `Production energy state: ${productionEnergyState}`) : false;

                //param
                const productionRmsCurrent = metersProductionEnabled ? parseFloat(production.rmsCurrent) : 0;
                const productionRmsVoltage = metersProductionEnabled ? parseFloat(production.rmsVoltage / metersProductionVoltageDivide) : 0;
                const productionReactivePower = metersProductionEnabled ? parseFloat(production.reactPwr) / 1000 : 0;
                const productionApparentPower = metersProductionEnabled ? parseFloat(production.apprntPwr) / 1000 : 0;
                const productionPwrFactor = metersProductionEnabled ? parseFloat(production.pwrFactor) : 0;

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

                        if (this.powerProductionStateSensorsService) {
                            const characteristicType = this.powerProductionStateActiveSensors[i].characteristicType;
                            this.powerProductionStateSensorsService[i]
                                .updateCharacteristic(characteristicType, productionPowerState)
                        }
                    }
                }
                if (this.powerProductionLevelActiveSensorsCount > 0) {
                    for (let i = 0; i < this.powerProductionLevelActiveSensorsCount; i++) {
                        const powerLevel = this.powerProductionLevelActiveSensors[i].powerLevel;
                        const state = productionPower >= powerLevel;
                        this.powerProductionLevelActiveSensors[i].state = state;

                        if (this.powerProductionLevelSensorsService) {
                            const characteristicType = this.powerProductionLevelActiveSensors[i].characteristicType;
                            this.powerProductionLevelSensorsService[i]
                                .updateCharacteristic(characteristicType, state)
                        }
                    }
                }

                //sensors energy
                if (this.energyProductionStateActiveSensorsCount > 0) {
                    for (let i = 0; i < this.energyProductionStateActiveSensorsCount; i++) {
                        this.energyProductionStateActiveSensors[i].state = productionEnergyState;

                        if (this.energyProductionStateSensorsService) {
                            const characteristicType = this.energyProductionStateActiveSensors[i].characteristicType;
                            this.energyProductionStateSensorsService[i]
                                .updateCharacteristic(characteristicType, productionEnergyState)
                        }
                    }
                }
                if (this.energyProductionLevelActiveSensorsCount > 0) {
                    for (let i = 0; i < this.energyProductionLevelActiveSensorsCount; i++) {
                        const energyLevel = this.energyProductionLevelActiveSensors[i].energyLevel;
                        const state = productionEnergyToday >= energyLevel;
                        this.energyProductionLevelActiveSensors[i].state = state;

                        if (this.energyProductionLevelSensorsService) {
                            const characteristicType = this.energyProductionLevelActiveSensors[i].characteristicType;
                            this.energyProductionLevelSensorsService[i]
                                .updateCharacteristic(characteristicType, state)
                        }
                    }
                }

                this.productionPowerState = productionPowerState;
                this.productionPowerLevel = productionPowerLevel;
                this.productionActiveCount = productionActiveCount;
                this.productionType = productionType;
                this.productionMeasurmentType = productionMeasurmentType;
                this.productionReadingTime = productionReadingTime;
                this.productionPower = productionPower;
                this.productionPowerPeak = productionPowerPeak;
                this.productionPowerPeakDetected = productionPowerPeakDetected;
                this.productionEnergyToday = productionEnergyToday;
                this.productionEnergyLastSevenDays = productionEnergyLastSevenDays;
                this.productionEnergyLifeTime = productionEnergyLifeTimeFix;
                this.productionEnergyState = productionEnergyState;

                this.productionRmsCurrent = productionRmsCurrent;
                this.productionRmsVoltage = productionRmsVoltage;
                this.productionReactivePower = productionReactivePower;
                this.productionApparentPower = productionApparentPower;
                this.productionPwrFactor = productionPwrFactor;

                //consumption data 2
                if (metersConsumptionEnabled) {
                    this.consumptionsType = [];
                    this.consumptionsMeasurmentType = [];
                    this.consumptionsActiveCount = [];
                    this.consumptionsReadingTime = [];
                    this.consumptionsPower = [];
                    this.consumptionsPowerPeakDetected = [];
                    this.consumptionsPowerState = [];
                    this.consumptionsEnergyToday = [];
                    this.consumptionsEnergyLastSevenDays = [];
                    this.consumptionsEnergyLifeTime = [];
                    this.consumptionsEnergyState = [];
                    this.consumptionsRmsCurrent = [];
                    this.consumptionsRmsVoltage = [];
                    this.consumptionsReactivePower = [];
                    this.consumptionsApparentPower = [];
                    this.consumptionsPwrFactor = [];

                    const consumptionsCount = productionCt.consumption.length; //net nad total
                    for (let i = 0; i < consumptionsCount; i++) {
                        //power
                        const consumption = productionCt.consumption[i] ?? {};
                        const consumptionType = CONSTANTS.ApiCodes[consumption.type];
                        const consumptionActiveCount = consumption.activeCount;
                        const consumptionMeasurmentType = CONSTANTS.ApiCodes[consumption.measurementType];
                        const consumptionReadingTime = new Date(consumption.readingTime * 1000).toLocaleString();
                        const consumptionPower = parseFloat(consumption.wNow) / 1000;

                        //power state
                        const consumptionPowerState = consumptionPower > 0; // true if power > 0
                        const debug1 = this.enableDebugMode ? this.emit('debug', `Consumption ${['Total', 'Net'][i]} power state: ${consumptionPowerState}`) : false;

                        //power peak
                        const consumptionPowerPeakStored = this.consumptionsPowerPeak[i] || 0;
                        const consumptionPowerPeak = consumptionPower > consumptionPowerPeakStored ? consumptionPower : consumptionPowerPeakStored;

                        //power peak detected
                        const consumptionPowerPeakDetected = consumptionPower > consumptionPowerPeakStored;
                        this.consumptionsPowerPeak[i] = consumptionPowerPeakDetected ? consumptionPower : this.consumptionsPowerPeak[i];

                        //energy
                        const consumptionsLifeTimeOffset = [this.energyConsumptionTotalLifetimeOffset, this.energyConsumptionNetLifetimeOffset][i];
                        const consumptionEnergyLifeTime = parseFloat(consumption.whLifetime + consumptionsLifeTimeOffset) / 1000;
                        const consumptionEnergyVarhLeadLifetime = parseFloat(consumption.varhLeadLifetime) / 1000;
                        const consumptionEnergyVarhLagLifetime = parseFloat(consumption.varhLagLifetime) / 1000;
                        const consumptionEnergyLastSevenDays = parseFloat(consumption.whLastSevenDays) / 1000;
                        const consumptionEnergyToday = parseFloat(consumption.whToday) / 1000;
                        const consumptionEnergyVahToday = parseFloat(consumption.vahToday) / 1000;
                        const consumptionEnergyVarhLeadToday = parseFloat(consumption.varhLeadToday) / 1000;
                        const consumptionEnergyVarhLagToday = parseFloat(consumption.varhLagToday) / 1000;

                        //energy state
                        const consumptionEnergyState = consumptionEnergyToday > 0; // true if energy > 0
                        const debug5 = this.enableDebugMode ? this.emit('debug', `Consumption ${['Total', 'Net'][i]} energy state: ${consumptionEnergyState}`) : false;

                        //net param
                        const consumptionRmsCurrent = parseFloat(consumption.rmsCurrent);
                        const consumptionRmsVoltage = parseFloat(consumption.rmsVoltage / metersConsumpionVoltageDivide);
                        const consumptionReactivePower = parseFloat(consumption.reactPwr) / 1000;
                        const consumptionApparentPower = parseFloat(consumption.apprntPwr) / 1000;
                        const consumptionPwrFactor = parseFloat(consumption.pwrFactor);
                        const consumptionEnergyLifeTimeFix = consumptionEnergyLifeTime < 0 ? 0 : consumptionEnergyLifeTime;

                        if (this.consumptionsServices) {
                            this.consumptionsServices[i]
                                .updateCharacteristic(Characteristic.enphaseReadingTime, consumptionReadingTime)
                                .updateCharacteristic(Characteristic.enphasePower, consumptionPower)
                                .updateCharacteristic(Characteristic.enphasePowerMax, consumptionPowerPeak)
                                .updateCharacteristic(Characteristic.enphasePowerMaxDetected, consumptionPowerPeakDetected)
                                .updateCharacteristic(Characteristic.enphaseEnergyToday, consumptionEnergyToday)
                                .updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, consumptionEnergyLastSevenDays)
                                .updateCharacteristic(Characteristic.enphaseEnergyLifeTime, consumptionEnergyLifeTimeFix)
                                .updateCharacteristic(Characteristic.enphaseRmsCurrent, consumptionRmsCurrent)
                                .updateCharacteristic(Characteristic.enphaseRmsVoltage, consumptionRmsVoltage)
                                .updateCharacteristic(Characteristic.enphaseReactivePower, consumptionReactivePower)
                                .updateCharacteristic(Characteristic.enphaseApparentPower, consumptionApparentPower)
                                .updateCharacteristic(Characteristic.enphasePwrFactor, consumptionPwrFactor)
                                .updateCharacteristic(Characteristic.enphasePowerMaxReset, false);
                        }

                        if (i === 0) {
                            //sensors power total
                            if (this.powerConsumptionTotalStateActiveSensorsCount > 0) {
                                for (let i = 0; i < this.powerConsumptionTotalStateActiveSensorsCount; i++) {
                                    this.powerConsumptionTotalStateActiveSensors[i].state = consumptionPowerState;

                                    if (this.powerConsumptionTotalStateSensorsService) {
                                        const characteristicType = this.powerConsumptionTotalStateActiveSensors[i].characteristicType;
                                        this.powerConsumptionTotalStateSensorsService[i]
                                            .updateCharacteristic(characteristicType, consumptionPowerState)
                                    }
                                }
                            }
                            if (this.powerConsumptionTotalLevelActiveSensorsCount > 0) {
                                for (let i = 0; i < this.powerConsumptionTotalLevelActiveSensorsCount; i++) {
                                    const powerLevel = this.powerConsumptionTotalLevelActiveSensors[i].powerLevel;
                                    const state = consumptionPower >= powerLevel;
                                    this.powerConsumptionTotalLevelActiveSensors[i].state = state;

                                    if (this.powerConsumptionTotalLevelSensorsService) {
                                        const characteristicType = this.powerConsumptionTotalLevelActiveSensors[i].characteristicType;
                                        this.powerConsumptionTotalLevelSensorsService[i]
                                            .updateCharacteristic(characteristicType, state)
                                    }
                                }
                            }

                            //sensors energy total
                            if (this.energyConsumptionTotalStateActiveSensorsCount > 0) {
                                for (let i = 0; i < this.energyConsumptionTotalStateActiveSensorsCount; i++) {
                                    this.energyConsumptionTotalStateActiveSensors[i].state = consumptionEnergyState;

                                    if (this.energyConsumptionTotalStateSensorsService) {
                                        const characteristicType = this.energyConsumptionTotalStateActiveSensors[i].characteristicType;
                                        this.energyConsumptionTotalStateSensorsService[i]
                                            .updateCharacteristic(characteristicType, consumptionEnergyState)
                                    }
                                }
                            }
                            if (this.energyConsumptionTotalLevelActiveSensorsCount > 0) {
                                for (let i = 0; i < this.energyConsumptionTotalLevelActiveSensorsCount; i++) {
                                    const energyLevel = this.energyConsumptionTotalLevelActiveSensors[i].energyLevel;
                                    const state = consumptionEnergyToday >= energyLevel;
                                    this.energyConsumptionTotalLevelActiveSensors[i].state = state;

                                    if (this.energyConsumptionTotalLevelSensorsService) {
                                        const characteristicType = this.energyConsumptionTotalLevelActiveSensors[i].characteristicType;
                                        this.energyConsumptionTotalLevelSensorsService[i]
                                            .updateCharacteristic(characteristicType, state)
                                    }
                                }
                            }
                        }

                        if (i === 1) {
                            //sensors power net
                            if (this.powerConsumptionNetStateActiveSensorsCount > 0) {
                                for (let i = 0; i < this.powerConsumptionNetStateActiveSensorsCount; i++) {
                                    this.powerConsumptionNetStateActiveSensors[i].state = consumptionPowerState;

                                    if (this.powerConsumptionNetStateSensorsService) {
                                        const characteristicType = this.powerConsumptionNetStateActiveSensors[i].characteristicType;
                                        this.powerConsumptionNetStateSensorsService[i]
                                            .updateCharacteristic(characteristicType, consumptionPowerState)
                                    }
                                }
                            }
                            if (this.powerConsumptionNetLevelActiveSensorsCount > 0) {
                                for (let i = 0; i < this.powerConsumptionNetLevelActiveSensorsCount; i++) {
                                    const powerLevel = this.powerConsumptionNetLevelActiveSensors[i].powerLevel;
                                    const importing = powerLevel >= 0;
                                    const state = importing ? consumptionPower >= powerLevel : consumptionPower <= powerLevel;
                                    this.powerConsumptionNetLevelActiveSensors[i].state = state;

                                    if (this.powerConsumptionNetLevelSensorsService) {
                                        const characteristicType = this.powerConsumptionNetLevelActiveSensors[i].characteristicType;
                                        this.powerConsumptionNetLevelSensorsService[i]
                                            .updateCharacteristic(characteristicType, state)
                                    }
                                }
                            }

                            //sensors energy net
                            if (this.energyConsumptionNetStateActiveSensorsCount > 0) {
                                for (let i = 0; i < this.energyConsumptionNetStateActiveSensorsCount; i++) {
                                    this.energyConsumptionNetStateActiveSensors[i].state = consumptionEnergyState;

                                    if (this.energyConsumptionNetStateSensorsService) {
                                        const characteristicType = this.energyConsumptionNetStateActiveSensors[i].characteristicType;
                                        this.energyConsumptionNetStateSensorsService[i]
                                            .updateCharacteristic(characteristicType, consumptionEnergyState)
                                    }
                                }
                            }
                            if (this.energyConsumptionNetLevelActiveSensorsCount > 0) {
                                for (let i = 0; i < this.energyConsumptionNetLevelActiveSensorsCount; i++) {
                                    const energyLevel = this.energyConsumptionNetLevelActiveSensors[i].energyLevel;
                                    const state = consumptionEnergyToday >= energyLevel;
                                    this.energyConsumptionNetLevelActiveSensors[i].state = state;

                                    if (this.energyConsumptionNetLevelSensorsService) {
                                        const characteristicType = this.energyConsumptionNetLevelActiveSensors[i].characteristicType;
                                        this.energyConsumptionNetLevelSensorsService[i]
                                            .updateCharacteristic(characteristicType, state)
                                    }
                                }
                            }
                        }

                        this.consumptionsCount = consumptionsCount;
                        this.consumptionsType.push(consumptionType);
                        this.consumptionsMeasurmentType.push(consumptionMeasurmentType);
                        this.consumptionsActiveCount.push(consumptionActiveCount);
                        this.consumptionsReadingTime.push(consumptionReadingTime);
                        this.consumptionsPower.push(consumptionPower);
                        this.consumptionsPowerPeak.push(consumptionPowerPeak);
                        this.consumptionsPowerPeakDetected.push(consumptionPowerPeakDetected);
                        this.consumptionsPowerState.push(consumptionPowerState);
                        this.consumptionsEnergyToday.push(consumptionEnergyToday);
                        this.consumptionsEnergyLastSevenDays.push(consumptionEnergyLastSevenDays);
                        this.consumptionsEnergyLifeTime.push(consumptionEnergyLifeTimeFix);
                        this.consumptionsEnergyState.push(consumptionEnergyState);
                        this.consumptionsRmsCurrent.push(consumptionRmsCurrent);
                        this.consumptionsRmsVoltage.push(consumptionRmsVoltage);
                        this.consumptionsReactivePower.push(consumptionReactivePower);
                        this.consumptionsApparentPower.push(consumptionApparentPower);
                        this.consumptionsPwrFactor.push(consumptionPwrFactor);
                    }
                }

                //ac btteries summary 3
                if (acBatteriesInstalled) {
                    const acBaterie = productionCt.storage[0] ?? {};
                    const type = CONSTANTS.ApiCodes[acBaterie.type] ?? 'AC Batterie';
                    const activeCount = acBaterie.activeCount;
                    const readingTime = new Date(acBaterie.readingTime * 1000).toLocaleString();
                    const wNow = parseFloat(acBaterie.wNow) / 1000;
                    const whNow = parseFloat(acBaterie.whNow + this.acBatteriesStorageOffset) / 1000;
                    const chargeStatus = CONSTANTS.ApiCodes[acBaterie.state] ?? 'Unknown';
                    const percentFull = acBaterie.percentFull;
                    const energyState = percentFull > 0;

                    if (this.acBatteriesSummaryService) {
                        this.acBatteriesSummaryService
                            .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryReadingTime, readingTime)
                            .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryPower, wNow)
                            .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryEnergy, whNow)
                            .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryPercentFull, percentFull)
                            .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryActiveCount, activeCount)
                            .updateCharacteristic(Characteristic.enphaseAcBatterieSummaryState, chargeStatus);
                    }

                    if (this.enphaseAcBatterieSummaryLevelAndStateService) {
                        this.enphaseAcBatterieSummaryLevelAndStateService
                            .updateCharacteristic(Characteristic.On, energyState)
                            .updateCharacteristic(Characteristic.Brightness, percentFull)
                    }

                    this.acBatteriesSummaryType = type;
                    this.acBatteriesSummaryActiveCount = activeCount;
                    this.acBatteriesSummaryReadingTime = readingTime;
                    this.acBatteriesSummaryPower = wNow;
                    this.acBatteriesSummaryEnergy = whNow;
                    this.acBatteriesSummaryState = chargeStatus;
                    this.acBatteriesSummaryPercentFull = percentFull;
                    this.acBatteriesSummaryEnergyState = energyState;
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
                const microinvertersCount = microinverters.length;
                if (microinvertersCount === 0) {
                    resolve(false);
                    return;
                }

                //microinverters power
                this.microinvertersReadingTime = [];
                this.microinvertersDevType = [];
                this.microinvertersLastPower = [];
                this.microinvertersMaxPower = [];

                for (let i = 0; i < this.microinvertersCount; i++) {
                    const index = microinverters.findIndex(device => device.serialNumber == this.microinvertersSerialNumber[i]);
                    const microinverter = microinverters[index];
                    const lastReportDate = new Date(microinverter.lastReportDate * 1000).toLocaleString();
                    const devType = microinverter.devType;
                    const lastReportWatts = parseInt(microinverter.lastReportWatts);
                    const microinverterPower = lastReportWatts >= 0 ? lastReportWatts : 0;
                    const maxReportWatts = parseInt(microinverter.maxReportWatts);

                    if (this.microinvertersServices) {
                        this.microinvertersServices[i]
                            .updateCharacteristic(Characteristic.enphaseMicroinverterLastReportDate, lastReportDate)
                            .updateCharacteristic(Characteristic.enphaseMicroinverterPower, microinverterPower)
                            .updateCharacteristic(Characteristic.enphaseMicroinverterPowerMax, maxReportWatts)
                    }

                    this.microinvertersReadingTime.push(lastReportDate);
                    this.microinvertersDevType.push(devType);
                    this.microinvertersLastPower.push(microinverterPower);
                    this.microinvertersMaxPower.push(maxReportWatts);
                }
                this.microinvertersPowerSupported = this.microinvertersLastPower.length > 0;

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

    getProductionPowerModeData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting power production mode.`) : false;

            try {
                const powerModeUrl = CONSTANTS.ApiUrls.PowerForcedModeGet.replace("EID", this.envoyDevId);
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

                const powerMode = productionPowerMode.powerForcedOff === false ?? false;
                if (this.envoyService) {
                    this.envoyService
                        .updateCharacteristic(Characteristic.enphaseEnvoyProductionPowerMode, powerMode)
                }
                this.productionPowerMode = powerMode;
                this.productionPowerModeSupported = true;

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

    setProductionPowerModeData(state) {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Set power production mode.`) : false;

            try {
                const powerModeUrl = CONSTANTS.ApiUrls.PowerForcedModePut.replace("EID", this.envoyDevId);
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

                const productionPowerModeData = this.productionPowerMode !== state ? (this.envoyFirmware7xx ? await this.axiosInstance(powerModeUrl) : await this.digestAuthInstaller.request(powerModeUrl, options)) : false;
                const productionPowerMode = productionPowerModeData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Set power mode: ${JSON.stringify(productionPowerMode, null, 2)}`) : false;
                resolve();
            } catch (error) {
                reject(`Set power production mode error: ${error}.`);
            };
        });
    }

    updatePlcLevelData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting plc level.`) : false;

            try {
                this.checkCommLevel = true;

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

                //create arrays
                this.microinvertersCommLevel = [];
                this.acBatteriesCommLevel = [];
                this.qRelaysCommLevel = [];
                this.enchargesCommLevel = [];

                // get comm level data
                for (let i = 0; i < this.microinvertersCount; i++) {
                    const key = `${this.microinvertersSerialNumber[i]}`;
                    const value = (plcLevel[key] ?? 0) * 20;

                    if (this.microinvertersServices) {
                        this.microinvertersServices[i]
                            .updateCharacteristic(Characteristic.enphaseMicroinverterCommLevel, value)
                    }
                    this.microinvertersCommLevel.push(value);
                }

                for (let i = 0; i < this.acBatteriesCount; i++) {
                    const key = `${this.acBatteriesSerialNumber[i]}`;
                    const value = (plcLevel[key] ?? 0) * 20;

                    if (this.acBatteriesServices) {
                        this.acBatteriesServices[i]
                            .updateCharacteristic(Characteristic.enphaseAcBatterieCommLevel, value)
                    }
                    this.acBatteriesCommLevel.push(value);
                }

                for (let i = 0; i < this.qRelaysCount; i++) {
                    const key = `${this.qRelaysSerialNumber[i]}`;
                    const value = (plcLevel[key] ?? 0) * 20;

                    if (this.qRelaysServices) {
                        this.qRelaysServices[i]
                            .updateCharacteristic(Characteristic.enphaseQrelayCommLevel, value)
                    }
                    this.qRelaysCommLevel.push(value);
                }

                for (let i = 0; i < this.enchargesCount; i++) {
                    const key = `${this.enchargesSerialNumber[i]}`;
                    const value = (plcLevel[key] ?? 0) * 20;

                    if (this.enchargesServices) {
                        this.enchargesServices[i]
                            .updateCharacteristic(Characteristic.enphaseEnchargeCommLevel, value)
                    }
                    this.enchargesCommLevel.push(value);
                }

                //disable check comm level switch
                if (this.envoyService) {
                    this.envoyService
                        .updateCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel, false);
                }
                this.checkCommLevel = false;
                this.plcLevelSupported = true;

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

    setEnchargeProfile(profile, reserve, independence) {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting encharge profile set.`) : false;

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
                const url = this.url + CONSTANTS.ApiUrls.EnsembleStatus;
                const enchargeProfileSet = await axios.post(url, {
                    battery_mode: profile,
                    configured_backup_soc: reserve,
                    energy_independence: independence
                }, options);
                const debug = this.enableDebugMode ? this.emit('debug', `Set encharge profile: ${JSON.stringify(enchargeProfileSet.data, null, 2)}`) : false;
                resolve();
            } catch (error) {
                reject(`Set encharge profile error: ${error}.`);
            };
        });
    };

    getDeviceInfo() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting device info.`) : false;

        this.emit('devInfo', `-------- ${this.name} --------`);
        this.emit('devInfo', `Manufacturer: Enphase`);
        this.emit('devInfo', `Model: ${this.envoyModelName}`);
        this.emit('devInfo', `Firmware: ${this.envoyFirmware}`);
        this.emit('devInfo', `SerialNr: ${this.envoySerialNumber}`);
        this.emit('devInfo', `Time: ${this.envoyTime}`);
        const displayLog = this.envoyFirmware7xx && this.envoyFirmware7xxTokenGenerationMode === 0 ? this.emit('devInfo', `Token Valid: ${new Date(this.jwtToken.expires_at * 1000).toLocaleString()}`) : false;
        this.emit('devInfo', `------------------------------`);
        this.emit('devInfo', `Q-Relays: ${this.qRelaysCount}`);
        this.emit('devInfo', `Inverters: ${this.microinvertersCount}`);
        this.emit('devInfo', `Batteries: ${this.acBatteriesCount}`);
        this.emit('devInfo', `--------------------------------`);
        const displayLog0 = this.metersSupported ? this.emit('devInfo', `Meters: Yes`) : false;
        const displayLog1 = this.metersSupported && this.metersProductionSupported ? this.emit('devInfo', `Production: ${this.metersProductionEnabled ? `Enabled` : `Disabled`}`) : false;
        const displayLog2 = this.metersSupported && this.metersConsumptionSupported ? this.emit('devInfo', `Consumption: ${this.metersConsumptionEnabled ? `Enabled` : `Disabled`}`) : false;
        const displayLog3 = this.metersSupported && this.metersStorageSupported ? this.emit('devInfo', `Storage: ${this.metersStorageEnabled ? `Enabled` : `Disabled`}`) : false;
        const displayLog4 = this.metersSupported ? this.emit('devInfo', `--------------------------------`) : false;
        const displayLog5 = this.ensemblesInstalled ? this.emit('devInfo', `Ensemble: Yes`) : false;
        const displayLog6 = this.enpowersInstalled ? this.emit('devInfo', `Enpowers: ${this.enpowersCount}`) : false;
        const displayLog7 = this.enchargesInstalled ? this.emit('devInfo', `Encharges: ${this.enchargesCount}`) : false;
        const displayLog8 = this.wirelessConnectionKitInstalled ? this.emit('devInfo', `Wireless Kit: ${this.wirelessConnectionKitConnectionsCount}`) : false;
        const displayLog9 = this.ensemblesInstalled || this.enpowersInstalled || this.enchargesInstalled || this.wirelessConnectionKitInstalled ? this.emit('devInfo', `--------------------------------`) : false;
    };

    //Prepare accessory
    prepareAccessory() {
        return new Promise((resolve, reject) => {
            try {
                //prepare accessory
                const debug = this.enableDebugMode ? this.emit('debug', `Prepare accessory`) : false;
                const serialNumber = this.envoySerialNumber;
                const accessoryName = this.name;
                const accessoryUUID = AccessoryUUID.generate(serialNumber);
                const accessoryCategory = Categories.OTHER;
                const accessory = new Accessory(accessoryName, accessoryUUID, accessoryCategory);

                //information service
                const debug1 = this.enableDebugMode ? this.emit('debug', `Prepare Information Service`) : false;
                accessory.getService(Service.AccessoryInformation)
                    .setCharacteristic(Characteristic.Manufacturer, 'Enphase')
                    .setCharacteristic(Characteristic.Model, this.envoyModelName ?? 'Model Name')
                    .setCharacteristic(Characteristic.SerialNumber, this.envoySerialNumber ?? 'Serial Number')
                    .setCharacteristic(Characteristic.FirmwareRevision, this.envoyFirmware.replace(/[a-zA-Z]/g, '') ?? '0');

                //get enabled devices
                const metersSupported = this.metersSupported;
                const metersCount = this.metersCount;
                const metersProductionEnabled = this.metersProductionEnabled;
                const metersConsumptionEnabled = this.metersConsumptionEnabled;
                const consumptionsCount = this.consumptionsCount;
                const microinvertersInstalled = this.microinvertersInstalled;
                const microinvertersCount = this.microinvertersCount;
                const microinvertersPowerSupported = this.microinvertersPowerSupported;
                const acBatteriesInstalled = this.acBatteriesInstalled;
                const acBatteriesCount = this.acBatteriesCount;
                const qRelaysInstalled = this.qRelaysInstalled;
                const qRelaysCount = this.qRelaysCount;
                const ensemblesInstalled = this.ensemblesInstalled;
                const ensemblesCount = this.ensemblesCount;
                const enpowersInstalled = this.enpowersInstalled;
                const enpowersCount = this.enpowersCount;
                const enchargesInstalled = this.enchargesInstalled;
                const enchargesCount = this.enchargesCount;
                const ensembleStatusSupported = this.ensembleStatusSupported;
                const generatorsInstalled = this.generatorsInstalled;
                const wirelessConnectionKitInstalled = this.wirelessConnectionKitInstalled;
                const wirelessConnectionKitConnectionsCount = this.wirelessConnectionKitConnectionsCount;
                const liveDataSupported = this.liveDataSupported;
                const productionPowerModeSupported = this.productionPowerModeSupported;
                const plcLevelSupported = this.plcLevelSupported;

                //system
                const debug2 = this.enableDebugMode ? this.emit('debug', `Prepare System Service`) : false;
                this.systemService = accessory.addService(Service.Lightbulb, accessoryName, `systemPvService`);
                this.systemService.getCharacteristic(Characteristic.On)
                    .onGet(async () => {
                        const state = this.productionPowerState;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production power state: ${state ? 'Active' : 'Not active'}`);
                        return state;
                    })
                    .onSet(async (state) => {
                        try {
                            this.systemService.updateCharacteristic(Characteristic.On, this.productionPowerState);
                        } catch (error) {
                            this.emit('error', `Set production power state error: ${error}`);
                        };
                    })
                this.systemService.getCharacteristic(Characteristic.Brightness)
                    .onGet(async () => {
                        const state = this.productionPowerLevel;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production power level: ${this.productionPowerLevel} %`);
                        return state;
                    })
                    .onSet(async (value) => {
                        try {
                            this.systemService.updateCharacteristic(Characteristic.Brightness, this.productionPowerLevel);
                        } catch (error) {
                            this.emit('error', `Set production power level error: ${error}`);
                        };
                    })

                //envoy
                const debug3 = this.enableDebugMode ? this.emit('debug', `Prepare Envoy Service`) : false;
                this.envoyService = accessory.addService(Service.enphaseEnvoyService, `Envoy ${serialNumber}`, 'enphaseEnvoyService');
                this.envoyService.setCharacteristic(Characteristic.ConfiguredName, `Envoy ${serialNumber}`);
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyAlerts)
                    .onGet(async () => {
                        const value = this.envoyAlerts;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, alerts: ${value}`);
                        return value;
                    });
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface)
                    .onGet(async () => {
                        const value = this.envoyPrimaryInterface;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, network interface: ${value}`);
                        return value;
                    });
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm)
                    .onGet(async () => {
                        const value = this.envoyWebComm;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, web communication: ${value ? 'Yes' : 'No'}`);
                        return value;
                    });
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten)
                    .onGet(async () => {
                        const value = this.envoyEverReportedToEnlighten;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, report to enlighten: ${value ? 'Yes' : 'No'}`);
                        return value;
                    });
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel)
                    .onGet(async () => {
                        const value = (`${this.envoyCommNum} / ${this.envoyCommLevel} %`);
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication devices and level: ${value}`);
                        return value;
                    });
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel)
                    .onGet(async () => {
                        const value = (`${this.envoyCommNsrbNum} / ${this.envoyCommNsrbLevel} %`);
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication qRelays and level: ${value}`);
                        return value;
                    });
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel)
                    .onGet(async () => {
                        const value = (`${this.envoyCommPcuNum} / ${this.envoyCommPcuLevel} %`);
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication Microinverters and level: ${value}`);
                        return value;
                    });
                if (acBatteriesInstalled) {
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel)
                        .onGet(async () => {
                            const value = (`${this.envoyCommAcbNum} / ${this.envoyCommAcbLevel} %`);
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication AC Batteries and level ${value}`);
                            return value;
                        });
                }
                if (enchargesInstalled) {
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumEnchgAndLevel)
                        .onGet(async () => {
                            const value = (`${this.envoyCommEnchgNum} / ${this.envoyCommEnchgLevel} %`);
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication Encharges and level ${value}`);
                            return value;
                        });
                }
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyDbSize)
                    .onGet(async () => {
                        const value = `${this.envoyDbSize} MB / ${this.envoyDbPercentFull}`;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, data base size: ${value} %`);
                        return value;
                    });
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyTariff)
                    .onGet(async () => {
                        const value = this.envoyTariff;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, tariff: ${value}`);
                        return value;
                    });
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyUpdateStatus)
                    .onGet(async () => {
                        const value = this.envoyUpdateStatus;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, update status: ${value}`);
                        return value;
                    });
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyFirmware)
                    .onGet(async () => {
                        const value = this.envoyFirmware;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, firmware: ${value}`);
                        return value;
                    });
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyTimeZone)
                    .onGet(async () => {
                        const value = this.envoyTimeZone;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, time zone: ${value}`);
                        return value;
                    });
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime)
                    .onGet(async () => {
                        const value = `${this.envoyCurrentDate} ${this.envoyCurrentTime}`;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, current date and time: ${value}`);
                        return value;
                    });
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporDate)
                    .onGet(async () => {
                        const value = this.envoyLastEnlightenReporDate;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, last report to enlighten: ${value}`);
                        return value;
                    });
                if (enpowersInstalled) {
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyEnpowerConnected)
                        .onGet(async () => {
                            const value = this.enpowersConnected;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, enpower connected: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyEnpowerGridStatus)
                        .onGet(async () => {
                            const value = this.enpowersGridModeTranslated;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, enpower grid mode: ${value}`);
                            return value;
                        });
                }
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyGridProfile)
                    .onGet(async () => {
                        const value = this.arfProfile.name;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, grid profile: ${value}`);
                        return value;
                    });
                if (plcLevelSupported) {
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel)
                        .onGet(async () => {
                            const state = this.checkCommLevel;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, checking plc level: ${state ? `Yes` : `No`}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                const tokenExpired = this.envoyFirmware7xx ? this.envoyFirmware7xxTokenGenerationMode === 1 ? false : await this.checkJwtToken() : false;
                                const checkCommLevel = !tokenExpired && state ? await this.updatePlcLevelData() : false;
                                const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, check plc level: ${state ? `Yes` : `No`}`);
                            } catch (error) {
                                this.emit('error', `Envoy: ${serialNumber}, check plc level error: ${error}`);
                            };
                        });
                }
                if (productionPowerModeSupported) {
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyProductionPowerMode)
                        .onGet(async () => {
                            const state = this.productionPowerMode;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, production power mode: ${state ? 'Enabled' : 'Disabled'}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                const tokenExpired = this.envoyFirmware7xx ? this.envoyFirmware7xxTokenGenerationMode === 1 ? false : await this.checkJwtToken() : false;
                                const setpowerMode = !tokenExpired ? await this.setProductionPowerModeData(state) : false;
                                const debug = this.enableDebugMode ? this.emit('debug', `Envoy: ${serialNumber}, set production power mode: ${state ? 'Enabled' : 'Disabled'}`) : false;
                            } catch (error) {
                                this.emit('error', `Envoy: ${serialNumber}, set production power mode error: ${error}`);
                            };
                        });
                }

                //qrelays
                if (qRelaysInstalled) {
                    this.qRelaysServices = [];
                    for (let i = 0; i < qRelaysCount; i++) {
                        const qRelaySerialNumber = this.qRelaysSerialNumber[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Q-Relay ${qRelaySerialNumber} Service`) : false;
                        const enphaseQrelayService = accessory.addService(Service.enphaseQrelayService, `QRelay ${qRelaySerialNumber}`, `enphaseQrelayService${i}`);
                        enphaseQrelayService.setCharacteristic(Characteristic.ConfiguredName, `QRelay ${qRelaySerialNumber}`);
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayState)
                            .onGet(async () => {
                                const value = this.qRelaysRelay[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${qRelaySerialNumber}, relay state: ${value ? 'Closed' : 'Open'}`);
                                return value;
                            });
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLinesCount)
                            .onGet(async () => {
                                const value = this.qRelaysLinesCount[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${qRelaySerialNumber}, lines: ${value}`);
                                return value;
                            });
                        if (this.qRelaysLinesCount[i] > 0) {
                            enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLine1Connected)
                                .onGet(async () => {
                                    const value = this.qRelaysLine1Connected[i];
                                    const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${qRelaySerialNumber}, line 1: ${value ? 'Closed' : 'Open'}`);
                                    return value;
                                });
                        }
                        if (this.qRelaysLinesCount[i] >= 2) {
                            enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLine2Connected)
                                .onGet(async () => {
                                    const value = this.qRelaysLine2Connected[i];
                                    const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${qRelaySerialNumber}, line 2: ${value ? 'Closed' : 'Open'}`);
                                    return value;
                                });
                        }
                        if (this.qRelaysLinesCount[i] >= 3) {
                            enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLine3Connected)
                                .onGet(async () => {
                                    const value = this.qRelaysLine3Connected[i];
                                    const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${qRelaySerialNumber}, line 3: ${value ? 'Closed' : 'Open'}`);
                                    return value;
                                });
                        }
                        // enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayProducing)
                        //   .onGet(async () => {
                        //     const value = this.qRelaysProducing[i];
                        //   const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${qRelaySerialNumber}, producing: ${value ? 'Yes' : 'No'}`);
                        // return value;
                        // });
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayCommunicating)
                            .onGet(async () => {
                                const value = this.qRelaysCommunicating[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${qRelaySerialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayProvisioned)
                            .onGet(async () => {
                                const value = this.qRelaysProvisioned[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${qRelaySerialNumber}, provisioned: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayOperating)
                            .onGet(async () => {
                                const value = this.qRelaysOperating[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${qRelaySerialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        if (plcLevelSupported) {
                            enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayCommLevel)
                                .onGet(async () => {
                                    const value = this.qRelaysCommLevel[i] ?? 0;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${qRelaySerialNumber}, plc level: ${value} %`);
                                    return value;
                                });
                        }
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayStatus)
                            .onGet(async () => {
                                const value = this.qRelaysStatus[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${qRelaySerialNumber}, status: ${value}`);
                                return value;
                            });
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayFirmware)
                            .onGet(async () => {
                                const value = this.qRelaysFirmware[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${qRelaySerialNumber}, firmware: ${value}`);
                                return value;
                            });
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayLastReportDate)
                            .onGet(async () => {
                                const value = this.qRelaysLastReportDate[i] ?? '';
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${qRelaySerialNumber}, last report: ${value}`);
                                return value;
                            });
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayGridProfile)
                            .onGet(async () => {
                                const value = this.arfProfile.name;
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${qRelaySerialNumber}, grid profile: ${value}`);
                                return value;
                            });
                        this.qRelaysServices.push(enphaseQrelayService);
                    }
                }

                //meters
                if (metersSupported) {
                    this.metersServices = [];
                    for (let i = 0; i < metersCount; i++) {
                        const meterMeasurementType = this.metersMeasurementType[i];
                        const meterState = this.metersState[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Meter ${meterMeasurementType} Service`) : false;
                        const enphaseMeterService = accessory.addService(Service.enphaseMeterService, `Meter ${meterMeasurementType}`, `enphaseMeterService${i}`);
                        enphaseMeterService.setCharacteristic(Characteristic.ConfiguredName, `Meter ${meterMeasurementType}`);
                        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterState)
                            .onGet(async () => {
                                const value = meterState;
                                const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${meterMeasurementType}, state: ${value ? 'Enabled' : 'Disabled'}`);
                                return value;
                            });
                        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterPhaseMode)
                            .onGet(async () => {
                                const value = this.metersPhaseMode[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${meterMeasurementType}, phase mode: ${value}`);
                                return value;
                            });
                        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterPhaseCount)
                            .onGet(async () => {
                                const value = this.metersPhaseCount[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${meterMeasurementType}, phase count: ${value}`);
                                return value;
                            });
                        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterMeteringStatus)
                            .onGet(async () => {
                                const value = this.metersMeteringStatus[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${meterMeasurementType}, metering status: ${value}`);
                                return value;
                            });
                        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterStatusFlags)
                            .onGet(async () => {
                                const value = this.metersStatusFlags[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${meterMeasurementType}, status flag: ${value}`);
                                return value;
                            });
                        if (meterState) {
                            enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterActivePower)
                                .onGet(async () => {
                                    const value = this.activePowerSumm[i];
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${meterMeasurementType}, active power: ${value} kW`);
                                    return value;
                                });
                            enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterApparentPower)
                                .onGet(async () => {
                                    const value = this.apparentPowerSumm[i];
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${meterMeasurementType}, apparent power: ${value} kVA`);
                                    return value;
                                });
                            enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterReactivePower)
                                .onGet(async () => {
                                    const value = this.reactivePowerSumm[i];
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${meterMeasurementType}, reactive power: ${value} kVAr`);
                                    return value;
                                });
                            enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterPwrFactor)
                                .onGet(async () => {
                                    const value = this.pwrFactorSumm[i];
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${meterMeasurementType}, power factor: ${value} cos φ`);
                                    return value;
                                });
                            enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterVoltage)
                                .onGet(async () => {
                                    const value = this.voltageSumm[i];
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${meterMeasurementType}, voltage: ${value} V`);
                                    return value;
                                });
                            enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterCurrent)
                                .onGet(async () => {
                                    const value = this.currentSumm[i];
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${meterMeasurementType}, current: ${value} A`);
                                    return value;
                                });
                            enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterFreq)
                                .onGet(async () => {
                                    const value = this.freqSumm[i];
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${meterMeasurementType}, frequency: ${value} Hz`);
                                    return value;
                                });
                            enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterReadingTime)
                                .onGet(async () => {
                                    const value = this.timestampSumm[i] ?? '';
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${meterMeasurementType}, last report: ${value}`);
                                    return value;
                                });
                        }
                        this.metersServices.push(enphaseMeterService);
                    }
                }

                //production
                const debug4 = this.enableDebugMode ? this.emit('debug', `Prepare Production Power And Energy Service`) : false;
                this.productionsService = accessory.addService(Service.enphasePowerAndEnergyService, `Production Power And Energy`, 'enphaseProductionService');
                this.productionsService.setCharacteristic(Characteristic.ConfiguredName, `Production Power And Energy`);
                this.productionsService.getCharacteristic(Characteristic.enphasePower)
                    .onGet(async () => {
                        const value = this.productionPower;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production power: ${value} kW`);
                        return value;
                    });
                this.productionsService.getCharacteristic(Characteristic.enphasePowerMax)
                    .onGet(async () => {
                        const value = this.productionPowerPeak;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production power peak: ${value} kW`);
                        return value;
                    });
                this.productionsService.getCharacteristic(Characteristic.enphasePowerMaxDetected)
                    .onGet(async () => {
                        const value = this.productionPowerPeakDetected;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production power peak detected: ${value ? 'Yes' : 'No'}`);
                        return value;
                    });
                this.productionsService.getCharacteristic(Characteristic.enphaseEnergyToday)
                    .onGet(async () => {
                        const value = this.productionEnergyToday;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production energy today: ${value} kWh`);
                        return value;
                    });
                this.productionsService.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
                    .onGet(async () => {
                        const value = this.productionEnergyLastSevenDays;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production energy last seven days: ${value} kWh`);
                        return value;
                    });
                this.productionsService.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
                    .onGet(async () => {
                        const value = this.productionEnergyLifeTime;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production energy lifetime: ${value} kWh`);
                        return value;
                    });
                if (metersSupported && metersProductionEnabled) {
                    this.productionsService.getCharacteristic(Characteristic.enphaseRmsCurrent)
                        .onGet(async () => {
                            const value = this.productionRmsCurrent;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production current: ${value} A`);
                            return value;
                        });
                    this.productionsService.getCharacteristic(Characteristic.enphaseRmsVoltage)
                        .onGet(async () => {
                            const value = this.productionRmsVoltage;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production voltage: ${value} V`);
                            return value;
                        });
                    this.productionsService.getCharacteristic(Characteristic.enphaseReactivePower)
                        .onGet(async () => {
                            const value = this.productionReactivePower;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production net reactive power: ${value} kVAr`);
                            return value;
                        });
                    this.productionsService.getCharacteristic(Characteristic.enphaseApparentPower)
                        .onGet(async () => {
                            const value = this.productionApparentPower;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production net apparent power: ${value} kVA`);
                            return value;
                        });
                    this.productionsService.getCharacteristic(Characteristic.enphasePwrFactor)
                        .onGet(async () => {
                            const value = this.productionPwrFactor;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production power factor: ${value} cos φ`);
                            return value;
                        });
                }
                this.productionsService.getCharacteristic(Characteristic.enphaseReadingTime)
                    .onGet(async () => {
                        const value = this.productionReadingTime;
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
                            const write = state ? this.productionPowerPeak = 0 : false;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production power peak reset: On`);
                            this.productionsService.updateCharacteristic(Characteristic.enphasePowerMaxReset, false);
                        } catch (error) {
                            this.emit('error', `Production Power Peak reset error: ${error}`);
                        };
                    });

                //production state sensor service
                if (this.powerProductionStateActiveSensorsCount > 0) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Production Power State Sensor Service`) : false;
                    this.powerProductionStateSensorsService = [];
                    for (let i = 0; i < this.powerProductionStateActiveSensorsCount; i++) {
                        const sensorName = this.powerProductionStateActiveSensors[i].name;
                        const serviceType = this.powerProductionStateActiveSensors[i].serviceType;
                        const characteristicType = this.powerProductionStateActiveSensors[i].characteristicType;
                        const powerProductionStateSensorService = accessory.addService(serviceType, sensorName, `powerProductionStateSensorService`);
                        powerProductionStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        powerProductionStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                        powerProductionStateSensorService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.powerProductionStateActiveSensors[i].state;
                                const info = this.disableLogInfo ? false : this.emit('message', `Production power state sensor: ${state ? 'Active' : 'Not active'}`);
                                return state;
                            });
                        this.powerProductionStateSensorsService.push(powerProductionStateSensorService);
                    };
                };

                //production power level sensors service
                if (this.powerProductionLevelActiveSensorsCount > 0) {
                    this.powerProductionLevelSensorsService = [];
                    for (let i = 0; i < this.powerProductionLevelActiveSensorsCount; i++) {
                        const sensorName = this.powerProductionLevelActiveSensors[i].name;
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
                        this.powerProductionLevelSensorsService.push(powerProductionLevelSensorsService);
                    };
                };

                //production energy state sensor service
                if (this.energyProductionStateActiveSensorsCount > 0) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Production Energy State Sensor Service`) : false;
                    this.energyProductionStateSensorsService = [];
                    for (let i = 0; i < this.energyProductionStateActiveSensorsCount; i++) {
                        const sensorName = this.energyProductionStateActiveSensors[i].name;
                        const serviceType = this.energyProductionStateActiveSensors[i].serviceType;
                        const characteristicType = this.energyProductionStateActiveSensors[i].characteristicType;
                        const energyProductionStateSensorService = accessory.addService(serviceType, sensorName, `energyProductionStateSensorService`);
                        energyProductionStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        energyProductionStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                        energyProductionStateSensorService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const state = this.energyProductionStateActiveSensors[i].state;
                                const info = this.disableLogInfo ? false : this.emit('message', `Production energy state sensor: ${state ? 'Active' : 'Not active'}`);
                                return state;
                            });
                        this.energyProductionStateSensorsService.push(energyProductionStateSensorService);
                    };
                };

                //production energy level sensor service
                if (this.energyProductionLevelActiveSensorsCount > 0) {
                    this.energyProductionLevelSensorsService = [];
                    for (let i = 0; i < this.energyProductionLevelActiveSensorsCount; i++) {
                        const sensorName = this.energyProductionLevelActiveSensors[i].name;
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
                        this.energyProductionLevelSensorsService.push(energyProductionLevelSensorsService);
                    };
                };

                //power and energy consumption
                if (metersSupported && metersConsumptionEnabled) {
                    this.consumptionsServices = [];
                    for (let i = 0; i < consumptionsCount; i++) {
                        const consumptionMeasurmentType = this.consumptionsMeasurmentType[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Power And Energy Service`) : false;
                        const enphaseConsumptionService = accessory.addService(Service.enphasePowerAndEnergyService, `${consumptionMeasurmentType} Power And Energy`, `enphaseConsumptionService${i}`);
                        enphaseConsumptionService.setCharacteristic(Characteristic.ConfiguredName, `${consumptionMeasurmentType} Power And Energy`);
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePower)
                            .onGet(async () => {
                                const value = this.consumptionsPower[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power: ${value} kW`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePowerMax)
                            .onGet(async () => {
                                const value = this.consumptionsPowerPeak[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power peak: ${value} kW`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePowerMaxDetected)
                            .onGet(async () => {
                                const value = this.consumptionsPowerPeakDetected[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power peak detected: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyToday)
                            .onGet(async () => {
                                const value = this.consumptionsEnergyToday[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} energy today: ${value} kWh`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
                            .onGet(async () => {
                                const value = this.consumptionsEnergyLastSevenDays[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} energy last seven days: ${value} kWh`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
                            .onGet(async () => {
                                const value = this.consumptionsEnergyLifeTime[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} energy lifetime: ${value} kWh`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseRmsCurrent)
                            .onGet(async () => {
                                const value = this.consumptionsRmsCurrent[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} current: ${value} A`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseRmsVoltage)
                            .onGet(async () => {
                                const value = this.consumptionsRmsVoltage[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} voltage: ${value} V`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseReactivePower)
                            .onGet(async () => {
                                const value = this.consumptionsReactivePower[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} reactive power: ${value} kVAr`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseApparentPower)
                            .onGet(async () => {
                                const value = this.consumptionsApparentPower[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePwrFactor)
                            .onGet(async () => {
                                const value = this.consumptionsPwrFactor[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power factor: ${value} cos φ`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseReadingTime)
                            .onGet(async () => {
                                const value = this.consumptionsReadingTime[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} last report: ${value}`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePowerMaxReset)
                            .onGet(async () => {
                                const state = false;
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power peak reset: Off`);
                                return state;
                            })
                            .onSet(async (state) => {
                                try {
                                    const write = state ? this.consumptionsPowerPeak[i] = 0 : false;
                                    const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power peak reset: On`);
                                    enphaseConsumptionService.updateCharacteristic(Characteristic.enphasePowerMaxReset, false);
                                } catch (error) {
                                    this.emit('error', `${consumptionMeasurmentType}, power peak reset error: ${error}`);
                                };
                            });
                        this.consumptionsServices.push(enphaseConsumptionService);

                        //total
                        if (i === 0) {
                            //consumption total state sensor service
                            if (this.powerConsumptionTotalStateActiveSensorsCount > 0) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Power State Sensor Service`) : false;
                                this.powerConsumptionTotalStateSensorsService = [];
                                for (let i = 0; i < this.powerConsumptionTotalStateActiveSensorsCount; i++) {
                                    const sensorName = this.powerConsumptionTotalStateActiveSensors[i].name;
                                    const serviceType = this.powerConsumptionTotalStateActiveSensors[i].serviceType;
                                    const characteristicType = this.powerConsumptionTotalStateActiveSensors[i].characteristicType;
                                    const powerConsumptionTotalStateSensorService = accessory.addService(serviceType, sensorName, `powerConsumptionTotalStateSensorService`);
                                    powerConsumptionTotalStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    powerConsumptionTotalStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    powerConsumptionTotalStateSensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.powerConsumptionTotalStateActiveSensors[i].state;
                                            const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power state sensor: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.powerConsumptionTotalStateSensorsService.push(powerConsumptionTotalStateSensorService);
                                };
                            };

                            //consumption total power peak sensors service
                            if (this.powerConsumptionTotalLevelActiveSensorsCount > 0) {
                                this.powerConsumptionTotalLevelSensorsService = [];
                                for (let i = 0; i < this.powerConsumptionTotalLevelActiveSensorsCount; i++) {
                                    const sensorName = this.powerConsumptionTotalLevelActiveSensors[i].name;
                                    const serviceType = this.powerConsumptionTotalLevelActiveSensors[i].serviceType;
                                    const characteristicType = this.powerConsumptionTotalLevelActiveSensors[i].characteristicType;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Power Level ${sensorName} Sensor Service`) : false;
                                    const powerConsumptionTotalLevelSensorsService = accessory.addService(serviceType, sensorName, `powerConsumptionTotalLevelSensorsService${i}`);
                                    powerConsumptionTotalLevelSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    powerConsumptionTotalLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    powerConsumptionTotalLevelSensorsService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.powerConsumptionTotalLevelActiveSensors[i].state;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Consumption total power level sensor: ${sensorName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.powerConsumptionTotalLevelSensorsService.push(powerConsumptionTotalLevelSensorsService);
                                };
                            };

                            //consumption total energy state sensor service
                            if (this.energyConsumptionTotalStateActiveSensorsCount > 0) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Energy State Sensor Service`) : false;
                                this.energyConsumptionTotalStateSensorsService = [];
                                for (let i = 0; i < this.energyConsumptionTotalStateActiveSensorsCount; i++) {
                                    const sensorName = this.energyConsumptionTotalStateActiveSensors[i].name;
                                    const serviceType = this.energyConsumptionTotalStateActiveSensors[i].serviceType;
                                    const characteristicType = this.energyConsumptionTotalStateActiveSensors[i].characteristicType;
                                    const energyConsumptionTotalStateSensorService = accessory.addService(serviceType, sensorName, `energyConsumptionTotalStateSensorService`);
                                    energyConsumptionTotalStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    energyConsumptionTotalStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    energyConsumptionTotalStateSensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.energyConsumptionTotalStateActiveSensors[i].state;
                                            const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} energy state sensor: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.energyConsumptionTotalStateSensorsService.push(energyConsumptionTotalStateSensorService);
                                };
                            };

                            //consumption total energy level sensor service
                            if (this.energyConsumptionTotalLevelActiveSensorsCount > 0) {
                                this.energyConsumptionTotalLevelSensorsService = [];
                                for (let i = 0; i < this.energyConsumptionTotalLevelActiveSensorsCount; i++) {
                                    const sensorName = this.energyConsumptionTotalLevelActiveSensors[i].name;
                                    const serviceType = this.energyConsumptionTotalLevelActiveSensors[i].serviceType;
                                    const characteristicType = this.energyConsumptionTotalLevelActiveSensors[i].characteristicType;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Energy Level ${sensorName} Sensor Service`) : false;
                                    const energyConsumptionTotalLevelSensorsService = accessory.addService(serviceType, sensorName, `energyConsumptionTotalLevelSensorsService${i}`);
                                    energyConsumptionTotalLevelSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    energyConsumptionTotalLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    energyConsumptionTotalLevelSensorsService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.energyConsumptionTotalLevelActiveSensors[i].state;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Consumption total energy level sensor: ${sensorName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.energyConsumptionTotalLevelSensorsService.push(energyConsumptionTotalLevelSensorsService);
                                };
                            };
                        };

                        //net
                        if (i === 1) {
                            //consumption total state sensor service
                            if (this.powerConsumptionNetStateActiveSensorsCount > 0) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Power State Sensor Service`) : false;
                                this.powerConsumptionNetStateSensorsService = [];
                                for (let i = 0; i < this.powerConsumptionNetStateActiveSensorsCount; i++) {
                                    const sensorName = this.powerConsumptionNetStateActiveSensors[i].name;
                                    const serviceType = this.powerConsumptionNetStateActiveSensors[i].serviceType;
                                    const characteristicType = this.powerConsumptionNetStateActiveSensors[i].characteristicType;
                                    const powerConsumptionNetStateSensorService = accessory.addService(serviceType, sensorName, `powerConsumptionNetStateSensorService`);
                                    powerConsumptionNetStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    powerConsumptionNetStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    powerConsumptionNetStateSensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.powerConsumptionNetStateActiveSensors[i].state;
                                            const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power state sensor: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.powerConsumptionNetStateSensorsService.push(powerConsumptionNetStateSensorService);
                                };
                            };

                            //consumption net power peak sensor service
                            if (this.powerConsumptionNetLevelActiveSensorsCount > 0) {
                                this.powerConsumptionNetLevelSensorsService = [];
                                for (let i = 0; i < this.powerConsumptionNetLevelActiveSensorsCount; i++) {
                                    const sensorName = this.powerConsumptionNetLevelActiveSensors[i].name;
                                    const serviceType = this.powerConsumptionNetLevelActiveSensors[i].serviceType;
                                    const characteristicType = this.powerConsumptionNetLevelActiveSensors[i].characteristicType;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Power Level ${sensorName} Sensor Service`) : false;
                                    const powerConsumptionNetLevelSensorsService = accessory.addService(serviceType, sensorName, `powerConsumptionNetLevelSensorsService${i}`);
                                    powerConsumptionNetLevelSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    powerConsumptionNetLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    powerConsumptionNetLevelSensorsService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.powerConsumptionNetLevelActiveSensors[i].state ?? false;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Consumption net power level sensor: ${sensorName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.powerConsumptionNetLevelSensorsService.push(powerConsumptionNetLevelSensorsService);
                                };
                            };

                            //consumption net energy state sensor service
                            if (this.energyConsumptionNetStateActiveSensorsCount > 0) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Energy State Sensor Service`) : false;
                                this.energyConsumptionNetStateSensorsService = [];
                                for (let i = 0; i < this.energyConsumptionNetStateActiveSensorsCount; i++) {
                                    const sensorName = this.energyConsumptionNetStateActiveSensors[i].name;
                                    const serviceType = this.energyConsumptionNetStateActiveSensors[i].serviceType;
                                    const characteristicType = this.energyConsumptionNetStateActiveSensors[i].characteristicType;
                                    const energyConsumptionNetStateSensorService = accessory.addService(serviceType, sensorName, `energyConsumptionNetStateSensorService`);
                                    energyConsumptionNetStateSensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    energyConsumptionNetStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    energyConsumptionNetStateSensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.energyConsumptionNetStateActiveSensors[i].state;
                                            const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} energy state sensor: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.energyConsumptionNetStateSensorsService.push(energyConsumptionNetStateSensorService);
                                };
                            };

                            if (this.energyConsumptionNetLevelActiveSensorsCount > 0) {
                                this.energyConsumptionNetLevelSensorsService = [];
                                for (let i = 0; i < this.energyConsumptionNetLevelActiveSensorsCount; i++) {
                                    const sensorName = this.energyConsumptionNetLevelActiveSensors[i].name;
                                    const serviceType = this.energyConsumptionNetLevelActiveSensors[i].serviceType;
                                    const characteristicType = this.energyConsumptionNetLevelActiveSensors[i].characteristicType;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Energy Level ${sensorName} Sensor Service`) : false;
                                    const energyConsumptionNetLevelSensorsService = accessory.addService(serviceType, sensorName, `energyConsumptionNetLevelSensorsService${i}`);
                                    energyConsumptionNetLevelSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    energyConsumptionNetLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    energyConsumptionNetLevelSensorsService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const state = this.energyConsumptionNetLevelActiveSensors[i].state ?? false;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Consumption net energy level sensor: ${sensorName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.energyConsumptionNetLevelSensorsService.push(energyConsumptionNetLevelSensorsService);
                                };
                            };
                        };
                    }
                }

                //ac batteries summary
                if (acBatteriesInstalled) {
                    //ac batteries summary level and state
                    const debug2 = this.enableDebugMode ? this.emit('debug', `Prepare AC Batteries Summary Service`) : false;
                    this.enphaseAcBatterieSummaryLevelAndStateService = accessory.addService(Service.Lightbulb, `AC Batteries`, `enphaseAcBatterieSummaryLevelAndStateService`);
                    this.enphaseAcBatterieSummaryLevelAndStateService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                    this.enphaseAcBatterieSummaryLevelAndStateService.setCharacteristic(Characteristic.ConfiguredName, `AC Batteries`);
                    this.enphaseAcBatterieSummaryLevelAndStateService.getCharacteristic(Characteristic.On)
                        .onGet(async () => {
                            const state = this.acBatteriesSummaryEnergyState;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries energy state: ${state ? 'Charged' : 'Discharged'}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                this.enphaseAcBatterieSummaryLevelAndStateService.updateCharacteristic(Characteristic.On, this.acBatteriesSummaryEnergyState);
                            } catch (error) {
                                this.emit('error', `envoy: ${serialNumber}, set AC Batteries energy  state error: ${error}`);
                            };
                        })
                    this.enphaseAcBatterieSummaryLevelAndStateService.getCharacteristic(Characteristic.Brightness)
                        .onGet(async () => {
                            const state = this.acBatteriesSummaryPercentFull;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries energy level: ${this.acBatteriesSummaryPercentFull} %`);
                            return state;
                        })
                        .onSet(async (value) => {
                            try {
                                this.enphaseAcBatterieSummaryLevelAndStateService.updateCharacteristic(Characteristic.Brightness, this.acBatteriesSummaryPercentFull);
                            } catch (error) {
                                this.emit('error', `envoy: ${serialNumber}, set AC Batteries energy level error: ${error}`);
                            };
                        })

                    //ac batteries summary service
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare AC Batteries Summary Service`) : false;
                    this.acBatteriesSummaryService = accessory.addService(Service.enphaseAcBatterieSummaryService, 'AC Batteries Summary', 'enphaseAcBatterieSummaryService');
                    this.acBatteriesSummaryService.setCharacteristic(Characteristic.ConfiguredName, `AC Batteries Summary`);
                    this.acBatteriesSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryPower)
                        .onGet(async () => {
                            const value = this.acBatteriesSummaryPower;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries storage power: ${value} kW`);
                            return value;
                        });
                    this.acBatteriesSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryEnergy)
                        .onGet(async () => {
                            const value = this.acBatteriesSummaryEnergy;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries storage energy: ${value} kWh`);
                            return value;
                        });
                    this.acBatteriesSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryPercentFull)
                        .onGet(async () => {
                            const value = this.acBatteriesSummaryPercentFull;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries percent full: ${value}`);
                            return value;
                        });
                    this.acBatteriesSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryActiveCount)
                        .onGet(async () => {
                            const value = this.acBatteriesSummaryActiveCount;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries devices count: ${value}`);
                            return value;
                        });
                    this.acBatteriesSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryState)
                        .onGet(async () => {
                            const value = this.acBatteriesSummaryState;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries state: ${value}`);
                            return value;
                        });
                    this.acBatteriesSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryReadingTime)
                        .onGet(async () => {
                            const value = this.acBatteriesSummaryReadingTime || '';
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries last report: ${value}`);
                            return value;
                        });

                    //ac batteries state
                    this.acBatteriesServices = [];
                    for (let i = 0; i < acBatteriesCount; i++) {
                        const acBatterieSerialNumber = this.acBatteriesSerialNumber[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare AC Batterie ${acBatterieSerialNumber} Service`) : false;
                        const enphaseAcBatterieService = accessory.addService(Service.enphaseAcBatterieService, `AC Batterie ${acBatterieSerialNumber}`, `enphaseAcBatterieService${i}`);
                        enphaseAcBatterieService.setCharacteristic(Characteristic.ConfiguredName, `AC Batterie ${acBatterieSerialNumber}`);
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieChargeStatus)
                            .onGet(async () => {
                                const value = this.acBatteriesChargeStatus[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${acBatterieSerialNumber} charge status ${value}`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieProducing)
                            .onGet(async () => {
                                const value = this.acBatteriesProducing[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${acBatterieSerialNumber} producing: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieCommunicating)
                            .onGet(async () => {
                                const value = this.acBatteriesCommunicating[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${acBatterieSerialNumber} communicating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieProvisioned)
                            .onGet(async () => {
                                const value = this.acBatteriesProvisioned[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${acBatterieSerialNumber} provisioned: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieOperating)
                            .onGet(async () => {
                                const value = this.acBatteriesOperating[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${acBatterieSerialNumber} operating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        if (plcLevelSupported) {
                            enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieCommLevel)
                                .onGet(async () => {
                                    const value = this.acBatteriesCommLevel[i] ?? 0;
                                    const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${acBatterieSerialNumber} plc level: ${value} %`);
                                    return value;
                                });
                        }
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieSleepEnabled)
                            .onGet(async () => {
                                const value = this.acBatteriesSleepEnabled[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${acBatterieSerialNumber} sleep: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatteriePercentFull)
                            .onGet(async () => {
                                const value = this.acBatteriesPercentFull[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${acBatterieSerialNumber} percent full: ${value} %`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieMaxCellTemp)
                            .onGet(async () => {
                                const value = this.acBatteriesMaxCellTemp[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${acBatterieSerialNumber} max cell temp: ${value} °C`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieSleepMinSoc)
                            .onGet(async () => {
                                const value = this.acBatteriesSleepMinSoc[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${acBatterieSerialNumber} sleep min soc: ${value} min`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieSleepMaxSoc)
                            .onGet(async () => {
                                const value = this.acBatteriesSleepMaxSoc[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${acBatterieSerialNumber} sleep max soc: ${value} min`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieStatus)
                            .onGet(async () => {
                                const value = this.acBatteriesStatus[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${acBatterieSerialNumber} status: ${value}`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieFirmware)
                            .onGet(async () => {
                                const value = this.acBatteriesFirmware[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${acBatterieSerialNumber} firmware: ${value}`);
                                return value;
                            });
                        enphaseAcBatterieService.getCharacteristic(Characteristic.enphaseAcBatterieLastReportDate)
                            .onGet(async () => {
                                const value = this.acBatteriesLastReportDate[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `AC Batterie: ${acBatterieSerialNumber} last report: ${value}`);
                                return value;
                            });
                        this.acBatteriesServices.push(enphaseAcBatterieService);
                    }
                }

                //microinverters
                if (microinvertersInstalled) {
                    this.microinvertersServices = [];
                    for (let i = 0; i < microinvertersCount; i++) {
                        const microinverterSerialNumber = this.microinvertersSerialNumber[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Microinverter ${microinverterSerialNumber} Service`) : false;
                        const enphaseMicroinverterService = accessory.addService(Service.enphaseMicroinverterService, `Microinverter ${microinverterSerialNumber}`, `enphaseMicroinverterService${i}`);
                        enphaseMicroinverterService.setCharacteristic(Characteristic.ConfiguredName, `Microinverter ${microinverterSerialNumber}`);
                        if (microinvertersPowerSupported) {
                            enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterPower)
                                .onGet(async () => {
                                    let value = this.microinvertersLastPower[i] ?? 0;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${microinverterSerialNumber}, last power: ${value} W`);
                                    return value;
                                });
                            enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterPowerMax)
                                .onGet(async () => {
                                    const value = this.microinvertersMaxPower[i] ?? 0;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${microinverterSerialNumber}, peak power: ${value} W`);
                                    return value;
                                });
                        }
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterProducing)
                            .onGet(async () => {
                                const value = this.microinvertersProducing[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${microinverterSerialNumber}, producing: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterCommunicating)
                            .onGet(async () => {
                                const value = this.microinvertersCommunicating[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${microinverterSerialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterProvisioned)
                            .onGet(async () => {
                                const value = this.microinvertersProvisioned[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${microinverterSerialNumber}, provisioned: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterOperating)
                            .onGet(async () => {
                                const value = this.microinvertersOperating[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${microinverterSerialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        if (plcLevelSupported) {
                            enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterCommLevel)
                                .onGet(async () => {
                                    const value = this.microinvertersCommLevel[i] ?? 0;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${microinverterSerialNumber}, plc level: ${value} %`);
                                    return value;
                                });
                        }
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterStatus)
                            .onGet(async () => {
                                const value = this.microinvertersStatus[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${microinverterSerialNumber}, status: ${value}`);
                                return value;
                            });
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterFirmware)
                            .onGet(async () => {
                                const value = this.microinvertersFirmware[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${microinverterSerialNumber}, firmware: ${value}`);
                                return value;
                            });
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterLastReportDate)
                            .onGet(async () => {
                                const value = microinvertersPowerSupported ? this.microinvertersReadingTime[i] : this.microinvertersLastReportDate[i] || '';
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${microinverterSerialNumber}, last report: ${value}`);
                                return value;
                            });
                        enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterGridProfile)
                            .onGet(async () => {
                                const value = this.arfProfile.name;
                                const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${microinverterSerialNumber}, grid profile: ${value}`);
                                return value;
                            });
                        this.microinvertersServices.push(enphaseMicroinverterService);
                    }
                }

                //ensembles
                if (ensemblesInstalled) {
                    this.ensemblesServices = [];
                    for (let i = 0; i < ensemblesCount; i++) {
                        const ensembleSerialNumber = this.ensemblesSerialNumber[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Ensemble ${ensembleSerialNumber} Service`) : false;
                        const enphaseEnsembleService = accessory.addService(Service.enphaseEnsembleService, `Ensemble ${ensembleSerialNumber}`, `enphaseEnsembleService${i}`);
                        enphaseEnsembleService.setCharacteristic(Characteristic.ConfiguredName, `Ensemble ${ensembleSerialNumber}`);
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEnsembleProducing)
                            .onGet(async () => {
                                const value = this.ensemblesProducing[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${ensembleSerialNumber}, producing: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEnsembleCommunicating)
                            .onGet(async () => {
                                const value = this.ensemblesCommunicating[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${ensembleSerialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEnsembleOperating)
                            .onGet(async () => {
                                const value = this.ensemblesOperating[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${ensembleSerialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            })
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEnsembleStatus)
                            .onGet(async () => {
                                const value = this.ensemblesStatus[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${ensembleSerialNumber}, status: ${value}`);
                                return value;
                            });
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEnsembleFirmware)
                            .onGet(async () => {
                                const value = this.ensemblesFirmware[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${ensembleSerialNumber}, firmware: ${value}`);
                                return value;
                            });
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEnsembleLastReportDate)
                            .onGet(async () => {
                                const value = this.ensemblesLastReportDate[i] ?? '';
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${ensembleSerialNumber}, last report: ${value}`);
                                return value;
                            });

                        this.ensemblesServices.push(enphaseEnsembleService);
                    }
                }

                //ensembles status summary
                if (ensembleStatusSupported) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Ensemble Summary Service`) : false;
                    this.ensembleStatusService = accessory.addService(Service.enphaseEnsembleStatusService, `Ensemble summary`, 'enphaseEnsembleStatusService');
                    this.ensembleStatusService.setCharacteristic(Characteristic.ConfiguredName, `Ensemble summary`);
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusRestPower)
                        .onGet(async () => {
                            const value = this.ensembleRestPower;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, rest power: ${value} kW`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHz)
                        .onGet(async () => {
                            const value = this.ensembleFreqBiasHz;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L1 bias frequency: ${value} Hz`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasV)
                        .onGet(async () => {
                            const value = this.ensembleVoltageBiasV;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L1 bias voltage: ${value} V`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8)
                        .onGet(async () => {
                            const value = this.ensembleFreqBiasHzQ8;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L1 bias q8 frequency: ${value} Hz`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5)
                        .onGet(async () => {
                            const value = this.ensembleVoltageBiasVQ5;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L1 bias q5 voltage: ${value} V`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzPhaseB)
                        .onGet(async () => {
                            const value = this.ensembleFreqBiasHzPhaseB;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L2 bias frequency: ${value} Hz`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVPhaseB)
                        .onGet(async () => {
                            const value = this.ensembleVoltageBiasVPhaseB;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L2 bias voltage: ${value} V`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8PhaseB)
                        .onGet(async () => {
                            const value = this.ensembleFreqBiasHzQ8PhaseB;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L2 bias q8 frequency: ${value} Hz`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5PhaseB)
                        .onGet(async () => {
                            const value = this.ensembleVoltageBiasVQ5PhaseB;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L2 bias q5 voltage: ${value} V`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzPhaseC)
                        .onGet(async () => {
                            const value = this.ensembleFreqBiasHzPhaseC;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L3 bias frequency: ${value} Hz`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVPhaseC)
                        .onGet(async () => {
                            const value = this.ensembleVoltageBiasVPhaseC;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L3 bias voltage: ${value} V`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8PhaseC)
                        .onGet(async () => {
                            const value = this.ensembleFreqBiasHzQ8PhaseC;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L3 bias q8 frequency: ${value} Hz`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5PhaseC)
                        .onGet(async () => {
                            const value = this.ensembleVoltageBiasVQ5PhaseC;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L3 bias q5 voltage: ${value} V`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusConfiguredBackupSoc)
                        .onGet(async () => {
                            const value = this.ensembleConfiguredBackupSoc;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, configured backup SoC: ${value} %`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusAdjustedBackupSoc)
                        .onGet(async () => {
                            const value = this.ensembleAdjustedBackupSoc;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, adjusted backup SoC: ${value} %`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusAggSoc)
                        .onGet(async () => {
                            const value = this.ensembleAggSoc;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, agg SoC: ${value} %`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusAggMaxEnergy)
                        .onGet(async () => {
                            const value = this.ensembleAggMaxEnergy;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, agg max energy: ${value} kWh`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusEncAggSoc)
                        .onGet(async () => {
                            const value = this.ensembleEncAggSoc;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, encharges agg SoC: ${value} %`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusEncAggRatedPower)
                        .onGet(async () => {
                            const value = this.enchargesRatedPowerSum;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, encharges agg rated power: ${value} kW`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusEncAggBackupEnergy)
                        .onGet(async () => {
                            const value = this.ensembleEncAggBackupEnergy;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, encharges agg backup energy: ${value} kWh`);
                            return value;
                        });
                    this.ensembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusEncAggAvailEnergy)
                        .onGet(async () => {
                            const value = this.ensembleEncAggAvailEnergy;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, encharges agg available energy: ${value} kWh`);
                            return value;
                        });

                    //encharge grid mode sensor services
                    if (this.enchargeGridModeActiveSensorsCount > 0) {
                        this.enchargeGridModeSensorsServices = [];
                        for (let i = 0; i < this.enchargeGridModeActiveSensorsCount; i++) {
                            const sensorName = this.enchargeGridModeActiveSensors[i].name;
                            const serviceType = this.enchargeGridModeActiveSensors[i].serviceType;
                            const characteristicType = this.enchargeGridModeActiveSensors[i].characteristicType;
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare Encharge Grid Mode Sensor ${sensorName} Service`) : false;
                            const enchargeGridModeSensorsService = accessory.addService(serviceType, sensorName, `enchargeGridModeSensorService${i}`);
                            enchargeGridModeSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            enchargeGridModeSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                            enchargeGridModeSensorsService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.enchargeGridModeActiveSensors[i].state;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge grid mode sensor: ${sensorName} state: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.enchargeGridModeSensorsServices.push(enchargeGridModeSensorsService);
                        };
                    };

                    //encharge backup level sensor services
                    if (this.enchargeBackupLevelActiveSensorsCount > 0) {
                        this.enchargeBackupLevelSensorsServices = [];
                        for (let i = 0; i < this.enchargeBackupLevelActiveSensorsCount; i++) {
                            const sensorName = this.enchargeBackupLevelActiveSensors[i].name;
                            const serviceType = this.enchargeBackupLevelActiveSensors[i].serviceType;
                            const characteristicType = this.enchargeBackupLevelActiveSensors[i].characteristicType;
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare Encharge Backup Level Sensor ${sensorName} Service`) : false;
                            const enchargeBackupLevelSensorsService = accessory.addService(serviceType, sensorName, `enchargeBackupLevelSensorService${i}`);
                            enchargeBackupLevelSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            enchargeBackupLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                            enchargeBackupLevelSensorsService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.enchargeBackupLevelActiveSensors[i].state;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge Backup Level sensor: ${sensorName} state: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.enchargeBackupLevelSensorsServices.push(enchargeBackupLevelSensorsService);
                        };
                    };

                    //solar grid mode sensor services
                    if (this.solarGridModeActiveSensorsCount > 0) {
                        this.solarGridModeSensorsServices = [];
                        for (let i = 0; i < this.solarGridModeActiveSensorsCount; i++) {
                            const sensorName = this.solarGridModeActiveSensors[i].name;
                            const serviceType = this.solarGridModeActiveSensors[i].serviceType;
                            const characteristicType = this.solarGridModeActiveSensors[i].characteristicType;
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare Solar Grid Mode Sensor ${sensorName} Service`) : false;
                            const solarGridModeSensorsService = accessory.addService(serviceType, sensorName, `solarGridModeSensorService${i}`);
                            solarGridModeSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            solarGridModeSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                            solarGridModeSensorsService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.solarGridModeActiveSensors[i].state;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Solar grid mode sensor: ${sensorName} state: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.solarGridModeSensorsServices.push(solarGridModeSensorsService);
                        };
                    };

                    //encharge profile service
                    if (this.supportEnchargeProfile) {
                        //self consumption
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Encharge Profile Self Consumption Service`) : false;
                        this.enchargeProfileSelfConsumptionServices = [];
                        const enchargeProfileSelfConsumptionService = accessory.addService(Service.Lightbulb, accessoryName, `enchargeProfileSelfConsumptionService`);
                        enchargeProfileSelfConsumptionService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        enchargeProfileSelfConsumptionService.setCharacteristic(Characteristic.ConfiguredName, 'Self Consumption');
                        enchargeProfileSelfConsumptionService.getCharacteristic(Characteristic.On)
                            .onGet(async () => {
                                const state = false;
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge profile self consumption: ${state ? 'Active' : 'Not Active'}`);
                                return state;
                            })
                            .onSet(async (state) => {
                                try {
                                    // const setProfile = state ? await this.setEnchargeProfile('self-consumption') : false;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Encharge set profile: Self Consumption`) : false;
                                } catch (error) {
                                    this.emit('error', `Encharge set profile self consumption error: ${error}`);
                                };
                            })
                        enchargeProfileSelfConsumptionService.getCharacteristic(Characteristic.Brightness)
                            .onGet(async () => {
                                const value = this.ensembleConfiguredBackupSoc;
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge profile self consumption reserve: ${value} %`);
                                return value;
                            })
                            .onSet(async (value) => {
                                if (value === 0 || value === 100) {
                                    return;
                                }

                                try {
                                    //const setProfileReserve = await this.setEnchargeProfile('self-consumption', value);
                                    const debug = this.enableDebugMode ? this.emit('debug', `Encharge set profile self consumption reserve: ${value} %`) : false;
                                } catch (error) {
                                    this.emit('error', `Encharge set profile self consumption reserve error: ${error}`);
                                };
                            })
                        this.enchargeProfileSelfConsumptionServices.push(enchargeProfileSelfConsumptionService);

                        //savings
                        const debug1 = this.enableDebugMode ? this.emit('debug', `Prepare Encharge Profile Savings Service`) : false;
                        this.enchargeProfileSavingsServices = [];
                        const enchargeProfileSavingsService = accessory.addService(Service.Lightbulb, accessoryName, `enchargeProfileSavingsService`);
                        enchargeProfileSavingsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        enchargeProfileSavingsService.setCharacteristic(Characteristic.ConfiguredName, 'Savings');
                        enchargeProfileSavingsService.getCharacteristic(Characteristic.On)
                            .onGet(async () => {
                                const state = false;
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge profile savings: ${state ? 'Active' : 'Not Active'}`);
                                return state;
                            })
                            .onSet(async (state) => {
                                try {
                                    //const setProfile = state ? await this.setEnchargeProfile('savings') : false;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Encharge set profile: Savings`) : false;
                                } catch (error) {
                                    this.emit('error', `Encharge set profile savings error: ${error}`);
                                };
                            })
                        enchargeProfileSavingsService.getCharacteristic(Characteristic.Brightness)
                            .onGet(async () => {
                                const value = this.ensembleConfiguredBackupSoc;
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge profile savings reserve: ${value} %`);
                                return value;
                            })
                            .onSet(async (value) => {
                                if (value === 0 || value === 100) {
                                    return;
                                }

                                try {
                                    //const setProfileReserve = await this.setEnchargeProfile('savings', value);
                                    const debug = this.enableDebugMode ? this.emit('debug', `Encharge set profile savings reserve: ${value} %`) : false;
                                } catch (error) {
                                    this.emit('error', `Encharge set profile savings reserve error: ${error}`);
                                };
                            })
                        this.enchargeProfileSavingsServices.push(enchargeProfileSavingsService);

                        //full backup
                        const debug3 = this.enableDebugMode ? this.emit('debug', `Prepare Encharge Profile Full Backup Service`) : false;
                        this.enchargeProfileFullBackupServices = [];
                        const enchargeProfileFullBackupService = accessory.addService(Service.Lightbulb, accessoryName, `enchargeProfileFullBackupService`);
                        enchargeProfileFullBackupService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        enchargeProfileFullBackupService.setCharacteristic(Characteristic.ConfiguredName, 'Full Backup');
                        enchargeProfileFullBackupService.getCharacteristic(Characteristic.On)
                            .onGet(async () => {
                                const state = false;
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge profile full backup: ${state ? 'Active' : 'Not Active'}`);
                                return state;
                            })
                            .onSet(async (state) => {
                                try {

                                    //const setProfile = state ? await this.setEnchargeProfile('full backup') : false;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Encharge set profile: Full Backup`) : false;
                                } catch (error) {
                                    this.emit('error', `Encharge set profile full backup error: ${error}`);
                                };
                            })
                        this.enchargeProfileFullBackupServices.push(enchargeProfileFullBackupService);
                    };
                }

                //encharges
                if (enchargesInstalled) {
                    //encharges summary level and state
                    const debug2 = this.enableDebugMode ? this.emit('debug', `Prepare Encharges Summary Service`) : false;
                    this.enphaseEnchargesSummaryLevelAndStateService = accessory.addService(Service.Lightbulb, `Encharges`, `enphaseEnchargesSummaryLevelAndStateService`);
                    this.enphaseEnchargesSummaryLevelAndStateService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                    this.enphaseEnchargesSummaryLevelAndStateService.setCharacteristic(Characteristic.ConfiguredName, 'Encharges');
                    this.enphaseEnchargesSummaryLevelAndStateService.getCharacteristic(Characteristic.On)
                        .onGet(async () => {
                            const state = this.enchargesSummaryEnergyState;
                            const info = this.disableLogInfo ? false : this.emit('message', `Encharges energy state: ${state ? 'Charged' : 'Discharged'}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                this.enphaseEnchargesSummaryLevelAndStateService.updateCharacteristic(Characteristic.On, this.enchargesSummaryEnergyState);
                            } catch (error) {
                                this.emit('error', `Set Encharges energy state error: ${error}`);
                            };
                        })
                    this.enphaseEnchargesSummaryLevelAndStateService.getCharacteristic(Characteristic.Brightness)
                        .onGet(async () => {
                            const state = this.enchargesSummaryPercentFull;
                            const info = this.disableLogInfo ? false : this.emit('message', `Encharges energy level: ${this.enchargesSummaryPercentFull} %`);
                            return state;
                        })
                        .onSet(async (value) => {
                            try {
                                this.enphaseEnchargesSummaryLevelAndStateService.updateCharacteristic(Characteristic.Brightness, this.enchargesSummaryPercentFull);
                            } catch (error) {
                                this.emit('error', `Set Encharges energy level error: ${error}`);
                            };
                        })

                    //encharges services
                    this.enchargesServices = [];
                    for (let i = 0; i < enchargesCount; i++) {
                        const enchargeSerialNumber = this.enchargesSerialNumber[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Encharge ${enchargeSerialNumber} Service`) : false;
                        const enphaseEnchargeService = accessory.addService(Service.enphaseEnchargeService, `Encharge ${enchargeSerialNumber}`, `enphaseEnchargeService${i}`);
                        enphaseEnchargeService.setCharacteristic(Characteristic.ConfiguredName, `Encharge ${enchargeSerialNumber}`);
                        enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeAdminStateStr)
                            .onGet(async () => {
                                const value = this.enchargesAdminStateStr[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, state: ${value}`);
                                return value;
                            });
                        enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeOperating)
                            .onGet(async () => {
                                const value = this.enchargesOperating[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommunicating)
                            .onGet(async () => {
                                const value = this.enchargesCommunicating[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        if (plcLevelSupported) {
                            enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommLevel)
                                .onGet(async () => {
                                    const value = this.enchargesCommLevel[i] ?? 0;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber} plc level: ${value} %`);
                                    return value;
                                });
                        }
                        enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommLevelSubGhz)
                            .onGet(async () => {
                                const value = this.enchargesCommLevelSubGhz[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, sub GHz level: ${value} %`);
                                return value;
                            });
                        enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCommLevel24Ghz)
                            .onGet(async () => {
                                const value = this.enchargesCommLevel24Ghz[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, 2.4GHz level: ${value} %`);
                                return value;
                            });
                        enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeSleepEnabled)
                            .onGet(async () => {
                                const value = this.enchargesSleepEnabled[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, sleep: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargePercentFull)
                            .onGet(async () => {
                                const value = this.enchargesPercentFull[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, percent full: ${value} %`);
                                return value;
                            });
                        enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeTemperature)
                            .onGet(async () => {
                                const value = this.enchargesTemperature[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, temp: ${value} °C`);
                                return value;
                            });
                        enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeMaxCellTemp)
                            .onGet(async () => {
                                const value = this.enchargesMaxCellTemp[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, max cell temp: ${value} °C`);
                                return value;
                            });
                        enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeLedStatus)
                            .onGet(async () => {
                                const value = this.enchargesLedStatus[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, LED status: ${value}`);
                                return value;
                            });
                        enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeCapacity)
                            .onGet(async () => {
                                const value = this.enchargesCapacity[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, capacity: ${value} kWh`);
                                return value;
                            });
                        enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeDcSwitchOff)
                            .onGet(async () => {
                                const value = this.enchargesDcSwitchOff[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, status: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeRev)
                            .onGet(async () => {
                                const value = this.enchargesRev[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, revision: ${value}`);
                                return value;
                            });
                        enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeGridProfile)
                            .onGet(async () => {
                                const value = this.arfProfile.name;
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, grid profile: ${value}`);
                                return value;
                            });
                        enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeStatus)
                            .onGet(async () => {
                                const value = this.enchargesStatus[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, status: ${value}`);
                                return value;
                            });
                        enphaseEnchargeService.getCharacteristic(Characteristic.enphaseEnchargeLastReportDate)
                            .onGet(async () => {
                                const value = this.enchargesLastReportDate[i] ?? '';
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, last report: ${value}`);
                                return value;
                            });
                        this.enchargesServices.push(enphaseEnchargeService);
                    }
                }

                //enpowers
                if (enpowersInstalled) {
                    //enpower inventory
                    this.enpowersServices = [];
                    for (let i = 0; i < enpowersCount; i++) {
                        const enpowerSerialNumber = this.enpowersSerialNumber[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${enpowerSerialNumber} Service`) : false;
                        const enphaseEnpowerService = accessory.addService(Service.enphaseEnpowerService, `Enpower ${enpowerSerialNumber}`, `enphaseEnpowerService${i}`);
                        enphaseEnpowerService.setCharacteristic(Characteristic.ConfiguredName, `Enpower ${enpowerSerialNumber}`);
                        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerAdminStateStr)
                            .onGet(async () => {
                                const value = this.enpowersAdminStateStr[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${enpowerSerialNumber}, state: ${value}`);
                                return value;
                            });
                        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerOperating)
                            .onGet(async () => {
                                const value = this.enpowersOperating[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${enpowerSerialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerCommunicating)
                            .onGet(async () => {
                                const value = this.enpowersCommunicating[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${enpowerSerialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerCommLevelSubGhz)
                            .onGet(async () => {
                                const value = this.enpowersCommLevelSubGhz[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${enpowerSerialNumber}, sub GHz level: ${value} %`);
                                return value;
                            });
                        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerCommLevel24Ghz)
                            .onGet(async () => {
                                const value = this.enpowersCommLevel24Ghz[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${enpowerSerialNumber}, 2.4GHz level: ${value} %`);
                                return value;
                            });
                        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerTemperature)
                            .onGet(async () => {
                                const value = this.enpowersTemperature[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${enpowerSerialNumber}, temp: ${value} °C`);
                                return value;
                            });
                        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerMainsAdminState)
                            .onGet(async () => {
                                const value = this.enpowersMainsAdminState[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${enpowerSerialNumber}, mains admin state: ${value}`);
                                return value;
                            });
                        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerMainsOperState)
                            .onGet(async () => {
                                const value = this.enpowersMainsOperState[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${enpowerSerialNumber}, mains operating state: ${value}`);
                                return value;
                            });
                        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerEnpwrGridMode)
                            .onGet(async () => {
                                const value = this.enpowersEnpwGridModeTranslated[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${enpowerSerialNumber}, enpower grid mode: ${value}`);
                                return value;
                            });
                        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerEnchgGridMode)
                            .onGet(async () => {
                                const value = this.enpowersEnchgGridModeTranslated[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${enpowerSerialNumber}, encharge grid mode: ${value}`);
                                return value;
                            });
                        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerGridProfile)
                            .onGet(async () => {
                                const value = this.arfProfile.name;
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${enpowerSerialNumber}, grid profile: ${value}`);
                                return value;
                            });
                        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerStatus)
                            .onGet(async () => {
                                const value = this.enpowersStatus[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${enpowerSerialNumber}, status: ${value}`);
                                return value;
                            });
                        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerLastReportDate)
                            .onGet(async () => {
                                const value = this.enpowersLastReportDate[i] ?? '';
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${enpowerSerialNumber}, last report: ${value}`);
                                return value;
                            });
                        this.enpowersServices.push(enphaseEnpowerService);
                    };

                    //enpower grid mode sensor services
                    if (this.enpowerGridModeActiveSensorsCount > 0) {
                        this.enpowerGridModeSensorsServices = [];
                        for (let i = 0; i < this.enpowerGridModeActiveSensorsCount; i++) {
                            const sensorName = this.enpowerGridModeActiveSensors[i].name;
                            const serviceType = this.enpowerGridModeActiveSensors[i].serviceType;
                            const characteristicType = this.enpowerGridModeActiveSensors[i].characteristicType;
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower Grid Mode Sensor ${sensorName} Service`) : false;
                            const enpowerGridModeSensorsService = accessory.addService(serviceType, sensorName, `enpowerGridModeSensorService${i}`);
                            enpowerGridModeSensorsService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            enpowerGridModeSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                            enpowerGridModeSensorsService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const state = this.enpowerGridModeActiveSensors[i].state;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Enpower grid mode sensor: ${sensorName} state: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.enpowerGridModeSensorsServices.push(enpowerGridModeSensorsService);
                        };
                    };
                }

                //live data
                if (liveDataSupported) {
                    this.liveDataMetersServices = [];
                    for (let i = 0; i < this.liveDataMetersCount; i++) {
                        const liveDataType = this.liveDataTypes[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Live Data ${liveDataType} Service`) : false;
                        const enphaseLiveDataService = accessory.addService(Service.enphaseLiveDataService, `Live Data ${liveDataType}`, `enphaseLiveDataService${i}`);
                        enphaseLiveDataService.setCharacteristic(Characteristic.ConfiguredName, `Live Data ${liveDataType}`);
                        enphaseLiveDataService.getCharacteristic(Characteristic.enphaseLiveDataActivePower)
                            .onGet(async () => {
                                const value = this.liveDataActivePower[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data ${liveDataType}, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataService.getCharacteristic(Characteristic.enphaseLiveDataActivePowerL1)
                            .onGet(async () => {
                                const value = this.liveDataActivePowerL1[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data ${liveDataType} L1, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataService.getCharacteristic(Characteristic.enphaseLiveDataActivePowerL2)
                            .onGet(async () => {
                                const value = this.liveDataActivePowerL2[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data ${liveDataType} L2, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataService.getCharacteristic(Characteristic.enphaseLiveDataActivePowerL3)
                            .onGet(async () => {
                                const value = this.liveDataActivePowerL3[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data ${liveDataType} L3, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataService.getCharacteristic(Characteristic.enphaseLiveDataApparentPower)
                            .onGet(async () => {
                                const value = this.liveDataApparentPower[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data ${liveDataType}, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataService.getCharacteristic(Characteristic.enphaseLiveDataApparentPowerL1)
                            .onGet(async () => {
                                const value = this.liveDataApparentPowerL1[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data ${liveDataType} L1, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataService.getCharacteristic(Characteristic.enphaseLiveDataApparentPowerL2)
                            .onGet(async () => {
                                const value = this.liveDataApparentPowerL2[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data ${liveDataType} L2, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataService.getCharacteristic(Characteristic.enphaseLiveDataApparentPowerL3)
                            .onGet(async () => {
                                const value = this.liveDataApparentPowerL3[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data ${liveDataType} L3, apparent power: ${value} kVA`);
                                return value;
                            });
                        this.liveDataMetersServices.push(enphaseLiveDataService);
                    }
                }

                //wireless connektion kit
                if (wirelessConnectionKitInstalled) {
                    this.wirelessConnektionsKitServices = [];
                    for (let i = 0; i < wirelessConnectionKitConnectionsCount; i++) {
                        const wirelessConnectionType = this.wirelessConnectionsType[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Wireless Connection ${wirelessConnectionType} Service`) : false;
                        const enphaseWirelessConnectionKitService = accessory.addService(Service.enphaseWirelessConnectionKitService, `Wireless connection ${wirelessConnectionType}`, `enphaseWirelessConnectionKitService${i}`);
                        enphaseWirelessConnectionKitService.setCharacteristic(Characteristic.ConfiguredName, `Wireless connection ${wirelessConnectionType}`);
                        enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitType)
                            .onGet(async () => {
                                const value = wirelessConnectionType;
                                const info = this.disableLogInfo ? false : this.emit('message', `Wireless connection: ${wirelessConnectionType}`);
                                return value;
                            });
                        enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitConnected)
                            .onGet(async () => {
                                const value = this.wirelessConnectionsConnected[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Wireless connection: ${wirelessConnectionType}, state: ${value ? 'Connected' : 'Disconnected'}`);
                                return value;
                            });
                        enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitSignalStrength)
                            .onGet(async () => {
                                const value = this.wirelessConnectionsSignalStrength[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Wireless connection: ${wirelessConnectionType}, signal strength: ${value} %`);
                                return value;
                            });
                        enphaseWirelessConnectionKitService.getCharacteristic(Characteristic.enphaseWirelessConnectionKitSignalStrengthMax)
                            .onGet(async () => {
                                const value = this.wirelessConnectionsSignalStrengthMax[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Wireless connection: ${wirelessConnectionType}, signal strength max: ${value} %`);
                                return value;
                            });
                        this.wirelessConnektionsKitServices.push(enphaseWirelessConnectionKitService);
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
