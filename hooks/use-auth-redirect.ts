import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuthRedirect(redirectTo: string = "/") {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session.status === "unauthenticated") {
      router.push(redirectTo);
    }
  }, [session.status, router, redirectTo]);

  return session;
}
