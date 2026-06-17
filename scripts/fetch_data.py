# /// script
# dependencies = []
# ///
import os
import json
import subprocess
import time
import sys

SONGS_FILE = "src/data/songs.json"
BLACKLIST_FILE = "src/data/blacklist.json"

def get_blacklist():
    if os.path.exists(BLACKLIST_FILE):
        with open(BLACKLIST_FILE, "r") as f:
            return set(json.load(f))
    return set()

def load_songs():
    if os.path.exists(SONGS_FILE):
        with open(SONGS_FILE, "r") as f:
            return json.load(f)
    print("Error: src/data/songs.json not found!")
    return []

def save_songs(songs):
    with open(SONGS_FILE, "w") as f:
        json.dump(songs, f, indent=2)

def is_valid_animatic(title, author, description, target_song):
    prompt = f"""
    You are an AI assistant tasked with filtering YouTube search results for "Epic The Musical" playlists.
    We ONLY want genuine fan-made "Animatics" or "Animations" specifically for the song "{target_song}".
    
    Video Title: {title}
    Channel Name: {author}
    Description: {description}
    
    Is this a genuine animatic or animation specifically for the song "{target_song}"? 
    It is NOT a valid match if it is:
    - An animatic for a DIFFERENT song in the musical
    - A reaction video (e.g. someone reacting to the song/animatic)
    - Just the original song audio with a static image
    - A cover of the song without an animation
    - A podcast, tier list, or discussion
    
    Reply ONLY with the exact word "YES" or "NO".
    """
    
    try:
        result = subprocess.run(["kimi", "-p", prompt], capture_output=True, text=True)
        answer = result.stdout.strip().upper()
        return "YES" in answer
    except Exception as e:
        print(f"Error calling kimi CLI: {e}")
        # Fallback keyword check if CLI fails
        lower_title = title.lower()
        if "reaction" in lower_title or "reacts" in lower_title:
            return False
        return True

def fetch_videos_for_song(song_title, existing_video_ids, blacklist):
    print(f"\nSearching for: {song_title}")
    query = f"ytsearch100:{song_title} epic the musical animatic"
    
    # Use uvx to run yt-dlp without needing global installation
    cmd = [
        "uvx", "yt-dlp",
        query,
        "--dump-json",
        "--flat-playlist",
        "--ignore-errors"
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
    except Exception as e:
        print(f"Failed to run yt-dlp: {e}")
        return []
        
    videos = []
    lines = result.stdout.strip().split('\n')
    
    for line in lines:
        if not line:
            continue
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            continue
            
        video_id = data.get("id")
        
        # Skip duplicates and blacklisted videos
        if video_id in existing_video_ids or video_id in blacklist:
            continue
            
        title = data.get("title", "")
        author = data.get("uploader", "")
        description = data.get("description", "")
        views = data.get("view_count", 0)
        
        # Smart Filter
        if is_valid_animatic(title, author, description, song_title):
            videos.append({
                "videoId": video_id,
                "title": title,
                "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                "author": author,
                "views": views
            })
            existing_video_ids.add(video_id)
            print(f"  [+] Added: {title} by {author}")
        else:
            print(f"  [-] Rejected by AI: {title}")
            
    return videos

def main():
    target_song_id = sys.argv[1] if len(sys.argv) > 1 else None
    
    songs = load_songs()
    if not songs:
        return
        
    blacklist = get_blacklist()
    
    for song in songs:
        if target_song_id and song.get("id") != target_song_id:
            continue
            
        if "videos" not in song:
            song["videos"] = []
            
        existing_video_ids = set(v["videoId"] for v in song["videos"])
        
        new_videos = fetch_videos_for_song(song["title"], existing_video_ids, blacklist)
        
        if new_videos:
            song["videos"].extend(new_videos)
            # Save progressively so we don't lose data if script crashes
            save_songs(songs)
            
        time.sleep(1) # Be nice to YouTube

if __name__ == "__main__":
    main()
