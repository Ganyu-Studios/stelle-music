import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "quiz",
    description: "Play a music guessing quiz.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
})
@AutoLoad()
@StelleOptions({ cooldown: 10, category: StelleCategory.Music })
@LocalesT("locales.quiz.name", "locales.quiz.description")
export default class QuizCommand extends Command {}
