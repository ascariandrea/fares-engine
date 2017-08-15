
import {FareFilter} from "./FareFilter";
import {CalendarRestrictionMap} from "../../restriction/repository/RestrictionRepository";
import {Fare} from "../Fare";
import {LocalDate} from "js-joda";

/**
 * FareFilter that removes any fares with a CalendarRestriction
 */
export function calendarRestrictionFilter(calendarRestrictions: CalendarRestrictionMap): FareFilter {

  /**
   * Return true if there is a calendar restriction set for the ticket type and it applies on the relevant date
   */
  return (fare: Fare, date: LocalDate) =>
    !(calendarRestrictions[fare.ticketType.code] && calendarRestrictions[fare.ticketType.code].matches(date, fare));

}