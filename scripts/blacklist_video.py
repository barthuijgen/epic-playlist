# /// script
# dependencies = []
# ///
import sys
import os
import json

SONGS_FILE = "src/data/songs.json"
BLACKLIST_FILE = "src/data/blacklist.json"

def load_json(filepath, default_val):
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            try:
                data = json.load(f)
                if isinstance(data, type(default_val)):
                    return data
            except json.JSONDecodeError:
                pass
    return default_val

def save_json(filepath, data):
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/blacklist_video.py <video_id>")
        sys.exit(1)
        
    target_vid = sys.argv[1]
    
    songs = load_json(SONGS_FILE, [])
    blacklist = load_json(BLACKLIST_FILE, {})
    
    found = False
    
    for song in songs:
        videos = song.get("videos", [])
        for i, v in enumerate(videos):
            if v.get("videoId") == target_vid:
                found = True
                song_id = song.get("id")
                
                # Remove from songs
                video_obj = videos.pop(i)
                save_json(SONGS_FILE, songs)
                
                print(f"Removed '{video_obj.get('title')}' from song '{song_id}'.")
                
                # Add to blacklist
                if song_id not in blacklist:
                    blacklist[song_id] = []
                    
                # Add a manual reject reason
                video_obj["rejectReason"] = "Manually blacklisted"
                blacklist[song_id].append(video_obj)
                save_json(BLACKLIST_FILE, blacklist)
                
                print(f"Added to blacklist under '{song_id}'.")
                break
        if found:
            break
            
    if not found:
        print(f"Video ID '{target_vid}' not found in any song's video list.")

if __name__ == "__main__":
    main()
