export default (api) => {
    const { Service, Characteristic, Units, Formats, Perms } = api.hap;

    //Envoy
    class EnvoyAlerts extends Characteristic {
        constructor() {
            super('Alerts', '00000001-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyAlerts = EnvoyAlerts;

    class EnvoyGridProfile extends Characteristic {
        constructor() {
            super('Grid profile', '00000002-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyGridProfile = EnvoyGridProfile;

    class EnvoyPrimaryInterface extends Characteristic {
        constructor() {
            super('Network interface', '00000011-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyPrimaryInterface = EnvoyPrimaryInterface;

    class EnvoyNetworkWebComm extends Characteristic {
        constructor() {
            super('Web communication', '00000012-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyNetworkWebComm = EnvoyNetworkWebComm;


    class EnvoyEverReportedToEnlighten extends Characteristic {
        constructor() {
            super('Report to Enlighten', '00000013-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyEverReportedToEnlighten = EnvoyEverReportedToEnlighten;

    class EnvoyCommNumAndLevel extends Characteristic {
        constructor() {
            super('Devices / Level', '00000014-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyCommNumAndLevel = EnvoyCommNumAndLevel;

    class EnvoyCommNumNsrbAndLevel extends Characteristic {
        constructor() {
            super('Q-Relays / Level', '00000015-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyCommNumNsrbAndLevel = EnvoyCommNumNsrbAndLevel;

    class EnvoyCommNumPcuAndLevel extends Characteristic {
        constructor() {
            super('Microinverters / Level', '00000016-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyCommNumPcuAndLevel = EnvoyCommNumPcuAndLevel;

    class EnvoyCommNumAcbAndLevel extends Characteristic {
        constructor() {
            super('AC Batteries / Level', '00000017-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyCommNumAcbAndLevel = EnvoyCommNumAcbAndLevel;

    class EnvoyCommNumEnchgAndLevel extends Characteristic {
        constructor() {
            super('Encharges / Level', '00000018-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyCommNumEnchgAndLevel = EnvoyCommNumEnchgAndLevel;

    class EnvoyDbSize extends Characteristic {
        constructor() {
            super('DB size', '00000019-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyDbSize = EnvoyDbSize;

    class EnvoyTariff extends Characteristic {
        constructor() {
            super('Tariff', '00000021-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyTariff = EnvoyTariff;

    class EnvoyFirmware extends Characteristic {
        constructor() {
            super('Firmware', '00000022-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyFirmware = EnvoyFirmware;

    class EnvoyUpdateStatus extends Characteristic {
        constructor() {
            super('Update status', '00000023-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyUpdateStatus = EnvoyUpdateStatus;

    class EnvoyTimeZone extends Characteristic {
        constructor() {
            super('Time Zone', '00000024-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyTimeZone = EnvoyTimeZone;

    class EnvoyCurrentDateTime extends Characteristic {
        constructor() {
            super('Local time', '00000025-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyCurrentDateTime = EnvoyCurrentDateTime;

    class EnvoyLastEnlightenReporDate extends Characteristic {
        constructor() {
            super('Last report to Enlighten', '00000026-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyLastEnlightenReporDate = EnvoyLastEnlightenReporDate;

    class EnvoyEnpowerGridState extends Characteristic {
        constructor() {
            super('Enpower grid state', '00000027-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyEnpowerGridState = EnvoyEnpowerGridState;

    class EnvoyEnpowerGridMode extends Characteristic {
        constructor() {
            super('Enpower grid mode', '00000028-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyEnpowerGridMode = EnvoyEnpowerGridMode;

    class EnvoyGeneratorState extends Characteristic {
        constructor() {
            super('Generator state', '00000301-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyGeneratorState = EnvoyGeneratorState;

    class EnvoyGeneratorMode extends Characteristic {
        constructor() {
            super('Generator mode', '00000302-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyGeneratorMode = EnvoyGeneratorMode;


    class EnvoyCheckCommLevel extends Characteristic {
        constructor() {
            super('Plc level check', '00000029-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyCheckCommLevel = EnvoyCheckCommLevel;

    class EnvoyProductionPowerMode extends Characteristic {
        constructor() {
            super('Production state', '00000030-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyProductionPowerMode = EnvoyProductionPowerMode;

    class EnvoyDataRefresh extends Characteristic {
        constructor() {
            super('Data sampling', '00000300-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnvoyDataRefresh = EnvoyDataRefresh;

    //power production service
    class EnvoyService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000001-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnvoyAlerts);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnvoyGridProfile);
            this.addOptionalCharacteristic(Characteristic.EnvoyPrimaryInterface);
            this.addOptionalCharacteristic(Characteristic.EnvoyNetworkWebComm);
            this.addOptionalCharacteristic(Characteristic.EnvoyEverReportedToEnlighten);
            this.addOptionalCharacteristic(Characteristic.EnvoyCommNumAndLevel);
            this.addOptionalCharacteristic(Characteristic.EnvoyCommNumNsrbAndLevel);
            this.addOptionalCharacteristic(Characteristic.EnvoyCommNumPcuAndLevel);
            this.addOptionalCharacteristic(Characteristic.EnvoyCommNumAcbAndLevel);
            this.addOptionalCharacteristic(Characteristic.EnvoyCommNumEnchgAndLevel);
            this.addOptionalCharacteristic(Characteristic.EnvoyDbSize);
            this.addOptionalCharacteristic(Characteristic.EnvoyTariff);
            this.addOptionalCharacteristic(Characteristic.EnvoyFirmware);
            this.addOptionalCharacteristic(Characteristic.EnvoyUpdateStatus);
            this.addOptionalCharacteristic(Characteristic.EnvoyTimeZone);
            this.addOptionalCharacteristic(Characteristic.EnvoyCurrentDateTime);
            this.addOptionalCharacteristic(Characteristic.EnvoyLastEnlightenReporDate);
            this.addOptionalCharacteristic(Characteristic.EnvoyEnpowerGridState);
            this.addOptionalCharacteristic(Characteristic.EnvoyEnpowerGridMode);
            this.addOptionalCharacteristic(Characteristic.EnvoyGeneratorState);
            this.addOptionalCharacteristic(Characteristic.EnvoyGeneratorMode);
            this.addOptionalCharacteristic(Characteristic.EnvoyCheckCommLevel);
            this.addOptionalCharacteristic(Characteristic.EnvoyProductionPowerMode);
            this.addOptionalCharacteristic(Characteristic.EnvoyDataRefresh);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnvoyService = EnvoyService;

    //Q-Relay
    class QrelayState extends Characteristic {
        constructor() {
            super('Relay', '00000031-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.QrelayState = QrelayState;

    class QrelayLinesCount extends Characteristic {
        constructor() {
            super('Lines', '00000032-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.QrelayLinesCount = QrelayLinesCount;

    class QrelayLine1Connected extends Characteristic {
        constructor() {
            super('Line 1', '00000033-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.QrelayLine1Connected = QrelayLine1Connected;

    class QrelayLine2Connected extends Characteristic {
        constructor() {
            super('Line 2', '00000034-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.QrelayLine2Connected = QrelayLine2Connected;

    class QrelayLine3Connected extends Characteristic {
        constructor() {
            super('Line 3', '00000035-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.QrelayLine3Connected = QrelayLine3Connected;

    class QrelayProducing extends Characteristic {
        constructor() {
            super('Producing', '00000036-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.QrelayProducing = QrelayProducing;

    class QrelayCommunicating extends Characteristic {
        constructor() {
            super('Communicating', '00000037-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.QrelayCommunicating = QrelayCommunicating;

    class QrelayProvisioned extends Characteristic {
        constructor() {
            super('Provisioned', '00000038-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.QrelayProvisioned = QrelayProvisioned;

    class QrelayOperating extends Characteristic {
        constructor() {
            super('Operating', '00000039-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.QrelayOperating = QrelayOperating;

    class QrelayCommLevel extends Characteristic {
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
    Characteristic.QrelayCommLevel = QrelayCommLevel;

    class QrelayStatus extends Characteristic {
        constructor() {
            super('Status', '00000042-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.QrelayStatus = QrelayStatus;

    class QrelayFirmware extends Characteristic {
        constructor() {
            super('Firmware', '00000043-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.QrelayFirmware = QrelayFirmware;

    class QrelayLastReportDate extends Characteristic {
        constructor() {
            super('Last report', '00000044-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.QrelayLastReportDate = QrelayLastReportDate;

    class QrelayGridProfile extends Characteristic {
        constructor() {
            super('Grid profile', '00000045-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.QrelayGridProfile = QrelayGridProfile;

    //qrelay service
    class QrelayService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000002-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.QrelayState);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.QrelayLinesCount);
            this.addOptionalCharacteristic(Characteristic.QrelayLine1Connected);
            this.addOptionalCharacteristic(Characteristic.QrelayLine2Connected);
            this.addOptionalCharacteristic(Characteristic.QrelayLine3Connected);
            this.addOptionalCharacteristic(Characteristic.QrelayProducing);
            this.addOptionalCharacteristic(Characteristic.QrelayCommunicating);
            this.addOptionalCharacteristic(Characteristic.QrelayProvisioned);
            this.addOptionalCharacteristic(Characteristic.QrelayOperating);
            this.addOptionalCharacteristic(Characteristic.QrelayCommLevel);
            this.addOptionalCharacteristic(Characteristic.QrelayStatus);
            this.addOptionalCharacteristic(Characteristic.QrelayFirmware);
            this.addOptionalCharacteristic(Characteristic.QrelayLastReportDate);
            this.addOptionalCharacteristic(Characteristic.QrelayGridProfile);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.QrelayService = QrelayService;

    // current meters
    class MeterState extends Characteristic {
        constructor() {
            super('State', '00000051-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MeterState = MeterState;

    class MeterMeasurementType extends Characteristic {
        constructor() {
            super('Meter type', '00000052-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MeterMeasurementType = MeterMeasurementType;

    class MeterPhaseCount extends Characteristic {
        constructor() {
            super('Phase count', '00000053-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MeterPhaseCount = MeterPhaseCount;

    class MeterPhaseMode extends Characteristic {
        constructor() {
            super('Phase mode', '00000054-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MeterPhaseMode = MeterPhaseMode;

    class MeterMeteringStatus extends Characteristic {
        constructor() {
            super('Metering status', '00000055-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MeterMeteringStatus = MeterMeteringStatus;

    class MeterStatusFlags extends Characteristic {
        constructor() {
            super('Status flag', '00000056-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MeterStatusFlags = MeterStatusFlags;

    class MeterActivePower extends Characteristic {
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
    Characteristic.MeterActivePower = MeterActivePower;

    class MeterApparentPower extends Characteristic {
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
    Characteristic.MeterApparentPower = MeterApparentPower;

    class MeterReactivePower extends Characteristic {
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
    Characteristic.MeterReactivePower = MeterReactivePower;

    class MeterPwrFactor extends Characteristic {
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
    Characteristic.MeterPwrFactor = MeterPwrFactor;

    class MeterVoltage extends Characteristic {
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
    Characteristic.MeterVoltage = MeterVoltage;

    class MeterCurrent extends Characteristic {
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
    Characteristic.MeterCurrent = MeterCurrent;

    class MeterFrequency extends Characteristic {
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
    Characteristic.MeterFrequency = MeterFrequency;

    class MeterReadingTime extends Characteristic {
        constructor() {
            super('Last report', '00000065-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MeterReadingTime = MeterReadingTime;

    //current meters service
    class MeterService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000003-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.MeterState);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.MeterPhaseMode);
            this.addOptionalCharacteristic(Characteristic.MeterPhaseCount);
            this.addOptionalCharacteristic(Characteristic.MeterMeasurementType);
            this.addOptionalCharacteristic(Characteristic.MeterMeteringStatus);
            this.addOptionalCharacteristic(Characteristic.MeterStatusFlags);
            this.addOptionalCharacteristic(Characteristic.MeterActivePower);
            this.addOptionalCharacteristic(Characteristic.MeterApparentPower);
            this.addOptionalCharacteristic(Characteristic.MeterReactivePower);
            this.addOptionalCharacteristic(Characteristic.MeterPwrFactor);
            this.addOptionalCharacteristic(Characteristic.MeterVoltage);
            this.addOptionalCharacteristic(Characteristic.MeterCurrent);
            this.addOptionalCharacteristic(Characteristic.MeterFrequency);
            this.addOptionalCharacteristic(Characteristic.MeterReadingTime);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.MeterService = MeterService;

    //Envoy production/consumption characteristics
    class Power extends Characteristic {
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
    Characteristic.Power = Power;

    class PowerPeak extends Characteristic {
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
    Characteristic.PowerPeak = PowerPeak;

    class PowerPeakDetected extends Characteristic {
        constructor() {
            super('Power peak detected', '00000073-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.PowerPeakDetected = PowerPeakDetected;

    class EnergyToday extends Characteristic {
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
    Characteristic.EnergyToday = EnergyToday;

    class EnergyLastSevenDays extends Characteristic {
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
    Characteristic.EnergyLastSevenDays = EnergyLastSevenDays;

    class EnergyLifetime extends Characteristic {
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
    Characteristic.EnergyLifetime = EnergyLifetime;

    class Current extends Characteristic {
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
    Characteristic.Current = Current;

    class Voltage extends Characteristic {
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
    Characteristic.Voltage = Voltage;

    class ReactivePower extends Characteristic {
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
    Characteristic.ReactivePower = ReactivePower;

    class ApparentPower extends Characteristic {
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
    Characteristic.ApparentPower = ApparentPower;

    class PwrFactor extends Characteristic {
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
    Characteristic.PwrFactor = PwrFactor;

    class ReadingTime extends Characteristic {
        constructor() {
            super('Last report', '00000083-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.ReadingTime = ReadingTime;

    class PowerPeakReset extends Characteristic {
        constructor() {
            super('Power peak reset', '00000084-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.PowerPeakReset = PowerPeakReset;

    class Frequency extends Characteristic {
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
    Characteristic.Frequency = Frequency;

    class EnergyLifetimeUpload extends Characteristic {
        constructor() {
            super('Energy lifetime upload', '00000086-000B-1000-8000-0026BB765291');
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
    Characteristic.EnergyLifetimeUpload = EnergyLifetimeUpload;

    //power production service
    class PowerAndEnergyService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000004-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.Power)
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.PowerPeak);
            this.addOptionalCharacteristic(Characteristic.PowerPeakDetected);
            this.addOptionalCharacteristic(Characteristic.EnergyToday);
            this.addOptionalCharacteristic(Characteristic.EnergyLastSevenDays);
            this.addOptionalCharacteristic(Characteristic.EnergyLifetime);
            this.addOptionalCharacteristic(Characteristic.EnergyLifetimeUpload);
            this.addOptionalCharacteristic(Characteristic.Current);
            this.addOptionalCharacteristic(Characteristic.Voltage);
            this.addOptionalCharacteristic(Characteristic.ReactivePower);
            this.addOptionalCharacteristic(Characteristic.ApparentPower);
            this.addOptionalCharacteristic(Characteristic.PwrFactor);
            this.addOptionalCharacteristic(Characteristic.ReadingTime);
            this.addOptionalCharacteristic(Characteristic.PowerPeakReset);
            this.addOptionalCharacteristic(Characteristic.Frequency);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.PowerAndEnergyService = PowerAndEnergyService;

    //AC Batterie
    class AcBatterieSummaryPower extends Characteristic {
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
    Characteristic.AcBatterieSummaryPower = AcBatterieSummaryPower;

    class AcBatterieSummaryEnergy extends Characteristic {
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
    Characteristic.AcBatterieSummaryEnergy = AcBatterieSummaryEnergy;

    class AcBatterieSummaryPercentFull extends Characteristic {
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
    Characteristic.AcBatterieSummaryPercentFull = AcBatterieSummaryPercentFull;

    class AcBatterieSummaryActiveCount extends Characteristic {
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
    Characteristic.AcBatterieSummaryActiveCount = AcBatterieSummaryActiveCount;

    class AcBatterieSummaryState extends Characteristic {
        constructor() {
            super('State', '00000095-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.AcBatterieSummaryState = AcBatterieSummaryState;

    class AcBatterieSummaryReadingTime extends Characteristic {
        constructor() {
            super('Last report', '00000096-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.AcBatterieSummaryReadingTime = AcBatterieSummaryReadingTime;

    //AC Batterie summary service
    class AcBatterieSummaryService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000005-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.AcBatterieSummaryPower);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.AcBatterieSummaryEnergy);
            this.addOptionalCharacteristic(Characteristic.AcBatterieSummaryPercentFull);
            this.addOptionalCharacteristic(Characteristic.AcBatterieSummaryActiveCount);
            this.addOptionalCharacteristic(Characteristic.AcBatterieSummaryState);
            this.addOptionalCharacteristic(Characteristic.AcBatterieSummaryReadingTime);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.AcBatterieSummaryService = AcBatterieSummaryService;

    //AC Batterie
    class AcBatterieChargeStatus extends Characteristic {
        constructor() {
            super('Charge status', '00000111-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.AcBatterieChargeStatus = AcBatterieChargeStatus;

    class AcBatterieProducing extends Characteristic {
        constructor() {
            super('Producing', '00000112-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.AcBatterieProducing = AcBatterieProducing;

    class AcBatterieCommunicating extends Characteristic {
        constructor() {
            super('Communicating', '00000113-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.AcBatterieCommunicating = AcBatterieCommunicating;

    class AcBatterieProvisioned extends Characteristic {
        constructor() {
            super('Provisioned', '00000114-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.AcBatterieProvisioned = AcBatterieProvisioned;

    class AcBatterieOperating extends Characteristic {
        constructor() {
            super('Operating', '00000115-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.AcBatterieOperating = AcBatterieOperating;

    class AcBatterieCommLevel extends Characteristic {
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
    Characteristic.AcBatterieCommLevel = AcBatterieCommLevel;

    class AcBatterieSleepEnabled extends Characteristic {
        constructor() {
            super('Sleep enabled', '00000117-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.AcBatterieSleepEnabled = AcBatterieSleepEnabled;

    class AcBatteriePercentFull extends Characteristic {
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
    Characteristic.AcBatteriePercentFull = AcBatteriePercentFull;

    class AcBatterieMaxCellTemp extends Characteristic {
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
    Characteristic.AcBatterieMaxCellTemp = AcBatterieMaxCellTemp;

    class AcBatterieSleepMinSoc extends Characteristic {
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
    Characteristic.AcBatterieSleepMinSoc = AcBatterieSleepMinSoc;

    class AcBatterieSleepMaxSoc extends Characteristic {
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
    Characteristic.AcBatterieSleepMaxSoc = AcBatterieSleepMaxSoc;

    class AcBatterieStatus extends Characteristic {
        constructor() {
            super('Status', '00000123-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.AcBatterieStatus = AcBatterieStatus;

    class AcBatterieFirmware extends Characteristic {
        constructor() {
            super('Firmware', '00000124-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.AcBatterieFirmware = AcBatterieFirmware;

    class AcBatterieLastReportDate extends Characteristic {
        constructor() {
            super('Last report', '00000125-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.AcBatterieLastReportDate = AcBatterieLastReportDate;

    //AC Batterie service
    class AcBatterieService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000006-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.AcBatterieChargeStatus);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.AcBatterieProducing);
            this.addOptionalCharacteristic(Characteristic.AcBatterieCommunicating);
            this.addOptionalCharacteristic(Characteristic.AcBatterieProvisioned);
            this.addOptionalCharacteristic(Characteristic.AcBatterieOperating);
            this.addOptionalCharacteristic(Characteristic.AcBatterieCommLevel);
            this.addOptionalCharacteristic(Characteristic.AcBatterieSleepEnabled);
            this.addOptionalCharacteristic(Characteristic.AcBatteriePercentFull);
            this.addOptionalCharacteristic(Characteristic.AcBatterieMaxCellTemp);
            this.addOptionalCharacteristic(Characteristic.AcBatterieSleepMinSoc);
            this.addOptionalCharacteristic(Characteristic.AcBatterieSleepMaxSoc);
            this.addOptionalCharacteristic(Characteristic.AcBatterieStatus);
            this.addOptionalCharacteristic(Characteristic.AcBatterieFirmware);
            this.addOptionalCharacteristic(Characteristic.AcBatterieLastReportDate);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.AcBatterieService = AcBatterieService;

    //Microinverter
    class MicroinverterPower extends Characteristic {
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
    Characteristic.MicroinverterPower = MicroinverterPower;

    class MicroinverterPowerPeak extends Characteristic {
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
    Characteristic.MicroinverterPowerPeak = MicroinverterPowerPeak;

    class MicroinverterEnergyToday extends Characteristic {
        constructor() {
            super('Energy today', '00000133-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'Wh',
                maxValue: 10000,
                minValue: -10000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MicroinverterEnergyToday = MicroinverterEnergyToday;

    class MicroinverterEnergyYesterday extends Characteristic {
        constructor() {
            super('Energy yesterday', '00000134-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'Wh',
                maxValue: 10000,
                minValue: -10000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MicroinverterEnergyYesterday = MicroinverterEnergyYesterday;

    class MicroinverterEnergyLastSevenDays extends Characteristic {
        constructor() {
            super('Energy last 7 days', '00000135-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: 'kWh',
                maxValue: 1000,
                minValue: -1000,
                minStep: 0.001,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MicroinverterEnergyLastSevenDays = MicroinverterEnergyLastSevenDays;

    class MicroinverterEnergyLifetime extends Characteristic {
        constructor() {
            super('Energy lifetime', '00000136-000B-1000-8000-0026BB765291');
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
    Characteristic.MicroinverterEnergyLifetime = MicroinverterEnergyLifetime;

    class MicroinverterProducing extends Characteristic {
        constructor() {
            super('Producing', '00000137-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MicroinverterProducing = MicroinverterProducing;

    class MicroinverterCommunicating extends Characteristic {
        constructor() {
            super('Communicating', '00000138-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MicroinverterCommunicating = MicroinverterCommunicating;

    class MicroinverterProvisioned extends Characteristic {
        constructor() {
            super('Provisioned', '00000139-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MicroinverterProvisioned = MicroinverterProvisioned;

    class MicroinverterOperating extends Characteristic {
        constructor() {
            super('Operating', '00000140-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MicroinverterOperating = MicroinverterOperating;

    class MicroinverterCommLevel extends Characteristic {
        constructor() {
            super('PLC level', '00000141-000B-1000-8000-0026BB765291');
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
    Characteristic.MicroinverterCommLevel = MicroinverterCommLevel;

    class MicroinverterStatus extends Characteristic {
        constructor() {
            super('Status', '00000142-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MicroinverterStatus = MicroinverterStatus;

    class MicroinverterFirmware extends Characteristic {
        constructor() {
            super('Firmware', '00000143-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MicroinverterFirmware = MicroinverterFirmware;

    class MicroinverterLastReportDate extends Characteristic {
        constructor() {
            super('Last report', '00000144-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MicroinverterLastReportDate = MicroinverterLastReportDate;

    class MicroinverterGridProfile extends Characteristic {
        constructor() {
            super('Grid profile', '00000145-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MicroinverterGridProfile = MicroinverterGridProfile;

    class MicroinverterCurrent extends Characteristic {
        constructor() {
            super('Current', '00000146-000B-1000-8000-0026BB765291');
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
    Characteristic.MicroinverterCurrent = MicroinverterCurrent;

    class MicroinverterVoltage extends Characteristic {
        constructor() {
            super('Voltage', '00000147-000B-1000-8000-0026BB765291');
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
    Characteristic.MicroinverterVoltage = MicroinverterVoltage;

    class MicroinverterFrequency extends Characteristic {
        constructor() {
            super('Frequency', '00000148-000B-1000-8000-0026BB765291');
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
    Characteristic.MicroinverterFrequency = MicroinverterFrequency;

    class MicroinverterVoltageDc extends Characteristic {
        constructor() {
            super('Voltage DC', '00000149-000B-1000-8000-0026BB765291');
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
    Characteristic.MicroinverterVoltageDc = MicroinverterVoltageDc;

    class MicroinverterCurrentDc extends Characteristic {
        constructor() {
            super('Current DC', '0000015A-000B-1000-8000-0026BB765291');
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
    Characteristic.MicroinverterCurrentDc = MicroinverterCurrentDc;

    class MicroinverterTemperature extends Characteristic {
        constructor() {
            super('Temperature', '0000015B-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.FLOAT,
                unit: '°C',
                maxValue: 100,
                minValue: -100,
                minStep: 0.1,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MicroinverterTemperature = MicroinverterTemperature;

    //devices service
    class MicroinverterService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000007-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.MicroinverterPower);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.MicroinverterPowerPeak);
            this.addOptionalCharacteristic(Characteristic.MicroinverterEnergyToday);
            this.addOptionalCharacteristic(Characteristic.MicroinverterEnergyYesterday);
            this.addOptionalCharacteristic(Characteristic.MicroinverterEnergyLastSevenDays);
            this.addOptionalCharacteristic(Characteristic.MicroinverterEnergyLifetime);
            this.addOptionalCharacteristic(Characteristic.MicroinverterProducing);
            this.addOptionalCharacteristic(Characteristic.MicroinverterCommunicating);
            this.addOptionalCharacteristic(Characteristic.MicroinverterProvisioned);
            this.addOptionalCharacteristic(Characteristic.MicroinverterOperating);
            this.addOptionalCharacteristic(Characteristic.MicroinverterCommLevel);
            this.addOptionalCharacteristic(Characteristic.MicroinverterStatus);
            this.addOptionalCharacteristic(Characteristic.MicroinverterFirmware);
            this.addOptionalCharacteristic(Characteristic.MicroinverterLastReportDate);
            this.addOptionalCharacteristic(Characteristic.MicroinverterGridProfile);
            this.addOptionalCharacteristic(Characteristic.MicroinverterCurrent);
            this.addOptionalCharacteristic(Characteristic.MicroinverterVoltage);
            this.addOptionalCharacteristic(Characteristic.MicroinverterFrequency);
            this.addOptionalCharacteristic(Characteristic.MicroinverterVoltageDc);
            this.addOptionalCharacteristic(Characteristic.MicroinverterCurrentDc);
            this.addOptionalCharacteristic(Characteristic.MicroinverterTemperature);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.MicroinverterService = MicroinverterService;

    //Encharge
    class EnchargeAdminStateStr extends Characteristic {
        constructor() {
            super('Charge status', '00000151-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnchargeAdminStateStr = EnchargeAdminStateStr;

    class EnchargeCommunicating extends Characteristic {
        constructor() {
            super('Communicating', '00000152-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnchargeCommunicating = EnchargeCommunicating;

    class EnchargeOperating extends Characteristic {
        constructor() {
            super('Operating', '00000153-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnchargeOperating = EnchargeOperating;

    class EnchargeCommLevelSubGhz extends Characteristic {
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
    Characteristic.EnchargeCommLevelSubGhz = EnchargeCommLevelSubGhz

    class EnchargeCommLevel24Ghz extends Characteristic {
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
    Characteristic.EnchargeCommLevel24Ghz = EnchargeCommLevel24Ghz;

    class EnchargeSleepEnabled extends Characteristic {
        constructor() {
            super('Sleep enabled', '00000156-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnchargeSleepEnabled = EnchargeSleepEnabled;

    class EnchargePercentFull extends Characteristic {
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
    Characteristic.EnchargePercentFull = EnchargePercentFull;

    class EnchargeTemperature extends Characteristic {
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
    Characteristic.EnchargeTemperature = EnchargeTemperature;

    class EnchargeMaxCellTemp extends Characteristic {
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
    Characteristic.EnchargeMaxCellTemp = EnchargeMaxCellTemp;

    class EnchargeLedStatus extends Characteristic {
        constructor() {
            super('LED status', '00000161-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnchargeLedStatus = EnchargeLedStatus;

    class EnchargeRealPowerW extends Characteristic {
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
    Characteristic.EnchargeRealPowerW = EnchargeRealPowerW;

    class EnchargeCapacity extends Characteristic {
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
    Characteristic.EnchargeCapacity = EnchargeCapacity;

    class EnchargeDcSwitchOff extends Characteristic {
        constructor() {
            super('DC switch OFF', '00000164-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnchargeDcSwitchOff = EnchargeDcSwitchOff;

    class EnchargeRev extends Characteristic {
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
    Characteristic.EnchargeRev = EnchargeRev;

    class EnchargeGridProfile extends Characteristic {
        constructor() {
            super('Grid profile', '00000166-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnchargeGridProfile = EnchargeGridProfile;

    class EnchargeStatus extends Characteristic {
        constructor() {
            super('Status', '00000167-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnchargeStatus = EnchargeStatus;

    class EnchargeLastReportDate extends Characteristic {
        constructor() {
            super('Last report', '00000168-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnchargeLastReportDate = EnchargeLastReportDate;

    class EnchargeCommLevel extends Characteristic {
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
    Characteristic.EnchargeCommLevel = EnchargeCommLevel;

    //Encharge service
    class EnchargeService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000007-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnchargeAdminStateStr);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnchargeOperating);
            this.addOptionalCharacteristic(Characteristic.EnchargeCommunicating);
            this.addOptionalCharacteristic(Characteristic.EnchargeCommLevelSubGhz);
            this.addOptionalCharacteristic(Characteristic.EnchargeCommLevel24Ghz);
            this.addOptionalCharacteristic(Characteristic.EnchargeSleepEnabled);
            this.addOptionalCharacteristic(Characteristic.EnchargePercentFull);
            this.addOptionalCharacteristic(Characteristic.EnchargeTemperature);
            this.addOptionalCharacteristic(Characteristic.EnchargeMaxCellTemp);
            this.addOptionalCharacteristic(Characteristic.EnchargeLedStatus);
            this.addOptionalCharacteristic(Characteristic.EnchargeRealPowerW);
            this.addOptionalCharacteristic(Characteristic.EnchargeCapacity);
            this.addOptionalCharacteristic(Characteristic.EnchargeDcSwitchOff);
            this.addOptionalCharacteristic(Characteristic.EnchargeRev);
            this.addOptionalCharacteristic(Characteristic.EnchargeGridProfile);
            this.addOptionalCharacteristic(Characteristic.EnchargeStatus);
            this.addOptionalCharacteristic(Characteristic.EnchargeLastReportDate);
            this.addOptionalCharacteristic(Characteristic.EnchargeCommLevel);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnchargeService = EnchargeService;

    //Enpower
    class EnpowerAdminStateStr extends Characteristic {
        constructor() {
            super('Charge status', '00000171-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnpowerAdminStateStr = EnpowerAdminStateStr;

    class EnpowerCommunicating extends Characteristic {
        constructor() {
            super('Communicating', '00000172-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnpowerCommunicating = EnpowerCommunicating;

    class EnpowerOperating extends Characteristic {
        constructor() {
            super('Operating', '00000173-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnpowerOperating = EnpowerOperating;

    class EnpowerCommLevelSubGhz extends Characteristic {
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
    Characteristic.EnpowerCommLevelSubGhz = EnpowerCommLevelSubGhz;

    class EnpowerCommLevel24Ghz extends Characteristic {
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
    Characteristic.EnpowerCommLevel24Ghz = EnpowerCommLevel24Ghz;

    class EnpowerTemperature extends Characteristic {
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
    Characteristic.EnpowerTemperature = EnpowerTemperature;

    class EnpowerMainsAdminState extends Characteristic {
        constructor() {
            super('Admin state', '00000177-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnpowerMainsAdminState = EnpowerMainsAdminState;

    class EnpowerMainsOperState extends Characteristic {
        constructor() {
            super('Operating state', '00000178-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnpowerMainsOperState = EnpowerMainsOperState;

    class EnpowerEnpwrGridMode extends Characteristic {
        constructor() {
            super('Grid mode', '00000179-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnpowerEnpwrGridMode = EnpowerEnpwrGridMode;

    class EnpowerEnchgGridMode extends Characteristic {
        constructor() {
            super('Encharge grid mode', '00000181-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnpowerEnchgGridMode = EnpowerEnchgGridMode;

    class EnpowerGridProfile extends Characteristic {
        constructor() {
            super('Grid profile', '00000182-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnpowerGridProfile = EnpowerGridProfile;

    class EnpowerStatus extends Characteristic {
        constructor() {
            super('Status', '00000183-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnpowerStatus = EnpowerStatus;

    class EnpowerLastReportDate extends Characteristic {
        constructor() {
            super('Last report', '00000184-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnpowerLastReportDate = EnpowerLastReportDate;

    //Enpower service
    class EnpowerService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000008-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnpowerAdminStateStr);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnpowerOperating);
            this.addOptionalCharacteristic(Characteristic.EnpowerCommunicating);
            this.addOptionalCharacteristic(Characteristic.EnpowerCommLevelSubGhz);
            this.addOptionalCharacteristic(Characteristic.EnpowerCommLevel24Ghz);
            this.addOptionalCharacteristic(Characteristic.EnpowerTemperature);
            this.addOptionalCharacteristic(Characteristic.EnpowerMainsAdminState);
            this.addOptionalCharacteristic(Characteristic.EnpowerMainsOperState);
            this.addOptionalCharacteristic(Characteristic.EnpowerEnpwrGridMode);
            this.addOptionalCharacteristic(Characteristic.EnpowerEnchgGridMode);
            this.addOptionalCharacteristic(Characteristic.EnpowerGridProfile);
            this.addOptionalCharacteristic(Characteristic.EnpowerStatus);
            this.addOptionalCharacteristic(Characteristic.EnpowerLastReportDate);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnpowerService = EnpowerService;

    //Ensemble
    class EnsembleRestPower extends Characteristic {
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
    Characteristic.EnsembleRestPower = EnsembleRestPower;

    class EnsembleFrequencyBiasHz extends Characteristic {
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
    Characteristic.EnsembleFrequencyBiasHz = EnsembleFrequencyBiasHz;

    class EnsembleVoltageBiasV extends Characteristic {
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
    Characteristic.EnsembleVoltageBiasV = EnsembleVoltageBiasV;

    class EnsembleFrequencyBiasHzQ8 extends Characteristic {
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
    Characteristic.EnsembleFrequencyBiasHzQ8 = EnsembleFrequencyBiasHzQ8;

    class EnsembleVoltageBiasVQ5 extends Characteristic {
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
    Characteristic.EnsembleVoltageBiasVQ5 = EnsembleVoltageBiasVQ5;

    class EnsembleFrequencyBiasHzPhaseB extends Characteristic {
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
    Characteristic.EnsembleFrequencyBiasHzPhaseB = EnsembleFrequencyBiasHzPhaseB;

    class EnsembleVoltageBiasVPhaseB extends Characteristic {
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
    Characteristic.EnsembleVoltageBiasVPhaseB = EnsembleVoltageBiasVPhaseB;

    class EnsembleFrequencyBiasHzQ8PhaseB extends Characteristic {
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
    Characteristic.EnsembleFrequencyBiasHzQ8PhaseB = EnsembleFrequencyBiasHzQ8PhaseB;

    class EnsembleVoltageBiasVQ5PhaseB extends Characteristic {
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
    Characteristic.EnsembleVoltageBiasVQ5PhaseB = EnsembleVoltageBiasVQ5PhaseB;

    class EnsembleFrequencyBiasHzPhaseC extends Characteristic {
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
    Characteristic.EnsembleFrequencyBiasHzPhaseC = EnsembleFrequencyBiasHzPhaseC;

    class EnsembleVoltageBiasVPhaseC extends Characteristic {
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
    Characteristic.EnsembleVoltageBiasVPhaseC = EnsembleVoltageBiasVPhaseC;

    class EnsembleFrequencyBiasHzQ8PhaseC extends Characteristic {
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
    Characteristic.EnsembleFrequencyBiasHzQ8PhaseC = EnsembleFrequencyBiasHzQ8PhaseC;

    class EnsembleVoltageBiasVQ5PhaseC extends Characteristic {
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
    Characteristic.EnsembleVoltageBiasVQ5PhaseC = EnsembleVoltageBiasVQ5PhaseC;

    class EnsembleConfiguredBackupSoc extends Characteristic {
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
    Characteristic.EnsembleConfiguredBackupSoc = EnsembleConfiguredBackupSoc;

    class EnsembleAdjustedBackupSoc extends Characteristic {
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
    Characteristic.EnsembleAdjustedBackupSoc = EnsembleAdjustedBackupSoc;

    class EnsembleAggSoc extends Characteristic {
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
    Characteristic.EnsembleAggSoc = EnsembleAggSoc;

    class EnsembleAggMaxEnergy extends Characteristic {
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
    Characteristic.EnsembleAggMaxEnergy = EnsembleAggMaxEnergy;

    class EnsembleEncAggSoc extends Characteristic {
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
    Characteristic.EnsembleEncAggSoc = EnsembleEncAggSoc;

    class EnsembleEncAggRatedPower extends Characteristic {
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
    Characteristic.EnsembleEncAggRatedPower = EnsembleEncAggRatedPower;

    class EnsembleEncAggPercentFull extends Characteristic {
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
    Characteristic.EnsembleEncAggPercentFull = EnsembleEncAggPercentFull;

    class EnsembleEncAggBackupEnergy extends Characteristic {
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
    Characteristic.EnsembleEncAggBackupEnergy = EnsembleEncAggBackupEnergy;

    class EnsembleEncAggAvailEnergy extends Characteristic {
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
    Characteristic.EnsembleEncAggAvailEnergy = EnsembleEncAggAvailEnergy;


    //Enpower service
    class EnsembleService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000009-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnsembleRestPower);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnsembleFrequencyBiasHz);
            this.addOptionalCharacteristic(Characteristic.EnsembleVoltageBiasV);
            this.addOptionalCharacteristic(Characteristic.EnsembleFrequencyBiasHzQ8);
            this.addOptionalCharacteristic(Characteristic.EnsembleVoltageBiasVQ5);
            this.addOptionalCharacteristic(Characteristic.EnsembleFrequencyBiasHzPhaseB);
            this.addOptionalCharacteristic(Characteristic.EnsembleVoltageBiasVPhaseB);
            this.addOptionalCharacteristic(Characteristic.EnsembleFrequencyBiasHzQ8PhaseB);
            this.addOptionalCharacteristic(Characteristic.EnsembleVoltageBiasVQ5PhaseB);
            this.addOptionalCharacteristic(Characteristic.EnsembleFrequencyBiasHzPhaseC);
            this.addOptionalCharacteristic(Characteristic.EnsembleVoltageBiasVPhaseC);
            this.addOptionalCharacteristic(Characteristic.EnsembleFrequencyBiasHzQ8PhaseC);
            this.addOptionalCharacteristic(Characteristic.EnsembleVoltageBiasVQ5PhaseC);
            this.addOptionalCharacteristic(Characteristic.EnsembleConfiguredBackupSoc);
            this.addOptionalCharacteristic(Characteristic.EnsembleAdjustedBackupSoc);
            this.addOptionalCharacteristic(Characteristic.EnsembleAggSoc);
            this.addOptionalCharacteristic(Characteristic.EnsembleAggMaxEnergy);
            this.addOptionalCharacteristic(Characteristic.EnsembleEncAggSoc);
            this.addOptionalCharacteristic(Characteristic.EnsembleEncAggRatedPower);
            this.addOptionalCharacteristic(Characteristic.EnsembleEncAggPercentFull);
            this.addOptionalCharacteristic(Characteristic.EnsembleEncAggBackupEnergy);
            this.addOptionalCharacteristic(Characteristic.EnsembleEncAggAvailEnergy);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnsembleService = EnsembleService;

    //Wireless connection kit
    class WirelessConnectionKitType extends Characteristic {
        constructor() {
            super('Type', '00000220-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.WirelessConnectionKitType = WirelessConnectionKitType;

    class WirelessConnectionKitConnected extends Characteristic {
        constructor() {
            super('Connected', '00000221-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.WirelessConnectionKitConnected = WirelessConnectionKitConnected;

    class WirelessConnectionKitSignalStrength extends Characteristic {
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
    Characteristic.WirelessConnectionKitSignalStrength = WirelessConnectionKitSignalStrength;

    class WirelessConnectionKitSignalStrengthMax extends Characteristic {
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
    Characteristic.WirelessConnectionKitSignalStrengthMax = WirelessConnectionKitSignalStrengthMax;

    //Wireless connection kit service
    class WirelessConnectionKitService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000010-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.WirelessConnectionKitType);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.WirelessConnectionKitConnected);
            this.addOptionalCharacteristic(Characteristic.WirelessConnectionKitSignalStrength);
            this.addOptionalCharacteristic(Characteristic.WirelessConnectionKitSignalStrengthMax);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.WirelessConnectionKitService = WirelessConnectionKitService;

    //Esub inventoty
    class EnsembleInventoryProducing extends Characteristic {
        constructor() {
            super('Producing', '00000230-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnsembleInventoryProducing = EnsembleInventoryProducing;

    class EnsembleInventoryCommunicating extends Characteristic {
        constructor() {
            super('Communicating', '00000231-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnsembleInventoryCommunicating = EnsembleInventoryCommunicating;


    class EnsembleInventoryOperating extends Characteristic {
        constructor() {
            super('Operating', '00000232-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnsembleInventoryOperating = EnsembleInventoryOperating;

    class EnsembleInventoryCommLevel extends Characteristic {
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
    Characteristic.EnsembleInventoryCommLevel = EnsembleInventoryCommLevel;

    class EnsembleInventoryStatus extends Characteristic {
        constructor() {
            super('Status', '00000234-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnsembleInventoryStatus = EnsembleInventoryStatus;

    class EnsembleInventoryFirmware extends Characteristic {
        constructor() {
            super('Firmware', '00000235-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnsembleInventoryFirmware = EnsembleInventoryFirmware;

    class EnsembleInventoryLastReportDate extends Characteristic {
        constructor() {
            super('Last report', '00000236-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnsembleInventoryLastReportDate = EnsembleInventoryLastReportDate;

    //eusb service
    class EnsembleInventoryService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000011-000B-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnsembleInventoryProducing);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnsembleInventoryCommunicating);
            this.addOptionalCharacteristic(Characteristic.EnsembleInventoryOperating);
            this.addOptionalCharacteristic(Characteristic.EnsembleInventoryCommLevel);
            this.addOptionalCharacteristic(Characteristic.EnsembleInventoryStatus);
            this.addOptionalCharacteristic(Characteristic.EnsembleInventoryFirmware);
            this.addOptionalCharacteristic(Characteristic.EnsembleInventoryLastReportDate);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnsembleInventoryService = EnsembleInventoryService;

    // live data 
    class LiveDataActivePower extends Characteristic {
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
    Characteristic.LiveDataActivePower = LiveDataActivePower;

    class LiveDataActivePowerL1 extends Characteristic {
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
    Characteristic.LiveDataActivePowerL1 = LiveDataActivePowerL1;


    class LiveDataActivePowerL2 extends Characteristic {
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
    Characteristic.LiveDataActivePowerL2 = LiveDataActivePowerL2;


    class LiveDataActivePowerL3 extends Characteristic {
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
    Characteristic.LiveDataActivePowerL3 = LiveDataActivePowerL3;


    class LiveDataApparentPower extends Characteristic {
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
    Characteristic.LiveDataApparentPower = LiveDataApparentPower;

    class LiveDataApparentPowerL1 extends Characteristic {
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
    Characteristic.LiveDataApparentPowerL1 = LiveDataApparentPowerL1;

    class LiveDataApparentPowerL2 extends Characteristic {
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
    Characteristic.LiveDataApparentPowerL2 = LiveDataApparentPowerL2;

    class LiveDataApparentPowerL3 extends Characteristic {
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
    Characteristic.LiveDataApparentPowerL3 = LiveDataApparentPowerL3;

    //live data service
    class LiveDataService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000012-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.LiveDataActivePower);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.LiveDataActivePowerL1);
            this.addOptionalCharacteristic(Characteristic.LiveDataActivePowerL2);
            this.addOptionalCharacteristic(Characteristic.LiveDataActivePowerL3);
            this.addOptionalCharacteristic(Characteristic.LiveDataApparentPower);
            this.addOptionalCharacteristic(Characteristic.LiveDataApparentPowerL1);
            this.addOptionalCharacteristic(Characteristic.LiveDataApparentPowerL2);
            this.addOptionalCharacteristic(Characteristic.LiveDataApparentPowerL3);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.LiveDataService = LiveDataService;

    //generator
    class EnsembleGeneratorAdminMode extends Characteristic {
        constructor() {
            super('Admin mode', '00000250-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnsembleGeneratorAdminMode = EnsembleGeneratorAdminMode;

    class EnsembleGeneratorType extends Characteristic {
        constructor() {
            super('Type', '00000251-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnsembleGeneratorType = EnsembleGeneratorType;

    class EnsembleGeneratorAdminState extends Characteristic {
        constructor() {
            super('Admin state', '00000252-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnsembleGeneratorAdminState = EnsembleGeneratorAdminState;

    class EnsembleGeneratorOperState extends Characteristic {
        constructor() {
            super('Operation state', '00000253-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnsembleGeneratorOperState = EnsembleGeneratorOperState;

    class EnsembleGeneratorStartSoc extends Characteristic {
        constructor() {
            super('Start soc', '00000254-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnsembleGeneratorStartSoc = EnsembleGeneratorStartSoc;

    class EnsembleGeneratorStopSoc extends Characteristic {
        constructor() {
            super('Stop soc', '00000255-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnsembleGeneratorStopSoc = EnsembleGeneratorStopSoc;

    class EnsembleGeneratorExexOn extends Characteristic {
        constructor() {
            super('Exec on', '00000256-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnsembleGeneratorExexOn = EnsembleGeneratorExexOn;

    class EnsembleGeneratorShedule extends Characteristic {
        constructor() {
            super('Schedule', '00000257-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnsembleGeneratorShedule = EnsembleGeneratorShedule;

    class EnsembleGeneratorPresent extends Characteristic {
        constructor() {
            super('Present', '00000258-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnsembleGeneratorPresent = EnsembleGeneratorPresent;


    //generator service
    class GerneratorService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000013-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.EnsembleGeneratorAdminMode);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.EnsembleGeneratorType);
            this.addOptionalCharacteristic(Characteristic.EnsembleGeneratorAdminState);
            this.addOptionalCharacteristic(Characteristic.EnsembleGeneratorOperState);
            this.addOptionalCharacteristic(Characteristic.EnsembleGeneratorStartSoc);
            this.addOptionalCharacteristic(Characteristic.EnsembleGeneratorStopSoc);
            this.addOptionalCharacteristic(Characteristic.EnsembleGeneratorExexOn);
            this.addOptionalCharacteristic(Characteristic.EnsembleGeneratorShedule);
            this.addOptionalCharacteristic(Characteristic.EnsembleGeneratorPresent);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.GerneratorService = GerneratorService;
};