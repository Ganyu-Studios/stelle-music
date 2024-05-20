import { MessageFlags } from "discord-api-types/v10";
import { createMiddleware } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";

export const checkCooldown = createMiddleware<void>(async ({ context, next, pass }) => {
    const { client, author } = context;
    const { cooldowns } = client;

    if (!context.isChat()) return next();

    const command = context.resolver.getCommand();
    if (!command) return pass();

    const cooldown = (command.cooldown ?? 3) * 1000;
    const timeNow = Date.now();
    const setKey = `${author.id}-${command.name}`;

    const { messages } = context.t.get(await context.getLocale());

    const data = cooldowns.get(setKey);
    if (data && timeNow < data)
        return context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.inCooldown({ time: Math.floor(data / 1000) }),
                    color: EmbedColors.Red,
                },
            ],
        });

    cooldowns.set(setKey, timeNow + cooldown, cooldown);

    return next();
});
