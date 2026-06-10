# Audio Clips for PlayAudio Tool

Place your .mp3 files in this folder. They will be served at `/audio/<filename>.mp3`.

The PlayAudio tool references clips by name (without extension). For example:
- A file named `auto_horn.mp3` is triggered with clipName: "auto_horn"
- A file named `welcome_jingle.mp3` is triggered with clipName: "welcome_jingle"

## File naming rules
- Use only letters, numbers, underscores, and hyphens
- No spaces or special characters
- Keep files small (under 2MB recommended for quick playback)
