import axios from 'axios';
import { URLSearchParams } from 'url';
import EventEmitter from 'events';
import { EnphaseUrls } from './constants.js';

class EnvoyToken extends EventEmitter {
    constructor(config) {
        super();
        this.user = config.user;
        this.passwd = config.passwd;
        this.serialNumber = config.serialNumber;
    };

    async refreshToken() {
        try {
            const cookie = await this.loginToEnlighten();
            if (!cookie) {
                return null;
            }

            const tokenData = await this.getToken(cookie);
            if (!tokenData) {
                return null;
            }

            //check if token is instslloer or user
            const installerToken = (tokenData.expires_at - tokenData.generation_time) === 43200;
            tokenData.installer = installerToken;

            //emit success
            this.emit('success', `Token ${installerToken ? 'installer,' : 'user,'} expire at: ${new Date(tokenData.expires_at * 1000).toLocaleString()}`);

            return tokenData;
        } catch (error) {
            throw new Error(`Refresh token error: ${error}`);
        }
    }

    async loginToEnlighten() {
        try {
            const form = new URLSearchParams();
            form.append('user[email]', this.user);
            form.append('user[password]', this.passwd);

            const options = {
                method: 'POST',
                baseURL: EnphaseUrls.BaseUrl,
                url: EnphaseUrls.Login,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: form,
                timeout: 10000
            };

            const loginData = await axios(options);
            if (loginData.status !== 200) {
                this.emit('error', `Login to Enlighten failed with status code: ${loginData.status}`);
                return null;
            }

            const cookie = loginData.headers['set-cookie'] ?? false;
            if (!cookie) {
                this.emit('warn', `Cookie data is incomplete: ${JSON.stringify(loginData)}`);
                return null;
            }

            return cookie;
        } catch (error) {
            throw new Error(`Login to Enlighten error: ${error}`);
        }
    }

    async getToken(cookie) {
        try {
            const options = {
                method: 'GET',
                baseURL: EnphaseUrls.BaseUrl,
                params: {
                    'serial_num': this.serialNumber
                },
                headers: {
                    Accept: 'application/json',
                    Cookie: cookie
                },
                timeout: 10000
            };

            const response = await axios(EnphaseUrls.EntrezAuthToken, options);
            const tokenData = response.data;
            if (!tokenData.token || !tokenData.expires_at || !tokenData.generation_time) {
                this.emit('warn', `Token data is incomplete: ${JSON.stringify(tokenData)}`);
                return null;
            }

            return tokenData;
        } catch (error) {
            throw new Error(`Get token error: ${error}`);
        }
    }
}
export default EnvoyToken;

