import * as chai from "chai";
import {LocalDate} from "js-joda";
import {createAdvanceFare} from "../FareMockUtils";
import {advancePuchaseFilter} from "../../../src/fare/filter/AdvancePurchaseFilter";
import {FarePreferences} from "../../../src/service/api/FareRequest";
import {AdvancePurchase, CheckType} from "../../../src/tickettype/AdvancePurchase";
import {none, some} from "ts-option";

const advanceFare = createAdvanceFare(100);
const preferences = new FarePreferences(true, true, true, true, true);

describe("AdvancePurchaseFilter", () => {

  it("filters advance fares with check type 1", () => {
    const apData = {
      "2CC": [new AdvancePurchase("2CC", none, none, CheckType.Hours, 24, none)]
    };

    const filter = advancePuchaseFilter(apData);
    const now = LocalDate.now();
    const dayAfterTomorrow = now.plusDays(2);

    chai.expect(filter(advanceFare, now, preferences)).to.equal(false);
    chai.expect(filter(advanceFare, dayAfterTomorrow, preferences)).to.equal(true);
  });

  it("filters advance fares with check type 2", () => {
    const apData = {
      "2CC": [new AdvancePurchase("2CC", none, none, CheckType.Days, 1, none)]
    };

    const filter = advancePuchaseFilter(apData);
    const now = LocalDate.now();
    const dayAfterTomorrow = now.plusDays(2);

    chai.expect(filter(advanceFare, now, preferences)).to.equal(false);
    chai.expect(filter(advanceFare, dayAfterTomorrow, preferences)).to.equal(true);
  });

  xit("filters advance fares with check type 2 and a booking time", () => {
    // can't perform this test in a meaningful way while the current time is accessed in the filter function
  });

  it("doesn't filter advance fares where the restriction code doesn't match", () => {
    const apData = {
      "2CC": [new AdvancePurchase("2CC", some("2E"), none, CheckType.Days, 1, none)]
    };

    const filter = advancePuchaseFilter(apData);
    const now = LocalDate.now();
    const dayAfterTomorrow = now.plusDays(2);

    chai.expect(filter(advanceFare, now, preferences)).to.equal(true);
    chai.expect(filter(advanceFare, dayAfterTomorrow, preferences)).to.equal(true);
  });

  it("filters advance fares where the restriction code matches", () => {
    const apData = {
      "2CC": [new AdvancePurchase("2CC", some("LN"), none, CheckType.Days, 1, none)]
    };

    const filter = advancePuchaseFilter(apData);
    const now = LocalDate.now();
    const dayAfterTomorrow = now.plusDays(2);

    chai.expect(filter(advanceFare, now, preferences)).to.equal(false);
    chai.expect(filter(advanceFare, dayAfterTomorrow, preferences)).to.equal(true);
  });

  xit("filters advance fares where the TOC must match", () => {
    // can only be done when validating journeys?
  });

});