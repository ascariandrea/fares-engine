
import {Fare} from "../Fare";
import {LocalDate} from "js-joda";
import {FarePreferences} from "../../service/api/FareRequest";

/**
 * Function that can be used to filter fares
 */
export type FareFilter = (fare: Fare, date: LocalDate, preferences: FarePreferences) => boolean;
