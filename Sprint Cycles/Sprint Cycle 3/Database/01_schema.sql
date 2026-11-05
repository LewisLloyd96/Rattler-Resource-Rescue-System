-- =====================================================================
-- Rattler Resource Rescue System — Database Schema (MySQL 8.0+)
-- Sprint Cycle III: Database Implementation
--
-- Creates the database, all 21 tables, keys, constraints, indexes,
-- views, triggers, a stored procedure and a scheduled event.
-- Safe to re-run: it drops and recreates the database.
--
-- Run:  mysql -u root -p < 01_schema.sql
-- =====================================================================

DROP DATABASE IF EXISTS rattler_resource_rescue;
CREATE DATABASE rattler_resource_rescue
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE rattler_resource_rescue;

-- ---------------------------------------------------------------------
-- 1. Users, roles and permissions
-- ---------------------------------------------------------------------

CREATE TABLE role (
  role_id     INT          NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the role',
  role_name   VARCHAR(60)  NOT NULL COMMENT 'Name of the role',
  PRIMARY KEY (role_id),
  CONSTRAINT uq_role_name UNIQUE (role_name),
  CONSTRAINT chk_role_name CHECK (role_name IN ('Campus User', 'Department Representative',
    'Student Organization Representative', 'Community Moderator', 'Administrator'))
) ENGINE=InnoDB COMMENT='A system role that determines what a user is allowed to do';

CREATE TABLE permission (
  permission_id    INT          NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the permission',
  permission_code  VARCHAR(80)  NOT NULL COMMENT 'Code the application checks, e.g. item.create',
  description      TEXT         NULL     COMMENT 'What the permission allows',
  PRIMARY KEY (permission_id),
  CONSTRAINT uq_permission_code UNIQUE (permission_code)
) ENGINE=InnoDB COMMENT='A single action the system can allow or deny';

CREATE TABLE role_permission (
  role_id        INT NOT NULL COMMENT 'Role that is granted the permission',
  permission_id  INT NOT NULL COMMENT 'Permission granted to the role',
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role       FOREIGN KEY (role_id)       REFERENCES role (role_id)             ON DELETE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permission (permission_id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Associative entity: resolves ROLE to PERMISSION many-to-many';

CREATE TABLE user (
  user_id            INT           NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the user',
  role_id            INT           NOT NULL COMMENT 'The user''s system role',
  first_name         VARCHAR(80)   NOT NULL COMMENT 'First name',
  last_name          VARCHAR(80)   NOT NULL COMMENT 'Last name',
  email              VARCHAR(255)  NOT NULL COMMENT 'Campus email used to sign in; must be @famu.edu',
  email_verified_at  DATETIME      NULL     COMMENT 'When the campus email was verified; required to list or reserve',
  password_hash      VARCHAR(255)  NOT NULL COMMENT 'Hashed password; plain text is never stored',
  account_status     VARCHAR(30)   NOT NULL DEFAULT 'Active' COMMENT 'Active, Suspended, Banned or Deactivated',
  created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the account was created',
  PRIMARY KEY (user_id),
  CONSTRAINT uq_user_email UNIQUE (email),
  CONSTRAINT chk_user_campus_email CHECK (email LIKE '%_@famu.edu'),
  CONSTRAINT chk_user_status CHECK (account_status IN ('Active', 'Suspended', 'Banned', 'Deactivated')),
  CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES role (role_id),
  INDEX idx_user_name (last_name, first_name)
) ENGINE=InnoDB COMMENT='A person with an account';

-- ---------------------------------------------------------------------
-- 2. Departments and student organizations
-- ---------------------------------------------------------------------

CREATE TABLE organization (
  organization_id    INT           NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the organization',
  organization_type  VARCHAR(30)   NOT NULL COMMENT 'Department or Student Organization',
  name               VARCHAR(150)  NOT NULL COMMENT 'Official name',
  location           VARCHAR(150)  NULL     COMMENT 'Campus building or office',
  contact_email      VARCHAR(255)  NULL     COMMENT 'Contact email',
  status             VARCHAR(30)   NOT NULL DEFAULT 'Pending' COMMENT 'Pending, Approved or Inactive; set by an Administrator',
  PRIMARY KEY (organization_id),
  CONSTRAINT uq_organization_name UNIQUE (name),
  CONSTRAINT chk_org_type   CHECK (organization_type IN ('Department', 'Student Organization')),
  CONSTRAINT chk_org_status CHECK (status IN ('Pending', 'Approved', 'Inactive'))
) ENGINE=InnoDB COMMENT='A university department or registered student organization';

CREATE TABLE organization_member (
  membership_id    INT          NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the membership',
  organization_id  INT          NOT NULL COMMENT 'Organization the user represents',
  user_id          INT          NOT NULL COMMENT 'User authorized to act for the organization',
  member_role      VARCHAR(60)  NOT NULL DEFAULT 'Representative' COMMENT 'Representative or Primary Contact',
  approved_at      DATETIME     NULL     COMMENT 'When the membership was approved',
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE COMMENT 'Whether the user can currently act for the organization',
  PRIMARY KEY (membership_id),
  CONSTRAINT uq_org_member UNIQUE (organization_id, user_id),
  CONSTRAINT chk_member_role CHECK (member_role IN ('Representative', 'Primary Contact')),
  CONSTRAINT fk_om_org  FOREIGN KEY (organization_id) REFERENCES organization (organization_id) ON DELETE CASCADE,
  CONSTRAINT fk_om_user FOREIGN KEY (user_id)         REFERENCES user (user_id)                 ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Associative entity: resolves USER to ORGANIZATION many-to-many';

-- ---------------------------------------------------------------------
-- 3. Listings, reservations, exchanges and messages
-- ---------------------------------------------------------------------

CREATE TABLE category (
  category_id  INT           NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the category',
  name         VARCHAR(100)  NOT NULL COMMENT 'Category name, e.g. Textbooks',
  description  TEXT          NULL     COMMENT 'What belongs in the category',
  rules        TEXT          NULL     COMMENT 'Category-specific rules or restrictions',
  is_active    BOOLEAN       NOT NULL DEFAULT TRUE COMMENT 'Whether new listings can use the category',
  PRIMARY KEY (category_id),
  CONSTRAINT uq_category_name UNIQUE (name)
) ENGINE=InnoDB COMMENT='A type of item, used to organize and filter listings';

CREATE TABLE item (
  item_id                INT            NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the item',
  posted_by_user_id      INT            NOT NULL COMMENT 'User who created the listing',
  owner_organization_id  INT            NULL     COMMENT 'Owning department or organization; empty = owned by the user',
  category_id            INT            NOT NULL COMMENT 'Category the item belongs to',
  title                  VARCHAR(150)   NOT NULL COMMENT 'Item name shown in listings',
  description            TEXT           NOT NULL COMMENT 'Detailed description',
  item_condition         VARCHAR(40)    NOT NULL COMMENT 'New, Like New, Good, Fair or Poor',
  quantity               INT            NOT NULL DEFAULT 1 COMMENT 'Number of identical units (giveaways can list several)',
  pickup_location        VARCHAR(200)   NOT NULL COMMENT 'Where the item can be picked up',
  estimated_value        DECIMAL(10,2)  NULL     COMMENT 'Estimated dollar value, for money-saved reports',
  status                 VARCHAR(30)    NOT NULL DEFAULT 'Pending Review' COMMENT 'Pending Review, Available, Reserved, Completed, Cancelled or Removed',
  created_at             DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the listing was created',
  PRIMARY KEY (item_id),
  CONSTRAINT chk_item_condition CHECK (item_condition IN ('New', 'Like New', 'Good', 'Fair', 'Poor')),
  CONSTRAINT chk_item_status    CHECK (status IN ('Pending Review', 'Available', 'Reserved', 'Completed', 'Cancelled', 'Removed')),
  CONSTRAINT chk_item_quantity  CHECK (quantity >= 1),
  CONSTRAINT chk_item_value     CHECK (estimated_value IS NULL OR estimated_value >= 0),
  CONSTRAINT fk_item_poster   FOREIGN KEY (posted_by_user_id)     REFERENCES user (user_id),
  CONSTRAINT fk_item_owner    FOREIGN KEY (owner_organization_id) REFERENCES organization (organization_id) ON DELETE SET NULL,
  CONSTRAINT fk_item_category FOREIGN KEY (category_id)           REFERENCES category (category_id),
  INDEX idx_item_status_category (status, category_id),
  FULLTEXT INDEX ftx_item_search (title, description)
) ENGINE=InnoDB COMMENT='A listing for a reusable item';

CREATE TABLE item_image (
  image_id       INT           NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the image',
  item_id        INT           NOT NULL COMMENT 'Item the photo belongs to',
  image_url      VARCHAR(500)  NOT NULL COMMENT 'URL in Cloudinary/S3; the file is not stored in the database',
  display_order  INT           NOT NULL DEFAULT 1 COMMENT 'Display order; 1 = main photo',
  PRIMARY KEY (image_id),
  CONSTRAINT uq_item_image_order UNIQUE (item_id, display_order),
  CONSTRAINT chk_image_order CHECK (display_order >= 1),
  CONSTRAINT fk_image_item FOREIGN KEY (item_id) REFERENCES item (item_id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='A photograph attached to an item listing';

CREATE TABLE reservation (
  reservation_id            INT          NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the reservation',
  item_id                   INT          NOT NULL COMMENT 'Item being reserved',
  reserved_by_user_id       INT          NOT NULL COMMENT 'User who made the reservation',
  receiver_organization_id  INT          NULL     COMMENT 'Department or organization receiving the item; empty = personal',
  reserved_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the reservation was made',
  expires_at                DATETIME     NOT NULL COMMENT 'When it expires if not completed; set from system settings',
  status                    VARCHAR(30)  NOT NULL DEFAULT 'Active' COMMENT 'Pending, Active, Completed, Cancelled or Expired',
  pickup_note               TEXT         NULL     COMMENT 'Notes for arranging pickup',
  -- Holds item_id only while the reservation is open, so the unique index below
  -- allows many closed reservations per item but only one open one.
  open_item_id              INT GENERATED ALWAYS AS (IF(status IN ('Pending', 'Active'), item_id, NULL)) STORED
                                         COMMENT 'Generated: item_id while Pending/Active, else NULL',
  PRIMARY KEY (reservation_id),
  CONSTRAINT uq_one_open_reservation_per_item UNIQUE (open_item_id),
  CONSTRAINT chk_res_status  CHECK (status IN ('Pending', 'Active', 'Completed', 'Cancelled', 'Expired')),
  CONSTRAINT chk_res_expires CHECK (expires_at > reserved_at),
  CONSTRAINT fk_res_item     FOREIGN KEY (item_id)                  REFERENCES item (item_id),
  CONSTRAINT fk_res_user     FOREIGN KEY (reserved_by_user_id)      REFERENCES user (user_id),
  CONSTRAINT fk_res_receiver FOREIGN KEY (receiver_organization_id) REFERENCES organization (organization_id) ON DELETE SET NULL,
  INDEX idx_res_user_status (reserved_by_user_id, status)
) ENGINE=InnoDB COMMENT='A claim on an item by a user, optionally for an organization';

CREATE TABLE exchange (
  exchange_id            INT           NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the exchange',
  reservation_id         INT           NOT NULL COMMENT 'Reservation being completed (one exchange per reservation)',
  pickup_time            DATETIME      NOT NULL COMMENT 'Scheduled pickup or transfer time',
  pickup_location        VARCHAR(200)  NOT NULL COMMENT 'Agreed pickup location',
  giver_confirmed_at     DATETIME      NULL     COMMENT 'When the giver confirmed the handover',
  receiver_confirmed_at  DATETIME      NULL     COMMENT 'When the receiver confirmed the pickup',
  status                 VARCHAR(30)   NOT NULL DEFAULT 'Scheduled' COMMENT 'Scheduled, Completed, Failed or Disputed',
  completed_at           DATETIME      NULL     COMMENT 'Set when both sides have confirmed',
  PRIMARY KEY (exchange_id),
  CONSTRAINT uq_exchange_reservation UNIQUE (reservation_id),
  CONSTRAINT chk_exchange_status CHECK (status IN ('Scheduled', 'Completed', 'Failed', 'Disputed')),
  CONSTRAINT chk_exchange_both_confirmed CHECK (status <> 'Completed'
    OR (giver_confirmed_at IS NOT NULL AND receiver_confirmed_at IS NOT NULL AND completed_at IS NOT NULL)),
  CONSTRAINT fk_exchange_reservation FOREIGN KEY (reservation_id) REFERENCES reservation (reservation_id)
) ENGINE=InnoDB COMMENT='The pickup or transfer that completes a reservation';

CREATE TABLE message (
  message_id         INT       NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the message',
  sender_user_id     INT       NOT NULL COMMENT 'User who sent the message',
  recipient_user_id  INT       NOT NULL COMMENT 'User who receives the message',
  reservation_id     INT       NULL     COMMENT 'Reservation the conversation is about, if any',
  body               TEXT      NOT NULL COMMENT 'Message text',
  sent_at            DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the message was sent',
  is_read            BOOLEAN   NOT NULL DEFAULT FALSE COMMENT 'Whether the recipient has read it',
  PRIMARY KEY (message_id),
  CONSTRAINT chk_message_not_self CHECK (sender_user_id <> recipient_user_id),
  CONSTRAINT fk_msg_sender      FOREIGN KEY (sender_user_id)    REFERENCES user (user_id),
  CONSTRAINT fk_msg_recipient   FOREIGN KEY (recipient_user_id) REFERENCES user (user_id),
  CONSTRAINT fk_msg_reservation FOREIGN KEY (reservation_id)    REFERENCES reservation (reservation_id) ON DELETE SET NULL,
  INDEX idx_msg_recipient (recipient_user_id, is_read)
) ENGINE=InnoDB COMMENT='A message between users, used to arrange pickup';

-- ---------------------------------------------------------------------
-- 4. Collection drives and giveaways
-- ---------------------------------------------------------------------

CREATE TABLE collection_event (
  event_id                    INT           NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the event',
  organization_id             INT           NOT NULL COMMENT 'Student organization hosting the event',
  created_by_user_id          INT           NOT NULL COMMENT 'Representative who created the event',
  event_type                  VARCHAR(30)   NOT NULL COMMENT 'Collection Drive or Giveaway',
  title                       VARCHAR(150)  NOT NULL COMMENT 'Event title',
  description                 TEXT          NULL     COMMENT 'Event description',
  participation_instructions  TEXT          NULL     COMMENT 'How to contribute or receive items',
  location                    VARCHAR(200)  NOT NULL COMMENT 'Event location',
  start_at                    DATETIME      NOT NULL COMMENT 'Start date and time',
  end_at                      DATETIME      NOT NULL COMMENT 'End date and time',
  status                      VARCHAR(30)   NOT NULL DEFAULT 'Planned' COMMENT 'Planned, Active, Completed or Cancelled',
  PRIMARY KEY (event_id),
  CONSTRAINT chk_event_type   CHECK (event_type IN ('Collection Drive', 'Giveaway')),
  CONSTRAINT chk_event_status CHECK (status IN ('Planned', 'Active', 'Completed', 'Cancelled')),
  CONSTRAINT chk_event_dates  CHECK (end_at > start_at),
  CONSTRAINT fk_event_org     FOREIGN KEY (organization_id)    REFERENCES organization (organization_id),
  CONSTRAINT fk_event_creator FOREIGN KEY (created_by_user_id) REFERENCES user (user_id)
) ENGINE=InnoDB COMMENT='A giveaway or collection drive run by a student organization';

CREATE TABLE event_category (
  event_id     INT NOT NULL COMMENT 'Event that accepts the category',
  category_id  INT NOT NULL COMMENT 'Category accepted by the event',
  PRIMARY KEY (event_id, category_id),
  CONSTRAINT fk_ec_event    FOREIGN KEY (event_id)    REFERENCES collection_event (event_id) ON DELETE CASCADE,
  CONSTRAINT fk_ec_category FOREIGN KEY (category_id) REFERENCES category (category_id)
) ENGINE=InnoDB COMMENT='Associative entity: item types an event accepts';

CREATE TABLE event_item (
  event_item_id        INT          NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the event item',
  event_id             INT          NOT NULL COMMENT 'Event the item was contributed to',
  item_id              INT          NOT NULL COMMENT 'Item that was contributed',
  contributor_user_id  INT          NOT NULL COMMENT 'User who contributed the item',
  distribution_status  VARCHAR(30)  NOT NULL DEFAULT 'Pending' COMMENT 'Pending, Accepted, Rejected, Available or Distributed',
  received_at          DATETIME     NULL     COMMENT 'When the organization received the item',
  distributed_at       DATETIME     NULL     COMMENT 'When the item was given out',
  PRIMARY KEY (event_item_id),
  CONSTRAINT uq_event_item UNIQUE (item_id),
  CONSTRAINT chk_distribution_status CHECK (distribution_status IN ('Pending', 'Accepted', 'Rejected', 'Available', 'Distributed')),
  CONSTRAINT fk_ei_event       FOREIGN KEY (event_id)            REFERENCES collection_event (event_id),
  CONSTRAINT fk_ei_item        FOREIGN KEY (item_id)             REFERENCES item (item_id),
  CONSTRAINT fk_ei_contributor FOREIGN KEY (contributor_user_id) REFERENCES user (user_id)
) ENGINE=InnoDB COMMENT='Associative entity: an item contributed to a collection event';

-- ---------------------------------------------------------------------
-- 5. Reports and moderation
-- ---------------------------------------------------------------------

CREATE TABLE report (
  report_id                 INT           NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the report',
  reporter_user_id          INT           NOT NULL COMMENT 'User who submitted the report',
  reported_user_id          INT           NULL     COMMENT 'User being reported, if any',
  reported_organization_id  INT           NULL     COMMENT 'Department or organization being reported, if any',
  item_id                   INT           NULL     COMMENT 'Listing being reported, if any',
  exchange_id               INT           NULL     COMMENT 'Exchange being reported, if any',
  event_id                  INT           NULL     COMMENT 'Collection event being reported, if any',
  reason                    VARCHAR(100)  NOT NULL COMMENT 'Category of problem',
  details                   TEXT          NULL     COMMENT 'Reporter''s description',
  status                    VARCHAR(30)   NOT NULL DEFAULT 'Open' COMMENT 'Open, Under Review, Resolved or Dismissed',
  created_at                DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the report was submitted',
  PRIMARY KEY (report_id),
  CONSTRAINT chk_report_status CHECK (status IN ('Open', 'Under Review', 'Resolved', 'Dismissed')),
  CONSTRAINT chk_report_has_target CHECK (reported_user_id IS NOT NULL OR reported_organization_id IS NOT NULL
    OR item_id IS NOT NULL OR exchange_id IS NOT NULL OR event_id IS NOT NULL),
  CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_user_id)         REFERENCES user (user_id),
  CONSTRAINT fk_report_user     FOREIGN KEY (reported_user_id)         REFERENCES user (user_id),
  CONSTRAINT fk_report_org      FOREIGN KEY (reported_organization_id) REFERENCES organization (organization_id),
  CONSTRAINT fk_report_item     FOREIGN KEY (item_id)                  REFERENCES item (item_id),
  CONSTRAINT fk_report_exchange FOREIGN KEY (exchange_id)              REFERENCES exchange (exchange_id),
  CONSTRAINT fk_report_event    FOREIGN KEY (event_id)                 REFERENCES collection_event (event_id)
) ENGINE=InnoDB COMMENT='A problem report about a listing, user, organization, exchange or event';

CREATE TABLE moderation_case (
  case_id               INT          NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the case',
  report_id             INT          NOT NULL COMMENT 'Report that opened the case (one case per report)',
  assigned_to_user_id   INT          NULL     COMMENT 'Moderator handling the case',
  escalated_to_user_id  INT          NULL     COMMENT 'Administrator the case was escalated to',
  escalated_at          DATETIME     NULL     COMMENT 'When the case was escalated',
  status                VARCHAR(30)  NOT NULL DEFAULT 'Open' COMMENT 'Open, In Progress, Escalated or Closed',
  findings              TEXT         NULL     COMMENT 'Moderator''s findings',
  resolution            TEXT         NULL     COMMENT 'Final resolution; required to close',
  closed_at             DATETIME     NULL     COMMENT 'When the case was closed',
  PRIMARY KEY (case_id),
  CONSTRAINT uq_case_report UNIQUE (report_id),
  CONSTRAINT chk_case_status CHECK (status IN ('Open', 'In Progress', 'Escalated', 'Closed')),
  CONSTRAINT chk_case_closed_has_resolution CHECK (status <> 'Closed' OR (resolution IS NOT NULL AND closed_at IS NOT NULL)),
  CONSTRAINT chk_case_escalation CHECK (status <> 'Escalated' OR escalated_to_user_id IS NOT NULL),
  CONSTRAINT fk_case_report    FOREIGN KEY (report_id)            REFERENCES report (report_id),
  CONSTRAINT fk_case_assignee  FOREIGN KEY (assigned_to_user_id)  REFERENCES user (user_id),
  CONSTRAINT fk_case_escalated FOREIGN KEY (escalated_to_user_id) REFERENCES user (user_id)
) ENGINE=InnoDB COMMENT='A moderator''s case opened from a report';

CREATE TABLE moderation_action (
  action_id             INT           NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the action',
  case_id               INT           NOT NULL COMMENT 'Case the action belongs to',
  performed_by_user_id  INT           NOT NULL COMMENT 'Moderator or administrator who took the action',
  action_type           VARCHAR(40)   NOT NULL COMMENT 'Warning, a restriction, Listing Hidden/Removed or Account Referred',
  reason                VARCHAR(255)  NOT NULL COMMENT 'Why the action was taken (required for the audit trail)',
  restriction_ends_at   DATETIME      NULL     COMMENT 'When a temporary restriction ends',
  notes                 TEXT          NULL     COMMENT 'Additional notes',
  created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the action was taken',
  PRIMARY KEY (action_id),
  CONSTRAINT chk_action_type CHECK (action_type IN ('Warning', 'Listing Restriction', 'Reservation Restriction',
    'Messaging Restriction', 'Listing Hidden', 'Listing Removed', 'Account Referred')),
  CONSTRAINT chk_action_restriction_end CHECK (action_type NOT LIKE '%Restriction' OR restriction_ends_at IS NOT NULL),
  CONSTRAINT fk_action_case      FOREIGN KEY (case_id)              REFERENCES moderation_case (case_id) ON DELETE CASCADE,
  CONSTRAINT fk_action_performer FOREIGN KEY (performed_by_user_id) REFERENCES user (user_id)
) ENGINE=InnoDB COMMENT='An action taken on a moderation case';

-- ---------------------------------------------------------------------
-- 6. System: notifications, settings and the admin audit log
-- ---------------------------------------------------------------------

CREATE TABLE notification (
  notification_id    INT          NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the notification',
  user_id            INT          NOT NULL COMMENT 'User receiving the notification',
  notification_type  VARCHAR(50)  NOT NULL COMMENT 'e.g. Reservation Confirmed, Exchange Update',
  message            TEXT         NOT NULL COMMENT 'Notification text',
  is_read            BOOLEAN      NOT NULL DEFAULT FALSE COMMENT 'Whether the user has read it',
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When it was created',
  PRIMARY KEY (notification_id),
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE,
  INDEX idx_notification_user (user_id, is_read)
) ENGINE=InnoDB COMMENT='A message the system sends to a user';

CREATE TABLE system_setting (
  setting_key         VARCHAR(100)  NOT NULL COMMENT 'Unique name of the setting',
  setting_value       TEXT          NOT NULL COMMENT 'Value of the setting',
  updated_by_user_id  INT           NULL     COMMENT 'Administrator who last changed it',
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When it was last changed',
  PRIMARY KEY (setting_key),
  CONSTRAINT fk_setting_user FOREIGN KEY (updated_by_user_id) REFERENCES user (user_id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='A configurable system-wide setting';

CREATE TABLE audit_log (
  log_id          INT          NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier for the log entry',
  actor_user_id   INT          NOT NULL COMMENT 'Administrator who made the change',
  target_user_id  INT          NULL     COMMENT 'Account that was changed, if any',
  action          VARCHAR(60)  NOT NULL COMMENT 'What changed, e.g. account_status: Active -> Suspended',
  justification   TEXT         NOT NULL COMMENT 'Why the change was made (required)',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the change was made',
  PRIMARY KEY (log_id),
  CONSTRAINT fk_audit_actor  FOREIGN KEY (actor_user_id)  REFERENCES user (user_id),
  CONSTRAINT fk_audit_target FOREIGN KEY (target_user_id) REFERENCES user (user_id)
) ENGINE=InnoDB COMMENT='Administrator account actions and their justification';

-- ---------------------------------------------------------------------
-- 7. Views used by search screens and reports
-- ---------------------------------------------------------------------

CREATE VIEW v_available_items AS
SELECT i.item_id, i.title, i.description, c.name AS category, i.item_condition, i.quantity,
       i.pickup_location, i.estimated_value,
       COALESCE(o.name, CONCAT(u.first_name, ' ', u.last_name)) AS owner_name,
       COALESCE(o.organization_type, 'Individual')              AS owner_type,
       (SELECT img.image_url FROM item_image img
         WHERE img.item_id = i.item_id ORDER BY img.display_order LIMIT 1) AS main_photo,
       i.created_at
FROM item i
JOIN category c           ON c.category_id = i.category_id
JOIN user u               ON u.user_id = i.posted_by_user_id
LEFT JOIN organization o  ON o.organization_id = i.owner_organization_id
WHERE i.status = 'Available';

CREATE VIEW v_reservation_details AS
SELECT r.reservation_id, r.status, r.reserved_at, r.expires_at,
       CONCAT(u.first_name, ' ', u.last_name) AS reserved_by, u.email AS reserved_by_email,
       ro.name AS received_for, i.item_id, i.title AS item, c.name AS category,
       COALESCE(oo.name, CONCAT(g.first_name, ' ', g.last_name)) AS given_by,
       x.status AS exchange_status, x.pickup_time
FROM reservation r
JOIN user u               ON u.user_id = r.reserved_by_user_id
JOIN item i               ON i.item_id = r.item_id
JOIN category c           ON c.category_id = i.category_id
JOIN user g               ON g.user_id = i.posted_by_user_id
LEFT JOIN organization ro ON ro.organization_id = r.receiver_organization_id
LEFT JOIN organization oo ON oo.organization_id = i.owner_organization_id
LEFT JOIN exchange x      ON x.reservation_id = r.reservation_id;

-- ---------------------------------------------------------------------
-- 8. Triggers that enforce business rules
-- ---------------------------------------------------------------------

DELIMITER $$

-- Reservations: only verified, active users may reserve; only Available items;
-- anti-hoarding (one open personal reservation per category); expiry from settings.
CREATE TRIGGER trg_reservation_before_insert
BEFORE INSERT ON reservation
FOR EACH ROW
BEGIN
  DECLARE v_item_status VARCHAR(30);
  DECLARE v_category INT;
  DECLARE v_owner INT;
  DECLARE v_verified DATETIME;
  DECLARE v_account VARCHAR(30);
  DECLARE v_hours INT;

  SELECT status, category_id, posted_by_user_id INTO v_item_status, v_category, v_owner
    FROM item WHERE item_id = NEW.item_id FOR UPDATE;
  SELECT email_verified_at, account_status INTO v_verified, v_account
    FROM user WHERE user_id = NEW.reserved_by_user_id;

  IF NEW.status IN ('Pending', 'Active') THEN
    IF v_verified IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rule: a verified campus email is required to reserve items.';
    END IF;
    IF v_account <> 'Active' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rule: suspended or inactive accounts cannot reserve items.';
    END IF;
    IF v_item_status <> 'Available' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rule: only Available items can be reserved.';
    END IF;
    IF v_owner = NEW.reserved_by_user_id THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rule: users cannot reserve their own listings.';
    END IF;
    IF NEW.receiver_organization_id IS NULL AND EXISTS (
        SELECT 1 FROM reservation r JOIN item i ON i.item_id = r.item_id
         WHERE r.reserved_by_user_id = NEW.reserved_by_user_id
           AND r.receiver_organization_id IS NULL
           AND r.status IN ('Pending', 'Active')
           AND i.category_id = v_category) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rule (anti-hoarding): only one open personal reservation per category.';
    END IF;
  END IF;

  IF NEW.expires_at IS NULL THEN
    SELECT CAST(setting_value AS UNSIGNED) INTO v_hours
      FROM system_setting WHERE setting_key = 'reservation_expiration_hours';
    SET NEW.expires_at = NEW.reserved_at + INTERVAL COALESCE(v_hours, 24) HOUR;
  END IF;
END$$

-- Keep ITEM.status in step with its reservation.
CREATE TRIGGER trg_reservation_after_insert
AFTER INSERT ON reservation
FOR EACH ROW
BEGIN
  IF NEW.status IN ('Pending', 'Active') THEN
    UPDATE item SET status = 'Reserved' WHERE item_id = NEW.item_id;
  ELSEIF NEW.status = 'Completed' THEN
    UPDATE item SET status = 'Completed' WHERE item_id = NEW.item_id;
  END IF;
END$$

CREATE TRIGGER trg_reservation_after_update
AFTER UPDATE ON reservation
FOR EACH ROW
BEGIN
  IF NEW.status <> OLD.status THEN
    IF NEW.status IN ('Cancelled', 'Expired') THEN
      UPDATE item SET status = 'Available' WHERE item_id = NEW.item_id AND status = 'Reserved';
      INSERT INTO notification (user_id, notification_type, message)
      VALUES (NEW.reserved_by_user_id, CONCAT('Reservation ', NEW.status),
              CONCAT('Your reservation #', NEW.reservation_id, ' is now ', NEW.status, '.'));
    ELSEIF NEW.status = 'Completed' THEN
      UPDATE item SET status = 'Completed' WHERE item_id = NEW.item_id;
    END IF;
  END IF;
END$$

-- Exchanges: when both sides have confirmed, complete the exchange automatically.
CREATE TRIGGER trg_exchange_before_update
BEFORE UPDATE ON exchange
FOR EACH ROW
BEGIN
  IF NEW.giver_confirmed_at IS NOT NULL AND NEW.receiver_confirmed_at IS NOT NULL
     AND NEW.status = 'Scheduled' THEN
    SET NEW.status = 'Completed';
    SET NEW.completed_at = COALESCE(NEW.completed_at, NOW());
  END IF;
END$$

CREATE TRIGGER trg_exchange_after_update
AFTER UPDATE ON exchange
FOR EACH ROW
BEGIN
  IF NEW.status = 'Completed' AND OLD.status <> 'Completed' THEN
    UPDATE reservation SET status = 'Completed' WHERE reservation_id = NEW.reservation_id;
  END IF;
END$$

-- Collection events can only be hosted by an approved student organization.
CREATE TRIGGER trg_event_before_insert
BEFORE INSERT ON collection_event
FOR EACH ROW
BEGIN
  IF NOT EXISTS (SELECT 1 FROM organization
                  WHERE organization_id = NEW.organization_id
                    AND organization_type = 'Student Organization'
                    AND status = 'Approved') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rule: only approved student organizations can host collection events.';
  END IF;
END$$

-- Admin account changes must name the administrator and a justification
-- (set @actor_user_id and @justification first); each change is logged.
CREATE TRIGGER trg_user_before_update
BEFORE UPDATE ON user
FOR EACH ROW
BEGIN
  IF NEW.account_status <> OLD.account_status
     AND (@actor_user_id IS NULL OR COALESCE(TRIM(@justification), '') = '') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rule: account status changes need @actor_user_id and @justification.';
  END IF;
END$$

CREATE TRIGGER trg_user_after_update
AFTER UPDATE ON user
FOR EACH ROW
BEGIN
  IF NEW.account_status <> OLD.account_status THEN
    INSERT INTO audit_log (actor_user_id, target_user_id, action, justification)
    VALUES (@actor_user_id, NEW.user_id,
            CONCAT('account_status: ', OLD.account_status, ' -> ', NEW.account_status), @justification);
  END IF;
END$$

-- ---------------------------------------------------------------------
-- 9. Stored procedure: reserve an item safely in one transaction
-- ---------------------------------------------------------------------

CREATE PROCEDURE reserve_item(IN p_item_id INT, IN p_user_id INT, IN p_org_id INT, IN p_note TEXT)
BEGIN
  DECLARE v_locked INT;
  DECLARE v_reservation_id INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
    -- Lock the item row so two people cannot claim it at the same moment.
    SELECT item_id INTO v_locked FROM item WHERE item_id = p_item_id FOR UPDATE;
    INSERT INTO reservation (item_id, reserved_by_user_id, receiver_organization_id, pickup_note)
    VALUES (p_item_id, p_user_id, p_org_id, p_note);
    SET v_reservation_id = LAST_INSERT_ID();
    INSERT INTO notification (user_id, notification_type, message)
    SELECT i.posted_by_user_id, 'Item Reserved',
           CONCAT('Your listing "', i.title, '" was reserved.')
      FROM item i WHERE i.item_id = p_item_id;
  COMMIT;

  SELECT * FROM v_reservation_details WHERE reservation_id = v_reservation_id;
END$$

-- ---------------------------------------------------------------------
-- 10. Scheduled event: expire reservations that were never picked up
-- ---------------------------------------------------------------------

CREATE EVENT ev_expire_reservations
ON SCHEDULE EVERY 15 MINUTE
DO
  UPDATE reservation
     SET status = 'Expired'
   WHERE status IN ('Pending', 'Active')
     AND expires_at < NOW()$$

DELIMITER ;
