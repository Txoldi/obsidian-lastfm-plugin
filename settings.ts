import { PluginSettingTab, Setting, App } from "obsidian";
import type LastFmPlugin from './main';

export interface LastFmPluginSettings {
	apiKey: string;
	username: string;
    folder: string
}

export const DEFAULT_SETTINGS: LastFmPluginSettings = {
	apiKey: '6489ec403f1e01822a1b3361deed66df',
	username: 'BxlMadDog',
    folder: '00_Sources/Music/Last.fm'
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

        new Setting(containerEl)
            .setName('API Key')
            .setDesc('Your Last.fm API key')
            .addText(text => text
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Username')
            .setDesc('Your Last.fm username')
            .addText(text => text
                .setValue(this.plugin.settings.username)
                .onChange(async (value) => {
                    this.plugin.settings.username = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Note Folder')
            .setDesc('Folder in which notes will be created')
            .addText(text => text
                .setValue(this.plugin.settings.folder)
                .onChange(async (value) => {
                    this.plugin.settings.folder = value;
                    await this.plugin.saveSettings();
                }));
    }
}