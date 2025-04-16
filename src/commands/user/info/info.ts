import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "info",
    description: "Get the info about the bot or a user.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@AutoLoad()
@LocalesT("locales.info.name", "locales.info.description")
@StelleOptions({ category: StelleCategory.User, cooldown: 5 })
export default class InfoCommand extends Command {}
