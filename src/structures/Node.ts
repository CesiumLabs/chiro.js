import { Manager } from "./Manager";
import { NodeOptions, Payload, TrackData } from "../Static/Interfaces";

import WebSocket from "ws";
import fetch from "node-fetch";
import { WSEvents, WSOpCodes } from "../Static/Constants";
import { Player } from "./Player";

/**
 * The Node Class
 */
export class Node {
    /**
     * Websocket
     * @type {WebSocket}
     */
    public socket: WebSocket | null = null;
    /**
     * The Manager
     * @type {Manager}
     */
    public manager: Manager;
    /**
     * Static Manager
     * @type {Manager}
     * @ignore
     * @private
     */
    private static _manager: Manager;
    /**
     * Reconnect Timeout
     * @type {NodeJS.Timeout}
     * @ignore
     * @private
     */
    private reconnectTimeout?: NodeJS.Timeout;
    /**
     * Reconnect Attempts
     * @type Number
     * @ignore
     * @private
     */
    private reconnectAttempts: number = 1;

    /**
     * Check if socket is ready
     * @type {void}
     * @ignore
     * @return {boolean}
     */
    public get connected(): boolean {
        if (!this.socket) return false;
        return this.socket.readyState === WebSocket.OPEN;
    }

    /**
     * @ignore
     * @param {Manager} manager Manager
     */
    public static init(manager: Manager): void {
        this._manager = manager;
    }

    /**
     * Node Constructor
     * @hideconstructor
     * @param {NodeOptions} options Node Options
     */
    constructor(public options: NodeOptions) {
        if (!this.manager) this.manager = Node._manager;
        if (!this.manager)
            throw new RangeError("Manager has not been initiated.");

        if (this.manager.node) {
            return this.manager.node;
        }
        this.options = {
            port: 3000,
            password: "SwagLordNitroUser12345",
            secure: false,
            retryAmount: 5,
            retryDelay: 30e3,
            ...options,
        };
        this.manager.node = this;
        this.manager.emit("nodeCreate", this);
    }

    /**
     * Creates a WS connection with Websocket
     * @ignore
     */
    public connect(): void {
        if (this.connected) return;
        const headers = {
            Authorization: this.options.password,
            "client-id": this.manager.options.clientId,
        };
        this.socket = new WebSocket(
            `ws${this.options.secure ? "s" : ""}://${this.options.host}:${
                this.options.port
            }/`,
            { headers }
        );
        this.socket.on("open", this.open.bind(this));
        this.socket.on("close", this.close.bind(this));
        this.socket.on("message", this.message.bind(this));
        this.socket.on("error", this.error.bind(this));
    }
    /**
     * Destroys the Node and all players connected with it.
     */
    public destroy(): void {
        if (!this.connected) return;

        const players = this.manager.players.filter((p) => p.node == this);
        if (players.size) players.forEach((p) => p.destroy());

        this.socket.close(1000, "destroy");
        this.socket.removeAllListeners();
        this.socket = null;

        this.reconnectAttempts = 1;
        clearTimeout(this.reconnectTimeout);

        this.manager.emit("nodeDestroy", this);
        this.manager.destroyNode();
    }

    /**
     * Make REST API Request to Nexus
     * @param {string} uriComponent URL Components to be added to base URL
     * @param {string} type Type of Call to make
     * @param {Object} body Body Object to send to REST API
     * @return {Promise}
     */
    public async makeRequest(
        uriComponent: string,
        type: "GET" | "POST" | "PATCH" | "DELETE",
        body?: any
    ): Promise<any> {
        const url =
            `http${this.options.secure ? "s" : ""}://${this.options.host}:${
                this.options.port
            }/` + uriComponent;
        if (body)
            return await fetch(url, {
                method: type,
                headers: {
                    Authorization: this.manager.access_token,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body ? body : {}),
            });
        else
            return await fetch(url, {
                method: type,
                headers: {
                    Authorization: this.manager.access_token,
                    "Content-Type": "application/json",
                },
            });
    }

    /**
     * Reconnect in case WS Connection fails
     * @hidden
     * @ignore
     * @private
     */
    private reconnect(): void {
        this.reconnectTimeout = setTimeout(() => {
            if (this.reconnectAttempts >= this.options.retryAmount) {
                const error = new Error(
                    `Unable to connect after ${this.options.retryAmount} attempts.`
                );

                this.manager.emit("nodeError", this, error);
                return this.destroy();
            }
            console.log(`RECONNECTING......`);
            this.socket.removeAllListeners();
            this.socket = null;
            this.manager.emit("nodeReconnect", this);
            this.connect();
            this.reconnectAttempts++;
        }, this.options.retryDelay);
    }

    /**
     * Emit Event called nodeConnect when socket is open
     * @protected
     * @ignore
     */
    protected open(): void {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.manager.emit("nodeConnect", this);
    }

    /**
     * Emit Event called nodeDisconnect when socket is closed
     * @param {number} code Close Code
     * @param {string} reason Reason
     * @protected
     * @ignore
     */
    protected close(code: number, reason: string): void {
        this.manager.emit("nodeDisconnect", this, { code, reason });
        if (code !== 1000 || reason !== "destroy") this.reconnect();
    }

    /**
     * Emit Event called nodeError when there is an error with socket connection
     * @param {Error} error Error
     * @protected
     * @ignore
     */
    protected error(error: Error): void {
        if (!error) return;
        this.manager.emit("nodeError", this, error);
    }

    /**
     * Handles the WS connection message
     * @param {Buffer | string} d Data Buffer
     * @protected
     * @ignore
     */
    protected message(d: Buffer | string): void {
        if (Array.isArray(d)) d = Buffer.concat(d);
        else if (d instanceof ArrayBuffer) d = Buffer.from(d);

        const payload: Payload = JSON.parse(d.toString());

        if (payload.op !== undefined) {
            switch (payload.op) {
                case WSOpCodes.HELLO:
                    console.log(
                        "Hello Received from Nexus\nSending Identify OP Code"
                    );
                    this.socket.send(JSON.stringify({ op: 10 }));
                    break;
                case WSOpCodes.VOICE_STATE_UPDATE:
                    this.manager.options.send(payload.d.d.guild_id, payload.d);
                    break;
                default:
                    console.log("UNKNOWN OPCODE");
            }
        }
        if (payload.t !== undefined) {
            const player = this.manager.players.get(payload.d.guild_id);
            switch (payload.t) {
                case WSEvents.READY:
                    console.log("Identified");
                    this.manager.access_token = payload.d.access_token;
                    this.manager.emit("ready", payload);
                    break;
                case WSEvents.VOICE_CONNECTION_READY:
                    player.connected = "connected";
                    if (player)
                        this.manager.emit("voiceReady", player, payload);
                    break;
                case WSEvents.VOICE_CONNECTION_ERROR:
                    this.manager.emit("voiceError", player, payload);
                    break;
                case WSEvents.VOICE_CONNECTION_DISCONNECT:
                    player.connected = "disconnected";
                    if (player) this.manager.emit("voiceDisconnect", player);
                    player.queue.clear();
                    break;
                case WSEvents.TRACK_START:
                    this.handleTrackEvent(payload);
                    break;
                case WSEvents.TRACK_FINISH:
                    this.handleTrackEvent(payload);
                    break;
                case WSEvents.TRACK_ERROR:
                    this.handleTrackEvent(payload);
                    break;
                case WSEvents.QUEUE_END:
                    this.handleTrackEvent(payload);
                    break;
                case WSEvents.AUDIO_PLAYER_ERROR:
                    this.manager.emit("audioPlayerError", player, payload);
                    break;
                case WSEvents.AUDIO_PLAYER_STATUS:
                    console.log(payload);
            }
        }
    }

    /**
     * handle TrackEvents
     * @param {Payload} payload Payload
     * @protected
     * @ignore
     */
    protected handleTrackEvent(payload: Payload) {
        const player = this.manager.players.get(payload.d.guild_id);
        if (!player) return;
        const track = player.queue.current;
        if (payload.t === WSEvents.TRACK_START) {
            this.trackStart(player, track, payload);
        }
        if (payload.t === WSEvents.TRACK_FINISH) {
            this.trackEnd(player, track, payload);
        }
        if (payload.t === WSEvents.TRACK_ERROR) {
            this.manager.emit("trackError", payload);
            this.trackEnd(player, track, payload);
        }
    }

    /**
     * When Track Start emit the event trackstart
     * @param {Player} player Player
     * @param {TrackData} track Track
     * @param {Payload} payload payload
     * @protected
     * @ignore
     */
    protected trackStart(
        player: Player,
        track: TrackData,
        payload: Payload
    ): void {
        player.playing = true;
        player.paused = false;
        this.manager.emit("trackStart", player, track, payload);
    }

    /**
     * Emit event QueueEnd and TrackEnd
     * @param {Player} player Player
     * @param {TrackData} track Track
     * @param {Payload} payload Payload
     * @protected
     * @ignore
     */
    protected trackEnd(
        player: Player,
        track: TrackData,
        payload: Payload
    ): void {
        if (!player.queue.current) return this.queueEnd(player, payload);
        if (track && player.trackRepeat) {
            this.manager.emit("trackEnd", player, track);
            player.play();
            return;
        }
        if (track && player.queueRepeat) {
            player.queue.previous = player.queue.current;
            player.queue.current = player.queue.shift();
            player.queue.add(player.queue.previous);
            this.manager.emit("trackEnd", player, track);
            player.play();
            return;
        }
        if (player.queue.length) {
            player.queue.previous = player.queue.current;
            player.queue.current = player.queue.shift();
            this.manager.emit("trackEnd", player, track);
            player.play();
            return;
        }
        if (!player.queue.length) return this.queueEnd(player, payload);
    }

    /**
     * @param {Player} player Player
     * @param {Payload} payload Payload
     * @protected
     * @ignore
     */
    protected queueEnd(player: Player, payload: Payload) {
        this.manager.emit("queueEnd", player, payload);
    }

    /**
     * Update Player Data
     * @param player
     * @param payload
     * @protected
     */
    protected updatePlayerData(player: Player, payload: Payload) {
        player.paused = payload.d.paused;
        player.volume = payload.d.volume;
        player.queue.current.stream_time = payload.d.stream_time;
    }

    /**
     * Send payload to the nexus using ws
     * @param {Object} data Payload to send to WS
     * @return {Promise<boolean>}
     * @example
     * const payload = {"op": 10, d: null}
     * <Player>.node.send(payload)
     * @example
     * const payload = {"op": 10, d: null}
     * <Manager>.node.send(payload)
     */
    public send(data: unknown): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.connected) return false;
            if (!data || !JSON.stringify(data).startsWith("{")) {
                return false;
            }
            this.socket.send(JSON.stringify(data), (error: Error) => {
                if (error) reject(error);
                else true;
            });
        });
    }
}

/**
 * @typedef {Object} NodeOptions
 * @param {string} host='localhost' Hostname of Nexus Node
 * @param {number} port='3000' Port of Nexus
 * @param {string} password Password for Nexus
 * @param {boolean} secure=false If Nexus has ssl
 * @param {string} identifier Identifier for nexus
 * @param {number} [retryAmount] Retry Amount
 * @param {number} [retryDelay] Retry Delay
 * @param {number} [requestTimeout] Request Timeout
 */
