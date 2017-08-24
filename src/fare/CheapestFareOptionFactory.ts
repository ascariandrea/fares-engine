
import {Fare} from "./Fare";
import {none, Option, some} from "ts-option";
import {PassengerSet} from "../passenger/PassengerSet";
import {Railcard} from "../passenger/Railcard";
import {RailcardMap} from "../passenger/repository/RailcardRepository";
import {FareOption, FareUse} from "./FareOption";
import {TicketCode} from "../tickettype/TicketType";

/**
 * One trick pony that creates FareOptions
 */
export class CheapestFareOptionFactory {

  /**
   * This function creates a "best guess" cheapest FareOption from the given list of fares by attempting to apply
   * any railcards the passenger set possess to the highest value passengers (adults) cheapest fares.
   */
  public static getFareOption(fares: SortedFareList,
                              passengerSet: PassengerSet,
                              availability: FareAvailability): Option<FareOption> {

    const [adultFares, childFares] = splitFaresByPassengerType(fares, passengerSet.railcardsByCode);
    const fareOption = new MutableFareOption(passengerSet, availability);

    for (const adultFare of adultFares) {
      while (fareOption.adultsRemaining && fareOption.canUseFare(adultFare)) {
        fareOption.addAdultFare(adultFare, childFares);
      }

      if (!fareOption.adultsRemaining) { break; }
    }

    for (const childFare of childFares) {
      while (fareOption.childrenRemaining && fareOption.canUseFare(childFare)) {
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
  private availability: FareAvailability;

  constructor(passengerSet: PassengerSet, availability: FareAvailability) {
    this.passengerSet = passengerSet;
    this.remainingAdults = passengerSet.numAdults;
    this.remainingChildren = passengerSet.numChildren;
    this.availability = Object.assign({}, availability); // take a copy as we mutate
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
   * Check if there are enough passengers for the fare, there is availability for the fare and if the are enough
   * passengers for the railcard.
   */
  public canUseFare(fare: Fare): boolean {
    return this.enoughPassengersForFare(fare)
        && this.getAvailability(fare.ticketType.code) > 0
        && this.enoughPassengersForRailcard(fare.railcard);
  }

  /**
   * Are there enough adults and children left to use the given fare
   */
  private enoughPassengersForFare(fare: Fare): boolean {
    return this.remainingAdults >= fare.ticketType.minAdults
        && this.remainingChildren >= fare.ticketType.minChildren;
  }

  /**
   * Are there enough railcards uses, adults and children left to use the given railcard
   */
  private enoughPassengersForRailcard(railcard: Railcard): boolean {
    return this.railcardUses[railcard.code] > 0
        && this.remainingAdults >= railcard.minAdults
        && this.remainingChildren >= railcard.minChildren;
  }

  /**
   * Return the quantity of this fare that is available for use
   */
  private getAvailability(ticketCode: TicketCode): number {
    return this.availability[ticketCode] === undefined ? Number.MAX_SAFE_INTEGER : this.availability[ticketCode];
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
    const numFaresUsed = Math.min(
      this.getAvailability(fare.ticketType.code),
      Math.floor(numAdultsAvailable / fare.ticketType.maxAdults)
    );

    const numAdultsApplied = numFaresUsed * fare.ticketType.maxAdults;
    const numChildrenApplied = Math.max(0, Math.min(
      this.remainingChildren,
      fare.railcard.maxChildren,
      fare.railcard.maxPassengers - numAdultsApplied,
      numFaresUsed * fare.ticketType.maxChildren,
      numFaresUsed * (fare.ticketType.maxPassengers - fare.ticketType.maxAdults)
    ));

    const fareUse = new FareUse(numAdultsApplied / numFaresUsed, numChildrenApplied / numFaresUsed, fare);

    // add the fares, subtract the applied adults, children and railcards
    this.fares = this.fares.concat(new Array(numFaresUsed).fill(fareUse));
    this.remainingAdults -= numAdultsApplied;
    this.remainingChildren -= numChildrenApplied;
    this.railcardUses[fare.railcard.code] -= fare.railcard.isPublicRailcard ? 0 : 1;
    this.availability[fare.ticketType.code] = this.getAvailability(fare.ticketType.code) - numFaresUsed;

    // find the cheapest available child fare in case some children are required by the railcard
    const childFare = childFares.find(f => f.railcard === fare.railcard && this.getAvailability(f.ticketType.code) > 0);

    if (childFare) {
      // if the cheapest child fare uses the same railcard then add as many children as we can before discarding the railcard
      // if there is a cheaper alternative fare for children then add the minimum required by the railcard
      const cheapestUsesSameRailcard = childFares.find(f => this.getAvailability(f.ticketType.code) > 0) === childFare;
      const numChildrenToApply = Math.min(
        cheapestUsesSameRailcard ? fare.railcard.maxChildren : fare.railcard.minChildren,
        fare.railcard.maxPassengers - numAdultsApplied,
        this.remainingChildren,
        this.getAvailability(childFare.ticketType.code)
      );

      if (numChildrenToApply > 0) {
        this.addChildFares(childFare, numChildrenToApply);
      }
    }
  }

  /**
   * The application of child fares are simpler as there are a number of assumptions we can make:
   *
   * - any railcards requiring adults have already been used
   * - all adults have fares
   * - there are not any multi-passenger tickets for children alone (not sure about that)
   */
  public addChildFare(fare: Fare) {
    const numChildrenToApply = Math.min(
      this.remainingChildren,
      fare.railcard.maxChildren,
      this.getAvailability(fare.ticketType.code)
    );

    this.addChildFares(fare, numChildrenToApply);
    this.railcardUses[fare.railcard.code] -= fare.railcard.isPublicRailcard ? 0 : 1;
  }

  /**
   * Add the x number of the given child fare
   */
  private addChildFares(fare: Fare, quantity: number) {
    const fareUse = new FareUse(0, 1, fare);

    this.fares = this.fares.concat(new Array(quantity).fill(fareUse));
    this.remainingChildren -= quantity;
    this.availability[fare.ticketType.code] = this.getAvailability(fare.ticketType.code) - quantity;
  }


  /**
   * Convert to an immutable FareOption
   */
  public toOption(): FareOption {
    return new FareOption(this.fares);
  }
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

/**
 * Store how many uses of each type of railcard there are
 */
type RailcardUseMap = {
  [railcardCode: string]: number;
}

/**
 * Store how many of each ticket type there are
 */
export type FareAvailability = {
  [ticketTypeCode: string]: number;
}


