import {
	LastFmTrack,
	LastFmArtist,
	LastFmSimpleArtist,
	LastFmAlbum,
	LastFmWeeklyAlbum
} from "./types";

/** Tracks */
export type TrackItem = LastFmTrack;

/** Artists (top artists return LastFmArtist, weekly albums use LastFmSimpleArtist) */
export type ArtistItem = LastFmArtist | LastFmSimpleArtist;

/** Albums (top albums + weekly albums) */
export type AlbumItem = LastFmAlbum | LastFmWeeklyAlbum;

/**
 * Map "tracks" | "artists" | "albums" to their concrete item types.
 */
export type ItemFor<T extends "tracks" | "artists" | "albums"> =
	T extends "tracks" ? TrackItem :
	T extends "artists" ? ArtistItem :
	AlbumItem;

/** Convenience union for item rendering loops */
export type AnyItem = TrackItem | ArtistItem | AlbumItem;
