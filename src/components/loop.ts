import { ActionRow, Button, ComponentCommand, type ComponentContext } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

import { type APIButtonComponentWithCustomId, ButtonStyle, ComponentType } from "discord-api-types/v10";
import { LOOP_STATE } from "#stelle/data/Constants.js";

@StelleOptions({ inVoice: true, sameVoice: true, checkPlayer: true, cooldown: 5, checkNodes: true })
export default class ToggleLoopComponent extends ComponentCommand {
    componentType = "Button" as const;

    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-toggleLoop";
    }

    async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        if (!ctx.guildId) return;

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const { messages } = await ctx.getLocale();

        player.setLoop(LOOP_STATE(player.loop));

        //sussy code, but works
        const components = ctx.interaction.message.components[0].toJSON();
        const newComponents = ctx.interaction.message.components[1].toJSON();

        const row = new ActionRow<Button>().setComponents(
            components.components.map((button) => new Button(button as APIButtonComponentWithCustomId)),
        );
        const newRow = new ActionRow<Button>().setComponents(
            newComponents.components
                .filter((row) => row.type === ComponentType.Button && row.style !== ButtonStyle.Link)
                .map((button) => {
                    if ((button as APIButtonComponentWithCustomId).custom_id === "player-toggleLoop")
                        (button as APIButtonComponentWithCustomId).label = messages.events.playerStart.components.loop({
                            type: messages.commands.loop.loopType[player.loop],
                        });

                    return new Button(button as APIButtonComponentWithCustomId);
                }),
        );

        await ctx.interaction.message.edit({ components: [row, newRow] });
        await ctx.interaction.deferUpdate();
    }
}
