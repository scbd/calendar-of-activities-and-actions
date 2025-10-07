# Decisions Property Migration

## Overview

This document describes the migration from the `copDecision` property to a new `decisions` property in the activities data.

## Purpose

The `copDecision` property was consolidated into a new `decisions` property to:

- Support multiple decisions per activity (as an array)
- Use consistent identifiers from the COP decision terms
- Maintain backward compatibility by keeping the original `copDecision` property

## Changes Made

### 1. New Property: `decisions`

Each activity now has a `decisions` property that is an array of decision identifiers from `shared/data/cop-decision-terms.js`.

**Example:**

```javascript
{
  "copDecision": "15/6",  // Original property (preserved)
  "decisions": [           // New property
    "CAL-DECISION-15-6"
  ]
}
```

### 2. Mapping

The mapping from `copDecision` values to decision identifiers follows this pattern:

- `copDecision: "15/6"` → `decisions: ["CAL-DECISION-15-6"]`
- `copDecision: "NP-4/3"` → `decisions: ["CAL-DECISION-NP-4-3"]`
- `copDecision: "CP-11/1"` → `decisions: ["CAL-DECISION-CP-11-1"]`

### 3. Script Used

The migration was performed using the script: `scripts/add-decisions-property.mjs`

This script:

1. Imports activities from `shared/data/25-26-activities.js`
2. Imports COP decision terms from `shared/data/cop-decision-terms.js`
3. Creates a mapping from decision names to identifiers
4. Checks for any missing decisions in the cop-decision-terms.js file
5. Adds missing decisions if found
6. Updates each activity with the `decisions` property
7. Writes the updated data back to the files

## Statistics

- **Total activities:** 93
- **Activities with decisions:** 93
- **Total COP decision terms:** 34 (33 original + 1 added)
- **Missing decisions added:** 1 (CP11/7)

## Unique COP Decisions

The following 34 unique COP decisions were found and mapped:

1. NP-4/3
2. 15/6
3. 16/22
4. 16/19
5. 16/15
6. CP11/7 *(added during migration)*
7. 16/18
8. 16/11
9. 16/32
10. 16/12
11. NP-5/8
12. 16/16
13. 14/24
14. 16/31
15. 16/5
16. 16/4
17. 16/21
18. 16/33
19. 15/28
20. NP-5/4
21. NP-3/1
22. CP-11/1
23. 16/25
24. CP-10/9
25. 16/3
26. 15/11
27. CP-11/8
28. 16/34
29. 15/12
30. 16/13
31. 16/35
32. CP-11/3
33. 16/17
34. CP-11/7 *(already existed in cop-decision-terms.js)*

## Backward Compatibility

The original `copDecision` property has been **preserved** in all activities to ensure backward compatibility with existing code that may rely on this property.

## Future Considerations

- The `decisions` property is an array, allowing for activities to be linked to multiple decisions in the future
- Consider deprecating the `copDecision` property once all code has been updated to use `decisions`
- The cop-decision-terms.js file can be extended with additional decisions as needed

## Running the Script

To re-run the migration or update new activities:

```bash
node scripts/add-decisions-property.mjs
```

The script is idempotent and safe to run multiple times.
