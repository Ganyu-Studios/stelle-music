import type { ParseClient } from "seyfert";
import type { Stelle } from "#stelle/client";

declare module "seyfert" {
    interface InternalOptions {
        withPrefix: true;
    }
    
    interface UsingClient extends ParseClient<Stelle> {}
}