import type { ParseClient } from "seyfert";
import type { Stelle } from "#stelle/classes/Stelle.js";

declare module "seyfert" {
    interface UsingClient extends ParseClient<Stelle> {}
}
