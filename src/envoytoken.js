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

        if (!fs.existsSync(this.tokenFile)) {
            const object = JSON.stringify({});
            fs.writeFileSync(this.tokenFile, object);
        };

        //create axios instance
        this.axiosInstanceLogin = axios.create({
            method: 'POST',
            baseURL: CONSTANS.EnphaseUrls.BaseUrl
        });
    };

    getToken() {
        return new Promise(async (resolve, reject) => {
            try {
                const tokenExist = await fsPromises.readFile(this.tokenFile).length > 30;
                switch (tokenExist) {
                    case true:
                        const token = JSON.parse(fs.readFileSync(this.tokenFile));
                        const tokenExpired = Math.floor(new Date().getTime() / 1000) > token.expires_at;
                        switch (tokenExpired) {
                            case true:
                                try {
                                    //login to enlighten server
                                    const loginUrl = `${CONSTANS.EnphaseUrls.Login}?user[email]=${this.user}&user[password]=${this.passwd}`;
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
                                    const tokenUrl = `${CONSTANS.EnphaseUrls.EntrezAuthToken}?serial_num=${this.serialNumber}`;
                                    const tokenData = await axiosInstanceToken(tokenUrl);

                                    //save jwt token to the file
                                    const token = tokenData.data;
                                    await fsPromises.writeFile(this.tokenFile, JSON.stringify(token, null, 2));

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
                            const loginUrl = `${CONSTANS.EnphaseUrls.Login}?user[email]=${this.user}&user[password]=${this.passwd}`;
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
                            const tokenUrl = `${CONSTANS.EnphaseUrls.EntrezAuthToken}?serial_num=${this.serialNumber}`;
                            const tokenData = await axiosInstanceToken(tokenUrl);

                            //save jwt token to the file
                            const token = tokenData.data;
                            await fsPromises.writeFile(this.tokenFile, JSON.stringify(token, null, 2));

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
};
module.exports = EnvoyToken;