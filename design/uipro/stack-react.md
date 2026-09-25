## UI Pro Max Stack Guidelines
**Stack:** react | **Query:** accessible dialog tabs focus
**Source:** stacks/react.csv | **Found:** 3 results

### Result 1
- **Category:** Accessibility
- **Guideline:** Manage focus properly
- **Description:** Handle focus for modals dialogs
- **Do:** Focus trap in modals return focus on close
- **Don't:** No focus management
- **Code Good:** useEffect to focus input
- **Code Bad:** Modal without focus trap
- **Severity:** High
- **Docs URL:** https://react.dev/reference/react/useRef
- **Applies To:** react 19.2.x
- **Status:** active
- **Verified At:** 2026-08-13

### Result 2
- **Category:** Patterns
- **Guideline:** Compound components
- **Description:** Related components sharing state
- **Do:** Tab + TabPanel sharing context
- **Don't:** Prop drilling between related
- **Code Good:** <Tabs><Tab/><TabPanel/></Tabs>
- **Code Bad:** <Tabs tabs={[]} panels={[...]}/>
- **Severity:** Low
- **Docs URL:** 
- **Applies To:** react 19.2.x
- **Status:** active
- **Verified At:** 2026-08-13

### Result 3
- **Category:** Testing
- **Guideline:** Use testing-library queries
- **Description:** Use accessible queries
- **Do:** getByRole getByLabelText
- **Don't:** getByTestId for everything
- **Code Good:** getByRole('button')
- **Code Bad:** getByTestId('submit-btn')
- **Severity:** Medium
- **Docs URL:** https://testing-library.com/docs/queries/about#priority
- **Applies To:** react 19.2.x
- **Status:** active
- **Verified At:** 2026-08-13

