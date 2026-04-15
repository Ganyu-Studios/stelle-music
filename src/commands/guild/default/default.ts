import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType, PermissionFlagsBits } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "default",
    description: "Change Stelle default settings.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    defaultMemberPermissions: [PermissionFlagsBits.ManageGuild],
})
@AutoLoad()
@StelleOptions({ cooldown: 10, category: StelleCategory.Guild })
@LocalesT("locales.default.name", "locales.default.description")
export default class DefaultCommand extends Command {}
