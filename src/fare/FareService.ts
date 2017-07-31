import FlowFareRepository from "./repository/FlowFareRepository";
import NonDerivableFareRepository from "./repository/NonDerivableFareRepository";
import {LocalDate} from "js-joda";
import {Fare} from "./Fare";
import {CalendarRestrictionMap} from "../restriction/repository/RestrictionRepository";
import PassengerSet from "../passenger/PassengerSet";
import {Location} from "../location/Location";
import {FarePreferences, FareRequest} from "../service/api/FareRequest";

// TODO unit test the calendar restrictions, railcard restrictions and fare preferences
/**
 * Service that uses a FlowRepository and NonDerivableFareRepository to return fares using the local database.
 */
export class FareService {

  constructor(
    private readonly flowRepository: FlowFareRepository,
    private readonly nonDerivableRepository: NonDerivableFareRepository,
    private readonly calendarRestrictions: CalendarRestrictionMap
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
   * Add the flow fares and non-derivable fares to a single, indexed map with the NDFs taking priority over the flow
   * fares.
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

    // merge in the ndfs overwriting and fares that have the same ID (mutates flowFares for performance)
    const fares = Object.assign(flowFares, nonDerivableFares);
    const result: Fare[] = [];

    // filter the fares with a calendar restriction
    for (const fareId in fares) {
      const fare = fares[fareId];
      const calendarRestricted = this.calendarRestrictions[fare.ticketType.code] && this.calendarRestrictions[fare.ticketType.code].matches(date, fare);
      const railcardRestricted = fare.railcard.isBanned(fare.origin, fare.ticketType.code, fare.route.code);

      if (!calendarRestricted && !railcardRestricted && fare.price !== 0 && farePreferences.isValid(fare.ticketType)) {
        result.push(fare);
      }
    }

    return this.partitionByType(result);
  }

  /**
   * Group the fares by type (single, return, season).
   */
  private partitionByType(fares: Fare[]): PartitionedFares {
    const result: PartitionedFares = {
      singles: [],
      returns: [],
      seasons: []
    };

    for (const fare of fares) {
      if (fare.ticketType.isSeason) result.seasons.push(fare);
      else if (fare.ticketType.isReturn) result.returns.push(fare);
      else result.singles.push(fare);
    }

    return result;
  }

}

/**
 * Fares result set partitioned by type
 */
interface PartitionedFares {
  singles: Fare[],
  returns: Fare[],
  seasons: Fare[]
}

export class FareServiceResponse {

  constructor(
    public readonly outwardSingles: Fare[],
    public readonly inwardSingles: Fare[],
    public readonly returns: Fare[]
  ) { }

}
