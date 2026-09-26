import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Empty, Field, Flash, PageHeader, Panel, TableWrap, Td, Th, inp } from "@/components/admin/ui";
import { fmtDate } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { isPsg, matchTitle, opponentOf } from "@/lib/matches";
import { requireAdmin } from "@/lib/server/admin-auth";
import { getAllEventsAdmin } from "@/lib/server/events";
import { logoKey, matchLogos, matchSettings, psgMatches, toView } from "@/lib/server/matches";
import { deleteMatchAction, importCalendarAction, saveLogoLibraryAction, saveMatchAction, saveMatchSettingsAction, syncNowAction } from "./actions";

export const metadata = { title: "Matchs du PSG" };

const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());

/** Aperçu carré d'un logo : ajusté dans le cadre sans déformation. */
function Square({ src, name, size = 64 }: { src?: string | null; name: string; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={size} height={size} style={{ width: size, height: size }} className="shrink-0 rounded-[10px] border border-line bg-white/[0.04] object-contain p-1" />
  ) : (
    <span style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-[10px] border border-dashed border-white/25 bg-white/[0.03] font-body text-[10px] text-mist">Aucun</span>
  );
}

function LogoField({ prefix, label, current, name }: { prefix: string; label: string; current?: string | null; name: string }) {
  return (
    <div className="rounded-[10px] border border-line p-3">
      <p className="font-body text-[12px] font-medium uppercase tracking-[0.12em] text-mist">{label}</p>
      <div className="mt-3 flex items-start gap-3">
        <Square src={current} name={name} size={72} />
        <div className="grid min-w-0 flex-1 gap-2">
          <input type="file" name={`${prefix}File`} accept="image/png,image/jpeg,image/webp,image/svg+xml" className={inp} />
          <input name={`${prefix}Url`} placeholder="ou adresse https://…" className={inp} />
        </div>
      </div>
    </div>
  );
}

export default async function MatchesAdminPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("events.edit");
  const sp = await searchParams;
  const [rows, settings, lib, events] = await Promise.all([psgMatches.all(), matchSettings.get(), matchLogos.get(), getAllEventsAdmin()]);
  const t = today();
  const sorted = [...rows].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const upcoming = sorted.filter((m) => m.date >= t);
  const past = sorted.filter((m) => m.date < t).length;
  const editId = first(sp.edit);
  const editing = editId ? rows.find((r) => r.id === editId) : undefined;
  const views = await Promise.all(sorted.map((m) => toView(m, settings, undefined, lib)));
  const view = (id: string) => views.find((v) => v.id === id);
  const editView = editing ? view(editing.id) : undefined;
  const eventOptions = events.filter((e) => e.status !== "archived").sort((a, b) => a.date.localeCompare(b.date));
  const titleOf = (id?: string) => eventOptions.find((e) => e.id === id)?.title;

  // Clubs et compétitions présents dans le calendrier (bibliothèque de logos).
  const teamNames = new Map<string, string>();
  const compNames = new Map<string, string>();
  for (const m of rows) {
    const opp = opponentOf(m);
    if (opp) teamNames.set(logoKey(opp), opp);
    if (m.competition) compNames.set(logoKey(m.competition), m.competition);
  }
  const clubs = [...teamNames].sort((a, b) => a[1].localeCompare(b[1], "fr"));
  const comps = [...compNames].sort((a, b) => a[1].localeCompare(b[1], "fr"));
  const missing = clubs.filter(([k]) => !lib.teams[k] && k !== "marseille" && k !== "olympique-de-marseille").length + comps.filter(([k]) => !lib.competitions[k]).length;

  return (
    <>
      <PageHeader title="Matchs du PSG" subtitle={`${upcoming.length} match(s) à venir${past ? ` · ${past} passé(s)` : ""}. Ils apparaissent dans la rubrique « Prochains matchs » de la page Événements et dans la carte « Prochain match » de l'accueil.`} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Billetterie et mise à jour automatique">
          <form action={saveMatchSettingsAction} className="grid gap-4">
            <Field label="Adresse de la billetterie officielle" hint="Utilisée pour tous les matchs (bouton « Billetterie officielle »). Modifiable match par match."><input name="ticketUrl" defaultValue={settings.ticketUrl} className={inp} /></Field>
            <Field label="Adresse d'un calendrier ICS (facultatif)" hint="Si vous en renseignez une, le calendrier est relu automatiquement (toutes les 6 heures) : dates, horaires, nouveaux matchs et reports sont mis à jour tout seuls."><input name="icsUrl" defaultValue={settings.icsUrl} placeholder="https://…/calendrier.ics" className={inp} /></Field>
            <label className="flex items-center gap-2 font-body text-[13.5px] text-white/85"><input type="checkbox" name="syncNow" className="size-4 accent-[#d90f2c]" /> Synchroniser maintenant</label>
            <div><SubmitButton>Enregistrer</SubmitButton></div>
          </form>
          {settings.lastSync && (
            <div className="mt-4 border-t border-line pt-4 font-body text-[12.5px] text-mist">
              Dernière synchronisation : {fmtDate(settings.lastSync)} · {settings.lastResult}
              {settings.icsUrl && <form action={syncNowAction} className="mt-3"><SubmitButton variant="outline">Relancer maintenant</SubmitButton></form>}
            </div>
          )}
        </Panel>

        <Panel title="Importer un calendrier">
          <form action={importCalendarAction} className="grid gap-4">
            <Field label="Fichier (ICS, CSV ou texte)"><input type="file" name="file" accept=".ics,.csv,.txt,text/calendar,text/csv,text/plain" className={inp} /></Field>
            <Field label="Ou collez le tableau" hint="Lignes « date ; heure ; match ; compétition » (copiées depuis Word ou Excel), par exemple : 10 oct. 2026 ; 20h45 ; PSG – Le Mans ; Ligue 1. Les matchs déjà connus sont mis à jour, les autres ajoutés."><textarea name="text" rows={5} className={inp + " h-auto py-3"} /></Field>
            <div><SubmitButton>Importer</SubmitButton></div>
          </form>
        </Panel>
      </div>

      <Panel className="mt-4" title={editing ? `Modifier le match : ${matchTitle(editing)} (${fmtDate(editing.date)})` : "Créer un match"}>
        <form key={editing?.id ?? "new"} action={saveMatchAction} className="grid gap-4">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Date"><input type="date" name="date" required defaultValue={editing?.date} className={inp} /></Field>
            <Field label="Heure (Paris)"><input type="time" name="time" defaultValue={editing?.time} className={inp} /></Field>
            <Field label="Équipe à domicile"><input name="homeTeam" required defaultValue={editing?.homeTeam ?? "Paris Saint-Germain"} className={inp} /></Field>
            <Field label="Équipe à l'extérieur"><input name="awayTeam" required defaultValue={editing?.awayTeam} className={inp} /></Field>
            <Field label="Compétition"><input name="competition" defaultValue={editing?.competition} placeholder="Ligue des champions" className={inp} /></Field>
            <Field label="Stade"><input name="stadium" defaultValue={editing?.stadium} placeholder="Parc des Princes" className={inp} /></Field>
            <Field label="Billetterie de ce match (facultatif)"><input name="ticketUrl" defaultValue={editing?.ticketUrl} placeholder={settings.ticketUrl} className={inp} /></Field>
            <Field label="Événement des Dames relié" hint="Crée le bouton « Vivre le match avec les Dames ! »">
              <select name="relatedEventId" defaultValue={editing?.relatedEventId ?? ""} className={inp}>
                <option value="">Aucun</option>
                {eventOptions.map((e) => <option key={e.id} value={e.id}>{fmtDate(e.date)} · {e.title}</option>)}
              </select>
            </Field>
          </div>
          <div>
            <p className="mb-2 font-body text-[13px] text-white/80">Logos : trois logos <strong className="text-white">carrés</strong> (domicile, extérieur, compétition). Chaque image est ajustée automatiquement dans un carré, sans déformation. Un logo enregistré sert ensuite pour tous les matchs du même club ou de la même compétition.</p>
            <div className="grid gap-3 md:grid-cols-3">
              <LogoField prefix="homeLogo" label="Équipe à domicile" current={editView?.homeLogo} name="Domicile" />
              <LogoField prefix="awayLogo" label="Équipe à l'extérieur" current={editView?.awayLogo} name="Extérieur" />
              <LogoField prefix="competitionLogo" label="Compétition" current={editView?.competitionLogo} name="Compétition" />
            </div>
          </div>
          <label className="flex items-center gap-2 font-body text-[13.5px] text-white/85"><input type="checkbox" name="hidden" defaultChecked={editing?.hidden} className="size-4 accent-[#d90f2c]" /> Masquer ce match sur le site</label>
          <div className="flex items-center gap-3">
            <SubmitButton>{editing ? "Enregistrer le match" : "Créer le match"}</SubmitButton>
            {editing && <a href="/admin/evenements/matchs" className="font-body text-[13.5px] text-mist underline underline-offset-4 hover:text-white">Annuler la modification</a>}
          </div>
        </form>
      </Panel>

      <Panel className="mt-4" title={`Logos des clubs et des compétitions${missing ? ` · ${missing} à ajouter` : ""}`}>
        <form action={saveLogoLibraryAction} className="grid gap-6">
          <p className="font-body text-[13px] text-white/75">Un logo par club adverse et par compétition, carré (PNG, WebP ou SVG). Il est utilisé sur tous les matchs concernés. Le logo du PSG est déjà en place.</p>
          <div>
            <h3 className="mb-3 font-body text-[13px] font-semibold uppercase tracking-[0.14em] text-mist">Compétitions</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {comps.map(([key, name]) => (
                <div key={key} className="flex items-start gap-3 rounded-[10px] border border-line p-3">
                  <input type="hidden" name="comps" value={key} />
                  <Square src={lib.competitions[key]} name={name} />
                  <div className="grid min-w-0 flex-1 gap-2"><span className="truncate font-body text-[13.5px] font-medium text-white">{name}</span><input type="file" name={`comp:${key}:file`} accept="image/png,image/jpeg,image/webp,image/svg+xml" className={inp} /></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 font-body text-[13px] font-semibold uppercase tracking-[0.14em] text-mist">Clubs adverses</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clubs.map(([key, name]) => {
                const v = views.find((x) => logoKey(x.opponent) === key);
                return (
                  <div key={key} className="flex items-start gap-3 rounded-[10px] border border-line p-3">
                    <input type="hidden" name="teams" value={key} />
                    <Square src={lib.teams[key] || (v ? (v.isHome ? v.awayLogo : v.homeLogo) : "")} name={name} />
                    <div className="grid min-w-0 flex-1 gap-2"><span className="truncate font-body text-[13.5px] font-medium text-white">{name}</span><input type="file" name={`team:${key}:file`} accept="image/png,image/jpeg,image/webp,image/svg+xml" className={inp} /></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div><SubmitButton>Enregistrer les logos</SubmitButton></div>
        </form>
      </Panel>

      <Panel className="mt-4" title="Matchs à venir" flush>
        {upcoming.length === 0 ? <Empty>Aucun match à venir. Importez le calendrier ou créez un match.</Empty> : (
          <TableWrap>
            <thead><tr><Th>Date</Th><Th>Match</Th><Th>Compétition</Th><Th>Événement relié</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {upcoming.map((m) => (
                <tr key={m.id} className="align-top">
                  <Td className="tabular-nums">{fmtDate(m.date)}<span className="block text-[12px] text-mist">{m.time ? m.time.replace(":", "h") : "Horaire à confirmer"}</span></Td>
                  <Td><span className="font-medium text-white">{matchTitle(m)}</span><span className="block text-[12px] text-mist">{isPsg(m.homeTeam) ? "Domicile" : "Extérieur"}{m.stadium ? ` · ${m.stadium}` : ""}</span>{m.hidden && <Badge tone="grey">Masqué</Badge>}</Td>
                  <Td className="text-[13px]">{m.competition || "—"}</Td>
                  <Td className="text-[13px]">{m.relatedEventId ? (titleOf(m.relatedEventId) ?? <Badge tone="orange">Événement introuvable</Badge>) : <span className="text-mist">Aucun</span>}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <a href={`/admin/evenements/matchs?edit=${m.id}#top`} className="inline-flex h-8 items-center rounded-[8px] border border-white/20 px-3 font-body text-[12.5px] text-white hover:border-white/45">Modifier</a>
                      <form action={deleteMatchAction.bind(null, m.id)}><SubmitButton variant="danger" confirm="Supprimer ce match ?">Supprimer</SubmitButton></form>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}
