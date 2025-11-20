import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { LastFmPluginSettings, LastFmSettingTab, DEFAULT_SETTINGS } from './settings';
import { LastFmModal } from './ui/modals';
import { LastFmApi } from './lastfm/api';


export default class LastFmPlugin extends Plugin {
	settings: LastFmPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
    		'headphones',
    		'Last.fm Plugin',
    		(_evt: MouseEvent) => {
				if (!this.settings.apiKey || !this.settings.username) {
					// Defenive coding against missing input settings (API key and user name)
            		new Notice("Please configure Last.fm API key and username in Settings → Last.fm Plugin.");
            		return;
        		}
				const api = new LastFmApi(this.settings.apiKey, this.settings.username);
        		new LastFmModal(this.app, api, this).open();
    		}
		);

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'obsidian-lastfm-plugin',
			name: 'Open Last.fm plugin',
			callback: () => {
				if (!this.settings.apiKey || !this.settings.username) {
            		// Defenive coding against missing input settings (API key and user name)
					new Notice("Please configure Last.fm API key and username in Settings → Last.fm Plugin.");
            		return;
        		}
				const api = new LastFmApi(this.settings.apiKey, this.settings.username);
				new LastFmModal(this.app, api, this).open();
			}
		});


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new LastFmSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
