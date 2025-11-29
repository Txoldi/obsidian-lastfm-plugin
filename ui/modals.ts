import { App, Modal, Setting, Notice } from "obsidian";
import LastFmPlugin from "main";
import { LastFmApi } from "../lastfm/api";
import { createRecentTracksNote, createTopNote, createWeeklyNote } from "../commands/noteCommands";
import { tsToDate, getArtistName } from "utils/helpers";
import { TrackItem, ArtistItem, AlbumItem } from "../lastfm/itemTypes";

// Tabs
type SectionName = "recent" | "topTracks" | "topArtists" | "topAlbums";

// Period options per Last.fm docs
const PERIODS = [
	"7day",
	"1month",
	"3month",
	"6month",
	"12month",
	"overall"
];

export class LastFmModal extends Modal {
	private api: LastFmApi;
	private plugin: LastFmPlugin;

	private activeSection: SectionName = "recent";
	private limit = 10; // shared default value

	// For Top sections
	private topMode: "period" | "range" = "period";
	private topPeriod = "7day";

	// For Range Mode
	private weeklyPeriods: { from: string; to: string }[] = [];
	private selectedWeeklyIndex = 0;

	constructor(app: App, api: LastFmApi, plugin: LastFmPlugin) {
		super(app);
		this.api = api;
		this.plugin = plugin;
	}

	onOpen(): void {
		this.modalEl.addClass("lastfm-modal");
		void this.redraw();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	/* ---------------------------------------------------
	 * Helpers
	 * --------------------------------------------------- */

	private async loadWeeklyPeriods(): Promise<void> {
		if (this.weeklyPeriods.length === 0) {
			this.weeklyPeriods = await this.api.fetchWeeklyChartList();
			this.selectedWeeklyIndex = this.weeklyPeriods.length - 1; // newest week
		}
	}

	private getTopTypeForSection(section: SectionName): "tracks" | "artists" | "albums" | null {
		if (section === "topTracks") return "tracks";
		if (section === "topArtists") return "artists";
		if (section === "topAlbums") return "albums";
		return null;
	}

	/**
	 * Redraw the entire modal content.
	 */
	private async redraw(): Promise<void> {
		const { contentEl } = this;
		contentEl.empty();

		// Tabs
		const tabs = contentEl.createDiv("lastfm-tabs");
		this.createTabButton(tabs, "recent", "Recent scrobbles");
		this.createTabButton(tabs, "topTracks", "Top tracks");
		this.createTabButton(tabs, "topArtists", "Top artists");
		this.createTabButton(tabs, "topAlbums", "Top albums");

		contentEl.createEl("hr");

		if (this.activeSection === "recent") {
			this.renderRecentSection(contentEl);
			return;
		}

		const topType = this.getTopTypeForSection(this.activeSection);
		if (topType) {
			await this.renderTopSection(contentEl, topType);
		}
	}

	/* ---------------------------------------------------
	 * Tabs
	 * --------------------------------------------------- */
	private createTabButton(container: HTMLElement, name: SectionName, label: string): void {
		const btn = container.createEl("button");

		if (this.activeSection === name) {
			btn.addClass("active");
		}

		btn.createSpan({
			cls: "lastfm-tab-icon " + name
		});

		btn.createSpan({ text: label });

		btn.onClickEvent(() => {
			this.activeSection = name;
			void this.redraw();
		});
	}

	/* ---------------------------------------------------
	 * Recent section
	 * --------------------------------------------------- */
	private renderRecentSection(container: HTMLElement): void {
		container.createEl("h3", { text: "Recent scrobbles" });

		new Setting(container)
			.setName("Limit")
			.setDesc("Number of recent scrobbles to fetch")
			.addDropdown(drop => {
				["5", "10", "20", "50", "100"].forEach(n => {
					drop.addOption(n, n)
			});
				drop.setValue(String(this.limit));
				drop.onChange(value => {
					this.limit = Number(value);
				});
			});

		new Setting(container)
			.setName("Actions")
			.addButton(btn =>
				btn
					.setButtonText("Fetch")
					.setCta()
					.onClick(() => {
						void this.handleFetchRecent();
					})
			)
			.addButton(btn =>
				btn
					.setButtonText("Create note")
					.setCta()
					.onClick(() => {
						void this.handleCreateRecentNote();
					})
			);
	}

	private async handleFetchRecent(): Promise<void> {
		await this.redraw();
		await this.fetchRecent(this.contentEl);
	}

	private async handleCreateRecentNote(): Promise<void> {
		try {
			await createRecentTracksNote(this.app, this.api, this.plugin, this.limit);
			this.close();
		} catch {
			new Notice("Error creating recent tracks note.");
		}
	}

	private async fetchRecent(container: HTMLElement): Promise<void> {
		container.createEl("p", { text: "Fetching recent tracks..." });

		try {
			const tracks = await this.api.fetchRecentScrobbles(this.limit);

			container.createEl("hr");
			container.createEl("h4", { text: `Results (${tracks.length})` });

			tracks.forEach(track => {
				const div = container.createDiv();
				div.setText(`• ${track.name} — ${getArtistName(track.artist)}`);
			});
		} catch {
			new Notice("Error fetching recent tracks.");
		}
	}

	/* ---------------------------------------------------
	 * Top sections (tracks / artists / albums)
	 * --------------------------------------------------- */
	private async renderTopSection(container: HTMLElement, type: "tracks" | "artists" | "albums"): Promise<void> {
		container.createEl("h3", { text: `Top ${type}` });

		new Setting(container)
			.setName("Mode")
			.setDesc("Choose period or weekly range")
			.addDropdown(drop => {
				drop.addOption("period", "Period");
				drop.addOption("range", "Weekly range");
				drop.setValue(this.topMode);
				drop.onChange(value => {
					this.topMode = value as "period" | "range";
					void this.redraw();
				});
			});

		if (this.topMode === "period") {
			this.renderTopPeriodControls(container, type);
			return;
		}

		await this.renderTopRangeControls(container, type);
	}

	private renderTopPeriodControls(container: HTMLElement, type: "tracks" | "artists" | "albums"): void {
		new Setting(container)
			.setName("Period")
			.setDesc("Choose a last.fm period")
			.addDropdown(drop => {
				PERIODS.forEach(p => { 
					drop.addOption(p, p)
			});
				drop.setValue(this.topPeriod);
				drop.onChange(value => {
					this.topPeriod = value;
				});
			});

		new Setting(container)
			.setName("Limit")
			.setDesc("Number of items to fetch")
			.addDropdown(drop => {
				["10", "20", "30", "50", "100"].forEach(n => {
					drop.addOption(n, n)
			});
				drop.setValue(String(this.limit));
				drop.onChange(value => {
					this.limit = Number(value);
				});
			});

		new Setting(container)
			.setName("Actions")
			.addButton(btn =>
				btn
					.setButtonText("Fetch")
					.setCta()
					.onClick(() => {
						void this.handleFetchTopByPeriod(type);
					})
			)
			.addButton(btn =>
				btn
					.setButtonText("Create note")
					.setCta()
					.onClick(() => {
						void this.handleCreateTopNote(type);
					})
			);
	}

	private async renderTopRangeControls(container: HTMLElement, type: "tracks" | "artists" | "albums"): Promise<void> {
		await this.loadWeeklyPeriods();

		new Setting(container)
			.setName("Weekly period")
			.setDesc("Select a last.fm weekly chart range")
			.addDropdown(drop => {
				this.weeklyPeriods.forEach((period, index) => {
					const label = `${tsToDate(period.from)} → ${tsToDate(period.to)}`;
					drop.addOption(String(index), label);
				});

				drop.setValue(String(this.selectedWeeklyIndex));
				drop.onChange(value => {
					this.selectedWeeklyIndex = Number(value);
				});
			});

		new Setting(container)
			.setName("Actions")
			.addButton(btn =>
				btn
					.setButtonText("Fetch")
					.setCta()
					.onClick(() => {
						void this.handleFetchTopByRange(type);
					})
			)
			.addButton(btn =>
				btn
					.setButtonText("Create note")
					.setCta()
					.onClick(() => {
						void this.handleCreateWeeklyNote(type);
					})
			);
	}

	private async handleFetchTopByPeriod(type: "tracks" | "artists" | "albums"): Promise<void> {
		await this.redraw();
		await this.fetchTopByPeriod(this.contentEl, type);
	}

	private async handleCreateTopNote(type: "tracks" | "artists" | "albums"): Promise<void> {
		try {
			await createTopNote(this.plugin, this.api, type, this.topPeriod, this.limit);
			this.close();
		} catch {
			new Notice("Error creating top note.");
		}
	}

	private async handleFetchTopByRange(type: "tracks" | "artists" | "albums"): Promise<void> {
		await this.redraw();
		const period = this.weeklyPeriods[this.selectedWeeklyIndex];
		await this.fetchTopByRange(this.contentEl, type, period.from, period.to);
	}

	private async handleCreateWeeklyNote(type: "tracks" | "artists" | "albums"): Promise<void> {
		try {
			const period = this.weeklyPeriods[this.selectedWeeklyIndex];
			await createWeeklyNote(this.plugin, this.api, type, period.from, period.to);
			this.close();
		} catch {
			new Notice("Error creating weekly note.");
		}
	}

	/* ---------------------------------------------------
	 * Fetch + render helpers for top sections
	 * --------------------------------------------------- */

	private async fetchTopByPeriod(container: HTMLElement, type: "tracks" | "artists" | "albums"): Promise<void> {
		container.createEl("p", { text: `Fetching top ${type} (${this.topPeriod})...` });

		try {
			if (type === "tracks") {
				const results = await this.api.fetchTopTracks(this.topPeriod, this.limit);
				this.renderTrackItems(container, results);
			} else if (type === "artists") {
				const results = await this.api.fetchTopArtists(this.topPeriod, this.limit);
				this.renderArtistItems(container, results);
			} else {
				const results = await this.api.fetchTopAlbums(this.topPeriod, this.limit);
				this.renderAlbumItems(container, results);
			}
		} catch {
			new Notice("Error fetching top data.");
		}
	}

	private async fetchTopByRange(
		container: HTMLElement,
		type: "tracks" | "artists" | "albums",
		from: string,
		to: string
	): Promise<void> {
		container.createEl("p", { text: `Fetching ${type} from ${tsToDate(from)} to ${tsToDate(to)}...` });

		try {
			if (type === "tracks") {
				const results = await this.api.fetchWeeklyTrackChart(from, to);
				this.renderTrackItems(container, results);
			} else if (type === "artists") {
				const results = await this.api.fetchWeeklyArtistChart(from, to);
				this.renderArtistItems(container, results);
			} else {
				const results = await this.api.fetchWeeklyAlbumChart(from, to);
				this.renderAlbumItems(container, results);
			}
		} catch {
			new Notice("Error fetching weekly chart.");
		}
	}

	private renderTrackItems(container: HTMLElement, items: TrackItem[]): void {
		container.createEl("hr");
		container.createEl("h4", { text: `Results (${items.length})` });

		items.forEach(track => {
			const div = container.createDiv({ cls: "lastfm-track-item" });
			const info = div.createDiv({ cls: "lastfm-track-info" });

			info.createEl("strong", {
				text: `${track.name} — ${getArtistName(track.artist)}`
			});
			info.createEl("div", {
				cls: "lastfm-track-metadata",
				text: `Playcount: ${track.playcount ?? "0"}`
			});
		});
	}

	private renderArtistItems(container: HTMLElement, items: ArtistItem[]): void {
		container.createEl("hr");
		container.createEl("h4", { text: `Results (${items.length})` });

		items.forEach(artist => {
			const div = container.createDiv({ cls: "lastfm-track-item" });
			const info = div.createDiv({ cls: "lastfm-track-info" });

			info.createEl("strong", { text: getArtistName(artist) });
			info.createEl("div", {
				cls: "lastfm-track-metadata",
				text: `Playcount: ${
					"playcount" in artist && artist.playcount ? artist.playcount : "0"
				}`
			});
		});
	}

	private renderAlbumItems(container: HTMLElement, items: AlbumItem[]): void {
		container.createEl("hr");
		container.createEl("h4", { text: `Results (${items.length})` });

		items.forEach(album => {
			const div = container.createDiv({ cls: "lastfm-track-item" });
			const info = div.createDiv({ cls: "lastfm-track-info" });

			info.createEl("strong", {
				text: `${album.name} — ${getArtistName(album.artist)}`
			});
			info.createEl("div", {
				cls: "lastfm-track-metadata",
				text: `Playcount: ${album.playcount ?? "0"}`
			});
		});
	}
}
