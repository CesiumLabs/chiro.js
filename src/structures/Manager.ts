import { EventEmitter } from "events";
import { Collection, Constants, Snowflake, User } from "discord.js";
import {
    ManagerOptions,
    PlayerOptions,
    SearchQuery,
    SearchResult,
} from "../Static/Interfaces";
import { Node } from "./Node";
import { Structure } from "./Utils";
import { Player } from "./Player";
import { WSEvents } from "../Static/Constants";
export class Manager extends EventEmitter {
    /** The map of players */
    public readonly players = new Collection<Snowflake, Player>();
    /** The node */
    public node: Node;
    /** The options for manager */
    public readonly options: ManagerOptions;
    private initiated = false;
    public access_token: string;

    /** Contruct Manager class
     * @param options
     */
    constructor(options: ManagerOptions) {
        super();

        Structure.get("Player").init(this);
        Structure.get("Node").init(this);

        this.options = {
            node: { identifier: "default", host: "localhost" },
            ...options,
        };

        if (this.options.node) {
            new (Structure.get("Node"))(this.options.node);
        }
    }

    /** Init Manager
     * @param clientId
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
                type: "SEARCH_RESULT",
                playlist: {
                    title: res.results[0].title,
                    id: res.results[0].id,
                    url: res.results[0].url,
                    author: res.results[0].author,
                    extractor: res.results[0].extractor,
                },
                tracks: res.results[0].tracks,
                requester: requester,
            };
        }
    }

    /**
     * Creates a player or returns one if it already exists.
     * @param options
     */
    public create(options: PlayerOptions): Player {
        if (this.players.has(options.guild)) {
            return this.players.get(options.guild);
        }

        return new (Structure.get("Player"))(options);
    }

    public get(guild: string): Player | undefined {
        return this.players.get(guild);
    }

    public destroyNode(): void {
        this.node.destroy();
    }

    public updateVoiceState(data: any): void {
        if (
            !data ||
            !["VOICE_SERVER_UPDATE", "VOICE_STATE_UPDATE"].includes(
                data.t || ""
            )
        )
            return;
        if (data.t === "VOICE_SERVER_UPDATE") {
            this.node
                .send({
                    t: Constants.WSEvents.VOICE_SERVER_UPDATE,
                    d: data,
                })
                .then((res) => {
                    console.log(res);
                });
        }
        if (data.t === "VOICE_STATE_UPDATE") {
            this.node
                .send({
                    t: Constants.WSEvents.VOICE_STATE_UPDATE,
                    d: data,
                })
                .then((res) => {
                    console.log(res);
                });
        }
    }
}
