
import {Option} from "ts-option";
import memoize = require("memoized-class-decorator");

/**
 * Code for a physical station e.g. CHX
 */
export type CRS = string;

/**
 * Code for a location (group stations, physical stations and clusters)
 */
export type NLC = string;

/**
 * The location class stores all the groups and clusters a given location belongs to
 */
export class Location {

  constructor(
    public readonly nlc: NLC,
    public readonly crs: Option<CRS>,
    public readonly clusters: ClusterMap,
    public readonly allStations: NLC[]
  ) { }

  @memoize
  get allStationsJoined(): string {
    return this.allStations.join("','");
  }

}

export type ClusterMap = {
  [nlc: string]: NLC;
}