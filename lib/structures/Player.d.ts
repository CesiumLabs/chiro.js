import { Manager } from "./Manager";
import { Node } from "./Node";
import { PlayerOptions, SearchQuery, SearchResult } from "../Static/Interfaces";
import { Snowflake, User } from "discord.js";
import { Queue } from "./Queue";
import { Filters } from "../Static/Constants";
/**
 * The Player Class
 */
export declare class Player {
    options: PlayerOptions;
    /**
     * Queue for the player
     * @type {Queue}
     */
    queue: Queue;
    /**
     * Track Repeat
     * @type {boolean}
     */
    trackRepeat: boolean;
    /**
     * Queue Repeat
     * @type {boolean}
     */
    queueRepeat: boolean;
    /**
     * Whether the player is playing.
     * @type {boolean}
     */
    playing: boolean;
    /**
     * Whether the player is paused.
     * @type {boolean}
     */
    paused: boolean;
    /**
     * Player Volume.
     * @type {number}
     */
    volume: number;
    /**
     * The Node
     * @type {Node}
     */
    node: Node;
    /**
     * Guild
     * @type Snowflake
     */
    guild: Snowflake;
    /**
     * The voice channel
     * @type {string}
     */
    voiceChannel: string | null;
    /**
     * The text channel for the player.
     * @type {string}
     */
    textChannel: string | null;
    /** The Manager.
     * @type {Manager}
     */
    manager: Manager;
    /**
     * @ignore
     * @private
     */
    private static _manager;
    /**
     * PLayer Connected
     * @type {boolean}
     * @hidden
     * @ignore
     */
    private connected;
    /**
     * Static Init
     * @type {void}
     * @param {Manager} manager Manager
     * @ignore
     */
    static init(manager: Manager): void;
    /**
     * Creates a new player instance     *
     * @param {PlayerOptions} options Player Options
     * @hideconstructor
     */
    constructor(options: PlayerOptions);
    /**
     * Adding Manager#search for shortcut
     * @param {SearchQuery} SearchQuery Search Query
     * @param {User} requester Person who requested it
     * @return {Promise<SearchResult>}
     * @example
     * const res = await player.search({
     *     query: "Play that funky Music",
     *     identifier: "ytsearch"
     * },message.author)
     * console.log(res);
     */
    search(SearchQuery: SearchQuery, requester: User): Promise<SearchResult>;
    /**
     * Create a voiceChannel Subscription to nexus
     */
    connect(): void;
    /**
     * Disconnect to voice channel
     */
    disconnect(): this;
    /**
     * Play the songs added in the queue
     */
    play(): void;
    /**
     * Send POST request to NEXUS to play the song
     * @param {TrackData} track Track to Play the song
     * @private
     */
    private sendPlayPost;
    /**
     * Send filter to Nexus
     * @param {Filters} filter Music Filter to Apply
     */
    applyFilters(filter: Filters): void;
    /**
     * Set the volume of the player
     * @param {number} volume Volume of the player
     */
    setVolume(volume: number): void;
    /**
     * Destroy the player
     */
    destroy(): void;
    /**
     * Clear the queue and stop the player
     */
    stop(): void;
    /**
     * Skip the current playing song
     */
    skip(): void;
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
