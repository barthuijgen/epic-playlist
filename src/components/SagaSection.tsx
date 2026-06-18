import React from "react";
import SongPicker from "./SongPicker";
import { Song, Selections } from "../types";

interface SagaSectionProps {
  sagaName: string;
  songs: Song[];
  selections: Selections;
  onSelectVideo: (songId: string, videoId: string) => void;
  favorites: string[];
  toggleFavorite: (videoId: string) => void;
}

const SagaSection: React.FC<SagaSectionProps> = ({
  sagaName,
  songs,
  selections,
  onSelectVideo,
  favorites,
  toggleFavorite,
}) => {
  return (
    <section className="saga-section animate-fade-in">
      <h2 className="saga-title">{sagaName}</h2>
      <div className="saga-songs">
        {songs.map((song) => (
            <SongPicker
              key={song.id}
              song={song}
              selectedVideoId={
                selections[song.id] ||
                (song.videos && song.videos.length > 0 ? (song.videos[0]?.videoId ?? null) : null)
              }
              onSelect={(videoId) => onSelectVideo(song.id, videoId)}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
        ))}
      </div>
    </section>
  );
};

export default SagaSection;
