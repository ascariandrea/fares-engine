import * as chai from "chai";
import {Fare} from "../../src/fare/Fare";
import {Status, StatusCode} from "../../src/passenger/Status";
import {some, none} from "ts-option";
import {Route} from "../../src/route/Route";
import {publicRailcard} from "./Railcard.spec";
import {LocalDate} from "js-joda";
import {Location} from "../../src/location/Location";
import {ticketType} from "../fare/FareMockUtils";
import {MinimumFare, Railcard} from "../../src/passenger/Railcard";

describe("Status", () => {

  it("can correctly apply type0 status discounts", () => {
    const status = getStatus("0");
    const [newFare] = status.apply(fare, publicRailcard, LocalDate.now());

    chai.expect(newFare.price).to.equal(500);
    chai.expect(newFare.statusCode).to.equal(Status.CHILD_STATUS_CODE);
  });

  it("can correctly apply typeF status discounts", () => {
    const status = getStatus("F", 100, 100);
    const [newFare] = status.apply(fare, publicRailcard, LocalDate.now());

    chai.expect(newFare.price).to.equal(100);
    chai.expect(newFare.statusCode).to.equal(Status.CHILD_STATUS_CODE);
  });

  it("can correctly apply typeM status discounts", () => {
    const status = getStatus("M", 100, 100);
    const [newFare] = status.apply(fare, publicRailcard, LocalDate.now());

    chai.expect(newFare.price).to.equal(500);
    chai.expect(newFare.statusCode).to.equal(Status.CHILD_STATUS_CODE);
  });

  it("can correctly apply typeL status discounts", () => {
    const status = getStatus("L", 0, 0, 600);
    const [newFare] = status.apply(fare, publicRailcard, LocalDate.now());

    chai.expect(newFare.price).to.equal(600);
    chai.expect(newFare.statusCode).to.equal(Status.CHILD_STATUS_CODE);
  });

  it("can correctly apply typeH status discounts", () => {
    const status = getStatus("H", 0, 0, 0, 600);
    const [newFare] = status.apply(fare, publicRailcard, LocalDate.now());

    chai.expect(newFare.price).to.equal(600);
    chai.expect(newFare.statusCode).to.equal(Status.CHILD_STATUS_CODE);
  });

  it("return fare with railcard minimum price applied", () => {
    const minimumFares = {
      "SOR": [
        new MinimumFare(800, LocalDate.parse("2017-01-01"), LocalDate.parse("2017-05-31")),
        new MinimumFare(900, LocalDate.parse("2017-07-01"), LocalDate.parse("2017-12-31"))
      ]
    };

    const railcardWithMin = new Railcard("YNG", 0, 0, 9, 9, 0, 9, some("013"), none, {}, {}, none, {}, minimumFares, false, []);


    const status = getStatus("0", 0, 0, 0, 600, 0, 0, 0, 0, 500, 1, "013");
    const [minimum, newFare] = status.apply(fare, railcardWithMin, LocalDate.parse("2017-01-02"));

    chai.expect(newFare.price).to.equal(500);
    chai.expect(newFare.statusCode).to.equal("013");
    chai.expect(minimum.price).to.equal(800);
    chai.expect(minimum.statusCode).to.equal("013");
  });

  it("will not apply the status if the railcard doesn't apply", () => {
    const geography = [fare.destination.nlc];
    const railcard = new Railcard("", 0, 0, 9, 9, 0, 9, some("000"), some("001"), {}, {}, none, {}, {}, true, geography);
    const status = getStatus("0");
    const fares = status.apply(fare, railcard, LocalDate.now());

    chai.expect(fares.length).to.equal(0);
  });

});

const fare = new Fare(
  new Location("5235", none, {}, []),
  new Location("5224", none, {}, []),
  new Route("00000", "", [], []),
  ticketType,
  "000",
  1003,
  publicRailcard,
  none,
  none,
  1,
  false
);


export function getStatus(indicator: string,
                          stdSingleMaxFlat: number = 0,
                          stdReturnMaxFlat: number = 0,
                          stdLowerMin: number = 0,
                          stdHigherMin: number = 0,
                          firstSingleMaxFlat: number = 0,
                          firstReturnMaxFlat: number = 0,
                          firstLowerMin: number = 0,
                          firstHigherMin: number = 0,
                          amount: number = 500,
                          category: number = 1,
                          status: StatusCode = Status.CHILD_STATUS_CODE): Status {
  return new Status(
    status,
    stdSingleMaxFlat,
    stdReturnMaxFlat,
    stdLowerMin,
    stdHigherMin,
    firstSingleMaxFlat,
    firstReturnMaxFlat,
    firstLowerMin,
    firstHigherMin,
    category,
    indicator,
    amount,
    true,
    true,
    true,
    true
  );
}