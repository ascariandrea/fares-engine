import * as chai from "chai";
import * as sinon from "sinon";
import {createSingleFare} from "./FareMockUtils";
import {Status} from "../../src/passenger/Status";
import {Fare, FareMap} from "../../src/fare/Fare";
import {FlowFareRepository} from "../../src/fare/repository/FlowFareRepository";
import {publicRailcard} from "../passenger/Railcard.spec";
import {NonDerivableFareRepository} from "../../src/fare/repository/NonDerivableFareRepository";
import {FareService} from "../../src/fare/FareService";
import {FarePreferences, FareRequest} from "../../src/service/api/FareRequest";
import {LocalDate} from "js-joda/dist/js-joda";
import {none} from "ts-option";
import {PassengerSet} from "../../src/passenger/PassengerSet";
import {Location} from "../../src/location/Location";
import {farePreferencesFilter} from "../../src/fare/filter/FarePreferencesFilter";
import {suppressedFareFilter} from "../../src/fare/filter/SuppressedFareFilter";

describe("FareService", () => {

  it("returns flow and non-derivable fares", async() => {
    const flowFare = createSingleFare(100);
    const ndfFare = createSingleFare(200, Status.CHILD_STATUS_CODE);

    const flows = mockFlowRepository(flowFare);
    const ndfs = mockNDFRepository(ndfFare);
    const service = new FareService(flows, ndfs, []);

    const fares = await service.getFares(mockRequest());

    chai.expect(fares.outwardSingles[0]).to.equal(flowFare);
    chai.expect(fares.outwardSingles[1]).to.equal(ndfFare);
  });

  it("favours non-derivable fares over flow fares", async () => {
    const flowFare = createSingleFare(100);
    const ndfFare = createSingleFare(200);

    const flows = mockFlowRepository(flowFare);
    const ndfs = mockNDFRepository(ndfFare);
    const service = new FareService(flows, ndfs, []);

    const fares = await service.getFares(mockRequest());

    chai.expect(fares.outwardSingles[0]).to.equal(ndfFare);
    chai.expect(fares.outwardSingles.length).to.equal(1);
  });

  it("filters fares if any single filter check fails", async () => {
    const flowFare = createSingleFare(0);
    const ndfFare = createSingleFare(200, Status.CHILD_STATUS_CODE);

    const flows = mockFlowRepository(flowFare);
    const ndfs = mockNDFRepository(ndfFare);
    const service = new FareService(flows, ndfs, [farePreferencesFilter, suppressedFareFilter]);

    const fares = await service.getFares(mockRequest());

    chai.expect(fares.outwardSingles[0]).to.equal(ndfFare);
    chai.expect(fares.outwardSingles.length).to.equal(1);
  });

  it("returns fares sorted by price", async () => {
    const flowFare = createSingleFare(300);
    const ndfFare = createSingleFare(200, Status.CHILD_STATUS_CODE);

    const flows = mockFlowRepository(flowFare);
    const ndfs = mockNDFRepository(ndfFare);
    const service = new FareService(flows, ndfs, []);

    const fares = await service.getFares(mockRequest());

    chai.expect(fares.outwardSingles[0]).to.equal(ndfFare);
    chai.expect(fares.outwardSingles[1]).to.equal(flowFare);
  });

});

function mockFlowRepository(...fares: Fare[]): FlowFareRepository {
  const repo = new FlowFareRepository({}, {}, {}, {}, publicRailcard, {});
  const fareMap: FareMap = {};

  for (const fare of fares) {
    fareMap[fare.id] = fare;
  }

  sinon.stub(repo, "getFares").returns(Promise.resolve(fareMap));

  return repo;
}

function mockNDFRepository(...fares: Fare[]): NonDerivableFareRepository {
  const repo = new NonDerivableFareRepository({}, {}, {}, {}, {}, {});
  const fareMap: FareMap = {};

  for (const fare of fares) {
    fareMap[fare.id] = fare;
  }

  sinon.stub(repo, "getFares").returns(Promise.resolve(fareMap));

  return repo;
}

function mockRequest(): FareRequest {
  return new FareRequest(
    new Location("A", none, {}, []),
    new Location("B", none, {}, []),
    LocalDate.parse("2017-08-18"),
    none,
    new PassengerSet(1, 1, [publicRailcard]),
    new FarePreferences(true, true, true, true, true)
  );
}