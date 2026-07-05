import { redirect } from "next/navigation";

export default function PanelUsuariosRedirect() {
  redirect("/admin/usuarios/");
}
