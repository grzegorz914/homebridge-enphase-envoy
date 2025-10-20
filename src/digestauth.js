import crypto from 'crypto';
import axios from 'axios';

class DigestAuth {
    constructor(config) {
        this.user = config.user;
        this.passwd = config.passwd;
        this.count = 0;
    }

    async request(path, options) {
        const url = `${options.baseURL}${path}`;
        options.headers = options.headers || {};

        try {
            return await axios.request(url, options);
        } catch (error) {
            const resError = error.response;
            if (!resError || resError.status !== 401) throw new Error(`Digest authentication response error: ${resError ? resError.status : 'Unknown error'}`);

            const resHeaders = resError.headers["www-authenticate"];
            if (!resHeaders || !resHeaders.includes('nonce')) throw new Error(`Digest authentication headers error: ${resHeaders || 'Header not found'}`);

            try {
                const authDetails = {};
                resHeaders.match(/(\w+)=("([^"]+)"|([^,]+))/g).forEach(part => {
                    const match = part.match(/(\w+)=("([^"]+)"|([^,]+))/);
                    authDetails[match[1]] = match[3] || match[4];
                });

                const realm = authDetails.realm;
                const nonce = authDetails.nonce;
                const nonceCount = (`00000000${this.count++}`).slice(-8);
                const cnonce = crypto.randomBytes(24).toString('hex');

                const md5 = str => crypto.createHash('md5').update(str).digest('hex');
                const HA1 = md5(`${this.user}:${realm}:${this.passwd}`);
                const HA2 = md5(`${options.method}:${path}`);
                const response = md5(`${HA1}:${nonce}:${nonceCount}:${cnonce}:auth:${HA2}`);
                const authHeader = `Digest username="${this.user}", realm="${realm}", nonce="${nonce}", uri="${path}", qop=auth, algorithm=MD5, response="${response}", nc=${nonceCount}, cnonce="${cnonce}"`;
                options.headers["authorization"] = authHeader;

                return await axios.request(url, options);
            } catch (error) {
                throw new Error(`Digest authentication error: ${error}`);
            }
        }
    }
}

export default DigestAuth;

