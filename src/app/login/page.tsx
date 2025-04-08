import Loading from "@/Components/loading";
import LoginForm from "@/Components/LoginForm";
import { Suspense } from "react";

export default function Login() {
  return (
    <div>
      <Suspense fallback={<Loading/>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

