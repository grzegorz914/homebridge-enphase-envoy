import { promises as fsPromises } from 'fs';
import axios from 'axios';
import EventEmitter from 'events';
import { EnphaseUrls } from './constants.js';

class EnvoyToken extends EventEmitter {
    constructor(config) {
        super();
        this.user = config.user;
        this.passwd = config.passwd;
        this.serialNumber = config.serialNumber;
        this.tokenFile = config.tokenFile;
    };

    async refreshToken() {
        try {
            const cookie = await this.loginToEnlighten();
            const tokenData = await this.getToken(cookie);

            if (!tokenData.token) {
                this.emit('warn', `Token missing in response: ${JSON.stringify(tokenData)}`);
                return false;
            }

            //check if token is instslloer or user
            const installerToken = tokenData.expires_at - tokenData.generation_time == 43200 ?? false;
            tokenData.installer = installerToken;

            //save token
            await this.saveData(this.tokenFile, tokenData);

            //emit success
            this.emit('success', `JWT Token refresh success.`);
            this.emit('success', `JWT Token ${installerToken ? 'installer,' : 'user,'} valid: ${new Date(tokenData.expires_at * 1000).toLocaleString()}`);

            return tokenData;
        } catch (error) {
            this.emit('error', `Refresh token error: ${error}`);
        }
    }

    async loginToEnlighten() {
        try {
            const options = {
                method: 'POST',
                baseURL: EnphaseUrls.BaseUrl,
                params: {
                    'user[email]': this.user,
                    'user[password]': this.passwd,
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: 10000
            };

            const loginData = await axios(EnphaseUrls.Login, options);
            if (loginData.status !== 200) {
                this.emit('error', `Login to Enlighten failed with status code: ${loginData.status}`);
                return;
            }

            const cookie = loginData.headers['set-cookie'];
            return cookie;
        } catch (error) {
            this.emit('error', `Login to Enlighten error: ${error.message ?? error}`);
        }
    }

    async getToken(cookie) {
        try {
            const options = {
                method: 'GET',
                baseURL: EnphaseUrls.BaseUrl,
                params: {
                    'serial_num': this.serialNumber,
                },
                headers: {
                    Accept: 'application/json',
                    Cookie: cookie,
                },
                timeout: 10000
            };

            const response = await axios(EnphaseUrls.EntrezAuthToken, options);
            const tokenData = response.data;
            return tokenData;
        } catch (error) {
            this.emit('error', `Get token error: ${error.message ?? error}`);
        }
    }

    async saveData(path, data) {
        try {
            await fsPromises.writeFile(path, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            throw new Error(error.message ?? error);
        }
    };
};
export default EnvoyToken;

