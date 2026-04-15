import { Command, Declare } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType, PermissionFlagsBits } from "seyfert/lib/types/index.js";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "test",
    description: "A test command to test things.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    defaultMemberPermissions: [PermissionFlagsBits.Administrator],
})
@StelleOptions({ onlyDeveloper: true, skipRegister: true })
export default class TestCommand extends Command {}
