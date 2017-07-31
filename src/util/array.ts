
import {MapOf, Reducer} from "./types";

/**
 * Return a function that can be used to reduce an array to an object of A indexed by the string returned by the given
 * function.
 *
 * Example usage:
 *
 * const people = [{name: "Bob", age: 1}, {name: "Bill", age: 2}];
 * const peopleByName = people.reduce(indexBy(person => person.name), {});
 *
 * {
 *   Bob: {name: "Bob", age: 1},
 *   Bill: {name: "Bill", age: 2}
 * }
 *
 */
export function indexBy<Item>(fn: (any: Item) => string | number): Reducer<Item, Item> {
  return function(prev: MapOf<Item>, item: Item): MapOf<Item> {
    prev[fn(item)] = item;

    return prev;
  }
}

/**
 * Return a function that can be used to reduce an array to an object of A[] indexed by the string returned by the given
 * function.
 *
 * Example usage:
 *
 * const people = [{name: "Bob", age: 1}, {name: "Bill", age: 2}, {name: "Bob", age: 3}];
 * const peopleByName = people.reduce(indexBy(person => person.name), {});
 *
 * {
 *   Bob: [{name: "Bob", age: 1}, {name: "Bob", age: 3}],
 *   Bill: [{name: "Bill", age: 2}]
 * }
 *
 */
export function groupBy<A>(fn: (any) => string | number): Reducer<A[], A> {
  return function(prev: MapOf<A[]>, item: A) {
    const key = fn(item);
    (prev[key] = prev[key] || []).push(item);

    return prev;
  }
}
