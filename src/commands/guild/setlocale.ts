import {
    Command,
    createStringOption,
    Declare,
    type DefaultLocale,
    type GuildCommandContext,
    LocalesT,
    type Message,
    Options,
    type WebhookMessage,
} from "seyfert";
import { ApplicationIntegrationType, InteractionContextType, MessageFlags, PermissionFlagsBits } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

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
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    defaultMemberPermissions: [PermissionFlagsBits.ManageGuild],
})
@StelleOptions({ cooldown: 10, category: StelleCategory.Guild })
@LocalesT("locales.setlocale.name", "locales.setlocale.description")
@Options(options)
export default class SetLocaleCommand extends Command {
    public override async run(ctx: GuildCommandContext<typeof options>): Promise<Message | WebhookMessage | void> {
        const { client, options } = ctx;
        const { locale } = options;

        const { messages } = await ctx.locale();

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

        await client.database.locales.update(ctx.guildId, locale);
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
