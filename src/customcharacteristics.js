export default (api) => {
    const { Service, Characteristic, Units, Formats, Perms } = api.hap;

    //Envoy
    class Alerts extends Characteristic {
        constructor() {
            super('Alerts', '00000001-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.Alerts = Alerts;

    class GridProfile extends Characteristic {
        constructor() {
            super('Grid profile', '00000002-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.GridProfile = GridProfile;

    class PrimaryInterface extends Characteristic {
        constructor() {
            super('Network interface', '00000011-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.PrimaryInterface = PrimaryInterface;

    class NetworkWebComm extends Characteristic {
        constructor() {
            super('Web communication', '00000012-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.NetworkWebComm = NetworkWebComm;


    class EverReportedToEnlighten extends Characteristic {
        constructor() {
            super('Report to Enlighten', '00000013-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EverReportedToEnlighten = EverReportedToEnlighten;

    class CommNumAndLevel extends Characteristic {
        constructor() {
            super('Devices / Level', '00000014-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.CommNumAndLevel = CommNumAndLevel;

    class CommNumNsrbAndLevel extends Characteristic {
        constructor() {
            super('Q-Relays / Level', '00000015-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.CommNumNsrbAndLevel = CommNumNsrbAndLevel;

    class CommNumPcuAndLevel extends Characteristic {
        constructor() {
            super('Microinverters / Level', '00000016-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.CommNumPcuAndLevel = CommNumPcuAndLevel;

    class CommNumAcbAndLevel extends Characteristic {
        constructor() {
            super('AC Batteries / Level', '00000017-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.CommNumAcbAndLevel = CommNumAcbAndLevel;

    class CommNumEnchgAndLevel extends Characteristic {
        constructor() {
            super('Encharges / Level', '00000018-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.CommNumEnchgAndLevel = CommNumEnchgAndLevel;

    class DbSize extends Characteristic {
        constructor() {
            super('DB size', '00000019-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.DbSize = DbSize;

    class Tariff extends Characteristic {
        constructor() {
            super('Tariff', '00000021-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.Tariff = Tariff;

    class Firmware extends Characteristic {
        constructor() {
            super('Firmware', '00000022-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.Firmware = Firmware;

    class UpdateStatus extends Characteristic {
        constructor() {
            super('Update status', '00000023-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.UpdateStatus = UpdateStatus;

    class TimeZone extends Characteristic {
        constructor() {
            super('Time Zone', '00000024-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.TimeZone = TimeZone;

    class CurrentDateTime extends Characteristic {
        constructor() {
            super('Local time', '00000025-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.CurrentDateTime = CurrentDateTime;

    class LastEnlightenReporDate extends Characteristic {
        constructor() {
            super('Last report to Enlighten', '00000026-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.LastEnlightenReporDate = LastEnlightenReporDate;

    class EnpowerGridState extends Characteristic {
        constructor() {
            super('Enpower grid state', '00000027-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnpowerGridState = EnpowerGridState;

    class EnpowerGridMode extends Characteristic {
        constructor() {
            super('Enpower grid mode', '00000028-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnpowerGridMode = EnpowerGridMode;

    class GeneratorState extends Characteristic {
        constructor() {
            super('Generator state', '00000301-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.GeneratorState = GeneratorState;

    class GeneratorMode extends Characteristic {
        constructor() {
            super('Generator mode', '00000302-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.GeneratorMode = GeneratorMode;


    class CheckCommLevel extends Characteristic {
        constructor() {
            super('Plc level check', '00000029-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.CheckCommLevel = CheckCommLevel;

    class ProductionState extends Characteristic {
        constructor() {
            super('Production state', '00000030-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.ProductionState = ProductionState;

    class DataRefresh extends Characteristic {
        constructor() {
            super('Data sampling', '00000300-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.DataRefresh = DataRefresh;

    //Q-Relay
    class RelayState extends Characteristic {
        constructor() {
            super('Relay', '00000031-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.RelayState = RelayState;

    class LinesCount extends Characteristic {
        constructor() {
            super('Lines', '00000032-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.LinesCount = LinesCount;

    class Line1Connected extends Characteristic {
        constructor() {
            super('Line 1', '00000033-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.Line1Connected = Line1Connected;

    class Line2Connected extends Characteristic {
        constructor() {
            super('Line 2', '00000034-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.Line2Connected = Line2Connected;

    class Line3Connected extends Characteristic {
        constructor() {
            super('Line 3', '00000035-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.Line3Connected = Line3Connected;

    class Producing extends Characteristic {
        constructor() {
            super('Producing', '00000036-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.Producing = Producing;

    class Communicating extends Characteristic {
        constructor() {
            super('Communicating', '00000037-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.Communicating = Communicating;

    class Provisioned extends Characteristic {
        constructor() {
            super('Provisioned', '00000038-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.Provisioned = Provisioned;

    class Operating extends Characteristic {
        constructor() {
            super('Operating', '00000039-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.Operating = Operating;

    class CommLevel extends Characteristic {
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
    Characteristic.CommLevel = CommLevel;

    class Status extends Characteristic {
        constructor() {
            super('Status', '00000042-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.Status = Status;

    class LastReportDate extends Characteristic {
        constructor() {
            super('Last report', '00000044-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.LastReportDate = LastReportDate;

    // current meters
    class State extends Characteristic {
        constructor() {
            super('State', '00000051-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.State = State;

    class MeasurementType extends Characteristic {
        constructor() {
            super(' type', '00000052-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MeasurementType = MeasurementType;

    class PhaseCount extends Characteristic {
        constructor() {
            super('Phase count', '00000053-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.UINT8,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.PhaseCount = PhaseCount;

    class PhaseMode extends Characteristic {
        constructor() {
            super('Phase mode', '00000054-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.PhaseMode = PhaseMode;

    class MeteringStatus extends Characteristic {
        constructor() {
            super('Metering status', '00000055-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MeteringStatus = MeteringStatus;

    class StatusFlags extends Characteristic {
        constructor() {
            super('Status flag', '00000056-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.StatusFlags = StatusFlags;

    class Power extends Characteristic {
        constructor() {
            super('Power', '00000057-000B-1000-8000-0026BB765291');
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

    class ApparentPower extends Characteristic {
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
    Characteristic.ApparentPower = ApparentPower;

    class ReactivePower extends Characteristic {
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
    Characteristic.ReactivePower = ReactivePower;

    class PwrFactor extends Characteristic {
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
    Characteristic.PwrFactor = PwrFactor;

    class Voltage extends Characteristic {
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
    Characteristic.Voltage = Voltage;

    class Current extends Characteristic {
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
    Characteristic.Current = Current;

    class Frequency extends Characteristic {
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
    Characteristic.Frequency = Frequency;

    //Power and Energy characteristics
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

    //AC Batterie
    class Energy extends Characteristic {
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
    Characteristic.Energy = Energy;

    class PercentFull extends Characteristic {
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
    Characteristic.PercentFull = PercentFull;

    class ActiveCount extends Characteristic {
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
    Characteristic.ActiveCount = ActiveCount;

    //AC Batterie
    class ChargeStatus extends Characteristic {
        constructor() {
            super('Charge status', '00000111-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.ChargeStatus = ChargeStatus;

    class SleepEnabled extends Characteristic {
        constructor() {
            super('Sleep enabled', '00000117-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.SleepEnabled = SleepEnabled;

    class MaxCellTemp extends Characteristic {
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
    Characteristic.MaxCellTemp = MaxCellTemp;

    class SleepMinSoc extends Characteristic {
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
    Characteristic.SleepMinSoc = SleepMinSoc;

    class SleepMaxSoc extends Characteristic {
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
    Characteristic.SleepMaxSoc = SleepMaxSoc;

    //Microinverter
    class PowerW extends Characteristic {
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
    Characteristic.PowerW = PowerW;

    class EnergyTodayWh extends Characteristic {
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
    Characteristic.EnergyTodayWh = EnergyTodayWh;

    class EnergyYesterdayWh extends Characteristic {
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
    Characteristic.EnergyYesterdayWh = EnergyYesterdayWh;

    class VoltageDc extends Characteristic {
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
    Characteristic.VoltageDc = VoltageDc;

    class CurrentDc extends Characteristic {
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
    Characteristic.CurrentDc = CurrentDc;

    class Temperature extends Characteristic {
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
    Characteristic.Temperature = Temperature;

    //Encharge
    class AdminStateStr extends Characteristic {
        constructor() {
            super('Charge status', '00000151-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.AdminStateStr = AdminStateStr;

    class CommLevelSubGhz extends Characteristic {
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
    Characteristic.CommLevelSubGhz = CommLevelSubGhz

    class CommLevel24Ghz extends Characteristic {
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
    Characteristic.CommLevel24Ghz = CommLevel24Ghz;

    class LedStatus extends Characteristic {
        constructor() {
            super('LED status', '00000161-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.LedStatus = LedStatus;

    class RealPowerW extends Characteristic {
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
    Characteristic.RealPowerW = RealPowerW;

    class Capacity extends Characteristic {
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
    Characteristic.Capacity = Capacity;

    class DcSwitchOff extends Characteristic {
        constructor() {
            super('DC switch OFF', '00000164-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.DcSwitchOff = DcSwitchOff;

    class Rev extends Characteristic {
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
    Characteristic.Rev = Rev;

    //Enpowe

    class MainsAdminState extends Characteristic {
        constructor() {
            super('Admin state', '00000177-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MainsAdminState = MainsAdminState;

    class MainsOperState extends Characteristic {
        constructor() {
            super('Operating state', '00000178-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.MainsOperState = MainsOperState;

    class EnpwrGridMode extends Characteristic {
        constructor() {
            super('Grid mode', '00000179-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnpwrGridMode = EnpwrGridMode;

    class EnchgGridMode extends Characteristic {
        constructor() {
            super('Encharge grid mode', '00000181-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.EnchgGridMode = EnchgGridMode;

    //Ensemble
    class RestPower extends Characteristic {
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
    Characteristic.RestPower = RestPower;

    class FrequencyBiasHz extends Characteristic {
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
    Characteristic.FrequencyBiasHz = FrequencyBiasHz;

    class VoltageBiasV extends Characteristic {
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
    Characteristic.VoltageBiasV = VoltageBiasV;

    class FrequencyBiasHzQ8 extends Characteristic {
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
    Characteristic.FrequencyBiasHzQ8 = FrequencyBiasHzQ8;

    class VoltageBiasVQ5 extends Characteristic {
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
    Characteristic.VoltageBiasVQ5 = VoltageBiasVQ5;

    class FrequencyBiasHzPhaseB extends Characteristic {
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
    Characteristic.FrequencyBiasHzPhaseB = FrequencyBiasHzPhaseB;

    class VoltageBiasVPhaseB extends Characteristic {
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
    Characteristic.VoltageBiasVPhaseB = VoltageBiasVPhaseB;

    class FrequencyBiasHzQ8PhaseB extends Characteristic {
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
    Characteristic.FrequencyBiasHzQ8PhaseB = FrequencyBiasHzQ8PhaseB;

    class VoltageBiasVQ5PhaseB extends Characteristic {
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
    Characteristic.VoltageBiasVQ5PhaseB = VoltageBiasVQ5PhaseB;

    class FrequencyBiasHzPhaseC extends Characteristic {
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
    Characteristic.FrequencyBiasHzPhaseC = FrequencyBiasHzPhaseC;

    class VoltageBiasVPhaseC extends Characteristic {
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
    Characteristic.VoltageBiasVPhaseC = VoltageBiasVPhaseC;

    class FrequencyBiasHzQ8PhaseC extends Characteristic {
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
    Characteristic.FrequencyBiasHzQ8PhaseC = FrequencyBiasHzQ8PhaseC;

    class VoltageBiasVQ5PhaseC extends Characteristic {
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
    Characteristic.VoltageBiasVQ5PhaseC = VoltageBiasVQ5PhaseC;

    class ConfiguredBackupSoc extends Characteristic {
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
    Characteristic.ConfiguredBackupSoc = ConfiguredBackupSoc;

    class AdjustedBackupSoc extends Characteristic {
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
    Characteristic.AdjustedBackupSoc = AdjustedBackupSoc;

    class AggSoc extends Characteristic {
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
    Characteristic.AggSoc = AggSoc;

    class AggMaxEnergy extends Characteristic {
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
    Characteristic.AggMaxEnergy = AggMaxEnergy;

    class EncAggSoc extends Characteristic {
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
    Characteristic.EncAggSoc = EncAggSoc;

    class EncAggRatedPower extends Characteristic {
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
    Characteristic.EncAggRatedPower = EncAggRatedPower;

    class EncAggPercentFull extends Characteristic {
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
    Characteristic.EncAggPercentFull = EncAggPercentFull;

    class EncAggBackupEnergy extends Characteristic {
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
    Characteristic.EncAggBackupEnergy = EncAggBackupEnergy;

    class EncAggAvailEnergy extends Characteristic {
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
    Characteristic.EncAggAvailEnergy = EncAggAvailEnergy;

    //Wireless connection kit
    class Type extends Characteristic {
        constructor() {
            super('Type', '00000220-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.Type = Type;

    class Connected extends Characteristic {
        constructor() {
            super('Connected', '00000221-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.BOOL,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.Connected = Connected;

    class SignalStrength extends Characteristic {
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
    Characteristic.SignalStrength = SignalStrength;

    class SignalStrengthMax extends Characteristic {
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
    Characteristic.SignalStrengthMax = SignalStrengthMax;

    // live data 
    class PowerL1 extends Characteristic {
        constructor() {
            super('Power L1', '00000241-000B-1000-8000-0026BB765291');
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
    Characteristic.PowerL1 = PowerL1;


    class PowerL2 extends Characteristic {
        constructor() {
            super('Power L2', '00000242-000B-1000-8000-0026BB765291');
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
    Characteristic.PowerL2 = PowerL2;


    class PowerL3 extends Characteristic {
        constructor() {
            super('Power L3', '00000243-000B-1000-8000-0026BB765291');
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
    Characteristic.PowerL3 = PowerL3;

    class ApparentPowerL1 extends Characteristic {
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
    Characteristic.ApparentPowerL1 = ApparentPowerL1;

    class ApparentPowerL2 extends Characteristic {
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
    Characteristic.ApparentPowerL2 = ApparentPowerL2;

    class ApparentPowerL3 extends Characteristic {
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
    Characteristic.ApparentPowerL3 = ApparentPowerL3;

    //generator
    class AdminMode extends Characteristic {
        constructor() {
            super('Admin mode', '00000250-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.AdminMode = AdminMode;

    class AdminState extends Characteristic {
        constructor() {
            super('Admin state', '00000252-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.AdminState = AdminState;

    class OperState extends Characteristic {
        constructor() {
            super('Operation state', '00000253-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.STRING,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.OperState = OperState;

    class StartSoc extends Characteristic {
        constructor() {
            super('Start soc', '00000254-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.StartSoc = StartSoc;

    class StopSoc extends Characteristic {
        constructor() {
            super('Stop soc', '00000255-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.StopSoc = StopSoc;

    class ExexOn extends Characteristic {
        constructor() {
            super('Exec on', '00000256-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.ExexOn = ExexOn;

    class Shedule extends Characteristic {
        constructor() {
            super('Schedule', '00000257-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.Shedule = Shedule;

    class Present extends Characteristic {
        constructor() {
            super('Present', '00000258-000B-1000-8000-0026BB765291');
            this.setProps({
                format: Formats.INT,
                perms: [Perms.PAIRED_READ, Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        }
    }
    Characteristic.Present = Present;

    //Envoy service
    class EnvoyService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000001-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.Alerts);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.GridProfile);
            this.addOptionalCharacteristic(Characteristic.PrimaryInterface);
            this.addOptionalCharacteristic(Characteristic.NetworkWebComm);
            this.addOptionalCharacteristic(Characteristic.EverReportedToEnlighten);
            this.addOptionalCharacteristic(Characteristic.CommNumAndLevel);
            this.addOptionalCharacteristic(Characteristic.CommNumNsrbAndLevel);
            this.addOptionalCharacteristic(Characteristic.CommNumPcuAndLevel);
            this.addOptionalCharacteristic(Characteristic.CommNumAcbAndLevel);
            this.addOptionalCharacteristic(Characteristic.CommNumEnchgAndLevel);
            this.addOptionalCharacteristic(Characteristic.DbSize);
            this.addOptionalCharacteristic(Characteristic.Tariff);
            this.addOptionalCharacteristic(Characteristic.Firmware);
            this.addOptionalCharacteristic(Characteristic.UpdateStatus);
            this.addOptionalCharacteristic(Characteristic.TimeZone);
            this.addOptionalCharacteristic(Characteristic.CurrentDateTime);
            this.addOptionalCharacteristic(Characteristic.LastEnlightenReporDate);
            this.addOptionalCharacteristic(Characteristic.EnpowerGridState);
            this.addOptionalCharacteristic(Characteristic.EnpowerGridMode);
            this.addOptionalCharacteristic(Characteristic.GeneratorState);
            this.addOptionalCharacteristic(Characteristic.GeneratorMode);
            this.addOptionalCharacteristic(Characteristic.CheckCommLevel);
            this.addOptionalCharacteristic(Characteristic.ProductionState);
            this.addOptionalCharacteristic(Characteristic.DataRefresh);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnvoyService = EnvoyService;

    //qrelay service
    class QrelayService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000002-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.RelayState);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.LinesCount);
            this.addOptionalCharacteristic(Characteristic.Line1Connected);
            this.addOptionalCharacteristic(Characteristic.Line2Connected);
            this.addOptionalCharacteristic(Characteristic.Line3Connected);
            this.addOptionalCharacteristic(Characteristic.Producing);
            this.addOptionalCharacteristic(Characteristic.Communicating);
            this.addOptionalCharacteristic(Characteristic.Provisioned);
            this.addOptionalCharacteristic(Characteristic.Operating);
            this.addOptionalCharacteristic(Characteristic.CommLevel);
            this.addOptionalCharacteristic(Characteristic.Status);
            this.addOptionalCharacteristic(Characteristic.Firmware);
            this.addOptionalCharacteristic(Characteristic.LastReportDate);
            this.addOptionalCharacteristic(Characteristic.GridProfile);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.QrelayService = QrelayService;

    //Meters service
    class MeterService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000003-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.State);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.PhaseMode);
            this.addOptionalCharacteristic(Characteristic.PhaseCount);
            this.addOptionalCharacteristic(Characteristic.MeasurementType);
            this.addOptionalCharacteristic(Characteristic.MeteringStatus);
            this.addOptionalCharacteristic(Characteristic.StatusFlags);
            this.addOptionalCharacteristic(Characteristic.Power);
            this.addOptionalCharacteristic(Characteristic.ApparentPower);
            this.addOptionalCharacteristic(Characteristic.ReactivePower);
            this.addOptionalCharacteristic(Characteristic.PwrFactor);
            this.addOptionalCharacteristic(Characteristic.Voltage);
            this.addOptionalCharacteristic(Characteristic.Current);
            this.addOptionalCharacteristic(Characteristic.Frequency);
            this.addOptionalCharacteristic(Characteristic.LastReportDate);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.MeterService = MeterService;

    //Power production service
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
            this.addOptionalCharacteristic(Characteristic.LastReportDate);
            this.addOptionalCharacteristic(Characteristic.PowerPeakReset);
            this.addOptionalCharacteristic(Characteristic.Frequency);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.PowerAndEnergyService = PowerAndEnergyService;

    //AC Batterie summary service
    class AcBatterieSummaryService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000005-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.Power);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.Energy);
            this.addOptionalCharacteristic(Characteristic.PercentFull);
            this.addOptionalCharacteristic(Characteristic.ActiveCount);
            this.addOptionalCharacteristic(Characteristic.State);
            this.addOptionalCharacteristic(Characteristic.LastReportDate);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.AcBatterieSummaryService = AcBatterieSummaryService;

    //AC Batterie service
    class AcBatterieService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000006-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.ChargeStatus);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.Producing);
            this.addOptionalCharacteristic(Characteristic.Communicating);
            this.addOptionalCharacteristic(Characteristic.Provisioned);
            this.addOptionalCharacteristic(Characteristic.Operating);
            this.addOptionalCharacteristic(Characteristic.CommLevel);
            this.addOptionalCharacteristic(Characteristic.SleepEnabled);
            this.addOptionalCharacteristic(Characteristic.PercentFull);
            this.addOptionalCharacteristic(Characteristic.MaxCellTemp);
            this.addOptionalCharacteristic(Characteristic.SleepMinSoc);
            this.addOptionalCharacteristic(Characteristic.SleepMaxSoc);
            this.addOptionalCharacteristic(Characteristic.Status);
            this.addOptionalCharacteristic(Characteristic.Firmware);
            this.addOptionalCharacteristic(Characteristic.LastReportDate);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.AcBatterieService = AcBatterieService;

    //Microinverter service
    class MicroinverterService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000007-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.PowerW);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.PowerPeak);
            this.addOptionalCharacteristic(Characteristic.EnergyTodayWh);
            this.addOptionalCharacteristic(Characteristic.EnergyYesterdayWh);
            this.addOptionalCharacteristic(Characteristic.EnergyLastSevenDays);
            this.addOptionalCharacteristic(Characteristic.EnergyLifetime);
            this.addOptionalCharacteristic(Characteristic.Producing);
            this.addOptionalCharacteristic(Characteristic.Communicating);
            this.addOptionalCharacteristic(Characteristic.Provisioned);
            this.addOptionalCharacteristic(Characteristic.Operating);
            this.addOptionalCharacteristic(Characteristic.CommLevel);
            this.addOptionalCharacteristic(Characteristic.Status);
            this.addOptionalCharacteristic(Characteristic.Firmware);
            this.addOptionalCharacteristic(Characteristic.LastReportDate);
            this.addOptionalCharacteristic(Characteristic.GridProfile);
            this.addOptionalCharacteristic(Characteristic.Current);
            this.addOptionalCharacteristic(Characteristic.Voltage);
            this.addOptionalCharacteristic(Characteristic.Frequency);
            this.addOptionalCharacteristic(Characteristic.VoltageDc);
            this.addOptionalCharacteristic(Characteristic.CurrentDc);
            this.addOptionalCharacteristic(Characteristic.Temperature);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.MicroinverterService = MicroinverterService;

    //Encharge service
    class EnchargeService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000014-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.AdminStateStr);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.Operating);
            this.addOptionalCharacteristic(Characteristic.Communicating);
            this.addOptionalCharacteristic(Characteristic.CommLevelSubGhz);
            this.addOptionalCharacteristic(Characteristic.CommLevel24Ghz);
            this.addOptionalCharacteristic(Characteristic.SleepEnabled);
            this.addOptionalCharacteristic(Characteristic.PercentFull);
            this.addOptionalCharacteristic(Characteristic.Temperature);
            this.addOptionalCharacteristic(Characteristic.MaxCellTemp);
            this.addOptionalCharacteristic(Characteristic.LedStatus);
            this.addOptionalCharacteristic(Characteristic.RealPowerW);
            this.addOptionalCharacteristic(Characteristic.Capacity);
            this.addOptionalCharacteristic(Characteristic.DcSwitchOff);
            this.addOptionalCharacteristic(Characteristic.Rev);
            this.addOptionalCharacteristic(Characteristic.GridProfile);
            this.addOptionalCharacteristic(Characteristic.Status);
            this.addOptionalCharacteristic(Characteristic.LastReportDate);
            this.addOptionalCharacteristic(Characteristic.CommLevel);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnchargeService = EnchargeService;

    // Enpower service
    class EnpowerService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000008-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.AdminStateStr);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.Operating);
            this.addOptionalCharacteristic(Characteristic.Communicating);
            this.addOptionalCharacteristic(Characteristic.CommLevelSubGhz);
            this.addOptionalCharacteristic(Characteristic.CommLevel24Ghz);
            this.addOptionalCharacteristic(Characteristic.Temperature);
            this.addOptionalCharacteristic(Characteristic.MainsAdminState);
            this.addOptionalCharacteristic(Characteristic.MainsOperState);
            this.addOptionalCharacteristic(Characteristic.EnpwrGridMode);
            this.addOptionalCharacteristic(Characteristic.EnchgGridMode);
            this.addOptionalCharacteristic(Characteristic.GridProfile);
            this.addOptionalCharacteristic(Characteristic.Status);
            this.addOptionalCharacteristic(Characteristic.LastReportDate);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnpowerService = EnpowerService;

    //Ennsemble service
    class EnsembleService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000009-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.RestPower);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.FrequencyBiasHz);
            this.addOptionalCharacteristic(Characteristic.VoltageBiasV);
            this.addOptionalCharacteristic(Characteristic.FrequencyBiasHzQ8);
            this.addOptionalCharacteristic(Characteristic.VoltageBiasVQ5);
            this.addOptionalCharacteristic(Characteristic.FrequencyBiasHzPhaseB);
            this.addOptionalCharacteristic(Characteristic.VoltageBiasVPhaseB);
            this.addOptionalCharacteristic(Characteristic.FrequencyBiasHzQ8PhaseB);
            this.addOptionalCharacteristic(Characteristic.VoltageBiasVQ5PhaseB);
            this.addOptionalCharacteristic(Characteristic.FrequencyBiasHzPhaseC);
            this.addOptionalCharacteristic(Characteristic.VoltageBiasVPhaseC);
            this.addOptionalCharacteristic(Characteristic.FrequencyBiasHzQ8PhaseC);
            this.addOptionalCharacteristic(Characteristic.VoltageBiasVQ5PhaseC);
            this.addOptionalCharacteristic(Characteristic.ConfiguredBackupSoc);
            this.addOptionalCharacteristic(Characteristic.AdjustedBackupSoc);
            this.addOptionalCharacteristic(Characteristic.AggSoc);
            this.addOptionalCharacteristic(Characteristic.AggMaxEnergy);
            this.addOptionalCharacteristic(Characteristic.EncAggSoc);
            this.addOptionalCharacteristic(Characteristic.EncAggRatedPower);
            this.addOptionalCharacteristic(Characteristic.EncAggPercentFull);
            this.addOptionalCharacteristic(Characteristic.EncAggBackupEnergy);
            this.addOptionalCharacteristic(Characteristic.EncAggAvailEnergy);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnsembleService = EnsembleService;

    //Wireless connection kit service
    class WirelessConnectionKitService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000010-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.Type);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.Connected);
            this.addOptionalCharacteristic(Characteristic.SignalStrength);
            this.addOptionalCharacteristic(Characteristic.SignalStrengthMax);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.WirelessConnectionKitService = WirelessConnectionKitService;

    //Ensemble inventory service
    class EnsembleInventoryService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000011-000B-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.Producing);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.Communicating);
            this.addOptionalCharacteristic(Characteristic.Operating);
            this.addOptionalCharacteristic(Characteristic.CommLevel);
            this.addOptionalCharacteristic(Characteristic.Status);
            this.addOptionalCharacteristic(Characteristic.Firmware);
            this.addOptionalCharacteristic(Characteristic.LastReportDate);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.EnsembleInventoryService = EnsembleInventoryService;

    //Live data service
    class LiveDataService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000012-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.Power);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.PowerL1);
            this.addOptionalCharacteristic(Characteristic.PowerL2);
            this.addOptionalCharacteristic(Characteristic.PowerL3);
            this.addOptionalCharacteristic(Characteristic.ApparentPower);
            this.addOptionalCharacteristic(Characteristic.ApparentPowerL1);
            this.addOptionalCharacteristic(Characteristic.ApparentPowerL2);
            this.addOptionalCharacteristic(Characteristic.ApparentPowerL3);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.LiveDataService = LiveDataService;

    //Generator service
    class GerneratorService extends Service {
        constructor(displayName, subtype) {
            super(displayName, '00000013-000A-1000-8000-0026BB765291', subtype);
            // Mandatory Characteristics
            this.addCharacteristic(Characteristic.AdminMode);
            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.Type);
            this.addOptionalCharacteristic(Characteristic.AdminState);
            this.addOptionalCharacteristic(Characteristic.OperState);
            this.addOptionalCharacteristic(Characteristic.StartSoc);
            this.addOptionalCharacteristic(Characteristic.StopSoc);
            this.addOptionalCharacteristic(Characteristic.ExexOn);
            this.addOptionalCharacteristic(Characteristic.Shedule);
            this.addOptionalCharacteristic(Characteristic.Present);
            this.addOptionalCharacteristic(Characteristic.ConfiguredName);
        }
    }
    Service.GerneratorService = GerneratorService;
};