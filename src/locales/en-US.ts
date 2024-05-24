import type { LoopMode } from "#stelle/types";

export default {
    messages: {
        commands: {
            ping: {
                message: "`🪶` Calculating...",
                response: ({ wsPing, clientPing }: IPing) => `\`🌐\` Pong! (**Client**: \`${wsPing}ms\` - **API**: \`${clientPing}ms\`)`,
            },
            play: {
                undetermined: "Undetermined",
                live: "🔴 LIVE",
                noResults: "`❌` **No results** was found for this search...\n`🪶` Try searching something different.",
                autocomplete: {
                    noNodes: "Stelle - I'm not connected to any of my nodes.",
                    noVoiceChannel: "Stelle - You are not in a voice channel... Join to play music.",
                    noSameVoice: "Stelle - You are not in the same voice channel as me.",
                    noQuery: "Stelle - Enter a song name or URL to play it.",
                    noTracks: "Stelle - No tracks was found. Enter another song name or URL.",
                },
                embed: {
                    playlist: ({ playlist, tracks, volume, query, requester }: IPlayList) =>
                        `\`🎵\` The laylist [\`${playlist}\`](${query}) has been added to the queue.\n\n\`🔊\` **Volume**: \`${volume}%\`\n\`👤\` **Requested by**: <@${requester}>\n\`🔰\` **With**: \`${tracks} tracks\``,
                    result: ({ title, url, duration, volume, requester }: IPlayTrack) =>
                        `\`🎵\` Added [\`${title}\`](${url}) to the queue.\n\n\`🕛\` **Duration**: \`${duration}\`\n\`🔊\` **Volume**: \`${volume}%\`\n\`👤\` **Requested by**: <@${requester}>`,
                    results: ({ title, url, duration, volume, requester, position }: IPlayTrack) =>
                        `\`🎵\` Added [\`${title}\`](${url}) to the queue.\n\n\`🕛\` **Duration**: \`${duration}\`\n\`🔊\` **Volume**: \`${volume}%\`\n\`👤\` **Requested by**: <@${requester}>\n\n\`📋\` **Position in queue**: \`#${position}\``,
                },
            },
            loop: {
                loopType: {
                    none: "Off",
                    queue: "Queue",
                    track: "Track",
                } satisfies Record<LoopMode, string>,
            },
        },
        events: {
            inCooldown: ({ time }: ICooldown) => `\`❌\` You need to wait: <t:${time}:R> (<t:${time}:t>) to use this.`,
            noSameVoice: ({ channelId }: IChannel) => `\`❌\` You are not in the **same voice channel** as me. (<#${channelId}>)`,
            onlyDeveloper: "`❌` Only the **bot developer** can use this.",
            onlyGuildOwner: "`❌` Only the **guild owner** can use this.",
            noVoiceChannel: "`❌` You are not in a **voice channel**... Join to play music.",
            noNodes: "`❌` I'm not connected to any of my nodes.",
            noPlayer: "`❌` Nothing is playing right now...",
            noTracks: "`❌` There are no more tracks in the queue.",
            trackStart: {
                embed: ({ duration, requester, title, url, volume, author, size }: ITrackStart) =>
                    `\`📻\` Now playing [\`${title}\`](${url})\n\n\`🎤\` **Author**: \`${author}\`\n\`🕛\` **Duration**: \`${duration}\`\n\`🔊\` **Volume**: \`${volume}%\`\n\`👤\` **Requested by**: <@${requester}>\n\n\`📋\` **In queue**: \`${size} tracks\``,
                components: {
                    stop: "Stop",
                    skip: "Skip",
                    previous: "Previous",
                    queue: "Queue",
                    loop: ({ loop }: { loop: string }) => `Loop: ${loop}`,
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
                description: "Enter the song name or url.",
            },
        },
        ping: {
            name: "ping",
            description: "Get the Stelle ping.",
        },
    },
};

type ITrackStart = { title: string; url: string; duration: string; volume: number; requester: string; author: string; size: number };
type IPlayTrack = { title: string; url: string; duration: string; volume: number; requester: string; position: number };
type IPlayList = { query: string; playlist: string; volume: number; requester: string; tracks: number };
type IChannel = { channelId: string };
type IPing = { wsPing: number; clientPing: number };
type ICooldown = { time: number };
