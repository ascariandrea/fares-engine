import {Fare, Price} from "../fare/Fare";
import {Railcard} from "./Railcard";
import {LocalDate} from "js-joda";

/**
 *  3 digit status code of a passenger, e.g 017
 */
export type StatusCode = string;

/**
 * A status that can a passengers holds in order to get a discounted price
 */
export class Status {

  static readonly ADULT_STATUS_CODE = "000";
  static readonly CHILD_STATUS_CODE = "001";

  constructor(
    public readonly statusCode: StatusCode,
    public readonly stdSingleMaxFlat: number,
    public readonly stdReturnMaxFlat: number,
    public readonly stdLowerMin: number,
    public readonly stdHigherMin: number,
    public readonly firstSingleMaxFlat: number,
    public readonly firstReturnMaxFlat: number,
    public readonly firstLowerMin: number,
    public readonly firstHigherMin: number,
    public readonly discountCategory: DiscountCategory,
    public readonly discountIndicator: string,
    public readonly discountPercent: number,
    public readonly firstSingle: boolean,
    public readonly firstReturn: boolean,
    public readonly standardSingle: boolean,
    public readonly standardReturn: boolean
  ) {}

  /**
   * Apply the status discount to the given fare
   */
  public apply(fare: Fare, railcard: Railcard, date: LocalDate): Fare {
    if (!this.canBeApplied(fare)) {
      return fare;
    }

    // apply either the calculated fare or the minimum fare override
    const price = Math.max(
      Status.round(this.getDiscountedPrice(fare)),
      railcard.getMinimumFare(fare.ticketType.code, date).getOrElse(0)
    );

    return new Fare(
      fare.origin,
      fare.destination,
      fare.route,
      fare.ticketType,
      this.statusCode,
      price,
      railcard,
      fare.restriction,
      fare.fareSetter,
      fare.xLondon
    );
  }

  /**
   * Returns true if the status discount is not X or N and ticket type class and single/return marker is valid with
   * this status code.
   */
  private canBeApplied(fare: Fare): boolean {
    return this.discountIndicator !== "X"
      && this.discountIndicator !== "N"
      && (this.firstSingle || !fare.ticketType.isFirstClass || fare.ticketType.isReturn)
      && (this.firstReturn || !fare.ticketType.isFirstClass || !fare.ticketType.isReturn)
      && (this.standardSingle || fare.ticketType.isFirstClass || fare.ticketType.isReturn)
      && (this.standardReturn || fare.ticketType.isFirstClass || !fare.ticketType.isReturn);
  }

  private getDiscountedPrice(fare: Fare): Price {
    switch (this.discountIndicator) {
      case "0": return this.applyType0(fare);
      case "F": return this.applyTypeF(fare);
      case "M": return this.applyTypeM(fare);
      case "L": return this.applyTypeL(fare);
      case "H": return this.applyTypeH(fare);
      default: throw new UnknownStatusException(`Unknown discount indicator ${this.discountIndicator}.`);
    }
  }

  /**
   * Round down to the nearest 5p
   */
  private static round(price: Price): Price {
    return Math.round(price / 5) * 5;
  }

  /**
   * Discount by percent
   */
  private applyType0(fare: Fare ): Price {
    return this.discountPercent === 0
      ? fare.price
      : fare.price - fare.price * (this.discountPercent / 1000);
  }

  /**
   * Apply the appropriate flat rate discount
   */
  private applyTypeF(fare: Fare ): Price {
    return fare.ticketType.isFirstClass
      ? fare.ticketType.isReturn ? this.firstReturnMaxFlat : this.firstSingleMaxFlat
      : fare.ticketType.isReturn ? this.stdReturnMaxFlat : this.stdSingleMaxFlat;
  }

  /**
   * Take the smallest discount of either the percentage discount or the flat rate discount
   */
  private applyTypeM(fare: Fare ): Price {
    return Math.max(this.applyType0(fare), this.applyTypeF(fare));
  }

  /**
   * Apply the percentage discount with the lower minimum fare
   */
  private applyTypeL(fare: Fare ): Price {
    const minimumFare = fare.ticketType.isFirstClass ? this.firstLowerMin : this.stdLowerMin;

    return Math.max(this.applyType0(fare), minimumFare);
  }

  /**
   * Apply the percentage discount with the higher minimum fare
   */
  private applyTypeH(fare: Fare ): Price {
    const minimumFare = fare.ticketType.isFirstClass ? this.firstHigherMin : this.stdHigherMin;

    return Math.max(this.applyType0(fare), minimumFare);
  }

}

export type StatusMap = {
  [discountCategory: number]: Status
};

export type DiscountCategory = number;

class UnknownStatusException extends Error {}