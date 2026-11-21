# Airbnb Arrival Ready

An independent Airbnb-style design prototype for a late-night check-in problem. Browse sample stays, open a listing, save a wishlist, read the inbox and explore the booked trip. The proposed arrival features are marked **New**.

Live prototype: https://dilatedtime.github.io/airbnb-arrival-ready/

[Read the three-page case study](Case-Study.pdf) | [Read the research notes](RESEARCH.md)

## Try the main journey

1. Open **Trips**, then **Cedar House**.
2. Open the arrival pack. Share a saved copy with a companion and accept on both sides.
3. Open **Test conditions**. Try low battery, no signal, a jammed lock or a dead phone.
4. Follow entry recovery. If both routes fail, send an arrival report.
5. With no data but cellular service, prepare an SMS, mark it sent in the demo, then simulate a separate support receipt. Restore data before requesting stays. Review the room, ride and any guest contribution before accepting.
6. Confirm arrival after the group is inside. A booking confirmation alone keeps the issue open.

Use **Show added features** to show or hide the labels. **What’s new?** explains the proposed changes. The account menu also opens host and support screens. Host updates do not replace a guest’s saved copy until they choose to update it.

## What is included

- Search, dates, guests, filters, maps and eight fictional listings.
- Listing photos, amenities, reviews, house rules and price estimates.
- Wishlists, trips, messages, account settings and a help section.
- Saved arrival details, group sharing, battery view and entry recovery.
- Host plans, support review, alternative stays, ride choices, cancellation and receipts.
- Saved browser progress, mobile layouts, keyboard controls and offline reopening after the first visit.

All stays, hosts, reviews, prices and bookings are sample content. Calls, SMS delivery, transfers, payments and reservations are simulated. No invitation email is sent. This project is not affiliated with Airbnb.

## Open or build

The `docs` folder contains the ready-to-open prototype. Open `docs/index.html` in a browser, keeping its assets folder beside it. The clean Drive ZIP contains these ready-to-open files and short instructions.

To edit the source, install Node.js, run `npm install`, then `npm run build`. Run `npm run dev` to preview it at `http://127.0.0.1:4180/`. GitHub Pages publishes `main` from the `docs` folder.

The app needs no API keys. There is no attempt limit. New online steps wait while the device is offline. Local browser storage may be cleared through **Test conditions** and **Start a fresh journey**.

## References and photos

The navigation and layout were checked against [Airbnb](https://www.airbnb.com/). The arrival flow builds on its existing [arrival instructions](https://www.airbnb.com/help/article/41) and [backup entry guidance](https://www.airbnb.com/help/article/3486). The proposed readiness and recovery steps still need testing with guests and hosts. [Research notes](RESEARCH.md) list six public guest reports, two comments, official sources and the limits of that evidence.

Photo sources are listed in `assets/PHOTO-CREDITS.txt`. They are stand-ins for fictional properties and people. The sample entrance image is a generated illustration. The Inter font license is included with the assets.

The proposed total incident cap is INR 4,500, including INR 150 for staff and communication. Maximum guest benefit credit is INR 4,350. All prices, operating thresholds and impact targets are assumptions.
