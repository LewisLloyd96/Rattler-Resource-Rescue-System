from django.db import connection
from rest_framework import serializers, status
from rest_framework.exceptions import APIException, NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.db import query_all, query_one
from api.permissions import (
    IsAdministrator,
    IsCampusUser,
    IsCommunityModerator,
    IsDepartmentRepresentative,
    IsStudentOrganizationRepresentative,
)


class ListingCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=150)
    description = serializers.CharField()
    category_id = serializers.IntegerField(min_value=1)
    item_condition = serializers.ChoiceField(choices=['New', 'Like New', 'Good', 'Fair', 'Poor'])
    quantity = serializers.IntegerField(min_value=1)
    pickup_location = serializers.CharField(max_length=200)


class MessageCreateSerializer(serializers.Serializer):
    recipient_email = serializers.EmailField()
    body = serializers.CharField(max_length=5000, trim_whitespace=True)
    reservation_id = serializers.IntegerField(min_value=1, required=False, allow_null=True)

    def validate_body(self, value):
        if not value.strip():
            raise serializers.ValidationError('Enter a message before sending.')
        return value.strip()


class CategorySerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    rules = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    is_active = serializers.BooleanField(required=False, default=True)


class CategoryUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, required=False)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    rules = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    is_active = serializers.BooleanField(required=False)


class SettingUpdateSerializer(serializers.Serializer):
    setting_key = serializers.ChoiceField(choices=[
        'reservation_expiration_hours',
        'campus_email_domain',
        'max_images_per_item',
        'listing_archive_days',
        'new_listings_require_review',
    ])
    setting_value = serializers.CharField(max_length=255)

    def validate(self, attrs):
        key = attrs['setting_key']
        value = attrs['setting_value'].strip()
        if key == 'campus_email_domain' and not value:
            raise serializers.ValidationError({'setting_value': 'The campus email domain cannot be blank.'})
        if key == 'new_listings_require_review' and value.lower() not in {'true', 'false'}:
            raise serializers.ValidationError({'setting_value': 'Use true or false.'})
        if key in {'reservation_expiration_hours', 'max_images_per_item', 'listing_archive_days'}:
            try:
                number = int(value)
            except ValueError as error:
                raise serializers.ValidationError({'setting_value': 'Enter a whole number.'}) from error
            limits = {
                'reservation_expiration_hours': (1, 720),
                'max_images_per_item': (1, 20),
                'listing_archive_days': (1, 3650),
            }
            minimum, maximum = limits[key]
            if not minimum <= number <= maximum:
                raise serializers.ValidationError({
                    'setting_value': f'Enter a value between {minimum} and {maximum}.',
                })
            value = str(number)
        if key == 'new_listings_require_review':
            value = value.lower()
        attrs['setting_value'] = value
        return attrs


class OrganizationProfileSerializer(serializers.Serializer):
    location = serializers.CharField(max_length=150, required=False, allow_blank=True, allow_null=True)
    contact_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)


def _organization_for_user(user, organization_type):
    organization = query_one(
        """
        SELECT o.organization_id AS id, o.name, o.organization_type AS type,
               o.location, o.contact_email, o.status
        FROM organization_member m
        JOIN organization o ON o.organization_id = m.organization_id
        WHERE m.user_id = %s AND m.is_active = TRUE AND o.organization_type = %s
        ORDER BY m.membership_id
        LIMIT 1
        """,
        [user.id, organization_type],
    )
    if not organization:
        raise NotFound('No active organization profile is associated with this account.')
    return organization


class CampusListingCreateView(APIView):
    permission_classes = [IsAuthenticated, IsCampusUser]

    def post(self, request):
        serializer = ListingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        category = query_one(
            'SELECT category_id FROM category WHERE category_id = %s AND is_active = TRUE',
            [values['category_id']],
        )
        if not category:
            raise ValidationError({'category_id': 'Choose an active item category.'})
        account = query_one(
            'SELECT email_verified_at FROM user WHERE user_id = %s',
            [request.user.id],
        )
        if not account or account['email_verified_at'] is None:
            raise PermissionDenied('Verify your campus email before creating a listing.')
        review_setting = query_one(
            "SELECT setting_value FROM system_setting WHERE setting_key = 'new_listings_require_review'"
        )
        if not review_setting:
            raise APIException('The listing review setting is missing.')
        listing_status = (
            'Pending Review'
            if review_setting['setting_value'].lower() == 'true'
            else 'Available'
        )

        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO item (
                    posted_by_user_id, category_id, title, description,
                    item_condition, quantity, pickup_location, status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                [
                    request.user.id,
                    values['category_id'],
                    values['title'],
                    values['description'],
                    values['item_condition'],
                    values['quantity'],
                    values['pickup_location'],
                    listing_status,
                ],
            )
            item_id = cursor.lastrowid
        return Response(
            {'id': item_id, 'status': listing_status},
            status=status.HTTP_201_CREATED,
        )


class MyListingsView(APIView):
    permission_classes = [IsAuthenticated, IsCampusUser]

    def get(self, request):
        listings = query_all(
            """
            SELECT i.item_id AS id, i.title, i.description, c.name AS category,
                   i.item_condition AS `condition`, i.quantity, i.pickup_location AS location,
                   i.status, i.created_at AS createdAt
            FROM item i
            JOIN category c ON c.category_id = i.category_id
            WHERE i.posted_by_user_id = %s AND i.owner_organization_id IS NULL
            ORDER BY i.created_at DESC, i.item_id DESC
            """,
            [request.user.id],
        )
        return Response({'listings': listings})

    def patch(self, request, item_id):
        action = request.data.get('action')
        if action != 'remove':
            raise ValidationError({'action': 'The supported action is remove.'})
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE item SET status = 'Removed'
                WHERE item_id = %s AND posted_by_user_id = %s
                  AND owner_organization_id IS NULL
                  AND status IN ('Available', 'Pending Review')
                """,
                [item_id, request.user.id],
            )
            if cursor.rowcount != 1:
                raise NotFound('This listing cannot be removed or is no longer available.')
        return Response({'id': item_id, 'status': 'Removed'})


class MyReservationsView(APIView):
    permission_classes = [IsAuthenticated, IsCampusUser]

    def get(self, request):
        reservations = query_all(
            """
            SELECT r.reservation_id AS id, r.item_id AS itemId,
                   i.title AS itemTitle, r.status,
                   r.reserved_at AS reservedAt, r.expires_at AS expiresAt,
                   i.pickup_location AS location,
                   COALESCE(o.name, CONCAT(owner.first_name, ' ', owner.last_name)) AS owner
            FROM reservation r
            JOIN item i ON i.item_id = r.item_id
            LEFT JOIN organization o ON o.organization_id = i.owner_organization_id
            LEFT JOIN user owner ON owner.user_id = i.posted_by_user_id
            WHERE r.reserved_by_user_id = %s
            ORDER BY r.reserved_at DESC, r.reservation_id DESC
            """,
            [request.user.id],
        )
        return Response({'reservations': reservations})


class CancelReservationView(APIView):
    permission_classes = [IsAuthenticated, IsCampusUser]

    def post(self, request, reservation_id):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE reservation SET status = 'Cancelled'
                WHERE reservation_id = %s AND reserved_by_user_id = %s
                  AND status IN ('Pending', 'Active')
                """,
                [reservation_id, request.user.id],
            )
            if cursor.rowcount != 1:
                raise NotFound('This reservation cannot be cancelled.')
        return Response({'id': reservation_id, 'status': 'Cancelled'})


class MessagesView(APIView):
    permission_classes = [IsAuthenticated, IsCampusUser]

    def get(self, request):
        messages = query_all(
            """
            SELECT m.message_id AS id, m.reservation_id AS reservationId,
                   m.sender_user_id AS senderId, m.recipient_user_id AS recipientId,
                   CONCAT(sender.first_name, ' ', sender.last_name) AS sender,
                   CONCAT(recipient.first_name, ' ', recipient.last_name) AS recipient,
                   m.body, m.sent_at AS sentAt, m.is_read AS isRead
            FROM message m
            JOIN user sender ON sender.user_id = m.sender_user_id
            JOIN user recipient ON recipient.user_id = m.recipient_user_id
            WHERE m.sender_user_id = %s OR m.recipient_user_id = %s
            ORDER BY m.sent_at DESC, m.message_id DESC
            """,
            [request.user.id, request.user.id],
        )
        return Response({'messages': messages})

    def post(self, request):
        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        recipient = query_one(
            """
            SELECT user_id, account_status
            FROM user WHERE LOWER(email) = %s
            """,
            [values['recipient_email'].strip().lower()],
        )
        if not recipient or recipient['account_status'] != 'Active':
            raise ValidationError({'recipient_email': 'No active account uses that email.'})
        if recipient['user_id'] == request.user.id:
            raise ValidationError({'recipient_email': 'You cannot send a message to yourself.'})

        reservation_id = values.get('reservation_id')
        if reservation_id is not None:
            participants = query_one(
                """
                SELECT r.reservation_id
                FROM reservation r
                JOIN item i ON i.item_id = r.item_id
                WHERE r.reservation_id = %s
                  AND (
                    (r.reserved_by_user_id = %s AND i.posted_by_user_id = %s)
                    OR (r.reserved_by_user_id = %s AND i.posted_by_user_id = %s)
                  )
                """,
                [
                    reservation_id,
                    request.user.id,
                    recipient['user_id'],
                    recipient['user_id'],
                    request.user.id,
                ],
            )
            if not participants:
                raise PermissionDenied('Reservation messages are limited to the item owner and recipient.')

        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO message (sender_user_id, recipient_user_id, reservation_id, body)
                VALUES (%s, %s, %s, %s)
                """,
                [request.user.id, recipient['user_id'], reservation_id, values['body']],
            )
            message_id = cursor.lastrowid
        return Response({'id': message_id}, status=status.HTTP_201_CREATED)


class CategoriesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in {'Administrator', 'Campus User'}:
            raise PermissionDenied('You cannot view item categories.')
        active_filter = '' if request.user.role == 'Administrator' else 'WHERE is_active = TRUE'
        return Response({
            'categories': query_all(
                f"""
                SELECT category_id AS id, name, description, rules, is_active AS isActive
                FROM category {active_filter} ORDER BY name
                """
            ),
        })

    def post(self, request):
        if request.user.role != 'Administrator':
            raise PermissionDenied('Only administrators can add item categories.')
        serializer = CategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO category (name, description, rules, is_active)
                VALUES (%s, %s, %s, %s)
                """,
                [
                    values['name'].strip(),
                    values.get('description') or None,
                    values.get('rules') or None,
                    values['is_active'],
                ],
            )
            category_id = cursor.lastrowid
        return Response({'id': category_id}, status=status.HTTP_201_CREATED)


class CategoryDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdministrator]

    def patch(self, request, category_id):
        serializer = CategoryUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        if not values:
            raise ValidationError('Provide at least one category field to update.')
        columns = {
            'name': 'name',
            'description': 'description',
            'rules': 'rules',
            'is_active': 'is_active',
        }
        assignments = ', '.join(f'{columns[key]} = %s' for key in values)
        with connection.cursor() as cursor:
            cursor.execute(
                f'UPDATE category SET {assignments} WHERE category_id = %s',
                [*values.values(), category_id],
            )
            if cursor.rowcount == 0:
                exists = query_one('SELECT category_id FROM category WHERE category_id = %s', [category_id])
                if not exists:
                    raise NotFound('Category not found.')
        return Response({'id': category_id, **values})


class ActivityReportsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'Administrator':
            metrics = query_one(
                """
                SELECT
                  (SELECT COUNT(*) FROM user) AS registeredUsers,
                  (SELECT COUNT(*) FROM item) AS totalListings,
                  (SELECT COUNT(*) FROM item WHERE status = 'Available') AS availableItems,
                  (SELECT COUNT(*) FROM reservation WHERE status IN ('Pending', 'Active')) AS openReservations,
                  (SELECT COUNT(*) FROM report WHERE status IN ('Open', 'Under Review')) AS openReports,
                  (SELECT COUNT(*) FROM collection_event WHERE status IN ('Planned', 'Active')) AS activeEvents
                """
            )
            by_category = query_all(
                """
                SELECT c.name AS category, COUNT(i.item_id) AS listings
                FROM category c LEFT JOIN item i ON i.category_id = c.category_id
                GROUP BY c.category_id, c.name ORDER BY c.name
                """
            )
            return Response({'scope': 'system', 'metrics': metrics, 'byCategory': by_category})
        if request.user.role == 'Department Representative':
            organization = _organization_for_user(request.user, 'Department')
            metrics = query_one(
                """
                SELECT
                  (SELECT COUNT(*) FROM item WHERE owner_organization_id = %s) AS totalListings,
                  (SELECT COUNT(*) FROM item WHERE owner_organization_id = %s AND status = 'Available') AS availableItems,
                  (SELECT COUNT(*) FROM reservation r JOIN item i ON i.item_id = r.item_id
                    WHERE i.owner_organization_id = %s AND r.status IN ('Pending', 'Active')) AS openReservations
                """,
                [organization['id']] * 3,
            )
            by_category = query_all(
                """
                SELECT c.name AS category, COUNT(i.item_id) AS listings
                FROM item i JOIN category c ON c.category_id = i.category_id
                WHERE i.owner_organization_id = %s
                GROUP BY c.category_id, c.name ORDER BY c.name
                """,
                [organization['id']],
            )
            return Response({
                'scope': organization['name'],
                'metrics': metrics,
                'byCategory': by_category,
            })
        raise PermissionDenied('Only administrators and department representatives can view activity reports.')


class SystemSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsAdministrator]

    def get(self, request):
        settings = query_all(
            """
            SELECT setting_key AS `key`, setting_value AS `value`,
                   updated_at AS updatedAt
            FROM system_setting ORDER BY setting_key
            """
        )
        return Response({'settings': settings})

    def patch(self, request):
        serializer = SettingUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE system_setting
                SET setting_value = %s, updated_by_user_id = %s
                WHERE setting_key = %s
                """,
                [values['setting_value'], request.user.id, values['setting_key']],
            )
            if cursor.rowcount == 0:
                exists = query_one(
                    'SELECT setting_key FROM system_setting WHERE setting_key = %s',
                    [values['setting_key']],
                )
                if not exists:
                    raise NotFound('System setting not found.')
        return Response({'key': values['setting_key'], 'value': values['setting_value']})


class OrganizationProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def _profile(self, user):
        if user.role == 'Department Representative':
            return _organization_for_user(user, 'Department')
        if user.role == 'Student Organization Representative':
            return _organization_for_user(user, 'Student Organization')
        raise PermissionDenied('Only organization representatives can manage an organization profile.')

    def get(self, request):
        return Response({'organization': self._profile(request.user)})

    def patch(self, request):
        serializer = OrganizationProfileSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        if not values:
            raise ValidationError('Provide a contact email or pickup location to update.')
        organization = self._profile(request.user)
        assignments = ', '.join(f'{key} = %s' for key in values)
        with connection.cursor() as cursor:
            cursor.execute(
                f'UPDATE organization SET {assignments} WHERE organization_id = %s',
                [*values.values(), organization['id']],
            )
        return Response({'organization': {**organization, **values}})


class ModerationActionsView(APIView):
    permission_classes = [IsAuthenticated, IsCommunityModerator]

    def get(self, request):
        actions = query_all(
            """
            SELECT ma.action_id AS id, ma.action_type AS actionType, ma.reason,
                   ma.notes, ma.restriction_ends_at AS restrictionEndsAt,
                   ma.created_at AS createdAt,
                   CONCAT(performer.first_name, ' ', performer.last_name) AS performedBy,
                   mc.case_id AS caseId, mc.status AS caseStatus,
                   rp.report_id AS reportId, rp.reason AS reportReason
            FROM moderation_action ma
            JOIN user performer ON performer.user_id = ma.performed_by_user_id
            JOIN moderation_case mc ON mc.case_id = ma.case_id
            JOIN report rp ON rp.report_id = mc.report_id
            ORDER BY ma.created_at DESC, ma.action_id DESC
            """
        )
        return Response({'actions': actions})


class PendingListingsView(APIView):
    permission_classes = [IsAuthenticated, IsAdministrator]

    def get(self, request):
        listings = query_all(
            """
            SELECT i.item_id AS id, i.title, i.description, c.name AS category,
                   i.item_condition AS `condition`, i.quantity, i.pickup_location AS location,
                   CONCAT(u.first_name, ' ', u.last_name) AS owner, i.created_at AS createdAt
            FROM item i
            JOIN category c ON c.category_id = i.category_id
            JOIN user u ON u.user_id = i.posted_by_user_id
            WHERE i.status = 'Pending Review'
            ORDER BY i.created_at, i.item_id
            """
        )
        return Response({'listings': listings})

    def patch(self, request, item_id):
        action = request.data.get('action')
        statuses = {'approve': 'Available', 'reject': 'Removed'}
        if action not in statuses:
            raise ValidationError({'action': 'Choose approve or reject.'})
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE item SET status = %s
                WHERE item_id = %s AND status = 'Pending Review'
                """,
                [statuses[action], item_id],
            )
            if cursor.rowcount != 1:
                raise NotFound('This listing is not pending review.')
        return Response({'id': item_id, 'status': statuses[action]})


class ReportStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, report_id):
        if request.user.role not in {'Administrator', 'Community Moderator'}:
            raise PermissionDenied('Only administrators and community moderators can review reports.')
        report_status = request.data.get('status')
        if report_status not in {'Open', 'Under Review', 'Resolved', 'Dismissed'}:
            raise ValidationError({'status': 'Choose Open, Under Review, Resolved, or Dismissed.'})
        with connection.cursor() as cursor:
            cursor.execute(
                'UPDATE report SET status = %s WHERE report_id = %s',
                [report_status, report_id],
            )
            if cursor.rowcount == 0:
                exists = query_one('SELECT report_id FROM report WHERE report_id = %s', [report_id])
                if not exists:
                    raise NotFound('Report not found.')
        return Response({'id': report_id, 'status': report_status})
