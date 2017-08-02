import * as chai from "chai";
import {LocalDate, DayOfWeek} from "js-joda";
import {CurrentFutureMarker, RestrictionDate} from "../../src/restriction/RestrictionDate";

describe("RestrictionDate", () => {

  it("know if a restriction date applies", () => {
    const restrictionDate = new RestrictionDate(
      LocalDate.parse("2017-01-01"),
      LocalDate.parse("2017-02-01"),
      CurrentFutureMarker.Current,
      true,
      false,
      false,
      false,
      false,
      false,
      false
    );

    chai.expect(restrictionDate.matches(LocalDate.parse("2017-03-01"))).to.equal(false);
    chai.expect(restrictionDate.matches(LocalDate.parse("2017-01-01"))).to.equal(false); // Sunday
    chai.expect(restrictionDate.matches(LocalDate.parse("2017-01-02"))).to.equal(true); // Monday
  });

});
