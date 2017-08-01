
import {FareServiceResponse} from "../../fare/FareService";
import {Restriction} from "../../restriction/Restriction";
import {TicketType} from "../../tickettype/TicketType";
import {Route} from "../../route/Route";
import {Fare} from "../../fare/Fare";

/**
 * Definition of the API response
 */
export interface FareResponse {
  data: {
    outwardSingles: string[],
    inwardSingles: string[],
    returns: string[]
  },
  links: object
}

/**
 * Factory to create the FareResponse
 */
export class FareResponseFactory {
  private links: object;

  /**
   * Turn the fares service results into a
   */
  public getResponse(fares: FareServiceResponse): FareResponse {
    this.links = {};

    return {
      data: {
        outwardSingles: fares.outwardSingles.map(f => this.fareToJSON(f)),
        inwardSingles: fares.inwardSingles.map(f => this.fareToJSON(f)),
        returns: fares.returns.map(f => this.fareToJSON(f))
      },
      links: this.links
    };
  }

  // private fareOptionToJSON(fareOption: FareOption): string {
  //   if (!this.links[fareOption.id]) {
  //     this.links[fareOption.id] = {
  //       totalPrice: fareOption.totalPrice,
  //       fares: fareOption.fares.map(f => {
  //         return {
  //           adults: f.adults,
  //           children: f.children,
  //           railcard: f.railcard.code,
  //           fare: this.fareToJSON(f.fare)
  //         };
  //       })
  //     }
  //   }
  //
  //   return fareOption.id;
  // };

  private fareToJSON = (fare: Fare) => {
    if (!this.links[fare.id]) {
      this.links[fare.id] = {
        origin: fare.origin.nlc,
        destination: fare.destination.nlc,
        route: this.routeToJSON(fare.route),
        price: fare.price,
        ticketType: this.ticketTypeToJSON(fare.ticketType),
        restriction: fare.restriction.map(this.restrictionToJSON).orNull,
        railcard: fare.railcard.code,
        toc: fare.fareSetter.orNull,
        xLondon: fare.xLondon > 0,
        statusCode: fare.statusCode
      };
    }

    return fare.id;
  };

  private routeToJSON(route: Route): string {
    if (!this.links[route.id]) {
      this.links[route.id] = {
        code: route.code,
        name: route.name,
        includedLocations: route.included,
        excludedLocations: route.excluded
      };
    }

    return route.id;
  }

  private ticketTypeToJSON(ticketType: TicketType): string {
    if (!this.links[ticketType.id]) {
      this.links[ticketType.id] = {
        code: ticketType.code,
        name: ticketType.name,
      };
    }

    return ticketType.id;
  }

  private restrictionToJSON(restriction: Restriction): string {
    return restriction.id;
  };

}

