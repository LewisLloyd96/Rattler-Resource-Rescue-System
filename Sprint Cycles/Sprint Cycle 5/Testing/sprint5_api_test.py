"""Sprint Cycle V acceptance tests: adding and modifying data.

For each of the five assigned use cases this checks, against the running API
and the real MySQL database (no mocks):

  1. A normal case with valid data succeeds.
  2. Invalid or incomplete data is rejected (and the wrong role is refused).
  3. The row was actually added to / changed in MySQL (checked with a direct
     SELECT, not through the API).
Then it re-runs the Sprint IV tests to show earlier functionality still works.

The tests write real data. Reload the database before a demo:
  mysql -u root -p < 01_schema.sql, 02_sample_data.sql, 05_demo_passwords.sql

Run from the repository root with the backend virtual environment active
(it reads the database settings from backend/.env):
  python "Sprint Cycles/Sprint Cycle 5/Testing/sprint5_api_test.py"
"""
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import pymysql
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parents[3]
BASE = 'http://127.0.0.1:8000/api/'
PASSWORD = 'Rattler2026!'  # development password set by 05_demo_passwords.sql
RUN = time.strftime('%H%M%S')  # makes this run's titles unique

ACCOUNTS = {
    'admin': 'angela.brooks@famu.edu',
    'campus': 'jordan2.davis@famu.edu',
    'dept': 'robert.hayes@famu.edu',
    'org': 'jasmine1.carter@famu.edu',
    'mod': 'marcus.johnson@famu.edu',
}

results = []


def check(name, ok, detail=''):
    results.append(ok)
    print(f"  {'PASS' if ok else 'FAIL'}  {name}{f'  ({detail})' if detail else ''}")


def call(path, method='GET', body=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return response.status, json.loads(response.read() or b'{}')
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read() or b'{}')


def db():
    env = dotenv_values(ROOT / 'backend' / '.env')
    return pymysql.connect(
        host=env.get('DB_HOST', '127.0.0.1'), port=int(env.get('DB_PORT', 3306)),
        user=env.get('DB_USER', 'root'), password=env.get('DB_PASSWORD', ''),
        database=env.get('DB_NAME', 'rattler_resource_rescue'),
        cursorclass=pymysql.cursors.DictCursor, autocommit=True,
    )


def sql(query, args=()):
    with db() as connection, connection.cursor() as cursor:
        cursor.execute(query, args)
        return cursor.fetchall()


def short(data):
    return json.dumps(data)[:110]


def main():
    try:
        call('health/')
    except urllib.error.URLError as error:
        sys.exit(f'Cannot reach the API at {BASE}: {error.reason}. Start it with: python manage.py runserver')

    tokens = {}
    for key, email in ACCOUNTS.items():
        status, data = call('auth/login/', 'POST', {'email': email, 'password': PASSWORD})
        tokens[key] = data.get('token')
        if status != 200:
            sys.exit(f'Sign-in failed for {email}: {data}. Was 05_demo_passwords.sql run?')

    # ------------------------------------------------------------------
    print('1. Administrator activates or deactivates a user account')
    target = sql("SELECT user_id, first_name, last_name, account_status FROM user WHERE email = 'brianna.harris@famu.edu'")[0]
    uid = target['user_id']
    print(f"     before: {target['first_name']} {target['last_name']} is {target['account_status']}")
    audit_before = sql('SELECT COUNT(*) AS n FROM audit_log WHERE target_user_id = %s', [uid])[0]['n']
    status, data = call(f'users/{uid}/status/', 'PATCH', {'status': 'Deactivated', 'justification': 'Sprint V test: graduated, account closed.'}, tokens['admin'])
    row = sql('SELECT account_status FROM user WHERE user_id = %s', [uid])[0]
    check('Valid: deactivate account', status == 200 and row['account_status'] == 'Deactivated', f"HTTP {status}, MySQL now {row['account_status']}")
    status, data = call('auth/login/', 'POST', {'email': 'brianna.harris@famu.edu', 'password': PASSWORD})
    check('Deactivated user can no longer sign in', status == 401, f"HTTP {status}: {data.get('detail')}")
    status, data = call(f'users/{uid}/status/', 'PATCH', {'status': 'Active', 'justification': 'Sprint V test: account reinstated.'}, tokens['admin'])
    row = sql('SELECT account_status FROM user WHERE user_id = %s', [uid])[0]
    check('Valid: reactivate account', status == 200 and row['account_status'] == 'Active', f"HTTP {status}, MySQL now {row['account_status']}")
    audit = sql('SELECT action, justification FROM audit_log WHERE target_user_id = %s ORDER BY log_id', [uid])
    check('Database: both changes logged in audit_log with justification', len(audit) == audit_before + 2,
          ' | '.join(a['action'] for a in audit[-2:]))
    status, data = call(f'users/{uid}/status/', 'PATCH', {'status': 'Deactivated'}, tokens['admin'])
    check('Invalid: missing justification rejected', status == 400, f'HTTP {status}: {short(data)}')
    status, data = call(f"users/{sql('SELECT user_id FROM user WHERE email = %s', [ACCOUNTS['admin']])[0]['user_id']}/status/", 'PATCH',
                        {'status': 'Deactivated', 'justification': 'Testing self-deactivation.'}, tokens['admin'])
    check('Invalid: administrator cannot deactivate own account', status == 400, f'HTTP {status}: {short(data)}')
    status, _ = call(f'users/{uid}/status/', 'PATCH', {'status': 'Deactivated', 'justification': 'x'}, tokens['campus'])
    check('Authorization: Campus User refused', status == 403, f'HTTP {status}')

    # ------------------------------------------------------------------
    print('\n2. Campus User lists an item')
    title = f'Sprint V Desk Fan {RUN}'
    listing = {'title': title, 'description': 'Quiet three-speed desk fan, works well.', 'category_id': 7,
               'item_condition': 'Good', 'quantity': 1, 'pickup_location': 'Gibbs Hall lobby'}
    status, data = call('items/create/', 'POST', listing, tokens['campus'])
    rows = sql('SELECT i.item_id, i.status, u.email FROM item i JOIN user u ON u.user_id = i.posted_by_user_id WHERE i.title = %s', [title])
    check('Valid: listing created', status == 201, f'HTTP {status}: {short(data)}')
    check('Database: row inserted into item, owned by the Campus User',
          len(rows) == 1 and rows[0]['email'] == ACCOUNTS['campus'], f"item_id {rows[0]['item_id']}, status {rows[0]['status']}" if rows else 'no row')
    count_before = sql('SELECT COUNT(*) AS n FROM item')[0]['n']
    status, data = call('items/create/', 'POST', {**listing, 'title': '', 'quantity': 0}, tokens['campus'])
    check('Invalid: blank title and quantity 0 rejected', status == 400, f'HTTP {status}: {short(data)}')
    status, data = call('items/create/', 'POST', {**listing, 'title': f'Bad category {RUN}', 'category_id': 999}, tokens['campus'])
    check('Invalid: unknown category rejected', status == 400, f'HTTP {status}: {short(data)}')
    check('Database: nothing inserted by the invalid attempts', sql('SELECT COUNT(*) AS n FROM item')[0]['n'] == count_before)

    # ------------------------------------------------------------------
    print('\n3. Department Representative creates or updates a department listing')
    title = f'Sprint V Lab Stools {RUN}'
    dept_listing = {'title': title, 'description': 'Six adjustable lab stools from the CIS project lab.', 'category_id': 3,
                    'item_condition': 'Good', 'quantity': 6, 'pickup_location': 'Banneker Building, Room 102'}
    status, data = call('department/listings/', 'POST', dept_listing, tokens['dept'])
    rows = sql('SELECT i.item_id, o.name FROM item i JOIN organization o ON o.organization_id = i.owner_organization_id WHERE i.title = %s', [title])
    check('Valid: department listing created', status == 201 and len(rows) == 1, f'HTTP {status}')
    check('Database: owned by the department', bool(rows) and rows[0]['name'] == 'Department of Computer & Information Sciences',
          rows[0]['name'] if rows else 'no row')
    item_id = sql("SELECT item_id FROM item WHERE title = 'Ergonomic Office Chairs'")[0]['item_id']
    before = sql('SELECT quantity, pickup_location FROM item WHERE item_id = %s', [item_id])[0]
    status, data = call(f'department/listings/{item_id}/', 'PATCH', {'quantity': 4, 'pickup_location': 'Banneker Building, Suite 120'}, tokens['dept'])
    after = sql('SELECT quantity, pickup_location FROM item WHERE item_id = %s', [item_id])[0]
    check('Valid: existing listing updated', status == 200 and after['quantity'] == 4 and after['pickup_location'] == 'Banneker Building, Suite 120',
          f"before {before['quantity']} @ {before['pickup_location']} -> after {after['quantity']} @ {after['pickup_location']}")
    call(f'department/listings/{item_id}/', 'PATCH', {'quantity': before['quantity'], 'pickup_location': before['pickup_location']}, tokens['dept'])
    status, data = call('department/listings/', 'POST', {**dept_listing, 'item_condition': 'Broken'}, tokens['dept'])
    check('Invalid: unknown condition rejected', status == 400, f'HTTP {status}: {short(data)}')
    other = sql("SELECT item_id FROM item WHERE title = 'Compound Microscope'")[0]['item_id']
    status, data = call(f'department/listings/{other}/', 'PATCH', {'quantity': 9}, tokens['dept'])
    check("Invalid: cannot edit another department's listing", status == 404, f'HTTP {status}: {short(data)}')

    # ------------------------------------------------------------------
    print('\n4. Student Organization Representative creates a giveaway or collection drive')
    title = f'Sprint V Winter Coat Drive {RUN}'
    event = {'event_type': 'Collection Drive', 'title': title, 'description': 'Collect warm coats for students before winter break.',
             'participation_instructions': 'Drop clean coats at the Student Union table, 10am to 4pm.',
             'location': 'Student Union, Room 214', 'start_at': '2026-12-01T10:00:00', 'end_at': '2026-12-12T16:00:00'}
    status, data = call('organization/events/', 'POST', event, tokens['org'])
    rows = sql('SELECT e.event_id, e.event_type, e.status, o.name FROM collection_event e JOIN organization o ON o.organization_id = e.organization_id WHERE e.title = %s', [title])
    check('Valid: collection drive created', status == 201, f'HTTP {status}: {short(data)}')
    check('Database: row inserted into collection_event for the organization', len(rows) == 1 and rows[0]['name'] == 'FAMU Environmental Club',
          f"event_id {rows[0]['event_id']}, {rows[0]['event_type']}, {rows[0]['status']}, {rows[0]['name']}" if rows else 'no row')
    status, data = call('organization/events/', 'POST', {**event, 'title': f'Backwards {RUN}', 'end_at': '2026-11-30T10:00:00'}, tokens['org'])
    check('Invalid: end before start rejected', status == 400, f'HTTP {status}: {short(data)}')
    status, data = call('organization/events/', 'POST', {k: v for k, v in event.items() if k != 'location'}, tokens['org'])
    check('Invalid: missing location rejected', status == 400, f'HTTP {status}: {short(data)}')
    status, _ = call('organization/events/', 'POST', event, tokens['campus'])
    check('Authorization: Campus User refused', status == 403, f'HTTP {status}')

    # ------------------------------------------------------------------
    print('\n5. Community Moderator reviews a report and records the action taken')
    open_reports = sql("SELECT report_id, reason, status FROM report WHERE status IN ('Open', 'Under Review') ORDER BY report_id")
    if not open_reports:
        check('An open report is available to review', False, 'all reports are closed: reload the database')
    else:
        report = open_reports[0]
        rid = report['report_id']
        print(f"     before: report #{rid} ({report['reason']}) is {report['status']}")
        status, data = call(f'reports/{rid}/', 'PATCH', {'status': 'Resolved'}, tokens['mod'])
        check('Invalid: closing without describing the action rejected', status == 400, f'HTTP {status}: {short(data)}')
        decision = 'Contacted the owner; listing photos and description corrected.'
        status, data = call(f'reports/{rid}/', 'PATCH', {'status': 'Resolved', 'decision': decision}, tokens['mod'])
        rep = sql('SELECT status FROM report WHERE report_id = %s', [rid])[0]
        case = sql('SELECT status, resolution, assigned_to_user_id FROM moderation_case WHERE report_id = %s', [rid])
        check('Valid: report resolved with action taken', status == 200, f'HTTP {status}')
        check('Database: report.status updated and moderation_case records the action',
              rep['status'] == 'Resolved' and case and case[0]['resolution'] == decision and case[0]['status'] == 'Closed',
              f"report {rep['status']}; case {case[0]['status']}: {case[0]['resolution']}" if case else 'no case')
        status, data = call(f'reports/{rid}/', 'PATCH', {'status': 'Dismissed', 'decision': 'Again'}, tokens['mod'])
        check('Invalid: an already closed report cannot be changed again', status == 400, f'HTTP {status}: {short(data)}')
    status, _ = call('reports/3/', 'PATCH', {'status': 'Under Review'}, tokens['campus'])
    check('Authorization: Campus User refused', status == 403, f'HTTP {status}')

    # ------------------------------------------------------------------
    print('\n6. Previously implemented functionality (Sprint IV tests)')
    sprint4 = ROOT / 'Sprint Cycles' / 'Sprint Cycle 4' / 'Testing' / 'sprint4_api_test.py'
    run = subprocess.run([sys.executable, str(sprint4)], capture_output=True, text=True)
    last = run.stdout.strip().splitlines()[-1] if run.stdout.strip() else run.stderr.strip()[-200:]
    check('Sprint IV sign-in, navigation data and authorization still pass', run.returncode == 0, last)

    passed = sum(results)
    print(f'\n{passed} of {len(results)} checks passed')
    sys.exit(0 if passed == len(results) else 1)


if __name__ == '__main__':
    main()
