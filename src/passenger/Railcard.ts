
import {StatusCode, StatusMap} from "./Status";
import {Option, option} from "ts-option";
import {Restriction} from "../restriction/Restriction";
import {TicketCode} from "../tickettype/TicketType";
import {RouteCode} from "../route/Route";
import {Price} from "../fare/Fare";
import {LocalDate} from "js-joda";
import {CRS, Location} from "../location/Location";
import memoize = require("memoized-class-decorator");
import {NLC} from "../index";


/**
 * A railcard is a type of status discount that can be applied to a fare to reduce the price.
 */
export class Railcard {

  static readonly PUBLIC_RAILCARD_CODE = "";
  static readonly GROUPSAVE_RAILCARD_CODE = "GS3";

  constructor(
    public readonly code: RailcardCode,
    public readonly minAdults: number,
    public readonly maxAdults: number,
    public readonly minChildren: number,
    public readonly maxChildren: number,
    public readonly minPassengers: number,
    public readonly maxPassengers: number,
    public readonly adultStatus: Option<StatusCode>,
    public readonly childStatus: Option<StatusCode>,
    public readonly adultDiscounts: StatusMap,
    public readonly childDiscounts: StatusMap,
    public readonly restriction: Option<Restriction>,
    public readonly bans: RailcardBanMap,
    public readonly minimumFares: MinimumFareMap,
    public readonly isRestrictedByArea: boolean,
    public readonly geography: NLC[]
  ) {}

  /**
   * Returns true if not restricted by area or the origin and destination are both within the geography
   */
  @memoize
  public canBeApplied(origin: NLC, destination: NLC): boolean {
    return !this.isRestrictedByArea || (this.geography.includes(origin) && this.geography.includes(destination));
  }

  /**
   * This method checks for a minimum fare that applies to the given ticket type
   */
  @memoize
  public getMinimumFare(code: TicketCode, date: LocalDate): Option<Price> {
    const minimumFares = this.minimumFares[code] || [];
    const minimumFare = minimumFares.find(minimumFare => minimumFare.appliesOn(date));

    // extract the value from the minimum fare option
    return option(minimumFare).map(minimumFare => minimumFare.value);
  }

  /**
   * Returns true if there is a ban that applies to the given origin, ticketCode and routeCode
   */
  @memoize
  public isBanned(origin: Location, ticketCode: TicketCode, routeCode: RouteCode): boolean {
    return (this.bans[RailcardBan.ALL] && this.bans[RailcardBan.ALL].findIndex(ban => ban.applies(origin, ticketCode, routeCode)) > -1) ||
           (this.bans[ticketCode] && this.bans[ticketCode].findIndex(ban => ban.applies(origin, ticketCode, routeCode)) > -1);
  }

  /**
   * Returns true if this is the public railcard
   */
  @memoize
  public get isPublicRailcard(): boolean {
    return this.code === Railcard.PUBLIC_RAILCARD_CODE;
  }
}

/**
 * Restriction on the use of a railcard
 */
export class RailcardBan {
  public static readonly ALL = "ALL";

  constructor(
    public readonly origin: Option<CRS>,
    public readonly ticketCode: Option<TicketCode>,
    public readonly routeCode: Option<RouteCode>
  ) {}

  /**
   * returns true if the ban applies at the given location, with the given ticket type code and route code
   */
  public applies(origin: Location, ticketCode: TicketCode, routeCode: RouteCode): boolean {
    const originMatches = this.origin.flatMap(o => origin.crs.map(crs => o === crs)).getOrElse(true);
    const ticketTypeMatches = this.ticketCode.map(t => t === ticketCode).getOrElse(true);
    const routeCodeMatches = this.routeCode.map(r => r === routeCode).getOrElse(true);

    return originMatches && ticketTypeMatches && routeCodeMatches;
  }

}

/**
 * Minimum fare override when applying a railcard
 */
export class MinimumFare {

  constructor(
    public readonly value: Price,
    public readonly startDate: LocalDate,
    public readonly endDate: LocalDate
  ) {}

  /**
   * Returns true if the given date is within the date range of the minimum fare
   */
  public appliesOn(date: LocalDate): boolean {
    return !date.isBefore(this.startDate) && !date.isAfter(this.endDate);
  }

}

/**
 * 3 char railcard code, e.g. YNG
 */
export type RailcardCode = string;

/**
 * Map of ticket type code to minimum price that can be applied for this railcard
 */
export type MinimumFareMap = {
  [ticketCode: string]: MinimumFare[];
}

/**
 * Map of ticket type code to railcard ban
 */
export type RailcardBanMap = {
  [ticketCode: string]: RailcardBan[]
}