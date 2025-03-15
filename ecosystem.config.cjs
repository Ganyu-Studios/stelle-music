//@ts-check

/**
 * @type {Ecosystem}
 * PM2 Ecosystem app configuration.
 */
const ecosystem = {
    apps: [
        {
            name: "Stelle",
            script: "dist/index.js",
            watch: false,
        },
    ]
}

module.exports = ecosystem;

/**
 * These are hardcoded types, so they can be wrong, any PR is welcome to fix them.
 * You can remove them if you don't want to use them.
 * @link https://pm2.keymetrics.io/docs/usage/application-declaration/
 */

/**
 * @typedef Ecosystem
 * @property {Apps[]} apps - List of applications to be managed by PM2.
 */

/**
 * @typedef Apps
 * @property {string} name - Application name (defaults to script filename without extension).
 * @property {string} script - Script path relative to pm2 start.
 * @property {string} [cwd] - The directory from which your app will be launched.
 * @property {string} [args] - String containing all arguments passed via CLI to script.
 * @property {string} [interpreter] - Interpreter absolute path (defaults to node).
 * @property {string} [interpreter_args] - Option to pass to the interpreter.
 * @property {string} [node_args] - Alias to interpreter_args.
 * @property {number} [instances] - Number of app instances to be launched.
 * @property {string} [exec_mode] - Mode to start your app, can be "cluster" or "fork" (defaults to fork).
 * @property {boolean | string[]} [watch] - Enable watch & restart feature.
 * @property {string[]} [ignore_watch] - List of regex to ignore some file or folder names by the watch feature.
 * @property {string} [max_memory_restart] - Restart app if it exceeds the specified memory amount.
 * @property {Record<string, string>} [env] - Environment variables for development.
 * @property {Record<string, string>} [env_production] - Environment variables for production.
 * @property {boolean} [appendEnvToName] - Append environment to name (defaults to false).
 * @property {boolean} [source_map_support] - Enable/disable source map file (defaults to true).
 * @property {string} [instance_var] - Instance variable name.
 * @property {string[]} [filter_env] - Excludes global variables starting with specified prefixes.
 * @property {string} [log_date_format] - Log date format.
 * @property {string} [error_file] - Error file path.
 * @property {string} [out_file] - Output file path.
 * @property {string} [log_file] - File path for both output and error logs.
 * @property {boolean} [combine_logs] - Avoid suffixing logs file with the process id.
 * @property {boolean} [merge_logs] - Alias to combine_logs.
 * @property {boolean} [time] - Auto prefix logs with Date.
 * @property {string} [pid_file] - PID file path.
 * @property {number} [min_uptime] - Minimum uptime of the app to be considered started.
 * @property {number} [listen_timeout] - Time in ms before forcing a reload if app not listening.
 * @property {number} [kill_timeout] - Time in milliseconds before sending a final SIGKILL.
 * @property {boolean} [shutdown_with_message] - Shutdown an application with process.send('shutdown') instead of process.kill(pid, SIGINT).
 * @property {boolean} [wait_ready] - Wait for process.send('ready') instead of listening event.
 * @property {number} [max_restarts] - Number of consecutive unstable restarts before your app is considered errored.
 * @property {number} [restart_delay] - Time to wait before restarting a crashed app (in milliseconds).
 * @property {boolean} [autorestart] - If false, PM2 will not restart your app if it crashes or ends peacefully.
 * @property {string} [cron_restart] - A cron pattern to restart your app.
 * @property {boolean} [vizion] - If false, PM2 will start without vizion features (versioning control metadata).
 * @property {string[]} [post_update] - Commands to execute after a Pull/Upgrade operation from Keymetrics dashboard.
 * @property {boolean} [force] - If true, you can start the same script several times.
 */