import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }

  interface User {
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
  }
}
declare module 'next-auth/providers/google' {
  interface GoogleProfile {
    accessToken?: string;
  }
}