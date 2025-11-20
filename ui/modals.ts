import { App, Modal, Setting, Notice } from "obsidian";
import LastFmPlugin from "main";
import { LastFmApi } from "../lastfm/api";
import { createRecentTracksNote, createTopNote, createWeeklyNote } from "../commands/noteCommands";
import { tsToDate, getArtistName } from "utils/helpers";

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
    private plugin: LastFmPlugin

    private activeSection: SectionName = "recent";

    private limit: number = 10; //shared default value

    // For Top sections
	private topMode: "period" | "range" = "period";
	private topPeriod: string = "7day";

	// For Range Mode
	private weeklyPeriods: { from: string; to: string }[] = [];
	private selectedWeeklyIndex: number = 0;

    constructor(app: App, api:LastFmApi, plugin:LastFmPlugin){
        super(app);
        this.api = api;
        this.plugin = plugin;
    }


    onOpen() {
        this.modalEl.addClass("lastfm-modal");
        this.redrawAsync();
    }

	onClose() {
        this.contentEl.empty();
    }

	private async loadWeeklyPeriods() {
    	if (this.weeklyPeriods.length === 0) {
        	this.weeklyPeriods = await this.api.fetchWeeklyChartList();
        	this.selectedWeeklyIndex = this.weeklyPeriods.length - 1; // newest week
    	}
	}

    /* ---------------------------------------------------
     * Utility: Safe async redraw
     * --------------------------------------------------- */
	private redrawAsync() {
    	(async () => {
        	await this.redraw();
    	})();
	}


    private async redraw() {
        const { contentEl } = this;
        contentEl.empty();

        /* --------------------------
         * TABS
         * -------------------------- */
		const tabs = contentEl.createDiv("lastfm-tabs");

        this.createTabButton(tabs, "recent", "Recent Scrobbles");
		this.createTabButton(tabs, "topTracks", "Top Tracks");
		this.createTabButton(tabs, "topArtists", "Top Artists");
		this.createTabButton(tabs, "topAlbums", "Top Albums");

        contentEl.createEl("hr");

        /* --------------------------
         * SECTION RENDERING
         * -------------------------- */
		if (this.activeSection === "recent") 
            this.renderRecentSection(contentEl);
		else 
			await this.renderTopSection(contentEl, this.activeSection.replace("top", "").toLowerCase() as any);
    }

	/* ---------------------------------------------------
     * TABS
     * --------------------------------------------------- */
	private createTabButton(container: HTMLElement, name: SectionName, label: string) {
		const btn = container.createEl("button");

        // Active class?
        if (this.activeSection === name) {
            btn.addClass("active");
        }
        
        // ICON
        const iconSpan = btn.createSpan({
            cls: "lastfm-tab-icon " + name // CSS class determines which icon to show
        });
        
        // LABEL
        btn.createSpan({ text: label });

        // Click handler
		btn.onClickEvent(() => {
			this.activeSection = name;
			this.redrawAsync();
		});
	}    

	/* ---------------------------------------------------
     * RECENT SECTION
     * --------------------------------------------------- */
	private renderRecentSection(container: HTMLElement) {
		container.createEl("h3", { text: "Recent Scrobbles" });

		// Limit dropdown
		new Setting(container)
			.setName("Limit")
			.setDesc("Number of recent scrobbles to fetch")
			.addDropdown(drop => {
				["5", "10", "20", "50", "100"].forEach(n => drop.addOption(n, n));
				drop.setValue(String(this.limit));
				drop.onChange(v => (this.limit = Number(v)));
			});

		// Fetch + Create Note
		new Setting(container)
			.setName("Actions")
			.addButton(btn =>
    			btn
        			.setButtonText("Fetch")
        			.setCta()
        			.onClick(() => {
            			// 1. Clear modal
            			this.redrawAsync();
						// 2. Allow redraw to finish before injecting results
            			setTimeout(() => {
                			this.fetchRecent(this.contentEl);
            			}, 10);
        			})
			)
			.addButton(btn =>
				btn
					.setButtonText("Create Note")
                    .setCta()
					.onClick(async () => {
						await createRecentTracksNote(this.app, this.api, this.plugin, this.limit);
						this.close();
					})
			);
	}

	/* ---------------------------------------------------
     * TOP TRACKS / ARTISTS / ALBUMS SECTION
     * --------------------------------------------------- */
	private async renderTopSection(container: HTMLElement, type: "tracks" | "artists" | "albums") {
		container.createEl("h3", { text: `Top ${type}` });

		/* ------------------------------
         * Mode selector (period or range)
         * ------------------------------ */
		new Setting(container)
			.setName("Mode")
			.setDesc("Choose Period or From/To Date")
			.addDropdown(drop => {
				drop.addOption("period", "Period");
				drop.addOption("range", "From/To Date");
				drop.setValue(this.topMode);
				drop.onChange(v => {
					this.topMode = v as "period" | "range";
					this.redrawAsync();
				});
			});

		/* ------------------------------
         * If Period Mode
         * ------------------------------ */
		if (this.topMode === "period") {
			new Setting(container)
				.setName("Period")
				.setDesc("Choose a Last.fm period")
				.addDropdown(drop => {
					PERIODS.forEach(p => drop.addOption(p, p));
					drop.setValue(this.topPeriod);
					drop.onChange(v => (this.topPeriod = v));
				});

			/* ------------------------------
 			* Limit dropdown (ONLY FOR PERIOD MODE)
 			* ------------------------------ */
			new Setting(container)
    			.setName("Limit")
    			.setDesc("Number of items to fetch")
    			.addDropdown(drop => {
        			["10", "20", "30", "50", "100"].forEach(n => drop.addOption(n, n));
        			drop.setValue(String(this.limit));
        			drop.onChange(v => (this.limit = Number(v)));
    			});

			new Setting(container)
				.setName("Actions")
				.addButton(btn =>
					btn
						.setButtonText("Fetch")
						.setCta()
						.onClick(() => {
    						this.redrawAsync();
    						// run fetch after redraw
    						setTimeout(() => {
        						this.fetchTopByPeriod(this.contentEl, type);
    						}, 10);
						}))
				.addButton(btn =>
					btn
						.setButtonText("Create Note")
						.setCta()
						.onClick(async () => {
							await createTopNote(this.plugin, this.api, type, this.topPeriod, this.limit);
							this.close();
						})
				);

			return;
		}

		/* ------------------------------
         * If Range Mode
         * ------------------------------ */
		await this.loadWeeklyPeriods();

		new Setting(container)
    		.setName("Weekly period")
    		.setDesc("Select a valid Last.fm weekly chart range")
    		.addDropdown(drop => {
        		this.weeklyPeriods.forEach((p, index) => {
            		const label = `${tsToDate(p.from)} → ${tsToDate(p.to)}`;
            		drop.addOption(String(index), label);
        		});

        		drop.setValue(String(this.selectedWeeklyIndex));

        		drop.onChange(v => {
            		this.selectedWeeklyIndex = parseInt(v);
        		});
    		});

		new Setting(container)
			.setName("Actions")
			.addButton(btn =>
				btn
					.setButtonText("Fetch")
					.setCta()
					.onClick(() => {
   						const period = this.weeklyPeriods[this.selectedWeeklyIndex];
						this.redrawAsync();
    					setTimeout(() => {
        					this.fetchTopByRange(this.contentEl, type, period.from, period.to);
    					}, 10);
					})
			)
			.addButton(btn =>
				btn
					.setButtonText("Create Note")
					.setCta()
					.onClick(async () => {
						const period = this.weeklyPeriods[this.selectedWeeklyIndex];
						await createWeeklyNote(this.plugin, this.api, type, period.from, period.to);
						this.close();
					})
			);
	}

	/* ---------------------------------------------------
     * FETCH: RECENT
     * --------------------------------------------------- */
	private async fetchRecent(container: HTMLElement) {
		container.createEl("p", { text: "Fetching recent tracks..." });

		try {
			const tracks = await this.api.fetchRecentScrobbles(this.limit);

			container.createEl("hr");
			container.createEl("h4", { text: `Results (${tracks.length})` });

			tracks.forEach(t => {
				const div = container.createDiv();
				div.setText(`• ${t.name} — ${getArtistName(t.artist)}`);
			});
		} catch (err) {
			new Notice("Error fetching recent tracks.");
		}
	}

	/* ---------------------------------------------------
     * FETCH: TOP BY PERIOD
     * --------------------------------------------------- */
	private async fetchTopByPeriod(container: HTMLElement, type: string) {
		container.createEl("p", { text: `Fetching top ${type} (${this.topPeriod})...` });

		let results: any[] = [];

		try {
			if (type === "tracks") {
				results = await this.api.fetchTopTracks(this.topPeriod, this.limit);
			} else if (type === "albums") {
				results = await this.api.fetchTopAlbums(this.topPeriod, this.limit);
			} else if (type === "artists") {
				results = await this.api.fetchTopArtists(this.topPeriod, this.limit);
			}

			container.createEl("hr");
			container.createEl("h4", { text: `Results (${results.length})` });

			results.forEach((item: any) => {
				const div = container.createDiv({ cls: "lastfm-track-item" });

				const info = div.createDiv({ cls: "lastfm-track-info" });

				if (type === "tracks") {
					info.createEl("strong", {
						text: `${item.name} — ${getArtistName(item.artist)}`
					});
					info.createEl("div", {
						cls: "lastfm-track-metadata",
						text: `Playcount: ${item.playcount}`
					});
				}

				if (type === "artists") {
					info.createEl("strong", { text: item.name });
					info.createEl("div", {
						cls: "lastfm-track-metadata",
						text: `Playcount: ${item.playcount}`
					});
				}

				if (type === "albums") {
					info.createEl("strong", {
						text: `${item.name} — ${getArtistName(item.artist)}`
					});
					info.createEl("div", {
						cls: "lastfm-track-metadata",
						text: `Playcount: ${item.playcount}`
					});
				}
			});
		} catch (err) {
			new Notice("Error fetching top data");
		}
	}

	/* ---------------------------------------------------
     * FETCH: TOP BY RANGE (from/to weekly charts)
     * --------------------------------------------------- */
	private async fetchTopByRange(container: HTMLElement, type: string, from: string, to: string) {
		container.createEl("p", { text: `Fetching ${type} from ${tsToDate(from)} to ${tsToDate(to)}...` });

		let results: any[] = [];

		try {
			if (type === "tracks") {
				results = await this.api.fetchWeeklyTrackChart(from, to);
			} else if (type === "albums") {
				results = await this.api.fetchWeeklyAlbumChart(from, to);
			} else if (type === "artists") {
				results = await this.api.fetchWeeklyArtistChart(from, to);
			}

			container.createEl("hr");
			container.createEl("h4", { text: `Results (${results.length})` });

			results.forEach((item: any) => {
				const div = container.createDiv({ cls: "lastfm-track-item" });

				const info = div.createDiv({ cls: "lastfm-track-info" });

				if (type === "tracks") {
					info.createEl("strong", {
						text: `${item.name} — ${getArtistName(item.artist)}`
					});
					info.createEl("div", {
						cls: "lastfm-track-metadata",
						text: `Playcount: ${item.playcount}`
					});
				}

				if (type === "artists") {
					info.createEl("strong", { text: item.name });
					info.createEl("div", {
						cls: "lastfm-track-metadata",
						text: `Playcount: ${item.playcount}`
					});
				}

				if (type === "albums") {
					info.createEl("strong", {
						text: `${item.name} — ${getArtistName(item.artist)}`
					});
					info.createEl("div", {
						cls: "lastfm-track-metadata",
						text: `Playcount: ${item.playcount}`
					});
				}
			});

		} catch (err) {
			new Notice("Error fetching weekly chart.");	
		}
	}
}