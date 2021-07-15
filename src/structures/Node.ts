import { Manager } from "./Manager";
import { NodeOptions, Payload, TrackData } from "../Static/Interfaces";
import { Structure } from "./Utils";
import WebSocket from "ws";
import fetch from "node-fetch";
import { Events, WSEvents, WSOpCodes } from "../Static/Constants";
import { Player } from "./Player";

export class Node {
    /** The socket for the node */
    public socket: WebSocket | null = null;
    /** The amount of rest calls the node has made */
    public calls = 0;

    public manager: Manager;
    private static _manager: Manager;
    private reconnectTimeout?: NodeJS.Timeout;
    private reconnectAttempts = 1;

    /** Returns if connected to the Node */
    public get connected(): boolean {
        if (!this.socket) return false;
        return this.socket.readyState === WebSocket.OPEN;
    }
    /** @hidden */
    public static init(manager: Manager): void {
        this._manager = manager;
    }

    /** Construct Node
     * @param options
     */
    constructor(public options: NodeOptions) {
        if (!this.manager) this.manager = Structure.get("Node")._manager;
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

    /** Connects to nexus */
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
    /** Destroys the Node and all players connected with it. */
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
    protected open(): void {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.manager.emit("nodeConnect", this);
    }

    protected close(code: number, reason: string): void {
        this.manager.emit("nodeDisconnect", this, { code, reason });
        if (code !== 1000 || reason !== "destroy") this.reconnect();
    }

    protected error(error: Error): void {
        if (!error) return;
        this.manager.emit("nodeError", this, error);
    }
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
                    console.log(payload);
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
                case WSEvents.TRACK_START:
                    this.handleTrackEvent(payload);
                    break;
                case WSEvents.TRACK_FINISH:
                    this.handleTrackEvent(payload);
                    break;
            }
        }
    }

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
    }

    protected trackStart(
        player: Player,
        track: TrackData,
        payload: Payload
    ): void {
        player.playing = true;
        player.paused = false;
        this.manager.emit(Events.TRACK_START, player, track, payload);
    }
    protected trackEnd(
        player: Player,
        track: TrackData,
        payload: Payload
    ): void {
        player.queue.previous = player.queue.current;
        player.queue.current = player.queue.shift();
        if (!player.queue.current) {
            this.manager.emit(Events.QUEUE_END, player, payload);
            return;
        }
        this.manager.emit(Events.TRACK_FINISH, player, track, payload);
        player.play();
    }
}
