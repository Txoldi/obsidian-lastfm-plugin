import { PluginSettingTab, Setting, App } from "obsidian";
import type LastFmPlugin from './main';

export interface LastFmPluginSettings {
	apiKey: string;
	username: string;
    folder: string
}

export const DEFAULT_SETTINGS: LastFmPluginSettings = {
	apiKey: "",
	username: "rj",
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
            .setName('API Key')
            .setDesc('Your Last.fm API key')
            .addText(text => text
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh UI to update warnings
                }));

        // Warning if API key is missing
        if (!this.plugin.settings.apiKey) {
            const warn = containerEl.createEl("p", {
                text: "⚠ Your API key is required for the plugin to work.",
            });
            warn.style.color = "var(--text-error)";
            warn.style.marginTop = "-8px";
        }

        /* ----------------------------
         * Username
         * ---------------------------- */
        new Setting(containerEl)
            .setName('Username')
            .setDesc('Your Last.fm username')
            .addText(text => text
                .setValue(this.plugin.settings.username)
                .onChange(async (value) => {
                    this.plugin.settings.username = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        // IWarning if username is missing
        if (!this.plugin.settings.username) {
            const warn = containerEl.createEl("p", {
                text: "⚠ Username is required.",
            });
            warn.style.color = "var(--text-error)";
            warn.style.marginTop = "-8px";
        }

        /* ----------------------------
         * Folder
         * ---------------------------- */
        new Setting(containerEl)
            .setName('Note Folder')
            .setDesc('Folder in which notes will be created')
            .addText(text => text
                .setValue(this.plugin.settings.folder)
                .onChange(async (value) => {
                    this.plugin.settings.folder = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        // Warning if the folder contains invalid characters
        const illegalChars = /[<>:"/\\|?*]/;
        if (illegalChars.test(this.plugin.settings.folder)) {
            const warn = containerEl.createEl("p", {
                text: "⚠ Folder contains invalid characters. Remove: < > : \" / \\ | ? *",
            });
            warn.style.color = "var(--text-error)";
            warn.style.marginTop = "-8px";
        }                
    }
}