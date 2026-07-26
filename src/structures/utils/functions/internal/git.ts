import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { IBotInfoGitField, Prettify } from "#stelle/types";

/**
 * The type of the Git information.
 */
export type GitInfo = Prettify<IBotInfoGitField & { date: Date }>;

/**
 * Execute a shell command asynchronously and return the result.
 * @param {string} command The shell command to execute.
 * @returns {Promise<{ stdout: string; stderr: string }>} The result of the command execution.
 */
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
        const divided: number = Math.floor(date.getTime() / 1e3);

        return {
            date,
            branch: branch.trim(),
            commit: commitHash.slice(0, 7),
            commitUrl: commitUrl.trim(),
            time: `<t:${divided}:S>`,
        };
    } catch {
        return null;
    }
}
