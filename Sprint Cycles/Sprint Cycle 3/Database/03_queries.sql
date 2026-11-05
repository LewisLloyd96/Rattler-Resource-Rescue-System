-- =====================================================================
-- Rattler Resource Rescue System — Demonstration Queries (MySQL 8.0+)
-- Sprint Cycle III: Database Implementation
--
-- Sections follow the assignment:
--   A. Retrieve / Search      B. Related data
--   C. Add data               D. Modify data
--   E. Reports (functional requirements)
-- Sections C and D change data. Re-run 02_sample_data.sql (after
-- 01_schema.sql) to reset the database before a demo.
--
-- Run all:  mysql -u root -p -t < 03_queries.sql
-- =====================================================================

USE rattler_resource_rescue;

-- =====================================================================
-- A. RETRIEVE / SEARCH
-- =====================================================================

-- A1. Search for a user by name or email (admin "Manage User Accounts").
SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS name, u.email,
       r.role_name, u.account_status
FROM user u
JOIN role r ON r.role_id = u.role_id
WHERE u.last_name LIKE 'Ja%' OR u.email LIKE 'jordan%';

-- A2. Find available items in a category (Campus User "Search and Browse").
SELECT item_id, title, item_condition, quantity, pickup_location, owner_name, owner_type
FROM v_available_items
WHERE category = 'Dorm Essentials'
ORDER BY created_at DESC;

-- A3. Keyword search across titles and descriptions (FULLTEXT index).
SELECT i.item_id, i.title, c.name AS category,
       ROUND(MATCH(i.title, i.description) AGAINST ('desk lamp table'), 3) AS relevance
FROM item i
JOIN category c ON c.category_id = i.category_id
WHERE i.status = 'Available'
  AND MATCH(i.title, i.description) AGAINST ('desk lamp table')
ORDER BY relevance DESC;

-- A4. Filter available items by condition and maximum value.
SELECT title, category, item_condition, estimated_value, pickup_location
FROM v_available_items
WHERE item_condition IN ('New', 'Like New') AND estimated_value <= 100
ORDER BY estimated_value;

-- A5. Listings posted by a particular user (Manage Listings).
SELECT i.item_id, i.title, c.name AS category, i.status, i.created_at
FROM item i
JOIN category c ON c.category_id = i.category_id
WHERE i.posted_by_user_id = (SELECT user_id FROM user WHERE email = 'jordan2.davis@famu.edu')
ORDER BY i.created_at;

-- A6. Listings waiting for moderator review (Moderator "Pending Listings").
SELECT i.item_id, i.title, c.name AS category,
       CONCAT(u.first_name, ' ', u.last_name) AS posted_by, i.created_at
FROM item i
JOIN category c ON c.category_id = i.category_id
JOIN user u     ON u.user_id = i.posted_by_user_id
WHERE i.status = 'Pending Review';

-- =====================================================================
-- B. RELATED DATA
-- =====================================================================

-- B1. Reservations made by a particular user, with item, giver and exchange.
SELECT reservation_id, item, category, given_by, status, reserved_at, exchange_status, pickup_time
FROM v_reservation_details
WHERE reserved_by_email = 'jordan2.davis@famu.edu'
ORDER BY reserved_at DESC;

-- B2. Items associated with a department, with any open reservation.
SELECT i.item_id, i.title, i.quantity, i.status, i.estimated_value,
       CONCAT(ru.first_name, ' ', ru.last_name) AS reserved_by,
       ro.name AS reserved_for
FROM item i
JOIN organization o        ON o.organization_id = i.owner_organization_id
LEFT JOIN reservation r    ON r.item_id = i.item_id AND r.status IN ('Pending', 'Active')
LEFT JOIN user ru          ON ru.user_id = r.reserved_by_user_id
LEFT JOIN organization ro  ON ro.organization_id = r.receiver_organization_id
WHERE o.name = 'Department of Computer & Information Sciences'
ORDER BY i.item_id;

-- B3. Authorized representatives of each organization.
SELECT o.name AS organization, o.organization_type, o.status AS org_status,
       CONCAT(u.first_name, ' ', u.last_name) AS representative, u.email,
       m.member_role, m.approved_at
FROM organization o
JOIN organization_member m ON m.organization_id = o.organization_id AND m.is_active
JOIN user u                ON u.user_id = m.user_id
ORDER BY o.organization_type, o.name, m.member_role;

-- B4. Items contributed to a collection drive, with contributor and status.
SELECT e.title AS event, i.title AS item, c.name AS category,
       CONCAT(u.first_name, ' ', u.last_name) AS contributor,
       ei.distribution_status, ei.received_at, ei.distributed_at
FROM collection_event e
JOIN event_item ei ON ei.event_id = e.event_id
JOIN item i        ON i.item_id = ei.item_id
JOIN category c    ON c.category_id = i.category_id
JOIN user u        ON u.user_id = ei.contributor_user_id
WHERE e.title = 'Fall Move-Out Collection Drive';

-- B5. Item types each event accepts (EVENT_CATEGORY associative table).
SELECT e.title AS event, e.event_type, GROUP_CONCAT(c.name ORDER BY c.name SEPARATOR ', ') AS accepted_item_types
FROM collection_event e
JOIN event_category ec ON ec.event_id = e.event_id
JOIN category c        ON c.category_id = ec.category_id
GROUP BY e.event_id, e.title, e.event_type;

-- B6. Moderation cases with the report, what was reported, and actions taken.
SELECT mc.case_id, mc.status AS case_status, rp.reason,
       CONCAT(rep.first_name, ' ', rep.last_name) AS reported_by,
       COALESCE(CONCAT('Item: ', i.title),
                CONCAT('Event: ', e.title),
                CONCAT('Organization: ', o.name),
                CONCAT('User: ', tu.first_name, ' ', tu.last_name)) AS reported_target,
       CONCAT(mod_u.first_name, ' ', mod_u.last_name) AS moderator,
       GROUP_CONCAT(ma.action_type ORDER BY ma.created_at SEPARATOR ', ') AS actions
FROM moderation_case mc
JOIN report rp                ON rp.report_id = mc.report_id
JOIN user rep                 ON rep.user_id = rp.reporter_user_id
LEFT JOIN user tu             ON tu.user_id = rp.reported_user_id
LEFT JOIN organization o      ON o.organization_id = rp.reported_organization_id
LEFT JOIN item i              ON i.item_id = rp.item_id
LEFT JOIN collection_event e  ON e.event_id = rp.event_id
LEFT JOIN user mod_u          ON mod_u.user_id = mc.assigned_to_user_id
LEFT JOIN moderation_action ma ON ma.case_id = mc.case_id
GROUP BY mc.case_id, mc.status, rp.reason, reported_by, reported_target, moderator;

-- B7. A user's unread messages and the item each conversation is about.
SELECT CONCAT(s.first_name, ' ', s.last_name) AS from_user, i.title AS about_item, m.body, m.sent_at
FROM message m
JOIN user s                ON s.user_id = m.sender_user_id
LEFT JOIN reservation r    ON r.reservation_id = m.reservation_id
LEFT JOIN item i           ON i.item_id = r.item_id
WHERE m.recipient_user_id = (SELECT user_id FROM user WHERE email = 'jordan2.davis@famu.edu')
  AND m.is_read = FALSE;

-- B8. Permissions granted to each role (ROLE_PERMISSION associative table).
SELECT r.role_name, COUNT(*) AS permissions,
       GROUP_CONCAT(p.permission_code ORDER BY p.permission_code SEPARATOR ', ') AS codes
FROM role r
JOIN role_permission rp ON rp.role_id = r.role_id
JOIN permission p       ON p.permission_id = rp.permission_id
GROUP BY r.role_id, r.role_name
ORDER BY r.role_id;

-- =====================================================================
-- C. ADD DATA
-- =====================================================================

-- C1. A Campus User lists a new item with a photo (starts as Pending Review).
INSERT INTO item (posted_by_user_id, category_id, title, description, item_condition, pickup_location, estimated_value)
VALUES ((SELECT user_id FROM user WHERE email = 'imani.scott@famu.edu'),
        (SELECT category_id FROM category WHERE name = 'Furniture'),
        'Folding Desk Chair', 'Padded folding chair, perfect for a dorm desk.', 'Good',
        'Student Union food court', 15.00);
SET @new_item_id = LAST_INSERT_ID();
INSERT INTO item_image (item_id, image_url, display_order)
VALUES (@new_item_id, CONCAT('https://res.cloudinary.com/rattler-rrs/image/upload/items/', @new_item_id, '/chair.jpg'), 1);

SELECT item_id, title, status, created_at FROM item WHERE item_id = @new_item_id;

-- C2. A moderator approves it, making it searchable.
UPDATE item SET status = 'Available' WHERE item_id = @new_item_id;

-- C3. Another student reserves it through the stored procedure
--     (one transaction; the trigger sets expiry and marks the item Reserved).
CALL reserve_item(@new_item_id,
                  (SELECT user_id FROM user WHERE email = 'christopher.lee@famu.edu'),
                  NULL, 'Can pick up after 5pm.');

SELECT item_id, title, status FROM item WHERE item_id = @new_item_id;

-- =====================================================================
-- D. MODIFY DATA
-- =====================================================================

-- D1. A user edits their listing.
UPDATE item
   SET description = 'Three brightness levels, adjustable arm, includes USB-C cable.',
       estimated_value = 18.00
 WHERE item_id = 5;
SELECT item_id, title, description, estimated_value FROM item WHERE item_id = 5;

-- D2. The receiver confirms the mini-fridge pickup. The giver already
--     confirmed, so triggers complete the exchange, the reservation and the item.
SELECT x.exchange_id, x.status AS exchange_before, r.status AS reservation_before, i.status AS item_before
FROM exchange x JOIN reservation r ON r.reservation_id = x.reservation_id JOIN item i ON i.item_id = r.item_id
WHERE x.exchange_id = 5;

UPDATE exchange SET receiver_confirmed_at = NOW() WHERE exchange_id = 5;

SELECT x.exchange_id, x.status AS exchange_after, x.completed_at, r.status AS reservation_after, i.status AS item_after
FROM exchange x JOIN reservation r ON r.reservation_id = x.reservation_id JOIN item i ON i.item_id = r.item_id
WHERE x.exchange_id = 5;

-- D3. A user cancels a reservation; the item becomes Available again
--     and the user is notified (trigger).
UPDATE reservation SET status = 'Cancelled' WHERE reservation_id = 9;
SELECT r.reservation_id, r.status, i.title, i.status AS item_status
FROM reservation r JOIN item i ON i.item_id = r.item_id WHERE r.reservation_id = 9;

-- D4. An administrator changes a setting (updated_at changes automatically).
UPDATE system_setting SET setting_value = '72', updated_by_user_id = 1
 WHERE setting_key = 'reservation_expiration_hours';
SELECT * FROM system_setting WHERE setting_key = 'reservation_expiration_hours';

-- D5. An administrator reinstates an account with a logged justification.
SET @actor_user_id = 1;
SET @justification = 'Student conduct review completed; reservation restriction remains until 2026-11-13.';
UPDATE user SET account_status = 'Active' WHERE email = 'tyrell.jackson@famu.edu';
SET @actor_user_id = NULL;
SET @justification = NULL;
SELECT a.log_id, CONCAT(ad.first_name, ' ', ad.last_name) AS administrator,
       CONCAT(t.first_name, ' ', t.last_name) AS account, a.action, a.justification, a.created_at
FROM audit_log a
JOIN user ad ON ad.user_id = a.actor_user_id
JOIN user t  ON t.user_id = a.target_user_id
ORDER BY a.log_id;

-- =====================================================================
-- E. REPORTS
-- =====================================================================

-- E1. Department / organization activity report: given, received, value.
SELECT o.name AS organization, o.organization_type,
       (SELECT COUNT(*) FROM item i WHERE i.owner_organization_id = o.organization_id) AS listings,
       (SELECT COUNT(*) FROM item i WHERE i.owner_organization_id = o.organization_id AND i.status = 'Available') AS active_listings,
       (SELECT COUNT(*) FROM item i WHERE i.owner_organization_id = o.organization_id AND i.status = 'Completed') AS items_given,
       (SELECT COUNT(*) FROM reservation r WHERE r.receiver_organization_id = o.organization_id AND r.status = 'Completed') AS items_received,
       (SELECT COALESCE(SUM(i.estimated_value), 0) FROM reservation r JOIN item i ON i.item_id = r.item_id
         WHERE r.receiver_organization_id = o.organization_id AND r.status = 'Completed') AS value_received
FROM organization o
WHERE o.status = 'Approved'
ORDER BY o.organization_type, o.name;

-- E2. Campus reuse statistics: completed exchanges and estimated money saved by category.
SELECT c.name AS category, COUNT(*) AS items_reused, SUM(i.estimated_value) AS estimated_money_saved
FROM reservation r
JOIN item i     ON i.item_id = r.item_id
JOIN category c ON c.category_id = i.category_id
WHERE r.status = 'Completed'
GROUP BY c.name WITH ROLLUP;

-- E3. Personal reuse history for a user: given, received and contributed.
SET @uid = (SELECT user_id FROM user WHERE email = 'jordan2.davis@famu.edu');
SELECT 'Given' AS activity, i.title, r.status, r.reserved_at AS activity_date
FROM item i JOIN reservation r ON r.item_id = i.item_id
WHERE i.posted_by_user_id = @uid AND r.status = 'Completed'
UNION ALL
SELECT 'Reserved', i.title, r.status, r.reserved_at
FROM reservation r JOIN item i ON i.item_id = r.item_id
WHERE r.reserved_by_user_id = @uid
UNION ALL
SELECT 'Contributed to drive', i.title, ei.distribution_status, ei.received_at
FROM event_item ei JOIN item i ON i.item_id = ei.item_id
WHERE ei.contributor_user_id = @uid
ORDER BY activity_date;
