
import {TicketCode} from "../tickettype/TicketType";
import {Option} from "ts-option";
import {RouteCode} from "../route/Route";
import {LocalDate} from "js-joda";
import {Fare} from "../fare/Fare";
import RestrictionDate from "./RestrictionDate";

/**
 * A calendar restriction restricts the use of a ticket type and route between a date range
 */
export default class CalendarRestriction {

  constructor(
    public readonly ticketCode: TicketCode,
    private readonly route: Option<RouteCode>,
    private readonly date: RestrictionDate
  ) {}

  /**
   * Returns true if it's within the correct date range, the ticket code matches, the route code matches or there is
   * no route restriction
   */
  public matches(date: LocalDate, fare: Fare): boolean {
    return this.date.matches(date)
      && fare.ticketType.code === this.ticketCode
      && this.route.map(r => r === fare.route.code).getOrElse(true);
  }

}