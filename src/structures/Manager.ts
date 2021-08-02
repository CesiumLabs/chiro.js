import { EventEmitter } from "events";
import { Collection, Snowflake, User } from "discord.js";
import {
    ManagerOptions,
    Payload,
    PlayerOptions,
    SearchQuery,
    SearchResult,
    TrackData,
} from "../Static/Interfaces";
import { Node } from "./Node";

import { Player } from "./Player";
import { ResolveTracks } from "./Utils";

export interface Manager {
    /**
     * Emitted when node connection is established
     * @event Manager#nodeConnect
     * @param {Node} node Nexus Node
     */
    on(event: "nodeConnect", listener: (node: Node) => void): this;

    /**
     * Emitted when node connection is disconnected
     * @event Manager#nodeDisconnect
     * @param {Node} node Nexus Node
     */
    on(event: "nodeDisconnect", listener: (node: Node) => void): this;

    /**
     * Emitted when node connection errors
     * @event Manager#nodeError
     * @param {Node} node Nexus Node
     */
    on(event: "nodeError", listener: (node: Node) => void): this;

    /**
     * Emitted when Nexus is Ready to play
     * @event Manager#ready
     */
    on(event: "ready", listener: () => void): this;

    /**
     * Emitted when track is start playing
     * @event Manager#trackStart
     * @param {Player} player Player
     * @param {TrackData} Track Current Track
     */
    on(
        event: "trackStart",
        listener: (player: Player, track: TrackData) => void
    ): this;

    /**
     * Emitted when track is ends
     * @event Manager#trackEnd
     * @param {Player} player Player
     * @param {TrackData} Track Ended Track
     */
    on(
        event: "trackEnd",
        listener: (player: Player, track: TrackData) => void
    ): this;

    /**
     * Emitted when track errors
     * @event Manager#trackError
     * @param {Player} player Player
     * @param {TrackData} Track Error Track
     */
    on(
        event: "trackError",
        listener: (player: Player, track: TrackData) => void
    ): this;

    /**
     * Emitted when Queue ends
     * @event Manager#queueEnd
     * @param {Player} player Player
     */
    on(event: "queueEnd", listener: (player: Player) => void): this;

    /**
     * Emitted when Voice Connection is Ready
     * @event Manager#voiceReady
     * @param {Player} player Player
     */
    on(event: "voiceReady", listener: (player: Player) => void): this;

    /**
     * Emitted when Voice Connection is disconnected
     * @event Manager#voiceDisconnect
     * @param {Player} player Player
     */
    on(event: "voiceDisconnect", listener: (player: Player) => void): this;

    /**
     * Emitted when Voice Connection error
     * @event Manager#voiceError
     * @param {Player} player Player
     * @param {Payload} payload raw payload from Nexus
     */
    on(
        event: "voiceError",
        listener: (player: Player, payload: Payload) => void
    ): this;

    /**
     * Emitted when Audio Player Errors
     * @event Manager#audioPlayerError
     * @param {Player} player Player
     * @param {Payload} payload raw payload from nexus
     */
    on(
        event: "audioPlayerError",
        listener: (player: Player, payload: Payload) => void
    ): this;

    /**
     * Emitted when Player is created
     * @event Manager#playerCreated
     * @param {Player} player Player
     */
    on(event: "playerCreated", listener: (player: Player) => void): this;

    /**
     * Emitted when player is destroyed
     * @event Manager#playerDestroy
     * @param {Player} player Old Player
     */
    on(event: "playerDestroy", listener: (player: Player) => void): this;
}

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

export class Manager extends EventEmitter {
    /**
     * The Collection of Players in this Manager
     * @type {Collection<Snowflake, Player>}
     */
    public readonly players = new Collection<Snowflake, Player>();

    /**
     * The Node
     * @type {Node}
     */
    public node: Node;

    /**
     * Manager class option
     * @type {ManagerOptions}
     */
    public readonly options: ManagerOptions;

    /**
     * If Manager Class initiated or not
     * @type {boolean}
     * @private
     */
    private initiated = false;

    /**
     * Nexus Access Token for REST API Calls
     * @type {string}
     */
    public access_token: string;

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
    constructor(options: ManagerOptions) {
        super();

        Player.init(this);
        Node.init(this);

        this.options = {
            node: { identifier: "default", host: "localhost" },
            ...options,
        };

        if (this.options.node) {
            new Node(this.options.node);
        }
    }

    /**
     * Init Manager
     * @param {Snowflake} clientId Bot Application ID
     * @return {Manager}
     * @example
     * manager.init(client.user.id);
     */
    public init(clientId: Snowflake): this {
        if (this.initiated) return this;
        if (typeof clientId !== "undefined") this.options.clientId = clientId;
        this.node.connect();
        this.initiated = true;
        return this;
    }

    /**
     * Searching or Getting YouTube songs and playlist
     * @param {SearchQuery} SearchQuery Query Object
     * @param {User} requester User Object
     * @returns {SearchResult}
     * @example
     * const res = await player.search({query: "Play that funky music"}, message.author);
     * console.log(res);
     */
    public async search(
        SearchQuery: SearchQuery,
        requester: User
    ): Promise<SearchResult> {
        return new Promise(async (resolve, reject) => {
            const identifier = SearchQuery.identifier || "ytsearch";
            const query = SearchQuery.query;

            const res = await this.node
                .makeRequest(
                    `api/tracks/search?query=${encodeURIComponent(
                        query
                    )}&identifier=${identifier}`,
                    "GET"
                )
                .then((res) => res.json());

            if (!res || !res.results) {
                return reject(new Error("Query not found"));
            }

            const SearchResult: SearchResult = ResolveTracks(res, requester);
            return resolve(SearchResult);
        });
    }

    /**
     * Creates a player instance and add it to players collection
     * @param {PlayerOptions} options Player Options
     * @return {Player}
     *
     */
    public create(options: PlayerOptions): Player {
        if (this.players.has(options.guild)) {
            return this.players.get(options.guild);
        }
        const player = new Player(options);
        this.emit("playerCreate", player);
        return player;
    }

    /**
     * Send Player
     * @param {Snowflake} guild Id of Guild
     * @return {Player}
     */
    public get(guild: Snowflake): Player | undefined {
        return this.players.get(guild);
    }
    /**
     * Destroy the Node connection
     */
    public destroyNode(): void {
        this.node.destroy();
    }

    /**
     * Send Voice State Payload Received from Discord API to Nexus
     * @param {Object} data
     * @example
     * client.on('raw', (d)=>{
     *    manager.updateVoiceState(d);
     * });
     */
    public updateVoiceState(data: any): void {
        if (
            !data ||
            !["VOICE_SERVER_UPDATE", "VOICE_STATE_UPDATE"].includes(
                data.t || ""
            )
        )
            return;
        if (data.t === "VOICE_SERVER_UPDATE") {
            this.node.socket.send(JSON.stringify(data));
        }
        if (data.t === "VOICE_STATE_UPDATE") {
            this.node.socket.send(JSON.stringify(data));
        }
    }
}

/**
 * @typedef {Object} ManagerOptions
 * @param {NodeOptions} [node] Node Options
 * @param {Snowflake} [clientId] Bot Application ID
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
 * @param {string} identifier='ytsearch' Identifier of type of query
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
 * @param {string} thumbnail Image of the Track
 * @param {number} duration Duration of the Track
 * @param {string} author Uploader of the Track
 * @param {Date} created_at Track upload date
 * @param {string} extractor Website track is fetched from
 * @param {User} requested_by User who requested it
 * @param {number} stream_time=0 Current seek of playing track
 */
