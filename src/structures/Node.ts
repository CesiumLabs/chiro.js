import { Manager } from "./Manager";
import { NodeOptions, Payload, TrackData } from "../Static/Interfaces";

import WebSocket from "ws";
import fetch from "node-fetch";
import { Events, WSEvents, WSOpCodes } from "../Static/Constants";
import { Player } from "./Player";

export class Node {
    /** The socket for the node */
    public socket: WebSocket | null = null;
    /**
     * The Manager
     */
    public manager: Manager;
    /** Static Manager
     * @hidden
     */
    private static _manager: Manager;
    /**
     * @hidden
     */
    private reconnectTimeout?: NodeJS.Timeout;
    /** Static Manager
     * @hidden
     */
    private reconnectAttempts = 1;

    /**
     * Returns if node is socket is ready or not
     * @return boolean
     */
    public get connected(): boolean {
        if (!this.socket) return false;
        return this.socket.readyState === WebSocket.OPEN;
    }
    /** @hidden */
    public static init(manager: Manager): void {
        this._manager = manager;
    }

    /** Construct Node
     * @hideconstructor
     * @hidden
     * @param options
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
     * @hidden
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
     * @param uriComponent
     * @param type
     * @param body
     * @return Promise<any>
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
     */
    protected open(): void {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.manager.emit("nodeConnect", this);
    }

    /**
     * Emit Event called nodeDisconnect when socket is closed
     * @param code
     * @param reason
     * @protected
     */
    protected close(code: number, reason: string): void {
        this.manager.emit("nodeDisconnect", this, { code, reason });
        if (code !== 1000 || reason !== "destroy") this.reconnect();
    }

    /**
     * Emit Event called nodeError when there is an error with socket connection
     * @param error
     * @protected
     */
    protected error(error: Error): void {
        if (!error) return;
        this.manager.emit("nodeError", this, error);
    }

    /**
     * Handles the WS connection message
     * @param d
     * @protected
     */
    protected message(d: Buffer | string): void {
        if (Array.isArray(d)) d = Buffer.concat(d);
        else if (d instanceof ArrayBuffer) d = Buffer.from(d);

        const payload: Payload = JSON.parse(d.toString());

        if (payload.op !== undefined) {
            switch (payload.op) {
                case WSOpCodes.HELLO:
                    console.log(
                        "Hello Recieved from Nexus\nSending Identifiy OP Code"
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
            switch (payload.t) {
                case WSEvents.READY:
                    this.manager.access_token = payload.d.access_token;
                    this.manager.emit(Events.READY, payload);
                    break;
                case WSEvents.VOICE_CONNECTION_READY:
                    this.manager.emit(Events.VOICE_CONNECTION_READY, payload);
                    break;
                case WSEvents.VOICE_CONNECTION_ERROR:
                    this.manager.emit(Events.VOICE_CONNECTION_ERROR, payload);
                    break;
                case WSEvents.VOICE_CONNECTION_DISCONNECT:
                    this.manager.emit(
                        Events.VOICE_CONNECTION_DISCONNECT,
                        payload
                    );
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
                    this.manager.emit(Events.AUDIO_PLAYER_ERROR, payload);
            }
        }
    }

    /**
     * handle TrackEvents
     * @param payload
     * @protected
     */
    protected handleTrackEvent(payload: Payload) {
        const player = this.manager.players.get(payload.d.guild_id);
        if (!player) return;
        const track = player.queue.current;
        if (payload.t === WSEvents.TRACK_START) {
            this.trackStart(player, track, payload);
        }
        if (payload.t === WSEvents.QUEUE_END) {
            this.trackEnd(player, track, payload);
        }
        if (payload.t === WSEvents.TRACK_ERROR) {
            this.manager.emit(Events.TRACK_ERROR, payload);
            this.trackEnd(player, track, payload);
        }
    }

    /**
     * When Track Start emit the event trackstart
     * @param player
     * @param track
     * @param payload
     * @protected
     */
    protected trackStart(
        player: Player,
        track: TrackData,
        payload: Payload
    ): void {
        player.playing = true;
        player.paused = false;
        this.manager.emit(Events.TRACK_START, player, track, payload);
    }

    /**
     * Emit event QueueEnd and TrackEnd
     * @param player
     * @param track
     * @param payload
     * @protected
     */
    protected trackEnd(
        player: Player,
        track: TrackData,
        payload: Payload
    ): void {
        if (track && player.trackRepeat) {
            if (!player.queue.current) return this.queueEnd(player, payload);
            this.manager.emit(Events.TRACK_FINISH, player, track);
            player.play();
            return;
        }
        if (track && player.queueRepeat) {
            if (!player.queue.current) return this.queueEnd(player, payload);
            player.queue.previous = player.queue.current;
            player.queue.current = player.queue.shift();
            player.queue.add(player.queue.previous);
            this.manager.emit(Events.TRACK_FINISH, player, track);
            player.play();
            return;
        }
        if (player.queue.length) {
            player.queue.previous = player.queue.current;
            player.queue.current = player.queue.shift();
            this.manager.emit(Events.TRACK_FINISH, player, track);
            player.play();
            return;
        }
        if (!player.queue.length) return this.queueEnd(player, payload);
    }

    /**
     * @param player
     * @param payload
     * @protected
     */
    protected queueEnd(player, payload) {
        this.manager.emit(Events.QUEUE_END, player, payload);
    }

    /**
     * send payload to the nexus using ws
     * @param data
     * @return Promise<boolean>
     */
    public send(data: unknown): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.connected) return resolve(false);
            if (!data || !JSON.stringify(data).startsWith("{")) {
                return reject(false);
            }
            this.socket.send(JSON.stringify(data), (error: Error) => {
                if (error) reject(error);
                else resolve(true);
            });
        });
    }
}
