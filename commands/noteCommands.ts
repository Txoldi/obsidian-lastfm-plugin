import { App, Notice } from "obsidian";
import { LastFmApi } from "../lastfm/api";
import LastFmPlugin from "main";
import { TrackItem, ArtistItem, AlbumItem, ItemFor } from "../lastfm/itemTypes";
import { ensureFolder, extractImage, getArtistName, hasImages, tsToDate } from "utils/helpers";

/* ============================================================
 * buildMarkdownBlock (fully typed)
 * ============================================================ */
function buildMarkdownBlock<T extends "tracks" | "artists" | "albums">(
	type: T,
	item: ItemFor<T>,
	index: number,
	context: "default" | "recent" = "default"
): string {
	const num = index + 1;

	// Image inclusion logic
	const shouldIncludeImg =
		(context === "recent" && type === "tracks") ||
		(context === "default" && type === "albums");

	let img: string | null = null;

	if (shouldIncludeImg && hasImages(item)) {
		img = extractImage(item);
	}

	/* ---------------------------
	 * TRACKS
	 * --------------------------- */
	if (type === "tracks") {
		const track = item as TrackItem;

		const artist = getArtistName(track.artist);

		const nowPlaying =
			context === "recent" && track["@attr"]?.nowplaying ? " (Now playing)" : "";

		const album =
			context === "recent"
				? track.album.name ?? ""
				: "";

		const playcountLine = track.playcount
			? `\n**Playcount:** ${track.playcount}`
			: "";

		const albumLine =
			context === "recent" && album ? `\nAlbum: ${album}` : "";

		return `## ${num}. ${track.name} — ${artist}${nowPlaying}${playcountLine}
${img ? `![](${img})` : ""}${albumLine}
`;
	}

	/* ---------------------------
	 * ARTISTS
	 * --------------------------- */
	if (type === "artists") {
		const artist = item as ArtistItem;

		const playcount =
			"playcount" in artist && artist.playcount ? artist.playcount : "0";

		return `## ${num}. ${getArtistName(artist)}
**Playcount:** ${playcount}
`;
	}

	/* ---------------------------
	 * ALBUMS
	 * --------------------------- */
	if (type === "albums") {
		const album = item as AlbumItem;

		const playcount = album.playcount ?? "0";

		return `## ${num}. ${album.name} — ${getArtistName(album.artist)}
**Playcount:** ${playcount}
${img ? `![](${img})` : ""}
`;
	}

	return "";
}

/* ============================================================
 * Create recent scrobbles note
 * ============================================================ */
export async function createRecentTracksNote(
	app: App,
	api: LastFmApi,
	plugin: LastFmPlugin,
	limit: number
): Promise<void> {
	const tracks = await api.fetchRecentScrobbles(limit);
	const folder = await ensureFolder(plugin);
	const date = new Date().toISOString().split("T")[0];

	const blocks = tracks
		.map((track, i) => buildMarkdownBlock("tracks", track, i, "recent"))
		.join("\n");

	const content = `# Recent Scrobbles — ${date}

${blocks}
`;

	const filePath = `${folder}/LastFM Recent Scrobbles ${date}.md`;
	await app.vault.create(filePath, content);

	new Notice("Last.fm note created!");
}

/* ============================================================
 * Create TOP note (period mode)
 * ============================================================ */
export async function createTopNote(
	plugin: LastFmPlugin,
	api: LastFmApi,
	type: "tracks" | "artists" | "albums",
	period: string,
	limit: number
): Promise<void> {
	const app = plugin.app;
	const folder = await ensureFolder(plugin);
	const date = new Date().toISOString().split("T")[0];

	let results: ItemFor<typeof type>[];

	if (type === "tracks") results = await api.fetchTopTracks(period, limit);
	else if (type === "artists") results = await api.fetchTopArtists(period, limit);
	else results = await api.fetchTopAlbums(period, limit);

	const blocks = results
		.map((item, i) => buildMarkdownBlock(type, item, i))
		.join("\n");

	const content = `# Top ${type} — ${period} (${date})

${blocks}
`;

	const filePath = `${folder}/LastFM Top ${type} ${period} ${date}.md`;
	await app.vault.create(filePath, content);

	new Notice(`Note created: Top ${type} (${period})`);
}

/* ============================================================
 * Create WEEKLY note (range mode)
 * ============================================================ */
export async function createWeeklyNote(
	plugin: LastFmPlugin,
	api: LastFmApi,
	type: "tracks" | "artists" | "albums",
	from: string,
	to: string
): Promise<void> {
	const app = plugin.app;
	const folder = await ensureFolder(plugin);

	let results: ItemFor<typeof type>[];

	if (type === "tracks") results = await api.fetchWeeklyTrackChart(from, to);
	else if (type === "artists") results = await api.fetchWeeklyArtistChart(from, to);
	else results = await api.fetchWeeklyAlbumChart(from, to);

	const blocks = results
		.map((item, i) => buildMarkdownBlock(type, item, i))
		.join("\n");

	const content = `# Weekly ${type} — ${tsToDate(from)} → ${tsToDate(to)}

${blocks}
`;

	const filePath = `${folder}/LastFM Weekly ${type} ${tsToDate(from)} to ${tsToDate(to)}.md`;
	await app.vault.create(filePath, content);

	new Notice(`Weekly ${type} note created!`);
}
