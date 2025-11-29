export interface LastFmArtist {
    name: string;
    playcount?: string;
    url: string;
    mbid?: string;
    image?: LastFmImage[];
}

// This is for the WeeklyAlbumChart, which returns a simplified version
// of an artist 
export interface LastFmSimpleArtist {
    mbid?: string;
    ["#text"]: string;
}

export interface LastFmAlbum {
    name: string;
    playcount?: string;
    mbid?: string;
    url: string;
    artist: LastFmArtist; 
    image: LastFmImage[];
}

export interface LastFmWeeklyAlbum {
    name: string;
    playcount: string;
    mbid?: string;
    url: string;
    image?: LastFmImage[];
    artist: LastFmSimpleArtist;
}

export interface LastFmImage {
	size: string;
	"#text": string;
}

export interface LastFmDate {
	uts: string;           // Unix timestamp as string
	"#text": string;       // Human-readable timestamp
}

export interface ImageContainer {
	image?: LastFmImage[];
}

export interface LastFmTrack {
	name: string;
    playcount?: number
	artist: LastFmArtist;
	album: LastFmAlbum;
	mbid?: string;
	url?: string;
	streamable?: string;
	image: LastFmImage[];
	date?: LastFmDate;
	["@attr"]?: { nowplaying?: "true" };
}

export interface LastFmRecentTracksResponse {
	recenttracks: {
		track: LastFmTrack[] | LastFmTrack;
		"@attr": {
			user: string;
			total: string;
			page: string;
			perPage: string;
			totalPages: string;
		};
	};
}

export interface LastFmTopArtistResponse {
    topartists: {
        artist: LastFmArtist[];
        "@attr": {
            rank: string;
        }
    };
}

export interface LastFmTopAlbumResponse {
    topalbums: {
        album: LastFmAlbum[];
        "@attr": {
            rank: string;
        }
    };
}

export interface LastFmTopTrackResponse {
    toptracks: {
        track: LastFmTrack[];
        "@attr": {
            rank: string;
        }
    };
}

export interface LastFmWeeklyArtistChartResponse {
    weeklyartistchart: {
        artist: LastFmArtist[];
        "@attr": {
            rank: string;
        }
    };
}

export interface LastFmWeeklyAlbumChartResponse {
    weeklyalbumchart: {
        album: LastFmWeeklyAlbum[];
        "@attr": {
            rank: string;
        }
    };
}

export interface LastFmWeeklyTrackChartResponse {
    weeklytrackchart: {
        track: LastFmTrack[];
        "@attr": {
            rank: string;
        }
    };
}