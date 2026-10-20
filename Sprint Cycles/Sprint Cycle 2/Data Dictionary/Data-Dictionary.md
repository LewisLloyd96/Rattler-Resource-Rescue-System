# Data Dictionary – Rattler Resource Rescue System

This data dictionary describes every entity and field in the [ERD](../ERD/README.md). The same content is in `Rattler_Resource_Rescue_Data_Dictionary.xlsx`, which also has Entities, Relationships and ERD-changes tabs.

**Key Type:** PK = primary key, FK = foreign key, PK, FK = part of a composite primary key that is also a foreign key, Neither = not a key.  
Fields marked **NEW** were added in this revision to support the Functional Requirements (see [Changes](#changes-in-this-revision)).

## Entities

- [USER](#user)
- [ROLE](#role)
- [PERMISSION](#permission)
- [ROLE_PERMISSION](#role_permission)
- [ORGANIZATION](#organization)
- [ORGANIZATION_MEMBER](#organization_member)
- [CATEGORY](#category)
- [ITEM](#item)
- [ITEM_IMAGE](#item_image)
- [RESERVATION](#reservation)
- [EXCHANGE](#exchange)
- [MESSAGE](#message)
- [COLLECTION_EVENT](#collection_event)
- [EVENT_CATEGORY](#event_category)
- [EVENT_ITEM](#event_item)
- [REPORT](#report)
- [MODERATION_CASE](#moderation_case)
- [MODERATION_ACTION](#moderation_action)
- [NOTIFICATION](#notification)
- [SYSTEM_SETTING](#system_setting)

## USER

A person with an account (student, employee, representative, moderator or administrator).

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `user_id` | Unique identifier for the user | INT | PK | Yes | Auto-increment |
| `role_id` | User's system role | INT | FK | Yes | References ROLE.role_id |
| `first_name` | User's first name | VARCHAR(80) | Neither | Yes |  |
| `last_name` | User's last name | VARCHAR(80) | Neither | Yes |  |
| `email` | User's campus email address, used to sign in | VARCHAR(255) | Neither | Yes | Unique |
| `password_hash` | Hashed password | VARCHAR(255) | Neither | Yes | Never store plain-text passwords |
| `account_status` | Current state of the account | VARCHAR(30) | Neither | Yes | Active, Suspended, Banned, Deactivated |
| `created_at` | Date and time the account was created | DATETIME | Neither | Yes | Defaults to current time |

## ROLE

A system role that determines what a user is allowed to do.

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `role_id` | Unique identifier for the role | INT | PK | Yes | Auto-increment |
| `role_name` | Name of the role | VARCHAR(60) | Neither | Yes | Unique. Campus User, Department Representative, Student Organization Representative, Community Moderator, Administrator |

## PERMISSION

A single action the system can allow or deny (e.g. create listing, close moderation case).

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `permission_id` | Unique identifier for the permission | INT | PK | Yes | Auto-increment |
| `permission_code` | Short code used by the application to check the permission | VARCHAR(80) | Neither | Yes | Unique, e.g. item.create, case.close |
| `description` | Explanation of what the permission allows | TEXT | Neither | No |  |

## ROLE_PERMISSION

Associative entity that resolves the many-to-many relationship between ROLE and PERMISSION.

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `role_id` | Role that is granted the permission | INT | PK, FK | Yes | References ROLE.role_id. Composite PK with permission_id |
| `permission_id` | Permission granted to the role | INT | PK, FK | Yes | References PERMISSION.permission_id. Composite PK with role_id |

## ORGANIZATION

A university department or registered student organization that can give or receive items.

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `organization_id` | Unique identifier for the organization | INT | PK | Yes | Auto-increment |
| `organization_type` | Whether the organization is a department or a student organization | VARCHAR(30) | Neither | Yes | Department, Student Organization |
| `name` | Official name of the department or organization | VARCHAR(150) | Neither | Yes | Unique |
| `location` | Campus building or office location | VARCHAR(150) | Neither | No |  |
| `contact_email` | Contact email for the organization | VARCHAR(255) | Neither | No |  |
| `status` | Approval state of the organization record | VARCHAR(30) | Neither | Yes | Pending, Approved, Inactive. Set by an Administrator |

## ORGANIZATION_MEMBER

Associative entity that resolves the many-to-many relationship between USER and ORGANIZATION (authorized representatives).

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `membership_id` | Unique identifier for the membership record | INT | PK | Yes | Auto-increment |
| `organization_id` | Organization the user represents | INT | FK | Yes | References ORGANIZATION.organization_id |
| `user_id` | User who is authorized to act for the organization | INT | FK | Yes | References USER.user_id. (organization_id, user_id) is unique |
| `member_role` | User's role within the organization | VARCHAR(60) | Neither | Yes | e.g. Representative, Primary Contact |
| `approved_at` | Date and time the membership was approved | DATETIME | Neither | No | Empty until approved |
| `is_active` | Whether the user can currently act for the organization | BOOLEAN | Neither | Yes | Defaults to TRUE |

## CATEGORY

A type of item, used to organize and filter listings.

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `category_id` | Unique identifier for the category | INT | PK | Yes | Auto-increment |
| `name` | Name of the category | VARCHAR(100) | Neither | Yes | Unique, e.g. Textbooks, Electronics, Furniture |
| `description` | Description of what belongs in the category | TEXT | Neither | No |  |
| `rules` | Category-specific rules or restrictions | TEXT | Neither | No | NEW – add to ERD. Supports "Manage Categories" requirement |
| `is_active` | Whether the category can be used for new listings | BOOLEAN | Neither | Yes | Defaults to TRUE |

## ITEM

A listing for a reusable item offered by a user, department or student organization.

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `item_id` | Unique identifier for the item | INT | PK | Yes | Auto-increment |
| `posted_by_user_id` | User who created the listing | INT | FK | Yes | References USER.user_id |
| `owner_organization_id` | Department or organization that owns the item, if any | INT | FK | No | References ORGANIZATION.organization_id. Empty = owned by an individual user |
| `category_id` | Category the item belongs to | INT | FK | Yes | References CATEGORY.category_id |
| `title` | Item name shown in listings | VARCHAR(150) | Neither | Yes |  |
| `description` | Detailed description of the item | TEXT | Neither | Yes |  |
| `item_condition` | Physical condition of the item | VARCHAR(40) | Neither | Yes | New, Like New, Good, Fair, Poor |
| `pickup_location` | Where the item can be picked up or exchanged | VARCHAR(200) | Neither | Yes |  |
| `estimated_value` | Estimated dollar value, used for money-saved and reuse-value reports | DECIMAL(10,2) | Neither | No | NEW – add to ERD. Must be >= 0 |
| `status` | Current listing status | VARCHAR(30) | Neither | Yes | Available, Reserved, Completed, Cancelled, Removed |
| `created_at` | Date and time the listing was created | DATETIME | Neither | Yes | Defaults to current time |

## ITEM_IMAGE

A photograph attached to an item listing.

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `image_id` | Unique identifier for the image | INT | PK | Yes | Auto-increment |
| `item_id` | Item the photo belongs to | INT | FK | Yes | References ITEM.item_id |
| `image_url` | URL of the image in Cloudinary / S3 storage | VARCHAR(500) | Neither | Yes | Image file is not stored in the database |
| `display_order` | Order in which images are shown | INT | Neither | Yes | 1 = main photo |

## RESERVATION

A request by a user (optionally on behalf of an organization) to claim an item.

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `reservation_id` | Unique identifier for the reservation | INT | PK | Yes | Auto-increment |
| `item_id` | Item being reserved | INT | FK | Yes | References ITEM.item_id. Only one Active reservation per item |
| `reserved_by_user_id` | User who made the reservation | INT | FK | Yes | References USER.user_id |
| `receiver_organization_id` | Department or organization receiving the item, if any | INT | FK | No | References ORGANIZATION.organization_id. Empty = user receives it personally |
| `reserved_at` | Date and time the reservation was made | DATETIME | Neither | Yes | Defaults to current time |
| `expires_at` | When the reservation expires if not completed | DATETIME | Neither | Yes | Calculated from the reservation-expiration system setting |
| `status` | Current reservation status | VARCHAR(30) | Neither | Yes | Active, Completed, Cancelled, Expired |
| `pickup_note` | Notes for arranging pickup | TEXT | Neither | No |  |

## EXCHANGE

The pickup or transfer that completes a reservation.

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `exchange_id` | Unique identifier for the exchange | INT | PK | Yes | Auto-increment |
| `reservation_id` | Reservation being completed | INT | FK | Yes | References RESERVATION.reservation_id. Unique (one exchange per reservation) |
| `pickup_time` | Scheduled pickup or transfer time | DATETIME | Neither | Yes |  |
| `pickup_location` | Agreed pickup location | VARCHAR(200) | Neither | Yes |  |
| `giver_confirmed_at` | When the giver confirmed the exchange | DATETIME | Neither | No | Empty until confirmed |
| `receiver_confirmed_at` | When the receiver confirmed the exchange | DATETIME | Neither | No | Empty until confirmed |
| `status` | Current exchange status | VARCHAR(30) | Neither | Yes | Scheduled, Completed, Failed, Disputed |
| `completed_at` | When both sides confirmed completion | DATETIME | Neither | No | Set when both confirmations exist; item and reservation become Completed |

## MESSAGE

A message between users, used to arrange pickup or transfer.

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `message_id` | Unique identifier for the message | INT | PK | Yes | NEW – add to ERD. Auto-increment |
| `sender_user_id` | User who sent the message | INT | FK | Yes | NEW – add to ERD. References USER.user_id |
| `recipient_user_id` | User who receives the message | INT | FK | Yes | NEW – add to ERD. References USER.user_id |
| `reservation_id` | Reservation the conversation is about, if any | INT | FK | No | NEW – add to ERD. References RESERVATION.reservation_id |
| `body` | Message text | TEXT | Neither | Yes | NEW – add to ERD.  |
| `sent_at` | Date and time the message was sent | DATETIME | Neither | Yes | NEW – add to ERD. Defaults to current time |
| `is_read` | Whether the recipient has read the message | BOOLEAN | Neither | Yes | NEW – add to ERD. Defaults to FALSE |

## COLLECTION_EVENT

A group giveaway or collection drive run by a student organization.

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `event_id` | Unique identifier for the event | INT | PK | Yes | Auto-increment |
| `organization_id` | Organization hosting the event | INT | FK | Yes | References ORGANIZATION.organization_id (Student Organization) |
| `created_by_user_id` | Representative who created the event | INT | FK | Yes | References USER.user_id |
| `event_type` | Kind of event | VARCHAR(30) | Neither | Yes | Collection Drive, Giveaway |
| `title` | Event title | VARCHAR(150) | Neither | Yes |  |
| `description` | Event description | TEXT | Neither | No |  |
| `participation_instructions` | How to contribute or receive items | TEXT | Neither | No | NEW – add to ERD. Required by "Create Group Giveaway or Collection Drive" |
| `location` | Event location | VARCHAR(200) | Neither | Yes |  |
| `start_at` | Event start date and time | DATETIME | Neither | Yes |  |
| `end_at` | Event end date and time | DATETIME | Neither | Yes | Must be after start_at |
| `status` | Current event status | VARCHAR(30) | Neither | Yes | Planned, Active, Completed, Cancelled |

## EVENT_CATEGORY

Associative entity listing the item categories a collection event accepts (resolves COLLECTION_EVENT to CATEGORY many-to-many).

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `event_id` | Event that accepts the category | INT | PK, FK | Yes | NEW – add to ERD. References COLLECTION_EVENT.event_id. Composite PK |
| `category_id` | Category accepted by the event | INT | PK, FK | Yes | NEW – add to ERD. References CATEGORY.category_id. Composite PK |

## EVENT_ITEM

Associative entity linking an item to the collection event it was contributed to.

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `event_item_id` | Unique identifier for the event item record | INT | PK | Yes | Auto-increment |
| `event_id` | Event the item was contributed to | INT | FK | Yes | References COLLECTION_EVENT.event_id |
| `item_id` | Item that was contributed | INT | FK | Yes | References ITEM.item_id. Unique (an item belongs to at most one event) |
| `contributor_user_id` | User who contributed the item | INT | FK | Yes | References USER.user_id |
| `distribution_status` | Status of the item within the event | VARCHAR(30) | Neither | Yes | Pending, Accepted, Rejected, Available, Distributed |
| `received_at` | When the organization received the item | DATETIME | Neither | No |  |
| `distributed_at` | When the item was given out | DATETIME | Neither | No |  |

## REPORT

A problem report about a listing, user, organization, exchange or event.

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `report_id` | Unique identifier for the report | INT | PK | Yes | Auto-increment |
| `reporter_user_id` | User who submitted the report | INT | FK | Yes | References USER.user_id |
| `reported_user_id` | User being reported, if any | INT | FK | No | References USER.user_id |
| `reported_organization_id` | Department or organization being reported, if any | INT | FK | No | NEW – add to ERD. References ORGANIZATION.organization_id |
| `item_id` | Listing being reported, if any | INT | FK | No | References ITEM.item_id |
| `exchange_id` | Exchange being reported, if any | INT | FK | No | References EXCHANGE.exchange_id |
| `event_id` | Collection event being reported, if any | INT | FK | No | References COLLECTION_EVENT.event_id |
| `reason` | Category of problem | VARCHAR(100) | Neither | Yes | e.g. Inappropriate Listing, Damaged Item, Failed Exchange, Suspicious Activity |
| `details` | Reporter's description of the problem | TEXT | Neither | No |  |
| `status` | Current report status | VARCHAR(30) | Neither | Yes | Open, Under Review, Resolved, Dismissed |
| `created_at` | Date and time the report was submitted | DATETIME | Neither | Yes | At least one reported_* / item / exchange / event field must be filled |

## MODERATION_CASE

A moderator's case opened from a report.

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `case_id` | Unique identifier for the case | INT | PK | Yes | Auto-increment |
| `report_id` | Report that opened the case | INT | FK | Yes | References REPORT.report_id. Unique (one case per report) |
| `assigned_to_user_id` | Moderator handling the case | INT | FK | No | References USER.user_id |
| `escalated_to_user_id` | Administrator the case was escalated to, if any | INT | FK | No | NEW – add to ERD. References USER.user_id |
| `escalated_at` | When the case was escalated | DATETIME | Neither | No | NEW – add to ERD.  |
| `status` | Current case status | VARCHAR(30) | Neither | Yes | Open, In Progress, Escalated, Closed |
| `findings` | Moderator's findings | TEXT | Neither | No |  |
| `resolution` | Final resolution of the case | TEXT | Neither | No | Required before status = Closed |
| `closed_at` | When the case was closed | DATETIME | Neither | No |  |

## MODERATION_ACTION

An action taken on a case, such as a warning or temporary restriction.

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `action_id` | Unique identifier for the action | INT | PK | Yes | Auto-increment |
| `case_id` | Case the action belongs to | INT | FK | Yes | References MODERATION_CASE.case_id |
| `performed_by_user_id` | Moderator or administrator who took the action | INT | FK | Yes | References USER.user_id |
| `action_type` | Type of action taken | VARCHAR(40) | Neither | Yes | Warning, Listing Restriction, Reservation Restriction, Messaging Restriction, Listing Hidden, Listing Removed, Account Referred |
| `restriction_ends_at` | When a temporary restriction ends | DATETIME | Neither | No | Only for restriction actions |
| `notes` | Notes about the action | TEXT | Neither | No |  |
| `created_at` | Date and time the action was taken | DATETIME | Neither | Yes | Defaults to current time |

## NOTIFICATION

A message the system sends to a user about relevant activity.

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `notification_id` | Unique identifier for the notification | INT | PK | Yes | Auto-increment |
| `user_id` | User receiving the notification | INT | FK | Yes | References USER.user_id |
| `notification_type` | Kind of notification | VARCHAR(50) | Neither | Yes | e.g. Reservation Confirmed, Exchange Update, Drive Update, Report Resolved |
| `message` | Notification text | TEXT | Neither | Yes |  |
| `is_read` | Whether the user has read it | BOOLEAN | Neither | Yes | Defaults to FALSE |
| `created_at` | Date and time the notification was created | DATETIME | Neither | Yes | Defaults to current time |

## SYSTEM_SETTING

A configurable system-wide setting maintained by Administrators.

| Field | Description | Data Type | Key | Required | Constraints / Notes |
|---|---|---|---|---|---|
| `setting_key` | Unique name of the setting | VARCHAR(100) | PK | Yes | e.g. reservation_expiration_hours |
| `setting_value` | Value of the setting | TEXT | Neither | Yes |  |
| `updated_by_user_id` | Administrator who last changed the setting | INT | FK | No | References USER.user_id |
| `updated_at` | When the setting was last changed | DATETIME | Neither | Yes |  |

## Relationships

| Parent | Cardinality | Child | Relationship | Implemented By |
|---|---|---|---|---|
| ROLE | 1 : M | USER | A role is assigned to many users; each user has one role | USER.role_id |
| ROLE | M : N | PERMISSION | Roles are granted many permissions | ROLE_PERMISSION |
| USER | M : N | ORGANIZATION | Users represent organizations | ORGANIZATION_MEMBER |
| USER | 1 : M | ITEM | A user posts many items | ITEM.posted_by_user_id |
| ORGANIZATION | 1 : 0..M | ITEM | An organization optionally owns items | ITEM.owner_organization_id |
| CATEGORY | 1 : M | ITEM | Every item belongs to one category | ITEM.category_id |
| ITEM | 1 : M | ITEM_IMAGE | An item has many photos | ITEM_IMAGE.item_id |
| ITEM | 1 : M | RESERVATION | An item can be reserved many times over its life (one active at a time) | RESERVATION.item_id |
| USER | 1 : M | RESERVATION | A user makes many reservations | RESERVATION.reserved_by_user_id |
| ORGANIZATION | 1 : 0..M | RESERVATION | An organization optionally receives reserved items | RESERVATION.receiver_organization_id |
| RESERVATION | 1 : 0..1 | EXCHANGE | A reservation is completed through at most one exchange | EXCHANGE.reservation_id (unique) |
| USER | 1 : M | MESSAGE | A user sends and receives many messages (NEW) | MESSAGE.sender_user_id / recipient_user_id |
| RESERVATION | 1 : 0..M | MESSAGE | Messages optionally relate to a reservation (NEW) | MESSAGE.reservation_id |
| ORGANIZATION | 1 : M | COLLECTION_EVENT | A student organization hosts many events | COLLECTION_EVENT.organization_id |
| USER | 1 : M | COLLECTION_EVENT | A representative creates many events | COLLECTION_EVENT.created_by_user_id |
| COLLECTION_EVENT | M : N | CATEGORY | An event accepts many categories (NEW) | EVENT_CATEGORY |
| COLLECTION_EVENT | M : N | ITEM | An event collects many items; an item is in at most one event | EVENT_ITEM |
| USER | 1 : M | EVENT_ITEM | A user contributes many items to events | EVENT_ITEM.contributor_user_id |
| USER | 1 : M | REPORT | A user submits many reports | REPORT.reporter_user_id |
| USER / ORGANIZATION / ITEM / EXCHANGE / COLLECTION_EVENT | 1 : 0..M | REPORT | Each can optionally be the subject of reports | REPORT.reported_user_id, reported_organization_id, item_id, exchange_id, event_id |
| REPORT | 1 : 0..1 | MODERATION_CASE | A report may open one moderation case | MODERATION_CASE.report_id (unique) |
| USER | 1 : 0..M | MODERATION_CASE | A moderator is assigned cases; an admin receives escalations | MODERATION_CASE.assigned_to_user_id / escalated_to_user_id |
| MODERATION_CASE | 1 : 0..M | MODERATION_ACTION | A case has many actions | MODERATION_ACTION.case_id |
| USER | 1 : M | MODERATION_ACTION | A moderator performs many actions | MODERATION_ACTION.performed_by_user_id |
| USER | 1 : M | NOTIFICATION | A user receives many notifications | NOTIFICATION.user_id |
| USER | 1 : 0..M | SYSTEM_SETTING | An administrator updates settings | SYSTEM_SETTING.updated_by_user_id |

## Changes in this revision

| Entity | Change | Reason (Functional Requirement) |
|---|---|---|
| ITEM | Add estimated_value | Department/organization reports need "estimated reuse value"; admin reports need "money saved" |
| CATEGORY | Add rules | Admin "Manage Categories" includes category-specific rules or restrictions |
| COLLECTION_EVENT | Add participation_instructions | "Create Group Giveaway or Collection Drive" lists participation instructions |
| EVENT_CATEGORY | Add new associative entity | Drives must record "accepted item types"; resolves the event-to-category many-to-many |
| MESSAGE | Add new entity | Users "communicate… to arrange pickup", moderators restrict "messaging privileges", and the UI has a Messages page |
| REPORT | Add reported_organization_id | Reports can concern departments and student organizations |
| MODERATION_CASE | Add escalated_to_user_id, escalated_at | Moderators "escalate serious issues to an Administrator" |
| ERD title | Rename to "Rattler Resource Rescue System" | Match the project name used elsewhere |
