import {
    Command,
    Declare,
    type DefaultLocale,
    type GuildCommandContext,
    LocalesT,
    type Message,
    Options,
    type WebhookMessage,
    createStringOption,
} from "seyfert";
import { StelleOptions } from "#stelle/utils/decorator.js";

import { MessageFlags } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";

const options = {
    locale: createStringOption({
        description: "Enter the new locale.",
        required: true,
        locales: {
            name: "locales.setlocale.option.name",
            description: "locales.setlocale.option.description",
        },
        autocomplete: async (interaction) => {
            const { client } = interaction;

            await interaction.respond(
                Object.entries<DefaultLocale>(client.langs.values)
                    .map(([value, l]) => ({
                        name: `${l.metadata.name} [${l.metadata.emoji}] - ${l.metadata.translators.join(", ")}`,
                        value,
                    }))
                    .slice(0, 25),
            );
        },
    }),
};

@Declare({
    name: "setlocale",
    description: "Set the locale of Stelle.",
    aliases: ["locale", "lang", "language"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    defaultMemberPermissions: ["ManageGuild"],
})
@StelleOptions({ cooldown: 10, category: StelleCategory.Guild })
@LocalesT("locales.setlocale.name", "locales.setlocale.description")
@Options(options)
export default class SetLocaleCommand extends Command {
    public override async run(ctx: GuildCommandContext<typeof options>): Promise<Message | WebhookMessage | void> {
        const { client, options } = ctx;
        const { locale } = options;

        const { messages } = await ctx.getLocale();

        const locales = Object.keys(client.langs.values);
        if (!locales.includes(locale))
            return ctx.editOrReply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        description: messages.commands.setlocale.invalidLocale({ locale, available: locales.join(", ") }),
                        color: client.config.color.success,
                    },
                ],
            });

        await client.database.setLocale(ctx.guildId, locale);
        await ctx.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: ctx.t.get(locale).messages.commands.setlocale.newLocale({ locale }),
                    color: client.config.color.success,
                },
            ],
        });
    }
}
