const jwt = require("jsonwebtoken");
const { getConfig } = require("../config/env");

function requireTeacher(req, res, next) {
  const authorization = req.header("Authorization");
  const match = authorization?.match(/^Bearer\s+(\S+)$/);

  if (!match) {
    return res.status(401).json({
      message: "Unauthorized: Bearer token required",
    });
  }

  try {
    const payload = jwt.verify(match[1], getConfig().jwtSecret, {
      algorithms: ["HS256"],
    });

    if (payload.role !== "teacher") {
      return res.status(403).json({
        message: "Forbidden: only teachers can perform this action",
      });
    }

    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({
      message: "Unauthorized: invalid or expired token",
    });
  }
}

module.exports = requireTeacher;
