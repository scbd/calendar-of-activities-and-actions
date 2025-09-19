# Phase 5: Activities & Actions Index (No Pre-Merge)

This directory contains detailed task prompts for Phase 5 of the CBD Calendar of Activities & Actions project.

## Phase 5 Overview

**Goal**: Index Activities & Actions from the Markdown table(s) as a separate collection with a lightweight search index. Do not globally merge with meetings yet. Provide loose link fields to enable query-time reconciliation.

## Task Structure

### Task 0: Define ActivitiesActions Schema (`t0.md`)
- Define comprehensive schema with minimum required fields
- Add provenance tracking (sourcePath, rowNumber)
- Include loose-link hints for future query-time reconciliation
- Establish TypeScript interfaces and validation

### Task 1: Implement Build Step with Activities & Actions Outputs (`t1.md`)
- Build pipeline that outputs `public/data/activities-actions.json`
- Generate `public/data/activities-actions.index.json` with token maps
- Integrate with existing Nitro task system
- Normalize data and create stable hash IDs

### Task 2: Index Contents and Pre-compute Facets (`t2.md`)
- Implement tokenization for titles, COP decisions, and related documents
- Pre-compute facet value frequency maps for UI filtering
- Optimize index structure for performance
- Create inverted index for fast searching

### Task 3: Size Check and Pipeline Updates (`t3.md`)
- Ensure index file < 30% of Activities & Actions payload size
- Update pipeline to emit both files without global merge
- Implement size monitoring and optimization
- Maintain separation from meetings data

### Task 4: Unit Tests for Tokenization and Index Validation (`t4.md`)
- Comprehensive unit testing for tokenization algorithms
- Validate index lookup correctness
- Test facet map integrity and calculations
- Schema validation and performance testing

## Acceptance Criteria (from Roadmap)

- `public/data/activities-actions.index.json` present and postings lookup returns expected record ids for sample tokens
- `public/data/activities-actions.json` present with normalized records and loose-link fields
- Index enables fast filtering of Activities & Actions without rescanning the full dataset and without dependency on meeting reindex

## Key Design Principles

1. **Separation of Concerns**: Activities & Actions remain independent from meetings data
2. **Performance First**: Index designed for client-side filtering performance
3. **Future Compatibility**: Loose-link hints prepare for eventual query-time reconciliation
4. **Size Efficiency**: Index size constrained to ensure fast loading
5. **Type Safety**: Comprehensive TypeScript definitions throughout

## Context Files

- `.github/requirements/index.md` - Project scope and slice definition
- `.github/requirements/roadmap.md` - Complete Phase 5 requirements
- `shared/data/2024-12-01.md` - Sample Activities & Actions data
- Existing pipeline components in `server/tasks/`

## Dependencies Between Tasks

```
t0 (Schema) → t1 (Build Step) → t2 (Indexing) → t3 (Integration) → t4 (Testing)
                     ↓              ↓              ↓              ↓
                   Types        Index Logic    Size Control    Validation
```

Each prompt is designed to be comprehensive and actionable, providing detailed implementation guidance, acceptance criteria, and additional information requirements to ensure successful task completion.