import LastFmPlugin from "main";
import { ImageContainer } from "../lastfm/types";
import { ArtistItem } from "lastfm/itemTypes";

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


/* ----------------------------------------------------
 * hasImages — ensures an item has an image
 * ---------------------------------------------------- */
export function hasImages(item: unknown): item is ImageContainer {
	return typeof item === "object" && item !== null && "image" in item;
}


/* ----------------------------------------------------
 * extractImage — extract the lasrgest image available
 * ---------------------------------------------------- */
export function extractImage(item: ImageContainer | null | undefined): string | null {
	const imgs = item?.image;
	if (!imgs || imgs.length === 0) return null;

	// Pick largest available
	return (
		imgs.find(i => i.size === "extralarge")?.["#text"] ??
		imgs.find(i => i.size === "large")?.["#text"] ??
		imgs.find(i => i.size === "medium")?.["#text"] ??
		imgs.find(i => i.size === "small")?.["#text"] ??
		imgs[0]?.["#text"] ??
		null
	);
}

/* ----------------------------------------------------
 * tsToDate — safe
 * ---------------------------------------------------- */
export function tsToDate(ts: string): string {
    return new Date(Number(ts) * 1000)
        .toISOString()
        .split("T")[0];
}

/* ----------------------------------------------------
 * getArtistName — supports all Last.fm variants
 * ---------------------------------------------------- */
export function getArtistName(artist: ArtistItem | string | undefined): string {
    if (!artist) return "?";

    if (typeof artist === "string") return artist;

    if ("#text" in artist && typeof artist["#text"] === "string") {
        return artist["#text"] || "?";
    }

    if ("name" in artist && typeof artist.name === "string") {
        return artist.name || "?";
    }

    return "?";
}
