import { App, Notice } from "obsidian";
import { LastFmApi } from "../lastfm/api";
import type { LastFmTrack, LastFmAlbum } from "../lastfm/types";
import LastFmPlugin from "main";
import { ensureFolder, extractImage, tsToDate } from "utils/helpers";

function buildMarkdownBlock(
    type: "tracks" | "artists" | "albums",
    item: any,
    index: number
): string {
    const img = extractImage(item);
    const num = index + 1;

    if (type === "tracks") {
        const artist =
            item.artist?.name ??
            item.artist?.["#text"] ??
            "Unknown Artist";

        return `## ${num}. ${item.name} — ${artist}
**Playcount:** ${item.playcount}
${img ? `![](${img})` : ""}
`;
    }

    if (type === "artists") {
        return `## ${num}. ${item.name}
**Playcount:** ${item.playcount}
`;
    }

    if (type === "albums") {
        const artist = item.artist?.name ?? "Unknown Artist";

        return `## ${num}. ${item.name} — ${artist}
**Playcount:** ${item.playcount}
${img ? `![](${img})` : ""}
`;
    }

    return "";
}

export async function createRecentTracksNote(app: App, api: LastFmApi, plugin: LastFmPlugin) {
    const tracks = await api.fetchRecentScrobbles();

    const content = tracks
        .map(t => {
            const artist = t.artist.name;
            const title = t.name;
            const album = t.album?.name ?? "";
            const nowPlaying = t["@attr"]?.nowplaying ? " (Now playing)" : "";

            const imgUrl =
                t.image?.find(i => i.size === "large")?.["#text"] ||
                t.image?.find(i => i.size === "medium")?.["#text"] ||
                t.image?.find(i => i.size === "small")?.["#text"] ||
                t.image?.[0]?.["#text"] ||
                "";

            // Markdown block with image + track info
            return `### ${title} — ${artist}${nowPlaying}
            ${imgUrl ? `![](${imgUrl})` : ""}
            Album: ${album}`;
        })
        .join("\n");

	let folderPath = plugin.settings.folder
	
	// Create folder if it doesn't exist
	if (!app.vault.getAbstractFileByPath(folderPath)) {
    	await app.vault.createFolder(folderPath);
	}

	const fileName = `LastFM Recent Scrobbles from ${new Date().toISOString().split("T")[0]}.md`;
	const filePath = `${folderPath}/${fileName}`;

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
    period: string
) {
    const { app } = plugin;
    const folder = await ensureFolder(plugin);
    const date = new Date().toISOString().split("T")[0];

    let results: any[] = [];

    if (type === "tracks") results = await api.fetchTopTracks(period);
    if (type === "artists") results = await api.fetchTopArtists(period);
    if (type === "albums") results = await api.fetchTopAlbums(period);

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

