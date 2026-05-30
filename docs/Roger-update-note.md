Fixed:

- Quotes show the products with the right prices and totals now, both on your screen and on the version the customer sees. (They were blank / $0 before.)
- The customer page that was throwing an error opens fine now.
- Creating and editing quotes, POs, customers, and vendors now runs through the system we already use, so you get vendor lookup, USD/MXN, IVA, discounts, images, and the ability to keep editing a quote day to day.

What's changing:

We're scaling back the custom build for anything that creates or edits a record. The dashboard becomes a simpler, cleaner place to just see everything (orders, customers, money, leads), with quick buttons to open or create a record whenever you want to change something. Fewer moving parts, fewer bugs, and it builds on what we've already got.

Can you test these real quick (5 min)?

1. Open a recent quote. Do the products and total show right?
2. Hit "Preview" / the PDF. Does the customer version show the total (not $0)?
3. Open any customer. Does the page load without an error?
4. On an order, click "New Quote" and "Open in Odoo." Do they take you in to create or edit?

One heads up on step 4:
You're going to need to log back in to Odoo

Thanks, Joshua
