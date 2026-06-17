import React from "react";
import type { Song } from "../types.js";

interface SongPickerProps {
  song: Song;
  selectedVideoId: string | null;
  onSelect: (videoId: string) => void;
}

const SongPicker: React.FC<SongPickerProps> = ({ song, selectedVideoId, onSelect }) => {
  return (
    <div className="song-picker">
      <div className="song-info">
        <h3 className="song-title">{song.title}</h3>
      </div>

      {song.videos && song.videos.length > 0 ? (
        <div className="video-options-container">
          {song.videos.map((video) => {
            const isSelected = selectedVideoId === video.videoId;
            return (
              <div
                key={video.videoId}
                className={`video-thumbnail ${isSelected ? "selected" : ""}`}
                onClick={() => onSelect(video.videoId)}
              >
                <div className="thumbnail-img-wrapper">
                  <img
                    src={
                      video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`
                    }
                    alt={video.title}
                    className="thumbnail-img"
                    loading="lazy"
                  />
                  {isSelected && <span className="selected-badge">Selected</span>}
                </div>
                <div className="thumbnail-title" title={video.title}>
                  {video.title}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-videos-message">No videos found for this song yet.</div>
      )}
    </div>
  );
};

export default SongPicker;
