# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are people who run a cybersecurity training programme: Sycom instructors first. They operate instructor-led cohorts, deliver practitioner curricula, and run high-stakes exams.

Secondary users are the learners in that programme. They take the work, sit exams, and earn certificates.

First scope is Sycom's own instructors and learners. Customer organisations using the same product come after that, not before.

## Product Purpose

Sycom Solutions is a practising cybersecurity firm. This dashboard is the delivery arm of that practice: it makes the firm's craft teachable as software — curricula, cohorts, exams, progress, and certificates — rather than a catalogue of rented courses.

Success is a running programme: instructors can deliver a cohort, learners can complete the work and be examined, and the organisation can see that it happened.

## Positioning

Not a horizontal LMS. Sycom teaches its own craft. Neighbouring products can host courses; they cannot truthfully claim this is how a practising firm trains people in the work it actually does.

## Operating Context

- Instructor-led cohorts, not purely self-serve browsing
- Practitioner curricula drawn from the firm's work
- High-stakes exams as part of delivery
- Certificates as the durable record of completion
- First programme is internal to Sycom; later programmes are other organisations on the same product

## Capabilities and Constraints

Confirmed in product, even where the codebase is still early:

- Multi-tenant: organisations and programmes stay isolated
- Courses, progress, and certificates are in-scope
- Signed-in dashboard is the operating surface; guests sign in or create an account with email and password

Built today, not the product yet:

- Auth (sign-in, sign-up, session) and a signed-in overview that currently dumps the session
- Domain data for courses, cohorts, exams, tenancy, and certificates is not in the schema

Undecided:

- Public product name: UI currently titles the app **Sycom**; the repo and agent docs say **Sycom Learn**; legal/company name is **Sycom Solutions**
- When and how customer organisations (beyond Sycom's own programme) enter the first shipping surface

## Brand Commitments

- Company / legal name: **Sycom Solutions**
- Logo files live at `apps/dashboard/public/logos/` (`sycom-logo.png`, `sycom-logo-icon.png`, and related)
- Do not treat auth-panel testimonials as brand voice or proof

## Evidence on Hand

Real assets:

- Logo and icon files under `apps/dashboard/public/logos/`
- Certificate stamp and signature files exist (`certificate-stamp.png`, `certificate-signature.png`) but are not confirmed as production evidence to cite or ship as proof

Must not fabricate:

- Auth-panel quotes (Alex Rivera, Priya Sharma, Marcus Johnson, Elena Vasquez, TechShield, CloudFirst, RedLine, Meridian Health, “40% incident response” and similar claims) are placeholders, not customer evidence
- No confirmed testimonials, case studies, press, pricing, seat counts, or outcome metrics

## Product Principles

1. Teach the firm's craft, not a generic course catalogue.
2. Design for the programme: instructors running cohorts first, learners inside that programme second.
3. Treat exams and certificates as load-bearing, not decorative completion badges.
4. Keep tenants isolated as the product grows beyond Sycom's own programme.
5. Never invent proof. Placeholder quotes and unconfirmed metrics stay out of future work.
