"use strict";
const axios = require('axios');
const fs = require('fs');
const fsPromises = fs.promises;
const EventEmitter = require('events');
const CONSTANTS = require('./constants.json');

class EnvoyToken extends EventEmitter {
    constructor(config) {
        super();
        this.user = config.user;
        this.passwd = config.passwd;
        this.serialNumber = config.serialNumber;
        this.tokenFile = config.tokenFile;
    };

    async checkToken() {
        try {
            const data = await this.readData(this.tokenFile);
            const parsedData = JSON.parse(data);
            parsedData.token ? parsedData : null;
            const tokenIsValid = parsedData && Math.floor(Date.now() / 1000) <= parsedData.expires_at;

            if (tokenIsValid) {
                return parsedData;
            } else {
                return await this.refreshToken();
            }
        } catch (error) {
            this.emit('error', `Check token error: ${error}`);
        }
    }

    async refreshToken() {
        try {
            const cookie = await this.loginToEnlighten();
            const newToken = await this.getToken(cookie);
            return newToken;
        } catch (error) {
            this.emit('error', `Refresh token error: ${error}`);
        }
    }

    async loginToEnlighten() {
        try {
            const axiosInstance = axios.create({
                method: 'POST',
                baseURL: CONSTANTS.EnphaseUrls.BaseUrl,
                params: {
                    'user[email]': this.user,
                    'user[password]': this.passwd,
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: 5000
            });

            const loginData = await axiosInstance(CONSTANTS.EnphaseUrls.Login);
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
            const axiosInstance = axios.create({
                method: 'GET',
                baseURL: CONSTANTS.EnphaseUrls.BaseUrl,
                params: {
                    'serial_num': this.serialNumber,
                },
                headers: {
                    Accept: 'application/json',
                    Cookie: cookie,
                },
                timeout: 5000
            });

            const response = await axiosInstance(CONSTANTS.EnphaseUrls.EntrezAuthToken);
            const tokenData = response.data;
            if (!tokenData.token) {
                this.emit('error', `Token missing in response: ${JSON.stringify(tokenData)}`);
                return;
            }

            tokenData.expires_at = tokenData.expires_at || Math.floor(Date.now() / 1000) + 3600; // Assume 1 hour expiry if not provided
            await this.saveData(this.tokenFile, tokenData);
            return tokenData;
        } catch (error) {
            this.emit('error', `Get token error: ${error.message ?? error}`);
        }
    }

    async readData(path) {
        try {
            const data = await fsPromises.readFile(path, 'utf-8');
            return data;
        } catch (error) {
            throw new Error(error.message ?? error);
        }
    };

    async saveData(path, data) {
        try {
            await fsPromises.writeFile(path, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            throw new Error(error.message ?? error);
        }
    };
};
module.exports = EnvoyToken;

