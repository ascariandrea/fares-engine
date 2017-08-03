
import {LocalDate, LocalTime} from "js-joda";
import {Option, option} from "ts-option";
import {CRS} from "../location/Location";
import {RestrictionDate, CurrentFutureMarker} from "./RestrictionDate";
import {Operator} from "../fare/Fare";


/**
 * Two character, alpha-numeric restriction code, e.g 1B
 */
export type RestrictionCode = string;

/**
 * Contains restrictions for the RestrictionCode on a particular date
 */
export class Restriction {

  constructor(
    public readonly code: RestrictionCode,
    private readonly dates: RestrictionDate[],
    private readonly current: RestrictionRules,
    private readonly future: RestrictionRules
  ) {}

  /**
   * Return the URI for the restriction
   */
  public get id(): string {
    return `/restriction/${this.code}`;
  }

  /**
   * Get the applicable RestrictionRules on the given date.
   */
  public get(date: LocalDate): Option<RestrictionRules> {
    const header = this.dates.find(h => h.matches(date));

    return option(header).map(d => d && d.cfMkr === CurrentFutureMarker.Current ? this.current : this.future);
  }

}

/**
 * Outward and return restriction direction rules
 */
export class RestrictionRules {

  constructor(
    public readonly out: RestrictionDirection,
    public readonly ret: RestrictionDirection
  ) {}

}

/**
 * Restrictions may be time based at departure, arrival or through stations, or on particular services.
 */
export class RestrictionDirection {

  constructor(
    public readonly id: string,
    public readonly arrive: TimeRestriction[],
    public readonly depart: TimeRestriction[],
    public readonly via: TimeRestriction[],
    public readonly services: ServiceRestriction
  ) { }

}

/**
 * A time restriction for a departure station, arrival station or calling point. Some time restrictions are TOC
 * specific. If there is no TOC specified the restriction applies to all TOCs.
 */
export class TimeRestriction {

  constructor(
    public readonly from: LocalTime,
    public readonly to: LocalTime,
    public readonly toc: Option<Operator>,
    public readonly location: Option<CRS>,
    public readonly applyRailcardMinimumFare: boolean,
    public readonly dates: RestrictionDate[]
  ) { }

}

/**
 * Contains services that are restricted and services that are eased
 */
export class ServiceRestriction {

  constructor(
    public readonly restrictions: Service[],
    public readonly easements: Service[]
  ) { }

}

/**
 * Train Unique ID, e.g. C10000
 */
export type Service = string;
