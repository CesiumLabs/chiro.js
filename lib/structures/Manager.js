"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Manager = void 0;
const events_1 = require("events");
const discord_js_1 = require("discord.js");
const Node_1 = require("./Node");
const Player_1 = require("./Player");
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
class Manager extends events_1.EventEmitter {
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
    constructor(options) {
        super();
        /**
         * The Collection of Players in this Manager
         * @type {Collection<Snowflake, Player>}
         */
        this.players = new discord_js_1.Collection();
        /**
         * If Manager Class initiated or not
         * @type {boolean}
         * @private
         */
        this.initiated = false;
        Player_1.Player.init(this);
        Node_1.Node.init(this);
        this.options = Object.assign({ node: { identifier: "default", host: "localhost" } }, options);
        if (this.options.node) {
            new Node_1.Node(this.options.node);
        }
    }
    /**
     * Init Manager
     * @param {Snowflake} clientId Bot Application ID
     * @return {Manager}
     * @example
     * manager.init(client.user.id);
     */
    init(clientId) {
        if (this.initiated)
            return this;
        if (typeof clientId !== "undefined")
            this.options.clientId = clientId;
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
    search(SearchQuery, requester) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const identifier = SearchQuery.identifier || "ytsearch";
            const query = SearchQuery.query;
            const res = yield this.node
                .makeRequest(`api/tracks/search?query=${encodeURIComponent(query)}&identifier=${identifier}`, "GET")
                .then((res) => res.json());
            if (!res) {
                return reject(new Error("Query not found"));
            }
            const SearchResult = this.resolveTrackData(res, requester);
            return resolve(SearchResult);
        }));
    }
    /**
     * Internal Method to Resolve Search Result from nexus into Interface SearchResult
     * @param {Object} res search result
     * @param {User} requester user who searched
     * @return {SearchResult}
     * @private
     * @ignore
     */
    resolveTrackData(res, requester) {
        if (!res.results.length) {
            const SearchResult = {
                type: "NO_RESULT",
                tracks: [],
                requester: requester,
            };
            return SearchResult;
        }
        if (res.identifier === "ytsearch" || "scsearch") {
            const SearchResult = {
                type: "SEARCH_RESULT",
                tracks: res.results,
                requester: requester,
            };
            return SearchResult;
        }
        else {
            const SearchResult = {
                type: "PLAYLIST",
                playlist: {
                    title: res.results[0].title,
                    id: res.results[0].id,
                    url: res.results[0].url,
                    author: res.results[0].author,
                    extractor: res.results[0].extractor,
                },
                tracks: res.results[0].tracks.map((track) => this.buildTrackData(track, requester)),
                requester: requester,
            };
            return SearchResult;
        }
    }
    /**
     * @ignore
     * @description Internal method to encapsulate Track Data received from Nexus into {TrackData}
     * @param {TrackData} data The Track details received from Nexus
     * @param {User} requester The person who requested it
     * @return {TrackData}
     * @private
     */
    buildTrackData(data, requester) {
        const track = {
            url: data.url,
            title: data.title,
            thumbnail: data.thumbnail,
            duration: data.duration,
            author: data.author,
            created_at: data.created_at,
            extractor: data.extractor,
            requested_by: requester,
        };
        return track;
    }
    /**
     * Creates a player instance and add it to players collection
     * @param {PlayerOptions} options Player Options
     * @return {Player}
     *
     */
    create(options) {
        if (this.players.has(options.guild)) {
            return this.players.get(options.guild);
        }
        return new Player_1.Player(options);
    }
    /**
     * Send Player
     * @param {Snowflake} guild Id of Guild
     * @return {Player}
     */
    get(guild) {
        return this.players.get(guild);
    }
    /**
     * Destroy the Node connection
     */
    destroyNode() {
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
    updateVoiceState(data) {
        if (!data ||
            !["VOICE_SERVER_UPDATE", "VOICE_STATE_UPDATE"].includes(data.t || ""))
            return;
        if (data.t === "VOICE_SERVER_UPDATE") {
            this.node.socket.send(JSON.stringify(data));
        }
        if (data.t === "VOICE_STATE_UPDATE") {
            this.node.socket.send(JSON.stringify(data));
        }
    }
}
exports.Manager = Manager;
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
 * @param {string} [thumbnail] Image of the Track
 * @param {number} duration Duration of the Track
 * @param {string} author Uploader of the Track
 * @param {Date} created_at Track upload date
 * @param {string} extractor Website track is fetched from
 * @param {User} requested_by User who requested it
 */
