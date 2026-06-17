import React from 'react';
import SongPicker from './SongPicker';

const SagaSection = ({ sagaName, songs, selections, onSelectVideo }) => {
  return (
    <section className="saga-section animate-fade-in">
      <h2 className="saga-title">{sagaName}</h2>
      <div className="saga-songs">
        {songs.map(song => (
          <SongPicker
            key={song.id}
            song={song}
            selectedVideoId={selections[song.id] || (song.videos && song.videos.length > 0 ? song.videos[0].videoId : null)}
            onSelect={(videoId) => onSelectVideo(song.id, videoId)}
          />
        ))}
      </div>
    </section>
  );
};

export default SagaSection;
