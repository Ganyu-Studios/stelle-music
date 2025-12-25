import type { RepeatMode } from "lavalink-client";
import { ApplicationCommandOptionType } from "seyfert/lib/types/index.js";
import { type PausedState, type PermissionNames, StelleCategory } from "#stelle/types";

/**
 * The English locale for Stelle.
 */
export default {
    metadata: {
        name: "English",
        emoji: "🇺🇸",
        translators: ["JustEvil"],
    },
    messages: {
        commands: {
            join: ({ channelId }: IChannel): string => `\`✅\` Joined the voice channel <#${channelId}>.`,
            nowplaying: ({ title, url, author, requester, bar, duration, position }: INowplaying): string =>
                `\`📻\` Now playing: [\`${title}\`](${url}) - \`${author}\`\n\`👤\` **Requested by**: <@${requester}>\n \n\`🕛\` ${bar} | \`${position}\` - \`(${duration})\``,
            setprefix: ({ prefix }: IPrefix): string => `\`✅\` The **new prefix** for this guild is now: \`${prefix}\``,
            skip: ({ amount }: IAmount): string => `\`✅\` Skipped the amount of: \`${amount} tracks\`.`,
            move: ({ textId, voiceId }: IMove): string =>
                `\`✅\` Moved to the voice channel <#${voiceId}> and the text channel: <#${textId}>`,
            previous: ({ title, uri }: IPrevious): string =>
                `\`✅\` The previous track [**${title}**](${uri}) has been added to the queue.`,
            stop: "`👋` Stopping and leaving...",
            shuffle: "`✅` The queue has been shuffled.",
            playlist: {
                created: ({ name, state }: IPlaylist): string =>
                    `\`✅\` The playlist **${name}** has been created successfully.\n\`📋\` **Visibility**: \`${state}\``,
                load: ({ id }: IPlaylistLoad): string => `\`✅\` The playlist with id: \`${id}\` has been loaded successfully.`,
                noPlaylist: "`❌` **No playlist** was found with this id...",
                noTracks: "`❌` **No tracks** were found in this playlist...",
                state: {
                    public: "Public",
                    private: "Private",
                },
            },
            lyrics: {
                noLyrics: "`❌` **No lyrics** was found for this track...",
                close: "Close",
                sync: "Sync",
                embed: {
                    title: ({ title }: ILyricsEmbedTitle): string => `\`📜\` Lyrics for: ${title}`,
                    description: ({ provider, lines, author }: ILyricsEmbedDescription): string =>
                        `-# Provided by: ${provider}\n-# By: ${author}\n\n${lines}`,
                    footer: ({ userName }: ILyricsEmbedFooter): string => `Requested by: ${userName}`,
                },
            },
            info: {
                bot: {
                    description: ({ clientName, defaultPrefix }: IBotInfo): string =>
                        `\`📋\` Here are some stats about **${clientName}**, by default my prefix is: \`${defaultPrefix}\`.`,
                    invite: "Invite the Bot",
                    repository: "Github Repository",
                    fields: {
                        info: {
                            name: "`📋` Info",
                            value: ({ guilds, users, players }: IBotInfoGeneralField): string =>
                                `\`📦\` Guilds: \`${guilds}\`\n\`👤\` Users: \`${users}\`\n\`🎤\` Players: \`${players}\``,
                        },
                        system: {
                            name: "`📋` System",
                            value: ({ memory, uptime, version }: IBotInfoSystemField): string =>
                                `\`🧠\` Memory: \`${memory}\`\n\`📜\` Version: \`v${version}\`\n\`🕛\` Uptime: <t:${uptime}:R>`,
                        },
                    },
                },
            },
            help: {
                title: ({ clientName }: Pick<IMention, "clientName">): string => `${clientName} - Help Menu`,
                description: ({ defaultPrefix }: Pick<IHelp, "defaultPrefix">): string =>
                    `\`📦\` Hello! Here is the information about my commands and stuff.\n\`📜\` Select the command category of your choice.\n\n-# You can search a specific command by typing: \`${defaultPrefix} help <command>\``,
                noCommand: "`❌` **No command** was found for this search...",
                selectMenu: {
                    description: ({ category }: IHelpMenu): string => `Select the ${category} category.`,
                    placeholder: "Select a command category.",
                    options: {
                        description: ({ options }: Pick<IHelp, "options">): string =>
                            `-# * **Optional []**\n-# * **Required <>**\n\n${options}`,
                        title: ({ clientName, category }: IHelpMenuEmbed): string => `${clientName} - Help Menu | ${category}`,
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
                engine: ({ engine, clientName }: IEngine): string =>
                    `\`✅\` The default search engine of ${clientName} is now: **${engine}**.`,
                volume: ({ volume, clientName }: IVolume): string => `\`✅\` The default volume of ${clientName} is now: **${volume}%**.`,
            },
            setlocale: {
                invalidLocale: ({ locale, available }: ILocale & { available: string }): string =>
                    `\`❌\` The locale : \`${locale}\` is invalid.\n\`📢\` **Available locales**: \`${available}\``,
                newLocale: ({ locale }: ILocale): string => `\`✅\` The locale of **Stelle** is now: \`${locale}\``,
            },
            ping: {
                response: ({ wsPing, clientPing, shardPing, shardId }: IPing): string =>
                    `\`🌐\` Pong! (**Client**: \`${wsPing}ms\` - **API**: \`${clientPing}ms\` - **Shard (${shardId})**: \`${shardPing}ms\`)`,
                message: "`🪶` Calculating...",
            },
            play: {
                undetermined: "Undetermined",
                live: "🔴 LIVE",
                noResults: "`❌` **No results** was found for this search...\n`🪶` Try searching something different.",
                embed: {
                    playlist: ({ playlist, tracks, volume, query, requester }: IPlayPlaylist): string =>
                        `\`🎵\` The playlist [\`${playlist}\`](${query}) has been added to the queue.\n\n\`🔊\` **Volume**: \`${volume}%\`\n\`👤\` **Requested by**: <@${requester}>\n\`🔰\` **With**: \`${tracks} tracks\``,
                    result: ({ title, url, duration, volume, requester, position }: IPlayTrack): string =>
                        `\`🎵\` Added [\`${title}\`](${url}) to the queue.\n\n\`🕛\` **Duration**: \`${duration}\`\n\`🔊\` **Volume**: \`${volume}%\`\n\`👤\` **Requested by**: <@${requester}>\n\n\`📋\` **Position in queue**: \`#${position}\``,
                },
            },
            loop: {
                toggled: ({ type }: IType): string => `\`✅\` The **loop mode** is now: \`${type}\``,
                loopType: {
                    off: "Off",
                    queue: "Queue",
                    track: "Track",
                } satisfies Record<RepeatMode, string>,
            },
            autoplay: {
                toggled: ({ type }: IType): string => `\`✅\` The **autoplay mode** is now: \`${type}\``,
                autoplayType: {
                    enabled: "On",
                    disabled: "Off",
                },
            },
            nodes: {
                value: ({ state, uptime, players, memory, cpu }: INodes): string =>
                    `\`📘\` State: \`${state}\`\n\`🕛\` Uptime: \`${uptime}\`\n\`🎤\` Players: \`${players}\`\n\`🪭\` Usage: \`${memory}\`\n\`📦\` CPU: \`${cpu}\``,
                description: "`📋` List of all Stelle nodes.",
                noNodes: "`❌` No nodes available at the moment.",
                states: {
                    connected: "🟢 Connected.",
                    disconnected: "🔴 Disconnected.",
                } satisfies Record<string, string>,
            },
            volume: {
                changed: ({ volume }: IVolume): string => `\`✅\` The volume has been set to: **${volume}%**.`,
                paused: "`🔰` The volume is **1%**, so the player has been paused.",
            },
            seek: {
                invalidTime: ({ time }: Pick<ISeek, "time">): string => `\`❌\` The time \`${time}\` is not a valid time.`,
                seeked: ({ time, type }: ISeek): string => `\`✅\` The track has been **${type}** to \`${time}\`.`,
                exeedsTime: ({ time }: Pick<ISeek, "time">): string => `\`❌\` The time \`${time}\` exceeds the current track time.`,
                noSeekable: "`❌` The **current track** is not `seekable`.",
                type: {
                    seeked: "seeked",
                    rewond: "rewond",
                },
            },
            setchannel: {
                noChannel: "`❌` You must provide a valid channel.",
                noTextChannel: "`❌` The channel must be a text channel.",
                noSameGuild: "`❌` The channel must be in this guild.",
                success: "`✅` The requests channel has been set successfully.",
            },
        },
        events: {
            inCooldown: ({ time }: ICooldown): string => `\`❌\` You need to wait: <t:${time}:R> (<t:${time}:t>) to use this.`,
            invalidOptions: ({ options, list }: IOptions): string =>
                `\`❌\` Invalid command options or arguments.\n-# - **Required**: \`<>\`\n-# - **Optional**: \`[]\`\n\n\`📋\` **Usage**:\n ${options}\n\`📢\` **Options Available**:\n${list}`,
            noSameVoice: ({ channelId }: IChannel): string => `\`❌\` You are not in the **same voice channel** as me. (<#${channelId}>)`,
            noCollector: ({ userId }: IUser): string => `\`❌\` Only the user: <@${userId}> can use this.`,
            noMembers: ({ clientName }: IClientName): string =>
                `\`🎧\` ${clientName} is alone in the **voice channel**... Leaving the channel.`,
            playerQueue: ({ tracks }: ITracks): string => `\`📋\` Here is the full server queue: \n\n${tracks}`,
            channelEmpty: ({ type, clientName }: ITypeName): string =>
                `\`🎧\` ${clientName} is alone in the **voice channel**... Pausing and waiting **${type}**.`,
            mention: ({ clientName, defaultPrefix, commandName }: IMention): string =>
                `\`📢\` Hey! My name is: **${clientName}** and my prefix is: \`${defaultPrefix}\` and **/** too!\n\`📋\` If you want to see my commands, type: \`${defaultPrefix} ${commandName}\` or /${commandName}.`,
            hasMembers: ({ clientName }: IClientName): string => `\`🎧\` ${clientName} is not alone anymore... Resuming.`,
            onlyDeveloper: "`❌` Only the **bot developer** can use this.",
            onlyGuildOwner: "`❌` Only the **guild owner** can use this.",
            noCommand: "`❌` I don't have the required command *yet*, try again in a moment.",
            noVoiceChannel: "`❌` You are not in a **voice channel**... Join to play music.",
            noNodes: "`❌` I'm not connected to any of my nodes.",
            noPlayer: "`❌` Nothing is playing right now...",
            noPrevious: "`❌` There is no previous track to add.",
            noTracks: "`❌` There are no more tracks in the queue.",
            noQuery: "`❌` Enter a track name or URL to play it.",
            invalidInput: "`❌` The provided input is not valid (cannot be a URL or any other invalid format).",
            playerEnd: "`🔰` The queue has finished... Waiting for more tracks.",
            moreTracks: "`❌` In order to enable **this** `one or more tracks` are required.",
            commandError: "`❌` Something unexpected ocurred during the execution.\n`📢` If the problem persists, report the issue.",
            autocomplete: {
                loadPlaylist: ({ name, visibility, author }: IAutocompletePlaylist): string =>
                    `Name: ${name} - State: ${visibility} | by ${author}`,
                noPlaylist: "`❌` No playlists found.",
                noAnything: "Stelle - Something unexpected happened using this autocomplete.",
                noNodes: "Stelle - I'm not connected to any of my nodes.",
                noVoiceChannel: "Stelle - You are not in a voice channel... Join to play music.",
                noSameVoice: "Stelle - You are not in the same voice channel as me.",
                noQuery: "Stelle - Enter a track name or URL to play it.",
                noTracks: "Stelle - No tracks was found. Enter another track name or URL.",
                noGuild: "Stelle - This autocomplete only can be used in a guild.",
                noCommand: "Stelle - Invalid command name.",
            },
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
                trackStart: ({ title, author }: IVoiceStatus): string => `${title} by ${author}`,
                queueEnd: "The queue is empty.",
            },
            trackStart: {
                embed: ({ duration, requester, title, url, volume, author, size }: ITrackStart): string =>
                    `\`📻\` Now playing [\`${title}\`](${url})\n\n\`🎤\` **Author**: \`${author}\`\n\`🕛\` **Duration**: \`${duration}\`\n\`🔊\` **Volume**: \`${volume}%\`\n\`👤\` **Requested by**: <@${requester}>\n\n\`📋\` **In queue**: \`${size} tracks\``,
                components: {
                    loop: ({ type }: IType): string => `Loop: ${type}`,
                    autoplay: ({ type }: IType): string => `Autoplay: ${type}`,
                    stop: "Stop",
                    skip: "Skip",
                    previous: "Previous",
                    queue: "Queue",
                    lyrics: "Lyrics",
                    paused: {
                        resume: "Resume",
                        pause: "Pause",
                    } satisfies Record<PausedState, string>,
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
                    BypassSlowmode: "Bypass Slowmode",
                    PinMessages: "Pin Messages",
                } satisfies Record<PermissionNames, string>,
                user: {
                    description: "`📢` Hey! You are missing some permissions to use this.",
                    field: "`📋` Missing Permissions",
                },
                bot: {
                    description: "`📢` Hey! I'm missing some permissions to do this.",
                    field: "`📋` Missing Permissions",
                },
                channel: {
                    description: ({ channelId }: IChannel): string =>
                        `\`📢\` Hey! I'm missing some permissions in the channel. <#${channelId}>`,
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
                    description: "Select the voice channel.",
                },
                text: {
                    name: "text",
                    description: "Select the text channel.",
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
                name: "to",
                description: "Skip a specific amount of tracks.",
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
            description: "Get the current playing track.",
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
        setchannel: {
            name: "setchannel",
            description: "Set the requests channel of Stelle.",
            option: {
                name: "channel",
                description: "Enter the new channel.",
            },
        },
        join: {
            name: "join",
            description: "Join the bot into a voice channel.",
        },
        lyrics: {
            name: "lyrics",
            description: "Show lyrics for the current track.",
        },
        playlist: {
            name: "playlist",
            description: "Manage your music playlists.",
            commands: {
                create: {
                    name: "create",
                    description: "Create a new music playlist.",
                    options: {
                        name: {
                            name: "name",
                            description: "The name of the playlist to create.",
                        },
                        public: {
                            name: "public",
                            description: "Whether the playlist should be public or private.",
                        },
                    },
                },
                load: {
                    name: "load",
                    description: "Load a music playlist.",
                    option: {
                        name: "id",
                        description: "The id of the playlist to load.",
                    },
                },
            },
        },
    },
};

type ILyricsEmbedFooter = { userName: string };
type ILyricsEmbedDescription = { lines: string; provider: string; author: string };
type ILyricsEmbedTitle = { title: string };
type IBotInfoGeneralField = { guilds: number; users: number; players: number };
type IBotInfoSystemField = { memory: string; uptime: number; version: string };
type IBotInfo = { clientName: string; defaultPrefix: string };
type IHelpMenuEmbed = { clientName: string; category: string };
type IVoiceStatus = { title: string; author: string };
type IClientName = { clientName: string };
type IHelp = { defaultPrefix: string; options: string };
type IHelpMenu = { category: string };
type IMention = { clientName: string; defaultPrefix: string; commandName: string };
type INowplaying = { title: string; url: string; duration: string; requester: string; author: string; bar: string; position: string };
type IEngine = { engine: string; clientName: string };
type IPrefix = { prefix: string };
type ISeek = { time: string | number; type: string };
type IAmount = { amount: number };
type IMove = { textId: string; voiceId: string };
type IVolume = { volume: number; clientName: string };
type IType = { type: string };
type ITypeName = { type: string; clientName: string };
type ILocale = { locale: string };
type IPrevious = { title: string; uri: string };
type ITracks = { tracks: string };
type IOptions = { options: string; list: string };
type INodes = { state: string; uptime: string; players: number; memory: string; cpu: string };
type ITrackStart = { title: string; url: string; duration: string; volume: number; requester: string; author: string; size: number };
type IPlayTrack = { title: string; url: string; duration: string; volume: number; requester: string; position: number };
type IPlayPlaylist = { query: string; playlist: string; volume: number; requester: string; tracks: number };
type IChannel = { channelId: string };
type IUser = { userId: string };
type IPing = { wsPing: number; clientPing: number; shardPing: number; shardId: number };
type ICooldown = { time: number };
type IPlaylist = { name: string; state: string };
type IAutocompletePlaylist = { name: string; visibility: string; author: string };
type IPlaylistLoad = { id: string };
