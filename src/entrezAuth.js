"use strict";
const fs = require('fs');
const fsPromises = fs.promises;
const axios = require('axios');
const API_URL = require('./apiurl.json');

class axiosEntrezAuth {
    constructor(config) {
        this.user = config.enphaseUser;
        this.passwd = config.enphasePasswd;
        this.envoySerial = config.envoySerial;
        this.tokenFile = config.tokenFile;
    };

    async getToken() {
        try {
            const tok = Buffer.from(`${this.user}:${this.passwd}`, 'utf8').toString('base64')
            const options = {
                baseURL: API_URL.EnphaseLogin,
                headers: {
                    'Authorization': `Bearer ${tok}`
                }
            };
            const login = await axios.request(options);
            console.log(login)
            const response = await axios.request(API_URL.EnphaseToken + this.envoySerial);
            console.log(response)
            const generationTime = response.data.generation_time;
            const token = response.data.token;
            const expiresAt = response.data.expires_at;

            const obj = JSON.stringify(response, null, 2);
            const writeToken = await fsPromises.writeFile(this.tokenFile, obj);
        } catch (error) {
            console.log(error)
        };
    };
};
module.exports = axiosEntrezAuth;