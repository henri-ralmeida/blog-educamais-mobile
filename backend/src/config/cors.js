const LOCAL_WEB_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:8081",
]);

function isPrivateOrLoopbackHost(hostname) {
  const normalizedHostname = hostname.toLowerCase();
  if (["localhost", "127.0.0.1", "[::1]"].includes(normalizedHostname)) return true;

  const octets = normalizedHostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  return (
    octets[0] === 10
    || octets[0] === 127
    || (octets[0] === 192 && octets[1] === 168)
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
  );
}

function isDevelopmentExpoOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.protocol === "exp:" && isPrivateOrLoopbackHost(url.hostname);
  } catch {
    return false;
  }
}

function isOriginAllowed(origin, config) {
  if (!origin) return true;
  if (config.corsOrigins.includes(origin)) return true;
  if (config.nodeEnv !== "development" && config.nodeEnv !== "test") return false;

  return LOCAL_WEB_ORIGINS.has(origin) || isDevelopmentExpoOrigin(origin);
}

function createCorsOptions(config) {
  return {
    origin(origin, callback) {
      callback(null, isOriginAllowed(origin, config));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
}

module.exports = { createCorsOptions, isOriginAllowed };
