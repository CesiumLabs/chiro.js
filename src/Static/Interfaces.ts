import { Node } from "../structures/Node";
import { WSEvents, WSOpCodes } from "./Constants";
import { User } from "discord.js";
import { Player } from "../structures/Player";
import { Queue } from "../structures/Queue";
export interface Extendable {
    Player: typeof Player;
    Queue: typeof Queue;
    Node: typeof Node;
}
export interface Payload {
    t?: WSEvents;
    op?: WSOpCodes;
    d?: any;
}
export interface Manager {}

export interface ManagerOptions {
    node?: NodeOptions;
    clientId?: string;
    send(id: string, payload: Payload): void;
}
export interface PlayerOptions {
    guild: string;
    textChannel: string;
    voiceChannel?: string;
    node?: string;
    volume?: number;
    selfMute?: boolean;
    selfDeafen?: boolean;
}
export interface NodeOptions {
    /** The host for the node. */
    host: string;
    /** The port for the node. */
    port?: number;
    /** The password for the node. */
    password?: string;
    /** Whether the host uses SSL. */
    secure?: boolean;
    /** The identifier for the node. */
    identifier?: string;
    /** The retryAmount for the node. */
    retryAmount?: number;
    /** The retryDelay for the node. */
    retryDelay?: number;
    /** The timeout used for api calls */
    requestTimeout?: number;
}

export interface SearchQuery {
    identifier: "ytsearch" | "scsearch" | "ytplaylist";
    query: string;
}
export interface TrackData {
    url?: string;
    title?: string;
    thumbnail?: string;
    duration?: number;
    author?: string;
    created_at?: Date;
    extractor?: string;
    initial?: boolean;
    requested_by?: string;
}
export interface SearchResult {
    type: "SEARCH_RESULT" | "PLAYLIST" | "NO_RESULT";
    playlist?: PlaylistInfo;
    tracks: Array<TrackData>;
    requester: User;
}
export interface PlaylistInfo {
    id: string;
    title: string;
    url: string;
    author: string;
    extractor: string;
}
