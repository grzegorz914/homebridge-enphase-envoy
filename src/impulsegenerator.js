"use strict";
const EventEmitter = require('events');

class ImpulseGenerator extends EventEmitter {
    constructor() {
        super();
        this.timerState = false;
    }

    start(outputs) {
        this.timers = [];
        outputs.forEach(({ timerName, sampling }) => {
            const timer = setInterval(() => {
                this.emit(timerName);
            }, sampling);

            this.timers.push(timer);
        });

        this.timerState = true;
        this.emit('state', true);
    }

    stop() {
        this.timers.forEach(timer => clearInterval(timer));
        this.timers = [];
        this.timerState = false;
        this.emit('state', false);
    }

    state() {
        return this.timerState;
    }
}
module.exports = ImpulseGenerator;
