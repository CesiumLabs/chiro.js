import { TrackData } from "../static/Interfaces";

/**
 * The Queue Structure for the Player.
 */
export class Queue extends Array<TrackData> {
    /**
     * Current playing track.
     * @type {TrackData}
     */
    public current: TrackData | null = null;

    /** Last played track.
     * @type {TrackData}
     */
    public previous: TrackData | null = null;

    /**
     * Add songs to the queue.
     * @param {TrackData | TrackData[]} track Track to add to queue
     */
    public add(...tracks: TrackData[]) {
        if (!this.current && tracks.length) {
            this.current = tracks[0];
            this.current.streamTime = 0;
        }

        this.push(...tracks);
    }

    /**
     * Clear the queue.
     */
    public clear() {
        this.splice(0);
    }

    /**
     * Shuffle the queue.
     */
    public shuffle() {
        for (let i = this.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this[i], this[j]] = [this[j], this[i]];
        }
    }
}
