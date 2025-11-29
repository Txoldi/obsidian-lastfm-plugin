import { Notice, Plugin } from 'obsidian';
import { LastFmPluginSettings, LastFmSettingTab, DEFAULT_SETTINGS } from './settings';
import { LastFmModal } from './ui/modals';
import { LastFmApi } from './lastfm/api';


export default class LastFmPlugin extends Plugin {
	settings: LastFmPluginSettings = { ...DEFAULT_SETTINGS };

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			'headphones',
			'Last.fm plugin',
			(_evt: MouseEvent) => {
				if (!this.settings.apiKey || !this.settings.username) {
					// Defenive coding against missing input settings (API key and user name)
					new Notice("lease configure last.fm API key and username in the settings.");
					return;
				}
				const api = new LastFmApi(this.settings.apiKey, this.settings.username);
				new LastFmModal(this.app, api, this).open();
			}
		);

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status bar text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'plugin-modal',
			name: 'Fetch tracks/albums/artists',
			callback: () => {
				if (!this.settings.apiKey || !this.settings.username) {
				// Defenive coding against missing input settings (API key and user name)
					new Notice("Please configure last.fm API key and username in the settings.");
					return;
				}
				const api = new LastFmApi(this.settings.apiKey, this.settings.username);
				new LastFmModal(this.app, api, this).open();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new LastFmSettingTab(this.app, this));
	}

	onunload() {
		// do nothing
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
