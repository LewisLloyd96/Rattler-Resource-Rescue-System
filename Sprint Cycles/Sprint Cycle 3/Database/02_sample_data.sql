-- =====================================================================
-- Rattler Resource Rescue System — Sample Data (MySQL 8.0+)
-- Sprint Cycle III: Database Implementation
--
-- Realistic FAMU campus data for every role: 16 users, 3 departments,
-- 3 student organizations, 26 items, reservations in every status,
-- exchanges, messages, two collection events, reports and moderation.
-- Open reservations are dated relative to NOW() so they never start expired.
--
-- Run after 01_schema.sql:  mysql -u root -p < 02_sample_data.sql
-- All people and listings are fictional sample data.
-- =====================================================================

USE rattler_resource_rescue;

-- ---------------------------------------------------------------------
-- Roles and permissions
-- ---------------------------------------------------------------------
INSERT INTO role (role_id, role_name) VALUES
  (1, 'Campus User'),
  (2, 'Department Representative'),
  (3, 'Student Organization Representative'),
  (4, 'Community Moderator'),
  (5, 'Administrator');

INSERT INTO permission (permission_id, permission_code, description) VALUES
  (1,  'item.create',             'Create a listing'),
  (2,  'item.edit_own',           'Edit or deactivate own listings'),
  (3,  'item.reserve',            'Reserve or claim an available item'),
  (4,  'exchange.confirm',        'Confirm an exchange as giver or receiver'),
  (5,  'report.create',           'Report a listing, user, exchange or event'),
  (6,  'org.manage_listings',     'Manage listings and reservations for an organization'),
  (7,  'org.manage_profile',      'Maintain an organization profile and representatives'),
  (8,  'event.manage',            'Create and manage collection drives and giveaways'),
  (9,  'moderation.review',       'Review reports and manage moderation cases'),
  (10, 'moderation.restrict',     'Warn users or apply temporary restrictions'),
  (11, 'admin.manage_users',      'Activate, suspend or ban accounts'),
  (12, 'admin.manage_categories', 'Create and manage item categories'),
  (13, 'admin.manage_settings',   'Change system settings'),
  (14, 'reports.generate',        'Generate activity and reuse reports');

INSERT INTO role_permission (role_id, permission_id) VALUES
  (1,1),(1,2),(1,3),(1,4),(1,5),
  (2,1),(2,2),(2,3),(2,4),(2,5),(2,6),(2,7),(2,14),
  (3,1),(3,2),(3,3),(3,4),(3,5),(3,6),(3,7),(3,8),(3,14),
  (4,5),(4,9),(4,10),
  (5,1),(5,2),(5,3),(5,4),(5,5),(5,6),(5,7),(5,8),(5,9),(5,10),(5,11),(5,12),(5,13),(5,14);

-- ---------------------------------------------------------------------
-- Users (password_hash values are sample Django PBKDF2 hashes)
-- ---------------------------------------------------------------------
INSERT INTO user (user_id, role_id, first_name, last_name, email, email_verified_at, password_hash, account_status, created_at) VALUES
  (1,  5, 'Angela',      'Brooks',   'angela.brooks@famu.edu',     '2026-08-15 09:00', 'pbkdf2_sha256$870000$Kq3vX9$adm1nHashSampleQ0x4bY2', 'Active', '2026-08-15 09:00'),
  (2,  4, 'Marcus',      'Johnson',  'marcus.johnson@famu.edu',    '2026-08-20 10:15', 'pbkdf2_sha256$870000$Lw8nP2$modHashSampleT5v7rK1aZ', 'Active', '2026-08-20 10:15'),
  (3,  4, 'Keisha',      'Williams', 'keisha.williams@famu.edu',   '2026-08-21 14:30', 'pbkdf2_sha256$870000$Rt6mQ4$modHashSampleH2c9sL0pW', 'Active', '2026-08-21 14:30'),
  (4,  2, 'Robert',      'Hayes',    'robert.hayes@famu.edu',      '2026-08-25 08:45', 'pbkdf2_sha256$870000$Yp1kD7$deptHashSampleM8x3wQ6n', 'Active', '2026-08-25 08:45'),
  (5,  2, 'Tanya',       'Mitchell', 'tanya.mitchell@famu.edu',    '2026-08-26 11:20', 'pbkdf2_sha256$870000$Ub5hF3$deptHashSampleJ4z1vN8e', 'Active', '2026-08-26 11:20'),
  (6,  2, 'Gregory',     'Lane',     'gregory.lane@famu.edu',      '2026-08-27 13:05', 'pbkdf2_sha256$870000$Iz9gS6$deptHashSampleB7q5yC2t', 'Active', '2026-08-27 13:05'),
  (7,  3, 'Jasmine',     'Carter',   'jasmine1.carter@famu.edu',   '2026-09-02 16:40', 'pbkdf2_sha256$870000$Oc2jA8$orgHashSampleE3r6uT9m',  'Active', '2026-09-02 16:40'),
  (8,  3, 'Darnell',     'Thomas',   'darnell.thomas@famu.edu',    '2026-09-03 12:10', 'pbkdf2_sha256$870000$Ae4lG1$orgHashSampleW9n2kP5d',  'Active', '2026-09-03 12:10'),
  (9,  3, 'Aaliyah',     'Robinson', 'aaliyah.robinson@famu.edu',  '2026-09-04 09:55', 'pbkdf2_sha256$870000$Sd7wH5$orgHashSampleR1m8fX3b',  'Active', '2026-09-04 09:55'),
  (10, 1, 'Jordan',      'Davis',    'jordan2.davis@famu.edu',     '2026-09-05 18:25', 'pbkdf2_sha256$870000$Df3eJ9$userHashSampleZ6p4hV1c', 'Active', '2026-09-05 18:25'),
  (11, 1, 'Imani',       'Scott',    'imani.scott@famu.edu',       '2026-09-06 20:00', 'pbkdf2_sha256$870000$Gh8rK2$userHashSampleN3t7jD5w', 'Active', '2026-09-06 20:00'),
  (12, 1, 'Elijah',      'Moore',    'elijah.moore@famu.edu',      '2026-09-08 15:35', 'pbkdf2_sha256$870000$Jk1tL6$userHashSampleC8y2gF4s', 'Active', '2026-09-08 15:35'),
  (13, 1, 'Brianna',     'Harris',   'brianna.harris@famu.edu',    '2026-09-10 10:50', 'pbkdf2_sha256$870000$Lm6yZ4$userHashSampleV5k9bH2q', 'Active', '2026-09-10 10:50'),
  (14, 1, 'Christopher', 'Lee',      'christopher.lee@famu.edu',   '2026-09-12 08:05', 'pbkdf2_sha256$870000$Nb9uX7$userHashSampleP2w6mJ8r', 'Active', '2026-09-12 08:05'),
  (15, 1, 'Destiny',     'Walker',   'destiny.walker@famu.edu',    NULL,               'pbkdf2_sha256$870000$Qv2iC3$userHashSampleS7e1nL4y', 'Active', '2026-11-01 19:30'),
  (16, 1, 'Tyrell',      'Jackson',  'tyrell.jackson@famu.edu',    '2026-09-15 17:15', 'pbkdf2_sha256$870000$Wx5oB8$userHashSampleK4d3cM9u', 'Active', '2026-09-15 17:15');

-- ---------------------------------------------------------------------
-- Departments and student organizations
-- ---------------------------------------------------------------------
INSERT INTO organization (organization_id, organization_type, name, location, contact_email, status) VALUES
  (1, 'Department',           'Department of Computer & Information Sciences', 'Banneker Building, Suite 100',  'cis@famu.edu',      'Approved'),
  (2, 'Department',           'Department of Biology',                         'Jones Hall, Room 301',          'biology@famu.edu',  'Approved'),
  (3, 'Department',           'Coleman Library',                               'Coleman Library, Main Floor',   'library@famu.edu',  'Approved'),
  (4, 'Student Organization', 'FAMU Environmental Club',                       'Student Union, Room 214',       'envclub@famu.edu',  'Approved'),
  (5, 'Student Organization', 'Rattler Robotics Club',                         'Banneker Building, Lab B',      'robotics@famu.edu', 'Approved'),
  (6, 'Student Organization', 'Pre-Med Society',                               'Student Union, Room 118',       'premed@famu.edu',   'Pending'),
  (7, 'Student Organization', 'FAMU Art Club',                                 'Student Union, Room 220',       'artclub@famu.edu',  'Approved');

INSERT INTO organization_member (organization_id, user_id, member_role, approved_at, is_active) VALUES
  (1, 4,  'Primary Contact', '2026-08-26 09:00', TRUE),
  (2, 5,  'Primary Contact', '2026-08-27 09:00', TRUE),
  (3, 6,  'Primary Contact', '2026-08-28 09:00', TRUE),
  (4, 7,  'Primary Contact', '2026-09-03 10:00', TRUE),
  (4, 13, 'Representative',  '2026-09-20 14:00', TRUE),
  (5, 8,  'Primary Contact', '2026-09-04 10:00', TRUE),
  (6, 9,  'Primary Contact', NULL,               TRUE);

-- ---------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------
INSERT INTO category (category_id, name, description, rules, is_active) VALUES
  (1, 'Textbooks',         'Course textbooks, lab manuals and study guides', 'Must include edition; no access codes sold separately.', TRUE),
  (2, 'Electronics',       'Computers, calculators, monitors and accessories', 'Personal data must be wiped from storage devices before listing.', TRUE),
  (3, 'Furniture',         'Desks, tables, chairs and shelving', NULL, TRUE),
  (4, 'School Supplies',   'Notebooks, pens, binders and art supplies', NULL, TRUE),
  (5, 'Office Equipment',  'Office chairs, carts, organizers and stands', NULL, TRUE),
  (6, 'Lab Equipment',     'Microscopes, glassware and lab apparel', 'No chemicals, biological materials or hazardous waste.', TRUE),
  (7, 'Dorm Essentials',   'Mini-fridges, microwaves, lamps and bedding', 'Appliances must be clean and working.', TRUE),
  (8, 'Clothing',          'Coats, professional attire and lab-safe clothing', NULL, TRUE);

-- ---------------------------------------------------------------------
-- System settings (needed before reservations: expiry uses them)
-- ---------------------------------------------------------------------
INSERT INTO system_setting (setting_key, setting_value, updated_by_user_id) VALUES
  ('reservation_expiration_hours', '48',       1),
  ('campus_email_domain',          'famu.edu', 1),
  ('max_images_per_item',          '6',        1),
  ('listing_archive_days',         '30',       1),
  ('new_listings_require_review',  'true',     1);

-- ---------------------------------------------------------------------
-- Items: personal, department and student-organization listings
-- ---------------------------------------------------------------------
INSERT INTO item (item_id, posted_by_user_id, owner_organization_id, category_id, title, description, item_condition, quantity, pickup_location, estimated_value, status, created_at) VALUES
  (1,  10, NULL, 1, 'Calculus: Early Transcendentals, 8th Edition', 'Stewart calculus text used for MAC 2311. Light highlighting in chapters 2-4.', 'Good', 1, 'Coleman Library lobby', 45.00, 'Available', '2026-10-01 12:00'),
  (2,  11, NULL, 1, 'Campbell Biology, 12th Edition', 'Hardcover, no writing inside. Great for BSC 2010.', 'Like New', 1, 'Student Union food court', 60.00, 'Available', '2026-10-02 15:30'),
  (3,  12, NULL, 2, 'TI-84 Plus Graphing Calculator', 'Works perfectly, includes cover and new batteries.', 'Good', 1, 'Coleman Library lobby', 70.00, 'Available', '2026-10-03 09:10'),
  (4,  13, NULL, 7, 'Mini-Fridge, 3.1 cu ft', 'Compact fridge with small freezer section. Clean and cold.', 'Good', 1, 'Gibbs Hall lobby', 90.00, 'Available', '2026-10-04 17:45'),
  (5,  10, NULL, 7, 'LED Desk Lamp with USB Port', 'Three brightness levels, adjustable arm.', 'Like New', 1, 'Paddyfoote Complex front desk', 20.00, 'Available', '2026-10-05 19:00'),
  (6,  4,  1,    2, 'Dell OptiPlex 7070 Desktop Computers', 'Retired lab computers, wiped and reimaged. Keyboards and mice included.', 'Good', 4, 'Banneker Building, Room 102', 600.00, 'Available', '2026-10-06 08:30'),
  (7,  4,  1,    2, '24-inch Dell Monitors', 'Six matching monitors with HDMI and DisplayPort cables.', 'Good', 6, 'Banneker Building, Room 102', 300.00, 'Available', '2026-10-06 08:45'),
  (8,  4,  1,    5, 'Ergonomic Office Chairs', 'Adjustable mesh chairs from the CIS faculty offices.', 'Fair', 5, 'Banneker Building, Suite 100', 250.00, 'Available', '2026-10-07 10:00'),
  (9,  5,  2,    6, 'Compound Microscope', 'Binocular microscope with 4x/10x/40x/100x objectives.', 'Good', 1, 'Jones Hall, Room 301', 400.00, 'Available', '2026-10-08 11:15'),
  (10, 5,  2,    6, 'Lab Coats (assorted sizes)', 'Ten laundered white lab coats, sizes S to XL.', 'Like New', 10, 'Jones Hall, Room 301', 150.00, 'Available', '2026-10-08 11:30'),
  (11, 5,  2,    6, 'Borosilicate Beaker Set', 'Set of 12 beakers, 50-1000 ml. Awaiting moderator review.', 'Good', 1, 'Jones Hall, Room 301', 80.00, 'Pending Review', '2026-11-04 16:00'),
  (12, 6,  3,    3, 'Study Tables', 'Three solid wood study tables from the second floor renovation.', 'Good', 3, 'Coleman Library loading dock', 225.00, 'Available', '2026-10-09 09:00'),
  (13, 6,  3,    5, 'Rolling Book Cart', 'Three-shelf steel book cart, one wheel squeaks.', 'Fair', 1, 'Coleman Library loading dock', 60.00, 'Available', '2026-10-09 09:20'),
  (14, 8,  5,    2, 'Arduino Uno Starter Kits', 'Eight kits with boards, breadboards, sensors and jumper wires.', 'New', 8, 'Banneker Building, Lab B', 240.00, 'Available', '2026-10-10 14:00'),
  (15, 7,  4,    7, 'Reusable Water Bottles', 'Thirty stainless steel bottles left over from Earth Week.', 'New', 30, 'Student Union, Room 214', 150.00, 'Available', '2026-10-11 13:00'),
  (16, 14, NULL, 1, 'Organic Chemistry, 9th Edition', 'Wade organic chemistry with solutions manual.', 'Good', 1, 'Frederick S. Humphries Science Center', 55.00, 'Available', '2026-10-12 10:30'),
  (17, 14, NULL, 3, 'Five-Shelf Wooden Bookshelf', 'Sturdy bookshelf, easy to disassemble for moving.', 'Good', 1, 'Lee Hall parking lot', 40.00, 'Available', '2026-10-12 10:45'),
  (18, 11, NULL, 4, 'Lab Notebook Pack (5)', 'Five unused quadrille lab notebooks.', 'New', 1, 'Student Union food court', 12.00, 'Available', '2026-10-13 18:00'),
  (19, 12, NULL, 8, 'Black Winter Coat (Men''s M)', 'Warm insulated coat, worn one season.', 'Good', 1, 'Gibbs Hall lobby', 35.00, 'Available', '2026-10-14 16:20'),
  (20, 10, NULL, 7, '700W Microwave', 'Countertop microwave, clean inside.', 'Good', 1, 'Paddyfoote Complex front desk', 30.00, 'Available', '2026-10-15 20:10'),
  (21, 13, NULL, 5, 'Adjustable Laptop Stand', 'Aluminum stand, folds flat.', 'Like New', 1, 'Gibbs Hall lobby', 25.00, 'Available', '2026-10-16 12:00'),
  (22, 16, NULL, 1, 'Introduction to Psychology, 7th Edition', 'Listed as 7th edition; reported as an older edition with missing pages.', 'Poor', 1, 'Student Union food court', 15.00, 'Removed', '2026-10-17 14:00'),
  -- Items contributed to the Environmental Club move-out drive (owned by the club once received)
  (23, 12, 4,    4, 'Box of Notebooks and Pens', 'Assorted unused school supplies from a graduating senior.', 'Good', 1, 'Gibbs Hall drop-off table', 20.00, 'Available', '2026-10-22 11:00'),
  (24, 10, 4,    7, 'Twin XL Bedding Set', 'Sheets, pillowcase and comforter, laundered.', 'Like New', 1, 'Gibbs Hall drop-off table', 35.00, 'Available', '2026-10-23 15:00'),
  (25, 11, 4,    4, 'Desk Organizer', 'Mesh desk organizer with drawer.', 'Good', 1, 'Gibbs Hall drop-off table', 10.00, 'Completed', '2026-10-24 09:30'),
  (26, 14, 4,    2, 'TI-83 Plus Calculator', 'Older calculator, works, battery cover missing.', 'Fair', 1, 'Gibbs Hall drop-off table', 25.00, 'Pending Review', '2026-11-03 10:00');

INSERT INTO item_image (item_id, image_url, display_order) VALUES
  (1,  'https://res.cloudinary.com/rattler-rrs/image/upload/items/1/front.jpg', 1),
  (2,  'https://res.cloudinary.com/rattler-rrs/image/upload/items/2/cover.jpg', 1),
  (3,  'https://res.cloudinary.com/rattler-rrs/image/upload/items/3/front.jpg', 1),
  (3,  'https://res.cloudinary.com/rattler-rrs/image/upload/items/3/back.jpg', 2),
  (4,  'https://res.cloudinary.com/rattler-rrs/image/upload/items/4/outside.jpg', 1),
  (4,  'https://res.cloudinary.com/rattler-rrs/image/upload/items/4/inside.jpg', 2),
  (6,  'https://res.cloudinary.com/rattler-rrs/image/upload/items/6/desktops.jpg', 1),
  (7,  'https://res.cloudinary.com/rattler-rrs/image/upload/items/7/monitors.jpg', 1),
  (9,  'https://res.cloudinary.com/rattler-rrs/image/upload/items/9/microscope.jpg', 1),
  (12, 'https://res.cloudinary.com/rattler-rrs/image/upload/items/12/tables.jpg', 1),
  (14, 'https://res.cloudinary.com/rattler-rrs/image/upload/items/14/kit.jpg', 1),
  (14, 'https://res.cloudinary.com/rattler-rrs/image/upload/items/14/contents.jpg', 2),
  (15, 'https://res.cloudinary.com/rattler-rrs/image/upload/items/15/bottles.jpg', 1),
  (16, 'https://res.cloudinary.com/rattler-rrs/image/upload/items/16/cover.jpg', 1),
  (17, 'https://res.cloudinary.com/rattler-rrs/image/upload/items/17/shelf.jpg', 1),
  (20, 'https://res.cloudinary.com/rattler-rrs/image/upload/items/20/microwave.jpg', 1),
  (24, 'https://res.cloudinary.com/rattler-rrs/image/upload/items/24/bedding.jpg', 1);

-- ---------------------------------------------------------------------
-- Reservations. Triggers set expires_at (48 h from settings) and update
-- ITEM.status (Reserved / Completed). History first, then open ones.
-- ---------------------------------------------------------------------
INSERT INTO reservation (reservation_id, item_id, reserved_by_user_id, receiver_organization_id, reserved_at, status, pickup_note) VALUES
  (1, 1,  12, NULL, '2026-10-05 10:00', 'Completed', 'Can meet after my 2pm class.'),
  (2, 6,  8,  5,    '2026-10-12 09:30', 'Completed', 'Robotics Club will pick up with a cart.'),
  (3, 12, 7,  4,    '2026-10-14 13:00', 'Completed', 'For the Environmental Club sorting room.'),
  (4, 2,  13, NULL, '2026-10-20 16:00', 'Cancelled', 'Found the book in the library instead.'),
  (5, 19, 10, NULL, '2026-10-18 11:00', 'Expired',   NULL);

INSERT INTO reservation (reservation_id, item_id, reserved_by_user_id, receiver_organization_id, reserved_at, status, pickup_note) VALUES
  (6,  3,  10, NULL, NOW() - INTERVAL 5 HOUR,  'Active',  'Need it for Calc I exam next week.'),
  (7,  4,  11, NULL, NOW() - INTERVAL 2 HOUR,  'Active',  'I can bring a hand truck.'),
  (8,  7,  5,  2,    NOW() - INTERVAL 1 DAY,   'Pending', 'Biology teaching lab needs two monitors; awaiting CIS approval.'),
  (9,  16, 13, NULL, NOW() - INTERVAL 3 HOUR,  'Active',  NULL),
  (10, 14, 4,  1,    NOW() - INTERVAL 6 HOUR,  'Active',  'For the CIS intro to embedded systems lab.');

-- ---------------------------------------------------------------------
-- Exchanges
-- ---------------------------------------------------------------------
INSERT INTO exchange (exchange_id, reservation_id, pickup_time, pickup_location, giver_confirmed_at, receiver_confirmed_at, status, completed_at) VALUES
  (1, 1, '2026-10-06 15:00', 'Coleman Library lobby',        '2026-10-06 15:10', '2026-10-06 15:12', 'Completed', '2026-10-06 15:12'),
  (2, 2, '2026-10-13 10:00', 'Banneker Building, Room 102',  '2026-10-13 10:20', '2026-10-13 10:25', 'Completed', '2026-10-13 10:25'),
  (3, 3, '2026-10-15 09:00', 'Coleman Library loading dock', '2026-10-15 09:30', '2026-10-15 09:40', 'Completed', '2026-10-15 09:40');

INSERT INTO exchange (exchange_id, reservation_id, pickup_time, pickup_location, giver_confirmed_at, receiver_confirmed_at, status) VALUES
  (4, 6, NOW() + INTERVAL 1 DAY,   'Coleman Library lobby', NULL,                    NULL, 'Scheduled'),
  (5, 7, NOW() + INTERVAL 3 HOUR,  'Gibbs Hall lobby',      NOW() - INTERVAL 1 HOUR, NULL, 'Scheduled');

-- ---------------------------------------------------------------------
-- Messages between users arranging pickups
-- ---------------------------------------------------------------------
INSERT INTO message (sender_user_id, recipient_user_id, reservation_id, body, sent_at, is_read) VALUES
  (12, 10, 1,  'Hi Jordan, is the calculus book still available for pickup tomorrow?', '2026-10-05 10:05', TRUE),
  (10, 12, 1,  'Yes! Coleman Library lobby at 3pm works.',                            '2026-10-05 10:20', TRUE),
  (10, 12, 6,  'Hi Elijah, can I pick up the TI-84 tomorrow at noon?',                NOW() - INTERVAL 4 HOUR, TRUE),
  (12, 10, 6,  'Noon works. I will be at the Coleman Library lobby.',                 NOW() - INTERVAL 3 HOUR, FALSE),
  (11, 13, 7,  'Hi Brianna, I can come get the fridge this afternoon.',               NOW() - INTERVAL 2 HOUR, TRUE),
  (13, 11, 7,  'Great, I left it by the front desk at Gibbs Hall. Confirmed on my side.', NOW() - INTERVAL 1 HOUR, FALSE),
  (5,  4,  8,  'Robert, Biology would love two of the monitors for our teaching lab.', NOW() - INTERVAL 1 DAY, TRUE),
  (4,  5,  8,  'Happy to help. I will approve the request once our inventory is updated.', NOW() - INTERVAL 20 HOUR, FALSE);

-- ---------------------------------------------------------------------
-- Collection drives and giveaways
-- ---------------------------------------------------------------------
INSERT INTO collection_event (event_id, organization_id, created_by_user_id, event_type, title, description, participation_instructions, location, start_at, end_at, status) VALUES
  (1, 4, 7, 'Collection Drive', 'Fall Move-Out Collection Drive',
      'Donate dorm items and supplies instead of throwing them away.',
      'Bring clean, working items to the Gibbs Hall drop-off table between 10am and 6pm. No mattresses or food.',
      'Gibbs Hall lobby', '2026-10-20 10:00', '2026-11-10 18:00', 'Active'),
  (2, 5, 8, 'Giveaway', 'Electronics Giveaway Day',
      'Free refurbished electronics for students in engineering and CIS courses.',
      'Bring your FAMU ID. One item per student, first come first served.',
      'Banneker Building, Lab B', '2026-11-12 10:00', '2026-11-12 16:00', 'Planned');

INSERT INTO event_category (event_id, category_id) VALUES
  (1, 3), (1, 4), (1, 7), (1, 2),
  (2, 2);

INSERT INTO event_item (event_id, item_id, contributor_user_id, distribution_status, received_at, distributed_at) VALUES
  (1, 23, 12, 'Accepted',    '2026-10-22 11:30', NULL),
  (1, 24, 10, 'Available',   '2026-10-23 15:30', NULL),
  (1, 25, 11, 'Distributed', '2026-10-24 10:00', '2026-10-29 14:00'),
  (1, 26, 14, 'Pending',     NULL,               NULL);

-- ---------------------------------------------------------------------
-- Reports, moderation cases and actions
-- ---------------------------------------------------------------------
INSERT INTO report (report_id, reporter_user_id, reported_user_id, reported_organization_id, item_id, exchange_id, event_id, reason, details, status, created_at) VALUES
  (1, 11, 16,   NULL, 22,   NULL, NULL, 'Inaccurate Description', 'Listed as the 7th edition but it is the 4th edition and chapters 9-10 are missing.', 'Resolved', '2026-10-18 09:00'),
  (2, 14, 16,   NULL, NULL, NULL, NULL, 'Suspicious Activity',    'Reserved three of my items this month and never showed up for pickup.', 'Under Review', '2026-10-28 13:30'),
  (3, 10, NULL, NULL, NULL, NULL, 2,    'Misleading Event Information', 'Flyer says laptops will be given away, but the listing only shows Arduino kits.', 'Open', '2026-11-03 17:45'),
  (4, 12, NULL, 3,    13,   NULL, NULL, 'Item Not As Described', 'The book cart has two broken wheels, not one.', 'Open', '2026-11-04 12:15');

INSERT INTO moderation_case (case_id, report_id, assigned_to_user_id, escalated_to_user_id, escalated_at, status, findings, resolution, closed_at) VALUES
  (1, 1, 2, NULL, NULL, 'Closed',
     'Photos confirm the 4th edition with missing pages.',
     'Listing removed and the seller was warned.', '2026-10-19 11:00'),
  (2, 2, 3, 1, '2026-10-30 10:00', 'Escalated',
     'Three no-shows in October confirmed from reservation history.', NULL, NULL);

INSERT INTO moderation_action (case_id, performed_by_user_id, action_type, reason, restriction_ends_at, notes, created_at) VALUES
  (1, 2, 'Listing Removed',         'Listing misrepresented the edition and condition.', NULL, 'Item 22 set to Removed.', '2026-10-19 10:45'),
  (1, 2, 'Warning',                 'First warning for an inaccurate listing.', NULL, NULL, '2026-10-19 10:50'),
  (2, 3, 'Reservation Restriction', 'Repeated no-shows for reserved items.', '2026-11-13 10:00', 'Referred to an administrator for account review.', '2026-10-30 09:45');

-- ---------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------
INSERT INTO notification (user_id, notification_type, message, is_read, created_at) VALUES
  (12, 'Reservation Confirmed', 'Your reservation for "TI-84 Plus Graphing Calculator" was received by Jordan Davis.', FALSE, NOW() - INTERVAL 5 HOUR),
  (10, 'Exchange Update',       'Pickup for "TI-84 Plus Graphing Calculator" is scheduled for tomorrow at Coleman Library lobby.', FALSE, NOW() - INTERVAL 3 HOUR),
  (11, 'Exchange Update',       'Brianna Harris confirmed the handover of "Mini-Fridge". Please confirm when you have it.', FALSE, NOW() - INTERVAL 1 HOUR),
  (4,  'Approval Needed',       'Department of Biology requested 2 x "24-inch Dell Monitors".', FALSE, NOW() - INTERVAL 1 DAY),
  (7,  'Drive Update',          'A new donation is waiting for review: "TI-83 Plus Calculator".', FALSE, '2026-11-03 10:05'),
  (11, 'Report Resolved',       'Your report about "Introduction to Psychology, 7th Edition" was resolved.', TRUE, '2026-10-19 11:05'),
  (16, 'Moderation Notice',     'Your reservation privileges are restricted until 2026-11-13.', TRUE, '2026-10-30 09:50'),
  (2,  'Report Submitted',      'New report: Misleading Event Information for "Electronics Giveaway Day".', FALSE, '2026-11-03 17:46');

-- ---------------------------------------------------------------------
-- Administrator account action, recorded by trigger in AUDIT_LOG
-- ---------------------------------------------------------------------
SET @actor_user_id = 1;
SET @justification = 'Escalated case #2: three confirmed no-shows in October. Suspended pending student conduct review.';
UPDATE user SET account_status = 'Suspended' WHERE user_id = 16;
SET @actor_user_id = NULL;
SET @justification = NULL;
