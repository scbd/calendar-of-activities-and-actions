# Subsidiary Body / Protocol Mappings

This utility provides bidirectional mapping between subsidiary body/protocol identifiers used in filters and their corresponding subject identifiers in the Legal and Institutional Structure subject group.

## Background

In the calendar system, subsidiary bodies and protocols are represented in two ways:

1. **Filter Identifiers**: Used in the subsidiary body filter (e.g., `SBI`, `SBSTTA`, `CP`, `NP`)
2. **Subject Identifiers**: Used in the subject hierarchy as children of `CBD-SUBJECT-LEGAL-STRUCT` (e.g., `CBD-SUBJECT-SBI`, `CBD-SUBJECT-CPB`)

This utility provides functions to convert between these two representations.

## Mappings

| Subsidiary Body/Protocol | Filter ID | Subject ID |
|--------------------------|-----------|------------|
| Subsidiary Body on Implementation | SBI | CBD-SUBJECT-SBI |
| Subsidiary Body on Scientific, Technical and Technological Advice | SBSTTA | CBD-SUBJECT-SBSTTA |
| Cartagena Protocol on Biosafety | CP | CBD-SUBJECT-CPB |
| Nagoya Protocol on Access and Benefit-sharing | NP | CBD-SUBJECT-NPB |
| Article 8(j) | 8J | CBD-SUBJECT-8J |
| Conference of the Parties | COP | CBD-SUBJECT-COP |

## Usage

### Import

```typescript
import mapIdentifier, {
  subsidiaryBodyToSubject,
  subjectToSubsidiaryBody,
  getAllSubsidiaryBodyIdentifiers,
  getAllSubjectIdentifiers,
  isSubsidiaryBodyIdentifier,
  isSubjectIdentifier,
} from 'shared/utils/subsidiary-body-protocol-mappings';
```

### Convert Subsidiary Body to Subject

```typescript
// Convert filter identifier to subject identifier
const subjectId = subsidiaryBodyToSubject('SBI');
// Returns: 'CBD-SUBJECT-SBI'

const subjectId2 = subsidiaryBodyToSubject('CP');
// Returns: 'CBD-SUBJECT-CPB'

// Also works with full CAL-SUBSIDIARY-BODY-* identifiers
const subjectId3 = subsidiaryBodyToSubject('CAL-SUBSIDIARY-BODY-SBSTTA');
// Returns: 'CBD-SUBJECT-SBSTTA'
```

### Convert Subject to Subsidiary Body

```typescript
// Convert subject identifier to filter identifier
const filterId = subjectToSubsidiaryBody('CBD-SUBJECT-SBI');
// Returns: 'SBI'

const filterId2 = subjectToSubsidiaryBody('CBD-SUBJECT-CPB');
// Returns: 'CP'
```

### Bidirectional Mapping (Default Export)

```typescript
// The default export handles both directions automatically
const result1 = mapIdentifier('SBI');
// Returns: 'CBD-SUBJECT-SBI'

const result2 = mapIdentifier('CBD-SUBJECT-SBI');
// Returns: 'SBI'

// Works with protocols too
const result3 = mapIdentifier('CP');
// Returns: 'CBD-SUBJECT-CPB'

const result4 = mapIdentifier('CBD-SUBJECT-CPB');
// Returns: 'CP'
```

### Get All Available Identifiers

```typescript
// Get all subsidiary body filter identifiers
const subsidiaryBodies = getAllSubsidiaryBodyIdentifiers();
// Returns: ['SBI', 'SBSTTA', 'CP', 'NP', '8J', 'COP']

// Get all subject identifiers that map to subsidiary bodies
const subjects = getAllSubjectIdentifiers();
// Returns: ['CBD-SUBJECT-SBI', 'CBD-SUBJECT-SBSTTA', 'CBD-SUBJECT-CPB', 'CBD-SUBJECT-NPB', 'CBD-SUBJECT-8J', 'CBD-SUBJECT-COP']
```

### Check Identifier Type

```typescript
// Check if an identifier is a subsidiary body identifier
isSubsidiaryBodyIdentifier('SBI'); // true
isSubsidiaryBodyIdentifier('CBD-SUBJECT-SBI'); // false

// Check if an identifier is a subject identifier with a subsidiary body mapping
isSubjectIdentifier('CBD-SUBJECT-SBI'); // true
isSubjectIdentifier('SBI'); // false
isSubjectIdentifier('CBD-SUBJECT-ABS'); // false (not a subsidiary body subject)
```

## Use Cases

### Filtering by Subsidiary Body Selection

When a user selects a subsidiary body in the filter, convert it to the subject identifier for querying:

```typescript
import { subsidiaryBodyToSubject } from 'shared/utils/subsidiary-body-protocol-mappings';

const selectedSubsidiaryBodies = ['SBI', 'SBSTTA'];
const subjectFilters = selectedSubsidiaryBodies
  .map(body => subsidiaryBodyToSubject(body))
  .filter(Boolean); // Filter out undefined values

// subjectFilters: ['CBD-SUBJECT-SBI', 'CBD-SUBJECT-SBSTTA']
// Use these to filter documents by subject
```

### Displaying Subject Labels

When displaying subjects, convert subject identifiers back to their filter representations:

```typescript
import { subjectToSubsidiaryBody } from 'shared/utils/subsidiary-body-protocol-mappings';

const documentSubjects = ['CBD-SUBJECT-SBI', 'CBD-SUBJECT-ABS'];
const subsidiaryBodies = documentSubjects
  .map(subject => subjectToSubsidiaryBody(subject))
  .filter(Boolean);

// subsidiaryBodies: ['SBI']
// Note: CBD-SUBJECT-ABS doesn't map to a subsidiary body, so it's filtered out
```

### Syncing Filters with Subject Selections

If a user selects subjects that correspond to subsidiary bodies, update the subsidiary body filter:

```typescript
import { subjectToSubsidiaryBody, isSubjectIdentifier } from 'shared/utils/subsidiary-body-protocol-mappings';

const selectedSubjects = ['CBD-SUBJECT-SBI', 'CBD-SUBJECT-CPB', 'CBD-SUBJECT-ABS'];
const correspondingSubsidiaryBodies = selectedSubjects
  .filter(isSubjectIdentifier)
  .map(subjectToSubsidiaryBody)
  .filter(Boolean);

// correspondingSubsidiaryBodies: ['SBI', 'CP']
// CBD-SUBJECT-ABS is filtered out as it doesn't map to a subsidiary body
```

## Error Handling

All functions return `undefined` for unmapped or invalid identifiers:

```typescript
subsidiaryBodyToSubject('INVALID'); // undefined
subjectToSubsidiaryBody('CBD-SUBJECT-INVALID'); // undefined
mapIdentifier('UNKNOWN'); // undefined

// Empty/null inputs also return undefined
subsidiaryBodyToSubject(''); // undefined
subsidiaryBodyToSubject(null); // undefined
```

## Whitespace Handling

All functions automatically trim whitespace:

```typescript
subsidiaryBodyToSubject('  SBI  '); // 'CBD-SUBJECT-SBI'
subjectToSubsidiaryBody(' CBD-SUBJECT-SBI '); // 'SBI'
```
