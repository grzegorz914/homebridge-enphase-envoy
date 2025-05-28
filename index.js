import { join } from 'path';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import EnvoyDevice from './src/envoydevice.js';
import ImpulseGenerator from './src/impulsegenerator.js';
import { PluginName, PlatformName } from './src/constants.js';
import CustomCharacteristics from './src/customcharacteristics.js';

class EnvoyPlatform {
  constructor(log, config, api) {
    // only load if configured
    if (!config || !Array.isArray(config.devices)) {
      log.warn(`No configuration found for ${PluginName}.`);
      return;
    }
    this.accessories = [];


    //check if prefs directory exist
    const prefDir = join(api.user.storagePath(), 'enphaseEnvoy');
    try {
      mkdirSync(prefDir, { recursive: true });
    } catch (error) {
      log.error(`Prepare directory error: ${error}.`);
      return;
    }

    api.on('didFinishLaunching', async () => {
      let i = 1;
      for (const device of config.devices) {

        //check accessory is enabled
        const displayType = device.displayType || 0;
        if (displayType === 0) {
          continue;
        }

        const deviceName = device.name;
        const host = device.host || (i === 1 ? 'envoy.local' : `envoy-${i}.local`);
        const envoyFirmware7xxTokenGenerationMode = device.envoyFirmware7xxTokenGenerationMode || 0; //0 - envoy password, 1 - enlighten credentials, 2 - own token
        const envoyPasswd = device.envoyPasswd;
        const envoyToken = device.envoyToken;
        const envoyTokenInstaller = device.envoyTokenInstaller || false;
        const enlightenUser = device.enlightenUser;
        const enlightenPasswd = device.enlightenPasswd;

        //check mandatory properties
        if (!deviceName) {
          log.warn(`Device: ${host} ${deviceName}, Name missing: ${deviceName}.`);
          return;
        }

        if (envoyFirmware7xxTokenGenerationMode === 1 && (!enlightenUser || !enlightenPasswd)) {
          log.warn(`Device: ${host} ${deviceName}, Envoy firmware v7.x.x enabled, enlighten user: ${enlightenUser ? 'OK' : enlightenUser}, password: ${enlightenPasswd ? 'OK' : enlightenPasswd}.`);
          return;
        }

        if (envoyFirmware7xxTokenGenerationMode === 2 && !envoyToken) {
          log.warn(`Device: ${host} ${deviceName}, Envoy firmware v7.x.x enabled but envoy token: ${envoyToken ? 'OK' : envoyToken}.`);
          return;
        }

        //log config
        const enableDebugMode = device.enableDebugMode || false;
        const disableLogDeviceInfo = device.disableLogDeviceInfo || false;
        const disableLogInfo = device.disableLogInfo || false;
        const disableLogSuccess = device.disableLogSuccess || false;
        const disableLogWarn = device.disableLogWarn || false;
        const disableLogError = device.disableLogError || false;
        const debug = !enableDebugMode ? false : log.info(`Device: ${host} ${deviceName}, did finish launching.`);
        const config = {
          ...device,
          envoyPasswd: 'removed',
          envoyToken: 'removed',
          enlightenPasswd: 'removed',
          mqtt: {
            ...device.mqtt,
            passwd: 'removed'
          }
        }
        const debug1 = !enableDebugMode ? false : log.info(`Device: ${host} ${deviceName}, Config: ${JSON.stringify(config, null, 2)}.`);

        //check files exists, if not then create it
        const postFix = host.split('.').join('');
        const envoyIdFile = join(prefDir, `envoyId_${postFix}`);
        const envoyTokenFile = join(prefDir, `envoyToken_${postFix}`);

        try {
          const files = [
            envoyIdFile,
            envoyTokenFile,
          ];

          files.forEach((file) => {
            if (!existsSync(file)) {
              writeFileSync(file, '0');
            }
          })
        } catch (error) {
          const emitLog = disableLogError ? false : log.error(`Device: ${host} ${deviceName}, Prepare files error: ${error}.`);
          return;
        }

        //envoy device
        try {
          const envoyDevice = new EnvoyDevice(api, deviceName, host, displayType, envoyFirmware7xxTokenGenerationMode, envoyPasswd, envoyToken, envoyTokenInstaller, enlightenUser, enlightenPasswd, envoyIdFile, envoyTokenFile, device);
          envoyDevice.on('publishAccessory', (accessory) => {
            api.publishExternalAccessories(PluginName, [accessory]);
            const emitLog = disableLogSuccess ? false : log.success(`Device: ${host} ${deviceName}, Published as external accessory.`);
          })
            .on('devInfo', (devInfo) => {
              const emitLog = disableLogDeviceInfo ? false : log.info(devInfo);
            })
            .on('success', (success) => {
              const emitLog = disableLogSuccess ? false : log.success(`Device: ${host} ${deviceName}, ${success}.`);
            })
            .on('info', (info) => {
              const emitLog = disableLogInfo ? false : log.info(`Device: ${host} ${deviceName}, ${info}.`);
            })
            .on('debug', (debug, data) => {
              const emitLog = !enableDebugMode ? false : log.info(`Device: ${host} ${deviceName}, debug: ${data ? `${debug} ${JSON.stringify(data, null, 2)}` : `${debug}.`}`);
            })
            .on('warn', (warn) => {
              const emitLog = disableLogWarn ? false : log.warn(`Device: ${host} ${deviceName}, ${warn}.`);
            })
            .on('error', (error) => {
              const emitLog = disableLogError ? false : log.error(`Device: ${host} ${deviceName}, ${error}.`);
            })

          //create impulse generator
          const impulseGenerator = new ImpulseGenerator();
          impulseGenerator.on('start', async () => {
            try {
              const startDone = await envoyDevice.start();
              const stopImpulseGenerator = startDone ? await impulseGenerator.stop() : false;

              //start impulse generator 
              const startImpulseGenerator = startDone ? await envoyDevice.startImpulseGenerator() : false
            } catch (error) {
              const emitLog = disableLogError ? false : log.error(`Device: ${host} ${deviceName}, ${error}, trying again.`);
            }
          }).on('state', (state) => {
            const emitLog = !enableDebugMode ? false : state ? log.info(`Device: ${host} ${deviceName}, Start impulse generator started.`) : log.info(`Device: ${host} ${deviceName}, Start impulse generator stopped.`);
          })

          //start impulse generator
          await impulseGenerator.start([{ name: 'start', sampling: 45000 }]);
        } catch (error) {
          throw new Error(`Device: ${host} ${deviceName}, Did finish launching error: ${error}.`);
        }

        i++;
      }
    })
  }

  configureAccessory(accessory) {
    this.accessories.push(accessory);
  }
}

export default (api) => {
  //import and register custom characteristics
  CustomCharacteristics(api);
  api.registerPlatform(PluginName, PlatformName, EnvoyPlatform);
}
