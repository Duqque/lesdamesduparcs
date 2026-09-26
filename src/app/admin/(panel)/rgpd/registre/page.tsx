import { PageHeader, Panel, TableWrap, Td, Th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { HOST } from "@/lib/legal-info";

export const metadata = { title: "Registre des traitements" };

/** Registre des activités de traitement (article 30 du RGPD), tenu à jour avec le fonctionnement réel du site. */
export default async function RegistryPage() {
  await requireAdmin("privacy.manage");
  const months = (await settings.get()).retention?.inactiveMonths ?? 36;
  const rows: Array<[string, string, string, string, string, string]> = [
    ["Adhésions et comptes", "Gérer les adhésions, cartes de membre, espace personnel", "Contrat", "Identité, coordonnées, date de naissance, adresse, responsable légal, autorisation parentale, consentements", `Durée de l'adhésion + ${months} mois d'inactivité`, "Équipe habilitée ; " + HOST.name],
    ["Événements", "Inscriptions, listes de présence, sécurité", "Contrat ; intérêt légitime", "Identité, coordonnées, contact d'urgence, allergies (facultatif)", "3 ans après l'événement", "Équipe organisatrice ; " + HOST.name],
    ["Boutique et paiements", "Commandes, livraison, comptabilité", "Contrat ; obligation légale", "Contact, adresse, contenu de commande, référence de paiement (aucune donnée bancaire)", "10 ans (pièces comptables, anonymisées sur demande)", "Équipe habilitée ; HelloAsso ; " + HOST.name],
    ["E-mails transactionnels et d'information", "Confirmations, rappels, actualités", "Contrat ; consentement", "Adresse e-mail, objet des messages envoyés", "12 mois (journal)", "Resend (envoi) ; " + HOST.name],
    ["Sécurité du site", "Limiter les abus, détecter les intrusions, tracer les actions sensibles", "Intérêt légitime", "Adresse IP, navigateur, dates de connexion, journal d'audit de l'administration", "90 jours (connexions) ; journal d'audit conservé", "Équipe d'administration ; " + HOST.name],
    ["Statistiques de fréquentation", "Compter les pages vues", "Intérêt légitime", "Pages consultées, sans cookie ni adresse IP ni identifiant", "Agrégées", "Équipe ; " + HOST.name],
    ["Demandes d'exercice de droits", "Répondre aux demandes RGPD", "Obligation légale", "Nom, e-mail, nature de la demande", "3 ans après clôture", "Équipe habilitée ; " + HOST.name],
  ];
  return (
    <>
      <PageHeader title="Registre des traitements" subtitle="Article 30 du RGPD : liste des traitements de données personnelles de l'association, à présenter en cas de contrôle de la CNIL. Transferts hors UE : la Suisse (hébergement) bénéficie d'une décision d'adéquation ; l'envoi d'e-mails (Resend) est encadré par des clauses contractuelles types." />
      <Panel flush>
        <TableWrap>
          <thead><tr><Th>Traitement</Th><Th>Finalité</Th><Th>Base légale</Th><Th>Données</Th><Th>Conservation</Th><Th>Destinataires</Th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="align-top">
                <Td className="font-medium text-white">{r[0]}</Td>
                {r.slice(1).map((c, i) => <Td key={i} className="text-[12.5px] text-mist">{c}</Td>)}
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>
      <Panel title="Mesures de sécurité" className="mt-4">
        <ul className="ml-5 list-disc space-y-1.5 font-body text-[13.5px] text-white/80 marker:text-psg-red-bright">
          <li>HTTPS, en-têtes de sécurité, politique de contenu stricte, cookies protégés.</li>
          <li>Mots de passe chiffrés de façon irréversible ; sessions révocables ; limitation des tentatives.</li>
          <li>Administration : double authentification obligatoire, rôles à privilèges limités, confirmation d&rsquo;identité pour les actions sensibles, journal d&rsquo;audit.</li>
          <li>Fichiers personnels stockés en base de données, jamais accessibles publiquement.</li>
          <li>Effacement et anonymisation à la demande, depuis l&rsquo;espace membre et depuis cette administration.</li>
        </ul>
      </Panel>
    </>
  );
}
