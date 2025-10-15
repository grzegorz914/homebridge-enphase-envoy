import axios from 'axios';
import { Agent } from 'https';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';
import EventEmitter from 'events';
import EnvoyToken from './envoytoken.js';
import ImpulseGenerator from './impulsegenerator.js';
import Functions from './functions.js';
import { ApiUrls, PartNumbers, ApiCodes, MetersKeyMap } from './constants.js';
import fakegato from 'fakegato-history';
let Accessory, Characteristic, Service, Categories, AccessoryUUID;

class EnergyMeter extends EventEmitter {
    constructor(api, deviceName, host, displayType, envoyFirmware7xxTokenGenerationMode, envoyPasswd, envoyToken, envoyTokenInstaller, enlightenUser, enlightenPasswd, envoyIdFile, envoyTokenFile, device, prefDir, energyMeterHistoryFileName, log) {
        super();

        Accessory = api.platformAccessory;
        Characteristic = api.hap.Characteristic;
        Service = api.hap.Service;
        Categories = api.hap.Categories;
        AccessoryUUID = api.hap.uuid;

        //device configuration
        this.log = log;
        this.name = deviceName;
        this.host = host;

        this.envoyFirmware7xxTokenGenerationMode = envoyFirmware7xxTokenGenerationMode;
        this.envoyPasswd = envoyPasswd;
        this.enlightenUser = enlightenUser;
        this.enlightenPassword = enlightenPasswd;
        this.envoyToken = envoyToken;
        this.envoyTokenInstaller = envoyTokenInstaller;
        this.powerProductionSummary = device.powerProductionSummary || 1;
        this.energyProductionLifetimeOffset = device.energyProductionLifetimeOffset || 0;
        this.energyConsumptionTotalLifetimeOffset = device.energyConsumptionTotalLifetimeOffset || 0;
        this.energyConsumptionNetLifetimeOffset = device.energyConsumptionNetLifetimeOffset || 0;

        //log
        this.logDeviceInfo = device.log?.deviceInfo || true;
        this.logInfo = device.log?.info || false;
        this.logWarn = device.log?.warn || true;
        this.logError = device.log?.error || true;
        this.logDebug = device.log?.debug || false;

        //setup variables
        this.functions = new Functions();
        this.envoyTokenFile = envoyTokenFile;
        this.checkTokenRunning = false;

        //fakegato
        this.fakegatoHistory = fakegato(api);
        this.prefDir = prefDir;
        this.energyMeterHistoryFileName = energyMeterHistoryFileName;
        this.lastReset = 0;

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
                },
                detailedData: {
                    supported: false
                },
            },
            metersReading: {
                supported: false,
                installed: false
            },
            metersReports: {
                supported: false,
                installed: false
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
            powerAndEnergyData: {
                supported: false
            }
        };

        //pv object
        this.pv = {
            info: {},
            meters: [],
            powerAndEnergy: {
                data: [],
                production: {
                    pcu: {},
                    eim: {},
                    rgm: {},
                    pmu: {},
                },
                consumptionNet: {},
                consumptionTotal: {},
            },
        };

        //lock flags
        this.locks = {
            updatePowerAndEnergy: false
        };

        //impulse generator
        this.impulseGenerator = new ImpulseGenerator()
            .on('updatePowerAndEnergy', () => this.handleWithLock('updatePowerAndEnergy', async () => {
                if (this.feature.meters.supported) {
                    await this.updateMeters();
                    if (this.feature.metersReading.installed && !this.feature.metersReports.installed) await this.updateMetersReading(false);
                    if (this.feature.metersReports.installed) await this.updateMetersReports(false);
                }

                if (this.feature.production.supported) await this.updateProduction();
                if (this.feature.productionPdm.supported && !this.feature.energyPdm.supported) await this.updateProductionPdm();
                if (this.feature.energyPdm.supported) await this.updateEnergyPdm();
                if (this.feature.productionCt.supported) await this.updateProductionCt();
                await this.updatePowerAndEnergyData();
            }))
            .on('state', (state) => {
                this.emit(state ? 'success' : 'warn', `Impulse generator ${state ? 'started' : 'stopped'}`);
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
                keepAlive: true,
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
            this.feature.tokenValid = false;
            return;
        }
        if (this.logError) this.emit('error', `Impulse generator: ${error}`);
    }

    async startStopImpulseGenerator(state) {
        try {
            //start impulse generator 
            const startStop = state ? await this.impulseGenerator.start(this.timers) : await this.impulseGenerator.stop();
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
            const response = await this.axiosInstance.get(ApiUrls.GetInfo);
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
                    const data = await this.functions.readData(this.envoyTokenFile);
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
                passwd: this.enlightenPasswd,
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
                await this.functions.saveData(this.envoyTokenFile, tokenData);
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
                        if (this.logDebug) this.emit('debug', `Unknown meter measurement type: ${meter.measurementType}`);
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
                        voltage: meter.voltage / meterConfig.voltageDivide,
                        pwrFactor: meter.pwrFactor / meterConfig.powerFactorDivide,
                        frequency: meter.freq,
                        channels: meter.channels ?? [],
                    };
                    Object.assign(meterConfig, obj);
                }
                this.feature.metersReading.installed = true;
            }

            //meters readings supported
            this.feature.metersReading.supported = true;

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
                        if (!this.logDebug) this.emit('debug', `Unknown meters reports type: ${measurementType}`);
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
                        voltage: cumulative.rmsVoltage / meterConfig.voltageDivide,
                        pwrFactor: cumulative.pwrFactor / meterConfig.powerFactorDivide,
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

            return true;
        } catch (error) {
            if (start) {
                if (this.logWarn) this.emit('warn', `Meters reports not supported, dont worry all working correct, only some additional data will not be present, error: ${error}`);
                return null;
            }
            throw new Error(`Update meters reports error: ${error}`);
        }
    }

    async updateProduction() {
        if (this.logDebug) this.emit('debug', `Requesting production`);

        try {
            const response = await this.axiosInstance.get(ApiUrls.Production);
            const production = response.data;
            if (this.logDebug) this.emit('debug', `Production:`, production);

            const productionSupported = Object.keys(production).length > 0;
            if (productionSupported) {
                const readingTime = this.functions.formatTimestamp();
                const obj = {
                    type: 'pcu',
                    activeCount: this.feature.inventory.pcus.count,
                    measurementType: 'Production',
                    readingTime,
                    power: production.wattsNow,
                    energyToday: production.wattHoursToday,
                    energyLastSevenDays: production.wattHoursSevenDays,
                    energyLifetime: production.wattHoursLifetime
                };

                this.pv.powerAndEnergy.production.pcu = obj;
                this.feature.production.supported = true;
            }

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

            const readingTime = this.functions.formatTimestamp();

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

            const readingTime = this.functions.formatTimestamp();

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

            // --- Finalize ---
            this.feature.productionCt.supported = true;

            return true;
        } catch (error) {
            throw new Error(`Update production ct error: ${error}`);
        }
    }

    async updatePowerAndEnergyData() {
        if (this.logDebug) this.emit('debug', `Requesting power and energy data`);

        try {
            const powerAndEnergy = [];
            const powerAndEnergyTypeArr = [
                { type: 'production', state: this.feature.meters.production.enabled },
                { type: 'net-consumption', state: this.feature.meters.consumptionNet.enabled },
                { type: 'total-consumption', state: this.feature.meters.consumptionTotal.enabled }
            ];

            for (const [index, data] of powerAndEnergyTypeArr.entries()) {
                const { type: meterType, state: meterEnabled } = data;
                if (meterType !== 'production' && !meterEnabled) continue;

                const key = MetersKeyMap[meterType];
                const measurementType = ApiCodes[meterType];

                let sourceMeter, sourceEnergy;
                let power, energyLifetime;
                switch (key) {
                    case 'production': {
                        const sourcePcu = this.pv.powerAndEnergy[key].pcu;
                        const sourceEim = this.pv.powerAndEnergy[key].eim;
                        sourceMeter = meterEnabled ? this.pv.meters.find(m => m.measurementType === 'production') : sourcePcu;
                        sourceEnergy = meterEnabled ? sourceEim : sourcePcu;
                        power = this.functions.isValidValue(sourceMeter.power) ? sourceMeter.power : null;
                        energyLifetime = this.functions.isValidValue(sourceMeter.energyLifetime) ? sourceMeter.energyLifetime / 1000 : null;
                        break;
                    }
                    case 'consumptionNet': {
                        sourceMeter = this.pv.meters.find(m => m.measurementType === 'net-consumption');
                        sourceEnergy = this.pv.powerAndEnergy.consumptionNet;
                        power = this.functions.isValidValue(sourceMeter.power) ? sourceMeter.power : null;
                        energyLifetime = this.functions.isValidValue(sourceMeter.energyLifetime) ? sourceMeter.energyLifetime / 1000 : null;
                        break;
                    }
                    case 'consumptionTotal': {
                        sourceMeter = this.pv.meters.find(m => m.measurementType === 'total-consumption');
                        sourceEnergy = this.pv.powerAndEnergy.consumptionTotal;
                        power = this.functions.isValidValue(sourceMeter.power) ? sourceMeter.power : null;
                        energyLifetime = this.functions.isValidValue(sourceMeter.energyLifetime) ? sourceMeter.energyLifetime / 1000 : null;
                        break;
                    }
                }

                if (!sourceMeter) continue;
                if (this.logDebug) {
                    this.emit('debug', `${measurementType} data source meter:`, sourceMeter);
                    this.emit('debug', `${measurementType} data source energy:`, sourceEnergy);
                }

                if (key === 'production') {
                    const type = ApiCodes[sourceMeter.type] ?? sourceMeter.type;
                    const obj = {
                        type,
                        measurementType,
                        power,
                        energyLifetime,
                        gridQualityState: meterEnabled,
                    };

                    // Add to fakegato history
                    this.fakegatoHistoryService?.addEntry({
                        time: Math.floor(Date.now() / 1000),
                        power: power
                    });

                    // Create characteristics energy meter
                    const characteristics = [
                        { type: Characteristic.EvePower, value: obj.power },
                        { type: Characteristic.EveEnergyLifetime, value: obj.energyLifetime },
                    ];

                    // Create characteristics energy meter
                    if (meterEnabled) {
                        Object.assign(obj, {
                            current: sourceMeter.current,
                            voltage: sourceMeter.voltage
                        });

                        characteristics.push([
                            { type: Characteristic.EveCurrent, value: sourceMeter.current },
                            { type: Characteristic.EveVoltage, value: sourceMeter.voltage },
                        ]);
                    }

                    // Update characteristics
                    for (const { type, value } of characteristics) {
                        if (!this.functions.isValidValue(value)) continue;
                        this.energyMeterServices?.[index]?.updateCharacteristic(type, value);
                    };

                    powerAndEnergy.push(obj);
                }
            }

            this.pv.powerAndEnergy.data = powerAndEnergy.filter(Boolean);
            this.feature.powerAndEnergyData.supported = true;

            return true;
        } catch (error) {
            throw new Error(`Update power and energy data error: ${error.message || error}`);
        }
    }

    async getDeviceInfo() {
        if (this.logDebug) {
            this.emit('debug', `Requesting device info`);
            this.emit('debug', `Pv object:`, this.pv);
        }

        // Device basic info
        this.emit('devInfo', `-------- ${this.name} --------`);
        this.emit('devInfo', `Manufacturer: Enphase`);
        this.emit('devInfo', `Model: ${this.pv.info.modelName}`);
        this.emit('devInfo', `------------------------------`);
        return true;
    }

    //prepare accessory
    async prepareAccessory() {
        try {
            if (this.logDebug) this.emit('debug', `Prepare accessory`);

            const envoySerialNumber = this.pv.info.serialNumber;
            const accessoryName = this.name;
            const accessoryUUID = AccessoryUUID.generate(envoySerialNumber + 'Energy Meter');
            const accessoryCategory = Categories.SENSOR;
            const accessory = new Accessory(accessoryName, accessoryUUID, accessoryCategory);
            accessory.log = this.log;

            // Accessory Info Service
            if (this.logDebug) this.emit('debug', `Prepare Information Service`);
            accessory.getService(Service.AccessoryInformation)
                .setCharacteristic(Characteristic.Manufacturer, 'Enphase')
                .setCharacteristic(Characteristic.Model, this.pv.info.modelName ?? 'Model Name')
                .setCharacteristic(Characteristic.SerialNumber, envoySerialNumber ?? 'Serial Number')
                .setCharacteristic(Characteristic.FirmwareRevision, this.pv.info.software?.replace(/[a-zA-Z]/g, '') ?? '0');

            // Create FakeGatoHistory
            if (this.logDebug) this.emit('debug', `Prepare Fakegato Service`);
            this.fakegatoHistoryService = new this.fakegatoHistory(`energy`, accessory, {
                storage: 'fs',
                disableRepeatLastData: true,
                disableTimer: false,
                path: this.prefDir,
                filename: this.energyMeterHistoryFileName
            })
            this.fakegatoHistoryService.addEntry({
                time: Math.floor(Date.now() / 1000),
                power: this.pv.powerAndEnergy.data[0].power
            });

            // Energy Meter Service
            this.energyMeterServices = [];
            for (const source of this.pv.powerAndEnergy.data) {
                const measurementType = source.measurementType;

                if (this.logDebug) this.emit('debug', `Prepare Meter ${measurementType} Service`);
                const energyMeterService = accessory.addService(Service.EvePowerMeter, `Energy Meter ${measurementType}`, `energyMeterService${measurementType}`);
                energyMeterService.setCharacteristic(Characteristic.ConfiguredName, `Energy Meter ${measurementType}`);

                // Create characteristics
                const characteristics = [
                    { type: Characteristic.EvePower, label: 'power', value: source.power, unit: 'W' },
                    { type: Characteristic.EveEnergyLifetime, label: 'energy lifetime', value: source.energyLifetime, unit: 'kWh' },
                ];

                if (source.gridQualityState) {
                    characteristics.push(
                        { type: Characteristic.EveCurrent, label: 'current', value: source.current, unit: 'A' },
                        { type: Characteristic.EveVoltage, label: 'voltage', value: source.voltage, unit: 'V' }
                    );
                }

                for (const { type, label, value, unit = '' } of characteristics) {
                    if (!this.functions.isValidValue(value)) continue;

                    energyMeterService.getCharacteristic(type)
                        .onGet(async () => {
                            const currentValue = value;
                            if (this.logInfo) this.emit('info', `Energy Meter: ${measurementType}, ${label}: ${currentValue} ${unit}`);
                            return currentValue;
                        });
                }

                energyMeterService.getCharacteristic(Characteristic.EveResetTime)
                    .onGet(async () => {
                        const resetTime = this.lastReset;
                        if (this.logInfo) this.emit('info', `${measurementType}, reset time: ${resetTime}`);
                        return resetTime;
                    })
                    .onSet(async (value) => {
                        try {
                            this.lastReset = value;
                        } catch (error) {
                            if (this.logWarn) this.emit('warn', `${measurementType}, Reset time error: ${error}`);
                        }
                    });

                this.energyMeterServices.push(energyMeterService);
            }

            return accessory;
        } catch (error) {
            throw new Error(`Prepare accessory error: ${error}`);
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

            // Authenticate
            const tokenValid = tokenRequired ? await this.checkToken(true) : true;
            if (tokenRequired && !tokenValid) return null;

            // Meters
            const getMeters = this.feature.meters.supported ? await this.updateMeters() : false;
            if (getMeters && this.feature.meters.installed) await this.updateMetersReading(true);
            if (getMeters && this.feature.meters.installed) await this.updateMetersReports(true);

            // Production
            if (this.feature.info.firmware < 824) await this.updateProduction();
            if (this.feature.info.firmware >= 824) await this.updateProductionPdm();
            if (this.feature.info.firmware >= 824) await this.updateEnergyPdm();
            if (this.feature.meters.installed) await this.updateProductionCt();

            // Data
            const getPowerAndEnergyData = await this.updatePowerAndEnergyData();

            // Success message
            this.emit('success', `Connect Success`);

            // Optional logging
            if (this.logDeviceInfo) await this.getDeviceInfo();

            // Setup timers
            this.timers = [];
            if (getPowerAndEnergyData) this.timers.push({ name: 'updatePowerAndEnergy', sampling: 10000 });

            // Prepare HomeKit accessory
            const accessory = await this.prepareAccessory();
            return accessory;
        } catch (error) {
            throw new Error(`Start error: ${error}`);
        }
    }

}
export default EnergyMeter;
