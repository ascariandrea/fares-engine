
import {Railcard, MinimumFare, RailcardCode} from "../Railcard";
import {Status} from "../Status";
import {StatusMap} from "../Status";
import {option} from "ts-option";
import {RailcardBan} from "../Railcard";
import {RestrictionCode} from "../../restriction/Restriction";
import {TicketCode} from "../../tickettype/TicketType";
import {Price} from "../../fare/Fare";
import {LocalDate} from "js-joda";
import {CurrentFutureMarker} from "../../restriction/RestrictionDate";
import {RouteCode} from "../../route/Route";
import {CRS, NLC} from "../../location/Location";
import {RestrictionMap} from "../../restriction/repository/RestrictionRepository";

/**
 * Provide access to railcards
 */
export class RailcardRepository {

  constructor(
    private readonly db,
    private readonly restrictions: RestrictionMap
  ) {}

  /**
   * Get a map of all railcards indexed by railcard code
   */
  public async getRailcards(): Promise<RailcardMap> {
    const [railcards, statuses, minimumFares, restrictions, bans, geography] = await Promise.all([
      this.getAllRailcards(),
      this.getAllStatuses(),
      this.getMinimumFares(),
      this.getRestrictions(),
      this.getBans(),
      this.getGeography()
    ]);

    const result = {};

    for (const railcard of railcards) {
      const code = railcard.railcard_code || Railcard.PUBLIC_RAILCARD_CODE;

      result[code] = new Railcard(
        code,
        railcard.min_adults,
        railcard.max_adults,
        railcard.min_children,
        railcard.max_children,
        railcard.min_passengers,
        railcard.max_passengers,
        option(railcard.adult_status),
        option(railcard.child_status),
        statuses[railcard.adult_status] || {},
        statuses[railcard.child_status] || {},
        option(this.restrictions[restrictions[code]]),
        bans[code] || {},
        minimumFares[code] || {},
        railcard.restricted_by_area === 1,
        geography[code] || []
      );
    }

    return result;
  }

  private getAllRailcards(): Promise<any[]> {
    return this.db.query("SELECT * FROM railcard WHERE end_date >= CURDATE()");
  }

  private getAllStatuses(): Promise<StatusCodeStatusMap> {
    const createStatus = (prev, status) => {
      prev[status["status_code"]] = prev[status["status_code"]] || [];
      prev[status["status_code"]][status["discount_category"]] = new Status(
        status["status_code"],
        status["std_single_max_flat"],
        status["std_return_max_flat"],
        status["std_lower_min"],
        status["std_higher_min"],
        status["first_single_max_flat"],
        status["first_return_max_flat"],
        status["first_lower_min"],
        status["first_higher_min"],
        status["discount_category"],
        status["discount_indicator"],
        status["discount_percentage"],
        status["fs_mkr"],
        status["fr_mkr"],
        status["ss_mkr"],
        status["sr_mkr"]
      );

      return prev;
    };

    return this.db
      .query("SELECT * FROM status_discount JOIN status USING (status_code, end_date) WHERE end_date >= CURDATE()")
      .reduce(createStatus, {});
  }

  private getMinimumFares(): Promise<MinimumFareMap> {
    const createMinimumFare = (prev: MinimumFareMap, minimumFare: MinimumFareRow) => {
      prev[minimumFare.railcard_code] = prev[minimumFare.railcard_code] || [];
      prev[minimumFare.railcard_code][minimumFare.ticket_code] = prev[minimumFare.railcard_code][minimumFare.ticket_code] || [];

      prev[minimumFare.railcard_code][minimumFare.ticket_code].push(new MinimumFare(
        minimumFare.minimum_fare,
        LocalDate.parse(minimumFare.start_date),
        LocalDate.parse(minimumFare.end_date)
      ));

      return prev;
    };

    return this.db
      .query("SELECT * FROM railcard_minimum_fare")
      .reduce(createMinimumFare, {});
  }

  private getRestrictions(): Promise<RailcardRestrictionMap> {
    const createRestrictionMap = (prev, row) => {
      prev[row.railcard_code] = row.restriction_code;

      return prev;
    };

    //in theory the restriction code might be different in the F but it seems unlikely.
    return this.db
      .query("SELECT * FROM restriction_railcard WHERE total_ban IS NULL AND cf_mkr = 'C'")
      .reduce(createRestrictionMap, {});
  }

  private getBans(): Promise<RailcardBanMap> {
    const createBan = (prev: RailcardBanMap, ban: RailcardBanRow) => {
      const key = ban.ticket_code || RailcardBan.ALL;

      prev[ban.railcard_code] = prev[ban.railcard_code] || [];
      prev[ban.railcard_code][key] = prev[ban.railcard_code][key] || [];

      prev[ban.railcard_code][key].push(new RailcardBan(
        option(ban.location),
        option(ban.ticket_code),
        option(ban.route_code)
      ));

      return prev;
    };

    return this.db
      .query(`SELECT * FROM restriction_railcard WHERE total_ban IS NOT NULL`)
      .reduce(createBan, {});
  }

  private getGeography(): Promise<RailcardGeographyMap> {
    const groupLocations = (map: RailcardGeographyMap, item: RailcardGeographyRow) => {
      map[item.railcard_code] = map[item.railcard_code] || [];
      map[item.railcard_code].push(item.nlc);

      return map;
    };

    return this.db
      .query(`SELECT railcard_code, SUBSTRING(uic_code, 3, 4) as nlc FROM location_railcard WHERE end_date > CURDATE()`)
      .reduce(groupLocations, {});
  }
}

interface MinimumFareRow {
  start_date: string;
  end_date: string;
  railcard_code: RailcardCode;
  ticket_code: TicketCode;
  minimum_fare: Price;
}

interface RailcardBanRow {
  railcard_code: RailcardCode;
  restriction_code: RestrictionCode;
  location: CRS;
  ticket_code: TicketCode;
  route_code: RouteCode;
  cf_mkr: CurrentFutureMarker;
  restricted_by_area: 0 | 1
}

interface RailcardGeographyRow {
  railcard_code: RailcardCode;
  nlc: NLC;
}

export type RailcardMap = {
  [railcardCode: string]: Railcard
}

type MinimumFareMap = {
  [railcardCode: string]: {
    [ticketCode: string]: MinimumFare[];
  }
}

type RailcardRestrictionMap = {
  [railcardCode: string]: string;
}

type RailcardBanMap = {
  [railcardCode: string]: {
    [ticketCode: string]: RailcardBan[]
  }
}

type StatusCodeStatusMap = {
  [statusCode: string]: StatusMap
}

type RailcardGeographyMap = {
  [railcardCode: string]: NLC[]
}
