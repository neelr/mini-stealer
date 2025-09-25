# Mini Stealer

Break thorugh the NYT Mini crossword puzzle, by sharing your crossword with your friends.

## Components

### Chrome Extension
Adds a share button to completed NYT Mini puzzles. When clicked, copies a link that lets others solve the same puzzle.

**Installation:**
1. Open `chrome://extensions/`
2. Enable Developer Mode
3. Click "Load unpacked" and select this directory
4. Complete any NYT Mini to see the share button

### Static Site (`/site`)
Playable crossword interface that reads puzzle data from URL parameters.

**Features:**
- NYT Mini-style interface
- Timer tracking
- Share your completion time
- Responsive design

## How It Works

1. Complete a puzzle on [NYT Mini](https://www.nytimes.com/crosswords/game/mini)
2. Click "Share with Mini Stealer" in the completion modal
3. Send the link to friends
4. They can solve the same puzzle and share their time

## Data Format

Puzzles are encoded as base64 URLs with this structure:
```javascript
{
  size: [width, height],
  words: [[number, x, y, direction, answer, clue], ...],
  black: [[x, y], ...]
}
```

See [`FORMAT.md`](FORMAT.md) for complete documentation.

## Deployment

The static site is hosted at [mini-stealer.surge.sh](https://mini-stealer.surge.sh)

---

*For educational purposes only*