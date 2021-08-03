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
exports.Player = void 0;
const Queue_1 = require("./Queue");
const Error_1 = require("./Error");
/**
 * The Player Class
 */
class Player {
    /**
     * Creates a new player instance.
     *
     * @param {PlayerOptions} options The options nexessary for the player.
     * @hideconstructor
     */
    constructor(options) {
        var _a;
        /**
         * Queue for the player.
         * @type {Queue}
         */
        this.queue = new Queue_1.Queue();
        /**
         * Boolean stating to repeat the track or not.
         * @type {boolean}
         */
        this.trackRepeat = false;
        /**
         * Boolean stating to repeat the queue or not.
         * @type {boolean}
         */
        this.queueRepeat = false;
        /**
         * Boolean stating is the player playing or not.
         * @type {boolean}
         */
        this.playing = false;
        /**
         * The voice channel.
         * @type {string}
         */
        this.voiceChannel = null;
        /**
         * The text channel for the player.
         * @type {string}
         */
        this.textChannel = null;
        /**
         * The current state of the player.
         * idle - Not connected yet.
         * connected - Connected to the player.
         * disconnected - Was connected to the player.
         * connecting - Connecting to the player.
         *
         * @type {"connected" | "disconnected" | "connecting"}
         * @hidden
         * @ignore
         */
        this.state = "connecting";
        if (!Player._manager)
            throw new Error_1.ChiroError("Static manager has not been initiated yet for Player.");
        this.manager = Player._manager;
        if (!this.manager.node)
            throw new Error_1.ChiroError("Static manager for the player has no node yet.");
        if (this.manager.players.has(options.guild))
            return this.manager.players.get(options.guild);
        this.guild = options.guild;
        this.node = this.manager.node;
        if (options.voiceChannel)
            this.voiceChannel = options.voiceChannel;
        if (options.textChannel)
            this.textChannel = options.textChannel;
        this.manager.players.set(options.guild, this);
        this.setVolume((_a = options.volume) !== null && _a !== void 0 ? _a : 100);
        this.connect();
    }
    /**
     * Boolean stating is the player connected or not.
     * @readonly
     */
    get connected() {
        return this.state == "connected";
    }
    /**
     * Boolean stating is the player paused or not.
     * @readonly
     */
    get paused() {
        return this.connected && !this.playing;
    }
    /**
     * Initialize the static manager for the player.
     *
     * @returns {void}
     * @param {Manager} manager The static manager to set.
     * @ignore
     */
    static initStaticManager(manager) {
        this._manager = manager;
    }
    /**
     * Search youtube for songs and playlists.
     *
     * @param {SearchQuery} searchQuery The search query options object.
     * @param {Snowflake} requestor The id of the user who requested it.
     * @returns {SearchResult}
     * @example
     * const results = await player.search({ query: "Play that funky music" }, message.author);
     * console.log(results);
     */
    search(searchQuery, requestor) {
        return this.manager.search(searchQuery, requestor);
    }
    /**
     * Create a voice channel Subscription to nexus.
     * @returns {Promise<void>}
     */
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.voiceChannel)
                throw new Error_1.ChiroError("No voice channel has been set for the player to connect.");
            yield this.node.makeRequest("POST", `api/subscription/${this.guild}/${this.voiceChannel}`);
            this.state = "connecting";
        });
    }
    /**
     * Disconnects the voice channel.
     * @returns {Promise<void>}
     */
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.voiceChannel)
                return this;
            if (this.playing)
                this.stop();
            yield this.node.makeRequest("DELETE", `api/subscription/${this.guild}/${this.voiceChannel}`);
            this.voiceChannel = null;
            this.state = "disconnected";
        });
    }
    /**
     * Play the songs added in the queue.
     * @returns {Promise<void>}
     */
    play() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.queue.current)
                throw new Error_1.ChiroError("Queue is empty to play!");
            if (this.state == "disconnected")
                yield this.connect();
            return yield new Promise((resolve, reject) => {
                const connectInterval = setInterval(() => {
                    if (this.connected) {
                        this.sendPlayPost(this.queue.current);
                        return resolve(null);
                    }
                    clearInterval(connectInterval);
                    reject(new Error(`Timed out to play the player because the player's state is still ${this.state}.`));
                }, 1000);
            });
        });
    }
    /**
     * Send POST request to NEXUS to play the song.
     *
     * @param {TrackData} track Track to Play the song
     * @private
     */
    sendPlayPost(track) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.node.makeRequest("POST", `api/player/${this.guild}`, { track: { url: track.url } });
            this.playing = true;
        });
    }
    /**
     * Apply filters through the Nexus API.
     * @param {Filters} filter Music Filter to Apply
     */
    applyFilters(filter) {
        return this.node
            .makeRequest("PATCH", `api/player/${this.guild}`, { data: { encoder_args: ["-af", filter] } })
            .then(res => {
            if (!res.ok)
                this.manager.emit("playerError", res);
        });
    }
    /**
     * Set the volume of the player.
     * @param {number} volume Volume to set.
     * @returns {Promise<void>}
     */
    setVolume(volume) {
        return __awaiter(this, void 0, void 0, function* () {
            this.volume = volume;
            yield this.node.makeRequest("PATCH", `api/player/${this.guild}`, { data: { volume: this.volume } });
        });
    }
    /**
     * Destroy the player.
     * @returns {Promise<void>}
     */
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.playing)
                yield this.stop();
            yield this.disconnect();
            this.manager.emit("playerDestroy", this);
            this.manager.players.delete(this.guild);
        });
    }
    /**
     * Clear the queue and stop the player.
     * @returns {Promise<void>}
     */
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.queue.current = null;
            this.queue.previous = null;
            this.queue.clear();
            this.playing = false;
            yield this.skip();
            yield this.destroy();
        });
    }
    /**
     * Skip the current playing song.
     * @returns {Promise<void>}
     */
    skip() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.node.makeRequest("DELETE", `api/player/${this.guild}`);
        });
    }
    /**
     * Pause the player.
     * @returns {Promise<void>}
     */
    pause() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.paused)
                return;
            this.playing = false;
            yield this.node.makeRequest("PATCH", `api/player/${this.guild}`, { data: { paused: true } });
        });
    }
    /**
     * Resume the player.
     * @returns {Promise<void>}
     */
    resume() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.playing)
                return;
            this.playing = true;
            yield this.node.makeRequest("PATCH", `api/player/${this.guild}`, { data: { paused: false } });
        });
    }
}
exports.Player = Player;
/**
 * @typedef {Object} PlayerOptions
 * @param {Snowflake} guild ID of the guild
 * @param {Snowflake} textChannel ID of text channel
 * @param {Snowflake} voiceChannel ID of voice channel
 * @param {number} [volume] Initial volume
 */
/**
 * The available audio filters
 * @typedef {string} Filters
 * @property {string} bassboost The bassboost filter
 * @property {string} 8D The 8D filter
 * @property {string} vaporwave The vaporwave filter
 * @property {string} nightcore The nightcore filter
 * @property {string} phaser The phaser filter
 * @property {string} tremolo The tremolo filter
 * @property {string} vibrato The vibrato filter
 * @property {string} reverse The reverse filter
 * @property {string} treble The treble filter
 * @property {string} normalizer The normalizer filter
 * @property {string} surrounding The surrounding filter
 * @property {string} pulsator The pulsator filter
 * @property {string} subboost The subboost filter
 * @property {string} karaoke The karaoke filter
 * @property {string} flanger The flanger filter
 * @property {string} gate The gate filter
 * @property {string} haas The haas filter
 * @property {string} mcompand The mcompand filter
 * @property {string} mono The mono filter
 * @property {string} mstlr The mstlr filter
 * @property {string} mstrr The mstrr filter
 * @property {string} chorus The chorus filter
 * @property {string} chorus2d The chorus2d filter
 * @property {string} chorus3d The chorus3d filter
 * @property {string} fadein The fadein filter
 * @property {string} compressor The compressor filter
 * @property {string} expander The expander filter
 * @property {string} softlimiter The softlimiter filter
 */
