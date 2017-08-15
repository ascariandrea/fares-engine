
import {Fare} from "../Fare";

/**
 * Removes suppressed fares (fares with a 0 price)
 */
export function suppressedFareFilter(fare: Fare): boolean {
  return fare.price !== 0;
}
