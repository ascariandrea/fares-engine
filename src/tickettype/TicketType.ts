
import {ValidityType} from "../validitytype/ValidityType";
import {DiscountCategory} from "../passenger/Status";
import {LocalDate} from "js-joda";

/**
 * 3 character alpha-numeric ticket code, e.g. SOS
 */
export type TicketCode = string;

/**
 * The ticket type contains various boolean properties of the ticket and the validity information.
 */
export class TicketType {

  constructor(
    public readonly code: TicketCode,
    public readonly name: string,
    public readonly minAdults: number,
    public readonly maxAdults: number,
    public readonly minChildren: number,
    public readonly maxChildren: number,
    public readonly minPassengers: number,
    public readonly maxPassengers: number,
    public readonly validityType: ValidityType,
    public readonly isReturn: boolean,
    public readonly isSeason: boolean,
    public readonly isAdvance: boolean,
    public readonly isReservationRequired: boolean,
    public readonly isFirstClass: boolean,
    public readonly discountCategory: DiscountCategory,
    public readonly startDate: LocalDate,
    public readonly endDate: LocalDate
  ) {}

  /**
   * Get the URI for this ticket type
   */
  public get id(): string {
    return `/ticket-type/${this.code}`;
  }

}