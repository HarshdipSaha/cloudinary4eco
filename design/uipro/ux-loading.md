## UI Pro Max Search Results
**Domain:** ux | **Query:** loading skeleton progress streaming
**Source:** ux-guidelines.csv | **Found:** 3 results

### Result 1
- **Category:** Feedback
- **Issue:** Progress Indicators
- **Platform:** All
- **Description:** Show progress for multi-step processes
- **Do:** Step indicators or progress bar
- **Don't:** No indication of progress
- **Code Example Good:** Step 2 of 4 indicator
- **Code Example Bad:** No step information
- **Severity:** Medium

### Result 2
- **Category:** AI Interaction
- **Issue:** Streaming
- **Platform:** All
- **Description:** Waiting for full text is slow
- **Do:** Stream text response token by token
- **Don't:** Show loading spinner for 10s+
- **Code Example Good:** Typewriter effect
- **Code Example Bad:** Spinner until 100% complete
- **Severity:** Medium

### Result 3
- **Category:** Feedback
- **Issue:** Loading Indicators
- **Platform:** All
- **Description:** Loading feedback should match the expected wait and avoid flashing for near-instant work
- **Do:** Follow platform and component guidance; preserve layout focus and accessible busy status
- **Don't:** Apply one timing threshold to every operation or leave long waits unexplained
- **Code Example Good:** Stable skeleton or progress with aria-busy
- **Code Example Bad:** Flickering spinner or frozen UI
- **Severity:** High

