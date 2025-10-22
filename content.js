// Mini Stealer - NYT Mini Crossword Scraper
console.log('🚀 Mini Stealer extension loaded');
console.log('📍 Current URL:', window.location.href);
console.log('📄 Page ready state:', document.readyState);

// Function to get the grid state from SVG
function getGridState() {
  const cells = document.querySelectorAll('.xwd__cell');

  // Sort cells by visual position (y, then x) since DOM order != visual order
  const sortedCells = Array.from(cells).sort((a, b) => {
    const rectA = a.querySelector('rect');
    const rectB = b.querySelector('rect');
    const yA = parseFloat(rectA.getAttribute('y'));
    const yB = parseFloat(rectB.getAttribute('y'));
    const xA = parseFloat(rectA.getAttribute('x'));
    const xB = parseFloat(rectB.getAttribute('x'));

    if (yA !== yB) return yA - yB;
    return xA - xB;
  });

  // Detect grid width by counting unique Y positions in first row
  const firstRowY = parseFloat(sortedCells[0].querySelector('rect').getAttribute('y'));
  const gridWidth = sortedCells.filter(cell => {
    const y = parseFloat(cell.querySelector('rect').getAttribute('y'));
    return Math.abs(y - firstRowY) < 1; // Same row (within 1px)
  }).length;

  const grid = [];

  sortedCells.forEach((cell, index) => {
    const rect = cell.querySelector('rect');
    const isBlack = rect?.classList.contains('xwd__cell--block') || false;

    // Get the letter and number from the appropriate text elements
    let letter = null;
    let number = null;

    // Numbers are in small font text elements (any font size)
    // They are NOT in hidden elements and contain 1-2 digits
    const allTexts = cell.querySelectorAll('text[data-testid="cell-text"]');
    allTexts.forEach(text => {
      // Skip hidden text elements
      if (text.classList.contains('xwd__cell--hidden')) return;

      const textContent = (text.textContent || '').trim();
      // Look for 1-2 digit numbers
      if (textContent.length <= 2 && /^\d+$/.test(textContent)) {
        number = parseInt(textContent);
      }
    });

    // Letters are in the hidden text elements
    const hiddenTexts = cell.querySelectorAll('text.xwd__cell--hidden');
    hiddenTexts.forEach(text => {
      const textContent = (text.textContent || '').trim();
      if (textContent.length === 1 && /^[A-Z]$/.test(textContent)) {
        letter = textContent;
      }
    });

    grid.push({
      index: index,
      x: index % gridWidth,
      y: Math.floor(index / gridWidth),
      isBlack: isBlack,
      letter: letter,
      number: number
    });
  });

  return grid;
}

// Function to get clues
function getClues() {
  const clues = {
    across: [],
    down: []
  };

  // Get across clues
  const clueLists = document.querySelectorAll('.xwd__clue-list--list');

  if (clueLists[0]) {
    clueLists[0].querySelectorAll('.xwd__clue--li').forEach(li => {
      const numberEl = li.querySelector('.xwd__clue--label');
      const textEl = li.querySelector('.xwd__clue--text');

      if (numberEl && textEl) {
        clues.across.push({
          number: parseInt(numberEl.textContent),
          text: textEl.textContent.trim()
        });
      }
    });
  }

  // Get down clues
  if (clueLists[1]) {
    clueLists[1].querySelectorAll('.xwd__clue--li').forEach(li => {
      const numberEl = li.querySelector('.xwd__clue--label');
      const textEl = li.querySelector('.xwd__clue--text');

      if (numberEl && textEl) {
        clues.down.push({
          number: parseInt(numberEl.textContent),
          text: textEl.textContent.trim()
        });
      }
    });
  }

  return clues;
}

// Function to trace word from starting position
function traceWord(grid, startX, startY, direction, gridWidth, gridHeight) {
  let word = '';
  let x = startX;
  let y = startY;

  while (x < gridWidth && y < gridHeight) {
    const cellIndex = y * gridWidth + x;
    const cell = grid[cellIndex];

    if (!cell || cell.isBlack) break;
    if (!cell.letter) break;

    word += cell.letter;

    if (direction === 0) { // Across
      x++;
    } else { // Down
      y++;
    }
  }

  return word;
}

// Convert NYT format to our format
function convertToOurFormat() {
  const grid = getGridState();
  const clues = getClues();
  const words = [];
  const blackSquares = [];

  // Calculate grid dimensions
  const gridWidth = Math.max(...grid.map(cell => cell.x)) + 1;
  const gridHeight = Math.max(...grid.map(cell => cell.y)) + 1;

  // Collect black squares
  grid.forEach(cell => {
    if (cell.isBlack) {
      blackSquares.push([cell.x, cell.y]);
    }
  });

  // Process across clues
  clues.across.forEach(clue => {
    // Find the cell with this number
    const startCell = grid.find(cell => cell.number === clue.number);
    if (startCell) {
      const answer = traceWord(grid, startCell.x, startCell.y, 0, gridWidth, gridHeight);
      if (answer) {
        words.push([
          clue.number,
          startCell.x,
          startCell.y,
          0, // Across
          answer,
          clue.text
        ]);
      }
    }
  });

  // Process down clues
  clues.down.forEach(clue => {
    // Find the cell with this number
    const startCell = grid.find(cell => cell.number === clue.number);
    if (startCell) {
      const answer = traceWord(grid, startCell.x, startCell.y, 1, gridWidth, gridHeight);
      if (answer) {
        words.push([
          clue.number,
          startCell.x,
          startCell.y,
          1, // Down
          answer,
          clue.text
        ]);
      }
    }
  });

  return {
    size: [gridWidth, gridHeight],
    words: words,
    black: blackSquares
  };
}

// Function to generate shareable link
function generateShareLink(puzzleData) {
  const shareData = {
    puzzle: puzzleData,
    time: 0 // We could extract the actual time if available
  };

  const jsonString = JSON.stringify(shareData);
  const base64 = btoa(jsonString);
  const urlEncoded = encodeURIComponent(base64);

  // Add dashes every 10 characters for readability
  const withDashes = urlEncoded.match(/.{1,10}/g).join('-');

  console.log('📦 Puzzle data:', puzzleData);
  console.log('🔤 Base64 length:', base64.length);
  console.log('🔗 URL encoded length:', urlEncoded.length);
  console.log('➖ With dashes length:', withDashes.length);

  return `https://mini.neelr.dev?data=${withDashes}`;
}

// Function to inject toolbar button
function injectToolbarButton() {
  console.log('🔧 Attempting to inject toolbar button...');

  // Check if button already exists
  if (document.getElementById('mini-stealer-toolbar-button')) {
    console.log('⚠️ Toolbar button already exists, skipping injection');
    return;
  }

  // Find the Rebus button
  const toolbarButtons = document.querySelectorAll('.xwd__tool--button');
  let rebusButton = null;

  toolbarButtons.forEach(button => {
    const buttonText = button.textContent.toLowerCase();
    if (buttonText.includes('rebus')) {
      rebusButton = button;
    }
  });

  if (!rebusButton) {
    console.log('❌ Rebus button not found, cannot inject toolbar button');
    return;
  }

  // Create toolbar button with same structure as other buttons
  const toolbarButton = document.createElement('li');
  toolbarButton.className = 'xwd__tool--button xwd__tool--texty';
  toolbarButton.id = 'mini-stealer-toolbar-button';

  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', 'Share');
  button.textContent = 'Share';

  button.addEventListener('click', () => {
    console.log('🎯 Toolbar share button clicked!');
    try {
      const puzzleData = convertToOurFormat();
      const shareLink = generateShareLink(puzzleData);

      // Get the time from timer
      const timerEl = document.querySelector('.timer-count');
      const timeText = timerEl ? timerEl.textContent : 'unknown time';

      // Create share text
      const shareText = `I completed the NYT Mini in ${timeText}!\nTry it yourself @ ${shareLink}`;

      // Copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';

        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy:', err);
        prompt('Copy this link to share:', shareText);
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Error generating share link. Make sure puzzle is complete!');
    }
  });

  toolbarButton.appendChild(button);

  // Insert before the Rebus button
  rebusButton.parentNode.insertBefore(toolbarButton, rebusButton);

  console.log('✅ Toolbar button successfully injected!');
}

// Function to inject button into completion modal
function injectShareButton() {
  console.log('🔍 Attempting to inject share button...');

  // Check if button already exists
  if (document.getElementById('mini-stealer-button')) {
    console.log('⚠️ Button already exists, skipping injection');
    return;
  }

  // Find the completion modal - try multiple selectors
  // Be more specific to avoid matching start modal
  const modalSelectors = [
    '.xwd__congrats-modal',
    '.xwd__modal--congrats',
    '.mini__congrats-modal',
    '[class*="congrats-modal"]',
    '[class*="congrats"][class*="modal"]',
    '.xwd__modal--body.mini__congrats-modal',
    '.pz-moment',
    '[class*="success"][class*="modal"]',
    '[class*="completion"]'
  ];

  let modal = null;
  for (const selector of modalSelectors) {
    modal = document.querySelector(selector);
    if (modal) {
      console.log(`✅ Found modal with selector: ${selector}`);
      break;
    }
  }

  if (!modal) {
    console.log('❌ No completion modal found. Tried selectors:', modalSelectors);
    // Log what we do see on the page
    console.log('📋 Available modal-like elements:',
      Array.from(document.querySelectorAll('[class*="modal"], [class*="congrats"], [class*="success"]'))
        .map(el => el.className));
    return;
  }

  // Find the button container specifically
  const buttonContainer = modal.querySelector('.xwd__modal--button-container.mini__congrats-modal--buttons-wrapper');

  if (buttonContainer) {
    console.log('✅ Found button container: xwd__modal--button-container mini__congrats-modal--buttons-wrapper');
  } else {
    // Fallback: try other selectors
    const actionSelectors = [
      '.xwd__modal--button-container',
      '.mini__congrats-modal--buttons-wrapper',
      '.xwd__congrats--actions',
      '[class*="button-container"]',
      '[class*="buttons-wrapper"]'
    ];

    let modalActions = null;
    for (const selector of actionSelectors) {
      modalActions = modal.querySelector(selector);
      if (modalActions) {
        console.log(`✅ Found action area with selector: ${selector}`);
        break;
      }
    }

    if (!modalActions) {
      console.log('⚠️ No action area found, appending to modal directly');
    }
  }

  // Create our button
  const button = document.createElement('button');
  button.id = 'mini-stealer-button';
  button.className = 'mini-stealer-btn';
  button.textContent = '🔗 Share with Mini Stealer';

  button.addEventListener('click', () => {
    console.log('🎯 Share button clicked!');
    try {
      const puzzleData = convertToOurFormat();
      const shareLink = generateShareLink(puzzleData);

      // Get the time if available
      const timerEl = document.querySelector('.xwd__timer--time, .timer-count');
      const timeText = timerEl ? timerEl.textContent : 'unknown time';

      // Create share text
      const shareText = `I completed the NYT Mini in ${timeText}!\nTry it yourself @ ${shareLink}`;

      // Copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        button.textContent = '✓ Copied to clipboard!';
        button.style.backgroundColor = '#4CAF50';

        setTimeout(() => {
          button.textContent = '🔗 Share with Mini Stealer';
          button.style.backgroundColor = '';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback: show the link
        prompt('Copy this link to share:', shareText);
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Error generating share link. Please try again.');
    }
  });

  // Insert after the button container
  const targetContainer = buttonContainer || modalActions;

  if (buttonContainer) {
    // Insert right after the button container
    console.log('📌 Inserting button after button container');
    buttonContainer.parentNode.insertBefore(button, buttonContainer.nextSibling);
  } else if (modalActions) {
    // Fallback: insert after modal actions
    console.log('📌 Inserting button after modal actions');
    modalActions.parentNode.insertBefore(button, modalActions.nextSibling);
  } else {
    // Last resort: append to modal
    console.log('📌 Appending button directly to modal');
    modal.appendChild(button);
  }

  console.log('✅ Button successfully injected!');
}

// Watch for completion modal
let observerCount = 0;
const observer = new MutationObserver((mutations) => {
  observerCount++;

  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // Element node
        // Check for congrats modal specifically (not start modal)
        const nodeClasses = (node.className || '').toLowerCase();

        // Only look for congrats-related modals, not start modals
        const isCongratsModal = nodeClasses.includes('congrats') ||
                                nodeClasses.includes('success') ||
                                nodeClasses.includes('completion');

        // Exclude start modals
        const isStartModal = nodeClasses.includes('start-modal') ||
                            nodeClasses.includes('xwd__start-modal');

        if (isCongratsModal && !isStartModal) {
          console.log(`🎊 Detected CONGRATS modal: ${node.className}`);
          setTimeout(injectShareButton, 100); // Small delay to ensure modal is fully rendered
        }

        // Also check children for congrats modals
        if (node.querySelector) {
          const congratsChild = node.querySelector('[class*="congrats"], [class*="success"], [class*="completion"]');
          if (congratsChild) {
            const childClasses = (congratsChild.className || '').toLowerCase();
            if (!childClasses.includes('start-modal')) {
              console.log(`🎊 Found CONGRATS child:`, congratsChild.className);
              setTimeout(injectShareButton, 100);
            }
          }
        }
      }
    });
  });

  // Periodically check if modal exists (in case it's shown/hidden rather than added/removed)
  if (observerCount % 10 === 0) {
    const modalCheck = document.querySelector('[class*="congrats"]:not([class*="start-modal"]), [class*="success"][class*="modal"]');
    if (modalCheck && !document.getElementById('mini-stealer-button')) {
      console.log('🔄 Periodic check found CONGRATS modal:', modalCheck.className);
      injectShareButton();
    }

    // Also check if toolbar exists but button hasn't been injected yet
    if (!document.getElementById('mini-stealer-toolbar-button')) {
      const toolbar = document.querySelector('.xwd__toolbar--tools');
      if (toolbar) {
        injectToolbarButton();
      }
    }
  }
});

// Start observing
console.log('👀 Starting MutationObserver...');
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class', 'style']
});

// Check every few seconds in case we miss the mutation
setInterval(() => {
  const modal = document.querySelector('[class*="congrats"]:not([class*="start-modal"]), [class*="success"][class*="modal"], .mini__congrats-modal');
  if (modal && !document.getElementById('mini-stealer-button')) {
    console.log('⏰ Interval check found CONGRATS modal:', modal.className);
    injectShareButton();
  }
}, 2000);

// Also add an event listener for when the game is completed
// NYT might trigger custom events
document.addEventListener('puzzleComplete', () => {
  console.log('🏁 Puzzle complete event detected!');
  setTimeout(injectShareButton, 500);
});

// Listen for visibility changes (modal might be hidden/shown)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    const modal = document.querySelector('[class*="congrats"]:not([class*="start-modal"])');
    if (modal && !document.getElementById('mini-stealer-button')) {
      console.log('👁️ Visibility change detected CONGRATS modal');
      injectShareButton();
    }
  }
});

// Try to inject toolbar button on page load
setTimeout(() => {
  injectToolbarButton();
}, 1000);

// Also try again after a delay in case toolbar loads slowly
setTimeout(() => {
  injectToolbarButton();
}, 3000);

// Log for debugging
console.log('✨ Mini Stealer ready - complete the puzzle to share!');
