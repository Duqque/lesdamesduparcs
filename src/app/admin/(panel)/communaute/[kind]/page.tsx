import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Empty, Field, Flash, PageHeader, Panel, TableWrap, Td, Th, area, inp } from "@/components/admin/ui";
import { KINDS, type FieldDef } from "@/lib/admin/crud";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { deleteRowAction, saveRowAction } from "../actions";

export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  return { title: KINDS[kind]?.title ?? "Communauté" };
}

function Input({ f, row }: { f: FieldDef; row?: Record<string, unknown> }) {
  const v = row?.[f.name];
  const shown = f.type === "money" ? (v === undefined ? "" : row?.type === "percent" ? String(v) : String(Number(v) / 100)) : v === undefined || v === null ? "" : String(v);
  if (f.type === "checkbox") return <label className="flex items-center gap-2 pt-7 font-body text-[13.5px] text-white/85"><input type="checkbox" name={f.name} defaultChecked={row ? Boolean(v) : true} className="size-4 accent-[#d90f2c]" />{f.label}</label>;
  return (
    <Field label={f.label} hint={f.hint} className={f.full ? "sm:col-span-2" : undefined}>
      {f.type === "textarea" ? <textarea name={f.name} defaultValue={shown} rows={3} className={area} />
        : f.type === "select" ? <select name={f.name} defaultValue={shown} className={inp}>{f.options!.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        : <input name={f.name} type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"} inputMode={f.type === "money" ? "decimal" : undefined} defaultValue={shown} required={f.required} className={inp} />}
    </Field>
  );
}

function RowForm({ kind, fields, row }: { kind: string; fields: FieldDef[]; row?: Record<string, unknown> }) {
  return (
    <form action={saveRowAction.bind(null, kind)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {row && <input type="hidden" name="id" value={String(row.id)} />}
      {fields.map((f) => <Input key={f.name} f={f} row={row} />)}
      <div className="sm:col-span-2"><SubmitButton>{row ? "Enregistrer" : "Ajouter"}</SubmitButton></div>
    </form>
  );
}

/** Gestion des avantages, partenaires, offres et codes promotionnels (même écran, définitions différentes). */
export default async function CommunityKindPage({ params, searchParams }: { params: Promise<{ kind: string }>; searchParams: Promise<SP> }) {
  const { kind } = await params;
  const def = KINDS[kind];
  if (!def) notFound();
  await requireAdmin(def.perm);
  const sp = await searchParams;
  const rows = (await def.coll.all()) as Array<Record<string, unknown>>;
  // Les offres proposent la liste des partenaires
  const fields = def.fields;
  return (
    <>
      <PageHeader title={def.title} subtitle={def.intro} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel flush className="mb-4">
        {rows.length === 0 ? <Empty>Aucun élément pour le moment.</Empty> : (
          <TableWrap>
            <thead><tr>{def.columns.map((c) => <Th key={c.label}>{c.label}</Th>)}<Th>Actions</Th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={String(r.id)} className="align-top">
                  {def.columns.map((c, i) => <Td key={c.label} className={i === 0 ? "font-medium text-white" : ""}>{c.value(r)}</Td>)}
                  <Td>
                    <details>
                      <summary className="cursor-pointer font-body text-[12.5px] text-white/80 hover:text-white">Modifier</summary>
                      <div className="mt-4 w-[min(560px,80vw)]"><RowForm kind={kind} fields={fields} row={r} /></div>
                      <form action={deleteRowAction.bind(null, kind, String(r.id))} className="mt-3"><SubmitButton variant="danger" confirm="Supprimer cet élément ?">Supprimer</SubmitButton></form>
                    </details>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
      <Panel title={`Ajouter : ${def.singular}`}><RowForm kind={kind} fields={fields} /></Panel>
    </>
  );
}
