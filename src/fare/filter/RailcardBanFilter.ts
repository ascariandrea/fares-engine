
import {Fare} from "../Fare";

/**
 * Filters fares based on the railcard bans
 */
export function railcardBanFilter(fare: Fare): boolean {
  return !fare.railcard.isBanned(fare.origin, fare.ticketType.code, fare.route.code);
}