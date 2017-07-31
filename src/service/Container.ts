import Config from "../../config/common";
import {DevConfig} from "../../config/dev";
import KoaService from "./KoaService";
import {ProductionConfig} from "../../config/production";
import memoize = require("memoized-class-decorator");
import Pino = require("pino");
import RestrictionRepository from "../../../fares-engine/src/restriction/repository/RestrictionRepository";
import RailcardRepository from "../../../fares-engine/src/passenger/repository/RailcardRepository";
import LocationRepository from "../../../fares-engine/src/location/repository/LocationRepository";
import ValidityTypeRepository from "../../../fares-engine/src/validitytype/repository/ValidityTypeRepository";
import TicketTypeRepository from "../../../fares-engine/src/tickettype/repository/TicketTypeRepository";
import RouteRepository from "../../../fares-engine/src/route/repository/RouteRepository";
import NonDerivableFareRepository from "../../../fares-engine/src/fare/repository/NonDerivableFareRepository";
import FlowFareRepository from "../../../fares-engine/src/fare/repository/FlowFareRepository";
import Railcard from "../../../fares-engine/src/passenger/Railcard";
import {FareService} from "../fare/FareService";
import {FareResponseFactory} from "./api/FareResponse";

export default class Container {

  @memoize
  public async getKoaService(): Promise<KoaService> {

    const db = await this.getDatabase();

    this.getLog().info("Loading routes");
    const routeRepository = new RouteRepository(db);
    const routes = await routeRepository.getRoutes();

    this.getLog().info("Loading validity types");
    const validityTypeRepository = new ValidityTypeRepository(db);
    const validityTypes = await validityTypeRepository.getValidityTypes();

    this.getLog().info("Loading ticket types");
    const ticketTypeRepository = new TicketTypeRepository(db, validityTypes);
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
    const fareService = new FareService(flowRepository, ndfRepository, calendarRestrictions);

    return new KoaService(
      fareService,
      new FareResponseFactory(),
      locationsByCRS,
      locationsByNLC,
      railcards,
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
  public getLog() {
    return Pino({
      prettyPrint: this.getConfig().prettyLogs
    });
  }

}