
import {FarePreferences} from "../../service/api/FareRequest";
import {Fare} from "../Fare";
import {LocalDate} from "js-joda";

/**
 * Returns true if non of the passenger sets fare preferences restrict the ticket type
 */
export function farePreferencesFilter(fare: Fare, date: LocalDate, preferences: FarePreferences): boolean {
  return !(
    (!preferences.firstClass    && fare.ticketType.isFirstClass)  ||
    (!preferences.standardClass && !fare.ticketType.isFirstClass) ||
    (!preferences.returns       && fare.ticketType.isReturn)      ||
    (!preferences.singles       && !fare.ticketType.isReturn)     ||
    (!preferences.advance       && fare.ticketType.isAdvance)
  );
}