
import memoize = require("memoized-class-decorator");
import {NLC, Location, ClusterMap} from "../Location";
import {option} from "ts-option";
import {indexBy} from "../../util/array";

export class LocationRepository {

  constructor(
    private readonly db
  ) {}

  /**
   * Load the stations from the database then index them by their NLC
   */
  public async getLocationsByNLC(): Promise<NLCMap> {
    const locations = await this.getLocations();

    return locations.reduce(indexBy((loc: Location) => loc.nlc), {});
  }

  /**
   * Load the stations from the database then index them by their CRS code
   */
  public async getLocationsByCRS(): Promise<CRSMap> {
    const locations = await this.getLocations();

    return locations.reduce(indexBy((loc: Location) => loc.crs.orNull), {});
  }

  /**
   * Load all locations from the database
   */
  @memoize
  private async getLocations(): Promise<Location[]> {
    return this.db
      .query(`
        SELECT nlc, crs, GROUP_CONCAT(distinct substring(group_uic_code,3,4)) AS groups FROM location
        LEFT JOIN location_group_member member ON uic = member_uic_code AND member.end_date >= CURDATE()
        WHERE CURDATE() BETWEEN location.start_date AND location.end_date
        GROUP BY nlc
      `)
      .map(row => this.getLocation(row));
  }

  private async getLocation(location: LocationRow): Promise<Location> {
    const groups = location.groups ? location.groups.split(",") : [];
    const clusters: ClusterMap = {};

    // add mapping between stations to the original station
    for (const nlc of [location.nlc, ...groups]) {
      clusters[nlc] = nlc;

      for (const clusterNLC of await this.getClusters(nlc)) {
        clusters[clusterNLC] = nlc;
      }
    }

    return new Location(
      location.nlc,
      option(location.crs),
      clusters,
      [location.nlc, ...groups, ...Object.keys(clusters)]
    );
  }

  @memoize
  private getClusters(nlc: NLC): Promise<NLC[]> {
    return this.db.query(`            
      SELECT cluster_id FROM station_cluster 
      WHERE cluster_nlc = ? AND CURDATE() BETWEEN start_date AND end_date 
    `, [nlc]).map(row => row.cluster_id);
  }

}

export type NLCMap = {
  [nlc: string]: Location
};

export type CRSMap = {
  [crs: string]: Location
};

interface LocationRow {
  nlc: string;
  crs: string;
  groups: string;
}