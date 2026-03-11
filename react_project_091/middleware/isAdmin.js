module.exports = function isAdmin(req, res, next) {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "dept_admin")) {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};
