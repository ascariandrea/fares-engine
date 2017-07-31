import {CRS} from "..//location/Location";
import memoize = require("memoized-class-decorator");

/**
 * Five digit route code e.g. 00215
 */
export type RouteCode = string;

/**
 * Each fare has a route of travel upon which it is valid. Being valid on a route does not necessarily mean the fare
 * is valid as other restrictions (see @class Restriction) may apply. Routes must also still be valid routes according
 * to the National Routing Guide. For example an Any Permitted route does not mean you can go via any station in the
 * country, just that there are no specific restrictions on that route.
 *
 * A route may dictate that you go via or not via a particular station.
 */
export default class Route {

  constructor(
    public readonly code: RouteCode,
    public readonly name: string,
    public readonly included: CRS[],
    public readonly excluded: CRS[]
  ) {}

  /**
   * Get the URI for this route
   */
  @memoize
  public get id(): string {
    return `/route/${this.code}`;
  }

  /**
   * Returns true if the route is 00000
   */
  @memoize
  public get isAnyPermitted(): boolean {
    return this.code === "00000"
  }

}