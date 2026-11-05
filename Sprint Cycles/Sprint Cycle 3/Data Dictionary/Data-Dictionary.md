# Data Dictionary – Rattler Resource Rescue System (Sprint Cycle III)

Generated from the implemented MySQL database by `Database/tools/generate_docs.py`, so it always matches `Database/01_schema.sql`. Fields marked **NEW** or **Changed in Sprint III** were added or changed while implementing the design.

**Key Type:** PK = primary key, FK = foreign key, PK, FK = part of a composite primary key that is also a foreign key.

## Entities

- [USER](#user) – A person with an account
- [ROLE](#role) – A system role that determines what a user is allowed to do
- [PERMISSION](#permission) – A single action the system can allow or deny
- [ROLE_PERMISSION](#role_permission) – Associative entity: resolves ROLE to PERMISSION many-to-many
- [ORGANIZATION](#organization) – A university department or registered student organization
- [ORGANIZATION_MEMBER](#organization_member) – Associative entity: resolves USER to ORGANIZATION many-to-many
- [AUDIT_LOG](#audit_log) – Administrator account actions and their justification
- [NOTIFICATION](#notification) – A message the system sends to a user
- [SYSTEM_SETTING](#system_setting) – A configurable system-wide setting
- [CATEGORY](#category) – A type of item, used to organize and filter listings
- [ITEM](#item) – A listing for a reusable item
- [ITEM_IMAGE](#item_image) – A photograph attached to an item listing
- [RESERVATION](#reservation) – A claim on an item by a user, optionally for an organization
- [EXCHANGE](#exchange) – The pickup or transfer that completes a reservation
- [MESSAGE](#message) – A message between users, used to arrange pickup
- [COLLECTION_EVENT](#collection_event) – A giveaway or collection drive run by a student organization
- [EVENT_CATEGORY](#event_category) – Associative entity: item types an event accepts
- [EVENT_ITEM](#event_item) – Associative entity: an item contributed to a collection event
- [REPORT](#report) – A problem report about a listing, user, organization, exchange or event
- [MODERATION_CASE](#moderation_case) – A moderator's case opened from a report
- [MODERATION_ACTION](#moderation_action) – An action taken on a moderation case

## USER

A person with an account

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `user_id` | Unique identifier for the user | INT | PK | Yes | Auto-increment. |
| `role_id` | The user's system role | INT | FK | Yes | References ROLE.role_id. |
| `first_name` | First name | VARCHAR(80) | Neither | Yes |  |
| `last_name` | Last name | VARCHAR(80) | Neither | Yes |  |
| `email` | Campus email used to sign in; must be @famu.edu | VARCHAR(255) | Neither | Yes | Changed in Sprint III. Unique. CHECK chk_user_campus_email: (email like '%_@famu.edu'). |
| `email_verified_at` | When the campus email was verified; required to list or reserve | DATETIME | Neither | No | NEW in Sprint III. |
| `password_hash` | Hashed password; plain text is never stored | VARCHAR(255) | Neither | Yes |  |
| `account_status` | Active, Suspended, Banned or Deactivated | VARCHAR(30) | Neither | Yes | Default Active. CHECK chk_user_status: (account_status in ('Active','Suspended','Banned','Deactivated')). |
| `created_at` | When the account was created | DATETIME | Neither | Yes | Default now. |

## ROLE

A system role that determines what a user is allowed to do

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `role_id` | Unique identifier for the role | INT | PK | Yes | Auto-increment. |
| `role_name` | Name of the role | VARCHAR(60) | Neither | Yes | Unique. CHECK chk_role_name: (role_name in ('Campus User','Department Representative','Student Organization Representative','Community Moderator','Administrator')). |

## PERMISSION

A single action the system can allow or deny

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `permission_id` | Unique identifier for the permission | INT | PK | Yes | Auto-increment. |
| `permission_code` | Code the application checks, e.g. item.create | VARCHAR(80) | Neither | Yes | Unique. |
| `description` | What the permission allows | TEXT | Neither | No |  |

## ROLE_PERMISSION

Associative entity: resolves ROLE to PERMISSION many-to-many

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `role_id` | Role that is granted the permission | INT | PK, FK | Yes | References ROLE.role_id. |
| `permission_id` | Permission granted to the role | INT | PK, FK | Yes | References PERMISSION.permission_id. |

## ORGANIZATION

A university department or registered student organization

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `organization_id` | Unique identifier for the organization | INT | PK | Yes | Auto-increment. |
| `organization_type` | Department or Student Organization | VARCHAR(30) | Neither | Yes | CHECK chk_org_type: (organization_type in ('Department','Student Organization')). |
| `name` | Official name | VARCHAR(150) | Neither | Yes | Unique. |
| `location` | Campus building or office | VARCHAR(150) | Neither | No |  |
| `contact_email` | Contact email | VARCHAR(255) | Neither | No |  |
| `status` | Pending, Approved or Inactive; set by an Administrator | VARCHAR(30) | Neither | Yes | Default Pending. CHECK chk_org_status: (status in ('Pending','Approved','Inactive')). |

## ORGANIZATION_MEMBER

Associative entity: resolves USER to ORGANIZATION many-to-many

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `membership_id` | Unique identifier for the membership | INT | PK | Yes | Auto-increment. |
| `organization_id` | Organization the user represents | INT | FK | Yes | Unique together (organization_id, user_id). References ORGANIZATION.organization_id. |
| `user_id` | User authorized to act for the organization | INT | FK | Yes | Unique together (organization_id, user_id). References USER.user_id. |
| `member_role` | Representative or Primary Contact | VARCHAR(60) | Neither | Yes | Default Representative. CHECK chk_member_role: (member_role in ('Representative','Primary Contact')). |
| `approved_at` | When the membership was approved | DATETIME | Neither | No |  |
| `is_active` | Whether the user can currently act for the organization | BOOLEAN | Neither | Yes | Default TRUE. |

## AUDIT_LOG

Administrator account actions and their justification

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `log_id` | Unique identifier for the log entry | INT | PK | Yes | NEW in Sprint III. Auto-increment. |
| `actor_user_id` | Administrator who made the change | INT | FK | Yes | NEW in Sprint III. References USER.user_id. |
| `target_user_id` | Account that was changed, if any | INT | FK | No | NEW in Sprint III. References USER.user_id. |
| `action` | What changed, e.g. account_status: Active -> Suspended | VARCHAR(60) | Neither | Yes | NEW in Sprint III. |
| `justification` | Why the change was made (required) | TEXT | Neither | Yes | NEW in Sprint III. |
| `created_at` | When the change was made | DATETIME | Neither | Yes | NEW in Sprint III. Default now. |

## NOTIFICATION

A message the system sends to a user

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `notification_id` | Unique identifier for the notification | INT | PK | Yes | Auto-increment. |
| `user_id` | User receiving the notification | INT | FK | Yes | References USER.user_id. |
| `notification_type` | e.g. Reservation Confirmed, Exchange Update | VARCHAR(50) | Neither | Yes |  |
| `message` | Notification text | TEXT | Neither | Yes |  |
| `is_read` | Whether the user has read it | BOOLEAN | Neither | Yes | Default FALSE. |
| `created_at` | When it was created | DATETIME | Neither | Yes | Default now. |

## SYSTEM_SETTING

A configurable system-wide setting

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `setting_key` | Unique name of the setting | VARCHAR(100) | PK | Yes |  |
| `setting_value` | Value of the setting | TEXT | Neither | Yes |  |
| `updated_by_user_id` | Administrator who last changed it | INT | FK | No | References USER.user_id. |
| `updated_at` | When it was last changed | DATETIME | Neither | Yes | Default now. |

## CATEGORY

A type of item, used to organize and filter listings

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `category_id` | Unique identifier for the category | INT | PK | Yes | Auto-increment. |
| `name` | Category name, e.g. Textbooks | VARCHAR(100) | Neither | Yes | Unique. |
| `description` | What belongs in the category | TEXT | Neither | No |  |
| `rules` | Category-specific rules or restrictions | TEXT | Neither | No |  |
| `is_active` | Whether new listings can use the category | BOOLEAN | Neither | Yes | Default TRUE. |

## ITEM

A listing for a reusable item

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `item_id` | Unique identifier for the item | INT | PK | Yes | Auto-increment. |
| `posted_by_user_id` | User who created the listing | INT | FK | Yes | References USER.user_id. |
| `owner_organization_id` | Owning department or organization; empty = owned by the user | INT | FK | No | References ORGANIZATION.organization_id. |
| `category_id` | Category the item belongs to | INT | FK | Yes | References CATEGORY.category_id. |
| `title` | Item name shown in listings | VARCHAR(150) | Neither | Yes |  |
| `description` | Detailed description | TEXT | Neither | Yes |  |
| `item_condition` | New, Like New, Good, Fair or Poor | VARCHAR(40) | Neither | Yes | CHECK chk_item_condition: (item_condition in ('New','Like New','Good','Fair','Poor')). |
| `quantity` | Number of identical units (giveaways can list several) | INT | Neither | Yes | NEW in Sprint III. Default 1. CHECK chk_item_quantity: (quantity >= 1). |
| `pickup_location` | Where the item can be picked up | VARCHAR(200) | Neither | Yes |  |
| `estimated_value` | Estimated dollar value, for money-saved reports | DECIMAL(10,2) | Neither | No | CHECK chk_item_value: ((estimated_value is null) or (estimated_value >= 0)). |
| `status` | Pending Review, Available, Reserved, Completed, Cancelled or Removed | VARCHAR(30) | Neither | Yes | Changed in Sprint III. Default Pending Review. CHECK chk_item_status: (status in ('Pending Review','Available','Reserved','Completed','Cancelled','Removed')). |
| `created_at` | When the listing was created | DATETIME | Neither | Yes | Default now. |

## ITEM_IMAGE

A photograph attached to an item listing

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `image_id` | Unique identifier for the image | INT | PK | Yes | Auto-increment. |
| `item_id` | Item the photo belongs to | INT | FK | Yes | Unique together (item_id, display_order). References ITEM.item_id. |
| `image_url` | URL in Cloudinary/S3; the file is not stored in the database | VARCHAR(500) | Neither | Yes |  |
| `display_order` | Display order; 1 = main photo | INT | Neither | Yes | Unique together (item_id, display_order). Default 1. CHECK chk_image_order: (display_order >= 1). |

## RESERVATION

A claim on an item by a user, optionally for an organization

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `reservation_id` | Unique identifier for the reservation | INT | PK | Yes | Auto-increment. |
| `item_id` | Item being reserved | INT | FK | Yes | References ITEM.item_id. |
| `reserved_by_user_id` | User who made the reservation | INT | FK | Yes | References USER.user_id. |
| `receiver_organization_id` | Department or organization receiving the item; empty = personal | INT | FK | No | References ORGANIZATION.organization_id. |
| `reserved_at` | When the reservation was made | DATETIME | Neither | Yes | Default now. CHECK chk_res_expires: (expires_at > reserved_at). |
| `expires_at` | When it expires if not completed; set from system settings | DATETIME | Neither | Yes | CHECK chk_res_expires: (expires_at > reserved_at). |
| `status` | Pending, Active, Completed, Cancelled or Expired | VARCHAR(30) | Neither | Yes | Changed in Sprint III. Default Active. CHECK chk_res_status: (status in ('Pending','Active','Completed','Cancelled','Expired')). |
| `pickup_note` | Notes for arranging pickup | TEXT | Neither | No |  |
| `open_item_id` | Generated: item_id while Pending/Active, else NULL | INT | Neither | Generated | NEW in Sprint III. Generated (stored). Unique. |

## EXCHANGE

The pickup or transfer that completes a reservation

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `exchange_id` | Unique identifier for the exchange | INT | PK | Yes | Auto-increment. |
| `reservation_id` | Reservation being completed (one exchange per reservation) | INT | FK | Yes | Unique. References RESERVATION.reservation_id. |
| `pickup_time` | Scheduled pickup or transfer time | DATETIME | Neither | Yes |  |
| `pickup_location` | Agreed pickup location | VARCHAR(200) | Neither | Yes |  |
| `giver_confirmed_at` | When the giver confirmed the handover | DATETIME | Neither | No | CHECK chk_exchange_both_confirmed: ((status <> 'Completed') or ((giver_confirmed_at is not null) and (receiver_confirmed_at is not null) and (completed_at is not null))). |
| `receiver_confirmed_at` | When the receiver confirmed the pickup | DATETIME | Neither | No | CHECK chk_exchange_both_confirmed: ((status <> 'Completed') or ((giver_confirmed_at is not null) and (receiver_confirmed_at is not null) and (completed_at is not null))). |
| `status` | Scheduled, Completed, Failed or Disputed | VARCHAR(30) | Neither | Yes | Default Scheduled. CHECK chk_exchange_status: (status in ('Scheduled','Completed','Failed','Disputed')). CHECK chk_exchange_both_confirmed: ((status <> 'Completed') or ((giver_confirmed_at is not null) and (receiver_confirmed_at is not null) and (completed_at is not null))). |
| `completed_at` | Set when both sides have confirmed | DATETIME | Neither | No | CHECK chk_exchange_both_confirmed: ((status <> 'Completed') or ((giver_confirmed_at is not null) and (receiver_confirmed_at is not null) and (completed_at is not null))). |

## MESSAGE

A message between users, used to arrange pickup

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `message_id` | Unique identifier for the message | INT | PK | Yes | Auto-increment. |
| `sender_user_id` | User who sent the message | INT | FK | Yes | References USER.user_id. CHECK chk_message_not_self: (sender_user_id <> recipient_user_id). |
| `recipient_user_id` | User who receives the message | INT | FK | Yes | References USER.user_id. CHECK chk_message_not_self: (sender_user_id <> recipient_user_id). |
| `reservation_id` | Reservation the conversation is about, if any | INT | FK | No | References RESERVATION.reservation_id. |
| `body` | Message text | TEXT | Neither | Yes |  |
| `sent_at` | When the message was sent | DATETIME | Neither | Yes | Default now. |
| `is_read` | Whether the recipient has read it | BOOLEAN | Neither | Yes | Default FALSE. |

## COLLECTION_EVENT

A giveaway or collection drive run by a student organization

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `event_id` | Unique identifier for the event | INT | PK | Yes | Auto-increment. |
| `organization_id` | Student organization hosting the event | INT | FK | Yes | References ORGANIZATION.organization_id. |
| `created_by_user_id` | Representative who created the event | INT | FK | Yes | References USER.user_id. |
| `event_type` | Collection Drive or Giveaway | VARCHAR(30) | Neither | Yes | CHECK chk_event_type: (event_type in ('Collection Drive','Giveaway')). |
| `title` | Event title | VARCHAR(150) | Neither | Yes |  |
| `description` | Event description | TEXT | Neither | No |  |
| `participation_instructions` | How to contribute or receive items | TEXT | Neither | No |  |
| `location` | Event location | VARCHAR(200) | Neither | Yes |  |
| `start_at` | Start date and time | DATETIME | Neither | Yes | CHECK chk_event_dates: (end_at > start_at). |
| `end_at` | End date and time | DATETIME | Neither | Yes | CHECK chk_event_dates: (end_at > start_at). |
| `status` | Planned, Active, Completed or Cancelled | VARCHAR(30) | Neither | Yes | Default Planned. CHECK chk_event_status: (status in ('Planned','Active','Completed','Cancelled')). |

## EVENT_CATEGORY

Associative entity: item types an event accepts

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `event_id` | Event that accepts the category | INT | PK, FK | Yes | References COLLECTION_EVENT.event_id. |
| `category_id` | Category accepted by the event | INT | PK, FK | Yes | References CATEGORY.category_id. |

## EVENT_ITEM

Associative entity: an item contributed to a collection event

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `event_item_id` | Unique identifier for the event item | INT | PK | Yes | Auto-increment. |
| `event_id` | Event the item was contributed to | INT | FK | Yes | References COLLECTION_EVENT.event_id. |
| `item_id` | Item that was contributed | INT | FK | Yes | Unique. References ITEM.item_id. |
| `contributor_user_id` | User who contributed the item | INT | FK | Yes | References USER.user_id. |
| `distribution_status` | Pending, Accepted, Rejected, Available or Distributed | VARCHAR(30) | Neither | Yes | Default Pending. CHECK chk_distribution_status: (distribution_status in ('Pending','Accepted','Rejected','Available','Distributed')). |
| `received_at` | When the organization received the item | DATETIME | Neither | No |  |
| `distributed_at` | When the item was given out | DATETIME | Neither | No |  |

## REPORT

A problem report about a listing, user, organization, exchange or event

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `report_id` | Unique identifier for the report | INT | PK | Yes | Auto-increment. |
| `reporter_user_id` | User who submitted the report | INT | FK | Yes | References USER.user_id. |
| `reported_user_id` | User being reported, if any | INT | FK | No | References USER.user_id. CHECK chk_report_has_target: ((reported_user_id is not null) or (reported_organization_id is not null) or (item_id is not null) or (exchange_id is not null) or (event_id is not null)). |
| `reported_organization_id` | Department or organization being reported, if any | INT | FK | No | References ORGANIZATION.organization_id. CHECK chk_report_has_target: ((reported_user_id is not null) or (reported_organization_id is not null) or (item_id is not null) or (exchange_id is not null) or (event_id is not null)). |
| `item_id` | Listing being reported, if any | INT | FK | No | References ITEM.item_id. CHECK chk_report_has_target: ((reported_user_id is not null) or (reported_organization_id is not null) or (item_id is not null) or (exchange_id is not null) or (event_id is not null)). |
| `exchange_id` | Exchange being reported, if any | INT | FK | No | References EXCHANGE.exchange_id. CHECK chk_report_has_target: ((reported_user_id is not null) or (reported_organization_id is not null) or (item_id is not null) or (exchange_id is not null) or (event_id is not null)). |
| `event_id` | Collection event being reported, if any | INT | FK | No | References COLLECTION_EVENT.event_id. CHECK chk_report_has_target: ((reported_user_id is not null) or (reported_organization_id is not null) or (item_id is not null) or (exchange_id is not null) or (event_id is not null)). |
| `reason` | Category of problem | VARCHAR(100) | Neither | Yes |  |
| `details` | Reporter's description | TEXT | Neither | No |  |
| `status` | Open, Under Review, Resolved or Dismissed | VARCHAR(30) | Neither | Yes | Default Open. CHECK chk_report_status: (status in ('Open','Under Review','Resolved','Dismissed')). |
| `created_at` | When the report was submitted | DATETIME | Neither | Yes | Default now. |

## MODERATION_CASE

A moderator's case opened from a report

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `case_id` | Unique identifier for the case | INT | PK | Yes | Auto-increment. |
| `report_id` | Report that opened the case (one case per report) | INT | FK | Yes | Unique. References REPORT.report_id. |
| `assigned_to_user_id` | Moderator handling the case | INT | FK | No | References USER.user_id. |
| `escalated_to_user_id` | Administrator the case was escalated to | INT | FK | No | References USER.user_id. CHECK chk_case_escalation: ((status <> 'Escalated') or (escalated_to_user_id is not null)). |
| `escalated_at` | When the case was escalated | DATETIME | Neither | No |  |
| `status` | Open, In Progress, Escalated or Closed | VARCHAR(30) | Neither | Yes | Default Open. CHECK chk_case_status: (status in ('Open','In Progress','Escalated','Closed')). CHECK chk_case_closed_has_resolution: ((status <> 'Closed') or ((resolution is not null) and (closed_at is not null))). CHECK chk_case_escalation: ((status <> 'Escalated') or (escalated_to_user_id is not null)). |
| `findings` | Moderator's findings | TEXT | Neither | No |  |
| `resolution` | Final resolution; required to close | TEXT | Neither | No | CHECK chk_case_closed_has_resolution: ((status <> 'Closed') or ((resolution is not null) and (closed_at is not null))). |
| `closed_at` | When the case was closed | DATETIME | Neither | No | CHECK chk_case_closed_has_resolution: ((status <> 'Closed') or ((resolution is not null) and (closed_at is not null))). |

## MODERATION_ACTION

An action taken on a moderation case

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `action_id` | Unique identifier for the action | INT | PK | Yes | Auto-increment. |
| `case_id` | Case the action belongs to | INT | FK | Yes | References MODERATION_CASE.case_id. |
| `performed_by_user_id` | Moderator or administrator who took the action | INT | FK | Yes | References USER.user_id. |
| `action_type` | Warning, a restriction, Listing Hidden/Removed or Account Referred | VARCHAR(40) | Neither | Yes | CHECK chk_action_type: (action_type in ('Warning','Listing Restriction','Reservation Restriction','Messaging Restriction','Listing Hidden','Listing Removed','Account Referred')). CHECK chk_action_restriction_end: ((not((action_type like '%Restriction'))) or (restriction_ends_at is not null)). |
| `reason` | Why the action was taken (required for the audit trail) | VARCHAR(255) | Neither | Yes | NEW in Sprint III. |
| `restriction_ends_at` | When a temporary restriction ends | DATETIME | Neither | No | CHECK chk_action_restriction_end: ((not((action_type like '%Restriction'))) or (restriction_ends_at is not null)). |
| `notes` | Additional notes | TEXT | Neither | No |  |
| `created_at` | When the action was taken | DATETIME | Neither | Yes | Default now. |

## Relationships

| Parent | Cardinality | Child | Foreign Key |
|---|---|---|---|
| USER | 1 : 0..M | AUDIT_LOG | `actor_user_id` |
| USER | 0..1 : 0..M | AUDIT_LOG | `target_user_id` |
| USER | 1 : 0..M | COLLECTION_EVENT | `created_by_user_id` |
| ORGANIZATION | 1 : 0..M | COLLECTION_EVENT | `organization_id` |
| CATEGORY | 1 : 0..M | EVENT_CATEGORY | `category_id` |
| COLLECTION_EVENT | 1 : 0..M | EVENT_CATEGORY | `event_id` |
| USER | 1 : 0..M | EVENT_ITEM | `contributor_user_id` |
| COLLECTION_EVENT | 1 : 0..M | EVENT_ITEM | `event_id` |
| ITEM | 1 : 0..1 | EVENT_ITEM | `item_id` |
| RESERVATION | 1 : 0..1 | EXCHANGE | `reservation_id` |
| CATEGORY | 1 : 0..M | ITEM | `category_id` |
| ORGANIZATION | 0..1 : 0..M | ITEM | `owner_organization_id` |
| USER | 1 : 0..M | ITEM | `posted_by_user_id` |
| ITEM | 1 : 0..M | ITEM_IMAGE | `item_id` |
| USER | 1 : 0..M | MESSAGE | `recipient_user_id` |
| RESERVATION | 0..1 : 0..M | MESSAGE | `reservation_id` |
| USER | 1 : 0..M | MESSAGE | `sender_user_id` |
| MODERATION_CASE | 1 : 0..M | MODERATION_ACTION | `case_id` |
| USER | 1 : 0..M | MODERATION_ACTION | `performed_by_user_id` |
| USER | 0..1 : 0..M | MODERATION_CASE | `assigned_to_user_id` |
| USER | 0..1 : 0..M | MODERATION_CASE | `escalated_to_user_id` |
| REPORT | 1 : 0..1 | MODERATION_CASE | `report_id` |
| USER | 1 : 0..M | NOTIFICATION | `user_id` |
| ORGANIZATION | 1 : 0..M | ORGANIZATION_MEMBER | `organization_id` |
| USER | 1 : 0..M | ORGANIZATION_MEMBER | `user_id` |
| COLLECTION_EVENT | 0..1 : 0..M | REPORT | `event_id` |
| EXCHANGE | 0..1 : 0..M | REPORT | `exchange_id` |
| ITEM | 0..1 : 0..M | REPORT | `item_id` |
| ORGANIZATION | 0..1 : 0..M | REPORT | `reported_organization_id` |
| USER | 1 : 0..M | REPORT | `reporter_user_id` |
| USER | 0..1 : 0..M | REPORT | `reported_user_id` |
| ITEM | 1 : 0..M | RESERVATION | `item_id` |
| ORGANIZATION | 0..1 : 0..M | RESERVATION | `receiver_organization_id` |
| USER | 1 : 0..M | RESERVATION | `reserved_by_user_id` |
| PERMISSION | 1 : 0..M | ROLE_PERMISSION | `permission_id` |
| ROLE | 1 : 0..M | ROLE_PERMISSION | `role_id` |
| USER | 0..1 : 0..M | SYSTEM_SETTING | `updated_by_user_id` |
| ROLE | 1 : 0..M | USER | `role_id` |

## Sprint III changes

| Entity | Field | New / Changed | Change and reason |
|---|---|---|---|
| USER | email_verified_at | New | Business rule: a verified campus email is required to list or reserve |
| USER | email | Changed | CHECK constraint: must be a @famu.edu campus email |
| ITEM | quantity | New | Business rule: giveaway listings must state a quantity |
| ITEM | status | Changed | Added "Pending Review" for the moderator Review Listings screen |
| RESERVATION | status | Changed | Added "Pending" for the department Approve Requests screen |
| RESERVATION | open_item_id | New | Generated column + unique index: one open reservation per item |
| MODERATION_ACTION | reason | New | Business rule: every moderation action records a reason (was optional notes) |
| AUDIT_LOG | (new table) | New | New table: administrator account actions must log a justification |
