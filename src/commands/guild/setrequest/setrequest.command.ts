import { AutoLoad, Command, Declare, LocalesT, ApplicationIntegrationType, InteractionContextType, PermissionFlagsBits } from "seyfert";
import { StelleCategory } from "#stelle/types/index.js";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "setrequest",
    description: "Manage the song request channel.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    defaultMemberPermissions: [PermissionFlagsBits.ManageGuild],
})
@AutoLoad()
@StelleOptions({ cooldown: 10, category: StelleCategory.Guild })
@LocalesT("locales.setrequest.name", "locales.setrequest.description")
export default class SetRequestCommand extends Command {}
