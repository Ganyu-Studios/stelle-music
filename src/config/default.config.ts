import { SearchSources } from "hoshimi";
import { Locale, PermissionFlagsBits } from "seyfert/lib/types/index.js";
import { createConfig } from "#stelle/utils/data/configuration.js";
import { ms } from "#stelle/utils/functions/time.js";
import { Sessions } from "#stelle/utils/manager/sessions.js";

export default createConfig({
    defaultLocale: Locale.EnglishUS,
    defaultPrefix: "stelle",
    prefixes: ["st!"],
    defaultSearchSource: SearchSources.Spotify,
    defaultVolume: 60,
    lyricsLines: 10,
    disconnectTime: ms("30s"),
    inviteLink:
        "https://discord.com/oauth2/authorize?client_id=1241085977544359968&permissions=36793408&integration_type=0&scope=bot+applications.commands", // <-- Replace with your bot invite
    githubLink: "https://github.com/Ganyu-Studios/stelle-music",
    developerIds: [], // <-- Replace with an array of user ids
    guildIds: [], // <-- Same here, replace with an array of guild ids
    presenceInterval: ms("25s"),
    nodes: Sessions.resolve(
        {
            id: "SN #1", // <--- AKA Stelle Node
            host: "localhost",
            port: 2333,
            password: "youshallnotpass",
            secure: false,
            retryAmount: 25,
            retryDelay: ms("30s"),
        },
        {
            id: "SN #2",
            host: "localhost",
            port: 2334,
            password: "youshallnotpass",
            secure: false,
            retryAmount: 25,
            retryDelay: ms("30s"),
        },
        // <--- Add more nodes here if you want...
    ),
    color: {
        success: 0x8d86a8,
        extra: 0xece8f1,
    },
    channels: {
        guildsId: "the-id-was-here", // <-- Guild logs channel,
        errorsId: "the-id-wasn't-here", // <-- Errors logs channel.
    },
    permissions: {
        stagePermissions: [PermissionFlagsBits.MuteMembers],
        voicePermissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
    },
    sessions: {
        enabled: true,
        resumeTime: 60,
        resumePlayers: true,
    },
    cache: {
        size: 5,
        expire: ms("5mins"),
    },
    deleter: {
        onTrackEnd: false,
        onTrackSkip: false,
        onPlayerStop: false,
    },
    twentyfourseven: {
        autoPause: true,
        is247: false,
    },
    playlists: {
        userLimit: 25,
        trackLimit: 100,
    },
});
