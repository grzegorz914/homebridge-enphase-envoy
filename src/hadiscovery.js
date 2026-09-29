// Home Assistant MQTT discovery, native sensor entities with the power and energy of the Envoy.
// The lifetime energy sensors (production, grid import, grid export, consumption) fit the Home Assistant Energy dashboard.

// Sensors, a sensor is created when its value is known the first time (meters and batteries depend on the system)
const Sensors = {
    production_power: { name: 'Production power', device_class: 'power', state_class: 'measurement', unit_of_measurement: 'W', suggested_display_precision: 0 },
    production_energy_today: { name: 'Production energy today', device_class: 'energy', state_class: 'total_increasing', unit_of_measurement: 'kWh', suggested_display_precision: 2 },
    production_energy_lifetime: { name: 'Production energy lifetime', device_class: 'energy', state_class: 'total_increasing', unit_of_measurement: 'kWh', suggested_display_precision: 2 },
    grid_power: { name: 'Grid power', device_class: 'power', state_class: 'measurement', unit_of_measurement: 'W', suggested_display_precision: 0, icon: 'mdi:transmission-tower' },
    grid_import_today: { name: 'Grid import today', device_class: 'energy', state_class: 'total_increasing', unit_of_measurement: 'kWh', suggested_display_precision: 2, icon: 'mdi:transmission-tower-import' },
    grid_export_today: { name: 'Grid export today', device_class: 'energy', state_class: 'total_increasing', unit_of_measurement: 'kWh', suggested_display_precision: 2, icon: 'mdi:transmission-tower-export' },
    grid_import_lifetime: { name: 'Grid import lifetime', device_class: 'energy', state_class: 'total_increasing', unit_of_measurement: 'kWh', suggested_display_precision: 2, icon: 'mdi:transmission-tower-import' },
    grid_export_lifetime: { name: 'Grid export lifetime', device_class: 'energy', state_class: 'total_increasing', unit_of_measurement: 'kWh', suggested_display_precision: 2, icon: 'mdi:transmission-tower-export' },
    consumption_power: { name: 'Consumption power', device_class: 'power', state_class: 'measurement', unit_of_measurement: 'W', suggested_display_precision: 0, icon: 'mdi:home-lightning-bolt' },
    consumption_energy_today: { name: 'Consumption energy today', device_class: 'energy', state_class: 'total_increasing', unit_of_measurement: 'kWh', suggested_display_precision: 2, icon: 'mdi:home-lightning-bolt' },
    consumption_energy_lifetime: { name: 'Consumption energy lifetime', device_class: 'energy', state_class: 'total_increasing', unit_of_measurement: 'kWh', suggested_display_precision: 2, icon: 'mdi:home-lightning-bolt' },
    battery_level: { name: 'Battery level', device_class: 'battery', state_class: 'measurement', unit_of_measurement: '%', suggested_display_precision: 0 },
    battery_power: { name: 'Battery power', device_class: 'power', state_class: 'measurement', unit_of_measurement: 'W', suggested_display_precision: 0, icon: 'mdi:home-battery' },
    battery_energy: { name: 'Battery energy', device_class: 'energy_storage', state_class: 'measurement', unit_of_measurement: 'kWh', suggested_display_precision: 2, icon: 'mdi:home-battery' }
};

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
        const meter = (measurementType) => data.find(d => d?.measurementType === measurementType) ?? {};
        const production = meter('Production');
        const net = meter('Consumption Net');
        const total = meter('Consumption Total');
        const liveMeters = pv.liveData?.meters ?? {};
        const storage = (pv.liveData?.devices ?? []).find(d => d?.type === 'Storage') ?? {};
        const batteryEnergyKw = number(liveMeters.encAggEnergyKw) !== null || number(liveMeters.ecbEnergyKw) !== null
            ? (number(liveMeters.encAggEnergyKw) ?? 0) + (number(liveMeters.ecbEnergyKw) ?? 0)
            : null;

        return {
            production_power: number(production.power),
            production_energy_today: kWh(production.energyToday),
            production_energy_lifetime: kWh(production.energyLifetime),
            // Positive import from the grid, negative export
            grid_power: number(net.power),
            grid_import_today: kWh(net.energyToday),
            grid_export_today: kWh(net.energyTodayUpload),
            grid_import_lifetime: kWh(net.energyLifetime),
            grid_export_lifetime: kWh(net.energyLifetimeUpload),
            consumption_power: number(total.power),
            consumption_energy_today: kWh(total.energyToday),
            consumption_energy_lifetime: kWh(total.energyLifetime),
            battery_level: number(liveMeters.soc),
            // Positive discharge, negative charge
            battery_power: number(storage.power),
            battery_energy: batteryEnergyKw
        };
    }
}

export default HaDiscovery;
