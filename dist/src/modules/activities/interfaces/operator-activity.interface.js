"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityStatus = exports.ActivityAction = void 0;
var ActivityAction;
(function (ActivityAction) {
    ActivityAction["PACKAGE_CREATED"] = "PACKAGE_CREATED";
    ActivityAction["PACKAGE_UPDATED"] = "PACKAGE_UPDATED";
    ActivityAction["PACKAGE_DELETED"] = "PACKAGE_DELETED";
    ActivityAction["PACKAGE_ASSIGNED"] = "PACKAGE_ASSIGNED";
    ActivityAction["PACKAGE_USER_UPDATED"] = "PACKAGE_USER_UPDATED";
    ActivityAction["PACKAGE_STATUS_UPDATED"] = "PACKAGE_STATUS_UPDATED";
    ActivityAction["PACKAGE_INVOICED"] = "PACKAGE_INVOICED";
    ActivityAction["INVOICE_CREATED"] = "INVOICE_CREATED";
    ActivityAction["PAYMENT_PROCESSED"] = "PAYMENT_PROCESSED";
    ActivityAction["USER_CREATED"] = "USER_CREATED";
    ActivityAction["USER_UPDATED"] = "USER_UPDATED";
    ActivityAction["USER_DELETED"] = "USER_DELETED";
    ActivityAction["LOGIN"] = "LOGIN";
    ActivityAction["LOGOUT"] = "LOGOUT";
})(ActivityAction || (exports.ActivityAction = ActivityAction = {}));
var ActivityStatus;
(function (ActivityStatus) {
    ActivityStatus["COMPLETED"] = "completed";
    ActivityStatus["PENDING"] = "pending";
    ActivityStatus["FAILED"] = "failed";
})(ActivityStatus || (exports.ActivityStatus = ActivityStatus = {}));
//# sourceMappingURL=operator-activity.interface.js.map