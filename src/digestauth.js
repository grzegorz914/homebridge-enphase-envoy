"use strict";
const crypto = require('crypto');
const axios = require('axios');

class DigestAuth {
    constructor(config) {
        this.user = config.user;
        this.passwd = config.passwd;
    };

    request(path, options) {
        return new Promise(async (resolve, reject) => {
            const url = `${options.baseURL}${path}`;

            try {
                const data = await axios.request(url, options);
                resolve(data);
            } catch (error) {
                const resError = error.response;
                const resHeaders = resError.headers["www-authenticate"];
                if (resError === undefined || resError.status !== 401 || !(resHeaders === null || resHeaders === void 0 ? void 0 : resHeaders.includes('nonce'))) {
                    reject(`Digest authentication response error: ${error}`);
                    return;
                };

                try {
                    let count = 0;
                    const authDetails = resHeaders.split(', ').map((v) => v.split('='));
                    const realm = authDetails.find((el) => el[0].toLowerCase().includes("realm"))[1].replace(/"/g, '');
                    const nonce = authDetails.find((el) => el[0].toLowerCase().includes("nonce"))[1].replace(/"/g, '');
                    const nonceCount = (`00000000${count++}`).slice(-8);
                    const cnonce = crypto.randomBytes(24).toString('hex');
                    const md5 = str => crypto.createHash('md5').update(str).digest('hex');
                    const HA1 = md5(`${this.user}:${realm}:${this.passwd}`);
                    const HA2 = md5(`${options.method}:${url}`);
                    const response = md5(`${HA1}:${nonce}:${nonceCount}:${cnonce}:auth:${HA2}`);

                    //get data with digest authorization
                    options.headers["authorization"] = `Digest username=${this.user},realm=${realm},nonce=${nonce},uri=${url},qop=auth,algorithm=MD5,response=${response},nc=${nonceCount},cnonce=${cnonce}`;
                    const data = await axios.request(url, options);

                    resolve(data);
                } catch (error) {
                    reject(`Digest authentication data error: ${error}`);
                };
            };
        });
    };
};
module.exports = DigestAuth;