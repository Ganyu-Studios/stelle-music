import type { AutocompleteInteraction, User } from "seyfert";
import type { userPlaylist } from "#stelle/prisma";

/**
 *
 * The playlist autocomplete function.
 * @param {AutocompleteInteraction} interaction The autocomplete interaction.
 * @returns {Promise<void>} Nothing but a response, cool, right?
 */
export async function playlistAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const { client, user } = interaction;

    if (!interaction.guildId) return;

    const { messages } = client.t(await client.database.locales.get(interaction.guildId)).get();

    const subCommand: string | null = interaction.options.getSubCommand();
    const data: userPlaylist[] = [];

    if (subCommand && ["manage", "delete", "rename"].includes(subCommand)) {
        const array = await client.database.playlist.all(
            (playlist): boolean => playlist.userId === user.id || (playlist.public && playlist.userId === interaction.user.id),
        );

        data.push(...array);
    } else {
        const array = await client.database.playlist.all((playlist): boolean => playlist.userId === user.id || playlist.public);

        data.push(...array);
    }

    if (!data.length)
        return interaction.respond([
            {
                name: messages.events.autocomplete.noPlaylist,
                value: "no-playlists-found",
            },
        ]);

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

    if (!playlists.length) {
        return interaction.respond([
            {
                name: messages.events.autocomplete.noPlaylist,
                value: "no-playlists-found",
            },
        ]);
    }

    return interaction.respond(playlists);
}
