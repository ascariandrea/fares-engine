import * as chai from "chai";
import {createSingleFare} from "../FareMockUtils";
import {LocalDate} from "js-joda";
import {ticketTypeDateFilter} from "../../../src/fare/filter/TicketTypeDateFilter";

const fare = createSingleFare(200);

describe("TicketTypeDateFilter", () => {

  it("filters fares where the start date is after the travel date", () => {
    chai.expect(ticketTypeDateFilter(fare, LocalDate.now().minusDays(1))).to.equal(false);
  });

  it("does not filter fares in the correct date", () => {
    chai.expect(ticketTypeDateFilter(fare, LocalDate.now())).to.equal(true);
  });

  it("filters fares where the end date is before the travel date", () => {
    chai.expect(ticketTypeDateFilter(fare, LocalDate.now().plusDays(1))).to.equal(false);
  });

});