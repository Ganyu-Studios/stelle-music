import { getCollectionKey } from "#stelle/utils/functions/utils.js";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";
import { createMiddleware } from "seyfert";

export const checkCooldown = createMiddleware<void>(async ({ context, next, pass }) => {
    // This will make someone happy.
    if (context.isComponent()) {
        next(); return;
    }

    const { client, command } = context;
    const { cooldowns } = client;

    if (command.onlyDeveloper) {
        next(); return;
    }

    const cooldown = (command.cooldown ?? 3) * 1_000;
    const timeNow = Date.now();

    const { messages } = await context.getLocale();

    const data = cooldowns.get(getCollectionKey(context));
    if (data && timeNow < data) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.inCooldown({ time: Math.floor(data / 1_000) }),
                    color: EmbedColors.Red
                }
            ]
        });

        pass(); return;
    }

    cooldowns.set(getCollectionKey(context), timeNow + cooldown, cooldown);

    next();
});
