import * as chai from "chai";
import {CalendarRestriction} from "../../../src/restriction/CalendarRestriction";
import {CurrentFutureMarker, RestrictionDate} from "../../../src/restriction/RestrictionDate";
import {LocalDate} from "js-joda";
import {none} from "ts-option";
import {calendarRestrictionFilter} from "../../../src/fare/filter/CalendarRestrictionFilter";
import {createFare, createSingleFare} from "../FareMockUtils";
import {FarePreferences} from "../../../src/service/api/FareRequest";

const calendarRestrictions = {
  "SDS": new CalendarRestriction(
    "SDS",
    none,
    new RestrictionDate(
      LocalDate.parse("2017-08-18"),
      LocalDate.parse("2017-08-18"),
      CurrentFutureMarker.Current,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    )
  )
};

const filter = calendarRestrictionFilter(calendarRestrictions);
const invalidFare = createSingleFare(100);
const validFare = createFare(100);
const preferences = new FarePreferences(true, true, true, true, true);

describe("CalendarRestrictionFilter", () => {

  it("filters fares that have a calendar restriction", () => {
    chai.expect(filter(invalidFare, LocalDate.parse("2017-08-18"), preferences)).to.equal(false);
  });

  it("does not filter fares outside the date range", () => {
    chai.expect(filter(invalidFare, LocalDate.parse("2017-08-17"), preferences)).to.equal(true);
  });

  it("does not filter fares that have no restriction", () => {
    chai.expect(filter(validFare, LocalDate.parse("2017-08-18"), preferences)).to.equal(true);
  });

});