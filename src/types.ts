export interface Video {
  videoId: string;
  title: string;
  thumbnail: string;
}

export interface Song {
  id: string;
  title: string;
  saga: string;
  videos: Video[];
}

export interface SongsData extends Array<Song> {}

export type Selections = Record<string, string>;
