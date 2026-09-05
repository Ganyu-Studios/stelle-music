import {
    type AllGuildVoiceChannels,
    Command,
    createBooleanOption,
    Declare,
    type GuildCommandContext,
    type GuildMember,
    LocalesT,
    Middlewares,
    Options,
    type VoiceState,
} from "seyfert";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { type AutoplayState, StelleCategory } from "#stelle/types";
import { StelleMusic } from "#stelle/utils/data/constants.js";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { TrackOps } from "#stelle/utils/functions/internal/track.js";
import { joinVoiceChannel } from "#stelle/utils/functions/manager/voice.js";
import { Sessions } from "#stelle/utils/manager/sessions.js";

const options = {
    autopause: createBooleanOption({
        description: "Whether to auto-pause the player when everyone leaves the voice channel.",
        required: false,
        flag: true,
        locales: {
            name: "locales.twentyforseven.option.name",
            description: "locales.twentyforseven.option.description",
        },
    }),
};

@Declare({
    name: "247",
    description: "Toggles the 24/7 mode for the bot.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    aliases: ["twentyfourseven", "alwaysonline", "alwayson"],
})
@StelleOptions({ category: StelleCategory.Music, cooldown: 10 })
@Middlewares(["checkNodes", "checkVoiceChannel", "checkVoicePermissions", "checkBotVoiceChannel"])
@LocalesT("locales.twentyforseven.name", "locales.twentyforseven.description")
@Options(options)
export default class TwentyFourSevenCommand extends Command {
    override async run(ctx: GuildCommandContext<typeof options>) {
        const { client, member, channelId, guildId } = ctx;
        const { messages } = await ctx.locale();

        const me: GuildMember | null = await ctx.me().catch((): null => null);
        if (!me) return;

        const state: VoiceState | null = await member.voice().catch((): null => null);
        const voice: AllGuildVoiceChannels | null | undefined = await state?.channel().catch((): null => null);
        if (!voice) return;

        const { defaultVolume } = await client.database.players.get(guildId);

        // Create-or-get: `createPlayer` returns the existing player when one already exists for the guild, so 24/7 can
        // be toggled with or without an active player — no `checkPlayer` guard needed.
        const player = client.manager.createPlayer({
            guildId,
            voiceId: voice.id,
            textId: channelId,
            volume: defaultVolume,
            selfMute: false,
            selfDeaf: true,
        });

        await joinVoiceChannel(player, voice, me);

        if (!(await player.data.get("localeString"))) await player.data.set("localeString", await ctx.localeString());
        if (!(await player.data.get("me"))) await player.data.set("me", TrackOps.requesterFn(client.me));

        const is247: boolean = !(await player.data.get("is247"));

        await player.data.set("is247", is247);
        await player.data.set("isAutoPause", ctx.options.autopause ?? false);

        const autoPause: boolean = (await player.data.get("isAutoPause"))!;

        // Persist right away so the 24/7 autoreconnect (which reads is247 from the session on playerDestroy) reflects
        // the new value even before the next player update writes it.
        if (client.config.sessions.enabled) await Sessions.save(player);

        // Turning 24/7 off on an idle player: leave the channel instead of lingering. `destroy()` uses reason
        // `Player-Stop`, so the autoreconnect branch never triggers here.
        if (!is247 && !player.playing && !player.queue.current && !player.queue.tracks.length) await player.destroy();

        /**
         *
         * Get the localized string for the autoplay state
         * @param {AutoplayState} state The autoplay state
         * @returns {string} The localized string for the autoplay state
         */
        const enabledState = (state: AutoplayState): string => messages.commands.is247.enabledType[state];

        await ctx.successReply(
            messages.commands.is247.enabled({
                is247: enabledState(StelleMusic.AutoplayState(is247)),
                autoPause: enabledState(StelleMusic.AutoplayState(autoPause)),
            }),
        );
    }
}
