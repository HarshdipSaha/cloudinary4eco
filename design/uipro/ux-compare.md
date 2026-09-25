## UI Pro Max Search Results
**Domain:** ux | **Query:** image comparison before after slider
**Source:** ux-guidelines.csv | **Found:** 3 results

### Result 1
- **Category:** Spatial UI
- **Issue:** Gaze Hover
- **Platform:** VisionOS
- **Description:** Elements should respond to eye tracking before pinch
- **Do:** Scale/highlight element on look
- **Don't:** Static element until pinch
- **Code Example Good:** hoverEffect()
- **Code Example Bad:** onTap only
- **Severity:** High

### Result 2
- **Category:** Performance
- **Issue:** Image Optimization
- **Platform:** All
- **Description:** Large images slow page load
- **Do:** Use appropriate size and format (WebP)
- **Don't:** Unoptimized full-size images
- **Code Example Good:** srcset with multiple sizes
- **Code Example Bad:** 4000px image for 400px display
- **Severity:** High

### Result 3
- **Category:** Responsive
- **Issue:** Image Scaling
- **Platform:** Web
- **Description:** Images should scale with container
- **Do:** Use max-width: 100% on images
- **Don't:** Fixed width images overflow
- **Code Example Good:** max-w-full h-auto
- **Code Example Bad:** width='800' fixed
- **Severity:** Medium

