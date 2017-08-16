import {Fare} from "../Fare";
import {LocalDate, LocalDateTime, LocalTime} from "js-joda";
import {FareFilter} from "./FareFilter";
import {AdvancePurchaseMap} from "../../tickettype/repository/AdvancePurchaseRepository";
import {AdvancePurchase, CheckType} from "../../tickettype/AdvancePurchase";

/**
 * Ensure that the Advance Purchase booking horizon has been met
 */
export function advancePurchaseFilter(apData: AdvancePurchaseMap): FareFilter {

  /**
   * If there is no AP data or none of the AP rules apply then it's valid
   */
  return (fare: Fare, date: LocalDate): boolean => {
    const currentTime = LocalDateTime.now();

    return (
      !apData[fare.ticketType.code] ||
      apData[fare.ticketType.code].every(ap => isValid(ap, date, currentTime, fare))
    );
  }
}

/**
 * Returns true if the AP booking horizon has been met
 */
function isValid(ap: AdvancePurchase, date: LocalDate, now: LocalDateTime, fare: Fare): boolean {
  const fareRestrictionCode = fare.restriction.map(r => r.code).orNull;
  const codeMatches = ap.restrictionCode.map(c => c === fareRestrictionCode).getOrElse(true);

  if (!codeMatches) {
    return true;
  }

  switch (ap.checkType) {
    case CheckType.Hours:
      return now.plusHours(ap.apData).isBefore(date.atStartOfDay());
    case CheckType.Days:
      return now.plusDays(ap.apData).isBefore(date.atTime(ap.bookingTime.getOrElse(LocalTime.parse("00:00"))));
    default:
      throw Error(`Unknown AP check type: ${ap.checkType}`);
  }
}