# DiaGraph

Product website for a connected medical knowledge graph for patients and doctors. Bilkent University CS 491/492, 2026–2027. Built with Next.js; no medical backend.

```bash
npm ci
npm run dev
npm run lint
npm run build
```

## Pages and scope

- `/`: product, fictional walkthrough, agent workflows, sources, evaluation and team.
- `/privacy`: privacy approach for the product in development.
- `/project`: academic overview, documents and repository links.

Content is based on the [project brief](https://docs.google.com/document/d/1XvnjB-F8EYGePmNms8QoD052MrQVGYSTBpURIPuRWoE/edit), with the user's product-copy revisions. The course's [deliverables guide](https://www.cs.bilkent.edu.tr/~cs4912/current/CS491_deliverables.html) informed the separate Project page. Its heading is older than the current 2026–27 main course page. Report links should be added as files become available; no reports are fabricated or marked complete.

The interactive walkthrough contains fictional records and predetermined copy, not clinical inference. The agent animation illustrates the planned information flow and clinician approval gate. All medical capabilities are in development; no evaluation results or regulatory approval are claimed.

A single continuous brain/body/graph animation follows illustration space in the layout. Transparent rendering and soft particle fading keep text clear without opaque cover panels. See `DESIGN.md` for layout, animation and interaction details.

## Team

Ali Şen, Asya Ünal, Bilgehan Akın, Bora Balcı, Elif Su Temirel.

Supervisor: Cevdet Aykanat. Innovation expert: Can Koyuncu.

Changes are local until explicitly published. Check hosting configuration before deployment. The existing Next.js 16.4.0 dependency reports a security advisory; upgrade separately before deployment.
