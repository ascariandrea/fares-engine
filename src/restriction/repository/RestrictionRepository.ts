
import {
  Restriction, RestrictionRules, ServiceRestriction,
  RestrictionDirection, TimeRestriction, RestrictionCode
} from "../Restriction";

import {LocalDate, LocalTime} from "js-joda";
import {option} from "ts-option";
import {CalendarRestriction} from "../CalendarRestriction";
import {TicketCode} from "../../tickettype/TicketType";
import {RouteCode} from "../../route/Route";
import {RestrictionDate, CurrentFutureMarker} from "../RestrictionDate";
import {indexBy} from "../../util/array";

/**
 * Provide access to the restrictions
 */
export class RestrictionRepository {

  constructor(
    private readonly db
  ) {}

  /**
   * Return a hashmap of restrictions indexed by their restriction code
   */
  public async getRestrictions(): Promise<RestrictionMap> {
    return this.db
      .query("SELECT distinct restriction_code FROM restriction_header")
      .map(this.createRestriction)
      .reduce(indexBy((r: Restriction) => r.code), {});
  }

  private createRestriction = async(header: RestrictionHeaderRow) => {
    const [dates, current, future] = await Promise.all([
      this.getRestrictionHeaderDates(header.restriction_code),
      this.getRestrictionRules(header, CurrentFutureMarker.Current),
      this.getRestrictionRules(header, CurrentFutureMarker.Future)
    ]);

    return new Restriction(header.restriction_code, dates, current, future);
  };

  private async getRestrictionHeaderDates(code: RestrictionCode): Promise<RestrictionDate[]> {
    return this.db
      .query("SELECT * FROM restriction_header_date WHERE restriction_code = ? ORDER BY start_date", [code])
      .map(this.createRestrictionDate);
  }

  private async getRestrictionRules(header, cfMkr: CurrentFutureMarker): Promise<RestrictionRules> {
    const [out, ret] = await Promise.all([
      this.getDirection(header, cfMkr, Direction.Outward),
      this.getDirection(header, cfMkr, Direction.Return)
    ]);

    return new RestrictionRules(out, ret);
  }

  private async getDirection(header: RestrictionHeaderRow, cfMkr: CurrentFutureMarker, direction: Direction): Promise<RestrictionDirection> {
    const [time, service] = await Promise.all([
      this.getTimeRestrictions(header.restriction_code, cfMkr, direction),
      this.getServiceRestriction(header, cfMkr, direction)
    ]);

    return new RestrictionDirection(header.restriction_code + "_" + direction, time.D || [], time.A || [], time.V || [], service);
  }

  private async getServiceRestriction(header: RestrictionHeaderRow, cfMkr: CurrentFutureMarker, direction: Direction): Promise<ServiceRestriction> {
    const rows = await this.db
      .query("SELECT * FROM restriction_train WHERE restriction_code = ? AND cf_mkr = ? AND out_ret = ?", [header.restriction_code, cfMkr, direction]);

    const services = rows.map(row => row.train_no);
    const type = direction === Direction.Outward ? header.type_out : header.type_ret;
    const [restrictions, easements] = type === ServiceRestrictionType.Eased ? [[], services] : [services, []];

    return new ServiceRestriction(restrictions, easements);
  }

  private async getTimeRestrictions(code: RestrictionCode, cfMkr: CurrentFutureMarker, direction: Direction) {
    const rows = await this.db.query("SELECT * FROM restriction_time WHERE restriction_code = ? AND cf_mkr = ? AND out_ret = ?", [code, cfMkr, direction]);
    const result = { A: [], D: [], V: [] };

    for (const row of rows) {
      result[row.arr_dep_via].push(await this.createTimeRestriction(row));
    }

    return result;
  }

  private async createTimeRestriction(row: TimeRestrictionRow): Promise<TimeRestriction> {
    return new TimeRestriction(
      LocalTime.parse(row.time_from),
      LocalTime.parse(row.time_to),
      option(row.toc),
      option(row.location),
      row.min_fare_flag === 1,
      await this.getTimeRestrictionDates(row)
    );
  }

  private getTimeRestrictionDates(timeRestriction: TimeRestrictionRow): Promise<RestrictionDate[]> {
    return this.db
      .query(`
        SELECT * FROM restriction_time_date 
        WHERE restriction_code = ? 
        AND cf_mkr = ?
        AND out_ret = ?
        AND sequence_no = ?
      `, [timeRestriction.restriction_code, timeRestriction.cf_mkr, timeRestriction.out_ret, timeRestriction.sequence_no])
      .map(this.createRestrictionDate);
  }

  private createRestrictionDate(row: RestrictionDateRow): RestrictionDate {
    return new RestrictionDate(
      LocalDate.parse(row.start_date),
      LocalDate.parse(row.end_date),
      row.cf_mkr,
      row.monday === 1,
      row.tuesday === 1,
      row.wednesday === 1,
      row.thursday === 1,
      row.friday === 1,
      row.saturday === 1,
      row.sunday === 1
    );
  }

  /**
   * Return all the calendar restrictions indexed by ticket code
   */
  public async getCalendarRestrictions(): Promise<CalendarRestrictionMap> {
    return this.db
      .query("SELECT * FROM restriction_ticket_calendar")
      .map(row => this.createCalendarRestriction(row))
      .reduce(indexBy((r: CalendarRestriction) => r.ticketCode))
  }

  private createCalendarRestriction(row: CalendarRestrictionRow): CalendarRestriction {
    return new CalendarRestriction(row.ticket_code, option(row.route_code), this.createRestrictionDate(row));
  }

}

export type RestrictionMap = {
  [restrictionCode: string]: Restriction;
}

enum Direction {
  Outward = "O",
  Return = "R"
}

interface RestrictionHeaderRow {
  restriction_code: RestrictionCode;
  type_out: ServiceRestrictionType;
  type_ret: ServiceRestrictionType
}

enum ServiceRestrictionType {
  Eased = "N",
  Restricted = "P"
}

interface TimeRestrictionRow {
  time_from: string;
  time_to: string;
  toc: string;
  location: string;
  restriction_code: RestrictionCode;
  cf_mkr: CurrentFutureMarker;
  sequence_no: string;
  out_ret: Direction;
  min_fare_flag: 0 | 1;
}

interface RestrictionDateRow {
  start_date: string;
  end_date: string;
  cf_mkr: CurrentFutureMarker;
  monday: 0 | 1;
  tuesday: 0 | 1;
  wednesday: 0 | 1;
  thursday: 0 | 1;
  friday: 0 | 1;
  saturday: 0 | 1;
  sunday: 0 | 1;
}

export type CalendarRestrictionMap = {
  [ticketCode: string]: CalendarRestriction
};

interface CalendarRestrictionRow extends RestrictionDateRow {
  ticket_code: TicketCode,
  route_code: RouteCode
}
