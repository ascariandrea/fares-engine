
import {TicketCode, TicketType} from "../TicketType";
import {indexBy} from "../../util/array";
import {ValidityCode} from "../../validitytype/ValidityType";
import {ValidityTypeMap} from "../../validitytype/repository/ValidityTypeRepository";
import {DiscountCategory} from "../../passenger/Status";

/**
 * Loads ticket types from a MySQL compatible database
 */
export default class TicketTypeRepository {

  constructor(
    private readonly db,
    private readonly validityTypes: ValidityTypeMap
  ) { }

  /**
   * Return all ticket type codes from the database, indexed by ticket_code
   */
  public getTicketTypes(): Promise<TicketTypeMap> {
    return this.db
      .query("SELECT * FROM ticket_type WHERE CURDATE() BETWEEN quote_date AND end_date")
      .map(row => this.createTicketType(row))
      .reduce(indexBy((ticketType: TicketType) => ticketType.code), {});
  }

  private createTicketType(row: TicketTypeRow): TicketType {
    return new TicketType(
      row.ticket_code,
      row.description,
      row.min_adults,
      row.max_adults,
      row.min_children,
      row.max_children,
      row.min_passengers,
      row.max_passengers,
      this.validityTypes[row.validity_code],
      row.tkt_type === Direction.RETURN,
      row.tkt_type === Direction.SEASON,
      row.reservation_required !== ReservationType.NOT_REQUIRED,
      row.tkt_class === Class.FIRST,
      row.discount_category
    );
  }
}

export type TicketTypeMap = {
  [ticketCode: string]: TicketType;
};

interface TicketTypeRow {
  ticket_code: TicketCode;
  description: string;
  min_adults: number;
  max_adults: number;
  min_children: number;
  max_children: number;
  min_passengers: number;
  max_passengers: number;
  tkt_type: string;
  tkt_class: number;
  validity_code: ValidityCode;
  reservation_required: string;
  discount_category: DiscountCategory;
}

const Direction = {
  SINGLE: "S",
  RETURN: "R",
  SEASON: "N"
};

const ReservationType = {
  REQUIRED: "Y",
  NOT_REQUIRED: "N",
  REQUIRED_OUTWARD: "O",
  REQUIRED_RETURN: "R",
  REQUIRED_EITHER: "E",
  REQUIRED_BOTH: "B"
};

const Class = {
  FIRST: 1,
  STANDARD: 2,
  OTHER: 9
};