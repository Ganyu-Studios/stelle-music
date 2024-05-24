import { ComponentCommand, type ComponentContext } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

@StelleOptions({ inVoice: true, sameVoice: true, checkPlayer: true, checkQueue: true })
export default class SkipTrackComponent extends ComponentCommand {
    componentType = "Button" as const;

    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-skipTrack";
    }

    async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        if (!ctx.guildId) return;

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        player.skip();
        await ctx.interaction.deferUpdate();
    }
}
