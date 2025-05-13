import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import Employee from '@/models/Employee';
import Manager from '@/models/Manager';
import Admin from '@/models/Admin';
import connectToDatabase from '@/lib/mongodb';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },      
      async authorize(credentials: { email: string; password: string } | undefined) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide email and password');
        }

        await connectToDatabase();        // Run all database queries in parallel for better performance
        // Note: Don't use select('+password') with lean() as it won't work properly
        const [employee, manager, admin] = await Promise.all([
          Employee.findOne({ email: credentials.email }),
          Manager.findOne({ email: credentials.email }),
          Admin.findOne({ email: credentials.email })
        ]);

        // Determine user type and role in a single step
        let user;
        let role = 'employee';

        if (admin) {
          user = admin;
          role = 'hr';
        } else if (manager) {
          user = manager;
          role = 'manager';
        } else if (employee) {
          user = employee;
          // Check if employee has HR role
          if (employee.role === 'hr') {
            role = 'hr';
          }
        } else {
          throw new Error('No user found');
        }
          // Password comparison with the document instance
        // This ensures we're using the model instance methods
        const isValid = await user.comparePassword(credentials.password);

        if (!isValid) {
          throw new Error('Invalid password');
        }

        // Return standardized user object with role information
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name || user.username || user.email.split('@')[0], // Fallback if name is missing
          role: role
        };
      }
    })
  ],  callbacks: {
    async jwt({ token, user }) {
      // Only update token when user object is available (during sign-in)
      // This makes subsequent JWT callbacks more efficient
      if (user) {
        // Set all essential user properties on token in one operation with error handling
        Object.assign(token, {
          id: user.id,
          role: user.role || 'employee', // Default to employee if role is missing
          name: user.name || token.name, // Keep existing name if available
          email: user.email || token.email // Keep existing email if available
        });
      }
      return token;
    },
    async session({ session, token }) {
      // Map token data to session efficiently with error handling
      if (session.user) {
        // Transfer all token data to session in one operation
        Object.assign(session.user, {
          id: token.id,
          role: (token.role as string | null) || 'employee',
          name: token.name || session.user.name,
          email: token.email || session.user.email
        });
      }
      return session;
    }
  },pages: {
    signIn: '/',
    error: '/?error=true',
  },  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - Only refresh the token once per day for performance
  },
  // Optimized for Vercel deployment
  // Use undefined in production to let NextAuth handle cookies automatically
  // This is important for proper domain detection in Vercel environments
  cookies: process.env.NODE_ENV === 'production'
    ? undefined  // Use NextAuth defaults in production
    : {
        sessionToken: {
          name: `next-auth.session-token`,
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: false,
          }
        }
      }
};