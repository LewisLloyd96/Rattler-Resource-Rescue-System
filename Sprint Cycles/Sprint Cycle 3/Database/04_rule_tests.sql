-- =====================================================================
-- Rattler Resource Rescue System — Business Rule Verification (MySQL 8.0+)
-- Sprint Cycle III: Database Implementation
--
-- Tries to break each important rule from Sprint Cycle II and shows
-- whether the database rejected it (PASS) and the error MySQL returned.
-- Everything runs in one transaction that is rolled back, so the sample
-- data is unchanged. Safe to run at any time, including during a demo.
--
-- Run after 02_sample_data.sql:  mysql -u root -p -t < 04_rule_tests.sql
-- =====================================================================

USE rattler_resource_rescue;

DROP PROCEDURE IF EXISTS run_rule_tests;

DELIMITER $$

CREATE PROCEDURE run_rule_tests()
BEGIN
  -- MEMORY tables are not transactional, so results survive the ROLLBACK.
  DROP TEMPORARY TABLE IF EXISTS rule_test_result;
  CREATE TEMPORARY TABLE rule_test_result (
    test_no   INT,
    rule_text VARCHAR(90),
    enforced_by VARCHAR(40),
    expected  VARCHAR(8),
    result    VARCHAR(4),
    mysql_message VARCHAR(500)
  ) ENGINE=MEMORY;

  START TRANSACTION;

  -- 1
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO user (role_id, first_name, last_name, email, password_hash)
    VALUES (1, 'Jordan', 'Davis', 'jordan2.davis@famu.edu', 'x');
    INSERT INTO rule_test_result VALUES (1, 'A user email must be unique', 'UNIQUE constraint', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 2
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO user (role_id, first_name, last_name, email, password_hash)
    VALUES (1, 'Sam', 'Rivera', 'sam.rivera@gmail.com', 'x');
    INSERT INTO rule_test_result VALUES (2, 'Accounts require a campus (@famu.edu) email', 'CHECK constraint', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 3
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO reservation (item_id, reserved_by_user_id) VALUES (2, 15);  -- Destiny: email not verified
    INSERT INTO rule_test_result VALUES (3, 'A verified campus email is required to reserve', 'Trigger', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 4
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO reservation (item_id, reserved_by_user_id) VALUES (3, 11);  -- TI-84 is already Reserved
    INSERT INTO rule_test_result VALUES (4, 'Only Available items can be reserved', 'Trigger', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 5
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO reservation (item_id, reserved_by_user_id) VALUES (2, 10);  -- valid: opens item 2
    UPDATE reservation SET status = 'Active' WHERE reservation_id = 4;      -- reopen an old one on item 2
    INSERT INTO rule_test_result VALUES (5, 'An item can have only one open reservation', 'Unique index (generated col)', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 6
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO reservation (item_id, reserved_by_user_id) VALUES (8, 10);   -- valid: Jordan's first Office Equipment item
    INSERT INTO reservation (item_id, reserved_by_user_id) VALUES (21, 10);  -- second open Office Equipment reservation
    INSERT INTO rule_test_result VALUES (6, 'Anti-hoarding: one open personal reservation per category', 'Trigger', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 7
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO reservation (item_id, reserved_by_user_id) VALUES (20, 10);  -- Jordan's own microwave
    INSERT INTO rule_test_result VALUES (7, 'Users cannot reserve their own listings', 'Trigger', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 8
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    SET @actor_user_id = 1, @justification = 'Rule test setup (rolled back)';
    UPDATE user SET account_status = 'Suspended' WHERE user_id = 16;          -- make sure Tyrell is Suspended
    SET @actor_user_id = NULL, @justification = NULL;
    INSERT INTO reservation (item_id, reserved_by_user_id) VALUES (18, 16);
    INSERT INTO rule_test_result VALUES (8, 'Suspended accounts cannot reserve items', 'Trigger', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 9
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO reservation (item_id, reserved_by_user_id, reserved_at, expires_at)
    VALUES (18, 14, NOW(), NOW() - INTERVAL 1 HOUR);
    INSERT INTO rule_test_result VALUES (9, 'A reservation must expire after it was made', 'CHECK constraint', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 10
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    UPDATE exchange SET status = 'Completed', completed_at = NOW() WHERE exchange_id = 4;  -- nobody confirmed
    INSERT INTO rule_test_result VALUES (10, 'An exchange completes only when both sides confirm', 'CHECK constraint', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 11
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO exchange (reservation_id, pickup_time, pickup_location) VALUES (6, NOW() + INTERVAL 2 DAY, 'Lee Hall');
    INSERT INTO rule_test_result VALUES (11, 'One exchange per reservation (one-to-one)', 'UNIQUE constraint', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 12
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO item (posted_by_user_id, category_id, title, description, item_condition, pickup_location)
    VALUES (10, 99, 'Mystery Item', 'No such category', 'Good', 'Lee Hall');
    INSERT INTO rule_test_result VALUES (12, 'Every item must belong to an existing category', 'FOREIGN KEY', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 13
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO item (posted_by_user_id, category_id, title, description, item_condition, pickup_location, status)
    VALUES (10, 1, 'Old Notes', 'Lecture notes', 'Good', 'Lee Hall', 'Sold');
    INSERT INTO rule_test_result VALUES (13, 'Item status must be a defined status', 'CHECK constraint', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 14
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO report (reporter_user_id, reason) VALUES (10, 'Other');
    INSERT INTO rule_test_result VALUES (14, 'A report must name what is being reported', 'CHECK constraint', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 15
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    UPDATE moderation_case SET status = 'Closed', closed_at = NOW() WHERE case_id = 2;  -- no resolution
    INSERT INTO rule_test_result VALUES (15, 'A moderation case cannot close without a resolution', 'CHECK constraint', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 16
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO moderation_action (case_id, performed_by_user_id, action_type, reason)
    VALUES (2, 3, 'Messaging Restriction', 'Spam messages');  -- no end date
    INSERT INTO rule_test_result VALUES (16, 'Restrictions must be temporary (need an end date)', 'CHECK constraint', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 17
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO moderation_action (case_id, performed_by_user_id, action_type)
    VALUES (2, 3, 'Warning');  -- no reason
    INSERT INTO rule_test_result VALUES (17, 'Every moderation action needs a reason', 'NOT NULL', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 18
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO collection_event (organization_id, created_by_user_id, event_type, title, location, start_at, end_at)
    VALUES (1, 4, 'Giveaway', 'CIS Surplus Day', 'Banneker Building', NOW(), NOW() + INTERVAL 1 DAY);
    INSERT INTO rule_test_result VALUES (18, 'Only approved student organizations host events', 'Trigger', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 19
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO collection_event (organization_id, created_by_user_id, event_type, title, location, start_at, end_at)
    VALUES (4, 7, 'Giveaway', 'Backwards Event', 'Student Union', NOW(), NOW() - INTERVAL 1 DAY);
    INSERT INTO rule_test_result VALUES (19, 'An event must end after it starts', 'CHECK constraint', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 20
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    SET @actor_user_id = NULL; SET @justification = NULL;
    UPDATE user SET account_status = 'Banned' WHERE user_id = 12;
    INSERT INTO rule_test_result VALUES (20, 'Account status changes need an admin and justification', 'Trigger + AUDIT_LOG', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 21
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO message (sender_user_id, recipient_user_id, body) VALUES (10, 10, 'Note to self');
    INSERT INTO rule_test_result VALUES (21, 'Users cannot message themselves', 'CHECK constraint', 'reject', IF(@msg IS NULL, 'FAIL', 'PASS'), @msg);
  END;

  -- 22: a valid reservation is accepted, and the trigger sets expiry and item status
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
    SET @msg = NULL;
    INSERT INTO reservation (item_id, reserved_by_user_id) VALUES (18, 14);
    SET @hours = (SELECT CAST(setting_value AS UNSIGNED) FROM system_setting WHERE setting_key = 'reservation_expiration_hours');
    SET @ok = (SELECT i.status = 'Reserved' AND r.expires_at = r.reserved_at + INTERVAL @hours HOUR
                 FROM reservation r JOIN item i ON i.item_id = r.item_id
                WHERE r.reservation_id = LAST_INSERT_ID());
    INSERT INTO rule_test_result VALUES (22, 'Valid reservation: accepted, expiry set from settings, item Reserved', 'Triggers', 'accept',
      IF(@msg IS NULL AND @ok, 'PASS', 'FAIL'), COALESCE(@msg, 'Accepted'));
  END;

  ROLLBACK;

  SELECT test_no AS `#`, rule_text AS rule_tested, enforced_by, expected, result, mysql_message
    FROM rule_test_result ORDER BY test_no;
  SELECT CONCAT(SUM(result = 'PASS'), ' of ', COUNT(*), ' rule tests passed') AS summary FROM rule_test_result;
END$$

DELIMITER ;

CALL run_rule_tests();
