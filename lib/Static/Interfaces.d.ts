import { WSEvents, WSOpCodes } from "./Constants";
import { Snowflake, User } from "discord.js";
/**
 * @typedef Payload
 * @param {string} t Event
 * @param {string} op OPCode
 * @param {any} d data
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
    /** Node need to connect */
    node?: NodeOptions;
    /** Client ID */
    clientID?: Snowflake;
    /** Send payload to guild */
    send(id: Snowflake, payload: Payload): void;
}
export interface PlayerOptions {
    /** Server/Guild ID */
    guild: Snowflake;
    /** Text Channel to send message in */
    textChannel: string;
    /** Voice Channel for client to connect */
    voiceChannel: string;
    /** Initial volume set for the client */
    volume?: number;
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
    thumbnail?: string;
    /** Track duration */
    duration: number;
    /** Track author */
    author: string;
    /** uploaded date */
    created_at?: Date;
    /** Website track is from */
    extractor?: string;
    /** Who requested this track */
    requested_by?: User;
}
export interface SearchResult {
    /** Type of Search Result */
    type: "SEARCH_RESULT" | "PLAYLIST" | "NO_RESULT";
    /** Playlist info in case it's a playlist */
    playlist?: PlaylistInfo;
    /** All tracks got from the query */
    tracks: Array<TrackData>;
    /** Who requested it */
    requester: User;
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
