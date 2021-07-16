import { Manager } from "./Manager";
import { Node } from "./Node";
import { PlayerOptions, SearchQuery, SearchResult } from "../Static/Interfaces";

import { User } from "discord.js";
import { Queue } from "./Queue";

export class Player {
    /** The Queue for the Player. */
    public queue = new Queue() as Queue;
    /** Whether the queue repeats the track. */
    public trackRepeat = false;
    /** Whether the queue repeats the queue. */
    public queueRepeat = false;
    /** Whether the player is playing. */
    public playing = false;
    /** Whether the player is paused. */
    public paused = false;
    /** Whether the player is playing. */
    public volume: number;
    /** The Node for the Player. */
    public node: Node;
    /** The guild the player. */
    public guild: string;
    /** The voice channel for the player. */
    public voiceChannel: string | null = null;
    /** The text channel for the player. */
    public textChannel: string | null = null;
    /** The Manager. */
    public manager: Manager;
    /** @hidden */
    private static _manager: Manager;
    /** @hidden */
    private connected: boolean = false;

    /** @hidden */
    public static init(manager: Manager): void {
        this._manager = manager;
    }

    /**
     * Creates a new player
     * @Constructor
     * @param options
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
     * @param SearchQuery
     * @param requester
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

    /** Disconnect to voice channel */
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
    /** Play the songs added in the queue */
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
    /** Set the volume of the player */
    public setVolume(volume: number): void {
        this.volume = volume;
        this.node
            .makeRequest(`api/player/${this.guild}`, "PATCH", {
                data: { volume: this.volume },
            })
            .then((res) => res);
    }
    /** Destroy the player */
    public destroy(): void {
        if (this.playing) {
            this.stop();
        }
        this.disconnect();
        this.manager.emit("playerDestroy", this);
        this.manager.players.delete(this.guild);
    }
    /** Clear the queue and stop the player */
    public stop(): void {
        this.queue.current = null;
        this.queue.previous = null;
        this.queue.clear();
        this.playing = false;
        this.skip();
        this.destroy();
    }
    /** Skip the current playing song */
    public skip(): void {
        this.node
            .makeRequest(`api/player/${this.guild}`, "DELETE")
            .then((res) => res);
    }
}
