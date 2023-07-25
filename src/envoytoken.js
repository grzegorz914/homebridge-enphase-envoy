"use strict";
const axios = require('axios');
const querystring = require('querystring');
const fs = require('fs');
const fsPromises = fs.promises;
const CONSTANS = require('./constans.json');

class EnvoyToken {
    constructor(config) {
        this.user = config.user;
        this.passwd = config.passwd;
        this.serialNumber = config.serialNumber;
        this.tokenFile = config.tokenFile;
    };

    checkToken() {
        return new Promise(async (resolve, reject) => {
            try {
                //check jwt token exist in file
                const tokenData = await this.readToken();
                const tokenExist = tokenData !== false ? true : false;
                switch (tokenExist) {
                    case true:
                        //check jwt token expired
                        const tokenExpired = Math.floor(new Date().getTime() / 1000) > tokenData.expires_at;
                        switch (tokenExpired) {
                            case true:
                                try {
                                    //login to enlighten server
                                    const cookie = await this.loginToEnlighten();

                                    //get jwt token
                                    const token = await this.getToken(cookie);
                                    resolve(token);
                                } catch (error) {
                                    reject(error);
                                }
                                break;
                            case false:
                                resolve(tokenData);
                                break;
                        }
                        break;
                    case false:
                        try {
                            //login to enlighten server
                            const cookie = await this.loginToEnlighten();

                            //get jwt token
                            const token = await this.getToken(cookie);
                            resolve(token);
                        } catch (error) {
                            reject(error);
                        }
                        break;
                }
            } catch (error) {
                reject(`Check token error: ${error}`);
            }
        });
    }

    loginToEnlighten() {
        return new Promise(async (resolve, reject) => {
            try {
                //create axios instance
                const axiosInstance = axios.create({
                    method: 'POST',
                    baseURL: CONSTANS.EnphaseUrls.BaseUrl,
                    params: {
                        'user[email]': this.user,
                        'user[password]': this.passwd
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });

                //login to enlighten server
                const loginData = await axiosInstance(CONSTANS.EnphaseUrls.Login);

                if (loginData.status !== 200) {
                    reject(`Login to enlighten with status code: ${loginData.status}, headers: ${loginData.headers}`);
                    return;
                }

                //get cookie
                const cookie = loginData.headers['set-cookie'];
                resolve(cookie);
            } catch (error) {
                reject(`Login to enlighten error: ${error}`);
            }
        });
    }

    getToken(cookie) {
        return new Promise(async (resolve, reject) => {
            try {
                //create axios instance
                const axiosInstance = axios.create({
                    method: 'GET',
                    baseURL: CONSTANS.EnphaseUrls.BaseUrl,
                    params: {
                        'serial_num': this.serialNumber
                    },
                    headers: {
                        Accept: 'application/json',
                        Cookie: cookie
                    }
                });

                //get jwt token
                const data = await axiosInstance(CONSTANS.EnphaseUrls.EntrezAuthToken);
                const tokenData = data.data;

                if (!tokenData.token) {
                    reject(`Token in response missing, response: ${tokenData}`);
                    return;
                };

                //save jwt token
                await this.saveToken(tokenData);
                resolve(tokenData);
            } catch (error) {
                reject(`Get token error: ${error}`);
            }
        });
    }

    readToken() {
        return new Promise(async (resolve, reject) => {
            try {
                const data = await fsPromises.readFile(this.tokenFile)
                const parseData = JSON.parse(data);
                const tokenData = parseData.token ? parseData : false;
                resolve(tokenData);
            } catch (error) {
                reject(`Read token error: ${error}`);
            }
        });
    }

    saveToken(token) {
        return new Promise(async (resolve, reject) => {
            try {
                await fsPromises.writeFile(this.tokenFile, JSON.stringify(token, null, 2));
                resolve();
            } catch (error) {
                reject(`Save token error: ${error}`);
            }
        });
    }
};
module.exports = EnvoyToken;
