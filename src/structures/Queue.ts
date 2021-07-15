import { TrackData } from "../Static/Interfaces";

export class Queue extends Array<TrackData> {
    public current: TrackData | null = null;
    public previous: TrackData | null = null;
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
}
