import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

@Declare({
    name: "default",
    description: "Change Stelle default settings.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    defaultMemberPermissions: ["ManageGuild"],
})
@AutoLoad()
@StelleOptions({ cooldown: 10 })
@LocalesT("locales.default.name", "locales.default.description")
export default class DefaultCommand extends Command {}
