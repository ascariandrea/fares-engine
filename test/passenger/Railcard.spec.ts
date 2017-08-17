import * as chai from "chai";
import {Railcard, MinimumFare, RailcardBan} from "../../src/passenger/Railcard";
import {none, some} from "ts-option";
import {LocalDate} from "js-joda";
import {Location} from "../../src/location/Location";
import {fare} from "../fare/FareMockUtils";

export const publicRailcard = new Railcard(
  "",
  0,
  9,
  0,
  9,
  0,
  9,
  some("000"),
  some("001"),
  {},
  {},
  none,
  {},
  {},
  false,
  []
);

export const yngRailcard = new Railcard(
  "YNG",
  0,
  1,
  0,
  1,
  0,
  1,
  some("003"),
  none,
  {},
  {},
  none,
  {},
  {},
  false,
  []
);

export const disRailcard = new Railcard(
  "DIS",
  1,
  2,
  0,
  1,
  1,
  2,
  some("063"),
  some("064"),
  {},
  {},
  none,
  {},
  {},
  false,
  []
);

export const dicRailcard = new Railcard(
  "DIC",
  1,
  2,
  1,
  1,
  1,
  2,
  some("063"),
  some("064"),
  {},
  {},
  none,
  {},
  {},
  false,
  []
);

describe("Railcard", () => {

  it("get the minimum fare amount", () => {
    const minimumFares = {
      "SOS": [
        new MinimumFare(100, LocalDate.parse("2017-01-01"), LocalDate.parse("2017-05-31")),
        new MinimumFare(200, LocalDate.parse("2017-07-01"), LocalDate.parse("2017-12-31"))
      ]
    };

    const railcard = new Railcard("", 0, 0, 9, 9, 0, 9, some("000"), some("001"), {}, {}, none, {}, minimumFares, false, []);

    chai.expect(railcard.getMinimumFare("SOR", LocalDate.parse("2017-02-01"))).to.deep.equal(none);
    chai.expect(railcard.getMinimumFare("SOS", LocalDate.parse("2017-02-01"))).to.deep.equal(some(100));
    chai.expect(railcard.getMinimumFare("SOS", LocalDate.parse("2017-06-01"))).to.deep.equal(none);
    chai.expect(railcard.getMinimumFare("SOS", LocalDate.parse("2017-12-01"))).to.deep.equal(some(200));
  });

  it("will apply the railcard if no geography is set", () => {
    const railcard = new Railcard("", 0, 0, 9, 9, 0, 9, some("000"), some("001"), {}, {}, none, {}, {}, false, []);

    chai.expect(railcard.canBeApplied(fare.origin.nlc, fare.destination.nlc)).to.equal(true);
  });


  it("will apply the railcard if the railcard geography permits", () => {
    const geography = [fare.destination.nlc, fare.origin.nlc];
    const railcard = new Railcard("", 0, 0, 9, 9, 0, 9, some("000"), some("001"), {}, {}, none, {}, {}, true, geography);

    chai.expect(railcard.canBeApplied(fare.origin.nlc, fare.destination.nlc)).to.equal(true);
  });

  it("will not apply the railcard if the railcard geography does not permit", () => {
    const geography = [fare.destination.nlc];
    const railcard = new Railcard("", 0, 0, 9, 9, 0, 9, some("000"), some("001"), {}, {}, none, {}, {}, true, geography);

    chai.expect(railcard.canBeApplied(fare.origin.nlc, fare.destination.nlc)).to.equal(false);
  });

});

describe("RailcardBan", () => {

  it("knows when it should be applied", () => {
    let ban = new RailcardBan(none, some("SOR"), none);

    chai.expect(ban.applies(new Location("1111", some("TON"), {}, []), "SOR", "00000")).to.equal(true);
    chai.expect(ban.applies(new Location("1111", none, {}, []), "SOR", "00000")).to.equal(true);
    chai.expect(ban.applies(new Location("1111", none, {}, []), "SOS", "00000")).to.equal(false);

    ban = new RailcardBan(some("TBW"), none, none);

    chai.expect(ban.applies(new Location("1111", some("TON"), {}, []), "SOR", "00000")).to.equal(false);
    chai.expect(ban.applies(new Location("1111", some("TBW"), {}, []), "SOR", "00000")).to.equal(true);
    chai.expect(ban.applies(new Location("1111", some("TBW"), {}, []), "SOS", "00000")).to.equal(true);

    ban = new RailcardBan(none, none, some("00215"));

    chai.expect(ban.applies(new Location("1111", some("TON"), {}, []), "SOR", "00000")).to.equal(false);
    chai.expect(ban.applies(new Location("1111", some("TBW"), {}, []), "SOR", "00215")).to.equal(true);
    chai.expect(ban.applies(new Location("1111", some("TBW"), {}, []), "SOS", "00215")).to.equal(true);

    ban = new RailcardBan(some("TBW"), some("SOR"), some("00215"));

    chai.expect(ban.applies(new Location("1111", some("TON"), {}, []), "SOS", "00000")).to.equal(false);
    chai.expect(ban.applies(new Location("1111", some("TON"), {}, []), "SOR", "00000")).to.equal(false);
    chai.expect(ban.applies(new Location("1111", some("TON"), {}, []), "SOR", "00215")).to.equal(false);

    chai.expect(ban.applies(new Location("1111", some("TBW"), {}, []), "SOS", "00000")).to.equal(false);
    chai.expect(ban.applies(new Location("1111", some("TBW"), {}, []), "SOR", "00000")).to.equal(false);
    chai.expect(ban.applies(new Location("1111", some("TBW"), {}, []), "SOR", "00215")).to.equal(true);
  });

});