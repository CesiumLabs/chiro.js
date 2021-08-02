import { SearchResult, TrackData } from "../Static/Interfaces";
import { User } from "discord.js";

/**
 * Internal Method to Resolve Search Result from nexus into Interface SearchResult
 * @param {Object} res search result
 * @param {User} requester user who searched
 * @return {SearchResult}
 * @private
 * @ignore
 */
export function ResolveTracks(res: any, requester: User) {
    if (!res.results.length) {
        const SearchResult: SearchResult = {
            type: "NO_RESULT",
            tracks: [],
            requester: requester,
        };
        return SearchResult;
    }
    if (res.identifier === "ytsearch" || "scsearch") {
        const SearchResult: SearchResult = {
            type: "SEARCH_RESULT",
            tracks: res.results,
            requester: requester,
        };
        return SearchResult;
    } else {
        const SearchResult: SearchResult = {
            type: "PLAYLIST",
            playlist: {
                title: res.results[0].title,
                id: res.results[0].id,
                url: res.results[0].url,
                author: res.results[0].author,
                extractor: res.results[0].extractor,
            },
            tracks: res.results[0].tracks.map((track: TrackData) =>
                EncapsulateTrackData(track, requester)
            ),
            requester: requester,
        };
        return SearchResult;
    }
}

/**
 * @ignore
 * @description Internal method to encapsulate Track Data received from Nexus into {TrackData}
 * @param {TrackData} data The Track details received from Nexus
 * @param {User} requester The person who requested it
 * @return {TrackData}
 * @private
 */
function EncapsulateTrackData(Track: TrackData, requester: User) {
    const track: TrackData = {
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
    return track;
}
