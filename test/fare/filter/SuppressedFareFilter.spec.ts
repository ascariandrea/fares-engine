import * as chai from "chai";
import {createSingleFare} from "../FareMockUtils";
import {suppressedFareFilter} from "../../../src/fare/filter/SuppressedFareFilter";

const invalidFare = createSingleFare(0);
const validFare = createSingleFare(200);

describe("SuppressedFareFilter", () => {

  it("filters fares that have no price", () => {
    chai.expect(suppressedFareFilter(invalidFare)).to.equal(false);
  });

  it("does not filter fares that have a price", () => {
    chai.expect(suppressedFareFilter(validFare)).to.equal(true);
  });

});