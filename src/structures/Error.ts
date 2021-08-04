import { Player } from "./Player";
import { Payload } from "../Static/Interfaces";

// The error kind of the ChiroEventError.
export enum ChiroEventErrorKind {
    Voice = "VOICE",
    Track = "TRACK",
    AudioPlayer = "AUDIO_PLAYER",
    Node = "NODE"
}

// The common error instance for Chiro.js library.
export class ChiroError extends Error {

    name = "ChiroError";

    /**
     * Creates an ChiroError instance.
     * @param {string} content The content of the error.
     */
    constructor(public readonly content: string) {
        super(content);
    }

}

// The error instance which contains the event information.
export class ChiroEventError extends Error {

    /**
     * Creates a chiro event error instance for debugging.
     * 
     * @param {ChiroEventError} kind The event error kind.
     * @param {Payload | Error} error The error payload received from the ws api.
     * @param {Player} player The player where the error was caught.
     */
    constructor(
        public readonly kind: ChiroEventErrorKind,
        public error: Payload | Error,
        public player?: Player
    ) {
        super(`[${kind}]: ${error}`);
    }

}