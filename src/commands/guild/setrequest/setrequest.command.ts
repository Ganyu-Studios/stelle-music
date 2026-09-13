import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType, PermissionFlagsBits } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
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
