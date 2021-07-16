import { TrackData } from "../Static/Interfaces";

export class Queue extends Array<TrackData> {
    /** Current playing track */
    public current: TrackData | null = null;
    /** Last played track */
    public previous: TrackData | null = null;

    /**
     * Add songs to the queue
     * @param track
     */
    public add(track: TrackData | TrackData[]) {
        if (!this.current) {
            if (!Array.isArray(track)) {
                this.current = track;
                return;
            } else {
                this.current = (track = [...track]).shift();
            }
        }
        if (track instanceof Array) this.push(...track);
        else this.push(track);
    }
    /** clear the queue */
    public clear(): void {
        this.splice(0);
    }

    /** Shuffle the queue */
    public shuffle(): void {
        for (let i = this.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this[i], this[j]] = [this[j], this[i]];
        }
    }
}
