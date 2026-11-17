from dataclasses import dataclass

from django.core import signing
from django.core.signing import BadSignature, SignatureExpired
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

from api.db import query_one


TOKEN_SALT = 'rattler-resource-rescue.api-token'
TOKEN_MAX_AGE_SECONDS = 8 * 60 * 60


@dataclass(frozen=True)
class AuthenticatedAccount:
    id: int
    first_name: str
    last_name: str
    email: str
    role: str
    account_status: str

    @property
    def is_authenticated(self):
        return True


class SignedTokenAuthentication(BaseAuthentication):
    def authenticate_header(self, request):
        return 'Bearer'

    def authenticate(self, request):
        parts = get_authorization_header(request).split()
        if not parts:
            return None
        if len(parts) != 2 or parts[0].lower() != b'bearer':
            raise AuthenticationFailed('Use a valid Bearer token.')

        try:
            payload = signing.loads(
                parts[1].decode('utf-8'),
                salt=TOKEN_SALT,
                max_age=TOKEN_MAX_AGE_SECONDS,
            )
        except SignatureExpired as error:
            raise AuthenticationFailed('Your session expired. Please sign in again.') from error
        except (BadSignature, UnicodeDecodeError) as error:
            raise AuthenticationFailed('Your session token is invalid. Please sign in again.') from error

        account = query_one(
            """
            SELECT u.user_id AS id, u.first_name, u.last_name, u.email,
                   r.role_name AS role, u.account_status
            FROM user u
            JOIN role r ON r.role_id = u.role_id
            WHERE u.user_id = %s
            """,
            [payload.get('user_id')],
        )
        if not account or account['account_status'] != 'Active':
            raise AuthenticationFailed('This account is unavailable. Please contact an administrator.')

        return AuthenticatedAccount(**account), parts[1].decode('utf-8')
