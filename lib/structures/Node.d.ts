/// <reference types="node" />
import { Manager } from "./Manager";
import { NodeOptions, Payload, TrackData } from "../Static/Interfaces";
import WebSocket from "ws";
import { Player } from "./Player";
/**
 * The Node Class
 */
export declare class Node {
    options: NodeOptions;
    /**
     * Websocket
     * @type {WebSocket}
     */
    socket: WebSocket | null;
    /**
     * The Manager
     * @type {Manager}
     */
    manager: Manager;
    /**
     * Static Manager
     * @type {Manager}
     * @ignore
     * @private
     */
    private static _manager;
    /**
     * Reconnect Timeout
     * @type {NodeJS.Timeout}
     * @ignore
     * @private
     */
    private reconnectTimeout?;
    /**
     * Reconnect Attempts
     * @type Number
     * @ignore
     * @private
     */
    private reconnectAttempts;
    /**
     * Check if socket is ready
     * @type {void}
     * @ignore
     * @return {boolean}
     */
    get connected(): boolean;
    /**
     * @ignore
     * @param {Manager} manager Manager
     */
    static init(manager: Manager): void;
    /**
     * Node Constructor
     * @hideconstructor
     * @param {NodeOptions} options Node Options
     */
    constructor(options: NodeOptions);
    /**
     * Creates a WS connection with Websocket
     * @ignore
     */
    connect(): void;
    /**
     * Destroys the Node and all players connected with it.
     */
    destroy(): void;
    /**
     * Make REST API Request to Nexus
     * @param {string} uriComponent URL Components to be added to base URL
     * @param {string} type Type of Call to make
     * @param {Object} body Body Object to send to REST API
     * @return {Promise}
     */
    makeRequest(uriComponent: string, type: "GET" | "POST" | "PATCH" | "DELETE", body?: any): Promise<any>;
    /**
     * Reconnect in case WS Connection fails
     * @hidden
     * @ignore
     * @private
     */
    private reconnect;
    /**
     * Emit Event called nodeConnect when socket is open
     * @protected
     * @ignore
     */
    protected open(): void;
    /**
     * Emit Event called nodeDisconnect when socket is closed
     * @param {number} code Close Code
     * @param {string} reason Reason
     * @protected
     * @ignore
     */
    protected close(code: number, reason: string): void;
    /**
     * Emit Event called nodeError when there is an error with socket connection
     * @param {Error} error Error
     * @protected
     * @ignore
     */
    protected error(error: Error): void;
    /**
     * Handles the WS connection message
     * @param {Buffer | string} d Data Buffer
     * @protected
     * @ignore
     */
    protected message(d: Buffer | string): void;
    /**
     * handle TrackEvents
     * @param {Payload} payload Payload
     * @protected
     * @ignore
     */
    protected handleTrackEvent(payload: Payload): void;
    /**
     * When Track Start emit the event trackstart
     * @param {Player} player Player
     * @param {TrackData} track Track
     * @param {Payload} payload payload
     * @protected
     * @ignore
     */
    protected trackStart(player: Player, track: TrackData, payload: Payload): void;
    /**
     * Emit event QueueEnd and TrackEnd
     * @param {Player} player Player
     * @param {TrackData} track Track
     * @param {Payload} payload Payload
     * @protected
     * @ignore
     */
    protected trackEnd(player: Player, track: TrackData, payload: Payload): void;
    /**
     * @param {Player} player Player
     * @param {Payload} payload Payload
     * @protected
     * @ignore
     */
    protected queueEnd(player: Player, payload: Payload): void;
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
    send(data: unknown): Promise<boolean>;
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
 */
