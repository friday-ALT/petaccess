# Pet Access V2 — Product Strategy & Technical Blueprint

**Version:** 2.0 · June 2025  
**Positioning:** The UK's pet health operating system — not an appointment portal.

---

## 1. Executive Summary

Pet Access V1 is a polished **veterinary portal demo**: marketing site + owner/vet/admin shells with static data. It competes visually with clinic booking tools but lacks the **lifecycle depth**, **automation**, and **network effects** that create defensibility.

**V2 transforms Pet Access into a pet health ecosystem** spanning prevention, care delivery, records, insurance, emergencies, and family coordination — with AI as an explainability layer (never a replacement for veterinary judgment).

**North-star metric:** Weekly active households with ≥1 preventive action completed (vaccination booked, care plan step done, or AI-assisted record understood).

---

## 2. UX Audit (V1 → V2)

| Area | V1 state | Friction / gap | V2 target |
|------|----------|----------------|-----------|
| **Onboarding** | Single signup modal; instant demo portal | No clinic linking, no pet import, no consent flow | 90-second guided setup: pets → clinic → care plan preview |
| **Booking** | Full modal form (~6 fields) | >30s; no smart defaults | **Quick Book**: pet + reason + next slot = 3 taps (~20s) |
| **Records** | Table list only | No narrative; hard to scan history | **Health Timeline** + plain-English summaries |
| **Vaccinations** | List in dashboard card | Not proactive; no care plan | **Preventive Engine** with auto-scheduling |
| **Prescriptions** | Request modal | ~5 fields | **1-tap repeat** for approved meds (~10s) |
| **Communication** | Chat UI | No async telehealth thread; no visit prep | Telehealth + **visit prep pack** from AI |
| **Navigation** | 10+ sidebar items flat | Cognitive load on mobile | **Hub model**: Home · Health · Care · More |
| **Mobile** | Responsive CSS only | No bottom nav; chat sidebar hidden | **80% mobile IA** + offline critical card |
| **Accessibility** | Partial (color-only status) | No skip links, limited focus states | WCAG 2.2 AA: contrast, focus, aria-live for AI |
| **Trust** | Footer badges | No vet verification, no audit trail surfacing | Verified vets, record provenance, ICO/GDPR surfacing |
| **Conversion** | Generic hero | Feature-led, not outcome-led | Outcome hero + social proof + single CTA |

---

## 3. Competitive Analysis (UK / EU)

| Competitor type | Examples | Strengths | Weaknesses | Pet Access moat |
|-----------------|----------|-----------|------------|-----------------|
| **Practice PMS portals** | VetIT, RoboVet client modules | Deep practice integration | Poor UX, siloed per clinic | Cross-clinic passport + timeline |
| **Booking apps** | Vetstoria, PetsApp | Scheduling | No longitudinal health story | Timeline + preventive engine |
| **Pet health apps** | Felcana, PitPat | Hardware/wellness data | Not clinical-grade records | Vet-verified record layer |
| **Insurance apps** | Petplan, ManyPets | Claims | No care coordination | Insurance + care in one hub |
| **Telehealth** | Vetster, Joii | Video consults | Disconnected from local vet | Async + local practice continuity |

**Whitespace:** No UK consumer product combines **RCVS-aligned records**, **family multi-pet hub**, **AI explainability with vet oversight**, and **emergency share card** in one mobile-first experience.

---

## 4. Feature Gap Analysis

### Must build (MVP — 0–6 months)
- Pet Health Timeline (read-only → vet-sourced events)
- Preventive Care Engine (rules-based, species/age)
- Quick Book / Quick Rx flows
- Digital Pet Passport (export PDF/QR)
- Emergency Medical Summary Card (share link)
- AI Health Assistant (RAG on own records + disclaimers)
- Multi-pet Family Dashboard
- Vet verification badges + audit log surfacing

### Growth (6–12 months)
- Async telehealth (message + image + optional video)
- Insurance API partnerships (FNOL, status)
- Wellness subscription plans (Stripe Billing)
- Marketplace (Rx delivery partners)
- Practice OS: AI note draft, inventory, staff roles

### Scale (12–24 months)
- EU expansion (multi-language, travel certs)
- Wearable integrations
- Population health analytics for practices
- Premium membership tier

---

## 5. Information Architecture (V2)

```
Pet Access
├── Public
│   ├── Home (conversion)
│   ├── How it works
│   ├── For owners / For vets / For groups
│   ├── Pricing (+ Wellness plans)
│   ├── Trust & Security
│   └── Find a clinic
├── Owner app (mobile-first)
│   ├── Home (family hub + quick actions)
│   ├── Health
│   │   ├── Timeline
│   │   ├── Records
│   │   └── Analytics
│   ├── Care
│   │   ├── Care plans
│   │   ├── Appointments
│   │   ├── Prescriptions
│   │   └── Telehealth
│   ├── Passport & Insurance
│   ├── Messages
│   ├── Emergency
│   └── AI Assistant (global FAB)
├── Vet practice OS
│   ├── Schedule · Patients · Rx workflow
│   ├── AI note assist · Reminders
│   └── Revenue & inventory
└── Admin
    ├── Users · Clinics · Compliance
    └── Platform analytics
```

---

## 6. Sitemap (URL structure)

| Path | Purpose |
|------|---------|
| `/` | Marketing home |
| `/owners` | Owner value prop |
| `/vets` | Practice OS pitch |
| `/pricing` | Plans + wellness |
| `/trust` | Security, GDPR, RCVS |
| `/clinics` | Partner directory |
| `/app` | Owner PWA |
| `/app/timeline/:petId` | Health story |
| `/app/emergency` | Symptom checker + locator |
| `/app/passport/:petId` | Digital passport |
| `/app/assistant` | AI (with safety gate) |
| `/practice` | Vet portal |
| `/admin` | Platform admin |

---

## 7. Competitive Moat Features

1. **Health Timeline** — Immutable, vet-attested event stream (vaccination, labs, surgery, weight).
2. **Preventive Engine** — Personalized care plans; push/SMS; one-tap book.
3. **AI with guardrails** — Explains *your* data; escalates to vet; no diagnosis claims.
4. **Emergency Share Card** — QR/link: allergies, meds, microchip, insurer — offline-capable PWA cache.
5. **Family permissions** — Partner/granny access with role scopes.
6. **Digital Passport** — EU travel-ready document pack.
7. **Practice network** — Switch vets without losing history (with consent).

---

## 8. AI Health Assistant — Workflow & Safety

```
User question
    → Classify (record / general / emergency)
    → If emergency keywords → block + route to Emergency module
    → If record question → RAG on pet records (owner scope only)
    → Generate plain-English answer + source citations
    → Footer: "Not veterinary advice · Verified by your clinic for clinical decisions"
    → Optional: "Share with my vet" → creates message draft
```

**Oversight:** Vets can flag incorrect AI summaries; admin audit trail; model versioning in audit log.

---

## 9. Monetization Strategy

| Stream | Model | Target |
|--------|-------|--------|
| **Practice SaaS** | £149–399/mo per site | Core revenue |
| **Pet Access Plus** | £7.99/mo owner | Priority book, unlimited telehealth, AI insights |
| **Wellness subscriptions** | £12–29/mo per pet | Vaccination + flea/worm bundles |
| **Marketplace take rate** | 8–15% on Rx/food | Partner fulfilment |
| **Insurance referral** | CPA per policy | Petplan-style partners |
| **Enterprise / groups** | Custom | Multi-site groups |

**Unit economics target:** LTV:CAC > 3 for practices; Plus conversion 8–12% of MAU.

---

## 10. Product Roadmap

### Phase 1 — MVP (Months 0–6)
- Timeline, passport PDF, quick flows, AI explain (beta), emergency card
- 5 pilot clinics; GDPR DPIA; ICO registration maintained

### Phase 2 — Growth (Months 6–12)
- Telehealth async, insurance linking, wellness billing, vet AI notes
- 50 clinics; PetsApp/Vetstoria displacement pilots

### Phase 3 — Scale (Months 12–24)
- EU launch, marketplace, wearables, enterprise SSO
- 500+ clinics; £2M+ ARR target

---

## 11. Technical Architecture (millions of users)

```
                    ┌─────────────┐
                    │  Cloudflare  │ CDN + WAF
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │      API Gateway       │ rate limit, auth
              └────────────┬────────────┘
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌───────────┐   ┌───────────┐   ┌───────────┐
   │ Auth Svc  │   │ Core API  │   │ AI Svc    │
   │ (Cognito/ │   │ (Node/Go) │   │ (isolated │
   │  Auth0)   │   │           │   │  VPC)     │
   └───────────┘   └─────┬─────┘   └───────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌───────────┐   ┌───────────┐   ┌───────────┐
   │ Postgres  │   │ Redis     │   │ S3 docs   │
   │ (RDS)     │   │ cache/    │   │ imaging   │
   │ + RLS     │   │ queues    │   │           │
   └───────────┘   └───────────┘   └───────────┘
```

**Principles:**
- **Multi-tenant RLS** in Postgres (clinic_id, owner_id)
- **Event sourcing** for timeline (append-only `health_events`)
- **PWA** with service worker for emergency card + last records
- **HL7 FHIR** subset for vet PMS integrations (future)
- **UK data residency** (London region); EU shard for GDPR portability

**Stack recommendation:** Next.js PWA + tRPC/REST · Postgres · Redis · S3 · Stripe · Twilio · Daily.co (video) · OpenAI/Azure with PHI boundary.

---

## 12. Speed Goals (UX KPIs)

| Flow | Steps (V2) | Target time |
|------|------------|-------------|
| Book appointment | Pet → type → slot confirm | < 30s |
| Repeat prescription | Select med → confirm | < 15s |
| Open latest record | Home → tap event | < 10s |

---

## 13. Prototype Mapping

Interactive demo: **`index-v2.html`** in project root.

| Strategy item | Prototype location |
|---------------|-------------------|
| Conversion homepage | Public home + trust strip |
| Health Timeline | Owner → Timeline |
| AI Assistant | FAB + Assistant page |
| Preventive care | Care Plans page |
| Family hub | Family page |
| Emergency | Emergency page + share card |
| Digital passport | Passport page |
| Quick Book / Rx | Modals + dashboard chips |
| Mobile nav | Bottom bar (owner portal) |

---

*Document generated for Pet Access product planning. Clinical features require RCVS-compliant workflows and veterinary sign-off before production.*
