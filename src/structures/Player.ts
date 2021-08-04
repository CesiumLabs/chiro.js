import { Manager } from "./Manager";
import { Node } from "./Node";
import { Queue } from "./Queue";
import { ChiroError } from "./Error";
import { Filters } from "../static/Constants";
import { PlayerOptions, SearchQuery, SearchResult, TrackData, Snowflake } from "../static/Interfaces";

/**
 * The Player Class
 */
export class Player {
    /**
     * Queue for the player.
     * @type {Queue}
     * @name Player#queue
     */
    public queue: Queue = new Queue();

    /**
     * Boolean stating to repeat the track or not.
     * @type {boolean}
     * @name Player#trackRepeat
     */
    public trackRepeat = false;

    /**
     * Boolean stating to repeat the queue or not.
     * @type {boolean}
     * @name Player#queueRepeat
     */
    public queueRepeat = false;

    /**
     * Boolean stating is the player playing or not.
     * @type {boolean}
     * @name Player#playing
     */
    public playing = false;

    /**
     * The volume of the player.
     * @type {number}
     * @name Player#volume
     */
    public volume: number;

    /**
     * The node of the player.
     * @type {Node}
     * @name Player#node
     */
    public node: Node;

    /**
     * Guild ID.
     * @type Snowflake
     * @name Player#guild
     */
    public guild: Snowflake;

    /**
     * The voice channel.
     * @type {string|null}
     * @name Player#voiceChannel
     */
    public voiceChannel: string | null = null;

    /**
     * The text channel for the player.
     * @type {string|null}
     * @name Player#textChannel
     */
    public textChannel: string | null = null;

    /**
     * The current state of the player.
     * idle - Not connected yet.
     * connected - Connected to the player.
     * disconnected - Was connected to the player.
     * connecting - Connecting to the player.
     * @name Player#state
     * @type {string}
     */
    public state: "connected" | "disconnected" | "connecting" = "connecting";

    /**
     * Creates a new player instance.
     * @param {PlayerOptions} options The options nexessary for the player.
     * @param {Manager} manager The manager for the player.
     */
    constructor(options: PlayerOptions, public manager: Manager) {
        if (!manager) throw new ChiroError("Invalid manager has been provided for Player.");
        if (manager.players.has(options.guild)) return manager.players.get(options.guild);

        this.guild = options.guild;
        this.node = this.manager.node;
        if (options.voiceChannel) this.voiceChannel = options.voiceChannel;
        if (options.textChannel) this.textChannel = options.textChannel;
    }

    /**
     * Boolean stating is the player connected or not.
     * @readonly
     * @type {boolean}
     */
    public get connected(): boolean {
        return this.state == "connected";
    }

    /**
     * Boolean stating is the player paused or not.
     * @readonly
     * @type {boolean}
     */
    public get paused(): boolean {
        return this.connected && !this.playing;
    }

    /**
     * Search youtube for songs and playlists.
     * @param {SearchQuery} searchQuery The search query options object.
     * @param {Snowflake} requestor The id of the user who requested it.
     * @returns {SearchResult}
     * @example
     * const results = await player.search({ query: "Play that funky music" }, message.author);
     * console.log(results);
     */
    public search(searchQuery: SearchQuery, requestor: Snowflake): Promise<SearchResult> {
        return this.manager.search(searchQuery, requestor);
    }

    /**
     * Create a voice channel Subscription to nexus.
     * @param {number} volume The volume the player should connect with.
     * @returns {Promise<Player>}
     */
    public async connect(volume?: number) {
        if (!this.voiceChannel) throw new ChiroError("No voice channel has been set for the player to connect.");
        await this.node.makeRequest("POST", `api/subscription/${this.guild}/${this.voiceChannel}`);
        await this.setVolume(volume || 100);
        this.state = "connected";
        return this;
    }

    /**
     * Disconnects the voice channel.
     * @returns {Promise<void>}
     */
    public async disconnect(): Promise<this> {
        if (!this.voiceChannel) return this;
        if (this.playing) this.stop();
        await this.node.makeRequest("DELETE", `api/subscription/${this.guild}/${this.voiceChannel}`);
        this.voiceChannel = null;
        this.state = "disconnected";
    }

    /**
     * Play the songs added in the queue.
     * @returns {Promise<void>}
     */
    public async play() {
        if (!this.queue.current) throw new ChiroError("Queue is empty to play!");
        if (!this.connected) throw new ChiroError("The player is still not yet connected.");
        return this.sendPlayPost(this.queue.current);
    }

    /**
     * Send POST request to NEXUS to play the song.
     *
     * @param {TrackData} track Track to Play the song
     * @private
     */
    private async sendPlayPost(track: TrackData) {
        await this.node.makeRequest("POST", `api/player/${this.guild}`, { track: { url: track.url } });
        this.playing = true;
    }

    /**
     * Apply filters through the Nexus API.
     * @param {Filters} filter Music Filter to Apply
     */
    public applyFilters(filter: Filters) {
        return this.node.makeRequest("PATCH", `api/player/${this.guild}`, { data: { encoder_args: ["-af", filter] } }).then((res) => {
            if (!res.ok) this.manager.emit("playerError", res);
        });
    }

    /**
     * Set the volume of the player.
     * @param {number} volume Volume to set.
     * @returns {Promise<void>}
     */
    public async setVolume(volume: number) {
        this.volume = volume;
        await this.node.makeRequest("PATCH", `api/player/${this.guild}`, { data: { volume: this.volume } });
    }

    /**
     * Destroy the player.
     * @returns {Promise<void>}
     */
    public async destroy() {
        if (this.playing) await this.stop();
        await this.disconnect();
        this.manager.emit("playerDestroy", this);
        this.manager.players.delete(this.guild);
    }

    /**
     * Clear the queue and stop the player.
     * @returns {Promise<void>}
     */
    public async stop() {
        this.queue.current = null;
        this.queue.previous = null;
        this.queue.clear();
        this.playing = false;
        await this.skip();
        await this.destroy();
    }

    /**
     * Skip the current playing song.
     * @returns {Promise<void>}
     */
    public async skip() {
        await this.node.makeRequest("DELETE", `api/player/${this.guild}`);
    }

    /**
     * Pause the player.
     * @returns {Promise<void>}
     */
    public async pause() {
        if (this.paused) return;
        this.playing = false;
        await this.node.makeRequest("PATCH", `api/player/${this.guild}`, { data: { paused: true } });
    }

    /**
     * Resume the player.
     * @returns {Promise<void>}
     */
    public async resume() {
        if (this.playing) return;
        this.playing = true;
        await this.node.makeRequest("PATCH", `api/player/${this.guild}`, { data: { paused: false } });
    }
}

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
