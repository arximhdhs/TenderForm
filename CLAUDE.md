# Tender — Validation Landing Page

## What this is
A demand-validation landing page for **Tender**, an Orthodox Christian dating app targeting users seeking marriage and family. The page collects waitlist signups via a short questionnaire + email capture flow.

## Stack
- **Pure HTML/CSS/JS** — no frameworks, no build step
- **Firebase** — Analytics (event tracking) + Firestore (submission storage)
- **Hosted on GitHub Pages**

## File structure
```
index.html          — Landing page markup (Greek UI)
styles.css          — Mobile-first responsive styles
script.js           — Questionnaire logic, Firebase integration, analytics
firebase-config.js  — Firebase credentials (edit this file with real values)
```

## Design system
Colors, spacing, typography, and radii are defined as CSS custom properties in `styles.css` `:root`. The visual direction is: serious, elegant, warm, modern, trustworthy. Primary blue (#1F3A5F) for structure, accent gold (#C8A951) used sparingly.

## Key UX flow
1. Hero with CTA → scrolls to questionnaire
2. Questionnaire: 4 questions, one per step, auto-advance on selection
3. If user answers "not single" → polite disqualification message
4. Otherwise → email capture → success state
5. All data saved to Firestore with UTM params and session ID

## Firebase setup
1. Create project at console.firebase.google.com
2. Enable **Firestore Database** and **Analytics**
3. Add a web app, copy config values into `firebase-config.js`
4. Set Firestore rules to allow `create` on `submissions` collection

## Analytics events
- `page_view`, `cta_click`, `questionnaire_start`, `question_answered`
- `questionnaire_completed`, `email_submitted`, `not_single_disqualified`

## Deploying
Push to GitHub, enable GitHub Pages from repo settings (source: main branch, root folder).

## Editing copy
All user-facing text is Greek and lives in `index.html`. Search for the text you want to change and edit directly.

## Important notes
- The page works in "offline mode" if Firebase config has placeholder values — logs to console instead
- Mobile-first design with sticky CTA on small screens
- No dependencies beyond Firebase SDK loaded from CDN
