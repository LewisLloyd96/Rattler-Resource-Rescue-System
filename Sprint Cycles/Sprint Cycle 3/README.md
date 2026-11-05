# Sprint Cycle III – Database Implementation

The Sprint Cycle II design is implemented as a **MySQL 8.0** database: 21 tables, keys, constraints, views, triggers, a stored procedure and a scheduled event, loaded with realistic FAMU sample data and tested with demonstration queries and automated rule tests.

## Contents

```text
Sprint Cycle 3/
├── Database/
│   ├── 01_schema.sql          creates the database, tables, keys, constraints, views, triggers, procedure, event
│   ├── 02_sample_data.sql     realistic sample data for every role and table
│   ├── 03_queries.sql         demonstration queries: search, related data, add, modify, reports
│   ├── 04_rule_tests.sql      tries to break 21 business rules and shows each one is enforced
│   ├── demo_output.txt        output of 03 and 04 from a clean run
│   └── tools/generate_docs.py rebuilds the data dictionary and ERD source from the live database
├── ERD/                       updated ERD (PDF best for viewing; PNG; Mermaid .mmd source) + four area diagrams
├── Data Dictionary/           updated data dictionary (Excel and Markdown), generated from the database
└── README.md
```

## Why MySQL

- **The data is relational.** Users, organizations, items, reservations, exchanges, events and reports are tightly linked; foreign keys keep those links valid.
- **InnoDB transactions and row locks** stop two people from reserving the same item at the same moment.
- **Native rule enforcement:** `CHECK` constraints, unique indexes, triggers, stored procedures and scheduled events enforce business rules inside the database, not only in application code.
- **Fits the stack:** Django’s ORM supports MySQL directly for Sprint Cycle IV, and managed MySQL hosting is widely available.

## Setup: create and load the database

Requires **MySQL 8.0.16 or later** (CHECK constraints are enforced from 8.0.16). Run from the `Database` folder:

```bash
cd "Sprint Cycles/Sprint Cycle 3/Database"
mysql -u root -p < 01_schema.sql          # drops and recreates rattler_resource_rescue
mysql -u root -p < 02_sample_data.sql     # loads the sample data
mysql -u root -p -t < 04_rule_tests.sql   # optional: should end with "22 of 22 rule tests passed"
mysql -u root -p -t < 03_queries.sql      # runs every demonstration query
```

`03_queries.sql` adds and changes data, so **reload 01 and 02 before a demo** to start from the original data. `04_rule_tests.sql` rolls back everything it does, so it can run at any time.

**MySQL Workbench:** File → Open SQL Script → open each file in order → Execute (lightning bolt).
**Windows:** use the same commands in a terminal where `mysql` is on the PATH, or Workbench.
**Scheduled event:** expiry runs every 15 minutes when `event_scheduler` is ON (the MySQL 8 default). Check with `SHOW VARIABLES LIKE 'event_scheduler';`.

To regenerate the data dictionary and ERD source after a schema change:

```bash
pip install openpyxl
python3 tools/generate_docs.py --user root --password YOUR_PASSWORD
```

## What is implemented

| Area | Tables |
|---|---|
| Users and access | `user`, `role`, `permission`, `role_permission` |
| Organizations | `organization` (departments and student orgs), `organization_member` |
| Listings and exchanges | `category`, `item`, `item_image`, `reservation`, `exchange`, `message` |
| Collection drives | `collection_event`, `event_category`, `event_item` |
| Moderation | `report`, `moderation_case`, `moderation_action` |
| System | `notification`, `system_setting`, `audit_log` |

Plus views `v_available_items` and `v_reservation_details`, eight triggers, the `reserve_item` stored procedure and the `ev_expire_reservations` scheduled event.

### Sample data

16 users covering all five roles, 3 departments, 3 student organizations (one still Pending approval), 8 categories, 26 items (personal, department and organization listings in every status), 10 reservations in every status, 5 exchanges, 8 messages, 2 collection events, 4 reports, 2 moderation cases, notifications, settings and an audit-log entry. All people and listings are fictional.

## Changes from the Sprint Cycle II design

These resolve the open questions from the Sprint II presentation. The ERD and data dictionary are updated to match.

| Change | Reason |
|---|---|
| `user.email_verified_at` (new) and a `@famu.edu` CHECK on `user.email` | Business rule: verified campus email required to reserve |
| `item.quantity` (new) | Business rule: giveaway listings state a quantity |
| `Pending Review` item status | Moderator “Pending Listings / Review Listings” screen |
| `Pending` reservation status | Department “Approve Requests” screen |
| `reservation.open_item_id` (generated) + unique index | Enforces one open reservation per item in the database itself |
| `moderation_action.reason` (new, required) | Business rule: every moderation action records a reason |
| `audit_log` (new table) | Business rule: administrators must log a justification for account actions |

Not added: Student Organization “Event & Bulk Requests”. The Functional Requirements do not require item requests, so the team left this out of scope.

## Three use cases and how the database supports them

### 1. A Campus User reserves an item
- **Tables:** `user` → `reservation` ← `item` (+ `category`, `system_setting`, `notification`).
- **Relationships:** a user makes many reservations (1:M); an item has many reservations over time but only one open at a time.
- **Data stored:** who reserved, which item, optional receiving organization, `reserved_at`, `expires_at`, `status`, pickup note.
- **How it works:** `CALL reserve_item(item, user, org, note)` locks the item row in a transaction. Triggers reject unverified or suspended users, unavailable items, the user’s own listing and a second open reservation in the same category; set `expires_at` from the 48-hour setting; mark the item `Reserved`; and notify the owner. The scheduled event expires reservations nobody picks up.

### 2. Giver and receiver complete an exchange
- **Tables:** `reservation` → `exchange` (1:0..1 through the unique `reservation_id`), `message`.
- **Data stored:** pickup time and place, `giver_confirmed_at`, `receiver_confirmed_at`, `status`, `completed_at`.
- **How it works:** each side sets its own confirmation timestamp. When both are set, a trigger completes the exchange; that cascades to the reservation and the item (`Completed`). A CHECK constraint makes `Completed` impossible without both confirmations. Demo: query D2.

### 3. A Student Organization runs a collection drive
- **Tables:** `organization` → `collection_event` → `event_item` ← `item`; `event_category` → `category`.
- **Data stored:** event details and dates, participation instructions, accepted categories, each donated item with contributor and `distribution_status`.
- **How it works:** a trigger allows only approved student organizations to host events; a CHECK keeps `end_at` after `start_at`; `event_category` stores accepted item types; `event_item` tracks each donation from Pending to Distributed (queries B4, B5).

## Business rules and how they are enforced

`04_rule_tests.sql` proves each one by trying to break it (22 of 22 pass):

| Rule | Enforced by |
|---|---|
| Email unique; must be `@famu.edu` | UNIQUE + CHECK |
| Verified, active account required to reserve | Trigger |
| Only Available items; not your own listing | Trigger |
| One open reservation per item | Unique index on a generated column |
| Anti-hoarding: one open personal reservation per category | Trigger |
| Reservation expires after it starts; auto-expiry | CHECK + scheduled event |
| Exchange completes only when both sides confirm | CHECK + trigger |
| One exchange per reservation; one case per report | UNIQUE |
| Every item has a valid category | FOREIGN KEY |
| Reports must name a target; cases close only with a resolution | CHECK |
| Moderation actions need a reason; restrictions need an end date | NOT NULL + CHECK |
| Only approved student organizations host events; events end after they start | Trigger + CHECK |
| Admin account changes need a justification and are logged | Trigger + `audit_log` |

## Answering an instructor query live

Connect with `mysql -u root -p rattler_resource_rescue` (or Workbench), then adapt these patterns:

```sql
SHOW TABLES;                          -- list tables
DESCRIBE item;                        -- columns of a table
SHOW CREATE TABLE reservation\G       -- full definition with keys and constraints
SELECT * FROM v_available_items;      -- everything that can be reserved now

-- Available items in a category at a location
SELECT title, item_condition, pickup_location FROM v_available_items
WHERE category = 'Textbooks' AND pickup_location LIKE '%Student Union%';

-- How many items each user has listed
SELECT CONCAT(u.first_name,' ',u.last_name) AS user, COUNT(i.item_id) AS listings
FROM user u LEFT JOIN item i ON i.posted_by_user_id = u.user_id
GROUP BY u.user_id ORDER BY listings DESC;

-- Everything about one reservation
SELECT * FROM v_reservation_details WHERE reservation_id = 6;

-- Users with a given role
SELECT u.first_name, u.last_name, u.email FROM user u JOIN role r ON r.role_id = u.role_id
WHERE r.role_name = 'Department Representative';
```

Useful joins: `item.posted_by_user_id → user`, `item.owner_organization_id → organization`, `item.category_id → category`, `reservation.item_id → item`, `reservation.reserved_by_user_id → user`, `exchange.reservation_id → reservation`, `organization_member` links users to organizations.
