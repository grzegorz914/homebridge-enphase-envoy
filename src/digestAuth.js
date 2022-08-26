"use strict";
const crypto = require('crypto');
const axios = require('axios');

class axiosDigestAuth {
    constructor(config) {
        this.user = config.user;
        this.passwd = config.passwd;
    };

    async request(options) {
        let resHeaders;
        let resMethod;
        let count = 0;

        try {
            return await axios.request(options);
        } catch (error) {
            if (error.response === undefined || error.response.status !== 401 || !((resHeaders = error.response.headers["www-authenticate"]) === null || resHeaders === void 0 ? void 0 : resHeaders.includes('nonce'))) {
                throw error;
            };

            const authDetails = error.response.headers['www-authenticate'].split(', ').map((v) => v.split('='));
            const nonceCount = (`00000000${count++}`).slice(-8);
            const cnonce = crypto.randomBytes(24).toString('hex')
            const realm = authDetails.find((el) => el[0].toLowerCase().indexOf("realm") > -1)[1].replace(/"/g, '');
            const nonce = authDetails.find((el) => el[0].toLowerCase().indexOf("nonce") > -1)[1].replace(/"/g, '');

            const md5 = str => crypto.createHash('md5').update(str).digest('hex');
            const HA1 = md5(`${this.user}:${realm}:${this.passwd}`);
            const HA2 = md5(`${(resMethod = options.method) !== null && resMethod !== void 0 ? resMethod : "GET"}:${options.url}`)
            const response = md5(`${HA1}:${nonce}:${nonceCount}:${cnonce}:auth:${HA2}`);
            const authorization = `Digest username="${this.user}",realm="${realm}",nonce="${nonce}",uri="${options.url}",qop="auth",algorithm="MD5",response="${response}",nc="${nonceCount}",cnonce="${cnonce}"`;

            if (options.headers) {
                options.headers["authorization"] = authorization;
            } else {
                options.headers = {
                    authorization
                };
            };
            return axios.request(options);
        };
    };
};

module.exports = axiosDigestAuth;