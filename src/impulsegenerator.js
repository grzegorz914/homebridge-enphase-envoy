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

        //update state
        this.timerState = true;
        this.emit('state', true);
    }

    stop() {
        this.timers.forEach(timer => clearInterval(timer));
        this.timers = [];

        //update state
        this.timerState = false;
        this.emit('state', false);
    }

    state() {
        this.emit('state', this.timerState);
        return this.timerState;
    }
}
module.exports = ImpulseGenerator;
