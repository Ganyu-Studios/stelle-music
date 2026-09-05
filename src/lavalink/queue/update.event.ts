import { EventNames, type TrackStructure } from "hoshimi";
import { LogLevels } from "seyfert";
import { PanelOps } from "#stelle/utils/functions/manager/panel.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.QueueUpdate,
    async run(client, player): Promise<void> {
        client.debug(
            LogLevels.Debug,
            `[Lavalink] Queue update | guild: ${player.guildId} | queue length: ${player.queue.tracks.length} | current track: ${player.queue.current?.info.title ?? "none"}`,
        );

        if (!(player.textId && player.voiceId)) return;
        if (!(await player.data.get("isRequestChannel"))) return;

        const current: TrackStructure | undefined = player.queue.current ?? undefined;
        await PanelOps.update(client, player.guildId, player, current);
    },
});
