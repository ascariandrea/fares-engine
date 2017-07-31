
import {DayOfWeek, LocalDate} from "js-joda";
import {Option} from "ts-option";
import memoize = require("memoized-class-decorator");

/**
 * Two char validity code e.g. 07
 */
export type ValidityCode = string;

/**
 * Each TicketType will have a ValidityType that contains information on the duration of the ticket validity and any
 * restrictions on the return journey window.
 */
export class ValidityType {

  constructor(
    public readonly code: ValidityCode,
    public readonly name: string,
    public readonly out: Validity,
    public readonly ret: Validity,
    public readonly returnRestrictions: ReturnPeriod
  ) { }

  /**
   * Returns true if the return journey is the correct number of days after the outward journey, specifically:
   *
   * - outward date plus the latest return validity duration is after the return travel date
   * - outward date plus the earliest return validity duration is before the return travel date
   * - the return day of the week has passed (i.e. we've seen at least 1 Friday)
   *
   * @param outwardDate
   * @param returnDate
   * @return
   */
  @memoize
  public isValidOnDates(outwardDate: LocalDate, returnDate: LocalDate): boolean {
    const latestReturnDate = outwardDate
      .plusMonths(this.ret.months)
      .plusDays(this.ret.days);

    const earliestReturnDate = outwardDate
      .plusMonths(this.returnRestrictions.months)
      .plusDays(this.returnRestrictions.days);

    const dayOfWeekHasPassed = this.returnRestrictions.dayOfWeek.match({
      none: () => true,
      some: day => {
        const dayOfWeekDiff = day.value() - outwardDate.dayOfWeek().value();

        // if the day of the week hasn't passed yet the diff will be negative so add a week to meaning that day on the
        // following week. E.g. outwardDate is Friday and return must be after Tuesday.
        return dayOfWeekDiff >= 0
           ? returnDate.isAfter(outwardDate.plusDays(dayOfWeekDiff))
           : returnDate.isAfter(outwardDate.plusWeeks(1).plusDays(dayOfWeekDiff));
      }
    });

    return latestReturnDate.isAfter(returnDate) && !returnDate.isBefore(earliestReturnDate) && dayOfWeekHasPassed;
  }

  /**
   * Return the URI of the validity type
   */
  public get id(): string {
    return `/validity-code/${this.code}`;
  }
}


/**
 * Maximum (latest) validity of travel after the outward travel date. This can apply to outward or return journeys.
 */
export class Validity {

  constructor(
    public readonly days: number,
    public readonly months: number,
    public readonly breakOfJourney: boolean
  ) { }

}

/**
 * Storage for minimum (earliest) duration elapsed between the outward and return journey
 */
export class ReturnPeriod {

  constructor(
    public readonly days: number,
    public readonly months: number,
    public readonly dayOfWeek: Option<DayOfWeek>
  ) { }

}