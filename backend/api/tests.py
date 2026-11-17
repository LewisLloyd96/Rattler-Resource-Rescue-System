from datetime import datetime
from django.contrib.auth.hashers import check_password
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from unittest.mock import patch

from api.authentication import AuthenticatedAccount
from api.views import (
    DEMO_PASSWORD_HASH,
    ItemReservationView,
    LoginView,
    ReportQueueView,
    UserDirectoryView,
)
from api.workflows import CampusListingCreateView


class DatabaseApiTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_seeded_development_password_hash_is_valid(self):
        self.assertTrue(check_password('Rattler2026!', DEMO_PASSWORD_HASH))
        self.assertFalse(check_password('not-the-demo-password', DEMO_PASSWORD_HASH))

    @patch('api.views.query_one')
    def test_login_returns_the_role_from_the_database(self, query_one):
        query_one.return_value = {
            'id': 1,
            'first_name': 'Angela',
            'last_name': 'Brooks',
            'email': 'angela.brooks@famu.edu',
            'password_hash': DEMO_PASSWORD_HASH,
            'account_status': 'Active',
            'role': 'Administrator',
        }
        request = self.factory.post(
            '/api/auth/login/',
            {'email': 'angela.brooks@famu.edu', 'password': 'Rattler2026!'},
            format='json',
        )

        response = LoginView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['role'], 'Administrator')
        self.assertTrue(response.data['token'])

    @patch('api.views.query_one')
    def test_login_rejects_an_incorrect_password(self, query_one):
        query_one.return_value = {
            'id': 10,
            'first_name': 'Jordan',
            'last_name': 'Davis',
            'email': 'jordan2.davis@famu.edu',
            'password_hash': DEMO_PASSWORD_HASH,
            'account_status': 'Active',
            'role': 'Campus User',
        }
        request = self.factory.post(
            '/api/auth/login/',
            {'email': 'jordan2.davis@famu.edu', 'password': 'wrong'},
            format='json',
        )

        response = LoginView.as_view()(request)

        self.assertEqual(response.status_code, 401)

    @patch('api.views.query_all')
    def test_campus_user_cannot_query_administrator_directory(self, query_all):
        request = self.factory.get('/api/users/')
        force_authenticate(
            request,
            user=AuthenticatedAccount(10, 'Jordan', 'Davis', 'jordan2.davis@famu.edu', 'Campus User', 'Active'),
        )

        response = UserDirectoryView.as_view()(request)

        self.assertEqual(response.status_code, 403)
        query_all.assert_not_called()

    @patch('api.views.connection')
    @patch('api.views.query_one', return_value={'item_id': 8})
    def test_campus_user_can_reserve_an_available_item(self, query_one, connection):
        cursor = connection.cursor.return_value.__enter__.return_value
        cursor.description = tuple(
            (name,)
            for name in ('reservation_id', 'item_id', 'item', 'status', 'reserved_at')
        )
        cursor.fetchone.return_value = (
            17,
            8,
            'Desk lamp',
            'Active',
            datetime(2026, 11, 16, 12, 0),
        )
        cursor.nextset.return_value = False
        request = self.factory.post('/api/items/8/reserve/', {}, format='json')
        force_authenticate(
            request,
            user=AuthenticatedAccount(10, 'Jordan', 'Davis', 'jordan2.davis@famu.edu', 'Campus User', 'Active'),
        )

        response = ItemReservationView.as_view()(request, item_id=8)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['reservation']['itemTitle'], 'Desk lamp')
        cursor.execute.assert_called_once_with('CALL reserve_item(%s, %s, NULL, NULL)', [8, 10])

    @patch('api.views.query_one')
    def test_reservation_is_limited_to_campus_users(self, query_one):
        request = self.factory.post('/api/items/8/reserve/', {}, format='json')
        force_authenticate(
            request,
            user=AuthenticatedAccount(4, 'Robert', 'Hayes', 'robert.hayes@famu.edu', 'Department Representative', 'Active'),
        )

        response = ItemReservationView.as_view()(request, item_id=8)

        self.assertEqual(response.status_code, 403)
        query_one.assert_not_called()

    @patch('api.views.query_all')
    def test_user_search_uses_parameterized_filters(self, query_all):
        query_all.side_effect = [[], [{'role_name': 'Campus User'}]]
        request = self.factory.get('/api/users/?q=Jordan&role=Campus%20User')
        force_authenticate(
            request,
            user=AuthenticatedAccount(1, 'Angela', 'Brooks', 'angela.brooks@famu.edu', 'Administrator', 'Active'),
        )

        response = UserDirectoryView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(query_all.call_args_list[0].args[1], ['%Jordan%', '%Jordan%', 'Campus User'])

    @patch('api.views.query_all', return_value=[])
    def test_report_queue_filters_for_actionable_item_reports(self, query_all):
        request = self.factory.get('/api/reports/?status=queue&items_only=true')
        force_authenticate(
            request,
            user=AuthenticatedAccount(5, 'Marcus', 'Johnson', 'marcus.johnson@famu.edu', 'Community Moderator', 'Active'),
        )

        response = ReportQueueView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        query = query_all.call_args.args[0]
        self.assertIn("rp.status IN ('Open', 'Under Review')", query)
        self.assertIn('rp.item_id IS NOT NULL', query)
        self.assertIn('ownerReportedListingsCount', query)


class WorkflowApiTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    @patch('api.workflows.connection')
    @patch('api.workflows.query_one')
    def test_listing_creation_respects_the_review_setting(self, query_one, connection):
        query_one.side_effect = [
            {'category_id': 3},
            {'email_verified_at': datetime(2026, 11, 16, 12, 0)},
            {'setting_value': 'false'},
        ]
        cursor = connection.cursor.return_value.__enter__.return_value
        cursor.lastrowid = 24
        request = self.factory.post(
            '/api/items/create/',
            {
                'title': 'Desk lamp',
                'description': 'Lightly used and working.',
                'category_id': 3,
                'item_condition': 'Good',
                'quantity': 1,
                'pickup_location': 'Student Union',
            },
            format='json',
        )
        force_authenticate(
            request,
            user=AuthenticatedAccount(10, 'Jordan', 'Davis', 'jordan2.davis@famu.edu', 'Campus User', 'Active'),
        )

        response = CampusListingCreateView.as_view()(request)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data, {'id': 24, 'status': 'Available'})
        self.assertEqual(cursor.execute.call_args.args[1][-1], 'Available')
