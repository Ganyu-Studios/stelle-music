import { EventNames, type NodeCpu, OpCodes, type Stats } from "hoshimi";
import { LogLevels } from "seyfert";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

/**
 *
 * Get and patch the stats object to ensure that the lavalinkLoad property is always a number.
 * @param {Stats} stats The stats object to patch.
 * @returns {void} The patched stats object.
 */
function updateStats(stats: Stats): void {
    const cpu: NodeCpu = stats.cpu;

    if ("nodelinkLoad" in cpu) {
        const load: unknown = cpu.nodelinkLoad;

        if (typeof load !== "number" || Number.isNaN(load) || load < 0) cpu.lavalinkLoad = 0;
        else cpu.lavalinkLoad = Number(load);
    } else if (typeof cpu.lavalinkLoad !== "number") {
        cpu.lavalinkLoad = 0;
    }
}

export default createLavalinkEvent({
    name: EventNames.NodeRaw,
    async run(client, node, payload) {
        if (node.isNodelink() && payload.op === OpCodes.Stats) {
            client.debug(LogLevels.Debug, `[Lavalink] Node Raw | node: ${node.id} | Using nodelink, patching stats...`);

            updateStats(payload);
        }
    },
});
