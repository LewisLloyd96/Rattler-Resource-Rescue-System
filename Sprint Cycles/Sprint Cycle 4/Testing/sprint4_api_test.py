"""Sprint Cycle IV acceptance tests against the running application.

Checks every Sprint IV testing requirement through the real Django API and
the real MySQL database (no mocks):

  1. Successful sign-in for each of the five roles, with the correct role returned.
  2. Invalid sign-in is rejected (wrong password, unknown email).
  3. Each role's assigned retrieval use case returns the expected database records.
  4. Role-based authorization: every role is blocked (HTTP 403) from the other
     roles' retrieval functions, and requests without a token are rejected (401).

Requires only the Python standard library. Start MySQL and the API first:
  cd backend && python manage.py runserver 127.0.0.1:8000

Run from the repository root:
  python "Sprint Cycles/Sprint Cycle 4/Testing/sprint4_api_test.py"
  python "Sprint Cycles/Sprint Cycle 4/Testing/sprint4_api_test.py" --base http://127.0.0.1:8000/api
"""
import argparse
import json
import sys
import urllib.error
import urllib.request

PASSWORD = 'Rattler2026!'  # shared development password set by 05_demo_passwords.sql

# role -> (sample account, assigned retrieval endpoint, check that the data is the right data)
ROLES = {
    'Administrator': (
        'angela.brooks@famu.edu', 'users/',
        lambda d: len(d['users']) == 16 and {u['role'] for u in d['users']} >= {
            'Administrator', 'Campus User', 'Department Representative',
            'Student Organization Representative', 'Community Moderator'},
        'lists all 16 user accounts across all five roles'),
    'Campus User': (
        'jordan2.davis@famu.edu', 'items/',
        lambda d: len(d['items']) > 0 and all(i['status'] == 'Available' for i in d['items']),
        'returns only Available items'),
    'Department Representative': (
        'robert.hayes@famu.edu', 'department/',
        lambda d: d['organization']['name'] == 'Department of Computer & Information Sciences'
        and any(i['title'] == '24-inch Dell Monitors' for i in d['listings']),
        "returns the CIS department's items and reservations"),
    'Student Organization Representative': (
        'jasmine1.carter@famu.edu', 'organization/',
        lambda d: d['organization']['name'] == 'FAMU Environmental Club' and len(d['listings']) > 0,
        "returns the Environmental Club's listings, reservations and drives"),
    'Community Moderator': (
        'marcus.johnson@famu.edu', 'reports/',
        lambda d: len(d['reports']) > 0 and any(r['type'] == 'Listing' for r in d['reports']),
        'returns reported listings and exchange problems'),
}

# Endpoints a role may legitimately open besides its own (Administrators also review reports).
ALSO_ALLOWED = {'Administrator': {'reports/'}}


def call(base, path, method='GET', body=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(base + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return response.status, json.loads(response.read() or b'{}')
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read() or b'{}')


def main():
    parser = argparse.ArgumentParser(description='Sprint Cycle IV acceptance tests')
    parser.add_argument('--base', default='http://127.0.0.1:8000/api/')
    base = parser.parse_args().base.rstrip('/') + '/'

    results = []

    def check(name, ok, detail=''):
        results.append(ok)
        print(f"  {'PASS' if ok else 'FAIL'}  {name}{f'  ({detail})' if detail else ''}")

    try:
        status, health = call(base, 'health/')
    except urllib.error.URLError as error:
        sys.exit(f'Cannot reach the API at {base}: {error.reason}. Start it with: python manage.py runserver')
    print(f'API health: {status} {health}\n')

    print('1. Successful sign-in for each role')
    tokens = {}
    for role, (email, _, _, _) in ROLES.items():
        status, data = call(base, 'auth/login/', 'POST', {'email': email, 'password': PASSWORD})
        returned_role = data.get('user', {}).get('role')
        tokens[role] = data.get('token')
        check(f'{role:<36} {email}', status == 200 and returned_role == role and bool(tokens[role]),
              f'HTTP {status}, role from database: {returned_role}')

    print('\n2. Invalid sign-in is rejected')
    status, data = call(base, 'auth/login/', 'POST', {'email': 'jordan2.davis@famu.edu', 'password': 'wrong-password'})
    check('Wrong password', status == 401 and 'token' not in data, f"HTTP {status}: {data.get('detail')}")
    status, data = call(base, 'auth/login/', 'POST', {'email': 'nobody@famu.edu', 'password': PASSWORD})
    check('Unknown email', status == 401 and 'token' not in data, f"HTTP {status}: {data.get('detail')}")

    print('\n3. Assigned retrieval use case returns database records')
    for role, (_, endpoint, is_correct, description) in ROLES.items():
        status, data = call(base, endpoint, token=tokens[role])
        try:
            ok = status == 200 and is_correct(data)
        except (KeyError, TypeError):
            ok = False
        check(f'{role:<36} GET /api/{endpoint}', ok, description)

    print('\n4. Role-based authorization')
    status, _ = call(base, 'users/')
    check('No token: GET /api/users/', status == 401, f'HTTP {status}')
    for role in ROLES:
        for other, (_, endpoint, _, _) in ROLES.items():
            if other == role or endpoint in ALSO_ALLOWED.get(role, set()):
                continue
            status, _ = call(base, endpoint, token=tokens[role])
            check(f'{role:<36} blocked from /api/{endpoint}', status == 403, f'HTTP {status}')

    passed = sum(results)
    print(f'\n{passed} of {len(results)} checks passed')
    sys.exit(0 if passed == len(results) else 1)


if __name__ == '__main__':
    main()
