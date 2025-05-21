import type { BaseCommand } from "seyfert";
import type { NonCommandOptions, Options } from "#stelle/types";

/**
 * Represents a constructor function.
 */
type Instantiable<T> = new (...arg: any[]) => T;

/**
 * Decorator function type.
 */
type Decorator<T> = (target: T) => T;

/**
 * Decorator to add options to a class.
 * @param {Decorator<A>} options The options to add to the class.
 */
export function StelleOptions<A extends Instantiable<any>>(
    options: A extends Instantiable<BaseCommand> ? Options : NonCommandOptions,
): Decorator<A> {
    return (target: A) =>
        class extends target {
            constructor(...args: any[]) {
                super(...args);
                Object.assign(this, options);
            }
        };
}
