import { AutoLoad, Command, Declare } from "seyfert";
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
export default class DefaultCommand extends Command {}
