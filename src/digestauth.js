import crypto from 'crypto';
import axios from 'axios';

class DigestAuth {
    constructor(config) {
        this.user = config.user;
        this.passwd = config.passwd;
        this.count = 0;
    };

    async request(path, options) {
        const url = `${options.baseURL}${path}`;

        try {
            const data = await axios.request(url, options);
            return data;
        } catch (error) {
            const resError = error.response;
            if (!resError || resError.status !== 401) {
                throw new Error(`Digest authentication response error: ${resError ? resError.status : 'Unknown error'}`);
            };

            const resHeaders = resError.headers["www-authenticate"];
            if (!(resHeaders || !resHeaders.includes('nonce'))) {
                throw new Error(`Digest authentication headers error: ${resHeaders ? resHeaders : 'Header not found'}`);
            };

            try {
                const authDetails = resHeaders.split(', ').map((v) => v.split('='));
                const realm = authDetails.find((el) => el[0].toLowerCase().includes("realm"))[1].replace(/"/g, '');
                const nonce = authDetails.find((el) => el[0].toLowerCase().includes("nonce"))[1].replace(/"/g, '');
                const nonceCount = (`00000000${this.count++}`).slice(-8);
                const cnonce = crypto.randomBytes(24).toString('hex');
                const md5 = str => crypto.createHash('md5').update(str).digest('hex');
                const HA1 = md5(`${this.user}:${realm}:${this.passwd}`);
                const HA2 = md5(`${options.method}:${url}`);
                const response = md5(`${HA1}:${nonce}:${nonceCount}:${cnonce}:auth:${HA2}`);

                //get data with digest authorization
                const authHeaders = `Digest username=${this.user},realm=${realm},nonce=${nonce},uri=${url},qop=auth,algorithm=MD5,response=${response},nc=${nonceCount},cnonce=${cnonce}`;
                options.headers["authorization"] = authHeaders;
                const data = await axios.request(url, options);

                return data;
            } catch (error) {
                throw new Error(`Digest authentication error: ${error}`);
            };
        };
    };
};
export default DigestAuth;
