
import {TicketCode, TicketType} from "../TicketType";
import {indexBy} from "../../util/array";
import {ValidityCode, ValidityType} from "../../validitytype/ValidityType";
import {ValidityTypeMap} from "../../validitytype/repository/ValidityTypeRepository";
import {DiscountCategory} from "../../passenger/Status";
import {AdvancePurchaseMap} from "./AdvancePurchaseRepository";
import {ticketType} from "../../../test/fare/FareMockUtils";

/**
 * Loads ticket types from a MySQL compatible database
 */
export class TicketTypeRepository {

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
      row.tkt_type === Direction.Return,
      row.tkt_type === Direction.Season,
      row.validity_code === ValidityType.ADVANCE,
      row.reservation_required !== ReservationType.NotRequired,
      row.tkt_class === Class.First,
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
  tkt_type: Direction;
  tkt_class: Class;
  validity_code: ValidityCode;
  reservation_required: ReservationType;
  discount_category: DiscountCategory;
}

enum Direction {
  Single = "S",
  Return = "R",
  Season = "N"
}

enum ReservationType {
  Required = "Y",
  NotRequired = "N",
  RequiredOutward = "O",
  RequiredReturn = "R",
  RequiredEither = "E",
  RequiredBoth = "B"
}

enum Class {
  First = 1,
  Standard = 2,
  Other = 9
}