-- Sets the shared local-development password for the fictional sample accounts.
-- Do not use this sample password for real accounts.
-- Password: Rattler2026!
USE rattler_resource_rescue;

UPDATE user
SET password_hash = 'pbkdf2_sha256$870000$rrrsDemo2026$uzeZTJ33n4bYShU36n6JWFiajiyE08Ixlh4aRRYq+44='
WHERE email IN (
  'angela.brooks@famu.edu',
  'marcus.johnson@famu.edu',
  'keisha.williams@famu.edu',
  'robert.hayes@famu.edu',
  'tanya.mitchell@famu.edu',
  'gregory.lane@famu.edu',
  'jasmine1.carter@famu.edu',
  'darnell.thomas@famu.edu',
  'aaliyah.robinson@famu.edu',
  'jordan2.davis@famu.edu',
  'imani.scott@famu.edu',
  'elijah.moore@famu.edu',
  'brianna.harris@famu.edu',
  'christopher.lee@famu.edu',
  'destiny.walker@famu.edu',
  'tyrell.jackson@famu.edu'
);
