import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Badge, Empty, Flash, PageHeader, Pagination, Panel, TableWrap, Td, Th, btn, inp, lbl } from "@/components/admin/ui";
import { fmtDate, num } from "@/lib/admin/format";
import { first, href, pick, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { filterDiscordRows, loadDiscordRows, type DiscordFilters } from "@/lib/server/admin-data";
import { STATUS_LABEL, STATUS_TONE } from "@/components/admin/status";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { discordConfigured } from "@/lib/server/discord/config";
import { disconnectDiscordAction, forceSyncAllDiscordAction, forceSyncDiscordAction } from "./actions";

export const metadata = { title: "Discord" };

const KEYS = ["q", "connecte", "statut"] as const;
const PAGE_SIZE = 25;

const DISCORD_TONE = { ACTIVE: "green", INACTIVE: "grey", ERROR: "red" } as const;
const DISCORD_LABEL = { ACTIVE: "Actif", INACTIVE: "Inactif (adhésion expirée)", ERROR: "Erreur de synchronisation" } as const;

export default async function DiscordPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("discord.manage");
  const sp = await searchParams;
  const f = pick(sp, KEYS) as DiscordFilters;
  const page = Math.max(1, Number(first(sp.page)) || 1);
  const all = await loadDiscordRows();
  const rows = filterDiscordRows(all, f);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const connected = all.filter((r) => r.discord).length;
  const mk = (extra: Record<string, string | number | undefined>) => href("/admin/communaute/discord", { ...f, ...extra });

  return (
    <>
      <PageHeader
        title="Discord"
        subtitle={`${num(connected)} compte${connected > 1 ? "s" : ""} Discord associé${connected > 1 ? "s" : ""} sur ${num(all.length)} adhérentes.`}
        actions={
          <form action={forceSyncAllDiscordAction}>
            <SubmitButton variant="outline"><RefreshCw aria-hidden className="size-4" /> Tout resynchroniser</SubmitButton>
          </form>
        }
      />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />

      {!discordConfigured() && (
        <Panel className="mb-4" title="Configuration incomplète">
          <p className="font-body text-[14px] leading-[1.7] text-amber-100">
            Les variables DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID et DISCORD_ROLE_ID ne sont pas toutes renseignées :
            les adhérentes ne peuvent pas encore connecter leur compte Discord.
          </p>
        </Panel>
      )}

      <Panel className="mb-4" title="Filtres">
        <form method="get" autoComplete="off" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="lg:col-span-2"><span className={lbl}>Nom, prénom, e-mail, pseudo Discord</span><input name="q" defaultValue={f.q} className={`${inp} mt-1.5`} placeholder="Rechercher" /></label>
          <label><span className={lbl}>Connecté</span><select name="connecte" defaultValue={f.connecte ?? ""} className={`${inp} mt-1.5`}><option value="">Toutes</option><option value="oui">Oui</option><option value="non">Non</option></select></label>
          <label><span className={lbl}>Statut Discord</span><select name="statut" defaultValue={f.statut ?? ""} className={`${inp} mt-1.5`}><option value="">Tous</option>{Object.entries(DISCORD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <div className="flex items-end gap-2 lg:col-span-4">
            <button type="submit" className={btn.primary}>Filtrer</button>
            <Link href="/admin/communaute/discord" className={btn.outline}>Réinitialiser</Link>
          </div>
        </form>
      </Panel>

      <Panel flush>
        {shown.length === 0 ? (
          <Empty>Aucune adhérente ne correspond à ces critères.</Empty>
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Adhérente</Th>
                  <Th>Adhésion</Th>
                  <Th>Discord</Th>
                  <Th>Statut Discord</Th>
                  <Th>Connecté le</Th>
                  <Th>Dernière vérification</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.member.id} className="hover:bg-white/[0.02]">
                    <Td>
                      <Link href={`/admin/adherentes/${r.member.id}`} className="block">
                        <span className="block font-medium text-white">{r.member.firstName} {r.member.lastName}</span>
                        <span className="block text-[12.5px] text-mist">{r.member.email}</span>
                      </Link>
                    </Td>
                    <Td><Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge></Td>
                    <Td>{r.discord ? `@${r.discord.username}` : "—"}</Td>
                    <Td>{r.discord ? <Badge tone={DISCORD_TONE[r.discord.status]}>{DISCORD_LABEL[r.discord.status]}</Badge> : "Non connecté"}</Td>
                    <Td className="tabular-nums">{r.discord ? fmtDate(r.discord.connectedAt) : "—"}</Td>
                    <Td className="tabular-nums">{r.discord ? fmtDate(r.discord.lastVerifiedAt) : "—"}</Td>
                    <Td>
                      {r.discord && (
                        <div className="flex flex-wrap gap-2">
                          <form action={forceSyncDiscordAction.bind(null, r.member.id)}><SubmitButton variant="outline">Resynchroniser</SubmitButton></form>
                          <form action={disconnectDiscordAction.bind(null, r.member.id)}><SubmitButton variant="danger" confirm={`Déconnecter le compte Discord de ${r.member.firstName} ${r.member.lastName} ? Le rôle sera retiré immédiatement ; elle pourra en reconnecter un autre depuis son espace.`}>Déconnecter</SubmitButton></form>
                        </div>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination page={page} pages={pages} hrefFor={(p) => mk({ page: p })} />
          </>
        )}
      </Panel>
    </>
  );
}
