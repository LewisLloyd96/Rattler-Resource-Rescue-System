from django.contrib.auth.hashers import check_password
from django.db import IntegrityError, OperationalError, connection
from django.core import signing
from rest_framework import serializers, status
from rest_framework.exceptions import APIException, AuthenticationFailed, NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.authentication import SignedTokenAuthentication, TOKEN_SALT
from api.db import query_all, query_one
from api.permissions import (
    IsAdministrator,
    IsAdministratorOrModerator,
    IsCampusUser,
    IsCommunityModerator,
    IsDepartmentRepresentative,
    IsStudentOrganizationRepresentative,
)


DEMO_PASSWORD_HASH = 'pbkdf2_sha256$870000$rrrsDemo2026$uzeZTJ33n4bYShU36n6JWFiajiyE08Ixlh4aRRYq+44='


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(trim_whitespace=False, write_only=True)


def account_payload(account):
    return {
        'id': account['id'],
        'firstName': account['first_name'],
        'lastName': account['last_name'],
        'email': account['email'],
        'role': account['role'],
        'status': account['account_status'],
    }


def listing_payload(item):
    return {
        'id': item['item_id'],
        'title': item['title'],
        'description': item['description'],
        'category': item['category'],
        **({'categoryId': item['category_id']} if 'category_id' in item else {}),
        'condition': item['item_condition'],
        'quantity': item['quantity'],
        'location': item['pickup_location'],
        'status': item['status'],
        'owner': item['owner_name'],
        'ownerType': 'Campus User' if item['owner_type'] == 'Individual' else item['owner_type'],
        'organizationId': item['owner_organization_id'],
        'mainPhoto': item.get('main_photo'),
    }


def reservation_payload(reservation):
    return {
        'id': reservation['reservation_id'],
        'itemId': reservation['item_id'],
        'itemTitle': reservation['item_title'],
        'category': reservation['category'],
        'reservedBy': reservation['reserved_by'],
        'reservedAt': reservation['reserved_at'],
        'status': reservation['status'],
    }


def organization_for_user(user, organization_type):
    organization = query_one(
        """
        SELECT o.organization_id AS id, o.name, o.organization_type AS type
        FROM organization_member m
        JOIN organization o ON o.organization_id = m.organization_id
        WHERE m.user_id = %s AND m.is_active = TRUE AND o.organization_type = %s
        ORDER BY m.membership_id
        LIMIT 1
        """,
        [user.id, organization_type],
    )
    if not organization:
        raise PermissionDenied('Your account is not an active representative of an organization of this type.')
    return organization


def organization_items(organization_id):
    rows = query_all(
        """
        SELECT i.item_id, i.title, i.description, i.category_id, c.name AS category,
               i.item_condition, i.quantity, i.pickup_location,
               i.status,
               COALESCE(o.name, CONCAT(u.first_name, ' ', u.last_name)) AS owner_name,
               COALESCE(o.organization_type, 'Individual') AS owner_type,
               i.owner_organization_id, NULL AS main_photo
        FROM item i
        JOIN category c ON c.category_id = i.category_id
        JOIN user u ON u.user_id = i.posted_by_user_id
        LEFT JOIN organization o ON o.organization_id = i.owner_organization_id
        WHERE i.owner_organization_id = %s
        ORDER BY i.created_at DESC, i.item_id DESC
        """,
        [organization_id],
    )
    return [listing_payload(row) for row in rows]


def organization_reservations(organization_id):
    rows = query_all(
        """
        SELECT r.reservation_id, r.item_id, i.title AS item_title,
               c.name AS category,
               CONCAT(u.first_name, ' ', u.last_name) AS reserved_by,
               DATE_FORMAT(r.reserved_at, '%%b %%e, %%Y') AS reserved_at,
               r.status
        FROM reservation r
        JOIN item i ON i.item_id = r.item_id
        JOIN category c ON c.category_id = i.category_id
        JOIN user u ON u.user_id = r.reserved_by_user_id
        WHERE i.owner_organization_id = %s OR r.receiver_organization_id = %s
        ORDER BY r.reserved_at DESC, r.reservation_id DESC
        """,
        [organization_id, organization_id],
    )
    return [reservation_payload(row) for row in rows]


class HealthView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        query_one('SELECT 1 AS connected')
        return Response({'status': 'ok', 'database': 'connected'})


class LoginView(APIView):
    authentication_classes = [SignedTokenAuthentication]
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().lower()
        password = serializer.validated_data['password']
        account = query_one(
            """
            SELECT u.user_id AS id, u.first_name, u.last_name, u.email,
                   u.password_hash, u.account_status, r.role_name AS role
            FROM user u
            JOIN role r ON r.role_id = u.role_id
            WHERE LOWER(u.email) = %s
            """,
            [email],
        )
        password_hash = account['password_hash'] if account else DEMO_PASSWORD_HASH
        if not check_password(password, password_hash) or not account:
            raise AuthenticationFailed('Email or password is incorrect.')
        if account['account_status'] != 'Active':
            raise AuthenticationFailed('This account is not active. Please contact an administrator.')

        token = signing.dumps({'user_id': account['id']}, salt=TOKEN_SALT, compress=True)
        return Response({
            'token': token,
            'user': account_payload(account),
        })


class CurrentAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'id': request.user.id,
            'firstName': request.user.first_name,
            'lastName': request.user.last_name,
            'email': request.user.email,
            'role': request.user.role,
            'status': request.user.account_status,
        })


class UserDirectoryView(APIView):
    permission_classes = [IsAuthenticated, IsAdministrator]

    def get(self, request):
        search = request.query_params.get('q', '').strip()
        role = request.query_params.get('role', '').strip()
        where = []
        params = []
        if search:
            where.append(
                "(CONCAT(u.first_name, ' ', u.last_name) LIKE %s OR u.email LIKE %s)"
            )
            params.extend([f'%{search}%', f'%{search}%'])
        if role:
            where.append('r.role_name = %s')
            params.append(role)
        where_sql = f"WHERE {' AND '.join(where)}" if where else ''
        users = query_all(
            f"""
            SELECT u.user_id AS id, u.first_name, u.last_name, u.email,
                   r.role_name AS role, u.account_status
            FROM user u
            JOIN role r ON r.role_id = u.role_id
            {where_sql}
            ORDER BY u.last_name, u.first_name, u.user_id
            """,
            params,
        )
        roles = query_all('SELECT role_name FROM role ORDER BY role_name')
        return Response({
            'users': [account_payload(user) for user in users],
            'roles': [item['role_name'] for item in roles],
        })


class ItemBrowseView(APIView):
    permission_classes = [IsAuthenticated, IsCampusUser]

    def get(self, request):
        search = request.query_params.get('q', '').strip()
        category = request.query_params.get('category', '').strip()
        conditions = []
        params = []
        if search:
            conditions.append(
                "(title LIKE %s OR description LIKE %s OR category LIKE %s OR owner_name LIKE %s)"
            )
            pattern = f'%{search}%'
            params.extend([pattern, pattern, pattern, pattern])
        if category:
            conditions.append('category = %s')
            params.append(category)
        where_sql = f"WHERE {' AND '.join(conditions)}" if conditions else ''
        items = query_all(
            f"""
            SELECT item_id, title, description, category, item_condition, quantity,
                   pickup_location, 'Available' AS status, owner_name, owner_type,
                   NULL AS owner_organization_id, main_photo
            FROM v_available_items
            {where_sql}
            ORDER BY created_at DESC, item_id DESC
            """,
            params,
        )
        categories = query_all(
            'SELECT name FROM category WHERE is_active = TRUE ORDER BY name'
        )
        return Response({
            'items': [listing_payload(item) for item in items],
            'categories': [item['name'] for item in categories],
        })


class ReservationConflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'This item is no longer available to reserve.'
    default_code = 'reservation_conflict'


class ItemReservationView(APIView):
    permission_classes = [IsAuthenticated, IsCampusUser]

    def post(self, request, item_id):
        if not query_one(
            'SELECT item_id FROM v_available_items WHERE item_id = %s',
            [item_id],
        ):
            raise NotFound('This item is no longer available.')

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    'CALL reserve_item(%s, %s, NULL, NULL)',
                    [item_id, request.user.id],
                )
                row = cursor.fetchone()
                columns = [column[0] for column in cursor.description or ()]
                while cursor.nextset():
                    pass
        except OperationalError as error:
            if error.args and error.args[0] == 1644:
                detail = str(error.args[1])
                if detail.startswith('Rule: '):
                    detail = detail[len('Rule: '):]
                raise ValidationError(detail) from error
            raise
        except IntegrityError as error:
            if error.args and error.args[0] == 1062:
                raise ReservationConflict() from error
            raise

        if row is None:
            raise APIException('The reservation procedure returned no reservation.')
        reservation = dict(zip(columns, row))
        return Response(
            {
                'reservation': {
                    'id': reservation['reservation_id'],
                    'itemId': reservation['item_id'],
                    'itemTitle': reservation['item'],
                    'status': reservation['status'],
                    'reservedAt': reservation['reserved_at'].isoformat(),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class DepartmentWorkspaceView(APIView):
    permission_classes = [IsAuthenticated, IsDepartmentRepresentative]

    def get(self, request):
        organization = organization_for_user(request.user, 'Department')
        return Response({
            'organization': organization,
            'listings': organization_items(organization['id']),
            'reservations': organization_reservations(organization['id']),
        })


class OrganizationWorkspaceView(APIView):
    permission_classes = [IsAuthenticated, IsStudentOrganizationRepresentative]

    def get(self, request):
        organization = organization_for_user(request.user, 'Student Organization')
        events = query_all(
            """
            SELECT event_id AS id, title, event_type AS type, status, location,
                   description, participation_instructions,
                   DATE_FORMAT(start_at, '%%b %%e, %%Y') AS starts_at,
                   DATE_FORMAT(end_at, '%%b %%e, %%Y') AS ends_at
            FROM collection_event
            WHERE organization_id = %s
            ORDER BY start_at DESC, event_id DESC
            """,
            [organization['id']],
        )
        event_payloads = []
        for event in events:
            date_range = event['starts_at']
            if event['ends_at'] != event['starts_at']:
                date_range = f"{event['starts_at']} – {event['ends_at']}"
            event_payloads.append({
                'id': event['id'],
                'title': event['title'],
                'type': event['type'],
                'status': event['status'],
                'location': event['location'],
                'description': event['description'],
                'instructions': event['participation_instructions'],
                'date': date_range,
            })
        event_ids = [event['id'] for event in events]
        event_items = []
        if event_ids:
            placeholders = ', '.join(['%s'] * len(event_ids))
            event_items = query_all(
                f"""
                SELECT ei.event_id AS eventId, ei.item_id AS itemId, i.title,
                       CONCAT(u.first_name, ' ', u.last_name) AS contributor,
                       ei.distribution_status AS status
                FROM event_item ei
                JOIN item i ON i.item_id = ei.item_id
                JOIN user u ON u.user_id = ei.contributor_user_id
                WHERE ei.event_id IN ({placeholders})
                ORDER BY ei.event_id, ei.event_item_id
                """,
                event_ids,
            )
        return Response({
            'organization': organization,
            'listings': organization_items(organization['id']),
            'reservations': organization_reservations(organization['id']),
            'events': event_payloads,
            'eventItems': event_items,
        })


class ReportQueueView(APIView):
    permission_classes = [IsAuthenticated, IsAdministratorOrModerator]

    def get(self, request):
        search = request.query_params.get('q', '').strip()
        report_type = request.query_params.get('type', '').strip()
        report_status = request.query_params.get('status', '').strip().lower()
        items_only = request.query_params.get('items_only', '').strip().lower()
        where = []
        params = []
        if report_status not in {'', 'queue', 'all'}:
            raise ValidationError({'status': 'Choose queue or all.'})
        if items_only not in {'', 'true', 'false'}:
            raise ValidationError({'items_only': 'Choose true or false.'})
        if report_status == 'queue':
            where.append("rp.status IN ('Open', 'Under Review')")
        if items_only == 'true':
            where.append('rp.item_id IS NOT NULL')
        if search:
            where.append(
                "(rp.reason LIKE %s OR rp.details LIKE %s OR reporter.first_name LIKE %s "
                "OR reporter.last_name LIKE %s OR i.title LIKE %s OR ev.title LIKE %s "
                "OR target_user.first_name LIKE %s OR target_user.last_name LIKE %s "
                "OR item_owner.first_name LIKE %s OR item_owner.last_name LIKE %s)"
            )
            pattern = f'%{search}%'
            params.extend([pattern] * 10)
        if report_type == 'Listing':
            where.append('(rp.item_id IS NOT NULL OR rp.event_id IS NOT NULL)')
        elif report_type == 'Exchange problem':
            where.append("(rp.exchange_id IS NOT NULL OR rp.reason = 'Suspicious Activity')")
        where_sql = f"WHERE {' AND '.join(where)}" if where else ''
        reports = query_all(
            f"""
            SELECT rp.report_id AS id, rp.reason,
                   COALESCE(CONCAT('Listing: ', i.title),
                            CONCAT('Event: ', ev.title),
                            CONCAT('Organization: ', org.name),
                            CONCAT('User: ', target_user.first_name, ' ', target_user.last_name),
                            CONCAT('Exchange #', rp.exchange_id)) AS target,
                   CASE
                     WHEN rp.item_id IS NOT NULL OR rp.event_id IS NOT NULL THEN 'Listing'
                     WHEN rp.exchange_id IS NOT NULL OR rp.reason = 'Suspicious Activity' THEN 'Exchange problem'
                     ELSE 'Account'
                   END AS type,
                   rp.status,
                   CONCAT(reporter.first_name, ' ', reporter.last_name) AS reporter,
                   rp.details,
                   DATE_FORMAT(rp.created_at, '%%b %%e, %%Y') AS date,
                   mc.status AS caseStatus, mc.resolution AS decision,
                   rp.item_id AS reportedItemId,
                   CASE
                     WHEN i.item_id IS NULL THEN NULL
                     ELSE CONCAT(item_owner.first_name, ' ', item_owner.last_name)
                   END AS itemOwner,
                   CASE
                     WHEN i.item_id IS NULL THEN 0
                     ELSE (
                       SELECT COUNT(DISTINCT owner_report.item_id)
                       FROM report owner_report
                       JOIN item reported_item ON reported_item.item_id = owner_report.item_id
                       WHERE reported_item.posted_by_user_id = i.posted_by_user_id
                     )
                   END AS ownerReportedListingsCount
            FROM report rp
            JOIN user reporter ON reporter.user_id = rp.reporter_user_id
            LEFT JOIN user target_user ON target_user.user_id = rp.reported_user_id
            LEFT JOIN organization org ON org.organization_id = rp.reported_organization_id
            LEFT JOIN item i ON i.item_id = rp.item_id
            LEFT JOIN user item_owner ON item_owner.user_id = i.posted_by_user_id
            LEFT JOIN collection_event ev ON ev.event_id = rp.event_id
            LEFT JOIN moderation_case mc ON mc.report_id = rp.report_id
            {where_sql}
            ORDER BY FIELD(rp.status, 'Open', 'Under Review', 'Resolved', 'Dismissed'),
                     rp.created_at DESC, rp.report_id DESC
            """,
            params,
        )
        return Response({'reports': reports})
