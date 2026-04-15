/**
 * The identifiers for the buttons in the playlist management menu.
 * @readonly
 * @enum {string}
 */
export const ManageButtonIdentifiers = {
    TrackSave: "playlist-tracksSave",
    TrackDelete: "playlist-tracksDelete",
    Info: "playlist-info",
    ToggleVisibility: "playlist-toggleVisibility",
} as const;

/**
 * The identifiers for the buttons in the playlist management menu.
 * @readonly
 * @enum {string}
 */
export const SaveButtonIdentifiers = {
    CurrentTrack: "playlist-saveCurrentTrack",
    CurrentQueue: "playlist-saveCurrentQueue",
    FromURL: "playlist-saveFromURL",
} as const;

/**
 * The custom ids of the paginator buttons.
 * @readonly
 * @enum {string}
 */
export const PaginatorButtonIdentifiers = {
    Previous: "paginator-pagePrev",
    Position: "paginator-pagePos",
    Next: "paginator-pageNext",
    Delete: "paginator-delete",
} as const;

/**
 * The custom ids of the paginator buttons.
 * @type {PaginatorButtonIdentifiers[]}
 */
export const PaginatorButtonCustomIds: PaginatorButtonIdentifiers[] = Object.values(PaginatorButtonIdentifiers);

/**
 * The array of button identifiers for the playlist management menu.
 * @readonly
 * @type {SaveButtonIdentifiers[]}
 */
export const SaveButtonCustomIds: SaveButtonIdentifiers[] = Object.values(SaveButtonIdentifiers);

/**
 * The array of button identifiers for the playlist management menu.
 * @readonly
 * @type {ManageButtonIdentifiers[]}
 */
export const ManageButtonCustomIds: ManageButtonIdentifiers[] = Object.values(ManageButtonIdentifiers);

/**
 * The type for the button identifiers in the playlist management menu.
 */
export type ManageButtonIdentifiers = (typeof ManageButtonIdentifiers)[keyof typeof ManageButtonIdentifiers];

/**
 * The type for the button identifiers in the playlist management menu.
 */
export type SaveButtonIdentifiers = (typeof SaveButtonIdentifiers)[keyof typeof SaveButtonIdentifiers];

/**
 * The type of the custom ids of the paginator buttons.
 */
export type PaginatorButtonIdentifiers = (typeof PaginatorButtonIdentifiers)[keyof typeof PaginatorButtonIdentifiers];
