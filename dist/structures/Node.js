"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
const ws_1 = __importDefault(require("ws"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const Error_1 = require("./Error");
const Constants_1 = require("../Static/Constants");
function generateRandomPassword() {
    const characters = 'abcdefghijklmnopqrstuvwxyz123456789';
    let password = '';
    for (let i = 0; i < 22; i++)
        password += characters[Math.floor(Math.random() * characters.length)];
    return password;
}
/**
 * The Node class which does the api management.
 */
class Node {
    /**
     * The constructor for the node.
     *
     * @hideconstructor
     * @param {NodeOptions} options The options required for the Node.
     */
    constructor(options) {
        this.options = options;
        /**
         * Websocket of the node.
         * @type {WebSocket}
         */
        this.socket = null;
        /**
         * Number of reconnect attempts.
         * @type {number}
         * @ignore
         * @private
         */
        this.reconnectAttempts = 1;
        if (!Node._manager)
            throw new Error_1.ChiroError("Static manager has not been initiated yet for Node.");
        this.manager = Node._manager;
        if (this.manager.node)
            return this.manager.node;
        this.options = Object.assign({ port: 3000, password: generateRandomPassword(), secure: false, retryAmount: 5, retryDelay: 30e3 }, options);
        this.manager.node = this;
        this.manager.emit("nodeCreate", this);
    }
    /**
     * Returns a boolean stating is the socket connected or not.
     *
     * @ignore
     * @returns {boolean}
     */
    get connected() {
        return this.socket ? this.socket.readyState === ws_1.default.OPEN : false;
    }
    /**
     * Inititate the static manager for this node.
     *
     * @ignore
     * @param {Manager} manager Manager
     */
    static initStaticManager(manager) {
        this._manager = manager;
    }
    /**
     * Creates a WS connection with the Websocket API.
     * @ignore
     */
    connect() {
        if (this.connected)
            return;
        const headers = {
            Authorization: this.options.password,
            "client-id": this.manager.options.clientID,
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
        this.manager.players.forEach(p => {
            if (p.node == this)
                p.destroy();
        });
        this.socket.close(1000, "destroy");
        this.socket.removeAllListeners();
        this.socket = null;
        this.reconnectAttempts = 1;
        clearTimeout(this.reconnectTimeout);
        this.manager.emit("nodeDisconnect", this);
        this.manager.destroyNode();
    }
    /**
     * Make a request to the Nexus Api.
     *
     * @param {string} method The type of api request to be done.
     * @param {string} path The api url's path.
     * @param {Object} body The body of the request.
     * @returns {Promise<Response>}
     */
    makeRequest(method, path, body) {
        const url = `http${this.options.secure ? "s" : ""}://${this.options.host}:${this.options.port}/${path}`;
        return node_fetch_1.default(url, {
            method,
            body: JSON.stringify(body || {}),
            headers: {
                Authorization: this.manager.accessToken,
                "Content-Type": "application/json",
            },
        });
    }
    /**
     * Reconnect in to the Websocket if the connection fails.
     *
     * @hidden
     * @ignore
     * @private
     */
    reconnect() {
        if (!this.socket)
            return;
        this.reconnectTimeout = setTimeout(() => {
            if (this.reconnectAttempts >= this.options.retryAmount) {
                this.manager.emit("nodeError", this, new Error(`Unable to connect after ${this.options.retryAmount} attempts.`));
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
     * Open event for the websocket api.
     *
     * @protected
     * @ignore
     */
    open() {
        if (this.reconnectTimeout)
            clearTimeout(this.reconnectTimeout);
        this.manager.emit("nodeConnect", this);
    }
    /**
     * Close event for the websocket api.
     *
     * @param {number} code Close code from the ws api.
     * @param {string} reason Reason for the closinf the ws connection.
     * @protected
     * @ignore
     */
    close(code, reason) {
        this.manager.emit("nodeDisconnect", this, { code, reason });
        if (code !== 1000 || reason !== "destroy")
            this.reconnect();
    }
    /**
     * Error event for the websocket api.
     *
     * @param {Error} error Error from the socket.
     * @protected
     * @ignore
     */
    error(error) {
        if (!error)
            return;
        this.manager.emit("nodeError", this, error);
    }
    /**
     * Message event from the websocket api.
     *
     * @param {Buffer | string} d Data Buffer from the api.
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
                // @ts-ignore
                case Constants_1.WSOpCodes.HELLO:
                    this.manager.emit("nodeHello", this);
                    this.socket.send(JSON.stringify({ op: Constants_1.WSOpCodes.IDENTIFY }));
                    break;
                case Constants_1.WSOpCodes.VOICE_STATE_UPDATE:
                    this.manager.options.send(payload.d.d.guild_id, payload.d);
                    break;
                default:
                    this.manager.emit("nodeUnknownEvent", payload);
            }
        }
        if (payload.t !== undefined) {
            const player = this.manager.players.get(payload.d.guild_id);
            switch (payload.t) {
                case Constants_1.WSEvents.READY:
                    this.manager.accessToken = payload.d.access_token;
                    this.manager.emit("ready", payload);
                    break;
                case Constants_1.WSEvents.VOICE_CONNECTION_READY:
                    player.state = "connected";
                    if (player)
                        this.manager.emit("voiceReady", player, payload);
                    break;
                case Constants_1.WSEvents.VOICE_CONNECTION_ERROR:
                    this.manager.emit("error", new Error_1.ChiroEventError(Error_1.ChiroEventErrorKind.Voice, payload, player));
                    break;
                case Constants_1.WSEvents.VOICE_CONNECTION_DISCONNECT:
                    player.state = "disconnected";
                    if (player)
                        this.manager.emit("voiceDisconnect", player);
                    player.queue.clear();
                    break;
                case Constants_1.WSEvents.AUDIO_PLAYER_ERROR:
                    this.manager.emit("error", new Error_1.ChiroEventError(Error_1.ChiroEventErrorKind.AudioPlayer, payload, player));
                    break;
                case Constants_1.WSEvents.AUDIO_PLAYER_STATUS:
                    // TODO(Scientific-Guy): Remove this clg please.
                    console.log(payload);
                default:
                    // The only events left are track events.
                    this.handleTrackEvent(payload);
            }
        }
    }
    /**
     * Handle all kind of track events.
     *
     * @param {Payload} payload Payload from the websocket api.
     * @protected
     * @ignore
     */
    handleTrackEvent(payload) {
        const player = this.manager.players.get(payload.d.guild_id);
        if (!player)
            return;
        const track = player.queue.current;
        switch (payload.t) {
            case Constants_1.WSEvents.TRACK_START:
                player.playing = true;
                this.manager.emit("trackStart", player, track, payload);
                break;
            case Constants_1.WSEvents.QUEUE_END:
                this.trackEnd(player, track, payload);
                break;
            case Constants_1.WSEvents.TRACK_ERROR:
                this.manager.emit("error", new Error_1.ChiroEventError(Error_1.ChiroEventErrorKind.Track, payload, player));
                this.trackEnd(player, track, payload);
                break;
            default:
                this.manager.emit("nodeUnknownEvent", payload);
        }
    }
    /**
     * Emit event for the TRACK_END event.
     *
     * @param {Player} player The player.
     * @param {TrackData} track The data of the track.
     * @param {Payload} payload The payload from the ws api.
     * @protected
     * @ignore
     */
    trackEnd(player, track, payload) {
        if (!player.queue.length)
            return this.queueEnd(player, payload);
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
     *
     * @param {Player} player The player.
     * @param {Payload} payload The payload sent by the ws api.
     * @protected
     * @ignore
     */
    queueEnd(player, payload) {
        this.manager.emit("queueEnd", player, payload);
    }
    /**
     * Update the player's data.
     *
     * @param player The player.
     * @param payload The payload data to be sent while updating.
     * @protected
     */
    updatePlayerData(player, payload) {
        player.playing = !payload.d.paused;
        player.volume = payload.d.volume;
        player.queue.current.streamTime = payload.d.stream_time;
    }
    /**
     * Send payload data to the nexus using ws.
     *
     * @param {Object} data Payload to send to WS
     * @returns {Promise<boolean>}
     * @example
     * const payload = {"op": 10, d: null}
     * <Player>.node.send(payload)
     */
    send(data) {
        return new Promise((resolve, reject) => {
            const stringified = JSON.stringify(data);
            if (!this.connected)
                return resolve(false);
            if (!data || !stringified.startsWith("{"))
                return reject(new Error('Improper data sent to send in the WS.'));
            this.socket.send(stringified, error => error ? reject(error) : resolve(true));
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
 * @param {string} identifier IDentifier for nexus
 * @param {number} [retryAmount] Retry Amount
 * @param {number} [retryDelay] Retry Delay
 * @param {number} [requestTimeout] Request Timeout
 */
