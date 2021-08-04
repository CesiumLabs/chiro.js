import { SearchResult, TrackData, Snowflake } from "../static/Interfaces";

/**
 * Utility methods holder
 */
export default class Util {
    private constructor() {}

    /**
     * Internal Method to Resolve Search Result from nexus into Interface SearchResult
     * @param {Object} results Search results from the api.
     * @param {Snowflake} requestor The user who requested it.
     * @returns {SearchResult}
     */
    public static resolveTracks(results: any, requestorID: Snowflake): SearchResult {
        if (!results.results.length) return { type: "NO_RESULT", tracks: [], requestorID };

        return results.identifier === "ytsearch" || results.identifier == "scsearch"
            ? { type: "SEARCH_RESULT", tracks: results.results, requestorID }
            : {
                  type: "PLAYLIST",
                  playlist: {
                      title: results.results[0].title,
                      id: results.results[0].id,
                      url: results.results[0].url,
                      author: results.results[0].author,
                      extractor: results.results[0].extractor
                  },
                  tracks: results.results[0].tracks.map((track: TrackData) => Util.encapsulateTrackData(track, requestorID)),
                  requestorID
              };
    }

    /**
     * Internal method to encapsulate Track Data received from Nexus into {TrackData}
     * @param {TrackData} data The Track details received from Nexus.
     * @param {Snowflake} requestor The id of the person who requested it.
     * @returns {TrackData}
     */
    public static encapsulateTrackData(Track: TrackData, requestor: Snowflake): TrackData {
        return {
            url: Track.url,
            title: Track.title,
            thumbnail: Track.thumbnail,
            duration: Track.duration,
            author: Track.author,
            created_at: Track.created_at,
            extractor: Track.extractor,
            requestorID: requestor,
            streamTime: 0
        };
    }
}
