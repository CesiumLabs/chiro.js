"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
/**
 * The Queue
 */
class Queue extends Array {
    constructor() {
        super(...arguments);
        /**
         * Current playing track
         * @type {TrackData}
         */
        this.current = null;
        /** Last played track
         * @type {TrackData}
         */
        this.previous = null;
    }
    /**
     * Add songs to the queue
     * @param {TrackData | TrackData[]} track Track to add to queue
     */
    add(track) {
        if (!this.current) {
            if (!Array.isArray(track)) {
                this.current = track;
                return;
            }
            else {
                this.current = (track = [...track]).shift();
            }
        }
        if (track instanceof Array)
            this.push(...track);
        else
            this.push(track);
    }
    /**
     * clear the queue
     */
    clear() {
        this.splice(0);
    }
    /**
     * Shuffle the queue
     */
    shuffle() {
        for (let i = this.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this[i], this[j]] = [this[j], this[i]];
        }
    }
}
exports.Queue = Queue;
