
import {Fare} from "./Fare";
import memoize = require("memoized-class-decorator");
import {Railcard} from "../passenger/Railcard";

/**
 * A FareOption is a group of fares that satisfies a passenger sets requirement to travel.
 */
export class FareOption {

  constructor(
    public readonly fares: FareUse[]
  ) { }

  @memoize
  get totalPrice(): number {
    return this.fares.reduce((total, fareUse) => total + fareUse.fare.price, 0);
  }

  @memoize
  get id(): string {
    return this.fares.reduce((id, fareUse) => id + fareUse.fare.id, "/fare-option");
  }

}

/**
 * An individual ticket. Usually covers a single passengers travel but some tickets can have multiple passengers
 */
export class FareUse {

  constructor(
    public readonly adults: number,
    public readonly children: number,
    public readonly railcard: Railcard,
    public readonly fare: Fare
  ) { }

}