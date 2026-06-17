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

def main():
    songs = load_songs()
    if not songs:
        return
        
    # 1. Create a list of all song titles for matching, sorted by length descending
    # Sorting by length ensures longer, more specific titles match before shorter ones
    # e.g., "The Horse and The Infant" is checked before "The Horse"
    song_info = []
    for s in songs:
        song_info.append({
            "id": s["id"],
            "title": s["title"],
            "title_lower": s["title"].lower()
        })
    song_info.sort(key=lambda x: len(x["title"]), reverse=True)
    
    # 2. Extract all videos and determine their correct category
    # Dictionary of videoId -> { "video": video_obj, "original_song_id": str, "best_song_id": str }
    unique_videos = {}
    duplicates_removed = 0
    moves = 0
    
    for s in songs:
        song_id = s["id"]
        for v in s.get("videos", []):
            vid = v["videoId"]
            
            # If we've already seen this video ID, it's a duplicate. We skip adding it again.
            if vid in unique_videos:
                duplicates_removed += 1
                continue
            
            v_title_lower = v["title"].lower()
            best_song_id = song_id # Default to its current location
            
            # See if the video title contains any other song's title
            for info in song_info:
                if info["title_lower"] in v_title_lower:
                    best_song_id = info["id"]
                    break # Stop at the first (longest) match
            
            unique_videos[vid] = {
                "video": v,
                "original_song_id": song_id,
                "best_song_id": best_song_id
            }
            
            if best_song_id != song_id:
                print(f"Moved: '{v['title']}'")
                print(f"  From: {song_id} -> To: {best_song_id}\n")
                moves += 1

    # 3. Clear existing videos from songs array
    for s in songs:
        s["videos"] = []
        
    # 4. Re-assign videos to their best_song_id
    for vid, data in unique_videos.items():
        v = data["video"]
        target_song_id = data["best_song_id"]
        
        # Find the song and append
        for s in songs:
            if s["id"] == target_song_id:
                s["videos"].append(v)
                break
                
    save_songs(songs)
    
    print("=== Cleanup Summary ===")
    print(f"Total Unique Videos: {len(unique_videos)}")
    print(f"Duplicates Removed:  {duplicates_removed}")
    print(f"Miscategorized Moved: {moves}")

if __name__ == "__main__":
    main()
