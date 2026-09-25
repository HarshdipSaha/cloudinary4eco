## UI Pro Max Search Results
**Domain:** ux | **Query:** error message recovery offline
**Source:** ux-guidelines.csv | **Found:** 3 results

### Result 1
- **Category:** Feedback
- **Issue:** Error Recovery
- **Platform:** All
- **Description:** Help users recover from errors
- **Do:** Provide clear next steps
- **Don't:** Error without recovery path
- **Code Example Good:** Try again button + help link
- **Code Example Bad:** Error message only
- **Severity:** Medium

### Result 2
- **Category:** Accessibility
- **Issue:** Error Messages
- **Platform:** All
- **Description:** Error messages must be announced
- **Do:** Use aria-live or role=alert for errors
- **Don't:** Visual-only error indication
- **Code Example Good:** role='alert'
- **Code Example Bad:** Red border only
- **Severity:** High

### Result 3
- **Category:** Forms
- **Issue:** Error Placement
- **Platform:** All
- **Description:** Each invalid field needs an inline error connected to that field
- **Do:** Show a specific error below the input and reference it with aria-describedby
- **Don't:** Show only a top-level error without identifying each invalid field
- **Code Example Good:** <input aria-describedby="email-error"><p id="email-error">Enter an email address</p>
- **Code Example Bad:** Red border or summary only
- **Severity:** High

