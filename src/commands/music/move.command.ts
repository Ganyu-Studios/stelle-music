import { Command, createChannelOption, Declare, type GuildCommandContext, type GuildMember, LocalesT, Middlewares, Options } from "seyfert";
import { ApplicationIntegrationType, ChannelType, InteractionContextType } from "seyfert/lib/types/index.js";
import { type PermissionNames, StelleCategory } from "#stelle/types/index.js";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { PermissionOps } from "#stelle/utils/functions/internal/permissions.js";

const options = {
    voice: createChannelOption({
        description: "Select the voice channel.",
        channel_types: [ChannelType.GuildVoice],
        required: true,
        locales: {
            name: "locales.move.options.voice.name",
            description: "locales.move.options.voice.description",
        },
    }),
    text: createChannelOption({
        description: "Select the text channel.",
        channel_types: [ChannelType.GuildText],
        locales: {
            name: "locales.move.options.text.name",
            description: "locales.move.options.text.description",
        },
    }),
};

@Declare({
    name: "move",
    description: "Move the player.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    aliases: ["mov", "m"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@Options(options)
@LocalesT("locales.move.name", "locales.move.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class MoveCommand extends Command {
    public override async run(ctx: GuildCommandContext<typeof options, "checkPlayer">): Promise<void> {
        const { client, options } = ctx;
        const { voice, text } = options;

        const { messages } = await ctx.locale();

        const { player } = ctx.metadata.checkPlayer;

        // The move targets come from the options (not the author's current channel), so validate the bot can actually
        // use them before switching: connect/speak in the voice channel and post in the text channel. Otherwise the
        // player would move into a channel where it's muted or its now-playing messages silently fail.
        const me: GuildMember | null = await ctx.me().catch((): null => null);
        if (!me) return;

        const { voicePermissions, textPermissions } = client.config.permissions;

        const missingVoice: PermissionNames[] = await PermissionOps.missing(client, voice.id, me, voicePermissions);
        if (missingVoice.length) return ctx.editOrReply(PermissionOps.message(messages, voice.id, missingVoice));

        if (text) {
            const missingText: PermissionNames[] = await PermissionOps.missing(client, text.id, me, textPermissions);
            if (missingText.length) return ctx.editOrReply(PermissionOps.message(messages, text.id, missingText));
        }

        if (text) {
            player.options.textId = text.id;
            player.textId = text.id;
        }

        player.options.voiceId = voice.id;
        player.voiceId = voice.id;

        const textId: string = text?.id ?? player.textId ?? player.options.textId ?? ctx.channelId;

        await player.setVoice({ voiceId: voice.id });
        await player.connect();
        await ctx.successReply(
            messages.commands.move({
                textId,
                voiceId: voice.id,
            }),
        );
    }
}
