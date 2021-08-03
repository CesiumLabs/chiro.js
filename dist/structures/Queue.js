"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
/**
 * The Queue Structure for the Player.
 */
class Queue extends Array {
    constructor() {
        super(...arguments);
        /**
         * Current playing track.
         * @type {TrackData}
         */
        this.current = null;
        /** Last played track.
         * @type {TrackData}
         */
        this.previous = null;
    }
    /**
     * Add songs to the queue.
     * @param {TrackData | TrackData[]} track Track to add to queue
     */
    add(...tracks) {
        if (!this.current && tracks.length) {
            this.current.streamTime = 0;
            this.current = tracks[tracks.length - 1];
        }
        this.push(...tracks);
    }
    /**
     * Clear the queue.
     */
    clear() {
        this.splice(0);
    }
    /**
     * Shuffle the queue.
     */
    shuffle() {
        for (let i = this.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this[i], this[j]] = [this[j], this[i]];
        }
    }
}
exports.Queue = Queue;
