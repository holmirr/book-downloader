import { createTable } from "@/lib/utils/database";

export default async function Seed() {
  try {
    await createTable();
  } catch (e) {
    console.error(e);
    return <div>failed</div>;
  }
  return <div>Seed</div>;
}