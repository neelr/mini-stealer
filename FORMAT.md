# Mini Stealer Crossword Format

## Data Structure

The crossword puzzles are encoded in a compact JavaScript object format:

```javascript
{
  size: [width, height],  // e.g., [5, 5] for a 5x5 grid
  words: [
    // Each word is an array with 6 elements:
    [number, x, y, direction, answer, clue],
    // ...more words
  ],
  black: [[x, y], ...]  // Array of black square coordinates
}
```

### Word Array Format

Each word in the `words` array contains:
- `number`: The clue number (e.g., 1, 2, 3...)
- `x`: Starting column position (0-indexed)
- `y`: Starting row position (0-indexed)
- `direction`: `0` for across, `1` for down
- `answer`: The solution word in uppercase (e.g., "MACRO")
- `clue`: The clue text (e.g., "Large-scale")

### Example Puzzle

```javascript
const puzzle = {
  size: [5, 5],
  words: [
    // Across clues
    [1, 0, 0, 0, "MACRO", "Large-scale"],
    [6, 0, 1, 0, "ALOHA", "Hawaiian greeting"],

    // Down clues
    [1, 0, 0, 1, "MACK", "Big ___ (McDonald's burger)"],
    [2, 1, 0, 1, "ALINE", "Adjust evenly"],
  ],
  black: [[4, 3], [0, 4]]  // Black squares at positions (4,3) and (0,4)
};
```

## Sharing Format

To share a puzzle, the data is encoded and passed via URL query string.

### Encoding Process

1. Create a share object with puzzle data and optional completion time:
```javascript
const shareData = {
  puzzle: puzzleObject,  // The puzzle data structure
  time: 125              // Optional: completion time in seconds
};
```

2. Convert to JSON and Base64 encode:
```javascript
const encoded = btoa(JSON.stringify(shareData));
```

3. Append to URL as query parameter:
```
https://mini-stealer.surge.sh?data=[encoded_string]
```

### Full Example

```javascript
// Original puzzle
const puzzle = {
  size: [5, 5],
  words: [
    [1, 0, 0, 0, "HELLO", "Greeting"],
    [1, 0, 0, 1, "HAPPY", "Joyful"],
  ],
  black: []
};

// Create share data with completion time
const shareData = {
  puzzle: puzzle,
  time: 95  // 1:35 completion time
};

// Encode
const encoded = btoa(JSON.stringify(shareData));

// Final URL
const shareUrl = `https://mini-stealer.surge.sh?data=${encoded}`;
```

### Decoding (on page load)

```javascript
const urlParams = new URLSearchParams(window.location.search);
const sharedData = urlParams.get('data');

if (sharedData) {
  try {
    const decoded = JSON.parse(atob(sharedData));
    const puzzle = decoded.puzzle;
    const timeTobeat = decoded.time;  // Optional

    // Load puzzle into game...
  } catch (e) {
    console.error('Invalid share data');
  }
}
```

## Important Notes

- Coordinates are 0-indexed (top-left is 0,0)
- Words can overlap (sharing letters at intersections)
- The `black` array is optional - if omitted, no black squares
- Answer validation happens by checking if a word's letters match at their positions
- Make sure words don't extend beyond the grid size boundaries