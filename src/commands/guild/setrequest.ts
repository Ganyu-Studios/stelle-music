import { Command, Declare, LocalesT, Options, createChannelOption } from "seyfert";
import { StelleOptions } from "#stelle/utils/decorator.js";

import { ChannelType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";

const options = {
    channel: createChannelOption({
        description: "Select the text channel.",
        channel_types: [ChannelType.GuildText],
        locales: {
            name: "locales.setrequest.option.name",
            description: "locales.setrequest.option.description",
        },
    }),
};

@Declare({
    name: "setrequest",
    description: "Set the request channel of Stelle.",
    aliases: ["request", "rq"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    defaultMemberPermissions: ["ManageGuild"],
})
@StelleOptions({ cooldown: 10, category: StelleCategory.Guild })
@LocalesT("locales.setrequest.name", "locales.setrequest.description")
@Options(options)
export default class SetRequestCommand extends Command {}
