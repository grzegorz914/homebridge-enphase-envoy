import crypto from 'crypto';

class PasswdCalc {
    constructor(config) {
        this.user = config.user;
        this.realm = config.realm;
        this.serialNumber = config.serialNumber;
    }

    async getPasswd() {
        try {
            const hashString = `[e]${this.user}@${this.realm}#${this.serialNumber} EnPhAsE eNeRgY `;
            const inputString = crypto.createHash('md5').update(hashString).digest('hex');
            const digestIterator = this.digestSnippet(inputString);

            const counters = inputString.split("").reduce((acc, val) => {
                if (val === "0") acc[0]++;
                else if (val === "1") acc[1]++;
                return acc;
            }, [0, 0]);

            let [countZero, countOne] = counters;
            let password = '';

            const MAX_ZERO = 20;
            const MAX_ONE = 26;
            const SKIP_ZERO = [3, 6, 9];
            const SKIP_ONE = [9, 15];

            for (const cc of digestIterator) {
                if (SKIP_ZERO.includes(countZero)) countZero--;
                if (countZero > MAX_ZERO) countZero = MAX_ZERO;
                if (countZero < 0) countZero = 0;

                if (SKIP_ONE.includes(countOne)) countOne--;
                if (countOne > MAX_ONE) countOne = MAX_ONE;
                if (countOne < 0) countOne = 0;

                switch (cc) {
                    case "0":
                        password += String.fromCharCode('f'.charCodeAt(0) + countZero);
                        countZero--;
                        break;
                    case "1":
                        password += String.fromCharCode('@'.charCodeAt(0) + countOne);
                        countOne--;
                        break;
                    default:
                        password += cc;
                        break;
                }
            }

            return password;
        } catch (error) {
            throw new Error(`Generate password error: ${error.message}`);
        }
    }

    *digestSnippet(inputString) {
        for (let i = inputString.length - 1; i > inputString.length - 9; i--) {
            yield inputString[i];
        }
    }
}

export default PasswdCalc;