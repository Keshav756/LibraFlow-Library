import jwt from "jsonwebtoken";

export const sendToken = (user, statusCode, message, res) => {
  // Generate JWT
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  // Cookie options
  const options = {
    expires: new Date(
      Date.now() + (process.env.COOKIE_EXPIRES || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
  };

  // Send response
  res.status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      message,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountVerified: user.accountVerified,
      },
    });
};