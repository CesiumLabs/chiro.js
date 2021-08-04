import { WSEvents, WSOpCodes } from "./Constants";

/**
 * @typedef Payload
 * @param {string} t Event Name
 * @param {number} op Event Op Code
 * @param {any} d Data
 */
export interface Payload {
    /** Event Name */
    t?: WSEvents;
    /** Event OP CODE */
    op?: WSOpCodes;
    /** Data */
    d?: any;
}

export interface ManagerOptions {
    /** Options for the nodes which is needed to connect. */
    nodes?: NodeOptions[];
    /** A required event to receive payload data. */
    onData(id: Snowflake, payload: Payload): void;
}

export interface PlayerOptions {
    /** Server/Guild ID */
    guild: Snowflake;
    /** Text Channel to send message in */
    textChannel: Snowflake;
    /** Voice Channel for client to connect */
    voiceChannel: Snowflake;
}

export interface NodeOptions {
    /** The host for the node. */
    host: string;
    /** The port for the node. */
    port?: number | boolean;
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
    /** The timeout used for api calls. */
    requestTimeout?: number;
    /** The ping interval to send pings to the gateway if needed. */
    pingInterval?: number;
}

export interface SearchQuery {
    /** IDentifier to mention what kind of search it is */
    identifier?: "ytsearch" | "scsearch" | "ytplaylist";
    /** Search Query and can be a link in case of identifier is a ytplaylist */
    query: string;
}

export interface TrackData {
    /** Track URL */
    url: string;
    /** Track title */
    title: string;
    /** Track Image */
    thumbnail: string;
    /** Track duration */
    duration: number;
    /** Track author */
    author: string;
    /** uploaded date */
    created_at: Date;
    /** Website track is from */
    extractor: string;
    /** Who requested this track */
    requestorID: Snowflake;
    /** Seek Time only available for current playing track*/
    streamTime: number;
}

export interface SearchResult {
    /** Type of Search Result */
    type: "SEARCH_RESULT" | "PLAYLIST" | "NO_RESULT";
    /** Playlist info in case it's a playlist */
    playlist?: PlaylistInfo;
    /** All tracks got from the query */
    tracks: Array<TrackData>;
    /** Who requested it */
    requestorID: Snowflake;
}

export interface PlaylistInfo {
    /** Playlist ID */
    id: string;
    /** Playlist title */
    title: string;
    /** Playlist URL */
    url: string;
    /** Playlist Author */
    author: string;
    /** Source Website */
    extractor: string;
}

export interface NodeDisconnectContent {
    /** The code used to close the gateway. */
    code: number;
    /** The reason for closing the gateway. */
    reason: string;
}

export type Snowflake = `${bigint}`;
