
import {Location, NLC} from "../../location/Location";
import {LocalDate} from "js-joda";
import {Fare, FareMap, Price} from "../Fare";
import {RestrictionMap} from "../../restriction/repository/RestrictionRepository";
import {TicketTypeMap} from "../../tickettype/repository/TicketTypeRepository";
import {none, some} from "ts-option";
import {TicketCode} from "../../tickettype/TicketType";
import {RouteCode} from "../../route/Route";
import {RouteMap} from "../../route/repository/RouteRepository";
import {RestrictionCode} from "../../restriction/Restriction";
import Bluebird = require("bluebird");
import {RailcardMap} from "../../passenger/repository/RailcardRepository";
import {NLCMap} from "../../location/repository/LocationRepository";
import PassengerSet from "../../passenger/PassengerSet";
import Railcard, {RailcardCode} from "../../passenger/Railcard";

export default class NonDerivableFareRepository {

  constructor(
    private readonly db,
    private readonly ticketTypes: TicketTypeMap,
    private readonly restrictions: RestrictionMap,
    private readonly routes: RouteMap,
    private readonly railcards: RailcardMap,
    private readonly locationsByNLC: NLCMap
  ) {}

  /**
   * This method will first create a fares map using the non derivable fares, then load the non derivable fare overrides
   * and overlay those, using the id (origin, destination, route, status and restriction code) as the key.
   *
   * TODO: check why there may be a non-supression record with both an adult fare and child fare of 99999999
   *  - does this mean that 99999999 acts as a suppression record?
   */
  public async getFares(origin: Location, destination: Location, passengerSet: PassengerSet, date: LocalDate): Promise<FareMap> {
    return this
      .getNonDerivableOverrideRows(origin, destination, passengerSet.railcards, date)
      .reduce((fares: FareMap, row: NonDerivableRow) => this.createAdultAndChildFare(passengerSet, fares, row), {});
  }

  private createAdultAndChildFare (passengerSet: PassengerSet, fares: FareMap, row: NonDerivableRow): FareMap {
    const railcard = this.railcards[row.railcard_code];

    if (passengerSet.hasAdults && passengerSet.hasRailcard(railcard)) {
      const adultFare = new Fare(
        this.locationsByNLC[row.origin_code],
        this.locationsByNLC[row.destination_code],
        this.routes[row.route_code],
        this.ticketTypes[row.ticket_code],
        railcard.adultStatus.get,
        row.adult_fare || 0,
        railcard,
        row.restriction_code ? some(this.restrictions[row.restriction_code]) : none,
        none,
        row.cross_london_ind
      );

      fares[adultFare.id] = adultFare;
    }

    if (passengerSet.hasChildren && passengerSet.hasRailcard(railcard)) {
      const childFare = new Fare(
        this.locationsByNLC[row.origin_code],
        this.locationsByNLC[row.destination_code],
        this.routes[row.route_code],
        this.ticketTypes[row.ticket_code],
        railcard.childStatus.get,
        row.child_fare || 0,
        railcard,
        row.restriction_code ? some(this.restrictions[row.restriction_code]) : none,
        none,
        row.cross_london_ind
      );

      fares[childFare.id] = childFare;
    }

    return fares;
  }

  private getNonDerivableOverrideRows(origin: Location, destination: Location, railcards: Railcard[], date: LocalDate): Bluebird<NonDerivableRow[]> {
    return this.db.query(`
      SELECT * FROM non_derivable_fare_override 
      WHERE CURDATE() >= quote_date 
      AND '${date}' BETWEEN start_date AND end_date
      AND railcard_code IN ('${railcards.map(r => r.code).join("','")}')
      AND origin_code IN ('${origin.allStationsJoined}')
      AND destination_code IN ('${destination.allStationsJoined}')
      ORDER BY start_date
    `);
  }

}

interface NonDerivableRow {
  ticket_code: TicketCode,
  origin_code: NLC,
  destination_code: NLC,
  route_code: RouteCode,
  restriction_code: RestrictionCode,
  cross_london_ind: 0 | 1,
  adult_fare?: Price,
  child_fare?: Price,
  suppress_mkr: 0 | 1,
  railcard_code: RailcardCode
}