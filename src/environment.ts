import type { ParseClient } from "seyfert";
import type { Stelle } from "#stelle/client";

declare module "seyfert" {
    interface UsingClient extends ParseClient<Stelle> {}
}