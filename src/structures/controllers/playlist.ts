import { Controller } from "#stelle/classes/Controller.js";
import type { userPlaylist } from "#stelle/prisma";
import { CacheKeys, type Omit } from "#stelle/types";
import { omitKeys } from "#stelle/utils/functions/utils.js";

/**
 * The type of the playlist data without the id and userId.
 */
type PlaylistData = Omit<userPlaylist, "id" | "userId">;

/**
 * The type of the playlist filter function.
 */
type PlaylistFilter = (data: userPlaylist) => boolean;

/**
 * Class representing the playlist controller.
 * @class PlaylistController
 * @extends Controller<"userPlaylist">
 */
export class PlaylistController extends Controller<"userPlaylist"> {
    readonly modelName = "userPlaylist";

    /**
     *
     * Get the playlist of a user from the database.
     * @param {string} playlistId The playlist id to get.
     * @returns {Promise<userPlaylist | null>} The playlist of the user.
     */
    public get(playlistId: string, userId: string): Promise<userPlaylist | null> {
        const cached = this.cache.get(CacheKeys.Playlist, playlistId);
        if (cached) return Promise.resolve(cached);

        return this.model.findUnique({ where: { playlistId, userId } });
    }

    /**
     *
     * Get a playlist that can be loaded by a user.
     * A playlist is loadable when it belongs to the user or when it is public.
     * @param {string} playlistId The playlist id to get.
     * @param {string} userId The user id requesting the playlist.
     * @returns {Promise<userPlaylist | null>} The loadable playlist.
     */
    public async getLoadable(playlistId: string, userId: string): Promise<userPlaylist | null> {
        const cached = this.cache.get(CacheKeys.Playlist, playlistId);
        if (cached && (cached.userId === userId || cached.public)) return cached;

        return this.model.findFirst({
            where: {
                playlistId,
                OR: [{ userId }, { public: true }],
            },
        });
    }

    /**
     *
     * Set the playlist of a user to the database.
     * @param {string} userId The user id to set the playlist for.
     * @param {PlaylistData} data The playlist data to set.
     * @returns {Promise<void>} A promise that resolves when the playlist is set.
     */
    public async set(userId: string, data: PlaylistData): Promise<void> {
        if ("id" in data) data = omitKeys(data, ["id"]);
        if ("userId" in data) data = omitKeys(data, ["userId"]);

        await this.model
            .upsert({
                where: { userId, playlistId: data.playlistId },
                create: { userId, ...data },
                update: data,
            })
            .then((created) => this.cache.set(CacheKeys.Playlist, created.playlistId, created));
    }

    /**
     *
     * Delete the playlist of a user from the database.
     * @param {string} userId The user id to delete the playlist for.
     * @param {string} playlistId The playlist id to delete.
     * @returns {Promise<void>} A promise that resolves when the playlist is deleted.
     */
    public async delete(userId: string, playlistId: string): Promise<void> {
        await this.model.delete({ where: { userId, playlistId } });
        this.cache.deleteKey(CacheKeys.Playlist, playlistId);
    }

    /**
     *
     * Get all playlists of a user from the database.
     * @param {PlaylistFilter} filter The filter function to apply to the playlists.
     * @returns {Promise<userPlaylist[]>} A promise that resolves to an array of playlists.
     */
    public async all(filter?: PlaylistFilter): Promise<userPlaylist[]> {
        const cached = this.cache.all(CacheKeys.Playlist, filter);
        if (cached.length) return Promise.resolve(cached);

        const playlists = await this.model.findMany();
        if (filter) return playlists.filter(filter);

        return playlists;
    }
}
