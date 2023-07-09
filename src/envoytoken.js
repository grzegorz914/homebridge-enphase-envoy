"use strict";
const axios = require('axios');
const fs = require('fs');
const fsPromises = fs.promises;
const CONSTANS = require('./constans.json');

class EnvoyToken {
    constructor(config) {
        this.user = config.user;
        this.password = config.password;
        this.serialNumber = config.serialNumber;
        this.tokenFile = config.tokenFile;

        this.token = {
            generation_time: {},
            token: {},
            expires_at: {}
        }

        if (!fs.existsSync(this.tokenFile)) {
            fs.writeFileSync(this.tokenFile, this.token);
        }

        this.axiosInstanceLogin = axios.create({
            method: 'POST',
            baseURL: CONSTANS.EnphaseUrls.BaseUrl
        });
    };

    getToken() {
        return new Promise(async (resolve, reject) => {
            const tokenFileExist = fs.readFileSync(this.tokenFile).length > 30;
            switch (tokenFileExist) {
                case true:
                    const token = JSON.parse(fs.readFileSync(this.tokenFile));
                    const tokenExpiresAt = token.expires_at;
                    const tokenExpired = Math.floor(new Date().getTime() / 1000) > tokenExpiresAt;

                    switch (tokenExpired) {
                        case true:
                            try {
                                //login to enlighten
                                const loginUrl = `${CONSTANS.EnphaseUrls.Login}?user[email]=${this.user}&user[password]=${this.password}`;
                                const loginData = await this.axiosInstanceLogin(loginUrl);
                                const cookie = loginData.headers['set-cookie'];

                                //create axios instance token
                                const axiosInstanceToken = axios.create({
                                    method: 'GET',
                                    baseURL: CONSTANS.EnphaseUrls.BaseUrl,
                                    headers: {
                                        Accept: 'application/json',
                                        Cookie: cookie
                                    }
                                });

                                //get entrez token
                                const tokenUrl = `${CONSTANS.EnphaseUrls.EntrezAuthToken}?serial_num=${this.serialNumber}`;
                                const tokenData = await axiosInstanceToken(tokenUrl);

                                //save token to the file
                                const token = tokenData.data;
                                await fsPromises.writeFile(this.tokenFile, JSON.stringify(token, null, 2));
                                this.token = token;

                                resolve(token);
                            } catch (error) {
                                reject(error);
                            }
                            break;
                        case false:
                            resolve(token)
                            break;
                    }
                    break;
                case false:
                    try {
                        //login to enlighten
                        const loginUrl = `${CONSTANS.EnphaseUrls.Login}?user[email]=${this.user}&user[password]=${this.password}`;
                        const loginData = await this.axiosInstanceLogin(loginUrl);
                        const cookie = loginData.headers['set-cookie'];

                        //create axios instance token
                        const axiosInstanceToken = axios.create({
                            method: 'GET',
                            baseURL: CONSTANS.EnphaseUrls.BaseUrl,
                            headers: {
                                Accept: 'application/json',
                                Cookie: cookie
                            }
                        });

                        //get entrez token
                        const tokenUrl = `${CONSTANS.EnphaseUrls.EntrezAuthToken}?serial_num=${this.serialNumber}`;
                        const tokenData = await axiosInstanceToken(tokenUrl);

                        //save token to the file
                        const token = tokenData.data;
                        await fsPromises.writeFile(this.tokenFile, JSON.stringify(token, null, 2));
                        this.token = token;

                        resolve(token);
                    } catch (error) {
                        reject(error);
                    }
                    break;
            }
        });
    }
};
module.exports = EnvoyToken;