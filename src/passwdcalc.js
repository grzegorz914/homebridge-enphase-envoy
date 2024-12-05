import crypto from 'crypto';
import EventEmitter from 'events';

class PasswdCalc extends EventEmitter {
    constructor(config) {
        super();
        this.user = config.user;
        this.realm = config.realm;
        this.serialNumber = config.serialNumber;
    };

    async getPasswd() {
        try {
            const hashString = `[e]${this.user}@${this.realm}#${this.serialNumber} EnPhAsE eNeRgY `;
            const inputString = crypto.createHash('md5').update(hashString).digest('hex');
            const digestIterator = this.digestSnippet(inputString);

            const counters = inputString
                .split("")
                .reduce((previousValue, currentValue, currentIndex, array) => {
                    switch (currentValue) {
                        case "0":
                            previousValue[0] += 1;
                            break;
                        case "1":
                            previousValue[1] += 1;
                            break;
                    };
                    return previousValue;
                }, [0, 0]);

            let countZero = counters[0];
            let countOne = counters[1];
            let password = '';
            for (const cc of digestIterator) {
                if (countZero == 3 || countZero == 6 || countZero == 9) {
                    countZero--;
                };
                if (countZero > 20) {
                    countZero = 20;
                };
                if (countZero < 0) {
                    countZero = 0;
                };

                if (countOne == 9 || countOne == 15) {
                    countOne--;
                };
                if (countOne > 26) {
                    countOne = 26;
                };
                if (countOne < 0) {
                    countOne = 0;
                };

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
                };
            };

            return password;
        } catch (error) {
            this.emit('error', `Generate password error: ${error}`);
        };
    };

    *digestSnippet(inputString) {
        let iterationCount = 0;
        const length = inputString.length;
        for (let i = length - 1; i > length - 9; i--) {
            yield inputString[i];
        };
        return iterationCount;
    };
};
export default PasswdCalc;