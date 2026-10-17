import {
    type AllGuildVoiceChannels,
    type AnyContext,
    createMiddleware,
    type GuildMember,
    type MiddlewareContext,
    type VoiceState,
} from "seyfert";
import type { PermissionStrings } from "seyfert/lib/common/index.js";
import type { PermissionNames } from "#stelle/types/index.js";
import { PermissionOps } from "#stelle/utils/functions/internal/permissions.js";

/**
 * Check if the bot is in a voice channel and if is the same as the author.
 * @type {MiddlewareContext<void, AnyContext>}
 */
export const checkBotVoiceChannel: MiddlewareContext<void, AnyContext> = createMiddleware<void>(async ({ context, stop, next }) => {
    if (!context.inGuild()) return next();

    const { messages } = await context.locale();

    const me: GuildMember | null | undefined = await context.me().catch((): null => null);
    if (!me) return;

    const state: VoiceState = await context.member.voice();
    if (!state) return stop();

    const bot: VoiceState | null = await me.voice().catch((): null => null);
    if (bot && bot.channelId !== state.channelId) {
        await context.errorReply(messages.events.no.sharedVoice({ channelId: bot.channelId! }), { ephemeral: true });

        return stop();
    }

    return next();
});

/**
 * Check if the author is in a voice channel.
 * @type {MiddlewareContext<void, AnyContext>}
 */
export const checkVoiceChannel: MiddlewareContext<void, AnyContext> = createMiddleware<void>(async ({ context, stop, next }) => {
    if (!context.inGuild()) return next();

    const { messages } = await context.locale();

    const state: VoiceState | null = await context.member.voice().catch((): null => null);

    const channel: AllGuildVoiceChannels | null | undefined = await state?.channel().catch((): null => null);
    if (!channel) {
        await context.errorReply(messages.events.no.voiceChannel, { ephemeral: true });

        return stop();
    }

    return next();
});

/**
 * Check if the bot has permissions to join the voice channel.
 * @type {MiddlewareContext<void, AnyContext>}
 */
export const checkVoicePermissions: MiddlewareContext<void, AnyContext> = createMiddleware<void>(async ({ context, stop, next }) => {
    if (!context.inGuild()) return next();

    const state: VoiceState | null = await context.member.voice().catch((): null => null);
    if (!state) return stop();

    const channel: AllGuildVoiceChannels | null | undefined = await state.channel().catch((): null => null);
    if (!channel) return stop();

    const me: GuildMember | null | undefined = await context.me().catch((): null => null);
    if (!me) return stop();

    const { stagePermissions, voicePermissions } = context.client.config.permissions;
    const required: PermissionStrings = channel.isStage() ? stagePermissions : voicePermissions;

    const missings: PermissionNames[] = await PermissionOps.missing(context.client, channel.id, me, required);
    if (missings.length) {
        const { messages } = await context.locale();
        await context.editOrReply(PermissionOps.message(messages, channel.id, missings));

        return stop();
    }

    return next();
});
