const test = require("node:test");
const assert = require("node:assert/strict");

const VerificationService = require("../services/VerificationService");
const { validatePassword } = require("../utils/passwordPolicy");
const { loginRateLimiter } = require("../middleware/rateLimitMiddleware");

test("verification codes are six numeric digits", () => {
  for (let index = 0; index < 100; index += 1) {
    assert.match(VerificationService.generateCode(), /^\d{6}$/);
  }
});

test("password policy rejects passwords shorter than 12 characters", () => {
  assert.throws(() => validatePassword("short"), /at least 12/);
  assert.doesNotThrow(() => validatePassword("long-enough-password"));
});

test("login limiter blocks the eleventh request in its window", () => {
  let statusCode = 200;
  const req = { ip: "security-test", baseUrl: "/api/auth", path: "/login" };
  const res = {
    set() {},
    status(code) { statusCode = code; return this; },
    json() { return this; }
  };

  for (let index = 0; index < 11; index += 1) {
    loginRateLimiter(req, res, () => {});
  }

  assert.equal(statusCode, 429);
});
