import { AutoLoad, LocalesT, Command, Declare } from "seyfert";
import { StelleOptions } from "#stelle/decorators";
import { StelleCategory } from "#stelle/types";

@Declare({
    name: "default",
    description: "Change Stelle default settings.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    defaultMemberPermissions: ["ManageGuild"]
})
@StelleOptions({
    cooldown: 10,
    category: StelleCategory.Guild
})
@LocalesT("locales.default.name", "locales.default.description")
@AutoLoad()
export default class DefaultCommand extends Command { }
