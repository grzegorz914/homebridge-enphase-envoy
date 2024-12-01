import EventEmitter from 'events';

class ImpulseGenerator extends EventEmitter {
    constructor() {
        super();
        this.genState = false;
    }

    async start(timers) {
        if (this.genState) {
            await this.stop();
        }

        this.timers = [];
        for (const timer of timers) {
            this.emit(timer.name);

            const newTimer = setInterval(() => {
                this.emit(timer.name);
            }, timer.sampling);
            this.timers.push(newTimer);
        };

        //update state
        this.genState = true;
        this.state();
    }

    async stop() {
        if (this.genState) {
            this.timers.forEach(timer => clearInterval(timer));
        }

        //update state
        this.timers = [];
        this.genState = false;
        this.state();
    }

    state() {
        this.emit('state', this.genState);
        return this.genState;
    }
}
export default ImpulseGenerator;
