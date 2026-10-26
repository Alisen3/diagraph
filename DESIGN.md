# DiaGraph website

## Direction

A product website with an editorial black/white palette, Inter typography, violet actions and warm amber labels. Preserve the brain → body → graph identity while giving every paragraph a quiet, readable background. Body copy uses weight 300 rather than the previous 200.

## Pages

- `/`: product introduction, patient and doctor benefits, a fictional interactive record walkthrough, agent workflows, linked knowledge sources, plain-language evaluation goals, team and closing.
- `/privacy`: development approach, consent, view boundaries, provenance and review before real-world use. It does not claim regulatory certification or a launched health-data service.
- `/project`: academic overview, project brief, repository, course link, report publication area and team. No fabricated report downloads or completion statuses.

The course's linked deliverables guide asks the website to provide team information, reports and repository links. It puts the development plan in the analysis report, rather than requiring a homepage timeline. The linked guide has an older Fall 2024 heading; the main course page says Fall 2026. Checked 26 October 2026:
https://www.cs.bilkent.edu.tr/~cs4912/current/CS491_deliverables.html
https://www.cs.bilkent.edu.tr/~cs4912/current/CS491.html

## Scroll animation and readability

`particle-scene.tsx` uses one transparent, fixed Three.js canvas. The original brain/body/graph forms remain the visual identity. Scroll positions are derived from real illustration anchors in the layout, so the object travels between columns and settles beside the copy. On narrow screens the same anchors stack in document flow.

There are no opaque backgrounds or box shadows on copy. The particle shader fades out within a 72px feather around readable content, protecting paragraphs during transitions without hard rectangular cutouts. Full-width reading sections gently quiet the scene; the renderer is continuous rather than remounted per section. The How it works introduction has a dedicated graph area, followed by the existing interactive workflow.

Particle outlines are finer and pointer response is restrained. Decorative floating labels are removed; the actual workflow carries its own meaningful labels. Body → graph links the patient's history to the doctor's connected evidence view.

The pause control freezes ambient particle movement without resetting its phase. Reduced-motion preferences are observed live, remove ambient movement/scattering, and render on layout/scroll changes. Rendering stops in hidden tabs. ResizeObserver keeps anchor positions correct when content changes. The renderer, observers and listeners are cleaned up on route changes; Privacy and Project do not mount a canvas.

## Agent workflow

`agent-graph.tsx` is an explanatory interaction, not a simulation of medical outputs. Each task has four named stages with matching highlighted connections:

- Reason: read history → trace evidence → suggest next steps → clinician review.
- Monitor: read dated results → compare over time → surface the change → doctor review.
- Curate: gather evidence → propose a connection → clinician approval → update the graph after approval.

The curation return edge is highlighted only at the approval-completed stage. Selecting a step pauses playback; role controls, playback and individual steps are keyboard accessible. Automatic advancement only runs while visible, and is disabled under reduced motion.

## Interactive example

`case-demo.tsx` uses four fictional records: a consultation, lab report, prescription and follow-up. Users add records, inspect their fictional sources and switch between patient and doctor views. There are no disease-specific scenarios, diagnostic percentages or fabricated model outputs. The entire walkthrough is labelled as an example.

## Shared components

`site-chrome.tsx` owns the header/footer and SVG icons. `project-data.ts` owns team and external resource links. `motion.tsx` supplies theme switching, heading reveals and team navigation. Source names link directly to their maintainers without lengthy database descriptions or implied partnerships.
