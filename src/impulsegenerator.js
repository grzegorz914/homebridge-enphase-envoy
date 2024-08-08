"use strict";
const EventEmitter = require('events');

class ImpulseGenerator extends EventEmitter {
    constructor() {
        super();
        this.timersState = false;
    }

    start(timers) {
        this.timers = [];
        timers.forEach(({ timerName, sampling }) => {
            const timer = setInterval(() => {
                this.emit(timerName);
            }, sampling);
            this.timers.push(timer);
        });

        //update state
        this.timersState = true;
        this.emit('state', true);
    }

    stop() {
        this.timers.forEach(timer => clearInterval(timer));
        this.timers = [];

        //update state
        this.timersState = false;
        this.emit('state', false);
    }

    state() {
        this.emit('state', this.timersState);
        return this.timersState;
    }
}
module.exports = ImpulseGenerator;
