"use strict";
const EventEmitter = require('events');

class ImpulseGenerator extends EventEmitter {
    constructor() {
        super();
    }

    start(outputs) {
        this.timers = [];
        outputs.forEach(({ timerName, sampling }) => {
            const timer = setInterval(() => {
                this.emit(timerName);
            }, sampling);

            this.timers.push(timer);
        });
    }

    stop() {
        this.timers.forEach(timer => clearInterval(timer));
        this.timers = [];
    }
}
module.exports = ImpulseGenerator;
