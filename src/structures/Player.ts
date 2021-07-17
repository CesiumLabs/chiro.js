import { Manager } from "./Manager";
import { Node } from "./Node";
import { PlayerOptions, SearchQuery, SearchResult } from "../Static/Interfaces";

import { Snowflake, User } from "discord.js";
import { Queue } from "./Queue";

/**
 * The Player Class
 */
export class Player {
    /**
     * Queue for the player
     * @type {Queue}
     */
    public queue = new Queue() as Queue;
    /**
     * Track Repeat
     * @type {boolean}
     */
    public trackRepeat = false;
    /**
     * Queue Repeat
     * @type {boolean}
     */
    public queueRepeat = false;
    /**
     * Whether the player is playing.
     * @type {boolean}
     */
    public playing = false;
    /**
     * Whether the player is paused.
     * @type {boolean}
     */
    public paused = false;
    /**
     * Player Volume.
     * @type {number}
     */
    public volume: number;
    /**
     * The Node
     * @type {Node}
     */
    public node: Node;
    /**
     * Guild
     * @type Snowflake
     */
    public guild: Snowflake;
    /**
     * The voice channel
     * @type {string}
     */
    public voiceChannel: string | null = null;
    /**
     * The text channel for the player.
     * @type {string}
     */
    public textChannel: string | null = null;
    /** The Manager.
     * @type {Manager}
     */
    public manager: Manager;
    /**
     * @ignore
     * @private
     */
    private static _manager: Manager;
    /**
     * PLayer Connected
     * @type {boolean}
     * @hidden
     * @ignore
     */
    private connected: boolean = false;

    /**
     * Static Init
     * @type {void}
     * @param {Manager} manager Manager
     * @ignore
     */
    public static init(manager: Manager): void {
        this._manager = manager;
    }

    /**
     * Creates a new player instace     *
     * @param {PlayerOptions} options Player Options
     * @hideconstructor
     */
    constructor(public options: PlayerOptions) {
        if (!this.manager) this.manager = Player._manager;
        if (!this.manager)
            throw new RangeError("Manager has not been initiated.");

        if (this.manager.players.has(options.guild)) {
            return this.manager.players.get(options.guild);
        }
        this.guild = options.guild;
        if (options.voiceChannel) this.voiceChannel = options.voiceChannel;
        if (options.textChannel) this.textChannel = options.textChannel;
        this.node = this.manager.node;
        if (!this.node) throw new RangeError("No available nodes.");
        this.manager.players.set(options.guild, this);
        this.manager.emit("playerCreate", this);
        this.setVolume(options.volume ?? 100);
        this.connect();
    }

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
    public search(
        SearchQuery: SearchQuery,
        requester: User
    ): Promise<SearchResult> {
        return this.manager.search(SearchQuery, requester);
    }

    /**
     * Create a voiceChannel Subscription to nexus
     */
    public connect(): void {
        if (!this.voiceChannel)
            throw new RangeError("No voice channel has been set.");

        this.node
            .makeRequest(
                `api/subscription/${this.guild}/${this.voiceChannel}`,
                "POST"
            )
            .then((res) => res);
        this.connected = true;
        this.manager.emit("playerCreate", this);
    }

    /**
     * Disconnect to voice channel
     */
    public disconnect(): this {
        if (!this.voiceChannel) return this;
        if (this.playing) {
            this.stop();
        }
        this.node
            .makeRequest(
                `api/subscription/${this.guild}/${this.voiceChannel}`,
                "DELETE"
            )
            .then((res) => res);
        this.voiceChannel = null;
        this.connected = false;

        return this;
    }
    /**
     * Play the songs added in the queue
     */
    public play() {
        if (!this.connected) {
            this.connect();
        }

        if (!this.queue.current) throw new RangeError("Queue is empty");
        const track = this.queue.current;

        this.node
            .makeRequest(`api/player/${this.guild}`, "POST", {
                tracks: [{ url: track.url, initial: true }],
            })
            .then((res) => res);
        this.playing = true;
    }
    /**
     * Set the volume of the player
     * @param {number} volume Volume of the player
     */
    public setVolume(volume: number): void {
        this.volume = volume;
        this.node
            .makeRequest(`api/player/${this.guild}`, "PATCH", {
                data: { volume: this.volume },
            })
            .then((res) => res);
    }
    /**
     * Destroy the player
     */
    public destroy(): void {
        if (this.playing) {
            this.stop();
        }
        this.disconnect();
        this.manager.emit("playerDestroy", this);
        this.manager.players.delete(this.guild);
    }
    /**
     * Clear the queue and stop the player
     */
    public stop(): void {
        this.queue.current = null;
        this.queue.previous = null;
        this.queue.clear();
        this.playing = false;
        this.skip();
        this.destroy();
    }
    /**
     * Skip the current playing song
     */
    public skip(): void {
        this.node
            .makeRequest(`api/player/${this.guild}`, "DELETE")
            .then((res) => res);
    }
}

/**
 * @typedef {Object} PlayerOptions
 * @param {Snowflake} guild ID of the guild
 * @param {Snowflake} textChannel Id of text channel
 * @param {Snowflake} voiceChannel ID of voice channel
 * @param {number} [volume] Initial volume
 */
