function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        message: "Unauthorized. User information is missing."
      });
    }

    if (req.user.role === "superadmin") {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden. You do not have permission."
      });
    }

    next();
  };
}

module.exports = requireRole;
