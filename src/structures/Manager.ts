import Collection from "@discordjs/collection";
import { EventEmitter } from "events";
import Util from "./Utils";
import { Node } from "./Node";
import { Player } from "./Player";
import { ChiroError, ChiroEventError } from "./Error";
import { ManagerOptions, PlayerOptions, SearchQuery, SearchResult, TrackData, Payload, Snowflake, NodeDisconnectContent } from "../static/Interfaces";

export interface Manager {
    /**
     * Emitted when the node connection is established.
     * @event Manager#nodeConnect
     * @param {Node} node Nexus Node
     */
    on(event: "nodeConnect", listener: (node: Node) => void): this;

    /**
     * Emitted when the node gets reconnected.
     * @event Manager#nodeReconnect
     * @param {Node} node Nexus Node
     */
    on(event: "nodeReconnect", listener: (node: Node) => void): this;

    /**
     * Emitted when the node connection is disconnected.
     * @event Manager#nodeDisconnect
     * @param {Node} node Nexus Node
     * @param {NodeDisconnectContent} content Object containing the reason for disconnecting the node.
     */
    on(event: "nodeDisconnect", listener: (node: Node, content: NodeDisconnectContent) => void): this;

    /**
     * Emitted when the node connection receives an unknown opcode.
     * @event Manager#nodeUnknownEvent
     * @param {Payload} payload The payload recieved from the ws api.
     */
    on(event: "nodeUnknownEvent", listener: (payload: Payload) => void): this;

    /**
     * Emitted when the node connection receives a payload.
     * @event Manager#nodeRawEvent
     * @param {Node} node The node who received this payload.
     * @param {Payload} payload The payload recieved from the ws api.
     */
    on(event: "nodeRawEvent", listener: (node: Node, data: Payload) => void): this;

    /**
     * Emitted when Nexus is ready to play.
     * @event Manager#ready
     */
    on(event: "ready", listener: () => void): this;

    /**
     * Emitted when track is started to play.
     * @event Manager#trackStart
     * @param {Player} player Player
     * @param {TrackData} Track Current Track
     */
    on(event: "trackStart", listener: (player: Player, track: TrackData) => void): this;

    /**
     * Emitted when the track ends.
     * @event Manager#trackEnd
     * @param {Player} player Player
     * @param {TrackData} Track Ended Track
     */
    on(event: "trackEnd", listener: (player: Player, track: TrackData) => void): this;

    /**
     * Emitted when the Queue ends.
     * @event Manager#queueEnd
     * @param {Player} player Player
     */
    on(event: "queueEnd", listener: (player: Player) => void): this;

    /**
     * Emitted when the Voice Connection is ready.
     * @event Manager#voiceReady
     * @param {Player} player Player
     */
    on(event: "voiceReady", listener: (player: Player) => void): this;

    /**
     * Emitted when the Voice Connection is disconnected.
     * @event Manager#voiceDisconnect
     * @param {Player} player Player
     */
    on(event: "voiceDisconnect", listener: (player: Player) => void): this;

    /**
     * Emitted when a player is destroyed.
     * @event Manager#playerDestroy
     * @param {Player} player Old Player
     */
    on(event: "playerDestroy", listener: (player: Player) => void): this;

    /**
     * Emitted when there is an debuggable error caught.
     * @event Manager#error
     * @param {ChiroError} error The error containing details.
     */
    on(event: "error", listener: (error: ChiroEventError) => void): this;
}

/**
 * The Manager Class which manages all the players.
 * @extends {EventEmitter}
 * @example
 * const manager = new Manager({
 *     nodes: [{ host: "localhost", port: 3000, password: "SwagLordNitroUser12345" }],
 *     onData(id, payload) {
 *          client.guilds.cache.get(id).shards.send(payload);
 *     }
 * });
 */
export class Manager extends EventEmitter {
    /**
     * The Collection of Players in this Manager.
     * @type {Collection<Snowflake, Player>}
     * @name Manager#players
     */
    public readonly players = new Collection<Snowflake, Player>();

    /**
     * The total number of subscriptions made by all the nodes.
     * @type {number}
     * @name Manager#totalSubscriptions
     */
    public totalSubscriptions = 0;

    /**
     * The client id of the bot which is been managed.
     * @type {Snowflake}
     * @name Manager#clientID
     */
    public clientID: Snowflake;

    /**
     * The Nodes of the manager.
     * @type {Collection<number, Node>}
     * @name Manager#nodes
     */
    public nodes = new Collection<number, Node>();

    /**
     * The options received from the constructor for the Manager.
     * @type {ManagerOptions}
     * @name Manager#options
     */
    public readonly options: ManagerOptions;

    /**
     * Boolean stating is the Manager Class initiated or not.
     * @type {boolean}
     * @name Manager#initiated
     * @private
     */
    private initiated = false;

    /**
     * Creates new Manager Instance
     * @param {ManagerOptions} options The options which are necessary for the Manager.
     * @example
     * const manager = new Manager({
     *     nodes: [{ host: "localhost", port: 3000, password: "SwagLordNitroUser12345" }],
     *     onData(id, payload) {
     *          client.guilds.cache.get(id).shards.send(payload);
     *     }
     * })
     */
    constructor(options: ManagerOptions) {
        super();

        this.options = {
            nodes: [
                {
                    identifier: "default",
                    host: "localhost",
                    port: 4957,
                    pingInterval: 10000,
                    password: "SwagLordNitroUser12345",
                    secure: false
                }
            ],
            ...options
        };

        if (!this.options.nodes.length) throw new ChiroError("Atleast one node is needed for manager!");
        this.options.nodes.forEach((m, i) => this.nodes.set(i, new Node(m, this, i)));
    }

    /**
     * Initiate the manager.
     *
     * @param {Snowflake} clientID Bot Application ID
     * @returns {Manager}
     * @example
     * manager.init(client.user.id);
     */
    public init(clientID: Snowflake): this {
        if (!clientID) throw new ChiroError("No client id has been provided.");
        if (!this.initiated) {
            this.clientID = clientID;
            for (const node of this.nodes.values()) node.connect();
            this.initiated = true;
        }

        return this;
    }

    /**
     * Search youtube for songs and playlists.
     * @param {SearchQuery} searchQuery The query object.
     * @param {Snowflake} requestor The id of the user who requested it.
     * @returns {SearchResult}
     * @example
     * const results = await manager.search({ query: "Play that funky music" }, message.author);
     * console.log(results);
     */
    public async search(searchQuery: SearchQuery, requestor: Snowflake): Promise<SearchResult> {
        const response = await this.node.makeRequest("GET", `api/tracks/search?query=${encodeURIComponent(searchQuery.query)}&identifier=${searchQuery.identifier || "ytsearch"}`).then((res) => res.json());

        if (!response.results) throw new ChiroError("Responded results from the server seems to be empty.");
        return Util.resolveTracks(response, requestor);
    }

    /**
     * Creates a new player instance and add it to players collection.
     * @param {PlayerOptions} options Player Options to create one, if there is no existing one.
     * @returns {Promise<Player>}
     */
    public async createPlayer(options: PlayerOptions): Promise<Player> {
        if (this.players.has(options.guild)) return this.players.get(options.guild);

        const player = new Player(options, this);
        this.players.set(options.guild, player);

        return player;
    }

    /**
     * Get a player by its guild id.
     * @param {Snowflake} guild ID of Guild.
     * @returns {Player?}
     */
    public get(guild: Snowflake): Player | undefined {
        return this.players.get(guild);
    }

    /**
     * Destroy all the connection of nodes.
     */
    public destroyNodes() {
        for (const node of this.nodes.values()) node.destroy();
    }

    /**
     * Send Voice State Payload Received from Discord API to Nexus.
     * @param {Object} data The data from the event.
     * @example
     * client.on('raw', manager.updateVoiceState.bind(manager));
     */
    public updateVoiceState(data: any) {
        if (["VOICE_SERVER_UPDATE", "VOICE_STATE_UPDATE"].includes(data?.t)) this.node.socket.send(JSON.stringify(data));
    }

    /**
     * Returns a node with less resources consumed
     * @type {Node}
     */
    public get node(): Node {
        let lowest: Node = this.nodes.first();
        this.nodes.forEach((n) => (n.subscriptions < lowest.subscriptions ? (lowest = n) : null));
        return lowest;
    }
}

/**
 * @typedef {Object} ManagerOptions
 * @param {Array<NodeOptions>} [nodes] Node Options
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
 * @param {Snowflake} requestor User who requested it
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
 * @param {Snowflake} requestedBy User who requested it
 * @param {number} streamTime=0 Current seek of playing track
 */
