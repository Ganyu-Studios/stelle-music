import {
    Command,
    createIntegerOption,
    Declare,
    type GuildCommandContext,
    LocalesT,
    type MessageStructure,
    Middlewares,
    Options,
    type WebhookMessageStructure,
} from "seyfert";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

const options = {
    volume: createIntegerOption({
        description: "Enter the volume.",
        required: true,
        min_value: 1,
        max_value: 100,
        locales: {
            name: "locales.volume.option.name",
            description: "locales.volume.option.description",
        },
    }),
};

@Declare({
    name: "volume",
    description: "Modify the volume.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    aliases: ["v", "vol"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@Options(options)
@LocalesT("locales.volume.name", "locales.volume.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class VolumeCommand extends Command {
    public override async run(
        ctx: GuildCommandContext<typeof options, "checkPlayer">,
    ): Promise<MessageStructure | WebhookMessageStructure | void> {
        const { client, options } = ctx;
        const { volume } = options;

        const { messages } = await ctx.locale();

        const { player } = ctx.metadata.checkPlayer;

        if (volume === 1) {
            await player.setPaused(true);
            await player.setVolume(volume);

            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.commands.volume.paused,
                        color: client.config.color.extra,
                    },
                ],
            });
        }

        // `volume` is always > 1 here (the min is 1 and the === 1 case returned above), so unpausing hinges only on the
        // current state — then set + reply once, instead of duplicating the change reply across both branches.
        if (player.paused) await player.setPaused(false);

        await player.setVolume(volume);
        await ctx.successReply(
            messages.commands.volume.changed({
                volume,
                clientName: client.me.username,
            }),
        );
    }
}
