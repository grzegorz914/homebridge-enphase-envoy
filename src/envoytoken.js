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
    }

    async refreshToken() {
        try {
            const cookie = await this.loginToEnlighten();
            if (!cookie) return null;

            const tokenData = await this.getToken(cookie);
            if (!tokenData) return null;

            // Determine if token is installer or user (12h = 43200 seconds)
            const installerToken = (tokenData.expires_at - tokenData.generation_time) === 43200;
            tokenData.installer = installerToken;

            this.emit('success', `Token ${installerToken ? 'installer' : 'user'}, expires at: ${new Date(tokenData.expires_at * 1000).toLocaleString()}`);

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

            const response = await axios({
                method: 'POST',
                baseURL: EnphaseUrls.BaseUrl,
                url: EnphaseUrls.Login,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: form,
                timeout: 10000
            });

            if (response.status !== 200) {
                this.emit('error', `Login failed with status code: ${response.status}`);
                return null;
            }

            const cookie = response.headers['set-cookie'];
            if (!cookie) {
                this.emit('warn', `No cookie returned from login. Response headers: ${JSON.stringify(response.headers)}`);
                return null;
            }

            return cookie;
        } catch (error) {
            throw new Error(`Login to Enlighten error: ${error}`);
        }
    }

    async getToken(cookie) {
        try {
            const response = await axios({
                method: 'GET',
                baseURL: EnphaseUrls.BaseUrl,
                url: EnphaseUrls.EntrezAuthToken,
                params: {
                    serial_num: this.serialNumber
                },
                headers: {
                    Accept: 'application/json',
                    Cookie: cookie
                },
                timeout: 10000
            });

            const tokenData = response.data;

            if (!tokenData.token || !tokenData.expires_at || !tokenData.generation_time) {
                this.emit('warn', `Incomplete token data: ${JSON.stringify(tokenData)}`);
                return null;
            }

            return tokenData;
        } catch (error) {
            throw new Error(`Get token error: ${error}`);
        }
    }
}

export default EnvoyToken;


