
import {Route, RouteCode} from "../Route";
import {indexBy} from "../../util/array";

/**
 * Loads routes from a MySQL compatible database
 */
export class RouteRepository {

  constructor(
    private readonly db
  ) {}

  /**
   * Get the routes indexed by route_code
   */
  public getRoutes(): Promise<RouteMap> {
    return this.db
      .query(`
        SELECT 
          route_code, 
          description, 
          GROUP_CONCAT(IF(incl_excl = 'I', crs_code, null)) AS include, 
          GROUP_CONCAT(IF(incl_excl = 'E', crs_code, null)) AS exclude 
        FROM route 
        LEFT JOIN route_location USING(route_code, end_date)
        WHERE CURDATE() BETWEEN quote_date AND end_date
        GROUP BY route_code
      `)
      .map(row => this.createRoute(row))
      .reduce(indexBy((r: Route) => r.code), {})
  }

  private createRoute(row: RouteRow): Route {
    return new Route(
      row.route_code,
      row.description,
      row.include ? row.include.split(",") : [],
      row.exclude ? row.exclude.split(",") : []
    );
  }

}

export type RouteMap = {
  [routeCode: string]: Route;
};

interface RouteRow {
  route_code: RouteCode;
  description: string;
  include?: string;
  exclude?: string;
}