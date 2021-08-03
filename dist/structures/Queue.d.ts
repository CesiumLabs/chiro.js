import { TrackData } from "../Static/Interfaces";
/**
 * The Queue Structure for the Player.
 */
export declare class Queue extends Array<TrackData> {
    /**
     * Current playing track.
     * @type {TrackData}
     */
    current: TrackData | null;
    /** Last played track.
     * @type {TrackData}
     */
    previous: TrackData | null;
    /**
     * Add songs to the queue.
     * @param {TrackData | TrackData[]} track Track to add to queue
     */
    add(...tracks: TrackData[]): void;
    /**
     * Clear the queue.
     */
    clear(): void;
    /**
     * Shuffle the queue.
     */
    shuffle(): void;
}
