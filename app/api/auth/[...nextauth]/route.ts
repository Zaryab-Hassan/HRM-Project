import NextAuth from 'next-auth';
import { authOptions } from './options';

// Optimize the handler by directly exporting it
// This avoids an extra function call for each request
const handler = NextAuth(authOptions);

// Using named exports for better tree-shaking in production
export { handler as GET, handler as POST };

