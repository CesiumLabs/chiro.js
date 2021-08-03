"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChiroEventError = exports.ChiroError = exports.ChiroEventErrorKind = void 0;
// The error kind of the ChiroEventError.
var ChiroEventErrorKind;
(function (ChiroEventErrorKind) {
    ChiroEventErrorKind["Voice"] = "VOICE";
    ChiroEventErrorKind["Track"] = "TRACK";
    ChiroEventErrorKind["AudioPlayer"] = "AUDIO_PLAYER";
})(ChiroEventErrorKind = exports.ChiroEventErrorKind || (exports.ChiroEventErrorKind = {}));
// The common error instance for Chiro.js library.
class ChiroError extends Error {
    /**
     * Creates an ChiroError instance.
     * @param {string} content The content of the error.
     */
    constructor(content) {
        super(content);
        this.content = content;
        this.name = "ChiroError";
    }
}
exports.ChiroError = ChiroError;
// The error instance which contains the event information.
class ChiroEventError extends Error {
    /**
     * Creates a chiro event error instance for debugging.
     *
     * @param {ChiroEventError} kind The event error kind.
     * @param {Payload} payload The error payload received from the ws api.
     * @param {Player} player The player where the error was caught.
     */
    constructor(kind, payload, player) {
        super(`[${kind}]: ${payload}`);
        this.kind = kind;
        this.payload = payload;
        this.player = player;
    }
}
exports.ChiroEventError = ChiroEventError;
