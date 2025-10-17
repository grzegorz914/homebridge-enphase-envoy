import EventEmitter from 'events';
import EnvoyData from './envoydata.js';
import RestFul from './restful.js';
import Mqtt from './mqtt.js';
import Functions from './functions.js';
import { PartNumbers, ApiCodes, MetersKeyMap, DeviceTypeMap, LedStatus } from './constants.js';
let Accessory, Characteristic, Service, Categories, AccessoryUUID;

class EnvoyDevice extends EventEmitter {
    constructor(api, log, url, deviceName, device, envoyIdFile, envoyTokenFile) {
        super();

        Accessory = api.platformAccessory;
        Characteristic = api.hap.Characteristic;
        Service = api.hap.Service;
        Categories = api.hap.Categories;
        AccessoryUUID = api.hap.uuid;

        //device configuration
        this.url = url;
        this.device = device;
        this.name = deviceName;
        this.host = device.host;
        this.displayType = device.displayType;

        this.lockControl = device.lockControl || false;
        this.lockControlPrefix = device.lockControlPrefix || false;
        this.lockControTime = (device.lockControlTime || 30) * 1000;
        this.productionStateSensor = device.productionStateSensor || {};
        this.plcLevelCheckControl = device.plcLevelControl || {};

        this.powerProductionSummary = device.powerProductionSummary || 1;
        this.powerProductionLevelSensors = (device.powerProductionLevelSensors || []).filter(sensor => (sensor.displayType ?? 0) > 0);

        this.energyProductionLevelSensors = (device.energyProductionLevelSensors || []).filter(sensor => (sensor.displayType ?? 0) > 0);
        this.energyProductionLifetimeOffset = device.energyProductionLifetimeOffset || 0;

        this.powerConsumptionTotalLevelSensors = (device.powerConsumptionTotalLevelSensors || []).filter(sensor => (sensor.displayType ?? 0) > 0);
        this.energyConsumptionTotalLevelSensors = (device.energyConsumptionTotalLevelSensors || []).filter(sensor => (sensor.displayType ?? 0) > 0);
        this.energyConsumptionTotalLifetimeOffset = device.energyConsumptionTotalLifetimeOffset || 0;

        this.powerConsumptionNetLevelSensors = (device.powerConsumptionNetLevelSensors || []).filter(sensor => (sensor.displayType ?? 0) > 0);
        this.energyConsumptionNetLevelSensors = (device.energyConsumptionNetLevelSensors || []).filter(sensor => (sensor.displayType ?? 0) > 0);
        this.energyConsumptionNetLifetimeOffset = device.energyConsumptionNetLifetimeOffset || 0;

        //grid
        this.gridProductionQualitySensors = (device.gridProductionQualitySensors || []).filter(sensor => (sensor.displayType ?? 0) > 0);
        this.gridConsumptionTotalQualitySensors = (device.gridConsumptionTotalQualitySensors || []).filter(sensor => (sensor.displayType ?? 0) > 0);
        this.gridConsumptionNetQualitySensors = (device.gridConsumptionNetQualitySensors || []).filter(sensor => (sensor.displayType ?? 0) > 0);

        //qRelay
        this.qRelayStateSensor = device.qRelayStateSensor || {};

        //ac battery
        this.acBatterieName = device.acBatterieName || 'AC Batterie';
        this.acBatterieBackupLevelSummaryAccessory = device.acBatterieBackupLevelSummaryAccessory || {};
        this.acBatterieBackupLevelAccessory = device.acBatterieBackupLevelAccessory || {};

        //enpower
        this.enpowerDryContactsControl = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.enpowerDryContactsControl || false) : false;
        this.enpowerDryContactsSensor = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.enpowerDryContactsSensor || false) : false;
        this.enpowerGridStateControl = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.enpowerGridStateControl || {}) : {};
        this.enpowerGridStateSensor = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.enpowerGridStateSensor || {}) : {};
        this.enpowerGridModeSensors = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.enpowerGridModeSensors || []).filter(sensor => (sensor.displayType ?? 0) > 0) : [];

        //encharge
        this.enchargeName = device.enchargeName || 'Encharge';
        this.enchargeBackupLevelSummaryAccessory = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.enchargeBackupLevelSummaryAccessory || {}) : {};
        this.enchargeBackupLevelSummarySensors = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.enchargeBackupLevelSummarySensors || []).filter(sensor => (sensor.displayType ?? 0) > 0) : [];
        this.enchargeBackupLevelAccessory = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.enchargeBackupLevelAccessory || {}) : {};
        this.enchargeStateSensor = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.enchargeStateSensor || {}) : {};
        this.enchargeProfileControls = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.enchargeProfileControls || []).filter(control => (control.displayType ?? 0) > 0) : [];
        this.enchargeProfileSensors = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.enchargeProfileSensors || []).filter(sensor => (sensor.displayType ?? 0) > 0) : [];
        this.enchargeGridStateSensor = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.enchargeGridStateSensor || {}) : {};
        this.enchargeGridModeSensors = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.enchargeGridModeSensors || []).filter(sensor => (sensor.displayType ?? 0) > 0) : [];

        //solar
        this.solarGridStateSensor = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.solarGridStateSensor || {}) : {};
        this.solarGridModeSensors = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.solarGridModeSensors || []).filter(sensor => (sensor.displayType ?? 0) > 0) : [];

        //generator
        this.generatorStateControl = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.generatorStateControl || {}) : {};
        this.generatorStateSensor = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.generatorStateSensor || {}) : {};
        this.generatorModeContols = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.generatorModeControls || []).filter(control => (control.displayType ?? 0) > 0) : [];
        this.generatorModeSensors = device.envoyFirmware7xxTokenGenerationMode > 0 ? (device.generatorModeSensors || []).filter(sensor => (sensor.displayType ?? 0) > 0) : [];

        //data refresh
        this.dataSamplingControl = device.dataRefreshControl || {};
        this.dataSamplingSensor = device.dataRefreshSensor || {};

        //log
        this.logDeviceInfo = device.log?.deviceInfo || true;
        this.logSuccess = device.log?.logSuccess || false;
        this.logInfo = device.log?.info || false;
        this.logWarn = device.log?.warn || true;
        this.logError = device.log?.error || true;
        this.logDebug = device.log?.debug || false;

        //external integrations
        this.restFul = device.restFul ?? {};
        this.restFulConnected = false;
        this.mqtt = device.mqtt ?? {};
        this.mqttConnected = false;

        //system accessoty
        this.systemAccessory = {
            serviceType: ['', Service.Lightbulb, Service.Fan, Service.HumiditySensor, Service.CarbonMonoxideSensor][device.displayType],
            characteristicType: ['', Characteristic.On, Characteristic.On, Characteristic.StatusActive, Characteristic.CarbonMonoxideDetected][device.displayType],
            characteristicType1: ['', Characteristic.Brightness, Characteristic.RotationSpeed, Characteristic.CurrentRelativeHumidity, Characteristic.CarbonMonoxideLevel][device.displayType],
            state: false,
            level: 0
        }

        //production state sensor
        if (this.productionStateSensor.displayType > 0) {
            const sensor = this.productionStateSensor;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        //plc level check control
        if (this.plcLevelCheckControl.displayType > 0) {
            const tile = this.plcLevelCheckControl;
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][tile.displayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][tile.displayType];
            tile.state = false;
        }

        //data sampling control
        if (this.dataSamplingControl.displayType > 0) {
            const tile = this.dataSamplingControl;
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][tile.displayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][tile.displayType];
            tile.state = false;
        }

        //data sampling sensor
        if (this.dataSamplingSensor.displayType > 0) {
            const sensor = this.dataSamplingSensor;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        //power production sensors
        for (const sensor of this.powerProductionLevelSensors) {
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        for (const sensor of this.energyProductionLevelSensors) {
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        //power consumption total sensor
        for (const sensor of this.powerConsumptionTotalLevelSensors) {
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        for (const sensor of this.energyConsumptionTotalLevelSensors) {
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        //power consumption net sensor
        for (const sensor of this.powerConsumptionNetLevelSensors) {
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        for (const sensor of this.energyConsumptionNetLevelSensors) {
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        //grid quality sensors
        for (const sensor of this.gridProductionQualitySensors) {
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        for (const sensor of this.gridConsumptionTotalQualitySensors) {
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        for (const sensor of this.gridConsumptionNetQualitySensors) {
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        //qRelay
        if (this.qRelayStateSensor.displayType > 0) {
            const sensor = this.qRelayStateSensor;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state0 = false;
            sensor.state1 = false;
            sensor.state2 = false;
            sensor.state3 = false;
        }

        //ac battery
        if (this.acBatterieBackupLevelSummaryAccessory.displayType > 0) {
            const tile = this.acBatterieBackupLevelSummaryAccessory;
            tile.serviceType = ['', Service.Lightbulb, Service.Fan, Service.HumiditySensor, Service.CarbonMonoxideSensor, Service.Battery][tile.displayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.StatusActive, Characteristic.CarbonMonoxideDetected, Characteristic.StatusLowBattery][tile.displayType];
            tile.characteristicType1 = ['', Characteristic.Brightness, Characteristic.RotationSpeed, Characteristic.CurrentRelativeHumidity, Characteristic.CarbonMonoxideLevel, Characteristic.BatteryLevel][tile.displayType];
            tile.state = false;
            tile.backupLevel = 0;
        }

        if (this.acBatterieBackupLevelAccessory.displayType > 0) {
            const tile = this.acBatterieBackupLevelAccessory;
            tile.serviceType = ['', Service.Battery][tile.displayType];
            tile.characteristicType = ['', Characteristic.StatusLowBattery][tile.displayType];
            tile.characteristicType1 = ['', Characteristic.BatteryLevel][tile.displayType];
            tile.characteristicType2 = ['', Characteristic.ChargingState][tile.displayType];
            tile.state = false;
            tile.backupLevel = 0;
            tile.chargeState = 0;
        }

        //enpower
        if (this.enpowerGridStateControl.displayType > 0) {
            const tile = this.enpowerGridStateControl;
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][tile.displaqyType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][tile.displaqyType];
            tile.state = false;
        }

        if (this.enpowerGridStateSensor.displayType > 0) {
            const sensor = this.enpowerGridStateSensor;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        for (const sensor of this.enpowerGridModeSensors) {
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        //encharge
        if (this.enchargeBackupLevelSummaryAccessory.displayType > 0) {
            const tile = this.enchargeBackupLevelSummaryAccessory;
            tile.serviceType = ['', Service.Lightbulb, Service.Fan, Service.HumiditySensor, Service.CarbonMonoxideSensor, Service.Battery][tile.displayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.StatusActive, Characteristic.CarbonMonoxideDetected, Characteristic.StatusLowBattery][tile.displayType];
            tile.characteristicType1 = ['', Characteristic.Brightness, Characteristic.RotationSpeed, Characteristic.CurrentRelativeHumidity, Characteristic.CarbonMonoxideLevel, Characteristic.BatteryLevel][tile.displayType];
            tile.state = false;
            tile.backupLevel = 0;
        }

        for (const sensor of this.enchargeBackupLevelSummarySensors) {
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        if (this.enchargeBackupLevelAccessory.displayType > 0) {
            const tile = this.enchargeBackupLevelAccessory;
            tile.serviceType = ['', Service.Battery][tile.displayType];
            tile.characteristicType1 = ['', Characteristic.StatusLowBattery][tile.displayType];
            tile.characteristicType = ['', Characteristic.BatteryLevel][tile.displayType];
            tile.characteristicType2 = ['', Characteristic.ChargingState][tile.displayType];
            tile.state = false;
            tile.backupLevel = 0;
            tile.chargeState = 0;
        }

        if (this.enchargeStateSensor.displayType > 0) {
            const sensor = this.enchargeStateSensor;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        for (const tile of this.enchargeProfileControls) {
            tile.serviceType = ['', Service.Lightbulb][tile.displayType];
            tile.characteristicType = ['', Characteristic.On][tile.displayType];
            tile.state = false;
            tile.reservedSoc = 0;
            tile.previousState = null;
        }

        for (const sensor of this.enchargeProfileSensors) {
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        if (this.enchargeGridStateSensor.displayType > 0) {
            const sensor = this.enchargeGridStateSensor;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        for (const sensor of this.enchargeGridModeSensors) {
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        //solar
        if (this.solarGridStateSensor.displayType > 0) {
            const sensor = this.solarGridStateSensor;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        for (const sensor of this.solarGridModeSensors) {
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        //generator
        if (this.generatorStateControl.displayType > 0) {
            const tile = this.generatorStateControl;
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][tile.displaqyType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][tile.displaqyType];
            tile.state = false;
        }

        if (this.generatorStateSensor.displayType > 0) {
            const sensor = this.generatorStateSensor;
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        for (const tile of this.generatorModeContols) {
            tile.serviceType = ['', Service.Switch, Service.Outlet, Service.Lightbulb][tile.displayType];
            tile.characteristicType = ['', Characteristic.On, Characteristic.On, Characteristic.On][tile.displayType];
            tile.state = false;
            tile.previousState = null;
        }

        for (const sensor of this.generatorModeSensors) {
            sensor.serviceType = ['', Service.MotionSensor, Service.OccupancySensor, Service.ContactSensor][sensor.displayType];
            sensor.characteristicType = ['', Characteristic.MotionDetected, Characteristic.OccupancyDetected, Characteristic.ContactSensorState][sensor.displayType];
            sensor.state = false;
        }

        //setup variables
        this.functions = new Functions();
        this.envoyIdFile = envoyIdFile;
        this.envoyTokenFile = envoyTokenFile;

        //supported functions
        this.feature = {
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
            powerAndEnergy: {
                supported: false
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
            homeData: {},
            inventoryData: {
                pcus: [],
                nsrbs: [],
                acbs: [],
                esubs: {
                    devices: [],
                    encharges: {
                        devices: [],
                        settings: {},
                        tariff: {},
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
            metersData: [],
            powerAndEnergyData: {
                data: [],
                production: {
                    powerPeak: null
                },
                consumptionNet: {
                    powerPeak: null
                },
                consumptionTotal: {
                    powerPeak: null
                },
            },
            liveData: {},
            productionState: false,
            plcLevelCheck: false,
            dataSampling: false
        };
    }

    async setOverExternalIntegration(integration, key, value) {
        try {
            switch (key) {
                case 'DataSampling':
                    if (value !== this.dataSampling) await this.envoyData.startStopImpulseGenerator(value);
                    break;
                case 'ProductionState':
                    if (this.feature.productionState.supported) await this.envoyData.setProductionState(value);
                    break;
                case 'PlcLevel':
                    if (this.feature.plcLevel.supported) await this.envoyData.updatePlcLevel(false);
                    break;
                case 'EnchargeProfile':
                    if (this.feature.inventory.esubs.encharges.tariff.supported) await this.envoyData.setEnchargeProfile(value, this.pv.inventoryData.esubs.encharges.tariff.storageSettings.reservedSoc, this.pv.inventoryData.esubs.encharges.tariff.storageSettings.chargeFromGrid);
                    break;
                case 'EnchargeReservedSoc':
                    if (this.feature.inventory.esubs.encharges.tariff.supported) await this.envoyData.setEnchargeProfile(this.pv.inventoryData.esubs.encharges.tariff.storageSettings.mode, value, this.pv.inventoryData.esubs.encharges.tariff.storageSettings.chargeFromGrid);
                    break;
                case 'EnchargeChargeFromGrid':
                    if (this.feature.inventory.esubs.encharges.tariff.supported) await this.envoyData.setEnchargeProfile(this.pv.inventoryData.esubs.encharges.tariff.storageSettings.mode, this.pv.inventoryData.esubs.encharges.tariff.storageSettings.reservedSoc, value);
                    break;
                case 'EnpowerGridState':
                    if (this.feature.inventory.esubs.enpowers.installed) await this.envoyData.setEnpowerGridState(value);
                    break;
                case 'GeneratorMode':
                    if (this.feature.inventory.esubs.generator.installed) await this.envoyData.setGeneratorMode(value);
                    break;
                default:
                    if (this.logWarn) this.emit('warn' `${integration}, received key: ${key}, value: ${value}`);
                    break;
            }
            return;
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

    async startStopImpulseGenerator(state) {
        try {
            //start impulse generator 
            await this.envoyData.startStopImpulseGenerator(state);
            return true;
        } catch (error) {
            throw new Error(`Impulse generator start error: ${error}`);
        }
    }

    // Prepare accessory
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
            const envoySupported = this.feature.home.supported;
            const wirelessConnectionsInstalled = this.feature.home.wirelessConnections.installed;
            const metersInstalled = this.feature.meters.installed;
            const pcuInstalled = this.feature.inventory.pcus.installed;
            const pcusStatusDataSupported = this.feature.inventory.pcus.status.supported;
            const pcusDetailedDataSupported = this.feature.inventory.pcus.detailedData.supported;
            const nsrbsInstalled = this.feature.inventory.nsrbs.installed;
            const nsrbsDetailedDataSupported = this.feature.inventory.nsrbs.detailedData.supported;
            const acBatterieName = this.acBatterieName;
            const acbsInstalled = this.feature.inventory.acbs.installed;
            const acbsSupported = this.feature.productionCt.storage.supported;
            const powerAndEnergySupported = this.feature.powerAndEnergy.supported;
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
            if (this.systemAccessory) {
                if (this.logDebug) this.emit('debug', `Prepare System Service`);
                const systemAccessory = this.systemAccessory;
                const { serviceType, characteristicType, characteristicType1 } = systemAccessory;

                const systemService = accessory.addService(serviceType, accessoryName, `systemService`);
                systemService.setPrimaryService(true);
                systemService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                systemService.setCharacteristic(Characteristic.ConfiguredName, accessoryName);

                // Handle production state characteristic
                systemService.getCharacteristic(characteristicType)
                    .onGet(async () => {
                        const currentState = systemAccessory.state;
                        if (this.logInfo) this.emit('info', `Production state: ${currentState ? 'Enabled' : 'Disabled'}`);
                        return currentState;
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

                            await this.envoyData.setProductionState(value);
                            if (this.logDebug) this.emit('debug', `Set production state: ${value ? 'Enabled' : 'Disabled'}`);
                        } catch (error) {
                            if (this.logWarn) this.emit('warn', `Set production state error: ${error}`);
                        }
                    });

                // Handle production level characteristic
                systemService.getCharacteristic(characteristicType1)
                    .onGet(async () => {
                        const powerLevel = systemAccessory.level;
                        if (this.logInfo) this.emit('info', `Production level: ${powerLevel} %`);
                        return powerLevel;
                    });

                this.systemService = systemService;
            }

            //data refresh control
            if (this.dataSamplingControl.displayType > 0) {
                if (this.logDebug) this.emit('debug', `Prepare Data Refresh Control Service`);

                const control = this.dataSamplingControl;
                const { name, namePrefix, serviceType, characteristicType } = control;
                const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                const controlService = accessory.addService(serviceType, serviceName, `dataSamplingControlService`);
                controlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                controlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                controlService.getCharacteristic(characteristicType)
                    .onGet(async () => {
                        const currentState = control.state;
                        if (this.logInfo) this.emit('info', `Data refresh control: ${currentState ? 'Enabled' : 'Disabled'}`);
                        return currentState;
                    })

                    // SET handler
                    .onSet(async (value) => {
                        if (!pvControl) {
                            if (this.logWarn) this.emit('warn', `System control is locked`);
                            setTimeout(() => controlService.updateCharacteristic(characteristicType, !value), 250);
                            return;
                        }

                        try {
                            await this.envoyData.startStopImpulseGenerator(value);
                            if (this.logInfo) this.emit('info', `Set data refresh control to: ${value ? 'Enable' : 'Disable'}`);
                        } catch (error) {
                            if (this.logWarn) this.emit('warn', `Set data refresh control error: ${error}`);
                        }
                    });

                this.dataSamplingControlService = controlService;
            }

            //data refresh sensor
            if (this.dataSamplingSensor.displayType > 0) {
                if (this.logDebug) this.emit('debug', `Prepare Data Refresh Sensor Service`);

                const sensor = this.dataSamplingSensor;
                const { name, namePrefix, serviceType, characteristicType } = sensor;
                const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                const sensorService = accessory.addService(serviceType, serviceName, `dataSamplingSensorService`);
                sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                sensorService.getCharacteristic(characteristicType)
                    .onGet(async () => {
                        const currentState = sensor.state;
                        if (this.logInfo) this.emit('info', `Data refresh sensor: ${currentState ? 'Active' : 'Not active'}`);
                        return currentState;
                    });

                this.dataSamplingSensorService = sensorService;
            }

            //production state sensor
            if (this.productionStateSensor.displayType > 0 && productionStateSupported) {
                if (this.logDebug) this.emit('debug', `Prepare Production State Sensor Service`);

                const sensor = this.productionStateSensor;
                const { name, namePrefix, serviceType, characteristicType } = sensor;
                const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                const sensorService = accessory.addService(serviceType, serviceName, `productionStateSensorService`);
                sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                sensorService.getCharacteristic(characteristicType)
                    .onGet(async () => {
                        const currentState = sensor.state;
                        if (this.logInfo) this.emit('info', `Production state sensor: ${currentState ? 'Active' : 'Not active'}`);
                        return currentState;
                    });

                this.productionStateSensorService = sensorService;
            }

            //plc level control
            if (this.plcLevelCheckControl.displayType > 0 && plcLevelSupported) {
                if (this.logDebug) this.emit('debug', `Prepare Plc Level Control Service`);

                const sensor = this.plcLevelCheckControl;
                const { name, namePrefix, serviceType, characteristicType } = sensor;
                const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                const controlService = accessory.addService(serviceType, serviceName, `plcLevelCheckControlService`);
                controlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                controlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                controlService.getCharacteristic(characteristicType)
                    .onGet(async () => {
                        const currentState = sensor.state;
                        if (this.logInfo) this.emit('info', `Plc level control state: ${currentState ? 'ON' : 'OFF'}`);
                        return currentState;
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

                this.plcLevelCheckControlService = controlService;
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

                const home = this.pv.homeData;
                const service = accessory.addService(Service.EnvoyService, `Envoy ${envoySerialNumber}`, `envoyService`);
                service.setCharacteristic(Characteristic.ConfiguredName, `Envoy ${envoySerialNumber}`);
                service.getCharacteristic(Characteristic.DataSampling)
                    .onGet(async () => {
                        const state = this.pv.dataSampling;
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
                            await this.envoyData.startStopImpulseGenerator(value);
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
                    { type: Characteristic.CurrentDateTime, label: 'current date and time', value: home.currentDateTime },
                    { type: Characteristic.LastEnlightenReporDate, label: 'report time to enlighten', value: home.network.lastEnlightenReporDate },
                    { type: Characteristic.UpdateStatus, label: 'update status', value: home.updateStatus }
                ];

                if (nsrbsInstalled) characteristics.push({ type: Characteristic.CommNumNsrbAndLevel, label: 'communication qRelays and level', value: `${home.comm.nsrbNum} / ${home.comm.nsrbLevel}`, unit: '%' });
                if (acbsInstalled) characteristics.push({ type: Characteristic.CommNumAcbAndLevel, label: `communication ${acBatterieName} and level`, value: `${home.comm.acbNum} / ${home.comm.acbLevel}`, unit: '%' });
                if (enchargesInstalled) characteristics.push({ type: Characteristic.CommNumEnchgAndLevel, label: `communication ${enchargeName} and level`, value: `${home.comm.encharges[0].num} / ${home.comm.encharges[0].level}`, unit: '%' });
                if (gridProfileSupported) characteristics.push({ type: Characteristic.GridProfile, label: 'grid profile', value: home.gridProfile });

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

                                await this.envoyData.setProductionState(value);
                                if (!this.logDebug) this.emit('debug', `Envoy: ${envoySerialNumber}, set production state: ${value ? 'Enabled' : 'Disabled'}`);
                            } catch (error) {
                                if (this.logWarn) this.emit('warn', `Envoy: ${envoySerialNumber}, set production state error: ${error}`);
                            }
                        });
                }

                if (plcLevelSupported) {
                    service.getCharacteristic(Characteristic.PlcLevelCheck)
                        .onGet(async () => {
                            const state = this.pv.plcLevelCheck;
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
                    const enpowerState = this.pv.inventoryData.esubs.enpowers[0].mainsAdminStateBool;
                    characteristics.push({ type: Characteristic.EnpowerGridMode, label: 'enpower grid mode', value: this.pv.inventoryData.esubs.enpowers[0].enpwrGridModeTranslated });
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

                                await this.envoyData.setEnpowerGridState(value);
                                if (this.logInfo) this.emit('info', `Envoy: ${envoySerialNumber}, set enpower grid state to: ${value ? `Grid ON` : `Grid OFF`}`);
                            } catch (error) {
                                if (this.logWarn) this.emit('warn', `Set enpower grid state error: ${error}`);
                            }
                        });
                }

                if (generatorInstalled) {
                    const generatorState = this.pv.inventoryData.esubs.generator.adminModeOnBool || this.pv.inventoryData.esubs.generator.adminModeAutoBool;
                    characteristics.push({ type: Characteristic.GeneratorMode, label: 'generator mode', value: this.pv.inventoryData.esubs.generator.adminMode });
                    service.getCharacteristic(Characteristic.State)
                        .onGet(async () => {
                            const state = generatorState;
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
                                await this.envoyData.setGeneratorMode(genMode);
                                if (this.logInfo) this.emit('info', `Envoy: ${envoySerialNumber}, set generator state to: ${value ? `ON` : `OFF`}`);
                            } catch (error) {
                                if (this.logWarn) this.emit('warn', `Set generator state error: ${error}`);
                            }
                        });
                }

                // Add all read-only characteristics
                for (const { type, value, label, unit = '', postfix = '' } of characteristics) {
                    if (!this.functions.isValidValue(value)) continue;

                    service.getCharacteristic(type)
                        .onGet(async () => {
                            const currentValue = value;
                            if (this.logInfo) this.emit('info', `Envoy: ${envoySerialNumber}, ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                            return currentValue;
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
                            if (!this.functions.isValidValue(value)) continue;

                            wirelessService.getCharacteristic(type)
                                .onGet(async () => {
                                    const currentValue = value;
                                    if (this.logInfo) this.emit('info', `Wireless connection: ${connectionType}, ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                    return currentValue;
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

                for (const meter of this.pv.metersData) {
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

                        if (measurementType !== 'Consumption Total') characteristics.push({ type: Characteristic.EnergyLifetimeUpload, label: 'energy lifetime upload', value: meter.energyLifetimeUploadKw, unit: 'kW' });
                    }

                    for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                        if (!this.functions.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                const currentValue = value;
                                if (this.logInfo) this.emit('info', `${serviceName}: ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                return currentValue;
                            });
                    }

                    this.meterServices.push(service);
                }
            }

            //pcu
            if (pcuInstalled) {
                this.pcuServices = [];

                for (const pcu of this.pv.inventoryData.pcus) {
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

                    if (gridProfileSupported) characteristics.push({ type: Characteristic.GridProfile, label: 'grid profile', value: pcu.gridProfile });
                    if (plcLevelPcusSupported) characteristics.push({ type: Characteristic.PlcLevel, label: 'plc level', value: pcu.plcLevel, unit: '%' });

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
                        if (!this.functions.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                const currentValue = value;
                                if (this.logInfo) this.emit('info', `Microinverter: ${serialNumber}, ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                return currentValue;
                            });
                    }

                    this.pcuServices.push(service);
                }
            }

            //qrelays
            if (nsrbsInstalled) {
                this.nsrbServices = [];
                this.nsrbStateSensorServices = [];

                for (const nsrb of this.pv.inventoryData.nsrbs) {
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

                    if (gridProfileSupported) characteristics.push({ type: Characteristic.GridProfile, label: 'grid profile', value: nsrb.gridProfile });
                    if (plcLevelNrsbsSupported) characteristics.push({ type: Characteristic.PlcLevel, label: 'plc level', value: nsrb.plcLevel, unit: '%' });

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
                        if (!this.functions.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                const currentValue = value;
                                if (this.logInfo) this.emit('info', `Q-Relay: ${serialNumber}, ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                return currentValue;
                            });
                    }

                    this.nsrbServices.push(service);

                    // State sensors setup
                    if (this.qRelayStateSensor.displayType > 0) {
                        if (this.logDebug) this.emit('debug', `Prepare Q-Relay ${serialNumber} State Sensor Service`);

                        const sensorServices = [];
                        const sensor = this.qRelayStateSensor;
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
                if (acbsSupported) {

                    // --- AC Battery Backup Level and State Summary Service ---
                    if (this.acBatterieBackupLevelSummaryAccessory.displayType > 0) {
                        if (this.logDebug) this.emit('debug', `Prepare ${acBatterieName} Backup Level Summary Service`);

                        const control = this.acBatterieBackupLevelSummaryAccessory;
                        const { namePrefix, serviceType, characteristicType, characteristicType1 } = control;
                        const serviceName = namePrefix ? `${accessoryName} ${acBatterieName}` : acBatterieName;

                        const controlService = accessory.addService(serviceType, serviceName, `acbSummaryLevelAndStateService`);
                        controlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        controlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                        // Create characteristics
                        const characteristics = [
                            { type: characteristicType, label: 'state', value: control.state, postfix: control.state ? 'Discharged' : 'Charged' },
                            { type: characteristicType1, label: 'backup level', value: control.backupLevel, unit: '%' },
                        ];

                        for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                            if (!this.functions.isValidValue(value)) continue;

                            controlService.getCharacteristic(type)
                                .onGet(async () => {
                                    const currentValue = value;
                                    if (this.logInfo) this.emit('info', `${acBatterieName}: ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                    return currentValue;
                                });
                        }

                        this.acbSummaryLevelAndStateService = controlService;
                    }

                    // --- AC Batteries Summary Service ---
                    if (this.logDebug) this.emit('debug', `Prepare ${acBatterieName} Summary Service`);

                    const storageSumm = this.pv.inventoryData.acbs[0];
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
                        if (!this.functions.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                const currentValue = value;
                                if (this.logInfo) this.emit('info', `${acBatterieName}: ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                return currentValue;
                            });
                    }

                    this.acbSummaryService = service;
                }

                // --- Individual AC Batteries ---
                this.acbServices = [];
                this.acbLevelAndStateServices = [];

                for (const storage of this.pv.inventoryData.acbs) {
                    const serialNumber = storage.serialNumber;

                    // Backup Level and State individual service
                    if (this.acBatterieBackupLevelAccessory.displayType > 0) {
                        if (this.logDebug) this.emit('debug', `Prepare ${acBatterieName} Backup Level Summary Service`);

                        const control = this.acBatterieBackupLevelAccessory;
                        const { namePrefix, serviceType, characteristicType, characteristicType1, characteristicType2 } = control;
                        const serviceName = namePrefix ? `${accessoryName} ${acBatterieName}` : acBatterieName;

                        const controlService = accessory.addService(serviceType, serviceName, `acBatterieLevelAndStateService${serialNumber}`);
                        controlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        controlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                        // Create characteristics
                        const characteristics = [
                            { type: characteristicType, label: 'state', value: control.state, postfix: `${control.state ? 'Discharged' : 'Charged'}` },
                            { type: characteristicType1, label: 'backup level', value: control.backupLevel, unit: '%' },
                            { type: characteristicType2, label: 'charging state', value: control.chargeState, postfix: `${control.chargeState === 0 ? 'Discharging' : control.chargeState === 1 ? 'Charging' : 'Ready'}` },
                        ];

                        for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                            if (!this.functions.isValidValue(value)) continue;

                            controlService.getCharacteristic(type)
                                .onGet(async () => {
                                    const currentValue = value;
                                    if (this.logInfo) this.emit('info', `${acBatterieName} ${serialNumber}: ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                    return currentValue;
                                });
                        }

                        this.acbLevelAndStateServices.push(controlService);
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
                        if (!this.functions.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                const currentValue = value;
                                if (this.logInfo) this.emit('info', `${acBatterieName}: ${serialNumber}, ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                return currentValue;
                            });
                    };

                    this.acbServices.push(service);
                }
            }

            //power and energy data
            if (powerAndEnergySupported) {
                this.powerAndEnergyServices = [];
                for (const source of this.pv.powerAndEnergyData.data) {
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
                        if (measurementType !== 'Consumption Total') characteristics.push({ type: Characteristic.EnergyLifetimeUpload, label: 'energy lifetime upload', value: source.energyLifetimeUploadKw, unit: 'kW' });

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
                        if (!this.functions.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                const currentValue = value;
                                if (this.logInfo) this.emit('info', `${measurementType}, ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                return currentValue;
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

                                this.pv.powerAndEnergyData[key].powerPeak = null;
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
                            if (this.powerProductionLevelSensors.length > 0) {
                                if (this.logDebug) this.emit('debug', `Prepare Production Power Level Sensor Services`);
                                this.powerProductionLevelSensorServices = [];
                                for (let i = 0; i < this.powerProductionLevelSensors.length; i++) {
                                    const sensor = this.powerProductionLevelSensors[i];
                                    const { namePrefix, name, serviceType, characteristicType } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorService = accessory.addService(serviceType, serviceName, `powerProductionLevelSensorService${i}`);
                                    sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const currentState = sensor.state;
                                            if (this.logInfo) this.emit('info', `Power Level: ${measurementType}, sensor: ${serviceName}: ${currentState ? 'Active' : 'Not active'}`);
                                            return currentState;
                                        });
                                    this.powerProductionLevelSensorServices.push(sensorService);
                                }
                            }

                            //energy level sensors
                            if (this.energyProductionLevelSensors.length > 0) {
                                if (this.logDebug) this.emit('debug', `Prepare Production Energy Level Sensor Services`);
                                this.energyProductionLevelSensorServices = [];
                                for (let i = 0; i < this.energyProductionLevelSensors.length; i++) {
                                    const sensor = this.energyProductionLevelSensors[i];
                                    const { namePrefix, name, serviceType, characteristicType } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorService = accessory.addService(serviceType, serviceName, `energyProductionLevelSensorService${i}`);
                                    sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const currentState = sensor.state;
                                            if (this.logInfo) this.emit('info', `Energy Level: ${measurementType}, sensor: ${serviceName}: ${currentState ? 'Active' : 'Not active'}`);
                                            return currentState;
                                        });
                                    this.energyProductionLevelSensorServices.push(sensorService);
                                }
                            }

                            //grid quality sensors
                            if (this.gridProductionQualitySensors.length > 0 && source.gridQualityState) {
                                if (this.logDebug) this.emit('debug', `Prepare Grid Quality Sensor Services`);
                                this.gridProductionQualityActiveSensorServices = [];
                                for (let i = 0; i < this.gridProductionQualitySensors.length; i++) {
                                    const sensor = this.gridProductionQualitySensors[i];
                                    const { namePrefix, name, serviceType, characteristicType } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorService = accessory.addService(serviceType, serviceName, `gridProductionQualityActiveSensorService${i}`);
                                    sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const currentState = sensor.state;
                                            if (this.logInfo) this.emit('info', `Grid Quality: ${measurementType}, sensor: ${serviceName}: ${currentState ? 'Active' : 'Not active'}`);
                                            return currentState;
                                        });
                                    this.gridProductionQualityActiveSensorServices.push(sensorService);
                                }
                            }
                            break;
                        case 'Consumption Net':
                            //power level sensors 
                            if (this.powerConsumptionNetLevelSensors.length > 0) {
                                if (this.logDebug) this.emit('debug', `Prepare ${measurementType} Power Level Sensor Services`);
                                this.powerConsumptionNetLevelSensorServices = [];
                                for (let i = 0; i < this.powerConsumptionNetLevelSensors.length; i++) {
                                    const sensor = this.powerConsumptionNetLevelSensors[i];
                                    const { namePrefix, name, serviceType, characteristicType } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorService = accessory.addService(serviceType, serviceName, `powerConsumptionNetLevelSensorService${i}`);
                                    sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorService.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const currentState = sensor.state;
                                            if (this.logInfo) this.emit('info', `Power Level: ${measurementType}, sensor: ${serviceName}: ${currentState ? 'Active' : 'Not active'}`);
                                            return currentState;
                                        });
                                    this.powerConsumptionNetLevelSensorServices.push(sensorService);
                                }
                            }

                            //energy level sensors 
                            if (this.energyConsumptionNetLevelSensors.length > 0) {
                                if (this.logDebug) this.emit('debug', `Prepare ${measurementType} Energy Level Sensor Services`);
                                this.energyConsumptionNetLevelSensorServices = [];
                                for (let i = 0; i < this.energyConsumptionNetLevelSensors.length; i++) {
                                    const sensor = this.energyConsumptionNetLevelSensors[i];
                                    const { namePrefix, name, serviceType, characteristicType } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorServicee = accessory.addService(serviceType, serviceName, `energyConsumptionNetLevelSensorService${i}`);
                                    sensorServicee.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorServicee.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorServicee.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const currentState = sensor.state;
                                            if (this.logInfo) this.emit('info', `Energy Level: ${measurementType}, sensor: ${serviceName}: ${currentState ? 'Active' : 'Not active'}`);
                                            return currentState;
                                        });
                                    this.energyConsumptionNetLevelSensorServices.push(sensorServicee);
                                }
                            }

                            //grid quality sensors
                            if (this.gridConsumptionNetQualitySensors.length > 0) {
                                if (this.logDebug) this.emit('debug', `Prepare Grid Quality Sensor Services`);
                                this.gridConsumptionNetQualityActiveSensorServices = [];
                                for (let i = 0; i < this.gridConsumptionNetQualitySensors.length; i++) {
                                    const sensor = this.gridConsumptionNetQualitySensors[i];
                                    const { namePrefix, name, serviceType, characteristicType } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorServicee = accessory.addService(serviceType, serviceName, `gridConsumptionNetQualityActiveSensorService${i}`);
                                    sensorServicee.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorServicee.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorServicee.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const currentState = sensor.state;
                                            if (this.logInfo) this.emit('info', `Grid Quality: ${measurementType}, sensor: ${serviceName}: ${currentState ? 'Active' : 'Not active'}`);
                                            return currentState;
                                        });
                                    this.gridConsumptionNetQualityActiveSensorServices.push(sensorServicee);
                                }
                            }
                            break;
                        case 'Consumption Total':
                            //power level sensors 
                            if (this.powerConsumptionTotalLevelSensors.length > 0) {
                                if (this.logDebug) this.emit('debug', `Prepare ${measurementType} Power Level Sensor Services`);
                                this.powerConsumptionTotalLevelSensorServices = [];
                                for (let i = 0; i < this.powerConsumptionTotalLevelSensors.length; i++) {
                                    const sensor = this.powerConsumptionTotalLevelSensors[i];
                                    const { namePrefix, name, serviceType, characteristicType } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorServicee = accessory.addService(serviceType, serviceName, `powerConsumptionTotalLevelSensorService${i}`);
                                    sensorServicee.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorServicee.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorServicee.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const currentState = sensor.state;
                                            if (this.logInfo) this.emit('info', `Power Level: ${measurementType}, sensor: ${serviceName}: ${currentState ? 'Active' : 'Not active'}`);
                                            return currentState;
                                        });
                                    this.powerConsumptionTotalLevelSensorServices.push(sensorServicee);
                                }
                            }

                            //energy level sensors 
                            if (this.energyConsumptionTotalLevelSensors.length > 0) {
                                if (this.logDebug) this.emit('debug', `Prepare ${measurementType} Energy Level Sensor Services`);
                                this.energyConsumptionTotalLevelSensorServices = [];
                                for (let i = 0; i < this.energyConsumptionTotalLevelSensors.length; i++) {
                                    const sensor = this.energyConsumptionTotalLevelSensors[i];
                                    const { namePrefix, name, serviceType, characteristicType } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorServicee = accessory.addService(serviceType, serviceName, `energyConsumptionTotalLevelSensorService${i}`);
                                    sensorServicee.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorServicee.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorServicee.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const currentState = sensor.state;
                                            if (this.logInfo) this.emit('info', `Energy Level: ${measurementType}, sensor: ${serviceName}: ${currentState ? 'Active' : 'Not active'}`);
                                            return currentState;
                                        });
                                    this.energyConsumptionTotalLevelSensorServices.push(sensorServicee);
                                }
                            }

                            //grid quality sensors
                            if (this.gridConsumptionTotalQualitySensors.length > 0) {
                                if (this.logDebug) this.emit('debug', `Prepare Grid Quality Sensor Services`);
                                this.gridConsumptionTotalQualityActiveSensorServices = [];
                                for (let i = 0; i < this.gridConsumptionTotalQualitySensors.length; i++) {
                                    const sensor = this.gridConsumptionTotalQualitySensors[i];
                                    const { namePrefix, name, serviceType, characteristicType } = sensor;
                                    const serviceName = namePrefix ? `${accessoryName} ${name}` : name;
                                    const sensorServicee = accessory.addService(serviceType, serviceName, `gridConsumptionTotalQualityActiveSensorService${i}`);
                                    sensorServicee.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                    sensorServicee.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                    sensorServicee.getCharacteristic(characteristicType)
                                        .onGet(async () => {
                                            const currentState = sensor.state;
                                            if (this.logInfo) this.emit('info', `Grid Quality: ${measurementType}, sensor: ${serviceName}: ${currentState ? 'Active' : 'Not active'}`);
                                            return currentState;
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
                    const secctrl = this.pv.inventoryData.esubs.secctrl;
                    const counters = this.pv.inventoryData.esubs.counters;

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

                    if (ensemblesCountersSupported) characteristics.push({ type: Characteristic.RestPower, label: 'rest power', value: counters.restPowerKw, unit: 'kW' });
                    if (enchargesStatusSupported) characteristics.push({ type: Characteristic.RatedPower, label: 'rated power', value: this.pv.inventoryData.esubs.ratedPowerSumKw, unit: 'kW' });
                    if (enchargesPowerSupported) characteristics.push({ type: Characteristic.RealPower, label: 'real power', value: this.pv.inventoryData.esubs.realPowerSumKw, unit: 'kW' });

                    for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                        if (!this.functions.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                const currentValue = value;
                                if (this.logInfo) this.emit('info', `Ensemble Summary, ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                return currentValue;
                            });
                    }

                    this.ensembleSummaryService = service;
                }

                //devices
                if (ensemblesInstalled) {
                    this.ensembleServices = [];

                    for (const ensemble of this.pv.inventoryData.esubs.devices) {
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
                            if (!this.functions.isValidValue(value)) continue;

                            service.getCharacteristic(type)
                                .onGet(async () => {
                                    const currentValue = value;
                                    if (this.logInfo) this.emit('info', `Ensemble: ${serialNumber}, ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                    return currentValue;
                                });
                        }

                        this.ensembleServices.push(service);
                    }
                }

                //grid sensors by relay
                if (ensemblesRelaySupported) {
                    //solar grid state sensor
                    if (this.solarGridStateSensor.displayType > 0) {
                        if (this.logDebug) this.emit('debug', `Prepare Solar Grid State Sensor Service`);
                        const serialNumber = this.pv.info.serialNumber;
                        const sensor = this.solarGridStateSensor;
                        const { namePrefix, name, serviceType, characteristicType } = sensor;
                        const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                        const sensorService = accessory.addService(serviceType, serviceName, `solarGridStateSensorService`);
                        sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        sensorService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const currentState = sensor.state;
                                if (this.logInfo) this.emit('info', `solar: ${serialNumber}, grid state sensor: ${serviceName}, state: ${currentState ? 'Grid ON' : 'Grid Off'}`);
                                return currentState;
                            });
                        this.solarGridStateSensorService = sensorService;
                    }

                    //solar grid mode sensor services
                    if (this.solarGridModeSensors.length > 0) {
                        if (this.logDebug) this.emit('debug', `Prepare Solar Grid Mode Sensor Services`);

                        this.solarGridModeSensorServices = [];
                        for (let i = 0; i < this.solarGridModeSensors.length; i++) {
                            const sensor = this.solarGridModeSensors[i];
                            const { namePrefix, name, serviceType, characteristicType } = sensor;
                            const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                            const sensorService = accessory.addService(serviceType, serviceName, `solarGridModeSensorService${i}`);
                            sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            sensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const currentState = sensor.state;
                                    if (this.logInfo) this.emit('info', `Solar grid mode sensor: ${serviceName}, state: ${currentState ? 'Active' : 'Not active'}`);
                                    return currentState;
                                });

                            this.solarGridModeSensorServices.push(sensorService);
                        }
                    }
                }

                //encharges
                if (enchargesInstalled) {

                    //backup level and state summary control
                    if (this.enchargeBackupLevelSummaryAccessory.displayType > 0) {
                        if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} Backup Level Summary Service`);

                        const control = this.enchargeBackupLevelSummaryAccessory;
                        const { namePrefix, name, serviceType, characteristicType, characteristicType1 } = control;
                        const serviceName = namePrefix ? `${accessoryName} ${enchargeName}` : enchargeName;

                        const controlService = accessory.addService(serviceType, serviceName, `enchargeSummaryLevelAndStateService`);
                        controlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                        controlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                        controlService.getCharacteristic(characteristicType)
                            .onGet(async () => {
                                const currentState = control.state;
                                if (this.logInfo) this.emit('info', `${enchargeName} state: ${currentState ? 'Charged' : 'Discharged'}`);
                                return currentState;
                            })
                            .onSet(async (value) => {
                                if (!pvControl) {
                                    if (this.logWarn) this.emit('warn', `System control is locked`);
                                    setTimeout(() => controlService.updateCharacteristic(characteristicType, !value), 250);
                                    return;
                                }

                                try {
                                    // Your set handler logic here (if any)
                                } catch (error) {
                                    if (this.logWarn) this.emit('warn', `${enchargeName}, Set state error: ${error}`);
                                }
                            });
                        controlService.getCharacteristic(characteristicType1)
                            .onGet(async () => {
                                const currentBackupLevel = control.backupLevel;
                                if (this.logInfo) this.emit('info', `${enchargeName} backup level: ${currentBackupLevel} %`);
                                return currentBackupLevel;
                            })
                            .onSet(async (value) => {
                                if (!pvControl) {
                                    if (this.logWarn) this.emit('warn', `System control is locked`);
                                    setTimeout(() => controlService.updateCharacteristic(characteristicType1, backupLevel), 250);
                                    return;
                                }

                                try {
                                    // Your set handler logic here (if any)
                                } catch (error) {
                                    if (this.logWarn) this.emit('warn', `${enchargeName}, Set backup level error: ${error}`);
                                }
                            });

                        this.enchargeSummaryLevelAndStateService = controlService;
                    }

                    //backup level summary sensors
                    if (this.enchargeBackupLevelSummarySensors.length > 0) {
                        if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} Backup Level Sensor Services`);

                        this.enchargeBackupLevelSensorServices = [];
                        for (let i = 0; i < this.enchargeBackupLevelSummarySensors.length; i++) {
                            const sensor = this.enchargeBackupLevelSummarySensors[i];
                            const { namePrefix, name, serviceType, characteristicType } = sensor;
                            const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                            const sensorService = accessory.addService(serviceType, serviceName, `enchargeBackupLevelSensorService${i}`);
                            sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            sensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const currentState = sensor.state;
                                    if (this.logInfo) this.emit('info', `${enchargeName} Backup Level sensor: ${serviceName}, state: ${currentState ? 'Active' : 'Not active'}`);
                                    return currentState;
                                });

                            this.enchargeBackupLevelSensorServices.push(sensorService);
                        }
                    }

                    //devices
                    this.enchargeServices = [];
                    this.enchargeLevelAndStateServices = [];

                    for (const encharge of this.pv.inventoryData.esubs.encharges.devices) {
                        const serialNumber = encharge.serialNumber;

                        // Backup level and state (individual)
                        if (this.enchargeBackupLevelAccessory.displayType > 0) {
                            if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} ${serialNumber} Backup Level Service`);

                            const control = this.enchargeBackupLevelAccessory;
                            const { namePrefix, serviceType, characteristicType, characteristicType1, characteristicType2 } = control;
                            const serviceName = namePrefix ? `${accessoryName} ${enchargeName}` : enchargeName;

                            const controlService = accessory.addService(serviceType, serviceName, `enchargeLevelAndStateService${serialNumber}`);
                            controlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            controlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            controlService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const currentState = control.state;
                                    if (this.logInfo) this.emit('info', `${enchargeName} ${serialNumber}, backup level state: ${currentState ? 'Low' : 'Normal'}`);
                                    return currentState;
                                })
                                .onSet(async (value) => {
                                    if (!pvControl) {
                                        if (this.logWarn) this.emit('warn', `System control is locked`);
                                        setTimeout(() => controlService.updateCharacteristic(characteristicType, !value), 250);
                                        return;
                                    }
                                    // Add actual control logic here if needed
                                });
                            controlService.getCharacteristic(characteristicType1)
                                .onGet(async () => {
                                    const currentLevel = control.backupLevel;
                                    if (this.logInfo) this.emit('info', `${enchargeName} ${serialNumber}, backup level: ${currentLevel} %`);
                                    return currentLevel;
                                })
                                .onSet(async (value) => {
                                    if (!pvControl) {
                                        if (this.logWarn) this.emit('warn', `System control is locked`);
                                        setTimeout(() => controlService.updateCharacteristic(characteristicType1, backupLevel), 250);
                                        return;
                                    }
                                    // Add actual control logic here if needed
                                });
                            controlService.getCharacteristic(characteristicType2)
                                .onGet(async () => {
                                    const currentChargeState = control.chargeState;
                                    if (this.logInfo) this.emit('info', `${enchargeName} ${serialNumber}, state: ${currentChargeState === 0 ? 'Discharging' : currentChargeState === 1 ? 'Charging' : 'Ready'}`);
                                    return currentChargeState;
                                });

                            this.enchargeLevelAndStateServices.push(controlService);
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
                            if (!this.functions.isValidValue(value)) continue;

                            service.getCharacteristic(type)
                                .onGet(async () => {
                                    const currentValue = value;
                                    if (this.logInfo) this.emit('info', `${enchargeName}: ${serialNumber}, ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                    return currentValue;
                                });
                        }

                        this.enchargeServices.push(service);
                    }

                    //state sensor by settings
                    if (enchargesSettingsSupported) {
                        if (this.enchargeStateSensor.displayType > 0) {
                            if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} State Sensor Service`);

                            const sensor = this.enchargeStateSensor;
                            const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                            const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                            const sensorService = accessory.addService(serviceType, serviceName, `enchargeStateSensorService`);
                            sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            sensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const currentState = state;
                                    if (this.logInfo) this.emit('info', `${enchargeName} state sensor: ${serviceName}, state: ${currentState ? 'Active' : 'Not Active'}`);
                                    return currentState;
                                });

                            this.enchargeStateSensorService = sensorService;
                        }
                    }

                    //profile controls and sensors by tariff
                    if (enchargesTariffSupported) {
                        //controls
                        if (this.enchargeProfileControls.length > 0) {
                            if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} Profile Control Services`);

                            const enchargeSettings = this.pv.inventoryData.esubs.encharges.tariff.storageSettings;
                            this.enchargeProfileControlsServices = [];

                            for (let i = 0; i < this.enchargeProfileControls.length; i++) {
                                const control = this.enchargeProfileControls[i];
                                const { profile, namePrefix, name, serviceType, characteristicType } = control;
                                const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                                const controlService = accessory.addService(serviceType, serviceName, `enchargeProfileControlService${i}`);
                                controlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                controlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                                controlService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const currentState = control.state;
                                        if (this.logInfo) this.emit('info', `${enchargeName} profile: ${name}, state: ${currentState ? 'ON' : 'OFF'}`);
                                        return currentState;
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

                                            await this.envoyData.setEnchargeProfile(profile, enchargeSettings.reservedSoc, control.chargeFromGrid);
                                            if (this.logDebug) this.emit('debug', `${enchargeName} set profile: ${name}, charge from grid: ${control.chargeFromGrid ? 'ON' : 'OFF'}`);
                                        } catch (error) {
                                            if (this.logWarn) this.emit('warn', `${enchargeName} set profile: ${profile}, error: ${error}`);
                                        }
                                    });

                                if (profile !== 'backup') {
                                    controlService.getCharacteristic(Characteristic.Brightness)
                                        .onGet(async () => {
                                            const value = control.reservedSoc;
                                            if (this.logInfo) this.emit('info', `${enchargeName} profile: ${name}, reserved soc: ${value} %`);
                                            return value;
                                        })
                                        .onSet(async (value) => {
                                            if (!pvControl) {
                                                if (this.logWarn) this.emit('warn', `System control is locked`);
                                                setTimeout(() => controlService.updateCharacteristic(Characteristic.Brightness, control.reservedSoc), 250);
                                                return;
                                            }

                                            if (value === 0 || value === 100) {
                                                if (this.logWarn) this.emit('warn', `reserved soc: ${value} out of range`);
                                                setTimeout(() => controlService.updateCharacteristic(Characteristic.Brightness, control.reservedSoc), 250);
                                                return;
                                            }

                                            try {
                                                const tokenValid = await this.checkToken();
                                                if (!tokenValid) {
                                                    setTimeout(() => controlService.updateCharacteristic(Characteristic.Brightness, control.reservedSoc), 250);
                                                    return;
                                                }

                                                await this.envoyData.setEnchargeProfile(profile, value, control.chargeFromGrid);
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
                        if (this.enchargeProfileSensors.length > 0) {
                            if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} Profile Sensor Services`);

                            this.enchargeProfileSensorsServices = [];

                            for (let i = 0; i < this.enchargeProfileSensors.length; i++) {
                                const sensor = this.enchargeProfileSensors[i];
                                const { namePrefix, name, serviceType, characteristicType } = sensor;
                                const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                                const service = accessory.addService(serviceType, serviceName, `enchargeProfileSensorService${i}`);
                                service.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                service.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                                service.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const currentState = sensor.state;
                                        if (this.logInfo) this.emit('info', `${enchargeName} profile: ${name}, state: ${currentState ? 'Active' : 'Not Active'}`);
                                        return currentState;
                                    });

                                this.enchargeProfileSensorsServices.push(service);
                            }
                        }
                    }

                    //grid sensors by relay
                    if (ensemblesRelaySupported) {
                        //encharge grid state sensor
                        if (this.enchargeGridStateSensor.displayType > 0) {
                            if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} Grid State Sensor Service`);

                            const sensor = this.enchargeGridStateSensor;
                            const { namePrefix, name, serviceType, characteristicType } = sensor;
                            const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                            const sensorService = accessory.addService(serviceType, serviceName, 'enchargeGridStateSensorService');
                            sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);
                            sensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const currentState = sensor.state;
                                    if (this.logInfo) this.emit('info', `${enchargeName}, grid state sensor: ${serviceName}, state: ${currentState ? 'Grid ON' : 'Grid Off'}`);
                                    return currentState;
                                });

                            this.enchargeGridStateSensorService = sensorService;
                        }

                        //encharge grid mode sensor services
                        if (this.enchargeGridModeSensors.length > 0) {
                            if (this.logDebug) this.emit('debug', `Prepare ${enchargeName} Grid Mode Sensor Services`);
                            this.enchargeGridModeSensorServices = [];

                            for (let i = 0; i < this.enchargeGridModeSensors.length; i++) {
                                const sensor = this.enchargeGridModeSensors[i];
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
                    for (const enpower of this.pv.inventoryData.esubs.enpowers) {
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

                        if (gridProfileSupported) characteristics.push({ type: Characteristic.GridProfile, label: 'grid profile', value: enpower.gridProfile });
                        if (enpowersStatusSupported && enpower.status) characteristics.push({ type: Characteristic.CommInterface, label: 'comm interface', value: enpower.status.commInterfaceStr });

                        for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                            if (!this.functions.isValidValue(value)) continue;

                            service.getCharacteristic(type)
                                .onGet(async () => {
                                    const currentValue = value;
                                    if (this.logInfo) this.emit('info', `Enpower: ${serialNumber}, ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                    return currentValue;
                                });
                        }

                        this.enpowerServices.push(service);

                        // Dry Contact Controls
                        if (enpowersDryContactsInstalled && this.enpowerDryContactsControl) {
                            if (this.logDebug) this.emit('debug', `Prepare Enpower ${serialNumber} Dry Contact Control Services`);
                            const enpowerDryContactControlServices = [];

                            enpower.dryContacts.forEach((contact, i) => {
                                const serviceName = contact.settings.loadName;

                                const controlService = accessory.addService(Service.Switch, serviceName, `dryContactControlService${serialNumber}${i}`);
                                controlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                controlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                                controlService.getCharacteristic(Characteristic.On)
                                    .onGet(async () => {
                                        const state = contact.stateBool;
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

                                            await this.envoyData.setDryContactState(contact.settings.id, value);
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
                        if (this.enpowerGridStateControl.displayType > 0) {
                            if (this.logDebug) this.emit('debug', `Prepare Enpower ${serialNumber} Grid State Control Service`);

                            const control = this.enpowerGridStateControl;
                            const { namePrefix, name, serviceType, characteristicType, state } = control;
                            const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                            const controlService = accessory.addService(serviceType, serviceName, `enpowerGridStateControlService${serialNumber}`);
                            controlService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            controlService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                            controlService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const curentState = state;
                                    if (this.logInfo) this.emit('info', `Enpower: ${serialNumber}, dry contact control: ${serviceName}, state: ${curentState ? 'Grid ON' : 'Grid OFF'}`);
                                    return curentState;
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

                                        await this.envoyData.setEnpowerGridState(value);
                                        if (this.logInfo) this.emit('info', `Set Enpower: ${serialNumber}, dry contact control: ${serviceName}, state: ${value ? 'Grid ON' : 'Grid OFF'}`);
                                    } catch (error) {
                                        if (this.logWarn) this.emit('warn', `Set Enpower: ${serialNumber}, dry contact control: ${serviceName}, error: ${error}`);
                                    }
                                });

                            this.enpowerGridStateControlServices.push(controlService);
                        }

                        // Grid state sensor
                        if (this.enpowerGridStateSensor.displayType > 0) {
                            if (this.logDebug) this.emit('debug', `Prepare Enpower ${serialNumber} Grid State Sensor Service`);

                            const sensor = this.enpowerGridStateSensor;
                            const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                            const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                            const sensorService = accessory.addService(serviceType, serviceName, `enpowerGridStateSensorService${serialNumber}`);
                            sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                            sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                            sensorService.getCharacteristic(characteristicType)
                                .onGet(async () => {
                                    const curentState = state;
                                    if (this.logInfo) this.emit('info', `Enpower: ${serialNumber}, grid state sensor: ${serviceName}, state: ${curentState ? 'Grid ON' : 'Grid Off'}`);
                                    return curentState;
                                });

                            this.enpowerGridStateSensorServices.push(sensorService);
                        }

                        // Grid mode sensors
                        if (this.enpowerGridModeSensors.length > 0) {
                            if (this.logDebug) this.emit('debug', `Prepare Enpower ${serialNumber} Grid Mode Sensor Services`);
                            const enpowerGridModeSensorServices = [];

                            for (let i = 0; i < this.enpowerGridModeSensors.length; i++) {
                                const sensor = this.enpowerGridModeSensors[i];
                                const { namePrefix, name, serviceType, characteristicType, state } = sensor;
                                const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

                                const sensorService = accessory.addService(serviceType, serviceName, `enpowerGridModeSensorService${serialNumber}${i}`);
                                sensorService.addOptionalCharacteristic(Characteristic.ConfiguredName);
                                sensorService.setCharacteristic(Characteristic.ConfiguredName, serviceName);

                                sensorService.getCharacteristic(characteristicType)
                                    .onGet(async () => {
                                        const curentState = state;
                                        if (this.logInfo) this.emit('info', `Enpower: ${serialNumber}, grid mode sensor: ${serviceName}, state: ${curentState ? 'Active' : 'Not active'}`);
                                        return curentState;
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

                    for (const collar of this.pv.inventoryData.esubs.collars) {
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
                            if (!this.functions.isValidValue(value)) continue;

                            service.getCharacteristic(type)
                                .onGet(async () => {
                                    const currentValue = value;
                                    if (this.logInfo) this.emit('info', `Collar: ${serialNumber}, ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                    return currentValue;
                                });
                        }

                        this.collarServices.push(service);
                    }
                }

                //c6 combiner controllers
                if (c6CombinerControllersInstalled) {
                    this.c6CombinerControllerServices = [];

                    for (const c6CombinerController of this.pv.inventoryData.esubs.c6CombinerControllers) {
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
                            if (!this.functions.isValidValue(value)) continue;

                            service.getCharacteristic(type)
                                .onGet(async () => {
                                    const currentValue = value;
                                    if (this.logInfo) this.emit('info', `C6 Combiner Controller: ${serialNumber}, ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                    return currentValue;
                                });
                        }

                        this.c6CombinerControllerServices.push(service);
                    }
                }

                //c6 rgms
                if (c6RgmsInstalled) {
                    this.c6RgmServices = [];

                    for (const c6Rgm of this.pv.inventoryData.esubs.c6Rgms) {
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
                            if (!this.functions.isValidValue(value)) continue;

                            service.getCharacteristic(type)
                                .onGet(async () => {
                                    const currentValue = value;
                                    if (this.logInfo) this.emit('info', `C6 Rgm: ${serialNumber}, ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                    return currentValue;
                                });
                        }

                        this.c6RgmServices.push(service);
                    }
                }

                //generator
                if (generatorInstalled) {
                    const generator = this.pv.inventoryData.esubs.generator;
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

                    for (const { type, label, value, unit = '', postfix = '' } of characteristics) {
                        if (!this.functions.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                const currentValue = value;
                                if (this.logInfo) this.emit('info', `Generator: ${generatorType},  ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                return currentValue;
                            });
                    }

                    this.generatorService = service;

                    //state control 
                    if (this.generatorStateControl.displayType > 0) {
                        if (this.logDebug) this.emit('debug', `Prepare Generator ${generatorType} Control Service`);

                        const control = this.generatorStateControl;
                        const { namePrefix, name, serviceType, characteristicType } = control;
                        const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

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

                                    const genMode = value ? 'on' : 'off';
                                    await this.envoyData.setGeneratorMode(genMode);
                                    if (this.logInfo) this.emit('info', `Set Generator: ${generatorType}, state to: ${value ? 'ON' : 'OFF'}`);
                                } catch (error) {
                                    if (this.logWarn) this.emit('warn', `Set Generator: ${generatorType}, state error: ${error}`);
                                }
                            });

                        this.generatorStateControlService = controlService;
                    }

                    //state sensor
                    if (this.generatorStateSensor.displayType > 0) {
                        if (this.logDebug) this.emit('debug', `Prepare Generator ${type} State Sensor Service`);

                        const sensor = this.generatorStateSensor;
                        const { namePrefix, name, serviceType, characteristicType } = sensor;
                        const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

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
                    if (this.generatorModeContols.length > 0) {
                        if (this.logDebug) this.emit('debug', `Prepare Generator ${type} Mode Control Services`);

                        this.generatorModeControlServices = [];

                        for (let i = 0; i < this.generatorModeContols.length; i++) {
                            const control = this.generatorModeContols[i];
                            const { namePrefix, name, serviceType, characteristicType } = control;
                            const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

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
                                        await this.envoyData.setGeneratorMode(genMode);
                                        if (this.logInfo) this.emit('info', `Set Generator: ${type}, mode to: ${genMode}`);
                                    } catch (error) {
                                        if (this.logWarn) this.emit('warn', `Set Generator: ${type}, state error: ${error}`);
                                    }
                                });

                            this.generatorModeControlServices.push(controlService);
                        }
                    }

                    //mode sensors
                    if (this.generatorModeSensors.length > 0) {
                        if (this.logDebug) this.emit('debug', `Prepare Generator ${type} Mode Sensor Services`);

                        this.generatorModeSensorServices = [];

                        for (let i = 0; i < this.generatorModeSensors.length; i++) {
                            const sensor = this.generatorModeSensors[i];
                            const { namePrefix, name, serviceType, characteristicType } = sensor;
                            const serviceName = namePrefix ? `${accessoryName} ${name}` : name;

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
                        if (!this.functions.isValidValue(value)) continue;

                        service.getCharacteristic(type)
                            .onGet(async () => {
                                const currentValue = value;
                                if (this.logInfo) this.emit('info', `Live Data: ${liveDataType}, ${label}: ${unit !== '' ? `${currentValue} ${unit}` : postfix !== '' ? `${postfix}` : `${currentValue}`}`);
                                return currentValue;
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

    // Start
    async start() {
        if (this.logDebug) this.emit('debug', `Start`);

        try {
            // Envoy Data
            this.envoyData = new EnvoyData(this.url, this.device, this.envoyIdFile, this.envoyTokenFile)
                .on('deviceInfo', (feature, info, timeZone) => {
                    this.feature = Object.assign(this.feature, feature);
                    this.pv.info = info;

                    if (this.logDebug) this.emit('debug', `Requesting device info`);
                    if (this.logSuccess) this.emit('success', `Connect Success`);

                    // Device basic info
                    this.emit('devInfo', `-------- ${this.name} --------`);
                    this.emit('devInfo', `Manufacturer: Enphase`);
                    this.emit('devInfo', `Model: ${info.modelName}`);
                    this.emit('devInfo', `Firmware: ${info.software}`);
                    this.emit('devInfo', `SerialNr: ${info.serialNumber}`);
                    this.emit('devInfo', `Time: ${this.functions.formatTimestamp(info.time, timeZone)}`);
                    this.emit('devInfo', `------------------------------`);

                    // Inventory
                    let hasInventoryInfo = false;
                    if (feature.inventory.nsrbs.installed) {
                        this.emit('devInfo', `Q-Relays: ${feature.inventory.nsrbs.count}`);
                        hasInventoryInfo = true;
                    }
                    if (feature.inventory.pcus.installed) {
                        this.emit('devInfo', `Inverters: ${feature.inventory.pcus.count}`);
                        hasInventoryInfo = true;
                    }
                    if (feature.inventory.acbs.installed) {
                        this.emit('devInfo', `AC Battery: ${feature.inventory.acbs.count}`);
                        hasInventoryInfo = true;
                    }
                    if (feature.home.wirelessConnections.installed) {
                        this.emit('devInfo', `Wireless Kit: ${feature.home.wirelessConnections.count}`);
                        hasInventoryInfo = true;
                    }
                    if (hasInventoryInfo) {
                        this.emit('devInfo', `--------------------------------`);
                    }

                    // Meters
                    if (feature.meters.supported) {
                        this.emit('devInfo', `Meters: Yes`);

                        if (feature.meters.production.supported) this.emit('devInfo', `Production: ${feature.meters.production.enabled ? 'Enabled' : 'Disabled'}`);
                        if (feature.meters.consumptionNet.supported) this.emit('devInfo', `Consumption Net: ${feature.meters.consumptionNet.enabled ? 'Enabled' : 'Disabled'}`);
                        if (feature.meters.consumptionTotal.supported) this.emit('devInfo', `Consumption Total: ${feature.meters.consumptionTotal.enabled ? 'Enabled' : 'Disabled'}`);
                        if (feature.meters.storage.supported) this.emit('devInfo', `Storage: ${feature.meters.storage.enabled ? 'Enabled' : 'Disabled'}`);
                        if (feature.meters.backfeed.supported) this.emit('devInfo', `Back Feed: ${feature.meters.backfeed.enabled ? 'Enabled' : 'Disabled'}`);
                        if (feature.meters.load.supported) this.emit('devInfo', `Load: ${feature.meters.load.enabled ? 'Enabled' : 'Disabled'}`);
                        if (feature.meters.evse.supported) this.emit('devInfo', `EV Charger: ${feature.meters.evse.enabled ? 'Enabled' : 'Disabled'}`);
                        if (feature.meters.pv3p.supported) this.emit('devInfo', `PV 3P: ${feature.meters.pv3p.enabled ? 'Enabled' : 'Disabled'}`);
                        if (feature.meters.generator.supported) this.emit('devInfo', `Generator: ${feature.meters.generator.enabled ? 'Enabled' : 'Disabled'}`);

                        this.emit('devInfo', `--------------------------------`);
                    }

                    // Ensemble
                    const ensemble = feature.inventory.esubs;
                    const hasEnsembleInfo = ensemble.enpowers.installed || ensemble.encharges.installed || ensemble.enpowers.dryContacts.installed || ensemble.generator.installed;
                    if (hasEnsembleInfo) {
                        this.emit('devInfo', `Ensemble: Yes`);

                        if (ensemble.enpowers.installed) this.emit('devInfo', `Enpowers: ${ensemble.enpowers.count}`);
                        if (ensemble.enpowers.dryContacts.installed) this.emit('devInfo', `Dry Contacts: ${ensemble.enpowers.dryContacts.count}`);
                        if (ensemble.encharges.installed) this.emit('devInfo', `IQ Battery: ${ensemble.encharges.count}`);
                        if (ensemble.collars.installed) this.emit('devInfo', `IQ Meter Collar: ${ensemble.collars.count}`);
                        if (ensemble.c6CombinerControllers.installed) this.emit('devInfo', `IQ Combiner Controller C6: ${ensemble.c6CombinerControllers.count}`);
                        if (ensemble.c6Rgms.installed) this.emit('devInfo', `IQ Rgm C6: ${ensemble.c6Rgms.count}`);
                        if (ensemble.generator.installed) this.emit('devInfo', `Generator: Yes`);

                        this.emit('devInfo', `--------------------------------`);
                    }
                })
                .on('updateDataSampling', (state) => {
                    if (this.logDebug) this.emit('debug', `Update data sampling`);
                    this.pv.dataSampling = state;
                    this.dataSamplingControl.state = state;
                    this.dataSamplingSensor.state = state;
                    this.envoyService?.updateCharacteristic(Characteristic.DataSampling, state);
                    this.dataSamplingControlService?.updateCharacteristic(this.dataSamplingControl.characteristicType, state);
                    this.dataSamplingSensorService?.updateCharacteristic(this.dataSamplingSensor.characteristicType, state);
                })
                .on('updatePlcLevelCheck', (state) => {
                    if (this.logDebug) this.emit('debug', `Update plc level check`);
                    this.pv.plcLevelCheck = state;
                    this.plcLevelCheckControl.state = state;
                    this.envoyService?.updateCharacteristic(Characteristic.PlcLevelCheck, state);
                    this.plcLevelCheckControlService?.updateCharacteristic(this.plcLevelCheckControl.characteristicType, state);
                })
                .on('updateProductionState', (state) => {
                    if (this.logDebug) this.emit('debug', `Update production state`);
                    this.pv.productionState = state;
                    this.productionStateSensor.state = state;
                    this.envoyService?.updateCharacteristic(Characteristic.ProductionState, state);
                    this.productionStateSensorService?.updateCharacteristic(this.productionStateSensor.characteristicType, state);
                })
                .on('updateHomeData', async (home) => {
                    if (this.logDebug) this.emit('debug', 'Update home data');

                    try {
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
                            signalStrength: this.functions.scaleValue(iface.signal_strength, 0, 5, 0, 100),
                            signalStrengthMax: this.functions.scaleValue(iface.signal_strength_max, 0, 5, 0, 100),
                            supported: iface.type === 'wifi' ? iface.supported : null,
                            present: iface.type === 'wifi' ? iface.present : null,
                            configured: iface.type === 'wifi' ? iface.configured : null,
                            status: iface.type === 'wifi' ? ApiCodes[iface.status] : null
                        }));

                        // Process encharges (synchronous)
                        const encharges = commEncharges.map(encharge => ({
                            num: encharge.num,
                            level: this.functions.scaleValue(encharge.level, 0, 5, 0, 100),
                            level24g: this.functions.scaleValue(encharge.level_24g, 0, 5, 0, 100),
                            levelSubg: this.functions.scaleValue(encharge.level_subg, 0, 5, 0, 100)
                        }));

                        // Process wireless connection kits (synchronous)
                        const wirelessKits = wirelessConnections.map(kit => ({
                            signalStrength: this.functions.scaleValue(kit.signal_strength, 0, 5, 0, 100),
                            signalStrengthMax: this.functions.scaleValue(kit.signal_strength_max, 0, 5, 0, 100),
                            type: ApiCodes[kit.type] ?? kit.type,
                            connected: !!kit.connected
                        }));

                        // Await async getStatus call
                        const deviceStatus = await this.functions.getStatus(home.alerts);

                        const obj = {
                            softwareBuildEpoch: home.software_build_epoch,
                            isEnvoy: !home.is_nonvoy,
                            dbSize: home.db_size,
                            dbPercentFull: home.db_percent_full,
                            timeZone: home.timezone,
                            currentDate: home.current_date,
                            currentTime: home.current_time,
                            currentDateTime: this.functions.formatTimestamp(undefined, home.timezone),
                            tariff: ApiCodes[home.tariff],
                            alerts: deviceStatus,
                            updateStatus: ApiCodes[home.update_status] ?? home.update_status,
                            network: {
                                webComm: !!network.web_comm,
                                everReportedToEnlighten: !!network.ever_reported_to_enlighten,
                                lastEnlightenReporDate: this.functions.formatTimestamp(network.last_enlighten_report_time, home.timezone),
                                primaryInterface: ApiCodes[network.primary_interface] ?? network.primary_interface,
                                interfaces
                            },
                            comm: {
                                num: comm.num,
                                level: this.functions.scaleValue(comm.level, 0, 5, 0, 100),
                                pcuNum: comm.pcu?.num,
                                pcuLevel: this.functions.scaleValue(comm.pcu?.level, 0, 5, 0, 100),
                                acbNum: comm.acb?.num,
                                acbLevel: this.functions.scaleValue(comm.acb?.level, 0, 5, 0, 100),
                                nsrbNum: comm.nsrb?.num,
                                nsrbLevel: this.functions.scaleValue(comm.nsrb?.level, 0, 5, 0, 100),
                                esubNum: commEnsemble.num,
                                esubLevel: this.functions.scaleValue(commEnsemble.level, 0, 5, 0, 100),
                                encharges
                            },
                            wirelessKits,
                            gridProfile: home.gridProfile
                        };

                        this.pv.homeData = obj;

                        // Create characteristics
                        const characteristics = [
                            { type: Characteristic.Alerts, value: obj.alerts },
                            { type: Characteristic.TimeZone, value: obj.timeZone },
                            { type: Characteristic.CurrentDateTime, value: obj.currentDateTime },
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

                        if (this.feature.inventory.nsrbs.installed) characteristics.push({ type: Characteristic.CommNumNsrbAndLevel, value: `${obj.comm.nsrbNum} / ${obj.comm.nsrbLevel} %` });
                        if (this.feature.inventory.acbs.installed) characteristics.push({ type: Characteristic.CommNumAcbAndLevel, value: `${obj.comm.acbNum} / ${obj.comm.acbLevel} %` });
                        if (this.feature.inventory.esubs.encharges.installed) characteristics.push({ type: Characteristic.CommNumEnchgAndLevel, value: `${obj.comm.encharges[0].num} / ${obj.comm.encharges[0].level} %` });
                        if (this.feature.gridProfile.supported) characteristics.push({ type: Characteristic.GridProfile, value: obj.gridProfile });

                        // Update envoy services
                        for (const { type, value } of characteristics) {
                            if (!this.functions.isValidValue(value)) continue;
                            this.envoyService?.updateCharacteristic(type, value);
                        }

                        // Wireless connection characteristics
                        if (this.feature.home.wirelessConnections.installed) {
                            home.wirelessKits?.forEach((kit, index) => {
                                if (!kit) return;

                                // Create characteristics
                                const characteristics1 = [
                                    { type: Characteristic.SignalStrength, value: kit.signalStrength },
                                    { type: Characteristic.SignalStrengthMax, value: kit.signalStrengthMax },
                                    { type: Characteristic.Type, value: kit.type },
                                    { type: Characteristic.Connected, value: kit.connected },
                                ];

                                // Update envoy services
                                for (const { type, value } of characteristics1) {
                                    if (!this.functions.isValidValue(value)) continue;
                                    this.wirelessConnectionsKitServices?.[index]?.updateCharacteristic(type, value);
                                }
                            });
                        }

                        // RESTFul and MQTT update
                        if (this.restFulConnected) this.restFul1.update('homedata', this.pv.homeData);
                        if (this.mqttConnected) this.mqtt1.emit('publish', 'Home Data', this.pv.homeData);
                    } catch (error) {
                        throw new Error(`Update home data error: ${error.message || error}`);
                    }
                })
                .on('updateMetersData', async (meters) => {
                    if (this.logDebug) this.emit('debug', 'Update meters data');

                    try {
                        // Process meters in parallel for async calls
                        const updatedMeters = await Promise.all(meters.map(async (meter, index) => {
                            if (!meter) return null;

                            // Await device status
                            const type = ApiCodes[meter.type] ?? meter.type;
                            const measurementType = ApiCodes[meter.measurementType];
                            const deviceStatus = await this.functions.getStatus(meter.statusFlags);

                            const meterData = {
                                type,
                                eid: meter.eid,
                                activeCount: meter.activeCount,
                                measurementType,
                                readingTime: this.functions.formatTimestamp(meter.readingTime, this.pv.homeData.timeZone),
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
                                    voltage: meter.voltage,
                                    pwrFactor: meter.pwrFactor,
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

                                if (measurementType !== 'Consumption Total') characteristics.push({ type: Characteristic.EnergyLifetimeUpload, value: meterData.energyLifetimeUploadKw });
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
                                if (!this.functions.isValidValue(value)) continue;
                                this.meterServices?.[index]?.updateCharacteristic(type, value);
                            }

                            return meterData;
                        }));

                        // Filter out any nulls from skipped meters and update inventory
                        this.pv.metersData = updatedMeters.filter(Boolean);

                        // RESTFul and MQTT update
                        if (this.restFulConnected) this.restFul1.update('metersdata', this.pv.metersData);
                        if (this.mqttConnected) this.mqtt1.emit('publish', 'Meters Data', this.pv.metersData);
                    } catch (error) {
                        throw new Error(`Update meters data error: ${error.message || error}`);
                    }
                })
                .on('updatePcusData', async (pcus) => {
                    if (this.logDebug) this.emit('debug', 'Update pcus data');

                    try {
                        const pcusStatusDataSupported = this.feature.inventory.pcus.status.supported ?? false;
                        const pcusDetailedDataSupported = this.feature.inventory.pcus.detailedData.supported ?? false;
                        const updatedPcus = await Promise.all(pcus.map(async (pcu, index) => {
                            if (!pcu) return null;

                            // Await async getStatus call
                            const type = ApiCodes[pcu.type] ?? pcu.type;
                            const deviceStatus = await this.functions.getStatus(pcu.deviceStatus);
                            const deviceControl = pcu.deviceControl[0]?.gficlearset ? 'Yes' : 'No';

                            // Base PCU data object
                            const pcuData = {
                                type,
                                readingTime: this.functions.formatTimestamp(pcu.readingTime, this.pv.homeData.timeZone),
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
                                if (!this.functions.isValidValue(value)) continue;
                                this.pcuServices?.[index]?.updateCharacteristic(type, value);
                            }

                            return pcuData;
                        }));

                        // Remove null entries from the array
                        this.pv.inventoryData.pcus = updatedPcus.filter(Boolean);

                        // Update RESTful and MQTT if connected
                        if (this.restFulConnected) this.restFul1.update('microinvertersdata', this.pv.inventoryData.pcus);
                        if (this.mqttConnected) this.mqtt1.emit('publish', 'Microinverters Data', this.pv.inventoryData.pcus);
                    } catch (error) {
                        throw new Error(`Update pcus data error: ${error.message || error}`);
                    }
                })
                .on('updateNsrbsData', async (nsrbs) => {
                    if (this.logDebug) this.emit('debug', 'Update nsrbs data');

                    try {
                        const nsrbsDetailedDataSupported = this.feature.inventory.nsrbs.detailedData.supported ?? false;
                        const updatedNsrbs = await Promise.all(nsrbs.map(async (nsrb, index) => {
                            if (!nsrb) return null;

                            // Await deviceStatus conversion
                            const type = ApiCodes[nsrb.type] ?? nsrb.type;
                            const deviceStatus = await this.functions.getStatus(nsrb.deviceStatus);
                            const deviceControl = nsrb.deviceControl[0]?.gficlearset ? 'Yes' : 'No';

                            // Base NSRB data object
                            const nsrbData = {
                                type,
                                partNumber: nsrb.partNumber,
                                installed: nsrb.installed,
                                serialNumber: nsrb.serialNumber,
                                deviceStatus,
                                readingTime: this.functions.formatTimestamp(nsrb.readingTime, this.pv.homeData.timeZone),
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
                                relayState: nsrb.relay === 'closed',
                                reasonCode: nsrb.reasonCode,
                                reason: nsrb.reason,
                                linesCount: nsrb.linesCount,
                                line1Connected: nsrb.linesCount >= 1 ? !!nsrb.line1Connected : null,
                                line2Connected: nsrb.linesCount >= 2 ? !!nsrb.line2Connected : null,
                                line3Connected: nsrb.linesCount >= 3 ? !!nsrb.line3Connected : null,
                                gridProfile: nsrb.gridProfile,
                                plcLevel: nsrb.plcLevel,
                            };

                            if (this.logDebug) {
                                this.emit('debug', `Q-Rela state:`, nsrbData.relay);
                                this.emit('debug', `Q-Relay lines:`, nsrbData.linesCount);
                            }

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

                            // Update meters services
                            for (const { type, value } of characteristics) {
                                if (!this.functions.isValidValue(value)) continue;
                                this.nsrbServices?.[index]?.updateCharacteristic(type, value);
                            }

                            // Update relay state sensors if configured
                            if (this.qRelayStateSensor.displayType > 0) {
                                const sensor = this.qRelayStateSensor;
                                const { characteristicType, multiphase } = sensor;
                                const sensorCount = multiphase && nsrbData.linesCount > 1 ? nsrbData.linesCount + 1 : 1;

                                for (let i = 0; i < sensorCount; i++) {
                                    let state;
                                    switch (i) {
                                        case 0: state = nsrbData.relayState; break;
                                        case 1: state = nsrbData.line1Connected; break;
                                        case 2: state = nsrbData.line2Connected; break;
                                        case 3: state = nsrbData.line3Connected; break;
                                        default: state = false;
                                    }

                                    // Create characteristics
                                    const characteristics1 = [
                                        { type: characteristicType, value: state, valueKey: `state${i}` }
                                    ];

                                    // Update characteristics
                                    for (const { type, value, valueKey } of characteristics1) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        sensor[valueKey] = value;
                                        this.nsrbStateSensorServices?.[index]?.[i]?.updateCharacteristic(type, value);
                                    };
                                }
                            }

                            return nsrbData;
                        }));

                        // Filter nulls and replace inventory
                        this.pv.inventoryData.nsrbs = updatedNsrbs.filter(Boolean);

                        // RESTFul and MQTT update
                        if (this.restFulConnected) this.restFul1.update('qrelaysdata', this.pv.inventoryData.nsrbs);
                        if (this.mqttConnected) this.mqtt1.emit('publish', 'Q-Relays Data', this.pv.inventoryData.nsrbs);
                    } catch (error) {
                        throw new Error(`Update nsrbs data error: ${error.message || error}`);
                    }
                })
                .on('updateAcbsData', async (acbs) => {
                    if (this.logDebug) this.emit('debug', `Update acbs data`);

                    try {
                        const productionCtSupported = this.feature.productionCt.acbs.supported ?? false;
                        const updatedAcbs = await Promise.all(acbs.map(async (acb, index) => {
                            if (!acb) return null;

                            // Get device status asynchronously
                            const type = ApiCodes[acb.type] ?? acb.type;
                            const deviceStatus = await this.functions.getStatus(acb.deviceStatus);
                            const deviceControl = acb.deviceControl[0]?.gficlearset ? 'Yes' : 'No';

                            // Compose ACB data object
                            const acbData = {
                                type,
                                partNumber: acb.partNumber,
                                installed: acb.installed,
                                serialNumber: acb.serialNumber,
                                deviceStatus,
                                readingTime: this.functions.formatTimestamp(acb.readingTime, this.pv.homeData.timeZone),
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
                            if (this.acBatterieBackupLevelAccessory.displayType > 0) {
                                const accessory = this.acBatterieBackupLevelAccessory;
                                const { minSoc, characteristicType, characteristicType1, characteristicType2 } = accessory;

                                // Create characteristics
                                const characteristics = [
                                    { type: characteristicType, value: acbData.percentFull < minSoc, valueKey: 'state' },
                                    { type: characteristicType1, value: acbData.percentFull, valueKey: 'backupLevel' },
                                    { type: characteristicType2, value: acbData.chargeStateNum, valueKey: 'chargeState' },
                                ];

                                // Update acbs services
                                for (const { type, value, valueKey } of characteristics) {
                                    if (!this.functions.isValidValue(value)) continue;
                                    accessory[valueKey] = value;
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
                                if (!this.functions.isValidValue(value)) continue;
                                this.acbServices?.[index]?.updateCharacteristic(type, value);
                            }

                            // Add summary fields for first ACB if supported
                            if (productionCtSupported && index === 0) {
                                const measurementType = ApiCodes[acb.measurementType];
                                const percentFullSum = this.functions.scaleValue(acb.energySum, 0, acb.activeCount * 1.5, 0, 100);
                                const chargeStateSum = ApiCodes[acb.chargeStatusSum];

                                Object.assign(acbData, {
                                    measurementType,
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
                                const characteristics1 = [
                                    { type: Characteristic.ChargeState, value: chargeStateSum },
                                    { type: Characteristic.Power, value: acbData.powerSumKw },
                                    { type: Characteristic.ActiveCount, value: acbData.activeCount },
                                    { type: Characteristic.ReadingTime, value: acbData.readingTime },
                                ];

                                // Add to ensemble summary characteristics if live data not supported
                                if (!this.feature.liveData.supported || !this.feature.meters.storage.enabled) {
                                    characteristics1.push(
                                        { type: Characteristic.Energy, value: acbData.energySumKw },
                                        { type: Characteristic.PercentFull, value: percentFullSum });
                                }

                                // Update storage summary service
                                for (const { type, value } of characteristics1) {
                                    if (!this.functions.isValidValue(value)) continue;
                                    this.acbSummaryService?.updateCharacteristic(type, value);
                                }

                                // Updatestorage backup summary accessory level and state
                                if (this.acBatterieBackupLevelSummaryAccessory.displayType > 0 && (!this.feature.liveData.supported || !this.feature.meters.storage.enabled)) {

                                    if (this.logInfo) {
                                        this.emit('info', `Acb Data, ${this.acBatterieName}, backup energy: ${acbData.energySumKw} kW`);
                                        this.emit('info', `Acb Data, ${this.acBatterieName}, backup level: ${percentFullSum} %`);
                                    }

                                    const accessory = this.acBatterieBackupLevelSummaryAccessory;
                                    const { minSoc, displayType, characteristicType, characteristicType1 } = accessory;
                                    const isServiceBattery = displayType === 5;
                                    const isAboveMinSoc = percentFullSum > minSoc;
                                    const backupLevel = isAboveMinSoc ? percentFullSum : 0;
                                    const state = isServiceBattery ? !isAboveMinSoc : isAboveMinSoc;

                                    // Create characteristics
                                    const characteristics = [
                                        { type: characteristicType, value: state, valueKey: 'state' },
                                        { type: characteristicType1, value: backupLevel, valueKey: 'backupLevel' },
                                    ];

                                    // Update storage summary services
                                    for (const { type, value, valueKey } of characteristics) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        accessory[valueKey] = value;
                                        this.acbSummaryLevelAndStateService?.updateCharacteristic(type, value);
                                    }
                                }
                            }

                            return acbData;
                        }));

                        // Filter out nulls and update inventory
                        this.pv.inventoryData.acbs = updatedAcbs.filter(Boolean);

                        // Update REST and MQTT endpoints
                        if (this.restFulConnected) this.restFul1.update('acbatterydata', this.pv.inventoryData.acbs);
                        if (this.mqttConnected) this.mqtt1.emit('publish', 'AC Battery Data', this.pv.inventoryData.acbs);
                    } catch (error) {
                        throw new Error(`Update acbs data error: ${error.message || error}`);
                    }
                })
                .on('updatePowerAndEnergyData', (powerAndEnergy, meters) => {
                    if (this.logDebug) this.emit('debug', `Update power and energy data`);

                    try {
                        const powerAndEnergyData = [];
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
                            const powerPeakStored = this.pv.powerAndEnergyData[key].powerPeak;

                            let sourceMeter, sourceEnergy;
                            let power, powerPeak, powerPeakDetected;
                            let energyToday, energyLastSevenDays, energyLifetime, energyLifetimeUpload, energyLifetimeWithOffset;
                            switch (key) {
                                case 'production': {
                                    const sourcePcu = powerAndEnergy[key].pcu;
                                    const sourceEim = powerAndEnergy[key].eim;
                                    sourceMeter = meterEnabled ? meters.find(m => m.measurementType === 'production') : sourcePcu;
                                    sourceEnergy = meterEnabled ? sourceEim : sourcePcu;
                                    power = this.functions.isValidValue(sourceMeter.power) ? sourceMeter.power : null;
                                    powerPeak = this.functions.powerPeak(sourceMeter.power, powerPeakStored);
                                    powerPeakDetected = power > powerPeak;
                                    energyToday = this.functions.isValidValue(sourceEnergy.energyToday) ? sourceEnergy.energyToday : null;
                                    energyLastSevenDays = this.functions.isValidValue(sourceEnergy.energyLastSevenDays) ? sourceEnergy.energyLastSevenDays : null;
                                    energyLifetime = this.functions.isValidValue(sourceMeter.energyLifetime) ? sourceMeter.energyLifetime : null;
                                    energyLifetimeUpload = this.functions.isValidValue(sourceMeter.energyLifetimeUpload) ? sourceMeter.energyLifetimeUpload : null;
                                    energyLifetimeWithOffset = this.functions.isValidValue(sourceMeter.energyLifetime) ? energyLifetime + this.energyProductionLifetimeOffset : null;
                                    break;
                                }
                                case 'consumptionNet': {
                                    sourceMeter = meters.find(m => m.measurementType === 'net-consumption');
                                    sourceEnergy = powerAndEnergy[key];
                                    power = this.functions.isValidValue(sourceMeter.power) ? sourceMeter.power : null;
                                    powerPeak = this.functions.powerPeak(sourceMeter.power, powerPeakStored);
                                    powerPeakDetected = power < 0 ? power < powerPeak : power > powerPeak;
                                    energyToday = this.functions.isValidValue(sourceEnergy.energyToday) ? sourceEnergy.energyToday : null;
                                    energyLastSevenDays = this.functions.isValidValue(sourceEnergy.energyLastSevenDays) ? sourceEnergy.energyLastSevenDays : null;
                                    energyLifetime = this.functions.isValidValue(sourceMeter.energyLifetime) ? sourceMeter.energyLifetime : null;
                                    energyLifetimeUpload = this.functions.isValidValue(sourceMeter.energyLifetimeUpload) ? sourceMeter.energyLifetimeUpload : null;
                                    energyLifetimeWithOffset = this.functions.isValidValue(sourceMeter.energyLifetime) ? energyLifetime + this.energyConsumptionNetLifetimeOffset : null;
                                    break;
                                }
                                case 'consumptionTotal': {
                                    sourceMeter = meters.find(m => m.measurementType === 'total-consumption');
                                    sourceEnergy = powerAndEnergy[key];
                                    power = this.functions.isValidValue(sourceMeter.power) ? sourceMeter.power : null;
                                    powerPeak = this.functions.powerPeak(sourceMeter.power, powerPeakStored);
                                    powerPeakDetected = power > powerPeak;
                                    energyToday = this.functions.isValidValue(sourceEnergy.energyToday) ? sourceEnergy.energyToday : null;
                                    energyLastSevenDays = this.functions.isValidValue(sourceEnergy.energyLastSevenDays) ? sourceEnergy.energyLastSevenDays : null;
                                    energyLifetime = this.functions.isValidValue(sourceMeter.energyLifetime) ? sourceMeter.energyLifetime : null;
                                    energyLifetimeWithOffset = this.functions.isValidValue(sourceMeter.energyLifetime) ? energyLifetime + this.energyConsumptionTotalLifetimeOffset : null;
                                    break;
                                }
                            }
                            if (!sourceMeter) continue;

                            if (this.functions.isValidValue(powerPeak)) this.pv.powerAndEnergyData[key].powerPeak = powerPeak;
                            if (this.logDebug) {
                                this.emit('debug', `${measurementType} data source meter:`, sourceMeter);
                                this.emit('debug', `${measurementType} data source energy:`, sourceEnergy);
                            }

                            const type = ApiCodes[sourceMeter.type] ?? sourceMeter.type;
                            const obj = {
                                type,
                                activeCount: sourceMeter.activeCount,
                                measurementType,
                                readingTime: this.functions.formatTimestamp(sourceMeter.readingTime, this.pv.homeData.timeZone),
                                power,
                                powerKw: power != null ? power / 1000 : null,
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
                                this.emit('info', `Power And Energy, ${measurementType}, power: ${obj.powerKw} kW`);
                                this.emit('info', `Power And Energy, ${measurementType}, energy today: ${obj.energyTodayKw} kWh`);
                                this.emit('info', `Power And Energy, ${measurementType}, energy last seven days: ${obj.energyLastSevenDaysKw} kWh`);
                                this.emit('info', `Power And Energy, ${measurementType}, energy lifetime: ${obj.energyLifetimeKw} kWh`);
                            }

                            // Update system accessory service
                            if (key === 'production' && (!this.feature.liveData.supported || !meterEnabled)) {
                                const powerLevel = this.functions.scaleValue(obj.power, 0, this.powerProductionSummary, 0, 100);
                                const powerState = powerLevel > 0;

                                if (this.logInfo) {
                                    this.emit('info', `Power And Energy, ${measurementType}, power level: ${powerLevel} %`);
                                    this.emit('info', `Power And Energy, ${measurementType}, power state: ${powerState ? 'On' : 'Off'}`);
                                }

                                const accessory = this.systemAccessory;
                                const { characteristicType, characteristicType1 } = accessory;

                                const characteristics1 = [
                                    { type: characteristicType, value: powerState, valueKey: 'state' },
                                    { type: characteristicType1, value: powerLevel, valueKey: 'level' },
                                ];

                                // Update system services
                                for (const { type, value, valueKey } of characteristics1) {
                                    if (!this.functions.isValidValue(value)) continue;
                                    this.emit('debug', `Power And Energy, ${measurementType}, power ${valueKey}: ${value}`);
                                    accessory[valueKey] = value;
                                    this.systemService?.updateCharacteristic(type, value);
                                };
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
                                    this.emit('info', `Power And Energy, ${measurementType}, current: ${obj1.current} A`);
                                    this.emit('info', `Power And Energy, ${measurementType}, voltage: ${obj1.voltage} V`);
                                    this.emit('info', `Power And Energy, ${measurementType}, power factor: ${obj1.pwrFactor} cos φ`);
                                    this.emit('info', `Power And Energy, ${measurementType}, frequency: ${obj1.frequency} Hz`);
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
                                if (meterType !== 'total-consumption') characteristics.push({ type: Characteristic.EnergyLifetimeUpload, value: obj1.energyLifetimeUploadKw });

                                const gridQualitySensorsMap = {
                                    production: [{ sensors: this.gridProductionQualitySensors, services: this.gridProductionQualityActiveSensorServices }],
                                    consumptionNet: [{ sensors: this.gridConsumptionNetQualitySensors, services: this.gridConsumptionNetQualityActiveSensorServices }],
                                    consumptionTotal: [{ sensors: this.gridConsumptionTotalQualitySensors, services: this.gridConsumptionTotalQualityActiveSensorServices }]
                                };

                                if (gridQualitySensorsMap[key]) {
                                    for (const group of gridQualitySensorsMap[key]) {
                                        if (!group.sensors?.length) continue;

                                        for (const [index, sensor] of group.sensors.entries()) {
                                            const compareValue = [obj.current, obj.voltage, obj.frequency, obj.pwrFactor][sensor.compareMode];
                                            if (!this.functions.isValidValue(compareValue)) continue;

                                            const state = this.functions.evaluateCompareMode(compareValue, sensor.compareLevel, sensor.compareMode);
                                            sensor.state = state;
                                            group.services?.[index]?.updateCharacteristic(sensor.characteristicType, state);
                                        }
                                    }
                                }
                            }

                            // Update power and energy services
                            for (const { type, value } of characteristics) {
                                if (!this.functions.isValidValue(value)) continue;
                                this.powerAndEnergyServices?.[index]?.updateCharacteristic(type, value);
                            };

                            // Power and energy level sensors
                            const sensorsMap = {
                                production: [
                                    { sensors: this.powerProductionLevelSensors, services: this.powerProductionLevelSensorServices, value: obj.power, levelKey: 'powerLevel' },
                                    { sensors: this.energyProductionLevelSensors, services: this.energyProductionLevelSensorServices, value: obj.energyToday, levelKey: 'energyLevel' }
                                ],
                                consumptionNet: [
                                    { sensors: this.powerConsumptionNetLevelSensors, services: this.powerConsumptionNetLevelSensorServices, value: obj.power, levelKey: 'powerLevel' },
                                    { sensors: this.energyConsumptionNetLevelSensors, services: this.energyConsumptionNetLevelSensorServices, value: obj.energyToday, levelKey: 'energyLevel' }
                                ],
                                consumptionTotal: [
                                    { sensors: this.powerConsumptionTotalLevelSensors, services: this.powerConsumptionTotalLevelSensorServices, value: obj.power, levelKey: 'powerLevel' },
                                    { sensors: this.energyConsumptionTotalLevelSensors, services: this.energyConsumptionTotalLevelSensorServices, value: obj.energyToday, levelKey: 'energyLevel' }
                                ]
                            };

                            if (sensorsMap[key]) {
                                for (const group of sensorsMap[key]) {
                                    if (!this.functions.isValidValue(group.value) || !group.sensors?.length) continue;

                                    for (const [index, sensor] of group.sensors.entries()) {
                                        const state = this.functions.evaluateCompareMode(group.value, sensor[group.levelKey], sensor.compareMode);
                                        sensor.state = state;
                                        group.services?.[index]?.updateCharacteristic(sensor.characteristicType, state);
                                    }
                                }
                            }

                            powerAndEnergyData.push(obj);
                        }

                        this.pv.powerAndEnergyData.data = powerAndEnergyData.filter(Boolean);
                        this.feature.powerAndEnergy.supported = true;

                        if (this.restFulConnected) this.restFul1.update('powerandenergydata', this.pv.powerAndEnergyData);
                        if (this.mqttConnected) this.mqtt1.emit('publish', 'Power And Energy Data', this.pv.powerAndEnergyData);
                    } catch (error) {
                        throw new Error(`Update power and energy data error: ${error.message || error}`);
                    }
                })
                .on('updateEnsembleData', async (esubs) => {
                    if (this.logDebug) this.emit('debug', `Update ensemble data`);

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

                            const ensembles = esubs.devices ?? [];
                            const updatedEnsembles = await Promise.all(ensembles.map(async (ensemble, index) => {
                                const type = ApiCodes[ensemble.type] ?? ensemble.type;
                                const deviceStatus = await this.functions.getStatus(ensemble.deviceStatus);
                                const deviceControl = ensemble.deviceControl?.[0]?.gficlearset ? 'Yes' : 'No';

                                const ensembleData = {
                                    type,
                                    readingTime: this.functions.formatTimestamp(ensemble.readingTime, this.pv.homeData.timeZone),
                                    partNumber: ensemble.partNumber,
                                    installed: this.functions.formatTimestamp(ensemble.installed, this.pv.homeData.timeZone),
                                    serialNumber: ensemble.serialNumber,
                                    deviceStatus,
                                    adminState: ensemble.adminState,
                                    deviceType: DeviceTypeMap[ensemble.devType] ?? ensemble.devType,
                                    createdDate: this.functions.formatTimestamp(ensemble.createdDate, this.pv.homeData.timeZone),
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
                                        readingTime: this.functions.formatTimestamp(undefined, this.pv.homeData.timeZone),
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

                                // Update characteristics
                                for (const { type, value } of characteristics) {
                                    if (!this.functions.isValidValue(value)) continue;
                                    this.ensembleServices?.[index]?.updateCharacteristic(type, value);
                                }

                                return ensembleData;
                            }));

                            // Update ensemble
                            this.pv.inventoryData.esubs.devices = updatedEnsembles.filter(Boolean);
                        }

                        // Ensemble secctrl
                        if (ensemblesSecCtrlSupported) {
                            if (this.logDebug) this.emit('debug', `Requesting ensembles secctrl data`);

                            // Get encharges installed phases
                            const phaseA = esubs.encharges.phaseA;
                            const phaseB = esubs.encharges.phaseB;
                            const phaseC = esubs.encharges.phaseC;

                            const secctrlData = esubs.secctrl;
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

                            this.pv.inventoryData.esubs.secctrl = secctrl;

                            // Add to ensemble summary characteristics
                            ensembleSummaryCharacteristics.push(
                                { type: Characteristic.EncAggAvailEnergy, value: secctrl.encAggAvailEnergy },
                                { type: Characteristic.ConfiguredBackupSoc, value: secctrl.configuredBackupSoc },
                                { type: Characteristic.AdjustedBackupSoc, value: secctrl.adjustedBackupSoc },
                            );

                            // Add to ensemble summary characteristics if live data not supported
                            if (!this.feature.liveData.supported || !this.feature.meters.storage.enabled) {
                                ensembleSummaryCharacteristics.push(
                                    { type: Characteristic.AggMaxEnergy, value: secctrl.aggMaxEnergyKw },
                                    { type: Characteristic.EncAggBackupEnergy, value: secctrl.encAggBackupEnergy },
                                    { type: Characteristic.AggSoc, value: secctrl.aggSoc },
                                    { type: Characteristic.encAggSoc, value: secctrl.encAggSoc });
                            }

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
                            if (enchargesInstalled && (!this.feature.liveData.supported || !this.feature.meters.storage.enabled)) {

                                if (this.logInfo) {
                                    this.emit('info', `Ensemble Data, ${this.enchargeName}, backup energy: ${secctrl.encAggBackupEnergy} kW`);
                                    this.emit('info', `Ensemble Data, ${this.enchargeName}, backup level: ${secctrl.encAggSoc} %`);
                                }

                                // Update encharges summary accessory
                                if (this.enchargeBackupLevelSummaryAccessory.displayType > 0) {
                                    const accessory = this.enchargeBackupLevelSummaryAccessory;
                                    const { minSoc, displayType, characteristicType, characteristicType1 } = accessory;
                                    const serviceBattery = displayType === 5;
                                    const backupLevel = secctrl.encAggSoc > minSoc ? secctrl.encAggSoc : 0;
                                    const state = serviceBattery ? backupLevel < minSoc : backupLevel > minSoc;

                                    // Create characteristics
                                    const characteristics = [
                                        { type: characteristicType, value: state, valueKey: 'stste' },
                                        { type: characteristicType1, value: backupLevel, valueKey: 'backupLevel' },
                                    ];

                                    // Update storage summary services
                                    for (const { type, value, valueKey } of characteristics) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        accessory[valueKey] = value;
                                        this.enchargeSummaryLevelAndStateService?.updateCharacteristic(type, value);
                                    }
                                }

                                // Update encharge summary backup level sensors
                                if (this.enchargeBackupLevelSummarySensors.length > 0) {
                                    for (let i = 0; i < this.enchargeBackupLevelSummarySensors.length; i++) {
                                        const sensor = this.enchargeBackupLevelSummarySensors[i];
                                        const { backupLevel, compareMode, characteristicType } = sensor;
                                        const state = this.functions.evaluateCompareMode(secctrl.encAggSoc, backupLevel, compareMode);

                                        const characteristics = [
                                            { type: characteristicType, value: state, valueKey: 'state' }
                                        ];

                                        // Update system services
                                        for (const { type, value, valueKey } of characteristics) {
                                            if (!this.functions.isValidValue(value)) continue;
                                            sensor[valueKey] = value;
                                            this.enchargeBackupLevelSensorServices?.[i]?.updateCharacteristic(type, value);
                                        };
                                    }
                                }
                            }
                        }

                        // Ensemble counters
                        if (ensemblesCountersSupported) {
                            if (this.logDebug) this.emit('debug', `Requesting ensembles counters data`);

                            const counterData = esubs.counters;
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
                            this.pv.inventoryData.esubs.counters = counters;

                            // Add to ensemble summary characteristics
                            if (this.functions.isValidValue(counters.restPowerKw)) ensembleSummaryCharacteristics.push({ type: Characteristic.RestPower, value: counters.restPowerKw });
                        }

                        // Ensemble relay
                        if (ensemblesRelaySupported) {
                            if (this.logDebug) this.emit('debug', `Requesting ensembles relay data`);

                            const relayData = esubs.relay;
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
                            this.pv.inventoryData.esubs.relay = relay;

                            // encharge grid state sensor
                            if (this.enchargeGridStateSensor.displayType > 0) {
                                const sensor = this.enchargeGridStateSensor;
                                const { characteristicType } = sensor;
                                const state = relay.enchgGridStateBool;

                                // Create characteristics
                                const characteristics = [
                                    { type: characteristicType, value: state, valueKey: 'state' },
                                ];

                                // Update characteristics
                                for (const { type, value, valueKey } of characteristics) {
                                    if (!this.functions.isValidValue(value)) continue;
                                    sensor[valueKey] = value;
                                    this.enchargeSummaryLevelAndStateService?.updateCharacteristic(type, value);
                                }
                            }

                            // encharge grid mode sensors
                            if (this.enchargeGridModeSensors.length > 0) {
                                for (let i = 0; i < this.enchargeGridModeSensors.length; i++) {
                                    const sensor = this.enchargeGridModeSensors[i];
                                    const { characteristicType } = sensor;
                                    const state = sensor.gridMode === relay.enchgGridMode;

                                    // Create characteristics
                                    const characteristics = [
                                        { type: characteristicType, value: state, valueKey: 'state' },
                                    ];

                                    // Update characteristics
                                    for (const { type, value, valueKey } of characteristics) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        sensor[valueKey] = value;
                                        this.enchargeGridModeSensorServices?.[i]?.updateCharacteristic(type, value);
                                    }
                                }
                            }

                            // solar grid state sensor
                            if (this.solarGridStateSensor.displayType > 0) {
                                const sensor = this.solarGridStateSensor;
                                const { characteristicType } = sensor;
                                const state = relay.solarGridStateBool;

                                // Create characteristics
                                const characteristics = [
                                    { type: characteristicType, value: state, valueKey: 'state' },
                                ];

                                // Update characteristics
                                for (const { type, value, valueKey } of characteristics) {
                                    if (!this.functions.isValidValue(value)) continue;
                                    sensor[valueKey] = value;
                                    this.solarGridStateSensorService?.updateCharacteristic(type, value);
                                }
                            }

                            // solar grid mode sensors
                            if (this.solarGridModeSensors.length > 0) {
                                for (let i = 0; i < this.solarGridModeSensors.length; i++) {
                                    const sensor = this.enchargeGridModeSensors[i];
                                    const { characteristicType } = sensor;
                                    const state = sensor.gridMode === relay.solarGridMode;

                                    // Create characteristics
                                    const characteristics = [
                                        { type: characteristicType, value: state, valueKey: 'state' },
                                    ];

                                    // Update characteristics
                                    for (const { type, value, valueKey } of characteristics) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        sensor[valueKey] = value;
                                        this.solarGridModeSensorServices?.[i]?.updateCharacteristic(type, value);
                                    }
                                }
                            }
                        }

                        // Encharges
                        if (enchargesInstalled) {
                            if (this.logDebug) this.emit('debug', `Requesting encharges data`);
                            const encharges = esubs.encharges ?? {};

                            // Add encharges installed phases
                            this.pv.inventoryData.esubs.encharges.phaseA = encharges.phaseA;
                            this.pv.inventoryData.esubs.encharges.phaseB = encharges.phaseB;
                            this.pv.inventoryData.esubs.encharges.phaseC = encharges.phaseC;

                            const enchargesDevices = encharges.devices ?? [];
                            const updatedEncharges = await Promise.all(enchargesDevices.map(async (encharge, index) => {
                                const type = ApiCodes[encharge.type] ?? encharge.type;
                                const chargeState = await this.functions.getStatus(encharge.chargeState);

                                const enchargeData = {
                                    type,
                                    partNumber: PartNumbers[encharge.partNumber] ?? encharge.partNumber,
                                    serialNumber: encharge.serialNumber,
                                    installed: this.functions.formatTimestamp(encharge.installed, this.pv.homeData.timeZone),
                                    chargeState,
                                    chargeStateNum: encharge.chargeState === 'discharging' ? 0 : encharge.chargeState === 'charging' ? 1 : 2,
                                    readingTime: this.functions.formatTimestamp(encharge.readingTime, this.pv.homeData.timeZone),
                                    adminState: encharge.adminState,
                                    adminStateStr: ApiCodes?.[encharge.adminStateStr] ?? encharge.adminStateStr,
                                    createdDate: this.functions.formatTimestamp(encharge.createdDate, this.pv.homeData.timeZone),
                                    imgLoadDate: this.functions.formatTimestamp(encharge.imgLoadDate, this.pv.homeData.timeZone),
                                    imgPnumRunning: encharge.imgPnumRunning,
                                    bmuFwVersion: encharge.bmuFwVersion,
                                    communicating: !!encharge.communicating,
                                    sleepEnabled: encharge.sleepEnabled,
                                    percentFull: encharge.percentFull,
                                    temperature: encharge.temperature,
                                    maxCellTemp: encharge.maxCellTemp,
                                    reportedEncGridState: ApiCodes[encharge.reportedEncGridState] ?? encharge.reportedEncGridState,
                                    commLevelSubGhz: this.functions.scaleValue(encharge.commLevelSubGhz, 0, 5, 0, 100),
                                    commLevel24Ghz: this.functions.scaleValue(encharge.commLevel24Ghz, 0, 5, 0, 100),
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
                                }

                                // Update encharge backup level accessory characteristics
                                if (this.enchargeBackupLevelAccessory.displayType > 0) {
                                    const accessory = this.enchargeBackupLevelAccessory;
                                    const { minSoc, characteristicType, characteristicType1, characteristicType2 } = accessory;
                                    const state = enchargeData.percentFull < minSoc;

                                    // Create characteristics
                                    const characteristics = [
                                        { type: characteristicType, value: state, valueKey: 'state' },
                                        { type: characteristicType1, value: enchargeData.percentFull, valueKey: 'backupLevel' },
                                        { type: characteristicType2, value: enchargeData.chargeStateNum, valueKey: 'chargeState' },
                                    ];

                                    // Update acbs services
                                    for (const { type, value, valueKey } of characteristics) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        accessory[valueKey] = value;
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

                                if (enchargesStatusSupported && enchargeData.status) characteristics.push({ type: Characteristic.CommInterface, value: enchargeData.status.commInterfaceStr }, { type: Characteristic.RatedPower, value: enchargeData.status.ratedPowerKw });
                                if (enchargesPowerSupported && enchargeData.power) characteristics.push({ type: Characteristic.RealPower, value: enchargeData.power.realPowerKw });
                                if (this.feature.gridProfile.supported) characteristics.push({ type: Characteristic.GridProfile, value: enchargeData.gridProfile });

                                for (const { type, value } of characteristics) {
                                    if (!this.functions.isValidValue(value)) continue;
                                    this.enchargeServices?.[index]?.updateCharacteristic(type, value);
                                };

                                return enchargeData;
                            }));

                            // Filter out nulls and update inventory
                            this.pv.inventoryData.esubs.encharges.devices = updatedEncharges.filter(Boolean);

                            // Add encharges settings
                            if (enchargesSettingsSupported) {
                                if (this.logDebug) this.emit('debug', `Requesting encharges stettings data`);

                                const settingsData = esubs.encharges.settings;
                                const settings = {
                                    enable: !!settingsData.enable,
                                    country: settingsData.country,
                                    currentLimit: settingsData.currentLimit,
                                    perPhase: settingsData.perPhase
                                };
                                this.pv.inventoryData.esubs.encharges.settings = settings;

                                if (this.enchargeStateSensor.displayType > 0) {
                                    const sensor = this.enchargeStateSensor;
                                    const { characteristicType } = sensor;
                                    const state = settings.enable;

                                    // Create characteristics
                                    const characteristics = [
                                        { type: characteristicType, value: state, valueKey: 'state' },
                                    ];

                                    // Update storage summary services
                                    for (const { type, value, valueKey } of characteristics) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        sensor[valueKey] = value;
                                        this.enchargeStateSensorService?.updateCharacteristic(type, value);
                                    }
                                }
                            }

                            // Add encharges tariff
                            if (enchargesTariffSupported) {
                                if (this.logDebug) this.emit('debug', `Requesting encharges tariff data`);

                                const tariffData = esubs.encharges.tariff ?? {};

                                // Info
                                const info = tariffData.tariff ?? {};
                                const tariff = {};
                                tariff.info = {
                                    currencyCode: info.currency.code ?? '',
                                    logger: info.logger ?? '',
                                    date: this.functions.formatTimestamp(info.date, this.pv.homeData.timeZone),
                                };

                                // Storage Settings
                                const s = info.storage_settings ?? {};
                                tariff.storageSettings = {
                                    mode: s.mode,
                                    operationModeSubType: s.operation_mode_sub_type ?? '',
                                    reservedSoc: s.reserved_soc,
                                    veryLowSoc: s.very_low_soc,
                                    chargeFromGrid: !!s.charge_from_grid,
                                    date: this.functions.formatTimestamp(s.date, this.pv.homeData.timeZone),
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
                                    date: this.functions.formatTimestamp(sched.date, this.pv.homeData.timeZone),
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
                                for (let i = 0; i < this.enchargeProfileControls.length; i++) {
                                    const accessory = this.enchargeProfileControls[i];
                                    const { characteristicType } = accessory;
                                    const profile = control.profile === tariff.storageSettings.mode;
                                    const chargeFromGrid = control.chargeFromGrid === tariff.storageSettings.chargeFromGrid;
                                    const state = profile && chargeFromGrid;

                                    // Create characteristics
                                    const characteristics = [
                                        { type: characteristicType, value: state, valueKey: 'state' },
                                    ];

                                    if (accessory.profile !== 'backup') {
                                        characteristics.push({ type: Characteristic.Brightness, value: tariff.storageSettings.reservedSoc, valueKey: 'reservedSoc' });
                                    }

                                    // Update storage summary services
                                    for (const { type, value, valueKey } of characteristics) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        accessory[valueKey] = value;
                                        this.enchargeProfileControlsServices?.[i]?.updateCharacteristic(type, value);
                                    }
                                }

                                // Encharge profile sensors update
                                for (let i = 0; i < this.enchargeProfileSensors.length; i++) {
                                    const sensor = this.enchargeProfileSensors[i];
                                    const { characteristicType } = sensor;
                                    const state = tariff.storageSettings.mode === sensor.profile;

                                    // Create characteristics
                                    const characteristics = [
                                        { type: characteristicType, value: state, valueKey: 'state' },
                                    ];

                                    // Update storage summary services
                                    for (const { type, value, valueKey } of characteristics) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        sensor[valueKey] = value;
                                        this.enchargeProfileSensorsServices?.[i]?.updateCharacteristic(type, value);
                                    }
                                }

                                // Save updated tariff
                                this.pv.inventoryData.esubs.encharges.tariff = tariff;
                            }

                            // Add rated power summary in kW
                            if (enchargesStatusSupported && this.functions.isValidValue(encharges.ratedPowerSumKw)) {
                                this.pv.inventoryData.esubs.encharges.ratedPowerSumKw = encharges.ratedPowerSumKw;

                                // Add to ensemble summary characteristics
                                ensembleSummaryCharacteristics.push({ type: Characteristic.RatedPower, value: encharges.ratedPowerSumKw });
                            }

                            // Add real power summary in kW
                            if (enchargesPowerSupported && this.functions.isValidValue(encharges.realPowerSumKw)) {
                                this.pv.inventoryData.esubs.encharges.realPowerSumKw = encharges.realPowerSumKw;

                                // Add to ensemble summary characteristics
                                ensembleSummaryCharacteristics.push({ type: Characteristic.RealPower, value: encharges.realPowerSumKw });
                            }
                        }

                        // Update ensemble summary service
                        for (const { type, value } of ensembleSummaryCharacteristics) {
                            if (!this.functions.isValidValue(value)) continue;
                            this.ensembleSummaryService?.updateCharacteristic(type, value);
                        };

                        // Enpowers
                        if (enpowersInstalled) {
                            if (this.logDebug) this.emit('debug', `Requesting enpowers data`);

                            const enpowers = esubs.enpowers ?? [];
                            const updatedEnpowers = await Promise.all(enpowers.map(async (enpower, index) => {

                                // Get device status asynchronously
                                const type = ApiCodes[enpower.type] ?? enpower.type;
                                const deviceStatus = await this.functions.getStatus(enpower.deviceStatus);

                                const enpowerData = {
                                    type,
                                    partNumber: PartNumbers?.[enpower.partNumber] ?? enpower.partNumber,
                                    serialNumber: enpower.serialNumber,
                                    installed: this.functions.formatTimestamp(enpower.installed, this.pv.homeData.timeZone),
                                    deviceStatus,
                                    readingTime: this.functions.formatTimestamp(enpower.readingTime, this.pv.homeData.timeZone),
                                    adminState: enpower.adminState,
                                    adminStateStr: ApiCodes?.[enpower.adminStateStr] ?? enpower.adminStateStr,
                                    createdDate: this.functions.formatTimestamp(enpower.createdDate, this.pv.homeData.timeZone),
                                    imgLoadDate: this.functions.formatTimestamp(enpower.imgLoadDate, this.pv.homeData.timeZone),
                                    imgPnumRunning: enpower.imgPnumRunning,
                                    communicating: !!enpower.communicating,
                                    temperature: enpower.temperature,
                                    commLevelSubGhz: this.functions.scaleValue(enpower.commLevelSubGhz, 0, 5, 0, 100),
                                    commLevel24Ghz: this.functions.scaleValue(enpower.commLevel24Ghz, 0, 5, 0, 100),
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

                                        this.pv.inventoryData.esubs.dryContacts[i] = dryContactData;
                                    });
                                }

                                // Create envoy characteristics
                                const characteristics = [
                                    { type: Characteristic.EnpowerGridState, value: enpowerData.mainsAdminStateBool },
                                    { type: Characteristic.EnpowerGridMode, value: enpowerData.enpwrGridModeTranslated },
                                ];

                                // Update storage summary services
                                for (const { type, value } of characteristics) {
                                    if (!this.functions.isValidValue(value)) continue;
                                    this.envoyService?.updateCharacteristic(type, value);
                                }

                                // Create characteristics
                                const characteristics1 = [
                                    { type: Characteristic.AdminState, value: enpowerData.adminStateStr },
                                    { type: Characteristic.Communicating, value: enpowerData.communicating },
                                    { type: Characteristic.CommLevelSubGhz, value: enpowerData.commLevelSubGhz },
                                    { type: Characteristic.CommLevel24Ghz, value: enpowerData.commLevel24Ghz },
                                    { type: Characteristic.Temperature, value: enpowerData.temperature },
                                    { type: Characteristic.GridMode, value: enpowerData.enpwrGridModeTranslated },
                                    { type: Characteristic.EnchgGridMode, value: enpowerData.enchgGridModeTranslated },
                                    { type: Characteristic.ReadingTime, value: enpowerData.readingTime }
                                ];

                                if (enpowersStatusSupported && enpowerData.status) characteristics.push({ type: Characteristic.CommInterface, value: enpowerData.status.commInterfaceStr });
                                if (this.feature.gridProfile.supported && enpowerData.gridProfile) characteristics.push({ type: Characteristic.GridProfile, value: enpowerData.gridProfile });

                                // Update characteristics
                                for (const { type, value } of characteristics1) {
                                    if (!this.functions.isValidValue(value)) continue;
                                    this.enpowerServices?.[index]?.updateCharacteristic(type, value);
                                }

                                // Update enpower grid control
                                if (this.enpowerGridStateControl.displayType > 0) {
                                    const accessory = this.enpowerGridStateControl;
                                    const { characteristicType } = accessory;
                                    const state = enpowerData.mainsAdminStateBool;

                                    // Create characteristics
                                    const characteristics = [
                                        { type: characteristicType, value: state, valueKey: 'state' },
                                    ];

                                    // Update characteristics
                                    for (const { type, value, valueKey } of characteristics) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        accessory[valueKey] = value;
                                        this.enpowerGridStateControlServices?.[index]?.updateCharacteristic(type, value);
                                    }
                                }

                                // Update enpower grid state sensor
                                if (this.enpowerGridStateSensor.displayType > 0) {
                                    const sensor = this.enpowerGridStateSensor;
                                    const { characteristicType } = sensor;
                                    const state = enpowerData.enpwrGridStateBool;

                                    // Create characteristics
                                    const characteristics = [
                                        { type: characteristicType, value: state, valueKey: 'state' },
                                    ];

                                    // Update characteristics
                                    for (const { type, value, valueKey } of characteristics) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        sensor[valueKey] = value;
                                        this.enpowerGridStateSensorServices?.[index]?.updateCharacteristic(type, value);
                                    }
                                }

                                // Update enpower grid mode sensors
                                for (let i = 0; i < (this.enpowerGridModeSensors?.length ?? 0); i++) {
                                    const sensor = this.enpowerGridModeSensors[i];
                                    const { characteristicType } = sensor;
                                    const state = sensor.gridMode === enpowerData.enpwrGridMode;

                                    // Create characteristics
                                    const characteristics = [
                                        { type: characteristicType, value: state, valueKey: 'state' },
                                    ];

                                    // Update characteristics
                                    for (const { type, value, valueKey } of characteristics) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        sensor[valueKey] = value;
                                        this.enpowerGridModeSensorServices?.[index]?.[i]?.updateCharacteristic(type, value);
                                    }
                                }

                                return enpowerData;
                            }));

                            // Filter out nulls and update inventory
                            this.pv.inventoryData.esubs.enpowers = updatedEnpowers.filter(Boolean);
                        }

                        // IQ Meter Collars
                        if (collarsInstalled) {
                            if (this.logDebug) this.emit('debug', `Requesting collars data`);

                            const collars = esubs.collars ?? [];
                            const updatedCollars = await Promise.all(collars.map(async (collar, index) => {
                                const deviceStatus = await this.functions.getStatus(collar.deviceStatus);

                                const updatedCollarsData = {
                                    type: collar.type,
                                    partNumber: collar.partNumber,
                                    serialNumber: collar.serialNumber,
                                    installed: this.functions.formatTimestamp(collar.installed, this.pv.homeData.timeZone),
                                    deviceStatus,
                                    readingTime: this.functions.formatTimestamp(collar.readingTime, this.pv.homeData.timeZone),
                                    adminState: collar.adminState,
                                    adminStateStr: ApiCodes[collar.adminStateStr] ?? collar.adminStateStr,
                                    createdDate: this.functions.formatTimestamp(collar.createdDate, this.pv.homeData.timeZone),
                                    imgLoadDate: this.functions.formatTimestamp(collar.imgLoadDate, this.pv.homeData.timeZone),
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
                                    if (!this.functions.isValidValue(value)) continue;
                                    this.collarServices?.[index]?.updateCharacteristic(type, value);
                                }

                                return updatedCollarsData;
                            }));

                            // Update collars
                            this.pv.inventoryData.esubs.collars = updatedCollars.filter(Boolean);
                        }

                        // IQ C6 Combiner Controllers
                        if (c6CombinerControllersInstalled) {
                            if (this.logDebug) this.emit('debug', `Requesting c6 combiners data`);

                            const c6CombinerControllers = esubs.c6CombinerControllers ?? [];
                            const updatedC6CombinerControllers = await Promise.all(c6CombinerControllers.map(async (c6CombinerController, index) => {

                                const updatedC6CombinerControllersData = {
                                    type: c6CombinerController.type,
                                    partNumber: c6CombinerController.partNumber,
                                    serialNumber: c6CombinerController.serialNumber,
                                    installed: this.functions.formatTimestamp(c6CombinerController.installed, this.pv.homeData.timeZone),
                                    readingTime: this.functions.formatTimestamp(c6CombinerController.readingTime, this.pv.homeData.timeZone),
                                    adminState: c6CombinerController.adminState,
                                    adminStateStr: ApiCodes[c6CombinerController.adminStateStr] ?? c6CombinerController.adminStateStr,
                                    createdDate: this.functions.formatTimestamp(c6CombinerController.createdDate, this.pv.homeData.timeZone),
                                    imgLoadDate: this.functions.formatTimestamp(c6CombinerController.imgLoadDate, this.pv.homeData.timeZone),
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
                                    if (!this.functions.isValidValue(value)) continue;
                                    this.c6CombinerControllerServices?.[index]?.updateCharacteristic(type, value);
                                }

                                return updatedC6CombinerControllersData;
                            }));

                            // Update c6 combiner controllers
                            this.pv.inventoryData.esubs.c6CombinerControllers = updatedC6CombinerControllers.filter(Boolean);
                        }

                        // IQ C6 Rgm
                        if (c6RgmsInstalled) {
                            if (this.logDebug) this.emit('debug', `Requesting c6 rgms data`);

                            const c6Rgms = esubs.c6Rgms ?? [];
                            const updatedC6Rgms = await Promise.all(c6Rgms.map(async (c6Rgm, index) => {

                                const updatedC6RgmsData = {
                                    type: c6Rgm.type,
                                    partNumber: c6Rgm.partNumber,
                                    serialNumber: c6Rgm.serialNumber,
                                    installed: this.functions.formatTimestamp(c6Rgm.installed, this.pv.homeData.timeZone),
                                    readingTime: this.functions.formatTimestamp(undefined, this.pv.homeData.timeZone),
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
                                    if (!this.functions.isValidValue(value)) continue;
                                    this.c6RgmServices?.[index]?.updateCharacteristic(type, value);
                                }

                                return updatedC6RgmsData;
                            }));

                            // Update C6 rgms
                            this.pv.inventoryData.esubs.c6Rgms = updatedC6Rgms.filter(Boolean);
                        }

                        // Generators
                        if (generatorInstalled) {
                            if (this.logDebug) this.emit('debug', `Requesting generator`);

                            const generator = esubs.generator ?? {};
                            const adminModeMap = ['Off', 'On', 'Auto'];
                            const rawAdminMode = generator.adminMode;
                            const adminMode = typeof rawAdminMode === 'number' ? adminModeMap[rawAdminMode] ?? rawAdminMode.toString() : rawAdminMode;
                            const adminModeBool = adminMode !== 'Off';
                            const type = ApiCodes[generator.type] ?? generator.type;

                            const generatorData = {
                                type,
                                readingTime: this.functions.formatTimestamp(undefined, this.pv.homeData.timeZone),
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
                                const characteristics = [
                                    { type: Characteristic.GeneratorState, value: adminModeBool },
                                    { type: Characteristic.GeneratorMode, value: generatorData.adminMode },
                                ];

                                // Update characteristics
                                for (const { type, value } of characteristics) {
                                    if (!this.functions.isValidValue(value)) continue;
                                    this.envoyService?.updateCharacteristic(type, value);
                                }

                                // Create characteristics
                                const characteristics1 = [
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

                                // Update characteristics
                                for (const { type, value } of characteristics1) {
                                    if (!this.functions.isValidValue(value)) continue;
                                    this.generatorService?.updateCharacteristic(type, value);
                                }

                                // Update generator admin mode ON/OFF control
                                if (this.generatorStateControl.displayType > 0) {
                                    const accessory = this.generatorStateControl;
                                    const { characteristicType } = accessory;
                                    const state = generatorData.adminModeBool;

                                    // Create characteristics
                                    const characteristics2 = [
                                        { type: characteristicType, value: state, valueKey: 'state' },
                                    ];

                                    // Update characteristics
                                    for (const { type, value, valueKey } of characteristics2) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        accessory[valueKey] = value;
                                        this.generatorStateControlService?.updateCharacteristic(type, value);
                                    }
                                }

                                // Update generator admin mode ON/OFF sensor
                                if (this.generatorStateSensor.displayType > 0) {
                                    const sensor = this.generatorStateSensor;
                                    const { characteristicType } = sensor;
                                    const state = generatorData.adminModeBool;

                                    // Create characteristics
                                    const characteristics2 = [
                                        { type: characteristicType, value: state, valueKey: 'state' },
                                    ];

                                    // Update characteristics
                                    for (const { type, value, valueKey } of characteristics2) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        sensor[valueKey] = value;
                                        this.generatorStateSensorService?.updateCharacteristic(type, value);
                                    }
                                }

                                // Update generator mode toggle controls
                                for (let i = 0; i < (this.generatorModeContols?.length ?? 0); i++) {
                                    const accessory = this.generatorModeContols[i];
                                    const { mode, characteristicType } = accessory;
                                    const state = mode === generatorData.adminMode;

                                    // Create characteristics
                                    const characteristics2 = [
                                        { type: characteristicType, value: state, valueKey: 'state' },
                                    ];

                                    // Update characteristics
                                    for (const { type, value, valueKey } of characteristics2) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        accessory[valueKey] = value;
                                        this.generatorModeControlServices?.[i]?.updateCharacteristic(type, value);
                                    }
                                }

                                // Update generator mode sensors
                                for (let i = 0; i < (this.generatorModeSensors?.length ?? 0); i++) {
                                    const sensor = this.generatorModeSensors[i];
                                    const { mode, characteristicType } = sensor;
                                    const state = mode === generatorData.adminMode;

                                    // Create characteristics
                                    const characteristics2 = [
                                        { type: characteristicType, value: state, valueKey: 'state' },
                                    ];

                                    // Update characteristics
                                    for (const { type, value, valueKey } of characteristics2) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        sensor[valueKey] = value;
                                        this.generatorModeSensorServices?.[i]?.updateCharacteristic(type, value);
                                    }
                                }
                            }

                            // Save processed generator data
                            this.pv.inventoryData.esubs.generator = generatorData;
                        }

                        // Update REST and MQTT endpoints
                        if (this.restFulConnected) this.restFul1.update('ensembledata', this.pv.inventoryData.esubs);
                        if (this.mqttConnected) this.mqtt1.emit('publish', 'Ensemble Data', this.pv.inventoryData.esubs);
                    } catch (error) {
                        throw new Error(`Update ensemble data error: ${error.message || error}`);
                    }
                })
                .on('updateLiveData', (liveData) => {
                    if (this.logDebug) this.emit('debug', `Update live data`);

                    try {
                        liveData.devices = [];
                        const percentFullSum = liveData.meters.soc; // encharges + acbs
                        const percentFullSumEnc = liveData.meters.encAggSoc; // encharges
                        const energySumEncKw = liveData.meters.encAggEnergyKw; // encharges energy kW
                        const percentFullSumAcb = liveData.meters.acbAggSoc; // acbs
                        const energySumAcbKw = liveData.meters.ecbEnergyKw; // acbs energy kW
                        const energySumKw = energySumEncKw + percentFullSumAcb; // encharges + acbs energy kW

                        // Decide which devices get to join the party
                        const activeDevices = [];
                        if (this.feature.meters.production.enabled) activeDevices.push({ type: 'Production', meter: liveData.meters.pv });
                        if (this.feature.meters.consumptionNet.enabled) activeDevices.push({ type: 'Consumption Net', meter: liveData.meters.grid });
                        if (this.feature.meters.consumptionTotal.enabled) activeDevices.push({ type: 'Consumption Total', meter: liveData.meters.load });
                        if (this.feature.meters.storage.enabled || this.feature.inventory.esubs.encharges.installed) activeDevices.push({ type: 'Storage', meter: liveData.meters.storage });
                        if (this.feature.meters.generator.enabled) activeDevices.push({ type: 'Generator', meter: liveData.meters.generator });
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
                            const storagePhaseANotSupported = type === 'Storage' && !liveData.meters.phaseA;
                            const storagePhaseBNotSupported = type === 'Storage' && !liveData.meters.phaseB;
                            const storagePhaseCNotSupported = type === 'Storage' && !liveData.meters.phaseC;
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

                            // Update system accessory
                            if (type === 'Production' && deviceData.power) {
                                const powerLevel = this.functions.scaleValue(deviceData.power, 0, this.powerProductionSummary, 0, 100);
                                const powerState = powerLevel > 0;

                                if (this.logInfo) {
                                    this.emit('info', `Live Data, ${type}, power: ${deviceData.powerKw} kW`);
                                    this.emit('info', `Live Data, ${type}, power level: ${powerLevel} %`);
                                    this.emit('info', `Live Data, ${type}, power state: ${powerState ? 'On' : 'Off'}`);
                                }

                                // Update system accessory
                                const accessory = this.systemAccessory;
                                const { characteristicType, characteristicType1 } = accessory;

                                // Create characteristics
                                const characteristics = [
                                    { type: characteristicType, value: powerState, valueKey: 'state' },
                                    { type: characteristicType1, value: powerLevel, valueKey: 'level' },
                                ];

                                // Update system services
                                for (const { type, value, valueKey } of characteristics) {
                                    if (!this.functions.isValidValue(value)) continue;
                                    accessory[valueKey] = value;
                                    this.systemService?.updateCharacteristic(type, value);
                                };
                            }

                            // Update storage
                            if (type === 'Storage') {

                                // Update ensemble summary service
                                if (this.feature.inventory.esubs.secctrl.supported) {

                                    // Agg Energy and Soc
                                    const characteristics = [
                                        { type: Characteristic.AggMaxEnergy, value: energySumKw, valueKey: 'aggMaxEnergyKw' },
                                        { type: Characteristic.AggSoc, value: percentFullSum, valueKey: 'aggSoc' },
                                    ];

                                    // Update storage summary services
                                    for (const { type, value, valueKey } of characteristics) {
                                        if (!this.functions.isValidValue(value)) continue;
                                        this.pv.inventoryData.esubs.secctrl[valueKey] = value;
                                        this.ensembleSummaryService?.updateCharacteristic(type, value);
                                    }
                                }

                                // Update acbs summary
                                if (this.feature.inventory.acbs.installed) {

                                    if (this.logInfo) {
                                        this.emit('info', `Live Data, ${this.acBatterieName}, backup energy: ${energySumAcbKw} kW`);
                                        this.emit('info', `Live Data, ${this.acBatterieName}, backup level: ${percentFullSumAcb} %`);
                                    }

                                    // Update acbs summary service
                                    if (this.feature.inventory.esubs.secctrl.supported) {
                                        const characteristics = [
                                            { type: Characteristic.Energy, value: energySumAcbKw, valueKey: 'energySumAcbKw' },
                                            { type: Characteristic.PercentFull, value: percentFullSumAcb, valueKey: 'percentFullSumAcb' },
                                        ];

                                        // Update storage summary services
                                        for (const { type, value, valueKey } of characteristics) {
                                            if (!this.functions.isValidValue(value)) continue;
                                            this.pv.inventoryData.acbs[0][valueKey] = value;
                                            this.acbSummaryService?.[0]?.updateCharacteristic(type, value);
                                        }
                                    }

                                    // Update acbs summary accessory
                                    if (this.acBatterieBackupLevelSummaryAccessory.displayType > 0) {
                                        const accessory = this.acBatterieBackupLevelSummaryAccessory;
                                        const { minSoc, displayType, characteristicType, characteristicType1 } = accessory;
                                        const isServiceBattery = displayType === 5;
                                        const isAboveMinSoc = percentFullSumAcb > minSoc;
                                        const backupLevel = isAboveMinSoc ? percentFullSumAcb : 0;
                                        const state = isServiceBattery ? !isAboveMinSoc : isAboveMinSoc;

                                        // Create characteristics
                                        const characteristics = [
                                            { type: characteristicType, value: state, valueKey: 'state' },
                                            { type: characteristicType1, value: backupLevel, valueKey: 'backupLevel' },
                                        ];

                                        // Update storage summary services
                                        for (const { type, value, valueKey } of characteristics) {
                                            if (!this.functions.isValidValue(value)) continue;
                                            accessory[valueKey] = value;
                                            this.acbSummaryLevelAndStateService?.updateCharacteristic(type, value);
                                        }
                                    }
                                }

                                // Update encharges summary
                                if (this.feature.inventory.esubs.encharges.installed) {

                                    if (this.logInfo) {
                                        this.emit('info', `Live Data, ${this.enchargeName}, backup energy: ${energySumEncKw} kW`);
                                        this.emit('info', `Live Data, ${this.enchargeName}, backup level: ${percentFullSumEnc} %`);
                                    }

                                    // Update ensemble summary service
                                    if (this.feature.inventory.esubs.secctrl.supported) {
                                        const characteristics = [
                                            { type: Characteristic.EncAggBackupEnergy, value: energySumEncKw, valueKey: 'encAggBackupEnergy' },
                                            { type: Characteristic.EncAggSoc, value: percentFullSumEnc, valueKey: 'encAggSoc' },
                                        ];

                                        // Update storage summary services
                                        for (const { type, value, valueKey } of characteristics) {
                                            if (!this.functions.isValidValue(value)) continue;
                                            this.pv.inventoryData.esubs.secctrl[valueKey] = value;
                                            this.ensembleSummaryService?.updateCharacteristic(type, value);
                                        }
                                    }

                                    // Update encharges summary accessory
                                    if (this.enchargeBackupLevelSummaryAccessory.displayType > 0) {
                                        const accessory = this.enchargeBackupLevelSummaryAccessory;
                                        const { minSoc, displayType, characteristicType, characteristicType1 } = accessory;
                                        const serviceBattery = displayType === 5;
                                        const backupLevel = percentFullSumEnc > minSoc ? percentFullSumEnc : 0;
                                        const state = serviceBattery ? backupLevel < minSoc : backupLevel > minSoc;

                                        // Create characteristics
                                        const characteristics = [
                                            { type: characteristicType, value: state, valueKey: 'stste' },
                                            { type: characteristicType1, value: backupLevel, valueKey: 'backupLevel' },
                                        ];

                                        // Update storage summary services
                                        for (const { type, value, valueKey } of characteristics) {
                                            if (!this.functions.isValidValue(value)) continue;
                                            accessory[valueKey] = value;
                                            this.enchargeSummaryLevelAndStateService?.updateCharacteristic(type, value);
                                        }
                                    }

                                    // Update encharges summary backup level sensors
                                    if (this.enchargeBackupLevelSummarySensors.length > 0) {
                                        for (let i = 0; i < this.enchargeBackupLevelSummarySensors.length; i++) {
                                            const sensor = this.enchargeBackupLevelSummarySensors[i];
                                            const { backupLevel, compareMode, characteristicType } = sensor;
                                            const state = this.functions.evaluateCompareMode(percentFullSumEnc, backupLevel, compareMode);

                                            const characteristics = [
                                                { type: characteristicType, value: state, valueKey: 'state' }
                                            ];

                                            // Update system services
                                            for (const { type, value, valueKey } of characteristics) {
                                                if (!this.functions.isValidValue(value)) continue;
                                                sensor[valueKey] = value;
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
                                if (!this.functions.isValidValue(value)) continue;
                                this.liveDataServices?.[index]?.updateCharacteristic(type, value);
                            };

                            // Update power level sensors services
                            const key = MetersKeyMap[type];
                            const sensorsMap = {
                                production: [{ sensors: this.powerProductionLevelSensors, services: this.powerProductionLevelSensorServices, value: deviceData.power, levelKey: 'powerLevel' }],
                                consumptionNet: [{ sensors: this.powerConsumptionNetLevelSensors, services: this.powerConsumptionNetLevelSensorServices, value: deviceData.power, levelKey: 'powerLevel' }],
                                consumptionTotal: [{ sensors: this.powerConsumptionTotalLevelSensors, services: this.powerConsumptionTotalLevelSensorServices, value: deviceData.power, levelKey: 'powerLevel' }]
                            };

                            if (sensorsMap[key]) {
                                for (const group of sensorsMap[key]) {
                                    if (!this.functions.isValidValue(group.value) || !group.sensors?.length) continue;

                                    for (const [index, sensor] of group.sensors.entries()) {
                                        const state = this.functions.evaluateCompareMode(group.value, sensor[group.levelKey], sensor.compareMode);
                                        sensor.state = state;
                                        group.services?.[index]?.updateCharacteristic(sensor.characteristicType, state);
                                    }
                                }
                            }
                        }

                        this.pv.liveData = liveData;

                        if (this.restFulConnected) this.restFul1.update('livedatadata', liveData);
                        if (this.mqttConnected) this.mqtt1.emit('publish', 'Live Data Data', liveData);
                    } catch (error) {
                        throw new Error(`Update live data error: ${error}`);
                    }
                })
                .on('success', (success) => this.emit('success', success))
                .on('info', (info) => this.emit('info', info))
                .on('debug', (msg, data) => this.emit('debug', msg, data))
                .on('warn', (warn) => this.emit('warn', warn))
                .on('error', (error) => this.emit('error', error))
                .on('restFul', (path, data) => {
                    if (this.restFulConnected) this.restFul1.update(path, data);
                })
                .on('mqtt', (topic, message) => {
                    if (this.mqttConnected) this.mqtt1.emit('publish', topic, message);
                });

            // Get basic PV info
            const connect = await this.envoyData.connect();
            if (!connect) return null;

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
