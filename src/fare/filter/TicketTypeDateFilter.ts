import {Fare} from "../Fare";
import {LocalDate, LocalDateTime, LocalTime} from "js-joda";
import {FareFilter} from "./FareFilter";
import {AdvancePurchaseMap} from "../../tickettype/repository/AdvancePurchaseRepository";
import {AdvancePurchase, CheckType} from "../../tickettype/AdvancePurchase";

/**
 * Ensure that the travel date is between the start and end date
 */
export function ticketTypeDateFilter(fare: Fare, date: LocalDate): boolean {
  return !date.isBefore(fare.ticketType.startDate) && !date.isAfter(fare.ticketType.endDate);
}
