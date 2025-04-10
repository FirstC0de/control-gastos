import prisma from "./prisma";


// src/app/lib/auth.ts
export const authOptions = {
  providers: {
    credentials: {
      type: "credentials",
      id: "credentials",
      verify: async (credentials: { username: string; password: string }) => {
        const user = await prisma.user.findFirst({
          where: { email: credentials.username },
        });

        if (!user || user.password !== credentials.password) {
          return null;
        }

        return {
          id: user.id,
          name: user.email,
          email: user.email,
        };
      },
    },
  },
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
    error: "/auth/login",
  },
};
