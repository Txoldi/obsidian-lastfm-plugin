import { App, Notice } from "obsidian";
import { LastFmApi } from "../lastfm/api";
import type { LastFmTrack, LastFmAlbum } from "../lastfm/types";
import LastFmPlugin from "main";
import { ensureFolder, extractImage, getArtistName, tsToDate } from "utils/helpers";

function buildMarkdownBlock(
    type: "tracks" | "artists" | "albums",
    item: any,
    index: number,
    context: "default" | "recent" = "default"
): string {
    const num = index + 1;

    /* ---------------------------
     * Decide whether to include image.
     * Images are only returned for Recent Scrobbles and top albums
     * --------------------------- */
    const shouldIncludeImg =
        (context === "recent" && type === "tracks") || // recent scrobbles
        (context === "default" && type === "albums");  // top albums only

    const img = shouldIncludeImg ? extractImage(item) : null;

    /* ---------------------------
     * Tracks
     * --------------------------- */
    if (type === "tracks") {
        const artist = getArtistName(item.artist);

        const nowPlaying =
            context === "recent" && item["@attr"]?.nowplaying
                ? " (Now playing)"
                : "";

        const album =
            context === "recent"
                ? item.album?.["#text"] ?? item.album?.name ?? ""
                : "";

        const playcountLine = item.playcount
            ? `\n**Playcount:** ${item.playcount}`
            : "";

        const albumLine =
            context === "recent" && album
                ? `\nAlbum: ${album}`
                : "";

        return `## ${num}. ${item.name} — ${artist}${nowPlaying}${playcountLine}
${img ? `![](${img})` : ""}${albumLine}
`;
    }

    /* ---------------------------
     * Artists (never include images)
     * --------------------------- */
    if (type === "artists") {
        return `## ${num}. ${item.name}
**Playcount:** ${item.playcount}
`;
    }

    /* ---------------------------
     * Albums (include images ONLY for top albums)
     * --------------------------- */
    if (type === "albums") {
        const artist = getArtistName(item.artist);

        return `## ${num}. ${item.name} — ${artist}
**Playcount:** ${item.playcount}
${img ? `![](${img})` : ""}
`;
    }

    return "";
}


export async function createRecentTracksNote(
    app: App,
    api: LastFmApi,
    plugin: LastFmPlugin,
    limit: number
) {
    const tracks = await api.fetchRecentScrobbles(limit);

    const folder = await ensureFolder(plugin);
    const date = new Date().toISOString().split("T")[0];

    const blocks = tracks
        .map((t, idx) => buildMarkdownBlock("tracks", t, idx, "recent"))
        .join("\n");

    const content = `# Recent Scrobbles — ${date}

${blocks}
`;

    const filePath = `${folder}/LastFM Recent Scrobbles ${date}.md`;
    await app.vault.create(filePath, content);

    new Notice("Last.fm note created!");
}

/* ----------------------------------------------------
 * Unified: Create NOTE for TOP period-based calls
 * ---------------------------------------------------- */
export async function createTopNote(
    plugin: LastFmPlugin,
    api: LastFmApi,
    type: "tracks" | "artists" | "albums",
    period: string,
    limit: number
) {
    const { app } = plugin;
    const folder = await ensureFolder(plugin);
    const date = new Date().toISOString().split("T")[0];

    let results: any[] = [];

    if (type === "tracks") results = await api.fetchTopTracks(period, limit);
    if (type === "artists") results = await api.fetchTopArtists(period, limit);
    if (type === "albums") results = await api.fetchTopAlbums(period, limit);

    const blocks = results
        .map((item, idx) => buildMarkdownBlock(type, item, idx))
        .join("\n");

    const content = `# Top ${type} — ${period} (${date})

${blocks}
`;

    const filePath = `${folder}/LastFM Top ${type} ${period} ${date}.md`;
    await app.vault.create(filePath, content);

    new Notice(`Note created: Top ${type} (${period})`);
}


/* ----------------------------------------------------
 * Unified: Create NOTE for WEEKLY from/to calls
 * ---------------------------------------------------- */
export async function createWeeklyNote(
    plugin: LastFmPlugin,
    api: LastFmApi,
    type: "tracks" | "artists" | "albums",
    from: string,
    to: string
) {
    const { app } = plugin;
    const folder = await ensureFolder(plugin);

    let results: any[] = [];

    if (type === "tracks") results = await api.fetchWeeklyTrackChart(from, to);
    if (type === "artists") results = await api.fetchWeeklyArtistChart(from, to);
    if (type === "albums") results = await api.fetchWeeklyAlbumChart(from, to);

    const blocks = results
        .map((item, idx) => buildMarkdownBlock(type, item, idx))
        .join("\n");

    const content = `# Weekly ${type} — ${tsToDate(from)} → ${tsToDate(to)}

${blocks}
`;

    const filePath = `${folder}/LastFM Weekly ${type} ${tsToDate(from)} to ${tsToDate(to)}.md`;
    await app.vault.create(filePath, content);

    new Notice(`Weekly ${type} note created!`);
}

