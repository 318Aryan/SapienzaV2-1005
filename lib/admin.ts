import { auth } from "@clerk/nextjs"

const adminIds = [
  "user_2dx9qBMkLd1v82XbB0LpnAvjck6",
];

export const isAdmin = () => {
  const { userId } = auth();

  if (!userId) {
    return false;
  }

  return adminIds.indexOf(userId) !== -1;
};
