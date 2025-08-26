import { redirect } from "next/navigation";

export default function MirrorRedirect() {
  redirect("/welcome");
}

