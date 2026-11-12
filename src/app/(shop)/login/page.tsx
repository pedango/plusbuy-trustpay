import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="container-page py-16">Loading sign in…</main>}>
      <LoginForm />
    </Suspense>
  );
}
