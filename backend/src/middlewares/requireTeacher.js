function requireTeacher(req, res, next) {
  const userType = req.header("x-user-type");
  if (userType !== "teacher") {
    return res.status(403).json({
      message: "Forbidden: only teachers can perform this action",
    });
  }
  return next();
}

module.exports = requireTeacher;


