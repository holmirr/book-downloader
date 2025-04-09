import { auth } from "@/auth/auth";
import { ensureValidTokens } from "@/libs/google/server";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
  }
    const token = await ensureValidTokens(true);
    console.log("token", token);
    return new Response(token as string, { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

