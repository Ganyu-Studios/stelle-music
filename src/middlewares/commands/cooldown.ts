import { createMiddleware } from "seyfert";
import { getCollectionKey } from "#stelle/utils/functions/utils.js";

import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";

export const checkCooldown = createMiddleware<void>(async ({ context, next, pass }) => {
    // This will make someone happy.
    if (context.isComponent() || !context.inGuild()) return next();

    const { client, command } = context;
    const { cooldowns } = client;

    if (!command) return pass();

    if (command.onlyDeveloper) return next();

    const cooldown = (command.cooldown ?? 3) * 1000;
    const timeNow = Date.now();

    const { messages } = await context.getLocale();

    const data = cooldowns.get(getCollectionKey(context));
    if (data && timeNow < data) {
        context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.inCooldown({ time: Math.floor(data / 1000) }),
                    color: EmbedColors.Red,
                },
            ],
        });

        return pass();
    }

    cooldowns.set(getCollectionKey(context), timeNow + cooldown, cooldown);

    return next();
});
