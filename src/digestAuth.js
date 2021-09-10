"use strict";
const crypto = require('crypto');
const axios = require('axios');
let count = 0;

class axiosDigestAuth {
    constructor({
        user,
        passwd
    }) {
        this.user = user;
        this.passwd = passwd;
    }

    async request(options) {
        let _a;
        let _b;
        try {
            return await axios.request(options);
        } catch (err) {
            if (err.response === undefined || err.response.status !== 401 || !((_a = err.response.headers["www-authenticate"]) === null || _a === void 0 ? void 0 : _a.includes('nonce'))) {
                throw err;
            }
            const authDetails = err.response.headers['www-authenticate'].split(', ').map((v) => v.split('='));

            ++count;
            const nonceCount = ('00000000' + count).slice(-8);
            const cnonce = crypto.randomBytes(24).toString('hex');

            const realm = authDetails.find((el) => el[0].toLowerCase().indexOf("realm") > -1)[1].replace(/"/g, '');
            const nonce = authDetails.find((el) => el[0].toLowerCase().indexOf("nonce") > -1)[1].replace(/"/g, '');

            const md5 = str => crypto.createHash('md5').update(str).digest('hex');

            const HA1 = md5(`${this.user}:${realm}:${this.passwd}`);
            const HA2 = md5(`${(_b = options.method) !== null && _b !== void 0 ? _b : "GET"}:${options.url}`)
            const response = md5(`${HA1}:${nonce}:${nonceCount}:${cnonce}:auth:${HA2}`);

            const authorization = `Digest username="${this.user}",realm="${realm}",` + `nonce="${nonce}",uri="${options.url}",qop="auth",algorithm="MD5",` + `response="${response}",nc="${nonceCount}",cnonce="${cnonce}"`;

            if (options.headers) {
                options.headers["authorization"] = authorization;
            } else {
                options.headers = {
                    authorization
                };
            }
            return axios.request(options);
        }
    };
}
module.exports = axiosDigestAuth;