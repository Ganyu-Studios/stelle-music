import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { IBotInfoGitField, Prettify } from "#stelle/types";

/**
 * The type of the Git information.
 */
export type GitInfo = Prettify<IBotInfoGitField>;

const execAsync = promisify(exec);

/**
 *
 * Fetches the current Git branch, commit hash, and commit time.
 * @returns {Promise<GitInfo | null>} An object containing Git information or null if an error occurs.
 */
export async function getGitInfo(): Promise<GitInfo | null> {
    try {
        const { stdout: branch } = await execAsync("git rev-parse --abbrev-ref HEAD");
        const { stdout: commit } = await execAsync("git rev-parse HEAD");
        const { stdout: time } = await execAsync("git log -1 --format=%cd");

        const date = new Date(time.trim());

        return {
            branch: branch.trim(),
            commit: commit.trim().slice(0, 7),
            time: `${date.toLocaleDateString()} : ${date.toLocaleTimeString()}`,
        };
    } catch {
        return null;
    }
}
