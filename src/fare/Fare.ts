
import Route from "../route/Route";
import {TicketType} from "../tickettype/TicketType";
import {Option} from "ts-option";
import {Restriction} from "../restriction/Restriction";
import memoize = require("memoized-class-decorator");
import {StatusCode} from "../passenger/Status";
import Railcard from "../passenger/Railcard";
import {Location} from "../location/Location";

/**
 * A fare is a conceptual price for a ticket. Whereas a ticket will have concrete dates and validity a fare
 * is purely conceptual so will have a validity period as a duration rather than specific dates.
 *
 * The fare is typically a unique construct of ticket type, origin, destination, route and status code although there
 * is some debate as to whether the xLondon marker is included.
 */
export class Fare {

  constructor(
    public readonly origin: Location,
    public readonly destination: Location,
    public readonly route: Route,
    public readonly ticketType: TicketType,
    public readonly statusCode: StatusCode,
    public readonly price: Price,
    public readonly railcard: Railcard,
    public readonly restriction: Option<Restriction>,
    public readonly fareSetter: Option<Operator>,
    public readonly xLondon: number
  ) { }

  /**
   * Generate an ID for the fare
   */
  @memoize
  public get id(): string {
    return "/fare/" + [
      this.origin.nlc,
      this.destination.nlc,
      this.route.code,
      this.ticketType.code,
      this.statusCode,
      this.restriction.map(r => r.code).orNull
    ].join("-");
  }

}

/**
 * Monetary value in pence
 */
export type Price = number;

/**
 * Fares indexed by ID (origin, destination, route, ticket type, status and restriction
 */
export type FareMap = {
  [fareIndex: string]: Fare
};

/**
 * 2 character operator code
 */
export type Operator = string;
