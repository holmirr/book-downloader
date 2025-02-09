import Link from "next/link";

export default function Dashboard() {
  return (
    <div>
      <h1>You are logged in</h1>
      <Link href="/dashboard/download">Download</Link>
    </div>
  )
}

