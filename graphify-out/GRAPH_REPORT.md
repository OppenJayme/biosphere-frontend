# Graph Report - biosphere-frontend  (2026-08-27)

## Corpus Check
- Corpus is ~3,137 words - fits in a single context window. You may not need a graph.

## Summary
- 215 nodes · 232 edges · 25 communities (16 shown, 9 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.81)
- Token cost: 634,508 input · 0 output

## Community Hubs (Navigation)
- Related Systems & Tech Stack
- Project Scope & Business Rules
- TypeScript Compiler Config
- Dev Tooling Dependencies
- Package Scripts & Core Deps
- Frontend Architecture Notes
- Developer Interface & Onboarding
- Public-Facing Interfaces
- Next.js Type References
- AR & Exhibit Related Work
- Visitor Communication Related Work
- Root Layout Component
- Vercel & Scaffold Icons
- README Content
- Reports & Export
- ESLint Config File
- Next Config File
- Next.js Branding
- PostCSS Config File
- Audit Logs Page
- Storage Location Management
- File Icon Asset
- Window Icon Asset

## God Nodes (most connected - your core abstractions)
1. `BioSphere` - 36 edges
2. `compilerOptions` - 16 edges
3. `Frontend Architecture Notes` - 14 edges
4. `Static Exhibit Under-Communication Problem` - 8 edges
5. `include` - 7 edges
6. `Unstructured Visitor Request/Inquiry Communication Problem` - 6 edges
7. `scripts` - 5 edges
8. `Manual, Offline-Fragile Inventory Management Problem` - 5 edges
9. `Developer Page` - 5 edges
10. `lib` - 4 edges

## Surprising Connections (you probably didn't know these)
- `BR-16 Offline Position` --semantically_similar_to--> `Open Items / Not Yet Decided`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/frontend-architecture.md
- `NestJS Module Mirroring Pattern` --conceptually_related_to--> `NestJS Backend (modular monolith)`  [INFERRED]
  docs/frontend-architecture.md → CLAUDE.md
- `build-and-lint job` --shares_data_with--> `npm scripts: dev/build/start/lint`  [INFERRED]
  .github/workflows/ci.yml → CLAUDE.md
- `Frontend Architecture Notes` --cites--> `BioSphere-SRS.pdf`  [EXTRACTED]
  docs/frontend-architecture.md → CLAUDE.md
- `Frontend Architecture Notes` --cites--> `BioSphere-Final-Capstone-1.pdf`  [EXTRACTED]
  docs/frontend-architecture.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Three Audiences Implemented via Next.js Route Groups** — claude_md_curator_pwa, claude_md_public_website, claude_md_restricted_developer_interface, docs_frontend_architecture_route_groups [INFERRED 0.85]
- **Two-Layer Auth Checking Flow** — docs_frontend_architecture_proxy_ts, docs_frontend_architecture_session_ts, docs_frontend_architecture_two_layer_auth [EXTRACTED 1.00]
- **Key Business Rules Set** — claude_md_br10_public_approval, claude_md_br11_storage_confidentiality, claude_md_br16_offline_position, claude_md_br18_faq_boundary, claude_md_br21_22_outbound_email_boundary, claude_md_br12_developer_restriction [EXTRACTED 1.00]
- **Related Systems Feature Comparison (Table 2)** — docs_biosphere_final_capstone_1_symbiota, docs_biosphere_final_capstone_1_arctos, docs_biosphere_final_capstone_1_specify_7, docs_biosphere_final_capstone_1_pastperfect_museum_software, docs_biosphere_final_capstone_1_skinsofts_s_museum, docs_biosphere_final_capstone_1_argus, docs_biosphere_final_capstone_1_museum_space, docs_biosphere_final_capstone_1_jakarta_textile_museum_system, docs_biosphere_final_capstone_1_tuklas, docs_biosphere_final_capstone_1_animal_safari_ar, docs_biosphere_final_capstone_1_assemblrworld, docs_biosphere_final_capstone_1_inselect, docs_biosphere_final_capstone_1_biosphere [EXTRACTED 1.00]
- **Three Museum Problems Motivating BioSphere's Core Components** — docs_biosphere_final_capstone_1_inventory_collection_management_problem, docs_biosphere_final_capstone_1_unstructured_visitor_communication_problem, docs_biosphere_final_capstone_1_static_exhibit_undercommunication_problem, docs_biosphere_final_capstone_1_biosphere [EXTRACTED 1.00]
- **BioSphere Data Persistence Stack** — docs_biosphere_final_capstone_1_database_management, docs_biosphere_final_capstone_1_postgresql, docs_biosphere_final_capstone_1_object_relational_mapping, docs_biosphere_final_capstone_1_prisma [INFERRED 0.75]
- **Restricted Developer Interface & AR Asset Deployment Workflow** — docs_biosphere_srs_restricted_developer_interface, docs_biosphere_srs_developer_page, docs_biosphere_srs_onboard_user_modal, docs_biosphere_srs_edit_user_modal_developer, docs_biosphere_srs_new_ar_asset_modal, docs_biosphere_srs_edit_ar_asset_modal, docs_biosphere_srs_br_12 [INFERRED 0.85]
- **Public-Facing Content Approval & Confidentiality Boundary** — docs_biosphere_srs_public_qr_exhibit_interface, docs_biosphere_srs_faq_assistant_interface, docs_biosphere_srs_br_10, docs_biosphere_srs_br_11, docs_biosphere_srs_br_18 [INFERRED 0.80]
- **Curator Account Lifecycle Management (Curator PWA + Developer Interface)** — docs_biosphere_srs_user_management_page, docs_biosphere_srs_add_curator_modal, docs_biosphere_srs_account_status_change_modal, docs_biosphere_srs_onboard_user_modal, docs_biosphere_srs_edit_user_modal_developer [INFERRED 0.75]

## Communities (25 total, 9 thin omitted)

### Community 0 - "Related Systems & Tech Stack"
Cohesion: 0.06
Nodes (43): Abo Zeid, 2022, Arctos, Argus, Authentication and Role-Based Access Control (RBAC), Backend Development, Backup and Recovery, BioSphere, Cicero et al., 2024 (+35 more)

### Community 1 - "Project Scope & Business Rules"
Cohesion: 0.08
Nodes (30): build-and-lint job, Frontend CI workflow, generate-agent-files.js, Next.js 16 Breaking-Changes Docs Rule, 3D Asset Pipeline (Tripo 3D / Meshy AI), BioSphere (product), BR-10 Public Approval, BR-11 Storage Confidentiality (+22 more)

### Community 2 - "TypeScript Compiler Config"
Cohesion: 0.11
Nodes (19): dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules (+11 more)

### Community 3 - "Dev Tooling Dependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 4 - "Package Scripts & Core Deps"
Cohesion: 0.12
Nodes (15): next, dependencies, next, react, react-dom, name, private, scripts (+7 more)

### Community 5 - "Frontend Architecture Notes"
Cohesion: 0.21
Nodes (13): BioSphere-Final-Capstone-1.pdf, BioSphere-SRS.pdf, lib/api-client.ts apiFetch(), Frontend Architecture Notes, features/ directory (mirrors backend modules), NestJS Module Mirroring Pattern, Open Items / Not Yet Decided, proxy.ts (optimistic auth gate) (+5 more)

### Community 6 - "Developer Interface & Onboarding"
Cohesion: 0.27
Nodes (10): Account Status Change Modal, Add Curator Modal (User Management), BR-12: Developer Restriction, Developer Page, Edit AR Asset Modal, Edit User Modal (Developer), New AR Asset Modal, Onboard User Modal (Developer) (+2 more)

### Community 7 - "Public-Facing Interfaces"
Cohesion: 0.20
Nodes (10): BR-10: Public Approval, BR-11: Storage Confidentiality, BR-18: FAQ Boundary, Camera Permission Request Policy, Section 3.1.6: Controlled Knowledge-Based FAQ Assistant Interface, Section 3.1.5: Public QR Exhibit Interfaces, Public Submissions Management Page, QR Exhibit Page (Without AR Action) (+2 more)

### Community 8 - "Next.js Type References"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 9 - "AR & Exhibit Related Work"
Cohesion: 0.29
Nodes (8): Animal Safari AR, AssemblrWorld, Garcia, 2020, HARA (Mobile AR History App), Shi & Zhao, 2024, Spadoni et al., 2022, Static Exhibit Under-Communication Problem, Tuklas

### Community 10 - "Visitor Communication Related Work"
Cohesion: 0.29
Nodes (7): Anand et al., 2023, Ankor et al., 2024, Jirapure et al., 2024, Parvathi et al., 2024, Rathore et al., 2022, Ticketless, Unstructured Visitor Request/Inquiry Communication Problem

### Community 11 - "Root Layout Component"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 12 - "Vercel & Scaffold Icons"
Cohesion: 0.50
Nodes (4): create-next-app Default Scaffold, globe.svg (Globe Icon), Vercel (deployment platform / create-next-app publisher), Vercel Logo (vercel.svg)

### Community 13 - "README Content"
Cohesion: 0.50
Nodes (3): create-next-app bootstrap, next/font Geist optimization, Vercel deployment

## Knowledge Gaps
- **102 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+97 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BioSphere` connect `Related Systems & Tech Stack` to `AR & Exhibit Related Work`, `Visitor Communication Related Work`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `Frontend Architecture Notes` connect `Frontend Architecture Notes` to `Project Scope & Business Rules`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dev Tooling Dependencies` to `Package Scripts & Core Deps`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _102 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Related Systems & Tech Stack` be split into smaller, more focused modules?**
  _Cohesion score 0.05758582502768549 - nodes in this community are weakly interconnected._
- **Should `Project Scope & Business Rules` be split into smaller, more focused modules?**
  _Cohesion score 0.08064516129032258 - nodes in this community are weakly interconnected._
- **Should `TypeScript Compiler Config` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._