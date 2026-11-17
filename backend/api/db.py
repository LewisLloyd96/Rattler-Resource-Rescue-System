import logging
from datetime import date, datetime
from decimal import Decimal

from django.db import OperationalError, connection
from rest_framework.exceptions import APIException


logger = logging.getLogger(__name__)


class DatabaseUnavailable(APIException):
    status_code = 503
    default_detail = 'The MySQL database is unavailable. Check the backend database settings and confirm MySQL is running.'
    default_code = 'database_unavailable'


def _json_value(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return value


def query_all(sql, params=()):
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            columns = [column[0] for column in cursor.description]
            return [
                {column: _json_value(value) for column, value in zip(columns, row)}
                for row in cursor.fetchall()
            ]
    except OperationalError as error:
        logger.exception('Could not query the configured Rattler Resource Rescue database')
        raise DatabaseUnavailable() from error


def query_one(sql, params=()):
    rows = query_all(sql, params)
    return rows[0] if rows else None
