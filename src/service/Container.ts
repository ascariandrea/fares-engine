import {Config} from "../../config/common";
import {DevConfig} from "../../config/dev";
import {KoaService} from "./KoaService";
import {ProductionConfig} from "../../config/production";
import memoize = require("memoized-class-decorator");
import Pino = require("pino");
import {RestrictionRepository} from "../restriction/repository/RestrictionRepository";
import {RailcardRepository} from "../passenger/repository/RailcardRepository";
import {LocationRepository} from "../location/repository/LocationRepository";
import {ValidityTypeRepository} from "../validitytype/repository/ValidityTypeRepository";
import {TicketTypeRepository} from "../tickettype/repository/TicketTypeRepository";
import {RouteRepository} from "../route/repository/RouteRepository";
import {NonDerivableFareRepository} from "../fare/repository/NonDerivableFareRepository";
import {FlowFareRepository} from "../fare/repository/FlowFareRepository";
import {Railcard} from "../passenger/Railcard";
import {FareService} from "../fare/FareService";
import {FareResponseFactory} from "./api/FareResponse";
import {suppressedFareFilter} from "../fare/filter/SuppressedFareFilter";
import {railcardBanFilter} from "../fare/filter/RailcardBanFilter";
import {calendarRestrictionFilter} from "../fare/filter/CalendarRestrictionFilter";
import {farePreferencesFilter} from "../fare/filter/FarePreferencesFilter";
import {AdvancePurchaseRepository} from "../tickettype/repository/AdvancePurchaseRepository";
import {advancePuchaseFilter} from "../fare/filter/AdvancePurchaseFilter";

export class Container {

  @memoize
  public async getKoaService(): Promise<KoaService> {

    const db = await this.getDatabase();

    this.getLog().info("Loading routes");
    const routeRepository = new RouteRepository(db);
    const routes = await routeRepository.getRoutes();

    this.getLog().info("Loading validity types");
    const validityTypeRepository = new ValidityTypeRepository(db);
    const validityTypes = await validityTypeRepository.getValidityTypes();

    this.getLog().info("Loading advance purchase data");
    const advanceRepository = new AdvancePurchaseRepository(db);
    const apData = await advanceRepository.getAdvancePurchaseData();

    this.getLog().info("Loading ticket types");
    const ticketTypeRepository = new TicketTypeRepository(db, validityTypes, apData);
    const ticketTypes = await ticketTypeRepository.getTicketTypes();

    this.getLog().info("Loading restrictions");
    const restrictionRepository = new RestrictionRepository(db);
    const restrictions = await restrictionRepository.getRestrictions();
    const calendarRestrictions = await restrictionRepository.getCalendarRestrictions();

    this.getLog().info("Loading railcards");
    const railcardRepository = new RailcardRepository(db, restrictions);
    const railcards = await railcardRepository.getRailcards();

    this.getLog().info("Loading stations by NLC");
    const locationRepository = new LocationRepository(db);
    const locationsByNLC = await locationRepository.getLocationsByNLC();

    this.getLog().info("Loading stations by CRS");
    const locationsByCRS = await locationRepository.getLocationsByCRS();

    const ndfRepository = new NonDerivableFareRepository(db, ticketTypes, restrictions, routes, railcards, locationsByNLC);
    const flowRepository = new FlowFareRepository(db, ticketTypes, restrictions, routes, railcards[Railcard.PUBLIC_RAILCARD_CODE], locationsByNLC);
    const fareService = new FareService(flowRepository, ndfRepository, [
      suppressedFareFilter,
      railcardBanFilter,
      calendarRestrictionFilter(calendarRestrictions),
      farePreferencesFilter,
      advancePuchaseFilter(apData)
    ]);

    return new KoaService(
      fareService,
      new FareResponseFactory(),
      locationsByCRS,
      locationsByNLC,
      railcards,
      this.getLog(),
      this.getConfig().koaPort
    );
  }

  @memoize
  public getConfig(): Config {
    switch (process.env.NODE_ENV) {
      case "production": return new ProductionConfig();
      default: return new DevConfig();
    }
  }

  @memoize
  public async getDatabase() {
    try {
      return await require('promise-mysql').createPool({
        host: this.getConfig().database.host,
        user: this.getConfig().database.username,
        password: this.getConfig().database.password,
        database: this.getConfig().database.name,
        dateStrings: true,
        //connectionLimit: 10,
        //debug: ['ComQueryPacket', 'RowDataPacket']
      });
    }
    catch(err) {
      console.error(err);
    }
  }

  @memoize
  public getLog(): Pino {
    return Pino({
      prettyPrint: this.getConfig().prettyLogs
    });
  }

}