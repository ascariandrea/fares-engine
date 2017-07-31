import {LocalDate} from "js-joda";
import {Option} from "ts-option";
import {PassengerSet} from "../../passenger/PassengerSet";
import {TicketType} from "../../tickettype/TicketType";
import {Location} from "../../location/Location";

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
    private readonly firstClass: boolean,
    private readonly standardClass: boolean,
    private readonly singles: boolean,
    private readonly returns: boolean,
    private readonly advance: boolean,
  ) { }

  /**
   * Returns true if non of the passenger sets fare preferences restrict the ticket type
   */
  public isValid(ticketType: TicketType): boolean {
    return !(
      (!this.firstClass && ticketType.isFirstClass) ||
      (!this.standardClass && !ticketType.isFirstClass) ||
      (!this.returns && ticketType.isReturn) ||
      (!this.singles && !ticketType.isReturn) ||
      (!this.advance && ticketType.isAdvance)
    )
  }

}