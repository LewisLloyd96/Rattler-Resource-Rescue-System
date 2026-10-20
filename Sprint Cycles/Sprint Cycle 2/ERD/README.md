# Entity-Relationship Diagram

![Rattler Resource Rescue System ERD](Sprint-II-ERD.png)

## Files

| File | Use |
|---|---|
| [Sprint-II-ERD.pdf](Sprint-II-ERD.pdf) | **Full ERD, best for viewing.** Vector PDF, stays sharp at any zoom. |
| [Sprint-II-ERD.png](Sprint-II-ERD.png) | Full ERD as an image. |
| [ERD-1-Users-Roles-Organizations](ERD-1-Users-Roles-Organizations.png) ([PDF](ERD-1-Users-Roles-Organizations.pdf)) | USER, ROLE, PERMISSION, ROLE_PERMISSION, ORGANIZATION, ORGANIZATION_MEMBER, NOTIFICATION, SYSTEM_SETTING |
| [ERD-2-Items-Reservations-Exchanges](ERD-2-Items-Reservations-Exchanges.png) ([PDF](ERD-2-Items-Reservations-Exchanges.pdf)) | CATEGORY, ITEM, ITEM_IMAGE, RESERVATION, EXCHANGE, MESSAGE |
| [ERD-3-Collection-Drives](ERD-3-Collection-Drives.png) ([PDF](ERD-3-Collection-Drives.pdf)) | COLLECTION_EVENT, EVENT_CATEGORY, EVENT_ITEM |
| [ERD-4-Reports-Moderation](ERD-4-Reports-Moderation.png) ([PDF](ERD-4-Reports-Moderation.pdf)) | REPORT, MODERATION_CASE, MODERATION_ACTION |

The section diagrams split the full ERD into readable parts. In each section, entities from other sections are shown with only their primary key so the connecting relationships are still visible.

Crow's foot notation: `||` exactly one, `|o` zero or one, `o{` zero or many. Attributes marked **optional** are nullable; **NEW** marks fields and entities added in this revision. Many-to-many relationships are resolved with the associative entities `ROLE_PERMISSION`, `ORGANIZATION_MEMBER`, `EVENT_CATEGORY` and `EVENT_ITEM`.

The full diagram source is below (Mermaid, rendered by GitHub). To change the ERD, edit this block and re-export the PNG, keeping it in sync with the [Data Dictionary](../Data%20Dictionary/Data-Dictionary.md).

```mermaid
---
title: Rattler Resource Rescue System — Crow's Foot ERD
---
erDiagram
    USER {
        INT user_id PK
        INT role_id FK
        VARCHAR(80) first_name
        VARCHAR(80) last_name
        VARCHAR(255) email UK
        VARCHAR(255) password_hash
        VARCHAR(30) account_status
        DATETIME created_at
    }
    ROLE {
        INT role_id PK
        VARCHAR(60) role_name UK
    }
    PERMISSION {
        INT permission_id PK
        VARCHAR(80) permission_code UK
        TEXT description "optional"
    }
    ROLE_PERMISSION {
        INT role_id PK, FK
        INT permission_id PK, FK
    }
    ORGANIZATION {
        INT organization_id PK
        VARCHAR(30) organization_type
        VARCHAR(150) name UK
        VARCHAR(150) location "optional"
        VARCHAR(255) contact_email "optional"
        VARCHAR(30) status
    }
    ORGANIZATION_MEMBER {
        INT membership_id PK
        INT organization_id FK
        INT user_id FK
        VARCHAR(60) member_role
        DATETIME approved_at "optional"
        BOOLEAN is_active
    }
    CATEGORY {
        INT category_id PK
        VARCHAR(100) name UK
        TEXT description "optional"
        TEXT rules "optional, NEW"
        BOOLEAN is_active
    }
    ITEM {
        INT item_id PK
        INT posted_by_user_id FK
        INT owner_organization_id FK "optional"
        INT category_id FK
        VARCHAR(150) title
        TEXT description
        VARCHAR(40) item_condition
        VARCHAR(200) pickup_location
        DECIMAL(10,2) estimated_value "optional, NEW"
        VARCHAR(30) status
        DATETIME created_at
    }
    ITEM_IMAGE {
        INT image_id PK
        INT item_id FK
        VARCHAR(500) image_url
        INT display_order
    }
    RESERVATION {
        INT reservation_id PK
        INT item_id FK
        INT reserved_by_user_id FK
        INT receiver_organization_id FK "optional"
        DATETIME reserved_at
        DATETIME expires_at
        VARCHAR(30) status
        TEXT pickup_note "optional"
    }
    EXCHANGE {
        INT exchange_id PK
        INT reservation_id FK, UK
        DATETIME pickup_time
        VARCHAR(200) pickup_location
        DATETIME giver_confirmed_at "optional"
        DATETIME receiver_confirmed_at "optional"
        VARCHAR(30) status
        DATETIME completed_at "optional"
    }
    MESSAGE {
        INT message_id PK "NEW"
        INT sender_user_id FK "NEW"
        INT recipient_user_id FK "NEW"
        INT reservation_id FK "optional, NEW"
        TEXT body "NEW"
        DATETIME sent_at "NEW"
        BOOLEAN is_read "NEW"
    }
    COLLECTION_EVENT {
        INT event_id PK
        INT organization_id FK
        INT created_by_user_id FK
        VARCHAR(30) event_type
        VARCHAR(150) title
        TEXT description "optional"
        TEXT participation_instructions "optional, NEW"
        VARCHAR(200) location
        DATETIME start_at
        DATETIME end_at
        VARCHAR(30) status
    }
    EVENT_CATEGORY {
        INT event_id PK, FK "NEW"
        INT category_id PK, FK "NEW"
    }
    EVENT_ITEM {
        INT event_item_id PK
        INT event_id FK
        INT item_id FK, UK
        INT contributor_user_id FK
        VARCHAR(30) distribution_status
        DATETIME received_at "optional"
        DATETIME distributed_at "optional"
    }
    REPORT {
        INT report_id PK
        INT reporter_user_id FK
        INT reported_user_id FK "optional"
        INT reported_organization_id FK "optional, NEW"
        INT item_id FK "optional"
        INT exchange_id FK "optional"
        INT event_id FK "optional"
        VARCHAR(100) reason
        TEXT details "optional"
        VARCHAR(30) status
        DATETIME created_at
    }
    MODERATION_CASE {
        INT case_id PK
        INT report_id FK, UK
        INT assigned_to_user_id FK "optional"
        INT escalated_to_user_id FK "optional, NEW"
        DATETIME escalated_at "optional, NEW"
        VARCHAR(30) status
        TEXT findings "optional"
        TEXT resolution "optional"
        DATETIME closed_at "optional"
    }
    MODERATION_ACTION {
        INT action_id PK
        INT case_id FK
        INT performed_by_user_id FK
        VARCHAR(40) action_type
        DATETIME restriction_ends_at "optional"
        TEXT notes "optional"
        DATETIME created_at
    }
    NOTIFICATION {
        INT notification_id PK
        INT user_id FK
        VARCHAR(50) notification_type
        TEXT message
        BOOLEAN is_read
        DATETIME created_at
    }
    SYSTEM_SETTING {
        VARCHAR(100) setting_key PK
        TEXT setting_value
        INT updated_by_user_id FK "optional"
        DATETIME updated_at
    }
    ROLE ||--o{ USER : "has"
    ROLE ||--o{ ROLE_PERMISSION : "grants"
    PERMISSION ||--o{ ROLE_PERMISSION : "included in"
    ORGANIZATION ||--o{ ORGANIZATION_MEMBER : "has representatives"
    USER ||--o{ ORGANIZATION_MEMBER : "authorized as"
    USER ||--o{ ITEM : "posts"
    ORGANIZATION |o--o{ ITEM : "owns optionally"
    CATEGORY ||--o{ ITEM : "categorizes"
    ITEM ||--o{ ITEM_IMAGE : "has"
    ITEM ||--o{ RESERVATION : "reserved in"
    USER ||--o{ RESERVATION : "makes"
    ORGANIZATION |o--o{ RESERVATION : "receives optionally"
    RESERVATION ||--o| EXCHANGE : "completed through"
    USER ||--o{ MESSAGE : "sends / receives"
    RESERVATION |o--o{ MESSAGE : "discussed in"
    ORGANIZATION ||--o{ COLLECTION_EVENT : "hosts"
    USER ||--o{ COLLECTION_EVENT : "creates"
    COLLECTION_EVENT ||--o{ EVENT_CATEGORY : "accepts"
    CATEGORY ||--o{ EVENT_CATEGORY : "accepted by"
    COLLECTION_EVENT ||--o{ EVENT_ITEM : "collects"
    ITEM ||--o| EVENT_ITEM : "contributed as"
    USER ||--o{ EVENT_ITEM : "contributes"
    USER ||--o{ REPORT : "submits"
    USER |o--o{ REPORT : "is reported"
    ORGANIZATION |o--o{ REPORT : "is reported"
    ITEM |o--o{ REPORT : "is reported"
    EXCHANGE |o--o{ REPORT : "is reported"
    COLLECTION_EVENT |o--o{ REPORT : "is reported"
    REPORT ||--o| MODERATION_CASE : "may open"
    USER |o--o{ MODERATION_CASE : "assigned / escalated to"
    MODERATION_CASE ||--o{ MODERATION_ACTION : "has"
    USER ||--o{ MODERATION_ACTION : "performs"
    USER ||--o{ NOTIFICATION : "receives"
    USER |o--o{ SYSTEM_SETTING : "updates"
```
