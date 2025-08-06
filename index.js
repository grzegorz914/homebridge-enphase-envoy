import { join } from 'path';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import EnvoyDevice from './src/envoydevice.js';
import EnergyMeter from './src/energymeter.js';
import ImpulseGenerator from './src/impulsegenerator.js';
import { PluginName, PlatformName } from './src/constants.js';
import CustomCharacteristics from './src/customcharacteristics.js';
import fakegato from 'fakegato-history';

class EnvoyPlatform {
  constructor(log, config, api) {
    if (!config || !Array.isArray(config.devices)) {
      log.warn(`No configuration found for ${PluginName}.`);
      return;
    }

    this.log = log;
    this.accessories = [];
    this.FakeGatoHistoryService = fakegato(api);

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
        const {
          envoyFirmware7xxTokenGenerationMode = 0,
          envoyPasswd,
          envoyToken,
          envoyTokenInstaller = false,
          enlightenUser,
          enlightenPasswd,
          enableDebugMode = false,
          disableLogDeviceInfo = false,
          disableLogInfo = false,
          disableLogSuccess = false,
          disableLogWarn = false,
          disableLogError = false
        } = device;

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

        if (enableDebugMode) {
          log.info(`Device: ${host} ${deviceName}, did finish launching.`);
          const redactedConfig = JSON.stringify({
            ...device,
            envoyPasswd: 'removed',
            envoyToken: 'removed',
            enlightenPasswd: 'removed',
            mqtt: { ...device.mqtt, passwd: 'removed' }
          }, null, 2);
          log.info(`Device: ${host} ${deviceName}, Config: ${redactedConfig}`);
        }

        const postFix = host.split('.').join('');
        const envoyIdFile = join(prefDir, `envoyId_${postFix}`);
        const envoyTokenFile = join(prefDir, `envoyToken_${postFix}`);
        const energyMeterHistory = join(prefDir, `energyMeterHistory_${postFix}`);

        try {
          [envoyIdFile, envoyTokenFile].forEach(file => {
            if (!existsSync(file)) writeFileSync(file, '0');
          });
        } catch (error) {
          if (!disableLogError) log.error(`Device: ${host} ${deviceName}, File init error: ${error}`);
          continue;
        }

        const devicesClass = device.energyMeter ? [EnvoyDevice, EnergyMeter] : [EnvoyDevice];
        for (const [index, DeviceClass] of devicesClass.entries()) {
          try {
            const accessoryName = index === 0 ? deviceName : 'Energy Meter';
            const envoyDevice = new DeviceClass(
              api,
              log,
              accessoryName,
              host,
              displayType,
              envoyFirmware7xxTokenGenerationMode,
              envoyPasswd,
              envoyToken,
              envoyTokenInstaller,
              enlightenUser,
              enlightenPasswd,
              envoyIdFile,
              envoyTokenFile,
              device,
              energyMeterHistory,
              index === 1 ? this.FakeGatoHistoryService : undefined
            );

            this.attachEventHandlers(api, envoyDevice, log, {
              host,
              deviceName: accessoryName,
            });

            const impulseGenerator = new ImpulseGenerator();
            let lock = false;

            impulseGenerator
              .on('start', async () => {
                if (lock) return;
                lock = true;
                try {
                  const started = await envoyDevice.start();
                  if (started) {
                    await impulseGenerator.stop();
                    await envoyDevice.startImpulseGenerator();
                  }
                } catch (error) {
                  if (!disableLogError) log.error(`Device: ${host} ${accessoryName}, ${error}, retrying.`);
                } finally {
                  lock = false;
                }
              })
              .on('state', state => {
                if (enableDebugMode) log.info(`Device: ${host} ${accessoryName}, Impulse generator ${state ? 'started' : 'stopped'}.`);
              });

            await impulseGenerator.start([{ name: 'start', sampling: 90000 }]);
          } catch (error) {
            log.error(`Device: ${host} ${deviceName}, Initialization error: ${error}`);
          }
        }
      }
    });
  }

  attachEventHandlers(api, envoyDevice, log, { host, deviceName }) {
    envoyDevice
      .on('publishAccessory', accessory => {
        api.publishExternalAccessories(PluginName, [accessory]);
        log.success(`Device: ${host} ${deviceName}, Published as external accessory.`);
      })
      .on('devInfo', devInfo => {
        log.info(devInfo);
      })
      .on('success', msg => {
        log.success(`Device: ${host} ${deviceName}, ${msg}`);
      })
      .on('info', msg => {
        log.info(`Device: ${host} ${deviceName}, ${msg}`);
      })
      .on('debug', (msg, data) => {
        log.info(`Device: ${host} ${deviceName}, debug: ${data ? `${msg} ${JSON.stringify(data, null, 2)}` : msg}`);
      })
      .on('warn', msg => {
        log.warn(`Device: ${host} ${deviceName}, ${msg}`);
      })
      .on('error', error => {
        log.error(`Device: ${host} ${deviceName}, ${error}`);
      });
  }

  configureAccessory(accessory) {
    accessory.log = this.log;
    this.loggingService = new fakegato('energy', accessory, 4032);
    this.accessories.push(accessory);
  }
}

export default (api) => {
  CustomCharacteristics(api);
  api.registerPlatform(PluginName, PlatformName, EnvoyPlatform);
};

