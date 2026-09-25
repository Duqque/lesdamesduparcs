"use server";

import { redirect } from "next/navigation";
import { KINDS, parseFields } from "@/lib/admin/crud";
import { audit, requireAdmin } from "@/lib/server/admin-auth";

export async function saveRowAction(kind: string, formData: FormData) {
  const def = KINDS[kind];
  if (!def) redirect("/admin");
  const ctx = await requireAdmin(def.perm);
  const id = String(formData.get("id") ?? "");
  const data = parseFields(def, formData);
  for (const f of def.fields) if (f.required && (data[f.name] === undefined || data[f.name] === "" || data[f.name] === 0) && f.type !== "checkbox") redirect(`/admin/communaute/${kind}?erreur=${encodeURIComponent(`${f.label} : champ requis.`)}`);
  const label = String(data.title ?? data.name ?? data.code ?? "");
  if (id) {
    await def.coll.update(id, data);
    await audit(ctx, "modification", def.singular, `${def.singular[0].toUpperCase()}${def.singular.slice(1)} modifié(e) : ${label}`, { entityId: id });
  } else {
    const row = await def.coll.insert(kind === "codes-promo" ? { uses: 0, ...data } : data);
    await audit(ctx, "création", def.singular, `${def.singular[0].toUpperCase()}${def.singular.slice(1)} créé(e) : ${label}`, { entityId: row.id });
  }
  redirect(`/admin/communaute/${kind}?ok=${encodeURIComponent("Enregistré.")}`);
}

export async function deleteRowAction(kind: string, id: string) {
  const def = KINDS[kind];
  if (!def) redirect("/admin");
  const ctx = await requireAdmin(def.perm);
  await def.coll.remove(id);
  await audit(ctx, "suppression", def.singular, `Suppression : ${def.singular}`, { entityId: id });
  redirect(`/admin/communaute/${kind}?ok=${encodeURIComponent("Supprimé.")}`);
}
