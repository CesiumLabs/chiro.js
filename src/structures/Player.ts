import { Manager } from "./Manager";
import { Node } from "./Node";
import { PlayerOptions, SearchQuery, SearchResult } from "../Static/Interfaces";
import { Structure } from "./Utils";
import { User } from "discord.js";
import { Queue } from "./Queue";

export class Player {
    /** The Queue for the Player. */
    public queue = new (Structure.get("Queue"))() as Queue;
    /** Whether the queue repeats the track. */
    public trackRepeat = false;
    /** Whether the queue repeats the queue. */
    public queueRepeat = false;
    /** The time the player is in the track. */
    public position = 0;
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
    private static _manager: Manager;
    private connected: boolean = false;

    /** @hidden */
    public static init(manager: Manager): void {
        this._manager = manager;
    }

    /**
     * Creates a new player
     * @param options
     */
    constructor(public options: PlayerOptions) {
        if (!this.manager) this.manager = Structure.get("Player")._manager;
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

    /** Connect to voice channel */
    public async connect() {
        if (!this.voiceChannel)
            throw new RangeError("No voice channel has been set.");

        const res = await this.node
            .makeRequest(
                `api/subscription/${this.guild}/${this.voiceChannel}`,
                "POST"
            )
            .then((res) => res.json());
        console.log(res);
        this.connected = true;
        return this;
    }

    /** Disconnect to voice channel */
    public disconnect(): this {
        if (!this.voiceChannel) return this;

        this.node.makeRequest(
            `api/subscription/${this.guild}/${this.voiceChannel}`,
            "DELETE"
        );
        this.voiceChannel = null;
        this.connected = false;
        return this;
    }

    public async play() {
        if (!this.connected) {
            await this.connect();
        }
        if (!this.queue.current) throw new RangeError("Queue is empty");
        const track = this.queue.current;

        const res = await this.node
            .makeRequest(`api/player/${this.guild}`, "POST", {
                tracks: [{ url: track.url, initial: true }],
            })
            .then((res) => res.json());
        console.log(res);
    }

    public setVolume(volume: number): void {
        this.volume = volume;
        this.node.makeRequest(`api/player/${this.guild}`, "PATCH", {
            data: { volume: this.volume },
        });
    }

    public destroy(): void {}
}
