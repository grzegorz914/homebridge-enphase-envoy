"use strict";
const crypto = require('crypto');
const REALM = 'enphaseenergy.com'
const USER_NAME = 'installer';

class passwdCalc {
    constructor(config) {
        const serialNumber = config.serialNumber;
        const digest = this.getDigest(serialNumber, USER_NAME, REALM);
        const counters = this.countZeroesOnes(digest);
        const digestIterator = this.digestSnippet(digest);
        const countZero = counters[0];
        const countOne = counters[1];

        this.password = this.getPassword(countZero, countOne, digestIterator);
    };


    getDigest(serialNumber, userName, realm) {
        const hashstring = '[e]' + userName + '@' + ((realm == '') ? REALM : realm) + '#' + serialNumber + ' EnPhAsE eNeRgY ';
        return crypto.createHash('md5').update(hashstring).digest("hex")
    }


    countZeroesOnes(inputString) {
        return inputString
            .split("")
            .reduce((accumulator, currentValue, currentIndex, array) => {
                switch (currentValue) {
                    case "0":
                        accumulator[0] += 1;
                        break;
                    case "1":
                        accumulator[1] += 1;
                        break;
                };
                return accumulator;
            },
                [0, 0]);
    }


    *digestSnippet(inputString) {
        let iterationCount = 0;
        const length = inputString.length;
        for (let i = length - 1; i > length - 9; i--) {
            yield inputString[i];
        }
        return iterationCount;
    }


    getPassword(countZero, countOne, digestIterator) {
        let password = '';

        for (const cc of digestIterator) {
            if (countZero == 3 || countZero == 6 || countZero == 9) {
                countZero--;
            }
            if (countZero > 20) {
                countZero = 20;
            }
            if (countZero < 0) {
                countZero = 0;
            }

            if (countOne == 9 || countOne == 15) {
                countOne--;
            }
            if (countOne > 26) {
                countOne = 26;
            }
            if (countOne < 0) {
                countOne = 0;
            }

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
    }
};
module.exports = passwdCalc;