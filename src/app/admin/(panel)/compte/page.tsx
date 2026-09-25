import QRCode from "qrcode";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Field, Flash, PageHeader, Panel, TableWrap, Td, Th, inp } from "@/components/admin/ui";
import { fmtDateTime } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { ROLE_LABELS } from "@/lib/admin/permissions";
import { requireAdmin } from "@/lib/server/admin-auth";
import { adminSessions, settings } from "@/lib/server/admin-store";
import { otpauthUrl } from "@/lib/server/totp";
import { changePasswordAction, disableTotpAction, enableTotpAction, logoutAllAction, startTotpAction } from "./actions";

export const metadata = { title: "Mon compte et sécurité" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin();
  const sp = await searchParams;
  const a = ctx.admin;
  const [sessions, { security }] = await Promise.all([adminSessions.find((x) => x.adminId === a.id), settings.get()]);
  const pending = a.totpSecret && !a.totpEnabled;
  const svg = pending ? await QRCode.toString(otpauthUrl(a.totpSecret!, a.email), { type: "svg", margin: 1, color: { dark: "#050b18", light: "#ffffff" } }) : "";
  return (
    <>
      <PageHeader title="Mon compte et sécurité" subtitle={`${a.firstName} ${a.lastName} · ${ROLE_LABELS[a.role]} · ${a.email}`} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      {security.require2faForSuper && a.role === "super" && !a.totpEnabled && <p className="mb-6 rounded-[10px] border border-amber-400/40 bg-amber-400/10 px-4 py-3 font-body text-[13.5px] text-amber-100">La double authentification est obligatoire pour la super administratrice : activez-la ci-dessous.</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Mot de passe">
          <form action={changePasswordAction} className="grid gap-4">
            <Field label="Mot de passe actuel"><input type="password" name="current" required autoComplete="current-password" className={inp} /></Field>
            <Field label="Nouveau mot de passe" hint="10 caractères minimum, avec des lettres et des chiffres."><input type="password" name="next" required autoComplete="new-password" className={inp} /></Field>
            <Field label="Confirmer"><input type="password" name="confirm" required autoComplete="new-password" className={inp} /></Field>
            <div><SubmitButton>Changer le mot de passe</SubmitButton></div>
          </form>
        </Panel>
        <Panel title="Double authentification (2FA)" action={a.totpEnabled ? <Badge tone="green">Activée</Badge> : <Badge>Désactivée</Badge>}>
          {a.totpEnabled ? (
            <form action={disableTotpAction} className="grid gap-4">
              <p className="font-body text-[13.5px] text-mist">Un code à 6 chiffres est demandé à chaque connexion.</p>
              <Field label="Mot de passe (pour désactiver)"><input type="password" name="password" required className={inp} /></Field>
              <div><SubmitButton variant="danger" confirm="Désactiver la double authentification ?">Désactiver</SubmitButton></div>
            </form>
          ) : pending ? (
            <div className="grid gap-4">
              <div className="w-[190px] overflow-hidden rounded-[10px] bg-white p-2" dangerouslySetInnerHTML={{ __html: svg }} />
              <p className="break-all font-body text-[12px] text-mist">Clé de saisie manuelle : <span className="text-white">{a.totpSecret}</span></p>
              <form action={enableTotpAction} className="flex gap-2"><input name="code" inputMode="numeric" placeholder="Code à 6 chiffres" className={inp} required /><SubmitButton>Activer</SubmitButton></form>
            </div>
          ) : (
            <form action={startTotpAction} className="grid gap-4">
              <p className="font-body text-[13.5px] text-mist">Protégez votre compte avec une application d&rsquo;authentification (Google Authenticator, 1Password, Authy…).</p>
              <div><SubmitButton>Configurer la 2FA</SubmitButton></div>
            </form>
          )}
        </Panel>
      </div>
      <Panel className="mt-4" title="Connexions et sessions" flush>
        <div className="border-b border-line px-5 py-4 font-body text-[13.5px] text-mist">Dernière connexion : {a.lastLoginAt ? `${fmtDateTime(a.lastLoginAt)} depuis ${a.lastLoginIp}` : "première connexion"}. Expiration après {security.sessionTimeoutMin} minutes d&rsquo;inactivité.</div>
        <TableWrap>
          <thead><tr><Th>Session</Th><Th>Adresse IP</Th><Th>Dernière activité</Th></tr></thead>
          <tbody>{sessions.map((x) => <tr key={x.id}><Td>{x.id === ctx.sessionId ? <Badge tone="green">Cette session</Badge> : <span className="text-mist">{x.ua.slice(0, 40) || "Autre appareil"}</span>}</Td><Td>{x.ip}</Td><Td className="tabular-nums">{fmtDateTime(x.lastSeen)}</Td></tr>)}</tbody>
        </TableWrap>
        <form action={logoutAllAction} className="border-t border-line p-5"><SubmitButton variant="danger" confirm="Fermer toutes vos sessions, y compris celle-ci ?">Me déconnecter de toutes les sessions</SubmitButton></form>
      </Panel>
    </>
  );
}
