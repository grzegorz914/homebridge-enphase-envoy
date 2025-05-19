export default (api) => {
    const { Service, Characteristic, Units, Formats, Perms } = api.hap;

    //Envoy
    class EnphaseEnvoyAlerts extends Characteristic {
        constructor() {
            super('Alerts', '00000001-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyAlerts = EnphaseEnvoyAlerts;

    class EnphaseEnvoyGridProfile extends Characteristic {
        constructor() {
            super('Grid profile', '00000002-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyGridProfile = EnphaseEnvoyGridProfile;

    class EnphaseEnvoyPrimaryInterface extends Characteristic {
        constructor() {
            super('Network interface', '00000011-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyPrimaryInterface = EnphaseEnvoyPrimaryInterface;

    class EnphaseEnvoyNetworkWebComm extends Characteristic {
        constructor() {
            super('Web communication', '00000012-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyNetworkWebComm = EnphaseEnvoyNetworkWebComm;


    class EnphaseEnvoyEverReportedToEnlighten extends Characteristic {
        constructor() {
            super('Report to Enlighten', '00000013-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyEverReportedToEnlighten = EnphaseEnvoyEverReportedToEnlighten;

    class EnphaseEnvoyCommNumAndLevel extends Characteristic {
        constructor() {
            super('Devices / Level', '00000014-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyCommNumAndLevel = EnphaseEnvoyCommNumAndLevel;

    class EnphaseEnvoyCommNumNsrbAndLevel extends Characteristic {
        constructor() {
            super('Q-Relays / Level', '00000015-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyCommNumNsrbAndLevel = EnphaseEnvoyCommNumNsrbAndLevel;

    class EnphaseEnvoyCommNumPcuAndLevel extends Characteristic {
        constructor() {
            super('Microinverters / Level', '00000016-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyCommNumPcuAndLevel = EnphaseEnvoyCommNumPcuAndLevel;

    class EnphaseEnvoyCommNumAcbAndLevel extends Characteristic {
        constructor() {
            super('AC Batteries / Level', '00000017-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyCommNumAcbAndLevel = EnphaseEnvoyCommNumAcbAndLevel;

    class EnphaseEnvoyCommNumEnchgAndLevel extends Characteristic {
        constructor() {
            super('Encharges / Level', '00000018-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyCommNumEnchgAndLevel = EnphaseEnvoyCommNumEnchgAndLevel;

    class EnphaseEnvoyDbSize extends Characteristic {
        constructor() {
            super('DB size', '00000019-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyDbSize = EnphaseEnvoyDbSize;

    class EnphaseEnvoyTariff extends Characteristic {
        constructor() {
            super('Tariff', '00000021-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyTariff = EnphaseEnvoyTariff;

    class EnphaseEnvoyFirmware extends Characteristic {
        constructor() {
            super('Firmware', '00000022-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyFirmware = EnphaseEnvoyFirmware;

    class EnphaseEnvoyUpdateStatus extends Characteristic {
        constructor() {
            super('Update status', '00000023-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyUpdateStatus = EnphaseEnvoyUpdateStatus;

    class EnphaseEnvoyTimeZone extends Characteristic {
        constructor() {
            super('Time Zone', '00000024-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyTimeZone = EnphaseEnvoyTimeZone;

    class EnphaseEnvoyCurrentDateTime extends Characteristic {
        constructor() {
            super('Local time', '00000025-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyCurrentDateTime = EnphaseEnvoyCurrentDateTime;

    class EnphaseEnvoyLastEnlightenReporDate extends Characteristic {
        constructor() {
            super('Last report to Enlighten', '00000026-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyLastEnlightenReporDate = EnphaseEnvoyLastEnlightenReporDate;

    class EnphaseEnvoyEnpowerGridState extends Characteristic {
        constructor() {
            super('Enpower grid state', '00000027-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyEnpowerGridState = EnphaseEnvoyEnpowerGridState;

    class EnphaseEnvoyEnpowerGridMode extends Characteristic {
        constructor() {
            super('Enpower grid mode', '00000028-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyEnpowerGridMode = EnphaseEnvoyEnpowerGridMode;

    class EnphaseEnvoyGeneratorState extends Characteristic {
        constructor() {
            super('Generator state', '00000301-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyGeneratorState = EnphaseEnvoyGeneratorState;

    class EnphaseEnvoyGeneratorMode extends Characteristic {
        constructor() {
            super('Generator mode', '00000302-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyGeneratorMode = EnphaseEnvoyGeneratorMode;


    class EnphaseEnvoyCheckCommLevel extends Characteristic {
        constructor() {
            super('Plc level check', '00000029-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyCheckCommLevel = EnphaseEnvoyCheckCommLevel;

    class EnphaseEnvoyProductionPowerMode extends Characteristic {
        constructor() {
            super('Production state', '00000030-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyProductionPowerMode = EnphaseEnvoyProductionPowerMode;

    class EnphaseEnvoyDataRefresh extends Characteristic {
        constructor() {
            super('Data sampling', '00000300-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnvoyDataRefresh = EnphaseEnvoyDataRefresh;

    //power production service
    class EnphaseEnvoyService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000001-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnphaseEnvoyAlerts);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyGridProfile);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyPrimaryInterface);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyNetworkWebComm);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyEverReportedToEnlighten);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyCommNumAndLevel);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyCommNumNsrbAndLevel);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyCommNumPcuAndLevel);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyCommNumAcbAndLevel);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyCommNumEnchgAndLevel);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyDbSize);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyTariff);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyFirmware);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyUpdateStatus);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyTimeZone);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyCurrentDateTime);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyLastEnlightenReporDate);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyEnpowerGridState);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyEnpowerGridMode);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyGeneratorState);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyGeneratorMode);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyCheckCommLevel);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyProductionPowerMode);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnvoyDataRefresh);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnphaseEnvoyService = EnphaseEnvoyService;

    //Q-Relay
    class EnphaseQrelayState extends Characteristic {
        constructor() {
            super('Relay', '00000031-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseQrelayState = EnphaseQrelayState;

    class EnphaseQrelayLinesCount extends Characteristic {
        constructor() {
            super('Lines', '00000032-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseQrelayLinesCount = EnphaseQrelayLinesCount;

    class EnphaseQrelayLine1Connected extends Characteristic {
        constructor() {
            super('Line 1', '00000033-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseQrelayLine1Connected = EnphaseQrelayLine1Connected;

    class EnphaseQrelayLine2Connected extends Characteristic {
        constructor() {
            super('Line 2', '00000034-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseQrelayLine2Connected = EnphaseQrelayLine2Connected;

    class EnphaseQrelayLine3Connected extends Characteristic {
        constructor() {
            super('Line 3', '00000035-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseQrelayLine3Connected = EnphaseQrelayLine3Connected;

    class EnphaseQrelayProducing extends Characteristic {
        constructor() {
            super('Producing', '00000036-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseQrelayProducing = EnphaseQrelayProducing;

    class EnphaseQrelayCommunicating extends Characteristic {
        constructor() {
            super('Communicating', '00000037-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseQrelayCommunicating = EnphaseQrelayCommunicating;

    class EnphaseQrelayProvisioned extends Characteristic {
        constructor() {
            super('Provisioned', '00000038-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseQrelayProvisioned = EnphaseQrelayProvisioned;

    class EnphaseQrelayOperating extends Characteristic {
        constructor() {
            super('Operating', '00000039-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseQrelayOperating = EnphaseQrelayOperating;

    class EnphaseQrelayCommLevel extends Characteristic {
        constructor() {
            super('PLC level', '00000041-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseQrelayCommLevel = EnphaseQrelayCommLevel;

    class EnphaseQrelayStatus extends Characteristic {
        constructor() {
            super('Status', '00000042-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseQrelayStatus = EnphaseQrelayStatus;

    class EnphaseQrelayFirmware extends Characteristic {
        constructor() {
            super('Firmware', '00000043-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseQrelayFirmware = EnphaseQrelayFirmware;

    class EnphaseQrelayLastReportDate extends Characteristic {
        constructor() {
            super('Last report', '00000044-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseQrelayLastReportDate = EnphaseQrelayLastReportDate;

    class EnphaseQrelayGridProfile extends Characteristic {
        constructor() {
            super('Grid profile', '00000045-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseQrelayGridProfile = EnphaseQrelayGridProfile;

    //qrelay service
    class EnphaseQrelayService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000002-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnphaseQrelayState);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnphaseQrelayLinesCount);
            this.addOptionalCharacteristic(Characteristic.EnphaseQrelayLine1Connected);
            this.addOptionalCharacteristic(Characteristic.EnphaseQrelayLine2Connected);
            this.addOptionalCharacteristic(Characteristic.EnphaseQrelayLine3Connected);
            this.addOptionalCharacteristic(Characteristic.EnphaseQrelayProducing);
            this.addOptionalCharacteristic(Characteristic.EnphaseQrelayCommunicating);
            this.addOptionalCharacteristic(Characteristic.EnphaseQrelayProvisioned);
            this.addOptionalCharacteristic(Characteristic.EnphaseQrelayOperating);
            this.addOptionalCharacteristic(Characteristic.EnphaseQrelayCommLevel);
            this.addOptionalCharacteristic(Characteristic.EnphaseQrelayStatus);
            this.addOptionalCharacteristic(Characteristic.EnphaseQrelayFirmware);
            this.addOptionalCharacteristic(Characteristic.EnphaseQrelayLastReportDate);
            this.addOptionalCharacteristic(Characteristic.EnphaseQrelayGridProfile);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnphaseQrelayService = EnphaseQrelayService;

    //Enphase current meters
    class EnphaseMeterState extends Characteristic {
        constructor() {
            super('State', '00000051-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMeterState = EnphaseMeterState;

    class EnphaseMeterMeasurementType extends Characteristic {
        constructor() {
            super('Meter type', '00000052-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMeterMeasurementType = EnphaseMeterMeasurementType;

    class EnphaseMeterPhaseCount extends Characteristic {
        constructor() {
            super('Phase count', '00000053-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMeterPhaseCount = EnphaseMeterPhaseCount;

    class EnphaseMeterPhaseMode extends Characteristic {
        constructor() {
            super('Phase mode', '00000054-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMeterPhaseMode = EnphaseMeterPhaseMode;

    class EnphaseMeterMeteringStatus extends Characteristic {
        constructor() {
            super('Metering status', '00000055-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMeterMeteringStatus = EnphaseMeterMeteringStatus;

    class EnphaseMeterStatusFlags extends Characteristic {
        constructor() {
            super('Status flag', '00000056-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMeterStatusFlags = EnphaseMeterStatusFlags;

    class EnphaseMeterActivePower extends Characteristic {
        constructor() {
            super('Active power', '00000057-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kW',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMeterActivePower = EnphaseMeterActivePower;

    class EnphaseMeterApparentPower extends Characteristic {
        constructor() {
            super('Apparent power', '00000058-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kVA',
                maxValue: 10000,
                minValue: -10000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMeterApparentPower = EnphaseMeterApparentPower;

    class EnphaseMeterReactivePower extends Characteristic {
        constructor() {
            super('Reactive power', '00000059-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kVAr',
                maxValue: 10000,
                minValue: -10000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMeterReactivePower = EnphaseMeterReactivePower;

    class EnphaseMeterPwrFactor extends Characteristic {
        constructor() {
            super('Power factor', '00000061-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'cos φ',
                maxValue: 1,
                minValue: -1,
                minStep: 0.01,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMeterPwrFactor = EnphaseMeterPwrFactor;

    class EnphaseMeterVoltage extends Characteristic {
        constructor() {
            super('Voltage', '00000062-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'V',
                maxValue: 1000,
                minValue: 0,
                minStep: 0.1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMeterVoltage = EnphaseMeterVoltage;

    class EnphaseMeterCurrent extends Characteristic {
        constructor() {
            super('Current', '00000063-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'A',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMeterCurrent = EnphaseMeterCurrent;

    class EnphaseMeterFreq extends Characteristic {
        constructor() {
            super('Frequency', '00000064-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'Hz',
                maxValue: 100,
                minValue: 0,
                minStep: 0.01,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMeterFreq = EnphaseMeterFreq;

    class EnphaseMeterReadingTime extends Characteristic {
        constructor() {
            super('Last report', '00000065-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMeterReadingTime = EnphaseMeterReadingTime;

    //current meters service
    class EnphaseMeterService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000003-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnphaseMeterState);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnphaseMeterPhaseMode);
            this.addOptionalCharacteristic(Characteristic.EnphaseMeterPhaseCount);
            this.addOptionalCharacteristic(Characteristic.EnphaseMeterMeasurementType);
            this.addOptionalCharacteristic(Characteristic.EnphaseMeterMeteringStatus);
            this.addOptionalCharacteristic(Characteristic.EnphaseMeterStatusFlags);
            this.addOptionalCharacteristic(Characteristic.EnphaseMeterActivePower);
            this.addOptionalCharacteristic(Characteristic.EnphaseMeterApparentPower);
            this.addOptionalCharacteristic(Characteristic.EnphaseMeterReactivePower);
            this.addOptionalCharacteristic(Characteristic.EnphaseMeterPwrFactor);
            this.addOptionalCharacteristic(Characteristic.EnphaseMeterVoltage);
            this.addOptionalCharacteristic(Characteristic.EnphaseMeterCurrent);
            this.addOptionalCharacteristic(Characteristic.EnphaseMeterFreq);
            this.addOptionalCharacteristic(Characteristic.EnphaseMeterReadingTime);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnphaseMeterService = EnphaseMeterService;

    //Envoy production/consumption characteristics
    class EnphasePower extends Characteristic {
        constructor() {
            super('Power', '00000071-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kW',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphasePower = EnphasePower;

    class EnphasePowerMax extends Characteristic {
        constructor() {
            super('Power peak', '00000072-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kW',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphasePowerMax = EnphasePowerMax;

    class EnphasePowerMaxDetected extends Characteristic {
        constructor() {
            super('Power peak detected', '00000073-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphasePowerMaxDetected = EnphasePowerMaxDetected;

    class EnphaseEnergyToday extends Characteristic {
        constructor() {
            super('Energy today', '00000074-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kWh',
                maxValue: 100000000,
                minValue: -100000000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnergyToday = EnphaseEnergyToday;

    class EnphaseEnergyLastSevenDays extends Characteristic {
        constructor() {
            super('Energy last 7 days', '00000075-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kWh',
                maxValue: 100000000,
                minValue: -100000000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnergyLastSevenDays = EnphaseEnergyLastSevenDays;

    class EnphaseEnergyLifetime extends Characteristic {
        constructor() {
            super('Energy lifetime', '00000076-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kWh',
                maxValue: 100000000,
                minValue: -100000000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnergyLifetime = EnphaseEnergyLifetime;

    class EnphaseRmsCurrent extends Characteristic {
        constructor() {
            super('Current', '00000077-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'A',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseRmsCurrent = EnphaseRmsCurrent;

    class EnphaseRmsVoltage extends Characteristic {
        constructor() {
            super('Voltage', '00000078-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'V',
                maxValue: 1000,
                minValue: 0,
                minStep: 0.1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseRmsVoltage = EnphaseRmsVoltage;

    class EnphaseReactivePower extends Characteristic {
        constructor() {
            super('Reactive power', '00000079-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kVAr',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseReactivePower = EnphaseReactivePower;

    class EnphaseApparentPower extends Characteristic {
        constructor() {
            super('Apparent power', '00000081-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kVA',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseApparentPower = EnphaseApparentPower;

    class EnphasePwrFactor extends Characteristic {
        constructor() {
            super('Power factor', '00000082-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'cos φ',
                maxValue: 1,
                minValue: -1,
                minStep: 0.01,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphasePwrFactor = EnphasePwrFactor;

    class EnphaseReadingTime extends Characteristic {
        constructor() {
            super('Last report', '00000083-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseReadingTime = EnphaseReadingTime;

    class EnphasePowerMaxReset extends Characteristic {
        constructor() {
            super('Power peak reset', '00000084-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphasePowerMaxReset = EnphasePowerMaxReset;

    class EnphaseFreq extends Characteristic {
        constructor() {
            super('Frequency', '00000085-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'Hz',
                maxValue: 100,
                minValue: 0,
                minStep: 0.01,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseFreq = EnphaseFreq;

    //power production service
    class EnphasePowerAndEnergyService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000004-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnphasePower)
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnphasePowerMax);
            this.addOptionalCharacteristic(Characteristic.EnphasePowerMaxDetected);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnergyToday);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnergyLastSevenDays);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnergyLifetime);
            this.addOptionalCharacteristic(Characteristic.EnphaseRmsCurrent);
            this.addOptionalCharacteristic(Characteristic.EnphaseRmsVoltage);
            this.addOptionalCharacteristic(Characteristic.EnphaseReactivePower);
            this.addOptionalCharacteristic(Characteristic.EnphaseApparentPower);
            this.addOptionalCharacteristic(Characteristic.EnphasePwrFactor);
            this.addOptionalCharacteristic(Characteristic.EnphaseReadingTime);
            this.addOptionalCharacteristic(Characteristic.EnphasePowerMaxReset);
            this.addOptionalCharacteristic(Characteristic.EnphaseFreq);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnphasePowerAndEnergyService = EnphasePowerAndEnergyService;

    //AC Batterie
    class EnphaseAcBatterieSummaryPower extends Characteristic {
        constructor() {
            super('Power', '00000091-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kW',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieSummaryPower = EnphaseAcBatterieSummaryPower;

    class EnphaseAcBatterieSummaryEnergy extends Characteristic {
        constructor() {
            super('Energy', '00000092-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kWh',
                maxValue: 100000000,
                minValue: -100000000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieSummaryEnergy = EnphaseAcBatterieSummaryEnergy;

    class EnphaseAcBatterieSummaryPercentFull extends Characteristic {
        constructor() {
            super('Percent full', '00000093-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieSummaryPercentFull = EnphaseAcBatterieSummaryPercentFull;

    class EnphaseAcBatterieSummaryActiveCount extends Characteristic {
        constructor() {
            super('Devices count', '00000094-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: '',
                maxValue: 255,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieSummaryActiveCount = EnphaseAcBatterieSummaryActiveCount;

    class EnphaseAcBatterieSummaryState extends Characteristic {
        constructor() {
            super('State', '00000095-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieSummaryState = EnphaseAcBatterieSummaryState;

    class EnphaseAcBatterieSummaryReadingTime extends Characteristic {
        constructor() {
            super('Last report', '00000096-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieSummaryReadingTime = EnphaseAcBatterieSummaryReadingTime;

    //AC Batterie summary service
    class EnphaseAcBatterieSummaryService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000005-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnphaseAcBatterieSummaryPower);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieSummaryEnergy);
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieSummaryPercentFull);
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieSummaryActiveCount);
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieSummaryState);
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieSummaryReadingTime);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnphaseAcBatterieSummaryService = EnphaseAcBatterieSummaryService;

    //AC Batterie
    class EnphaseAcBatterieChargeStatus extends Characteristic {
        constructor() {
            super('Charge status', '00000111-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieChargeStatus = EnphaseAcBatterieChargeStatus;

    class EnphaseAcBatterieProducing extends Characteristic {
        constructor() {
            super('Producing', '00000112-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieProducing = EnphaseAcBatterieProducing;

    class EnphaseAcBatterieCommunicating extends Characteristic {
        constructor() {
            super('Communicating', '00000113-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieCommunicating = EnphaseAcBatterieCommunicating;

    class EnphaseAcBatterieProvisioned extends Characteristic {
        constructor() {
            super('Provisioned', '00000114-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieProvisioned = EnphaseAcBatterieProvisioned;

    class EnphaseAcBatterieOperating extends Characteristic {
        constructor() {
            super('Operating', '00000115-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieOperating = EnphaseAcBatterieOperating;

    class EnphaseAcBatterieCommLevel extends Characteristic {
        constructor() {
            super('PLC level', '00000116-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieCommLevel = EnphaseAcBatterieCommLevel;

    class EnphaseAcBatterieSleepEnabled extends Characteristic {
        constructor() {
            super('Sleep enabled', '00000117-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieSleepEnabled = EnphaseAcBatterieSleepEnabled;

    class EnphaseAcBatteriePercentFull extends Characteristic {
        constructor() {
            super('Percent full', '00000118-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatteriePercentFull = EnphaseAcBatteriePercentFull;

    class EnphaseAcBatterieMaxCellTemp extends Characteristic {
        constructor() {
            super('Max cell temp', '00000119-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: '°C',
                maxValue: 200,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieMaxCellTemp = EnphaseAcBatterieMaxCellTemp;

    class EnphaseAcBatterieSleepMinSoc extends Characteristic {
        constructor() {
            super('Sleep min soc', '00000121-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: 'min',
                maxValue: 255,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieSleepMinSoc = EnphaseAcBatterieSleepMinSoc;

    class EnphaseAcBatterieSleepMaxSoc extends Characteristic {
        constructor() {
            super('Sleep max soc', '00000122-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: 'min',
                maxValue: 255,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieSleepMaxSoc = EnphaseAcBatterieSleepMaxSoc;

    class EnphaseAcBatterieStatus extends Characteristic {
        constructor() {
            super('Status', '00000123-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieStatus = EnphaseAcBatterieStatus;

    class EnphaseAcBatterieFirmware extends Characteristic {
        constructor() {
            super('Firmware', '00000124-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieFirmware = EnphaseAcBatterieFirmware;

    class EnphaseAcBatterieLastReportDate extends Characteristic {
        constructor() {
            super('Last report', '00000125-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseAcBatterieLastReportDate = EnphaseAcBatterieLastReportDate;

    //AC Batterie service
    class EnphaseAcBatterieService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000006-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnphaseAcBatterieChargeStatus);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieProducing);
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieCommunicating);
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieProvisioned);
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieOperating);
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieCommLevel);
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieSleepEnabled);
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatteriePercentFull);
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieMaxCellTemp);
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieSleepMinSoc);
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieSleepMaxSoc);
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieStatus);
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieFirmware);
            this.addOptionalCharacteristic(Characteristic.EnphaseAcBatterieLastReportDate);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnphaseAcBatterieService = EnphaseAcBatterieService;

    //Microinverter
    class EnphaseMicroinverterPower extends Characteristic {
        constructor() {
            super('Power', '00000131-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                unit: 'W',
                maxValue: 1000,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMicroinverterPower = EnphaseMicroinverterPower;

    class EnphaseMicroinverterPowerMax extends Characteristic {
        constructor() {
            super('Power peak', '00000132-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                unit: 'W',
                maxValue: 1000,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMicroinverterPowerMax = EnphaseMicroinverterPowerMax;

    class EnphaseMicroinverterProducing extends Characteristic {
        constructor() {
            super('Producing', '00000133-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMicroinverterProducing = EnphaseMicroinverterProducing;

    class EnphaseMicroinverterCommunicating extends Characteristic {
        constructor() {
            super('Communicating', '00000134-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMicroinverterCommunicating = EnphaseMicroinverterCommunicating;

    class EnphaseMicroinverterProvisioned extends Characteristic {
        constructor() {
            super('Provisioned', '00000135-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMicroinverterProvisioned = EnphaseMicroinverterProvisioned;

    class EnphaseMicroinverterOperating extends Characteristic {
        constructor() {
            super('Operating', '00000136-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMicroinverterOperating = EnphaseMicroinverterOperating;

    class EnphaseMicroinverterCommLevel extends Characteristic {
        constructor() {
            super('PLC level', '00000137-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMicroinverterCommLevel = EnphaseMicroinverterCommLevel;

    class EnphaseMicroinverterStatus extends Characteristic {
        constructor() {
            super('Status', '00000138-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMicroinverterStatus = EnphaseMicroinverterStatus;

    class EnphaseMicroinverterFirmware extends Characteristic {
        constructor() {
            super('Firmware', '00000139-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMicroinverterFirmware = EnphaseMicroinverterFirmware;

    class EnphaseMicroinverterLastReportDate extends Characteristic {
        constructor() {
            super('Last report', '00000141-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMicroinverterLastReportDate = EnphaseMicroinverterLastReportDate;

    class EnphaseMicroinverterGridProfile extends Characteristic {
        constructor() {
            super('Grid profile', '00000142-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseMicroinverterGridProfile = EnphaseMicroinverterGridProfile;

    //devices service
    class EnphaseMicroinverterService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000007-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnphaseMicroinverterPower);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnphaseMicroinverterPowerMax);
            this.addOptionalCharacteristic(Characteristic.EnphaseMicroinverterProducing);
            this.addOptionalCharacteristic(Characteristic.EnphaseMicroinverterCommunicating);
            this.addOptionalCharacteristic(Characteristic.EnphaseMicroinverterProvisioned);
            this.addOptionalCharacteristic(Characteristic.EnphaseMicroinverterOperating);
            this.addOptionalCharacteristic(Characteristic.EnphaseMicroinverterCommLevel);
            this.addOptionalCharacteristic(Characteristic.EnphaseMicroinverterStatus);
            this.addOptionalCharacteristic(Characteristic.EnphaseMicroinverterFirmware);
            this.addOptionalCharacteristic(Characteristic.EnphaseMicroinverterLastReportDate);
            this.addOptionalCharacteristic(Characteristic.EnphaseMicroinverterGridProfile);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnphaseMicroinverterService = EnphaseMicroinverterService;

    //Encharge
    class EnphaseEnchargeAdminStateStr extends Characteristic {
        constructor() {
            super('Charge status', '00000151-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeAdminStateStr = EnphaseEnchargeAdminStateStr;

    class EnphaseEnchargeCommunicating extends Characteristic {
        constructor() {
            super('Communicating', '00000152-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeCommunicating = EnphaseEnchargeCommunicating;

    class EnphaseEnchargeOperating extends Characteristic {
        constructor() {
            super('Operating', '00000153-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeOperating = EnphaseEnchargeOperating;

    class EnphaseEnchargeCommLevelSubGhz extends Characteristic {
        constructor() {
            super('Sub GHz level', '00000154-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeCommLevelSubGhz = EnphaseEnchargeCommLevelSubGhz

    class EnphaseEnchargeCommLevel24Ghz extends Characteristic {
        constructor() {
            super('2.4GHz level', '00000155-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeCommLevel24Ghz = EnphaseEnchargeCommLevel24Ghz;

    class EnphaseEnchargeSleepEnabled extends Characteristic {
        constructor() {
            super('Sleep enabled', '00000156-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeSleepEnabled = EnphaseEnchargeSleepEnabled;

    class EnphaseEnchargePercentFull extends Characteristic {
        constructor() {
            super('Percent full', '00000157-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargePercentFull = EnphaseEnchargePercentFull;

    class EnphaseEnchargeTemperature extends Characteristic {
        constructor() {
            super('Temperature', '00000158-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: '°C',
                maxValue: 200,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeTemperature = EnphaseEnchargeTemperature;

    class EnphaseEnchargeMaxCellTemp extends Characteristic {
        constructor() {
            super('Max cell temp', '00000159-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: '°C',
                maxValue: 200,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeMaxCellTemp = EnphaseEnchargeMaxCellTemp;

    class EnphaseEnchargeLedStatus extends Characteristic {
        constructor() {
            super('LED status', '00000161-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeLedStatus = EnphaseEnchargeLedStatus;

    class EnphaseEnchargeRealPowerW extends Characteristic {
        constructor() {
            super('Real power', '00000162-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kW',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeRealPowerW = EnphaseEnchargeRealPowerW;

    class EnphaseEnchargeCapacity extends Characteristic {
        constructor() {
            super('Capacity', '00000163-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kWh',
                maxValue: 100000000,
                minValue: -100000000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeCapacity = EnphaseEnchargeCapacity;

    class EnphaseEnchargeDcSwitchOff extends Characteristic {
        constructor() {
            super('DC switch OFF', '00000164-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeDcSwitchOff = EnphaseEnchargeDcSwitchOff;

    class EnphaseEnchargeRev extends Characteristic {
        constructor() {
            super('Revision', '00000165-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: '',
                maxValue: 255,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeRev = EnphaseEnchargeRev;

    class EnphaseEnchargeGridProfile extends Characteristic {
        constructor() {
            super('Grid profile', '00000166-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeGridProfile = EnphaseEnchargeGridProfile;

    class EnphaseEnchargeStatus extends Characteristic {
        constructor() {
            super('Status', '00000167-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeStatus = EnphaseEnchargeStatus;

    class EnphaseEnchargeLastReportDate extends Characteristic {
        constructor() {
            super('Last report', '00000168-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeLastReportDate = EnphaseEnchargeLastReportDate;

    class EnphaseEnchargeCommLevel extends Characteristic {
        constructor() {
            super('PLC level', '00000169-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnchargeCommLevel = EnphaseEnchargeCommLevel;

    //Encharge service
    class EnphaseEnchargeService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000007-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnphaseEnchargeAdminStateStr);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargeOperating);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargeCommunicating);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargeCommLevelSubGhz);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargeCommLevel24Ghz);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargeSleepEnabled);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargePercentFull);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargeTemperature);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargeMaxCellTemp);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargeLedStatus);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargeRealPowerW);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargeCapacity);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargeDcSwitchOff);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargeRev);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargeGridProfile);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargeStatus);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargeLastReportDate);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnchargeCommLevel);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnphaseEnchargeService = EnphaseEnchargeService;

    //Enpower
    class EnphaseEnpowerAdminStateStr extends Characteristic {
        constructor() {
            super('Charge status', '00000171-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnpowerAdminStateStr = EnphaseEnpowerAdminStateStr;

    class EnphaseEnpowerCommunicating extends Characteristic {
        constructor() {
            super('Communicating', '00000172-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnpowerCommunicating = EnphaseEnpowerCommunicating;

    class EnphaseEnpowerOperating extends Characteristic {
        constructor() {
            super('Operating', '00000173-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnpowerOperating = EnphaseEnpowerOperating;

    class EnphaseEnpowerCommLevelSubGhz extends Characteristic {
        constructor() {
            super('Sub GHz level', '00000174-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnpowerCommLevelSubGhz = EnphaseEnpowerCommLevelSubGhz;

    class EnphaseEnpowerCommLevel24Ghz extends Characteristic {
        constructor() {
            super('2.4GHz level', '00000175-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnpowerCommLevel24Ghz = EnphaseEnpowerCommLevel24Ghz;

    class EnphaseEnpowerTemperature extends Characteristic {
        constructor() {
            super('Temperature', '00000176-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: '°C',
                maxValue: 200,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnpowerTemperature = EnphaseEnpowerTemperature;

    class EnphaseEnpowerMainsAdminState extends Characteristic {
        constructor() {
            super('Admin state', '00000177-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnpowerMainsAdminState = EnphaseEnpowerMainsAdminState;

    class EnphaseEnpowerMainsOperState extends Characteristic {
        constructor() {
            super('Operating state', '00000178-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnpowerMainsOperState = EnphaseEnpowerMainsOperState;

    class EnphaseEnpowerEnpwrGridMode extends Characteristic {
        constructor() {
            super('Grid mode', '00000179-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnpowerEnpwrGridMode = EnphaseEnpowerEnpwrGridMode;

    class EnphaseEnpowerEnchgGridMode extends Characteristic {
        constructor() {
            super('Encharge grid mode', '00000181-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnpowerEnchgGridMode = EnphaseEnpowerEnchgGridMode;

    class EnphaseEnpowerGridProfile extends Characteristic {
        constructor() {
            super('Grid profile', '00000182-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnpowerGridProfile = EnphaseEnpowerGridProfile;

    class EnphaseEnpowerStatus extends Characteristic {
        constructor() {
            super('Status', '00000183-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnpowerStatus = EnphaseEnpowerStatus;

    class EnphaseEnpowerLastReportDate extends Characteristic {
        constructor() {
            super('Last report', '00000184-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnpowerLastReportDate = EnphaseEnpowerLastReportDate;

    //Enpower service
    class EnphaseEnpowerService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000008-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnphaseEnpowerAdminStateStr);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnphaseEnpowerOperating);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnpowerCommunicating);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnpowerCommLevelSubGhz);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnpowerCommLevel24Ghz);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnpowerTemperature);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnpowerMainsAdminState);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnpowerMainsOperState);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnpowerEnpwrGridMode);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnpowerEnchgGridMode);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnpowerGridProfile);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnpowerStatus);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnpowerLastReportDate);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnphaseEnpowerService = EnphaseEnpowerService;

    //Ensemble
    class EnphaseEnsembleRestPower extends Characteristic {
        constructor() {
            super('Rest power', '00000190-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kW',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleRestPower = EnphaseEnsembleRestPower;

    class EnphaseEnsembleFreqBiasHz extends Characteristic {
        constructor() {
            super('Frequency bias L1', '00000191-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'Hz',
                maxValue: 10000,
                minValue: -10000,
                minStep: 0.01,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleFreqBiasHz = EnphaseEnsembleFreqBiasHz;

    class EnphaseEnsembleVoltageBiasV extends Characteristic {
        constructor() {
            super('Voltage bias L1', '00000192-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'V',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleVoltageBiasV = EnphaseEnsembleVoltageBiasV;

    class EnphaseEnsembleFreqBiasHzQ8 extends Characteristic {
        constructor() {
            super('Frequency bias Q8 L1', '00000193-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'Hz',
                maxValue: 10000,
                minValue: -10000,
                minStep: 0.01,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleFreqBiasHzQ8 = EnphaseEnsembleFreqBiasHzQ8;

    class EnphaseEnsembleVoltageBiasVQ5 extends Characteristic {
        constructor() {
            super('Voltage bias Q5 L1', '00000194-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'V',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleVoltageBiasVQ5 = EnphaseEnsembleVoltageBiasVQ5;

    class EnphaseEnsembleFreqBiasHzPhaseB extends Characteristic {
        constructor() {
            super('Frequency bias L2', '00000195-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'Hz',
                maxValue: 10000,
                minValue: -10000,
                minStep: 0.01,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleFreqBiasHzPhaseB = EnphaseEnsembleFreqBiasHzPhaseB;

    class EnphaseEnsembleVoltageBiasVPhaseB extends Characteristic {
        constructor() {
            super('Voltage bias L2', '00000196-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'V',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleVoltageBiasVPhaseB = EnphaseEnsembleVoltageBiasVPhaseB;

    class EnphaseEnsembleFreqBiasHzQ8PhaseB extends Characteristic {
        constructor() {
            super('Frequency bias Q8 L2', '00000197-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'Hz',
                maxValue: 10000,
                minValue: -10000,
                minStep: 0.01,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleFreqBiasHzQ8PhaseB = EnphaseEnsembleFreqBiasHzQ8PhaseB;

    class EnphaseEnsembleVoltageBiasVQ5PhaseB extends Characteristic {
        constructor() {
            super('Voltage bias Q5 L2', '00000198-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'V',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleVoltageBiasVQ5PhaseB = EnphaseEnsembleVoltageBiasVQ5PhaseB;

    class EnphaseEnsembleFreqBiasHzPhaseC extends Characteristic {
        constructor() {
            super('Frequency bias L3', '00000199-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'Hz',
                maxValue: 10000,
                minValue: -10000,
                minStep: 0.01,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleFreqBiasHzPhaseC = EnphaseEnsembleFreqBiasHzPhaseC;

    class EnphaseEnsembleVoltageBiasVPhaseC extends Characteristic {
        constructor() {
            super('Voltage bias L3', '00000200-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'V',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleVoltageBiasVPhaseC = EnphaseEnsembleVoltageBiasVPhaseC;

    class EnphaseEnsembleFreqBiasHzQ8PhaseC extends Characteristic {
        constructor() {
            super('Frequency bias Q8 L3', '00000201-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'Hz',
                maxValue: 10000,
                minValue: -10000,
                minStep: 0.01,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleFreqBiasHzQ8PhaseC = EnphaseEnsembleFreqBiasHzQ8PhaseC;

    class EnphaseEnsembleVoltageBiasVQ5PhaseC extends Characteristic {
        constructor() {
            super('Voltage bias Q5 L3', '00000202-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'V',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleVoltageBiasVQ5PhaseC = EnphaseEnsembleVoltageBiasVQ5PhaseC;

    class EnphaseEnsembleConfiguredBackupSoc extends Characteristic {
        constructor() {
            super('Configured backup SoC', '00000203-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleConfiguredBackupSoc = EnphaseEnsembleConfiguredBackupSoc;

    class EnphaseEnsembleAdjustedBackupSoc extends Characteristic {
        constructor() {
            super('Adjusted backup SoC', '00000204-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleAdjustedBackupSoc = EnphaseEnsembleAdjustedBackupSoc;

    class EnphaseEnsembleAggSoc extends Characteristic {
        constructor() {
            super('AGG SoC', '00000205-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleAggSoc = EnphaseEnsembleAggSoc;

    class EnphaseEnsembleAggMaxEnergy extends Characteristic {
        constructor() {
            super('AGG max energy', '00000206-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kWh',
                maxValue: 100000000,
                minValue: -100000000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleAggMaxEnergy = EnphaseEnsembleAggMaxEnergy;

    class EnphaseEnsembleEncAggSoc extends Characteristic {
        constructor() {
            super('ENC SoC', '00000207-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleEncAggSoc = EnphaseEnsembleEncAggSoc;

    class EnphaseEnsembleEncAggRatedPower extends Characteristic {
        constructor() {
            super('ENC rated power', '00000208-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kW',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleEncAggRatedPower = EnphaseEnsembleEncAggRatedPower;

    class EnphaseEnsembleEncAggPercentFull extends Characteristic {
        constructor() {
            super('ENC percent full', '00000211-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleEncAggPercentFull = EnphaseEnsembleEncAggPercentFull;

    class EnphaseEnsembleEncAggBackupEnergy extends Characteristic {
        constructor() {
            super('ENC backup energy', '00000209-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kWh',
                maxValue: 100000000,
                minValue: -100000000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleEncAggBackupEnergy = EnphaseEnsembleEncAggBackupEnergy;

    class EnphaseEnsembleEncAggAvailEnergy extends Characteristic {
        constructor() {
            super('ENC available energy', '00000210-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kWh',
                maxValue: 100000000,
                minValue: -100000000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleEncAggAvailEnergy = EnphaseEnsembleEncAggAvailEnergy;


    //Enpower service
    class EnphaseEnsembleService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000009-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnphaseEnsembleRestPower);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHz);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasV);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHzQ8);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasVQ5);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHzPhaseB);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasVPhaseB);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHzQ8PhaseB);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasVQ5PhaseB);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHzPhaseC);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasVPhaseC);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleFreqBiasHzQ8PhaseC);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleVoltageBiasVQ5PhaseC);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleConfiguredBackupSoc);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleAdjustedBackupSoc);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleAggSoc);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleAggMaxEnergy);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleEncAggSoc);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleEncAggRatedPower);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleEncAggPercentFull);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleEncAggBackupEnergy);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleEncAggAvailEnergy);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnphaseEnsembleService = EnphaseEnsembleService;

    //Wireless connection kit
    class EnphaseWirelessConnectionKitType extends Characteristic {
        constructor() {
            super('Type', '00000220-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseWirelessConnectionKitType = EnphaseWirelessConnectionKitType;

    class EnphaseWirelessConnectionKitConnected extends Characteristic {
        constructor() {
            super('Connected', '00000221-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseWirelessConnectionKitConnected = EnphaseWirelessConnectionKitConnected;

    class EnphaseWirelessConnectionKitSignalStrength extends Characteristic {
        constructor() {
            super('Signal strength', '00000222-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseWirelessConnectionKitSignalStrength = EnphaseWirelessConnectionKitSignalStrength;

    class EnphaseWirelessConnectionKitSignalStrengthMax extends Characteristic {
        constructor() {
            super('Signal strength max', '00000223-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseWirelessConnectionKitSignalStrengthMax = EnphaseWirelessConnectionKitSignalStrengthMax;

    //Wireless connection kit service
    class EnphaseWirelessConnectionKitService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000010-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnphaseWirelessConnectionKitType);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnphaseWirelessConnectionKitConnected);
            this.addOptionalCharacteristic(Characteristic.EnphaseWirelessConnectionKitSignalStrength);
            this.addOptionalCharacteristic(Characteristic.EnphaseWirelessConnectionKitSignalStrengthMax);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnphaseWirelessConnectionKitService = EnphaseWirelessConnectionKitService;

    //Esub inventoty
    class EnphaseEnsembleInventoryProducing extends Characteristic {
        constructor() {
            super('Producing', '00000230-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleInventoryProducing = EnphaseEnsembleInventoryProducing;

    class EnphaseEnsembleInventoryCommunicating extends Characteristic {
        constructor() {
            super('Communicating', '00000231-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleInventoryCommunicating = EnphaseEnsembleInventoryCommunicating;


    class EnphaseEnsembleInventoryOperating extends Characteristic {
        constructor() {
            super('Operating', '00000232-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleInventoryOperating = EnphaseEnsembleInventoryOperating;

    class EnphaseEnsembleInventoryCommLevel extends Characteristic {
        constructor() {
            super('PLC level', '00000233-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                unit: Units.PERCENTAGE,
                maxValue: 100,
                minValue: 0,
                minStep: 1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleInventoryCommLevel = EnphaseEnsembleInventoryCommLevel;

    class EnphaseEnsembleInventoryStatus extends Characteristic {
        constructor() {
            super('Status', '00000234-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleInventoryStatus = EnphaseEnsembleInventoryStatus;

    class EnphaseEnsembleInventoryFirmware extends Characteristic {
        constructor() {
            super('Firmware', '00000235-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleInventoryFirmware = EnphaseEnsembleInventoryFirmware;

    class EnphaseEnsembleInventoryLastReportDate extends Characteristic {
        constructor() {
            super('Last report', '00000236-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleInventoryLastReportDate = EnphaseEnsembleInventoryLastReportDate;

    //eusb service
    class EnphaseEnsembleInventoryService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000011-000B-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnphaseEnsembleInventoryProducing);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleInventoryCommunicating);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleInventoryOperating);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleInventoryCommLevel);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleInventoryStatus);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleInventoryFirmware);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleInventoryLastReportDate);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnphaseEnsembleInventoryService = EnphaseEnsembleInventoryService;

    //Enphase live data 
    class EnphaseLiveDataActivePower extends Characteristic {
        constructor() {
            super('Active power', '00000240-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kW',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseLiveDataActivePower = EnphaseLiveDataActivePower;

    class EnphaseLiveDataActivePowerL1 extends Characteristic {
        constructor() {
            super('Active power L1', '00000241-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kW',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseLiveDataActivePowerL1 = EnphaseLiveDataActivePowerL1;


    class EnphaseLiveDataActivePowerL2 extends Characteristic {
        constructor() {
            super('Active power L2', '00000242-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kW',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseLiveDataActivePowerL2 = EnphaseLiveDataActivePowerL2;


    class EnphaseLiveDataActivePowerL3 extends Characteristic {
        constructor() {
            super('Active power L3', '00000243-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kW',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseLiveDataActivePowerL3 = EnphaseLiveDataActivePowerL3;


    class EnphaseLiveDataApparentPower extends Characteristic {
        constructor() {
            super('Apparent power', '00000244-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kVA',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseLiveDataApparentPower = EnphaseLiveDataApparentPower;

    class EnphaseLiveDataApparentPowerL1 extends Characteristic {
        constructor() {
            super('Apparent power L1', '00000245-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kVA',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseLiveDataApparentPowerL1 = EnphaseLiveDataApparentPowerL1;

    class EnphaseLiveDataApparentPowerL2 extends Characteristic {
        constructor() {
            super('Apparent power L2', '00000246-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kVA',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseLiveDataApparentPowerL2 = EnphaseLiveDataApparentPowerL2;

    class EnphaseLiveDataApparentPowerL3 extends Characteristic {
        constructor() {
            super('Apparent power L3', '00000247-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kVA',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseLiveDataApparentPowerL3 = EnphaseLiveDataApparentPowerL3;

    //live data service
    class EnphaseLiveDataService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000012-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnphaseLiveDataActivePower);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnphaseLiveDataActivePowerL1);
            this.addOptionalCharacteristic(Characteristic.EnphaseLiveDataActivePowerL2);
            this.addOptionalCharacteristic(Characteristic.EnphaseLiveDataActivePowerL3);
            this.addOptionalCharacteristic(Characteristic.EnphaseLiveDataApparentPower);
            this.addOptionalCharacteristic(Characteristic.EnphaseLiveDataApparentPowerL1);
            this.addOptionalCharacteristic(Characteristic.EnphaseLiveDataApparentPowerL2);
            this.addOptionalCharacteristic(Characteristic.EnphaseLiveDataApparentPowerL3);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnphaseLiveDataService = EnphaseLiveDataService;

    //generator
    class EnphaseEnsembleGeneratorAdminMode extends Characteristic {
        constructor() {
            super('Admin mode', '00000250-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleGeneratorAdminMode = EnphaseEnsembleGeneratorAdminMode;

    class EnphaseEnsembleGeneratorType extends Characteristic {
        constructor() {
            super('Type', '00000251-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleGeneratorType = EnphaseEnsembleGeneratorType;

    class EnphaseEnsembleGeneratorAdminState extends Characteristic {
        constructor() {
            super('Admin state', '00000252-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleGeneratorAdminState = EnphaseEnsembleGeneratorAdminState;

    class EnphaseEnsembleGeneratorOperState extends Characteristic {
        constructor() {
            super('Operation state', '00000253-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleGeneratorOperState = EnphaseEnsembleGeneratorOperState;

    class EnphaseEnsembleGeneratorStartSoc extends Characteristic {
        constructor() {
            super('Start soc', '00000254-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleGeneratorStartSoc = EnphaseEnsembleGeneratorStartSoc;

    class EnphaseEnsembleGeneratorStopSoc extends Characteristic {
        constructor() {
            super('Stop soc', '00000255-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleGeneratorStopSoc = EnphaseEnsembleGeneratorStopSoc;

    class EnphaseEnsembleGeneratorExexOn extends Characteristic {
        constructor() {
            super('Exec on', '00000256-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleGeneratorExexOn = EnphaseEnsembleGeneratorExexOn;

    class EnphaseEnsembleGeneratorShedule extends Characteristic {
        constructor() {
            super('Schedule', '00000257-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleGeneratorShedule = EnphaseEnsembleGeneratorShedule;

    class EnphaseEnsembleGeneratorPresent extends Characteristic {
        constructor() {
            super('Present', '00000258-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnphaseEnsembleGeneratorPresent = EnphaseEnsembleGeneratorPresent;


    //generator service
    class EnphaseGerneratorService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000013-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnphaseEnsembleGeneratorAdminMode);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleGeneratorType);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleGeneratorAdminState);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleGeneratorOperState);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleGeneratorStartSoc);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleGeneratorStopSoc);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleGeneratorExexOn);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleGeneratorShedule);
            this.addOptionalCharacteristic(Characteristic.EnphaseEnsembleGeneratorPresent);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnphaseGerneratorService = EnphaseGerneratorService;
};