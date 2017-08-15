import {Fare, Price} from "../../src/fare/Fare";
import {Status, StatusCode} from "../../src/passenger/Status";
import {Railcard} from "../../src/passenger/Railcard";
import {publicRailcard} from "../passenger/Railcard.spec";
import {Route} from "../../src/route/Route";
import {TicketType} from "../../src/tickettype/TicketType";
import {none, option} from "ts-option";
import {RestrictionDate, CurrentFutureMarker} from "../../src/restriction/RestrictionDate";
import {LocalDate, LocalTime} from "js-joda";
import {
  Restriction,
  RestrictionDirection, RestrictionRules, ServiceRestriction,
  TimeRestriction
} from "../../src/restriction/Restriction";
import {Validity, ValidityType, ReturnPeriod} from "../../src/validitytype/ValidityType";
import {Location} from "../../src/location/Location";

export function createFare(price: Price,
                           statusCode: StatusCode = Status.ADULT_STATUS_CODE,
                           railcard: Railcard = publicRailcard,
                           myRoute: Route = route,
                           myTicketType: TicketType = ticketType): Fare {
  return new Fare(
    new Location("1072", none, {}, []),
    new Location("4444", none, {}, []),
    myRoute,
    myTicketType,
    statusCode,
    price,
    railcard,
    option(restriction),
    none,
    0,
    false
  );
}

export function createSingleFare(price: Price, statusCode: StatusCode = Status.ADULT_STATUS_CODE, railcard: Railcard = publicRailcard): Fare {
  return createFare(price, statusCode, railcard, route, singleTicketType);
}

export function createAdvanceFare(price: Price, statusCode: StatusCode = Status.ADULT_STATUS_CODE): Fare {
  return createFare(price, statusCode, publicRailcard, route, advanceTicketType);
}

export function createFirstClassFare(price: Price, statusCode: StatusCode = Status.ADULT_STATUS_CODE): Fare {
  return createFare(price, statusCode, publicRailcard, route, firstClassTicketType);
}

export const validityType = new ValidityType(
  "1E",
  "Some Validity",
  new Validity(0, 0, false),
  new Validity(14, 0, false),
  new ReturnPeriod(1, 0, none)
);

export const ticketType = new TicketType(
  "SOR",
  "Standard Open Return",
  0,
  1,
  0,
  1,
  1,
  1,
  validityType,
  true,
  false,
  false,
  false,
  false,
  1
);

export const singleTicketType = new TicketType(
  "SDS",
  "Standard Day Single",
  0,
  1,
  0,
  1,
  1,
  1,
  validityType,
  false,
  false,
  false,
  false,
  false,
  1
);

export const advanceTicketType = new TicketType(
  "2CC",
  "Advance",
  0,
  1,
  0,
  1,
  1,
  1,
  validityType,
  false,
  false,
  true,
  true,
  false,
  1
);

export const firstClassTicketType = new TicketType(
  "FDS",
  "Advance",
  0,
  1,
  0,
  1,
  1,
  1,
  validityType,
  false,
  false,
  false,
  false,
  true,
  1
);

export const route = new Route("00101", "NotMGT", [], ["MGT"]);

const restrictionDate = new RestrictionDate(
  LocalDate.parse("2016-12-13"),
  LocalDate.parse("2017-12-13"),
  CurrentFutureMarker.Current,
  true,
  true,
  true,
  true,
  true,
  true,
  true
);

const currentRules = new RestrictionRules(
  new RestrictionDirection("R1_O", [], [],
    [
      new TimeRestriction(LocalTime.parse("09:00"), LocalTime.parse("09:30"), option("LN"), option("SEV"), false, [restrictionDate]),
      new TimeRestriction(LocalTime.parse("09:30"), LocalTime.parse("10:00"), option("LN"), option("CHX"), false, [restrictionDate])
    ],
    new ServiceRestriction([], ["EASED_SERVICE"])
  ),
  new RestrictionDirection("R1_R", [], [],
    [
      new TimeRestriction(LocalTime.parse("19:00"), LocalTime.parse("19:30"), option("LN"), option("SEV"), false, [restrictionDate]),
      new TimeRestriction(LocalTime.parse("19:30"), LocalTime.parse("20:00"), option("LN"), option("CHX"), false, [restrictionDate])
    ],
    new ServiceRestriction([], ["EASED_SERVICE"])
  )
);

const futureRules = new RestrictionRules(
  new RestrictionDirection("R1_O", [], [], [], new ServiceRestriction([], [])),
  new RestrictionDirection("R1_R", [], [], [], new ServiceRestriction([], []))
);

export const restriction = new Restriction("LN", [restrictionDate], currentRules, futureRules);

export const fare = new Fare(
  new Location("1072", none, {}, []),
  new Location("4444", none, {}, []),
  route,
  ticketType,
  "000",
  100,
  publicRailcard,
  option(restriction),
  none,
  0,
  false
);
