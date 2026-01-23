import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "playlist",
    description: "Manage your music playlists.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@StelleOptions({ category: StelleCategory.Music, cooldown: 3, skipRegister: true })
@AutoLoad()
@LocalesT("locales.playlist.name", "locales.playlist.description")
export default class PlaylistCommand extends Command {}
