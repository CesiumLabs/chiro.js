"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
const ws_1 = __importDefault(require("ws"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const Constants_1 = require("../Static/Constants");
/**
 * The Node Class
 */
class Node {
    /**
     * Node Constructor
     * @hideconstructor
     * @param {NodeOptions} options Node Options
     */
    constructor(options) {
        this.options = options;
        /**
         * Websocket
         * @type {WebSocket}
         */
        this.socket = null;
        /**
         * Reconnect Attempts
         * @type Number
         * @ignore
         * @private
         */
        this.reconnectAttempts = 1;
        if (!this.manager)
            this.manager = Node._manager;
        if (!this.manager)
            throw new RangeError("Manager has not been initiated.");
        if (this.manager.node) {
            return this.manager.node;
        }
        this.options = Object.assign({ port: 3000, password: "SwagLordNitroUser12345", secure: false, retryAmount: 5, retryDelay: 30e3 }, options);
        this.manager.node = this;
        this.manager.emit("nodeCreate", this);
    }
    /**
     * Check if socket is ready
     * @type {void}
     * @ignore
     * @return {boolean}
     */
    get connected() {
        if (!this.socket)
            return false;
        return this.socket.readyState === ws_1.default.OPEN;
    }
    /**
     * @ignore
     * @param {Manager} manager Manager
     */
    static init(manager) {
        this._manager = manager;
    }
    /**
     * Creates a WS connection with Websocket
     * @ignore
     */
    connect() {
        if (this.connected)
            return;
        const headers = {
            Authorization: this.options.password,
            "client-id": this.manager.options.clientId,
        };
        this.socket = new ws_1.default(`ws${this.options.secure ? "s" : ""}://${this.options.host}:${this.options.port}/`, { headers });
        this.socket.on("open", this.open.bind(this));
        this.socket.on("close", this.close.bind(this));
        this.socket.on("message", this.message.bind(this));
        this.socket.on("error", this.error.bind(this));
    }
    /**
     * Destroys the Node and all players connected with it.
     */
    destroy() {
        if (!this.connected)
            return;
        const players = this.manager.players.filter((p) => p.node == this);
        if (players.size)
            players.forEach((p) => p.destroy());
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
    makeRequest(uriComponent, type, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `http${this.options.secure ? "s" : ""}://${this.options.host}:${this.options.port}/` + uriComponent;
            if (body)
                return yield node_fetch_1.default(url, {
                    method: type,
                    headers: {
                        Authorization: this.manager.access_token,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(body ? body : {}),
                });
            else
                return yield node_fetch_1.default(url, {
                    method: type,
                    headers: {
                        Authorization: this.manager.access_token,
                        "Content-Type": "application/json",
                    },
                });
        });
    }
    /**
     * Reconnect in case WS Connection fails
     * @hidden
     * @ignore
     * @private
     */
    reconnect() {
        this.reconnectTimeout = setTimeout(() => {
            if (this.reconnectAttempts >= this.options.retryAmount) {
                const error = new Error(`Unable to connect after ${this.options.retryAmount} attempts.`);
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
    open() {
        if (this.reconnectTimeout)
            clearTimeout(this.reconnectTimeout);
        this.manager.emit("nodeConnect", this);
    }
    /**
     * Emit Event called nodeDisconnect when socket is closed
     * @param {number} code Close Code
     * @param {string} reason Reason
     * @protected
     * @ignore
     */
    close(code, reason) {
        this.manager.emit("nodeDisconnect", this, { code, reason });
        if (code !== 1000 || reason !== "destroy")
            this.reconnect();
    }
    /**
     * Emit Event called nodeError when there is an error with socket connection
     * @param {Error} error Error
     * @protected
     * @ignore
     */
    error(error) {
        if (!error)
            return;
        this.manager.emit("nodeError", this, error);
    }
    /**
     * Handles the WS connection message
     * @param {Buffer | string} d Data Buffer
     * @protected
     * @ignore
     */
    message(d) {
        if (Array.isArray(d))
            d = Buffer.concat(d);
        else if (d instanceof ArrayBuffer)
            d = Buffer.from(d);
        const payload = JSON.parse(d.toString());
        if (payload.op !== undefined) {
            switch (payload.op) {
                case Constants_1.WSOpCodes.HELLO:
                    console.log("Hello Received from Nexus\nSending Identify OP Code");
                    this.socket.send(JSON.stringify({ op: 10 }));
                    break;
                case Constants_1.WSOpCodes.VOICE_STATE_UPDATE:
                    this.manager.options.send(payload.d.d.guild_id, payload.d);
                    break;
                default:
                    console.log("UNKNOWN OPCODE");
            }
        }
        if (payload.t !== undefined) {
            switch (payload.t) {
                case Constants_1.WSEvents.READY:
                    console.log("Identified");
                    this.manager.access_token = payload.d.access_token;
                    this.manager.emit("ready", payload);
                    break;
                case Constants_1.WSEvents.VOICE_CONNECTION_READY:
                    this.manager.emit("voiceReady", payload);
                    break;
                case Constants_1.WSEvents.VOICE_CONNECTION_ERROR:
                    this.manager.emit("voiceError", payload);
                    break;
                case Constants_1.WSEvents.VOICE_CONNECTION_DISCONNECT:
                    this.manager.emit("voiceError", payload);
                    break;
                case Constants_1.WSEvents.TRACK_START:
                    this.handleTrackEvent(payload);
                    break;
                case Constants_1.WSEvents.TRACK_FINISH:
                    this.handleTrackEvent(payload);
                    break;
                case Constants_1.WSEvents.TRACK_ERROR:
                    this.handleTrackEvent(payload);
                    break;
                case Constants_1.WSEvents.QUEUE_END:
                    this.handleTrackEvent(payload);
                    break;
                case Constants_1.WSEvents.AUDIO_PLAYER_ERROR:
                    this.manager.emit("audioPlayerError", payload);
            }
        }
    }
    /**
     * handle TrackEvents
     * @param {Payload} payload Payload
     * @protected
     * @ignore
     */
    handleTrackEvent(payload) {
        const player = this.manager.players.get(payload.d.guild_id);
        if (!player)
            return;
        const track = player.queue.current;
        if (payload.t === Constants_1.WSEvents.TRACK_START) {
            this.trackStart(player, track, payload);
        }
        if (payload.t === Constants_1.WSEvents.QUEUE_END) {
            this.trackEnd(player, track, payload);
        }
        if (payload.t === Constants_1.WSEvents.TRACK_ERROR) {
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
    trackStart(player, track, payload) {
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
    trackEnd(player, track, payload) {
        if (track && player.trackRepeat) {
            if (!player.queue.current)
                return this.queueEnd(player, payload);
            this.manager.emit("trackEnd", player, track);
            player.play();
            return;
        }
        if (track && player.queueRepeat) {
            if (!player.queue.current)
                return this.queueEnd(player, payload);
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
        if (!player.queue.length)
            return this.queueEnd(player, payload);
    }
    /**
     * @param {Player} player Player
     * @param {Payload} payload Payload
     * @protected
     * @ignore
     */
    queueEnd(player, payload) {
        this.manager.emit("queueEnd", player, payload);
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
    send(data) {
        return new Promise((resolve, reject) => {
            if (!this.connected)
                return resolve(false);
            if (!data || !JSON.stringify(data).startsWith("{")) {
                return reject(false);
            }
            this.socket.send(JSON.stringify(data), (error) => {
                if (error)
                    reject(error);
                else
                    resolve(true);
            });
        });
    }
}
exports.Node = Node;
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
