import { Player } from "./Player";
import { Payload } from "../Static/Interfaces";
export declare enum ChiroEventErrorKind {
    Voice = "VOICE",
    Track = "TRACK",
    AudioPlayer = "AUDIO_PLAYER"
}
export declare class ChiroError extends Error {
    readonly content: string;
    name: string;
    /**
     * Creates an ChiroError instance.
     * @param {string} content The content of the error.
     */
    constructor(content: string);
}
export declare class ChiroEventError extends Error {
    readonly kind: ChiroEventErrorKind;
    payload: Payload;
    player: Player;
    /**
     * Creates a chiro event error instance for debugging.
     *
     * @param {ChiroEventError} kind The event error kind.
     * @param {Payload} payload The error payload received from the ws api.
     * @param {Player} player The player where the error was caught.
     */
    constructor(kind: ChiroEventErrorKind, payload: Payload, player: Player);
}
