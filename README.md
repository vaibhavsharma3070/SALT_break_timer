# Mindful Break Timer

A focused work timer with mindful break prompts, session history, background customization, and browser notifications.

## Running

### Option A — Direct (limited)
Double-click `index.html` or drag it into any browser.
> ⚠️ Background image picker and notifications won't work on `file://`. Everything else does.

### Option B — Python server (recommended)
Requires Python 3.12+
```bash
uv run main.py
```

Opens `http://localhost:8001` automatically in your browser. All features work.

If you don't have `uv`:
```bash
python main.py
```

## Features
- Configurable work / break durations
- Auto-starts break timer when work session ends
- Random mindful activity suggestion on each break
- Browser notification when work ends and when break ends
- Session history persisted across reloads (`localStorage`)
- Custom background image with glass effect (persists across reloads)

## Files
```
main.py        — local Python server, run this to start
index.html     — app markup
style.css      — styles
app.js         — timer logic, notifications, persistence
```