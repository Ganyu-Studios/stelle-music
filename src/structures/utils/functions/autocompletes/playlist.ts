import type { AutocompleteInteraction } from "seyfert";
import type { userPlaylist } from "#stelle/prisma";
import { ContextOps } from "#stelle/utils/functions/internal/context.js";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";

/**
 *
 * The playlist autocomplete function.
 * @param {AutocompleteInteraction} interaction The autocomplete interaction.
 * @returns {Promise<void>} Nothing but a response, cool, right?
 */
export async function playlistAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const { client, user } = interaction;

    if (!interaction.guildId) return;

    const { messages } = await ContextOps.locale(client, interaction.guildId);

    const subCommand: string | null = interaction.options.getSubCommand();
    const isManageable: boolean = !!(subCommand && ["manage", "delete", "rename"].includes(subCommand));

    // Managing (manage/delete/rename) only ever targets your own playlists; loading/viewing can also reach public
    // ones. Both are scoped and capped (Discord shows at most 25 choices) in the query — no whole-collection scan.
    const data: userPlaylist[] = isManageable
        ? await client.database.playlist.owned(user.id, 25)
        : await client.database.playlist.loadable(user.id, 25);

    if (!data.length) return interaction.respond(UtilsOps.autocomplete(messages.events.autocomplete.noPlaylist));

    /**
     *
     * Get the visibility of the playlist.
     * @param {boolean} isPublic True if the playlist is public, false otherwise.
     * @returns {string} The visibility of the playlist.
     */
    const getVisibility = (isPublic: boolean): string => {
        const type = isPublic ? "public" : "private";
        return messages.commands.playlist.state[type];
    };

    // Already ordered (public first) and capped to 25 by the query above, so just map to choices.
    const playlists = data.map((playlist) => ({
        value: playlist.playlistId,
        name: messages.events.autocomplete.loadPlaylist({
            name: playlist.playlistName,
            visibility: getVisibility(playlist.public),
            // The owner's tag is snapshotted on the playlist (see create.subcommand), so no per-playlist user
            // fetch is needed here. Legacy playlists without a stored author fall back to the raw id.
            author: playlist.author?.tag ?? playlist.userId,
        }),
    }));

    if (!playlists.length) return interaction.respond(UtilsOps.autocomplete(messages.events.autocomplete.noPlaylist));

    return interaction.respond(playlists);
}
