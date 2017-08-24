import * as chai from "chai";
import {Status} from "../../src/passenger/Status";
import {PassengerSet} from "../../src/passenger/PassengerSet";
import {dicRailcard, disRailcard, publicRailcard, yngRailcard} from "../passenger/Railcard.spec";
import {CheapestFareOptionFactory} from "../../src/fare/CheapestFareOptionFactory";
import {advanceTicketType, createFare, route} from "./FareMockUtils";

describe("CheapestFareOptionFactory", () => {

  it("gets fare for a single adult", () => {
    const fares = [
      createFare(1500, Status.CHILD_STATUS_CODE),
      createFare(1500),
      createFare(2000, Status.CHILD_STATUS_CODE),
      createFare(2000)
    ];

    const passengerSet = new PassengerSet(1, 0, [publicRailcard]);
    const option = CheapestFareOptionFactory.getFareOption(fares, passengerSet, {});

    chai.expect(option.get.fares.length).to.equal(1);
    chai.expect(option.get.fares[0].adults).to.equal(1);
    chai.expect(option.get.fares[0].children).to.equal(0);
    chai.expect(option.get.fares[0].fare).to.deep.equal(createFare(1500));
  });

  it("gets fare for a single child", () => {
    const fares = [
      createFare(1500, Status.CHILD_STATUS_CODE),
      createFare(1500),
      createFare(2000, Status.CHILD_STATUS_CODE),
      createFare(2000)
    ];

    const passengerSet = new PassengerSet(0, 1, [publicRailcard]);
    const option = CheapestFareOptionFactory.getFareOption(fares, passengerSet, {});

    chai.expect(option.get.fares.length).to.equal(1);
    chai.expect(option.get.fares[0].adults).to.equal(0);
    chai.expect(option.get.fares[0].children).to.equal(1);
    chai.expect(option.get.fares[0].fare).to.deep.equal(createFare(1500, Status.CHILD_STATUS_CODE));
  });

  it("gets fare for two adults and two children", () => {
    const fares = [
      createFare(1500, Status.CHILD_STATUS_CODE),
      createFare(1500),
      createFare(2000, Status.CHILD_STATUS_CODE),
      createFare(2000)
    ];

    const passengerSet = new PassengerSet(2, 2, [publicRailcard]);
    const option = CheapestFareOptionFactory.getFareOption(fares, passengerSet, {});

    chai.expect(option.get.fares.length).to.equal(4);

    chai.expect(option.get.fares[0].adults).to.equal(1);
    chai.expect(option.get.fares[0].children).to.equal(0);
    chai.expect(option.get.fares[0].fare).to.deep.equal(createFare(1500));

    chai.expect(option.get.fares[1].adults).to.equal(1);
    chai.expect(option.get.fares[1].children).to.equal(0);
    chai.expect(option.get.fares[1].fare).to.deep.equal(createFare(1500));

    chai.expect(option.get.fares[2].adults).to.equal(0);
    chai.expect(option.get.fares[2].children).to.equal(1);
    chai.expect(option.get.fares[2].fare).to.deep.equal(createFare(1500, Status.CHILD_STATUS_CODE));

    chai.expect(option.get.fares[3].adults).to.equal(0);
    chai.expect(option.get.fares[3].children).to.equal(1);
    chai.expect(option.get.fares[3].fare).to.deep.equal(createFare(1500, Status.CHILD_STATUS_CODE));
  });

  it("gets fare for two adults and two children with a railcard", () => {
    const fares = [
      createFare(1500, Status.CHILD_STATUS_CODE),
      createFare(1500, yngRailcard.adultStatus.get, yngRailcard),
      createFare(2000, Status.CHILD_STATUS_CODE),
      createFare(2000)
    ];

    const passengerSet = new PassengerSet(2, 2, [yngRailcard, publicRailcard]);
    const option = CheapestFareOptionFactory.getFareOption(fares, passengerSet, {});

    chai.expect(option.get.fares.length).to.equal(4);

    chai.expect(option.get.fares[0].adults).to.equal(1);
    chai.expect(option.get.fares[0].children).to.equal(0);
    chai.expect(option.get.fares[0].fare).to.deep.equal(createFare(1500, yngRailcard.adultStatus.get, yngRailcard));

    chai.expect(option.get.fares[1].adults).to.equal(1);
    chai.expect(option.get.fares[1].children).to.equal(0);
    chai.expect(option.get.fares[1].fare).to.deep.equal(createFare(2000));

    chai.expect(option.get.fares[2].adults).to.equal(0);
    chai.expect(option.get.fares[2].children).to.equal(1);
    chai.expect(option.get.fares[2].fare).to.deep.equal(createFare(1500, Status.CHILD_STATUS_CODE));

    chai.expect(option.get.fares[3].adults).to.equal(0);
    chai.expect(option.get.fares[3].children).to.equal(1);
    chai.expect(option.get.fares[3].fare).to.deep.equal(createFare(1500, Status.CHILD_STATUS_CODE));
  });

  it("gets fare for two adults and two children with three railcards", () => {
    const fares = [
      createFare(1500, Status.CHILD_STATUS_CODE),
      createFare(1500, yngRailcard.adultStatus.get, yngRailcard),
      createFare(2000, Status.CHILD_STATUS_CODE),
      createFare(2000)
    ];

    const passengerSet = new PassengerSet(2, 2, [yngRailcard, yngRailcard, yngRailcard, publicRailcard]);
    const option = CheapestFareOptionFactory.getFareOption(fares, passengerSet, {});

    chai.expect(option.get.fares.length).to.equal(4);

    chai.expect(option.get.fares[0].adults).to.equal(1);
    chai.expect(option.get.fares[0].children).to.equal(0);
    chai.expect(option.get.fares[0].fare).to.deep.equal(createFare(1500, yngRailcard.adultStatus.get, yngRailcard));

    chai.expect(option.get.fares[1].adults).to.equal(1);
    chai.expect(option.get.fares[1].children).to.equal(0);
    chai.expect(option.get.fares[1].fare).to.deep.equal(createFare(1500, yngRailcard.adultStatus.get, yngRailcard));

    chai.expect(option.get.fares[2].adults).to.equal(0);
    chai.expect(option.get.fares[2].children).to.equal(1);
    chai.expect(option.get.fares[2].fare).to.deep.equal(createFare(1500, Status.CHILD_STATUS_CODE));

    chai.expect(option.get.fares[3].adults).to.equal(0);
    chai.expect(option.get.fares[3].children).to.equal(1);
    chai.expect(option.get.fares[3].fare).to.deep.equal(createFare(1500, Status.CHILD_STATUS_CODE));
  });

  it("gets fare with a multi-passenger railcard", () => {
    const fares = [
      createFare(1000, disRailcard.childStatus.get, disRailcard),
      createFare(1500, disRailcard.adultStatus.get, disRailcard),
      createFare(2000, Status.CHILD_STATUS_CODE),
      createFare(2500)
    ];

    const passengerSet = new PassengerSet(2, 2, [disRailcard, publicRailcard]);
    const option = CheapestFareOptionFactory.getFareOption(fares, passengerSet, {});

    chai.expect(option.get.fares.length).to.equal(4);

    chai.expect(option.get.fares[0].adults).to.equal(1);
    chai.expect(option.get.fares[0].children).to.equal(0);
    chai.expect(option.get.fares[0].fare).to.deep.equal(createFare(1500, disRailcard.adultStatus.get, disRailcard));

    chai.expect(option.get.fares[1].adults).to.equal(1);
    chai.expect(option.get.fares[1].children).to.equal(0);
    chai.expect(option.get.fares[1].fare).to.deep.equal(createFare(1500, disRailcard.adultStatus.get, disRailcard));

    chai.expect(option.get.fares[2].adults).to.equal(0);
    chai.expect(option.get.fares[2].children).to.equal(1);
    chai.expect(option.get.fares[2].fare).to.deep.equal(createFare(2000, Status.CHILD_STATUS_CODE));

    chai.expect(option.get.fares[3].adults).to.equal(0);
    chai.expect(option.get.fares[3].children).to.equal(1);
    chai.expect(option.get.fares[3].fare).to.deep.equal(createFare(2000, Status.CHILD_STATUS_CODE));
  });

  it("gets fare with a multi-passenger railcard where it's cheaper to apply to the adults", () => {
    const fares = [
      createFare(1000, disRailcard.childStatus.get, disRailcard),
      createFare(1500, disRailcard.adultStatus.get, disRailcard),
      createFare(2000, Status.CHILD_STATUS_CODE),
      createFare(3000)
    ];

    const passengerSet = new PassengerSet(2, 2, [disRailcard, publicRailcard]);
    const option = CheapestFareOptionFactory.getFareOption(fares, passengerSet, {});

    chai.expect(option.get.fares.length).to.equal(4);

    chai.expect(option.get.fares[0].adults).to.equal(1);
    chai.expect(option.get.fares[0].children).to.equal(0);
    chai.expect(option.get.fares[0].fare).to.deep.equal(createFare(1500, disRailcard.adultStatus.get, disRailcard));

    chai.expect(option.get.fares[1].adults).to.equal(1);
    chai.expect(option.get.fares[1].children).to.equal(0);
    chai.expect(option.get.fares[1].fare).to.deep.equal(createFare(1500, disRailcard.adultStatus.get, disRailcard));

    chai.expect(option.get.fares[2].adults).to.equal(0);
    chai.expect(option.get.fares[2].children).to.equal(1);
    chai.expect(option.get.fares[2].fare).to.deep.equal(createFare(2000, Status.CHILD_STATUS_CODE));

    chai.expect(option.get.fares[3].adults).to.equal(0);
    chai.expect(option.get.fares[3].children).to.equal(1);
    chai.expect(option.get.fares[3].fare).to.deep.equal(createFare(2000, Status.CHILD_STATUS_CODE));
  });

  xit("gets fare with a multi-passenger railcard where it's cheaper to apply to the child", () => {
    const fares = [
      createFare(1000, disRailcard.childStatus.get, disRailcard),
      createFare(2000, disRailcard.adultStatus.get, disRailcard),
      createFare(3000, Status.CHILD_STATUS_CODE),
      createFare(3100)
    ];

    const passengerSet = new PassengerSet(2, 2, [disRailcard, publicRailcard]);
    const option = CheapestFareOptionFactory.getFareOption(fares, passengerSet, {});

    chai.expect(option.get.fares.length).to.equal(4);

    chai.expect(option.get.fares[0].adults).to.equal(1);
    chai.expect(option.get.fares[0].children).to.equal(0);
    chai.expect(option.get.fares[0].fare).to.deep.equal(createFare(2000, disRailcard.adultStatus.get, disRailcard));

    chai.expect(option.get.fares[1].adults).to.equal(1);
    chai.expect(option.get.fares[1].children).to.equal(0);
    chai.expect(option.get.fares[1].fare).to.deep.equal(createFare(3100, Status.ADULT_STATUS_CODE));

    chai.expect(option.get.fares[2].adults).to.equal(0);
    chai.expect(option.get.fares[2].children).to.equal(1);
    chai.expect(option.get.fares[2].fare).to.deep.equal(createFare(1000, disRailcard.childStatus.get, disRailcard));

    chai.expect(option.get.fares[3].adults).to.equal(0);
    chai.expect(option.get.fares[3].children).to.equal(1);
    chai.expect(option.get.fares[3].fare).to.deep.equal(createFare(3000, Status.CHILD_STATUS_CODE));
  });

  it("gets fare when a railcard can't be applied", () => {
    const fares = [
      createFare(1000, dicRailcard.childStatus.get, dicRailcard),
      createFare(1500, dicRailcard.adultStatus.get, dicRailcard),
      createFare(2000, Status.CHILD_STATUS_CODE),
      createFare(3000)
    ];

    const passengerSet = new PassengerSet(2, 0, [dicRailcard, publicRailcard]);
    const option = CheapestFareOptionFactory.getFareOption(fares, passengerSet, {});

    chai.expect(option.get.fares.length).to.equal(2);

    chai.expect(option.get.fares[0].adults).to.equal(1);
    chai.expect(option.get.fares[0].children).to.equal(0);
    chai.expect(option.get.fares[0].fare).to.deep.equal(createFare(3000));

    chai.expect(option.get.fares[1].adults).to.equal(1);
    chai.expect(option.get.fares[1].children).to.equal(0);
    chai.expect(option.get.fares[1].fare).to.deep.equal(createFare(3000));
  });

  it("gets the cheapest fare when it's better not to apply a railcard", () => {
    const fares = [
      createFare(1000, Status.CHILD_STATUS_CODE),
      createFare(1500, disRailcard.childStatus.get, disRailcard),
      createFare(2000, disRailcard.adultStatus.get, disRailcard),
      createFare(3000)
    ];

    const passengerSet = new PassengerSet(1, 1, [disRailcard, publicRailcard]);
    const option = CheapestFareOptionFactory.getFareOption(fares, passengerSet, {});

    chai.expect(option.get.fares.length).to.equal(2);

    chai.expect(option.get.fares[0].adults).to.equal(1);
    chai.expect(option.get.fares[0].children).to.equal(0);
    chai.expect(option.get.fares[0].fare).to.deep.equal(createFare(2000, disRailcard.adultStatus.get, disRailcard));

    chai.expect(option.get.fares[1].adults).to.equal(0);
    chai.expect(option.get.fares[1].children).to.equal(1);
    chai.expect(option.get.fares[1].fare).to.deep.equal(createFare(1000, Status.CHILD_STATUS_CODE));
  });

  it("only uses available fares", () => {
    const fares = [
      createFare(1500, Status.ADULT_STATUS_CODE, publicRailcard, route, advanceTicketType),
      createFare(2000)
    ];

    const passengerSet = new PassengerSet(1, 0, [publicRailcard]);
    const option = CheapestFareOptionFactory.getFareOption(fares, passengerSet, {
      "2CC": 0
    });

    chai.expect(option.get.fares.length).to.equal(1);
    chai.expect(option.get.fares[0].adults).to.equal(1);
    chai.expect(option.get.fares[0].children).to.equal(0);
    chai.expect(option.get.fares[0].fare).to.deep.equal(createFare(2000));
  });

  it("splits passengers over multiple fare types depending on availability", () => {
    const fares = [
      createFare(1500, Status.ADULT_STATUS_CODE, publicRailcard, route, advanceTicketType),
      createFare(2000)
    ];

    const passengerSet = new PassengerSet(2, 0, [publicRailcard]);
    const option = CheapestFareOptionFactory.getFareOption(fares, passengerSet, {
      "2CC": 1
    });

    chai.expect(option.get.fares.length).to.equal(2);
    chai.expect(option.get.fares[0].adults).to.equal(1);
    chai.expect(option.get.fares[0].children).to.equal(0);
    chai.expect(option.get.fares[0].fare.ticketType.code).to.equal("2CC");
    chai.expect(option.get.fares[1].adults).to.equal(1);
    chai.expect(option.get.fares[1].children).to.equal(0);
    chai.expect(option.get.fares[1].fare.ticketType.code).to.equal("SOR");
  });

  it("shares availability of ticket types between adults and children", () => {
    const fares = [
      createFare(1500, Status.ADULT_STATUS_CODE, publicRailcard, route, advanceTicketType),
      createFare(1500, Status.CHILD_STATUS_CODE, publicRailcard, route, advanceTicketType),
      createFare(2000),
      createFare(2000, Status.CHILD_STATUS_CODE)
    ];

    const passengerSet = new PassengerSet(2, 2, [publicRailcard]);
    const option = CheapestFareOptionFactory.getFareOption(fares, passengerSet, {
      "2CC": 2
    });

    chai.expect(option.get.fares.length).to.equal(4);
    chai.expect(option.get.fares[0].adults).to.equal(1);
    chai.expect(option.get.fares[0].children).to.equal(0);
    chai.expect(option.get.fares[0].fare.ticketType.code).to.equal("2CC");
    chai.expect(option.get.fares[1].adults).to.equal(1);
    chai.expect(option.get.fares[1].children).to.equal(0);
    chai.expect(option.get.fares[1].fare.ticketType.code).to.equal("2CC");
    chai.expect(option.get.fares[2].adults).to.equal(0);
    chai.expect(option.get.fares[2].children).to.equal(1);
    chai.expect(option.get.fares[2].fare.ticketType.code).to.equal("SOR");
    chai.expect(option.get.fares[3].adults).to.equal(0);
    chai.expect(option.get.fares[3].children).to.equal(1);
    chai.expect(option.get.fares[3].fare.ticketType.code).to.equal("SOR");
  });
});