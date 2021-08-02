/// <reference types="node" />
import { EventEmitter } from "events";
import { Collection, Snowflake, User } from "discord.js";
import { ManagerOptions, PlayerOptions, SearchQuery, SearchResult } from "../Static/Interfaces";
import { Node } from "./Node";
import { Player } from "./Player";
/**
 * The Manager Class
 * @extends {EventEmitter}
 * @example
 * const manager = new Manager({
 *     node: {host: "localhost", port: 3000, password: "MySecurePassword"},
 *     send(id, payload){
 *          client.guilds.cache.get(id).shards.send(payload);
 *     }
 * })
 */
export declare class Manager extends EventEmitter {
    /**
     * The Collection of Players in this Manager
     * @type {Collection<Snowflake, Player>}
     */
    readonly players: Collection<string, Player>;
    /**
     * The Node
     * @type {Node}
     */
    node: Node;
    /**
     * Manager class option
     * @type {ManagerOptions}
     */
    readonly options: ManagerOptions;
    /**
     * If Manager Class initiated or not
     * @type {boolean}
     * @private
     */
    private initiated;
    /**
     * Nexus Access Token for REST API Calls
     * @type {string}
     */
    access_token: string;
    /**
     * Creates new Manager Instance
     * @param {ManagerOptions} options Manager Options
     * @example
     * const manager = new Manager({
     *     node: {host: "localhost", port: 3000, password: "MySecurePassword"},
     *     send(id, payload){
     *          client.guilds.cache.get(id).shards.send(payload);
     *     }
     * })
     */
    constructor(options: ManagerOptions);
    /**
     * Init Manager
     * @param {Snowflake} clientID Bot Application ID
     * @return {Manager}
     * @example
     * manager.init(client.user.id);
     */
    init(clientID: Snowflake): this;
    /**
     * Searching or Getting YouTube songs and playlist
     * @param {SearchQuery} SearchQuery Query Object
     * @param {User} requester User Object
     * @returns {SearchResult}
     * @example
     * const res = await player.search({query: "Play that funky music"}, message.author);
     * console.log(res);
     */
    search(SearchQuery: SearchQuery, requester: User): Promise<SearchResult>;
    /**
     * Internal Method to Resolve Search Result from nexus into Interface SearchResult
     * @param {Object} res search result
     * @param {User} requester user who searched
     * @return {SearchResult}
     * @private
     * @ignore
     */
    private resolveTrackData;
    /**
     * @ignore
     * @description Internal method to encapsulate Track Data received from Nexus into {TrackData}
     * @param {TrackData} data The Track details received from Nexus
     * @param {User} requester The person who requested it
     * @return {TrackData}
     * @private
     */
    private buildTrackData;
    /**
     * Creates a player instance and add it to players collection
     * @param {PlayerOptions} options Player Options
     * @return {Player}
     *
     */
    create(options: PlayerOptions): Player;
    /**
     * Send Player
     * @param {Snowflake} guild ID of Guild
     * @return {Player}
     */
    get(guild: Snowflake): Player | undefined;
    /**
     * Destroy the Node connection
     */
    destroyNode(): void;
    /**
     * Send Voice State Payload Received from Discord API to Nexus
     * @param {Object} data
     * @example
     * client.on('raw', (d)=>{
     *    manager.updateVoiceState(d);
     * });
     */
    updateVoiceState(data: any): void;
}
/**
 * Emitted when node connection is established
 * @event Manager#nodeConnect
 * @param {Node} node
 */
/**
 * Emitted when node connection is disconnected
 * @event Manager#nodeDisconnect
 * @param {Node} node
 */
/**
 * Emitted when node connection errors
 * @event Manager#nodeError
 * @param {Node} node
 */
/**
 * Emitted when Nexus is Ready to play
 * @event Manager#ready
 */
/**
 * Emitted when track is added to the queue
 * @event Manager#trackADD
 * @param {Player} player
 * @param {TrackData} Track
 */
/**
 * Emitted when tracks is added to the queue
 * @event Manager#tracksADD
 * @param {Player} player
 * @param {TrackData[]} Tracks
 */
/**
 * Emitted when track is start playing
 * @event Manager#trackStart
 * @param {Player} player
 * @param {TrackData} Track
 */
/**
 * Emitted when track is ends
 * @event Manager#trackEnd
 * @param {Player} player
 * @param {TrackData} Track
 */
/**
 * Emitted when track errors
 * @event Manager#trackError
 * @param {Player} player
 * @param {TrackData} Track
 */
/**
 * Emitted when Queue ends
 * @event Manager#queueEnd
 * @param {Player} player
 * @param {Payload} payload
 */
/**
 * Emitted when Voice Connection is Ready
 * @event Manager#voiceReady
 * @param {Payload} payload
 */
/**
 * Emitted when Voice Connection is disconnected
 * @event Manager#voiceDisconnect
 * @param {Payload} payload
 */
/**
 * Emitted when Voice Connection error
 * @event Manager#voiceError
 * @param {Payload} payload
 */
/**
 * Emitted when Audio Player Errors
 * @event Manager#audioPlayerError
 * @param {Payload} payload
 */
/**
 * @typedef {Object} ManagerOptions
 * @param {NodeOptions} [node] Node Options
 * @param {Snowflake} [clientID] Bot Application ID
 */
/**
 * A Twitter snowflake, except the epoch is 2015-01-01T00:00:00.000Z
 * ```
 * If we have a snowflake '266241948824764416' we can represent it as binary:
 *
 * 64                                          22     17     12          0
 *  000000111011000111100001101001000101000000  00001  00000  000000000000
 *       number of ms since Discord epoch       worker  pid    increment
 * ```
 * @typedef {string} Snowflake
 */
/**
 * @typedef {Object} SearchQuery
 * @param {string} identifier='ytsearch' IDentifier of type of query
 * @param {string} query Query to be searched for
 */
/**
 * @typedef {Object} SearchResult
 * @param {SEARCH_RESULT | PLAYLIST | NO_RESULT} type Type Of Search Result
 * @param {PlaylistInfo} [playlist] Playlist info
 * @param {Array<TrackData>} Array of Tracks
 * @param {User} requester User who requested it
 */
/**
 * @typedef {Object} PlaylistInfo
 * @param {string} id  ID Of Playlist
 * @param {string} title Title of Playlist
 * @param {string} url URL of Playlist
 * @param {string} author Uploader of the playlist
 * @param {string} extractor Website playlist is fetched from
 */
/**
 * @typedef {Object} TrackData
 * @param {string} url URL of the Track
 * @param {string} title Title of the Track
 * @param {string} [thumbnail] Image of the Track
 * @param {number} duration Duration of the Track
 * @param {string} author Uploader of the Track
 * @param {Date} created_at Track upload date
 * @param {string} extractor Website track is fetched from
 * @param {User} requested_by User who requested it
 */
