import { SearchResult, TrackData } from "../Static/Interfaces";
import { User } from "discord.js";

/**
 * Internal Method to Resolve Search Result from nexus into Interface SearchResult
 * @param {Object} results Search results from the api.
 * @param {User} requester The user who requested it.
 * @returns {SearchResult}
 * @private
 * @ignore
 */
export function resolveTracks(results: any, requester: User): SearchResult {
    if (!results.results.length) return {
        type: "NO_RESULT",
        tracks: [],
        requester: requester,
    };
    
    return (results.identifier === "ytsearch" ||  results.identifier == "scsearch") ?
        { type: "SEARCH_RESULT", tracks: results.results, requester } : 
        {
            type: "PLAYLIST",
            playlist: {
                title: results.results[0].title,
                id: results.results[0].id,
                url: results.results[0].url,
                author: results.results[0].author,
                extractor: results.results[0].extractor,
            },
            tracks: results.results[0].tracks.map((track: TrackData) => encapsulateTrackData(track, requester)),
            requester
        }
}

/**
 * @ignore
 * @description Internal method to encapsulate Track Data received from Nexus into {TrackData}
 * @param {TrackData} data The Track details received from Nexus.
 * @param {User} requester The person who requested it.
 * @returns {TrackData}
 * @private
 */
function encapsulateTrackData(Track: TrackData, requester: User): TrackData {
    return {
        url: Track.url,
        title: Track.title,
        thumbnail: Track.thumbnail,
        duration: Track.duration,
        author: Track.author,
        created_at: Track.created_at,
        extractor: Track.extractor,
        requested_by: requester,
        stream_time: 0,
    };
}
