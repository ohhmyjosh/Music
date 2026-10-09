# Josh-Fy manual test checklist

The automated harness drives headless desktop Chrome. It cannot hear audio, and
it cannot stand in for a phone, Safari, a lock screen, Bluetooth or the Windows
tray. This checklist covers those. Run it on a real device and **listen**: a
passing row means you heard the music, not that the progress bar moved.

Mark each row ✅ / ❌ and write down the device, OS and browser version.

## 0. Before you start

- Use a fresh profile or a private window for the first pass (no old queue).
- Headphones or speakers on, volume up.
- Note the build: Settings → About, or the commit you deployed.

## 1. Desktop Chrome (Windows / macOS)

| # | Do | Expect |
|---|----|--------|
| 1.1 | Open the app, click a song in **Quick picks** | Music audible within ~2s |
| 1.2 | Search "arijit singh", press Enter, click the first song | Plays; the search list becomes the queue |
| 1.3 | Open an album, press **Play** | Track 1 plays; Up next shows the album |
| 1.4 | Open an artist, press **Radio** | Plays; Up next fills with ~30 songs |
| 1.5 | Open a playlist, press **Shuffle** | Plays a random song; shuffle icon lit |
| 1.6 | Open Now Playing → **Related**, click a song | That song plays |
| 1.7 | Copy a song's share link (⋮ → Share), open it in a new tab | Song loads and plays, Now Playing opens |
| 1.8 | Next / Previous (button, Shift+N / Shift+P, keyboard media keys) | Track changes each time; Previous 3s+ in restarts the song |
| 1.9 | Space pauses/resumes; ←/→ seek 10s; drag the progress bar | Audio follows exactly; no blips |
| 1.10 | Volume slider, M to mute/unmute | Audible level changes; mute is silent |
| 1.11 | Repeat → all; skip to the last song; let it end | Wraps to the first song |
| 1.12 | Repeat → one; let a song end | Same song restarts |
| 1.13 | Autoplay on, play a single song and let it end | A related song follows without a gap of more than a few seconds |
| 1.14 | Play a song, wait 30s, reload the page | Same song, paused, at ~the same position; Play resumes from there |
| 1.15 | Click five different songs quickly in a row | The **last** one plays; nothing else plays over it |
| 1.16 | Turn Wi-Fi off mid-song for ~20s, then back on | Music continues or resumes at the same spot within ~15s; no skipping |
| 1.17 | Turn Wi-Fi off for 2 minutes | After ~45s: paused with "Lost the connection"; Play after reconnecting resumes at the same spot |
| 1.18 | ⋮ → Download on 3 songs | Menu shows "Downloading… N%"; each ends with "available offline" |
| 1.19 | Turn Wi-Fi off; Library → Downloads; play each | All three play |
| 1.20 | Library → Downloads → Import from device; pick an MP3 and a FLAC/M4A | Both listed and both play |
| 1.21 | Play an imported file, then a streamed song | Switches cleanly |
| 1.22 | ⋮ → Remove from this device on an imported file | Row disappears |
| 1.23 | Settings → Music visualizer ON; Now Playing → Visualizer | Bars move with the music (stop when you pause) |
| 1.24 | Toggle the visualizer OFF mid-song | Music keeps playing from the same spot (a sub-second blip is acceptable) |
| 1.25 | Lock the screen / switch apps for 1 min with the visualizer ON | Music never goes silent |
| 1.26 | Windows: volume flyout / macOS: Control Center | Title, artist and artwork shown; play/pause/next work |

## 2. Android Chrome (installed PWA and in a tab)

| # | Do | Expect |
|---|----|--------|
| 2.1 | Rows 1.1–1.7 by tapping | Each plays on the **first** tap |
| 2.2 | Lock the phone while playing for 5 min | Music continues; lock screen shows the song and controls |
| 2.3 | Lock-screen next/previous/pause | Work; the app reflects them when reopened |
| 2.4 | Unplug headphones / disconnect Bluetooth mid-song | Music pauses and the app shows Play (not Pause) |
| 2.5 | Switch to another app that plays audio, come back | The app shows paused; Play resumes |
| 2.6 | Mobile data → airplane mode → back during a song | Same as 1.16 |
| 2.7 | Download 3 songs, airplane mode, play them | All play |
| 2.8 | Settings → Music visualizer is **OFF** by default | It is |
| 2.9 | Turn it ON, play, lock the phone for 2 min | Music never goes silent. **If it does, record it: the visualizer must stay off by default on phones.** |
| 2.10 | Rotate the phone; open and close Now Playing with the back gesture | Layout holds; back closes the player, not the app |

## 3. iOS Safari (tab and Add to Home Screen)

iOS only starts sound from a direct tap, and suspends Web Audio in the
background. Expect these rules and check each one.

| # | Do | Expect |
|---|----|--------|
| 3.1 | Tap a song in Quick picks | Plays on the first tap |
| 3.2 | Reload with a queue restored, then tap Play | Plays (the restored song never starts by itself) |
| 3.3 | Open a share link `/watch?v=…` in Safari | Song loads; if it doesn't start, the Play button shows **Play** (not Pause) and one tap starts it |
| 3.4 | Let a song end with Autoplay on, screen **on** | Next song starts by itself |
| 3.5 | Same with the screen **locked** | Record whether the next song starts. (iOS may block it; the app must at least show the right state) |
| 3.6 | Lock screen / Control Center controls | Title + artwork shown; play/pause/next work |
| 3.7 | Phone call or Siri interrupts playback, then ends | App shows paused; Play resumes |
| 3.8 | Silent switch ON | Note whether audio plays (iOS treats web audio as media; expected to play) |
| 3.9 | Downloads + airplane mode (rows 1.18–1.19) | Downloaded songs play offline |
| 3.10 | Visualizer OFF by default; turn ON, lock for 2 min | Music never goes silent. If it does, record it |
| 3.11 | Volume slider | iOS ignores web volume; the hardware buttons must still work |

## 4. Windows desktop overlay (Electron)

Build and start: `npm run desktop` from the repo root (it builds the web app
into `dist/` and launches the overlay app).

| # | Do | Expect |
|---|----|--------|
| 4.1 | Launch | Josh-Fy window opens; tray icon appears; widget card in the bottom-right |
| 4.2 | Play a song in the Josh-Fy window | Bottom strip reacts to **this** music only; widget shows title, artist, artwork |
| 4.3 | Play a YouTube video in another app with Josh-Fy paused | Strip stays still (it never captures system audio) |
| 4.4 | Click through the strip onto a desktop icon / taskbar | Clicks reach what's underneath |
| 4.5 | Widget play/pause, next, previous | The Josh-Fy window obeys each one |
| 4.6 | Josh-Fy Settings → Music visualizer OFF | Strip disappears; widget still shows the song and its buttons still work |
| 4.7 | Tray → Turn visualizer OFF / ON | Strip hides / shows |
| 4.8 | Tray → Position → Top of screen / Bottom | Strip moves; label flips side |
| 4.9 | Tray → Height → Slim / Medium / Tall | Strip height changes |
| 4.10 | Tray → Intensity → Subtle / Normal / Bold | Brightness and bar height change |
| 4.11 | Tray → Mini widget → Show widget off/on; Compact bar; sizes | Widget hides/shows and restyles |
| 4.12 | Second monitor connected | A strip on every monitor; unplugging one doesn't break the other |
| 4.13 | Close the Josh-Fy window (X) | Window hides to the tray; strip + widget keep running; music keeps playing |
| 4.14 | Click the tray icon | Window comes back with the same song |
| 4.15 | Tray → Quit, relaunch | Settings above are remembered |
| 4.16 | Full-screen game or video | Note whether the strip shows over it (it is set to) and whether that's wanted |
| 4.17 | Tray → Start with Windows, reboot | App starts in the tray |
