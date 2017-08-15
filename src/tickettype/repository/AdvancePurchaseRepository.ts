
import {groupBy} from "../../util/array";
import {AdvancePurchase, CheckType} from "../AdvancePurchase";
import {option} from "ts-option";
import {LocalTime} from "js-joda";
import {TicketCode} from "../TicketType";
import {RestrictionCode} from "../../restriction/Restriction";
import {Operator} from "../../fare/Fare";

/**
 * Loads advance purchase data from a MySQL compatible database
 */
export class AdvancePurchaseRepository {

  constructor(
    private readonly db
  ) { }

  /**
   * Return all advance purchase purchase data, indexed by ticket_code
   */
  public getAdvancePurchaseData(): Promise<AdvancePurchaseMap> {
    return this.db
      .query("SELECT * FROM advance_ticket WHERE CURDATE() BETWEEN start_date AND end_date")
      .map(row => this.createAdvanceTicket(row))
      .reduce(groupBy((ap: AdvancePurchase) => ap.ticketCode), {});
  }

  private createAdvanceTicket(row: AdvancePurchaseRow): AdvancePurchase {
    return new AdvancePurchase(
      row.ticket_code,
      option(row.restriction_code),
      option(row.toc_id),
      parseInt(row.check_type),
      parseInt(row.ap_data),
      option(row.booking_time).map(time => LocalTime.parse(time))
    );
  }
}

export type AdvancePurchaseMap = {
  [ticketCode: string]: AdvancePurchase[];
};

interface AdvancePurchaseRow {
  ticket_code: TicketCode;
  restriction_code: RestrictionCode | undefined;
  toc_id: Operator | undefined;
  check_type: string;
  ap_data: string;
  booking_time: string | undefined;
}
