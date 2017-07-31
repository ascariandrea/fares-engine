import * as chai from "chai";
import {ReturnPeriod, Validity, ValidityType} from "../../src/validitytype/ValidityType";
import {None, Some} from "ts-option";
import {LocalDate, DayOfWeek} from "js-joda";

describe("ValidityType", () => {

  it("know if a return journey is permitted", () => {
    const twoWeek = new ValidityType(
      "1E",
      "Some Validity",
      new Validity(0, 0, false),
      new Validity(14, 0, false),
      new ReturnPeriod(1, 0, new None())
    );

    const afterThurs = new ValidityType(
      "1E",
      "Some Validity",
      new Validity(0, 0, false),
      new Validity(14, 0, false),
      new ReturnPeriod(1, 0, new Some(DayOfWeek.THURSDAY))
    );

    const departureDate = LocalDate.parse("2016-12-13"); // Tuesday

    chai.expect(twoWeek.isValidOnDates(LocalDate.parse("2016-12-13"), departureDate)).to.equal(false);
    chai.expect(twoWeek.isValidOnDates(LocalDate.parse("2016-12-12"), departureDate)).to.equal(true);
    chai.expect(twoWeek.isValidOnDates(LocalDate.parse("2016-12-01"), departureDate)).to.equal(true);
    chai.expect(twoWeek.isValidOnDates(LocalDate.parse("2016-11-29"), departureDate)).to.equal(false);

    chai.expect(afterThurs.isValidOnDates(LocalDate.parse("2016-12-12"), departureDate)).to.equal(false);
    chai.expect(afterThurs.isValidOnDates(LocalDate.parse("2016-12-01"), departureDate)).to.equal(true);
  });

});
