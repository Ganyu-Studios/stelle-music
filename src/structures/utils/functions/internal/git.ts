import { exec } from "node:child_process";
import { promisify } from "node:util";
import { Formatter } from "seyfert";
import { TimestampStyle } from "seyfert/lib/common/index.js";
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
        const { stdout: remoteUrl } = await execAsync("git config --get remote.origin.url");

        const commitHash: string = commit.trim();

        let commitUrl: string = remoteUrl.trim();
        if (commitUrl.startsWith("git@")) {
            commitUrl = commitUrl
                .replace("git@", "https://")
                .replace(":", "/")
                .replace(/\.git$/, "");
        } else if (commitUrl.startsWith("https://")) {
            commitUrl = commitUrl.replace(/\.git$/, "");
        }

        commitUrl = `${commitUrl}/commit/${commitHash}`;

        const date: Date = new Date(time.trim());

        return {
            branch: branch.trim(),
            commit: commitHash.slice(0, 7),
            commitUrl: commitUrl.trim(),
            time: Formatter.timestamp(date, TimestampStyle.ShortDateMediumTime),
        };
    } catch {
        return null;
    }
}
