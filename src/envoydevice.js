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
        this.powerProductionStateSensor = config.powerProductionStateSensor || false;
        this.powerProductionPeakSensor = config.powerProductionPeakSensor || false;
        this.powerProductionPeakSensorDetected = config.powerProductionPeakSensorDetected || 0;
        this.powerProductionPeakAutoReset = config.powerProductionPeakAutoReset || 0;
        this.energyProductionStateSensor = config.energyProductionStateSensor || false;
        this.energyProductionLevelSensor = config.energyProductionLevelSensor || false;
        this.energyProductionLevelSensorDetected = config.energyProductionLevelSensorDetected || 0;
        this.energyProductionLifetimeOffset = config.energyProductionLifetimeOffset || 0;

        this.powerConsumptionTotalStateSensor = config.powerConsumptionTotalStateSensor || false;
        this.powerConsumptionTotalPeakSensor = config.powerConsumptionTotalPeakSensor || false;
        this.powerConsumptionTotalPeakSensorDetected = config.powerConsumptionTotalPeakSensorDetected || 0;
        this.powerConsumptionTotalPeakAutoReset = config.powerConsumptionTotalPeakAutoReset || 0;
        this.energyConsumptionTotaStateSensor = config.energyConsumptionTotaStateSensor || false;
        this.energyConsumptionTotaLevelSensor = config.energyConsumptionTotaLevelSensor || false;
        this.energyConsumptionTotaLevelSensorDetected = config.energyConsumptionTotaLevelSensorDetected || 0;
        this.energyConsumptionTotalLifetimeOffset = config.energyConsumptionTotalLifetimeOffset || 0;

        this.powerConsumptionNetStateSensor = config.powerConsumptionNetStateSensor || false;
        this.powerConsumptionNetPeakSensor = config.powerConsumptionNetPeakSensor || false;
        this.powerConsumptionNetPeakSensorDetected = config.powerConsumptionNetPeakSensorDetected || 0;
        this.powerConsumptionNetPeakAutoReset = config.powerConsumptionNetPeakAutoReset || 0;
        this.energyConsumptionNetStateSensor = config.energyConsumptionNetStateSensor || false;
        this.energyConsumptionNetLevelSensor = config.energyConsumptionNetLevelSensor || false;
        this.energyConsumptionNetLevelSensorDetected = config.energyConsumptionNetLevelSensorDetected || 0;
        this.energyConsumptionNetLifetimeOffset = config.energyConsumptionNetLifetimeOffset || 0;

        this.supportEnsembleStatus = this.envoyFirmware7xx ? config.supportEnsembleStatus : false;
        this.supportLiveData = this.envoyFirmware7xx ? config.supportLiveData : false;
        this.supportProductionPowerMode = !this.envoyFirmware7xx ? config.supportProductionPowerMode : false;
        this.supportPlcLevel = !this.envoyFirmware7xx ? config.supportPlcLevel : false;
        this.metersDataRefreshTime = config.metersDataRefreshTime || 2500;
        this.productionDataRefreshTime = config.productionDataRefreshTime || 5000;
        this.liveDataRefreshTime = config.liveDataRefreshTime || 1000;

        this.enpowerGridStateSensor = this.supportEnsembleStatus ? config.enpowerGridStateSensor : false;
        this.enchargeGridStateSensor = this.supportEnsembleStatus ? config.enchargeGridStateSensor : false;
        this.solarGridStateSensor = this.supportEnsembleStatus ? config.solarGridStateSensor : false;

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
        this.envoyEnpowerGridStatus = 'Unknown';

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
        this.enchargesGridState = false;

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
        this.productionEnergyLevelDetected = false;
        this.productionRmsCurrent = 0;
        this.productionRmsVoltage = 0;
        this.productionReactivePower = 0;
        this.productionApparentPower = 0;
        this.productionPwrFactor = 0;
        this.productionReadingTime = '';

        //consumption CT
        this.consumptionTotalPowerState = false;
        this.consumptionTotalPowerPeakDetected = false;
        this.consumptionTotalEnergyState = false;
        this.consumptionTotalEnergyLevelDetected = false;
        this.consumptionNetEnergyState = false;
        this.consumptionNetPowerState = false;
        this.consumptionNetPowerPeakDetected = false;
        this.consumptionNetEnergyLevelDetected = false;

        //liveData
        this.liveDataSupported = false;

        //production power mode
        this.productionPowerModeSupported = false;
        this.productionPowerMode = false;

        //plc level
        this.plcLevelSupported = false;

        //sensor grid state
        this.enpowerGridState = false;
        this.enchargeGridState = false;
        this.solarGridState = false;

        this.url = this.envoyFirmware7xx ? `https://${this.host}` : `http://${this.host}`;

        //current day of week/month
        const date = new Date();
        this.currentDayOfWeek = date.getDay();
        this.currentDayOfMonth = date.getDate();

        //check files exists, if not then create it
        const postFix = this.host.split('.').join('');
        this.envoyIdFile = (`${prefDir}/envoyId_${postFix}`);
        this.envoyTokenFile = (`${prefDir}/envoyToken_${postFix}`);
        this.envoyInstallerPasswordFile = (`${prefDir}/envoyInstallerPassword_${postFix}`);
        this.productionPowerPeakFile = (`${prefDir}/productionPowerPeak_${postFix}`);
        this.consumptionNetPowerPeakFile = (`${prefDir}/consumptionNetPowerPeak_${postFix}`);
        this.consumptionTotalPowerPeakFile = (`${prefDir}/consumptionTotalPowerPeak_${postFix}`);

        try {
            const files = [
                this.envoyIdFile,
                this.envoyTokenFile,
                this.envoyInstallerPasswordFile,
                this.productionPowerPeakFile,
                this.consumptionNetPowerPeakFile,
                this.consumptionTotalPowerPeakFile,
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
            const metersInstalled = this.metersSupported ? await this.updateMetersData() : false;
            const updateMetersReadingData = metersInstalled ? await this.updateMetersReadingData() : false;

            //get ensemble data only FW. >= 7.x.x.
            const updateEnsembleInventoryData = validJwtToken ? await this.updateEnsembleInventoryData() : false;
            const updateEnsembleStatusData = this.supportEnsembleStatus ? await this.updateEnsembleStatusData() : false;
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
                const startMetersReading = metersInstalled ? this.updateMeters() : false;
                const startEnsembleInventory = updateEnsembleInventoryData ? this.updateEnsembleInventory() : false;
                const startLive = updateLiveData ? this.updateLive() : false;
                const starProduction = updateProductionData ? this.updateProduction() : false;
                const startMicroinverters = updateMicroinvertersData ? this.updateMicroinverters() : false;
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
            //check token expired and refresh
            const tokenExpired = this.envoyFirmware7xx && Math.floor(new Date().getTime() / 1000) > this.tokenExpiresAt ? true : false;
            const updateJwtToken = tokenExpired ? this.refreshToken() : false;

            //update home data
            await this.updateHomeData();
            await this.updateInventoryData();
        } catch (error) {
            const match = error.match(STATUSCODEREGEX);
            const refreshToken = match && match[1] === '401';
            const refreshJwtToken = this.envoyFirmware7xx && refreshToken ? this.refreshToken() : this.emit('error', `${error} Trying again.`);
        };

        await new Promise(resolve => setTimeout(resolve, 60000));
        this.updateHome();
    };

    async updateMeters() {
        try {
            const metersInstalled = await this.updateMetersData();
            const updateMetersReadingData = metersInstalled ? await this.updateMetersReadingData() : false;
        } catch (error) {
            const match = error.match(STATUSCODEREGEX);
            const refreshToken = match && match[1] === '401';
            const refreshJwtToken = this.envoyFirmware7xx && refreshToken ? this.refreshToken() : this.emit('error', `${error} Trying again.`);
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
            const refreshToken = match && match[1] === '401';
            const refreshJwtToken = this.envoyFirmware7xx && refreshToken ? this.refreshToken() : this.emit('error', `${error} Trying again.`);
        };

        await new Promise(resolve => setTimeout(resolve, 70000));
        this.updateEnsembleInventory();
    };

    async updateLive() {
        try {
            await this.updateLiveData();
        } catch (error) {
            const match = error.match(STATUSCODEREGEX);
            const refreshToken = match && match[1] === '401';
            const refreshJwtToken = this.envoyFirmware7xx && refreshToken ? this.refreshToken() : this.emit('error', `${error} Trying again.`);
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
            const refreshToken = match && match[1] === '401';
            const refreshJwtToken = this.envoyFirmware7xx && refreshToken ? this.refreshToken() : this.emit('error', `${error} Trying again.`);
        };

        await new Promise(resolve => setTimeout(resolve, this.productionDataRefreshTime));
        this.updateProduction();
    };

    async updateMicroinverters() {
        try {
            await this.updateMicroinvertersData();
        } catch (error) {
            const match = error.match(STATUSCODEREGEX);
            const refreshToken = match && match[1] === '401';
            const refreshJwtToken = this.envoyFirmware7xx && refreshToken ? this.refreshToken() : this.emit('error', `${error} Trying again.`);
        };

        await new Promise(resolve => setTimeout(resolve, 80000));
        this.updateMicroinverters();
    };

    async refreshToken() {
        const debug = this.enableDebugMode ? this.emit('debug', `Requesting refresh JWT token.`) : false;

        try {
            //get and validate jwt token
            const getJwtToken = await this.getJwtToken();
            const validJwtToken = getJwtToken ? await this.validateJwtToken() : false;
        } catch (error) {
            this.emit('error', `Refresh JWT token error: ${error} Trying again.`);
        };
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
                        keepAlive: true,
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
                        keepAlive: true,
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
                const debug = this.enableDebugMode ? this.emit('debug', `Info: ${JSON.stringify(infoData.data, null, 2)}`) : false;

                //parse info
                const options = {
                    ignoreAttributes: false,
                    ignorePiTags: true,
                    allowBooleanAttributes: true
                };
                const parseString = new XMLParser(options);
                const parseInfoData = parseString.parse(infoData.data);
                const debug1 = this.enableDebugMode ? this.emit('debug', `Parse info: ${JSON.stringify(parseInfoData, null, 2)}`) : false;

                //envoy info
                const envoyInfo = parseInfoData.envoy_info;
                const time = new Date(envoyInfo.time * 1000).toLocaleString();
                const envoyKeys = Object.keys(envoyInfo);

                //device
                const device = envoyInfo.device;
                const deviceSn = this.envoySerialNumber ? this.envoySerialNumber : device.sn.toString();
                const devicePn = CONSTANS.PartNumbers[device.pn] || 'Envoy';
                const deviceSoftware = device.software;
                const deviceEuaid = device.euaid;
                const deviceSeqNum = device.seqnum;
                const deviceApiVer = device.apiver;
                const deviceImeter = device.imeter;

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
                const releaseVer = build.release_ver || 'Unknown';
                const releaseStage = build.release_stage || 'Unknown';

                //envoy password
                const envoyPasswd = this.envoyPasswd || deviceSn.substring(6);
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
                this.envoyFirmware = deviceSoftware;
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
                const debug = this.enableDebugMode ? this.emit('debug', `Home: ${JSON.stringify(homeData.data, null, 2)}`) : false;

                //home
                const envoy = homeData.data;
                const envoyKeys = Object.keys(envoy);
                const wirelessConnectionKitSupported = envoyKeys.includes('wireless_connection');
                const enpowersSupported = envoyKeys.includes('enpower');

                const envoyCommKeys = Object.keys(envoy.comm);
                const microinvertersSupported = envoyCommKeys.includes('pcu');
                const acBatteriesSupported = envoyCommKeys.includes('acb');
                const qRelaysSupported = envoyCommKeys.includes('nsrb');
                const ensemblesSupported = envoyCommKeys.includes('esub');
                const enchargesSupported = envoyCommKeys.includes('encharge');
                const generatorsSupported = envoyCommKeys.includes('encharge');

                //envoy
                const softwareBuildEpoch = new Date(envoy.software_build_epoch * 1000).toLocaleString();
                const isEnvoy = envoy.is_nonvoy === false || true;
                const dbSize = envoy.db_size || 0;
                const dbPercentFull = envoy.db_percent_full || 0;
                const timeZone = envoy.timezone;
                const currentDate = new Date(envoy.current_date).toLocaleString().slice(0, 11);
                const currentTime = envoy.current_time;

                //network
                const envoyNework = envoy.network;
                const webComm = envoyNework.web_comm === true;
                const everReportedToEnlighten = envoyNework.ever_reported_to_enlighten === true;
                const lastEnlightenReporDate = new Date(envoyNework.last_enlighten_report_time * 1000).toLocaleString();
                const primaryInterface = CONSTANS.ApiCodes[envoyNework.primary_interface] || 'Undefined';
                const envoyNetworkInterfaces = envoyNework.interfaces;
                const envoyNetworkInterfacesCount = envoyNetworkInterfaces.length;
                if (envoyNetworkInterfacesCount > 0) {
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
                            const envoyInterfaceType = CONSTANS.ApiCodes[envoyNetworkInterfaces[0].type] || 'Undefined';
                            const envoyInterfaceInterface = envoyNetworkInterfaces[0].interface;
                            const envoyInterfaceDhcp = envoyNetworkInterfaces[0].dhcp;
                            const envoyInterfaceIp = envoyNetworkInterfaces[0].ip;
                            const envoyInterfaceCarrier = envoyNetworkInterfaces[0].carrier === true;
                            this.envoyInterfaceCellular = true;
                        }
                        if (envoyInterfaceLan) {
                            const envoyInterfaceType = CONSTANS.ApiCodes[envoyNetworkInterfaces[envoyInterfaceStartIndex].type] || 'Undefined';
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
                            const envoyInterfaceType = CONSTANS.ApiCodes[envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].type] || 'Undefined';
                            const envoyInterfaceInterface = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].interface;
                            const envoyInterfaceMac = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].mac;
                            const envoyInterfaceDhcp = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].dhcp;
                            const envoyInterfaceIp = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].ip;
                            const envoyInterfaceCarrier = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].carrier === true;
                            const envoyInterfaceSupported = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].supported;
                            const envoyInterfacePresent = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].present;
                            const envoyInterfaceConfigured = envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].configured;
                            const envoyInterfaceStatus = CONSTANS.ApiCodes[envoyNetworkInterfaces[envoyInterfaceStartIndex + 1].status] || 'Undefined';
                            this.envoyInterfaceWlan = true;
                        }
                    }
                    this.envoyNetworkInterfacesCount = envoyNetworkInterfacesCount;
                }
                const tariff = CONSTANS.ApiCodes[envoy.tariff] || 'Undefined';

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
                const commEnsembleNum = ensemblesSupported ? commEnsemble.num : 0;
                const commEnsembleLevel = ensemblesSupported ? commEnsemble.level * 20 : 0;

                //comm encharge
                const commEncharge = enchargesSupported ? comm.encharge[0] : {};
                const commEnchargeNum = enchargesSupported ? commEncharge.num : 0;
                const commEnchargeLevel = enchargesSupported ? commEncharge.level * 20 : 0;
                const commEnchargeLevel24g = enchargesSupported ? commEncharge.level_24g * 20 : 0;
                const commEnchagLevelSubg = enchargesSupported ? commEncharge.level_subg * 20 : 0;

                const alerts = envoy.alerts || 'Unknown';
                const updateStatus = CONSTANS.ApiCodes[envoy.update_status] || 'Unknown';

                //wireless connection kit
                if (wirelessConnectionKitSupported) {
                    const wirelessConnections = envoy.wireless_connection;
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
                            const wirelessConnectionType = CONSTANS.ApiCodes[wirelessConnection.type] || 'Undefined';
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
                    this.wirelessConnectionKitConnectionsCount = wirelessConnectionKitConnectionsCount;
                    this.wirelessConnectionKitSupported = true;
                }

                //enpower
                const enpower = enpowersSupported ? envoy.enpower : {};
                const enpowerConnected = enpowersSupported ? enpower.connected === true : false;
                const enpowerGridStatus = enpowersSupported ? CONSTANS.ApiCodes[enpower.grid_status] || 'Enpower state no grid' : 'Enpower state no grid';

                //convert status
                const status = (Array.isArray(alerts) && alerts.length > 0) ? (alerts.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No alerts';

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
                    if (this.enchargesInstalled) {
                        this.envoysService[0]
                            .updateCharacteristic(Characteristic.enphaseEnvoyCommNumEnchgAndLevel, `${commEnchargeNum} / ${commEnchargeLevel}`)
                    }
                    if (this.enpowersInstalled) {
                        this.envoysService[0]
                            .updateCharacteristic(Characteristic.enphaseEnvoyEnpowerConnected, enpowerConnected)
                            .updateCharacteristic(Characteristic.enphaseEnvoyEnpowerGridStatus, enpowerGridStatus)
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

                this.envoyEnpowerConnected = enpowerConnected;
                this.envoyEnpowerGridStatus = enpowerGridStatus;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('home', homeData.data) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Home', homeData.data) : false;
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
                const debug = this.enableDebugMode ? this.emit('debug', `Inventory: ${JSON.stringify(inventoryData.data, null, 2)}`) : false;

                //microinverters inventory
                const microinverters = inventoryData.data[0];
                const microinvertersCount = microinverters.devices.length;
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

                    const type = CONSTANS.ApiCodes[microinverters.type] || 'Undefined';
                    for (let i = 0; i < microinvertersCount; i++) {
                        const microinverter = microinverters.devices[i];
                        const partNum = CONSTANS.PartNumbers[microinverter.part_num] || 'Microinverter';
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
                const acBatteries = inventoryData.data[1];
                const acBatteriesCount = acBatteries.devices.length;
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

                    const type = CONSTANS.ApiCodes[acBatteries.type] || 'Undefined';
                    for (let i = 0; i < acBatteriesCount; i++) {
                        const acBaterie = acBatteries.devices[i];
                        const partNum = CONSTANS.PartNumbers[acBaterie.part_num] || 'AC Batterie'
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
                        const chargeStatus = CONSTANS.ApiCodes[acBaterie.charge_status] || 'Undefined';

                        //convert status
                        const status = (Array.isArray(deviceStatus) && deviceStatus.length > 0) ? (deviceStatus.map(a => CONSTANS.ApiCodes[a] || a).join(', ')).substring(0, 64) : 'No status';

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
                    this.acBatteriesCount = acBatteriesCount;
                    this.acBatteriesInstalled = true;
                }

                //qrelays inventory
                const qRelays = inventoryData.data[2];
                const qRelaysCount = qRelays.devices.length;
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

                    const type = CONSTANS.ApiCodes[qRelays.type] || 'Undefined';
                    for (let i = 0; i < qRelaysCount; i++) {
                        const qRelay = qRelays.devices[i];
                        const partNum = CONSTANS.PartNumbers[qRelay.part_num] || 'Q-Relay'
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
                        const relay = CONSTANS.ApiCodes[qRelay.relay] || 'Undefined';
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
                const ensembles = this.ensemblesSupported ? inventoryData.data[3] : {};
                const ensemblesCount = this.ensemblesSupported ? ensembles.devices.length : 0;
                const ensemblesInstalled = ensemblesCount > 0;

                if (ensemblesInstalled) {
                    this.ensemblesSerialNumber = [];
                    this.ensemblesStatus = [];
                    this.ensemblesLastReportDate = [];
                    this.ensemblesFirmware = [];
                    this.ensemblesProducing = [];
                    this.ensemblesCommunicating = [];
                    this.ensemblesOperating = [];

                    const type = CONSTANS.ApiCodes[ensembles.type] || 'Undefined';
                    for (let i = 0; i < ensemblesCount; i++) {
                        const ensemble = ensembles.devices[i];
                        const partNum = CONSTANS.PartNumbers[ensemble.part_num] || 'Q-Relay'
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
                                .updateCharacteristic(Characteristic.enphaseEsubStatus, status)
                                .updateCharacteristic(Characteristic.enphaseEsubLastReportDate, lastReportDate)
                                .updateCharacteristic(Characteristic.enphaseEsubFirmware, firmware)
                                .updateCharacteristic(Characteristic.enphaseEsubProducing, producing)
                                .updateCharacteristic(Characteristic.enphaseEsubCommunicating, communicating)
                                .updateCharacteristic(Characteristic.enphaseEsubOperating, operating)
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
                const restFul = this.restFulConnected ? this.restFul.update('inventory', inventoryData.data) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Inventory', inventoryData.data) : false;
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
                const debug = this.enableDebugMode ? this.emit('debug', `Meters: ${JSON.stringify(metersData.data, null, 2)}`) : false;

                //meters
                const metersCount = metersData.data.length || 0;

                this.metersEid = [];
                this.metersState = [];
                this.metersMeasurementType = [];
                this.metersPhaseMode = [];
                this.metersPhaseCount = [];
                this.metersMeteringStatus = [];
                this.metersStatusFlags = [];

                for (let i = 0; i < metersCount; i++) {
                    const meter = metersData.data[i];
                    const eid = meter.eid;
                    const state = meter.state === 'enabled' || false;
                    const measurementType = CONSTANS.ApiCodes[meter.measurementType] || 'Undefined';
                    const phaseMode = CONSTANS.ApiCodes[meter.phaseMode] || 'Undefined';
                    const phaseCount = meter.phaseCount;
                    const meteringStatus = CONSTANS.ApiCodes[meter.meteringStatus] || 'Undefined';
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

                this.metersProductionEnabled = this.metersState[0] || false;
                this.metersProductionVoltageDivide = this.metersPhaseMode[0] === 'Split' ? 1 : this.metersPhaseCount[0];
                this.metersConsumptionEnabled = this.metersState[1] || false;
                this.metersConsumpionVoltageDivide = this.metersPhaseMode[1] === 'Split' ? 1 : this.metersPhaseCount[1];

                this.metersCount = metersCount;
                this.metersInstalled = this.metersState.includes(true);

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('meters', metersData.data) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Meters', metersData.data) : false;
                resolve(this.metersInstalled);
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
                const debug = this.enableDebugMode ? this.emit('debug', `Meters reading: ${JSON.stringify(metersReadingData.data, null, 2)}`) : false;

                //meters reading
                const metersReadingCount = metersReadingData.data.length;
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
                        const meter = metersReadingData.data[i];
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
                const restFul = this.restFulConnected ? this.restFul.update('metersreading', metersReadingData.data) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Meters Reading', metersReadingData.data) : false;
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
                const debug = this.enableDebugMode ? this.emit('debug', `Ensemble inventory: ${JSON.stringify(ensembleInventoryData.data, null, 2)}`) : false;

                //devices count
                const ensembleDevicesCount = ensembleInventoryData.data.length;

                //ensemble inventory
                if (ensembleDevicesCount === 0) {
                    resolve(false);
                    return;
                }

                //encharges
                const encharges = ensembleInventoryData.data[0];
                const enchargesCount = encharges.devices.length;
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

                    const type = CONSTANS.ApiCodes[encharges.type] || 'Encharge';
                    for (let i = 0; i < enchargesCount; i++) {
                        const encharge = encharges.devices[i];
                        const partNum = CONSTANS.PartNumbers[encharge.part_num] || 'Undefined'
                        const installed = new Date(encharge.installed * 1000).toLocaleString();
                        const serialNumber = encharge.serial_num;
                        const deviceStatus = encharge.device_status;
                        const lastReportDate = new Date(encharge.last_rpt_date * 1000).toLocaleString();
                        const adminState = encharge.admin_state;
                        const adminStateStr = CONSTANS.ApiCodes[encharge.admin_state_str] || 'Undefined';
                        const createdDate = new Date(encharge.created_date * 1000).toLocaleString();
                        const imgLoadDate = new Date(encharge.img_load_date * 1000).toLocaleString();
                        const imgPnumRunning = encharge.img_pnum_running;
                        const zigbeeDongleFwVersion = encharge.zigbee_dongle_fw_version;
                        const bmuFwVersion = encharge.bmu_fw_version;
                        const operating = encharge.operating === true;
                        const communicating = encharge.communicating === true;
                        const sleepEnabled = encharge.sleep_enabled;
                        const percentFull = encharge.percentFull;
                        const temperature = encharge.temperature;
                        const maxCellTemp = encharge.maxCellTemp;
                        const commLevelSubGhz = encharge.comm_level_sub_ghz * 20;
                        const commLevel24Ghz = encharge.comm_level_2_4_ghz * 20;
                        const ledStatus = CONSTANS.LedStatus[encharge.led_status] || 'Undefined';
                        const dcSwitchOff = encharge.dc_switch_off;
                        const enchargeRev = encharge.encharge_rev;
                        const enchargeCapacity = parseFloat(encharge.encharge_capacity) / 1000; //in kWh

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
                }

                //enpowers
                const enpowers = ensembleDevicesCount === 2 ? ensembleInventoryData.data[1] : {};
                const enpowersCount = ensembleDevicesCount === 2 ? enpowers.devices.length : 0;
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

                    const type = CONSTANS.ApiCodes[enpowers.type] || 'Enpower';
                    for (let i = 0; i < enpowersCount; i++) {
                        const enpower = enpowers.devices[i];
                        const partNum = CONSTANS.PartNumbers[enpower.part_num] || 'Undefined'
                        const installed = new Date(enpower.installed * 1000).toLocaleString();
                        const serialNumber = enpower.serial_num;
                        const deviceStatus = enpower.device_status;
                        const lastReportDate = new Date(enpower.last_rpt_date * 1000).toLocaleString();
                        const adminState = enpower.admin_state;
                        const adminStateStr = CONSTANS.ApiCodes[enpower.admin_state_str] || 'Undefined';
                        const createdDate = new Date(enpower.created_date * 1000).toLocaleString();
                        const imgLoadDate = new Date(enpower.img_load_date * 1000).toLocaleString();
                        const imgPnumRunning = enpower.img_pnum_running;
                        const zigbeeDongleFwVersion = enpower.zigbee_dongle_fw_version;
                        const operating = enpower.operating === true;
                        const communicating = enpower.communicating === true;
                        const temperature = enpower.temperature;
                        const commLevelSubGhz = enpower.comm_level_sub_ghz * 20;
                        const commLevel24Ghz = enpower.comm_level_2_4_ghz * 20;
                        const mainsAdminState = CONSTANS.ApiCodes[enpower.mains_admin_state] || 'Undefined';
                        const mainsOperState = CONSTANS.ApiCodes[enpower.mains_oper_state] || 'Undefined';
                        const enpwrGridMode = CONSTANS.ApiCodes[enpower.Enpwr_grid_mode] || 'Undefined';
                        const enchgGridMode = CONSTANS.ApiCodes[enpower.Enchg_grid_mode] || 'Undefined';
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
                const generators = ensembleDevicesCount === 3 ? ensembleInventoryData.data[2] : {};
                const generatorsCount = ensembleDevicesCount === 3 ? generators.devices.length : 0;
                const generatorsInstalled = generatorsCount > 0;

                if (generatorsInstalled) {
                    const type = CONSTANS.ApiCodes[generators.type] || 'Generator';

                    this.generatorsType = type;
                    this.generatorsCount = generatorsCount;
                    this.generatorsInstalled = true;
                }

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('ensembleinventory', ensembleInventoryData.data) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Ensemble Inventory', ensembleInventoryData.data) : false;
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
                const debug = this.enableDebugMode ? this.emit('debug', `Ensemble status: ${JSON.stringify(ensembleStatusData.data, null, 2)}`) : false;
                const ensembleStatus = ensembleStatusData.data;

                //encharges
                const enchargesRatedPowerSummary = [];
                const enchargesSerialNumbers = ensembleStatus.inventory.serial_nums;
                const enchargesSerialNumbersKeys = Object.keys(enchargesSerialNumbers);
                const enchargesSserialNumbersCount = enchargesSerialNumbersKeys.length;

                for (let i = 0; i < enchargesSserialNumbersCount; i++) {
                    const enchargeKey = enchargesSerialNumbersKeys[i];
                    const encharge = ensembleStatus.inventory.serial_nums[enchargeKey];
                    const deviceType = encharge.device_type;
                    const adminState = encharge.admin_state;
                    const adminStateStr = CONSTANS.ApiCodes[encharge.admin_state_str] || 'Undefined';
                    const reportedGridMode = CONSTANS.ApiCodes[encharge.reported_grid_mode] || 'Undefined';
                    const phase = encharge.phase;
                    const revision = encharge.encharge_revision;
                    const capacity = encharge.encharge_capacity;
                    const ratedPower = encharge.encharge_rated_power;
                    const msgRetryCoun1 = encharge.msg_retry_count;
                    const partNumber = encharge.part_number;
                    const assemblyNumber = encharge.assembly_number;
                    const appFwVersion = encharge.app_fw_version;
                    const zbFwVersion = encharge.zb_fw_version;
                    const zbBootloaderVers = encharge.zb_bootloader_vers;
                    const iblFwVersion = encharge.ibl_fw_version;
                    const swiftAsicFwVersion = encharge.swift_asic_fw_version;
                    const bmuFwVersion = encharge.bmu_fw_version;
                    const submodulesCount = encharge.submodule_count;

                    //pusch encharge rated power to array
                    enchargesRatedPowerSummary.push(ratedPower);

                    //encharge submodules
                    const enchargesSubmodulesSerialNumbers = encharge.submodules;
                    const enchargesSubmodulesSerialNumbersKeys = Object.keys(enchargesSubmodulesSerialNumbers);
                    for (let j = 0; j < submodulesCount; j++) {
                        const submoduleKey = enchargesSubmodulesSerialNumbersKeys[j];
                        const submodule = encharge.submodules[submoduleKey];
                        const deviceType = submodule.device_type;
                        const adminState = submodule.admin_state;
                        const partNumber = submodule.part_number;
                        const assemblyNumber = submodule.assembly_number;
                        const dmirPartNumber = submodule.dmir.part_number;
                        const dmirAssemblyNumber = submodule.dmir.assembly_number;
                        const procloadPartNumber = submodule.procload.part_number;
                        const procloadAssemblyNumber = submodule.procload.assembly_number;
                    }
                }

                //sum rated power for all encharges
                const enchargesRatedPowerSum = parseFloat(enchargesRatedPowerSummary.reduce((total, num) => total + num, 0)) / 1000 || 0; //in kW
                this.enchargesRatedPowerSum = enchargesRatedPowerSum;

                //counters
                const counter = ensembleStatus.counters;
                const apiEcagtInit = counter.api_ecagtInit;
                const apiEcagtTick = counter.api_ecagtTick;
                const apiEcagtDeviceInsert = counter.api_ecagtDeviceInsert;
                const apiEcagtDeviceNetworkStatus = counter.api_ecagtDeviceNetworkStatus;
                const apiEcagtDeviceCommissionStatus = counter.api_ecagtDeviceCommissionStatus;
                const apiEcagtDeviceRemoved = counter.api_ecagtDeviceRemoved;
                const apiEcagtGetDeviceCount = counter.api_ecagtGetDeviceCount;
                const apiEcagtGetDeviceInfo = counter.api_ecagtGetDeviceInfo;
                const apiEcagtGetOneDeviceInfo = counter.api_ecagtGetOneDeviceInfo;
                const apiEcagtDevIdToSerial = counter.api_ecagtDevIdToSerial;
                const apiEcagtHandleMsg = counter.api_ecagtHandleMsg;
                const apiEcagtGetSubmoduleInv = counter.api_ecagtGetSubmoduleInv;
                const apiEcagtGetDataModelRaw = counter.api_ecagtGetDataModelRaw;
                const apiEcagtSetSecCtrlBias = counter.api_ecagtSetSecCtrlBias;
                const apiEcagtGetSecCtrlBias = counter.api_ecagtGetSecCtrlBias;
                const apiEcagtGetSecCtrlBiasQ = counter.api_ecagtGetSecCtrlBiasQ;
                const apiEcagtSetRelayAdmin = counter.api_ecagtSetRelayAdmin;
                const apiEcagtGetRelayState = counter.api_ecagtGetRelayState;
                const apiEcagtSetDataModelCache = counter.api_ecagtSetDataModelCache;
                const apiAggNameplate = counter.api_AggNameplate;
                const apiChgEstimated = counter.api_ChgEstimated;
                const apiEcagtGetGridFreq = counter.api_ecagtGetGridFreq;
                const apiEcagtGetGridVolt = counter.api_ecagtGetGridVolt;
                const apiEcagtGetGridFreqErrNotfound = counter.api_ecagtGetGridFreq_err_notfound;
                const apiEcagtGetGridFreqErrOor = counter.api_ecagtGetGridFreq_err_oor;
                const restStatusGet = counter.rest_StatusGet;
                const restInventoryGet = counter.rest_InventoryGet;
                const restSubmodGet = counter.rest_SubmodGet;
                const restSecCtrlGet = counter.rest_SecCtrlGet;
                const restRelayGet = counter.rest_RelayGet;
                const restRelayPost = counter.rest_RelayPost;
                const restCommCheckGet = counter.rest_CommCheckGet;
                const restPower = counter.rest_Power ? parseFloat(counter.rest_Power) / 1000 : 0;  //in kW
                const extZbRemove = counter.ext_zb_remove;
                const extZbRemoveErr = counter.ext_zb_remove_err;
                const extZbSendMsg = counter.ext_zb_send_msg;
                const extCfgSaveDevice = counter.ext_cfg_save_device;
                const extCfgSaveDeviceErr = counter.ext_cfg_save_device_err;
                const extSendPerfData = counter.ext_send_perf_data;
                const extEventSetStateful = counter.ext_event_set_stateful;
                const extEventSetModgone = counter.ext_event_set_modgone;
                const rxmsgObjMdlMetaRsp = counter.rxmsg_OBJ_MDL_META_RSP;
                const rxmsgObjMdlInvUpdRsp = counter.rxmsg_OBJ_MDL_INV_UPD_RSP;
                const rxmsgObjMdlPollRsp = counter.rxmsg_OBJ_MDL_POLL_RSP;
                const rxmsgObjMdlRelayCtrlRsp = counter.rxmsg_OBJ_MDL_RELAY_CTRL_RSP;
                const rxmsgObjMdlRelayStatusReq = counter.rxmsg_OBJ_MDL_RELAY_STATUS_REQ;
                const rxmsgObjMdlGridStatusRsp = counter.rxmsg_OBJ_MDL_GRID_STATUS_RSP;
                const rxmsgObjMdlEventMsg = counter.rxmsg_OBJ_MDL_EVENT_MSG;
                const rxmsgObjMdlSosConfigRsp = counter.rxmsg_OBJ_MDL_SOC_CONFIG_RSP;
                const txmsgObjMdlMetaReq = counter.txmsg_OBJ_MDL_META_REQ;
                const txmsgObjMdlEncRtPollReq = counter.txmsg_OBJ_MDL_ENC_RT_POLL_REQ;
                const txmsgObjMdlEnpRtPollReq = counter.txmsg_OBJ_MDL_ENP_RT_POLL_REQ;
                const txmsgObjMdlBmuPollReq = counter.txmsg_OBJ_MDL_BMU_POLL_REQ;
                const txmsgObjMdlPcuPollReq = counter.txmsg_OBJ_MDL_PCU_POLL_REQ;
                const txmsgObjMdlSecondaryCtrlReq = counter.txmsg_OBJ_MDL_SECONDARY_CTRL_REQ;
                const txmsgObjMdlRelayCtrlReq = counter.txmsg_OBJ_MDL_RELAY_CTRL_REQ;
                const txmsgObjMdlGridStatusReq = counter.txmsg_OBJ_MDL_GRID_STATUS_REQ;
                const txmsgObjMdlEventsAck = counter.txmsg_OBJ_MDL_EVENTS_ACK;
                const txmsgObjMdlRelayStatusRsp = counter.txmsg_OBJ_MDL_RELAY_STATUS_RSP;
                const txmsgObjMdlcosConfigReq = counter.txmsg_OBJ_MDL_SOC_CONFIG_REQ;
                const txmsgObjMdlTnsStart = counter.txmsg_OBJ_MDL_TNS_START;
                const rxmsgObjMdlTnsStartRsp = counter.rxmsg_OBJ_MDL_TNS_START_RSP;
                const txmsgObjMdlSetUdmir = counter.txmsg_OBJ_MDL_SET_UDMIR;
                const rxmsgObjMdlSetUdmirRsp = counter.rxmsg_OBJ_MDL_SET_UDMIR_RSP;
                const txmsgObjMdlTnsEdn = counter.txmsg_OBJ_MDL_TNS_END;
                const rxmsgObjMdlTnsEndRsp = counter.rxmsg_OBJ_MDL_TNS_END_RSP;
                const txmsgLvsPoll = counter.txmsg_lvs_poll;
                const zmqEcaHello = counter.zmq_ecaHello;
                const zmqEcaDevInfo = counter.zmq_ecaDevInfo;
                const zmqEcaNetworkStatus = counter.zmq_ecaNetworkStatus;
                const zmqEcaAppMsg = counter.zmq_ecaAppMsg;
                const zmqStreamdata = counter.zmq_streamdata;
                const zmqLiveDebug = counter.zmq_live_debug;
                const zmqEcaLiveDebugReq = counter.zmq_eca_live_debug_req;
                const zmqNameplate = counter.zmq_nameplate;
                const zmqEcaSecCtrlMsg = counter.zmq_ecaSecCtrlMsg;
                const zmqMeterlogOk = counter.zmq_meterlog_ok;
                const dmdlFilesIndexed = counter.dmdl_FILES_INDEXED;
                const pfStart = counter.pf_start;
                const pfActivate = counter.pf_activate;
                const devPollMissing = counter.devPollMissing;
                const devMsgRspMissing = counter.devMsgRspMissing;
                const gridProfileTransaction = counter.gridProfileTransaction;
                const secctrlNotReady = counter.secctrlNotReady;
                const fsmRetryTimeout = counter.fsm_retry_timeout;
                const profileTxnAck = counter.profile_txn_ack;
                const backupSocLimitSet = counter.backupSocLimitSet;
                const backupSocLimitChanged = counter.backupSocLimitChanged;
                const backupSocLimitAbove100 = counter.backupSocLimitAbove100;
                const apiEcagtGetGenRelayState = counter.api_ecagtGetGenRelayState;

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
                const mainsAdminState = CONSTANS.ApiCodes[relay.mains_admin_state] || 'Unknown';
                const mainsOperState = CONSTANS.ApiCodes[relay.mains_oper_sate] || 'Unknown';
                const der1State = relay.der1_state;
                const der2State = relay.der2_state;
                const enchGridMode = CONSTANS.ApiCodes[relay.Enchg_grid_mode] || 'Enpower state no grid';
                const solarGridMode = CONSTANS.ApiCodes[relay.Solar_grid_mode] || 'Enpower state no grid';

                //sensor state
                const enpowerGridState = this.envoyEnpowerGridStatus !== 'Enpower state no grid';
                const enchargeGridState = enchGridMode !== 'Enpower state no grid';
                const solarGridState = solarGridMode !== 'Enpower state no grid';

                //enpower grid state sensors
                if (this.enpowerGridStateSensorService) {
                    this.enpowerGridStateSensorService
                        .updateCharacteristic(Characteristic.ContactSensorState, enpowerGridState)
                }

                //encharge grid state sensors
                if (this.enchargeGridStateSensorService) {
                    this.enchargeGridStateSensorService
                        .updateCharacteristic(Characteristic.ContactSensorState, enchargeGridState)
                }

                //solar grid state sensors
                if (this.solarGridStateSensorService) {
                    this.solarGridStateSensorService
                        .updateCharacteristic(Characteristic.ContactSensorState, solarGridState)
                }

                this.enpowerGridState = enpowerGridState;
                this.enchargeGridState = enchargeGridState;
                this.solarGridState = solarGridState;

                //profile
                const profile = ensembleStatus.profile;
                const message = profile.message === 'Obsolete API, please use ivp/arf/profile';
                const profileData = message ? await this.updateProfileData() : profile;
                const name = profileData.name;
                const id = profileData.id;
                const version = profileData.version;
                const itemCount = profileData.item_count;

                //fakeit
                const fakeInventoryMode = ensembleStatus.fakeit.fake_inventory_mode === true;

                this.ensembleGridProfileName = name;
                this.ensembleId = id;
                this.ensembleGridProfileVersion = version;
                this.ensembleItemCount = itemCount;
                this.ensembleFakeInventoryMode = fakeInventoryMode;
                this.ensembleStatusSupported = true;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('ensemblestatus', ensembleStatusData.data) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Ensemble Status', ensembleStatusData.data) : false;
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
                const debug = this.enableDebugMode ? this.emit('debug', `Grid profile: ${JSON.stringify(profileData.data, null, 2)}`) : false;

                //profile
                const profile = profileData.data;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('gridprofile', profileData.data) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Grid Profile', profileData.data) : false;
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
                const debug = this.enableDebugMode ? this.emit('debug', `Live data: ${JSON.stringify(liveData.data, null, 2)}`) : false;

                //live data keys
                const liveDadaKeys = Object.keys(liveData.data);

                //connection
                const connection = liveData.data.connection;
                const connectionMqttState = connection.mqtt_state;
                const connectionProvState = connection.prov_state;
                const connectionAuthState = connection.auth_state;
                const connectionScStream = connection.sc_stream === 'enabled';
                const connectionScDebug = connection.sc_debug === 'enabled';

                //enable live data stream if not enabled
                const enableLiveDataStream = !connectionScStream ? await this.enableLiveDataStream() : false;

                //meters
                const liveDataMeters = liveData.data.meters;
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

                this.liveDataMetersIsSplitPhase = metersIsSplitPhase;

                //meters pv
                const liveDataMetersPv = liveDataMeters.pv;
                this.liveDataPvActivePower = liveDataMetersPv.agg_p_mw / 1000000 || 0;
                this.liveDataPvApparentPower = liveDataMetersPv.agg_s_mva / 1000000 || 0;
                this.liveDataPvActivePowerL1 = liveDataMetersPv.agg_p_ph_a_mw / 1000000 || 0;
                this.liveDataPvActivePowerL2 = liveDataMetersPv.agg_p_ph_b_mw / 1000000 || 0;
                this.liveDataPvActivePowerL3 = liveDataMetersPv.agg_p_ph_c_mw / 1000000 || 0;
                this.liveDataPvApparentPowerL1 = liveDataMetersPv.agg_s_ph_a_mva / 1000000 || 0;
                this.liveDataPvApparentPowerL2 = liveDataMetersPv.agg_s_ph_b_mva / 1000000 || 0;
                this.liveDataPvApparentPowerL3 = liveDataMetersPv.agg_s_ph_c_mva / 1000000 || 0;

                if (this.liveDataPvService) {
                    this.liveDataPvService[0]
                        .updateCharacteristic(Characteristic.enphaseLiveDataPvActivePower, this.liveDataPvActivePower)
                        .updateCharacteristic(Characteristic.enphaseLiveDataPvActivePowerL1, this.liveDataPvActivePowerL1)
                        .updateCharacteristic(Characteristic.enphaseLiveDataPvActivePowerL2, this.liveDataPvActivePowerL2)
                        .updateCharacteristic(Characteristic.enphaseLiveDataPvActivePowerL3, this.liveDataPvActivePowerL3)
                        .updateCharacteristic(Characteristic.enphaseLiveDataPvApparentPower, this.liveDataPvApparentPower)
                        .updateCharacteristic(Characteristic.enphaseLiveDataPvApparentPowerL1, this.liveDataPvApparentPowerL1)
                        .updateCharacteristic(Characteristic.enphaseLiveDataPvApparentPowerL2, this.liveDataPvApparentPowerL2)
                        .updateCharacteristic(Characteristic.enphaseLiveDataPvApparentPowerL3, this.liveDataPvApparentPowerL3)
                }

                //meters storage
                const liveDataMetersStorage = liveDataMeters.storage;
                this.liveDataStorageActivePower = liveDataMetersStorage.agg_p_mw / 1000000 || 0;
                this.liveDataStorageApparentPower = liveDataMetersStorage.agg_s_mva / 1000000 || 0;
                this.liveDataStorageActivePowerL1 = liveDataMetersStorage.agg_p_ph_a_mw / 1000000 || 0;
                this.liveDataStorageActivePowerL2 = liveDataMetersStorage.agg_p_ph_b_mw / 1000000 || 0;
                this.liveDataStorageActivePowerL3 = liveDataMetersStorage.agg_p_ph_c_mw / 1000000 || 0;
                this.liveDataStorageApparentPowerL1 = liveDataMetersStorage.agg_s_ph_a_mva / 1000000 || 0;
                this.liveDataStorageApparentPowerL2 = liveDataMetersStorage.agg_s_ph_b_mva / 1000000 || 0;
                this.liveDataStorageApparentPowerL3 = liveDataMetersStorage.agg_s_ph_c_mva / 1000000 || 0;

                if (this.liveDataStorageService) {
                    this.liveDataStorageService[0]
                        .updateCharacteristic(Characteristic.enphaseLiveDataStorageActivePower, this.liveDataStorageActivePower)
                        .updateCharacteristic(Characteristic.enphaseLiveDataStorageActivePowerL1, this.liveDataStorageActivePowerL1)
                        .updateCharacteristic(Characteristic.enphaseLiveDataStorageActivePowerL2, this.liveDataStorageActivePowerL2)
                        .updateCharacteristic(Characteristic.enphaseLiveDataStorageActivePowerL3, this.liveDataStorageActivePowerL3)
                        .updateCharacteristic(Characteristic.enphaseLiveDataStorageApparentPower, this.liveDataStorageApparentPower)
                        .updateCharacteristic(Characteristic.enphaseLiveDataStorageApparentPowerL1, this.liveDataStorageApparentPowerL1)
                        .updateCharacteristic(Characteristic.enphaseLiveDataStorageApparentPowerL2, this.liveDataStorageApparentPowerL2)
                        .updateCharacteristic(Characteristic.enphaseLiveDataStorageApparentPowerL3, this.liveDataStorageApparentPowerL3)
                }

                //meters grid
                const liveDataMetersGrid = liveDataMeters.grid;
                this.liveDataGridActivePower = liveDataMetersGrid.agg_p_mw / 1000000 || 0;
                this.liveDataGridApparentPower = liveDataMetersGrid.agg_s_mva / 1000000 || 0;
                this.liveDataGridActivePowerL1 = liveDataMetersGrid.agg_p_ph_a_mw / 1000000 || 0;
                this.liveDataGridActivePowerL2 = liveDataMetersGrid.agg_p_ph_b_mw / 1000000 || 0;
                this.liveDataGridActivePowerL3 = liveDataMetersGrid.agg_p_ph_c_mw / 1000000 || 0;
                this.liveDataGridApparentPowerL1 = liveDataMetersGrid.agg_s_ph_a_mva / 1000000 || 0;
                this.liveDataGridApparentPowerL2 = liveDataMetersGrid.agg_s_ph_b_mva / 1000000 || 0;
                this.liveDataGridApparentPowerL3 = liveDataMetersGrid.agg_s_ph_c_mva / 1000000 || 0;

                if (this.liveDataGridService) {
                    this.liveDataGridService[0]
                        .updateCharacteristic(Characteristic.enphaseLiveDataGridActivePower, this.liveDataGridActivePower)
                        .updateCharacteristic(Characteristic.enphaseLiveDataGridActivePowerL1, this.liveDataGridActivePowerL1)
                        .updateCharacteristic(Characteristic.enphaseLiveDataGridActivePowerL2, this.liveDataGridActivePowerL2)
                        .updateCharacteristic(Characteristic.enphaseLiveDataGridActivePowerL3, this.liveDataGridActivePowerL3)
                        .updateCharacteristic(Characteristic.enphaseLiveDataGridApparentPower, this.liveDataGridApparentPower)
                        .updateCharacteristic(Characteristic.enphaseLiveDataGridApparentPowerL1, this.liveDataGridApparentPowerL1)
                        .updateCharacteristic(Characteristic.enphaseLiveDataGridApparentPowerL2, this.liveDataGridApparentPowerL2)
                        .updateCharacteristic(Characteristic.enphaseLiveDataGridApparentPowerL3, this.liveDataGridApparentPowerL3)
                }

                //meters load
                const liveDataMetersLoad = liveDataMeters.load;
                this.liveDataLoadActivePower = liveDataMetersLoad.agg_p_mw / 1000000 || 0;
                this.liveDataLoadApparentPower = liveDataMetersLoad.agg_s_mva / 1000000 || 0;
                this.liveDataLoadActivePowerL1 = liveDataMetersLoad.agg_p_ph_a_mw / 1000000 || 0;
                this.liveDataLoadActivePowerL2 = liveDataMetersLoad.agg_p_ph_b_mw / 1000000 || 0;
                this.liveDataLoadActivePowerL3 = liveDataMetersLoad.agg_p_ph_c_mw / 1000000 || 0;
                this.liveDataLoadApparentPowerL1 = liveDataMetersLoad.agg_s_ph_a_mva / 1000000 || 0;
                this.liveDataLoadApparentPowerL2 = liveDataMetersLoad.agg_s_ph_b_mva / 1000000 || 0;
                this.liveDataLoadApparentPowerL3 = liveDataMetersLoad.agg_s_ph_c_mva / 1000000 || 0;

                if (this.liveDataLoadService) {
                    this.liveDataLoadService[0]
                        .updateCharacteristic(Characteristic.enphaseLiveDataLoadActivePower, this.liveDataLoadActivePower)
                        .updateCharacteristic(Characteristic.enphaseLiveDataLoadActivePowerL1, this.liveDataLoadActivePowerL1)
                        .updateCharacteristic(Characteristic.enphaseLiveDataLoadActivePowerL2, this.liveDataLoadActivePowerL2)
                        .updateCharacteristic(Characteristic.enphaseLiveDataLoadActivePowerL3, this.liveDataLoadActivePowerL3)
                        .updateCharacteristic(Characteristic.enphaseLiveDataLoadApparentPower, this.liveDataLoadApparentPower)
                        .updateCharacteristic(Characteristic.enphaseLiveDataLoadApparentPowerL1, this.liveDataLoadApparentPowerL1)
                        .updateCharacteristic(Characteristic.enphaseLiveDataLoadApparentPowerL2, this.liveDataLoadApparentPowerL2)
                        .updateCharacteristic(Characteristic.enphaseLiveDataLoadApparentPowerL3, this.liveDataLoadApparentPowerL3)
                }

                //meters generator
                const liveDataMetersGenerator = liveDataMeters.generator;
                this.liveDataGeneratorActivePower = liveDataMetersGenerator.agg_p_mw / 1000000 || 0;
                this.liveDataGeneratorApparentPower = liveDataMetersGenerator.agg_s_mva / 1000000 || 0;
                this.liveDataGeneratorActivePowerL1 = liveDataMetersGenerator.agg_p_ph_a_mw / 1000000 || 0;
                this.liveDataGeneratorActivePowerL2 = liveDataMetersGenerator.agg_p_ph_b_mw / 1000000 || 0;
                this.liveDataGeneratorActivePowerL3 = liveDataMetersGenerator.agg_p_ph_c_mw / 1000000 || 0;
                this.liveDataGeneratorApparentPowerL1 = liveDataMetersGenerator.agg_s_ph_a_mva / 1000000 || 0;
                this.liveDataGeneratorApparentPowerL2 = liveDataMetersGenerator.agg_s_ph_b_mva / 1000000 || 0;
                this.liveDataGeneratorApparentPowerL3 = liveDataMetersGenerator.agg_s_ph_c_mva / 1000000 || 0;

                if (this.liveDataGeneratorService) {
                    this.liveDataGeneratorService[0]
                        .updateCharacteristic(Characteristic.enphaseLiveDataGeneratorActivePower, this.liveDataGeneratorActivePower)
                        .updateCharacteristic(Characteristic.enphaseLiveDataGeneratorActivePowerL1, this.liveDataGeneratorActivePowerL1)
                        .updateCharacteristic(Characteristic.enphaseLiveDataGeneratorActivePowerL2, this.liveDataGeneratorActivePowerL2)
                        .updateCharacteristic(Characteristic.enphaseLiveDataGeneratorActivePowerL3, this.liveDataGeneratorActivePowerL3)
                        .updateCharacteristic(Characteristic.enphaseLiveDataGeneratorApparentPower, this.liveDataGeneratorApparentPower)
                        .updateCharacteristic(Characteristic.enphaseLiveDataGeneratorApparentPowerL1, this.liveDataGeneratorApparentPowerL1)
                        .updateCharacteristic(Characteristic.enphaseLiveDataGeneratorApparentPowerL2, this.liveDataGeneratorApparentPowerL2)
                        .updateCharacteristic(Characteristic.enphaseLiveDataGeneratorApparentPowerL3, this.liveDataGeneratorApparentPowerL3)
                }

                //tasks
                const tasks = liveData.data.tasks;
                const tasksId = tasks.task_id;
                const tasksTimestamp = tasks.timestamp;

                //counters
                const counters = liveData.data.counters;
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
                const dryContacts = supportDryContacts ? liveData.data.dry_contacts[''] : {};
                const dryContactId = supportDryContacts ? dryContacts.dry_contact_id : '';
                const dryContactLoadName = supportDryContacts ? dryContacts.dry_contact_load_name : '';
                const dryContactStatus = supportDryContacts ? dryContacts.dry_contact_status : 0;

                //live data supported
                this.liveDataSupported = true;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('livedata', liveData.data) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Live Data', liveData.data) : false;
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
            const productionEnergyLifetimeOffset = this.energyProductionLifetimeOffset;

            try {
                const productionData = await this.axiosInstance(CONSTANS.ApiUrls.InverterProductionSumm);
                const debug = this.enableDebugMode ? this.emit('debug', `Production: ${JSON.stringify(productionData.data, null, 2)}`) : false;

                //microinverters summary 
                const productionMicroSummarywhToday = parseFloat(productionData.data.wattHoursToday) / 1000;
                const productionMicroSummarywhLastSevenDays = parseFloat(productionData.data.wattHoursSevenDays) / 1000;
                const productionMicroSummarywhLifeTime = parseFloat(productionData.data.wattHoursLifetime + productionEnergyLifetimeOffset) / 1000;
                const productionMicroSummaryWattsNow = parseFloat(productionData.data.wattsNow) / 1000;

                this.productionMicroSummarywhToday = productionMicroSummarywhToday;
                this.productionMicroSummarywhLastSevenDays = productionMicroSummarywhLastSevenDays;
                this.productionMicroSummarywhLifeTime = productionMicroSummarywhLifeTime;
                this.productionMicroSummaryWattsNow = productionMicroSummaryWattsNow;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('production', productionData.data) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Production', productionData.data) : false;
                resolve(true);
            } catch (error) {
                reject(`Requesting production error: ${error}.`);
            };
        });
    };

    updateProductionCtData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting production ct.`) : false;

            //auto reset peak power
            const date = new Date();
            const currentDayOfWeek = date.getDay();
            const currentDayOfMonth = date.getDate();
            const resetProductionPowerPeak = [false, currentDayOfWeek !== this.currentDayOfWeek, currentDayOfWeek === 6 ? currentDayOfWeek < this.currentDayOfWeek : false, currentDayOfMonth < this.currentDayOfMonth][this.powerProductionPeakAutoReset];
            const resetConsumptionTotalPowerPeak = [false, currentDayOfWeek !== this.currentDayOfWeek, currentDayOfWeek === 6 ? currentDayOfWeek < this.currentDayOfWeek : false, currentDayOfMonth < this.currentDayOfMonth][this.powerConsumptionTotalPeakAutoReset];
            const resetConsumptionNetPowerPeak = [false, currentDayOfWeek !== this.currentDayOfWeek, currentDayOfWeek === 6 ? currentDayOfWeek < this.currentDayOfWeek : false, currentDayOfMonth < this.currentDayOfMonth][this.powerConsumptionNetPeakAutoReset];

            //get enabled devices
            const metersProductionEnabled = this.metersProductionEnabled;
            const metersProductionVoltageDivide = this.metersProductionVoltageDivide;
            const metersConsumptionEnabled = this.metersConsumptionEnabled;
            const metersConsumpionVoltageDivide = this.metersConsumpionVoltageDivide;
            const acBatteriesInstalled = this.acBatteriesInstalled;
            const productionEnergyLifetimeOffset = this.energyProductionLifetimeOffset;

            try {
                const productionCtData = await this.axiosInstance(CONSTANS.ApiUrls.SystemReadingStats);
                const debug = this.enableDebugMode ? this.emit('debug', `Production ct: ${JSON.stringify(productionCtData.data, null, 2)}`) : false;

                //microinverters data
                const productionMicro = productionCtData.data.production[0];
                const productionMicroType = CONSTANS.ApiCodes[productionMicro.type];
                const productionMicroActiveCount = productionMicro.activeCount;
                const productionMicroReadingTime = new Date(productionMicro.readingTime * 1000).toLocaleString();
                const productionMicroPower = parseFloat(productionMicro.wNow) / 1000;
                const productionMicroEnergyLifeTime = parseFloat(productionMicro.whLifetime + productionEnergyLifetimeOffset) / 1000;

                //production data
                const production = productionCtData.data.production[1];
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

                //read power peak
                const savedProductionPowerPeak = await fsPromises.readFile(this.productionPowerPeakFile);
                const debug3 = this.enableDebugMode ? this.emit('debug', `Read production power peak: ${savedProductionPowerPeak} kW`) : false;
                const productionPowerPeak = parseFloat(savedProductionPowerPeak);

                //save power peak
                const powerProductionToWrite = resetProductionPowerPeak ? '0' : productionPower.toString();
                const write = (productionPower > productionPowerPeak) || resetProductionPowerPeak ? await fsPromises.writeFile(this.productionPowerPeakFile, powerProductionToWrite) : false;
                const showLog = write && this.enableDebugMode ? this.emit('debug', `Saved production power peak: ${powerProductionToWrite} kW`) : false;

                //power peak state
                const productionPowerPeakDetected = productionPower >= (this.powerProductionPeakSensorDetected / 1000);
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
                const debug5 = this.enableDebugMode ? this.emit('debug', `Production energy level state: ${productionEnergyState}`) : false;

                //energy level
                const productionEnergyLevelDetected = productionEnergyToday >= (this.energyProductionLevelSensorDetected / 1000);
                const debug6 = this.enableDebugMode ? this.emit('debug', `Production energy level detected: ${productionEnergyLevelDetected}`) : false;

                //param
                const productionRmsCurrent = metersProductionEnabled ? parseFloat(production.rmsCurrent) : 0;
                const productionRmsVoltage = metersProductionEnabled ? parseFloat(production.rmsVoltage / metersProductionVoltageDivide) : 0;
                const productionReactivePower = metersProductionEnabled ? parseFloat(production.reactPwr) / 1000 : 0;
                const productionApparentPower = metersProductionEnabled ? parseFloat(production.apprntPwr) / 1000 : 0;
                const productionPwrFactor = metersProductionEnabled ? parseFloat(production.pwrFactor) : 0;

                if (this.systemsPvService) {
                    this.systemsPvService[0]
                        .updateCharacteristic(Characteristic.On, productionPowerState)
                        .updateCharacteristic(Characteristic.Brightness, productionPowerLevel)
                }

                if (this.productionsService) {
                    this.productionsService[0]
                        .updateCharacteristic(Characteristic.enphaseReadingTime, productionReadingTime)
                        .updateCharacteristic(Characteristic.enphasePower, productionPower)
                        .updateCharacteristic(Characteristic.enphasePowerMax, productionPowerPeak)
                        .updateCharacteristic(Characteristic.enphasePowerMaxDetected, productionPowerPeakDetected)
                        .updateCharacteristic(Characteristic.enphaseEnergyToday, productionEnergyToday)
                        .updateCharacteristic(Characteristic.enphaseEnergyLastSevenDays, productionEnergyLastSevenDays)
                        .updateCharacteristic(Characteristic.enphaseEnergyLifeTime, productionEnergyLifeTimeFix)
                        .updateCharacteristic(Characteristic.enphasePowerMaxReset, false);
                    if (metersProductionEnabled) {
                        this.productionsService[0]
                            .updateCharacteristic(Characteristic.enphaseRmsCurrent, productionRmsCurrent)
                            .updateCharacteristic(Characteristic.enphaseRmsVoltage, productionRmsVoltage)
                            .updateCharacteristic(Characteristic.enphaseReactivePower, productionReactivePower)
                            .updateCharacteristic(Characteristic.enphaseApparentPower, productionApparentPower)
                            .updateCharacteristic(Characteristic.enphasePwrFactor, productionPwrFactor);
                    }
                }

                //sensors power
                if (this.productionPowerStateSensorService) {
                    this.productionPowerStateSensorService
                        .updateCharacteristic(Characteristic.ContactSensorState, productionPowerState)
                }

                if (this.productionPowerPeakSensorService) {
                    this.productionPowerPeakSensorService
                        .updateCharacteristic(Characteristic.ContactSensorState, productionPowerPeakDetected)
                }

                //sensors energy
                if (this.productionEnergyStateSensorService) {
                    this.productionEnergyStateSensorService
                        .updateCharacteristic(Characteristic.ContactSensorState, productionEnergyState)
                }

                if (this.productionEnergyLevelSensorService) {
                    this.productionEnergyLevelSensorService
                        .updateCharacteristic(Characteristic.ContactSensorState, productionEnergyLevelDetected)
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
                this.productionEnergyLevelDetected = productionEnergyLevelDetected;

                this.productionRmsCurrent = productionRmsCurrent;
                this.productionRmsVoltage = productionRmsVoltage;
                this.productionReactivePower = productionReactivePower;
                this.productionApparentPower = productionApparentPower;
                this.productionPwrFactor = productionPwrFactor;

                //consumption data
                if (metersConsumptionEnabled) {
                    this.consumptionsType = [];
                    this.consumptionsMeasurmentType = [];
                    this.consumptionsActiveCount = [];
                    this.consumptionsReadingTime = [];
                    this.consumptionsPower = [];
                    this.consumptionsPowerPeak = [];
                    this.consumptionsPowerPeakDetected = [];
                    this.consumptionsEnergyToday = [];
                    this.consumptionsEnergyLastSevenDays = [];
                    this.consumptionsEnergyLifeTime = [];
                    this.consumptionsRmsCurrent = [];
                    this.consumptionsRmsVoltage = [];
                    this.consumptionsReactivePower = [];
                    this.consumptionsApparentPower = [];
                    this.consumptionsPwrFactor = [];

                    const metersConsumptionCount = productionCtData.data.consumption.length;
                    for (let i = 0; i < metersConsumptionCount; i++) {
                        //power
                        const consumption = productionCtData.data.consumption[i];
                        const consumptionType = CONSTANS.ApiCodes[consumption.type];
                        const consumptionActiveCount = consumption.activeCount;
                        const consumptionMeasurmentType = CONSTANS.ApiCodes[consumption.measurementType];
                        const consumptionReadingTime = new Date(consumption.readingTime * 1000).toLocaleString();
                        const consumptionPower = parseFloat(consumption.wNow) / 1000;

                        //power state
                        const consumptionPowerState = consumptionPower > 0; // true if power > 0
                        const debug1 = this.enableDebugMode ? this.emit('debug', `Consumption ${['Total', 'Net'][i]} power state: ${consumptionPowerState}`) : false;

                        //read saved power peak
                        const consumptionsName = ['consumption total', 'consumption net'][i];
                        const consumptionsFile = [this.consumptionTotalPowerPeakFile, this.consumptionNetPowerPeakFile][i];
                        const savedConsumptionPowerPeak = await fsPromises.readFile(consumptionsFile);
                        const debug = this.enableDebugMode ? this.emit('debug', `Read ${consumptionsName} power peak: ${savedConsumptionPowerPeak} kW`) : false;
                        const consumptionPowerPeak = parseFloat(savedConsumptionPowerPeak);

                        //save power peak
                        const autoReset = [resetConsumptionTotalPowerPeak, resetConsumptionNetPowerPeak][i]
                        const consumptionPowerToWrite = autoReset ? '0' : consumptionPower.toString();
                        const write = (consumptionPower > consumptionPowerPeak) || autoReset ? await fsPromises.writeFile(consumptionsFile, consumptionPowerToWrite) : false;
                        const showLog = write && this.enableDebugMode ? this.emit('debug', `Saved ${consumptionsName} power peak: ${consumptionPowerToWrite} kW`) : false;

                        //power peak state
                        const consumptionsPowerPeakDetected = [this.powerConsumptionTotalPeakSensorDetected / 1000, this.powerConsumptionNetPeakSensorDetected / 1000][i];
                        const consumptionPowerPeakDetected = consumptionPower >= consumptionsPowerPeakDetected || false;

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
                        const debug5 = this.enableDebugMode ? this.emit('debug', `Consumption ${['Total', 'Net'][i]} energy level state: ${consumptionEnergyState}`) : false;

                        //energy level 
                        const consumptionsEnergyLevelDetected = [this.energyConsumptionTotalLevelSensorDetected / 1000, this.energyConsumptionNetLevelSensorDetected / 1000][i];
                        const consumptionEnergyLevelDetected = consumptionEnergyToday >= consumptionsEnergyLevelDetected || false;
                        const debug6 = this.enableDebugMode ? this.emit('debug', `Consumption ${['Total', 'Net'][i]} energy level detected: ${consumptionEnergyLevelDetected}`) : false;

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

                        this.consumptionsType.push(consumptionType);
                        this.consumptionsMeasurmentType.push(consumptionMeasurmentType);
                        this.consumptionsActiveCount.push(consumptionActiveCount);
                        this.consumptionsReadingTime.push(consumptionReadingTime);
                        this.consumptionsPower.push(consumptionPower);
                        this.consumptionsPowerPeak.push(consumptionPowerPeak);
                        this.consumptionsPowerPeakDetected.push(consumptionPowerPeakDetected);
                        this.consumptionsEnergyToday.push(consumptionEnergyToday);
                        this.consumptionsEnergyLastSevenDays.push(consumptionEnergyLastSevenDays);
                        this.consumptionsEnergyLifeTime.push(consumptionEnergyLifeTimeFix);
                        this.consumptionsRmsCurrent.push(consumptionRmsCurrent);
                        this.consumptionsRmsVoltage.push(consumptionRmsVoltage);
                        this.consumptionsReactivePower.push(consumptionReactivePower);
                        this.consumptionsApparentPower.push(consumptionApparentPower);
                        this.consumptionsPwrFactor.push(consumptionPwrFactor);

                        if (i === 0) {
                            if (this.consumptionTotalPowerStateSensorService) {
                                this.consumptionTotalPowerStateSensorService
                                    .updateCharacteristic(Characteristic.ContactSensorState, consumptionPowerState)
                            }

                            if (this.consumptionTotalPowerPeakSensorService) {
                                this.consumptionTotalPowerPeakSensorService
                                    .updateCharacteristic(Characteristic.ContactSensorState, consumptionPowerPeakDetected)
                            }

                            if (this.consumptionTotalEnergyyStateSensorService) {
                                this.consumptionTotalEnergyyStateSensorService
                                    .updateCharacteristic(Characteristic.ContactSensorState, consumptionEnergyState)
                            }

                            if (this.consumptionTotalEnergyLevelSensorService) {
                                this.consumptionTotalEnergyLevelSensorService
                                    .updateCharacteristic(Characteristic.ContactSensorState, consumptionEnergyLevelDetected)
                            }
                            this.consumptionTotalPowerState = consumptionPowerState;
                            this.consumptionTotalPowerPeakDetected = consumptionPowerPeakDetected;
                            this.consumptionTotalEnergyState = consumptionEnergyState;
                            this.consumptionTotalEnergyLevelDetected = consumptionEnergyLevelDetected;
                        }

                        if (i === 1) {
                            if (this.consumptionNetPowerStateSensorService) {
                                this.consumptionNetPowerStateSensorService
                                    .updateCharacteristic(Characteristic.ContactSensorState, consumptionPowerState)
                            }

                            if (this.consumptionNetPowerPeakSensorService) {
                                this.consumptionNetPowerPeakSensorService
                                    .updateCharacteristic(Characteristic.ContactSensorState, consumptionPowerPeakDetected)
                            }

                            if (this.consumptionNetEnergyyStateSensorService) {
                                this.consumptionNetEnergyyStateSensorService
                                    .updateCharacteristic(Characteristic.ContactSensorState, consumptionEnergyState)
                            }

                            if (this.consumptionNetEnergyLevelSensorService) {
                                this.consumptionNetEnergyLevelSensorService
                                    .updateCharacteristic(Characteristic.ContactSensorState, consumptionEnergyLevelDetected)
                            }
                            this.consumptionNetPowerState = consumptionPowerState;
                            this.consumptionNetPowerPeakDetected = consumptionPowerPeakDetected;
                            this.consumptionNetEnergyState = consumptionEnergyState;
                            this.consumptionNetEnergyLevelDetected = consumptionEnergyLevelDetected;
                        }

                        this.metersConsumptionCount = metersConsumptionCount;
                    }
                }

                //ac btteries summary
                if (acBatteriesInstalled) {
                    const acBaterie = productionCtData.data.storage[0];
                    const type = CONSTANS.ApiCodes[acBaterie.type] || 'AC Batterie';
                    const activeCount = acBaterie.activeCount;
                    const readingTime = new Date(acBaterie.readingTime * 1000).toLocaleString();
                    const wNow = parseFloat(acBaterie.wNow) / 1000;
                    const whNow = parseFloat(acBaterie.whNow + this.acBatteriesStorageOffset) / 1000;
                    const chargeStatus = CONSTANS.ApiCodes[acBaterie.state] || 'Undefined';
                    const percentFull = acBaterie.percentFull;

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
                this.currentDayOfWeek = currentDayOfWeek;
                this.currentDayOfMonth = currentDayOfMonth;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('productionct', productionCtData.data) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Production CT', productionCtData.data) : false;
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
                const microinverters = microinvertersData.data;
                const debug = this.enableDebugMode ? this.emit('debug', `Microinverters: ${JSON.stringify(microinvertersData.data, null, 2)}`) : false;

                this.allMicroinvertersSerialNumber = [];
                for (const microinverter of microinverters) {
                    const serialNumber = microinverter.serialNumber;
                    this.allMicroinvertersSerialNumber.push(serialNumber);
                }

                //microinverters power
                this.microinvertersReadingTime = [];
                this.microinvertersDevType = [];
                this.microinvertersLastPower = [];
                this.microinvertersMaxPower = [];

                for (let i = 0; i < this.microinvertersCount; i++) {
                    const index = this.allMicroinvertersSerialNumber.findIndex(index => index === this.microinvertersSerialNumber[i]);
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
                const restFul = this.restFulConnected ? this.restFul.update('microinverters', microinvertersData.data) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Microinverters', microinvertersData.data) : false;
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

                const powerModeData = this.envoyFirmware7xx ? await this.axiosInstance(powerModeUrl) : await this.digestAuthInstaller.request(powerModeUrl, options);
                const debug = this.enableDebugMode ? this.emit('debug', `Power mode: ${JSON.stringify(powerModeData.data, null, 2)}`) : false;

                const productionPowerMode = powerModeData.data.powerForcedOff === false;
                if (this.envoysService) {
                    this.envoysService[0]
                        .updateCharacteristic(Characteristic.enphaseEnvoyProductionPowerMode, productionPowerMode)
                }
                this.productionPowerMode = productionPowerMode;
                this.productionPowerModeSupported = true;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('powermode', powerModeData.data) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('Power Mode', powerModeData.data) : false;
                resolve();
            } catch (error) {
                reject(`Requesting power mode error: ${error}.`);
            };
        });
    }

    updatePlcLevelData() {
        return new Promise(async (resolve, reject) => {
            const debug = this.enableDebugMode ? this.emit('debug', `Requesting plc level.`) : false;

            // get devices count
            const microinvertersCount = this.microinvertersCount
            const acBatteriesCount = this.acBatteriesCount;
            const qRelaysCount = this.qRelaysCount;
            const enchargesCount = this.enchargesCount;
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
                const debug = this.enableDebugMode ? this.emit('debug', `Plc level: ${JSON.stringify(plcLevelData.data, null, 2)}`) : false;

                //create arrays
                this.microinvertersCommLevel = [];
                this.acBatteriesCommLevel = [];
                this.qRelaysCommLevel = [];
                this.enchargesCommLevel = [];

                // get comm level data
                const commLevel = plcLevelData.data;

                for (let i = 0; i < microinvertersCount; i++) {
                    const key = `${this.microinvertersSerialNumber[i]}`;
                    const value = (commLevel[key] || 0) * 20;

                    if (this.microinvertersService) {
                        this.microinvertersService[i]
                            .updateCharacteristic(Characteristic.enphaseMicroinverterCommLevel, value)
                    }
                    this.microinvertersCommLevel.push(value);
                }

                for (let i = 0; i < acBatteriesCount; i++) {
                    const key = `${this.acBatteriesSerialNumber[i]}`;
                    const value = (commLevel[key] || 0) * 20;

                    if (this.acBatteriesService) {
                        this.acBatteriesService[i]
                            .updateCharacteristic(Characteristic.enphaseAcBatterieCommLevel, value)
                    }
                    this.acBatteriesCommLevel.push(value);
                }

                for (let i = 0; i < qRelaysCount; i++) {
                    const key = `${this.qRelaysSerialNumber[i]}`;
                    const value = (commLevel[key] || 0) * 20;

                    if (this.qRelaysService) {
                        this.qRelaysService[i]
                            .updateCharacteristic(Characteristic.enphaseQrelayCommLevel, value)
                    }
                    this.qRelaysCommLevel.push(value);
                }

                for (let i = 0; i < enchargesCount; i++) {
                    const key = `${this.enchargesSerialNumber[i]}`;
                    const value = (commLevel[key] || 0) * 20;

                    if (this.enchargesService) {
                        this.enchargesService[i]
                            .updateCharacteristic(Characteristic.enphaseEnchargeCommLevel, value)
                    }
                    this.enchargesCommLevel.push(value);
                }

                //disable check comm level switch
                if (this.envoysService) {
                    this.envoysService[0]
                        .updateCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel, false);
                }
                this.checkCommLevel = false;
                this.plcLevelSupported = true;

                //restFul
                const restFul = this.restFulConnected ? this.restFul.update('plclevel', plcLevelData.data) : false;

                //mqtt
                const mqtt = this.mqttConnected ? this.mqtt.send('PLC Level', plcLevelData.data) : false;
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
                const debug1 = this.enableDebugMode ? this.emit('debug', `Prepare information service`) : false;
                accessory.getService(Service.AccessoryInformation)
                    .setCharacteristic(Characteristic.Manufacturer, 'Enphase')
                    .setCharacteristic(Characteristic.Model, this.envoyModelName)
                    .setCharacteristic(Characteristic.SerialNumber, this.envoySerialNumber)
                    .setCharacteristic(Characteristic.FirmwareRevision, this.envoyFirmware);

                //get enabled devices
                const metersInstalled = this.metersInstalled;
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
                const liveDataMetersIsSplitPhase = this.liveDataMetersIsSplitPhase;

                //instalacja pv
                const debug2 = this.enableDebugMode ? this.emit('debug', `Prepare system service`) : false;
                this.systemsPvService = [];
                const systemPvService = new Service.Lightbulb(accessoryName, `systemPvService`);
                systemPvService.getCharacteristic(Characteristic.On)
                    .onGet(async () => {
                        const state = this.productionPowerState;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, production power state: ${state ? 'Active' : 'Not active'}`);
                        return state;
                    })
                    .onSet(async (state) => {
                        try {
                            this.systemsPvService[0].updateCharacteristic(Characteristic.On, this.productionPowerState);
                        } catch (error) {
                            this.emit('error', `envoy: ${serialNumber}, set production power state error: ${error}`);
                        };
                    })
                systemPvService.getCharacteristic(Characteristic.Brightness)
                    .onGet(async () => {
                        const state = this.productionPowerLevel;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, production power level: ${this.productionPowerLevel} %`);
                        return state;
                    })
                    .onSet(async (value) => {
                        try {
                            this.systemsPvService[0].updateCharacteristic(Characteristic.Brightness, this.productionPowerLevel);
                        } catch (error) {
                            this.emit('error', `envoy: ${serialNumber}, set production power level error: ${error}`);
                        };
                    })
                this.systemsPvService.push(systemPvService);
                accessory.addService(systemPvService);

                //envoy
                const debug3 = this.enableDebugMode ? this.emit('debug', `Prepare envoy service`) : false;
                this.envoysService = [];
                const enphaseEnvoyService = new Service.enphaseEnvoyService(`Envoy ${serialNumber}`, 'enphaseEnvoyService');
                enphaseEnvoyService.setCharacteristic(Characteristic.ConfiguredName, `Envoy ${serialNumber}`);
                enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyAlerts)
                    .onGet(async () => {
                        const value = this.envoyAlerts;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, alerts: ${value}`);
                        return value;
                    });
                enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyPrimaryInterface)
                    .onGet(async () => {
                        const value = this.envoyPrimaryInterface;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, network interface: ${value}`);
                        return value;
                    });
                enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyNetworkWebComm)
                    .onGet(async () => {
                        const value = this.envoyWebComm;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, web communication: ${value ? 'Yes' : 'No'}`);
                        return value;
                    });
                enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyEverReportedToEnlighten)
                    .onGet(async () => {
                        const value = this.envoyEverReportedToEnlighten;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, report to enlighten: ${value ? 'Yes' : 'No'}`);
                        return value;
                    });
                enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumAndLevel)
                    .onGet(async () => {
                        const value = (`${this.envoyCommNum} / ${this.envoyCommLevel}`);
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication devices and level: ${value} %`);
                        return value;
                    });
                enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumNsrbAndLevel)
                    .onGet(async () => {
                        const value = (`${this.envoyCommNsrbNum} / ${this.envoyCommNsrbLevel}`);
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication qRelays and level: ${value} %`);
                        return value;
                    });
                enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumPcuAndLevel)
                    .onGet(async () => {
                        const value = (`${this.envoyCommPcuNum} / ${this.envoyCommPcuLevel}`);
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication Microinverters and level: ${value} %`);
                        return value;
                    });
                if (acBatteriesInstalled) {
                    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumAcbAndLevel)
                        .onGet(async () => {
                            const value = (`${this.envoyCommAcbNum} / ${this.envoyCommAcbLevel}`);
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication AC Batteries and level ${value} %`);
                            return value;
                        });
                }
                if (enchargesInstalled) {
                    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCommNumEnchgAndLevel)
                        .onGet(async () => {
                            const value = (`${this.envoyCommEnchgNum} / ${this.envoyCommEnchgLevel}`);
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, communication Encharges and level ${value} %`);
                            return value;
                        });
                }
                enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyDbSize)
                    .onGet(async () => {
                        const value = `${this.envoyDbSize} / ${this.envoyDbPercentFull}`;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, data base size: ${value} %`);
                        return value;
                    });
                enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyTariff)
                    .onGet(async () => {
                        const value = this.envoyTariff;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, tariff: ${value}`);
                        return value;
                    });
                enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyUpdateStatus)
                    .onGet(async () => {
                        const value = this.envoyUpdateStatus;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, update status: ${value}`);
                        return value;
                    });
                enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyFirmware)
                    .onGet(async () => {
                        const value = this.envoyFirmware;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, firmware: ${value}`);
                        return value;
                    });
                enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyTimeZone)
                    .onGet(async () => {
                        const value = this.envoyTimeZone;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, time zone: ${value}`);
                        return value;
                    });
                enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCurrentDateTime)
                    .onGet(async () => {
                        const value = `${this.envoyCurrentDate} ${this.envoyCurrentTime}`;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, current date and time: ${value}`);
                        return value;
                    });
                enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyLastEnlightenReporDate)
                    .onGet(async () => {
                        const value = this.envoyLastEnlightenReporDate;
                        const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, last report to enlighten: ${value}`);
                        return value;
                    });
                if (enpowersInstalled) {
                    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyEnpowerConnected)
                        .onGet(async () => {
                            const value = this.envoyEnpowerConnected;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, enpower connected: ${value ? 'Yes' : 'No'}`);
                            return value;
                        });
                    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyEnpowerGridStatus)
                        .onGet(async () => {
                            const value = this.envoyEnpowerGridStatus;
                            const info = this.disableLogInfo ? false : this.emit('message', `Envoy: ${serialNumber}, enpower grid status: ${value}`);
                            return value;
                        });
                }
                if (plcLevelSupported) {
                    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyCheckCommLevel)
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
                    enphaseEnvoyService.getCharacteristic(Characteristic.enphaseEnvoyProductionPowerMode)
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
                this.envoysService.push(enphaseEnvoyService);
                accessory.addService(enphaseEnvoyService);

                //qrelays
                if (qRelaysInstalled) {
                    this.qRelaysService = [];
                    for (let i = 0; i < qRelaysCount; i++) {
                        const qRelaySerialNumber = this.qRelaysSerialNumber[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Q-Relay ${qRelaySerialNumber} service`) : false;
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
                if (metersInstalled) {
                    this.metersService = [];
                    for (let i = 0; i < metersCount; i++) {
                        const meterMeasurementType = this.metersMeasurementType[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare Meter ${meterMeasurementType} service`) : false;
                        const enphaseMeterService = new Service.enphaseMeterService(`Meter ${meterMeasurementType}`, `enphaseMeterService${i}`);
                        enphaseMeterService.setCharacteristic(Characteristic.ConfiguredName, `Meter ${meterMeasurementType}`);
                        enphaseMeterService.getCharacteristic(Characteristic.enphaseMeterState)
                            .onGet(async () => {
                                const value = this.metersState[i];
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
                        this.metersService.push(enphaseMeterService);
                        accessory.addService(enphaseMeterService);
                    }
                }

                //power and energy production
                this.productionsService = [];
                const debug4 = this.enableDebugMode ? this.emit('debug', `Prepare production power and energy service`) : false;
                const enphaseProductionService = new Service.enphasePowerAndEnergyService(`Production Power And Energy`, 'enphaseProductionService');
                enphaseProductionService.setCharacteristic(Characteristic.ConfiguredName, `Production Power And Energy`);
                enphaseProductionService.getCharacteristic(Characteristic.enphasePower)
                    .onGet(async () => {
                        const value = this.productionPower;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production power: ${value} kW`);
                        return value;
                    });
                enphaseProductionService.getCharacteristic(Characteristic.enphasePowerMax)
                    .onGet(async () => {
                        const value = this.productionPowerPeak;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production power peak: ${value} kW`);
                        return value;
                    });
                enphaseProductionService.getCharacteristic(Characteristic.enphasePowerMaxDetected)
                    .onGet(async () => {
                        const value = this.productionPowerPeakDetected;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production power peak detected: ${value ? 'Yes' : 'No'}`);
                        return value;
                    });
                enphaseProductionService.getCharacteristic(Characteristic.enphaseEnergyToday)
                    .onGet(async () => {
                        const value = this.productionEnergyToday;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production energy today: ${value} kWh`);
                        return value;
                    });
                enphaseProductionService.getCharacteristic(Characteristic.enphaseEnergyLastSevenDays)
                    .onGet(async () => {
                        const value = this.productionEnergyLastSevenDays;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production energy last seven days: ${value} kWh`);
                        return value;
                    });
                enphaseProductionService.getCharacteristic(Characteristic.enphaseEnergyLifeTime)
                    .onGet(async () => {
                        const value = this.productionEnergyLifeTime;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production energy lifetime: ${value} kWh`);
                        return value;
                    });
                if (metersInstalled && metersProductionEnabled) {
                    enphaseProductionService.getCharacteristic(Characteristic.enphaseRmsCurrent)
                        .onGet(async () => {
                            const value = this.productionRmsCurrent;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production current: ${value} A`);
                            return value;
                        });
                    enphaseProductionService.getCharacteristic(Characteristic.enphaseRmsVoltage)
                        .onGet(async () => {
                            const value = this.productionRmsVoltage;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production voltage: ${value} V`);
                            return value;
                        });
                    enphaseProductionService.getCharacteristic(Characteristic.enphaseReactivePower)
                        .onGet(async () => {
                            const value = this.productionReactivePower;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production net reactive power: ${value} kVAr`);
                            return value;
                        });
                    enphaseProductionService.getCharacteristic(Characteristic.enphaseApparentPower)
                        .onGet(async () => {
                            const value = this.productionApparentPower;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production net apparent power: ${value} kVA`);
                            return value;
                        });
                    enphaseProductionService.getCharacteristic(Characteristic.enphasePwrFactor)
                        .onGet(async () => {
                            const value = this.productionPwrFactor;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production power factor: ${value} cos φ`);
                            return value;
                        });
                }
                enphaseProductionService.getCharacteristic(Characteristic.enphaseReadingTime)
                    .onGet(async () => {
                        const value = this.productionReadingTime;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production last report: ${value}`);
                        return value;
                    });
                enphaseProductionService.getCharacteristic(Characteristic.enphasePowerMaxReset)
                    .onGet(async () => {
                        const state = false;
                        const info = this.disableLogInfo ? false : this.emit('message', `Production power peak reset: Off`);
                        return state;
                    })
                    .onSet(async (state) => {
                        try {
                            const write = state ? await fsPromises.writeFile(this.productionPowerPeakFile, '0') : false;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production power peak reset: On`);
                            enphaseProductionService.updateCharacteristic(Characteristic.enphasePowerMaxReset, false);
                        } catch (error) {
                            this.emit('debug', `Production Power Peak reset error: ${error}`);
                        };
                    });
                this.productionsService.push(enphaseProductionService);
                accessory.addService(enphaseProductionService);

                //production state sensor service
                if (this.powerProductionStateSensor) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare production power state sensor service`) : false;
                    this.productionPowerStateSensorService = new Service.ContactSensor(`Production Power State`, `productionPowerStateSensorService`);
                    this.productionPowerStateSensorService.setCharacteristic(Characteristic.ConfiguredName, `Production Power State`);
                    this.productionPowerStateSensorService.getCharacteristic(Characteristic.ContactSensorState)
                        .onGet(async () => {
                            const state = this.productionPowerState;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production power state sensor: ${state ? 'Active' : 'Not active'}`);
                            return state;
                        });
                    accessory.addService(this.productionPowerStateSensorService);
                };

                //production power peak sensor service
                if (this.powerProductionPeakSensor) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare production power peak sensor service`) : false;
                    this.productionPowerPeakSensorService = new Service.ContactSensor(`Production Power Peak`, `productionPowerPeakSensorService`);
                    this.productionPowerPeakSensorService.setCharacteristic(Characteristic.ConfiguredName, `Production Power Peak`);
                    this.productionPowerPeakSensorService.getCharacteristic(Characteristic.ContactSensorState)
                        .onGet(async () => {
                            const state = this.productionPowerPeakDetected;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production power peak sensor: ${state ? 'Active' : 'Not active'}`);
                            return state;
                        });
                    accessory.addService(this.productionPowerPeakSensorService);
                };

                //production energy state sensor service
                if (this.energyProductionStateSensor) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare production energy state sensor service`) : false;
                    this.productionEnergyStateSensorService = new Service.ContactSensor(`Production Energy State`, `productionEnergyStateSensorService`);
                    this.productionEnergyStateSensorService.setCharacteristic(Characteristic.ConfiguredName, `Production Energy State`);
                    this.productionEnergyStateSensorService.getCharacteristic(Characteristic.ContactSensorState)
                        .onGet(async () => {
                            const state = this.productionEnergyState;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production energy state sensor: ${state ? 'Active' : 'Not active'}`);
                            return state;
                        });
                    accessory.addService(this.productionEnergyStateSensorService);
                };

                //production energy level sensor service
                if (this.energyProductionLevelSensor) {
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare production energy level sensor service`) : false;
                    this.productionEnergyLevelSensorService = new Service.ContactSensor(`ProductionEnergy  Level`, `productionEnergyLevelSensorService`);
                    this.productionEnergyLevelSensorService.setCharacteristic(Characteristic.ConfiguredName, `Production Energy Level`);
                    this.productionEnergyLevelSensorService.getCharacteristic(Characteristic.ContactSensorState)
                        .onGet(async () => {
                            const state = this.productionEnergyLevelDetected;
                            const info = this.disableLogInfo ? false : this.emit('message', `Production energy level sensor: ${state ? 'Active' : 'Not active'}`);
                            return state;
                        });
                    accessory.addService(this.productionEnergyLevelSensorService);
                };

                //power and energy consumption
                if (metersInstalled && metersConsumptionEnabled) {
                    this.consumptionsService = [];
                    for (let i = 0; i < metersConsumptionCount; i++) {
                        const consumptionMeasurmentType = this.consumptionsMeasurmentType[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} power and energy service`) : false;
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
                                    const consumptionFile = [this.consumptionTotalPowerPeakFile, this.consumptionNetPowerPeakFile][i];
                                    const write = state ? await fsPromises.writeFile(consumptionFile, '0') : false;
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
                            if (this.powerConsumptionTotalStateSensor) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} power state sensor service`) : false;
                                this.consumptionTotalPowerStateSensorService = new Service.ContactSensor(`${consumptionMeasurmentType} Power State`, `consumptionTotalPowerStateSensorService`);
                                this.consumptionTotalPowerStateSensorService.setCharacteristic(Characteristic.ConfiguredName, `${consumptionMeasurmentType} Power State`);
                                this.consumptionTotalPowerStateSensorService.getCharacteristic(Characteristic.ContactSensorState)
                                    .onGet(async () => {
                                        const state = this.consumptionTotalPowerState;
                                        const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power state sensor: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                accessory.addService(this.consumptionTotalPowerStateSensorService);
                            };

                            //consumption total power peak sensor service
                            if (this.powerConsumptionTotalPeakSensor) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} power peak service`) : false;
                                this.consumptionTotalPowerPeakSensorService = new Service.ContactSensor(`${consumptionMeasurmentType} Power Peak`, `consumptionTotalPowerPeakSensorService`);
                                this.consumptionTotalPowerPeakSensorService.setCharacteristic(Characteristic.ConfiguredName, `${consumptionMeasurmentType} Power Peak`);
                                this.consumptionTotalPowerPeakSensorService.getCharacteristic(Characteristic.ContactSensorState)
                                    .onGet(async () => {
                                        const state = this.consumptionTotalPowerPeakDetected;
                                        const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power peak sensor: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                accessory.addService(this.consumptionTotalPowerPeakSensorService)
                            };

                            //consumption total energy state sensor service
                            if (this.energyConsumptionTotalStateSensor) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} energy state sensor service`) : false;
                                this.consumptionTotalEnergyStateSensorService = new Service.ContactSensor(`${consumptionMeasurmentType} Energy State`, `consumptionTotalEnergyStateSensorService`);
                                this.consumptionTotalEnergyStateSensorService.setCharacteristic(Characteristic.ConfiguredName, `${consumptionMeasurmentType} Energy State`);
                                this.consumptionTotalEnergyStateSensorService.getCharacteristic(Characteristic.ContactSensorState)
                                    .onGet(async () => {
                                        const state = this.consumptionTotalEnergyState;
                                        const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} energy state sensor: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                accessory.addService(this.consumptionTotalEnergyStateSensorService);
                            };

                            //consumption total energy level sensor service
                            if (this.energyConsumptionTotaLevelSensor) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} energy level sensor service`) : false;
                                this.consumptionTotalEnergyLevelSensorService = new Service.ContactSensor(`${consumptionMeasurmentType} Energy Level`, `consumptionTotalEnergyLevelSensorService`);
                                this.consumptionTotalEnergyLevelSensorService.setCharacteristic(Characteristic.ConfiguredName, `${consumptionMeasurmentType} Energy Level`);
                                this.consumptionTotalEnergyLevelSensorService.getCharacteristic(Characteristic.ContactSensorState)
                                    .onGet(async () => {
                                        const state = this.consumptionTotalEnergyLevelDetected;
                                        const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} energy level sensor: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                accessory.addService(this.consumptionTotalEnergyLevelSensorService);
                            };
                        };

                        //net
                        if (i === 1) {
                            //consumption total state sensor service
                            if (this.powerConsumptionNetStateSensor) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} power state sensor service`) : false;
                                this.consumptionNetPowerStateSensorService = new Service.ContactSensor(`${consumptionMeasurmentType} Power State`, `consumptionNetPowerStateSensorService`);
                                this.consumptionNetPowerStateSensorService.setCharacteristic(Characteristic.ConfiguredName, `${consumptionMeasurmentType} Power State`);
                                this.consumptionNetPowerStateSensorService.getCharacteristic(Characteristic.ContactSensorState)
                                    .onGet(async () => {
                                        const state = this.consumptionNetPowerState;
                                        const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power state sensor: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                accessory.addService(this.consumptionNetPowerStateSensorService);
                            };

                            //consumption net power peak sensor service
                            if (this.powerConsumptionNetPeakSensor) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} power peak sensor service`) : false;
                                this.consumptionNetPowerPeakSensorService = new Service.ContactSensor(`${consumptionMeasurmentType} Power Peak`, `consumptionNetPowerPeakSensorService`);
                                this.consumptionNetPowerPeakSensorService.setCharacteristic(Characteristic.ConfiguredName, `${consumptionMeasurmentType} Power Peak`);
                                this.consumptionNetPowerPeakSensorService.getCharacteristic(Characteristic.ContactSensorState)
                                    .onGet(async () => {
                                        const state = this.consumptionNetPowerPeakDetected;
                                        const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} power peak sensor: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                accessory.addService(this.consumptionNetPowerPeakSensorService)
                            };

                            //consumption net energy state sensor service
                            if (this.energyConsumptionNetStateSensor) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} energy state sensor service`) : false;
                                this.consumptionNetEnergyStateSensorService = new Service.ContactSensor(`${consumptionMeasurmentType} Energy State`, `consumptionNetEnergyStateSensorService`);
                                this.consumptionNetEnergyStateSensorService.setCharacteristic(Characteristic.ConfiguredName, `${consumptionMeasurmentType} Energy State`);
                                this.consumptionNetEnergyStateSensorService.getCharacteristic(Characteristic.ContactSensorState)
                                    .onGet(async () => {
                                        const state = this.consumptionNetEnergyState;
                                        const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} energy state sensor: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                accessory.addService(this.consumptionNetEnergyStateSensorService);
                            };

                            //consumption net energy level sensor service
                            if (this.energyConsumptionNetLevelSensor) {
                                const debug = this.enableDebugMode ? this.emit('debug', `Prepare ${consumptionMeasurmentType} energy level sensor service`) : false;
                                this.consumptionNetEnergyLevelSensorService = new Service.ContactSensor(`${consumptionMeasurmentType} Energy Level`, `consumptionNetEnergyLevelSensorService`);
                                this.consumptionNetEnergyLevelSensorService.setCharacteristic(Characteristic.ConfiguredName, `${consumptionMeasurmentType} Energy Level`);
                                this.consumptionNetEnergyLevelSensorService.getCharacteristic(Characteristic.ContactSensorState)
                                    .onGet(async () => {
                                        const state = this.consumptionNetEnergyLevelDetected;
                                        const info = this.disableLogInfo ? false : this.emit('message', `${consumptionMeasurmentType} energy level sensor: ${state ? 'Active' : 'Not active'}`);
                                        return state;
                                    });
                                accessory.addService(this.consumptionNetEnergyLevelSensorService);
                            };
                        };
                    }
                }

                //ac batteries summary
                if (acBatteriesInstalled) {
                    this.acBatteriesSummaryService = [];
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ac batteries summary service`) : false;
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
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ac batterie ${acBatterieSerialNumber} service`) : false;
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
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare microinverter ${microinverterSerialNumber} service`) : false;
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
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare ensemble ${ensembleSerialNumber} service`) : false;
                        const enphaseEnsembleService = new Service.enphaseEnsembleService(`Ensemble ${ensembleSerialNumber}`, `enphaseEnsembleService${i}`);
                        enphaseEnsembleService.setCharacteristic(Characteristic.ConfiguredName, `Ensemble ${ensembleSerialNumber}`);
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEsubProducing)
                            .onGet(async () => {
                                const value = this.ensemblesProducing[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${ensembleSerialNumber}, producing: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEsubCommunicating)
                            .onGet(async () => {
                                const value = this.ensemblesCommunicating[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${ensembleSerialNumber}, communicating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            });
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEsubOperating)
                            .onGet(async () => {
                                const value = this.ensemblesOperating[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${ensembleSerialNumber}, operating: ${value ? 'Yes' : 'No'}`);
                                return value;
                            })
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEsubStatus)
                            .onGet(async () => {
                                const value = this.ensemblesStatus[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${ensembleSerialNumber}, status: ${value}`);
                                return value;
                            });
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEsubFirmware)
                            .onGet(async () => {
                                const value = this.ensemblesFirmware[i];
                                const info = this.disableLogInfo ? false : this.emit('message', `Ensemble: ${ensembleSerialNumber}, firmware: ${value}`);
                                return value;
                            });
                        enphaseEnsembleService.getCharacteristic(Characteristic.enphaseEsubLastReportDate)
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
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare ensemble summary service`) : false;
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

                    //enpower grid state sensor service
                    if (this.enpowerGridStateSensor) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare enpower grid state sensor service`) : false;
                        this.enpowerGridStateSensorService = new Service.ContactSensor(`Enpower Grid State`, `enpowerGridStateSensorService`);
                        this.enpowerGridStateSensorService.setCharacteristic(Characteristic.ConfiguredName, `Enpower Grid State`);
                        this.enpowerGridStateSensorService.getCharacteristic(Characteristic.ContactSensorState)
                            .onGet(async () => {
                                const state = this.enpowerGridState;
                                const info = this.disableLogInfo ? false : this.emit('message', `Enpower grid state sensor: ${state ? 'Active' : 'Not active'}`);
                                return state;
                            });
                        accessory.addService(this.enpowerGridStateSensorService);
                    };

                    //encharge grid state sensor service
                    if (this.enchargeGridStateSensor) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare encharge grid state sensor service`) : false;
                        this.enchargeGridStateSensorService = new Service.ContactSensor(`Encharge Grid State`, `enchargeGridStateSensorService`);
                        this.enchargeGridStateSensorService.setCharacteristic(Characteristic.ConfiguredName, `Encharge Grid State`);
                        this.enchargeGridStateSensorService.getCharacteristic(Characteristic.ContactSensorState)
                            .onGet(async () => {
                                const state = this.enchargeGridState;
                                const info = this.disableLogInfo ? false : this.emit('message', `Encharge grid state sensor: ${state ? 'Active' : 'Not active'}`);
                                return state;
                            });
                        accessory.addService(this.enchargeGridStateSensorService);
                    };

                    //solar grid state sensor service
                    if (this.solarGridStateSensor) {
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare solar grid state sensor service`) : false;
                        this.solarGridStateSensorService = new Service.ContactSensor(`Solar Grid State`, `solarGridStateSensorService`);
                        this.solarGridStateSensorService.setCharacteristic(Characteristic.ConfiguredName, `Solar Grid State`);
                        this.solarGridStateSensorService.getCharacteristic(Characteristic.ContactSensorState)
                            .onGet(async () => {
                                const state = this.solarGridState;
                                const info = this.disableLogInfo ? false : this.emit('message', `Solar grid state sensor: ${state ? 'Active' : 'Not active'}`);
                                return state;
                            });
                        accessory.addService(this.solarGridStateSensorService);
                    };
                }

                //encharges
                if (enchargesInstalled) {
                    this.enchargesService = [];
                    for (let i = 0; i < enchargesCount; i++) {
                        const enchargeSerialNumber = this.enchargesSerialNumber[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare encharge ${enchargeSerialNumber} service`) : false;
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
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare enpower ${enpowerSerialNumber} service`) : false;
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

                    //live data pv
                    this.liveDataPvService = [];
                    const debug = this.enableDebugMode ? this.emit('debug', `Prepare live data pv service`) : false;
                    const enphaseLiveDataPvService = new Service.enphaseLiveDataPvService(`Live Data PV`, `enphaseLiveDataPvService`);
                    enphaseLiveDataPvService.setCharacteristic(Characteristic.ConfiguredName, `Live Data PV`);
                    enphaseLiveDataPvService.getCharacteristic(Characteristic.enphaseLiveDataPvActivePower)
                        .onGet(async () => {
                            const value = this.liveDataPvActivePower;
                            const info = this.disableLogInfo ? false : this.emit('message', `Live Data PV, active power: ${value} kW`);
                            return value;
                        });
                    enphaseLiveDataPvService.getCharacteristic(Characteristic.enphaseLiveDataPvActivePowerL1)
                        .onGet(async () => {
                            const value = this.liveDataPvActivePowerL1;
                            const info = this.disableLogInfo ? false : this.emit('message', `Live Data PV L1, active power: ${value} kW`);
                            return value;
                        });
                    enphaseLiveDataPvService.getCharacteristic(Characteristic.enphaseLiveDataPvActivePowerL2)
                        .onGet(async () => {
                            const value = this.liveDataPvActivePowerL2;
                            const info = this.disableLogInfo ? false : this.emit('message', `Live Data PV L2, active power: ${value} kW`);
                            return value;
                        });
                    enphaseLiveDataPvService.getCharacteristic(Characteristic.enphaseLiveDataPvActivePowerL3)
                        .onGet(async () => {
                            const value = this.liveDataPvActivePowerL3;
                            const info = this.disableLogInfo ? false : this.emit('message', `Live Data PV L3, active power: ${value} kW`);
                            return value;
                        });
                    enphaseLiveDataPvService.getCharacteristic(Characteristic.enphaseLiveDataPvApparentPower)
                        .onGet(async () => {
                            const value = this.liveDataPvApparentPower;
                            const info = this.disableLogInfo ? false : this.emit('message', `Live Data PV, apparent power: ${value} kVA`);
                            return value;
                        });
                    enphaseLiveDataPvService.getCharacteristic(Characteristic.enphaseLiveDataPvApparentPowerL1)
                        .onGet(async () => {
                            const value = this.liveDataPvApparentPowerL1;
                            const info = this.disableLogInfo ? false : this.emit('message', `Live Data PV L1, apparent power: ${value} kVA`);
                            return value;
                        });
                    enphaseLiveDataPvService.getCharacteristic(Characteristic.enphaseLiveDataPvApparentPowerL2)
                        .onGet(async () => {
                            const value = this.liveDataPvApparentPowerL2;
                            const info = this.disableLogInfo ? false : this.emit('message', `Live Data PV L2, apparent power: ${value} kVA`);
                            return value;
                        });
                    enphaseLiveDataPvService.getCharacteristic(Characteristic.enphaseLiveDataPvApparentPowerL3)
                        .onGet(async () => {
                            const value = this.liveDataPvApparentPowerL3;
                            const info = this.disableLogInfo ? false : this.emit('message', `Live Data PV L3, apparent power: ${value} kVA`);
                            return value;
                        });
                    this.liveDataPvService.push(enphaseLiveDataPvService);
                    accessory.addService(enphaseLiveDataPvService);

                    //live data storage
                    if (acBatteriesInstalled || enchargesInstalled) {
                        this.liveDataStorageService = [];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare live data storage service`) : false;
                        const enphaseLiveDataStorageService = new Service.enphaseLiveDataStorageService(`Live Data Storage`, `enphaseLiveDataStorageService`);
                        enphaseLiveDataStorageService.setCharacteristic(Characteristic.ConfiguredName, `Live Data Storage`);
                        enphaseLiveDataStorageService.getCharacteristic(Characteristic.enphaseLiveDataStorageActivePower)
                            .onGet(async () => {
                                const value = this.liveDataStorageActivePower;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Storage, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataStorageService.getCharacteristic(Characteristic.enphaseLiveDataStorageActivePowerL1)
                            .onGet(async () => {
                                const value = this.liveDataStorageActivePowerL1;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Storage L1, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataStorageService.getCharacteristic(Characteristic.enphaseLiveDataStorageActivePowerL2)
                            .onGet(async () => {
                                const value = this.liveDataStorageActivePowerL2;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Storage L2, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataStorageService.getCharacteristic(Characteristic.enphaseLiveDataStorageActivePowerL3)
                            .onGet(async () => {
                                const value = this.liveDataStorageActivePowerL3;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Storage L3, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataStorageService.getCharacteristic(Characteristic.enphaseLiveDataStorageApparentPower)
                            .onGet(async () => {
                                const value = this.liveDataStorageApparentPower;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Storage, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataStorageService.getCharacteristic(Characteristic.enphaseLiveDataStorageApparentPowerL1)
                            .onGet(async () => {
                                const value = this.liveDataStorageApparentPowerL1;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Storage L1, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataStorageService.getCharacteristic(Characteristic.enphaseLiveDataStorageApparentPowerL2)
                            .onGet(async () => {
                                const value = this.liveDataStorageApparentPowerL2;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Storage L2, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataStorageService.getCharacteristic(Characteristic.enphaseLiveDataStorageApparentPowerL3)
                            .onGet(async () => {
                                const value = this.liveDataStorageApparentPowerL3;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Storage L3, apparent power: ${value} kVA`);
                                return value;
                            });
                        this.liveDataStorageService.push(enphaseLiveDataStorageService);
                        accessory.addService(enphaseLiveDataStorageService);
                    }

                    //live data grig
                    if (metersInstalled && metersConsumptionEnabled) {
                        this.liveDataGridService = [];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare live data grid service`) : false;
                        const enphaseLiveDataGridService = new Service.enphaseLiveDataGridService(`Live Data Grid`, `enphaseLiveDataGridService`);
                        enphaseLiveDataGridService.setCharacteristic(Characteristic.ConfiguredName, `Live Data Grid`);
                        enphaseLiveDataGridService.getCharacteristic(Characteristic.enphaseLiveDataGridActivePower)
                            .onGet(async () => {
                                const value = this.liveDataGridActivePower;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Grid, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataGridService.getCharacteristic(Characteristic.enphaseLiveDataGridActivePowerL1)
                            .onGet(async () => {
                                const value = this.liveDataGridActivePowerL1;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Grid L1, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataGridService.getCharacteristic(Characteristic.enphaseLiveDataGridActivePowerL2)
                            .onGet(async () => {
                                const value = this.liveDataGridActivePowerL2;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Grid L2, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataGridService.getCharacteristic(Characteristic.enphaseLiveDataGridActivePowerL3)
                            .onGet(async () => {
                                const value = this.liveDataGridActivePowerL3;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Grid L3, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataGridService.getCharacteristic(Characteristic.enphaseLiveDataGridApparentPower)
                            .onGet(async () => {
                                const value = this.liveDataGridApparentPower;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Grid, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataGridService.getCharacteristic(Characteristic.enphaseLiveDataGridApparentPowerL1)
                            .onGet(async () => {
                                const value = this.liveDataGridApparentPowerL1;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Grid L1, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataGridService.getCharacteristic(Characteristic.enphaseLiveDataGridApparentPowerL2)
                            .onGet(async () => {
                                const value = this.liveDataGridApparentPowerL2;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Grid L2, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataGridService.getCharacteristic(Characteristic.enphaseLiveDataGridApparentPowerL3)
                            .onGet(async () => {
                                const value = this.liveDataGridApparentPowerL3;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Grid L3, apparent power: ${value} kVA`);
                                return value;
                            });
                        this.liveDataGridService.push(enphaseLiveDataGridService);
                        accessory.addService(enphaseLiveDataGridService);
                    }

                    //live data load
                    if (metersInstalled && metersConsumptionEnabled) {
                        this.liveDataLoadService = [];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare live data load service`) : false;
                        const enphaseLiveDataLoadService = new Service.enphaseLiveDataLoadService(`Live Data Load`, `enphaseLiveDataLoadService`);
                        enphaseLiveDataLoadService.setCharacteristic(Characteristic.ConfiguredName, `Live Data Load`);
                        enphaseLiveDataLoadService.getCharacteristic(Characteristic.enphaseLiveDataLoadActivePower)
                            .onGet(async () => {
                                const value = this.liveDataLoadActivePower;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Load, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataLoadService.getCharacteristic(Characteristic.enphaseLiveDataLoadActivePowerL1)
                            .onGet(async () => {
                                const value = this.liveDataLoadActivePowerL1;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Load L1, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataLoadService.getCharacteristic(Characteristic.enphaseLiveDataLoadActivePowerL2)
                            .onGet(async () => {
                                const value = this.liveDataLoadActivePowerL2;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Load L2, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataLoadService.getCharacteristic(Characteristic.enphaseLiveDataLoadActivePowerL3)
                            .onGet(async () => {
                                const value = this.liveDataLoadActivePowerL3;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Load L3, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataLoadService.getCharacteristic(Characteristic.enphaseLiveDataLoadApparentPower)
                            .onGet(async () => {
                                const value = this.liveDataLoadApparentPower;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Load, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataLoadService.getCharacteristic(Characteristic.enphaseLiveDataLoadApparentPowerL1)
                            .onGet(async () => {
                                const value = this.liveDataLoadApparentPowerL1;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Load L1, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataLoadService.getCharacteristic(Characteristic.enphaseLiveDataLoadApparentPowerL2)
                            .onGet(async () => {
                                const value = this.liveDataLoadApparentPowerL2;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Load L2, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataLoadService.getCharacteristic(Characteristic.enphaseLiveDataLoadApparentPowerL3)
                            .onGet(async () => {
                                const value = this.liveDataLoadApparentPowerL3;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Load L3, apparent power: ${value} kVA`);
                                return value;
                            });
                        this.liveDataLoadService.push(enphaseLiveDataLoadService);
                        accessory.addService(enphaseLiveDataLoadService);
                    }

                    //live data generator
                    if (generatorsInstalled) {
                        this.liveDataGeneratorService = [];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare live data generator service`) : false;
                        const enphaseLiveDataGeneratorService = new Service.enphaseLiveDataGeneratorService(`Live Data Generator`, `enphaseLiveDataGeneratorService`);
                        enphaseLiveDataGeneratorService.setCharacteristic(Characteristic.ConfiguredName, `Live Data Generator`);
                        enphaseLiveDataGeneratorService.getCharacteristic(Characteristic.enphaseLiveDataGeneratorActivePower)
                            .onGet(async () => {
                                const value = this.liveDataGeneratorActivePower;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Generator, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataGeneratorService.getCharacteristic(Characteristic.enphaseLiveDataGeneratorActivePowerL1)
                            .onGet(async () => {
                                const value = this.liveDataGeneratorActivePowerL1;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Generator L1, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataGeneratorService.getCharacteristic(Characteristic.enphaseLiveDataGeneratorActivePowerL2)
                            .onGet(async () => {
                                const value = this.liveDataGeneratorActivePowerL2;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Generator L2, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataGeneratorService.getCharacteristic(Characteristic.enphaseLiveDataGeneratorActivePowerL3)
                            .onGet(async () => {
                                const value = this.liveDataGeneratorActivePowerL3;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Generator L3, active power: ${value} kW`);
                                return value;
                            });
                        enphaseLiveDataGeneratorService.getCharacteristic(Characteristic.enphaseLiveDataGeneratorApparentPower)
                            .onGet(async () => {
                                const value = this.liveDataGeneratorApparentPower;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Generator, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataGeneratorService.getCharacteristic(Characteristic.enphaseLiveDataGeneratorApparentPowerL1)
                            .onGet(async () => {
                                const value = this.liveDataGeneratorApparentPowerL1;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Generator L1, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataGeneratorService.getCharacteristic(Characteristic.enphaseLiveDataGeneratorApparentPowerL2)
                            .onGet(async () => {
                                const value = this.liveDataGeneratorApparentPowerL2;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Generator L2, apparent power: ${value} kVA`);
                                return value;
                            });
                        enphaseLiveDataGeneratorService.getCharacteristic(Characteristic.enphaseLiveDataGeneratorApparentPowerL3)
                            .onGet(async () => {
                                const value = this.liveDataGeneratorApparentPowerL3;
                                const info = this.disableLogInfo ? false : this.emit('message', `Live Data Generator L3, apparent power: ${value} kVA`);
                                return value;
                            });
                        this.liveDataGeneratorService.push(enphaseLiveDataGeneratorService);
                        accessory.addService(enphaseLiveDataGeneratorService);
                    }
                }

                //wireless connektion kit
                if (wirelessConnectionKitInstalled) {
                    this.wirelessConnektionsKitService = [];
                    for (let i = 0; i < wirelessConnectionKitConnectionsCount; i++) {
                        const wirelessConnectionType = this.wirelessConnectionsType[i];
                        const debug = this.enableDebugMode ? this.emit('debug', `Prepare wireless connection ${wirelessConnectionType} service`) : false;
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
