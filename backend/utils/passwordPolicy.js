const MIN_PASSWORD_LENGTH = 12;

function validatePassword(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    const error = new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    );
    error.statusCode = 400;
    throw error;
  }
}

module.exports = { MIN_PASSWORD_LENGTH, validatePassword };
