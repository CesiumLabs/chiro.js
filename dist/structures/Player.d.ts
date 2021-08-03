import { Manager } from "./Manager";
import { Node } from "./Node";
import { Queue } from "./Queue";
import { Filters } from "../Static/Constants";
import { PlayerOptions, SearchQuery, SearchResult, Snowflake } from "../Static/Interfaces";
/**
 * The Player Class
 */
export declare class Player {
    /**
     * Queue for the player.
     * @type {Queue}
     */
    queue: Queue;
    /**
     * Boolean stating to repeat the track or not.
     * @type {boolean}
     */
    trackRepeat: boolean;
    /**
     * Boolean stating to repeat the queue or not.
     * @type {boolean}
     */
    queueRepeat: boolean;
    /**
     * Boolean stating is the player playing or not.
     * @type {boolean}
     */
    playing: boolean;
    /**
     * The volume of the player.
     * @type {number}
     */
    volume: number;
    /**
     * The node of the player.
     * @type {Node}
     */
    node: Node;
    /**
     * Guild ID.
     * @type Snowflake
     */
    guild: Snowflake;
    /**
     * The voice channel.
     * @type {string}
     */
    voiceChannel: string | null;
    /**
     * The text channel for the player.
     * @type {string}
     */
    textChannel: string | null;
    /** The Manager of the player.
     * @type {Manager}
     */
    manager: Manager;
    /**
     * Static manager of the player.
     * @ignore
     * @private
     */
    private static _manager;
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
    state: "connected" | "disconnected" | "connecting";
    /**
     * Creates a new player instance.
     *
     * @param {PlayerOptions} options The options nexessary for the player.
     * @hideconstructor
     */
    constructor(options: PlayerOptions);
    /**
     * Boolean stating is the player connected or not.
     * @readonly
     */
    get connected(): boolean;
    /**
     * Boolean stating is the player paused or not.
     * @readonly
     */
    get paused(): boolean;
    /**
     * Initialize the static manager for the player.
     *
     * @returns {void}
     * @param {Manager} manager The static manager to set.
     * @ignore
     */
    static initStaticManager(manager: Manager): void;
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
    search(searchQuery: SearchQuery, requestor: Snowflake): Promise<SearchResult>;
    /**
     * Create a voice channel Subscription to nexus.
     * @returns {Promise<void>}
     */
    connect(): Promise<void>;
    /**
     * Disconnects the voice channel.
     * @returns {Promise<void>}
     */
    disconnect(): Promise<this>;
    /**
     * Play the songs added in the queue.
     * @returns {Promise<void>}
     */
    play(): Promise<unknown>;
    /**
     * Send POST request to NEXUS to play the song.
     *
     * @param {TrackData} track Track to Play the song
     * @private
     */
    private sendPlayPost;
    /**
     * Apply filters through the Nexus API.
     * @param {Filters} filter Music Filter to Apply
     */
    applyFilters(filter: Filters): Promise<void>;
    /**
     * Set the volume of the player.
     * @param {number} volume Volume to set.
     * @returns {Promise<void>}
     */
    setVolume(volume: number): Promise<void>;
    /**
     * Destroy the player.
     * @returns {Promise<void>}
     */
    destroy(): Promise<void>;
    /**
     * Clear the queue and stop the player.
     * @returns {Promise<void>}
     */
    stop(): Promise<void>;
    /**
     * Skip the current playing song.
     * @returns {Promise<void>}
     */
    skip(): Promise<void>;
    /**
     * Pause the player.
     * @returns {Promise<void>}
     */
    pause(): Promise<void>;
    /**
     * Resume the player.
     * @returns {Promise<void>}
     */
    resume(): Promise<void>;
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
