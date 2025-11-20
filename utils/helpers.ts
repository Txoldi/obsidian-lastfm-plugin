import LastFmPlugin from "main";

/* ----------------------------------------------------
 * Helper: ensure folder exists
 * ---------------------------------------------------- */
export async function ensureFolder(plugin: LastFmPlugin): Promise<string> {
    const { app } = plugin;
    const folder = plugin.settings.folder;

    if (!app.vault.getAbstractFileByPath(folder)) {
        await app.vault.createFolder(folder);
    }

    return folder;
}

export function extractImage(item: any): string | null {
    if (!item.image) return null;

    return (
        item.image.find((i: any) => i.size === "large")?.["#text"] ||
        item.image.find((i: any) => i.size === "medium")?.["#text"] ||
        item.image.find((i: any) => i.size === "small")?.["#text"] ||
        item.image[0]?.["#text"] ||
        null
    );
}

export function tsToDate(ts: string): string {
    return new Date(parseInt(ts) * 1000)
        .toISOString()
        .split("T")[0];
}

export function getArtistName(artist: any): string {
    if (!artist) return "?";
    return artist.name ?? artist["#text"] ?? "?";
}

