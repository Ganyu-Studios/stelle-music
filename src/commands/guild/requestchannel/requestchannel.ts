import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType, PermissionFlagsBits } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "requestchannel",
    description: "Manage the song request channel.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    defaultMemberPermissions: [PermissionFlagsBits.ManageGuild],
})
@AutoLoad()
@StelleOptions({ cooldown: 10, category: StelleCategory.Guild })
@LocalesT("locales.requestchannel.name", "locales.requestchannel.description")
export default class RequestChannelCommand extends Command {}
