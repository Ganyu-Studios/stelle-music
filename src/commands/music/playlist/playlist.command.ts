import { AutoLoad, Command, Declare, LocalesT, ApplicationIntegrationType, InteractionContextType } from "seyfert";
import { StelleCategory } from "#stelle/types/index.js";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "playlist",
    description: "Manage your music playlists.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
})
@StelleOptions({ category: StelleCategory.Music, cooldown: 3 })
@AutoLoad()
@LocalesT("locales.playlist.name", "locales.playlist.description")
export default class PlaylistCommand extends Command {}
