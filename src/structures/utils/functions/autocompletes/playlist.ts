import type { AutocompleteInteraction, User } from "seyfert";
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

    const data: userPlaylist[] = await client.database.playlist.all(
        (playlist): boolean =>
            playlist.userId === user.id || (playlist.public && (!isManageable || playlist.userId === interaction.user.id)),
    );

    if (!data.length) return interaction.respond(UtilsOps.autocompleteNotice(messages.events.autocomplete.noPlaylist));

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

    const playlists = await Promise.all(
        data
            .sort((a, b) => (a.public === b.public ? 0 : a.public ? -1 : 1))
            .map(async (playlist) => {
                const author: User = await client.users.fetch(playlist.userId);
                return {
                    value: playlist.playlistId,
                    name: messages.events.autocomplete.loadPlaylist({
                        name: playlist.playlistName,
                        visibility: getVisibility(playlist.public),
                        author: author.tag,
                    }),
                };
            })
            .slice(0, 25),
    );

    if (!playlists.length) return interaction.respond(UtilsOps.autocompleteNotice(messages.events.autocomplete.noPlaylist));

    return interaction.respond(playlists);
}
