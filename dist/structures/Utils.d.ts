import { SearchResult, Snowflake } from "../Static/Interfaces";
/**
 * Internal Method to Resolve Search Result from nexus into Interface SearchResult
 * @param {Object} results Search results from the api.
 * @param {Snowflake} requestor The user who requested it.
 * @returns {SearchResult}
 * @private
 * @ignore
 */
export declare function resolveTracks(results: any, requestorID: Snowflake): SearchResult;
