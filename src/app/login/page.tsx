import LoginForm from "@/Components/LoginForm";
import { Suspense } from "react";

export default function Login() {
  return (
    <div>
      <h1>Login</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

