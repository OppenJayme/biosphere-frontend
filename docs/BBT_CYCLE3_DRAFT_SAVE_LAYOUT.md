# BBT Cycle 3 - BB-SPC-01 draft-save click stability

User supplied a black-box report showing the first Save uncataloged draft click
doing nothing when the blur-triggered duplicate panel appeared above it. A second
click saved the draft with an automatically assigned accession. The report marks
the case Fail; that status is not automatically closed by this repair.

Reproduction against frontend develop `c712ad9`: the real SpecimenCoreForm and
production Tailwind CSS were bundled into an isolated Edge fixture. On pointer
down, leaving Common name starts the real duplicate-check component. Before
pointer up, Save moves. The baseline regression failed with
`create: blur-time duplicate checking moved Save before pointer-up`.
An initial fixture-build alias error was corrected before this reproduction;
it was test setup, not an application failure.

The application fix only moves SpecimenDuplicateCheck below the action buttons.
Its loading/result height can no longer displace Save during the click. Advisory
results remain visible and aria-live, and the existing post-save duplicate review
behavior is unchanged. No matcher, thresholds, backend, accession generation,
approved records or save policy changed.

`npm run test:draft-save:browser` checks real pointer down/up with delayed
synthetic Server Actions. For create and edit: loading, clear, found and
unavailable duplicate states must leave Save in place and dispatch exactly one
save; a still-pending duplicate request must not prevent saving. Keyboard Enter
submission is checked for both modes (10 scenarios total). Payload checks retain
the entered common name and blank accession. All network requests abort, no app
environment is loaded, and only the owned browser session is closed.

Existing form/duplicate regressions passed 20/20. This is frontend interaction
evidence, not a live accession-allocation or database persistence test. No live
record was created and no deployment occurred. The BBT operator should repeat
BB-SPC-01 once the reviewed fix is deployed, recording build and target.

The existing six duplicate-ordering browser scenarios, focused ESLint,
`next typegen` followed by `tsc --noEmit --incremental false`, and
`git diff --check` also passed. Dependencies were reused through worktree
junctions, not freshly installed. No application environment file was copied.
