
import {Location, NLC} from "../../location/Location";
import {LocalDate} from "js-joda";
import {Fare, FareMap, Operator, Price} from "../Fare";
import {RestrictionMap} from "../../restriction/repository/RestrictionRepository";
import {TicketTypeMap} from "../../tickettype/repository/TicketTypeRepository";
import {none, option, some} from "ts-option";
import {TicketCode} from "../../tickettype/TicketType";
import {RouteCode} from "../../route/Route";
import {RouteMap} from "../../route/repository/RouteRepository";
import {RestrictionCode} from "../../restriction/Restriction";
import {Railcard} from "../../passenger/Railcard";
import {NLCMap} from "../../location/repository/LocationRepository";
import {PassengerSet} from "../../passenger/PassengerSet";
import {Status} from "../../passenger/Status";

/**
 * Provide access to the flow fares
 */
export class FlowFareRepository {

  constructor(
    private readonly db,
    private readonly ticketTypes: TicketTypeMap,
    private readonly restrictions: RestrictionMap,
    private readonly routes: RouteMap,
    private readonly publicRailcard: Railcard,
    private readonly locationByNLC: NLCMap
  ) {}

  /**
   * Load the flow fares from the DB and apply all status codes in the passenger set
   */
  public async getFares(origin: Location, destination: Location, passengerSet: PassengerSet, date: LocalDate): Promise<FareMap> {
    const flowFares = await this.getFlowFares(origin, destination, date);
    const result = {};

    for (const fare of flowFares) {
      for (const [status, railcard] of passengerSet.uniqueStatuses(fare)) {
        const fareWithStatusApplied = status.apply(fare, railcard, date);

        result[fareWithStatusApplied.id] = fareWithStatusApplied;
      }
    }

    return result;
  }

  /**
   * Load the flow fares from the database and return them index by id (origin, destination, route_code, status,
   * restriction code)
   */
  private async getFlowFares(origin: Location, destination: Location, date: LocalDate): Promise<Fare[]> {
    return this.db.query(`
      SELECT * FROM flow JOIN fare using(flow_id) 
      WHERE '${date}' BETWEEN start_date AND end_date
      AND (
        (origin_code IN ('${origin.allStationsJoined}') AND destination_code IN ('${destination.allStationsJoined}')) 
        OR 
        (direction = 'R' AND origin_code IN ('${destination.allStationsJoined}') AND destination_code IN ('${origin.allStationsJoined}'))
      )
      ORDER BY fare
    `)
    .map(row => this.createFare(origin, destination, row));
  }

  private createFare(origin: Location, destination: Location, row: FlowFareRow): Fare {
    const originNLC = origin.allStations.indexOf(row.origin_code) !== -1
      ? origin.clusters[(row.origin_code)]
      : origin.clusters[(row.destination_code)];
    const destinationNLC = destination.allStations.indexOf(row.destination_code) !== -1
      ? destination.clusters[row.destination_code]
      : destination.clusters[row.origin_code];

    return new Fare(
      this.locationByNLC[originNLC],
      this.locationByNLC[destinationNLC],
      this.routes[row.route_code],
      this.ticketTypes[row.ticket_code],
      Status.ADULT_STATUS_CODE,
      row.fare,
      this.publicRailcard,
      row.restriction_code ? some(this.restrictions[row.restriction_code]) : none,
      option(row.toc),
      row.cross_london_ind
    )
  };

}

interface FlowFareRow {
  ticket_code: TicketCode,
  origin_code: NLC,
  destination_code: NLC,
  route_code: RouteCode,
  restriction_code: RestrictionCode,
  cross_london_ind: number,
  fare: Price,
  toc: Operator
}