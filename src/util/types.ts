
export type MapOf<A> = {
  [key: string]: A
}

export type Reducer<ResultT, ItemT> = (prev: MapOf<ResultT>, item: ItemT) => MapOf<ResultT>;

