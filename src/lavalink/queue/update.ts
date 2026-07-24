import { EventNames, type TrackStructure } from "hoshimi";
import { StelleMeta } from "#stelle/utils/data/constants.js";
import { updatePanel } from "#stelle/utils/functions/manager/panel.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.QueueUpdate,
    async run(client, player): Promise<void> {
        if (StelleMeta.Debug)
            client.debugger?.info(
                `[Lavalink] Queue update | guild: ${player.guildId} | queue length: ${player.queue.tracks.length} | current track: ${player.queue.current?.info.title ?? "none"}`,
            );

        if (!(player.textId && player.voiceId)) return;
        if (!(await player.data.get("isRequestChannel"))) return;

        const current: TrackStructure | undefined = player.queue.current ?? undefined;
        await updatePanel(client, player.guildId, player, current);
    },
});
