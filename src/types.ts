export interface Video {
  videoId: string;
  title: string;
  thumbnail: string;
  author?: string;
  views?: number;
}

export interface Song {
  id: string;
  title: string;
  saga: string;
  videos: Video[];
}

export interface SongsData extends Array<Song> {}

export interface Selections {
  [songId: string]: string;
}

export interface AuthorStat {
  name: string;
  totalVideos: number;
  songsCovered: number;
  totalViews: number;
}
