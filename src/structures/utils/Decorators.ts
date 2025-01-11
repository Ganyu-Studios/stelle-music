import type { NonCommandOptions, Options } from "#stelle/types";
import type { BaseCommand } from "seyfert";

type Instantiable<T> = new (...arg: any[]) => T;

export function StelleOptions<A extends Instantiable<any>>(options: A extends Instantiable<BaseCommand> ? Options : NonCommandOptions) {
    return (target: A) => class extends target {
        constructor(...args: any[]) {
            super(...args);
            Object.assign(this, options);
        }
    };
}
