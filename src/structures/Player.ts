import { Snowflake, User } from "discord.js";
import { Manager } from "./Manager";
import { Node } from "./Node";
import { Queue } from "./Queue";
import { Filters } from "../Static/Constants";
import {
    PlayerOptions,
    SearchQuery,
    SearchResult,
    TrackData,
} from "../Static/Interfaces";

/**
 * The Player Class
 */
export class Player {

    /**
     * Queue for the player.
     * @type {Queue}
     */
    public queue: Queue = new Queue();

    /**
     * Boolean stating to repeat the track or not.
     * @type {boolean}
     */
    public trackRepeat = false;

    /**
     * Boolean stating to repeat the queue or not.
     * @type {boolean}
     */
    public queueRepeat = false;

    /**
     * Boolean stating is the player playing or not.
     * @type {boolean}
     */
    public playing = false;

    /**
     * Boolean stating is the player paused or not.
     * @type {boolean}
     */
    public paused = false;

    /**
     * The volume of the player.
     * @type {number}
     */
    public volume: number;

    /**
     * The node of the player.
     * @type {Node}
     */
    public node: Node;

    /**
     * Guild ID.
     * @type Snowflake
     */
    public guild: Snowflake;

    /**
     * The voice channel.
     * @type {string}
     */
    public voiceChannel: string | null = null;

    /**
     * The text channel for the player.
     * @type {string}
     */
    public textChannel: string | null = null;

    /** The Manager of the player.
     * @type {Manager}
     */
    public manager: Manager;

    /**
     * Static manager of the player.
     * @ignore
     * @private
     */
    private static _manager: Manager;

    /**
     * Boolean stating is the player connected or not.
     * @type {boolean}
     * @hidden
     * @ignore
     */
    private connected: boolean = false;

    /**
     * Initialize the static manager for the player.
     * 
     * @type {void}
     * @param {Manager} manager The static manager to set.
     * @ignore
     */
    public static initStaticManager(manager: Manager)  {
        this._manager = manager;
    }

    /**
     * Creates a new player instance.
     * 
     * @param {PlayerOptions} options The options nexessary for the player.
     * @hideconstructor
     */
    constructor(options: PlayerOptions) {
        if (!this.manager) this.manager = Player._manager;
        if (!this.manager) throw new RangeError("Manager has not been initiated.");
        if (this.manager.players.has(options.guild)) return this.manager.players.get(options.guild);

        this.guild = options.guild;
        this.node = this.manager.node;
        if (options.voiceChannel) this.voiceChannel = options.voiceChannel;
        if (options.textChannel) this.textChannel = options.textChannel;
        if (!this.node) throw new RangeError("No available nodes.");

        this.manager.players.set(options.guild, this);
        this.manager.emit("playerCreate", this);
        this.setVolume(options.volume ?? 100);
        this.connect();
    }

    /**
     * Search youtube for songs and playlists.
     * 
     * @param {SearchQuery} SearchQuery Query Object
     * @param {User} requester User Object
     * @returns {SearchResult}
     * @example
     * const results = await player.search({ query: "Play that funky music" }, message.author);
     * console.log(results);
     */
    public search(searchQuery: SearchQuery, requester: User): Promise<SearchResult> {
        return this.manager.search(searchQuery, requester);
    }

    /**
     * Create a voice channel Subscription to nexus
     */
    public async connect()  {
        if (!this.voiceChannel) throw new RangeError("No voice channel has been set.");
        await this.node.makeRequest("POST",`api/subscription/${this.guild}/${this.voiceChannel}`)
        this.manager.emit("playerCreate", this);
    }

    /**
     * Disconnects the voice channel.
     */
    public async disconnect(): Promise<this> {
        if (!this.voiceChannel) return this;
        if (this.playing) this.stop();
        await this.node.makeRequest("DELETE", `api/subscription/${this.guild}/${this.voiceChannel}`);
        this.voiceChannel = null;
        this.connected = false;
        return this;
    }
    /**
     * Play the songs added in the queue.
     */
    public async play() {
        if (!this.queue.current) throw new RangeError("Queue is empty!");
        if (!this.connected) await this.connect();
        
        return await new Promise(resolve => {
            const connectInterval = setInterval(() => {
                if (this.connected) {
                    this.sendPlayPost(this.queue.current);
                    clearInterval(connectInterval);
                    resolve(null);
                }
            }, 1000);
        });
    }

    /**
     * Send POST request to NEXUS to play the song.
     * 
     * @param {TrackData} track Track to Play the song
     * @private
     */
    private async sendPlayPost(track: TrackData) {
        await this.node.makeRequest("POST", `api/player/${this.guild}`, { track: { url: track.url } })
        this.playing = true;
    }

    /**
     * Send filter to Nexus.
     * @param {Filters} filter Music Filter to Apply
     */
    public applyFilters(filter: Filters) {
        return this.node
            .makeRequest("PATCH", `api/player/${this.guild}`, { data: { encoder_args: ["-af", filter] } })
            .then(res => {
                if (!res.ok) this.manager.emit("playerError", res);
            });
    }

    /**
     * Set the volume of the player.
     * @param {number} volume Volume of the player
     */
    public setVolume(volume: number)  {
        this.volume = volume;
        return this.node.makeRequest("PATCH", `api/player/${this.guild}`, { data: { volume: this.volume } })
    }

    /**
     * Destroy the player.
     */
    public destroy()  {
        if (this.playing) this.stop();
        this.disconnect();
        this.manager.emit("playerDestroy", this);
        this.manager.players.delete(this.guild);
    }

    /**
     * Clear the queue and stop the player.
     */
    public stop()  {
        this.queue.current = null;
        this.queue.previous = null;
        this.queue.clear();
        this.playing = false;
        this.skip();
        this.destroy();
    }

    /**
     * Skip the current playing song.
     */
    public skip()  {
        return this.node.makeRequest("DELETE", `api/player/${this.guild}`, );
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
 * @property {string} kakaoke The kakaoke filter
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
