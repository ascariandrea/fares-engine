import * as chai from "chai";
import {getStatus} from "./Status.spec";
import {Railcard} from "../../src/passenger/Railcard";
import {none, some} from "ts-option";
import {PassengerSet} from "../../src/passenger/PassengerSet";
import {fare} from "../fare/FareMockUtils";

describe("PassengerSet", () => {

  const statusH = getStatus("H");
  const statusF = getStatus("F");

  const publicRailcard = new Railcard(
    "",
    0,
    9,
    0,
    9,
    0,
    9,
    some("000"),
    some("001"),
    { }, // adult status discounts
    { 0: statusH, 1: statusF }, //child status discounts
    none,
    {},
    {}
  );

  const yngRailcard = new Railcard(
    "YNG",
    0,
    1,
    0,
    1,
    0,
    1,
    some("003"),
    some("001"),
    { 0: statusF, 1: statusH }, // adult status discounts
    { 0: statusH, 1: statusF }, // child status discounts
    none,
    {},
    {}
  );

  it("does not return a child status discount when there are no children in the passenger set", () => {
    const passengerSet = new PassengerSet(2, 0, [publicRailcard, publicRailcard]);
    const expected = [];
    const actual = Array.from(passengerSet.uniqueStatuses(fare));

    chai.expect(expected).to.deep.equal(actual);
  });

  it("returns child status discounts when there are children in the passenger set", () => {
    const passengerSet = new PassengerSet(2, 2, [publicRailcard, publicRailcard]);
    const expected = Array.from(new Map([[statusF, publicRailcard]]));
    const actual = Array.from(passengerSet.uniqueStatuses(fare));

    chai.expect(expected).to.deep.equal(actual);
  });

  it("returns railcard status discounts when a railcard is given", () => {
    const passengerSet = new PassengerSet(2, 2, [yngRailcard, yngRailcard, publicRailcard]);
    const expected = Array.from(new Map([
      [statusH, yngRailcard],
      [statusF, publicRailcard],
    ]));
    const actual = Array.from(passengerSet.uniqueStatuses(fare));

    chai.expect(expected).to.deep.equal(actual);
  });

});
