
import Railcard from "./Railcard";
import Status from "./Status";
import {Fare} from "../fare/Fare";
import memoize = require("memoized-class-decorator");
import {RailcardMap} from "./repository/RailcardRepository";
import {groupBy, indexBy} from "..//util/array";

/**
 * A set of passengers and railcards they hold
 */
export default class PassengerSet {

  constructor(
    public readonly numAdults,
    public readonly numChildren,
    public readonly railcards: Railcard[]
  ) {}

  /**
   * Return all the Status discounts that apply to the given fare category for this passenger set.
   */
  @memoize
  public uniqueStatuses(fare: Fare): Map<Status, Railcard> {
    const statuses = new Map();
    const discountCategory = fare.ticketType.discountCategory;

    for (const railcard of this.railcards) {
      if (railcard.isBanned(fare.origin, fare.ticketType.code, fare.route.code)) continue;
      if (this.hasAdults && railcard.adultDiscounts[discountCategory]) statuses.set(railcard.adultDiscounts[discountCategory], railcard);
      if (this.hasChildren && railcard.childDiscounts[discountCategory]) statuses.set(railcard.childDiscounts[discountCategory], railcard);
    }

    //TODO ensure the ordering of railcards doesn't mean child status discount adds a railcard of YNG for example
    return statuses;
  }

  @memoize
  get hasAdults(): boolean {
    return this.numAdults > 0;
  }

  @memoize
  get hasChildren(): boolean {
    return this.numChildren > 0;
  }

  /**
   * returns true if the passenger set possess the given railcard
   */
  @memoize
  public hasRailcard(railcard: Railcard): boolean {
    return this.railcards.indexOf(railcard) > -1;
  }

  @memoize
  get railcardsByCode(): RailcardMap {
    return this.railcards.reduce(indexBy((railcard: Railcard) => railcard.code), {});
  }
}