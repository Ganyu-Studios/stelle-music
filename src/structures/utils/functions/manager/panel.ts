import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { LoopMode, type PlayerStructure, type TrackStructure } from "hoshimi";
import { ActionRow, AttachmentBuilder, Button, type DefaultLocale, Embed, type UsingClient } from "seyfert";
import { ButtonStyle } from "seyfert/lib/types/index.js";
import { StelleMusic } from "#stelle/utils/data/constants.js";
import { ContextOps } from "#stelle/utils/functions/internal/context.js";
import { TrackOps } from "#stelle/utils/functions/internal/track.js";

/**
 * The messages tree of a resolved locale.
 */
type Messages = DefaultLocale["messages"];

/**
 * How many upcoming queue entries the panel lists.
 * @type {number}
 */
const QUEUE_PREVIEW: number = 10;

/**
 * The state used to render the player control buttons.
 */
interface ControlsState {
    /** Whether autoplay is enabled. */
    isAutoplay: boolean;
    /** The current loop mode. */
    loop: LoopMode;
    /** Whether the player is paused. */
    paused: boolean;
    /** Whether the buttons should be disabled (idle panel). */
    disabled?: boolean;
}

/**
 * Build the two rows of player control buttons shared by the ephemeral now-playing message ({@link file track/start})
 * and the persistent request-channel panel. The custom ids match the component handlers in `src/components`.
 * @param {Messages} messages The resolved locale messages.
 * @param {ControlsState} state The button state (autoplay / loop / paused / disabled).
 * @returns {ActionRow<Button>[]} The two control rows.
 */
export function buildControls(messages: Messages, state: ControlsState): ActionRow<Button>[] {
    const { isAutoplay, loop, paused, disabled = false } = state;
    const { components } = messages.events.trackStart;

    return [
        new ActionRow<Button>().addComponents(
            new Button().setCustomId("player-stopPlayer").setStyle(ButtonStyle.Danger).setLabel(components.stop).setDisabled(disabled),
            new Button().setCustomId("player-skipTrack").setStyle(ButtonStyle.Secondary).setLabel(components.skip).setDisabled(disabled),
            new Button()
                .setCustomId("player-previousTrack")
                .setStyle(ButtonStyle.Secondary)
                .setLabel(components.previous)
                .setDisabled(disabled),
            new Button().setCustomId("player-lyricsShow").setStyle(ButtonStyle.Secondary).setLabel(components.lyrics).setDisabled(disabled),
            new Button().setCustomId("player-guildQueue").setStyle(ButtonStyle.Primary).setLabel(components.queue).setDisabled(disabled),
        ),
        new ActionRow<Button>().addComponents(
            new Button()
                .setCustomId("player-toggleAutoplay")
                .setStyle(ButtonStyle.Primary)
                .setLabel(components.autoplay({ type: messages.commands.autoplay.autoplayType[StelleMusic.AutoplayState(isAutoplay)] }))
                .setDisabled(disabled),
            new Button()
                .setCustomId("player-toggleLoop")
                .setStyle(ButtonStyle.Secondary)
                .setLabel(components.loop({ type: messages.commands.loop.loopType[loop] }))
                .setDisabled(disabled),
            new Button()
                .setCustomId("player-pauseTrack")
                .setStyle(ButtonStyle.Primary)
                .setLabel(components.states[StelleMusic.PauseState(paused)])
                .setDisabled(disabled),
        ),
    ];
}

/**
 * The rendered body of the request-channel panel.
 */
interface PanelBody {
    embeds: Embed[];
    components: ActionRow<Button>[];
    files: AttachmentBuilder[];
}

/**
 * Build the persistent request-channel panel body. With a `track` it renders the now-playing state (big artwork, the
 * now-playing block reused from the ephemeral message, and an up-next queue preview); without it, the idle state
 * (prompt + disabled controls).
 * @param {UsingClient} client The client instance.
 * @param {Messages} messages The resolved locale messages.
 * @param {PlayerStructure} [player] The guild player, when active.
 * @param {TrackStructure} [track] The current track, when active.
 * @returns {PanelBody} The embeds + components to write/edit into the panel.
 */
export async function buildPanel(
    client: UsingClient,
    messages: Messages,
    player?: PlayerStructure,
    track?: TrackStructure,
): Promise<PanelBody> {
    const embed = new Embed()
        .setTitle(messages.events.requestChannel.title({ clientName: client.me.username }))
        .setColor(client.config.color.extra);

    const file = await readFile(resolve(process.cwd(), "assets", "images", "request", "request-banner.png"));
    const attachment = new AttachmentBuilder().setFile("buffer", file).setName("request-banner.png");

    embed.setImage("attachment://request-banner.png");

    if (player && track) {
        const isAutoplay: boolean = (await player.data.get("enabledAutoplay")) ?? false;

        const nowPlaying: string = messages.events.trackStart.embed({
            duration: TrackOps.duration(track, messages),
            requester: track.requester.id,
            title: track.info.title,
            url: track.info.uri,
            volume: player.volume,
            author: track.info.author,
            size: player.queue.tracks.length,
        });

        const upNext: string[] = player.queue.tracks.slice(0, QUEUE_PREVIEW).map((entry, index): string =>
            messages.events.requestChannel.queueEntry({
                position: index + 1,
                title: entry.info.title,
                requester: entry.requester.id,
            }),
        );

        const queue: string = upNext.length ? `\n\n${messages.events.requestChannel.queueTitle}\n${upNext.join("\n")}` : "";

        embed
            .setImage(track.info.artworkUrl ?? undefined)
            .setDescription(`${nowPlaying}${queue}`)
            .setTimestamp();

        return {
            embeds: [embed],
            files: [attachment],
            components: buildControls(messages, { isAutoplay, loop: player.loop, paused: player.paused }),
        };
    }

    embed.setThumbnail(client.me.avatarURL()).setDescription(messages.events.requestChannel.empty);

    return {
        embeds: [embed],
        files: [attachment],
        components: buildControls(messages, { isAutoplay: false, loop: LoopMode.Off, paused: false, disabled: true }),
    };
}

/**
 * Edit the guild's persistent panel to reflect the given state (or idle when no track). No-op when the guild has no
 * request channel configured. If the stored panel message is gone, it is re-posted and the stored id is refreshed.
 * @param {UsingClient} client The client instance.
 * @param {string} guildId The guild id.
 * @param {PlayerStructure} [player] The guild player, when active.
 * @param {TrackStructure} [track] The current track, when active.
 * @returns {Promise<void>} A promise that resolves once the panel is updated.
 */
export async function updatePanel(client: UsingClient, guildId: string, player?: PlayerStructure, track?: TrackStructure): Promise<void> {
    const config = await client.database.requests.get(guildId);
    if (!config) return;

    const { messages } = await ContextOps.locale(client, guildId);
    const body: PanelBody = await buildPanel(client, messages, player, track);

    const edited = await client.messages.edit(config.messageId, config.channelId, body).catch((): null => null);
    if (edited) return;

    // The panel message was deleted out from under us: re-post it and persist the new id.
    const posted = await client.messages.write(config.channelId, body).catch((): null => null);
    if (posted) await client.database.requests.set(guildId, { channelId: config.channelId, messageId: posted.id });
}

/**
 * Reset the guild's persistent panel to its idle state (no track playing).
 * @param {UsingClient} client The client instance.
 * @param {string} guildId The guild id.
 * @returns {Promise<void>} A promise that resolves once the panel is reset.
 */
export function resetPanel(client: UsingClient, guildId: string): Promise<void> {
    return updatePanel(client, guildId);
}
