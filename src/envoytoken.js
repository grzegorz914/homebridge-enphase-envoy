"use strict";
const axios = require('axios');
const fs = require('fs');
const fsPromises = fs.promises;
const CONSTANS = require('./constans.json');

class EnvoyToken {
    constructor(config) {
        this.user = config.user;
        this.passwd = config.passwd;
        this.serialNumber = config.serialNumber;
        this.tokenFile = config.tokenFile;

        //create axios instance
        this.axiosInstanceLogin = axios.create({
            method: 'POST',
            baseURL: CONSTANS.EnphaseUrls.BaseUrl
        });
    };

    getToken() {
        return new Promise(async (resolve, reject) => {
            try {
                //prepare urls
                const loginUrl = `${CONSTANS.EnphaseUrls.Login}?user[email]=${encodeURIComponent(this.user)}&user[password]=${encodeURIComponent(this.passwd)}`;
                const tokenUrl = `${CONSTANS.EnphaseUrls.EntrezAuthToken}?serial_num=${encodeURIComponent(this.serialNumber)}`;

                //check jwt token exist in file
                const tokenExist = await this.existToken();
                switch (tokenExist) {
                    case true:
                        //read jwt token from file
                        const token = await this.readToken();
                        const tokenExpired = Math.floor(new Date().getTime() / 1000) > token.expires_at;

                        //check jwt token expired
                        switch (tokenExpired) {
                            case true:
                                try {
                                    //login to enlighten server
                                    const loginData = await this.axiosInstanceLogin(loginUrl);
                                    const cookie = loginData.headers['set-cookie'];

                                    //create axios instance with cookie
                                    const axiosInstanceToken = axios.create({
                                        method: 'GET',
                                        baseURL: CONSTANS.EnphaseUrls.BaseUrl,
                                        headers: {
                                            Accept: 'application/json',
                                            Cookie: cookie
                                        }
                                    });

                                    //get jwt token
                                    const tokenData = await axiosInstanceToken(tokenUrl);
                                    const token = tokenData.data;

                                    //save jwt token
                                    await this.saveToken(token);

                                    resolve(token);
                                } catch (error) {
                                    reject(error);
                                }
                                break;
                            case false:
                                resolve(token);
                                break;
                        }
                        break;
                    case false:
                        try {
                            //login to enlighten server
                            const loginData = await this.axiosInstanceLogin(loginUrl);
                            const cookie = loginData.headers['set-cookie'];

                            //create axios instance with cookie
                            const axiosInstanceToken = axios.create({
                                method: 'GET',
                                baseURL: CONSTANS.EnphaseUrls.BaseUrl,
                                headers: {
                                    Accept: 'application/json',
                                    Cookie: cookie
                                }
                            });

                            //get jwt token
                            const tokenData = await axiosInstanceToken(tokenUrl);
                            const token = tokenData.data;

                            //save jwt token to the file
                            await this.saveToken(token);

                            resolve(token);
                        } catch (error) {
                            reject(error);
                        }
                        break;
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    existToken() {
        return new Promise(async (resolve, reject) => {
            try {
                const tokenExist = await fsPromises.readFile(this.tokenFile).length > 30;
                resolve(tokenExist);
            } catch (error) {
                reject(error);
            }
        });
    }

    readToken() {
        return new Promise(async (resolve, reject) => {
            try {
                const tokenData = await fsPromises.readFile(this.tokenFile)
                const token = JSON.parse(tokenData);
                resolve(token);
            } catch (error) {
                reject(error);
            }
        });
    }

    saveToken(token) {
        return new Promise(async (resolve, reject) => {
            try {
                await fsPromises.writeFile(this.tokenFile, JSON.stringify(token, null, 2));
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }
};
module.exports = EnvoyToken;
