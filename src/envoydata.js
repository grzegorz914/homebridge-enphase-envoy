import axios from 'axios';
import { Agent } from 'https';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';
import EventEmitter from 'events';
import EnvoyToken from './envoytoken.js';
import DigestAuth from './digestauth.js';
import PasswdCalc from './passwdcalc.js';
import ImpulseGenerator from './impulsegenerator.js';
import Functions from './functions.js';
import { ApiUrls, PartNumbers, Authorization, ApiCodes, MetersKeyMap } from './constants.js';

class EnvoyData extends EventEmitter {
    constructor(host, envoyFirmware7xxTokenGenerationMode, envoyPasswd, envoyToken, envoyTokenInstaller, enlightenUser, enlightenPasswd, envoyIdFile, envoyTokenFile, device) {
        super();

        //device configuration
        this.host = host;
        this.envoyFirmware7xxTokenGenerationMode = envoyFirmware7xxTokenGenerationMode;
        this.envoyPasswd = envoyPasswd;
        this.enlightenUser = enlightenUser;
        this.enlightenPasswd = enlightenPasswd;
        this.envoyToken = envoyToken;
        this.envoyTokenInstaller = envoyTokenInstaller;
        this.envoyIdFile = envoyIdFile;
        this.envoyTokenFile = envoyTokenFile;

        //data refresh
        this.productionDataRefreshTime = (device.productionDataRefreshTime || 10) * 1000;
        this.liveDataRefreshTime = (device.liveDataRefreshTime || 5) * 1000;
        this.ensembleDataRefreshTime = (device.ensembleDataRefreshTime || 15) * 1000;

        //log
        this.logDeviceInfo = device.log?.deviceInfo || true;
        this.logInfo = device.log?.info || false;
        this.logWarn = device.log?.warn || true;
        this.logError = device.log?.error || true;
        this.logDebug = device.log?.debug || false;

        //setup variables
        this.functions = new Functions();
        this.checkTokenRunning = false;

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
            backboneApp: {
                supported: false
            },
            productionState: {
                supported: false
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
                    count: 0,
                    status: {
                        supported: false
                    },
                    detailedData: {
                        supported: false
                    },
                },
                nsrbs: {
                    supported: false,
                    installed: false,
                    count: 0,
                    detailedData: {
                        supported: false
                    },
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
            detailedDevicesData: {
                supported: false,
                installed: false,
            },
            liveData: {
                supported: false
            },
            gridProfile: {
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
                production: {
                    pcu: {},
                    eim: {},
                    rgm: {},
                    pmu: {},
                },
                consumptionNet: {},
                consumptionTotal: {},
            },
            liveData: {}
        };

        //lock flags
        this.locks = {
            updateHome: false,
            updateInventory: false,
            updateDevices: false,
            updatePowerAndEnergy: false,
            updateEnsemble: false,
            updateLiveData: false,
            updateGridPlcAndProductionState: false
        };

        //impulse generator
        this.impulseGenerator = new ImpulseGenerator()
            .on('updateHome', () => this.handleWithLock('updateHome', async () => {
                await this.updateHome();
                this.emit('updateHomeData', this.pv.home);
            }))
            .on('updateInventory', () => this.handleWithLock('updateInventory', async () => {
                await this.updateInventory();
            }))
            .on('updateDevices', () => this.handleWithLock('updateDevices', async () => {
                if (this.feature.inventory.pcus.status.supported && !this.feature.inventory.pcus.detailedData.supported) await this.updatePcuStatus();
                if (this.feature.detailedDevicesData.supported) await this.updateDetailedDevices(false);
                if (this.feature.inventory.pcus.installed) this.emit('updatePcusData', this.pv.inventory.pcus);
                if (this.feature.inventory.nsrbs.installed) this.emit('updateNsrbsData', this.pv.inventory.nsrbs);
                if (this.feature.inventory.acbs.installed) this.emit('updateAcbsData', this.pv.inventory.acbs);
            }))
            .on('updatePowerAndEnergy', () => this.handleWithLock('updatePowerAndEnergy', async () => {
                if (this.feature.meters.supported) {
                    await this.updateMeters();
                    if (this.feature.meters.installed && this.feature.metersReading.installed && !this.feature.metersReports.installed) await this.updateMetersReading(false);
                    if (this.feature.meters.installed && this.feature.metersReports.installed) await this.updateMetersReports(false);
                    this.emit('updateMetersData', this.pv.meters);
                }

                if (this.feature.production.supported) await this.updateProduction();
                if (this.feature.productionPdm.supported && !this.feature.energyPdm.supported) await this.updateProductionPdm();
                if (this.feature.energyPdm.supported) await this.updateEnergyPdm();
                if (this.feature.productionCt.supported) await this.updateProductionCt();
                this.emit('updatePowerAndEnergyData', this.pv.powerAndEnergy, this.pv.meters);
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

                //Update feature and pv
                this.emit('updateEnsembleData', this.pv.inventory.esubs);
            }))
            .on('updateLiveData', () => this.handleWithLock('updateLiveData', async () => {
                await this.updateLiveData();
                this.emit('updateLiveData', this.pv.liveData);
            }))
            .on('updateGridPlcAndProductionState', () => this.handleWithLock('updateGridPlcAndProductionState', async () => {
                if (this.feature.gridProfile.supported) await this.updateGridProfile(false);
                if (this.feature.plcLevel.supported) await this.updatePlcLevel(false);
                if (this.feature.productionState.supported) await this.updateProductionState(false);
            }))
            .on('state', (state) => {
                this.emit(state ? 'success' : 'warn', `Impulse generator ${state ? 'started' : 'stopped'}`);

                this.emit('updateDataSampling', state);
                this.emit('restFul', 'dataSampling', state);
                this.emit('mqtt', 'Data Sampling', state);
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

            // RESTFul + MQTT update
            this.emit('restFul', 'info', parsed);
            this.emit('mqtt', 'Info', parsed);

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

            // RESTFul and MQTT sync
            this.emit('restFul', 'token', jwt);
            this.emit('mqtt', 'Token', jwt);

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

    async digestAuthorizationEnvoy() {
        if (this.logDebug) this.emit('debug', 'Requesting digest authorization envoy');

        try {
            const deviceSn = this.pv.info.serialNumber;
            const envoyPasswd = this.envoyPasswd || deviceSn.substring(6);

            const isValidPassword = envoyPasswd.length === 6;
            if (this.logDebug) this.emit('debug', 'Digest authorization envoy password:', isValidPassword ? 'Valid' : 'Not valid');

            if (!isValidPassword) {
                if (this.logWarn) this.emit('warn', `Digest authorization envoy password is not correct, don't worry all working correct, only the power and power max of PCU will not be displayed`);
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
                const response = await this.functions.readData(this.envoyIdFile);
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
                await this.functions.saveData(this.envoyIdFile, envoyDevId);
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
                this.feature.productionState.supported = true;

                // Update data
                this.emit('updateProductionState', state);
            }

            // RESTFul and MQTT update
            this.emit('restFul', 'productionstate', productionState);
            this.emit('mqtt', 'Production State', productionState);

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
            this.emit('restFul', 'home', home);
            this.emit('mqtt', 'Home', home);

            return true;
        } catch (error) {
            throw new Error(`Update home error: ${error.message || error}`);
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
            this.emit('restFul', 'inventory', inventory);
            this.emit('mqtt', 'Inventory', inventory);

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
                if (!device) return;

                const obj = {
                    type: 'pcu',
                    readingTime: device.lastReportDate,
                    power: device.lastReportWatts,
                    powerPeak: device.maxReportWatts,
                };

                Object.assign(pcu, obj);
            });
            this.feature.inventory.pcus.status.supported = true;

            // RESTFul and MQTT update
            this.emit('restFul', 'microinvertersstatus', pcus)
            this.emit('mqtt', 'Microinverters Status', pcus);

            return true;
        } catch (error) {
            throw new Error(`Update pcu status error: ${error}`);
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
                    const key = MetersKeyMap[meter.measurementType];
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

            // RESTFul and MQTT update
            this.emit('restFul', 'meters', responseData);
            this.emit('mqtt', 'Meters', responseData);

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

            // RESTFul and MQTT update
            this.emit('restFul', 'metersreading', responseData);
            this.emit('mqtt', 'Meters Reading', responseData);

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
                    const key = MetersKeyMap[meter.reportType];
                    if (!key) {
                        if (!this.logDebug) this.emit('debug', `Unknown meters reports type: ${meter.reportType}`);
                        continue;
                    }

                    const meterConfig = meter.reportType === 'total-consumption' ? this.pv.meters.find(m => m.measurementType === 'net-consumption' && m.state === true) : this.pv.meters.find(m => m.measurementType === meter.reportType && m.state === true);
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

            // RESTFul and MQTT update
            this.emit('restFul', 'metersreports', responseData);
            this.emit('mqtt', 'Meters Reports', responseData);

            return true;
        } catch (error) {
            if (start) {
                if (this.logWarn) this.emit('warn', `Meters reports not supported, dont worry all working correct, only some additional data will not be present, error: ${error}`);
                return null;
            }
            throw new Error(`Update meters reports error: ${error}`);
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
                        if (!device) return;

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
                        this.feature.inventory.pcus.detailedData.supported = true;
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
                        this.feature.meters.detailedData.supported = true;
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
                        this.feature.inventory.nsrbs.detailedData.supported = true;
                    });
                }

                // detailed devices data installed
                this.feature.detailedDevicesData.installed = this.feature.inventory.pcus.detailedData.supported || this.feature.meters.detailedData.supported || this.feature.inventory.nsrbs.detailedData.supported;
            }

            // detailed devices data supported
            this.feature.detailedDevicesData.supported = true;

            // RESTFul and MQTT update
            this.emit('restFul', 'detaileddevicesdata', devicesData);
            this.emit('mqtt', 'Detailed Devices Data', devicesData);

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
                const readingTime = this.functions.formatTimestamp(undefined, this.pv.home.timezone);
                const obj = {
                    type: 'pcu',
                    activeCount: this.feature.inventory.pcus.count,
                    measurementType: 'production',
                    readingTime,
                    power: production.wattsNow,
                    energyToday: production.wattHoursToday,
                    energyLastSevenDays: production.wattHoursSevenDays,
                    energyLifetime: production.wattHoursLifetime
                };

                this.pv.powerAndEnergy.production.pcu = obj;
                this.feature.production.supported = true;
            }

            this.emit('restFul', 'production', production);
            this.emit('mqtt', 'Production', production);

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

            const readingTime = this.functions.formatTimestamp(undefined, this.pv.home.timezone);

            // PCU
            const pcu = {
                type: 'pcu',
                measurementType: 'production',
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
                measurementType: 'production',
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
                measurementType: 'production',
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
                measurementType: 'production',
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
            this.emit('restFul', 'productionpdm', data);
            this.emit('mqtt', 'Production Pdm', data);

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

            const readingTime = this.functions.formatTimestamp(undefined, this.pv.home.timezone);

            // Process production data
            if ('production' in energyPdm && energyPdm.production) {
                for (const [type, data] of Object.entries(energyPdm.production)) {
                    if (data) {
                        const obj = {
                            type,
                            activeCount: 1,
                            measurementType: 'production',
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
                    measurementType: 'net-consumption',
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

            this.emit('restFul', 'energypdm', energyPdm);
            this.emit('mqtt', 'Energy Pdm', energyPdm);

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
                        measurementType: productionEim.measurementType,
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
                    const key = MetersKeyMap[item.measurementType];
                    const energyToday = (item.lines[0]?.whToday || 0) + (item.lines[1]?.whToday || 0) + (item.lines[2]?.whToday || 0);
                    const energyLastSevenDays = (item.lines[0]?.whLastSevenDays || 0) + (item.lines[1]?.whLastSevenDays || 0) + (item.lines[2]?.whLastSevenDays || 0);
                    const energyLifetime = (item.lines[0]?.whLifetime || 0) + (item.lines[1]?.whLifetime || 0) + (item.lines[2]?.whLifetime || 0);
                    const obj = {
                        type: 'eim',
                        measurementType: item.measurementType,
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
                        measurementType: 'storage',
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

            this.emit('restFul', 'productionct', data);
            this.emit('mqtt', 'Production CT', data);

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
            this.emit('restFul', 'ensembleinventory', ensembleInventory);
            this.emit('mqtt', 'Ensemble Inventory', ensembleInventory);

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

                const enchargesRatedPowerSummary = [];
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

                    if (this.functions.isValidValue(encharge.status.ratedPower)) enchargesRatedPowerSummary.push(encharge.status.ratedPower);
                    this.feature.inventory.esubs.encharges.status.supported = true;
                };

                // Calculate encharges rated power summary in kW
                this.pv.inventory.esubs.encharges.ratedPowerSumKw = enchargesRatedPowerSummary.length > 0 ? (enchargesRatedPowerSummary.reduce((total, num) => total + num, 0) / enchargesRatedPowerSummary.length) / 1000 : null;
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
            this.emit('restFul', 'ensemblestatus', ensembleStatus);
            this.emit('mqtt', 'Ensemble Status', ensembleStatus);

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
            const enchargesRealPowerSummary = [];
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

                if (this.functions.isValidValue(encharge.power.realPower)) enchargesRealPowerSummary.push(encharge.power.realPower);
                this.feature.inventory.esubs.encharges.power.supported = true;
            }

            // Calculate encharges real power summary in kW
            this.pv.inventory.esubs.encharges.realPowerSumKw = enchargesRealPowerSummary.length > 0 ? (enchargesRealPowerSummary.reduce((total, num) => total + num, 0) / enchargesRealPowerSummary.length) / 1000 : null;

            // ensemble power supported
            this.feature.ensemble.power.supported = true;

            // RESTFul and MQTT update
            this.emit('restFul', 'ensemblepower', devices);
            this.emit('mqtt', 'Ensemble Power', devices);

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
            this.emit('restFul', 'enchargesettings', enchargesSettings);
            this.emit('mqtt', 'Encharge Settings', enchargesSettings);

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

            this.emit('restFul', 'tariff', tariffSettings);
            this.emit('mqtt', 'Tariff', tariffSettings);

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
            this.emit('restFul', 'drycontacts', ensembleDryContacts);
            this.emit('mqtt', 'Dry Contacts', ensembleDryContacts);

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
            this.emit('restFul', 'drycontactssettings', ensembleDryContactsSettings);
            this.emit('mqtt', 'Dry Contacts Settings', ensembleDryContactsSettings);

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
            this.emit('restFul', 'generator', generator);
            this.emit('mqtt', 'Generator', generator);

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
            this.emit('restFul', 'generatorsettings', generatorSettings);
            this.emit('mqtt', 'Generator Settings', generatorSettings);

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
            if (!profile.name) return;

            //parse and prepare grid profile
            const gridProfile = {
                name: profile.name.substring(0, 64),
                id: profile.id,
                version: profile.version ?? '',
                itemCount: profile.item_count
            };

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
            this.emit('restFul', 'gridprofile', profile);
            this.emit('mqtt', 'Grid Profile', profile);

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
                        device.plcLevel = this.functions.scaleValue(raw, 0, 5, 0, 100);
                    }
                }

                flag.supported = true;
            }

            // comm level supported
            this.feature.plcLevel.supported = true;

            //Update feature and pv
            this.emit('updatePlcLevelCheck', false);

            // RESTFul and MQTT update
            this.emit('restFul', 'plclevel', plcLevel);
            this.emit('mqtt', 'PLC Level', plcLevel);

            return true;
        } catch (error) {
            if (start) {
                if (this.logWarn) this.emit('warn', `Plc level not supported, dont worry all working correct, only the plc level and control will not be displayed, error: ${error}`);
                return null;
            }
            throw new Error(`Update plc level: ${error}`);
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

            // Extract connection status — aka the heartbeat of the system
            const liveData = {};
            liveData.connection = {
                mqttState: live.connection.mqtt_state,
                provState: live.connection.prov_state,
                authState: live.connection.auth_state,
                scStream: live.connection.sc_stream === 'enabled',
                scDebug: live.connection.sc_debug === 'enabled',
            };

            // Meters info — where the power lives
            liveData.meters = {
                lastUpdate: this.functions.formatTimestamp(live.meters.last_update, this.pv.home.timezone),
                soc: live.meters.soc,
                mainRelayState: live.meters.main_relay_state,
                genRelayState: live.meters.gen_relay_state,
                backupBatMode: live.meters.backup_bat_mode,
                backupSoc: live.meters.backup_soc,
                isSplitPhase: live.meters.is_split_phase,
                phaseCount: live.meters.phase_count,
                encAggSoc: live.meters.enc_agg_soc,
                encAggEnergy: live.meters.enc_agg_energy,
                encAggEnergyKw: live.meters.enc_agg_energy != null ? live.meters.enc_agg_energy / 1000 : null,
                acbAggSoc: live.meters.acb_agg_soc,
                acbAggEnergy: live.meters.acb_agg_energ,
                acbAggEnergyKw: live.meters.acb_agg_energ != null ? live.meters.acb_agg_energ / 1000 : null,
                phaseA: this.pv.inventory.esubs.encharges.phaseA,
                phaseB: this.pv.inventory.esubs.encharges.phaseB,
                phaseC: this.pv.inventory.esubs.encharges.phaseC,
                pv: live.meters.pv,
                storage: live.meters.storage,
                grid: live.meters.grid,
                load: live.meters.load,
                generator: live.meters.generator,
            };

            liveData.tasks = live.tasks ?? {};
            liveData.counters = live.counters ?? {};
            liveData.dryContacts = live.dry_contacts ?? {};

            // Enable steram if disabled
            const streamDisabled = !liveData.connection.scStream
            if (streamDisabled && this.feature.info.jwtToken.installer) {
                if (this.logDebug) this.emit('debug', 'Enabling live data stream...');

                try {
                    await this.setLiveDataStream();
                } catch (error) {
                    if (this.logError) this.emit('error', error);
                }
            }

            this.pv.liveData = liveData;
            this.feature.liveData.supported = true;

            // RESTFul and MQTT update
            this.emit('restFul', 'livedata', liveData);
            this.emit('mqtt', 'Live Data', liveData);

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
            const response = await this.axiosInstance.post(ApiUrls.LiveDataStream, { 'enable': 1 });
            if (this.logDebug) this.emit('debug', `Live data stream enable:`, response.data);

            return true;
        } catch (error) {
            throw new Error(`Set live data stream error: ${error}`);
        }
    }

    //start
    async connect() {
        if (this.logDebug) this.emit('debug', `Connect`);

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
            if (!getHome) return null;

            // Inventory
            const getInventory = await this.updateInventory();
            if (!getInventory) return null;

            // PCU Status
            if (tokenRequired || digestAuthorizationEnvoy) await this.updatePcuStatus();

            // Meters
            const getMeters = getHome && this.feature.meters.supported ? await this.updateMeters() : false;
            if (getMeters && this.feature.meters.installed) await this.updateMetersReading(true);
            if (getMeters && this.feature.meters.installed) await this.updateMetersReports(true);

            // Detailed devices
            if (getInventory || this.feature.meters.installed) await this.updateDetailedDevices(true);

            // Production
            if (this.feature.info.firmware < 824) await this.updateProduction();
            if (this.feature.info.firmware >= 824) await this.updateProductionPdm();
            if (this.feature.info.firmware >= 824) await this.updateEnergyPdm();
            if (this.feature.inventory.acbs.installed || this.feature.meters.installed) await this.updateProductionCt();

            // Ensemble (Web token required)
            const getEnsemble = tokenRequired && this.feature.inventory.esubs.supported ? await this.updateEnsembleInventory() : false;
            if (getEnsemble) {
                await this.updateEnsembleStatus();
                if (this.feature.inventory.esubs.encharges.installed) await this.updateEnsemblePower();
                const getEnchargeSettings = this.feature.inventory.esubs.encharges.installed ? await this.updateEnchargesSettings() : false;
                if (getEnchargeSettings) await this.updateTariff();

                const getDryContacts = this.feature.inventory.esubs.enpowers.installed ? await this.updateDryContacts() : false;
                if (getDryContacts) await this.updateDryContactsSettings();

                const getGenerator = await this.updateGenerator();
                if (getGenerator && this.feature.inventory.esubs.generator.installed) await this.updateGeneratorSettings();
            }

            // Grid Profile Live Data and Ensemble Data Profile (Web token required)
            const getGridProfile = tokenRequired ? await this.updateGridProfile(true) : false;
            const getPlcLevel = allowInstallerAccess ? await this.updatePlcLevel(true) : false;
            const getLiveData = tokenRequired && (this.feature.meters.installed || getEnsemble) ? await this.updateLiveData() : false;

            // Update device info
            this.emit('deviceInfo', this.feature, this.pv.info, this.pv.home.timezone);

            // Update data
            await new Promise(resolve => setTimeout(resolve, 1500));
            this.emit('updateHomeData', this.pv.home);
            if (this.feature.inventory.pcus.installed) this.emit('updatePcusData', this.pv.inventory.pcus);
            if (this.feature.inventory.nsrbs.installed) this.emit('updateNsrbsData', this.pv.inventory.nsrbs);
            if (this.feature.inventory.acbs.installed) this.emit('updateAcbsData', this.pv.inventory.acbs);
            if (getMeters) this.emit('updateMetersData', this.pv.meters);
            this.emit('updatePowerAndEnergyData', this.pv.powerAndEnergy, this.pv.meters);
            if (getEnsemble) this.emit('updateEnsembleData', this.pv.inventory.esubs);
            if (getLiveData) this.emit('updateLiveData', this.pv.liveData);

            // Setup timers
            this.timers = [];
            this.timers.push({ name: 'updateHome', sampling: 300000 });
            if (getInventory) this.timers.push({ name: 'updateInventory', sampling: 120000 });
            if (getInventory) this.timers.push({ name: 'updateDevices', sampling: this.productionDataRefreshTime });
            this.timers.push({ name: 'updatePowerAndEnergy', sampling: this.productionDataRefreshTime });
            if (getEnsemble) this.timers.push({ name: 'updateEnsemble', sampling: this.ensembleDataRefreshTime });
            if (getLiveData) this.timers.push({ name: 'updateLiveData', sampling: this.liveDataRefreshTime });
            if (getGridProfile || getPlcLevel || getProductionState) this.timers.push({ name: 'updateGridPlcAndProductionState', sampling: 120000 });

            await new Promise(resolve => setTimeout(resolve, 2000));
            return true;
        } catch (error) {
            throw new Error(`Connect error: ${error}`);
        }
    }

}
export default EnvoyData;
