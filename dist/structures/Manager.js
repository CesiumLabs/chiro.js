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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Manager = void 0;
const collection_1 = __importDefault(require("@discordjs/collection"));
const events_1 = require("events");
const Node_1 = require("./Node");
const Player_1 = require("./Player");
const Error_1 = require("./Error");
const Utils_1 = require("./Utils");
/**
 * The Manager Class which manages all the players.
 *
 * @extends {EventEmitter}
 * @example
 * const manager = new Manager({
 *     node: { host: "localhost", port: 3000, password: "MySecurePassword" },
 *     send(id, payload) {
 *          client.guilds.cache.get(id).shards.send(payload);
 *     }
 * })
 */
class Manager extends events_1.EventEmitter {
    /**
     * Creates new Manager Instance
     * @param {ManagerOptions} options The options which are necessary for the Manager.
     * @example
     * const manager = new Manager({
     *     node: { host: "localhost", port: 3000, password: "MySecurePassword" },
     *     send(id, payload){
     *          client.guilds.cache.get(id).shards.send(payload);
     *     }
     * })
     */
    constructor(options) {
        super();
        /**
         * The Collection of Players in this Manager.
         * @type {Collection<Snowflake, Player>}
         */
        this.players = new collection_1.default();
        /**
         * Boolean stating is the Manager Class initiated or not.
         * @type {boolean}
         * @private
         */
        this.initiated = false;
        Player_1.Player.initStaticManager(this);
        Node_1.Node.initStaticManager(this);
        this.options = Object.assign({ node: { identifier: "default", host: "localhost" } }, options);
        if (this.options.node)
            new Node_1.Node(this.options.node);
    }
    /**
     * Initiate the manager.
     *
     * @param {Snowflake} clientID Bot Application ID
     * @returns {Manager}
     * @example
     * manager.init(client.user.id);
     */
    init(clientID) {
        if (!this.initiated) {
            if (clientID)
                this.options.clientID = clientID;
            this.node.connect();
            this.initiated = true;
        }
        return this;
    }
    /**
     * Search youtube for songs and playlists.
     *
     * @param {SearchQuery} searchQuery The query object.
     * @param {Snowflake} requestor The id of the user who requested it.
     * @returns {SearchResult}
     * @example
     * const results = await manager.search({ query: "Play that funky music" }, message.author);
     * console.log(results);
     */
    search(searchQuery, requestor) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.node
                .makeRequest("GET", `api/tracks/search?query=${encodeURIComponent(searchQuery.query)}&identifier=${searchQuery.identifier || 'ytsearch'}`)
                .then(res => res.json());
            if (!response || !response.results)
                throw new Error_1.ChiroError("Responded results from the server seems to be empty.");
            return Utils_1.resolveTracks(response, requestor);
        });
    }
    /**
     * Creates a player instance and add it to players collection.
     *
     * @param {PlayerOptions} options Player Options to create one, if there is no existing one.
     * @returns {Player}
     */
    create(options) {
        return this.players.get(options.guild) || new Player_1.Player(options);
    }
    /**
     * Get a player by its guild id.
     *
     * @param {Snowflake} guild ID of Guild.
     * @returns {Player}
     */
    get(guild) {
        return this.players.get(guild);
    }
    /**
     * Destroy the Node connection.
     */
    destroyNode() {
        this.node.destroy();
    }
    /**
     * Send Voice State Payload Received from Discord API to Nexus.
     *
     * @param {Object} data The data from the event.
     * @example
     * client.on('raw', manager.updateVoiceState);
     */
    updateVoiceState(data) {
        if (data && data.t === "VOICE_SERVER_UPDATE" || data.t === "VOICE_STATE_UPDATE")
            this.node.socket.send(JSON.stringify(data));
    }
}
exports.Manager = Manager;
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
