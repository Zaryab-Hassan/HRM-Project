import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import Employee from '@/models/Employee';
import Manager from '@/models/Manager';
import Admin from '@/models/Admin';
import connectToDatabase from '@/lib/mongodb';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
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

        await connectToDatabase();

        // Check all user types (Employee, Manager, Admin)
        const employee = await Employee.findOne({ email: credentials.email });
        const manager = await Manager.findOne({ email: credentials.email });
        const admin = await Admin.findOne({ email: credentials.email });

        const user = employee || manager || admin;

        if (!user) {
          throw new Error('No user found');
        }

        const isValid = await user.comparePassword(credentials.password);

        if (!isValid) {
          throw new Error('Invalid password');
        }

        // Determine role based on collection and the user's role field
        let role = 'employee';
        if (manager) {
          role = 'manager';
        } else if (admin) {
          role = 'hr';
        } else if (employee && employee.role === 'hr') {
          // If an employee has an 'hr' role in their record, treat them as HR
          role = 'hr';
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        session.user.role = token.role as string | null;
      }
      return session;
    }  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
};