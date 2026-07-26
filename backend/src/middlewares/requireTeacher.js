const jwt = require("jsonwebtoken");
const { getConfig } = require("../config/env");
const prisma = require("../config/prisma");

async function requireTeacher(req, res, next) {
  const authorization = req.header("Authorization");
  const match = authorization?.match(/^Bearer\s+(\S+)$/);

  if (!match) {
    return res.status(401).json({
      message: "Unauthorized: Bearer token required",
    });
  }

  let payload;

  try {
    payload = jwt.verify(match[1], getConfig().jwtSecret, {
      algorithms: ["HS256"],
    });
  } catch {
    return res.status(401).json({
      message: "Unauthorized: invalid or expired token",
    });
  }

  if (payload.role !== "teacher") {
    return res.status(403).json({
      message: "Forbidden: only teachers can perform this action",
    });
  }

  if (typeof payload.sub !== "string" || !payload.sub) {
    return res.status(401).json({
      message: "Unauthorized: invalid or expired token",
    });
  }

  try {
    const professor = await prisma.professor.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        nome: true,
        email: true,
        tokenVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!professor) {
      return res.status(401).json({
        message: "Unauthorized: teacher no longer exists",
      });
    }

    if (payload.tokenVersion !== professor.tokenVersion) {
      return res.status(401).json({
        message: "Unauthorized: session revoked",
      });
    }

    const { tokenVersion: _tokenVersion, ...professorSeguro } = professor;
    req.auth = {
      role: "teacher",
      professor: professorSeguro,
    };
    return next();
  } catch (error) {
    console.error("[requireTeacher] Falha ao validar professor", {
      name: error?.name || "Error",
      code: error?.code || "UNKNOWN",
    });
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

module.exports = requireTeacher;
