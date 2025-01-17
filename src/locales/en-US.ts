import type { RepeatMode } from "lavalink-client";
import { type PausedMode, type PermissionNames, StelleCategory } from "#stelle/types";

import { ApplicationCommandOptionType } from "seyfert/lib/types/index.js";

export default {
    metadata: {
        name: "English",
        emoji: "🇺🇸",
        translators: ["JustEvil"],
    },
    messages: {
        commands: {
            nowplaying: ({ title, url, author, requester, bar, duration, position }: INowplaying) =>
                `\`📻\` Now playing: [\`${title}\`](${url}) - \`${author}\`\n\`👤\` **Requested by**: <@${requester}>\n \n\`🕛\` ${bar} | \`${position}\` - \`(${duration})\``,
            setprefix: ({ prefix }: IPrefix) => `\`✅\` The **new prefix** for this guild is now: \`${prefix}\``,
            skip: ({ amount }: IAmount) => `\`✅\` Skipped the amount of: \`${amount} tracks\`.`,
            move: ({ textId, voiceId }: IMove) => `\`✅\` Moved to the voice channel <#${voiceId}> and the text channel: <#${textId}>`,
            previous: ({ title, uri }: IPrevious) => `\`✅\` The previous track [**${title}**](${uri}) has been added to the queue.`,
            stop: "`👋` Stopping and leaving...",
            shuffle: "`✅` The queue has been shuffled.",
            info: {
                bot: {
                    description: ({ clientName, defaultPrefix }: IBotInfo) =>
                        `\`📋\` Here are some stats about **${clientName}**, by default my prefix is: \`${defaultPrefix}\`.`,
                    invite: "Invite the Bot",
                    repository: "Github Repository",
                    fields: {
                        info: {
                            name: "`📋` Info",
                            value: ({ guilds, users, players }: IBotInfoGeneralField) =>
                                `\`📦\` **Guilds**: \`${guilds}\`\n\`👤\` **Users**: \`${users}\`\n\`🎤\` **Players**: \`${players}\``,
                        },
                        system: {
                            name: "`📋` System",
                            value: ({ memory, uptime }: IBotInfoSystemField) =>
                                `\`🧠\` **Memory**: \`${memory}\`\n\`🕛\` **Uptime**: <t:${uptime}:R>`,
                        },
                    },
                },
            },
            help: {
                noCommand: "`❌` **No command** was found for this search...",
                title: ({ clientName }: Pick<IMention, "clientName">) => `${clientName} - Help Menu`,
                description: ({ defaultPrefix }: Pick<IHelp, "defaultPrefix">) =>
                    `\`📦\` Hello! Here is the information about my commands and stuff.\n\`📜\` Select the command category of your choice.\n\n-# You can search a specific command by typing: \`${defaultPrefix} help <command>\``,
                selectMenu: {
                    description: ({ category }: IHelpMenu) => `Select the ${category} category.`,
                    placeholder: "Select a command category.",
                    options: {
                        description: ({ options }: Pick<IHelp, "options">) => `-# **Optional []**\n-# **Required <>**\n\n${options}`,
                        title: ({ clientName, category }: IHelpMenuEmbed) => `${clientName} - Help Menu | ${category}`,
                    },
                },
                aliases: {
                    [StelleCategory.Unknown]: "Unknown",
                    [StelleCategory.User]: "User",
                    [StelleCategory.Music]: "Music",
                    [StelleCategory.Guild]: "Guild",
                } satisfies Record<StelleCategory, string>,
            },
            default: {
                engine: ({ engine, clientName }: IEngine) => `\`✅\` The default search engine of ${clientName} is now: **${engine}**.`,
                volume: ({ volume, clientName }: IVolume) => `\`✅\` The default volume of ${clientName} is now: **${volume}%**.`,
            },
            setlocale: {
                invalidLocale: ({ locale, available }: ILocale & { available: string }) =>
                    `\`❌\` The locale : \`${locale}\` is invalid.\n\`📢\` **Available locales**: \`${available}\``,
                newLocale: ({ locale }: ILocale) => `\`✅\` The locale of **Stelle** is now: \`${locale}\``,
            },
            ping: {
                message: "`🪶` Calculating...",
                response: ({ wsPing, clientPing, shardPing }: IPing) =>
                    `\`🌐\` Pong! (**Client**: \`${wsPing}ms\` - **API**: \`${clientPing}ms\` - **Shard**: \`${shardPing}ms\`)`,
            },
            play: {
                undetermined: "Undetermined",
                live: "🔴 LIVE",
                noResults: "`❌` **No results** was found for this search...\n`🪶` Try searching something different.",
                autocomplete: {
                    noAnything: "Stelle - Something unexpected happened using this autocomplete.",
                    noNodes: "Stelle - I'm not connected to any of my nodes.",
                    noVoiceChannel: "Stelle - You are not in a voice channel... Join to play music.",
                    noSameVoice: "Stelle - You are not in the same voice channel as me.",
                    noQuery: "Stelle - Enter a track name or URL to play it.",
                    noTracks: "Stelle - No tracks was found. Enter another track name or URL.",
                },
                embed: {
                    playlist: ({ playlist, tracks, volume, query, requester }: IPlayList) =>
                        `\`🎵\` The playlist [\`${playlist}\`](${query}) has been added to the queue.\n\n\`🔊\` **Volume**: \`${volume}%\`\n\`👤\` **Requested by**: <@${requester}>\n\`🔰\` **With**: \`${tracks} tracks\``,
                    result: ({ title, url, duration, volume, requester }: IPlayTrack) =>
                        `\`🎵\` Added [\`${title}\`](${url}) to the queue.\n\n\`🕛\` **Duration**: \`${duration}\`\n\`🔊\` **Volume**: \`${volume}%\`\n\`👤\` **Requested by**: <@${requester}>`,
                    results: ({ title, url, duration, volume, requester, position }: IPlayTrack) =>
                        `\`🎵\` Added [\`${title}\`](${url}) to the queue.\n\n\`🕛\` **Duration**: \`${duration}\`\n\`🔊\` **Volume**: \`${volume}%\`\n\`👤\` **Requested by**: <@${requester}>\n\n\`📋\` **Position in queue**: \`#${position}\``,
                },
            },
            loop: {
                toggled: ({ type }: IType) => `\`✅\` The **loop mode** is now: \`${type}\``,
                loopType: {
                    off: "Off",
                    queue: "Queue",
                    track: "Track",
                } satisfies Record<RepeatMode, string>,
            },
            autoplay: {
                toggled: ({ type }: IType) => `\`✅\` The **autoplay mode** is now: \`${type}\``,
                autoplayType: {
                    enabled: "On",
                    disabled: "Off",
                },
            },
            nodes: {
                value: ({ state, uptime, players }: INodes) =>
                    `\`📘\` State: \`${state}\`\n\`🕛\` Uptime: \`${uptime}\`\n\`🎤\` Players: \`${players}\``,
                description: "`📋` List of all Stelle nodes.",
                noNodes: "`❌` No nodes available at the moment.",
                states: {
                    connected: "🟢 Connected.",
                    disconnected: "🔴 Disconnected.",
                } satisfies Record<string, string>,
            },
            volume: {
                changed: ({ volume }: IVolume) => `\`✅\` The volume has been set to: **${volume}%**.`,
                paused: "`🔰` The volume is **1%**, so the player has been paused.",
            },
            seek: {
                invalidTime: ({ time }: Pick<ISeek, "time">) => `\`❌\` The time \`${time}\` is not a valid time.`,
                seeked: ({ time, type }: ISeek) => `\`✅\` The track has been **${type}** to \`${time}\`.`,
                exeedsTime: ({ time }: Pick<ISeek, "time">) => `\`❌\` The time \`${time}\` exceeds the current track time.`,
                noSeekable: "`❌` The **current track** is not `seekable`.",
                type: {
                    seeked: "seeked",
                    rewond: "rewond",
                },
            },
        },
        events: {
            inCooldown: ({ time }: ICooldown) => `\`❌\` You need to wait: <t:${time}:R> (<t:${time}:t>) to use this.`,
            noSameVoice: ({ channelId }: IChannel) => `\`❌\` You are not in the **same voice channel** as me. (<#${channelId}>)`,
            noCollector: ({ userId }: IUser) => `\`❌\` Only the user: <@${userId}> can use this.`,
            invalidOptions: ({ options, list }: IOptions) =>
                `\`❌\` Invalid command options or arguments.\n-# - **Required**: \`<>\`\n-# - **Optional**: \`[]\`\n\n\`📋\` **Usage**:\n ${options}\n\`📢\` **Options Available**:\n${list}`,
            playerQueue: ({ tracks }: ITracks) => `\`📋\` Here is the full server queue: \n\n${tracks}`,
            channelEmpty: ({ type, clientName }: ITypeWithClientName) =>
                `\`🎧\` ${clientName} is alone in the **voice channel**... Pausing and waiting **${type}**.`,
            mention: ({ clientName, defaultPrefix, commandName }: IMention) =>
                `\`📢\` Hey! My name is: **${clientName}** and my prefix is: \`${defaultPrefix}\` and **/** too!\n\`📋\` If you want to see my commands, type: \`${defaultPrefix} ${commandName}\` or /${commandName}.`,
            noMembers: ({ clientName }: IClientName) => `\`🎧\` ${clientName} is alone in the **voice channel**... Leaving the channel.`,
            hasMembers: ({ clientName }: IClientName) => `\`🎧\` ${clientName} is not alone anymore... Resuming.`,
            noCommand: "`❌` I don't have the required command *yet*, try again in a moment.",
            onlyDeveloper: "`❌` Only the **bot developer** can use this.",
            onlyGuildOwner: "`❌` Only the **guild owner** can use this.",
            noVoiceChannel: "`❌` You are not in a **voice channel**... Join to play music.",
            noNodes: "`❌` I'm not connected to any of my nodes.",
            noPlayer: "`❌` Nothing is playing right now...",
            noPrevious: "`❌` There is no previous track to add.",
            noTracks: "`❌` There are no more tracks in the queue.",
            playerEnd: "`🔰` The queue has finished... Waiting for more tracks.",
            moreTracks: "`❌` In order to enable **this** `one or more tracks` are required.",
            commandError: "`❌` Something unexpected ocurred during the execution.\n`📢` If the problem persists, report the issue.",
            optionTypes: {
                [ApplicationCommandOptionType.Subcommand]: "subcommand",
                [ApplicationCommandOptionType.SubcommandGroup]: "subcommand group",
                [ApplicationCommandOptionType.String]: "string",
                [ApplicationCommandOptionType.Integer]: "integer",
                [ApplicationCommandOptionType.Boolean]: "boolean",
                [ApplicationCommandOptionType.User]: "@user",
                [ApplicationCommandOptionType.Channel]: "#channel",
                [ApplicationCommandOptionType.Role]: "@role",
                [ApplicationCommandOptionType.Mentionable]: "@mentionable",
                [ApplicationCommandOptionType.Number]: "number",
                [ApplicationCommandOptionType.Attachment]: "attachment",
            } satisfies Record<ApplicationCommandOptionType, string>,
            voiceStatus: {
                trackStart: ({ title, author }: IVoiceStatus) => `${title} by ${author}`,
                queueEnd: "The queue is empty.",
            },
            trackStart: {
                embed: ({ duration, requester, title, url, volume, author, size }: ITrackStart) =>
                    `\`📻\` Now playing [\`${title}\`](${url})\n\n\`🎤\` **Author**: \`${author}\`\n\`🕛\` **Duration**: \`${duration}\`\n\`🔊\` **Volume**: \`${volume}%\`\n\`👤\` **Requested by**: <@${requester}>\n\n\`📋\` **In queue**: \`${size} tracks\``,
                components: {
                    loop: ({ type }: IType) => `Loop: ${type}`,
                    autoplay: ({ type }: IType) => `Autoplay: ${type}`,
                    stop: "Stop",
                    skip: "Skip",
                    previous: "Previous",
                    queue: "Queue",
                    paused: {
                        resume: "Resume",
                        pause: "Pause",
                    } satisfies Record<PausedMode, string>,
                },
            },
            permissions: {
                list: {
                    AddReactions: "Add Reactions",
                    Administrator: "Administrator",
                    AttachFiles: "Attach Files",
                    BanMembers: "Ban Members",
                    ChangeNickname: "Change Nickname",
                    Connect: "Connect",
                    CreateInstantInvite: "Create Invites",
                    CreatePrivateThreads: "Create Private Threads",
                    CreatePublicThreads: "Create Public Threads",
                    DeafenMembers: "Deafen Members",
                    EmbedLinks: "Embed Links",
                    KickMembers: "Kick Members",
                    ManageChannels: "Manage Channels",
                    ManageEvents: "Manage Events",
                    ManageGuild: "Manage Server",
                    ManageMessages: "Manage Messages",
                    ManageNicknames: "Manage Nicknames",
                    ManageRoles: "Manage Roles",
                    ManageThreads: "Manage Threads",
                    ManageWebhooks: "Manage Webhooks",
                    MentionEveryone: "Mention Everyone",
                    ModerateMembers: "Moderate Members",
                    MoveMembers: "Move Members",
                    MuteMembers: "Mute Members",
                    PrioritySpeaker: "Priority Speaker",
                    ReadMessageHistory: "Read Message History",
                    RequestToSpeak: "Request To Speak",
                    SendMessages: "Send Messages",
                    SendMessagesInThreads: "Send Messages In Threads",
                    SendTTSMessages: "Send TTS Messages",
                    Speak: "Speak",
                    Stream: "Stream",
                    UseApplicationCommands: "Use Application Commands",
                    UseEmbeddedActivities: "Use Activities",
                    UseExternalEmojis: "Use External Emojis",
                    UseExternalStickers: "Use External Stickers",
                    UseVAD: "Use VAD",
                    ViewAuditLog: "View Audit Logs",
                    ViewChannel: "View Channel",
                    ViewGuildInsights: "View Guild Insights",
                    ManageGuildExpressions: "Manage Guild Expressions",
                    ViewCreatorMonetizationAnalytics: "View Creator Monetization Analytics",
                    UseSoundboard: "Use Sound Board",
                    UseExternalSounds: "Use External Sounds",
                    SendVoiceMessages: "Send Voice Messages",
                    CreateEvents: "Create Events",
                    CreateGuildExpressions: "Create Guild Expressions",
                    SendPolls: "Send Polls",
                    UseExternalApps: "Use External Apps",
                } satisfies Record<PermissionNames, string>,
                user: {
                    description: "`📢` Hey! You are missing some permissions to use this.",
                    field: "`📋` Missing Permissions",
                },
                bot: {
                    description: "`📢` Hey! I'm missing some permissions to do this.",
                    field: "`📋` Permissions",
                },
                channel: {
                    description: ({ channelId }: IChannel) => `\`📢\` Hey! I'm missing some permissions in the channel. <#${channelId}>`,
                    field: "`📋` Missing Permissions",
                },
            },
        },
    },
    locales: {
        play: {
            name: "play",
            description: "Play music with Stelle.",
            option: {
                name: "query",
                description: "Enter the track name or url.",
            },
        },
        ping: {
            name: "ping",
            description: "Get the Stelle ping.",
        },
        nodes: {
            name: "nodes",
            description: "Get the status of all Stelle nodes.",
        },
        setlocale: {
            name: "setlocale",
            description: "Set the locale of Stelle.",
            option: {
                name: "locale",
                description: "Enter the new locale.",
            },
        },
        autoplay: {
            name: "autoplay",
            description: "Toggle the autoplay.",
        },
        volume: {
            name: "volume",
            description: "Modify the volume.",
            option: {
                name: "volume",
                description: "Enter the volume.",
            },
        },
        loop: {
            name: "loop",
            description: "Toggle the loop mode.",
            option: {
                name: "mode",
                description: "Select the loop mode.",
            },
        },
        move: {
            name: "move",
            description: "Move the player.",
            options: {
                voice: {
                    name: "voice",
                    description: "Select the channel.",
                },
                text: {
                    name: "text",
                    description: "Select the channel.",
                },
            },
        },
        stop: {
            name: "stop",
            description: "Stop the player.",
        },
        skip: {
            name: "skip",
            description: "Skip the current track.",
            option: {
                to: {
                    name: "to",
                    description: "Skip a specific amount of songs.",
                },
            },
        },
        queue: {
            name: "queue",
            description: "See the queue.",
        },
        seek: {
            name: "seek",
            description: "Seek the current track.",
            option: {
                name: "time",
                description: "Enter the time. (Ex: 2min)",
            },
        },
        setprefix: {
            name: "setprefix",
            description: "Set the prefix of Stelle.",
            option: {
                name: "prefix",
                description: "Enter the new prefix.",
            },
        },
        default: {
            name: "default",
            description: "Change Stelle default settings.",
            subcommands: {
                engine: {
                    name: "engine",
                    description: "Change the player default search engine.",
                    option: {
                        name: "engine",
                        description: "Select the engine.",
                    },
                },
                volume: {
                    name: "volume",
                    description: "Change the player default volume.",
                },
            },
        },
        shuffle: {
            name: "shuffle",
            description: "Shuffle the queue.",
        },
        nowplaying: {
            name: "nowplaying",
            description: "Get the current playing song.",
        },
        help: {
            name: "help",
            description: "The most useful command in the world!",
            option: {
                name: "command",
                description: "The command to get help for.",
            },
        },
        info: {
            name: "info",
            description: "Get the info about the bot or a user.",
            subcommands: {
                bot: {
                    name: "bot",
                    description: "Get the bot info.",
                },
            },
        },
    },
};

type IBotInfoGeneralField = { guilds: number; users: number; players: number };
type IBotInfoSystemField = { memory: string; uptime: number };
type IBotInfo = Pick<IMention, "clientName" | "defaultPrefix">;
type IHelpMenuEmbed = Pick<IMention, "clientName"> & IHelpMenu;
type IVoiceStatus = Pick<ITrackStart, "title" | "author">;
type IClientName = Pick<IMention, "clientName">;
type IHelp = { defaultPrefix: string; options: string };
type IHelpMenu = { category: string };
type IMention = { clientName: string; defaultPrefix: string; commandName: string };
type INowplaying = { title: string; url: string; duration: string; requester: string; author: string; bar: string; position: string };
type IEngine = { engine: string } & Pick<IMention, "clientName">;
type IPrefix = { prefix: string };
type ISeek = { time: string | number; type: string };
type IAmount = { amount: number };
type IMove = { textId: string; voiceId: string };
type IVolume = { volume: number } & Pick<IMention, "clientName">;
type IType = { type: string };
type ITypeWithClientName = IType & Pick<IMention, "clientName">;
type ILocale = { locale: string };
type IPrevious = { title: string; uri: string };
type ITracks = { tracks: string };
type IOptions = { options: string; list: string };
type INodes = { state: string; uptime: string; players: number };
type ITrackStart = { title: string; url: string; duration: string; volume: number; requester: string; author: string; size: number };
type IPlayTrack = { title: string; url: string; duration: string; volume: number; requester: string; position: number };
type IPlayList = { query: string; playlist: string; volume: number; requester: string; tracks: number };
type IChannel = { channelId: string };
type IUser = { userId: string };
type IPing = { wsPing: number; clientPing: number; shardPing: number };
type ICooldown = { time: number };
