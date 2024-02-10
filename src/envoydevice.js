"use strict";;
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
const CONSTANS = require('./constans.json');
const STATUSCODEREGEX = /status code (\d+)/;
let Accessory, Characteristic, Service, Categories, UUID;

class EnvoyDevice extends EventEmitter {
    constructor(api, prefDir, config) {
        super();

        Accessory = api.platformAccessory;
        Characteristic = api.hap.Characteristic;
        Service = api.hap.Service;
        Categories = api.hap.Categories;
        UUID = api.hap.uuid;

        //device configuration
        this.name = config.name;
        this.host = config.host || 'envoy.local';
        this.envoyPasswd = config.envoyPasswd;
        this.envoyFirmware7xx = config.envoyFirmware7xx || false;
        this.envoySerialNumber = config.envoySerialNumber || '';
        this.enlightenUser = config.enlightenUser;
        this.enlightenPassword = config.enlightenPasswd;

        this.powerProductionSummary = config.powerProductionSummary || 0;
        this.powerProductionStateSensor = config.powerProductionStateSensor || {};
        this.powerProductionLevelSensors = config.powerProductionLevelSensors || [];
        this.energyProductionStateSensor = config.energyProductionStateSensor || {};
        this.energyProductionLevelSensors = config.energyProductionLevelSensors || [];
        this.energyProductionLifetimeOffset = config.energyProductionLifetimeOffset || 0;

        this.powerConsumptionTotalStateSensor = config.powerConsumptionTotalStateSensor || {};
        this.powerConsumptionTotalLevelSensors = config.powerConsumptionTotalLevelSensors || [];
        this.energyConsumptionTotalStateSensor = config.energyConsumptionTotalStateSensor || {};
        this.energyConsumptionTotalLevelSensors = config.energyConsumptionTotalLevelSensors || [];
        this.energyConsumptionTotalLifetimeOffset = config.energyConsumptionTotalLifetimeOffset || 0;

        this.powerConsumptionNetStateSensor = config.powerConsumptionNetStateSensor || {};
        this.powerConsumptionNetLevelSensors = config.powerConsumptionNetLevelSensors || [];
        this.energyConsumptionNetStateSensor = config.energyConsumptionNetStateSensor || {};
        this.energyConsumptionNetLevelSensors = config.energyConsumptionNetLevelSensors || [];
        this.energyConsumptionNetLifetimeOffset = config.energyConsumptionNetLifetimeOffset || 0;

        this.supportEnsembleStatus = this.envoyFirmware7xx ? config.supportEnsembleStatus : false;
        this.supportLiveData = this.envoyFirmware7xx ? config.supportLiveData : false;
        this.supportProductionPowerMode = !this.envoyFirmware7xx ? config.supportProductionPowerMode : false;
        this.supportPlcLevel = !this.envoyFirmware7xx ? config.supportPlcLevel : false;
        this.metersDataRefreshTime = config.metersDataRefreshTime || 2500;
        this.productionDataRefreshTime = config.productionDataRefreshTime || 5000;
        this.liveDataRefreshTime = config.liveDataRefreshTime || 1000;

        this.enpowerGridModeSensors = this.supportEnsembleStatus ? config.enpowerGridModeSensors : [];
        this.enchargeGridModeSensors = this.supportEnsembleStatus ? config.enchargeGridModeSensors : [];
        this.solarGridModeSensors = this.supportEnsembleStatus ? config.solarGridModeSensors : [];

        this.enableDebugMode = config.enableDebugMode || false;
        this.disableLogInfo = config.disableLogInfo || false;
        this.disableLogDeviceInfo = config.disableLogDeviceInfo || false;
        this.restFulEnabled = config.enableRestFul || false;
        this.restFulPort = config.restFulPort || 3000;
        this.restFulDebug = config.restFulDebug || false;
        this.mqttEnabled = config.enableMqtt || false;
        this.mqttHost = config.mqttHost;
        this.mqttPort = config.mqttPort || 1883;
        this.mqttClientId = config.mqttClientId || `envoy_${Math.random().toString(16).slice(3)}`;
        this.mqttPrefix = config.mqttPrefix;
        this.mqttAuth = config.mqttAuth || false;
        this.mqttUser = config.mqttUser;
        this.mqttPasswd = config.mqttPasswd;
        this.mqttDebug = config.mqttDebug || false;

        //setup variables
        this.checkCommLevel = false;
        this.startPrepareAccessory = true;
        this.restFulConnected = false;
        this.mqttConnected = false;

        //active sensors 
        this.powerProductionLevelActiveSensors = [];
        for (const sensor of this.powerProductionLevelSensors) {
            const mode = sensor.mode ?? false;
            const push = mode ? this.powerProductionLevelActiveSensors.push(sensor) : false;
        }
        this.powerProductionLevelActiveSensorsCount = this.powerProductionLevelActiveSensors.length || 0

        this.energyProductionLevelActiveSensors = [];
        for (const sensor of this.energyProductionLevelSensors) {
            const mode = sensor.mode ?? false;
            const push = mode ? this.energyProductionLevelActiveSensors.push(sensor) : false;
        }
        this.energyProductionLevelActiveSensorsCount = this.energyProductionLevelActiveSensors.length || 0

        this.powerConsumptionTotalLevelActiveSensors = [];
        for (const sensor of this.powerConsumptionTotalLevelSensors) {
            const mode = sensor.mode ?? false;
            const push = mode ? this.powerConsumptionTotalLevelActiveSensors.push(sensor) : false;
        }
        this.powerConsumptionTotalLevelActiveSensorsCount = this.powerConsumptionTotalLevelActiveSensors.length || 0

        this.energyConsumptionTotalLevelActiveSensors = [];
        for (const sensor of this.energyConsumptionTotalLevelSensors) {
            const mode = sensor.mode ?? false;
            const push = mode ? this.energyConsumptionTotalLevelActiveSensors.push(sensor) : false;
        }
        this.energyConsumptionTotalLevelActiveSensorsCount = this.energyConsumptionTotalLevelActiveSensors.length || 0

        this.powerConsumptionNetLevelActiveSensors = [];
        for (const sensor of this.powerConsumptionNetLevelSensors) {
            const mode = sensor.mode ?? false;
            const push = mode ? this.powerConsumptionNetLevelActiveSensors.push(sensor) : false;
        }
        this.powerConsumptionNetLevelActiveSensorsCount = this.powerConsumptionNetLevelActiveSensors.length || 0

        this.energyConsumptionNetLevelActiveSensors = [];
        for (const sensor of this.energyConsumptionNetLevelSensors) {
            const mode = sensor.mode ?? false;
            const push = mode ? this.energyConsumptionNetLevelActiveSensors.push(sensor) : false;
        }
        this.energyConsumptionNetLevelActiveSensorsCount = this.energyConsumptionNetLevelActiveSensors.length || 0


        //grid state
        this.enpowerGridModeActiveSensors = [];
        for (const sensor of this.enpowerGridModeSensors) {
            const mode = sensor.mode ?? false;
            const push = mode ? this.enpowerGridModeActiveSensors.push(sensor) : false;
        }
        this.enpowerGridModeActiveSensorsCount = this.enpowerGridModeActiveSensors.length || 0;

        this.enchargeGridModeActiveSensors = [];
        for (const sensor of this.enchargeGridModeSensors) {
            const mode = sensor.mode ?? false;
            const push = mode ? this.enchargeGridModeActiveSensors.push(sensor) : false;
        }
        this.enchargeGridModeActiveSensorsCount = this.enchargeGridModeActiveSensors.length || 0;

        this.solarGridModeActiveSensors = [];
        for (const sensor of this.solarGridModeSensors) {
            const mode = sensor.mode ?? false;
            const push = mode ? this.solarGridModeActiveSensors.push(sensor) : false;
        }
        this.solarGridModeActiveSensorsCount = this.solarGridModeActiveSensors.length || 0;

        //envoy
        this.token = '';
        this.tokenExpiresAt = 0;
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
        this.envoyEnpowerConnected = false;
        this.envoyEnpowerGridModeTranslated = 'Unknown';

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
        this.ensembleStatusSupported = false;
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
        this.ensembleGridProfileName = 'Unknown';
        this.ensembleId = '';
        this.ensembleGridProfileVersion = 'Unknown';
        this.ensembleItemCount = 0;
        this.ensembleFakeInventoryMode = false;

        //encharges
        this.enchargesSupported = false;
        this.enchargesInstalled = false;
        this.enchargesCount = 0;
        this.enchargesType = 'Unknown';
        this.enchargesRatedPowerSum = 0;
        this.enchargesSummaryPercentFull = 0;
        this.enchargesSummaryEnergyState = false;

        //enpowers
        this.enpowersSupported = false;
        this.enpowersInstalled = false;
        this.enpowersCount = 0;
        this.enpowersType = '';

        //generators
        this.generatorsSupported = false;
        this.generatorsInstalled = false;

        //ct meters
        this.metersSupported = false;
        this.metersCount = 0;
        this.metersProductionEnabled = false;
        this.metersProductionVoltageDivide = 1;
        this.metersConsumptionEnabled = false;
        this.metersConsumpionVoltageDivide = 1;
        this.metersConsumptionCount = 0;
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

        //check files exists, if not then create it
        const postFix = this.host.split('.').join('');
        this.envoyIdFile = (`${prefDir}/envoyId_${postFix}`);
        this.envoyTokenFile = (`${prefDir}/envoyToken_${postFix}`);
        this.envoyInstallerPasswordFile = (`${prefDir}/envoyInstallerPassword_${postFix}`);

        try {
            const files = [
                this.envoyIdFile,
                this.envoyTokenFile,
                this.envoyInstallerPasswordFile
            ];

            files.forEach((file) => {
                if (!fs.existsSync(file)) {
                    fs.writeFileSync(file, '0');
                }
            });
        } catch (error) {
            this.emit('error', `prepare files error: ${error}`);
        }

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
        if (this.restFulEnabled) {
            this.restFul = new RestFul({
                port: this.restFulPort,
                debug: this.restFulDebug
            });

            this.restFul.on('connected', (message) => {
                this.emit('message', `${message}`);
                this.restFulConnected = true;
            })
                .on('error', (error) => {
                    this.emit('error', error);
                })
                .on('debug', (debug) => {
                    this.emit('debug', debug);
                });
        }

        //MQTT client
        if (this.mqttEnabled) {
            this.mqtt = new Mqtt({
                host: this.mqttHost,
                port: this.mqttPort,
                clientId: this.mqttClientId,
                user: this.mqttUser,
                passwd: this.mqttPasswd,
                prefix: `${this.mqttPrefix}/${this.name}`,
                debug: this.mqttDebug
            });

            this.mqtt.on('connected', (message) => {
                this.emit('message', `${message}`);
                this.mqttConnected = true;
            })
                .on('error', (error) => {
                    this.emit('error', error);
                })
                .on('debug', (debug) => {
                    this.emit('debug', debug);
                });
        }

        this.start();
    }

    async start() {
        const debug = this.enableDebugMode ? this.emit('debug', `Start.`) : false;

        try {
            //get and validate jwt token
            const getJwtToken = this.envoyFirmware7xx ? await this.getJwtToken() : false;
            const validJwtToken = getJwtToken ? await this.validateJwtToken() : false;

            //get envoy info and inventory data
            await this.updateInfoData();
            await this.updateHomeData();
            await this.updateInventoryData();
            const metersEnabled = this.metersSupported ? await this.updateMetersData() : false;
            const updateMetersReadingData = metersEnabled ? await this.updateMetersReadingData() : false;

            //get ensemble data only FW. >= 7.x.x.
            const updateEnsembleInventoryData = validJwtToken ? await this.updateEnsembleInventoryData() : false;
            const updateEnsembleStatusData = this.supportEnsembleStatus && updateEnsembleInventoryData ? await this.updateEnsembleStatusData() : false;
            const updateLiveData = this.supportLiveData ? await this.updateLiveData() : false;

            //get production and inverters data
            const updateProductionData = await this.updateProductionData();
            const updateProductionCtData = await this.updateProductionCtData();
            const updateMicroinvertersData = validJwtToken || (!this.envoyFirmware7xx && this.installerPasswd) ? await this.updateMicroinvertersData() : false;

            //check only on start FW <= 6.x.x.
            const envoyDevIdExist = this.supportProductionPowerMode ? await this.getEnvoyBackboneAppData() : false;
            const updateProductionPowerModeData = envoyDevIdExist && this.installerPasswd ? await this.updateProductionPowerModeData() : false;
            const updatePlcLevelData = this.supportPlcLevel && this.installerPasswd ? await this.updatePlcLevelData() : false;

            //prepare accessory
            const accessory = this.startPrepareAccessory ? await this.prepareAccessory() : false;
            const publishAccessory = this.startPrepareAccessory ? this.emit('publishAccessory', accessory) : false;
            this.startPrepareAccessory = false;

            try {
                //get device info
                const logDeviceInfo = !this.disableLogDeviceInfo ? this.getDeviceInfo() : false;

                //start update data
                this.updateHome();
                const startMetersReading = metersEnabled ? this.updateMeters() : false;
                const startEnsembleInventory = updateEnsembleInventoryData ? this.updateEnsembleInventory() : false;
                const startLive = updateLiveData ? this.updateLive() : false;
                const starProduction = updateProductionData ? this.updateProduction() : false;
                const startMicroinverters = updateMicroinvertersData ? this.updateMicroinverters() : false;
                const checkJwtToken = validJwtToken ? this.checkJwtToken() : false;
            } catch (error) {
                this.emit('error', `Start update data error: ${error}`);
            };
        } catch (error) {
            this.emit('error', `${error} Trying again in 15s.`);
            await new Promise(resolve => setTimeout(resolve, 15000));
            this.start();
        };
    };

    async updateHome() {
        try {
            await this.updateHomeData();
            await this.updateInventoryData();
        } catch (error) {
            const match = error.match(STATUSCODEREGEX);
            const tokenNotValid = match && match[1] === '401';
            const refreshJwtToken = this.envoyFirmware7xx && tokenNotValid ? this.checkJwtToken(true) : this.emit('error', `${error} Trying again.`);
        };

        await new Promise(resolve => setTimeout(resolve, 60000));
        this.updateHome();
    };

    async updateMeters() {
        try {
            const metersEnabled = await this.updateMetersData();
            const updateMetersReadingData = metersEnabled ? await this.updateMetersReadingData() : false;
        } catch (error) {
            const match = error.match(STATUSCODEREGEX);
            const tokenNotValid = match && match[1] === '401';
            const refreshJwtToken = this.envoyFirmware7xx && tokenNotValid ? this.checkJwtToken(true) : this.emit('error', `${error} Trying again.`);
        };

        await new Promise(resolve => setTimeout(resolve, this.metersDataRefreshTime));
        this.updateMeters();
    };

    async updateEnsembleInventory() {
        try {
            await this.updateEnsembleInventoryData();
            const updateEnsembleStatusData = this.supportEnsembleStatus ? await this.updateEnsembleStatusData() : false;
        } catch (error) {
            const match = error.match(STATUSCODEREGEX);
            const tokenNotValid = match && match[1] === '401';
            const refreshJwtToken = this.envoyFirmware7xx && tokenNotValid ? this.checkJwtToken(true) : this.emit('error', `${error} Trying again.`);
        };

        await new Promise(resolve => setTimeout(resolve, 70000));
        this.updateEnsembleInventory();
    };

    async updateLive() {
        try {
            await this.updateLiveData();
        } catch (error) {
            const match = error.match(STATUSCODEREGEX);
            const tokenNotValid = match && match[1] === '401';
            const refreshJwtToken = this.envoyFirmware7xx && tokenNotValid ? this.checkJwtToken(true) : this.emit('error', `${error} Trying again.`);
        };

        await new Promise(resolve => setTimeout(resolve, this.liveDataRefreshTime));
        this.updateLive();
    };

    async updateProduction() {
        try {
            await this.updateProductionData();
            await this.updateProductionCtData();
        } catch (error) {
            const match = error.match(STATUSCODEREGEX);
            const tokenNotValid = match && match[1] === '401';
            const refreshJwtToken = this.envoyFirmware7xx && tokenNotValid ? this.checkJwtToken(true) : this.emit('error', `${error} Trying again.`);
        };

        await new Promise(resolve => setTimeout(resolve, this.productionDataRefreshTime));
        this.updateProduction();
    };

    async updateMicroinverters() {
        try {
            await this.updateMicroinvertersData();
        } catch (error) {
            const match = error.match(STATUSCODEREGEX);
            const tokenNotValid = match && match[1] === '401';
            const refreshJwtToken = this.envoyFirmware7xx && tokenNotValid ? this.checkJwtToken(true) : this.emit('error', `${error} Trying again.`);
        };

        await new Promise(resolve => setTimeout(resolve, 80000));
        this.updateMicroinverters();
    };

    async checkJwtToken(tokenNotValid = false) {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting check JWT token.`) : false;

        try {
            //check token expired and refresh
            const tokenExpired = this.envoyFirmware7xx && Math.floor(new Date().getTime() / 1000) > this.tokenExpiresAt ? true : false;
            const debug = this.enableDebugMode ? this.emit('debug', `JWT token expired: ${tokenExpired ? 'Yes' : 'No'}.`) : false;
            const debug1 = this.enableDebugMode ? this.emit('debug', `JWT token valid: ${tokenNotValid ? 'No' : 'Yes'}.`) : false;

            //get and validate jwt token
            const getJwtToken = tokenNotValid || tokenExpired ? await this.getJwtToken() : false;
            const validJwtToken = getJwtToken ? await this.validateJwtToken() : false;
        } catch (error) {
            this.emit('error', `Requesting check JWT token error: ${error} Trying again.`);
        };

        await new Promise(resolve => setTimeout(resolve, 90000));
        this.checkJwtToken(tokenNotValid);
    };

    getJwtToken() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting JWT token.`) : false;
            const dateNow = Math.floor(new Date().getTime() / 1000);

            try {
                const envoyToken = new EnvoyToken({
                    user: this.enlightenUser,
                    passwd: this.enlightenPassword,
                    serialNumber: this.envoySerialNumber,
                    tokenFile: this.envoyTokenFile
                });

                const tokenData = await envoyToken.checkToken();
                const debug = this.enableDebugMode ? this.emit('debug', `JWT token: ${JSON.stringify(tokenData, null, 2)}`) : false;
                const tokenGenerationTime = tokenData.genration_time;
                this.token = tokenData.token;
                this.tokenExpiresAt = tokenData.expires_at;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('token', tokenData) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Token', tokenData) : false;

                resolve(true);
            } catch (error) {
                reject(`Requesting JWT token error: ${error}`);
            };
        });
    };

    validateJwtToken() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Validate JWT token.`) : false;

            try {
                const axiosInstanceToken = axios.create({
                    method: 'GET',
                    baseURL: this.url,
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${this.token}`
                    },
                    withCredentials: true,
                    httpsAgent: new https.Agent({
                        keepAlive: false,
                        rejectUnauthorized: false
                    })
                });

                const jwtTokenData = await axiosInstanceToken(CONSTANS.ApiUrls.CheckJwt);
                const debug = this.enableDebugMode ? this.emit('debug', `Validate JWT token: ${jwtTokenData.data}, Headers: ${jwtTokenData.headers}`) : false;
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
                reject(`Validate JWT token error: ${error}`);
            };
        });
    };

    updateInfoData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting info.`) : false;

            try {
                const infoData = await this.axiosInstance(CONSTANS.ApiUrls.Info);
                const info = infoData.data;
                const debug = this.enableDebugMode ? this.emit('debug', `Info: ${JSON.stringify(info, null, 2)}`) : false;

                //parse info
                const options = {
                    ignoreAttributes: false,
                    ignorePiTags: true,
                    allowBooleanAttributes: true
                };
                const parseString = new XMLParser(options);
                const parseInfoData = parseString.parse(info);
                const debug1 = this.enableDebugMode ? this.emit('debug', `Parse info: ${JSON.stringify(parseInfoData, null, 2)}`) : false;

                //envoy info
                const envoyInfo = parseInfoData.envoy_info;
                const time = new Date(envoyInfo.time * 1000).toLocaleString();
                const envoyKeys = Object.keys(envoyInfo);

                //device
                const device = envoyInfo.device;
                const deviceSn = this.envoySerialNumber ? this.envoySerialNumber : device.sn.toString();
                const devicePn = CONSTANS.PartNumbers[device.pn] ?? 'Envoy';
                const deviceSoftware = device.software;
                const deviceEuaid = device.euaid;
                const deviceSeqNum = device.seqnum;
                const deviceApiVer = device.apiver;
                const deviceImeter = device.imeter ?? false;

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

                //envoy password
                const envoyPasswd = this.envoyPasswd ?? deviceSn.substring(6);
                const debug2 = this.enableDebugMode ? this.emit('debug', `Envoy password: ${envoyPasswd}`) : false;

                //digest authorization envoy
                this.digestAuthEnvoy = new DigestAuth({
                    user: CONSTANS.Authorization.EnvoyUser,
                    passwd: envoyPasswd
                });

                //installer password calc
                const passwdCalc = new PasswdCalc({
                    user: CONSTANS.Authorization.InstallerUser,
                    realm: CONSTANS.Authorization.Realm,
                    serialNumber: deviceSn
                });

                // Check if the envoy installer password is stored
                const savedInstallerPasswd = await fsPromises.readFile(this.envoyInstallerPasswordFile);
                this.installerPasswd = savedInstallerPasswd.toString();

                // Check if the envoyinstaller password is correct length
                if (this.installerPasswd === '0') {
                    const installerPasswd = await passwdCalc.getPasswd();
                    const debug3 = this.enableDebugMode ? this.emit('debug', `Installer password: ${installerPasswd}`) : false;

                    try {
                        await fsPromises.writeFile(this.envoyInstallerPasswordFile, installerPasswd);
                        this.installerPasswd = installerPasswd;
                    } catch (error) {
                        reject(`Save envoy installer password error: ${error}.`);
                    };
                }

                //digest authorization installer
                this.digestAuthInstaller = new DigestAuth({
                    user: CONSTANS.Authorization.InstallerUser,
                    passwd: this.installerPasswd
                });

                this.envoyTime = time;
                this.envoySerialNumber = deviceSn;
                this.envoyModelName = devicePn;
                this.envoyFirmware = deviceSoftware.toString();
                this.metersSupported = deviceImeter;

                //check serial number
                if (!this.envoySerialNumber) {
                    reject(`Envoy serial number missing: ${this.envoySerialNumber}.`);
                    return;
                };

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('info', parseInfoData) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Info', parseInfoData) : false;
                resolve();
            } catch (error) {
                reject(`Requesting info error: ${error}.`);
            };
        })
    };

    updateHomeData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting home.`) : false;

            try {
                const homeData = await this.axiosInstance(CONSTANS.ApiUrls.Home);
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
                const enpowersSupported = envoyKeys.includes('enpower');
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
                const primaryInterface = CONSTANS.ApiCodes[envoyNework.primary_interface] ?? 'Unknown';
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
                        const envoyInterfaceType = CONSTANS.ApiCodes[envoyNetworkInterfaces[0].type] ?? 'Unknown';
                        const envoyInterfaceInterface = envoyNetworkInterfaces[0].interface;
                        const envoyInterfaceDhcp = envoyNetworkInterfaces[0].dhcp;
                        const envoyInterfaceIp = envoyNetworkInterfaces[0].ip;
                        const envoyInterfaceCarrier = envoyNetworkInterfaces[0].carrier === true;
                        this.envoyInterfaceCellular = true;
                    }
                    if (envoyInterfaceLan) {
                        const envoyInterfaceType = CONSTANS.ApiCodes[envoyNetworkInterfaces[envoyInterfaceStartIndex].type] ?? 'Unknown';
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
                        const envoyInterfaceType = CONSTANS.ApiCodes[envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].type] ?? 'Unknown';
                        const envoyInterfaceInterface = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].interface;
                        const envoyInterfaceMac = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].mac;
                        const envoyInterfaceDhcp = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].dhcp;
                        const envoyInterfaceIp = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].ip;
                        const envoyInterfaceCarrier = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].carrier === true;
                        const envoyInterfaceSupported = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].supported;
                        const envoyInterfacePresent = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].present;
                        const envoyInterfaceConfigured = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].configured;
                        const envoyInterfaceStatus = CONSTANS.ApiCodes[envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].status] ?? 'Unknown';
                        this.envoyInterfaceWlan = true;
                    }
                }
                const tariff = CONSTANS.ApiCodes[envoy.tariff] ?? 'Unknown';

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
                const updateStatus = CONSTANS.ApiCodes[envoy.update_status] ?? 'Unknown';

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
                        const wirelessConnectionType = CONSTANS.ApiCodes[wirelessConnection.type] ?? 'Unknown';
                        const wirelessConnectionConnected = wirelessConnection.connected === true;

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
                    this.wirelessConnectionKitInstalled = this.wirelessConnectionsConnected.includes(true);
                }

                //enpower
                const enpower = enpowersSupported ? envoy.enpower : {};
                const enpowerConnected = enpower.connected === true ?? false;
                const enpowerGridMode = enpower.grid_status ?? 'Unknown';
                const enpowerGridModeTranslated = CONSTANS.ApiCodes[enpowerGridMode] ?? 'Unknown';

                //convert status
                const status = (Array.isArray(alerts) && alerts.length > 0) ? (alerts.map(a => CONSTANS.ApiCodes[a.msg_key] || a.msg_key).join(', ')).substring(0, 64) : 'No alerts';

                if (this.envoyService) {
                    this.envoyService
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
                            .updateCharacteristic(Characteristic.enphaseEnvoyEnpowerConnected, enpowerConnected)
                            .updateCharacteristic(Characteristic.enphaseEnvoyEnpowerGridStatus, enpowerGridModeTranslated)
                    }
                }

                this.microinvertersSupported = microinvertersSupported;
                this.acBatteriesSupported = acBatteriesSupported;
                this.qRelaysSupported = qRelaysSupported;
                this.ensemblesSupported = ensemblesSupported;
                this.enchargesSupported = enchargesSupported;
                this.enpowersSupported = enpowersSupported;
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

                this.envoyEnpowerConnected = enpowerConnected;
                this.envoyEnpowerGridMode = enpowerGridMode;
                this.envoyEnpowerGridModeTranslated = enpowerGridModeTranslated;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('home', envoy) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Home', envoy) : false;
                resolve();
            } catch (error) {
                reject(`Requesting home error: ${error}.`);
            };
        });
    };


    updateInventoryData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting inventory.`) : false;

            try {
                const inventoryData = await this.axiosInstance(CONSTANS.ApiUrls.Inventory);
                const inventory = inventoryData.data ?? [];
                const debug = this.enableDebugMode ? this.emit('debug', `Inventory: ${JSON.stringify(inventoryData, null, 2)}`) : false;

                //microinverters inventory
                const microinverters = inventory[0].devices ?? [];
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

                    const type = CONSTANS.ApiCodes[inventory[0].type] ?? 'Unknown';
                    for (let i = 0; i < microinvertersCount; i++) {
                        const microinverter = microinverters[i];
                        const partNum = CONSTANS.PartNumbers[microinverter.part_num] ?? 'Microinverter';
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
                        const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

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
                    this.microinvertersCount = microinvertersCount;
                    this.microinvertersInstalled = true;
                }

                //ac btteries inventoty
                const acBatteries = inventory[1].devices ?? [];
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

                    const type = CONSTANS.ApiCodes[inventory[1].type] ?? 'Unknown';
                    for (let i = 0; i < acBatteriesCount; i++) {
                        const acBaterie = acBatteries[i];
                        const partNum = CONSTANS.PartNumbers[acBaterie.part_num] ?? 'AC Batterie'
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
                        const chargeStatus = CONSTANS.ApiCodes[acBaterie.charge_status] ?? 'Unknown';

                        //convert status
                        const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

                        if (this.acBatteriesService) {
                            this.acBatteriesService[i]
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
                const qRelays = inventory[2].devices ?? [];
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

                    const type = CONSTANS.ApiCodes[inventory[2].type] ?? 'Unknown';
                    for (let i = 0; i < qRelaysCount; i++) {
                        const qRelay = qRelays[i];
                        const partNum = CONSTANS.PartNumbers[qRelay.part_num] ?? 'Q-Relay'
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
                        const relay = CONSTANS.ApiCodes[qRelay.relay] ?? 'Unknown';
                        const reasonCode = qRelay.reason_code;
                        const reason = qRelay.reason;
                        const linesCount = qRelay['line-count'];
                        const line1Connected = linesCount >= 1 ? qRelay['line1-connected'] === true : false;
                        const line2Connected = linesCount >= 2 ? qRelay['line2-connected'] === true : false;
                        const line3Connected = linesCount >= 3 ? qRelay['line3-connected'] === true : false;

                        //convert status
                        const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

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
                    this.qRelaysCount = qRelaysCount;
                    this.qRelaysInstalled = true;
                }

                //ensembles
                const ensembles = inventory[3].devices ?? [];
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

                    const type = CONSTANS.ApiCodes[inventory[3].type] ?? 'Unknown';
                    for (let i = 0; i < ensemblesCount; i++) {
                        const ensemble = ensembles[i];
                        const partNum = CONSTANS.PartNumbers[ensemble.part_num] ?? 'Q-Relay'
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
                        const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

                        if (this.ensemblesService) {
                            this.ensemblesService[i]
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
                    this.ensemblesInstalled = true;
                }

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('inventory', inventory) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Inventory', inventory) : false;
                resolve();
            } catch (error) {
                reject(`Requesting inventory error: ${error}.`);
            };
        });
    };

    updateMetersData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting meters info.`) : false;

            try {
                const metersData = await this.axiosInstance(CONSTANS.ApiUrls.MetersInfo);
                const meters = metersData.data ?? [];
                const debug = this.enableDebugMode ? this.emit('debug', `Meters: ${JSON.stringify(meters, null, 2)}`) : false;

                //meters
                this.metersEid = [];
                this.metersState = [];
                this.metersMeasurementType = [];
                this.metersPhaseMode = [];
                this.metersPhaseCount = [];
                this.metersMeteringStatus = [];
                this.metersStatusFlags = [];

                const metersCount = meters.length;
                for (let i = 0; i < metersCount; i++) {
                    const meter = meters[i];
                    const eid = meter.eid;
                    const state = meter.state === 'enabled' ?? false;
                    const measurementType = CONSTANS.ApiCodes[meter.measurementType] ?? 'Unknown';
                    const phaseMode = CONSTANS.ApiCodes[meter.phaseMode] ?? 'Unknown';
                    const phaseCount = meter.phaseCount ?? 0;
                    const meteringStatus = CONSTANS.ApiCodes[meter.meteringStatus] ?? 'Unknown';
                    const statusFlags = meter.statusFlags;

                    // convert status
                    const status = (Array.isArray(statusFlags) && statusFlags.length > 0) ? (statusFlags.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

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

                this.metersProductionEnabled = this.metersState[0] ?? false;
                this.metersProductionVoltageDivide = this.metersPhaseMode[0] === 'Split' ? 1 : this.metersPhaseCount[0];
                this.metersConsumptionEnabled = this.metersState[1] ?? false;
                this.metersConsumpionVoltageDivide = this.metersPhaseMode[1] === 'Split' ? 1 : this.metersPhaseCount[1];
                this.metersStorageEnabled = this.metersState[2] ?? false;
                this.metersStorageVoltageDivide = this.metersPhaseMode[2] === 'Split' ? 1 : this.metersPhaseCount[2];

                this.metersCount = metersCount;
                const metersEnabled = this.metersState.includes(true);

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('meters', meters) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Meters', meters) : false;
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
                const metersReadingData = await this.axiosInstance(CONSTANS.ApiUrls.MetersReadings);
                const metersReading = metersReadingData.data ?? [];
                const debug = this.enableDebugMode ? this.emit('debug', `Meters reading: ${JSON.stringify(metersReading, null, 2)}`) : false;

                //meters reading
                const metersReadingCount = metersReading.length;
                const metersReadingInstalled = metersReadingCount > 0;

                //meters
                if (metersReadingInstalled) {
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
                        if (this.metersService && meterState) {
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
                    this.metersReadingInstalled = metersReadingInstalled;
                }

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('metersreading', metersReading) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Meters Reading', metersReading) : false;
                resolve();
            } catch (error) {
                reject(`Requesting meters reading error: ${error}.`);
            };
        });
    };

    updateEnsembleInventoryData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting ensemble inventory.`) : false;

            try {
                const ensembleInventoryData = await this.axiosInstance(CONSTANS.ApiUrls.EnsembleInventory);
                const ensembleInventory = ensembleInventoryData.data ?? [];
                const debug = this.enableDebugMode ? this.emit('debug', `Ensemble inventory: ${JSON.stringify(ensembleInventory, null, 2)}`) : false;

                //ensemble inventory devices count
                const ensembleDevicesCount = ensembleInventory.length;
                if (ensembleDevicesCount === 0) {
                    resolve(false);
                    return;
                }

                //encharges
                const encharges = ensembleInventory[0].devices ?? [];
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

                    const type = CONSTANS.ApiCodes[ensembleInventory[0].type] ?? 'Encharge';
                    for (let i = 0; i < enchargesCount; i++) {
                        const encharge = encharges[i];
                        const partNum = CONSTANS.PartNumbers[encharge.part_num] ?? 'Unknown';
                        const serialNumber = encharge.serial_num;
                        const installed = new Date(encharge.installed * 1000).toLocaleString();
                        const deviceStatus = encharge.device_status;
                        const lastReportDate = new Date(encharge.last_rpt_date * 1000).toLocaleString();
                        const adminState = encharge.admin_state;
                        const adminStateStr = CONSTANS.ApiCodes[encharge.admin_state_str] ?? 'Unknown';
                        const createdDate = new Date(encharge.created_date * 1000).toLocaleString();
                        const imgLoadDate = new Date(encharge.img_load_date * 1000).toLocaleString();
                        const imgPnumRunning = encharge.img_pnum_running;
                        const zigbeeDongleFwVersion = encharge.zigbee_dongle_fw_version ?? 'Unknown'
                        const bmuFwVersion = encharge.bmu_fw_version;
                        const operating = encharge.operating === true ?? false;
                        const communicating = encharge.communicating === true;
                        const sleepEnabled = encharge.sleep_enabled;
                        const percentFull = encharge.percentFull;
                        const temperature = encharge.temperature;
                        const maxCellTemp = encharge.maxCellTemp;
                        const reportedEncGridState = encharge.reported_enc_grid_state ?? 'Unknown';
                        const commLevelSubGhz = encharge.comm_level_sub_ghz * 20;
                        const commLevel24Ghz = encharge.comm_level_2_4_ghz * 20;
                        const ledStatus = CONSTANS.LedStatus[encharge.led_status] ?? 'Unknown';
                        const dcSwitchOff = encharge.dc_switch_off;
                        const enchargeRev = encharge.encharge_rev;
                        const enchargeCapacity = parseFloat(encharge.encharge_capacity) / 1000; //in kWh
                        const phase = encharge.phase ?? 'Unknown';
                        const derIndex = encharge.der_index ?? 0;

                        //convert status
                        const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

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
                                .updateCharacteristic(Characteristic.enphaseEnchargeDcSwitchOff, dcSwitchOff)
                                .updateCharacteristic(Characteristic.enphaseEnchargeRev, enchargeRev)
                                .updateCharacteristic(Characteristic.enphaseEnchargeCapacity, enchargeCapacity)
                                .updateCharacteristic(Characteristic.enphaseEnchargeGridProfile, this.ensembleGridProfileName)
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
                    this.enchargesInstalled = true;

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
                const enpowers = ensembleInventory[1].devices ?? [];
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
                    this.enpowersGridMode = [];
                    this.enpowersEnchgGridMode = [];
                    this.enpowersRelayStateBm = [];
                    this.enpowersCurrStateId = [];

                    const type = CONSTANS.ApiCodes[ensembleInventory[1].type] ?? 'Enpower';
                    for (let i = 0; i < enpowersCount; i++) {
                        const enpower = enpowers[i];
                        const partNum = CONSTANS.PartNumbers[enpower.part_num] ?? 'Unknown'
                        const serialNumber = enpower.serial_num;
                        const installed = new Date(enpower.installed * 1000).toLocaleString();
                        const deviceStatus = enpower.device_status;
                        const lastReportDate = new Date(enpower.last_rpt_date * 1000).toLocaleString();
                        const adminState = enpower.admin_state;
                        const adminStateStr = CONSTANS.ApiCodes[enpower.admin_state_str] ?? 'Unknown';
                        const createdDate = new Date(enpower.created_date * 1000).toLocaleString();
                        const imgLoadDate = new Date(enpower.img_load_date * 1000).toLocaleString();
                        const imgPnumRunning = enpower.img_pnum_running;
                        const zigbeeDongleFwVersion = enpower.zigbee_dongle_fw_version ?? 'Unknown';
                        const operating = enpower.operating === true ?? false;
                        const communicating = enpower.communicating === true;
                        const temperature = enpower.temperature;
                        const commLevelSubGhz = enpower.comm_level_sub_ghz * 20;
                        const commLevel24Ghz = enpower.comm_level_2_4_ghz * 20;
                        const mainsAdminState = CONSTANS.ApiCodes[enpower.mains_admin_state] ?? 'Unknown';
                        const mainsOperState = CONSTANS.ApiCodes[enpower.mains_oper_state] ?? 'Unknown';
                        const enpwrGridMode = CONSTANS.ApiCodes[enpower.Enpwr_grid_mode] ?? 'Unknown';
                        const enchgGridMode = CONSTANS.ApiCodes[enpower.Enchg_grid_mode] ?? 'Unknown';
                        const enpwrRelayStateBm = enpower.Enpwr_relay_state_bm;
                        const enpwrCurrStateId = enpower.Enpwr_curr_state_id;

                        //convert status
                        const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

                        if (this.enpowersService) {
                            this.enpowersService[i]
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
                                .updateCharacteristic(Characteristic.enphaseEnpowerGridProfile, this.ensembleGridProfileName)
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
                        this.enpowersGridMode.push(enpwrGridMode);
                        this.enpowersEnchgGridMode.push(enchgGridMode);
                        this.enpowersRelayStateBm.push(enpwrRelayStateBm);
                        this.enpowersCurrStateId.push(enpwrCurrStateId);
                    }
                    this.enpowersType = type;
                    this.enpowersCount = enpowersCount;
                    this.enpowersInstalled = true;
                }

                //generators
                const generators = ensembleInventory[2].devices ?? [];
                const generatorsCount = generators.length;
                const generatorsInstalled = generatorsCount > 0;

                if (generatorsInstalled) {
                    const type = CONSTANS.ApiCodes[ensembleInventory[2].type] ?? 'Generator';

                    this.generatorsType = type;
                    this.generatorsCount = generatorsCount;
                    this.generatorsInstalled = true;
                }

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('ensembleinventory', ensembleInventory) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Ensemble Inventory', ensembleInventory) : false;
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
                const ensembleStatusData = await this.axiosInstance(CONSTANS.ApiUrls.EnsembleStatus);
                const ensembleStatus = ensembleStatusData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Ensemble status: ${JSON.stringify(ensembleStatus, null, 2)}`) : false;

                const ensembleStatusObjects = Object.keys(ensembleStatus);

                //encharges
                const enchargesSerialNumbers = ensembleStatus.inventory.serial_nums ?? {};
                const enchargesSerialNumbersKeys = Object.keys(enchargesSerialNumbers);
                const enchargesSserialNumbersCount = enchargesSerialNumbersKeys.length;

                if (enchargesSserialNumbersCount > 0) {
                    const enchargesRatedPowerSummary = [];

                    for (let i = 0; i < enchargesSserialNumbersCount; i++) {
                        const enchargeKey = enchargesSerialNumbersKeys[i];
                        const encharge = ensembleStatus.inventory.serial_nums[enchargeKey];
                        const deviceType = encharge.device_type;
                        const comInterfacStr = encharge.com_interface_str ?? 'Unknown';
                        const deviceId = encharge.device_id ?? 'Unknown';
                        const adminState = encharge.admin_state;
                        const adminStateStr = CONSTANS.ApiCodes[encharge.admin_state_str] ?? 'Unknown';
                        const reportedGridMode = CONSTANS.ApiCodes[encharge.reported_grid_mode] ?? 'Unknown';
                        const phase = encharge.phase ?? 'Unknown';
                        const derIndex = encharge.der_index ?? 0;
                        const revision = encharge.encharge_revision ?? 0;
                        const capacity = encharge.encharge_capacity ?? 0;
                        const ratedPower = encharge.encharge_rated_power ?? 0;
                        const reportedGridState = CONSTANS.ApiCodes[encharge.reported_grid_state] ?? 'Unknown';
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
                }

                //counters
                const countersSupported = ensembleStatusObjects.includes('counters');
                const counter = !countersSupported ? {} : ensembleStatus.counters;
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
                const secctrl = ensembleStatus.secctrl;
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
                const commisionInProgress = secctrl.Commision_in_progress ?? false;
                const essInProgress = secctrl.ESS_in_progress ?? false;

                if (this.ensemblesStatusService) {
                    this.ensemblesStatusService[0]
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
                const relay = ensembleStatus.relay;
                const mainsAdminState = CONSTANS.ApiCodes[relay.mains_admin_state] ?? 'Unknown';
                const mainsOperState = CONSTANS.ApiCodes[relay.mains_oper_sate] ?? 'Unknown';
                const der1State = relay.der1_state ?? 0;
                const der2State = relay.der2_state ?? 0;
                const der3State = relay.der3_state ?? 0;
                const enchGridMode = relay.Enchg_grid_mode ?? 'Unknown';
                const solarGridMode = relay.Solar_grid_mode ?? 'Unknown';

                //enpower grid state sensors
                if (this.enpowerGridModeActiveSensorsCount > 0) {
                    this.enpowerGridModeActiveSensorsState = [];

                    for (let k = 0; k < this.enpowerGridModeActiveSensorsCount; k++) {
                        const gridMode = this.enpowerGridModeActiveSensors[k].gridMode;
                        const state = gridMode === this.envoyEnpowerGridMode;
                        if (this.enpowerGridModeSensorsServices) {
                            this.enpowerGridModeSensorsServices[k]
                                .updateCharacteristic(Characteristic.ContactSensorState, state)
                        }
                        this.enpowerGridModeActiveSensorsState.push(state);
                    }
                }

                //encharge grid state sensors
                if (this.enchargerGridModeActiveSensorsCount > 0) {
                    this.enchargeGridModeActiveSensorsState = [];

                    for (let l = 0; l < this.enchargeActiveSensorsCount; l++) {
                        const gridMode = this.enchargeGridModeActiveSensors[l].gridMode;
                        const state = gridMode === enchGridMode;
                        if (this.enchargeGridModeSensorsServices) {
                            this.enchargeGridModeSensorsServices[l]
                                .updateCharacteristic(Characteristic.ContactSensorState, state)
                        }
                        this.enchargeGridModeActiveSensorsState.push(state);
                    }
                }

                //solar grid state sensors
                if (this.solarGridModeActiveSensorsCount > 0) {
                    this.solarGridModeActiveSensorsState = [];

                    for (let m = 0; m < this.solarGridModeActiveSensorsCount; m++) {
                        const gridMode = this.solarGridModeActiveSensors[m].gridMode;
                        const state = gridMode === solarGridMode;
                        if (this.solarGridModeSensorsServices) {
                            this.solarGridModeSensorsServices[m]
                                .updateCharacteristic(Characteristic.ContactSensorState, state)
                        }
                        this.solarGridModeActiveSensorsState.push(state);
                    }
                }

                //profile
                const profileSupported = ensembleStatusObjects.includes('profile');
                const profile = !profileSupported ? {} : ensembleStatus.profile;
                const message = profile.message === 'Obsolete API, please use ivp/arf/profile' ?? false;
                const profileData = message ? await this.updateProfileData() : profile;
                const name = profileData.name ?? 'Unknown';
                const id = profileData.id ?? 0;
                const version = profileData.version ?? '';
                const itemCount = profileData.item_count ?? 0;

                //fakeit
                const fakeInventoryModeSupported = ensembleStatusObjects.includes('fakeit');
                const fakeInventoryMode = !fakeInventoryModeSupported ? false : ensembleStatus.fakeit.fake_inventory_mode === true;

                this.ensembleGridProfileName = name;
                this.ensembleId = id;
                this.ensembleGridProfileVersion = version;
                this.ensembleItemCount = itemCount;
                this.ensembleFakeInventoryMode = fakeInventoryMode;
                this.ensembleStatusSupported = true;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('ensemblestatus', ensembleStatus) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Ensemble Status', ensembleStatus) : false;
                resolve();
            } catch (error) {
                reject(`Requesting ensemble status error: ${error}.`);
            };
        });
    };

    updateProfileData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting grid profile.`) : false;

            try {
                const profileData = await this.axiosInstance(CONSTANS.ApiUrls.Profile);
                const profile = profileData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Grid profile: ${JSON.stringify(profile, null, 2)}`) : false;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('gridprofile', profile) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Grid Profile', profile) : false;
                resolve(profile);
            } catch (error) {
                reject(`Requesting grid profile error: ${error}.`);
            };
        });
    };

    updateLiveData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting live data.`) : false;

            try {
                const liveData = await this.axiosInstance(CONSTANS.ApiUrls.LiveData);
                const live = liveData.data ?? {};
                const debug = this.enableDebugMode ? this.emit('debug', `Live data: ${JSON.stringify(live, null, 2)}`) : false;

                //live data keys
                const liveDadaKeys = Object.keys(live);

                //connection
                const connection = live.connection ?? {};
                const connectionMqttState = connection.mqtt_state;
                const connectionProvState = connection.prov_state;
                const connectionAuthState = connection.auth_state;
                const connectionScStream = connection.sc_stream === 'enabled';
                const connectionScDebug = connection.sc_debug === 'enabled';

                //enable live data stream if not enabled
                const enableLiveDataStream = !connectionScStream ? await this.enableLiveDataStream() : false;

                //meters
                const liveDataMeters = live.meters ?? {};
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

                //lived data meteres
                this.liveDataTypes = [];
                this.liveDataTypes.push('PV');
                this.liveDataMetersType = [];
                this.liveDataMetersType.push(liveDataMeters.pv);
                const pushStorageTypeToArray = this.acBatteriesInstalled || this.enchargesInstalled ? this.liveDataTypes.push('Storage') : false;
                const pushStorageDataToArray = this.acBatteriesInstalled || this.enchargesInstalled ? this.liveDataMetersType.push(liveDataMeters.storage) : false;
                const pushGridTypeToArray = this.metersSupported || this.metersConsumptionEnabled ? this.liveDataTypes.push('Grid') : false;
                const pushGridToArray = this.metersSupported && this.metersConsumptionEnabled ? this.liveDataMetersType.push(liveDataMeters.grid) : false;
                const pushLoadTypeToArray = this.metersSupported || this.metersConsumptionEnabled ? this.liveDataTypes.push('Load') : false;
                const pushLoadeToArray = this.metersSupported && this.metersConsumptionEnabled ? this.liveDataMetersType.push(liveDataMeters.load) : false;
                const pushGeneratorTypeToArray = this.generatorsInstalled ? this.liveDataTypes.push('Generator') : false;
                const pushGenertorToArray = this.generatorsInstalled ? this.liveDataMetersType.push(liveDataMeters.generator) : false;

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

                    if (this.liveDataMetersService) {
                        this.liveDataMetersService[i]
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

                //tasks
                const tasks = live.tasks ?? {};
                const tasksId = tasks.task_id;
                const tasksTimestamp = tasks.timestamp;

                //counters
                const counters = live.counters ?? {};
                const countersMainCfgLoad = counters.main_CfgLoad;
                const countersMainCfgChanged = counters.main_CfgChanged;
                const countersMainTaskUpdate = counters.main_TaskUpdate;
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
                const supportDryContacts = liveDadaKeys.includes('dry_contacts');
                const dryContacts = supportDryContacts ? live.dry_contacts[''] : {};
                const dryContactId = dryContacts.dry_contact_id ?? '';
                const dryContactLoadName = dryContacts.dry_contact_load_name ?? '';
                const dryContactStatus = dryContacts.dry_contact_status ?? 0;

                //live data supported
                this.liveDataSupported = true;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('livedata', live) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Live Data', live) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting live data error: ${error}.`);
            };
        });
    };

    enableLiveDataStream() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting live data stream.`) : false;

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
                const url = this.url + CONSTANS.ApiUrls.LiveDataStream;
                const enableLiveDataStream = await axios.post(url, { 'enable': 1 }, options);
                const debug = this.enableDebugMode ? this.emit('debug', `Live data stream: ${JSON.stringify(enableLiveDataStream.data, null, 2)}`) : false;
                resolve();
            } catch (error) {
                reject(`Requesting live data stream error: ${error}.`);
            };
        });
    };

    updateProductionData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting production.`) : false;

            try {
                const productionData = await this.axiosInstance(CONSTANS.ApiUrls.InverterProductionSumm);
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
                const mqtt = this.mqttConnected ? this.mqtt.send('Production', production) : false;
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
                const productionCtData = await this.axiosInstance(CONSTANS.ApiUrls.SystemReadingStats);
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
                const productionMicroType = CONSTANS.ApiCodes[productionMicro.type];
                const productionMicroActiveCount = productionMicro.activeCount;
                const productionMicroReadingTime = new Date(productionMicro.readingTime * 1000).toLocaleString();
                const productionMicroPower = parseFloat(productionMicro.wNow) / 1000;
                const productionMicroEnergyLifeTime = parseFloat(productionMicro.whLifetime + productionEnergyLifetimeOffset) / 1000;

                //production data 1
                const production = productionCt.production[1] ?? {};
                const productionType = metersProductionEnabled ? CONSTANS.ApiCodes[production.type] : productionMicroType;
                const productionActiveCount = metersProductionEnabled ? production.activeCount : productionMicroActiveCount;
                const productionMeasurmentType = metersProductionEnabled ? CONSTANS.ApiCodes[production.measurementType] : productionMicroType;
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

                if (this.systemPvService) {
                    this.systemPvService
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
                if (this.powerProductionStateSensorService) {
                    this.powerProductionStateSensorService
                        .updateCharacteristic(Characteristic.ContactSensorState, productionPowerState)
                }
                if (this.powerProductionLevelActiveSensorsCount > 0) {
                    this.powerProductionLevelActiveSensorsState = [];

                    for (let i = 0; i < this.powerProductionLevelActiveSensorsCount; i++) {
                        const powerLevel = this.powerProductionLevelActiveSensors[i].powerLevel / 1000;
                        const state = productionPower >= powerLevel;
                        if (this.powerProductionLevelSensorsService) {
                            this.powerProductionLevelSensorsService[i]
                                .updateCharacteristic(Characteristic.ContactSensorState, state)
                        }
                        this.powerProductionLevelActiveSensorsState.push(state);
                    }
                }

                //sensors energy
                if (this.energyProductionStateSensorService) {
                    this.energyProductionStateSensorService
                        .updateCharacteristic(Characteristic.ContactSensorState, productionEnergyState)
                }
                if (this.energyProductionLevelActiveSensorsCount > 0) {
                    this.energyProductionLevelActiveSensorsState = [];

                    for (let i = 0; i < this.energyProductionLevelActiveSensorsCount; i++) {
                        const energyLevel = this.energyProductionLevelActiveSensors[i].energyLevel / 1000;
                        const state = productionEnergyToday >= energyLevel;
                        if (this.energyProductionLevelSensorsService) {
                            this.energyProductionLevelSensorsService[i]
                                .updateCharacteristic(Characteristic.ContactSensorState, state)
                        }
                        this.energyProductionLevelActiveSensorsState.push(state);
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

                    const metersConsumptionCount = productionCt.consumption.length;
                    for (let i = 0; i < metersConsumptionCount; i++) {
                        //power
                        const consumption = productionCt.consumption[i] ?? {};
                        const consumptionType = CONSTANS.ApiCodes[consumption.type];
                        const consumptionActiveCount = consumption.activeCount;
                        const consumptionMeasurmentType = CONSTANS.ApiCodes[consumption.measurementType];
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

                        if (this.consumptionsService) {
                            this.consumptionsService[i]
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
                            if (this.powerConsumptionTotalStateSensorService) {
                                this.powerConsumptionTotalStateSensorService
                                    .updateCharacteristic(Characteristic.ContactSensorState, consumptionPowerState)
                            }
                            if (this.powerConsumptionTotalLevelActiveSensorsCount > 0) {
                                this.powerConsumptionTotalLevelActiveSensorsState = [];

                                for (let j = 0; j < this.powerConsumptionTotalLevelActiveSensorsCount; j++) {
                                    const powerLevel = this.powerConsumptionTotalLevelActiveSensors[j].powerLevel / 1000;
                                    const state = consumptionPower >= powerLevel;
                                    if (this.powerConsumptionTotalLevelSensorsService) {
                                        this.powerConsumptionTotalLevelSensorsService[j]
                                            .updateCharacteristic(Characteristic.ContactSensorState, state)
                                    }
                                    this.powerConsumptionTotalLevelActiveSensorsState.push(state);
                                }
                            }

                            //sensors energy total
                            if (this.energyConsumptionTotalStateSensorService) {
                                this.energyConsumptionTotalStateSensorService
                                    .updateCharacteristic(Characteristic.ContactSensorState, consumptionEnergyState)
                            }
                            if (this.energyConsumptionTotalLevelActiveSensorsCount > 0) {
                                this.energyConsumptionTotalLevelActiveSensorsState = [];

                                for (let k = 0; k < this.energyConsumptionTotalLevelActiveSensorsCount; k++) {
                                    const energyLevel = this.energyConsumptionTotalLevelActiveSensors[k].energyLevel / 1000;
                                    const state = consumptionEnergyToday >= energyLevel;
                                    if (this.energyConsumptionTotalLevelSensorsService) {
                                        this.energyConsumptionTotalLevelSensorsService[k]
                                            .updateCharacteristic(Characteristic.ContactSensorState, state)
                                    }
                                    this.energyConsumptionTotalLevelActiveSensorsState.push(state);
                                }
                            }
                        }

                        if (i === 1) {
                            //sensors power net
                            if (this.powerConsumptionNetStateSensorService) {
                                this.powerConsumptionNetStateSensorService
                                    .updateCharacteristic(Characteristic.ContactSensorState, consumptionPowerState)
                            }
                            if (this.powerConsumptionNetLevelActiveSensorsCount > 0) {
                                this.powerConsumptionNetLevelActiveSensorsState = [];

                                for (let l = 0; l < this.powerConsumptionNetLevelActiveSensorsCount; l++) {
                                    const powerLevel = this.powerConsumptionNetLevelActiveSensors[l].powerLevel / 1000;
                                    const importing = powerLevel >= 0;
                                    const state = importing ? consumptionPower >= powerLevel : consumptionPower <= powerLevel;
                                    if (this.powerConsumptionNetLevelSensorsService) {
                                        this.powerConsumptionNetLevelSensorsService[l]
                                            .updateCharacteristic(Characteristic.ContactSensorState, state)
                                    }
                                    this.powerConsumptionNetLevelActiveSensorsState.push(state);
                                }
                            }

                            //sensors energy net
                            if (this.energyConsumptionNetStateSensorService) {
                                this.energyConsumptionNetStateSensorService
                                    .updateCharacteristic(Characteristic.ContactSensorState, consumptionEnergyState)
                            }
                            if (this.energyConsumptionNetLevelActiveSensorsCount > 0) {
                                this.energyConsumptionNetLevelActiveSensorsState = [];

                                for (let m = 0; m < this.energyConsumptionNetLevelActiveSensorsCount; m++) {
                                    const energyLevel = this.energyConsumptionNetLevelActiveSensors[m].energyLevel / 1000;
                                    const state = consumptionEnergyToday >= energyLevel;
                                    if (this.energyConsumptionNetLevelSensorsService) {
                                        this.energyConsumptionNetLevelSensorsService[m]
                                            .updateCharacteristic(Characteristic.ContactSensorState, state)
                                    }
                                    this.energyConsumptionNetLevelActiveSensorsState.push(state);
                                }
                            }
                        }

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
                        this.metersConsumptionCount = metersConsumptionCount;
                    }
                }

                //ac btteries summary 3
                if (acBatteriesInstalled) {
                    const acBaterie = productionCt.storage[0] ?? {};
                    const type = CONSTANS.ApiCodes[acBaterie.type] ?? 'AC Batterie';
                    const activeCount = acBaterie.activeCount;
                    const readingTime = new Date(acBaterie.readingTime * 1000).toLocaleString();
                    const wNow = parseFloat(acBaterie.wNow) / 1000;
                    const whNow = parseFloat(acBaterie.whNow + this.acBatteriesStorageOffset) / 1000;
                    const chargeStatus = CONSTANS.ApiCodes[acBaterie.state] ?? 'Unknown';
                    const percentFull = acBaterie.percentFull;
                    const energyState = percentFull > 0;

                    if (this.acBatteriesSummaryService) {
                        this.acBatteriesSummaryService[0]
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
                const mqtt = this.mqttConnected ? this.mqtt.send('Production CT', productionCt) : false;
                resolve();
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

                const microinvertersData = this.envoyFirmware7xx ? await this.axiosInstance(CONSTANS.ApiUrls.InverterProduction) : await this.digestAuthEnvoy.request(CONSTANS.ApiUrls.InverterProduction, options);
                const microinverters = microinvertersData.data ?? [];
                const debug = this.enableDebugMode ? this.emit('debug', `Microinverters: ${JSON.stringify(microinverters, null, 2)}`) : false;

                const allMicroinvertersSerialNumber = [];
                for (const microinverter of microinverters) {
                    const serialNumber = microinverter.serialNumber;
                    allMicroinvertersSerialNumber.push(serialNumber);
                }

                //microinverters power
                this.microinvertersReadingTime = [];
                this.microinvertersDevType = [];
                this.microinvertersLastPower = [];
                this.microinvertersMaxPower = [];

                for (let i = 0; i < this.microinvertersCount; i++) {
                    const index = allMicroinvertersSerialNumber.findIndex(index => index === this.microinvertersSerialNumber[i]);
                    const microinverter = microinverters[index];
                    const lastReportDate = new Date(microinverter.lastReportDate * 1000).toLocaleString();
                    const devType = microinverter.devType;
                    const lastReportWatts = parseInt(microinverter.lastReportWatts);
                    const microinverterPower = lastReportWatts >= 0 ? lastReportWatts : 0;
                    const maxReportWatts = parseInt(microinverter.maxReportWatts);

                    if (this.microinvertersService) {
                        this.microinvertersService[i]
                            .updateCharacteristic(Characteristic.enphaseMicroinverterLastReportDate, lastReportDate)
                            .updateCharacteristic(Characteristic.enphaseMicroinverterPower, microinverterPower)
                            .updateCharacteristic(Characteristic.enphaseMicroinverterPowerMax, maxReportWatts)
                    }

                    this.microinvertersReadingTime.push(lastReportDate);
                    this.microinvertersDevType.push(devType);
                    this.microinvertersLastPower.push(microinverterPower);
                    this.microinvertersMaxPower.push(maxReportWatts);
                }

                this.microinvertersPowerSupported = true;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('microinverters', microinverters) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Microinverters', microinverters) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting microinverters error: ${error}.`);
            };
        });
    };

    getEnvoyBackboneAppData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting envoy backbone app.`) : false;

            try {
                // Check if the envoy ID is stored
                const savedEnvoyId = await fsPromises.readFile(this.envoyIdFile);
                const debug = this.enableDebugMode ? this.emit('debug', `Read dev Id from file: ${savedEnvoyId}`) : false;
                const envoyId = savedEnvoyId.toString();

                // Check if the envoy ID is correct length
                if (envoyId.length === 9) {
                    this.envoyDevId = envoyId;
                    const debug = this.enableDebugMode ? this.emit('debug', `Envoy dev Id from file: ${envoyId}`) : false;
                    resolve(true);
                    return;
                }

                try {
                    const envoyBackboneAppData = await this.axiosInstance(CONSTANS.ApiUrls.BackboneApplication);
                    const debug = this.enableDebugMode ? this.emit('debug', `Envoy backbone app: ${envoyBackboneAppData.data}`) : false;

                    //backbone data
                    const backbone = envoyBackboneAppData.data;
                    const envoyDevId = backbone.substr(backbone.indexOf('envoyDevId:') + 11, 9);
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

    updateProductionPowerModeData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting power mode.`) : false;

            try {
                const powerModeUrl = CONSTANS.ApiUrls.PowerForcedModePutGet.replace("EID", this.envoyDevId);
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
                const mqtt = this.mqttConnected ? this.mqtt.send('Power Mode', productionPowerMode) : false;
                resolve();
            } catch (error) {
                reject(`Requesting power mode error: ${error}.`);
            };
        });
    }

    updatePlcLevelData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting plc level.`) : false;
            this.checkCommLevel = true;

            try {
                const options = {
                    method: 'GET',
                    baseURL: this.url,
                    headers: {
                        Accept: 'application/json'
                    }
                }

                const plcLevelData = this.envoyFirmware7xx ? await this.axiosInstance(CONSTANS.ApiUrls.InverterComm) : await this.digestAuthInstaller.request(CONSTANS.ApiUrls.InverterComm, options);
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
                    const value = (plcLevel[key] || 0) * 20 ?? 0;

                    if (this.microinvertersService) {
                        this.microinvertersService[i]
                            .updateCharacteristic(Characteristic.enphaseMicroinverterCommLevel, value)
                    }
                    this.microinvertersCommLevel.push(value);
                }

                for (let i = 0; i < this.acBatteriesCount; i++) {
                    const key = `${this.acBatteriesSerialNumber[i]}`;
                    const value = (plcLevel[key] || 0) * 20 ?? 0;

                    if (this.acBatteriesService) {
                        this.acBatteriesService[i]
                            .updateCharacteristic(Characteristic.enphaseAcBatterieCommLevel, value)
                    }
                    this.acBatteriesCommLevel.push(value);
                }

                for (let i = 0; i < this.qRelaysCount; i++) {
                    const key = `${this.qRelaysSerialNumber[i]}`;
                    const value = (plcLevel[key] || 0) * 20 ?? 0;

                    if (this.qRelaysService) {
                        this.qRelaysService[i]
                            .updateCharacteristic(Characteristic.enphaseQrelayCommLevel, value)
                    }
                    this.qRelaysCommLevel.push(value);
                }

                for (let i = 0; i < this.enchargesCount; i++) {
                    const key = `${this.enchargesSerialNumber[i]}`;
                    const value = (plcLevel[key] || 0) * 20 ?? 0;

                    if (this.enchargesService) {
                        this.enchargesService[i]
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
                const mqtt = this.mqttConnected ? this.mqtt.send('PLC Level', plcLevel) : false;
                resolve();
            } catch (error) {
                this.checkCommLevel = false;
                reject(`Requesting plc level error: ${error}.`);
            };
        });
    };

    getDeviceInfo() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting log device info.`) : false;

        this.emit('devInfo', `-------- ${this.name} --------`);
        this.emit('devInfo', `Manufacturer: Enphase`);
        this.emit('devInfo', `Model: ${this.envoyModelName}`);
        this.emit('devInfo', `Firmware: ${this.envoyFirmware}`);
        this.emit('devInfo', `SerialNr: ${this.envoySerialNumber}`);
        this.emit('devInfo', `Time: ${this.envoyTime}`);
        this.emit('devInfo', `------------------------------`);
        this.emit('devInfo', `Q-Relays: ${this.qRelaysCount}`);
        this.emit('devInfo', `Inverters: ${this.microinvertersCount}`);
        this.emit('devInfo', `Batteries: ${this.acBatteriesCount}`);
        this.emit('devInfo', `--------------------------------`);
        if (this.metersSupported) {
            this.emit('devInfo', `Meters: ${this.metersSupported ? `Yes` : `No`}`);
            this.emit('devInfo', `Production: ${this.metersProductionEnabled ? `Enabled` : `Disabled`}`);
            this.emit('devInfo', `Consumption: ${this.metersConsumptionEnabled ? `Enabled` : `Disabled`}`);
            const emit = this.ensemblesInstalled ? this.emit('devInfo', `Storage: ${this.metersStorageEnabled ? `Enabled` : `Disabled`}`) : false;
            this.emit('devInfo', `--------------------------------`);
        }
        if (this.envoyFirmware7xx) {
            const displayLog = this.ensemblesInstalled ? this.emit('devInfo', `Ensemble: Yes`) : false;
            const displayLog1 = this.enpowersInstalled ? this.emit('devInfo', `Enpowers: Yes ${this.enpowersCount}`) : false;
            const displayLog2 = this.enchargesInstalled ? this.emit('devInfo', `Encharges: Yes ${this.enchargesCount}`) : false;
            const displayLog3 = this.wirelessConnectionKitInstalled ? this.emit('devInfo', `Wireless Kit: Yes ${this.wirelessConnectionKitConnectionsCount}`) : false;
            const displayLog4 = this.ensemblesInstalled || this.enpowersInstalled || this.enchargesInstalled || this.wirelessConnectionKitInstalled ? this.emit('devInfo', `--------------------------------`) : false;
        }
    };

    //Prepare accessory
    prepareAccessory() {
        return new Promise((resolve, reject) => {
            try {
                //prepare accessory
                const debug = this.enableDebugMode ? this.emit('debug', `Prepare accessory`) : false;
                const serialNumber = this.envoySerialNumber;
                const accessoryName = this.name;
                const accessoryUUID = UUID.generate(serialNumber);
                const accessoryCategory = Categories.BRIDGE;
                const accessory = new Accessory(accessoryName, accessoryUUID, accessoryCategory);

                //information service
                const debug1 = this.enableDebugMode ? this.emit('debug', `Prepare Information Service`) : false;
                accessory.getService(Service.AccessoryInformation)
                    .setCharacteristic(Characteristic.Manufacturer, 'Enphase')
                    .setCharacteristic(Characteristic.Model, this.envoyModelName ?? 'Model Name')
                    .setCharacteristic(Characteristic.SerialNumber, this.envoySerialNumber ?? 'Serial Number')
                    .setCharacteristic(Characteristic.FirmwareRevision, this.envoyFirmware ?? 'Firmware');

                //get enabled devices
                const metersSupported = this.metersSupported;
                const metersCount = this.metersCount;
                const metersProductionEnabled = this.metersProductionEnabled;
                const metersConsumptionEnabled = this.metersConsumptionEnabled;
                const metersConsumptionCount = this.metersConsumptionCount;
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
                this.systemPvService = new Service.Lightbulb(accessoryName, `systemPvService`);
                this.systemPvService.getCharacteristic(Characteristic.On)
                    .onGet(async () => {
                        const state = this.productionPowerState;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, production power state: ${state ? 'Active' : 'Not active'}`);
                        return state;
                    })
                    .onSet(async (state) => {
                        try {
                            this.systemPvService.updateCharacteristic(Characteristic.On, this.productionPowerState);
                        } catch (error) {
                            this.emit('error', `envoy: ${serialNumber}, set production power state error: ${error}`);
                        };
                    })
                this.systemPvService.getCharacteristic(Characteristic.Brightness)
                    .onGet(async () => {
                        const state = this.productionPowerLevel;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, production power level: ${this.productionPowerLevel} %`);
                        return state;
                    })
                    .onSet(async (value) => {
                        try {
                            this.systemPvService.updateCharacteristic(Characteristic.Brightness, this.productionPowerLevel);
                        } catch (error) {
                            this.emit('error', `envoy: ${serialNumber}, set production power level error: ${error}`);
                        };
                    })
                accessory.addService(this.systemPvService);

                //envoy
                const debug3 = this.enableDebugMode ? this.emit('debug', `Prepare Envoy Service`) : false;
                this.envoyService = new Service.enphaseEnvoyService(`Envoy ${serialNumber}`, 'enphaseEnvoyService');
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
                        const value = (`${this.envoyCommNum} / ${this.envoyCommLevel}`);
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication devices and level: ${value} %`);
                        return value;
                    });
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel)
                    .onGet(async () => {
                        const value = (`${this.envoyCommNsrbNum} / ${this.envoyCommNsrbLevel}`);
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication qRelays and level: ${value} %`);
                        return value;
                    });
                this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel)
                    .onGet(async () => {
                        const value = (`${this.envoyCommPcuNum} / ${this.envoyCommPcuLevel}`);
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication Microinverters and level: ${value} %`);
                        return value;
                    });
                if (acBatteriesInstalled) {
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel)
                        .onGet(async () => {
                            const value = (`${this.envoyCommAcbNum} / ${this.envoyCommAcbLevel}`);
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication AC Batteries and level ${value} %`);
                            return value;
                        });
                }
                if (enchargesInstalled) {
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumEnchgAndLevel)
                        .onGet(async () => {
                            const value = (`${this.envoyCommEnchgNum} / ${this.envoyCommEnchgLevel}`);
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication Encharges and level ${value} %`);
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
                            const value = this.envoyEnpowerConnected;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, enpower connected: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyEnpowerGridStatus)
                        .onGet(async () => {
                            const value = this.envoyEnpowerGridStatus;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, enpower grid status: ${value}`);
                            return value;
                        });
                }
                if (plcLevelSupported) {
                    this.envoyService.getCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel)
                        .onGet(async () => {
                            const state = this.checkCommLevel;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, checking plc level: ${state ? `Yes` : `No`}`);
                            return state;
                        })
                        .onSet(async (state) => {
                            try {
                                const checkCommLevel = state ? await this.updatePlcLevelData() : false;
                                const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, check plc level: ${state ? `Yes` : `No`}`);
                            } catch (error) {
                                this.emit('error', `envoy: ${serialNumber}, check plc level error: ${error}`);
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
                                const powerModeUrl = CONSTANS.ApiUrls.PowerForcedModePutGet.replace("EID", this.envoyDevId);
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

                                const powerModeData = await this.digestAuthInstaller.request(powerModeUrl, options);
                                const debug = this.enableDebugMode ? this.emit('debug', ` debug set production power mode: ${state ? 'Enabled' : 'Disabled'}`) : false;
                            } catch (error) {
                                this.emit('error', `envoy: ${serialNumber}, set production power mode error: ${error}`);
                            };
                        });
                }
                accessory.addService(this.envoyService);

                //qrelays
                if (qRelaysInstalled) {
                    this.qRelaysService = [];
                    for (let i = 0; i < qRelaysCount; i++) {
                        const qRelaySerialNumber = this.qRelaysSerialNumber[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Q-Relay ${qRelaySerialNumber} Service`) : false;
                        const enphaseQrelayService = new Service.enphaseQrelayService(`Q-Relay ${qRelaySerialNumber}`, `enphaseQrelayService${i}`);
                        enphaseQrelayService.setCharacteristic(Characteristic.ConfiguredName, `Q-Relay ${qRelaySerialNumber}`);
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
                        enphaseQrelayService.getCharacteristic(Characteristic.enphaseQrelayProducing)
                            .onGet(async () => {
                                const value = this.qRelaysProducing[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${qRelaySerialNumber}, producing: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
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
                                    const value = this.qRelaysCommLevel[i] || 0;
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
                                const value = this.qRelaysLastReportDate[i] || '';
                                const info = this.disableLogInfo ? false : this.emit('message', `Q-Relay: ${qRelaySerialNumber}, last report: ${value}`);
                                return value;
                            });
                        this.qRelaysService.push(enphaseQrelayService);
                        accessory.addService(enphaseQrelayService);
                    }
                }

                //meters
                if (metersSupported) {
                    this.metersService = [];
                    for (let i = 0; i < metersCount; i++) {
                        const meterMeasurementType = this.metersMeasurementType[i];
                        const meterState = this.metersState[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Meter ${meterMeasurementType} Service`) : false;
                        const enphaseMeterService = new Service.enphaseMeterService(`Meter ${meterMeasurementType}`, `enphaseMeterService${i}`);
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
                                    const value = this.timestampSumm[i] || '';
                                    const info = this.disableLogInfo ? false : this.emit('message', `Meter: ${meterMeasurementType}, last report: ${value}`);
                                    return value;
                                });
                        }
                        this.metersService.push(enphaseMeterService);
                        accessory.addService(enphaseMeterService);
                    }
                }

                //production
                const debug4 = this.enableDebugMode ? this.emit('debug', `Prepare Production Power And Energy Service`) : false;
                this.productionsService = new Service.enphasePowerAndEnergyService(`Production Power And Energy`, 'enphaseProductionService');
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
                            this.emit('debug', `Production Power Peak reset error: ${error}`);
                        };
                    });
                accessory.addService(this.productionsService);

                //production state sensor service
                const powerProductionStateSensor = this.powerProductionStateSensor.mode || false;
                if (powerProductionStateSensor) {
                    const sensorName = this.powerProductionStateSensor.name || `Production power state`;
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Production Power State Sensor Service`) : false;
                    this.powerProductionStateSensorService = new Service.ContactSensor(sensorName, `powerProductionStateSensorService`);
                    this.powerProductionStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                    this.powerProductionStateSensorService.getCharacteristic(Characteristic.ContactSensorState)
                        .onGet(async () => {
                            const state = this.productionPowerState;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production power state sensor: ${state ? 'Active' : 'Not active'}`);
                            return state;
                        });
                    accessory.addService(this.powerProductionStateSensorService);
                };

                //production power level sensors service
                if (this.powerProductionLevelActiveSensorsCount > 0) {
                    this.powerProductionLevelSensorsService = [];
                    for (let i = 0; i < this.powerProductionLevelActiveSensorsCount; i++) {
                        const sensorName = this.powerProductionLevelActiveSensors[i].name || `Production power level ${i}`;
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Production Power Level ${sensorName} Sensor Service`) : false;
                        const powerProductionLevelSensorsService = new Service.ContactSensor(sensorName, `powerProductionLevelSensorsService${i}`);
                        powerProductionLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                        powerProductionLevelSensorsService.getCharacteristic(Characteristic.ContactSensorState)
                            .onGet(async () => {
                                const state = this.powerProductionLevelActiveSensorsState[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Production power level sensor: ${sensorName}: ${state ? 'Active' : 'Not active'}`);
                                return state;
                            });
                        this.powerProductionLevelSensorsService.push(powerProductionLevelSensorsService);
                        accessory.addService(powerProductionLevelSensorsService);
                    };
                };

                //production energy state sensor service
                const energyProductionStateSensor = this.energyProductionStateSensor.mode || false;
                if (energyProductionStateSensor) {
                    const sensorName = this.energyProductionStateSensor.name || `Production energy state`;
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Production Energy State Sensor Service`) : false;
                    this.energyProductionStateSensorService = new Service.ContactSensor(sensorName, `energyProductionStateSensorService`);
                    this.energyProductionStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                    this.energyProductionStateSensorService.getCharacteristic(Characteristic.ContactSensorState)
                        .onGet(async () => {
                            const state = this.productionEnergyState;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production energy state sensor: ${state ? 'Active' : 'Not active'}`);
                            return state;
                        });
                    accessory.addService(this.energyProductionStateSensorService);
                };

                //production energy level sensor service
                if (this.energyProductionLevelActiveSensorsCount > 0) {
                    this.energyProductionLevelSensorsService = [];
                    for (let i = 0; i < this.energyProductionLevelActiveSensorsCount; i++) {
                        const sensorName = this.energyProductionLevelActiveSensors[i].name || `Production energy level ${i}`;
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Production Energy Level ${sensorName} Sensor Service`) : false;
                        const energyProductionLevelSensorsService = new Service.ContactSensor(sensorName, `energyProductionLevelSensorsService${i}`);
                        energyProductionLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                        energyProductionLevelSensorsService.getCharacteristic(Characteristic.ContactSensorState)
                            .onGet(async () => {
                                const state = this.energyProductionLevelActiveSensorsState[i] || false;
                                const info = this.disableLogInfo ? false : this.emit('message', `Production energy level sensor: ${sensorName}: ${state ? 'Active' : 'Not active'}`);
                                return state;
                            });
                        this.energyProductionLevelSensorsService.push(energyProductionLevelSensorsService);
                        accessory.addService(energyProductionLevelSensorsService);
                    };
                };

                //power and energy consumption
                if (metersSupported && metersConsumptionEnabled) {
                    this.consumptionsService = [];
                    for (let i = 0; i < metersConsumptionCount; i++) {
                        const consumptionMeasurmentType = this.consumptionsMeasurmentType[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Power And Energy Service`) : false;
                        const enphaseConsumptionService = new Service.enphasePowerAndEnergyService(`${consumptionMeasurmentType} Power And Energy`, `enphaseConsumptionService${i}`);
                        enphaseConsumptionService.setCharacteristic(Characteristic.ConfiguredName, `${consumptionMeasurmentType} Power And Energy`);
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePower)
                            .onGet(async () => {
                                const value = this.consumptionsPower[i] || 0;
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power: ${value} kW`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePowerMax)
                            .onGet(async () => {
                                const value = this.consumptionsPowerPeak[i] || 0;
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power peak: ${value} kW`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePowerMaxDetected)
                            .onGet(async () => {
                                const value = this.consumptionsPowerPeakDetected[i] || 0;
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power peak detected: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyToday)
                            .onGet(async () => {
                                const value = this.consumptionsEnergyToday[i] || 0;
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} energy today: ${value} kWh`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
                            .onGet(async () => {
                                const value = this.consumptionsEnergyLastSevenDays[i] || 0;
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} energy last seven days: ${value} kWh`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
                            .onGet(async () => {
                                const value = this.consumptionsEnergyLifeTime[i] || 0;
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} energy lifetime: ${value} kWh`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseRmsCurrent)
                            .onGet(async () => {
                                const value = this.consumptionsRmsCurrent[i] || 0;
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} current: ${value} A`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseRmsVoltage)
                            .onGet(async () => {
                                const value = this.consumptionsRmsVoltage[i] || 0;
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} voltage: ${value} V`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseReactivePower)
                            .onGet(async () => {
                                const value = this.consumptionsReactivePower[i] || 0;
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} reactive power: ${value} kVAr`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseApparentPower)
                            .onGet(async () => {
                                const value = this.consumptionsApparentPower[i] || 0;
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphasePwrFactor)
                            .onGet(async () => {
                                const value = this.consumptionsPwrFactor[i] || 0;
                                const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power factor: ${value} cos φ`);
                                return value;
                            });
                        enphaseConsumptionService.getCharacteristic(Characteristic.enphaseReadingTime)
                            .onGet(async () => {
                                const value = this.consumptionsReadingTime[i] || '';
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
                        this.consumptionsService.push(enphaseConsumptionService);
                        accessory.addService(enphaseConsumptionService);

                        //total
                        if (i === 0) {
                            //consumption total state sensor service
                            const powerConsumptionTotalStateSensor = this.powerConsumptionTotalStateSensor.mode || false;
                            if (powerConsumptionTotalStateSensor) {
                                const sensorName = this.powerConsumptionTotalStateSensor.name || `Consumption total power state`;
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Power State Sensor Service`) : false;
                                this.powerConsumptionTotalStateSensorService = new Service.ContactSensor(sensorName, `powerConsumptionTotalStateSensorService`);
                                this.powerConsumptionTotalStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                this.powerConsumptionTotalStateSensorService.getCharacteristic(Characteristic.ContactSensorState)
                                    .onGet(async () => {
                                        const state = this.consumptionsPowerState[i] || false;
                                        const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power state sensor: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                accessory.addService(this.powerConsumptionTotalStateSensorService);
                            };

                            //consumption total power peak sensors service
                            if (this.powerConsumptionTotalLevelActiveSensorsCount > 0) {
                                this.powerConsumptionTotalLevelSensorsService = [];
                                for (let i = 0; i < this.powerConsumptionTotalLevelActiveSensorsCount; i++) {
                                    const sensorName = this.powerConsumptionTotalLevelActiveSensors[i].name || `Consumption total power level ${i}`;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Power Level ${sensorName} Sensor Service`) : false;
                                    const powerConsumptionTotalLevelSensorsService = new Service.ContactSensor(sensorName, `powerConsumptionTotalLevelSensorsService${i}`);
                                    powerConsumptionTotalLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    powerConsumptionTotalLevelSensorsService.getCharacteristic(Characteristic.ContactSensorState)
                                        .onGet(async () => {
                                            const state = this.powerConsumptionTotalLevelActiveSensorsState[i] || false;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Consumption total power level sensor: ${sensorName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.powerConsumptionTotalLevelSensorsService.push(powerConsumptionTotalLevelSensorsService);
                                    accessory.addService(powerConsumptionTotalLevelSensorsService);
                                };
                            };

                            //consumption total energy state sensor service
                            const energyConsumptionTotalStateSensor = this.energyConsumptionTotalStateSensor.mode || false;
                            if (energyConsumptionTotalStateSensor) {
                                const sensorName = this.energyConsumptionTotalStateSensor.name || `Consumption total energy state`;
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Energy State Sensor Service`) : false;
                                this.energyConsumptionTotalStateSensorService = new Service.ContactSensor(sensorName, `energyConsumptionTotalStateSensorService`);
                                this.energyConsumptionTotalStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                this.energyConsumptionTotalStateSensorService.getCharacteristic(Characteristic.ContactSensorState)
                                    .onGet(async () => {
                                        const state = this.consumptionsEnergyState[i];
                                        const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} energy state sensor: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                accessory.addService(this.energyConsumptionTotalStateSensorService);
                            };

                            //consumption total energy level sensor service
                            if (this.energyConsumptionTotalLevelActiveSensorsCount > 0) {
                                this.energyConsumptionTotalLevelSensorsService = [];
                                for (let i = 0; i < this.energyConsumptionTotalLevelActiveSensorsCount; i++) {
                                    const sensorName = this.energyConsumptionTotalLevelActiveSensors[i].name || `Consumption total energy level ${i}`;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Energy Level ${sensorName} Sensor Service`) : false;
                                    const energyConsumptionTotalLevelSensorsService = new Service.ContactSensor(sensorName, `energyConsumptionTotalLevelSensorsService${i}`);
                                    energyConsumptionTotalLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    energyConsumptionTotalLevelSensorsService.getCharacteristic(Characteristic.ContactSensorState)
                                        .onGet(async () => {
                                            const state = this.energyConsumptionTotalLevelActiveSensorsState[i] || false;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Consumption total energy level sensor: ${sensorName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.energyConsumptionTotalLevelSensorsService.push(energyConsumptionTotalLevelSensorsService);
                                    accessory.addService(energyConsumptionTotalLevelSensorsService);
                                };
                            };
                        };

                        //net
                        if (i === 1) {
                            //consumption total state sensor service
                            const powerConsumptionNetStateSensor = this.powerConsumptionNetStateSensor.mode || false;
                            if (powerConsumptionNetStateSensor) {
                                const sensorName = this.powerConsumptionNetStateSensor.name || `Consumption net power state`;
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Power State Sensor Service`) : false;
                                this.powerConsumptionNetStateSensorService = new Service.ContactSensor(sensorName, `powerConsumptionNetStateSensorService`);
                                this.powerConsumptionNetStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                this.powerConsumptionNetStateSensorService.getCharacteristic(Characteristic.ContactSensorState)
                                    .onGet(async () => {
                                        const state = this.consumptionsPowerState[i] || false;
                                        const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power state sensor: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                accessory.addService(this.powerConsumptionNetStateSensorService);
                            };

                            //consumption net power peak sensor service
                            if (this.powerConsumptionNetLevelActiveSensorsCount > 0) {
                                this.powerConsumptionNetLevelSensorsService = [];
                                for (let i = 0; i < this.powerConsumptionNetLevelActiveSensorsCount; i++) {
                                    const sensorName = this.powerConsumptionNetLevelActiveSensors[i].name || `Consumption net power level ${i}`;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Power Level ${sensorName} Sensor Service`) : false;
                                    const powerConsumptionNetLevelSensorsService = new Service.ContactSensor(sensorName, `powerConsumptionNetLevelSensorsService${i}`);
                                    powerConsumptionNetLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    powerConsumptionNetLevelSensorsService.getCharacteristic(Characteristic.ContactSensorState)
                                        .onGet(async () => {
                                            const state = this.powerConsumptionNetLevelActiveSensorsState[i] || false;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Consumption net power level sensor: ${sensorName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.powerConsumptionNetLevelSensorsService.push(powerConsumptionNetLevelSensorsService);
                                    accessory.addService(powerConsumptionNetLevelSensorsService);
                                };
                            };

                            //consumption net energy state sensor service
                            const energyConsumptionNetStateSensor = this.energyConsumptionNetStateSensor.mode || false;
                            if (energyConsumptionNetStateSensor) {
                                const sensorName = this.energyConsumptionNetStateSensor.name || `Consumption net energy state`;
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Energy State Sensor Service`) : false;
                                this.energyConsumptionNetStateSensorService = new Service.ContactSensor(sensorName, `energyConsumptionNetStateSensorService`);
                                this.energyConsumptionNetStateSensorService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                this.energyConsumptionNetStateSensorService.getCharacteristic(Characteristic.ContactSensorState)
                                    .onGet(async () => {
                                        const state = this.consumptionsEnergyState[i];
                                        const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} energy state sensor: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                accessory.addService(this.energyConsumptionNetStateSensorService);
                            };

                            if (this.energyConsumptionNetLevelActiveSensorsCount > 0) {
                                this.energyConsumptionNetLevelSensorsService = [];
                                for (let i = 0; i < this.energyConsumptionNetLevelActiveSensorsCount; i++) {
                                    const sensorName = this.energyConsumptionNetLevelActiveSensors[i].name || `Consumption net energy level ${i}`;
                                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} Energy Level ${sensorName} Sensor Service`) : false;
                                    const energyConsumptionNetLevelSensorsService = new Service.ContactSensor(sensorName, `energyConsumptionNetLevelSensorsService${i}`);
                                    energyConsumptionNetLevelSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                                    energyConsumptionNetLevelSensorsService.getCharacteristic(Characteristic.ContactSensorState)
                                        .onGet(async () => {
                                            const state = this.energyConsumptionNetLevelActiveSensorsState[i] || false;
                                            const info = this.disableLogInfo ? false : this.emit('message', `Consumption net energy level sensor: ${sensorName}: ${state ? 'Active' : 'Not active'}`);
                                            return state;
                                        });
                                    this.energyConsumptionNetLevelSensorsService.push(energyConsumptionNetLevelSensorsService);
                                    accessory.addService(energyConsumptionNetLevelSensorsService);
                                };
                            };
                        };
                    }
                }

                //ac batteries summary
                if (acBatteriesInstalled) {
                    //ac batteries summary level and state
                    const debug2 = this.enableDebugMode ? this.emit('debug', `Prepare AC Batteries Summary Service`) : false;
                    this.enphaseAcBatterieSummaryLevelAndStateService = new Service.Lightbulb(`AC Batteries`, `enphaseAcBatterieSummaryLevelAndStateService`);
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
                    accessory.addService(this.enphaseAcBatterieSummaryLevelAndStateService);

                    //ac batteries summary service
                    this.acBatteriesSummaryService = [];
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare AC Batteries Summary Service`) : false;
                    const enphaseAcBatterieSummaryService = new Service.enphaseAcBatterieSummaryService('AC Batteries Summary', 'enphaseAcBatterieSummaryService');
                    enphaseAcBatterieSummaryService.setCharacteristic(Characteristic.ConfiguredName, `AC Batteries Summary`);
                    enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryPower)
                        .onGet(async () => {
                            const value = this.acBatteriesSummaryPower;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries storage power: ${value} kW`);
                            return value;
                        });
                    enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryEnergy)
                        .onGet(async () => {
                            const value = this.acBatteriesSummaryEnergy;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries storage energy: ${value} kWh`);
                            return value;
                        });
                    enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryPercentFull)
                        .onGet(async () => {
                            const value = this.acBatteriesSummaryPercentFull;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries percent full: ${value}`);
                            return value;
                        });
                    enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryActiveCount)
                        .onGet(async () => {
                            const value = this.acBatteriesSummaryActiveCount;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries devices count: ${value}`);
                            return value;
                        });
                    enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryState)
                        .onGet(async () => {
                            const value = this.acBatteriesSummaryState;
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries state: ${value}`);
                            return value;
                        });
                    enphaseAcBatterieSummaryService.getCharacteristic(Characteristic.enphaseAcBatterieSummaryReadingTime)
                        .onGet(async () => {
                            const value = this.acBatteriesSummaryReadingTime || '';
                            const info = this.disableLogInfo ? false : this.emit('message', `AC Batteries last report: ${value}`);
                            return value;
                        });
                    this.acBatteriesSummaryService.push(enphaseAcBatterieSummaryService);
                    accessory.addService(enphaseAcBatterieSummaryService);

                    //ac batteries state
                    this.acBatteriesService = [];
                    for (let i = 0; i < acBatteriesCount; i++) {
                        const acBatterieSerialNumber = this.acBatteriesSerialNumber[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare AC Batterie ${acBatterieSerialNumber} Service`) : false;
                        const enphaseAcBatterieService = new Service.enphaseAcBatterieService(`AC Batterie ${acBatterieSerialNumber}`, `enphaseAcBatterieService${i}`);
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
                                    const value = this.acBatteriesCommLevel[i] || 0;
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
                        this.acBatteriesService.push(enphaseAcBatterieService);
                        accessory.addService(enphaseAcBatterieService);
                    }
                }

                //microinverters
                if (microinvertersInstalled) {
                    this.microinvertersService = [];
                    for (let i = 0; i < microinvertersCount; i++) {
                        const microinverterSerialNumber = this.microinvertersSerialNumber[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Microinverter ${microinverterSerialNumber} Service`) : false;
                        const enphaseMicroinverterService = new Service.enphaseMicroinverterService(`Microinverter ${microinverterSerialNumber}`, `enphaseMicroinverterService${i}`);
                        enphaseMicroinverterService.setCharacteristic(Characteristic.ConfiguredName, `Microinverter ${microinverterSerialNumber}`);
                        if (microinvertersPowerSupported) {
                            enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterPower)
                                .onGet(async () => {
                                    let value = this.microinvertersLastPower[i] || 0;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Microinverter: ${microinverterSerialNumber}, last power: ${value} W`);
                                    return value;
                                });
                            enphaseMicroinverterService.getCharacteristic(Characteristic.enphaseMicroinverterPowerMax)
                                .onGet(async () => {
                                    const value = this.microinvertersMaxPower[i] || 0;
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
                                    const value = this.microinvertersCommLevel[i] || 0;
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
                        this.microinvertersService.push(enphaseMicroinverterService);
                        accessory.addService(enphaseMicroinverterService);
                    }
                }

                //ensembles
                if (ensemblesInstalled) {
                    this.ensemblesService = [];
                    for (let i = 0; i < ensemblesCount; i++) {
                        const ensembleSerialNumber = this.ensemblesSerialNumber[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Ensemble ${ensembleSerialNumber} Service`) : false;
                        const enphaseEnsembleService = new Service.enphaseEnsembleService(`Ensemble ${ensembleSerialNumber}`, `enphaseEnsembleService${i}`);
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
                                const value = this.ensemblesLastReportDate[i] || '';
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${ensembleSerialNumber}, last report: ${value}`);
                                return value;
                            });

                        this.ensemblesService.push(enphaseEnsembleService);
                        accessory.addService(enphaseEnsembleService);
                    }
                }

                //ensembles status summary
                if (ensembleStatusSupported) {
                    this.ensemblesStatusService = [];
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare Ensemble Summary Service`) : false;
                    const enphaseEnsembleStatusService = new Service.enphaseEnsembleStatusService(`Ensemble summary`, 'enphaseEnsembleStatusService');
                    enphaseEnsembleStatusService.setCharacteristic(Characteristic.ConfiguredName, `Ensemble summary`);
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusRestPower)
                        .onGet(async () => {
                            const value = this.ensembleRestPower;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, rest power: ${value} kW`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHz)
                        .onGet(async () => {
                            const value = this.ensembleFreqBiasHz;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L1 bias frequency: ${value} Hz`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasV)
                        .onGet(async () => {
                            const value = this.ensembleVoltageBiasV;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L1 bias voltage: ${value} V`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8)
                        .onGet(async () => {
                            const value = this.ensembleFreqBiasHzQ8;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L1 bias q8 frequency: ${value} Hz`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5)
                        .onGet(async () => {
                            const value = this.ensembleVoltageBiasVQ5;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L1 bias q5 voltage: ${value} V`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzPhaseB)
                        .onGet(async () => {
                            const value = this.ensembleFreqBiasHzPhaseB;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L2 bias frequency: ${value} Hz`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVPhaseB)
                        .onGet(async () => {
                            const value = this.ensembleVoltageBiasVPhaseB;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L2 bias voltage: ${value} V`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8PhaseB)
                        .onGet(async () => {
                            const value = this.ensembleFreqBiasHzQ8PhaseB;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L2 bias q8 frequency: ${value} Hz`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5PhaseB)
                        .onGet(async () => {
                            const value = this.ensembleVoltageBiasVQ5PhaseB;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L2 bias q5 voltage: ${value} V`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzPhaseC)
                        .onGet(async () => {
                            const value = this.ensembleFreqBiasHzPhaseC;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L3 bias frequency: ${value} Hz`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVPhaseC)
                        .onGet(async () => {
                            const value = this.ensembleVoltageBiasVPhaseC;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L3 bias voltage: ${value} V`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusFreqBiasHzQ8PhaseC)
                        .onGet(async () => {
                            const value = this.ensembleFreqBiasHzQ8PhaseC;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L3 bias q8 frequency: ${value} Hz`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusVoltageBiasVQ5PhaseC)
                        .onGet(async () => {
                            const value = this.ensembleVoltageBiasVQ5PhaseC;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, L3 bias q5 voltage: ${value} V`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusConfiguredBackupSoc)
                        .onGet(async () => {
                            const value = this.ensembleConfiguredBackupSoc;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, configured backup SoC: ${value} %`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusAdjustedBackupSoc)
                        .onGet(async () => {
                            const value = this.ensembleAdjustedBackupSoc;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, adjusted backup SoC: ${value} %`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusAggSoc)
                        .onGet(async () => {
                            const value = this.ensembleAggSoc;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, agg SoC: ${value} %`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusAggMaxEnergy)
                        .onGet(async () => {
                            const value = this.ensembleAggMaxEnergy;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, agg max energy: ${value} kWh`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusEncAggSoc)
                        .onGet(async () => {
                            const value = this.ensembleEncAggSoc;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, encharges agg SoC: ${value} %`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusEncAggRatedPower)
                        .onGet(async () => {
                            const value = this.enchargesRatedPowerSum;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, encharges agg rated power: ${value} kW`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusEncAggBackupEnergy)
                        .onGet(async () => {
                            const value = this.ensembleEncAggBackupEnergy;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, encharges agg backup energy: ${value} kWh`);
                            return value;
                        });
                    enphaseEnsembleStatusService.getCharacteristic(Characteristic.enphaseEnsembleStatusEncAggAvailEnergy)
                        .onGet(async () => {
                            const value = this.ensembleEncAggAvailEnergy;
                            const info = this.disableLogInfo ? false : this.emit('message', `Ensemble summary, encharges agg available energy: ${value} kWh`);
                            return value;
                        });
                    this.ensemblesStatusService.push(enphaseEnsembleStatusService);
                    accessory.addService(enphaseEnsembleStatusService);

                    //enpower grid state sensor services
                    if (this.enpowerGridModeActiveSensorsCount > 0) {
                        this.enpowerGridModeSensorsServices = [];
                        for (let i = 0; i < this.enpowerGridModeActiveSensorsCount; i++) {
                            const sensorName = this.enpowerGridModeActiveSensors[i].name || `Enpower Grid State Sensor ${i}`;
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower Grid State Sensor ${sensorName} Service`) : false;
                            const enpowerGridModeSensorsService = new Service.ContactSensor(sensorName, `enpowerGridModeSensorService${i}`);
                            enpowerGridModeSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                            enpowerGridModeSensorsService.getCharacteristic(Characteristic.ContactSensorState)
                                .onGet(async () => {
                                    const state = this.enpowerGridModeActiveSensorsState[i] || false;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Enpower grid state sensor: ${sensorName} state: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.enpowerGridModeSensorsServices.push(enpowerGridModeSensorsService);
                            accessory.addService(enpowerGridModeSensorsService);
                        };
                    };

                    //encharge grid state sensor services
                    if (this.enchargeGridModeActiveSensorsCount > 0) {
                        this.enchargeGridModeSensorsServices = [];
                        for (let i = 0; i < this.enchargeGridModeActiveSensorsCount; i++) {
                            const sensorName = this.enchargeGridModeActiveSensors[i].name || `Encharge Grid State Sensor ${i}`;
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare Encharge Grid State Sensor ${sensorName} Service`) : false;
                            const enchargeGridModeSensorsService = new Service.ContactSensor(sensorName, `enchargeGridModeSensorService${i}`);
                            enchargeGridModeSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                            enchargeGridModeSensorsService.getCharacteristic(Characteristic.ContactSensorState)
                                .onGet(async () => {
                                    const state = this.enchargeGridModeActiveSensorsState[i] || false;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Encharge grid state sensor: ${sensorName} state: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.enchargeGridModeSensorsServices.push(enchargeGridModeSensorsService);
                            accessory.addService(enchargeGridModeSensorsService);
                        };
                    };

                    //solar grid state sensor services
                    if (this.solarGridModeActiveSensorsCount > 0) {
                        this.solarGridModeSensorsServices = [];
                        for (let i = 0; i < this.solarGridModeActiveSensorsCount; i++) {
                            const sensorName = this.solarGridModeActiveSensors[i].name || `Solar Grid State Sensor ${i}`;
                            const debug = this.enableDebugMode ? this.emit('debug', `Prepare Solar Grid State Sensor ${sensorName} Service`) : false;
                            const solarGridModeSensorsService = new Service.ContactSensor(sensorName, `solarGridModeSensorService${i}`);
                            solarGridModeSensorsService.setCharacteristic(Characteristic.ConfiguredName, sensorName);
                            solarGridModeSensorsService.getCharacteristic(Characteristic.ContactSensorState)
                                .onGet(async () => {
                                    const state = this.solarGridModeActiveSensorsState[i] || false;
                                    const info = this.disableLogInfo ? false : this.emit('message', `Solar grid state sensor: ${sensorName} state: ${state ? 'Active' : 'Not active'}`);
                                    return state;
                                });
                            this.solarGridModeSensorsServices.push(solarGridModeSensorsService);
                            accessory.addService(solarGridModeSensorsService);
                        };
                    };
                }

                //encharges
                if (enchargesInstalled) {
                    //encharges summary level and state
                    const debug2 = this.enableDebugMode ? this.emit('debug', `Prepare Encharges Summary Service`) : false;
                    this.enphaseEnchargesSummaryLevelAndStateService = new Service.Lightbulb(`Encharges`, `enphaseEnchargesSummaryLevelAndStateService`);
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
                                this.emit('error', `envoy: ${serialNumber}, set Encharges energy state error: ${error}`);
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
                                this.emit('error', `envoy: ${serialNumber}, set Encharges energy level error: ${error}`);
                            };
                        })
                    accessory.addService(this.enphaseEnchargesSummaryLevelAndStateService);

                    //encharges services
                    this.enchargesService = [];
                    for (let i = 0; i < enchargesCount; i++) {
                        const enchargeSerialNumber = this.enchargesSerialNumber[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Encharge ${enchargeSerialNumber} Service`) : false;
                        const enphaseEnchargeService = new Service.enphaseEnchargeService(`Encharge ${enchargeSerialNumber}`, `enphaseEnchargeService${i}`);
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
                                    const value = this.enchargesCommLevel[i] || 0;
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
                                const value = this.ensembleGridProfileName;
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
                                const value = this.enchargesLastReportDate[i] || '';
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge: ${enchargeSerialNumber}, last report: ${value}`);
                                return value;
                            });
                        this.enchargesService.push(enphaseEnchargeService);
                        accessory.addService(enphaseEnchargeService);
                    }
                }

                //enpowers
                if (enpowersInstalled) {
                    //enpower inventory
                    this.enpowersService = [];
                    for (let i = 0; i < enpowersCount; i++) {
                        const enpowerSerialNumber = this.enpowersSerialNumber[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Enpower ${enpowerSerialNumber} Service`) : false;
                        const enphaseEnpowerService = new Service.enphaseEnpowerService(`Enpower ${enpowerSerialNumber}`, `enphaseEnpowerService${i}`);
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
                                const value = this.enpowersGridMode[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${enpowerSerialNumber}, enpower grid mode: ${value}`);
                                return value;
                            });
                        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerEnchgGridMode)
                            .onGet(async () => {
                                const value = this.enpowersEnchgGridMode[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${enpowerSerialNumber}, encharge grid mode: ${value}`);
                                return value;
                            });
                        enphaseEnpowerService.getCharacteristic(Characteristic.enphaseEnpowerGridProfile)
                            .onGet(async () => {
                                const value = this.ensembleGridProfileName;
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
                                const value = this.enpowersLastReportDate[i] || '';
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower: ${enpowerSerialNumber}, last report: ${value}`);
                                return value;
                            });
                        this.enpowersService.push(enphaseEnpowerService);
                        accessory.addService(enphaseEnpowerService);
                    };
                }

                //live data
                if (liveDataSupported) {
                    this.liveDataMetersService = [];
                    for (let i = 0; i < this.liveDataMetersCount; i++) {
                        const liveDataType = this.liveDataTypes[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Live Data ${liveDataType} Service`) : false;
                        const enphaseLiveDataService = new Service.enphaseLiveDataService(`Live Data ${liveDataType}`, `enphaseLiveDataService${i}`);
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
                        this.liveDataMetersService.push(enphaseLiveDataService);
                        accessory.addService(enphaseLiveDataService);
                    }
                }

                //wireless connektion kit
                if (wirelessConnectionKitInstalled) {
                    this.wirelessConnektionsKitService = [];
                    for (let i = 0; i < wirelessConnectionKitConnectionsCount; i++) {
                        const wirelessConnectionType = this.wirelessConnectionsType[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Wireless Connection ${wirelessConnectionType} Service`) : false;
                        const enphaseWirelessConnectionKitService = new Service.enphaseWirelessConnectionKitService(`Wireless connection ${wirelessConnectionType}`, `enphaseWirelessConnectionKitService${i}`);
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
                        this.wirelessConnektionsKitService.push(enphaseWirelessConnectionKitService);
                        accessory.addService(enphaseWirelessConnectionKitService);
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
