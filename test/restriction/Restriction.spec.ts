import * as chai from "chai";
import {some, none} from "ts-option";
import {LocalDate} from "js-joda";
import {CurrentFutureMarker, RestrictionDate} from "../../src/restriction/RestrictionDate";
import {
  Restriction, RestrictionDirection, RestrictionRules,
  ServiceRestriction
} from "../../src/restriction/Restriction";

describe("Restriction", () => {

  it("selects the current or future data set", () => {
    const currentDate = new RestrictionDate(
      LocalDate.parse("2017-01-01"),
      LocalDate.parse("2017-01-31"),
      CurrentFutureMarker.Current,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    );

    const futureDate = new RestrictionDate(
      LocalDate.parse("2017-02-01"),
      LocalDate.parse("2017-02-28"),
      CurrentFutureMarker.Future,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    );

    const restrictionDirection = new RestrictionDirection([], [], [], new ServiceRestriction([], []));
    const currentRules = new RestrictionRules(restrictionDirection, restrictionDirection);
    const futureRules = new RestrictionRules(restrictionDirection, restrictionDirection);

    const restriction = new Restriction(
      "LN",
      [currentDate, futureDate],
      currentRules,
      futureRules
    );

    chai.expect(restriction.get(LocalDate.parse("2017-01-05")).get).to.not.equal(futureRules);
    chai.expect(restriction.get(LocalDate.parse("2017-01-05")).get).to.equal(currentRules);
    chai.expect(restriction.get(LocalDate.parse("2017-02-05")).get).to.not.equal(currentRules);
    chai.expect(restriction.get(LocalDate.parse("2017-02-05")).get).to.equal(futureRules);
    chai.expect(restriction.get(LocalDate.parse("2017-03-05"))).to.equal(none);
  });

});
