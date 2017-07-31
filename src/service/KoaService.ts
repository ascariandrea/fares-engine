
import Koa = require("koa");
import compress = require("koa-compress");
import Context = Koa.Context;
import {LocalDate} from "js-joda";
import {None, Some} from "ts-option";
import Railcard from "../../../fares-engine/src/passenger/Railcard";
import {FareService} from "../fare/FareService";
import {CRSMap, NLCMap} from "../location/repository/LocationRepository";
import {RailcardMap} from "../passenger/repository/RailcardRepository";
import PassengerSet from "../passenger/PassengerSet";
import {FareResponseFactory} from "./api/FareResponse";
import {FarePreferences, FareRequest} from "./api/FareRequest";

export default class KoaService {

  constructor(
    private readonly fareService: FareService,
    private readonly fareResponseFactory: FareResponseFactory,
    private readonly locationsByCRS: CRSMap,
    private readonly locationsByNLC: NLCMap,
    private readonly railcards: RailcardMap,
    private readonly koaPort: number
  ) { }

  /**
   * Start the koa server
   */
  public async start() {
    const app = new Koa();

    app.use(compress());
    app.use(this.handler.bind(this));
    app.listen(this.koaPort);
  }


  /**
   * Handle requests.
   */
  private async handler(ctx: Context, next) {
    if (ctx.request.path !== "/fares") return;

    const request = this.getRequest(ctx);
    const response = await this.fareService.getFares(request);

    ctx.body = this.fareResponseFactory.getResponse(response);
  };

  private getRequest(ctx: Context): FareRequest {
    // TODO: filter railcards that are not valid for the passenger set
    const railcards = ctx.request.query.railcards ? ctx.request.query.railcards.split(",").map(r => this.railcards[r]) : [];

    railcards.push(this.railcards[Railcard.PUBLIC_RAILCARD_CODE]);

    return new FareRequest(
      this.locationsByCRS[ctx.request.query.origin] || this.locationsByNLC[ctx.request.query.origin],
      this.locationsByCRS[ctx.request.query.destination] || this.locationsByNLC[ctx.request.query.destination],
      LocalDate.parse(ctx.request.query.outwardDate),
      ctx.request.query.returnDate ? new Some(LocalDate.parse(ctx.request.query.returnDate)) : new None(),
      new PassengerSet(
        parseInt(ctx.request.query.adults),
        parseInt(ctx.request.query.children),
        railcards
      ),
      new FarePreferences(
        typeof ctx.request.query.firstClass === "undefined" || ctx.request.query.firstClass === "true",
        typeof ctx.request.query.standardClass === "undefined" || ctx.request.query.standardClass === "true",
        typeof ctx.request.query.singles === "undefined" || ctx.request.query.singles === "true",
        typeof ctx.request.query.returns === "undefined" || ctx.request.query.returns === "true",
        typeof ctx.request.query.advance === "undefined" || ctx.request.query.advance === "true"
      )
    );
  }

}