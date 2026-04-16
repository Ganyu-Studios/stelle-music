import {
    type AllGuildVoiceChannels,
    type AnyContext,
    createMiddleware,
    type GuildMember,
    type MiddlewareContext,
    type VoiceState,
} from "seyfert";
import { EmbedColors, type PermissionStrings } from "seyfert/lib/common/index.js";
import type { PermissionsBitField } from "seyfert/lib/structures/extra/Permissions.js";
import { MessageFlags } from "seyfert/lib/types/index.js";
import type { PermissionNames } from "#stelle/types";
import { getPermissionKeys } from "#stelle/utils/functions/utils.js";

/**
 * Check if the bot is in a voice channel and if is the same as the author.
 * @type {MiddlewareContext<void, AnyContext>}
 */
export const checkBotVoiceChannel: MiddlewareContext<void, AnyContext> = createMiddleware<void>(async ({ context, pass, next }) => {
    if (!context.inGuild()) return next();

    const { messages } = await context.locale();

    const me: GuildMember | null | undefined = await context.me().catch((): null => null);
    if (!me) return;

    const state: VoiceState = await context.member.voice();
    if (!state) return pass();

    const bot: VoiceState | null = await me.voice().catch((): null => null);
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
 * @type {MiddlewareContext<void, AnyContext>}
 */
export const checkVoiceChannel: MiddlewareContext<void, AnyContext> = createMiddleware<void>(async ({ context, pass, next }) => {
    if (!context.inGuild()) return next();

    const { messages } = await context.locale();

    const state: VoiceState | null = await context.member.voice().catch((): null => null);

    const channel: AllGuildVoiceChannels | null | undefined = await state?.channel().catch((): null => null);
    if (!channel) {
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
 * @type {MiddlewareContext<void, AnyContext>}
 */
export const checkVoicePermissions: MiddlewareContext<void, AnyContext> = createMiddleware<void>(async ({ context, pass, next }) => {
    if (!context.inGuild()) return next();

    const state: VoiceState | null = await context.member.voice().catch((): null => null);
    if (!state) return pass();

    const channel: AllGuildVoiceChannels | null | undefined = await state.channel().catch((): null => null);
    if (!channel) return pass();

    const { stagePermissions, voicePermissions } = context.client.config.permissions;
    const { messages } = await context.locale();

    const me: GuildMember | null | undefined = await context.me().catch((): null => null);
    if (!me) return;

    const permissions: PermissionsBitField = await context.client.channels.memberPermissions(channel.id, me);
    const missings: PermissionStrings = permissions.keys(permissions.missings(channel.isStage() ? stagePermissions : voicePermissions));

    if (missings.length) {
        const keys: PermissionNames[] = getPermissionKeys(missings);

        await context.editOrReply({
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.permissions.embed.channel({
                        channelId: channel.id,
                    }),
                    color: EmbedColors.Red,
                    fields: [
                        {
                            name: messages.events.permissions.embed.field,
                            value: keys.map((p): string => `- ${messages.events.permissions.list[p]}`).join("\n"),
                        },
                    ],
                },
            ],
        });

        return pass();
    }

    return next();
});
