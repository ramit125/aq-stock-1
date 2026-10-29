# AQUA CHEMI

A responsive wholesale and retail catalog for an orthopedic and general-medicine shop, with injections, surgical supplies, and medical devices. Customers can search products, filter by category, sort items, and check stock plus retail and wholesale pricing.

## Shared inventory setup

1. Create a Supabase project and run `supabase/setup.sql` in its SQL Editor. This creates the products and categories tables, seeds sample items/categories, enables public read-only access, restricts writes to signed-in users, and enables Realtime. If Supabase is already configured, run the script again to add the company, sizes, and category-management support.
2. In Supabase Authentication, create the shopkeeper account. Disable public sign-ups so only accounts you create can edit inventory.
3. Copy the project URL and publishable key from the Supabase project API settings into `config.js`. A publishable key is intended for browser use; never put a `service_role` or secret key in this file.
4. Host this folder on a public HTTPS static host. The site can be opened locally for a demo, but customer phones need a public URL for shared stock and QR scanning.
5. On the hosted page, choose **Customer QR** and download the QR image once. It always opens the same catalog URL; customers see later edits through Supabase Realtime. If you have a permanent custom domain, set `publicCatalogUrl` in `config.js` before deployment.

Shopkeepers sign in with their Supabase email and password. In unconfigured local demo mode, the existing `AC` gate remains available, but its edits are browser-local and do not sync.

In shopkeeper mode, add a company/brand and comma-separated sizes to each product. Use **Manage categories** to add or rename categories, add a product directly to a category, or delete an empty category. Categories with products cannot be deleted; move or delete their products first. Existing product edit/delete actions are available on each product card. Customers can filter by company, choose a size, set quantities, and review an order from the catalog. To enable WhatsApp ordering, `shopWhatsAppNumber` in `config.js` is set to the shop number including its country code (digits only, without `+`). Submitting an order navigates to WhatsApp in the same tab with the message ready to send. The customer must send the message in WhatsApp; the website does not submit orders automatically. Stock is tracked per product and shared across its listed sizes.

The catalog is sample stock; verify product details, pack sizes, pricing, availability, and prescription requirements before publishing. Prescription products must be dispensed according to local law.