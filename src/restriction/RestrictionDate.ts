
import {LocalDate} from "js-joda";

/**
 * Date validity for restriction records
 */
export class RestrictionDate {

  constructor(
    private readonly startDate: LocalDate,
    private readonly endDate: LocalDate,
    public readonly cfMkr: CurrentFutureMarker,
    private readonly MONDAY: boolean,
    private readonly TUESDAY: boolean,
    private readonly WEDNESDAY: boolean,
    private readonly THURSDAY: boolean,
    private readonly FRIDAY: boolean,
    private readonly SATURDAY: boolean,
    private readonly SUNDAY: boolean
  ) {}

  /**
   * Returns true if the given date is within the range of the header and the header is valid on that day of the week.
   */
  public matches(date: LocalDate): boolean {
    return !date.isBefore(this.startDate) && !date.isAfter(this.endDate) && this[date.dayOfWeek().name()];
  }

}

/**
 * Determines whether the restriction is part of the current or future set
 */
export enum CurrentFutureMarker {
  Current = "C",
  Future = "F"
}
