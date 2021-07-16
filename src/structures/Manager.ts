import { EventEmitter } from "events";
import { Collection, Snowflake, User } from "discord.js";
import {
    ManagerOptions,
    Payload,
    PlayerOptions,
    SearchQuery,
    SearchResult,
    TrackData,
} from "../Static/Interfaces";
import { Node } from "./Node";

import { Player } from "./Player";
import { Events } from "../Static/Constants";

export interface Manager {
    /**
     * Emitted when a Node is created.
     * @event nodeCreate
     */
    on(event: "nodeCreate", listener: (node: Node) => void): this;

    /**
     * Emitted when a Node is destroyed.
     * @event nodeDestroy
     */
    on(event: "nodeDestroy", listener: (node: Node) => void): this;

    /**
     * Emitted when a Node connects.
     * @event nodeConnect
     */
    on(event: "nodeConnect", listener: (node: Node) => void): this;

    /**
     * Emitted when a Node reconnects.
     * @event nodeReconnect
     */
    on(event: "nodeReconnect", listener: (node: Node) => void): this;

    /**
     * Emitted when a Node disconnects.
     * @event nodeDisconnect
     */
    on(
        event: "nodeDisconnect",
        listener: (
            node: Node,
            reason: { code?: number; reason?: string }
        ) => void
    ): this;

    /**
     * Emitted when a Node has an error.
     * @event nodeError
     */
    on(event: "nodeError", listener: (node: Node, error: Error) => void): this;
    /**
     * Emitted when nexus is ready
     * @event ready
     */
    on(event: Events.READY, listener: (payload: Payload) => void): this;
    /**
     * Emitted when a player is created.
     * @event playerCreate
     */
    on(event: "playerCreate", listener: (player: Player) => void): this;

    /**
     * Emitted when a player is destroyed.
     * @event playerDestroy
     */
    on(event: "playerDestroy", listener: (player: Player) => void): this;

    /**
     * Emitted when a player queue ends.
     * @event Events#QUEUE_END
     */
    on(
        event: "queueEnd",
        listener: (player: Player, payload: Payload) => void
    ): this;

    /**
     * Emitted when a track starts.
     * @event Events#TRACK_START
     */
    on(
        event: Events.TRACK_START,
        listener: (player: Player, track: TrackData) => void
    ): this;

    /**
     * Emitted when a track ends.
     * @event Events#TRACK_FINISH
     */
    on(
        event: Events.TRACK_FINISH,
        listener: (player: Player, track: TrackData) => void
    ): this;

    /**
     * Emitted when a track has an error during playback.
     * @event Events#TRACK_ERROR
     */
    on(
        event: Events.TRACK_ERROR,
        listener: (player: Player, track: TrackData, payload: Payload) => void
    ): this;

    /**
     * Emitted when a track is Added.
     * @event Events#TRACK_ADD
     */
    on(
        event: Events.TRACK_ADD,
        listener: (player: Player, track: TrackData) => void
    ): this;
    /**
     * Emitted when a tracks is Added.
     * @event Events#TRACKS_ADD
     */
    on(
        event: Events.TRACKS_ADD,
        listener: (player: Player, track: TrackData[]) => void
    ): this;
    /**
     * Emitted when a nexus player has an error.
     * @event Events#AUDIO_PLAYER_ERROR
     */
    on(
        event: Events.AUDIO_PLAYER_ERROR,
        listener: (payload: Payload) => void
    ): this;

    /**
     * Emitted when a Voice connection is disconnected.
     * @event Events#VOICE_CONNECTION_DISCONNECT
     */
    on(
        event: Events.VOICE_CONNECTION_DISCONNECT,
        listener: (payload: Payload) => void
    ): this;

    /**
     * Emitted when a Voice connection is ready.
     * @event Events#VOICE_CONNECTION_READY
     */
    on(
        event: Events.VOICE_CONNECTION_READY,
        listener: (payload: Payload) => void
    ): this;

    /**
     * Emitted when a Voice connection has error.
     * @event Events#VOICE_CONNECTION_ERROR
     */
    on(
        event: Events.VOICE_CONNECTION_ERROR,
        listener: (payload: Payload) => void
    ): this;
}

export class Manager extends EventEmitter {
    /** The map of players */
    public readonly players = new Collection<Snowflake, Player>();
    /** The node */
    public node: Node;
    /** The options for manager */
    public readonly options: ManagerOptions;
    /** To check whether manager is initiated or not */
    private initiated = false;
    /** Access Token */
    public access_token: string;

    /**
     * Contruct Manager class
     * @Constructor
     * @param options
     */
    constructor(options: ManagerOptions) {
        super();

        Player.init(this);
        Node.init(this);

        this.options = {
            node: { identifier: "default", host: "localhost" },
            ...options,
        };

        if (this.options.node) {
            new Node(this.options.node);
        }
    }

    /** Init Manager
     * @param clientId
     * @return Manager
     */
    public init(clientId: string): this {
        if (this.initiated) return this;
        if (typeof clientId !== "undefined") this.options.clientId = clientId;
        this.node.connect();
        this.initiated = true;
        return this;
    }

    /** Searching or Getting YouTube songs and playlist
     * @param SearchQuery
     * @param requester
     * @returns SearchResult
     */

    public search(
        SearchQuery: SearchQuery,
        requester: User
    ): Promise<SearchResult> {
        return new Promise(async (resolve, reject) => {
            const identifier = SearchQuery.identifier || "ytsearch";
            const query = SearchQuery.query;

            const res = await this.node
                .makeRequest(
                    `api/tracks/search?query=${encodeURIComponent(
                        query
                    )}&identifier=${identifier}`,
                    "GET"
                )
                .then((res) => res.json());

            if (!res) {
                return reject(new Error("Query not found"));
            }

            const SearchResult: SearchResult = this.resolveTrackData(
                res,
                requester
            );
            return resolve(SearchResult);
        });
    }
    /**
     * Resolve Search Result from nexus into Interface SearchResult
     * @param res search result
     * @param requester user who searched
     * @return SearchResult
     */
    private resolveTrackData(res: any, requester: User) {
        if (!res.results.length) {
            const SearchResult: SearchResult = {
                type: "NO_RESULT",
                tracks: [],
                requester: requester,
            };
            return SearchResult;
        }
        if (res.identifier === "ytsearch" || "scsearch") {
            const SearchResult: SearchResult = {
                type: "SEARCH_RESULT",
                tracks: res.results,
                requester: requester,
            };
            return SearchResult;
        } else {
            const SearchResult: SearchResult = {
                type: "PLAYLIST",
                playlist: {
                    title: res.results[0].title,
                    id: res.results[0].id,
                    url: res.results[0].url,
                    author: res.results[0].author,
                    extractor: res.results[0].extractor,
                },
                tracks: res.results[0].tracks.map((track: TrackData) =>
                    this.buildTrackData(track, requester)
                ),
                requester: requester,
            };
            return SearchResult;
        }
    }

    /** Build TrackData
     *
     * @param data
     * @param requester
     * @return TrackData
     * @private
     */

    private buildTrackData(data: TrackData, requester: User) {
        const track: TrackData = {
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
     * Creates a player or returns one if it already exists.
     * @param options
     * @return Player
     */
    public create(options: PlayerOptions): Player {
        if (this.players.has(options.guild)) {
            return this.players.get(options.guild);
        }
        return new Player(options);
    }

    public get(guild: string): Player | undefined {
        return this.players.get(guild);
    }
    /** Destroy the current connection */
    public destroyNode(): void {
        this.node.destroy();
    }
    /**
     * update voice state in nexus
     * @param data
     */
    public updateVoiceState(data: any): void {
        if (
            !data ||
            !["VOICE_SERVER_UPDATE", "VOICE_STATE_UPDATE"].includes(
                data.t || ""
            )
        )
            return;
        if (data.t === "VOICE_SERVER_UPDATE") {
            this.node.socket.send(JSON.stringify(data));
        }
        if (data.t === "VOICE_STATE_UPDATE") {
            this.node.socket.send(JSON.stringify(data));
        }
    }
}
