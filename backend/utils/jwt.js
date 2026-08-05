import jwt from "jsonwebtoken";

export const signToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );