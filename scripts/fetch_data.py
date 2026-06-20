# /// script
# dependencies = []
# ///
import os
import json
import subprocess
import time
import sys
import re

SONGS_FILE = "src/data/songs.json"
BLACKLIST_FILE = "src/data/blacklist.json"

def get_blacklist():
    if os.path.exists(BLACKLIST_FILE):
        with open(BLACKLIST_FILE, "r") as f:
            try:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
                return {}
            except json.JSONDecodeError:
                return {}
    return {}

def save_blacklist(blacklist):
    with open(BLACKLIST_FILE, "w") as f:
        json.dump(blacklist, f, indent=2)

def load_songs():
    if os.path.exists(SONGS_FILE):
        with open(SONGS_FILE, "r") as f:
            return json.load(f)
    print("Error: src/data/songs.json not found!")
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

def is_valid_animatic(title, author, description, target_song, target_duration_str, video_duration_sec):
    video_duration_str = "Unknown"
    if video_duration_sec:
        m, s = divmod(int(video_duration_sec), 60)
        video_duration_str = f"{m}:{s:02d}"

    prompt = f"""
    You are an AI assistant tasked with filtering YouTube search results for "Epic The Musical" playlists.
    We ONLY want genuine fan-made "Animatics" or "Animations" specifically for the song "{target_song}".
    
    Video Title: {title}
    Channel Name: {author}
    Description: {description}
    Video Duration: {video_duration_str}
    Official Song Duration: {target_duration_str}
    
    Is this a genuine animatic or animation specifically for the song "{target_song}"? 
    It is NOT a valid match if it is:
    - An animatic for a DIFFERENT song in the musical
    - A reaction video (e.g. someone reacting to the song/animatic)
    - Just the original song audio with a static image
    - A cover of the song without an animation
    - A podcast, tier list, or discussion
    - Significantly longer than the official song (might contain long intros/outros or multiple songs)
    - Significantly shorter than the official song (might only be a partial cover)
    
    If it is a valid animatic, reply ONLY with the exact word "YES".
    If it is NOT a valid match, reply with "NO. " followed by a short, one-sentence reason why it is rejected.
    """
    
    try:
        result = subprocess.run(["kimi", "-p", prompt], capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Error from kimi CLI (code {result.returncode}): {result.stderr.strip()}")
            lower_title = title.lower()
            if "reaction" in lower_title or "reacts" in lower_title:
                return False, "Reaction keyword detected by fallback filter (CLI error)."
            return True, None
            
        answer = result.stdout.strip()
        
        if not answer:
            print(f"Empty response from kimi CLI. stderr: {result.stderr.strip()}")
            lower_title = title.lower()
            if "reaction" in lower_title or "reacts" in lower_title:
                return False, "Reaction keyword detected by fallback filter (Empty response)."
            return True, None
            
        # Remove any leading non-alphabet characters (like bullets, dashes, spaces)
        clean_answer = re.sub(r'^[^a-zA-Z]+', '', answer)
        
        if clean_answer.upper().startswith("YES"):
            return True, None
        elif clean_answer.upper().startswith("NO"):
            reason = clean_answer[2:].strip(" .:-")
            return False, reason if reason else "No reason provided."
        else:
            return False, answer if answer else "Unrecognized response format."
    except Exception as e:
        print(f"Error calling kimi CLI: {e}")
        # Fallback keyword check if CLI fails
        lower_title = title.lower()
        if "reaction" in lower_title or "reacts" in lower_title:
            return False, "Reaction keyword detected by fallback filter."
        return True, None

def fetch_videos_for_song(song, existing_video_ids, blacklist_data, song_blacklist, blacklist_ids):
    song_title = song["title"]
    target_duration = song.get("duration", "Unknown")
    target_duration_sec = parse_duration_to_seconds(target_duration)
    
    print(f"\nSearching for: {song_title}")
    # Enclose song_title and "epic the musical" in quotes to make YouTube search stricter
    query = f'ytsearch100:"{song_title}" "epic the musical" animatic'
    
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
    
    # Significant words from song title for pre-filtering
    stopwords = {"the", "and", "of", "in", "to", "a", "is", "for", "on", "with", "it", "my", "me", "you", "i"}
    song_words = set(w for w in re.findall(r'[a-z]+', song_title.lower()) if w not in stopwords and len(w) > 2)
    
    for line in lines:
        if not line:
            continue
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            continue
            
        video_id = data.get("id")
        
        # Skip duplicates and blacklisted videos
        if video_id in existing_video_ids or video_id in blacklist_ids:
            continue
            
        title = data.get("title", "")
        author = data.get("uploader", "")
        description = data.get("description", "")
        views = data.get("view_count", 0)
        video_duration = data.get("duration", 0)
        
        video_obj = {
            "videoId": video_id,
            "title": title,
            "author": author,
            "views": views,
            "duration": video_duration
        }

        # Auto-reject if video is more than 10 seconds shorter than the original song
        if target_duration_sec is not None and video_duration is not None and video_duration > 0:
            if video_duration < (target_duration_sec - 10):
                video_obj["rejectReason"] = f"Auto-rejected: Too short ({video_duration}s vs {target_duration_sec}s)"
                song_blacklist.append(video_obj)
                blacklist_ids.add(video_id)
                # Save blacklist progressively
                save_blacklist(blacklist_data)
                print(f"  [-] Auto-Rejected (Too short: {video_duration}s vs {target_duration_sec}s): {title}")
                continue

        # Pre-filter: Check if video title or description contains the song's significant words
        # This saves AI credits on videos that YouTube returned but clearly don't match the song
        vid_text = f"{title} {description}".lower()
        if song_words:
            matched_words = [w for w in song_words if w in vid_text]
            # Require at least 50% of significant words to match
            if len(matched_words) / len(song_words) < 0.5:
                video_obj["rejectReason"] = f"Auto-rejected: Missing song title keywords"
                song_blacklist.append(video_obj)
                blacklist_ids.add(video_id)
                save_blacklist(blacklist_data)
                print(f"  [-] Auto-Rejected (Missing title keywords): {title}")
                continue

        # Smart Filter
        is_valid, reason = is_valid_animatic(title, author, description, song_title, target_duration, video_duration)
        if is_valid:
            videos.append(video_obj)
            existing_video_ids.add(video_id)
            print(f"  [+] Added: {title} by {author}")
        else:
            video_obj["rejectReason"] = reason
            song_blacklist.append(video_obj)
            blacklist_ids.add(video_id)
            # Save blacklist progressively
            save_blacklist(blacklist_data)
            print(f"  [-] Rejected by AI: {title} (Reason: {reason})")
            
    return videos

def main():
    target_song_id = sys.argv[1] if len(sys.argv) > 1 else None
    
    songs = load_songs()
    if not songs:
        return
        
    blacklist_data = get_blacklist()
    
    for song in songs:
        if target_song_id and song.get("id") != target_song_id:
            continue
            
        if "videos" not in song:
            song["videos"] = []
            
        song_id = song.get("id")
        if song_id not in blacklist_data:
            blacklist_data[song_id] = []
            
        song_blacklist = blacklist_data[song_id]
        
        blacklist_ids = set()
        for item in song_blacklist:
            if isinstance(item, dict):
                blacklist_ids.add(item.get("videoId"))
            else:
                blacklist_ids.add(item)
        
        existing_video_ids = set(v["videoId"] for v in song["videos"])
        
        new_videos = fetch_videos_for_song(song, existing_video_ids, blacklist_data, song_blacklist, blacklist_ids)
        
        if new_videos:
            song["videos"].extend(new_videos)
            # Save progressively so we don't lose data if script crashes
            save_songs(songs)
            
        time.sleep(1) # Be nice to YouTube

if __name__ == "__main__":
    main()
