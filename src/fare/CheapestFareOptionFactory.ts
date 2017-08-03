
import {Fare} from "./Fare";
import {none, Option, some} from "ts-option";
import {PassengerSet} from "../passenger/PassengerSet";
import {Railcard} from "../passenger/Railcard";
import {Status} from "../passenger/Status";
import {RailcardMap} from "../passenger/repository/RailcardRepository";
import {FareOption, FareUse} from "./FareOption";

/**
 * One trick pony that creates FareOptions
 */
export class CheapestFareOptionFactory {

  /**
   * This function creates a "best guess" cheapest FareOption from the given list of fares by attempting to apply
   * any railcards the passenger set possess to the highest value passengers (adults) cheapest fares.
   */
  public static getFareOption(fares: SortedFareList, passengerSet: PassengerSet): Option<FareOption> {
    const [adultFares, childFares] = splitFaresByPassengerType(fares, passengerSet.railcardsByCode);
    const fareOption = new MutableFareOption(passengerSet);

    for (const adultFare of adultFares) {
      while (fareOption.adultsRemaining && fareOption.enoughPassengersForFare(adultFare) && fareOption.enoughPassengersForRailcard(adultFare.railcard)) {
        fareOption.addAdultFare(adultFare, childFares);
      }

      if (!fareOption.adultsRemaining) { break; }
    }

    for (const childFare of childFares) {
      while (fareOption.childrenRemaining && fareOption.enoughPassengersForFare(childFare) && fareOption.enoughPassengersForRailcard(childFare.railcard)) {
        fareOption.addChildFare(childFare);
      }

      if (!fareOption.childrenRemaining) { break; }
    }

    if (fareOption.adultsRemaining || fareOption.childrenRemaining) {
      return none;
    }

    return some(fareOption.toOption());
  }

}

/**
 * Fares sorted by price
 */
export type SortedFareList = Fare[];

/**
 * A mutable FareOption used to store state when calculating the cheapest fare option
 */
class MutableFareOption {

  private remainingAdults: number;
  private remainingChildren: number;
  private railcardUses: RailcardUseMap;
  private fares: FareUse[];
  private passengerSet: PassengerSet;

  constructor(passengerSet: PassengerSet) {
    this.passengerSet = passengerSet;
    this.remainingAdults = passengerSet.numAdults;
    this.remainingChildren = passengerSet.numChildren;
    this.fares = [];

    this.railcardUses = passengerSet.railcards.reduce((count, railcard) => {
      count[railcard.code] = (count[railcard.code] || 0) + 1;

      return count;
    }, {});
  }

  get adultsRemaining(): boolean {
    return this.remainingAdults > 0;
  }

  get childrenRemaining(): boolean {
    return this.remainingChildren > 0;
  }

  /**
   * Are there enough adults and children left to use the given fare
   */
  public enoughPassengersForFare(fare: Fare): boolean {
    return this.remainingAdults >= fare.ticketType.minAdults
        && this.remainingChildren >= fare.ticketType.minChildren;
  }

  /**
   * Are there enough railcards uses, adults and children left to use the given railcard
   */
  public enoughPassengersForRailcard(railcard: Railcard): boolean {
    return this.railcardUses[railcard.code] > 0
        && this.remainingAdults >= railcard.minAdults
        && this.remainingChildren >= railcard.minChildren;
  }

  /**
   * Add as many of the given fare as possible up to the maximum number that can fit on the given railcard.
   *
   * For example if it's a single passenger fare (one adult) and a railcard that can have two adults, two fares
   * will be added even there are more adults remaining.
   *
   * Child fares must also be passed as some railcards require children, therefore we need to add child fares before
   * discarding the railcard.
   */
  public addAdultFare(fare: Fare, childFares: SortedFareList): void {
    const numAdultsAvailable = Math.min(this.remainingAdults, fare.railcard.maxAdults);
    const numFares = Math.floor(numAdultsAvailable / fare.ticketType.maxAdults);
    const numAdultsApplied = numFares * fare.ticketType.maxAdults;
    const numChildrenApplied = Math.max(0, Math.min(
      this.remainingChildren,
      fare.railcard.maxChildren,
      fare.railcard.maxPassengers - numAdultsApplied,
      numFares * fare.ticketType.maxChildren,
      numFares * (fare.ticketType.maxPassengers - fare.ticketType.maxAdults)
    ));

    const fareUse = new FareUse(numAdultsApplied / numFares, numChildrenApplied / numFares, fare.railcard, fare);

    // add the fares, subtract the applied adults, children and railcards
    this.fares = this.fares.concat(new Array(numFares).fill(fareUse));
    this.remainingAdults -= numAdultsApplied;
    this.remainingChildren -= numChildrenApplied;
    this.railcardUses[fare.railcard.code] -= fare.railcard.isPublicRailcard ? 0 : 1;

    // if the railcard we've used can also have children on it add some child fares as well (as it will be consumed)
    // if the cheapest child fare also uses this railcard put as many on as we can, otherwise as few as possible
    // so they can get the better fare
    const numChildrenToApply = childFares[0] && childFares[0].railcard.code !== fare.railcard.code
      ? fare.railcard.minChildren
      : Math.min(this.remainingChildren, fare.railcard.maxChildren, fare.railcard.maxPassengers - numAdultsApplied);

    if (numChildrenToApply > 0) {
      const childStatus = fare.railcard.childStatus.getOrElse(Status.CHILD_STATUS_CODE);
      const childFare = childFares.find(f => f.statusCode === childStatus);

      // todo find a way to not throw up
      if (!childFare) {
        throw new Error("Could not find matching child for fare " + fare.id);
      }

      const childFareUse = new FareUse(0, 1, fare.railcard, childFare);

      this.fares = this.fares.concat(new Array(numChildrenToApply).fill(childFareUse));
      this.remainingChildren -= numChildrenToApply;
    }
  }

  /**
   * The application of child fares are simpler as there are a number of assumptions we can make:
   *
   * - any railcards requiring adults have already been used
   * - all adults have fares
   * - there are not any multi-passenger tickets for children (not sure about that)
   */
  public addChildFare(fare: Fare) {
    const numChildrenToApply = Math.min(this.remainingChildren, fare.railcard.maxChildren);
    const fareUse = new FareUse(0, 1, fare.railcard, fare);

    this.fares = this.fares.concat(new Array(numChildrenToApply).fill(fareUse));
    this.remainingChildren -= numChildrenToApply;
    this.railcardUses[fare.railcard.code] -= fare.railcard.isPublicRailcard ? 0 : 1;
  }

  /**
   * Convert to an immutable FareOption
   */
  public toOption(): FareOption {
    return new FareOption(this.fares);
  }
}

/**
 * Store how many uses of each type of railcard there are
 */
type RailcardUseMap = {
  [railcardCode: string]: number;
}

/**
 * Partition the adult and child fares
 */
function splitFaresByPassengerType(fares: SortedFareList, railcards: RailcardMap): [SortedFareList, SortedFareList] {
  const adultFares: SortedFareList = [];
  const childFares: SortedFareList = [];

  for (const fare of fares) {
    if (railcards[fare.railcard.code].adultStatus.orNull === fare.statusCode) {
      adultFares.push(fare);
    }
    else {
      childFares.push(fare);
    }
  }

  return [adultFares, childFares];
}

