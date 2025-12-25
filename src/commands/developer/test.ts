import { Command, Declare } from "seyfert";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "test",
    description: "A test command to test things.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    defaultMemberPermissions: ["Administrator"],
})
@StelleOptions({ onlyDeveloper: true, skip: true })
export default class TestCommand extends Command {}
