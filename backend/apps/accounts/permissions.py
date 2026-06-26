from rest_framework.permissions import BasePermission, SAFE_METHODS

_MANAGER_ROLES = {"national_manager", "branch_manager", "unit_manager"}
_WRITE_EQUIPMENT_ROLES = _MANAGER_ROLES | {"equipment"}
_WRITE_PATIENT_ROLES = _MANAGER_ROLES | {"reception"}


class IsNationalManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "national_manager"


class IsBranchManagerOrAbove(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in {
            "national_manager",
            "branch_manager",
        }


class IsUnitManagerOrAbove(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in _MANAGER_ROLES


class ReadOnlyOrManager(BasePermission):
    """Authenticated users may read; managers may write."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in _MANAGER_ROLES


class ReadOnlyOrEquipmentStaff(BasePermission):
    """Read for authenticated; write for equipment staff and managers."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in _WRITE_EQUIPMENT_ROLES


class ReadOnlyOrReception(BasePermission):
    """Read for authenticated; write for reception and managers."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in _WRITE_PATIENT_ROLES
