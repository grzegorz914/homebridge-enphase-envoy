// Home Assistant MQTT discovery, native sensor entities with the power and energy data of the Envoy meters.
// The lifetime energy sensors fit the Home Assistant Energy dashboard: Production energy lifetime (solar),
// Consumption Net energy lifetime (from the grid) and Consumption Net energy lifetime upload (to the grid).

// Meters of the power and energy data of the plugin and their fields, every field with a value becomes a sensor
const Meters = {
    production: { name: 'Production', measurementType: 'Production' },
    consumption_net: { name: 'Consumption Net', measurementType: 'Consumption Net' },
    consumption_total: { name: 'Consumption Total', measurementType: 'Consumption Total' }
};
const W = { device_class: 'power', state_class: 'measurement', unit_of_measurement: 'W', suggested_display_precision: 0 };
const KWH = { device_class: 'energy', state_class: 'total_increasing', unit_of_measurement: 'kWh', suggested_display_precision: 2 };
// field of the data: [key suffix, name, sensor, Wh to kWh]
const Fields = [
    ['power', 'power', 'power', W],
    ['powerPeak', 'power_peak', 'power peak', W],
    ['energyToday', 'energy_today', 'energy today', KWH, true],
    ['energyTodayUpload', 'energy_today_upload', 'energy today upload', KWH, true],
    ['energyTodayFromPv', 'energy_today_from_pv', 'energy today from PV', KWH, true],
    // Rolling sum, it goes down too
    ['energyLastSevenDays', 'energy_last_seven_days', 'energy last seven days', { ...KWH, state_class: 'total' }, true],
    ['energyLifetime', 'energy_lifetime', 'energy lifetime', KWH, true],
    ['energyLifetimeUpload', 'energy_lifetime_upload', 'energy lifetime upload', KWH, true],
    ['energyLifetimeFromPv', 'energy_lifetime_from_pv', 'energy lifetime from PV', KWH, true],
    ['reactivePower', 'reactive_power', 'reactive power', { device_class: 'reactive_power', state_class: 'measurement', unit_of_measurement: 'var', suggested_display_precision: 0 }],
    ['apparentPower', 'apparent_power', 'apparent power', { device_class: 'apparent_power', state_class: 'measurement', unit_of_measurement: 'VA', suggested_display_precision: 0 }],
    ['current', 'current', 'current', { device_class: 'current', state_class: 'measurement', unit_of_measurement: 'A', suggested_display_precision: 2 }],
    ['voltage', 'voltage', 'voltage', { device_class: 'voltage', state_class: 'measurement', unit_of_measurement: 'V', suggested_display_precision: 1 }],
    ['pwrFactor', 'power_factor', 'power factor', { device_class: 'power_factor', state_class: 'measurement', suggested_display_precision: 2 }],
    ['frequency', 'frequency', 'frequency', { device_class: 'frequency', state_class: 'measurement', unit_of_measurement: 'Hz', suggested_display_precision: 2 }]
];

// Sensors, a sensor is created when its value is known the first time (meters and batteries depend on the system)
const Sensors = {};
for (const [meterKey, meter] of Object.entries(Meters)) {
    for (const [, suffix, name, sensor] of Fields) {
        Sensors[`${meterKey}_${suffix}`] = { name: `${meter.name} ${name}`, ...sensor };
    }
}
Object.assign(Sensors, {
    battery_level: { name: 'Battery level', device_class: 'battery', state_class: 'measurement', unit_of_measurement: '%', suggested_display_precision: 0 },
    battery_power: { name: 'Battery power', device_class: 'power', state_class: 'measurement', unit_of_measurement: 'W', suggested_display_precision: 0, icon: 'mdi:home-battery' },
    battery_energy: { name: 'Battery energy', device_class: 'energy_storage', state_class: 'measurement', unit_of_measurement: 'kWh', suggested_display_precision: 2, icon: 'mdi:home-battery' }
});

const number = (value) => typeof value === 'number' && Number.isFinite(value) ? value : null;
// Wh to kWh with Wh precision
const kWh = (value) => number(value) === null ? null : Math.round(value) / 1000;

class HaDiscovery {
    constructor(mqtt, config) {
        // + and # are MQTT wildcards, Home Assistant would subscribe to a pattern instead of the device topic
        if (/[+#]/.test(mqtt.config.prefix)) {
            throw new Error(`MQTT prefix ${mqtt.config.prefix} must not contain + or #, rename the device or set a prefix`);
        }

        this.mqtt = mqtt;
        this.baseId = `enphase_${String(config.serialNumber).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        this.stateTopic = `${mqtt.config.prefix}/HA State`;
        this.device = {
            identifiers: [this.baseId],
            name: config.name,
            manufacturer: 'Enphase Energy',
            ...(config.model ? { model: String(config.model) } : {}),
            ...(config.swVersion ? { sw_version: String(config.swVersion) } : {}),
            ...(config.serialNumber ? { serial_number: String(config.serialNumber) } : {})
        };
        this.origin = { name: 'homebridge-enphase-envoy', support_url: 'https://github.com/grzegorz914/homebridge-enphase-envoy' };

        this.lastConfig = {};
        this.lastState = '';
    }

    // The broker may have lost the retained messages (restart without persistence), the next publish sends everything again
    reset() {
        this.lastConfig = {};
        this.lastState = '';
    }

    // Sensors with a value get their discovery message, then the state of all of them
    async publish(state) {
        for (const [key, sensor] of Object.entries(Sensors)) {
            if (state[key] === null || state[key] === undefined) continue;
            await this.publishSensor(key, sensor);
        }
        await this.updateState(state);
    }

    async publishSensor(key, sensor) {
        const objectId = `${this.baseId}_${key}`;
        const topic = `${this.mqtt.haPrefix}/sensor/${objectId}/config`;
        const config = {
            unique_id: objectId,
            device: this.device,
            origin: this.origin,
            availability_topic: this.mqtt.availabilityTopic,
            state_topic: this.stateTopic,
            // null renders None, Home Assistant then shows the sensor as unknown instead of the last value
            value_template: `{{ value_json.${key} }}`,
            ...sensor
        };

        const payload = JSON.stringify(config);
        if (this.lastConfig[topic] === payload) return false;
        this.lastConfig[topic] = payload;
        await this.mqtt.publishRetained(topic, payload);
        return true;
    }

    async updateState(state) {
        const payload = JSON.stringify(state);
        if (payload === this.lastState) return false;
        this.lastState = payload;
        await this.mqtt.publishRetained(this.stateTopic, payload);
        return true;
    }

    // State of the sensors from the power and energy and the live data of the plugin, W and kWh
    static state(pv) {
        const data = pv.powerAndEnergyData?.data ?? [];
        const state = {};
        for (const [meterKey, meter] of Object.entries(Meters)) {
            const values = data.find(d => d?.measurementType === meter.measurementType) ?? {};
            for (const [field, suffix, , , energy] of Fields) {
                state[`${meterKey}_${suffix}`] = energy ? kWh(values[field]) : number(values[field]);
            }
        }

        const liveMeters = pv.liveData?.meters ?? {};
        const storage = (pv.liveData?.devices ?? []).find(d => d?.type === 'Storage') ?? {};
        const encharges = number(liveMeters.encAggEnergyKw);
        const acbs = number(liveMeters.ecbEnergyKw);
        state.battery_level = number(liveMeters.soc);
        // Positive discharge, negative charge
        state.battery_power = number(storage.power);
        state.battery_energy = encharges !== null || acbs !== null ? (encharges ?? 0) + (acbs ?? 0) : null;
        return state;
    }
}

export default HaDiscovery;
