import {
    LastFmTrack,
    LastFmArtist,
    LastFmAlbum,
    LastFmRecentTracksResponse,
    LastFmTopArtistResponse,
    LastFmTopAlbumResponse,
    LastFmTopTrackResponse,
    LastFmWeeklyArtistChartResponse,
    LastFmWeeklyAlbumChartResponse,
    LastFmWeeklyAlbum,
    LastFmWeeklyTrackChartResponse
} from "./types";

const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

export class LastFmApi {
	constructor(private apiKey: string, private username: string) {}

	private async request(method: string, params: Record<string, string> = {}) {
		const url = new URL(BASE_URL);
		url.search = new URLSearchParams({
			method,
			user: this.username,
			api_key: this.apiKey,
			format: 'json',
			...params
		}).toString();

		const res = await fetch(url.toString());
		if (!res.ok) throw new Error(`HTTP ${res.status} for ${method}`);
		return res.json();
	}

    /* ----------------------------------------------------
     * Get a list of available charts for this user, 
     * expressed as date ranges which can be sent to the chart services.
     * Link: https://www.last.fm/api/show/user.getWeeklyChartList
     * ---------------------------------------------------- */
    async fetchWeeklyChartList(): Promise<{ from: string; to: string }[]> {
        const data = await this.request("user.getWeeklyChartList");

        const raw = data?.weeklychartlist?.chart;
        if (!raw) return [];

        // Always normalized into array
        return Array.isArray(raw) ? raw : [raw];
    }

    /* ----------------------------------------------------
     * RECENT SCROBBLES
     * ---------------------------------------------------- */
	async fetchRecentScrobbles(limit = 10): Promise<LastFmTrack[]> {
		const data = (await this.request(
			"user.getrecenttracks",
			{ limit: limit.toString() }
		)) as LastFmRecentTracksResponse;

		const tracks = data?.recenttracks?.track;
		if (!tracks) return [];

		// Normalize to array
		return Array.isArray(tracks) ? tracks : [tracks];
	}

    /* ----------------------------------------------------
     * TOP TRACKS (PERIOD)
     * ---------------------------------------------------- */
    async fetchTopTracks(period: string = "7day", limit = 20): Promise<LastFmTrack[]> {
        const data = (await this.request("user.gettoptracks", {
            period,
            limit: limit.toString()
        })) as LastFmTopTrackResponse;

        return data?.toptracks?.track ?? [];
    }

    /* ----------------------------------------------------
     * TOP ARTISTS (PERIOD)
     * ---------------------------------------------------- */
    async fetchTopArtists(period: string = "7day", limit = 20): Promise<LastFmArtist[]> {
        const data = (await this.request("user.gettopartists", {
            period,
            limit: limit.toString()
        })) as LastFmTopArtistResponse;

        return data?.topartists?.artist ?? [];
    }

    /* ----------------------------------------------------
     * TOP ALBUMS (PERIOD)
     * ---------------------------------------------------- */
    async fetchTopAlbums(period = "7day", limit = 20): Promise<LastFmAlbum[]> {
        const data = (await this.request("user.gettopalbums", {
            period,
            limit: limit.toString()
        })) as LastFmTopAlbumResponse;

        return data?.topalbums?.album ?? [];
    }

	/* ----------------------------------------------------
     * WEEKLY TRACK CHART (FROM / TO)
     * ---------------------------------------------------- */
    async fetchWeeklyTrackChart(from: string, to: string): Promise<LastFmTrack[]> {
        const data = (await this.request("user.getweeklytrackchart", {
            from,
            to
        })) as LastFmWeeklyTrackChartResponse;

        return data?.weeklytrackchart?.track ?? [];
    }

	/* ----------------------------------------------------
     * WEEKLY ARTIST CHART (FROM / TO)
     * ---------------------------------------------------- */
    async fetchWeeklyArtistChart(from: string, to: string): Promise<LastFmArtist[]> {
        const data = (await this.request("user.getweeklyartistchart", {
            from,
            to
        })) as LastFmWeeklyArtistChartResponse;

        return data?.weeklyartistchart?.artist ?? [];
    }

    /* ----------------------------------------------------
     * WEEKLY ALBUM CHART (FROM / TO)
     * ---------------------------------------------------- */
    async fetchWeeklyAlbumChart(from: string, to: string): Promise<LastFmWeeklyAlbum[]> {
        const data = (await this.request("user.getweeklyalbumchart", {
            from,
            to
        })) as LastFmWeeklyAlbumChartResponse;

        return data?.weeklyalbumchart?.album ?? [];
    }
}
