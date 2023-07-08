"use strict";
const axios = require('axios');
const fs = require('fs');
const fsPromises = fs.promises;
const EventEmitter = require('events');
const CONSTANS = require('./constans.json');

class EnvoyToken extends EventEmitter {
    constructor(config) {
        super();
        this.user = config.user;
        this.password = config.password;
        this.serialNumber = config.serialNumber;
        this.tokenFile = config.tokenFile;
        this.debug = config.debug;
    };

    getToken() {
        return new Promise(async (resolve, reject) => {
            try {
                //login to enlighten
                const loginUrl = `${CONSTANS.EnphaseUrls.BaseUrl}${CONSTANS.EnphaseUrls.Login}?user[email]=${this.user}&user[password]=${this.password}`;
                const loginData = await axios.post(loginUrl);
                const debug = this.debug ? this.emit('debug', `Enlighten login data: ${JSON.stringify(loginData.data, null, 2)}`) : false;
                const cookie = loginData.headers['set-cookie'];

                //get entrez token
                const tokenUrl = `${CONSTANS.EnphaseUrls.BaseUrl}${CONSTANS.EnphaseUrls.EntrezAuthToken}?serial_num=${this.serialNumber}`;
                const tokenData = await axios(tokenUrl, {
                    headers: {
                        Accept: 'application/json',
                        Cookie: cookie
                    }
                });
                const debug1 = this.debug ? this.emit('debug', `Enlighten token data: ${JSON.stringify(tokenData.data, null, 2)}`) : false;

                const generationTime = new Date(tokenData.data.generation_time * 1000).toLocaleString();
                const token = tokenData.data.token;
                const expiresAt = new Date(tokenData.data.expires_at * 1000).toLocaleString();
                const debug2 = this.debug ? this.emit('debug', `Token generation time: ${generationTime}, token: ${token}, expires at: ${expiresAt}`) : false;

                //save token to the file
                await fsPromises.writeFile(this.tokenFile, JSON.stringify(tokenData.data, null, 2));

                resolve(token);
            } catch (error) {
                reject(error);
            }
        });
    }
};
module.exports = EnvoyToken;