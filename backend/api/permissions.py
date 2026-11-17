from rest_framework.permissions import BasePermission


class HasRole(BasePermission):
    required_role = ''

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == self.required_role
        )


class IsAdministrator(HasRole):
    required_role = 'Administrator'


class IsCampusUser(HasRole):
    required_role = 'Campus User'


class IsDepartmentRepresentative(HasRole):
    required_role = 'Department Representative'


class IsStudentOrganizationRepresentative(HasRole):
    required_role = 'Student Organization Representative'


class IsCommunityModerator(HasRole):
    required_role = 'Community Moderator'


class IsAdministratorOrModerator(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {'Administrator', 'Community Moderator'}
        )
