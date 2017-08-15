
import {TicketCode} from "./TicketType";
import {RestrictionCode} from "../restriction/Restriction";
import {Option} from "ts-option";
import {Operator} from "../fare/Fare";
import {LocalTime} from "js-joda";

/**
 * Data for Advance Purchase tickets
 */
export class AdvancePurchase {

  constructor(
    public readonly ticketCode: TicketCode,
    public readonly restrictionCode: Option<RestrictionCode>,
    public readonly operator: Option<Operator>,
    public readonly checkType: CheckType,
    public readonly apData: APData,
    public readonly bookingTime: Option<LocalTime>
  ) {}
}

/**
 * Number of hours or days ahead a ticket must be purchased
 */
export type APData = number;

/**
 * Type of check performed to see whether the Advance Purchase Booking Horizon has passed
 */
export enum CheckType {
  Date = 0,
  Hours = 1,
  Days = 2
}