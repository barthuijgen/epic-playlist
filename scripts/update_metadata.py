# /// script
# dependencies = []
# ///
import os
import json
import subprocess
import time
import sys

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

def fetch_metadata(video_id):
    url = f"https://www.youtube.com/watch?v={video_id}"
    cmd = [
        "uvx", "yt-dlp",
        url,
        "--dump-json",
        "--ignore-errors",
        "--no-playlist"
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.stdout:
            # yt-dlp might output multiple lines if there are warnings, grab the last one which is usually the JSON
            lines = result.stdout.strip().split('\n')
            for line in reversed(lines):
                if line.startswith('{'):
                    data = json.loads(line)
                    return {
                        "title": data.get("title", ""),
                        "author": data.get("uploader", ""),
                        "views": data.get("view_count", 0),
                        "duration": data.get("duration", 0)
                    }
    except Exception as e:
        print(f"Exception fetching {video_id}: {e}")
    return None

def main():
    force_update = "--force" in sys.argv or "--all" in sys.argv

    songs = load_songs()
    if not songs:
        return
        
    print(f"Starting metadata update... (Force update: {force_update})")
    
    for song in songs:
        if "videos" not in song or not song["videos"]:
            continue
            
        print(f"\n--- {song.get('title', 'Unknown')} ---")
        for video in song["videos"]:
            video_id = video.get("videoId")
            if not video_id:
                continue
                
            has_all_fields = all([
                video.get("title"),
                video.get("author"),
                video.get("views") is not None,
                video.get("duration") is not None
            ])

            if has_all_fields and not force_update:
                continue
                
            print(f"  Fetching '{video.get('title', video_id)}' ({video_id})...", end=" ", flush=True)
            meta = fetch_metadata(video_id)
            if meta:
                video["title"] = meta["title"]
                video["author"] = meta["author"]
                video["views"] = meta["views"]
                video["duration"] = meta["duration"]
                print(f"Updated! ({meta['views']} views, {meta['duration']}s)")
            else:
                print("Failed to update.")
            
            # Save progressively so we don't lose data if the script is interrupted
            save_songs(songs)
            
            # Be nice to YouTube's rate limits
            time.sleep(1)
            
    print("\nMetadata update complete!")

if __name__ == "__main__":
    main()
