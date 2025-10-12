import { join } from 'path';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import EnvoyDevice from './src/envoydevice.js';
import EnergyMeter from './src/energymeter.js';
import ImpulseGenerator from './src/impulsegenerator.js';
import { PluginName, PlatformName } from './src/constants.js';
import CustomCharacteristics from './src/customcharacteristics.js';

class EnvoyPlatform {
  constructor(log, config, api) {
    if (!config || !Array.isArray(config.devices)) {
      log.warn(`No configuration found for ${PluginName}.`);
      return;
    }

    this.log = log;
    this.accessories = [];

    const prefDir = join(api.user.storagePath(), 'enphaseEnvoy');
    try {
      mkdirSync(prefDir, { recursive: true });
    } catch (error) {
      log.error(`Prepare directory error: ${error}.`);
      return;
    }

    api.on('didFinishLaunching', async () => {
      for (let i = 0; i < config.devices.length; i++) {
        const device = config.devices[i];
        const displayType = device.displayType || 0;
        if (displayType === 0) continue;

        const deviceName = device.name;
        const host = device.host || (i === 0 ? 'envoy.local' : `envoy-${i + 1}.local`);
        const { envoyFirmware7xxTokenGenerationMode = 0, envoyPasswd, envoyToken, envoyTokenInstaller = false, enlightenUser, enlightenPasswd } = device;

        const logLevel = {
          devInfo: device.log?.deviceInfo || true,
          success: device.log?.success || true,
          info: device.log?.info || false,
          warn: device.log?.warn || true,
          error: device.log?.error || true,
          debug: device.log?.debug || false
        };

        if (!deviceName) {
          log.warn(`Device: ${host}, Name missing.`);
          continue;
        }

        if (envoyFirmware7xxTokenGenerationMode === 1 && (!enlightenUser || !enlightenPasswd)) {
          log.warn(`Device: ${host} ${deviceName}, missing Enlighten credentials.`);
          continue;
        }

        if (envoyFirmware7xxTokenGenerationMode === 2 && !envoyToken) {
          log.warn(`Device: ${host} ${deviceName}, missing Envoy token.`);
          continue;
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
              }
            },
          }, null, 2);
          log.info(`Device: ${host} ${deviceName}, Config: ${redactedConfig}`);
        }

        const postFix = host.split('.').join('');
        const envoyIdFile = join(prefDir, `envoyId_${postFix}`);
        const envoyTokenFile = join(prefDir, `envoyToken_${postFix}`);
        const energyMeterHistoryFileName = `energyMeterHistory_${postFix}.json`;

        try {
          [envoyIdFile, envoyTokenFile].forEach(file => {
            if (!existsSync(file)) writeFileSync(file, '0');
          });
        } catch (error) {
          if (logLevel.error) log.error(`Device: ${host} ${deviceName}, File init error: ${error}`);
          continue;
        }

        try {
          const devicesClass = device.energyMeter ? [EnvoyDevice, EnergyMeter] : [EnvoyDevice];
          for (const [index, DeviceClass] of devicesClass.entries()) {
            const accessoryName = index === 0 ? deviceName : 'Energy Meter';

            // create impulse generator
            const impulseGenerator = new ImpulseGenerator()
              .on('start', async () => {
                try {
                  const envoyDevice = new DeviceClass(api, accessoryName, host, displayType, envoyFirmware7xxTokenGenerationMode, envoyPasswd, envoyToken, envoyTokenInstaller, enlightenUser, enlightenPasswd, envoyIdFile, envoyTokenFile, device, prefDir, energyMeterHistoryFileName)
                    .on('devInfo', (info) => logLevel.devInfo && log.info(info))
                    .on('success', (msg) => logLevel.success && log.success(`Device: ${host} ${accessoryName}, ${msg}`))
                    .on('info', (msg) => logLevel.info && log.info(`Device: ${host} ${accessoryName}, ${msg}`))
                    .on('debug', (msg, data) => logLevel.debug && log.info(`Device: ${host} ${accessoryName}, debug: ${data ? `${msg} ${JSON.stringify(data, null, 2)}` : msg}`))
                    .on('warn', (msg) => logLevel.warn && log.warn(`Device: ${host} ${accessoryName}, ${msg}`))
                    .on('error', (msg) => logLevel.error && log.error(`Device: ${host} ${accessoryName}, ${msg}`));

                  const accessory = await envoyDevice.start();
                  if (accessory) {
                    api.publishExternalAccessories(PluginName, [accessory]);
                    if (logLevel.success) log.success(`Device: ${host} ${accessoryName}, Published as external accessory.`);

                    await impulseGenerator.stop();
                    await envoyDevice.startStopImpulseGenerator(true);
                  }
                } catch (error) {
                  if (logLevel.error) log.error(`Device: ${host} ${accessoryName}, Start impulse generator error: ${error}, retrying.`);
                }
              })
              .on('state', state => {
                if (logLevel.debug) log.info(`Device: ${host} ${accessoryName}, Start impulse generator ${state ? 'started' : 'stopped'}.`);
              });

            // start impulse generator
            await impulseGenerator.start([{ name: 'start', sampling: 120000 }]);
          }
        } catch (error) {
          if (logLevel.error) log.error(`Device: ${host} ${deviceName}, Did finish launching error: ${error}`);
        }
      }
    });
  }

  configureAccessory(accessory) {
    accessory.log = this.log;
    this.accessories.push(accessory);
  }
}

export default (api) => {
  CustomCharacteristics(api);
  api.registerPlatform(PluginName, PlatformName, EnvoyPlatform);
};

