import { promises as fsPromises } from 'fs';
import axios from 'axios';
import { Agent } from 'https';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';
import EventEmitter from 'events';
import EnvoyToken from './envoytoken.js';
import ImpulseGenerator from './impulsegenerator.js';
import { ApiUrls, PartNumbers, ApiCodes, MetersKeyMap } from './constants.js';
let Accessory, Characteristic, Service, Categories, AccessoryUUID;

class EnergyMeter extends EventEmitter {
    constructor(api, log, deviceName, host, displayType, envoyFirmware7xxTokenGenerationMode, envoyPasswd, envoyToken, envoyTokenInstaller, enlightenUser, enlightenPasswd, envoyIdFile, envoyTokenFile, device, energyMeterHistory, FakeGatoHistoryService) {
        super();

        Accessory = api.platformAccessory;
        Characteristic = api.hap.Characteristic;
        Service = api.hap.Service;
        Categories = api.hap.Categories;
        AccessoryUUID = api.hap.uuid;

        //device configuration
        this.log = log;
        this.api = api;
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
        this.enableDebugMode = device.enableDebugMode || false;
        this.disableLogInfo = device.disableLogInfo || false;
        this.disableLogDeiceInfo = device.disableLogDeviceInfo || false;

        //setup variables
        this.envoyTokenFile = envoyTokenFile;
        this.energyMeterHistory = energyMeterHistory;
        this.FakeGatoHistoryService = FakeGatoHistoryService;
        this.startPrepareAccessory = true;

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
                consumption: {
                    supported: false,
                    net: {
                        supported: false,
                        enabled: false
                    },
                    total: {
                        supported: false,
                        enabled: false
                    }
                },
                storage: {
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
            metersData: {
                supported: false
            },
            production: {
                supported: false
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
                    supported: false,
                    eim: {
                        net: {
                            installed: false
                        },
                        total: {
                            installed: false
                        }
                    }
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
                    supported: false,
                    eim: {
                        net: {
                            supported: false
                        },
                        total: {
                            supported: false
                        }
                    }
                },
                storage: {
                    supported: false
                }
            },
            powerAndEnergyData: {
                supported: false
            },
            checkTokenRunning: false,
        };

        //pv object
        this.pv = {
            info: {},
            meters: [],
            powerAndEnergy: {
                sources: [],
                production: {
                    pcu: {},
                    eim: {},
                    rgm: {},
                    pmu: {},
                },
                consumption: {
                    eim: {
                        net: {},
                        total: {}
                    }
                }
            }
        };

        //lock flags
        this.locks = {
            updateHome: false,
            updatePowerandEnergy: false,
        };

        //impulse generator
        this.impulseGenerator = new ImpulseGenerator()
            .on('updatePowerandEnergy', () => this.handleWithLock('updatePowerandEnergy', async () => {
                const updateMeters = this.feature.meters.supported ? await this.updateMeters() : false;
                const updateMetersReading = updateMeters && this.feature.meters.installed && this.feature.metersReading.installed && !this.feature.metersReports.installed ? await this.updateMetersReading(false) : false;
                const updateMetersReports = updateMeters && this.feature.meters.installed && this.feature.metersReports.installed ? await this.updateMetersReports(false) : false;
                const updateMetersData = updateMeters && this.feature.metersData.supported ? await this.updateMetersData() : false;

                const updateProduction = this.feature.production.supported ? await this.updateProduction() : false;
                const updateProductionPdm = this.feature.productionPdm.supported && !this.feature.energyPdm.supported ? await this.updateProductionPdm() : false;
                const updateEnergyPdm = this.feature.energyPdm.supported ? await this.updateEnergyPdm() : false;
                const updateProductionCt = this.feature.productionCt.supported ? await this.updateProductionCt() : false;
                const updatePowerAndEnergyData = this.feature.powerAndEnergyData.supported ? await this.updatePowerAndEnergyData() : false;
            }))
            .on('state', (state) => {
                this.emit(state ? 'success' : 'warn', `Impulse generator ${state ? 'started' : 'stopped'}`);
            });
    }

    createAxiosInstance(authHeader = null, cookie = null) {
        return axios.create({
            method: 'GET',
            baseURL: this.url,
            headers: {
                Accept: 'application/json',
                ...(authHeader ? { Authorization: authHeader } : {}),
                ...(cookie ? { Cookie: cookie } : {})
            },
            withCredentials: true,
            httpsAgent: new Agent({
                keepAlive: true,
                rejectUnauthorized: false
            }),
            timeout: 40000
        });
    }

    handleError(error) {
        const errorString = error.toString();
        const tokenNotValid = errorString.includes('status code 401');
        if (tokenNotValid) {
            if (this.feature.checkTokenRunning) {
                return;
            }
            this.feature.info.jwtToken.token = '';
            this.feature.tokenValid = false;
            return;
        }
        this.emit('error', `Impulse generator: ${error}`);
    }

    scaleValue(value, inMin, inMax, outMin, outMax) {
        if (inMax === inMin) return outMin;
        const clamped = Math.max(inMin, Math.min(inMax, value));
        const scaled = ((clamped - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
        return scaled < 1 ? 0 : Math.round(scaled);
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
        if (this.enableDebugMode) this.emit('debug', 'Requesting info');

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

            if (this.enableDebugMode) this.emit('debug', 'Parsed info:', debugParsed);

            const serialNumber = device.sn?.toString() ?? null;
            if (!serialNumber) {
                this.emit('warn', 'Envoy serial number missing!');
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
        if (this.enableDebugMode) this.emit('debug', 'Requesting check token');

        if (this.feature.checkTokenRunning) {
            if (this.enableDebugMode) this.emit('debug', 'Token check already running');
            return null;
        }

        if (!this.feature.info.tokenRequired) {
            if (this.enableDebugMode) this.emit('debug', 'Token not required, skipping token check');
            return true;
        }

        this.feature.checkTokenRunning = true;
        try {
            const now = Math.floor(Date.now() / 1000);

            // Load token from file on startup, only if mode is 1
            if (this.envoyFirmware7xxTokenGenerationMode === 1 && start) {
                try {
                    const data = await this.readData(this.envoyTokenFile);
                    try {
                        const parsedData = JSON.parse(data);
                        const fileTokenExist = parsedData.token ? 'Exist' : 'Missing';
                        if (this.enableDebugMode) this.emit('debug', `Token from file: ${fileTokenExist}`);
                        if (parsedData.token) {
                            this.feature.info.jwtToken = parsedData;
                        }
                    } catch (error) {
                        this.emit('warn', `Token parse error: ${error}`);
                    }
                } catch (error) {
                    this.emit('warn', `Read Token from file error: ${error}`);
                }
            }

            const jwt = this.feature.info.jwtToken || {};
            const tokenExist = jwt.token && (this.envoyFirmware7xxTokenGenerationMode === 2 || jwt.expires_at >= now + 60);

            if (this.enableDebugMode) {
                const remaining = jwt.expires_at ? jwt.expires_at - now : 'N/A';
                this.emit('debug', `Token: ${tokenExist ? 'Exist' : 'Missing'}, expires in ${remaining} seconds`);
            }

            const tokenValid = this.feature.info.tokenValid;
            if (this.enableDebugMode) this.emit('debug', `Token: ${tokenValid ? 'Valid' : 'Not valid'}`);

            // RESTFul and MQTT sync
            if (this.restFulConnected) this.restFul1.update('token', jwt);
            if (this.mqttConnected) this.mqtt1.emit('publish', 'Token', jwt);

            if (tokenExist && tokenValid) {
                if (this.enableDebugMode) this.emit('debug', 'Token check complete: Valid=true');
                return true;
            }

            if (!tokenExist) {
                this.emit('warn', 'Token not exist, requesting new');
                await this.delayBeforeRetry?.() ?? new Promise(resolve => setTimeout(resolve, 30000));
                const gotToken = await this.getToken();
                if (!gotToken) return null;
            }

            if (!this.feature.info.jwtToken.token) {
                this.emit('warn', 'Token became invalid before validation');
                return null;
            }

            this.emit('warn', 'Token exist but not valid, validating');
            const validated = await this.validateToken();
            if (!validated) return null;

            if (this.enableDebugMode) this.emit('debug', 'Token check complete: Valid=true');
            return true;
        } catch (error) {
            throw new Error(`Check token error: ${error}`);
        } finally {
            this.feature.checkTokenRunning = false;
        }
    }

    async getToken() {
        if (this.enableDebugMode) this.emit('debug', 'Requesting token');

        try {
            // Create EnvoyToken instance and attach log event handlers
            const envoyToken = new EnvoyToken({
                user: this.enlightenUser,
                passwd: this.enlightenPassword,
                serialNumber: this.pv.info.serialNumber
            })
                .on('success', message => this.emit('success', message))
                .on('warn', warn => this.emit('warn', warn))
                .on('error', error => this.emit('error', error));

            // Attempt to refresh token
            const tokenData = await envoyToken.refreshToken();

            if (!tokenData || !tokenData.token) {
                this.emit('warn', 'Token request returned empty or invalid');
                return null;
            }

            // Mask token in debug output
            const maskedTokenData = {
                ...tokenData,
                token: `${tokenData.token.slice(0, 5)}...<redacted>`
            };
            if (this.enableDebugMode) this.emit('debug', 'Token:', maskedTokenData);

            // Save token in memory
            this.feature.info.jwtToken = tokenData;

            // Persist token to disk
            try {
                await this.saveData(this.envoyTokenFile, tokenData);
            } catch (error) {
                this.emit('error', `Save token error: ${error}`);
            }

            return true;
        } catch (error) {
            throw new Error(`Get token error: ${error}`);
        }
    }

    async validateToken() {
        if (this.enableDebugMode) this.emit('debug', 'Requesting validate token');

        this.feature.info.tokenValid = false;

        try {
            const jwt = this.feature.info.jwtToken;

            // Create a token-authenticated Axios instance
            const axiosInstance = this.createAxiosInstance(`Bearer ${jwt.token}`);

            // Send validation request
            const response = await axiosInstance(ApiUrls.CheckJwt);
            const responseBody = response.data;

            // Check for expected response string
            const tokenValid = typeof responseBody === 'string' && responseBody.includes('Valid token');
            if (!tokenValid) {
                this.emit('warn', `Token not valid. Response: ${responseBody}`);
                return null;
            }

            // Extract and validate cookie
            const cookie = response.headers['set-cookie'];
            if (!cookie) {
                this.emit('warn', 'No cookie received during token validation');
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
        if (this.enableDebugMode) this.emit('debug', `Requesting meters info`);

        try {
            const response = await this.axiosInstance(ApiUrls.InternalMeterInfo);
            const responseData = response.data;
            if (this.enableDebugMode) this.emit('debug', `Meters:`, responseData);

            // Check if any meters are installed
            const metersInstalled = responseData.length > 0;
            if (metersInstalled) {
                const arr = [];
                for (const meter of responseData) {
                    const measurementType = ApiCodes[meter.measurementType];
                    const key = MetersKeyMap[measurementType];
                    if (!key) {
                        const debug = !this.enableDebugMode ? false : this.emit('debug', `Unknown meter measurement type: ${measurementType}`);
                        continue;
                    }

                    const phaseModeCode = ApiCodes[meter.phaseMode];
                    const meteringStatusCode = ApiCodes[meter.meteringStatus];
                    const voltageDivide = meter.phaseMode === 'split' ? 2 : meter.phaseMode === 'three' ? 3 : 1;

                    const obj = {
                        eid: meter.eid,
                        type: 'eim',
                        activeCount: 1,
                        measurementType: measurementType,
                        state: meter.state === 'enabled',
                        phaseMode: phaseModeCode,
                        phaseCount: meter.phaseCount ?? 1,
                        meteringStatus: meteringStatusCode,
                        statusFlags: meter.statusFlags,
                        voltageDivide: voltageDivide,
                    };
                    arr.push(obj);
                    if (measurementType === 'Production') {
                        this.feature.meters.production.supported = true;
                        this.feature.meters.production.enabled = obj.state;
                    }
                    if (measurementType === 'Consumption Net') {
                        this.feature.meters.consumption.supported = true;
                        this.feature.meters.consumption.net.supported = true;
                        this.feature.meters.consumption.net.enabled = obj.state;
                    }
                    if (measurementType === 'Storage') {
                        this.feature.meters.storage.supported = true;
                        this.feature.meters.storage.enabled = obj.state;
                    }
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
        if (this.enableDebugMode) this.emit('debug', `Requesting meters reading`);

        try {
            const response = await this.axiosInstance(ApiUrls.InternalMeterReadings);
            const responseData = response.data;
            if (this.enableDebugMode) this.emit('debug', `Meters reading:`, responseData);

            // Check if readings exist and are valid
            const metersReadingInstalled = Array.isArray(responseData) && responseData.length > 0;
            if (metersReadingInstalled) {
                for (const meter of responseData) {
                    const index = this.pv.meters.findIndex(m => m.eid === meter.eid);
                    if (index === -1) {
                        const debug = !this.enableDebugMode ? false : this.emit('debug', `Unknown meter readings EID: ${meter.eid}`);
                        continue;
                    }

                    const meterConfig = this.pv.meters[index];
                    const key = MetersKeyMap[meterConfig.measurementType];
                    const state = meterConfig.state;
                    if (key && state) {
                        const obj = {
                            readingTime: meter.timestamp,
                            power: meter.activePower,
                            energyLifetime: meter.actEnergyDlvd,
                            current: meter.current,
                            voltage: meter.voltage,
                        };
                        this.pv.meters[index] = { ...this.pv.meters[index], ...obj };
                    }
                }
                this.feature.metersReading.installed = true;
            }

            //meters readings supported
            this.feature.metersReading.supported = true;

            return true;
        } catch (error) {
            if (start) {
                this.emit('warn', `Meters readings not supported, dont worry all working correct, only some additional data will not be present, error: ${error}`);
                return null;
            }
            throw new Error(`Update meters reading error: ${error}`);
        }
    }

    async updateMetersReports(start) {
        if (this.enableDebugMode) this.emit('debug', `Requesting meters reports`);

        try {
            const response = await this.axiosInstance(ApiUrls.InternalMetersReports);
            const responseData = response.data;
            if (this.enableDebugMode) this.emit('debug', `Meters reports:`, responseData);

            // Check if reports exist
            const metersReportsInstalled = Array.isArray(responseData) && responseData.length > 0;
            if (metersReportsInstalled) {
                for (const meter of responseData) {
                    const measurementType = ApiCodes[meter.reportType];
                    const key = MetersKeyMap[measurementType];
                    if (!key) {
                        const debug = !this.enableDebugMode ? false : this.emit('debug', `Unknown meters reports type: ${measurementType}`);
                        continue;
                    }

                    const index = this.pv.meters.findIndex(m => m.measurementType === measurementType);
                    const cumulative = meter.cumulative;

                    const obj = {
                        readingTime: meter.createdAt,
                        power: cumulative.actPower,
                        energyLifetime: cumulative.whDlvdCum,
                        current: cumulative.rmsCurrent,
                        voltage: cumulative.rmsVoltage,
                    };

                    // Handle each meter type
                    switch (key) {
                        case 'production':
                            if (this.feature.meters.production.enabled) {
                                this.pv.meters[index] = { ...this.pv.meters[index], ...obj };
                            }
                            break;
                        case 'net':
                            if (this.feature.meters.consumption.net.enabled) {
                                this.pv.meters[index] = { ...this.pv.meters[index], ...obj };
                            }
                            break;
                        case 'storage':
                            if (this.feature.meters.storage.enabled) {
                                this.pv.meters[index] = { ...this.pv.meters[index], ...obj };
                            }
                            break;
                        case 'total':
                            if (this.feature.meters.consumption.net.enabled) {
                                const base = this.pv.meters.find(m => m.measurementType === 'Consumption Net');
                                const obj1 = {
                                    eid: base.eid,
                                    type: base.type,
                                    activeCount: base.activeCount,
                                    measurementType: 'Consumption Total',
                                    state: base.state,
                                    phaseMode: base.phaseMode,
                                    phaseCount: base.phaseCount,
                                    meteringStatus: base.meteringStatus,
                                    statusFlags: base.statusFlags,
                                    voltageDivide: base.voltageDivide,
                                };
                                this.pv.meters = [...this.pv.meters, { ...obj1, ...obj }];
                                this.feature.meters.consumption.total.enabled = true;
                            }
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
                this.emit('warn', `Meters reports not supported, dont worry all working correct, only some additional data will not be present, error: ${error}`);
                return null;
            }
            throw new Error(`Update meters reports error: ${error}`);
        }
    }

    async updateMetersData() {
        if (this.enableDebugMode) this.emit('debug', 'Requesting meters data');

        try {
            const meters = this.pv.meters ?? [];

            // Process meters in parallel for async calls
            const updatedMeters = await Promise.all(meters.map(async (meter, index) => {
                if (!meter) return null;

                // Await device status
                const type = ApiCodes[meter.type] ?? meter.type;
                const deviceStatus = await this.getStatus(meter.statusFlags);

                const meterData = {
                    type,
                    eid: meter.eid,
                    activeCount: meter.activeCount,
                    measurementType: meter.measurementType,
                    state: meter.state,
                    phaseMode: meter.phaseMode,
                    phaseCount: meter.phaseCount,
                    meteringStatus: meter.meteringStatus,
                    deviceStatus,
                    voltageDivide: meter.voltageDivide,
                };

                // If meter has active state, extend with measurements
                if (meterData.state) {
                    Object.assign(meterData, {
                        power: meter.power,
                        powerKw: meter.power / 1000,
                        energyLifetime: meter.energyLifetime,
                        energyLifetimeKw: meter.energyLifetime / 1000,
                        current: meter.current,
                        voltage: meter.voltage / meterData.voltageDivide,
                    });
                }

                return meterData;
            }));

            // Filter out any nulls from skipped meters and update inventory
            this.pv.meters = updatedMeters.filter(Boolean);

            // Mark feature supported
            this.feature.metersData.supported = true;

            return true;
        } catch (error) {
            throw new Error(`Update meters data error: ${error.message || error}`);
        }
    }

    async updateProduction() {
        if (this.enableDebugMode) this.emit('debug', `Requesting production`);

        try {
            const response = await this.axiosInstance(ApiUrls.Production);
            const production = response.data;
            if (this.enableDebugMode) this.emit('debug', `Production:`, production);

            const productionSupported = Object.keys(production).length > 0;

            if (productionSupported) {
                const obj = {
                    type: 'pcu',
                    activeCount: 0,
                    measurementType: 'Production',
                    power: production.wattsNow,
                    energyToday: production.wattHoursToday,
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
        if (this.enableDebugMode) this.emit('debug', `Requesting production pdm`);

        try {
            const response = await this.axiosInstance(ApiUrls.ProductionPdm);
            const data = response.data;
            if (this.enableDebugMode) this.emit('debug', `Production pdm:`, data);

            // PCU
            const pcu = {
                type: 'pcu',
                measurementType: 'Production',
                activeCount: 0,
                power: data.watts_now_pcu,
                energyToday: data.joules_today_pcu / 3600,
                energyLifetime: data.joules_lifetime_pcu / 3600
            };
            this.pv.powerAndEnergy.production.pcu = pcu;
            this.feature.productionPdm.pcu.installed = pcu.power > 0;

            // EIM
            const eimActive = !!data.there_is_an_active_eim;
            const eim = {
                type: 'eim',
                measurementType: 'Production',
                activeCount: 1,
                active: eimActive,
                power: data.watts_now_eim,
                energyToday: data.watt_hours_today_eim?.aggregate,
                energyLifetime: data.watt_hours_lifetime_eim?.aggregate
            };
            this.pv.powerAndEnergy.production.eim = eim;
            this.feature.productionPdm.eim.installed = eimActive;

            // RGM
            const rgmActive = !!data.there_is_an_active_rgm;
            const rgm = {
                type: 'rgm',
                measurementType: 'Production',
                activeCount: 1,
                active: rgmActive,
                power: data.watts_now_rgm,
                energyToday: data.watt_hours_today_rgm,
                energyLifetime: data.watt_hours_lifetime_rgm
            };
            this.pv.powerAndEnergy.production.rgm = rgm;
            this.feature.productionPdm.rgm.installed = rgmActive;

            // PMU
            const pmuActive = !!data.there_is_an_active_pmu;
            const pmu = {
                type: 'pmu',
                measurementType: 'Production',
                activeCount: 1,
                active: pmuActive,
                power: data.watts_now_pmu,
                energyToday: data.watt_hours_today_pmu,
                energyLifetime: data.watt_hours_lifetime_pmu
            };
            this.pv.powerAndEnergy.production.pmu = pmu;
            this.feature.productionPdm.pmu.installed = pmuActive;

            // Mark as supported
            this.feature.productionPdm.supported = true;

            return true;
        } catch (error) {
            throw new Error(`Update production pdm error: ${error}`);
        }
    }

    async updateEnergyPdm() {
        if (this.enableDebugMode) this.emit('debug', `Requesting energy pdm`);

        try {
            const response = await this.axiosInstance(ApiUrls.EnergyPdm);
            const energyPdm = response.data;
            if (this.enableDebugMode) this.emit('debug', `Energy pdm: `, energyPdm);

            // Process production data
            if ('production' in energyPdm && energyPdm.production) {
                for (const [type, data] of Object.entries(energyPdm.production)) {
                    if (data) {
                        const obj = {
                            type,
                            activeCount: 1,
                            measurementType: 'Production',
                            power: data.wattsNow,
                            energyToday: data.wattHoursToday,
                            energyLifetime: data.wattHoursLifetime
                        };
                        this.pv.powerAndEnergy.production[type] = obj;
                        this.feature.energyPdm.production[type].installed = true;
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
                    power: data.wattsNow,
                    energyToday: data.wattHoursToday,
                    energyLifetime: data.wattHoursLifetime
                };
                this.pv.powerAndEnergy.consumption.eim.net = obj;
                this.feature.energyPdm.consumption.eim.net.installed = true;
                this.feature.energyPdm.consumption.supported = true;
            }

            this.feature.energyPdm.supported = true;

            return true;
        } catch (error) {
            throw new Error(`Update energy pdm error: ${error}`);
        }
    }

    async updateProductionCt() {
        if (this.enableDebugMode) this.emit('debug', `Requesting production ct`);

        try {
            const response = await this.axiosInstance(ApiUrls.SystemReadingStats);
            const data = response.data;
            if (this.enableDebugMode) this.emit('debug', `Production ct:`, data);

            const keys = Object.keys(data);

            // --- Production: PCU ---
            if (keys.includes('production') && Array.isArray(data.production)) {
                const productionPcu = data.production[0];
                if (productionPcu) {
                    this.feature.productionCt.production.pcu.supported = true;
                }

                const productionEim = data.production[1];
                if (productionEim) {
                    const obj = {
                        type: 'eim',
                        activeCount: 1,
                        measurementType: ApiCodes[productionEim.measurementType],
                        readingTime: productionEim.readingTime,
                        power: productionEim.wNow,
                        energyToday: productionEim.whToday,
                        energyLifetime: productionEim.whLifetime,
                        current: productionEim.rmsCurrent,
                        voltage: productionEim.rmsVoltage,
                    };
                    this.pv.powerAndEnergy.production.eim = obj;
                    this.feature.productionCt.production.eim.supported = true;
                }
            }

            // --- Consumption: EIM ---
            if (keys.includes('consumption') && Array.isArray(data.consumption) && this.feature.meters.consumption.net.enabled) {
                for (const item of data.consumption) {
                    const type = ApiCodes[item.measurementType];
                    const key = MetersKeyMap[type];
                    const obj = {
                        type: 'eim',
                        measurementType: type,
                        activeCount: 1,
                        readingTime: item.readingTime,
                        power: item.wNow,
                        energyToday: item.whToday,
                        energyLifetime: item.whLifetime,
                        current: item.rmsCurrent,
                        voltage: item.rmsVoltage,
                    };
                    this.pv.powerAndEnergy.consumption.eim[key] = obj;
                    this.feature.productionCt.consumption.eim[key].supported = true;
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
        if (this.enableDebugMode) this.emit('debug', `Requesting power and energy data`);

        try {
            const dataArr = [
                { type: 'production', state: this.feature.meters.production.enabled },
                { type: 'consumptionNet', state: this.feature.meters.consumption.net.enabled },
                { type: 'consumptionTotal', state: this.feature.meters.consumption.total.enabled }
            ];

            for (const [index, data] of dataArr.entries()) {
                const { type: key, state: meterEnabled } = data;

                if (key !== 'production' && !meterEnabled) continue;

                let sourceMeter, sourceEnergy;
                let power = 0;
                let energyToday = 0, energyLifetime = 0, energyLifetimeWithOffset = 0;

                const powerAndEnergyData = this.pv.powerAndEnergy.sources[index] || [];

                switch (key) {
                    case 'production': {
                        const sourcePcu = this.pv.powerAndEnergy.production.pcu;
                        const sourceEim = this.pv.powerAndEnergy.production.eim;
                        sourceMeter = meterEnabled ? this.pv.meters.find(m => m.measurementType === 'Production') : sourcePcu;
                        sourceEnergy = meterEnabled ? sourceEim : sourcePcu;
                        power = Number.isFinite(sourceMeter?.power) ? sourceMeter.power : powerAndEnergyData.power;
                        energyToday = Number.isFinite(sourceEnergy?.energyToday) ? sourceEnergy.energyToday : powerAndEnergyData.energyToday;
                        energyLifetime = Number.isFinite(sourceMeter?.energyLifetime) ? sourceMeter.energyLifetime : powerAndEnergyData.energyLifetime;
                        energyLifetimeWithOffset = Math.max(0, energyLifetime) + this.energyProductionLifetimeOffset;
                        break;
                    }
                    case 'consumptionNet': {
                        sourceMeter = this.pv.meters.find(m => m.measurementType === 'Consumption Net');
                        sourceEnergy = this.pv.powerAndEnergy.consumption.eim.net;
                        power = Number.isFinite(sourceMeter?.power) ? sourceMeter.power : powerAndEnergyData.power;
                        energyToday = Number.isFinite(sourceEnergy?.energyToday) ? sourceEnergy.energyToday : powerAndEnergyData.energyToday;
                        energyLifetime = Number.isFinite(sourceMeter?.energyLifetime) ? sourceMeter.energyLifetime : powerAndEnergyData.energyLifetime;
                        energyLifetimeWithOffset = Math.max(0, energyLifetime) + this.energyConsumptionNetLifetimeOffset;
                        break;
                    }
                    case 'consumptionTotal': {
                        sourceMeter = this.pv.meters.find(m => m.measurementType === 'Consumption Total');
                        sourceEnergy = this.pv.powerAndEnergy.consumption.eim.total;
                        power = Number.isFinite(sourceMeter?.power) ? sourceMeter.power : powerAndEnergyData.power;
                        energyToday = Number.isFinite(sourceEnergy?.energyToday) ? sourceEnergy.energyToday : powerAndEnergyData.energyToday;
                        energyLifetime = Number.isFinite(sourceMeter?.energyLifetime) ? sourceMeter.energyLifetime : powerAndEnergyData.energyLifetime;
                        energyLifetimeWithOffset = Math.max(0, energyLifetime) + this.energyConsumptionTotalLifetimeOffset;
                        break;
                    }
                }

                if (!sourceMeter) continue;
                const type = ApiCodes[sourceMeter.type] ?? sourceMeter.type;

                const obj = {
                    type,
                    measurementType: sourceMeter?.measurementType,
                    power,
                    energyTodayKw: energyToday / 1000,
                    energyLifetimeKw: energyLifetimeWithOffset / 1000,
                    gridQualityState: meterEnabled,
                };

                if (meterEnabled) {
                    Object.assign(obj, {
                        current: sourceMeter?.current,
                        voltage: sourceMeter?.voltage
                    });
                }

                if (this.enableDebugMode) {
                    this.emit('debug', `${obj.measurementType} data source meter:`, sourceMeter);
                    this.emit('debug', `${obj.measurementType} data source energy:`, sourceEnergy);
                }

                //energy meter
                this.energyMeterServices?.[index]
                    ?.updateCharacteristic(Characteristic.EveCurrentConsumption, obj.power)
                    .updateCharacteristic(Characteristic.EveTotalConsumption, obj.energyLifetimeKw);

                // FakeGato history per energy meter service
                if (this.fakeGatoHistoryService && key === 'production') {
                    this.fakeGatoHistoryService.addEntry({
                        time: Math.floor(Date.now() / 1000),
                        power: obj.power,
                        energy: obj.energyLifetimeKw
                    });
                }

                if (meterEnabled) {
                    const metricsValid = [obj.current, obj.voltage]
                        .every(v => typeof v === 'number' && isFinite(v));

                    if (metricsValid) {
                        this.energyMeterServices?.[index]
                            ?.updateCharacteristic(Characteristic.EveElectricCurrent, obj.current)
                            .updateCharacteristic(Characteristic.EveVoltage, obj.voltage);
                    }
                }
                this.pv.powerAndEnergy.sources[index] = obj;

            }
            this.feature.powerAndEnergyData.supported = true;

            return true;
        } catch (error) {
            throw new Error(`Update power and energy data error: ${error.message || error}`);
        }
    }

    async getDeviceInfo() {
        if (this.enableDebugMode) {
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
            if (this.enableDebugMode) this.emit('debug', `Prepare accessory`);

            const envoySerialNumber = this.pv.info.serialNumber;
            const accessoryName = this.name;
            const accessoryUUID = AccessoryUUID.generate(envoySerialNumber + 'Energy Meter');
            const accessoryCategory = Categories.SENSOR;
            const accessory = new Accessory(accessoryName, accessoryUUID, accessoryCategory);

            // Accessory Info Service
            if (this.enableDebugMode) this.emit('debug', `Prepare Information Service`);
            accessory.getService(Service.AccessoryInformation)
                .setCharacteristic(Characteristic.Manufacturer, 'Enphase')
                .setCharacteristic(Characteristic.Model, this.pv.info.modelName ?? 'Model Name')
                .setCharacteristic(Characteristic.SerialNumber, envoySerialNumber ?? 'Serial Number')
                .setCharacteristic(Characteristic.FirmwareRevision, this.pv.info.software?.replace(/[a-zA-Z]/g, '') ?? '0');

            // Create FakeGatoHistory
            this.fakeGatoHistoryService = new this.FakeGatoHistoryService('energy', accessory, {
                storage: 'fs',
                disableRepeatLastData: true,
                disableTimer: false
            });

            // Energy Meter Service
            this.energyMeterServices = [];
            this.fakeGatoHistoryServices = [];
            const powerAndEnergyDataSource = this.pv.powerAndEnergy.sources;

            for (const powerAndEnergyData of powerAndEnergyDataSource) {
                const powerAndEnergy = powerAndEnergyData;
                const measurementType = powerAndEnergy.measurementType;
                const key = MetersKeyMap[measurementType];

                if (this.enableDebugMode) this.emit('debug', `Prepare Meter ${measurementType} Service`);

                const serviceName = `Energy Meter ${measurementType}`;
                const energyMeterService = accessory.addService(Service.EvePowerMeter, serviceName, `energyMeterService${measurementType}`);
                energyMeterService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                energyMeterService.getCharacteristic(Characteristic.EveCurrentConsumption)
                    .onGet(async () => {
                        const value = powerAndEnergy.power;
                        if (!this.disableLogInfo) this.emit('info', `Energy Meter: ${measurementType}, power: ${value} W`);
                        return value;
                    });

                energyMeterService.getCharacteristic(Characteristic.EveTotalConsumption)
                    .onGet(async () => {
                        const value = powerAndEnergy.energyLifetimeKw;
                        if (!this.disableLogInfo) this.emit('info', `Energy Meter: ${measurementType}, energy lifetime: ${value} kWh`);
                        return value;
                    });
                if (powerAndEnergy.gridQualityState) {
                    energyMeterService.getCharacteristic(Characteristic.EveElectricCurrent)
                        .onGet(async () => {
                            const value = powerAndEnergy.current;
                            if (!this.disableLogInfo) this.emit('info', `Energy Meter: ${measurementType}, current: ${value} A`);
                            return value;
                        });

                    energyMeterService.getCharacteristic(Characteristic.EveVoltage)
                        .onGet(async () => {
                            const value = powerAndEnergy.voltage;
                            if (!this.disableLogInfo) this.emit('info', `Energy Meter: ${measurementType}, voltage: ${value} V`);
                            return value;
                        });
                }

                if (key === 'production') {
                    this.fakeGatoHistoryService.addEntry({
                        time: Math.floor(Date.now() / 1000),
                        power: powerAndEnergy.power,
                        energy: powerAndEnergy.energyLifetimeKw
                    });
                }

                this.energyMeterServices.push(energyMeterService);
            }


            return accessory;
        } catch (error) {
            throw new Error(`Prepare accessory error: ${error}`);
        }
    }

    //start
    async start() {
        if (this.enableDebugMode) this.emit('debug', `Start`);

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
            const getMetersReading = getMeters && this.feature.meters.installed ? await this.updateMetersReading(true) : false;
            const getMetersReports = getMeters && this.feature.meters.installed ? await this.updateMetersReports(true) : false;

            // Production
            const getProduction = this.feature.info.firmware < 824 ? await this.updateProduction() : false;
            const getProductionPdm = this.feature.info.firmware >= 824 ? await this.updateProductionPdm() : false;
            const getEnergyPdm = this.feature.info.firmware >= 824 ? await this.updateEnergyPdm() : false;
            const getProductionCt = this.feature.meters.installed ? await this.updateProductionCt() : false;

            // Data
            const getMetersData = getMeters ? await this.updateMetersData() : false;
            const getPowerAndEnergyData = await this.updatePowerAndEnergyData();

            // Success message
            this.emit('success', `Connect Success`);

            // Optional logging
            if (!this.disableLogDeviceInfo) await this.getDeviceInfo();

            // Prepare HomeKit accessory
            if (this.startPrepareAccessory) {
                const accessory = await this.prepareAccessory();
                this.emit('publishAccessory', accessory);
                this.startPrepareAccessory = false;
            }

            // Setup timers
            this.timers = [];
            if (getPowerAndEnergyData) this.timers.push({ name: 'updatePowerandEnergy', sampling: 10000 });

            return true;
        } catch (error) {
            throw new Error(`Start error: ${error}`);
        }
    }

}
export default EnergyMeter;
