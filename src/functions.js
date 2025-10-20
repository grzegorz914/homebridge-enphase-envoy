import { promises as fsPromises } from 'fs';
import axios from 'axios';
import { Agent } from 'https';
import { ApiCodes, TimezoneLocaleMap } from './constants.js';

class Functions {
    constructor() {
    }

    async saveData(path, data, stringify = true) {
        try {
            data = stringify ? JSON.stringify(data, null, 2) : data;
            await fsPromises.writeFile(path, data);
            return true;
        } catch (error) {
            throw new Error(`Save data error: ${error}`);
        }
    }

    async readData(path) {
        try {
            const data = await fsPromises.readFile(path);
            return data;
        } catch (error) {
            throw new Error(`Read data error: ${error}`);
        }
    }

    async getStatus(status) {
        if (!Array.isArray(status) || status.length === 0) {
            return 'OK';
        }

        const mapped = status.map(a => {
            const value = ApiCodes[a];
            return (typeof value === 'string' && value.trim() !== '') ? value.trim() : a;
        }).filter(Boolean); // Remove any empty/null/undefined values

        if (mapped.length === 0) {
            return 'OK';
        }

        const result = mapped.join(', ');

        // Add ellipsis only if result is actually truncated
        return result.length > 64 ? result.slice(0, 61) + '…' : result;
    }

    isValidValue(v) {
        return v !== undefined && v !== null && !(typeof v === 'number' && Number.isNaN(v));
    }

    scaleValue(value, inMin, inMax, outMin, outMax) {
        if (!this.isValidValue(value) || !this.isValidValue(inMin) || !this.isValidValue(inMax) || !this.isValidValue(outMin) || !this.isValidValue(outMax)) return null;

        if (inMax === inMin) return outMin;
        if (value <= inMin) return outMin;
        if (value >= inMax) return outMax;

        const scaled = ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
        if (scaled > outMax) return outMax;

        return scaled < 0.5 ? outMin : Math.round(scaled);
    }

    evaluateCompareMode(value, threshold, mode) {
        switch (mode) {
            case 0: return value > threshold;
            case 1: return value >= threshold;
            case 2: return value === threshold;
            case 3: return value < threshold;
            case 4: return value <= threshold;
            case 5: return value !== threshold;
            default: return false;
        }
    }

    formatTimestamp(ts, timezone) {
        const locale = TimezoneLocaleMap[timezone] || 'en-US';
        const options = {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        };

        if (!ts) {
            return new Date().toLocaleString(locale, options);
        }

        const numeric = Number(ts);
        if (Number.isInteger(numeric)) {
            const ms = numeric < 1e12 ? numeric * 1000 : numeric;
            return new Date(ms).toLocaleString(locale, options);
        }

        return ts;
    }

    powerPeak(power, powerPeakStored) {
        if (!this.isValidValue(power) && !this.isValidValue(powerPeakStored)) return null;
        if (!this.isValidValue(power)) return powerPeakStored;
        if (!this.isValidValue(powerPeakStored)) return power;

        // dodatnie — szczyt rośnie w górę
        if (power >= 0 && power > powerPeakStored) return power;

        // ujemne — szczyt rośnie w dół
        if (power < 0 && power < powerPeakStored) return power;

        return powerPeakStored;
    }

    createAxiosInstance(url, authHeader = null, cookie = null) {
        return axios.create({
            baseURL: url,
            headers: {
                Accept: 'application/json',
                ...(authHeader ? { Authorization: authHeader } : {}),
                ...(cookie ? { Cookie: cookie } : {}),
            },
            withCredentials: true,
            httpsAgent: new Agent({
                keepAlive: false,
                rejectUnauthorized: false
            }),
            timeout: 60000
        });
    }

}
export default Functions