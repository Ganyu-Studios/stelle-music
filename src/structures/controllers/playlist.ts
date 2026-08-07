import { Controller } from "#stelle/classes/database/Controller.js";
import type { userPlaylist } from "#stelle/prisma";
import type { Omit } from "#stelle/types";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";

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
     * @param {string} userId The user id that owns the playlist.
     * @returns {Promise<userPlaylist | null>} The playlist of the user.
     */
    public get(playlistId: string, userId: string): Promise<userPlaylist | null> {
        // Clone on read: callers mutate the returned playlist (tracks, name) before persisting, so handing back the
        // cached object would poison the shared entry before the DB write lands.
        return this.cacheGet({
            read: () => {
                const cached = this.cache.playlists.get(playlistId);
                return cached && cached.userId === userId ? cached : undefined;
            },
            write: (record): void => {
                // Global collection addressed by playlistId, but the query is scoped by owner: cache only a hit, never a
                // `null` miss — a null here means "not this user's", not "no such playlist", and would poison the owner.
                if (record) this.cache.playlists.set(record.playlistId, record);
            },
            query: () => this.model.findUnique({ where: { playlistId, userId } }),
            clone: true,
        });
    }

    /**
     *
     * Get a playlist that can be loaded by a user.
     * A playlist is loadable when it belongs to the user or when it is public.
     * @param {string} playlistId The playlist id to get.
     * @param {string} userId The user id requesting the playlist.
     * @returns {Promise<userPlaylist | null>} The loadable playlist.
     */
    public getLoadable(playlistId: string, userId: string): Promise<userPlaylist | null> {
        // Clone on read: same rationale as get() — the loaded playlist's tracks are copied into a live queue.
        return this.cacheGet({
            read: () => {
                const cached = this.cache.playlists.get(playlistId);
                return cached && (cached.userId === userId || cached.public) ? cached : undefined;
            },
            write: (record): void => {
                if (record) this.cache.playlists.set(record.playlistId, record);
            },
            query: () =>
                this.model.findFirst({
                    where: {
                        playlistId,
                        OR: [{ userId }, { public: true }],
                    },
                }),
            clone: true,
        });
    }

    /**
     *
     * Set the playlist of a user to the database.
     * @param {string} userId The user id to set the playlist for.
     * @param {PlaylistData} data The playlist data to set.
     * @returns {Promise<void>} A promise that resolves when the playlist is set.
     */
    public set(userId: string, data: PlaylistData): Promise<void> {
        if ("id" in data) data = UtilsOps.omit(data, ["id"]);
        if ("userId" in data) data = UtilsOps.omit(data, ["userId"]);

        return this.cacheSet({
            write: (record): void => {
                this.cache.playlists.set(record.playlistId, record);
            },
            query: () =>
                this.model.upsert({
                    where: { userId, playlistId: data.playlistId },
                    create: { userId, ...data },
                    update: data,
                }),
        });
    }

    /**
     *
     * Delete the playlist of a user from the database.
     * @param {string} userId The user id to delete the playlist for.
     * @param {string} playlistId The playlist id to delete.
     * @returns {Promise<void>} A promise that resolves when the playlist is deleted.
     */
    public delete(userId: string, playlistId: string): Promise<void> {
        return this.cacheDelete({
            evict: (): void => {
                this.cache.playlists.delete(playlistId);
            },
            query: () => this.model.delete({ where: { userId, playlistId } }),
        });
    }

    /**
     *
     * Get all playlists of a user from the database. This never reads the cache: the cache is a bounded, partial
     * subset, so it can't authoritatively answer an "every playlist" query.
     * @param {PlaylistFilter} [filter] The filter function to apply to the playlists.
     * @returns {Promise<userPlaylist[]>} A promise that resolves to an array of playlists.
     */
    public async all(filter?: PlaylistFilter): Promise<userPlaylist[]> {
        const playlists = await this.model.findMany();
        if (filter) return playlists.filter(filter);

        return playlists;
    }

    /**
     *
     * Count all playlists owned by a user, straight from the database (see all()).
     * @param {string} userId The user id to count playlists from.
     * @returns {Promise<number>} The amount of playlists for the user.
     */
    public countByUser(userId: string): Promise<number> {
        return this.model.count({ where: { userId } });
    }
}
