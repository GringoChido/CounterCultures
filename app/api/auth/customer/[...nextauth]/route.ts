import NextAuth from "next-auth";
import { customerAuthOptions } from "@/app/lib/customer-auth";

const handler = NextAuth(customerAuthOptions);

export { handler as GET, handler as POST };
