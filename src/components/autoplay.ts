import { ActionRow, Button, ComponentCommand, type ComponentContext } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

import { type APIButtonComponentWithCustomId, ButtonStyle, ComponentType } from "discord-api-types/v10";

import { AUTOPLAY_STATE } from "#stelle/data/Constants.js";

@StelleOptions({ inVoice: true, sameVoice: true, checkPlayer: true, moreTracks: true, cooldown: 5 })
export default class AutoplayComponent extends ComponentCommand {
    componentType = "Button" as const;

    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-toggleAutoplay";
    }

    async run(ctx: ComponentContext<typeof this.componentType>) {
        const { client, guildId } = ctx;

        if (!guildId) return;

        const { messages } = ctx.t.get(await ctx.getLocale());

        const player = client.manager.getPlayer(guildId);
        if (!player) return;

        player.data.set("autoplay", !player.data.get("autoplay") ?? true);

        const isAutoplay = player.data.get("autoplay") as boolean;

        const components = ctx.interaction.message.components[0].toJSON();
        const newComponents = ctx.interaction.message.components[1].toJSON();

        const row = new ActionRow<Button>().setComponents(
            components.components.map((button) => new Button(button as APIButtonComponentWithCustomId)),
        );
        const newRow = new ActionRow<Button>().setComponents(
            newComponents.components
                .filter((row) => row.type === ComponentType.Button && row.style !== ButtonStyle.Link)
                .map((button) => {
                    if ((button as APIButtonComponentWithCustomId).custom_id === "player-toggleAutoplay")
                        (button as APIButtonComponentWithCustomId).label = messages.events.playerStart.components.autoplay({
                            type: messages.commands.autoplay.autoplayType[AUTOPLAY_STATE(isAutoplay)],
                        });

                    return new Button(button as APIButtonComponentWithCustomId);
                }),
        );

        await ctx.interaction.message.edit({ components: [row, newRow] });
        await ctx.interaction.deferUpdate();
    }
}
