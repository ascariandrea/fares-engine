
import {MapOf, Reducer} from "./types";

declare global {
  interface Object {
    entries<A>(obj: MapOf<A>): A[];
  }
}
