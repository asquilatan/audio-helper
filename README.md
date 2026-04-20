# Tab Audio Helper

Control audio for the current tab with:

- Volume boost up to **500%**
- Voice boost (speech presence EQ)
- Bass boost
- Treble EQ
- Mono audio
- Limiter toggle to reduce clipping when heavily boosted
- One-click reset to **100%** defaults

## Install (Developer Mode)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `audio-helper`.
5. Pin **Tab Audio Helper** and open it on any normal website tab.

## Notes

- Settings are intentionally **temporary per current tab session**.
- Chrome system pages (`chrome://...`) are restricted and cannot be controlled.
- Uses **tabCapture + offscreen WebAudio**, so processing applies at tab stream level.
- If a tab is silent, changes are applied and will be heard once audio starts.
