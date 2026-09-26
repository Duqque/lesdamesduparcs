"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, FileText, Paperclip, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Check, Field, inputCls } from "@/components/ui/form";
import { BirthDateInput } from "@/components/forms/BirthDateInput";
import { LocalityFields } from "@/components/forms/LocalityFields";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { cn } from "@/lib/cn";
import { MAX_AUTH_FILE_BYTES, MAX_AUTH_FILES, guardianRelations, isMinor, validateMember, type Guardian, type MemberInput } from "@/lib/members";
import { membership } from "@/data/membership";

const STEP_KEYS: Record<string, number> = {
  firstName: 0, lastName: 0, birthDate: 0, email: 0, phone: 0, line1: 0, postalCode: 0, city: 0, country: 0, password: 0,
  guardianFirstName: 1, guardianLastName: 1, guardianRelation: 1, guardianEmail: 1, guardianPhone: 1, authorization: 1, guardianConsent: 1,
  rules: 2, privacy: 2,
};

/** Aplatit les champs du formulaire vers la structure attendue par le validateur partagé. */
function toInput(v: Record<string, string | boolean>): Partial<MemberInput> {
  const minor = typeof v.birthDate === "string" && isMinor(v.birthDate);
  return {
    firstName: String(v.firstName),
    lastName: String(v.lastName),
    birthDate: String(v.birthDate),
    email: String(v.email),
    phone: String(v.phone),
    address: { line1: String(v.line1), line2: String(v.line2) || undefined, postalCode: String(v.postalCode), city: String(v.city), country: String(v.country) },
    password: String(v.password),
    guardian: minor ? { firstName: String(v.gFirstName), lastName: String(v.gLastName), relation: String(v.gRelation) as Guardian["relation"], email: String(v.gEmail), phone: String(v.gPhone) } : undefined,
    consents: { rules: v.rules === true, privacy: v.privacy === true, image: v.image === true, guardianConsent: v.guardianConsent === true },
  };
}

const ERR_MAP: Record<string, string> = { gFirstName: "guardianFirstName", gLastName: "guardianLastName", gRelation: "guardianRelation", gEmail: "guardianEmail", gPhone: "guardianPhone" };
const FIELD_OF: Record<string, string> = Object.fromEntries(Object.entries(ERR_MAP).map(([k, v]) => [v, k]));

const kb = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} Ko` : `${(n / 1024 / 1024).toFixed(1)} Mo`);

export function InscriptionClient() {
  const router = useRouter();
  const { session, refresh } = useAuth();
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Record<string, string | boolean>>({
    firstName: "", lastName: "", birthDate: "", email: "", phone: "", line1: "", line2: "", postalCode: "", city: "", country: "France", password: "",
    gFirstName: "", gLastName: "", gRelation: "", gEmail: "", gPhone: "",
    guardianConsent: false, rules: false, privacy: false, image: false,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const minor = typeof v.birthDate === "string" && isMinor(v.birthDate);
  const steps = useMemo(() => (minor ? ["Identité", "Autorisation parentale", "Validation"] : ["Identité", "Validation"]), [minor]);
  /** Index logique (0 identité, 1 autorisation, 2 validation) de l'étape affichée. */
  const logical = minor ? step : step === 0 ? 0 : 2;
  const isLast = step === steps.length - 1;

  const set = (k: string, value: string | boolean) => setV((p) => ({ ...p, [k]: value }));
  const text = (k: string) => ({
    value: String(v[k]),
    onChange: (e: { target: { value: string } }) => set(k, e.target.value),
  });
  const err = (k: string) => errors[ERR_MAP[k] ?? k];
  const inv = (k: string) => ({ "aria-invalid": Boolean(err(k)), "aria-describedby": err(k) ? `f-${k}-err` : undefined });

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    const problems: string[] = [];
    for (const f of Array.from(list)) {
      if (!(f.type === "application/pdf" || /\.pdf$/i.test(f.name))) problems.push(`« ${f.name} » n'est pas un PDF.`);
      else if (f.size > MAX_AUTH_FILE_BYTES) problems.push(`« ${f.name} » dépasse 5 Mo.`);
      else if (next.length >= MAX_AUTH_FILES) problems.push(`${MAX_AUTH_FILES} fichiers maximum.`);
      else next.push(f);
    }
    setFiles(next);
    setErrors((p) => {
      const { authorization: _a, ...rest } = p;
      void _a;
      return problems.length ? { ...rest, authorization: problems[0] } : rest;
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  function validate(scope: number | "all") {
    const all = validateMember(toInput(v), files.length);
    return Object.fromEntries(Object.entries(all).filter(([k]) => scope === "all" || STEP_KEYS[k] === scope));
  }

  function next() {
    const found = validate(logical);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`f-${FIELD_OF[Object.keys(found)[0]] ?? Object.keys(found)[0]}`)?.focus();
      return;
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!isLast) return next();
    const found = validate("all");
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Math.min(...Object.keys(found).map((k) => STEP_KEYS[k] ?? 2));
      setStep(minor ? first : first === 0 ? 0 : 1);
      setFormError("Certains champs sont à corriger avant de valider.");
      return;
    }
    setBusy(true);
    setFormError("");
    const input = toInput(v);
    const { password, ...rest } = input;
    void rest;
    const body = new FormData();
    body.set("data", JSON.stringify({ ...input, password }));
    if (minor) files.forEach((f) => body.append("authorization", f));
    try {
      const res = await fetch("/api/members", { method: "POST", body });
      const out = (await res.json()) as { error?: string; errors?: Record<string, string> };
      if (!res.ok) {
        setErrors(out.errors ?? {});
        setFormError(out.error ?? "Inscription impossible pour le moment.");
        if (out.errors) setStep(minor ? Math.min(...Object.keys(out.errors).map((k) => STEP_KEYS[k] ?? 2)) : 0);
        return;
      }
      await refresh();
      router.push("/profil?bienvenue=1");
    } catch {
      setFormError("Inscription impossible. Vérifiez votre connexion et réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const alreadyMember = session.status === "member";

  return (
    <main className="mx-auto max-w-[860px] px-[var(--gutter)] pb-32 pt-[200px] md:pt-[250px]">
      <p className="t-eyebrow">Rejoindre le groupe</p>
      <h1 className="mt-4 t-h1">Devenir membre</h1>
      <p className="mt-5 max-w-xl text-mist t-lead">
        Créez votre compte en quelques minutes : votre carte membre {membership.season}, son QR code de vérification et votre attestation PDF sont générés automatiquement.
      </p>

      {alreadyMember ? (
        <div className="mt-10 rounded-[16px] border border-white/[0.1] bg-[#0b1327]/90 p-7">
          <p className="font-body text-[15.5px] text-white">Vous êtes déjà membre, connectée avec la carte {session.memberNumber}.</p>
          <Link href="/profil" className="mt-4 inline-block font-body text-[14px] text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">Ouvrir mon espace</Link>
        </div>
      ) : (
        <>
          <ol aria-label="Étapes" className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            {steps.map((s, i) => (
              <li key={s} aria-current={i === step ? "step" : undefined} className={cn("flex items-center gap-3 font-body text-[13.5px]", i === step ? "text-white" : "text-white/45")}>
                <span className={cn("grid size-7 place-items-center rounded-full border text-[12px] tabular-nums", i === step ? "border-psg-red-bright bg-psg-red/20" : "border-white/20")}>{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>

          <form onSubmit={submit} noValidate className="mt-8 rounded-[16px] border border-white/[0.1] bg-[#0b1327]/90 p-6 md:p-9">
            {logical === 0 && (
              <fieldset className="grid gap-5 sm:grid-cols-2">
                <legend className="sr-only">Identité et coordonnées</legend>
                <Field id="f-firstName" label="Prénom" error={err("firstName")}>
                  <input id="f-firstName" autoComplete="given-name" className={inputCls} {...text("firstName")} {...inv("firstName")} />
                </Field>
                <Field id="f-lastName" label="Nom" error={err("lastName")}>
                  <input id="f-lastName" autoComplete="family-name" className={inputCls} {...text("lastName")} {...inv("lastName")} />
                </Field>
                <Field id="f-birthDate" label="Date de naissance" error={err("birthDate")} hint="Pour les moins de 18 ans, une autorisation parentale sera demandée.">
                  <BirthDateInput id="f-birthDate" value={String(v.birthDate)} onChange={(iso) => set("birthDate", iso)} invalid={Boolean(err("birthDate"))} describedBy={err("birthDate") ? "f-birthDate-err" : undefined} />
                </Field>
                <Field id="f-phone" label="Téléphone" error={err("phone")}>
                  <PhoneInput id="f-phone" value={String(v.phone)} onChange={(full) => set("phone", full)} invalid={Boolean(err("phone"))} describedBy={err("phone") ? "f-phone-err" : undefined} />
                </Field>
                <Field id="f-email" label="Adresse e-mail" error={err("email")} className="sm:col-span-2" hint="Elle servira d'identifiant de connexion.">
                  <input id="f-email" type="email" autoComplete="email" className={inputCls} {...text("email")} {...inv("email")} />
                </Field>
                <Field id="f-line1" label="Adresse" error={err("line1")} className="sm:col-span-2">
                  <input id="f-line1" autoComplete="address-line1" className={inputCls} {...text("line1")} {...inv("line1")} />
                </Field>
                <Field id="f-line2" label="Complément d'adresse" className="sm:col-span-2">
                  <input id="f-line2" autoComplete="address-line2" className={inputCls} {...text("line2")} />
                </Field>
                <LocalityFields
                  ids={{ postalCode: "f-postalCode", city: "f-city", country: "f-country" }}
                  value={{ postalCode: String(v.postalCode), city: String(v.city), country: String(v.country) }}
                  onChange={(patch) => setV((p) => ({ ...p, ...patch }))}
                  errors={{ postalCode: err("postalCode"), city: err("city"), country: err("country") }}
                />
                <Field id="f-password" label="Mot de passe" error={err("password")} hint="10 caractères minimum, avec des lettres et des chiffres." className="sm:col-span-2">
                  <input id="f-password" type="password" autoComplete="new-password" className={inputCls} {...text("password")} {...inv("password")} />
                </Field>
              </fieldset>
            )}

            {logical === 1 && (
              <fieldset className="grid gap-5 sm:grid-cols-2">
                <legend className="sr-only">Autorisation parentale</legend>
                <p className="sm:col-span-2 text-mist t-small">
                  Vous avez moins de 18 ans : l&rsquo;autorisation d&rsquo;un responsable légal est obligatoire. Téléchargez le{" "}
                  <a href="/api/autorisation-parentale" target="_blank" rel="noreferrer" className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">modèle d&rsquo;autorisation (PDF)</a>, faites-le signer, puis joignez-le ci-dessous.
                </p>
                <Field id="f-gFirstName" label="Prénom du responsable légal" error={err("gFirstName")}>
                  <input id="f-gFirstName" className={inputCls} {...text("gFirstName")} {...inv("gFirstName")} />
                </Field>
                <Field id="f-gLastName" label="Nom du responsable légal" error={err("gLastName")}>
                  <input id="f-gLastName" className={inputCls} {...text("gLastName")} {...inv("gLastName")} />
                </Field>
                <Field id="f-gRelation" label="Lien avec le ou la mineur(e)" error={err("gRelation")}>
                  <select id="f-gRelation" className={inputCls} {...text("gRelation")} {...inv("gRelation")}>
                    <option value="">Choisir…</option>
                    {Object.entries(guardianRelations).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </Field>
                <Field id="f-gPhone" label="Téléphone du responsable" error={err("gPhone")}>
                  <PhoneInput id="f-gPhone" value={String(v.gPhone)} onChange={(full) => set("gPhone", full)} invalid={Boolean(err("gPhone"))} describedBy={err("gPhone") ? "f-gPhone-err" : undefined} />
                </Field>
                <Field id="f-gEmail" label="E-mail du responsable" error={err("gEmail")} className="sm:col-span-2">
                  <input id="f-gEmail" type="email" className={inputCls} {...text("gEmail")} {...inv("gEmail")} />
                </Field>

                <div className="sm:col-span-2">
                  <p className="font-body text-[12.5px] font-medium text-white/80">Autorisation parentale signée (PDF)</p>
                  <input ref={fileRef} id="f-authorization" type="file" accept="application/pdf,.pdf" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
                  <label
                    htmlFor="f-authorization"
                    className={cn(
                      "mt-2 flex cursor-pointer flex-col items-center gap-2 rounded-[12px] border border-dashed px-6 py-8 text-center font-body text-[14px] text-mist transition-colors hover:border-white/40 hover:text-white",
                      errors.authorization ? "border-psg-red-bright/70" : "border-white/25",
                    )}
                  >
                    <Paperclip aria-hidden className="size-6" strokeWidth={1.5} />
                    <span>Choisir un ou plusieurs fichiers PDF</span>
                    <span className="text-[12px] text-mist/80">{MAX_AUTH_FILES} fichiers maximum, 5 Mo chacun</span>
                  </label>
                  {errors.authorization && <p role="alert" className="mt-1.5 font-body text-[12.5px] text-[#ff8b9b]">{errors.authorization}</p>}
                  {files.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {files.map((f, i) => (
                        <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-[10px] border border-white/10 bg-black/20 px-4 py-2.5 font-body text-[13.5px] text-white/90">
                          <FileText aria-hidden className="size-4 shrink-0 text-psg-red-bright" strokeWidth={1.7} />
                          <span className="min-w-0 flex-1 truncate">{f.name}</span>
                          <span className="text-[12px] text-mist">{kb(f.size)}</span>
                          <button type="button" aria-label={`Retirer ${f.name}`} onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="grid size-8 place-items-center rounded-full text-white/60 hover:text-white">
                            <X aria-hidden className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Check id="f-guardianConsent" checked={v.guardianConsent === true} onChange={(b) => set("guardianConsent", b)} error={errors.guardianConsent}>
                    Je certifie que le responsable légal a autorisé cette adhésion et que le document joint est authentique.
                  </Check>
                </div>
              </fieldset>
            )}

            {logical === 2 && (
              <fieldset className="space-y-6">
                <legend className="sr-only">Validation</legend>
                <dl className="divide-y divide-white/10 rounded-[12px] border border-white/10 bg-black/20 font-body text-[14.5px]">
                  {[
                    ["Nom", `${v.firstName} ${v.lastName}`],
                    ["Né(e) le", String(v.birthDate).split("-").reverse().join("/")],
                    ["E-mail", String(v.email)],
                    ["Adresse", `${v.line1}, ${v.postalCode} ${v.city}`],
                    ["Saison", membership.season],
                    ...(minor ? [["Autorisation parentale", `${files.length} fichier(s) PDF`]] : []),
                  ].map(([k, val]) => (
                    <div key={k} className="flex justify-between gap-6 px-5 py-3.5">
                      <dt className="text-mist">{k}</dt>
                      <dd className="text-right text-white">{val}</dd>
                    </div>
                  ))}
                </dl>
                <div className="space-y-4">
                  <Check id="f-rules" checked={v.rules === true} onChange={(b) => set("rules", b)} error={errors.rules}>
                    J&rsquo;ai lu et j&rsquo;accepte le <Link href="/reglement" className="underline underline-offset-4 hover:text-white" target="_blank" rel="noopener">règlement</Link> de l&rsquo;association.
                  </Check>
                  <Check id="f-privacy" checked={v.privacy === true} onChange={(b) => set("privacy", b)} error={errors.privacy}>
                    J&rsquo;ai pris connaissance de la <Link href="/politique-de-confidentialite" className="underline underline-offset-4 hover:text-white" target="_blank" rel="noopener">politique de confidentialité</Link> et j&rsquo;accepte que mes données soient traitées pour la gestion de mon adhésion. Je peux les consulter, les corriger ou les effacer à tout moment depuis <Link href="/mes-donnees" className="underline underline-offset-4 hover:text-white" target="_blank" rel="noopener">Mes données</Link>.
                  </Check>
                  <Check id="f-image" checked={v.image === true} onChange={(b) => set("image", b)}>
                    J&rsquo;autorise l&rsquo;utilisation de mon image lors des événements (facultatif).
                  </Check>
                </div>
                <p className="text-mist t-caption">À la validation, votre numéro de membre, votre carte virtuelle et votre attestation PDF sont créés automatiquement.</p>
              </fieldset>
            )}

            {formError && (
              <p role="alert" className="mt-6 rounded-[10px] border border-psg-red/40 bg-psg-red/10 px-4 py-3 font-body text-[13.5px] text-[#ff9aa8]">
                {formError}
              </p>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              {step > 0 ? (
                <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex h-[54px] items-center justify-center gap-3 rounded-[10px] border border-white/[0.12] bg-[#121417]/90 px-7 font-body text-[15px] font-medium text-white hover:border-white/30">
                  <ArrowLeft aria-hidden className="size-4" /> Retour
                </button>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-[54px] items-center justify-center gap-3 rounded-[10px] border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36_0%,#b30d27_100%)] px-8 font-body text-[15.5px] font-medium text-white transition-[filter] hover:brightness-110 disabled:opacity-60"
              >
                {isLast ? (busy ? "Création de votre carte…" : "Créer mon compte et ma carte") : "Continuer"}
                {!isLast && <ArrowRight aria-hidden className="size-4" />}
              </button>
            </div>
          </form>

          <p className="mt-6 font-body text-[13.5px] text-mist">
            Déjà membre ?{" "}
            <Link href="/connexion" className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">Se connecter</Link>
          </p>
        </>
      )}
    </main>
  );
}
