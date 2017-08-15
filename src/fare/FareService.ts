import {FlowFareRepository} from "./repository/FlowFareRepository";
import {NonDerivableFareRepository} from "./repository/NonDerivableFareRepository";
import {LocalDate} from "js-joda";
import {Fare} from "./Fare";
import {PassengerSet} from "../passenger/PassengerSet";
import {Location} from "../location/Location";
import {FarePreferences, FareRequest} from "../service/api/FareRequest";
import {SortedFareList} from "./CheapestFareOptionFactory";
import {FareFilter} from "./filter/FareFilter";

/**
 * Service that uses a FlowRepository and NonDerivableFareRepository to return fares using the local database.
 */
export class FareService {

  constructor(
    private readonly flowRepository: FlowFareRepository,
    private readonly nonDerivableRepository: NonDerivableFareRepository,
    private readonly filters: FareFilter[]
  ) {}

  /**
   * Do a fares search using the flow and NDF repositories
   */
  public async getFares(request: FareRequest): Promise<FareServiceResponse> {
    return request.returnDate.match({
      none: () => this.getFaresForSingleJourney(request),
      some: returnDate => this.getFaresForReturnJourney(request, request.outwardDate, returnDate)
    });
  }

  /**
   * For a one-way query we just delegate the call to getFaresForDate and extract the singles
   */
  private async getFaresForSingleJourney(request: FareRequest): Promise<FareServiceResponse> {
    const fares = await this.getFaresForDate(
      request.origin,
      request.destination,
      request.passengerSet,
      request.outwardDate,
      request.farePreferences
    );

    return new FareServiceResponse(fares.singles, [], []);
  }

  /**
   * For a return query we get the singles and returns from the outward and the singles from the return date. We also check
   * that the validity period of returns matches the input date range
   */
  private async getFaresForReturnJourney(request: FareRequest, outwardDate: LocalDate, returnDate: LocalDate): Promise<FareServiceResponse> {
    const [outwardFares, returnFares] = await Promise.all([
      this.getFaresForDate(request.origin, request.destination, request.passengerSet, outwardDate, request.farePreferences),
      this.getFaresForDate(request.destination, request.origin, request.passengerSet, returnDate, request.farePreferences),
    ]);

    const returns = outwardFares.returns.filter(f => f.ticketType.validityType.isValidOnDates(outwardDate, returnDate));

    return new FareServiceResponse(outwardFares.singles, returnFares.singles, returns);
  }

  /**
   * Merge the flow and non-derivable fares (NDFs taking priority), filter the fares and then return them partitioned
   * by type (single/return/season) and sorted by price.
   */
  private async getFaresForDate(origin: Location,
                                destination: Location,
                                passengerSet: PassengerSet,
                                date: LocalDate,
                                farePreferences: FarePreferences): Promise<PartitionedFares> {

    const [nonDerivableFares, flowFares] = await Promise.all([
      this.nonDerivableRepository.getFares(origin, destination, passengerSet, date),
      this.flowRepository.getFares(origin, destination, passengerSet, date)
    ]);

    // merge in the NDFs, overwriting flow fares that have the same ID (mutates flowFares for performance)
    const fares = Object.assign(flowFares, nonDerivableFares);

    // remove any fares that do not pass all the filter functions, then group the fares by type
    const result = Object
      .values(fares)
      .filter(fare => this.filters.every(filter => filter(fare, date, farePreferences)))
      .reduce(partitionByType, { singles: [], returns: [], seasons: [] });

    // sort the fares by price
    result.singles.sort(sortByPrice);
    result.returns.sort(sortByPrice);

    return result;
  }

}

/**
 * Group the fares by type (single, return, season).
 */
function partitionByType(result: PartitionedFares, fare: Fare): PartitionedFares {
    if (fare.ticketType.isSeason) result.seasons.push(fare);
    else if (fare.ticketType.isReturn) result.returns.push(fare);
    else result.singles.push(fare);

    return result;
}

/**
 * Sort fares by price, cheapest first (ascending)
 */
function sortByPrice(a: Fare, b: Fare): number {
  return a.price - b.price;
}

/**
 * Fares result set partitioned by type
 */
interface PartitionedFares {
  singles: SortedFareList,
  returns: SortedFareList,
  seasons: Fare[]
}

/**
 * Container for Fare Service query results
 */
export class FareServiceResponse {

  constructor(
    public readonly outwardSingles: SortedFareList,
    public readonly inwardSingles: SortedFareList,
    public readonly returns: SortedFareList
  ) { }

}
