import { saveEventAction } from "@/app/admin/(panel)/evenements/actions";
import type { EventRow } from "@/lib/server/events";
import { SubmitButton } from "./SubmitButton";
import { Field, Panel, area, inp } from "./ui";

const TAGS = ["Programme", "Matchday", "Soirée", "Atelier", "Membres", "Déplacement"] as const;
const CATS: Record<string, string> = { Matchday: "Match", Déplacement: "Déplacement", Membres: "Rencontre", Soirée: "Soirée", Atelier: "Animation", Programme: "Programme" };
const toLocal = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

/** Formulaire de création / modification d'un événement, en sept étapes. */
export function EventForm({ event, canPricing = true, matches = [], linkedMatchId = "" }: { event?: EventRow; canPricing?: boolean; matches?: Array<{ id: string; label: string }>; linkedMatchId?: string }) {
  const r = event?.registration;
  const hasTiers = Boolean(r?.tiers?.length);
  return (
    <form action={saveEventAction} className="grid gap-4">
      {event && <input type="hidden" name="id" value={event.id} />}

      <Panel title="1 · Informations">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Titre" className="sm:col-span-2"><input name="title" defaultValue={event?.title} required className={inp} /></Field>
          <Field label="Sous-titre" className="sm:col-span-2"><input name="subtitle" defaultValue={event?.subtitle} className={inp} /></Field>
          <Field label="Match du PSG relié (co-organisation)" hint="Si cet événement accompagne un match, il apparaît sur la carte du match avec le bouton « Vivre le match avec les Dames ! »." className="sm:col-span-2">
            <select name="matchId" defaultValue={linkedMatchId} className={inp}>
              <option value="">Aucun match</option>
              {matches.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </Field>
          <Field label="Catégorie"><select name="tag" defaultValue={event?.tag ?? "Programme"} className={inp}>{TAGS.map((t) => <option key={t} value={t}>{CATS[t]} ({t})</option>)}</select></Field>
          <Field label="Résumé court (carte et partage)"><input name="summary" defaultValue={event?.summary} className={inp} /></Field>
          <Field label="Description (paragraphes séparés par une ligne vide)" className="sm:col-span-2"><textarea name="description" rows={6} defaultValue={event?.description.join("\n\n")} className={area} /></Field>
          <Field label="Image principale (adresse ou médiathèque)" hint="Ex. /medias/… copié depuis la médiathèque, ou /images/…"><input name="image" defaultValue={event?.image} className={inp} /></Field>
          <Field label="Texte alternatif de l'image"><input name="imageAlt" defaultValue={event?.imageAlt} className={inp} /></Field>
          <Field label="Galerie (une adresse d'image par ligne)" className="sm:col-span-2"><textarea name="gallery" rows={2} defaultValue={event?.gallery?.join("\n")} className={area} /></Field>
        </div>
      </Panel>

      <Panel title="2 · Date">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Field label="Date"><input type="date" name="date" defaultValue={event?.date} required className={inp} /></Field>
          <Field label="Début"><input type="time" name="time" defaultValue={event?.time ?? "20:00"} className={inp} /></Field>
          <Field label="Fin"><input type="time" name="endTime" defaultValue={event?.endTime ?? "23:00"} className={inp} /></Field>
          <Field label="Fuseau horaire"><input value="Europe/Paris" readOnly className={inp} /></Field>
          {!event && (
            <>
              <Field label="Répétition"><select name="repeat" defaultValue="none" className={inp}><option value="none">Aucune</option><option value="weekly">Chaque semaine</option><option value="biweekly">Toutes les 2 semaines</option><option value="monthly">Chaque mois</option></select></Field>
              <Field label="Nombre d'occurrences"><input name="repeatCount" type="number" min={1} max={20} defaultValue={4} className={inp} /></Field>
            </>
          )}
        </div>
      </Panel>

      <Panel title="3 · Localisation">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Lieu"><input name="venue" defaultValue={event?.venue} required className={inp} /></Field>
          <Field label="Ville"><input name="city" defaultValue={event?.city} className={inp} /></Field>
          <Field label="Adresse" className="sm:col-span-2"><input name="address" defaultValue={event?.address} className={inp} /></Field>
          <Field label="Coordonnées GPS"><input name="gps" defaultValue={event?.gps} placeholder="48.8414, 2.2530" className={inp} /></Field>
          <Field label="Lien Google Maps"><input name="mapUrl" defaultValue={event?.mapUrl} className={inp} /></Field>
        </div>
      </Panel>

      <Panel title="4 · Participants">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Mode d'inscription"><select name="mode" defaultValue={r?.mode ?? "form"} className={inp}><option value="form">Inscription sur le site (membres)</option><option value="external">Billetterie externe</option><option value="closed">Terminé, pas d&rsquo;inscription</option></select></Field>
          <Field label="Nombre maximum"><input name="capacity" type="number" min={0} defaultValue={r?.capacity ?? 50} className={inp} /></Field>
          <Field label="Nombre minimum"><input name="minCapacity" type="number" min={0} defaultValue={r?.minCapacity} className={inp} /></Field>
          <Field label="Lien de billetterie (mode externe)" className="sm:col-span-3"><input name="ticketUrl" defaultValue={r?.mode === "external" ? event?.href : ""} placeholder="https://" className={inp} /></Field>
          <div className="flex flex-wrap gap-5 sm:col-span-3">
            {([["waitlist", "Liste d'attente quand c'est complet", r?.waitlist ?? true], ["membersOnly", "Réservé aux membres", r?.membersOnly ?? true], ["guardianRequired", "Mineures : responsable légal requis", r?.guardianRequired ?? false], ["singlePlace", "Une seule place par inscription", r?.singlePlace ?? false]] as const).map(([n, l, v]) => (
              <label key={n} className="flex items-center gap-2 font-body text-[13.5px] text-white/85"><input type="checkbox" name={n} defaultChecked={Boolean(v)} className="size-4 accent-[#d90f2c]" />{l}</label>
            ))}
          </div>
          <Field label="Âge minimum"><input name="minAge" type="number" defaultValue={r?.minAge} className={inp} /></Field>
          <Field label="Âge maximum"><input name="maxAge" type="number" defaultValue={r?.maxAge} className={inp} /></Field>
        </div>
      </Panel>

      {canPricing ? (
        <>
          <Panel title="5 · Tarification">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Formule tarifaire"><select name="pricing" defaultValue={r && r.priceCents === 0 && !hasTiers ? "free" : "paid"} className={inp}><option value="free">Gratuit</option><option value="paid">Payant, prix fixe</option></select></Field>
              <Field label="Prix par place (€)"><input name="price" inputMode="decimal" defaultValue={r ? r.priceCents / 100 : ""} className={inp} /></Field>
              <Field label="Tarifs selon la formule d'adhésion (un par ligne : Formule | prix)" hint="Ex. Dame Premium | 10. La formule de l'adhérente est reconnue automatiquement : elle paie ce tarif, les autres paient le prix de base." className="sm:col-span-2"><textarea name="tiers" rows={2} defaultValue={r?.tiers?.map((t) => `${t.label} | ${t.priceCents / 100}`).join("\n")} className={area} /></Field>
            </div>
          </Panel>
          <Panel title="6 · Paiement">
            <div className="grid gap-4">
              <Field label="Mode de paiement"><select name="paymentMode" defaultValue={r?.paymentMode ?? "online"} className={inp}><option value="online">Paiement en ligne obligatoire (inscription confirmée une fois payée)</option><option value="optional">Paiement en ligne facultatif (inscription confirmée tout de suite)</option><option value="onsite">Paiement sur place</option><option value="manual">Paiement manuel (virement, chèque)</option><option value="none">Aucun paiement</option></select></Field>
              <Field label="Consignes de règlement (virement, chèque…)" hint="Affichées à l'inscrite et envoyées par e-mail pour le paiement manuel."><textarea name="paymentInstructions" rows={3} defaultValue={r?.paymentInstructions} className={area} /></Field>
            </div>
          </Panel>
        </>
      ) : (
        <Panel title="5 · Tarification et paiement">
          <p className="font-body text-[13.5px] text-mist">Votre rôle ne permet pas de modifier les tarifs. {event ? <>Tarif actuel : {r && r.priceCents > 0 ? `${r.priceCents / 100} €` : "gratuit"}, paiement « {r?.paymentMode ?? "online"} ».</> : "L'événement sera créé gratuit ; une personne autorisée ajoutera le tarif."}</p>
        </Panel>
      )}

      <Panel title="Programme et informations pratiques">
        <div className="grid gap-4">
          <Field label="Programme (une ligne par étape : 18:30 | Titre | Texte)"><textarea name="program" rows={4} defaultValue={event?.program.map((p) => `${p.time} | ${p.title} | ${p.text}`).join("\n")} className={area} /></Field>
          <Field label="Informations pratiques (Libellé | valeur)"><textarea name="practical" rows={4} defaultValue={event?.practical.map((p) => `${p.label} | ${p.value}`).join("\n")} className={area} /></Field>
        </div>
      </Panel>

      <Panel title="7 · Publication">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Statut"><select name="status" defaultValue={event?.status ?? "draft"} className={inp}><option value="draft">Brouillon</option><option value="scheduled">Planifié</option><option value="published">Publié</option><option value="archived">Archivé</option></select></Field>
          <Field label="Publication programmée (si « Planifié »)"><input type="datetime-local" name="publishAt" defaultValue={toLocal(event?.publishAt)} className={inp} /></Field>
        </div>
      </Panel>

      <div className="flex gap-3"><SubmitButton>{event ? "Enregistrer" : "Créer l'événement"}</SubmitButton></div>
    </form>
  );
}
