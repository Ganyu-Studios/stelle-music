import type { ParseClient } from "seyfert";
import type { Stelle } from "#stelle/client";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            TOKEN: string;
            SPOTIFY_ID: string;
            SPOTIFY_SECRET: string;
        } 
    }
}

declare module "seyfert" {
    interface InternalOptions {
        withPrefix: true;
    }
    
    interface UsingClient extends ParseClient<Stelle> {}
}