import { getPusherInstance } from "@/libs/pusher/server";

const pusherServer = getPusherInstance();

// クライアントのpusherが"private-channel"をsubscribeする際に、内部的にこのAPIをコールする
export async function POST(req: Request) {
  const data = await req.text();
  // socketIdはpusherクライアントが現在の接続に対して生成した識別子（あまり関係ない）
  // channelNameは"private-"なチャンネル名。チャンネル名に認証に必要な情報（ダウンロードIDなど）を含める場合もある。
  const [socketId, channelName] = data
    .split("&")
    .map((str) => str.split("=")[1]);

  // jwtを検証するなどして独自の認証ロジックを実装
  // 例：ユーザーがログインしているか、このチャンネルにアクセス権があるか等
  // 今回は未実装

  // 認可が下りたら、pusherServer.authorizeChannelをコールして、認可レスポンスを返す
  const authResponse = pusherServer.authorizeChannel(socketId, channelName);
  return new Response(JSON.stringify(authResponse));
}