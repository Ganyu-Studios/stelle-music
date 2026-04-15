import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "playlist",
    description: "Manage your music playlists.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
})
@StelleOptions({ category: StelleCategory.Music, cooldown: 3, skipRegister: false })
@AutoLoad()
@LocalesT("locales.playlist.name", "locales.playlist.description")
export default class PlaylistCommand extends Command {}
