Automator-RO

Overview
- Generate complete educational courses with AI, grounded in pedagogy.
- Edit materials in-app and export them in editable formats.

Materials and Editability
- All materials are editable directly in the app via the integrated editor.
- Exports preserve editability after download:
  - Slides are exported as `PPTX` (PowerPoint) files.
  - Documents are exported as `DOCX` (Word) files.
- Conversion is automatic from source `Markdown (MD)` content to the final `DOCX/PPTX` formats.

How Export Works
- From the Materials view, click `Download` on any completed material.
- The app calls an Edge Function that generates the appropriate format and uploads it to Supabase Storage.
- A public download link is returned and opened in a new tab.

Stripe Payments
- Checkout is implemented with Stripe via an Edge Function.
- The Billing page includes an `Upgrade` button that redirects to Stripe Checkout.
- A Stripe webhook updates user subscriptions and unlocks Pro features upon successful payment.

Demo Video Placeholder
- The homepage includes a `Watch demo` CTA that opens a dialog with a placeholder.
- Real demo content will be integrated later; the placeholder informs users that it’s coming soon.

CTA Tracking
- Key CTAs (Get Started, Watch Demo) are tracked client-side and stored in `localStorage` for initial analytics.
- Console logs are emitted under the `[CTA]` namespace for quick inspection during development.

Notes
- Trial users can access the full feature set to evaluate the product.
- On upgrade, subscription limits are applied via Supabase RPC.
