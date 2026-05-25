import { Section, ItemRow, Frame } from "../_components/editorial";

export const Week18 = () => {
  return (
    <>
      {/* WHAT SHIPPED */}
      <Section
        eyebrow="What shipped"
        heading="What shipped."
        lead={
          <>
            <p>
              Twenty items shipped this week, in two waves. R4 (earlier in
              the week) went deep on Stage 8 customs. R5 (today) went broad
              — dashboard polish, chat that reads PDFs, real hotels on the
              homepage, and a fix for the navigation lag between pages.
            </p>
          </>
        }
      >
        <Frame label="R5 · today" count="8 / 8" tone="sage">
          <ItemRow
            tag="Dashboard"
            title="Sidebar nav cleanup."
            body={`Products promoted from "More → Catalog Admin" up into the main Operations group. Added a "View Website" link in the sidebar footer.`}
          />
          <ItemRow
            tag="Dashboard"
            title="Nav progress bar."
            body="Thin copper bar at the top of the viewport. Fires on link click, finishes on path change. Trickles to 90% on slow pages so nothing feels frozen."
          />
          <ItemRow
            tag="Chat"
            title="Attachments — images + PDFs."
            body="Paperclip on the dashboard chat input. PNG / JPG / GIF / WebP / PDF, 5 files × 5MB each. Claude reads them as image or document blocks, not just filenames."
          />
          <ItemRow
            tag="Chat"
            title="Drive archive for chat uploads."
            body="Files uploaded in chat archive to Drive under /Chat Uploads/YYYY-MM via the service account. Pills become clickable links once upload completes."
          />
          <ItemRow
            tag="Website"
            title="Real hotel clients on the homepage."
            body="Fictional projects gone. Linking to 10 real hotels — Casa Dragones, Belmond Sierra Nevada, Casa No Name, Hotel Amparo, Rosewood SMA, Hilton Cabo Azul, Querencia, One&Only Palmilla, El Dorado Golf, Belmond Maroma. Each card opens the hotel's official site."
          />
          <ItemRow
            tag="Perf"
            title="Sheets read cache."
            body="TTL cache + in-flight coalescing on every Google Sheets read. Pipeline used to fire 4 parallel reads on each click; now those share one request. 60s TTL on active tabs, 5min on reference tabs."
          />
          <ItemRow
            tag="Products"
            title="Odoo-style card grid."
            body={`Browse-by-default — no more "type 3 chars" empty state. Responsive 4 / 3 / 2 / 1 card grid, brand-tinted placeholder tiles, Group by / Sort by, category chips and in-stock toggle in the toolbar.`}
          />
          <ItemRow
            tag="Website"
            title="Homepage flow cleanup."
            body={`Project gallery moved up directly under "We're the dealer." Catalog depth band re-cut — flagship faucet image, 354,449 stat front and center, single CTA to /shop/catalog, quiet brand row underneath.`}
          />
        </Frame>

        <div className="mt-6">
          <Frame label="R4 · earlier this week" count="12 / 12" tone="sage">
            <ItemRow
              tag="Stage 8"
              title="Spanish manuales editor."
              body="Required toggle, status, Drive file IDs — per pedimento item."
            />
            <ItemRow
              tag="Stage 8"
              title="Send to broker actually sends."
              body="Drafts move through Resend, status advances, action logged to Activity_Log."
            />
            <ItemRow
              tag="Stage 8"
              title="Three-way reconciliation."
              body="Vendor invoices → cálculo → factura with pass / warn / error variance."
            />
            <ItemRow
              tag="Stage 8"
              title="Landed cost — per item, per deal."
              body="Invoice-weighted allocation. Per-unit landed cost, not just factory cost."
            />
            <ItemRow
              tag="Stage 1"
              title="WhatsApp inbound webhook."
              body="Customer messages auto-create leads with dedup. Notification on intake."
            />
            <ItemRow
              tag="Stage 1"
              title="Email + phone required for hot sources."
              body="Walk-ins and phone-ins can't leave the form without both."
            />
            <ItemRow
              tag="Stage 9"
              title="Delivery method variants."
              body="Drop-ship, broker-direct, Mexican supplier — three flows, each distinct from a standard import."
            />
            <ItemRow
              tag="Stage 11"
              title="Post-sale follow-up + marketing buckets."
              body={`Automatic "how was it?" email after delivery. Customers segmented into builder / designer / end-user.`}
            />
            <ItemRow
              tag="Stage 11"
              title="Segment-aware sequence templates."
              body="Three flavors per outreach type."
            />
            <ItemRow
              tag="Stage 4"
              title="Email-always on quote send."
              body="Every quote leaves with email. WhatsApp is a companion, not a replacement."
            />
            <ItemRow
              tag="Stage 7"
              title="Vendor credit terms on the vendor page."
              body="Billing trigger, lead time, confirmation pattern visible at a glance."
            />
            <ItemRow
              tag="Stage 2"
              title="Mine / All toggle on Orders."
              body="Same segmented control as Leads + Pipeline. Persists per user, per surface."
            />
          </Frame>
        </div>
      </Section>

      {/* WHAT'S NEXT */}
      <Section
        eyebrow="What's next"
        tone="paper"
        heading="What's next."
        lead={
          <>
            <p>
              Nine threads in motion this week. Some are kickoffs, some are
              quick wires, some are scoping for multi-week work. All digital
              ecosystem.
            </p>
            <p className="mt-3">
              Items here move through the week and either ship or graduate to
              <em> Working toward</em> if they&apos;re multi-week.
            </p>
          </>
        }
      >
        <Frame label="Week 19 · in motion" count="9">
          <ItemRow
            tag="01"
            title="Marketing — content plan + calendar."
            body="Kickoff with Roger this week. Channels (IG, FB, email), frequency, who writes. Output: a calendar tool inside /dashboard/marketing."
          />
          <ItemRow
            tag="02"
            title="Photo shoot."
            body="Shot list tied to the weakest catalog imagery. Date set. Output: replacement photos for /shop and source material for the content calendar."
          />
          <ItemRow
            tag="03"
            title="Email nurture — wire up the templates we already have."
            body="R4's segment-aware templates are sitting there unused. Trigger on lead inactivity: quote sent + 7 days no reply → segment-aware follow-up."
          />
          <ItemRow
            tag="04"
            title="Project gallery — finish what we started."
            body="Homepage now links to 10 real hotels (R5, today). The /projects index and detail pages still use fictional data — replace with real case studies, same shape: one client, one room, products used (linked to /shop)."
          />
          <ItemRow
            tag="05"
            title="WhatsApp broadcast tool."
            body="Outbound on the Meta rail we just chose. Tag a segment, draft, send. First targets: showroom events, restock alerts."
          />
          <ItemRow
            tag="06"
            title="Customer-facing /track."
            body={'Extend the route so a customer enters their order # and sees live status. Kills the "where’s my order?" emails.'}
          />
          <ItemRow
            tag="07"
            title="Brand pages — pilot one this week."
            body="Depth pass on /brands/[slug]. Probably Brizo first. Editorial copy + signature products + projects shipped."
          />
          <ItemRow
            tag="08"
            title="Trade portal — MVP scoping."
            body="/trade is currently public. Scope what gated B2B login, trade pricing, and project files look like. Build is multi-week; this week is design."
          />
          <ItemRow
            tag="09"
            title="Salesperson dashboard — what does it look like?"
            body="Sketch the surface a sales rep lands on. Their book, their pipeline, their morning brief. Mine/All toggle and segmented controls already exist; this is composition, not new tech."
          />
        </Frame>
      </Section>

      {/* WORKING TOWARD */}
      <Section
        eyebrow="Working toward"
        heading="Working toward."
        lead={
          <p>
            Multi-week initiatives that don&apos;t fit a single-week box. Items
            appear here when they kick off and drop off when they ship.
          </p>
        }
      >
        <Frame label="Active · this week and beyond" count="01" tone="copper">
          <ItemRow
            tag="Finance"
            title="Outflow visibility — led by Antonina."
            body="Today the dashboard tracks pipeline, won deals, incoming cash. End-of-month target: AP timing, vendor cash position, landed-cost-to-margin per deal. Same dashboard, second lens. Stage 7 is the reporting hotspot."
          />
        </Frame>
      </Section>

      {/* FROM YOU */}
      <Section
        eyebrow="From you"
        tone="paper"
        heading="From you."
        lead={
          <p>
            Five replies still open from the punch list. None block the
            portal. Two minutes each.
          </p>
        }
      >
        <Frame label="Open · awaiting Roger" count="5" tone="copper">
          <ItemRow
            tag="01"
            title="The WhatsApp number."
            body="Send the +52 line you'd give a new client today."
          />
          <ItemRow
            tag="02"
            title="Lead times — confirm or correct four."
            body="Brizo, Kohler, TOTO, BLANCO. We loaded conservative defaults; tell us where reality is different."
          />
          <ItemRow
            tag="03"
            title="Vendor billing — eight rows to tick."
            body="Your top eight vendors, our guess at each one's billing trigger. Right or correction."
          />
          <ItemRow
            tag="04"
            title="Brokers — Manzanillo and Laredo."
            body="Just those two. Name and email each."
          />
          <ItemRow
            tag="05"
            title="Day-1 emails — only when you hire."
            body="Four roles pre-built. Drop emails when the time comes."
          />
        </Frame>

        <div className="mt-6">
          <span
            className="font-display italic text-[20px] leading-[1.4] text-[color:var(--color-dash-text-muted)] pb-2 inline-flex items-center gap-3"
          >
            Full punch list — coming soon
          </span>
        </div>
      </Section>
    </>
  );
};
