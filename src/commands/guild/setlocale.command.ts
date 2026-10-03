import {
    Command,
    createStringOption,
    Declare,
    type GuildCommandContext,
    LocalesT,
    type MessageStructure,
    Options,
    type WebhookMessageStructure,
} from "seyfert";
import {
    type APIApplicationCommandOptionChoice,
    ApplicationIntegrationType,
    InteractionContextType,
    type LocaleString,
    PermissionFlagsBits,
} from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types/index.js";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";

const options = {
    locale: createStringOption({
        description: "Enter the new locale.",
        required: true,
        locales: {
            name: "locales.setlocale.option.name",
            description: "locales.setlocale.option.description",
        },
        autocomplete: async (interaction): Promise<void> => {
            const { client } = interaction;
            const { messages } = client.t(interaction.locale).get();

            const input: string = interaction.getInput().toLowerCase();

            // The locale code goes in the name too, so typing "es" or "419" matches; an empty input matches every locale.
            // The translators are listed here (the command has no picker that shows them), so the name is capped at
            // Discord's 100 characters.
            const choices: APIApplicationCommandOptionChoice<string>[] = (Object.keys(client.langs.values) as LocaleString[])
                .map((locale): APIApplicationCommandOptionChoice<string> => {
                    const { metadata } = client.t(locale).get();

                    return {
                        name: UtilsOps.truncate(`${metadata.emoji} ${metadata.name} (${locale}) - ${metadata.translators.join(", ")}`, 100),
                        value: locale,
                    };
                })
                .filter((choice): boolean => choice.name.toLowerCase().includes(input));

            if (!choices.length) return interaction.respond(UtilsOps.autocomplete(messages.events.autocomplete.no.locale));

            await interaction.respond(choices);
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
    public override async run(ctx: GuildCommandContext<typeof options>): Promise<MessageStructure | WebhookMessageStructure | void> {
        const { client, options } = ctx;
        const { locale } = options;

        const { messages } = await ctx.locale();

        const locales = Object.keys(client.langs.values);
        if (!locales.includes(locale))
            return ctx.errorReply(messages.commands.setlocale.invalidLocale({ locale, available: locales.join(", ") }), {
                ephemeral: true,
            });

        await client.database.locales.update(ctx.guildId, locale);
        await ctx.successReply(ctx.t.get(locale).messages.commands.setlocale.newLocale({ locale }), { ephemeral: true });
    }
}
