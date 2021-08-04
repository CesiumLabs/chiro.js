import WebSocket from "ws";
import fetch, { Response } from "node-fetch";
import { inspect } from "util";
import { Manager } from "./Manager";
import { Player } from "./Player";
import { ChiroError, ChiroEventError, ChiroEventErrorKind } from "./Error";
import { NodeOptions, Payload, TrackData, Snowflake } from "../static/Interfaces";
import { WSEvents, WSOpCodes } from "../static/Constants";

/**
 * The Node class which does the api management.
 */
export class Node {
    /**
     * Boolean stating is the node subscribed or not.
     * @type {boolean}
     * @name Node#subscribed
     */
    public subscribed = false;

    /**
     * Websocket of the node.
     * @type {WebSocket | null}
     * @name Node#socket
     */
    public socket: WebSocket | null = null;

    /**
     * Nexus Access Token for the REST API calls.
     * @type {string}
     * @name Node#accessToken
     */
    public accessToken: string;

    /**
     * The base url where the node fetches.
     * @type {string}
     * @name Node#baseURL
     */
    public baseURL: string;

    /**
     * The password for the node.
     * @type {string}
     * @name Node#password
     */
    public password: string;

    /**
     * The ping interval for the Node, if needed.
     * @type {number | undefined}
     * @name Node#pingInterval
     */
    public pingInterval?: number;

    /**
     * The number of retries done by the node.
     * @type {number | undefined}
     * @name Node#retryAmount
     */
    public retryAmount?: number;

    /**
     * The amount of time in milliseconds to set interval on each retry.
     * @type {number | undefined}
     * @name Node#retryDelay
     */
    public retryDelay?: number;

    /**
     * Reconnect Timeout.
     * @type {NodeJS.Timeout}
     * @name Node#reconnectTimeout
     * @private
     */
    private reconnectTimeout?: NodeJS.Timeout;

    /**
     * Number of reconnect attempts.
     * @type {number}
     * @name Node#reconnectAttempts
     * @private
     */
    private reconnectAttempts: number = 1;

    #pingLastSent: number;
    #pingLastReceived: number;

    /**
     * The constructor for the node.
     * @param {NodeOptions} options The options required for the Node.
     * @param {Manager} manager The manager for this node.
     * @param {number} id The id for the Node for debugging.
     */
    constructor(options: NodeOptions, public manager: Manager, public id: number) {
        if (!manager) throw new ChiroError("Invalid manager has been provided for Node.");
        if (manager.node) return manager.node;

        options = {
            port: 3000,
            password: "SwagLordNitroUser12345",
            secure: false,
            retryAmount: 5,
            retryDelay: 30e3,
            ...options
        };

        this.pingInterval = options.pingInterval;
        this.password = options.password;
        this.retryAmount = options.retryAmount;
        this.retryDelay = options.retryDelay;
        this.baseURL = `http${options.secure ? "s" : ""}://${options.host}${options.port ? `:${options.port}` : ""}`;
    }

    /**
     * Returns a boolean stating is the socket connected or not.
     * @type {boolean}
     */
    public get connected(): boolean {
        return this.socket ? this.socket.readyState === WebSocket.OPEN : false;
    }

    /**
     * Creates a WS connection with the Websocket API.
     */
    public connect() {
        if (this.connected) return;

        this.socket = new WebSocket(this.baseURL.replace("http", "ws"), { headers: { Authorization: this.password, "client-id": this.manager.clientID } });

        this.socket.on("open", this.open.bind(this));
        this.socket.on("close", this.close.bind(this));
        this.socket.on("message", this.message.bind(this));
        this.socket.on("error", this.error.bind(this));

        if (typeof this.pingInterval == "number") {
            const timer: NodeJS.Timer = setInterval(() => {
                if (this.connected) {
                    this.send({ op: WSOpCodes.PING });
                    this.#pingLastSent = Date.now();
                } else clearInterval(timer)
            }, this.pingInterval).unref();
        }
    }

    /**
     * Destroys the Node and all players connected with it.
     */
    public destroy() {
        if (!this.connected) return;

        this.manager.players.forEach((p) => {
            if (p.node == this) p.destroy();
        });

        this.socket.close(1000, "destroy");
        this.socket.removeAllListeners();
        this.socket = null;

        this.reconnectAttempts = 1;
        clearTimeout(this.reconnectTimeout);

        this.manager.emit("nodeDisconnect", this);
        this.manager.destroyNodes();
    }

    /**
     * Make a request to the Nexus Api.
     * @param {string} method The type of api request to be done.
     * @param {string} path The api url's path.
     * @param {Object} body The body of the request.
     * @returns {Promise<Response>}
     */
    public async makeRequest(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, body?: Record<string, unknown>): Promise<Response> {
        const response = await fetch(`${this.baseURL}/${path}`, {
            method,
            body: body ? JSON.stringify(body) : null,
            headers: {
                Authorization: this.accessToken,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new ChiroError(`${method} ${this.baseURL}/${path} sent an unusual response as ${response.status} ${response.statusText}. ${inspect(response)}`);
        return response;
    }

    /**
     * Reconnect in to the Websocket if the connection fails.
     * @private
     */
    private reconnect() {
        if (!this.socket) return;

        this.reconnectTimeout = setTimeout(() => {
            if (this.reconnectAttempts >= this.retryAmount) {
                this.manager.emit("error", new ChiroEventError(ChiroEventErrorKind.Node, new Error(`Unable to connect after ${this.retryAmount} attempts.`)));
                return this.destroy();
            }

            this.socket.removeAllListeners();
            this.socket = null;
            this.manager.emit("nodeReconnect", this);
            this.connect();
            this.reconnectAttempts++;
        }, this.retryDelay);
    }

    /**
     * Open event for the websocket api.
     * @protected
     */
    protected open() {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.manager.emit("nodeConnect", this);
    }

    /**
     * Close event for the websocket api.
     * @param {number} code Close code from the ws api.
     * @param {string} reason Reason for the closinf the ws connection.
     * @protected
     */
    protected close(code: number, reason: string) {
        this.manager.emit("nodeDisconnect", this, { code, reason });
        if (code !== 1000 || reason !== "destroy") this.reconnect();
    }

    /**
     * Error event for the websocket api.
     * @param {Error} error Error from the socket.
     * @protected
     */
    protected error(error: Error) {
        if (!error) return;
        this.manager.emit("error", new ChiroEventError(ChiroEventErrorKind.Node, error));
    }

    /**
     * Message event from the websocket api.
     * @param {Buffer | string} d Data Buffer from the api.
     * @protected
     */
    protected message(d: Buffer | string) {
        if (Array.isArray(d)) d = Buffer.concat(d);
        else if (d instanceof ArrayBuffer) d = Buffer.from(d);

        const payload: Payload = JSON.parse(d.toString());

        this.manager.emit("nodeRawEvent", this, payload);

        if (payload.op !== undefined) {
            switch (payload.op) {
                // @ts-ignore
                case WSOpCodes.HELLO:
                    this.socket.send(JSON.stringify({ op: WSOpCodes.IDENTIFY }));
                    break;

                case WSOpCodes.VOICE_STATE_UPDATE:
                    this.manager.options.onData(payload.d.d.guild_id, payload.d);
                    break;

                case WSOpCodes.PONG:
                    this.#pingLastReceived = Date.now();
                    break;
                default:
                    this.manager.emit("nodeUnknownEvent", payload);
            }
        }

        if (payload.t !== undefined) {
            const player = this.manager.players.get(payload.d.guild_id);
            switch (payload.t) {
                case WSEvents.READY:
                    this.accessToken = payload.d.access_token;
                    this.manager.emit("ready");
                    break;

                case WSEvents.VOICE_CONNECTION_READY:
                    player.state = "connected";
                    if (player) this.manager.emit("voiceReady", player);
                    break;

                case WSEvents.VOICE_CONNECTION_ERROR:
                    this.manager.emit("error", new ChiroEventError(ChiroEventErrorKind.Voice, payload, player));
                    break;

                case WSEvents.VOICE_CONNECTION_DISCONNECT:
                    player.state = "disconnected";
                    if (player) this.manager.emit("voiceDisconnect", player);
                    player.queue.clear();
                    break;

                case WSEvents.AUDIO_PLAYER_ERROR:
                    this.manager.emit("error", new ChiroEventError(ChiroEventErrorKind.AudioPlayer, payload, player));
                    break;

                case WSEvents.AUDIO_PLAYER_STATUS:
                    // TODO(Scientific-Guy): handle player status
                    break;

                default:
                    // The only events left are track events.
                    this.handleTrackEvent(payload);
            }
        }
    }

    /**
     * Handle all kind of track events.
     * @param {Payload} payload Payload from the websocket api.
     * @protected
     */
    protected handleTrackEvent(payload: Payload) {
        const player = this.manager.players.get(payload.d.guild_id);
        if (!player) return;
        const track = player.queue.current;

        switch (payload.t) {
            case WSEvents.TRACK_START:
                player.playing = true;
                this.manager.emit("trackStart", player, track);
                break;

            case WSEvents.QUEUE_END:
                this.trackEnd(player, track, payload);
                break;

            case WSEvents.TRACK_ERROR:
                this.manager.emit("error", new ChiroEventError(ChiroEventErrorKind.Track, payload, player));
                this.trackEnd(player, track, payload);
                break;

            default:
                this.manager.emit("nodeUnknownEvent", payload);
        }
    }

    /**
     * Emit event for the TRACK_END event.
     * @param {Player} player The player.
     * @param {TrackData} track The data of the track.
     * @param {Payload} payload The payload from the ws api.
     * @protected
     */
    protected trackEnd(player: Player, track: TrackData, payload: Payload) {
        if (!player.queue.length) return this.queueEnd(player, payload);
        if (track && player.trackRepeat) {
            this.manager.emit("trackEnd", player, track);
            return player.play();
        }

        player.queue.previous = player.queue.current;
        player.queue.current = player.queue.shift();

        if (track && player.queueRepeat) {
            player.queue.add(player.queue.previous);
            this.manager.emit("trackEnd", player, track);
            return player.play();
        }

        if (player.queue.length) {
            this.manager.emit("trackEnd", player, track);
            return player.play();
        }
    }

    /**
     * Emits the `queueEnd` event in the Manager.
     * @param {Player} player The player.
     * @param {Payload} payload The payload sent by the ws api.
     * @protected
     */
    protected queueEnd(player: Player, payload: Payload) {
        this.manager.emit("queueEnd", player);
    }

    /**
     * Update the player's data.
     * @param {Player} player The player.
     * @param {Payload} payload The payload data to be sent while updating.
     * @protected
     */
    protected updatePlayerData(player: Player, payload: Payload) {
        player.playing = !payload.d.paused;
        player.volume = payload.d.volume;
        player.queue.current.streamTime = payload.d.stream_time;
    }

    /**
     * Send payload data to the nexus using ws.
     * @param {Object} data Payload to send to WS
     * @returns {Promise<boolean>}
     * @example
     * const payload = {"op": 10, d: null}
     * <Player>.node.send(payload)
     */
    public send(data: unknown): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const stringified = JSON.stringify(data);
            if (!this.connected) return resolve(false);
            if (!data || !stringified.startsWith("{")) return reject(new ChiroError("Improper data sent to send in the WS."));
            this.socket.send(stringified, (error: Error) => (error ? reject(error) : resolve(true)));
        });
    }

    /**
     * Subscribe to the guild and the voice channel.
     * 
     * @param {Snowflake} guild The id of the guild.
     * @param {Snowflake} voiceChannel The id of the voice channel.
     * @returns {Promise<void>}
     */
    public async subscribe(guild: Snowflake, voiceChannel: Snowflake) {
        if (this.subscribed) throw new ChiroError(`Attempting subscribe to a node ${this.id} which is already subscribed!`);
        await this.makeRequest("POST", `api/subscription/${guild}/${voiceChannel}`);
        this.subscribed = true;
    }

    /**
     * Unsubscribe to the guild and the voice channel.
     * 
     * @param {Snowflake} guild The id of the guild.
     * @param {Snowflake} voiceChannel The id of the voice channel.
     * @returns {Promise<void>}
     */
    public async unsubscribe(guild: Snowflake, voiceChannel: Snowflake) {
        if (!this.subscribed) return;
        await this.makeRequest("DELETE", `api/subscription/${guild}/${voiceChannel}`);
        this.subscribed = false;
    }

    /**
     * The websocket latency
     * @type {number}
     */
    public get ping() {
        return this.#pingLastReceived - this.#pingLastSent;
    }
}

/**
 * @typedef {Object} NodeOptions
 * @param {string} host='localhost' Hostname of Nexus Node
 * @param {number} port='3000' Port of Nexus
 * @param {string} password Password for Nexus
 * @param {boolean} secure=false If Nexus has ssl
 * @param {string} identifier IDentifier for nexus
 * @param {number} [retryAmount] Retry Amount
 * @param {number} [retryDelay] Retry Delay
 * @param {number} [requestTimeout] Request Timeout
 * @param {number} [pingInterval] The ping interval to send pings to the gateway if needed.
 */
