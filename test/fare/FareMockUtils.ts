import {Fare, Price} from "../../src/fare/Fare";
import {default as Status, StatusCode} from "../../src/passenger/Status";
import Railcard from "../../src/passenger/Railcard";
import {publicRailcard} from "../passenger/Railcard.spec";
import Route from "../../src/route/Route";
import {TicketType} from "../../src/tickettype/TicketType";
import {none, option} from "ts-option";
import RestrictionDate, {CurrentFuture} from "../../src/restriction/RestrictionDate";
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
    0
  );
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
  1
);

export const route = new Route("00101", "NotMGT", [], ["MGT"]);

const restrictionDate = new RestrictionDate(
  LocalDate.parse("2016-12-13"),
  LocalDate.parse("2017-12-13"),
  CurrentFuture.CURRENT,
  true,
  true,
  true,
  true,
  true,
  true,
  true
);

const currentRules = new RestrictionRules(
  new RestrictionDirection([], [],
    [
      new TimeRestriction(LocalTime.parse("09:00"), LocalTime.parse("09:30"), option("LN"), option("SEV"), [restrictionDate]),
      new TimeRestriction(LocalTime.parse("09:30"), LocalTime.parse("10:00"), option("LN"), option("CHX"), [restrictionDate])
    ],
    new ServiceRestriction([], ["EASED_SERVICE"])
  ),
  new RestrictionDirection([], [],
    [
      new TimeRestriction(LocalTime.parse("19:00"), LocalTime.parse("19:30"), option("LN"), option("SEV"), [restrictionDate]),
      new TimeRestriction(LocalTime.parse("19:30"), LocalTime.parse("20:00"), option("LN"), option("CHX"), [restrictionDate])
    ],
    new ServiceRestriction([], ["EASED_SERVICE"])
  )
);

const futureRules = new RestrictionRules(
  new RestrictionDirection([], [], [], new ServiceRestriction([], [])),
  new RestrictionDirection([], [], [], new ServiceRestriction([], []))
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
  0
);
