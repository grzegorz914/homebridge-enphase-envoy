import { join } from 'path';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import EnvoyDevice from './src/envoydevice.js';
import ImpulseGenerator from './src/impulsegenerator.js';
import { PluginName, PlatformName } from './src/constants.js';
import CustomCharacteristics from './src/customcharacteristics.js';

class EnvoyPlatform {
  constructor(log, config, api) {
    if (!config || !Array.isArray(config.devices)) {
      log.warn(`No configuration found for ${PluginName}.`);
      return;
    }

    this.accessories = [];

    const prefDir = join(api.user.storagePath(), 'enphaseEnvoy');
    try {
      mkdirSync(prefDir, { recursive: true });
    } catch (error) {
      log.error(`Prepare directory error: ${error.message ?? error}.`);
      return;
    }

    api.on('didFinishLaunching', () => {
      // Each device is set up independently — a failure in one does not
      // block the others. Promise.allSettled runs all in parallel.
      Promise.allSettled(
        config.devices.map((device, i) =>
          this.setupDevice(device, i, prefDir, log, api)
        )
      ).then(results => {
        results.forEach((result, i) => {
          if (result.status === 'rejected') {
            log.error(`Device[${i}] setup error: ${result.reason?.message ?? result.reason}`);
          }
        });
      });
    });
  }

  // ── Per-device setup ───────────────────────────────────────────────────────

  async setupDevice(device, index, prefDir, log, api) {
    const displayType = device.displayType ?? 0;
    if (displayType === 0) return;

    const deviceName = device.name;
    const host = device.host || (index === 0 ? 'envoy.local' : `envoy-${index + 1}.local`);
    const { envoyFirmware7xxTokenGenerationMode = 0, envoyToken, enlightenUser, enlightenPasswd } = device;

    const logLevel = {
      devInfo: device.log?.deviceInfo ?? true,
      success: device.log?.success ?? true,
      info: device.log?.info ?? false,
      warn: device.log?.warn ?? true,
      error: device.log?.error ?? true,
      debug: device.log?.debug ?? false,
    };

    if (!deviceName) {
      log.warn(`Device: ${host}, Name missing.`);
      return;
    }

    if (envoyFirmware7xxTokenGenerationMode === 1 && (!enlightenUser || !enlightenPasswd)) {
      log.warn(`Device: ${host} ${deviceName}, missing Enlighten credentials.`);
      return;
    }

    if (envoyFirmware7xxTokenGenerationMode === 2 && !envoyToken) {
      log.warn(`Device: ${host} ${deviceName}, missing Envoy token.`);
      return;
    }

    if (logLevel.debug) {
      log.info(`Device: ${host} ${deviceName}, did finish launching.`);
      const redactedConfig = JSON.stringify({
        ...device,
        envoyPasswd: 'removed',
        envoyToken: 'removed',
        enlightenPasswd: 'removed',
        mqtt: {
          auth: {
            ...device.mqtt?.auth,
            passwd: 'removed',
          },
        },
      }, null, 2);
      log.info(`Device: ${host} ${deviceName}, Config: ${redactedConfig}`);
    }

    const postFix = host.replaceAll('.', '');
    const envoyIdFile = join(prefDir, `envoyId_${postFix}`);
    const envoyTokenFile = join(prefDir, `envoyToken_${postFix}`);
    const energyLifetimeHistoryFile = join(prefDir, `energyLifetimeHistory_${postFix}`);
    const energyMeterHistoryFileName = `energyMeterHistory_${postFix}`;

    try {
      [envoyIdFile, envoyTokenFile, energyLifetimeHistoryFile].forEach(file => {
        if (!existsSync(file)) writeFileSync(file, '0');
      });
    } catch (error) {
      if (logLevel.error) log.error(`Device: ${host} ${deviceName}, File init error: ${error.message ?? error}`);
      return;
    }

    const url = envoyFirmware7xxTokenGenerationMode > 0 ? `https://${host}` : `http://${host}`;

    // The startup impulse generator retries the full connect+start cycle
    // every 120 s until it succeeds, then hands off to the device's own
    // impulse generator and stops itself.
    const impulseGenerator = new ImpulseGenerator()
      .on('start', async () => {
        try {
          await this.startDevice({
            device, deviceName, host, url,
            envoyIdFile, envoyTokenFile, prefDir,
            energyLifetimeHistoryFile, energyMeterHistoryFileName,
            logLevel, log, api, impulseGenerator,
          });
        } catch (error) {
          if (logLevel.error) log.error(`Device: ${host} ${deviceName}, Start impulse generator error: ${error.message ?? error}, retrying.`);
        }
      })
      .on('state', state => {
        if (logLevel.debug) log.info(`Device: ${host} ${deviceName}, Start impulse generator ${state ? 'started' : 'stopped'}.`);
      });

    await impulseGenerator.state(true, [{ name: 'start', sampling: 120_000 }]);
  }

  // ── Connect and register accessories for one device ────────────────────────

  async startDevice({ device, deviceName, host, url, envoyIdFile, envoyTokenFile, prefDir, energyLifetimeHistoryFile, energyMeterHistoryFileName, logLevel, log, api, impulseGenerator }) {
    const envoyDevice = new EnvoyDevice(api, log, url, deviceName, device, envoyIdFile, envoyTokenFile, prefDir, energyLifetimeHistoryFile, energyMeterHistoryFileName)
      .on('devInfo', (info) => logLevel.devInfo && log.info(info))
      .on('success', (msg) => logLevel.success && log.success(`Device: ${host} ${deviceName}, ${msg}`))
      .on('info', (msg) => logLevel.info && log.info(`Device: ${host} ${deviceName}, ${msg}`))
      .on('debug', (msg, data) => logLevel.debug && log.info(`Device: ${host} ${deviceName}, debug: ${data ? `${msg} ${JSON.stringify(data, null, 2)}` : msg}`))
      .on('warn', (msg) => logLevel.warn && log.warn(`Device: ${host} ${deviceName}, ${msg}`))
      .on('error', (msg) => logLevel.error && log.error(`Device: ${host} ${deviceName}, ${msg}`));

    const accessories = await envoyDevice.start();
    if (!accessories) return;

    api.publishExternalAccessories(PluginName, accessories);
    if (logLevel.success) log.success(`Device: ${host} ${deviceName}, Published as external accessory.`);

    // Stop the startup impulse generator and hand off to the device's
    // own periodic impulse generator.
    await impulseGenerator.state(false);
    await envoyDevice.startStopImpulseGenerator(true);
  }

  // ── Homebridge accessory cache ─────────────────────────────────────────────

  configureAccessory(accessory) {
    this.accessories.push(accessory);
  }
}

export default (api) => {
  CustomCharacteristics(api);
  api.registerPlatform(PluginName, PlatformName, EnvoyPlatform);
};