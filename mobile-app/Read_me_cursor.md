# Smart Al-Hal Marketplace — Phase 1 (MVP) Requirements

> **Scope:** A minimum viable product focused on core features that let real users experience the app quickly. Emphasize essential flows and avoid deep edge-cases or complex branches in Phase 1.

---

## 1) Introduction

In this phase of the app’s lifecycle, focus on the **Minimum Viable Product (MVP)**: deliver the essential, end-to-end functions so farmers and traders can list, discover, negotiate, and complete transactions with transparency and safety. Defer non-critical details to later phases.

---

## 2) General Requirements

### 2.1 Account Creation

#### 2.1.1 Farmer Account (Seller)

**A) Basic Registration (Required)**

* Full name (Arabic & English): first, middle, third, last.
* Nationality (dropdown).
* Profession (text).
* Date of birth (day/month/year).
* Place of birth (text).
* Phone number (for SMS verification).
* Email (for account confirmation and transaction notifications).
* Password (must meet security policy).

**B) Farm Information (Required)**

* Farm location: precise placement on an **interactive map**; support multiple farms.
* Governorate & district: dropdowns.
* Supply service ranges: (governorates / specific wholesale market / storage).
* Currently planted crops (multi-select).
* Main crops grown annually.
* Available packing methods (e.g., crates, net weight per crate).
* Post-harvest storage capability (Yes/No).
* Land status: owned / rented / under guarantee (may include multiple statuses). For each **plot**: area, expected yield, crop type & variety.
* Contract/guarantee status for the farm/land (are you guaranteeing your land?).

**C) Account Verification (Optional in Phase 1, but Recommended)**

* National ID image upload → “Verified Account” badge to build buyer trust.
* **Policy consent:** user must explicitly sign/accept platform policies; show a downloadable policy file on the form; **no submission without explicit consent**.
* Farmer approval linkage to **Ministry of Agriculture** and **farmer cooperatives** in Syria. Preferably ingest approved farmer lists from authorities or integrate a simple approval flow with designated government bodies.
* **Payout destination:** e-wallet number, bank account, ATM card, or other supported rails; configure a personal wallet.

---

#### 2.1.2 Trader Account (Buyer)

**A) Representative’s Personal Info (Required)**

* Full name (Arabic & English): first, middle, third, last.
* Nationality (dropdown).
* Profession (text).
* Date of birth (day/month/year).
* Place of birth (text).
* Phone (SMS verification).
* Email (confirmation & transaction notifications).
* Password (security policy).

**B) Company Info (Required)**

* Registered company/institution name.
* Official company email (for invoices & important notices).
* Company phone (for direct contact).
* Representative’s full name (authorized person).
* Main business activity (vegetables – fruits – grains – other).
* Company/office/shop address (street, city, governorate).
* Common operations: domestic purchase – import – export – auctions.
* Preferred/high-demand products.

**C) Identity Verification (Required)**

* Commercial license number (unique).
* Commercial license image (PDF or image).
* Tax status: company tax ID field.
* **Policy consent** as above (explicit, mandatory).
* **Payout destination** (e-wallet / bank / ATM card) and wallet setup.

**D) Optional**

* Profile photo (representative).
* Business description (e.g., “Wholesale trader in agricultural crops,” or “Factory”).

---

#### 2.1.3 Transport / Logistics Provider Account

**A) Basic Registration (Required)**

* Full name (Arabic & English): first, middle, third, last.
* Nationality (dropdown).
* Profession (text).
* Current residence (city/governorate; text).
* Date of birth (day/month/year).
* Place of birth (text).
* Phone & email (contact).
* Password (security policy).
* Account type: **Company** or **Individual carrier**.
* **Policy consent** (explicit, mandatory).

**B) Verification & Fleet Details (Required)**

* Documents:

  * For companies: company license image.
  * For individuals: driver’s license image.
  * **Payout destination** (e-wallet/bank/ATM etc.).
* Logistics capabilities:

  * Vehicle types (multi-select): refrigerated, dry van, small truck…
  * Vehicle capacity: max payload ranges (e.g., 1–5 t, 5–10 t).
  * Vehicle model.
  * Vehicle registration/ownership images (for liability & delivery guarantees; some buyers require newer vehicles to protect goods).
  * In-vehicle storage type (racks, drums, crates, air-cooling, gas-cooling).
  * Available tools (crane, scale, etc.).
  * Covered areas: select governorates / cities / villages.
  * **Region constraint:** outside a carrier’s governorate, do **not** allow more than one region unless carrier owns multiple vehicles and operates them; in that case, convert to a company/commercial designation.
  * Driver ID images.
  * Available number of workers.
  * Service hours (allow changes with **48-hour** notice).
  * **Pricing model:**

    * Option A (recommended MVP): weekly/monthly **per-km** price lists managed with the Ministry of Transport; app shows a dynamic tariff table by region (e.g., Rankous → Damascus Al-Zablatani ~45 km; Qatana → Daraa ~65 km). Provide an internal screen so a ministry/authorized staffer can update tariffs periodically.
    * Option B (negotiated): buyer can request quotes; multiple anonymous carriers may respond; buyer picks the best.
  * **Payment options:** cash, electronic, or pay/settle with carrier upon arrival.
* Post-purchase prompts: after order completion, ask buyer “Do you want transport via the platform?” If yes, open a **conversation** with several eligible carriers (anonymous to each other) to finalize price; show a summary (distance, price, carrier, payment method) and confirm.
* Loading/unloading workers available (Yes/No).

**C) Additional (Required)**

* Vehicle photos.
* Indicative service prices (optional; can be derived after the route is known).

---

#### 2.1.4 Government Employee Account

**Admin-managed only** (not public signup) to ensure limited, audited access.

* Full name (Arabic & English), nationality, profession, date/place of birth.
* Job title, ministry/agency (e.g., Internal Trade, Agriculture).
* Official email.
* **Permissions/ACL**: define exactly which screens/data are accessible.

---

#### 2.1.5 Worker Account (Future)

**Plan now, enable later:**

* Full name (Arabic & English); nationality; marital status; profession; date/place of birth.
* Experience & skills (e.g., harvesting, sorting/packing, loading/unloading).
* Reference linkage to employer account (farmer or trader).

---

#### 2.1.6 Other Agricultural Service Providers

For companies/individuals offering fertilizers, tools, consulting, awareness, etc.; may include agricultural engineers.

* Full company name (Arabic & English).
* Commercial registry number.
* Company location.
* Phone numbers & clear addresses.
* Offered services/products.
* Profession (text).
* Company registration date.
* Experience & skills (e.g., harvesting, sorting/packing, loading/unloading).
* **Policy consent** (explicit, mandatory).

---

### 2.2 Crops, Auctions, and Tenders

#### 2.2.1 Farmer (Seller)

**2.2.1.1 Crop Management**
Enable full crop listing:

1. **Basic Info**

* Crop name (**required**; e.g., tomato, apple, potato).
* Crop type/subtype (optional; e.g., cherry tomato, green apple).
* Quantity available (**required**) with unit (e.g., 500 kg, 2 t).
* Harvest date (**required**).
* Expiry date (optional; for perishable goods).
* (Extensible fields in future.)

2. **Quality Info**

* Grade (**required**; dropdown: Grade 1, Grade 2, Export, etc.).
* Size (optional: small/medium/large).
* Color (optional: red/green/yellow).
* Photos (**required**; up to 5 HQ images from different angles).
* (Extensible.)

3. **Agronomy Info**

* Farm location (**required**; map or governorate/area).
* Irrigation method (optional: drip, sprinkler…).
* Soil analysis upload (optional; PDF/image).
* (Extensible.)

---

**2.2.1.2 Open Auction**

* **Input**: crop details as above.

* **Pricing & Timing**:

  * Farmer sets a **starting price**; system enforces **bid increment**.
  * Two durations: main (e.g., 24h) and a shorter duration (e.g., 1h) that begins upon the **first bid** to reduce waiting time and protect freshness.
  * **Anti-sniping**: bids in last 5 minutes extend the auction (configurable minutes/hours). Unlimited extensions allowed.
  * **Ministry price bounds**: final price must respect official limits from Internal Trade.

* **Management & Notifications**:

  * **Deposit/earnest money** is held from each participating trader to deter fake bids; auto-release on auction end or withdrawal.
  * **Anonymity**: traders’ identities are hidden from the farmer and from one another; show pseudonyms (e.g., “Trader #123”).
  * Notify seller and bidders on each bid and near auction end.

* **Disputes & Defaults**:

  * Reveal the winning trader’s identity to the farmer only after successful close.
  * If the winner defaults: notify the runner-up; allow direct completion with the farmer.
  * **Entry rule**: a trader’s wallet must cover the **max bid**; hold the max on room entry.
  * On default after winning:

    1. Flag/blacklist account.
    2. Forfeit the deposit.
    3. If no appeal within 24h to platform support, the trader loses claim to the goods.

---

**2.2.1.3 Closed Tender (Farmer responds to buyer’s RFP)**

* Farmer submits an offer with **price**, **quantity**, and **grade**.
* Specify **ready time** and **precise delivery time**.
* Apply strict anti-spam/anti-fake rules for tenders to protect market integrity.
* **Privacy**: hide farmer contact data from the trader (no direct personal contact).

---

**2.2.1.4 Direct Sale**

* Sell at a fixed price per unit (with optional “negotiable” flag).
* Farmer may edit price/details any time **before** reservation.

---

#### 2.2.2 Trader (Buyer)

**2.2.2.1 Closed Tender (Create RFP)**

* Enter required **quantity**, **grade**, and **price ceiling** (within ministry range).
* Receive **anonymized** offers from farmers; optionally accept multiple offers.
* Precisely set **need-by date** (day/hour/minute), **delivery place**, and **pickup point**.
* **Eligibility**: only traders with a **Verified/Approved** badge (complete documentation, financial suitability, readiness, signed commitment to avoid market manipulation). Violations may trigger legal/commercial pursuit and a platform ban.
* **No back-out**: within the defined post-award window, the trader **cannot cancel**; non-refundable if the trader defaults or delays (a dispute channel exists).
* Edit the RFP only **before** any offers arrive.

---

**2.2.2.2 Interacting With Offers**

* In **open auctions**, place bids.
* In **direct sales**, buy immediately or negotiate if allowed.

---

**2.2.2.3 Direct Product Request**

* Choose crop category/type.
* Set required **quantity** and **grade**.
* Transport & packing needs.
* **Price ceiling** or acceptable range.

---

### 2.3 Shipping & Logistics

**2.3.1 Provider Registration**

* Support signup as **Logistics Provider** (company or individual).
* Manual document review by platform staff.
* Status messages: **Under Review** → **Approved** (with “Verified” badge) → **Rejected (with reason)**.
* Public profile page includes services, fleet size, and coverage.

**2.3.2 Request & Fulfillment**

* After a sale, the buyer (or farmer, per agreement) submits a **shipping request** with pickup, destination, crop type, and weight.
* The system lists matching **available providers** that meet the requirements (e.g., refrigerated truck).
* Buyer selects a provider by **price, rating, and extras**.
* Provider must **accept/decline** within an SLA window.
* **Custom packing** (optional): request from farmer or provider.

**2.3.3 Tracking & Proof of Delivery**

* Real-time shipment status for all parties (“picked up”, “in transit”, “delivered”).
* Buyer confirms receipt without damage → triggers **payouts** to farmer and logistics.

---

### 2.4 Electronic Payments (Escrow; subject to future change)

* Integrate local bank **API** and use platform **Escrow**.
* **Buyer payment flow**:

  1. Upon purchase confirmation, redirect to bank payment page.
  2. Collect total (goods + platform fee + shipping if via platform).
* **Escrow**: hold full amount in platform account until buyer confirms goods are received in good condition.
* **Disbursement**:

  * Net goods value → **farmer**.
  * Shipping fee → **carrier**.
  * Taxes/fees → **government account**.
  * Platform commission → **platform**.

---

### 2.5 Ratings & Reports

* **Ratings**: 1–5 stars; optional comment (but **comment required** for negative ratings). Rater identity is hidden from the ratee.
* **Mutual matrix**:

  * Farmer rates: trader & carrier.
  * Trader rates: farmer & carrier.
  * Carrier rates: farmer & trader.
* **Profiles** show average rating, count, and recent comments.
* Only **real counterparties** can rate; abuse reports temporarily hide ratings pending admin review.

**2.5.2 Issue Reporting (Bug/Problem Tickets)**

* Simple form:

  * Type (dropdown: login issue, auction page error, button not working…).
  * Description (large text).
  * Screenshots (optional).
* Submit to support; user receives **ticket reference** and can track status (“reviewing”, “in progress”, “resolved”).
* Notifications on status changes and resolution.

---

### 2.6 Government Dashboards

#### 2.6.1 Ministry of Internal Trade & Consumer Protection

**A) Central Control Panel**

* **Interactive map** of Syria: click a governorate to see listed quantity, sold quantity, and average prices by crop.
* **Export** map data to CSV/Excel for deeper external analysis.
* **KPIs**: national daily sales value, top-5 demanded crops, stock turnover for key staples.

**B) Market Controls**

* Enter **daily price bulletins** per crop/governorate/type/unit: official **min** and **max** prices.
* **Immediate effect**: system warns sellers below the min price and can auto-adjust.

**C) Import/Export Panel**

* Identify **surplus** (export candidates) and **deficit** (import needs).
* Recommendation reports for import/export quantities based on current and projected supply/demand.

**D) Real-Time Alerts**

* Configurable rules (e.g., >20% price jump in a day, critical low stock).
* Channels: dashboard, email, SMS, and in-app notifications.

---

#### 2.6.2 Ministry of Agriculture

**A) Statistical Dashboard**

* Production stats: crop types, produced quantities, production areas.
* **Agricultural map**: crop distributions by region/governorate.

**B) Central Database**

1. **Aggregation** from live operations:

   * Production quantities (from farmer crop entries).
   * Sales quantities (from successful auctions/tenders).
   * Stock quantities (from farmer/trader inventory updates).
   * Spoilage/waste (from shipping damage reports).
2. **Analysis**: forecasting future production and detecting potential gaps to support seasonal planning.

---

## Chat (SignalR) — Implementation Notes for Cursor “ChatHub”

> These concise specs focus on the chat/conversation feature used for **logistics price negotiations** and **post-order coordination** while preserving anonymity and auditability.

**Server → Client Events**

* `MessageCreated(evt)`
* `MessagesRead(evt)`
* `ConversationCreated(evt)`
* `Error(err)`

**Client → Server Methods**

* `JoinConversation(conversationId)`
* `LeaveConversation(conversationId)`
* `SendMessage({ conversationId, senderUserId, body })`
* `MarkAsRead(conversationId)`

A minimal browser test page that wires these handlers and calls (SignalR) is available and should be used during dev to validate hub behavior. 

**Conversation Types**

* **Order Room** (after a purchase/award): members = seller, buyer, optional logistics; auditors (gov) read-only if permitted.
* **Logistics Quote Room** (from “Need transport?” prompt): buyer + shortlisted carriers; carriers are **anonymous** to each other (aliases); buyer sees quotes and picks one.
* **Auction back-channel**: *disabled during active auction*; open only after close (seller + winner) to finalize logistics/payment.

**Access Control & Anonymity**

* Only participants (and assigned staff) can join.
* Use ephemeral **aliases** inside conversations to enforce anonymity rules.
* Attachments (invoices, delivery notes) use per-message ACL and signed URLs.

**Message Schema (suggested)**

```ts
type ChatMessage = {
  id: string;
  conversationId: number;
  senderUserId: number;
  senderAlias?: string;           // for anonymous rooms
  kind: 'text'|'price'|'system'|'file';
  body?: string;                  // sanitized Markdown
  amountSYP?: number;             // price/offer messages
  meta?: Record<string, any>;     // { bidId, shipmentId, ... }
  createdAt: string;              // ISO
  readBy: number[];               // userIds who read
};
```

**Conversation Metadata (suggested)**

```ts
type Conversation = {
  id: number;
  type: 'order'|'logistics'|'dispute'|'support';
  members: Array<{ userId:number; role:'farmer'|'trader'|'carrier'|'admin' }>;
  title?: string;
  createdAt: string;
  locked?: boolean;     // e.g., active auction
  anonymous?: boolean;  // true for logistics quote rooms
};
```

**UX & Delivery Rules**

* Show unread counters; call `MarkAsRead` on focus/visibility.
* Reject empty sends; throttle (e.g., ≤5 msgs/sec).
* System messages for key state changes (order created, deposit held, shipped, delivered).
* In logistics quote rooms, **broadcast RFP** to eligible carriers; allow **parallel** replies; keep carrier identities hidden.

**Security**

* Authenticate with **JWT** via `accessTokenFactory`.
* Sanitize Markdown; limit outbound links to an allow-list.
* Scan uploads; store securely; serve via signed URLs.

**Observability**

* Log event timings (join→first message, send→ack).
* Auto-reconnect with exponential backoff; show UI toasts on reconnect.

---

## Developer Notes (Keep Phase-1 Lean)

* Deliver these core flows in Phase 1:
  **Registration & verification**, **crop listing**, **open auction**, **buyer RFP (closed tender)**, **direct sale**, **logistics matching**, **escrow payment**, **ratings**, and **basic government dashboards** (KPIs + price bulletin).
* Defer: worker accounts, advanced analytics, complex transport pricing, multi-org roles beyond essentials.

---

## Glossary

* **Escrow**: platform holds funds until buyer confirms delivery.
* **Guarantee (ḍamān)**: land/farm operated under contract by a third party.
* **Official price bulletin**: daily ministry min/max prices per crop/governorate.

---
