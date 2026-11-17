-- Limit the Django account to reads and the table writes required by its APIs.
-- MYSQL_USER initially receives broader privileges, so revoke them first.
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'rrrs_app'@'%';

GRANT SELECT ON rattler_resource_rescue.* TO 'rrrs_app'@'%';
GRANT EXECUTE ON PROCEDURE rattler_resource_rescue.reserve_item TO 'rrrs_app'@'%';
GRANT INSERT, UPDATE ON rattler_resource_rescue.item TO 'rrrs_app'@'%';
GRANT INSERT, UPDATE ON rattler_resource_rescue.category TO 'rrrs_app'@'%';
GRANT UPDATE ON rattler_resource_rescue.reservation TO 'rrrs_app'@'%';
GRANT INSERT ON rattler_resource_rescue.message TO 'rrrs_app'@'%';
GRANT UPDATE ON rattler_resource_rescue.report TO 'rrrs_app'@'%';
GRANT UPDATE ON rattler_resource_rescue.system_setting TO 'rrrs_app'@'%';
GRANT UPDATE ON rattler_resource_rescue.organization TO 'rrrs_app'@'%';
