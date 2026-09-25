## UI Pro Max Search Results
**Domain:** ux | **Query:** dense data table row selection keyboard
**Source:** ux-guidelines.csv | **Found:** 3 results

### Result 1
- **Category:** Responsive
- **Issue:** Table Handling
- **Platform:** Web
- **Description:** Tables can overflow on mobile
- **Do:** Use horizontal scroll or card layout
- **Don't:** Wide tables breaking layout
- **Code Example Good:** overflow-x-auto wrapper
- **Code Example Bad:** Table overflows viewport
- **Severity:** Medium

### Result 2
- **Category:** Data Entry
- **Issue:** Bulk Actions
- **Platform:** Web
- **Description:** Editing one by one is tedious
- **Do:** Allow multi-select and bulk edit
- **Don't:** Single row actions only
- **Code Example Good:** Checkbox column + Action bar
- **Code Example Bad:** Repeated actions per row
- **Severity:** Low

### Result 3
- **Category:** Sustainability
- **Issue:** Auto-Play Video
- **Platform:** Web
- **Description:** Autoplaying media consumes data and creates motion barriers
- **Do:** Prefer click-to-play; provide pause and captions; stop off-screen and honor reduced motion
- **Don't:** Auto-play high-resolution loops without pause or captions
- **Code Example Good:** <video controls preload="none"><track kind="captions" /></video>
- **Code Example Bad:** autoplay loop
- **Severity:** Medium

