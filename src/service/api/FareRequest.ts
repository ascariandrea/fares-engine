import {LocalDate} from "js-joda";
import {Option} from "ts-option";
import {PassengerSet} from "../../passenger/PassengerSet";
import {TicketType} from "../../tickettype/TicketType";
import {Location} from "../../location/Location";
import {Fare} from "../../fare/Fare";

/**
 * Request for a fares capturing the origin, destination, dates and passenger set.
 */
export class FareRequest {

  constructor(
    public readonly origin: Location,
    public readonly destination: Location,
    public readonly outwardDate: LocalDate,
    public readonly returnDate: Option<LocalDate>,
    public readonly passengerSet: PassengerSet,
    public readonly farePreferences: FarePreferences
  ) { }

}

/**
 * This class filters fares based on the passenger sets fare preferences
 */
export class FarePreferences {

  constructor(
    public readonly firstClass: boolean,
    public readonly standardClass: boolean,
    public readonly singles: boolean,
    public readonly returns: boolean,
    public readonly advance: boolean,
  ) { }

}