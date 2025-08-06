import EventEmitter from 'events';

class ImpulseGenerator extends EventEmitter {
    constructor() {
        super();
        this.timersState = false;
        this.timers = [];
    }

    async start(timers) {
        if (this.timersState) {
            this.state(true); // Re-emit current state
            return true;
        }

        this.timers = [];

        for (const timer of timers) {
            // Immediately emit the timer event once on start
            this.emit(timer.name);

            const interval = setInterval(() => {
                this.emit(timer.name);
            }, timer.sampling);

            this.timers.push(interval);
        }

        this.state(true);
        return true;
    }

    async stop() {
        if (!this.timersState) {
            this.state(false); // Re-emit current state
            return true;
        }

        for (const timer of this.timers) {
            clearInterval(timer);
        }

        this.timers = [];
        this.state(false);
        return true;
    }

    state(state) {
        this.timersState = state;
        this.emit('state', state);
    }
}

export default ImpulseGenerator;

