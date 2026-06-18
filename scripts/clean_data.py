# /// script
# dependencies = []
# ///
import os
import json

SONGS_FILE = "src/data/songs.json"

def load_songs():
    if os.path.exists(SONGS_FILE):
        with open(SONGS_FILE, "r") as f:
            return json.load(f)
    print(f"Error: {SONGS_FILE} not found!")
    return []

def save_songs(songs):
    with open(SONGS_FILE, "w") as f:
        json.dump(songs, f, indent=2)

def parse_duration_to_seconds(duration_str):
    if not duration_str or duration_str == "Unknown":
        return None
    try:
        parts = duration_str.split(":")
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        elif len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    except:
        pass
    return None

def main():
    songs = load_songs()
    if not songs:
        return
        
    seen_videos = set()
    duplicates_removed = 0
    too_short_removed = 0
    total_retained = 0
    
    for s in songs:
        song_videos = s.get("videos", [])
        target_duration_sec = parse_duration_to_seconds(s.get("duration", "Unknown"))
        
        retained_videos = []
        for v in song_videos:
            vid = v.get("videoId")
            
            # 1. Remove global duplicates
            if vid in seen_videos:
                duplicates_removed += 1
                continue
                
            video_duration = v.get("duration", 0)
            
            # 2. Remove videos that are more than 10 seconds shorter than the target song
            if target_duration_sec is not None and video_duration is not None and video_duration > 0:
                if video_duration < (target_duration_sec - 10):
                    too_short_removed += 1
                    print(f"Removed too short: '{v.get('title')}' ({video_duration}s vs {target_duration_sec}s) from {s['id']}")
                    continue
                    
            seen_videos.add(vid)
            retained_videos.append(v)
            total_retained += 1
            
        s["videos"] = retained_videos
        
    save_songs(songs)
    
    print("\n=== Cleanup Summary ===")
    print(f"Total Unique Videos Retained: {total_retained}")
    print(f"Duplicates Removed:           {duplicates_removed}")
    print(f"Too Short Removed:            {too_short_removed}")

if __name__ == "__main__":
    main()
