
import memoize = require("memoized-class-decorator");
import {NLC, Location, ClusterMap} from "../Location";
import {option} from "ts-option";
import {indexBy} from "../../util/array";

export default class LocationRepository {

  constructor(
    private readonly db
  ) {}

  public async getLocationsByNLC(): Promise<NLCMap> {
    const locations = await this.getLocations();

    return locations.reduce(indexBy((loc: Location) => loc.nlc), {});
  }

  public async getLocationsByCRS(): Promise<CRSMap> {
    const locations = await this.getLocations();

    return locations.reduce(indexBy((loc: Location) => loc.crs.orNull), {});
  }

  @memoize
  private async getLocations(): Promise<Location[]> {
    return this.db
      .query(`SELECT nlc, crs FROM location WHERE nlc != "" AND nlc < "9999" AND CURDATE() BETWEEN start_date AND end_date`)
      .map(row => this.getLocation(row));
  }

  private async getLocation(location: LocationRow): Promise<Location> {
    const groups = await this.getGroupStations(location.nlc);
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

  private getClusters(nlc: NLC): Promise<NLC[]> {
    return this.db.query(`            
      SELECT cluster_id FROM location
      JOIN station_cluster sc ON location.nlc = sc.cluster_nlc AND sc.start_date <= CURDATE() AND sc.end_date >= CURDATE()
      WHERE location.nlc = ? AND location.end_date >= CURDATE() 
    `, [nlc]).map(row => row.cluster_id);
  }

  private getGroupStations(nlc: NLC): Promise<NLC[]> {
    return this.db.query(`
      SELECT substring(group_uic_code,3,4) as nlc FROM location 
      JOIN location_group_member ON uic = member_uic_code 
      WHERE location.nlc = ? AND location.end_date >= CURDATE()
    `, [nlc]).map(row => row.nlc);
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
}