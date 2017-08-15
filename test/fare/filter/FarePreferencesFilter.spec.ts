import * as chai from "chai";
import {createAdvanceFare, createFare, createFirstClassFare, createSingleFare} from "../FareMockUtils";
import {FarePreferences} from "../../../src/service/api/FareRequest";
import {farePreferencesFilter} from "../../../src/fare/filter/FarePreferencesFilter";
import {LocalDate} from "js-joda";

const singleFare = createSingleFare(100);
const returnFare = createFare(200);
const advanceFare = createAdvanceFare(50);
const firstClassFare = createFirstClassFare(300);

describe("FarePreferencesFilter", () => {

  it("filters first class fares", () => {
    const preferences = new FarePreferences(false, true, true, true, true);

    chai.expect(farePreferencesFilter(firstClassFare, LocalDate.parse("2017-08-01"), preferences)).to.equal(false);
    chai.expect(farePreferencesFilter(returnFare, LocalDate.parse("2017-08-01"), preferences)).to.equal(true);
  });

  it("filters standard class fares", () => {
    const preferences = new FarePreferences(true, false, true, true, true);

    chai.expect(farePreferencesFilter(returnFare, LocalDate.parse("2017-08-01"), preferences)).to.equal(false);
    chai.expect(farePreferencesFilter(firstClassFare, LocalDate.parse("2017-08-01"), preferences)).to.equal(true);
  });

  it("filters singles", () => {
    const preferences = new FarePreferences(true, true, false, true, true);

    chai.expect(farePreferencesFilter(singleFare, LocalDate.parse("2017-08-01"), preferences)).to.equal(false);
    chai.expect(farePreferencesFilter(returnFare, LocalDate.parse("2017-08-01"), preferences)).to.equal(true);
  });

  it("filters singles", () => {
    const preferences = new FarePreferences(true, true, true, false, true);

    chai.expect(farePreferencesFilter(returnFare, LocalDate.parse("2017-08-01"), preferences)).to.equal(false);
    chai.expect(farePreferencesFilter(singleFare, LocalDate.parse("2017-08-01"), preferences)).to.equal(true);
  });

  it("filters Advance fares", () => {
    const preferences = new FarePreferences(true, true, true, true, false);

    chai.expect(farePreferencesFilter(advanceFare, LocalDate.parse("2017-08-01"), preferences)).to.equal(false);
    chai.expect(farePreferencesFilter(returnFare, LocalDate.parse("2017-08-01"), preferences)).to.equal(true);
  });

});