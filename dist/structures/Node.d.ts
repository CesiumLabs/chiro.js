/// <reference types="node" />
import WebSocket from "ws";
import { Response } from "node-fetch";
import { Manager } from "./Manager";
import { Player } from "./Player";
import { NodeOptions, Payload, TrackData } from "../Static/Interfaces";
/**
 * The Node class which does the api management.
 */
export declare class Node {
    options: NodeOptions;
    /**
     * Websocket of the node.
     * @type {WebSocket}
     */
    socket: WebSocket | null;
    /**
     * The Manager of this node.
     * @type {Manager}
     */
    manager: Manager;
    /**
     * Static manager for this node.
     * @type {Manager}
     * @ignore
     * @private
     */
    private static _manager;
    /**
     * Reconnect Timeout.
     * @type {NodeJS.Timeout}
     * @ignore
     * @private
     */
    private reconnectTimeout?;
    /**
     * Number of reconnect attempts.
     * @type {number}
     * @ignore
     * @private
     */
    private reconnectAttempts;
    /**
     * The constructor for the node.
     *
     * @hideconstructor
     * @param {NodeOptions} options The options required for the Node.
     */
    constructor(options: NodeOptions);
    /**
     * Returns a boolean stating is the socket connected or not.
     *
     * @ignore
     * @returns {boolean}
     */
    get connected(): boolean;
    /**
     * Inititate the static manager for this node.
     *
     * @ignore
     * @param {Manager} manager Manager
     */
    static initStaticManager(manager: Manager): void;
    /**
     * Creates a WS connection with the Websocket API.
     * @ignore
     */
    connect(): void;
    /**
     * Destroys the Node and all players connected with it.
     */
    destroy(): void;
    /**
     * Make a request to the Nexus Api.
     *
     * @param {string} method The type of api request to be done.
     * @param {string} path The api url's path.
     * @param {Object} body The body of the request.
     * @returns {Promise<Response>}
     */
    makeRequest(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, body?: Record<string, unknown>): Promise<Response>;
    /**
     * Reconnect in to the Websocket if the connection fails.
     *
     * @hidden
     * @ignore
     * @private
     */
    private reconnect;
    /**
     * Open event for the websocket api.
     *
     * @protected
     * @ignore
     */
    protected open(): void;
    /**
     * Close event for the websocket api.
     *
     * @param {number} code Close code from the ws api.
     * @param {string} reason Reason for the closinf the ws connection.
     * @protected
     * @ignore
     */
    protected close(code: number, reason: string): void;
    /**
     * Error event for the websocket api.
     *
     * @param {Error} error Error from the socket.
     * @protected
     * @ignore
     */
    protected error(error: Error): void;
    /**
     * Message event from the websocket api.
     *
     * @param {Buffer | string} d Data Buffer from the api.
     * @protected
     * @ignore
     */
    protected message(d: Buffer | string): void;
    /**
     * Handle all kind of track events.
     *
     * @param {Payload} payload Payload from the websocket api.
     * @protected
     * @ignore
     */
    protected handleTrackEvent(payload: Payload): void;
    /**
     * Emit event for the TRACK_END event.
     *
     * @param {Player} player The player.
     * @param {TrackData} track The data of the track.
     * @param {Payload} payload The payload from the ws api.
     * @protected
     * @ignore
     */
    protected trackEnd(player: Player, track: TrackData, payload: Payload): void | Promise<unknown>;
    /**
     * Emits the `queueEnd` event in the Manager.
     *
     * @param {Player} player The player.
     * @param {Payload} payload The payload sent by the ws api.
     * @protected
     * @ignore
     */
    protected queueEnd(player: Player, payload: Payload): void;
    /**
     * Update the player's data.
     *
     * @param player The player.
     * @param payload The payload data to be sent while updating.
     * @protected
     */
    protected updatePlayerData(player: Player, payload: Payload): void;
    /**
     * Send payload data to the nexus using ws.
     *
     * @param {Object} data Payload to send to WS
     * @returns {Promise<boolean>}
     * @example
     * const payload = {"op": 10, d: null}
     * <Player>.node.send(payload)
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
