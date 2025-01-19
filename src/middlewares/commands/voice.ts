import { createMiddleware } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";

/**
 * Check if the bot is in a voice channel and if is the same as the author.
 */
export const checkBotVoiceChannel = createMiddleware<void>(async ({ context, pass, next }) => {
    if (!context.inGuild()) return next();

    const { messages } = await context.getLocale();

    const me = await context.me();

    const state = await context.member.voice().catch(() => null);
    if (!state) return pass();

    const bot = await me.voice().catch(() => null);
    if (bot && bot.channelId !== state.channelId) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noSameVoice({ channelId: bot.channelId! }),
                    color: EmbedColors.Red,
                },
            ],
        });

        return pass();
    }

    return next();
});

/**
 * Check if the author is in a voice channel.
 */
export const checkVoiceChannel = createMiddleware<void>(async ({ context, pass, next }) => {
    if (!context.inGuild()) return next();

    const { messages } = await context.getLocale();

    const state = await context.member.voice().catch(() => null);
    const channel = await state?.channel().catch(() => null);

    if (!channel?.is(["GuildVoice", "GuildStageVoice"])) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noVoiceChannel,
                    color: EmbedColors.Red,
                },
            ],
        });

        return pass();
    }

    return next();
});

/**
 * Check if the bot has permissions to join the voice channel.
 */
export const checkVoicePermissions = createMiddleware<void>(async ({ context, pass, next }) => {
    if (!context.inGuild()) return next();

    const state = await context.member.voice().catch(() => null);
    if (!state) return pass();

    const channel = await state.channel().catch(() => null);
    if (!channel?.is(["GuildVoice", "GuildStageVoice"])) return pass();

    const { stagePermissions, voicePermissions } = context.client.config.permissions;
    const { messages } = await context.getLocale();

    const me = await context.me();
    const permissions = await context.client.channels.memberPermissions(channel.id, me);
    const missings = permissions.keys(permissions.missings(channel.isStage() ? stagePermissions : voicePermissions));

    if (missings.length) {
        await context.editOrReply({
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.permissions.channel.description({
                        channelId: channel.id,
                    }),
                    color: EmbedColors.Red,
                    fields: [
                        {
                            name: messages.events.permissions.user.field,
                            value: missings.map((p) => `- ${messages.events.permissions.list[p]}`).join("\n"),
                        },
                    ],
                },
            ],
        });

        return pass();
    }

    return next();
});
