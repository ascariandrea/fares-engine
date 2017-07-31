
import {ReturnPeriod, Validity, ValidityCode, ValidityType} from "../ValidityType";
import {indexBy} from "../..//util/array";
import {option} from "ts-option";
import {DayOfWeek} from "js-joda";

/**
 * Loads validity types from a MySQL compatible database
 */
export default class ValidityTypeRepository {

  constructor(
    private readonly db
  ) {}

  /**
   * Return all the validity types from the database, indexed by the validity_code
   */
  public getValidityTypes(): Promise<ValidityTypeMap> {
    return this.db
      .query("SELECT * FROM ticket_validity WHERE CURDATE() BETWEEN start_date AND end_date")
      .map(row => this.createValidityType(row))
      .reduce(indexBy((v: ValidityType) => v.code), {})
  }

  private createValidityType(row: ValidityTypeRow): ValidityType {
    return new ValidityType(
      row.validity_code,
      row.description,
      new Validity(row.out_days, row.out_months, row.break_out === 1),
      new Validity(row.ret_days, row.ret_months, row.break_in === 1),
      new ReturnPeriod(
        row.ret_after_days,
        row.ret_after_months,
        option(row.ret_after_day).map(d => DAYS[d])
      )
    );
  }
}

export type ValidityTypeMap = {
  [validityCode: string]: ValidityType;
};

interface ValidityTypeRow {
  validity_code: ValidityCode,
  description: string,
  out_days: number,
  out_months: number,
  break_out: 0 | 1,
  ret_days: number,
  ret_months: number,
  break_in: 0 | 1,
  ret_after_days: number,
  ret_after_months: number,
  ret_after_day: string
}

const DAYS = {
  MO: DayOfWeek.MONDAY,
  TU: DayOfWeek.TUESDAY,
  WE: DayOfWeek.WEDNESDAY,
  TH: DayOfWeek.THURSDAY,
  FR: DayOfWeek.FRIDAY,
  SA: DayOfWeek.SATURDAY,
  SU: DayOfWeek.SUNDAY
};
