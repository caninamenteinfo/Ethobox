import { redirect } from "next/navigation";
import { getProfessionalUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getProfessionalUser();
  redirect(user ? "/cases" : "/login");
}
