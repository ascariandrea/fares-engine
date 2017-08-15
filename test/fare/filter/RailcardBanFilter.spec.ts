import * as chai from "chai";
import {none, some} from "ts-option";
import {createSingleFare} from "../FareMockUtils";
import {disRailcard, yngRailcard} from "../../passenger/Railcard.spec";
import {RailcardBan} from "../../../src/passenger/Railcard";
import {railcardBanFilter} from "../../../src/fare/filter/RailcardBanFilter";

yngRailcard.bans["SDS"] = [new RailcardBan(none, some("SDS"), none)];

const invalidFare = createSingleFare(100, yngRailcard.adultStatus.get, yngRailcard);
const validFare = createSingleFare(200, disRailcard.childStatus.get, disRailcard);

describe("RailcardBanFilter", () => {

  it("filters fares that have a railcard ban", () => {
    chai.expect(railcardBanFilter(invalidFare)).to.equal(false);
  });

  it("does not filter fares where the railcard does not have a ban", () => {
    chai.expect(railcardBanFilter(validFare)).to.equal(true);
  });

});