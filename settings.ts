import { PluginSettingTab, Setting, App } from "obsidian";
import type LastFmPlugin from './main';

export interface LastFmPluginSettings {
	apiKey: string;
	username: string;
    folder: string
}

export const DEFAULT_SETTINGS: LastFmPluginSettings = {
	apiKey: "",
	username: "",
    folder: "Lastfm"
};

export class LastFmSettingTab extends PluginSettingTab {
    plugin: LastFmPlugin;

    constructor(app: App, plugin: LastFmPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        /* ----------------------------
         * API Key
         * ---------------------------- */
        new Setting(containerEl)
            .setName('API key')
            .setDesc('Your last.fm API key')
            .addText(text => text
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                }));

        /* ----------------------------
         * Username
         * ---------------------------- */
        new Setting(containerEl)
            .setName('Username')
            .setDesc('Your last.fm username')
            .addText(text => text
                .setValue(this.plugin.settings.username)
                .onChange(async (value) => {
                    this.plugin.settings.username = value;
                    await this.plugin.saveSettings();
                }));

        /* ----------------------------
         * Folder
         * ---------------------------- */
        new Setting(containerEl)
            .setName('Note folder')
            .setDesc('Folder in which notes will be created')
            .addText(text => text
                .setValue(this.plugin.settings.folder)
                .onChange(async (value) => {
                    this.plugin.settings.folder = value;
                    await this.plugin.saveSettings();
                }));     
    }
}